export type ProjectStatus = 'active' | 'in-progress' | 'on-hold' | 'planned';

// Badge variants are the project statuses plus the terminal's "experimental" tag.
export type BadgeVariant = ProjectStatus | 'experimental';

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: 'Active',
  'in-progress': 'In Progress',
  'on-hold': 'On Hold',
  planned: 'Planned',
};

export interface Project {
  // Also the analytics trace suffix (project-<slug>); keep stable, beacon.ts depends on it.
  slug: string;
  title: string;
  description: string;
  status: ProjectStatus;
  tech: string[];
  href?: string;
}

export interface Job {
  company: string;
  role: string;
  // Earlier titles held at the same company, most-recent-first, rendered muted beneath
  // the current role. The resume and LinkedIn carry the per-title dates; the site shows
  // only the overall tenure range.
  priorRoles?: string[];
  period: string;
  description: string;
}

export interface SkillCategory {
  name: string;
  items: string[];
}

export interface SocialLink {
  href: string;
  label: string;
  icon: 'github' | 'linkedin';
}

export interface NavItem {
  id: string;
  label: string;
}
