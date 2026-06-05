# NFM-WP-08 - Owned Form-, List-, Navigation- und Media-Primitives haerten

- Status: `completed`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Contract: `xtend.native-first.form-navigation-media-hardening.v1`
- Matrix: `xtend.native-first.form-navigation-media-hardening-matrix.v1`
- Report Contract: `xtend.native-first.form-navigation-media-hardening-report.v1`
- Capability Packages: `NFM-OP-02`, `NFM-OP-04`
- Capability Scope: `NFM-CAP-04`, `NFM-CAP-08`, `NFM-CAP-09`, `NFM-CAP-10`, `NFM-CAP-16`, `NFM-CAP-17`
- Local Gate: `node scripts/run_xtend_tests.js native-first-form-navigation-media --json`

## Ziel

WP-08 macht haeufige App-UIs ohne externe UI-Framework-Abhaengigkeit produktiv authorbar: Forms, Inputs, Validation, Routing, Links, Tabs, Menu, list-like Display, Cards, Player und Media-Shells. Gleichzeitig markiert das Paket die echten Luecken fuer Data Display, Table/Tree/VirtualList, Command Palette, Autocomplete und rich Combobox.

## Umgesetzte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `development/XTend-Native-First-Form-Navigation-Media-Hardening-Contract.md` | Contract fuer Form-/Navigation-/Media-Hardening |
| `development/XTend-Native-First-Form-Navigation-Media-Hardening-Matrix.md` | Matrix fuer Forms, Navigation, list-like Display, Media und Missing Claims |
| `tests/native-first/native_first_form_navigation_media_suite.js` | lokaler WP-08 Gate |
| `scripts/run_xtend_tests.js` | registriert `native-first-form-navigation-media` |
| `package.json` | exposes `test:native-first-form-navigation-media` und Native-First Metadata |

## Native-First Entscheidungen

| Primitive | Entscheidung | Begruendung |
|-----------|--------------|-------------|
| `ElementInternals` und form-associated Custom Elements | `wrap-as-xtend-primitive` | owned Form Controls bleiben fuehrend; Browser-Lab ADR vor produktiver Adoption |
| Constraint Validation und FormData APIs | `wrap-as-xtend-primitive` | `x-form` Aggregation und Events sind gatebar; native Interop bleibt ADR-pflichtig |
| History, URLPattern und Navigation API | `defer-with-watch` | `x-router`/`x-link` bleiben owned, WP14 prueft RMT Route-Ausdruckskraft |
| CSS Container Queries und Observer | `adopt-candidate` / `wrap-as-xtend-primitive` | Layout measurement und list-like Display bleiben XTend-gesteuert |
| Media Session und Picture-in-Picture | `defer-with-watch` | `x-player`/`x-lightbox` bleiben owned, native Media-Adoption braucht Evidence |

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Form-/Navigation-/Media-Contract existiert | `done` |
| Hardening-Matrix benennt owned Primitive-Gruppen | `done` |
| `NFM-CAP-04`, `NFM-CAP-08`, `NFM-CAP-09`, `NFM-CAP-10`, `NFM-CAP-16`, `NFM-CAP-17` sind angebunden | `done` |
| Missing Data/List und Command/Autocomplete Claims bleiben blockiert | `done` |
| Existing Form-, Navigation- und Layout/Media-Gates sind Handoff-Evidence | `done` |
| RMT-Kernel-Boundary bleibt host-neutral | `done` |
| Lokaler WP-08 Gate ist registriert | `done` |

## Verifikation

Ausgefuehrte lokale Gates:

```bash
node scripts/run_xtend_tests.js native-first-form-navigation-media --json
node scripts/run_xtend_tests.js form-controls-ux --json
node scripts/run_xtend_tests.js navigation-routing-ux --json
node scripts/run_xtend_tests.js layout-display-media-ux --json
node scripts/run_xtend_tests.js catalog-coverage --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js supply-chain --json
```

Ergebnis am 3. Juni 2026:

- `native-first-form-navigation-media`: `passed` mit 194 Checks, 0 Failures, 0 Warnings
- `form-controls-ux`: `passed` mit 352 Checks, 0 Failures, 0 Warnings
- `navigation-routing-ux`: `passed` mit 202 Checks, 0 Failures, 0 Warnings
- `layout-display-media-ux`: `passed` mit 491 Checks, 0 Failures, 0 Warnings
- `catalog-coverage`: `passed` mit 226 Checks, 0 Failures, 0 Suite-Warnings
- `references`: `passed` mit 2127 Referenzpfad-Checks, 0 Failures, 0 Warnings
- `supply-chain`: `passed` mit 67 Checks, 0 Failures, 0 Warnings

## Handoff

- `NFM-WP-09` hat Theme, State, Events, Slots und Scheduler als Framework-Hebel geschnitten.
- `NFM-WP-10` hat Data Display, Table/Tree/List, VirtualList sowie Command/Search als blockierte Market-Pattern-Claims priorisiert.
- `NFM-WP-14` muss RMT Maximality fuer App Forms, Routing, list-like Display und Media quantifizieren.
- `NFM-WP-18` kann native Form-/Navigation-/Media-Renderer-Proofs gegen die WP-08 Boundary priorisieren.
