---
name: sql
description: "Focus on SQL and relational database behavior."
disable-model-invocation: true
---

# /sql

Focus on SQL and relational database behavior.

- Use the repository schema and migrations as the source of truth.
- Check correctness, constraints, indexes, and query plans where relevant.
- Use parameterized queries for untrusted values.
- Preserve migration history and production data safety.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/sql.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
