# xrouter - XTend Komponente

## Uebersicht

`<x-router>` ist der clientseitige Router fuer XTend-SPAs. Er verarbeitet deklarative `<x-route>`-Definitionen, unterstuetzt Hash- und History-Mode und synchronisiert Navigation mit `xstate`.

## Kernverhalten

- nur direkte `<x-route>`-Kinder von `<x-router>` gelten als Top-Level-Routen
- Nested Routes werden ausschliesslich ueber direkte Kind-Routen der jeweiligen Elternroute verarbeitet
- Navigation kann deklarativ, per `x-link` oder programmatisch ueber `xstate.set('router-navigate', '/ziel')` angestossen werden

## Verwendung

```html
<x-router mode="history">
  <x-route path="/" component="x-home" import="/components/xhome.js" title="Home"></x-route>
  <x-route path="/docs" component="x-docs" import="/components/xdocs.js" title="Docs">
    <x-route path=":topic" component="x-doc-topic" import="/components/xdoctopic.js" title-template="{{params.topic}} | XTend Docs"></x-route>
  </x-route>
  <x-route path="*" component="x-notfound" import="/components/xnotfound.js"></x-route>
</x-router>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `mode` | string | `hash` oder `history` |
| `routesrc` | string | optionale JSON-Quelle fuer Routen |
| `skeleton` | string | aktiviert einen nativen Route-Skeleton-Fallback waehrend Import, Definition und Hydration |
| `skeleton-lines` | number | Anzahl der Skeleton-Zeilen fuer den Route-Fallback |
| `skeleton-min-height` | string | stabile Mindesthoehe des Route-Fallbacks |
| `title-template` / `document-title-template` | string | globales Template fuer den Dokumenttitel, z.B. `{{title}} | App` |
| `title-prefix` / `title-suffix` | string | einfacher Prefix/Suffix fuer Routentitel ohne Template |
| `default-title` | string | Fallback, wenn eine Route keinen Titel definiert |

## Document Title Rewrite und SEO Meta

XRouter schreibt nach jedem erfolgreichen Route-Match den Browser-Titel und die SEO-Metatags `description` und `keywords`. Dadurch bleibt eine SPA nicht auf dem Initialtitel stehen, und RMT-Routen koennen Titelinformationen ohne XTend-spezifische Runtime-Imports liefern.

Direkte Route-Attribute:

```html
<x-router mode="hash" document-title-template="{{title}} | XTend">
  <x-route
    path="/components/x-router"
    component="x-doc-page"
    title="XRouter"
    document-title="XRouter Routing und SEO"
    meta-description="Routing, Seitentitel und RMT Route Metadata"
    meta-keywords="xtend, xrouter, rmt">
  </x-route>
</x-router>
```

RMT kann dieselben Werte ueber Route-Records und `metadata` liefern:

```json
{
  "id": "settings",
  "path": "/settings",
  "router": "xtend.xrouter",
  "component": "page.settings",
  "metadata": {
    "title": "Settings",
    "documentTitle": "Settings | XTend App",
    "metaDescription": "Einstellungen der XTend RMT App",
    "seo": {
      "keywords": ["xtend", "rmt", "routing"]
    }
  }
}
```

Unterstuetzte Template-Variablen sind `{{title}}`, `{{routeTitle}}`, `{{documentTitle}}`, `{{path}}`, `{{routeId}}`, `{{component}}`, `{{params.name}}`, `{{query.name}}` und `{{metadata.name}}`. Bei Nested Routes gewinnt die Leaf-Route, damit Deep Links eigene Titel bekommen.

## Events

| Event | Beschreibung |
|-------|--------------|
| `xrouter-before-navigate` | cancelable, vor programmatischer Router-Navigation |
| `route-changed` | wird nach erfolgreicher Navigation emittiert |
| `routechange` | Legacy-Alias zu `route-changed` |
| `xrouter-after-navigate` | Legacy-Window-Event nach dem Rendern einer Route |
| `route-announced` | wird nach dem Schreiben der Route-Live-Region emittiert |
| `xrouter-skeleton-shown` / `xrouter-skeleton-hidden` | markieren den nativen Route-Skeleton-Lifecycle |
| `xrouter-route-hydrated` | wird nach Loader-basierter Hydration des gerenderten Route-Subtrees emittiert |
| `xrouter-title-updated` | wird nach dem Schreiben von `document.title` und SEO-Metatags emittiert |
| `xrouter-scroll-boundary-normalized` | wird emittiert, wenn der Router nach einem Route-Wechsel eine stale Scrollposition oder eine Deadzone unterhalb des Contentbereichs korrigiert |
| `xrouter-navigation-overlays-closed` | wird emittiert, wenn der Router vor einem Route-Render offene App-Shell-Overlays wie `x-header` schliesst |

## XState-Keys

- `router-navigate`: programmatischer Navigationseingang
- `router-navigated`: zuletzt angestossener Zielpfad
- `router-current`: aktuell gerenderte Route
- `router-rendered`: zuletzt erfolgreich gerenderte Route
- `router-scroll-boundary`: Legacy-Snapshot der letzten Scroll-Boundary-Pruefung
- `router-closed-navigation-overlays`: Legacy-Snapshot der vor dem Route-Render geschlossenen Navigationsoverlays
- `xtend.router.current`: kanonischer Route Context
- `xtend.router.announcement`: zuletzt angekuendigte Route
- `xtend.router.documentMeta`: zuletzt gesetzter Dokumenttitel und SEO-Metatags
- `xtend.router.skeleton`: aktueller Route-Skeleton-Lifecycle
- `xtend.router.scrollBoundary`: kanonischer Snapshot der letzten Scroll-Boundary-Pruefung
- `xtend.router.closedNavigationOverlays`: kanonischer Snapshot der vor dem Route-Render geschlossenen Navigationsoverlays

Die kanonischen Spiegelpfade werden ebenfalls gepflegt:

- `xtend.router.lastNavigated`
- `xtend.router.current`
- `xtend.router.lastRendered`

## Route-Detail

`route-changed` und `xrouter-after-navigate` liefern ein Detailobjekt mit:

```js
{
  path: '/docs/router',
  routeId: 'docs-topic',
  component: 'x-doc-topic',
  params: { topic: 'router' },
  query: {},
  template: 'docs.topic.shell',
  scheduleRef: 'route.visible.render',
  title: 'Router',
  documentTitle: 'Router | XTend Docs',
  meta: {
    schema: 'xtend.router.document-meta.v1',
    scheduleRef: 'route.document.title.rewrite'
  },
  metadata: {}
}
```

Bei Nested Routes ist `component` die Leaf-Route; `params` werden aus der kompletten Match-Kette zusammengefuehrt.

## Skeleton und Lazy Hydration

XRouter kann Route-Komponenten shell-first laden:

```html
<x-router mode="hash" skeleton="article" skeleton-lines="8" skeleton-min-height="20rem">
  <x-route
    path="/docs"
    component="xtend-doc-page"
    import="/docs/utils/pageloader.js"
    hydrate-schedule="docs.page.hydrate">
  </x-route>
</x-router>
```

Wenn der Component-Tag noch nicht definiert ist, nutzt XRouter zuerst das explizite `import` der Route. Fehlt ein Import, delegiert er an `window.XTendLoader.ensureComponent(componentTag)`, sodass Manifest-Komponenten route-nativ lazy geladen werden koennen. Nach dem Rendern hydriert XRouter den Route-Subtree ueber `window.XTendLoader.hydrateTree(...)`.

## Navigation Routing UX Profil

`<x-router>` stellt `xtendNavigationRoutingUxProfile` mit `xtend.component.navigation-routing-ux-profile.v1` bereit. Das Profil beschreibt `x-router` als Router-Outlet mit `route-changed`, `route-announced`, `xrouter-before-navigate`, `xtend.router.current`, `route.visible.render`, `route.focus.restore`, `a11y.announce`, Fabric-Lane `transition` und RMT Shell Authoring.

Nach erfolgreichem Rendern fokussiert der Router sein Outlet und schreibt eine polite, atomare Live Region. Dadurch koennen RMT und Fabric Route-Render, Focus Restore und Screenreader-Announcement getrennt schedulen, ohne dass der RMT-Kernel XTend-Interna importiert.

Die neuen Diagnostics-Details enthalten `source: 'x-router'`, `stateKey` und `scheduleRef`, sodass `x-link`, Feedback-Komponenten und RMT-Scheduler denselben Route Context teilen koennen.

## Scroll Boundary, Overlays und Deadzone-Schutz

Vor jedem erfolgreichen Route-Render schliesst `<x-router>` offene Navigationsoverlays, die einen stabilen Komponentenvertrag fuer `isMenuOpen()` und `toggleMenu(false, options)` anbieten. Aktuell wird dadurch vor allem `x-header` stabilisiert: Ein geoeffnetes Menue bleibt kein Layoutfaktor der vorherigen Seite und erzeugt beim Wechsel auf eine kuerzere Route keine Deadzone.

Nach dem Render setzt `<x-router>` die native Scroll Restoration auf `manual`, scrollt zum Seitenanfang oder zum angegebenen `scroll-to`-Ziel und prueft die Dokumenthoehe in Microtask-, Frame- und Settled-Timeout-Phasen erneut. Wenn der Browser noch eine stale Scrollposition aus der vorherigen, laengeren Route haelt oder die aktuelle Position hinter dem neuen maximalen Scrollbereich liegt, normalisiert der Router die Position und schreibt einen Snapshot nach `xtend.router.scrollBoundary`.

Der Snapshot folgt `xtend.router.scroll-boundary.v1` und enthaelt unter anderem `path`, `phase`, `strategy`, `viewportHeight`, `scrollHeight`, `maxScrollTop`, `previousTop`, `normalizedTop`, `normalized` und `deadzoneDetected`. Dadurch koennen Fabric/RMT-Diagnostics Deadzones sichtbar machen, ohne App-spezifische Scroll-Hacks zu brauchen.

## RMT / XTendRMT Adapter

Seit Epic 05 / `WP-E05-10` kann XRouter native RMT Routes ueber den Adapter-Contract `xtend.rmt.xrouter-adapter.v1` konsumieren.

```js
const adapter = window.xtend.rmt.createRmtXRouterAdapter({ routerElement });
adapter.registerRoutes(runtimeRegistry);
adapter.navigate({ routeId: 'home' }, { mapping });
```

Die stabile Adapter-ID ist `xtend.xrouter`. Der Adapter konsumiert `routeRegistry.byRouter["xtend.xrouter"]`, mappt `RmtRouteRegistryEntry` auf XRouter-kompatible Records und ruft am Zielrouter `registerRoutes(...)` bzw. `navigate(...)` auf.

`<x-router>` stellt dafuer bereit:

- `registerRoutes(routes, options)`
- `navigate(to, options)`
- `reuse-component` als opt-in fuer InsularHydration bei SPA-Routen, deren Ziel denselben Component-Tag nutzt und `updateRoute(context)` oder `routeChangedCallback(context)` implementiert

RMT-relevante Route-Daten werden als Attribute auf `<x-route>` erhalten:

- `data-rmt-route-id`
- `data-rmt-router`
- `data-rmt-template`
- `data-rmt-schedule`
- `data-rmt-params`
- `data-rmt-query`
- `data-rmt-metadata`

XRouter bleibt damit produktiver Adapter fuer RMT Routes, aber kein RMT-Kernelwissen.

Weitere Details:

- [XTendRMT App-DSL Reference](../xtendrmt-app-dsl.md)
- [XTendRMT Runtime Bridge](../xtendrmt-runtime-bridge.md)
- [XTendRMT Native Authoring Guide](../xtendrmt-native-authoring.md)

## Hinweise

- `routesrc` wird vor dem ersten Rendern geladen.
- Lazy Loading erfolgt ueber das `import`-Attribut der jeweiligen Route.
- Guards (`before-enter`) und Lifecycle-Hooks bleiben unterstuetzt.
- Mit `reuse-component` kann eine App-Shell ihre Route-Komponente behalten; XRouter aktualisiert dann Params, Query und State und feuert `xrouter-route-reused`.
- RMT-Schedule-Refs werden ueber `data-rmt-schedule` an Route-Details weitergereicht.
- Scroll-Boundary-Normalisierung laeuft zentral im Router und sollte nicht in App-Shells dupliziert werden.
- Router-Aenderungen im Core sollten gegen `node scripts/verify_xtend_core_contracts.js` geprueft werden.

## ECH-WP-09 Token-Tabelle und Navigation States

`signatureDesign`: `x-router` ist die ruhige Route-Outlet-Basis fuer Enterprise-Shells. Der Router selbst delegiert Active/Current/Selected an `x-link`, `x-menu`, `x-tabs` und `x-header`, stellt aber denselben Navigation-State-Contract, Route Announcements und Focus Restore bereit.

| Token | Zweck |
| --- | --- |
| `--xtend-nav-surface` | optionale Outlet-/Route-Surface |
| `--xtend-nav-text` | Outlet-Text und vererbte Navigationsfarbe |
| `--xtend-nav-border-color` | geteilte Navigationskante fuer Route-Shells |
| `--xtend-nav-radius` | geteilte Radius-Vorgabe |
| `--xtend-nav-gap` | geteilte Navigation-Abstaende |
| `--xtend-nav-font-family` | vererbte Navigationstypografie |
| `--xtend-nav-font-size` | vererbte Navigationstextgroesse |
| `--xtend-nav-active-surface` | Active/Current/Selected Flaeche fuer angeschlossene Navigation |
| `--xtend-nav-active-text` | Active/Current/Selected Text |
| `--xtend-nav-current-indicator` | nicht farb-only Current-Indikator |
| `--xtend-nav-hover-surface` | Hover-Flaeche fuer angeschlossene Navigation |
| `--xtend-nav-focus-ring` | Route-Focus und Navigation-Focus |
| `--xtend-nav-disabled-opacity` | Disabled-Dimmung fuer angeschlossene Navigation |

## ECH-WP-09 Keyboard-Verhalten

Der Router fokussiert nach dem Rendern das Outlet und emittiert `route-announced` ueber eine polite Live Region. Link- und Menue-Keyboard-Verhalten bleibt in den jeweiligen Navigationselementen; der Router haelt den Route Context `xtend.router.current`, sodass Active/Current/Selected per `aria-current="page"` und `aria-selected="true"` synchronisiert werden koennen.

## ECH-WP-09 Fremdtheme

```css
[data-xtend-nav-theme="enterprise-foreign"] x-router {
  --xtend-nav-surface: transparent;
  --xtend-nav-text: #17231f;
  --xtend-nav-border-color: rgba(23, 35, 31, 0.22);
  --xtend-nav-radius: 0.35rem;
  --xtend-nav-gap: 0.45rem;
  --xtend-nav-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-nav-font-size: 1rem;
  --xtend-nav-active-surface: #173f35;
  --xtend-nav-active-text: #fffaf0;
  --xtend-nav-current-indicator: #b56b35;
  --xtend-nav-hover-surface: rgba(181, 107, 53, 0.14);
  --xtend-nav-focus-ring: 3px solid #b56b35;
  --xtend-nav-disabled-opacity: 0.44;
}
```
