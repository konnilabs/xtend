# A06: Two-Host-Vergleich von Orchestrierung und View

Stand: **15. November 2026**. Experiment und lokales Helferprofil **1.0.0**. Der vorhandene [Two-Host-Candidate](../two-host.candidate.tsx) bekommt hier zwei tatsächlich abgesenkte Gegenstücke. Das ist ein begrenzter Compiler-Versuch im Development-Verzeichnis. Die [Syntaxentscheidung 1.0.0](../syntax-decision.md) legt inzwischen deklaratives RMTX mit TSX-Grammatik, qualifizierten `RMT.<Operator>`-Elementen und `.rmtx` fest; die konkrete produktive Frontend-API ist noch zu implementieren.

**Beide Varianten sind für diesen Fall technisch tragfähig.** Sie liefern dieselben semantischen Orchestrierungsartefakte, Provider-Bindings und einen geschlossenen nativen Header-Sidecar. Der [Laufzeitvergleich](runtime-evidence.json) prüft außerdem identische echte Model-/DOM-/Kernel-/Fabric-Traces. Daraus folgt noch kein DX-Sieger und keine Abdeckung aller RMT-Operatoren.

**Inzwischen angenommen: `.rmtx` für das eigenständige deklarative RMTX-Profil bei beibehaltener TSX-Grammatik.** Maßgeblich ist die [Syntaxentscheidung](../syntax-decision.md); die folgende Gegenüberstellung bleibt ihr reproduzierbarer Vorversuch. Für Classic bleibt `.rmt`; eine gesonderte View kann `.view.tsx` verwenden und benötigt ein ausdrücklich gewähltes Viewprofil. Framework-Provider behalten `.tsx`. Eine öffentliche Endung und die verwendete Parsergrammatik sind getrennte Entscheidungen. Die Empfehlung samt nachgewiesenem Toolingaufwand steht im [Dateiendungsbericht](extension-assessment.md).

## Die zwei Quellen

| Aspekt | A: Deklaratives TSX-Modul | B: Classic mit TSX-View |
| --- | --- | --- |
| Einstieg im Versuch | [declarative.rmtx](declarative.rmtx), unveränderte Kontrollkopie [declarative.tsx](declarative.tsx) | [classic.rmt](classic.rmt) und ausdrücklich zugeordnete [view.tsx](view.tsx) |
| Model und Actions | `RMT.State`, `RMT.Action`, `RMT.Input`, `RMT.Reduce` im selben Modul | Tatsächliche Classic-Deklarationen in `.rmt` |
| Portal und Owner | `RMT.Portal`, `RMT.Surface` | Classic-Portal und Classic-Surfaces |
| Hostziele und Lanes | TSX-Hostdeklariation erzeugt die separate Ziel-Surface mit ihrer Mount-Lane | View muss die vorhandene passende Classic-Mount-Surface referenzieren; sie darf keine Lane überschreiben |
| Provider, Presence, Props, Intents | Aus der jeweiligen JSX-Quelle gelesen | Aus der View gelesen und gegen Classic geprüft |
| Nativer Header | `ProductHeader product={model.product}` | Dasselbe geschlossene Headerprofil |
| Backend und Runtime | Bestehender Classic-Compiler, Maraca-Plan, A06-Hostkomposition | Derselbe Backend-/Hostpfad |

Die zusätzliche `.tsx`-Kontrollkopie hat absichtlich exakt dieselben Bytes wie `.rmtx`. Der Prüfer sperrt Drift zwischen beiden. Sie ist ein Versuchsträger für die Endungsfrage, kein vorgeschlagenes dauerhaftes Doppelformat. Der Runtime-Harness verwendet standardmäßig die `.rmtx`-Quelle über eine virtuelle TSX-Datei.

Die zwei Syntaxformen erzeugen ihre Daten unabhängig. A erzeugt Classic-Source aus den geprüften TSX-Knoten; B kompiliert seine wirkliche `.rmt`-Source und ergänzt die Bindings aus der View. Der bestehende Two-Host-JSON-Contract wird erst als Vergleichsoracle geprüft, nicht als Quelle für kopierte Model-/Action-/Surface-Daten verwendet. Autoritative Provider-Interfaces und Codepins kommen weiterhin aus dem bestehenden, unabhängig erfassten Katalog. Die vorhandenen Verträge bleiben unverändert bei Case/Referenz **2.0.0** und Provider-Interface **1.0.0**.

## Was der Versuch implementiert

[comparison.cjs](comparison.cjs) parst und typprüft mit TypeScript **5.9.3**, löst Intrinsics, Model-, Input- und Providerhandles per tatsächlicher Symbolidentität auf und senkt nur den geschlossenen Fall ab. Vollständige Importaliases funktionieren; gleichnamige fremde Imports oder lokale Lookalikes erhalten keine Intrinsic-Bedeutung. Sourceimporte und JSX werden nicht ausgeführt. [authoring.d.ts](authoring.d.ts) und [jsx-runtime.d.ts](jsx-runtime.d.ts) sind ausschließlich Compilerdeklarationen; es gibt kein dazugehöriges Runtime-Factorymodul.

Die kleine TypeMap beschreibt diesen Fixture-Fall. Sie ist **kein allgemeiner Generator aus beliebigen Classic-Modellen**. Reducer dürfen nur einen ganzen, in derselben Action deklarierten Input lesen; dessen deklarierter Typ muss zum geprüften Handle passen. Provider-Bindings werden zusätzlich im echten Maraca-Plan geprüft. Der Headerpfad muss auch im tatsächlich kompilierten Initialmodel existieren und einen String liefern. Für einen Produktionscompiler müssten die Model-/Actiontypen aus dem jeweiligen tatsächlichen Programm abgeleitet und sämtliche UI-Bindings über ihren gesamten Updatevertrag geprüft werden.

[inspect.cjs](inspect.cjs) enthält positive, negative und differentielle Prüfungen. Es vergleicht die gesamten Orchestrierungsartefakte; ausschließlich `range` in Source-Map-Einträgen mit `astPointer` und `corePointer` wird ausgeblendet. Semantische Records, IDs, Zielpfade, Lanes und Mappingdaten werden nicht wegnormalisiert. Mutationen an Initialstate, Presence und Lane belegen, dass die jeweilige Source tatsächlich wirksam ist.

Nicht zulässige Top-Level-Anweisungen, freie Aufrufe in Props, Spreads, Callbacks als Kinder, zusätzliche Imports und Triple-Slash-Referenzen werden abgewiesen. TypeScript-Unterdrückungen wie `@ts-nocheck` sind gesperrt, weil die Typprüfung Teil dieser Zulässigkeitsprüfung ist. Auch ein fremder JSX-Import-Source ist gesperrt. Fehler aus der unveränderten virtuellen `.rmtx.tsx` werden auf die echte `.rmtx`-URI und den identischen Textbereich abgebildet. Ein Source-Mapping von erzeugtem Classic zurück zu TSX ist noch nicht implementiert; nachgelagerte Backendfehler sind deshalb ausdrücklich keine vollständigen Editor-Diagnosen.

## Beobachtete Ausführung und Grenzen

[runtime-comparison.cjs](runtime-comparison.cjs) führt die vorhandenen **13 echten React-/Vue-Acceptance-Fälle je Variante** aus. Ein zusätzlicher vollständiger Trace vergleicht sieben Phasen:

1. Initiale Model-/XTend-State-Werte, getrennte native Roots und Kernel-/Fabric-Mountadmission.
2. Tatsächliche React-/Vue-DOMevents mit Intent-Payloadmapping, Modelcommit und Erhalt des Geschwisterroots.
3. Geschlossener gemeinsamer Owner mit weiterlaufenden Modelupdates und zurückgehaltener Projektion.
4. Resume mit neuesten Props und identischen Roots.
5. Entfernen eines Hosts mit selektiver Freigabe seines Leases.
6. Wiederanlage mit gleicher logischer Adresse, neuer Inkarnation und abgewiesenem altem Callback.
7. Destroy mit beendeten Lifetimes und ohne verbleibende Kernel-Leases.

Das ist die bestehende **explizite A06-Referenzkomposition**. Der Versuch behauptet keine neue automatische Maraca-Frontendintegration. Die unverändert geprüften Kernel-/Fabric-/Surface-Grenzen bleiben erhalten; Laneattribute erzeugen keine Admission-Grants.

Der native Header wird in beiden Varianten als gleiches Sidecarprofil `{element: "h1", text: Modelpfad}` erzeugt und **isoliert durch den echten Shared Descriptor Renderer** einschließlich Textescaping geprüft. Der Zwei-Host-Runtime-Harness mountet diesen Sidecar nicht automatisch. Ein allgemeiner JSX-Renderer, frei definierbare `ProductHeader`-Funktionskomponenten, SSR dieses UI-Sidecars und ein neuer Maraca-UI-Vertrag sind damit ausdrücklich noch offen. `ProductHeader` ist hier ein festes experimentelles Intrinsic.

**Folgeprüfung nach der Syntaxentscheidung:** Der [native Headercheck](../native-header-check.md) bindet diesen Header nun in einem eigenen opt-in Profil in den tatsächlichen Maraca-/Zwei-Host-Renderlauf ein. Nach der [Lifecyclekorrektur](../native-view-lifecycle-contract.md) bestehen jetzt **21 von 21 Erwartungen je Variante** unter Node 24, Node 26 und Chromium. Der [aktuelle Nachweis](native-header-evidence.json) enthält die reale grüne Matrix; der [frühere rote Nachweis](native-header-evidence.before-lifecycle-fix.json) bleibt historisch erhalten. Dieser Befund erweitert den ursprünglichen isolierten Vergleich und ändert dessen damaligen Prüfungsumfang nicht.

[comparison-evidence.json](comparison-evidence.json) enthält statische Ergebnisse, Quellenbindung, beide ermittelten Contracts und die wirklich erzeugte Classic-Source. [runtime-evidence.json](runtime-evidence.json) enthält die tatsächlichen Node-/Browser-Läufe und beobachteten Traces. [extension-evidence.json](extension-evidence.json) bindet die 21 Dateiendungs-Probes. Alle tragen `acceptedForRelease: false`, soweit eine Releaseaussage Teil des Nachweises ist.

Die finale Matrix ist grün: **31 statische Vergleichsprüfungen** unter Node 24 und 26, **21 Dateiendungs-Probes** unter beiden Node-Lanes sowie **13 echte React-/Vue-Fälle je Variante** in jsdom unter beiden Node-Lanes und in Chromium 155. Die sieben vollständigen Trace-Stufen stimmen sowohl zwischen den Varianten als auch zwischen den drei Laufumgebungen überein. Alle 38 im Runtime-Nachweis gebundenen Quellhashes bleiben während der Läufe stabil. Die unabhängige Rückprüfung bestätigt zusätzlich die behobenen Typunterdrückungs-, Compilerinput- und Header-Binding-Lücken.

## Konsequenz für die Architekturentscheidung

A hält Model, Actions, View und Hostkanten an einer Stelle. Dieser konkrete Tagentwurf macht einfache Actions deutlich ausführlicher als Classic. Das ist eine Eigenschaft des erprobten Vokabulars, kein Nachweis gegen TSX: statische, typisierte Record-Deklarationen außerhalb des JSX-Baums bleiben eine andere mögliche Oberflächenform.

B erhält die kompakte, vorhandene Orchestrierungssprache. Dafür entstehen ein explizites Quellpaar, ein gemeinsamer Symbol-/Typvertrag und eine zusätzliche Grenze für Rename, Diagnosen und Watchinvalidierung. Eine View mit Props-/Intentbindungen ist weiterhin Teil des Datenflusses; ihre `.tsx`-Endung macht sie nicht zu einer gewöhnlichen React-Komponente.

Für **beide** braucht der Build ein eindeutiges Profil. Bei `.rmtx` ist dieses im Dateinamen sichtbar, aber Discovery, CLI/MCP, LSP und Cache müssen die Endung erst unterstützen. Normales `tsc` lehnt `.rmtx` als Root ab; `allowArbitraryExtensions` ersetzt keine Prüfung des Sourcebodys. `.rmtx.tsx` funktioniert als normale TSX-Datei und eignet sich bei Bedarf als Übergang. Ein bloßes `files.associations` ist keine vollständige Compilerintegration. Diese Ergebnisse sind in den [reproduzierbaren Extension-Probes](extension-probes.cjs) belegt.

Nach der angenommenen Syntaxentscheidung folgen als Implementierungsabnahme große Actions/Policies, Selectoren und die dokumentierten Präzedenzgegenfälle, verschachtelte Key-Hosts samt SSR, allgemeine native UI sowie echte Editor-/DX-/AX-Aufgaben. Dieser erste Versuchsaufbau belegt die Machbarkeit beider Richtungen und begründet die separate Endungsentscheidung; er ersetzt diese Implementierungsabnahme nicht. Die [unabhängigen Reviewkriterien](review-notes.md) bleiben der Maßstab.

## Reproduktion

Mit installierter Projekttoolchain; ein externer Harness kann über `NODE_PATH` und `XTENSIONS_TEST_PEERS` bereitgestellt werden:

```sh
node development/rmtx-a06/syntax-comparison/inspect.cjs --check
node development/rmtx-a06/syntax-comparison/extension-probes.cjs --check
XTENSIONS_TEST_PEERS=/pfad/zum/peer-harness node development/rmtx-a06/syntax-comparison/runtime-comparison.cjs --output /tmp/two-host-comparison-node.json
XTENSIONS_TEST_PEERS=/pfad/zum/peer-harness CHROME_BIN=/pfad/zu/chromium node development/rmtx-a06/syntax-comparison/runtime-comparison.cjs --browser --output /tmp/two-host-comparison-browser.json
```

Die deterministischen eingecheckten Prüfergebnisse binden Node **24.18.0** und TypeScript **5.9.3**. Unter Node 26 laufen die Prüfer ohne `--check`, damit die abweichende Nodeversionsangabe nicht als Drift gilt. `--write` erzeugt die statischen Nachweise bewusst neu; es erfindet keine Runtime-Ergebnisse. Fehlende Peers oder fehlendes Chromium sind Fehler und führen zu keinem stillen Skip. Der Vergleich wird bis zur produktiven Frontendimplementierung separat ausgeführt und nicht als produktive RMTX-Unterstützung im Releasegate registriert.
