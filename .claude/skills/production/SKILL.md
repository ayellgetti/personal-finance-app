---
name: production
description: "Assess whether the solution is production-ready."
disable-model-invocation: true
---

# /production

Assess whether the solution is production-ready.

Check:

- configuration
- secrets
- authentication/authorization
- validation
- error handling
- logging
- monitoring
- health checks
- database migrations
- backups/recovery
- concurrency
- performance
- security
- deployment
- rollback
- failure scenarios

Finish with:
- blockers
- recommended improvements
- verification checklist

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/production.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
