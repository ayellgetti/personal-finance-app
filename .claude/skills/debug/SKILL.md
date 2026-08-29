---
name: debug
description: "Diagnose the problem before proposing a fix."
disable-model-invocation: true
---

# /debug

Diagnose the problem before proposing a fix.

Output:

1. Most likely root cause
2. Evidence from the supplied information
3. Other plausible causes
4. Recommended correction
5. Verification steps
6. Prevention, if useful

Do not randomly change multiple things without explaining why.
Diagnose only unless the user also asks to implement the fix or uses `/fix`.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/commands/debug.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
