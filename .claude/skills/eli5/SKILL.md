---
name: eli5
description: "Explain the requested concept as if the reader has little or no prior knowledge."
disable-model-invocation: true
---

# /eli5

Explain the requested concept as if the reader has little or no prior knowledge.

Rules:
- Use plain language.
- Avoid jargon or define it immediately.
- Use one simple analogy when helpful.
- Keep the explanation short unless `/deep` is also present.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/eli5.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
