import type { Project } from '@/types';

// Canonical project list (reconciles the earlier v1/v2 drift to the v2 design: trimmed
// tech tags, v2 ordering). slug doubles as the project-<slug> analytics label.
export const projects: Project[] = [
  {
    slug: 'whoami-tsilenz-io',
    title: 'whoami.tsilenz.io',
    description:
      'An SSH server that identifies visitors by their public keys against GitHub. Connect and see what it knows about you.',
    status: 'in-progress',
    tech: ['Rust', 'SSH', 'PostgreSQL', 'GitHub API'],
    // Repo is private (closed source for the project's life), so there's no source
    // link. The card jumps to the live ssh box in About instead. See ProjectCard's
    // in-page anchor handling.
    href: '#try-ssh',
  },
  {
    slug: 'trace',
    title: 'trace',
    description:
      'The analytics behind this site. First-party cookie tracking, GeoIP enrichment, engagement timelines, and a live dashboard that is public to browse with identifying fields masked.',
    status: 'active',
    tech: ['Rust', 'axum', 'TimescaleDB', 'PostGIS'],
    href: 'https://trace.tsilenz.io',
  },
  {
    slug: 'diorama',
    title: 'diorama',
    description:
      'TUI tool for previewing terminal color themes with realistic scenarios. See how your colors actually look before committing.',
    status: 'active',
    tech: ['Rust', 'ratatui', 'crossterm', 'clap', 'TUI'],
    href: 'https://github.com/tsilenzio/diorama',
  },
  {
    slug: 'rune-keychain',
    title: 'rune-keychain',
    description:
      'A keychain utility built in Rust. Secure credential storage with a clean CLI interface.',
    status: 'on-hold',
    tech: ['Rust', 'macOS Keychain', 'CLI'],
    href: 'https://github.com/tsilenzio/rune-keychain',
  },
  {
    slug: 'homelab',
    title: 'homelab',
    description:
      'Single-node Proxmox homelab managed through Terraform and pyinfra. The disposable-rootfs pattern was validated by a live destroy-and-rebuild, with stateful workloads surviving untouched on ZFS.',
    status: 'active',
    tech: ['Terraform', 'pyinfra', 'Python', 'Proxmox'],
    href: 'https://github.com/tsilenzio/homelab',
  },
  {
    slug: 'dotfiles',
    title: 'dotfiles',
    description:
      'Bundle-based macOS bootstrap with hierarchical encrypted secrets. Age/SOPS keys unlock via Touch ID through macOS Keychain, and the system is rebuildable from a single memorable password.',
    status: 'active',
    tech: ['Bash', 'age/SOPS', 'GPG', 'macOS'],
    href: 'https://github.com/tsilenzio/dotfiles',
  },
  {
    slug: 'tsilenz-io',
    title: 'tsilenz.io',
    description:
      'The site you are on. Static-first with a dark/light theme, blog infrastructure, and an embedded analytics beacon that talks to trace.',
    status: 'active',
    tech: ['Astro', 'TypeScript', 'Tailwind'],
    href: 'https://github.com/tsilenzio/tsilenz.io',
  },
  {
    slug: 'tokify',
    title: 'tokify',
    description:
      'Cross-platform token counter for GPT models. Counts tokens per-file and across entire directories.',
    status: 'active',
    tech: ['Go', 'tiktoken', 'CLI'],
    href: 'https://github.com/tsilenzio/tokify',
  },
];
