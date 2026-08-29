---
name: example
description: "Add a practical example that directly illustrates the request."
disable-model-invocation: true
---

# /example

Add a practical example that directly illustrates the request.

- Match the user's context and level of detail.
- Use realistic but clearly labeled sample values.
- Do not present invented project data as fact.
- Keep the example focused on the concept being explained.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/example.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
