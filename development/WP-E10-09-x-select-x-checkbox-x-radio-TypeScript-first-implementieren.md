# WP-E10-09 - x-select, x-checkbox, x-radio TypeScript-first implementieren

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps`
- Contract: `xtend.epic10.form-selection-controls.v1`
- Bezug:
  - `development/XTend-Form-Selection-Controls-TypeScript-RMT-Contract.md`
  - `development/XTend-P0-Komponentenwelle-und-Contract-Stubs.md`
  - `components/manifest.json`
  - `tests/components/component_suite.js`
  - `tests/catalog/component_catalog_coverage_suite.js`

## Ziel

WP-E10-09 liefert die erste echte Epic-10-Komponentenwelle. `x-select`, `x-checkbox` und `x-radio` sind TypeScript-first geplant, lokal als ESM lauffaehig, public typisiert, RMT-authorbar, Fabric-kompatibel, telemetry-faehig, A11y-by-design und Performance-by-design vorbereitet.

## Umgesetzte Komponenten

| Komponente | Runtime | TypeScript Source | Public Types | Suite |
|------------|---------|-------------------|--------------|-------|
| `x-select` | `components/xselect.js` | `src/components/x-select/x-select.ts` | `components/xselect.d.ts` | `tests/components/xselect.component_suite.js` |
| `x-checkbox` | `components/xcheckbox.js` | `src/components/x-checkbox/x-checkbox.ts` | `components/xcheckbox.d.ts` | `tests/components/xcheckbox.component_suite.js` |
| `x-radio` | `components/xradio.js` | `src/components/x-radio/x-radio.ts` | `components/xradio.d.ts` | `tests/components/xradio.component_suite.js` |

## Entscheidungen

- Runtime bleibt ESM und lokal unter `components/`.
- TypeScript Source bleibt Source-of-Truth unter `src/components/<tag>/`.
- Runtime-Dateinamen folgen der bestehenden Manifest-Konvention ohne Bindestrich: `x-select` -> `xselect.js`.
- Alle drei Komponenten sind `static formAssociated = true` und nutzen `attachInternals`, wenn der Browser es anbietet.
- RMT sieht die Komponenten als `xtend.component` Records mit `dom_descriptor`-Authoring, nicht als Kernel-Abhaengigkeit.
- Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.
- `x-form` erkennt die neuen Controls und aktualisiert `xform-data-<id>` bei `select-changed`, `checkbox-changed` und `radio-changed`.
- Checkboxen liefern im `x-form` Boolean-Werte; Radio-Gruppen liefern den Wert des aktivierten Controls.

## Public API

| Komponente | Attribute | Events | State Keys |
|------------|-----------|--------|------------|
| `x-select` | `name`, `value`, `disabled`, `required`, `multiple`, `placeholder`, `label` | `select-changed`, `select-invalid` | `xselect-value-<id>` |
| `x-checkbox` | `name`, `value`, `checked`, `disabled`, `required`, `indeterminate`, `label` | `checkbox-changed`, `checkbox-invalid` | `xcheckbox-checked-<id>` |
| `x-radio` | `name`, `value`, `checked`, `disabled`, `required`, `label` | `radio-changed`, `radio-invalid` | `xradio-checked-<id>`, `xradio-value-<name>` |

## A11y und Performance

- `x-select` nutzt `role="combobox"`, Label-/Hint-/Error-Slots und eine assertive Fehlerregion.
- `x-checkbox` spiegelt `aria-checked`, inklusive `mixed` fuer `indeterminate`.
- `x-radio` koordiniert Gruppen ueber `name` und unterstuetzt Space sowie Arrow-Key Navigation.
- Alle drei Komponenten deklarieren `xtend.performance.component-profile.v1`.
- Die drei Controls sind dadurch die erste `enterprise-ready` Linie im Component Catalog.

## Gate

```bash
node scripts/run_xtend_tests.js components --json
node scripts/run_xtend_tests.js catalog-coverage --json
node scripts/run_xtend_tests.js regression-priority --json
node scripts/run_xtend_tests.js references --json
```

## Ergebnis

Der Manifest-Catalog steigt auf 31 Komponenten. Component-Suites, Fixtures und Public Types steigen auf 21. `x-select`, `x-checkbox` und `x-radio` sind im Catalog `enterprise-ready`; die offenen Performance-Luecken der Legacy-Komponenten bleiben als 28 Warnungen sichtbar.

## Handoff

`WP-E10-10` kann starten und `x-textarea`, `x-status` sowie `x-progress` nach demselben Muster implementieren.
