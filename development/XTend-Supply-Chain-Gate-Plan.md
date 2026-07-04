# XTend Supply-Chain Gate Plan

- Status: Accepted
- Datum: 6. Mai 2026
- Contract: `xtend.security.supply-chain-gate-plan.v1`
- Dependency Audit Gate: `xtend.security.dependency-audit-gate.v1`
- License Policy: `xtend.security.license-policy.v1`
- Vulnerability Policy: `xtend.security.vulnerability-policy.v1`
- Release Supply-Chain Gate: `xtend.security.release-supply-chain-gate.v1`
- Roadmap-Paket: `ER-WP-30`
- Bezug:
  - `development/XTend-Package-Export-und-Release-Strategie.md`
  - `development/ADR-XTend-Security-Trust-Boundaries.md`
  - `development/ER-WP-30-Dependency-License-und-Vulnerability-Gates-planen.md`
  - `security/supply-chain-gate-policy.js`
  - `scripts/verify_supply_chain_policy.js`
  - `tests/security/supply_chain_policy_suite.js`
  - `docs/supply-chain-gates.md`
  - `package.json`

## Ziel

XTend bleibt bis zur Release-Reife ein privates Paket. Trotzdem muss der Publish-Pfad jetzt so vorbereitet sein, dass Dependency-, License-, Vulnerability- und Provenance-Gates spaeter ohne Architektur-Refactor in CI/CD und Release-Checklisten aufgenommen werden koennen.

`ER-WP-30` ist deshalb ein Supply-Chain-Planungs- und Offline-Gate-Paket: Es startet keinen echten Publish-Prozess und fuehrt lokal keine Netzwerk-Audits aus. Es legt aber fest, welche lokalen Checks ab sofort laufen und welche Registry-/Audit-Pruefungen in CI oder Release Automation zwingend werden.

## Grundsatz

- Lokale Tests bleiben deterministisch und offline.
- Externe Audit-Kommandos werden als CI-/Release-Gates geplant, nicht als Default-Entwicklungsbremse.
- Neue Dependencies brauchen ein Lockfile und eine License-/Vulnerability-Bewertung.
- `private: false` ist fuer RC1-Publish-Prep gesetzt; Release-Checklist, CI und Supply-Chain-Gates bleiben pruefpflichtig.
- `Apache-2.0` ist als Projektlizenz fuer den kompletten XTend-Stack akzeptiert; ein oeffentlicher Release braucht weiterhin den separaten Owner-Publish-Entscheid.
- `publishConfig.provenance = true` bleibt Pflicht fuer spaetere npm-Releases.
- Native-First `NFM-WP-04` trennt ab 3. Juni 2026 Core-Runtime-, Tooling-, Editor-, Vendor- und Legacy-Flaechen. Der Root-/Core-Runtime-Default bleibt dependency-frei; produktnahe Tooling-Dependencies wie Maraca werden separat klassifiziert.
- Der TypeScript-first Komponentenpfad darf `typescript` ausschliesslich als `devDependencies`-Compilerwerkzeug fuehren. Die Runtime-Policy bleibt `no-new-runtime-dependencies`.

## Gate Matrix

| Gate | Contract | Phase | Lokal? | Release-blockierend |
|------|----------|-------|--------|---------------------|
| Dependency Inventory | `xtend.security.dependency-audit-gate.v1` | local | ja | ja |
| License Policy | `xtend.security.license-policy.v1` | local | ja | ja |
| Vulnerability Policy | `xtend.security.vulnerability-policy.v1` | CI/release | nein, geplant | ja |
| Release Report | `xtend.security.release-supply-chain-gate.v1` | local/CI | ja | ja |
| Pack Dry Run + Provenance | `xtend.security.release-supply-chain-gate.v1` | local/CI | ja | ja |

## Lokaler Gate

Der lokale Gate prueft keine fremde Registry. Er prueft die Package-Oberflaeche, Dependency-Inventur, private Publish Boundary, Provenance, Release-Gate-Liste und die vorhandenen Policy Contracts.

```bash
node scripts/verify_supply_chain_policy.js --json
node scripts/run_xtend_tests.js supply-chain --json
npm run test:supply-chain
```

Der lokale Gate ist absichtlich schnell und reproduzierbar. Wenn spaeter Dependencies hinzukommen, wird ohne Lockfile blockiert.

## CI- und Release-Gates

Folgende Gates sind seit `ER-WP-36` und `ER-WP-38` als CI-/Release-Stufen eingeordnet:

```bash
npm audit --audit-level=moderate
npm sbom --sbom-format=cyclonedx --json
npm run release:report
npm run pack:dry-run
```

`npm audit` und `npm sbom` duerfen Netzwerk- oder Registry-Zugriff benoetigen und bleiben deshalb ausserhalb des lokalen Default-Gates. CI muss sie als eigene Stufe mit kontrolliertem Netzwerkzugriff ausfuehren.

## Dependency Policy

Ab ER-WP-30 gilt:

- dependency sections: `dependencies`, `devDependencies`, `optionalDependencies`, `peerDependencies`
- bei mindestens einer Dependency muss ein Lockfile vorhanden sein
- erlaubte Lockfiles: `package-lock.json`, `npm-shrinkwrap.json`, `pnpm-lock.yaml`, `yarn.lock`
- neue Runtime-Dependencies brauchen Begruendung in Changelog oder Workpackage
- optionale und peer Dependencies muessen in Docs erklaert werden

Der lokale Root-Gate-Stand hat keine externen Core-Runtime-Dependencies. Damit bleibt das Root-Dependency-Inventar leer und offline gatebar. Workspace-Tooling-Dependencies wie `xtend-maraca` mit `rollup` und `terser` sowie Editor-Dependencies wie `vscode-languageclient` werden seit `NFM-WP-04` separat in `development/XTend-Native-First-Dependency-Diet-Policy-Contract.md` und `development/XTend-Native-First-Dependency-Exit-Plan-Matrix.md` klassifiziert.

Seit dem produktiven TypeScript-first Komponentenpfad ist `typescript` als erlaubtes Build-only Tooling in `devDependencies` klassifiziert. Es darf nicht in `dependencies`, `optionalDependencies` oder `peerDependencies` wandern und erhoeht den Runtime-Dependency-Zaehler nicht.

## License Policy

| Kontext | Regel |
|---------|-------|
| aktuelles privates Paket | `Apache-2.0` ist gesetzt |
| kompletter XTend-Stack | `Apache-2.0` ist die Projektlizenz |
| oeffentlicher XTend Release | Owner-Publish-Entscheid muss die Apache-2.0 License-Entscheidung bestaetigen |
| Third-Party Dependencies | permissive Lizenzen wie MIT, ISC, BSD, Apache-2.0 sind Default-ok |
| Review-Lizenzen | LGPL, CC-Lizenzen und nicht-standardisierte Expressions brauchen Review |
| verbotene Default-Lizenzen | AGPL, GPL und `UNLICENSED` als Third-Party Dependency |

Diese Policy ersetzt kein juristisches Legal Review. Sie sorgt dafuer, dass problematische Dependency-Lizenzen nicht unbemerkt in Release-Kandidaten gelangen.

## Vulnerability Policy

- Kritische Findings blockieren jeden Release.
- Hohe Findings blockieren Release-Kandidaten.
- Moderate Production-Findings muessen mindestens triagiert werden.
- Development-Findings werden ab `high` release-relevant.
- Bekannte Exploits duerfen nicht in Release Candidates verbleiben.

Die lokale Policy kann nur pruefen, dass diese Regeln vorhanden sind. Die eigentliche Datenquelle ist der CI-/Release-Audit.

## Maschinenlesbarer Contract

Die Policy liegt in:

```text
security/supply-chain-gate-policy.js
```

Sie exportiert:

- `createSupplyChainGatePlan()`
- `classifyPackageSupplyChain(packageManifest, lockfiles)`
- `listDependencies(packageManifest)`
- die Contract IDs fuer Audit, License, Vulnerability und Release Gates

Der lokale Verify liegt in:

```text
scripts/verify_supply_chain_policy.js
```

Er erzeugt Reports unter:

```text
xtend.security.supply-chain-report.v1
```

## Handoff

| Folgepaket | Handoff |
|------------|---------|
| `ER-WP-36` | CI Workflow kann `test:supply-chain`, `npm audit` und `npm sbom` als getrennte Stufen aufnehmen |
| `ER-WP-38` | Release Checklist uebernimmt private Boundary, License-Entscheidung, SBOM, Audit und Provenance als Pflichtpunkte |
| `ER-WP-39` | Enterprise Adoption Guide muss lokale und CI Supply-Chain-Gates erklaeren |

## Verifikation

```bash
node --check security/supply-chain-gate-policy.js
node --check scripts/verify_supply_chain_policy.js
node scripts/verify_supply_chain_policy.js --json
node scripts/run_xtend_tests.js supply-chain --json
node scripts/run_xtend_tests.js references --json
npm test
```
