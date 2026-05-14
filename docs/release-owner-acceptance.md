# Release Owner Acceptance

`xtend.epic13.release-owner-acceptance.v1` beschreibt den ersten RC1-Owner-Schnitt nach dem RC1 Readiness Model.

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js epic13-release-owner-acceptance --json
```

oder:

```bash
npm run test:epic13-release-owner-acceptance
```

## Was der Contract festlegt

- Release Owner Acceptance ist ein Review-Contract, keine Publish-Freigabe.
- `private-until-release-owner-acceptance` bleibt aktiv.
- `publishAllowed` bleibt `false`.
- `automaticPublishApproval` bleibt `false`.
- Owner-Entscheidungen nutzen `accepted`, `deferred` und `blocked`.

## Checklist-Modell

| Status | Verwendung |
|--------|------------|
| `accepted` | Baseline ist als Review-Grundlage angenommen |
| `deferred` | Offene Evidenz ist sichtbar und besitzt ein Zielpaket |
| `blocked` | Entscheidung darf nicht automatisch erfolgen |

Der bewusst blockierte Eintrag ist `automatic-publish-approval`. Damit bleibt ein gruener Testlauf ein Review-Signal, aber kein Publish-Signal.

## Aktueller Handoff

`WP-E13-03` hat die Conditional Network Gate Evidence unter [Conditional Network Evidence](./conditional-network-evidence.md) mit `xtend.epic13.conditional-network-evidence.v1` vorbereitet:

- `npm audit --audit-level=moderate`
- `npm sbom --json`

Wenn diese Gates lokal wegen Sandbox, Netzwerk oder Policy nicht laufen koennen, entsteht eine strukturierte Owner-Deferral.

`WP-E13-04` hat den [Package Export Lock](./package-export-lock.md) mit `xtend.epic13.package-export-lock.v1` abgeschlossen. `WP-E13-05` hat die [Known Residual Triage](./known-residual-triage.md) mit `xtend.epic13.known-residual-triage.v1` abgeschlossen. `WP-E13-06` hat die [Hydration Performance Closure](./hydration-performance-closure.md) mit `xtend.epic13.hydration-performance-closure.v1` abgeschlossen. `WP-E13-07` hat die [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md) mit `xtend.epic13.prod-browser-csp-smoke.v1` abgeschlossen. `WP-E13-08` hat [Visual Owner Artifacts](./visual-owner-artifacts.md) mit `xtend.epic13.visual-owner-artifact.v1` normalisiert.

Der Checklist-Eintrag `known-residual-renewal` ist damit `accepted`: `xstate` und `x-utils` sind Boundary-Contracts, `xtend.component.hydrate` ist owner-frei geschlossen. Der Checklist-Eintrag `visual-owner-artifact` ist `accepted`; `rmt-production-readiness` ist seit `WP-E13-09` und `xtend.epic13.rmt-production-readiness.v1` ebenfalls `accepted`. `docs-rmt-production-hardening` ist seit `WP-E13-10` und `xtend.epic13.docs-rmt-production-hardening.v1` accepted. `prod-browser-csp-smoke` und `trusted-dom-boundary` sind seit `WP-E13-11` accepted; die Trusted-DOM-Evidence liegt unter [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md) und `xtend.epic13.trusted-dom-boundary.v1`. `rc1-migration-notes` ist seit `WP-E13-12` accepted; die Evidence liegt unter [RC1 Migration Notes](./rc1-migration-notes.md) und `xtend.epic13.rc1-migration-notes-semver.v1`. `rc1-gate-matrix-ci-handoff` ist seit `WP-E13-13` accepted; die Evidence liegt unter [RC1 Gate Matrix und CI-Handoff](./rc1-gate-matrix-ci-handoff.md) und `xtend.epic13.rc1-gate-matrix-ci-handoff.v1`. Der naechste Handoff geht nach `WP-E13-14`.

Weiterfuehrend: [RC1 Readiness](./rc1-readiness.md).
