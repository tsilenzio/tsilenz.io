export {};

declare global {
  interface Window {
    __toggleTheme?: () => void;
  }
}

const STORAGE_KEY = 'theme';

type Theme = 'dark' | 'light';

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getStoredTheme(): Theme | null {
  const theme = localStorage.getItem(STORAGE_KEY);
  return theme === 'dark' || theme === 'light' ? theme : null;
}

function currentTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle('light', theme === 'light');

  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
  document.querySelectorAll('[data-theme-toggle]').forEach((toggle) => {
    toggle.setAttribute('aria-label', label);
  });
}

function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

function toggle(): void {
  const current: Theme = document.documentElement.classList.contains('light') ? 'light' : 'dark';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function init(): void {
  applyTheme(currentTheme());

  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (!getStoredTheme()) applyTheme(getSystemTheme());
  });

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      applyTheme(currentTheme());
    }
  });
}

window.__toggleTheme = toggle;

init();
