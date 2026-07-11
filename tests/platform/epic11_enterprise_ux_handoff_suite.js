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
  EPIC11_ENTERPRISE_UX_HANDOFF_CONTRACT,
  EPIC11_ENTERPRISE_UX_HANDOFF_DOCS,
  EPIC11_ENTERPRISE_UX_HANDOFF_LOCAL_GATE,
  EPIC11_ENTERPRISE_UX_HANDOFF_MODULE,
  EPIC11_ENTERPRISE_UX_HANDOFF_PACKAGE_SCRIPT,
  EPIC11_ENTERPRISE_UX_HANDOFF_REPORT_SCHEMA,
  EPIC11_ENTERPRISE_UX_HANDOFF_SCHEMA,
  EPIC11_ENTERPRISE_UX_HANDOFF_STATUS,
  EPIC11_ENTERPRISE_UX_HANDOFF_SUITE,
  EPIC11_ENTERPRISE_UX_HANDOFF_WORKPACKAGE,
  EPIC11_ENTERPRISE_UX_HANDOFF_WORKPACKAGE_DOC,
  KERNEL_BOUNDARY,
  REQUIRED_DOCS,
  REQUIRED_GATES,
  createEpic11EnterpriseUxHandoffPlan,
  createEpic11EnterpriseUxHandoffReport,
  validateEpic11EnterpriseUxHandoffPlan
} = require('../../catalog/epic11-enterprise-ux-handoff');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function runEpic11EnterpriseUxHandoffSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic11-enterprise-ux-handoff',
    label: 'Epic 11 Enterprise UX Handoff'
  });
  const plan = createEpic11EnterpriseUxHandoffPlan({ rootDir });
  const validation = validateEpic11EnterpriseUxHandoffPlan(plan);
  const report = createEpic11EnterpriseUxHandoffReport({ rootDir, plan });
  const packageManifest = readJson('package.json', rootDir);
  const manifest = readJson('components/manifest.json', rootDir);
  const expectedManifestCount = Object.keys(manifest).length;
  const metadata = packageManifest.xtend && packageManifest.xtend.epic11EnterpriseUxHandoff;
  const epic = readText('development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const componentUxGates = readText('development/docs-evidence/root/component-ux-gates.md', rootDir);
  const enterpriseDocs = readText('docs/enterprise-adoption.md', rootDir);
  const platformDocs = readText('development/docs-evidence/root/component-platform.md', rootDir);
  const handoffDocs = readText(EPIC11_ENTERPRISE_UX_HANDOFF_DOCS, rootDir);
  const contract = readText(EPIC11_ENTERPRISE_UX_HANDOFF_CONTRACT, rootDir);
  const workpackage = readText(EPIC11_ENTERPRISE_UX_HANDOFF_WORKPACKAGE_DOC, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC11_ENTERPRISE_UX_HANDOFF_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC11_ENTERPRISE_UX_HANDOFF_SUITE, { rootDir, extension: '.js' });

  [
    EPIC11_ENTERPRISE_UX_HANDOFF_MODULE,
    EPIC11_ENTERPRISE_UX_HANDOFF_SUITE,
    EPIC11_ENTERPRISE_UX_HANDOFF_CONTRACT,
    EPIC11_ENTERPRISE_UX_HANDOFF_WORKPACKAGE_DOC,
    EPIC11_ENTERPRISE_UX_HANDOFF_DOCS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `Epic 11 Enterprise UX Handoff module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Epic 11 Enterprise UX Handoff suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === EPIC11_ENTERPRISE_UX_HANDOFF_SCHEMA, 'Handoff plan exposes stable schema');
  context.assert(plan.reportSchema === EPIC11_ENTERPRISE_UX_HANDOFF_REPORT_SCHEMA, 'Handoff plan exposes report schema');
  context.assert(plan.workpackage === EPIC11_ENTERPRISE_UX_HANDOFF_WORKPACKAGE, 'Handoff plan belongs to WP-E11-18');
  context.assert(plan.status === EPIC11_ENTERPRISE_UX_HANDOFF_STATUS, 'Handoff plan is accepted');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'Handoff keeps RMT kernel boundary');
  context.assert(validation.schema === EPIC11_ENTERPRISE_UX_HANDOFF_REPORT_SCHEMA, 'Handoff validator emits report schema');
  context.assert(validation.ok === true, 'Handoff plan validates');
  context.assert(report.ok === true, 'Handoff report passes');
  context.assert(report.docsCount === REQUIRED_DOCS.length, 'Handoff report counts required docs');
  context.assert(report.completedWorkpackageCount === 18, 'Handoff report counts all 18 workpackages');
  context.assert(report.catalogSnapshot.manifestEntries === expectedManifestCount, `Handoff report captures ${expectedManifestCount} manifest entries`);
  context.assert(report.catalogSnapshot.enterpriseReady === 42, 'Handoff report captures enterprise-ready count after SurfaceManager primitive closure');
  context.assert(report.catalogSnapshot.componentSuiteCoveragePercent >= 85, 'Handoff keeps component suite threshold');
  context.assert(report.catalogSnapshot.fixtureCoveragePercent >= 85, 'Handoff keeps fixture threshold');
  context.assert(report.catalogSnapshot.typesCoveragePercent >= 85, 'Handoff keeps type threshold');
  context.assert(!report.catalogSnapshot.longTailComponents.includes('x-tabs'), 'Handoff closes x-tabs residual after WP-E12-02');
  context.assert(!report.catalogSnapshot.longTailComponents.includes('x-theme'), 'Handoff closes x-theme residual after WP-E12-05');
  context.assert(!report.catalogSnapshot.longTailComponents.includes('x-button'), 'Handoff closes x-button residual after WP-E12-06');
  context.assert(!report.catalogSnapshot.longTailComponents.includes('x-menu'), 'Handoff closes x-menu residual after WP-E12-07');
  context.assert(report.kpiSummary.failed === 0, 'Handoff has no failed KPI decisions');
  context.assert(report.kpiSummary.acceptedHandoff >= 1, 'Handoff records accepted residual decisions');
  context.assert(plan.kpis.some((kpi) => kpi.id === 'p0-performance-profile-coverage' && kpi.status === 'met'), 'Handoff records P0 performance profile coverage as met after WP-E12-02');
  assertIncludesAll(context, plan.docsSurface.requiredDocs, REQUIRED_DOCS, 'Handoff docs surface');
  assertIncludesAll(context, plan.releaseReadiness.requiredGates, REQUIRED_GATES, 'Handoff required gates');
  context.assert(plan.releaseReadiness.packagePrivate === true, 'Handoff keeps package private');
  context.assert(plan.releaseReadiness.publishAllowed === false, 'Handoff blocks publishing');
  context.assert(plan.epicCompletion.status === 'completed-with-accepted-long-tail-handoff', 'Handoff closes Epic 11 with long-tail acceptance');
  context.assert(plan.epicCompletion.completedWorkpackages.includes('WP-E11-18'), 'Handoff completion includes WP-E11-18');
  context.assert(plan.nextWaveHandoffs.includes('visual-snapshot-automation'), 'Handoff keeps visual snapshot automation as next wave');
  context.assert(plan.nextWaveHandoffs.includes('release-candidate-owner-acceptance'), 'Handoff keeps release owner acceptance as next wave');

  context.assertIncludes(epic, '- Status: Completed', 'Epic 11 is completed');
  context.assertIncludes(epic, '| `WP-E11-18` | P2 | completed |', 'Epic 11 marks WP-E11-18 completed');
  context.assertIncludes(epic, EPIC11_ENTERPRISE_UX_HANDOFF_SCHEMA, 'Epic 11 records Handoff schema');
  context.assertIncludes(epic, 'completed-with-accepted-long-tail-handoff', 'Epic 11 records accepted long-tail completion');
  context.assertIncludes(epic, 'x-tabs', 'Epic 11 records x-tabs residual');
  context.assertIncludes(backlog, '- Status: Completed', 'Backlog is completed');
  context.assertIncludes(backlog, '| `WP-E11-18` | P2 | completed | WS11 |', 'Backlog marks WP-E11-18 completed');
  context.assertIncludes(backlog, 'Handoff nach WP-E11-18', 'Backlog documents WP-E11-18 handoff');
  context.assertIncludes(contract, EPIC11_ENTERPRISE_UX_HANDOFF_SCHEMA, 'Handoff contract declares schema');
  context.assertIncludes(contract, 'completed-with-accepted-long-tail-handoff', 'Handoff contract declares completion mode');
  context.assertIncludes(contract, 'x-tabs', 'Handoff contract documents P0 residual');
  context.assertIncludes(contract, KERNEL_BOUNDARY, 'Handoff contract keeps kernel boundary');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E11-18 is completed');
  context.assertIncludes(workpackage, EPIC11_ENTERPRISE_UX_HANDOFF_LOCAL_GATE, 'WP-E11-18 documents local gate');
  context.assertIncludes(handoffDocs, EPIC11_ENTERPRISE_UX_HANDOFF_SCHEMA, 'Docs declare Handoff schema');
  context.assertIncludes(handoffDocs, 'Accepted Residuals', 'Docs contain accepted residuals');
  context.assertIncludes(handoffDocs, 'Next-Wave Handoff', 'Docs contain next-wave handoff');
  context.assertIncludes(componentUxGates, 'epic11-enterprise-ux-handoff', 'Component UX Gates document Handoff gate');
  context.assertIncludes(docsReadme, './epic11-enterprise-ux-handoff.md', 'Docs README links Epic 11 Enterprise UX Handoff');
  context.assertIncludes(docsMenu, 'epic11-enterprise-ux-handoff', 'Docs menu links Epic 11 Enterprise UX Handoff');
  context.assertIncludes(enterpriseDocs, 'Epic 11 Enterprise UX Handoff', 'Enterprise Adoption docs mention Epic 11 handoff');
  context.assertIncludes(platformDocs, 'Epic 11 Enterprise UX Handoff', 'Component Platform docs mention Epic 11 handoff');
  context.assertIncludes(registry, EPIC11_ENTERPRISE_UX_HANDOFF_MODULE, 'Reference registry links Handoff module');
  context.assertIncludes(registry, EPIC11_ENTERPRISE_UX_HANDOFF_CONTRACT, 'Reference registry links Handoff contract');
  context.assertIncludes(registry, EPIC11_ENTERPRISE_UX_HANDOFF_SUITE, 'Reference registry links Handoff suite');
  context.assertIncludes(registry, EPIC11_ENTERPRISE_UX_HANDOFF_DOCS, 'Reference registry links Handoff docs');
  context.assertIncludes(runner, "id: 'epic11-enterprise-ux-handoff'", 'Runner registers Epic 11 Enterprise UX Handoff suite');
  context.assertIncludes(scaffoldConfig, 'epic11EnterpriseUxHandoff', 'Scaffold config exposes Epic 11 Enterprise UX Handoff');
  context.assert((packageManifest.exports['./catalog/epic11-enterprise-ux-handoff'] === './catalog/epic11-enterprise-ux-handoff.js' || (packageManifest.exports['./catalog/epic11-enterprise-ux-handoff'] && packageManifest.exports['./catalog/epic11-enterprise-ux-handoff'].default === './catalog/epic11-enterprise-ux-handoff.js')), 'Package exports Epic 11 Enterprise UX Handoff module');
  context.assert(packageManifest.scripts['test:epic11-enterprise-ux-handoff'] === 'node scripts/run_xtend_tests.js epic11-enterprise-ux-handoff', 'Package exposes Epic 11 Enterprise UX Handoff script');
  context.assert(metadata && metadata.schema === EPIC11_ENTERPRISE_UX_HANDOFF_SCHEMA, 'Package metadata exposes Handoff schema');
  context.assert(metadata && metadata.workpackage === EPIC11_ENTERPRISE_UX_HANDOFF_WORKPACKAGE, 'Package metadata exposes WP-E11-18 owner');
  context.assert(metadata && metadata.module === EPIC11_ENTERPRISE_UX_HANDOFF_MODULE, 'Package metadata exposes Handoff module');
  context.assert(metadata && metadata.suite === EPIC11_ENTERPRISE_UX_HANDOFF_SUITE, 'Package metadata exposes Handoff suite');
  context.assert(metadata && metadata.localGate === EPIC11_ENTERPRISE_UX_HANDOFF_LOCAL_GATE, 'Package metadata exposes Handoff local gate');
  context.assert(metadata && metadata.packageScript === EPIC11_ENTERPRISE_UX_HANDOFF_PACKAGE_SCRIPT, 'Package metadata exposes Handoff package script');
  context.assert(metadata && metadata.publishAllowed === false, 'Package metadata keeps publish blocked');
  context.assert(Array.isArray(metadata && metadata.requiredDocs) && metadata.requiredDocs.includes(EPIC11_ENTERPRISE_UX_HANDOFF_DOCS), 'Package metadata exposes Handoff docs');
  context.assert(Array.isArray(metadata && metadata.requiredGates) && metadata.requiredGates.includes('component-long-tail-migration'), 'Package metadata exposes Long-Tail gate');

  return context.result({
    report: {
      schema: EPIC11_ENTERPRISE_UX_HANDOFF_REPORT_SCHEMA,
      docsCount: report.docsCount,
      gateCount: report.gateCount,
      completedWorkpackageCount: report.completedWorkpackageCount,
      catalogSnapshot: report.catalogSnapshot,
      kpiSummary: report.kpiSummary,
      nextWaveHandoffs: report.nextWaveHandoffs
    }
  });
}

function printEpic11EnterpriseUxHandoffReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 11 Enterprise UX Handoff erfolgreich.',
    failureTitle: 'Epic 11 Enterprise UX Handoff fehlgeschlagen:'
  });
}

module.exports = {
  printEpic11EnterpriseUxHandoffReport,
  runEpic11EnterpriseUxHandoffSuite
};
