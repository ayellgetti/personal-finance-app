---
name: schema
description: "Design or review the database schema."
disable-model-invocation: true
---

# /schema

Design or review the database schema.

Check:
- entities
- relationships
- constraints
- indexes
- uniqueness
- nullability
- timestamps
- soft-delete requirements
- transaction boundaries
- migration safety
- query patterns

Do not add fields without a requirement or clear data need.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/schema.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
