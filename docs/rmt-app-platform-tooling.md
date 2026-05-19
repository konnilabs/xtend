# RMT App Platform Tooling

- Contract: `xtend.epic18.rmt-app-platform-tooling.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-app-platform-tooling --json`
- Workpackage: `WP-E18-11`
- Handoff: `WP-E18-12`

## Ziel

RMT App Sources sind jetzt vor der Runtime pruefbar und buildfaehig. Das
Tooling erzeugt Diagnostics, Source Maps und Scaffold Reports fuer generische
App-Platform-Primitives wie Surfaces, Overlays, Portale, Resources, Actions,
Events, DataSources und State.

Der Slice ist bewusst keine Media-Manager-Shell. Er liefert Werkzeuge, mit
denen Entwickler eigene App-Strukturen in XTend/RMT nativ anlegen koennen,
ohne produktseitige `innerHTML`-Renderer oder eigene Mini-Frameworks.

## Diagnostics

Der App-Platform-Linter blockiert typische spaete Runtime-Fehler bereits beim
Authoring:

- `rmt.app.no-manual-shell.html-sink` fuer `innerHTML`, `outerHTML`,
  `insertAdjacentHTML` oder `document.write` in normaler App-UI.
- `rmt.app.unsafe-html.boundary-missing` fuer HTML-Fragmente ohne explizite
  Trusted-DOM-Boundary.
- `rmt.app.repeat.key.missing` fuer wiederholte Surfaces ohne stabilen Key.
- `rmt.app.event.payload-contract.missing` fuer Events mit Action-Ziel ohne
  Payload Contract.
- `rmt.app.resource.ownership.missing` fuer nicht klar besessene Ressourcen.
- `rmt.app.resource.unresolved`, `rmt.app.portal.unresolved` und
  `rmt.app.surface.source.unresolved` fuer fehlerhafte App-Graph-Referenzen.

Die Regeln laufen als eigener App-Platform-Policy-Rule im bestehenden
RMT-Linter und als direkter Analyzer in
`./rmt-language/app-platform-tooling`.

## LSP

Completion und Hover kennen die neuen Primitives:

- Portal-IDs und Portal-Policies wie `stacked`, `toast-region` und
  `clipping-escape`.
- Overlay-Kinds wie `tooltip`, `toast`, `popover`, `lightbox`, `menu` und
  `dialog`.
- Resource-Kinds wie `object-url`, `stream`, `observer`, `timer` und
  `lazy-import`.
- Event-Kinds und Surface-Initialstates.

Damit koennen App-Autoren RMT-Dokumente ohne Produkt-Surface-Taxonomie und ohne
externe Hilfslisten bearbeiten.

## Scaffold Build

Der Builder registriert den Befehl `rmt-app-platform`. Er liest eine `.rmt`
App Source und erzeugt unter `.xtend-build`:

- `*.app-platform-diagnostics.json`
- `*.app-platform-source-map.json`
- `*.app-platform-build.json`

Die Artefakte laufen ueber den Epic-17 WritePlan und tragen Scaffold-
Ownership. `--check` kann damit pruefen, ob lokale Build-Artefakte aktuell
sind.

```bash
node scripts/run_xtend_tests.js rmt-app-platform-tooling --json
node xtend-builder/lib/cli.js rmt-app-platform --source tests/fixtures/rmt-app-platform-tooling.rmt
```

## Grenzen

- Keine Produkt-Surface-Liste und kein Media-Manager-spezifischer Registry-
  Repaint.
- Keine normalen UI-HTML-Sinks ausserhalb einer Trusted-DOM-Boundary.
- Keine Imports aus XTend-Komponenten in den RMT Kernel.
- Das Tooling baut Reports, Diagnostics und Source Maps; die produktnahe
  generische App-Fixture folgt in `WP-E18-12`.
