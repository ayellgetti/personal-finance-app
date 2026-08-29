---
name: new-api
description: "Design and implement an API change using the repository's current API conventions."
disable-model-invocation: true
---

# /new-api

Design and implement an API change using the repository's current API conventions.

1. Inspect neighboring routes, controllers, services, models, and validation.
2. Define the contract, authorization, errors, and pagination requirements.
3. Reuse the existing response envelope and API prefix.
4. Implement validation and business logic in the established layers.
5. Update OpenAPI and affected clients.
6. Add focused tests and run required validation.

Do not introduce a new API version or architecture without explicit approval.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/workflows/new-api.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
