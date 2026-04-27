export {};

declare global {
  interface Document {
    prerendering?: boolean;
  }
}

const ENDPOINT = import.meta.env.PUBLIC_ANALYTICS_ENDPOINT || '';

const HEARTBEAT_MS = 15_000;
const SESSION_IDLE_MS = 30 * 60 * 1000;
const HOVER_THRESHOLD_MS = 300;
const HOVER_THROTTLE_MS = 5_000;
const SESSION_KEY = 'trace_session';

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
  referrer?: string;
  destination?: string;
  element_id?: string;
  duration_ms?: number;
  viewport_pct?: number;
  screen_w?: number;
  screen_h?: number;
  viewport_w?: number;
  viewport_h?: number;
  tz_offset?: number;
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

function basePayload(eventType: EventType): EventPayload {
  return {
    event_type: eventType,
    session_id: ensureSessionId(),
    client_ts: Date.now(),
    path: window.location.pathname,
    referrer: document.referrer || undefined,
    screen_w: window.screen?.width,
    screen_h: window.screen?.height,
    viewport_w: window.innerWidth,
    viewport_h: window.innerHeight,
    tz_offset: new Date().getTimezoneOffset(),
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
      fetch(ENDPOINT, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        keepalive: true,
      });
    }
  } catch {
    // analytics must never surface to the user
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

    if (!href || !href.startsWith('http') || href.includes(window.location.hostname)) return;
    send({
      ...basePayload('outbound_click'),
      destination: href,
    });
  });
}

function trackPageLeave(): void {
  const fire = () => send(basePayload('page_leave'));
  window.addEventListener('pagehide', fire);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') fire();
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
  trackPageView();
  trackClicks();
  trackPageLeave();
  trackHovers();
  trackSectionViews();
  startHeartbeat();
}

if (document.prerendering) {
  document.addEventListener('prerenderingchange', boot, { once: true });
} else {
  boot();
}
