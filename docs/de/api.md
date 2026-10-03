# API

Die öffentlichen XTend APIs für Loader, Komponenten und Host-Integration.

## Worum es geht

`api.js` initialisiert die browserseitigen Feedback- und Theme-APIs von XTend. Der öffentliche Einstieg ist `initXTendAPI(manifest)`; nach erfolgreichem Setup signalisiert `xtend-api-ready`, welche Teil-APIs verfügbar sind.

## Öffentliche Bausteine

- `api.js` enthält die Runtime und schreibt in `window.XTend`.
- `api.d.ts` typisiert Theme, Toast, Alert, Dialog und Modal.
- `components/xtend-state.js` hält den gemeinsamen Classic-UI-Zustand.

## Empfohlener Ablauf

Importiere die API explizit und warte auf das Ready-Event:

```js
import { initXTendAPI } from "/api.js";

window.addEventListener("xtend-api-ready", ({ detail }) => {
  if (detail.toast) window.XTend.toast.success("Ready");
}, { once: true });

await initXTendAPI({ "x-toast": "./components/xtoast.js" });
```

Ein fehlendes Modul lehnt den Init-Pfad ab. Prüfe Manifest und Browser-Konsole, statt einen nicht initialisierten Namespace als erfolgreiche API zu behandeln.

## Nächste Schritte

- [XTend DEV API](./xtend-dev-api.md)
- [Manifest](./manifest.md)
- [XTend Classic](./xtend-classic.md)
- [Design Tokens](./design-tokens.md)
