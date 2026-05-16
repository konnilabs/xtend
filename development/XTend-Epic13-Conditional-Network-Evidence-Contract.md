# XTEnd Epic 13 Conditional Network Evidence Contract

- Contract: `xtend.epic13.conditional-network-evidence.v1`
- Report: `xtend.epic13.conditional-network-evidence-report.v1`
- Deferral: `xtend.epic13.conditional-network-deferral.v1`
- Workpackage: `WP-E13-03`
- Status: `accepted-conditional-network-evidence-contract`
- Source: `xtend.epic13.release-owner-acceptance.v1`
- Gate: `node scripts/run_xtend_tests.js epic13-conditional-network-evidence --json`
- Publish Boundary: `private-until-release-owner-acceptance`

## Zweck

WP-E13-03 bereitet die Conditional Network Gates fuer RC1 vor, ohne lokale Default-Gates netzwerkpflichtig zu machen. Der Contract trennt deshalb zwei Zustaende:

- `executed`: der Netzwerkbefehl wurde ausgefuehrt und ein Artefakt liegt vor
- `deferred`: der lokale Lauf ist offline, sandboxed oder ohne Registry-Zugriff und erzeugt eine Owner-Deferral

Beide Zustaende sind maschinenlesbar. Publish bleibt blockiert, bis die Befehle ausgefuehrt oder die Deferrals explizit owner-akzeptiert sind.

## Commands

| ID | Command | JSON/Evidence Command | Artefakt |
|----|---------|------------------------|----------|
| `npm-audit-moderate` | `npm audit --audit-level=moderate` | `npm audit --audit-level=moderate --json` | `.xtend-test-results/xtend-npm-audit-report.json` |
| `npm-sbom-json` | `npm sbom --sbom-format=cyclonedx --json` | `npm sbom --sbom-format=cyclonedx --json` | `.xtend-test-results/xtend-npm-sbom.json` |

Das aggregierte RC1-Report-Artefakt ist `.xtend-test-results/xtend-conditional-network-evidence-report.json`.

## Deferral-Format

Jeder Deferral Record traegt:

- Schema `xtend.epic13.conditional-network-deferral.v1`
- `id`
- `command`
- `jsonCommand`
- `expectedArtifact`
- `status`
- `reason`
- `ownerDecisionRequired`
- `localGateBlocking: false`
- `publishBlocking: true`
- `requiredBefore: release-owner-publish-acceptance`

Zulaessige Deferral-Reasons:

- `network-restricted-local-default`
- `sandbox-network-unavailable`
- `registry-auth-unavailable`
- `owner-approved-offline-run`

## Lokale Regel

Der lokale Gate `epic13-conditional-network-evidence` fuehrt keine Netzwerkbefehle aus. Er prueft, dass die Commands, Artefaktpfade, Deferral-Reasons, Package-Metadaten, Docs und Handoff-Regeln stabil sind.

## Publish-Regel

`publishAllowed` bleibt `false`. Ein Deferred Network Gate blockiert Publish, bis der Release Owner die Deferral akzeptiert oder die echten Netzwerk-Artefakte vorliegen.

## Handoff

`WP-E13-04` ist abgeschlossen und dokumentiert unter [Package Export Lock](../docs/package-export-lock.md), wie `npm run pack:dry-run` und die Package-Export-Oberflaeche als maschinenlesbares RC1-Artefakt gesperrt werden. `WP-E13-05`, `WP-E13-06`, `WP-E13-07` und `WP-E13-08` sind abgeschlossen; `WP-E13-09` ist startbar.
