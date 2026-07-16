# XTend Material Maraca Tailwind

**English (primary)** | [Deutsch](#deutsch)

<a id="english"></a>

## English

`@xtend-material/maraca-tailwind` is the build-time-only Tailwind CSS 4.3.2 provider for XTend Maraca. It compiles the semantic classes owned by `@xtend-material/core`, records source and token evidence, and adds no Tailwind JavaScript to browser bundles. The provider uses explicit sources, memory-only compilation, disabled Preflight and a network-forbidden policy.

Support status is `supported-opt-in`; applications activate the provider explicitly. XTend and Maraca defaults remain native. See [CHANGELOG.md](./CHANGELOG.md) for the supported `0.1.x` surface.

Install the adapter next to Maraca and the Material design kit:

```bash
npm install @xtend-material/maraca-tailwind @xtend-material/core @ccslabs/xtend-maraca
```

`createTailwindCssProvider` exposes the provider lifecycle, `createTailwindToolchainApi` offers the lower-level air-gapped compiler endpoint, and `createRmtCssSourceInventory` validates the public `xtm-*` authoring surface. Applications never need raw Tailwind utilities. Dynamic class construction, arbitrary values, variants, slash modifiers, unknown recipes and sources outside the declared project root are blocked before compilation.

```js
const {
  createRmtCssSourceInventory,
  createTailwindCssProvider,
  createTailwindToolchainApi
} = require('@xtend-material/maraca-tailwind');

const inventory = createRmtCssSourceInventory({ sourceText: 'class "xtm-card"' });
const provider = createTailwindCssProvider({ rootDir: process.cwd() });
const toolchain = createTailwindToolchainApi();
console.log(inventory.status, provider.id, toolchain.inspect().status);
```

Maraca automatically loads the validated XTend token bridge and the native Material styles. Build evidence contains the adapter, pinned toolchain, Recipe Registry, design-kit stylesheet and token-bridge fingerprints. Theme and density remain runtime-owned by `x-theme`; `data-material-pack="enterprise"` and `utility` only choose presentation intent.

Run the focused provider and package-documentation gates with:

```bash
node scripts/run_xtend_tests.js maraca-tailwind-css-provider rmt-tailwind-source-inventory --json
npm run test:scoped-package-readmes
```

The adapter never invokes `npx`, subprocesses, a CDN, registry lookup, `fetch`, HTTP or HTTPS. Tailwind plugins, executable configuration and automatic monorepo discovery are outside the accepted contract.

<a id="deutsch"></a>

## Deutsch

`@xtend-material/maraca-tailwind` ist der ausschließlich zur Build-Zeit aktive Tailwind-CSS-4.3.2-Provider für XTend Maraca. Er kompiliert die semantischen Klassen aus `@xtend-material/core`, dokumentiert Source- und Token-Evidence und fügt Browser-Bundles kein Tailwind-JavaScript hinzu. Der Provider verwendet explizite Quellen, speicherinterne Kompilierung, deaktiviertes Preflight und eine Policy ohne Netzwerkzugriff.

Der Supportstatus lautet `supported-opt-in`; Anwendungen aktivieren den Provider ausdrücklich. Die Defaults von XTend und Maraca bleiben nativ. Die unterstützte `0.1.x`-Oberfläche steht in [CHANGELOG.md](./CHANGELOG.md).

Installiere den Adapter gemeinsam mit Maraca und dem Material Design Kit:

```bash
npm install @xtend-material/maraca-tailwind @xtend-material/core @ccslabs/xtend-maraca
```

`createTailwindCssProvider` stellt den Provider-Lifecycle bereit, `createTailwindToolchainApi` bietet den niedrigeren air-gapped Compiler-Endpunkt und `createRmtCssSourceInventory` validiert die öffentliche `xtm-*`-Authoring-Oberfläche. Anwendungen benötigen keine rohen Tailwind-Utilities. Dynamische Klassenerzeugung, arbitrary values, Varianten, Slash-Modifikatoren, unbekannte Recipes und Quellen außerhalb des deklarierten Projektpfads werden vor der Kompilierung blockiert.

```js
const {
  createRmtCssSourceInventory,
  createTailwindCssProvider,
  createTailwindToolchainApi
} = require('@xtend-material/maraca-tailwind');

const inventory = createRmtCssSourceInventory({ sourceText: 'class "xtm-card"' });
const provider = createTailwindCssProvider({ rootDir: process.cwd() });
const toolchain = createTailwindToolchainApi();
console.log(inventory.status, provider.id, toolchain.inspect().status);
```

Maraca lädt automatisch die validierte XTend Token Bridge und die nativen Material Styles. Build-Evidence enthält Fingerprints für Adapter, gepinnte Toolchain, Recipe Registry, Design-Kit-Stylesheet und Token Bridge. Theme und Density bleiben Runtime-Aufgaben von `x-theme`; `data-material-pack="enterprise"` und `utility` wählen ausschließlich die Präsentationsabsicht.

Führe die fokussierten Provider- und Package-Dokumentations-Gates aus:

```bash
node scripts/run_xtend_tests.js maraca-tailwind-css-provider rmt-tailwind-source-inventory --json
npm run test:scoped-package-readmes
```

Der Adapter startet niemals `npx`, Subprozesse, ein CDN, Registry-Abfragen, `fetch`, HTTP oder HTTPS. Tailwind-Plugins, ausführbare Konfiguration und automatische Monorepo-Erkennung liegen außerhalb des akzeptierten Vertrags.
