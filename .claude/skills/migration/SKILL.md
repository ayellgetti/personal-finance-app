---
name: migration
description: "Focus on safe database/schema migrations."
disable-model-invocation: true
---

# /migration

Focus on safe database/schema migrations.

Check:
- data preservation
- data transformation
- locking/downtime
- backwards compatibility
- indexes
- constraints
- deployment order
- rollback/recovery

For production changes, prefer expand-and-contract patterns when appropriate.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/migration.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
