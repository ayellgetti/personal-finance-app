---
name: backend
description: "Focus only on backend work unless the user explicitly requests full-stack changes."
disable-model-invocation: true
---

# /backend

Focus only on backend work unless the user explicitly requests full-stack changes.

Inspect and follow existing:
- architecture
- routes
- services/use cases
- models/data access
- validation
- authentication/authorization
- Prisma/database access
- logging
- error handling
- tests

Do not modify frontend code unnecessarily.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/backend.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
