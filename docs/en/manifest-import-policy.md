# Manifest Import Policy

Same-origin imports, allowed module paths and blocked URL schemes.

## What it covers

Manifest import policy decides before dynamic import whether manifest and module are local, syntactically valid, and host-approved. It blocks path traversal, external origins, wrong extensions, and active URL schemes.

## Public building blocks

- `security/manifest-import-policy.js` implements URL and record checks.
- `xtend-loader.js` applies the same contracts during loading.
- Allowed modules end in `.js` or `.mjs`; manifests end in `.json`.

## Recommended workflow

Run positive and negative policy fixtures:

```bash
node scripts/run_xtend_tests.js manifest-import-policy --json
```

For a refusal, read input, normalized URL, and diagnostic code first. Fix the manifest key or path at its source. `javascript:`, `data:`, `vbscript:`, `blob:`, and an external origin do not become allowed after retry or cache busting.

## Next steps

- [Trusted DOM and Sanitizing](./trusted-dom-sanitizing.md)
- [Supply Chain checks](./supply-chain-gates.md)
