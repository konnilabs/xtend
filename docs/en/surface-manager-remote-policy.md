# SurfaceManager Remote Policy Bridge

`WP-SM-17` connects E16 remote-surface records to the XTend UI surface runtime. The contract `xtend.surface.remote-policy-bridge.v1` belongs to `x-surface-manager`; the RMT kernel remains declarative and executes no remote runtime.

## Decisions

Remote surfaces are converted host-side into exactly one decision. The accepted trust boundary is `xtend.security.remote-surface.v1`.

- `mounted`: owner, version, origin, integrity, trust boundary, capabilities, sandbox/CSP and event governance match.
- `degraded`: a policy violation exists, but an explicit fallback is available.
- `refused`: the surface may not be registered because a hard policy violation exists without fallback.

The SurfaceController remains the only registry. The policy bridge creates no second registry; it only manages host decisions, diagnostics and fallback mapping.

## Manager API

- `evaluateRemoteSurfacePolicy(record, options)` checks a remote surface record without commit.
- `applyRemoteSurfacePolicy(record, options)` checks and registers a mounted or degraded surface with `commit: true`.
- `registerRemoteSurface(record, options)` is the productive mount path for `xtend.surface`.
- `snapshotRemoteSurfacePolicy()` returns `xtend.surface.remote-policy-report.v1`.
- `governRemoteSurfaceEvent(event, payload, options)` checks cross-surface events without an implicit global event bus.

Important host attributes:

- `remote-surface-policy="strict|audit|off"`
- `remote-origin-allowlist="https://cdn.example"`
- `remote-capabilities="surface.mount,event.emit,event.consume"`

## Adapter Boundary

The `xtend.surface` adapter consumes E16 remote-surface records, normalizes them as surface intent and forwards them to the SurfaceManager. It materializes at most a local shell or fallback. It loads no remote bundles, starts no `import()` and executes no remote runtime loading in the RMT kernel.

## Diagnostics

Policy violations are diagnosable, including:

- `xtend.surface.remote-policy.owner-missing`
- `xtend.surface.remote-policy.version-missing`
- `xtend.surface.remote-policy.origin-not-allowed`
- `xtend.surface.remote-policy.integrity-missing`
- `xtend.surface.remote-policy.trust-boundary-refused`
- `xtend.surface.remote-policy.capability-refused`
- `xtend.surface.remote-policy.event-payload-missing`
- `xtend.surface.remote-policy.event-scope-refused`
- `xtend.surface.remote-policy.degradation-blocked`
- `xtend.surface.remote-policy.fallback-missing`

## Gate

```bash
node scripts/run_xtend_tests.js surface-remote-policy --json
```

The gate checks runtime methods, public types, RMT adapter connection, enterprise MFE fixture, degradation/fallback, event governance, package metadata and the boundaries `no second registry` and `no remote runtime loading in the RMT kernel`.
