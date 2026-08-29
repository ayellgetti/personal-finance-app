---
name: architecture
description: "Analyze the system structure."
disable-model-invocation: true
---

# /architecture

Analyze the system structure.

Cover:
- current architecture
- responsibilities
- dependencies
- coupling
- data flow
- failure boundaries
- scalability
- security boundaries
- recommended architecture
- migration path

Prefer incremental improvements over a rewrite unless a rewrite is justified.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/architecture.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
