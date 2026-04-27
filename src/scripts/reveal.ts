const VISIBILITY_THRESHOLD = 0.1;
const ROOT_MARGIN = '0px';

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }
  },
  { rootMargin: ROOT_MARGIN, threshold: VISIBILITY_THRESHOLD },
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
