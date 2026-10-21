# Firefox-Qualifizierung und separater XRouter-Fix: lokaler Reviewstand

Stand 2026-10-21, Ausgangsbasis `ad36c290cfc34e6b7cce8a0f424d4162319e5a84`.
Isolierter Checkout `/tmp/xtend-xrouter-path-consumption-20261021`.
Der Harness-/Readiness-Stand liegt im lokalen Snapshot `c70fe4e4974529096b4bbf33697f2985923ade77`;
der getrennte Router-Commit ist `032aa2a` und ändert fünf Dateien.
Kein Push, Dispatch, PR-Edit, Merge oder Publish. Bestehende Gate-Profile,
Workflows, Pflichtchecks, Sicherheitssettings und Produktabhängigkeiten bleiben
unverändert. Alle Evidenzberichte behalten `acceptedForRelease:false`.

## Ready-Vertrag und Produktionsursache

`docs/en/xtend-classic.md:44`, die deutsche Parallelfassung und
`xtend-loader.d.ts:259` dokumentieren `window.__XTendLoaderBootPromise` als Abschluss
des initialen Boots. Die beiden Fixtures warten auf diesen bestehenden Promise
und verlangen ihn ausdrücklich. Ihre anschließenden Produktassertions und die
Reihenfolge der Routen bleiben unverändert. Sechs Readiness-Regressionen prüfen
ausstehenden, fehlenden und abgelehnten Boot sowie fehlendes XTend.

Nach diesem Harness-Fix zeigte der tatsächliche Router weiterhin Home für
`/detail?source=...`, obwohl URL und Route-State Detail meldeten. Die zuerst
deklarierte Root-Route hat keine Segmente und wurde als Präfix akzeptiert.
Es handelt sich um einen belegten XTend-Produktfehler, keinen nachgewiesenen
Firefox-/Chromium-Upstream-Fehler.

## Separater minimaler Router-Fix

`components/xrouter.js` verlangt nun in `_matchRoute`, `renderRouteToString`
und `getMetaForPath` vollständigen Pfadverbrauch. Restsegmente müssen durch
Kindrouten matchen; sonst wird die nächste Geschwisterroute geprüft. Eine vollständig
gewählte Route behält ihre Alias-/Parameterwerte und ihre verschachtelte Kette.
Redirects werden erst nach erfolgreicher Auflösung ausgelöst. Eltern-Redirects
behalten Vorrang, Kind-Redirects fallen nicht als vermeintlicher No-Match durch.
`navigateRedirect:false` und `includeNotFound:false` bleiben wirksam.

SSR bleibt seiteneffektfrei; Redirect-Routen werden wie bisher als Deskriptoren
zurückgegeben. Wildcards behalten ihr bisheriges leeres Metadatenresultat,
auch bei verschachteltem Fallback vor einer späteren Geschwisterroute.

21 gezielte Tests laden die tatsächliche Router-Klasse mit isolierter DOM-
Registrierung. Ohne Fix: 5 bestanden, 16 fehlgeschlagen auf Node 24 und 26.
Mit Fix: 21/21, keine Skips. Sie sind in der vorhandenen XRouter-Komponentensuite
integriert; kein bestehendes Gate oder Profil wurde verändert.

## Ergebnisse und genaue Grenzen

| Prüfung | Node 24.18.0 | Node 26.5.0 |
| --- | --- | --- |
| Gezielte Routing-/Alias-/Redirect-/Nested-/Fallback-/SSR-Regressionen | 21/21 | 21/21 |
| Routing-UX / RMT-Navigation | 211/211 und 183/183 | gleich |
| Controller-/Negativ-/Readiness-/Aggregatortests | 40/40 | 40/40 |
| Bestehende Runner-Regression / Runtime-Policy | 40/40 und 158/158 | gleich |
| Browser-Quell-/Fixture-/Loopbackverträge, kein echter Browserbeleg | 494/494 | 494/494 |
| Echter Firefox: Start, CSP/Trusted Types, gepflegte Security-Assertionkette | bestanden | bestanden |
| Echter Firefox: BiDi-Reihenfolge, Fetch/Abort, Isolation und Entfernung | bestanden | bestanden |
| Echter Firefox: Core / A11y | 17/17 und 16/16 | 17/17 und 16/16 |
| Echter Firefox: Lifecycle und beide Negativkontrollen | 6/6 und beide bestanden | gleich |
| Begrenzter macOS-Seatbelt-Beleg und alle Cleanup-Ebenen | bestanden | bestanden |
| Enterprise-Navigation-Hardening | blockiert: fehlende Dokumentationsdatei | gleich |
| Echter Linux-Lauf / Actions | nicht erbracht | nicht erbracht |

Die Enterprise-Suite scheitert vor der Auswertung an `docs/components/xmenu.md`.
Derselbe ENOENT ist im unveränderten Ausgangssnapshot c70fe4e reproduziert;
`docs/en/components/xmenu.md` existiert. Diese unabhängige Katalog-/Dokumentations-
Inkonsistenz wird hier nicht repariert und nicht als Pass ausgegeben.

Ein erster zusätzlicher Node-24-Regressionstest lief unter gesperrtem Loopback und
versehentlich zu engem PATH: Controller `listen EPERM`, Runner `php ENOENT`.
Die Ergebnisse bleiben erhalten. Unter den benötigten lokalen Rechten und mit dem
vorhandenen PHP bestehen beide Suites; keine Testbehauptung wurde gelockert.

Firefox 158.0.1 und Geckodriver 0.37.1 stammen aus den bereits separat genehmigten
isolierten Mozilla-Downloads. Neue private Profile; reguläre Signatur- und
Notarisierungsprüfungen. macOS 27.0.1 arm64 ist keine Linux-Evidenz und beweist
weder vollständige Sandbox-Policy noch alle Subprozessrollen. Weitere
Katalogfixtures, vollständige Hydrangea-Appserver-Läufe und enginespezifische
Chromium-Verträge bleiben offen. Kein Firefox-Erfolg ersetzt sie automatisch.

## Inventar, Gesamtpatch und nächster externer Schritt

Der neue Regressionstest ist als 3417. Quellpfad registriert. Die 2098 vorhandenen
Schema-IDs, ihre Fingerprints und Release-Entscheidungen bleiben unverändert;
Membership- und Authority-Hashes sind mechanisch aktualisiert. Das bestehende
private Inventar erhält durch den Router-Fix keine neue Verwendung.
Die authentifizierten lokalen Quellarchiv-Prüfungen und finalen Dateihashes sind
im Abschlussbericht des Artefaktverzeichnisses dokumentiert.

[Linux-Plan](linux-actions-plan.md): zunächst 2 frische Browser-VMs / 2 Sessions
(Node 24 und 26) plus Aggregator; erst nach Auswertung optional 6 VMs / 12 vorab
geplante Sessions. Exakte Toolchain-Pins, getrennte Start-/Produkt-/Sandbox-/Cleanup-
Ergebnisse, vollständige Fehlerartefakte und keine Flake-Retries.

Ein separat freizugebender Push auf den exakten neuen Branch
`qualification/firefox-initial-20261021` ohne PR ist als Aktivierungsvorschlag
vorbereitet. Nur der neue Workflow bekäme den engen Push-Trigger und feste
Initialmatrix; Default-Branch-Schreibzugriff ist nicht vorausgesetzt. Der aktuelle
Workflow bleibt manuell, der Trigger wurde nicht angewendet. Vor einem genehmigten
Push müssen Remote-Heads und aktuelle Trigger erneut geprüft werden.
Die weitere Release-Vertragszuordnung und Abnahme bleiben getrennte Entscheidungen.

Aktuelle Belege und Router-/Gesamtpatch:
`/Users/konnitroetscher/Documents/Codex/2026-10-19/task/xrouter-path-consumption-20261021`.
Frühere fehlgeschlagene Browserläufe bleiben unter `firefox-readiness-20261021`
und `firefox-bidi-linux-qualification-20261021` unverändert erhalten.
# Single-run Linux diagnosis, 2026-10-21

The qualification branch now schedules exactly one Node 24.18.0 browser VM,
one fresh Firefox session and a separate aggregator in `diagnostic` mode.
Initial two-lane qualification and stability-mode acceptance remain distinct;
this run cannot supply either or grant release acceptance.

Firefox 158.0.1 forkserver titles join argv with spaces. The observer recognizes
that form and NUL-separated argv, rejects ambiguous roles, and keeps the same
executable, start identity, UID, group/session and per-thread sandbox checks.
Namespace availability remains separately visible; the documented EPERM is
not evidence of a confirmed upstream Firefox defect or absent seccomp.

Optional lifecycle diagnostics record only timestamps, PID/start/PPID/PGID/SID,
state and UID data, before/after session deletion, around existing signals and
at the first failed continuity check. Diagnostics never seed ownership or
authorize signals. The adapter retains structured cleanup failures. Driver
artifacts use a narrow lifecycle/sandbox message allowlist, omitting argv,
environment and unclassified page output.

The same pinned official archives, sandbox settings, existing product assertions
and strict cleanup requirements apply. No retries are scheduled. Every report
continues to carry `acceptedForRelease:false`. The exact outcome is recorded
in the new run's artifacts; no success or Linux coverage is assumed here.
