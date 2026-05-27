# SurfaceManager Controller

Der Controller verwaltet Surface-Status, Fokus, Layering und Diagnostik.

## Worum es geht

SurfaceManager bündelt Fenster, Panels, Overlays und Remote-Bereiche in einer kontrollierten Runtime. Dadurch bleiben Fokus, Layering, Persistenz und Cleanup nachvollziehbar.

## Öffentliche Bausteine

- Surface IDs und Controller Records.
- Fenster, Panels, Portals und Overlays.
- Fokus-, Layer- und Cleanup-Regeln.

## Empfohlener Ablauf

Vergib stabile Surface IDs, öffne und schließe Surfaces über den Controller und prüfe Fokus, Escape-Verhalten sowie Persistenz in Browser-Fixtures.

## Nächste Schritte

- [SurfaceManager](./surface-manager-authoring-guide.md)
- [SurfaceManager Runtime](./surface-manager-runtime.md)

## Öffentlicher Vertrag

SurfaceManager Controller ist der öffentliche Surface-Integration-Vertrag für `docs/de/surface-manager-controller.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: Surface Records, Controller, Portale, Fenster, Ownership und Routing-Grenzen.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/surface-manager-controller.md`
- `docs/menu.json`
- `package.json`
- `components/xsurfacemanager.js`
- `components/xsurfacewindow.js`
- `components/xsurfaceportal.js`
- `src/components/x-surface-manager/x-surface-manager.ts`
- `src/components/x-surface-manager/surface-controller.ts`

Namen:
- `docs/de/surface-manager-controller.md`
- `docs/menu.json`
- `components/xsurfacemanager.js`
- `components/xsurfacewindow.js`
- `components/xsurfaceportal.js`
- `src/components/x-surface-manager/x-surface-manager.ts`
- `src/components/x-surface-manager/surface-controller.ts`
- `docs/dev-router.php`
- `package.json`
- `x-surface-manager`

Befehle:
- `node scripts/run_xtend_tests.js components catalog-coverage --json`
- `node scripts/run_xtend_tests.js surface-manager-performance surface-manager-visual --json`
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json`

## Minimaler Prüfpfad

Führe diese Prüfung aus, wenn der Artikel, ein Beispiel oder die genannte öffentliche Oberfläche geändert wird:

```bash
node scripts/run_xtend_tests.js components catalog-coverage --json
node scripts/run_xtend_tests.js surface-manager-performance surface-manager-visual --json
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json
```

- Erwartetes Signal: Der Befehl muss ohne Linkfehler, ohne bekannte Boilerplate und mit konkreten Ankern im Artikel abschließen.
- Quellen: Wenn Source und Artikel voneinander abweichen, ist die Source maßgeblich; aktualisiere danach beide Locales mit identischen Codeblöcken.

## Spezifische Fehlerbilder

- Wenn eine Surface fehlt, prüfe Ownership, Portal, Window-Record und Router-Bindung in dieser Reihenfolge.
- Wenn ein Link aus diesem Artikel bricht, repariere den lokalen Markdown-Zielpfad und prüfe danach `node scripts/verify_docs_public_quality.js`.
- Wenn ein Beispiel kopiert wird, müssen Dateipfade, Record-Namen und Commands aus diesem Abschnitt unverändert startfähig bleiben.
