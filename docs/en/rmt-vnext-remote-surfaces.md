# RMT vNext Remote Surfaces

RMT vNext describes remote surfaces as declarative enterprise MFE contracts. The RMT kernel executes no remote runtime and loads no network sources. Hosts can derive concrete loader, mount, sandbox and rollback decisions from the contract. Boundary: no remote runtime execution in RMT kernel.

## Contract

```js
schema: "xtend.rmt.vnext-remote-surface.v1"
manifestSchema: "xtend.rmt.vnext-remote-surface-manifest.v1"
securitySchema: "xtend.rmt.vnext-remote-security-policy.v1"
compilerSchema: "xtend.rmt.vnext-remote-compiler.v1"
```

A remote surface must explicitly declare:

- `owner` as responsible team or product.
- `version` and `versionRange` for active and expected versions.
- `origin` and `integrity` for manifest and artifact binding.
- `trustBoundary` and sandbox/CSP requirements.
- `fallback` to a local surface or blocking behavior.
- `exposes` as lane and shell-target bindings.
- `emits` and `consumes` as typed cross-surface events.

## Authoring

```rmt
remote surface checkout.cart from remote "@xtend/checkout-cart" {
  owner: "checkout-platform"
  version: "^3.1.0"

  remote {
    origin: "https://mfe.xtend.invalid/checkout"
    integrity: "sha256-demo-integrity"
  }

  trust boundary enterprise.remote.strict {
    sandbox: ["allow-scripts"]
    capabilities: ["surface.mount", "event.emit", "event.consume"]
  }

  exposes {
    critical -> shell.slot:sidebar.cart
    idle -> shell.slot:background.prefetch
  }

  fallback surface panel.checkoutFallback

  emits checkout.cart.updated.v1 {
    owner: "checkout-platform"
    payload: "xtend.schemas.cartUpdated.v1"
    scope: lane critical -> shell.slot:sidebar.cart
  }

  consumes user.session.changed.v1 {
    owner: "identity-platform"
    payload: "xtend.schemas.userSessionChanged.v1"
    scope: shell -> checkout.cart
  }
}
```

The example is intentionally JSON-close: all domain facts can be serialized stably into Core JSON. The language remains readable enough for product teams and strict enough for gate suites.

## Boundaries

- No remote code is executed in the RMT kernel.
- No network access is allowed for language-layer gates.
- Remote surfaces are deny-by-default until owner, version, integrity, trust boundary and fallback are complete.
- SurfaceManager remains runtime orchestration; `surface.registry` remains the declarative enterprise MFE index.

## Gates

```bash
node scripts/run_xtend_tests.js rmt-vnext-remote-manifest --json
node scripts/run_xtend_tests.js rmt-vnext-remote-security --json
node scripts/run_xtend_tests.js rmt-vnext-remote-compiler --json
node scripts/run_xtend_tests.js rmt-vnext-remote-compatibility --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
```

The enterprise demo is in `xtendrmt/rmt-vnext-enterprise-mfe-demo.rmt`; the byte-stable core output is in `xtendrmt/rmt-vnext-enterprise-mfe-demo.core.json`.
