# RMT vNext Authoring Guide

- Contract: `xtend.rmt.vnext-release-handoff.v1`
- Syntax Contract: `xtend.rmt.vnext.grammar.v1`
- Core Output: `xtend.rmt.core-format.vnext.v1`

RMT vNext ist die menschenfreundliche Syntax fuer XTend Apps. Du kannst eine
vollstaendige UI-Shell in RMT schreiben: State, Selectors, DataSources,
Actions, Events, Portals, Overlays, Resources, Surfaces und Fabric-Lanes
liegen in einer `.rmt` Quelle und werden deterministisch in Core- und
Kernel-Records kompiliert.

## Grundform

```rmt
template media.manager {
  state selectedItem type object initial null

  selector visibleItems from datasource library {
    output card-list
  }

  datasource library from fixture records.media-items {
    contract "media.item.v1[]"
  }

  action select-item {
    input id string
    reduce state.selectedItem = input.id
    emit media.item.selected with action select-item
  }

  portal app root "#app-root" layer surface

  surface library kind workspace component x-cards {
    repeat from selector visibleItems
    key item.id
    portal app

    lane visible weight 80 {
      hydrate x-cards from selector visibleItems
    }

    on card-click target item -> action select-item {
      payload id from item.id
    }
  }
}
```

Die wichtigsten Bausteine:

| Syntax | Zweck |
| --- | --- |
| `template` | gruppiert eine App- oder Dokument-Shell |
| `state` | beschreibt persistenten oder transienten App-Zustand |
| `selector` | leitet UI-nahe Views aus State oder DataSources ab |
| `datasource` | bindet Fixture-, Endpoint-, SSE- oder Worker-Quellen an |
| `action` | beschreibt User- und Systemaktionen mit Reducern und Effects |
| `on ... -> action ...` | routet DOM- oder Custom-Events in Actions |
| `portal` | benennt Mount-Ziele fuer Surfaces und Overlays |
| `surface` | beschreibt sichtbare UI-Objekte, Listen, Panels oder Pages |
| `overlay` | beschreibt Toasts, Dialoge, Menues, Popovers und Lightboxes |
| `resource` | beschreibt Besitz, Import, Stream, Timer und Cleanup |
| `lane` | steuert Prioritaet, Scheduling und Backpressure |
| `mount`, `hydrate`, `prewarm`, `dispose` | Lifecycle-Operationen |
| `when` | deklarative Conditions ohne Funktionsaufrufe oder Eval |
| `slot` | Composition innerhalb einer Operation |
| `trust boundary` und `sanitize` | Security-Policy fuer unsichere Daten |
| `stream` | inkrementelle Streaming-Operation |

## App Shell nur in RMT

Eine vNext-App soll nicht zwischen RMT, App-Platform-JSON und Host-Code
zerfallen. RMT ist der Authoring-Ort fuer:

- Route- und Shell-Struktur
- sichtbare Surfaces und Overlay-Portale
- State- und Selector-Modell
- Actions, Effects und Event-Payloads
- Resource Ownership und Cleanup
- Fabric-Lanes fuer sichtbare, user-blocking, transition, idle,
  background- und diagnostics-Arbeit

Der Host stellt Komponenten, Router, Browser-APIs und externe Daten bereit.
Diese Grenze haelt den Kernel framework-neutral und macht die App trotzdem
vollstaendig beschreibbar.

## Editor-DX

Der Language Server erkennt vNext-Primitives direkt:

- Completions fuer Primitive-Keywords und klauselnahe Vorschlaege
- Hover mit Core Pointer und Primitive-Informationen
- Document Symbols fuer `states`, `selectors`, `actions`, `surfaces`,
  `portals`, `overlays` und `resources`
- Code Actions fuer sichere Reparaturen
- Safe Fix-All fuer `source.fixAll.rmt.vnext.primitives`
- manuelle Uebergaben fuer Kernel-/Host-Boundaries

Das Snippet `rmt-vnext-primitive-shell` erzeugt eine kleine App Shell mit
State, Selector, Action, Portal, Surface, Lane und Event-Payload-Contract.

## Migration aus Legacy-Records

Legacy- und App-Platform-JSON bleiben lesbar, sind aber nicht der normale
Authoring-Pfad. Fuer vorhandene App-Platform-Primitive-Records gibt es:

- `createAppPlatformPrimitiveMigrationPreview(...)` fuer einen vNext-Draft
- `createAppPlatformPrimitiveMigrationApplyPlan(...)` fuer einen manuellen
  Apply-Plan ohne automatisches Schreiben
- `report-only`, `preview-ready`, `apply-plan-ready` und `blocked` als
  klare Statuswerte

Details stehen in [RMT vNext Primitive Migration](./rmt-vnext-primitive-migration.md).

## Reference Demo

Die vollstaendige Referenz liegt in `xtendrmt/rmt-vnext-reference-demo.rmt`.
Sie deckt Templates, Surfaces, gewichtete Lanes, Conditions, Slots, Events,
Endpoint/SSE/Worker Sources, Security Policies und Streaming ab.

Der stabile Compiler-Output liegt in
`xtendrmt/rmt-vnext-reference-demo.core.json`. Wenn Syntax oder Compiler
absichtlich geaendert werden, muessen Quelle und Core-Output gemeinsam
aktualisiert werden.

## Lokal pruefen

```bash
node scripts/run_xtend_tests.js rmt-vnext-parser rmt-vnext-compiler rmt-vnext-tooling --json
node scripts/run_xtend_tests.js rmt-vnext-compatibility --json
node scripts/run_xtend_tests.js rmt-vnext-release --json
```

Fuer App-Shell-Arbeit reichen normalerweise Parser, Compiler, Tooling und
Compatibility. Release-Gates pruefen zusaetzlich Referenzdemo, Core-Output,
Migration und Referenzpfade.

## Grenzen

- RMT vNext fuehrt keine Host-Runtime im Kernel aus.
- Conditions sind deklarativ und erlauben keine Funktionsaufrufe.
- Imports sind statisch und bleiben package-root-gebunden.
- Legacy JSON bleibt kompatibel, aber nicht der bevorzugte Authoring-Pfad.
- XTend-, XRouter-, DOM- und Browser-Details gehoeren in Adapter.
