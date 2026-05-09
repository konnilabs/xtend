# XTend Fiber und Lane Contract

- Status: Accepted
- Datum: 5. Mai 2026
- Contract: `xtend.fabric.fiber-lane-contract.v1`
- Fiber Contract: `xtend.fabric.fiber.v1`
- Lane Contract: `xtend.fabric.lane.v1`
- Roadmap-Paket: `ER-WP-12`
- Bezug:
  - `development/ROADMAP-XTend-Enterprise-Reife.md`
  - `development/XTend-Enterprise-Reife-Implementierungsplan.md`
  - `development/ADR-XTend-Fabric.md`
  - `development/WP-E05-07-Schedules-Domain-als-referenzierbare-Policy-haerten.md`
  - `development/WP-E05-12-State-Scheduler-und-Diagnostics-Bridge-anbinden.md`

## Zweck

Dieser Contract definiert, wie XTend UI-Arbeit in `XTend-Fabric` als messbare, diagnostizierbare und spaeter schedulable Einheit beschrieben wird.

Die Begriffe sind bewusst host-nah:

- `Fiber` beschreibt eine konkrete Einheit von UI-Arbeit.
- `Lane` beschreibt die fachliche Prioritaets- und Budgetklasse dieser Arbeit.
- RMT Schedule Policies bleiben eigenstaendige Kernel-/Adapterdaten und werden erst in `ER-WP-13` konkret gemappt.

## Nicht-Ziele

Dieser Contract definiert nicht:

- eine eigene JavaScript-Coroutine oder einen Thread
- eine neue RMT Scheduler-Implementierung
- konkrete RMT Schedule Records
- Runtime-Instrumentierung in Komponenten
- Performance Budget Grenzwerte fuer Component-Profile
- externe Telemetry- oder Reporter-Backends

Diese Punkte gehoeren zu `ER-WP-08`, `ER-WP-13`, `ER-WP-14`, `ER-WP-15`, `ER-WP-16` und `ER-WP-17`.

## Fiber Definition

Eine Fiber ist eine nachvollziehbare Einheit von UI-Arbeit in XTend. Sie kann lokal durch Fabric ausgefuehrt, diagnostiziert, gemessen oder spaeter ueber eine RMT Schedule Policy delegiert werden.

Beispiele:

- Component Mount
- Component Hydration
- Component Render
- Event Handler
- Route Navigation
- Route Render
- Theme Apply
- API Call
- State Sync
- A11y Announcement
- Diagnostics Snapshot
- Loader Manifest Load

Der stabile Contract lautet:

```text
xtend.fabric.fiber.v1
```

### Mindestform

```json
{
  "schema": "xtend.fabric.fiber.v1",
  "id": "fiber.component.hydrate.x-alert.001",
  "kind": "component.hydrate",
  "lane": "visible",
  "phase": "hydrate",
  "status": "completed",
  "source": "component",
  "scope": "x-alert#primary-alert",
  "componentRef": "x-alert",
  "routeRef": "/alerts",
  "scheduleRef": "component.visible.hydrate",
  "correlationId": "route.alerts.2026-05-05T16:00:00.000Z",
  "budgetClass": "interactive",
  "startedAt": "2026-05-05T16:00:00.000Z",
  "durationMs": 12,
  "result": "ok",
  "diagnostics": []
}
```

### Fiber-Felder

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `schema` | ja | immer `xtend.fabric.fiber.v1` |
| `id` | ja | lokale stabile Fiber-ID |
| `kind` | ja | fachliche Art der UI-Arbeit |
| `lane` | ja | eine Lane aus `xtend.fabric.lane.v1` |
| `phase` | ja | aktuelle oder abgeschlossene Lifecycle-Phase |
| `status` | ja | `planned`, `queued`, `running`, `completed`, `failed`, `cancelled`, `deferred` oder `coalesced` |
| `source` | ja | `loader`, `component`, `router`, `api`, `state`, `theme`, `a11y`, `diagnostics`, `rmt`, `fabric` oder `app` |
| `scope` | ja | Coalescing- und Diagnostics-Scope |
| `componentRef` | nein | Custom Element Tag, Manifest-ID oder RMT Component Ref |
| `routeRef` | nein | Route-ID oder Pfad |
| `scheduleRef` | nein | optionale RMT Schedule Policy Referenz |
| `endpointNameHint` | nein | optionaler Scheduler Endpoint Hint fuer `ER-WP-13` |
| `fiberParentId` | nein | Parent-Fiber fuer zusammengesetzte Arbeit |
| `correlationId` | nein | route-, component-, request- oder user-action-nahe Korrelation |
| `budgetClass` | nein | Budgetklasse, kompatibel zu RMT Schedule Policies |
| `deadlineMs` | nein | gewuenschtes Zeitfenster fuer diese Arbeit |
| `preferIdle` | nein | Hinweis fuer idle-nahe Planung |
| `coalesceKey` | nein | Schluessel fuer gleichartige Arbeit |
| `startedAt` | nein | ISO-Zeitpunkt des Starts |
| `endedAt` | nein | ISO-Zeitpunkt des Abschlusses |
| `durationMs` | nein | Laufzeit in Millisekunden |
| `result` | nein | `ok`, `error`, `cancelled`, `deferred` oder `coalesced` |
| `diagnostics` | nein | Liste redigierter `xtend.fabric.diagnostic.v1` Events oder Event-Refs |
| `metadata` | nein | redigierte Zusatzdaten |

## Fiber Kind Vocabulary

Fabric muss mindestens diese `kind` Werte akzeptieren:

| Kind | Default-Lane | Beschreibung |
|------|--------------|--------------|
| `loader.manifest` | `user-blocking` | Manifest laden oder aufloesen |
| `loader.module` | `visible` | Komponente oder Core-Modul laden |
| `component.mount` | `visible` | Custom Element erzeugen oder registrieren |
| `component.hydrate` | `visible` | bestehendes Markup aktivieren |
| `component.render` | `visible` | sichtbaren DOM-Zustand erzeugen |
| `component.update` | `visible` | Attribute, Props oder State anwenden |
| `component.disconnect` | `background` | Cleanup und Listener entfernen |
| `event.handler` | `user-blocking` | User-Eingabe verarbeiten |
| `route.navigate` | `user-blocking` | Navigation starten oder synchronisieren |
| `route.render` | `transition` | Route-Inhalt rendern |
| `theme.apply` | `visible` | Theme Token oder Mode anwenden |
| `state.sync` | `user-blocking` | UI-relevanten State spiegeln |
| `api.call` | `user-blocking` | XTend API-Fassade ausfuehren |
| `a11y.announce` | `a11y` | Screenreader- oder Fokus-Signal erzeugen |
| `diagnostics.snapshot` | `diagnostics` | lokale Telemetry oder Diagnostics sammeln |
| `rmt.adapter-result` | `diagnostics` | RMT Adapter-/Bridge-Ergebnis konsumieren |

Neue `kind` Werte muessen namespaced sein und duerfen keine RMT-Kernel-Abhaengigkeit erzeugen.

## Lane Definition

Eine Lane beschreibt die fachliche Prioritaet, das Budget und die Scheduling-Absicht einer Fiber.

Der stabile Contract lautet:

```text
xtend.fabric.lane.v1
```

Fabric-Lanes sind UI-semantische Namen. Sie sind nicht zwingend identisch mit internen RMT Scheduler-Lanes oder Build-Artefaktnamen. Das konkrete Mapping bleibt `ER-WP-13`.

### Kanonische Lanes

| Lane | Prioritaet | Budgetklasse | Deadline-Ziel | Prefer Idle | Coalescing | Zweck |
|------|------------|--------------|---------------|-------------|------------|-------|
| `user-blocking` | 100 | `critical` | 80 ms | nein | nein | Eingabe, Fokus, Navigation, Dialog-Interaktion |
| `a11y` | 95 | `critical` | 80 ms | nein | nur stale Announcements | Screenreader, Fokusreparatur, ARIA-State |
| `visible` | 80 | `interactive` | 160 ms | nein | scope-basiert | sichtbarer Mount, Render, Hydration |
| `transition` | 65 | `interactive` | 240 ms | nein | route-/scope-basiert | Route- und UI-Uebergaenge |
| `idle` | 35 | `background` | 500 ms | ja | ja | nicht sichtbare Hydration, Prefetch, Follow-up |
| `background` | 25 | `best_effort` | 1000 ms | ja | ja | Cache, Preview, Docs-nahe Arbeit |
| `diagnostics` | 20 | `diagnostics` | 750 ms | ja | ja | Telemetry, Snapshots, Reporter-Vorbereitung |

### Lane Record

```json
{
  "schema": "xtend.fabric.lane.v1",
  "id": "visible",
  "priority": 80,
  "budgetClass": "interactive",
  "deadlineMs": 160,
  "preferIdle": false,
  "coalescePolicy": "scope",
  "allowedFiberKinds": ["component.mount", "component.hydrate", "component.render"]
}
```

### Lane-Regeln

- `user-blocking` darf nicht durch Diagnostics, Background- oder Idle-Arbeit blockiert werden.
- `a11y` ist keine niedrige Prioritaet. Fokusreparatur und Screenreader-Signale sind user-facing.
- `visible` darf nur dann coalesced werden, wenn der alte Workload sichtbar veraltet ist.
- `transition` darf route- oder scope-basiert coalesced werden.
- `idle`, `background` und `diagnostics` duerfen zusammengefasst, verschoben oder bei Backpressure spaeter ausgefuehrt werden.
- Lane-Entscheidungen muessen im Fiber-Record sichtbar bleiben.
- Jede Lane muss eine Budgetklasse und ein Deadline-Ziel tragen.

## Budget- und Diagnostics-Korrelation

Fiber- und Lane-Daten muessen mit Fabric Diagnostics korrelierbar sein.

Pflicht fuer Fehler- und Warn-Diagnostics:

- `fiberId`
- `lane`
- `source`
- `phase`
- `correlationId` oder `scope`
- `componentRef`, `routeRef` oder `scheduleRef`, sofern vorhanden

Der Diagnostic Contract bleibt:

```text
xtend.fabric.diagnostic.v1
```

## RMT-Vorbereitung

`ER-WP-12` legt nur die Fabric-Seite fest.

Erlaubt:

- Fiber `scheduleRef` auf bestehende oder spaetere RMT Schedule Policies setzen
- `endpointNameHint`, `budgetClass`, `deadlineMs`, `preferIdle` und `coalesceKey` fuer `ER-WP-13` vorbereiten
- RMT Adapter Results als `rmt.adapter-result` Fiber konsumieren
- Diagnostics aus `rmt.state-scheduler-diagnostics` mit `fiberId` oder `correlationId` verbinden

Nicht erlaubt:

- RMT Kernel importieren
- RMT Scheduler Policies in Fabric parsen oder validieren
- RMT-Lane-Namen als Fabric-Public-API erzwingen
- XTend als Pflicht-Host fuer RMT etablieren
- DOM-Arbeit im RMT Kernel ausfuehren

Die Kopplung bleibt:

```text
XTend UI Operation -> XTend-Fabric Fiber/Lane -> ER-WP-13 Mapping -> RMT Schedule Policy / Host Scheduler
```

## Default-Fallbacks

Wenn eine Fiber keine Lane mitbringt, muss Fabric spaeter deterministisch ableiten:

| Source/Kind | Fallback-Lane |
|-------------|---------------|
| `event.handler`, `route.navigate`, `api.call`, `state.sync` | `user-blocking` |
| `a11y.announce` | `a11y` |
| `component.mount`, `component.render`, `component.hydrate` | `visible` |
| `route.render` | `transition` |
| `component.disconnect` | `background` |
| `diagnostics.snapshot`, `rmt.adapter-result` | `diagnostics` |

Unbekannte Arbeit faellt auf `visible`, wenn sie DOM-nahe ist, sonst auf `background`.

## Handoff an Folgepakete

- `ER-WP-08` kann `runFiber` gegen diese Mindestform implementieren.
- `ER-WP-09` kann Lifecycle-Fehler mit `fiberId`, `lane`, `phase` und `componentRef` melden.
- `ER-WP-13` kann Fabric-Lanes auf konkrete RMT Schedule Policies mappen.
- `ER-WP-14` kann Mount/Hydration instrumentieren.
- `ER-WP-15` kann Route Render und XRouter Navigation instrumentieren.
- `ER-WP-16` fuehrt Telemetry Snapshots und Backpressure Signale auf Lane-Basis zusammen.

## Verifikation

Mindestgate fuer diesen Contract:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`xtend.fabric.fiber.v1` und `xtend.fabric.lane.v1` sind als Fabric-seitige Scheduling- und Telemetry-Grundlage akzeptiert. XTend UI-Arbeit ist damit als planbare, messbare und diagnostizierbare Einheit beschrieben. `ER-WP-13` kann das konkrete Mapping auf RMT Schedule Policies definieren.
