# WP-E05-15 - Contract-, Schema- und Runtime-Tests erweitern

- Status: `completed`
- Datum: 5. Mai 2026
- Epic: `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
- Backlog: `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
- Bezug:
  - `development/WP-E05-08-DSL-Normalisierung-und-Backward-Compatibility-sichern.md`
  - `development/WP-E05-09-Route-Registry-und-Component-Registry-vorbereiten.md`
  - `development/WP-E05-10-XRouter-Adapter-produktfaehig-implementieren.md`
  - `development/WP-E05-11-XTend-Component-Adapter-produktfaehig-implementieren.md`
  - `development/WP-E05-12-State-Scheduler-und-Diagnostics-Bridge-anbinden.md`
  - `development/WP-E05-13-Build-Pipeline-und-Artefakt-Paritaet-fuer-XTendRMT-absichern.md`
  - `development/WP-E05-14-Bestcase-Demo-auf-native-Routes-und-Components-migrieren.md`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/fixtures/rmt-app-dsl.native-bridge.rmt`
  - `scripts/run_xtend_tests.js`

## Ziel

`WP-15` haertet die produktive XTendRMT Bridge lokal ab. Die Tests pruefen nicht mehr nur einzelne Contracts, sondern einen nativen `.rmt` Flow aus `adapters`, `components`, `routes`, `schedules` und `templates`.

Der Fokus bleibt bewusst host-neutral:

- RMT normalisiert und indiziert native Domains
- XRouter wird ueber den Router Adapter angesprochen
- XTend Components werden ueber den Component Adapter gemappt, gemountet und hydriert
- Schedule Policies werden ueber die State-/Scheduler-/Diagnostics-Bridge ausgefuehrt
- Template-only-Dokumente bleiben weiterhin im Gate

## Neue Native Bridge-Fixture

Die neue Fixture `tests/fixtures/rmt-app-dsl.native-bridge.rmt` traegt das Contract-Metadatum:

```text
xtend.rmt.wp15.native-bridge-fixture.v1
```

Sie beschreibt zwei Routen, zwei XTend Component Records, drei Adapter Records und vier Schedule Policies. Damit wird sichtbar, dass native RMT-Domains zusammenspielen koennen, ohne XTend oder XRouter in den RMT Kernel einzubetten.

## Erweiterte RMT-Kompatibilitaetssuite

`tests/rmt/rmt_compatibility_suite.js` prueft nun zusaetzlich:

- native Bridge-Fixture normalisiert ohne DSL-Diagnostics
- Runtime Registries loesen required Routes und Components sauber auf
- XRouter Adapter mappt und registriert zwei native Routes
- XTend Component Adapter mappt, registriert, mountet und hydriert native Components
- State-/Scheduler-/Diagnostics-Bridge spiegelt Route- und Component-Adapter-Results nach `xstate`
- Schedule Policies loesen `xtendrmt.route.render` und `xtendrmt.component.hydrate` aus
- ESM Runtime Bundle stellt die produktiven Adapter-Factories bereit
- Browser-Bundle laesst sich browsernah im VM-Sandbox pruefen

Der Runner beschreibt den `rmt-compatibility` Gate jetzt als Schema-, native-domain-, Adapter- und browser-nahen Runtime-Gate.

## Kernel Boundary

Die Testhaertung fuehrt keine neue Runtime-Kopplung ein.

Die RMT-Seite wird nur als Artefakt-API geprueft:

- `createRmtFormat`
- `createRuntimeRegistries`
- `createRmtXRouterAdapter`
- `createRmtXtendComponentAdapter`
- `createRmtStateSchedulerDiagnosticsBridge`

Alle Host-Abhaengigkeiten bleiben fake Targets:

- Fake XRouter Target
- Fake DOM Target
- Fake CustomElements Registry
- Fake `xstate`
- Fake Scheduler
- Fake Diagnostics Hub

Damit bleibt die spaetere echte Browser-Regression ein separates `WP-16`, waehrend `WP-15` bereits den produktiven Bridge-Contract deterministisch absichert.

## Dokumentations- und Fixture-Register

Aktualisiert wurden:

- `tests/fixtures/README.md`
- `tests/fixtures/fixtures.md`
- `tests/rmt/README.md`
- `tests/README.md`
- `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
- `tests/references/reference_path_suite.js`

## Verifikation

Mindestgates:

```bash
node --check tests/rmt/rmt_compatibility_suite.js
node --check scripts/run_xtend_tests.js
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`WP-15` ist abgeschlossen. Die lokale RMT-Kompatibilitaetssuite deckt alte Template-only-Dokumente, native App-DSL-Dokumente, die migrierte Bestcase-Demo und eine native Bridge-Fixture ab. Produktive Adapter-, Registry- und Bridge-Regressionen sind nun im Default-Testpfad sichtbar; `WP-16` und `WP-17` koennen darauf aufbauen.
