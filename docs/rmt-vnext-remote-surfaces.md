# RMT vNext Remote Surfaces

RMT vNext beschreibt Remote Surfaces als deklarative Enterprise-MFE-Contracts.
Der RMT-Kernel fuehrt keine Remote Runtime aus und laedt keine Netzwerkquellen.
Hosts koennen aus dem Contract konkrete Loader-, Mount-, Sandbox- und Rollback-
Entscheidungen ableiten.
Boundary: no-remote-runtime-execution-in-rmt-kernel.

## Contract

```js
schema: "xtend.rmt.vnext-remote-surface.v1"
manifestSchema: "xtend.rmt.vnext-remote-surface-manifest.v1"
securitySchema: "xtend.rmt.vnext-remote-security-policy.v1"
compilerSchema: "xtend.rmt.vnext-remote-compiler.v1"
```

Eine Remote Surface muss explizit deklarieren:

- `owner` als verantwortliches Team oder Produkt.
- `version` und `versionRange` fuer aktive und erwartete Versionen.
- `origin` und `integrity` fuer Manifest- und Artefaktbindung.
- `trustBoundary` und Sandbox-/CSP-Anforderungen.
- `fallback` auf eine lokale Surface oder ein blockierendes Verhalten.
- `exposes` als Lane- und Shell-Target-Bindings.
- `emits` und `consumes` als typisierte Cross-Surface-Events.

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

Das Beispiel ist absichtlich JSON-nah: alle fachlichen Fakten koennen stabil in
Core JSON serialisiert werden. Die Sprache bleibt dabei lesbar genug fuer
Produktteams und strikt genug fuer Gate-Suites.

## Boundaries

- Kein Remote-Code wird im RMT-Kernel ausgefuehrt.
- Kein Netzwerkzugriff ist fuer Language-Layer-Gates erlaubt.
- Remote Surfaces sind deny-by-default, bis Owner, Version, Integrity,
  Trust Boundary und Fallback vollstaendig sind.
- SurfaceManager bleibt Runtime-Orchestrierung; `surface.registry` bleibt der
  deklarative Enterprise-MFE-Index.

## Gates

```bash
node scripts/run_xtend_tests.js rmt-vnext-remote-manifest --json
node scripts/run_xtend_tests.js rmt-vnext-remote-security --json
node scripts/run_xtend_tests.js rmt-vnext-remote-compiler --json
node scripts/run_xtend_tests.js rmt-vnext-remote-compatibility --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
```

Die Enterprise Demo liegt in `xtendrmt/rmt-vnext-enterprise-mfe-demo.rmt`; der
byte-stabile Core Output liegt in `xtendrmt/rmt-vnext-enterprise-mfe-demo.core.json`.
