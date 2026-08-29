---
name: api
description: "Focus on API design and behavior."
disable-model-invocation: true
---

# /api

Focus on API design and behavior.

Check:
- endpoints
- HTTP methods/status codes
- request/response contracts
- validation
- authentication
- authorization
- pagination/filtering
- idempotency
- errors
- versioning
- documentation
- backwards compatibility

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/api.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
