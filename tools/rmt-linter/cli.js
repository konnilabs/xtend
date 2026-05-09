#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  lintRmtSource
} = require('../rmt-language/diagnostics');
const {
  createRmtAgentRepairReportForFiles
} = require('./reporter');

const RMT_LINTER_CLI_SCHEMA = 'xtend.rmt.linter.cli.v1';
const RMT_LINTER_CLI_REPORT_SCHEMA = 'xtend.rmt.linter.report.v1';
const RMT_LINTER_CLI_WORKPACKAGE = 'WP-E14-06';
const RMT_LINTER_CLI_MODULE_PATH = 'tools/rmt-linter/cli.js';
const RMT_LINTER_CLI_SUITE_PATH = 'tests/rmt-language/rmt_linter_cli_suite.js';
const RMT_LINTER_CLI_PACKAGE_SCRIPT = 'npm run test:rmt-linter-cli';
const DEFAULT_FAIL_ON = 'error';
const SEVERITY_RANK = {
  error: 0,
  warning: 1,
  info: 2,
  hint: 3
};

function writeLine(stream, value = '') {
  stream.write(`${value}\n`);
}

function normalizeSeverity(value) {
  return Object.prototype.hasOwnProperty.call(SEVERITY_RANK, value) ? value : DEFAULT_FAIL_ON;
}

function parseArgs(args = [], inheritedOptions = {}) {
  const parsed = {
    help: false,
    json: !!inheritedOptions.json,
    agent: !!inheritedOptions.agent,
    failOn: inheritedOptions.failOn || DEFAULT_FAIL_ON,
    rootDir: inheritedOptions.rootDir || process.cwd(),
    targets: []
  };
  const positionals = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
      continue;
    }

    if (arg === '--json') {
      parsed.json = true;
      continue;
    }

    if (arg === '--agent' || arg === '--agent-report') {
      parsed.agent = true;
      parsed.json = true;
      continue;
    }

    if (arg === '--fail-on') {
      parsed.failOn = normalizeSeverity(args[index + 1]);
      index += 1;
      continue;
    }

    if (arg.startsWith('--fail-on=')) {
      parsed.failOn = normalizeSeverity(arg.slice('--fail-on='.length));
      continue;
    }

    if (arg === '--root') {
      parsed.rootDir = args[index + 1] || parsed.rootDir;
      index += 1;
      continue;
    }

    if (arg.startsWith('--root=')) {
      parsed.rootDir = arg.slice('--root='.length);
      continue;
    }

    positionals.push(arg);
  }

  if (positionals[0] === 'lint') {
    positionals.shift();
  }

  parsed.failOn = normalizeSeverity(parsed.failOn);
  parsed.rootDir = path.resolve(parsed.rootDir || process.cwd());
  parsed.targets = positionals;

  return parsed;
}

function buildHelpText() {
  return [
    'XTendRMT Linter',
    '',
    'Usage:',
    '  xt rmt lint app.rmt',
    '  xt rmt lint app.rmt --json',
    '  xt rmt lint tests/fixtures',
    '  xt rmt lint "docs/**/*.rmt" --json',
    '  xt rmt lint app.rmt --agent',
    '  xt rmt lint app.rmt --fail-on warning',
    '',
    'Options:',
    '  --json              Print machine-readable JSON report.',
    '  --agent             Print AI-agent repair report with fix order and no-op explanations.',
    '  --fail-on <level>   error, warning, info or hint. Default: error.',
    '  --root <dir>        Workspace root for relative targets.',
    '  --help              Print this help text.'
  ].join('\n');
}

function hasGlobPattern(value) {
  return /[*?[\]]/.test(value);
}

function escapeRegExp(value) {
  return String(value).replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRegExp(glob) {
  const normalized = glob.split(path.sep).join('/');
  let pattern = '^';

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];

    if (char === '*') {
      if (normalized[index + 1] === '*') {
        pattern += '.*';
        index += 1;
      } else {
        pattern += '[^/]*';
      }
      continue;
    }

    if (char === '?') {
      pattern += '[^/]';
      continue;
    }

    pattern += escapeRegExp(char);
  }

  pattern += '$';
  return new RegExp(pattern);
}

function isRmtFile(filePath, options = {}) {
  const lower = filePath.toLowerCase();

  if (lower.endsWith('.rmt') || lower.endsWith('.rmt.json')) {
    return true;
  }

  return !!options.includeJsonFallback && lower.endsWith('.json');
}

function walkDirectory(directory, options = {}) {
  const files = [];

  if (!fs.existsSync(directory)) {
    return files;
  }

  fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkDirectory(absolutePath, options));
      return;
    }

    if (entry.isFile() && isRmtFile(absolutePath, options)) {
      files.push(absolutePath);
    }
  });

  return files;
}

function resolveTarget(target, rootDir) {
  const absoluteTarget = path.isAbsolute(target) ? target : path.resolve(rootDir, target);

  if (hasGlobPattern(target)) {
    const pattern = path.isAbsolute(target)
      ? target.split(path.sep).join('/')
      : path.relative(rootDir, absoluteTarget).split(path.sep).join('/');
    const matcher = globToRegExp(pattern);

    return walkDirectory(rootDir, { includeJsonFallback: false })
      .filter((filePath) => matcher.test(path.relative(rootDir, filePath).split(path.sep).join('/')));
  }

  if (!fs.existsSync(absoluteTarget)) {
    return [];
  }

  const stat = fs.statSync(absoluteTarget);

  if (stat.isDirectory()) {
    return walkDirectory(absoluteTarget, { includeJsonFallback: false });
  }

  if (stat.isFile() && isRmtFile(absoluteTarget, { includeJsonFallback: true })) {
    return [absoluteTarget];
  }

  return [];
}

function collectRmtFiles(targets, rootDir) {
  const seen = new Set();
  const files = [];

  targets.forEach((target) => {
    resolveTarget(target, rootDir).forEach((filePath) => {
      const absolutePath = path.resolve(filePath);

      if (!seen.has(absolutePath)) {
        seen.add(absolutePath);
        files.push(absolutePath);
      }
    });
  });

  return files.sort((a, b) => a.localeCompare(b));
}

function normalizeDiagnosticForReport(diagnostic) {
  return {
    schema: diagnostic.schema,
    source: diagnostic.source,
    code: diagnostic.code,
    ruleId: diagnostic.ruleId || null,
    severity: diagnostic.severity,
    category: diagnostic.category || null,
    message: diagnostic.message,
    uri: diagnostic.uri || null,
    file: diagnostic.file || null,
    pointer: diagnostic.pointer || null,
    range: diagnostic.range || null,
    repair: diagnostic.repair || null,
    relatedInformation: diagnostic.relatedInformation || []
  };
}

function summarizeDiagnostics(diagnostics) {
  return diagnostics.reduce((summary, diagnostic) => {
    const key = `${diagnostic.severity || 'info'}Count`;
    summary.totalCount += 1;
    summary[key] = (summary[key] || 0) + 1;
    return summary;
  }, {
    totalCount: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    hintCount: 0
  });
}

function shouldFail(summary, failOn) {
  const threshold = SEVERITY_RANK[normalizeSeverity(failOn)];

  return Object.entries(SEVERITY_RANK).some(([severity, rank]) => {
    if (rank > threshold) {
      return false;
    }

    return (summary[`${severity}Count`] || 0) > 0;
  });
}

function createEmptyFailureReport(message, options = {}) {
  return {
    schema: RMT_LINTER_CLI_REPORT_SCHEMA,
    cliSchema: RMT_LINTER_CLI_SCHEMA,
    workpackage: RMT_LINTER_CLI_WORKPACKAGE,
    status: 'failed',
    ok: false,
    failOn: normalizeSeverity(options.failOn),
    files: 0,
    fileReports: [],
    diagnostics: [{
      schema: 'xtend.rmt.linter.diagnostic.v1',
      source: 'rmt-linter-cli',
      code: 'rmt.linter.target.missing',
      ruleId: 'rmt-linter-cli.targets',
      severity: 'error',
      category: 'cli',
      message,
      uri: null,
      file: null,
      pointer: null,
      range: null,
      repair: null,
      relatedInformation: []
    }],
    totalCount: 1,
    errorCount: 1,
    warningCount: 0,
    infoCount: 0,
    hintCount: 0
  };
}

function lintFiles(files, options = {}) {
  const fileReports = files.map((filePath) => {
    const text = fs.readFileSync(filePath, 'utf8');
    const report = lintRmtSource({
      text,
      filePath
    }, {
      rootDir: options.rootDir,
      severityPolicy: options.severityPolicy
    });

    return {
      file: filePath,
      status: report.status,
      ok: report.ok,
      errorCount: report.errorCount,
      warningCount: report.warningCount,
      infoCount: report.infoCount,
      hintCount: report.hintCount,
      diagnostics: report.diagnostics.map(normalizeDiagnosticForReport)
    };
  });
  const diagnostics = fileReports.flatMap((report) => report.diagnostics);
  const summary = summarizeDiagnostics(diagnostics);
  const failed = shouldFail(summary, options.failOn);

  return {
    schema: RMT_LINTER_CLI_REPORT_SCHEMA,
    cliSchema: RMT_LINTER_CLI_SCHEMA,
    workpackage: RMT_LINTER_CLI_WORKPACKAGE,
    status: failed ? 'failed' : 'passed',
    ok: !failed,
    failOn: normalizeSeverity(options.failOn),
    files: fileReports.length,
    fileReports,
    diagnostics,
    ...summary
  };
}

function formatLocation(diagnostic, rootDir) {
  const file = diagnostic.file
    ? path.relative(rootDir, diagnostic.file)
    : '<unknown>';
  const start = diagnostic.range && diagnostic.range.start
    ? `${diagnostic.range.start.line + 1}:${diagnostic.range.start.character + 1}`
    : '?:?';

  return `${file}:${start}`;
}

function printTextReport(report, stdout, rootDir) {
  writeLine(stdout, 'XTendRMT Linter');
  writeLine(stdout, `Status: ${report.status}`);
  writeLine(stdout, `Files: ${report.files}`);
  writeLine(stdout, `Errors: ${report.errorCount}, Warnings: ${report.warningCount}, Infos: ${report.infoCount}, Hints: ${report.hintCount}`);

  if (report.diagnostics.length === 0) {
    writeLine(stdout, 'No diagnostics.');
    return;
  }

  writeLine(stdout, '');
  report.diagnostics.forEach((diagnostic) => {
    writeLine(stdout, `${diagnostic.severity.toUpperCase()} ${diagnostic.code} ${formatLocation(diagnostic, rootDir)}`);
    writeLine(stdout, `  ${diagnostic.message}`);
    if (diagnostic.repair && diagnostic.repair.title) {
      writeLine(stdout, `  Repair: ${diagnostic.repair.title}`);
    }
  });
}

function runRmtLinterCli(args = process.argv.slice(2), io = {}) {
  const stdout = io.stdout || process.stdout;
  const stderr = io.stderr || process.stderr;
  const options = parseArgs(args, io);

  if (options.help) {
    writeLine(stdout, buildHelpText());
    return 0;
  }

  if (options.targets.length === 0) {
    const report = createEmptyFailureReport('Kein RMT Target angegeben. Nutze `xt rmt lint <file-or-dir>`.', options);
    if (options.json) {
      writeLine(stdout, JSON.stringify(report, null, 2));
    } else {
      writeLine(stderr, report.diagnostics[0].message);
    }
    return 1;
  }

  const files = collectRmtFiles(options.targets, options.rootDir);

  if (files.length === 0) {
    const report = createEmptyFailureReport('Keine .rmt oder .rmt.json Dateien fuer die angegebenen Targets gefunden.', options);
    if (options.json) {
      writeLine(stdout, JSON.stringify(report, null, 2));
    } else {
      writeLine(stderr, report.diagnostics[0].message);
    }
    return 1;
  }

  const report = options.agent
    ? createRmtAgentRepairReportForFiles(files, options)
    : lintFiles(files, options);

  if (options.json || options.agent) {
    writeLine(stdout, JSON.stringify(report, null, 2));
  } else {
    printTextReport(report, stdout, options.rootDir);
  }

  return report.ok ? 0 : 1;
}

if (require.main === module) {
  process.exitCode = runRmtLinterCli(process.argv.slice(2));
}

module.exports = {
  RMT_LINTER_CLI_MODULE_PATH,
  RMT_LINTER_CLI_PACKAGE_SCRIPT,
  RMT_LINTER_CLI_REPORT_SCHEMA,
  RMT_LINTER_CLI_SCHEMA,
  RMT_LINTER_CLI_SUITE_PATH,
  RMT_LINTER_CLI_WORKPACKAGE,
  buildHelpText,
  collectRmtFiles,
  lintFiles,
  parseArgs,
  runRmtLinterCli
};
