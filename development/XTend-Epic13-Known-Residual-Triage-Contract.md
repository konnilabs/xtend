# XTend Epic 13 Known Residual Triage Contract

- Schema: `xtend.epic13.known-residual-triage.v1`
- Decision Schema: `xtend.epic13.known-residual-decision.v1`
- Report Schema: `xtend.epic13.known-residual-triage-report.v1`
- Workpackage: `WP-E13-05`
- Status: `accepted-known-residual-triage`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-known-residual-triage --json`
- Publish Boundary: `private-until-release-owner-acceptance`

## Zweck

`WP-E13-05` ueberfuehrt die RC0 Known Residual Policy in eine RC1-Entscheidmatrix. Ziel ist keine neue Owner-Last, sondern eine saubere Trennung zwischen bewusst nicht-visuellen Boundary-Contracts und echten RC1-Watchpoints.

## Entscheidmatrix

| Scope | RC0-Status | RC1-Entscheid | RC1-Status | Publish Blocking | Folgepaket |
|-------|------------|---------------|------------|------------------|------------|
| `xstate` | `contract-gated` | `closed-as-runtime-boundary` | `accepted-runtime-boundary` | nein | - |
| `x-utils` | `typed-contract-gated` | `closed-as-utility-boundary` | `accepted-utility-boundary` | nein | - |
| `xtend.component.hydrate` | `accepted-warning` | `defer-to-wp-e13-06-owner-free-closure` | `rc1-watchpoint` | ja | `WP-E13-06` |

## Source Gates

```bash
npm run test:catalog-coverage
npm run test:component-long-tail-migration
npm run test:performance
npm run test:hydration-policy
npm run test:epic13-package-export-lock
node scripts/run_xtend_tests.js epic13-known-residual-triage --json
```

## Entscheidungsregeln

- `xstate` bleibt ein Runtime-/State-Boundary-Contract und wird nicht kuenstlich zu einer visuellen Component Shell gemacht.
- `x-utils` bleibt Utility-Infrastruktur und wird ueber Typing, Fixture Probe und Import Policy akzeptiert.
- `xtend.component.hydrate` ist der einzige RC1-Watchpoint aus der alten Known-Residual-Liste.
- Owner-freie Schliessung ist bevorzugt; ein Owner-Entscheid wird erst in `WP-E13-06` relevant, falls die Warnung nicht sauber geschlossen werden kann.
- `private: true` und `private-until-release-owner-acceptance` bleiben unveraendert.

## Handoff

`WP-E13-05` macht `WP-E13-06` ready. Das naechste Paket entscheidet die Hydration-Performance-Warnung und bleibt auf `xtend.component.hydrate` fokussiert.
