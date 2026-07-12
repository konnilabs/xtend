# XTend Docs Shell Catfooding Implementierungsplan

Status: `completed-xdc-wp-00-xdc-wp-08`

Dieses Dokument ist die Source of Truth für den Catfooding-Refactor der XTend Docs Shell. Es ergänzt den redaktionellen Plan in `development/XTend-Docs-Quality-Implementierungsplan.md`; beide Vorhaben werden im aktuellen Worktree gemeinsam geprüft und abgeschlossen.

## Produktziel

1. Die Docs Shell nutzt RMT, AppRuntime, XCommand, Fabric, Maraca und die XTend-Komponenten als produktive Frameworkpfade.
2. Generische Produktprobleme werden upstream gelöst. Docs-spezifische Search-, Skeleton-, Renderer- oder Runtime-Parallelimplementierungen sind nicht zulässig.
3. Unerfahrene Drittentwickler navigieren über sechs aufgabenorientierte Trunks statt über eine vollständige technische Linkliste.
4. Die Suche bleibt clientseitig, toleriert Tippfehler und Fachaliase und lädt Volltextdaten nur bei unzureichenden kompakten Treffern.
5. Die Docs App stellt die explizite `window.__XTEND_DEV_API__` bereit und ist vollständig mit der XTend Dev Surface prüfbar.

## Baseline

| Signal | Istzustand vor XDC |
| --- | ---: |
| Kanonische zweisprachige Artikel | 165 |
| Zeilen `docs/index.php` | 3713 |
| Zeilen `docs/utils/pageloader.js` | 6396 |
| Zeilen `docs/utils/fabric-runtime.js` | 650 |
| Kompakter Suchindex, geschätzt | 16.7-17.7 KiB gzip je Locale |
| Volltext-Suchindex, geschätzt | 121-134 KiB gzip je Locale |
| Bestehende Baseline-Gates | 8/8 grün |

Die grüne Baseline umfasst `docs-php-ssr-prehydration`, `docs-php-ssr-performance-budget`, `docs-php-ssr-cls-budget`, `docs-rmt-pilot`, `rmt-app-runtime`, `xcommand-kernel`, `rmt-owned-command-search-primitives` und `xtend-layout-stability-contract`.

## Ownership-Grenzen

- PHP und Parsedown bleiben SSR-, Locale-, Alias-, CSP- und Content-Host.
- RMT und AppRuntime besitzen Shellzustand, Navigation, Search State, Event Routing, Hydration und Lifecycle.
- Fabric besitzt Rendering-Telemetrie, Lanes, Fibers und Diagnostik. UI-Commits laufen über den RMT DOM Descriptor Renderer beziehungsweise den Kernel Trusted-DOM-Pfad.
- XCommand besitzt Navigation und interaktive Commands. Produktmodule registrieren keine ungetrackten globalen DOM-Listener.
- Der Prewarm Worker darf nur allowlistete serialisierbare Compute-Envelopes verarbeiten. DOM, Host Events, Canonical State und Trusted-DOM-Commit bleiben auf dem Main Thread.
- Maraca erzeugt das produktive, treeshakete Rollup-/Terser-Bundle und die fingerprintgebundene Tune-Konfiguration.

## Öffentliche und interne Verträge

- `xtend.docs.navigation.v1`: lokalisierte Trunks, Sektionen und Reihenfolge.
- `xtend.docs.search-index.v1`: kompakter Index aus Titel, Aliases, Keywords, Überschriften und Summary.
- `xtend.docs.search-fulltext-index.v1`: lazy Volltext-Fallback.
- `xtend.rmt.search-runtime.v1`: normalisierte Suche über deklarierte `searchSources[]`.
- `xtend.loader.skeleton-profile.v1`: sichere layoutstabile Skeleton-Deskriptoren ohne HTML-Sink.
- `xtend.maraca.build-config.v1`: reproduzierbare Maraca-Buildparameter.
- `xtend.maraca.tune-report.v1`: Kandidaten, Score, Toolchain und ausgewählte Konfiguration.
- `xtend.docs.dev-api.v1`: Docs-spezifische Herkunftsmetadaten für die bestehende Dev-Surface-API.

## Informationsarchitektur

Die sechs Primär-Trunks sind `start`, `learn-rmt`, `build`, `components`, `operate` und `reference`. In der deutschen UI werden sie als `Start`, `RMT lernen`, `Entwickeln`, `Komponenten`, `Betrieb` und `Referenz` angezeigt; die englische UI verwendet `Start`, `Learn RMT`, `Build`, `Components`, `Operate` und `Reference`.

Nur der zum aktiven Slug gehörende Trunk wird in der Sidebar ausgegeben. Sein aktiver Zweig ist geöffnet. Alle 166 Slugs bleiben über Navigation und Suche erreichbar. Komponenten werden in `forms`, `navigation`, `feedback-overlays`, `layout-surfaces`, `data-media` und `runtime-utilities` gruppiert.

## Suchpolitik

- Normalisierung: Unicode NFKD, Diakritika, deutsche Umlaut-/`ß`-Varianten, CamelCase, Kebab Case, Interpunktion und Whitespace.
- Tippfehler: Damerau-Levenshtein-Distanz 1 ab vier Zeichen und Distanz 2 ab acht Zeichen.
- Gewichtung: Titel, Route-Alias, Keyword, Heading, Summary und Volltext in absteigender Reihenfolge.
- Query-Policy: mindestens zwei Zeichen, `80 ms` Debounce, maximal acht Ergebnisse.
- Der Volltextindex wird geladen, wenn weniger als drei brauchbare kompakte Treffer vorliegen oder der Top-Score unter `0.60` liegt.
- Die aktive Locale wird durchsucht; technische DE-/EN-Fachvarianten werden über kuratierte Keywords verbunden.

## Maraca Tune

`xt maraca tune` baut zwölf nicht-semantische Kandidaten aus `production|max`, `route|component|none` und `inline|external`. Kernel-, Orchestration-, Hydration-, Validation-, Transition-, Component-, Stack- und Prewarm-Fähigkeiten bleiben gesperrt.

Kandidaten mit Fehlerdiagnostik, fehlender Production Closure, fehlendem Rollup/Terser oder Budgetfehler werden verworfen. Die verbleibenden Kandidaten werden deterministisch nach initialen Eager-Bytes, Gesamtbytes, Eager-Requests und Chunkzahl sortiert. Gleichstände bevorzugen `production`, danach `route`, danach `external`.

`--write` aktualisiert Config und Report. `--check` baut und vergleicht ohne Repo-Mutation. CLI-Flags überschreiben Configwerte; Configwerte überschreiben Defaults. Source-, Toolchain- und Options-Fingerprints blockieren veraltete Konfigurationen.

## Arbeitspakete

| Paket | Status | Liefergegenstand |
| --- | --- | --- |
| `XDC-WP-00` | `completed` | Source of Truth, Baseline und Ownership-Matrix |
| `XDC-WP-01` | `completed` | Search Runtime, `searchsource` und Prewarm-Search-Task |
| `XDC-WP-02` | `completed` | Skeleton-Profile und Router-Adoption |
| `XDC-WP-03` | `completed` | Maraca Build Config und automatisches Tune |
| `XDC-WP-04` | `completed` | sechs Trunks und komponentenspezifische Sektionen |
| `XDC-WP-05` | `completed` | kompakter und Volltext-Suchindex |
| `XDC-WP-06` | `completed` | AOT Shell, Trusted DOM und insulare Experiences |
| `XDC-WP-07` | `completed` | Fabric-/Kernel-Telemetrie und XTend DEV API |
| `XDC-WP-08` | `completed` | Legacy-Cleanup, Gates, Browser-Smoke und Handoff |

## Implementierungsnachweis

- Das initiale SSR-HTML umfasst `151782` Bytes und materialisiert nur die aktive Route plus Wildcard. Die vollständige Route-Tabelle wird nach dem Content-Commit oder beim ersten Navigations-Intent über `x-router.registerRoutes()` registriert.
- Alle 166 Slugs sind genau einem der sechs Trunks zugeordnet. `docs/navigation.json` und beide Suchindexstufen sind deterministisch prüfbar.
- Gzip-Größen: DE kompakt `20008`, DE Volltext `114385`, EN kompakt `18649`, EN Volltext `93689` Bytes.
- `xt maraca tune --check` akzeptiert alle zwölf Rollup-/Terser-Kandidaten und wählt deterministisch `max-route-inline` mit `1835863` initialen und `2032433` gesamten Bytes.
- Der lokale Akzeptanzlauf ist mit 11/11 Suites grün, einschließlich Public Quality, Content Depth, SSR-/FCP-/CLS-Budgets und 2479 Referenzprüfungen.
- `docs/utils/fabric-runtime.js` ist entfernt. AppRuntime, Fabric, Search, Commands und DEV API werden aus `docs/utils/docs-shell-runtime.mjs` koordiniert; Trusted-DOM-Commits bleiben in `docs/utils/trusted-dom-host.mjs`.
- Die aktuelle Chromium-Evidence liegt unter `.xtend-test-results/docs-shell-catfooding/`: DE Desktop `FCP 1480 ms`, `3338514` Encoded Bytes; EN Mobile `FCP 1212 ms`, `3234927` Encoded Bytes. Beide bleiben mit `CLS 0`, null Remote-Ressourcen und vollständiger DEV-API-Erkennung unter dem Fünf-Prozent-Limit der archivierten Vorher-Baseline.
- Der Browser-Smoke bestätigt zusätzlich die sprachgleiche Logo-Navigation nach `readme`, synchrones Theme-`aria-pressed`, vier sichtbare Records bei ungültigem Skeleton-Input, Ersatz einer leeren Altinstanz und acht AppRuntime-/Fabric-Fibers nach Navigation und Rückkehr zur Startseite.

## Abnahme

```bash
node xtend-builder/bin/xt maraca tune docs/xtendrmt-docs-shell-vnext.rmt --config docs/maraca.config.json --out docs/generated/shell --check --json
node scripts/run_xtend_tests.js docs-shell-catfooding rmt-search-runtime rmt-prewarm-worker-search xtend-loader-skeleton-profiles maraca-tune docs-public-quality docs-content-depth docs-php-ssr-prehydration docs-php-ssr-performance-budget docs-php-ssr-cls-budget references --json
node scripts/smoke_docs_shell_catfooding.mjs
git diff --check
```

Der kompakte Index bleibt unter `25 KiB gzip`, der Volltextindex unter `150 KiB gzip` je Locale. Der Volltextindex liegt nicht im Initialpfad. Browser-Smokes müssen DE/EN, Light/Dark, Desktop/Mobile, Keyboard Navigation, Route Cleanup, Dev-Surface-Erkennung, `CLS <= 0.01` und eine maximale FCP-/Transferregression von fünf Prozent bestätigen.
