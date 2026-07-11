# Trusted DOM und Sanitizing

Sichere DOM-Grenzen für Markdown, Descriptoren und Host-Inhalte.

## Worum es geht

Trusted DOM trennt Plain Text, validierte Attribute, strukturierte Node-Descriptoren und HTML-Fragmente. `textContent` und Node-basiertes `replaceChildren` sind bevorzugt; `innerHTML` und `insertAdjacentHTML` benötigen eine explizite Sanitizing Boundary.

## Öffentliche Bausteine

- `security/trusted-dom-policy.js` klassifiziert Markup und DOM-Sinks.
- `security/trusted-dom-policy.d.ts` beschreibt Verdict und Sanitizer-API.
- `security/xss-pentest-policy.js` enthält negative URL-, Event- und Markup-Fälle.

## Empfohlener Ablauf

Behandle Markdown- oder Parsedown-HTML auch im eigenen Repository als untrusted, bis `sanitizeTrustedDomHtml()` und die Boundary ein positives Verdict liefern. Inline Handler, `javascript:`-URLs, `eval` und `new Function` bleiben verboten. Ein Sanitizer entfernt gefährliche Inhalte; er macht eine beliebige Script-Quelle nicht zu einem erlaubten Modul. Der [Browser Proof](./trusted-dom-boundary-browser-proof.md) prüft diese Grenze in einer echten DOM-Umgebung.

## Nächste Schritte

- [Manifest Import Policy](./manifest-import-policy.md)
- [Supply Chain Checks](./supply-chain-gates.md)
- [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md)
