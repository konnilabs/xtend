# WP-E10-10 - x-textarea, x-status, x-progress implementieren

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps`
- Contract: `xtend.epic10.form-feedback-controls.v1`
- Bezug:
  - `development/XTend-Form-Feedback-Controls-TypeScript-RMT-Contract.md`
  - `development/XTend-P0-Komponentenwelle-und-Contract-Stubs.md`
  - `components/manifest.json`
  - `tests/components/component_suite.js`
  - `tests/catalog/component_catalog_coverage_suite.js`

## Ziel

WP-E10-10 erweitert die erste Epic-10-Komponentenlinie um Long-Form Input und Feedback Controls. `x-textarea`, `x-status` und `x-progress` sind TypeScript-first geplant, lokal als ESM lauffaehig, public typisiert, RMT-authorbar, Fabric-kompatibel, telemetry-faehig, A11y-by-design und Performance-by-design vorbereitet.

## Umgesetzte Komponenten

| Komponente | Runtime | TypeScript Source | Public Types | Suite |
|------------|---------|-------------------|--------------|-------|
| `x-textarea` | `components/xtextarea.js` | `src/components/x-textarea/x-textarea.ts` | `components/xtextarea.d.ts` | `tests/components/xtextarea.component_suite.js` |
| `x-status` | `components/xstatus.js` | `src/components/x-status/x-status.ts` | `components/xstatus.d.ts` | `tests/components/xstatus.component_suite.js` |
| `x-progress` | `components/xprogress.js` | `src/components/x-progress/x-progress.ts` | `components/xprogress.d.ts` | `tests/components/xprogress.component_suite.js` |

## Entscheidungen

- Runtime bleibt ESM und lokal unter `components/`.
- TypeScript Source bleibt Source-of-Truth unter `src/components/<tag>/`.
- Runtime-Dateinamen folgen der bestehenden Manifest-Konvention ohne Bindestrich: `x-textarea` -> `xtextarea.js`.
- `x-textarea` ist `static formAssociated = true` und nutzt `attachInternals`, wenn der Browser es anbietet.
- `x-status` und `x-progress` liefern Live-Regionen fuer RMT-Scheduler-Feedback.
- RMT sieht die Komponenten als `xtend.component` Records mit `dom_descriptor`-Authoring, nicht als Kernel-Abhaengigkeit.
- Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.
- `x-form` erkennt `x-textarea` und aktualisiert `xform-data-<id>` bei `textarea-changed`.

## Public API

| Komponente | Attribute | Events | State Keys |
|------------|-----------|--------|------------|
| `x-textarea` | `name`, `value`, `placeholder`, `required`, `disabled`, `readonly`, `maxlength`, `minlength`, `rows`, `label` | `textarea-changed`, `textarea-invalid` | `xtextarea-value-<id>` |
| `x-status` | `type`, `state`, `message`, `dismissible`, `busy`, `polite`, `label` | `status-changed`, `status-dismissed` | `xstatus-state-<id>` |
| `x-progress` | `value`, `max`, `label`, `status`, `indeterminate`, `busy` | `progress-changed`, `progress-complete` | `xprogress-value-<id>` |

## A11y und Performance

- `x-textarea` nutzt native Textarea-Semantik, Label-/Hint-/Error-Slots, Counter-Statusregion und assertive Fehlerregion.
- `x-status` nutzt `role="status"` beziehungsweise `role=alert` fuer kritische Statuspfade und spiegelt `aria-busy`.
- `x-progress` nutzt `role="progressbar"`, `aria-valuenow`, `aria-valuemax`, `aria-valuetext`, `aria-busy` und eine polite Statusregion.
- Alle drei Komponenten deklarieren `xtend.performance.component-profile.v1`.
- Die drei Controls erweitern die `enterprise-ready` Linie im Component Catalog auf sechs Komponenten.

## Gate

```bash
node scripts/run_xtend_tests.js components --json
node scripts/run_xtend_tests.js catalog-coverage --json
node scripts/run_xtend_tests.js regression-priority --json
node scripts/run_xtend_tests.js references --json
```

## Ergebnis

Der Manifest-Catalog steigt auf 34 Komponenten. Component-Suites, Fixtures und Public Types steigen auf 24. `x-textarea`, `x-status` und `x-progress` sind im Catalog `enterprise-ready`; die offenen Performance-Luecken der Legacy-Komponenten bleiben als 28 Warnungen sichtbar.

## Handoff

`WP-E10-11` kann starten und `x-tooltip`, `x-popover` sowie `x-drawer` nach demselben Muster implementieren.
