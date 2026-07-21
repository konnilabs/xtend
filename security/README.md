# XTend Security Contracts

Status: introduced with ER-WP-29 and extended with ER-WP-30 and ER-WP-28

## Purpose

`security/` holds repo-local, machine-readable security contracts and the narrow reference sanitizers that enforce those contracts at declared framework boundaries.

## Manifest Import Policy

`manifest-import-policy.js` exposes:

- `xtend.security.loader-policy.v1`
- `xtend.security.manifest-policy.v1`
- `xtend.security.import-policy.v1`
- `xtend.security.manifest-import-gate.v1`

The policy classifies Manifest URLs, Manifest Records and dynamic module URLs as local allowed imports or refused security boundaries. It is mirrored by `xtend-loader.js` for runtime Refusals and by `tests/security/manifest_import_policy_suite.js` for local gates.

## Trusted DOM

`trusted-dom-policy.js` exposes:

- `xtend.security.trusted-dom-policy.v1`
- `xtend.security.sanitizing-boundary.v1`
- `xtend.security.markup-classification.v1`
- `xtend.security.trusted-dom-sink.v1`
- `xtend.security.trusted-text-sanitizer.v1`

The policy classifies text, attributes, structured templates, RMT `html_fragment` and Parsedown HTML, then maps them to allowed, restricted or forbidden DOM sinks.
`sanitizeTrustedText()` is the canonical AppService plain-text boundary: it normalizes line endings and fails closed on non-strings or prohibited control characters without recording raw input.

## Supply Chain

`supply-chain-gate-policy.js` exposes:

- `xtend.security.supply-chain-gate-plan.v1`
- `xtend.security.dependency-audit-gate.v1`
- `xtend.security.license-policy.v1`
- `xtend.security.vulnerability-policy.v1`
- `xtend.security.release-supply-chain-gate.v1`

The policy defines the offline local gate, planned CI audit commands, license rules, vulnerability thresholds and publish boundary for later release automation.

## Gates

```bash
node --check security/trusted-dom-policy.js
node --check security/supply-chain-gate-policy.js
node --check security/manifest-import-policy.js
node scripts/verify_manifest_import_policy.js --json
node scripts/verify_supply_chain_policy.js --json
node scripts/run_xtend_tests.js manifest-import-policy --json
node scripts/run_xtend_tests.js supply-chain --json
node scripts/run_xtend_tests.js references --json
```
