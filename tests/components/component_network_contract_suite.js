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
  COMPONENT_CONTRACT_V2_SCHEMA,
  COMPONENT_NETWORK_ASSERTIONS,
  COMPONENT_NETWORK_CONTEXTS,
  COMPONENT_NETWORK_CONTRACT_SCHEMA,
  COMPONENT_NETWORK_PROFILES,
  COMPONENT_NETWORK_REPORT_SCHEMA,
  COMPONENT_NETWORK_REQUIRED_COMMANDS,
  COMPONENT_NETWORK_REQUIRED_DOMAINS,
  COMPONENT_NETWORK_REQUIRED_EVENTS,
  COMPONENT_NETWORK_WORKPACKAGE,
  COMPONENT_SHELL_CONTRACT_SCHEMA,
  COMPONENT_STYLING_CONTRACT_SCHEMA,
  COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA,
  FABRIC_BOUNDARY_SCHEMA,
  KERNEL_BOUNDARY,
  RMT_NETWORK_AUTHORING_SCHEMA,
  RUNTIME_A11Y_CONTRACT_SCHEMA,
  createComponentNetworkContract,
  validateComponentNetworkContract
} = require('../../xtend-builder/typing/component-network-contract');

function commandNames(contract) {
  return contract.commands.required.map((command) => command.name);
}

function eventNames(contract) {
  return contract.events.required.map((event) => event.name);
}

function runComponentNetworkContractSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'component-network-contract',
    label: 'XTend Component Network Contract'
  });
  const packageManifest = readJson('package.json', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText('development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const contractDoc = readText('development/XTend-Component-Network-Compatibility-Contract.md', rootDir);
  const workpackage = readText('development/WP-E11-06-Component-Network-Contract-definieren.md', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.componentNetworkContract;
  const formControl = createComponentNetworkContract({ tag: 'x-input', profiles: ['form-control'] });
  const formContainer = createComponentNetworkContract({ tag: 'x-form', profiles: ['form-container'] });
  const overlay = createComponentNetworkContract({ tag: 'x-dialog', profiles: ['overlay-surface'] });
  const router = createComponentNetworkContract({ tag: 'x-router', profiles: ['router-outlet'] });
  const feedback = createComponentNetworkContract({ tag: 'x-toast', profiles: ['feedback-source'] });
  const theme = createComponentNetworkContract({ tag: 'x-theme', profiles: ['theme-provider'] });
  const mixed = createComponentNetworkContract({ tag: 'x-popover', profiles: ['overlay-surface', 'feedback-consumer'] });
  const validation = validateComponentNetworkContract(overlay);
  const invalidValidation = validateComponentNetworkContract({
    schema: COMPONENT_NETWORK_CONTRACT_SCHEMA,
    tag: 'button',
    profiles: ['unknown'],
    events: {
      required: [{ name: 'value-change', bubbles: false, composed: false }]
    },
    commands: {
      required: [{ name: 'focus', diagnosticsFirst: false }]
    },
    contexts: {
      noImplicitGlobals: false
    },
    forms: {
      controlsRegisterByEvent: false
    },
    validation: {
      feedbackEvent: 'toast'
    },
    overlays: {
      stackContext: 'global'
    },
    routing: {
      xrouterAdapter: 'custom'
    },
    theme: {
      densityPropagation: false
    },
    state: {
      noGlobalMutableSingleton: false
    },
    rmt: {
      kernelBoundary: 'xtend-imports-in-rmt-kernel'
    },
    compatibility: {
      noGlobalMagicState: false
    },
    tests: {
      requiredSuites: []
    }
  });

  context.assert(formControl.schema === COMPONENT_NETWORK_CONTRACT_SCHEMA, 'Network factory emits Component Network schema');
  context.assert(validation.schema === COMPONENT_NETWORK_REPORT_SCHEMA, 'Network validator emits report schema');
  context.assert(validation.ok, 'Network validator accepts a complete overlay contract');
  context.assert(!invalidValidation.ok, 'Network validator rejects invalid network contracts');
  context.assert(formControl.componentContract === COMPONENT_CONTRACT_V2_SCHEMA, 'Network binds Component Contract v2');
  context.assert(formControl.shellContract === COMPONENT_SHELL_CONTRACT_SCHEMA, 'Network binds Component Shell Contract');
  context.assert(formControl.stylingContract === COMPONENT_STYLING_CONTRACT_SCHEMA, 'Network binds Component Styling Contract');
  context.assert(formControl.runtimeA11yContract === RUNTIME_A11Y_CONTRACT_SCHEMA, 'Network binds Runtime A11y Contract');
  context.assert(formControl.uxPerformanceContract === COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA, 'Network binds UX Performance Contract');
  context.assert(formControl.primaryProfile === 'form-control', 'Form control derives primary form-control profile');
  context.assert(formControl.lane === 'user-blocking', 'Form control derives user-blocking lane');
  context.assert(formControl.forms.formAssociation === true, 'Form control enables form association');
  context.assert(eventNames(formControl).includes('xtend:value-change'), 'Form control exposes value-change event');
  context.assert(eventNames(formControl).includes('xtend:validation-change'), 'Form control exposes validation-change event');
  context.assert(commandNames(formControl).includes('validate'), 'Form control exposes validate command');
  context.assert(commandNames(formControl).includes('reset'), 'Form control exposes reset command');
  context.assert(formContainer.forms.controlsRegisterByEvent === true, 'Form container registers controls by event');
  context.assert(eventNames(formContainer).includes('xtend:form-submit'), 'Form container exposes form-submit event');
  context.assert(commandNames(formContainer).includes('submit'), 'Form container exposes submit command');
  context.assert(overlay.overlays.stackContext === 'xtend.overlay.stack.v1', 'Overlay uses shared overlay stack context');
  context.assert(overlay.overlays.escapePolicy === 'topmost-dismissible-only', 'Overlay keeps topmost escape policy');
  context.assert(eventNames(overlay).includes('xtend:overlay-open'), 'Overlay exposes open event');
  context.assert(eventNames(overlay).includes('xtend:overlay-close'), 'Overlay exposes close event');
  context.assert(router.routing.xrouterAdapter === 'xtend.xrouter', 'Router profile uses XRouter adapter');
  context.assert(router.routing.focusRestoreRequired === true, 'Router profile requires focus restore');
  context.assert(eventNames(router).includes('xtend:route-change'), 'Router profile exposes route-change event');
  context.assert(feedback.lane === 'a11y', 'Feedback source derives a11y lane');
  context.assert(feedback.feedback.liveRegionContract === 'xtend.a11y.screenreader-signals.v1', 'Feedback source binds screenreader signals');
  context.assert(commandNames(feedback).includes('announce'), 'Feedback source exposes announce command');
  context.assert(theme.theme.densityPropagation === true, 'Theme provider propagates density');
  context.assert(theme.theme.tokenPropagation === true, 'Theme provider propagates tokens');
  context.assert(mixed.fabric.lane === 'user-blocking', 'Mixed overlay/feedback contract keeps interaction lane priority');
  context.assert(mixed.fabric.diagnostics.includes('network.context.missing'), 'Network exposes missing context diagnostic');
  context.assert(formControl.rmt.schema === RMT_NETWORK_AUTHORING_SCHEMA, 'Network prepares RMT Component Network Authoring schema');
  context.assert(formControl.rmt.kernelBoundary === KERNEL_BOUNDARY, 'Network keeps RMT kernel boundary');
  context.assert(formControl.rmt.fields.includes('commands'), 'RMT authoring includes commands field');
  context.assert(formControl.fabric.schema === FABRIC_BOUNDARY_SCHEMA, 'Network binds Fabric boundary');
  context.assert(formControl.compatibility.hostModes.includes('react'), 'Network remains React-host compatible');
  context.assert(formControl.compatibility.hostModes.includes('vue'), 'Network remains Vue-host compatible');
  context.assert(formControl.compatibility.noGlobalMagicState === true, 'Network forbids global magic state');
  context.assert(formControl.compatibility.noCdnDependency === true, 'Network forbids CDN dependency');
  context.assert(COMPONENT_NETWORK_REQUIRED_DOMAINS.includes('routing'), 'Required domains include routing');
  context.assert(COMPONENT_NETWORK_REQUIRED_DOMAINS.includes('fabric'), 'Required domains include Fabric');
  context.assert(COMPONENT_NETWORK_CONTEXTS.includes('diagnostics'), 'Required contexts include diagnostics');
  context.assert(COMPONENT_NETWORK_PROFILES.includes('overlay-surface'), 'Profiles include overlay-surface');
  context.assert(COMPONENT_NETWORK_REQUIRED_EVENTS.includes('xtend:route-change'), 'Required events include route-change');
  context.assert(COMPONENT_NETWORK_REQUIRED_COMMANDS.includes('snapshot'), 'Required commands include snapshot');
  context.assert(COMPONENT_NETWORK_ASSERTIONS.includes('no-global-magic-state'), 'Required assertions forbid global magic state');
  context.assert(packageManifest.exports['./builder/typing/component-network-contract'] === './xtend-builder/typing/component-network-contract.js', 'Package exports Component Network Contract module');
  context.assert(packageManifest.scripts['test:component-network-contract'] === 'node scripts/run_xtend_tests.js component-network-contract', 'Package exposes Component Network test script');
  context.assert(metadata && metadata.schema === COMPONENT_NETWORK_CONTRACT_SCHEMA, 'Package metadata exposes Component Network schema');
  context.assert(metadata.reportSchema === COMPONENT_NETWORK_REPORT_SCHEMA, 'Package metadata exposes Component Network report schema');
  context.assert(metadata.workpackage === COMPONENT_NETWORK_WORKPACKAGE, 'Package metadata exposes WP-E11-06 owner');
  context.assert(metadata.contract === 'development/XTend-Component-Network-Compatibility-Contract.md', 'Package metadata exposes Component Network contract doc path');
  context.assert(metadata.module === 'xtend-builder/typing/component-network-contract.js', 'Package metadata exposes Component Network module path');
  context.assert(metadata.rmtNetworkAuthoring === RMT_NETWORK_AUTHORING_SCHEMA, 'Package metadata exposes RMT Network Authoring schema');
  context.assert(metadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata keeps RMT kernel boundary');
  context.assert(Array.isArray(metadata.requiredProfiles) && metadata.requiredProfiles.includes('form-control'), 'Package metadata exposes form-control profile');
  context.assert(Array.isArray(metadata.requiredEvents) && metadata.requiredEvents.includes('xtend:feedback-request'), 'Package metadata exposes feedback request event');
  context.assert(Array.isArray(metadata.requiredCommands) && metadata.requiredCommands.includes('navigate'), 'Package metadata exposes navigate command');
  context.assert(Array.isArray(metadata.requiredAssertions) && metadata.requiredAssertions.includes('events-composed-bubbling'), 'Package metadata exposes event propagation assertion');
  context.assertIncludes(scaffoldConfig, 'componentNetworkContract', 'Scaffold config exposes Component Network Contract section');
  context.assertIncludes(scaffoldConfig, COMPONENT_NETWORK_CONTRACT_SCHEMA, 'Scaffold config declares Component Network schema');
  context.assertIncludes(scaffoldConfig, 'component-network-contract', 'Scaffold config references Component Network gate');
  context.assertIncludes(runner, "id: 'component-network-contract'", 'Runner exposes Component Network suite');
  context.assertIncludes(contractDoc, COMPONENT_NETWORK_CONTRACT_SCHEMA, 'Contract document declares Component Network schema');
  context.assertIncludes(contractDoc, 'XtendComponentNetworkContract', 'Contract document defines the TypeScript interface name');
  context.assertIncludes(contractDoc, RMT_NETWORK_AUTHORING_SCHEMA, 'Contract document declares RMT Network Authoring handoff');
  context.assertIncludes(contractDoc, KERNEL_BOUNDARY, 'Contract document keeps RMT kernel boundary visible');
  context.assertIncludes(contractDoc, '`events-composed-bubbling`', 'Contract document lists Network assertions');
  context.assertIncludes(workpackage, 'xtend.epic11.wp06.component-network-contract.v1', 'WP-E11-06 declares workpackage schema');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E11-06 is completed');
  context.assertIncludes(workpackage, 'node scripts/run_xtend_tests.js component-network-contract --json', 'WP-E11-06 documents local gate');
  context.assertIncludes(epic, '| `WP-E11-06` | P0 | completed |', 'Epic 11 marks WP-E11-06 completed');
  context.assertIncludes(epic, '| `WP-E11-07` | P0 | completed |', 'Epic 11 marks WP-E11-07 completed');
  context.assertIncludes(epic, '| `WP-E11-08` | P1 | completed |', 'Epic 11 marks WP-E11-08 completed');
  context.assertIncludes(epic, '| `WP-E11-09` | P1 | completed |', 'Epic 11 marks WP-E11-09 completed');
  context.assertIncludes(epic, '| `WP-E11-10` | P1 | completed |', 'Epic 11 marks WP-E11-10 completed');
  context.assertIncludes(epic, '| `WP-E11-11` | P1 | completed |', 'Epic 11 marks WP-E11-11 completed');
  context.assertIncludes(epic, '| `WP-E11-12` | P1 | completed |', 'Epic 11 marks WP-E11-12 completed');
  context.assertIncludes(epic, '| `WP-E11-13` | P1 | completed |', 'Epic 11 marks WP-E11-13 completed');
  context.assertIncludes(epic, '| `WP-E11-14` | P1 | completed |', 'Epic 11 marks WP-E11-14 completed');
  context.assertIncludes(epic, '| `WP-E11-15` | P1 | completed |', 'Epic 11 marks WP-E11-15 completed');
  context.assertIncludes(epic, '| `WP-E11-16` | P1 | completed |', 'Epic 11 marks WP-E11-16 completed');
  context.assertIncludes(epic, '| `WP-E11-17` | P2 | completed |', 'Epic 11 marks WP-E11-17 completed');
  context.assertIncludes(backlog, '| `WP-E11-06` | P0 | completed | WS4 |', 'Epic 11 backlog marks WP-E11-06 completed');
  context.assertIncludes(backlog, '| `WP-E11-07` | P0 | completed | WS5 |', 'Epic 11 backlog marks WP-E11-07 completed');
  context.assertIncludes(backlog, '| `WP-E11-08` | P1 | completed | WS6 |', 'Epic 11 backlog marks WP-E11-08 completed');
  context.assertIncludes(backlog, '| `WP-E11-09` | P1 | completed | WS6 |', 'Epic 11 backlog marks WP-E11-09 completed');
  context.assertIncludes(backlog, '| `WP-E11-10` | P1 | completed | WS6 |', 'Epic 11 backlog marks WP-E11-10 completed');
  context.assertIncludes(backlog, '| `WP-E11-11` | P1 | completed | WS6 |', 'Epic 11 backlog marks WP-E11-11 completed');
  context.assertIncludes(backlog, '| `WP-E11-12` | P1 | completed | WS6 |', 'Epic 11 backlog marks WP-E11-12 completed');
  context.assertIncludes(backlog, '| `WP-E11-13` | P1 | completed | WS7 |', 'Epic 11 backlog marks WP-E11-13 completed');
  context.assertIncludes(backlog, '| `WP-E11-14` | P1 | completed | WS8 |', 'Epic 11 backlog marks WP-E11-14 completed');
  context.assertIncludes(backlog, '| `WP-E11-15` | P1 | completed | WS8 |', 'Epic 11 backlog marks WP-E11-15 completed');
  context.assertIncludes(backlog, '| `WP-E11-16` | P1 | completed | WS9 |', 'Epic 11 backlog marks WP-E11-16 completed');
  context.assertIncludes(backlog, '| `WP-E11-17` | P2 | completed | WS10 |', 'Epic 11 backlog marks WP-E11-17 completed');
  context.assertIncludes(backlog, 'Handoff nach WP-E11-06', 'Epic 11 backlog documents WP-E11-06 handoff');

  return context.result({
    schema: COMPONENT_NETWORK_CONTRACT_SCHEMA,
    profiles: COMPONENT_NETWORK_PROFILES,
    assertions: COMPONENT_NETWORK_ASSERTIONS
  });
}

function printComponentNetworkContractReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Component Network Contract erfolgreich.',
    failureTitle: 'XTend Component Network Contract fehlgeschlagen:'
  });
}

module.exports = {
  printComponentNetworkContractReport,
  runComponentNetworkContractSuite
};
