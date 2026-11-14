# A06.1b – Zwei Hosts mit providerseitiger Komponentenschnittstelle

Stand: **14. November 2026**. Referenzvertrag und Referenz-API **2.0.0**, Provider-Interface **1.0.0**. Die [Schnittstellendokumentation](component-interface.md) beschreibt die neue Trennung von Provider-Vertrag und Aufrufstelle. Syntaxentscheidung und automatische Maraca-Komposition für diesen Fall bleiben offen.

Die Referenz zeigt eine React-Galerie und einen Vue-Bewertungsbereich mit getrennten Renderzielen, eigener Binding-Identität und **derselben owning Surface `product-details`**. Beide nutzen denselben vorhandenen RMT-Microkernel, Fabric, Surface-Controller und Model-/Action-Pfad. Der gemeinsame Owner wird im vertrauenswürdigen Anwendungshost ausdrücklich injiziert. Dafür entstehen keine neue Host-ABI und kein zweiter Scheduler, Graph oder State-Writer.

## Dateien und Aussagekraft

| Datei | Aufgabe |
| --- | --- |
| [two-host.contract.json](two-host.contract.json) | Geschlossener Aufrufstellenvertrag v2: Owner, Renderziele, gepinnte Provider-Interface-Referenzen, Props-Pfade, Action-Zuordnungen und Lifecycle-Lanes. Typen kommen vom Provider. |
| [two-host.rmt](two-host.rmt) | Tatsächlich kompilierbares Classic-Programm mit Model, drei Actions, gemeinsamem Owner und zwei separaten Host-Surfaces. |
| [two-host.candidate.tsx](two-host.candidate.tsx) | Vorgeschlagene Autorensyntax. Noch keine implementierte RMTX-Eingabe. Die native `ProductHeader`-Definition sowie Datei-/Importregeln sind hier absichtlich nicht entschieden. |
| [two-host-reference.cjs](two-host-reference.cjs) | Prüft den Contract, erzeugt bestehende Binding-Daten und kompiliert das Classic-Gegenstück. Prüft den eigenen TSX-Kandidaten auf Syntax und Übereinstimmung seiner IDs, Lanes, Props-Pfade und Action-Zuordnungen. Das ist kein allgemeiner RMTX-Parser oder Symbolresolver. |
| [two-host.types.d.ts](two-host.types.d.ts) | Aus den providerseitigen Interfaces erzeugte Typmap für Provider und JSX-Aufrufstellen; Typen und Identität werden gemeinsam gebunden. |
| [React-Provider](providers/react-gallery.mjs), [Vue-Provider](providers/vue-reviews.mjs) | Synchron vorkompilierte Factories mit Peer-Injektion und kontrollierten Werten; keine zweite schreibende Autorität für Auswahl/Sortierung. |
| [two-host-runtime.mjs](two-host-runtime.mjs) | Explizite, ausführbare Referenzkomposition über die vorhandenen A03-Host-Ports und die normale Maraca-Model-/Action-/Binding-Kette. |
| [two-host-inspect.cjs](two-host-inspect.cjs), [two-host-evidence.json](two-host-evidence.json) | Deterministische Contract-/Compiler-/Provider-/Typprüfungen und Quellenbindung. |
| [two-host-test.cjs](two-host-test.cjs), [two-host-acceptance.mjs](two-host-acceptance.mjs) | Dieselben echten Framework-Fälle in jsdom und Chromium. Kein Mock-Rendering und kein Runtime-JSX-Compiler. |
| [two-host-runtime-evidence.json](two-host-runtime-evidence.json) | Tatsächlich beobachtete Runtime-Ergebnisse mit Bezug auf den geprüften Contract-/Quellenstand; keine Releasefreigabe. |

## Vertrag 2.0.0

| Eigenschaft | Galerie | Bewertungen |
| --- | --- | --- |
| Stabile Deklaration | `product-gallery` | `product-reviews` |
| Eigenes Renderziel / Binding-Surface | `product-gallery-host` | `product-reviews-host` |
| Gemeinsamer Lifecycle-/Ressourcen-Owner | `product-details` | `product-details` |
| Provider | `react-product-gallery`, Komponente 2.0.0 | `vue-product-reviews`, Komponente 2.0.0 |
| Externe Peers | React/ReactDOM 18.3.1 | Vue 3.5.43 |
| Kontrollierte Props | `images`, `selectedImageId` aus `product` | `productId`, `sort` aus `product` |
| Intent | `selectImage`, exakt `{ imageId: string }` | `changeSort`, exakt `{ order: string }`; Mapping auf Action-Feld `sort` |
| Business-Action | `product.selectImage` | `product.changeSort` |
| Angefragte Lifecycle-Lane | `visible` | `idle` |

Die Auswahl fließt **Model → kontrollierte Props → Framework-Event → geprüfter Intent → deklarierte Action → Model**. Die vorhandene State-Projektion übernimmt den committeten Model-Wert vor der erneuten Props-Lieferung. Ein Intent kann weder ein beliebiges Command wählen noch zusätzliche Payload-Felder oder Ports einschleusen. Die Action-Input-Typen werden bereits beim Kompilieren gegen den Contract geprüft.

Die separaten [Provider-Interfaces](providers/catalog.json) definieren den bestehenden generischen Intent-Marker sowie die konkreten geschlossenen Payload-Felder. Die Aufrufstelle kann diese Regeln nicht erweitern. Provider-Payloads werden vor dem Mapping und normalisierte Action-Payloads anschließend durch die Binding-Registry geprüft. Der generische Marker allein validiert keine Payload. Die generierte Provider-ID-Typmap wird gegen die echten Provider, den TSX-Kandidaten und negative Aufrufstellen geprüft. Einzelheiten und die Versionierungsregeln stehen im [Interface-Vertrag](component-interface.md).

Die konkrete Binding-Adresse besteht weiterhin aus Dokument, Deklaration und typisierten Keys; dieser statische Fall hat `keys: []`. Bei Entfernung und Wiederaufnahme derselben Deklaration bleibt die logische Adresse erhalten, während die Registry eine neue Inkarnation erzeugt. Wiederholte Hosts und neue Key-Syntax sind kein zusätzlicher Implementierungsumfang dieser Referenz.

`presence` und die Action `hosts.replace` sind Test-/Referenzsteuerung für unabhängiges Entfernen und Wiederaufnehmen. Sie sind noch keine beschlossene RMTX-Conditional-Syntax. Der TSX-Kandidat zeigt den normalen Zustand mit beiden vorhandenen Hosts.

## Bewusste Abbildung auf den Bestand

Der Fall trennt **fachlichen Owner** und **Renderziel** ausdrücklich. Der Classic-Plan erhält drei getrennte Surface-Definitionen; die beiden Binding-Ziele bleiben leer, keyed und eindeutig. Die Runtime wählt den gemeinsamen Owner über den schon vorhandenen A03-Graph-Port. Die vorhandene Registry hält weiterhin genau eine kontrollierte Host-Lifetime pro Adresse.

Das ist eine explizite Anwendungskomposition. Das aktuelle automatische A04-Manifest verlangt nach wie vor, dass `ownerSurface` der jeweiligen Binding-Surface entspricht. Der Inspector prüft, dass eine direkte Übernahme des gemeinsamen Owners in dieses Legacy-Manifest abgewiesen wird. Er schreibt keinen gefälschten Owner in ein scheinbar gültiges automatisches Artefakt.

Auch die DOM-Verschachtelung ist damit noch keine neue Lowering-Regel: Das Classic-Gegenstück stellt die nativen Renderziele nebeneinander im gemeinsamen App-Root bereit. Die owning Surface beschreibt hier Lifecycle und Ressourcen, nicht automatisch ein DOM-Elternelement. Die `<RMT.Surface>`-Verschachtelung des Kandidaten muss später entweder genau so definiert oder durch eine nachgewiesene strukturelle Abbildung ergänzt werden. Der native Header ist in Classic nur ein Platzhalter, keine bereits implementierte allgemeine native TSX-Komponente.

Für eine automatische A06-Abbildung ist damit eine konkrete Anschlussfrage isoliert: **Wie gelangt die getrennte `ownerSurface`-/Renderziel-Zuordnung versioniert durch Binding, Manifest, Build, Browserkomposition und A05-Restore, ohne die bisherigen Verträge umzudeuten?** Eine alternative Erzeugung zusätzlicher Surfaces müsste ihre Eltern-/Lifecycle-Verknüpfung gleichwertig nachweisen. Diese Referenz entscheidet die Alternative noch nicht.

## Lifecycle, Grants und Abschluss

- Die unabhängigen vertrauenswürdigen Anwendungsgrants bestätigen die Lane-Anforderungen; der Contract erhält keinen Scheduler-, Kernel- oder Surface-Port. Ein abweichender Lane-Request wird abgewiesen.
- Normales Mount/Update/Suspend/Resume läuft als tatsächliche Kernel-Arbeit durch Fabric. `visible`/`idle` steuern diese Lifecycle-Jobs; autonome Framework-Updates und harte Präemption werden nicht behauptet.
- Close der gemeinsamen Surface suspendiert beide Hosts kooperativ. Model und XTend State dürfen weiter committen; die Roots übernehmen ihre neuesten kontrollierten Props bei Resume.
- Das Entfernen eines Hosts entzieht nur dessen Lifetime und Ressourcen. Der andere behält Container und Framework-DOM. Alte Registry-Callbacks können auch nach Wiederaufnahme derselben Adresse keine Action mehr auslösen.
- Destroy des gemeinsamen Owners widerruft beide Ressourcen-/Work-Scopes unmittelbar. Ein verspäteter Provider oder ein altes Work-Ergebnis darf keinen Root und keinen Model-Commit nachliefern.
- Idle bezeichnet die vorhandene Binding-/Lifecycle-Barriere, keinen Browser-Paint und keinen Abschluss beliebiger autonomer Framework-Arbeit.

Die Referenz gewährt beiden Hosts unabhängig einen benannten kooperativen Prüfauftrag `inspect`. Er dient der Cancellation-Prüfung und wird nicht durch ein Source-Attribut erzeugt. Die Provider sind vertrauenswürdiger Anwendungscode im gleichen Realm; die Referenz ist keine Sicherheits-Sandbox.

## Prüfungen ausführen

Mit installierter Repository-Toolchain:

```sh
node development/rmtx-a06/two-host-inspect.cjs --check
XTENSIONS_TEST_PEERS=/pfad/zum/externen-peer-harness node development/rmtx-a06/two-host-test.cjs
XTENSIONS_TEST_PEERS=/pfad/zum/externen-peer-harness CHROME_BIN=/pfad/zu/chromium node development/rmtx-a06/two-host-test.cjs --browser
```

Der externe Harness stellt die exakt passenden React-/Vue-Peers, jsdom und Playwright bereit. Fehlende Peers oder fehlendes Chromium führen zu Fehlern, keinem stillen Skip. `--output <datei>` schreibt die tatsächlichen Runtime-Ergebnisse. Nach einer bewusst geprüften Contract-/Quellenänderung erzeugt `two-host-inspect.cjs --write` die Typen und den deterministischen Nachweis neu.

Abgedeckt werden geschlossene Contract-Felder und Versionen, korrekte Model-/Action-Bindungen, Kandidat-Konsistenz, echte Provider-Bytes im Graph-Capture, Provider-Typen und der erwartete Legacy-Kompositionsfehler. Die Runtime-Fälle prüfen echte Controls, getrennte Container, Kernel-/Fabric-Zulassung, beide Model-Rückwege, ungültige Intents, gemeinsame Suspension, getrennte Reinkarnation, verspätete Provider und den synchronen Widerruf aktiver kooperativer Arbeit.

Lokaler Nachweis: **26 Contract-/Compiler-/Provider-/Typprüfungen** unter beiden Node-Versionen sowie **13 echte React-/Vue-Fälle je Lauf** unter Node 24.18.0 und 26.5.0 in jsdom und im vorhandenen Chromium. Für A06.1b wird TypeScript 5.9.3 mit esbuild 0.28.2 verwendet; die ältere A06.1a-Beobachtung mit esbuild 0.25.12 bleibt im v1-Nachweis historisch erhalten. Die konkreten Testberichte werden vom Runner mit Node-, Peer- und Browserversion geschrieben. Contract-/Typ-/Interface-Prüfungen sind im blockierenden Vorbereitungsgate enthalten. Die Framework-Läufe bleiben über die eigenen Kommandos reproduzierbar und sind kein vollständiger 0.9-Release-Nachweis.

## Offen für die nächsten A06-Abschnitte

1. Die automatische Owner-/Renderziel-Abbildung mit ihrer Versionierungsstrategie entscheiden und implementieren; bisherige APIs/Schemata bleiben hier unverändert.
2. Den jetzt implementierten providerseitigen Komponentenvertrag in ein allgemeines RMTX-Frontend integrieren. Die hiesige Typ-/Fixture-Prüfung ersetzt keine allgemeine Symbolauflösung oder sichere Cross-File-Rename-Funktion.
3. Den gleichen vollständigen Fall in A und C gegenüberstellen, einschließlich Model, Actions und Policies. Die kurze TSX-Ansicht darf nicht allein als DX-/AX-Gewinn gelten.
4. Den Zwei-Host-Fall gesondert durch A05 mit signiertem Restore, tatsächlicher SSR-Adoption und Replay führen. Diese Referenz prüft noch keinen solchen Handoff; sie erweitert A05 weder um async Komponenten noch um Portale oder neue Deploymentprofile.

Der vorherige Case und seine Nachweise sind als v1-Dateien historisch erhalten. Dies ist eine ausführbare Implementierungsgrundlage für A06.1b, keine abschließende Syntax-ADR, kein freigegebenes öffentliches Komponenten-API und keine vollständige Feature-Abnahme von XTend 0.9.
