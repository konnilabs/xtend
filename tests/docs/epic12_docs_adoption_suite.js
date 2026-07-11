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
  EPIC12_DOCS_ADOPTION_CONTRACT,
  EPIC12_DOCS_ADOPTION_DOCS,
  EPIC12_DOCS_ADOPTION_LOCAL_GATE,
  EPIC12_DOCS_ADOPTION_MODULE,
  EPIC12_DOCS_ADOPTION_PACKAGE_SCRIPT,
  EPIC12_DOCS_ADOPTION_REPORT_SCHEMA,
  EPIC12_DOCS_ADOPTION_SCHEMA,
  EPIC12_DOCS_ADOPTION_STATUS,
  EPIC12_DOCS_ADOPTION_SUITE,
  EPIC12_DOCS_ADOPTION_WORKPACKAGE,
  EPIC12_DOCS_ADOPTION_WORKPACKAGE_DOC,
  KERNEL_BOUNDARY,
  MIGRATION_NOTE_TOPICS,
  PUBLISH_BOUNDARY,
  REQUIRED_DOCS,
  createEpic12DocsAdoptionGuide,
  createEpic12DocsAdoptionReport,
  validateEpic12DocsAdoptionGuide
} = require('../../catalog/epic12-docs-adoption');

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

function runEpic12DocsAdoptionSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic12-docs-adoption',
    label: 'Epic 12 Docs Migration and Enterprise Adoption'
  });
  const guide = createEpic12DocsAdoptionGuide();
  const validation = validateEpic12DocsAdoptionGuide(guide);
  const report = createEpic12DocsAdoptionReport({ guide });
  const packageManifest = readJson('package.json', rootDir);
  const packageMetadata = packageManifest.xtend && packageManifest.xtend.epic12DocsAdoption;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const contract = readText(EPIC12_DOCS_ADOPTION_CONTRACT, rootDir);
  const docs = readText(EPIC12_DOCS_ADOPTION_DOCS, rootDir);
  const workpackage = readText(EPIC12_DOCS_ADOPTION_WORKPACKAGE_DOC, rootDir);
  const enterpriseAdoption = readText('docs/enterprise-adoption.md', rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md', rootDir);
  const rcModel = readText('development/XTend-Epic12-RC-Hardening-Modell.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const rc0GateMatrix = readText('docs/rc0-gate-matrix.md', rootDir);
  const longTailMigration = readText('docs/en/component-long-tail-migration.md', rootDir);
  const visualSnapshots = readText('docs/visual-snapshot-automation.md', rootDir);
  const designTokens = readText('docs/design-tokens.md', rootDir);
  const rmtPolish = readText('docs/rmt-dsl-authoring-polish.md', rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC12_DOCS_ADOPTION_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC12_DOCS_ADOPTION_SUITE, { rootDir, extension: '.js' });

  [
    EPIC12_DOCS_ADOPTION_MODULE,
    EPIC12_DOCS_ADOPTION_SUITE,
    EPIC12_DOCS_ADOPTION_CONTRACT,
    EPIC12_DOCS_ADOPTION_DOCS,
    EPIC12_DOCS_ADOPTION_WORKPACKAGE_DOC
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as required adoption doc`);
  });
  context.assert(moduleSyntax.ok, `Epic 12 docs adoption module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Epic 12 docs adoption suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(guide.schema === EPIC12_DOCS_ADOPTION_SCHEMA, 'Docs adoption guide exposes stable schema');
  context.assert(guide.reportSchema === EPIC12_DOCS_ADOPTION_REPORT_SCHEMA, 'Docs adoption guide exposes report schema');
  context.assert(guide.workpackage === EPIC12_DOCS_ADOPTION_WORKPACKAGE, 'Docs adoption guide belongs to WP-E12-15');
  context.assert(guide.status === EPIC12_DOCS_ADOPTION_STATUS, 'Docs adoption guide is accepted');
  context.assert(guide.publishBoundary === PUBLISH_BOUNDARY, 'Docs adoption guide keeps publish boundary');
  context.assert(guide.publishAllowed === false, 'Docs adoption guide blocks publish');
  context.assert(guide.packagePrivateRequired === true, 'Docs adoption guide requires private package');
  context.assert(guide.kernelBoundary === KERNEL_BOUNDARY, 'Docs adoption guide keeps RMT kernel boundary');
  context.assert(validation.schema === EPIC12_DOCS_ADOPTION_REPORT_SCHEMA, 'Docs adoption validator emits report schema');
  context.assert(validation.ok === true, 'Docs adoption guide validates');
  context.assert(report.ok === true, 'Docs adoption report validates');
  context.assert(report.docsCount === REQUIRED_DOCS.length, 'Docs adoption report counts required docs');
  context.assert(report.migrationTopicCount === MIGRATION_NOTE_TOPICS.length, 'Docs adoption report counts migration topics');
  context.assert(report.publishAllowed === false, 'Docs adoption report blocks publish');
  assertIncludesAll(context, guide.requiredDocs, REQUIRED_DOCS, 'Required docs');
  assertIncludesAll(context, guide.migrationNotes.topics, MIGRATION_NOTE_TOPICS, 'Migration topics');
  assertIncludesAll(context, guide.requiredGates, [
    EPIC12_DOCS_ADOPTION_LOCAL_GATE,
    'node scripts/run_xtend_tests.js references --json',
    'node scripts/run_xtend_tests.js rc0-gate-matrix --json',
    'npm run test:release:full:report',
    'npm run pack:dry-run'
  ], 'Required gates');
  assertIncludesAll(context, guide.knownResiduals, ['xstate', 'x-utils', 'xtend.component.hydrate'], 'Known residuals');
  context.assert(guide.handoff.includes('WP-E12-16'), 'Docs adoption hands off to WP-E12-16');

  context.assert(packageManifest.private === false, 'Package is public-ready for docs adoption');
  context.assert((packageManifest.exports['./catalog/epic12-docs-adoption'] === './catalog/epic12-docs-adoption.js' || (packageManifest.exports['./catalog/epic12-docs-adoption'] && packageManifest.exports['./catalog/epic12-docs-adoption'].default === './catalog/epic12-docs-adoption.js')), 'Package exports Epic 12 docs adoption module');
  context.assert(packageManifest.scripts['test:epic12-docs-adoption'] === 'node scripts/run_xtend_tests.js epic12-docs-adoption', 'Package exposes Epic 12 docs adoption test script');
  context.assert(Array.isArray(packageManifest.xtend.releaseGates) && packageManifest.xtend.releaseGates.includes(EPIC12_DOCS_ADOPTION_PACKAGE_SCRIPT), 'Package release gates include docs adoption script');
  context.assert(packageManifest.xtend.releaseChecklist.candidateGates.includes(EPIC12_DOCS_ADOPTION_PACKAGE_SCRIPT), 'Release checklist metadata includes docs adoption script');
  context.assert(packageMetadata && packageMetadata.schema === EPIC12_DOCS_ADOPTION_SCHEMA, 'Package metadata exposes docs adoption schema');
  context.assert(packageMetadata && packageMetadata.workpackage === EPIC12_DOCS_ADOPTION_WORKPACKAGE, 'Package metadata exposes WP-E12-15');
  context.assert(packageMetadata && packageMetadata.docs === EPIC12_DOCS_ADOPTION_DOCS, 'Package metadata exposes docs adoption page');
  context.assert(packageMetadata && packageMetadata.localGate === EPIC12_DOCS_ADOPTION_LOCAL_GATE, 'Package metadata exposes docs adoption local gate');
  context.assert(packageMetadata && packageMetadata.packageScript === EPIC12_DOCS_ADOPTION_PACKAGE_SCRIPT, 'Package metadata exposes docs adoption package script');
  context.assert(packageMetadata && packageMetadata.publishAllowed === false, 'Package metadata blocks docs adoption publish');
  context.assert(packageMetadata && Array.isArray(packageMetadata.requiredDocs) && packageMetadata.requiredDocs.includes('docs/enterprise-adoption.md'), 'Package metadata exposes adoption docs list');
  context.assertIncludes(scaffoldConfig, 'epic12DocsAdoption', 'Scaffold config exposes Epic 12 docs adoption metadata');
  context.assertIncludes(scaffoldConfig, EPIC12_DOCS_ADOPTION_SCHEMA, 'Scaffold config declares docs adoption schema');
  context.assertIncludes(scaffoldConfig, EPIC12_DOCS_ADOPTION_LOCAL_GATE, 'Scaffold config references docs adoption local gate');
  context.assertIncludes(runner, "id: 'epic12-docs-adoption'", 'Runner registers Epic 12 docs adoption suite');

  assertTextIncludesAll(context, contract, [
    EPIC12_DOCS_ADOPTION_SCHEMA,
    EPIC12_DOCS_ADOPTION_LOCAL_GATE,
    'Long-Tail Migration Status',
    'Snapshot Automation',
    'Design Tokens',
    'RC0 Readiness',
    PUBLISH_BOUNDARY,
    'WP-E12-16'
  ], 'Docs adoption contract');
  assertTextIncludesAll(context, docs, [
    EPIC12_DOCS_ADOPTION_SCHEMA,
    'Migration Notes',
    'Long-Tail Runtime Closure',
    'DOM-first Visual Snapshots',
    'Design Token Productization',
    'RMT DSL Authoring Polish',
    'RC0 Gate Matrix',
    'Known Residual Policy',
    PUBLISH_BOUNDARY,
    EPIC12_DOCS_ADOPTION_LOCAL_GATE
  ], 'RC0 adoption docs');
  assertTextIncludesAll(context, workpackage, [
    'xtend.epic12.wp15.docs-adoption.v1',
    'Status: `completed`',
    EPIC12_DOCS_ADOPTION_SCHEMA,
    EPIC12_DOCS_ADOPTION_LOCAL_GATE,
    '`WP-E12-16` startbar'
  ], 'WP-E12-15 workpackage');
  assertTextIncludesAll(context, enterpriseAdoption, [
    'Epic 12 RC0 Adoption',
    EPIC12_DOCS_ADOPTION_SCHEMA,
    'docs/rc0-adoption-guide.md',
    'npm run test:epic12-docs-adoption',
    'npm run test:rc0-gate-matrix',
    PUBLISH_BOUNDARY
  ], 'Enterprise adoption guide');
  assertTextIncludesAll(context, docsReadme, [
    'rc0-adoption-guide.md',
    EPIC12_DOCS_ADOPTION_SCHEMA,
    'node scripts/run_xtend_tests.js epic12-docs-adoption --json'
  ], 'Docs README');
  context.assertIncludes(docsMenu, 'rc0-adoption-guide', 'Docs menu exposes RC0 Adoption Guide');
  assertTextIncludesAll(context, rc0GateMatrix, [
    'RC0 Adoption Guide',
    'docs/rc0-adoption-guide.md'
  ], 'RC0 Gate Matrix docs link adoption guide');
  assertTextIncludesAll(context, longTailMigration, [
    'WP-E12-15',
    'RC0 Adoption Guide'
  ], 'Long-tail migration docs include WP-E12-15 update');
  assertTextIncludesAll(context, visualSnapshots, [
    'WP-E12-15',
    'RC0 Adoption Guide'
  ], 'Visual snapshot docs include WP-E12-15 update');
  assertTextIncludesAll(context, designTokens, [
    'WP-E12-15',
    'RC0 Adoption Guide'
  ], 'Design token docs include WP-E12-15 update');
  assertTextIncludesAll(context, rmtPolish, [
    'WP-E12-15',
    'RC0 Adoption Guide'
  ], 'RMT DSL polish docs include WP-E12-15 update');
  assertTextIncludesAll(context, backlog, [
    '| `WP-E12-15` | P2 | completed | WS9 | Docs, Migration Notes und Enterprise Adoption Guide aktualisieren |',
    '| `WP-E12-16` | P2 | completed | WS10 | Epic-12-Abschlussreview und RC0-Handoff |',
    'Handoff nach WP-E12-15',
    EPIC12_DOCS_ADOPTION_SCHEMA
  ], 'Epic 12 backlog');
  assertTextIncludesAll(context, rcModel, [
    EPIC12_DOCS_ADOPTION_SCHEMA,
    'Epic 12 ist abgeschlossen',
    'Docs, Migration Notes und Enterprise Adoption: abgeschlossen in `WP-E12-15`'
  ], 'RC hardening model');
  assertTextIncludesAll(context, registry, [
    EPIC12_DOCS_ADOPTION_MODULE,
    EPIC12_DOCS_ADOPTION_CONTRACT,
    EPIC12_DOCS_ADOPTION_DOCS,
    EPIC12_DOCS_ADOPTION_SUITE,
    EPIC12_DOCS_ADOPTION_LOCAL_GATE
  ], 'Reference registry');

  return context.result({
    report: {
      schema: EPIC12_DOCS_ADOPTION_REPORT_SCHEMA,
      docsCount: guide.requiredDocs.length,
      migrationTopicCount: guide.migrationNotes.topics.length,
      adoptionStageCount: guide.adoptionStages.length,
      publishAllowed: guide.publishAllowed,
      handoff: guide.handoff
    }
  });
}

function printEpic12DocsAdoptionReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 12 Docs Migration und Enterprise Adoption erfolgreich.',
    failureTitle: 'Epic 12 Docs Migration und Enterprise Adoption fehlgeschlagen:'
  });
}

module.exports = {
  printEpic12DocsAdoptionReport,
  runEpic12DocsAdoptionSuite
};
