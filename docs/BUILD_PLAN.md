# Build plan: setting up the portfolio repo with Claude Code

This file is for Claude Code. Copy it into the repo at `docs/BUILD_PLAN.md`. Then run one phase per session: paste the phase prompt in **plan mode** (Shift+Tab), check the plan, approve it, and check the "done when" list before you commit.

The order follows Andrey's priority: build the foundations, then a vertical slice of the easter egg, then the main story.

---

## Target architecture

A pnpm workspace with one Angular app and two framework-free TypeScript packages. The creative engine (dither, game) does not depend on Angular, so it can be reused, tested on its own, or moved to another framework later without a rewrite.

```
personal-site/
├─ apps/
│  └─ site/                  Angular app (SSG, zoneless, signals). Pages, story acts, overlays.
├─ packages/
│  ├─ dither/                Palettes, Bayer matrices, GLSL dither pass for three.js, 2D canvas helpers.
│  └─ game/                  The easter egg: game loop, input, player, boss, scenes (three.js).
│                            Has its own Vite playground for fast iteration outside the site.
├─ art/                      Source art (Aseprite, Blender, concept images). Tracked with Git LFS.
├─ docs/                     BUILD_PLAN.md, decisions (ADR) files.
├─ e2e/                      Playwright smoke tests.
├─ .claude/                  Agents, skills, settings (already prepared).
├─ .github/workflows/        CI: lint, test, build, e2e, Lighthouse.
├─ CLAUDE.md  PRODUCT.md  DESIGN.md
├─ package.json  pnpm-workspace.yaml  tsconfig.base.json  .nvmrc  .editorconfig
```

Rules for every phase. Phase 1 adds them to CLAUDE.md.

1. `packages/*` never import Angular. `apps/site` imports `@site/game` **only** through a dynamic `import()` so normal visitors download zero game bytes.
2. Browser-only code (window, canvas, WebGL, GSAP, Lenis) runs in `afterNextRender` or behind `isPlatformBrowser`. The site is prerendered, so that code must never run on the server.
3. One source of truth for colours: `packages/dither/src/palettes.ts`. The site's CSS tokens are generated from it.
4. Performance budgets are enforced in CI. Initial JS stays under 150 kB gzipped, and Lighthouse performance, accessibility and SEO each stay at 95 or above on the home page.
5. Every animation respects `prefers-reduced-motion`. Every flashing effect stays under 3 flashes per second.

---

## Phase 0: what Andrey does by hand first (no Claude Code)

1. Install Node.js LTS (via `nvm` or `fnm`), pnpm (`corepack enable`), Git, Git LFS (`git lfs install`), VS Code, and the Claude Code VS Code extension.
2. Clone `github.com/AndreyLouppe/personal-site` and open it in VS Code.
3. Copy the prepared setup from the project files (`personal-site-setup/`: `.claude/`, `CLAUDE.md`, `skills-lock.json`, `docs/BUILD_PLAN.md`) into the repo root. Commit it: `chore: add Claude Code setup`.
4. Start Claude Code in the repo and run `/model` to check that `opusplan` is active.

---

## Phase 1: workspace and Angular app

Paste in plan mode:

```text
Read CLAUDE.md and docs/BUILD_PLAN.md (section "Target architecture"). Set up the workspace exactly as described there.

1. pnpm workspace at the root: package.json (private, "packageManager" field), pnpm-workspace.yaml (apps/*, packages/*), tsconfig.base.json with path aliases @site/dither and @site/game, .nvmrc (current Node LTS), .editorconfig, .gitignore, .gitattributes (Git LFS for the art/ folder only, by extension: *.aseprite, *.blend, *.psd, *.png, *.jpg, *.webp).
2. Create the Angular app in apps/site with the angular-new-app skill. Use the latest stable Angular, standalone, zoneless, SCSS, Vitest for unit tests, SSR with outputMode "static" (prerender every route). Configure the Angular CLI to use pnpm.
3. Create packages/dither and packages/game as TypeScript packages (ESM, "exports" field, strict TS, Vitest). packages/game gets a Vite dev playground (index.html + src/playground.ts) runnable with `pnpm --filter @site/game dev`. Each package exports one placeholder function with a test.
4. Prove the wiring: the home page imports a value from @site/dither statically, and lazy-loads @site/game with a dynamic import() inside a button click handler, logging the placeholder result. Confirm in the build output that the game ends up in a separate lazy chunk.
5. ESLint (angular-eslint for the app, typescript-eslint for packages) and Prettier at the root. Root scripts: dev, build, test, lint, format, e2e, and game:dev.
6. Update CLAUDE.md: the real commands, the architecture tree, and the five "rules for every phase" from docs/BUILD_PLAN.md. Add "Bash(pnpm:*)" and "Bash(npx playwright:*)" to .claude/settings.json allow list.

Delegate the scaffolding to the implementer agent once I approve the plan. Do not add libraries beyond Angular, TypeScript tooling, Vite and Vitest in this phase.
```

**Done when:** `pnpm install`, `pnpm lint`, `pnpm test` and `pnpm build` all pass. `pnpm dev` serves the site. `pnpm game:dev` serves the playground. The build output shows a separate chunk for the game. CLAUDE.md lists the real commands.

Commit: `chore: scaffold pnpm workspace, Angular app and engine packages`.

---

## Phase 2: quality gates and CI

```text
Add the quality gates from docs/BUILD_PLAN.md rules 1 and 4. The static build is in apps/site/dist/site/browser.

1. Static checks: a root `typecheck` script (tsc --noEmit for each package, including the game playground) and a `format:check` script (prettier --check .).
2. Bundle budgets, in two layers:
   - apps/site/angular.json: raw-size budgets as a backstop (Angular measures raw bytes, not gzip; today 234 kB raw is 65 kB gzipped). Pick warning/error values from that ratio and explain them.
   - scripts/check-bundle-size.mjs (Node built-ins only, zlib): gzips the initial chunks the browser loads from index.html and fails above 150 kB, warns above 100 kB. Run it after build as `pnpm size`.
3. Playwright in e2e/ (root devDependencies, Chromium only, webServer serving apps/site/dist/site/browser with a small static server such as sirv-cli). Tests:
   - smoke: the prerendered home page has the right title and h1, no console errors, and no console warnings starting with "NG0" (hydration problems).
   - accessibility: @axe-core/playwright finds no violations on the home page.
   - lazy game (rule 1 at runtime): no request for the game chunk on load; clicking "Load game" fetches it.
   Script: pnpm e2e (build, then run Playwright). Include e2e/ in ESLint and give it a tsconfig.
4. GitHub Actions .github/workflows/ci.yml on pull requests and pushes to main: pnpm/action-setup (reads packageManager), setup-node with node-version-file .nvmrc and pnpm cache, pnpm install --frozen-lockfile, then format:check, lint, typecheck, test, build, size, e2e (cache the Playwright browsers, install with --with-deps chromium), and Lighthouse CI with @lhci/cli (lighthouserc.json: staticDistDir, numberOfRuns 3, median assertions: performance, accessibility, best-practices, seo >= 0.95). permissions: contents: read; a concurrency group that cancels older runs on the same ref.
5. A pull request template in .github/pull_request_template.md: what, why, how verified, screenshots.
6. Add "Bash(pnpm exec playwright:*)" to the .claude/settings.json allow list, plus the new scripts (typecheck, format:check, size). Update the commands in CLAUDE.md.

New dependencies allowed in this phase: @playwright/test, @axe-core/playwright, sirv-cli, @lhci/cli. Nothing else.
Use the implementer agent, then code-reviewer.
```

**Done when:** every new script passes locally. A test PR shows all checks green. A deliberately broken test makes CI fail, and you then revert it. Then, in GitHub (by hand): Settings → Branches → protect `main` and mark the CI job as a required check, or green checks will not block a merge.

---

## Phase 3: deployment

```text
Set up static deployment on Cloudflare Pages for apps/site (prerendered output folder). Write docs/deploy.md with the exact steps I must do in the Cloudflare dashboard (connect the GitHub repo, build command, output directory, Node version env var) and what you configured in the repo (e.g. _headers for caching and security headers, _redirects if needed, a 404 page). Preview deployments on every PR, production on main.
Do not create any account or secret yourself. List what I must click.
```

**Done when:** the main branch is live on a `*.pages.dev` URL, and a PR gets its own preview URL. (A custom domain can come later.)

Andrey does the dashboard part by hand, following `docs/deploy.md`.

---

## Phase 4: design foundations

```text
Run /impeccable init. Use these inputs for PRODUCT.md and DESIGN.md:
- Concept: an evolving scrollytelling portfolio. It starts grey and 1-bit, becomes colourful retro web, then a textureless "what AI builds" page, then Andrey's rebuild ("what AI won't"), then a clean white UI with fine dither, then a futuristic act. One art direction throughout: dither.
- Hidden easter egg after the end: red cyber-horror pixel art, strict 4-colour palette #0d0000 #5c0f1c #c41634 #ecb27c.
- Goals: convey craftsmanship, creativity and end-to-end web knowledge (design, UI/UX, front, back, SEO, marketing). Every effect must have a plain-language reason.

Then create packages/dither/src/palettes.ts as the single source of truth for every act's palette (placeholders where undecided, marked TODO) and a small script (pnpm tokens) that generates apps/site/src/styles/_tokens.scss with CSS custom properties from it. Wire the script into build.
```

**Done when:** PRODUCT.md and DESIGN.md exist and read right to you. Changing a colour in `palettes.ts` and running `pnpm tokens` updates the site's CSS.

---

## Phase 5: the dither engine

```text
Build packages/dither, framework-free, with tests:
1. Bayer matrices (2x2, 4x4, 8x8) and a palette-quantisation helper (nearest colour in a palette, in linear or OKLab space; explain which you chose).
2. A three.js post-processing pass (DitherPass) that maps the rendered frame to a given palette with ordered dither, with uniforms for palette, matrix size, pixel size (render-resolution scale) and an intensity. Use three.js's current recommended post-processing approach and say which.
3. A 2D canvas helper for DOM-side effects: dithered colour splashes at a point (for the Act 1 cursor interactions), with a reduced-motion variant.
4. A playground page in the game's Vite playground (or a second playground) showing a rotating three.js shape through DitherPass with live controls for palette and pixel size.
three.js is allowed as a peer dependency of packages/dither and a dependency of packages/game.
```

**Done when:** the playground shows a crisp 4-colour dithered 3D shape, changing pixel size looks intentional at every value, and tests pass.

---

## Phase 6: easter egg vertical slice (milestones 1 and 2)

```text
Read the "Easter egg" plan (sections 2, 5 and 7) summarised here:
- Trigger: at the bottom of the site, about 3 seconds or ~15 attempts of scrolling that goes nowhere (wheel, trackpad, touch pull). A footer hint.
- Dialogue in the site UI: "Why do you keep scrolling?" ... "Are you sure?" [Yes] [No, take me back] ... a sword made of pixels, [Take it]. Then a flashing-effects warning with [Continue] [Reduce effects].
- Game: hybrid view, hard, playable on mobile in landscape only (portrait shows "Turn your screen. If you dare.").

Build, in this order:
A. apps/site: an EasterEggTrigger service (browser-only) and an EasterEggOverlay component for the dialogue, using signals. Prefetch @site/game during the dialogue with a dynamic import. Respect reduced motion. Keyboard and screen-reader accessible dialogue.
B. packages/game: public API mountGame(canvas, options) -> { pause(), resume(), destroy() } with callbacks onWin/onLose/onExit. A fixed-timestep loop (60 Hz logic, render on requestAnimationFrame), an input layer mapping keyboard, touch (virtual stick + 2 buttons) and Gamepad API to actions, an orthographic isometric camera, a greybox arena (tile grid), and a player with move, dodge roll with invincibility frames, stamina, light attack. No boss yet: a training dummy. Run it through DitherPass with the 4-colour palette.
C. apps/site: an EasterEggHost component that mounts the game full-screen after the dialogue, handles the landscape gate and orientation changes, and calls destroy() on exit.
Write unit tests for the loop timing, the input mapping and the stamina rules. Add a Playwright test for the trigger and dialogue (not the gameplay).
```

**Done when:** on desktop and on a phone in landscape you can trigger the egg, read the dialogue, take the sword, and move, dodge and hit a dummy at a steady 60 fps. The home page's initial JS has not grown. This is the moment to judge **feel**. Iterate on speeds and timings before any art.

---

## Phase 7 and after (one /feature each)

Use `/feature <description>` from the prepared skill for each one:

1. The boss brain: a typed state machine (idle, telegraph, attack, recover, choose), seeded randomness, phase 1 with two attacks.
2. The descent cinematic: scroll-driven first-person corridor, camera move into the isometric view.
3. The rest of the attacks, phases 2 and 3, the death screen and the win ending.
4. Polish: sound (Web Audio, opt-in), the reduce-effects mode, gamepad, the share card.
5. Optional backend (hall of fame, hit counter, guestbook): Cloudflare Pages Functions + D1. Write an ADR in docs/ before starting.
6. Then the main story acts, one per feature, starting with the hook and Act 1.

Write a short ADR (`docs/adr/NNN-title.md`: context, decision, consequences) for every decision you'd want to remember in six months: workspace layout, Angular, Cloudflare, post-processing approach, backend.
