# XTend Epic 13 Release Owner Acceptance Contract

- Contract: `xtend.epic13.release-owner-acceptance.v1`
- Report: `xtend.epic13.release-owner-acceptance-report.v1`
- Workpackage: `WP-E13-02`
- Status: `accepted-release-owner-acceptance-contract`
- Source: `xtend.epic13.rc1-production-readiness.v1`
- Gate: `node scripts/run_xtend_tests.js epic13-release-owner-acceptance --json`
- Publish Boundary: `private-until-release-owner-acceptance`

## Zweck

Dieser Contract formalisiert den ersten Release-Owner-Schnitt in Epic 13. Er oeffnet keinen Publish-Pfad. Er beschreibt, welche RC1-Baselines akzeptiert sind, welche Luecken bewusst deferred werden und welche Entscheidung blockiert bleibt.

Die zentrale Regel lautet: Gruene lokale Gates duerfen `private: true` nicht automatisch aufheben. `automatic-publish-approval` ist im Owner-Review explizit `blocked`.

## Owner Decision States

| Status | Bedeutung |
|--------|-----------|
| `accepted` | Baseline oder Artefakt ist als Review-Grundlage akzeptiert |
| `deferred` | Risiko ist sichtbar, besitzt aber ein Zielpaket und blockiert den aktuellen Contract nicht |
| `blocked` | Entscheidung darf nicht automatisch oder ohne Owner-Freigabe erfolgen |

## Owner Inputs

Pflichtinputs fuer die Acceptance-Flaeche:

- `xtend-release-gate-report`
- `xtend-release-report`
- `xtend-rc0-gate-matrix-report`
- `xtend-epic12-rc0-handoff-report`
- `xtend-epic13-rc1-readiness-report`
- `package-dry-run-output`
- `conditional-network-gate-status`
- `known-residual-policy`
- `migration-notes`
- `publish-boundary-decision`

## Checklist

| ID | Status | Zielpaket |
|----|--------|-----------|
| `rc1-readiness-model` | `accepted` | - |
| `rc0-owner-handoff` | `accepted` | - |
| `release-report-required` | `accepted` | - |
| `package-private-boundary` | `accepted` | - |
| `rmt-kernel-neutrality` | `accepted` | - |
| `conditional-network-evidence` | `accepted` | `xtend.epic13.conditional-network-evidence.v1` |
| `package-dry-run-export-lock` | `accepted` | `xtend.epic13.package-export-lock.v1` |
| `known-residual-renewal` | `accepted` | `xtend.epic13.known-residual-triage.v1`, `xtend.epic13.hydration-performance-closure.v1` |
| `prod-browser-csp-smoke` | `accepted` | `xtend.epic13.prod-browser-csp-smoke.v1`, `xtend.epic13.trusted-dom-boundary.v1` |
| `visual-owner-artifact` | `accepted` | `xtend.epic13.visual-owner-artifact.v1` |
| `rmt-production-readiness` | `accepted` | `xtend.epic13.rmt-production-readiness.v1`, `xtend.epic13.docs-rmt-production-hardening.v1` |
| `trusted-dom-boundary` | `accepted` | `xtend.epic13.trusted-dom-boundary.v1` |
| `rc1-migration-notes` | `accepted` | `xtend.epic13.rc1-migration-notes-semver.v1` |
| `rc1-gate-matrix` | `deferred` | `WP-E13-13` |
| `automatic-publish-approval` | `blocked` | `WP-E13-14` |

## Deferral-Regel

Ein `deferred` Eintrag ist nur zulaessig, wenn er ein Zielpaket benennt. Ein Deferred Item darf nicht als Publish-Freigabe interpretiert werden. Es macht den aktuellen Contract reviewbar, verschiebt aber die produktionsnahe Evidenz in das benannte Folgepaket.

## Publish Boundary

`publishAllowed` bleibt `false`, `automaticPublishApproval` bleibt `false`, und `packagePrivateRequired` bleibt `true`.

Die Publish Boundary ist erst mit einem spaeteren Release-Owner-Handoff entscheidbar. WP-E13-02 macht dafuer die Entscheidungsstruktur sichtbar, trifft aber keine Freigabe.

## Handoff

`WP-E13-03` bis `WP-E13-12` sind abgeschlossen. `WP-E13-09` dokumentiert RMT Production Readiness unter `xtend.epic13.rmt-production-readiness.v1`; der PROD-nahe Smoke ist unter `xtend.epic13.prod-browser-csp-smoke.v1` dokumentiert, Docs RMT Production Hardening unter `xtend.epic13.docs-rmt-production-hardening.v1`, Trusted DOM Boundary unter `xtend.epic13.trusted-dom-boundary.v1` und RC1 Migration Notes unter `xtend.epic13.rc1-migration-notes-semver.v1`. Das naechste Paket ist `WP-E13-13` und buendelt RC1 Gate Matrix und CI-Handoff.
