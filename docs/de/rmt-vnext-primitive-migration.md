# RMT vNext Primitive Migration

- Contract: `xtend.rmt.vnext.primitive-migration-preview.v1`
- Workpackage: `RMT-VNEXT-PRIM-08`
- Status: `in_progress`
- Source fixture: `tests/fixtures/rmt-app-platform-tooling.rmt`
- Local gate: `node scripts/run_xtend_tests.js rmt-vnext-compatibility --json`

## Ziel

`RMT-VNEXT-PRIM-08` schiebt Legacy- und App-Platform-JSON-Authoring in den
Hintergrund. Bestehende App-Platform-Primitive-Records bleiben als
Compiler-Target und Compatibility-Evidence erhalten, aber die primaere
Authoring-Flaeche ist RMT vNext.

Der Migrationspfad erzeugt deshalb keinen neuen Legacy-Arbeitsmodus. Er erzeugt
einen vNext-Preview-Draft aus vorhandenen App-Platform-Records und kompiliert
diesen Draft direkt wieder durch den vNext-Compiler. Erst wenn dieser Draft
State, DataSources, Actions, Events, Portals, Overlays, Resources, Surfaces,
Lanes und Kernel-Records absenken kann, gilt die Migration als kompatibel.

## Preview- und Apply-Plan-Vertrag

Die API `createAppPlatformPrimitiveMigrationPreview(...)` erkennt
App-Platform-JSON-Dokumente mit Primitive-Domains wie `state`, `dataSources`,
`actions`, `events`, `portals`, `overlays`, `resources` und `surfaces`.

Der Preview-Report enthaelt:

- `schema: "xtend.rmt.vnext.primitive-migration-preview.v1"`
- `workpackage: "RMT-VNEXT-PRIM-08"`
- `languageMode: "legacy-app-platform-json"`
- `vNextAuthoring.role: "default"`
- `legacyAuthoring.role: "compiler-target"`
- `legacyAuthoring.backgrounded: true`
- `authoringDraft` mit vNext-Primitive-Syntax
- `authoringDraftCompileStatus: "compiled"`
- `projection.appPlatform` und `projection.kernelRecords`
- `domainMapping` fuer die erkannten Primitive-Familien

Report-only-Mode schreibt keine Quelle um. Er meldet stattdessen
`rmt.vnext.migration.opt_in_required` und
`rmt.vnext.primitive_migration.preview_available`. Preview-Mode ist bewusst
opt-in, damit vorhandene downstream Fixtures nicht still migriert werden.

Die API `createAppPlatformPrimitiveMigrationApplyPlan(...)` baut darauf auf
und erzeugt einen deterministischen Apply-Plan:

- `schema: "xtend.rmt.vnext.primitive-migration-apply-plan.v1"`
- `status: "apply-plan-ready"`, wenn der vNext-Draft kompiliert und eine
  Projektion erzeugt werden kann
- `status: "blocked"`, wenn JSON-Parsing oder vNext-Kompilation fehlschlagen
- `targetPath` als Zielpfad-Hinweis, standardmaessig
  `<quelle>.vnext.rmt`
- `automaticWrite: false`
- `writePolicy: "manual-apply-only"`

Der Apply-Plan fuehrt keinen Datei-Write aus. Er ist ein pruefbarer Handoff
fuer Agenten, CLIs oder Editoren, die den vNext-Draft nach Review in einen
neuen Authoring-Pfad uebernehmen wollen. Legacy/App-Platform-JSON bleibt dabei
Mirror und Compiler-Target, nicht die Benutzeroberflaeche.

## Authoring-Draft

Das App-Platform-Fixture wird in eine vNext-Shell dieser Form ueberfuehrt:

```rmt
template epic18.app-platform-tooling.fixture {
  state items type collection initial []

  datasource items from fixture records.generic-items {
    contract "domain.record.generic-item.v1[]"
  }

  action load-items {
    effect fetch datasource items
    reduce state.items = result.records
  }

  portal app root "#app-root" layer surface

  surface workspace kind window component workspace {
    repeat from datasource items
    portal app

    lane visible weight 70 {
      hydrate workspace from datasource items
    }

    on open-detail target ref.row -> action open-detail {
      payload id from detail.id
    }
  }
}
```

Die Preview normalisiert bekannte App-Platform-Prefixes fuer vNext-Authoring:
`state.items` wird zu `state items`, `datasource.items` zu
`datasource items`, `surface.workspace` zu `surface workspace` und
`action.open-detail` zu `action open-detail`. Runtime- und Kernel-Records
bleiben ueber die Compiler-Projektion korrelierbar.

## Gate-Erwartung

Das Compatibility-Gate prueft fuer PRIM-08:

- App-Platform-Primitive-JSON wird als `legacy-app-platform-json` erkannt.
- Report-only-Mode verlangt explizites Preview-Opt-in.
- Preview-Mode erzeugt einen vNext-Draft und kompiliert ihn.
- Apply-Plan-Mode erzeugt denselben Draft, einen Zielpfad-Hinweis und eine
  blockierende Compile-/Parse-Pruefung, ohne Dateien zu schreiben.
- Die Projektion enthaelt App-Platform- und Kernel-Records.
- Legacy wird als `compiler-target` markiert, nicht als Authoring-Pfad.
- Die Compatibility-Matrix akzeptiert App-Platform-Preview und native vNext-
  Quelle gemeinsam.

Damit wird die Upgrade-Regel testbar: Legacy ist weiterhin beweisbar
kompatibel, aber die Developer Experience fuer neue App-Shell-Arbeit liegt in
vNext.
