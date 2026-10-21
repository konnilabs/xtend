# Browserneutraler XTend-Runner: lokaler Qualifizierungsprototyp

Stand 2026-10-21 auf `ad36c290cfc34e6b7cce8a0f424d4162319e5a84`.
Nur lokaler Patch: kein Commit, Push, Workflowlauf oder Änderung bestehender Gates.
Der aktuelle [Reviewbericht](qualification-review.md) enthält echte Testergebnisse
und offene Entscheidungen; der [Actions-Plan](linux-actions-plan.md) beschreibt
Ressourcen und Abnahmekriterien. Alle Berichte tragen `acceptedForRelease:false`.

## Abhängigkeitsgrenze

XTend bekommt keine Browser-Laufzeitabhängigkeit. Der Adapter liegt ausschließlich
unter `tests/`; Paketmanifeste und Lockfiles bleiben unverändert. Er nutzt den
vorhandenen W3C-WebDriver-HTTP-Transport und Node-WebSocket für WebDriver BiDi.
Browserabhängige Automation und OS-Sandboxbelege bleiben getrennt von den
Produktassertions. Das ausgelieferte `tools/browser-hypervisor` wird nicht geändert.
Dessen Chromium-Defaults werden nicht übernommen; die neue Session setzt nur das
explizite Binary, Headless und sichere Standardfähigkeiten.

## Abdeckung und Implementierung

| Bereich | Implementierung und Grenze |
| --- | --- |
| Standard-Web-APIs | Gepinnte Core-/A11y-Fixtures mit dokumentiertem Boot-Warten und unveränderten Assertions; Lifecycle-Fixture mit exakt 17, 16 und 6 Check-IDs; weitere Katalogfixtures bleiben offen. |
| Sanitizer / Trusted Types | Gepflegte Security-Assertions unverändert übernommen: DOMPurify, native TrustedHTML-Sinks, CSP, SSR-Reparse. Native Sanitizer-Verfügbarkeit wird nur beobachtet. |
| Preload | BiDi vor Navigation im passenden Kontext; ursprüngliches Hydrangea-Fetch-Preload, Reihenfolge, Abort, Kontextisolation und Entfernung. Kein vollständiger Hydrangea-Appserver-Lauf. |
| Negative Produktkontrollen | Falscher Resultkey und Fremdursprungsbild aus bestehendem Lifecycle-Vertrag. Tatsächlicher negativer Produktstatus bleibt im Bericht erhalten. |
| Linux-Sandbox | Neuer `/proc`-Beobachter: Executable/UID/Startzeit, Gruppen-/Sessionkontinuität, Content-Threads mit zusätzlichem Seccomp-Filter, NoNewPrivs und null effektiven Capabilities; reale Linux-Ausführung fehlt. |
| macOS-Sandbox | Aktive Seatbelt-Sandbox auf beobachteten eigenen Content-Prozessen vor/nach Assertions. Keine vollständige Policy- oder Linux-Attestation. |
| Engine-spezifische Verträge | Bestehende Chromium-Security-Belege und Capability-Labs bleiben separat erforderlich. Firefox-Erfolge ersetzen sie nicht automatisch. |

`adapter.cjs` trennt Start, Sandbox, Capabilities, Produkt, Qualifikation und beide
Cleanup-Ebenen. Leere/fehlende Checks, Skips, Timeouts und Assertionfehler sind
nicht erfolgreich. `bidi.cjs` bindet den Loopback-Endpunkt an die ausgehandelte
Session, korreliert Antworten und prüft Ownership und Deadlines.

`run-firefox.cjs` verwendet isolierte Profile und Anwendungsdaten. Auf Linux
bindet `linux-observer.cjs` die vorhandene unveränderte Prozessgruppenverwaltung
an zusätzliche Kernelbeobachtungen; auf dem Mac wird `mac-owner.cjs` verwendet.
Bei verlorener Identität wird kein ungesichertes Gruppensignal gesendet. Fehlende
Cleanup-Evidenz verhindert Erfolg und weitere Kampagnenstarts.

`fixture-contracts.json` bindet die gepflegten Fixtures und Preloadquelle an
SHA256. `capability-matrix.json` unterscheidet erbrachte Belege und Lücken.
`campaign.cjs` fordert jede geplante Session, alle Phasen, gemeinsame Commit-/Run-
Provenienz und terminale Workflow-Step-Ergebnisse. Testdoubles zählen nie als
Browser- oder Kernelbeweis.

## Tatsächliche lokale Ergebnisse

Firefox **158.0.1**, Geckodriver **0.37.1**, macOS **27.0.1 arm64**:

- Auf Node **24.18.0** und **26.5.0** jeweils **40/40** Controller-/Negativ-/Readiness-Tests
  und **158/158** bestehende Runtime-Policy-Prüfungen bestanden, keine Skips.
- Echte finale Sessions auf beiden Node-Versionen: Start, CSP/Trusted Types,
  gepflegte Security-Assertionkette, alle drei BiDi-Fälle, Lifecycle mit sechs
  Checks und beide negativen Kontrollen bestanden.
- Core und A11y: dokumentierter Boot-Promise wird jetzt korrekt abgewartet.
  Danach besteht ein separater XRouter-Produktfehler: `/` matcht als erster Präfix
  auch `/detail`. Core erreicht 5/17, A11y 2/16 Assertions; 26 bleiben unerreicht.
  Die Runtime wird nicht geändert; Details und Fixvorschlag im Reviewbericht.
- Beobachtete macOS-Content-Sandbox, Preload-/Transport-Cleanup sowie Session- und
  Prozessgruppen-Cleanup bestanden. Browserdiagnosen und frühe Fehlversuche bleiben
  in den Artefakten erhalten. Die Gesamtqualifikation ist **fehlgeschlagen**.

Die engere frühere [macOS-Validierung](mac-validation.md) ist historisch.
Linux-Observer und Provisionierung sind implementiert, aber nicht auf einem echten
Linux-Kernel ausgeführt. Modelltests ersetzen diesen Nachweis nicht.

## Reproduktion und nächster Umfang

Mit einer der gepinnten Node-Versionen und vorhandenen Projektabhängigkeiten:

```sh
node --trace-warnings --trace-deprecation --require ./scripts/node_warning_policy.cjs scripts/run_xtend_tests.js firefox-qualification-controls
node --trace-warnings --trace-deprecation --require ./scripts/node_warning_policy.cjs tests/browser/neutral-prototype/run-firefox.cjs /absolut/neues-testverzeichnis /absolut/isolierte-toolchain
```

Der echte Runner verlangt ein neues privates Ausgabeverzeichnis. Auf dem Mac
werden Signatur und Notarisierung erneut regulär geprüft, auf Linux die gepinnten
Archive und installierten Dateien. Keine Sandbox-Ausnahmen oder Profilübernahme.
`local-availability.cjs` bleibt eine rein lesende Suche mit Exit 2, kein Testpass.

Der isolierte manuelle Workflow plant zunächst **2 frische VMs / 2 Sessions**, dann
optional **6 frische VMs / 12 geplante Sessions**, jeweils plus Aggregator. Es gibt
keine automatischen Fehler-Retries. Drei Hosts pro Node sind keine statistische
Stabilitätsgarantie. Ein exakter neuer Push-Branch ist als Aktivierungsweg ohne Default-Branch-Schreibzugriff
vorgeschlagen, noch nicht aktiviert. Quellenliste und optionale Testsuite sind registriert.
Der XRouter-Produktfehler braucht einen separaten Runtime-Fixauftrag.
Bestehende Gates wurden nicht vollständig wiederholt, Release-Anforderungen nicht
geändert. Der lokale `node_modules`-Symlink ist kein Bestandteil des Patches.

## Offizielle Quellen (abgerufen 2026-10-21)

- [Mozilla Remote Protocols](https://firefox-source-docs.mozilla.org/remote/index.html)
- [Mozilla: CDP Retirement in Firefox](https://fxdx.dev/cdp-retirement-in-firefox/)
- [Geckodriver-Kompatibilität](https://firefox-source-docs.mozilla.org/testing/geckodriver/Support.html)
- [Geckodriver Usage / Snap-Einschränkungen](https://firefox-source-docs.mozilla.org/testing/geckodriver/Usage.html)
- [Geckodriver-Profile und Automations-Prefs](https://firefox-source-docs.mozilla.org/testing/geckodriver/Profiles.html)
- [Geckodriver-Flags und Systemzugriff](https://firefox-source-docs.mozilla.org/testing/geckodriver/Flags.html)
- [Remote-Agent-Sicherheitsmodell](https://firefox-source-docs.mozilla.org/remote/Security.html)
- [WebDriver webSocketUrl](https://developer.mozilla.org/en-US/docs/Web/WebDriver/Reference/Capabilities/webSocketUrl)
- [W3C WebDriver BiDi](https://www.w3.org/TR/webdriver-bidi/)
- [Firefox 148: Trusted Types und Sanitizer](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/148)
- [CSP require-trusted-types-for](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/require-trusted-types-for)
- [Offizielle Firefox-Versionen](https://product-details.mozilla.org/1.0/firefox_versions.json)
