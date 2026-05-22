# XTend API

## Uebersicht

`api.js` ist die Orchestrierungsschicht zwischen Loader, Core-Komponenten und globalen Helper-APIs. Sie initialisiert die XTend-APIs idempotent, haertet den gemeinsamen UI-State und laedt API-relevante Komponenten aus dem Manifest nach.

## Initialisierung

Der Loader importiert `api.js` nach dem Manifest-Laden und ruft anschliessend `initXTendAPI(manifest)` auf.

```js
const api = await import('./api.js');
await api.initXTendAPI(manifest);
```

## Contract von `initXTendAPI(manifest)`

- initialisiert `ui` in `xstate` defensiv und zerstoert keinen bestehenden UI-State bei Mehrfachaufruf
- stellt Theme-State (`theme`, `themes`) nur dann bereit, wenn er noch nicht existiert
- laedt die API-relevanten Core-Module ueber Manifest-URLs als ES-Module
- bindet die globalen Helper erneut an den `window.XTend`-Namespace, falls die API erneut initialisiert wird

## Globale APIs

Nach erfolgreicher Initialisierung stehen folgende APIs zur Verfuegung:

- `window.XTheme`
- `window.XToast`
- `window.XAlert`
- `window.XDialog`
- `window.XModal`

Zusatzlich werden die APIs unter `window.XTend` gespiegelt:

- `window.XTend.theme`
- `window.XTend.toast`
- `window.XTend.alert`
- `window.XTend.dialog`
- `window.XTend.modal`
- `window.XTend.compliance`

Die Legacy-Helper bleiben verfuegbar:

- `window.showToast`
- `window.showAlert`
- `window.showDialog`
- `window.showModal`

## Compliance-API

`window.XTend.compliance` beschreibt den produktiven Core-Review-Contract. Verfuegbare Methoden:

- `getChecklist()`
- `getCoreContracts()`
- `getThemeTokens(themeName?)`

Die Runtime spiegelt diese Metadaten zusaetzlich in `xstate`:

- `xtend.compliance.version`
- `xtend.compliance.checklist`
- `xtend.compliance.contracts`

## UI-State

Die API verwaltet den gemeinsamen UI-State unter `xstate.get('ui')`.

```js
{
  toasts: [],
  alerts: [],
  dialogs: [],
  modals: []
}
```

Die API aktualisiert diesen State nur differenziell. Re-Init fuehrt nicht mehr zu einem Reset laufender UI-Eintraege.

## Theme-API

`window.XTheme` ist die oeffentliche Theme-Fassade. Wichtige Methoden:

- `getCurrentTheme()`
- `getAvailableThemes()`
- `setTheme(themeName)`
- `set(name, value)`
- `get(name)`
- `subscribe(fn)`
- `registerTheme(name, properties)`
- `loadExternalTheme(themeName, cssUrl)`
- `toggleDarkMode()`

`set(name, value)` ist die Kompatibilitaets-Fassade:

- `set('dark')` schaltet auf ein Theme
- `set('--primary-color', '#0e4e81')` setzt eine CSS-Variable fuer das aktuelle Theme

## Dialog- und Modal-Flags

Die API schreibt Open-State kompatibel fuer bestehende Call-Sites:

- Dialog: `dialog-open-<id>`, `xdialog-open-<id>`
- Modal: `modal-open-<id>`

Der kanonische Zielpfad aus der Contract-Matrix bleibt fuer neue Arbeit relevant:

- `xtend.component.x-dialog.<id>.open`
- `xtend.component.x-modal.<id>.open`

## XTendRMT Runtime-API

XTendRMT ist nicht Teil von `api.js`, aber die oeffentliche XTend-Entwicklerdokumentation fuehrt den produktiven Integrationspfad mit. Die Runtime-Factories liegen in den Artefakten unter `xtendrmt/`:

- `createRmtFormat`
- `createRmtXRouterAdapter`
- `createRmtXtendComponentAdapter`
- `createRmtStateSchedulerDiagnosticsBridge`

ESM:

```js
import {
  createRmtFormat,
  createRmtXRouterAdapter,
  createRmtXtendComponentAdapter,
  createRmtStateSchedulerDiagnosticsBridge
} from './xtendrmt/rmt-runtime.esm.js';
```

Browser Classic:

```html
<script src="/xtendrmt/rmt-runtime.browser.js"></script>
<script type="module">
  const format = window.AppModules.createRmtFormat();
  const rmt = window.xtend.rmt;
</script>
```

RMT-nahe XTend-Integrationen sollen diese Factories verwenden, statt private Demo-Bruecken oder direkte Kernel-Kopplung aufzubauen. Details stehen in [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md).

## Hinweise

- `api.js` ist eine Runtime-Orchestrierung, keine statische Komponentenliste.
- Die API erwartet ein konsistentes Manifest und bereits verfügbare `xstate`-Bootstrap-Infrastruktur.
- Komponenten sollen weiterhin bevorzugt deklarativ verwendet werden; die API ist fuer dynamische Flows gedacht.
- Nach Core-Aenderungen sollte `node scripts/verify_xtend_core_contracts.js` ausgefuehrt werden.

## Weiterfuehrende Themen

- [Manifest-Format](./manifest.md)
- [XTend Loader](./xtend-loader.md)
- [xrouter](./components/xrouter.md)
- [xlink](./components/xlink.md)
- [xtheme](./components/xtheme.md)
- [Core Migration Guide](./core-migration-guide.md)
- [XTendRMT Developer Overview](./xtendrmt-overview.md)
- [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md)
