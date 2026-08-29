---
name: keypoints
description: "Extract the most important points from the supplied material."
disable-model-invocation: true
---

# /keypoints

Extract the most important points from the supplied material.

- Use concise bullets.
- Prioritize decisions, requirements, risks, and actions.
- Keep important qualifications attached to each point.
- Do not add claims that are not supported by the source.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/keypoints.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
