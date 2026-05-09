# ER-WP-33 - Component-Level-Suites fuer priorisierte Komponenten nachziehen

- Status: `completed`
- Datum: 6. Mai 2026
- Contract: `xtend.enterprise.er-wp-33.component-level-priority-suites.v1`
- Coverage Matrix: `xtend.catalog.component-coverage-matrix.v1`
- Teststandard: `development/XTend-Component-Level-Teststandard.md`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`

## Ziel

ER-WP-33 zieht die Component-Level-Suite-Basis fuer priorisierte Manifest-Komponenten nach. Nach `ER-WP-31` und `ER-WP-32` waren Source und Docs vollstaendig sichtbar, aber nur die drei Pilotkomponenten `x-alert`, `x-toast` und `x-modal` waren contract-gated. Dieses Paket erweitert die statisch gatebaren Component-Contracts auf die P0/P1-Flaechen, die fuer Enterprise-Adoption besonders kritisch sind: Routing, Forms, Overlays, Theme, Feedback, Interaction und Media.

## Scope

- P0/P1 Custom-Element-Komponenten mit lokalen Suite- und Fixture-Artefakten ausstatten
- `x-theme` als P1 Core-Modul mit eigener Modul-Suite und Fixture absichern
- Component-Suite-Harness fuer Single- und Double-Quote-Source-Stile haerten
- Aggregierten Component-Runner auf die priorisierte Suite-Breite erweitern
- Docs fuer Komponenten mit veralteten Event-/State-Bezeichnungen an den aktuellen Source-Contract angleichen
- Component Catalog Coverage Matrix von `3/28` auf `18/28` bei `componentSuite` und `fixture` aktualisieren

## Umgesetzte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `tests/components/priority_component_contracts.js` | gemeinsame Contract-Konfiguration fuer priorisierte P0/P1-Komponenten |
| `tests/components/component_contract_helpers.js` | Quote-tolerante Registration-, Shadow-DOM- und Attribute-Pruefung |
| `tests/components/component_suite.js` | Aggregat fuer 18 Component-Level-Suites |
| `tests/components/xrouter.component_suite.js` | XRouter- und RMT-Route-Contract |
| `tests/components/xlink.component_suite.js` | XRouter-Link-, Active-State- und Navigation-Contract |
| `tests/components/xinput.component_suite.js` | Form-associated Input-, Validierungs- und State-Contract |
| `tests/components/xform.component_suite.js` | Formular-, Kind-Control-, Submit-/Invalid-/Reset-Contract |
| `tests/components/xtabs.component_suite.js` | Tab-, ARIA-, Keyboard- und State-Contract |
| `tests/components/xdialog.component_suite.js` | Dialog-, Focus-, A11y- und State-Contract |
| `tests/components/xlightbox.component_suite.js` | Lightbox-, Overlay-, Global-Helper- und State-Contract |
| `tests/components/xcalendar.component_suite.js` | Kalender-, Form-, Grid- und State-Contract |
| `tests/components/xwriter.component_suite.js` | Writer-, Export-, Autosave- und Storage-Contract |
| `tests/components/xtheme.component_suite.js` | Theme-Core-Modul-, Namespace- und State-Contract |
| `tests/components/xbutton.component_suite.js` | Button-, Loading-, A11y- und State-Contract |
| `tests/components/xspinner.component_suite.js` | Spinner-, Reduced-Motion-, Busy- und State-Contract |
| `tests/components/xmenu.component_suite.js` | Menubar-, Keyboard-, Active-State- und Event-Contract |
| `tests/components/xsummary.component_suite.js` | Summary-, Open/Close-, A11y- und State-Contract |
| `tests/components/xplayer.component_suite.js` | Media-, Controls-, Events- und State-Contract |
| `tests/components/fixtures/*.component.html` | lokale Fixtures fuer die neuen Component-Suites |
| `docs/components/xinput.md` | aktueller Input-Event-, Validierungs- und State-Contract |
| `docs/components/xform.md` | aktueller Form-, State- und Live-Region-Contract |
| `docs/components/xtabs.md` | aktueller Tab-, Keyboard- und State-Contract |
| `docs/components/xlightbox.md` | aktueller Lightbox-Event-, API- und State-Contract |
| `docs/components/xcalendar.md` | aktueller Kalender-, ARIA-Grid- und State-Contract |
| `docs/components/xmenu.md` | aktueller Menubar-, Keyboard- und Active-State-Contract |
| `catalog/component-catalog-coverage.js` | Handoff-Logik nach ER-WP-33 auf `ER-WP-34`/`ER-WP-35` umgestellt |

## Ergebnis

Aktueller Snapshot nach ER-WP-33:

| Dimension | Covered | Missing |
|-----------|---------|---------|
| `source` | 28 | 0 |
| `docs` | 28 | 0 |
| `componentSuite` | 18 | 10 |
| `fixture` | 18 | 10 |
| `types` | 1 | 27 |
| `a11y` | 24 | 4 |
| `performance` | 0 | 28 |

Statusverteilung:

| Status | Anzahl |
|--------|--------|
| `documented` | 10 |
| `contract-gated` | 17 |
| `typed-contract-gated` | 1 |

`x-router` ist nun `typed-contract-gated`, weil Source, Docs, Suite, Fixture, Types und A11y vorhanden sind. Die uebrigen priorisierten Komponenten sind `contract-gated` und routen auf `ER-WP-34`, weil Public Types und Event Contracts noch fehlen. P2-/Utility-/Infrastructure-Long-Tail-Komponenten routen auf `ER-WP-35`.

## Priorisierte Abdeckung

| Profil | Komponenten |
|--------|-------------|
| Routing | `x-router`, `x-link`, `x-tabs` |
| Forms | `x-input`, `x-form`, `x-calendar`, `x-writer` |
| Overlays | `x-modal`, `x-dialog`, `x-lightbox` |
| Feedback | `x-alert`, `x-toast`, `x-spinner` |
| Interaction | `x-button`, `x-menu`, `x-summary`, `x-player` |
| Theme | `x-theme` |

## Validierung

```bash
node scripts/run_xtend_tests.js components
node scripts/run_xtend_tests.js catalog-coverage
node scripts/run_xtend_tests.js references
npm test
```

## Handoff

| Paket | Status nach ER-WP-33 | Aufgabe |
|-------|----------------------|---------|
| `ER-WP-34` | `next` | Public Types und Event Contracts fuer die contract-gated Komponenten vervollstaendigen |
| `ER-WP-35` | `planned` | Long-Tail-Suites, visuelle/browsernahe Regression und Performance-Profile priorisieren |
| `ER-WP-36` | `planned` | CI Workflow fuer Default Gates anlegen |

## Abschlussnotiz

`ER-WP-33` ist abgeschlossen. XTend hat nun fuer die Enterprise-relevanten P0/P1-Komponenten eine breite, lokale, CDN-freie Component-Level-Suite-Basis. Die naechste harte Produktreife-Luecke liegt nicht mehr in fehlenden Component-Fixtures fuer Kernflaechen, sondern in Public Types, Event-Contracts und Long-Tail-/Browser-Regression.
