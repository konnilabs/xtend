# Conditional Network Evidence CI

Contract: `xtend.epic13.conditional-network-evidence-ci.v1`

Status: `accepted-conditional-network-evidence-ci`

Workpackage: `DPF-WP-03-conditional-network-evidence-ci`

## Ziel

Dieses Paket produktisiert Audit- und SBOM-Evidence fuer CI und Release Owner. Der lokale Gate bleibt netzwerkfrei; der CI-Job kann `npm audit --audit-level=moderate` und `npm sbom --sbom-format=cyclonedx --json` ausfuehren oder bei nicht verfuegbarem Netzwerk ein Owner-Deferral im Format `xtend.epic13.conditional-network-deferral.v1` schreiben.

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js epic13-conditional-network-evidence-ci --json
npm run test:epic13-conditional-network-evidence-ci
```

## Capture

```bash
npm run conditional-network:evidence
```

Ohne `XTEND_CONDITIONAL_NETWORK_EXECUTE=1` schreibt der Capture lokale Deferral-Artefakte. In CI setzt `.github/workflows/xtend-default-gates.yml` `XTEND_CONDITIONAL_NETWORK_EXECUTE=1`, installiert Workspace-Links per `npm ci --ignore-scripts --no-audit --fund=false`, nutzt `XTEND_CONDITIONAL_NETWORK_USE_NPX_NPM10=1` fuer stabile SBOM-Ausgabe und laedt die Artefakte hoch:

- `.xtend-test-results/xtend-npm-audit-report.json`
- `.xtend-test-results/xtend-npm-sbom.json`
- `.xtend-test-results/xtend-conditional-network-evidence-report.json`

## Grenzen

Nicht enthalten sind Dependency-Upgrades, Vulnerability-Fixes und Public Publish. Publish bleibt durch `private-until-release-owner-acceptance` blockiert, bis Audit/SBOM ausgefuehrt oder durch den Owner akzeptiert deferred sind.

Der separate GitHub-Actions-Job `npm-publish-next` erlaubt keine Deferrals: Er setzt `XTEND_CONDITIONAL_NETWORK_ALLOW_DEFERRAL=0`, wiederholt `release:report`, Pack- und Audit/SBOM-Evidence und fuehrt danach `npm publish --tag next --provenance --access public` aus.

Der naechste Schritt ist `DPF-WP-04-visual-pixel-evidence-storage`.
