# XTendRMT Runtime Bridge

Adapter verbinden RMT Core Records mit XTend UI, XRouter, Fabric und Host APIs.

## Worum es geht

Die Runtime Bridge verbindet hostneutrale Core-Records mit Browserdiensten, XTend Komponenten, Router und Fabric. Sie übersetzt Daten und Lifecycle-Aufträge, besitzt aber weder den kanonischen App-State noch fremde Framework-Interna.

## Öffentliche Bausteine

- `xtendrmt/rmt-app-runtime.js` verarbeitet App-Records.
- `xtendrmt/rmt-runtime.esm.js` stellt den Browser-Runtime-Einstieg bereit.
- `xtendrmt/rmt-runtime.browser.js` bindet explizite Browser-Grenzen an.

## Empfohlener Ablauf

Validiere das Core-Dokument, injiziere nur benötigte Host-Adapter und mounte eine Surface. Bei Unmount müssen Listener und Resource Handles verschwinden; fehlende Adapter liefern Diagnostics oder Fallbacks.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
