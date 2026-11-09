# A02 – Instanzadressen, kontrollierte State-Slices und Intents

Stand: 2026-11-09. **A02.1, der statische Compiler-/Maraca-Pfad A02.2 und bedingte Hosts in A02.3 sind implementiert; A02 bleibt in Arbeit.** RMTX und XTensions 2.0 bleiben im Releaseumfang 0.9.0 auf `preparing`.

Die [Bestandsaufnahme](../XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md) fordert für X02/X03 einen gemeinsamen Pfad durch Model, State-Projektion, Props und Rückkanal. Dieser erste Schritt nutzt die vorhandenen Model- und Runtime-Host-Ports. Er führt keine neue RMTX-Quellsyntax und keine Erweiterung des geschlossenen [Classic-AST-Vertrags](../rmtx-a01/compiler-contract.md) ein.

## 1. Vertrag und Verantwortlichkeiten

`tools/xtensions/state-binding.js` exportiert `XTENSION_STATE_BINDING_SCHEMA`, `validateStateBinding` und `createXTensionStateRegistry`. Der Einstieg ist in `@ccslabs/xtend/xtensions/state-binding` und `@ccslabs/xtend-compiler/xtensions/state-binding` verfügbar. Der Compiler-Einstieg benötigt zur Laufzeit weder React noch RMT; seine Typen beschreiben strukturelle Ports.

Eine Registry gehört zu einer Model-Sitzung. Sie erhält den vorhandenen lesenden `modelReader` und den synchronen, transaktionalen `modelCommandPort`. Eine Bindung enthält ausschließlich endliche, azyklische JSON-Daten:

| Feld | Regel |
| --- | --- |
| `schema` | exakt `xtend.xtensions.state-binding.v1`; andere Versionen werden abgewiesen |
| `address` | `{ documentId, declarationId, keys }`; Namen sind nicht leer und ohne äußere Leerzeichen |
| `props` | Propname → `{ state, path, type, nullable?, fields?, items? }`; `state` ist eine deklarierte Model-State-ID, `path` ein Segmentarray innerhalb dieses State |
| `intents` | Eventname → `{ command, payloadSchema, fields }`; nur dieses deklarierte Model-Reducer-Command wird dispatcht |

Wertregeln unterstützen `string`, endliche `number`, `boolean`, `object` mit rekursiven `fields`, `array` mit `items` und ausdrücklich unstrukturierte JSON-Daten mit `json`. `null` verlangt stets `nullable: true`. Alle deklarierten Objektfelder sind erforderlich; zusätzliche Felder werden abgewiesen. Fehlende Quellen und Typabweichungen eines kontrollierten Props sind Fehler. Es gibt keine impliziten Standardwerte oder State-Anlagen.

Die Prüfung weist unbekannte Vertragsfelder, Funktionen, Klasseninstanzen, Getter, Symbole, versteckte Eigenschaften, dünn besetzte Arrays und Prototype-Pfade ab. Framework-Autorität wie `xtension`, `key` oder `ref` kann kein kontrollierter Prop werden. Der bestehende Framework-Payload-Check bleibt zusätzlich wirksam.

## 2. Stabile Adresse und Lebensdauer

Die logische Adresse ist das strukturelle Tupel `[documentId, declarationId, keys]`. `keys` enthält stabile Schlüssel der übergeordneten Wiederholungen und des Elements; DOM-Indizes sind ungeeignet. String- und Zahlenschlüssel sowie Segmentgrenzen bleiben unterscheidbar: `["a.b"]` und `["a", "b"]` kollidieren ebenso wenig wie `[1]` und `["1"]`.

Eine Registry weist doppelte lebende Adressen ab. Ein Umordnen existierender Hosts ändert weder Adresse noch React-Root. Eine explizite Neuanbindung nach Dispose erhält dieselbe logische Adresse und eine neue, lokale `incarnation`. Dieser Lebensdauertoken wird nicht persistiert und ist kein State-Schlüssel. Alte Callback-Closures besitzen dadurch keine Autorität über eine Ersatzinstanz.

Die Bindung wählt Host-/Surface-/XTension-IDs und Eventfreigaben. Die vertrauenswürdige Host-Factory muss diese Werte an den Runtime-Adapter weitergeben. Komponenten, Container, Peer-Loader, Ressourcen- und Ausführungsregeln kommen aus dieser Factory; sie stehen nicht im serialisierten Vertrag. Die Komponenten-Fassade erhält den bestehenden eingeschränkten Event-/Ressourcenzugang.

## 3. Model → State-Projektion → Props

Das RMT Model besitzt die kontrollierten Felder. Seine vorhandene State-Projektion schreibt einen Commit vor der Benachrichtigung der Model-Subscriber nach XTend State. Die Registry liest einen vollständigen, unveränderlichen Model-Snapshot und ersetzt die Props vollständig. Auch synchrone Folge-Commits anderer Subscriber dürfen keinen älteren Event-Snapshot wieder über den aktuellen Model-Stand schreiben.

Ein lokaler Revisionszähler beschreibt den gewünschten beziehungsweise ausgelieferten Snapshot. Er ist ein Diagnose-Wasserstand der Registry, kein globaler Model-Commit-Identifier und kein Bestandteil eines gespeicherten Dokuments. Unveränderte kontrollierte Props verursachen keinen Framework-Render. Bei laufenden Auslieferungen werden ausstehende Änderungen auf den neuesten vollständigen Snapshot zusammengefasst.

Direkte Schreibzugriffe über `xtendState.setPath` führen weiterhin nicht zurück ins Model. Anwendungen müssen Änderungen an kontrollierten Feldern über Model-Commands ausführen. Ein zweiter schreibender Besitzer desselben Feldes wäre ein Vertragsverstoß.

## 4. Typisierter Rückkanal

Ein Komponenten-Event wird vom bestehenden Runtime-Host normalisiert. Die Bindung prüft die aktuelle Lebensdauer, aktiven Lifecycle-Zustand, Host-/Surface-/XTension-Quelle, deklarierten Eventnamen, `payloadSchema` und die vollständige Payload-Struktur. Erst dann ruft sie `modelCommandPort.apply({ operation: 'dispatch', command, payload }, metadata)` auf. Die Metadaten enthalten die vom Host gewählte Instanzidentität. Die Payload kann weder den Commandnamen noch eine Ziel-State-ID bestimmen.

Die konkreten Payload-Regeln sind in der Bindung definiert; der Schema-Bezeichner allein ersetzt deren Prüfung nicht. Unbekannte oder ungültige Intents erzeugen Bindungsdiagnostik und verändern das Model nicht. Ein Commandfehler bleibt ebenfalls diagnostizierbar. Die bestehende `emit().ok`-Antwort des Hosts bestätigt die Event-Normalisierung; sie ist keine Model-Commit-Quittung. Der vertrauenswürdige Bindungs-Callback meldet zusätzlich Annahme oder Ablehnung.

Während einer durch die Bindung ausgelösten Prop-Auslieferung nimmt der Rückkanal keine synchronen Render-Echos an. Komponenten sollen Intents aus Benutzeraktionen senden. Beliebige spätere Effekte oder bösartige Endlosschleifen werden dadurch nicht zu einem allgemeinen, kernelgesteuerten Scheduler; diese Grenze gehört zu A03.

## 5. Lifecycle und Fehler

| Übergang | Verhalten |
| --- | --- |
| `mount()` | Initialen Snapshot laden und rendern; Änderungen während des Ladens anschließend zusammenfassen; erst nach dem Aufholen bereit melden |
| Model-Commit im aktiven Host | Vollständige Props seriell ausliefern; neuere Änderungen anschließend aufholen |
| `suspend()` | Bestehenden Host pausieren; keine Intents und keine weiteren Prop-Renderings im pausierten Zustand |
| Commit während Pause | Nur den neuesten gewünschten Snapshot vorhalten |
| `resume()` | Neueste Props noch im pausierten Host committen, dann kooperative Ressourcen starten; Änderungen während dieses Renderings anschließend aufholen |
| `dispose()` | Adresse und Callback-Autorität sofort entziehen; den Host ohne Warten auf einen ungelösten Loader oder Render abbauen |

Der bestehende Runtime-Host besitzt dazu die additive Form `resume(reason, { props })`. Validierung sowie Update- und Resume-Policy gelten auch auf diesem Weg. Ohne Ersatz-Props bleibt das bisherige Resume-Verhalten erhalten. Es wird ausschließlich die vorhandene kooperative Ressourcenschicht pausiert; interne Framework-Scheduler oder private Timer werden damit nicht präemptiv angehalten.

Auslieferungsfehler und ein ungültig gewordener kontrollierter Slice beenden die Bindung und veranlassen Host-Cleanup. Eine neue Lebensdauer kann nach Korrektur des Model-Standes unter derselben Adresse gebunden werden. `whenIdle()` wartet auf aktuelle Auslieferungen und macht deren Fehler sichtbar; bei pausierten Bindungen wartet es nicht auf eine zukünftige Wiederaufnahme. Registry-Dispose beendet das Model-Abonnement und alle eigenen Hosts.

## 6. Ausführbare Referenz und Nachweise

[`controlled-filters.js`](controlled-filters.js) definiert zwei Model-State-Wurzeln mit je `query` und `selection.activeId`, passende deklarierte Reducer-Commands, Bindungen für `left`/`right` und eine echte kontrollierte React-Komponente. Die State-Wurzel und die logische Instanzadresse sind getrennte Begriffe: Eine weitere Darstellung kann denselben Slice ausdrücklich lesen; die Registry erfindet keine State-Isolation aus einer Adresse.

`tests/xtensions/state-binding-acceptance.js` führt diese Referenz innerhalb der vorhandenen Runtime-Akzeptanz mit den exakt gesperrten externen React-/Vue-Test-Peers aus. Geprüft werden zwei unabhängige React-Roots, echte XTend-State-Projektion einschließlich verschachtelter Pfade, ein Commit pro Intent, Mehrfach-State-Transaktionen, Umordnen, Adresskollisionen, Reentranz, strikte Intents, Lade-/Auslieferungsrennen, Pause/Resume, Ressourcenstart nach aktuellem Props-Commit, späte Callbacks, Ersatzinstanzen, ungültige Slices, Render-Echos und Registry-Cleanup.

Die bestehenden Gates `xtensions-runtime` und `xtensions-runtime-browser` führen A02 verpflichtend in jsdom und Chromium aus. Die öffentlichen Typen werden zusammen mit den bestehenden Runtime-Adapter-Typen strikt kompiliert; beide Paket-Einstiege werden unter Node- und Browser-Bedingungen geprüft. Die Resume-Erweiterung besitzt zusätzliche Policy-/Payload-Checks für React und Vue.

Der exakte Paket-/Typ-Export-Lock umfasst jetzt 211 geordnete Schlüssel. Neben dem neuen `./xtensions/state-binding` sind die drei bereits vorhandenen Classic-Parser-/Compiler-/Schema-Einstiege nachgetragen, die im bisherigen 207er-Lock fehlten. [Lock und Fingerprint](../WP-TypeExports-01-Public-Package-Entry-Points-und-types-Conditions-haerten.md) bleiben vollständig geprüft; die negativen Prüfungen gegen unbekannte, ersetzte oder umgeordnete Exporte bleiben erhalten. Die Core-Projektion führt die A02-Verträge als unveröffentlicht. Neue Vertragsversionen ersetzen keine veröffentlichten Legacy-Fingerprints; eine Veröffentlichung wird dadurch nicht freigegeben. Die ersten vollständigen Typdeklarationen für Runtime v4 und Runtime-Host v2 erhalten eigene eingefrorene Autoritäts-Baselines; spätere Vertragsänderungen benötigen wiederum neue Major-Schema-IDs.

## 7. A02.2 – versionierter Compiler-/Maraca-Pfad

[`controlled-filters.rmt`](controlled-filters.rmt) verwendet ausschließlich bestehende Classic-Syntax: zwei States, zwei Actions und zwei leere native Host-Surfaces. [`bindings.v1.json`](bindings.v1.json) transportiert die Instanzadressen, State-Pfade, Payload-Regeln und Action-Ziele als separates Artefakt mit `xtend.xtensions.state-binding-artifact.v1`.

`compileRmtClassicSource(input, { xtensionBindings })` und `compileRmtClassicAstWithBindings(ast, bindings, options)` verwenden denselben geschlossenen AST-/Core-Backendpfad. Die zweite Funktion liefert Core, Orchestrierungsartefakt und Bindungsartefakt gemeinsam. Die einfache AST-Funktion weist eine versehentlich mitgegebene Bindungsoption ab. Der AST selbst erhält keine zusätzlichen Felder oder Nodes.

Der Compiler prüft die Bindungen gegen das tatsächlich erzeugte Orchestrierungsartefakt: deklarierte und eindeutige State-/Action-/Surface-Symbole, vorhandene Initialpfade, passende Prop-Typen, Action-Eingaben, Dokumentidentität und eindeutige Host-/Instanzadressen. Jede Bindung verlangt genau einen leeren, statischen und keyed Render-Host. Wiederholungen, bedingte Hosts, eigener Text beziehungsweise eigene Kinder und FastPass-Commands werden abgewiesen. Ungültige Source-Bindungen liefern Diagnostik und keine ausführbaren Core-/Bindungsartefakte.

Maraca transportiert den Sidecar im Buildplan und in der erzeugten Browser-Boot-Konfiguration. Gebundene Pläne verlangen die expliziten Host-Ports `xtensionBindingsRuntime` und `createXTensionHost`. Diese werden auch vom Browser-Composition-Root weitergegeben. Runtime-Komponenten, Peer-Loader und Berechtigungen bleiben vertrauenswürdige Host-Konfiguration; das Artefakt enthält weiterhin nur Daten. Eine automatische Provider-/Build-Kette gehört zu A04.

Die Registry unterstützt zusätzlich zum synchronen Model-Reducer-Port einen asynchronen `commandDispatcher`. Eine Registry erhält genau eine Command-Autorität. Maraca wählt den Dispatcher und führt Intents über den bestehenden Classic-Action-Planer und dessen transaktionale Model-Operationen. Ein Lebensdauerkontext wird vor der Ausführung und unmittelbar vor dem Model-Commit geprüft; Dispose entzieht auch einem bereits laufenden Intent die Autorität zu einem späteren Commit.

Die Registry liest in diesem Pfad das öffentliche Maraca Model. Dieses veröffentlicht den Commit nach dem RMT View-Commit. Anschließend wartet der Command-Abschluss über `registry.flush()` auf aktuelle Props der aktiven XTensions. `dispatchCommand()` meldet damit erst nach dieser Auslieferungsgrenze Erfolg. Pausierte Instanzen behalten den letzten gewünschten Snapshot bis Resume. Ein bereits erfolgter Model-Commit wird bei einem späteren View-/Framework-Fehler nicht als zurückgerollt dargestellt; der Host wird abgebaut und die Störung diagnostiziert.

Maraca reconciliert bei gebundenen Plänen auch vollständige Refreshes mit stabilen Schlüsseln. Host-Schlüssel werden explizit als Literale projiziert, damit ein gleichnamiger Model-State die Identität nicht verändert. RMT besitzt den äußeren Host; React besitzt dessen Kinder. Die getestete Referenz erhält dadurch dieselben Inputs und Roots über Action-Commits und Refresh hinweg.

`getXTensionBindings()` liefert dem vertrauenswürdigen Host die gebundenen Instanzen. `whenXTensionsIdle()` wartet auf deren Intents und Auslieferungen sowie nach Dispose auf asynchrones Framework-Cleanup. Direkt gestartete Maraca-Commands müssen weiterhin selbst awaited werden. Dispose entzieht die Autorität sofort; der Abbau der RMT-Adapter wartet auf die fremden Roots. Der Browser-Composition-Root hält diese Abschlussgrenze auch bei wiederholtem Dispose und anschließendem Reboot ein.

[`inspect.cjs`](inspect.cjs) erzeugt beziehungsweise prüft den Sidecar und [`evidence.json`](evidence.json). Der Nachweis bindet Quelltext, API-/Schemaversionen und kompiliertes Programm über SHA-256 und führt Source-/AST-Parität sowie den strikten Maraca-Plan tatsächlich aus. `check:release-preparation` prüft ihn verpflichtend auf Drift. Er ersetzt keinen vollständigen Feature-Abnahmenachweis.

Die Runtime-Gates führen die kompilierte Referenz in jsdom und Chromium mit realem Model, XTend State, Maraca und React aus. Sie prüfen neun A02.2-Fälle einschließlich Browser-Composition, Refresh-Eigentum, einer Transaktion pro Intent, Command-/Props-Reihenfolge, ungültiger Intents, abgebrochener Actions, Pause/Resume, Teil-Boot-Fehlern und verspäteten Loadern. 32 zusätzliche Compiler-/Versionsprüfungen decken die negativen Artefakt- und Legacy-Konfigurationsfälle ab.

## 8. Versionen gegenüber Legacy

Geänderte Schema-Verträge erhalten gemäß der bestehenden Major-only-Schemaregel eine neue Schema-ID-Version. Öffentliche APIs tragen zusätzlich explizite SemVer-Marker; additive kompatible API-Erweiterungen erhalten eine Minor-Version. Die Paket-Releaseversion bleibt gemäß dem vereinbarten Ziel `0.9.0`.

| Vertrag | Legacy | Aktueller Stand |
| --- | --- | --- |
| Classic-Compiler-API / Compile-Ergebnis | `xtend.rmt.classic.compile-result.v2` | API `3.0.0`, `xtend.rmt.classic.compile-result.v3` |
| Gemeinsame Legacy-Compiler-API | bisher ohne API-Marker | API `1.1.0` für den zusätzlich exportierten Orchestrierungs-Backendbuilder; unveränderte vNext-Compile-Ergebnisform v1 |
| Maraca-Buildplan | `xtend.maraca.build-plan.v2` | `xtend.maraca.build-plan.v3` |
| Maraca-Build-Konfiguration | `xtend.maraca.build-config.v1` | `xtend.maraca.build-config.v3`; v1 ohne Bindungen und v2 mit statischem Sidecar v1 bleiben lesbar |
| Maraca-Plan-Runtime | `xtend.maraca.plan-runtime.v3` | `xtend.maraca.plan-runtime.v5` |
| Browser-Composition / Fassade | `xtend.maraca.browser-composition-root.v2` | `xtend.maraca.browser-composition-root.v3`, API `3.0.0` |
| Asynchrone Runtime-Hosts | zuvor generischer Legacy-Host-Identifier | `xtend.xtensions.runtime-host-controller.v2`, API `2.0.0`, frameworkbezogene Runtime-Adapter v2 |
| State-Binding-Registry | A02.1 API | API `1.2.0`; unveränderte Bindungsdaten bleiben `xtend.xtensions.state-binding.v1` |
| Bindungs-Sidecar | statischer Sidecar v1 | `xtend.xtensions.state-binding-artifact.v2` mit optionalem booleschen `presence`-Pfad; v1 behält seinen geschlossenen Vertrag |
| Runtime-Akzeptanzbericht | `xtend.xtensions.runtime-acceptance-report.v1` ohne Compiler-Nachweise | `xtend.xtensions.runtime-acceptance-report.v2` |

Der statische Sidecar v1 bleibt lesbar und weist `presence` weiterhin ab. Der neue Sidecar v2 trägt die bedingte Instanziierung. Der unveränderte Classic-AST-Eingangsvertrag bleibt `1.0.0`; sein geschlossenes Schema wird nicht umnummeriert oder still erweitert. Lifecycle-/Event-Envelope und Presentation-Adapter behalten ihre unveränderten Verträge. Die veröffentlichte [v3-API-Deklaration](../../xtend-maraca/plan-runtime.v3.d.ts) bleibt als unveränderter Legacy-Nachweis erhalten; die [v4-Deklaration](../../xtend-maraca/plan-runtime.v4.d.ts) bleibt ebenfalls archiviert. Aktuelle Runtime-Instanzen melden v5. Neue v2-Runtime-Hosts dürfen nicht durch Legacy-getaggte Adapter ersetzt werden.

## 9. A02.3 – bedingte Host-Lebensdauern

[`conditional-filters.rmt`](conditional-filters.rmt) ergänzt die bestehende Classic-Referenz um einen Model-State `hosts` und eine deklarierte Action `hosts.replace`. Der [Sidecar v2](conditional-bindings.v2.json) ergänzt jeden Host um `presence: { state: "hosts", path: ["left"] }` beziehungsweise `right`. Die Bedingung ist ein expliziter boolescher Model-Pfad. Sie ist keine RMTX-Syntaxentscheidung und wird weder aus DOM-Sichtbarkeit noch aus Framework-State abgeleitet. Das deklarierte, leere Host-Template bleibt statisch und keyed; erst seine Runtime-Existenz ist bedingt.

Der Compiler prüft State, Segmentpfad und booleschen Initialwert. Der v1-Sidecar erlaubt dieses Feld nicht. Beliebige Ausdrücke, Defaultwerte, Funktionen, Repeat-/Source-Hosts und zusätzliche Vertragsfelder bleiben ausgeschlossen. Der Classic-AST und die Daten einer einzelnen konkreten State-Bindung behalten ihre unveränderten Versionen.

| Model-Presence | Lebensdauer und DOM |
| --- | --- |
| Initial `false` | Kein Host-DOM, kein Factory-Aufruf und keine lebende Registry-Adresse. Der kontrollierte Model-Slice bleibt erhalten. |
| `true` → `false` | Callback-/Command-Autorität sofort entziehen; Framework-Root unmounten, während sein Host noch verbunden ist; anschließend den Host über den RMT-Renderer entfernen. |
| `false` → `true` | Nach dem View-Commit den Host auflösen; mit aktueller Model-Projektion mounten; gleiche logische Adresse, neue lokale `incarnation`. |
| Unverändert `true` | Vorhandenen keyed Host, fremde Kinder und Lebensdauer erhalten, auch beim vollständigen Refresh. |
| Ungültiger Presence-Wert oder fehlgeschlagener neuer Host | Runtime fehlschlagen lassen und alle fremden Roots abbauen. Ein bereits erfolgter Model-Commit wird nicht als zurückgerollt dargestellt. |

Die Host-Koordination gilt für Actions, Stream-Patches und vollständige Refreshes. Command-Erfolg wird erst nach Cleanup, View-Commit und neuen Framework-Mounts veröffentlicht. `whenXTensionsIdle()` drainiert in Runtime v5 auch die aktuelle Command-Queue und auslaufende Hosts. Das erfasst insbesondere Intents, die ihre eigene Instanz entfernen und dabei bereits ihre Registry-Autorität verlieren. Die interne Props-Grenze bleibt `registry.flush()` und wartet nicht auf den gerade veröffentlichenden Command. Externe Commands sollten weiterhin selbst awaited werden, um deren konkretes Ergebnis beziehungsweise Fehler zu erhalten.

Wird ein View-Commit überholt, verlieren abwesende Hosts trotzdem ihre Autorität; neue Hosts entstehen erst beim nächsten aktuellen View-Commit. Die Reihenfolge ist fail-closed: Erst wird die vollständige neue Presence-Menge geprüft, dann werden entfernte Adressen freigegeben. Serialisierte Commands und sofortige Lebensdauerprüfung verhindern, dass ein noch eingereihter Intent gegen eine spätere Ersatzinstanz committet. Nach Dispose dürfen ungelöste Loader keine Hosts nachträglich erzeugen. Adoption vorhandener DOM-Hosts wird für Presence-Pläne vor Boot abgewiesen, bis A05 einen Restore-Vertrag bereitstellt. Entfernen ist ein Ende der Lebensdauer; ein fachliches Suspend/Resume bleibt eine separate Operation.

[`inspect.cjs`](inspect.cjs) prüft beide Referenzen mit Source-/AST-Parität und Maraca-Transport. [`conditional-evidence.json`](conditional-evidence.json) bindet Quelle, Programm und v2-Sidecar an Inhalts-Hashes. Die verpflichtenden Runtime-Gates enthalten elf A02.3-Fälle: Versions-/Presence-/Adoption-Abweisung vor Boot, initiale Abwesenheit, selbstentfernende Intents, Wiedererscheinen, Cleanup vor DOM-Entfernung, verspätete Commands, ungültige Presence-Werte, Teilfehler, wiederholte Presence-Zyklen Dispose während eines nachträglichen Loaders und überholte View-Commits. Insgesamt werden 122 Akzeptanzfälle je Umgebung und 47 Compiler-/Versionsprüfungen ausgeführt. Das sind Entwicklungsnachweise; beide 0.9-Features bleiben `preparing`.

Die gegenüber A02.2 geänderten Verträge erhalten neue Major-Schema-IDs: Sidecar v2, Classic-Compile-Ergebnis v3, Maraca-Buildplan/-Konfiguration v3, Runtime v5 und Browser-Root v3. Compiler- und Browser-API melden `3.0.0`; die kompatibel erweiterte Registry-API `1.2.0`. Die Runtime-Host-API bleibt unverändert `2.0.0`. Build-Konfiguration v2 bleibt für den statischen v1-Sidecar lesbar; ein v2-Sidecar benötigt Konfiguration v3. Die Core-Projektion erhält nur die geprüften Änderungen und bewahrt bestehende Autoritäts-Fingerprints.

## 10. Noch offen

Der statische A02.2-Pfad und bedingte Hosts aus A02.3 sind nachgewiesen. A02 ist insgesamt weiterhin offen: Für wiederholte Hosts muss die Compiler-/Runtime-Instanziierung die Elementschlüssel, instanzbezogene State-Pfade und Lebensdauern gemeinsam ableiten. Das umfasst Umordnen, doppelte/ungültige Schlüssel und verschachtelte Wiederholungen; DOM-Indizes sind kein Identitätsersatz. Danach benötigt die Tiefverlinkung einen expliziten URL-/History-Vertrag mit Codec, Freigaben und Wiederherstellungsregeln. Die jetzigen State-Pfade sind kein URL-Codec.

Reale Microkernel-Auslieferung und Capabilities folgen in A03, die automatische Provider-/Build-/Host-Kette in A04 und SSR/Adoption/Restore in A05. Die endgültige RMTX-Quellsyntax bleibt A06 vorbehalten. Beide großen 0.9-Features bleiben bis zu ihren vollständigen Abnahmen `preparing`.
