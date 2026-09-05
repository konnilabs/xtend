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
  DOCS_RMT_DOCUMENT,
  DOCS_RMT_HOST,
  DOCS_RMT_PAGE_LOADER,
  DOCS_RMT_PILOT_SCHEMA,
  DOCS_RMT_RENDER_SCHEMA,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_CONTRACT,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_DOCS,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_LOCAL_GATE,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_MODULE,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_PACKAGE_SCRIPT,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_ARTIFACT,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_SCHEMA,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_STATUS,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_STEERING,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SUITE,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_TARGET,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_WORKPACKAGE,
  EPIC13_DOCS_RMT_PRODUCTION_HARDENING_WORKPACKAGE_DOC,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_DOCS_RMT_ARTIFACTS,
  REQUIRED_DOCS_RMT_GATES,
  REQUIRED_EXTENSION_SLOTS,
  TRUST_BOUNDARY,
  createEpic13DocsRmtProductionHardeningPlan,
  createEpic13DocsRmtProductionHardeningReport,
  validateEpic13DocsRmtProductionHardeningPlan
} = require('../../catalog/epic13-docs-rmt-production-hardening');

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

function indexById(records) {
  return new Map((Array.isArray(records) ? records : []).map((record) => [record.id, record]));
}

function runEpic13DocsRmtProductionHardeningSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic13-docs-rmt-production-hardening',
    label: 'Epic 13 Docs RMT Production Hardening'
  });
  const plan = createEpic13DocsRmtProductionHardeningPlan({ rootDir });
  const validation = validateEpic13DocsRmtProductionHardeningPlan(plan);
  const report = createEpic13DocsRmtProductionHardeningReport({ rootDir, plan });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.epic13DocsRmtProductionHardening;
  const releaseOwnerMetadata = packageManifest.xtend && packageManifest.xtend.epic13ReleaseOwnerAcceptance;
  const rmtReadinessMetadata = packageManifest.xtend && packageManifest.xtend.epic13RmtProductionReadiness;
  const rc1Metadata = packageManifest.xtend && packageManifest.xtend.epic13Rc1Readiness;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const rmtDocument = readJson(DOCS_RMT_DOCUMENT, rootDir);
  const indexPhp = readText(DOCS_RMT_HOST, rootDir);
  const pageLoader = readText(DOCS_RMT_PAGE_LOADER, rootDir);
  const shellRuntime = readText('docs/utils/docs-shell-runtime.mjs', rootDir);
  const parsedownSchedulingDocs = readText('docs/en/xtendrmt-parsedown-scheduling.md', rootDir);
  const steering = readText(EPIC13_DOCS_RMT_PRODUCTION_HARDENING_STEERING, rootDir);
  const contract = readText(EPIC13_DOCS_RMT_PRODUCTION_HARDENING_CONTRACT, rootDir);
  const workpackage = readText(EPIC13_DOCS_RMT_PRODUCTION_HARDENING_WORKPACKAGE_DOC, rootDir);
  const docs = readText(EPIC13_DOCS_RMT_PRODUCTION_HARDENING_DOCS, rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const releaseChecklist = readText('development/XTend-Release-Checklist-und-SemVer-Policy.md', rootDir);
  const ciMatrix = readText('development/XTend-CI-Gate-Matrix.md', rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const rootReadme = readText('README.md', rootDir);
  const changelog = readText('CHANGELOG.md', rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC13_DOCS_RMT_PRODUCTION_HARDENING_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SUITE, { rootDir, extension: '.js' });
  const loaderSyntax = syntaxCheckFile(DOCS_RMT_PAGE_LOADER, { rootDir, extension: '.js' });

  [
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_MODULE,
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SUITE,
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_STEERING,
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_CONTRACT,
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_WORKPACKAGE_DOC,
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_DOCS,
    DOCS_RMT_DOCUMENT,
    DOCS_RMT_HOST,
    DOCS_RMT_PAGE_LOADER
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_DOCS_RMT_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as required Docs RMT hardening artifact`);
  });

  context.assert(moduleSyntax.ok, `Docs RMT production hardening module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Docs RMT production hardening suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(loaderSyntax.ok, `Docs page loader syntax passes${loaderSyntax.ok ? '' : ` (${loaderSyntax.message})`}`);
  context.assert(plan.schema === EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA, 'Docs RMT hardening exposes stable schema');
  context.assert(plan.reportSchema === EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_SCHEMA, 'Docs RMT hardening exposes report schema');
  context.assert(plan.workpackage === EPIC13_DOCS_RMT_PRODUCTION_HARDENING_WORKPACKAGE, 'Docs RMT hardening belongs to WP-E13-10');
  context.assert(plan.status === EPIC13_DOCS_RMT_PRODUCTION_HARDENING_STATUS, 'Docs RMT hardening is accepted');
  context.assert(plan.targetReadiness === EPIC13_DOCS_RMT_PRODUCTION_HARDENING_TARGET, 'Docs RMT hardening target is PROD-like shell readiness');
  context.assert(plan.sourceSchema === 'xtend.epic13.rmt-production-readiness.v1', 'Docs RMT hardening consumes RMT production readiness');
  context.assert(plan.sourceValidationOk === true && plan.sourceReportOk === true, 'Docs RMT hardening source validates');
  context.assert(plan.docsPilotSchema === DOCS_RMT_PILOT_SCHEMA, 'Docs RMT hardening keeps pilot schema compatibility');
  context.assert(plan.docsRenderSchema === DOCS_RMT_RENDER_SCHEMA, 'Docs RMT hardening keeps render metadata compatibility');
  context.assert(plan.rmtDocument === DOCS_RMT_DOCUMENT, 'Docs RMT hardening references the RMT document');
  context.assert(plan.activeHost === DOCS_RMT_HOST, 'Docs RMT hardening references docs host');
  context.assert(plan.pageLoader === DOCS_RMT_PAGE_LOADER, 'Docs RMT hardening references page loader');
  assertIncludesAll(context, plan.requiredGates, REQUIRED_DOCS_RMT_GATES, 'Docs RMT hardening required gates');
  assertIncludesAll(context, plan.artifactPaths, REQUIRED_DOCS_RMT_ARTIFACTS, 'Docs RMT hardening artifact paths');
  REQUIRED_EXTENSION_SLOTS.forEach((slot) => {
    const actual = plan.extensionSlots.find((entry) => entry.id === slot.id);
    context.assert(Boolean(actual), `Docs RMT hardening exposes slot ${slot.id}`);
    context.assert(actual && actual.schedule === slot.schedule, `Docs RMT hardening slot ${slot.id} uses schedule ${slot.schedule}`);
    context.assert(actual && actual.endpoint === slot.endpoint, `Docs RMT hardening slot ${slot.id} uses endpoint ${slot.endpoint}`);
  });
  context.assert(plan.productionHardening.shellFirst === true, 'Docs RMT hardening keeps shell-first rendering');
  context.assert(plan.productionHardening.parsedownOrchestrated === true, 'Docs RMT hardening keeps Parsedown orchestrated');
  context.assert(plan.productionHardening.parsedownEmbeddedInRmtKernel === false, 'Docs RMT hardening keeps Parsedown out of RMT kernel');
  context.assert(plan.productionHardening.richHtmlSchedulable === true, 'Docs RMT hardening makes Rich HTML schedulable');
  context.assert(plan.productionHardening.xplayerTutorialSchedulable === true, 'Docs RMT hardening makes XPlayer tutorial payloads schedulable');
  context.assert(plan.productionHardening.diagnosticsSnapshotRequired === true, 'Docs RMT hardening requires diagnostics snapshot');
  context.assert(plan.trustBoundary === TRUST_BOUNDARY, 'Docs RMT hardening keeps Trusted DOM boundary');
  context.assert(plan.rmtKernelImportsParsedown === false && plan.rmtKernelImportsPhp === false && plan.rmtKernelImportsXtendTypes === false, 'Docs RMT hardening keeps kernel dependency-free');
  context.assert(plan.nextWorkpackage === NEXT_WORKPACKAGE, 'Docs RMT hardening makes WP-E13-11 ready');
  context.assert(plan.nextDecision === NEXT_DECISION, 'Docs RMT hardening hands off to Trusted DOM browser proof');
  context.assert(validation.schema === EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_SCHEMA, 'Docs RMT hardening validator emits report schema');
  context.assert(validation.ok === true, 'Docs RMT hardening plan validates');
  context.assert(report.ok === true, 'Docs RMT hardening report validates');
  context.assert(report.extensionSlotCount === REQUIRED_EXTENSION_SLOTS.length, 'Docs RMT hardening report counts extension slots');
  context.assert(report.publishAllowed === false, 'Docs RMT hardening report blocks publish');

  const metadataRecord = rmtDocument.manifest && rmtDocument.manifest.metadata;
  const hardening = metadataRecord && metadataRecord.productionHardening;
  const schedules = indexById(rmtDocument.schedules);
  const templates = indexById(rmtDocument.templates);
  const extensionSlots = indexById(rmtDocument.extensionSlots);
  const shellTemplate = templates.get('docs.app.shell');
  const shellText = JSON.stringify(shellTemplate);
  context.assert(metadataRecord && metadataRecord.contractVersion === DOCS_RMT_PILOT_SCHEMA, 'Docs RMT document remains pilot-compatible');
  context.assert(hardening && hardening.schema === EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA, 'Docs RMT document declares production hardening schema');
  context.assert(hardening && hardening.workpackage === EPIC13_DOCS_RMT_PRODUCTION_HARDENING_WORKPACKAGE, 'Docs RMT document declares WP-E13-10 ownership');
  context.assert(hardening && hardening.status === EPIC13_DOCS_RMT_PRODUCTION_HARDENING_STATUS, 'Docs RMT document declares hardening status');
  context.assert(hardening && hardening.parsedownEmbeddedInRmtKernel === false, 'Docs RMT document keeps Parsedown outside kernel');
  context.assert(hardening && hardening.diagnosticsSchedule === 'docs.diagnostics.snapshot', 'Docs RMT document declares diagnostics schedule');
  context.assert(hardening && hardening.nextWorkpackage === NEXT_WORKPACKAGE, 'Docs RMT document hands off to WP-E13-11');
  context.assert(schedules.get('docs.rich-content.prepare') && schedules.get('docs.rich-content.prepare').preferIdle === true, 'Docs RMT document keeps Rich HTML preparation idle');
  context.assert(schedules.get('docs.media.lazy') && schedules.get('docs.media.lazy').preferIdle === true, 'Docs RMT document keeps media lazy');
  context.assert(schedules.get('docs.diagnostics.snapshot') && schedules.get('docs.diagnostics.snapshot').lane === 'diagnostics', 'Docs RMT document keeps diagnostics lane');
  REQUIRED_EXTENSION_SLOTS.forEach((slot) => {
    const actual = extensionSlots.get(slot.id);
    context.assert(Boolean(actual), `Docs RMT document declares extension slot ${slot.id}`);
    context.assert(actual && actual.schedule === slot.schedule, `Docs RMT document slot ${slot.id} uses schedule ${slot.schedule}`);
  });
  context.assert(shellText.includes('data-rmt-extension-slot'), 'Docs shell template marks extension slots');
  context.assert(shellText.includes('docs.slot.rich-content'), 'Docs shell template exposes rich-content slot');
  context.assert(shellText.includes('docs.slot.diagnostics'), 'Docs shell template exposes diagnostics slot');
  context.assert(shellText.includes(EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA), 'Docs shell template marks production hardening schema');

  assertTextIncludesAll(context, indexPhp, [
    'window.xtendDocsRmtProductionHardening',
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA,
    "workpackage: 'WP-E13-10'",
    "parsedownEmbeddedInRmtKernel: false",
    "diagnosticsSchedule: 'docs.diagnostics.snapshot'",
    "extensionSlots: ['docs.slot.content', 'docs.slot.sidebar', 'docs.slot.related', 'docs.slot.component-demo', 'docs.slot.rich-content', 'docs.slot.media', 'docs.slot.diagnostics']",
    '$Parsedown->setSafeMode(true);',
    "diagnostics' => 'docs.diagnostics.snapshot'",
    '/components/prism-rmt.js'
  ], 'Docs PHP host');
  assertTextIncludesAll(context, shellRuntime, [
    'schedulePrismHighlight',
    'XTendRmtPrism.register',
    'Prism.highlightAllUnder'
  ], 'Docs AppRuntime shell');
  assertTextIncludesAll(context, pageLoader, [
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA,
    'getDocsRmtProductionHardening',
    'data-rmt-extension-slot',
    'docs.slot.diagnostics',
    'xtendDocsRmtProductionLastRender',
    'parsedownEmbeddedInRmtKernel: false',
    'diagnosticsSlotAvailable',
    'DOCS_RMT_EXTENSION_SLOTS',
    'upgradeDocsParsedownCodeFences',
    'data-docs-code-fence-upgraded',
    'docs.syntax.highlight',
    "createDemoCodeBlock('RMT', 'rmt'"
  ], 'Docs page loader');
  assertTextIncludesAll(context, parsedownSchedulingDocs, [
    'docs/xtendrmt-docs-shell-vnext.rmt',
    'docs/utils/docs-shell-runtime.mjs',
    'docs/utils/trusted-dom-host.mjs',
    'window.__XTEND_DEV_API__'
  ], 'Parsedown scheduling docs');

  context.assert(packageManifest.private === false, 'Package is public-ready for Docs RMT hardening');
  context.assert((packageManifest.exports['./catalog/epic13-docs-rmt-production-hardening'] === './catalog/epic13-docs-rmt-production-hardening.js' || (packageManifest.exports['./catalog/epic13-docs-rmt-production-hardening'] && packageManifest.exports['./catalog/epic13-docs-rmt-production-hardening'].default === './catalog/epic13-docs-rmt-production-hardening.js')), 'Package exports Docs RMT hardening module');
  context.assert(packageManifest.scripts['test:epic13-docs-rmt-production-hardening'] === 'node scripts/run_xtend_tests.js epic13-docs-rmt-production-hardening', 'Package exposes Docs RMT hardening script');
  context.assert(!packageManifest.xtend.releaseGates.includes(EPIC13_DOCS_RMT_PRODUCTION_HARDENING_PACKAGE_SCRIPT), 'Legacy Docs RMT hardening gate stays outside default release gates');
  context.assert(!packageManifest.xtend.releaseChecklist.candidateGates.includes(EPIC13_DOCS_RMT_PRODUCTION_HARDENING_PACKAGE_SCRIPT), 'Legacy Docs RMT hardening gate stays outside candidate gates');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_DOCS_RMT_PRODUCTION_HARDENING_CONTRACT), 'Artifact checklist includes Docs RMT hardening contract');
  context.assert(packageManifest.xtend.releaseChecklist.artifactChecklist.includes(EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_ARTIFACT), 'Artifact checklist includes Docs RMT hardening report');
  context.assert(metadata && metadata.schema === EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA, 'Package metadata exposes Docs RMT hardening schema');
  context.assert(metadata && metadata.workpackage === EPIC13_DOCS_RMT_PRODUCTION_HARDENING_WORKPACKAGE, 'Package metadata exposes WP-E13-10');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Package metadata exposes next workpackage');
  context.assert(metadata && metadata.requiredGates.includes('npm run test:docs-rmt-pilot'), 'Package metadata keeps Docs RMT pilot gate');
  context.assert(releaseOwnerMetadata && releaseOwnerMetadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Owner acceptance metadata now hands off to WP-E13-11');
  context.assert(rmtReadinessMetadata && rmtReadinessMetadata.nextWorkpackage === NEXT_WORKPACKAGE, 'RMT readiness metadata now hands off to WP-E13-11');
  context.assert(rc1Metadata && rc1Metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'RC1 readiness metadata now hands off to WP-E13-11');
  context.assertIncludes(scaffoldConfig, 'epic13DocsRmtProductionHardening', 'Scaffold config exposes Docs RMT hardening metadata');
  context.assertIncludes(scaffoldConfig, EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA, 'Scaffold config declares Docs RMT hardening schema');
  context.assertIncludes(scaffoldConfig, EPIC13_DOCS_RMT_PRODUCTION_HARDENING_LOCAL_GATE, 'Scaffold config references Docs RMT hardening gate');
  context.assertIncludes(scaffoldConfig, `nextWorkpackage: "${NEXT_WORKPACKAGE}"`, 'Scaffold config advances Epic 13 handoff to WP-E13-11');
  context.assert(runner.hasSuite("epic13-docs-rmt-production-hardening"), 'Runner registers Docs RMT hardening suite');

  assertTextIncludesAll(context, steering, [
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA,
    '| `WP-E13-10` | P1 | completed | WS4 | Docs-App RMT Parsedown Shell fuer PROD-nahe Erweiterungen haerten |',
    '| `WP-E13-11` | P1 | completed | WS5 | Trusted DOM, Parsedown und RMT HTML Boundary browsernah pruefen |',
    '| `WP-E13-12` | P1 | completed | WS6 | RC1 Migration Notes, SemVer-Entscheid und Changelog vorbereiten |',
    'Handoff nach WP-E13-10',
    NEXT_DECISION
  ], 'Epic 13 steering');
  assertTextIncludesAll(context, contract, [
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA,
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_LOCAL_GATE,
    'Parsedown bleibt orchestrierte Komponente',
    'Rich HTML',
    'XPlayer',
    'WP-E13-13'
  ], 'Docs RMT hardening contract');
  assertTextIncludesAll(context, workpackage, [
    'xtend.epic13.wp10.docs-rmt-production-hardening.v1',
    'Status: `completed`',
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA,
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_LOCAL_GATE,
    'WP-E13-13'
  ], 'WP-E13-10 workpackage');
  assertTextIncludesAll(context, docs, [
    'Coordinate Parsedown with RMT',
    'createRmtTemplateRuntimeRenderer()',
    'XTendSkeletonLoader.registerProfile()',
    'node scripts/run_xtend_tests.js docs-rmt-pilot docs-shell-catfooding'
  ], 'Docs RMT hardening docs');
  assertTextIncludesAll(context, registry, [
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_MODULE,
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_CONTRACT,
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_DOCS,
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SUITE,
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_LOCAL_GATE
  ], 'Reference registry');
  assertTextIncludesAll(context, releaseChecklist, [
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_PACKAGE_SCRIPT,
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_CONTRACT,
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_ARTIFACT
  ], 'Release checklist');
  assertTextIncludesAll(context, ciMatrix, [
    EPIC13_DOCS_RMT_PRODUCTION_HARDENING_LOCAL_GATE,
    'Docs RMT Production Hardening'
  ], 'CI gate matrix');
  context.assertIncludes(docsReadme, './xtendrmt-parsedown-scheduling.md', 'Docs README links the Parsedown and RMT ownership guide');
  context.assertIncludes(docsMenu, 'xtendrmt-parsedown-scheduling', 'Docs menu exposes the Parsedown and RMT ownership guide');
  context.assertIncludes(testsReadme, EPIC13_DOCS_RMT_PRODUCTION_HARDENING_LOCAL_GATE, 'Tests README documents Docs RMT hardening gate');
  context.assertIncludes(rootReadme, 'docs/en/xtendrmt-parsedown-scheduling.md', 'Root README links the user-facing Parsedown and RMT guide');
  context.assertIncludes(changelog, EPIC13_DOCS_RMT_PRODUCTION_HARDENING_SCHEMA, 'Changelog records Docs RMT hardening schema');

  return context.result({
    report: {
      schema: EPIC13_DOCS_RMT_PRODUCTION_HARDENING_REPORT_SCHEMA,
      extensionSlotCount: report.extensionSlotCount,
      requiredGateCount: report.requiredGateCount,
      publishAllowed: report.publishAllowed,
      nextWorkpackage: report.nextWorkpackage
    }
  });
}

function printEpic13DocsRmtProductionHardeningReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 13 Docs RMT Production Hardening erfolgreich.',
    failureTitle: 'Epic 13 Docs RMT Production Hardening fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runEpic13DocsRmtProductionHardeningSuite();
  printEpic13DocsRmtProductionHardeningReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  printEpic13DocsRmtProductionHardeningReport,
  runEpic13DocsRmtProductionHardeningSuite
};
