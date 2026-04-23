const ENDPOINT = import.meta.env.PUBLIC_ANALYTICS_ENDPOINT || '';

interface EventPayload {
  event: string;
  path: string;
  timestamp: number;
  [key: string]: unknown;
}

function send(payload: EventPayload): void {
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
    // analytics must never surface to the user
  }
}

function trackPageView(): void {
  send({
    event: 'page_view',
    path: window.location.pathname,
    referrer: document.referrer,
    timestamp: Date.now(),
  });
}

function trackOutboundClicks(): void {
  document.addEventListener('click', (e) => {
    const anchor = (e.target as Element).closest('a[href]');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || !href.startsWith('http') || href.includes(window.location.hostname)) return;

    send({
      event: 'outbound_click',
      path: window.location.pathname,
      timestamp: Date.now(),
      href,
    });
  });
}

trackPageView();
trackOutboundClicks();
