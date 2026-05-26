const fs = require('fs');
const os = require('os');
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
  RMT_LINTER_CLI_MODULE_PATH,
  RMT_LINTER_CLI_PACKAGE_SCRIPT,
  RMT_LINTER_CLI_REPORT_SCHEMA,
  RMT_LINTER_CLI_SCHEMA,
  RMT_LINTER_CLI_SUITE_PATH,
  RMT_LINTER_CLI_WORKPACKAGE,
  collectRmtFiles,
  formatProblemMatcherDiagnostic,
  parseArgs,
  runRmtLinterCli
} = require('../../tools/rmt-linter/cli');
const {
  runCli
} = require('../../xtend-builder/lib/cli');

const EPIC_14_PATH = 'development/EPIC-14-XTendRMT-DSL-Linter-und-Language-Server.md';
const TOOLING_ARCHITECTURE_PATH = 'development/XTendRMT-DSL-Tooling-Architektur.md';
const RMT_LINTER_WP_PATH = 'development/WP-E14-06-CLI-xt-rmt-lint-und-Reporter-integrieren.md';
const VALID_FIXTURE_PATH = 'xtendrmt/rmt-first-demo-app.rmt';

function createMemoryStream() {
  const chunks = [];

  return {
    write(chunk) {
      chunks.push(String(chunk));
    },
    toString() {
      return chunks.join('');
    }
  };
}

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function createTempWorkspace(rootDir) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmt-linter-cli-'));
  const validText = readText(VALID_FIXTURE_PATH, rootDir);
  const validPath = path.join(tempRoot, 'valid.rmt');
  const legacyPath = path.join(tempRoot, 'legacy.rmt.json');
  const ignoredPath = path.join(tempRoot, 'README.md');
  const nestedDir = path.join(tempRoot, 'nested');
  const nestedPath = path.join(nestedDir, 'nested.rmt');
  const problemPath = path.join(tempRoot, 'problem.rmt');

  fs.mkdirSync(nestedDir);
  fs.writeFileSync(validPath, validText);
  fs.writeFileSync(legacyPath, validText);
  fs.writeFileSync(ignoredPath, '# ignored\n');
  fs.writeFileSync(nestedPath, validText);
  fs.writeFileSync(problemPath, JSON.stringify({
    version: '1.0',
    components: [
      { id: 'page.bad', adapter: 'missing.adapter', tag: 'x-section', schedule: 'missing.schedule' }
    ],
    routes: [
      { id: 'bad', path: 'bad', component: 'page.bad', template: 'tpl.missing', schedule: 'missing.schedule' }
    ],
    schedules: [],
    templates: [
      { id: 'tpl.bad', mode: 'html_fragment', html: '<script>alert(1)</script>' }
    ]
  }, null, 2));

  return {
    tempRoot,
    validPath,
    legacyPath,
    nestedPath,
    problemPath
  };
}

function runDirectJsonChecks(context, workspace) {
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();
  const exitCode = runRmtLinterCli(['lint', workspace.validPath, '--json'], {
    stdout,
    stderr
  });
  const report = JSON.parse(stdout.toString());

  context.assert(exitCode === 0, 'Direct RMT linter CLI exits 0 for valid fixture with infos only');
  context.assert(stderr.toString() === '', 'Direct JSON CLI keeps stderr empty on success');
  context.assert(report.schema === RMT_LINTER_CLI_REPORT_SCHEMA, 'Direct JSON CLI emits linter report schema');
  context.assert(report.cliSchema === RMT_LINTER_CLI_SCHEMA, 'Direct JSON CLI emits CLI schema');
  context.assert(report.workpackage === RMT_LINTER_CLI_WORKPACKAGE, 'Direct JSON CLI report belongs to WP-E14-06');
  context.assert(report.files === 1, 'Direct JSON CLI reports one file');
  context.assert(report.status === 'passed', 'Direct JSON CLI status is passed');
  context.assert(report.errorCount === 0, 'Direct JSON CLI reports zero errors');
  context.assert(report.infoCount >= 1, 'Direct JSON CLI preserves non-blocking linter infos');
}

function runTextFailureChecks(context, workspace) {
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();
  const exitCode = runRmtLinterCli(['lint', workspace.problemPath], {
    stdout,
    stderr
  });
  const output = stdout.toString();

  context.assert(exitCode === 1, 'Text CLI exits 1 for blocking linter diagnostics');
  context.assert(stderr.toString() === '', 'Text CLI keeps stderr empty for report output');
  context.assert(output.includes('XTendRMT Linter'), 'Text CLI prints report title');
  context.assert(output.includes('rmt.document.kind.missing'), 'Text CLI prints document kind diagnostic');
  context.assert(output.includes('rmt.template.inline-script.refused'), 'Text CLI prints inline script diagnostic');
}

function runProblemMatcherChecks(context, workspace) {
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();
  const exitCode = runRmtLinterCli(['lint', workspace.problemPath, '--format', 'problem-matcher'], {
    stdout,
    stderr,
    rootDir: workspace.tempRoot
  });
  const output = stdout.toString().trim().split(/\r?\n/u).filter(Boolean);
  const firstLine = output[0] || '';
  const formatted = formatProblemMatcherDiagnostic({
    severity: 'hint',
    code: 'rmt.demo',
    file: workspace.problemPath,
    range: { start: { line: 0, character: 0 } },
    message: 'Hint severity is surfaced as info.'
  }, workspace.tempRoot);

  context.assert(exitCode === 1, 'Problem matcher CLI exits 1 for blocking linter diagnostics');
  context.assert(stderr.toString() === '', 'Problem matcher CLI keeps stderr empty for report output');
  context.assert(/^error\s+rmt\.[A-Za-z0-9_.-]+\s+problem\.rmt:\d+:\d+\s+.+/.test(firstLine), 'Problem matcher output emits one-line VS Code diagnostics');
  context.assert(!stdout.toString().includes('XTendRMT Linter'), 'Problem matcher output omits human report heading');
  context.assert(formatted.startsWith('info rmt.demo problem.rmt:1:1 '), 'Problem matcher output maps hint severity to VS Code info');
}

function runDirectoryAndGlobChecks(context, workspace) {
  const directoryFiles = collectRmtFiles([workspace.tempRoot], workspace.tempRoot);
  const globFiles = collectRmtFiles(['*.rmt'], workspace.tempRoot);
  const directoryStdout = createMemoryStream();
  const failOnStdout = createMemoryStream();
  const directoryExitCode = runRmtLinterCli(['lint', workspace.tempRoot, '--json'], {
    stdout: directoryStdout,
    stderr: createMemoryStream()
  });
  const failOnExitCode = runRmtLinterCli(['lint', workspace.legacyPath, '--fail-on', 'warning', '--json'], {
    stdout: failOnStdout,
    stderr: createMemoryStream()
  });
  const directoryReport = JSON.parse(directoryStdout.toString());
  const failOnReport = JSON.parse(failOnStdout.toString());

  context.assert(directoryFiles.length === 4, 'Directory collector finds .rmt and .rmt.json files recursively');
  context.assert(directoryFiles.some((file) => file.endsWith('legacy.rmt.json')), 'Directory collector includes .rmt.json fallback files');
  context.assert(globFiles.length === 2, 'Glob collector matches root .rmt files only for *.rmt');
  context.assert(directoryExitCode === 1, 'Directory CLI is executable and returns failed when directory contains broken fixture');
  context.assert(directoryReport.files === 4, 'Directory JSON report includes all lintable files');
  context.assert(directoryReport.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.document.extension.fallback-used'), 'Directory report includes fallback warning');
  context.assert(failOnExitCode === 1, '--fail-on warning exits 1 on fallback warning');
  context.assert(failOnReport.failOn === 'warning', '--fail-on warning is reflected in JSON report');
}

function runScaffoldCliChecks(context, workspace) {
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();
  const exitCode = runCli(['rmt', 'lint', workspace.validPath, '--json'], {
    stdout,
    stderr
  });
  const report = JSON.parse(stdout.toString());
  const helpStdout = createMemoryStream();
  const helpExit = runCli(['rmt', 'help'], {
    stdout: helpStdout,
    stderr: createMemoryStream()
  });

  context.assert(exitCode === 0, 'xt rmt lint integration exits 0 for valid fixture');
  context.assert(stderr.toString() === '', 'xt rmt lint JSON integration keeps stderr empty');
  context.assert(report.cliSchema === RMT_LINTER_CLI_SCHEMA, 'xt rmt lint integration returns RMT linter CLI report');
  context.assert(helpExit === 0, 'xt rmt help exits 0');
  context.assert(helpStdout.toString().includes('XTend RMT Commands'), 'xt rmt help prints RMT command help');
}

function runArgParseChecks(context, workspace) {
  const parsed = parseArgs(['lint', workspace.validPath, '--json', '--fail-on=info', '--root', workspace.tempRoot]);
  const problemMatcher = parseArgs(['lint', workspace.validPath, '--format', 'problem-matcher', '--fail-on', 'warning']);

  context.assert(parsed.json === true, 'RMT linter CLI parser recognizes --json');
  context.assert(parsed.format === 'json', 'RMT linter CLI parser maps --json to json format');
  context.assert(parsed.failOn === 'info', 'RMT linter CLI parser recognizes --fail-on');
  context.assert(parsed.rootDir === workspace.tempRoot, 'RMT linter CLI parser recognizes --root');
  context.assert(parsed.targets.length === 1 && parsed.targets[0] === workspace.validPath, 'RMT linter CLI parser strips lint subcommand from targets');
  context.assert(problemMatcher.format === 'problem-matcher' && problemMatcher.json === false, 'RMT linter CLI parser recognizes problem matcher format');
}

function runRmtLinterCliSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-linter-cli',
    label: 'Epic 14 RMT Linter CLI'
  });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtLinterCli;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_14_PATH, rootDir);
  const architecture = readText(TOOLING_ARCHITECTURE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_LINTER_CLI_MODULE_PATH, { rootDir, extension: '.js' });
  const scaffoldCliSyntax = syntaxCheckFile('xtend-builder/lib/cli.js', { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_LINTER_CLI_SUITE_PATH, { rootDir, extension: '.js' });
  const workspace = createTempWorkspace(rootDir);

  try {
    assertFileExists(context, RMT_LINTER_CLI_MODULE_PATH, rootDir, 'RMT Linter CLI module exists');
    assertFileExists(context, RMT_LINTER_CLI_SUITE_PATH, rootDir, 'RMT Linter CLI suite exists');
    assertFileExists(context, RMT_LINTER_WP_PATH, rootDir, 'WP-E14-06 workpackage document exists');
    context.assert(moduleSyntax.ok, `RMT Linter CLI module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
    context.assert(scaffoldCliSyntax.ok, `XTend Builder CLI syntax passes${scaffoldCliSyntax.ok ? '' : ` (${scaffoldCliSyntax.message})`}`);
    context.assert(suiteSyntax.ok, `RMT Linter CLI suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

    context.assert(metadata && metadata.schema === RMT_LINTER_CLI_SCHEMA, 'package metadata declares RMT Linter CLI schema');
    context.assert(metadata && metadata.reportSchema === RMT_LINTER_CLI_REPORT_SCHEMA, 'package metadata declares RMT Linter CLI report schema');
    context.assert(metadata && metadata.workpackage === RMT_LINTER_CLI_WORKPACKAGE, 'package metadata points to WP-E14-06');
    context.assert(metadata && metadata.module === RMT_LINTER_CLI_MODULE_PATH, 'package metadata points to CLI module');
    context.assert(metadata && metadata.suite === RMT_LINTER_CLI_SUITE_PATH, 'package metadata points to CLI suite');
    context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-linter-cli --json', 'package metadata declares local gate');
    context.assert(metadata && metadata.packageScript === RMT_LINTER_CLI_PACKAGE_SCRIPT, 'package metadata declares package script');
    context.assert((typeof packageManifest.exports['./rmt-linter/cli'] === 'string' ? packageManifest.exports['./rmt-linter/cli'] : packageManifest.exports['./rmt-linter/cli'] && packageManifest.exports['./rmt-linter/cli'].default) === './tools/rmt-linter/cli.js', 'package exports RMT Linter CLI');
    context.assert(packageManifest.scripts['test:rmt-linter-cli'] === 'node scripts/run_xtend_tests.js rmt-linter-cli', 'package exposes rmt-linter-cli script');
    context.assert(packageManifest.bin.xt === 'xtend-builder/bin/xt', 'package keeps xt bin alias');
    context.assert(runner.includes("id: 'rmt-linter-cli'"), 'test runner exposes rmt-linter-cli suite');
    context.assert(epic.includes('| `WP-E14-06` | P0 | completed | WS3 |'), 'Epic marks WP-E14-06 completed');
    context.assert(epic.includes('WP-E14-07` ist `ready`'), 'Epic hands off WP-E14-07 as ready');
    context.assert(architecture.includes('Implementierungsstand nach `WP-E14-06`'), 'Architecture documents RMT Linter CLI status');
    context.assert(architecture.includes('xt rmt lint'), 'Architecture documents xt rmt lint command');

    runArgParseChecks(context, workspace);
    runDirectJsonChecks(context, workspace);
    runTextFailureChecks(context, workspace);
    runProblemMatcherChecks(context, workspace);
    runDirectoryAndGlobChecks(context, workspace);
    runScaffoldCliChecks(context, workspace);
  } finally {
    fs.rmSync(workspace.tempRoot, { recursive: true, force: true });
  }

  return context.result({
    schema: RMT_LINTER_CLI_REPORT_SCHEMA,
    cliSchema: RMT_LINTER_CLI_SCHEMA,
    workpackage: RMT_LINTER_CLI_WORKPACKAGE,
    module: RMT_LINTER_CLI_MODULE_PATH,
    suite: RMT_LINTER_CLI_SUITE_PATH
  });
}

function printRmtLinterCliReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 14 RMT Linter CLI erfolgreich.',
    failureTitle: 'Epic 14 RMT Linter CLI fehlgeschlagen:'
  });
}

module.exports = {
  printRmtLinterCliReport,
  runRmtLinterCliSuite
};
