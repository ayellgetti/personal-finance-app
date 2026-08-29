---
name: edgecases
description: "Look specifically for cases that could break the proposed solution."
disable-model-invocation: true
---

# /edgecases

Look specifically for cases that could break the proposed solution.

Consider:
- empty/null input
- duplicate data
- invalid states
- concurrent requests
- retries
- partial failures
- time zones/dates
- permissions
- large inputs
- deleted/missing resources
- backwards compatibility

Rank important edge cases by impact.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/edgecases.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
