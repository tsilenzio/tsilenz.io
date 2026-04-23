const STORAGE_KEY = 'theme';
const TS_KEY = 'theme_ts';
const WINDOW_MS = 30 * 60 * 1000;

type Theme = 'dark' | 'light';

function now(): number {
  return Date.now();
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function readStored(): Theme | null {
  const theme = localStorage.getItem(STORAGE_KEY);
  const tsStr = localStorage.getItem(TS_KEY);
  const ts = tsStr ? parseInt(tsStr, 10) : 0;
  if (theme !== 'dark' && theme !== 'light') return null;
  if (!ts || now() - ts > WINDOW_MS) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TS_KEY);
    return null;
  }
  return theme;
}

function currentTheme(): Theme {
  return readStored() ?? getSystemTheme();
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle('light', theme === 'light');

  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  }
}

function refreshTs(): void {
  if (localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(TS_KEY, String(now()));
  }
}

function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
  localStorage.setItem(TS_KEY, String(now()));
  applyTheme(theme);
}

function toggle(): void {
  const current: Theme = document.documentElement.classList.contains('light') ? 'light' : 'dark';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function init(): void {
  applyTheme(currentTheme());
  refreshTs();

  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (!readStored()) applyTheme(getSystemTheme());
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshTs();
  });

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === TS_KEY || e.key === null) {
      applyTheme(currentTheme());
    }
  });
}

(window as any).__toggleTheme = toggle;

init();
