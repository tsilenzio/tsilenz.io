export const MARKER = '[..]';

const HIDE_DELAY_MS = 60;
const SKIP_SLIDE_DURATION_MS = 120;
const PILL_EXTEND_X = 8;
const PILL_EXTEND_Y = 5;
const MEASURE_SAMPLE_SIZE = 100;

export function stripWww(host: string): string {
  return host.startsWith('www.') ? host.slice(4) : host;
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

export interface StatusInfo {
  status: number;
  rustCode: string;
  errorPhrase: string;
  rustTrailLabel: string;
  manSubject: string;
  manNameDesc: string;
  exitLabel: string;
}

const STATUS_TABLE: Record<number, Omit<StatusInfo, 'status'>> = {
  403: {
    rustCode: 'E0403',
    errorPhrase: 'access denied for page',
    rustTrailLabel: 'denied in this site',
    manSubject: 'FORBIDDEN',
    manNameDesc: 'access denied',
    exitLabel: 'Forbidden',
  },
  404: {
    rustCode: 'E0404',
    errorPhrase: 'cannot find page',
    rustTrailLabel: 'not found in this site',
    manSubject: 'NOTFOUND',
    manNameDesc: 'page that does not exist',
    exitLabel: 'Not Found',
  },
  410: {
    rustCode: 'E0410',
    errorPhrase: 'page is gone',
    rustTrailLabel: 'gone from this site',
    manSubject: 'GONE',
    manNameDesc: 'page is no longer available',
    exitLabel: 'Gone',
  },
  500: {
    rustCode: 'E0500',
    errorPhrase: 'thread panicked while serving',
    rustTrailLabel: 'panicked in this site',
    manSubject: 'PANIC',
    manNameDesc: 'thread panicked',
    exitLabel: 'Internal Server Error',
  },
  503: {
    rustCode: 'E0503',
    errorPhrase: 'service unavailable for',
    rustTrailLabel: 'unavailable in this site',
    manSubject: 'UNAVAILABLE',
    manNameDesc: 'service unavailable',
    exitLabel: 'Service Unavailable',
  },
};

export function getStatusInfo(status: number): StatusInfo {
  const entry =
    STATUS_TABLE[status] ??
    ({
      rustCode: `E${status}`,
      errorPhrase: 'error serving page',
      rustTrailLabel: 'error in this site',
      manSubject: 'ERROR',
      manNameDesc: 'error serving page',
      exitLabel: 'Error',
    } satisfies Omit<StatusInfo, 'status'>);
  return { status, ...entry };
}

export interface PageContext {
  path: string;
  rawHost: string;
  hostname: string;
  url: string;
  status: number;
  statusInfo: StatusInfo;
}

export function getPageContext(): PageContext {
  const params = new URLSearchParams(window.location.search);
  const path = params.get('path') || window.location.pathname;
  const rawHost = params.get('hostname') || window.location.hostname;
  const hostname = normalizeHost(rawHost);
  const url = hostname + path;
  const parsed = Number(params.get('status'));
  const status = Number.isFinite(parsed) && parsed > 0 ? parsed : 404;
  return { path, rawHost, hostname, url, status, statusInfo: getStatusInfo(status) };
}

export function initMagicPill(group: HTMLElement, linkSelector = '.hit, .hit-wide'): void {
  const pill = group.querySelector<HTMLElement>('.pill');
  if (!pill) return;
  const links = group.querySelectorAll<HTMLElement>(linkSelector);
  if (links.length === 0) return;

  group.dataset.magic = 'active';

  let visible = false;
  let leaveTimer: number | null = null;

  const setPill = (target: HTMLElement, skipSlide: boolean): void => {
    if (leaveTimer) {
      window.clearTimeout(leaveTimer);
      leaveTimer = null;
    }
    const targetRect = target.getBoundingClientRect();
    const groupRect = group.getBoundingClientRect();
    const top = targetRect.top - groupRect.top - PILL_EXTEND_Y;
    const left = targetRect.left - groupRect.left - PILL_EXTEND_X;
    const width = targetRect.width + PILL_EXTEND_X * 2;
    const height = targetRect.height + PILL_EXTEND_Y * 2;
    pill.style.transition = skipSlide ? `opacity ${SKIP_SLIDE_DURATION_MS}ms ease` : '';
    pill.style.transform = `translate(${left}px, ${top}px)`;
    pill.style.width = `${width}px`;
    pill.style.height = `${height}px`;
    pill.setAttribute('data-active', 'true');
    visible = true;
  };

  const hidePill = (): void => {
    pill.removeAttribute('data-active');
    visible = false;
  };

  links.forEach((link) => {
    link.addEventListener('mouseenter', () => setPill(link, !visible));
    link.addEventListener('focus', () => setPill(link, !visible));
  });

  group.addEventListener('mouseleave', () => {
    if (leaveTimer) window.clearTimeout(leaveTimer);
    leaveTimer = window.setTimeout(hidePill, HIDE_DELAY_MS);
  });

  group.addEventListener('focusout', (e: FocusEvent) => {
    if (!group.contains(e.relatedTarget as Node | null)) {
      if (leaveTimer) window.clearTimeout(leaveTimer);
      leaveTimer = window.setTimeout(hidePill, HIDE_DELAY_MS);
    }
  });
}

export function measureContainerChars(container: HTMLElement): number {
  const test = document.createElement('span');
  test.textContent = '0'.repeat(MEASURE_SAMPLE_SIZE);
  test.style.position = 'absolute';
  test.style.visibility = 'hidden';
  test.style.whiteSpace = 'pre';
  const computed = getComputedStyle(container);
  test.style.fontFamily = computed.fontFamily;
  test.style.fontSize = computed.fontSize;
  test.style.fontWeight = computed.fontWeight;
  container.appendChild(test);
  const charWidth = test.getBoundingClientRect().width / MEASURE_SAMPLE_SIZE;
  container.removeChild(test);

  const padLeft = parseFloat(computed.paddingLeft) || 0;
  const padRight = parseFloat(computed.paddingRight) || 0;
  const contentWidth = container.clientWidth - padLeft - padRight;
  return Math.max(1, Math.floor(contentWidth / charWidth));
}

export function buildAlignedLine(
  width: number,
  left: string,
  center: string,
  right: string,
): string {
  const contentLen = left.length + center.length + right.length;
  let gaps = width - contentLen;
  if (gaps < 2) gaps = 2;
  const gap1 = ' '.repeat(Math.floor(gaps / 2));
  const gap2 = ' '.repeat(gaps - Math.floor(gaps / 2));
  return left + gap1 + center + gap2 + right;
}
