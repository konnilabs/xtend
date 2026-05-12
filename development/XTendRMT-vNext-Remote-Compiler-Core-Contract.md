# XTend RMT vNext Remote Compiler Core Contract

- Status: `accepted`
- Workpackage: `WP-E16-08`
- Module: `tools/rmt-language/vnext-remote-compiler.js`
- Suite: `tests/rmt-language/rmt_vnext_remote_compiler_suite.js`
- Local Gate: `node scripts/run_xtend_tests.js rmt-vnext-remote-compiler --json`

## Contract

```js
schema: "xtend.rmt.vnext-remote-compiler.v1"
reportSchema: "xtend.rmt.vnext-remote-compiler-report.v1"
coreSchema: "xtend.rmt.core-format.vnext.v1"
```

The remote compiler extends the normal RMT vNext parser/compiler pipeline with
authoring support for declarative remote surfaces:

```rmt
remote surface checkout.cart from remote "@xtend/checkout-cart" {
  owner team "checkout-platform"
  version "^2.4.0"
  origin "https://cdn.xtend.example"
  integrity sha256 "sha256-..."
  trust boundary "xtend.security.remote-surface.v1"
  fallback surface checkout.cart.fallback

  exposes lane critical -> shell.slot "sidebar.cart"

  emits checkout.cart.updated.v1 {
    owner team "checkout-platform"
    direction outbound
    lane critical
    payload "xtend.schemas.cartUpdated.v1"
  }
}
```

## Mapping

`compileRmtVNextRemoteSource()` produces a JSON-compatible core bundle with:

- `document.remoteSurfaces[]` from the parser/compiler AST.
- `remoteManifests[]` using `xtend.rmt.vnext-remote-surface-manifest.v1`.
- `enterpriseRegistry` using `xtend.rmt.vnext-enterprise-surface-registry.v1`.
- `crossSurfaceEvents` using `xtend.rmt.vnext-cross-surface-event-report.v1`.
- `eventGovernance` using `xtend.rmt.vnext-event-governance-report.v1`.
- `degradation` using `xtend.rmt.vnext-degradation-report.v1`.

Remote execution remains outside the RMT kernel. The compiled records require a
host-owned adapter boundary, deny-by-default capabilities, integrity metadata,
trust boundary, shell-scoped event bindings and fallback surfaces before a remote
surface can be marked ready.
