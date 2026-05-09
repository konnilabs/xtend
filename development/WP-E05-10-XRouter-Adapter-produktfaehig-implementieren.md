# WP-E05-10 - XRouter Adapter produktfaehig implementieren

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
- Backlog: `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
- Bezug:
  - `development/WP-E05-06-Native-Routes-Domain-im-RMT-Schema-entwerfen.md`
  - `development/WP-E05-09-Route-Registry-und-Component-Registry-vorbereiten.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-core.d.ts`
  - `xtendrmt/rmt-core.esm.js`
  - `xtendrmt/rmt-runtime.esm.js`
  - `xtendrmt/rmt-runtime.browser.js`
  - `components/xrouter.js`
  - `docs/components/xrouter.md`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-10` macht XRouter zur ersten produktiven Router-Adapter-Implementierung fuer native RMT Routes.

Die Route-Domain bleibt generisch. Der Adapter konsumiert `routeRegistry` aus `xtend.rmt.runtime-registry.v1`, mappt daraus XRouter-kompatible Route Records und kann diese an ein `<x-router>` Ziel uebergeben. Der RMT Kernel registriert keine DOM-Routen, navigiert nicht selbst und importiert weder XRouter noch `xstate`.

## Adapter Contract

Der Contract traegt die stabile ID:

```text
xtend.rmt.xrouter-adapter.v1
```

Der offizielle Adapter Record bleibt:

```text
xtend.xrouter
```

Eingabe ist die Runtime Registry aus:

```text
xtend.rmt.runtime-registry.v1
```

## Runtime Surface

Der Adapter stellt folgende Operationen bereit:

- `registerRoutes`
- `navigate`
- `emitDiagnostic`

Die Build-Artefaktversionen exportieren:

- `createRmtXRouterAdapter`
- `createRenderManXRouterAdapter`
- `RmtXRouterAdapter`
- `RmtXRouterMappedRoute`
- `RmtXRouterRouteMapping`

`components/xrouter.js` stellt fuer Adapter-Ziele bereit:

- `XRouter.registerRoutes(routes, options)`
- `XRouter.navigate(to, options)`
- `XRouter.createRouteElementFromRecord(route, documentTarget)`
- `XRouter.normalizeRmtRouteRecord(route)`

## Route Mapping

Der Adapter liest `routeRegistry.byRouter["xtend.xrouter"]` und mappt `RmtRouteRegistryEntry` auf XRouter-kompatible Records.

Gemappte Felder:

- `id`
- `path`
- `router`
- `component`
- `template`
- `redirect`
- `scheduleRef`
- `params`
- `query`
- `metadata`
- `lifecycle`

Fuer DOM-nahe XRouter-Ziele erzeugt das Mapping Attribute wie:

- `path`
- `component`
- `title`
- `redirect`
- `import`
- `data-rmt-route-id`
- `data-rmt-router`
- `data-rmt-template`
- `data-rmt-schedule`
- `data-rmt-params`
- `data-rmt-query`
- `data-rmt-metadata`

Damit kann XRouter RMT Routes als normale `<x-route>` Struktur verarbeiten, waehrend RMT weiterhin nur neutrale Route Records beschreibt.

## Navigation Sync

Navigation kann ueber den Adapter angestossen werden:

- `adapter.navigate('/path')`
- `adapter.navigate({ routeId: 'home' }, { mapping })`
- `adapter.navigate({ path: '/search', params, query })`

Wenn ein XRouter-Ziel vorhanden ist, nutzt der Adapter `target.navigate(...)` oder `_navigateTo(...)`. Wenn nur eine `xstate` Bridge vorhanden ist, schreibt der Adapter `router-navigate` und `xtend.router.rmtNavigation`. Ohne Ziel erzeugt er `rmt.xrouter.navigation.skipped`.

XRouter selbst emittiert weiter:

- `route-changed`
- `routechange`
- `xrouter-after-navigate`

Das Route-Detail enthaelt jetzt zusaetzlich RMT-relevante Felder:

- `routeId`
- `template`
- `scheduleRef`
- `metadata`

## Schedule Coupling

`scheduleRef` wird aus `routes[*].schedule` bzw. `RmtRouteRegistryEntry.scheduleRef` in das Mapping uebernommen und als `data-rmt-schedule` an XRouter-Routen weitergereicht.

Der Adapter fuehrt keine Scheduler-Arbeit selbst aus. `WP-12` kann darauf aufbauen und Route-Wechsel, State Bridge und Diagnostics gegen Schedule Policies koppeln.

## Diagnostics

Die erste Diagnostic-Matrix umfasst:

- `rmt.xrouter.route.missing_path`
- `rmt.xrouter.route.missing_component`
- `rmt.xrouter.target.missing`
- `rmt.xrouter.navigation.skipped`

Fehlende Pfade oder Renderziele werden beim Mapping sichtbar. Ein fehlendes Router-Ziel ist nur eine Info-Diagnostic, solange der Adapter eine uebertragbare Route-Konfiguration zurueckgibt.

## Kernel Boundary

Der RMT Kernel darf:

- `xtend.xrouter` als Adapter-ID sehen
- `registerRoutes` und `navigate` als Adapter-Operationen modellieren
- Runtime Registry Snapshots an den Adapter uebergeben
- Diagnostics und Operation Results auswerten

Der RMT Kernel darf nicht:

- XRouter importieren
- `<x-route>` DOM selbst erzeugen
- URL-State oder Hash-State schreiben
- `xstate` direkt fuer Navigation setzen
- XRouter als einzige Router-Implementierung erzwingen

## Handoff an Folgepakete

- `WP-11` kann XTend Component Adapter gegen dieselbe Registry-/Adaptergrenze produktiv machen.
- `WP-12` kann Navigation Sync, Scheduler Coupling und Diagnostics Bridge ueber `scheduleRef`, `route-changed` und Adapter Results anbinden.
- `WP-14` kann die Bestcase-Demo auf native `routes` migrieren und Demo-eigene XRouter-Mapping-Logik entfernen.
- `WP-15` kann Browser-naehere Contract- und Runtime-Tests fuer den produktiven Bridge-Fluss ergaenzen.

## Verifikation

Mindestgates:

```bash
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```

Die RMT-Kompatibilitaetssuite prueft den Adapter ueber die Build-Artefaktversion in `xtendrmt/rmt-core.esm.js` und einen Fake-XRouter-Target.

## Ergebnis

`WP-10` ist abgeschlossen. Native RMT Routes koennen ueber `xtend.xrouter` in XRouter-kompatible Route Records gemappt, an XRouter registriert und fuer Navigation genutzt werden. XRouter bleibt Adapter, nicht Kernelwissen.
