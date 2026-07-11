# Supply Chain Checks

License, dependency and package checks for publishable builds.

## What it covers

Supply-chain gates check dependency inventory, lockfile, licenses, vulnerability policy, and published package roots. The local default remains offline; registry-dependent audits run as an explicitly enabled CI step.

## Public building blocks

- `security/supply-chain-gate-policy.js` defines gates and accepted licenses.
- `package.json` and workspace manifests provide package and dependency facts.
- `typescript` is build tooling in `devDependencies`; runtime dependencies remain empty.

## Recommended workflow

Run reproducible local policy first:

```bash
node scripts/run_xtend_tests.js supply-chain --json
```

A failure names its gate, package, and policy reason. Correct the manifest, lockfile, license decision, or package root. Do not hide a finding by moving a dependency to development when runtime code imports it. Network audit and SBOM complement this report but do not replace it.

## Next steps

- [Trusted DOM and Sanitizing](./trusted-dom-sanitizing.md)
- [Manifest Import Policy](./manifest-import-policy.md)
