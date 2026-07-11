# RMT DOM Descriptor Renderer

- Schema: `xtend.epic18.rmt-dom-descriptor-renderer.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer --json`
- Workpackage: `WP-E18-05`
- Handoff: `WP-E18-06`

Der Renderer materialisiert strukturierte DOM Descriptor Records ohne manuelle HTML-Sinks. Normale UI-Ausgabe nutzt `createElement`, `createTextNode`, `createDocumentFragment` und `replaceChildren`.

## Rendering

- `createElement` erzeugt Elementknoten aus Descriptor Tags.
- `replaceChildren` aktualisiert Root- und Elementknoten kontrolliert.
- `keyed` Repeat-Children koennen stabil wiederverwendet werden.
- No-Manual-HTML blockiert `innerHTML`, `outerHTML`, `insertAdjacentHTML` und freie HTML-Fragmente.

## Boundary

Trusted HTML bleibt eine explizite Boundary. App-UI bleibt structured DOM descriptor first.
