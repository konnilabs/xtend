# XTM-12 - XTend Material Catfooding Report

Status: `implemented`  
Produkt: `products/xtend-material-workbench`  
Report-Schema: `xtend.material.catfooding-report.v1`

## Pilotentscheidung

Die Catfooding-Flaeche ist eine eigene, nicht publizierte Operations-Workbench im `products/`-Verzeichnis. Sie projiziert Browser-, Performance- und Lesson-Evidence aus XTM-10 und XTM-11 in eine reale RMT-first App. Damit bleibt der Pilot unabhaengig von den angepassten Designs anderer Produkte und prueft App Shell, Navigation, Dashboard, Form, Content, Settings, Empty State, Confirmation und Feedback als zusammenhaengenden Workflow.

Die App stammt nachweisbar vom XTM-09-Preset `xtend.scaffold.app-preset.material.v1` ab. Tailwind ist ausschliesslich die lokale Build-Dependency des Maraca CSS Providers; Produkt-Autoren verwenden nur semantische `xtm-*`-Klassen.

## Before/After Matrix

| Messpunkt | Scaffold-/XTM-11-Baseline | Catfooding-Pilot | Bewertung |
| --- | ---: | ---: | --- |
| authored files | 5 | 12 | Produktlogik, Evidence, Site und Tests sind explizit getrennt |
| RMT surfaces | 5 | 15 | Shell plus reale Operations-Flows |
| semantische Recipes | 5 | 23 | kein Tailwind-Klassensalat |
| direkte Tailwind Utilities | 0 | 0 | DX-Boundary eingehalten |
| CSS raw | 13.722 B | 14.549 B Tune / 14.550 B External Build | innerhalb XTM-11-Budget |
| CSS gzip | 2.587 B | 2.837 B im Erstlauf | blockierende Report-Evidence |
| Cold Build | 204,990 ms Provider-Baseline | 5.508,446 ms Full-Maraca-Erstlauf | unterschiedliche Messgrenzen bleiben sichtbar |
| severe A11y findings | 0 | 0 | XTM-10-Evidence plus semantische Landmark-Pruefung |
| Visual Defects | 0 | 0 | Desktop- und Mobile-Screenshot muessen entstehen |

Zeitwerte werden nicht als konstante Golden Values festgeschrieben. Der lokale Gate schreibt die aktuelle Messung nach `.xtend-test-results/xtend-material-catfooding-report.json`; CSS- und Qualitaetsbudgets bleiben Eigentum von XTM-11.

## Tune Evidence

Der initiale `xt maraca tune`-Run hat alle 12 Kombinationen akzeptiert und deterministisch `max / route / inline` ausgewaehlt. Die Auswahl liegt in `products/xtend-material-workbench/maraca.tuned.config.json` einschliesslich Source-, Candidate-Matrix- und Config-Fingerprint. Der XTM-12-Gate fuehrt `check` gegen alle 12 Kandidaten aus und blockiert Config Drift.

## Browser, A11y, Visual und Telemetry

- Der Browser Hypervisor rendert die Produktseite in Chromium bei `1440x1000` und `390x844` und schreibt zwei Screenshots unter `.xtend-test-results/xtend-material-workbench/`.
- Die Site verwendet `main`, `nav`, verbundene Labels, Dialog-Beschriftung und einen polite Live Status; die umfassende Matrix bleibt `xtend.material.browser-evidence.v1` aus XTM-10.
- Die HTML-Evidence-Projektion exponiert bewusst keine `window.__XTEND_DEV_API__`, da sie keine XTend-Runtime besitzt. `site/runtime.html` installiert nach echtem Maraca-Boot den vollstaendigen synchronen `xtend.devsurface.dev-api.v1`-Contract aus `src/workbench-dev-api.mjs`; Performance, Fabric, Kernel und Hydration lesen aktuelle serialisierbare Snapshots ohne Produkt-DOM oder Component-Interna zu manipulieren.
- Der Product Audit blockiert Prototype-/Registry-Patches, private Shadow Roots, unsichere HTML-Sinks und globale Runtime-Style-Injection.

## Lesson Registry

| Lesson | Klassifikation | Entscheidung | Owner | Ziel |
| --- | --- | --- | --- | --- |
| `XTM12-L01` | `design-kit-local` | Native Recipe-Fallback fuer MVP behalten | `@xtend-material/core` | `XTM-13/tree-shaking-guidance` |
| `XTM12-L02` | `app-local` | Evidence-Projektion bleibt Produktlogik | Workbench | `src/data/evidence.json` |
| `XTM12-L03` | `rejected` | kein spezielles KPI-Recipe einfuehren | `XTM-12` | - |

Es gibt aktuell keine `framework-native` Lesson und keine unentschiedene Lesson. Der Gate verlangt fuer jede kuenftige `framework-native` Lesson ein `XTM-*`-Zielticket.

## Evidence und lokaler Gate

- Produktvertrag: `products/xtend-material-workbench/package.json`
- Source-to-Sea: `src/app.rmt` -> Maraca -> lokaler Tailwind Provider
- Tune: `products/xtend-material-workbench/maraca.tuned.config.json`
- Lessons: `products/xtend-material-workbench/src/data/lessons.json`
- Browser-/Performance-Verweise: `products/xtend-material-workbench/src/data/evidence.json`
- maschinenlesbarer Run: `.xtend-test-results/xtend-material-catfooding-report.json`

```bash
node scripts/run_xtend_tests.js xtend-material-catfooding --json
```

Der Gate ist erfolgreich, wenn Build, Tune, beide Browser-Viewports, Lesson-Entscheidungen, Dev Surface, Anti-Monkeypatching und Trusted DOM gemeinsam gruen sind.
