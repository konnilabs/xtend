# xtend-i18n

xtend-i18n is a public XTend infrastructure reference for third-party developers who need labels, locale switching and lazy-loaded language bundles without adopting a translation framework. It lives in `components/xtend-i18n.js`, is declared through `components/manifest.json` and is typed through `components/xtend-i18n.d.ts`.

## What it solves

xtend-i18n centralizes the label layer that sits around XTend components. It keeps locale state, lazy bundle loading, DOM label refresh and component label contracts in one local module. The module is intentionally non-visual: it does not call `customElements.define`, it does not render a widget and it is loaded by the XTend loader as bootstrap infrastructure after `xtend-state` and before ordinary component discovery.

Use this page when your host shell wants a stable way to provide button defaults, ARIA labels, loading text, empty-state text, route announcements and similar labels across XTend components. The runtime fills defaults and declared `i18n-key` targets, while explicit host-authored labels, slotted text and ARIA attributes remain authoritative.

## When to use it

Use `xtend-i18n` when the application needs language switching, route-aware locale URLs or component labels that can refresh after a locale change. It is a good fit for product shells, documentation sites, micro frontends and RMT-authored surfaces where the host wants a batteries-included label registry but still controls the actual label files.

Third-party developers only need to bring ESM label bundles and configure the available locales. The runtime can connect to XTend Classic State for canonical locale state and to XRouter for `/de/path`, `/en/path` and `?lang=de` style URL handling.

## Avoid when

Avoid treating `xtend-i18n` as a sentence translation helper or formatting library. It does not try to replace domain-specific message formatting, pluralization or content management. It is best used for stable UI labels and shell-level language changes.

Do not use it to overwrite labels that authors already supplied through attributes or slots. Component label contracts are designed so i18n fills defaults, internal controls and marked label targets without erasing host intent.

## Load and register

Load the XTend loader once per page. The loader loads `xtend-state`, then `xtend-i18n`, then visual components.

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

## Examples

The default bundle is an ESM module. Keep the `schema`, `locale` and `labels` fields stable so diagnostics, type tests and lazy loading can validate the bundle before applying labels.

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

Connect the runtime to XTend Classic State and XRouter after configuration. Locale requests can be written through `xtend.i18n.locale.request`, and successful changes publish `LOCALE_CHANGED` to `xtend.i18n.event`.

```js
import { xtendState } from '/components/xtend-state.js';
import { xtendI18n } from '/components/xtend-i18n.js';

xtendI18n.connectState(xtendState);
xtendI18n.connectRouter(document.querySelector('x-router'), {
  urlMode: 'both',
  queryParam: 'lang',
  writeStrategy: 'preserve-current-shape'
});

await xtendI18n.setLocale('de');
```

## API reference

Methods:
- `configure(options)`
- `registerLabels(locale, bundleOrLoader)`
- `loadLocale(locale)`
- `setLocale(locale, options?)`
- `getLocale()`
- `getLabelRecord(key, fallback?)`
- `applyLabels(root?)`
- `bindComponent(element, contract?)`
- `connectState(stateRuntime, options?)`
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

## Integration notes

- State adapter keys include `xtend.i18n.locale`, `xtend.i18n.locale.request`, `xtend.i18n.target`, `xtend.i18n.status`, `xtend.i18n.busy`, `xtend.i18n.available`, `xtend.i18n.fallback`, `xtend.i18n.event` and `xtend.i18n.error`.
- Successful locale switches publish a `LOCALE_CHANGED` event and dispatch `xtend-i18n-locale-changed`.
- XRouter integration supports both prefix routes such as `/de/readme` and query routes such as `/readme?lang=de`.
- Existing component labels are optional. Explicit author labels, slotted text and authored ARIA attributes win over i18n-managed defaults.

The router adapter reads the query parameter first, then a path prefix, then the current or fallback locale. During a locale switch it uses `router.navigate()` when that method is available and carries a transition token so route updates do not loop back into a second locale change.

Component binding can happen automatically through `applyLabels(root)` or directly through `bindComponent(element, contract)`. Components that expose `xtendI18nLabelContract` can refresh their own fallback labels and internal text through `applyI18nLabels(labels, context)`.

## Troubleshooting

- If labels do not change, confirm that the locale appears in `available` and that the loader registered the matching bundle or lazy loader.
- If XTend Classic State does not show a `LOCALE_CHANGED` event, call `connectState(xtendState)` before invoking `setLocale()` and inspect `xtend.i18n.error`.
- If the URL flips between path and query forms, set `writeStrategy` explicitly and check whether the current route already contains a prefix or `lang` query parameter.
- If an authored label is not replaced, that is usually expected. Remove the explicit attribute or slot content when the label should be managed by i18n.

## Next steps

- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [XTend State](./xtend-state.md)
- [x-router](./xrouter.md)
