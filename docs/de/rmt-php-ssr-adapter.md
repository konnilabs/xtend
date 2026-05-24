# RMT PHP/Laravel SSR Adapter

Serverseitiges Rendering für PHP und Laravel Hosts.

## Worum es geht

RMT beschreibt App-Struktur, Interaktion und Laufzeitabsicht. Der Kernel bleibt host-neutral; Adapter verbinden die Records mit XTend UI, XRouter, Fabric und deiner Umgebung.

## Öffentliche Bausteine

- `.rmt` Quellen.
- Core Records und Source Maps.
- Host Adapter für DOM, Router und Komponenten.
- Adapter-Schema `xtend.rmt.php-ssr-adapter.v1`.
- JSONL Streaming über `xtend.rmt.node-ssr-jsonl-frame.v1`, damit PHP Hosts dieselbe inkrementelle Frame-Form wie der Node SSR Adapter verwenden.

## Beispiel

```php
require __DIR__ . '/xtendrmt/rmt-php-ssr-adapter.php';

$adapter = createRmtPhpSsrAdapter(['manifest' => $manifest]);
$result = $adapter->render(['coreDocument' => $coreDocument]);
```

## Empfohlener Ablauf

Modelliere zuerst Shell, State und Interaktion. Prüfe die Quelle mit dem Linter, binde anschließend Adapter an und halte Host-spezifischen Code außerhalb des Kernels.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
