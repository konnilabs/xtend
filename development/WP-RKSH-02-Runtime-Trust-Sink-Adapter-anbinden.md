# WP-RKSH-02 - Runtime Trust-Sink-Adapter anbinden

- Status: `completed`
- Datum: 14. Mai 2026
- Workpackage: `RKSH-WP-02`
- Contract: `xtend.rmt.kernel-trusted-dom-runtime.v1`
- Adapter: `xtend.rmt.runtime-trust-sink-adapter.v1`
- Trust Authority: `xtend.rmt.kernel-trust-authority.v1`
- Boundary: `xtend.security.sanitizing-boundary.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-kernel-trusted-dom-runtime --json`

## Ziel

`RKSH-WP-02` schliesst die P0-Luecken `RKSH-F02` und `RKSH-F03`: HTML-Fragmente und Fallback-Markup duerfen nicht mehr direkt in DOM-Sinks geschrieben werden. Der RMT-Kernel erzeugt vor dem Commit ein Trust Verdict und committed nur die sanitisierten Bytes.

## Umsetzung

- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`
- `xtendrmt/rmt-core.d.ts`
- `tests/rmt-language/rmt_kernel_trusted_dom_runtime_suite.js`
- `development/XTendRMT-Kernel-Trusted-DOM-Runtime-Contract.md`

Die generierten Runtime-Artefakte enthalten nun einen lokalen Trust-Sink-Adapter. Der Adapter:

- normalisiert HTML-Commits fuer Slots, Prerender-Chunks, Nested/Repeat-Fallbacks und Error Boundaries
- sanitisiert HTML ueber `xtend.security.sanitizing-boundary.v1`
- erzeugt `xtend.rmt.kernel-trust-verdict.v1`
- publiziert redaktierte Runtime-Diagnostics auf `rmt.kernel.trust`
- exponiert Evidence ueber `listTrustVerdicts()`

## Getroffene Entscheidung

Legacy-RMT-HTML wird in diesem WP nicht pauschal blockiert, sondern vor dem Commit sanitisiert. Dadurch bleiben vorhandene autorisierte `html_fragment` Templates lauffaehig, waehrend gefaehrliche Outputs entfernt und sichtbar als `sanitized` Verdict dokumentiert werden.

## Negative Fixtures

Der Gate prueft alle drei Runtime-Artefakte gegen:

- `<script>`
- `iframe`
- `on*` Attribute
- `javascript:` URLs
- `srcdoc`

Die Fixtures laufen durch:

- `slot.html`
- `prerender.html`
- `fallback.html`

## Akzeptanzstatus

- Kein gepruefter unsicherer HTML-String erreicht einen Runtime-DOM-Sink ungeprueft.
- Fallback-Markup nutzt dieselbe Policy wie normale Template-Outputs.
- Runtime Evidence ist typisiert durch `RmtKernelRuntimeTrustVerdict`.
- Package-Script: `npm run test:rmt-kernel-trusted-dom-runtime`

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-kernel-trusted-dom-runtime --json
```

Empfohlene Folge-Gates nach Integration:

```bash
node scripts/run_xtend_tests.js rmt-kernel-trust-authority rmt-kernel-trusted-dom-runtime type-exports-rmt references --json
node scripts/verify_xtendrmt_artifact_parity.js --json
```

## Handoff

`RKSH-WP-03` kann auf dieser Evidence-API aufsetzen und Attribute-, URL- und Property-Policies ueber dieselbe Trust-Schicht haerten.
