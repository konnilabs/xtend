# Manifest Import Policy

Same-origin Imports, erlaubte Modulpfade und blockierte URL-Schemata.

## Worum es geht

Security in XTend beginnt mit expliziten Grenzen: lokale Module, vertrauensarme Inhalte, klare Sanitizing-Pfade und reproduzierbare Paketprüfungen.

## Öffentliche Bausteine

- Same-origin Module.
- Sanitizing für unsichere Inhalte.
- Reproduzierbare Paketprüfungen.

## Empfohlener Ablauf

Erlaube nur lokale Module, behandle Markdown und HTML-Fragmente als unsicher und dokumentiere jede Host-Ausnahme ausdrücklich.

## Nächste Schritte

- [Trusted DOM und Sanitizing](./trusted-dom-sanitizing.md)
- [Supply Chain Checks](./supply-chain-gates.md)
