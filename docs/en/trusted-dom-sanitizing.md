# Trusted DOM and Sanitizing

Safe DOM boundaries for Markdown, descriptors and host content.

## What it covers

Trusted DOM distinguishes plain text, validated attributes, structured node descriptors, and HTML fragments. `textContent` and node-based `replaceChildren` are preferred; `innerHTML` and `insertAdjacentHTML` require an explicit sanitizing boundary.

## Public building blocks

- `security/trusted-dom-policy.js` classifies markup and DOM sinks.
- `security/trusted-dom-policy.d.ts` describes verdicts and sanitizer API.
- `security/xss-pentest-policy.js` contains negative URL, event, and markup cases.

## Recommended workflow

Treat Markdown or Parsedown HTML as untrusted even when it lives in the repository, until `sanitizeTrustedDomHtml()` and the boundary return a positive verdict. Inline handlers, `javascript:` URLs, `eval`, and `new Function` remain forbidden. A sanitizer removes dangerous content; it does not turn arbitrary script sources into allowed modules. The [browser proof](./trusted-dom-boundary-browser-proof.md) exercises this boundary in a real DOM.

## Next steps

- [Manifest Import Policy](./manifest-import-policy.md)
- [Supply Chain checks](./supply-chain-gates.md)

## Migrate RMT output

The Trust Boundary also applies to `slot.html`, `prerender.html`, `fallback.html` and output from `remote-surface` or `adapter-output`. An `html_fragment` requires the declared boundary contract and `sanitize html`; a private endpoint or prewarm cache does not establish implicit trust.

| Output | Safe integration |
| --- | --- |
| Text | `textContent` or a text descriptor, without HTML interpretation. |
| HTML | Renderer trust path `commitTrustedHtml` with a checked `RmtKernelRuntimeTrustVerdict` and `commitAllowed`. |
| Attributes | Validated binding path `commitTrustedAttribute`; `data-*` and `aria-*` carry data and semantics. |
| Properties | Validated binding path `commitTrustedProperty`, without arbitrary object or DOM access. |
| Fallback | `safeFallbackHtml` passes the same HTML check; its name alone does not authorize a commit. |

`commitTrustedAttribute` and `commitTrustedProperty` name the renderer's internal binding guards, not freely callable Maraca facade methods. Inline handlers such as `onclick`, unchecked `style`, `srcdoc` and `javascript:` URLs belong in negative migration cases. Repair the source contract; do not remove a guard to force a blocked commit.

For SemVer, newly blocking previously allowed legacy output is `major`; compatible warnings or opt-in diagnostics are `minor`; documentation-only or metadata corrections are `patch`. XTend 0.8.0 follows its announced breaking pre-1.0 migration.

```bash
node scripts/run_xtend_tests.js rmt-kernel-security-regression --json
```

The [DEV API](./xtend-dev-api.md) describes redacted panic/recovery data for investigating blocked output. A presentation [Abort Boundary](./maraca-fastpass-abort-boundary.md) additionally checks temporal validity; it does not replace a Trust Boundary.
