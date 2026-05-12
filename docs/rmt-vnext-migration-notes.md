# RMT vNext Migration Notes

- Contract: `xtend.rmt.vnext-release-handoff.v1`
- Compatibility Contract: `xtend.rmt.vnext-compatibility-matrix.v1`
- Migration Report: `xtend.rmt.vnext-migration-report.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-compatibility --json`

RMT vNext ist additiv. Bestehende JSON-nahe `.rmt` und `.rmt.json` Dokumente bleiben parse- und normalisierbar. Neue Authoring-Dateien sollten die vNext-Syntax verwenden und nach `xtend.rmt.core-format.vnext.v1` kompilieren.

## Migrationsmodus

Der Standardmodus ist `report-only`. Er erzeugt einen Migrationsreport, prueft den Legacy-Roundtrip und zeigt Boundary-Warnungen, schreibt aber keine Datei automatisch um.

`preview` ist opt-in und erzeugt zusaetzlich einen vNext Authoring-Draft.

```js
const {
  createMigrationReport
} = require('./tools/rmt-language/vnext-compatibility');

const report = createMigrationReport({
  text: source,
  filePath: 'app.rmt'
}, {
  migrationMode: 'preview'
});
```

## Kompatible Warnungen

Diese Warnungen blockieren Migration nicht:

- `rmt.document.extension.fallback-used`
- `rmt.vnext.migration.opt_in_required`
- `rmt.vnext.migration.lossy_domain`

`lossy_domain` bedeutet: Die Legacy-Domaene ist fachlich kompatibel, aber nicht automatisch source-stabil in vNext Authoring uebersetzbar. Beispiele sind Adapter-Contracts, komplexe Templates oder Router-Metadaten.

## Harte Fehler

Diese Faelle blockieren den betroffenen Eintrag:

- Legacy JSON kann nicht geparst werden.
- Legacy JSON kann nicht normalisiert werden.
- vNext Source kompiliert nicht.
- Der semantische Legacy-Roundtrip ist nicht stabil.

## Empfohlene Migration

1. `rmt-vnext-compatibility` gegen bestehende Fixtures ausfuehren.
2. Reports mit `migrationMode: "report-only"` lesen und Boundary-Warnungen triagieren.
3. Fuer einzelne Dateien `preview` erzeugen.
4. Den Preview-Draft manuell pruefen und auf vNext-Authoring-Konventionen bringen.
5. Parser, Compiler, Regression und Release-Gate ausfuehren.

```bash
node scripts/run_xtend_tests.js rmt-vnext-compatibility rmt-vnext-regression rmt-vnext-release --json
```

## Handoff

Dieses Epic liefert Syntax, Compiler, Tooling, Compatibility, Regression und Release-Handoff. Produktive Runtime-Adapter fuer vNext Core und ein Formatter/Writer gehoeren in Folge-Epics.
