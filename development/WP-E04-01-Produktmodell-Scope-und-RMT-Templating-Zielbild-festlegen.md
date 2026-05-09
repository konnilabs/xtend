# WP-E04-01 - Produktmodell, Scope und RMT-Templating-Zielbild festlegen

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
- Backlog: `development/BACKLOG-EPIC-04-XTendRMT-DSL-Templating-und-Kompatibilitaetsvorbereitung.md`
- Bezug:
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `development/EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `development/XTend-Scaffold-Extension-Points.md`
  - `xtend-builder/typing/component-types.js`
  - `xtend-builder/extensions/component-extension-points.js`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E04-01` legt Produktmodell, Scope und RMT-Templating-Zielbild fuer Epic 04 verbindlich fest. Das Paket entscheidet nicht die produktive Bridge und implementiert keine DSL-Runtime. Es schafft die Architekturgrenze, an der die folgenden Workpackages XTend RMT-kompatibel vorbereiten.

## Umgesetzte Artefakte

- Epic 04 auf das Produktmodell `XTend UI + XTendRMT` geschaerft
- Epic-04-Backlog als operative Workpackage-Struktur angelegt
- Kernspannungsfeld als verbindliche Leitplanke dokumentiert
- Reference-Gates fuer Epic 04, Backlog und WP-01 ergaenzt
- `WP-02` als naechstes startbares Paket vorbereitet

## Produktentscheidung

| Produkt | Rolle | Scope in Epic 04 |
|---------|-------|------------------|
| XTend UI | UI Builder / Web Component Produkt | RMT-kompatible Host-, Component-, Template-, Lifecycle-, State-, Theme-, API-, Manifest- und Scaffold-Contracts vorbereiten |
| XTendRMT | Scheduler und Templating Engine | RMT als kanonisches XTend-Templating-Zielmodell behandeln und upstream DSL-Gaps sichtbar machen |
| XTendRMT Bridge | spaetere Integrationsschicht | in Epic 04 nur vorbereiten; produktive Bridge, natives Routing und XRouter Adapter bleiben Epic 05 |

RMT ist damit der kanonische Template-Pfad fuer XTend. XTend fuehrt keine zweite eigene Templating-DSL neben RMT ein.

## Kernspannungsfeld

Die zentrale Architekturspannung lautet:

- XTendRMT weiss nichts von XTend, kann XTend-Arbeit aber schedulen.
- RMT kann XTend-Templates konstruieren und XRouter-Routen bauen, ohne dass XTend in RMT eingebettet ist.

Diese Spannung ist gewollt. Sie wird nicht durch Kernel-Kopplung geloest, sondern durch neutrale RMT-Records und einen XTend Host Adapter:

- Der RMT Kernel sieht abstrakte Domains wie `components`, `templates`, `routes`, `schedules`, `actions`, `roots` und `capabilities`.
- XTend-Artefakte werden in RMT ueber Adapter-IDs wie `xtend.component` und spaeter `xtend.xrouter` referenziert.
- Der XTend Host Adapter uebersetzt diese Records in Manifest-Lookups, Custom-Element-Mounts, Slot-Fuellung, Event-Bridges, `xstate`-Spiegelung, Theme-/API-Zugriff und XRouter-Konfiguration.
- Scheduler-Endpoints bleiben abstrakt. Der Scheduler plant Arbeit; der Host Adapter fuehrt sie im konkreten UI-System aus.

## Scope-Entscheidung

### In Epic 04 vorzubereiten

- XTend Host-Capability-Modell fuer RMT
- XTend Component Attachment fuer `xtend.component`
- RMT Template Authoring Model fuer XTend UI
- Root-Lifecycle- und Scheduler-Handshakes fuer XTend Roots
- Scaffold-, Typing-, Extension-, Preview- und Test-Anschluss fuer RMT-Kompatibilitaet
- Handoff-Spezifikation fuer upstream XTendRMT DSL und Epic 05

### Nicht in Epic 04 umzusetzen

- produktive XTendRMT Bridge-Runtime
- native RMT Routing Domain als produktive Runtime
- produktiver XRouter Adapter
- RMT-Kernelwissen ueber XTend-Tags, XTend-Manifest, `xstate`-Keys oder XRouter-Klassen
- manuelle Patch-Arbeit an generierten XTendRMT-Bundles als Architekturquelle
- neue XTend-eigene Template-Sprache neben RMT

## Templating-Zielbild

XTend-Templating wird als RMT-Authoring verstanden:

- `.rmt` Dokumente beschreiben Templates, Components, Routes, Schedules und Host Capabilities.
- XTend-Komponenten werden als Component Records mit Adapter-ID beschrieben.
- Slots, Props, Attributes, Events und State Bridges bleiben deklarierbare Records.
- Der RMT Scheduler plant Mounting, Hydration, sichtbare Aktivierung, Idle-Arbeit und Diagnostics ueber abstrakte Policies.
- Die XTend-Ausfuehrung passiert im Host Adapter, nicht im RMT Kernel.

Damit bleibt XTend UI ein First-Class Host fuer RMT, waehrend XTendRMT framework-agnostisch bleibt.

## Arbeitsgrenzen fuer Folgepakete

| Folgepaket | Startpunkt aus WP-01 |
|------------|----------------------|
| `WP-02` | Schema-, Demo- und DSL-Gap gegen Kernel/DSL/Adapter-Grenze analysieren |
| `WP-03` | XTend Component Contract aus neutralem RMT Component Record ableiten |
| `WP-04` | Template Authoring fuer XTend UI ohne neue XTend-Syntax beschreiben |
| `WP-05` | Scheduler- und Lifecycle-Handshakes als abstrakte Endpoints definieren |
| `WP-06` | Host Capabilities explizit und optional modellieren |
| `WP-11` | upstream-Handoff fuer DSL-Ergonomie und Epic-05-Bridge vorbereiten |

## Risiken und Gegenmassnahmen

| Risiko | Gegenmassnahme |
|--------|----------------|
| XTend wandert als implizite Abhaengigkeit in den RMT Kernel | Kernel darf nur neutrale Records, Adapter-IDs und Capabilities kennen |
| RMT bleibt zu lange Template-only und versteckt Komponenten/Routing in Metadata | `WP-02` analysiert Domain-Gaps und trennt DSL-Record von Metadata-Ausweichpfad |
| XRouter wird als Kernel-Feature missverstanden | XRouter bleibt Adapter-Implementierung; Routes werden neutral vorbereitet |
| Scaffold-Contracts bleiben zu abstrakt | `WP-07` muss RMT-Kompatibilitaet maschinenlesbar in Typing/Extensions/Preview sichtbar machen |
| upstream muss spaeter XTend-Grundlagen refactoren | Epic 04 liefert Host-, Component-, Lifecycle- und Test-Contracts vor dem Bridge-Bau |

## Lokaler Testpfad

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`WP-E04-01` ist abgeschlossen. Das Produktmodell, der Scope und das RMT-Templating-Zielbild sind verbindlich dokumentiert. `WP-E04-02` kann mit der RMT-Schema-, Demo- und DSL-Gap-Analyse starten.
