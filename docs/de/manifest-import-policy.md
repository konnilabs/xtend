# Manifest Import Policy

- Docs Contract: `xtend.docs.manifest-import-policy.v1`
- Loader Policy: `xtend.security.loader-policy.v1`
- Manifest Policy: `xtend.security.manifest-policy.v1`
- Import Policy: `xtend.security.import-policy.v1`
- Gate: `xtend.security.manifest-import-gate.v1`

XTend laedt Komponenten ueber das Manifest. Seit `ER-WP-28` wird dieser Pfad explizit abgesichert: Manifest-URLs, Manifest Records und dynamische Modul-Imports werden lokal validiert, bevor der Loader sie nutzt.

## Erlaubt

- relative URLs wie `./xalert.js`
- root-relative URLs wie `/components/xrouter.js`
- same-origin URLs
- lokale Loopback-Dev-Server wie `http://localhost:4173/components/xmodal.js`
- `.json` fuer Manifeste
- `.js` und `.mjs` fuer Module

## Verweigert

- externe CDN-/Remote-Module
- externe Manifest-URLs
- `javascript:`
- `data:` fuer Skripte
- `blob:` Module
- encoded Path Traversal wie `%2e%2e`
- Modulpfade ohne `.js` oder `.mjs`
- Manifestpfade ohne `.json`
- ungueltige Manifest-Keys
- URL-artige Dependency-Werte in Manifest-Records

## Diagnostics

Der Loader emittiert Refusals als `xtend-loader-diagnostic`:

```js
window.addEventListener('xtend-loader-diagnostic', (event) => {
  console.log(event.detail.code, event.detail.metadata.diagnostics);
});
```

Stabile Codes:

- `xtend.security.loader.refused`
- `xtend.security.manifest.invalid`
- `xtend.security.import.refused`

## Maschinenlesbare Policy

```js
const {
  classifyPolicyUrl,
  normalizeManifest
} = require('./security/manifest-import-policy');
```

Die Policy liegt unter:

```text
security/manifest-import-policy.js
```

## Lokale Gates

```bash
node scripts/verify_manifest_import_policy.js --json
node scripts/run_xtend_tests.js manifest-import-policy --json
npm run test:manifest-policy
```

Diese Checks sind offline und fragen keine externen Hosts ab.

## Zusammenhang

- [XTend Loader](./xtend-loader.md)
- [Manifest-Format](./manifest.md)
- [Trusted DOM und Sanitizing](./trusted-dom-sanitizing.md)
- [Supply-Chain Gates](./supply-chain-gates.md)
