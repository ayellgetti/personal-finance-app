---
name: audit
description: "Perform a systematic audit of the supplied artifact."
disable-model-invocation: true
---

# /audit

Perform a systematic audit of the supplied artifact.

Review against:
- requirements
- correctness
- security
- maintainability
- operational readiness
- consistency

Return findings with severity and remediation.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/audit.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
