# XTend Compiler and Language Tooling

**English (primary)** | [Deutsch](#deutsch)

<a id="english"></a>

## English

`@ccslabs/xtend-compiler` provides the XTendRMT compiler, parsers, diagnostics, linter CLI, language server protocol, App Platform analysis, and AI Developer Kit export surface. It analyzes and compiles RMT sources; it does not own the XTend UI runtime.

XTend Classic does not require the compiler: directly authored HTML and JavaScript can boot through `xtend-loader.js` and a local manifest. Install this package when a Classic project optionally needs RMT diagnostics or when Maraca should compile RMT into a generated application bundle. See the [XTend Classic guide](../docs/en/xtend-classic.md).

### Installation

```bash
npm install @ccslabs/xtend-compiler
```

Node.js 18 or newer is required.

### Compile and parse RMT

```js
const {
  compileRmtVNextSource
} = require('@ccslabs/xtend-compiler');
const {
  parseRmtVNextSource
} = require('@ccslabs/xtend-compiler/rmt-language/vnext-parser');

const source = 'template { id: "example" }';
const parsed = parseRmtVNextSource(source);
const compiled = compileRmtVNextSource(source);
```

The package also exposes the format adapter, source model, and normalized diagnostics as dedicated subpaths.

### Linter CLI

```bash
xtend-rmt-lint app.rmt
xtend-rmt-lint app.rmt --json
xtend-rmt-lint tests/fixtures --fail-on warning
```

The CLI accepts native `.rmt` sources and supported fallback inputs, emits deterministic diagnostics, and can format output for automation.

### Language Server and App Platform

```bash
node node_modules/@ccslabs/xtend-compiler/rmt-language-server/server.js
xt rmt ai-kit export --profile compact --format md --json
```

The Language Server remains the source of truth for diagnostics, completion, hover, symbols, definitions, navigation, and code actions. App Platform tooling adds source analysis, diagnostics, source maps, scaffold plans, and a no-manual-HTML gate. The AI Developer Kit exports bounded Markdown, JSON, and JSONL artifacts for agent ingest.

### Public entry points

- compiler and parsers under `rmt-language/*`
- source model and diagnostics
- `rmt-language/app-platform-tooling`
- `rmt-language/rmt-ai-developer-kit`
- `rmt-linter/cli`
- `rmt-language-server/server` and `rmt-language-server/protocol`

Every JavaScript entry point has a matching TypeScript declaration condition in the package export map.

### Tooling boundary

- Parsing and compilation do not execute application code.
- The language server communicates through bounded protocol records.
- Tooling does not import the XTend UI runtime into the RMT kernel.
- XScaler and XSurface Shard facts are compiled and validated as contracts, not executed remotely by this package.

### Verification

```bash
npm run test:rmt-vnext-compiler
npm run test:rmt-linter-cli
npm run test:rmt-language-server
npm run test:rmt-app-platform-tooling
npm run test:scoped-package-readmes
```

### License

Licensed under the Apache License 2.0. See [LICENSE](../LICENSE).

[Back to top](#xtend-compiler-and-language-tooling) · [Deutsch](#deutsch)

---

<a id="deutsch"></a>

## Deutsch

[English](#english) | **Deutsch**

`@ccslabs/xtend-compiler` stellt den XTendRMT-Compiler, Parser, Diagnosen, die Linter-CLI, das Language-Server-Protokoll, App-Platform-Analyse und den Export des AI Developer Kit bereit. Das Paket analysiert und kompiliert RMT-Quellen; es besitzt nicht die XTend-UI-Runtime.

XTend Classic verlangt den Compiler nicht: Direkt gepflegtes HTML und JavaScript kann über `xtend-loader.js` und ein lokales Manifest booten. Installiere dieses Paket, wenn ein Classic-Projekt optional RMT-Diagnosen benötigt oder Maraca RMT in ein generiertes App-Bundle kompilieren soll. Siehe [XTend-Classic-Guide](../docs/de/xtend-classic.md).

### Installation

```bash
npm install @ccslabs/xtend-compiler
```

Node.js 18 oder neuer wird benötigt.

### RMT kompilieren und parsen

```js
const {
  compileRmtVNextSource
} = require('@ccslabs/xtend-compiler');
const {
  parseRmtVNextSource
} = require('@ccslabs/xtend-compiler/rmt-language/vnext-parser');

const source = 'template { id: "example" }';
const parsed = parseRmtVNextSource(source);
const compiled = compileRmtVNextSource(source);
```

Das Paket exportiert außerdem den Format-Adapter, das Source Model und normalisierte Diagnosen über eigene Subpfade.

### Linter-CLI

```bash
xtend-rmt-lint app.rmt
xtend-rmt-lint app.rmt --json
xtend-rmt-lint tests/fixtures --fail-on warning
```

Die CLI akzeptiert native `.rmt`-Quellen und unterstützte Fallback-Eingaben, erzeugt deterministische Diagnosen und kann Ausgaben für Automatisierung formatieren.

### Language Server und App Platform

```bash
node node_modules/@ccslabs/xtend-compiler/rmt-language-server/server.js
xt rmt ai-kit export --profile compact --format md --json
```

Der Language Server bleibt die Source of Truth für Diagnosen, Completion, Hover, Symbole, Definitionen, Navigation und Code Actions. Das App-Platform-Tooling ergänzt Source-Analyse, Diagnosen, Source Maps, Scaffold-Pläne und einen No-Manual-HTML-Gate. Das AI Developer Kit exportiert begrenzte Markdown-, JSON- und JSONL-Artefakte für Agenten.

### Öffentliche Einstiegspunkte

- Compiler und Parser unter `rmt-language/*`
- Source Model und Diagnosen
- `rmt-language/app-platform-tooling`
- `rmt-language/rmt-ai-developer-kit`
- `rmt-linter/cli`
- `rmt-language-server/server` und `rmt-language-server/protocol`

Jeder JavaScript-Einstieg besitzt eine passende TypeScript-Declaration-Condition in der Export-Map des Pakets.

### Tooling-Grenze

- Parsing und Kompilierung führen keinen Anwendungscode aus.
- Der Language Server kommuniziert über begrenzte Protokoll-Records.
- Das Tooling importiert die XTend-UI-Runtime nicht in den RMT-Kernel.
- XScaler- und XSurface-Shard-Fakten werden als Verträge kompiliert und validiert, nicht durch dieses Paket remote ausgeführt.

### Verifikation

```bash
npm run test:rmt-vnext-compiler
npm run test:rmt-linter-cli
npm run test:rmt-language-server
npm run test:rmt-app-platform-tooling
npm run test:scoped-package-readmes
```

### Lizenz

Lizenziert unter der Apache License 2.0. Siehe [LICENSE](../LICENSE).

[Nach oben](#xtend-compiler-and-language-tooling) · [English](#english)
