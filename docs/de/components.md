# Komponenten-Entwicklung

XTend Web Components als stabile UI-Bausteine für HTML und RMT Hosts.

## Worum es geht

XTend Komponenten sind Custom Elements mit stabilen Attributen, Events, Slots und CSS Parts. Sie können direkt in HTML oder über RMT Descriptoren verwendet werden.

## Öffentliche Bausteine

- Custom Elements.
- Attribute, Events, Slots und CSS Parts.
- RMT Component Descriptoren.

## Empfohlener Ablauf

Nutze Komponenten direkt in HTML für einfache Hosts. Wenn eine App wächst, lass RMT Descriptoren die Komponenten materialisieren und halte Events typisiert.

## Nächste Schritte

- [Public Component Types](./public-component-types.md)
- [TypeScript Components](./typescript-components.md)

## Öffentlicher Vertrag

Komponenten-Entwicklung ist der öffentliche Referenz-Vertrag für `docs/de/components.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: öffentliche Dateien, Package Exports, Manifest-Keys, Attribute und Host-Verdrahtung.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/components.md`
- `docs/menu.json`
- `package.json`
- `components/manifest.json`
- `xtend-loader.js`
- `api.js`
- `api.d.ts`
- `design-tokens/xtend-design-tokens.js`

Namen:
- `docs/de/components.md`
- `docs/menu.json`
- `components/manifest.json`
- `design-tokens/xtend-design-tokens.js`
- `docs/dev-router.php`
- `package.json`
- `xtend-loader.js`
- `api.js`
- `api.d.ts`
- `x-theme`

Befehle:
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json`

## Minimaler Prüfpfad

Führe diese Prüfung aus, wenn der Artikel, ein Beispiel oder die genannte öffentliche Oberfläche geändert wird:

```bash
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json
```

- Erwartetes Signal: Der Befehl muss ohne Linkfehler, ohne bekannte Boilerplate und mit konkreten Ankern im Artikel abschließen.
- Quellen: Wenn Source und Artikel voneinander abweichen, ist die Source maßgeblich; aktualisiere danach beide Locales mit identischen Codeblöcken.

## Spezifische Fehlerbilder

- Wenn ein Host nichts lädt, prüfe Manifest-Pfad, Export-Name, Attribut-Schreibweise und ob die Datei lokal erreichbar ist.
- Wenn ein Link aus diesem Artikel bricht, repariere den lokalen Markdown-Zielpfad und prüfe danach `node scripts/verify_docs_public_quality.js`.
- Wenn ein Beispiel kopiert wird, müssen Dateipfade, Record-Namen und Commands aus diesem Abschnitt unverändert startfähig bleiben.
