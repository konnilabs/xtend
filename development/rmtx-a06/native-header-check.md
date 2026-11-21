# A06: Native Headerprüfung und Lifecyclekorrektur

**Aktuelle Einordnung vom 21. November 2026:** Der nachfolgende Headerbericht bleibt der konkrete Nachweis vom 15. November. Produktives RMTX-Frontend und [A06.5 – Projekt-/Editorintegration](project-tooling/implementation.md) sind inzwischen implementiert und lokal geprüft. Der zuletzt nachgewiesene lokale Editorstand ist [VSIX 0.3.0](vscode-rmtx-update.md); die Installation belegt keine Aktivierung im bereits laufenden Benutzerhost. Die gemeinsame Zielmatrix, Rollenabnahme und formale Releasebindung führt [A06.6](release-acceptance/implementation.md). Source 4–8 erhalten aus dem Headernachweis keine SSR-/Adoptionsfreigabe.

Stand: **15. November 2026**. Akzeptanzprofil **1.1.0**, neue native View-/Lifecyclevereinbarung **1.0.0**. Die vollständige Headerprüfung ist jetzt **grün: 21 von 21 Erwartungen je Quellvariante unter Node 24, Node 26 und Chromium**. Damit ist dieses konkrete Gate für den Beginn der beschlossenen RMTX-Frontendimplementierung geschlossen. Eine vollständige RMTX-/0.9-Releaseabnahme wird daraus nicht abgeleitet.

## Behobene Kanten

| Vorheriger Befund | Aktuelles Verhalten |
| --- | --- |
| Close beendet Admission, lässt den Header aber sichtbar | Der v2-Viewport verbirgt die native Owneransicht über den Shared Renderer. Resume erhält Nodeidentität und ursprüngliche Model-/ARIA-/CSS-Sichtbarkeit einschließlich vorhandener Inline-Priorität. |
| Destroy fehlt im normalen Subscriber-Snapshot | Maraca liest den vollständigen autoritativen Controllerzustand mit `includeDestroyed: true`. Die existierende Boundary wird synchron disposed und ihr altes Signal abgebrochen. |
| Header bleibt nach Destroy im DOM | Die native Viewprojektion bereinigt den nativen Inhalt und den Surfaceindex. Private Fremdroots samt notwendigen Wrappern bleiben unter ihrer eigenen Lifetime geschützt; native Kinder solcher zurückbehaltenen Wrapper werden trotzdem entfernt. |
| Alter ownergebundener Command mutiert noch Model und Header | Der alte Lifetime-Token liefert bereits vor einer Mutation `superseded`. Das bleibt nach einer ausdrücklich neu erzeugten Generation so. |
| Normaler Commit könnte den zerstörten Owner wieder anlegen | Managed-Materialisierung setzt die neue Graphoption `preserveDestroyed: true`; zerstörte Deskriptoren und beendete Hostbindungen werden nicht erneut zugestellt. Erst ein vertrauenswürdiger expliziter Recreate erlaubt eine neue Generation. |

Der [vorherige rote Prüfbericht](native-header-check.before-lifecycle-fix.md) und sein [unveränderter Nachweis](syntax-comparison/native-header-evidence.before-lifecycle-fix.json) bleiben historische Beobachtungen. Die ursprünglichen 17 Erwartungen wurden nicht aufgeweicht. Vier zusätzliche Fälle prüfen Modelupdates während Close, globale Modelupdates nach Destroy ohne Wiederbelebung, eine ausdrücklich neue Generation und die erneute Sperre des alten Tokens.

## Geprüfter Ausführungspfad

Die Quellen [native-header.rmtx](syntax-comparison/native-header.rmtx) und [native-header.rmt](syntax-comparison/native-header.rmt) definieren tatsächlich eine `product.rename`-Action. Ihr vorhandener Stringinputhandle `imageId` schreibt `state.product.id`; die Hybridvariante verwendet weiterhin [view.tsx](syntax-comparison/view.tsx). Beide Quellen werden unabhängig durch den echten Classic-Compiler und die Maraca-Planvalidierung abgesenkt.

[Die Headerreferenz](syntax-comparison/native-header-reference.cjs) ergänzt den vorhandenen nativen Renderplan um einen `h1` unter der deklarierten Owner-Surface. Dessen Textpfad `$model.product.id` läuft im normalen Maraca-Renderer mit dem tatsächlichen Modelkontext. Initialrender, echte Actionupdates, Textescaping und Koexistenz mit zwei wirklichen React-/Vue-Roots werden gemeinsam ausgeführt. Es gibt keinen zweiten Modelwriter, keine Runtimeausführung der RMTX-Source und keinen gesonderten Test-DOMwriter.

Der Controller liest und entscheidet; der Viewport projiziert DOM; der Shared Renderer wahrt private Ownership. Kernel, Fabric, Surface-Verwaltung und XTend State bleiben auf ihren bisherigen Pfaden. Der genaue Ablauf, Visibilityüberlagerungen und die ausdrückliche Wiederanlage stehen im [nativen View-/Lifecyclevertrag](native-view-lifecycle-contract.md).

## Versionen und Kompatibilität

| Modul/Vertrag | Stand |
| --- | --- |
| View Projection Adapter | Modul-API **2.0.0**, neuer Default `xtend.rmt.maraca-view-projection-adapter.v2` |
| Legacy Viewport | `.v1` ist ausdrücklich weiter wählbar und behält die alte Portform |
| Lifecycle-Projektionsreport | neuer Vertrag `xtend.rmt.maraca-surface-lifecycle-projection.v1` |
| Surface Resource Graph | Modul-API **2.2.1**, additive Materialisierungsoption; bisheriger Standalone-Default bleibt erhalten |
| Shared Descriptor Renderer | Modul-API **2.2.0**, bisherige Wireformen bleiben erhalten |
| Maraca Planruntime | bestehende Snapshot-/Factory-Wireformen, insbesondere `.v7`, unverändert |
| Header-Akzeptanzprofil | **1.1.0**, 21 statt vorher 17 Erwartungen |

## Ergebnisse und Commit-Gates

Der [aktuelle Headernachweis](syntax-comparison/native-header-evidence.json) enthält die drei tatsächlich ausgeführten Läufe, sämtliche Erwartungen und ihre Quellenbindung. Alle Header-Traces sind zwischen beiden Sourceformen und zwischen den Umgebungen gleich.

Zusätzlich bestehen **98 gezielte Tests je Node 24 und 26**, darunter Compiler-/Event-/Actionregressionen, 19 Renderer-Ownershipfälle, 12 Viewportfälle, zwölf native Runtimefälle und sechs Graph-Lifetimefälle. Die neuen Fälle sind im blockierenden `check:release-preparation` registriert. Die 20 bestehenden RMT-Domänensuites bestehen mit jeweils 2961 Assertions unter beiden Node-Lanes; Kernel-Lab besteht 263 und die offizielle Artefaktparität 291 Prüfungen.

Die reale Rückwegmatrix umfasst außerdem den bisherigen Zwei-Host-Fall mit 13, automatische Komposition mit acht und Scoped CSR mit sechs Fällen in jsdom unter beiden Node-Lanes sowie Chromium. Scoped SSR besteht 35 Fälle je Node-Lane mit tatsächlichem Chromium. Diese 14 sauberen Läufe halten die Produktions-/Runner-/Providerquellen während der Ausführung unverändert. Die strikten Größenbudgets werden durch die bestehenden Inspektoren unverändert geprüft.

Der [zusammengeführte Reparaturnachweis](native-lifecycle-fix-evidence.json) bindet diese Ergebnisse, die Gateprüfung und die offiziellen Buildoutputs. Das damalige [Editor-/MCP-Paket](vscode-rmtx-update.md#historischer-updatebericht--15-november-2026) wurde wegen der enthaltenen Backendmodule konsistent auf **0.2.3** aktualisiert; die vorherige 0.2.1-Installation bleibt historisch dokumentiert. Der spätere A06.5-Installationsstand 0.3.0 ist auf derselben Updateübersicht separat abgegrenzt.

## Reproduktion

Mit passender Projekttoolchain und vorhandenem Peer-Harness:

```sh
XTENSIONS_TEST_PEERS=/pfad/zum/peer-harness node development/rmtx-a06/syntax-comparison/native-header-test.cjs --output /tmp/native-header-node.json
XTENSIONS_TEST_PEERS=/pfad/zum/peer-harness CHROME_BIN=/pfad/zu/chromium node development/rmtx-a06/syntax-comparison/native-header-test.cjs --browser --output /tmp/native-header-browser.json
npm run check:release-preparation
node scripts/verify_xtendrmt_artifact_parity.js --json
```

Der Header-Runner lieferte im hier dokumentierten Lauf **Exitcode 0**. Diese Backendkorrektur allein war noch kein produktiver RMTX-Compiler oder semantischer Language Server. Die späteren Frontendabschnitte und A06.5 sind inzwischen implementiert und lokal geprüft; offen bleibt die gemeinsame Abnahme A06.6. `nativeHeaderAccepted: true` und `acceptedForRelease: false` unterscheiden weiterhin die bestandene konkrete Headerabnahme von der vollständigen Plattformfreigabe.
