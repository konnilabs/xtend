# WP-E05-17 - Dokumentation und Authoring-Beispiele schreiben

- Status: `completed`
- Datum: 5. Mai 2026
- Epic: `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
- Backlog: `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
- Bezug:
  - `development/WP-E05-14-Bestcase-Demo-auf-native-Routes-und-Components-migrieren.md`
  - `development/WP-E05-15-Contract-Schema-und-Runtime-Tests-erweitern.md`
  - `development/WP-E05-16-Browser-Smokes-und-Multi-Host-Regression-absichern.md`
  - `docs/xtendrmt-native-authoring.md`
  - `docs/xtendrmt-migration-guide.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-17` macht das native XTendRMT Authoring-Modell explizit. Nach `WP-14` bis `WP-16` waren Schema, Adapter, Runtime, Demo und Browser-Smoke vorhanden; dieses Paket macht daraus eine lesbare Schreib- und Migrationsanleitung.

Der Fokus liegt auf zwei Zielgruppen:

- Menschen, die native `.rmt` Dokumente fuer XTend UI und XRouter schreiben
- AI-Agenten, die kuenftige `.rmt` Dokumente ohne implizites Demo-Wissen erzeugen sollen

## Neue Authoring-Dokumentation

`docs/xtendrmt-native-authoring.md` traegt den Contract:

```text
xtend.rmt.native-authoring-guide.v1
```

Der Guide beschreibt:

- nativen Dokumentaufbau mit `adapters`, `components`, `routes`, `schedules` und `templates`
- stabile Adapter-IDs `xtend.xrouter`, `xtend.component`, `rmt.state-scheduler-diagnostics` und `vanilla.component`
- Component Records fuer XTend Custom Elements
- Route Records fuer XRouter
- zentrale Schedule Policies wie `route.visible.render` und `component.idle.hydrate`
- Runtime-Verkabelung ueber `createRmtFormat`, `createRmtXRouterAdapter`, `createRmtXtendComponentAdapter` und `createRmtStateSchedulerDiagnosticsBridge`
- Kernel Boundary und Review-Checkliste

## Neue Migrationsdokumentation

`docs/xtendrmt-migration-guide.md` traegt den Contract:

```text
xtend.rmt.native-migration-guide.v1
```

Der Guide beschreibt:

- Migration von `manifest.metadata.routes -> routes`
- Migration von `manifest.metadata.components -> components`
- Migration von `manifest.metadata.schedules -> schedules`
- Ablage von Host Adapter Records in `adapters`
- Entfernung dauerhafter Demo-Brueckenlogik zugunsten produktiver Adapter-Factories
- Bestcase-Demo als Referenz fuer native Top-Level-Domains
- Template-only-Kompatibilitaet und opt-in Migration
- Parallelbetrieb mit React, Vue, Vanilla JS und Custom Hosts

## Dokumentationsanschluss

Aktualisiert wurden:

- `docs/en/README.md`
- `docs/menu.json`
- `docs/core-migration-guide.md`
- `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
- `tests/references/reference_path_suite.js`
- `tests/README.md`

Damit sind die neuen Guides ueber das Docs-Menue erreichbar, im Referenzregister klassifiziert und im automatisierten Reference-Gate abgesichert.

## Kernel Boundary

Die Doku bestaetigt die Epic-05-Grenze:

- RMT Kernel normalisiert, indiziert und validiert
- XRouter bleibt Adapter ueber `xtend.xrouter`
- XTend bleibt Component Adapter ueber `xtend.component`
- Scheduler Endpoint Ausfuehrung bleibt Bridge-/Host-Arbeit
- `manifest.metadata` bleibt Beschreibung und Handoff, nicht operative App-DSL fuer neue Routes/Components
- nicht-XTend Hosts nutzen eigene Adapter wie `vanilla.component`

## Verifikation

Mindestgates:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js browser --json
npm test
```

## Ergebnis

`WP-17` ist abgeschlossen. Native RMT Routes, XTend Components, Adapter, Schedules und Migration von alten Metadatenpfaden sind nun dokumentiert und referenzgegated. `WP-18` kann das Epic-Abschlussreview und die KPI-Abnahme starten.
