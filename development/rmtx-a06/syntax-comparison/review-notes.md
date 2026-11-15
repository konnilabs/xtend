# Prüfgrenzen des Two-Host-Syntaxvergleichs

Stand: 15. November 2026. Diese Kriterien stammen aus einer unabhängigen Rückprüfung des bestehenden Two-Host-Candidates und des Classic-Compilerpfads. Sie sind keine Syntaxfreigabe und kein neuer produktiver AST-Vertrag.

## Zwei tatsächlich unterschiedliche Eingänge

Das deklarative TSX-Modul soll Model, Actions, Portal, Surfaces und Lanes selbst beitragen. Classic plus TSX-View soll dieselben Orchestrierungsdefinitionen aus der Classic-Datei beziehen; die View verweist auf bereits deklarierte Surface-Ziele und bindet Provider, Props und Intents. Die View darf dabei keine zweite Action-, State- oder Lane-Autorität schaffen. Intentmapping bleibt eine sprachübergreifende Bindingkante und benötigt einen gemeinsamen Symbolvertrag.

Ein gemeinsamer Providerkatalog ist die richtige unabhängige Quelle für Interfaceidentität, Typen und Codepins. Ein gemeinsam kopierter Aufrufstellenvertrag wäre dagegen kein Nachweis unabhängiger Sourceabsenkung. Der vorhandene `two-host.contract.json` darf als erwarteter Vergleichswert dienen; die beiden Varianten müssen ihre tatsächlichen Props-Pfade, Intents, Ziele und Presencepfade selbst erzeugen.

`two-host-reference.cjs::lowerContract()` validiert intern gegen die fest eingetragene alte `two-host.rmt`. Wird dieser Helfer weiterverwendet, muss der tatsächlich aus der jeweiligen Variante erzeugte Plan zusätzlich unabhängig kompiliert und gebunden werden. Eine erfolgreiche Prüfung des alten Plans darf nicht die Compilation des neuen Eingangs ersetzen.

## Symbolidentität und geschlossene Ausdrücke

- Intrinsics werden über den TypeScript-Typechecker und die tatsächlichen Import-/Deklarationssymbole identifiziert. Ein gleichnamiger lokaler Helper, ein fremdes Modul oder ein überschatteter Parameter erhält dadurch keine RMT-Autorität.
- Explizite Importaliases müssen dieselbe vertrauenswürdige Deklaration erreichen. Unbekannte Reexports oder Importpfade werden abgewiesen, solange sie nicht Teil des überprüften Profils sind.
- Model-, Action- und Providerhandles benötigen dieselbe Herkunftsprüfung. Die Schreibweise `model.product` allein begründet keine Modelreferenz.
- Die gesamte Datei wird vor einer Absenkung geprüft. Unbenutztes Top-Level-JavaScript, seiteneffektbehaftete Imports, freie Funktionsaufrufe, Getter, Spreads und berechnete Felder dürfen nicht nur deshalb durchgehen, weil der untersuchte JSX-Baum korrekt ist.
- Source wird gelesen und analysiert, nicht mittels `require`, `import()` oder einer JSX-Factory ausgeführt. Statische Analyse einer DSL-Datei ist keine Sandbox für später dennoch ausgeführten Authoringcode.
- Diagnosen sollten die Originaldatei und die konkrete AST-Range bezeichnen. Aliasunterstützung und Fehlermeldungen über Dateigrenzen sind relevante AX-/DX-Eigenschaften, keine reine Parserfrage.

## Native Header als begrenzter UI-Sidecar

Der bisherige `ProductHeader` ist ein Platzhalter. Für den Vergleich genügt ein ausdrücklich versioniertes, geschlossenes Profil für `header`/`h1`/Text und direkte Modelpfade. Beide Varianten können denselben Sidecar erzeugen und dessen Ausgabe über den vorhandenen DOM-Descriptor-Renderer prüfen. Beliebige Funktionskomponenten, HTML-Strings, Eventcallbacks, Children-Slots oder Framework-Lifecycle dürfen daraus nicht abgeleitet werden.

Ein isolierter Header-/Renderer-Nachweis belegt weder die allgemeine Integration eines JSX-UI-Baums in Maraca noch dessen SSR-/PHP-Parität. Die tatsächlichen React-/Vue-Hosts müssen weiterhin über die bestehenden Fabric-, Surface-, Kernel- und Bindingpfade laufen. Der Headerbeweis darf einen fehlenden gemeinsamen produktiven UI-Vertrag sichtbar lassen.

## Gegenproben und Aussagekraft

Beide Quellen sollen dieselben kanonischen Model-/Action-/Surface-/Bindingdaten und denselben geschlossenen Header-Sidecar erzeugen. Anschließend sollten echte Hostläufe Auswahl, Sortierung, gemeinsames Suspend/Resume, Entfernen/Wiederanlegen und widerrufene Callbacks beobachten. Ein Vergleich ausschließlich gleicher JSON-Werte ersetzt diese Laufzeitprüfung nicht.

Erforderliche Gegenproben sind mindestens: lokales Intrinsic-Imitat, Alias eines echten Imports, fremder Import mit vertrautem Namen, überschatteter Modelhandle, freier Top-Level-Effekt, Aufruf in einem Prop, zusätzliche Providerprops, falsches Intentmapping, nicht deklarierte Action oder Surface und abweichende Lane. Mutation einer einzelnen Quelldefinition muss entweder das entsprechende Backenddatum ändern oder eine konkrete Diagnose auslösen; ein weiterhin unveränderter Output würde eine ungewollt aus dem Referenzvertrag kopierte Quelle aufdecken.

Der Zwei-Host-Spike kann die Machbarkeit und die Grenzen der beiden Architekturformen zeigen. Er deckt damit noch nicht sämtliche 122 Classic-AST-Knoten, Wiederholung mit typisierten Keys, allgemeine Bedingungen, Remoteprovenienz und Restore ab. Die vollständige Vergleichsmatrix aus dem Operatoraudit bleibt vor einer strategischen Syntaxfreigabe offen.

## Rückprüfung des implementierten Vergleichs

Die konkrete Implementierung wurde nach den gezielten Korrekturen erneut mit **13 unabhängigen Gegen- und Positivproben unter Node 24.18.0** geprüft. TypeScript-Unterdrückungen, zusätzliche Triple-Slash-Eingänge einschließlich `types`, `lib` und `no-default-lib`, fremde JSX-Deklarationsquellen und verschachtelte Zugriffe durch einen Stringinput werden abgewiesen. Auch ein fehlender oder numerischer tatsächlicher Headerpfad kann sich nicht mehr auf die handgeschriebenen Modeltypen berufen: Die Sidecarprüfung meldet `EX_VIEW_BINDING`. Diese ursprünglich gefundenen Akzeptanzlücken sind im begrenzten Profil geschlossen.

Aliase sämtlicher erfasster Intrinsic-, Model-, Input-, Provider- und Headerimporte erhalten nachweislich dieselbe Backendsemantik. Ein TypeScript-Feldfehler aus `.rmtx` verweist auf die Originaldatei und die exakt betroffene Zeichenfolge. Die endlichen Deklarationen bleiben Fixturetypen; daraus folgt weiterhin kein allgemeiner Modeltypgenerator oder produktiver RMTX-Compiler.
