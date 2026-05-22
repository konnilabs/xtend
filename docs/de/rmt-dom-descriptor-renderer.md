# RMT DOM Descriptor Renderer

- Contract: `xtend.epic18.rmt-dom-descriptor-renderer.v1`
- Fixture: `tests/fixtures/rmt-dom-descriptor-renderer.rmt`
- Runtime: `xtendrmt/rmt-dom-descriptor-renderer.js`
- Local Gate: `node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer --json`
- Workpackage: `WP-E18-05`

Der Renderer fuehrt das `WP-E18-04` Authoring-Modell als generische App
Platform aus. Normale App-UI wird aus strukturierten Deskriptoren gebaut:
`createElement`, `createTextNode`, `createDocumentFragment`,
`replaceChildren`, sichere Attribute/Properties und keyed Child-Reuse.

## Descriptor-Regeln

| Bereich | Regel |
|---------|-------|
| Shell | Root-Render-Units verwenden `replaceChildren` und markieren den Root mit `data-rmt-rendered-shell`. |
| Elemente | Tags muessen einfache Custom-Element- oder HTML-Tagnamen sein. |
| Attribute | Inline-Handler, `srcdoc` und unsichere URL-Werte werden abgelehnt. |
| Properties | HTML-Sink-Properties sind fuer normale UI gesperrt. |
| Listen | `renderKeyed` erhaelt Knoten ueber `data-rmt-key` und patcht Attribute/Children. |
| Events | Events laufen ueber `addEventListener`, nicht ueber String-Attribute. |
| Diagnostics | Runtimefehler enthalten RMT-Source-Informationen wie `documentId`, `templateId` und `pointer`. |

## Component Registry Option

`render(...)` und `renderKeyed(...)` akzeptieren `componentRegistry`. Wenn ein
Descriptor `type: "component"` nutzt, normalisiert der Renderer Tag,
Attribute, Properties, Slots, Parts und Event-Bindings ueber die RMT vNext
Component Capability Registry:

```js
renderer.renderKeyed(root, descriptors, {
  componentRegistry: registry,
  dispatchEvent,
  stateBridge
});
```

Die Registry bindet XTend-Komponenten ueber public DOM APIs. Sie liest
Component Contracts und RMT-Metadaten, fuehrt lazy Import ueber Manifest-Pfade
aus und schreibt sichere Capability-Marker wie
`data-rmt-component-capability`. Der Renderer bleibt dadurch generisch: keine
Shadow-DOM-Patches, keine privaten Component-Maps und keine HTML-Sinks fuer
normale RMT-App-UI.

## Trusted Boundary

HTML-Fragmente sind kein normaler Template-Pfad. Sie duerfen nur als
`trusted_html` mit `xtend.rmt.trusted-dom-boundary.explicit` und einem
externen `trustedDomRenderer` gerendert werden. Der Standard-Renderer erzeugt
keine HTML-Fragmente aus Strings.

## No-Manual-HTML

Das Gate `createNoManualHtmlGate()` blockiert normale App-Shells mit
manuellen HTML-Sinks wie `root.innerHTML`, `element.innerHTML`,
`template.innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` und
`createContextualFragment`.

`WP-E18-06` und die vNext Component Capability Registry bauen auf diesem Slice
component-native Template-Primitives auf, ohne externe HTML-Hilfsrenderer
vorauszusetzen.
