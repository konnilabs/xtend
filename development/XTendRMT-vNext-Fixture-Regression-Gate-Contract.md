# XTend RMT vNext Fixture Regression Gate Contract

- Schema: `xtend.rmt.vnext-regression-gate.v1`
- Report Schema: `xtend.rmt.vnext-regression-report.v1`
- Fixture Matrix Schema: `xtend.rmt.vnext-fixture-matrix.v1`
- Golden Report Schema: `xtend.rmt.vnext-golden-report.v1`
- Fuzz Report Schema: `xtend.rmt.vnext-fuzz-report.v1`
- Browser Smoke Schema: `xtend.rmt.vnext-browser-smoke.v1`
- Workpackage: `WP-E15-17`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-regression --json`

## Ziel

Dieser Contract fixiert die Regressionsebene fuer RMT vNext nach Parser, Compiler, Semantikmodulen, Tooling und Migration. Er verbindet positive und negative Fixtures, Core-Golden-Hashes, deterministisches Parser-Fuzzing und eine browsernahe Referenzprobe.

## Fixture Matrix

Die Matrix liegt unter `tests/rmt-language/fixtures/vnext-fixture-matrix.json`.

- Positive Fixtures decken Minimal-, Complex-, Lifecycle-, Scheduler-, Surface-, Condition-, Composition-, Event-, Security- und Streaming-Syntax ab.
- Negative Fixtures halten verbotene Sprachfeatures fest: Funktionsaufrufe in Conditions, imperative Keywords und Top-Level-Lifecycle-Operationen.
- Jede positive Fixture besitzt einen SHA-256 Golden Hash der kompilierten Core-JSON-Ausgabe und erwartete Domain-Counts.

## Golden Output

Golden Tests pruefen nicht nur, ob der Compiler erfolgreich ist, sondern ob die Core-Ausgabe byte-stabil bleibt.

Eine beabsichtigte Core-Aenderung muss daher die Matrix bewusst aktualisieren:

- `expected.coreSha256`
- `expected.domainCounts`
- relevante Contract- oder WP-Dokumente

## Parser Fuzzing

Das Fuzzing ist deterministisch und offline. Jede konfigurierte Seed-Fixture wird mit den gleichen Mutationen getestet:

- letzte schliessende Klammer entfernen
- imperatives Keyword injizieren
- Funktionsaufruf in Condition injizieren
- nicht beendeten String injizieren
- unbekanntes Top-Level-Token injizieren

Erfolg bedeutet nicht, dass der Parser die Mutanten akzeptiert. Erfolg bedeutet: kein Throw, reproduzierbare Diagnostics, Ranges vorhanden.

## Browsernahe Referenzprobe

Die Referenzprobe liegt unter `tests/browser/fixtures/rmt-vnext-reference-smoke.html` und exponiert `window.__xtendRmtVNextSmokeResult`.

Sie prueft browsernah die fuenf vNext-Runtime-Flanken:

- Surface: Root Surface sichtbar
- Lifecycle: Hydrate-Operation vorhanden
- Scheduler: gewichtete Lane vorhanden
- Security: Trust Boundary und Sanitizing vorhanden
- Streaming: Stream-Operation und Data Source vorhanden

Die lokale Gate-Suite fuehrt keine externe Browser-Automation voraus. Der bestehende Browser-Smoke-Harness kennt die Fixture, sodass sie bei optionalem Browser-Driver mitlaufen kann.

## Package Surface

Das Package exportiert `./rmt-language/vnext-regression` mit:

- `createFixtureMatrixReport`
- `createGoldenCompilerReport`
- `createNegativeFixtureReport`
- `createParserFuzzReport`
- `createBrowserSmokeProbe`
- `createBrowserReferenceReport`
- `createRmtVNextRegressionReport`
- `createRmtVNextRegressionAdapter`
