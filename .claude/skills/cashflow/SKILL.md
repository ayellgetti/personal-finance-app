---
name: cashflow
description: "Analyze cash flow."
disable-model-invocation: true
---

# /cashflow

Analyze cash flow.

Separate:
- income
- fixed expenses
- variable expenses
- debt payments
- investments
- surplus/deficit
- timing issues

Do not invent missing values.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/cashflow.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
