# XTensions React Host Adapter Contract

Status: `accepted-by-XTN-18`

Contract: `xtend.xtensions.react-adapter.v1`

React XTensions are mounted through the common HostController surface:
`mount`, `update`, `suspend`, `resume`, `reportError`, `unmount`, and
`snapshot`. The former `react-host-controller-poc` module remains available as
a compatibility and negative-boundary reference.

## Runtime Boundary

- Default strategy: `external-peer` / `host-provided`.
- React and ReactDOM must be provided by the product host through local runtime
  provider modules.
- XTension bundles must not contain React runtime signatures when the manifest
  declares `bundled: false`.
- `startTransition` is a scheduling hint only; Fabric lanes keep authority.
- React context, store and Fiber fields are internal-only and are rejected when
  exposed in payloads.
- Error and Suspense boundary states emit diagnostics.

## Gate Evidence

Local gates validate the adapter contract, package exports, host runtime
boundary, payload guards, artifact truth checks and the retained PoC suite:

```sh
node scripts/run_xtend_tests.js xtensions-react-host-adapter xtensions-react-host-controller-poc --json
```
