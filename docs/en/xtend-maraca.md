# XTend Maraca

XTend Maraca is the modern ESM bundle path for RMT-first XTend applications. It reads an `.rmt` source, derives the XTend components and RMT runtime modules that are actually referenced, then writes a loaderless bundle with a static inline registry instead of loading `components/manifest.json` in the browser.

## What it solves

Use Maraca when a third-party team wants to ship a focused XTend application rather than the full development stack. The classic loader remains the compatibility path for manifest-based hosts: it fetches a component registry, resolves entries at runtime and keeps late loading flexible. Maraca moves that decision into the build step. The build plan knows which surfaces reference `x-button`, `x-status`, `x-form` or other tags, keeps only those modules in the Rollup graph and writes a report that explains what entered the bundle.

The result is useful for product-specific checkouts, embedded dashboards, customer portals and RMT-authored shells where the deployed code should match the document instead of a broad component catalog. Maraca does not change component APIs. Attributes, events, slots, CSS parts, design tokens and RMT schema names stay public names and are reserved during minification.

## When to use it

Choose Maraca for production-oriented RMT apps that are authored from `.rmt` files and should run as modern ESM. It fits best when the host controls the build command, can write artifacts into a `dist` or `products` directory and wants predictable size reports. It is also the right path when a team wants lazy component chunks without an external JSON manifest fetch.

Stay with `xtend-loader.js` when the host needs runtime manifest replacement, dynamic component catalogs, older browser targets or a debugging setup where every component should be available without rebuilding. The two paths can coexist: use the loader for broad compatibility and Maraca for optimized application bundles.

## Build flow

Maraca has two public entry points. `xt maraca plan` produces a build plan without writing a bundle. `xt maraca build` writes the bundle and the reports. The RMT one-step command uses the same pipeline and is the preferred path when the developer starts from an RMT document.

```bash
xt maraca plan app.rmt --json
xt maraca build app.rmt --out dist --profile production --lazy component --css external --json
xt rmt build app.rmt --bundle maraca --out dist --profile production --lazy component --css external --json
```

The generated output normally contains `xtend.maraca.mjs`, optional `xtend.maraca.css`, dynamic `chunks/*.mjs`, `xtend.maraca.report.json` and `xtend.maraca.size.json`. The report is the audit artifact: it records selected components, runtime modules, lazy imports, forbidden loader dependencies and size-budget status.

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

## Reports and size budgets

Read `xtend.maraca.report.json` after every production build. The key fields are `components.selected`, `runtimeModules`, `bundleFiles`, `loader`, `forbiddenRuntimeDependencies` and `toolchain`. A healthy app build should show `loader.usesExternalManifest: false`, `loader.usesXtendLoader: false` and no forbidden runtime dependency on `components/manifest.json`.

`xtend.maraca.size.json` compares the modern bundle with a baseline made from the legacy loader plus selected component modules. This is not a generic web performance score; it is a local guardrail that proves Maraca still produces a smaller modern ESM graph for the chosen document.

## Troubleshooting

If a build fails with an unknown component diagnostic, check the exact tag in the RMT surface and compare it with `components/manifest.json`. If the bundle is larger than expected, inspect `components.selected` first; a broad RMT fixture may be selecting more components than the page needs. If lazy chunks do not load in the browser, verify that the output directory is served as files, not copied without the `chunks` folder.

If the output still references `xtend-loader.js`, `data-manifest` or `components/manifest.json`, use the report as a blocker. Maraca app bundles should use an inline registry. If you need a manifest at runtime, choose the loader path deliberately instead of trying to make Maraca emulate it.

## Local checks

Use the Maraca suites when changing CLI wiring, package exports, bundle generation or RMT source-to-bundle behavior.

```bash
node scripts/run_xtend_tests.js maraca-plan maraca-bundle maraca-rmt-source-to-bundle maraca-package-exports maraca-size-budget --json
npm run test:maraca
npm run pack:dry-run
```

For adjacent topics, continue with [RMT App Platform Tooling](./rmt-app-platform-tooling.md), [XTend Loader](./xtend-loader.md) and [RMT-first XTend Apps](./rmt-first-xtend-apps.md).
