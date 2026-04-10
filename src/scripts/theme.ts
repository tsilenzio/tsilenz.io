const STORAGE_KEY = 'theme';

type Theme = 'dark' | 'light';

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return null;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('light', theme === 'light');

  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  }
}

function init() {
  const theme = getStoredTheme() ?? getSystemTheme();
  applyTheme(theme);

  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (!getStoredTheme()) {
      applyTheme(getSystemTheme());
    }
  });
}

function toggle() {
  const current = document.documentElement.classList.contains('light') ? 'light' : 'dark';
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(STORAGE_KEY, next);
  applyTheme(next);
}

(window as any).__toggleTheme = toggle;

init();
