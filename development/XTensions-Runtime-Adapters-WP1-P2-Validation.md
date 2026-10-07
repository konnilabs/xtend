# WP1 P2 — activation reentrancy / Reentranz bei Aktivierung

Stand: 2026-10-07. Ausgangsrevision `251b2ac93847278e8fc011c287b49027ec938ca9`; aktueller Main `86b1403f43d0f0532334cdd5243b3e0ae50fe6c2`. Lokaler Branch `codex/xtensions-runtime-wp1-p2`. Beide Arbeitsbäume waren vor Beginn sauber. Main wurde ohne Konflikte integriert; der bisherige Adapterbranch bleibt erhalten. Die private Referenz `52b7b456c144c1cf7a1d8c99a27f91ff608950cc` bleibt unverändert.

## Korrektur / Fix

Eine Ressourcen-Factory kann beim Start synchron `reportError`, `unmount` oder Selbst-Unregister mit werfendem Cleanup auslösen. Mount/Resume meldeten danach dennoch `ok`. Zwölf neue Controllerfälle mit echten React-/Vue-Komponenten reproduzierten diesen Fehler; vier Kontrollen mit erfolgreichem Selbst-Unregister bestanden bereits. Zusammen mit den unveränderten 68 Fällen: vor Korrektur 72/84, nach Korrektur 84/84 im gezielten Node-24-Lauf.

Der Controller prüft direkt nach `resources.start()` fatalen Fehler, Dispose, Generation und neue Cleanup-Fehler, bevor Props/Phase/Erfolg festgeschrieben werden. Fehler liefern `failed` nach abgeschlossenem terminalem Teardown; reentrantes Dispose liefert `skipped`. Erfolgreiches Selbst-Unregister bleibt zulässig. Die Tests prüfen Ergebnisse, Lifecycle-Records, endgültigen Root-/Scope-Zustand, Originaldiagnostik und genau einmal ausgeführtes Cleanup. Bestehende APIs und Sicherheitsgrenzen bleiben unverändert.

English: resource activation can synchronously reenter the host. Mount/resume now validate fatal/disposed/generation/cleanup state after activation before committing readiness. Fatal or cleanup failures terminate and return `failed`; disposal returns `skipped`. Successful self-unregister preserves the root. Twelve reproductions failed before the fix; four success controls and all previous 68 cases passed.

## Lizenz und Umfang / Licensing and scope

Die ausdrückliche Nutzerfreigabe vom 7. Oktober 2026, 19:43 UTC stellt eigene abgeleitete Fragmente unter XTend Apache-2.0 und erlaubt einen geprüften Draft-PR. [NOTICE](../tools/xtensions/NOTICE) benennt Quellen, geänderte Adapterdateien und die getrennten MIT-Lizenzen von React/ReactDOM und Vue. Drei unverändert übernommene Drittanbieter-Lizenztexte erhalten die unterschiedlichen React-18-/React-19-Copyright-Angaben und die Vue-Angabe. Zusätzlich wird die unveränderte XTend-Apache-Lizenz beigefügt, damit auch das separate Compiler-Paket den vollständigen Text enthält. Kein Framework wird auf Apache umlizenziert oder gebündelt. Beide Pakete liefern Hinweise und Lizenztexte aus.

Unabhängige Reviewfortsetzung steht vor Push/Draft-PR. Kein Merge oder Release. Keine neuen Schema-Inventar-, Dependency- oder Sicherheitsschwellenänderungen. Die 17 bereits in der Ausgangsrevision enthaltenen Inventaranpassungen bleiben unverändert. Die Änderungen aus Main an ERP-Abhängigkeiten werden übernommen, ohne zusätzliche Updates. Das größere XTensions-2.0-/RMT-Redesign bleibt außerhalb des Patches.

English: the user's explicit authorization applies to owned derived adapter fragments under Apache-2.0. React/ReactDOM and Vue retain their MIT licenses and unchanged notices. Independent review precedes pushing a Draft PR; no merge/release is authorized. No new schema acceptance, dependency update or security-threshold change is included.

## Nachweise / Evidence

Neue maschinenlesbare Nachweise liegen unter `.xtend-test-results/xtensions-wp1-p2/`. Die früheren Berichte bleiben unverändert.

| Prüfung / Check | Ergebnis / Result |
| --- | --- |
| Reproduktion vor/nach Korrektur | Node 24.18.0: 72/84 → 84/84; zwölf gezielt reproduzierte Fehler behoben |
| Node 24.19.0 × React/ReactDOM 18.3.1 / 19.3.0 × jsdom / Chromium | 84/84 in jeder der vier Kombinationen |
| Node 26.5.0 × React/ReactDOM 18.3.1 / 19.3.0 × jsdom / Chromium | 84/84 in jeder der vier Kombinationen |
| Vue / jsdom / Chromium | Tatsächlich 3.5.22 / 30.1.2 / 154.0.8037.92; keine Manifestversion als Runtimebeleg |
| Retention / Exports | 50 Zyklen je Framework/Kombination; öffentliche Node-/Browser-/Deklarationsexports unverändert geprüft |
| TypeScript | Strict-Prüfung der öffentlichen APIs einschließlich Fabric unter Node 24.19.0 und 26.5.0 bestanden |
| Zusätzliche Contracts | 4/4 unter Node 24.18.0 und 26.5.0: HostController, SignalBridge, Security/Integrity-Gate und Runtime-Capability-Registry |
| Relevante Contract-/Paketsuiten insgesamt | 12/12 auf beiden Node-Versionen: acht im vollständigen Release-Profil und die vier zusätzlichen Contracts |
| Paket-Dry-Runs | XTend 1364 Dateien, Compiler 170 Dateien; jeweils NOTICE, Apache-Lizenz und drei Drittanbieter-Lizenztexte vorhanden |
| Lizenztext-Vergleich | Drei Drittanbietertexte bytegleich mit den jeweils angegebenen installierten npm-Paketen; ReactDOM-Texte je Version identisch; Apache-Text bytegleich mit XTend LICENSE |
| Vollständiger Release-Vergleich Node 24.18.0 / npm 11.17.0 | Main 184/186, Patch 184/186; identische zwei Fehlertexte; ERP-Catfood einschließlich Browserprüfung bestanden |
| Vollständiger Release-Vergleich Node 26.5.0 / npm 11.17.0 | Main 184/186, Patch 184/186; identische zwei Fehlertexte; ERP-Catfood einschließlich Browserprüfung bestanden |

`matrix.json` fasst die acht vollständigen `matrix-n{24,26}-r{18,19}-{jsdom,browser}.json` zusammen. `reproduction-before.json` und `reproduction-after.json` dokumentieren den gezielten Vorher/Nachher-Lauf. `package-license-check.json`, `root-package.json` und `compiler-package.json` enthalten Dateilisten und Lizenz-Hashes. ReactDOM 18.3.1 meldet im offiziellen Produktionsbundle weiterhin `18.3.1-next-f1338f8080-20240426`; diese bereits dokumentierte Normalisierung wurde nicht geändert.

Reproduktion der Matrix: `XTENSIONS_TEST_PEERS=/workspace/xtensions-peer-harness node scripts/test_xtensions_runtime_adapters.cjs --report /tmp/runtime.json`; für React 19 den vorhandenen Ordner `/workspace/xtensions-peer-harness19`, für Chromium zusätzlich `--browser` und `CHROME_BIN=/workspace/xtensions-system-tools/bin/chromium` verwenden. Beide Node-Versionen werden ausdrücklich gewählt. TypeScript-Befehl und Peer-Installationsanleitung stehen im [WP1-Vertrag](XTensions-Runtime-Adapters-WP1.md). Die isolierten Framework-Testinstallationen bleiben unverändert.

Der erste vollständige Node-24-Lauf gegen aktuellen Main ergab auf beiden Seiten 183/186: Die vorhandene ERP-Installation enthielt noch Angular 19.2.25, obwohl Main nach PR #103 bereits 20.3.32 verlangt. Beide ERP-Builds scheiterten deshalb am fehlenden `provideZonelessChangeDetection`. Diese Vorläufe bleiben als `pre-lock-sync-node24.json` erhalten; die anschließenden Node-26-Vorläufe wurden zur Korrektur der Umgebung abgebrochen und sind keine vollständigen Nachweise. Danach wurde in beiden Checkouts ausschließlich die ERP-Installation per `npm ci --prefix products/resumability-maraca-erp-demo --ignore-scripts --registry https://registry.npmjs.org` an den bestehenden Main-Lock angeglichen. Keine Manifest-/Lockänderung und kein zusätzliches Versionsupdate. Die finalen vollständigen Vergleiche verwenden diese synchronisierte Umgebung.

Die historischen 38/38 Szenarien des privaten Testprodukts und der frühere separate Adoption-Handoff-Lauf wurden nicht neu ausgeführt. SSR/Adoption bleibt außerhalb WP1; die geprüfte Vue-Clientversion ist unabhängig von der auf Main aktualisierten ERP-SSR-Abhängigkeit.

## Aktueller Mainvergleich / Current Main comparison

Beide finalen gepaarten Release-Läufe sind vollständig: keine zusätzlichen fehlgeschlagenen Suiten oder abweichenden Fehlertexte. Die Fehler bleiben `schema-inventory` (bekannter `shape-fingerprint-drift` für `xtend.ci.runner-capabilities.v1`) und `native-first-evidence-pack` (fehlendes Conditional-Network-Artefakt für `NFM-AEP-10`). Das frühere separate MCP-Audit-Advisory bleibt ein eigener Befund; hier wird kein neuer Auditlauf behauptet. Keine Baseline-Freigabe, Schema-Akzeptanz oder Sicherheitsschwelle wurde geändert.

`comparison.json` und `release-{baseline,patch}-node{24,26}.json` enthalten die vollständigen Vergleiche. `contract-summary.json` fasst die zwölf Suiten zusammen; `additional-contracts-node{24,26}.json` belegt die vier zusätzlichen. `erp-installation.json` dokumentiert den abgeglichenen Main-Lock, `scope-check.json` die unveränderten Inventar-/Lockdateien, `source-checksums.json` den geprüften funktionalen Stand. Die Vorlaufberichte bleiben als Umgebungsdiagnose erhalten.

Release-Befehl je Checkout und Node-Version: `node scripts/run_xtend_tests.js --profile ci-release --report /tmp/release.json`. npm 11.17.0 sowie die vorhandenen PHP-/Chromium-/ChromeDriver-Werkzeuge stehen im PATH; gesetzt sind `npm_config_cache=/workspace/.npm-cache` und `XTEND_BROWSER_HYPERVISOR_BROWSER_BINARY=/workspace/xtensions-system-tools/bin/chromium`. Die vier Zusatzsuiten werden über denselben Runner mit ihren IDs statt `--profile ci-release` ausgewählt.

English: final paired releases pass 184/186 on both Node 24 and Node 26 with exactly identical remaining failures. ERP build/browser verification passes after synchronizing installed packages to the existing Main lock. All eight runtime combinations pass 84/84; all twelve relevant contract/package suites and strict typing checks pass. The P2 fix and licensing notices are ready for independent review; no push or Draft PR has occurred.
