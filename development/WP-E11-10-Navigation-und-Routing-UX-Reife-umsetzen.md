# WP-E11-10 - Navigation und Routing UX-Reife umsetzen

- Status: `completed`
- Contract: `xtend.epic11.wp10.navigation-routing-ux.v1`
- Akzeptierter Zielcontract: `xtend.component.navigation-routing-ux.v1`
- Gate: `node scripts/run_xtend_tests.js navigation-routing-ux --json`

## Ziel

Navigation und Routing sollen als Enterprise-UX-Familie dieselben Reifegrade wie Form Controls und Feedback/Status erhalten. Der Fokus liegt auf Active State, Focus Restore, Route Announcements, Keyboard Navigation, RMT Shell Authoring und Fabric-Lane-Kompatibilitaet.

## Umgesetzte Artefakte

- Contract-Dokument `development/XTend-Navigation-und-Routing-UX-Reife-Contract.md`
- Factory und Validator in `xtend-builder/typing/navigation-routing-ux-contract.js`
- RMT Shell-first Fixture `tests/fixtures/rmt-navigation-routing-ux.rmt`
- Gate `tests/components/navigation_routing_ux_suite.js`
- Runner-ID `navigation-routing-ux`
- Package-Export `./builder/typing/navigation-routing-ux-contract`
- Package-Script `npm run test:navigation-routing-ux`
- Runtime-Profil `xtendNavigationRoutingUxProfile` fuer `x-router` und `x-link`

## Komponentenstatus

| Komponente | Status | Ergebnis |
|------------|--------|----------|
| `x-router` | `ux-stable` | Route Context, Focus Restore, `route-announced`, Live Region, Snapshot und RMT/Fabric-Profil |
| `x-link` | `ux-stable` | `aria-current`, Active-State-Spiegel, Enter/Space-Aktivierung, Event-Details und RMT/Fabric-Profil |

## Entscheidungen

- `x-router` bleibt Host-Adapter fuer RMT Routes und importiert kein RMT-Kernelwissen.
- Route Announcements laufen ueber eine interne polite Live Region plus `route-announced`.
- Focus Restore fokussiert das Router-Outlet nach dem Rendern mit `preventScroll`.
- `x-link` behaelt native Link-Semantik und verhindert nur interne SPA-Navigation.
- Eventdetails enthalten `source`, `stateKey` und wo passend `scheduleRef`.

## Abnahme

- `xtend.component.navigation-routing-ux.v1` ist dokumentiert.
- `x-router` und `x-link` stellen `xtendNavigationRoutingUxProfile` bereit.
- Die RMT-Fixture bildet Router, Links, Route Context, Active State, Focus Restore und Announcements ab.
- Package, Scaffold und Runner kennen den neuen Gate.
- Epic und Backlog markieren `WP-E11-10` als abgeschlossen und `WP-E11-11` als startbar.

## Verifikation

```bash
node --check xtend-builder/typing/navigation-routing-ux-contract.js
node --check tests/components/navigation_routing_ux_suite.js
node --check components/xrouter.js
node --check components/xlink.js
node scripts/run_xtend_tests.js navigation-routing-ux --json
```
