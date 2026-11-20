# A06.4.3 – verwalteter nativer Komponentenkatalog

Stand: 20. November 2026. Implementierungsbasis: `39907c7f0221f9d8b469d59006331c3649272268`. Dieses Paket setzt den vereinbarten Ausbau des gesamten integrierten Katalogs um. Die gemeinsame Zielabnahme A06.6 und die semantische Projektintegration A06.5 bleiben eigene Pflichtabschnitte für 0.9. Source8 ist ein explizites CSR-Profil; es erteilt keine zusätzliche SSR-Freigabe.

## Vertrag und Zuständigkeiten

Die 47 Manifest-Einträge sind vollständig und disjunkt eingeordnet: 36 UI-Komponenten, sechs Plattformelemente, vier Dienste und eine Demo als Referenz. [Der kuratierte Vertrag](catalog.cjs) definiert Eigenschaften und Verhalten je Rolle. [Die Abnahmematrix](matrix.v2.json) unterscheidet vorhandene Implementierung, Delegation und tatsächlich überprüfte Fähigkeiten. Erfolgreicher Import, vorhandener ShadowRoot und ein einzelner Mount ersetzen keine funktionale Abnahme.

| Welle | Umfang | Umsetzung |
| --- | --- | --- |
| 1 | Button, Header, Icon, Cards, Footer, Progress, Section, Status, Summary, Type | Gemeinsame Klassen und explizite verwaltete Profile; Projektion, Ereignisse und freigegebene Befehle. |
| 2 | Router, SidePanel, SurfaceManager, SurfacePortal, SurfaceRegion, SurfaceWindow; Theme, Utils, I18n, State | Nebenwirkungsfreie Definitionen und besitzgebundene Dienst-/Plattformports. Controller und Resource-Graph bleiben die Autorität. |
| 3 | Input, Textarea, Checkbox, Toggle, Radio, Select, Calendar, Form | Kontrollierte Werte, normalisierte Eingabe-/Validierungsereignisse und Model-Actions; lokaler Entwurf bleibt flüchtig. |
| 4 | Link, Tabs, Menu, Hero, Code, Masonry | Navigation beziehungsweise I/O durch Ports; Tabs und Masonry projizieren originale Autorenknoten über Renderer-Leases. |
| 5 | Alert, Dialog, Drawer, Keymap, Lightbox, Modal, Popover, Spinner, Toast, Tooltip | Kontrollierte Darstellung, besitzgebundene Interaktion, Fokus und Ressourcenfreigabe. |
| 6 | Player, Writer | Explizite Medien-/Writerports, bereinigtes HTML und Datei-Handles; keine implizite globale Speicherung oder beliebige Netzadresse. |
| 7 | Lifecycle-Demo | Eigenständige Referenz-/Regressionsabnahme; keine Freigabe als produktives `RMT.Component`. |

Die ausgelieferten JavaScript-Implementierungen sind maßgeblich. Eine `*.definition.js` exportiert dieselbe Klasse, die der Classic-Einstieg registriert. Classic-Bootstrap und verwaltete Vorbereitung sind getrennt; es gibt keine eingefrorene zweite Komponentenimplementierung. Constructoren dürfen lokale Felder und eigenen Shadow DOM vorbereiten. Der vertrauenswürdige Loader prüft den tatsächlichen gepinnten Konstruktor vor `createElement`; die Registry installiert den Kontext vor Attributen, Properties, Kindern und Verbindung. Ein Klassenmarker allein ist kein Herkunftsnachweis.

## Authoring

```tsx
<RMT.Surface id="editor">
  <RMT.View>
    <RMT.Component tag="x-input" ref="email"
      properties={{value:model.form.email}}>
      <RMT.On event="input-changed" action="form.emailChanged"
        payload={{value:'detail.value'}} />
    </RMT.Component>
  </RMT.View>
</RMT.Surface>
<RMT.Action id="editor.focus">
  <RMT.Effect kind="component-command" target="editor.email"
    command="focus" args={{}} />
</RMT.Action>
```

Auswahl: `createRmtxCompiler({syntaxVersion:'8.0.0'})` beziehungsweise Maraca `rmtxSyntaxVersion:'8.0.0'`. Default1 und die bisherigen Profile1–7 bleiben explizit verfügbar. `RMT.On` steht direkt im Komponentenrumpf; sein Payload liest deklarierte DTO-Pfade. Es erhält keine DOM-, Provider- oder Callback-Referenzen. Die Bridge ergänzt deklarierte Wiederholungsschlüssel selbst. Lexikalische Komponentenereignisse werden nicht zusätzlich als Surface-Delegation registriert. Ihre Modelbedingungen laufen durch denselben geschlossenen Eventcondition-Evaluator (API4.1) wie vorhandene Eventrouten. `preventDefault=true` ist an einem kanonischen Komponentenintent ausdrücklich unzulässig; Browserereignisse behalten ihren bestehenden Surfacevertrag.

Befehle stehen in echten Action-Effects. Der unveränderte AST1 enthält `effectKind:'component-command'`, einen Surface-Bezug und `componentCommand:null`; der neue Vertrag verbindet die genaue AST-/Core-Herkunft mit Ziel, Argumenten und Schlüsseln. Der bestehende selektorbasierte Classic-Commandtyp wird nicht umgedeutet. Jeder native Befehl besitzt eine eigene kompilierte Kernel-Schedulingoperation und eine registrierte, einmalig aufrufbare Implementierung. Fehlende Sidecars, Fähigkeiten, Ziele oder tatsächliche Aufrufe führen zu Fehlern.

`ref` ist lokal zur owning Surface. Befehle benutzen `surface.ref`; bei wiederholten Hosts oder Views ist `keys={[input.rowId,...]}` mit der vollständigen typisierten Schlüsselkette erforderlich. Zahl `1` und String `'1'` bleiben verschieden. Controllergeneration, Komponentenhandle und Abbruchsignale begrenzen verspätete Arbeit auf ihre ursprüngliche Instanz.

Registry, Vorbereitung und Dispatcher müssen aus derselben Portinstanz stammen. Maraca reicht diesen Port durchgängig weiter. Root-Komponentendefinitionen lesen den unveränderlichen Kontext am Element und können dadurch auch mit dem Compiler-Paket vorbereitet werden. Die privaten Handle-Registrierungen verschiedener Bridgeinstanzen werden dabei nicht zusammengeführt.

Attribute bleiben deklarierte skalare Werte. Properties können ausdrücklich typisierte JSON-Objekte und Arrays tragen. Model-/Selector-Ausdrücke verwenden die geschlossene Projektion und statische Readsets; Datenobjekte werden als Literalwerte an den Renderer übergeben. Der aus demselben Katalog erzeugte Typgraph prüft Tags, Properties, Ereignis-DTOs und Befehlsargumente. Dynamische Modelmarker sind im Authoring typseitig ungeprüft; Parser, Projektion und Runtime prüfen sie weiterhin. Eine generierte Model-Typauflösung gehört zu A06.5.

## Aktivierung, Zustand und Autorenknoten

Die Lebensdauer und die aktive Interaktion sind getrennte Bedingungen. Vorbereitung, kontrollierte Projektion und Registrierung benötigen eine gültige Lebensdauer. Ereignisse, Befehle und I/O benötigen zusätzlich tatsächliche aktive Zulassung. `Hydrate=false` hält Interaktion zurück. Suspend gibt aktive Listener, Timer, Modalität und Präsentationsleases frei; Resume bindet sie erneut, ohne die ursprüngliche Komponente zu ersetzen. Dispose und Controllerretirement widerrufen die ursprünglichen Handles terminal.

Model bleibt der einzige Schreiber fachlichen Zustands. Ein programmatisches Propertyupdate erzeugt keinen Intent. Befehle wie Reset, Toggle oder Open fordern einen deklarierten Model-Übergang an; sie schreiben den kontrollierten Wert nicht heimlich lokal um. Der gesamte Property-/Attributsatz wird vor dem ersten Setter validiert. Entfernte kontrollierte Felder erhalten ihre ursprünglichen Baselines innerhalb derselben unterdrückten Ereignistransaktion zurück.

Tabs und Masonry verwenden `items:[{key,ref,keys?,title?,disabled?,collapsed?}]`. `RMT.Element ref="panel"` und `RMT.Component ref="panel"` erzeugen private Rendererreferenzen. `items[].keys` enthält bei Bedarf die vollständige typisierte Kette; ohne Angabe gilt exakt die Kette des Owners. Es gibt keinen Index- oder Selektorersatz. Der Renderer prüft direkte ursprüngliche Kinder und besitzt Einblendung, ARIA und Reihenfolge. Die Komponenten behalten ihre eigenen Controls im Shadow DOM und senden Auswahl-/Reorderintents an Model. Die Freigabe stellt ausschließlich noch selbst besessene Attribute und die ursprüngliche Reihenfolge wieder her.

Dateien kreuzen die Grenze als Metadaten mit opakem Instanzhandle. Nur der vertrauenswürdige Port kann das tatsächliche File innerhalb derselben aktiven Lebensdauer auflösen. Richtext und Highlighting benutzen die vorhandene DOMPurify-Grenze. Externe Ressourcen, Export, Speicherung und Medienaktionen benötigen deklarierte Ports. [Die geprüften Classic-Abweichungen](matrix-review.md) erklären die sicheren Entsprechungen.

Verwaltete Präsentationswerte werden vor der gesamten Settertransaktion geprüft. Modal-Titel werden als Text gesetzt. Dialogmaße und Hero-Darstellung benutzen geprüfte CSSOM-Zuweisungen; Autorenwerte gelangen dabei nicht in ein Style- oder HTML-Template. Ein Hero-Bild verlangt genau eine gültige URL und die Zulassung des Ressourcenports vor der Zuweisung. Section und Spinner konsumieren Hintergrund-/Farbwerte ausschließlich als Farbe und setzen das Hintergrundbild ausdrücklich auf `none`. Dadurch können auch CSS-Variablen an diesen Stellen keine Bildressource laden. Classic verwendet weiterhin seinen bisherigen Präsentationsvertrag.

## Versionen und Quellbindung

| Grenze | Neues explizites Profil |
| --- | --- |
| Parser / Compiler / Authoring | API8, Source8, Parserresult8, Compilerresult8 |
| Operatorprofil | Katalog7 / API7 |
| Native Quelle / Header / Metadaten / Katalog | Quelle3, Header3, Metadata2, Catalog2 |
| Backend / Actionplan | Program6, Actionplan3; Classic-Compiler4.9 / Backend1.10 |
| Native Runtime / Scope / Lifecycle | Port4, Scope2, Lifecycle3 |
| Dienste / eigener State-Port | `xtend.native-services.port.v1` / `xtend.native-services.state-port.v1` |
| Framework-State / URL | Bindingartifact8, Registry7, URL6; bestehende Binding3-/URL2-Wires |
| Maraca | Plan12, Config12, Browser14, Runtime17 |
| Composition | Manifest12, Artifact13, Report13, Port10 |
| Gemeinsamer Renderer | API2.4; bestehender Rendererinstanzvertrag2 |

Der neue Katalog bindet Einstiege, Definitionen und transitive lokale Helfer. Catalog1 behält die bisherigen zwei Tags sowie exakte Sinks und Slots. Seine Wrapper erhalten einen geprüften Hashbeleg des gemeinsamen Definitionsabschlusses, der wiederum in den bisherigen Entryhash eingeht. Änderungen erfordern neue Captures und neu gebaute Artefakte. Alte Ausführungsberichte werden nicht durch Umschreiben ihrer Quellpins zu aktuellen Belegen.

Service-Fassade und kleiner State-Port haben unterschiedliche Schema-IDs. Die eigene State-Port-Kennung verhindert, dass dessen vollständig deklarierte sieben Methoden als Vertrag des umfangreicheren Aggregats ausgelegt werden. Die Service-Fassade behält API1. Der im Inventar verlangte initiale Fingerprint-Lock einer vollständig beschriebenen Schnittstelle dokumentiert deren Shape-Stabilität; eine Paket- oder Featurefreigabe wird dadurch nicht erteilt.

Für Plan11/12 und Manifest11/12 druckt der Builder identische unveränderliche JSON-Teilbäume gemeinsam. Das Hauptmodul referenziert Programmdaten des verifizierten Companions nur nach vollständigem JSON-Gleichheitsvergleich; andernfalls bleibt das lokale Literal maßgeblich. Dasselbe gilt für Kernel-, Hydration-, Validierungs- und Transitionsteilpläne sowie Bindings. Das erzeugt gewöhnliches JavaScript ohne Decoder und bewahrt die bisherigen Wireverträge. Source1–6 behalten ihren bisherigen Ausgabepfad.

## Prüfung und Release

Die gezielten Prüfungen liegen in `tests/rmt-language/native-component-catalog*.test.cjs`, `tests/rmt-language/native-managed-renderer.test.mjs`, `tests/components/native-managed-ui.test.mjs`, `tests/components/native-platform-services.test.mjs` und `tests/maraca/rmtx-managed.test.mjs`. Die produktive wiederholte Native-/React-/Vue-Fixture steht in [source.rmtx](source.rmtx). Der reguläre Build und die tatsächlichen Node-/Chromiumläufe müssen die unveränderten Größenbudgets einhalten.

`check:release-preparation` verlangt die neuen Capture-, Typ-, Compiler-, Komponenten- und Runtimeprüfungen zusätzlich zu den bisherigen Gates. Prozesse laufen seriell, mit Heapgrenze und Timeout. Der Releasevertrag2 verlangt alle 46 produktiven Rollen, die Demo-Abnahme sowie A06.5 und A06.6 mit gebundenen Ausführungsnachweisen. Beide Releasefeatures bleiben bis zu dieser gemeinsamen Abnahme `preparing`. Der konkrete aktuelle Ausführungsstand wird getrennt von diesem Implementierungsvertrag dokumentiert.
