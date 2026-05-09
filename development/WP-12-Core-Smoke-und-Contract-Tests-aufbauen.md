# WP-12 - Core-Smoke- und Contract-Tests aufbauen

- Status: Completed
- Datum: 24. Maerz 2026
- Epic: `EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung`

## Ziel

Eine leichte, repo-lokale Verifikation fuer die priorisierten XTend-Core-Fluesse schaffen, die ohne externe Testtoolchain reproduzierbar laeuft.

## Umgesetzte Aenderungen

- `scripts/verify_xtend_core_contracts.js` als automatisierbarer Smoke-/Contract-Check angelegt
- der Verify-Script prueft Manifest-, API-, Theme-, Router-, Overlay- und Feedback-Contracts
- Syntax-Checks fuer Core-Dateien werden in denselben Verify-Lauf integriert
- Doku und Menue referenzieren den Verify-Pfad als Standardcheck nach Core-Aenderungen

## Betroffene Dateien

- `scripts/verify_xtend_core_contracts.js`
- `docs/api.md`
- `docs/manifest.md`
- `docs/xtend-loader.md`
- `docs/components/xrouter.md`
- `docs/core-migration-guide.md`

## Verifikation

- `node scripts/verify_xtend_core_contracts.js`

## Ergebnis

`WP-12` ist abgeschlossen. XTend besitzt jetzt einen ersten wiederholbaren Regression- und Contract-Check fuer den produktiven Core.
