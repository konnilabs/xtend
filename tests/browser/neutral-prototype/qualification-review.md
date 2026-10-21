# Firefox-Qualifizierung und Readiness: lokaler Reviewstand, 2026-10-21

Basis `ad36c290cfc34e6b7cce8a0f424d4162319e5a84`, isolierter Checkout
`/tmp/xtend-firefox-neutral-20261021`. Kein Push, Dispatch, PR-Edit, Merge oder
Publish. Bestehende Workflows, Gate-Profile, Pflichtchecks, Runtime-Dateien und
Produktabhängigkeiten bleiben unverändert. Alle Evidenzberichte behalten
`acceptedForRelease:false`.

## Minimaler Fixture-Fix und belegter Ready-Vertrag

`docs/en/xtend-classic.md:44`, die deutsche Parallelfassung und
`xtend-loader.d.ts:259` dokumentieren `window.__XTendLoaderBootPromise` als Abschluss
des initialen Boots. `initiateXTend` in `xtend-loader.js` lädt Core-/Preload-/DOM-
Komponenten und wartet im `finally` auf `initializeApi`, bevor es zurückkehrt.
Das `load`-Ereignis wartet nicht auf diese asynchrone Fortsetzung.

Beide Fixtures verlangen jetzt den vorhandenen Promise und warten auf ihn;
fehlender oder abgelehnter Boot wird als Fehler erhalten. Im unveränderten
anschließenden Readiness-Prädikat steht `window.XTend` vor `.state`. Keine Sleeps,
neuen Retries, veränderten Produktassertions oder umgeordneten Routen. Ein erfüllter
Boot allein ist kein Erfolg: alle vorhandenen Capability-/Produktprüfungen bleiben.

Sechs zusätzliche Regressionen führen genau den Readiness-Abschnitt der beiden
Fixtures aus: ausstehender Boot, fehlender/abgelehnter Boot und unvollständiger Boot
mit noch fehlendem XTend. Die 17 Core- und 16 A11y-Check-IDs bleiben exakt gebunden.

## Tatsächlicher neuer Blocker: XRouter-Präfixmatching

Nach dem Readiness-Fix bestehen in echtem Firefox auf Node 24 und 26 jeweils die
ersten fünf Core-Checks und die ersten zwei A11y-Checks. Die anschließende
Navigation schlägt fehl. URL, Route-State und Query zeigen `/detail?source=...`,
aber die ausgewählte/gerenderte Komponente bleibt `xtend-smoke-home` bzw.
`xtend-keyboard-home`.

Ursache im unveränderten Produktionscode `components/xrouter.js:2053`:
`_matchRoute` akzeptiert den ersten passenden Präfix. Für die zuerst deklarierte
Route `/` ist die Segmentliste leer; `isMatch` bleibt true. Ohne erfolgreiche
Kindroute wird trotzdem diese Route zurückgegeben, auch wenn Segmente des
Zielpfads übrig sind. Ein isolierter Aufruf der tatsächlichen unmodifizierten
Methode reproduziert die Auswahl von Home für `/detail` und `/unmatched` auf
beiden Node-Versionen. Dies ist kein belegter Firefox-Upstream-Fehler.

**Kein Runtime-Fix wurde angewendet.** Minimaler Vorschlag für einen getrennten
Auftrag: Ein Blatt darf nur bei vollständig verbrauchtem Pfad matchen; verbleibende
Segmente müssen erfolgreich durch Kindrouten konsumiert werden, andernfalls die
nächste Geschwisterroute prüfen. Redirects/Aliases und Wildcard-Fallback dabei
explizit regressieren. Die zwei statischen SSR-/Preload-Matcher enthalten dieselbe
Präfixlogik und müssen in dieser Entscheidung mitgeprüft werden. Mindestfälle:
Root vor Detail, unbekannter Pfad, verschachtelte Parameter, Alias und Redirect.
Die Fixture-Routen umzuordnen würde den produktiven Fehler lediglich umgehen.

## Ergebnisse und Grenzen

| Prüfung | Node 24.18.0 | Node 26.5.0 |
| --- | --- | --- |
| Controller-/Negativ-/Readiness-/Aggregatortests | 40/40 | 40/40 |
| Bestehende Runner-Regression | 40/40 | 40/40 |
| Bestehende Runtime-Policy | 158/158 | 158/158 |
| Echter Firefox: Start, CSP/TT, Security-Assertionkette | bestanden | bestanden |
| Echter Firefox: BiDi-Reihenfolge, Kontextisolation, Entfernung, Fetch/Abort | bestanden | bestanden |
| Echter Firefox: Lifecycle mit 6 Checks und beide Negativkontrollen | bestanden | bestanden |
| Echter Firefox: Core / A11y | 5/17 und 2/16 erreicht; Navigation fehlgeschlagen | gleich |
| Begrenzter macOS-Seatbelt-Beleg und Session-/Gruppen-/BiDi-Cleanup | bestanden | bestanden |
| Echter Linux-Lauf / Actions | nicht erbracht | nicht erbracht |

Die Gesamtqualifikation bleibt fehlgeschlagen. **26 der 33 Core-/A11y-Assertions
sind wegen der vorherigen Navigation nicht erreicht, nicht bestanden.** Sie werden
nicht aus dem Soll entfernt. Der verpflichtete Fixturelauf wurde auf beiden
Node-Versionen ausgeführt; ein vollständiger 33/33-Pass ist innerhalb des erlaubten
Fixture-Fixes wegen des separaten Produktionsfehlers nicht herstellbar.

## Registrierung und sichere externe Vorbereitung

`firefox-qualification-controls` ist als explizit optionale Suite mit eigenem
Handler/Profile registriert. Kein bestehendes Profil erhält zusätzliche Suites.
Der neue Code ist in der vollständigen Core-Quellenliste erfasst. Im privaten
Inventar kommt ausschließlich der Fixture-Server als Testverwendung der bereits
registrierten Sanitizer-Grenze hinzu; keine neuen Schemas, keine Fingerprint-,
Lifecycle- oder Release-Entscheidungen. Inventory-/Membership-/Decision-Hashes
werden mechanisch nachgeführt. Der historische Legacy-Inventarstand bleibt erhalten.

[Linux-Plan](linux-actions-plan.md): zunächst 2 frische VMs / 2 Sessions, anschließend
optional 6 VMs / 12 geplante Sessions, jeweils plus Aggregator. Keine Fehler-Retries
oder als Pass gezählten Skips. Als Aktivierungsweg ist ein separat genehmigter
Push auf einen exakten neuen Qualifizierungsbranch ohne PR vorbereitet; keine
Default-Branch-Änderung erforderlich. Der Trigger-Vorschlag ist nicht angewendet.

Aktuelle Belege und aktualisierter Patch:
`/Users/konnitroetscher/Documents/Codex/2026-10-19/task/firefox-readiness-20261021`.
Die früheren acht Prototypversuche bleiben im Vorgänger-Artefaktverzeichnis erhalten.
