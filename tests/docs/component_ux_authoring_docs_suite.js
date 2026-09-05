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

const COMPONENT_UX_AUTHORING_DOCS_SCHEMA = 'xtend.epic11.component-ux-authoring-docs.v1';
const COMPONENT_UX_AUTHORING_DOCS_REPORT_SCHEMA = 'xtend.epic11.component-ux-authoring-docs-report.v1';
const COMPONENT_UX_AUTHORING_DOCS_WORKPACKAGE = 'WP-E11-16';
const COMPONENT_UX_AUTHORING_DOCS_NEXT_WORKPACKAGE = 'WP-E11-17';
const COMPONENT_UX_AUTHORING_DOCS_LOCAL_GATE = 'node scripts/run_xtend_tests.js component-ux-authoring-docs --json';
const COMPONENT_UX_AUTHORING_DOCS_CONTRACT_PATH = 'development/XTend-Component-UX-Authoring-Guides.md';
const COMPONENT_UX_AUTHORING_DOCS_WP_PATH = 'development/WP-E11-16-Docs-und-Authoring-Guides-fuer-Component-UX-aktualisieren.md';
const COMPONENT_UX_AUTHORING_DOCS_SUITE_PATH = 'tests/docs/component_ux_authoring_docs_suite.js';
const COMPONENT_UX_AUTHORING_DOC_PATHS = Object.freeze([
  'docs/component-ux-authoring.md',
  'docs/component-ux-app-authoring.md',
  'development/docs-evidence/root/component-ux-gates.md'
]);
const COMPONENT_UX_AUTHORING_DOC_SLUGS = Object.freeze([
  'component-ux-authoring',
  'component-ux-app-authoring',
  'component-ux-gates'
]);
const REQUIRED_CONTRACTS = Object.freeze([
  'xtend.component.shell.v1',
  'xtend.component.styling.v1',
  'xtend.component.runtime-a11y.v1',
  'xtend.component.ux-performance.v1',
  'xtend.component.network.v1',
  'xtend.rmt.shell-authoring.v1',
  'xtend.epic11.component-lab-ux-inspector.v1',
  'xtend.epic11.component-ux-browser-smokes.v1',
  'xtend.epic11.component-shell-theme-matrix.v1'
]);
const REQUIRED_GATES = Object.freeze([
  'component-shell-contract',
  'component-styling-contract',
  'runtime-a11y-contract',
  'component-ux-performance',
  'component-network-contract',
  'rmt-shell-authoring-ux',
  'component-lab-ux-inspector',
  'component-ux-browser-smokes',
  'component-shell-theme-matrix',
  'component-ux-authoring-docs',
  'references'
]);

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assert(source.includes(entry), `${label} includes ${entry}`);
  });
}

function runComponentUxAuthoringDocsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'component-ux-authoring-docs',
    label: 'Epic 11 Component UX Authoring Docs'
  });
  const docs = COMPONENT_UX_AUTHORING_DOC_PATHS.map((docPath) => ({
    path: docPath,
    text: readText(docPath, rootDir)
  }));
  const combinedDocs = docs.map((doc) => doc.text).join('\n\n');
  const menu = readJson('docs/menu.json', rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const componentPlatform = readText('development/docs-evidence/root/component-platform.md', rootDir);
  const rmtFirstApps = readText('docs/rmt-first-xtend-apps.md', rootDir);
  const contractDoc = readText(COMPONENT_UX_AUTHORING_DOCS_CONTRACT_PATH, rootDir);
  const workpackage = readText(COMPONENT_UX_AUTHORING_DOCS_WP_PATH, rootDir);
  const epic = readText('development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.componentUxAuthoringDocs;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const suiteSource = readText(COMPONENT_UX_AUTHORING_DOCS_SUITE_PATH, rootDir);

  COMPONENT_UX_AUTHORING_DOC_PATHS.forEach((docPath) => {
    assertFileExists(context, docPath, rootDir, `${docPath} exists`);
  });
  assertFileExists(context, COMPONENT_UX_AUTHORING_DOCS_CONTRACT_PATH, rootDir, 'Component UX Authoring Guides contract exists');
  assertFileExists(context, COMPONENT_UX_AUTHORING_DOCS_WP_PATH, rootDir, 'WP-E11-16 workpackage document exists');
  assertFileExists(context, COMPONENT_UX_AUTHORING_DOCS_SUITE_PATH, rootDir, 'Component UX Authoring Docs suite exists');

  context.assertIncludes(docs[0].text, 'xtend.docs.component-ux-authoring.v1', 'Component UX Authoring doc declares docs contract');
  context.assertIncludes(docs[1].text, 'xtend.docs.component-ux-app-authoring.v1', 'Component UX App Authoring doc declares docs contract');
  context.assertIncludes(docs[2].text, 'xtend.docs.component-ux-gates.v1', 'Component UX Gates doc declares docs contract');
  assertIncludesAll(context, combinedDocs, REQUIRED_CONTRACTS, 'Component UX authoring docs contracts');
  assertIncludesAll(context, combinedDocs, REQUIRED_GATES, 'Component UX authoring docs gates');
  context.assertIncludes(combinedDocs, 'no-rmt-kernel-import-of-xtend-types', 'Component UX docs preserve RMT kernel boundary');
  context.assertIncludes(combinedDocs, 'xtend.component', 'Component UX docs describe xtend.component records');
  context.assertIncludes(combinedDocs, 'dom_descriptor', 'Component UX docs prefer dom_descriptor templates');
  context.assertIncludes(combinedDocs, '360', 'Component UX docs document Theme Matrix combination count');
  context.assertIncludes(combinedDocs, 'light', 'Component UX docs document light theme');
  context.assertIncludes(combinedDocs, 'dark', 'Component UX docs document dark theme');
  context.assertIncludes(combinedDocs, 'high-contrast', 'Component UX docs document high contrast');
  context.assertIncludes(combinedDocs, 'forced-colors', 'Component UX docs document forced colors');
  context.assertIncludes(combinedDocs, 'reduced-motion', 'Component UX docs document reduced motion');
  context.assertIncludes(combinedDocs, 'desktop-1280', 'Component UX docs document desktop viewport');
  context.assertIncludes(combinedDocs, 'tablet-768', 'Component UX docs document tablet viewport');
  context.assertIncludes(combinedDocs, 'mobile-390', 'Component UX docs document mobile viewport');

  const menuSlugs = menu.map((entry) => entry.slug);
  COMPONENT_UX_AUTHORING_DOC_SLUGS.forEach((slug) => {
    context.assert(menuSlugs.includes(slug), `Docs menu exposes ${slug}`);
    context.assertIncludes(docsReadme, `${slug}.md`, `Docs README links ${slug}`);
  });

  context.assertIncludes(componentPlatform, 'Component UX Authoring', 'Component Platform links Component UX Authoring');
  context.assertIncludes(componentPlatform, COMPONENT_UX_AUTHORING_DOCS_LOCAL_GATE, 'Component Platform documents Component UX Authoring Docs gate');
  context.assertIncludes(rmtFirstApps, 'Component UX App Authoring', 'RMT-first Apps links Component UX App Authoring');
  context.assertIncludes(rmtFirstApps, COMPONENT_UX_AUTHORING_DOCS_LOCAL_GATE, 'RMT-first Apps documents Component UX Authoring Docs gate');

  context.assertIncludes(contractDoc, COMPONENT_UX_AUTHORING_DOCS_SCHEMA, 'Component UX Authoring Guides contract declares schema');
  context.assertIncludes(contractDoc, COMPONENT_UX_AUTHORING_DOCS_LOCAL_GATE, 'Component UX Authoring Guides contract documents local gate');
  assertIncludesAll(context, contractDoc, REQUIRED_CONTRACTS, 'Component UX Authoring Guides contract sources');
  context.assertIncludes(contractDoc, COMPONENT_UX_AUTHORING_DOCS_NEXT_WORKPACKAGE, 'Component UX Authoring Guides contract hands off to WP-E11-17');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E11-16 is completed');
  context.assertIncludes(workpackage, COMPONENT_UX_AUTHORING_DOCS_LOCAL_GATE, 'WP-E11-16 documents local gate');
  context.assertIncludes(workpackage, COMPONENT_UX_AUTHORING_DOCS_NEXT_WORKPACKAGE, 'WP-E11-16 hands off to WP-E11-17');

  context.assertIncludes(epic, '| `WP-E11-16` | P1 | completed |', 'Epic 11 marks WP-E11-16 completed');
  context.assertIncludes(epic, '| `WP-E11-17` | P2 | completed |', 'Epic 11 marks WP-E11-17 completed');
  context.assertIncludes(backlog, '| `WP-E11-16` | P1 | completed | WS9 |', 'Backlog marks WP-E11-16 completed');
  context.assertIncludes(backlog, '| `WP-E11-17` | P2 | completed | WS10 |', 'Backlog marks WP-E11-17 completed');
  context.assertIncludes(registry, COMPONENT_UX_AUTHORING_DOCS_CONTRACT_PATH, 'Reference registry links Component UX Authoring Guides contract');
  context.assertIncludes(registry, COMPONENT_UX_AUTHORING_DOCS_WP_PATH, 'Reference registry links WP-E11-16');
  COMPONENT_UX_AUTHORING_DOC_PATHS.forEach((docPath) => {
    context.assertIncludes(registry, docPath, `Reference registry links ${docPath}`);
  });
  context.assertIncludes(registry, COMPONENT_UX_AUTHORING_DOCS_SUITE_PATH, 'Reference registry links Component UX Authoring Docs suite');

  context.assert(runner.hasSuite("component-ux-authoring-docs"), 'XTend runner registers Component UX Authoring Docs suite');
  context.assert(runner.hasSuite('component-ux-authoring-docs'), 'XTend runner help references Component UX Authoring Docs suite');
  context.assert(packageManifest.scripts['test:component-ux-authoring-docs'] === 'node scripts/run_xtend_tests.js component-ux-authoring-docs', 'Package exposes Component UX Authoring Docs test script');
  context.assert(metadata && metadata.schema === COMPONENT_UX_AUTHORING_DOCS_SCHEMA, 'Package metadata exposes Component UX Authoring Docs schema');
  context.assert(metadata && metadata.reportSchema === COMPONENT_UX_AUTHORING_DOCS_REPORT_SCHEMA, 'Package metadata exposes Component UX Authoring Docs report schema');
  context.assert(metadata && metadata.localGate === COMPONENT_UX_AUTHORING_DOCS_LOCAL_GATE, 'Package metadata exposes Component UX Authoring Docs local gate');
  context.assert(metadata && metadata.workpackage === COMPONENT_UX_AUTHORING_DOCS_WORKPACKAGE, 'Package metadata exposes WP-E11-16');
  context.assert(Array.isArray(metadata && metadata.docs) && metadata.docs.length === COMPONENT_UX_AUTHORING_DOC_PATHS.length, 'Package metadata exposes three Component UX docs');
  context.assert(Array.isArray(metadata && metadata.requiredContracts) && metadata.requiredContracts.length === REQUIRED_CONTRACTS.length, 'Package metadata exposes required contracts');
  context.assert(Array.isArray(metadata && metadata.handoff) && metadata.handoff.includes(COMPONENT_UX_AUTHORING_DOCS_NEXT_WORKPACKAGE), 'Package metadata hands off to WP-E11-17');
  context.assertIncludes(scaffoldConfig, 'componentUxAuthoringDocs', 'Scaffold config exposes Component UX Authoring Docs metadata');
  context.assertIncludes(scaffoldConfig, COMPONENT_UX_AUTHORING_DOCS_SCHEMA, 'Scaffold config declares Component UX Authoring Docs schema');
  context.assertIncludes(scaffoldConfig, COMPONENT_UX_AUTHORING_DOCS_LOCAL_GATE, 'Scaffold config declares Component UX Authoring Docs local gate');
  context.assertIncludes(suiteSource, COMPONENT_UX_AUTHORING_DOCS_REPORT_SCHEMA, 'Suite source declares report schema');

  return context.result({
    report: {
      schema: COMPONENT_UX_AUTHORING_DOCS_REPORT_SCHEMA,
      docs: COMPONENT_UX_AUTHORING_DOC_PATHS.slice(),
      requiredContractCount: REQUIRED_CONTRACTS.length,
      gateCount: REQUIRED_GATES.length
    }
  });
}

function printComponentUxAuthoringDocsReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 11 Component UX Authoring Docs erfolgreich.',
    failureTitle: 'Epic 11 Component UX Authoring Docs fehlgeschlagen:'
  });
}

module.exports = {
  printComponentUxAuthoringDocsReport,
  runComponentUxAuthoringDocsSuite
};
