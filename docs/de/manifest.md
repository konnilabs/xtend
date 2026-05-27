# Manifest

Das Komponentenmanifest beschreibt, welche XTend Module ein Host laden darf.

## Worum es geht

Manifest beschreibt den Core-Pfad über lokale Module, öffentliche TypeScript-Oberflächen und überprüfbare Host-Verdrahtung.

## Öffentliche Bausteine

- `components/manifest.json` als lokale Registry.
- `data-manifest` am Loader.
- `meta name="xtend-preload"` für kritische Komponenten.

## Empfohlener Ablauf

Lies den Überblick, kopiere das kleinste passende Beispiel und erweitere erst danach um Host-spezifische Details.

## Nächste Schritte

- [API](./api.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)

## Öffentlicher Vertrag

Manifest ist der öffentliche Referenz-Vertrag für `docs/de/manifest.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: öffentliche Dateien, Package Exports, Manifest-Keys, Attribute und Host-Verdrahtung.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/manifest.md`
- `docs/menu.json`
- `package.json`
- `components/manifest.json`
- `xtend-loader.js`
- `api.js`
- `api.d.ts`
- `design-tokens/xtend-design-tokens.js`

Namen:
- `components/manifest.json`
- `docs/de/manifest.md`
- `docs/menu.json`
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
