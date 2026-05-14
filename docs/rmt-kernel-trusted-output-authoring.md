# RMT Kernel Trusted Output Authoring

- Contract: `xtend.rmt.kernel-migration-authoring-incident-handoff.v1`
- Workpackage: `RKSH-WP-11`
- Package script: `npm run test:rmt-kernel-handoff-docs`

RMT-Authoring darf nicht davon ausgehen, dass ein String sicher ist, nur weil er aus einem Template, einer Remote Surface oder einem Adapter stammt. Jeder output-nahe Authoring-Pfad braucht eine klare Trust Boundary und einen sicheren Fallback.

## Authoring-Regeln

- Text bleibt Text: Labels, Status, User Content und Fehlermeldungen als `textContent` oder strukturierte Textfelder authoren.
- HTML nur bewusst authoren: `html_fragment` mit `sanitize html` und explizitem Scope verwenden.
- Attribute klein halten: `data-*` und `aria-*` sind bevorzugt, URL-Attribute laufen ueber `commitTrustedAttribute`.
- Properties nur fuer erlaubte Runtime-Ziele nutzen: DOM-HTML-Properties nicht als Abkuerzung verwenden.
- Fallbacks sind nicht privilegiert: `safeFallbackHtml` muss selbst sanitizbar und nicht interaktiv gefaehrlich sein.
- Remote Surface Outputs brauchen Scope, Capability, Origin und Integrity-Kontext, bevor sie in den Kernel gelangen.

## Sichere Muster

```js
runtime.commitTrustedHtml(slotTarget, {
  scope: 'slot',
  source: 'slot.html',
  html: model.safeSummaryHtml,
  policy: {
    transform: 'sanitize html',
    output: 'html_fragment'
  },
  safeFallbackHtml: '<p data-rmt-fallback="safe">Content unavailable.</p>'
});
```

```js
runtime.commitTrustedAttribute(linkTarget, {
  scope: 'binding',
  name: 'href',
  value: model.href,
  allowedProtocols: ['https:', 'mailto:']
});
```

```js
runtime.commitTrustedProperty(inputTarget, {
  scope: 'binding',
  name: 'value',
  value: model.value,
  policy: 'form-control-value'
});
```

## Authoring-Checkliste

| Frage | Sichere Antwort |
|-------|-----------------|
| Enthält der Output Markup? | `html_fragment` plus `sanitize html` und `commitTrustedHtml`. |
| Ist es nur Text? | `textContent` oder ein strukturierter Text-Record. |
| Ist es ein URL-Attribut? | `commitTrustedAttribute` mit Protokoll-Allowlist. |
| Ist es `data-*` oder `aria-*`? | Strukturierter Attribute-Commit, keine HTML-Interpolation. |
| Ist es ein Fallback? | `safeFallbackHtml` mit derselben Policy wie normale HTML-Outputs. |
| Kommt es aus Remote oder Adapter Code? | Trust Scope `remote-surface` oder `adapter-output`, Capability und Diagnostics-Korrelation. |

## No-go-Muster

- Markup aus Remote Sources direkt in `slot.html`, `prerender.html` oder `fallback.html` schleusen.
- Event-Attribute wie `onclick` als Daten transportieren.
- `style` oder HTML-nahe Properties als Escape Hatch verwenden.
- `safeFallbackHtml` aus derselben unsicheren Quelle wie den blockierten Output bilden.
- Diagnostics ignorieren, wenn ein Verdict `blocked` oder `panic` meldet.

