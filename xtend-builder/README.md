# XTend-Scaffold

`XTend-Scaffold` ist das repo-lokale Build-Environment fuer kuenftige XTend-Generatoren. Epic 03 hat es als generator-only, dry-run-first Scaffold abgeschlossen; Epic 17 baut daraus einen dry-run-first, aber produktiv schreibfaehigen Buildpfad.

## Local Entry Points

```bash
xt --help
xt validate --json
xt component-files --tag x-example --profile display --json
xtend validate --json
xtend-scaffold verify --json
node xtend-builder/scaffold.js --help
node xtend-builder/scaffold.js layout
node xtend-builder/scaffold.js layout --json
node xtend-builder/scaffold.js blueprint --json
node xtend-builder/scaffold.js generators --json
node xtend-builder/scaffold.js templates --json
node xtend-builder/scaffold.js component-plan --tag x-example --profile display --json
node xtend-builder/scaffold.js component-files --tag x-example --profile display --json
node xtend-builder/scaffold.js component-files --tag x-example --profile display --write --json
node xtend-builder/scaffold.js component-files --tag x-example --profile display --check --json
node xtend-builder/scaffold.js typing --tag x-example --profile display --json
node xtend-builder/scaffold.js preview --tag x-example --profile display --json
node xtend-builder/scaffold.js extensions --tag x-example --profile display --json
node xtend-builder/scaffold.js rmt-build --source xtendrmt/rmt-lifecycle-demo.rmt --write --json
node xtend-builder/scaffold.js workflow --json
node xtend-builder/scaffold.js verify --json
node scripts/run_xtend_tests.js rmt-compatibility --json
npm run scaffold -- layout
npm run scaffold:workflow
npm run scaffold:verify
npm run scaffold:dry-run
npm run scaffold:typing
npm run scaffold:preview
npm run scaffold:extensions
```

`xt` ist der kurze lokale CLI-Alias fuer dieselbe Scaffold-Implementierung wie `xtend` und `xtend-scaffold`. `validate` ist ein stabiler Alias fuer `verify`, damit lokale Gates kurz als `xt validate --json` aufgerufen werden koennen.

## Projektlayout

| Bereich | Pfad | Grenze |
|---------|------|--------|
| CLI | `xtend-builder/scaffold.js` | lokaler Einstieg fuer Hilfe, Layout und spaetere Generatorbefehle |
| CLI-Modul | `xtend-builder/lib/cli.js` | Argumentauswertung und Dispatch ohne Schreiblogik |
| Layout-Contract | `xtend-builder/lib/layout.js` | maschinenlesbare Struktur fuer Docs, Tests und CLI |
| Blueprints | `xtend-builder/blueprints/` | Komponenten-Blueprint und Artefaktcontract |
| Generators | `xtend-builder/generators/` | Generator-Registry, Component-Plan und dry-run Component-Files |
| Templates | `xtend-builder/templates/` | Template-Registry, Ladepfad und konkrete Pflichtartefakt-Templates |
| Wiring | `xtend-builder/wiring/` | Manifest-, Hydrations- und Feature-Contracts fuer dry-run Component-Files |
| Typing | `xtend-builder/typing/` | Type-Contracts fuer `.d.ts` Artefakte und vorbereiteten XTendRMT-Anschluss |
| Preview | `xtend-builder/preview/` | Preview- und Referenzpfad-Contracts fuer scaffolded Demo-Plaene |
| Extensions | `xtend-builder/extensions/` | Extension-Point-Contracts fuer Templating, Rendering und Root-Lifecycle |
| A11y | `xtend-builder/a11y/` | A11y- und Screenreader-Signal-Profilplan fuer neue Komponenten, Fixtures, Docs, Tests, Types und Manifest |
| Performance | `xtend-builder/performance/` | Performance-Profilplan fuer neue Komponenten, Budgets, Lanes, Hydration und Gates |
| Workflows | `xtend-builder/workflows/` | lokale Dry-Run-, Verify- und Reporting-Schrittfolgen |
| Utils | `xtend-builder/utils/` | pure Helfer fuer Naming, Tokenersetzung und Validierung |
| Writing | `xtend-builder/writing/` | zentraler WritePlan, strukturierte Patcher und kontrollierte Dateischreibpfade fuer produktive Scaffold-Builds |
| Config | `xtend-builder/scaffold.config.js` | zentrale Profile, Pfade, Testpflicht und Tooling-Entscheidung |

## Modulgrenzen

- `lib/` darf CLI-, Layout- und spaeter reine Orchestrierungslogik enthalten.
- `blueprints/` beschreibt Zielartefakte und Contracts, erzeugt aber nichts selbst.
- `generators/` enthaelt ab `WP-E03-11` Plan-, Render-, Typing-, Preview- und Extension-Contract-Generatorlogik.
- `templates/` enthaelt ab `WP-E03-05` konkrete Ausgabetemplates fuer Komponente, Doku, Tests, Fixture, Types und Manifest-Patch-Plan.
- `wiring/` enthaelt ab `WP-E03-07` reine Builder-Contracts fuer Manifest-Patchplaene, Hydration-Mindestpfade und profilbasierte Feature-Wiring-Patterns.
- `typing/` enthaelt ab `WP-E03-09` reine Type-Contracts fuer oeffentliche APIs, Events, Attribute und vorbereitete XTendRMT-Adapter-Anbindung.
- `preview/` enthaelt ab `WP-E03-10` reine Preview- und Reference-Gate-Contracts fuer scaffolded Komponenten.
- `extensions/` enthaelt ab `WP-E03-11` reine Extension-Point-Contracts fuer Templating, Rendering und Root-Lifecycle.
- `a11y/` enthaelt ab `ER-WP-23` reine A11y-Profilplaene nach `xtend.a11y.profile.v1`; ab `ER-WP-25` haengt es `xtend.a11y.screenreader-signals.v1` fuer Live-Region-, Status- und Error-Signale an; ab `ER-WP-26` haengt es `xtend.a11y.motion-contrast-policy.v1` fuer Reduced Motion und High Contrast an. Die Schicht erzeugt keine Runtime, sondern verpflichtet neue Artefakte auf Rolle, Namen, Fokus, Keyboard, ARIA, Screenreader, Reduced Motion und Kontrast.
- `performance/` enthaelt ab `ER-WP-21` reine Performance-Profilplaene nach `xtend.performance.component-profile.v1`; sie erzeugen keine Runtime, sondern verpflichten neue Artefakte auf Budgetklasse, Lane, Hydration Policy, Messpunkte und lokale Gates.
- `workflows/` enthaelt ab `WP-E03-08` lokale Dry-Run- und Verify-Contracts ohne Schreibzugriff.
- `utils/` enthaelt nur seiteneffektarme Helfer; Schreibstrategien muessen dry-run-first bleiben.
- `writing/` enthaelt ab `WP-E17-01` den zentralen WritePlan und Writer fuer kontrollierte Dateioperationen. Produktive Buildbefehle duerfen darueber schreiben, muessen aber weiterhin dry-run-first, reportbar und root-begrenzt bleiben.
- `component-files --write` nutzt ab `WP-E17-02` das Sidecar `.xtend-build/scaffold-ownership.json` nach `xtend.scaffold.generated-ownership.v1`, damit generierte Dateien idempotent aktualisiert und unowned Dateien ohne `--force` blockiert werden.
- `manifest-patcher.js` patcht ab `WP-E17-03` `components/manifest.json` als echtes JSON nach `xtend.scaffold.manifest-patcher.v1` und schreibt stabile Build Reports nach `.xtend-build/component-files/`.
- `rmt-build` uebersetzt ab `WP-E17-04` RMT vNext Templates in Core JSON, XTend Custom Element, App-Modul, HTTP-Host, Browser-Smoke-Fixture und Scaffold Report.

## Aktueller Stand

Epic 03 ist abgeschlossen. `WP-E03-02` definiert Struktur und Entry Points. `WP-E03-03` definiert den Komponenten-Blueprint und Artefaktcontract. `WP-E03-04` definiert Generator-Registry, Template-Ladepfad, Eingabevalidierung und Plan-Ausgabe. `WP-E03-05` rendert daraus echte Pflichtartefakt-Inhalte im Dry-Run-Modus. `WP-E03-06` ergaenzt deterministisches Manifest-Wiring und den Hydration-Mindestcontract ohne externe Importquellen. `WP-E03-07` ergaenzt State-, API- und Feature-Wiring-Patterns nach Core-Contract. `WP-E03-08` standardisiert lokale Dry-Run-, Verify- und Reporting-Workflows. `WP-E03-09` standardisiert Typ-Artefakte und den vorbereiteten Template-/XTendRMT-Anschluss. `WP-E03-10` bindet Preview- und Referenzpfade an die lokale Reference-Suite an. `WP-E03-11` bereitet Templating-, Rendering- und Root-Lifecycle-Extension-Punkte als Dry-Run-Contract vor. `WP-E03-12` nimmt den Epic gegen KPI, Testpflicht und Erweiterbarkeit final ab. Epic 04 / `WP-E04-08` fuehrt den dedizierten `rmt-compatibility` Gate fuer RMT-kompatible Scaffold-Artefakte ein. `ER-WP-21` erweitert die Scaffold-Ausgaben um Performance-Profilpflichten nach `xtend.performance.component-profile.v1`; `ER-WP-23` erweitert sie um A11y-Profilpflichten nach `xtend.a11y.profile.v1`; `ER-WP-25` fuegt Screenreader-Signal-Contracts nach `xtend.a11y.screenreader-signals.v1` hinzu; `ER-WP-26` fuegt Motion-/Contrast-Policies nach `xtend.a11y.motion-contrast-policy.v1` hinzu.
