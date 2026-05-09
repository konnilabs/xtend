# WP-E10-04 - RMT App Authoring Contract fuer vollstaendige XTend-Apps spezifizieren

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
- Backlog: `development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
- Contract: `xtend.epic10.wp04.rmt-first-class-app-authoring.v1`
- App Authoring Contract: `xtend.rmt.first-class-app-authoring.v1`
- Bezug:
  - `development/XTend-RMT-First-Class-App-Authoring.md`
  - `development/XTend-Component-Contract-v2.md`
  - `tests/fixtures/rmt-first-class-xtend-app.rmt`
  - `tests/rmt/rmt_first_class_app_authoring_suite.js`
  - `docs/xtendrmt-app-dsl.md`
  - `docs/xtendrmt-native-authoring.md`
  - `xtend-builder/scaffold.config.js`
  - `package.json`

## Ziel

`WP-E10-04` spezifiziert, wie vollstaendige XTend-Apps in RMT authored werden. Damit wird RMT nicht nur Template- oder Routing-Fragment, sondern das App-Authoring-Modell fuer Shell, Routen, Komponenten, Slots, Events, Commands, Hydration, Schedules, Lanes, Fabric und Diagnostics.

## Umsetzung

Erstellt wurden:

| Artefakt | Zweck |
|----------|-------|
| `development/XTend-RMT-First-Class-App-Authoring.md` | akzeptierter App-Authoring-Contract |
| `tests/fixtures/rmt-first-class-xtend-app.rmt` | vollstaendiges RMT-first XTend-App-Fixture |
| `tests/rmt/rmt_first_class_app_authoring_suite.js` | lokaler Gate fuer Fixture, Registry und Metadaten |

Aktualisiert wurden:

- `package.json` mit `xtend.rmtFirstClassAppAuthoring` und `test:rmt-first-class-app`
- `xtend-builder/scaffold.config.js` mit `rmtFirstClassAppAuthoring`
- `scripts/run_xtend_tests.js` mit Suite `rmt-first-class-app`
- Epic 10 und Backlog mit abgeschlossenem `WP-E10-04`
- Referenzregister und Reference-Gate
- RMT-Dokumentation mit dem App-Authoring-Contract-Hinweis

## Entscheidungen

Pflichtdomains fuer First-Class XTend Apps:

- `manifest`
- `adapters`
- `components`
- `routes`
- `schedules`
- `templates`

Pflichtadapter:

- `xtend.component`
- `xtend.xrouter`
- `rmt.state-scheduler-diagnostics`

Pflichtprinzipien:

- Shell-first Rendering
- native RMT Top-Level-Domains
- `dom_descriptor` als bevorzugter Template-Modus
- Event-to-command Binding ohne Inline-JS
- Schedules als zentrale Policies
- XTend Component Contract v2 als Component-Surface
- RMT Kernel Boundary `no-rmt-kernel-import-of-xtend-types`

## Nicht umgesetzt in diesem Paket

- keine produktive Demo-App
- kein neuer RMT-Kernel-Code
- keine XRouter Runtime-Aenderung
- keine Fabric Runtime-Aenderung
- keine TypeScript-Komponentenmigration

Diese Punkte folgen in `WP-E10-05`, `WP-E10-07`, `WP-E10-12`, `WP-E10-13` und `WP-E10-15`.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| RMT-first App Authoring Contract liegt vor | erfuellt: `development/XTend-RMT-First-Class-App-Authoring.md` |
| vollstaendiges RMT-App-Fixture liegt vor | erfuellt: `tests/fixtures/rmt-first-class-xtend-app.rmt` |
| Fixture normalisiert und erzeugt Runtime Registries | erfuellt |
| Shell-first Rendering ist beschrieben | erfuellt |
| Component Contract v2 ist referenziert | erfuellt |
| Kernel Boundary ist sichtbar | erfuellt: `no-rmt-kernel-import-of-xtend-types` |
| lokaler Gate ist vorhanden | erfuellt: `rmt-first-class-app` |

## Verifikation

Durchgefuehrte lokale Gates:

```bash
node --check tests/rmt/rmt_first_class_app_authoring_suite.js
node --check scripts/run_xtend_tests.js
node --check xtend-builder/scaffold.config.js
node --check tests/references/reference_path_suite.js
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json ok')"
node -e "JSON.parse(require('fs').readFileSync('tests/fixtures/rmt-first-class-xtend-app.rmt','utf8')); console.log('fixture ok')"
node scripts/run_xtend_tests.js rmt-first-class-app --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js rmt-compatibility --json
```

Ergebnis: alle Gates bestanden. Der neue `rmt-first-class-app` Gate validiert 3 Routes, 8 Components, 5 Templates und 8 Schedules gegen `xtend.rmt.first-class-app-authoring.v1`.

## Ergebnis

`WP-E10-04` ist abgeschlossen. XTend besitzt nun einen RMT-first App Authoring Contract fuer vollstaendige XTend-Apps, inklusive Shell-first-Rendering, nativen Routes/Components/Templates/Schedules, XRouter- und XTend-Adaptergrenzen sowie einem lokalen Fixture-Gate.
