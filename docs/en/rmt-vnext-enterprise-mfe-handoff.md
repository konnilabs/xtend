# RMT vNext Enterprise MFE Contract

This contract closes the Enterprise MFE path for RMT vNext. It connects remote surface manifests, the Enterprise Surface Registry, degradation, remote security, cross-surface events, remote tooling and the offline browser-smoke fixture.

## Status and schema

The stable contract is `xtend.rmt.vnext-enterprise-release-handoff.v1`. The matrix uses `xtend.rmt.vnext-enterprise-release-gate-matrix.v1`; the report uses `xtend.rmt.vnext-enterprise-release-handoff-report.v1`. The target state is `rmt-vnext-enterprise-mfe-ready`.

The local closure gate is:

```bash
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
```

This command checks more than text anchors. It also creates the Enterprise report, validates fixture, Core output and browser smoke, and verifies that the release gate matrix stays discoverable in `package.json`.

## Release assets

The release artifacts are:

- `xtendrmt/rmt-vnext-enterprise-mfe-demo.rmt`
- `xtendrmt/rmt-vnext-enterprise-mfe-demo.core.json`
- `tests/browser/fixtures/rmt-vnext-enterprise-mfe-smoke.html`
- `tests/rmt-language/fixtures/vnext-enterprise-mfe-fixture-matrix.json`

The browser smoke is intentionally offline. It must not need network calls or dynamic imports, so CI and local reviews see the same evidence.

## Gate matrix

```bash
npm run test:rmt-vnext-remote-manifest
npm run test:rmt-vnext-enterprise-registry
npm run test:rmt-vnext-degradation
npm run test:rmt-vnext-remote-security
npm run test:rmt-vnext-cross-surface-events
npm run test:rmt-vnext-event-governance
npm run test:rmt-vnext-remote-compiler
npm run test:rmt-vnext-remote-tooling
npm run test:rmt-vnext-remote-compatibility
npm run test:rmt-vnext-enterprise-fixtures
npm run test:rmt-vnext-enterprise-release
npm run test:browser
npm run test:references
```

A single article or menu change does not need to start every individual gate, but `node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json` must stay green because it ties the matrix and docs anchors together.

## Operational boundaries

The contract accepts three hard boundaries:

- `no-remote-runtime-execution-in-rmt-kernel`
- `no-implicit-global-event-bus`
- `remote-surfaces-require-explicit-owner-version-integrity-and-fallback`

These boundaries prevent a remote MFE concept from silently becoming uncontrolled runtime loading. The kernel knows surface records, policies and telemetry, but not the production loader for a foreign bundle.

## Accepted residuals

Accepted follow-up work includes production remote runtime loaders, network-backed MFE end-to-end gates and host-specific loader distribution. They do not block `rmt-vnext-enterprise-mfe-ready` because the current contract only releases the local language, registry and evidence layer.

## Specific failure modes

- Missing handoff document: check `docs/menu.json` and both locale files.
- Offline smoke calls `fetch(`: move the browser fixture back to local data.
- Core output drifts: update `xtendrmt/rmt-vnext-enterprise-mfe-demo.core.json` with the source and fixture matrix.
- Release gate missing from `package.json`: check `xtend.releaseGates`, `xtend.rmtVNextEnterpriseReleaseHandoff.releaseGateMatrix` and this contract together.
