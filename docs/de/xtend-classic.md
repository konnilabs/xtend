# XTend Classic

XTend Classic ist der produktive HTML- und JavaScript-first-Auslieferungspfad für XTend Web Components. Ein Host behält sein direkt gepflegtes HTML, lädt das lokale `components/manifest.json` über `xtend-loader.js` und lässt den Browser die Komponenten ohne einen XTend-Application-Build registrieren.

„Kein Application-Build erforderlich“ bedeutet, dass XTend weder Maraca noch Compiler oder CLI für die Auslieferung der Seite voraussetzt. Ein Host darf weiterhin einen eigenen Bundler, TypeScript, einen lokalen Server oder optionales XTend-Tooling verwenden. Classic ist kein Legacy-Modus: Nur `xtend-dev.js` und der Export `./legacy-loader` sind Legacy-Kompatibilitätsoberflächen.

Der Paket-Root gehört jetzt der [ESM-Registry](./esm-registry.md) und startet Classic nicht. Package-basierte Classic-Hosts verwenden `@ccslabs/xtend/loader`; Script-basierte Hosts binden `xtend-loader.js` weiterhin explizit ein.

```js
import '@ccslabs/xtend/loader';
```

## Classic oder Maraca wählen

| XTend Classic | XTend Maraca |
| --- | --- |
| HTML- und JavaScript-first | RMT- und Build-first |
| Runtime-Manifest mit `xtend-loader.js` | Statische Inline Registry in einem generierten ESM-Bundle |
| Kein XTend-Application-Build erforderlich | Plan-, Build-, Tune- und Evidence-Pipeline |
| Dynamische Kataloge und Progressive Enhancement | Optimierte App-Graphen, SSR/Hydration, PWA und Produktionsreports |

Beide Pfade verwenden dieselben öffentlichen Web-Component-Verträge. Wähle Classic für direkt gepflegte Sites, Dokumentation, Progressive Enhancement, dynamische Komponentenkataloge oder Hosts, die ihre Runtime-Komposition bewusst selbst besitzen. Wähle [XTend Maraca](./xtend-maraca.md), wenn aus einem RMT-Dokument ein compiler-selektiertes App-Bundle mit Build-Nachweisen entstehen soll.

## Minimaler Classic-Host

Lade nur die Komponenten des ersten Viewports vor. Der Loader entdeckt tiefer liegende manifestbasierte Elemente und lädt sie, sobald sie sich dem Viewport nähern.

```html
<meta name="xtend-preload" content="xstate,x-theme,x-header,x-hero">
<script type="module"
  src="/xtend-loader.js"
  data-manifest="/components/manifest.json"></script>

<x-hero>
  <h1>Hello XTend Classic</h1>
</x-hero>
<x-section label="Loaded near the viewport"></x-section>
```

Das Manifest bleibt die vom Host kontrollierte Allowlist. Unbekannte Tags bleiben undefiniert; verweigerte Protokolle, Origins, Pfade oder Dateiendungen erzeugen explizite Loader-Diagnosen statt eines Remote-Fallbacks.

## JavaScript und dynamische Inhalte

`window.__XTendLoaderBootPromise` macht den Abschluss des initialen Boots sichtbar. Nutze die öffentliche Loader-API, wenn JavaScript nach dem Boot eine bekannte Komponente ergänzt:

```js
await window.__XTendLoaderBootPromise;

const region = document.querySelector('[data-dynamic-region]');
const button = document.createElement('x-button');
button.setAttribute('label', 'Continue');
region.append(button);
await window.XTendLoader.hydrateTree(region);
await customElements.whenDefined('x-button');
```

Bevorzuge strukturierte DOM-Operationen für nicht vertrauenswürdige oder variable Inhalte. Freie HTML-Strings benötigen weiterhin die dokumentierten Trusted-DOM- und Sanitizing-Grenzen; Classic schwächt keine Security Policy.

## Optionale DEV API

Development-Hosts können denselben Loader anweisen, den nur lesenden Classic-Diagnoseadapter zu installieren:

```html
<script type="module"
  src="/xtend-loader.js"
  data-manifest="/components/manifest.json"
  data-dev-api="true"></script>
```

Dadurch wird `window.__XTEND_DEV_API__` ohne weiteren Script-Tag oder Monkeypatching bereitgestellt. Loader- und Browser-Performance-Messungen sind real; Fabric, RMT Kernel und SSR-Hydration melden `supported: false`, wenn diese Runtimes nicht aktiv sind.

## Produktionscheckliste

- Halte Loader, Manifest, Komponentenmodule, Styles und Bild-Assets same-origin oder explizit vom Host freigegeben.
- Lade den vollständigen Komponentensatz des ersten Viewports vor und lasse Inhalte unterhalb des Viewports lazy.
- Warte auf öffentliche Readiness-Promises, bevor du Komponentenmethoden aufrufst.
- Teste Tastaturbedienung, Reduced Motion, Layout-Stabilität, Import-Verweigerung und fehlende optionale Fähigkeiten.
- Aktiviere die DEV API nur für Hosts, die lokale Diagnosen exponieren sollen.
- Nutze dokumentierte Attribute, Events, Slots, CSS Parts, Typen und Globals; privates Shadow DOM bleibt intern.

## Technische Referenzen

- [Manifest](./manifest.md)
- [ESM-Registry](./esm-registry.md)
- [API](./api.md)
- [XTend Loader Types](./xtend-loader-types.md)
- [XTend DEV API](./xtend-dev-api.md)
- [Design Tokens](./design-tokens.md)
