# xtend-i18n

xtend-i18n ist eine öffentliche XTend Infrastrukturreferenz für Drittanbieter, die Labels, Sprachwechsel und lazy geladene Sprach-Bundles ohne eigenes Übersetzungsframework anbinden möchten. Das Modul liegt in `components/xtend-i18n.js`, wird über `components/manifest.json` deklariert und ist durch `components/xtend-i18n.d.ts` typisiert.

## Was es löst

xtend-i18n bündelt die Label-Schicht rund um XTend Komponenten. Das Modul hält Locale-Zustand, Lazy Loading von Bundles, DOM-Label-Refresh und Komponenten-Label-Contracts an einer lokalen Stelle. Es ist absichtlich nicht-visuell: Es ruft kein `customElements.define` auf, rendert kein Widget und wird vom XTend Loader als Bootstrap-Infrastruktur nach `xstate` und vor der normalen Komponenten-Erkennung geladen.

Nutze diese Seite, wenn deine Host-Shell eine stabile Grundlage für Button-Defaults, ARIA Labels, Loading-Texte, Empty States, Route Announcements und ähnliche UI-Labels braucht. Die Laufzeit füllt Defaults und deklarierte `i18n-key` Ziele, während explizite Host-Labels, Slot-Text und gesetzte ARIA-Attribute maßgeblich bleiben.

## Einsatz

Setze `xtend-i18n` ein, wenn die Anwendung Sprachwechsel, routenbewusste Locale-URLs oder Komponentenlabels braucht, die nach einem Locale-Wechsel aktualisiert werden. Das passt gut zu Produktshells, Dokumentationsseiten, Micro Frontends und RMT Surfaces, in denen der Host eine batteries-included Label Registry möchte, aber die eigentlichen Label-Dateien selbst liefert.

Drittanbieter müssen nur ESM Label-Bundles bereitstellen und die verfügbaren Locales konfigurieren. Die Laufzeit kann sich an XState anbinden, um kanonischen Locale-Zustand zu publizieren, und an XRouter, um `/de/path`, `/en/path` und `?lang=de` URL-Formen zu unterstützen.

## Nicht einsetzen, wenn

Behandle `xtend-i18n` nicht als Satzübersetzer oder Formatierungsbibliothek. Das Modul ersetzt keine domänenspezifische Message-Formatierung, Pluralisierung oder Content-Verwaltung. Es ist für stabile UI Labels und Shell-weite Sprachwechsel gedacht.

Nutze es außerdem nicht, um vom Autor gesetzte Labels zu überschreiben. Komponenten-Label-Contracts sind so ausgelegt, dass i18n Defaults, interne Controls und markierte Label-Ziele füllt, ohne Host-Intent zu entfernen.

## Laden und registrieren

Der XTend Loader wird einmal pro Seite geladen. Er lädt `xstate`, danach `xtend-i18n` und anschließend die visuellen Komponenten.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<script type="module">
  import { xtendI18n } from '/components/xtend-i18n.js';

  xtendI18n.configure({
    defaultLocale: 'en',
    fallbackLocale: 'en',
    available: ['en', 'de'],
    labelLoaders: {
      en: () => import('/components/i18n/labels.en.js'),
      de: () => import('/components/i18n/labels.de.js')
    }
  });
</script>
```

## Beispiele

Das Standard-Bundle ist ein ESM Modul. Halte `schema`, `locale` und `labels` stabil, damit Diagnose, Type Tests und Lazy Loading das Bundle prüfen können, bevor Labels angewendet werden.

```js
export default {
  schema: 'xtend.i18n.labels.v1',
  locale: 'en',
  labels: {
    'x-button.fallbackLabel': 'Click',
    'x-router.routeLoading': 'Route is loading'
  }
};
```

Binde die Laufzeit nach der Konfiguration an XState und XRouter an. Locale Requests können über `xtend.i18n.locale.request` geschrieben werden, erfolgreiche Wechsel publizieren `LOCALE_CHANGED` nach `xtend.i18n.event`.

```js
import { xstate } from '/components/xstate.js';
import { xtendI18n } from '/components/xtend-i18n.js';

xtendI18n.connectXState(xstate);
xtendI18n.connectRouter(document.querySelector('x-router'), {
  urlMode: 'both',
  queryParam: 'lang',
  writeStrategy: 'preserve-current-shape'
});

await xtendI18n.setLocale('de');
```

## API-Referenz

Methoden:
- `configure(options)`
- `registerLabels(locale, bundleOrLoader)`
- `loadLocale(locale)`
- `setLocale(locale, options?)`
- `getLocale()`
- `getLabelRecord(key, fallback?)`
- `applyLabels(root?)`
- `bindComponent(element, contract?)`
- `connectXState(xstate, options?)`
- `connectRouter(router, options?)`
- `snapshot()`
- `snapshotDiagnostics()`

Events:
- `xtend-i18n-locale-changing`
- `xtend-i18n-locale-changed`
- `xtend-i18n-labels-loaded`
- `xtend-i18n-labels-applied`
- `xtend-i18n-diagnostic`
- `xtend-i18n-error`

## Integrationshinweise

- Der XState-Adapter nutzt unter anderem `xtend.i18n.locale`, `xtend.i18n.locale.request`, `xtend.i18n.target`, `xtend.i18n.status`, `xtend.i18n.busy`, `xtend.i18n.available`, `xtend.i18n.fallback`, `xtend.i18n.event` und `xtend.i18n.error`.
- Erfolgreiche Sprachwechsel publizieren ein `LOCALE_CHANGED` Event und dispatchen `xtend-i18n-locale-changed`.
- Die XRouter-Integration unterstützt Prefix-Routen wie `/de/readme` und Query-Routen wie `/readme?lang=de`.
- Bestehende Komponenten-Labels sind optional. Explizite Host-Labels, Slot-Text und gesetzte ARIA-Attribute gewinnen gegen i18n-Defaults.

Der Router-Adapter liest zuerst den Query-Parameter, danach einen Pfadprefix und danach die aktuelle oder fallback Locale. Bei einem Sprachwechsel nutzt er `router.navigate()`, wenn diese Methode verfügbar ist, und trägt einen Transition Token, damit Route Updates nicht als zweiter Locale-Wechsel zurücklaufen.

Komponentenbindung kann automatisch über `applyLabels(root)` oder gezielt über `bindComponent(element, contract)` erfolgen. Komponenten mit `xtendI18nLabelContract` können eigene Fallback Labels und interne Texte über `applyI18nLabels(labels, context)` aktualisieren.

## Fehlerbehebung

- Wenn Labels nicht wechseln, prüfe, ob die Locale in `available` steht und ob der passende Bundle Loader registriert ist.
- Wenn XState kein `LOCALE_CHANGED` Event zeigt, rufe `connectXState(xstate)` vor `setLocale()` auf und prüfe `xtend.i18n.error`.
- Wenn die URL zwischen Prefix und Query springt, setze `writeStrategy` explizit und kontrolliere, ob die aktuelle Route bereits Prefix oder `lang` Query enthält.
- Wenn ein gesetztes Label nicht ersetzt wird, ist das meist beabsichtigt. Entferne das explizite Attribut oder den Slot-Text, wenn i18n das Label verwalten soll.

## Nächste Schritte

- [Komponentenentwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [xstate](./xstate.md)
- [x-router](./xrouter.md)
