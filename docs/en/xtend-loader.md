# XTend Loader

## Overview

The canonical XTend loader is `xtend-loader.js`.

It is a local ES module entry for XTend UI and handles dynamic loading of the manifest, Core modules, explicitly preloaded components, components used in the DOM and `api.js`.

`xtend-dev.js` is now only a legacy stub. New demos, browser smokes, scaffold output and official examples use `xtend-loader.js`.

Since `ER-WP-05`, the default demo and fixture paths are formally fixed to the canonical loader or to deliberately classified special smokes. Since `ER-WP-18`, the loader measures manifest load, module load and Custom Element definition through local performance marks. Since `ER-WP-28`, it validates manifest and module URLs against `xtend.security.loader-policy.v1`, `xtend.security.manifest-policy.v1` and `xtend.security.import-policy.v1`.

## Integration

```html
<script type="module" src="./xtend-loader.js"></script>
```

Optionally, a local manifest can be set:

```html
<script
  type="module"
  src="./xtend-loader.js"
  data-manifest="./components/manifest.json">
</script>
```

By default, the loader uses:

```text
components/manifest.json
```

## Contract

The loader contract is:

```text
xtend.loader.contract.v1
```

Security contracts:

```text
xtend.security.loader-policy.v1
xtend.security.manifest-policy.v1
xtend.security.import-policy.v1
```

Near the browser, the loader exposes this surface:

```js
window.XTendLoader
```

The automatic boot promise is available under:

```js
window.__XTendLoaderBootPromise
```

## Verbose Mode

The PROD loader is quiet in the console by default. The loader file contains a direct flag near the top:

```js
const verbose_mode = 'auto';
```

Supported values:

| Value | Behavior |
|-------|----------|
| `'true'` | Verbose is permanently active. Loader module operations and connected Core runtime logs are printed in the browser console. |
| `'false'` | Verbose is locked. It can only be re-enabled by changing the loader file. |
| `'auto'` | Verbose is off on first start and can be enabled in the browser console for the current tab session. |

Browser console:

```js
XTendLoader.verbose(true)
XTendLoader.verbose(false)
XTendLoader.verbose()
```

Alternatively:

```js
XTendLoader.enableVerbose()
XTendLoader.disableVerbose()
XTendLoader.getVerboseState()
```

In `auto`, the loader stores the console decision in `sessionStorage`. After `XTendLoader.verbose(true)`, a reload is enough to also see the initial module-loading operations in the same browser session. `XTendLoader.verbose(false)` makes the session quiet again.

Structured diagnostics (`xtend-loader-diagnostic`) and performance events (`xtend-loader-performance`) remain available independently of verbose mode.

## How It Works

1. The loader initializes `xtend.loader.style-registry.v1` and injects runtime-critical styles for tokens, UI effects, skeletons and undefined XTend Custom Elements.
2. It waits for window load.
3. It validates `data-manifest` or `components/manifest.json` against the loader policy.
4. It loads the manifest and resolves manifest URLs relative to the manifest URL.
5. It validates every manifest record against the manifest and import policies.
6. It can version module URLs through `data-module-cache-bust` so live systems do not pull stale component modules from the browser cache.
7. It loads `xstate` and then `x-theme` when both are listed in the manifest. `xstate` is deliberately not cache-busted so no second state module instance is created.
8. It loads entries from `<meta name="xtend-preload">`.
9. It detects XTend tags used in the DOM and loads visible components immediately.
10. It observes non-visible components through `IntersectionObserver`.
11. It provides `xtend.loader.skeleton-loader.v1` for shell, route and dynamic subtree fallbacks.
12. It validates and imports local `api.js`, then calls `api.initXTendAPI(manifest)`.

## StyleRegistry

The loader exports the native StyleRegistry:

```js
window.XTendStyleRegistry
window.XTendLoader.styles
```

When `xtend-loader.js` is evaluated, the loader immediately calls `ensureRuntimeStyles()`. This ensures the critical CSS rules exist before components are imported or hydrated. `xtend.css` remains the canonical standard file name for host theming and docs/app layout, but it is no longer a hard requirement for skeletons, UI effects, base tokens or FOUC protection for undefined XTend Custom Elements.

Hosts can read the theme stylesheet state:

```js
XTendLoader.getThemeStylesheetState()
```

Components can register their own styles and apply them to shadow roots:

```js
const style = XTendLoader.defineComponentStyle('x-example', ':host { display: block; }');
XTendLoader.adoptStyle(this.shadowRoot, style);
```

## SkeletonLoader

The loader exports a native SkeletonLoader for shell-first apps:

```js
window.XTendLoader.showSkeleton(target, { lines: 8, schedule: 'docs.page.hydrate' });
window.XTendLoader.hideSkeleton(target);
```

Hosts can show undefined XTend Custom Elements as skeletons through `data-xtend-skeleton`. Known XTend tags without skeleton opt-in remain invisible until definition so Light DOM text does not flash unstyled. These rules come from the StyleRegistry and also work without external `xtend.css`.

## Preload

Components can still be explicitly preloaded:

```html
<meta name="xtend-preload" content="x-router,x-link,x-dialog,x-modal">
```

The values are component IDs from the manifest, not free-form URLs.

## Live Deployment Cache Busting

Shell apps can load the loader, manifest and component modules with a version:

```html
<script
  type="module"
  src="/xtend-loader.js?v=20260507"
  data-manifest="/components/manifest.json?v=20260507"
  data-module-cache-bust="20260507">
</script>
```

The loader appends this value to manifest modules as the `xtend-cache` query parameter. `xstate` is excluded because components import it themselves through `./xstate.js` and XTend should keep exactly one state instance.

## Manifest Example

```json
{
  "xstate": "./xstate.js",
  "x-theme": "./xtheme.js",
  "x-router": "./xrouter.js",
  "x-link": "./xlink.js",
  "x-dialog": "./xdialog.js",
  "x-modal": "./xmodal.js"
}
```

## Legacy Strategy

`xtend-dev.js` remains as a compatibility stub for a short migration phase.

The stub:

- warns in the console
- imports `./xtend-loader.js`
- contains no loader logic of its own

Default demos and tests must no longer use the legacy name as the canonical loader path.

## Security and Runtime Boundaries

The loader remains local and ESM-based.

CDN is not a default or test path. Since `ER-WP-03`, `api.js`, `components/manifest.json`, Core components and browser fixtures use repo-local XTend paths. Since `ER-WP-05`, reference and browser gates also verify that default demos do not fall back to `xtend-dev.js` or XTend CDN bridges. Since `ER-WP-28`, the loader refuses external manifest and module URLs, `javascript:`, `data:`, `blob:`, mismatched file extensions and path traversal with structured security diagnostics.

The loader emits structured local diagnostics as the `xtend-loader-diagnostic` event and thereby prepares later integration with `XTend-Fabric`.

Security refusals use these codes:

- `xtend.security.loader.refused`
- `xtend.security.manifest.invalid`
- `xtend.security.import.refused`

## Performance Measurements

The loader creates `performance.mark` and `performance.measure` entries for:

| Measure | Phase |
|---------|-------|
| `xtend.loader.manifest` | `load` |
| `xtend.loader.module` | `load` |
| `xtend.component.define` | `define` |

After module load, `xtend.component.define` briefly waits for `customElements.whenDefined(tag)`, but does not block the loader permanently when a manifest entry does not register a Custom Element.

In addition, it emits a local event for every measurement:

```js
window.addEventListener('xtend-loader-performance', (event) => {
  console.log(event.detail.name, event.detail.durationMs);
});
```

The boot promise contains the local loader measurements:

```js
const boot = await window.__XTendLoaderBootPromise;
console.log(boot.performanceMeasurements);
```

Fabric telemetry snapshots normalize these entries as `xtend.performance.measurement.v1`.

## Gates

Relevant local checks:

```bash
npm run dev:local
npm run test:browser:local
node scripts/run_xtend_tests.js browser --json
node scripts/run_xtend_tests.js manifest-import-policy --json
node scripts/run_xtend_tests.js fabric-performance-measurements --json
node scripts/run_xtend_tests.js references --json
npm test
```

`npm run dev:local` starts `scripts/serve_xtend_dev.js` on port `4173`. The browser-smoke harness uses the same server module in test mode with port `0`.

## Further Topics

- [Manifest Format](./manifest.md)
- [Manifest Import Policy](./manifest-import-policy.md)
- [Performance Measurements](./performance-measurements.md)
- [API Integration](./api.md)
- [Component Development](./components.md)
- [Best Practices](./best-practices.md)
