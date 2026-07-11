# SurfaceManager Remote Surfaces

A remote surface is a registered candidate, not an automatically executable module. The host checks static manifest facts and SurfaceManager policy before runtime code loads or a container opens.

## Required facts

A record identifies `surfaceId`, owner, version, origin, entry, integrity, required capabilities, and a local fallback. `remote-origin-allowlist` and `remote-capabilities` on the manager constrain the host. The browser decision is implemented in `components/xsurfacemanager.js`; RMT manifests are evaluated earlier by `tools/rmt-language/vnext-remote-security.js`.

## Policy flow

`evaluateRemoteSurfacePolicy()` returns a report without execution. `registerRemoteSurface()` registers an accepted record only. Materialization loads the known entry, binds it to a host-owned container, and publishes `remote-surface-mounted`. A remote surface receives no implicit router, storage, or network capability.

Cross-surface events pass through `governRemoteSurfaceEvent()`. Owner, version, and payload must match the contract. A global event bus or shared framework context bypasses this boundary and is unsupported.

## Degradation and security

Origin, integrity, or capability failures produce `remote-surface-refused`; a failure after accepted registration produces `remote-surface-degraded`. In either case, the local fallback remains visible and the diagnostic names the reason. Runtime reconstructs no tokens and loads no alternate URL from remote input.

Same-realm execution is not a hard security boundary. Sensitive or untrusted content requires stronger host isolation outside this surface runtime.

## Related pages

- [RMT Remote Surfaces](./rmt-vnext-remote-surfaces.md)
- [Surface Registry](./rmt-vnext-surface-registry-enterprise.md)
- [SurfaceManager Runtime](./surface-manager-runtime.md)
