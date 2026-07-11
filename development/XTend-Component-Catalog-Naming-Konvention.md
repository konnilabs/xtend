# XTend Component Catalog Naming-Konvention

- Status: Accepted
- Datum: 6. Mai 2026
- Contract: `xtend.catalog.naming-convention.v1`
- Workpackage: `ER-WP-32`
- Bezug:
  - `components/manifest.json`
  - `docs/components/`
  - `docs/menu.json`
  - `catalog/component-catalog-coverage.js`

## Zweck

ER-WP-32 schliesst die Naming- und Doku-Luecken aus der Component Catalog Coverage Matrix. Die Entscheidung verhindert, dass Manifest-Keys, Source-Dateien, Custom-Element-Tags, Docs-Slugs und Menu-Slugs wieder auseinanderlaufen.

## Entscheidung

XTend fuehrt zwei getrennte Namen bewusst weiter:

| Ebene | Regel | Beispiel |
|-------|-------|----------|
| Manifest-Key | kanonischer Runtime- und Catalog-Name | `x-summary` |
| Custom Element Tag | identisch zum Manifest-Key, wenn das Modul ein Custom Element registriert | `customElements.define("x-summary", XSummary)` |
| Source-Basename | historisch kompakter Modulname ohne Bindestrich | `xsummary.js` |
| Component-Doku | Source-Basename plus `.md` | `docs/components/xsummary.md` |
| Docs-Menu-Slug | `components-` plus Source-Basename | `components-xsummary` |
| Anzeige-Label | lesbare Produktform | `X-Summary` |

Diese Regel ist kompatibel zum aktuellen Manifest und vermeidet riskante Datei- oder Import-Renames. Neue Komponenten duerfen spaeter ueber Scaffold-Policies strenger ausgerichtet werden, aber bestehende Runtime-Pfade bleiben stabil.

Fortschreibung nach `WP-E13-12A`: `x-icon` folgt der Bestandregel mit Manifest-Key `x-icon`, Custom Element `<x-icon>`, Source `components/xicon.js`, Types `components/xicon.d.ts`, Component-Doku `docs/components/xicon.md` und Docs-Menu-Slug `components-xicon`.

## Ausnahmen

| Eintrag | Entscheidung |
|---------|--------------|
| `xstate` | Plattform-/State-Modul mit Manifest-Key, Source und Docs-Slug `xstate`; kein hyphenated Custom Element. |
| `x-utils` | Utility-Modul mit Manifest-Key `x-utils`, Source/Docs-Slug `xutils`; kein Custom Element. |
| `x-theme` | Manifest-Key bleibt `x-theme`, Source/Docs-Slug bleibt `xtheme`, Runtime-Fassade liegt unter `window.XTend.theme` und `window.XTheme`. |

## ER-WP-32 Umsetzung

- `docs/components/xsummary.md` dokumentiert `x-summary`.
- `docs/components/xutils.md` dokumentiert `x-utils`.
- `docs/menu.json` fuehrt `components-xsummary` und `components-xutils`.
- `docs/en/README.md` und `docs/components.md` beschreiben die Konvention.
- Die Catalog Coverage Matrix steigt bei `docs` von `26/28` auf `28/28`.

## Folgepakete

| Paket | Aufgabe |
|-------|---------|
| `ER-WP-33` | Component-Level-Suites, Fixtures, A11y- und Performance-Profile fuer priorisierte Komponenten nachziehen |
| `ER-WP-34` | Public Types und Event Contracts vervollstaendigen |
| `ER-WP-35` | visuelle und browsernahe Regression priorisieren |

## Gate

```bash
npm run test:catalog-coverage
node scripts/run_xtend_tests.js references
```
