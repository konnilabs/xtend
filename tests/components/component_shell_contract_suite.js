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
  COMPONENT_SHELL_CONTRACT_SCHEMA,
  COMPONENT_SHELL_REPORT_SCHEMA,
  COMPONENT_SHELL_WORKPACKAGE,
  RMT_SHELL_AUTHORING_SCHEMA,
  KERNEL_BOUNDARY,
  SHELL_REQUIRED_DOMAINS,
  SHELL_DOM_MODES,
  SHELL_REQUIRED_STATES,
  SHELL_DEFAULT_SLOTS,
  SHELL_DEFAULT_PARTS,
  SHELL_FOCUS_STRATEGIES,
  createComponentShellContract,
  validateComponentShellContract
} = require('../../xtend-builder/typing/component-shell-contract');

function runComponentShellContractSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'component-shell-contract',
    label: 'XTend Component Shell Contract'
  });
  const packageManifest = readJson('package.json', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText('development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const contractDoc = readText('development/XTend-Component-Shell-Contract.md', rootDir);
  const workpackage = readText('development/WP-E11-02-Component-Shell-Contract-spezifizieren.md', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.componentShellContract;
  const sample = createComponentShellContract({
    tag: 'x-select',
    dom: {
      mode: 'shadow',
      delegatesFocus: true,
      formAssociated: true
    },
    focus: {
      strategy: 'delegates-focus',
      restoreOnRouteChange: true
    },
    states: ['open', 'selected'],
    slots: ['default', 'label', 'helper', 'error', 'option'],
    parts: ['root', 'control', 'label', 'content', 'helper', 'error', 'icon', 'listbox', 'option'],
    tokens: ['--xtend-select-color', '--xtend-select-surface', '--xtend-select-gap']
  });
  const validation = validateComponentShellContract(sample);
  const invalidValidation = validateComponentShellContract({
    schema: COMPONENT_SHELL_CONTRACT_SCHEMA,
    tag: 'select',
    dom: {
      mode: 'remote'
    },
    states: ['ready'],
    slots: [],
    parts: [],
    tokens: [],
    focus: {
      strategy: 'unknown',
      visibleFocusRequired: false
    },
    rmt: {
      kernelBoundary: 'xtend-imports-in-rmt-kernel'
    }
  });

  context.assert(sample.schema === COMPONENT_SHELL_CONTRACT_SCHEMA, 'Shell factory emits Component Shell Contract schema');
  context.assert(validation.schema === COMPONENT_SHELL_REPORT_SCHEMA, 'Shell validator emits shell report schema');
  context.assert(validation.ok, 'Shell validator accepts a complete shell contract');
  context.assert(!invalidValidation.ok, 'Shell validator rejects invalid shell contracts');
  context.assert(sample.componentContract === 'xtend.component.contract.v2', 'Shell contract extends Component Contract v2');
  context.assert(sample.uxMaturityModel === 'xtend.component.ux-maturity-model.v1', 'Shell contract binds the Epic 11 UX maturity model');
  context.assert(sample.dom.mode === 'shadow', 'Sample shell supports Shadow DOM mode');
  context.assert(sample.dom.formAssociated === true, 'Sample shell supports form-associated components');
  context.assert(sample.states.includes('ready'), 'Sample shell includes ready state');
  context.assert(sample.states.includes('invalid'), 'Sample shell includes invalid state');
  context.assert(sample.slots.some((slot) => slot.name === 'default'), 'Sample shell exposes default slot');
  context.assert(sample.slots.some((slot) => slot.name === 'error'), 'Sample shell exposes error slot');
  context.assert(sample.parts.some((part) => part.name === 'root'), 'Sample shell exposes root CSS part');
  context.assert(sample.parts.some((part) => part.name === 'control'), 'Sample shell exposes control CSS part');
  context.assert(sample.focus.strategy === 'delegates-focus', 'Sample shell supports delegates-focus strategy');
  context.assert(sample.focus.visibleFocusRequired === true, 'Shell requires visible focus');
  context.assert(sample.a11y.runtimeBehaviorRequired === true, 'Shell makes A11y runtime behavior mandatory');
  context.assert(sample.performance.noLayoutThrashing === true, 'Shell keeps layout-thrashing rule visible');
  context.assert(sample.rmt.schema === RMT_SHELL_AUTHORING_SCHEMA, 'Shell contract prepares RMT Shell Authoring schema');
  context.assert(sample.rmt.templateMode === 'dom_descriptor', 'Shell contract prefers structured RMT DOM descriptors');
  context.assert(sample.rmt.kernelBoundary === KERNEL_BOUNDARY, 'Shell contract keeps RMT kernel boundary');
  context.assert(sample.fabric.api === '@xtend-fabric', 'Shell contract binds Fabric API');
  context.assert(sample.compatibility.hostModes.includes('rmt-first'), 'Shell contract keeps RMT-first compatibility');
  context.assert(SHELL_REQUIRED_DOMAINS.includes('rmt'), 'Required shell domains include RMT');
  context.assert(SHELL_REQUIRED_DOMAINS.includes('fabric'), 'Required shell domains include Fabric');
  context.assert(SHELL_REQUIRED_DOMAINS.includes('a11y'), 'Required shell domains include A11y');
  context.assert(SHELL_REQUIRED_DOMAINS.includes('performance'), 'Required shell domains include Performance');
  context.assert(SHELL_DOM_MODES.includes('hybrid'), 'DOM modes include hybrid migration path');
  context.assert(SHELL_REQUIRED_STATES.includes('busy'), 'Required states include busy');
  context.assert(SHELL_DEFAULT_SLOTS.includes('helper'), 'Default slots include helper');
  context.assert(SHELL_DEFAULT_PARTS.includes('icon'), 'Default parts include icon');
  context.assert(SHELL_FOCUS_STRATEGIES.includes('managed-roving'), 'Focus strategies include managed-roving');
  context.assert((typeof packageManifest.exports['./builder/typing/component-shell-contract'] === 'string' ? packageManifest.exports['./builder/typing/component-shell-contract'] : packageManifest.exports['./builder/typing/component-shell-contract'] && packageManifest.exports['./builder/typing/component-shell-contract'].default) === './xtend-builder/typing/component-shell-contract.js', 'Package exports Component Shell Contract module');
  context.assert(packageManifest.scripts['test:component-shell-contract'] === 'node scripts/run_xtend_tests.js component-shell-contract', 'Package exposes Component Shell Contract test script');
  context.assert(metadata && metadata.schema === COMPONENT_SHELL_CONTRACT_SCHEMA, 'Package metadata exposes Component Shell Contract schema');
  context.assert(metadata.reportSchema === COMPONENT_SHELL_REPORT_SCHEMA, 'Package metadata exposes Component Shell report schema');
  context.assert(metadata.workpackage === COMPONENT_SHELL_WORKPACKAGE, 'Package metadata exposes WP-E11-02 owner');
  context.assert(metadata.contract === 'development/XTend-Component-Shell-Contract.md', 'Package metadata exposes Component Shell Contract doc path');
  context.assert(metadata.module === 'xtend-builder/typing/component-shell-contract.js', 'Package metadata exposes Component Shell Contract module path');
  context.assert(Array.isArray(metadata.requiredDomains) && metadata.requiredDomains.includes('compatibility'), 'Package metadata exposes compatibility as required domain');
  context.assert(Array.isArray(metadata.requiredStates) && metadata.requiredStates.includes('invalid'), 'Package metadata exposes invalid as required state');
  context.assert(metadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata keeps RMT kernel boundary');
  context.assertIncludes(scaffoldConfig, 'componentShellContract', 'Scaffold config exposes Component Shell Contract section');
  context.assertIncludes(scaffoldConfig, 'xtend.component.shell.v1', 'Scaffold config declares Component Shell schema');
  context.assertIncludes(scaffoldConfig, 'component-shell-contract', 'Scaffold config references Component Shell gate');
  context.assertIncludes(runner, "id: 'component-shell-contract'", 'Runner exposes Component Shell Contract suite');
  context.assertIncludes(contractDoc, COMPONENT_SHELL_CONTRACT_SCHEMA, 'Contract document declares Component Shell schema');
  context.assertIncludes(contractDoc, 'XtendComponentShellContract', 'Contract document defines the TypeScript interface name');
  context.assertIncludes(contractDoc, RMT_SHELL_AUTHORING_SCHEMA, 'Contract document declares RMT Shell Authoring handoff');
  context.assertIncludes(contractDoc, KERNEL_BOUNDARY, 'Contract document keeps RMT kernel boundary visible');
  context.assertIncludes(contractDoc, '`empty`, `loading`, `ready`, `error`, `disabled`, `busy`, `invalid`', 'Contract document lists required states');
  context.assertIncludes(workpackage, 'xtend.epic11.wp02.component-shell-contract.v1', 'WP-E11-02 declares workpackage schema');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E11-02 is completed');
  context.assertIncludes(workpackage, 'node scripts/run_xtend_tests.js component-shell-contract --json', 'WP-E11-02 documents local gate');
  context.assertIncludes(epic, '| `WP-E11-02` | P0 | completed |', 'Epic 11 marks WP-E11-02 completed');
  context.assertIncludes(epic, '| `WP-E11-03` | P0 | completed |', 'Epic 11 marks WP-E11-03 completed after Styling Contract');
  context.assertIncludes(backlog, '| `WP-E11-02` | P0 | completed | WS1 |', 'Epic 11 backlog marks WP-E11-02 completed');
  context.assertIncludes(backlog, 'Handoff nach WP-E11-02', 'Epic 11 backlog documents WP-E11-02 handoff');

  return context.result({
    schema: COMPONENT_SHELL_CONTRACT_SCHEMA,
    requiredDomains: SHELL_REQUIRED_DOMAINS,
    requiredStates: SHELL_REQUIRED_STATES
  });
}

function printComponentShellContractReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Component Shell Contract erfolgreich.',
    failureTitle: 'XTend Component Shell Contract fehlgeschlagen:'
  });
}

module.exports = {
  printComponentShellContractReport,
  runComponentShellContractSuite
};
