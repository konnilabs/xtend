const RMT_SHELL_AUTHORING_SCHEMA = 'xtend.rmt.shell-authoring.v1';
const RMT_SHELL_AUTHORING_REPORT_SCHEMA = 'xtend.rmt.shell-authoring-report.v1';
const RMT_SHELL_AUTHORING_WORKPACKAGE = 'WP-E11-07';
const RMT_SHELL_AUTHORING_CONTRACT_DOC = 'development/XTend-RMT-Shell-Authoring-fuer-Component-UX.md';
const RMT_SHELL_AUTHORING_FIXTURE = 'tests/fixtures/rmt-shell-authoring-component-ux.rmt';
const COMPONENT_CONTRACT_V2_SCHEMA = 'xtend.component.contract.v2';
const COMPONENT_SHELL_CONTRACT_SCHEMA = 'xtend.component.shell.v1';
const COMPONENT_STYLING_CONTRACT_SCHEMA = 'xtend.component.styling.v1';
const RUNTIME_A11Y_CONTRACT_SCHEMA = 'xtend.component.runtime-a11y.v1';
const COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA = 'xtend.component.ux-performance.v1';
const COMPONENT_NETWORK_CONTRACT_SCHEMA = 'xtend.component.network.v1';
const RMT_STYLE_AUTHORING_SCHEMA = 'xtend.rmt.style-authoring.v1';
const RMT_A11Y_AUTHORING_SCHEMA = 'xtend.rmt.a11y-authoring.v1';
const RMT_PERFORMANCE_AUTHORING_SCHEMA = 'xtend.rmt.performance-authoring.v1';
const RMT_NETWORK_AUTHORING_SCHEMA = 'xtend.rmt.component-network-authoring.v1';
const FABRIC_BOUNDARY_SCHEMA = 'xtend.component.fabric-boundary.v2';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const RMT_SHELL_AUTHORING_REQUIRED_DOMAINS = [
  'manifest',
  'adapters',
  'components',
  'templates',
  'shell',
  'style',
  'a11y',
  'variants',
  'density',
  'events',
  'commands',
  'hydration',
  'schedules',
  'fabric',
  'compatibility',
  'docs',
  'tests'
];

const RMT_SHELL_AUTHORING_FIELDS = [
  'shell',
  'style',
  'a11y',
  'commands',
  'events',
  'variants',
  'density',
  'hydration',
  'schedule',
  'fabric'
];

const RMT_SHELL_AUTHORING_REQUIRED_ADAPTERS = [
  'xtend.component',
  'xtend.xrouter',
  'rmt.state-scheduler-diagnostics'
];

const RMT_SHELL_AUTHORING_REQUIRED_SCHEDULES = [
  'component.shell.render',
  'component.visible.mount',
  'ui.user-blocking.input',
  'route.transition.render',
  'a11y.announce',
  'diagnostics.snapshot'
];

const RMT_SHELL_AUTHORING_ASSERTIONS = [
  'shell-first-authoring',
  'style-token-authoring',
  'runtime-a11y-authoring',
  'command-event-network-binding',
  'schedule-fabric-lane-binding',
  'kernel-boundary-preserved',
  'host-neutral-adapters',
  'no-inline-runtime-code',
  'density-theme-propagation',
  'validation-fixture-resolves'
];

function normalizeArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function unique(values) {
  return Array.from(new Set(normalizeArray(values).filter(Boolean)));
}

function createAdapterRecord(id, capabilities) {
  return {
    id,
    kernelVisible: false,
    capabilities: unique(capabilities)
  };
}

function createScheduleRecord(id, lane, endpointName) {
  return {
    id,
    lane,
    endpointName,
    kernelVisible: true,
    fabricCorrelationRequired: true
  };
}

function createRmtShellAuthoringContract(input = {}) {
  const documentId = input.documentId || 'fixture.xtend.component-ux-shell-authoring';
  const authoringFields = unique(RMT_SHELL_AUTHORING_FIELDS.concat(normalizeArray(input.authoringFields)));
  const requiredSchedules = unique(RMT_SHELL_AUTHORING_REQUIRED_SCHEDULES.concat(normalizeArray(input.requiredSchedules)));

  return {
    schema: RMT_SHELL_AUTHORING_SCHEMA,
    status: 'contract-draft',
    workpackage: RMT_SHELL_AUTHORING_WORKPACKAGE,
    componentContract: COMPONENT_CONTRACT_V2_SCHEMA,
    shellContract: COMPONENT_SHELL_CONTRACT_SCHEMA,
    stylingContract: COMPONENT_STYLING_CONTRACT_SCHEMA,
    runtimeA11yContract: RUNTIME_A11Y_CONTRACT_SCHEMA,
    uxPerformanceContract: COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA,
    componentNetworkContract: COMPONENT_NETWORK_CONTRACT_SCHEMA,
    rmtStyleAuthoring: RMT_STYLE_AUTHORING_SCHEMA,
    rmtA11yAuthoring: RMT_A11Y_AUTHORING_SCHEMA,
    rmtPerformanceAuthoring: RMT_PERFORMANCE_AUTHORING_SCHEMA,
    rmtNetworkAuthoring: RMT_NETWORK_AUTHORING_SCHEMA,
    fabricBoundary: FABRIC_BOUNDARY_SCHEMA,
    manifest: {
      documentId,
      renderMode: 'shell-first',
      componentAdapter: 'xtend.component',
      routerAdapter: 'xtend.xrouter',
      kernelBoundary: KERNEL_BOUNDARY
    },
    adapters: [
      createAdapterRecord('xtend.component', ['shell', 'style', 'a11y', 'commands', 'events', 'variants', 'density', 'hydration', 'scheduleRefs', 'fabric']),
      createAdapterRecord('xtend.xrouter', ['routes', 'navigation', 'activeState', 'focusRestore', 'announcements']),
      createAdapterRecord('rmt.state-scheduler-diagnostics', ['schedules', 'lanes', 'diagnostics', 'performanceBudgets', 'telemetry'])
    ],
    components: {
      requiredFields: ['id', 'adapter', 'tag', 'template', 'schedule', 'shell', 'style', 'a11y', 'events', 'commands', 'hydration', 'fabric'],
      adapter: 'xtend.component',
      templateMode: 'dom_descriptor',
      noInlineRuntimeCode: true
    },
    templates: {
      mode: 'dom_descriptor',
      shellFirst: true,
      allowedNodeKinds: ['element', 'text', 'component', 'slot'],
      noScriptNodes: true
    },
    shell: {
      fields: ['domMode', 'state', 'slots', 'parts', 'focus', 'attributes'],
      requiredStates: ['empty', 'loading', 'ready', 'error', 'disabled', 'busy', 'invalid'],
      slotRefsMustResolve: true
    },
    style: {
      schema: RMT_STYLE_AUTHORING_SCHEMA,
      fields: ['tokens', 'parts', 'variant', 'size', 'density', 'theme', 'motion', 'contrast'],
      tokensOnlyInlinePolicy: true
    },
    a11y: {
      schema: RMT_A11Y_AUTHORING_SCHEMA,
      fields: ['role', 'label', 'description', 'live', 'keyboard', 'focus', 'announcements'],
      runtimeBehaviorRequired: true
    },
    variants: {
      allowed: ['default', 'primary', 'secondary', 'success', 'warning', 'danger', 'neutral'],
      unknownPolicy: 'ignore-and-diagnose'
    },
    density: {
      allowed: ['comfortable', 'compact', 'dense'],
      propagation: 'theme-context-and-component-record'
    },
    events: {
      bindingMode: 'dom-event-to-rmt-command',
      requiredPropagation: 'bubbles-composed',
      networkSchema: RMT_NETWORK_AUTHORING_SCHEMA
    },
    commands: {
      invocation: 'rmt-command-to-host-adapter',
      diagnosticsFirst: true,
      noThrowAcrossBoundary: true
    },
    hydration: {
      policies: ['visible', 'idle', 'lazy', 'visible-or-idle'],
      scheduleFieldRequired: true,
      ownershipModes: ['managed_subtree', 'adapter_owned_dom']
    },
    schedules: {
      required: requiredSchedules.map((id) => {
        if (id === 'ui.user-blocking.input') return createScheduleRecord(id, 'user-blocking', 'xtendrmt.ui.user-blocking');
        if (id === 'route.transition.render') return createScheduleRecord(id, 'transition', 'xtendrmt.route.render');
        if (id === 'a11y.announce') return createScheduleRecord(id, 'a11y', 'xtendrmt.a11y.announce');
        if (id === 'diagnostics.snapshot') return createScheduleRecord(id, 'diagnostics', 'xtendrmt.diagnostics.snapshot');
        if (id === 'component.visible.mount') return createScheduleRecord(id, 'visible', 'xtendrmt.component.mount');
        return createScheduleRecord(id, 'visible', 'xtendrmt.shell.render');
      }),
      performanceSchema: RMT_PERFORMANCE_AUTHORING_SCHEMA
    },
    fabric: {
      schema: FABRIC_BOUNDARY_SCHEMA,
      laneFieldsRequired: true,
      telemetryCorrelationRequired: true,
      diagnostics: ['rmt.shell.field.missing', 'rmt.shell.event.unbound', 'rmt.shell.schedule.unresolved', 'rmt.shell.kernel-boundary.refused']
    },
    compatibility: {
      hostModes: ['xtend-only', 'rmt-first', 'vanilla', 'react', 'vue', 'custom-shell'],
      kernelImportsXtendTypes: false,
      noRuntimeEval: true,
      noCdnDependency: true
    },
    docs: {
      contract: RMT_SHELL_AUTHORING_CONTRACT_DOC,
      fixture: RMT_SHELL_AUTHORING_FIXTURE,
      requiredSections: ['Shell', 'Style', 'A11y', 'Events', 'Commands', 'Hydration', 'Schedules', 'Fabric', 'Kernel Boundary']
    },
    tests: {
      requiredSuites: ['rmt-shell-authoring-ux', 'component-shell-contract', 'component-styling-contract', 'runtime-a11y-contract', 'component-ux-performance', 'component-network-contract', 'references'],
      assertions: RMT_SHELL_AUTHORING_ASSERTIONS.slice(),
      fixtureRequired: true
    },
    authoringFields,
    requiredDomains: RMT_SHELL_AUTHORING_REQUIRED_DOMAINS.slice()
  };
}

function validateRmtShellAuthoringContract(contract = {}) {
  const errors = [];

  if (contract.schema !== RMT_SHELL_AUTHORING_SCHEMA) {
    errors.push(`schema must be ${RMT_SHELL_AUTHORING_SCHEMA}`);
  }
  RMT_SHELL_AUTHORING_REQUIRED_DOMAINS.forEach((domain) => {
    if (!contract[domain]) {
      errors.push(`missing domain: ${domain}`);
    }
  });
  if (!contract.manifest || contract.manifest.renderMode !== 'shell-first') {
    errors.push('manifest.renderMode must be shell-first');
  }
  if (!contract.manifest || contract.manifest.kernelBoundary !== KERNEL_BOUNDARY) {
    errors.push('manifest.kernelBoundary must preserve the RMT/XTend boundary');
  }
  if (!Array.isArray(contract.adapters) || !RMT_SHELL_AUTHORING_REQUIRED_ADAPTERS.every((id) => contract.adapters.some((adapter) => adapter.id === id && adapter.kernelVisible === false))) {
    errors.push(`adapters must include host-neutral adapters: ${RMT_SHELL_AUTHORING_REQUIRED_ADAPTERS.join(', ')}`);
  }
  if (!Array.isArray(contract.authoringFields) || !RMT_SHELL_AUTHORING_FIELDS.every((field) => contract.authoringFields.includes(field))) {
    errors.push(`authoringFields must include: ${RMT_SHELL_AUTHORING_FIELDS.join(', ')}`);
  }
  if (!contract.components || contract.components.noInlineRuntimeCode !== true) {
    errors.push('components.noInlineRuntimeCode must be true');
  }
  if (!contract.templates || contract.templates.shellFirst !== true || contract.templates.noScriptNodes !== true) {
    errors.push('templates must be shell-first and refuse script nodes');
  }
  if (!contract.style || contract.style.tokensOnlyInlinePolicy !== true) {
    errors.push('style.tokensOnlyInlinePolicy must be true');
  }
  if (!contract.a11y || contract.a11y.runtimeBehaviorRequired !== true) {
    errors.push('a11y.runtimeBehaviorRequired must be true');
  }
  if (!contract.events || contract.events.bindingMode !== 'dom-event-to-rmt-command') {
    errors.push('events.bindingMode must be dom-event-to-rmt-command');
  }
  if (!contract.commands || contract.commands.diagnosticsFirst !== true) {
    errors.push('commands.diagnosticsFirst must be true');
  }
  if (!contract.hydration || contract.hydration.scheduleFieldRequired !== true) {
    errors.push('hydration.scheduleFieldRequired must be true');
  }
  if (!contract.schedules || !Array.isArray(contract.schedules.required) || !RMT_SHELL_AUTHORING_REQUIRED_SCHEDULES.every((id) => contract.schedules.required.some((schedule) => schedule.id === id))) {
    errors.push(`schedules.required must include: ${RMT_SHELL_AUTHORING_REQUIRED_SCHEDULES.join(', ')}`);
  }
  if (!contract.fabric || contract.fabric.telemetryCorrelationRequired !== true) {
    errors.push('fabric.telemetryCorrelationRequired must be true');
  }
  if (!contract.compatibility || contract.compatibility.kernelImportsXtendTypes !== false) {
    errors.push('compatibility.kernelImportsXtendTypes must be false');
  }
  if (!contract.tests || !normalizeArray(contract.tests.requiredSuites).includes('rmt-shell-authoring-ux')) {
    errors.push('tests.requiredSuites must include rmt-shell-authoring-ux');
  }

  return {
    schema: RMT_SHELL_AUTHORING_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  COMPONENT_CONTRACT_V2_SCHEMA,
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
  RMT_SHELL_AUTHORING_CONTRACT_DOC,
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
};
