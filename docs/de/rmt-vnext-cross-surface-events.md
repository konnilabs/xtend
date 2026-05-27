# RMT Cross Surface Events

Ereignisse zwischen Oberflächen ohne lose globale Event-Kopplung.

## Worum es geht

RMT Cross Surface Events beschreibt die öffentliche RMT-Oberfläche dieser Seite: welche Records betroffen sind, welche Adapter sie ausüben und welche Scheduler-Signale ein Host prüfen sollte.

## Öffentliche Bausteine

- `.rmt` Quellen.
- Core Records und Source Maps.
- Host Adapter für DOM, Router und Komponenten.

## Empfohlener Ablauf

Beginne bei RMT Cross Surface Events mit dem kleinsten Record-Beispiel, prüfe es mit dem Linter und binde erst danach Adapter für Host-Daten, Routing oder Komponenten an.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT vNext Remote Surfaces](./rmt-vnext-remote-surfaces.md)
- [RMT vNext Enterprise MFE Vertrag](./rmt-vnext-enterprise-mfe-handoff.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Event-Protokoll

Cross-Surface Events verwenden `xtend.rmt.vnext-cross-surface-event-protocol.v1`. Governance-Regeln, Owner, Versionen und erlaubte Zielbereiche werden über `xtend.rmt.vnext-event-governance-policy.v1` geprueft. Dadurch bleibt die Grenze klar: Surfaces duerfen einander signalisieren, aber es gibt `no implicit global Event Bus`.

Die Enterprise-Fixture verwendet zwei stabile Event-Namen:

- `checkout.cart.updated.v1`
- `user.session.changed.v1`

Diese Namen sind Teil des oeffentlichen Vertrags, weil Host-Adapter, Telemetrie und Regression-Gates sie wiederfinden müssen. Wenn ein Event umbenannt wird, müssen Fixture, Core Output, Governance-Policy und Browser-Smoke gemeinsam geaendert werden.

## Minimaler Event-Pfad

```rmt
event checkout.cart.updated.v1 {
  from surface checkout.cart
  to surface commerce.summary
  payload contract checkout.cart.payload.v1
}
```

Prüfe Event-Änderungen lokal:

```bash
node scripts/run_xtend_tests.js rmt-vnext-cross-surface-events rmt-vnext-event-governance --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
```

Wenn das Governance-Gate scheitert, korrigiere zuerst Owner, Payload Contract oder Ziel-Surface. Ein Host-seitiger Event-Bus darf den Fehler nicht verdecken.

## Öffentlicher Vertrag

RMT Cross Surface Events ist der öffentliche RMT Runtime-Vertrag für `docs/de/rmt-vnext-cross-surface-events.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: RMT Records, Compiler-Ausgaben, Runtime-Adapter, Events, Actions und Scheduler-Lanes.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/rmt-vnext-cross-surface-events.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Namen:
- `docs/de/rmt-vnext-cross-surface-events.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`
- `node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json`

Befehle:
- `node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json`
- `node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json`

## Minimaler Prüfpfad

Führe diese Prüfung aus, wenn der Artikel, ein Beispiel oder die genannte öffentliche Oberfläche geändert wird:

```bash
node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json
node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json
```

- Erwartetes Signal: Der Befehl muss ohne Linkfehler, ohne bekannte Boilerplate und mit konkreten Ankern im Artikel abschließen.
- Quellen: Wenn Source und Artikel voneinander abweichen, ist die Source maßgeblich; aktualisiere danach beide Locales mit identischen Codeblöcken.

## Spezifische Fehlerbilder

- Wenn Runtime-Verhalten anders wirkt, trenne Compiler-Record, Host-Adapter und Scheduler-Signal, bevor du die Doku änderst.
- Wenn ein Link aus diesem Artikel bricht, repariere den lokalen Markdown-Zielpfad und prüfe danach `node scripts/verify_docs_public_quality.js`.
- Wenn ein Beispiel kopiert wird, müssen Dateipfade, Record-Namen und Commands aus diesem Abschnitt unverändert startfähig bleiben.
