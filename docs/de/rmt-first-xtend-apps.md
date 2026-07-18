# RMT-first XTend Apps

Ein Architekturpfad für Apps, deren Shell aus RMT entsteht.

## Worum es geht

Eine RMT-first App besitzt ihre Shell, ihren State und ihre Actions in der RMT Source. HTML stellt nur Mount-Ziele und lokale Module bereit; imperatives Host-JavaScript bleibt auf Adapter und echte Plattformdienste begrenzt.

## Öffentliche Bausteine

- `demos/xtendrmt/examples/first-app/source.rmt` dient als minimale Shell.
- `xtendrmt/rmt-app-runtime.js` übernimmt Core-Records in die Runtime.
- `components/manifest.json` liefert die lokal erlaubten UI-Tags.

## Empfohlener Ablauf

Beginne mit einer Surface und einem State-Record. Ergänze Actions und Resources erst, wenn der erste Core-Snapshot stabil ist, und halte Netzwerk, Storage oder Browser-APIs hinter einem expliziten Host-Adapter.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Shell-Vertrag prüfen

```bash
node scripts/run_xtend_tests.js rmt-first-class-app --json
```

Der Gate prüft Source, Registry und Host-Grenze gemeinsam. Ein reiner Parser-Erfolg reicht nicht aus, wenn die Shell manuelle UI-Erzeugung oder einen zweiten State-Owner benötigt.
