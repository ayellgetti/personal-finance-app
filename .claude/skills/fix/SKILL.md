---
name: fix
description: "Provide an actionable correction, not merely an explanation."
disable-model-invocation: true
---

# /fix

Provide an actionable correction, not merely an explanation.

Rules:
- Show the exact file/path when known.
- Prefer a minimal fix.
- Include complete relevant code/config blocks.
- Mention required commands.
- Include verification.
- Preserve unrelated behavior.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/fix.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
