# XTend-Scaffold Extension Points

- Status: Verbindlicher Scaffold-Contract ab Epic 03 / WP-11
- Datum: 4. Mai 2026
- Bezug:
  - `development/EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `xtend-builder/extensions/component-extension-points.js`
  - `xtend-builder/scaffold.config.js`

## Zweck

Dieses Dokument definiert die Extension-Punkte, die `XTend-Scaffold` fuer spaetere Templating-, Rendering- und Root-Lifecycle-Arbeit bereitstellt. Der Contract ist absichtlich vorbereitend: Er macht Hook-Namen, Adapterpunkte, Manifest-Metadaten und Grenzen sichtbar, ohne eine Runtime-Entscheidung aus Epic 04 oder eine produktive XTendRMT Bridge aus Epic 05 vorwegzunehmen.

## Contract-Schemas

| Bereich | Schema | Zweck |
|---------|--------|-------|
| Component Extension Points | `xtend.scaffold.component-extension-points.v1` | Gesamtcontract fuer scaffolded Komponenten |
| Root Lifecycle | `xtend.scaffold.root-lifecycle.v1` | Hook-Sequenz oberhalb des Hydration-Mindestcontracts |
| Root Scheduler Handshake | `xtend.rmt.root-handshake.v1` | RMT plant Root-Phasen ueber Endpoint-Hints, XTend Host Adapter fuehrt aus |
| Host Capabilities | `xtend.rmt.host-capabilities.v1` | RMT verhandelt XTend Host-Faehigkeiten als Adapterdaten |
| RMT Compatibility Binding | `xtend.scaffold.rmt-compatibility-binding.v1` | Typing, Manifest, Preview und Extensions werden als gemeinsamer Dry-Run-Contract verbunden |
| Template Extension | `xtend.scaffold.template-extension.v1` | Adapterbasierter Template-Anschluss |
| Rendering Extension | `xtend.scaffold.rendering-extension.v1` | Rendering-Hints fuer Root-Aktivierung und Schedule Policies |

## Root-Lifecycle-Hooks

Scaffolded Komponenten duerfen ab WP-11 folgende No-op-Hooks enthalten:

| Hook | Phase | Regel |
|------|-------|-------|
| `beforeHydrate` | pre-hydration | darf abgeleitete lokale Daten vorbereiten |
| `afterHydrate` | post-hydration | darf Diagnostics oder Adapter-Signale melden |
| `beforeRender` | pre-render | darf Render-Eingaben normalisieren |
| `afterRender` | post-render | darf sichtbare Aktivierung oder Measurements vorbereiten |
| `onDisconnect` | disconnect-cleanup | darf lokale Subscriptions und Adapterbindungen loesen |

Die Hooks sind bewusst leer. Sie duerfen keine zweite Source of Truth erzeugen und keine RMT Schedules ausfuehren.

## Root-Lifecycle- und Scheduler-Handschlag

Ab Epic 04 / `WP-E04-05` beschreibt der Extension-Contract zusaetzlich den Root-Handschlag `xtend.rmt.root-handshake.v1`.

| Phase | Schedule-Hint | Endpoint-Hint | Besitzer |
|-------|---------------|---------------|----------|
| `create` | `component.visible.mount` | `xtendrmt.root.create` | XTend Host Adapter |
| `mount` | `component.visible.mount` | `xtendrmt.component.mount` | XTend Host Adapter |
| `hydrate` | `component.idle.hydrate` | `xtendrmt.component.hydrate` | XTend Host Adapter |
| `activate` | `route.visible.render` oder `component.visible.mount` | `xtendrmt.route.render` oder `xtendrmt.component.activate` | XTend Host Adapter |
| `update` | aktuelle Schedule Policy | `xtendrmt.component.update` | XTend Host Adapter |
| `unmount` | `component.visible.mount` | `xtendrmt.component.unmount` | XTend Host Adapter |
| `diagnostics` | `diagnostics.snapshot` | `xtendrmt.diagnostics.snapshot` | XTend Host Adapter |

Der RMT Scheduler besitzt Schedule-Auswahl, Lane, Prioritaet, Budget und Coalescing. Der XTend Host Adapter besitzt Root-Aufloesung, Custom-Element-Lifecycle, Template-Materialisierung, State-Bridge, Cleanup und Diagnostics. Der RMT Kernel darf weder Custom-Element-Callbacks ausfuehren noch `xstate` direkt mutieren.

## XTend Host Capabilities

Ab Epic 04 / `WP-E04-06` beschreibt der Extension-Contract zusaetzlich `xtend.rmt.host-capabilities.v1`. Der Contract ist keine Runtime-Bridge, sondern eine Capability-Matrix fuer Host Adapter.

| Capability | Pflicht | Besitzer | Grenze |
|------------|---------|----------|--------|
| `manifest` | ja | XTend Host Adapter | Manifest Lookup bleibt Host-Arbeit |
| `customElements` | ja | XTend Host Adapter | RMT ruft keine Custom-Element-Callbacks auf |
| `stateBridge` | ja | XTend Host Adapter / `xstate` | RMT mutiert keine `xstate` Keys direkt |
| `hydration` | ja | XTend Host Adapter | Hydration bleibt Custom-Element-Lifecycle |
| `schedulerEndpoints` | ja | RMT Scheduler plant, Host Adapter fuehrt aus | Endpoints sind Hints, keine Kernel-Imports |
| `theme` | optional | XTend Host Adapter | Theme API bleibt `window.XTend.theme` / Host-Fassade |
| `api` | optional | XTend Host Adapter | RMT ruft keine `window.XTend` APIs direkt |
| `router` | optional | XTend Host Adapter / spaeter Epic 05 | XRouter bleibt Adapter-Implementierung |
| `diagnostics` | optional | XTend Host Adapter | Snapshots ersetzen keine UI-Wahrheit |

RMT-Dokumente duerfen Capabilities per ID oder Version anfordern. Fehlt eine Pflichtfaehigkeit, muss der Host Adapter diagnostisch abbrechen, bevor sichtbare UI gemountet wird. Fehlt eine optionale Faehigkeit, darf der Adapter degradieren oder den Pfad ueberspringen und Diagnostics melden.

## RMT-Kompatibilitaets-Binding

Ab Epic 04 / `WP-E04-07` verbindet `xtend.scaffold.rmt-compatibility-binding.v1` die bisherigen Einzelcontracts zu einem pruefbaren Dry-Run-Contract.

| Surface | Muss enthalten | Grenze |
|---------|----------------|--------|
| `typing` | RMT Attachment, Host Capabilities, Compatibility Binding | `.d.ts` bleibt types-only |
| `manifest-plan` | Typing-, Preview-, Extension- und RMT-Kompatibilitaetsmetadaten | keine produktiven Manifest-Writes |
| `preview-plan` | lokale Referenz, RMT Attachment, Compatibility Binding | keine Browser-Automation und kein Netzwerk |
| `extension-points` | Template Authoring, Scheduler Handshake, Host Capabilities, Compatibility Binding | keine Runtime-Imports und keine Route-Registrierung |
| `component-files` | alle Dry-Run-Oberflaechen im gemeinsamen Output | keine Bridge-Runtime |

Das Binding macht sichtbar, welche Contracts fuer RMT-Kompatibilitaet zusammen gehoeren: `xtend.rmt.component-contract.v1`, `xtend.rmt.template-authoring.v1`, `xtend.rmt.root-handshake.v1` und `xtend.rmt.host-capabilities.v1`. Es darf keine `.rmt` Dateien parsen und keine XTendRMT Bridge implementieren.

## Template- und Rendering-Anschluss

Der Template-Anschluss bleibt adapterbasiert:

- Template-Adapter: `xtend.template`
- Template-Referenz: `<domain>.template`
- Slot-Binding: named slot zu Template-Ref
- Datenbindung: explizite Props und Slots
- Grenze: `no-template-runtime-in-scaffold`

Der Rendering-Anschluss bleibt ein Hint:

- Rendering-Modus: `custom-element-render-method`
- Render-Ziel: `shadowRoot`
- Aktivierung: `visible-ui-after-hydration`
- Schedule-Hint: `component.visible.mount` oder `route.visible.render`
- Grenze: keine Ausfuehrung von RMT Scheduler Jobs im Scaffold

## XTendRMT Bridge-Punkte

Der Extension-Contract uebernimmt die Adapterlinie aus dem Typing-Contract:

- Component Adapter: `xtend.component`
- Router Adapter: `xtend.xrouter`
- Kernel-Grenze: RMT Kernel darf keine XTend-Komponententypen importieren
- Bridge-Epic: `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`

Damit werden XTend-Komponenten und XRouter als First-Class Anschlussziele vorbereitet, ohne RMT an XTend zu koppeln.

## Scaffold-Grenzen

Nicht erlaubt in WP-11:

- Runtime-Imports in scaffolded Komponenten
- produktive Schreiblogik
- `.rmt` Parsing im Scaffold
- Route-Registrierung in scaffolded Komponenten
- RMT Kernel Coupling
- Ausfuehrung von Rendering- oder Scheduler-Runtime

Diese Grenzen schuetzen `XTend-Scaffold` vor Technical Debt und halten Epic 04 und Epic 05 entscheidungsfaehig.

## Lokale Verifikation

```bash
node xtend-builder/scaffold.js extensions --tag x-example --profile display --feature state --json
node xtend-builder/scaffold.js component-files --tag x-example --profile routing --feature state --json
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```
