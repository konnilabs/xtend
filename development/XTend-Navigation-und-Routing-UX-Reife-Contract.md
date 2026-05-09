# XTend Navigation und Routing UX Reife Contract

- Status: `accepted`
- Contract: `xtend.component.navigation-routing-ux.v1`
- Report: `xtend.component.navigation-routing-ux-report.v1`
- Workpackage: `WP-E11-10`
- Runtime-Profil: `xtendNavigationRoutingUxProfile`
- Fixture: `tests/fixtures/rmt-navigation-routing-ux.rmt`
- Gate: `node scripts/run_xtend_tests.js navigation-routing-ux --json`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Ziel

Navigation und Routing werden als sichtbare Enterprise-UX-Schicht behandelt. RMT darf Route Context, Links, Events, Commands und Schedules deklarieren; XTend bleibt fuer Custom Elements, DOM-Fokus, Active State, Announcements und Browser-Integration verantwortlich.

## Zielkomponenten

- `x-router`
- `x-link`

## Pflichtdomains

- Shell, Style, A11y und Performance
- Active State und `aria-current`
- Focus Restore nach Route Render
- Route Announcements ueber polite Live Regions
- Keyboard Navigation mit Enter und Space
- Events, Commands, State, RMT und Fabric
- Docs und Tests

## Active State

`x-link` spiegelt aktive Routen ueber `active` und `aria-current="page"`. Der Status wird zusaetzlich unter `xlink-active-<id>` gespiegelt, sodass Fabric, RMT-Diagnostik und Tests den sichtbaren Navigationszustand nachvollziehen koennen.

`x-router` haelt den kanonischen Route Context unter `xtend.router.current`. Dieser Context ist die Quelle fuer Link-Abgleich, Route Announcements und Diagnostics Snapshots.

## Focus Restore

Nach erfolgreichem Route Render fokussiert `x-router` sein Outlet mit `preventScroll`. RMT kann diesen Pfad ueber `route.focus.restore` schedulen. Der Fokus bleibt bewusst im Router-Outlet und springt nicht auf beliebige Inhalte, damit Apps eigene Fokusziele spaeter gezielt deklarieren koennen.

## Route Announcements

`x-router` stellt eine polite, atomare Live Region bereit und emittiert `route-announced`. Die Announcement-Quelle ist bevorzugt `metadata.announcement`, danach Route-Metadaten oder der Pfad. Der Announcement-State wird nach `xtend.router.announcement` gespiegelt.

## Keyboard Navigation

`x-link` bleibt semantisch ein Link und unterstuetzt Enter sowie Space. Externe Links behalten natives Browser-Verhalten mit `noopener noreferrer`; interne Links erzeugen `before-navigate`, `x-navigate` und `after-navigate`.

## RMT

Die Fixture `tests/fixtures/rmt-navigation-routing-ux.rmt` beschreibt:

- `xtend.xrouter` als Router-Adapter
- `xtend.component` als Link-Adapter
- `route.visible.render`
- `route.transition.render`
- `route.focus.restore`
- `a11y.announce`
- `ui.user-blocking.navigation`
- `diagnostics.snapshot`

RMT bleibt host-neutral und importiert keine XTend-Typen in den Kernel.

## Fabric

Navigation nutzt:

- `transition` fuer Route Render
- `user-blocking` fuer Link-Aktivierung
- `a11y` fuer Focus Restore und Announcements
- `diagnostics` fuer Snapshots

Alle Events enthalten `source`, `stateKey` und wo passend `scheduleRef`.

## Testing

Der Gate `navigation-routing-ux` prueft:

- Contract Factory und Validator
- RMT Fixture und Referenzauflösung
- Runtime-Profile in `x-router` und `x-link`
- Public Types und Komponenten-Dokumentation
- Package-, Scaffold- und Runner-Verdrahtung
- Epic-, Backlog- und Referenzpfade
