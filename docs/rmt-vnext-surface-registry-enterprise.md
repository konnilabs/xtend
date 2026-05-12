# RMT vNext Enterprise Surface Registry

`surface.registry` ist der gemeinsame Enterprise-MFE-Index fuer lokale und
remote Surfaces. Er ist kein Runtime-Manager und kein globaler Event Bus,
sondern ein auditierbarer Snapshot fuer Ownership, Discoverability, aktive
Versionen, Shell Targets, Lanes, Fallbacks und Event-Fakten.

## Contract

```js
schema: "xtend.rmt.vnext-enterprise-surface-registry.v1"
surfaceSchema: "xtend.rmt.vnext-enterprise-surface.v1"
targetReadiness: "rmt-vnext-enterprise-mfe-ready"
```

Der Registry-Snapshot beantwortet die Enterprise-Fragen:

- Welche Surfaces existieren zur Laufzeit?
- Welches Team besitzt welche Surface?
- Welche Version ist aktiv und welche Range wurde erwartet?
- Welche Shell Targets und Lanes sind gebunden?
- Welche Surfaces sind lokal, remote oder Fallback?
- Welche Events duerfen eine Surface verlassen oder erreichen?
- Welche Degradation-Policy gilt bei Inkompatibilitaet?

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

Die Registry darf von Hosts und Operations-Tools gelesen werden. Sie bleibt aber
ein Language-Layer-Artefakt und erzeugt keine impliziten Runtime-Verbindungen.

## Ownership

Jede Surface braucht einen fachlichen Owner. Der Owner verantwortet:

- Version Range und aktive Version.
- Fallback-Flaeche oder blockierenden Degradation-Pfad.
- Event Ownership und Payload Ownership.
- Security Policy und Trust Boundary.
- Migrationshinweise fuer Legacy-Surface-Fakten.

## Discoverability

Discoverability entsteht ueber stabile Indizes, nicht ueber Laufzeit-Heuristik.
Die Registry muss mindestens nach Surface Name, Owner, Shell Target, Lane,
Status, Remote ID und Fallback aufloesbar sein. Das Demo-Szenario validiert dies
ueber `tools/rmt-language/vnext-enterprise-fixtures.js`.

## Gates

```bash
node scripts/run_xtend_tests.js rmt-vnext-enterprise-registry --json
node scripts/run_xtend_tests.js rmt-vnext-degradation --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-fixtures --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
```

Der operative Handoff ist in `docs/rmt-vnext-enterprise-mfe-handoff.md`
zusammengefasst.
