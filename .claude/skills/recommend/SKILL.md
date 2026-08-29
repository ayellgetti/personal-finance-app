---
name: recommend
description: "Give a clear recommendation."
disable-model-invocation: true
---

# /recommend

Give a clear recommendation.

Structure:
1. Recommendation
2. Why
3. Alternatives
4. Trade-offs
5. Implementation/next step

Do not avoid choosing merely because multiple options exist.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/recommend.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
