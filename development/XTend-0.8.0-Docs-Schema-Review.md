# XTend 0.8.0 Docs: Prüfung der generierten Schema-Beobachtungen

Der kanonische Docs-Shell-Build erzeugt neue statische Fingerprints ausschließlich in `docs/generated/shell/xtend.maraca.mjs` und `xtend.maraca.report.json`. Die 17 neu beobachteten Shapes in zehn vorhandenen Familien sind nicht authoritative. Es wird kein veröffentlichtes Schema neu baselined.

Der Scanner löst wiederverwendete minifizierte Symbole teilweise gegen einen falschen lokalen Record auf: etwa Surface- und Presentation-Methoden gegen die Descriptor-Renderer-ID. Solche Records werden hier als begrenzte Scanner-Beobachtungen akzeptiert, nicht als gültige öffentliche API-Varianten. Die eigentlichen APIs werden weiter über kanonische Quellen, Typen, neue Major-IDs und Artefakt-Parität geprüft. Report-/Plan-Records unterscheiden sich außerdem durch konkrete verschachtelte Inhalte des neu erzeugten Builds.

| Familie | Neue beobachtete Shapes | Prüfung |
| --- | --- | --- |
| `xtend.epic18.rmt-dom-descriptor-renderer.v1` | 3 | Nur generierte Quellen; keine Änderung des veröffentlichten authoritative Fingerprints |
| `xtend.epic18.rmt-surface-resource-graph-snapshot.v1` | 1 | Nur generierte Quellen; keine Änderung des veröffentlichten authoritative Fingerprints |
| `xtend.maraca.bundle-report.v1` | 1 | Nur generierte Quellen; keine Änderung des veröffentlichten authoritative Fingerprints |
| `xtend.maraca.lightbox-effect.v1` | 2 | Nur generierte Quellen; keine Änderung des veröffentlichten authoritative Fingerprints |
| `xtend.maraca.remote-play.v1` | 1 | Nur generierte Quellen; keine Änderung des veröffentlichten authoritative Fingerprints |
| `xtend.rmt.app-orchestration.v1` | 2 | Nur generierte Quellen; keine Änderung des veröffentlichten authoritative Fingerprints |
| `xtend.rmt.app-patch-plan.v1` | 1 | Nur generierte Quellen; keine Änderung des veröffentlichten authoritative Fingerprints |
| `xtend.rmt.presentation-surface-materialization.v1` | 2 | Nur generierte Quellen; keine Änderung des veröffentlichten authoritative Fingerprints |
| `xtend.surface.controller.v2` | 2 | Nur generierte Quellen; keine Änderung des veröffentlichten authoritative Fingerprints |
| `xtend.surface.record.v1` | 2 | Nur generierte Quellen; keine Änderung des veröffentlichten authoritative Fingerprints |

Die akzeptierten Hashes sind pro Familie im Schema-Inventar gebunden. Die Entscheidung gilt nur für diesen geprüften Build; neue Fingerprints benötigen erneut eine Prüfung. `releasedFingerprintSetHash`, authoritative Fingerprints und Versionsregeln bleiben unverändert. Die neuen API-Erweiterungen verwenden weiterhin `xtend.maraca.plan-runtime.v3` und `xtend.rmt.presentation-effect-adapter.v2`.

Prüfung: `node scripts/scan_schema_inventory.js --check --json` und `node scripts/run_xtend_tests.js schema-inventory contract-registry contract-runtime-parity --json`.

## Gemeinsamer Locale-Publisher

`xtend.docs.i18n.v1` wird nach der Korrektur über den gemeinsamen Locale-Service publiziert. Die Runtime liest die ID aus dem Boot-Descriptor; der doppelte Literal-Event im Route-Controller entfällt. Die verbleibende statisch beobachtete Form stammt aus der minimalen Testkonfiguration (`available`, `defaultLocale`, `fallbackLocale`) und ist keine Änderung eines authoritative Event-Vertrags. Der Gate prüft aktualisierten Locale-Zustand vor genau einer Zustellung sowie abgetrennte unveränderliche Metadaten. Die Browserprüfung bestätigt anschließend englische Suchziele nach DE→EN. Auch hierfür wird nur der konkrete nicht-authoritative Beobachtungs-Fingerprint gebunden.
