import type { Job } from '@/types';

export const jobs: Job[] = [
  {
    company: 'Keller Williams Realty',
    role: 'Senior Software Engineer',
    period: '2019 — May 2026',
    description:
      'Built event-driven data pipelines, real-time notification systems, and cross-platform services for a consumer real estate platform serving 180K+ agents. Wrote a translation sync CLI in Go, then rewrote it in Rust.',
  },
  {
    company: 'Apricity Health',
    role: 'Senior Software Engineer',
    period: '2018 — 2019',
    description:
      'Designed a distributed tracing and logging system for healthcare microservices, correlating frontend and backend events across dozens of cloud functions.',
  },
  {
    company: 'Genband',
    role: 'Senior Software Engineer',
    period: '2016 — 2018',
    description:
      'Architected and led a full application rewrite from Angular to React for a unified communications platform, designing the component architecture and WebRTC integration.',
  },
  {
    company: 'Yashi',
    role: 'Senior Software Engineer',
    period: '2013 — 2016',
    description:
      'Pitched and built an API-first architecture to consolidate two platforms under a 90-day deadline, then designed role-based access control and unified authentication from scratch.',
  },
];
