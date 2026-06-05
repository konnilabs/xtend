# NFM-WP-07 - Owned Overlay-, Dialog-, Popover- und Focus-Primitives haerten

- Status: `completed`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Contract: `xtend.native-first.overlay-focus-hardening.v1`
- Matrix: `xtend.native-first.overlay-focus-hardening-matrix.v1`
- Report Contract: `xtend.native-first.overlay-focus-hardening-report.v1`
- Capability Package: `NFM-OP-01`
- Capability Scope: `NFM-CAP-06`, `NFM-CAP-07`, `NFM-CAP-18`
- Local Gate: `node scripts/run_xtend_tests.js native-first-overlay-focus --json`

## Ziel

WP-07 festigt die interaktiven Overlay-, Shell- und Focus-Faehigkeiten als XTend-eigene Framework-Staerke. Der owned XTend-Pfad bleibt fuehrend, waehrend browser-native Dialog-, Popover-, Anchor- und Inert-Entscheidungen nur mit Radar- und Adoption-Gate-Evidence in den Produktpfad wandern.

## Umgesetzte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `development/XTend-Native-First-Overlay-Focus-Hardening-Contract.md` | Contract fuer owned Overlay-/Focus-Hardening |
| `development/XTend-Native-First-Overlay-Focus-Hardening-Matrix.md` | Matrix fuer Modal, Dialog, Popover, Drawer, Side Panel, Surface Portal, Focus, Inert, Keyboard und RMT |
| `tests/native-first/native_first_overlay_focus_suite.js` | lokaler WP-07 Gate |
| `scripts/run_xtend_tests.js` | registriert `native-first-overlay-focus` |
| `package.json` | exposes `test:native-first-overlay-focus` und Native-First Metadata |

## Native-First Entscheidungen

| Primitive | Entscheidung | Begruendung |
|-----------|--------------|-------------|
| `inert` und Focus-Isolation | `wrap-as-xtend-primitive` | XTend braucht Stack-, Focus-Restore-, Fallback- und Diagnostics-Policy |
| `HTMLDialogElement` | `defer-with-watch` | owned `x-dialog`/`x-modal` bleibt konsistenter mit Surface Stack, RMT und A11y Gates |
| Popover API | `defer-with-watch` | `x-popover`/`x-tooltip` bleiben owned, bis A11y-, Anchor- und Fallback-Evidence vorliegt |
| CSS Anchor Positioning | `defer-with-watch` | Overlay Positioning bleibt owned, bis Layout- und Browser-Lab-Evidence belastbar ist |
| `focus-visible`, forced-colors, reduced-motion | `adopt-native` | bestehende Component CSS nutzt browsernahe A11y-Primitives unter Gates |

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Overlay-/Focus-Contract existiert | `done` |
| Hardening-Matrix benennt owned Primitive-Gruppen | `done` |
| `NFM-CAP-06`, `NFM-CAP-07`, `NFM-CAP-18` sind angebunden | `done` |
| Native Dialog/Popover/Anchor werden nicht ungeprueft adoptiert | `done` |
| Existing Overlay-, Surface- und A11y-Gates sind Handoff-Evidence | `done` |
| RMT-Kernel-Boundary bleibt host-neutral | `done` |
| Lokaler WP-07 Gate ist registriert | `done` |

## Verifikation

Ausgefuehrte lokale Gates:

```bash
node scripts/run_xtend_tests.js native-first-overlay-focus --json
node scripts/run_xtend_tests.js overlay-interaction-ux --json
node scripts/run_xtend_tests.js surface-overlay-bridge --json
node scripts/run_xtend_tests.js surface-stack-policy --json
node scripts/run_xtend_tests.js surface-manager-quality --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js supply-chain --json
node scripts/run_xtend_tests.js docs-public-quality --json
node scripts/run_xtend_tests.js catalog-coverage --json
```

Ergebnis am 3. Juni 2026:

- `native-first-overlay-focus`: `passed` mit 120 Checks, 0 Failures, 0 Warnings
- `overlay-interaction-ux`: `passed` mit 319 Checks, 0 Failures, 0 Warnings
- `surface-overlay-bridge`: `passed` mit 261 Checks, 0 Failures, 0 Warnings
- `surface-stack-policy`: `passed` mit 144 Checks, 0 Failures, 0 Warnings
- `surface-manager-quality`: `passed` mit 250 Checks, 0 Failures, 0 Warnings
- `references`: `passed` mit 2127 Referenzpfad-Checks, 0 Failures, 0 Warnings
- `supply-chain`: `passed` mit 67 Checks, 0 Failures, 0 Warnings
- `docs-public-quality`: `passed` mit 1 Suite-Check, 0 Failures, 0 Warnings
- `catalog-coverage`: `passed` mit 226 Checks, 0 Failures, 0 Suite-Warnings

## Handoff

- `NFM-WP-08` hat Form-, List-, Navigation- und Media-Primitives weiter gehaertet.
- `NFM-WP-09` hat Overlay/Focus sowie Form/Navigation/Media als gehaertete Eingaben fuer den Framework-Hebel-Layer genutzt.
- `NFM-WP-14` muss RMT Maximality fuer Surface-, Overlay- und Shell-Authoring quantifizieren.
- `NFM-WP-18` kann native DOM-/Trusted-DOM-Proofs gegen die WP-07 Boundary priorisieren.
