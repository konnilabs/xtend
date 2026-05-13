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
  runRmtLinterCli
} = require('../../tools/rmt-linter/cli');
const {
  RMT_AGENT_NOOP_SCHEMA,
  RMT_AGENT_REPAIR_FILE_SCHEMA,
  RMT_AGENT_REPAIR_REPORT_MODULE_PATH,
  RMT_AGENT_REPAIR_REPORT_PACKAGE_SCRIPT,
  RMT_AGENT_REPAIR_REPORT_SCHEMA,
  RMT_AGENT_REPAIR_REPORT_SUITE_PATH,
  RMT_AGENT_REPAIR_REPORT_WORKPACKAGE,
  RMT_AGENT_REPAIR_STEP_SCHEMA,
  createRmtAgentRepairReport,
  createRmtAgentRepairReportForFiles
} = require('../../tools/rmt-linter/reporter');

const EPIC_14_PATH = 'development/EPIC-14-XTendRMT-DSL-Linter-und-Language-Server.md';
const TOOLING_ARCHITECTURE_PATH = 'development/XTendRMT-DSL-Tooling-Architektur.md';
const AGENT_CONTRACT_PATH = 'development/XTendRMT-AI-Agent-Lint-Repair-Contract.md';
const RMT_AGENT_WP_PATH = 'development/WP-E14-11-AI-Agent-Report-und-Repair-Hint-Contract-stabilisieren.md';

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

function createProblemFixture() {
  return JSON.stringify({
    kind: 'rmt_document',
    version: '1.0',
    adapters: [
      { id: 'xtend.component', kind: 'component_adapter' },
      { id: 'xtend.xrouter', kind: 'router_adapter' }
    ],
    components: [
      {
        id: 'page.home',
        adapter: 'xtend.component',
        tag: 'x-section',
        schedule: 'missing.schedule',
        metadata: {
          fabric: {
            lane: 'urgent'
          }
        }
      }
    ],
    routes: [
      {
        id: 'home',
        path: 'bad',
        router: 'xtend.xrouter',
        component: 'missing.component',
        template: 'missing.template',
        schedule: 'missing.schedule'
      }
    ],
    schedules: [
      {
        id: 'existing.schedule',
        lane: 'visible'
      }
    ],
    templates: [
      {
        id: 'tpl.html',
        mode: 'html_fragment',
        html: '<script>alert(1)</script>'
      }
    ]
  }, null, 2);
}

function createTempWorkspace() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmt-agent-report-'));
  const problemPath = path.join(tempRoot, 'problem.rmt');
  const legacyPath = path.join(tempRoot, 'legacy.rmt.json');

  fs.writeFileSync(problemPath, createProblemFixture());
  fs.writeFileSync(legacyPath, JSON.stringify({
    kind: 'rmt_document',
    version: '1.0',
    adapters: [],
    components: [],
    routes: [],
    schedules: [],
    templates: []
  }, null, 2));

  return {
    tempRoot,
    problemPath,
    legacyPath
  };
}

function findStep(report, code, titleFragment) {
  return report.repairPlan.find((step) => {
    const codeMatches = !code || step.diagnosticCode === code;
    const titleMatches = !titleFragment || step.title.includes(titleFragment);

    return codeMatches && titleMatches;
  });
}

function findNoop(report, code, reason) {
  return report.noOps.find((noop) => {
    const codeMatches = !code || noop.diagnosticCode === code;
    const reasonMatches = !reason || noop.reason === reason;

    return codeMatches && reasonMatches;
  });
}

function runAgentReportShapeChecks(context) {
  const report = createRmtAgentRepairReport({
    text: createProblemFixture(),
    uri: 'file:///virtual/agent-report.rmt'
  });
  const scheduleStep = findStep(report, 'rmt.ref.schedule.unresolved', 'missing.schedule');
  const templateStep = findStep(report, 'rmt.ref.template.unresolved', 'missing.template');
  const laneStep = findStep(report, 'rmt.fabric.lane.unknown', 'visible');
  const routeTitleStep = findStep(report, 'rmt.route.document-title.missing', 'documentTitle');
  const inlineScriptNoop = findNoop(report, 'rmt.template.inline-script.refused', 'unsafe-automatic-edit');
  const componentNoop = findNoop(report, 'rmt.ref.component.unresolved', 'component-stub-needs-authoring-context');
  const coveredNoop = findNoop(report, 'rmt.ref.schedule.unresolved', 'covered-by-related-repair');

  context.assert(report.schema === RMT_AGENT_REPAIR_REPORT_SCHEMA, 'Agent report emits stable report schema');
  context.assert(report.workpackage === RMT_AGENT_REPAIR_REPORT_WORKPACKAGE, 'Agent report belongs to WP-E14-11');
  context.assert(report.status === 'failed', 'Problem fixture fails agent report');
  context.assert(report.fileReports.length === 1, 'Agent report contains one file report');
  context.assert(report.fileReports[0].schema === RMT_AGENT_REPAIR_FILE_SCHEMA, 'File report emits stable file schema');
  context.assert(report.repairPlan.every((step) => step.schema === RMT_AGENT_REPAIR_STEP_SCHEMA), 'Repair plan steps emit stable schema');
  context.assert(report.noOps.every((noop) => noop.schema === RMT_AGENT_NOOP_SCHEMA), 'No-op entries emit stable schema');
  context.assert(report.fixOrder.length === report.repairPlan.length, 'fixOrder mirrors repair plan length');
  context.assert(report.actionableCount === report.repairPlan.length, 'actionableCount mirrors repair plan length');
  context.assert(report.noOpCount === report.noOps.length, 'noOpCount mirrors no-op length');
  context.assert(scheduleStep && scheduleStep.order === 1, 'Missing schedule is first high-impact repair step');
  context.assert(scheduleStep && scheduleStep.applyMode === 'workspace-edit', 'Missing schedule uses workspace-edit apply mode');
  context.assert(scheduleStep && scheduleStep.confidence === 'high', 'Missing schedule step has high confidence');
  context.assert(templateStep && templateStep.impact === 'high', 'Missing template step has high impact');
  context.assert(laneStep && laneStep.impact === 'medium', 'Unknown lane step has medium impact');
  context.assert(routeTitleStep && routeTitleStep.relatedDiagnostics.some((entry) => entry.code === 'rmt.a11y.route-announcement.missing'), 'Route title repair exposes related route diagnostics');
  context.assert(inlineScriptNoop && inlineScriptNoop.impact === 'critical', 'Inline script no-op is critical impact');
  context.assert(componentNoop && componentNoop.confidence === 'none', 'Component no-op has no automatic confidence');
  context.assert(coveredNoop && coveredNoop.explanation.includes('deduplizierten Fix'), 'Duplicate schedule symptom points to related repair');
}

function runFileAndCliChecks(context, workspace) {
  const fileReport = createRmtAgentRepairReportForFiles([workspace.problemPath], {
    rootDir: workspace.tempRoot
  });
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();
  const exitCode = runRmtLinterCli(['lint', workspace.problemPath, '--agent'], {
    stdout,
    stderr,
    rootDir: workspace.tempRoot
  });
  const cliReport = JSON.parse(stdout.toString());
  const legacyReport = createRmtAgentRepairReportForFiles([workspace.legacyPath], {
    rootDir: workspace.tempRoot,
    failOn: 'warning'
  });
  const renameStep = findStep(legacyReport, 'rmt.document.extension.fallback-used', '.rmt');

  context.assert(fileReport.fileReports[0].file === workspace.problemPath, 'File report keeps absolute file path');
  context.assert(fileReport.fileReports[0].uri.startsWith('file://'), 'File report exposes file URI');
  context.assert(exitCode === 1, 'CLI --agent exits 1 for failed agent report');
  context.assert(stderr.toString() === '', 'CLI --agent keeps stderr empty');
  context.assert(cliReport.schema === RMT_AGENT_REPAIR_REPORT_SCHEMA, 'CLI --agent emits agent repair report schema');
  context.assert(cliReport.repairPlan.some((step) => step.title.includes('missing.template')), 'CLI --agent includes repair plan');
  context.assert(renameStep && renameStep.applyMode === 'command', '.rmt.json fallback repair uses command apply mode');
  context.assert(renameStep && renameStep.command.command === 'xtend.rmt.renameFileExtension', '.rmt.json fallback repair command is stable');
  context.assert(legacyReport.status === 'failed', 'Agent report honors failOn warning threshold');
}

function runSyntaxNoopChecks(context) {
  const report = createRmtAgentRepairReport({
    text: '{\n  "kind": "rmt_document"\n  "version": "1.0"\n}',
    uri: 'file:///virtual/agent-broken.rmt'
  });
  const syntaxNoop = findNoop(report, 'rmt.syntax.invalid-json', 'source-not-parseable');

  context.assert(report.actionableCount === 0, 'Syntax-broken source has no repair plan before parse recovery');
  context.assert(syntaxNoop && syntaxNoop.explanation.includes('syntaktisch nicht parsebar'), 'Syntax no-op explains parse recovery requirement');
}

function runMetadataChecks(context, rootDir) {
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtAgentRepairReport;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_14_PATH, rootDir);
  const architecture = readText(TOOLING_ARCHITECTURE_PATH, rootDir);
  const contract = readText(AGENT_CONTRACT_PATH, rootDir);

  context.assert(metadata && metadata.schema === RMT_AGENT_REPAIR_REPORT_SCHEMA, 'package metadata declares Agent Repair report schema');
  context.assert(metadata && metadata.workpackage === RMT_AGENT_REPAIR_REPORT_WORKPACKAGE, 'package metadata points to WP-E14-11');
  context.assert(metadata && metadata.module === RMT_AGENT_REPAIR_REPORT_MODULE_PATH, 'package metadata points to reporter module');
  context.assert(metadata && metadata.contract === AGENT_CONTRACT_PATH, 'package metadata points to agent contract document');
  context.assert(metadata && metadata.suite === RMT_AGENT_REPAIR_REPORT_SUITE_PATH, 'package metadata points to agent report suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-agent-report --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === RMT_AGENT_REPAIR_REPORT_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert(metadata && metadata.cliCommand === 'xt rmt lint <target> --agent', 'package metadata declares CLI agent command');
  context.assert((typeof packageManifest.exports['./rmt-linter/reporter'] === 'string' ? packageManifest.exports['./rmt-linter/reporter'] : packageManifest.exports['./rmt-linter/reporter'] && packageManifest.exports['./rmt-linter/reporter'].default) === './tools/rmt-linter/reporter.js', 'package exports RMT Agent reporter');
  context.assert(packageManifest.scripts['test:rmt-agent-report'] === 'node scripts/run_xtend_tests.js rmt-agent-report', 'package exposes rmt-agent-report script');
  context.assert(runner.includes("id: 'rmt-agent-report'"), 'test runner exposes rmt-agent-report suite');
  context.assert(epic.includes('| `WP-E14-11` | P1 | completed | WS6 |'), 'Epic marks WP-E14-11 completed');
  context.assert(epic.includes('WP-E14-12` ist `ready`'), 'Epic hands off WP-E14-12 as ready');
  context.assert(architecture.includes('Implementierungsstand nach `WP-E14-11`'), 'Architecture documents Agent Repair report status');
  context.assert(architecture.includes('xtend.rmt.ai-agent-repair-report.v1'), 'Architecture documents Agent Repair report schema');
  context.assert(contract.includes('No-Op Shape'), 'Agent contract documents No-Op Shape');
  context.assert(contract.includes('Fix-Reihenfolge'), 'Agent contract documents fix order');
}

function runRmtAgentRepairReportSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-agent-report',
    label: 'Epic 14 RMT AI Agent Repair Report'
  });
  const moduleSyntax = syntaxCheckFile(RMT_AGENT_REPAIR_REPORT_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_AGENT_REPAIR_REPORT_SUITE_PATH, { rootDir, extension: '.js' });
  const cliSyntax = syntaxCheckFile('tools/rmt-linter/cli.js', { rootDir, extension: '.js' });
  const workspace = createTempWorkspace();

  try {
    assertFileExists(context, RMT_AGENT_REPAIR_REPORT_MODULE_PATH, rootDir, 'RMT Agent reporter module exists');
    assertFileExists(context, RMT_AGENT_REPAIR_REPORT_SUITE_PATH, rootDir, 'RMT Agent reporter suite exists');
    assertFileExists(context, AGENT_CONTRACT_PATH, rootDir, 'AI Agent Repair contract document exists');
    assertFileExists(context, RMT_AGENT_WP_PATH, rootDir, 'WP-E14-11 workpackage document exists');
    context.assert(moduleSyntax.ok, `RMT Agent reporter module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
    context.assert(suiteSyntax.ok, `RMT Agent reporter suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
    context.assert(cliSyntax.ok, `RMT Linter CLI syntax passes after --agent${cliSyntax.ok ? '' : ` (${cliSyntax.message})`}`);

    runMetadataChecks(context, rootDir);
    runAgentReportShapeChecks(context);
    runFileAndCliChecks(context, workspace);
    runSyntaxNoopChecks(context);
  } finally {
    fs.rmSync(workspace.tempRoot, { recursive: true, force: true });
  }

  return context.result({
    schema: RMT_AGENT_REPAIR_REPORT_SCHEMA,
    workpackage: RMT_AGENT_REPAIR_REPORT_WORKPACKAGE,
    module: RMT_AGENT_REPAIR_REPORT_MODULE_PATH,
    suite: RMT_AGENT_REPAIR_REPORT_SUITE_PATH,
    contract: AGENT_CONTRACT_PATH
  });
}

function printRmtAgentRepairReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 14 RMT AI Agent Repair Report erfolgreich.',
    failureTitle: 'Epic 14 RMT AI Agent Repair Report fehlgeschlagen:'
  });
}

module.exports = {
  printRmtAgentRepairReport,
  runRmtAgentRepairReportSuite
};
