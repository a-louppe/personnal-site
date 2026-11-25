---
name: feature
description: Run the full plan, build, test, review loop for one feature of the portfolio site, routing each step to the cheapest capable model.
argument-hint: "<feature description>"
disable-model-invocation: true
---

Build this feature: $ARGUMENTS

1. **Plan (Opus, main session).** Read CLAUDE.md, PRODUCT.md and DESIGN.md if they exist. Use the built-in `Explore` agent for any codebase lookups. Write a short plan: goal, files to create or change, design notes, how to verify. If the feature is visual and has no agreed direction yet, run `/impeccable shape` first. Show the plan and wait for approval.
2. **Build (Sonnet).** Hand the approved plan to the `implementer` agent. If the public API is clear, start `test-writer` in parallel; otherwise run it after.
3. **Text (Haiku).** If the feature has user-facing copy, alt text or meta tags, hand those to `content-editor`.
4. **Check.** Run `code-reviewer` and `a11y-checker` in parallel on the diff. Fix blocking findings with `implementer`, at most two rounds.
5. **Polish (Opus).** For visual work, run `/impeccable critique` on the changed components, then `/impeccable polish` on what it flags.
6. **Wrap up (Haiku).** Ask `release-scribe` for the commit message and summarise what was done, what was verified, and anything left open.
