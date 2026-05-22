# XTend Supply-Chain Gates

- Status: Active ab `ER-WP-30`
- Docs Contract: `xtend.docs.supply-chain-gates.v1`
- Supply-Chain Contract: `xtend.security.supply-chain-gate-plan.v1`
- Dependency Audit Gate: `xtend.security.dependency-audit-gate.v1`
- License Policy: `xtend.security.license-policy.v1`
- Vulnerability Policy: `xtend.security.vulnerability-policy.v1`
- Release Gate: `xtend.security.release-supply-chain-gate.v1`

## Uebersicht

XTend ist fuer RC1-Publish-Prep als scoped Public-Package-Flaeche vorbereitet. Supply-Chain-Gates kontrollieren dafuer Dependencies, Lizenzen, Vulnerabilities, SBOM, Provenance und die installierbare Package-Oberflaeche.

Der lokale Default-Pfad ist offline und reproduzierbar. Er fragt keine npm Registry ab.

## Lokale Checks

```bash
node scripts/verify_supply_chain_policy.js --json
node scripts/run_xtend_tests.js supply-chain --json
npm run test:supply-chain
```

Der Verify prueft:

- `private: false` fuer RC1-Publish-Prep
- `license: "Apache-2.0"` fuer den kompletten XTend-Stack
- `publishConfig.provenance = true`
- Export von `security/supply-chain-gate-policy.js`
- Release-Gate-Metadaten in `package.json`
- Dependency-Inventar und Lockfile-Pflicht

## CI-/Release-Stufen

Diese Kommandos sind fuer CI und Release Automation geplant:

```bash
npm audit --audit-level=moderate
npm sbom --sbom-format=cyclonedx --json
npm run release:report
npm run pack:dry-run
```

`npm audit` und `npm sbom` koennen Netzwerkzugriff benoetigen. Sie gehoeren deshalb nicht in den lokalen Default-Test, sondern in kontrollierte CI-/Release-Stufen.

## License Policy

Der komplette XTend-Stack ist auf `Apache-2.0` gesetzt. Fuer RC1-Publish-Prep ist `private: false` gesetzt; der eigentliche `npm publish` bleibt ein separater Owner-Schritt.

Die scoped Release-Manifests sind Teil des Supply-Chain-Gates:

| Package | Manifest |
|---------|----------|
| `@ccslabs/xtend` | `package.json` |
| `@ccslabs/xtend-rmt` | `xtendrmt/package.json` |
| `@ccslabs/xtend-fabric` | `fabric/package.json` |
| `@ccslabs/xtend-cli` | `xtend-builder/package.json` |
| `@ccslabs/xtend-compiler` | `tools/package.json` |

Ein oeffentlicher Release braucht vorher:

- bestaetigte Apache-2.0 License-Entscheidung
- Dependency-License-Inventar
- Review aller nicht-permissiven Dependency-Lizenzen
- Ausschluss von AGPL/GPL/UNLICENSED als Default-Third-Party-Abhaengigkeiten

## Vulnerability Policy

- `critical` blockiert jeden Release.
- `high` blockiert Release Candidates.
- Production-Findings ab `moderate` muessen triagiert werden.
- bekannte Exploits duerfen nicht in Release Candidates verbleiben.

## Maschinenlesbare Policy

```js
const {
  createSupplyChainGatePlan,
  classifyPackageSupplyChain
} = require('./security/supply-chain-gate-policy');
```

Die Policy selbst liegt in:

```text
security/supply-chain-gate-policy.js
```

Der lokale Report nutzt:

```text
xtend.security.supply-chain-report.v1
```

## Weiterfuehrende Dokumente

- [XTend Loader](./xtend-loader.md)
- [Trusted DOM und Sanitizing](./trusted-dom-sanitizing.md)
- [XTend-Fabric Runtime](./xtend-fabric.md)
