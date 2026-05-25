# Visual Browser Regression

Browsernahe Regressionen mit stabilen Fixtures und Screenshots erkennen.

## Worum es geht

Diese Seite beschreibt prüfbare Regeln für robuste Nutzererlebnisse. Die Empfehlungen passen zu lokalen Hosts, RMT App Shells und klassischen Web-Component-Seiten.

## Öffentliche Bausteine

- Lokale Testbefehle.
- Browsernahe Fixtures.
- Dokumentierte Akzeptanzkriterien.
- Docs-Vertrag `xtend.docs.visual-browser-regression.v1`.
- Regression-Priority-Vertrag `xtend.catalog.component-regression-priority-plan.v1`.
- Gate `node scripts/run_xtend_tests.js regression-priority --json`.
- Viewports `desktop-1280`, `tablet-768` und `mobile-390`.

## Empfohlener Ablauf

Lege Budgets fest, prüfe Tastatur- und Screenreader-Signale und halte Screenshots reproduzierbar.

## Nächste Schritte

- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
- [A11y Keyboard Smokes](./a11y-keyboard-smokes.md)

## Entwicklerkontext

Dieser erweiterte Abschnitt macht aus Visual Browser Regression einen praktischen Qualitäts- und Sicherheitsleitfaden für Drittanbieter. Lies ihn als öffentlichen Vertrag rund um das Thema: Er erklärt, warum die Seite existiert, welche Repository-Oberflächen sie stützen, wie ein Host sie integrieren sollte und wo du nachsiehst, wenn sich das Verhalten nicht wie erwartet zeigt. Die Struktur folgt etablierten Entwicklerdokumentationen: kurzer Kontext, wiederholbarer Integrationspfad, konkretes Beispiel, Referenz-Checkliste und Fehlerbehebung.

Nutze diese Seite, wenn du eine Implementierungsentscheidung treffen musst, ohne internes Projektwissen vorauszusetzen. Die Seite soll drei Fragen schnell beantworten: Was ist stabil, was muss der Host konfigurieren, und welche lokale Prüfung beweist, dass die Integration weiterhin funktioniert. Sie führt kein neues Runtime-Verhalten ein, sondern dokumentiert Verträge, die bereits in Source, Package-Metadaten, Fixtures, Tests und lokalisierter Dokumentation vorhanden sind.

## Source of Truth

Der Inhalt stützt sich auf diese Repository-Oberflächen:

- `docs/de/visual-browser-regression.md`
- `docs/menu.json`
- `package.json`
- `scripts/verify_docs_public_quality.js`
- `scripts/verify_docs_content_depth.js`
- `security/manifest-import-policy.js`
- `security/trusted-dom-policy.js`
- `security/supply-chain-gate-policy.js`

Behandle diese Dateien als Autorität, wenn du ein Detail verifizieren musst. Dokumentationsbeispiele sollten kleiner als Produktionscode bleiben, aber echte Pfade, echte Befehle und Namen verwenden, die im Paket existieren. Wenn Implementierung und diese Seite voneinander abweichen, prüfe zuerst die genannten Quellen und aktualisiere den Artikel erst, wenn der öffentliche Vertrag klar ist.

## Integrationspfad

Beginne mit dem kleinsten lokalen Host, der das Thema ausüben kann. Halte Manifest, Loader, RMT Dokument oder Qualitätsskript lokal in der Anwendung, damit Browser-Sicherheitsrichtlinie, Import-Auflösung und Scheduling-Entscheidungen während der Entwicklung sichtbar bleiben. Füge produktbezogene Wrapper erst hinzu, wenn der einfache XTend Pfad funktioniert, weil Wrapper fehlende Attribute, veraltete Routen oder falsche Scheduling-Annahmen verdecken können.

Für Drittanbieter ist die praktische Reihenfolge: Konzept lesen, minimales Beispiel kopieren, passende lokale Prüfung ausführen und erst danach Host-Daten oder Styling ergänzen. Verlasse dich nicht auf interne Verzeichnisnamen, erzeugte DOM-Knoten oder undokumentierte State Records. Stabile Integrationspunkte sind Package Exports, dokumentierte Dateien, Web-Component-Attribute und Events, RMT Records, öffentliche Skripte und die lokalisierten Docs-Routen.

## Beispiel und Prüfung

Nützliche lokale Prüfungen, bevor du eine Änderung veröffentlichst, die von dieser Seite abhängt:

```bash
node scripts/verify_docs_public_quality.js
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json
```

Das Beispiel ist bewusst klein. Es soll beweisen, dass die öffentliche Oberfläche erreichbar ist, nicht eine vollständige Anwendung modellieren. Für produktive Arbeit bleibt die Reihenfolge gleich: lokale Quelle konfigurieren, kleinste Prüfung ausführen, dann mit echten Host-Daten erweitern. Wenn der Befehl JSON erzeugt, hänge die Zusammenfassung an den Implementierungsreview, damit Reviewer dasselbe Signal sehen können, ohne das komplette lokale Setup nachzustellen.

## Referenz-Checkliste

- Bestimme die zuständige Oberfläche, bevor du eine Host-Integration änderst: Loader, Manifest, RMT Compiler, Fabric Scheduler, Surface Manager, Accessibility Policy oder Security Gate.
- Halte DE- und EN-Artikel deckungsgleich. Codeblöcke bleiben zwischen den Locales identisch, damit Copy-Paste-Verhalten nicht von der Sprache abhängt.
- Bevorzuge dokumentierte Attribute, Package Exports, Skripte und lokale Markdown-Routen gegenüber privaten Runtime-Interna.
- Bewahre vorhandene lokale Links und halte Beispiele kurz genug, dass Nutzer sie anpassen können, ohne den Großteil des Snippets zu löschen.
- Wenn eine Seite Validierung, Sicherheit oder Performance beschreibt, nenne den Befehl, der die Aussage lokal belegt.

## Fehlerbehebung

Wenn die Seite weiterhin zu abstrakt wirkt, fehlt meist ein konkretes Substantiv: Dateipfad, Befehl, Component Tag, RMT Record, Manifest-Key oder Event-Name. Ergänze dieses Substantiv, bevor du mehr Fließtext hinzufügst. Wenn eine Browser-Seite scheitert, prüfe zuerst, ob der lokale Server aus dem Repository-Root mit `docs/dev-router.php` gestartet wurde; sonst lösen Root-Assets wie `/xtend.css`, `/xtend-loader.js` und `/fabric/xtend-fabric.js` nicht auf. Wenn ein Befehl nach einer reinen Dokumentationsänderung scheitert, korrigiere bevorzugt das Beispiel oder die dokumentierte Quelle, statt das Gate abzuschwächen.

## Pflegehinweise

Dieser Abschnitt wird aus dem Guide-Inventar erzeugt und kann sicher aktualisiert werden. Handgeschriebener Kontext bleibt oberhalb, wenn eine Seite eine narrative Einordnung braucht; die generierte Tiefe bleibt darunter als wiederholbare Entwickler-Checkliste. Eine Seite gilt nicht mehr als Stub, wenn beide Locales über der Nicht-Code-Zeichenschwelle bleiben, mindestens vier sinnvolle H2-Abschnitte enthalten und die öffentlichen Docs-Qualitätschecks bestehen.
