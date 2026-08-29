---
name: prisma
description: "Focus on Prisma implementation details."
disable-model-invocation: true
---

# /prisma

Focus on Prisma implementation details.

Check:
- schema correctness
- relations
- indexes
- constraints
- migrations
- transaction usage
- query shape
- N+1 queries
- generated client usage
- production migration safety

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/prisma.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
