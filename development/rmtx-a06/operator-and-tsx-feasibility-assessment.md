# A06 Vertiefung der RMT Operatorsemantik und TSX Machbarkeit

**Aktuelle Einordnung vom 21. November 2026:** Dieser Bericht bleibt eine historische Entscheidungsvorbereitung vom 15. November. Inzwischen ist die [TSX-nahe deklarative RMTX-Syntax](syntax-decision.md) angenommen, der produktive Frontend-/Operatorumfang ist implementiert und [A06.5 – Projekt-/Editorintegration](project-tooling/implementation.md) ist umgesetzt und lokal geprüft. Die nachfolgend diskutierten Gegenkandidaten und offenen Syntaxfragen sind deshalb keine heutigen Architekturentscheidungen. Den noch offenen gemeinsamen Ziel- und Releaseabschluss beschreibt [A06.6](release-acceptance/implementation.md). Historische Probes, Fehlerbeobachtungen und Quellenpins behalten ihren ursprünglichen Stand; Source 4–8 bleibt für SSR/Adoption gesperrt.

Stand: **15. November 2026**. Geprüfter Ausgangscommit: `02dcd815ebe4ddca196e82163191fe7360b95a05`. **Entscheidungsvorbereitung; keine beschlossene RMTX-Syntax und keine Änderung produktiver Sprach- oder Runtimeverträge.**

**Nachtrag:** Die nachfolgend dokumentierten Backendfehler und Knowledge-Lücken beschreiben den Prüfstand vor der Korrektur. Die [Backend-Patches](operator-backend-fixes.md) und das [lokale MCP-Update](../mcp-local-update.md) schließen diese Befunde; die TSX-Empfehlung und ihre Abnahmekriterien bleiben bestehen. Historische Runtimebeobachtungen stehen im [Before-Fix-Nachweis](operator-runtime-evidence.before-fix.json), aktuelle Regressionen im Patchbericht.

## 1. Empfehlung für die weitere Entwicklung

**Die TSX-kompatible Grammatik sollte als bevorzugtes Ziel weiterverfolgt werden.** Die aktuellen RMT-Operatoren lassen sich als explizite Strukturoperatoren, geschlossene Ausdrücke und typisierte deklarative Konfiguration darstellen. Weder Lane-Planung noch Lifecycle, Ressourcenbesitz, Streaming oder Remote-Policies erzwingen eine andere Oberflächengrammatik. Die vollständige Bestandsaufnahme liefert dafür kein grundsätzliches Syntaxhindernis.

Die geeignete Architektur ist ein **statisches RMT-Frontend vor dem gewöhnlichen JSX-Emit**: Es löst Compilersymbole auf, prüft erlaubte Ausdrucksformen und Kontexte und erzeugt versionierte, validierte RMT-Daten. Orchestrierungsdeklarationen dürfen innerhalb eines solchen TSX-Moduls auch kompakte typisierte Konfigurationen sein. Ein Zwang, jeden Reducer und jedes Policyfeld als Tag zu schreiben, ist fachlich nicht begründet.

**Gewöhnliches Framework-TSX und eine JSX-Factory allein reichen dafür nicht aus.** JavaScript wertet Attribute und Kinder aus, bevor eine Factory ihre Werte erhält. Dabei gehen deklarative Pfade, ursprüngliche Ausdrücke und nicht gewählte Zweige als Compilerinformation verloren; freie Effekte und Closures treten hinzu. React-Lifecycle ersetzt weder native Surface-Epochen noch Fabric, Ressourcenleases oder RMT-Admission. Framework-TSX bleibt im ausdrücklich begrenzten XTension-Provider sinnvoll.

Die wichtigste Gegenoption bleibt **Classic-Orchestrierung mit einer TSX-View**, insbesondere bei großen Actions und Policies. Sie sollte im nächsten Spike am selben vollständigen Funktionskorpus mit der TSX-Modulvariante verglichen werden. Eine eigene JSX-ähnliche Sprache mit Sonderbindern oder eine reine Tagsprache wäre erst dann vorzuziehen, wenn sie dabei einen nachgewiesenen DX-/AX-Vorteil erzielt. Derzeit ist ein solcher Vorteil nicht belegt.

Zwei Ergebnisse schärfen die bisherige A06-Empfehlung:

1. Bereits gleich aussehende Operatorzeichen können unterschiedliche Bedeutung haben. **Classic-Text darf nicht unverändert in TSX kopiert werden.** Es braucht einen ausdrücklich spezifizierten Ausdrucksvertrag und eine AST-basierte Migration.
2. Der heutige Backendpfad enthält nachgewiesene semantische Lücken. **Ein neuer Frontend-Parser darf diese nicht durch eine hübschere Oberfläche verdecken.** Eventbedingungen, Reducer-Referenzauflösung und Action-Result-Handler müssen vor einer vollständigen Paritätsfreigabe korrigiert oder für das betreffende Ausgabeprofil ausdrücklich abgewiesen werden.

## 2. Prüfgrundlage und Reichweite

Die Prüfung verbindet drei unabhängige Codeanalysen mit tatsächlich ausgeführten Experimenten. Maßgeblich sind die aktuellen Parser-/AST-Regeln, Compiler-Loweringpfade und jeweiligen Auswerter. MCP-Wissen und frühere Planungsberichte liefern Kontext; sie ersetzen diese Belege nicht. Die Anweisungen im AI Kit beschreiben das heutige Classic-Authoring und werden nicht als übergeordnete Vorgabe gegen eine neue RMTX-Sprache behandelt.

| Ebene | Geprüfter Umfang | Aussagekraft |
| --- | --- | --- |
| XTend MCP | Tatsächlicher lokaler stdio-Server, Initialisierung, Tools, Ressourcen, Prompts, Retrieval und elf Compiler-/Plan-Proben | Belegt den Zugriff und die jeweilige deterministische Toolantwort; keine App-Ausführung |
| Classic-Sprache | Lexer, Parser, geschlossener AST-Vertrag, Compiler und A01-Inventar mit **122/122** Knotentypen | Vollständiger Katalog der heutigen AST-Konstruktoren und Syntaxfamilien; keine Gleichsetzung mit 122 eigenständigen Runtimefeatures |
| Operatorsemantik | Echte Classic-Selektoren im Model, TS-AST/Typprüfung sowie native Maraca-/DOM-/Action-Gegenproben | Belegt konkrete Werte, Phasen und Loweringverluste für die beschriebenen Fälle |
| Bestehende Regressionen | 20 RMT-Suites sowie 24 MCP-Tests | Breite Kontrolle mit ausdrücklich dokumentierten bestehenden Fehlschlägen |
| Aktuelle Integrationsarbeit | A01–A05, Zwei-Host-Vertrag, Provider-Interfaces, statisches und wiederholtes Komponentenprofil einschließlich SSR v2 | Vorhandene Backendbausteine und Integrationsgrenzen; kein bereits implementiertes allgemeines RMTX-Frontend |

Nachweise: [AST-Inventar](operator-inventory.json), [MCP-Audit](operator-mcp-evidence.json), [25 TSX-/Ausdrucksproben](operator-tsx-evidence.json), [native Runtime-Gegenproben](operator-runtime-evidence.json), [bestehende Suites](operator-suite-evidence.json). Quellhashes binden die Beobachtungen an diesen Stand.

## 3. Was der XTend MCP Server tatsächlich liefert

In dieser Sitzung war kein XTend-MCP-Endpunkt als verbundenes Tool verfügbar. Deshalb wurde der **unveränderte lokale Server** aus `products/xtend-mcp` über sein echtes stdio-Protokoll geprüft. Die isolierten SDK-Abhängigkeiten lagen außerhalb des Repos; temporäre Abhängigkeitslinks wurden entfernt. Die getrackte MCP-Konfiguration wurde nicht geändert.

| Gegenstand | Beobachtung |
| --- | --- |
| Server / Node / Protokoll | XTend MCP **0.1.0**, Node **24.18.0**, ausgehandelte Protokollversion **2025-11-25** |
| Standardtools | **6**: Knowledge Search, Knowledge Context, RMT Diagnostics, RMT Compile Check, Maraca Plan, Repair Plan |
| Schreibtool | Optionales siebtes Tool für Safe Repairs; im Audit nicht verwendet |
| Ressourcen | **398**: 356 DE-/EN-Dokumente, 32 Referenzrecords, 6 Rezepte, 2 Kataloge und 2 statische Kit-Ressourcen |
| Weitere Schnittstellen | 4 Resource Templates, 6 Prompts |
| Operatorreferenzen | **25** der 32 Kit-Referenzrecords; übrige Records sind vier Diagnose- und drei CLI-Einträge |
| Tatsächliche Compiler-/Plan-Proben | Drei reale Dateien einschließlich `scoped-products.rmt` kompilieren und planen; zwei Inline-Rezepte sowie Top-Level-State und Animation kompilieren; freier Aufruf in `when` wird abgewiesen |

Die Standardtools delegieren an die Tooling-Bridge. Sie führen keine React-/Vue-App, keinen Transport und keinen Lifecycle-Worker aus. Ein `compiled`-Status ist deshalb weder ein SSR-Nachweis noch eine Zusage, dass jeder im Core vorhandene Satz im gewählten Runtimeprofil ausgeführt wird. [Serverregistrierung](../../products/xtend-mcp/src/server.mjs#L229), [Tooling-Delegation](../../products/xtend-mcp/src/tooling.mjs#L119).

Der Knowledge-Bestand kommt bevorzugt aus den **paketierten generierten Dateien**. Der Cache bindet Konfigurationspfade und ist keine Live-Grammatikintrospektion. Der Generator erfasst `docs/de` und `docs/en`, aber nicht die Development-Berichte. Einzelne Suchanfragen sind auf zehn Treffer und Kontextantworten auf 20.000 Zeichen begrenzt. Für diesen Audit wurden daher Kataloge und konkrete Ressourcen zusätzlich gelesen. [Knowledge-Laden](../../products/xtend-mcp/src/knowledge.mjs#L84), [Cache](../../products/xtend-mcp/src/knowledge.mjs#L269), [Generator](../../products/xtend-mcp/scripts/build-knowledge.mjs#L58).

### Bestätigte Knowledge- und Konfigurationslücken

- `build-knowledge.mjs --check` scheitert an `docs.jsonl`: Die gebündelten deutschen und englischen **Release-0.9-Dokumente sind veraltet**. Sie beschreiben einen früheren XTensions-Stand. Die übrigen 354 Dokumentrecords stimmen mit ihren aktuellen normalisierten Quellen überein.
- Im gebündelten Kit-Manifest sind **7 von 43 Quellhashes veraltet**: beide FastPass-/Abort-Boundary-Seiten, beide Release-Seiten, Classic-/vNext-Compiler-Deklarationen und Maracas öffentliche Deklaration. Ein alleiniger MCP-Doc-Rebuild regeneriert diese Kit-Provenienz nicht automatisch.
- Die getrackte `.vscode/mcp.json` enthält `servers: {}`. Der bestehende Integrationstest erwartet dort einen XTend-Catfoodingeintrag. Das betrifft diese Konfiguration, nicht die beobachtete Funktionsfähigkeit des lokal gestarteten Servers.
- Die 25 Operatorrecords sind verkürzt: etwa `state` wird nur unter `template` geführt, obwohl der echte Compiler Top-Level-State akzeptiert. Animation, SearchSource, Remote, weitere Lifecycleformen und mehrere Policy-/Surfaceclauses haben keine eigenen Kit-Operatorrecords.

Die vorhandene MCP-Suite besteht **22 von 24 Tests**, einschließlich HTTP-/stdio-Security und Eingabegrenzen. Die zwei verbleibenden Fehler entsprechen dem Knowledge-Drift und der leeren Catfoodingkonfiguration. Eine anfängliche isolierte SDK-Auflösungsgrenze wurde beseitigt und zählt nicht als Serverfehler. Diese Ergebnisse sind **keine vollständige MCP-Gate-Freigabe**. [Hashvergleich und Testklassifikation](operator-mcp-evidence.json).

Für RMTX folgt daraus: Der Server muss künftig die Quellsprache und Syntaxversion ausdrücklich unterscheiden und RMTX-Quellen mit dem neuen Frontend prüfen. Ein heutiger Classic-Compile-Check ist kein RMTX-Check. Der maschinenlesbare Operator-/Capabilitykatalog sollte aus kuratierten Sprachregeln, konkreten Loweringpfaden und Runtimeverträgen entstehen; Kit-Häufigkeiten und Suchtreffer sind dafür keine Definitionsquelle.

## 4. Vollständige Funktionsfamilien und TSX-Abbildung

Die historisch `vnext` genannten Modul- und Wire-Namen gehören weiterhin zu **RMT Classic**. Daneben existiert der ältere JSON-Dokumenteingang. Dieser liest JSON und enthält keine zweite Pipe-/Race-/Parallel-Symbolsprache. Kernelbegriffe wie Lease oder Channel sind ebenfalls nicht automatisch eigenständige textuelle RMT-Operatoren. [Legacy-Eingang](../../tools/rmt-language/parser.js#L50), [Classic-Vertrag](../../tools/rmt-language/classic-ast-rules.js#L45).

Die folgende Tabelle erfasst sämtliche deklarativen Familien einschließlich der Klauseln und Policies. Details und Parserfundstellen aller 122 Knotentypen stehen im [vollständigen Inventar](operator-inventory.json).

| Familie | Heutige Funktion und Ausführungsgrenze | Geeignete TSX-Repräsentation / zentrale Anforderung |
| --- | --- | --- |
| Dokument, Template, Import, Identität | Statische Datei-/Glob-Imports; qualifizierte und escaped IDs; gemeinsamer Symbol- und Herkunftsvertrag. Template-Verschachtelung erzeugt keinen beliebigen JS-Lexikalscope. | Explizite Template-/Moduldefinition und dauerhafte IDs. ES-Modulimport und RMT-Glob-Import getrennt behandeln; Importalias symbolisch auflösen. |
| Werte, Typen, State, Initialwerte, Preserve | Geschlossene Literal-/Pfad-/Array-/Objektwerte; Model ist zuständig für kontrollierten State. Funktionen, Accessors und unsichere Pfade sind keine AST-Daten. | Statische Literale und typisierte Referenzen; keine automatische Gleichsetzung von JS-Objekt, Modelpfad und lokalem Framework-State. |
| Selector, Where, Find, Sort, Output | State-/Selectorquelle; Filter, erstes Match und Sortierung im Model; kein freies IO. Sortierung verwendet String-/Localevergleich auf einer Kopie. | Compile-only Selector-Deklaration mit geschlossenem Ausdruckssatz und lesbaren Dependencies. `.filter`, `.find`, `.sort` nur als ausdrücklich zugelassenes Muster; keine pauschale JS-Semantik. |
| DataSource, Contract, Result, Fallback | Deklarative Quellen und Adaptermetadaten; konkrete IO benötigt einen injizierten Hostadapter. Ein Sourcekind allein liefert keinen Transport. | Explizite DataSource-/Effectdefinition. Kein Fetch während der Auswertung des Authoring-Moduls. |
| Action, Input, Status, Reduce, Recipe, Effect, Emit, Result-Handler | Deklarative Befehle mit festen Ausführungsphasen. FastPass besitzt eigene enge Verbote. Result-Handler und Emit haben die in Abschnitt 8 dokumentierten Grenzen. | Typisierte Actionreferenzen und statische Konfigurationen oder Operatoren. Kein Ersatz durch beliebige Eventcallbacks oder imperative Quellreihenfolge. |
| Events, Arrow-Binding, Payload, PreventDefault | DOM-Ereignis/Selector/Target wird auf Action und Payloadvertrag abgebildet. Provider-Payloads werden zusätzlich gegen das Provider-Interface geprüft und gemappt. | Explizites Event-/Intentbinding. `-> action` ist eine deklarative Kante, keine JavaScript-Arrowfunktion. DOM- und Provider-Governance getrennt erhalten. |
| Surface, Component, Source, Repeat, Key, Bounds, Preserve, Destroy | Struktur, Layout und Ressourcenzuordnung; wiederholte Hosts verwenden die vorhandene typisierte A02-Materialisierung. Owner und Renderziel können verschieden sein. | Surface-/Repeatoperatoren und ausdrückliche Rollen. JSX-`children`, React-`key` und native Resource-Ownership nicht gleichsetzen. |
| Lane, Weight, Scheduling | Schedulerklasse mit Priorität, Budget, Deadline, Yield, Coalescing und Backpressure. Name ist kein vollständiger Lade-/Aktivierungstrigger. | Sichtbarer Laneoperator oder Lane-Metadatum mit begrenzter Wirkung. Keine Vermischung mit React-Prioritäten oder einer unbekannten Visibilitypolicy. |
| Lifecycle | `mount`, `hydrate`, `suspend`, `resume`, `invalidate`, `dispose`, `prewarm`, `recycle`, `detach`, `reattach`; unterschiedliche Phasen, Capabilities und Idempotenzregeln. | Alle zehn Formen können eigene Compileroperatoren sein. Framework-Mount/Unmount oder `return null` ersetzen diese Unterschiede nicht. |
| Stream | Eigene Source, Conditions und Policy; Transport, Backpressure, Patches und Completion benötigen konkrete Host-/Kernelpfade. | Eigenes Streamintrinsic und geschlossene Metadaten; kein impliziter AsyncGenerator, `useEffect` oder Suspense-Ersatz. |
| Slot und Policyblock | Slot enthält Lifecycle-/Streamarbeit; ist keine allgemeine Framework-Childrenkomposition. | Operator mit explizitem Kontext. Ein RMT-Slot darf nicht still zu einem React-Child oder Vue-Slot werden. |
| Trust, Sanitize, Hydration, Resumability, Isolation | Angefragte Fähigkeiten, Sicherheitsgrenzen und Modusinformationen. Konkrete Adapter und Signaturautorität kommen aus dem Host-/Deliveryvertrag. | Geschlossene Policynodes/-records. Eine JSX-Eigenschaft mit Hash oder Modus verleiht keine Ausführungsautorität. |
| Portal, Overlay | Hostroot, Layer/Z und Overlaypolicies; native logische Eltern und tatsächlicher DOM-Ort können abweichen. | Explizite Referenzen/Operatoren, nicht bloß Frameworkportal-Aufrufe. Fokus-, Scroll- und Destroyzuständigkeit erhalten. |
| Resource, Owner, Source, Import, Dispose | Besitzergebundene Erwerbs-/Freigabewege etwa für ObjectURL, Stream, Observer, Timer oder Lazy Import. | Ressourcen-/Capabilitydeklarationen. Garbage Collection oder Framework-Unmount ersetzen keine Leases. |
| SearchSource | Query-/Selection-State, Resource/Fallback, Fieldweights, Limits, Debounce, Templates, A11y und Locale als Konfiguration. | Typisierte statische Deklaration besonders geeignet. Kein unbekanntes dynamisches Prop-Spread anstelle der Kontrakte. |
| Validation | Blocking/Advisory, Actiontargets, Includes, Required/Email/Length/Pattern/Message; separater Evaluator und Viewprojektor, begrenzte Component-Capabilities. | Schema-/Regeldeklaration mit nativen Actiongates. HTML-Attribute oder eine Frameworkbibliothek allein erhalten die RMT-Semantik nicht. |
| Animation, Transition | Preset/Effect, Dauer/Easing/Spring, Keyframes/Timeline, Surfacewechsel, Lane, Layoutkey, Interrupt und Reduced Motion. Sichere Properties und Filter-Opt-in bleiben relevant. | Statische Records und explizite Transitionoperatoren. `interrupt replace` ist eine Policy, kein allgemeiner Canceloperator. |
| Remote Surface, Expose, Cross-Surface Event | Team-/Versions-/Origin-/Integrity-/Trust-/Fallbackverträge und gerichtete Eventkanten; eigene Compatibility-/Securitypfade. | Explizite Remote-/Eventdefinition mit Provenienz. Freier dynamischer Import oder gewöhnliche Komponente kann diese Autorisierung nicht ersetzen. |

### Lanes, Lifecycle und Hydrangea genauer

Die sechs kanonischen Lanes sind **user-blocking, visible, transition, idle, background und diagnostics**. `critical`, `urgent` und `input` sind beispielsweise Aliase für user-blocking. Die älteren Dokuwerte `resource` und `a11y` sind im aktuellen Normalisierer weder Canonicals noch Aliase; unbekannte Namen werden als unbekannt markiert und auf visible zurückgeführt. Ein neuer Sprachvertrag sollte diese Fälle ausdrücklich diagnostizieren statt aus der älteren Tabelle neue Fähigkeiten abzuleiten. [Lane-Vertrag](../../tools/rmt-language/scheduler-lanes.js#L5).

Die Lifecycle-Matrix spezifiziert pro Operation Phase, erforderliche Capability und Idempotenz. Ihr Planer kann mit Adaptern/Probes prüfen, ohne damit jede reale DOM-Operation auszuführen. Native Surface Controller, Resource-Graph und konkrete Hydration-/Componentadapter bleiben die jeweiligen Ausführungsautoritäten. Die neue Syntax muss erhalten, **welche** Operation angefragt wird; ihre tatsächliche Verfügbarkeit ist eine zusätzliche Capabilityprüfung. [Lifecycle-Matrix](../../tools/rmt-language/vnext-lifecycle.js#L24).

Hydrangea ist der **JIT-Compile-/SafePreview-/optionale Maraca-Bridgepfad**, kein zusätzlicher Renderer und kein allgemeiner Ausdrucksauswerter. RMTX braucht dort eine ausdrücklich unterstützte Frontend-/Dialektstrecke, neue Quell-/Cachefingerprints und korrekte Diagnoseherkunft. Das ist Integrationsarbeit unabhängig von der Wahl der Winkelklammern. [Hydrangea](../../docs/de/rmt-jit-hydrangea.md).

## 5. Ausdrucksoperatoren mit tatsächlicher Semantik

Der Classic-Lexer erkennt die Doppelzeichen `->`, `==`, `!=`, `>=`, `<=`, `&&`, `||`. Dazu kommen einzelne Gruppen-/Satzzeichen. Ein `=>`, `|>`, `await`, eine imperative Schleife oder ein freier Funktionskörper ist kein aktueller Classic-Quelloperator. [Lexer](../../tools/rmt-language/vnext-parser.js#L308).

| Form | Tatsächliche Classic-/Model-Bedeutung | Folge für ein TSX-Zielprofil |
| --- | --- | --- |
| Literale und qualifizierte Pfade | Geschlossene Werte/Referenzen; Dezimalzahlen werden unterstützt. Negative Selector-Literale werden derzeit abgewiesen. | Gemeinsames erlaubtes Literalset ausdrücklich definieren; allgemeine JS-Syntax ist nicht automatisch eine Backendfähigkeit. |
| `()` | Gruppierung im Ausdrucks-AST | AST-Gruppen erhalten; Migration darf nicht auf Textgleichheit vertrauen. |
| `!` | Negation; Classic-Vergleiche binden stärker als `!` | Neue TSX-Quelle nach normaler TS-Präzedenz lesen. Beim Migrieren Classic-AST semantisch klammern. |
| `==`, `!=` | Selector-Lowering erzeugt `equals`/`not-equals`; der Model-Auswerter vergleicht **strikt** | Für die neue Sprache `===`/`!==` als klare Abbildung prüfen; JS-`==`/`!=` zunächst ablehnen statt still Koerzionsgleichheit zu versprechen. |
| `>`, `>=`, `<`, `<=` | Relationale Model-/Prädikatoperationen; der Modelvergleich nutzt die entsprechenden JS-Relationen | Nur für ausgewiesene Typen/Kontexte zulassen. String-/Numberkonversion und Targetprofil nicht implizit erweitern. |
| `&&`, `\|\|` | Deklarative logische Conditions; werden zu bedingten Records normalisiert | Im Conditionkontext absenken. JSX-Childwahl wie `count && <Card/>` hat zusätzliche JS-Wert-/Rendersemantik und ist kein automatischer Alias. |
| `contains(a,b)` | Einzige zugelassene Selector-Callform; im Model String-Containment nach Konversion | Eigenes semantisch aufgelöstes Intrinsic. Nicht pauschal in `.includes()` umschreiben. |
| `-> action` | Ereignis-/Actionreferenz, keine auswertbare Funktion | Explizite Bindingmetadaten. JavaScript-Arrowfunktionen nur in dafür freigegebenen Compile-only Scopes. |
| `reduce ... = ...` | Deklarative Modeländerung; der semantische Classic-Validator begrenzt die RHS auf skalare Literale oder ausdrückliche State-/Selector-/Input-/Result-/Error-/Payloadpfade | Keine freie Zuweisung als JSX-Ausdruck und kein zweiter Mutationseinstieg. Die Runtime muss die tatsächlich zugelassene Referenzform ebenfalls ausführen können. |
| Arithmetik, `??`, `?.`, `?:`, beliebige Calls | Kein allgemeiner Teil des aktuellen Classic-Ausdrucks-Subsets | Ein neues Profil darf solche Formen erst mit definierter Abbildung einführen. JSX selbst kann sie parsen; das ist keine semantische Freigabe. |

### Drei tatsächlich unterschiedliche Resultate

Jeder folgende Fall wurde durch Classic-Parser, Compiler und echten Model-Auswerter verarbeitet. Die jeweiligen JavaScript-Vergleichsprogramme bestehen **strikte TypeScript-Prüfung ohne Diagnosen**. Der Unterschied ist daher nicht nur ein illegales oder falsch typisiertes Beispiel.

| Eingabe | Classic-Selector | Vergleich in JavaScript | Beobachtung |
| --- | --- | --- | --- |
| `{name: "alpha"}` | `!item.name == null` | `!item.name == null` | RMT wählt das Element, JS nicht: Classic liest `!(item.name == null)`. |
| `{value: "1"}` | `item.value == 1` | `item.value == 1` | RMT wählt nicht, JS wählt: strikte gegenüber koerziver Gleichheit. |
| `{tags: ["10"]}` | `contains(item.tags, "1")` | `item.tags.includes("1")` | RMT wählt, JS nicht: Stringsubstring gegenüber Array-Membership. |

[Reproduzierbare Probes](operator-tsx-probes.cjs). [Parserpräzedenz](../../tools/rmt-language/vnext-parser.js#L2175), [Selector-Lowering](../../tools/rmt-language/vnext-compiler.js#L664), [Modelvergleiche](../../xtendrmt/rmt-state-selector-runtime.js#L471).

Die richtige Konsequenz ist **eine ausdrücklich neue Ausdrucksoberfläche**, nicht die Übernahme der ungewöhnlichen Classic-Präzedenz in eine angeblich normale `.tsx`-Datei. Der Frontend-Lowerer arbeitet am TS-AST und bildet die Bedeutung in den geschlossenen RMT-Ausdrucks-AST ab. Der Migrationsweg arbeitet am Classic-AST und erzeugt gegebenenfalls Klammern und andere Operatorzeichen. Veränderungen des Backendvertrags benötigen weiterhin eine eigene Versionierung.

### Gleiche Operatornamen sind nicht automatisch kontextübergreifend gültig

Model, Filter-/Find-Regeln, DOM-Renderausdrücke, View-Bindingprojektor und PHP besitzen unterschiedliche Mengen und teilweise unterschiedliche Bedeutung. Beispielsweise ist `gt` als Modelausdruck und als Filterregel ausführbar, in den validierten portablen Node-/PHP-Renderausdrücken aber abgewiesen. Der allgemeine DOM-Auswerter kennt dafür keinen eigenen Case und besitzt einen Fallback; das ist keine zusätzliche garantierte Fähigkeit. Node-Renderformatter wie `uppercase`, `replace` und `formatDateShort` machen einen Ausdruck nicht PHP-portabel. PHP unterstützt keine allgemeinen Sort-/Find-/Transformprovider. Der portable Knotenvertrag umfasst acht Typen; der allgemeine DOM-Renderer ist breiter.

Auch `contains/includes` ist kein universeller Alias: Model-Ausdruck und Model-Regel sowie DOM-Ausdruck können bei Arrays unterschiedlich vorgehen. Ein zukünftiger RMTX-Ausdruck braucht deshalb **Kontext, Operandenvertrag und Targetfähigkeit**. Ein globales „unterstützt JavaScript-Ausdrücke“-Flag wäre sachlich falsch. [A01-Fähigkeitsvertrag](../rmtx-a01/diagnostics-and-render-capabilities.md#2-renderprofile-statt-pauschaler-node-zulassung), [portabler Renderer](../../xtendrmt/rmt-portable-render.js), [Viewprojektor](../../xtendrmt/rmt-state-binding-view-projector.js#L207).

## 6. Was TSX gut trägt und wo eine eigene Semantik nötig bleibt

### Strukturbäume und explizite Orchestrierung

Die folgende **unimplementierte Designskizze** verwendet reguläre TSX-Grammatik. Die Operatornamen und Attribute sind Vergleichsmaterial, kein vorhandenes SDK und keine vorweggenommene Syntaxfreigabe:

```tsx
<RMT.Surface id="product-details">
  <RMT.Lane name="visible" weight={80}>
    <RMT.Hydrate target="product-header" from={selectors.productView} />
  </RMT.Lane>
  <RMT.Lane name="idle">
    <RMT.Prewarm target="product-reviews" />
  </RMT.Lane>
</RMT.Surface>
```

Hier muss der Compiler Operation, Ziel, Lane und Quelle erhalten. Er darf daraus nicht einfach zwei Komponenten machen, die bei der JavaScript-Auswertung mounten. `visible` bezeichnet im heutigen System eine Schedulingklasse; diese Skizze entscheidet noch keine Intersection-, Lade-, Hydrations- oder Timeoutpolicy. Ebenso bleibt `when` an einer Arbeitseinheit etwas anderes als die strukturelle Entfernung eines Hosts durch Conditional Rendering.

### TypeScript-Scopes, Identität und wiederholte Hosts

```tsx
// Ebenfalls Entwurf: Callback wird geprüft und abgesenkt, nicht serialisiert.
<RMT.For each={model.catalog.items} keyBy="id">
  {group => (
    <RMT.For each={group.products} keyBy="id">
      {product => (
        <RMT.XTension
          declarationId="gallery"
          provider="react-product-gallery"
          ownerSurface="product-details"
          targetSurface="product-gallery-host"
          props={{ images: product.images, selectedImageId: product.selectedImageId }}
          intents={{ selectImage: { action: actions.selectImage } }}
        />
      )}
    </RMT.For>
  )}
</RMT.For>
```

Ein passend deklarierter Child-Callback erhält mit normalen TypeScript-Regeln einen echten typisierten Scope. Die Probes bestätigen das einschließlich der Ablehnung unbekannter Felder. Dagegen erzeugt `as="item"` in einem gewöhnlichen JSX-Tag **keine** lexikalische Variable. Entweder wird ein regulärer Callback benutzt oder eine eigene Sprache samt Scope-/Rename-/Typbrücke eingeführt. Beides gleichzeitig als unverändertes Standard-TSX auszugeben wäre irreführend.

Die fehlende Action-Keyzuordnung ist in dieser Skizze absichtlich keine implizite Providerbefugnis: Der endgültige Lowerer muss die geprüften Keys der beiden Wiederholungen als **vertrauenswürdige Bindingmetadaten** an die deklarierte Actionroute binden. Das heutige A02-/Komponentenprofil besitzt dafür konkrete Pfad-/KeyFields-Verträge. Provider dürfen solche Schlüssel nicht selbst überschreiben. Numerisches `1`, textuelles `"1"` und derselbe Kindschlüssel unter verschiedenen Eltern behalten unterschiedliche Adressen.

`key={...}` oder ein Arrayindex ersetzt dieses Modell nicht. Reorder, Remove/Reinsert, leere Kollektionen und gemeinsame Owner-Suspension müssen den bestehenden Materialisierer verwenden. IDs mit Bindestrich oder qualifizierten Segmenten bleiben Daten/Handles; `model.product.selected-image` wäre in JavaScript eine Subtraktion. TypeScript-Variablen und persistente RMT-/Resume-Identität dürfen nicht still gleichgesetzt werden. [Aktuelles Key-/SSR-Profil](scoped-components.md), [A01-Identitätsvertrag](../rmtx-a01/identity-and-selector-sources.md).

### Actions und Policies benötigen keinen Tag-Zwang

Eine TSX-Datei kann neben ihrem JSX-Baum statische typisierte Deklarationen enthalten. Ein Compiler kann beispielsweise einen ausdrücklich importierten Intrinsic-Aufruf mit Objektliteralen als Actiondefinition erkennen, **ohne ihn auszuführen**. Inputs, Reducer, DataSources, Resultphasen und Policies bleiben dabei deklarative Records.

Das vermeidet lange Metabäume, ohne freie `async`-Actions, Hooks oder `onClick={() => model.x = ...}` in den nativen Bereich einzuführen. Symbolidentität ist entscheidend: Ein beliebiger Benutzerhelper mit dem Namen `action` darf nicht dieselbe Bedeutung bekommen. Statisch unbekannte Aufrufe, Spreads, Getter und Seiteneffekte müssen an ihrer Quellstelle scheitern. Eine ausführbare Build-DSL wäre ein gesondertes Modell mit eigenen Autoritäts- und Reproduzierbarkeitsfragen.

Actiontext ist außerdem keine imperative Reihenfolge. Der direkte Executor führt Datenbezug, Reducer und Effekte in festen Gruppen aus. Managed Maraca ergänzt Precommit-, Model-/Render- und Präsentationsphasen. In diesem verwalteten Pfad laufen bestimmte Service-/Stream-/Lazy-Importeffekte vor dem Commit, Präsentationseffekte nach dem Rendern. Die Gegenprobe zeigt eine vor dem Reducer geschriebene Navigation trotzdem erst nach erfolgreicher DataSource und Modelcommit. Eine Oberfläche, die mit normalen JS-Statements einen sequenziellen Ablauf verspricht, wäre semantisch ungeeignet. [Action-Executor](../../xtendrmt/rmt-action-effect-runtime.js#L512), [semantischer Reducervertrag](../../tools/rmt-language/classic-semantic-rules.js#L59), [beobachtete Phasen](operator-runtime-evidence.json).

### Frameworkgrenzen und SSR bleiben ausdrücklich

Echter Frameworkcode wird als Provider erfasst, geprüft und ausgeliefert. Ein nativer RMTX-Host muss das Provider-Interface, genaue Props, Intentmapping, Owner/Renderziel und die geltende Lifetime erhalten. Arbiträre Attributes oder Children dürfen nicht durch JSX-Fallthrough neu erlaubt werden. Das gegenwärtige Komponentenprofil besitzt keinen allgemeinen Cross-Framework-Children-/Slotvertrag.

SSR v2 des wiederholten Komponentenprofils ist bereits vorhanden: signierter State, typisierte Adressen, Owner-/Target-/Interface-/Modulidentität, Restore vor Adoption und Replay **ursprünglicher Provider-Payloads**. Ein TSX-Frontend muss diese Daten erzeugen und darf Action-Payloads nicht als Provider-Payloads wieder einspielen. Syntaktische Fragments-/Childrenkompatibilität erlaubt weder beliebige asynchrone Komponenten noch zusätzliche Ownershipmodelle. [Komponenteninterface](component-interface.md), [SSR-/Scopevertrag](scoped-components.md).

## 7. Vergleich der verbleibenden Architekturvarianten

Diese Einordnung ist eine qualitative Code-/Architekturbewertung. Es wurde kein Benutzer- oder Agentenexperiment durchgeführt, das numerische DX-/AX-Scores rechtfertigen würde.

| Variante | Operatorintegration | DX und Tooling | AX und Risiken | Empfehlung |
| --- | --- | --- | --- | --- |
| **TSX-Modul mit statischen Intrinsics und begrenzten Ausdrücken** | Alle Familien prinzipiell darstellbar; explizites AST-/Capability-Lowering erforderlich | Parser, normale Scopes und viele TS-Werkzeuge wiederverwendbar; zusätzlicher semantischer Compile-Schritt muss verständlich sein | Vertraute Oberfläche, aber Gefahr eingeschleppter React-/JS-Muster; lokale Diagnosen und ein vollständiger Katalog nötig | **Bevorzugten Spike fortsetzen** |
| **Classic-Deklarationen plus TSX-View** | Orchestrierungsoperatoren bleiben kompakt in Classic; View benötigt trotzdem gemeinsame Symbol-/Backendverträge | Zwei Modi/Dateien oder eigene Containergrammatik; weniger Orchestrierungsumbau, mehr Brückenarbeit | Explizite Sprachgrenze kann helfen, Referenzen über die Grenze können schaden | **Stärkster Gegenkandidat** |
| **Alles als Standard-TSX-Tags** | Darstellbar; Actions, Timeline und Policies können sehr umfangreich werden | Einheitliche Baumform, jedoch Metataglast und schwierige nichtstrukturelle Logik | Geschlossenes Vokabular, aber mehr Boilerplate und mögliche erfundene Tags | Kontrollvariante; kein strategischer Zwang |
| **Eigene JSX-ähnliche RMTX-Sprache mit Sonderbindern** | Freie eigene Grammatik, etwa String-Scopebinder | Mehr Freiheit, aber eigene Typ-/Scope-/Formatierungs-/Renameintegration | Vertraut wirkende Syntax mit anderen Regeln erhöht Verwechslungsgefahr | Nur bei nachgewiesenem Vorteil |
| **Gewöhnliches React-/Framework-TSX als vollständige RMT-App** | Native Scheduler-/Lifecycle-/Resource-/Stateverträge fehlen ohne zusätzliche explizite Architektur | Framework-DX gut; RMT-Semantik kann unbemerkt verschwinden | Hohe Gefahr freier Effekte, doppelter Stateautorität und falscher Lifecycleannahmen | **Kein gleichwertiger Ersatz** |
| **Vorkompiliertes Provider-TSX als XTension** | Bewusst begrenzter Framework-Unterbaum, von RMT orchestriert | Sehr gute Framework-DX innerhalb der Boundary; kein Ersatz der nativen Gesamtapp | Klare Rollen und prüfbare Interfaces möglich | **Weiterhin ergänzend verfolgen** |

Dass JSX eine Grammatik ohne festgelegte Ausführungssemantik ist, stützt die Machbarkeit eines eigenen Lowerers. `jsxImportSource` allein ändert dagegen Factoryimporte; es liefert keinen RMT-Ausdrucksvalidator oder Operatorplaner. [JSX-Spezifikation](https://react.github.io/jsx/), [TypeScript JSX](https://www.typescriptlang.org/docs/handbook/jsx.html), [jsxImportSource](https://www.typescriptlang.org/tsconfig/jsxImportSource.html).

## 8. Reale Befunde vor einer semantischen Freigabe

### Event-Condition geht im produktiven Maraca-Pfad verloren

```rmt
on click "x-section" -> action save when false {
  payload id from detail.id
}
```

Diese Form ist syntaktisch und semantisch akzeptierte heutige Classic-Quelle. Der Core enthält die Literalbedingung false. `createEventBindingRecords()` übernimmt sie jedoch nicht in den ausgeführten Eventrecord. Maraca gibt diese Records direkt an den Eventrouter weiter, dessen Conditionguard dann keine Bedingung erhält.

Die neue Probe erstellt einen echten strikten Orchestrierungs-/Kernelplan ohne Diagnosen, bootet die echte MaracaPlanRuntime mit nativen Kernel-, Fabric-, Surface-, Model-, Action- und DOM-Modulen und dispatcht ein DOM-Event in JSDOM. Nach der Commandbarriere verändert sich **`count.value` von 2 auf 1** und eine Action ist erfolgreich, obwohl `when false` vorliegt. Es ist kein bloßer Routerstub. Der Test verwendet keine generierte Browserdatei und keinen Chromiumlauf; die Aussage betrifft genau den geprüften regulären Plan-/Runtimepfad.

Ursache: [Event-Lowering](../../tools/rmt-language/vnext-compiler.js#L1900), [Maraca-Übergabe](../../xtend-maraca/plan-runtime.mjs#L2914), [Routerguard](../../xtendrmt/rmt-event-routing-runtime.js#L745). Reproduktion: [Runtime-Probes](operator-runtime-probes.cjs).

**Priorität für den nächsten Implementierungsabschnitt:** Guard bis zum richtigen Auswerter erhalten oder das nicht erfüllte Profil blockierend diagnostizieren. Ein RMTX-Spike darf die bloße Gleichheit zweier gleichermaßen unvollständiger Artefakte nicht als semantisch korrekte Parität werten.

### Action-Result-Handler und Emit müssen ihrem tatsächlichen Status entsprechen

Die gültigen `on success -> reduce ...`- und `on error -> reduce ...`-Sätze werden im Core als Handler gespeichert. Die nachgeschaltete AppPlatform-Aktion trägt die Handler nicht weiter. Echte Managed-Maraca-Runs bestätigen: Der direkte Reducer läuft im Erfolgsfall, die Success-/Error-Handler laufen weder bei Erfolg noch beim kontrollierten DataSource-Fehler.

Bei `emit ... with value input.value` ist zusätzlich ein Datenverlust nachgewiesen: Der Parser verwendet `key`, während das Lowering `entry.name` liest. Dadurch ist der Payloadname im erzeugten Datenrecord undefined und fehlt nach JSON-Serialisierung. Unabhängig davon trägt der Standardpfad `emits` als Metadaten, ohne einen allgemeinen Eventpublikationsvertrag im Stock-Action-Executor auszuführen. Das ist nicht mit einem nachgewiesen kaputten DOM-Eventbus gleichzusetzen; eine solche pauschale Behauptung würde über den vorhandenen Vertrag hinausgehen.

[Handler-/Emit-Lowering](../../tools/rmt-language/vnext-compiler.js#L4693), [AppPlatform-Aktionen](../../tools/rmt-language/vnext-compiler.js#L887), [Runtimebeobachtungen](operator-runtime-evidence.json).

Vor Freigabe müssen diese Formen pro Ausgabeprofil entweder wirklich ausgeführt oder ausdrücklich als nicht unterstützt diagnostiziert werden. Sie sind **keine Begründung für eine andere Klammergrammatik**; sie sind eine konkrete Beweislast für jedes neue Frontend.

### Zugelassene Reducer-Referenzen werden im verwalteten Pfad nicht vollständig aufgelöst

Der semantische Classic-Validator weist freie RHS-Aufrufe und andere unerlaubte Ausdrücke ab. Er erlaubt jedoch ausdrücklich State-/Selector-Referenzen. Im verwalteten Maraca-Pfad löst `reducerValue()` dagegen nur Input-/Payload-/Resultpräfixe auf und reicht andere Strings weiter. Die umliegende Controllerstrecke ergänzt hier keinen State-/Selectorresolver.

Die eingecheckte Runtimeprobe ergänzt deshalb einen weiteren gültigen Fall: `original` und `copied` sind String-States; `original` enthält `"expected"`. `reduce state.copied = state.original` kompiliert und plant ohne Diagnosen, dispatcht erfolgreich und schreibt dennoch den **wörtlichen Text `"state.original"`** in `copied`. Zusätzliche isolierte Gegenproben mit Number-/Object-Zielen und einem Selectorpfad scheitern stattdessen am Model-Typeguard; eine allgemeine Errorpfadauflösung wurde daraus nicht abgeleitet.

Dies ist keine Erlaubnis für beliebiges JavaScript, sondern eine Lücke zwischen einem bereits zugelassenen Referenzvertrag und seinem konkreten Executor. Die TSX-Abbildung muss dieselbe Referenzidentität erhalten und das ausführbare Backendprofil prüfen; TypeScript-Typprüfung allein entdeckt diesen Verlust nicht. [Semantischer Validator](../../tools/rmt-language/classic-semantic-rules.js#L59), [Managed-Resolver](../../xtend-maraca/plan-runtime.mjs#L97), [reproduzierbare Runtimeprobe](operator-runtime-probes.cjs).

### Bestehende Test- und Wissenslücken getrennt behandeln

Die 20 erneut ausgeführten RMT-Suites ergeben **19 erfolgreiche Suites, 2.958 erfolgreiche Assertions und zwei fehlgeschlagene Assertions**. Die Fehler gehören zur Remote-Compatibility-Suite: Eine inzwischen zu Classic migrierte Fixture wird weiter dem ausdrücklich auf Legacy-JSON spezialisierten Roundtripreader übergeben. Das ist ein bestehender Test-/Migrationsmismatch; betroffene Produktiv- und Testquellen wurden in diesem Auftrag nicht verändert. Er belegt keinen TSX-Fehler. Die grünen übrigen Suites decken unter anderem Parser, Compiler, Conditions, Lifecycle, Scheduler, Model, Actions, Events, Surface, Streaming, Security und Remote ab. [Suite-Evidenz](operator-suite-evidence.json).

Der MCP-Drift aus Abschnitt 3 ist eine eigene AX-Lücke. Ein Syntaxentscheid auf Basis veralteter Ressourcen kann bereits implementierte Fähigkeiten übersehen oder historische Einschränkungen als aktuell behandeln. Weder diese Befunde noch die Runtimeverluste wurden im Analyseauftrag still repariert.

## 9. Verbindliche Prüfziele für den nächsten Syntax-Spike

Die genaue Schreibweise sollte erst nach einem vergleichbaren Spike festgelegt werden. Der Spike vergleicht die TSX-Modulvariante und Classic plus TSX-View anhand derselben Fälle und Ausgabeverträge.

1. **Geschlossener Sprachkatalog:** Alle 122 AST-Konstruktoren sind einer Sourceform oder einem ausdrücklich nicht unterstützten Profil zugeordnet. Für jede Operatorfamilie stehen Kontext, Typ, Backendrecord, benötigter Hostport und Runtime-Status fest. Kein Vokabular nur aus den 25 Kit-Einträgen ableiten.
2. **Ausdrucksvertrag:** JS-Präzedenz für neue TSX-Quelle; explizite strikte Gleichheit; keine stille `contains`-Migration; genaue Context-/Targetmatrix. Die drei Gegenfälle dieses Berichts gehören in AST-basierte Migrationstests.
3. **Differenzielle Semantik:** Classic- und RMTX-Fall erzeugen äquivalente validierte Daten und beobachtbare Traces für Model, Commands, Events, Effekte, Ressourcen, Scheduling und Abbruch. Bekannte Backendlücken werden vorher korrigiert oder gesperrt; gleiche fehlerhafte Ausgaben genügen nicht.
4. **Statische Compilation:** Keine Authoring-IO und keine Top-Level-/Callbackeffekte vor der Zulässigkeitsprüfung. Intrinsics werden per Symbolauflösung erkannt. Ein gleichnamiger Benutzerhelper, eine fremde Component `Surface` oder ein Alias darf keine Autorität erschleichen.
5. **Scopes und Herkunft:** Callbacktypen, Shadowing, Rename, qualifizierte/escaped IDs, RelatedInformation und Quellmaps bleiben korrekt. String-Scopebinder dürfen keine falsche Standard-TSX-Kompatibilität versprechen.
6. **Bestehende Identität:** Verschachtelte numerische/textuelle Keys, Reordering, leere Kollektionen, Entfernen/Wiederanlegen, gemeinsame Suspension/Destroy und späte Providerantworten laufen über die vorhandene Materialisierung und Kernel-/Fabric-Lifetimes.
7. **Reguläre Integration:** Gleicher tatsächlicher Maraca-Build, versiegelte native ESM-Auslieferung, Captures/Interfacepins, strikte Größenbudgets, Node-SSR, Restore/Adoption und rohe Provider-Intent-Replays. Handgeschriebene Zwei-Hostintegration ersetzt diesen Durchlauf nicht.
8. **Native UI und Targets:** Ein allgemeiner JSX-UI-Baum benötigt einen vollständig definierten Render-/Event-/Bindingvertrag. Der aktuelle Classic-AST allein nimmt keine beliebigen `<div>`-Bäume auf. Neue AST-/IR-Felder oder ein gemeinsamer UI-Sidecar sind separat zu versionieren und pro Browser-/Node-/PHP-Profil zu prüfen.
9. **MCP-/Hydrangea-Anbindung:** Quellsprache und Syntaxversion ausdrücklich wählen, aktuellen Katalog und Negativdiagnosen bereitstellen, Knowledge-/Kit-Drift blockieren und JIT-/LSP-/Cacheherkunft nachweisen. Classic-`compiled` ist kein Ersatz für RMTX-Compilation.
10. **DX-/AX-Vergleich:** Gleiche Aufgaben, Fehler und Ausgangskenntnisse für beide Kandidaten. Korrekte Ersterzeugung, Reparaturschritte, erfundene Operatoren, falsch akzeptierte Programme, Token-/Zeitbedarf, Änderungsumfang und Diagnosequalität messen. Eine reine Einschätzung dieses Berichts ist kein Benchmark.

Das Aufgabenpaket muss über die Galerie hinausgehen: verschachtelte Key-Hosts mit SSR; Selector-/Operatorgegenfälle; typisierte Action mit DataSource, Status und Fehlerpfad; Event-Governance; Portal und Cleanup; Lifecycle/Stream/Trust; Validation/Transition/Animation; Remoteprovenienz; sowie ein bewusst unzulässiger TSX-Effekt. Nicht alle Fälle benötigen dasselbe Runtimeprofil, aber jede Einschränkung muss sichtbar sein.

**Abbruchkriterium für TSX als bevorzugtes Authoringprofil:** Wenn diese Fälle nur mit stark überraschenden, schwer erklärbaren Subsetregeln, umfangreichen Escape-Strings oder unlesbaren Metadeklarationen möglich werden und die Classic-/TSX-Mischform im Vergleich besser abschneidet, sollte die Mischform bevorzugt werden. Dafür gibt es derzeit keinen technischen Zwang, wohl aber eine berechtigte Vergleichspflicht.

## 10. Nachweise und Reproduktion

Die neuen Analyseprobes sind keine produktiven RMTX-APIs und keine Abnahme des Releases 0.9. Sie dokumentieren den heutigen Zustand einschließlich bekannter Fehler. Die Runtimeprobes erwarten diese Fehler ausdrücklich als Beobachtung; nach einem Patch müssen sie entsprechend aktualisiert beziehungsweise durch gewünschte Regressionstests ersetzt werden.

```sh
# Mit der installierten Projekttoolchain und Node 24:
node development/rmtx-a01/inspect.cjs --check
node development/rmtx-a06/operator-tsx-probes.cjs --check
node development/rmtx-a06/operator-runtime-probes.cjs --check

# Die erwarteten bestehenden MCP-Befunde sichtbar machen:
node products/xtend-mcp/scripts/build-knowledge.mjs --check
node --test products/xtend-mcp/tests/*.test.mjs
```

Die 25 TSX-/Ausdrucksprobes wurden unter **Node 24.18.0 und 26.5.0**, jeweils TypeScript **5.9.3**, ausgeführt. Die eingecheckte, exakt vergleichbare Ausgabe bindet Node 24; ein Lauf mit anderer Node-Version ohne `--check` führt die Assertions aus, ohne diese Datei zu überschreiben. Die nativen Runtimegegenproben verwenden JSDOM **30.1.2**, keinen echten Netzwerkdienst. Es wurden keine neuen Browser-/Provider-SSR-Läufe für diese reine Syntaxanalyse behauptet; deren vorhandene Nachweise stehen im [Scope-/SSR-Bericht](scoped-components.md).

Die Analyse bestätigt und präzisiert die Richtung der [bisherigen A06-Bewertung](syntax-and-jsx-sideloading-assessment.md): **TSX-Grammatik bleibt geeignet, vollständige JavaScript-/React-Semantik bleibt eine separate Frage.** Das nächste entscheidende Artefakt ist ein semantisch kontrollierter Vergleichsspiegel aller RMT-Familien, nicht ein vorschnell festgeschriebener Tagkatalog.
