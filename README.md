# XTend

**English (primary)** | [Deutsch](#deutsch)

<a id="english"></a>

## English

XTend is a native-first Web Component, XTendRMT, Fabric, Maraca, XScaler, and XSurface Shard application-orchestration toolkit. It gives teams browser-native primitives, owned UI components, auditable contracts, and a path from small HTML hosts to declarative RMT-driven application shells without requiring a heavyweight UI framework.

### Package portfolio

| Package | Use it for |
|---|---|
| `@ccslabs/xtend` | The complete stack: loader, components, RMT, Fabric, Maraca, CLI, compiler, XSurface Shard, and documentation. |
| `@ccslabs/xtend-rmt` | RMT runtime, browser bridge, app runtime, SSR adapter, core types, schema, and manifest. |
| `@ccslabs/xtend-fabric` | Diagnostics, reporters, fibers, runtime lanes, hydration policies, and RMT lane mapping. |
| `@ccslabs/xtend-cli` | Component scaffolding, RMT tooling, Maraca builds, and verification plans. |
| `@ccslabs/xtend-compiler` | RMT compiler, parser, linter, language server, and App Platform tooling. |
| `@ccslabs/xtend-maraca` | RMT-to-app planning, bundling, hydration, transitions, PWA, and production evidence. |
| `@ccslabs/xtend-xsurface-shard` | Server-side remote-surface sharding and XScaler ATC-compatible handoffs. |

### Installation

```bash
npm install @ccslabs/xtend
```

For a local checkout:

```bash
npm install
npm run dev:local
```

Node.js 24 or newer is required by the public scoped packages. Repository development pins Node `24.18.0` and npm `11.17.0`; Node `26.5.0` is the required compatibility lane until the separately gated Node-26 LTS cutover. Electron and VS Code report their upstream-owned embedded Node runtimes separately.

### ESM registry

The package root is the concise ESM entry point for XTend applications. Importing it is side-effect-free; call `await readyXTend()` once to boot the default RMT orchestration kernel, or configure `{ orchestration: 'lightweight' }` for the synchronous minimal path.

```js
import { readyXTend, schedule, render, createApp, createStore } from '@ccslabs/xtend';

await readyXTend();
const app = createApp();
const store = createStore();
const cancel = schedule(() => render(document.querySelector('#app'), {
  type: 'element',
  tag: 'p',
  children: [{ type: 'text', text: 'Hello XTend' }]
}));
```

Node and SSR can import the same names without browser globals. Configure a DOM implementation before rendering; DOM-neutral factories work without it.

```js
import { configureXTend, readyXTend, render, createApp } from '@ccslabs/xtend';

configureXTend({ documentTarget: serverDocument });
await readyXTend();
const app = createApp();
render(serverRoot, descriptor);
```

Existing Classic applications must import `@ccslabs/xtend/loader` or include `xtend-loader.js` explicitly. The package root no longer starts the Classic loader.

### XTend Classic

XTend Classic is the supported HTML- and JavaScript-first delivery path. It uses the runtime manifest and `xtend-loader.js` without requiring an XTend application build. A host bundler, TypeScript, a local server, or optional XTend CLI usage can still be part of a Classic project.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>

<x-section label="Quick Start">
  <h1>Hello XTend</h1>
  <x-button variant="primary">Start</x-button>
</x-section>
```

The loader reads `components/manifest.json`, loads requested custom elements, and keeps the runtime path local. Public package entry points include the loader, `api.js`, component modules, design tokens, Fabric, RMT, Maraca, XSurface Shard, accessibility policies, security policies, and catalog reports.

| XTend Classic | XTend Maraca |
|---|---|
| HTML-/JavaScript-first | RMT-/build-first |
| Runtime manifest and `xtend-loader.js` | Static inline registry and generated ESM bundle |
| No XTend-required application build | Plan, build, tune, and evidence pipeline |
| Dynamic catalogs and progressive enhancement | Optimized app graphs, SSR/hydration, PWA, and production reports |

### XTendRMT and Maraca

XTendRMT keeps state, selectors, actions, events, resources, surfaces, and scheduling in `.rmt` source. Host adapters connect compiled records to XTend UI, XRouter, Fabric, browser APIs, and server rendering. Maraca turns that source into loaderless modern ESM application bundles and emits reviewable production evidence.

```bash
xt rmt lint app.rmt --json
xt maraca plan app.rmt --json
xt maraca build app.rmt --out dist --profile production --lazy route --css inline --json
xt rmt build app.rmt --bundle maraca --out dist --json
```

New Maraca apps use AppServices instead of product-owned boot or datasource wiring: RMT declares the service ID and mode, `src/services.ts` supplies browser logic or a server proxy, and optional Node/PHP entries implement backend work. The TypeScript provider checks the complete program, builds isolated browser/server graphs through Rollup, and emits a shared manifest plus typed service IDs. Start with the [AppServices guide](./docs/en/maraca-app-services.md).

### XScaler and XSurface Shard

XScaler evaluates a side-effect-free Preflight before remote code may enter a runtime slot. Accepted remote-surface plans can be partitioned and lifecycle-managed by XSurface Shard, which emits XScaler ATC-compatible handoffs and JSON-safe stream fragments. Neither layer turns the RMT kernel into a remote-code executor.

The public contracts are available from `@ccslabs/xtend/xscaler`; only AppServices with `target: 'remote-surface'` enter the preflight/SRI/ATC path. Local and ordinary HTTP/NDJSON services do not.

### Native-first boundary

- Prefer native dialog, popover, focus, form, navigation, and media behavior before framework abstraction.
- Keep UI primitives, collection views, data display, commands, and search sources owned by XTend.
- Make component, RMT, security, and package contracts auditable through deterministic local gates.
- Keep the default build and verification path dependency-conscious and reproducible.

### Documentation

The bilingual Developer Center lives in `docs/en` and `docs/de`.

- [English start page](./docs/en/README.md)
- [German start page](./docs/de/README.md)
- [Quick Start](./docs/en/quick-start-guide.md)
- [XTend Classic](./docs/en/xtend-classic.md)
- [XTendRMT overview](./docs/en/xtendrmt-overview.md)
- [Native-first RMT recipes](./docs/en/native-first-rmt-recipes.md)
- [Component reference](./docs/en/components.md)
- [Trusted DOM and sanitizing](./docs/en/trusted-dom-sanitizing.md)
- [Maraca AppServices](./docs/en/maraca-app-services.md)
- [XScaler protocol](./docs/en/xscaler-protocol.md)

### Verification and publishing

```bash
npm run test:scoped-package-readmes
npm run test:pr:report
npm run test:release:full:report
npm run release:sync-versions:check
npm run pack:dry-run
```

Release metadata and gates are anchored in `package.json#xtend`. GitHub Releases can publish `@ccslabs/xtend` to npm with provenance after release evidence, package dry runs, conditional-network evidence, and the Native-First/RMT-Owned aggregate pass.

### License

XTend is licensed under the Apache License 2.0. See [LICENSE](./LICENSE).

[Back to top](#xtend) · [Deutsch](#deutsch)

---

<a id="deutsch"></a>

## Deutsch

[English](#english) | **Deutsch**

XTend ist ein Native-First-Toolkit für die App-Orchestrierung mit Web Components, XTendRMT, Fabric, Maraca, XScaler und XSurface Shard. Es bietet Teams browsernative Primitiven, eigene UI-Komponenten, prüfbare Verträge und einen Weg von kleinen HTML-Hosts zu deklarativen, RMT-gesteuerten App-Shells, ohne ein schwergewichtiges UI-Framework vorauszusetzen.

### Paketportfolio

| Paket | Einsatzgebiet |
|---|---|
| `@ccslabs/xtend` | Der vollständige Stack: Loader, Komponenten, RMT, Fabric, Maraca, CLI, Compiler, XSurface Shard und Dokumentation. |
| `@ccslabs/xtend-rmt` | RMT-Runtime, Browser-Bridge, App Runtime, SSR-Adapter, Core-Typen, Schema und Manifest. |
| `@ccslabs/xtend-fabric` | Diagnosen, Reporter, Fibers, Runtime-Lanes, Hydration Policies und RMT-Lane-Mapping. |
| `@ccslabs/xtend-cli` | Komponenten-Scaffolding, RMT-Tooling, Maraca-Builds und Prüfpläne. |
| `@ccslabs/xtend-compiler` | RMT-Compiler, Parser, Linter, Language Server und App-Platform-Tooling. |
| `@ccslabs/xtend-maraca` | RMT-zu-App-Planung, Bundling, Hydration, Transitions, PWA und Produktionsnachweise. |
| `@ccslabs/xtend-xsurface-shard` | Serverseitiges Remote-Surface-Sharding und XScaler-ATC-kompatible Handoffs. |

### Installation

```bash
npm install @ccslabs/xtend
```

Für einen lokalen Checkout:

```bash
npm install
npm run dev:local
```

Die öffentlichen Scoped Packages benötigen Node.js 24 oder neuer. Die Repository-Entwicklung pinnt Node `24.18.0` und npm `11.17.0`; Node `26.5.0` bleibt bis zum separat freizugebenden Node-26-LTS-Cutover die verpflichtende Kompatibilitäts-Lane. Electron und VS Code weisen ihre upstream-eigenen eingebetteten Node-Runtimes getrennt aus.

### ESM-Registry

Der Paket-Root ist der kompakte ESM-Einstieg für XTend-Apps. Der Import ist side-effect-free; `await readyXTend()` bootet einmalig den standardmäßigen RMT-Orchestrierungskernel, alternativ erhält `{ orchestration: 'lightweight' }` den synchronen Minimalpfad.

```js
import { readyXTend, schedule, render, createApp, createStore } from '@ccslabs/xtend';

await readyXTend();
const app = createApp();
const store = createStore();
const cancel = schedule(() => render(document.querySelector('#app'), {
  type: 'element',
  tag: 'p',
  children: [{ type: 'text', text: 'Hello XTend' }]
}));
```

Node und SSR können dieselben Namen ohne Browser-Globals importieren. Vor DOM-Rendering wird ein DOM-Host mit `configureXTend({ documentTarget })` injiziert.

```js
import { configureXTend, readyXTend, render, createApp } from '@ccslabs/xtend';

configureXTend({ documentTarget: serverDocument });
await readyXTend();
const app = createApp();
render(serverRoot, descriptor);
```

Bestehende Classic-Apps importieren künftig `@ccslabs/xtend/loader` oder binden `xtend-loader.js` explizit ein; der Paket-Root startet den Loader nicht mehr.

TypeScript-Apps können State und Descriptoren opt-in strikt typisieren. Die ausführbare Vite-PoC liegt unter [`demos/ts-app`](./demos/ts-app/README.md); `npm run demo:ts:typecheck` und `npm run demo:ts:build` prüfen sie. NodeNext verwendet einen separaten DOM-neutralen Typvertrag, sodass reine SSR-Projekte keine `DOM`-Library benötigen.

Die veröffentlichte Oberfläche wird durch den Package-Metadatenvertrag `xtend.epic13PackageExportLock` geschützt.

Visuelle Release-Evidence und lokale Capture-Abläufe sind in der [Visual-Snapshot-Automation](./docs/en/visual-snapshot-automation.md) dokumentiert.

### XTend Classic

XTend Classic ist der unterstützte HTML- und JavaScript-first-Delivery-Pfad. Er verwendet das Runtime-Manifest und `xtend-loader.js`, ohne einen XTend-Application-Build zu verlangen. Ein Host-Bundler, TypeScript, ein lokaler Server oder die optionale XTend CLI können trotzdem Teil eines Classic-Projekts sein.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>

<x-section label="Quick Start">
  <h1>Hello XTend</h1>
  <x-button variant="primary">Start</x-button>
</x-section>
```

Der Loader liest `components/manifest.json`, lädt angeforderte Custom Elements und hält den Runtime-Pfad lokal. Öffentliche Paket-Einstiege umfassen den Loader, `api.js`, Komponentenmodule, Design Tokens, Fabric, RMT, Maraca, XSurface Shard, Accessibility Policies, Security Policies und Katalogberichte.

| XTend Classic | XTend Maraca |
|---|---|
| HTML-/JavaScript-first | RMT-/Build-first |
| Runtime-Manifest und `xtend-loader.js` | Statische Inline Registry und generiertes ESM-Bundle |
| Kein durch XTend erforderlicher Application-Build | Plan-, Build-, Tune- und Evidence-Pipeline |
| Dynamische Kataloge und Progressive Enhancement | Optimierte App-Graphen, SSR/Hydration, PWA und Produktionsreports |

### XTendRMT und Maraca

XTendRMT hält State, Selektoren, Actions, Events, Ressourcen, Surfaces und Scheduling in einer `.rmt`-Quelle. Host-Adapter verbinden kompilierte Records mit XTend UI, XRouter, Fabric, Browser-APIs und Server-Rendering. Maraca erzeugt daraus loaderlose Modern-ESM-App-Bundles und prüfbare Produktionsnachweise.

```bash
xt rmt lint app.rmt --json
xt maraca plan app.rmt --json
xt maraca build app.rmt --out dist --profile production --lazy route --css inline --json
xt rmt build app.rmt --bundle maraca --out dist --json
```

Neue Maraca-Apps verwenden AppServices statt produktseitigem Boot- oder Datasource-Wiring: RMT deklariert Service-ID und Modus, `src/services.ts` liefert Browserlogik oder einen Server-Proxy, optionale Node-/PHP-Einstiege implementieren Backendarbeit. Der TypeScript-Provider prüft das vollständige Programm, baut getrennte Browser-/Servergraphen über Rollup und erzeugt ein gemeinsames Manifest samt typisierten Service-IDs. Der Einstieg steht im [AppServices-Leitfaden](./docs/de/maraca-app-services.md).

### XScaler und XSurface Shard

XScaler bewertet einen seiteneffektfreien Preflight, bevor Remote-Code einen Runtime-Slot belegen darf. Akzeptierte Remote-Surface-Pläne können durch XSurface Shard partitioniert und im Lifecycle verwaltet werden; dabei entstehen XScaler-ATC-kompatible Handoffs und JSON-sichere Stream-Fragmente. Keine der beiden Schichten macht den RMT-Kernel zu einem Remote-Code-Executor.

Die öffentlichen Verträge liegen unter `@ccslabs/xtend/xscaler`; nur AppServices mit `target: 'remote-surface'` durchlaufen Preflight, SRI und ATC. Lokale und normale HTTP-/NDJSON-Services tun das nicht.

### Native-First-Grenze

- Native Dialog-, Popover-, Fokus-, Formular-, Navigations- und Medienfunktionen haben Vorrang vor Framework-Abstraktionen.
- UI-Primitiven, Collection Views, Datendarstellung, Commands und Suchquellen bleiben im Besitz von XTend.
- Komponenten-, RMT-, Security- und Paketverträge bleiben durch deterministische lokale Gates prüfbar.
- Der Standardpfad für Build und Verifikation bleibt abhängigkeitsbewusst und reproduzierbar.

### Dokumentation

Das zweisprachige Developer Center liegt unter `docs/en` und `docs/de`.

- [Englische Startseite](./docs/en/README.md)
- [Deutsche Startseite](./docs/de/README.md)
- [Schnellstart](./docs/de/quick-start-guide.md)
- [XTend Classic](./docs/de/xtend-classic.md)
- [XTendRMT-Übersicht](./docs/de/xtendrmt-overview.md)
- [Native-First-RMT-Rezepte](./docs/de/native-first-rmt-recipes.md)
- [Komponentenreferenz](./docs/de/components.md)
- [Trusted DOM und Sanitizing](./docs/de/trusted-dom-sanitizing.md)
- [Maraca AppServices](./docs/de/maraca-app-services.md)
- [XScaler-Protokoll](./docs/de/xscaler-protocol.md)

### Verifikation und Veröffentlichung

```bash
npm run test:scoped-package-readmes
npm run test:pr:report
npm run test:release:full:report
npm run release:sync-versions:check
npm run pack:dry-run
```

Release-Metadaten und Gates sind in `package.json#xtend` verankert. GitHub Releases können `@ccslabs/xtend` mit Provenance auf npm veröffentlichen, nachdem Release-Nachweise, Package-Dry-Runs, Conditional-Network-Nachweise und das Native-First/RMT-Owned-Aggregat bestanden wurden.

### Lizenz

XTend steht unter der Apache License 2.0. Siehe [LICENSE](./LICENSE).

[Nach oben](#xtend) · [English](#english)
