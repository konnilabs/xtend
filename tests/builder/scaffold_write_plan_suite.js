const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readText,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  SCAFFOLD_WRITE_PLAN_SCHEMA,
  SCAFFOLD_WRITE_REPORT_SCHEMA,
  createWritePlan,
  sha256,
  writeScaffoldFiles
} = require('../../xtend-builder/writing/write-plan');

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-scaffold-write-plan-'));
}

function readTempFile(rootDir, relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function existsTempFile(rootDir, relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function operationFor(reportOrPlan, relativePath) {
  const plan = reportOrPlan.plan || reportOrPlan;
  return plan.operations.find((operation) => operation.path === relativePath) || null;
}

function runScaffoldWritePlanSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'scaffold-write-plan',
    label: 'XTend Scaffold WritePlan'
  });
  const tempDir = tempRoot();
  const entries = [
    {
      id: 'component',
      path: 'components/x-write-plan-demo.js',
      kind: 'component',
      content: "export const writePlanDemo = 'ready';\n"
    },
    {
      id: 'docs',
      targetPath: 'docs/x-write-plan-demo.md',
      kind: 'docs',
      content: '# WritePlan Demo\n'
    }
  ];

  [
    'xtend-builder/writing/write-plan.js',
    'xtend-builder/generators/rmt-build.js',
    'tests/builder/scaffold_write_plan_suite.js'
  ].forEach((relativePath) => {
    const syntax = syntaxCheckFile(relativePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${relativePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  const writerSource = readText('xtend-builder/writing/write-plan.js', rootDir);
  const lifecycleGenerator = readText('xtend-builder/generators/rmt-build.js', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const readme = readText('xtend-builder/README.md', rootDir);
  const epic = readText('development/EPIC-17-XTend-Scaffold-Produktive-Builds-und-Dateischreibpfade.md', rootDir);
  const workpackage = readText('development/WP-E17-01-WritePlan-und-zentraler-Scaffold-Writer.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);

  context.assert(writerSource.includes(SCAFFOLD_WRITE_PLAN_SCHEMA), 'Writer exposes WritePlan schema');
  context.assert(writerSource.includes(SCAFFOLD_WRITE_REPORT_SCHEMA), 'Writer exposes write report schema');
  context.assert(writerSource.includes('normalizeRelativePath'), 'Writer normalizes relative paths');
  context.assert(writerSource.includes('allowedRoots'), 'Writer enforces allowed roots');
  context.assert(lifecycleGenerator.includes("require('../writing/write-plan')"), 'Generic RMT demo build uses central writer');
  context.assert(scaffoldConfig.includes('writing: "xtend-builder/writing/"'), 'Scaffold config declares writing module boundary');
  context.assert(readme.includes('xtend-builder/writing/'), 'Scaffold README documents writing module');
  context.assert(epic.includes('WP-E17-01'), 'Epic 17 tracks WP-E17-01');
  context.assert(workpackage.includes(SCAFFOLD_WRITE_PLAN_SCHEMA), 'WP-E17-01 document declares WritePlan contract');
  context.assert(runner.includes("id: 'scaffold-write-plan'"), 'XTend test runner registers scaffold-write-plan gate');

  const plan = createWritePlan(entries, {
    rootDir: tempDir,
    generator: 'scaffold-write-plan-test',
    allowedRoots: ['components/', 'docs/']
  });
  context.assert(plan.schema === SCAFFOLD_WRITE_PLAN_SCHEMA, 'Dry-run plan uses WritePlan schema');
  context.assert(plan.ok, 'Dry-run plan validates');
  context.assert(plan.mode === 'dry-run', 'Default WritePlan mode is dry-run');
  context.assert(plan.operationCount === entries.length, 'WritePlan tracks all entries');
  context.assert(plan.changedCount === entries.length, 'WritePlan marks missing files as changed');
  const componentOperation = operationFor(plan, 'components/x-write-plan-demo.js');
  const docsOperation = operationFor(plan, 'docs/x-write-plan-demo.md');
  context.assert(componentOperation && componentOperation.action === 'create', 'Missing component is planned as create');
  context.assert(docsOperation && docsOperation.sha256 === sha256('# WritePlan Demo\n'), 'WritePlan records stable content hash');
  context.assert(!existsTempFile(tempDir, 'components/x-write-plan-demo.js'), 'Dry-run does not write component');
  context.assert(!existsTempFile(tempDir, 'docs/x-write-plan-demo.md'), 'Dry-run does not write docs');

  const writeReport = writeScaffoldFiles(entries, {
    rootDir: tempDir,
    write: true,
    generator: 'scaffold-write-plan-test',
    allowedRoots: ['components/', 'docs/']
  });
  context.assert(writeReport.schema === SCAFFOLD_WRITE_REPORT_SCHEMA, 'Write report uses stable schema');
  context.assert(writeReport.ok, 'Write report succeeds');
  context.assert(writeReport.status === 'written', 'Write report records written status');
  context.assert(writeReport.plan.schema === SCAFFOLD_WRITE_PLAN_SCHEMA, 'Write report embeds summarized WritePlan');
  context.assert(!Object.prototype.hasOwnProperty.call(writeReport.plan.operations[0], 'content'), 'Write report summary omits file content');
  context.assert(writeReport.writes.length === entries.length, 'Write report records both writes');
  context.assert(writeReport.writes.every((entry) => entry.changed === true), 'Initial writes are changed');
  context.assert(readTempFile(tempDir, 'components/x-write-plan-demo.js') === entries[0].content, 'Component file was written');
  context.assert(readTempFile(tempDir, 'docs/x-write-plan-demo.md') === entries[1].content, 'Docs file was written');

  const repeatReport = writeScaffoldFiles(entries, {
    rootDir: tempDir,
    write: true,
    generator: 'scaffold-write-plan-test',
    allowedRoots: ['components/', 'docs/']
  });
  context.assert(repeatReport.ok, 'Repeated write report succeeds');
  context.assert(repeatReport.plan.changedCount === 0, 'Repeated write plan is unchanged');
  context.assert(repeatReport.writes.every((entry) => entry.action === 'skip' && entry.changed === false), 'Repeated write skips unchanged files');

  const checkCurrent = writeScaffoldFiles(entries, {
    rootDir: tempDir,
    check: true,
    generator: 'scaffold-write-plan-test',
    allowedRoots: ['components/', 'docs/']
  });
  context.assert(checkCurrent.ok, 'Check mode passes when files are current');
  context.assert(checkCurrent.status === 'current', 'Check mode reports current output');

  const changedEntries = entries.map((entry) => entry.id === 'docs' ? {
    ...entry,
    content: '# WritePlan Demo\n\nChanged.\n'
  } : entry);
  const checkOutdated = writeScaffoldFiles(changedEntries, {
    rootDir: tempDir,
    check: true,
    generator: 'scaffold-write-plan-test',
    allowedRoots: ['components/', 'docs/']
  });
  context.assert(!checkOutdated.ok, 'Check mode fails when output would change');
  context.assert(checkOutdated.status === 'outdated', 'Check mode reports outdated output');

  const blockedOutsideRoot = writeScaffoldFiles([{
    id: 'escape',
    path: '../outside.js',
    content: 'nope\n'
  }], {
    rootDir: tempDir,
    write: true,
    generator: 'scaffold-write-plan-test',
    allowedRoots: ['components/']
  });
  context.assert(!blockedOutsideRoot.ok, 'Writer blocks paths outside root');
  context.assert(blockedOutsideRoot.status === 'blocked', 'Outside-root path is blocked before write');

  const blockedRoot = writeScaffoldFiles([{
    id: 'package',
    path: 'package.json',
    content: '{}\n'
  }], {
    rootDir: tempDir,
    write: true,
    generator: 'scaffold-write-plan-test',
    allowedRoots: ['components/']
  });
  context.assert(!blockedRoot.ok, 'Writer blocks paths outside allowed roots');
  context.assert(blockedRoot.errors.some((error) => error.includes('allowed Scaffold output roots')), 'Allowed-root violation is diagnosed');

  fs.mkdirSync(path.join(tempDir, 'components', 'not-a-file'), { recursive: true });
  const blockedDirectory = writeScaffoldFiles([{
    id: 'directory',
    path: 'components/not-a-file',
    content: 'nope\n'
  }], {
    rootDir: tempDir,
    write: true,
    generator: 'scaffold-write-plan-test',
    allowedRoots: ['components/']
  });
  context.assert(!blockedDirectory.ok, 'Writer blocks directory targets');
  context.assert(blockedDirectory.errors.some((error) => error.includes('not a file')), 'Directory target is diagnosed');

  return context.result({
    report: {
      schema: 'xtend.scaffold.write-plan-suite-report.v1',
      tempDir,
      operationCount: plan.operationCount,
      writeCount: writeReport.writes.length
    }
  });
}

function printScaffoldWritePlanReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Scaffold WritePlan erfolgreich.',
    failureTitle: 'XTend Scaffold WritePlan fehlgeschlagen:'
  });
}

module.exports = {
  printScaffoldWritePlanReport,
  runScaffoldWritePlanSuite
};
