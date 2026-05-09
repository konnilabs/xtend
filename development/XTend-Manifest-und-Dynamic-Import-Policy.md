# XTend Manifest- und Dynamic-Import-Policy

- Status: Accepted
- Datum: 6. Mai 2026
- Loader Policy Contract: `xtend.security.loader-policy.v1`
- Manifest Policy Contract: `xtend.security.manifest-policy.v1`
- Import Policy Contract: `xtend.security.import-policy.v1`
- Gate Contract: `xtend.security.manifest-import-gate.v1`
- Bezug:
  - `development/ADR-XTend-Security-Trust-Boundaries.md`
  - `security/manifest-import-policy.js`
  - `xtend-loader.js`
  - `tests/security/manifest_import_policy_suite.js`
  - `scripts/verify_manifest_import_policy.js`
  - `docs/manifest-import-policy.md`

## Ziel

XTend laedt Komponenten dynamisch aus dem Manifest. Diese Flexibilitaet darf nicht bedeuten, dass externe Skripte, CDN-Fallbacks oder URL-Tricks still in den Loader-Pfad gelangen.

Diese Policy haertet:

- `data-manifest`
- Manifest Fetch
- Manifest Records
- Dynamic Module Imports
- Preload- und Dependency-Konventionen
- Loader Security Diagnostics

## Erlaubte URL-Klassen

| URL-Typ | Status | Bedingung |
|---------|--------|-----------|
| relative URL | erlaubt | wird gegen Dokument- oder Manifest-Basis normalisiert |
| root-relative URL | erlaubt | bleibt auf gleicher Origin |
| same-origin `http:`/`https:` | erlaubt | Host, Protokoll und Port bleiben gleich |
| loopback lokal | erlaubt | `localhost`, `127.0.0.1`, `0.0.0.0`, `::1` im lokalen Dev-Kontext |
| `file:` | erlaubt | nur in file-lokalem Kontext |
| externe CDN-/Remote-URL | verweigert | Default-Policy kennt keine Remote-Allowlist |
| `javascript:` | verweigert | kein Code-String als URL |
| `data:` fuer Skripte | verweigert | kein Inline-Modul |
| `blob:` | verweigert | kein dynamischer Script-Blob |
| Pfad-Traversal | verweigert | auch encoded Varianten wie `%2e%2e` |

## Manifest-Regeln

Manifest Records sind Daten, keine ausfuehrbare Konfiguration.

Erlaubt:

- `xstate` als reservierter Bootstrap-Key
- Custom-Element-Keys nach `custom-element-name` Muster
- String-Werte mit `.js` oder `.mjs`
- kuenftige Object-Records mit `path` oder `url`
- `dependencies` nur als Component IDs

Verweigert:

- Gross-/Mischschreibung bei Manifest-Keys
- Keys ohne Bindestrich ausser `xstate`
- URL-Werte mit externem Host
- nicht-JavaScript Module
- URL-artige Dependency-Werte
- Inline-Handler oder Code-Strings in Manifest-Feldern

## Loader-Verhalten

`xtend-loader.js` validiert:

1. `data-manifest` beziehungsweise Default-Manifest-URL vor dem Fetch
2. Manifest-Fetch-URL vor `fetch(...)`
3. jeden Manifest Record vor Aufnahme in das aufgeloeste Manifest
4. jeden Modulpfad vor dynamischem Script-Tag
5. den lokalen `api.js` Import

Refusals laden nichts nach und erzeugen strukturierte Diagnostics.

## Diagnostics

Stabile Diagnostic Codes:

- `xtend.security.loader.refused`
- `xtend.security.manifest.invalid`
- `xtend.security.import.refused`

Detailcodes in `metadata.diagnostics`:

- `xtend.security.loader.refused.external_manifest`
- `xtend.security.import.refused.external_module`
- `xtend.security.import.refused.protocol`
- `xtend.security.import.refused.path_traversal`
- `xtend.security.import.refused.extension`
- `xtend.security.manifest.invalid.tag`
- `xtend.security.manifest.invalid.url`
- `xtend.security.manifest.invalid.dependencies`

## Maschinenlesbare Policy

Die Policy liegt in:

```text
security/manifest-import-policy.js
```

Nutzung:

```js
const {
  classifyPolicyUrl,
  normalizeManifest
} = require('./security/manifest-import-policy');
```

## Gates

```bash
node scripts/verify_manifest_import_policy.js --json
node scripts/run_xtend_tests.js manifest-import-policy --json
npm run test:manifest-policy
```

Das Gate bleibt offline und nutzt lokale Fixture-URLs. Netzwerk- oder Registry-Zugriff ist nicht erforderlich.

## Handoff

`ER-WP-28` schliesst die technische Manifest-/Import-Haertung aus der Security ADR ab.

Folgepfade:

- `ER-WP-31` kann die Manifest-Komponenten nun gegen Coverage- und Reifestatus pruefen.
- `ER-WP-36` kann `npm run test:manifest-policy` in CI aufnehmen.
- `ER-WP-38` nimmt das Manifest-/Import-Gate in die Release Checklist auf.
- `ER-WP-39` hat das Manifest-/Import-Gate im Enterprise Adoption Guide als Betriebsstandard beschrieben.
- `ER-WP-40` verwendet diese Boundary im Docs-App RMT Parsedown Scheduling Pilot.
