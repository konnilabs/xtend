# WP-E05-14 - Bestcase-Demo auf native Routes und Components migrieren

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
- Backlog: `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
- Bezug:
  - `development/WP-E05-08-DSL-Normalisierung-und-Backward-Compatibility-sichern.md`
  - `development/WP-E05-09-Route-Registry-und-Component-Registry-vorbereiten.md`
  - `development/WP-E05-10-XRouter-Adapter-produktfaehig-implementieren.md`
  - `development/WP-E05-11-XTend-Component-Adapter-produktfaehig-implementieren.md`
  - `development/WP-E05-12-State-Scheduler-und-Diagnostics-Bridge-anbinden.md`
  - `development/WP-E05-13-Build-Pipeline-und-Artefakt-Paritaet-fuer-XTendRMT-absichern.md`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `xtendrmt/xtendrmt-bestcase-demo.js`
  - `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-14` migriert die XTendRMT Bestcase-Demo von Legacy-Pilotdaten in `manifest.metadata` auf native RMT-Domains. Die Demo bleibt eine lokale Regression- und Produktreferenz, nutzt aber nicht mehr eigene dauerhafte Routing-/Component-Bridge-Logik.

Damit wird das Zielbild aus Epic 05 sichtbar:

- RMT kennt XTend weiterhin nicht als Kernel-Abhaengigkeit
- native `routes` beschreiben XRouter-Ziele ueber Adapter-Refs
- native `components` beschreiben XTend Custom Elements als Adapterdaten
- native `schedules` treiben Route-, Component-, Template- und Diagnostics-Arbeit
- produktive Adapter-Factories uebernehmen Mapping, Registrierung, Hydration, State und Diagnostics

## Migrierte RMT-Domains

Die Demo-Datei `xtendrmt/xtendrmt-bestcase-demo.rmt` fuehrt die operativen Records jetzt als Top-Level-Domains:

- `adapters`
- `components`
- `routes`
- `schedules`
- `templates`

`manifest.metadata` bleibt fuer Handoff-, Authoring-, Host-Capability- und Demo-Migrations-Metadaten zustaendig. Es enthaelt keine operative Route-, Component- oder Schedule-Quelle mehr.

Das neue Metadatum `nativeDemoMigration` dokumentiert den produktiven Demopfad:

```text
xtend.rmt.native-demo-migration.v1
```

## Native Routes

Die Demo-Routen tragen nun jeweils:

- `router: "xtend.xrouter"`
- `component` als stabile Component-ID und Custom-Element-Tag
- `template` als RMT Template-Ref
- `schedule` als native Schedule-Policy-Ref
- optionale Route-Metadaten unter `metadata`

Die Route-Component-IDs wurden bewusst mit ihren Custom-Element-Tags synchronisiert, zum Beispiel:

```text
x-rmt-route-template-pilot
```

Damit kann RMT die Route host-neutral als Component-Ref fuehren, waehrend XRouter dasselbe Feld direkt als Custom-Element-Tag rendern kann.

## Native Components

Die Demo-Components liegen in der nativen `components` Domain. Neben den sichtbaren XTend-Bausteinen wie `kernel.cards`, `feedback.status` und `pilot.shell` sind auch die Route-Komponenten selbst als XTend Component Records modelliert.

Der produktive XTend Component Adapter kann dadurch:

- Component Records aus der Runtime Registry mappen
- Manifest- und Custom-Element-Verfuegbarkeit diagnostizieren
- bestehende Route-Komponenten hydrieren
- Adapter Results mit `scheduleRef` an die Bridge weitergeben

## Produktive Adapterpfade

`xtendrmt/xtendrmt-bestcase-demo.js` verwendet nun die produktiven Factories aus dem XTendRMT Runtime-Artefakt:

- `createRmtFormat`
- `createRmtXRouterAdapter`
- `createRmtXtendComponentAdapter`
- `createRmtStateSchedulerDiagnosticsBridge`

Der Demo-Flow lautet:

1. `.rmt` Dokument laden
2. Dokument mit `createRmtFormat().normalizeDocument()` normalisieren
3. Runtime Registries mit `createRuntimeRegistries()` erzeugen
4. XRouter-Adapter gegen das echte `<x-router>` Ziel initialisieren
5. XTend Component Adapter gegen `customElements` und Demo-Manifest initialisieren
6. State-/Scheduler-/Diagnostics-Bridge gegen `xstate` und RMT Runtime initialisieren
7. Routen ueber `registerRoutes()` registrieren
8. Component Records ueber `registerComponent()` vorbereiten
9. Route-Wechsel ueber Adapter Results, Schedule Policies und `xstate` spiegeln

Die vorherige dauerhafte Logik, die `x-route` Elemente direkt aus Demo-Metadaten erzeugt hat, ist damit durch produktive Adapter-Registrierung ersetzt.

## Kernel Boundary

Die Migration verschiebt keine XTend- oder XRouter-Abhaengigkeit in den RMT Kernel.

RMT bleibt zustaendig fuer:

- Dokumentnormalisierung
- Domain Records
- Registry-Snapshots
- Schedule Policies
- Adapter Result Contracts

XTend/XRouter/Host bleiben zustaendig fuer:

- Custom Elements
- DOM-Mounting und Hydration
- URL-/Hash-Navigation
- `xstate`-Spiegelung
- sichtbare Demo-UI

## Test- und Referenzanpassung

Die lokalen Gates pruefen jetzt den nativen Demo-Pfad:

- RMT-Demo liest `routes`, `components`, `adapters` und `schedules` aus Top-Level-Domains
- Normalizer meldet fuer die Demo keine Legacy-Metadata-Promotion mehr
- Demo-JS verwendet die produktiven Adapter-Factories
- Referenz-Gates klassifizieren die native Demo-Migration als abgeschlossenen Epic-05-Schritt

## Verifikation

Mindestgates:

```bash
node --check xtendrmt/xtendrmt-bestcase-demo.js
node scripts/verify_xtendrmt_artifact_parity.js --json
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`WP-14` ist abgeschlossen. Die Bestcase-Demo nutzt native RMT Domains, produktive XRouter-/XTend-Component-Adapter und die State-/Scheduler-/Diagnostics-Bridge. Die Demo bleibt host-neutral und framework-agnostisch: XTend UI ist First-Class Citizen ueber Adapterqualitaet, nicht ueber Kernel-Kopplung.
