# WP-E04-11 - Upstream-Handoff-Spezifikation fuer XTendRMT DSL und Bridge vorbereiten

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
- Backlog: `development/BACKLOG-EPIC-04-XTendRMT-DSL-Templating-und-Kompatibilitaetsvorbereitung.md`
- Bezug:
  - `development/WP-E04-02-RMT-Schema-Demo-und-DSL-Gap-Analyse-erstellen.md`
  - `development/WP-E04-09-Pilot-Flow-fuer-RMT-basiertes-XTend-Templating-vorbereiten.md`
  - `development/WP-E04-10-Migrations-und-Framework-Agnostik-Leitplanken-dokumentieren.md`
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `xtendrmt/rmt.schema.json`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E04-11` ueberfuehrt die Ergebnisse von Epic 04 in eine konkrete upstream-Handoff-Spezifikation fuer XTendRMT DSL, Bridge, native Routes und Adapter. Epic 05 soll damit produktiv starten koennen, ohne die Vorarbeiten aus Epic 04 erneut explorativ aufrollen zu muessen.

## Umgesetzte Artefakte

- neues Handoff-Dokument `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
- Epic-05-Startkriterien fuer DSL-Domains, Adapter, Kernel-Grenze und Gates
- Schema-Handoff-Metadatum `xtend.rmt.upstream-handoff.v1` in `xtendrmt/rmt.schema.json`
- stabile Adapter-IDs `xtend.component`, `xtend.template` und `xtend.xrouter` fuer Epic 05
- erweiterte Epic-04-, Epic-05-, ADR- und Referenzpfad-Verlinkung
- erweiterte `rmt-compatibility`- und `references`-Gates fuer den Handoff-Contract

## Handoff-Entscheidung

Die upstream-fuehrende XTendRMT-Quelle ist ab Epic 05 die Architekturquelle fuer DSL, Bridge und native Routing-Domains. Die Artefakte in `xtendrmt/` bleiben Build-Output, Demo-Basis und Regression-Referenz.

| Ebene | Epic-05-Aufgabe | Grenze |
|-------|-----------------|--------|
| RMT Kernel | Scheduler, Template Registry, Diagnostics und Execution Plans host-neutral halten | keine XTend-, XRouter- oder `xstate`-Imports |
| RMT DSL | native `adapters`, `components`, `routes`, `schedules` und weiterhin `templates` modellieren | bestehende Template-only-Dokumente bleiben gueltig |
| Host Adapter | Capability Negotiation, Mounting, Hydration, Navigation und Diagnostics ausfuehren | Kernel sieht nur neutrale Records |
| XTend Product Adapter | XTend Manifest, Custom Elements, Slots, Events, Theme, API und `xstate` anbinden | XTend wird First-Class Host, aber nicht Pflicht-Host |
| XRouter Adapter | RMT Route Records in XRouter-Konfiguration und Navigation uebersetzen | XRouter bleibt erste Adapter-Implementierung, nicht einzige Route-Logik |

## Epic-05-Startkriterien

Epic 05 kann starten, wenn diese Kriterien als verbindliche Eingangsbedingungen gelten:

- `development/XTendRMT-Upstream-Handoff-Spezifikation.md` ist der fachliche Input fuer DSL- und Bridge-Arbeit.
- upstream trennt mindestens `rmt-kernel`, `rmt-dsl`, `rmt-routing`, `rmt-components`, `rmt-adapters`, `rmt-adapter-xtend`, `rmt-adapter-xrouter` und `rmt-tests` oder aequivalente Verantwortungsbereiche.
- `xtendrmt/rmt.schema.json` wird aus upstream-Quellen erzeugt oder bewusst synchronisiert; manuelle Bundle-Patches sind kein Architekturpfad.
- die Domains `adapters`, `components`, `routes`, `schedules` und `templates` werden additiv modelliert.
- XTend-spezifische Daten bleiben Adapterdaten mit `kernelVisible: false` oder aequivalenter Grenze.
- produktive Bridge-Arbeit muss mindestens `node scripts/run_xtend_tests.js rmt-compatibility --json` und `node scripts/run_xtend_tests.js references --json` bestehen.

## Lokaler Testpfad

```bash
node --check tests/rmt/rmt_compatibility_suite.js
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`WP-E04-11` ist abgeschlossen. Der upstream-Handoff ist dokumentiert, in Schema-Metadaten und Reference-Gates verankert und an Epic 05 uebergeben. `WP-E04-12` kann nun das Epic-Abschlussreview und die KPI-Abnahme durchfuehren.
