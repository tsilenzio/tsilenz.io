import type { SocialLink } from '@/types';
import { site } from '@/config';

export const socials: SocialLink[] = [
  { href: site.github, label: 'GitHub', icon: 'github' },
  { href: site.linkedin, label: 'LinkedIn', icon: 'linkedin' },
];
