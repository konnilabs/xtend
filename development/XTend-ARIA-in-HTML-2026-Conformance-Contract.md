# XTend ARIA in HTML 2026 Conformance Contract

- Schema: `xtend.a11y.aria-in-html-conformance.v1`
- Report: `xtend.a11y.aria-in-html-conformance-report.v1`
- Baseline: [ARIA in HTML, W3C Recommendation vom 11. August 2026](https://www.w3.org/TR/2026/REC-html-aria-20260811/)
- Gate: `aria-in-html-conformance`
- Status: `internal-author-conformance-baseline`

## Claim-Grenze

Die Recommendation ist eine Autorenspezifikation. Sie belegt weder Browser-Support noch AOM- oder Screenreader-Verhalten. Der Gate prueft einen bewusst begrenzten, von XTend verwendeten Markup-Ausschnitt. Accessibility-Tree-, Browser- und AT-Evidence bleibt getrennt und engine-spezifisch.

## Gepruefter Ausschnitt

Die versionierte Matrix prueft native Semantik, erlaubte Rollen und ARIA-Attribute, Naming-Prohibition sowie die 2026-relevanten Regeln fuer `summary`, `label`, `selectedcontent` und Custom Select, `html`, `img` und `aria-hidden` zusammen mit `hidden`.

Die priorisierten Component-Snapshots decken `x-button`, `x-input`, `x-select`, `x-form`, `x-summary`, `x-dialog`, `x-modal` und `x-toast` in den deklarierten Phasen `ssr`, `pre-hydration` und `post-hydration` ab. Die Phasenpruefung ist Markup-Conformance-Evidence, keine Behauptung ueber einen identischen Accessibility Tree vor und nach Hydration.

## Native Ownership

Ein direktes `<summary>`-Kind von `<details>` erhaelt keine redundante `button`-Rolle und kein manuell gespiegeltes `aria-expanded`; der Browser besitzt diese native Disclosure-Semantik. Oeffentliches `open`, XTend-Events und der `xsummary-open-<id>`-State bleiben davon unberuehrt.

Redundante implizite Rollen, die laut Recommendation zwar nicht empfohlen, aber konform sind, werden als Advisory und nicht als Fehler behandelt. Unzulaessige Rollen, Attribute und Naming-Konstellationen blockieren den Gate.

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js aria-in-html-conformance --json
```

Der Gate ist Teil von `test:a11y`, den PR-/Release-Gates und `test:feature-adoption-observatory`. Er fuehrt keine Runtime-Dependency, keinen Package-Export und keine oeffentliche API ein.
