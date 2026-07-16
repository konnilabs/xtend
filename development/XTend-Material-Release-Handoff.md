# XTend Material Release Handoff

- Ticket: `XTM-13`
- Schema: `xtend.material.release-handoff.v1`
- Datum: 2026-07-16
- Release Owner: `CCS Labs (ccslabs)`
- Entscheidung: `supported-opt-in`
- Version Line: `0.1.x`
- Default Provider: `unchanged`
- Lokaler Gate: `node scripts/run_xtend_tests.js xtend-material-docs docs-public-quality scoped-package-readmes package-exports references --json`

## Entscheidung

CCS Labs akzeptiert XTend Material als `supported-opt-in` für RMT-first-Maraca-Anwendungen. Drittentwickler können das Kit über `xt create app --runtime maraca --design-kit material` ausdrücklich wählen und sich auf die dokumentierten Exports, 26 Recipes, Theme-/Density-Verträge, den lokalen Tailwind Provider und den nativen Exit Path stützen.

Die Entscheidung macht XTend Material weder zum Standard-CSS-Provider noch zu einer globalen Empfehlung für jede XTend-App. Ein bestehendes Produktdesign soll nicht ohne eigenen Produktentscheid migriert werden. Angular-Material-, Material-Web- und vollständige Google-Material-Design-Parität bleiben explizite Nicht-Claims.

## Release Decision Matrix

| Status | Evidence-Anforderung | Bewertung | Entscheidung |
| --- | --- | --- | --- |
| `experimental` | Architektur und erste lokale Fixtures | übertroffen: XTM-00 bis XTM-09 sind abgeschlossen | nicht gewählt |
| `supported-opt-in` | stabile öffentliche Surface, Browser-, A11y-, Performance-, Migration- und Catfooding-Evidence | erfüllt durch XTM-00 bis XTM-12 und XTM-13 Docs-/Migration-Gate | **gewählt** |
| `recommended-fast-path` | zusätzlich breite externe Adoption, Feedback und belastbare Produktklassen-Empfehlung | Catfooding ist vorhanden, externe Adoption noch nicht belegt | zurückgestellt |
| `default-for-new-maraca-apps` | vollständige Evidence plus separater akzeptierter Architecture Decision Record für Default- und Rückwärtskompatibilität | kein separater Default-ADR vorhanden | blockiert |

## Öffentliche Surface

### `@xtend-material/core` 0.1.x

- Root API: Design-Kit-Vertrag, Foundation-/Shell-/Flow-Registry und Maraca Preset;
- Subpaths: `./recipes`, `./shell-recipes`, `./flow-recipes`, `./performance-contract`, `./maraca-preset`;
- CSS: `./tokens.css`, `./styles.css`;
- Metadaten: `./package.json`;
- Side Effects: ausschließlich CSS;
- Runtime Boundary: CSS und Metadaten, keine Component Registry, keine Tailwind Browser Runtime.

### `@xtend-material/maraca-tailwind` 0.1.x

- Root API: Maraca CSS Provider;
- Subpaths: `./toolchain`, `./source-inventory`, `./package.json`;
- Build Boundary: Node-only, air-gapped, memory-only, explicit sources;
- Toolchain: `tailwindcss` und `@tailwindcss/node` exakt `4.3.2`;
- keine CLI-Subprozesse, Registry-Abfragen, CDNs oder Browserimports.

## Compatibility Matrix

| Vertrag | Unterstützt | Grenze |
| --- | --- | --- |
| Node.js | `>=18` | neuere Tailwind-Version darf Engine nicht still erhöhen |
| `@ccslabs/xtend` | `^0.3.1` Peer von Core | Component-/Token-Verträge bleiben upstream-owned |
| `@ccslabs/xtend-maraca` | `^0.3.1` Peer des Adapters | CSS Provider Contract bleibt generisch |
| Tailwind CSS | exakt `4.3.2` | Upgrade nur nach Review-Runbook |
| RMT-Klassen | statische bekannte `xtm-*`-Namen | keine rohen Utilities, Varianten oder dynamischen Namen |
| Themes | light, dark, high contrast, forced colors | Runtime-Wechsel durch `x-theme` |
| Density | comfortable, compact, dense | Accessibility-Budgets bleiben bindend |
| Material Packs | enterprise, utility | Produktintention, keine zweite Token-Wahrheit |
| Browser Runtime | XTend/RMT/Maraca | null Tailwind Runtime Bytes |
| Native Exit | `@xtend-material/core/styles.css` | RMT Business Records bleiben identisch |

## SemVer Policy

Beide Pakete beginnen in der Linie `0.1.x`. Trotz Pre-1.0-Status sind dokumentierte Exports, Recipe-Klassennamen, Schemas, Config Keys und CSS-Subpaths unterstützte Surface.

- Patch: kompatible Fehlerkorrektur, A11y-/Browser-Härtung ohne Vertragsänderung, Docs-Korrektur oder Dependency-Integrity-Aktualisierung derselben Version.
- Minor: additives Recipe, additives Theme-/Density-Verhalten oder bewusst geänderter dokumentierter Vertrag mit Migration Notes.
- Breaking innerhalb 0.x: Entfernung/Umbenennung eines Exports, Recipes, Tokens oder Schemas erhöht mindestens die Minor-Version und benötigt explizite Migration Notes sowie Deprecation-Entscheid.
- 1.0: erst nach externer Adoption, bewerteter API-Stabilität und eigenem Release Review.

Core und Adapter werden als kompatibles Paar versioniert. Ein Adapter-Release darf keine Core-Version referenzieren, die nicht gleichzeitig öffentlich verfügbar ist.

## Tailwind Upgrade Runbook

Tailwind folgt `latest-stable-reviewed`, nicht einem beweglichen `latest`-Range.

1. Release Maintainer prüft den stabilen npm Dist-Tag ausdrücklich in einem netzwerkfähigen Maintenance-Run.
2. Changelog und offizielle Compatibility Notes der Zielversion werden auf Node Engine, Browser Baseline, CSS-Syntax, Node API und Lightning-CSS-Verhalten geprüft.
3. `tailwindcss` wird in Core und Adapter exakt auf dieselbe Version gesetzt; `@tailwindcss/node` wird im Adapter exakt passend gesetzt.
4. Lockfile-Integrity, License und Provenance werden erneuert. Preview-, Beta- und RC-Versionen bleiben aus der stabilen Linie ausgeschlossen.
5. Provider-, Source-Inventory-, Token-, Recipe-, Browser-, Visual-, A11y-, Performance-, Supply-Chain-, Catfooding- und Docs-Gates laufen vollständig.
6. CSS Raw/Gzip, Compile Fingerprint, Design-Kit Fingerprint, Browsermatrix und Screenshot-Diffs werden gegen die akzeptierte Baseline bewertet.
7. Native Provider Exit und null Tailwind Runtime Bytes werden erneut nachgewiesen.
8. Erst nach akzeptierter Evidence werden Package Manifeste, Changelogs und Compatibility Matrix gemeinsam aktualisiert.

Ein fehlgeschlagener Upgrade-Run ändert die veröffentlichte Baseline nicht. Lokale Standard-Gates bleiben netzwerkfrei und versuchen keinen automatischen Versionswechsel.

## Migration Evidence

Die öffentlichen Artikel `docs/en/xtend-material-migration.md` und `docs/de/xtend-material-migration.md` beschreiben beide Richtungen. Der Gate verifiziert zusätzlich:

- Legacy-Shell-Zuordnung zu semantischen Recipes;
- Tailwind Provider Build aus expliziter RMT-/CSS-Source;
- nativen Provider Build aus `tokens.css` und `styles.css`;
- identischen RMT Source Fingerprint vor und nach Provider-Wechsel;
- semantische CSS-Abdeckung auf beiden Pfaden;
- null Tailwind Runtime Imports;
- unveränderte Action-, Validation- und Transition-Records der Catfooding-App.

## Evidence Chain

| Ticket | Evidence |
| --- | --- |
| XTM-00 bis XTM-03 | Architektur, Provider Contract und lokale Toolchain |
| XTM-04 bis XTM-06 | RMT Source Inventory, Token Bridge und Design-Kit-Vertrag |
| XTM-07 bis XTM-09 | Shell-/Flow-Recipes und Scaffold |
| XTM-10 | 384 Browserzellen, vier Viewports, A11y-/Visual-Evidence |
| XTM-11 | Performance, Supply Chain, deterministische Builds, Anti-Monkeypatching und Native Exit |
| XTM-12 | eigenständige Workbench, Tune, Browser-Screenshots und entschiedene Lessons |
| XTM-13 | öffentliche Docs, bidirektionale Migration, Package-/SemVer-/Changelog-Lock |

## Publish Boundary

Dieses Ticket bereitet Packages und Dokumentation für einen Owner-gesteuerten Release vor. Es führt keinen `npm publish`-Befehl aus, erzeugt keine Registry-Organisation und erweitert keine Publishing-Rechte. Vor einem tatsächlichen Publish muss CCS Labs Ownership des Scopes `@xtend-material` bestätigen, die vorgesehenen Pack-Artefakte prüfen und die normalen manuellen Release-Schritte ausführen.

## Default Boundary

`supported-opt-in` verändert keinen Framework-Default. Ein späterer Default-Wechsel benötigt einen separaten akzeptierten ADR mit mindestens:

- Folgen für bestehende Scaffold-Consumer und native Provider;
- Deinstallation und Rückmigration;
- Browser-/Node-Support und Dependency-Gewicht;
- Rollout, Deprecation und Telemetry;
- erneute Browser-, Performance- und externe Adoption Evidence.

Ohne diesen ADR bleibt `--design-kit material` eine bewusste Auswahl.
