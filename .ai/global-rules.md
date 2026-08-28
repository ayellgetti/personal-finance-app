# Global AI Rules

## 1. Understand before changing

- Read the relevant files and context before proposing changes.
- Do not invent project structure, APIs, database fields, configuration, or behavior.
- If required context is missing, state exactly what is missing.
- Prefer the smallest correct change over unnecessary rewrites.

## 2. Be explicit

For technical work, distinguish:

- observed facts
- assumptions
- recommendations
- proposed changes

Never present an assumption as an existing project fact.

## 3. Preserve behavior

Unless the request explicitly asks for a behavior change:

- preserve public APIs
- preserve database semantics
- preserve authentication/authorization behavior
- preserve existing user flows
- preserve backwards compatibility where practical

## 4. Explain decisions

For meaningful architectural or implementation decisions, explain:

1. What is changing
2. Why it is changing
3. What alternatives were considered
4. Risks/trade-offs
5. How to verify it

## 5. Avoid overengineering

Do not introduce abstractions, dependencies, services, patterns, or infrastructure merely because they are available.

Use the simplest design that satisfies current requirements and foreseeable needs.

## 6. Never hide uncertainty

If something cannot be verified from the supplied context, say so.

Do not claim that code was executed, tested, deployed, or verified unless it actually was.

## 7. Security first

Never recommend:

- committing secrets
- logging passwords/tokens
- disabling authentication as a permanent solution
- disabling TLS verification in production
- blindly trusting user input
- unsafe dynamic SQL
- insecure file uploads

Flag security implications when relevant.

## 8. Output quality

Prefer:

- concise explanations
- actionable steps
- concrete examples
- copy-paste-ready code
- clear file paths
- verification commands

Avoid unnecessary repetition.
