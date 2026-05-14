# XTendRMT Kernel Trusted DOM Runtime Contract

- Status: `accepted-runtime-trusted-dom-sink-adapter`
- Datum: 14. Mai 2026
- schema: `xtend.rmt.kernel-trusted-dom-runtime.v1`
- Trust-Sink-Adapter: `xtend.rmt.runtime-trust-sink-adapter.v1`
- Trust Authority: `xtend.rmt.kernel-trust-authority.v1`
- Verdict: `xtend.rmt.kernel-trust-verdict.v1`
- Boundary: `xtend.security.sanitizing-boundary.v1`
- Workpackage: `RKSH-WP-02`
- Gate: `node scripts/run_xtend_tests.js rmt-kernel-trusted-dom-runtime --json`

## Zweck

Dieser Contract bindet die Kernel-Trust-Schicht aus `RKSH-WP-01` an die HTML-Runtime-Sinks des RMT-Kernels. HTML-Fragmente duerfen nicht mehr direkt aus Slots, Prerender-Chunks oder Error-Boundary-Fallbacks in `innerHTML` geschrieben werden. Jeder Commit laeuft ueber einen Runtime Trust-Sink-Adapter, wird sanitisiert und erzeugt ein `RmtKernelRuntimeTrustVerdict`.

## Runtime-Invarianten

- `html_fragment` Slots committen nur nach Sanitizing-Boundary.
- Prerender-Markup committen nur nach Sanitizing-Boundary.
- Error-Boundary-Fallback-Markup ist nicht privilegiert und nutzt dieselbe Boundary.
- Nested-Template- und Repeat-Fallbacks nutzen denselben Adapter.
- Trust-Diagnostics werden ueber `rmt.kernel.trust` publiziert.
- Verdict-Metadaten enthalten Laengen, Removal-Counts und Korrelation, aber kein rohes HTML.

## Abgedeckte Sinks

| Sink | Runtime-Pfad | Verdict-Scope |
|------|--------------|---------------|
| `slot.html` | `applySlotValue` | `slot` |
| `prerender.html` | `writeChunkToElement`, `applyPrerenderChunk` | `template` |
| `fallback.html` | `clearNestedTemplateRecord`, Repeat-Fallback, Error Boundary | `template` / `binding` |
| `template.innerHTML` | Template-Fragment-Erzeugung | `template` |
| `innerHTML` | finaler Commit im Adapter | scope-abhaengig |

## Sanitizing Policy

Die Runtime-Policy ist bewusst host-neutral und spiegelt die vorhandene Trusted-DOM-Policy:

- entfernt Tags: `script`, `iframe`, `object`, `embed`, `link`, `meta`, `base`, `form`
- entfernt Attribute: `on*`, `srcdoc`
- validiert URL-Attribute: `href`, `src`, `srcset`, `action`, `formaction`, `poster`, `xlink:href`
- blockiert Protokolle: `javascript:`, `vbscript:`, `data:text/html`, `data:text/javascript`, `data:application/javascript`, `data:application/ecmascript`
- erlaubt relative URLs, `http:`, `https:`, `mailto:`, `tel:` und `data:image/*`

Hosts koennen per `sanitizeHtmlOutput` oder `sanitizeTrustedDomHtml` einen eigenen Sanitizer injizieren. Wenn dieser fehlschlaegt, faellt der Kernel auf die lokale Policy zurueck, damit kein unsicherer HTML-String ungeprueft committed wird.

## Evidence API

Runtime Renderer, Binding Sessions und Execution Path exponieren:

```ts
listTrustVerdicts(): RmtKernelRuntimeTrustVerdict[]
```

Die Verdicts sind serialisierbare Evidence fuer Tests, Diagnostics und spaetere Panic-Korrelation. Sie sind keine Freigabe fuer weitere Sinks; jeder neue Sink muss erneut ueber den Adapter laufen.

## Akzeptanz

- Alle drei Runtime-Artefakte enthalten `xtend.rmt.runtime-trust-sink-adapter.v1`.
- Unsichere Fixtures mit `script`, `on*`, `javascript:`, `srcdoc` und `iframe` werden sanitisiert.
- Slot-, Prerender- und Error-Boundary-Pfade erzeugen `xtend.rmt.kernel-trust-verdict.v1`.
- Der lokale Gate ist:

```bash
node scripts/run_xtend_tests.js rmt-kernel-trusted-dom-runtime --json
```
