# XTend RMT Owned Surface Browser Lab Visual Evidence Matrix

- Status: `accepted`
- Datum: 4. Juni 2026
- Contract: `xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence.v1`
- Matrix Schema: `xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence-matrix.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence-fixtures.v1`
- Browser Fixture Schema: `xtend.rmt-ui-maximality-owned-surface-browser-lab.fixture.v1`
- Visual Baseline Schema: `xtend.rmt-ui-maximality-owned-surface-browser-lab.visual-baseline.v1`
- Performance Report Schema: `xtend.rmt-ui-maximality-owned-surface-browser-lab.performance-report.v1`
- Report Schema: `xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence-report.v1`
- Workpackage: `WP-RMO-06`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-surface-browser-lab --json`

## Bewertungsrahmen

| Feld | Werte |
|------|-------|
| `status` | `browser-lab-fixture-accepted`, `visual-dom-baseline-accepted`, `performance-budget-accepted`, `conditional-pixel-artifact`, `negative-claim-blocked` |
| `evidenceClass` | `browser-fixture`, `visual-baseline`, `performance-budget`, `conditional-artifact`, `claim-boundary` |
| `claimBoundary` | `allowed-with-browser-lab-fixture`, `allowed-with-artifact-reference`, `allowed-with-budget-evidence`, `conditional-browser-artifact`, `blocked-negative-claim` |

## Evidence Matrix

| ID | Evidence Class | Status | Source Recipes | Artefakte | Browser Primitives | Budget / Assertion | Claim Boundary | Next Handoff |
|----|----------------|--------|----------------|-----------|--------------------|--------------------|----------------|--------------|
| `RMO-BL-01` | `browser-fixture` | `browser-lab-fixture-accepted` | `RMO-RCR-10`, `RMO-RCR-11`, `RMO-RCR-12` | `tests/browser/fixtures/rmt-owned-surface-browser-lab.html` | `requestAnimationFrame`, `DocumentFragment`, `replaceChildren` | offline smoke, no CDN, no second registry | `allowed-with-browser-lab-fixture` | `WP-RMO-07` |
| `RMO-BL-02` | `visual-baseline` | `visual-dom-baseline-accepted` | `RMO-RCR-10`, `RMO-RCR-11` | `tests/browser/visual-baselines/rmt-owned-surface-browser-lab.dom-baseline.json` | DOM snapshot, CSS custom properties, stable data attributes | `snapshotCount: 5`, binary baselines false | `allowed-with-artifact-reference` | `WP-RMO-07` |
| `RMO-BL-03` | `performance-budget` | `performance-budget-accepted` | `RMO-RCR-10`, `RMO-RCR-11`, `RMO-RCR-12` | `tests/fixtures/native-first/rmt-owned-surface-browser-lab-fixtures.json` | `PerformanceObserver`, `MutationObserver`, `requestAnimationFrame` | open `16ms`, query `50ms`, route `120ms`, CLS `0.01`, mutation count `20` | `allowed-with-budget-evidence` | `WP-RMO-07` |
| `RMO-BL-04` | `conditional-artifact` | `conditional-pixel-artifact` | `RMO-RCR-10`, `RMO-RCR-11` | `.xtend-test-results/visual-snapshots/rmo/{flow}/{viewport}.png` | browser-driver or CI artifact | local gate does not require screenshot file | `conditional-browser-artifact` | `WP-RMO-09` |
| `RMO-BL-05` | `claim-boundary` | `negative-claim-blocked` | `RMO-RCR-14` | diagnostics in fixture pack | no free HTML sink, no unregistered command | `visual-claim-without-artifact`, `pixel-baseline-claim-without-artifact`, `real-browser-visual-claim-without-artifact` blocked | `blocked-negative-claim` | `WP-RMO-07` |

## Status Summary

| Status | Anzahl |
|--------|--------|
| `browser-lab-fixture-accepted` | 1 |
| `visual-dom-baseline-accepted` | 1 |
| `performance-budget-accepted` | 1 |
| `conditional-pixel-artifact` | 1 |
| `negative-claim-blocked` | 1 |

## Flow Coverage

| Flow | Source Recipe | Browser State | Visual Snapshot | Budget |
|------|---------------|---------------|-----------------|--------|
| `dashboard-collection` | `RMO-RCR-10` | `collection-ready`, `collection-empty`, `selection-change` | `rmo-dashboard-collection-ready`, `rmo-dashboard-empty-state` | render `16ms`, mutation count `20`, CLS `0.01` |
| `command-search-workspace` | `RMO-RCR-11` | `command-open`, `search-results`, `command-result` | `rmo-command-open`, `rmo-command-results` | open `16ms`, query `50ms`, focus `16ms` |
| `crud-navigation-async` | `RMO-RCR-12` | `route-enter`, `resource-query`, `route-feedback` | `rmo-crud-route-feedback` | route `120ms`, resource query `50ms` |
| `negative-security-policy` | `RMO-RCR-14` | `manual-dom-rejected`, `unregistered-command-rejected` | none | diagnostic-only |

## Conditional Pixel Policy

Pixel- und Screenshot-Artefakte sind normalisiert, aber im lokalen Gate nicht verpflichtend:

- Pfadtemplate: `.xtend-test-results/visual-snapshots/rmo/{flow}/{viewport}.png`
- `screenshotRequiredInLocalGate`: `false`
- `pixelDiffRequiredInLocalGate`: `false`
- `binaryBaselineCommitted`: `false`
- Owner: `browser-lab-owner`

## Handoff

`WP-RMO-07` kann diese Matrix fuer Contract Registry, Runtime Parity, Audit Evidence und Budget Gates auswerten. `WP-RMO-09` kann die conditional Pixel-Artefakte in den Release-Handoff aufnehmen.
