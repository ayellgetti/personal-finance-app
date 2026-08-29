---
name: sales-campaign
description: "Create a practical sales campaign grounded in the supplied offer and audience."
disable-model-invocation: true
---

# /sales-campaign

Create a practical sales campaign grounded in the supplied offer and audience.

1. Define the target customer, problem, offer, and desired action.
2. State assumptions where business facts are missing.
3. Design the message, channels, sequence, timing, and ownership.
4. Include reusable outreach copy appropriate to each channel.
5. Define measurable conversion metrics and a feedback loop.
6. Flag legal, privacy, brand, and deliverability risks.

Do not invent customer proof, performance claims, or market data.

---

Apply `.ai/router.md` and the repository rules in `CLAUDE.md`. For code or
product changes, use `docs/PROJECT_SPEC.md` and `docs/DEVELOPMENT_PLAN.md` as
the source of truth. If instructions conflict, repository-specific rules win.

Generated from `.ai/workflows/sales-campaign.md`. Edit that file, then run
`node .ai/scripts/sync-skills.mjs`.
