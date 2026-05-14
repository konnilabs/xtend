# RC1 Migration Notes

Contract: `xtend.epic13.rc1-migration-notes-semver.v1`

WP-E13-12 bereitet die Konsumentenkommunikation fuer den ersten RC1-Kandidaten vor. Der vorgeschlagene Stand ist `0.1.0-rc.1`, bleibt aber bis zur finalen Release-Owner-Freigabe privat und nicht publishbar.

## SemVer

| Feld | Wert |
| --- | --- |
| Current Version | `0.0.0-enterprise-readiness` |
| Proposed Version | `0.1.0-rc.1` |
| Classification | `minor-pre-1.0-release-candidate` |
| Publish | blockiert, `private: true` |

## Migration Sections

### loader-local-esm-cdn-free

XTend-Apps sollen lokale ESM-Loader-Pfade nutzen. Deprecated CDN-Bootstraps, insbesondere alte `xstate`-Referenzen, gehoeren nicht mehr in RC1-nahe Apps.

### package-export-surface

Der Package Export Lock ist die verbindliche Public Surface. Neue Tooling-Exports, darunter `./catalog/epic13-rc1-migration-notes`, muessen im Export Lock, README, Changelog und den Release-Gates auftauchen.

### rmt-first-app-authoring

RMT ist der Shell-first App Authoring Pfad. XTend-Komponenten werden ueber Adapter angebunden; der RMT-Kernel importiert keine XTend-Typen.

### docs-rmt-parsedown-shell

Parsedown ist eine schedulbare Docs-Komponente innerhalb der RMT Shell. Rich HTML oder Multimedia Slots koennen spaeter daneben orchestriert werden.

### trusted-dom-boundary

`dom_descriptor` bleibt bevorzugt. `html_fragment` und Parsedown HTML muessen vor DOM-Sinks ueber `xtend.security.trusted-dom-sanitizer.v1` laufen.

### fabric-lanes-telemetry

Fabric, Lanes und RMT Lane Mapping sind die bevorzugte Bruecke fuer Telemetry und Scheduler-Signale in Komponenten.

### component-typescript-and-dts

Komponenten-Typen und `.d.ts`-Dateien sind Teil des Consumer Contracts. App-Code soll diese Typen statt impliziter DOM-Konventionen konsumieren.

### known-residuals-and-watchpoints

`xstate` und `x-utils` bleiben Boundary Contracts. Der alte Hydration-Watchpoint ist geschlossen, sollte aber in RC1-Gates sichtbar bleiben.

### visual-owner-artifacts

Visual Proofs bleiben owner-reviewbar. Lokale Gates duerfen statisch bleiben; CI oder Release Owner koennen Screenshots als Artefakt bereitstellen.

### conditional-network-evidence

Audit und SBOM werden entweder ausgefuehrt oder explizit owner-deferred. Ohne Evidence oder Deferral gibt es keine Publish-Freigabe.

### publish-boundary

`private: true` bleibt gesetzt. Automatisches Publish ist bis zum finalen RC1-Handoff blockiert.

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js epic13-rc1-migration-notes --json
npm run test:epic13-rc1-migration-notes
```

Der direkte Handoff aus diesem Paket war `WP-E13-13` mit `rc1-gate-matrix-ci-handoff`; die zugehoerige Gate Matrix ist inzwischen unter [RC1 Gate Matrix und CI-Handoff](./rc1-gate-matrix-ci-handoff.md) dokumentiert.
