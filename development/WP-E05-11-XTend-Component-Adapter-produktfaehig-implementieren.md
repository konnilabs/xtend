# WP-E05-11 - XTend Component Adapter produktfaehig implementieren

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
- Backlog: `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
- Bezug:
  - `development/WP-E05-05-Native-Components-Domain-im-RMT-Schema-entwerfen.md`
  - `development/WP-E05-09-Route-Registry-und-Component-Registry-vorbereiten.md`
  - `development/WP-E05-10-XRouter-Adapter-produktfaehig-implementieren.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-core.d.ts`
  - `xtendrmt/rmt-core.esm.js`
  - `xtendrmt/rmt-runtime.esm.js`
  - `xtendrmt/rmt-runtime.browser.js`
  - `components/manifest.json`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-11` macht XTend UI zum ersten produktiven Component Adapter fuer native RMT Components.

Die Component-Domain bleibt generisch. Der Adapter konsumiert `componentRegistry` aus `xtend.rmt.runtime-registry.v1`, mappt daraus XTend-kompatible Component Records und kann diese an ein Host-Ziel mounten oder hydrieren. Der RMT Kernel laedt keine XTend-Komponenten, liest kein XTend Manifest, erzeugt keine Custom Elements selbst und schreibt nicht nach `xstate`.

## Adapter Contract

Der Contract traegt die stabile ID:

```text
xtend.rmt.xtend-component-adapter.v1
```

Der offizielle Adapter Record bleibt:

```text
xtend.component
```

Eingabe ist die Runtime Registry aus:

```text
xtend.rmt.runtime-registry.v1
```

## Runtime Surface

Der Adapter stellt folgende Operationen bereit:

- `registerComponent`
- `mountComponent`
- `hydrateComponent`
- `emitDiagnostic`

Die Build-Artefaktversionen exportieren:

- `createRmtXtendComponentAdapter`
- `createRenderManXtendComponentAdapter`
- `RmtXtendComponentAdapter`
- `RmtXtendMappedComponent`
- `RmtXtendComponentMapping`

## Component Mapping

Der Adapter liest `componentRegistry.byAdapter["xtend.component"]` und mappt `RmtComponentRegistryEntry` auf XTend-kompatible Records.

Gemappte Felder:

- `id`
- `kind`
- `adapter`
- `tag`
- `props`
- `attributes`
- `slots`
- `events`
- `hydration`
- `scheduleRef`
- `metadata`

Fuer DOM-nahe Host-Ziele erzeugt der Adapter Attribute wie:

- `data-rmt-component-id`
- `data-rmt-component-adapter`
- `data-rmt-schedule`

Deklarierte Component-Attribute werden serialisiert und auf das Custom Element geschrieben. Properties bleiben Properties und koennen durch ein Mount-/Hydration-Model ueberschrieben werden.

## Manifest Lookup

Manifest Lookup ist Adapter-Arbeit:

- `manifest[tag]`
- `manifest[id]`
- `manifestRef`
- `import`, `importUrl` oder `moduleRef`

Fehlt ein Manifest-Eintrag, bleibt der Record trotzdem mountbar, wenn das Custom Element bereits registriert ist. Der Adapter meldet dann `rmt.xtend.component.manifest.missing` als Info-Diagnostic. Ist das Custom Element nicht registriert, meldet der Adapter `rmt.xtend.component.custom_element.unregistered`.

## Mount und Hydration

`mountComponent(target, componentRef, model, options)`:

- loest `componentRef` gegen Mapping oder Component Record auf
- erstellt das deklarierte Custom Element im Host-Dokument
- schreibt Attribute, RMT-Marker und Properties
- fuegt einfache Slot-Inhalte oder Template-Platzhalter ein
- bindet deklarierte Event Bridges an Host Callbacks
- haengt das Element an das Ziel an

`hydrateComponent(target, componentRef, model, options)`:

- sucht ein bestehendes Element ueber `data-rmt-component-id` oder Tag
- wendet Attribute und Properties erneut an
- bindet Events erneut an
- ruft optional `element.hydrate(model, context)` auf
- markiert das Element mit `data-xtend-hydrated="true"`

Der Adapter fuehrt keine RMT Scheduler-Arbeit selbst aus. `scheduleRef` wird erhalten und kann ab `WP-12` fuer Scheduler- und Diagnostics-Bridges genutzt werden.

## Event Bridge

Event Records bleiben deklarativ:

```json
{
  "section-ready": {
    "commandName": "dashboard.section.ready"
  }
}
```

Der Adapter entscheidet, ob ein DOM Event Listener registriert wird und ob `dispatchCommand`, `onEvent` oder eine spaetere State Bridge genutzt wird. Der Kernel sieht nur Adapter Results und Diagnostics.

## Diagnostics

Die erste Diagnostic-Matrix umfasst:

- `rmt.xtend.component.missing_tag`
- `rmt.xtend.component.target.missing`
- `rmt.xtend.component.manifest.missing`
- `rmt.xtend.component.custom_element.unregistered`
- `rmt.xtend.component.mount.skipped`
- `rmt.xtend.component.hydration.skipped`

## Kernel Boundary

Der RMT Kernel darf:

- `xtend.component` als Adapter-ID sehen
- `registerComponent`, `mountComponent`, `hydrateComponent` und `emitDiagnostic` als Adapter-Operationen modellieren
- Runtime Registry Snapshots an den Adapter uebergeben
- Diagnostics und Operation Results auswerten

Der RMT Kernel darf nicht:

- XTend-Komponenten importieren
- `components/manifest.json` lesen
- Custom Elements registrieren oder erzeugen
- DOM-Ziele mounten oder hydrieren
- `xstate` direkt fuer Component-Status setzen
- XTend als einzige Component-Implementierung erzwingen

## Handoff an Folgepakete

- `WP-12` kann State-, Scheduler- und Diagnostics Bridge ueber `scheduleRef`, Adapter Results und Component Events anbinden.
- `WP-14` kann die Bestcase-Demo auf native `components` migrieren und Demo-eigene Component-Mapping-Logik entfernen.
- `WP-15` kann Contract-, Schema- und Runtime-Tests fuer den gemeinsamen XRouter-/XTend-Bridge-Fluss erweitern.
- `WP-16` kann browsernahe Smokes fuer RMT Scheduler, XRouter und XTend Components aufsetzen.

## Verifikation

Mindestgates:

```bash
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```

Die RMT-Kompatibilitaetssuite prueft den Adapter ueber die Build-Artefaktversion in `xtendrmt/rmt-core.esm.js` und ein Fake-DOM-Ziel.

## Ergebnis

`WP-11` ist abgeschlossen. Native RMT Components koennen ueber `xtend.component` in XTend-kompatible Component Records gemappt, an ein Host-Ziel gemountet und hydriert werden. XTend bleibt Adapter, nicht Kernelwissen.
