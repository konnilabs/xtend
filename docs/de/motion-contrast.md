# Motion und Contrast

Reduced Motion, Kontrast und nicht-farbige Statushinweise berücksichtigen.

## Worum es geht

Diese Seite beschreibt prüfbare Regeln für robuste Nutzererlebnisse. Die Empfehlungen passen zu lokalen Hosts, RMT App Shells und klassischen Web-Component-Seiten.

## Öffentliche Bausteine

- Lokale Testbefehle.
- Browsernahe Fixtures.
- Dokumentierte Akzeptanzkriterien.

## Empfohlener Ablauf

Lege Budgets fest, prüfe Tastatur- und Screenreader-Signale und halte Screenshots reproduzierbar.

## Nächste Schritte

- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
- [A11y Keyboard Smokes](./a11y-keyboard-smokes.md)

## Öffentlicher Vertrag

Motion und Contrast ist der öffentliche Qualität und Security-Vertrag für `docs/de/motion-contrast.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: lokale Gates, Policy-Dateien, Report-Schemas, Accessibility- und Security-Signale.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/motion-contrast.md`
- `docs/menu.json`
- `package.json`
- `scripts/verify_docs_public_quality.js`
- `scripts/verify_docs_content_depth.js`
- `security/manifest-import-policy.js`
- `security/trusted-dom-policy.js`
- `security/supply-chain-gate-policy.js`

Namen:
- `docs/de/motion-contrast.md`
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
