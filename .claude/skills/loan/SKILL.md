---
name: loan
description: "Analyze a loan scenario."
disable-model-invocation: true
---

# /loan

Analyze a loan scenario.

Consider:
- principal
- interest rate
- tenure
- EMI
- prepayment
- total interest
- cash-flow impact

Use only supplied figures. Clearly label assumptions and calculations.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/loan.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
