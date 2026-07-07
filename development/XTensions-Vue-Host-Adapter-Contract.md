# XTensions Vue Host Adapter Contract

Status: `accepted-by-XTN-19`

Contract: `xtend.xtensions.vue-adapter.v1`

Vue XTensions are mounted through the common HostController surface:
`mount`, `update`, `suspend`, `resume`, `reportError`, `unmount`, and
`snapshot`. The former `vue-host-controller-poc` module remains available as a
compatibility and negative-boundary reference.

## Runtime Boundary

- Default strategy: `external-peer` / `host-provided`.
- Vue must be provided by the product host through a local runtime provider
  module.
- XTension bundles must not contain Vue runtime signatures when the manifest
  declares `bundled: false`.
- Updates must use explicit adapters such as `applyPropsUpdate`; implicit
  `globalProperties.$patch` updates are blocked.
- Vue Proxy, Ref and store internals are internal-only and are rejected when
  exposed in payloads.
- Events are normalized as SurfaceEvents before crossing into Fabric.

## Gate Evidence

Local gates validate the adapter contract, package exports, host runtime
boundary, explicit update adapters, artifact truth checks and the retained PoC
suite:

```sh
node scripts/run_xtend_tests.js xtensions-vue-host-adapter xtensions-vue-host-controller-poc --json
```
