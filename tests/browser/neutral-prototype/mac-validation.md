> Historischer engerer Prüfumfang. Der aktuelle erweiterte Lauf scheitert an Core/A11y; siehe [Qualifizierungsreview](qualification-review.md).

# Echte Firefox-Validierung auf macOS — 2026-10-21

Der korrigierte lokale Prototyp besteht eine echte Firefox-Session auf **Node
24.18.0** und eine auf **Node 26.5.0**, jeweils mit Warning-/Deprecation-Preload.
Host: macOS **27.0.1**, arm64, unprivilegierter User. Das ist begrenzte lokale
Produktevidenz, keine Stabilitätskampagne, Linux-Qualifikation oder Releasefreigabe.

## Herkunft und Installation

Isolierter Testpfad: `/tmp/xtend-firefox-toolchain-20261021`. Keine globale
Installation, keine Änderung von Standardbrowser, vorhandenen Profilen oder
Sicherheitsfreigaben. Profile, temporäre Dateien und Firefox-Anwendungsdaten sind
pro Lauf privat. Browser-Sandbox und Zertifikatsprüfung bleiben aktiv.

| Artefakt | Version / SHA256 |
| --- | --- |
| Firefox-DMG, mac/en-US | 158.0.1 / `1d7aa96b51fc9110185047de18228ac87238fba5e42bba53c9d696f88878cba6` |
| Geckodriver, macos-aarch64 | 0.37.1 / `d02b3f7003f999caf90974a2ef5da0286c05d01cee19112c86846d759fdba4f5` |
| Tatsächliches Firefox-Executable | `0b406e1d7c88d48c13f6389e05f22dedcb6ab99f06e539150a49e4ba995d0386` |
| Tatsächliches Geckodriver-Executable | `5d82307edc8549124bd4e7b6f275e1228e0a530e5abbfb294be3f310486561a4` |

Quellen: [Mozilla Firefox-Archiv](https://archive.mozilla.org/pub/firefox/releases/158.0.1/mac/en-US/Firefox%20158.0.1.dmg),
[Mozilla SHA256SUMS](https://archive.mozilla.org/pub/firefox/releases/158.0.1/SHA256SUMS),
[Mozilla Geckodriver-Release](https://github.com/mozilla/geckodriver/releases/tag/v0.37.1).
Die Hashes wurden vor dem Entpacken geprüft. Das DMG wurde nur lesend eingebunden
und danach erfolgreich ausgehängt. Beide Executables sind von Mozilla Corporation
signiert (Team `43AQ936H96`); Firefox besteht die Gatekeeper-App-Prüfung.

`spctl --assess --type execute` klassifiziert das einzelne Driver-CLI nicht als
App. Die dafür geeignete Prüfung `codesign --verify --strict -R=notarized
--check-notarization` bestand positiv, einschließlich expliziter Notarisierungs-
Anforderung. Kein Quarantäneattribut wurde entfernt, keine Signatur ersetzt und
keine Warnung durch eine Sicherheitsfreigabe umgangen.

## Tatsächliche Läufe, einschließlich Fehlern

| Lauf | Start | macOS-Beobachter | Produkt | Session-/Gruppen-Cleanup |
| --- | --- | --- | --- | --- |
| Node 24, Versuch 1 | Fehler: Could not find profile folder | nicht ausgeführt | nicht ausgeführt | kein Sessionhandle; Gruppenprüfung EPERM |
| Node 24, Versuch 2 | gleicher Startfehler, privates Profil unter /tmp | nicht ausgeführt | nicht ausgeführt | kein Sessionhandle; Gruppe vollständig beendet |
| Node 24, Versuch 3 | bestanden, isolierte App-Daten | Fehler in Rollenbestimmung | nicht ausgeführt | beide bestanden |
| Node 24, Versuch 4 | bestanden | begrenzter Beleg bestanden | Assertionkette bestanden | beide bestanden |
| Node 26, Versuch 1 | bestanden | begrenzter Beleg bestanden | Assertionkette bestanden | beide bestanden |

Die ersten drei Fehler wurden nicht durch blinde Retries entfernt. Nach Versuch 1
wurde die Gruppe zusätzlich lesend als nicht mehr vorhanden bestätigt. Die lokale
Abschlussprüfung wartet nun auf das reaped Child, bevor sie das Verschwinden der
Gruppe über ESRCH bestätigt. EPERM wird dabei nicht als Erfolg akzeptiert.

Das Verschieben allein des Profils löste den Startfehler nicht. Erst eigene
`MOZ_APP_DATA`-/`MOZ_LOCAL_APP_DATA`-Verzeichnisse ermöglichten den Start. Mozilla
beschreibt diese Isolierung für Geckodriver in [Bug 2078511](https://bugzilla.mozilla.org/show_bug.cgi?id=2078511).
Dies stützt die bekannte macOS-App-Daten-Kompatibilitätsklasse; eine vollständige
TCC-Ursachenanalyse dieses Hosts wurde nicht vorgenommen.

Der Rollenbeobachter erwartete zunächst fälschlich `-contentproc`. Der getrennte
macOS-`plugin-container` verwendet laut [MozillaRuntimeMain.cpp](https://raw.githubusercontent.com/mozilla-firefox/firefox/main/ipc/app/MozillaRuntimeMain.cpp)
den letzten Parameter als Prozesstyp. Diese Erkennung wurde korrigiert; die echte
Sandboxbeobachtung wurde nicht durch eine angenommene Browserfähigkeit ersetzt.

## Abdeckung und Grenzen

In beiden erfolgreichen Sessions wurden nativ DOM, Custom Elements, Shadow DOM,
Trusted Types, Ablehnung roher HTML-Strings und die CSP-Policy-Allowlist beobachtet.
Native Sanitizer-Verfügbarkeit wurde ebenfalls beobachtet; sie ersetzt nicht
DOMPurify. Die unverändert übernommene Assertionkette aus
`tests/security/browser.test.mjs` prüft DOMPurify-TrustedHTML, den RMT-HTML-Sink,
entfernte aktive Elemente/Attribute und den Browser-Reparse dreier SSR-XSS-Payloads.
Die Kette liefert einen gemeinsamen Resultcheck, keine einzeln gezählten Tests.
Die bloße Verfügbarkeit von Custom Elements/Shadow DOM ersetzt deren komplette
Produktfixtures nicht; diese wurden hier nicht ausgeführt.

Der Sandboxbeleg bindet Browser-/Driver-Pfad und Version, UID, Prozessgruppen-
Kontinuität und private Profile. Vor und nach den Produktassertions wurden die
beobachteten eigenen Content-Prozesse mit `sandbox_check(pid, NULL, 0) == 1`
geprüft. Dieselbe OS-Abfrage verwendet [Mozillas macOS-Sandboxcode](https://raw.githubusercontent.com/mozilla-firefox/firefox/main/security/sandbox/mac/Sandbox.mm).
Sie belegt aktiven Seatbelt auf diesen Prozessen, **nicht die Policy-Stärke,
jede Prozessrolle oder Linux-Sandboxanforderungen**.

Beide erfolgreichen Logs enthalten weiterhin je zehn
`sandbox_extension_issue_file_to_process ... Operation not permitted`-Diagnosen,
eine `RenderCompositorSWGL`-Diagnose und Remote-Settings-/Shutdown-Meldungen.
Diese sind gespeichert und nicht als gelöst bewertet. Der begrenzte Content-
Seatbelt-Beleg und die Produktassertions bestanden trotz dieser Meldungen; eine
vollständige macOS-Sandboxqualifikation lässt sich daraus nicht ableiten.

Controller/Fixture-Regressionen: **20/20 pro Node-Version**, keine Fehler oder
Skips. Diese Tests nutzen Browser-Testdoubles; sie zählen nicht als echte Sessions.
BiDi-Preloads, echte Linux-Ausführung, vollständige Produktfixtures, breite
Regressionen und bestehende Release-Gates: **nicht ausgeführt / nicht erbracht**.
Alle realen Berichte behalten `acceptedForRelease:false`.

## Reviewbare Artefakte und nächste Schritte

Checkout: `/tmp/xtend-firefox-neutral-20261021`, unveränderter Basiscommit
`ad36c290cfc34e6b7cce8a0f424d4162319e5a84`, keine neuen Commits oder Pushes.
Gesammelte Berichte, Prozessbeobachtungen, Driverlogs, Installationsprüfung und
Vorher-/Nachher-Vergleich:
`/Users/konnitroetscher/Documents/Codex/2026-10-19/task/firefox-real-validation-20261021`.
Die geprüften `profiles.ini`-/`installs.ini`-Zustände sowie der Hash der
Standard-App-Zuordnungen blieben unverändert.

Vor Linux-Actions müssen Linux-Ownership-/Sandboxbeobachter und BiDi-Preload
implementiert und negativ geprüft sowie die genauen Fixtureverträge registriert
werden. Der [Qualifizierungsplan](linux-actions-plan.md) ist vorbereitet; externe
Workflowänderung oder Ausführung benötigt einen gesonderten Auftrag. Eine mögliche
Release-Zuordnung von Verträgen zu Browserprofilen bleibt eine eigene Entscheidung.
