# RMT Tooling Release Gates

Der Epic-14-Release-Schnitt fuer RMT-Tooling ist der stabile CI-Vertrag fuer Parser, Semantic Graph, Linter, Language Server, Agent Reports und Maraca-nahe Produktionspruefungen.

- Status: Accepted
- Contract: `xtend.epic14.rmt-tooling.v1`
- Release-Gate: `npm run test:rmt-tooling`
- Release-Report: `npm run test:rmt-tooling:report`
- Optionaler PR-Gate: `npm run test:pr:rmt`
- Optionaler PR-Report: `npm run test:pr:rmt:report`
- Self-Gate: `node scripts/run_xtend_tests.js epic14-rmt-tooling --json`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## RKFA Closure

RKFA-13 erweitert den Gate-Schnitt um PROD-Maraca-Closure:

- Schema: `xtend.maraca.production-bundle-closure.v1`
- Gate: `node scripts/run_xtend_tests.js maraca-bundle-report rmt-stack-docs epic14-rmt-tooling-release-gates --json`
- Reports: `productionClosure`, `kernelFeatureAdoptionClosure`
- CI-Artefakt: `.xtend-test-results/xtend-rkfa-production-closure-report.json`

PROD-Bundles duerfen fehlende Runtime-Capabilities, Policy-Parity-Drift, Strict-Fallbacks oder fehlgeschlagene Bundle-Budgets nicht still uebergehen.

## CI-Verhalten

Die GitHub Actions fuehren die RMT-Tooling-Gates nicht als isolierte Nebenstrecke aus. Sie sind Teil der PR- und Release-Reports und werden zusaetzlich als RKFA-Closure-Report materialisiert. Dadurch koennen Owner in einem normalen PR sehen, ob Parser, Linter, Agent-Repair, Maraca-Closure und Kernel-Feature-Adoption gemeinsam konsistent sind. Der separate Report ist bewusst klein gehalten: Er prueft das Maraca-Bundle-Reporting, die RMT-Stack-Dokumentation und den Epic-14-Release-Gate-Alias in einem Lauf.

Bei Release- oder Publish-Pfaden wird derselbe Closure-Report erneut erzeugt. Das verhindert, dass ein Bundle zwar den grossen Release-Report passiert, aber spaeter ohne maschinenlesbare Evidence fuer `productionClosure` oder `kernelFeatureAdoptionClosure` veroeffentlicht wird. Fuer Debugs ist der Report deshalb ein stabiler Einstiegspunkt: erst `xtend-rkfa-production-closure-report.json`, dann bei Bedarf `xtend-release-gate-report.json` und das Maraca-Bundle-Report-Artefakt.

## Erwartete Evidence

Ein gruener Gate-Lauf liefert drei Ebenen von Evidence. Die erste Ebene ist Source-to-Sea: RMT-Quelle, Bundle-Fingerprint, Runtime-Expected-Status und verlinkte Release-Tests muessen zusammenpassen. Die zweite Ebene ist Policy-Parity: Kernel-nahe Factories wie `recordTrustVerdict`, `recoverFromPanic`, `reportPerformanceSample` und `dispatchCommand` muessen in Compile-Time- und Runtime-Sicht ohne Drift vorhanden sein. Die dritte Ebene ist Runtime Closure: Lifecycle, Telemetry, Performance, Warm Reentry, Prewarm Worker und Prerender duerfen nur als aktiv gelten, wenn die produktive Kette die Capability auch wirklich bereitstellt.

Wenn eine Capability bewusst optional ist, bleibt sie sichtbar, aber sie darf keine PROD-Ready-Behauptung simulieren. Das ist der Unterschied zwischen `supported`, `active`, `degraded` und `blocked`. CI betrachtet diese Felder nicht als Dekoration, sondern als Contract zwischen RMT-Kernel, Fabric, Maraca und UI-Layer.
