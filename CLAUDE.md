# Personal site: how Claude works here

Portfolio site for Andrey, a front-oriented full-stack Angular developer. The site itself is the showcase: design quality, performance and accessibility matter as much as features.

## Stack

- pnpm workspace (pnpm 12, Node 26, see `.nvmrc`). Angular 22 (standalone, zoneless, signals, new control flow, SCSS, OnPush), prerendered (SSG, `outputMode: "static"`) and deployed as a static site.
- TypeScript is pinned to `~6.0.3`: Angular 22 requires `>=6.0 <6.1` and typescript-eslint requires `<6.1`. Do not upgrade to TS 7 until both support it.
- Unit tests use Vitest everywhere. Lint is one root flat `eslint.config.js`. Format is Prettier.

### Commands (run from the repo root)

| Command         | What it does                                                                        |
| --------------- | ----------------------------------------------------------------------------------- |
| `pnpm install`  | Install all workspace dependencies                                                  |
| `pnpm dev`      | Angular dev server for `apps/site`                                                  |
| `pnpm build`    | Production build + prerender of `apps/site` (output: `apps/site/dist/site/browser`) |
| `pnpm test`     | Run unit tests in every workspace project                                           |
| `pnpm lint`     | ESLint on the whole repo                                                            |
| `pnpm format`   | Prettier write on the whole repo                                                    |
| `pnpm e2e`      | Placeholder until Phase 2 (Playwright)                                              |
| `pnpm game:dev` | Vite playground for `packages/game`                                                 |

### Architecture

```
apps/site/        Angular app (SSG, zoneless, signals). Pages, story acts, overlays.
packages/dither/  Palettes, Bayer matrices, dither pass, 2D canvas helpers. Framework-free.
packages/game/    The easter egg (game loop, input, player, boss, scenes). Framework-free, own Vite playground.
art/              Source art (Aseprite, Blender, concepts). Tracked with Git LFS.
docs/             BUILD_PLAN.md, decisions (ADR).
e2e/              Playwright smoke tests (Phase 2).
```

Packages expose their TypeScript source (`"exports": { ".": "./src/index.ts" }`); the aliases `@site/dither` and `@site/game` are in `tsconfig.base.json`.

### Rules for every phase

1. `packages/*` never import Angular (enforced by ESLint). `apps/site` imports `@site/game` **only** through a dynamic `import()` so normal visitors download zero game bytes.
2. Browser-only code (window, canvas, WebGL, GSAP, Lenis) runs in `afterNextRender` or behind `isPlatformBrowser`. The site is prerendered, so that code must never run on the server.
3. One source of truth for colours: `packages/dither/src/palettes.ts`. The site's CSS tokens are generated from it.
4. Performance budgets are enforced in CI. Initial JS stays under 150 kB gzipped, and Lighthouse performance, accessibility and SEO each stay at 95 or above on the home page.
5. Every animation respects `prefers-reduced-motion`. Every flashing effect stays under 3 flashes per second.

## Model routing (Claude Pro: keep Opus usage for what needs it)

The default model is `opusplan`: Opus while planning (plan mode), Sonnet while executing. Delegate to the cheapest agent that can do the job.

| Work                                                                    | Who                       | Model  |
| ----------------------------------------------------------------------- | ------------------------- | ------ |
| Architecture, plans, design direction, `/impeccable` work, final review | Main session in plan mode | Opus   |
| Implementing an agreed plan or component                                | `implementer`             | Sonnet |
| Unit and component tests                                                | `test-writer`             | Sonnet |
| Reviewing a diff before commit                                          | `code-reviewer`           | Sonnet |
| Copy, alt text, meta tags, i18n strings, typos                          | `content-editor`          | Haiku  |
| Accessibility pass on templates                                         | `a11y-checker`            | Haiku  |
| Commit messages, changelog, PR descriptions                             | `release-scribe`          | Haiku  |
| Finding files or answering "where is X"                                 | built-in `Explore`        | Haiku  |

Rules:

- Plan in plan mode first (Shift+Tab), then hand the plan to `implementer`. Do not let Opus write routine code.
- Give every subagent a self-contained brief: goal, files to touch, files not to touch, how to verify.
- Run independent subagents in parallel (e.g. `test-writer` and `content-editor`).
- Anything visual goes through `/impeccable` (critique, polish, audit) in the main session, never through a Haiku agent.
- Use `/feature <description>` for the full plan, build, test, review loop.

## Design

- Impeccable is installed in `.claude/skills/impeccable`. Run `/impeccable init` once to create PRODUCT.md and DESIGN.md, then keep them current.
- Commands are `/impeccable <command> <target>`, for example `/impeccable critique src/app/home`.

## Conventions

- One component per folder, `OnPush` by default, signals for state, no NgModules.
- Accessibility: semantic HTML first, every image has alt text, visible focus, respects `prefers-reduced-motion`.
- Never commit secrets. `.env*` files are not read by agents.
