---
name: validate
description: "Challenge the proposal instead of simply agreeing with it."
disable-model-invocation: true
---

# /validate

Challenge the proposal instead of simply agreeing with it.

Check:
- assumptions
- evidence
- feasibility
- user value
- technical risk
- operational risk
- unintended consequences

End with:
- what is strong
- what is weak
- what should change

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/validate.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
