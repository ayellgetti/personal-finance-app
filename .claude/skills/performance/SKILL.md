---
name: performance
description: "Analyze performance bottlenecks."
disable-model-invocation: true
---

# /performance

Analyze performance bottlenecks.

Check:
- database queries
- N+1 behavior
- network calls
- serialization
- memory usage
- CPU-heavy operations
- caching
- frontend rendering
- bundle size
- concurrency

Do not optimize prematurely. Identify likely bottlenecks and how to measure them.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/performance.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
