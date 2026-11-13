# A06 – Bewertung der Syntaxentwürfe und von JSX-Sideloading

Stand: **13. November 2026**. Bezugsstand der Codeprüfung: Commit `e73d30c681973f29ff7f736dceb4a3141aab5183`. Status: **Entscheidungsvorbereitung, kein beschlossener Syntax- oder API-Vertrag**.

## 1. Ergebnis für die Plattformentscheidung

**JSX-Nähe, die Verwendung der JSX-Grammatik und eine React-Laufzeit sind drei getrennte Entscheidungen.** JSX definiert eine Syntax, aber keine verbindliche Ausführungssemantik. XTend kann daher Standard-TSX als Eingabe eines eigenen deklarativen Frontends verwenden. Daraus folgen weder React-Kompatibilität noch die automatische Übersetzbarkeit beliebigen JavaScripts in RMT-Artefakte. [JSX-Spezifikation](https://react.github.io/jsx/).

Die aussichtsreichste Arbeitshypothese ist eine Kombination aus:

1. **Einem nativen RMT-Profil mit JSX-/TSX-kompatibler Oberflächensyntax**, ausdrücklich sichtbaren RMT-Operatoren und begrenzten Expressions. Dieses Profil erzeugt deklarative RMT-/Maraca-Daten und erhält Model-, Action-, Surface-, Lane-, Ressourcen- und Ownership-Semantik.
2. **Vorkompiliertem JSX/TSX als referenziertem XTension-Provider** für echte Framework-Komponenten. Das erhält die Framework-Semantik innerhalb einer klaren Host-Grenze und nutzt die vorhandene Kernel-/Fabric-/Surface-Kette.
3. **Einem weiter ernsthaft zu prüfenden Mischsyntax-Kandidaten**, falls die gleiche Referenzanwendung mit RMT-Deklarationen und einem JSX-View-Block deutlich verständlicher wird. Ein früher Vergleich muss zeigen, ob dieser Vorteil den zusätzlichen Editor- und Parseraufwand rechtfertigt.

Diese Kombination bewahrt die Möglichkeit, XTend als eigenständige Orchestrierungsplattform auszurichten und vorhandene JSX-Komponenten pragmatisch einzubinden. Die Entscheidung über eine eigene `.rmtx`-Grammatik bleibt offen. Insbesondere muss noch nachgewiesen werden, dass ein standardnahes TSX-Profil die speziellen RMT-Konzepte ohne unübersichtliche Meta-API ausdrücken kann.

**Für einen ersten Interop-Spike ist externes JSX-Sideloading über eine Provider-Referenz am nächsten am Bestand.** Ein vollständiges gewöhnliches React-Modul ist trotzdem noch kein gültiger heutiger Provider. Ein Compiler im Produktionsbrowser, der JSX-Strings aus Datenartefakten übersetzt und ausführt, ist angesichts der bestehenden Artefakt-, Delivery- und Ownership-Verträge keine sinnvolle Standardrichtung.

Die AX-Einschätzungen dieses Berichts sind begründete Hypothesen. Es wurde kein Agentenbenchmark ausgeführt und kein empirischer AX-Sieger festgestellt.

## 2. Grundlage und Aussagekraft

Es werden drei Evidenzarten getrennt:

- **Dokumentierter Entwurf:** Aussagen und illustrative Beispiele aus dem Working Document; keine verbindlichen Implementierungsvorgaben. Eingebettete Gesprächsprompts wurden nicht als Arbeitsanweisungen übernommen.
- **Bestandsfakt und mechanische Probe:** Gelesener Repository-Code, vorhandene Verträge und elf eng begrenzte lokale Compiler-/Provider-Proben. Damit ist keine neue RMTX-Integration nachgewiesen.
- **Bewertung und neuer Vorschlag:** Architekturfolgen, relative Aufwände, DX-/AX-Hypothesen und vorgeschlagene Abnahmekriterien.

Die wesentlichen lokalen Grundlagen:

| Grundlage | Relevanz und Einordnung |
| --- | --- |
| Working Document „RMTX: Konzept für die Einführung einer integrierten Template-Syntax in RMT“, Arbeitsstand 4. November 2026 | Enthält die drei Syntaxrichtungen, zwei Iterationsbeispiele und D01–D08. Bereitgestellter lokaler Anhang, keine aktuelle Implementierungsspezifikation. SHA-256: `2a6eced15dc0ec4e38d3c41e20d4c7e1e76aa0ca66503a97d90e559a79ef2338`. Die relevanten Varianten werden hier erneut beschrieben, da der Anhang nicht Teil des Repositories ist. |
| [Bestandsaufnahme, Abschnitte 10–12](../XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md) | Verknüpft Syntaxfragen mit den gemeinsamen Compiler- und XTension-Verträgen; A06 bleibt offen. Historische Aussagen sind anhand des inzwischen implementierten A02–A05-Stands zu lesen. |
| [Classic-Compilervertrag](../rmtx-a01/compiler-contract.md), [Compiler-Einstiege](../../tools/rmt-language/classic-compiler.js), [AST-Schema](../../tools/rmt-language/contracts/classic-ast.v1.schema.json) | Gemeinsamer deklarativer Backend-Eingang, strukturelle und semantische Prüfung. Compiler-API 4; AST-Vertrag 1. Das ist keine allgemeine Schnittstelle für React-Elemente oder JavaScript-Funktionen. |
| [Identitäten und Selektorquellen](../rmtx-a01/identity-and-selector-sources.md), [Operator-/Zielregeln](../rmtx-a01/diagnostics-and-render-capabilities.md) | Referenzauflösung, bestehende ID-Grenzen, reine Selektoren und unterschiedliche Ausführungsprofile. |
| [Wiederholungsreferenz](../rmtx-a02/repeated-filters.rmt), [Binding-Sidecar](../rmtx-a02/repeated-filters.js) | Verschachtelte Wiederholungen, typisierte Elementschlüssel, kontrollierte Props und vertrauenswürdig abgeleitete Intent-Schlüssel. |
| [Provider-Graph-Vertrag](../rmtx-a04/provider-graphs.md), [Implementierung](../../xtend-maraca/xtension-provider-graph.js), [Komposition](../../xtend-maraca/xtension-composition-runtime.mjs) | Gepinnte lokale Funktionsmodule, externe Peers, definierter Initialisierungszeitpunkt und Host-Bindung. Ältere Dokumentabschnitte beschreiben ihre damaligen API-Versionen. |
| [A05-Profil](../rmtx-a05/README.md), [SSR-Adapter](../../tools/xtensions/framework-ssr.js) | Aktueller synchroner React-/Vue-SSR-/Adoptionspfad; exklusive Container, signierter Model-Restore, Replay und separater Fallback. Kein Beleg für beliebige asynchrone Komponenten oder Cross-Framework-Portale. |
| [Tooling-Architektur](../XTendRMT-DSL-Tooling-Architektur.md) | Fachanalyse soll gemeinsam von Linter und LSP genutzt werden; Menschen und Agenten sind Konsumenten. Historische JSON-Parserbeschreibungen dieses Dokuments ersetzen nicht den heutigen Classic-Parser. |

## 3. Welche Entwürfe tatsächlich vorliegen

Das Working Document enthält **drei Richtungen**, aber noch keine drei vollständigen Sprachspezifikationen:

| ID dieses Berichts | Bereits enthaltener Entwurf | Was noch fehlt |
| --- | --- | --- |
| A | Alles als Tags: auch State, Actions, Policies und Kontrollfluss als Meta-Elemente | Vollständige Grammatik, Ausdrucksmodell, Scopes, Typisierung, reservierte Namen und Abbildung aller Orchestrierungskonzepte |
| B | JSX mit Expressions: vertraute Attribute und JavaScript-nahe Ausdrücke, etwa `items.map(...)` | Exakte Grenze zwischen zugelassenem deklarativem Ausdruck und gewöhnlichem ausführbarem JavaScript |
| C | Mischsyntax: Struktur als Tags, Deklarationen und Expressions mit eigener Grammatik | Einheitliche Regeln für die Sprachgrenzen und ein tragfähiger Parser-/Editorentwurf |

Die originalen Iterationsbeispiele illustrieren den Unterschied:

```tsx
// Working-Document-Entwurf: nicht implementierte RMTX-Syntax
<For each={items} as="item" keyBy="id">
  <ItemCard item={item} />
</For>
```

```tsx
// Working-Document-Gegenentwurf: JSX-Child-Ausdruck innerhalb eines JSX-Baums;
// kein vollständiges Modul. Die deklarative RMT-Abbildung ist noch offen.
{items.map(item => <ItemCard key={item.id} item={item} />)}
```

Das erste Beispiel bindet `item` nur dann, wenn eine neue RMTX-Semantik dies ausdrücklich definiert. Ein gewöhnliches JSX-Tag kann durch einen String-Prop keinen lexikalischen TypeScript-Namen erzeugen. Das zweite Beispiel bindet `item` sprachlich korrekt, beantwortet aber noch nicht, ob RMT oder ein Framework die Wiederholung und deren Lifetimes besitzt.

Die im Folgenden ergänzten direkten JSX- und Sideloading-Pfade sind **neue Untersuchungsvarianten**, keine nachträglich als beschlossen ausgegebenen Bestandteile des Working Documents.

## 4. Vier unabhängige Architekturachsen

Die Optionen sind nicht alle gegenseitig ausschließend. Vor einer Auswahl müssen vier Achsen getrennt entschieden werden:

| Achse | Wahlmöglichkeiten | Strategische Folge |
| --- | --- | --- |
| Oberflächengrammatik | Eigenes RMTX, Standard-TSX, RMT-Deklarationen mit eingebettetem JSX | Sprachgefühl, Parser, Formatierung und Editoranbindung |
| Ausdruckssemantik | Begrenzte deklarative Expressions, ausdrücklich referenzierte Host-Funktionen, Framework-JavaScript | Statische Prüfbarkeit, Seiteneffekte, Serialisierung und Target-Parität |
| Ausgabe | Native RMT-Daten/Deskriptoren, Provider-Module mit Referenzen, bewusst getrennte Kombination | Welche Informationen der Compiler und Kernel tatsächlich kennen |
| DOM- und State-Eigentum | RMT-eigene Struktur oder Framework-eigener Unterbaum; kontrollierter Model-State versus lokaler Framework-State | Granularität, Deep Links, Cleanup, SSR und zulässige Übergänge |

**A ist nicht automatisch React-frei; B ist nicht automatisch React; C ist nicht automatisch besser orchestrierbar.** Diese Eigenschaften ergeben sich aus Ausgabe und Zuständigkeit. Auch A kann JavaScript in Attributen verstecken; auch Standard-TSX kann eine deklarative Compiler-Eingabe sein.

Ein eigener JSX-Import-Source kann die emittierten Factory-Aufrufe und die JSX-Typen adressieren. Er definiert jedoch keine RMT-Semantik für beliebige Ausdrücke, IO oder State-Änderungen. [TypeScript: JSX-Import-Source](https://www.typescriptlang.org/tsconfig/jsxImportSource.html).

## 5. Bewertung der drei ursprünglichen Richtungen

### A – Alles als Tags

**Machbarkeit:** Technisch gut als eigene deklarative Sprache realisierbar. Der Aufwand entsteht hauptsächlich durch Semantik und Tooling, nicht durch das Erkennen von Winkelklammern. Für generische UI-Bäume ist weiterhin eine Backend-Abbildung nötig.

**Architektur:** RMT-Konzepte können als ausdrückliche Sprachoperatoren auftreten. Surfaces, Lanes, Ressourcen und Policies erhalten klare Kontexte. Der Compiler muss Operatoren anhand aufgelöster Symbole oder reservierter Sprachkonstrukte unterscheiden; eine bloße Namensliste für `For`, `State` oder `Action` kollidiert mit Benutzerkomponenten.

**DX-Vorteile:** Wiedererkennbare Verschachtelung; sichtbare Zuständigkeiten; gute Möglichkeit für kontextbezogene Completion. Scope- und Ressourcenbereiche können direkt im Quelltext auffindbar sein.

**DX-Nachteile:** Lange Deklarationsbäume, schwierige Selektoren/Reducer und viele Meta-Tags. Ein Tag-Binder wie `as="item"` ist keine normale TSX-Semantik. Bei eigener Bindungsregel braucht es eigene Diagnosen, Navigation und Rename-Unterstützung. Eine XML-artige Oberfläche garantiert keine stock-TSX-Kompatibilität.

**AX:** Ein geschlossenes Vokabular und eindeutige Kontexte können die Erzeugung und Reparatur erleichtern. Dem stehen mehr Boilerplate und das Risiko erfundener Meta-Tags gegenüber. Ob die längere Schreibweise tatsächlich mehr Tokens oder Reparaturschritte kostet, muss am gleichen Aufgabenpaket gemessen werden.

**Einordnung:** Guter Kontrollkandidat für Semantik und AX; als strategischer Default nur überzeugend, wenn auch komplexe Actions, Expressions und Services kompakt bleiben.

### B – JSX mit begrenzten Expressions

**Machbarkeit:** Technisch gut für einen definierten Teilumfang. Kritisch wird die Grenze: Welche Member-Zugriffe, Funktionsaufrufe, Spreads, Callbacks, Bedingungen und Iterationen lassen sich als deklarative Operationen erhalten?

`items.map(...)` kann in einem erkannten Muster auf einen RMT-Repeat abgebildet werden. Ein dynamisch bestimmtes `items.map`, ein beliebiger Callback mit IO oder ein unbekannter Helper darf daraus nicht stillschweigend eine vermeintlich portable RMT-Operation machen. Zulässige Muster müssen symbolisch aufgelöst und alle übrigen an der Originalquelle abgewiesen oder ausdrücklich in einen Framework-Bereich verlagert werden.

**Architektur:** Die RMT-Metadaten brauchen sichtbare Operatoren oder Annotationen. Ein gewöhnliches `<div>` verrät keine Lane, kein Work-Budget und keine Surface-Lifetime. Die Ausdrücke müssen vor dem normalen JSX-Emit analysiert werden; eine nachgeschaltete Factory allein sieht zu wenig ursprünglichen Kontrollfluss.

Eine mögliche, noch unbeschlossene Schreibweise nutzt bestehende TSX-Scopes:

```tsx
// Designskizze; RMT ist ein vorgeschlagener Compiler-Operator-Namensraum,
// keine hier implementierte JSX-Komponentenbibliothek.
<RMT.For each={items} keyBy="id">
  {item => <ItemCard item={item} />}
</RMT.For>
```

TypeScript kann diesen Callback-Scope mit passenden Deklarationen prüfen. Ein RMTX-Lowerer müsste den Callback anschließend als begrenzten Template-Ausdruck behandeln, statt die Funktion in ein JSON-Artefakt zu serialisieren. Gewöhnliche Typprüfung ersetzt diese Prüfung nicht. [TypeScript: JSX-Typprüfung](https://www.typescriptlang.org/docs/handbook/jsx.html).

**DX-Vorteile:** Gute Nähe zu bekannten Komponenten, Props, Callback-Scopes und TypeScript-Werkzeugen. Geringere syntaktische Distanz für JSX-Entwickler.

**DX-Nachteile:** Die größte Gefahr ist eine vertraute Schreibweise mit unerwartet anderem Verhalten. Ein erfolgreiches TypeScript-Checking kann weiterhin unzulässige RMT-Ausdrücke enthalten. Häufige, schlecht erklärte Subset-Ablehnungen würden den Einstiegsvorteil aufzehren.

**AX:** Vertraute Muster sind eine plausible Hilfe für erste Entwürfe. Gleichzeitig kann ein Agent gewöhnliche React-Idiome, Hooks oder Inline-Effekte fälschlich in den nativen RMT-Teil einsetzen. Präzise Subset-Diagnosen und wenige eindeutige Normalformen sind wichtiger als möglichst große syntaktische Toleranz.

**Einordnung:** Bevorzugter nativer Vergleichskandidat, wenn Orchestrierung ausdrücklich sichtbar bleibt und die Expression-Grenze klein, verständlich und maschinenprüfbar ist.

### C – RMT-Deklarationen und JSX-View-Block

Eine mögliche Form wäre:

```text
// Neue Designskizze; kein gültiger heutiger RMT-/TSX-Quelltext
state filters ...
action filters.change ...
surface results ...
view {
  <ItemList ... />
}
```

**Machbarkeit:** Gut realisierbar, aber eine neue Gesamtgrammatik. Vorhandene Classic-Deklarationen könnten weitgehend erhalten bleiben. Standard-TSX kann die komplette Datei nicht unverändert parsen.

**Architektur:** Gute Trennung zwischen Orchestrierungsprogramm und sichtbarem Baum. Offen bleiben besonders die Symbolbrücke in den View, Scope-Grenzen, doppelte Deklarationen und die gemeinsame Typprüfung. Ein einziges semantisches Programm muss entstehen; getrennte DSL- und JSX-Analysen mit widersprüchlichen Symboltabellen wären problematisch.

**DX-Vorteile:** RMT-Experten können viele bestehende Konzepte wiedererkennen; große Actions oder Policies müssen nicht als lange Tag-Bäume geschrieben werden. UI und Ablauf können in derselben Datei lesbar zusammenstehen.

**DX-Nachteile:** Zwei grammatische Modi, Formatierungsgrenzen und zusätzliche Editorarbeit. Syntax-Highlighting eines eingebetteten Blocks liefert noch keine korrekte Completion, Navigation oder Diagnosen. Virtuelle TSX-Dokumente benötigen zuverlässige bidirektionale Quellabbildung.

**AX:** Explizite Bereiche können Zuständigkeiten verdeutlichen. Zugleich sind Sprachwechsel und Referenzen über diese Grenze zusätzliche Fehlerquellen. Erwartbar besonders attraktiv für einen domänenspezifisch informierten Agenten; eine bessere Erfolgsrate ist nicht nachgewiesen.

**Einordnung:** Ernsthafter Alternativkandidat zu B. Er kann strategisch besser sein, wenn der Orchestrierungsanteil realer Apps deutlich über einfache UI-Beschreibung hinausgeht.

## 6. Direkte JSX-/TSX-Unterstützung in Maraca

### D1 – Standard-TSX als deklaratives RMT-Frontend

Hier wird Standard-TSX geparst, aber ein definierter Ausschnitt auf RMT-Semantik abgebildet. Tags können UI-Knoten und ausdrücklich markierte RMT-Operatoren repräsentieren. Beliebige React-Komponenten werden dabei nicht zu nativen RMT-Komponenten.

**Feasibility:** Plausibel, aber ein Compilerprojekt. Wiederverwendbar sind Parser, Basis-Typprüfung und Teile der Editorinfrastruktur. Neu bleiben Symbolklassifikation, Expression-Lowering, RMT-Regeln, UI-Abbildung und Herkunftsinformationen. D1 ist insbesondere eine mögliche technische Realisierung von B; keine völlig unabhängige Alternative.

Die Codebase bietet `compileRmtClassicAst(...)` und `compileRmtClassicAstWithBindings(...)`. Deren Eingang verlangt reine deklarative Daten. Die heutige Template-/Surface-Struktur ist keine fertige allgemeine JSX-Baumschnittstelle. Zwei Backend-Wege sind deshalb zu erproben:

- Bestehende Orchestrierung auf den Classic-AST abbilden und einen **versionierten, gemeinsam validierten UI-Sidecar** beziehungsweise vorhandene Deskriptorformate ergänzen.
- Eine **erweiterte gemeinsame AST-/IR-Version** einführen, falls UI- und Orchestrierungssemantik damit konsistenter ausdrückbar werden.

Das ist eine offene Abbildungsfrage, kein Grund, automatisch ein komplett neues Backend zu bauen. Ein UI-Sidecar müsste dieselben Model-/Action-/Surface-Referenzen und Zielprofile prüfen; bloße zusätzliche JSON-Ausgabe reicht nicht.

Eine Custom-JSX-Factory ohne vorherige semantische Analyse ist hierfür kein ausreichender Ersatz: Bei normal ausgeführtem `items.map(...)` erhält sie bereits erzeugte Children. Die symbolische Wiederholung, ihre Abhängigkeiten und ihre Lifetimes müssen vorher erhalten oder ausdrücklich modelliert werden. Erfolgt das erst durch Dependency-Tracking in der Anwendung, entsteht ein zusätzlicher Runtime-Entwurf, der gegen das ursprüngliche Ziel ohne weitere Template-Laufzeit zu bewerten wäre.

**Weitere technische Realisierung: ein ausführbares Build-DSL.** TSX könnte im vertrauenswürdigen Build über ausdrückliche Builder-Operatoren deklarative AST-/IR-Daten erzeugen. Dafür ist keine zusätzliche Produktionsruntime notwendig. Es wäre aber eine andere Architektur als statisches Source-Lowering: Ausführungsrechte, erfasste Eingaben, Reproduzierbarkeit und Quellenabbildung müssten vertraglich geregelt werden. Symbolische State-Referenzen und etwa `RMT.For` können dabei bewusst IR erzeugen; gewöhnliche JavaScript-Operatoren oder eine normale `.map(...)` über Initialwerte werden dadurch nicht automatisch zu reaktiven RMT-Operationen. Dieser Ansatz verdient einen begrenzten Gegenversuch, darf aber nicht mit dem bloßen Austausch einer JSX-Factory gleichgesetzt werden. Er wurde hier nicht implementiert.

**DX/AX:** Beste Chance auf Wiederverwendung gewohnter TSX-Scopes und Werkzeuge. Entscheidend bleibt eine ehrliche Kennzeichnung als RMT-Profil mit eigenem Semantikvertrag. Nur dieselben Winkelklammern zu verwenden schafft noch keine React-Kompatibilität.

### D2 – Gewöhnliches Framework-TSX als App-/View-Quelle

JSX wird zu echtem React-Code, der über einen XTension-Host ausgeführt wird. Die RMT-Orchestrierung kommt aus separater RMT-/RMTX-Konfiguration oder einem ausdrücklich neuen typisierten Orchestrierungs-API.

**Feasibility:** Der Rendering-Kern ist nahe am vorhandenen React-Pfad. Eine bequeme Maraca-Eingabe für gewöhnliche Module, deren Imports und Initialisierung ist zusätzlich zu implementieren. Ein vorgeschalteter JSX-Transform allein schafft diese Integration nicht.

**DX-Vorteil:** Stärkste Nähe zu vorhandenen React-Komponenten und deren tatsächlichem Verhalten. Framework-Hooks und Bibliotheken bleiben in ihrem vorgesehenen Kontext; React-Hooks dürfen nicht durch einen RMT-Compiler beliebig außerhalb des React-Renderings ausgeführt werden. [React: Hooks-Regeln](https://react.dev/reference/rules/rules-of-hooks).

**Architekturkosten:** Der Compiler kennt den äußeren Host, seine Bindungen und seine Capability-Anforderungen. Er gewinnt dadurch keinen vollständigen nativen RMT-Plan für innere Listen, Zustände und Effects. Ein RMT-Tag innerhalb eines React-Baums darf nicht beiläufig die DOM-Ownership übernehmen. Dafür bräuchte es einen ausdrücklichen Übergabevertrag.

**AX:** Vorhandener JSX-Code lässt sich möglicherweise leichter übernehmen. Das zentrale Fehlermuster ist die Annahme, React-`setState`, Hooks oder innere `key`s seien automatisch XTend-Model-State, RMT-Lifetimes oder Deep-Link-Adressen. Die Boundary muss auch für Agenten sichtbar sein.

**Einordnung:** Sehr sinnvoller Interop-Pfad und möglicher komfortabler Maraca-Einstieg. Er ersetzt die Entscheidung über eine native RMTX-Autorensprache nur dann, wenn XTend bewusst eine primär Framework-zentrierte Plattform werden soll.

## 7. JSX-Sideloading: drei unterschiedliche Ausführungsmodelle

„Sideloading“ bezeichnet hier ausdrücklich keine Umgehung von Grants, Provenienz oder Fabric.

### S1 – Externe JSX-/TSX-Datei als vorkompilierter Provider

```text
RMT/RMTX-Programm ── Bindungen + Provider-Referenz ──► RMT-/Maraca-Artefakte
TSX-Quelldatei ── Vorkompilierung + Prüfung ──► adressierte ESM-Provider-Assets
```

Die RMTX-Artefakte enthalten eine geprüfte Referenz und deklarative Bindungen. Ausführbarer Code bleibt in getrennt ausgelieferten Modulen. Laden, Peer-Auflösung und Factory-Aufruf laufen weiterhin über den zugelassenen Host-Pfad.

**Bestandsnähe:** Hoch für eine begrenzte Factory-Eingabe. Die lokale Probe hat diese tatsächliche Eingabe in gültiges Provider-JavaScript überführt und durch den vorhandenen Graph-Capture geprüft:

```tsx
// Tatsächliche TSX-Probeeingabe, kein neues RMTX-Sprachkonstrukt.
// Vor dem heutigen Provider-Capture muss daraus .mjs erzeugt werden.
export function createPanel({ React }) {
  return function Panel({ query, xtension }) {
    return <input value={query} onInput={event => xtension.emit({
      type: "change", payload: { query: event.currentTarget.value }
    })} />;
  };
}
```

Eine Transformation auf `React.createElement(...)` nutzt den lexikalisch injizierten Peer und benötigt hier keinen Runtime-Import. Das ist eine begrenzte Interop-Möglichkeit, keine automatische Annahme beliebiger `.tsx`-Dateien durch Maraca.

**Heutige Hindernisse gewöhnlicher JSX-Module:**

- Der automatische Transform erzeugt typischerweise einen Import aus `react/jsx-runtime`. Der aktuelle Provider-Graph erlaubt keine solchen Paketimporte. [Babel: automatischer JSX-Transform](https://babeljs.io/docs/babel-plugin-transform-react-jsx).
- `import React from "react"`, Default-Exports und Top-Level-Initialisierer wie `const App = ...` passen nicht zum aktuellen Provider-Vertrag.
- Bibliotheksgraphen mit Top-Level-Aufrufen, Zyklen oder dynamischen Imports erfordern einen anderen geprüften Provider-/Initialisierungsvertrag. Die Regeln des bestehenden Profils sollten dafür nicht still gelockert werden.
- Import- und Transform-Ausgaben, Quell-/Ausgabedigests, Compilerkonfiguration und Source Maps müssen nachvollziehbar bleiben. Der genaue Compiler-/Runtime-Pin muss Bestandteil des Buildvertrags sein.

**DX/AX:** Gut auffindbare Dateigrenze, übliche TSX-Bearbeitung und klare Zuständigkeit. Nachteile sind mehrere Dateien und die nötige Abstimmung von Props, Intents und Provider-Referenz. Generierte Bindungsprüfungen können diese Kosten senken; eine zweite manuell gepflegte State-Wahrheit sollte vermieden werden.

**Empfehlung:** Erster Sideloading-Spike mit Factory und Peer-Injektion. Ein weiterer Schritt kann einen bequemeren Frontend-Wrapper erzeugen. Vollständige npm-/ESM-Kompatibilität ist ein eigener Umfang.

### S2 – Eingebetteter JSX-Bereich in einer RMTX-Datei

Ein ausdrücklich markierter Framework-Bereich wird beim Build extrahiert und zu einem separaten Provider kompiliert. Das Artefakt enthält weiterhin eine Referenz; die gemeinsame Quelldatei erfordert kein Inline-Codefeld im RMT-Programm.

**Feasibility:** Plausibel, aber deutlich mehr Frontendarbeit als S1. Zu lösen sind zwei JSX-Semantiken, virtuelle Module, Import-Zuständigkeit, Scopes und Source Maps. Ein JSX-Import-Source gilt nicht automatisch pro beliebigem verschachteltem Bereich; ein Compiler muss die Bereiche gezielt aufteilen.

Ein freier Zugriff des eingebetteten JSX auf RMTX-Variablen würde implizite Closures erzeugen. Die Grenze sollte stattdessen sichtbare kontrollierte Props und deklarierte Intents verwenden. Vorhandener Framework-Kontext, Hooks und lokale Closures bleiben innerhalb des Providers. RMT-Actions werden referenziert beziehungsweise über den Intent-Port angesprochen.

**DX:** Vorteil einer zusammenhängenden Datei. Nachteil eines leicht übersehbaren Wechsels zwischen nativer Template-Semantik und Framework-Code. Verschachtelte RMT- und Framework-Ownership ist damit noch nicht gelöst.

**AX:** Lokale Änderungen können weniger Dateisprünge erfordern. Die Chance einer Boundary-Verwechslung steigt jedoch, wenn in identischer JSX-Schreibweise zwei verschiedene Semantiken gelten. Ein deutlicher Bereichsmarker, eindeutige Diagnosen und eine Planansicht wären Pflicht.

**Empfehlung:** Nach S1 und nach der nativen Syntaxentscheidung prüfen. Nicht mit einer unsichtbaren automatischen Umschaltung beginnen.

### S3 – JSX-/Codeinhalt direkt im Datenartefakt

Hier sind drei Fälle zu unterscheiden:

- **Transporthülle mit vorkompilierten Modulen:** Technisch möglich, wenn Code und deklarative Daten unterschiedlich typisiert, gehasht, ausgeliefert und geladen werden. Das ist ein neuer Artefakt-/Delivery-Vertrag und kein unverändertes RMT-JSON. Getrennte adressierte Assets passen besser zum vorhandenen Pfad.
- **Serialisierter JSX-/JavaScript-AST in einem Buildartefakt:** Ebenfalls technisch möglich. Auch Funktionssyntax kann als JSON-Baum beschrieben werden, ohne einen JavaScript-Funktionswert zu serialisieren. Das widerspricht der reinen Dateneigenschaft nicht, macht diesen Baum aber noch nicht zu gültiger deklarativer RMT-Semantik. Er müsste als eigener fremder Teilbaum typisiert, mit Quellherkunft/Imports/Scopes und einem Compiler-Pin versehen und vor der Anwendungsauslieferung in geprüfte Module oder native IR abgesenkt werden. Eine solche Bau-/Transporthülle benötigt keinen zusätzlichen Produktionsruntime-Compiler. Sie ist eine Artefaktentscheidung und keine neue Autorensyntax; ein fremdes Compiler-AST-Format sollte nicht ungeprüft zum stabilen öffentlichen RMT-Vertrag werden.
- **Roher JSX-String mit Runtime-Compiler:** Zusätzlich nötig wären Compiler-Auslieferung, Fehlerabbildung, Caching und eine neue Ausführungs-/CSP-Regel. Eine Ausführung über `eval`/`Function` berührt entsprechende CSP-Freigaben; ein Blob-/Modulweg vermeidet diese konkrete Technik, passt aber ebenfalls nicht unverändert in den bestehenden versiegelten Graphen. Neue Codebytes und ihre Herkunft müssten vor Ausführung überprüft werden. Ein Digest allein macht Quellcode weder vertrauenswürdig noch sandboxed. [W3C: CSP und String-Kompilation](https://www.w3.org/TR/CSP3/#can-compile-strings), [bestehender Deployment-Pfad](../../xtend-maraca/xtension-deployment.js).

**DX:** Kann zunächst bequem erscheinen, erschwert aber normale Typprüfung, Imports, Rename und produktionsnahe Fehlermeldungen. JSON-Strings mit eingebettetem Code erschweren Reviews zusätzlich.

**AX:** Höherer Bedarf an Escaping und an Reparaturen über mehrere Repräsentationen. Ein klar typisierter Modultransport ist dabei wesentlich besser als frei interpretierte Code-Strings, bleibt aber unnötig komplex gegenüber S1.

**Empfehlung:** Raw-JSX mit Runtime-Kompilierung nicht als Standard-Produktionspfad. Vorkompilierte Module oder ein ausdrücklich versionierter Build-AST sind als Transportbündel vertretbar; ein konkreter Vorteil gegenüber S1 ist noch nachzuweisen. Ein Entwicklungswerkzeug könnte JSX im Editor/Build vorab kompilieren; dafür braucht es keinen Runtime-Compiler in der ausgelieferten Anwendung.

## 8. Gemeinsame Architekturgrenzen

### 8.1 Ein gültiger AST ist noch kein vollständiges RMTX-Backend

Der Classic-Eingang prüft deklarative Struktur und Semantik. Unbekannte UI-Knoten, Funktionen oder neue Metadaten dürfen nicht als vermeintlich unveränderter alter Vertrag eingeschleust werden. Der UI-Sidecar-/IR-Spike aus D1 muss zuerst die tatsächliche Abbildungsgrenze klären. Bei späteren Änderungen sind Schema-/API-Versionen anzuheben und Legacy-Verträge beizubehalten.

Der Compiler schreibt in bestehenden Ausgaben teilweise noch die Syntaxherkunft `rmt-vnext` fest. Auch der [Importresolver](../../tools/rmt-language/vnext-import-resolver.js) akzeptiert derzeit `.rmt`; die [Compilation Session](../../tools/rmt-language/compilation-session.js) ruft den Classic-/vNext-Sourcepfad auf. Neue Endungen, Frontends, virtuelle Module und Cacheidentitäten müssen bewusst ergänzt werden. Nur einen anderen Parser vorzuschalten reicht nicht.

### 8.2 Model und Framework-State

Persistente/deep-linkbare kontrollierte Felder sollten weiter durch RMT-Model und die vorhandene XTend-State-/URL-Anbindung geführt werden. Framework-Code erhält Props und sendet validierte Intents. Lokaler Framework-State darf existieren, ist aber ohne ausdrücklichen Vertrag nicht Bestandteil von Deep Links oder dem Model-Restore. Zwei unabhängige schreibende Autoritäten für dasselbe Feld sind zu vermeiden.

### 8.3 Granularität und DOM-Ownership

Native RMT-Struktur kann die im Plan ausdrücklich repräsentierten Einheiten orchestrieren. Ein fremder JSX-Unterbaum ist zunächst eine Host-Einheit. Eine innere `.map(...)`-Liste oder ein Button wird dadurch nicht automatisch zu einer eigenen Kernel-Work-Unit.

Mehrere kleine Hosts können die äußere Granularität erhöhen, kosten aber zusätzliche Roots, Bindungen und Ressourcen. Geteilte Peer-Module verbinden nicht automatisch React-Kontexte oder Vue-Provide/Inject über verschiedene Roots. Größe und Anzahl der Inseln sind deshalb eine bewusste Abwägung.

Das heutige A05-Profil verlangt disjunkte exklusive Container. Gemeinsam bearbeitete Children, Cross-Framework-Slots, Portale außerhalb der Grenzen oder „React rendert hinein, RMT verändert denselben Teil“ benötigen eigene Übergabeverträge. Keine der Syntaxvarianten hebt diese Grenze auf.

### 8.4 Gleiche Oberfläche, unterschiedliche Details

| Detail | Zu entscheidender nativer RMT-Vertrag | Gefahr einer stillen Framework-Annahme |
| --- | --- | --- |
| `key` | Typisierte Adresse und Lebensdauer der wiederholten RMT-Instanz | React-Element-Keys sind Strings; `1` und `"1"` dürfen nicht aus diesem bereits normalisierten Wert als verschiedene RMT-Adressen rekonstruiert werden |
| `onInput` / `onChange` | Eventname, Payload-Lowering, Action, Commit-Abschluss | Native DOM-Ereignisse, React-Ereignissemantik und der XTension-Intent-Port sind unterschiedliche Stufen |
| `class` / `className`, `style` | Native Attribute und zugelassene serialisierbare Styles | React-Props sind nicht ohne Vertrag ein beliebiges natives Deskriptorformat |
| `value` / `defaultValue` | Kontrolliertes Model-Feld oder einmaliger Initialwert | Ein lokaler UI-Wert ist noch kein verwalteter/deep-linkbarer State |
| `ref`, Callback, Closure | Explizite Capability-Grenze beziehungsweise Compiler-Referenz | Ein JavaScript-Funktionswert kann nicht einfach Teil des deklarativen AST werden |
| `data-*` / Metaattribute | Geschlossene RMT-Metadaten und erlaubte DOM-Attribute getrennt prüfen | TypeScript toleriert bestimmte unbekannte Attributnamen mit Bindestrich; Tippfehler können ohne RMT-Prüfung durchgehen |
| `<For>` / `<RMT.For>` | Reservierter Operator oder aufgelöster Compiler-Symboltyp | Großschreibung allein entscheidet keine RMT-Semantik; Benutzerkomponenten können gleiche Namen haben |
| Fragment / mehrere Children | Abbildung auf native Knoten oder einen ausschließlich vom Framework besessenen Container | Mehrere Framework-Children begründen noch keine geteilte Ownership |

Die Key-Unterscheidung wurde lokal mit React 18.3.1 und dem tatsächlichen RMT-Adressencoder geprüft. Auch die React-Referenz beschreibt die String-Normalisierung von Keys. [React: Element-Identität](https://react.dev/reference/react/createElement).

XML-Namespace-Tags und Member-Tags sind in der JSX-Grammatik vorgesehen. Stock-React-Transforms unterstützen Namespace-Tags aber nicht durchgehend in ihrer Standardkonfiguration; Babel dokumentiert dafür die standardmäßig aktive Ablehnung. `<RMT.Surface>` ist deshalb ein sinnvoller Interop-Vergleichskandidat zu `<rmt:surface>`, ohne damit D04 zu entscheiden. [JSX-Grammatik](https://react.github.io/jsx/), [Babel-Namespace-Option](https://babeljs.io/docs/babel-plugin-transform-react-jsx#throwifnamespace).

### 8.5 SSR, Targets und Release

Ein nativ abgesenkter Ausdruck muss die jeweiligen Browser-/Node-/PHP-Profile erfüllen. JavaScript-ähnliche Schreibweise schafft keine automatische PHP-Ausführung. React-JSX als Provider verwendet seinen tatsächlichen Renderer; ein Node-SSR-Ergebnis ist kein Beleg für eine PHP-Implementierung desselben Frameworks.

Der vorhandene A05-Pfad bleibt auf sein synchrones Profil begrenzt. Asynchrone Komponenten, React-Suspense oder Cross-Framework-Portale werden durch einen neuen Source-Loader nicht automatisch unterstützt. RMTX-Herkunft, stabile Host-/Root-Identitäten und geänderte Modulbytes müssen außerdem bis in Signaturen, Restore, Replay und Delivery-Provenienz nachvollziehbar bleiben.

## 9. Vergleichsmatrix

Die Einstufungen sind **relative Architekturbewertungen**, keine gemessenen Entwicklungszeiten oder Erfolgsraten. „Hoch“ bei Aufwand bedeutet mehr neue Arbeit. Gemeinsame Voraussetzungen wie UI-Abbildung und semantische Prüfung sind bei allen nativen Varianten einzurechnen.

| Variante | Bestandsnähe | Aufwand bis zu einem belastbaren Pfad | Native RMT-Granularität | Allgemeine JSX-/React-Übernahme | Human-DX | AX-Hypothese |
| --- | --- | --- | --- | --- | --- | --- |
| A: alles als Tags | Mittel | Mittel–hoch | Hoch bei vollständigem Lowering | Niedrig–mittel | Explizit, aber potenziell umfangreich | Gute strukturelle Führung; neue Namen und Boilerplate |
| B/D1: Standardnähe, begrenzte Expressions, native Ausgabe | Mittel | Hoch | Hoch für abgesenkte Konstrukte | JSX-Syntax gut; React-Semantik begrenzt | Vertraute Scopes, dafür sichtbare Subset-Regeln nötig | Gute Ausgangslage mit scharfen Diagnosen; React-Annahmen sind das Hauptrisiko |
| C: RMT-Deklarationen plus JSX-Block | Mittel | Hoch, besonders im Editor | Hoch bei gemeinsamer Semantik | Teilweise | Gute Domänendarstellung, zwei Sprachmodi | Kann nach Domäneneinweisung gut sein; Übergänge sind Fehlerstellen |
| D1 nur als Runtime-Factory ohne AST-Lowering | Oberflächlich hoch | Für volle Semantik hoch | Nicht automatisch gegeben | JSX syntaktisch gut | Verdeckte Reaktivitäts-/Auswertungsregeln | Vertraute Oberfläche kann falsche Erwartungen erzeugen |
| D1 als ausdrückliches Build-DSL | Mittel | Mittel–hoch | Hoch für bewusst erzeugte IR-Operatoren | JSX-Syntax gut; allgemeines JS nicht automatisch reaktiv | Gewohnte Dateiwerkzeuge, dafür Builder-/Referenzregeln | Typisierte Operatoren können helfen; Build-Determinismus und Quellenbezug sind zusätzliche Anforderungen |
| D2: gewöhnliches React-TSX als App/View | Mittel für normalen Modulkomfort; Rendering vorhanden | Mittel–hoch | Äußerer Host, innen Framework | Hoch nach Modul-/Provider-Integration | Niedrige React-Einstiegshürde; RMT-Metadaten zusätzlich nötig | Gut für Übernahme vorhandenen Codes, anfällig für Verwechslung der State-Autorität |
| S1: TSX mit Peer-Injektion als Provider | Hoch für den begrenzten Fall | Niedrig–mittel | Deklarierte Hosts, innen Framework | Begrenzt; normale npm-/ESM-Module sind Zusatzumfang | Klare Datei- und Zuständigkeitsgrenze | Gut navigierbar; Bindungsänderungen betreffen mehrere Stellen |
| S2: eingebetteter Framework-Bereich | Niedrig–mittel | Hoch | Host-Grenze, keine automatische innere Orchestrierung | Potenziell gut nach Extraktion | Eine Datei, aber Semantikwechsel | Weniger Dateisprünge; höhere Gefahr von Boundary-Fehlern |
| S3: Code-/JSX-String mit Runtime-Kompilierung | Niedrig | Hoch einschließlich Delivery/Tooling | Nicht durch Einbettung gewonnen | Abhängig von Zusatzruntime | Schwache statische Rückmeldung | Escaping, versteckte Ausführung und schlechtere Reparaturlokalität |

Ein serialisierter JSX-AST oder eine Hülle vorkompilierter Module aus S3 ist in dieser Matrix kein Runtime-Compilerfall: Nach der Übersetzung gelten die Eigenschaften des gewählten nativen beziehungsweise Framework-Pfads. Zusätzlich entstehen Kosten für ein stabiles Bau-/Transportformat.

**Sicherheit der Einschätzung:** Hoch bei den gelesenen Provider-Grenzen und den eng geprüften Syntax-/Key-Befunden; mittel bei der Wiederverwendung des Toolings; noch niedrig bei Gesamtaufwand und vergleichender DX-/AX-Wirkung ohne vollständigen Frontend-PoC.

**Gewichtung nach Plattformziel:** Für eine eigenständige native Orchestrierung sind Ausdruckskontrolle, Semantiktreue, Granularität und portable Artefakte die Ausschlusskriterien. Für eine React-zentrierte Plattform mit XTend als Shell kann D2 den höheren strategischen Wert haben. Diese Priorität sollte ausdrücklich beschlossen werden; eine scheinbar neutrale Syntaxwahl würde sie sonst implizit festlegen.

## 10. AX als eigenständiges Abnahmekriterium

AX meint hier: Wie zuverlässig kann ein Agent die Quelle verstehen, ändern, prüfen und aus einem Fehler heraus reparieren, ohne Laufzeitverträge zu verletzen? Breite JSX-Bekanntheit ist dafür nur eine mögliche Einflussgröße. Es gibt in diesem Projekt noch keine Messung, die daraus einen Qualitätsvorsprung ableitet.

Für alle Varianten erforderlich:

1. **Eine geteilte fachliche Analyse** für Compiler, Linter, LSP und CLI. Kein separater „Agentenparser“ mit anderer Semantik.
2. **Maschinenlesbare Diagnosen** mit stabilem Code, Original-URI, Range, betroffenen Symbolen und verwandten Fundstellen. Grenzfehler müssen „Framework-Code im nativen Bereich“ beziehungsweise „nicht deklarativ absenkbar“ konkret benennen.
3. **Typisierte Symbolabfragen und sichere Änderungen:** Rename muss auch RMT↔RMTX- und Provider-/Binding-Referenzen erfassen. Änderungen brauchen nachvollziehbare Diffs und bei symbolischen Operationen Versions-/Konfliktprüfung.
4. **Plan-/Boundary-Ansicht:** Für einen Knoten oder State erklären können, wer ihn besitzt, welcher State autoritativ ist, welche Action einen Intent verarbeitet und welche Lane/Capabilities gelten.
5. **Wenige kanonische Schreibweisen:** Formatter, Beispiele, Gegenbeispiele und eine klare Grenze zwischen nativen Operatoren und fremden Komponenten. Keine Sammlung austauschbarer, aber leicht unterschiedlicher magischer Abkürzungen.
6. **Lokale Prüfschritte ohne App-Ausführung:** Syntax, Typen, Referenzen und unterstützte Targets prüfen, bevor Browser-/SSR-Tests erforderlich sind.

LSP stellt standardisierte Editorfunktionen wie Diagnosen, Completion und Navigation bereit. Daraus folgt für AX die Möglichkeit gemeinsamer Werkzeuge, aber keine automatische Agentenqualität oder universelle Unterstützung jedes Agentenclients. [Microsoft: Language-Server-Architektur](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide).

### Vorgeschlagener AX-/DX-Vergleich

A, B/D1 und C erhalten dasselbe kleine Programm und dieselben Aufgaben. S1 wird zusätzlich mit seinem vollständigen RMT-/RMTX-Host betrachtet; ein isoliertes React-Widget wäre ein unfairer Vergleich ohne Orchestrierungsarbeit.

| Aufgabe | Besonders zu beobachtender Fehler |
| --- | --- |
| Zwei geschachtelte Wiederholungen; Keys `1` und `"1"`; danach Reordering | Index-Key, String-Coercion oder falscher Scope |
| Kontrolliertes Suchfeld ergänzen und per Intent ändern | Zweite schreibende State-Autorität oder Callback im Datenartefakt |
| Surface suspendieren/zerstören und einen verspäteten Loader abschließen lassen | Stale Callback, fehlendes Cleanup oder verlorene Identität |
| Lane und Budget ergänzen | Metaattribute nur optisch verändert, aber kein tatsächlicher Kernel-Effekt |
| State-/Action-Symbol über zwei Dateien umbenennen | UI, Sidecar oder Provider-Verweis übersehen |
| Ungültigen Prop-/Payload-Typ reparieren | Nur Syntax repariert, semantische Inkonsistenz bleibt |
| Synchrone SSR-Adoption mit frühem Intent | Mount als Resume ausgegeben oder Replay vor Restore |
| Fremde JSX-Komponente ergänzen und Ownership erklären | Innere Framework-Children als native RMT-Einheiten behandelt |

Zu messen sind getrennt: Parse-Erfolg, Typ-/Semantikerfolg, tatsächlich bestandene Runtime-Parität, Verletzungen von State-/Ownership-Regeln, Anzahl Reparaturschritte, benötigter Kontext, Toolaufrufe, Zeit, Tokens und Review-Aufwand. Ein bloß kompilierendes Ergebnis ist kein Erfolg, wenn es den falschen State oder eine andere Lifetime steuert.

Der Versuchsplan sollte mindestens mehrere unabhängige Läufe pro Aufgabe/Variante, dieselben Modell-/Toolversionen und vergleichbare Dokumentationsbudgets verwenden. Generische und mit RMT-Domänenwissen ausgestattete Agenten sind getrennt auszuwerten; die Reihenfolge der Varianten sollte wechseln. Erst danach sind quantitative AX-Rangfolgen belastbar.

## 11. Lokale Machbarkeitsproben

Die folgenden **elf Proben** wurden unter Node **24.18.0 und 26.5.0** mit lokal vorhandenem TypeScript **5.9.3**, esbuild **0.25.12** und für die Key-Probe React **18.3.1** ausgeführt. Das Workspace hatte diese Build-Abhängigkeiten nicht installiert; die vorhandenen isolierten `/tmp`-Abhängigkeiten wurden ohne Änderung von Manifest oder Lockfile verwendet. Insbesondere ist esbuild 0.25.12 **nicht** die im aktuellen Root-Manifest deklarierte Reihe `^0.28.2`. Der spätere Integrations-PoC muss deshalb zusätzlich das tatsächlich gepinnte Projekt-Toolchainprofil prüfen.

| Probe | Beobachtung | Was daraus nicht folgt |
| --- | --- | --- |
| 1. TSX-Tag mit `as="item"` und Child-Verweis `item` | TypeScript meldet den ungebundenen Namen; die deklarierte Child-Form passt zusätzlich nicht zur Render-Funktion | Tag-Scope sei grundsätzlich unmöglich; er wäre eine neue Sprach-/Toolingregel |
| 2. TSX-Render-Prop mit `item => ...` | Mit passenden deklarativen JSX-Typen keine TypeScript-Diagnose | RMT-Lowering oder Runtime-Semantik sei bereits implementiert |
| 3. Unbekanntes `data-rmt-lnae` | Keine TypeScript-Diagnose trotz geschlossener Intrinsic-Definition | Metadaten könnten ohne eigene RMT-Prüfung frei ergänzt werden |
| 4. `<RMT.Surface ... />` | TSX-Parser akzeptiert Member-Tag | Ein RMT-Surface-Operator sei bereits aufgelöst |
| 5. `<rmt:Surface ... />` | TSX-Parser akzeptiert Namespace-Tag | Beliebige React-/Babel-Transformkonfiguration akzeptiere es ebenfalls |
| 6. RMT-Deklaration mit JSX-View-Block | Standard-TSX-Parser meldet vier Syntaxdiagnosen | Mischsyntax sei technisch ungeeignet; sie benötigt ihre eigene Gesamtgrammatik |
| 7. Factory-TSX auf injiziertes `React.createElement` transformiert | Ausgabe wurde vom **tatsächlichen vorhandenen Provider-Graph-Capture angenommen** | Direkter Maraca-TSX-Eingang, Browser-/SSR-Abnahme oder voller Framework-Modulimport sei damit nachgewiesen |
| 8. Dasselbe TSX mit automatischem JSX-Transform | Provider-Graph lehnt den erzeugten Paketimport `react/jsx-runtime` ab | Automatischer Transform sei prinzipiell nicht integrierbar; dafür braucht es eine geregelte Peer-/Runtime-Abbildung |
| 9. Gewöhnliches React-Modul mit Default-Import, Top-Level-`const` und Default-Export | Transformiertes Modul wurde abgewiesen; hier bereits am Default-Import | Die übrigen Modulformen würden ohne Anpassung zulässig; der gelesene Vertrag schließt sie ebenfalls aus |
| 10. `.map(...)` an einer einfachen Custom-JSX-Factory | Die Factory erhält zwei bereits erzeugte Listeneinträge, keine symbolische Repeat-Operation | Ein Compiler könne ein solches Muster nicht vorher auf AST-Ebene erkennen |
| 11. React-Key und RMT-Adresse | React liefert für `1` und `"1"` denselben String-Key; der RMT-Adressencoder liefert verschiedene Adressen | React könne die vorhandene typisierte RMT-Identität ohne ergänzenden Vertrag ersetzen |

Verwendete APIs: `ts.createSourceFile`, `ts.createProgram` mit `jsx: preserve`, `ts.transpileModule`, `esbuild.transformSync` sowie `captureProviderGraph` aus der Codebase. Für die Scope-Probe wurden nur lokale JSX-Typdeklarationen verwendet, kein vorgetäuschtes RMTX-SDK. Die Factory-Probe prüfte die emittierten echten ESM-Bytes und deren Digests mit dem existierenden Graphvalidator. Dabei wurde dessen isolierter Struktur-/Importpfad aufgerufen, nicht die vollständige Manifest-, Binding- und Runtime-Zulassung. Bei der Factory-Auswertung wurde ausschließlich fest vorgegebener eigener Probecode ausgeführt.

Temporäres Prüfmaterial: `/tmp/xtend-a06-review/probes.cjs`, `/tmp/xtend-a06-review/results.json`. Die Aussagen und wesentlichen Eingaben stehen im Bericht; diese temporären Dateien sind keine dauerhaften CI-Gates. Es wurden **kein RMTX-Frontend, keine neue JSX-Runtime, keine Browserintegration und kein Agentenbenchmark** implementiert oder als fertig ausgegeben.

## 12. Empfohlener nächster Entscheidungsablauf

### A06.1a – Semantik und Ausgabe festlegen

Vor einer vollständigen Grammatikentscheidung festhalten:

- RMT-Model und Actions führen die kontrollierten Felder.
- Native UI, native Orchestrierung und fremde Framework-Unterbäume sind unterscheidbar.
- Im bevorzugten statischen Frontend wird Source nicht ausgeführt, um deklarative Absicht zu erraten. Eine Alternative als ausführbares Build-DSL wäre ausdrücklich mit eigenen Ausführungs-/Determinismusregeln zu beschließen.
- Erlaubte Expressions werden auf einen dokumentierten Bereich abgesenkt; keine stillen semantischen Fallbacks.
- Datenartefakte und ausführbare Module haben getrennte Verträge; Fabric bleibt verbindlich.
- Bestehende Schemas erhalten bei notwendigen Änderungen neue Versionen; ältere Verträge werden nicht im Namen der Syntaxvereinfachung umgedeutet.

### A06.1b – Drei gleichwertige Syntax-Spikes

Dasselbe Formular mit Selector, Action, zwei keyed Hosts, Lane, Ressourcen-Cleanup und synchronem SSR-Handoff in A, B/D1 und C ausarbeiten. Die Referenz muss mindestens eine **nicht triviale** Orchestrierungsfunktion enthalten; ein statischer JSX-Baum würde die eigentliche Plattformfrage nicht beantworten.

Je Variante Syntax, Typen, unerlaubte Fälle, Originalranges, repräsentativen normalisierten Plan und menschliche Lesbarkeit vergleichen. Für B/D1 insbesondere render-prop-basierte Scopes gegen erkannte `.map(...)`-Muster testen. Für A prüfen, ob Deklarationen noch kompakt bleiben. Für C die virtuellen TSX-Dokumente und Rename über die Sprachgrenze früh erproben.

### A06.1c – S1 als separaten Interop-Spike prüfen

TSX mit Peer-Injektion vor dem Provider-Capture kompilieren. Quell-/Ausgabedigest, Source Map, Typechecking, Größenbudget und Initialisierungszeitpunkt erfassen. Danach einen tatsächlichen Model→Props→Intent→Action→Model-Durchlauf einschließlich Cleanup und SSR unter den bestehenden Runtime-Regeln prüfen.

esbuild kann JSX transformieren und TypeScript-Syntax entfernen, führt aber keine Typprüfung durch. Ein eigener Typecheck und RMT-/Binding-Prüfungen bleiben deshalb Teil dieses Spikes. [esbuild: TypeScript und JSX](https://esbuild.github.io/content-types/#typescript).

### A06.1d – Entscheidung als ADR treffen

Erst anhand dieser Ergebnisse D02–D06 und D08 aktualisieren. Die ADR soll Default-Syntax, Expression-Grenze, Symbol-/Namespace-Regeln, native UI-Abbildung, Provider-Interop, Source-Mapping und Einführungs-/Koexistenzstrategie gemeinsam begründen. Verworfene Varianten mit ihrem jeweils besten Gegenargument dokumentieren.

**Vorläufige Priorität:** B/D1 und C gegeneinander testen, A als vollständigen Gegenentwurf mitführen, S1 unabhängig davon für frühe Interoperabilität vorbereiten. S2 nach belastbarer Boundary-/Tooling-Erfahrung bewerten. S3 mit Runtime-Kompilierung als Produktionsstandard zurückstellen; einen Build-AST-Transport nur bei nachgewiesenem Bedarf ergänzen. D2 bleibt eine strategische Alternative, wenn die Plattform ausdrücklich Framework-zentriert werden soll.

Damit wird eine mögliche JSX-Unterstützung zum kontrollierten Erweiterungspfad. Die Auswahl der RMTX-Syntax selbst bleibt bis zur ADR offen; die Release-Abnahme von 0.9 wird durch dieses Reporting nicht vorweggenommen.

## 13. Rückprüfung des externen Architekturfeedbacks

**Stand: 14. November 2026.** Bewertet wurde der bereitgestellte Anhang `RMTX-A06-Architekturfeedback-XTensions-2.0.md`, SHA-256 `b96587675f5bdf9141e252450e1d98407a66115e6bb9ec6c93ff49e4523968d5`. Der Codeprüfstand ist weiterhin der oben angegebene Commit. Die Abschnitte 1–12 dokumentieren die Analyse vom 13. November; dieser Abschnitt ergänzt die Rückprüfung. Die Empfehlungen, Invarianten und Abnahmekriterien des Anhangs wurden als Gegenstand der Bewertung gelesen, nicht als erteilte Implementierungsaufträge oder bereits beschlossene ADR.

### 13.1 Gesamturteil

**Das Review ist eine tragfähige Architekturpräzisierung, aber noch keine implementierbare Syntax- oder Host-Spezifikation.** Sein stärkster Beitrag ist die ausdrückliche Unterscheidung zwischen der Granularität der Host-Orchestrierung und der Granularität des Framework-Renderings. Das entspricht dem vorhandenen Kernel-/Fabric-Pfad einschließlich seiner offen ausgewiesenen Grenzen. Der Anhang liefert jedoch keinen unabhängigen Laufzeit- oder AX-Nachweis. B/D1 + S1 bleibt eine gut begründete Arbeitshypothese; C ist weiterhin mit demselben vollständigen Orchestrierungsprogramm zu vergleichen.

| Aussage des Reviews | Bewertung nach Codeabgleich |
| --- | --- |
| Framework-freier Microkernel, Ausführung über Adapter | Übernehmen als Architekturanforderung. Der Scheduler benötigt keine React-/Vue-Runtime. Die Komposition wählt die Adapter außerhalb des Kernels. Fabric bleibt verbindlich. |
| Explizite Hosts statt privater Fiber-/VDOM-Steuerung | Bestätigt. Lifecycle und ausdrücklich gewährte kooperative Arbeit sind planbar; autonome Framework-Updates, harte Präemption und generelles Stoppen von Effects sind es nicht. |
| Eine Model-Autorität für kontrollierte Felder | Bestätigt. Ein konkretes Feature muss aber die vollständige Props-/Intent-Bindung deklarieren; Framework-lokaler State wird durch den Host allein nicht deep-linkbar. |
| Native UI und Provider-Hosts gemeinsam validieren | Richtige Zielanforderung. Der gemeinsame Plan und dessen Herkunft müssen nachweisbar sein; daraus folgt noch keine Entscheidung für einen monolithischen neuen AST. |
| Zwei unabhängige Hosts unter einer Surface | Auf Autorenebene sinnvoll. Die direkte Abbildung auf dieselbe heutige Binding-/Owner-Surface ist eingeschränkt; siehe R1. |
| Ownership, Provenienz/Capabilities und Sicherheitsisolation trennen | Richtig und bereits mit A05 vereinbar. Code im selben Realm kann nicht durch Metadaten oder Fabric gegen beliebige DOM-/Globalzugriffe abgeschottet werden. Ein separates iframe-Profil ist ein eigener Umfang. |
| Optionale kooperative Regionen | Als spätere Erweiterungsrichtung vertretbar. Heute kein zugelassener Standardvertrag und kein Ersatz für nachgewiesene Adapterfähigkeiten. |

Quellen für die Bestandsaussagen sind die [Host-Typverträge](../../tools/xtensions/runtime-host-controller.d.ts), die [reale Komposition](../../xtend-maraca/xtension-composition-runtime.mjs), die [Capability-Verhandlung](../../tools/xtensions/host-capability-negotiation.js) und das [A05-Profil](../rmtx-a05/README.md). Angular und Vanilla bleiben strategische Zieladapter; das Review weist damit keine Gleichwertigkeit zum nachgewiesenen React-/Vue-Pfad nach.

### 13.2 Präzisierungen vor einer ADR

**R1 – Surface und Renderziel müssen getrennt betrachtet werden.** Der heutige [Binding-Validator](../../tools/xtensions/state-binding-artifact.js) verbietet zwei Binding-Deklarationen mit derselben `surface` und verlangt pro Deklaration einen leeren, keyed, statischen Renderhost. Die [Manifest-Normalisierung](../../xtend-maraca/xtension-composition-contract.mjs) verlangt zugleich `ownerSurface === binding.surface`. Wiederholte Instanzen **einer** Deklaration können dagegen bereits eigene `hostSurface`-Ziele unter ihrer gemeinsamen owning Surface erhalten.

Das Beispiel mit Galerie und Bewertungen unter `product-details` ist daher keine unverändert vorhandene 1:n-Abbildung für zwei verschiedene Deklarationen. Ein Lowerer müsste entweder eigene Host-Surfaces mit wirksam nachgewiesener Eltern-/Lifecycle-Verknüpfung erzeugen oder owning Surface und Renderziel in einem versionierten Vertrag entkoppeln. Welche Variante besser ist, ist eine konkrete Aufgabe für A06.1a und den IR-/Sidecar-Vergleich. Die bloße JSX-Verschachtelung darf keine nicht implementierte Lifecycle-Beziehung versprechen.

**R2 – Der beispielhafte `XTensionHostV2` ist keine passende Ablösung des Bestands.** Es existieren bereits versionstreue Runtime-Hosts bis API **7.0.0** für SSR/Adoption. „XTensions 2.0“ ist der Projektname, nicht die nächste technische Host-ABI. Der Entwurf lässt strukturierte Erfolgs-/Fehlerergebnisse, Capability-Verhandlung, Idle-Barrieren und den separaten Adoptionspfad weg. Das ist für eine Skizze zulässig, wäre als neuer Basisvertrag aber ein Rückschritt.

Die bestehenden Methoden liefern `RuntimeHostResult`; `update` erhält ein kontrolliertes Props-Signal, keinen frei gewählten Revisionszähler. `reportError` liefert ebenfalls ein Ergebnis. Terminaler Autoritätsentzug und Cancellation beginnen unmittelbar und warten nicht auf die Scheduler-Zulassung; das tatsächliche Framework-Cleanup kann später abschließen. Eine neue Fassade müsste diese Garantien bewahren. Das Review rechtfertigt für sich noch keinen weiteren API-Major und keine Implementierung eines parallelen Host-Protokolls.

**R3 – Abschluss und Revision sind mehrere unterschiedliche Verträge.** Die Frage des Reviews, was ein Promise bestätigt, ist berechtigt. Im vorhandenen [React-Adapter](../../tools/xtensions/react-runtime-adapter.js) bestätigt ein Layout-Effect des Commit-Wrappers die Lieferung; der [Vue-Adapter](../../tools/xtensions/vue-runtime-adapter.js) wartet auf `nextTick()`. Das beweist weder einen sichtbaren Browser-Paint noch den Abschluss aller zukünftigen inneren Render-/Effect-Arbeit. Inaktive Graph-Hosts können Props zudem mit einer ausdrücklich als `surface-inactive` markierten, aufgeschobenen Lieferung übernehmen. Ein pauschales „erfolgreich heißt sichtbar“ wäre falsch. Vue beschreibt `nextTick()` als DOM-Flush-Barriere; Reacts `flushSync` wäre eine zusätzliche Integrationsentscheidung mit Nebenwirkungen, keine kostenlose universelle Bestätigungsstrategie. [Vue-Referenz](https://vuejs.org/api/general.html#nexttick), [React-Referenz](https://react.dev/reference/react-dom/flushSync).

Die [Binding-Registry](../../tools/xtensions/state-binding.js) verwaltet eine Lieferrevision und eine eigene Inkarnation. Surface-Generation, Work-Generation, SSR-Generation und eine etwaige fachliche Model-Konfliktversion sind andere Größen. Der Kernel allein verwaltet diese Domänen nicht. Ein einzelnes `revision: number` am Host darf sie nicht ersetzen. Die vorhandenen Lifetime-Fences sind auch keine allgemeine Optimistic-Concurrency-Prüfung gegen jede fachlich veraltete Eingabe; eine solche Regel müsste eine Action ausdrücklich besitzen.

**R4 – Die Provider-Namen der Skizze passen nicht direkt zum aktuellen Manifest.** `react.product-gallery` und `vue.product-reviews` sind dort keine gültigen IDs. Zugelassen sind pfadsichere Namen mit Kleinbuchstaben, Ziffern und Bindestrichen, beginnend mit einem Buchstaben und höchstens 64 Zeichen. `react-product-gallery` und `vue-product-reviews` passen dazu. Eine neue Autorensprache könnte punktierte Aliase anbieten, müsste deren Auflösung aber ausdrücklich festlegen. Der Name allein pinnt weder Version noch Codebytes; diese Bindung bleibt Aufgabe des geprüften Provider-/Peer-Manifests.

**R5 – `hostId` sollte im Quelltext keine konkrete Runtime-Inkarnation vortäuschen.** Als stabiler Autorenschlüssel ist `declarationId` näher am vorhandenen Vertrag. Die tatsächliche Adresse besteht aus Dokument, Deklaration und typisierten Wiederholungsschlüsseln; die Registry ergänzt für eine neue Lifetime ihre Inkarnation. Ein wiederholtes `hostId="product-gallery"` wäre als globale Instanz-ID nicht eindeutig. Das DOM-Attribut `id`, eine fachliche Surface-ID und eine Binding-Adresse sind ebenfalls getrennte Identitäten.

**R6 – Props und Intents brauchen einen vollständigen Komponentenvertrag.** Die Galerie-Skizze reicht Bilder hinein, führt ihre Auswahl aber nicht als kontrollierten Prop zurück. Wenn die Auswahl deep-linkbar sein soll, benötigt sie beispielsweise auch `selectedImageId` aus dem Model sowie eine passende Action. `intents={{ selectImage: "product.selectImage" }}` kann sinnvolle Kurzsyntax sein, wenn der Compiler daraus **eindeutig** einen bestehenden Action-Verweis, ein versioniertes Payload-Schema und exakt passende Payload-Felder erzeugen kann. Der heutige Validator verlangt diese Daten und gleiche Action-Inputs. TypeScript-Typen allein sind kein Runtime-Validator.

Es gibt bisher keinen hier nachgewiesenen RMTX-Komponentenvertrag, der all diese Informationen aus dem String automatisch liefert. Ein solcher Vertrag könnte aus vorhandenen Deklarationen generiert oder zusätzlich definiert werden. Ohne eindeutige Typ-/Schemaquelle muss die Kurzsyntax mit einer Diagnose scheitern. Bei Wiederholungen kommen vertrauenswürdig aus der Adresse abgeleitete `keyFields` hinzu; sie dürfen nicht von einer gleichnamigen Provider-Payload überschrieben werden.

**R7 – Source-Anforderungen sind keine Grants.** Die Skizze muss `lane`, Budgets, Ressourcen und optionale Fähigkeiten als deklarierte Anforderungen beziehungsweise gewünschte Policy auffassen. Der vertrauenswürdige Anwendungshost erteilt weiterhin die Grants; Komponentencode darf weder Scheduler-/Scope-Ports erhalten noch seine Rechte per JSX-Attribut erhöhen. Fehlende Pflichtfähigkeiten blockieren; fehlende optionale Fähigkeiten werden als Degradation ausgewiesen. `updateRegion`, `setVisibility` und `reportWork` sind heute keine registrierten Feature-Namen. Ihre Einführung verlangt definierte Semantik, Adapter-Nachweise und passende Versionierung.

**R8 – Die Isolationsempfehlung ist richtig, aber kein neuer Pflichtumfang für A06.** Das Same-Realm-Profil setzt vertrauenswürdigen Provider-Code voraus. Ein separates Sicherheitsprofil mit sandboxed iframe erfordert eigene Origin-, Nachrichten-, State- und Lifecycle-Regeln; es sollte nicht still zum Host-MVP hinzugefügt werden. Auch die Wahl der Sandbox-Flags ist relevant: Der HTML-Standard beschreibt ausdrücklich die problematische Kombination von Scripts und Same-Origin-Freigabe bei gleich-originigem Inhalt. [HTML-Standard](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#attr-iframe-sandbox).

### 13.3 Was sich bereits zu einem konkreten Syntaxkandidaten verdichten lässt

**Die Operatorfamilie `RMT.Surface`, `RMT.XTension` und `RMT.For` ist ein guter Kandidat für B/D1.** Sie zeigt Orchestrierungs- und Provider-Grenzen im Quelltext und verwendet vorhandene TSX-Formen. Der Compiler muss die Symbole dennoch auflösen; ein gleich benannter Benutzerwert darf keine Kernel-Autorität erhalten. Member-Tags allein beschließen weder ein SDK noch ein Runtime-Ausführungsmodell. TypeScript kann JSX-Attribute und Children über passende Typdeklarationen prüfen; die zusätzliche RMT-Semantik und Herkunftsprüfung bleiben Compilerarbeit. [TypeScript-JSX-Referenz](https://www.typescriptlang.org/docs/handbook/jsx.html).

Eine präzisierte **Designskizze**, weiterhin kein heutiger Compilervertrag:

```tsx
// Ausschnitt eines vorgeschlagenen nativen RMTX-Profils.
// Model, Actions, Provider-Verträge und ProductHeader sind separat deklariert.
// RMT und model sind statisch aufgelöste Sprachsymbole; kein Source-Eval.
<RMT.Surface id="product-details">
  <ProductHeader product={model.product} />

  <RMT.XTension
    declarationId="product-gallery"
    provider="react-product-gallery"
    lane="visible"
    props={{
      images: model.product.images,
      selectedImageId: model.product.selectedImageId
    }}
    intents={{ selectImage: { action: "product.selectImage" } }}
  />

  <RMT.XTension
    declarationId="product-reviews"
    provider="vue-product-reviews"
    lane="idle"
    props={{ productId: model.product.id }}
  />
</RMT.Surface>
```

Diese Form verbessert das Review-Beispiel an drei Stellen: Die Provider-IDs passen zum bestehenden Namensprofil; die Deklaration wird von der Runtime-Identität getrennt; die Galerie führt die Auswahl als kontrollierten Wert. Die noch offenen R1- und R6-Verträge sind damit **sichtbar gemacht, nicht implementiert**. Insbesondere müssen die zwei getrennten Container und ihr wirksamer Surface-Owner erst korrekt erzeugt werden.

Für Wiederholungen eignet sich zunächst die lexikalisch eindeutige Callback-Form:

```tsx
// Zweite Designskizze. Auch keyFields ist hier nur vorgeschlagene Source-Syntax.
<RMT.For each={model.products} keyBy="id">
  {product => (
    <RMT.XTension
      declarationId="gallery"
      provider="react-product-gallery"
      props={{ images: product.images, selectedImageId: product.selectedImageId }}
      intents={{ selectImage: {
        action: "product.selectImage",
        keyFields: { productId: product.id }
      } }}
    />
  )}
</RMT.For>
```

Der Lowerer könnte `product.id` in diesem eng begrenzten Fall als Herkunft des deklarierten Wiederholungsschlüssels erkennen und in die vorhandene indexbasierte `keyFields`-Bindung übersetzen. Er dürfte nicht beliebige Ausdrücke im Namen vertrauenswürdiger Adressdaten ausführen. Die neue Callback-Syntax macht auch Wiederholungen nativer UI außerhalb der heutigen XTension-Bindung noch nicht automatisch implementiert.

Für einen ersten Syntax-Spike sind folgende Regeln konkret genug:

| Quellform | Vorgeschlagene Regel und Absenkung |
| --- | --- |
| `Surface.id`, `declarationId`, `provider`, Action-Verweis | Statische Namen; eindeutige Symbolauflösung, Dublettenprüfung und Rename-Verknüpfung. Statische Strings sind zulässig, wenn der LSP sie als Referenzen behandelt. Symbolische Handles sind eine zu vergleichende Alternative. |
| `props={{ ... }}` | Für den ersten Probeumfang Objektliterale mit geprüften Model-Pfaden. Keine Funktionen, Getter, freien dynamischen Zugriffe oder stillen Spreads. Literale/abgeleitete Werte benötigen ebenfalls eine dokumentierte IR-Abbildung; die heutige direkte State-Pfadbindung deckt nicht beliebige Expressions ab. |
| `intents={{ ... }}` | Deklarierte Event→Action-Zuordnung. Payload-Schema, Felder und Typen müssen aus einem überprüften Komponenten-/Action-Vertrag stammen oder ausdrücklich angegeben werden. Keine Funktionswerte im Datenartefakt. |
| `RMT.For` | Eine Ausdrucks-Callback-Form mit lexikalischem Item-Scope; `keyBy` zunächst als statischer Feldpfad. Typisierte Keys und Lifetime bleiben RMT-Verantwortung. |
| `RMT.XTension` | Ein opaker Host ohne native JSX-Children. Framework-Children gehören in dessen Provider; Slots/Portale benötigen einen eigenen Vertrag. |
| `lane` und weitere Orchestrierungsangaben | Validierte Anforderungen mit nachvollziehbarer Abbildung auf tatsächliche Kernel-Jobs; keine Garantie über autonome Framework-Arbeit und keine Source-Grants. |
| `ProductHeader` | Nur bei nachgewiesener nativer Definition absenkbar. Für den Probeumfang ist eine statisch expandierbare native Template-Definition denkbar; eine gewöhnliche React-Funktion darf nicht still ausgeführt werden. |

Das ist ein Kandidat für den **View-/Host-Teil**, noch keine vollständige Sprache. Wo Model, Selektoren, Actions, Policies, Ressourcen, Importe und native Komponenten definiert werden, bleibt die zentrale Vergleichsfrage zwischen B/D1 und C. Ein bequemes Host-Tag beantwortet sie nicht. Ebenso meint „kein implizites Ausführen von `.map()`“ nicht, dass jedes statisch erkennbar absenkbare `.map()`-Muster grundsätzlich verboten sein müsste. Der zulässige Teilumfang braucht eine positive Spezifikation und Originalquell-Diagnosen.

### 13.4 DX/AX und nächste Entscheidung

Der Review-Entwurf hilft Menschen und Agenten durch sichtbare Provider-Grenzen und einheitliche Operatoren. Stabile Deklarationsnamen, geschlossene Attribute, echte Referenzen und klare Item-Scopes sind eine bessere Arbeitsgrundlage als implizite Boundary-Wechsel. Der Vorteil bleibt eine Hypothese: Der Anhang misst weder Verständlichkeit noch Agentenerfolg.

Zu den Aufgaben aus Abschnitt 10 sollten deshalb zwei Fälle hinzukommen: **einen zweiten Provider unter derselben fachlichen Surface ergänzen** und **Galerieauswahl vom lokalen Framework-State in kontrollierten, nach SSR wiederhergestellten Model-State überführen**. Erfolg bedeutet jeweils einen korrekten Plan und tatsächliches Lifecycle-/State-Verhalten, nicht nur gültige TSX-Syntax. B/D1 und C müssen dieselben vollständigen Deklarationen und Sidecars mitbringen; eine kurze View-Datei darf nicht gegen eine vollständige Mischsyntax-App gewertet werden.

Die Reihenfolge aus dem Review ist sinnvoll, mit einer Ergänzung: **vor dem großen Frontend-PoC zuerst R1 als zwei-Host-Lowering-Fall und R6 als typisierten Komponentenvertrag konkretisieren.** S1 kann parallel als begrenzter Build-/Interop-Pfad untersucht werden. Es braucht dafür keinen neuen parallelen Host-Basisvertrag. Optionale Regionen und iframe-Isolation folgen eigenständig bei konkretem Bedarf. Die vorhandenen ADR-Fragen, die Syntaxentscheidung und der Release-Status bleiben offen.

### 13.5 Nachprüfung und Grenzen

Sieben ergänzende mechanische Proben liefen mit identischen Ergebnissen unter Node **24.18.0 und 26.5.0**, für die Parserprobe mit dem vorhandenen TypeScript **5.9.3**:

1. Die reale A02-Wiederholungsreferenz kompiliert und materialisiert drei keyed Hosts aus einer Deklaration.
2. Ein strukturell vollständiger Manifest-Probekörper akzeptiert die Provider-ID `react-product-gallery`.
3. Derselbe Probekörper mit `react.product-gallery` wird vom tatsächlichen Manifest-Normalisierer abgewiesen.
4. Zwei verschiedene Binding-Deklarationen mit derselben Surface werden vom tatsächlichen Binding-Validator abgewiesen.
5. Ein abweichendes `ownerSurface` wird vom tatsächlichen Manifest-Normalisierer abgewiesen.
6. Ein noch nicht registriertes Feature `updateRegion` wird abgewiesen.
7. Die originale TSX-Skizze aus dem Review hat keine Parserdiagnose. Das ist weder Typprüfung noch RMT-Lowering-Nachweis.

Die Manifest-Proben prüfen nur den Daten-/Referenzvertrag mit einem synthetischen Digest, keinen echten Provider-Capture, keine Quellbytes und keine Ausführung. Temporäres Prüfmaterial: `/tmp/xtend-a06-review/external-review-probes.cjs` und die dortigen `external-review-results-node24.json` / `external-review-results-node26.json`. Es wurde kein neuer Syntaxcompiler, Host-ABI, Komponentenvertrag oder Sicherheitsadapter implementiert. Die früheren elf Proben aus Abschnitt 11 bleiben historische Nachweise; für diese Dokumentergänzung wurde keine vollständige Framework-/Browser-Abnahme erneut ausgeführt.

## 14. A06.1a – Ausführbare Zwei-Host-Referenz

**Folgearbeit vom 14. November 2026:** Der [Zwei-Host-Fall mit Contract 1.0.0](two-host-case.md) konkretisiert R1/R6 aus der Rückprüfung. Ein kompilierbares Classic-Gegenstück, versionierte Props-/Intent-Daten, generierte Provider-Typen und echte React-/Vue-Prüfungen zeigen zwei getrennte Renderziele am selben vorhandenen A03-Surface-/Kernel-Owner. Der TSX-Kandidat bleibt ein Entwurf.

Die Referenz verwendet den expliziten Host-Pfad. Die automatische A04-Owner-/Renderziel-Abbildung wird weiterhin vom Legacy-Vertrag abgewiesen und als nächster Implementierungsabschnitt behandelt. SSR/Adoption dieses konkreten Zwei-Host-Falls, allgemeine native TSX-Komponenten und eine vergleichende DX-/AX-Abnahme werden durch den neuen Nachweis nicht vorweggenommen.
