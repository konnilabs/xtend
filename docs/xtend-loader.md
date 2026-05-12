# XTend Loader

## Uebersicht

Der kanonische XTend Loader ist `xtend-loader.js`.

Er ist ein lokaler ES-Modul-Entry fuer XTend UI und uebernimmt das dynamische Laden von Manifest, Core-Modulen, explizit vorgeladenen Komponenten, DOM-verwendeten Komponenten und `api.js`.

`xtend-dev.js` ist nur noch ein Legacy-Stub. Neue Demos, Browser-Smokes, Scaffold-Ausgaben und offizielle Beispiele verwenden `xtend-loader.js`.

Seit `ER-WP-05` sind die Default-Demo- und Fixture-Pfade formal auf den kanonischen Loader beziehungsweise bewusst klassifizierte Spezial-Smokes festgelegt. Seit `ER-WP-18` misst der Loader Manifest Load, Modul-Load und Custom Element Definition ueber lokale Performance Marks. Seit `ER-WP-28` validiert er Manifest- und Modul-URLs gegen `xtend.security.loader-policy.v1`, `xtend.security.manifest-policy.v1` und `xtend.security.import-policy.v1`.

## Einbindung

```html
<script type="module" src="./xtend-loader.js"></script>
```

Optional kann ein lokales Manifest gesetzt werden:

```html
<script
  type="module"
  src="./xtend-loader.js"
  data-manifest="./components/manifest.json">
</script>
```

Der Loader nutzt standardmaessig:

```text
components/manifest.json
```

## Contract

Der Loader Contract lautet:

```text
xtend.loader.contract.v1
```

Security Contracts:

```text
xtend.security.loader-policy.v1
xtend.security.manifest-policy.v1
xtend.security.import-policy.v1
```

Browsernah stellt der Loader diese Oberflaeche bereit:

```js
window.XTendLoader
```

Die automatische Boot-Promise liegt unter:

```js
window.__XTendLoaderBootPromise
```

## Verbose Mode

Der PROD-Loader ist standardmaessig konsolenruhig. Die Loader-Datei enthaelt dafuer oben eine direkte Flag:

```js
const verbose_mode = 'auto';
```

Unterstuetzte Werte:

| Wert | Verhalten |
|------|-----------|
| `'true'` | Verbose ist dauerhaft aktiv. Loader-Modulvorgaenge und angeschlossene Core-Runtime-Logs werden in der Browserkonsole ausgegeben. |
| `'false'` | Verbose ist gesperrt. Es kann nur durch eine Aenderung der Loader-Datei wieder aktiviert werden. |
| `'auto'` | Verbose ist beim ersten Start aus und kann in der Browserkonsole fuer die laufende Tab-Session aktiviert werden. |

Browser-Konsole:

```js
XTendLoader.verbose(true)
XTendLoader.verbose(false)
XTendLoader.verbose()
```

Alternativ:

```js
XTendLoader.enableVerbose()
XTendLoader.disableVerbose()
XTendLoader.getVerboseState()
```

In `auto` speichert der Loader die Konsolenentscheidung in `sessionStorage`. Nach `XTendLoader.verbose(true)` reicht ein Reload, um auch die initialen Modul-Ladevorgaenge derselben Browser-Session zu sehen. `XTendLoader.verbose(false)` schaltet die Session wieder ruhig.

Structured Diagnostics (`xtend-loader-diagnostic`) und Performance Events (`xtend-loader-performance`) bleiben vom Verbose Mode unabhaengig verfuegbar.

## Funktionsweise

1. Der Loader versteckt die Seite kurz, um unhydratisches Markup nicht sichtbar blitzen zu lassen.
2. Er wartet auf den Window-Load.
3. Er validiert `data-manifest` oder `components/manifest.json` gegen die Loader Policy.
4. Er laedt das Manifest und loest Manifest-URLs relativ zur Manifest-URL auf.
5. Er validiert jeden Manifest Record gegen die Manifest- und Import-Policy.
6. Er kann Modul-URLs ueber `data-module-cache-bust` versionieren, damit Livesysteme keine stale Component-Module aus dem Browsercache ziehen.
7. Er laedt `xstate` und danach `x-theme`, sofern beide im Manifest stehen. `xstate` wird bewusst nicht cache-gebustet, damit keine zweite State-Modulinstanz entsteht.
8. Er laedt Eintraege aus `<meta name="xtend-preload">`.
9. Er erkennt im DOM verwendete XTend-Tags und laedt sichtbare Komponenten sofort.
10. Er beobachtet nicht sichtbare Komponenten per `IntersectionObserver`.
11. Er stellt `xtend.loader.skeleton-loader.v1` fuer Shell-, Route- und dynamische Subtree-Fallbacks bereit.
12. Er macht die Seite wieder sichtbar.
13. Er validiert und importiert lokal `api.js`, dann ruft er `api.initXTendAPI(manifest)` auf.

## SkeletonLoader

Der Loader exportiert einen nativen SkeletonLoader fuer Shell-first Apps:

```js
window.XTendLoader.showSkeleton(target, { lines: 8, schedule: 'docs.page.hydrate' });
window.XTendLoader.hideSkeleton(target);
```

Zusammen mit `xtend.css` koennen Hosts noch nicht definierte XTend Custom Elements ueber `data-xtend-skeleton` als Skeleton anzeigen. Bekannte XTend-Tags ohne Skeleton-Opt-in bleiben bis zur Definition unsichtbar, damit Light-DOM-Text nicht ungestylt aufblitzt.

## Preload

Komponenten koennen weiterhin explizit vorgeladen werden:

```html
<meta name="xtend-preload" content="x-router,x-link,x-dialog,x-modal">
```

Die Werte sind Component IDs aus dem Manifest, keine freien URLs.

## Live-Deployment Cache Busting

Shell-Apps koennen Loader, Manifest und Component-Module versioniert laden:

```html
<script
  type="module"
  src="/xtend-loader.js?v=20260507"
  data-manifest="/components/manifest.json?v=20260507"
  data-module-cache-bust="20260507">
</script>
```

Der Loader haengt diesen Wert als `xtend-cache` Query-Parameter an Manifest-Module an. `xstate` bleibt davon ausgenommen, weil Komponenten es selbst ueber `./xstate.js` importieren und XTend genau eine State-Instanz behalten soll.

## Manifest-Beispiel

```json
{
  "xstate": "./xstate.js",
  "x-theme": "./xtheme.js",
  "x-router": "./xrouter.js",
  "x-link": "./xlink.js",
  "x-dialog": "./xdialog.js",
  "x-modal": "./xmodal.js"
}
```

## Legacy-Strategie

`xtend-dev.js` bleibt fuer eine kurze Migrationsphase als Kompatibilitaetsstub erhalten.

Der Stub:

- warnt in der Konsole
- importiert `./xtend-loader.js`
- enthaelt keine eigene Loader-Logik mehr

Default-Demos und Tests duerfen den Legacy-Namen nicht mehr als kanonischen Loaderpfad verwenden.

## Security- und Runtime-Grenzen

Der Loader bleibt lokal und ESM-basiert.

CDN ist kein Default- oder Testpfad. Seit `ER-WP-03` nutzen `api.js`, `components/manifest.json`, Core-Komponenten und Browser-Fixtures repo-lokale XTend-Pfade. Seit `ER-WP-05` pruefen Reference- und Browser-Gates zudem, dass Default-Demos nicht auf `xtend-dev.js` oder XTend-CDN-Bruecken zurueckfallen. Seit `ER-WP-28` verweigert der Loader externe Manifest- und Modul-URLs, `javascript:`, `data:`, `blob:`, nicht passende Dateiendungen und Path-Traversal mit strukturierten Security-Diagnostics.

Der Loader emittiert strukturierte lokale Diagnostics als `xtend-loader-diagnostic` Event und bereitet damit die spaetere Anbindung an `XTend-Fabric` vor.

Security Refusals nutzen diese Codes:

- `xtend.security.loader.refused`
- `xtend.security.manifest.invalid`
- `xtend.security.import.refused`

## Performance Measurements

Der Loader erzeugt `performance.mark` und `performance.measure` Eintraege fuer:

| Measure | Phase |
|---------|-------|
| `xtend.loader.manifest` | `load` |
| `xtend.loader.module` | `load` |
| `xtend.component.define` | `define` |

`xtend.component.define` wartet nach dem Modul-Load kurz auf `customElements.whenDefined(tag)`, blockiert den Loader aber nicht dauerhaft, falls ein Manifest-Eintrag kein Custom Element registriert.

Zusaetzlich emittiert er fuer jede Messung ein lokales Event:

```js
window.addEventListener('xtend-loader-performance', (event) => {
  console.log(event.detail.name, event.detail.durationMs);
});
```

Die Boot-Promise enthaelt die lokalen Loader-Messwerte:

```js
const boot = await window.__XTendLoaderBootPromise;
console.log(boot.performanceMeasurements);
```

Die Fabric-Telemetry-Snapshots normalisieren diese Eintraege als `xtend.performance.measurement.v1`.

## Gates

Relevante lokale Checks:

```bash
npm run dev:local
npm run test:browser:local
node scripts/run_xtend_tests.js browser --json
node scripts/run_xtend_tests.js manifest-import-policy --json
node scripts/run_xtend_tests.js fabric-performance-measurements --json
node scripts/run_xtend_tests.js references --json
npm test
```

`npm run dev:local` startet `scripts/serve_xtend_dev.js` auf Port `4173`. Der Browser-Smoke-Harness nutzt dasselbe Servermodul im Testmodus mit Port `0`.

## Weiterfuehrende Themen

- [Manifest-Format](./manifest.md)
- [Manifest Import Policy](./manifest-import-policy.md)
- [Performance Measurements](./performance-measurements.md)
- [API-Integration](./api.md)
- [Komponenten-Entwicklung](./components.md)
- [Best Practices](./best-practices.md)
