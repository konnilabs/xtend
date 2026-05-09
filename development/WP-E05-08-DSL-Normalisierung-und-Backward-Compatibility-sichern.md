# WP-E05-08 - DSL Normalisierung und Backward Compatibility sichern

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
- Backlog: `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
- Bezug:
  - `development/WP-E05-04-Native-Adapters-Domain-im-RMT-Schema-entwerfen.md`
  - `development/WP-E05-05-Native-Components-Domain-im-RMT-Schema-entwerfen.md`
  - `development/WP-E05-06-Native-Routes-Domain-im-RMT-Schema-entwerfen.md`
  - `development/WP-E05-07-Schedules-Domain-als-referenzierbare-Policy-haerten.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-core.d.ts`
  - `xtendrmt/rmt-core.esm.js`
  - `xtendrmt/rmt-runtime.esm.js`
  - `xtendrmt/rmt-runtime.browser.js`
  - `tests/fixtures/rmt-template-only.legacy.rmt`
  - `tests/fixtures/rmt-app-dsl.normalized.rmt`
  - `tests/fixtures/rmt-app-dsl.missing-refs.rmt`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-08` sichert, dass alte Template-only-`.rmt` Dokumente und neue App-DSL-Dokumente gemeinsam normalisiert werden koennen. Die Normalisierung soll native Domains sichtbar machen, Referenzen pruefbar halten und fehlende Referenzen als Diagnostics melden, ohne den RMT Kernel an XTend, XRouter oder DOM-Arbeit zu koppeln.

Der Normalizer ist die Bruecke zwischen den in `WP-04` bis `WP-07` eingefuehrten Domains und den Runtime-Registries aus `WP-09`.

## Normalisierungscontract

Der Contract traegt die stabile ID:

```text
xtend.rmt.dsl-normalization.v1
```

Er verarbeitet drei Eingabemodi:

- `template-only`: bestehende Dokumente mit `templates` und ohne native Domains
- `native-app-dsl`: neue Dokumente mit Top-Level `adapters`, `components`, `routes`, `schedules` und `templates`
- `legacy-manifest-metadata`: bisherige Demo- und Pilotdaten unter `manifest.metadata.*`

Die Normalform enthaelt immer:

- `adapters`
- `components`
- `routes`
- `schedules`
- `templates`
- `diagnostics`
- `normalization`

Template-only-Dokumente normalisieren mit leeren nativen Domains und `templateOnlyCompatible: true`.

## Legacy Promotion

Bis zur produktiven Demo-Migration aus `WP-14` duerfen bestehende Pilotdaten weiter in `manifest.metadata` liegen. Der Normalizer hebt diese Daten in die Normalform:

- `manifest.metadata.adapters` -> `adapters`
- `manifest.metadata.components` -> `components`
- `manifest.metadata.routes` -> `routes`
- `manifest.metadata.schedules` -> `schedules`

Dabei entsteht eine Info-Diagnostic mit Code:

```text
rmt.dsl.legacy_metadata_promoted
```

Das ist kein Fehler. Es macht nur sichtbar, dass ein Dokument noch auf dem Kompatibilitaetspfad liegt.

## Referenzaufloesung

Der Normalizer baut einen Reference Graph fuer:

- `adapters[*].id`
- `components[*].id`
- `routes[*].id`
- `schedules[*].id`
- `schedules[*].endpointName`
- `templates[*].id`
- `templates[*].qualifiedId`

Diese Referenzen werden statisch geprueft:

- `components[*].adapter` -> `adapters[*].id`
- `components[*].schedule` -> `schedules[*].id` oder `schedules[*].endpointName`
- `routes[*].router` -> `adapters[*].id`
- `routes[*].component` -> `components[*].id`
- `routes[*].template` -> `templates[*].id` oder `templates[*].qualifiedId`
- `routes[*].schedule` -> `schedules[*].id` oder `schedules[*].endpointName`
- `templates[*].hydration.metadata.endpointHint` -> `schedules[*].id` oder `schedules[*].endpointName`

Fehlende Referenzen erzeugen Diagnostics, aber keinen Parser-Abbruch. Dadurch koennen Authoring Tools, Build-Gates und Runtime-Adapter sauber entscheiden, ob sie abbrechen, degradieren oder nur warnen.

## Diagnostic Codes

Die erste Diagnostic-Matrix umfasst:

- `rmt.dsl.legacy_metadata_promoted`
- `rmt.dsl.reference.missing_adapter`
- `rmt.dsl.reference.missing_component`
- `rmt.dsl.reference.missing_template`
- `rmt.dsl.reference.missing_schedule`

Diese Codes sind in `xtendrmt/rmt.schema.json`, `xtendrmt/rmt-core.d.ts` und der RMT-Kompatibilitaetssuite verankert.

## Artefakt-Surfaces

Die Build-Artefaktversionen wurden additiv synchronisiert:

- `createRmtFormat().normalizeDocument`
- `createRmtFormat().parseDocument`
- `createRmtFormat().serializeDocument`
- `createRmtFormat().normalizeDslDomains`
- `createRmtFormat().listDslDiagnosticCodes`
- `RmtRmtDocument.normalization`
- `RmtRmtDocument.diagnostics`

`serializeDocument` schreibt native Domains nur dann aus, wenn sie vorhanden sind. Diagnostics und Normalization Summary werden nur mit expliziten Optionen serialisiert:

```js
format.serializeDocument(document, {
  includeDiagnostics: true,
  includeNormalization: true
});
```

## Fixtures

`WP-08` fuehrt drei RMT-Fixtures ein:

- `tests/fixtures/rmt-template-only.legacy.rmt`
- `tests/fixtures/rmt-app-dsl.normalized.rmt`
- `tests/fixtures/rmt-app-dsl.missing-refs.rmt`

Sie pruefen Rueckwaertskompatibilitaet, native App-DSL-Normalisierung und Missing-Reference-Diagnostics.

## Kernel Boundary

Der RMT Kernel darf:

- Dokumente parsen und normalisieren
- native Domains sichtbar machen
- Reference Graphs und Diagnostics erzeugen
- Template-only-Kompatibilitaet ausweisen

Der RMT Kernel darf nicht:

- Adapter ausfuehren
- XRouter registrieren oder navigieren
- XTend Components mounten oder hydrieren
- DOM schreiben
- `xstate` aktualisieren
- fehlende Referenzen durch XTend-spezifische Fallbacks erraten

## Handoff an Folgepakete

- `WP-09` kann Route Registry und Component Registry auf `normalizeDocument(...).routes` und `normalizeDocument(...).components` aufbauen.
- `WP-10` kann XRouter Adapter gegen normalisierte Route Records implementieren.
- `WP-11` kann XTend Component Adapter gegen normalisierte Component Records implementieren.
- `WP-13` muss die Artefakt-Paritaet fuer die synchronisierten Normalizer-Surfaces absichern.
- `WP-14` kann die Bestcase-Demo von `manifest.metadata` auf native Domains migrieren.

## Verifikation

Mindestgates:

```bash
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```

Die RMT-Kompatibilitaetssuite prueft jetzt auch den Normalizer selbst ueber die Build-Artefaktversion in `xtendrmt/rmt-core.esm.js`.

## Ergebnis

`WP-08` ist abgeschlossen. RMT-Dokumente haben eine stabile Normalform fuer Template-only-, native App-DSL- und Legacy-Metadata-Eingaben. Fehlende Referenzen werden diagnostiziert, ohne die Framework-Agnostik des Kernels zu verletzen.

`WP-09` kann nun Route Registry und Component Registry im RMT Runtime-Modell vorbereiten.
