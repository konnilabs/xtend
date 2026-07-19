# XTend Maraca

**English (primary)** | [Deutsch](#deutsch)

<a id="english"></a>

## English

`@ccslabs/xtend-maraca` is the modern ESM build pipeline for RMT-first XTend applications. It compiles `.rmt` sources, discovers required XTend components and runtime modules, and emits loaderless application entries with static component registries and reviewable build evidence.

### Installation

```bash
npm install @ccslabs/xtend-maraca
```

Node.js 24 or newer is required. Rollup and Terser are direct dependencies; `@ccslabs/xtend` and `@ccslabs/xtend-compiler` are optional peers for integrated workspace flows.

### CLI workflow

```bash
xt maraca plan app.rmt --json
xt maraca build app.rmt --out dist --profile production --lazy route --css inline --json
xt maraca tune app.rmt --config maraca.config.json --out dist --write --json
xt rmt build app.rmt --bundle maraca --out dist --json
xt serve --root dist
```

Profiles are `debug`, `production`, and `max`. Lazy modes are `route`, `component`, and `none`; CSS can be emitted inline or externally. The `max` profile applies the strictest private-name policy while reserving public XTend, Web Component, CSS, and RMT names.

Every successful Maraca build, independent of the selected design line, writes a ready-to-serve `dist/index.html` next to `xtend.maraca.mjs`. The host contains the Maraca mount point and the matching module and optional external CSS references. `xt serve --root dist` serves this generic output; Material scaffolds may additionally provide their richer project-owned host and `npm run serve` workflow.

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

### Embedded plan runtime

Dynamic, isolated previews use the stable `./plan-runtime` export. The host supplies the build plan, DOM root, component registry, Fabric instance and host services; the runtime owns boot, commands, snapshots and disposal without global singleton state.

```js
import { bootMaracaPlan } from '@ccslabs/xtend-maraca/plan-runtime';

const runtime = await bootMaracaPlan({ plan, root, componentRegistry, fabric, hostServices });
await runtime.dispatchCommand('preview.submit', { value: 'XTend' });
runtime.dispose();
```

### AppServices and TypeScript

Generated RMT apps use `src/services.ts` as the browser/local service entry and optional target-isolated Node/PHP implementations. The TypeScript provider performs full-program checking before the existing Rollup/Terser production build and emits a versioned service manifest plus declarations.

```ts
import { defineAppServices, service } from '@ccslabs/xtend-maraca/app-services';

export default defineAppServices({
  'orders.search': service<{ query: string }, unknown>({
    kind: 'query',
    target: 'server'
  })
});
```

`@ccslabs/xtend-maraca/server-services` defines Node handlers, `@ccslabs/xtend-maraca/node-app-service-host` attaches the importable server bundle to an existing HTTP server, and `@ccslabs/xtend-maraca/service-build-provider` exposes the `inspect → plan → build → report → dispose` provider boundary. Maraca does not create routes, authentication, or a listening backend server.

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
npm run test:maraca-app-services
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

Node.js 24 oder neuer wird benötigt. Rollup und Terser sind direkte Abhängigkeiten; `@ccslabs/xtend` und `@ccslabs/xtend-compiler` sind optionale Peers für integrierte Workspace-Abläufe.

### CLI-Workflow

```bash
xt maraca plan app.rmt --json
xt maraca build app.rmt --out dist --profile production --lazy route --css inline --json
xt maraca tune app.rmt --config maraca.config.json --out dist --write --json
xt rmt build app.rmt --bundle maraca --out dist --json
xt serve --root dist
```

Die Profile sind `debug`, `production` und `max`. Lazy-Modi sind `route`, `component` und `none`; CSS kann inline oder extern ausgegeben werden. Das Profil `max` verwendet die strengste Private-Name-Policy, während öffentliche XTend-, Web-Component-, CSS- und RMT-Namen reserviert bleiben.

Jeder erfolgreiche Maraca-Build schreibt unabhängig von der gewählten Design-Linie eine direkt auslieferbare `dist/index.html` neben `xtend.maraca.mjs`. Der Host enthält den Maraca-Mount-Point sowie die passenden Modul- und optionalen externen CSS-Referenzen. `xt serve --root dist` liefert diesen generischen Output aus; Material-Scaffolds können zusätzlich ihren umfangreicheren, projekteigenen Host und den `npm run serve`-Ablauf bereitstellen.

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

### Eingebettete Plan-Runtime

Dynamische, isolierte Previews verwenden den stabilen Export `./plan-runtime`. Der Host übergibt Buildplan, DOM-Root, Komponentenregistry, Fabric-Instanz und Host Services; die Runtime besitzt Boot, Commands, Snapshots und Dispose ohne globalen Singleton-Zustand.

```js
import { bootMaracaPlan } from '@ccslabs/xtend-maraca/plan-runtime';

const runtime = await bootMaracaPlan({ plan, root, componentRegistry, fabric, hostServices });
await runtime.dispatchCommand('preview.submit', { value: 'XTend' });
runtime.dispose();
```

### AppServices und TypeScript

Generierte RMT-Apps verwenden `src/services.ts` als Browser-/Local-Service-Einstieg und optional zielisolierte Node-/PHP-Implementierungen. Der TypeScript-Provider prüft das vollständige Programm vor dem bestehenden Rollup-/Terser-Produktionsbuild und erzeugt ein versioniertes Service-Manifest sowie Deklarationen.

```ts
import { defineAppServices, service } from '@ccslabs/xtend-maraca/app-services';

export default defineAppServices({
  'orders.search': service<{ query: string }, unknown>({
    kind: 'query',
    target: 'server'
  })
});
```

`@ccslabs/xtend-maraca/server-services` definiert Node-Handler, `@ccslabs/xtend-maraca/node-app-service-host` bindet das importierbare Serverbundle an einen vorhandenen HTTP-Server und `@ccslabs/xtend-maraca/service-build-provider` stellt die Providergrenze `inspect → plan → build → report → dispose` bereit. Maraca erzeugt weder Routen noch Authentifizierung oder einen lauschenden Backendserver.

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
npm run test:maraca-app-services
npm run test:scoped-package-readmes
```

### Lizenz

Lizenziert unter der Apache License 2.0. Siehe [LICENSE](../LICENSE).

[Nach oben](#xtend-maraca) · [English](#english)
