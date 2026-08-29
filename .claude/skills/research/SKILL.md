---
name: research
description: "Research a question using authoritative and current sources."
disable-model-invocation: true
---

# /research

Research a question using authoritative and current sources.

1. Clarify the decision or output the research must support.
2. Inspect repository evidence first for project-specific questions.
3. Use primary sources and current documentation where external facts matter.
4. Separate verified facts, assumptions, and recommendations.
5. Cite sources and note meaningful uncertainty or conflicting evidence.
6. End with a concise conclusion or recommended next step.

Do not present stale or unverified claims as current fact.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/workflows/research.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
