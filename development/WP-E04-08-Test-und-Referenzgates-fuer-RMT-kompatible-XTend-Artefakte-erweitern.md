# WP-E04-08 - Test- und Referenzgates fuer RMT-kompatible XTend-Artefakte erweitern

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
- Backlog: `development/BACKLOG-EPIC-04-XTendRMT-DSL-Templating-und-Kompatibilitaetsvorbereitung.md`
- Bezug:
  - `development/WP-E04-07-Scaffold-Typing-und-Extension-Contracts-an-RMT-Kompatibilitaet-anbinden.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `development/XTend-Test-Reporting-und-CI-Vorbereitung.md`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/rmt/README.md`
  - `tests/references/reference_path_suite.js`
  - `scripts/run_xtend_tests.js`
  - `package.json`
  - `xtend-builder/scaffold.config.js`
  - `xtend-builder/typing/component-types.js`
  - `xtend-builder/preview/component-preview.js`
  - `xtend-builder/extensions/component-extension-points.js`
  - `xtend-builder/generators/component-files.js`
  - `xtend-builder/workflows/developer-workflow.js`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`

## Ziel

`WP-E04-08` macht RMT-kompatible XTend-Artefakte als eigenen lokalen Gate pruefbar. Das allgemeine `references` Gate bleibt fuer Dokumentations- und Demo-Klassifikation zustaendig. Der neue Gate prueft enger, ob die RMT-Kompatibilitaetscontracts aus `WP-E04-07` in Scaffold, RMT-Schema, Bestcase-Demo und Workflow konsistent bleiben.

Der maschinenlesbare Binding-Contract bleibt `xtend.scaffold.rmt-compatibility-binding.v1`.

Der neue Runner-Gate heisst:

```bash
node scripts/run_xtend_tests.js rmt-compatibility
node scripts/run_xtend_tests.js rmt-compatibility --json
npm run test:rmt-compatibility
```

## Umgesetzte Artefakte

- neue Suite `tests/rmt/rmt_compatibility_suite.js`
- neue Dokumentation `tests/rmt/README.md`
- Runner-Anschluss `rmt-compatibility` in `scripts/run_xtend_tests.js`
- NPM-Script `test:rmt-compatibility`
- Scaffold-Konfiguration mit `rmtCompatibility.minimumGate: node scripts/run_xtend_tests.js rmt-compatibility --json`
- `rmt-compatibility` als Required Suite in `xtend-builder/scaffold.config.js`
- Typing-, Preview-, Demo-Plan- und Workflow-Ausgaben mit dediziertem RMT-Kompatibilitaetsgate
- RMT-Schema- und Bestcase-Demo-Metadaten mit dediziertem Gate
- Reference-Gate-Anschluss fuer WP-08-Dokument, Runner, README und Statusuebergang

## Gate-Entscheidung

`rmt-compatibility` ist ein statischer Contract-Gate. Er fuehrt keine XTendRMT Runtime aus, registriert keine Routes und validiert keine produktive Bridge. Das ist Absicht: Epic 04 bereitet die Kompatibilitaet vor, Epic 05 baut die produktive Bridge.

| Prueffeld | Pruefziel |
|-----------|-----------|
| Scaffold Config | `rmtCompatibility`, Required Suites, Full Gate und Minimum Gate |
| Typing | `rmtCompatibility`, Contract-Refs, Adapter-Refs, Boundaries und dedizierter Gate |
| Preview | Preview-Compatibility, Local-Only-Regeln und Gate-Vererbung |
| Extension-Punkte | `rmtCompatibilityBinding`, Manifest-/Preview-/Extension-Anforderungen und Runtime-Grenzen |
| Component-Files | Manifest-Plan, `.d.ts`, Docs, Demo-Plan und externe URL-Freiheit |
| RMT Schema | `x-xtendrmt.scaffoldCompatibilityBindings` |
| RMT Demo | `manifest.metadata.scaffoldCompatibility` mit `kernelVisible: false` |
| Workflow | Verify-Plan, Package Script und Runner-Registrierung |

## Test-Szenarien

Die Suite prueft bewusst mehr als ein Profil:

- `x-example` mit Profil `routing` und Feature `state`
- `x-rmt-card` mit Profil `stateful` und Feature `events`

Damit werden Routing-/XRouter-Adapterdaten und stateful Event-Artefakte gemeinsam gegen denselben RMT-Kompatibilitaetscontract geprueft.

## Boundaries

Der Gate akzeptiert nur Dry-Run- und Handoff-Verhalten:

- keine Runtime-Imports in `.d.ts`
- keine produktiven Schreibpfade
- keine Route-Registrierung
- kein `.rmt` Template-Parser
- keine XTend-Abhaengigkeit im RMT Kernel
- keine externen URLs in generierten Nicht-Test-Artefakten
- Bridge Runtime bleibt `reserved-for-Epic-05`

## Reporting

`rmt-compatibility` nutzt denselben Runner-Report wie alle anderen Suites:

```bash
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js rmt-compatibility --report .xtend-test-results/rmt-compatibility-report.json
```

Der Report nutzt weiterhin Schema `xtend.test.report.v1`.

## Auswirkungen auf Folgepakete

| Folgepaket | Nutzung des WP-08-Gates |
|------------|--------------------------|
| `WP-E04-09` | kann Pilot-Flows gegen einen eigenen RMT-Kompatibilitaetsgate entwickeln |
| `WP-E04-10` | kann Migrations- und Framework-Agnostik-Regeln gegen klare Gate-Boundaries beschreiben |
| `WP-E04-11` | kann upstream-Handoff-Kriterien mit maschinenlesbaren Gate-Ergebnissen belegen |
| Epic 05 | kann produktive Bridge- und Routing-Tests zusaetzlich zu diesem statischen Gate aufbauen |

## Lokaler Testpfad

```bash
node --check tests/rmt/rmt_compatibility_suite.js
node --check scripts/run_xtend_tests.js
node --check xtend-builder/typing/component-types.js
node --check xtend-builder/preview/component-preview.js
node --check xtend-builder/workflows/developer-workflow.js
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`WP-E04-08` ist abgeschlossen. RMT-kompatible XTend-Artefakte besitzen nun einen eigenen lokalen Gate `rmt-compatibility`, der Scaffold-Bindings, RMT-Metadaten, Manifest-/Preview-/Extension-Planung und Verify-Workflow gemeinsam prueft. `WP-E04-09` kann einen Pilot-Flow fuer RMT-basiertes XTend-Templating abgesichert vorbereiten.
