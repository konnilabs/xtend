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

const MARACA_DOCS_SCHEMA = 'xtend.docs.maraca-orchestration.v1';
const MARACA_DOCS_REPORT_SCHEMA = 'xtend.docs.maraca-orchestration-report.v1';
const MARACA_DOCS_SUITE_PATH = 'tests/docs/maraca_docs_suite.js';
const MARACA_DOCS_LOCAL_GATE = 'node scripts/run_xtend_tests.js maraca-docs --json';
const MARACA_DOCS_PACKAGE_SCRIPT = 'npm run test:maraca-docs';
const DOC_PATHS = Object.freeze([
  'docs/de/xtend-maraca.md',
  'docs/en/xtend-maraca.md',
  'docs/de/xtend-maraca-orchestration.md',
  'docs/en/xtend-maraca-orchestration.md',
  'docs/de/README.md',
  'docs/en/README.md',
  'docs/de/quick-start-guide.md',
  'docs/en/quick-start-guide.md',
  'docs/de/learn-rmt.md',
  'docs/en/learn-rmt.md',
  'docs/de/learn-rmt-syntax-basics.md',
  'docs/en/learn-rmt-syntax-basics.md',
  'docs/de/learn-rmt-next-steps.md',
  'docs/en/learn-rmt-next-steps.md',
  'docs/menu.json'
]);
const DEEP_DIVE_PATHS = Object.freeze([
  'docs/de/xtend-maraca-orchestration.md',
  'docs/en/xtend-maraca-orchestration.md'
]);
const REQUIRED_DEEP_DIVE_TOKENS = Object.freeze([
  '--orchestration strict',
  '--kernel strict',
  '--hydration strict',
  '--validation strict',
  '--transitions strict',
  'xtend.rmt.app-orchestration.v1',
  'xtend.rmt.form-validation.v1',
  'xtend.rmt.surface-transitions.v1',
  'window.XTendMaraca.orchestration',
  'window.XTendMaraca.kernel',
  'window.XTendMaraca.hydration',
  'window.XTendMaraca.validation',
  'window.XTendMaraca.transitions',
  'xtend-maraca:kernel-boot',
  'xtend-maraca:validation-blocked',
  'xtend-maraca:surface-transition-start',
  'xt-ui-effects="none"',
  'products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt',
  'innerHTML',
  'durationMs',
  'target action',
  'from surfaces',
  'to surfaces'
]);

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, source, entries, label) {
  entries.forEach((entry) => {
    context.assertIncludes(source, entry, `${label} includes ${entry}`);
  });
}

function runDocContentChecks(context, rootDir) {
  const deEntry = readText('docs/de/xtend-maraca.md', rootDir);
  const enEntry = readText('docs/en/xtend-maraca.md', rootDir);
  const deReadme = readText('docs/de/README.md', rootDir);
  const enReadme = readText('docs/en/README.md', rootDir);
  const deQuickStart = readText('docs/de/quick-start-guide.md', rootDir);
  const enQuickStart = readText('docs/en/quick-start-guide.md', rootDir);
  const deLearnRmt = readText('docs/de/learn-rmt.md', rootDir);
  const enLearnRmt = readText('docs/en/learn-rmt.md', rootDir);
  const deSyntax = readText('docs/de/learn-rmt-syntax-basics.md', rootDir);
  const enSyntax = readText('docs/en/learn-rmt-syntax-basics.md', rootDir);
  const deNextSteps = readText('docs/de/learn-rmt-next-steps.md', rootDir);
  const enNextSteps = readText('docs/en/learn-rmt-next-steps.md', rootDir);
  const deepDive = DEEP_DIVE_PATHS.map((docPath) => readText(docPath, rootDir)).join('\n\n');

  context.assertIncludes(deEntry, './xtend-maraca-orchestration.md', 'German Maraca entry links to orchestration deep dive');
  context.assertIncludes(enEntry, './xtend-maraca-orchestration.md', 'English Maraca entry links to orchestration deep dive');
  context.assertIncludes(deEntry, 'Orchestrierte App Bundles', 'German Maraca entry introduces orchestrated app bundles');
  context.assertIncludes(enEntry, 'Orchestrated App Bundles', 'English Maraca entry introduces orchestrated app bundles');
  assertIncludesAll(context, deEntry.concat('\n', enEntry), [
    'xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --css external --json',
    'xt maraca build app.rmt --out dist --web-app-manifest --json',
    'xt maraca build app.rmt --out dist --pwa --json',
    'xt serve --root dist',
    'index.html',
    'xtend.maraca.web-app-manifest-plan.v1',
    'xtend.maraca.web-app-manifest-report.v1',
    'xtend.maraca.pwa-service-worker-plan.v1',
    'xtend.maraca.pwa-service-worker-report.v1',
    'XTEND SERVICE WORKER BUSINESS LOGIC HOOK',
    'XTendMaraca.webAppManifest',
    'XTendMaraca.pwa',
    'maraca-validation',
    'maraca-transitions',
    'maraca-web-app-manifest',
    'maraca-pwa-service-worker'
  ], 'Maraca entry docs');
  assertIncludesAll(context, deepDive, REQUIRED_DEEP_DIVE_TOKENS, 'Maraca orchestration deep dive');
  assertIncludesAll(context, deReadme.concat('\n', enReadme), [
    './xtend-maraca.md',
    './xtend-maraca-orchestration.md',
    'Maraca App-Orchestrierung',
    'Maraca app orchestration',
    'xt maraca build app.rmt --out dist --web-app-manifest --json',
    'xt maraca build app.rmt --out dist --pwa --json'
  ], 'Developer Center start pages');
  assertIncludesAll(context, deQuickStart.concat('\n', enQuickStart), [
    './xtend-maraca.md',
    './xtend-maraca-orchestration.md',
    'app.rmt'
  ], 'Quick Start Maraca handoff');
  assertIncludesAll(context, deLearnRmt.concat('\n', enLearnRmt), [
    './xtend-maraca.md',
    'validation',
    'transition'
  ], 'Learn RMT Maraca handoff');
  assertIncludesAll(context, deSyntax.concat('\n', enSyntax).concat('\n', deNextSteps, '\n', enNextSteps), [
    './xtend-maraca-orchestration.md',
    'xt maraca build',
    'products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt'
  ], 'Learn RMT production path');
}

function runMenuChecks(context, rootDir) {
  const menu = readJson('docs/menu.json', rootDir);
  const maraca = menu.find((entry) => entry.slug === 'xtend-maraca');
  const orchestration = menu.find((entry) => entry.slug === 'xtend-maraca-orchestration');
  const classic = menu.find((entry) => entry.slug === 'xtend-classic');

  context.assert(maraca && maraca.group === 'maraca', 'XTend Maraca menu entry has its own Maraca group');
  context.assert(maraca && !maraca.parent, 'XTend Maraca is a top-level menu entry');
  context.assert(maraca && maraca.rank >= 100, 'XTend Maraca has prominent menu rank');
  context.assert(classic && classic.group === 'start' && !classic.parent && classic.aliases.includes('xtend-loader'), 'XTend Classic is a parallel top-level delivery path with loader alias compatibility');
  context.assert(orchestration && orchestration.id === 'docs.xtend.maraca.orchestration', 'Docs menu exposes stable orchestration id');
  context.assert(orchestration && orchestration.group === 'maraca', 'Orchestration menu entry is in maraca group');
  context.assert(orchestration && orchestration.parent === 'xtend-maraca', 'Orchestration menu entry hangs below XTend Maraca');
  context.assert(orchestration && orchestration.tier === 'deep-dive', 'Orchestration menu entry is a deep dive');
  context.assert(orchestration && maraca && orchestration.rank < maraca.rank, 'Orchestration menu rank follows XTend Maraca');
  context.assert(orchestration && orchestration.labels.de === 'Maraca Orchestrierung', 'Orchestration menu has German label');
  context.assert(orchestration && orchestration.labels.en === 'Maraca Orchestration', 'Orchestration menu has English label');
}

function runMetadataChecks(context, rootDir) {
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.maracaDocs;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const suiteSource = readText(MARACA_DOCS_SUITE_PATH, rootDir);

  context.assert(metadata && metadata.schema === MARACA_DOCS_SCHEMA, 'package metadata declares Maraca docs schema');
  context.assert(metadata && metadata.reportSchema === MARACA_DOCS_REPORT_SCHEMA, 'package metadata declares Maraca docs report schema');
  context.assert(metadata && metadata.suite === MARACA_DOCS_SUITE_PATH, 'package metadata points to Maraca docs suite');
  context.assert(metadata && metadata.localGate === MARACA_DOCS_LOCAL_GATE, 'package metadata declares Maraca docs local gate');
  context.assert(metadata && metadata.packageScript === MARACA_DOCS_PACKAGE_SCRIPT, 'package metadata declares Maraca docs package script');
  context.assert(Array.isArray(metadata && metadata.docs) && DEEP_DIVE_PATHS.every((docPath) => metadata.docs.includes(docPath)), 'package metadata lists orchestration docs');
  context.assert(Array.isArray(metadata && metadata.features) && metadata.features.includes('validation') && metadata.features.includes('transitions'), 'package metadata lists Maraca orchestration features');
  context.assert(packageManifest.scripts['test:maraca-docs'] === 'node scripts/run_xtend_tests.js maraca-docs', 'package exposes maraca-docs script');
  context.assert(runner.includes("id: 'maraca-docs'"), 'test runner exposes maraca-docs suite');
  context.assert(runner.includes('node scripts/run_xtend_tests.js maraca-docs'), 'test runner help references maraca-docs');
  context.assert(suiteSource.includes(MARACA_DOCS_REPORT_SCHEMA), 'Maraca docs suite source declares report schema');
}

function runMaracaDocsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-docs',
    label: 'Maraca Orchestration Docs'
  });
  const suiteSyntax = syntaxCheckFile(MARACA_DOCS_SUITE_PATH, { rootDir, extension: '.js' });

  DOC_PATHS.forEach((docPath) => {
    assertFileExists(context, docPath, rootDir, `${docPath} exists`);
  });
  context.assert(suiteSyntax.ok, `Maraca docs suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  runDocContentChecks(context, rootDir);
  runMenuChecks(context, rootDir);
  runMetadataChecks(context, rootDir);

  return context.result({
    report: {
      schema: MARACA_DOCS_REPORT_SCHEMA,
      docs: DOC_PATHS.slice(),
      gate: MARACA_DOCS_LOCAL_GATE
    }
  });
}

function printMaracaDocsReport(result) {
  printSuiteReport(result, {
    successTitle: 'Maraca Orchestration Docs erfolgreich.',
    failureTitle: 'Maraca Orchestration Docs fehlgeschlagen:'
  });
}

module.exports = {
  MARACA_DOCS_LOCAL_GATE,
  MARACA_DOCS_PACKAGE_SCRIPT,
  MARACA_DOCS_REPORT_SCHEMA,
  MARACA_DOCS_SCHEMA,
  MARACA_DOCS_SUITE_PATH,
  printMaracaDocsReport,
  runMaracaDocsSuite
};
