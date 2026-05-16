# ER-WP-06 - Package-Export- und Release-Strategie festlegen

- Status: `completed`
- Datum: 6. Mai 2026
- Contract: `xtend.enterprise.er-wp-06.package-export-release-strategy.v1`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Strategie: `development/XTend-Package-Export-und-Release-Strategie.md`
- Betroffene Artefakte:
  - `package.json`
  - `README.md`
  - `CHANGELOG.md`
  - `development/XTend-Package-Export-und-Release-Strategie.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `tests/references/reference_path_suite.js`

## Ziel

XTend benoetigt nach Loader-Rename, lokaler Entwicklung, CDN-Entkopplung und Demo-/Fixture-Migration eine konsumierbare, aber noch nicht veroeffentlichte Package-Oberflaeche. ER-WP-06 legt diese Grenze fest, damit spaetere Release-Haertung ohne Architektur-Refactor aufsetzen kann.

## Umsetzung

- `package.json` besitzt nun Version, Beschreibung, License-Status, Browser Entry, `files`, `exports`, `publishConfig.provenance`, `engines`, Package-Metadaten unter `xtend.schema` und Release-Scripts.
- Die Export-Matrix trennt kanonische Browser-Loader, Legacy-Loader, UI API, CSS, Komponentenmanifest, Komponenten, Fabric, RMT Runtime, Builder und Security-Policy.
- `README.md` dokumentiert lokale Nutzung, zentrale Entry Points und die Release Boundary.
- `CHANGELOG.md` fuehrt den aktuellen RC1-Stand `0.1.0-rc.1`.
- `development/XTend-Package-Export-und-Release-Strategie.md` akzeptiert die Strategie unter `xtend.package-export.release-strategy.v1`.

## Bewusste Grenzen

- `private: false` ist im spaeteren RC1-Publish-Prep gesetzt; ER-WP-06 selbst fuehrte keinen Publish aus.
- Es wird kein oeffentlicher Publish durchgefuehrt.
- Es wird kein neues `dist/`-Bundle eingefuehrt.
- CommonJS-Test-/Scaffold-Pfade bleiben erhalten; browsernahe ESM-Pfade bleiben die Produktbasis.
- Supply-Chain-Gates werden nicht in ER-WP-06 implementiert; sie sind seit `ER-WP-30` als lokaler Offline-Gate und CI-Handoff umgesetzt.

## Akzeptanzcheck

| Kriterium | Status |
|-----------|--------|
| Package-Export-Strategie dokumentiert | erfuellt |
| `package.json` Export-Entscheidung vorbereitet | erfuellt |
| SemVer-, Changelog- und Provenance-Policy benannt | erfuellt |
| Spaetere Veroeffentlichung braucht keinen Architektur-Refactor | erfuellt |
| `private: false` ist fuer RC1-Publish-Prep gesetzt; Publish bleibt manuell | erfuellt |

## Validierung

| Gate | Ergebnis |
|------|----------|
| `node --check tests/references/reference_path_suite.js` | passed |
| `node scripts/run_xtend_tests.js references --json` | passed |
| `node scripts/run_xtend_tests.js browser --json` | passed nach Sandbox-Escalation fuer `127.0.0.1` Binding |
| `npm_config_cache=/private/tmp/xtend-npm-cache npm run pack:dry-run -- --json` | passed |
| `npm test` | passed nach Sandbox-Escalation fuer Browser-Smoke |

Hinweis: Der normale npm-Cache unter `~/.npm` meldete lokale Ownership-Probleme. Fuer den Pack-Dry-Run wurde deshalb ein temporaerer Cache unter `/private/tmp/xtend-npm-cache` genutzt, ohne den User-Cache zu veraendern.

## Handoff

| Folgepaket | Status | Uebergabe |
|------------|--------|-----------|
| `ER-WP-30` | completed | Dependency-, License- und Vulnerability-Gates setzen auf Package-Exports und Release-Scripts auf |
| `ER-WP-38` | completed | Release Checklist und SemVer Policy uebernehmen die hier definierte Export-Matrix sowie die ER-WP-37-Gate-Matrix |
| `ER-WP-39` | completed | Enterprise Adoption Guide nutzt README, Changelog, Release-Strategie und Release Checklist |
| `ER-WP-40` | completed | Docs-App RMT Pilot bleibt innerhalb der Release Boundary |

`ER-WP-06` ist abgeschlossen. EPIC 06 ist damit fachlich vollstaendig.
