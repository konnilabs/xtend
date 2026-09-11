# Changelog – XTend 0.8.0

This page describes the 0.8.0 codebase and its migrations. A package version alone does not establish publication; manifests, exports and build artifacts identify the delivered revision.

## Changes in 0.8.0

| Area | Behavior and entry point |
| --- | --- |
| RMT microkernel | One scheduler authority, six canonical lanes and cancellable, thenable `RmtJobHandle`s. Paint, idle and `postTask` waits do not block ready work. [Migration](./rmt-kernel-0-8-migration.md) |
| Maraca shell | `execution fastpass` and `dispatchFastPass()` apply navigation, focus and named close on `user-blocking`, independently of waiting business commands. [FastPass](./maraca-fastpass-abort-boundary.md) |
| Presentation lifecycle | Automatic surface epochs guard hydration, UI-coprocessor responses and scheduled commits. `superseded` never starts a synchronous rendering fallback. Business transactions retain their order. [Abort Boundaries](./maraca-fastpass-abort-boundary.md) |
| Diagnostic demand | `subscribeEvents()` delivers immutable lifecycle events. `subscribe()` retains full snapshots; `snapshot()` and DEV API methods synchronously read current data. [DEV API](./xtend-dev-api.md) |
| Hydrangea JIT | Shared compile/preview/Maraca pipeline and a private cache of verified kernel artifacts. Explicitly enabled for the Docs host; `legacy` remains the default. [Hydrangea](./rmt-jit-hydrangea.md) |
| Node and Laravel | Independent page hosts with props, forms, navigation, layouts, resume and streaming. Production Laravel renders prebuilt artifacts without Node. [Page runtime](./ssr-pages.md) |
| Page Wire and CSP | Opt-in `xtend.page-wire.v1` reduces repeated page data. Conditional views materialize only the active branch; trusted component styles can inherit the document nonce. [Transport](./ssr-pages.md#compact-transport-and-conditional-views) |
| Reference application | XTend.store combines Maraca, Laravel, a guest cart and a separate DemoPay provider. [Integration](./ssr-pages.md) |
| Focus and diagnostic fixes | Overlay focus traps include slotted and remotely mounted controls. Delegated handlers read queue statistics from the shared scheduler instance. [Accessibility](./a11y-keyboard-smokes.md) |
| Docs shell | After a language switch, search and navigation use the same updated locale service. The shared FastPass validator remains compatible with the older Docs bridge host. [DEV Surface](./xtend-dev-surface.md) |
| Tooling and Nightly | A shared test catalog, verified runner capabilities and run-bound artifacts keep local and CI evidence traceable. [Release Verification](./release-verification.md) |

## Migration and defaults

0.8.0 is a breaking release under the pre-1.0 policy. New kernel jobs use `user-blocking`, `visible`, `transition`, `idle`, `background` or `diagnostics`. `inline` and `runInline` no longer bypass the queue. Product Surface and prewarm are explicit opt-ins; ESM imports do not boot a runtime. Fabric supplies work intents and backpressure without owning a second scheduler queue.

FastPass is also opt-in. Model reducers, services, fetches, streams and arbitrary custom effects remain business commands. A completed FastPass action acknowledges the shell intent, not content loading or animation completion. Long synchronous work still needs cooperative chunking.

The extended plan runtime uses `xtend.maraca.plan-runtime.v3`; the presentation adapter uses `xtend.rmt.presentation-effect-adapter.v2`. Existing methods remain available; consumers checking literal schema IDs must accept the new major. `xtend-maraca/fastpass.schema.json` adds the authoring contract without rewriting the released RMT v2 document schema.

Rebuild Maraca bundles and page manifests with the same framework version after upgrading. Rebuilds update runtime, asset and version fingerprints together. Current packages require Node >=24; host-specific compatibility smokes do not imply general support for older Node versions.

## Identify the installed version

Do not read the version from a generated banner or screenshot. Query the package directly:

```bash
node -p "require('./package.json').version"
```

Then compare `package.json` with the files that are actually installed. `api.d.ts`, `components/manifest.json`, and declarations under `components/*.d.ts` describe the public surface for that version.

## Classify a change

- **Additive:** A new export, optional attribute, or versioned schema expands the surface without breaking existing calls.
- **Behavioral:** Defaults, scheduling, hydration, or failure status change. Such a change needs an executable example and an updated gate report.
- **Migration:** A name, contract, or supported path is replaced. The old path remains for the documented transition or returns an explicit diagnostic.
- **Security fix:** Import, integrity, CSP, or trust rules become stricter. A silent compatibility fallback must not bypass that fix.

## Evidence required for a release

A release is more than a version number. The export-lock check must agree with TypeScript declarations, the pack dry run must exclude internal artifacts, and relevant browser and runtime gates must pass. [Release Verification](./release-verification.md) explains the sequence and how to read each report.

## Upgrade path

Identify affected public symbols before upgrading. Use the [RMT vNext Migration Notes](./rmt-vnext-migration-notes.md), [Component Long-Tail Migration](./component-long-tail-migration.md), or [XTensions Coexistence Guide](./xtensions-migration-coexistence-guide.md) for the relevant surface. Update source, fixture, and tests together instead of replacing compiled output alone.
