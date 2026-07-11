# CATFOODING WORKFLOW
Um die Anwendbarkeit von XTend-Technologien im realen Produktivbetrieb zu optimieren und eventuelle Kanten / Bugs / Verbesserungspotentiale so schnell wie möglich zu identifizieren und zu bedienen (Lessons Identified / Lessons Learned), wird das "Catfooding" Prinzip für alle XTend-nahen Produktflächen initiiert. Das Prinzip wird im Folgenden erläutert.

## Was ist Catfooding im XTend-Kontext?
Catfooding ist ein direktes Derivat des bekannten Softwareentwicklungsprinzips "Dogfooding". Im Gegensatz zu diesem etablierten Standard, bei dem ein Projekt gezielt versucht, das Maximum an Anwendungsmöglichkeiten für selbstentwickelte Technologien zu finden und diese bestmöglich zu showcasen, setzt Catfooding einen anderen Fokus: Nicht nur sollen eigenentwickelte Technologien wo immer möglich zu Einsatz kommen, sondern jede daraus resultierende Lesson Identified soll zu einer Upstream-Entscheidung führen: Ist das zu lösende Problem ein Kandidat für ein Framework-natives Feature? Sofern die Antwort "Ja" lautet, ist eine Insellösung nicht gestattet und eine Upstream-Implementierung muss stattfinden.

## Regeln und Grenzen
1. Jede bordeigene Technologie in XTend muss bei XTend-nahen Produktprojekten bevorzugt als Kandidat berücksichtigt werden. Beispiele hierfür sind:
    a) Grundsätzlich wird der RMT-Kernel für die UI-Orchestrierung genutzt.
    b) Außer Fabric sind keine improvisierten Renderer in XTend-eigenen Produkten erlaubt.
    c) Runtimes sollen zunächst die RMT-nahen Strukturen wie die AppRuntime sowie XCommand anwenden. Das Registrieren von ungetrackten Framework-externen Dom Listenern ist nicht erlaubt.
2. Es gilt ein strenges Monkeypatching-Verbot in allen XTend-nahen Produkten. InnerHTML-Injektionen oder sonstige Dom-Manipulationen durch Inline-JS oder unklare Framework-externe Strukturen sind in XTend-Produkten verboten.
3. Externe Frameworks wie react.js, vue.js, THREE.js etc. sind in XTend-Produkten ausdrücklich erlaubt, aber nur in der jeweils zugehörigen XTension. Ein ungetracktes oder globales Implementieren von Dritt-Frameworks ist regelwidrig.
4. Catfooding bedeutet, dass jede zweckdienliche Technologie aus dem XTend-Stack angewendet wird. Catfooding bedeutet nicht, dass unnötige Komplexität eingetragen wird oder dass unbenötigter Ballast in den Code gebracht wird. Es gilt ein strenges Treeshaking-Gebot in allen Maraca-Bundles: Der normale Maraca Compiler Workflow mit rollup.js und terser.js ist anzuwenden.
5. Um die Performance von XTend-Produkten mit Maraca-Orchestrierung zu maximieren, ist die Tuning-Optimierung mit "xt maraca tune" zu fahren. 
6. Browsertests sind grundsätzlich über den XTend Browser Hypervisor zu fahren, um einzelne Dependencies an bestimmten Browsern oder Systemen zu verhindern.

## Warum wird dieses Prinzip angewendet?
1. Testbarkeit und Upsteam-Lessons: Alles, was aus XTend-Produkten gelernt werden kann, soll sofort in die Upstream-Entwicklung zurückfließen.
2. Showcasing und Marketing: XTend-Produkte sollen die Vorzüge und technischen Qualitäten von XTend RMT hervorheben.
3. Testbarkeit und Telemetry First: Alle XTend-Produkte müssen gute Kompatibilität mit der XTend Dev Surface aufweisen.