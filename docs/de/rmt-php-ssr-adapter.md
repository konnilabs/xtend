# RMT PHP/Laravel SSR Adapter

Serverseitiges Rendering für PHP und Laravel Hosts.

## Worum es geht

Der PHP SSR Adapter bildet denselben RMT Response-Vertrag für PHP- und Laravel-Hosts ab. Er serialisiert Core-Records, CSP und Resume-Daten, ohne JavaScript-Module auf dem Server auszuführen.

## Öffentliche Bausteine

- `xtendrmt/rmt-php-ssr-adapter.php` enthält Adapter und Laravel-Helfer.
- `rmt-php-ssr-adapter` vergleicht Render-, Hydration- und Security-Verhalten.
- `xtend.rmt.ssr-response.v1` kennzeichnet das gemeinsame Response Envelope.

- Adapter-Schema `xtend.rmt.php-ssr-adapter.v1`.
- JSONL Streaming über `xtend.rmt.node-ssr-jsonl-frame.v1`, damit PHP Hosts dieselbe inkrementelle Frame-Form wie der Node SSR Adapter verwenden.

## Hydration Response Envelope

`render().response` verwendet `rmt_template_prerender_response` mit
`executionMode: "server_prerender_hydrate"`. Die Antwort enthält `chunk`,
`chunks`, `request`, `metadata.adapterKind: "php-ssr"` und
`hydrate_existing` Ziel-Metadaten, sodass die Client Runtime sie direkt über
`hydrateResponse` verarbeiten oder bei Diagnosefehlern kontrolliert degradieren
kann.

## Automatische CSP

Der Adapter erzeugt für jeden Render automatisch eine Framework-Policy
`xtend.rmt.ssr-csp-policy.v1`. `render().headers`,
`render().response.headers`, Hydration-Metadaten, JSONL-Startframes,
`toLaravelResponse()` und `toLaravelStreamedResponse()` enthalten
`Content-Security-Policy` ohne zusätzliche Host-Verkabelung.

## Beispiel

```php
require __DIR__ . '/xtendrmt/rmt-php-ssr-adapter.php';

$adapter = createRmtPhpSsrAdapter(['manifest' => $manifest]);
$result = $adapter->render(['coreDocument' => $coreDocument]);
```

## Empfohlener Ablauf

Erzeuge die Response aus validierten Core-Daten, setze CSP-Header vor dem Body und übergib Resume-Metadaten unverändert an den Browser. Fehler werden als strukturierte Diagnostics behandelt, nicht als unterdrückte PHP-Warnung.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
- [XScaler-Protokoll](./xscaler-protocol.md)
