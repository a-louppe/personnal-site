# Personal site: how Claude works here

Portfolio site for Andrey, a front-oriented full-stack Angular developer. The site itself is the showcase: design quality, performance and accessibility matter as much as features.

## Stack

- Angular (latest), standalone components, signals, new control flow, SCSS.
- Prerendered (SSG) and deployed as a static site.
- The app is not scaffolded yet. Use the `angular-new-app` skill to create it, then update this section with the real commands.

## Model routing (Claude Pro: keep Opus usage for what needs it)

The default model is `opusplan`: Opus while planning (plan mode), Sonnet while executing. Delegate to the cheapest agent that can do the job.

| Work | Who | Model |
| --- | --- | --- |
| Architecture, plans, design direction, `/impeccable` work, final review | Main session in plan mode | Opus |
| Implementing an agreed plan or component | `implementer` | Sonnet |
| Unit and component tests | `test-writer` | Sonnet |
| Reviewing a diff before commit | `code-reviewer` | Sonnet |
| Copy, alt text, meta tags, i18n strings, typos | `content-editor` | Haiku |
| Accessibility pass on templates | `a11y-checker` | Haiku |
| Commit messages, changelog, PR descriptions | `release-scribe` | Haiku |
| Finding files or answering "where is X" | built-in `Explore` | Haiku |

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
