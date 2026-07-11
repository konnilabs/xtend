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
  CANONICAL_FABRIC_BOUNDARY,
  EPIC10_RELEASE_HANDOFF_CONTRACT,
  EPIC10_RELEASE_HANDOFF_DOCS,
  EPIC10_RELEASE_HANDOFF_LOCAL_GATE,
  EPIC10_RELEASE_HANDOFF_MODULE,
  EPIC10_RELEASE_HANDOFF_PACKAGE_SCRIPT,
  EPIC10_RELEASE_HANDOFF_REPORT_SCHEMA,
  EPIC10_RELEASE_HANDOFF_SCHEMA,
  EPIC10_RELEASE_HANDOFF_STATUS,
  EPIC10_RELEASE_HANDOFF_SUITE,
  EPIC10_RELEASE_HANDOFF_WORKPACKAGE,
  EPIC10_RELEASE_HANDOFF_WORKPACKAGE_DOC,
  KERNEL_BOUNDARY,
  REQUIRED_DOCS,
  REQUIRED_RELEASE_GATES,
  RMT_FIRST_XTEND_APPS_DOCS,
  createEpic10ReleaseHandoffPlan,
  createEpic10ReleaseHandoffReport,
  validateEpic10ReleaseHandoffPlan
} = require('../../catalog/epic10-release-handoff');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function runEpic10ReleaseHandoffSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic10-release-handoff',
    label: 'Epic 10 Documentation, Guides and Release Handoff'
  });
  const plan = createEpic10ReleaseHandoffPlan({ rootDir });
  const validation = validateEpic10ReleaseHandoffPlan(plan);
  const report = createEpic10ReleaseHandoffReport({ rootDir, plan });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.epic10ReleaseHandoff;
  const epic = readText('development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const componentPlatform = readText('development/docs-evidence/root/component-platform.md', rootDir);
  const typescriptDocs = readText('docs/typescript-components.md', rootDir);
  const rmtDocs = readText(RMT_FIRST_XTEND_APPS_DOCS, rootDir);
  const releaseDocs = readText(EPIC10_RELEASE_HANDOFF_DOCS, rootDir);
  const enterpriseDocs = readText('docs/enterprise-adoption.md', rootDir);
  const contract = readText(EPIC10_RELEASE_HANDOFF_CONTRACT, rootDir);
  const workpackage = readText(EPIC10_RELEASE_HANDOFF_WORKPACKAGE_DOC, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC10_RELEASE_HANDOFF_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC10_RELEASE_HANDOFF_SUITE, { rootDir, extension: '.js' });

  [
    EPIC10_RELEASE_HANDOFF_MODULE,
    EPIC10_RELEASE_HANDOFF_SUITE,
    EPIC10_RELEASE_HANDOFF_CONTRACT,
    EPIC10_RELEASE_HANDOFF_WORKPACKAGE_DOC,
    EPIC10_RELEASE_HANDOFF_DOCS,
    RMT_FIRST_XTEND_APPS_DOCS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `Epic 10 Release Handoff module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Epic 10 Release Handoff suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === EPIC10_RELEASE_HANDOFF_SCHEMA, 'Release handoff plan exposes stable schema');
  context.assert(plan.reportSchema === EPIC10_RELEASE_HANDOFF_REPORT_SCHEMA, 'Release handoff plan exposes report schema');
  context.assert(plan.workpackage === EPIC10_RELEASE_HANDOFF_WORKPACKAGE, 'Release handoff plan belongs to WP-E10-16');
  context.assert(plan.status === EPIC10_RELEASE_HANDOFF_STATUS, 'Release handoff plan is accepted');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'Release handoff keeps RMT kernel boundary');
  context.assert(plan.canonicalFabricBoundary === CANONICAL_FABRIC_BOUNDARY, 'Release handoff declares adapter-injection as Fabric boundary');
  context.assert(validation.schema === EPIC10_RELEASE_HANDOFF_REPORT_SCHEMA, 'Release handoff validator emits report schema');
  context.assert(validation.ok === true, 'Release handoff plan validates');
  context.assert(report.ok === true, 'Release handoff report passes');
  context.assert(report.docsCount === REQUIRED_DOCS.length, 'Release handoff report counts required docs');
  context.assert(report.completedWorkpackageCount === 16, 'Release handoff report counts all 16 workpackages');
  assertIncludesAll(context, plan.docsSurface.requiredDocs, REQUIRED_DOCS, 'Release handoff docs surface');
  assertIncludesAll(context, plan.releaseReadiness.requiredGates, REQUIRED_RELEASE_GATES, 'Release handoff release gates');
  context.assert(plan.releaseReadiness.packagePrivate === true, 'Release handoff keeps package private');
  context.assert(plan.releaseReadiness.publishAllowed === false, 'Release handoff blocks publishing');
  context.assert(plan.releaseReadiness.conditionalNetworkGates.includes('npm audit --audit-level=moderate'), 'Release handoff keeps npm audit conditional');
  context.assert(plan.knownHandoffs.includes('component-catalog-completion'), 'Release handoff keeps component catalog completion visible');
  context.assert(plan.knownHandoffs.includes('xtendrmt-upstream-dsl-polish'), 'Release handoff keeps XTendRMT upstream handoff visible');

  context.assertIncludes(epic, '- Status: Completed', 'Epic 10 is completed');
  context.assertIncludes(epic, '| `WP-E10-16` | P2 | completed |', 'Epic 10 marks WP-E10-16 completed');
  context.assertIncludes(epic, 'adapter-injection-via-xtend-component-resolveFabricContext', 'Epic 10 records canonical Fabric boundary');
  context.assertIncludes(backlog, '- Status: Completed', 'Backlog is completed');
  context.assertIncludes(backlog, '| `WP-E10-16` | P2 | completed |', 'Backlog marks WP-E10-16 completed');
  context.assertIncludes(contract, EPIC10_RELEASE_HANDOFF_SCHEMA, 'Release handoff contract declares schema');
  context.assertIncludes(contract, CANONICAL_FABRIC_BOUNDARY, 'Release handoff contract documents Fabric boundary decision');
  context.assertIncludes(contract, 'Migration Notes', 'Release handoff contract documents migration notes');
  context.assertIncludes(contract, 'private-until-release-owner-acceptance', 'Release handoff contract keeps publish boundary');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E10-16 is completed');
  context.assertIncludes(workpackage, EPIC10_RELEASE_HANDOFF_LOCAL_GATE, 'WP-E10-16 documents local gate');
  context.assertIncludes(releaseDocs, EPIC10_RELEASE_HANDOFF_SCHEMA, 'Release handoff docs declare schema');
  context.assertIncludes(releaseDocs, 'Migration Notes', 'Release handoff docs contain migration notes');
  context.assertIncludes(releaseDocs, 'Next-Wave Handoff', 'Release handoff docs contain next-wave handoff');
  context.assertIncludes(rmtDocs, 'xtend.docs.rmt-first-xtend-apps.v1', 'RMT-first XTend Apps docs declare docs schema');
  context.assertIncludes(rmtDocs, 'xtend.rmt.first-class-app-authoring.v1', 'RMT-first XTend Apps docs link app authoring contract');
  context.assertIncludes(rmtDocs, KERNEL_BOUNDARY, 'RMT-first XTend Apps docs keep kernel boundary visible');
  context.assertIncludes(typescriptDocs, 'WP-E10-16', 'TypeScript docs mention WP-E10-16 handoff');
  context.assertIncludes(componentPlatform, 'Epic 10 Release Handoff', 'Component Platform docs mention release handoff');
  context.assertIncludes(enterpriseDocs, 'Epic 10 Release Handoff', 'Enterprise Adoption docs mention Epic 10 release handoff');
  context.assertIncludes(docsReadme, './epic10-release-handoff.md', 'Docs README links Epic 10 Release Handoff');
  context.assertIncludes(docsReadme, './rmt-first-xtend-apps.md', 'Docs README links RMT-first XTend Apps');
  context.assertIncludes(docsMenu, 'epic10-release-handoff', 'Docs menu links Epic 10 Release Handoff');
  context.assertIncludes(docsMenu, 'rmt-first-xtend-apps', 'Docs menu links RMT-first XTend Apps');
  context.assertIncludes(registry, EPIC10_RELEASE_HANDOFF_MODULE, 'Reference registry links Release Handoff module');
  context.assertIncludes(registry, EPIC10_RELEASE_HANDOFF_CONTRACT, 'Reference registry links Release Handoff contract');
  context.assertIncludes(registry, EPIC10_RELEASE_HANDOFF_SUITE, 'Reference registry links Release Handoff suite');
  context.assertIncludes(registry, EPIC10_RELEASE_HANDOFF_DOCS, 'Reference registry links Release Handoff docs');
  context.assertIncludes(registry, RMT_FIRST_XTEND_APPS_DOCS, 'Reference registry links RMT-first XTend Apps docs');
  context.assertIncludes(runner, "id: 'epic10-release-handoff'", 'Runner registers Epic 10 Release Handoff suite');
  context.assertIncludes(scaffoldConfig, 'epic10ReleaseHandoff', 'Scaffold config exposes Epic 10 Release Handoff');
  context.assert((packageManifest.exports['./catalog/epic10-release-handoff'] === './catalog/epic10-release-handoff.js' || (packageManifest.exports['./catalog/epic10-release-handoff'] && packageManifest.exports['./catalog/epic10-release-handoff'].default === './catalog/epic10-release-handoff.js')), 'Package exports Epic 10 Release Handoff module');
  context.assert(packageManifest.scripts['test:epic10-release-handoff'] === 'node scripts/run_xtend_tests.js epic10-release-handoff', 'Package exposes Epic 10 Release Handoff script');
  context.assert(metadata && metadata.schema === EPIC10_RELEASE_HANDOFF_SCHEMA, 'Package metadata exposes Release Handoff schema');
  context.assert(metadata && metadata.workpackage === EPIC10_RELEASE_HANDOFF_WORKPACKAGE, 'Package metadata exposes WP-E10-16 owner');
  context.assert(metadata && metadata.module === EPIC10_RELEASE_HANDOFF_MODULE, 'Package metadata exposes Release Handoff module');
  context.assert(metadata && metadata.suite === EPIC10_RELEASE_HANDOFF_SUITE, 'Package metadata exposes Release Handoff suite');
  context.assert(metadata && metadata.localGate === EPIC10_RELEASE_HANDOFF_LOCAL_GATE, 'Package metadata exposes Release Handoff local gate');
  context.assert(metadata && metadata.packageScript === EPIC10_RELEASE_HANDOFF_PACKAGE_SCRIPT, 'Package metadata exposes Release Handoff package script');
  context.assert(metadata && metadata.canonicalFabricBoundary === CANONICAL_FABRIC_BOUNDARY, 'Package metadata exposes canonical Fabric boundary');
  context.assert(metadata && metadata.publishAllowed === false, 'Package metadata blocks publish from Epic 10 handoff');
  context.assert(Array.isArray(metadata.requiredDocs) && metadata.requiredDocs.includes(RMT_FIRST_XTEND_APPS_DOCS), 'Package metadata exposes RMT-first XTend Apps docs');

  return context.result({
    report: {
      schema: EPIC10_RELEASE_HANDOFF_REPORT_SCHEMA,
      docsCount: report.docsCount,
      releaseGateCount: report.releaseGateCount,
      completedWorkpackageCount: report.completedWorkpackageCount,
      knownHandoffs: report.knownHandoffs
    }
  });
}

function printEpic10ReleaseHandoffReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 10 Release Handoff erfolgreich.',
    failureTitle: 'Epic 10 Release Handoff fehlgeschlagen:'
  });
}

module.exports = {
  printEpic10ReleaseHandoffReport,
  runEpic10ReleaseHandoffSuite
};
