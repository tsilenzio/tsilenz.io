export const MARKER = '[..]';

export function stripWww(host: string): string {
  return host.indexOf('www.') === 0 ? host.slice(4) : host;
}

export function normalizeHost(host: string): string {
  const stripped = stripWww(host);
  if (
    stripped === 'localhost' ||
    stripped === '127.0.0.1' ||
    stripped === '0.0.0.0' ||
    stripped === '[::1]'
  ) {
    return 'tsilenz.io';
  }
  return stripped;
}

export function truncateMiddle(s: string, max: number): string {
  if (s.length <= max) return s;
  const keep = max - MARKER.length;
  const left = Math.ceil(keep / 2);
  const right = Math.floor(keep / 2);
  return s.slice(0, left) + MARKER + s.slice(s.length - right);
}

export interface PageContext {
  path: string;
  rawHost: string;
  hostname: string;
  url: string;
}

export function getPageContext(): PageContext {
  const params = new URLSearchParams(window.location.search);
  const path = params.get('path') || window.location.pathname;
  const rawHost = params.get('hostname') || window.location.hostname;
  const hostname = normalizeHost(rawHost);
  const url = hostname + path;
  return { path, rawHost, hostname, url };
}

export function initMagicPill(group: HTMLElement, linkSelector = '.hit, .hit-wide'): void {
  const pill = group.querySelector<HTMLElement>('.pill');
  if (!pill) return;
  const links = group.querySelectorAll<HTMLElement>(linkSelector);
  if (links.length === 0) return;

  group.dataset.magic = 'active';

  let visible = false;
  let leaveTimer: number | null = null;

  function setPill(target: HTMLElement, skipSlide: boolean) {
    if (leaveTimer) {
      window.clearTimeout(leaveTimer);
      leaveTimer = null;
    }
    const targetRect = target.getBoundingClientRect();
    const groupRect = group.getBoundingClientRect();
    const extendX = 8;
    const extendY = 5;
    const top = targetRect.top - groupRect.top - extendY;
    const left = targetRect.left - groupRect.left - extendX;
    const width = targetRect.width + extendX * 2;
    const height = targetRect.height + extendY * 2;
    pill!.style.transition = skipSlide ? 'opacity 120ms ease' : '';
    pill!.style.transform = `translate(${left}px, ${top}px)`;
    pill!.style.width = `${width}px`;
    pill!.style.height = `${height}px`;
    pill!.setAttribute('data-active', 'true');
    visible = true;
  }

  function hidePill() {
    pill!.removeAttribute('data-active');
    visible = false;
  }

  links.forEach((link) => {
    link.addEventListener('mouseenter', () => setPill(link, !visible));
    link.addEventListener('focus', () => setPill(link, !visible));
  });

  group.addEventListener('mouseleave', () => {
    if (leaveTimer) window.clearTimeout(leaveTimer);
    leaveTimer = window.setTimeout(hidePill, 60);
  });

  group.addEventListener('focusout', (e: FocusEvent) => {
    if (!group.contains(e.relatedTarget as Node | null)) {
      if (leaveTimer) window.clearTimeout(leaveTimer);
      leaveTimer = window.setTimeout(hidePill, 60);
    }
  });
}
