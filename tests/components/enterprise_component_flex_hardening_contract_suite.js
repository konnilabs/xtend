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
  COMPONENT_SHELL_CONTRACT_SCHEMA,
  COMPONENT_STYLING_CONTRACT_SCHEMA,
  ENTERPRISE_COMPONENT_FLEX_HARDENING_CONTRACT_DOC,
  ENTERPRISE_COMPONENT_FLEX_HARDENING_REPORT_SCHEMA,
  ENTERPRISE_COMPONENT_FLEX_HARDENING_SCHEMA,
  ENTERPRISE_COMPONENT_FLEX_HARDENING_WORKPACKAGE,
  FLEX_HARDENING_REQUIRED_DOMAINS,
  FLEX_HARDENING_REQUIRED_GATES,
  FLEX_HARDENING_RULE_IDS,
  FLEX_HARDENING_THEME_MODES,
  FLEX_HARDENING_TYPOGRAPHY_ROLES,
  FLEX_HARDENING_XHEADER_MENU_MODES,
  KERNEL_BOUNDARY,
  RUNTIME_A11Y_CONTRACT_SCHEMA,
  SIGNATURE_UI_DIRECTION_SCHEMA,
  createEnterpriseComponentFlexHardeningContract,
  validateEnterpriseComponentFlexHardeningContract
} = require('../../xtend-builder/typing/enterprise-component-flex-hardening-contract');

const CONTRACT_MODULE_PATH = 'xtend-builder/typing/enterprise-component-flex-hardening-contract.js';
const CONTRACT_TYPES_PATH = 'xtend-builder/typing/enterprise-component-flex-hardening-contract.d.ts';
const CONTRACT_SUITE_PATH = 'tests/components/enterprise_component_flex_hardening_contract_suite.js';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js enterprise-component-flex-hardening-contract --json';

function assertIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assert(source.includes(entry), `${label} includes ${entry}`);
  });
}

function runEnterpriseComponentFlexHardeningContractSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'enterprise-component-flex-hardening-contract',
    label: 'ECH-WP-01 Enterprise Component Flex Hardening Contract'
  });
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(ENTERPRISE_COMPONENT_FLEX_HARDENING_CONTRACT_DOC, rootDir);
  const direction = readText('development/XTend-Signature-UI-und-Typografie-Designrichtung.md', rootDir);
  const signatureSuite = readText('tests/browser/signature_ui_visual_quality_suite.js', rootDir);
  const signatureFixture = readText('tests/browser/fixtures/xtend-signature-ui-smoke.html', rootDir);
  const xHeaderSource = readText('components/xheader.js', rootDir);
  const moduleSource = readText(CONTRACT_MODULE_PATH, rootDir);
  const typesSource = readText(CONTRACT_TYPES_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(CONTRACT_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(CONTRACT_SUITE_PATH, { rootDir, extension: '.js' });
  const sample = createEnterpriseComponentFlexHardeningContract();
  const validation = validateEnterpriseComponentFlexHardeningContract(sample);
  const invalidValidation = validateEnterpriseComponentFlexHardeningContract({
    schema: ENTERPRISE_COMPONENT_FLEX_HARDENING_SCHEMA,
    reportSchema: ENTERPRISE_COMPONENT_FLEX_HARDENING_REPORT_SCHEMA,
    workpackage: ENTERPRISE_COMPONENT_FLEX_HARDENING_WORKPACKAGE,
    sourceContracts: [COMPONENT_SHELL_CONTRACT_SCHEMA],
    rules: [{ id: 'R1' }],
    publicOverridePolicy: { noVisualHardcodingWithoutOverride: false },
    themeCompatibility: { requiredModes: ['light'] },
    signatureDefault: { required: false },
    typography: { required: false, roles: ['body'] },
    controlIconography: { noTextGlyphControls: false },
    layoutVariants: { publicApiRequired: false },
    xHeaderPilot: { requiredMenuModes: ['drawer'] },
    gates: { required: ['components'] },
    handoff: { kernelBoundary: 'xtend-imports-in-rmt-kernel', localOnly: false }
  });

  context.assert(moduleSyntax.ok, `Enterprise Flex Hardening module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Enterprise Flex Hardening suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(sample.schema === ENTERPRISE_COMPONENT_FLEX_HARDENING_SCHEMA, 'Factory emits Enterprise Flex Hardening schema');
  context.assert(sample.reportSchema === ENTERPRISE_COMPONENT_FLEX_HARDENING_REPORT_SCHEMA, 'Factory emits Enterprise Flex Hardening report schema');
  context.assert(sample.workpackage === ENTERPRISE_COMPONENT_FLEX_HARDENING_WORKPACKAGE, 'Factory binds ECH-WP-01');
  context.assert(validation.schema === ENTERPRISE_COMPONENT_FLEX_HARDENING_REPORT_SCHEMA, 'Validator emits report schema');
  context.assert(validation.ok === true, 'Validator accepts the generated contract');
  context.assert(invalidValidation.ok === false, 'Validator rejects incomplete hardening contracts');
  context.assert(validation.ruleCount >= 12, 'Validator reports all twelve rules');
  assertIncludesAll(context, sample.sourceContracts, [
    COMPONENT_SHELL_CONTRACT_SCHEMA,
    COMPONENT_STYLING_CONTRACT_SCHEMA,
    RUNTIME_A11Y_CONTRACT_SCHEMA,
    SIGNATURE_UI_DIRECTION_SCHEMA
  ], 'Source contracts');
  assertIncludesAll(context, sample.rules.map((rule) => rule.id), FLEX_HARDENING_RULE_IDS, 'Rule set');
  assertIncludesAll(context, Object.keys(sample), FLEX_HARDENING_REQUIRED_DOMAINS, 'Contract domains');
  context.assert(sample.publicOverridePolicy.noVisualHardcodingWithoutOverride === true, 'Contract forbids visual hardcoding without override');
  context.assert(sample.publicOverridePolicy.cssPartsPublicApi === true, 'Contract treats CSS Parts as Public API');
  assertIncludesAll(context, sample.themeCompatibility.requiredModes, FLEX_HARDENING_THEME_MODES, 'Theme compatibility modes');
  context.assert(sample.signatureDefault.required === true, 'Contract requires Signature Default UI');
  context.assert(sample.signatureDefault.antiPatterns.includes('tailwind-lookalike'), 'Contract rejects Tailwind-lookalike defaults');
  assertIncludesAll(context, sample.typography.roles, FLEX_HARDENING_TYPOGRAPHY_ROLES, 'Typography roles');
  context.assert(sample.typography.corporateFontBridgeRequired === true, 'Contract requires Corporate Font Bridge');
  context.assert(sample.controlIconography.noTextGlyphControls === true, 'Contract forbids text glyph controls');
  context.assert(sample.layoutVariants.publicApiRequired === true, 'Contract requires public layout variant APIs');
  assertIncludesAll(context, sample.xHeaderPilot.requiredMenuModes, FLEX_HARDENING_XHEADER_MENU_MODES, 'XHeader pilot menu modes');
  assertIncludesAll(context, sample.gates.required, FLEX_HARDENING_REQUIRED_GATES, 'Required gates');
  context.assert(sample.handoff.kernelBoundary === KERNEL_BOUNDARY, 'Contract preserves RMT kernel boundary');

  assertIncludesAll(context, moduleSource, [
    ENTERPRISE_COMPONENT_FLEX_HARDENING_SCHEMA,
    ENTERPRISE_COMPONENT_FLEX_HARDENING_REPORT_SCHEMA,
    'createEnterpriseComponentFlexHardeningContract',
    'validateEnterpriseComponentFlexHardeningContract',
    'tailwind-lookalike',
    'noTextGlyphControls'
  ], 'Contract module source');
  assertIncludesAll(context, typesSource, [
    'ENTERPRISE_COMPONENT_FLEX_HARDENING_SCHEMA',
    'createEnterpriseComponentFlexHardeningContract',
    'validateEnterpriseComponentFlexHardeningContract'
  ], 'Contract public types');

  context.assertIncludes(backlog, '| `ECH-WP-01` | P0 | completed |', 'Backlog marks ECH-WP-01 completed');
  context.assertIncludes(backlog, LOCAL_GATE, 'Backlog exposes Enterprise Flex Hardening local gate');
  context.assertIncludes(backlog, CONTRACT_MODULE_PATH, 'Backlog links Enterprise Flex Hardening module');
  context.assertIncludes(backlog, CONTRACT_SUITE_PATH, 'Backlog links Enterprise Flex Hardening suite');
  assertIncludesAll(context, backlog, FLEX_HARDENING_RULE_IDS.map((ruleId) => `### ${ruleId}:`), 'Backlog rule sections');
  context.assertIncludes(backlog, 'Sichtbare Design-Ambition', 'Backlog documents visible design ambition');
  context.assertIncludes(backlog, 'ECH-WP-02', 'Backlog hands off to ECH-WP-02');
  context.assertIncludes(backlog, 'ECH-WP-05', 'Backlog hands off to ECH-WP-05');

  context.assertIncludes(direction, 'Status: Completed', 'Signature direction is completed before ECH-WP-01 closes');
  context.assertIncludes(signatureSuite, 'xtend.signature-ui.visual-quality-report.v1', 'Signature visual quality suite exists');
  context.assertIncludes(signatureFixture, 'xtend.signature-ui.visual-quality.v1', 'Signature visual quality fixture exists');
  assertIncludesAll(context, xHeaderSource, [
    '--xtend-header-surface',
    '--xtend-signature-surface-panel',
    '--xtend-font-family-body'
  ], 'x-header pilot signature token consumption');
  context.assertIncludes(runner, "id: 'enterprise-component-flex-hardening-contract'", 'Runner exposes Enterprise Flex Hardening suite');
  context.assertIncludes(runner, 'runEnterpriseComponentFlexHardeningContractSuite', 'Runner imports Enterprise Flex Hardening suite');
  context.assert(packageManifest.scripts['test:enterprise-component-flex-hardening-contract'] === 'node scripts/run_xtend_tests.js enterprise-component-flex-hardening-contract', 'Package exposes Enterprise Flex Hardening test script');

  return context.result({
    report: {
      schema: ENTERPRISE_COMPONENT_FLEX_HARDENING_REPORT_SCHEMA,
      workpackage: ENTERPRISE_COMPONENT_FLEX_HARDENING_WORKPACKAGE,
      ruleCount: FLEX_HARDENING_RULE_IDS.length,
      gateCount: FLEX_HARDENING_REQUIRED_GATES.length,
      localGate: LOCAL_GATE
    }
  });
}

function printEnterpriseComponentFlexHardeningContractReport(result) {
  printSuiteReport(result, {
    successTitle: 'ECH-WP-01 Enterprise Component Flex Hardening Contract erfolgreich.',
    failureTitle: 'ECH-WP-01 Enterprise Component Flex Hardening Contract fehlgeschlagen:'
  });
}

module.exports = {
  LOCAL_GATE,
  printEnterpriseComponentFlexHardeningContractReport,
  runEnterpriseComponentFlexHardeningContractSuite
};
