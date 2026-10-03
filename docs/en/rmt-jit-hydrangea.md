# RMT JIT Compiler Hydrangea

Hydrangea combines compilation, safe preview and optional Maraca planning in one XTend tooling-bridge request. Its first integrated host is the [RMT Playground](./learn-rmt-playground.md). The feature is available in 0.8.0; the Docs host continues to use `legacy` unless configured otherwise.

## Execution model

The additive `jit-compile` bridge operation uses a short-lived Node process. A request-local compilation session reuses results only for identical effective inputs. The different document defaults of the Docs host and Maraca stay separate. Parser data and semantic graphs remain in the process.

The language, Core document and existing bridge operations remain compatible. Hydrangea is neither a runtime renderer nor a hot-reload protocol: a successful Playground preview still boots again. [FastPass and Abort Boundaries](./maraca-fastpass-abort-boundary.md) instead govern responsiveness and validity of active UI work.

## Enable and roll back

Prepare the cache as the user that will run the PHP/Node bridge. Choose a private directory outside the webroot:

```sh
export XTEND_RMT_JIT_CACHE_DIR="$HOME/.cache/xtend-rmt-jit"
node tools/rmt-jit-cache-cli.js
export XTEND_RMT_JIT_MODE=hydrangea
```

These commands run from the framework checkout. The compiler package also provides the `xtend-rmt-jit-cache` CLI and `@ccslabs/xtend-compiler/jit-kernel-cache` export. `prepareRmtJitKernelCache({ rootDir, cacheDir })` returns `key`, `cacheStatus`, `architectureChecks`, `artifacts` and `diagnostics`.

The PHP host must inherit the environment variables. Verify permissions, PHP-FPM configuration, process limits and the complete browser flow on the target host before switching. Set `XTEND_RMT_JIT_MODE=legacy` and restart or reload that host to roll back the backend pipeline. The switch does not roll back the shared browser request coordinator.

Public packages require Node **24 or newer**. The dedicated Node 12.22.12 Docs bridge smoke is limited compatibility evidence for that host path; it does not expand package support.

## Bridge contract

```js
const response = await executeToolingBridgeOperation({
  operation: 'jit-compile',
  payload: {
    source: 'template demo { surface card { lane visible { hydrate content } } }',
    filePath: 'demo.rmt',
    safePreview: { options: {} },
    metrics: true
  }
}, { rootDir });
```

`executeToolingBridgeOperation` belongs to `tools/tooling-bridge.js`; `rootDir` is the framework root. `options` contains compiler options. An additional `maraca` object requests the Maraca stage. Without it, no kernel cache is needed. `safePreview: false` disables only the safe-preview stage.

The response still uses `xtend.compiler.tooling-bridge-response.v1`. `result.compile` contains `coreDocument`, `coreJson`, diagnostics and status; `result.safePreview` and `result.maraca` are separate stage results or `null`. `metrics: true` adds process, compile, architecture-check and timing measurements. Check the status of every requested stage. The Docs HTTP formatter keeps its existing contract; browser preview and bridge response are separate layers.

## Cache and failures

The file cache stores only verified framework artifacts, never user source. Its content fingerprint binds sources, templates, manifest, versions, generator dependencies, cache implementation, framework root and Node version. Architecture and integrity checks remain mandatory. Node versions use separate generations.

The directory is private with mode `0700`; files use `0600`. Atomic generations, process locks and a 128 MiB budget bound the cache. Without an explicit path, it uses a user- and framework-specific system temporary directory. Waiting for a concurrent producer is limited to two seconds, after which it reports `cache_busy`.

Missing sources, sources that change during generation and invalid architecture are rejected. If the cache is unwritable, the bridge can use validated artifacts without caching and reports `unavailable`; the preparation CLI exits with an error for this state. Failed compilation does not trigger an automatic second compile.

The PHP bridge bounds stdin, stdout and stderr with one process deadline. It starts when Node starts and excludes any HTTP queue before PHP execution. Aborting ends the affected process; it does not replace host load limits.

## Playground during rapid input

At most one compile/diagnostic request runs at a time. Each operation retains its latest pending source; compilation has priority. Delays are 300 ms for compilation and 160 ms for diagnostics. Run makes compilation immediately eligible.

Edits invalidate old results without aborting fetches on every keystroke and triggering extra backend work. Route teardown ends fetches, scheduler jobs and preview instances. Late preset and preview-boot results are checked against their generation. This browser behavior also applies to the legacy backend.

## Verification

```sh
node scripts/run_xtend_tests.js rmt-jit-hydrangea rmt-playground-docs rmt-playground-security --json
node tests/docs/fixtures/rmt_playground_legacy_runtime_smoke.cjs
```

Fixtures cover result equality, cache integrity, concurrent generation, option isolation, request coordination and late completion. Historical measurements and reproducible scripts live under `tests/performance/hydrangea/`; measure HTTP compile time, cache state and complete preview boot separately. These results are not general latency guarantees.

## Related pages

- [RMT App Platform Tooling](./rmt-app-platform-tooling.md)
- [RMT Playground](./learn-rmt-playground.md)
- [XTend Maraca](./xtend-maraca.md)
- [Release Verification](./release-verification.md)
