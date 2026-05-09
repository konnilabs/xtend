# WP-E12-12 - Enterprise Design System Token Productization vorbereiten

- Status: `completed`
- Datum: 8. Mai 2026
- Epic: `EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung`
- Contract: `xtend.design-tokens.product-contract.v1`
- Pack Contract: `xtend.design-tokens.pack.v1`
- Report Contract: `xtend.design-tokens.report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js design-tokens --json`
- Package Script: `npm run test:design-tokens`
- Bezug:
  - `development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md`
  - `development/XTend-Epic12-RC-Hardening-Modell.md`
  - `development/XTend-Enterprise-Design-System-Token-Contract.md`
  - `docs/design-tokens.md`
  - `design-tokens/xtend-design-tokens.js`
  - `design-tokens/themes/enterprise-light.json`
  - `tests/tokens/design_token_contract_suite.js`

## Ziel

Die Theme-, Styling- und Snapshot-Arbeit aus Epic 11 und Epic 12 wird in eine produktnahe Design-System-Token-Schicht ueberfuehrt. `x-theme`, Component Shell Theme Matrix und Visual Snapshot Fixture verwenden nun dieselben `--xtend-*` Token-Namen.

## Umgesetzte Artefakte

- Design Token Contract in `development/XTend-Enterprise-Design-System-Token-Contract.md`
- maschinenlesbarer Contract in `design-tokens/xtend-design-tokens.js`
- Beispiel-Theme in `design-tokens/themes/enterprise-light.json`
- Developer-Doku in `docs/design-tokens.md`
- lokaler Gate in `tests/tokens/design_token_contract_suite.js`
- Runner-Anschluss `design-tokens` in `scripts/run_xtend_tests.js`
- Package Script `test:design-tokens`
- Package-Export `./design-tokens`
- Scaffold-Metadaten `designTokens`
- `x-theme` API `getDesignTokenContract()`
- Density-Namen auf `compact`, `comfortable`, `dense` konsolidiert
- Theme Matrix und Visual Snapshot Fixture auf Produkt-Tokens migriert

## Token-Entscheidung

Produktive Token-Namen nutzen ausschliesslich `--xtend-*`. Die bisherigen Fixture-lokalen Tokens `--matrix-*` und `--snapshot-*` wurden entfernt, damit visuelle Gates dieselbe API pruefen, die Apps spaeter nutzen.

Pflichtbereiche:

- Theme Packs: `light`, `dark`, `high-contrast`, `forced-colors`
- Density Packs: `comfortable`, `compact`, `dense`
- Kern-Tokens: `--xtend-color-primary`, `--xtend-surface`, `--xtend-text`, `--xtend-density-spacing`, `--xtend-radius`, `--xtend-focus-outline`
- CSS Parts: `root`, `control`, `label`, `content`, `helper`, `error` plus shell-spezifische Erweiterungen

## Verifikation

```bash
node scripts/run_xtend_tests.js design-tokens --json
node scripts/run_xtend_tests.js visual-snapshots --json
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
```

## Handoff

`WP-E12-13` startbar.

Naechstes Paket:

- `WP-E12-13` RMT DSL Authoring Polish fuer Component Shells vorbereiten
