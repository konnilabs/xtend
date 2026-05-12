# XTend RMT vNext Compatibility Migration Contract

- Schema: `xtend.rmt.vnext-compatibility-matrix.v1`
- Migration Report Schema: `xtend.rmt.vnext-migration-report.v1`
- Roundtrip Report Schema: `xtend.rmt.vnext-roundtrip-report.v1`
- Legacy Projection Schema: `xtend.rmt.vnext-legacy-core-projection.v1`
- Workpackage: `WP-E15-16`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-compatibility --json`

## Ziel

Dieser Contract haelt fest, wie bestehende RMT JSON/Core-Dokumente neben der vNext Authoring-Syntax weiter akzeptiert, diagnostiziert und kontrolliert migriert werden.

Die Migration bleibt opt-in. Standard ist `report-only`: Legacy-Dokumente werden geparst, normalisiert, semantisch roundtrip-geprueft und als vNext Core-Projektion beschrieben, aber nicht automatisch in vNext Authoring umgeschrieben.

## Modi

| Modus | Verhalten |
| --- | --- |
| `report-only` | erzeugt Migrationsreport, Roundtrip-Report, Core-Projektion und opt-in Diagnostic |
| `preview` | erzeugt zusaetzlich einen vNext Authoring-Draft und kompiliert ihn gegen den vNext Compiler |

## Compatibility Matrix

Die Matrix fasst mehrere Quellen als `xtend.rmt.vnext-compatibility-matrix.v1` zusammen.

- Legacy JSON `.rmt` und `.rmt.json` muessen parse- und normalisierbar bleiben.
- vNext Authoring wird direkt kompiliert und als `migrationRequired: false` markiert.
- Kompatible Altformen duerfen Warnungen haben, aber keine Hard Errors.
- Kaputte Syntax oder nicht normalisierbare Inhalte blockieren nur den betroffenen Eintrag.

## Roundtrip Boundary

Legacy Roundtrip wird auf fachlicher normalisierter JSON-Repraesentation verglichen. Das Feld `normalization` ist bewusst aus dem Vergleich ausgeschlossen, weil der Format-Adapter dort Quellen-Metadaten wie `default-empty` oder `top-level` neu ableitet.

Der Report dokumentiert dies als:

```json
{
  "comparisonBoundary": "semantic-normalized-json-with-normalization-metadata-excluded"
}
```

## Migration Boundary

Die vNext Core-Projektion ist ein kontrollierter Brueckenvertrag, kein vollautomatischer Source-Rewrite.

- `routes` werden als Surface/Lane/Lifecycle-Projektion beschrieben.
- `components` werden als Lifecycle-Operationen referenziert.
- `schedules` werden zu Lanes gemappt.
- `templates` bleiben als Legacy-Template-Refs sichtbar.
- `adapters` bleiben Host-Contracts und werden nicht automatisch in vNext Authoring eingebettet.

Diese Grenzen werden als `rmt.vnext.migration.lossy_domain` gewarnt. Sie sind kompatibel, aber fuer eine bewusste Migration sichtbar.

## Diagnostics

| Code | Severity | Bedeutung |
| --- | --- | --- |
| `rmt.vnext.migration.opt_in_required` | warning | Migration bleibt ohne expliziten Preview-Modus report-only |
| `rmt.vnext.migration.lossy_domain` | warning | Legacy-Domaene ist kompatibel, aber nicht vollautomatisch source-stabil migrierbar |
| `rmt.vnext.migration.legacy_parse_failed` | error | Legacy JSON konnte nicht geparst werden |
| `rmt.vnext.migration.legacy_normalization_failed` | error | Legacy JSON konnte nicht normalisiert werden |
| `rmt.vnext.migration.vnext_compile_failed` | error | vNext Source oder Preview-Draft kompiliert nicht |
| `rmt.vnext.roundtrip.mismatch` | error | normalisierte fachliche JSON-Repraesentation ist nicht stabil |

## Agenten- und CLI-Report

Reports werden deterministisch mit sortierten Keys serialisiert. AI-Agenten und CLI koennen dadurch Status, Diagnostics, Projection und Preview-Draft ohne eigene Parser-Heuristiken auswerten.

Das Package exportiert:

- `./rmt-language/vnext-compatibility`
- `createMigrationReport`
- `createLegacyRoundtripReport`
- `createCompatibilityMatrix`
- `createRmtVNextCompatibilityAdapter`
- `serializeMigrationReport`
