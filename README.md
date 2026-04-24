# tsilenz.io

Source for my personal homepage at [tsilenz.io](https://tsilenz.io). Built with Astro, Tailwind v4, and TypeScript. The goal is a page that loads fast, reads easily, and doesn't overreach. No sparkles, no cursor trails, no portfolio showmanship.

## Stack

- **Astro** for the page shell and routing
- **Tailwind CSS v4** for styles (theme defined inline in `src/styles/global.css`, no config file)
- **MDX** for blog posts when those start landing
- **TypeScript** in strict mode
- **pnpm** as the package manager, **mise** for the Node version

No frontend framework on the homepage itself. Astro components, a bit of vanilla TypeScript for the small interactive pieces (theme toggle, scroll reveal). The blog is wired up but empty. Posts come whenever they come.

## Develop

```sh
pnpm install
pnpm dev       # localhost:4321
pnpm build     # static build into ./dist
pnpm preview
```

Checks before opening a PR:

```sh
pnpm typecheck
pnpm lint
pnpm format
```

Formatting, linting, and commit-message conventions are also enforced via `lefthook` pre-commit and `cocogitto` commit-msg hooks, so most of this runs automatically on commit.

## Design notes

The look borrows from a handful of personal sites I spent time reading: [robdahl.dev](https://www.robdahl.dev), [jasonwebb.io](https://www.jasonwebb.io), [brianlovin.com/about](https://brianlovin.com/about), [soulwire.co.uk](https://soulwire.co.uk). Anything clean here is by way of one of them. Anything clumsy is mine.

Dark by default, light on request, persisted across tabs. Reduced-motion respected.

## License

[MIT](./LICENSE)
