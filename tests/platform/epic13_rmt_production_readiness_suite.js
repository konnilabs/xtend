const fs = require('fs');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  EPIC13_RMT_PRODUCTION_READINESS_CONTRACT,
  EPIC13_RMT_PRODUCTION_READINESS_DOCS,
  EPIC13_RMT_PRODUCTION_READINESS_LOCAL_GATE,
  EPIC13_RMT_PRODUCTION_READINESS_MODULE,
  EPIC13_RMT_PRODUCTION_READINESS_PACKAGE_SCRIPT,
  EPIC13_RMT_PRODUCTION_READINESS_REPORT_ARTIFACT,
  EPIC13_RMT_PRODUCTION_READINESS_REPORT_SCHEMA,
  EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
  EPIC13_RMT_PRODUCTION_READINESS_STATUS,
  EPIC13_RMT_PRODUCTION_READINESS_STEERING,
  EPIC13_RMT_PRODUCTION_READINESS_SUITE,
  EPIC13_RMT_PRODUCTION_READINESS_TARGET,
  EPIC13_RMT_PRODUCTION_READINESS_WORKPACKAGE,
  EPIC13_RMT_PRODUCTION_READINESS_WORKPACKAGE_DOC,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  PUBLISH_BOUNDARY,
  REQUIRED_DOCS,
  REQUIRED_RMT_ARTIFACTS,
  REQUIRED_RMT_DOMAINS,
  REQUIRED_RMT_SOURCE_GATES,
  RMT_EVIDENCE_RECORDS,
  createEpic13RmtProductionReadinessPlan,
  createEpic13RmtProductionReadinessReport,
  validateEpic13RmtProductionReadinessPlan
} = require('../../catalog/epic13-rmt-production-readiness');
const {
  KERNEL_BOUNDARY
} = require('../../catalog/epic12-rc0-gate-matrix');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function collectFabricLanesFromComponents(components = []) {
  return components
    .map((component) => component && component.metadata && component.metadata.fabric && component.metadata.fabric.lane)
    .filter(Boolean);
}

function hasAdapter(document, adapterId) {
  return Array.isArray(document.adapters) && document.adapters.some((adapter) => adapter.id === adapterId && adapter.kernelVisible === false);
}

function runEpic13RmtProductionReadinessSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic13-rmt-production-readiness',
    label: 'Epic 13 RMT Production Readiness'
  });
  const plan = createEpic13RmtProductionReadinessPlan({ rootDir });
  const validation = validateEpic13RmtProductionReadinessPlan(plan);
  const report = createEpic13RmtProductionReadinessReport({ rootDir, plan });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.epic13RmtProductionReadiness;
  const rc1Metadata = packageManifest.xtend && packageManifest.xtend.epic13Rc1Readiness;
  const ownerMetadata = packageManifest.xtend && packageManifest.xtend.epic13ReleaseOwnerAcceptance;
  const networkMetadata = packageManifest.xtend && packageManifest.xtend.epic13ConditionalNetworkEvidence;
  const packageLockMetadata = packageManifest.xtend && packageManifest.xtend.epic13PackageExportLock;
  const hydrationMetadata = packageManifest.xtend && packageManifest.xtend.epic13HydrationPerformanceClosure;
  const prodCspMetadata = packageManifest.xtend && packageManifest.xtend.epic13ProdBrowserCspSmoke;
  const visualMetadata = packageManifest.xtend && packageManifest.xtend.epic13VisualOwnerArtifact;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const steering = readText(EPIC13_RMT_PRODUCTION_READINESS_STEERING, rootDir);
  const contractDoc = readText(EPIC13_RMT_PRODUCTION_READINESS_CONTRACT, rootDir);
  const workpackage = readText(EPIC13_RMT_PRODUCTION_READINESS_WORKPACKAGE_DOC, rootDir);
  const docs = readText(EPIC13_RMT_PRODUCTION_READINESS_DOCS, rootDir);
  const firstClassDocs = readText('docs/rmt-first-xtend-apps.md', rootDir);
  const demoDocs = readText('docs/rmt-first-demo-app.md', rootDir);
  const dslDocs = readText('docs/xtendrmt-app-dsl.md', rootDir);
  const nativeDocs = readText('docs/xtendrmt-native-authoring.md', rootDir);
  const fabricDocs = readText('docs/xtend-fabric-rmt-lane-mapping.md', rootDir);
  const visualDocs = readText('docs/visual-owner-artifacts.md', rootDir);
  const rc1Docs = readText('docs/rc1-readiness.md', rootDir);
  const ownerDocs = readText('docs/release-owner-acceptance.md', rootDir);
  const enterpriseAdoption = readText('docs/enterprise-adoption.md', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const releaseChecklist = readText('development/XTend-Release-Checklist-und-SemVer-Policy.md', rootDir);
  const ciMatrix = readText('development/XTend-CI-Gate-Matrix.md', rootDir);
  const packageExportContract = readText('development/XTend-Epic13-Package-Export-Lock-Contract.md', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const readme = readText('README.md', rootDir);
  const changelog = readText('CHANGELOG.md', rootDir);
  const firstClassFixture = readJson('tests/fixtures/rmt-first-class-xtend-app.rmt', rootDir);
  const demoFixture = readJson('xtendrmt/rmt-first-demo-app.rmt', rootDir);
  const demoHost = readText('xtendrmt-rmt-first-demo.html', rootDir);
  const demoSmoke = readText('tests/browser/fixtures/rmt-first-demo-app-smoke.html', rootDir);
  const rmtCore = readText('xtendrmt/rmt-core.esm.js', rootDir);
  const rmtRuntime = readText('xtendrmt/rmt-runtime.esm.js', rootDir);
  const rmtBrowser = readText('xtendrmt/rmt-runtime.browser.js', rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC13_RMT_PRODUCTION_READINESS_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC13_RMT_PRODUCTION_READINESS_SUITE, { rootDir, extension: '.js' });

  [
    EPIC13_RMT_PRODUCTION_READINESS_MODULE,
    EPIC13_RMT_PRODUCTION_READINESS_SUITE,
    EPIC13_RMT_PRODUCTION_READINESS_STEERING,
    EPIC13_RMT_PRODUCTION_READINESS_CONTRACT,
    EPIC13_RMT_PRODUCTION_READINESS_WORKPACKAGE_DOC,
    EPIC13_RMT_PRODUCTION_READINESS_DOCS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as required RMT production readiness doc`);
  });
  REQUIRED_RMT_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as required RMT production readiness artifact`);
  });

  context.assert(moduleSyntax.ok, `Epic 13 RMT Production Readiness module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Epic 13 RMT Production Readiness suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === EPIC13_RMT_PRODUCTION_READINESS_SCHEMA, 'RMT production readiness exposes stable schema');
  context.assert(plan.reportSchema === EPIC13_RMT_PRODUCTION_READINESS_REPORT_SCHEMA, 'RMT production readiness exposes report schema');
  context.assert(plan.workpackage === EPIC13_RMT_PRODUCTION_READINESS_WORKPACKAGE, 'RMT production readiness belongs to WP-E13-09');
  context.assert(plan.status === EPIC13_RMT_PRODUCTION_READINESS_STATUS, 'RMT production readiness is accepted');
  context.assert(plan.sourceSchema === 'xtend.epic13.visual-owner-artifact.v1', 'RMT production readiness consumes visual owner artifact');
  context.assert(plan.sourceValidationOk === true && plan.sourceReportOk === true, 'RMT production readiness consumes valid visual owner artifact');
  context.assert(plan.targetReadiness === EPIC13_RMT_PRODUCTION_READINESS_TARGET, 'RMT production readiness target is bundled');
  context.assert(plan.localGateMode === 'static-rc1-rmt-gate-bundle', 'RMT production readiness local gate is static bundle');
  context.assert(plan.externalBrowserRequiredInLocalGate === false && plan.externalNetworkAllowedInLocalGate === false, 'RMT production readiness has no external browser or network dependency');
  context.assert(plan.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'RMT production readiness keeps kernel boundary');
  context.assert(plan.rmtKernelImportsXtendTypes === false, 'RMT production readiness rejects XTend type imports in kernel');
  context.assert(plan.adapterBoundary === 'xtend-adapters-only', 'RMT production readiness keeps XTend behind adapters');
  context.assert(plan.frameworkAgnostic === true, 'RMT production readiness keeps RMT framework agnostic');
  context.assert(plan.nextWorkpackage === NEXT_WORKPACKAGE, 'RMT production readiness makes WP-E13-11 ready');
  context.assert(plan.nextDecision === NEXT_DECISION, 'RMT production readiness hands off to Docs-App RMT Parsedown hardening');
  context.assert(plan.publishBoundary === PUBLISH_BOUNDARY, 'RMT production readiness keeps publish boundary');
  context.assert(plan.publishAllowed === false, 'RMT production readiness keeps publish blocked');
  context.assert(validation.schema === EPIC13_RMT_PRODUCTION_READINESS_REPORT_SCHEMA, 'RMT production readiness validator emits report schema');
  context.assert(validation.ok === true, 'RMT production readiness plan validates');
  context.assert(report.ok === true, 'RMT production readiness report validates');
  context.assert(report.sourceGateCount === REQUIRED_RMT_SOURCE_GATES.length, 'RMT production readiness report counts source gates');
  context.assert(report.coveredDomainCount === REQUIRED_RMT_DOMAINS.length, 'RMT production readiness report counts domains');
  context.assert(report.evidenceRecordCount === RMT_EVIDENCE_RECORDS.length, 'RMT production readiness report counts evidence records');
  assertIncludesAll(context, plan.sourceGates, REQUIRED_RMT_SOURCE_GATES, 'RMT source gates');
  assertIncludesAll(context, plan.requiredDomains, REQUIRED_RMT_DOMAINS, 'RMT required domains');
  assertIncludesAll(context, plan.coveredDomains, REQUIRED_RMT_DOMAINS, 'RMT covered domains');
  assertIncludesAll(context, plan.artifactPaths, REQUIRED_RMT_ARTIFACTS, 'RMT artifact paths');
  context.assert(plan.missingDomains.length === 0, 'RMT production readiness has no missing domains');
  context.assert(plan.evidenceRecords.every((record) => record.status === 'covered'), 'All RMT evidence records are covered');
  context.assert(plan.productionBundle.shellFirst === true, 'RMT production bundle is shell-first');
  context.assert(plan.productionBundle.routingNativeInRmt === true, 'RMT production bundle has native RMT routing');
  context.assert(plan.productionBundle.componentAdapterRequired === true, 'RMT production bundle requires component adapter');
  context.assert(plan.productionBundle.fabricLaneIngestionRequired === true, 'RMT production bundle requires Fabric/Lane ingestion');
  context.assert(plan.productionBundle.lifecycleTelemetryRequired === true, 'RMT production bundle requires lifecycle telemetry');
  context.assert(plan.productionBundle.diagnosticsRequired === true, 'RMT production bundle requires diagnostics');
  context.assert(plan.productionBundle.artifactParityRequired === true, 'RMT production bundle requires artifact parity');

  context.assert(firstClassFixture.manifest.metadata.contractVersion === 'xtend.rmt.first-class-app-authoring.v1', 'First-class app fixture declares authoring schema');
  context.assert(firstClassFixture.manifest.metadata.renderMode === 'shell-first', 'First-class app fixture is shell-first');
  context.assert(hasAdapter(firstClassFixture, 'xtend.component'), 'First-class app fixture has XTend component adapter');
  context.assert(hasAdapter(firstClassFixture, 'xtend.xrouter'), 'First-class app fixture has XRouter adapter');
  context.assert(hasAdapter(firstClassFixture, 'rmt.state-scheduler-diagnostics'), 'First-class app fixture has scheduler diagnostics adapter');
  context.assert(Array.isArray(firstClassFixture.routes) && firstClassFixture.routes.length >= 3, 'First-class app fixture defines routes in RMT');
  context.assert(Array.isArray(firstClassFixture.templates) && firstClassFixture.templates.length >= 3, 'First-class app fixture defines templates in RMT');
  context.assert(Array.isArray(firstClassFixture.schedules) && firstClassFixture.schedules.length >= 8, 'First-class app fixture defines scheduler records');
  context.assert(collectFabricLanesFromComponents(firstClassFixture.components).includes('visible'), 'First-class app fixture exposes visible Fabric lane');
  context.assert(String(firstClassFixture.manifest.metadata.kernelBoundary).includes('XTend component execution'), 'First-class app fixture keeps XTend execution in host adapters');

  context.assert(demoFixture.manifest.metadata.contractVersion === 'xtend.epic10.rmt-first-demo-app.v1', 'RMT-first demo fixture declares demo schema');
  context.assert(demoFixture.manifest.metadata.renderMode === 'shell-first', 'RMT-first demo fixture is shell-first');
  context.assert(demoFixture.manifest.metadata.manualShellAllowed === false, 'RMT-first demo fixture forbids manual shell');
  context.assert(hasAdapter(demoFixture, 'xtend.component'), 'RMT-first demo fixture has XTend component adapter');
  context.assert(hasAdapter(demoFixture, 'xtend.xrouter'), 'RMT-first demo fixture has XRouter adapter');
  context.assert(hasAdapter(demoFixture, 'xtend.fabric-telemetry'), 'RMT-first demo fixture has Fabric telemetry adapter');
  context.assert(Array.isArray(demoFixture.routes) && demoFixture.routes.length >= 3, 'RMT-first demo fixture defines routes');
  context.assert(Array.isArray(demoFixture.templates) && demoFixture.templates.length >= 3, 'RMT-first demo fixture defines templates');
  context.assert(collectFabricLanesFromComponents(demoFixture.components).includes('diagnostics'), 'RMT-first demo fixture exposes diagnostics lane');
  context.assertIncludes(demoHost, 'data-rmt-document-src="xtendrmt/rmt-first-demo-app.rmt"', 'RMT-first demo host points to RMT document');
  context.assertIncludes(demoHost, 'window.XTendRmtFirstDemo.bootRmtFirstDemo()', 'RMT-first demo host boots RMT shell');
  context.assert(!/body\s*>\s*x-section|body\s*>\s*x-router/u.test(demoHost), 'RMT-first demo host does not ship a static XTend shell');
  context.assertIncludes(demoSmoke, 'rmt-first demo no static host shell', 'RMT-first demo smoke asserts no static host shell');
  context.assertIncludes(rmtCore, 'createRmtXtendComponentAdapter', 'RMT core ESM exposes XTend component adapter factory');
  context.assertIncludes(rmtRuntime, 'createRmtXtendComponentAdapter', 'RMT runtime ESM exposes XTend component adapter factory');
  context.assertIncludes(rmtBrowser, 'createRmtXtendComponentAdapter', 'RMT browser runtime exposes XTend component adapter factory');
  context.assert(!/from ['"].*components\//u.test(rmtCore), 'RMT core does not import XTend component implementations');

  context.assert(packageManifest.private === false, 'Package is public-ready for RMT production readiness');
  context.assert((packageManifest.exports['./catalog/epic13-rmt-production-readiness'] === './catalog/epic13-rmt-production-readiness.js' || (packageManifest.exports['./catalog/epic13-rmt-production-readiness'] && packageManifest.exports['./catalog/epic13-rmt-production-readiness'].default === './catalog/epic13-rmt-production-readiness.js')), 'Package exports RMT production readiness module');
  context.assert(packageManifest.scripts['test:epic13-rmt-production-readiness'] === 'node scripts/run_xtend_tests.js epic13-rmt-production-readiness', 'Package exposes RMT production readiness script');
  context.assert(packageManifest.xtend.releaseGates.includes(EPIC13_RMT_PRODUCTION_READINESS_PACKAGE_SCRIPT), 'Package release gates include RMT production readiness script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(EPIC13_RMT_PRODUCTION_READINESS_PACKAGE_SCRIPT), 'Release checklist metadata includes RMT production readiness script');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_RMT_PRODUCTION_READINESS_CONTRACT), 'Artifact checklist includes RMT production readiness contract');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_RMT_PRODUCTION_READINESS_REPORT_ARTIFACT), 'Artifact checklist includes RMT production readiness report artifact');
  context.assert(metadata && metadata.schema === EPIC13_RMT_PRODUCTION_READINESS_SCHEMA, 'Package metadata exposes RMT production readiness schema');
  context.assert(metadata && metadata.reportSchema === EPIC13_RMT_PRODUCTION_READINESS_REPORT_SCHEMA, 'Package metadata exposes RMT production readiness report schema');
  context.assert(metadata && metadata.workpackage === EPIC13_RMT_PRODUCTION_READINESS_WORKPACKAGE, 'Package metadata exposes WP-E13-09');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Package metadata exposes next workpackage');
  context.assert(metadata && metadata.nextDecision === NEXT_DECISION, 'Package metadata exposes next decision');
  context.assert(metadata && metadata.publishAllowed === false, 'Package metadata blocks RMT production readiness publish');
  [
    rc1Metadata,
    ownerMetadata,
    networkMetadata,
    packageLockMetadata,
    hydrationMetadata,
    prodCspMetadata,
    visualMetadata
  ].forEach((entry) => {
    context.assert(entry && entry.nextWorkpackage === NEXT_WORKPACKAGE, `${entry && entry.schema ? entry.schema : 'Epic 13 metadata'} hands off to ${NEXT_WORKPACKAGE}`);
    context.assert(entry && entry.nextDecision === NEXT_DECISION, `${entry && entry.schema ? entry.schema : 'Epic 13 metadata'} hands off to ${NEXT_DECISION}`);
  });
  context.assert(packageLockMetadata && packageLockMetadata.expectedExportCount === 123, 'Package export lock metadata includes RC1 gate matrix and kernel exports');
  context.assertIncludes(scaffoldConfig, 'epic13RmtProductionReadiness', 'Scaffold config exposes RMT production readiness metadata');
  context.assertIncludes(scaffoldConfig, EPIC13_RMT_PRODUCTION_READINESS_SCHEMA, 'Scaffold config declares RMT production readiness schema');
  context.assertIncludes(scaffoldConfig, EPIC13_RMT_PRODUCTION_READINESS_LOCAL_GATE, 'Scaffold config references RMT production readiness local gate');
  context.assertIncludes(scaffoldConfig, 'expectedExportCount: 123', 'Scaffold config updates package export count');
  context.assertIncludes(scaffoldConfig, `nextWorkpackage: "${NEXT_WORKPACKAGE}"`, 'Scaffold config advances Epic 13 handoff to WP-E13-11');
  context.assertIncludes(runner, "id: 'epic13-rmt-production-readiness'", 'Runner registers RMT production readiness suite');

  assertTextIncludesAll(context, steering, [
    EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
    '| `WP-E13-09` | P1 | completed | WS4 | RMT-first App Production Readiness Gate buendeln |',
    '| `WP-E13-10` | P1 | completed | WS4 | Docs-App RMT Parsedown Shell fuer PROD-nahe Erweiterungen haerten |',
    '| `WP-E13-11` | P1 | completed | WS5 | Trusted DOM, Parsedown und RMT HTML Boundary browsernah pruefen |',
    '| `WP-E13-12` | P1 | completed | WS6 | RC1 Migration Notes, SemVer-Entscheid und Changelog vorbereiten |',
    'Handoff nach WP-E13-09',
    NEXT_DECISION,
    'RMT-first PROD App Readiness ist als RC1-Schnitt gebuendelt'
  ], 'Epic 13 steering document');
  assertTextIncludesAll(context, contractDoc, [
    EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
    EPIC13_RMT_PRODUCTION_READINESS_LOCAL_GATE,
    'xtend.rmt.first-class-app-authoring.v1',
    'xtend.epic10.rmt-first-demo-app.v1',
    'xtend.rmt.artifact-parity.v1',
    'xtend.component.fabric-lane-ingestion.v2',
    'xtend.component.lifecycle-telemetry.v1',
    KERNEL_BOUNDARY,
    NEXT_WORKPACKAGE
  ], 'RMT production readiness contract doc');
  assertTextIncludesAll(context, workpackage, [
    'xtend.epic13.wp09.rmt-production-readiness.v1',
    'Status: `completed`',
    EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
    EPIC13_RMT_PRODUCTION_READINESS_LOCAL_GATE,
    'npm run test:rmt-compatibility',
    'npm run test:rmt-first-demo-app',
    'npm run test:rmt-artifact-parity',
    NEXT_WORKPACKAGE
  ], 'WP-E13-09 workpackage');
  assertTextIncludesAll(context, docs, [
    EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
    EPIC13_RMT_PRODUCTION_READINESS_LOCAL_GATE,
    'Shell-first',
    'Routing',
    'Fabric/Lane',
    'Lifecycle Telemetry',
    './rmt-first-xtend-apps.md',
    './rmt-first-demo-app.md',
    PUBLISH_BOUNDARY
  ], 'RMT production readiness docs');
  assertTextIncludesAll(context, firstClassDocs, [
    EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
    './rmt-production-readiness.md',
    'WP-E13-13'
  ], 'RMT-first XTend apps docs');
  assertTextIncludesAll(context, demoDocs, [
    EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
    './rmt-production-readiness.md',
    'shell-first'
  ], 'RMT-first demo docs');
  assertTextIncludesAll(context, dslDocs, [
    EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
    './rmt-production-readiness.md'
  ], 'XTendRMT DSL docs');
  assertTextIncludesAll(context, nativeDocs, [
    EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
    EPIC13_RMT_PRODUCTION_READINESS_LOCAL_GATE
  ], 'XTendRMT native authoring docs');
  assertTextIncludesAll(context, fabricDocs, [
    EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
    './rmt-production-readiness.md'
  ], 'Fabric RMT lane mapping docs');
  assertTextIncludesAll(context, visualDocs, [
    EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
    './rmt-production-readiness.md',
    NEXT_WORKPACKAGE
  ], 'Visual owner artifact docs');
  assertTextIncludesAll(context, rc1Docs, [
    EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
    './rmt-production-readiness.md',
    NEXT_WORKPACKAGE
  ], 'RC1 readiness docs');
  assertTextIncludesAll(context, ownerDocs, [
    EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
    'rmt-production-readiness',
    NEXT_WORKPACKAGE
  ], 'Release owner acceptance docs');
  assertTextIncludesAll(context, enterpriseAdoption, [
    EPIC13_RMT_PRODUCTION_READINESS_SCHEMA,
    './rmt-production-readiness.md',
    'RMT-first'
  ], 'Enterprise adoption docs');
  assertTextIncludesAll(context, registry, [
    EPIC13_RMT_PRODUCTION_READINESS_MODULE,
    EPIC13_RMT_PRODUCTION_READINESS_CONTRACT,
    EPIC13_RMT_PRODUCTION_READINESS_DOCS,
    EPIC13_RMT_PRODUCTION_READINESS_SUITE,
    EPIC13_RMT_PRODUCTION_READINESS_LOCAL_GATE
  ], 'Reference registry');
  assertTextIncludesAll(context, releaseChecklist, [
    EPIC13_RMT_PRODUCTION_READINESS_PACKAGE_SCRIPT,
    EPIC13_RMT_PRODUCTION_READINESS_CONTRACT,
    EPIC13_RMT_PRODUCTION_READINESS_REPORT_ARTIFACT,
    'RMT Production Readiness'
  ], 'Release checklist');
  assertTextIncludesAll(context, ciMatrix, [
    EPIC13_RMT_PRODUCTION_READINESS_LOCAL_GATE,
    'RMT Production Readiness'
  ], 'CI gate matrix');
  assertTextIncludesAll(context, packageExportContract, [
    './catalog/epic13-rmt-production-readiness',
    'expectedExportCount: `123`'
  ], 'Package export lock contract');
  context.assertIncludes(docsReadme, './rmt-production-readiness.md', 'Docs README links RMT production readiness');
  context.assertIncludes(docsMenu, 'rmt-production-readiness', 'Docs menu exposes RMT production readiness');
  context.assertIncludes(testsReadme, EPIC13_RMT_PRODUCTION_READINESS_LOCAL_GATE, 'Tests README documents RMT production readiness gate');
  context.assertIncludes(readme, 'xtend.epic13RmtProductionReadiness', 'Root README documents RMT production readiness metadata');
  context.assertIncludes(changelog, EPIC13_RMT_PRODUCTION_READINESS_SCHEMA, 'Changelog records RMT production readiness contract');

  return context.result({
    report: {
      schema: EPIC13_RMT_PRODUCTION_READINESS_REPORT_SCHEMA,
      sourceGateCount: report.sourceGateCount,
      coveredDomainCount: report.coveredDomainCount,
      evidenceRecordCount: report.evidenceRecordCount,
      artifactCount: report.artifactCount,
      publishAllowed: report.publishAllowed,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printEpic13RmtProductionReadinessReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 13 RMT Production Readiness erfolgreich.',
    failureTitle: 'Epic 13 RMT Production Readiness fehlgeschlagen:'
  });
}

module.exports = {
  printEpic13RmtProductionReadinessReport,
  runEpic13RmtProductionReadinessSuite
};
