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

const RMT_TOOLING_DOCS_SCHEMA = 'xtend.rmt.tooling-docs.v1';
const RMT_TOOLING_DOCS_REPORT_SCHEMA = 'xtend.rmt.tooling-docs-report.v1';
const RMT_TOOLING_DOCS_WORKPACKAGE = 'WP-E14-14';
const RMT_TOOLING_DOCS_NEXT_WORKPACKAGE = 'WP-E14-15';
const RMT_TOOLING_DOCS_SUITE_PATH = 'tests/docs/rmt_tooling_docs_suite.js';
const RMT_TOOLING_DOCS_WP_PATH = 'development/WP-E14-14-Doku-Quick-Start-und-Authoring-Guides-aktualisieren.md';
const RMT_TOOLING_DOCS_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-tooling-docs --json';
const RMT_TOOLING_DOCS_PACKAGE_SCRIPT = 'npm run test:rmt-tooling-docs';
const EPIC_14_PATH = 'development/EPIC-14-XTendRMT-DSL-Linter-und-Language-Server.md';
const TOOLING_ARCHITECTURE_PATH = 'development/XTendRMT-DSL-Tooling-Architektur.md';
const DOC_PATHS = Object.freeze([
  'docs/de/rmt-linter.md',
  'docs/en/rmt-linter.md',
  'docs/de/rmt-language-server.md',
  'docs/en/rmt-language-server.md',
  'docs/de/quick-start-guide.md',
  'docs/en/quick-start-guide.md',
  'docs/de/xtendrmt-native-authoring.md',
  'docs/en/xtendrmt-native-authoring.md',
  'docs/de/README.md',
  'docs/en/README.md',
  'docs/menu.json'
]);
const MENU_SLUGS = Object.freeze([
  'rmt-linter',
  'rmt-language-server'
]);
const REQUIRED_COMMANDS = Object.freeze([
  'xt rmt lint app.rmt',
  'xt rmt lint app.rmt --json',
  'xt rmt lint app.rmt --agent',
  'node tools/rmt-language-server/server.js',
  'node scripts/run_xtend_tests.js rmt-language-regression --json'
]);
const REQUIRED_CONTRACTS = Object.freeze([
  'xtend.rmt.linter.report.v1',
  'xtend.rmt.ai-agent-repair-report.v1',
  'xtend.rmt.language-server.v1',
  'xtend.rmt.editor-packaging.v1',
  'xtend.rmt.snippet-catalog.v1'
]);

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, source, entries, label) {
  entries.forEach((entry) => {
    context.assertIncludes(source, entry, `${label} includes ${entry}`);
  });
}

function runDocsContentChecks(context, rootDir) {
  const rmtLinter = readText('docs/de/rmt-linter.md', rootDir);
  const languageServer = readText('docs/de/rmt-language-server.md', rootDir);
  const quickStart = readText('docs/de/quick-start-guide.md', rootDir);
  const nativeAuthoring = readText('docs/de/xtendrmt-native-authoring.md', rootDir);
  const docsReadme = readText('docs/de/README.md', rootDir);
  const combined = [rmtLinter, languageServer, quickStart, nativeAuthoring].join('\n\n');

  assertIncludesAll(context, rmtLinter, [
    RMT_TOOLING_DOCS_SCHEMA,
    'xt rmt lint app.rmt',
    '--fail-on warning',
    '--agent',
    'repairPlan',
    'fixOrder',
    'No-Op',
    'rmt.document.extension.fallback-used',
    'rmt-language-regression'
  ], 'RMT Linter docs');
  assertIncludesAll(context, languageServer, [
    'xtend.rmt.editor-packaging.v1',
    'xtend.rmt.language-server.v1',
    'rmt-app',
    'rmt-component',
    'rmt-route',
    'VS Code',
    'JetBrains',
    'Neovim',
    'Helix',
    'node tools/rmt-language-server/server.js'
  ], 'RMT Language Server docs');
  assertIncludesAll(context, quickStart, [
    'xt rmt lint app.rmt',
    'xt rmt lint app.rmt --json',
    'xt rmt lint app.rmt --agent',
    'node tools/rmt-language-server/server.js',
    'rmt-app',
    './rmt-linter.md',
    './rmt-language-server.md'
  ], 'Quick Start docs');
  assertIncludesAll(context, nativeAuthoring, [
    './rmt-linter.md',
    './rmt-language-server.md',
    'rmt-language-regression',
    'rmt-component',
    'rmt-template-dom',
    'Linter, LSP, Code',
    'Agent Report'
  ], 'Native Authoring docs');
  assertIncludesAll(context, docsReadme, [
    './rmt-linter.md',
    './rmt-language-server.md',
    RMT_TOOLING_DOCS_SCHEMA,
    RMT_TOOLING_DOCS_LOCAL_GATE
  ], 'Docs README');
  assertIncludesAll(context, combined, REQUIRED_COMMANDS, 'Tooling docs commands');
  assertIncludesAll(context, combined, REQUIRED_CONTRACTS, 'Tooling docs contracts');
  context.assert(!combined.includes('Neue Apps sollten .rmt.json verwenden'), 'Tooling docs do not recommend .rmt.json as normal path');
}

function runMenuChecks(context, rootDir) {
  const menu = readJson('docs/menu.json', rootDir);
  const slugs = menu.map((entry) => entry.slug);
  const linter = menu.find((entry) => entry.slug === 'rmt-linter');
  const languageServer = menu.find((entry) => entry.slug === 'rmt-language-server');

  MENU_SLUGS.forEach((slug) => {
    context.assert(slugs.includes(slug), `Docs menu exposes ${slug}`);
  });
  context.assert(linter && linter.group === 'rmt', 'RMT Linter menu entry is in rmt group');
  context.assert(linter && linter.parent === 'xtendrmt-overview', 'RMT Linter menu entry hangs below overview');
  context.assert(languageServer && languageServer.parent === 'rmt-linter', 'RMT Language Server menu entry hangs below linter');
  context.assert(languageServer && languageServer.rank < linter.rank, 'RMT Language Server menu rank follows linter');
}

function runMetadataChecks(context, rootDir) {
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtToolingDocs;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const epic = readText(EPIC_14_PATH, rootDir);
  const architecture = readText(TOOLING_ARCHITECTURE_PATH, rootDir);
  const workpackage = readText(RMT_TOOLING_DOCS_WP_PATH, rootDir);
  const suiteSource = readText(RMT_TOOLING_DOCS_SUITE_PATH, rootDir);

  context.assert(metadata && metadata.schema === RMT_TOOLING_DOCS_SCHEMA, 'package metadata declares RMT tooling docs schema');
  context.assert(metadata && metadata.reportSchema === RMT_TOOLING_DOCS_REPORT_SCHEMA, 'package metadata declares RMT tooling docs report schema');
  context.assert(metadata && metadata.workpackage === RMT_TOOLING_DOCS_WORKPACKAGE, 'package metadata points to WP-E14-14');
  context.assert(metadata && metadata.suite === RMT_TOOLING_DOCS_SUITE_PATH, 'package metadata points to RMT tooling docs suite');
  context.assert(metadata && metadata.localGate === RMT_TOOLING_DOCS_LOCAL_GATE, 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === RMT_TOOLING_DOCS_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert(Array.isArray(metadata && metadata.docs) && metadata.docs.includes('docs/de/rmt-linter.md'), 'package metadata includes German rmt-linter docs');
  context.assert(Array.isArray(metadata && metadata.docs) && metadata.docs.includes('docs/en/rmt-language-server.md'), 'package metadata includes English rmt-language-server docs');
  context.assert(Array.isArray(metadata && metadata.commands) && metadata.commands.includes('xt rmt lint <target> --agent'), 'package metadata includes agent CLI command');
  context.assert(Array.isArray(metadata && metadata.handoff) && metadata.handoff.includes(RMT_TOOLING_DOCS_NEXT_WORKPACKAGE), 'package metadata hands off to WP-E14-15');
  context.assert(packageManifest.scripts['test:rmt-tooling-docs'] === 'node scripts/run_xtend_tests.js rmt-tooling-docs', 'package exposes rmt-tooling-docs script');
  context.assert(runner.hasSuite("rmt-tooling-docs"), 'test runner exposes rmt-tooling-docs suite');
  context.assert(runner.hasSuite("rmt-tooling-docs"), 'test runner help references rmt-tooling-docs');
  context.assert(epic.includes('| `WP-E14-14` | P2 | completed | WS9 |'), 'Epic marks WP-E14-14 completed');
  context.assert(epic.includes('| `WP-E14-15` | P2 | completed | WS10 |'), 'Epic records WP-E14-15 completion after docs handoff');
  context.assert(architecture.includes('Implementierungsstand nach `WP-E14-14`'), 'Architecture documents WP-E14-14 status');
  context.assert(architecture.includes(RMT_TOOLING_DOCS_SCHEMA), 'Architecture documents RMT tooling docs schema');
  context.assert(workpackage.includes('Status: `completed`'), 'WP-E14-14 workpackage is completed');
  context.assert(workpackage.includes(RMT_TOOLING_DOCS_LOCAL_GATE), 'WP-E14-14 workpackage documents local gate');
  context.assert(workpackage.includes('WP-E14-15'), 'WP-E14-14 workpackage hands off to WP-E14-15');
  context.assert(suiteSource.includes(RMT_TOOLING_DOCS_REPORT_SCHEMA), 'Suite source declares report schema');
}

function runRmtToolingDocsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-tooling-docs',
    label: 'Epic 14 RMT Tooling Docs'
  });
  const suiteSyntax = syntaxCheckFile(RMT_TOOLING_DOCS_SUITE_PATH, { rootDir, extension: '.js' });

  DOC_PATHS.forEach((docPath) => {
    assertFileExists(context, docPath, rootDir, `${docPath} exists`);
  });
  assertFileExists(context, RMT_TOOLING_DOCS_WP_PATH, rootDir, 'WP-E14-14 workpackage document exists');
  assertFileExists(context, RMT_TOOLING_DOCS_SUITE_PATH, rootDir, 'RMT tooling docs suite exists');
  context.assert(suiteSyntax.ok, `RMT tooling docs suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  runDocsContentChecks(context, rootDir);
  runMenuChecks(context, rootDir);
  runMetadataChecks(context, rootDir);

  return context.result({
    report: {
      schema: RMT_TOOLING_DOCS_REPORT_SCHEMA,
      workpackage: RMT_TOOLING_DOCS_WORKPACKAGE,
      docs: DOC_PATHS.slice(),
      gate: RMT_TOOLING_DOCS_LOCAL_GATE
    }
  });
}

function printRmtToolingDocsReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 14 RMT Tooling Docs erfolgreich.',
    failureTitle: 'Epic 14 RMT Tooling Docs fehlgeschlagen:'
  });
}

module.exports = {
  RMT_TOOLING_DOCS_LOCAL_GATE,
  RMT_TOOLING_DOCS_PACKAGE_SCRIPT,
  RMT_TOOLING_DOCS_REPORT_SCHEMA,
  RMT_TOOLING_DOCS_SCHEMA,
  RMT_TOOLING_DOCS_SUITE_PATH,
  RMT_TOOLING_DOCS_WORKPACKAGE,
  printRmtToolingDocsReport,
  runRmtToolingDocsSuite
};
