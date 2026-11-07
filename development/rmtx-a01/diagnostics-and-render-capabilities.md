# A01 – Implementierter Teilvertrag: Diagnosen und Renderfähigkeiten

Stand: **7. November 2026**. Behandelt A01-F03 und A01-F04. Ergänzt den [Identitäts-/Selektorvertrag](identity-and-selector-sources.md). Die Regeln sind im aktuellen Compiler und Renderer umgesetzt; ein vollständiges gemeinsames IR-/JSON-Schema bleibt offen.

## 1. Diagnosekanäle

| Kanal | Inhalt und Zuständigkeit |
| --- | --- |
| `parserResult.diagnostics` | Parsermeldungen einschließlich Syntax-/Fallback-Diagnosen. |
| `primitiveSemanticGraph.diagnostics` | Parser- und primitive semantische Meldungen. Der primitive Graph ist für Dokumente mit primitiven Deklarationen verbindlich; er wird nicht nachträglich zum Validator für reine Orchestrierungsdokumente gemacht. |
| `orchestrationArtifacts.<plan>.diagnostics` | Meldungen des jeweiligen Render-, Hydration-, Validation-, Transition- oder Animation-Plans. Die vorhandenen verschachtelten Kanäle bleiben erhalten. |
| `orchestrationArtifacts.diagnostics` | Vereinigung der genannten Pläne und der allgemeinen Orchestrierungsprüfungen. |
| Compilerresultat `compilerDiagnostics` | Lowering-/AppService-Diagnosen und die vollständige Orchestrierungsvereinigung. |
| Compilerresultat `diagnostics` | Kanonischer vollständiger Ergebniskanal: Parser, zuständige semantische Meldungen, Compiler und Pläne. Compiler-/Preview-Konsumenten müssen keine Unterpläne zusätzlich zusammenführen. |

Die Reihenfolge ist deterministisch: Parser/aktive Semantik, Compiler/AppService, allgemeine Orchestrierung, Render, Hydration, Validation, Transition, Animation. Identische Meldungen werden anhand sämtlicher serialisierbarer Felder bei sortierten Objektschlüsseln dedupliziert; die erste Position bleibt erhalten. Unterschiedliche Felder, Quellstellen, Details oder Codes bleiben getrennte Meldungen. Eine semantische Warnung und eine Planwarnung zum selben Thema sind damit nicht automatisch identisch.

Orchestrierungsmeldungen erhalten `stage: "orchestration"` und `plan`. Nach Möglichkeit werden `sourceRef`, `pointer` (AST), `corePointer` und `range` aus der Core-Source-Map zugeordnet. Validation-Feldmeldungen zeigen auf die entsprechende `field`-Clause; andere Meldungen können auf ihre Deklaration zeigen. Ohne auflösbaren Herkunftseintrag bleiben diese Felder `null`. Datei und URI können Compilerkonsumenten über `parserResult.sourceModel` zuordnen. Der Vertrag erfindet keine Quellstelle für einen fremden AST ohne Herkunftsdaten.

Der vNext-Tooling- und LSP-Pfad übernimmt diese Herkunft. LSP veröffentlicht die Warnungen mit Severity 2, erhält die Range und liefert `stage`, `plan`, `sourceRef` und `corePointer` unter `Diagnostic.data`. Die [LSP-Regression](../../tests/rmt-language/rmt_language_server_suite.js) öffnet die Validation-Variantenquelle tatsächlich über `textDocument/didOpen` und prüft beide Meldungen.

Severities bleiben erhalten: Warnungen blockieren den Compile nicht; `error` ergibt `ok: false`. Der AST-Einstieg wirft bei Fehlern denselben vollständigen Diagnosebestand als `RmtAstCompilationError`; bei Warnungen bleibt sein Core-Rückgabewert erhalten. Die bestehende Ausgabe von Analyseartefakten bei anderen Compilefehlern wird hier nicht pauschal verändert. Die speziellen Artefaktsperren für F01/F02 gelten weiterhin.

**Nachweise:** [Compiler-Suite](../../tests/rmt-language/rmt_vnext_compiler_suite.js): beide Validation-Capability-Warnungen, genaue Feldherkunft, Animation-/Transition-/Semantikwarnungen, identische From-/To-Planmeldungen, unveränderte Error-Severity, AST-/Source-Parität und stabile Reihenfolge.

## 2. Renderprofile statt pauschaler Node-Zulassung

`createPortableRenderArtifact(input, {target})` prüft das gewählte Ausführungsprofil. Der Default bleibt `php`; erlaubt sind nur `node` und `php`. `targets` enthält ausschließlich die Profile, deren Prüfung erfolgreich war. `target: node` ist kein Umgehen der Prüfung mehr.

`validatePortableDescriptor(descriptor, pointer?, {target?})` prüft einen Renderdescriptor für dasselbe Profil; ohne Option bleibt es die PHP-Auswahl. Operatorfehler enthalten `code`, `severity`, einen JSON-Pointer, `target`, `context` und `operator`. `projectPortableRender()` verlangt eine ausgewiesene Node-Fähigkeit und prüft Descriptor, Defaults und State-Konfiguration erneut. Ein veränderter Target-String kann eine nicht unterstützte Operation nicht freischalten. Die JavaScript-Projektion im Seitenclient verwendet dieselbe Prüfung.

### Operatoren nach tatsächlichem Auswerter

| Kontext | Node-/JavaScript-Profil | PHP-Profil |
| --- | --- | --- |
| Renderausdruck | Bestehender gemeinsamer Operatorensatz plus `uppercase`/`upper`, `lowercase`/`lower`, `replace`, `formatDateShort`/`dateShort`. | Gemeinsamer Satz: Literal-/Pfad-/Fallback-, String-/Slice-, Containment-/Gleichheits-/Bool-, Map-/Filter-/Reduce-/CountBy-, Bytes-/Duration-Operationen. |
| Rendervergleich `gt`, `gte`, `lt`, `lte` als Ausdruck | Abgewiesen: Der DOM-Expression-Auswerter besitzt diese Cases nicht. | Abgewiesen: Der PHP-Expression-Auswerter besitzt sie ebenfalls nicht. |
| Regel in `where`/`filter`/`find` | Nur die Vergleichsregeln `equals`, `eq`, `not-equals`, `neq`, `truthy`, `falsy`, `gt`, `gte`, `lt`, `lte`, `in`, `contains`, `includes`. Operand-Ausdrücke werden gesondert geprüft. | Dieselben Regeln im unterstützten Provider-/Filterkontext. `find` bleibt als PHP-State-Provider-Funktion abgewiesen. |
| Model-Ausdruck in Selektor-/Derived-Konfiguration | Zusätzlich die tatsächlich vorhandenen Model-Operationen wie relationale Ausdrücke, `count`, `not-empty`, `empty`, `boolean`, `first`. Keine Übertragung in den Renderkontext. | Engerer gemeinsamer Ausdruckssatz. |
| Selektor-/Derived-Provider | Ausführbare Filter, Find, Sort, Slice, Map, Transform und die jeweiligen bekannten Computes. Ein ignoriertes Selektor-`expression` oder Derived-`first`-Compute wird abgewiesen. | Bisherige Einschränkung bleibt: kein Sort, Find, Transform oder Expression-Provider. |

Die konkreten Mengen und Kontextübergänge stehen im [portablen Renderer](../../xtendrmt/rmt-portable-render.js) und maschinenlesbar im [Inventar](inventory.json). Ein Regeloperator ist kein Ausdrucksoperator. Beispielsweise bleibt `gt` im Model-Prädikat gültig, während `{type: "text", text: {op: "gt", ...}}` für beide Renderprofile abgewiesen wird. Node-Formatter werden tatsächlich projiziert und gerendert; sie werden dadurch nicht PHP-portabel.

Die acht bekannten portablen Knotentypen bleiben `element`, `component`, `text`, `fragment`, `empty`, `slot`, `conditional`, `repeat`. Slotwerte und beide Conditional-Zweige werden geprüft. Node-Kind-Aliase werden vor Übergabe an den DOM-Renderer auf `type` normalisiert. Ein Node-Target erlaubt nicht automatisch jeden Knotentyp des allgemeinen DOM- oder Trusted-HTML-Adapters.

### Daten und Ausdrücke

Attribute-/Property-/Slotnamen sind Container-Schlüssel. Sie werden nicht als Operatoren interpretiert. Dasselbe gilt für Namen in Klassen-Maps; deren Werte sind Bedingungen. Die Operanden und Zweige eines Ausdrucks bleiben dagegen Ausdrücke, auch unter `then`, `else` oder `fallback`.

Literalwerte dürfen verschachtelte `op`-, `kind`-, `format`- und `type`-Felder enthalten. Der DOM-Auswerter übernimmt `literal`/`const`/`static` vor der rekursiven Ausdrucksauswertung; ein darin enthaltenes ungültiges Regex-Record wird deshalb nicht ausgeführt. Eine ausdrücklich deklarierte Render-Fallback-Expression bleibt ausführbar. Quelle und alle drei ausgelieferten Runtime-Bundles besitzen dieselbe Korrektur.

JSON-Prüfungen gelten auch für State-Konfiguration und Defaults. Funktionen, Zyklen, nicht endliche Zahlen und unsichere Schlüssel werden abgewiesen. Node-Hostcode bleibt außerhalb des portablen Datenartefakts.

**Nachweise:** [Capability-Regressionen](../../tests/ssr-pages/portable_capability_checks.js) und [Quell-/Bundle-Regressionsmatrix](../../tests/ssr-pages/contract_evolution_checks.js). Die Node/PHP-Suite führt PHP tatsächlich aus; die kleinen PHP-Beobachtungen im Inventargenerator bleiben dagegen reine Target-Gate-Proben.

## 3. Grenzen und weitere A01-Arbeit

Diese Prüfungen definieren Operatorfähigkeiten und Diagnoseverteilung. Sie sind kein vollständiger Validator für sämtliche Feldkombinationen, Datentypen, dynamischen Regex-Eingaben, Referenzzyklen, Hostressourcen oder Resume-Adressen. Die Zulassung einer Operation beweist auch keine allgemeine Node/PHP-Parität für alle möglichen Werte und Koerzionsregeln. Die Parität ist für die geprüften Fälle nachgewiesen.

F01 bis F04 sind damit im Arbeitsstand adressiert. A01 bleibt offen für vollständige Pflicht-/Alternativfelder und Referenztypen sowie die Auswahl, Versionierung und Migration des gemeinsamen öffentlichen Frontend-/Backend-Vertrags. Es wurde kein RMTX-Syntaxentscheid und keine Schema-Freigabe vorweggenommen.
