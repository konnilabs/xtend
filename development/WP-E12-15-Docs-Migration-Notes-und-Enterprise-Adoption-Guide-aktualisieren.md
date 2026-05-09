# WP-E12-15 - Docs, Migration Notes und Enterprise Adoption Guide aktualisieren

- Status: `completed`
- Datum: 8. Mai 2026
- Contract: `xtend.epic12.wp15.docs-adoption.v1`
- Adoption Contract: `xtend.epic12.docs-adoption.v1`
- Report: `xtend.epic12.docs-adoption-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic12-docs-adoption --json`

## Ziel

`WP-E12-15` bringt die offizielle XTend-Dokumentation auf den Epic-12-Stand. Nach der RC0 Gate Matrix aus `WP-E12-14` sind die Migration Notes, Enterprise Adoption, Docs-App-Navigation und Referenzgates nun auf denselben Release-Candidate-Schnitt ausgerichtet.

## Umgesetzt

- `catalog/epic12-docs-adoption.js` beschreibt den maschinenlesbaren Contract `xtend.epic12.docs-adoption.v1`
- `tests/docs/epic12_docs_adoption_suite.js` prueft Docs, Package, Scaffold, Runner, Backlog, RC-Modell und Referenzregister
- `development/XTend-Epic12-Docs-Migration-und-Adoption-Guide.md` dokumentiert den Development-Contract
- `docs/rc0-adoption-guide.md` ist der neue oeffentliche Einstieg fuer Migration Notes und Adoption
- `docs/enterprise-adoption.md` enthaelt den Epic-12-RC0-Adoption-Abschnitt
- `docs/menu.json` und `docs/README.md` verlinken den neuen Guide
- `docs/component-long-tail-migration.md`, `docs/visual-snapshot-automation.md`, `docs/design-tokens.md`, `docs/rmt-dsl-authoring-polish.md` und `docs/rc0-gate-matrix.md` verweisen auf den RC0 Adoption Guide

## Migration Notes

| Thema | Entscheidung |
|-------|--------------|
| Long-Tail Runtime | `x-tabs`, `x-theme`, `x-button`, `x-menu` geschlossen; `xstate` und `x-utils` bleiben akzeptierte Boundary-Probes |
| Snapshot Automation | DOM-first Snapshot Gate ist RC0-Baseline; Pixel-Baselines bleiben optional lokal |
| Design Tokens | `--xtend-*` Tokenlinie ist Produktpfad fuer neue Shells und Komponenten |
| RMT DSL Authoring Polish | Aliase und Diagnostics sind upstream-freundlich dokumentiert, ohne RMT-Kernel-Coupling |
| RC0 Readiness | `rc0-gate-matrix`, Full Release, Package Dry Run und Conditional Network Gates sind beschrieben |
| Publish Boundary | `private-until-release-owner-approval` bleibt aktiv |

## Lokale Validierung

```bash
node scripts/run_xtend_tests.js epic12-docs-adoption --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js rc0-gate-matrix --json
```

## Definition of Done

- Docs-App-Menue kennt `rc0-adoption-guide`
- Enterprise Adoption Guide kennt `xtend.epic12.docs-adoption.v1`
- Reference-Gate kennt die neuen Pfade
- Package und Scaffold tragen die Adoption-Metadaten
- `WP-E12-16` startbar

## Handoff

`WP-E12-16` startbar: Epic-12-Abschlussreview und RC0-Handoff koennen jetzt Gate-Ergebnisse, Known Residual Policy, Migration Notes, Conditional Network Gate Status, Package Dry Run und Publish Boundary zusammenfuehren.
