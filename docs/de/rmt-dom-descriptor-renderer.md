# RMT DOM Descriptor Renderer

Der RMT DOM Descriptor Renderer wandelt strukturierte RMT Records in Browser-Nodes um, ohne Anwendungsdaten als HTML zu behandeln. Verwende ihn, wenn ein RMT Template, Component Binding oder eine Surface owned DOM materialisieren soll und die Trust Boundary überprüfbar bleiben muss.

Der Runtime-Vertrag ist `xtend.epic18.rmt-dom-descriptor-renderer.v1`. Implementierung und Deklarationen liegen in `xtendrmt/rmt-dom-descriptor-renderer.js` und `xtendrmt/rmt-dom-descriptor-renderer.d.ts`; der Package-Subpath lautet `@ccslabs/xtend/rmt/dom-descriptor-renderer`.

## Mental Model

Ein Descriptor sagt, welche Art von Node erzeugt werden soll. Er kann ein Element, Text, eine registrierte XTend-Komponente, eine Bedingung, wiederholte Records oder einen Slot beschreiben. Der Renderer löst diese Struktur gegen explizite Model-, Selector-, Template- und Component-Registries auf. Danach materialisiert er das Ergebnis mit `createElement`, `createTextNode`, `createDocumentFragment` und `replaceChildren`.

Der Root bleibt im Besitz des Hosts. `render()` ersetzt nur die Kinder des übergebenen Roots und markiert ihn mit dem Renderer-Schema. `renderKeyed()` verwendet passende keyed Children erneut; `patchElement()` aktualisiert ein bestehendes owned Element. Keine dieser Operationen überträgt RMT die Ownership über das gesamte Dokument.

## Minimales Beispiel

```js
import { createRmtDomDescriptorRenderer } from '@ccslabs/xtend/rmt/dom-descriptor-renderer';

const root = document.querySelector('[data-rmt-host]');
const renderer = createRmtDomDescriptorRenderer({ documentTarget: document });

const result = renderer.render(root, {
  type: 'element',
  tag: 'section',
  attributes: { 'aria-label': 'Build-Status' },
  children: [
    { type: 'text', text: 'Bereit' }
  ]
});

console.log(result.nodeCount, result.diagnostics);
```

Das Result verwendet `xtend.epic18.rmt-dom-render-result.v1`. Übergib Source Locations in den Render-Optionen, wenn Diagnostics auf Dokument, Template, Node, Zeile oder Spalte zurückführen sollen.

## Trust Boundary

Normale UI folgt der No-Manual-HTML-Regel. Der Renderer blockiert `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `createContextualFragment`, Inline-Event-Handler, unsichere URL-Schemas und gesperrte Tags wie `script` oder `iframe`. Attribute und Properties durchlaufen explizite Allowlists statt beliebiger Zuweisungen.

Trusted Rich Content besitzt einen getrennten Pfad. Ein entsprechender Descriptor wird nur akzeptiert, wenn der Host einen expliziten `trustedDomRenderer` für `xtend.rmt.trusted-dom-boundary.explicit` bereitstellt. Verwandle eine Ablehnung nicht in einen Fallback-String-Sink; rendere stattdessen Text oder eine deklarierte Fallback-Surface.

## Fehlerverhalten

Ein ungültiger Root, gesperrter Tag, unsichere URL, unbekannte Komponente oder verbotene Property wirft einen Fehler mit einem `xtend.epic18.rmt-dom-renderer-diagnostic.v1` Diagnostic. `listDiagnostics()` liefert die vom Renderer beobachteten Diagnostics. Ein Host kann zusätzlich `diagnosticsHub.publish()` bereitstellen, um sie weiterzuleiten, ohne dem Renderer kanonischen App-State zu übertragen.

Mit `createNoManualHtmlGate()` kannst du Quelldateien bereits vor der Browser-Ausführung auf verbotene Sinks prüfen. Das Gate meldet Datei und Sink, schreibt den Source aber nicht automatisch um.

## Vertrag prüfen

```bash
node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer rmt-renderer-dom-descriptor-proofs --json
```

Ein akzeptiertes Ergebnis beweist Node-Materialisierung, Event-Cleanup, keyed Updates, Source Diagnostics und die Ablehnung manueller HTML-Sinks. Behebe einen Fehler im Descriptor oder in der Host-Policy, statt den Renderer zu umgehen.

## Verwandte Seiten

- [RMT vNext Component Primitives](./rmt-vnext-component-primitives.md)
- [Trusted DOM und Sanitizing](./trusted-dom-sanitizing.md)
- [RMT App Platform Fixture](./rmt-app-platform-fixture.md)
- [RMT Security Policies](./rmt-reference-security-policies.md)
