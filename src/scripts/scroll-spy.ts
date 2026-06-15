const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav-link'));
const ids = [...new Set(links.map((link) => link.dataset.spy))].filter((id): id is string =>
  Boolean(id),
);
const sections = ids
  .map((id) => document.getElementById(id))
  .filter((el): el is HTMLElement => el !== null);

const setActive = (id: string) => {
  links.forEach((link) => link.classList.toggle('is-active', link.dataset.spy === id));
};

const update = () => {
  if (sections.length === 0) return;
  // The activation line glides from the top of the viewport at the top of the page
  // down to the bottom at the end, so the highlight tracks scroll progress and the
  // final sections stay reachable. The active section is the last whose top has
  // crossed the line, which means it always straddles the line and is on screen.
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
  const line = window.innerHeight * progress;
  let current = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= line) current = section;
  }
  setActive(current.id);
};

let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    update();
    ticking = false;
  });
};

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
update();
