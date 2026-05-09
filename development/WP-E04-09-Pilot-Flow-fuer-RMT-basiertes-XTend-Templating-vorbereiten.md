# WP-E04-09 - Pilot-Flow fuer RMT-basiertes XTend-Templating vorbereiten

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
- Backlog: `development/BACKLOG-EPIC-04-XTendRMT-DSL-Templating-und-Kompatibilitaetsvorbereitung.md`
- Bezug:
  - `development/WP-E04-04-RMT-Template-Authoring-Model-fuer-XTend-UI-vorbereiten.md`
  - `development/WP-E04-05-Root-Lifecycle-und-Scheduler-Handshakes-fuer-XTend-Roots-standardisieren.md`
  - `development/WP-E04-08-Test-und-Referenzgates-fuer-RMT-kompatible-XTend-Artefakte-erweitern.md`
  - `development/XTendRMT-Pilot-Flow-RMT-basiertes-XTend-Templating.md`
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `xtendrmt/xtendrmt-bestcase-demo.js`
  - `xtendrmt-bestcase.html`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E04-09` belegt den vorbereiteten RMT-Templating-Pfad an einem kontrollierten Pilot-Flow. Die Bestcase-Demo zeigt nun nicht nur RMT-Routen und Scheduler-Jobs, sondern auch ein explizites RMT Template mit XTend Component Attachment.

Der Pilot bleibt framework-agnostisch und referenziell. Er fuehrt keine produktive XTendRMT Bridge ein, implementiert keine native RMT Routing-Domain und verschiebt keine XTend-Logik in den RMT Kernel.

## Umgesetzte Artefakte

- neuer Pilot-Contract `xtend.rmt.template-pilot-flow.v1` in `xtendrmt/rmt.schema.json`
- `manifest.metadata.pilotFlow` in `xtendrmt/xtendrmt-bestcase-demo.rmt`
- neuer Route-Record `/templating` mit Template `demo.templating.pilot`
- neuer Template-Record `demo.templating.pilot` mit `dom_descriptor`, Slots, Event-Command und Hydration-Hints
- neue Demo-Route `x-rmt-route-template-pilot` in `xtendrmt/xtendrmt-bestcase-demo.js`
- neue Demo-Navigation in `xtendrmt-bestcase.html`
- neues Referenzdokument `development/XTendRMT-Pilot-Flow-RMT-basiertes-XTend-Templating.md`
- erweiterte RMT-Kompatibilitaets- und Reference-Gates fuer den Pilot

## Pilot-Entscheidung

Der Pilot-Flow ist ein Inspect- und Referenzpfad:

```text
xtend.rmt.template-pilot-flow.v1
```

Er nutzt den bestehenden Mindestgate:

```bash
node scripts/run_xtend_tests.js rmt-compatibility --json
```

Der Pilot macht den Zielpfad sichtbar:

| Ebene | Pilot-Inhalt | Ausfuehrungsgrenze |
|-------|--------------|--------------------|
| RMT Document | `manifest.metadata.pilotFlow` | nur Daten und Referenz-Contract |
| Template | `demo.templating.pilot` | Slots, Events und Hydration als Records |
| Component Attachment | `xtend.template` + `xtend.component` | Host Adapter loest ComponentRefs |
| Scheduler | `template.visible.inspect` | Inspect-Job, keine produktive Bridge |
| Demo UI | `/templating` | zeigt Contract, Attachment und Template-Record |

## Reduktion von Demo-Sonderlogik

Die Demo bleibt als Bestcase-Demo weiterhin handgeschrieben, aber der neue Pilot verschiebt die relevanten Templating-Daten aus UI-Sonderlogik in das `.rmt` Dokument:

- Component Attachment steht in `manifest.metadata.pilotFlow.componentAttachment`
- Template-Ref, Route-Ref und Minimum Gate stehen im RMT-Dokument
- Slots, Event Command und Hydration-Hints stehen im Template-Record
- die UI liest diese Records aus und zeigt sie als Inspect-Snapshot

Damit ist der Flow pruefbar, ohne eine zweite XTend-Template-Sprache oder eine vorgezogene Bridge zu schaffen.

## Boundaries

- `kernelVisible: false` bleibt fuer Pilot, Template Authoring und Scaffold Compatibility gesetzt.
- `bridgeRuntime` bleibt `reserved-for-Epic-05`.
- XRouter bleibt Adapter-Aufgabe.
- RMT bleibt framework-agnostisch; der Pilot schliesst React, Vue, Vanilla JS oder Custom Hosts nicht aus.
- Der lokale Gate prueft statische Contracts, keine Runtime-Materialisierung.

## Test- und Referenzbindung

`tests/rmt/rmt_compatibility_suite.js` prueft:

- `xtend.rmt.template-pilot-flow.v1` im RMT Schema
- `manifest.metadata.pilotFlow` in der Bestcase-Demo
- Route `/templating` und Template `demo.templating.pilot`
- XTend Component Attachment mit `xtend.template` und `xtend.component`
- `template.visible.inspect` als Scheduler-Hint
- `reserved-for-Epic-05` als Bridge-Grenze
- Demo-JS und HTML-Navigation fuer den Pilot

`tests/references/reference_path_suite.js` prueft die Dokumentations- und Statusbindung.

## Lokaler Testpfad

```bash
node --check xtendrmt/xtendrmt-bestcase-demo.js
node --check tests/rmt/rmt_compatibility_suite.js
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`WP-E04-09` ist abgeschlossen. Ein realistischer, framework-agnostischer RMT-Templating-Pilot ist sichtbar und lokal pruefbar. `WP-E04-10` kann nun Migrations- und Framework-Agnostik-Leitplanken auf Basis dieses Pilot-Flows dokumentieren.
