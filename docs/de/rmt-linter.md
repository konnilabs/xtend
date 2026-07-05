# RMT Linter

Diagnostik, JSON-Ausgabe und Agent Repair Reports für RMT Quellen.

## Worum es geht

RMT Linter beschreibt die öffentliche RMT-Oberfläche dieser Seite: welche Records betroffen sind, welche Adapter sie ausüben und welche Scheduler-Signale ein Host prüfen sollte.

## Öffentliche Bausteine

- `xt rmt lint app.rmt`.
- `--json` für Tools.
- `--agent` für Repair Reports.
## CLI

```bash
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
xt rmt lint app.rmt --fail-on warning
node scripts/run_xtend_tests.js rmt-language-regression --json
```

Der Agent Report enthält `repairPlan`, `fixOrder`, `relatedDiagnostics`, erklärte `No-Op` Einträge und Diagnostiken wie `rmt.document.extension.fallback-used`. Das öffentliche Schema ist `xtend.rmt.tooling-docs.v1`; Reports können `xtend.rmt.linter.report.v1` und `xtend.rmt.ai-agent-repair-report.v1`.

AnimationEngine-Diagnosen decken unbekannte Effekte, ungültige `interrupt`- oder `reducedMotion`-Policies, fehlende `layoutKey` bei `shared-element`/`layout-flip`, unsichere Keyframe-Properties und fehlendes Filter-Opt-in bei `fade-blur` ab. Code Actions können unsichere Enum-Werte auf sichere Defaults setzen und fehlende Motion-Policy-Felder ergänzen, wenn die Diagnose auf einen konkreten Record zeigt.

## Empfohlener Ablauf

Beginne bei RMT Linter mit dem kleinsten Record-Beispiel, prüfe es mit dem Linter und binde erst danach Adapter für Host-Daten, Routing oder Komponenten an.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Reference](./rmt-reference.md)
- [RMT Language Server](./rmt-language-server.md)

## Öffentlicher Vertrag

RMT Linter ist der öffentliche RMT Runtime-Vertrag für `docs/de/rmt-linter.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: RMT Records, Compiler-Ausgaben, Runtime-Adapter, Events, Actions und Scheduler-Lanes.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/rmt-linter.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Namen:
- `docs/de/rmt-linter.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`
- `xt rmt lint app.rmt`

Befehle:
- `xt rmt lint app.rmt`
- `xt rmt lint app.rmt --json`
- `xt rmt lint app.rmt --agent`
- `xt rmt lint app.rmt --fail-on warning`

## Minimaler Prüfpfad

Führe diese Prüfung aus, wenn der Artikel, ein Beispiel oder die genannte öffentliche Oberfläche geändert wird:

```bash
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
xt rmt lint app.rmt --fail-on warning
```

- Erwartetes Signal: Der Befehl muss ohne Linkfehler, ohne bekannte Boilerplate und mit konkreten Ankern im Artikel abschließen.
- Quellen: Wenn Source und Artikel voneinander abweichen, ist die Source maßgeblich; aktualisiere danach beide Locales mit identischen Codeblöcken.

## Spezifische Fehlerbilder

- Wenn Runtime-Verhalten anders wirkt, trenne Compiler-Record, Host-Adapter und Scheduler-Signal, bevor du die Doku änderst.
- Wenn ein Link aus diesem Artikel bricht, repariere den lokalen Markdown-Zielpfad und prüfe danach `node scripts/verify_docs_public_quality.js`.
- Wenn ein Beispiel kopiert wird, müssen Dateipfade, Record-Namen und Commands aus diesem Abschnitt unverändert startfähig bleiben.
