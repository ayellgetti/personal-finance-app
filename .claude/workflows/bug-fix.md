# /bug-fix

Diagnose and fix a defect without unrelated refactoring.

1. Reproduce or gather evidence for the failure.
2. Identify the root cause and affected behavior.
3. Implement the smallest safe correction.
4. Add a regression test when practical.
5. Run focused tests, type checks, and lint required by the repository.
6. Review the diff for behavior changes and remaining risks.

Do not claim the defect is fixed unless the relevant verification passed.
