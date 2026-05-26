# XTend Maraca

`@ccslabs/xtend-maraca` is the modern ESM build pipeline for RMT-first XTend applications.

Maraca compiles an `.rmt` document through the existing vNext compiler, derives the required XTend components and runtime modules, then emits a loaderless ESM entry with a static inline component registry. The default build path runs through Rollup and Terser; a local ESM import-graph fallback remains available for environments that intentionally omit the toolchain. The legacy `xtend-loader.js` and external component manifest flow remain available beside this package.

## CLI

```bash
xt maraca plan app.rmt --json
xt maraca build app.rmt --out dist --profile production --lazy route --css inline --json
xt rmt build app.rmt --bundle maraca --out dist --json
```

Profiles are `debug`, `production`, and `max`. The `max` profile enables the stricter private-name policy boundary in reports; public XTend, Web Component, CSS and RMT names remain reserved.

Lazy component bundles use viewport-driven loading by default when `IntersectionObserver` is available. Pass `bootXtendMaraca({ lazyStrategy: "eager" })` in custom hosts when all selected component chunks should be loaded immediately.
