# A01 – Implementierter Teilvertrag: Identitäten und Selektorquellen

Stand: **7. November 2026**. Behandelt A01-F02 und A01-F01. Dieser Teilvertrag beschreibt die implementierten Prüfgrenzen des bestehenden vNext-Compilers. Er ist kein vollständiges Fremdfrontend-Schema; die übrigen Feld-, Operator- und Zielregeln bleiben Gegenstand von [A01](README.md).

## 1. Core- und Source-Identitäten

Die logischen Source-Namen bleiben case-sensitiv. Die bestehende Core-ID-Bildung bleibt erhalten: Namenssegmente werden getrimmt, Zeichen außerhalb von `A–Z`, `a–z`, Ziffern, `.`, `_` und `-` durch `_` ersetzt, äußere Unterstriche entfernt und Buchstaben kleingeschrieben. Ein leeres Segment erhält den jeweiligen Fallback. Präfixe, Scope-Pfade und Positionssegmente hängen von der Record-Familie ab.

Damit bleiben beispielsweise `app.One` → `state:app.one` und `app.two` → `state:app.two` unverändert. Die gleichzeitige Deklaration von `app.One` und `app.one` als States ist hingegen unzulässig. Dasselbe gilt für `_app` und `app`. Gleiche Namen in unterschiedlichen Domains oder unterschiedlichen unterstützten Core-Scopes dürfen vorkommen, solange ihre erzeugten Identitäten verschieden sind. Daraus entsteht keine neue lexikalische Scope-Regel für RMTX.

Für einen erfolgreichen Compilerlauf gelten:

| Regel | Prüfung / Herkunft |
| --- | --- |
| Jede durch `addRecord` erzeugte Record-ID hat eine Source-Ref `src:<record.id>`. | Gemeinsame Record-Erzeugung. |
| Jeder so registrierte Record sowie jeder zusätzlich gemappte Kindknoten besitzt einen Eintrag in `/sourceMap`. | Record-/Kind-Lowering. Manche Records besitzen darüber hinaus eingebettete Verweise; daraus folgt kein eigener Source-Map-Eintrag für jedes beliebige Feld. |
| Alle IDs der Source-Map sind dokumentweit eindeutig. | Gemeinsamer Abschluss der Core-Erzeugung, vor App-/Kernel-Projektion und Orchestrierung. Dies sichert insbesondere die Eindeutigkeit aller registrierten Record-IDs. |
| Eine Kollision wird weder überschrieben noch durch einen automatisch angehängten Zähler repariert. | `rmt.vnext.core.id_collision`, Severity `error`, Phase `compile`, Status `compile_error`. |
| Die Diagnose zeigt auf den späteren Eintrag und nennt die erste Fundstelle. | `pointer`, `range`, `corePointer`, `sourceRef` und `relatedInformation[*]` mit AST-/Core-Pointer und Range. Die Qualität der AST-Herkunft bleibt Verantwortung des Frontends. |
| Kollidierende Dokumente geben keine Core-/JSON-/AppService-/Orchestrierungsartefakte aus. | Der Compiler bricht vor Ableitungen ab. Source und AST verwenden dieselbe Prüfung. |

Die Prüfung gilt auch für Dokumente ohne primitive State-/Action-Deklarationen, etwa kollidierende Templates, Lanes oder Slots. Ein anderer Template-/Surface-Pfad kann eine eigenständige Identität bilden; ein identischer Name allein ist deshalb kein globales Kollisionskriterium.

Diese Korrektur garantiert keine dauerhaft stabilen Adressen über Umbenennungen, Reordering, Chunk-Grenzen oder Resume-Versionen. Positionsbasierte IDs bleiben positionsabhängig. Eine spätere Änderung des ID-Algorithmus benötigt einen eigenen Versions-/Migrationsvertrag; diese Korrektur führt sie nicht ein.

## 2. Selektorquellen

Ein deklarativer Model-Selektor ist ein reiner Lesezugriff. Die zugelassene Quelle ist gegenwärtig ein deklarierter State oder ein deklarierter Selektor im selben semantischen Dokumentmodell.

| Stufe / Feld | Verbindliche Regel im aktuellen vNext-Pfad |
| --- | --- |
| Source | `selector <name> from state <symbol> { ... }` oder `from selector <symbol>`. Die Quelle ist erforderlich. |
| Parser-AST `/source` | `RmtPrimitiveSourceReference` mit `kind: "state"` oder `"selector"` und nicht leerem `value`. Das Ziel muss als Symbol der entsprechenden Domain auflösbar sein. |
| Core `/selectors/*/source` | `kind` bleibt `state` bzw. `selector`; `target` ist der logische Symbolname; `ref` verwendet die bestehende Core-ID-Bildung. |
| Orchestrierung `/state/selectors/*/from` | `state.<symbol>` bzw. `selector.<symbol>`, einschließlich qualifizierter Symbolnamen. |
| Fehlende Quelle | `rmt.vnext.selector.source_missing`, Severity `error`, Phase `semantic`. |
| Andere Quellenart | `rmt.vnext.selector.source_kind_unsupported`, Severity `error`, Phase `semantic`; Pointer und Range zeigen auf die Source-Clause. Das gilt auch bei einer existierenden DataSource. |
| Unbekanntes State-/Selektorziel | Bestehende Diagnose `rmt.vnext.primitive.unknown-reference`, Severity `error`, Phase `semantic`. |
| Fehlerausgabe | Kein Core-JSON, keine Core-/Service-/Orchestrierungsartefakte; der AST-Einstieg wirft denselben Fehlerbestand als `RmtAstCompilationError`. |

Die Einschränkung wird im semantischen Graphen geprüft und ist dadurch auch für dessen direkte Konsumenten verfügbar. Sie betrifft den RMT-vNext-Source-/AST-Compiler. Die allgemeine Model-API bleibt unverändert; ihre möglichen handgeschriebenen Expression-/Parameterformen sind kein zusätzlicher erlaubter Source-Kind der Autorensprache.

DataSources, Endpoints, Worker oder Ressourcen führen hier keine implizite IO aus. Host-Daten werden über einen expliziten Effect mit passendem Host-/Service-Adapter bezogen und durch einen Reducer in State übernommen. Erst diesen State liest ein Selektor:

```rmt
template data.flow {
  state app.rows type array initial []
  datasource remote from endpoint "/api/items" {
    contract Items
    result records
  }
  action app.load {
    effect fetch datasource remote
    reduce state.app.rows = result.records
  }
  selector app.visible from state app.rows {
    where item.active == true
    output object[]
  }
}
```

Das Beispiel beschreibt den Datenfluss. Der Compiler ersetzt den erforderlichen Host-Adapter nicht. Eine spätere direkte DataSource→Model-Bindung braucht einen separaten Vertrag für Ausführung, Ergebnisübernahme, Lade-/Fehlerzustand, Cancellation und Lifecycle.

## 3. Nachweise und Grenzen

Die [Compiler-Suite](../../tests/rmt-language/rmt_vnext_compiler_suite.js) prüft Case- und Unterstrichkollisionen, Selektor-/Template-/Lane-/Slot-Identitäten, zulässige getrennte Domains/Scopes, unveränderte IDs sowie fehlende, nicht unterstützte und unbekannte Selektorquellen. Alle neuen Ablehnungen werden auch über `compileRmtVNextAst()` mit identischen Diagnosen geprüft. Die vorhandenen Selector-Regressionen führen State-/Selector-Ketten tatsächlich in der Model-Runtime aus.

Die beiden [Probequellen](probes) bleiben als Negativfälle erhalten. Der [Inventargenerator](inspect.cjs) hält ihren aktuellen Ablehnungsstatus und die Artefaktgrenze fest. Die übrigen 15 Corpus-Quellen müssen weiterhin erfolgreich kompilieren.

Noch offen sind insbesondere Selektorzyklen, strukturelle Ergebnis-/Feldtypen, vollständige Operandregeln und ein geschlossenes gemeinsames Frontend-Schema. Diagnoseaggregation und die abgegrenzten Operatorprofile aus A01-F03/F04 sind inzwischen im [ergänzenden Teilvertrag](diagnostics-and-render-capabilities.md) umgesetzt. Diese Teilverträge erklären A01 nicht insgesamt für abgeschlossen.
