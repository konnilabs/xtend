# WP-E13-04 - Package Dry Run Artefakt und Export-Surface-Lock bauen

- Contract: `xtend.epic13.wp04.package-export-lock.v1`
- Produkt-Contract: `xtend.epic13.package-export-lock.v1`
- Status: `completed`
- Datum: 8. Mai 2026
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-package-export-lock --json`
- Capture Script: `npm run pack:dry-run:report`
- Handoff: `WP-E13-08`

## Ziel

Das Paket macht `npm run pack:dry-run` fuer RC1 maschinenlesbar und sperrt die Public Package Surface gegen unbemerkte Drift.

## Umgesetzt

- `catalog/epic13-package-export-lock.js` definiert den Contract, den Surface Snapshot, den Dry-Run-Artefakt-Parser und den Validator.
- `tests/platform/epic13_package_export_lock_suite.js` prueft Contract, Package, Scaffold, Runner, Docs, Steering und Reference Registry.
- `scripts/capture_pack_dry_run.js` erzeugt `.xtend-test-results/xtend-pack-dry-run.json`, `.xtend-test-results/xtend-package-export-surface-lock.json` und `.xtend-test-results/xtend-package-export-lock-report.json`.
- `package.json` exportiert das Contract-Modul und fuehrt `test:epic13-package-export-lock` sowie `pack:dry-run:report`.
- Docs, Release Checklist, CI Matrix, README, Changelog und Reference Registry sind nachgezogen.

## Lock-Regeln

| Regel | Entscheidung |
|-------|--------------|
| `private: true` | bleibt Pflicht |
| Export Count | 54 erwartete Exports |
| Externe Export Targets | verboten |
| Export Targets ausserhalb `files` | verboten |
| `npm pack` im lokalen Test | nicht erforderlich |
| Dry-Run-Artefakt fuer RC1 | erforderlich |

## Verifikation

```bash
node scripts/run_xtend_tests.js epic13-package-export-lock --json
npm run pack:dry-run:report
```

## Handoff

`WP-E13-05` ist abgeschlossen; `WP-E13-06` hat die Hydration Performance Warning owner-frei geschlossen. `WP-E13-07` hat die PROD-nahen Browser-, Local-Server- und CSP-Smokes vorbereitet. `WP-E13-08` hat Visual Owner Artifacts normalisiert. `WP-E13-09` ist startbar.
