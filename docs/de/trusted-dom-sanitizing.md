# Trusted DOM und Sanitizing

Sichere DOM-Grenzen für Markdown, Descriptoren und Host-Inhalte.

## Worum es geht

Security in XTend beginnt mit expliziten Grenzen: lokale Module, vertrauensarme Inhalte, klare Sanitizing-Pfade und reproduzierbare Paketprüfungen.

## Öffentliche Bausteine

- Same-origin Module.
- Sanitizing für unsichere Inhalte.
- Reproduzierbare Paketprüfungen.

## Empfohlener Ablauf

Erlaube nur lokale Module, behandle Markdown und HTML-Fragmente als unsicher und dokumentiere jede Host-Ausnahme ausdrücklich.

## Nächste Schritte

- [Manifest Import Policy](./manifest-import-policy.md)
- [Supply Chain Checks](./supply-chain-gates.md)

## Öffentlicher Vertrag

Trusted DOM und Sanitizing ist der öffentliche Qualität und Security-Vertrag für `docs/de/trusted-dom-sanitizing.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: lokale Gates, Policy-Dateien, Report-Schemas, Accessibility- und Security-Signale.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/trusted-dom-sanitizing.md`
- `docs/menu.json`
- `package.json`
- `scripts/verify_docs_public_quality.js`
- `scripts/verify_docs_content_depth.js`
- `security/manifest-import-policy.js`
- `security/trusted-dom-policy.js`
- `security/supply-chain-gate-policy.js`

Namen:
- `docs/de/trusted-dom-sanitizing.md`
- `docs/menu.json`
- `scripts/verify_docs_public_quality.js`
- `scripts/verify_docs_content_depth.js`
- `security/manifest-import-policy.js`
- `security/trusted-dom-policy.js`
- `security/supply-chain-gate-policy.js`
- `docs/dev-router.php`
- `package.json`
- `node scripts/verify_docs_public_quality.js`

Befehle:
- `node scripts/verify_docs_public_quality.js`
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json`

## Minimaler Prüfpfad

Führe diese Prüfung aus, wenn der Artikel, ein Beispiel oder die genannte öffentliche Oberfläche geändert wird:

```bash
node scripts/verify_docs_public_quality.js
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json
```

- Erwartetes Signal: Der Befehl muss ohne Linkfehler, ohne bekannte Boilerplate und mit konkreten Ankern im Artikel abschließen.
- Quellen: Wenn Source und Artikel voneinander abweichen, ist die Source maßgeblich; aktualisiere danach beide Locales mit identischen Codeblöcken.

## Spezifische Fehlerbilder

- Wenn ein Gate scheitert, ändere zuerst Beispiel, Policy-Quelle oder Report-Erwartung und nicht die Schwelle.
- Wenn ein Link aus diesem Artikel bricht, repariere den lokalen Markdown-Zielpfad und prüfe danach `node scripts/verify_docs_public_quality.js`.
- Wenn ein Beispiel kopiert wird, müssen Dateipfade, Record-Namen und Commands aus diesem Abschnitt unverändert startfähig bleiben.
