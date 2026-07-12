# XTend Docs Quality und Dev Surface Public Documentation

Status: `implementation-in-progress-xdq-wp-09-xdq-wp-10-xdq-wp-11-xdq-wp-12-complete`

Dieses Dokument ist die Source of Truth für die öffentliche Dokumentationsabdeckung der XTend Dev Surface und für die redaktionelle Sanierung des deutsch- und englischsprachigen Developer Centers. Zielgruppe sind Drittentwickler, die XTend ohne internes Projektwissen installieren, integrieren, diagnostizieren und betreiben müssen.

## Ausgangslage

Die Baseline wurde vor `XDQ-WP-00` mit den bestehenden Inventar- und Quality-Skripten erhoben.

| Signal | Baseline |
| --- | ---: |
| Einträge in `docs/menu.json` | 166 |
| Markdown-Artikel unter `docs/de` | 173 |
| Markdown-Artikel unter `docs/en` | 168 |
| Fehler in `docs-public-quality` | 76 |
| Fehler in `docs-content-depth` | 126 |
| Artikel mit generischem Contract-/Anchor-/Verification-Block | 64 |

Die Baseline ist kein akzeptierter Dauerzustand. Sie dient nur dazu, Fortschritt sichtbar zu machen. Abschlussziel ist ein vollständig grüner Lauf ohne Legacy-Allowlist und ohne abgesenkte Qualitätsanforderungen.

## Produktziel

1. Die XTend Dev Surface besitzt einen vollständigen deutschen und englischen Einstieg mit einem reproduzierbaren Testpfad über die RMT Animation TestBench.
2. Jeder öffentliche Slug ist in beiden Sprachen vorhanden, navigierbar und einem inhaltlichen Typ zugeordnet.
3. Tutorials, Konzepte, Referenzen, Betriebsanleitungen und Komponentenartikel folgen unterschiedlichen, für ihren Zweck passenden Qualitätsregeln.
4. Öffentliche Texte erklären Nutzeraufgaben. Interne Epics, Workpackages, Handoffs und reine Release-Evidence bleiben in `development/` oder in tool-eigenen Artefaktpfaden.
5. Technische Fakten stammen aus Runtime, Typen, Manifesten, Tests und ausführbaren Befehlen. Andere Dokumentationsartikel sind keine alleinige Faktenquelle.

## Öffentliche Informationsarchitektur

Jeder kanonische Eintrag in `docs/menu.json` deklariert einen `contentType` aus diesem Katalog:

| Typ | Zweck | Minimale überprüfbare Signale |
| --- | --- | --- |
| `orientation` | Produkt- und Lernpfad erklären | Zielgruppe, Entscheidungshilfe, konkrete nächste Schritte |
| `tutorial` | Eine Aufgabe Ende zu Ende durchführen | Voraussetzungen, geordnete Schritte, ausführbarer Block, erwartetes Ergebnis, Fehlerbehebung |
| `concept` | Modell und Grenzen verständlich machen | Problem, Mental Model, Ownership-Grenzen, konkretes Beispiel, Fehlerverhalten |
| `reference` | Öffentliche Oberfläche vollständig nachschlagen | source-abgeleitete Namen, Signaturen oder Schemas, Beispiel, Kompatibilität und Fehlerfälle |
| `operations` | Gates, Diagnose und Betrieb erklären | Befehl oder Einstieg, Report-/Statusauswertung, erwartetes Signal, Behebung |
| `component` | Eine Web Component integrieren | Attribute, Events, Methoden, Slots, Styles, A11y/Keyboard, zwei Beispiele, Troubleshooting |

`aliases` hängen ausschließlich an einem kanonischen Menüeintrag. Ein Alias wird nicht gerendert, kollidiert nicht mit einem kanonischen Slug und löst server- wie clientseitig auf denselben kanonischen Slug in derselben Sprache auf.

## Redaktionelle Regeln

- Öffentliche Artikel beginnen mit dem Nutzerproblem und nicht mit einem internen Vertragsstatus.
- Wiederholte Standardprosa ersetzt keine Erklärung. Identische narrative Absätze ab 120 Zeichen in vier oder mehr Artikeln blockieren den Gate-Lauf.
- Die bisherigen generischen Abschnitte `Public contract`, `Interfaces and anchors`, `Minimal verification path` und `Specific failure modes` werden entfernt oder durch artikelspezifische Inhalte ersetzt.
- Code, Commands, Schema-IDs, Dateipfade und öffentliche Symbole bleiben zwischen Deutsch und Englisch fachlich gleich. Prosa und sichtbare Beispieltexte werden idiomatisch lokalisiert.
- Deutsche Prosa verwendet echte Umlaute. Englische Artikel enthalten keine versehentlich übernommenen deutschen Sätze.
- Wort- und Zeichenzahlen erkennen nur leere Stubs. Sie sind nie alleinige Abnahmebedingung.
- Generatorskripte dürfen Inventare und Vorschläge erzeugen, aber keine öffentliche Massenprosa in `docs/de` oder `docs/en` schreiben.

## Migrationsinventar

### Neue kanonische Artikel

| Slug | Gruppe | Typ | Ziel |
| --- | --- | --- | --- |
| `xtend-dev-surface` | `quality` | `tutorial` | Chromium Extension laden, App instrumentieren und alle Tabs verstehen |
| `release-verification` | `core` | `operations` | Nutzerorientierte Release-, Pack- und CI-Evidence erklären |
| `xtensions-authoring-guide` | `core` | `tutorial` | Framework- und Library-Inseln über HostController integrieren |
| `xtensions-migration-coexistence-guide` | `core` | `concept` | Migration und Coexistence planen |
| `xtensions-security-checklist` | `security` | `operations` | XTension vor dem Mount prüfen |
| `components-xkeymap` | `components` | `component` | `x-keymap` vollständig referenzieren |
| `rmt-animation-engine` | `rmt` | `tutorial` | AnimationEngine AOT authoren und direkt im Artikel ausprobieren |
| `xtend-dev-api` | `quality` | `reference` | DEV-API-Methoden, Snapshots, Boot-Zustand, Diagnostics und Sicherheitsgrenzen nachschlagen |

### Öffentliche Alias-Migration

| Legacy-Slug | Kanonisches Ziel |
| --- | --- |
| `rc1-readiness` | `release-verification` |
| `release-owner-acceptance` | `release-verification` |
| `rc1-gate-matrix-ci-handoff` | `release-verification` |
| `epic12-rc0-handoff` | `release-verification` |
| `rmt-vnext-release-handoff` | `rmt-vnext-migration-notes` |
| `rmt-vnext-enterprise-mfe-handoff` | `rmt-vnext-remote-surfaces` |
| `epic18-vendor-bugfixes` | `rmt-app-platform-migration-guide` |
| `epic18-rmt-app-platform-release-handoff` | `rmt-app-platform-migration-guide` |

### Dateimigration

- Eine nicht lokalisierte Datei mit öffentlichem Inhalt wird in beide Locales überführt und im Menü registriert.
- Eine nicht lokalisierte Datei mit internem Plan-, Handoff- oder Evidence-Inhalt wechselt nach `development/`; alle Repo-Referenzen werden atomar aktualisiert.
- Eine Root-Datei, deren öffentliche Fakten bereits in beiden Locales leben, wird nach dem Merge entfernt.
- Generierte RMT AI Developer Kit Artefakte leben unter `tools/rmt-language/generated/rmt-ai-developer-kit/`, nicht unter dem öffentlichen `docs/`-Baum.
- Nach der Migration enthält `docs/` öffentliche Markdown-Dateien ausschließlich in `docs/de` und `docs/en`.

## Arbeitspakete

| Paket | Status | Liefergegenstand | Abnahme |
| --- | --- | --- | --- |
| `XDQ-WP-00` | `completed-plan-baseline` | dieses Dokument und reproduzierbare Baseline | Ziele, Rubrik, Migration und Gates sind entscheidungsvollständig |
| `XDS-WP-11` | `completed-public-documentation` | zweisprachige Dev-Surface-Dokumentation | beide Locales, Menü, README, Package-Metadaten und Suite sind verbunden |
| `XDQ-WP-01` | `completed-content-profiles` | `contentType`-Modell und profilspezifische Depth-Prüfung | alle kanonischen Slugs besitzen einen gültigen Typ |
| `XDQ-WP-02` | `completed-quality-gates` | Boilerplate-, Wiederholungs-, Locale- und Faktenparitäts-Gates | negative Fixtures werden zuverlässig blockiert |
| `XDQ-WP-03` | `completed-ia-migration` | Dateibaum- und Menübereinigung | keine öffentliche Markdown-Datei außerhalb der Locales, keine unregistrierten Artikel |
| `XDQ-WP-04` | `completed-alias-routing` | Alias-Routing und nutzerorientierte Release-Seite | acht Legacy-Slugs kanonisieren Sprache und Ziel korrekt |
| `XDQ-WP-05` | `completed-priority-corpus` | Start, Learn RMT, Dev Tools, Quality, Security und XTensions | alle Artikel sind aufgaben- und source-orientiert |
| `XDQ-WP-06` | `completed-platform-corpus` | RMT, RMT Reference, Maraca, Core und SurfaceManager | Konzepte, Referenzen und Operations sind getrennt und überprüfbar |
| `XDQ-WP-07` | `completed-component-corpus` | vollständige Komponentenreferenzen | Inventory und öffentliche Artikel stimmen überein |
| `XDQ-WP-08` | `completed-ci-editorial-pass` | bilingualer Review und CI-Abschluss | 164 kanonische Slugs, je 164 DE/EN-Artikel, alle Docs-Gates grün |
| `XDQ-WP-09` | `implementation-in-progress` | zweisprachiges AnimationEngine-Tutorial mit AOT-Live-Demo | 165 kanonische Slugs, kompilierbare Beispiele, lazy Island und Browser-Smoke grün |
| `XDQ-WP-10` | `completed` | Catfooding-Refactor der Docs Shell | `development/XTend-Docs-Shell-Catfooding-Implementierungsplan.md`, sechs Navigationstrunks, framework-native Search/Skeleton/Maraca-Pfade, DEV API und grüner Chromium-Smoke |
| `XDQ-WP-11` | `completed` | zweisprachige XTend-DEV-API-Referenz | 166 kanonische Slugs, source-geprüfte Methoden-/Schema-Parität, Dev-Tools-Navigation und Route-Smoke grün |
| `XDQ-WP-12` | `completed` | zweisprachiger Hydration-Policies-Deep-Dive | Execution Modes, Fabric Policies, Ownership, Resumability, kompilierbare Beispiele und source-geprüfte Parität |

## Gate-Matrix

```bash
node scripts/run_xtend_tests.js xtend-dev-surface docs-public-quality docs-content-depth docs-quality-gates references --json
git diff --check
```

Zusätzlich prüfen Route-Smokes `/docs/de/xtend-dev-surface`, `/docs/en/xtend-dev-surface`, `/docs/de/xtend-dev-api`, `/docs/en/xtend-dev-api` sowie jeden Legacy-Alias. `docs-public-quality`, `docs-content-depth` und `docs-quality-gates` sind wieder Bestandteil des regulären PR-Gates.

## Abschlussnachweis

- `docs/menu.json` enthält 166 kanonische Slugs, sechs gültige `contentType`-Klassen und acht konfliktfreie Aliase.
- `docs/de` und `docs/en` enthalten jeweils 166 registrierte Artikel; außerhalb dieser beiden Locale-Bäume enthält `docs/` keine Markdown-Datei.
- Die kanonischen Dev-Surface-Routen antworten in DE und EN mit `200`; alle 16 Locale-/Legacy-Kombinationen antworten mit `302` auf das sprachgleiche Ziel.
- Der fokussierte Fünfer-Gate-Lauf und der reguläre PR-Report mit 118 Suiten sind grün.
- Interne Handoff- und Evidence-Dateien liegen unter `development/docs-evidence/`; das generierte RMT AI Kit liegt unter `tools/rmt-language/generated/`.

## Abschlusskriterien

- `docs/menu.json` enthält 166 kanonische, eindeutig typisierte Slugs.
- `docs/de` und `docs/en` enthalten jeweils genau 166 öffentliche Markdown-Artikel.
- Alle acht Legacy-Routen kanonisieren bei erhaltener Locale.
- Dev-Surface-Dokumentation erklärt die reale englische Shell und den instrumentierten TestBench-Pfad auf Port `9196`.
- Public-Quality-, Content-Depth-, References- und Dev-Surface-Suite laufen gemeinsam grün.
- Kein Gate wurde durch eine Legacy-Ausnahme, eine Baseline-Allowlist oder eine niedrigere Schwelle passend gemacht.
