# RMT Remote Surfaces

Describe, load and degrade remote UI areas safely.

## What it covers

Remote surfaces are registered UI candidates with owner, version, origin, integrity, capabilities, and fallback. The registry describes them; the host alone decides after policy evaluation whether to load a module.

## Public building blocks

- `tools/rmt-language/vnext-remote-manifest.js` reads static manifest facts.
- `tools/rmt-language/vnext-remote-security.js` evaluates trust and capabilities.
- `tools/rmt-language/vnext-remote-compiler.js` emits host-neutral core records.

## Recommended workflow

Register a local fallback first. Then validate origin, version, and integrity, grant only required capabilities, and load the remote module only after a positive policy report.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT vNext Enterprise Surface Registry](./rmt-vnext-surface-registry-enterprise.md)
- [RMT vNext Enterprise MFE contract](./rmt-vnext-remote-surfaces.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Remote surface contract

A remote surface is a declared area, not foreign runtime execution inside the kernel. The schema `xtend.rmt.vnext-remote-surface.v1` describes the surface itself; `xtend.rmt.vnext-remote-surface-manifest.v1` describes version, integrity, fallback and owner. Security decisions flow through `xtend.rmt.vnext-remote-security-policy.v1`; compiler normalization and tooling use `xtend.rmt.vnext-remote-compiler.v1`.

```rmt
remote surface checkout.cart from remote {
  owner commerce.checkout
  version "1.0.0"
  shellTarget "checkout"
  fallback surface checkout.cart.fallback
}
```

The core boundary is `no-remote-runtime-execution-in-rmt-kernel`. The kernel sees records, policies, schedules and diagnostics; loading, caching or executing production remote bundles remains host-adapter logic.

## Architecture layers

Remote-surface architecture uses explicit layers so hosts can choose the right orchestration path:

1. **XScaler Preflight** is the static gate. It accepts or rejects the surface plan from manifest, policy, integrity, fallback and host-capability facts before remote code runs.
2. **XScaler ATC** starts only after an accepted Preflight response. It owns the flight session, client/server communication, handoff into the host runtime and lifecycle orchestration such as attach, detach, cancel, fallback and diagnostics.
3. **Maraca Runtime** runs on the client. It accepts the handed-off stream, processes runtime records, executes declared actions, routes events and materializes surfaces through safe DOM descriptor or component renderers.
4. **XSurface Shard Server Layer** is the server-side remote-surface orchestration layer. It can partition remote surfaces by shard, coordinate server-owned lifecycle state, publish stream fragments and expose ATC-compatible handoff signals.
5. **Generic server endpoints** are the fallback path when there is no XSurface Shard Server or remote surface orchestration. They expose ordinary data, action or SSR endpoints; the client consumes them as generic resources rather than as orchestrated remote surfaces.
6. **RMT Kernel/Fabric** evaluates policies, produces schedules, assigns lanes and emits diagnostics. It observes records and orchestration signals, but the invariant remains `no-remote-runtime-execution-in-rmt-kernel`: private remote execution belongs to host adapters, shard servers or generic endpoints, never to the kernel.

## Enterprise fixture

The verifiable Enterprise path lives in `xtendrmt/rmt-vnext-enterprise-mfe-demo.rmt`. This fixture combines local surfaces, one remote surface, degradation, remote security and cross-surface events. The Core output `xtendrmt/rmt-vnext-enterprise-mfe-demo.core.json` is the golden artifact for reviews; the browser smoke `tests/browser/fixtures/rmt-vnext-enterprise-mfe-smoke.html` stays offline and must not require `fetch(` or dynamic imports.

Run these gates when remote-surface records or manifest rules change:

```bash
node scripts/run_xtend_tests.js rmt-vnext-remote-manifest rmt-vnext-remote-security rmt-vnext-enterprise-fixtures --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
```

A green result confirms that remote-surface records, manifest schema, security rules and Enterprise smoke artifacts still agree.
