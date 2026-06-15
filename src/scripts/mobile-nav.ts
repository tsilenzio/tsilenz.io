// Mobile dropdown menu toggle (below sm).
const navToggle = document.getElementById('mobile-nav-toggle');
const mobileNav = document.getElementById('mobile-nav');
if (navToggle && mobileNav) {
  const setOpen = (open: boolean) => {
    navToggle.setAttribute('aria-expanded', String(open));
    mobileNav.classList.toggle('hidden', !open);
  };
  navToggle.addEventListener('click', () =>
    setOpen(navToggle.getAttribute('aria-expanded') !== 'true'),
  );
  mobileNav
    .querySelectorAll('a')
    .forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
}
