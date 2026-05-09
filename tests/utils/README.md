# Test Utilities

Shared test helpers live here.

Current utilities:

- `assertions.js`: suite contexts, pass/fail collection and report printing.
- `files.js`: repository-relative text/JSON loading and temporary-copy paths.
- `process.js`: process-oriented helpers such as JavaScript syntax checks.
- `reporting.js`: runner summaries, JSON report generation and consistent suite result normalization.

Expected future utilities:

- DOM and Custom Element helpers
- accessibility helper checks
- browser runner helpers

Utilities must not import production modules for side effects. Test suites call these helpers explicitly.
