# ER-WP-04 - Lokalen Dev-/Test-Server produktisieren

- Status: `completed`
- Datum: 5. Mai 2026
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Contract: `xtend.enterprise.er-wp-04.local-dev-server.v1`
- Server Contract: `xtend.local-dev-server.v1`
- Server Entry: `scripts/serve_xtend_dev.js`
- Bezug:
  - `development/ADR-XTend-Loader-und-Lokale-Entwicklung.md`
  - `development/ER-WP-01-Loader-Contract-und-Rename-ADR-fuer-xtend-loader-js.md`
  - `development/ER-WP-02-xtend-loader-js-als-kanonischen-ESM-Loader-einfuehren.md`
  - `development/XTend-Enterprise-Reife-Implementierungsplan.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `scripts/serve_xtend_dev.js`
  - `tests/browser/browser_smoke_suite.js`
  - `package.json`

## Ziel

`ER-WP-04` produktisiert einen einheitlichen lokalen HTTP-Server fuer manuelle Entwicklung, Demos und browsernahe Tests.

Das Paket vermeidet bewusst eine zweite Serverlogik im Browser-Harness. Die Test-Suite nutzt dasselbe Servermodul wie `npm run dev:local`.

## Ergebnisartefakte

| Artefakt | Status | Rolle |
|----------|--------|-------|
| `scripts/serve_xtend_dev.js` | produktiv | gemeinsamer statischer Repo-Server fuer Entwicklung und Tests |
| `npm run dev:local` | produktiv | manueller lokaler Entwicklungsserver auf Port `4173` |
| `npm run test:browser:local` | produktiv | Browser-Smoke-Gate ueber die gemeinsame lokale Serverlogik |
| `tests/browser/browser_smoke_suite.js` | angebunden | nutzt `listenXtendDevServer` aus dem Servermodul |

## Server-Oberflaeche

Der Server Contract lautet:

```text
xtend.local-dev-server.v1
```

Das Modul exportiert:

```js
createXtendDevServer(options)
listenXtendDevServer(options)
contentTypeFor(filePath)
resolveSafePath(rootDir, requestPathname, defaultPath)
```

Die CLI ist:

```bash
node scripts/serve_xtend_dev.js --port 4173
node scripts/serve_xtend_dev.js --port 0 --check --json
```

## Umgesetzte Server-Pflichten

| Pflicht | Ergebnis |
|---------|----------|
| statischer Repo-Server | erfuellt: Root ist standardmaessig das Repository |
| MIME Types | erfuellt: `.html`, `.js`, `.mjs`, `.css`, `.json`, `.wasm` und gaengige Assets |
| Port-Konfiguration | erfuellt: `--port`, Default `4173` |
| Testmodus mit Port `0` | erfuellt: `listenXtendDevServer({ port: 0 })` |
| lokaler Host | erfuellt: Default `127.0.0.1` |
| Path-Traversal-Schutz | erfuellt: Requests ausserhalb des Roots werden verweigert |
| Browser-Harness-Anbindung | erfuellt: Safari-Smokes und statische Server-Checks nutzen dieselbe Serverlogik |
| NPM-Scripts | erfuellt: `dev:local`, `test:browser:local` |

## Handoff an Folgepakete

| Folgepaket | Startstatus nach ER-WP-04 | Handoff |
|------------|---------------------------|---------|
| `ER-WP-03` | ready | CDN-Fallbacks koennen gegen den lokalen Serverpfad entfernt werden |
| `ER-WP-05` | blocked | Demo-/Fixture-Migration wartet weiter auf `ER-WP-03` |
| `ER-WP-36` | planned | CI-Workflow kann spaeter `npm run test:browser:local` und den lokalen Serververtrag verwenden |
| `ER-WP-39` | completed | Enterprise Adoption Guide dokumentiert lokale Serverbefehle |
| `ER-WP-40` | completed | Docs-App nutzt lokalen Server als Basis fuer RMT Parsedown Scheduling |

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| `scripts/serve_xtend_dev.js` existiert | erfuellt |
| `npm run dev:local` existiert | erfuellt |
| `npm run test:browser:local` existiert | erfuellt |
| Browser-Smoke-Harness und manuelle Entwicklung nutzen dieselbe Serverlogik | erfuellt |
| Port `0` fuer Tests ist nutzbar | erfuellt |
| MIME Types fuer `.html`, `.js`, `.mjs`, `.css`, `.json`, `.wasm` sind vorhanden | erfuellt |

## Verifikation

Mindestgate fuer dieses Paket:

```bash
node --check scripts/serve_xtend_dev.js
node scripts/serve_xtend_dev.js --port 0 --check --json
node --check tests/browser/browser_smoke_suite.js
npm run test:browser:local -- --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`ER-WP-04` ist abgeschlossen. XTend besitzt jetzt einen gemeinsamen lokalen Dev-/Test-Server fuer manuelle Entwicklung und Browser-Smokes. `ER-WP-03` bleibt startbereit; `ER-WP-05` wartet weiter auf die CDN-Entkopplung aus `ER-WP-03`.
