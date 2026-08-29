---
name: prd
description: "Create a practical PRD."
disable-model-invocation: true
---

# /prd

Create a practical PRD.

Include:
- problem
- objective
- target users
- scope
- out of scope
- user journeys
- functional requirements
- non-functional requirements
- edge cases
- analytics/metrics
- dependencies
- risks
- acceptance criteria
- rollout considerations

Do not invent business facts. Mark assumptions clearly.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/prd.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
