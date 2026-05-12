# RMT vNext Enterprise MFE Handoff

Epic 16 schliesst RMT vNext fuer Enterprise-MFE-Authoring mit Remote Surfaces,
Surface Discoverability, Cross Surface Events, Security Policies, Versionierung
und Graceful Degradation ab.

## Contract

```js
schema: "xtend.rmt.vnext-enterprise-release-handoff.v1"
reportSchema: "xtend.rmt.vnext-enterprise-release-handoff-report.v1"
gateMatrixSchema: "xtend.rmt.vnext-enterprise-release-gate-matrix.v1"
targetReadiness: "rmt-vnext-enterprise-mfe-ready"
```

## Release Assets

- Authoring Guide: `docs/rmt-vnext-remote-surfaces.md`
- Registry Reference: `docs/rmt-vnext-surface-registry-enterprise.md`
- Event Protocol Reference: `docs/rmt-vnext-cross-surface-events.md`
- Operational Handoff: `docs/rmt-vnext-enterprise-mfe-handoff.md`
- Demo Source: `xtendrmt/rmt-vnext-enterprise-mfe-demo.rmt`
- Core Output: `xtendrmt/rmt-vnext-enterprise-mfe-demo.core.json`
- Browser Smoke: `tests/browser/fixtures/rmt-vnext-enterprise-mfe-smoke.html`
- Fixture Matrix: `tests/rmt-language/fixtures/vnext-enterprise-mfe-fixture-matrix.json`

## Release Gate Matrix

```bash
node scripts/run_xtend_tests.js rmt-vnext-remote-manifest --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-registry --json
node scripts/run_xtend_tests.js rmt-vnext-degradation --json
node scripts/run_xtend_tests.js rmt-vnext-remote-security --json
node scripts/run_xtend_tests.js rmt-vnext-cross-surface-events --json
node scripts/run_xtend_tests.js rmt-vnext-event-governance --json
node scripts/run_xtend_tests.js rmt-vnext-remote-compiler --json
node scripts/run_xtend_tests.js rmt-vnext-remote-tooling --json
node scripts/run_xtend_tests.js rmt-vnext-remote-compatibility --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-fixtures --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js browser --json
```

## Operational Notes

- Remote Surfaces bleiben Contract-Artefakte. Ein produktiver Runtime Loader ist
  Folgearbeit im Host- oder Runtime-Adapter-Pfad.
- `surface.registry` macht Ownership, aktive Versionen und Shell Bindings
  sichtbar, ersetzt aber keinen SurfaceManager.
- Cross Surface Events benoetigen typisierte Payloads, klare Owner und explizite
  Richtung.
- Graceful Degradation ist verpflichtend. Systeme ohne Fallback- oder
  Blockierungsmodell gelten nicht als Enterprise-ready.
- Migration aus Legacy-Surface-Fakten bleibt `report-only` per Default; Preview
  ist opt-in und wird ueber `xtend.rmt.vnext-remote-surface-migration.v1`
  beschrieben.

## Accepted Residuals

- Kein produktiver Remote Runtime Loader im RMT-Kernel.
- Keine echte Netzwerk-Integration in lokalen Language-Layer-Gates.
- Keine implizite globale Event-Bus-Semantik.
- Kein Public-Runtime-Claim fuer Hosts, die den Contract noch nicht umsetzen.

Der lokale Abschluss-Gate ist:

```bash
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
```
