# Docs RMT Production Hardening

Production Hardening fuer Docs RMT koppelt Parsedown, RMT HTML-Fragmente und strukturierte DOM-Descriptoren an Trusted-DOM-Grenzen.

- Schema: `xtend.epic13.docs-rmt-production-hardening.v1`
- Trusted DOM Boundary: `xtend.epic13.trusted-dom-boundary.v1`
- Browser Proof: `./trusted-dom-boundary-browser-proof.md`
- Handoff: `WP-E13-13`

## Pruefpfad

```bash
node scripts/run_xtend_tests.js epic13-docs-rmt-production-hardening --json
node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json
```

Der Hardening-Pfad bleibt lokal pruefbar und koppelt keinen Sanitizer in den RMT-Kernel.
