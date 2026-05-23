# RMT PHP/Laravel SSR Adapter

Der PHP SSR Adapter ist die Laravel-kompatible Host-Schicht fuer RMT vNext.
Er liegt als portables Single-File-Modul unter
`xtendrmt/rmt-php-ssr-adapter.php`, benoetigt PHP 8.1+ und kommt in dieser
ersten Welle ohne Composer-Package und ohne Service Provider aus.

Schema: `xtend.rmt.php-ssr-adapter.v1`

Der Adapter ist auf Client-Wire-Ebene mit dem
[RMT Node SSR Adapter](./rmt-node-ssr-adapter.md) austauschbar. HTML,
Hydration, RenderMan-Chunks und JSONL-Frames nutzen dieselben Schemas:
`xtend.rmt.node-ssr-render-result.v1`,
`xtend.rmt.node-ssr-hydration-payload.v1` und
`xtend.rmt.node-ssr-jsonl-frame.v1`.

## Rolle im Stack

RMT beschreibt die App. XTend Components bleiben die UI-Bausteine. Der PHP
Adapter serialisiert serverseitiges Light DOM, Capability-Marker,
Lazy-Import-Hints und Hydration-Payloads, ohne Custom Elements auf dem Server
zu instanziieren.

Keine Parallelstruktur:

- kein Shadow-DOM-Rendering auf dem Server
- keine privaten Component-Maps
- kein Docs-App-Sonderpfad
- kein eingebauter PHP-RMT-Compiler
- kein impliziter Netzwerkzugriff
- keine HTML-Ausgabe ohne Trust Boundary

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

$result = $adapter->render(['coreDocument' => $coreDocument]);
```

`render(...)` verarbeitet Core Documents, Prepared Templates und DOM
Descriptoren direkt. `.rmt` Source braucht eine injizierte
`compileRmtVNextSource`-Bridge. Ohne Bridge entsteht die blockierende Diagnose
`rmt.php_ssr.compiler_required`.

## Laravel Helpers

```php
return $adapter->toLaravelResponse($result);

return $adapter->toLaravelStreamedResponse([
    'coreDocument' => $coreDocument,
]);
```

Wenn Laravel/Symfony Response-Klassen vorhanden sind, nutzt der Adapter diese
direkt. Ohne Framework gibt er Arrays zurueck. Damit bleibt die Datei in
Laravel, kleinen PHP-Hosts und Tests nutzbar.

## JSONL Streaming

`streamJsonl(...)` liefert newline-delimited JSON mit
`xtend.rmt.node-ssr-jsonl-frame.v1`. Unterstuetzte Frames sind `start`,
`component`, `html`, `hydration`, `diagnostic`, `complete` und `error`.

Die Frames tragen dieselben Felder wie der Node Adapter: `requestId`,
`sequence`, `operationId`, `variant`, `capability`, `lane`, `chunkKey`,
`payload` und `diagnostics`. Dadurch muss die XTend Browser-Runtime nicht
wissen, ob Node oder PHP/Laravel das Backend ist.

## DataSources und Trust Boundaries

Serverdaten kommen nur ueber explizite Host-Hooks:

- `resolveDataSource`
- `endpointHandlers`
- `staticDataSources`
- `fixtures`
- `fetchAdapter`
- `laravelContainerResolver`

HTML-Fragmente muessen eine Boundary wie
`xtend.security.sanitizing-boundary.v1` oder
`xtend.security.streaming-boundary.v1` tragen. Unsichere URLs,
Event-Attribute, `srcdoc` und blockierte Tags werden diagnostiziert und vom
Fallback-Sanitizer entfernt. Produktive Hosts koennen `sanitizeHtmlOutput`
injizieren.

## Docs-App Integration

Die Docs-App nutzt den Adapter nun direkt in `docs/index.php` fuer
Shell-first-Prehydration.

- Contract: `xtend.docs.php-ssr-prehydration.v1`
- vNext Source: `docs/xtendrmt-docs-shell-vnext.rmt`
- Compiler-Bridge: `scripts/compile_rmt_vnext_bridge.js`
- JSONL Endpoint:
  `index.php?xtend-docs-rmt-ssr=shell&format=jsonl&page={slug}&locale={locale}`

Der Host injiziert `compileRmtVNextSource` ueber die Node-Bridge. Parsedown
bleibt Host-Boundary und fuellt nur den Content-Slot, waehrend die Shell aus
RMT-Primitives, Hydration und RenderMan-Chunks kommt.

## Gates

```bash
npm run test:rmt-php-ssr-adapter
npm run test:docs-php-ssr-prehydration
node scripts/run_xtend_tests.js rmt-php-ssr-adapter --json
```
