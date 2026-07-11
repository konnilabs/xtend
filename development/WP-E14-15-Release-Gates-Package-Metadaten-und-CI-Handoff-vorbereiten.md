# WP-E14-15 - Release-Gates, Package-Metadaten und CI-Handoff vorbereiten

- Status: `completed`
- Datum: 8. Mai 2026
- Contract: `xtend.epic14.rmt-tooling.v1`
- Report Contract: `xtend.epic14.rmt-tooling-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic14-rmt-tooling --json`
- Package Script: `npm run test:epic14-rmt-tooling`
- Zielzustand: `rmt-authoring-tooling-release-gate-ready`

## Ziel

`WP-E14-15` buendelt das Epic-14-Tooling zu einer releasefaehigen Gate-Surface. Der RMT-Linter, der RMT Language Server, die Regression Matrix und die Tooling-Doku koennen nun einzeln oder zusammen als lokaler PR-/Release-Gate ausgefuehrt werden.

## Umgesetzt

- `catalog/epic14-rmt-tooling.js` als maschinenlesbare Gate-Source-of-Truth angelegt
- `tests/platform/epic14_rmt_tooling_release_gates_suite.js` als Self-Gate fuer Scripts, Exports, Scaffold Config, Referenzregistry und CI-Handoff angelegt
- `package.json` um `test:rmt-linter`, `test:rmt-tooling`, `test:rmt-tooling:report`, `test:pr:rmt`, `test:pr:rmt:report` und `test:epic14-rmt-tooling` erweitert
- `package.json` um `xtend.epic14RmtTooling` und `./catalog/epic14-rmt-tooling` Export erweitert
- `xtend.releaseGates` um `npm run test:rmt-tooling` erweitert
- `xtend-builder/scaffold.config.js` um `epic14RmtTooling` erweitert
- `scripts/run_xtend_tests.js` um die Suite `epic14-rmt-tooling` erweitert
- `docs/en/rmt-tooling-release-gates.md`, `docs/en/README.md` und `docs/menu.json` aktualisiert
- `development/XTendRMT-DSL-Tooling-Architektur.md` und dieses Epic auf den neuen Gate-Stand aktualisiert

## Gate-Schnitt

```bash
npm run test:rmt-linter
npm run test:rmt-language-server
npm run test:pr:rmt
npm run test:pr:rmt:report
npm run test:rmt-tooling
npm run test:rmt-tooling:report
node scripts/run_xtend_tests.js epic14-rmt-tooling --json
```

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| PR-Gate kann RMT-Linter optional aufnehmen | erfuellt |
| Release-Gate kann RMT Tooling pruefen | erfuellt |
| Package Export Surface fuer RMT Tooling ist sichtbar | erfuellt |
| Scaffold Config kennt den Gate | erfuellt |
| Reference Registry kennt Contract, Docs, Suite und Modul | erfuellt |
| Lokale Tests laufen ohne Netzwerk | erfuellt |

## Handoff

`WP-E14-15` ist abgeschlossen. `WP-E14-16` kann nun das Epic-Abschlussreview, die LSP Capability Matrix, Known Limitations und den Upstream-Handoff fuer den weiteren RMT-DSL-Ausbau erstellen.
