# WP-E13-05 - RC0 Known Residuals fuer RC1 triagieren

- Schema: `xtend.epic13.wp05.known-residual-triage.v1`
- Contract: `xtend.epic13.known-residual-triage.v1`
- Status: `completed`
- Datum: 8. Mai 2026
- Gate: `node scripts/run_xtend_tests.js epic13-known-residual-triage --json`

## Ziel

Die RC0-Residuals `xstate`, `x-utils` und `xtend.component.hydrate` wurden fuer RC1 neu bewertet. Dabei wurde vermieden, Boundary- oder Utility-Oberflaechen in falsche UI-Komponenten-Reifegrade zu pressen.

## Umsetzung

- `catalog/epic13-known-residual-triage.js` fuehrt die Entscheidmatrix als maschinenlesbaren Contract.
- `tests/platform/epic13_known_residual_triage_suite.js` prueft Contract, Package-Export, Scaffold-Metadata, Runner, Docs und Handoff.
- `docs/known-residual-triage.md` dokumentiert die Entscheidungen fuer Entwickler.
- `package.json` exportiert `./catalog/epic13-known-residual-triage` und registriert `npm run test:epic13-known-residual-triage`.
- `xtend-builder/scaffold.config.js` spiegelt `epic13KnownResidualTriage`.

## Entscheidungen

| Scope | Entscheidung |
|-------|--------------|
| `xstate` | `closed-as-runtime-boundary` |
| `x-utils` | `closed-as-utility-boundary` |
| `xtend.component.hydrate` | `defer-to-wp-e13-06-owner-free-closure` |

## Ergebnis

`xstate` und `x-utils` sind fuer RC1 nicht mehr als offene Produkt-Residuals zu behandeln. `xtend.component.hydrate` wurde als einziger Watchpoint sichtbar gemacht und in `WP-E13-06` owner-frei geschlossen.

## Handoff

`WP-E13-06` ist abgeschlossen. `WP-E13-07` hat die PROD-nahen Browser-, Local-Server- und CSP-Smokes vorbereitet. `WP-E13-08` ist ready.
