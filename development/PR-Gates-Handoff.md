# Gemeinsame PR-Gates: Umsetzung und Abnahme

Der Arbeitsstrang schließt an den [Projektindex](./PROJECT-INDEX-Handoff.md) an. Verbindliche Suite-Abdeckung bleibt erhalten; automatische Testauswahl anhand von Änderungen ist ausgeschlossen. Der statische Katalog unter `scripts/test-runner/` ersetzt die Auswahllisten in npm-Kommandos und die ausführbare Registrierung im bisherigen Runner. Paketmetadaten bleiben kompatible Projektionen und werden gegen die tatsächlichen Profile geprüft.

## Migration der Ausführungspläne

Der Vergleich verwendet die npm-Kommandos und Workflow-Schritte vor dieser Änderung. Jede vorherige Suite-ID bleibt mit ihrer Implementierung und ihren Argumenten enthalten. Explizite Aliasse teilen eine Ausführung; unterschiedliche Argumente bleiben getrennt.

| Profil | Bisherige Aufrufe je Node-Version | Bisherige IDs | Neue IDs | Tatsächliche Ausführungen |
| --- | ---: | ---: | ---: | ---: |
| PR einschließlich RMT-/Native-First-Job | 250 | 178 | 182 | 181 |
| Release einschließlich RMT-/Native-First-Job | 251 | 179 | 183 | 182 |
| Nightly | 425 | 179 | 183 | 182 |
| Frische Publish-Abnahme | 373 | 174 | 178 | 177 |

Die vier zusätzlich verpflichtenden Suites sind `project-index`, `rmt-language-server`, `rmt-vnext-imports` und `test-runner`. Der vorhandene VSIX-Smoke-Job startet zusätzlich den gepackten Language Server. `maraca-bundle-report` bleibt eine logische ID, verwendet aber das Ergebnis von `maraca-bundle`. Die zwölf Tuning-Kandidaten und die unabhängige Reproduzierbarkeitsprüfung sind unverändert.

## Ausführung, Artefakte und Ressourcen

Die Hauptjobs erzeugen einen versionierten Ausführungsbericht. Der bestehende RMT-/Native-First-Check prüft dieselbe Laufidentität, Commit, Runtime, Quellenstand und Katalogfingerprint und wertet seine Pflichtteilmenge aus. Ein fehlendes oder unvollständiges Artefakt schlägt fehl. Node-/OS-Matrizen und Checknamen bleiben bestehen. Fachberichte werden aus vorhandenen Ergebnissen erzeugt; ihre bisherigen Pfade und Alias-IDs bleiben erhalten.

Der Supervisor verwendet standardmäßig einen Worker, maximal zwei mit Ressourcensperren. Unbekannte Ressourcen führen zur seriellen Ausführung. Deadlines, Prozessabbrüche und ungültige Ergebnisse hinterlassen fehlgeschlagene Teilberichte. Nur eigene Worker werden beendet. JSON bleibt auf stdout parsebar; Suite-Ausgaben werden getrennt protokolliert. npm-Caches speichern Downloads und ersetzen keine Tests.

Der Browser-Hypervisor begrenzt alle WebDriver-Anfragen durch die Fixture-Deadline, weist HTTP-/Protokollfehler zurück und bewahrt zusätzliche Cleanup-Fehler. Freie lokale Ports verhindern die Übernahme eines bereits laufenden Drivers. Externe Endpunkte werden nicht beendet. Der VSIX-Test entpackt das erzeugte Archiv außerhalb des Checkouts, prüft Legacy/vNext, Definitionen, Referenzen und Shutdown und entfernt für einen Negativfall die Projektindex-Abhängigkeit. Das Paket enthält auch den relativ geladenen RMT-Core.

## Validierung und Grenzen

Die fokussierten Runner-Verträge prüfen Profilparität, Aliasargumente, unbekannte Auswahl, widersprüchliche Ergebnisse, Exceptions, Worker-Abbruch, Timeouts, Teilberichte, Ressourcen und Herkunftsprüfung. Browser-Gegenstellen prüfen hängende Antworten, HTTP 404/500, ungültiges JSON, Sessionabbrüche, belegte Ports und zusätzliche Cleanup-Fehler. Der MCP-Negativtest erzeugt einen isolierten Wissensspiegel und weist dessen absichtliche Veraltung mit dem unveränderten Driftcheck nach.

Für die lokale vollständige Abnahme vereinigt `ci-validation` die Pflichtmengen der vier CI-Profile. Seine Ergebnisse können anschließend mit `--verify` je Profil geprüft werden; jede benötigte Implementierung wird unter denselben Eingaben nur einmal ausgeführt. Ausführungsberichte enthalten Laufzeit, Workeranzahl und Speichermessungen. Sie sind vollständig aus Quellen rekonstruierbar und bleiben unter `.xtend-test-results/` ignoriert.

Der vorhandene lokale Snap-Driver verweigert das Senden des Beendigungssignals mit `EACCES`. Lokale Browserprüfungen verwenden deshalb über `XTEND_BROWSER_HYPERVISOR_DRIVER_PATH` das bereits installierte direkte Driver-Binary. Der Fehler wird weiterhin als Fehler berichtet; es gibt keine Ausnahme im Gate.

Lokale Ausführung auf Linux/Node 24.19.0 ist keine Abnahme der GitHub-Actions-Matrix mit Node 24.18.0/26.5.0 und Windows/macOS. Tatsächlich gestartete CI-Läufe müssen getrennt nachgewiesen werden. Eine Veröffentlichung bleibt ausgeschlossen. Der anschließende Nightly-Arbeitsstrang umfasst zusätzlich einen manuellen GitHub-Abnahmelauf auf einem isolierten Prüfbranch.

Bedienung und Reportverträge: [Deutsch](../docs/de/xtend-dev-surface.md#pr-gates-und-gemeinsame-testausführung), [English](../docs/en/xtend-dev-surface.md#pr-gates-and-shared-test-execution).

## Nightly-Härtung

Die Auswertung von 40 GitHub-Nightlies zeigte sowohl Anwendungs-/Vertragsfehler als auch Installationsfehler mit internen Paketauflösungen. Die letzten fünf untersuchten Läufe waren grün; ein pauschales Runner-Ressourcenproblem ist damit nicht belegt. Das bisherige Manifest meldete allerdings auch bei vorhandenen fehlerhaften Berichten Erfolg.

Die gemeinsame Nightly-Phasensteuerung prüft Root-/Workspace-Locks vor der Installation, testet die erforderlichen Runner-Fähigkeiten und begrenzt externe Befehle. Sämtliche bisherigen Berichtspflichten bleiben blocking. Ein einzelner Abschlusstest validiert die Ausführung, Phasenquittungen und unveränderten Artefakthashes und liefert die benannten Checkergebnisse. Zusätzliche Diagnoseartefakte enthalten die vollständigen Phasen- und Worker-Logs. Der unbenutzte ERP-Installationsschritt entfällt.

Die Runner-Suite prüft negative Lockfiles, fehlende Fähigkeiten, blockierte Voraussetzungen, Timeouts, fehlende oder veränderte Artefakte, Fremdherkunft und ausgelassene Pflichtprüfungen. Lokale vollständige Profile und GitHub-Läufe mit beiden optionalen Zweigen werden separat ausgewiesen. Mehrere aufeinanderfolgende planmäßige Nightlies bleiben eine Beobachtung nach Übernahme der Änderung; ein manueller Lauf kann diese nicht vorwegnehmen.

Die GitHub-Abnahme deckte zwei Bootstrapfehler auf: `runner.temp` ist im Job-`env` nicht verfügbar, und der npm-Cache von `setup-node` ruft npm vor dessen erforderlicher Versionspinning-Stufe auf. Die Workflows konfigurieren den absoluten Downloadcache deshalb in einem Schritt ohne npm-Abhängigkeit und verwenden `actions/cache` direkt. Ein einzelner Chrome-Sessionstart überschritt außerdem seine Deadline; der Capability-Probe bewahrt nun begrenzte Driver-Logs auf. Fachliche Fehler und Zeitüberschreitungen bleiben fehlgeschlagene Ergebnisse.
