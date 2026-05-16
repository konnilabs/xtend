# XTend Epic 12 Docs, Migration und Adoption Guide

- Status: Accepted
- Datum: 8. Mai 2026
- Contract: `xtend.epic12.docs-adoption.v1`
- Report: `xtend.epic12.docs-adoption-report.v1`
- Workpackage: `WP-E12-15`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic12-docs-adoption --json`
- Publish Boundary: `private-until-release-owner-approval`

## Zweck

Dieses Dokument friert die offizielle Dokumentations- und Adoption-Oberflaeche fuer den Epic-12-Stand ein. Nach `WP-E12-14` existiert mit `xtend.epic12.rc0-gate-matrix.v1` ein konkreter RC0-Gate-Schnitt; `WP-E12-15` macht diesen Schnitt fuer Component Authors, App Authors und Release Owner lesbar.

Der Guide ist kein Publish-Freigabeprozess. `package.json` bleibt `private: true`, Conditional Network Gates bleiben publish-relevant, und `WP-E12-16` muss den finalen RC0-Handoff fuer Owner Acceptance vorbereiten.

## Aktualisierte Dokumentationsflaechen

| Flaeche | Pfad | Zweck |
|---------|------|-------|
| RC0 Adoption Guide | `docs/rc0-adoption-guide.md` | operative Migration Notes und Adoption Checklist |
| Enterprise Adoption | `docs/enterprise-adoption.md` | Epic-12-RC0-Erweiterung des bestehenden Enterprise Guides |
| Long-Tail Migration | `docs/component-long-tail-migration.md` | aktualisierter Status fuer `xstate`, `x-utils` und geschlossene Komponenten |
| Snapshot Automation | `docs/visual-snapshot-automation.md` | DOM-first Snapshot Gate als RC0-Baseline |
| Design Tokens | `docs/design-tokens.md` | Token Productization als Adoption-Pflicht |
| RMT DSL Authoring | `docs/rmt-dsl-authoring-polish.md` | Upstream-freundliche RMT-Schreibweise fuer Shells |
| RC0 Gate Matrix | `docs/rc0-gate-matrix.md` | Verweis auf Migration Notes und Adoption Flow |
| Docs-App Menu | `docs/menu.json` | sichtbarer Einstieg in der Docs-SPA |

## Migration Notes

### Long-Tail Migration Status

`x-tabs`, `x-theme`, `x-button` und `x-menu` sind geschlossen. `xstate` bleibt als nicht-visuelle Boundary-Probe `contract-gated`; `x-utils` bleibt als Utility-Boundary `typed-contract-gated`. Beide sind fuer RC0 akzeptiert, weil sie nicht als visuelle Shells kuenstlich umdefiniert werden.

### Snapshot Automation

Visual Regression ist fuer RC0 DOM-first. `visual-snapshots` nutzt eine reviewbare JSON-Baseline; Pixel-Baselines bleiben optional lokal. Die Gate-Kette verbindet `component-shell-theme-matrix`, `visual-snapshot-automation`, `visual-snapshots` und `design-tokens`.

### Design Tokens

Neue Komponenten und Shells nutzen die `--xtend-*` Tokenlinie. Lokale Snapshot- oder Demo-spezifische Token sind kein Produktpfad. Theme Packs, Density Packs, High-Contrast und Forced-Colors bleiben ueber den Design-Token-Contract gatebar.

### RMT DSL Authoring Polish

RMT-App- und Shell-Autoren nutzen die neuen Aliase fuer Component, Shell, Slot, Style, Token, A11y, Event, Command, Hydration, Lane, Route, Link und Outlet. XTendRMT bleibt dabei framework-agnostisch: Der RMT Kernel importiert keine XTend-Typen.

### RC0 Readiness

RC0 verlangt:

```bash
node scripts/run_xtend_tests.js epic12-docs-adoption --json
node scripts/run_xtend_tests.js rc0-gate-matrix --json
npm run test:release:full:report
npm run pack:dry-run
```

Conditional Network Gates:

```bash
npm audit --audit-level=moderate
npm sbom --sbom-format=cyclonedx --json
```

Wenn diese Netzwerk-Gates lokal nicht laufen koennen, muss `WP-E12-16` die Deferral explizit im Handoff dokumentieren. Publishing bleibt blockiert.

## Adoption-Stufen

| Stufe | Ergebnis |
|-------|----------|
| Local Baseline | `xtend-loader.js`, lokales Manifest und lokaler Dev/Test-Server |
| UI Component Baseline | Components nutzen Types, Events, A11y- und Performance-Profile |
| Fabric Telemetry Baseline | Lifecycle, Fibers, Lanes, Reporter und Diagnostics sind entschieden |
| RMT Shell-first Baseline | App Shell, Routes, Templates und Content Slots laufen ueber RMT Records |
| Security Baseline | Manifest Import Policy, Trusted DOM und Supply Chain sind verstanden |
| Performance/A11y Baseline | Hydration, Performance Regression, Screenreader, Motion und Contrast sind gatebar |
| Snapshot/Token Baseline | Design Tokens und DOM-first Snapshot Gate sind gruen |
| RC0 Review Baseline | RC0 Gate Matrix, Known Residual Policy und Package Dry Run sind reviewbar |

## Definition of Done

- Docs-App-Menue kennt den RC0 Adoption Guide.
- Enterprise Adoption Guide erklaert den Epic-12-RC0-Stand.
- Migration Notes decken Long-Tail, Snapshot, Design Tokens, RMT DSL, Known Residuals und Publish Boundary ab.
- `package.json` und `xtend-builder/scaffold.config.js` tragen `xtend.epic12.docs-adoption.v1`.
- `references`, `epic12-docs-adoption` und `rc0-gate-matrix` pruefen dieselben Pfade.

## Handoff

`WP-E12-16` kann jetzt den Abschlussreview und den RC0-Handoff erstellen. Der Handoff muss Gate-Ergebnisse, Conditional Network Gate Status, Known Residual Policy, Migration Notes, Package Dry Run und Publish Boundary zusammenfuehren.
