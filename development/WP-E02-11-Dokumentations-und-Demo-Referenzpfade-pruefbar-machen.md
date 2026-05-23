# WP-E02-11 - Dokumentations- und Demo-Referenzpfade pruefbar machen

- Status: completed
- Datum: 4. Mai 2026
- Epic: `development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
- Backlog: `development/BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
- Bezug:
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `tests/references/reference_path_suite.js`
  - `tests/browser/browser_smoke_suite.js`
  - `docs/menu.json`

## Ziel

`WP-E02-11` macht priorisierte Dokumentations- und Demo-Pfade als Regression-Referenzen sichtbar und pruefbar. Die Arbeit trennt automatisierte Referenzen von bewusst manuellen Legacy-Demos, damit alte Demo-Seiten nicht versehentlich als stabile Default-Smokes behandelt werden.

## Umgesetzter Scope

- Docs-Menue prueft, dass alle Slugs auf existierende Markdown-Dateien zeigen
- priorisierte Core- und Component-Dokumente werden auf zentrale Contracts geprueft
- `index.html` und die browsernahen Fixtures werden als Demo-/Smoke-Referenzen geprueft
- `xtendrmt/xtendrmt-bestcase-demo.rmt` wird auf Routen, XTend-Adapter, Schedules und Template-Hydration geprueft
- bestehende Browser-Smoke-Fixtures bleiben als browsernahe Referenzen dokumentiert
- historische manuelle Root-HTML-Demos sind dekommissioniert und nicht mehr Teil der Referenzpfade
- weitere historische Demos sind bewusst als Nicht-Default-Demos dokumentiert

## Zielartefakte

- `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - klassifiziert Doku- und Demo-Pfade
  - trennt `automated-static`, `browser-smoke`, `manual-legacy` und `future`
  - benennt Nicht-Default-Demos
- `tests/references/reference_path_suite.js`
  - prueft Docs-Menue-Ziele
  - prueft priorisierte Doku-Contracts
  - prueft Demo-Referenzen und Registry-Klassifizierung
  - prueft XTendRMT-Bestcase-RMT-Metadaten
- `tests/references/README.md`
  - dokumentiert Scope und lokalen Einstieg
- `scripts/run_xtend_tests.js`
  - stellt den neuen Runner-Einstieg `references` bereit

## Lokaler Testpfad

Einzelner Gate:

```bash
node scripts/run_xtend_tests.js references
```

Gesamtsuite:

```bash
node scripts/run_xtend_tests.js
```

## Definition of Done

- priorisierte Demos sind als Test- oder Smoke-Referenz dokumentiert
- mindestens ein Doku-/Demo-Pfad wird automatisiert geprueft
- nicht testbare oder nicht default-faehige Beispiele sind bewusst markiert
- Backlog und Epic-Status spiegeln den Abschluss von `WP-E02-11`

## Abschluss

`WP-E02-11` ist abgeschlossen. Der naechste startbare Schritt ist `WP-E02-12`, um Reporting, lokale Befehle und CI-Vorbereitung zu vereinheitlichen.
