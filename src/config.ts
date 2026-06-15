// Site identity and social-unfurl text. URLs derive from Astro.site (the canonical
// origin authority); don't duplicate the origin here.
export const site = {
  name: 'Taylor Silenzio',
  role: 'Software Engineer',
  availability: 'Seeking full-time roles',
  bio: 'I build tools and infrastructure. Backend systems, developer tooling, and what Rust can do in the places I used to reach for Node.',
  title: 'Taylor Silenzio',
  description:
    'Software engineer building Node.js backends and the developer tooling around them. Writing Rust on the side and bringing it to work piece by piece.',
  ogTitle: 'Taylor Silenzio | backend · tools · rust',
  ogImage: '/og.png',
  locale: 'en_US',
  github: 'https://github.com/tsilenzio',
  linkedin: 'https://linkedin.com/in/tsilenzio',
} as const;
