# RMT vNext Enterprise Surface Registry

`surface.registry` is the shared enterprise MFE index for local and remote surfaces. It is not a runtime manager and not a global event bus, but an auditable snapshot for ownership, discoverability, active versions, shell targets, lanes, fallbacks and event facts.

## Contract

```js
schema: "xtend.rmt.vnext-enterprise-surface-registry.v1"
surfaceSchema: "xtend.rmt.vnext-enterprise-surface.v1"
targetReadiness: "rmt-vnext-enterprise-mfe-ready"
```

The registry snapshot answers the enterprise questions:

- Which surfaces exist at runtime?
- Which team owns which surface?
- Which version is active and which range was expected?
- Which shell targets and lanes are bound?
- Which surfaces are local, remote or fallback?
- Which events may leave or reach a surface?
- Which degradation policy applies on incompatibility?

## Registry Shape

```json
{
  "schema": "xtend.rmt.vnext-enterprise-surface-registry.v1",
  "registryId": "enterprise:xtend.enterprise-mfe.demo",
  "surfaceCount": 4,
  "localSurfaceCount": 3,
  "remoteSurfaceCount": 1,
  "indexes": {
    "byOwner": {
      "checkout-platform": ["surface:panel.checkoutFallback", "remote:checkout.cart"]
    },
    "byShellTarget": {
      "shell.slot:sidebar.cart": ["remote:checkout.cart"]
    }
  }
}
```

The registry may be read by hosts and operations tools. It remains a language-layer artifact and creates no implicit runtime connections.

## Ownership

Every surface needs a domain owner. The owner is responsible for:

- version range and active version
- fallback surface or blocking degradation path
- event ownership and payload ownership
- security policy and trust boundary
- migration notes for legacy surface facts

## Discoverability

Discoverability comes from stable indexes, not runtime heuristics. The registry must be resolvable at least by surface name, owner, shell target, lane, status, remote ID and fallback. The demo scenario validates this through `tools/rmt-language/vnext-enterprise-fixtures.js`.

## Gates

```bash
node scripts/run_xtend_tests.js rmt-vnext-enterprise-registry --json
node scripts/run_xtend_tests.js rmt-vnext-degradation --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-fixtures --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
```

The operational handoff is summarized in `docs/rmt-vnext-enterprise-mfe-handoff.md`.
