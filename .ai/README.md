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
- `global-rules.md` — universal AI behavior
- `coding-rules.md` — engineering standards
- `product-rules.md` — product/PRD standards
- `commands/` — individual command definitions
- `projects/` — project-specific context

## Cursor

Copy or reference these rules from your Cursor project rules configuration. Keep this directory committed to the repository so the same conventions can be reused by other AI tools.

## ChatGPT

Use the same shortcut names directly in prompts. For example:

```text
/debug /fix

Here is the error...
```

The shortcut definitions in `commands/` are the source of truth.

## Important

A shortcut is a prompt convention unless the AI client has been explicitly configured to recognize it as an actual command. The files define what the shortcut means; they do not by themselves create UI slash commands.

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
