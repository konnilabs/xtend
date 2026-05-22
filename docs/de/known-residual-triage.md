# Known Residual Triage

- Contract: `xtend.epic13.known-residual-triage.v1`
- Decision: `xtend.epic13.known-residual-decision.v1`
- Report: `xtend.epic13.known-residual-triage-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-known-residual-triage --json`

`WP-E13-05` trennt die RC0 Known Residuals in echte RC1-Watchpoints und absichtlich nicht-visuelle Boundary-Contracts.

## Entscheidungen

| Scope | RC1-Entscheid | Bedeutung |
|-------|---------------|-----------|
| `xstate` | `closed-as-runtime-boundary` | State-Adapter mit Lifecycle-, RMT- und Diagnostics-Probe |
| `x-utils` | `closed-as-utility-boundary` | Utility-Modul mit Typing, Fixture Probe und Import Policy |
| `xtend.component.hydrate` | `closed-by-wp-e13-06-owner-free` | Performance-Warnung wurde owner-frei geschlossen |

`private-until-release-owner-acceptance` bleibt aktiv. Die Triage oeffnet kein Publishing.

## Handoff

`WP-E13-06` hat `xtend.component.hydrate` owner-frei geschlossen. Details stehen in [Hydration Performance Closure](./hydration-performance-closure.md). `WP-E13-07` hat die [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md) vorbereitet; `WP-E13-08` ist nun startbar.
