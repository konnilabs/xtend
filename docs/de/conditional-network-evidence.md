# Conditional Network Evidence

`xtend.epic13.conditional-network-evidence.v1` beschreibt, wie RC1 mit Netzwerk-Gates umgeht, ohne lokale Entwicklung zu blockieren.

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js epic13-conditional-network-evidence --json
```

oder:

```bash
npm run test:epic13-conditional-network-evidence
```

## Commands

| Command | Artefakt |
|---------|----------|
| `npm audit --audit-level=moderate` | `.xtend-test-results/xtend-npm-audit-report.json` |
| `npm sbom --sbom-format=cyclonedx --json` | `.xtend-test-results/xtend-npm-sbom.json` |

Der aggregierte Report liegt unter `.xtend-test-results/xtend-conditional-network-evidence-report.json`.

## Lokales Verhalten

Der lokale Gate fuehrt die Netzwerkbefehle nicht automatisch aus. Stattdessen prueft er, dass XTend fuer Offline-, Sandbox- und CI-Umgebungen ein stabiles Evidence-/Deferral-Format besitzt.

Ab `DPF-WP-03` produktisiert [Conditional Network Evidence CI](./conditional-network-evidence-ci.md) den CI-Job und den Capture-Befehl `npm run conditional-network:evidence` unter `xtend.epic13.conditional-network-evidence-ci.v1`. Der Job kann die Audit-/SBOM-Kommandos ausfuehren oder Owner-Deferrals in denselben Artefaktpfaden ablegen.

Default-Reason fuer lokale Deferrals:

```text
network-restricted-local-default
```

Weitere erlaubte Gruende:

- `sandbox-network-unavailable`
- `registry-auth-unavailable`
- `owner-approved-offline-run`

## Publish Boundary

`private-until-release-owner-acceptance` bleibt aktiv. Deferred Network Evidence ist ein Review-Signal, aber keine Publish-Freigabe.

`WP-E13-04` ist abgeschlossen. Der Package Export Lock beschreibt unter [Package Export Lock](./package-export-lock.md), wie `npm run pack:dry-run` und die Export Surface fuer RC1 gesperrt werden. `WP-E13-05` ist abgeschlossen; `WP-E13-06` hat die [Hydration Performance Closure](./hydration-performance-closure.md) abgeschlossen. `WP-E13-07` hat die [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md) vorbereitet. `WP-E13-08` hat [Visual Owner Artifacts](./visual-owner-artifacts.md) normalisiert. `WP-E13-09` ist nun startbar.

Weiterfuehrend: [Release Owner Acceptance](./release-owner-acceptance.md).
