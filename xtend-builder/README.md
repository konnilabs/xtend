# XTend Builder CLI

**English (primary)** | [Deutsch](#deutsch)

<a id="english"></a>

## English

`@ccslabs/xtend-cli` is the shared command-line interface for component scaffolding, RMT tooling, and Maraca builds in the XTend workspace. The executable names `xt`, `xtend`, and `xtend-scaffold` all point to the same implementation. `xtend-builder/scaffold.js` remains available as a compatible CommonJS entry point.

The builder is **dry-run-first**: plan and render commands do not write files by default. Productive writes must be enabled explicitly with `--write` and run through the central WritePlan with root, ownership, and conflict checks.

XTend Classic does not require this CLI: HTML- and JavaScript-first hosts can use `xtend-loader.js` and a local manifest directly. The Builder remains optional for Classic scaffolding and verification, while it owns the supported command path for compiler- and Maraca-based workflows. See the [XTend Classic guide](../docs/en/xtend-classic.md).

### Product surfaces and responsibilities

| Product surface | Builder responsibility |
|---|---|
| XTend Components | Plans and generates components, documentation, tests, fixtures, types, and manifest patches. |
| XTendRMT | Lints `.rmt` sources and builds core, app, host, diagnostics, and source-map artifacts. |
| Maraca | Plans, builds, and tunes loaderless modern ESM bundles from RMT sources. |
| XScaler | Connects the RMT/Maraca output path to the XScaler Preflight and ATC contract; the protocol API itself lives in `tools/rmt-language/xscaler-protocol.js`. |
| XSurface Shard | Accepts approved remote-surface plans on the server and emits XScaler ATC-compatible handoffs; the runtime lives in the separate `@ccslabs/xtend-xsurface-shard` package. |

XScaler and XSurface Shard are therefore not additional scaffold subcommands. They form an integration boundary of the generated RMT/Maraca product:

```text
RMT Remote Surface -> XScaler Preflight -> XSurface Shard / ATC-Handoff -> Maraca Runtime
```

Preflight remains side-effect-free and does not execute remote code. XSurface Shard does not load remote bundles either; the client runtime materializes only previously accepted surfaces. See the [XScaler protocol](../docs/en/xscaler-protocol.md) and [XSurface Shard documentation](../xsurface-shard/README.md) for details.

### Requirements and getting started

- Node.js 18 or newer
- From the repository: installed workspace dependencies
- As a package: the optional peer dependencies `@ccslabs/xtend` and `@ccslabs/xtend-compiler` for workflows that need them

```bash
npm install @ccslabs/xtend-cli
```

From the repository:

```bash
node xtend-builder/bin/xt --help
node xtend-builder/bin/xt validate --json
```

After installing the package, running `npm link` or `npm exec`, or adding `xtend-builder/bin` to `PATH`:

```bash
xt --help
xt validate --json
npx --no-install xt validate --json
```

`validate` is a stable alias for `verify`. The complete executable command overview is always available through:

```bash
node xtend-builder/scaffold.js --help
```

### Common workflows

#### Plan and generate a component

```bash
# Plan and render only
xt component-plan --tag x-example --profile display --feature state --json
xt component-files --tag x-example --profile display --feature state --json

# Write under safeguards or check for drift
xt component-files --tag x-example --profile display --feature state --write --json
xt component-files --tag x-example --profile display --feature state --check --json

# Inspect partial contracts separately
xt typing --tag x-example --profile display --feature state --json
xt preview --tag x-example --profile display --feature state --json
xt extensions --tag x-example --profile display --feature state --json
```

`component-files --write` tracks generated files through `.xtend-build/scaffold-ownership.json`. Existing files that are not owned by the builder are not overwritten without `--force`. Manifest changes are applied structurally to `components/manifest.json`; build reports are written below `.xtend-build/component-files/`.

#### Validate and build RMT

```bash
xt rmt lint app.rmt --json
xt rmt build app.rmt --json
node xtend-builder/scaffold.js rmt-build --source demos/xtendrmt/examples/lifecycle/source.rmt --write --json
node xtend-builder/scaffold.js rmt-app-platform \
  --source tests/fixtures/rmt-surface-resource-graph-runtime.rmt \
  --write --json
```

The generic `rmt-build` command emits core JSON, an XTend custom element, an app module, an HTTP host, a browser-smoke fixture, and a scaffold report. `rmt-app-platform` adds App Platform diagnostics and source maps.

#### Create an XTend Material Maraca app

```bash
# Inspect the eight-artifact plan without writing
xt create app --runtime maraca --design-kit material --out material-app --json

# Write under app-local ownership and verify scaffold idempotence
xt create app --runtime maraca --design-kit material --out material-app --write --json
xt create app --runtime maraca --design-kit material --out material-app --check --json

# Install, then build and serve
cd material-app
npm install
npm run serve
```

The explicit Material preset generates eight artifacts: RMT, CSS, an HTML host, a runtime host, the DEV API bridge, `maraca.config.json`, `package.json`, and a smoke test. `npm run serve` builds `dist/` first and then serves `site/index.html` through `xt serve`; use `xt serve --help` for host, port, root, default-document, check, and JSON options. Tailwind and the Maraca adapter are development-only dependencies, source discovery is explicit, and Preflight is disabled. Other presets are not routed through this generator and never activate Tailwind implicitly.

#### Build a Maraca bundle

```bash
xt maraca plan app.rmt --json
xt maraca build app.rmt --out dist --profile production --lazy route --css external --pwa --json
xt maraca tune app.rmt --config maraca.config.json --out dist --write --json

# The same bundle path under the RMT namespace
xt rmt build app.rmt --bundle maraca --out dist --json

# Serve the generated design-neutral HTML host
xt serve --root dist
```

Maraca compiles the RMT source, discovers the required XTend modules, and emits a loaderless ESM entry point plus `dist/index.html`. The generated host and `xt serve --root dist` work across Material and non-Material design lines. Profiles and bundling options are documented in the [Maraca documentation](../xtend-maraca/README.md).

#### Analyze and reproducibly build the kernel

```bash
xt kernel-lab analyze --json
xt kernel-lab build --profile clean --check --json
xt kernel-lab build --profile clean --version 0.4.0 --write --json
```

The `xt rmt kernel-lab ...` alias runs the same path. The `clean` profile builds the dashboard-free standard kernel artifacts and updates the RMT kernel module manifest.

#### Agent and automation output

All central inspect, plan, build, and verify paths support machine-readable JSON output:

```bash
xt layout --json
xt config --json
xt generators --json
xt templates --json
xt workflow --json
xt verify --json
xt rmt ai-kit export --profile compact --format md --json
```

### Command groups

| Group | Commands | Behavior |
|---|---|---|
| Inspection | `layout`, `config`, `blueprint`, `generators`, `templates` | Prints builder and contract metadata. |
| Components | `component-plan`, `component-files`, `typing`, `preview`, `extensions` | Plans, renders, and optionally writes component artifacts. |
| RMT | `rmt build`, `rmt lint`, `rmt ai-kit export`, `rmt-app-platform`, `rmt-lifecycle-demo` | Validates sources and emits app/tooling artifacts. |
| Maraca | `maraca plan`, `maraca build`, `maraca tune` | Creates and optimizes modern ESM app bundles. |
| Kernel | `kernel-lab analyze`, `kernel-lab build` | Analyzes and builds the RMT kernel. |
| Workflow | `workflow`, `verify`, `validate` | Prints local workflow and verification plans; `verify` does not run tests itself. |

### Verifying XScaler and XSurface Shard

The builder currently does not expose an `xt xscaler` command. Dedicated gates validate integrity across product boundaries:

```bash
npm run test:xscaler-protocol
npm run test:xscaler-source-to-sea
npm run test:xsurface-shard
```

`xscaler-protocol` validates the Preflight, remote-surface, XTension deployment, and ATC schemas. `xscaler-source-to-sea` follows the path from a remote manifest through security/degradation and Preflight to the XSurface Shard handoff. `xsurface-shard` validates planning, lifecycle behavior, and serializable stream fragments.

### Write and security model

- Without `--write`, a build remains a reviewable plan.
- `--check` reports drift without changing files.
- Productive commands write exclusively through `xtend-builder/writing/`.
- WritePlan restricts targets to allowed repository roots.
- Ownership metadata protects manually created files from accidental overwrites.
- Structured patchers update JSON artifacts deterministically instead of using text search.
- XScaler Preflight and XSurface Shard do not execute remote code and do not allow network access during SSR rendering.

### Package and module surface

The package exports the CommonJS CLI entry point, public builder types, and generator and template modules:

```js
const { runCli, runCliAsync } = require('@ccslabs/xtend-cli');
```

The package binaries are:

- `xt`
- `xtend`
- `xtend-scaffold`

XScaler and XSurface Shard are intentionally not part of this package's JavaScript exports. Use `@ccslabs/xtend-xsurface-shard` for XSurface Shard; the XScaler contract is currently an internal repository RMT-tooling API.

### Project layout

| Area | Path | Responsibility |
|---|---|---|
| CLI | `xtend-builder/bin/xt`, `xtend-builder/lib/cli.js` | Packaged entry point, argument parsing, and dispatch |
| Legacy entry point | `xtend-builder/scaffold.js` | Compatibility for existing Node.js scripts |
| Configuration | `xtend-builder/scaffold.config.js` | Profiles, paths, test obligations, and tooling decisions |
| Blueprints | `xtend-builder/blueprints/` | Component and artifact contracts |
| Generators | `xtend-builder/generators/` | Component, RMT, App Platform, and kernel plans |
| Templates | `xtend-builder/templates/` | Component and app output templates |
| Wiring | `xtend-builder/wiring/` | Manifest, hydration, and feature contracts |
| Typing | `xtend-builder/typing/` | Public types and RMT attachments |
| Preview / Extensions | `xtend-builder/preview/`, `xtend-builder/extensions/` | Reference paths and extension points |
| Quality profiles | `xtend-builder/a11y/`, `xtend-builder/performance/` | Accessibility and performance obligations for generated artifacts |
| Workflows | `xtend-builder/workflows/` | Dry-run and verification plans |
| Writing | `xtend-builder/writing/` | WritePlan, ownership, reports, and structured patchers |
| Utilities | `xtend-builder/utils/` | Low-side-effect validation and naming helpers |

The machine-readable version of the layout is available through:

```bash
node xtend-builder/scaffold.js layout --json
```

### Local verification

For changes to this README or to CLI/builder contracts:

```bash
node xtend-builder/scaffold.js verify --json
npm run test:scoped-package-readmes
node scripts/run_xtend_tests.js references scaffold-write-plan scaffold-component-write scaffold-manifest-patch scaffold-rmt-build scaffold-kernel-lab --json
```

`npm test` remains the complete gate before a release handoff. `verify` only prints the appropriate verification plan; it does not execute the listed suites.

### License

Licensed under the Apache License 2.0. See [LICENSE](../LICENSE).

### Historical contract

Epic 03 established XTend-Scaffold as a **generator-only**, dry-run-first build environment: `WP-E03-03` defined the blueprint, `WP-E03-06` manifest and hydration, `WP-E03-07` feature wiring, `WP-E03-08` workflows, `WP-E03-09` typing, `WP-E03-10` preview, `WP-E03-11` extension points, and `WP-E03-12` the closure. Epic 17 added productive, controlled write paths through WritePlan, ownership, and structured patchers. The term `generator-only` therefore describes the historical Epic 03 contract, not the current overall scope of the CLI.

[Back to top](#xtend-builder-cli) · [Deutsch](#deutsch)

---

<a id="deutsch"></a>

## Deutsch

[English](#english) | **Deutsch**

`@ccslabs/xtend-cli` ist die gemeinsame Kommandozeile für Komponenten-Scaffolding, RMT-Tooling und Maraca-Builds im XTend-Workspace. Die ausführbaren Namen `xt`, `xtend` und `xtend-scaffold` zeigen auf dieselbe Implementierung. `xtend-builder/scaffold.js` bleibt als kompatibler CommonJS-Einstieg erhalten.

Der Builder ist **dry-run-first**: Plan- und Renderbefehle schreiben standardmäßig keine Dateien. Produktive Schreibvorgänge müssen explizit mit `--write` aktiviert werden und laufen über den zentralen WritePlan mit Root-, Ownership- und Konfliktprüfung.

XTend Classic verlangt diese CLI nicht: HTML- und JavaScript-first-Hosts können `xtend-loader.js` und ein lokales Manifest direkt verwenden. Der Builder bleibt für Classic-Scaffolding und -Verifikation optional, während er den unterstützten Befehlspfad für Compiler- und Maraca-Workflows bereitstellt. Siehe [XTend-Classic-Guide](../docs/de/xtend-classic.md).

### Produktflächen und Verantwortung

| Produktfläche | Rolle des Builders |
|---|---|
| XTend Components | Plant und erzeugt Komponenten, Dokumentation, Tests, Fixtures, Typen und Manifest-Patches. |
| XTendRMT | Lintet `.rmt`-Quellen und baut Core-, App-, Host-, Diagnose- und Source-Map-Artefakte. |
| Maraca | Plant, baut und tuned loaderlose Modern-ESM-Bundles aus RMT-Quellen. |
| XScaler | Bindet den RMT-/Maraca-Ausgabepfad an den XScaler-Preflight- und ATC-Vertrag; die Protokoll-API selbst liegt in `tools/rmt-language/xscaler-protocol.js`. |
| XSurface Shard | Übernimmt akzeptierte Remote-Surface-Pläne serverseitig und erzeugt XScaler-ATC-kompatible Handoffs; die Runtime liegt im separaten Paket `@ccslabs/xtend-xsurface-shard`. |

XScaler und XSurface Shard sind damit keine zusätzlichen Scaffold-Unterbefehle. Sie bilden eine Integrationsgrenze des erzeugten RMT-/Maraca-Produkts:

```text
RMT Remote Surface -> XScaler Preflight -> XSurface Shard / ATC-Handoff -> Maraca Runtime
```

Der Preflight bleibt seiteneffektfrei und führt keinen Remote-Code aus. XSurface Shard lädt ebenfalls keine Remote-Bundles; die Client-Runtime materialisiert nur zuvor akzeptierte Surfaces. Details stehen im [XScaler-Protokoll](../docs/de/xscaler-protocol.md) und in der [XSurface-Shard-Dokumentation](../xsurface-shard/README.md).

### Voraussetzungen und Einstieg

- Node.js 18 oder neuer
- Aus dem Repository: installierte Workspace-Abhängigkeiten
- Als Paket: optionale Peer-Abhängigkeiten `@ccslabs/xtend` und `@ccslabs/xtend-compiler` für die jeweils benötigten Workflows

```bash
npm install @ccslabs/xtend-cli
```

Repo-lokal:

```bash
node xtend-builder/bin/xt --help
node xtend-builder/bin/xt validate --json
```

Nach Package-Installation, `npm link`, `npm exec` oder mit `xtend-builder/bin` im `PATH`:

```bash
xt --help
xt validate --json
npx --no-install xt validate --json
```

`validate` ist ein stabiler Alias für `verify`. Die vollständige, ausführbare Befehlsübersicht liefert immer:

```bash
node xtend-builder/scaffold.js --help
```

### Häufige Workflows

#### Komponente planen und erzeugen

```bash
# Nur planen und rendern
xt component-plan --tag x-example --profile display --feature state --json
xt component-files --tag x-example --profile display --feature state --json

# Kontrolliert schreiben oder auf Drift prüfen
xt component-files --tag x-example --profile display --feature state --write --json
xt component-files --tag x-example --profile display --feature state --check --json

# Teilverträge separat inspizieren
xt typing --tag x-example --profile display --feature state --json
xt preview --tag x-example --profile display --feature state --json
xt extensions --tag x-example --profile display --feature state --json
```

`component-files --write` verwaltet generierte Dateien über `.xtend-build/scaffold-ownership.json`. Bereits vorhandene, nicht vom Builder verwaltete Dateien werden ohne `--force` nicht überschrieben. Manifest-Änderungen werden strukturiert auf `components/manifest.json` angewendet; Build Reports landen unter `.xtend-build/component-files/`.

#### RMT prüfen und bauen

```bash
xt rmt lint app.rmt --json
xt rmt build app.rmt --json
node xtend-builder/scaffold.js rmt-build --source demos/xtendrmt/examples/lifecycle/source.rmt --write --json
node xtend-builder/scaffold.js rmt-app-platform \
  --source tests/fixtures/rmt-surface-resource-graph-runtime.rmt \
  --write --json
```

Der generische `rmt-build` erzeugt Core JSON, XTend Custom Element, App-Modul, HTTP-Host, Browser-Smoke-Fixture und Scaffold Report. `rmt-app-platform` ergänzt App-Platform-Diagnosen und Source Maps.

#### XTend-Material-Maraca-App erzeugen

```bash
# Den Plan mit acht Artefakten prüfen, ohne zu schreiben
xt create app --runtime maraca --design-kit material --out material-app --json

# Mit app-lokaler Ownership schreiben und Scaffold-Idempotenz prüfen
xt create app --runtime maraca --design-kit material --out material-app --write --json
xt create app --runtime maraca --design-kit material --out material-app --check --json

# Installieren, anschließend bauen und ausliefern
cd material-app
npm install
npm run serve
```

Das explizite Material-Preset erzeugt acht Artefakte: RMT, CSS, einen HTML-Host, einen Runtime-Host, die DEV-API-Brücke, `maraca.config.json`, `package.json` und einen Smoke Test. `npm run serve` baut zuerst `dist/` und liefert danach `site/index.html` über `xt serve` aus; `xt serve --help` dokumentiert Host, Port, Root, Default-Dokument, Check- und JSON-Optionen. Tailwind und der Maraca-Adapter sind ausschließlich Development Dependencies, Sources werden explizit angegeben und Preflight bleibt deaktiviert. Andere Presets laufen nicht durch diesen Generator und aktivieren Tailwind niemals implizit.

#### Maraca-Bundle bauen

```bash
xt maraca plan app.rmt --json
xt maraca build app.rmt --out dist --profile production --lazy route --css external --pwa --json
xt maraca tune app.rmt --config maraca.config.json --out dist --write --json

# Derselbe Bundle-Pfad unter dem RMT-Namespace
xt rmt build app.rmt --bundle maraca --out dist --json

# Den generierten designneutralen HTML-Host ausliefern
xt serve --root dist
```

Maraca kompiliert die RMT-Quelle, ermittelt benötigte XTend-Module und erzeugt einen loaderlosen ESM-Einstieg plus `dist/index.html`. Der generierte Host und `xt serve --root dist` funktionieren für Material- und Nicht-Material-Design-Linien. Profile und Bundling-Optionen sind in der [Maraca-Dokumentation](../xtend-maraca/README.md) beschrieben.

#### Kernel analysieren und reproduzierbar bauen

```bash
xt kernel-lab analyze --json
xt kernel-lab build --profile clean --check --json
xt kernel-lab build --profile clean --version 0.4.0 --write --json
```

Der Alias `xt rmt kernel-lab ...` führt denselben Pfad aus. Das Profil `clean` baut die Dashboard-freien Standard-Kernelartefakte und aktualisiert das RMT-Kernel-Modulmanifest.

#### Agenten- und Automationsausgabe

Alle zentralen Inspect-, Plan-, Build- und Verify-Pfade unterstützen maschinenlesbare JSON-Ausgabe:

```bash
xt layout --json
xt config --json
xt generators --json
xt templates --json
xt workflow --json
xt verify --json
xt rmt ai-kit export --profile compact --format md --json
```

### Befehlsgruppen

| Gruppe | Befehle | Verhalten |
|---|---|---|
| Inspektion | `layout`, `config`, `blueprint`, `generators`, `templates` | Gibt Builder- und Contract-Metadaten aus. |
| Komponenten | `component-plan`, `component-files`, `typing`, `preview`, `extensions` | Plant, rendert und optional schreibt Komponentenartefakte. |
| RMT | `rmt build`, `rmt lint`, `rmt ai-kit export`, `rmt-app-platform`, `rmt-lifecycle-demo` | Prüft Quellen und erzeugt App-/Tooling-Artefakte. |
| Maraca | `maraca plan`, `maraca build`, `maraca tune` | Erzeugt und optimiert Modern-ESM-App-Bundles. |
| Kernel | `kernel-lab analyze`, `kernel-lab build` | Analysiert und baut den RMT-Kernel. |
| Workflow | `workflow`, `verify`, `validate` | Liefert lokale Arbeits- und Prüfpläne; führt bei `verify` noch keine Tests aus. |

### XScaler und XSurface Shard verifizieren

Der Builder stellt aktuell keinen `xt xscaler`-Befehl bereit. Die produktübergreifende Integrität wird über dedizierte Gates geprüft:

```bash
npm run test:xscaler-protocol
npm run test:xscaler-source-to-sea
npm run test:xsurface-shard
```

Dabei prüft `xscaler-protocol` die Preflight-, Remote-Surface-, XTension-Deployment- und ATC-Schemas. `xscaler-source-to-sea` verfolgt den Weg vom Remote Manifest über Security/Degradation und Preflight bis zum XSurface-Shard-Handoff. `xsurface-shard` prüft Planung, Lifecycle und serialisierbare Stream-Fragmente.

### Schreib- und Sicherheitsmodell

- Ohne `--write` bleibt ein Build ein reviewbarer Plan.
- `--check` meldet Drift, ohne Dateien zu verändern.
- Produktive Befehle schreiben ausschließlich über `xtend-builder/writing/`.
- Der WritePlan begrenzt Ziele auf erlaubte Repository-Roots.
- Ownership-Metadaten schützen manuell angelegte Dateien vor unbeabsichtigtem Überschreiben.
- Strukturierte Patcher ändern JSON-Artefakte deterministisch statt per Textsuche.
- XScaler-Preflight und XSurface Shard führen keinen Remote-Code aus und erlauben kein Netzwerk während des SSR-Renderings.

### Paket- und Moduloberfläche

Das Paket exportiert den CommonJS-CLI-Einstieg, öffentliche Builder-Typen sowie Generator- und Template-Module:

```js
const { runCli, runCliAsync } = require('@ccslabs/xtend-cli');
```

Die Paket-Binaries sind:

- `xt`
- `xtend`
- `xtend-scaffold`

XScaler und XSurface Shard gehören bewusst nicht zur JavaScript-Exportfläche dieses Pakets. Verwende für XSurface Shard `@ccslabs/xtend-xsurface-shard`; der XScaler-Vertrag ist derzeit eine repo-interne RMT-Tooling-API.

### Projektlayout

| Bereich | Pfad | Verantwortung |
|---|---|---|
| CLI | `xtend-builder/bin/xt`, `xtend-builder/lib/cli.js` | Paketierter Einstieg, Argumentauswertung und Dispatch |
| Legacy-Einstieg | `xtend-builder/scaffold.js` | Kompatibilität für bestehende Node-Skripte |
| Konfiguration | `xtend-builder/scaffold.config.js` | Profile, Pfade, Testpflichten und Tooling-Entscheidungen |
| Blueprints | `xtend-builder/blueprints/` | Komponenten- und Artefaktverträge |
| Generatoren | `xtend-builder/generators/` | Komponenten-, RMT-, App-Platform- und Kernel-Pläne |
| Templates | `xtend-builder/templates/` | Komponenten- und App-Ausgabetemplates |
| Wiring | `xtend-builder/wiring/` | Manifest-, Hydrations- und Feature-Verträge |
| Typing | `xtend-builder/typing/` | Öffentliche Typen und RMT-Anbindungen |
| Preview / Extensions | `xtend-builder/preview/`, `xtend-builder/extensions/` | Referenzpfade und Erweiterungspunkte |
| Qualitätsprofile | `xtend-builder/a11y/`, `xtend-builder/performance/` | A11y- und Performance-Pflichten für erzeugte Artefakte |
| Workflows | `xtend-builder/workflows/` | Dry-Run- und Verify-Pläne |
| Schreiben | `xtend-builder/writing/` | WritePlan, Ownership, Reports und strukturierte Patcher |
| Hilfen | `xtend-builder/utils/` | Seiteneffektarme Validierungs- und Naming-Helfer |

Die maschinenlesbare Fassung des Layouts ist verfügbar über:

```bash
node xtend-builder/scaffold.js layout --json
```

### Lokale Verifikation

Für eine Änderung an dieser README oder an CLI-/Builder-Verträgen:

```bash
node xtend-builder/scaffold.js verify --json
npm run test:scoped-package-readmes
node scripts/run_xtend_tests.js references scaffold-write-plan scaffold-component-write scaffold-manifest-patch scaffold-rmt-build scaffold-kernel-lab --json
```

Vor einem Release-Handoff bleibt `npm test` das vollständige Gate. `verify` gibt lediglich den passenden Prüfplan aus; es führt die gelisteten Suites nicht selbst aus.

### Lizenz

Lizenziert unter der Apache License 2.0. Siehe [LICENSE](../LICENSE).

### Historischer Contract

Epic 03 etablierte XTend-Scaffold als **generator-only**, dry-run-first Build-Environment: `WP-E03-03` definierte den Blueprint, `WP-E03-06` Manifest und Hydration, `WP-E03-07` Feature-Wiring, `WP-E03-08` Workflows, `WP-E03-09` Typing, `WP-E03-10` Preview, `WP-E03-11` Extension Points und `WP-E03-12` den Abschluss. Epic 17 ergänzte über WritePlan, Ownership und strukturierte Patcher produktive, kontrollierte Schreibpfade. Der Begriff `generator-only` beschreibt deshalb den historischen Epic-03-Contract, nicht den heutigen Gesamtumfang der CLI.

[Nach oben](#xtend-builder-cli) · [English](#english)
