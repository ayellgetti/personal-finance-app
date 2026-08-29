---
name: verify
description: "Verify the supplied claim, implementation, calculation, or reasoning."
disable-model-invocation: true
---

# /verify

Verify the supplied claim, implementation, calculation, or reasoning.

Separate:
- verified
- likely
- unsupported
- incorrect

State what evidence would be needed to verify uncertain points.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/verify.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
