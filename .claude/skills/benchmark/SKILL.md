---
name: benchmark
description: "Compare the supplied solution against reasonable industry or engineering practices."
disable-model-invocation: true
---

# /benchmark

Compare the supplied solution against reasonable industry or engineering practices.

Separate:
- baseline expectations
- strengths
- gaps
- recommended improvements

If current external standards matter, use up-to-date sources where available.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/benchmark.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
