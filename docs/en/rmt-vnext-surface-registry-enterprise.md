# RMT vNext Enterprise Surface Registry

The Enterprise Surface Registry describes which local and remote surfaces a host may discover without turning the registry into a runtime manager. It is a discovery and audit artifact for micro-frontend shells: owner, shell target, fallback, version, integrity and governance are brought together here.

## Public contract

The stable schema is `xtend.rmt.vnext-enterprise-surface-registry.v1`. In the RMT document the registry appears as `surface.registry`. Third-party developers can rely on the registry being indexed by owner and shell target; the concrete indexes are `byOwner` and `byShellTarget`.

Executing a remote bundle is not part of this contract. The registry says which surface is known as a candidate. Loading, networking, caching, sandboxing and rollout remain host-adapter decisions.

## Registry records

```rmt
surface.registry commerce.enterprise {
  surface checkout.cart owner commerce.checkout shellTarget "checkout"
  surface commerce.summary owner commerce shellTarget "summary"
}
```

A record must at least expose the surface ID, owner and shell target. Remote surfaces also receive version, integrity and fallback from the remote manifest. Local surfaces only need the shell mapping as long as the Core document describes the surface itself.

## Enterprise readiness

The target state for this path is `rmt-vnext-enterprise-mfe-ready`. It means:

- Remote surface manifest and Enterprise Registry can be verified locally.
- Degradation and remote security are visible as Core policies.
- Cross-surface events have explicit owners, versions and payload contracts.
- The browser smoke stays offline and executes no remote runtime in the kernel.

Related files:

- `demos/xtendrmt/fixtures/enterprise-mfe/source.rmt`
- `demos/xtendrmt/fixtures/enterprise-mfe/generated/core.json`
- `tests/browser/fixtures/rmt-vnext-enterprise-mfe-smoke.html`
- `tests/rmt-language/fixtures/vnext-enterprise-mfe-fixture-matrix.json`

## Host indexes

`byOwner` answers which surfaces belong to a responsible team or package. `byShellTarget` answers which surfaces may be placed into a shell area. Both indexes must stay deterministic; otherwise reviews and tooling cannot tell whether a surface was merely moved or changed semantically.

A host can read the registry to prepare a route or slot. It must not build an implicit global surface manager from it. If multiple remote surfaces claim the same shell target, the degradation policy decides which fallbacks become active.

## Minimal verification path

```bash
node scripts/run_xtend_tests.js rmt-vnext-enterprise-registry --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-fixtures rmt-vnext-enterprise-release --json
```

If the first command fails, the registry itself is incomplete. If the second command fails, the registry, fixture, Core output or browser smoke no longer agree.

## Specific failure modes

- Missing `byOwner` index: check the owner mapping in the `surface.registry` record.
- Missing `byShellTarget` index: add the shell target to the surface record.
- Duplicate surface ID: registry and Core document must use the same ID resolution.
- Core output drift: update `demos/xtendrmt/fixtures/enterprise-mfe/generated/core.json` only together with the source and release handoff.

## Related reading

Remote surface guidance applies registry ownership, integrity, fallback, and capability fields at runtime. [Related article](./rmt-vnext-remote-surfaces.md)
