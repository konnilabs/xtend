# XTend Maraca

**English (primary)** | [Deutsch](#deutsch)

<a id="english"></a>

## English

`@ccslabs/xtend-maraca` is the modern ESM build pipeline for RMT-first XTend applications. It compiles `.rmt` sources, discovers required XTend components and runtime modules, and emits loaderless application entries with static component registries and reviewable build evidence.

### Installation

```bash
npm install @ccslabs/xtend-maraca
```

Node.js 18 or newer is required. Rollup and Terser are direct dependencies; `@ccslabs/xtend` and `@ccslabs/xtend-compiler` are optional peers for integrated workspace flows.

### CLI workflow

```bash
xt maraca plan app.rmt --json
xt maraca build app.rmt --out dist --profile production --lazy route --css inline --json
xt maraca tune app.rmt --config maraca.config.json --out dist --write --json
xt rmt build app.rmt --bundle maraca --out dist --json
```

Profiles are `debug`, `production`, and `max`. Lazy modes are `route`, `component`, and `none`; CSS can be emitted inline or externally. The `max` profile applies the strictest private-name policy while reserving public XTend, Web Component, CSS, and RMT names.

### Programmatic API

```js
const {
  createMaracaBuildPlan,
  buildMaracaBundleAsync,
  tuneMaracaBuild
} = require('@ccslabs/xtend-maraca');

const plan = createMaracaBuildPlan('app.rmt', { rootDir: process.cwd() });
const build = await buildMaracaBundleAsync({
  source: 'app.rmt',
  outputDir: 'dist',
  profile: 'production'
});
const tune = await tuneMaracaBuild({
  source: 'app.rmt',
  config: 'maraca.config.json'
});
```

### Runtime entry point

```js
const {
  createInlineComponentRegistry,
  isPublicNameReserved
} = require('@ccslabs/xtend-maraca/runtime');

const registry = createInlineComponentRegistry([]);
const reserved = isPublicNameReserved('x-button');
```

Lazy component bundles use viewport-driven loading when `IntersectionObserver` is available. Custom hosts can select eager loading through `bootXtendMaraca({ lazyStrategy: 'eager' })` in a generated application entry.

### Build capabilities

- orchestration, kernel, validation, hydration, and transition plans
- warm re-entry and prewarm-worker evidence
- UI coprocessor, Web App Manifest, and PWA service-worker plans
- template artifacts, Trusted DOM, policy parity, panic/recovery, and security reports
- performance, size-budget, and production-bundle-closure reports
- deterministic tune candidates and checked build configuration

XTend Classic remains an equally supported delivery path for HTML- and JavaScript-first hosts using `xtend-loader.js` and an external component manifest. Choose Maraca for compiled RMT application graphs, SSR/hydration, PWA output, and production evidence—not merely because a project grows.

### Runtime boundary

- Build planning does not execute application actions.
- Remote surfaces remain gated by XScaler Preflight.
- XSurface Shard handoffs may feed accepted streams to the client runtime without moving remote execution into the RMT kernel.
- Public names remain reserved across minification and bundle tuning.

### Verification

```bash
npm run test:maraca
npm run test:maraca-package-exports
npm run test:maraca-tune
npm run test:maraca-pwa-service-worker
npm run test:scoped-package-readmes
```

### License

Licensed under the Apache License 2.0. See [LICENSE](../LICENSE).

[Back to top](#xtend-maraca) · [Deutsch](#deutsch)

---

<a id="deutsch"></a>

## Deutsch

[English](#english) | **Deutsch**

`@ccslabs/xtend-maraca` ist die Modern-ESM-Build-Pipeline für RMT-first-XTend-Anwendungen. Sie kompiliert `.rmt`-Quellen, ermittelt benötigte XTend-Komponenten und Runtime-Module und erzeugt loaderlose App-Einstiege mit statischen Komponentenregistries und prüfbaren Build-Nachweisen.

### Installation

```bash
npm install @ccslabs/xtend-maraca
```

Node.js 18 oder neuer wird benötigt. Rollup und Terser sind direkte Abhängigkeiten; `@ccslabs/xtend` und `@ccslabs/xtend-compiler` sind optionale Peers für integrierte Workspace-Abläufe.

### CLI-Workflow

```bash
xt maraca plan app.rmt --json
xt maraca build app.rmt --out dist --profile production --lazy route --css inline --json
xt maraca tune app.rmt --config maraca.config.json --out dist --write --json
xt rmt build app.rmt --bundle maraca --out dist --json
```

Die Profile sind `debug`, `production` und `max`. Lazy-Modi sind `route`, `component` und `none`; CSS kann inline oder extern ausgegeben werden. Das Profil `max` verwendet die strengste Private-Name-Policy, während öffentliche XTend-, Web-Component-, CSS- und RMT-Namen reserviert bleiben.

### Programmatische API

```js
const {
  createMaracaBuildPlan,
  buildMaracaBundleAsync,
  tuneMaracaBuild
} = require('@ccslabs/xtend-maraca');

const plan = createMaracaBuildPlan('app.rmt', { rootDir: process.cwd() });
const build = await buildMaracaBundleAsync({
  source: 'app.rmt',
  outputDir: 'dist',
  profile: 'production'
});
const tune = await tuneMaracaBuild({
  source: 'app.rmt',
  config: 'maraca.config.json'
});
```

### Runtime-Einstieg

```js
const {
  createInlineComponentRegistry,
  isPublicNameReserved
} = require('@ccslabs/xtend-maraca/runtime');

const registry = createInlineComponentRegistry([]);
const reserved = isPublicNameReserved('x-button');
```

Lazy-Komponentenbundles verwenden viewport-gesteuertes Laden, wenn `IntersectionObserver` verfügbar ist. Eigene Hosts können in einem generierten App-Einstieg mit `bootXtendMaraca({ lazyStrategy: 'eager' })` sofortiges Laden auswählen.

### Build-Fähigkeiten

- Pläne für Orchestrierung, Kernel, Validierung, Hydration und Transitions
- Nachweise für Warm Re-entry und Prewarm Worker
- Pläne für UI Coprocessor, Web App Manifest und PWA Service Worker
- Berichte zu Template Artifacts, Trusted DOM, Policy Parity, Panic/Recovery und Security
- Performance-, Size-Budget- und Production-Bundle-Closure-Berichte
- deterministische Tune-Kandidaten und geprüfte Build-Konfiguration

XTend Classic bleibt ein gleichwertig unterstützter Auslieferungspfad für HTML- und JavaScript-first-Hosts mit `xtend-loader.js` und externem Komponentenmanifest. Maraca ist die Wahl für kompilierte RMT-Anwendungsgraphen, SSR/Hydration, PWA-Ausgabe und Produktionsnachweise – nicht allein, weil ein Projekt wächst.

### Runtime-Grenze

- Die Build-Planung führt keine Anwendungs-Actions aus.
- Remote Surfaces bleiben durch den XScaler Preflight gegatet.
- XSurface-Shard-Handoffs können akzeptierte Streams an die Client-Runtime liefern, ohne Remote-Ausführung in den RMT-Kernel zu verlagern.
- Öffentliche Namen bleiben über Minifizierung und Bundle-Tuning hinweg reserviert.

### Verifikation

```bash
npm run test:maraca
npm run test:maraca-package-exports
npm run test:maraca-tune
npm run test:maraca-pwa-service-worker
npm run test:scoped-package-readmes
```

### Lizenz

Lizenziert unter der Apache License 2.0. Siehe [LICENSE](../LICENSE).

[Nach oben](#xtend-maraca) · [English](#english)
