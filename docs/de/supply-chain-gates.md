# Supply Chain Checks

Lizenz-, Dependency- und Paketprüfungen für veröffentlichbare Builds.

## Worum es geht

Supply-Chain-Gates prüfen Dependency-Inventar, Lockfile, Lizenzen, Vulnerability-Policy und veröffentlichte Package Roots. Der lokale Standard bleibt offline; registryabhängige Audits laufen als ausdrücklich aktivierter CI-Schritt.

## Öffentliche Bausteine

- `security/supply-chain-gate-policy.js` definiert Gates und erlaubte Lizenzen.
- `package.json` und Workspace-Manifeste liefern Paket- und Dependency-Fakten.
- `typescript` ist Build-Tool in `devDependencies`; Runtime-Dependencies bleiben leer.

## Empfohlener Ablauf

Prüfe zuerst die reproduzierbare lokale Policy:

```bash
node scripts/run_xtend_tests.js supply-chain --json
```

Ein Fehler nennt Gate, Paket und Policy-Grund. Korrigiere Manifest, Lockfile, Lizenzentscheidung oder Package Root. Entferne keine Finding durch Umklassifizierung zur Dev-Dependency, wenn Code sie zur Laufzeit importiert. Netzwerk-Audit und SBOM ergänzen diesen Report, ersetzen ihn aber nicht.

## Nächste Schritte

- [Trusted DOM und Sanitizing](./trusted-dom-sanitizing.md)
- [Manifest Import Policy](./manifest-import-policy.md)
