# Shared Shortcut Router

When a request invokes one or more shortcuts:

1. Resolve each name to `.ai/commands/<name>.md` or
   `.ai/workflows/<name>.md`.
2. Read and apply every matched definition as one coherent request.
3. Apply `.ai/global-rules.md`.
4. Apply `.ai/coding-rules.md` for engineering work.
5. Apply `.ai/product-rules.md` for product, requirements, UX, launch, or sales
   work.
6. Apply `.ai/projects/freedom-planner.md` for this repository's finance domain.
7. Ignore unrelated project contexts unless the user explicitly selects one.

Use this precedence when instructions conflict:

1. Safety and platform policy
2. Explicit user request
3. Repository rules and implementation
4. Relevant project context
5. Shortcut definitions
6. General style preferences

If a shortcut cannot be resolved, state that clearly and continue with the
plain-language request. Never invent project architecture or behavior.
