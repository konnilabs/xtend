# RMT App Platform Migration Guide

Migration größerer App-Strukturen auf die RMT App Platform APIs.

## Worum es geht

Dieser Leitfaden migriert eine bestehende App schrittweise von handgeschriebenen Host-Callbacks zu typisierten App-Platform-Records. Ziel ist Verhaltensparität: State, Actions, Events, Resources und Surfaces wechseln ihren Besitzer, ohne dass Navigation, Fehlerzustände oder Cleanup verschwinden.

## Öffentliche Bausteine

- `tests/fixtures/rmt-app-platform-authoring.rmt` zeigt die Zielstruktur.
- `tools/rmt-language/vnext-compiler.js` erzeugt das vergleichbare Core-Modell.
- `rmt-app-platform-migration-guide` bleibt der öffentliche Migrationspfad; interne Release-Berichte gehören nicht hierher.

## Empfohlener Ablauf

Inventarisiere zuerst State und Seiteneffekte im alten Host. Migriere dann eine vertikale Surface einschließlich Action und Resource, vergleiche das Core-Ergebnis und entferne die alte Verdrahtung erst nach dem Browser-Smoke.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Ziel und Coexistence prüfen

```bash
node scripts/run_xtend_tests.js rmt-app-platform-authoring native-first-migration-deprecation --json
```

Der erste Gate belegt das Zielmodell; der zweite schützt Coexistence-Grenzen während der Umstellung. Beide Reports müssen dieselbe Surface eindeutig einem Owner zuordnen.
