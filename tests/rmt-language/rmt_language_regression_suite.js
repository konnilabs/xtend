const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
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
  parseAndNormalizeRmtSource
} = require('../../tools/rmt-language/format-adapter');
const {
  lintRmtSource
} = require('../../tools/rmt-language/diagnostics');
const {
  runRmtLinterCli
} = require('../../tools/rmt-linter/cli');
const {
  createRmtLanguageServer
} = require('../../tools/rmt-language-server/server');
const {
  createRmtAgentRepairReportForFiles
} = require('../../tools/rmt-linter/reporter');

const RMT_LANGUAGE_REGRESSION_SCHEMA = 'xtend.rmt.language-regression.v1';
const RMT_LANGUAGE_REGRESSION_MATRIX_SCHEMA = 'xtend.rmt.language-regression-matrix.v1';
const RMT_LANGUAGE_REGRESSION_WORKPACKAGE = 'WP-E14-13';
const RMT_LANGUAGE_REGRESSION_SUITE_PATH = 'tests/rmt-language/rmt_language_regression_suite.js';
const RMT_LANGUAGE_REGRESSION_FIXTURES_DIR = 'tests/rmt-language/fixtures';
const RMT_LANGUAGE_REGRESSION_PACKAGE_SCRIPT = 'npm run test:rmt-language-regression';
const EPIC_14_PATH = 'development/EPIC-14-XTendRMT-DSL-Linter-und-Language-Server.md';
const TOOLING_ARCHITECTURE_PATH = 'development/XTendRMT-DSL-Tooling-Architektur.md';
const RMT_LANGUAGE_REGRESSION_WP_PATH = 'development/WP-E14-13-Fixtures-Regression-Fuzzing-und-negative-Testmatrix-erweitern.md';

const REGRESSION_MATRIX = Object.freeze([
  {
    id: 'valid-native',
    path: 'tests/rmt-language/fixtures/regression-valid.rmt',
    expectedStatus: 'passed',
    expectedCodes: []
  },
  {
    id: 'missing-refs',
    path: 'tests/rmt-language/fixtures/regression-missing-refs.rmt',
    expectedStatus: 'failed',
    expectedCodes: [
      'rmt.adapter.unknown',
      'rmt.ref.component.unresolved',
      'rmt.ref.template.unresolved',
      'rmt.ref.schedule.unresolved'
    ]
  },
  {
    id: 'duplicates',
    path: 'tests/rmt-language/fixtures/regression-duplicates.rmt',
    expectedStatus: 'failed',
    expectedCodes: [
      'rmt.id.duplicate',
      'rmt.ref.route.duplicate-path',
      'rmt.fabric.lane.conflict'
    ]
  },
  {
    id: 'broken-syntax',
    path: 'tests/rmt-language/fixtures/regression-broken-syntax.rmt',
    expectedStatus: 'failed',
    expectedCodes: [
      'rmt.syntax.invalid-json'
    ]
  },
  {
    id: 'legacy-fallback',
    path: 'tests/rmt-language/fixtures/regression-legacy.rmt.json',
    expectedStatus: 'passed',
    expectedCodes: [
      'rmt.document.extension.fallback-used'
    ]
  },
  {
    id: 'large-native',
    path: 'tests/rmt-language/fixtures/regression-large.rmt',
    expectedStatus: 'passed',
    expectedCodes: []
  }
]);

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

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

function lintFixture(entry, rootDir) {
  const text = readText(entry.path, rootDir);
  const filePath = resolveRepoPath(entry.path, rootDir);

  return lintRmtSource({
    text,
    filePath,
    version: 13
  }, {
    rootDir
  });
}

function runFixtureMatrixChecks(context, rootDir) {
  REGRESSION_MATRIX.forEach((entry) => {
    const filePath = resolveRepoPath(entry.path, rootDir);
    const text = readText(entry.path, rootDir);
    const parseResult = parseAndNormalizeRmtSource({
      text,
      filePath
    }, {
      rootDir
    });
    const report = lintFixture(entry, rootDir);
    const repeatReport = lintFixture(entry, rootDir);
    const codes = report.diagnostics.map((diagnostic) => diagnostic.code);

    context.assert(report.schema === 'xtend.rmt.linter.report.v1', `${entry.id} emits linter report schema`);
    context.assert(report.status === entry.expectedStatus, `${entry.id} reports expected status`);
    context.assert(
      JSON.stringify(report.diagnostics) === JSON.stringify(repeatReport.diagnostics),
      `${entry.id} diagnostics remain deterministic`
    );

    entry.expectedCodes.forEach((code) => {
      context.assert(codes.includes(code), `${entry.id} emits ${code}`);
    });

    if (entry.id === 'broken-syntax') {
      context.assert(parseResult.phase === 'syntax', 'Broken syntax fixture stays in syntax phase');
      context.assert(report.graphStatus === 'source_unavailable', 'Broken syntax fixture exposes source_unavailable graph status');
    } else {
      context.assert(parseResult.sourceModel.uri.startsWith('file://'), `${entry.id} keeps file URI`);
      context.assert(report.graphStatus === 'indexed', `${entry.id} exposes indexed graph status`);
    }
  });
}

function createFuzzCases(rootDir) {
  const base = readJson('tests/rmt-language/fixtures/regression-valid.rmt', rootDir);

  return [
    {
      id: 'missing-kind',
      expectedStatus: 'failed',
      expectedCode: 'rmt.document.kind.missing',
      document: {
        ...base,
        kind: undefined
      }
    },
    {
      id: 'unknown-domain',
      expectedStatus: 'failed',
      expectedCode: 'rmt.domain.unknown',
      document: {
        ...base,
        runtimeImports: ['./x-router.js']
      }
    },
    {
      id: 'relative-route-path',
      expectedStatus: 'failed',
      expectedCode: 'rmt.route.path.invalid',
      document: {
        ...base,
        routes: base.routes.map((route, index) => index === 0 ? { ...route, path: 'relative' } : route)
      }
    },
    {
      id: 'unknown-template-mode',
      expectedStatus: 'failed',
      expectedCode: 'rmt.template.mode.unsupported',
      document: {
        ...base,
        templates: base.templates.map((template, index) => index === 0 ? { ...template, mode: 'vue_sfc' } : template)
      }
    },
    {
      id: 'unknown-fabric-lane',
      expectedStatus: 'passed',
      expectedCode: 'rmt.fabric.lane.unknown',
      document: {
        ...base,
        components: base.components.map((component, index) => index === 0
          ? {
            ...component,
            metadata: {
              fabric: {
                lane: 'urgent'
              }
            }
          }
          : component)
      }
    }
  ];
}

function cleanUndefined(value) {
  if (Array.isArray(value)) {
    return value.map(cleanUndefined);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).reduce((result, key) => {
      if (value[key] !== undefined) {
        result[key] = cleanUndefined(value[key]);
      }

      return result;
    }, {});
  }

  return value;
}

function runFuzzRegressionChecks(context, rootDir) {
  createFuzzCases(rootDir).forEach((caseEntry) => {
    const text = JSON.stringify(cleanUndefined(caseEntry.document), null, 2);
    const report = lintRmtSource({
      text,
      uri: `file:///virtual/fuzz-${caseEntry.id}.rmt`
    }, {
      rootDir
    });

    context.assert(report.status === caseEntry.expectedStatus, `${caseEntry.id} fuzz case reports expected status without throwing`);
    context.assert(
      report.diagnostics.some((diagnostic) => diagnostic.code === caseEntry.expectedCode),
      `${caseEntry.id} fuzz case emits ${caseEntry.expectedCode}`
    );
  });
}

function runCliAndAgentRegressionChecks(context, rootDir) {
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();
  const matrixTargets = REGRESSION_MATRIX.map((entry) => entry.path);
  const exitCode = runRmtLinterCli(['lint'].concat(matrixTargets).concat('--json'), {
    stdout,
    stderr,
    rootDir
  });
  const cliReport = JSON.parse(stdout.toString());
  const agentReport = createRmtAgentRepairReportForFiles(
    REGRESSION_MATRIX.map((entry) => resolveRepoPath(entry.path, rootDir)),
    { rootDir }
  );

  context.assert(exitCode === 1, 'Regression fixture directory fails CLI because negative fixtures exist');
  context.assert(stderr.toString() === '', 'Regression CLI JSON mode keeps stderr empty');
  context.assert(cliReport.files === REGRESSION_MATRIX.length, 'CLI scans all regression matrix .rmt and .rmt.json fixtures');
  context.assert(cliReport.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.syntax.invalid-json'), 'CLI report includes syntax diagnostics');
  context.assert(agentReport.schema === 'xtend.rmt.ai-agent-repair-report.v1', 'Agent regression emits agent report schema');
  context.assert(agentReport.files === REGRESSION_MATRIX.length, 'Agent regression covers full fixture matrix');
  context.assert(agentReport.repairPlan.some((step) => step.diagnosticCode === 'rmt.ref.schedule.unresolved'), 'Agent regression includes repair plan for missing schedules');
  context.assert(agentReport.noOps.some((noop) => noop.diagnosticCode === 'rmt.syntax.invalid-json'), 'Agent regression includes syntax no-op');
}

function runLanguageServerRegressionChecks(context, rootDir) {
  const server = createRmtLanguageServer({ rootDir });

  server.handleMessage({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { rootPath: rootDir }
  });

  REGRESSION_MATRIX.forEach((entry, index) => {
    const filePath = resolveRepoPath(entry.path, rootDir);
    const uri = pathToFileURL(filePath).href;
    const text = readText(entry.path, rootDir);
    const notifications = server.handleMessage({
      jsonrpc: '2.0',
      method: 'textDocument/didOpen',
      params: {
        textDocument: {
          uri,
          languageId: 'rmt',
          version: index + 1,
          text
        }
      }
    });
    const diagnostics = notifications[0].params.diagnostics;

    context.assert(notifications[0].method === 'textDocument/publishDiagnostics', `${entry.id} LSP publishes diagnostics`);
    entry.expectedCodes.forEach((code) => {
      context.assert(diagnostics.some((diagnostic) => diagnostic.code === code), `${entry.id} LSP emits ${code}`);
    });
  });
}

function runMetadataChecks(context, rootDir) {
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtLanguageRegression;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const epic = readText(EPIC_14_PATH, rootDir);
  const architecture = readText(TOOLING_ARCHITECTURE_PATH, rootDir);
  const workpackage = readText(RMT_LANGUAGE_REGRESSION_WP_PATH, rootDir);

  context.assert(metadata && metadata.schema === RMT_LANGUAGE_REGRESSION_SCHEMA, 'package metadata declares regression schema');
  context.assert(metadata && metadata.matrixSchema === RMT_LANGUAGE_REGRESSION_MATRIX_SCHEMA, 'package metadata declares regression matrix schema');
  context.assert(metadata && metadata.workpackage === RMT_LANGUAGE_REGRESSION_WORKPACKAGE, 'package metadata points to WP-E14-13');
  context.assert(metadata && metadata.fixturesDir === RMT_LANGUAGE_REGRESSION_FIXTURES_DIR, 'package metadata points to regression fixtures');
  context.assert(metadata && metadata.suite === RMT_LANGUAGE_REGRESSION_SUITE_PATH, 'package metadata points to regression suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-language-regression --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === RMT_LANGUAGE_REGRESSION_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert(packageManifest.scripts['test:rmt-language-regression'] === 'node scripts/run_xtend_tests.js rmt-language-regression', 'package exposes rmt-language-regression script');
  context.assert(runner.hasSuite("rmt-language-regression"), 'test runner exposes rmt-language-regression suite');
  context.assert(epic.includes('| `WP-E14-13` | P2 | completed | WS8 |'), 'Epic marks WP-E14-13 completed');
  context.assert(epic.includes('WP-E14-14` ist `ready`'), 'Epic hands off WP-E14-14 as ready');
  context.assert(architecture.includes('Implementierungsstand nach `WP-E14-13`'), 'Architecture documents regression matrix status');
  context.assert(architecture.includes(RMT_LANGUAGE_REGRESSION_MATRIX_SCHEMA), 'Architecture documents regression matrix schema');
  context.assert(workpackage.includes('negative Testmatrix'), 'Workpackage documents negative test matrix');
}

function runRmtLanguageRegressionSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-language-regression',
    label: 'Epic 14 RMT Language Regression Matrix'
  });
  const suiteSyntax = syntaxCheckFile(RMT_LANGUAGE_REGRESSION_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_LANGUAGE_REGRESSION_FIXTURES_DIR, rootDir, 'RMT language regression fixtures directory exists');
  assertFileExists(context, RMT_LANGUAGE_REGRESSION_WP_PATH, rootDir, 'WP-E14-13 workpackage document exists');
  REGRESSION_MATRIX.forEach((entry) => {
    assertFileExists(context, entry.path, rootDir, `${entry.id} regression fixture exists`);
  });
  context.assert(suiteSyntax.ok, `RMT language regression suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  runFixtureMatrixChecks(context, rootDir);
  runFuzzRegressionChecks(context, rootDir);
  runCliAndAgentRegressionChecks(context, rootDir);
  runLanguageServerRegressionChecks(context, rootDir);
  runMetadataChecks(context, rootDir);

  return context.result({
    schema: RMT_LANGUAGE_REGRESSION_SCHEMA,
    matrixSchema: RMT_LANGUAGE_REGRESSION_MATRIX_SCHEMA,
    workpackage: RMT_LANGUAGE_REGRESSION_WORKPACKAGE,
    fixturesDir: RMT_LANGUAGE_REGRESSION_FIXTURES_DIR,
    suite: RMT_LANGUAGE_REGRESSION_SUITE_PATH
  });
}

function printRmtLanguageRegressionReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 14 RMT Language Regression Matrix erfolgreich.',
    failureTitle: 'Epic 14 RMT Language Regression Matrix fehlgeschlagen:'
  });
}

module.exports = {
  RMT_LANGUAGE_REGRESSION_FIXTURES_DIR,
  RMT_LANGUAGE_REGRESSION_MATRIX_SCHEMA,
  RMT_LANGUAGE_REGRESSION_PACKAGE_SCRIPT,
  RMT_LANGUAGE_REGRESSION_SCHEMA,
  RMT_LANGUAGE_REGRESSION_SUITE_PATH,
  RMT_LANGUAGE_REGRESSION_WORKPACKAGE,
  printRmtLanguageRegressionReport,
  runRmtLanguageRegressionSuite
};
