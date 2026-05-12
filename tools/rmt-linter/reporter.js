const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const {
  buildSemanticGraph
} = require('../rmt-language/semantic-graph');
const {
  lintRmtSource
} = require('../rmt-language/diagnostics');
const {
  getRmtCodeActions
} = require('../rmt-language/code-actions');
const {
  analyzeRmtVNextToolingSource,
  isLikelyRmtVNextSource,
  lintRmtVNextToolingSource
} = require('../rmt-language/vnext-tooling');

const RMT_AGENT_REPAIR_REPORT_SCHEMA = 'xtend.rmt.ai-agent-repair-report.v1';
const RMT_AGENT_REPAIR_FILE_SCHEMA = 'xtend.rmt.ai-agent-repair-file.v1';
const RMT_AGENT_REPAIR_STEP_SCHEMA = 'xtend.rmt.ai-agent-repair-step.v1';
const RMT_AGENT_NOOP_SCHEMA = 'xtend.rmt.ai-agent-noop.v1';
const RMT_AGENT_REPAIR_REPORT_WORKPACKAGE = 'WP-E14-11';
const RMT_AGENT_REPAIR_REPORT_MODULE_PATH = 'tools/rmt-linter/reporter.js';
const RMT_AGENT_REPAIR_REPORT_SUITE_PATH = 'tests/rmt-language/rmt_agent_repair_report_suite.js';
const RMT_AGENT_REPAIR_REPORT_PACKAGE_SCRIPT = 'npm run test:rmt-agent-report';
const DEFAULT_TOOL_ROOT_DIR = path.resolve(__dirname, '..', '..');

const SEVERITY_RANK = Object.freeze({
  error: 0,
  warning: 1,
  info: 2,
  hint: 3
});

const REPAIR_PRIORITY = Object.freeze({
  'rename-file-extension': 10,
  'create-schedule': 20,
  'create-template-stub': 30,
  'create-component-stub': 40,
  'replace-field-value': 50,
  'add-route-title': 60,
  'append-property': 70
});

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeSeverity(value) {
  return Object.prototype.hasOwnProperty.call(SEVERITY_RANK, value) ? value : 'info';
}

function severityRank(value) {
  return SEVERITY_RANK[normalizeSeverity(value)];
}

function shouldFail(summary, failOn = 'error') {
  const threshold = severityRank(failOn);

  return Object.entries(SEVERITY_RANK).some(([severity, rank]) => {
    if (rank > threshold) {
      return false;
    }

    return (summary[`${severity}Count`] || 0) > 0;
  });
}

function createUri(input = {}) {
  if (input.uri) {
    return input.uri;
  }

  if (input.filePath) {
    return pathToFileURL(path.resolve(input.filePath)).href;
  }

  return 'untitled:rmt-agent-report';
}

function createLanguageToolingOptions(options = {}) {
  return {
    ...options,
    workspaceRoot: options.rootDir || options.workspaceRoot || null,
    rootDir: path.resolve(options.toolRootDir || options.formatRootDir || DEFAULT_TOOL_ROOT_DIR)
  };
}

function normalizeDiagnostic(diagnostic = {}) {
  return {
    schema: diagnostic.schema || 'xtend.rmt.linter.diagnostic.v1',
    source: diagnostic.source || 'rmt-linter',
    code: diagnostic.code || 'rmt.diagnostic',
    ruleId: diagnostic.ruleId || null,
    severity: normalizeSeverity(diagnostic.severity),
    category: diagnostic.category || null,
    message: diagnostic.message || diagnostic.code || 'RMT diagnostic',
    uri: diagnostic.uri || null,
    file: diagnostic.file || null,
    pointer: diagnostic.pointer || null,
    range: diagnostic.range || null,
    repair: diagnostic.repair || null,
    relatedInformation: toArray(diagnostic.relatedInformation)
  };
}

function summarizeDiagnostics(diagnostics) {
  return diagnostics.reduce((summary, diagnostic) => {
    const severity = normalizeSeverity(diagnostic.severity);
    const key = `${severity}Count`;

    summary.totalCount += 1;
    summary[key] += 1;

    return summary;
  }, {
    totalCount: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    hintCount: 0
  });
}

function inferImpact(diagnostic = {}) {
  if (diagnostic.code === 'rmt.template.inline-script.refused'
    || diagnostic.code === 'rmt.xtend.kernel-boundary.violation') {
    return 'critical';
  }

  if (diagnostic.severity === 'error') {
    return 'high';
  }

  if (diagnostic.severity === 'warning') {
    return 'medium';
  }

  return 'low';
}

function inferNoopReason(diagnostic = {}, actions = []) {
  if (actions.some((action) => action.diagnosticCode === diagnostic.code)) {
    return 'covered-by-related-repair';
  }

  if (diagnostic.code === 'rmt.syntax.invalid-json') {
    return 'source-not-parseable';
  }

  if (diagnostic.code === 'rmt.template.inline-script.refused'
    || diagnostic.code === 'rmt.xtend.kernel-boundary.violation') {
    return 'unsafe-automatic-edit';
  }

  if (diagnostic.code && diagnostic.code.startsWith('rmt.ref.component')) {
    return 'component-stub-needs-authoring-context';
  }

  return 'no-safe-mvp-fix';
}

function explainNoop(diagnostic = {}, actions = []) {
  const reason = inferNoopReason(diagnostic, actions);

  if (reason === 'covered-by-related-repair') {
    return 'Eine verwandte Diagnose desselben Typs erzeugt bereits einen deduplizierten Fix. Diesen Fix zuerst anwenden und danach erneut linten.';
  }

  if (reason === 'source-not-parseable') {
    return 'Die Quelle ist syntaktisch nicht parsebar. Erst JSON/RMT-Syntax korrigieren, dann semantische Fixes erneut anfordern.';
  }

  if (reason === 'unsafe-automatic-edit') {
    return 'Die Diagnose betrifft Security- oder Kernel-Boundary-Verhalten. Automatisches Entfernen waere zu riskant und benoetigt Review.';
  }

  if (reason === 'component-stub-needs-authoring-context') {
    return 'Ein Component-Stub benoetigt bewusstes UI-/Adapter-Authoring. Der MVP erzeugt dafuer keinen automatischen Stub.';
  }

  return 'Fuer diese Diagnose gibt es im sicheren MVP noch keinen deterministischen Quick Fix.';
}

function repairKindForAction(action = {}) {
  if (action.edit && action.edit.metadata && action.edit.metadata.repairKind) {
    return action.edit.metadata.repairKind;
  }

  if (action.command && action.command.command === 'xtend.rmt.renameFileExtension') {
    return 'rename-file-extension';
  }

  return action.diagnosticCode || 'manual-review';
}

function repairPriority(action = {}) {
  const repairKind = repairKindForAction(action);

  return REPAIR_PRIORITY[repairKind] || 100;
}

function relatedDiagnosticsFor(diagnostic, diagnostics) {
  const pointer = diagnostic.pointer || null;

  if (!pointer) {
    return [];
  }

  return diagnostics
    .filter((entry) => entry !== diagnostic && entry.pointer === pointer)
    .map((entry) => ({
      code: entry.code,
      severity: entry.severity,
      message: entry.message,
      pointer: entry.pointer,
      impact: inferImpact(entry)
    }));
}

function actionMatchesDiagnostic(action, diagnostic) {
  return toArray(action.diagnostics).some((entry) => {
    return entry.code === diagnostic.code && (entry.pointer || null) === (diagnostic.pointer || null);
  });
}

function normalizeActionForAgent(action, diagnostic, diagnostics, order) {
  const repairKind = repairKindForAction(action);

  return {
    schema: RMT_AGENT_REPAIR_STEP_SCHEMA,
    order,
    title: action.title,
    diagnosticCode: action.diagnosticCode,
    pointer: action.pointer || (diagnostic && diagnostic.pointer) || null,
    severity: diagnostic ? diagnostic.severity : 'info',
    impact: diagnostic ? inferImpact(diagnostic) : 'low',
    confidence: action.confidence || 'high',
    safe: action.safe !== false,
    repairKind,
    applyMode: action.edit ? 'workspace-edit' : action.command ? 'command' : 'manual',
    action,
    edit: action.edit || null,
    command: action.command || null,
    relatedDiagnostics: diagnostic ? relatedDiagnosticsFor(diagnostic, diagnostics) : []
  };
}

function createNoop(diagnostic, diagnostics, actions = []) {
  return {
    schema: RMT_AGENT_NOOP_SCHEMA,
    diagnosticCode: diagnostic.code,
    pointer: diagnostic.pointer || null,
    severity: diagnostic.severity,
    impact: inferImpact(diagnostic),
    confidence: 'none',
    repairable: false,
    reason: inferNoopReason(diagnostic, actions),
    explanation: explainNoop(diagnostic, actions),
    relatedDiagnostics: relatedDiagnosticsFor(diagnostic, diagnostics)
  };
}

function sortRepairSteps(steps) {
  return steps.sort((a, b) => {
    const severityDiff = severityRank(a.severity) - severityRank(b.severity);

    if (severityDiff !== 0) {
      return severityDiff;
    }

    const priorityDiff = repairPriority(a.action) - repairPriority(b.action);

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    const pointerDiff = String(a.pointer || '').localeCompare(String(b.pointer || ''));

    if (pointerDiff !== 0) {
      return pointerDiff;
    }

    return String(a.title || '').localeCompare(String(b.title || ''));
  }).map((step, index) => ({
    ...step,
    order: index + 1
  }));
}

function createFileAgentReport(input = {}, options = {}) {
  const sourceInput = {
    text: String(input.text || ''),
    uri: input.uri,
    filePath: input.filePath || null,
    version: input.version || 0,
    languageId: input.languageId || 'rmt'
  };
  const uri = createUri(sourceInput);
  const languageOptions = createLanguageToolingOptions(options);
  const vnext = isLikelyRmtVNextSource(sourceInput, languageOptions);
  const graph = options.graph || (vnext
    ? analyzeRmtVNextToolingSource(sourceInput, languageOptions)
    : buildSemanticGraph(sourceInput, languageOptions));
  const lintReport = options.lintReport || (vnext
    ? lintRmtVNextToolingSource(sourceInput, {
      ...languageOptions,
      analysis: graph
    })
    : lintRmtSource(sourceInput, {
      ...languageOptions,
      graph
    }));
  const codeActionReport = options.codeActionReport || (vnext
    ? {
      actions: []
    }
    : getCodeActionReport(sourceInput, graph, lintReport, languageOptions));
  const diagnostics = toArray(lintReport.diagnostics).map(normalizeDiagnostic);
  const actions = toArray(codeActionReport.actions);
  const matchedDiagnostics = new Set();
  const repairSteps = [];

  actions.forEach((action) => {
    const diagnostic = diagnostics.find((entry) => actionMatchesDiagnostic(action, entry))
      || diagnostics.find((entry) => entry.code === action.diagnosticCode);

    if (diagnostic) {
      matchedDiagnostics.add(diagnostic);
    }

    repairSteps.push(normalizeActionForAgent(action, diagnostic, diagnostics, repairSteps.length + 1));
  });

  const sortedRepairSteps = sortRepairSteps(repairSteps);
  const noOps = diagnostics
    .filter((diagnostic) => !matchedDiagnostics.has(diagnostic))
    .map((diagnostic) => createNoop(diagnostic, diagnostics, actions))
    .sort((a, b) => {
      const severityDiff = severityRank(a.severity) - severityRank(b.severity);

      if (severityDiff !== 0) {
        return severityDiff;
      }

      const pointerDiff = String(a.pointer || '').localeCompare(String(b.pointer || ''));

      if (pointerDiff !== 0) {
        return pointerDiff;
      }

      return String(a.diagnosticCode || '').localeCompare(String(b.diagnosticCode || ''));
    });
  const summary = summarizeDiagnostics(diagnostics);

  return {
    schema: RMT_AGENT_REPAIR_FILE_SCHEMA,
    uri,
    file: sourceInput.filePath,
    status: lintReport.status,
    ok: lintReport.ok,
    languageMode: vnext ? 'vnext' : 'legacy',
    graphStatus: graph.status,
    sourceMapSummary: graph.sourceMapSummary || null,
    diagnostics,
    repairPlan: sortedRepairSteps,
    noOps,
    actionableCount: sortedRepairSteps.length,
    noOpCount: noOps.length,
    ...summary
  };
}

function getCodeActionReport(sourceInput, graph, lintReport, options = {}) {
  const {
    getRmtCodeActions
  } = require('../rmt-language/code-actions');

  return getRmtCodeActions(sourceInput, {
    ...options,
    graph,
    lintReport
  });
}

function createFileInputFromPath(filePath) {
  const absolutePath = path.resolve(filePath);

  return {
    text: fs.readFileSync(absolutePath, 'utf8'),
    filePath: absolutePath
  };
}

function createRmtAgentRepairReport(inputs = [], options = {}) {
  const sourceInputs = (Array.isArray(inputs) ? inputs : [inputs]).map((input) => {
    if (typeof input === 'string') {
      return createFileInputFromPath(input);
    }

    return input;
  });
  const fileReports = sourceInputs.map((input) => createFileAgentReport(input, options));
  const diagnostics = fileReports.flatMap((fileReport) => fileReport.diagnostics);
  const repairPlan = fileReports.flatMap((fileReport) => fileReport.repairPlan.map((step) => ({
    ...step,
    uri: fileReport.uri,
    file: fileReport.file
  })));
  const sortedRepairPlan = sortRepairSteps(repairPlan);
  const noOps = fileReports.flatMap((fileReport) => fileReport.noOps.map((noop) => ({
    ...noop,
    uri: fileReport.uri,
    file: fileReport.file
  })));
  const summary = summarizeDiagnostics(diagnostics);
  const failOn = normalizeSeverity(options.failOn || 'error');
  const status = shouldFail(summary, failOn) ? 'failed' : 'passed';

  return {
    schema: RMT_AGENT_REPAIR_REPORT_SCHEMA,
    sourceReportSchema: 'xtend.rmt.linter.report.v1',
    codeActionProviderSchema: 'xtend.rmt.code-action-provider.v1',
    workpackage: RMT_AGENT_REPAIR_REPORT_WORKPACKAGE,
    status,
    ok: status === 'passed',
    failOn,
    files: fileReports.length,
    fileReports,
    diagnostics,
    repairPlan: sortedRepairPlan,
    fixOrder: sortedRepairPlan.map((step) => ({
      order: step.order,
      title: step.title,
      diagnosticCode: step.diagnosticCode,
      pointer: step.pointer,
      uri: step.uri,
      applyMode: step.applyMode,
      safe: step.safe,
      confidence: step.confidence,
      impact: step.impact
    })),
    noOps,
    actionableCount: sortedRepairPlan.length,
    noOpCount: noOps.length,
    ...summary
  };
}

function createRmtAgentRepairReportForFiles(files = [], options = {}) {
  return createRmtAgentRepairReport(files, options);
}

module.exports = {
  RMT_AGENT_NOOP_SCHEMA,
  RMT_AGENT_REPAIR_FILE_SCHEMA,
  RMT_AGENT_REPAIR_REPORT_MODULE_PATH,
  RMT_AGENT_REPAIR_REPORT_PACKAGE_SCRIPT,
  RMT_AGENT_REPAIR_REPORT_SCHEMA,
  RMT_AGENT_REPAIR_REPORT_SUITE_PATH,
  RMT_AGENT_REPAIR_REPORT_WORKPACKAGE,
  RMT_AGENT_REPAIR_STEP_SCHEMA,
  createRmtAgentRepairReport,
  createRmtAgentRepairReportForFiles,
  createFileAgentReport,
  inferImpact
};
