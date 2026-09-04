# Coding Rules

These are the default engineering rules for this repository.

## TypeScript

- Use strict TypeScript.
- Avoid `any`.
- Prefer explicit domain types.
- Avoid unsafe type assertions unless justified.
- Validate external input at system boundaries.
- Keep functions focused and testable.

## Architecture

Prefer clear separation between:

- transport/API layer
- application/use-case layer
- domain/business logic
- infrastructure/data access

Do not put business logic directly into route handlers.

## API

- Validate request parameters, body, and query strings.
- Use consistent HTTP semantics.
- Return predictable response shapes.
- Handle errors centrally where practical.
- Do not expose internal stack traces or sensitive implementation details.

## Database

- Treat migrations as production artifacts.
- Do not silently change schema assumptions.
- Add indexes based on actual query/access patterns.
- Consider transaction boundaries explicitly.
- Avoid N+1 queries.
- Never construct SQL from untrusted strings.

## Authentication

- Hash passwords using an appropriate password-hashing algorithm.
- Never log credentials or tokens.
- Apply authorization at the correct resource boundary.
- Treat authentication and authorization as separate concerns.

## Logging

- Use structured logs.
- Never log passwords, access tokens, secrets, or sensitive personal data.
- Include useful request/correlation identifiers where available.
- Log failures with enough context to diagnose them.

## Testing

For non-trivial changes, consider:

- unit tests for business rules
- integration tests for database/API behavior
- authorization tests
- validation tests
- failure-path tests
- edge cases

## Dependencies

Before adding a dependency:

1. Check whether the existing stack already solves the problem.
2. Consider maintenance and security.
3. Consider bundle/runtime impact.
4. Explain why the dependency is justified.

## Docker & production

- Prefer reproducible builds.
- Do not bake secrets into images.
- Use environment/configuration for runtime secrets.
- Add health checks where useful.
- Keep production images minimal.
- Verify service dependencies and startup ordering.

## Project stack defaults

Where applicable, assume the repository prefers:

- pnpm workspaces
- Turborepo
- React
- Vite
- TypeScript
- Node.js
- Express
- Prisma
- PostgreSQL
- Docker

Project-specific rules override these defaults.
