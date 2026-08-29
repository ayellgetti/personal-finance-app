---
name: fastify
description: "Focus on Fastify implementation only when the repository already uses Fastify or"
disable-model-invocation: true
---

# /fastify

Focus on Fastify implementation only when the repository already uses Fastify or
the user explicitly requests a Fastify design. Do not migrate an existing
Express application to Fastify without approval.

Check:
- route schemas
- validation
- plugins
- hooks
- lifecycle
- error handling
- authentication
- serialization
- logging
- graceful shutdown
- testability

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/fastify.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
