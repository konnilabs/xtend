# WP-RKSH-03 - Attribute-, URL- und Property-Policies haerten

- Status: `completed`
- Datum: 14. Mai 2026
- Workpackage: `RKSH-WP-03`
- Contract: `xtend.rmt.kernel-binding-security.v1`
- Adapter: `xtend.rmt.runtime-trust-sink-adapter.v1`
- Trust Authority: `xtend.rmt.kernel-trust-authority.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-kernel-binding-security --json`

## Ziel

`RKSH-WP-03` schliesst die P0-Luecke `RKSH-F04`: Attribute und DOM-Properties werden nicht mehr direkt aus Template-Bindings gesetzt. Der Runtime Renderer bewertet Binding-Writes vor dem Commit und blockiert gefaehrliche Attribute, URL-Protokolle und Properties mit Seiteneffekten.

## Umsetzung

- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`
- `tests/rmt-language/rmt_kernel_binding_security_suite.js`
- `development/XTendRMT-Kernel-Binding-Security-Contract.md`

Der Runtime Renderer nutzt nun:

- `commitTrustedAttribute`
- `commitTrustedProperty`
- `createRuntimeBindingVerdict`

Die vorhandene Evidence-API `listTrustVerdicts()` bleibt die gemeinsame Auskunftsflaeche fuer WP-02 und WP-03.

## Binding-Regeln

Erlaubt:

- `data-*`
- `aria-*`
- sichere Strukturattribute
- sichere URL-Attribute mit lokalem, `http:`, `https:`, `mailto:`, `tel:` oder `data:image/*` Ziel
- sichere Properties wie `textContent`, `value`, `checked`, `disabled`, `ariaLabel`

Blockiert:

- `on*`
- `style`
- `srcdoc`
- unbekannte Attribute
- `javascript:` und vergleichbare gefaehrliche URL-Protokolle
- `innerHTML`, `outerHTML`, `srcdoc` und Event-Handler-Properties
- unbekannte Properties

## Negative Fixtures

Der Gate prueft alle drei Runtime-Artefakte gegen:

- `href="java\nscript:alert(1)"`
- `onclick`
- `style`
- unbekannte Attribute
- `innerHTML` Property
- `onclick` Property
- Command-Binding mit `actionAttribute: "onclick"`

## Akzeptanzstatus

- Gefaehrliche URL-Protokolle werden blockiert.
- Event-Handler-Attribute koennen nicht aus Templates gesetzt werden.
- Property-Writes sind nachvollziehbar begrenzt.
- Blockierte Writes publizieren `rmt.kernel.trust` Diagnostics.
- Package-Script: `npm run test:rmt-kernel-binding-security`

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-kernel-binding-security --json
```

Empfohlene Folge-Gates:

```bash
node scripts/run_xtend_tests.js rmt-kernel-trust-authority rmt-kernel-trusted-dom-runtime rmt-kernel-binding-security type-exports-rmt references --json
node scripts/verify_xtendrmt_artifact_parity.js --json
```

## Handoff

`RKSH-WP-04` kann die blockierten Binding-Verdicts als Panic-Kandidaten bewerten und Schwellenwerte fuer wiederholte Trust-Verletzungen definieren.
