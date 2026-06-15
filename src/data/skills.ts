import type { SkillCategory } from '@/types';

// Within each category, ordered by signal strength (Rust/Go lead Languages, etc.).
export const skillCategories: SkillCategory[] = [
  {
    name: 'Languages',
    items: ['Rust', 'Go', 'TypeScript', 'JavaScript', 'Python', 'C#', 'Java', 'SQL', 'Bash', 'Lua'],
  },
  {
    name: 'Infrastructure & Cloud',
    items: [
      'Docker',
      'Linux',
      'Kubernetes',
      'Terraform',
      'GCP',
      'Serverless',
      'Nginx',
      'OpenResty',
      'CI/CD',
    ],
  },
  {
    name: 'Data & Messaging',
    items: ['PostgreSQL', 'MongoDB', 'Redis', 'BigQuery', 'Pub/Sub', 'RabbitMQ', 'Elasticsearch'],
  },
  {
    name: 'Frameworks & APIs',
    items: ['Node.js', 'NestJS', 'GraphQL', 'REST', 'WebRTC', 'React.js', 'Flutter'],
  },
];
