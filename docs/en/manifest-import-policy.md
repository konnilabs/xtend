# Manifest Import Policy

- Docs Contract: `xtend.docs.manifest-import-policy.v1`
- Loader Policy: `xtend.security.loader-policy.v1`
- Manifest Policy: `xtend.security.manifest-policy.v1`
- Import Policy: `xtend.security.import-policy.v1`
- Gate: `xtend.security.manifest-import-gate.v1`

XTend loads components through the manifest. Since `ER-WP-28`, this path is
explicitly secured: manifest URLs, manifest records, and dynamic module imports
are validated locally before the loader uses them.

## Allowed

- relative URLs such as `./xalert.js`
- root-relative URLs such as `/components/xrouter.js`
- same-origin URLs
- local loopback dev servers such as `http://localhost:4173/components/xmodal.js`
- `.json` for manifests
- `.js` and `.mjs` for modules

## Refused

- external CDN/remote modules
- external manifest URLs
- `javascript:`
- `data:` for scripts
- `blob:` modules
- encoded path traversal such as `%2e%2e`
- module paths without `.js` or `.mjs`
- manifest paths without `.json`
- invalid manifest keys
- URL-like dependency values in manifest records

## Diagnostics

The loader emits refusals as `xtend-loader-diagnostic`:

```js
window.addEventListener('xtend-loader-diagnostic', (event) => {
  console.log(event.detail.code, event.detail.metadata.diagnostics);
});
```

Stable codes:

- `xtend.security.loader.refused`
- `xtend.security.manifest.invalid`
- `xtend.security.import.refused`

## Machine-Readable Policy

```js
const {
  classifyPolicyUrl,
  normalizeManifest
} = require('./security/manifest-import-policy');
```

The policy lives at:

```text
security/manifest-import-policy.js
```

## Local Gates

```bash
node scripts/verify_manifest_import_policy.js --json
node scripts/run_xtend_tests.js manifest-import-policy --json
npm run test:manifest-policy
```

These checks are offline and do not contact external hosts.

## Related Topics

- [XTend Loader](./xtend-loader.md)
- [Manifest Format](./manifest.md)
- [Trusted DOM and Sanitizing](./trusted-dom-sanitizing.md)
- [Supply-Chain Gates](./supply-chain-gates.md)
