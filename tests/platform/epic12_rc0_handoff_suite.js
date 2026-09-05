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
  COMPLETED_WORKPACKAGES,
  EPIC12_RC0_HANDOFF_CONTRACT,
  EPIC12_RC0_HANDOFF_DOCS,
  EPIC12_RC0_HANDOFF_LOCAL_GATE,
  EPIC12_RC0_HANDOFF_MODULE,
  EPIC12_RC0_HANDOFF_PACKAGE_SCRIPT,
  EPIC12_RC0_HANDOFF_REPORT_SCHEMA,
  EPIC12_RC0_HANDOFF_SCHEMA,
  EPIC12_RC0_HANDOFF_STATUS,
  EPIC12_RC0_HANDOFF_SUITE,
  EPIC12_RC0_HANDOFF_WORKPACKAGE,
  EPIC12_RC0_HANDOFF_WORKPACKAGE_DOC,
  KERNEL_BOUNDARY,
  OWNER_REVIEW_INPUTS,
  PUBLISH_BOUNDARY,
  REQUIRED_DOCS,
  REQUIRED_GATES,
  createEpic12Rc0HandoffPlan,
  createEpic12Rc0HandoffReport,
  validateEpic12Rc0HandoffPlan
} = require('../../catalog/epic12-rc0-handoff');

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

function runEpic12Rc0HandoffSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic12-rc0-handoff',
    label: 'Epic 12 RC0 Handoff'
  });
  const plan = createEpic12Rc0HandoffPlan({ rootDir });
  const validation = validateEpic12Rc0HandoffPlan(plan);
  const report = createEpic12Rc0HandoffReport({ rootDir, plan });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const manifest = readJson('components/manifest.json', rootDir);
  const expectedManifestCount = Object.keys(manifest).length;
  const metadata = packageManifest.xtend && packageManifest.xtend.epic12Rc0Handoff;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const backlog = readText('development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md', rootDir);
  const rcModel = readText('development/XTend-Epic12-RC-Hardening-Modell.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const releaseChecklist = readText('development/XTend-Release-Checklist-und-SemVer-Policy.md', rootDir);
  const ciMatrix = readText('development/XTend-CI-Gate-Matrix.md', rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const enterpriseAdoption = readText('docs/enterprise-adoption.md', rootDir);
  const contract = readText(EPIC12_RC0_HANDOFF_CONTRACT, rootDir);
  const workpackage = readText(EPIC12_RC0_HANDOFF_WORKPACKAGE_DOC, rootDir);
  const docs = readText(EPIC12_RC0_HANDOFF_DOCS, rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC12_RC0_HANDOFF_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC12_RC0_HANDOFF_SUITE, { rootDir, extension: '.js' });

  [
    EPIC12_RC0_HANDOFF_MODULE,
    EPIC12_RC0_HANDOFF_SUITE,
    EPIC12_RC0_HANDOFF_CONTRACT,
    EPIC12_RC0_HANDOFF_WORKPACKAGE_DOC,
    EPIC12_RC0_HANDOFF_DOCS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as required handoff doc`);
  });

  context.assert(moduleSyntax.ok, `Epic 12 RC0 Handoff module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Epic 12 RC0 Handoff suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === EPIC12_RC0_HANDOFF_SCHEMA, 'RC0 Handoff exposes stable schema');
  context.assert(plan.reportSchema === EPIC12_RC0_HANDOFF_REPORT_SCHEMA, 'RC0 Handoff exposes report schema');
  context.assert(plan.workpackage === EPIC12_RC0_HANDOFF_WORKPACKAGE, 'RC0 Handoff belongs to WP-E12-16');
  context.assert(plan.status === EPIC12_RC0_HANDOFF_STATUS, 'RC0 Handoff is accepted');
  context.assert(plan.releaseCandidate === 'RC0', 'RC0 Handoff targets RC0');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'RC0 Handoff keeps RMT kernel boundary');
  context.assert(plan.publishBoundary === PUBLISH_BOUNDARY, 'RC0 Handoff keeps publish boundary');
  context.assert(plan.publishAllowed === false, 'RC0 Handoff blocks publish');
  context.assert(plan.packagePrivateRequired === true, 'RC0 Handoff requires private package');
  context.assert(validation.schema === EPIC12_RC0_HANDOFF_REPORT_SCHEMA, 'RC0 Handoff validator emits report schema');
  context.assert(validation.ok === true, 'RC0 Handoff validates');
  context.assert(report.ok === true, 'RC0 Handoff report validates');
  context.assert(report.completedWorkpackageCount === 16, 'RC0 Handoff report counts all 16 Epic 12 workpackages');
  context.assert(report.docsCount === REQUIRED_DOCS.length, 'RC0 Handoff report counts required docs');
  context.assert(report.gateCount === REQUIRED_GATES.length, 'RC0 Handoff report counts required gates');
  context.assert(report.kpiSummary.failed === 0, 'RC0 Handoff has no failed KPI decisions');
  context.assert(report.kpiSummary.ownerReviewRequired === 1, 'RC0 Handoff keeps one owner-review decision for network gates');
  context.assert(report.publishAllowed === false, 'RC0 Handoff report blocks publish');
  context.assert(report.ownerAcceptanceRequired === true, 'RC0 Handoff report requires owner acceptance');
  context.assert(report.nextDecision === 'release-owner-acceptance', 'RC0 Handoff next decision is release owner acceptance');
  assertIncludesAll(context, plan.epicCompletion.completedWorkpackages, COMPLETED_WORKPACKAGES, 'Completed Epic 12 workpackages');
  assertIncludesAll(context, plan.docsSurface.requiredDocs, REQUIRED_DOCS, 'Required docs');
  assertIncludesAll(context, plan.releaseReadiness.requiredGates, REQUIRED_GATES, 'Required gates');
  assertIncludesAll(context, plan.releaseReadiness.ownerReviewInputs, OWNER_REVIEW_INPUTS, 'Owner review inputs');
  assertIncludesAll(context, plan.sourceSchemas, [
    'xtend.catalog.component-coverage-matrix.v1',
    'xtend.epic11.legacy-long-tail-migration.v1',
    'xtend.epic12.visual-snapshot-runner-report.v1',
    'xtend.design-tokens.product-contract.v1',
    'xtend.rmt.dsl-authoring-polish.v1',
    'xtend.epic12.rc0-gate-matrix.v1',
    'xtend.epic12.docs-adoption.v1'
  ], 'Source schemas');
  context.assert(plan.sourceSnapshots.manifestEntries === expectedManifestCount, `RC0 Handoff captures ${expectedManifestCount} manifest entries`);
  context.assert(plan.sourceSnapshots.sourceCoveragePercent === 100, 'RC0 Handoff captures source coverage');
  context.assert(plan.sourceSnapshots.docsCoveragePercent === 100, 'RC0 Handoff captures docs coverage');
  context.assert(plan.sourceSnapshots.componentSuiteCoveragePercent === 100, 'RC0 Handoff captures component suite coverage');
  context.assert(plan.sourceSnapshots.fixtureCoveragePercent === 100, 'RC0 Handoff captures fixture coverage');
  context.assert(plan.sourceSnapshots.typesCoveragePercent === 100, 'RC0 Handoff captures types coverage');
  context.assert(plan.sourceSnapshots.visualSnapshotDomDiffCount === 0, 'RC0 Handoff captures clean DOM snapshot diff');
  context.assert(plan.sourceSnapshots.designTokenCount >= 30, 'RC0 Handoff captures Design Token count');
  context.assert(plan.sourceSnapshots.rmtDslAliasCount >= 15, 'RC0 Handoff captures RMT DSL alias count');
  context.assert(plan.sourceSnapshots.rc0AcceptedResidualCount === 3, 'RC0 Handoff captures three accepted residuals');
  context.assert(plan.knownResidualPolicy.blockers.length === 0, 'RC0 Handoff has no known residual blockers');
  context.assert(plan.nextDecision === 'release-owner-acceptance', 'RC0 Handoff stops at release owner acceptance');

  context.assert(packageManifest.private === false, 'Package is public-ready after RC1 owner publish prep');
  context.assert((packageManifest.exports['./catalog/epic12-rc0-handoff'] === './catalog/epic12-rc0-handoff.js' || (packageManifest.exports['./catalog/epic12-rc0-handoff'] && packageManifest.exports['./catalog/epic12-rc0-handoff'].default === './catalog/epic12-rc0-handoff.js')), 'Package exports Epic 12 RC0 Handoff module');
  context.assert(packageManifest.scripts['test:epic12-rc0-handoff'] === 'node scripts/run_xtend_tests.js epic12-rc0-handoff', 'Package exposes Epic 12 RC0 Handoff test script');
  context.assert(packageManifest.xtend.releaseGates.includes(EPIC12_RC0_HANDOFF_PACKAGE_SCRIPT), 'Package release gates include RC0 Handoff script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(EPIC12_RC0_HANDOFF_PACKAGE_SCRIPT), 'Release checklist metadata includes RC0 Handoff script');
  context.assert(metadata && metadata.schema === EPIC12_RC0_HANDOFF_SCHEMA, 'Package metadata exposes RC0 Handoff schema');
  context.assert(metadata && metadata.workpackage === EPIC12_RC0_HANDOFF_WORKPACKAGE, 'Package metadata exposes WP-E12-16');
  context.assert(metadata && metadata.module === EPIC12_RC0_HANDOFF_MODULE, 'Package metadata exposes RC0 Handoff module');
  context.assert(metadata && metadata.localGate === EPIC12_RC0_HANDOFF_LOCAL_GATE, 'Package metadata exposes RC0 Handoff local gate');
  context.assert(metadata && metadata.packageScript === EPIC12_RC0_HANDOFF_PACKAGE_SCRIPT, 'Package metadata exposes RC0 Handoff package script');
  context.assert(metadata && metadata.publishAllowed === false, 'Package metadata blocks RC0 Handoff publish');
  context.assert(metadata && metadata.nextDecision === 'release-owner-acceptance', 'Package metadata exposes next decision');
  context.assert(Array.isArray(metadata && metadata.requiredDocs) && metadata.requiredDocs.includes(EPIC12_RC0_HANDOFF_DOCS), 'Package metadata exposes RC0 Handoff docs');
  context.assertIncludes(scaffoldConfig, 'epic12Rc0Handoff', 'Scaffold config exposes Epic 12 RC0 Handoff metadata');
  context.assertIncludes(scaffoldConfig, EPIC12_RC0_HANDOFF_SCHEMA, 'Scaffold config declares RC0 Handoff schema');
  context.assertIncludes(scaffoldConfig, EPIC12_RC0_HANDOFF_LOCAL_GATE, 'Scaffold config references RC0 Handoff local gate');
  context.assert(runner.hasSuite("epic12-rc0-handoff"), 'Runner registers Epic 12 RC0 Handoff suite');

  assertTextIncludesAll(context, contract, [
    EPIC12_RC0_HANDOFF_SCHEMA,
    EPIC12_RC0_HANDOFF_LOCAL_GATE,
    'KPI-Abnahme',
    'Long-Tail-Status',
    'Snapshot-Status',
    'RC0 Gate Matrix',
    'Known Residual Policy',
    PUBLISH_BOUNDARY,
    'release-owner-acceptance'
  ], 'RC0 Handoff contract');
  assertTextIncludesAll(context, workpackage, [
    'xtend.epic12.wp16.rc0-handoff.v1',
    'Status: `completed`',
    EPIC12_RC0_HANDOFF_SCHEMA,
    EPIC12_RC0_HANDOFF_LOCAL_GATE,
    'Epic 12 abgeschlossen'
  ], 'WP-E12-16 workpackage');
  assertTextIncludesAll(context, docs, [
    EPIC12_RC0_HANDOFF_SCHEMA,
    'ready-for-release-owner-review-not-publish',
    'Long-Tail',
    'Visual Snapshot',
    'Design Tokens',
    'RMT DSL',
    'Conditional Network Gates',
    PUBLISH_BOUNDARY
  ], 'RC0 Handoff docs');
  assertTextIncludesAll(context, backlog, [
    '- Status: Completed',
    '| `WP-E12-16` | P2 | completed | WS10 | Epic-12-Abschlussreview und RC0-Handoff |',
    'Handoff nach WP-E12-16',
    EPIC12_RC0_HANDOFF_SCHEMA
  ], 'Epic 12 backlog');
  assertTextIncludesAll(context, rcModel, [
    EPIC12_RC0_HANDOFF_SCHEMA,
    'Epic 12 ist abgeschlossen',
    'ready-for-release-owner-review-not-publish'
  ], 'RC Hardening model');
  context.assertIncludes(ciMatrix, EPIC12_RC0_HANDOFF_LOCAL_GATE, 'CI matrix documents RC0 Handoff gate');
  context.assertIncludes(releaseChecklist, EPIC12_RC0_HANDOFF_PACKAGE_SCRIPT, 'Release checklist documents RC0 Handoff script');
  context.assertIncludes(docsReadme, './epic12-rc0-handoff.md', 'Docs README links Epic 12 RC0 Handoff');
  context.assertIncludes(docsMenu, 'epic12-rc0-handoff', 'Docs menu exposes Epic 12 RC0 Handoff');
  context.assertIncludes(enterpriseAdoption, 'Epic 12 RC0 Handoff', 'Enterprise Adoption documents Epic 12 RC0 Handoff');
  assertTextIncludesAll(context, registry, [
    EPIC12_RC0_HANDOFF_MODULE,
    EPIC12_RC0_HANDOFF_CONTRACT,
    EPIC12_RC0_HANDOFF_DOCS,
    EPIC12_RC0_HANDOFF_SUITE,
    EPIC12_RC0_HANDOFF_LOCAL_GATE
  ], 'Reference registry');

  return context.result({
    report: {
      schema: EPIC12_RC0_HANDOFF_REPORT_SCHEMA,
      docsCount: report.docsCount,
      gateCount: report.gateCount,
      completedWorkpackageCount: report.completedWorkpackageCount,
      kpiSummary: report.kpiSummary,
      sourceSnapshots: report.sourceSnapshots,
      publishAllowed: report.publishAllowed,
      ownerAcceptanceRequired: report.ownerAcceptanceRequired,
      nextDecision: report.nextDecision
    }
  });
}

function printEpic12Rc0HandoffReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 12 RC0 Handoff erfolgreich.',
    failureTitle: 'Epic 12 RC0 Handoff fehlgeschlagen:'
  });
}

module.exports = {
  printEpic12Rc0HandoffReport,
  runEpic12Rc0HandoffSuite
};
