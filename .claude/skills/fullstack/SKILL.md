---
name: fullstack
description: "Coordinate a complete backend + frontend implementation."
disable-model-invocation: true
---

# /fullstack

Coordinate a complete backend + frontend implementation.

First establish the contract:
- data model
- API
- validation
- authorization
- frontend states

Then implement backend and frontend consistently.

Verify:
- API contract matches frontend usage
- validation is consistent
- errors are handled
- tests cover important flows

Avoid unrelated changes.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/fullstack.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
