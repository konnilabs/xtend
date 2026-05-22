# RMT Native Shell Migration Gap

Stand: 2026-05-22  
Produkt: XTend Media Manager  
Vendor-Basis: `@ccslabs/xtend@0.1.0-rc.1` aus lokalem Upstream-Commit `b667d45b4743141c9742ae52af26e6f5d840d84e`

## Ergebnis

Die vorhandene App Shell kann mit dem aktuellen RMT App-Platform-Slice nicht 1:1 als reine RMT-Primitive umgesetzt werden, ohne weiterhin produktseitige VanillaJS-UI-Logik zu nutzen.

Nicht akzeptabel als Zielerfuellung waere, die bestehenden Template-Strings nur in JS-Descriptor-Fabriken oder einen produktlokalen ViewModel-Renderer zu verschieben. Das wuerde die UI/Shell weiterhin ausserhalb des RMT Stacks bauen und waere damit funktional derselbe Monkeypatch in neuer Verpackung.

Der aktuelle RMT-Stack kann eine grobe Shell deklarativ beschreiben und App-Platform-Runtime-Artefakte importieren. Fuer die bestehende Media-Manager-Shell fehlen jedoch Primitives fuer ViewModel-Transformationen, dynamische Surface-Materialisierung, Overlay-/Resource-Lifecycle, Event-Payload-Normalisierung und inkrementelles Rendern ohne `innerHTML`.

## Evidence

Der No-Manual-HTML-Gate aus dem neuen Vendor-Build meldet fuer `src/app/media-manager-shell.js` vier verbotene Sink-Kategorien:

```json
{
  "count": 4,
  "diagnostics": [
    { "sink": "root.innerHTML", "code": "rmt.dom.manual-html-sink", "severity": "error" },
    { "sink": "element.innerHTML", "code": "rmt.dom.manual-html-sink", "severity": "error" },
    { "sink": "template.innerHTML", "code": "rmt.dom.manual-html-sink", "severity": "error" },
    { "sink": "any.innerHTML", "code": "rmt.dom.manual-html-sink", "severity": "error" }
  ]
}
```

Konkrete Shell-Stellen:

| Bereich | Aktuelle Stelle | Befund |
| --- | --- | --- |
| Navigation/Stats | `src/app/media-manager-shell.js:806`, `src/app/media-manager-shell.js:816`, `src/app/media-manager-shell.js:1150` | Collections, Counts und Stats werden in HTML-Strings berechnet. |
| Explorer | `src/app/media-manager-shell.js:858`, `src/app/media-manager-shell.js:882` | Record Cards, Tags, Poster-Styles, Filter, Upload und Sortierung werden produktseitig gerendert. |
| Player | `src/app/media-manager-shell.js:1000`, `src/app/media-manager-shell.js:1009` | Player Placeholder, Image Preview, `x-player`-Attribute und Now-Playing UI entstehen als HTML-String. |
| Inspector | `src/app/media-manager-shell.js:1068`, `src/app/media-manager-shell.js:1087` | Metadata Rows, Diagnostics Readouts und Delete-State werden in JS formatiert. |
| Managed Surfaces | `src/app/media-manager-shell.js:1165`, `src/app/media-manager-shell.js:1546` | `x-side-panel`/`x-surface-window` werden per `template.innerHTML` materialisiert. |
| Hydration Islands | `src/app/media-manager-shell.js:1615`, `src/app/media-manager-shell.js:1694` | Inseln werden per `element.innerHTML` aktualisiert. |
| Shell Bootstrap | `src/app/media-manager-shell.js:1634` | Root-Shell wird per `root.innerHTML` aufgebaut. |
| Surface Cleanup | `src/app/media-manager-shell.js:1349`, `src/app/media-manager-shell.js:1433` | Cleanup greift in private Surface-Manager-Maps und DOM-Strukturen ein. |
| Lightbox Overlay | `src/app/media-manager-shell.js:1391`, `src/app/media-manager-shell.js:1414` | Overlay wird per `document.createElement`, Body-Append und manueller Auswahl synchronisiert. |
| Player Theme | `src/app/media-manager-shell.js:1766` | `x-player.shadowRoot` wird produktseitig gestylt. |
| Event Router | `src/app/media-manager-shell.js:1899` | Click/Input/Change/Drag-Drop werden ueber delegierte VanillaJS-Handler geroutet. |

## Aktuelle RMT-Grenze

Der neue DOM Descriptor Renderer unterstuetzt strukturierte Nodes, Components, Slots, `when`, `repeat`, `fallback` und eine explizite Trusted-DOM-Boundary. Er ersetzt aber Kinder ueber strukturierte Nodes und besitzt keine produktfertige Shell-Update-Schicht fuer die bestehende Media-Manager-Interaktion.

Wichtige Grenzen im aktuellen Vendor-Build:

| RMT-Faehigkeit | Reicht fuer | Fehlt fuer 1:1 Shell |
| --- | --- | --- |
| `resolveValue()` | Direkte Pfade wie `$item.name`, `$state.*`, `$selector.*` | String-Interpolation, Format-Funktionen, bedingte Konkatenation, `toUpperCase`, `slice`, `replace`, Date/Bytes/Duration-Formatierung. |
| `repeat` | Listen aus bereits fertigen Arrays | Ableitung von Collections, Stats, Tags-Slices, Metadata Rows und Dock-Gruppen ohne produktseitige ViewModel-Berechnung. |
| Structured `style` | Sichere Style-Objekte | Dynamische CSS Custom Properties aus Array-Indizes wie `posterTone[0]`/`posterTone[1]` ohne Transform-Primitive. |
| Events | Direkte deklarative Bindings | Delegation mit `closest()`, Drag/Drop `FileList`, File-Input-Reset, Confirm/Delete-Flows und Surface-Event-Normalisierung. |
| Surface Resource Graph | Statische Surface-Beschreibung und Snapshot-Modell | Dynamische Player-Window-Erzeugung, Destroy/Restore/Minimize/Open ohne DOM-Materializer und ohne private Manager-Map-Cleanup. |
| Effects/Resources | Deklarierte Effekt- und Resource-IDs | Lightbox-Lazy-Import, Body-Portal, Object-URL-/Overlay-Lifecycle und scoped Destroy als Runtime-Effekt. |

## Fehlende RMT-Primitives

1. ViewModel- und Formatting-Primitives  
   Benoetigt werden deklarative Operationen fuer `map`, `filter`, `reduce/countBy`, `slice`, `contains`, `uppercase`, `replace`, `concat/interpolate`, `formatBytes`, `formatDateShort`, `formatDuration`, Fallback-Werte und Style-Token aus Pfaden/Array-Indizes. Ohne diese Schicht muesste der Produktcode weiterhin `mediaTitle`, `mediaSubtitle`, `statsFor`, `metadataRows`, Dock-State und Record-Displaywerte vorbereiten.

2. Declarative Surface Materializer  
   Benoetigt wird ein RMT-eigener Controller fuer `x-surface-manager`, der Surface-Elemente aus dem Surface Graph erzeugt, oeffnet, fokussiert, minimiert, wiederherstellt, schliesst und entfernt. Dynamische Player-Instances duerfen nicht mehr ueber `template.innerHTML`, `appendChild`, `replaceChildren` oder private `_registeredElements`-Maps gesteuert werden.

3. Keyed Hydration/Island Renderer  
   Benoetigt wird ein RMT-Renderer fuer keyed Islands, der Navigation, Explorer, Player, Inspector und Dock aktualisiert, ohne `element.innerHTML` zu setzen und ohne Eingabefokus, Scrollposition oder Media-Zustand zu verlieren.

4. Event Router Payload Adapters  
   Benoetigt werden deklarative Adapter fuer `closest()`/composed path, Dataset-Payloads, `input`, `change`, File Inputs, Drag/Drop `FileList`, `beforeunload`, Confirm/Delete-Guards und post-action DOM-Normalisierung wie File-Input-Reset.

5. Overlay- und Resource-Lifecycle  
   Benoetigt werden RMT-Primitives fuer scoped Lightbox-Overlays, Lazy Component Import, Body/Overlay-Portal-Mount, Close-on-owner-destroy und Resource Cleanup.

6. Media Player Integration  
   Benoetigt werden Primitives fuer externe Play-Requests, Player-State-Bridge und Theme-/Part-Vertraege, damit `x-player.shadowRoot` nicht produktseitig gepatcht werden muss.

7. Feedback/Diagnostics Datasources  
   Benoetigt wird ein RMT-Datasource- oder Selector-Pfad fuer Scaffold Reports, Runtime Summary und Diagnostics, damit Inspector-Readouts nicht in Produkt-JS formatiert werden.

8. Downstream No-Manual-HTML Gate  
   Benoetigt wird ein verpflichtender Downstream-Check, der normale App-UI gegen `root.innerHTML`, `element.innerHTML`, `template.innerHTML`, `outerHTML` und `insertAdjacentHTML` prueft. Aktuell existiert der Gate im Vendor, ist aber noch nicht als Downstream-Akzeptanzkriterium verdrahtet.

## Moegliche Teilmigration

Eine Teilmigration ist moeglich, indem die vorhandenen Produktfunktionen ein fertiges `state.shell.view` berechnen und RMT dieses ViewModel nur noch strukturiert ausgibt. Das waere fuer Smoke-Tests hilfreich, erfuellt aber nicht das Ziel "UI/Shell ohne VanillaJS ausserhalb des RMT Stacks", weil alle fachlichen Renderentscheidungen weiterhin im Downstream liegen.

## Drawing-Board-Arbeitspakete

| ID | Upstream-Arbeit | Ziel |
| --- | --- | --- |
| `MM-RMT-01` | ViewModel/Formatting DSL | Media Records, Stats, Metadata, Dock und Labels ohne Produkt-JS berechnen. |
| `MM-RMT-02` | Surface Materializer Runtime | Dynamische Surfaces aus RMT Graph erzeugen und verwalten. |
| `MM-RMT-03` | Keyed Island Renderer | Shell-Regionen inkrementell und DOM-sicher aktualisieren. |
| `MM-RMT-04` | Event Payload Adapters | Upload, Drag/Drop, Dataset-Actions und Surface Events deklarativ routen. |
| `MM-RMT-05` | Overlay/Resource Effects | Lightbox, Lazy Import und Cleanup in die App-Platform-Runtime ziehen. |
| `MM-RMT-06` | Player Theme/State Contract | `x-player` ohne ShadowRoot-Patch integrieren. |
| `MM-RMT-07` | Downstream Acceptance Gate | Manual-HTML-Sinks fuer normale App-UI im Produkt-Build blockieren. |

## Akzeptanz fuer den naechsten Anlauf

Ein echter 1:1-RMT-Shell-Transfer gilt erst als erreicht, wenn:

- `src/app/media-manager-shell.js` keine normalen UI-Renderer mit HTML-Strings mehr enthaelt.
- `src/app/media-manager-shell.js` keine normalen UI-Sinks `root.innerHTML`, `element.innerHTML`, `template.innerHTML`, `outerHTML` oder `insertAdjacentHTML` mehr enthaelt.
- Dynamische Surfaces aus dem RMT Surface Graph kommen und ohne private Surface-Manager-Felder bereinigt werden.
- Lightbox, Player-State, Upload, Drag/Drop, Delete und Dock-Aktionen ueber RMT Actions/Effects/Event Router laufen.
- `x-player` nicht mehr ueber `shadowRoot` produktseitig gestylt wird.
- `npm run rmt:check`, `npm run check:syntax` und der Browser-Smoke zeigen die Shell als RMT-gerenderte App-Platform-Shell ohne produktlokalen UI-Renderer.
