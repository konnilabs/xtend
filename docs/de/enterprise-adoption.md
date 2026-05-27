# Enterprise Adoption

Ein externer Einführungspfad für Teams, die XTend in bestehenden Web-Produkten einsetzen.

## Worum es geht

Dieser Artikel ist für Entwickler geschrieben, die XTend ohne internes Vorwissen produktiv einsetzen wollen.

## Öffentliche Bausteine

- Lokale Entwicklung ohne CDN.
- Bilinguale Dokumentation.
- Stabile öffentliche Einstiegspunkte.
- Release-Nachweise über den Package Export Lock, die Akzeptanzseite, die Netzwerk-Evidenz und den Pack Dry Run.

```txt
package evidence: xtend.epic13.package-export-lock.v1
owner evidence: xtend.epic13.release-owner-acceptance.v1
network evidence: xtend.epic13.conditional-network-evidence.v1
network docs: ./conditional-network-evidence.md
network mode: network-restricted-local-default
owner docs: ./release-owner-acceptance.md
package docs: ./package-export-lock.md
previous release bridge: Epic 12 RC0 Handoff
automatic-publish-approval
pack:dry-run:report
```

## Empfohlener Ablauf

Lies den Überblick, kopiere das kleinste passende Beispiel und erweitere erst danach um Host-spezifische Details.

## Nächste Schritte

- [Quick Start](./quick-start-guide.md)
- [Über XTend](./about.md)

## Öffentlicher Vertrag

Enterprise Adoption ist der öffentliche Orientierung-Vertrag für `docs/de/enterprise-adoption.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: Einstiegsrouten, lokale Docs-Navigation und die kleinsten lauffähigen Befehle.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/enterprise-adoption.md`
- `docs/menu.json`
- `package.json`
- `README.md`
- `docs/de/quick-start-guide.md`
- `docs/en/quick-start-guide.md`
- `components/manifest.json`
- `xtend-loader.js`

Namen:
- `docs/de/enterprise-adoption.md`
- `docs/menu.json`
- `docs/de/quick-start-guide.md`
- `docs/en/quick-start-guide.md`
- `components/manifest.json`
- `docs/dev-router.php`
- `package.json`
- `README.md`
- `xtend-loader.js`

Befehle:
- `node scripts/verify_docs_public_quality.js`
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json`

## Minimaler Prüfpfad

Führe diese Prüfung aus, wenn der Artikel, ein Beispiel oder die genannte öffentliche Oberfläche geändert wird:

```bash
node scripts/verify_docs_public_quality.js
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json
```

- Erwartetes Signal: Der Befehl muss ohne Linkfehler, ohne bekannte Boilerplate und mit konkreten Ankern im Artikel abschließen.
- Quellen: Wenn Source und Artikel voneinander abweichen, ist die Source maßgeblich; aktualisiere danach beide Locales mit identischen Codeblöcken.

## Spezifische Fehlerbilder

- Wenn Einstiegspfade auseinanderlaufen, prüfe zuerst `docs/menu.json`, die lokalen Links und den Befehl im Prüfblock.
- Wenn ein Link aus diesem Artikel bricht, repariere den lokalen Markdown-Zielpfad und prüfe danach `node scripts/verify_docs_public_quality.js`.
- Wenn ein Beispiel kopiert wird, müssen Dateipfade, Record-Namen und Commands aus diesem Abschnitt unverändert startfähig bleiben.
