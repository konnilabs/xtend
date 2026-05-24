# Manifest Import Policy

Same-origin imports, allowed module paths and blocked URL schemes.

## What it covers

Security in XTend starts with explicit boundaries: local modules, untrusted content, clear sanitizing paths and reproducible package checks.

## Public building blocks

- Same-origin Module.
- Sanitizing for untrusted content.
- Reproduzierbare Paketprüfungen.

## Recommended workflow

Allow local modules only, treat Markdown and HTML fragments as untrusted and document every host exception explicitly.

## Next steps

- [Trusted DOM and Sanitizing](./trusted-dom-sanitizing.md)
- [Supply Chain checks](./supply-chain-gates.md)
