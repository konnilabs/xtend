# A06.3.1 – Operatorvertrag, Selektoren und statische Readsets

**Statusfortschreibung vom 21. November 2026:** Die späteren Source3-/Source4- und Native-View-Profile sind inzwischen implementiert. [A06.5](../project-tooling/implementation.md) ergänzt die lokal geprüfte semantische Projekt-/Editorintegration. Nächster Gesamtabschnitt ist die gemeinsame Ziel- und Releaseabnahme [A06.6](../release-acceptance/implementation.md); ihre formale Evidenzbindung bleibt offen. Der [zentrale Arbeitsstand](../../XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md) ist für die heutige Reihenfolge maßgeblich. Der folgende Bericht behält den datierten Source2-Umfang.

> Historischer Folgeabschnitt dieses Source2-Berichts: [A06.3.2](../keyed-profile/README.md) ergänzt opt-in Syntax3 mit Parser-/Compiler-/Authoring-Capability3. Syntax1/2-Daten bleiben erhalten. Die nachfolgenden Versions- und Ausführungsangaben dokumentieren den datierten A06.3.1-Stand. Der damalige Suchindexbefund wurde separat behoben.

Stand des Source2-Teilabschlusses: **16. November 2026**. Dieser erste Abschnitt von A06.3 implementiert einen maschinenlesbaren Operator-/Attribut-/Kindvertrag sowie fünf zusätzliche Selektoroperatoren mit geschlossenem Prädikatprofil. Die damals folgenden Bedingungen, Wiederholungen, Actions/Policies und Inline-Providerdeklarationen sind inzwischen in den getrennten Source3-/Source4-Profilen implementiert; native Views und semantisches Projekt-/Editorwerkzeug in den Folgeprofilen und A06.5. Die hier beschriebenen Source2-Grenzen bleiben erhalten.

## Versionen und Kompatibilität

Die Module `rmtx-parser` und `rmtx-compiler` sowie die statische Authoring-API haben Version **2.0.0**. Der bisherige Default bleibt ausdrücklich das Syntaxprofil **1.0.0** mit seinen neun Operatoren, drei Importbindungen und bisherigen v1-Resultdaten. Das zusätzliche Profil **2.0.0** wird nur durch `syntaxVersion` gewählt:

```js
const { compileRmtxSource, createRmtxCompiler } = require('@ccslabs/xtend/rmt-language/rmtx-compiler');
const result = compileRmtxSource({ text, filePath: 'app.rmtx' }, { syntaxVersion: '2.0.0' });
const compiler = createRmtxCompiler({ syntaxVersion: '2.0.0' });
```

Beide bestehenden Paketpräfixe `@ccslabs/xtend` und `@ccslabs/xtend-compiler` bieten dieselben drei Subpfade wie zuvor. Es gibt keinen zusätzlichen öffentlichen Paket-Subpfad. Die bestehende Maraca-Peer-Voraussetzung des Compiler-Tarballs bleibt erhalten.

| Ebene | Bisheriges Profil | Zusätzliches Profil |
| --- | --- | --- |
| Modul-Capability-API Parser/Compiler | jetzt **2.0.0** für beide Profile | unterstützt explizit v2 |
| `sourceProfile` | `{ syntax: 'rmtx', version: '1.0.0' }` | Version **2.0.0** |
| Parserresultat | **v1**, `apiVersion: '1.0.0'` | **v2**, `apiVersion: '2.0.0'` |
| Compilerresultat | **v1**, bisherige Felder unverändert | **v2**, zusätzlich `selectorDependencies` |
| Factorymetadaten | Default/API/Schema/Profil **v1** | bei expliziter Auswahl **v2** |
| Operator-/Ausdruckskatalog | neuer Datentyp **v1**, enthält beide Syntaxprofile | v2 enthält 14 Operatoren und sieben Imports |
| Selektor-Dependencyreport | nicht in v1-Resulten vorhanden | neuer Datentyp **v1** |
| Gemeinsamer Backend-Moduleingang | Classic **4.3.0**, kompatibler vNext-Einstieg **1.4.0** | strikt geprüfte SourceProfile-Version 2 zusätzlich |

Legacy-Interfaces und Optionen bleiben als eigene v1-Typen erhalten; v2 hat eigene diskriminierte Resultate und Überladungen. `RMTX_PARSER_SCHEMA`, `RMTX_COMPILE_RESULT_SCHEMA`, `RMTX_SYNTAX_VERSION` und `RMTX_SOURCE_PROFILE` bezeichnen weiterhin den bisherigen Default. Die neuen Konstanten `RMTX_PARSER_SCHEMA_V2`, `RMTX_COMPILE_RESULT_SCHEMA_V2` und `RMTX_SELECTOR_SOURCE_PROFILE` sind ausdrücklich getrennt. Modul-API und gewählte Resultatversion sind verschiedene Ebenen. Die bisherigen Classic-Factorymethoden und der formale 122-Knoten-AST-Vertrag bleiben unverändert.

Sechs gesicherte positive/negative/aliasierte v1-Fälle wurden mit den vollständigen normalisierten Parse-/Compile-Daten der A06.2-Baseline unter beiden Node-Lanes verglichen: **kein Drift**, Default und explizites `1.0.0` identisch. Alte Ausführungsberichte werden nicht nachträglich umhashend auf neue Quellen umgeschrieben.

## Tatsächlich verwendeter Operatorvertrag

```js
const { getRmtxOperatorProfile } = require('@ccslabs/xtend/rmt-language/rmtx-parser');
const profile = getRmtxOperatorProfile('2.0.0');
// profile.operators, .expressionContexts, .imports, .limits, .semantics
```

Der Getter liefert tiefgefrorene deklarative Daten. Der Parser verwendet daraus zulässige Operatoren, Attribute, Kindfamilien, Importbindungen und Grenzen; die gemeinsame AST-Prüfung erzwingt ergänzend die Kardinalitäten und Referenzregeln. Änderungen einer getrennten JSON-Kopie verändern den Compilervertrag nicht. [Der erzeugte Katalog](operator-profile.json) ist aus derselben Implementierung gewonnen, keine unabhängige zweite Grammatikquelle.

| Neuer Operator | Attribute | Kontext / Kinder |
| --- | --- | --- |
| `Selector` | `id`, `from` erforderlich | unter `Program`; Kinder `Where`, `Find`, `Sort`, `Output` |
| `Where` | `test` erforderlich | null bis beliebig viele pro Selector |
| `Find` | `test` erforderlich | höchstens einmal pro Selector |
| `Sort` | `by` erforderlich; `direction` optional `asc`/`desc`, Default `asc` | höchstens einmal pro Selector |
| `Output` | `type` erforderlich | höchstens einmal pro Selector; Metadatum, kein Runtime-Typeguard |

Die bestehenden neun Operatoren bleiben erhalten. Neue Authoring-Attributtypen schließen unbekannte Felder und falsche Enum-/Pflichtattribute; der benannte Legacy-Namespace-Typ bleibt verfügbar. Modell-/Item-Feldtypen werden daraus nicht erfunden. Die Marker des erhaltenen Authoringprofils sind allein kein vollständiger Modeltypnachweis im gewöhnlichen TS-Checker. Der RMTX-Compiler prüft selbst den Ausdrucksumfang, Scopes und referenzierbare Symbole. [A06.5](../project-tooling/implementation.md) ergänzt inzwischen einen eigenen semantischen Sprachservice mit virtuellen TSX-Dateien, belegbaren Model-/Selector-/Item-/Inputtypen und Navigation in ursprüngliche Quelldateien.

## Selektoren und Scopes

```tsx
import { RMT, model, selectors, item, params, contains }
  from '@ccslabs/xtend/rmt-language/rmtx';

export default (
  <RMT.Program id="catalog">
    <RMT.State id="rows" type="array" initial={[
      { name: 'Alpha', enabled: true, rank: 10 },
      { name: 'Beta', enabled: true, rank: 2 }
    ]} />
    <RMT.Selector id="enabled" from={model.rows}>
      <RMT.Where test={item.enabled === true} />
      <RMT.Sort by={item.rank} direction="asc" />
      <RMT.Output type="object[]" />
    </RMT.Selector>
    <RMT.Selector id="matching" from={selectors.enabled}>
      <RMT.Where test={contains(item.name, params.term)} />
    </RMT.Selector>
  </RMT.Program>
);
```

`from` muss auf einen **ganzen deklarierten State oder Selector** zeigen. `model.product.images` ist nur dann eine Quelle, wenn ein State namens `product.images` deklariert ist; ein Feld `images` innerhalb des States `product` ist in diesem Backend noch keine Selectorquelle. Prädikat-/Reducerreferenzen benutzen dagegen die bestehende längste deklarierte Symbolauflösung.

| Importbindung | Zulässige Nutzung im v2-Profil |
| --- | --- |
| `model` | Source-/Prädikat-/Reducerpfade; wird auf den State-Namensraum abgebildet |
| `selectors` | Selectorquelle, Prädikat und skalare/direct-path Reducerreferenz |
| `item` | aktuelle Zeile in `Where`/`Find`, auch als ganzer primitiver Wert; bei `Sort` ist ein Feldpfad erforderlich |
| `params` | Aufrufparameter ausschließlich im Selectorprädikat; auf den bestehenden AST-`input`-/Runtime-Params-Namensraum abgebildet |
| `input` | deklarierter Actioninput im Reducer; kein Alias für Selectorparameter |
| `contains` | ausschließlich statisch importgebundener deklarativer Helper innerhalb eines Prädikats |

Importaliase sind erlaubt und werden auf die tatsächliche kanonische Authoringbindung aufgelöst. Berechnete, optionale und Prototyppfade sind gesperrt. Ein gleichnamiges fremdes Objekt oder ein fremder Import erhält keine Operator-/Helperidentität. Model/Selector/Params verlangen einen Feld-/Symbolpfad; ein ganzes `item` ist für primitive Zeilen erlaubt.

## Ausdruckssemantik und Präzedenz

Das Profil erlaubt boolesche Literale, strikte Vergleiche `===`/`!==`, `<`/`<=`/`>`/`>=`, geklammerte Gruppen, `&&`/`||` mit ausschließlich booleschen Prädikaten sowie **`!(Prädikat)`**. Vergleichsoperanden sind skalare JSON-Literale oder direkte Pfade. `contains` nimmt genau zwei solche Operanden. Freie Calls, Methoden, Arithmetik, Ternaries, Typassertions, loose Equality und skalare/bare-path Truthiness sind Fehler.

`===`/`!==` werden auf die tatsächlich strikten Classic-Vergleichsoperatoren abgesenkt. `==`/`!=` werden an der ursprünglichen Operatorrange diagnostiziert. Die boolesche Grammatik verhindert Operandreturn-Unterschiede zwischen JavaScript-`&&`/`||` und dem vorhandenen RMT-Lowering. Nicht ausdrücklich geklammerte Negation wird abgewiesen: `!a === b` darf nicht versehentlich die andere Classic-Präzedenz übernehmen. Schreibe etwa `!(item.enabled === true)`.

Die Auswertung bleibt die vorhandene Modelsemantik:

- `contains` ist case-sensitive **String-Substring-Suche**, mit vorhandener Stringkonversion und Null/Undefined als Leerstring; kein Array-Mitgliedschaftstest.
- Sortierung kopiert die Liste und vergleicht `String(value).localeCompare`. Numerische Werte `10` und `2` werden damit lexikographisch geordnet, nicht numerisch.
- Die Phasenfolge ist immer **Where → Find → Sort**, unabhängig von der Reihenfolge der Quellklauseln.
- Find erhält gefundene Werte wie `0`, `false` und `""`; Nichtfund ergibt `null`.
- `Output` deklariert ein Metadatum und fügt keinen Valuevalidator hinzu.
- `select(id, params)` parametrisiert nur den angefragten Selector. Vorgelagerte Selectorquellen werden weiterhin ohne diese Parameter materialisiert; es gibt keine automatische Parameterweiterleitung oder Actioninputübernahme.

Die äquivalenten [RMTX](selectors.rmtx)- und [Classic](selectors.rmt)-Quellen prüfen dieselben effektiven ausführbaren Model-/Actionpläne. Sprachabhängige Herkunft und Clause-Quelltext werden getrennt bewertet; effektive Filter-/Find-/Sortoperationen bleiben vergleichbar. Unterstützte Browser-/Node-Auswertung ist keine automatische PHP-Freigabe für Find/Sort; die vorhandenen portablen Zielverträge bleiben zuständig.

## Statische Dependencies und Granularitätsgrenze

Ein erfolgreiches Compilerresultat v2 enthält [den versionierten Dependencyreport](dependencies.json). Er verwendet aufgelöste Fakten des gemeinsamen semantischen Graphen und die tatsächliche Reihenfolge des kompilierten Plans:

- direkte State-/Selectorreads einschließlich Quelle und aller statischen Prädikatzweige;
- längste deklarierte Symbolauflösung und sichere Feldpfade;
- transitive StateReads durch referenzierte Selectorabhängigkeiten;
- lokale Row-/Parameterpfade einschließlich Sortfeldern;
- topologische Selectorordnung.

Auch bei einem syntaktisch kurzgeschlossenen Zweig werden dessen Referenzen statisch geprüft und erfasst. Referenzähnliche Literalstrings erzeugen keine Abhängigkeiten. Fehlerhafte Quellen, unbekannte Symbole, Zyklen oder ungültige Kardinalitäten ergeben keine ausführbaren Artefakte und keinen Dependencyreport.

**Der Report verändert die Runtime nicht.** Das Model berechnet Selectorwerte weiter nach seinem bestehenden Snapshot-/Select-Verfahren. `runtimeTracking`, `incrementalRecomputation` und `parametersForwardedToDependencies` sind ausdrücklich `false`. Die Readsets sind Grundlage für spätere geprüfte Projektionen und Planung; sie behaupten weder neue Subscriptions noch granulare Dirty-only-Recomputation oder ein allgemeines Props-Ausdrucksprofil.

## Abnahme und Einordnung des Teilabschlusses

Der [v2-Zwei-Host-Fall](two-host.rmtx) und [Runtime-Runner](runtime-test.cjs) verwenden die echte RMTX-Datei über `createRmtxCompiler({ syntaxVersion: '2.0.0' }).compileSource`, den regulären Maraca-Build und bestehende Providerinterfaces/Binding-Sidecars. Neben den bisherigen acht Frameworkfällen prüfen drei neue Fälle **Selector → Action → Model → React-Props**, erhaltene Vue-Rootidentität, Liveänderungen an Source/Query sowie Close/Resume-Staging. Kein zweiter Modelwriter oder fallspezifischer Sourceübersetzer ist hinzugekommen.

```sh
node --test tests/rmt-language/rmtx-operator-profiles.test.cjs \
  tests/rmt-language/rmtx-selector-dependencies.test.cjs \
  tests/rmt-language/rmtx-selectors.test.cjs
node development/rmtx-a06/selector-profile/inspect.cjs --check
XTENSIONS_TEST_PEERS=/pfad/zum/harness node development/rmtx-a06/selector-profile/runtime-test.cjs
XTENSIONS_TEST_PEERS=/pfad/zum/harness CHROME_BIN=/pfad/zu/chromium node development/rmtx-a06/selector-profile/runtime-test.cjs --browser
npm run check:release-preparation
```

**59 neue Nodefälle je unterstützter Lane** prüfen Katalog/Typen, Readsets, echte Modelauswertung, Sourceparität und Gegenfälle. Die Runtimeabnahme besteht **11/11 unter Node 24, Node 26 und Chromium**. Vertrags-/Inspectorprüfungen sind im Vorbereitungsgate enthalten, die neue Frameworkabnahme im verpflichtenden XTensions-Runtimegate und den Default-/Migration-/Nightly-Reportpfaden. [Statischer Beleg](evidence.json), [Runtime-Rohbelege](runtime-evidence.json) und [Ausführungs-/Regressionsnachweis](execution-evidence.json) halten Umfang und Quellenbindung fest.

**A06.3.1 bleibt der erhaltene Source2-Teilabschluss.** Die damals vorgesehenen Bedingungen, Wiederholungen und stabilen typisierten Key-Scopes sind in Source3 implementiert; weitere Actions/Events/Policies, Inline-XTension-Bindings und geschlossene Props-Ausdrücke in Source4. Native Views und weitere native Profile sowie A06.5 sind inzwischen implementiert. Beide 0.9-Features bleiben bis zur gemeinsamen [A06.6-Abnahme](../release-acceptance/implementation.md) `preparing`.

Der separat dokumentierte Docs-Suchindex-Budget-/Freshnessfehler aus A06.2 bleibt ein eigener Ausgangsbefund. Budgets und Suchsemantik werden in diesem Sprachabschnitt nicht verändert; aktuelle Inspector-/Compiler-/Runtimebelege sind von einer vollständigen Repository-/0.9-Abnahme zu unterscheiden.
