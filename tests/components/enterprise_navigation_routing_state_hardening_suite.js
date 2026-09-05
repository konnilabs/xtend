const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_LOCAL_GATE,
  ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_REPORT_SCHEMA,
  ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_SCHEMA,
  ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_WORKPACKAGE,
  NAVIGATION_ROUTING_STATE_TARGETS,
  REQUIRED_DOC_MARKERS,
  REQUIRED_FIXTURE_MARKERS,
  REQUIRED_NAVIGATION_TOKENS,
  REQUIRED_SOURCE_MARKERS,
  TEXT_GLYPH_CONTROL_PATTERNS,
  createEnterpriseNavigationRoutingStateHardeningReport,
  validateEnterpriseNavigationRoutingStateHardeningReport
} = require('../../catalog/enterprise-navigation-routing-state-hardening');

const NAVIGATION_STATE_HARDENING_MODULE_PATH = 'catalog/enterprise-navigation-routing-state-hardening.js';
const NAVIGATION_STATE_HARDENING_SUITE_PATH = 'tests/components/enterprise_navigation_routing_state_hardening_suite.js';
const BACKLOG_PATH = 'development/XTend-Enterprise-Component-Flexibilitaets-und-Theme-Hardening-Backlog.md';

function assertIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assert(source.includes(entry), `${label} includes ${entry}`);
  });
}

function runEnterpriseNavigationRoutingStateHardeningSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'enterprise-navigation-routing-state-hardening',
    label: 'ECH-WP-09 Enterprise Navigation Routing State Hardening'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const moduleSource = readText(NAVIGATION_STATE_HARDENING_MODULE_PATH, rootDir);
  const suiteSource = readText(NAVIGATION_STATE_HARDENING_SUITE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(NAVIGATION_STATE_HARDENING_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(NAVIGATION_STATE_HARDENING_SUITE_PATH, { rootDir, extension: '.js' });
  const report = createEnterpriseNavigationRoutingStateHardeningReport({ rootDir });
  const validation = validateEnterpriseNavigationRoutingStateHardeningReport(report);
  const invalidValidation = validateEnterpriseNavigationRoutingStateHardeningReport({
    schema: ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_SCHEMA,
    reportSchema: ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_REPORT_SCHEMA,
    workpackage: ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_WORKPACKAGE,
    localGate: ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_LOCAL_GATE,
    requiredTokens: [],
    targets: [],
    findings: [],
    summary: { total: 0 },
    ok: true
  });

  context.assert(moduleSyntax.ok, `Navigation state hardening module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Navigation state hardening suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(report.schema === ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_SCHEMA, 'Navigation state hardening report emits source schema');
  context.assert(report.reportSchema === ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_REPORT_SCHEMA, 'Navigation state hardening report emits report schema');
  context.assert(report.workpackage === ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_WORKPACKAGE, 'Navigation state hardening report binds ECH-WP-09');
  context.assert(report.localGate === ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_LOCAL_GATE, 'Navigation state hardening report exposes local gate');
  context.assert(validation.ok === true, 'Navigation state hardening validator accepts generated report');
  context.assert(invalidValidation.ok === false, 'Navigation state hardening validator rejects incomplete reports');
  context.assert(report.ok === true, 'Navigation state hardening audit has no blocking findings');
  context.assert(report.summary.total === 0, 'Navigation state hardening audit reports zero findings');
  context.assert(report.targets.length === NAVIGATION_ROUTING_STATE_TARGETS.length, 'Navigation state hardening report covers all target components');
  assertIncludesAll(context, report.requiredTokens, REQUIRED_NAVIGATION_TOKENS, 'Navigation state hardening required tokens');
  assertIncludesAll(context, report.requiredSourceMarkers, REQUIRED_SOURCE_MARKERS, 'Navigation state hardening source markers');
  assertIncludesAll(context, report.requiredDocMarkers, REQUIRED_DOC_MARKERS, 'Navigation state hardening doc markers');
  assertIncludesAll(context, report.requiredFixtureMarkers, REQUIRED_FIXTURE_MARKERS, 'Navigation state hardening fixture markers');

  NAVIGATION_ROUTING_STATE_TARGETS.forEach((target) => {
    const source = readText(target.file, rootDir);
    const docs = readText(target.docs, rootDir);
    const fixture = readText(target.fixture, rootDir);
    const syntax = syntaxCheckFile(target.file, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${target.tag} source syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
    context.assert(report.targets.some((entry) => entry.tag === target.tag), `Navigation state hardening report includes ${target.tag}`);
    assertIncludesAll(context, source, REQUIRED_NAVIGATION_TOKENS, `${target.tag} source navigation tokens`);
    assertIncludesAll(context, source, REQUIRED_SOURCE_MARKERS, `${target.tag} source markers`);
    assertIncludesAll(context, docs, REQUIRED_DOC_MARKERS, `${target.tag} docs markers`);
    assertIncludesAll(context, docs, REQUIRED_NAVIGATION_TOKENS, `${target.tag} docs token table`);
    assertIncludesAll(context, fixture, REQUIRED_FIXTURE_MARKERS, `${target.tag} foreign theme fixture`);
    target.requiredEvents.forEach((marker) => {
      context.assert(source.includes(marker), `${target.tag} source exposes event ${marker}`);
    });
    target.requiredCommands.forEach((marker) => {
      context.assert(source.includes(marker), `${target.tag} source exposes command ${marker}`);
    });
    target.iconMarkers.forEach((marker) => {
      context.assert(source.includes(marker) || fixture.includes(marker), `${target.tag} disclosure/menu state uses icon marker ${marker}`);
    });
    TEXT_GLYPH_CONTROL_PATTERNS.forEach((pattern) => {
      context.assert(!source.includes(pattern), `${target.tag} avoids text glyph control pattern ${pattern}`);
    });
  });

  assertIncludesAll(context, moduleSource, [
    ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_SCHEMA,
    'createEnterpriseNavigationRoutingStateHardeningReport',
    'validateEnterpriseNavigationRoutingStateHardeningReport',
    'NAVIGATION_ROUTING_STATE_TARGETS',
    'REQUIRED_NAVIGATION_TOKENS'
  ], 'Navigation state hardening module source');
  context.assertIncludes(suiteSource, 'ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_REPORT_SCHEMA', 'Navigation state hardening suite declares report schema');
  context.assertIncludes(backlog, '| `ECH-WP-09` | P1 | completed |', 'Backlog marks ECH-WP-09 completed');
  context.assertIncludes(backlog, ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_LOCAL_GATE, 'Backlog exposes Navigation state hardening local gate');
  context.assert(runner.hasSuite("enterprise-navigation-routing-state-hardening"), 'Runner exposes Navigation state hardening suite');
  context.assert(runner.hasImplementation({ function: "runEnterpriseNavigationRoutingStateHardeningSuite" }), 'Runner imports Navigation state hardening suite');
  context.assert(packageManifest.scripts['test:enterprise-navigation-routing-state-hardening'] === 'node scripts/run_xtend_tests.js enterprise-navigation-routing-state-hardening', 'Package exposes Navigation state hardening script');

  return context.result({
    report: {
      schema: ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_REPORT_SCHEMA,
      workpackage: ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_WORKPACKAGE,
      targetCount: NAVIGATION_ROUTING_STATE_TARGETS.length,
      tokenCount: REQUIRED_NAVIGATION_TOKENS.length,
      findingCount: report.summary.total,
      localGate: ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_LOCAL_GATE
    }
  });
}

function printEnterpriseNavigationRoutingStateHardeningReport(result) {
  printSuiteReport(result, {
    successTitle: 'ECH-WP-09 Enterprise Navigation Routing State Hardening erfolgreich.',
    failureTitle: 'ECH-WP-09 Enterprise Navigation Routing State Hardening fehlgeschlagen:'
  });
}

module.exports = {
  BACKLOG_PATH,
  NAVIGATION_STATE_HARDENING_MODULE_PATH,
  NAVIGATION_STATE_HARDENING_SUITE_PATH,
  printEnterpriseNavigationRoutingStateHardeningReport,
  runEnterpriseNavigationRoutingStateHardeningSuite
};
