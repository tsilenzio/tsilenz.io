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
const SESSION_KEY = 'trace_session';
const ID_MAX_AGE_SECS = 2 * 365 * 24 * 60 * 60;

type EventType =
  | 'page_view'
  | 'page_away'
  | 'page_return'
  | 'page_closed'
  | 'outbound_click'
  | 'internal_click'
  | 'hover'
  | 'section_view'
  | 'heartbeat';

interface EventPayload {
  event_type: EventType;
  session_id: string;
  // Client-minted visitor id, sent in every payload. trace adopts it when no
  // valid tid cookie accompanies the request.
  client_id: string;
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
    // Fresh cookie read per event: a racing tab adopts the winning id, and a
    // cookie-blocked client stays coherent on the module-held one.
    client_id: readIdCookie() ?? visitorId,
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

// Visitor identity. Minted here before the first event, so every request in a page
// load carries the same id no matter how the cookie behaves (the old server-mint
// model raced its Set-Cookie against early sends and fragmented first visits).
// The cookie persists it across visits and tabs. trace re-issues it in every
// response, which keeps Safari's ~7-day cap on script-written cookies from
// shortening it.
let visitorId = '';

function readIdCookie(): string | null {
  const m = document.cookie.match(/(?:^|; )tid=([^;]*)/);
  return m ? m[1] : null;
}

function writeIdCookie(id: string): void {
  // Domain-scoped so the cookie rides to trace.tsilenz.io. Host-only on localhost.
  const host = location.hostname;
  const domain = host.includes('.') ? `; domain=${host.split('.').slice(-2).join('.')}` : '';
  const secure = location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `tid=${id}; path=/; max-age=${ID_MAX_AGE_SECS}; samesite=lax${domain}${secure}`;
}

// RFC 9562 UUIDv7: 48-bit ms timestamp, then version and variant bits over
// randomness. Time-ordered like the ids trace used to mint.
function uuidv7(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  let ts = Date.now();
  for (let i = 5; i >= 0; i--) {
    b[i] = ts % 256;
    ts = Math.floor(ts / 256);
  }
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function initVisitorId(): Promise<void> {
  const existing = readIdCookie();
  if (existing) {
    visitorId = existing;
    return;
  }
  const mint = () => {
    // Re-check inside the lock: a sibling tab may have minted while we waited.
    const won = readIdCookie();
    visitorId = won ?? uuidv7();
    if (!won) writeIdCookie(visitorId);
  };
  if (navigator.locks?.request) {
    await navigator.locks.request('trace-id', { mode: 'exclusive' }, async () => mint());
  } else {
    mint();
  }
}

function trackPageView(): void {
  send(basePayload('page_view'));
}

function trackClicks(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as Element | null;
    if (!target) return;

    const labelEl = target.closest<HTMLElement>('[data-trace-event]');
    const anchor = target.closest<HTMLAnchorElement>('a[href]');
    const href = anchor?.getAttribute('href') ?? undefined;

    if (labelEl) {
      send({
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
    send({
      ...basePayload('outbound_click'),
      destination: href,
    });
  });
}

// Lifecycle on two axes. Hidden/unhidden: page_away when visibility is lost
// (tab switch, minimize, bfcache suspension), page_return when it comes back,
// including a bfcache revival, which restores the page without a new load so no
// page_view fires. Open/close: page_closed only when pagehide reports the
// instance actually destroyed (close, navigation, reload); a bfcache suspension
// is just a deep away that may return. `away` makes the pair alternate strictly,
// so a close reads as one away plus one closed. A browser can still kill a
// hidden tab with no pagehide at all (mobile), so a session ending in page_away
// with no page_closed is not proof the tab stayed open.
function trackLifecycle(): void {
  let away = false;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (!away) {
        away = true;
        send(basePayload('page_away'));
      }
    } else if (away) {
      away = false;
      send(basePayload('page_return'));
    }
  });

  window.addEventListener('pagehide', (e) => {
    if (!e.persisted) send(basePayload('page_closed'));
  });

  window.addEventListener('pageshow', (e) => {
    // Only bfcache restores matter (a fresh load already sent page_view), and
    // only when the hidden state is still latched from before the suspension.
    if (e.persisted && away) {
      away = false;
      send(basePayload('page_return'));
    }
  });
}

function startHeartbeat(): void {
  let timer: ReturnType<typeof setInterval> | null = null;

  const tick = () => {
    if (document.visibilityState === 'visible') send(basePayload('heartbeat'));
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
          send({
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

      send({
        ...basePayload('hover'),
        element_id: el.dataset.traceEvent,
        duration_ms: duration,
      });
    });
  });
}

function boot(): void {
  // One-time tidy: the retired establish handshake's localStorage flag.
  try {
    localStorage.removeItem('trace_established');
  } catch {
    // storage unavailable, nothing to clean
  }
  // The id must exist before the first event. The lock is local, so this
  // resolves in microseconds.
  void initVisitorId().then(() => {
    trackPageView();
    trackClicks();
    trackLifecycle();
    trackHovers();
    trackSectionViews();
    startHeartbeat();
  });
}

if (document.prerendering) {
  document.addEventListener('prerenderingchange', boot, { once: true });
} else {
  boot();
}
