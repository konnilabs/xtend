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
