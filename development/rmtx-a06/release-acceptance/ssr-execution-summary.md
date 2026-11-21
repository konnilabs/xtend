# A06.6.2 – Produktiver SSR-Anschluss und lokale Abnahme

Stand: **21. November 2026**, Dokumentrevision **1.1.0**. Basis: Commit `fa0d6451` plus der aktuelle Implementierungsworktree. Der [Handoffvertrag](rmtx-ssr-contract.md) und die [Arbeitsgliederung](implementation.md) beschreiben Umfang und weitere Abnahme. Historische A06.5-/A06.6.1-Belege bleiben unverändert zugeordnet.

## Tatsächlich ausgeführte Pfade

Der neue Produktionsfall verknüpft Source8 mit importierten Classic-Actions, nativen Header-/Button-/Textinhalten und vier React-/Vue-Hosts. Zahlenkey `1` und Stringkey `"1"` bleiben verschieden. Der Node-Server rendert aus tatsächlicher erfasster ESM-Ausgabe, ohne native Custom-Element-Klassen zu definieren oder Browserglobals einzurichten. Der Browser verwendet die versiegelte tatsächliche Auslieferung mit Integritätsprüfung und importiert ihre echten Module.

Der gemischte Fall umfasst 41 Prüfungen: signierter Restore, erhaltene native und Frameworkknoten, geordneter Providerintentreplay, Deduplizierung, gehaltene und spätere Liveintents, Reordering/Reinkarnation, leere Mengen und begrenzter Mountfallback. Falsche Signaturen, abweichende Quellen/Projekte/Interfaces/Besitzer/State/Keys, ungültige Replaybatches, wiederverwendete konfliktierende Intent-IDs, Shell-/Containermutation, tatsächliche Hydrationsfehler und Cancellation scheitern ohne unzulässige Model- oder Providerwirkung.

Neun weitere Prüfungen verwenden einen echten native-only Source8-Build mit Classic-Import und ohne fingiertes XTension-Manifest, Providergrants oder Peerloader. Sie prüfen Node-Light-DOM, Signatur, tatsächliche Browserübernahme, kontrolliertes natives DTO/Classic-Action, alte Wireformen, veränderte Shell und Abbruch. Native HTML-Shells bleiben entsprechend dem erhaltenen `clearOwnedDom:false` nach Dispose bestehen; Framework-Roots verschwinden. Alte Commands und native Ereignisse bewirken danach weder Modeländerungen noch neue Fabricarbeit.

## Exakte Lanes und Originalbelege

Alle Ausführungen liefen seriell; kein Skip ersetzt einen geforderten Fall. Browser: **Chromium 145.0.7632.6**. Die frischen Produktionsberichte protokollieren TypeScript 5.9.3, Rollup 4.60.4, esbuild 0.28.2, Terser 5.51.4, jsdom 30.1.2, Playwright 1.56.0, React/ReactDOM 18.3.1 und Vue 3.5.43. Das vorhandene Chromium wird ausdrücklich über `CHROME_BIN` gewählt; es ist nicht das mit Playwright ausgelieferte Browserbinary.

| Prüfung | Node 24.18.0 | Node 26.5.0 |
| --- | ---: | ---: |
| Neuer Produktions-/Node-/Browserlauf, einschließlich native-only | [50/50](evidence/node24.json) | [50/50](evidence/node26.json) |
| Erhaltenes SSR-v1-Profil | [84/84](evidence/legacy-v1-node24.json) | [84/84](evidence/legacy-v1-node26.json) |
| Erhaltenes Scoped-/Komponenten-SSR-v2-Profil | [35/35](evidence/legacy-v2-node24.json) | [35/35](evidence/legacy-v2-node26.json) |
| Renderer-/Ownership-/Preflight-, Source7-/Source8-CSR-, geschlossene Legacyexports und neue native SSR-Initialtests | 84/84 | 84/84 |
| Handoff, geschlossener Loader, strikte Typen, Entry-/CI-/Vorbereitungsgates sowie Ziel-/Featureplan | 41/41 | 41/41 |
| Summe dieser getrennten Läufe | **294/294** | **294/294** |

Die sechs verlinkten JSON-Dateien sind unveränderte Bytekopien der tatsächlichen Originalreports. Sie wurden nicht aus Ergebnissen zusammengebaut, auf neue Quellhashes umgeschrieben oder in standardisierte Release-ExecutionEvidence umetikettiert. Der neue Abnahmebericht verwendet `xtend.rmtx.ssr-runtime-acceptance.v1` mit Wire3. Die alten Report-/Wireverträge bleiben bestehen.

SHA-256 der neuen Originalreports:

- Node24: `14f16751bdada3212b2cce0d090be0f6e4493947185973c00c23fcdbe47ff0e5`.
- Node26: `3fc2ce1135362ec5cfa37584af28d0d0de51c112cc3497eb4ab1b9623d4c82ee`.

Fixturehashes und gemischte/native-only Projektidentitäten stimmen zwischen den Lanes überein. Alle 31 Größen der gemischten Auslieferung stimmen überein; 29 Dateihashes sind identisch. Entry- und Kompositionsreporthash unterscheiden sich. Es wird keine vollständige Byteidentität beider Builds behauptet.

Der neue Lauf benötigte auf Node24 rund **58,07 s / 933 448 KiB RSS**, auf Node26 **58,49 s / 837 480 KiB RSS**. Heapgrenze: 1024 MiB. Das sind Prozessmessungen der Laufsteuerung, keine aggregierte RAM-Messung sämtlicher Browserprozesse. Die separaten 84 Regressionstests benötigten 33,61/32,98 s und maximal 481 668/366 332 KiB RSS bei 768 MiB Heap. Die übrigen 41 Tests bestanden in 4,05/4,06 s.

## Budgets, Paketinhalt und Gates

Die festen Grenzen wurden nicht geändert. Im neuen gemischten Produktionsfall wurden **270 699 Komponentenruntimebytes** bei 280 000 Grenze und **181 301 native Viewbytes** bei 240 000 Grenze gemessen. Die vollständige erfasste Auslieferung umfasst 2 157 613 Bytes; die Framework- und relativen Produktionsprüfungen bestehen innerhalb der bestehenden Grenzen. Native-only-Sealing verwendet das tatsächliche Framework-/Byteinventar mit null XTensionruntimebytes; es erfindet keine Komposition oder ein bestandenes XTensionbudget.

Ein tatsächlicher `npm pack --dry-run --json --ignore-scripts` für Maraca erfasst 95 Dateien einschließlich der fünf neuen SSR-Build-/Vertrags-/Loaderdateien sowie aller neun nativen Integrations-, SSR-Entry- und Deklarationsdateien. Dies ist eine Paketinhaltprüfung, keine isolierte Installation oder Releaseversiegelung. Maracaexports: 23, darunter drei eigene native SSR-Einstiege; die drei privaten Integrationsmodule besitzen keine Paketexports. Compilerexports: 51; Root-SDK-Exportkatalog: weiterhin 241. Die neue öffentliche Typfixture besteht mit `strict:true` und `skipLibCheck:false`, einschließlich alter CSR-Sperren, exklusiver Frameworkpeerloader und native-only ohne Providerports.

Die neue fokussierte Testgruppe läuft blockierend in `scripts/check_release_preparation.cjs`. Der bestehende tatsächliche XTensions-Runtimegate-Besitzer startet den v3-Browserrunner als getrennten, auf 180 Sekunden begrenzten Prozess und prüft seinen eigenen Rohbericht. Legacy-v1/v2-Berichte werden nicht erweitert. Der zusätzliche CI-Rohbericht heißt `.xtend-test-results/xtend-rmtx-ssr-runtime-report.json`; die formale Profil-/Artifact-/ExecutionEvidence-Bindung gehört weiterhin zu A06.6.5.

Die vollständige Vorbereitung benötigt zusätzlich aktuelle kanonische Beobachtungsdateien: Durch die neuen APIs, Paketdateien und Gateverdrahtung änderten sich deren Quellpins und gemessene Bytewerte. Die offiziellen Inspectorwriter wurden frisch ausgeführt; 24 aktuelle Evidence-JSONs wurden nach Prüfung unverändert aus diesen Ausgaben übernommen, acht weitere geprüfte Operator-/Typ-/Compilerseiten blieben byteidentisch. Hinzu kam der entsprechend geprüfte Frontend-Inspector. Der [Generierungsbeleg](evidence/canonical-refresh-receipt.json) dokumentiert die 24 Dateien mit alten/neuen SHA-256 und Änderungen. Schema, API, Datierung, Checks und Abnahme-/Ausführungsbehauptungen blieben unverändert; historische Runtimeberichte, Captures und ExecutionEvidence wurden nicht umgeschrieben.

Nach der Trennung der nativen SSR-Einstiege und dem Toolchainabgleich wurden 18 betroffene offizielle Writer erneut ausgeführt und ihre 23 Ausgabedateien geprüft. Dabei änderten sich in 15 aktuellen Vergleichsberichten ausschließlich 29 Quellpins; alle übrigen Felder, Bytewerte und Compilerseiten blieben identisch. Die [separate Abschlussquittung](evidence/canonical-refresh-receipt-final.json) hält diese zweite Generierung fest; der erste Generierungsbeleg bleibt erhalten.

Eine ergänzende Prüfung von neun älteren offiziellen Inspectorwritern umfasste 18 Ausgaben; 17 blieben byteidentisch. Das aktuelle A01-Quellinventar erfasst zwei geänderte Inputhashes, die zwei neuen DOM-Handoff-Kennungen und 53 verschobene Fundstellenangaben. Corpus, AST-/Artefaktfelder, Targetbeobachtungen und Prüfbehauptungen blieben unverändert. Die [dritte Generierungsquittung](evidence/canonical-refresh-receipt-remainder.json) dokumentiert auch diese Abgrenzung.

Der abschließende vollständige Lauf von `scripts/check_release_preparation.cjs` unter **Node 24.18.0** besteht sämtliche **52 Schritte** und **1 057/1 057 Tests in 17 Gruppen**, ohne Fehler, Abbruch, Skip oder Todo. Der Prozess beendet sich mit Status 0 nach **7:54,03 min**, maximal **719 184 KiB RSS** und 1024 MiB Heapgrenze. Die [lokale Prüfquittung](evidence/preparation-node24.json) bindet den Runnerquellhash und den SHA-256 des [unveränderten Originalprotokolls](evidence/preparation-node24.log). Diese zusätzliche Gesamtprüfung ist keine standardisierte Release-ExecutionEvidence und keine weitere eindeutige Testmenge neben den teilweise überlappenden Läufen oben.

## Reproduktion und verbleibende Abnahme

Der tatsächliche Runner benötigt die erfassten React-/Vue-/Buildpeers und Chromium; fehlende Voraussetzungen führen zu einem Fehler, keinem Skip:

```sh
NODE_PATH=/path/to/peers/node_modules \
XTENSIONS_TEST_PEERS=/path/to/peers CHROME_BIN=/path/to/chromium \
node --max-old-space-size=1024 \
  development/rmtx-a06/release-acceptance/runtime/runtime-test.cjs \
  --output /tmp/rmtx-ssr-report.json
```

Der Abschluss von A06.6.2 bedeutet einen implementierten und tatsächlich ausgeführten vertikalen Handoff. Die 53 benannten Zielmatrixfälle über alle 120 Framework-/Source-/Projektmoduskombinationen sind damit nicht insgesamt abgenommen. Sämtliche 47 Katalogrollen bleiben in ihrer vorhandenen Abnahmematrix offen. Weitere Frameworks, Streaming, portable RMTX-Node-/PHP-Ausgabe, Cross-Ownership-Portale und universelles natives DOM-Eventreplay bleiben ausgeschlossen.

Feature-Scope-/Readiness-v2 bleibt `ready:false`; die beiden Features bleiben `preparing`. Neue Rohbelege ersetzen weder registrierte vollständige Releaseprofile noch einen frischen gemeinsamen Quellen-/Inventar-/Authority-, Paket- und Sealabschluss. Nächster Abschnitt ist **A06.6.3 – vollständige Rollenabnahme**.
