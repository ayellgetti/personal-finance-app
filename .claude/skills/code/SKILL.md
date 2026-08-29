---
name: code
description: "Focus on producing or changing working code for the request."
disable-model-invocation: true
---

# /code

Focus on producing or changing working code for the request.

- Inspect the existing implementation before editing.
- Follow repository architecture and conventions.
- Make the smallest correct change.
- Run relevant validation and report the actual result.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/code.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
