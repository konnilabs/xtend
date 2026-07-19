# XTend Maraca

XTend Maraca is the modern ESM bundle path for RMT-first XTend applications. It reads an `.rmt` source, derives the XTend components and RMT runtime modules that are actually referenced, then writes a loaderless bundle with a static inline registry instead of loading `components/manifest.json` in the browser.

For TypeScript business logic and Node/PHP service targets, continue with [Maraca AppServices and TypeScript](./maraca-app-services.md).

## What it solves

Use Maraca when RMT source should become a compiler-selected XTend application bundle with reviewable build evidence. [XTend Classic](./xtend-classic.md) is the equally supported path for manifest-based HTML and JavaScript hosts: it fetches a component registry, resolves entries at runtime, and keeps late loading flexible. Maraca moves that selection into the build step. The build plan knows which surfaces reference `x-button`, `x-status`, `x-form`, or other tags, keeps only those modules in the Rollup graph, and writes a report that explains what entered the bundle.

The result is useful for product-specific checkouts, embedded dashboards, customer portals and RMT-authored shells where the deployed code should match the document instead of a broad component catalog. Maraca does not change component APIs. Attributes, events, slots, CSS parts, design tokens and RMT schema names stay public names and are reserved during minification.

## When to use it

Choose Maraca for RMT-first apps that should run as generated modern ESM and need optimized app graphs, SSR/hydration, PWA output, or production reports. It fits when the host controls the build command, can write artifacts into a `dist` or `products` directory, and wants predictable evidence.

Choose XTend Classic when the host owns directly authored HTML and JavaScript, runtime manifest replacement, dynamic component catalogs, or progressive enhancement without an XTend-required application build. The two paths can coexist and are production-supported; project size alone does not decide between them.

## Build flow

Maraca has two public entry points. `xt maraca plan` produces a build plan without writing a bundle. `xt maraca build` writes the bundle and the reports. The RMT one-step command uses the same pipeline and is the preferred path when the developer starts from an RMT document.

```bash
xt maraca plan app.rmt --json
xt maraca build app.rmt --out dist --profile production --lazy component --css external --json
xt rmt build app.rmt --bundle maraca --out dist --profile production --lazy component --css external --json
xt serve --root dist
```

The generated output normally contains a directly servable `index.html`, `xtend.maraca.mjs`, optional `xtend.maraca.css`, dynamic `chunks/*.mjs`, `xtend.maraca.report.json` and `xtend.maraca.size.json`. The HTML host is design-line-neutral: it supplies the Maraca mount point and references the generated module and, in external CSS mode, the generated stylesheet. Therefore `xt serve --root dist` works for Material and non-Material Maraca builds alike. When the mobile manifest or PWA assistants are enabled, the same output directory can also contain `xtend.webmanifest`, `icons/`, `xtend.webmanifest.report.json`, `xtend.service-worker.js`, `xtend.offline.html` and `xtend.pwa.report.json`. The report is the audit artifact: it records selected components, runtime modules, lazy imports, forbidden loader dependencies, PWA attachment metadata and size-budget status.

## Orchestrated App Bundles

For RMT apps with state, actions, validation, hydration and surface transitions, Maraca can write compiler-driven orchestration directly into the bundle. `auto` remains compatible, `strict` enforces complete contracts and `off` keeps the legacy path available. The full deep dive is [Maraca Orchestration](./xtend-maraca-orchestration.md).

```bash
xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --css external --json
```

Strict builds expect known components, typed events, resource ownership, resolvable targets/portals, validation messages and schedulable transition/hydration fibers. The bundle report contains dedicated sections for `orchestration`, `kernel`, `hydration`, `validation` and `transitions`.

## Mobile Web App Manifest

The Web App Manifest Assistant is opt-in and independent from the Service Worker path. It writes `xtend.webmanifest`, creates an `icons/` directory in the Maraca output and copies the default XTend logo assets from the repository root. V1 does not resize or invent brand assets. It copies the available files so application developers can replace them in the output with product-specific icons.

```bash
xt maraca build app.rmt --out dist --web-app-manifest --json
xt maraca build app.rmt --out dist --manifest --json
```

The generated manifest defaults to `name: "XTend Maraca App"`, `short_name: "XTend"`, `start_url: "./"`, `scope: "./"`, `display: "standalone"`, `background_color: "#ffffff"` and `theme_color: "#1f6f78"`. Manifest icons reference only the mobile app icons: `icons/android-chrome-192x192.png` and `icons/android-chrome-512x512.png`, both with purpose `any`. Apple touch icons and favicons are copied and listed as `htmlLinkHints` in `xtend.webmanifest.report.json`; they are not falsely declared as Web App Manifest icons.

The stable report schemas are `xtend.maraca.web-app-manifest-plan.v1` and `xtend.maraca.web-app-manifest-report.v1`. The bundle report exposes the same evidence in `webAppManifest`, and the generated browser entry exposes it as `XTendMaraca.webAppManifest`.

## PWA Service Worker Assistant

The PWA Service Worker Assistant is also opt-in. It is low-code rather than no-code: Maraca generates safe framework-owned surfaces for app shell caching, versioned cache cleanup, registration metadata and offline fallback, while application-specific network or business logic stays in an explicit import hook.

```bash
xt maraca build app.rmt --out dist --pwa --json
xt maraca build app.rmt --out dist --enable-service-worker --json
```

`pwa: true` automatically enables the Web App Manifest Assistant. The Service Worker plan consumes that manifest plan for `manifestRef`, icon files and precache URLs instead of owning manifest generation itself. Generated artifacts include `xtend.service-worker.js`, `xtend.offline.html` when offline fallback is enabled, and `xtend.pwa.report.json`.

The generated Service Worker caches only safe same-origin `GET` app shell and asset requests by default. Runtime cache policy permits static assets with `cache-first`, navigation fallback with `network-first`, and optional images/fonts with `stale-while-revalidate`. It blocks non-GET requests, auth/cookie-sensitive requests, personalized SSR fragments, API responses without explicit app policy, Background Sync, Push and offline mutations. For local business rules, configure a Service Worker business logic import; the generated file contains the `XTEND SERVICE WORKER BUSINESS LOGIC HOOK` comment block and imports that script without asking developers to edit generated code directly.

The stable report schemas are `xtend.maraca.pwa-service-worker-plan.v1` and `xtend.maraca.pwa-service-worker-report.v1`. The bundle report exposes the evidence in `pwa`; the browser bridge exposes the plan and registration snapshot through `XTendMaraca.pwa`, `window.__XTendMaracaPwaRegistration` and the telemetry snapshot. The RMT kernel and UI Coprocessor consume only PWA status metadata such as `serviceWorkerControlled`, `cacheMode`, `offlineEligible`, `manifestRef` and `cacheVersion`; Service Workers do not perform UI compute, SSR or DOM ownership.

## Minimal RMT example

This small source references only three components. A Maraca build should therefore select those tags instead of the full manifest.

```rmt
template demo.maraca {
  state demo.maraca.status type object preserve {
    initial {
      id "maraca-status"
      text "Ready"
      tone "success"
    }
  }

  selector demo.maraca.status from state demo.maraca.status {
    output MaracaStatus
  }

  action demo.maraca.save {
    input label string optional
    reduce state.demo.maraca.status.text = "Saved"
    emit demo.maraca.saved with label input.label
  }

  portal surface.root root "#xtend-maraca-root" layer surface

  surface demo.maraca.status kind card component x-status {
    source selector demo.maraca.status
    portal surface.root
    key status.id
    bounds x 16 y 16 width 360 height 88
    lane visible weight 80 {
      hydrate maraca-status from selector demo.maraca.status
    }
  }

  surface demo.maraca.form kind card component x-form {
    portal surface.root
    key "profile-form"
    bounds x 16 y 120 width 360 height 120
    lane idle weight 40 {
      mount profile-form
    }
  }

  surface demo.maraca.button kind action component x-button {
    portal surface.root
    key "save-button"
    bounds x 16 y 260 width 220 height 56
    lane visible weight 90 {
      mount save-button
    }
    on click "[data-action='save']" -> action demo.maraca.save {
      payload label "Save"
    }
  }
}
```

The important contract is the `component` value on each surface. Maraca accepts known XTend component tags from the component registry and fails unknown tags by default. If an application truly needs dynamic tags, treat that as an explicit host policy decision rather than a silent fallback.

## Runtime integration

A Maraca bundle exposes a small browser bridge. `bootXtendMaraca()` mounts the generated surfaces into `data-maraca-root`, `#xtend-maraca-root` or `document.body`. `ensureMaracaComponent(tag)` loads one selected component. Lazy component mode creates dynamic imports and uses viewport-driven loading when `IntersectionObserver` is available.

```html
<main id="xtend-maraca-root" data-maraca-root></main>
<script type="module">
  import { bootXtendMaraca } from "./dist/xtend.maraca.mjs";

  bootXtendMaraca({
    root: document.querySelector("[data-maraca-root]"),
    lazyStrategy: "viewport"
  });
</script>
```

Use `lazyStrategy: "eager"` when the host wants every selected component loaded immediately. Use component lazy loading when the application has surfaces below the first viewport or route-like regions that should not inflate initial parse cost.

## Profiles and options

`debug` writes readable ESM with source maps and no mangling. It is best for diagnosing build plans and component selection. `production` enables Rollup tree-shaking and Terser minification with public names preserved. `max` adds opt-in private property mangling for internal names only and persists a name cache in the output directory.

`--lazy component` creates one lazy entry per selected component where possible. `--lazy none` pulls selected components into the entry and is simpler for single-file deployments. `--css external` writes `xtend.maraca.css`; `--css inline` injects the small generated layout CSS from the entry. For vendor builds, `--vendor xtend` intentionally selects the full component set and stack modules; for app builds, omit the vendor flag so the RMT document controls the graph.

Use `--web-app-manifest` or `--manifest` when the app should be installable on mobile without enabling a Service Worker yet. Use `--pwa` or `--enable-service-worker` when Maraca should also generate Service Worker registration, cache policy and offline fallback. `--pwa` includes the manifest assistant automatically.

## Reports and size budgets

Read `xtend.maraca.report.json` after every production build. The key fields are `components.selected`, `runtimeModules`, `bundleFiles`, `loader`, `forbiddenRuntimeDependencies`, `webAppManifest`, `pwa` and `toolchain`. A healthy app build should show `loader.usesExternalManifest: false`, `loader.usesXtendLoader: false` and no forbidden runtime dependency on `components/manifest.json`.

For kernel-orchestrated production bundles, also read `productionClosure` and `kernelFeatureAdoptionClosure`. They answer each runtime capability with `supported`, `active`, `degraded`, `blocked`, `runtimeExpectedStatus` and diagnostics. The same section links lifecycle, telemetry, performance, policy parity, warm reentry, prewarm worker and prerender status back to the RMT source fingerprint, bundle fingerprints and release tests.

`xtend.maraca.size.json` compares the modern bundle with a baseline made from the legacy loader plus selected component modules. This is not a generic web performance score; it is a local guardrail that proves Maraca still produces a smaller modern ESM graph for the chosen document.

## Troubleshooting

If a build fails with an unknown component diagnostic, check the exact tag in the RMT surface and compare it with `components/manifest.json`. If the bundle is larger than expected, inspect `components.selected` first; a broad RMT fixture may be selecting more components than the page needs. If lazy chunks do not load in the browser, verify that the output directory is served as files, not copied without the `chunks` folder.

If the output still references `xtend-loader.js`, `data-manifest` or `components/manifest.json`, use the report as a blocker. Maraca app bundles should use an inline registry. If you need a manifest at runtime, choose the loader path deliberately instead of trying to make Maraca emulate it.

If a mobile install prompt does not appear, verify that `xtend.webmanifest` is served as `application/manifest+json` and that the referenced `icons/android-chrome-192x192.png` and `icons/android-chrome-512x512.png` files exist under the output `icons/` directory. If offline behavior is missing, verify that the page is served over an origin that allows Service Workers, that `xtend.service-worker.js` is served as JavaScript and that the generated `xtend.pwa.report.json` lists the expected precache URLs.

## Local checks

Use the Maraca suites when changing CLI wiring, package exports, bundle generation or RMT source-to-bundle behavior.

```bash
node scripts/run_xtend_tests.js maraca-plan maraca-bundle maraca-rmt-source-to-bundle maraca-orchestration maraca-kernel-orchestration maraca-validation maraca-transitions maraca-package-exports maraca-size-budget maraca-web-app-manifest maraca-pwa-service-worker --json
npm run test:maraca-web-app-manifest
npm run test:maraca-pwa-service-worker
npm run test:maraca
npm run pack:dry-run
```

For adjacent topics, continue with [RMT App Platform Tooling](./rmt-app-platform-tooling.md), [XTend Classic](./xtend-classic.md), and [RMT-first XTend Apps](./rmt-first-xtend-apps.md).
