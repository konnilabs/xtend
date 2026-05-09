# ER-WP-28 - Manifest- und Dynamic-Import-Policy haerten

- Status: `completed`
- Datum: 6. Mai 2026
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Contract: `xtend.enterprise.er-wp-28.manifest-import-policy.v1`
- Loader Policy Contract: `xtend.security.loader-policy.v1`
- Manifest Policy Contract: `xtend.security.manifest-policy.v1`
- Import Policy Contract: `xtend.security.import-policy.v1`
- Gate Contract: `xtend.security.manifest-import-gate.v1`
- Zielcontract: `development/XTend-Manifest-und-Dynamic-Import-Policy.md`
- Bezug:
  - `development/ADR-XTend-Security-Trust-Boundaries.md`
  - `xtend-loader.js`
  - `security/manifest-import-policy.js`
  - `scripts/verify_manifest_import_policy.js`
  - `tests/security/manifest_import_policy_suite.js`
  - `docs/manifest-import-policy.md`

## Ziel

`ER-WP-28` setzt die in `ER-WP-27` akzeptierte Security Trust Boundary technisch um. Unsichere Manifest- oder Modul-URLs duerfen nicht still geladen werden.

## Umgesetzte Artefakte

| Artefakt | Status | Beschreibung |
|----------|--------|--------------|
| `xtend-loader.js` | completed | validiert `data-manifest`, Manifest Fetch, Manifest Records, Component Imports und `api.js` Import |
| `security/manifest-import-policy.js` | completed | maschinenlesbarer Policy-Contract fuer lokale URLs, Allowlist und Refusals |
| `scripts/verify_manifest_import_policy.js` | completed | offline Verify-Report `xtend.security.manifest-import-policy-report.v1` |
| `tests/security/manifest_import_policy_suite.js` | completed | lokaler Gate fuer Policy, Loader und Package Surface |
| `scripts/run_xtend_tests.js` | completed | Suite `manifest-import-policy` angebunden |
| `package.json` | completed | Export, npm Script und Release-Gate ergaenzt |
| `development/XTend-Manifest-und-Dynamic-Import-Policy.md` | completed | Security-Policy dokumentiert |
| `docs/manifest-import-policy.md` | completed | Entwicklerdokumentation ergaenzt |

## Loader-Haertung

Der Loader verweigert jetzt:

- externe Manifest-URLs
- externe Modul-URLs
- `javascript:`
- `data:`
- `blob:`
- nicht-`.js`/`.mjs` Module
- nicht-`.json` Manifeste
- encoded Path Traversal
- ungueltige Manifest-Keys

Refusals erzeugen:

- `xtend.security.loader.refused`
- `xtend.security.manifest.invalid`
- `xtend.security.import.refused`

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Lokale URLs bleiben erlaubt | erfuellt |
| Loopback-Dev-Server bleibt erlaubt | erfuellt |
| externe Manifest-URLs werden verweigert | erfuellt |
| externe Modul-URLs werden verweigert | erfuellt |
| `javascript:` und `data:` werden verweigert | erfuellt |
| Import Refusals erzeugen Diagnostics | erfuellt |
| Unsichere Manifest Records werden nicht still geladen | erfuellt |

## Verifikation

Auszufuehren:

```bash
node --check security/manifest-import-policy.js
node --check scripts/verify_manifest_import_policy.js
node --check tests/security/manifest_import_policy_suite.js
node scripts/verify_manifest_import_policy.js --json
node scripts/run_xtend_tests.js manifest-import-policy --json
npm run test:manifest-policy
node scripts/run_xtend_tests.js references --json
npm test -- --json
```

## Handoff

| Folgepaket | Startstatus nach ER-WP-28 | Handoff |
|------------|---------------------------|---------|
| `ER-WP-31` | planned | kann Manifest-Komponenten gegen Reife-, Docs-, Test-, A11y- und Type-Status katalogisieren |
| `ER-WP-36` | completed | kann Manifest-/Import-Gate als CI-Default-Gate aufnehmen |
| `ER-WP-37` | completed | PR-Fast- und Full-Release-Gates fuehren Manifest-/Import-Policy reproduzierbar |
| `ER-WP-38` | completed | Release-Checklist um Manifest-/Import-Policy erweitert |
| `ER-WP-39` | completed | Enterprise Adoption Guide erklaert Manifest-/Import-Policy fuer Teams |
| `ER-WP-40` | completed | Docs-App RMT Pilot bleibt in der Manifest-/Import-Policy |

## Ergebnis

`ER-WP-28` ist abgeschlossen. XTend besitzt jetzt eine technische Manifest-/Dynamic-Import-Policy und verweigert unsichere Loader- und Modul-URLs mit strukturierten Security-Diagnostics.
