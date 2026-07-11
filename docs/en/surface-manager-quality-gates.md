# SurfaceManager Quality Gates

Contract: `xtend.surface.quality-gates.v1`

SurfaceManager Quality Gates keep the mixed Surface Stack verifiable across four local quality domains.

## Domains

- Browser
- A11y
- Performance
- Visual

## Evidence

Browser smoke:

```text
tests/browser/fixtures/surface-manager-quality-smoke.html
```

Local gate:

```bash
node scripts/run_xtend_tests.js surface-manager-quality --json
```

## Quality Model

SurfaceManager Quality Gates group four domains because surface problems rarely live in one layer only. A browser failure can appear as an incorrect stack value. An accessibility failure can come from a lost focus target. A performance failure can be caused by too many snapshot updates. A visual failure can come from unstable layout slots in a window or side panel. The `xtend.surface.quality-gates.v1` contract keeps these domains together so release owners do not interpret isolated smokes out of context.

The gates remain local and deterministic. They do not need an external measurement platform or production telemetry. Instead they check fixtures, runtime records and documented thresholds. That matters for PR work: a developer should know before pushing whether a surface change touches browser, accessibility, performance or visual evidence.

## Domains

Browser checks whether manager, windows, panel and overlay bridge cooperate in a real DOM environment. Accessibility checks roles, focus flow, inert/aria-hidden behavior and keyboard operation. Performance checks that snapshot and layout work stay bounded and that no new update loop appears. Visual does not mean a perfect brand pixel baseline; it means stable visible state transitions such as active, minimized, closed, pinned, collapsed and overlay.

The fixture `tests/browser/fixtures/surface-manager-quality-smoke.html` is the shared proof. It should stay small, but it must include enough surfaces to expose collisions. When a new surface mode is added, the owner decides which domain is affected and which local evidence protects it. Not every mode needs a pixel-baseline process immediately, but every visible mode needs a traceable quality claim.

## Release Review

A green quality gate means the mixed surface app is still operable, measurable and reproducible. It does not mean every possible product composition is covered. Residuals such as real browser-lab artifacts or broad visual baselines are tracked separately in the release handoff. Changes that claim visible surface capabilities without touching one of the four domains are blocked.

Reviewers should watch for silent scope expansion. If a patch makes a new dragging, resizing, modality or stacking claim, it needs more than a code change. It needs a contract point, a fixture or a gate proof. This page describes where that proof is expected.

## Related reading

The release workflow shows how SurfaceManager reports are combined with the repository gates. [Related article](./release-verification.md)
