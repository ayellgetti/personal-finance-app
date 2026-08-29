---
name: acceptance
description: "Create acceptance criteria that can be objectively tested."
disable-model-invocation: true
---

# /acceptance

Create acceptance criteria that can be objectively tested.

Prefer Given/When/Then for complex behavior.

Cover:
- happy path
- validation
- permissions
- errors
- edge cases

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/acceptance.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
