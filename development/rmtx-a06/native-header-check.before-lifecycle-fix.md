# A06: Native Headerprüfung nach der Syntaxentscheidung

Stand: **15. November 2026**. Neue, opt-in ausgeführte Development-Referenz und Akzeptanzprofil **1.0.0**. Die [Syntaxentscheidung](syntax-decision.md) ist angenommen: deklaratives RMTX mit TSX-Grammatik, `.rmtx` und qualifizierten RMT-Operatortags. Das Ergebnis dieser Laufzeitprüfung ist davon getrennt: **Die vollständige native Headerabnahme ist noch nicht grün. Der Produktionsimplementierung wird damit noch keine vollständige Lifecycle-Freigabe erteilt.**

## Tatsächlich geprüfter Pfad

Die neuen Quellen [native-header.rmtx](syntax-comparison/native-header.rmtx) und [native-header.rmt](syntax-comparison/native-header.rmt) erweitern den vorhandenen Zwei-Host-Fall um eine deklarierte `product.rename`-Action. Sie übernimmt den Stringparameter `imageId` in `state.product.id`. Der Prüfaufbau verwendet diesen vorhandenen, typgeprüften Inputhandle; er führt keine neue allgemeine Inputtyp-API ein. Das Hybridprofil nutzt weiterhin [view.tsx](syntax-comparison/view.tsx).

[Die neue Referenz](syntax-comparison/native-header-reference.cjs) senkt den aus der jeweiligen Quelle ermittelten Header-Sidecar in das **vorhandene** native Renderdescriptorformat ab: ein `h1` innerhalb der deklarierten Owner-Surface mit `text: { op: "path", path: "$model.product.id" }`. Beide Quellen laufen unabhängig durch den wirklichen Classic-Compiler und die Maraca-Planprüfung. Der ergänzte Renderplan wird von der bestehenden A06-Komposition gebootet. Es gibt keinen zweiten DOM-/Modelwriter, keinen zusätzlichen Modelsubscriber und keine Runtimeausführung der RMTX-Source. Die bisherigen A06-APIs und Wireverträge werden nicht geändert.

[Die Akzeptanzfälle](syntax-comparison/native-header-acceptance.mjs) prüfen den echten Maraca-Renderer zusammen mit tatsächlichen React-/Vue-Roots, dem nativen Kernel, Fabric, der Surface-Verwaltung und XTend State. [Der Runner](syntax-comparison/native-header-test.cjs) liefert bei offenen Akzeptanzfehlern ausdrücklich einen **Exitcode 1**, nachdem er den beobachteten Report geschrieben hat.

## Ergebnis

**Je Variante bestehen 13 von 17 Erwartungen; vier Lifecycle-Erwartungen schlagen fehl.** Die Vergleichsquellen zeigen dasselbe Verhalten. Die vollständige Umgebungsmatrix und ihre Quellhashes stehen im [nativen Headernachweis](syntax-comparison/native-header-evidence.json).

| Bereich | Beobachtung |
| --- | --- |
| Initialrender | Der Header wird innerhalb seiner echten Owner-Surface mit `p1` gerendert. |
| Action-/Modelrückweg | Die tatsächlich kompilierte Rename-Action ändert Model und Header auf `p2`. |
| Textescaping | Markupförmiger Modeltext bleibt Text; kein `img`-Element und keine Scriptwirkung entstehen. |
| Identität und Koexistenz | Header sowie beide Framework-Roots bleiben bei Updates identisch; reale Provider-DOMevents erreichen weiterhin die Actions. |
| Kernel/Fabric | Provider-Mounts laufen über die tatsächliche Admission und besitzen die erwarteten zwei Leases. |
| Close/Resume der Provider | Beide Provider suspendieren und behalten ihre Roots; Resume bewahrt auch die Headeridentität. |
| App-Disposal | Runtime-Disposal entfernt den Header, gibt Providerleases frei und sperrt spätere Commands. |
| **Native Close-Projektion** | **Fehler:** Die Boundary wird inaktiv, der normale native Owner bleibt jedoch `display: block`, `visibility: visible`, ohne `hidden`. |
| **Native Destroy-Boundary** | **Fehler:** Nach Destroy aus dem offenen Zustand bleibt die bestehende Boundary aktiv und nicht disposed; ihr altes Signal ist nicht abgebrochen. |
| **Native Destroy-DOM** | **Fehler:** Der Header bleibt verbunden, obwohl der Resource Graph die Surface als zerstört meldet und beide Providerleases freigegeben hat. |
| **Später ownergebundener Command** | **Fehler:** Ein Command mit dem vor Destroy erfassten Lifetime-Token wird nicht vor der Mutation superseded. Model und Header werden noch auf `late-native-result` gesetzt. Erst die anschließende Zustellung an beendete Provider erzeugt einen Fehler. |

Der letzte Fall ist ausdrücklich **kein** frei/unscoped ausgelöster globaler Command: Der Test übergibt das vorher erfasste `signal` und `isCurrent()` als bestehenden vierten Command-Lifetimeparameter. Ein Close vor Destroy würde diesen Fehler maskieren. Deshalb nutzt die Destroyprüfung eine eigene, zuvor tatsächlich offene Owner-Lifetime.

## Einordnung der Lücken

Die vorhandene `SurfaceController`-Subscription im [Maraca-Planruntime](../../xtend-maraca/plan-runtime.mjs) verarbeitet Lifecycle-Snapshots und erzeugt dabei keine allgemeine native DOM-Projektion. Der Controller entfernt zerstörte Records standardmäßig aus dem an Subscriber gelieferten Snapshot. `syncSurfaceBoundaries` verarbeitet nur vorhandene Records; die Destroy-Tombstone fehlt deshalb, obwohl sie über den bereits vorhandenen vollständigen Read-Snapshot verfügbar wäre. Dies erklärt den beobachteten fehlenden Boundary-Abschluss.

Die Framework-Hosts haben bereits einen eigenen, durch Graph und Kernelleases wirksamen Lifecyclepfad. Dessen erfolgreiche Abnahme beweist die native Headerprojektion nicht. Ebenso ist ein manuelles `refresh` nach Destroy kein geeigneter Cleanupnachweis: Eine weiterhin deklarierte Surface kann dabei neu materialisiert werden. Der Test ergänzt keine solche Reparatur und blendet die Unterschiede nicht durch einen zusätzlichen DOMwriter aus.

Die beiden weiteren DOM-Erwartungen verlangen einen **ausdrücklichen nativen UI-/Lifecycle-Projektionsvertrag**: Welcher vorhandene Viewport besitzt Visibility und Entfernung der nativen Owneransicht; wie werden Controllerstatus und Generationen in diesen Viewport überführt; was bleibt als App-Shell bestehen und was gehört zur zerstörten Surface? Für den neuen RMTX-Operator sollte dies verbindlich sein, bevor allgemeine native JSX-Bäume freigegeben werden.

## Nächster Implementierungsabschnitt

1. Den nativen Presentation-Boundary-Abschluss gegen die autoritative vollständige Controller-Lifecycleinformation einschließlich Destroy-Tombstones herstellen. Alte Tokens müssen schon vor einer Modelmutation gesperrt sein.
2. Eine eindeutige Viewprojektion für Close/Resume/Destroy festlegen und über die vorhandenen Render-/Presentationports ausführen. DOM-Ownership, Provider-Root-Erhalt und die Grenze zur weiterlebenden App-Shell müssen dabei explizit bleiben.
3. Diese 17 Erwartungen in beiden Quellen und allen drei Umgebungen vollständig grün machen. Anschließend kann der beschlossene RMTX-Frontendpfad auf dieser nativen Grundlage konkret implementiert werden.

Das sind belegte Backend-/Boundary- und native Viewvertragslücken, keine Widerlegung der beschlossenen TSX-Grammatik. Die Syntaxentscheidung und die RMTX-Editorintegration können unabhängig davon umgesetzt werden.

## Reproduktion

Mit passender Projekttoolchain und externem React-/Vue-/jsdom-/Playwright-Harness:

```sh
XTENSIONS_TEST_PEERS=/pfad/zum/peer-harness node development/rmtx-a06/syntax-comparison/native-header-test.cjs --output /tmp/native-header-node.json
XTENSIONS_TEST_PEERS=/pfad/zum/peer-harness CHROME_BIN=/pfad/zu/chromium node development/rmtx-a06/syntax-comparison/native-header-test.cjs --browser --output /tmp/native-header-browser.json
```

Der aktuell erwartete Exitcode ist **1**, weil die Akzeptanz wirklich fehlschlägt. Die ursprüngliche isolierte Rendererprobe und der bisherige Zwei-Host-Vergleich bleiben eigenständige, grüne Nachweise für ihren jeweils engeren Umfang. Neue Reportdaten tragen `productionFrontendImplemented: false` und `acceptedForRelease: false`.
