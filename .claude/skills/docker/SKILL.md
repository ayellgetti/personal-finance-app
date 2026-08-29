---
name: docker
description: "Focus on containerization and deployment."
disable-model-invocation: true
---

# /docker

Focus on containerization and deployment.

Check:
- Dockerfile
- build context
- multi-stage builds
- image size
- runtime user
- environment variables
- secrets
- health checks
- networking
- volumes
- service dependencies
- graceful shutdown
- production configuration

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/docker.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
