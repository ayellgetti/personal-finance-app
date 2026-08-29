---
name: mvp
description: "Reduce the requested product scope to the smallest useful version."
disable-model-invocation: true
---

# /mvp

Reduce the requested product scope to the smallest useful version.

Identify:
- must-have
- should-have
- later
- explicitly out of scope

Optimize for validating the core user value quickly.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/mvp.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
