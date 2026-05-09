# WP-E13-01 - RC1 Readiness Model und Gate-Abgleich einfrieren

- Status: `completed`
- Datum: 8. Mai 2026
- Epic: `EPIC-13-RC0-zu-RC1-Production-Readiness-und-Release-Owner-Acceptance`
- Contract: `xtend.epic13.wp01.rc1-readiness-model.v1`
- Readiness Contract: `xtend.epic13.rc1-production-readiness.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-rc1-readiness --json`
- Zielzustand: `rc1-production-candidate-ready`

## Ziel

`WP-E13-01` macht Epic 13 operativ startbar. Das Paket nimmt den RC0-Handoff aus Epic 12, gleicht ihn gegen die vorhandenen Gates ab und friert die Gate-Luecken fuer RC1 ein.

Es startet noch keinen Publish-Prozess und oeffnet keine Publish Boundary.

## Umgesetzt

- `development/RC0-RC1-transfer-EPIC13.md` als bereinigtes Steering-Dokument aktualisiert
- `development/XTend-Epic13-RC1-Readiness-Modell.md` als akzeptierter Readiness Contract angelegt
- `catalog/epic13-rc1-readiness.js` als maschinenlesbares RC1 Readiness Model angelegt
- `tests/platform/epic13_rc1_readiness_suite.js` als lokaler Gate angelegt
- `docs/rc1-readiness.md` in die offizielle Docs-App aufgenommen
- `package.json`, `xtend-builder/scaffold.config.js`, Runner, Docs und Referenzregister verankert

## Gate-Abgleich

`WP-E13-01` bestaetigt, dass die folgenden RC0-Baselines gruen und fuer RC1 nutzbar sind:

- `epic12-rc0-handoff`
- `rc0-gate-matrix`
- `references`

Die folgenden Luecken sind fuer RC1 geschnitten:

- Release Owner Acceptance
- Conditional Network Gate Evidence
- Package Dry Run Export Surface Lock
- Known Residuals und Hydration-Warnung
- PROD-nahe Browser-/CSP-Smokes
- Visual Screenshot/Pixels als Owner-Artefakt
- RMT-first App Production Readiness
- Docs-App RMT Shell und Trusted DOM
- RC1 Migration Notes und SemVer
- RC1 Gate Matrix und finaler Handoff

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| RC1-Zielbild ist eindeutig | erfuellt: `rc1-production-candidate-ready` |
| Gate-Luecken sind Workpackages zugeordnet | erfuellt: `WP-E13-02` bis `WP-E13-14` |
| Feature Drift ist abgegrenzt | erfuellt |
| RMT-Kernel-Neutralitaet bleibt erhalten | erfuellt |
| Publish Boundary bleibt geschlossen | erfuellt: `private-until-release-owner-acceptance` |
| lokaler Gate liegt vor | erfuellt: `epic13-rc1-readiness` |
| `WP-E13-02` ist startbar | erfuellt |

## Verifikation

```bash
node --check catalog/epic13-rc1-readiness.js
node --check tests/platform/epic13_rc1_readiness_suite.js
node scripts/run_xtend_tests.js epic13-rc1-readiness --json
node scripts/run_xtend_tests.js epic12-rc0-handoff rc0-gate-matrix references --json
```

## Handoff

`WP-E13-01` ist abgeschlossen. `WP-E13-02` kann den Release Owner Acceptance Contract definieren und damit die informelle RC0-Owner-Review-Entscheidung in eine echte RC1-Entscheidungsflaeche ueberfuehren.
