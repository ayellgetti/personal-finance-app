---
name: short
description: "Give the shortest answer that still solves the request."
disable-model-invocation: true
---

# /short

Give the shortest answer that still solves the request.

Prefer:
- bullets
- direct recommendations
- minimal explanation

Do not omit critical warnings or constraints.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/short.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
