# Roadmap Docs Planned Features

- Status: Draft
- Datum: 14. Mai 2026
- Quelle: Stichwortpruefung im `docs/` Ordner
- Suchfokus: `planned`, `proposed`, `future`, `future-ready`, `later`, `follow-up`, `Next-Wave`, `offen`, `deferred`, `Folgearbeit`

Dieses Dokument sammelt Roadmap-Signale aus der Dokumentation. Es ist bewusst als Konsolidierung gedacht: gleiche Themen aus Handoff-, Migration- und Authoring-Dokumenten werden zusammengefuehrt, damit geplante Features nicht verteilt in einzelnen Docs liegen bleiben.

## Implementierungsreihenfolge

Die Reihenfolge ist abhaengigkeitsbasiert: erst Gates und Evidence, dann Runtime- und Observability-Grundlagen, danach Language-/Editor-Tooling, dann Host-Features und zuletzt Publish-Entscheidungen.

| Reihenfolge | Feature | Warum an dieser Stelle | Quelle | Naechster Schritt |
| --- | --- | --- | --- | --- |
| 01 | RC1 Gate Matrix und CI-Handoff | Alle weiteren Features brauchen einen stabilen Ort in CI, Release Reports und Owner-Handoff. | [RC1 Readiness](../docs/rc1-readiness.md), [RC1 Migration Notes](../docs/rc1-migration-notes.md), [Trusted DOM Boundary Browser Proof](../docs/trusted-dom-boundary-browser-proof.md) | Workpackage fuer `rc1-gate-matrix-ci-handoff` anlegen oder bestehende Planung verlinken. |
| 02 | Release Report und Pack Dry Run | Package-Inhalt, Export Surface und Release-Metadaten muessen maschinenlesbar sein, bevor externe Evidence sinnvoll gebuendelt wird. | [Supply-Chain Gates](../docs/supply-chain-gates.md), [RC1 Readiness](../docs/rc1-readiness.md) | `npm run release:report` und `npm run pack:dry-run` als verpflichtende Owner-Evidence aufnehmen. |
| 03 | Conditional Network Evidence | Audit und SBOM haengen an der Release-Matrix und muessen vor Publish- oder Runtime-Claims dokumentierbar sein. | [Conditional Network Evidence](../docs/conditional-network-evidence.md), [RC0 Gate Matrix](../docs/rc0-gate-matrix.md), [Supply-Chain Gates](../docs/supply-chain-gates.md) | CI-Job und Evidence-Artefakte fuer `npm audit --audit-level=moderate` und `npm sbom --json` produktisieren. |
| 04 | Screenshot-/Pixel-Regression als Owner-Evidence | Visuelle Artefakte brauchen denselben Evidence-Kanal wie Release- und Netzwerkpruefungen. | [Visual Browser Regression](../docs/visual-browser-regression.md), [RC1 Readiness](../docs/rc1-readiness.md), [SurfaceManager Runtime Release Handoff](../docs/surface-manager-runtime-release-handoff.md) | Pixel-Artefakte und projektbezogene Ablage fuer CI, Browser-Lab und Release-Owner normalisieren. |
| 05 | Enterprise Reporter Transport Hook | Remote Runtime, Runtime Adapter und Host-Features sollten ihre Diagnostics in denselben redigierten Reporter-Pfad liefern koennen. | [XTend-Fabric Runtime](../docs/xtend-fabric.md) | Externe Reporter-Transporte mit Redaction-, Security- und Supply-Chain-Gates koppeln. |
| 06 | Produktive RMT vNext Runtime Adapter | Die vNext Syntax ist source-ready; produktive Adapter sind die Basis fuer jede echte Host-Ausfuehrung. | [RMT vNext Release Handoff](../docs/rmt-vnext-release-handoff.md), [RMT vNext Authoring](../docs/rmt-vnext-authoring.md) | Adapter-Scope, Host-Grenzen und Gates fuer `rmt-vnext-runtime-adapters` definieren. |
| 07 | Produktiver Remote Runtime Loader | Remote Surface Loading sollte erst nach Runtime-Adaptern, Diagnostics und Release-Evidence produktiv werden. | [RMT vNext Enterprise MFE Handoff](../docs/rmt-vnext-enterprise-mfe-handoff.md), [SurfaceManager Runtime Release Handoff](../docs/surface-manager-runtime-release-handoff.md) | Loader-Verantwortung zwischen Host, SurfaceManager und RMT vNext klar schneiden. |
| 08 | Freundlichere RMT DSL Syntax und Routing-Sugar | Syntax- und Normalizer-Entscheidungen sollten vor Formatter, Writer und Editor-Packaging stabil sein. | [RMT Language Server](../docs/rmt-language-server.md), [RMT DSL Authoring Polish](../docs/rmt-dsl-authoring-polish.md), [Quick Start Guide](../docs/quick-start-guide.md) | DSL-Sugar als Authoring-Polish-Paket mit Normalizer-, Diagnose- und Migration-Gates planen. |
| 09 | Project Index fuer Workspace Symbols, Rename und References | Rename, References und Workspace Symbols brauchen einen gemeinsamen Index, bevor einzelne LSP-Features produktiv werden. | [RMT vNext Release Handoff](../docs/rmt-vnext-release-handoff.md), [RMT Language Server](../docs/rmt-language-server.md) | Project-Index fuer `workspace/symbol`, `textDocument/rename` und `textDocument/references` spezifizieren. |
| 10 | Formatter/Writer API und LSP Formatting | Formatting und Writer API haengen an stabiler Syntax und sollten denselben Source-/Range-Modellpfad wie der Index nutzen. | [RMT vNext Release Handoff](../docs/rmt-vnext-release-handoff.md), [RMT Language Server](../docs/rmt-language-server.md) | Formatter-Contract und Writer-API als `rmt-vnext-formatter-writer` schneiden. |
| 11 | LSP Semantic Tokens | Semantic Tokens koennen auf stabiler Syntax, Project Model und Formatter-Ranges aufsetzen. | [RMT Language Server](../docs/rmt-language-server.md) | Token-Schema, Scope-Mapping und Editor-Fallbacks definieren. |
| 12 | Editor Marketplace Distribution | Marketplace-Pakete sollten erst folgen, wenn Syntax, Index, Formatting und Tokens nicht mehr stark driften. | [RMT vNext Release Handoff](../docs/rmt-vnext-release-handoff.md), [RMT Language Server](../docs/rmt-language-server.md) | VS-Code/Editor-Package-Scope und Release-Gates fuer Distribution festlegen. |
| 13 | Docs-App Rich Content Slots | Rich HTML sollte erst nach Trusted-DOM-, Runtime- und Evidence-Pfaden konkretisiert werden. | [XTendRMT Parsedown Scheduling Pilot](../docs/xtendrmt-parsedown-scheduling.md), [XTendRMT Parsedown Docs RMT](../docs/xtendrmt-parsedown-docs.rmt), [RC1 Migration Notes](../docs/rc1-migration-notes.md) | Host-Adapter fuer `docs.slot.rich-content` mit Sanitizing- und Trusted-DOM-Boundary konkretisieren. |
| 14 | XPlayer Tutorial Slots | XPlayer-Tutorials bauen auf den Rich-Content- und Lazy-Media-Slots der Docs-App auf. | [XTendRMT App DSL](../docs/xtendrmt-app-dsl.md), [XTendRMT Parsedown Scheduling Pilot](../docs/xtendrmt-parsedown-scheduling.md), [XTendRMT Parsedown Docs RMT](../docs/xtendrmt-parsedown-docs.rmt), [XTendRMT Migration Guide](../docs/xtendrmt-migration-guide.md) | Media-Content-Kind, Lazy-Load-Policy und XPlayer-Host-Adapter als Docs-App-Folgepaket planen. |
| 15 | Scaffold Preview Write Mode | Produktive Schreibpfade sollten nach Release-, Diff-, Formatter- und Review-Gates kommen. | [XTend Scaffold Previews](../docs/previews/README.md) | Write-Mode-Safety, Dry-Run-Diff und Review-Gates fuer Scaffold Previews spezifizieren. |
| 16 | Optionale Surface-Typen | Command-Palette- und Workspace-Surface-Typen sind Produktfaehigkeit, aber keine Basis fuer Runtime- oder Release-Gates. | [SurfaceManager Runtime Release Handoff](../docs/surface-manager-runtime-release-handoff.md) | Entscheiden, ob diese Scopes eigene SurfaceManager-Folgepakete oder App-Shell-Projektaufgaben werden. |
| 17 | Public Publish Boundary | Oeffentliches npm Publish ist kein Implementierungsstartpunkt, sondern der Abschluss nach Evidence, Owner-Signoff, Changelog und License-Entscheidung. | [Release Owner Acceptance](../docs/release-owner-acceptance.md), [Supply-Chain Gates](../docs/supply-chain-gates.md), [SurfaceManager Runtime Release Handoff](../docs/surface-manager-runtime-release-handoff.md) | Owner-Signoff-Workflow und License-Entscheidung als Release-Checkliste finalisieren. |

## Arbeitspakete

Die Pakete schneiden jeweils eine stabile Implementierungseinheit. Grosse oder riskante Themen werden zuerst als Contract-/Gate-Paket und erst danach als Runtime-/Host-Paket gefuehrt.

| Paket | Umfang | Ergebnis | Nicht enthalten | Haengt ab von |
| --- | --- | --- | --- | --- |
| `DPF-WP-01-rc1-gate-matrix-ci-handoff` | RC1 Gate Matrix, CI-Handoff-Contract, Report-Schema und Referenzpfade festlegen. | Umgesetzt ueber `xtend.epic13.rc1-gate-matrix-ci-handoff.v1`; ein lokaler Gate prueft, dass alle RC1-Evidence-Pfade, Reports und Handoff-Metadaten registriert sind. | Neue Runtime-Features, Publish-Freigabe, Netzwerkzugriff. | - |
| `DPF-WP-02-release-report-pack-dry-run` | Release-Report und Pack-Dry-Run als maschinenlesbare Owner-Evidence aufnehmen. | Umgesetzt ueber `xtend.epic13.release-report-pack-dry-run-evidence.v1`; `release:report` und `pack:dry-run` liefern reproduzierbare Artefakte und werden im RC1-Handoff referenziert. | Audit/SBOM, Public Publish, License-Entscheidung. | `DPF-WP-01` |
| `DPF-WP-03-conditional-network-evidence-ci` | Audit- und SBOM-Evidence fuer CI/Release produktisieren, inklusive Deferral-Format. | Umgesetzt ueber `xtend.epic13.conditional-network-evidence-ci.v1`; CI kann `npm audit --audit-level=moderate` und `npm sbom --json` als Evidence oder Owner-Deferral ausweisen. | Abhaengigkeits-Upgrades, Vulnerability-Fixes, Publish-Freigabe. | `DPF-WP-01`, `DPF-WP-02` |
| `DPF-WP-04-visual-pixel-evidence-storage` | Pixel-/Screenshot-Artefakte fuer CI, Browser-Lab und Owner Review normalisieren. | Ein Artefaktvertrag beschreibt Ablage, Metadaten, Toleranzen und Beziehung zur DOM-first Baseline. | Vollstaendige visuelle Regression fuer alle Komponenten, neue UI-States. | `DPF-WP-01`, `DPF-WP-02` |
| `DPF-WP-05-enterprise-reporter-transport-contract` | Enterprise Reporter Transport als redigierten, opt-in Fabric-Ausgabepfad spezifizieren. | Reporter-Transport-Contract, Redaction-Regeln und lokale Testadapter sind gatebar. | Echte externe SaaS-Integration, Netzwerkversand im lokalen Default-Gate. | `DPF-WP-01` |
| `DPF-WP-06-rmt-vnext-runtime-adapter-contract` | Adapter-Scope, Host-Grenzen, Lifecycle-Hooks und Diagnostics fuer vNext Runtime Adapter festlegen. | Ein Contract beschreibt, wie vNext Core in Hosts materialisiert wird, ohne den RMT-Kernel an XTend zu koppeln. | Remote Loading, produktive Host-Implementierung, Marketplace-Packaging. | `DPF-WP-05` |
| `DPF-WP-07-rmt-vnext-runtime-adapter-probe` | Minimalen produktiven Adapterpfad mit lokaler Fixture und Regression-Gate umsetzen. | Eine vNext-Core-Fixture kann ueber den Adapter materialisiert und diagnostiziert werden. | Remote Surfaces, externe Datenquellen, Editor-Features. | `DPF-WP-06` |
| `DPF-WP-08-remote-runtime-loader-contract` | Verantwortungen fuer Remote Runtime Loader, Manifest-Validation, Trust Boundary und Degradation definieren. | Remote Loading ist als Host-/Runtime-Adapter-Contract beschrieben und klar vom RMT-Kernel getrennt. | Produktiver Netzwerkloader, echte Remote-Auslieferung, MFE-Governance-UI. | `DPF-WP-03`, `DPF-WP-07` |
| `DPF-WP-09-remote-runtime-loader-local-probe` | Lokale, netzwerkfreie Remote-Loader-Probe mit Fixture, Fallback und Diagnostics bauen. | Ein lokaler Probe-Loader prueft Manifest, Integrity-Metadaten, Fallback und Reporter-Signale. | Externe Registry, CDN, Public Runtime Claim fuer fremde Hosts. | `DPF-WP-08` |
| `DPF-WP-10-rmt-dsl-sugar-normalizer` | Freundlichere RMT DSL Syntax und Routing-Sugar fuer `route`, `link` und `outlet` normalisieren. | Normalizer, Diagnosecodes und Migration-Gate decken den neuen Authoring-Sugar ab. | Formatter, Rename/References, Editor-Package. | `DPF-WP-07` |
| `DPF-WP-11-rmt-project-index` | Projektweiten Index fuer Workspace Symbols, Rename und References aufbauen. | Index-Contract und lokale Fixtures koennen RMT-Dokumente projektweit referenzieren. | UI fuer Refactorings, Formatter, Marketplace-Packaging. | `DPF-WP-10` |
| `DPF-WP-12-rmt-formatter-writer-api` | Formatter- und Writer-API auf stabiler Syntax und Source-/Range-Modell aufsetzen. | Formatting ist lokal gatebar und Writer-Operationen sind roundtrip-sicher. | Editor Marketplace, Semantic Tokens, Schreibmodus fuer Scaffold Previews. | `DPF-WP-10`, `DPF-WP-11` |
| `DPF-WP-13-rmt-semantic-tokens` | Semantic-Token-Schema, Scope-Mapping und LSP-Ausgabe implementieren. | LSP liefert stabile Semantic Tokens fuer native RMT-Authoring-Strukturen. | Editor Marketplace-Distribution, Theme-Packaging. | `DPF-WP-10`, `DPF-WP-11` |
| `DPF-WP-14-editor-marketplace-distribution` | Editor-Package-Scope, Release-Gates und Marketplace-Artefakte schneiden. | Editor Distribution kann Snippets, LSP-Start, Formatting und Tokens aus einer Source of Truth paketieren. | Neue RMT-Semantik, Runtime-Ausfuehrung im Editor. | `DPF-WP-12`, `DPF-WP-13` |
| `DPF-WP-15-docs-rich-content-host-adapter` | `docs.slot.rich-content` fuer Rich HTML ueber Host Adapter, Sanitizing und Trusted DOM konkretisieren. | Rich-Content-Payloads koennen getrennt von Parsedown geplant, sanitisiert und diagnostiziert werden. | XPlayer-Tutorials, externe CMS-Anbindung, freie HTML-Sinks ohne Sanitizing. | `DPF-WP-05`, `DPF-WP-07` |
| `DPF-WP-16-docs-xplayer-tutorial-slot` | XPlayer-Tutorial-Slot mit `docs.media.lazy`, Content-Kind und Lazy-Load-Policy umsetzen. | Docs-App kann Tutorial-Media als RMT-geplanten Slot vorbereiten und hostseitig laden. | Videohosting, Upload-Workflow, generischer Media-CMS-Pfad. | `DPF-WP-15` |
| `DPF-WP-17-scaffold-preview-write-mode-contract` | Write-Mode-Safety, Dry-Run-Diff, erlaubte Pfade und Review-Gates fuer Scaffold Previews festlegen. | Preview-Schreibpfade sind als kontrollierter Contract definiert. | Automatische Schreibausfuehrung, Formatter-Integration. | `DPF-WP-12` |
| `DPF-WP-18-scaffold-preview-write-mode-probe` | Kontrollierten Write Mode fuer lokale Preview-Plans mit Dry-Run- und Review-First-Verhalten bauen. | Scaffold Preview kann erlaubte Dateien pruefbar vorschlagen oder schreiben, ohne unkontrollierte Repo-Aenderungen. | Massengenerator, Remote Templates, Publish-Schritte. | `DPF-WP-17` |
| `DPF-WP-19-optional-surface-types-contract` | Optionale Command-Palette- und Workspace-Surface-Typen als SurfaceManager-Erweiterung schneiden. | Surface-Typen, Ownership, Persistenz und Layout-Grenzen sind spezifiziert. | Produktive UI-Implementierung fuer alle App Shells, Remote Runtime Loading. | `DPF-WP-07`, `DPF-WP-09` |
| `DPF-WP-20-public-publish-owner-handoff` | Owner-Signoff, License-Entscheidung, Changelog und Publish-Boundary zusammenfuehren. | Ein finaler Owner-Handoff kann Publish erlauben oder blockiert begruenden. | Feature-Implementierung, automatische Publish-Freigabe. | `DPF-WP-02`, `DPF-WP-03`, `DPF-WP-04` |

## Ueberholte oder widerspruechliche Signale

| Signal | Bewertung | Quelle |
| --- | --- | --- |
| `xstate` und `x-utils` wurden in aelteren Long-Tail-Dokumenten noch als offen sichtbar. | Nicht als neue Roadmap aufnehmen: [Known Residual Triage](../docs/known-residual-triage.md) und [RC1 Readiness](../docs/rc1-readiness.md) markieren beide Scopes als geschlossen. Docs wurden im Vorlauf harmonisiert und verweisen nun auf `closed-as-runtime-boundary` beziehungsweise `closed-as-utility-boundary`. | [Component Long-Tail Migration](../docs/component-long-tail-migration.md), [Component Catalog Coverage](../docs/component-catalog-coverage.md), [x-utils](../docs/components/xutils.md) |
| Produktive `xtend.surface` Adapter Runtime war in fruehen SurfaceManager-Dokumenten Folgearbeit. | Nicht als offene Roadmap aufnehmen: [SurfaceManager Runtime Release Handoff](../docs/surface-manager-runtime-release-handoff.md) markiert diese Runtime als produktiven Claim. Fruehe Handoff-Dokumente wurden als historisch markiert und auf `WP-SM-19` bezogen. | [SurfaceManager Release Handoff](../docs/surface-manager-release-handoff.md), [SurfaceManager Authoring Guide](../docs/surface-manager-authoring-guide.md) |
| Deprecated CSS Tokens, Parts und Slots mit `not-before-next-major-or-explicit-migration-window`. | Geprueft: Das ist SemVer-/Migration-Policy, keine Feature-Roadmap und keine aktuelle Docs-Inkonsistenz. Fuer ein Major-Release relevant, aber nicht als neues Produktfeature gefuehrt. | [Enterprise Component Flex Release Handoff](../docs/enterprise-component-flex-release-handoff.md) |

## Konsolidierte Feature-Liste

1. RC1 Gate Matrix und CI-Handoff
2. Release Report und Pack Dry Run
3. CI/Release Network Evidence fuer Audit und SBOM
4. Screenshot-/Pixel-Regression als CI/Owner-Evidence
5. Enterprise Reporter Transport Hook
6. Produktive RMT vNext Runtime Adapter
7. Produktiver Remote Runtime Loader im Host-/Runtime-Adapter-Pfad
8. Freundlichere RMT DSL Syntax und Routing-Sugar
9. Project Index fuer Workspace Symbols, Rename und References
10. Formatter/Writer API und LSP Formatting
11. LSP Semantic Tokens
12. Editor Marketplace Distribution
13. Rich-HTML-Slots in der Docs-App
14. XPlayer-Tutorial-Slots in der Docs-App
15. Scaffold Preview Write Mode
16. Optionale Surface-Typen wie Command Palette und Workspace Surfaces
17. Owner-Signoff, License-Entscheidung und Public Publish Boundary
