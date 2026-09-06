# XTend.store — Laravel, Maraca, Resume und XScaler

Produkt: `products/xtend-shop`. Ausgangspunkt ist der genehmigte Shop-Plan; Node bleibt eine eigenständige SSR-Umgebung.

## Implementierung

- Laravel-13-Product mit separat gesperrtem Laravel-12-Kompatibilitätspfad, SQLite, Datenbank-Sessions, 36 Produkten und 72 Varianten. Einrichtung und ausdrücklich angeforderter Reset sind getrennt.
- Eigene deutsche XTM-Oberfläche mit lokalem Bildmaterial, Suche, URL-Filtern, Produktvarianten, Mini-Cart, mobiler Filterfläche, Warenkorb, Checkout und Bestellbestätigung.
- Gemeinsamer Compiler-Cache für portable Projektion und Maraca-Bundles. PHP signiert den tatsächlichen dynamischen Zustand; der Browser prüft den öffentlichen P-256-Buildschlüssel. Frühe Actions werden einmal wiederholt, native Controls adoptiert und unveränderte Shells erhalten.
- RMT übernimmt Actions, Feldvalidierung, Serverfehler, Surface-Zustand und DOM-Commits. Native GET-Formulare können über den gemeinsamen Seitenclient navigieren. Laravel-Routen und AppServices verwenden dieselben Domänendienste.
- Separater PHP-DemoPay-Host mit eigenem Bundle, Origin und Abhängigkeiten. XScaler prüft Plan/Integrität vor ATC-Attach. Drei echte Streamabschnitte verändern die Surface-Struktur. Abbruch, Zeitlimit, fehlerhafte Integrität und unzulässige Zustandsziele beenden den Versuch ohne Bestellung.
- Bestellungen und Bestand werden transaktional gespeichert. Optimistische Warenkorbversionen verhindern verlorene Aktualisierungen; parallele Wiederholungen desselben Abschlusses liefern dieselbe Bestellung. Zahlungsnachweise bleiben an Versuch, Betrag, Währung, Revision und Ablauf gebunden.
- Neue gemeinsame APIs, sichere Canonical-/JSON-LD-Head-Daten, PHP-AppService-Bridge, Paket-Fingerprints und Projektindex-Beziehungen sind additiv integriert. Bestehende Node-, Compiler-, Resume- und AppService-Zugänge bleiben erhalten.

## Lokale Abnahme

Referenzumgebung am 6. September 2026: Linux, Node 24.19.0, PHP 8.3.6, Chromium/ChromeDriver 152. Die PHP-Erweiterungen und FPM stammen aus einer isolierten lokalen Werkzeuginstallation; es wurde keine Systeminstallation vorausgesetzt.

Frische Installationen außerhalb des Checkouts bestehen mit Laravel 12.69.1 und 13.30.1. Beide verwenden regulär gepackte Frameworkpakete und Composer-Abhängigkeiten. Die laufenden Test-Deployments enthalten kein `node_modules`; PHP-Prozessausführung ist deaktiviert. Laravel 13 wurde zusätzlich mit tatsächlichen FPM-Pools hinter dem FastCGI-Testproxy ausgeführt.

Verbindliche Prüffälle liegen in `products/xtend-shop/tests`:

- Verträge und externe TypeScript-Verbraucher, Wiederverwendung von Compilerfakten, konkurrierende Seitenaktivierung, PHP/JS-Input-Policies und Signaturen.
- Native Suche und Warenkorbänderungen ohne Anwendungs-JavaScript; Such-/Filterformularnavigation mit erhaltener Shell und mobiler Filterfläche.
- Signiertes Resume, erhaltene DOM-Identität, früher einmaliger Klick, ausdrücklich erkennbarer Integritäts-Fallback und genau ein Runtime-Controller.
- RMT-Validierung und zusätzliche Laravel-Postleitzahlvalidierung, Feldfokus, erhaltene Eingaben und keine Adressdaten in URL oder History.
- Kauf, Ablehnung, Abbruch, Timeout, manipuliertes Provider-Bundle, fremdes Patch-Ziel, unvollständiger Stream und Navigation während des Payments. Eine zusätzliche Ansicht dokumentiert die vollständig gestreamte Provider-Oberfläche vor der Autorisierung.
- Gastisolation, veraltete Revisionen mit anschließender Synchronisierung, wiederholter und paralleler Bestellabschluss, Bestandsrollback und Zugriffsschutz der Bestellbestätigung.
- Fehlende Seitenartefakte, unpassende Runtime-Fingerprints, fehlende Composer-Laufzeitdateien und Warenkorberhalt über einen echten Hostneustart.

Der vollständige lokale PR-Plan besteht mit 161 Suite-IDs, ohne übersprungene Prüfungen, in rund 315 Sekunden. Gefundene Abweichungen wurden an der Quelle behoben: tatsächliche Regenerierung der Kernel- und AI-Kit-Artefakte, Ausschluss erzeugter Shop-Bundles/Installationsverzeichnisse aus der Branding-Quellprüfung und kompatible Syntax im bestehenden Docs-Compilerpfad. Weitere 28 betroffene Node-/PHP-/Maraca-/Resume-/XScaler-/Komponenten-/Paket-Suites bestehen ebenfalls. Das kanonische Shop-Profil mit drei getrennten Suites besteht vollständig, einschließlich der zusätzlichen Provider-Ansicht. Externe Typentests verwenden ausdrücklich die Shop-Abhängigkeiten; PHP wird vor Einschränkung des Testhost-Suchpfads aufgelöst. Der Paketaufbau wurde zusätzlich mit leerem npm-Download-Cache geprüft.

## Messungen und Berichte

Das Profil `xtend-shop` enthält getrennte Vertrags-, PHP- und Browser-Suites. Root-Zugänge: `npm run test:xtend-shop`, `npm run test:xtend-shop:report`; `XTEND_SHOP_FIXTURE` wählt eine extern installierte Anwendung.

Berichte liegen ignoriert unter `.xtend-test-results/xtend-store-*.json`; Browserbilder unter `.xtend-test-results/xtend-store/browser`. Direkte Product-Läufe schreiben `storage/reports`. Enthalten sind Build-/Runtime-Fingerprints, Laufzeiten, Assetgrößen, Resume-Zeiten, Frameankünfte und redigierte Diagnosen. Optionale Akzeptanzmessungen protokollieren ausschließlich Provider-Service-IDs beziehungsweise Requestart, Dauer und PHP-Speicherverbrauch.

Die initialen isolierten vollständigen Läufe benötigten lokal rund 147–148 Sekunden. Die SSR-Detailantwort umfasst derzeit rund 1 MB unkomprimiert. Dieser Wert wird sichtbar berichtet; er ist ein konkreter Ansatzpunkt für eine spätere Reduzierung redundanter Render-/Bootstrap-Daten. Die gemessenen Provider-Abschnitte kamen über FPM rund 350 ms versetzt an. Ein SSR-Erstaufruf kontaktiert den Provider nicht. Buildartefakte werden pro Request ausgewertet, ohne Compileraufruf.

## Inventar und gemeinsame Gates

Elf produktspezifische Service-/Berichtskennungen wurden gezielt beschrieben. Neun bestehende Inventareinträge haben begründete, fingerprintgebundene Ergänzungsentscheidungen; bestehende Alias-, Versions- und Migrationsentscheidungen bleiben bestehen. Der Capture-Adapter erhält erstmals eine konkrete öffentliche Deklaration; es wurde kein vorhandener veröffentlichter Deklarationsfingerprint überschrieben. Generierte Kernel- und MCP-Wissensartefakte stammen aus ihren kanonischen Quellen. Eine pauschale Baseline-Akzeptanz wurde nicht verwendet.

Die Laravel-Workflow-Matrix behält sieben Kombinationen: Laravel 12 mit PHP 8.2/8.3/8.4/8.5 und Laravel 13 mit PHP 8.3/8.4/8.5. Der vollständige Browserablauf läuft einmal je Laravel-Hauptversion; PHP-Suites werden nicht über die Node-Matrix vervielfacht. PR, Nightly und die frische Abnahme vor einer Veröffentlichung verwenden denselben Katalog. Eine Veröffentlichung hängt zusätzlich von der Laravel-/Shop-Matrix ab.

**GitHub-Nachweise:** [PR #68 und seine Checks](https://github.com/konnilabs/xtend/pull/68/checks) verbinden den Test-Branch mit den Workflows „XTend Laravel SSR“ und „XTend CI Gates“. Die Laravel-Artefakte enthalten getrennte Ausführungsberichte für den vorhandenen Adapter und den Shop, einschließlich der Browserbilder. Maßgeblich sind abgeschlossene erfolgreiche Läufe des zu prüfenden Stands. Lokale Linux-/PHP-8.3-Läufe ersetzen weder die übrigen PHP-Versionen noch Node-/OS-Matrizen.

Anleitungen: [Deutsch](../products/xtend-shop/README.md), [English](../products/xtend-shop/README.en.md), [gemeinsame Seitenlaufzeit](../docs/de/ssr-pages.md).
