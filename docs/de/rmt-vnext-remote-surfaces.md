# RMT Remote Surfaces

Remote UI-Bereiche sicher beschreiben, laden und degradieren.

## Worum es geht

RMT Remote Surfaces beschreibt die öffentliche RMT-Oberfläche dieser Seite: welche Records betroffen sind, welche Adapter sie ausüben und welche Scheduler-Signale ein Host prüfen sollte.

## Öffentliche Bausteine

- `.rmt` Quellen.
- Core Records und Source Maps.
- Host Adapter für DOM, Router und Komponenten.

## Empfohlener Ablauf

Beginne bei RMT Remote Surfaces mit dem kleinsten Record-Beispiel, prüfe es mit dem Linter und binde erst danach Adapter für Host-Daten, Routing oder Komponenten an.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT vNext Enterprise Surface Registry](./rmt-vnext-surface-registry-enterprise.md)
- [RMT vNext Enterprise MFE Vertrag](./rmt-vnext-enterprise-mfe-handoff.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Remote Surface Vertrag

Eine Remote Surface ist ein deklarierter Bereich, nicht die Ausfuehrung fremder Runtime im Kernel. Das Schema `xtend.rmt.vnext-remote-surface.v1` beschreibt die Surface selbst; `xtend.rmt.vnext-remote-surface-manifest.v1` beschreibt Version, Integrity, Fallback und Owner. Sicherheitsentscheidungen laufen über `xtend.rmt.vnext-remote-security-policy.v1`; Compiler-Normalisierung und Tooling verwenden `xtend.rmt.vnext-remote-compiler.v1`.

```rmt
remote surface checkout.cart from remote {
  owner commerce.checkout
  version "1.0.0"
  shellTarget "checkout"
  fallback surface checkout.cart.fallback
}
```

Der wichtigste Boundary-Satz lautet `no-remote-runtime-execution-in-rmt-kernel`. Der Kernel sieht Records, Policies, Schedules und Diagnostics; das Laden, Cachen oder Ausfuehren produktiver Remote-Bundles bleibt Host-Adapter-Logik.

## Architekturschichten

Remote-Surface-Architektur verwendet explizite Schichten, damit Hosts den passenden Orchestrierungspfad wählen können:

1. **XScaler Preflight** ist das statische Gate. Es akzeptiert oder verwirft den Surface-Plan anhand von Manifest-, Policy-, Integrity-, Fallback- und Host-Capability-Fakten, bevor Remote-Code läuft.
2. **XScaler ATC** startet erst nach akzeptierter Preflight-Response. ATC besitzt die Flight-Session, Client/Server-Kommunikation, die Übergabe in die Host-Runtime und Lifecycle-Orchestrierung wie Attach, Detach, Cancel, Fallback und Diagnostics.
3. **Maraca Runtime** läuft im Client. Sie nimmt den übergebenen Stream an, verarbeitet Runtime Records, führt deklarierte Actions aus, routet Events und materialisiert Surfaces über sichere DOM-Descriptor- oder Component-Renderer.
4. **XSurface Shard Server Layer** ist die serverseitige Remote-Surface-Orchestrierungsschicht. Sie kann Remote Surfaces nach Shards partitionieren, serverseitigen Lifecycle-State koordinieren, Stream-Fragmente veröffentlichen und ATC-kompatible Übergabesignale bereitstellen.
5. **Generische Server-Endpunkte** sind der Fallback-Pfad, wenn kein XSurface Shard Server und keine Remote Surface Orchestration verfügbar sind. Sie stellen normale Daten-, Action- oder SSR-Endpunkte bereit; der Client konsumiert sie als generische Ressourcen statt als orchestrierte Remote Surfaces.
6. **RMT Kernel/Fabric** wertet Policies aus, erzeugt Schedules, weist Lanes zu und emittiert Diagnostics. Es beobachtet Records und Orchestrierungssignale, aber die Invariante bleibt `no-remote-runtime-execution-in-rmt-kernel`: Private Remote-Ausführung gehört zu Host-Adaptern, Shard Servern oder generischen Endpunkten, niemals in den Kernel.

## Enterprise Fixture

Die pruefbare Enterprise-Strecke liegt in `xtendrmt/rmt-vnext-enterprise-mfe-demo.rmt`. Dieses Fixture kombiniert lokale Surfaces, eine Remote Surface, Degradation, Remote Security und Cross-Surface Events. Der Core-Output `xtendrmt/rmt-vnext-enterprise-mfe-demo.core.json` ist das Golden-Artefakt für Reviews; der Browser-Smoke `tests/browser/fixtures/rmt-vnext-enterprise-mfe-smoke.html` bleibt offline und darf weder `fetch(` noch dynamische Imports brauchen.

Fuehre diese Gates aus, wenn Remote-Surface-Records oder Manifest-Regeln geaendert werden:

```bash
node scripts/run_xtend_tests.js rmt-vnext-remote-manifest rmt-vnext-remote-security rmt-vnext-enterprise-fixtures --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
```

Ein gruenes Ergebnis bestaetigt, dass Remote-Surface-Records, Manifest-Schema, Sicherheitsregeln und Enterprise-Smoke-Artefakte zusammenpassen.

## Öffentlicher Vertrag

RMT Remote Surfaces ist der öffentliche RMT Runtime-Vertrag für `docs/de/rmt-vnext-remote-surfaces.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: RMT Records, Compiler-Ausgaben, Runtime-Adapter, Events, Actions und Scheduler-Lanes.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/rmt-vnext-remote-surfaces.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Namen:
- `docs/de/rmt-vnext-remote-surfaces.md`
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
