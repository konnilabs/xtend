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
  COMPONENT_NETWORK_CONTRACT_SCHEMA,
  COMPONENT_SHELL_CONTRACT_SCHEMA,
  COMPONENT_STYLING_CONTRACT_SCHEMA,
  COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA,
  FABRIC_BOUNDARY_SCHEMA,
  KERNEL_BOUNDARY,
  RMT_A11Y_AUTHORING_SCHEMA,
  RMT_NETWORK_AUTHORING_SCHEMA,
  RMT_PERFORMANCE_AUTHORING_SCHEMA,
  RMT_SHELL_AUTHORING_ASSERTIONS,
  RMT_SHELL_AUTHORING_FIELDS,
  RMT_SHELL_AUTHORING_FIXTURE,
  RMT_SHELL_AUTHORING_REPORT_SCHEMA,
  RMT_SHELL_AUTHORING_REQUIRED_ADAPTERS,
  RMT_SHELL_AUTHORING_REQUIRED_DOMAINS,
  RMT_SHELL_AUTHORING_REQUIRED_SCHEDULES,
  RMT_SHELL_AUTHORING_SCHEMA,
  RMT_SHELL_AUTHORING_WORKPACKAGE,
  RMT_STYLE_AUTHORING_SCHEMA,
  RUNTIME_A11Y_CONTRACT_SCHEMA,
  createRmtShellAuthoringContract,
  validateRmtShellAuthoringContract
} = require('../../xtend-builder/typing/rmt-shell-authoring-contract');

function indexById(records) {
  return new Map((Array.isArray(records) ? records : []).map((record) => [record.id, record]));
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertFixtureReferencesResolve(context, fixture) {
  const components = indexById(fixture.components);
  const templates = indexById(fixture.templates);
  const schedules = indexById(fixture.schedules);
  const adapters = indexById(fixture.adapters);

  (fixture.components || []).forEach((component) => {
    context.assert(adapters.has(component.adapter), `${component.id}: adapter resolves`);
    context.assert(templates.has(component.template), `${component.id}: template resolves`);
    context.assert(schedules.has(component.schedule), `${component.id}: schedule resolves`);
    Object.values(component.commands || {}).forEach((command) => {
      context.assert(schedules.has(command.schedule), `${component.id}: command schedule ${command.schedule} resolves`);
    });
    Object.values(component.shell && component.shell.slots ? component.shell.slots : {}).forEach((slot) => {
      if (slot.template) context.assert(templates.has(slot.template), `${component.id}: slot template ${slot.template} resolves`);
      if (slot.component) context.assert(components.has(slot.component), `${component.id}: slot component ${slot.component} resolves`);
    });
  });

  (fixture.templates || []).forEach((template) => {
    (template.nodes || []).forEach((node) => {
      if (node.component) context.assert(components.has(node.component), `${template.id}: node component ${node.component} resolves`);
      Object.values(node.slots || {}).forEach((slotRef) => {
        context.assert(templates.has(slotRef), `${template.id}: slot ref ${slotRef} resolves`);
      });
    });
  });
}

function runRmtShellAuthoringComponentUxSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-shell-authoring-ux',
    label: 'XTend RMT Shell Authoring for Component UX'
  });
  const fixture = readJson(RMT_SHELL_AUTHORING_FIXTURE, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText('development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const contractDoc = readText('development/XTend-RMT-Shell-Authoring-fuer-Component-UX.md', rootDir);
  const workpackage = readText('development/WP-E11-07-RMT-Shell-Authoring-fuer-Component-UX-erweitern.md', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtShellAuthoringComponentUx;
  const contract = createRmtShellAuthoringContract();
  const validation = validateRmtShellAuthoringContract(contract);
  const invalidValidation = validateRmtShellAuthoringContract({
    schema: RMT_SHELL_AUTHORING_SCHEMA,
    manifest: {
      renderMode: 'client-only',
      kernelBoundary: 'xtend-imports-in-rmt-kernel'
    },
    adapters: [],
    components: {
      noInlineRuntimeCode: false
    },
    templates: {
      shellFirst: false,
      noScriptNodes: false
    },
    style: {
      tokensOnlyInlinePolicy: false
    },
    a11y: {
      runtimeBehaviorRequired: false
    },
    events: {
      bindingMode: 'inline-handler'
    },
    commands: {
      diagnosticsFirst: false
    },
    hydration: {
      scheduleFieldRequired: false
    },
    schedules: {
      required: []
    },
    fabric: {
      telemetryCorrelationRequired: false
    },
    compatibility: {
      kernelImportsXtendTypes: true
    },
    tests: {
      requiredSuites: []
    }
  });
  const adapters = indexById(fixture.adapters);
  const components = indexById(fixture.components);
  const schedules = indexById(fixture.schedules);
  const templates = indexById(fixture.templates);
  const shell = components.get('app.shell');
  const input = components.get('settings.email');
  const dialog = components.get('dialog.confirm');
  const toast = components.get('feedback.toast');
  const link = components.get('nav.link');

  context.assert(contract.schema === RMT_SHELL_AUTHORING_SCHEMA, 'RMT Shell Authoring factory emits stable schema');
  context.assert(validation.schema === RMT_SHELL_AUTHORING_REPORT_SCHEMA, 'RMT Shell Authoring validator emits report schema');
  context.assert(validation.ok, 'RMT Shell Authoring validator accepts factory output');
  context.assert(!invalidValidation.ok, 'RMT Shell Authoring validator rejects invalid authoring records');
  context.assert(contract.shellContract === COMPONENT_SHELL_CONTRACT_SCHEMA, 'RMT Shell Authoring binds Component Shell Contract');
  context.assert(contract.stylingContract === COMPONENT_STYLING_CONTRACT_SCHEMA, 'RMT Shell Authoring binds Component Styling Contract');
  context.assert(contract.runtimeA11yContract === RUNTIME_A11Y_CONTRACT_SCHEMA, 'RMT Shell Authoring binds Runtime A11y Contract');
  context.assert(contract.uxPerformanceContract === COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA, 'RMT Shell Authoring binds UX Performance Contract');
  context.assert(contract.componentNetworkContract === COMPONENT_NETWORK_CONTRACT_SCHEMA, 'RMT Shell Authoring binds Component Network Contract');
  context.assert(contract.rmtStyleAuthoring === RMT_STYLE_AUTHORING_SCHEMA, 'RMT Shell Authoring links RMT Style Authoring');
  context.assert(contract.rmtA11yAuthoring === RMT_A11Y_AUTHORING_SCHEMA, 'RMT Shell Authoring links RMT A11y Authoring');
  context.assert(contract.rmtPerformanceAuthoring === RMT_PERFORMANCE_AUTHORING_SCHEMA, 'RMT Shell Authoring links RMT Performance Authoring');
  context.assert(contract.rmtNetworkAuthoring === RMT_NETWORK_AUTHORING_SCHEMA, 'RMT Shell Authoring links RMT Network Authoring');
  context.assert(contract.fabricBoundary === FABRIC_BOUNDARY_SCHEMA, 'RMT Shell Authoring binds Fabric boundary');
  context.assert(contract.manifest.renderMode === 'shell-first', 'RMT Shell Authoring is shell-first');
  context.assert(contract.manifest.kernelBoundary === KERNEL_BOUNDARY, 'RMT Shell Authoring keeps kernel boundary');
  assertIncludesAll(context, contract.authoringFields, RMT_SHELL_AUTHORING_FIELDS, 'Authoring fields');
  assertIncludesAll(context, contract.requiredDomains, RMT_SHELL_AUTHORING_REQUIRED_DOMAINS, 'Required domains');
  assertIncludesAll(context, contract.tests.assertions, RMT_SHELL_AUTHORING_ASSERTIONS, 'Required assertions');
  assertIncludesAll(context, contract.schedules.required.map((schedule) => schedule.id), RMT_SHELL_AUTHORING_REQUIRED_SCHEDULES, 'Required schedules');
  context.assert(contract.components.noInlineRuntimeCode === true, 'RMT Shell Authoring refuses inline runtime code');
  context.assert(contract.templates.noScriptNodes === true, 'RMT Shell Authoring refuses script nodes');
  context.assert(contract.events.bindingMode === 'dom-event-to-rmt-command', 'RMT Shell Authoring maps DOM events to RMT commands');
  context.assert(contract.commands.diagnosticsFirst === true, 'RMT Shell Authoring commands are diagnostics-first');
  context.assert(contract.fabric.telemetryCorrelationRequired === true, 'RMT Shell Authoring requires Fabric telemetry correlation');
  context.assert(contract.compatibility.kernelImportsXtendTypes === false, 'RMT Shell Authoring forbids XTend imports in RMT kernel');

  context.assert(fixture.kind === 'rmt_document', 'RMT Shell Authoring fixture is an RMT document');
  context.assert(fixture.manifest.metadata.contractVersion === RMT_SHELL_AUTHORING_SCHEMA, 'Fixture declares RMT Shell Authoring schema');
  context.assert(fixture.manifest.metadata.workpackage === RMT_SHELL_AUTHORING_WORKPACKAGE, 'Fixture is owned by WP-E11-07');
  context.assert(fixture.manifest.metadata.kernelBoundary === KERNEL_BOUNDARY, 'Fixture keeps RMT kernel boundary');
  RMT_SHELL_AUTHORING_REQUIRED_ADAPTERS.forEach((adapterId) => {
    context.assert(adapters.get(adapterId) && adapters.get(adapterId).kernelVisible === false, `Fixture declares host-neutral adapter ${adapterId}`);
  });
  context.assert(adapters.get('xtend.component').providedCapabilities.includes('shell'), 'XTend component adapter exposes shell capability');
  context.assert(adapters.get('xtend.component').providedCapabilities.includes('fabric'), 'XTend component adapter exposes fabric capability');
  context.assert(schedules.get('component.shell.render').lane === 'visible', 'Fixture schedules shell render in visible lane');
  context.assert(schedules.get('ui.user-blocking.input').lane === 'user-blocking', 'Fixture schedules input in user-blocking lane');
  context.assert(schedules.get('route.transition.render').lane === 'transition', 'Fixture schedules route render in transition lane');
  context.assert(schedules.get('a11y.announce').lane === 'a11y', 'Fixture schedules announcements in a11y lane');
  context.assert(schedules.get('diagnostics.snapshot').lane === 'diagnostics', 'Fixture schedules diagnostics snapshot');
  context.assert(shell && shell.shell.slots.feedback.component === 'feedback.toast', 'Shell component declares feedback slot as component ref');
  context.assert(shell.style.variant === 'primary', 'Shell component declares style variant');
  context.assert(shell.a11y.role === 'region', 'Shell component declares a11y role');
  context.assert(shell.hydration.policy === 'visible', 'Shell component declares hydration policy');
  context.assert(input.events['xtend:value-change'].command === 'settings.email.update', 'Input binds value-change event to command');
  context.assert(input.commands.validate.schedule === 'ui.user-blocking.input', 'Input validate command maps to input schedule');
  context.assert(dialog.shell.focus === 'trap', 'Dialog declares focus trap shell policy');
  context.assert(dialog.events['xtend:overlay-open'].command === 'dialog.open', 'Dialog binds overlay open event');
  context.assert(toast.a11y.live === 'polite', 'Toast declares live region policy');
  context.assert(toast.commands.announce.schedule === 'a11y.announce', 'Toast announce command maps to a11y schedule');
  context.assert(link.events['xtend:route-change'].command === 'route.navigate', 'Link binds route change event');
  context.assert(templates.get('app.shell.template').metadata.renderMode === 'shell-first', 'Fixture template is shell-first');
  assertFixtureReferencesResolve(context, fixture);

  context.assert((typeof packageManifest.exports['./builder/typing/rmt-shell-authoring-contract'] === 'string' ? packageManifest.exports['./builder/typing/rmt-shell-authoring-contract'] : packageManifest.exports['./builder/typing/rmt-shell-authoring-contract'] && packageManifest.exports['./builder/typing/rmt-shell-authoring-contract'].default) === './xtend-builder/typing/rmt-shell-authoring-contract.js', 'Package exports RMT Shell Authoring module');
  context.assert(packageManifest.scripts['test:rmt-shell-authoring-ux'] === 'node scripts/run_xtend_tests.js rmt-shell-authoring-ux', 'Package exposes RMT Shell Authoring test script');
  context.assert(metadata && metadata.schema === RMT_SHELL_AUTHORING_SCHEMA, 'Package metadata exposes RMT Shell Authoring schema');
  context.assert(metadata.reportSchema === RMT_SHELL_AUTHORING_REPORT_SCHEMA, 'Package metadata exposes RMT Shell Authoring report schema');
  context.assert(metadata.workpackage === RMT_SHELL_AUTHORING_WORKPACKAGE, 'Package metadata exposes WP-E11-07 owner');
  context.assert(metadata.contract === 'development/XTend-RMT-Shell-Authoring-fuer-Component-UX.md', 'Package metadata exposes RMT Shell Authoring contract doc path');
  context.assert(metadata.module === 'xtend-builder/typing/rmt-shell-authoring-contract.js', 'Package metadata exposes RMT Shell Authoring module path');
  context.assert(metadata.fixture === RMT_SHELL_AUTHORING_FIXTURE, 'Package metadata exposes RMT Shell Authoring fixture path');
  context.assert(metadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata keeps RMT kernel boundary');
  context.assert(Array.isArray(metadata.authoringFields) && metadata.authoringFields.includes('fabric'), 'Package metadata exposes Fabric authoring field');
  context.assert(Array.isArray(metadata.requiredSchedules) && metadata.requiredSchedules.includes('a11y.announce'), 'Package metadata exposes a11y schedule');
  context.assert(Array.isArray(metadata.requiredAssertions) && metadata.requiredAssertions.includes('kernel-boundary-preserved'), 'Package metadata exposes kernel boundary assertion');
  context.assertIncludes(scaffoldConfig, 'rmtShellAuthoringComponentUx', 'Scaffold config exposes RMT Shell Authoring section');
  context.assertIncludes(scaffoldConfig, RMT_SHELL_AUTHORING_SCHEMA, 'Scaffold config declares RMT Shell Authoring schema');
  context.assertIncludes(scaffoldConfig, 'rmt-shell-authoring-ux', 'Scaffold config references RMT Shell Authoring gate');
  context.assertIncludes(runner, "id: 'rmt-shell-authoring-ux'", 'Runner exposes RMT Shell Authoring suite');
  context.assertIncludes(contractDoc, RMT_SHELL_AUTHORING_SCHEMA, 'Contract document declares RMT Shell Authoring schema');
  context.assertIncludes(contractDoc, 'XtendRmtShellAuthoringContract', 'Contract document defines the TypeScript interface name');
  context.assertIncludes(contractDoc, KERNEL_BOUNDARY, 'Contract document keeps RMT kernel boundary visible');
  context.assertIncludes(contractDoc, '`shell-first-authoring`', 'Contract document lists RMT Shell Authoring assertions');
  context.assertIncludes(workpackage, 'xtend.epic11.wp07.rmt-shell-authoring-component-ux.v1', 'WP-E11-07 declares workpackage schema');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E11-07 is completed');
  context.assertIncludes(workpackage, 'node scripts/run_xtend_tests.js rmt-shell-authoring-ux --json', 'WP-E11-07 documents local gate');
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
  context.assertIncludes(backlog, 'Handoff nach WP-E11-07', 'Epic 11 backlog documents WP-E11-07 handoff');

  return context.result({
    schema: RMT_SHELL_AUTHORING_SCHEMA,
    fixture: RMT_SHELL_AUTHORING_FIXTURE,
    assertions: RMT_SHELL_AUTHORING_ASSERTIONS
  });
}

function printRmtShellAuthoringComponentUxReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend RMT Shell Authoring fuer Component UX erfolgreich.',
    failureTitle: 'XTend RMT Shell Authoring fuer Component UX fehlgeschlagen:'
  });
}

module.exports = {
  printRmtShellAuthoringComponentUxReport,
  runRmtShellAuthoringComponentUxSuite
};
