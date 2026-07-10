export {};

declare global {
  interface Document {
    prerendering?: boolean;
  }
  // Non-standard navigator fields (Chromium): present at runtime, absent from lib.dom.
  interface Navigator {
    deviceMemory?: number;
    connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean };
  }
}

const ENDPOINT = import.meta.env.PUBLIC_ANALYTICS_ENDPOINT || '';

const HEARTBEAT_MS = 15_000;
const SESSION_IDLE_MS = 30 * 60 * 1000;
const HOVER_THRESHOLD_MS = 300;
const HOVER_THROTTLE_MS = 5_000;
const ESTABLISH_TIMEOUT_MS = 5_000;
const SESSION_KEY = 'trace_session';
const ESTABLISHED_KEY = 'trace_established';

type EventType =
  | 'page_view'
  | 'page_leave'
  | 'outbound_click'
  | 'internal_click'
  | 'hover'
  | 'section_view'
  | 'heartbeat';

interface EventPayload {
  event_type: EventType;
  session_id: string;
  client_ts: number;
  path: string;
  page_title?: string;
  referrer?: string;
  query?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  destination?: string;
  element_id?: string;
  duration_ms?: number;
  viewport_pct?: number;
  screen_w?: number;
  screen_h?: number;
  viewport_w?: number;
  viewport_h?: number;
  tz_offset?: number;
  // Passive client signals.
  language?: string;
  languages?: string[];
  platform?: string;
  hardware_concurrency?: number;
  device_memory?: number;
  max_touch_points?: number;
  color_depth?: number;
  pixel_ratio?: number;
  prefers_color_scheme?: string;
  prefers_reduced_motion?: boolean;
  connection_type?: string;
  conn_downlink?: number;
  conn_rtt?: number;
  save_data?: boolean;
  client_time_zone?: string;
  extra?: Record<string, unknown>;
}

interface SessionRecord {
  id: string;
  lastEventTs: number;
}

function loadSession(): SessionRecord | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.id === 'string' && typeof parsed?.lastEventTs === 'number') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function saveSession(rec: SessionRecord): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(rec));
  } catch {
    // sessionStorage can be unavailable (Safari private mode, quota exceeded)
  }
}

function ensureSessionId(): string {
  const now = Date.now();
  const existing = loadSession();
  if (existing && now - existing.lastEventTs <= SESSION_IDLE_MS) {
    saveSession({ id: existing.id, lastEventTs: now });
    return existing.id;
  }
  const id = crypto.randomUUID();
  saveSession({ id, lastEventTs: now });
  return id;
}

// Passive device signals: no-permission attributes the browser exposes for free,
// snapshotted once since they hold for the page's lifetime. They strengthen returning-visitor
// correlation server-side, where the trace schema already has a column for each.
let passiveSignals: Partial<EventPayload> | undefined;

function collectPassiveSignals(): Partial<EventPayload> {
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    language: navigator.language || undefined,
    languages: navigator.languages?.length ? [...navigator.languages] : undefined,
    platform: navigator.platform || undefined,
    hardware_concurrency: navigator.hardwareConcurrency || undefined,
    device_memory: navigator.deviceMemory,
    max_touch_points: navigator.maxTouchPoints,
    color_depth: window.screen?.colorDepth,
    pixel_ratio: window.devicePixelRatio,
    prefers_color_scheme: dark ? 'dark' : 'light',
    prefers_reduced_motion: reduced,
    connection_type: navigator.connection?.effectiveType,
    conn_downlink: navigator.connection?.downlink,
    conn_rtt: navigator.connection?.rtt,
    save_data: navigator.connection?.saveData,
    client_time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
  };
}

function basePayload(eventType: EventType): EventPayload {
  const params = new URLSearchParams(window.location.search);
  passiveSignals ??= collectPassiveSignals();
  return {
    event_type: eventType,
    session_id: ensureSessionId(),
    client_ts: Date.now(),
    path: window.location.pathname,
    page_title: document.title || undefined,
    referrer: document.referrer || undefined,
    query: window.location.search.slice(1) || undefined,
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    screen_w: window.screen?.width,
    screen_h: window.screen?.height,
    viewport_w: window.innerWidth,
    viewport_h: window.innerHeight,
    tz_offset: new Date().getTimezoneOffset(),
    ...passiveSignals,
  };
}

function send(payload: EventPayload): void {
  if (!ENDPOINT) return;

  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(ENDPOINT, blob);
    } else {
      // The surrounding catch only sees sync throws, so failures land here.
      fetch(ENDPOINT, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // analytics must never surface to the user
  }
}

// Cold-start identity handshake. trace mints the visitor id server-side and returns it in the
// Set-Cookie on the first cookie-less request, so several first-contact requests racing out
// before that cookie commits (multiple tabs opening at once) each get their own id. We buffer
// events until one establishing request has committed the cookie, coordinating across tabs with
// the Web Locks API so exactly one tab establishes. The flag is a JS-visible marker only. The id
// itself stays in the HttpOnly cookie and is never read or sent by the client.
let established = false;
const buffer: EventPayload[] = [];

function flagSet(): boolean {
  try {
    return localStorage.getItem(ESTABLISHED_KEY) !== null;
  } catch {
    return false;
  }
}

function setFlag(): void {
  try {
    localStorage.setItem(ESTABLISHED_KEY, '1');
  } catch {
    // localStorage can be unavailable (Safari private mode, quota), in which case the handshake reruns
  }
}

function record(payload: EventPayload): void {
  if (established) send(payload);
  else buffer.push(payload);
}

function flush(): void {
  while (buffer.length > 0) {
    const payload = buffer.shift();
    if (payload) send(payload);
  }
}

// Awaitable variant of send()'s fetch path: sendBeacon can't be awaited and we need to know
// when Set-Cookie: tid has committed. Bounded by a timeout so a stalled network can't hold the
// lock (and keep every tab buffering) for the browser's full network timeout.
async function establishSend(payload: EventPayload): Promise<boolean> {
  if (!ENDPOINT) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ESTABLISH_TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive: true,
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function establish(): Promise<void> {
  const critical = async (): Promise<void> => {
    // A sibling tab already committed the cookie, so just go live and flush our own buffer.
    if (flagSet()) {
      established = true;
      return;
    }
    // The page_view is buffered like everything else (uniform record routing), so promote the
    // first buffered event to the establishing send rather than minting a second page_view.
    const first = buffer.shift() ?? basePayload('page_view');
    const ok = await establishSend(first);
    if (ok) setFlag();
    // Failed or timed out: requeue so flush()/unload still sends it cookie-less (fold-reconciled).
    else buffer.unshift(first);
    established = true;
  };

  if (navigator.locks?.request) {
    await navigator.locks.request('trace-establish', { mode: 'exclusive' }, critical);
  } else {
    await critical();
  }

  flush();
}

function trackPageView(): void {
  record(basePayload('page_view'));
}

function trackClicks(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as Element | null;
    if (!target) return;

    const labelEl = target.closest<HTMLElement>('[data-trace-event]');
    const anchor = target.closest<HTMLAnchorElement>('a[href]');
    const href = anchor?.getAttribute('href') ?? undefined;

    if (labelEl) {
      record({
        ...basePayload('internal_click'),
        element_id: labelEl.dataset.traceEvent,
        destination: href,
      });
      return;
    }

    if (!href || !href.startsWith('http')) return;
    // A URL that merely contains this hostname (tsilenz.io.evil.com, or the name
    // in a path) still counts as outbound. Subdomains stay internal.
    let external: boolean;
    try {
      const target = new URL(href).hostname;
      const here = window.location.hostname;
      external = target !== here && !target.endsWith(`.${here}`);
    } catch {
      return;
    }
    if (!external) return;
    record({
      ...basePayload('outbound_click'),
      destination: href,
    });
  });
}

function trackPageLeave(): void {
  // page_leave fires at unload, when there's no time to wait on the handshake, so it force-sends
  // (bypassing record) and drains any still-buffered events first. If the cookie hasn't committed
  // yet, these go out cookie-less as orphans the trace fold reconciles, rather than being lost.
  const fire = () => {
    flush();
    send(basePayload('page_leave'));
  };
  window.addEventListener('pagehide', fire);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') fire();
  });
}

function startHeartbeat(): void {
  let timer: ReturnType<typeof setInterval> | null = null;

  const tick = () => {
    if (document.visibilityState === 'visible') record(basePayload('heartbeat'));
  };

  const start = () => {
    if (timer === null) timer = setInterval(tick, HEARTBEAT_MS);
  };

  const stop = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') start();
    else stop();
  });

  if (document.visibilityState === 'visible') start();
}

function trackSectionViews(): void {
  const sections = document.querySelectorAll<HTMLElement>('[data-trace-section]');
  if (sections.length === 0) return;

  type State = { enteredAt: number; maxRatio: number };
  const state = new WeakMap<HTMLElement, State>();

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const current = state.get(el);

        if (entry.isIntersecting) {
          if (current) {
            current.maxRatio = Math.max(current.maxRatio, entry.intersectionRatio);
          } else {
            state.set(el, { enteredAt: Date.now(), maxRatio: entry.intersectionRatio });
          }
        } else if (current) {
          record({
            ...basePayload('section_view'),
            element_id: el.dataset.traceSection,
            duration_ms: Date.now() - current.enteredAt,
            viewport_pct: Math.round(current.maxRatio * 100),
          });
          state.delete(el);
        }
      }
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] },
  );

  sections.forEach((el) => observer.observe(el));
}

function trackHovers(): void {
  const elements = document.querySelectorAll<HTMLElement>('[data-trace-event]');
  if (elements.length === 0) return;

  const lastFiredAt = new WeakMap<HTMLElement, number>();
  const enteredAt = new WeakMap<HTMLElement, number>();

  elements.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      enteredAt.set(el, Date.now());
    });

    el.addEventListener('mouseleave', () => {
      const start = enteredAt.get(el);
      if (start === undefined) return;
      enteredAt.delete(el);

      const duration = Date.now() - start;
      if (duration < HOVER_THRESHOLD_MS) return;

      const last = lastFiredAt.get(el) ?? 0;
      const now = Date.now();
      if (now - last < HOVER_THROTTLE_MS) return;
      lastFiredAt.set(el, now);

      record({
        ...basePayload('hover'),
        element_id: el.dataset.traceEvent,
        duration_ms: duration,
      });
    });
  });
}

function boot(): void {
  // Set before the track* calls so record() routes correctly. Returning visitors (flag set) send
  // live and skip the lock and buffer entirely. trackPageView runs first so the page_view is
  // buffer[0] and the handshake promotes it as the establishing send.
  established = flagSet();
  trackPageView();
  trackClicks();
  trackPageLeave();
  trackHovers();
  trackSectionViews();
  startHeartbeat();
  if (!established) void establish();
}

if (document.prerendering) {
  document.addEventListener('prerenderingchange', boot, { once: true });
} else {
  boot();
}
