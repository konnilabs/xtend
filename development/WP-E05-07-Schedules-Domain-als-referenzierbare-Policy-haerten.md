# WP-E05-07 - `schedules` Domain als referenzierbare Policy haerten

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
- Backlog: `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
- Bezug:
  - `development/WP-E05-04-Native-Adapters-Domain-im-RMT-Schema-entwerfen.md`
  - `development/WP-E05-05-Native-Components-Domain-im-RMT-Schema-entwerfen.md`
  - `development/WP-E05-06-Native-Routes-Domain-im-RMT-Schema-entwerfen.md`
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-core.d.ts`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-07` haertet Scheduling als eigenstaendige, referenzierbare RMT Policy-Domain. Routes, Components, Templates und Diagnostics duerfen Scheduling nicht als verstreute private Optionsbloecke duplizieren. Stattdessen koennen sie stabile Schedule Policies referenzieren und bei Bedarf weiterhin kompakte Inline-Hints fuer Rueckwaertskompatibilitaet verwenden.

Damit bleibt XTendRMT framework-agnostisch:

- der RMT Kernel kennt Schedule Policies, Lanes, Prioritaeten und Budgets
- XTend, XRouter, React, Vue, Vanilla JS oder Custom Hosts fuehren konkrete Arbeit ueber Adapter oder Scheduler Endpoints aus
- sichtbare, idle, Hintergrund- und Diagnostics-Arbeit sind deklarativ unterscheidbar
- alte Template-only-`.rmt` Dokumente ohne `schedules` bleiben gueltig

## Native Domain Shape

Die native App-DSL erhaelt additiv eine optionale Top-Level-Domain:

```json
{
  "adapters": [],
  "components": [],
  "routes": [],
  "schedules": [],
  "templates": []
}
```

`schedules` ist eine deklarative Policy-Domain. Ein Schedule Record besitzt mindestens:

- `id`: stabile Policy-ID fuer Referenzen
- `endpointName`: host-neutraler Scheduler Endpoint
- `scope`: fachlicher Scope fuer Coalescing, Diagnostics und Budgetierung

Optionale Felder sind:

- `lane`: `visible`, `idle`, `background`, `diagnostics`, `user-blocking` oder `transition`
- `priority`: numerische Prioritaet fuer Scheduler- und Adapterentscheidungen
- `deadlineMs`: gewuenschtes Ausfuehrungsfenster
- `preferIdle`: Hinweis, ob Idle-Zeit bevorzugt wird
- `coalesceKey`: Schluessel, um gleichartige Arbeit zusammenzufassen
- `budgetClass`: `interactive`, `background`, `diagnostics`, `critical` oder `best_effort`
- `maxRetries`: optionale Retry-Grenze fuer Adapter/Scheduler
- `timeoutMs`: optionaler Timeout fuer geplante Arbeit
- `diagnostics`: optionale deklarative Diagnostics-Hinweise
- `metadata`: host- oder produktbezogene Zusatzdaten

## Schedule Policy Contract

Eine Schedule Policy beschreibt, wann und unter welchem Budget Arbeit eingeplant werden soll. Sie beschreibt nicht, wie XTend-Komponenten, XRouter-Routen oder andere Host-Elemente technisch ausgefuehrt werden.

Erlaubt im RMT Kernel:

- Schedule Records parsen und normalisieren
- `id`, `endpointName`, `scope`, `lane`, `priority`, `deadlineMs`, `preferIdle`, `coalesceKey` und `budgetClass` vergleichen
- Referenzen aus `routes`, `components`, Templates und Diagnostics aufloesen
- Diagnostics fuer fehlende Policies oder unpassende Lanes vorbereiten
- endpoint-basierte Arbeit an Adapter oder Scheduler Bridges uebergeben

Nicht erlaubt im RMT Kernel:

- XTend, XRouter, `xstate`, React, Vue oder andere Host-Runtimes importieren
- DOM-Knoten erzeugen, hydrieren oder registrieren
- konkrete Router-Navigation oder Component-Mounts ausfuehren
- Schedule Policies in XTend-spezifische Optionsobjekte umschreiben
- versteckte private Scheduling-Bloecke pro Domain erzwingen

## Referenzregeln

Diese Felder duerfen eine Schedule Policy per String-ID referenzieren oder einen kompakten Inline-Hint tragen:

- `routes[*].schedule`
- `components[*].schedule`
- `templates[*].hydration.metadata.endpointHint`
- spaetere Diagnostics- und Action-Records

String-Referenzen sind der bevorzugte Pfad fuer produktive App-DSL-Dokumente. Inline-Hints bleiben fuer Template-only-Dokumente, bestehende Demo-Metadaten und schrittweise Migration erlaubt.

## Beispiele

### Route Visible Render

```json
{
  "id": "route.visible.render",
  "endpointName": "xtendrmt.route.render",
  "scope": "xtendrmt.router.current",
  "lane": "visible",
  "priority": 88,
  "deadlineMs": 120,
  "preferIdle": false,
  "coalesceKey": "route.current",
  "budgetClass": "interactive"
}
```

### Component Idle Hydrate

```json
{
  "id": "component.idle.hydrate",
  "endpointName": "xtendrmt.component.hydrate",
  "scope": "xtendrmt.component.idle",
  "lane": "idle",
  "priority": 42,
  "deadlineMs": 420,
  "preferIdle": true,
  "coalesceKey": "component.hydrate",
  "budgetClass": "background"
}
```

### Diagnostics Snapshot

```json
{
  "id": "diagnostics.snapshot",
  "endpointName": "xtendrmt.diagnostics.snapshot",
  "scope": "xtendrmt.diagnostics",
  "lane": "diagnostics",
  "priority": 34,
  "deadlineMs": 260,
  "preferIdle": true,
  "coalesceKey": "diagnostics.snapshot",
  "budgetClass": "diagnostics"
}
```

## Schema-Entscheidung

`xtendrmt/rmt.schema.json` fuehrt `xtend.rmt.schedules-domain.v1` als native Domain Contract ein.

Die Schema-Flaeche umfasst:

- Top-Level-Property `schedules`
- `$defs.schedule`
- `$defs.schedules`
- `$defs.scheduleLane`
- `$defs.scheduleBudgetClass`
- `$defs.scheduleInline`
- `$defs.scheduleRefOrInline`
- bestehender `componentSchedule` Alias auf `scheduleRefOrInline`

Die Alias-Strategie ist bewusst konservativ: `routes[*].schedule` und `components[*].schedule` behalten ihre bisherige Form, bekommen aber eine engere, wiederverwendbare Schedule-Definition. Damit kann `WP-08` Referenzen normalisieren, ohne bestehende Beispiele oder Template-only-Dokumente zu brechen.

## Typ-Entscheidung

`xtendrmt/rmt-core.d.ts` ergaenzt:

- `RmtScheduleLane`
- `RmtScheduleBudgetClass`
- `RmtScheduleDomainRecord`
- `schedules?: RmtScheduleDomainRecord[]` auf `RmtRmtDocument`
- Schedule-spezifische Felder auf `RmtNativeDomainContract`

Das Typ-Artefakt bleibt synchronisierte Regression-Referenz. Die upstream Source-of-Truth muss spaeter daraus wieder reproduzierbare Artefakte erzeugen.

## Backward Compatibility

Dokumente ohne `schedules` bleiben gueltig, weil die Domain optional ist und nicht in `required` aufgenommen wird.

Bestehende Schedule-Hints in `manifest.metadata.schedules`, `routes[*].schedule`, `components[*].schedule` oder Template-Hydration-Metadaten bleiben als Pilot- und Migrationsform erlaubt. Die produktive Normalisierung in `WP-08` kann sie auf native `schedules[*].id` mappen.

## Handoff an Folgepakete

- `WP-08` kann alte und neue `.rmt` Dokumente normalisieren und Schedule-Refs referenziell pruefen.
- `WP-09` kann Route Registry und Component Registry gegen normalisierte Schedule Policies vorbereiten.
- `WP-12` kann Scheduler-, State- und Diagnostics Bridge auf endpoint-basierte Policies setzen.
- `WP-14` kann die Bestcase-Demo auf native `schedules`, `routes` und `components` migrieren.

## Verifikation

Mindestgates:

```bash
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```

Die Gates pruefen die statische Contract-Synchronisierung zwischen Workpackage-Dokument, Schema, Typ-Artefakt, Referenzregistry und RMT-Kompatibilitaetssuite.

## Ergebnis

`WP-07` fuehrt `schedules` als optionale native Policy-Domain ein. Scheduling bleibt eigenstaendig, referenzierbar und host-neutral. Sichtbare, idle, Hintergrund- und Diagnostics-Arbeit sind unterscheidbar, ohne XTend oder XRouter in den RMT Kernel einzubetten.

`WP-08` kann nun die DSL-Normalisierung und Rueckwaertskompatibilitaet fuer alte und neue `.rmt` Dokumente starten.
