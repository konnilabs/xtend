# A01 – Inventur des RMT-Sprach- und Artefaktvertrags

Stand: **7. November 2026**. Status: **gemeinsamer Compiler-Eingangsvertrag implementiert; A01-F01 bis F04 korrigiert**. Basis ist Commit `5d7a295c` einschließlich der noch uncommitteten B02-/B03- und A01-Korrekturen. Exakte Eingaben sind über Inhalts-Hashes im Inventar gebunden. Implementiert sind Prüfungen für eindeutige Core-Identitäten, ausführbare Selektorquellen, vollständige Diagnosekanäle und zielbezogene Renderfähigkeiten. Der neue öffentliche Name lautet **RMT Classic**. RMTX und XTensions 2.0 sind verpflichtender Umfang von 0.9, bleiben aber in Vorbereitung; Syntax und Feature-Abnahme werden hier nicht vorweggenommen.

## 1. Ergebnis

Ein gemeinsamer RMT-/RMTX-Vertrag kann nicht durch die Übernahme einer einzelnen bestehenden Schema-ID festgelegt werden. Im aktuellen Stack existieren mehrere verschiedene Datenmodelle und Ausdrucksauswerter. Für ihre Abgrenzung liegen jetzt vor:

- [inspect.cjs](inspect.cjs): reproduzierbare TypeScript-AST-Auswertung der Implementierung plus kleine operative Proben.
- [inventory.json](inventory.json): maschinenlesbare Quellen, Konstruktorfelder, Typdeklarationen, Operatorzweige, Beobachtungen und Abdeckung.
- [probes/authoring-variants.rmt](probes/authoring-variants.rmt): ergänzt seltenere Parser-/Lowering-Varianten.
- [probes/selector-datasource.rmt](probes/selector-datasource.rmt) und [probes/core-identity.rmt](probes/core-identity.rmt): ursprüngliche Reproduktionen; seit der Korrektur isolierte Negativfälle mit diagnostizierter Ablehnung.
- [identity-and-selector-sources.md](identity-and-selector-sources.md): implementierter Teilvertrag für Identitäten und Selektorquellen, einschließlich Artefaktgrenze und verbliebener Grenzen.
- [diagnostics-and-render-capabilities.md](diagnostics-and-render-capabilities.md): implementierter Teilvertrag für Diagnoseaggregation, LSP-Herkunft und getrennte Render-/Model-/Regelprofile.
- [compiler-contract.md](compiler-contract.md): implementierter Feld-/Referenz- und Versionsvertrag für Classic und weitere Frontends.
- Diese Datei: semantische Abdeckungsmatrix, Grenzen und Zuordnung der Befunde.

**Beobachteter Umfang:** 57 Eingabedateien mit SHA-256; 15 erfolgreich kompilierte RMT-Quellen; alle **122** statisch gefundenen AST-Knotentypen mindestens einmal im Corpus; **23** Core-Listen; **27** statische `addRecord`-Erzeuger; **301** beobachtete Pfadmuster in App-Platform-, Kernel-, Orchestrierungs- und Service-Artefakten; **118** Interfaces und **81** versionierte Konstanten in den ausgewählten Quellen. Ergänzt wurden Portable-Typen, Tooling und LSP-Protokoll. Der Core-Konstruktor hat 29 Root-Felder, der Orchestrierungskonstruktor 27.

Das ist keine vollständige Verhaltensabdeckung. Ein beobachteter Knotentyp beweist weder alle Feldkombinationen noch gültige Typbeziehungen, vollständige Fehlerdiagnosen oder gleiche Ausführung auf allen Zielen. Beispielsweise wird die zusätzliche Animation-/Recipe-Fixture nur geparst und kompiliert; ihre Services, Recipes und Animationen werden nicht ausgeführt.

## 2. Reproduktion und Datenqualität

Benötigt werden das unterstützte Node-Tooling und der bereits im Repository vorgesehene TypeScript-Parser **5.9.3**. Die aktuelle Ausführung nutzte Node **24.22.1**. Bei regulär installierten Projektabhängigkeiten:

```sh
node development/rmtx-a01/inspect.cjs --write
node development/rmtx-a01/inspect.cjs --check
```

`--write` erzeugt die Beobachtungsdatei; `--check` vergleicht sie mit einer erneuten Auswertung und meldet Drift. Ein unverändertes `--check` erzeugt keine neue Freigabe. In dieser Sitzung wurde der vorhandene isolierte TypeScript unter `/tmp/xtend-selector-test-deps/node_modules` über `NODE_PATH` verwendet; Installationen oder Änderungen an Paketmanifesten/Lockfiles waren nicht erforderlich.

Die Ausgabe enthält keinen absoluten Checkout-Pfad, Zeitstempel oder laufend wechselnden Git-HEAD. Der Generator und die ausgewählten Eingabedateien sind inhaltsgebunden. So bleibt der Vergleich auch nach einem Commit oder in einem anderen Checkout reproduzierbar. Die semantisch kuratierte Matrix in dieser README muss bei Änderungen zusätzlich geprüft werden.

| Inventarbereich | Inhalt | Aussagegrenze |
| --- | --- | --- |
| `inputs`, `toolchain` | Dateihashes, Parser-Version und Generator-Hash | Bindet diese ausgewählten Quellen, nicht das gesamte Repository. |
| `facts[*].astFactories` | `createNode`-Aufrufe, statisch auflösbare Helper-Aufrufe und direkt erzeugte AST-Objekte; Felder und Fundstellen | Konstruktorbeobachtung, kein vollständiger Kontext-/Pflichtfeldvalidator. |
| `facts[*].coreRecords` | Core-Domain, AST-Bezug, Initialisierungsfelder, direkte Feldzuweisungen und gemeinsames `sourceRef` | Keine vollständige Alias-/Kontrollflussanalyse; nachträgliche Writes über andere Variablen können zusätzlich existieren. |
| `facts[*].artifactLayouts` | Statische Rückgabeobjekte und direkt geschachtelte Felder | Spreads und Funktions-/Map-Ergebnisse sind ausdrücklich kenntlich; nicht als vollständig expandierte Shape lesen. |
| `facts[*].interfaces` | Deklarierte Felder, optionale Marker, Typtexte und vollständige Member-Signaturen | Deklarationen allein beweisen keine Laufzeitvalidierung. |
| `catalogs`, `evaluators`, `operatorBranches` | Statische Mengen, Switch-Cases und Operator-Prüfzweige | Ein Branch ist kein End-to-End-Ausführungsnachweis. |
| `observedAstFields`, `observedCoreFields` | Felder und beobachtete Wertarten über den Corpus | Aus häufigem Vorkommen folgt kein `required`; aus fehlendem Vorkommen folgt kein Verbot. |
| `observedArtifactFields` | Pfadmuster und Felder bis zu vier Objektebenen | `*` bedeutet Arrayelement, keinen konkreten JSON Pointer. Initial-/Literal-/Prop-/Attributdaten und Renderbäume bleiben opaque. |
| `observations`, `portableCases` | Ausgewählte tatsächliche Compiler-/Model-/Node-Projektionsresultate; Ablehnungsphase, Diagnosefundstellen und Artefaktgrenze der Negativfälle | PHP wird hier nur durch den bestehenden Target-Gate geprüft; kein PHP-Prozess und kein Browserboot. |

Der Corpus enthält die bestehenden Minimal-, Complex-, Primitive-, Condition-, Lifecycle-, Security-, Composition-, Remote-, App-, Validation-, Transition-, Resume- und Bounds-Fixtures sowie die Docs-RMT-Quelle und die ergänzte Variantenquelle. Die Laufzeitproben konservieren Beobachtungen, keine Soll-Freigaben der gefundenen Defekte: Nach einer Korrektur wird der veränderte Befund neu bewertet und das Inventar regeneriert.

## 3. Schichten und bestehende Schema-Governance

Die vorhandene [Schema-Inventur](../../tools/schema-inventory/index.cjs) wurde zusätzlich **lesend** auf den aktuellen getrackten Quellen ausgeführt. Sie bleibt die Zuständigkeit für Schema-Governance. Ihre Auswahl-, Ownership-, Fingerprint- und Acceptance-Daten wurden nicht geändert. Der neue A01-Datensatz beschreibt Sprachstufen und beobachtete Ausführung; er ist keine zweite Freigaberegistratur.

Der beim ersten Inventarstand vor den F01-/F02-Korrekturen lesend ausgeführte Scanner meldete für die folgenden IDs:

| Repräsentation / ID | Formeller Schemafund | Statisch beobachtete Shapes / Scanner-Modus |
| --- | --- | --- |
| Dokument-JSON: `https://xtendrmt.dev/schemas/rmt.v2.schema.json` | Ja, kanonisches Template unter `xtendrmt/kernel/templates/rmt.schema.json` | 1 / `single` |
| Parser: `xtend.rmt.vnext.ast.v1` | Runtime-Discriminator/Konstante, kein formelles JSON-Schema als Definition erfasst | 1 / `single` |
| Core: `xtend.rmt.core-format.vnext.v1` | Kein formelles JSON-Schema als Definition erfasst | 13 / `review-required` |
| App Platform: `xtend.rmt.vnext.app-platform-records.v1` | Kein formelles JSON-Schema als Definition erfasst | 6 / `review-required` |
| Kernel Records: `xtend.rmt.vnext.kernel-records.v1` | Kein formelles JSON-Schema als Definition erfasst | 8 / `review-required` |
| Orchestrierung: `xtend.rmt.app-orchestration.v1` | Kein formelles JSON-Schema als Definition erfasst | 4 / `review-required` |
| Portable Render: `xtend.rmt.portable-render.v2` | Ja, unter `xtendrmt/contracts/portable-render.v2.json` | 2 / `review-required` |

Das sind **frische Scannerbeobachtungen**, keine Aussage über eine angenommene Release-Freigabe und keine Zählung semantischer Sprachvarianten. Teil-Shapes, Testdaten und unterschiedliche Erzeuger können mehrere Shapes verursachen. Der Auto-Scanner wählt für die Core-ID derzeit sogar eine öffentliche Identifier-Referenz in `xtend-maraca/index.js` als `canonicalDefinition`; der tatsächliche Core-Erzeuger ist `createCoreDocument()` im Compiler. Ein gemeinsamer Sprachvertrag benötigt deshalb eine explizite Erzeuger-/Validator-/Konsumenten-Zuordnung und kann nicht allein aus der automatisch gewählten Fundstelle entstehen. Der komplette lesende Auszug dieser Sitzung liegt unter `/tmp/xtend-a01-governance.json`.

### Dokument-Schema und Core sind unterschiedliche Modelle

[rmt.schema.json](../../xtendrmt/rmt.schema.json) und sein kanonisches Template sind im untersuchten Stand bytegleich. Das Schema hat 14 erlaubte Root-Properties und `additionalProperties: false`. Darunter sind `adapters`, `components`, `routes`, `schedules` und `templates`.

[createCoreDocument():119](../../tools/rmt-language/vnext-compiler.js#L119) erzeugt dagegen 29 Root-Felder. Schon die serialisierte Minimal-Fixture enthält zusätzliche Felder wie `schema`, `imports`, `lanes`, `operations`, `slots`, `events`, `dataSources`, `sourceMap`, `securityPolicies` und `searchSources`. Ein Validator für das bestehende Dokument-Schema kann daher nicht ungeändert als Core-Validator eingesetzt werden.

Auch Rohobjekt und serialisiertes Core-JSON unterscheiden sich: Der Serializer lässt bestimmte leere Domains sowie fehlende App-/Kernel-Projektionen weg. Ein formeller Vertrag muss diese erlaubte Auslassung und die Defaults ausdrücklich beschreiben. `version: 2.0-vnext`, Schema-ID `.v1` und Paketversion `0.9.0` sind drei unterschiedliche Versionsebenen.

## 4. Domänen- und Abdeckungsmatrix

Die vollständigen einzelnen Feldbeobachtungen stehen in `inventory.json`. Die folgenden Pfade beziehen sich auf Core bzw. `orchestrationArtifacts`; Arraypositionen sind als `*` dargestellt. Zustandsinhalte, Component-Props und referenzierte Anwendungsschemas sind dabei eigene Datenverträge.

| Bereich / AST-Familie | Core-Domain und wesentliche Felder | Plan / Auswerter / Prüfung |
| --- | --- | --- |
| Imports: `RmtImportDeclaration` | `/imports/*`: `id`, `path`, `mode`, `sourceRef` | Modulresolver außerhalb des Core-Lowerings. Source-Compile allein löst keinen vollständigen Importgraphen auf. |
| Templates: `RmtTemplateDeclaration` | `/templates/*`: `id`, `name`, `mode`, `surfaceRefs` | Dokument-/Scope-Metadaten; noch kein generischer JSX-Component-Tree. |
| State: `RmtStateDeclaration`, Initial-/Value-Knoten | `/states/*`: `name`, `type`, `initial`, `preserve`, `scope` | `/state/states`; `createRmtStateSelectorRuntime`, Model Reader und Command Port. Anfangswert-/Referenzprüfungen sind nicht dasselbe wie ein struktureller Custom-Type-Validator. |
| Selectors: Declaration, Where/Find/Sort/Output, Expressions | `/selectors/*`: `source`, `clauses`, `output`, `scope` | `/state/selectors`: strukturierte `where`, `find`, `sort`; `resolveReference` und `applySelectorOperations`. B01 ergänzt ausführbares Lowering. F01 begrenzt Quellen auf bekannte States/Selektoren; strukturelle Ergebnisverträge bleiben offen. |
| DataSources: Source-, Method-, Mode-, Contract-, Result-, Fallback-Knoten | `/dataSources/*`: `kind`, `target`, `mode`, `method`, `contract`, `result`, `fallback`, `ownerOperation` | `/actions/dataSources` und `appServiceDemands`; Ausführung benötigt Host-/Service-Adapter. Nicht mit einer sofort im Model verfügbaren Sammlung gleichsetzen. |
| Actions: Declaration, Inputs/Policy, Status, Reducer, Recipe, Handler, Emit | `/actions/*`: `inputs`, `status`, `reducers`, `emits`, `handlers`, `effectRefs`, optional `execution` | `/actions/actions`, `/state/reducers`; App Runtime, Action/Effect Runtime, Model Command Port und gegebenenfalls Recipe-Port. Eingabe-/Resultatbindungen haben eigene Pfadkontexte. |
| Effects: `RmtEffectStatement` | `/effects/*`: `kind`, `action`, `actionRef`, `source`, bei entsprechenden Varianten Ziel-/Command-Fakten | `/actions/effects`; explizite Hostservices, DataSources, Komponentencommands oder Presentation-Ports. Ein serialisierter Effect ist noch keine ausgeführte Operation. |
| Surface: Declaration, Source, Repeat, Key, Bounds, Preserve, Destroy | `/surfaces/*`: `kind`, `component`, `source`, `repeat`, `key`, `portal`, `bounds`, `laneRefs`, `eventRefs`, `resourceRefs` | `/surfaces`, `/render`, `/patchPlan`; Surface-/Resource-Graph und DOM-Renderer. Native Komponentenwahl und Containerbesitz bleiben Host-Aufgaben. |
| Remote Surface: Declaration, Owner/Origin/Version/Integrity/Expose/Event/Fallback | `/remoteSurfaces/*`: `remote`, `manifestId`, `security`, `runtime`, `capabilities`, `exposes`, `events`, `fallback` | Remote-Compiler-/Manifest-/XScaler-Verträge zusätzlich zum lokalen Source-Compile. Kein allgemeiner Loader für jede XTension. |
| Lanes: `RmtLaneDeclaration` | `/lanes/*`: `name`, `weight`, `scope`, `operationRefs` | `/kernel` und `/kernelRecords/schedules`; Scheduler-Lanes werden später normalisiert und als Jobs tatsächlich eingeplant. |
| Lifecycle / Stream: entsprechende Statement-Knoten plus Conditions/Policies | `/operations/*`: `kind`, `op`, `target`, `source`, `condition`, `scope`, `policyRefs` | Kernel-Orchestrierung plus explizite Host-Endpoints. Die Source-Operation muss auf eine tatsächlich verfügbare Hostfähigkeit abgebildet werden. |
| Slots: `RmtSlotDeclaration` | `/slots/*`: `name`, `ownerOperation`, `operationRefs` | Composition-/Component-Binding-Vertrag; benannter Operationsbereich, nicht automatisch ein typisierter Framework-Child-/Slot-Vertrag. |
| Events: Binding, Selector, Options, Payload-Mappings | `/events/*`: `event`, `action`, `actionRef`, `selector`, `target`, `payloadContract`, `options`, Owner-/Scope-Fakten | `/events`; Event Routing Runtime und Commands. Payloadpfade können z. B. `detail`, `target.dataset` oder Surface-Kontext adressieren; nicht dieselbe Grammatik wie Selector-Pfade. |
| Validation: Declaration, Mode, Target, Field, Rule, Include | `/validations/*`: `mode`, `targets`, `fields`, `includes` | `/validation`; Evaluator, View-Projector und Model-Command-Adapter. Unterstützt `required`, `email`, `minLength`, `maxLength`, `pattern`; F03 übernimmt Capability-Warnungen vollständig mit Feldherkunft in Compiler und LSP. |
| Animation: Declaration, Preset, Effect, Duration, Easing, Spring, Keyframes, Timeline, ReducedMotion | `/animations/*`: `preset`, `effect`, `durationMs`, `easing`, `spring`, `keyframes`, `timeline`, `reducedMotion`, `allowFilter` | `/animationEngine`; Compiler-Sanitizing, Property- und Effect-Kataloge, Runtime-Phasen. CSS-Property- und Filter-Freigabe nicht aus freiem JSX-Style-Objekt ableiten. |
| Transition: Trigger, From/To, Animation, Timeline, LayoutKey, Interrupt, Lane | `/transitions/*`: `trigger`, `from`, `to`, `animation`, Effect-/Duration-/Easing-Fakten, `layoutKey`, `interrupt`, `reducedMotion`, `lane` | `/transitions` und `/animationEngine`; Scheduler-Endpoint, Surface-Zustände und Presentation-Ports. Explizite und abgeleitete Defaults sind getrennte Felder. |
| Portals: Declaration und Policy-Knoten | `/portals/*`: `root`, `layer`, `z`, `policies` | `/portals`, Render-Komposition, Surface-Host. Root-Selector und tatsächlicher DOM-Besitz sind unterschiedliche Ebenen. |
| Overlays: Declaration und Policies | `/overlays/*`: `kind`, `portal`, `policies` | `/overlays`, Resources, Transition-/View-Host; Fokus, Scroll und Escape brauchen zuständige Hosts. |
| Resources: Declaration, Source/Import/Dispose | `/resources/*`: `kind`, `owner`, `source`, `dispose`, `adapter`, `kernelVisible` | `/resources`, `/actions/resources`; Resource Manager und injizierte Adapter. Owner-/Release-Regeln und Kernel-/Host-Grenzen sind Teil der Semantik. |
| Search: Source, Query/Resource/Fallback, Weight, Werte | `/searchSources/*`: u. a. `queryState`, `resource`, `fallbackResource`, Budgets/Limits, `fieldWeights`, Templates, Selection-/A11y-Fakten | `/search/sources`; App-/Search-Runtime und Worker-/Resource-Anschluss. Der Corpus nutzt die reale Docs-Source für diese Familie. |
| Security: Trust Boundary / Sanitize | `/securityPolicies/*`: `kind`, `boundary` oder `format`, `ownerOperation` | `/security`, Template-/Host-/DOM-Sink-Regeln. Identifier und Prüfabsicht ersetzen keinen ausgeführten Sanitizer am zuständigen Sink. |
| Hydration / Isolation / Resumability | `/hydrationPolicies/*`: `kind`, `mode`, `policy`, `boundary`, `snapshot`, `eventReplay`, `integrity`, `insularHydration`, `ownerOperation` | `/hydration`, Resume-Envelope, injizierte Root-/XTension-Adopter. Laufzeit-Suspend/Resume und SSR-Adoption sind getrennte Operationen. |
| Herkunft / Identität | `/sourceMap/*`: `id`, `nodeType`, `corePointer`, `astPointer`, `range`; Records tragen `sourceRef` | Compilerdiagnosen, Navigation und Handoff. F02 prüft dokumentweit eindeutige Source-Identitäten vor Projektionen; Kollisionen erzeugen Fehler und keine Artefakte. |

Wesentliche Producer: [Parser](../../tools/rmt-language/vnext-parser.js), [Core-/Plan-Compiler](../../tools/rmt-language/vnext-compiler.js), [semantischer Graph](../../tools/rmt-language/semantic-graph.js). Wesentliche Auswerter: [Model](../../xtendrmt/rmt-state-selector-runtime.js), [DOM-Renderer](../../xtendrmt/rmt-dom-descriptor-renderer.js), [View-Projector](../../xtendrmt/rmt-state-binding-view-projector.js), [Portable Render](../../xtendrmt/rmt-portable-render.js), [Maraca-Komposition](../../xtend-maraca/plan-runtime.mjs).

### UI-/XTension-Bereiche, die noch nicht derselbe Vertrag sind

Das ältere Dokument-Modell besitzt native `adapters`, `components`, `routes`, `schedules`, `props`, `bindings` und `slots`. Das vNext-Core-Modell hat diese Root-Domains teilweise nicht; UI entsteht unter anderem durch komponentenbezogene Renderprojektion aus Surfaces und State. Beide Modelle sind daher nicht allein durch gleiche Begriffsnamen austauschbar.

Der DOM-Renderer kennt zusätzlich eigene Descriptor-Knoten wie `element`, `component`, `fragment`, `repeat`, `conditional`/`when`, `slot`, Text-/Rich-Text- und Trusted-HTML-Pfade. Das portable Ziel erlaubt eine kleinere Knotenmenge. Ein RMTX-Child-Tree benötigt eine eindeutige Abbildung auf diese Struktur sowie eine Grenze zu framework-eigenem DOM.

Die erfassten XTension-Interfaces beschreiben Hostoptionen, Lifecycle, vollständige Props-Updates, Events, Resource-Capabilities und Resume. Ein Framework-Componentwert in `RuntimeHostOptions.component` ist bewusst Hostcode und kein JSON-AST-Wert. Es gibt im untersuchten Core keine generische `/xtensions`-Domain, die diese Verträge bereits vollständig zusammenführt. Typisierte Props-/Slot-/Event-/State-Slices und die Build-/Instanzbindung bleiben A02/A04/A06.

## 5. Scopes, Referenzen, Typen und Pflichtfelder

| Vertragspunkt | Aktueller Nachweis | Noch festzulegen / zu vertiefen |
| --- | --- | --- |
| Symbolscope | Der primitive Graph indexiert Dokument-Deklarationen nach Domain und Namen. Template-/Surface-Scope erscheint zusätzlich als Metadatum. | Ob und wie RMTX echte lexikalische Lokalscopes, Imports und Instanzen erhält; Metadatum nicht mit lokaler Namensauflösung gleichsetzen. |
| State-/Selector-Pfade | Längstes bekanntes Symbolpräfix ermöglicht qualifizierte Namen plus Feldpfad. | Strukturelle Feldtypen und Fehlverhalten bei nicht vorhandenen Datenpfaden. |
| Selector-Item | `item` und `record` werden zu `$item`; `input` wird zu `$params`. | Allgemeine benannte Schleifenvariablen, geschachtelte Iterationen und Shadowing sind damit noch nicht definiert. |
| Condition-Pfade | Eigener Ausdrucksbaum und zusätzliches Condition-Analysemodul mit Pfad-/Typkatalog. | Welche Prüfungen in der gemeinsamen Compilerphase zwingend sind und welche erst durch einen zusätzlichen Tool-/Hostvertrag stattfinden. |
| Reducer-/Effect-Pfade | Sichere State-Ziele, explizite skalare/Pfad-Operanden, bekannte Action-Inputs, Statusziele und State-/Selector-Referenzen sind geprüft. | Result-/Error-/Payload-Felder benötigen externe Hostschemas; Event-/Componenttypen folgen ihren Verträgen. |
| Typnamen | `state ... type` und `output` tragen deklarierte Namen. Der Model-Validator prüft grundlegende Container-/Primitivtypen und lässt weitere Typnamen offen. | Strukturprüfung von Custom-Typen wie `MediaRecord[]`, Schema-Auflösung, Nullability und durchgängige Component-/Eventtypen. |
| Pflichtfelder | Kuratierte Regeln erzeugen ein geschlossenes Draft-07-Schema und TypeScript-Varianten für alle 122 AST-Knotentypen; der Compiler prüft Struktur und Kontext. | Erweiterungen benötigen ausdrückliche Vertrags-/Versionsentscheidungen; keine Pflichtfelder aus Fixture-Häufigkeiten. |
| ID-/Key-Lebensdauer | Record-ID-Normalisierung, Source-Refs, Surface-Keys und Host-/Resume-IDs existieren. F02 weist kollidierende Core-/Source-Identitäten ab, ohne bestehende eindeutige IDs zu verändern. | Umbenennung, Reordering, Instanz-/Resume-Versionierung und Migration über alle Artefakte sind damit noch nicht geregelt. |
| AST-Einstieg | Classic-Source und geprüfter AST verwenden dasselbe Backend. Vorhandene Pointer, Ranges, Hilfsknoten und Convenience-Indizes werden abgeglichen. | RMTX muss seine eigene Syntax in diesen Eingang und seine Herkunft abbilden; kein handgeschriebenes Core-JSON als ungeprüfter Ersatz. |

## 6. Ausdrucks- und Zielmatrix

Es existiert keine einzelne gemeinsame Expression-Grammatik für alle Stufen. Die Sets und Auswerter stehen vollständig in den entsprechenden `facts`-Einträgen; die folgenden Zeilen fassen Familien zusammen.

| Familie | Source / Model | DOM-/View-/Portable-Grenze |
| --- | --- | --- |
| Literale und Pfade | Literale, Arrays/Objekte und qualifizierte Referenzen haben AST-/Lowering-Formen; Model-Auswertung kennt Literalwrapper und Scope-Präfixe. | Reiner Text, Literal und Pfad müssen unterscheidbar bleiben. Opaque Daten dürfen nicht noch einmal als Ausdruck interpretiert werden. |
| Selector-Vergleiche | `==`, `!=`, `>`, `>=`, `<`, `<=` werden in `equals`, `not-equals`, `gt`, `gte`, `lt`, `lte` übersetzt. | F04 prüft den Auswerterkontext: Model-Ausdruck, Vergleichsregel und Renderausdruck haben getrennte Fähigkeiten. |
| Boolesche Verknüpfung | `!`, `&&`, `||` und Klammern; Selector-Lowering verwendet u. a. `not` und bedingte `if`-Records. | Der View-Projector besitzt nicht dieselbe Operatorverteilung wie Model und DOM-Renderer. Kein ungeprüftes Durchreichen beliebiger Records. |
| Containment | `contains(value, search)` ist ein deklarativer Selector-Builtin; allgemeine JS-Funktionsaufrufe sind nicht erlaubt. | `contains`/`includes` und Filter-Regeln hängen zusätzlich vom konkreten Auswerterkontext ab. |
| String- und Format-Transforms | Model-/Renderer-APIs kennen u. a. Upper-/Lowercase-Aliase, `replace`, `concat`, `interpolate`, Byte-/Datums-/Dauerformatierung. | Nicht alle sind Source-Syntax oder PHP-portabel. Uppercase/Datumsformatierung funktionieren in der Node-Probe, werden im PHP-Gate aber abgewiesen. |
| Collections | API-Records für `map`, `filter`, `reduce`, `countBy`, `slice`; Selector-Source bietet zunächst Where/Find/Sort/Output. | Kein frei ausführbarer JS-Callback. Rule-, Item- und Key-Kontext müssen gesondert spezifiziert werden. |
| Model-Computes | `count`, `not-empty`, `empty`, `first`, `boolean` und verwandte API-Felder. | Nicht automatisch ein Operator derselben Schreibweise im DOM- oder Portable-Descriptor. |
| Lifecycle | Zehn Parseroperationen: Mount, Hydrate, Suspend, Resume, Invalidate, Dispose, Prewarm, Recycle, Detach, Reattach. Stream ist zusätzlich ein eigener Statementpfad. | HostController und Framework-Runtime besitzen einen anderen Methoden-/Capability-Vertrag; Syntaxannahme garantiert keine verfügbare Ausführung. |

### Tatsächlich ausgeführte kleine Operatorproben

| Probe | Model-Ergebnis | Portable-Node-Projektion | PHP-Target-Gate |
| --- | --- | --- | --- |
| `equals(2, 2)` als Ausdrucksrecord | `true` | Textliteral `"true"` | akzeptiert |
| `gt(2, 1)` als Ausdrucksrecord | `true` | seit F04 `operator_unsupported`; kein Artefakt | `operator_unsupported` |
| `uppercase("abc")` | `"ABC"` | `"ABC"` | `operator_unsupported` |
| `formatDateShort("2026-11-07")` | `"2026-11-07"` | `"2026-11-07"` | `operator_unsupported` |

Für PHP ist hier nur die Entscheidung von `createPortableRenderArtifact(..., {target: 'php'})` beobachtet, keine Ausführung des PHP-Renderers. Die Node-Seite wurde als Datenprojektion ausgeführt, ohne Browser oder tatsächliches DOM-Mounting. Die getrennten Werte sind im JSON-Inventar erhalten.

## 7. Neue Befunde aus A01

### A01-F01 – Selector-Quelle ohne Model-Auswertung: korrigiert

**Ursprünglicher Befund:** [selector-datasource.rmt](probes/selector-datasource.rmt) wurde ohne Diagnosen erfolgreich kompiliert. Der erzeugte State-Plan verwendete `from: "dataSource.remote"`. Der Aufruf

```js
createRmtStateSelectorRuntime(result.orchestrationArtifacts.state)
  .modelReader.select('picked');
```

lieferte tatsächlich den String `"dataSource.remote"`, keine Sammlung. Ursache: [parsePrimitiveSourceReference():1401](../../tools/rmt-language/vnext-parser.js#L1401) akzeptiert den Source-Kind als Identifier; das Lowering erhielt dessen Namespace. Die [Model-Referenzauflösung:260](../../xtendrmt/rmt-state-selector-runtime.js#L260) behandelt State-/Selector-/Derived-/Item-/Parameterreferenzen, aber keine DataSource-Ausführung. Eine unbekannte Referenzform fällt hier auf den String zurück.

**Korrektur:** Der semantische Graph verlangt jetzt eine Quelle und erlaubt nur `state` und `selector` mit bekanntem Ziel. Nicht ausführbare Quellenarten erzeugen `rmt.vnext.selector.source_kind_unsupported`, fehlende Quellen `rmt.vnext.selector.source_missing`. Beide Einstiege lehnen vor der Artefakterzeugung ab. DataSource-Effects bleiben möglich; ihre Ergebnisse müssen explizit durch Reducer in State übernommen werden. Die allgemeine Model-API wurde nicht verändert. Der [Teilvertrag](identity-and-selector-sources.md#2-selektorquellen) beschreibt Felder, Diagnosen und Grenzen.

### A01-F02 – Kollidierende Core-ID und Source-Ref: korrigiert

**Ursprünglicher Befund:** [core-identity.rmt](probes/core-identity.rmt) deklariert `app.One` und `app.one`. Der Compile war erfolgreich, aber beide State-Records erhielten `state:app.one`; beide Source-Refs waren `src:state:app.one`.

[normalizeIdSegment():90](../../tools/rmt-language/vnext-compiler.js#L90) normalisiert unter anderem auf Kleinbuchstaben, während die semantische Symbolauflösung die beiden Source-Namen unterscheidet. Eindeutige Source-Namen garantieren folglich für sich genommen keine eindeutigen Core-Identitäten. Das betrifft Navigation, referenzierte Records und zukünftige Resume-/Instanzadressen.

**Korrektur:** Alle Source-Map-IDs werden nach der Core-Erzeugung dokumentweit auf Eindeutigkeit geprüft, bevor App-/Kernel-/Orchestrierungsprojektionen sie konsumieren. Kollisionen erzeugen `rmt.vnext.core.id_collision` mit beiden Fundstellen; Core, JSON und abgeleitete Artefakte bleiben aus. Die Regel gilt auch ohne primitive Deklarationen sowie für gemappte Kindknoten. Bestehende eindeutige IDs und ihre Normalisierung bleiben erhalten. Der [Identitäts-Teilvertrag](identity-and-selector-sources.md#1-core--und-source-identitäten) grenzt die Prüfung von einer späteren Versions-/Instanz-/Resume-Migration ab.

### A01-F03 – Planwarnungen im Top-Level-Diagnosekanal: korrigiert

**Ursprünglicher Befund:** Die Variantenprobe ersetzt in `maraca-validation-app.rmt` die beiden `component x-input` durch `component x-button`. Der Compile war erfolgreich und seine Top-Level-`diagnostics` waren leer. Unter `orchestrationArtifacts.validation.diagnostics` entstanden dagegen zwei Warnungen `rmt.form_validation.component_capability_missing`.

Die frühere finale Compileraggregation las nur Render- und Hydration-Meldungen aus der umfassenderen Sammlung unter `orchestrationArtifacts.diagnostics`.

**Korrektur:** `diagnostics` enthält jetzt Parser, zuständige Semantik, Compiler und alle Orchestrierungspläne. Die Plankanäle bleiben erhalten; exakte Duplikate werden entfernt, unterschiedliche Felder und Fundstellen bleiben getrennt. Severity bleibt unverändert. Planmeldungen tragen `stage`, `plan` und Source-Map-Kontext; die beiden Validation-Warnungen zeigen auf ihre Felddeklarationen. Tooling und LSP übernehmen Herkunft und Range. Die Hydrangea-Paritätsprüfung berücksichtigt eine nun sichtbare semantische Payload-Contract-Warnung. Details stehen im [Diagnose-Teilvertrag](diagnostics-and-render-capabilities.md#1-diagnosekanäle).

### A01-F04 – Nicht ausführbare Node-Expressions: korrigiert

**Ursprünglicher Befund:** Die `gt`-Probe wird vom Model zu `true` ausgewertet. `createPortableRenderArtifact(..., {target: 'node'})` ließ den Ausdruck trotz Portable-Validierungsdiagnose zu und bewarb `targets: ["node"]`; `projectPortableRender()` produzierte aber ein leeres Textliteral. Der DOM-Expression-Auswerter besitzt keinen entsprechenden `gt`-Case und erreichte seinen Fallback.

Fundstellen: [Portable Target-Gate](../../xtendrmt/rmt-portable-render.js), [Model-Transforms](../../xtendrmt/rmt-state-selector-runtime.js#L331), [DOM-Ausdrücke](../../xtendrmt/rmt-dom-descriptor-renderer.js#L1322).

**Korrektur:** Node und PHP werden separat nach Render-, Model- und Regelkontext geprüft. Nicht ausführbare `gt`-Renderausdrücke und unbekannte verschachtelte Operatoren werden abgewiesen, auch bei importierten Artefakten. Model-Prädikate und passende Vergleichsregeln bleiben ausführbar. Node-Formatter wie Uppercase, Regex-Replace und Datumsformatierung bleiben Node-Fähigkeiten. Literale werden vor rekursiver DOM-Auswertung übernommen; Quelle und ausgelieferte Bundles sind synchronisiert. Der [Renderfähigkeiten-Teilvertrag](diagnostics-and-render-capabilities.md#2-renderprofile-statt-pauschaler-node-zulassung) beschreibt Profile, JSON-Pointer und Daten-/Ausdrucksgrenzen.

## 8. Entscheidung: geprüfter deklarativer AST als gemeinsame Compilergrenze

Der öffentliche Eingang ist der bestehende deklarative AST mit einem jetzt geschlossenen Feld-/Kontextschema, **nicht** das abweichende Dokument-JSON und **nicht** ein von Frontends selbst zusammengesetzter Ausführungsplan. RMT Classic erzeugt diesen AST; RMTX kann künftig in dieselben Knoten lowern. Die konkrete RMTX-Syntax bleibt A06. Core und App-/Kernel-/Service-/Orchestrierungsprofile bleiben abgeleitete, unabhängig versionierte Ausgaben. Der Vertrag ist unter [compiler-contract.md](compiler-contract.md) normiert und über die [öffentliche Dokumentation](../../docs/de/rmt-classic-contract.md) erreichbar.

`xtend.rmt.classic.compiler-contract.v1` / `1.0.0` benennt Eingangs- und Ausgabeversionen ausdrücklich. Die bestehenden AST-/Core-Wire-IDs, Root-Knoten und vNext-Exporte bleiben erhalten. Eine inkompatible Bedeutung oder Pflichtfeldform benötigt eine neue Majorversion mit Adapter. Der Name „Classic“ allein ist keine Formatmigration.

Kuratierte Regeln in `classic-ast-rules.js` erzeugen JSON-Schema und TypeScript-Typen. Die Laufzeit verwendet das generierte Schema und prüft zusätzlich Kohärenz, Kardinalität und Referenzen. Die Dateninventur wird dafür nicht als Spezifikationsgenerator benutzt. State-Initialtypen, statisch bekannte Root-Zuweisungen und Selector-/Validation-Zyklen werden diagnostiziert. Selektorpläne folgen stabil ihrer Abhängigkeitsreihenfolge; Herkunft und bisherige Core-Identitäten bleiben erhalten.

Nominale Anwendungstypen, externe Result-/Error-/Payload-Felder, XTension-Instanzen, neue RMTX-Lokalscopes und Framework-Fähigkeiten erhalten dadurch keine erfundenen Schemas. Die jeweiligen Host-/Featureverträge müssen diese Erweiterungen in A02–A06 ausdrücken. Das Classic-AST-Schema ist kein Validator für beliebiges fremdes Core-/Plan-JSON und keine neue Release-Schemafreigabe.

## 9. Umsetzungsstand und Anschlussarbeiten

| Teilaufgabe | Stand | Nachweis / nächster Schritt |
| --- | --- | --- |
| Erzeuger, Knotenfamilien und Felder erfassen | erstellt | 57 Inhalts-Hashes, 15 Quellen, 122 Knotentypen, 23 Core-Listen, 301 Artefakt-Pfadmuster; deterministisches `--check`. |
| Schema-Governance zuordnen | lesend abgeglichen | Producer, formelles Schema, Beobachtung und Release-Freigabe getrennt. Keine Acceptance-Baseline überschrieben. |
| F01–F04 korrigieren | implementiert und regressionsgeprüft | Identitäten, Selektorquellen, Diagnoseaggregation und getrennte Renderprofile. |
| Pflicht-/Alternativfelder und Referenzregeln | implementiert für den gemeinsamen AST-Eingang | Geschlossene Varianten, Kontexte, Kardinalitäten und Kohärenz; semantische Negativfälle und tatsächliche Model-Ausführung. |
| Gemeinsamen Eingang samt Versionierung auswählen | implementiert | Classic-APIs, öffentliches JSON-Schema, generierte Typen, Source-/AST-/Kompatibilitäts-Parität. |
| Erweiterungen für RMTX und XTensions 2.0 | offen, A02–A06 | Instanz-/State-Vertrag, ausführbare Kernel-Integration, Buildkette, SSR/Resume und Syntax/DX. |

Die Inventur und der gemeinsame Eingangsvertrag liefern die Basis für die weiteren Implementierungen. Ein vollständiges 0.9-Release-Gate setzt beide Features voraus und bleibt im [Releaseplan](../../scripts/release/feature-scope.json) gesperrt, bis passende Ausführungsnachweise vorliegen.

## 10. Prüfung der F01-/F02-Korrekturen

Die neuen Compiler-Regressionen schlugen vor der Korrektur an den erwarteten Prüfgrenzen fehl. Nach der Korrektur bestanden unter Node 24.22.1:

| Suite | Bestandene Assertions / Gruppen |
| --- | --- |
| `rmt-vnext-compiler` | 464 |
| `rmt-semantic-graph` | 148 |
| `rmt-vnext-parser` | 89 |
| `rmt-linter-rules` | 97 |
| `rmt-linter-cli` | 59 |
| `rmt-language-server` | 70 |
| `rmt-artifact-parity` | 291 |
| `maraca-plan` | 115 |
| `rmt-jit-hydrangea` | 5 Fixture-Gruppen |
| `rmt-reference-docs` | 694 |

Berichte dieser Sitzung: `/tmp/xtend-a01-before.json`, `/tmp/xtend-a01-core.json`, `/tmp/xtend-a01-integration.json`. Die vorhandenen isolierten Testabhängigkeiten wurden nur vorübergehend verknüpft und die Links danach entfernt; keine Manifest-/Lockfile-Änderungen. Inventar-Regeneration und `--check` bestehen mit 15/15 positiven Quellen, 122/122 AST-Knotentypen und den beiden nun diagnostizierten Negativproben ohne ausgegebene Artefakte. Diese gezielten Prüfungen sind kein vollständiges 0.9-Release-Gate.

## 11. Prüfung der F03-/F04-Korrekturen

Die neuen Fehlerfälle wurden vor der Korrektur reproduziert. Nach der Umsetzung bestehen 17 betroffene Suites unter Node 24.22.1: Compiler (492 Assertions), semantischer Graph (148), DOM-Renderer (292), Model/State (262), Artefakt-Parität (291), RMT-Typ-Exports (478), Maraca Plan/Validation/Transitions/Orchestration (115/65/87/148), LSP (73), Linter (97), Referenzdokumentation (694), SSR Pages (52), Node/PHP-Parität (16), Node-SSR-Adapter (123) und Hydrangea (5 Fixture-Gruppen). Die SSR-Prüfung umfasst einen gepackten TypeScript-Consumer sowie Literalverhalten in Quelle und allen drei Runtime-Bundles.

Der erste Integrationslauf bestand bis auf einen Hydrangea-Erwartungshash. Eine lesende Rekonstruktion des bisherigen Diagnosekanals ergab für alle acht Fixtures identische frühere Hashes und unveränderte Core-/Status-/Preview-/Maraca-Ergebnisse. Einziger Unterschied ist die nun sichtbare Warnung `rmt.vnext.primitive.payload-contract-missing` in `kernel-orchestration-contract.rmt`. Nur dessen Compilerhash in `tests/performance/hydrangea/evidence/contracts.json` wurde angepasst; der anschließende Hydrangea-Lauf besteht einschließlich JIT-/Legacy-Parität. Dies ist eine gezielte Test-Erwartungsänderung, keine Schema-Freigabe.

Berichte: `/tmp/xtend-a01-f03-f04-final.json` (16 Suites bestanden, historischer Hydrangea-Hashfehler), `/tmp/xtend-a01-f03-hydrangea.json` (anschließend bestanden), `/tmp/xtend-a01-hydrangea-audit.json` (Hashprüfung). Der kanonische Kernel-Lab-Build wurde ausgeführt; sein abschließender `--check` meldet `current`, null Änderungen. Temporäre Dependency-Links sind entfernt; Paketmanifeste und Lockfiles bleiben unverändert. Der aktualisierte Inventarstand umfasst weiterhin 15/15 positive Quellen und 122/122 AST-Knotentypen. Ein vollständiges 0.9-Release-Gate wurde nicht ausgeführt.

## 12. Ergänzende Vertragsregressionen

Der neue Eingang weist unter anderem unbekannte Felder/Knoten, falsche Kindkontexte, unvollständige Varianten, widersprüchliche Hilfsknoten/Pointer, doppelte singuläre Clauses, unsichere Objektschlüssel, Accessors, sparse Arrays und zusätzliche Arrayfelder ab. Semantische Negativfälle prüfen unbekannte Inputs/State-/Selector-Ziele, Status und Validation-Includes, Root-Typen sowie Zyklen. Positive Nachweise umfassen alle 15 Corpusquellen, Source-/AST-/Legacy-Core-Parität, einen strikten TypeScript-Consumer und tatsächliche Selector-Auswertung nach State-Änderungen. Ein unabhängiger Draft-07-Validator akzeptiert das Schema und alle 15 ASTs.

Die Prüfungen machten zusätzliche Altfehler sichtbar: Die Primitive-Fixture deklarierte ihren Action-Status-State nicht; mehrere öffentliche Beispiele ließen State-, Surface- oder Include-Ziele aus. Diese Beispiele sind nun eigenständig kompilierbar. Migration blockiert den fehlenden Status-State statt einen ausführbaren Plan zu behaupten. State-Initialblöcke ohne `preserve` werden korrekt abgegrenzt. Wiederholte Surface-Cleanup-Clauses werden vollständig ins Core übernommen; bisher wurde nur die erste gelesen. Die historische Releasehilfe verweist auf die aktuellen lokalisierten Docs und kanonischen Demopfade. Historische Sprach-Abnahmen bleiben von der neuen 0.9-Feature-Abnahme getrennt.

## 13. Abschließende Prüfung von Vertrag und 0.9-Vorbereitung

31 betroffene Suites bestehen über die abschließenden Läufe: Compiler (608 Assertions), semantischer Graph, Parser, Tooling, Editor-Packaging, historischer Sprach-Handoff, Imports, Regression, Migration, Remote-Tooling, Typ-Exports, LSP, Linter, Artefakt-Parität, Referenzdokumentation, öffentliche Docs-Qualität/Tiefe/Shell, Maraca Plan/Validation/Transitions/Orchestration, Hydrangea, DOM, State, SSR Pages, Node/PHP-Parität, Node-SSR-Adapter, AI-Developer-Kit und Release-Sicherheit. Der letzte Release-Sicherheitslauf besteht mit **634/634 nativen Testfällen** und führt echte Offline-Consumer-Installationen samt TypeScript aus.

Die Sprach-/Integrationsprüfungen liefen unter Node 24.22.1. Für die vollständige Release-Sicherheit wurden exakt die Repository-Pins **Node 24.18.0 und npm 11.17.0** sowie die vorhandenen TypeScript-/semver-/tar-Pins temporär unter `/tmp` bereitgestellt. Frühere Release-Abbrüche lagen an fehlenden Pins bzw. am erwarteten lokalen TypeScript-Pfad; Guards wurden dafür nicht gelockert. Temporäre Links im Checkout sind entfernt. Paketstände sind weiterhin konsistent bei 0.9.0.

Nachweise dieser Runde: `/tmp/xtend-classic-release09-verified.json` (28 bestandene Suites; die damaligen zwei Abbrüche anschließend separat korrigiert/geprüft), `/tmp/xtend-release09-knowledge-final.json` (AI-Kit und Regression bestanden) und `/tmp/xtend-release09-safety-final.json` (Release-Sicherheit bestanden). Schema-/Typgenerator, Inventar, Docs-Navigation/Suche und Kernel-Lab melden keinen Drift; unabhängige Draft-07-Validierung und beide Classic-Paketexporte sind geprüft. Das AI-Kit verweist auf den neuen Vertrag und korrigiert den alten DataSource-Selektorhinweis; das deterministisch neu erzeugte MCP-Wissen enthält 178 Artikel je Sprache.

`release:features:plan` besteht mit beiden Pflichtfeatures. `release:features:check` meldet erwartungsgemäß `ready: false` mit genau RMTX und XTensions 2.0 als offenen Abnahmen. Das ist kein vollständiger 0.9-Release-Readiness-Nachweis und keine Veröffentlichung; nach der Featureimplementierung sind passende aktuelle Featureprofile und Ausführungsnachweise erforderlich.

## 14. GitHub-Gates für die Entwicklungsvorbereitung

`npm run check:release-preparation` prüft Schema-/Typ-Drift, dieses Inventar, synchronisierte Paketversionen und den 0.9-Featureplan. Der Check läuft blockierend in beiden regulären Node-Lanes für PR/Push sowie im Migrationsworkflow. Nightly führt ihn als eigene blockierende Phase vor dem vollständigen Testlauf; Fehler werden auch in Session, Manifest und abschließendem Jobstatus berücksichtigt. Noch offene Featureimplementierungen sind im Entwicklungsplan zulässig. Die endgültige Versiegelung und Publish-Grenze verlangen weiterhin Feature-Readiness und die bestehenden authentifizierten Nachweise.

Das Core-Inventar wird für die neuen Quellen und die geprüften Diagnose-/Compilerbeobachtungen fortgeschrieben. Die erste formelle Autorität des Classic-AST bleibt ausdrücklich unveröffentlicht und an Schema-, Validator-, Typ- und Testquellen gebunden. Eine gesonderte enge Registrierung erhält den bisherigen Wire-Discriminator; bestehende veröffentlichte Fingerprints und die historische Auditdatei werden nicht überschrieben. Eine zusätzliche Negativprobe weist eine gefälschte Caller-Registrierung mit manipulierten Bindungen, Freigabe-/Aliasbehauptungen und kanonischen Quellen zurück; bestehende Negativproben bleiben erhalten. Neue Quelldateien werden in einer isolierten Git-Kopie unter `/tmp` durch denselben Quelltransport wie CI geprüft. Diese lokalen Nachweise ersetzen die GitHub-Läufe auf dem späteren Commit nicht.

CI baut bereits für Pull Requests Kandidaten für echte Consumer- und Browserprüfungen. Deshalb verlangt `pipeline.prepare` den vollständigen gültigen Featureplan; offene Implementierungen sind dabei zulässig. `pipeline.seal` prüft nach der Artefaktverifikation und vor jeder Manifeständerung die Feature-Readiness, ebenso die tatsächliche Publish-Grenze. Es gibt keinen Entwicklungs-Bypassschalter. Die bisherigen Quell-, Authentifizierungs-, Browser- und Paketprüfungen bleiben erforderlich.
