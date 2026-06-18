// Site identity and social-unfurl text. URLs derive from Astro.site (the canonical
// origin authority); don't duplicate the origin here.
export const site = {
  name: 'Taylor Silenzio',
  role: 'Senior Software Engineer',
  availability: 'Seeking full-time roles',
  bio: 'Backend systems and developer tooling, built for the parts of production that have to hold. Lately, more of it in Rust.',
  title: 'Taylor Silenzio',
  description:
    'Software engineer building backend systems, real-time pipelines, and the developer tooling around them. Increasingly Rust, after years of Node and TypeScript.',
  ogTitle: 'Taylor Silenzio | backend · tools · rust',
  ogImage: '/og.png',
  locale: 'en_US',
  github: 'https://github.com/tsilenzio',
  linkedin: 'https://linkedin.com/in/tsilenzio',
  resume: '/Taylor-Silenzio-Resume.pdf',
} as const;
