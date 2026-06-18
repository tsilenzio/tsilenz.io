// Site identity and social-unfurl text. URLs derive from Astro.site (the canonical
// origin authority); don't duplicate the origin here.
export const site = {
  name: 'Taylor Silenzio',
  role: 'Software Engineer',
  availability: 'Seeking full-time roles',
  bio: 'Backend systems and developer tooling, built for the parts of production that have to hold. Lately, more of it in Rust.',
  title: 'Taylor Silenzio',
  description:
    'Software engineer building Node.js backends and the developer tooling around them. Writing Rust on the side and bringing it to work piece by piece.',
  ogTitle: 'Taylor Silenzio | backend · tools · rust',
  ogImage: '/og.png',
  locale: 'en_US',
  github: 'https://github.com/tsilenzio',
  linkedin: 'https://linkedin.com/in/tsilenzio',
} as const;
