# Shared AI Command System

This `.ai` directory defines a shared prompt language for ChatGPT, Cursor, and other AI coding assistants.

## Quick usage

Use one or more shortcuts at the beginning of a request:

```text
/debug /fix
/review /security /production
/architecture /compare /recommend
/prd /userstory /acceptance
```

Shortcuts are composable. Apply all requested behaviors, and when they conflict, use this priority:

1. Safety and correctness
2. Explicit user request
3. Project rules
4. Command-specific rules
5. General style preferences

## Directory

- `shortcuts.md` — command index and composition rules
- `router.md` — shared lookup, rule selection, and precedence
- `global-rules.md` — universal AI behavior
- `coding-rules.md` — engineering standards
- `product-rules.md` — product/PRD standards
- `commands/` — individual command definitions
- `workflows/` — multi-step command definitions
- `projects/` — project-specific context
- `scripts/sync-skills.mjs` — generates and validates native client skills

## Native skills

One generated tree at `.claude/skills/` serves both clients. Cursor loads
`.claude/skills/` as a documented compatibility location, and it is Claude
Code's native location, so a second `.cursor/skills/` copy would only make each
shortcut appear twice in Cursor's `/` menu.

Type `/` in Cursor Agent chat or Claude Code and select a shortcut.
`.cursor/rules/ai-shortcuts.mdc` supplies the shared routing and precedence
rules; root `CLAUDE.md` remains the authoritative repository rulebook.

Cursor rules alone do not register slash commands. Each generated `SKILL.md`
inlines its shortcut body, so edit the canonical file in `.ai/commands/` or
`.ai/workflows/` and regenerate:

```bash
node .ai/scripts/sync-skills.mjs
node .ai/scripts/sync-skills.mjs --check
```

Do not edit files under `.claude/skills/` by hand; the generator overwrites them.

## ChatGPT

Use the same shortcut names directly in prompts. For example:

```text
/debug /fix

Here is the error...
```

The shortcut definitions in `commands/` and `workflows/` are the source of truth.

## Important

Generated Cursor and Claude skills make these shortcuts native in this
repository. Other clients can still use them as prompt conventions, but must be
configured separately if they require native slash-command registration.

## Core development workflow

Recommended feature lifecycle:

```text
/understand
    ↓
/prd
    ↓
/architecture
    ↓
/plan
    ↓
/implement
    ↓
/testing
    ↓
/review
    ↓
/security /performance
    ↓
/production
    ↓
/document
```

Bug lifecycle:

```text
/understand → /debug → /rootcause → /fix → /regression → /testing → /review
```

Database lifecycle:

```text
/schema → /prisma → /migration → /testing → /production
```

Full-stack lifecycle:

```text
/understand → /plan → /backend /api → /frontend /react → /testing → /review
```
