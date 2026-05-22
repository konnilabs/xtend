# Known Residual Triage

- Contract: `xtend.epic13.known-residual-triage.v1`
- Decision: `xtend.epic13.known-residual-decision.v1`
- Report: `xtend.epic13.known-residual-triage-report.v1`
- Local gate: `node scripts/run_xtend_tests.js epic13-known-residual-triage --json`

`WP-E13-05` separates the RC0 known residuals into real RC1 watchpoints and intentionally non-visual boundary contracts.

## Decisions

| Scope | RC1 decision | Meaning |
|-------|--------------|---------|
| `xstate` | `closed-as-runtime-boundary` | State adapter with lifecycle, RMT and diagnostics probe |
| `x-utils` | `closed-as-utility-boundary` | Utility module with typing, fixture probe and import policy |
| `xtend.component.hydrate` | `closed-by-wp-e13-06-owner-free` | Performance warning was closed without an owner dependency |

`private-until-release-owner-acceptance` remains active. The triage does not open publishing.

## Handoff

`WP-E13-06` closed `xtend.component.hydrate` without an owner dependency. Details are in [Hydration Performance Closure](./hydration-performance-closure.md). `WP-E13-07` prepared the [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md); `WP-E13-08` can now start.
