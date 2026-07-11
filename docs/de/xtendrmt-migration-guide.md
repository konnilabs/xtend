# XTendRMT Migration Guide

Migration von handgeschriebener Host-Logik zu deklarativen RMT Records.

## Worum es geht

Dieser Guide ersetzt imperative App-Verdrahtung durch RMT Records, ohne eine Big-Bang-Migration zu verlangen. Bestehende Hosts können pro Surface migrieren, solange alter und neuer Pfad nicht denselben State oder DOM-Bereich besitzen.

## Öffentliche Bausteine

- `tools/rmt-language/vnext-parser.js` validiert die neue Source.
- `xtendrmt/rmt-app-runtime.js` übernimmt kompilierte Core-Records.
- `rmt-vnext-migration-notes` dokumentiert Änderungen innerhalb der vNext-Sprache.

## Empfohlener Ablauf

Wähle eine Surface mit klaren Ein- und Ausgaben. Erfasse bisherigen State, Events und Cleanup, bilde sie in RMT ab und entferne den Legacy-Pfad erst, wenn Snapshots und Browser-Smoke gleiches Verhalten zeigen.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Migration prüfen

```bash
node scripts/run_xtend_tests.js native-first-migration-deprecation --json
```

Der Report unterscheidet weiterhin unterstützte Legacy-Grenzen von Pfaden, die durch native RMT Records ersetzt werden müssen. Eine Refusal-Diagnose wird an der Source oder Adaptergrenze behoben, nicht durch einen zweiten Besitzer derselben Surface.
