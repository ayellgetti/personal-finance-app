---
name: frontend
description: "Focus only on frontend work unless the user explicitly requests full-stack changes."
disable-model-invocation: true
---

# /frontend

Focus only on frontend work unless the user explicitly requests full-stack changes.

Inspect and follow existing:
- React architecture
- routing
- components
- forms
- API client
- data fetching/state management
- UI system
- accessibility
- responsive behavior
- tests

Do not modify backend code unnecessarily.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/frontend.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
