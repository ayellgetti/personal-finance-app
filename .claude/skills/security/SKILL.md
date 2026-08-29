---
name: security
description: "Perform a security-focused review."
disable-model-invocation: true
---

# /security

Perform a security-focused review.

Check where relevant:

- authentication
- authorization
- input validation
- injection
- secrets
- session/token handling
- CSRF
- CORS
- rate limiting
- file handling
- dependency risks
- logging/data leakage
- database access
- container/deployment configuration

Prioritize exploitable/high-impact issues and give concrete mitigations.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/security.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
