# RMT PHP/Laravel SSR Adapter

Der PHP SSR Adapter ist die Laravel-kompatible Host-Schicht fuer RMT vNext.
Er liegt als portables Single-File-Modul unter
`xtendrmt/rmt-php-ssr-adapter.php`, benoetigt PHP 8.1+ und hat in diesem Slice
keine Composer- oder Service-Provider-Pflicht.

Schema: `xtend.rmt.php-ssr-adapter.v1`

Der Adapter ist auf Client-Wire-Ebene kompatibel mit dem
[RMT Node SSR Adapter](./rmt-node-ssr-adapter.md). Beide liefern denselben
Render-Result-, Hydration-, Chunk- und JSONL-Frame-Shape:
`xtend.rmt.node-ssr-render-result.v1`,
`xtend.rmt.node-ssr-hydration-payload.v1` und
`xtend.rmt.node-ssr-jsonl-frame.v1`.

## Rolle im Stack

RMT beschreibt App Shell, State, DataSources, Surfaces, Events und Lanes. Der
PHP Adapter materialisiert daraus serverseitiges Light DOM fuer XTend Custom
Elements und uebergibt Hydration-Daten an die bestehende Browser-Runtime.

Der Adapter:

- instanziiert keine Custom Elements auf dem Server
- rendert kein Shadow DOM
- nutzt keine privaten Component-Maps
- ist nicht an die Docs-App gekoppelt
- fuehrt keinen PHP-RMT-Compiler mit
- akzeptiert DataSources nur ueber explizite Host-Resolver

## Public API

```php
require __DIR__ . '/xtendrmt/rmt-php-ssr-adapter.php';

$adapter = createRmtPhpSsrAdapter([
    'manifest' => $manifest,
    'endpointHandlers' => [
        'ssr.hero' => fn () => [
            'html' => '<x-hero>Hero</x-hero>',
            'trustBoundary' => 'xtend.security.sanitizing-boundary.v1',
        ],
    ],
]);

$result = $adapter->render([
    'coreDocument' => $coreDocument,
]);

foreach ($adapter->streamJsonl(['coreDocument' => $coreDocument]) as $line) {
    echo $line;
}
```

`render($input, $options)` akzeptiert RMT vNext Core Documents, Prepared
Templates und DOM Descriptoren direkt. `.rmt` Source wird nur verarbeitet, wenn
ein Host eine `compileRmtVNextSource`-Bridge injiziert. Ohne Bridge meldet der
Adapter `rmt.php_ssr.compiler_required`.

## Laravel Helpers

Die Helpers bleiben optional und aktivieren sich nur, wenn Laravel oder
Symfony Response-Klassen bereits geladen sind:

```php
return $adapter->toLaravelResponse($result);

return $adapter->toLaravelStreamedResponse([
    'coreDocument' => $coreDocument,
]);
```

Ohne Framework degradieren die Methoden sauber zu Arrays. Dadurch kann dieselbe
Adapterdatei in Laravel, kleinen PHP-Hosts und Tests genutzt werden.

## Render-Ergebnis

`render(...)` liefert ein Array mit:

- `schema`: `xtend.rmt.node-ssr-render-result.v1`
- `adapterSchema`: `xtend.rmt.php-ssr-adapter.v1`
- `html`: serverseitiges Light DOM fuer XTend Custom Elements
- `head.preloads`: Lazy-Import-Hints aus Component Capabilities
- `chunks`: `renderman_template_chunk` im `server_prerender_hydrate`-Shape
- `response`: `renderman_template_prerender_response`
- `hydration`: `xtend.rmt.node-ssr-hydration-payload.v1`
- `streamingContract`: `xtend.rmt.vnext-streaming-contract.v1`, falls das
  Dokument Streaming beschreibt
- `componentCapabilities`: Marker fuer XTend Component Tags
- `diagnostics`: PHP-spezifische Diagnostics unter `rmt.php_ssr.*`

## JSONL Streaming

`streamJsonl(...)` erzeugt newline-delimited JSON Frames mit
`xtend.rmt.node-ssr-jsonl-frame.v1`.

Frame-Typen:

- `start`
- `component`
- `html`
- `hydration`
- `diagnostic`
- `complete`
- `error`

Jeder Frame traegt `requestId`, `sequence`, `operationId`, `variant`,
`capability`, `lane`, `chunkKey`, `payload` und `diagnostics`. SSR-Frames
nutzen `stream.ssr.incremental`; Hydration-Frames nutzen
`stream.hydration.chunked`.

## DataSources und Security

Serverdaten sind Host-Verantwortung. Der Adapter nutzt nur explizite Resolver:

- `resolveDataSource`
- `endpointHandlers`
- `staticDataSources`
- `fixtures`
- `fetchAdapter`
- `laravelContainerResolver`

HTML-Fragmente brauchen eine Trust Boundary wie
`xtend.security.sanitizing-boundary.v1` oder
`xtend.security.streaming-boundary.v1`. Der eingebaute Fallback-Sanitizer
blockt Event-Attribute, `srcdoc`, unsichere URLs und Script-/Frame-/Object-
Tags. Produktive Hosts koennen `sanitizeHtmlOutput` injizieren.

## Docs-App Integration

Die Docs-App nutzt den Adapter nun direkt in `docs/index.php` fuer
Shell-first-Prehydration.

- Contract: `xtend.docs.php-ssr-prehydration.v1`
- vNext Source: `docs/xtendrmt-docs-shell-vnext.rmt`
- Compiler-Bridge: `scripts/compile_rmt_vnext_bridge.js`
- JSONL Endpoint:
  `index.php?xtend-docs-rmt-ssr=shell&format=jsonl&page={slug}&locale={locale}`

Der Host injiziert `compileRmtVNextSource` ueber die Node-Bridge, rendert die
Root-Shell als RMT DOM Descriptor und exposes `window.xtendDocsSsrPrehydration`
mit Hydration, Chunks und Diagnostics. Parsedown bleibt Host-Boundary und
fuellt weiterhin nur den Content-Slot.

## Gates

```bash
npm run test:rmt-php-ssr-adapter
npm run test:docs-php-ssr-prehydration
node scripts/run_xtend_tests.js rmt-php-ssr-adapter --json
```

Empfohlene Regression:

```bash
node scripts/run_xtend_tests.js rmt-php-ssr-adapter rmt-node-ssr-adapter rmt-vnext-streaming rmt-vnext-component-primitives type-exports-rmt --json
```
