# XTensions Security Checklist

Review every XTension before the host loads its runtime or calls `mount()`. The checklist applies to framework adapters, imperative libraries, Canvas and WebGL hosts, and controlled remote artifacts.

A failed check degrades or blocks the affected surface. It must not be bypassed through silent downloads, weaker CSP or an uncontrolled fallback.

## Identity and provenance

- A domain owner and a technical owner are named.
- ID, version and entry agree across contract, manifest and registry.
- The shipped artifact has a verified SHA-256 fingerprint.
- Fallback is available locally and does not need the external runtime.
- Framework versions are classified as `host-provided` or `external-peer`.
- No external runtime is hidden as a root dependency or vendored file in the XTend package.

A minimal dependency record looks like this:

```json
{
  "name": "react",
  "versionRange": "18.x || 19.x",
  "classification": "host-provided",
  "bundled": false,
  "packageIncluded": false
}
```

## CSP and loading

Allow only sources the adapter actually needs. Review at least `script-src`, `style-src`, `img-src`, `connect-src`, `worker-src` and `object-src`. A local default gate must not require a CDN exception.

Remote artifacts additionally require an explicit origin policy, integrity, version and local fallback. A manifest is not permission to dynamically import arbitrary URLs.

## Runtime boundary

- The host checks capabilities before `mount()`.
- Props, KernelSignals and SurfaceEvents are serializable.
- Payload schema, owner, direction, trust boundary and Fabric lane are defined.
- DOM events, framework contexts and class instances do not cross the host boundary.
- `reportError()` redacts secrets, tokens, HTML and unapproved stack data.
- A missing peer does not block the shell, navigation or other surfaces.

## Cleanup

Inventory every listener, timer, observer, worker, request, render loop and GPU resource. `unmount()` must release them even after a partially failed mount.

Test the failure path separately. If framework initialization throws after creating the first observer but before rendering, that observer must still be removed. A cleanup stack of idempotent functions is more robust than several interdependent teardown branches.

## Run the gate

```bash
node scripts/run_xtend_tests.js xtensions-security-integrity-gate xtensions-host-controller xtensions-runtime-capability-registry --json
```

The expected result is an allowed adapter for the valid fixture and `policy-blocked` for invalid integrity, forbidden dependency classification or missing fallback. The negative fixture is part of the evidence; a gate that observes only the happy path is insufficient.

## Resolve findings

For an integrity failure, rebuild the controlled artifact and update manifest and fingerprint together. Do not disable the check or accept a hash from an unknown source.

For a CSP violation, decide whether the access belongs to the product contract. If it does, constrain the exact origin and resource type. A broad wildcard is not a repair.

For missing cleanup, add ownership to the adapter. The shell cannot remove listeners it does not know about, and the framework cannot release host observers created outside its root.

## Next steps

- [XTensions Authoring Guide](./xtensions-authoring-guide.md)
- [XTensions Migration and Coexistence](./xtensions-migration-coexistence-guide.md)
- [Manifest Import Policy](./manifest-import-policy.md)
- [Supply Chain Checks](./supply-chain-gates.md)
