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
  DIAGNOSTIC_CATALOG,
  RMT_LINTER_DIAGNOSTICS_MODULE_PATH,
  RMT_LINTER_PACKAGE_SCRIPT,
  RMT_LINTER_REPORT_SCHEMA,
  RMT_LINTER_RULES_DIR,
  RMT_LINTER_RULE_ENGINE_SCHEMA,
  RMT_LINTER_SUITE_PATH,
  RMT_LINTER_WORKPACKAGE,
  createRmtLinter,
  lintRmtSource
} = require('../../tools/rmt-language/diagnostics');

const EPIC_14_PATH = 'development/EPIC-14-XTendRMT-DSL-Linter-und-Language-Server.md';
const TOOLING_ARCHITECTURE_PATH = 'development/XTendRMT-DSL-Tooling-Architektur.md';
const RMT_LINTER_WP_PATH = 'development/WP-E14-05-Linter-Rule-Engine-und-Basisregeln-erstellen.md';
const VALID_FIXTURE_PATH = 'xtendrmt/rmt-first-demo-app.rmt';
const RULE_MODULE_PATHS = [
  'tools/rmt-language/rules/index.js',
  'tools/rmt-language/rules/document-policy.js',
  'tools/rmt-language/rules/route-policy.js',
  'tools/rmt-language/rules/template-policy.js',
  'tools/rmt-language/rules/scheduler-policy.js',
  'tools/rmt-language/rules/boundary-policy.js',
  'tools/rmt-language/rules/app-platform-policy.js'
];

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertDiagnosticShape(context, diagnostic, message) {
  context.assert(
    diagnostic
      && diagnostic.schema === 'xtend.rmt.linter.diagnostic.v1'
      && diagnostic.source === 'rmt-linter'
      && diagnostic.code
      && diagnostic.ruleId
      && diagnostic.severity
      && diagnostic.message
      && diagnostic.range
      && diagnostic.range.start
      && diagnostic.range.end
      && diagnostic.repair
      && diagnostic.repair.kind
      && diagnostic.workpackage === RMT_LINTER_WORKPACKAGE,
    message
  );
}

function assertHasCode(context, report, code, message) {
  context.assert(report.diagnostics.some((diagnostic) => diagnostic.code === code), message);
}

function createProblemFixture() {
  return JSON.stringify({
    version: '1.0',
    legacy: true,
    cdn: 'https://cdn.example.invalid/xtend.js',
    adapters: [
      { kind: 'component_adapter' }
    ],
    components: [
      {
        id: 'page.bad',
        adapter: 'missing.adapter',
        tag: 'x-section',
        schedule: 'missing.schedule',
        hydration: { mode: 'teleport' },
        runtimeImport: './components/page-bad.js'
      }
    ],
    routes: [
      {
        id: 'bad',
        path: 'settings',
        router: 'missing.router',
        component: 'page.missing',
        template: 'tpl.missing',
        schedule: 'missing.schedule'
      }
    ],
    schedules: [
      { id: 'route.render', lane: 'visible' }
    ],
    templates: [
      { id: 'tpl.bad', mode: 'vue_sfc', nodes: [{}] },
      { id: 'tpl.html', mode: 'html_fragment', html: '<script>alert(1)</script>' }
    ]
  }, null, 2);
}

function runValidFixtureChecks(context, rootDir) {
  const text = readText(VALID_FIXTURE_PATH, rootDir);
  const report = lintRmtSource({
    text,
    filePath: resolveRepoPath(VALID_FIXTURE_PATH, rootDir),
    version: 5
  }, {
    rootDir
  });

  context.assert(report.schema === RMT_LINTER_REPORT_SCHEMA, 'Linter emits report schema');
  context.assert(report.engineSchema === RMT_LINTER_RULE_ENGINE_SCHEMA, 'Linter emits rule engine schema');
  context.assert(report.workpackage === RMT_LINTER_WORKPACKAGE, 'Linter report belongs to WP-E14-05');
  context.assert(report.status === 'passed', 'Valid RMT-first fixture passes linter');
  context.assert(report.errorCount === 0, 'Valid RMT-first fixture has no linter errors');
  context.assert(report.ruleCount === 6, 'Default linter registers five basis rules plus App Platform policy');
  context.assert(report.graphStatus === 'indexed', 'Linter report exposes graph status instead of graph internals');
  context.assert(!Object.prototype.hasOwnProperty.call(report, 'graph'), 'JSON report does not expose non-deterministic graph internals');
  context.assert(report.manifestHints.documentId === 'demo.xtend.rmt-first-app', 'Linter report exposes manifest hints');
  context.assert(report.diagnostics.every((diagnostic) => diagnostic.severity !== 'error'), 'Valid fixture only produces non-blocking hints');
  context.assert(report.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.a11y.route-announcement.missing'), 'A11y route announcement rule runs on valid fixture');

  const overrideReport = lintRmtSource({
    text,
    filePath: resolveRepoPath(VALID_FIXTURE_PATH, rootDir)
  }, {
    rootDir,
    severityPolicy: {
      'rmt.a11y.route-announcement.missing': 'warning'
    }
  });

  context.assert(overrideReport.warningCount === report.infoCount, 'Severity policy can raise A11y infos to warnings');
}

function runProblemFixtureChecks(context, rootDir) {
  const problemText = createProblemFixture();
  const report = lintRmtSource({
    text: problemText,
    uri: 'file:///virtual/problem.rmt'
  }, {
    rootDir
  });
  const repeatReport = lintRmtSource({
    text: problemText,
    uri: 'file:///virtual/problem.rmt'
  }, {
    rootDir
  });

  context.assert(report.status === 'failed', 'Problem fixture fails linter');
  context.assert(report.errorCount >= 8, 'Problem fixture produces blocking errors');
  context.assert(report.warningCount >= 4, 'Problem fixture produces policy warnings');
  context.assert(report.infoCount >= 2, 'Problem fixture produces non-blocking infos');

  [
    'rmt.document.kind.missing',
    'rmt.domain.unknown',
    'rmt.id.missing',
    'rmt.adapter.unknown',
    'rmt.ref.component.unresolved',
    'rmt.ref.template.unresolved',
    'rmt.ref.schedule.unresolved',
    'rmt.route.path.invalid',
    'rmt.route.document-title.missing',
    'rmt.a11y.route-announcement.missing',
    'rmt.template.mode.unsupported',
    'rmt.template.html-fragment.trust-boundary-missing',
    'rmt.template.inline-script.refused',
    'rmt.xtend.kernel-boundary.violation',
    'rmt.hydration.policy.unknown',
    'rmt.schedule.endpoint.missing',
    'rmt.deprecated.field.used'
  ].forEach((code) => {
    assertHasCode(context, report, code, `Problem fixture emits ${code}`);
  });

  report.diagnostics.forEach((diagnostic) => {
    assertDiagnosticShape(context, diagnostic, `${diagnostic.code} has stable linter diagnostic shape`);
  });
  context.assert(
    JSON.stringify(report.diagnostics) === JSON.stringify(repeatReport.diagnostics),
    'Linter diagnostics JSON output is deterministic for repeated runs'
  );
}

function runFallbackPolicyChecks(context, rootDir) {
  const text = readText(VALID_FIXTURE_PATH, rootDir);
  const report = lintRmtSource({
    text,
    filePath: resolveRepoPath('tests/fixtures/legacy-linter.rmt.json', rootDir)
  }, {
    rootDir
  });
  const fallbackDiagnostic = report.diagnostics.find((diagnostic) => diagnostic.code === 'rmt.document.extension.fallback-used');

  context.assert(!!fallbackDiagnostic, '.rmt.json fallback remains lintable and emits warning');
  context.assert(fallbackDiagnostic.severity === 'warning', 'Fallback diagnostic severity is warning');
  context.assert(fallbackDiagnostic.repair && fallbackDiagnostic.repair.kind === 'rename-file-extension', 'Fallback diagnostic offers rename-file-extension repair');
}

function runCustomRuleChecks(context, rootDir) {
  const linter = createRmtLinter({
    rules: [
      {
        id: 'fixture.custom-rule',
        description: 'Fixture custom rule',
        run(ruleContext) {
          return [
            ruleContext.createDiagnostic({
              code: 'rmt.deprecated.field.used',
              severity: 'hint',
              message: 'Custom rule diagnostic',
              pointer: '/manifest'
            })
          ];
        }
      }
    ]
  });
  const report = linter.lint({
    text: readText(VALID_FIXTURE_PATH, rootDir),
    filePath: resolveRepoPath(VALID_FIXTURE_PATH, rootDir)
  }, {
    rootDir
  });
  const diagnostic = report.diagnostics[0];

  context.assert(report.ruleCount === 1, 'Custom linter can replace default rule registry');
  context.assert(diagnostic && diagnostic.ruleId === 'fixture.custom-rule', 'Custom rule diagnostic keeps ruleId');
  context.assert(diagnostic && diagnostic.severity === 'hint', 'Custom rule diagnostic keeps explicit severity');
}

function runRmtLinterRulesSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-linter-rules',
    label: 'Epic 14 RMT Linter Rule Engine'
  });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtLinterRules;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_14_PATH, rootDir);
  const architecture = readText(TOOLING_ARCHITECTURE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_LINTER_DIAGNOSTICS_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_LINTER_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_LINTER_DIAGNOSTICS_MODULE_PATH, rootDir, 'RMT Linter diagnostics module exists');
  assertFileExists(context, RMT_LINTER_SUITE_PATH, rootDir, 'RMT Linter rule suite exists');
  assertFileExists(context, RMT_LINTER_WP_PATH, rootDir, 'WP-E14-05 workpackage document exists');
  assertFileExists(context, RMT_LINTER_RULES_DIR, rootDir, 'RMT Linter rules directory exists');
  RULE_MODULE_PATHS.forEach((modulePath) => {
    assertFileExists(context, modulePath, rootDir, `${modulePath} exists`);
    const syntax = syntaxCheckFile(modulePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${modulePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });
  context.assert(moduleSyntax.ok, `RMT Linter diagnostics module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `RMT Linter rule suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_LINTER_RULE_ENGINE_SCHEMA, 'package metadata declares RMT Linter Rule Engine schema');
  context.assert(metadata && metadata.reportSchema === RMT_LINTER_REPORT_SCHEMA, 'package metadata declares RMT Linter report schema');
  context.assert(metadata && metadata.workpackage === RMT_LINTER_WORKPACKAGE, 'package metadata points to WP-E14-05');
  context.assert(metadata && metadata.module === RMT_LINTER_DIAGNOSTICS_MODULE_PATH, 'package metadata points to diagnostics module');
  context.assert(metadata && metadata.rulesDir === RMT_LINTER_RULES_DIR, 'package metadata points to rules dir');
  context.assert(metadata && metadata.suite === RMT_LINTER_SUITE_PATH, 'package metadata points to linter suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-linter-rules --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === RMT_LINTER_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert((typeof packageManifest.exports['./rmt-language/diagnostics'] === 'string' ? packageManifest.exports['./rmt-language/diagnostics'] : packageManifest.exports['./rmt-language/diagnostics'] && packageManifest.exports['./rmt-language/diagnostics'].default) === './tools/rmt-language/diagnostics.js', 'package exports RMT Linter diagnostics');
  context.assert(packageManifest.scripts['test:rmt-linter-rules'] === 'node scripts/run_xtend_tests.js rmt-linter-rules', 'package exposes rmt-linter-rules script');
  context.assert(runner.includes("id: 'rmt-linter-rules'"), 'test runner exposes rmt-linter-rules suite');
  context.assert(epic.includes('| `WP-E14-05` | P0 | completed | WS2 |'), 'Epic marks WP-E14-05 completed');
  context.assert(epic.includes('WP-E14-06` ist `ready`'), 'Epic hands off WP-E14-06 as ready');
  context.assert(architecture.includes('Implementierungsstand nach `WP-E14-05`'), 'Architecture documents linter rule engine status');
  context.assert(architecture.includes('xtend.rmt.linter.rule-engine.v1'), 'Architecture documents linter rule engine schema');
  context.assert(DIAGNOSTIC_CATALOG['rmt.template.inline-script.refused'].repair.kind === 'replace-field-value', 'Diagnostic catalog exposes repair hints');

  runValidFixtureChecks(context, rootDir);
  runProblemFixtureChecks(context, rootDir);
  runFallbackPolicyChecks(context, rootDir);
  runCustomRuleChecks(context, rootDir);

  return context.result({
    schema: RMT_LINTER_REPORT_SCHEMA,
    engineSchema: RMT_LINTER_RULE_ENGINE_SCHEMA,
    workpackage: RMT_LINTER_WORKPACKAGE,
    module: RMT_LINTER_DIAGNOSTICS_MODULE_PATH,
    suite: RMT_LINTER_SUITE_PATH
  });
}

function printRmtLinterRulesReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 14 RMT Linter Rule Engine erfolgreich.',
    failureTitle: 'Epic 14 RMT Linter Rule Engine fehlgeschlagen:'
  });
}

module.exports = {
  printRmtLinterRulesReport,
  runRmtLinterRulesSuite
};
