# XTend API

## Overview

`api.js` is the orchestration layer between the loader, core components, and
global helper APIs. It initializes the XTend APIs idempotently, hardens the
shared UI state, and loads API-relevant components from the manifest.

## Initialization

The loader imports `api.js` after loading the manifest and then calls
`initXTendAPI(manifest)`.

```js
const api = await import('./api.js');
await api.initXTendAPI(manifest);
```

## Contract of `initXTendAPI(manifest)`

- initializes `ui` in `xstate` defensively and does not destroy existing UI
  state on repeated calls
- provides theme state (`theme`, `themes`) only when it does not already exist
- loads API-relevant core modules through manifest URLs as ES modules
- rebinds the global helpers to the `window.XTend` namespace if the API is
  initialized again

## Global APIs

After successful initialization, these APIs are available:

- `window.XTheme`
- `window.XToast`
- `window.XAlert`
- `window.XDialog`
- `window.XModal`

The APIs are also mirrored under `window.XTend`:

- `window.XTend.theme`
- `window.XTend.toast`
- `window.XTend.alert`
- `window.XTend.dialog`
- `window.XTend.modal`
- `window.XTend.compliance`

Legacy helpers remain available:

- `window.showToast`
- `window.showAlert`
- `window.showDialog`
- `window.showModal`

## Compliance API

`window.XTend.compliance` describes the productive core review contract.
Available methods:

- `getChecklist()`
- `getCoreContracts()`
- `getThemeTokens(themeName?)`

The runtime also mirrors this metadata into `xstate`:

- `xtend.compliance.version`
- `xtend.compliance.checklist`
- `xtend.compliance.contracts`

## UI State

The API manages the shared UI state under `xstate.get('ui')`.

```js
{
  toasts: [],
  alerts: [],
  dialogs: [],
  modals: []
}
```

The API updates this state incrementally. Re-initialization no longer resets
active UI entries.

## Theme API

`window.XTheme` is the public theme facade. Important methods:

- `getCurrentTheme()`
- `getAvailableThemes()`
- `setTheme(themeName)`
- `set(name, value)`
- `get(name)`
- `subscribe(fn)`
- `registerTheme(name, properties)`
- `loadExternalTheme(themeName, cssUrl)`
- `toggleDarkMode()`

`set(name, value)` is the compatibility facade:

- `set('dark')` switches to a theme
- `set('--primary-color', '#0e4e81')` sets a CSS variable for the current theme

## Dialog and Modal Flags

The API writes open state compatibly for existing call sites:

- Dialog: `dialog-open-<id>`, `xdialog-open-<id>`
- Modal: `modal-open-<id>`

The canonical target path from the contract matrix remains relevant for new
work:

- `xtend.component.x-dialog.<id>.open`
- `xtend.component.x-modal.<id>.open`

## XTendRMT Runtime API

XTendRMT is not part of `api.js`, but the public XTend developer docs include
the productive integration path. Runtime factories live in artifacts under
`xtendrmt/`:

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

Browser classic:

```html
<script src="/xtendrmt/rmt-runtime.browser.js"></script>
<script type="module">
  const format = window.AppModules.createRmtFormat();
  const rmt = window.xtend.rmt;
</script>
```

RMT-adjacent XTend integrations should use these factories instead of private
demo bridges or direct kernel coupling. Details are in
[XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md).

## Notes

- `api.js` is runtime orchestration, not a static component list.
- The API expects a consistent manifest and already available `xstate`
  bootstrap infrastructure.
- Components should still preferably be used declaratively; the API is meant
  for dynamic flows.
- After core changes, run `node scripts/verify_xtend_core_contracts.js`.

## Related Topics

- [Manifest Format](./manifest.md)
- [XTend Loader](./xtend-loader.md)
- [xrouter](./components/xrouter.md)
- [xlink](./components/xlink.md)
- [xtheme](./components/xtheme.md)
- [Core Migration Guide](./core-migration-guide.md)
- [XTendRMT Developer Overview](./xtendrmt-overview.md)
- [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md)
