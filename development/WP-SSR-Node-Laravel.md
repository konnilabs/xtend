# SSR: Node und PHP/Laravel parallel entwickeln

Dieser Arbeitsstrang setzt den gemeinsamen Seitenvertrag und zwei eigenständige
SSR-Hosts um. Node bleibt Produktionslaufzeit und behält Compiler, AppServices,
Streaming und TypeScript. Laravel ergänzt einen PHP-Produktionspfad ohne Node-Prozess
nach dem Build. Der frühere Laravel-zentrierte Ansatz ist damit ersetzt.

## Implementierungsstand

| Paket | Eingebaut | Abnahme |
| --- | --- | --- |
| SSR-01 | Fehlerstatus, Resolverfehler, terminale Streams, begrenztes Node-Cleanup | Bestehende Adapter-Suites und negative Streamfälle lokal geprüft |
| SSR-02 | Compilerprojektion, deklarierte Eingänge, PHP-Fähigkeitsdiagnosen, JSON-Wertunterscheidung | Dynamische Node/PHP-Fixtures, bestehende Compiler-/Komponententests |
| SSR-03 | Seitenvertrag, Redirects, Kontextbindung, konkurrierende Navigation | Gemeinsamer Browserablauf auf Node und Laravel 12/13 lokal |
| NODE-01 | Importierbarer Host, AppService-Einbindung, Provider, Stream-Download, Paketexport | npm-Paket und strikter NodeNext-Verbraucher außerhalb des Checkouts ohne PHP; Backpressure, Disconnect und verzögerter Kontext-Cleanup lokal geprüft |
| LAR-01 | Composer-Paket, ServiceProvider, Web-Lifecycle, Blade, Artisan, Fingerprints | Isolierte Laravel-12/13-Installationen unter PHP 8.3; vollständige CI-Matrix offen |
| SSR-04 | Formularzustand, Error Bags, Multipart, Fortschritt, Abbruch, Bindung | Upload-/Validierungs-Browserabläufe und konkurrierende Antworten lokal |
| SSR-05 | Persistente Layouts, History, Head, Build-/Runtime-Abgleich, Verschlüsselung | ECDSA-Resume mit DOM-Erhalt, Signaturfehler-Fallback, Deploymentwechsel und Kontextinvalidierung lokal geprüft |
| SSR-06 | Partial/Deferred/Lazy/Merge/Once, Prefetch, Polling, Sichtbarkeit, Pagination | Selektive Provider, begrenzte Warteschlange, Schlüsselzusammenführung, beide Laravel-Paginatortypen sowie Polling/Sichtbarkeit lokal geprüft |
| SSR-07 | Node-Validierungsprovider, Precognition, Optimismus, Instant Visits, View Transitions | Livevalidierung auf beiden Hosts, ältere fehlgeschlagene Mutationen, Instant Visits und optionale View Transitions lokal geprüft |
| SSR-08 | CLI-Build, Typen, Routenexporte, Projektindex, DE/EN-Anleitung, CI-Definition | Typ-/Exportprüfungen, Projektindex und Compiler lokal geprüft; abschließende vollständige Profile und tatsächliche CI-Abnahme ausstehend |

## Kanonische Orte

- Laufzeit: `xtendrmt/page-*.mjs`, `node-page-host.mjs`, `rmt-portable-render.*`.
- PHP-Paket: `laravel/`; Verpackung aus kanonischen Dateien durch `scripts/build_laravel_package.js`.
- Build: `tools/rmt-language/page-build.js`; Projektindex-Verbindungen im Repository-Profil.
- Abnahme: `tests/ssr-pages/`; Auswahl ausschließlich im gemeinsamen Runner-Katalog.
- Anleitung: [Deutsch](../docs/de/ssr-pages.md), [English](../docs/en/ssr-pages.md).

## Nachweisgrenzen

Lokale Laravel-Tests verwenden Composer-Lockfiles mit PHP-Plattformuntergrenzen 8.2
beziehungsweise 8.3. Die vorhandene lokale PHP-Laufzeit ist 8.3; daraus folgt kein Nachweis
für andere PHP-Versionen. `.github/workflows/xtend-laravel-ssr.yml` definiert die sieben
freigegebenen Kombinationen und Browserabnahmen pro Laravel-Hauptversion.

Die PHP-Browserhosts laufen aus gepackten Installationen außerhalb des Checkouts mit
deaktiviertem Prozessstart. Laravel 12 wurde zusätzlich hinter einem eigenen PHP-8.3-FPM-Pool und
FastCGI-Proxy mit demselben Browserablauf, Stream-Download und signiertem Resume geprüft.
Synchron blockierende PHP-Provider benötigen Infrastruktur-Timeouts. Node-Abbruchsignale müssen von Anwendungscallbacks beachtet werden.

Die neuen Schemas erhalten gezielte Inventarentscheidungen; bestehende Baselines und
verpflichtende Gates werden nicht pauschal angepasst. Das Projekt ist erst abgeschlossen,
wenn die offenen Nachweise einschließlich tatsächlicher CI-Ergebnisse vorliegen.

## Ressourcen und Prüfverteilung

`tests/ssr-pages/measure_resources.js` misst 50 Renderdurchläufe einer Liste mit
100 Einträgen, Speicher, HTML- und Browserbundlegröße sowie Provideraufrufe für
Erstaufruf, Partial Reload und Deferred-Gruppe. Es erfolgt keine Kompilierung während
der gemessenen Requests. Die Zahlen sind erste Messwerte, keine angehobenen Gatebudgets.

Die neuen Node-Suites benötigen kein PHP. `ssr-pages-php` wird im Laravel-Profil
einmal je PHP-/Laravel-Kombination ausgeführt. Bestehende verpflichtende Prüfungen
und Node-/OS-Matrizen bleiben erhalten.

## Lokale Abnahme vom 6. September 2026

- Vollständiges PR-Profil: 161/161 Suites, 267,7 Sekunden, ein Worker,
  gemessener Spitzenwert 1.389.846.528 Byte Worker-RSS.
- Isolierte Composer-Installationen: Laravel 12 und 13 auf PHP 8.3;
  jeweils 10 PHPUnit-Tests mit 46 Assertions und gemeinsamer Chromium-Ablauf.
  Laravel 12 zusätzlich mit eigenem PHP-FPM-Pool und FastCGI-Proxy.
- Beide Hosts: sieben gemeinsame PHP/Node-Paritätsfälle; Node-Paket und strikter
  NodeNext-Verbraucher ohne PHP bzw. Rückgriff auf Checkout-Laufzeitmodule.
- Inventar: sechs gezielte neue Verträge, keine Änderung an den 2.163 bestehenden
  Released-Fingerprints. Knowledge-Driftcheck unverändert grün.
- Die ergänzenden CI-/Release-Fälle deckten einen weiteren Docs-Zähler und die
  historische Ablehnung nativer View Transitions auf. Die Korrektur verwendet die
  kanonische Artikelzahl und den ausdrücklich konfigurierten Hostport gemäß
  [Übergangsentscheidung](ADR-SSR-Page-Transitions-2026-09-06.md).

Die Listenmessung ergab lokal Median/P95 von 1,98/3,19 ms für Node und
1,27/1,29 ms für PHP, jeweils 6.703 Byte HTML. Provideraufrufe waren in beiden
Laufzeiten 2/1/1 für Erstaufruf/Partial/Deferred. Das Browserbundle lag vor der
Hostport-Anpassung bei 130.142 Byte minifiziert bzw. 41.090 Byte gzip. Diese Werte
beschreiben die lokale Umgebung; tatsächliche CI-Nachweise sind separat erforderlich.
