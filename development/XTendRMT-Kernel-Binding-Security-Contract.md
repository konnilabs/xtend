# XTendRMT Kernel Binding Security Contract

- Status: `accepted-binding-security-policies`
- Datum: 14. Mai 2026
- schema: `xtend.rmt.kernel-binding-security.v1`
- Trust-Sink-Adapter: `xtend.rmt.runtime-trust-sink-adapter.v1`
- Trust Authority: `xtend.rmt.kernel-trust-authority.v1`
- Verdict: `xtend.rmt.kernel-trust-verdict.v1`
- Workpackage: `RKSH-WP-03`
- Gate: `node scripts/run_xtend_tests.js rmt-kernel-binding-security --json`

## Zweck

Dieser Contract haertet die Runtime-Binding-Sinks fuer Attribute, URL-Attribute und DOM-Properties. Nach `RKSH-WP-02` sind HTML-Sinks abgesichert; `RKSH-WP-03` verhindert nun, dass Templates Event-Handler-Attribute, gefaehrliche URL-Protokolle oder DOM-Properties mit Seiteneffekten setzen.

## Runtime-Invarianten

- `attribute` Bindings laufen ueber `commitTrustedAttribute`.
- `property` Bindings laufen ueber `commitTrustedProperty`.
- Command-Action-Attribute laufen ebenfalls ueber die Attribute-Policy.
- `data-*` und `aria-*` sind kontrolliert erlaubt.
- URL-Attribute werden als `url-attribute` klassifiziert.
- Blockierte Binding-Writes entfernen keine Trust-Evidence und committen keinen Wert.
- Verdicts und Diagnostics enthalten keinen rohen HTML-/Script-Payload.

## Attribute Policy

Erlaubt:

- `data-*`
- `aria-*`
- sichere Strukturattribute wie `id`, `class`, `title`, `role`, `slot`, `part`
- Formular-/Medienattribute aus der Runtime-Allowlist
- URL-Attribute nur mit erlaubtem Protokoll

Blockiert:

- `on*`
- `style`
- `srcdoc`
- unbekannte Attribute ohne Allowlist-Eintrag
- URL-Attribute mit `javascript:`, `vbscript:`, `data:text/html`, `data:text/javascript`, `data:application/javascript`, `data:application/ecmascript`

## Property Policy

Erlaubt:

- text- und value-nahe Properties wie `textContent`, `innerText`, `value`, `checked`, `disabled`
- sichere Identitaets- und A11y-Properties wie `id`, `title`, `role`, `ariaLabel`, `ariaDescription`
- URL-nahe Properties nur mit erlaubtem Protokoll

Blockiert:

- `innerHTML`
- `outerHTML`
- `srcdoc`
- `on*`
- unbekannte Properties ohne Allowlist-Eintrag

## Diagnostics

Blockierte Writes publizieren `rmt.kernel.trust` Diagnostics mit:

- `rmt.kernel.trust.attribute_refused`
- `rmt.kernel.trust.url_protocol_refused`
- `rmt.kernel.trust.property_refused`

Alle Verdicts tragen `workpackage: "RKSH-WP-03"` und koennen ueber `listTrustVerdicts()` inspiziert werden.

## Akzeptanz

- Gefaehrliche URL-Protokolle werden blockiert.
- Event-Handler-Attribute koennen nicht aus Templates gesetzt werden.
- Property-Writes sind nachvollziehbar begrenzt.
- Der lokale Gate ist:

```bash
node scripts/run_xtend_tests.js rmt-kernel-binding-security --json
```
