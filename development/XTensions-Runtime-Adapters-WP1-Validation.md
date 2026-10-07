# WP1 local validation / Lokale Prüfung

Stand: 2026-10-07. Branch: `codex/xtensions-runtime-wp1`. Main-Basis: `96e6d174218767c362bc5547561348e606692f10`. Review-Delta gegenüber `aa1699506263d6c1c3eb8c4ae9e8fb013db51435`. Kein Push, Issue, PR, Merge, Release oder Dependency-Update; private Referenz unverändert.

Historischer Bericht für `251b2ac`; die folgende P2-Korrektur, der aktuelle Mainvergleich und die neue Lizenzfreigabe sind im [P2-Nachweis](XTensions-Runtime-Adapters-WP1-P2-Validation.md) dokumentiert. Historical report: the P2 follow-up supersedes the earlier publication-rights restriction below, not these recorded test results.

## Ergebnis / Result

| Prüfung | Ergebnis |
| --- | --- |
| Finale Acceptance-Matrix | 68/68 in jeder der acht Kombinationen; alle bisherigen 53 Fälle erhalten, 15 neue Regressionen |
| Node 24.19.0 / jsdom 30.1.2 | React/ReactDOM 18.3.1 und 19.3.0; jeweils Vue 3.5.22 |
| Node 26.5.0 / jsdom 30.1.2 | React/ReactDOM 18.3.1 und 19.3.0; jeweils Vue 3.5.22 |
| Node 24.19.0 / Chromium 154.0.8037.92 | React 18.3.1 und 19.3.0 Produktionsbundles; jeweils Vue 3.5.22 |
| Node 26.5.0 / Chromium 154.0.8037.92 | React 18.3.1 und 19.3.0 Produktionsbundles; jeweils Vue 3.5.22 |
| Retention | 50 Suspend/Resume-Zyklen je Framework und Kombination; DOM, Draft, Scroll und Komponentenstatus erhalten |
| Bestehende Contracts und Paketprüfungen | 12/12 unter Node 24.18.0 und 26.5.0 |
| TypeScript | Strict-Prüfung öffentlicher Subpaths einschließlich echter Fabric-API unter Node 24.19.0 und 26.5.0 bestanden |
| Alte Host-API gegen Main | Factory-Funktionskörper, Deklarationen und ursprüngliche Contracttests bytegleich; Exports, Paket-Einträge und vollständige Lifecycle-/Snapshot-/Record-Traces mit fester Uhr identisch |
| Browser/Node/Types | Tatsächliche Browser-Runtime-Exports stimmen mit Node und Deklarationen überein; alte Host-Subpaths behalten ihre vollständige API |
| Browser-Runtime-Importgraph | 13 lokale Inputs, keine Framework-Pakete, PoC-Controller oder Compiler-Abhängigkeiten |
| Compiler-Paketdateien | Lokaler npm-pack-Dry-Run: alle 19 benötigten Runtime-/Typdateien vorhanden; kein Paket veröffentlicht |
| Release Node 24.18.0 / npm 11.17.0 | Baseline 184/186, Patch 184/186; dieselben zwei Fehler |
| Release Node 26.5.0 / npm 11.17.0 | Baseline 184/186, Patch 184/186; dieselben zwei Fehler |
| Zusätzliche Release-Regressionen | Keine; Fehlertexte wurden verglichen, nicht nur Summen |
| Schema-Inventar / Core-Lock | Im Review-Delta unverändert; keine neue Fingerprint-Akzeptanz oder Änderung der Sicherheitsschwellen |

Die zwölf gezielten Suiten sind `xtensions-host-controller`, `xtensions-react-host-adapter`, `xtensions-vue-host-adapter`, `xtensions-react-host-controller-poc`, `xtensions-vue-host-controller-poc`, `xtensions-signal-bridge`, `xtensions-security-integrity-gate`, `xtensions-runtime-capability-registry`, `rmt-vnext-scheduler`, `scoped-package-readmes`, `maraca-package-exports` und `rmt-artifact-parity`.

## Review-Korrekturen / Review corrections

1. Bestehende synchrone Host-Factories, Defaults, Snapshots, Zusatzmethoden und ursprüngliche Contracttests erhalten. Echte Runtime-Factories heißen additiv `createReactRuntimeAdapter` / `createVueRuntimeAdapter`; keine automatische Stub-Auswahl.
2. React-interne State-Renderfehler terminieren Root und Scope ohne weiteres Host-Update. Spätere Updates scheitern zeitnah. Ausstehende Render-Promises werden abgeschlossen/abgebrochen; terminaler Unmount läuft unabhängig von einer blockierten Lifecycle-Queue.
3. Vue-interne Render-, Watcher- und Eventhandlerfehler lösen denselben fatalen Teardown aus. Der registrierte Timer stoppt ohne nachträglichen Host-Update-Aufruf. Fehler und terminaler Zustand bleiben beobachtbar.
4. Selbst-Unregister während erneuter synchroner Aktivierung führt das erst danach gelieferte Cleanup genau einmal aus. Pending Cleanup bleibt im Snapshot sichtbar; Release-Erfolg folgt erst nach Cleanup. Auch falsy geworfene Werte werden als Fehler erfasst.
5. Sofortiger Unmount nach erfolgreichem React-Mount lässt ausstehende passive Effects erlaubte Ressourcen inert registrieren/abmelden. Drei Wiederholungen mit 30 ms Initialrender prüfen, dass tatsächlich ein Effect während Shutdown läuft, kein Register-Fehler auftritt und dessen Cleanup erreicht wird. Dieser Befund wird nicht als Leak oder Deadlock bezeichnet.
6. Keine Browser-Umleitung bestehender Hostadapter. Neue Subpaths besitzen passende Wert-Exports und Deklarationen. Ihre notwendigen Dateien sind auch im separaten Compiler-Paket enthalten. Echte Fabric-Promises werden geprüft; dessen bestehender breiter Factory-Typ wird akzeptiert und die Boundary zur Laufzeit validiert.

Die übrigen Acceptance-Fälle prüfen weiterhin Props-/Event-Updates, Versionen/Exports, Provider-ABI, Mount-/Loader-Races, verspätete Ergebnisse, Containerkollisionen, SSR-Ablehnung mit DOM-Erhalt, Cleanup-Ausnahmen, Generation Guards und verweigerte DOM-/Payload-/Policy-Zugriffe. Die historischen 38/38 Testprodukt-Szenarien wurden nicht neu ausgeführt. Kooperative Suspension ist weiterhin keine Sandbox; SSR/Adoption und ein RMT-/Security-Redesign bleiben außerhalb dieses Abschnitts.

## Verbleibende Baseline-Befunde / Remaining baseline findings

1. `schema-inventory`: ausschließlich der bekannte CI-Runner-Capabilities-Shape-Drift. Keine Korrektur, neue Baseline-Freigabe oder Schwellenänderung im Review-Delta. Die zuvor in WP1 angepassten 17 Inventareinträge bleiben gegenüber dem geprüften Ausgangscommit unverändert.
2. `native-first-evidence-pack`: das Conditional-Network-Artefakt fehlt weiterhin. Der zuvor separat ausgeführte echte npm-Audit war auf Baseline und Patch durch das High-Advisory [GHSA-6qxp-vccf-f47h](https://github.com/advisories/GHSA-6qxp-vccf-f47h) für `@modelcontextprotocol/client` blockiert. Die Audits werden hier als vorhandene Evidenz bezeichnet, nicht als neu ausgeführt. Die Dependency und Audit-Schwelle wurden nicht geändert.

Beide vollständigen Release-Vergleiche reproduzieren 184/186, nicht die ältere historische Angabe 185/186. Die zwei Fehler bleiben Fehler und werden nicht als Patch-Erfolg gezählt. Frühere separate `xtensions-adoption-handoff`-Läufe ergaben auf Main und erstem Patch dieselben 15 DE-Dokumentationsfehler; diese Prüfung wurde im Review-Delta nicht neu ausgeführt. Die elf anderweitigen WP1-Follow-up-Dateien gehören weiterhin nicht zum Umfang.

Lizenz/Provenienz ist ein separater offener Punkt: Die private Testquelle hat keine eigene festgestellte Lizenz. Die ausdrückliche Nutzerfreigabe deckt lokale Extraktion und Korrektur, keine Veröffentlichung. Der Lizenzvorbehalt wird weder durch bestandene Tests noch durch das unabhängige MCP-Advisory erledigt.

## Lokale Evidenz / Local evidence

Finale neue Ergebnisse liegen im ignorierten Verzeichnis `.xtend-test-results/xtensions-wp1-review/`:

- `matrix.json` und `xtensions-review-n{24,26}-r{18,19}-{jsdom,browser}.json`: acht komplette Acceptance-Berichte mit allen 68 Fallnamen, Versions- und Exportprüfungen;
- `comparison.json` und `xtensions-review-release-{baseline,patch}-node{24,26}.json`: beide vollständigen gepaarten 186-Suiten-Vergleiche samt identischen Fehlertexten;
- `xtensions-review-targeted-node{24,26}.json`: zwölf gezielte Suiten pro Node-Version;
- `legacy-compatibility.json`: Baseline-Vergleich der alten API einschließlich reproduzierbarer Trace-Fingerprints;
- `browser-entry-build.json`, `compiler-package.json`: Importgraph und lokale Paketdateiliste;
- `xtensions-review-schema-final.json`: bekannter Schema-Befund ohne zusätzliche Fehler.

Die ursprünglichen Audit- und Vorreview-Berichte bleiben unverändert unter `.xtend-test-results/xtensions-wp1/`. Runtime-Reproduktion, Konfiguration, genaue Fehlerzustände und RMT-Folgefragen stehen im [WP1-Vertrag (DE/EN)](XTensions-Runtime-Adapters-WP1.md).

Release-Reproduktion: `node scripts/run_xtend_tests.js --profile ci-release --report /tmp/release.json`, jeweils in Baseline und Patch. Verwendet wurden Node 24.18.0 bzw. 26.5.0 mit npm 11.17.0 im PATH, vorhandene isolierte PHP-/Chromium-/ChromeDriver-Werkzeuge, `npm_config_cache=/workspace/.npm-cache` und `XTEND_BROWSER_HYPERVISOR_BROWSER_BINARY=/workspace/xtensions-system-tools/bin/chromium`. Für diese Korrekturrunde wurde nichts neu installiert.

English: all six review findings are corrected locally. All 53 prior acceptance cases remain, with 15 added regressions: 68/68 pass in each of eight actual runtime/browser combinations. Twelve contract/package suites and strict public API/Fabric typing checks pass. Existing Host APIs match the Main baseline; new Runtime APIs are additive and have matching Node/browser/declaration exports and package files. Full paired releases on both Node 24 and Node 26 pass 184/186 with identical remaining failures. Schema acceptance rules, dependency locks and security thresholds are unchanged in this review delta. Private-source publication rights and the pre-existing MCP advisory remain separate open issues. No remote write or publication occurred.
