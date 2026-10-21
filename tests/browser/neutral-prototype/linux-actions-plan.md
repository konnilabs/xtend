# Isolierte Linux-Actions-Qualifikation — nur lokal vorbereitet

Der neue Workflow `.github/workflows/xtend-firefox-qualification.yml` hat
nur `workflow_dispatch`, `contents: read`, keine Secrets, keine Publish-Schritte
und keine Verbindung zu bestehenden Gates. Er wurde nicht veröffentlicht oder gestartet.

## Umfang und Ressourcen

| Modus | Frische Browser-VMs | Geplante Sessions | Zweck |
| --- | --- | --- | --- |
| initial | 2, eine pro Node-Version | 2 | Provisionierung, Linux-Beobachter und Produktverträge erstmals prüfen |
| stability | 6, drei pro Node-Version | 12, zwei pro VM | Kaltstarts und Cleanup/Folgestart auf mehreren Hosts prüfen |

Je Kampagne kommt eine Aggregations-VM hinzu. `max-parallel: 2`, 15 Minuten
Joblimit und 5 Minuten Aggregationslimit begrenzen die Job-Laufzeitbudgets auf
35 bzw. 95 VM-Minuten; Queue-/Setup-Overhead ist darin nicht zugesichert.
Die frühere pauschale Forderung nach 40 VMs ist damit ersetzt. Weitere Batches
erst nach Auswertung und bewusstem Auftrag. Zwei Sessions pro VM sind vorher
geplant, keine Wiederholung nur fehlgeschlagener Fälle. Jeder Fehler bleibt erhalten;
unsicherer Cleanup blockiert Folgestarts. `fail-fast: false`, kein `continue-on-error`.

## Reproduzierbare Eingaben

`toolchain-pins.json` enthält die offiziellen URLs und SHA256s:

- Firefox 158.0.1 Linux x86_64/en-US:
  `dce45470139242cf294eb6ada3d192a9bb334696842b02b71ade448a139eb41a`.
- Geckodriver 0.37.1 Linux64:
  `e815130ea95983e162ae91843b48d3a3ce991735635fce83a647afde21e09f7e`.
- Node 24.18.0 und 26.5.0; npm 11.17.0 in jobprivatem Prefix.
- Actions auf die vorhandenen geprüften Repository-SHAs gepinnt; Checkout exakt
  `github.sha`, keine persistierten Credentials, unverändertes Dependency-Lockfile.

Quellen der Browser-/Driver-Pins: [Mozilla SHA256SUMS](https://archive.mozilla.org/pub/firefox/releases/158.0.1/SHA256SUMS)
und [Mozilla-Release-API](https://api.github.com/repos/mozilla/geckodriver/releases/tags/v0.37.1).
Linux-Archive wurden auf dem Mac nicht ausgeführt. Der Installer prüft Downloads
vor Extraktion, nutzt den sicheren Python-Tarfilter und bindet installierte Dateien
an Digests. Jeder Browserlauf prüft Archive und installierte Dateien erneut.

`ubuntu-24.04` liefert eine frische volle VM, aber kein unveränderliches Image.
ImageOS/ImageVersion, Kernel, User sowie AppArmor-/Userns-Metadaten werden erfasst.
Browser und Driver laufen unprivilegiert, mit privaten Profil-/App-Daten und
loopbackgebundenem Driver. Keine Sandboxflags, globalen Schutzänderungen oder
zusätzlichen Produktionsabhängigkeiten. Runtime-Evidenz und Warning-Policy werden
nach den bestehenden Repository-Konventionen erfasst; Action-Runtimes erhalten
keinen Node-Preload.

## Linux-Sandbox-/Ownership-Vertrag

Die bestehende Datei `tests/security/owned-browser-process.cjs` bleibt unverändert.
Sie verwaltet die ursprüngliche Gruppe mit kontinuierlichen Identitäten und
begrenztem Cleanup. Der neue Beobachter bindet zusätzlich `/proc`-Startzeit,
Session/Gruppe, Executable, UID, Profilpfad und Firefox-Content-Rolle; er lehnt
PID-Wiederverwendung, verlorene Kontinuität und entkommene Nachkommen ab.

Jeder beobachtete Content-Thread benötigt Seccomp-Filtermodus, `NoNewPrivs=1`,
keine effektiven Linux-Capabilities und mehr Filter als der Browser-Elternprozess.
Ein vom Host geerbter Filter allein genügt nicht. Namespace-Unterschiede werden
separat berichtet. Der Beleg gilt vor und nach den Produktprüfungen; er beweist
keinen vollständigen Filterregelinhalt, keine Broker-Policy und nicht jede
Subprozessrolle. Chromium-spezifische Verträge werden damit nicht ersetzt.

Auf dem Mac ist nur diese Entscheidungslogik mit Datenmodellen getestet. Ein echter
Linux-Lauf fehlt. Fehlende oder geschützte `/proc`-Daten ergeben Infrastruktur-
blockade bzw. Fehler, keinen angenommenen Pass. Der erste Linux-Lauf muss die
praktische Beobachtbarkeit und sichere Ausführung erst belegen.

## Abnahme und Fehlerartefakte

Start, Security-Assertions, Sandbox, Capabilities, einzelne Standardfixtures,
BiDi, Preload-/Transport-Cleanup und Session-/Gruppen-Cleanup sind getrennt.
Alle geplanten Jobs und Sessions müssen vollständig bestehen. Fehlende, doppelte,
abgebrochene oder übersprungene Jobs, Setupfehler, gemischte Commits/Run-IDs,
fehlende Phasen und Cleanup-Reste lassen die Aggregation scheitern.

Der Lifecycle-Negativfall behält sein tatsächliches fehlgeschlagenes Produktresultat;
nur das Erkennen exakt dieses erwarteten Fehlers besteht als Negativkontrolle.
Artefakte werden auch nach Fehlern gespeichert: Step-Ausgänge, Runtime-/Toolchain-
Provenienz, Berichte, Prozessbeobachtungen, vollständige Driverlogs, Controller-TAP
und Warning-Evidenz. Keine Testprofile, persönlichen Daten oder vollständigen
Umgebungen werden hochgeladen. Ein fehlendes Artefakt ist fehlende Evidenz.

Alle Berichte behalten `acceptedForRelease:false`. Drei fehlerfreie unabhängige
VMs pro Node-Lane liefern selbst idealisiert nur eine einseitige 95%-Obergrenze
von ca. 63% für die Fehlerquote. Mehrere Sessions auf derselben VM sind keine
unabhängigen Hostbeobachtungen. Die Serie ist eine praktische Wiederholungsprüfung,
keine statistische Stabilitätsgarantie oder automatische Release-Freigabe.

## Entscheidungen vor externer Ausführung

1. Readiness ist am dokumentierten Boot-Promise ausgerichtet. Der separat genehmigte
   XRouter-Fix besteht die 33 Core-/A11y-Assertions lokal auf beiden Node-Versionen;
   Assertions und Reihenfolge der Routen bleiben unverändert. Die externe Linux-
   Qualifikation benötigt weiterhin eine gesonderte Freigabe.
2. Ein neuer manueller Workflow muss laut [GitHub](https://docs.github.com/actions/managing-workflow-runs/manually-running-a-workflow)
   zunächst auf dem Default-Branch vorhanden sein. Ein Push allein auf #117 ist
   kein zugesicherter Dispatch-Weg. Workflowregistrierung oder ein separat
   freizugebender isolierter Trigger müssen vor externer Ausführung entschieden
   werden. Ein Merge wird dafür nicht vorweggenommen.
3. Neue Dateien sind in der Core-Quellenliste registriert, der einzige neue
   Schema-Verwendungsort ist eine Testfixture; die Controllersuite ist opt-in.
   Die vollständige Release-Abnahme bleibt ein separater Schritt.
4. Erst nach echter Linux-Evidenz separat über Release-Vertragszuordnung entscheiden.
   Bestehende Pflichtchecks und Security-/Release-Anforderungen bleiben unverändert.

Referenzen: [W3C BiDi](https://www.w3.org/TR/webdriver-bidi/),
[Mozillas Linux-Sandbox](https://raw.githubusercontent.com/mozilla-firefox/firefox/main/security/sandbox/linux/Sandbox.cpp),
[Mozilla Namespace-/AppArmor-Erkennung](https://raw.githubusercontent.com/mozilla-firefox/firefox/main/security/sandbox/linux/SandboxInfo.cpp),
[GitHub-hosted Runner](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).

## Aktivierung ohne Default-Branch-Schreibzugriff — Vorschlag, nicht angewendet

Empfohlen ist nach gesonderter Freigabe ein einmaliger, eng gefilterter `push`
auf einen neuen Qualifizierungsbranch **ohne PR**. Anders als der erstmalige
manuelle Dispatch kann dieser Trigger den Workflow vom gepushten Branch lesen.
[GitHub: Push-Trigger und Branchfilter](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#push).
Der aktuelle lokale Workflow bleibt bis zu dieser Entscheidung unverändert manuell.

Der konkrete Initialvorschlag wäre `qualification/firefox-initial-20261021`.
Nur der neue Workflow bekäme den exakten Branchfilter, ohne Wildcard:

```yaml
on:
  push:
    branches: [qualification/firefox-initial-20261021]
```

Dabei `QUAL_MODE` in beiden Jobs fest auf `initial` setzen und die Initialmatrix
auf eine Replik pro Node festlegen. Die Job-Bedingung begrenzt die Ausführung auf
`github.repository == 'konnilabs/xtend'`, `github.event_name == 'push'` und exakt
`refs/heads/qualification/firefox-initial-20261021`. Checkout und Kampagnenberichte
binden weiterhin `github.sha`. Vor dem Push muss der Remote-Branch nachweislich
fehlen; kein Force-Push, kein Überschreiben. Den bestätigten Remote-SHA mit dem
Run-SHA vergleichen. Keine produktiven Environments, Secrets, Deploy-/Publish-
Schritte, Schreibrechte oder `pull_request_target` verwenden.

Die bestehenden Workflows dieses lokalen Standes starten auf Push nur für
`main`, `master` oder `develop`; andere besitzen nur manuelle, zeitgesteuerte oder
PR-Trigger. Ein neuer Qualifizierungsbranch ohne PR passt dazu nicht. Diese
Trigger müssen unmittelbar vor einem später genehmigten Push erneut gegen den
aktuellen Remote-Stand geprüft werden; vorhandene Workflows bleiben unverändert.

Erst nach Bewertung dieses vollständigen Initiallaufs: separater genehmigter
Stabilitätsbranch mit eigenem exaktem Filter, festem `stability`-Modus und drei
Repliken. Das verhindert versehentliche Großserien durch weitere PR-Pushes.
Eine Branchlöschung oder Registrierung auf dem Default-Branch ist für den ersten
Nachweis nicht nötig. Ohne Branch-Schreibberechtigung bleibt auch dieser Weg
blockiert; es wird keine alternative Berechtigung oder Sicherheitsänderung angenommen.
