---
name: new-schema
description: "Make a database schema change safely through the repository's migration process."
disable-model-invocation: true
---

# /new-schema

Make a database schema change safely through the repository's migration process.

1. Inspect the current schema, models, queries, and migration history.
2. Define constraints, relations, indexes, nullability, and rollout impact.
3. Update the canonical schema without rewriting prior migrations.
4. Generate a development migration with the repository command.
5. Update data access, API contracts, tests, and documentation as required.
6. Validate generation, migration, type checking, and relevant behavior.

Stop before destructive or shared-database operations unless explicitly approved.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/workflows/new-schema.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
