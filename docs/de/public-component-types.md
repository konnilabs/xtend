# Public Component Types

TypeScript-Oberflächen für Attribute, Events und Component Contracts.

## Worum es geht

Die Core-Schicht hält Hosts bewusst einfach: ein Loader, ein Manifest, öffentliche TypeScript-Oberflächen und lokale Module statt CDN-Abhängigkeiten.
Diese Seite ist die öffentliche Orientierung für Teams, die XTend aus TypeScript, Lit, React-Wrappern oder klassischen Web-Component-Hosts verwenden.

```txt
docs contract: xtend.docs.public-component-types.v1
type contract: xtend.enterprise.er-wp-34.public-component-types.v1
shared helper: components/xtend-public-types.d.ts
local gate: npm run test:component-public-types
runner id: component-public-types
```

## Öffentliche Bausteine

- Component `.d.ts` Dateien neben dem jeweiligen Runtime-Modul.
- Gemeinsame Hilfstypen aus `components/xtend-public-types.d.ts`.
- Typisierte Event-Detail-Maps für ausgesendete DOM-Events.
- Attribute und Property-Kontrakte, die Wrapper durchreichen sollten.

Nutze zuerst die komponentennahe Deklaration und erst danach die gemeinsamen Hilfstypen, wenn ein Host generisches Event- oder Metadata-Handling braucht. Utility-Module wie `x-utils` stellen eine exportierte API bereit, während visuelle Komponenten HTMLElement-kompatible Typen liefern.

## Empfohlener Ablauf

Lies die Deklaration neben der Component Source, importiere den passenden Event-Detail-Typ und halte Wrapper an den dokumentierten Attributen, Events und Methoden ausgerichtet. Führe `npm run test:component-public-types` aus, bevor eine Host-Integration veröffentlicht wird, damit fehlende Deklarationen nicht erst in Beispielen oder Doku auffallen.

```ts
import type { XButtonElement, XButtonClickDetail } from '../components/xbutton';

const button = document.querySelector<XButtonElement>('x-button');
button?.addEventListener('x-button-click', (event: CustomEvent<XButtonClickDetail>) => {
  console.log(event.detail.variant);
});
```

## Fehlerbehebung

- Wenn TypeScript einen Component-Typ nicht findet, prüfe die sibling `.d.ts` Datei und den Package Export auf das lokale Modul.
- Wenn ein Event Detail als `unknown` erscheint, nutze die komponentenspezifische Event Map oder den gemeinsamen Helper aus `components/xtend-public-types.d.ts`.
- Wenn ein Wrapper Attribute verdeckt, spiegle die öffentlichen HTML-Attributnamen statt privater Prop-Namen.

## Nächste Schritte

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)

## Entwicklerkontext

Dieser erweiterte Abschnitt macht aus Public Component Types einen praktischen Referenzleitfaden für Drittanbieter. Lies ihn als öffentlichen Vertrag rund um das Thema: Er erklärt, warum die Seite existiert, welche Repository-Oberflächen sie stützen, wie ein Host sie integrieren sollte und wo du nachsiehst, wenn sich das Verhalten nicht wie erwartet zeigt. Die Struktur folgt etablierten Entwicklerdokumentationen: kurzer Kontext, wiederholbarer Integrationspfad, konkretes Beispiel, Referenz-Checkliste und Fehlerbehebung.

Nutze diese Seite, wenn du eine Implementierungsentscheidung treffen musst, ohne internes Projektwissen vorauszusetzen. Die Seite soll drei Fragen schnell beantworten: Was ist stabil, was muss der Host konfigurieren, und welche lokale Prüfung beweist, dass die Integration weiterhin funktioniert. Sie führt kein neues Runtime-Verhalten ein, sondern dokumentiert Verträge, die bereits in Source, Package-Metadaten, Fixtures, Tests und lokalisierter Dokumentation vorhanden sind.

## Source of Truth

Der Inhalt stützt sich auf diese Repository-Oberflächen:

- `docs/de/public-component-types.md`
- `docs/menu.json`
- `package.json`
- `components/manifest.json`
- `xtend-loader.js`
- `api.js`
- `api.d.ts`
- `design-tokens/xtend-design-tokens.js`

Behandle diese Dateien als Autorität, wenn du ein Detail verifizieren musst. Dokumentationsbeispiele sollten kleiner als Produktionscode bleiben, aber echte Pfade, echte Befehle und Namen verwenden, die im Paket existieren. Wenn Implementierung und diese Seite voneinander abweichen, prüfe zuerst die genannten Quellen und aktualisiere den Artikel erst, wenn der öffentliche Vertrag klar ist.

## Integrationspfad

Beginne mit dem kleinsten lokalen Host, der das Thema ausüben kann. Halte Manifest, Loader, RMT Dokument oder Qualitätsskript lokal in der Anwendung, damit Browser-Sicherheitsrichtlinie, Import-Auflösung und Scheduling-Entscheidungen während der Entwicklung sichtbar bleiben. Füge produktbezogene Wrapper erst hinzu, wenn der einfache XTend Pfad funktioniert, weil Wrapper fehlende Attribute, veraltete Routen oder falsche Scheduling-Annahmen verdecken können.

Für Drittanbieter ist die praktische Reihenfolge: Konzept lesen, minimales Beispiel kopieren, passende lokale Prüfung ausführen und erst danach Host-Daten oder Styling ergänzen. Verlasse dich nicht auf interne Verzeichnisnamen, erzeugte DOM-Knoten oder undokumentierte State Records. Stabile Integrationspunkte sind Package Exports, dokumentierte Dateien, Web-Component-Attribute und Events, RMT Records, öffentliche Skripte und die lokalisierten Docs-Routen.

## Beispiel und Prüfung

Minimale Host-Verdrahtung für lokale XTend Module:

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<meta name="xtend-preload" content="x-theme,x-router,x-button">
```

Das Snippet ist bewusst klein. Es beweist, dass die dokumentierte lokale Moduloberfläche erreichbar ist, ohne zuerst einen Framework-Wrapper einzubauen. Für produktive Arbeit bleibt die Reihenfolge gleich: lokale Quelle konfigurieren, kleinsten Host-Pfad prüfen, dann mit echten Host-Daten, Styling und produktspezifischer Komposition erweitern.

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
