// Analytics beacon stub
// Fires events to a configurable endpoint. Currently a noop.
// Wire this up to the real analytics service when it's ready.

const ENDPOINT = import.meta.env.PUBLIC_ANALYTICS_ENDPOINT || '';

interface EventPayload {
  event: string;
  path: string;
  referrer: string;
  timestamp: number;
  [key: string]: unknown;
}

function send(payload: EventPayload) {
  if (!ENDPOINT) return;

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, JSON.stringify(payload));
    } else {
      fetch(ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      });
    }
  } catch {
    // silent fail
  }
}

function trackPageView() {
  send({
    event: 'page_view',
    path: window.location.pathname,
    referrer: document.referrer,
    timestamp: Date.now(),
  });
}

function trackOutboundClicks() {
  document.addEventListener('click', (e) => {
    const anchor = (e.target as Element).closest('a[href]');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || !href.startsWith('http') || href.includes(window.location.hostname)) return;

    send({
      event: 'outbound_click',
      path: window.location.pathname,
      referrer: '',
      timestamp: Date.now(),
      href,
    });
  });
}

trackPageView();
trackOutboundClicks();
