const COMPONENT_NETWORK_CONTRACT_SCHEMA = 'xtend.component.network.v1';
const COMPONENT_NETWORK_REPORT_SCHEMA = 'xtend.component.network-report.v1';
const COMPONENT_NETWORK_WORKPACKAGE = 'WP-E11-06';
const COMPONENT_NETWORK_CONTRACT_DOC = 'development/XTend-Component-Network-Compatibility-Contract.md';
const COMPONENT_CONTRACT_V2_SCHEMA = 'xtend.component.contract.v2';
const COMPONENT_SHELL_CONTRACT_SCHEMA = 'xtend.component.shell.v1';
const COMPONENT_STYLING_CONTRACT_SCHEMA = 'xtend.component.styling.v1';
const RUNTIME_A11Y_CONTRACT_SCHEMA = 'xtend.component.runtime-a11y.v1';
const COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA = 'xtend.component.ux-performance.v1';
const FABRIC_BOUNDARY_SCHEMA = 'xtend.component.fabric-boundary.v2';
const RMT_NETWORK_AUTHORING_SCHEMA = 'xtend.rmt.component-network-authoring.v1';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const COMPONENT_NETWORK_REQUIRED_DOMAINS = [
  'events',
  'commands',
  'contexts',
  'forms',
  'validation',
  'feedback',
  'overlays',
  'routing',
  'theme',
  'state',
  'slots',
  'focus',
  'a11y',
  'performance',
  'rmt',
  'fabric',
  'compatibility',
  'docs',
  'tests'
];

const COMPONENT_NETWORK_CONTEXTS = [
  'form',
  'validation',
  'feedback',
  'overlay',
  'router',
  'theme',
  'state',
  'diagnostics'
];

const COMPONENT_NETWORK_PROFILES = [
  'form-control',
  'form-container',
  'feedback-source',
  'feedback-consumer',
  'overlay-trigger',
  'overlay-surface',
  'router-link',
  'router-outlet',
  'theme-provider',
  'state-source',
  'display-consumer'
];

const COMPONENT_NETWORK_REQUIRED_EVENTS = [
  'xtend:value-change',
  'xtend:validation-change',
  'xtend:form-submit',
  'xtend:feedback-request',
  'xtend:overlay-open',
  'xtend:overlay-close',
  'xtend:route-change',
  'xtend:theme-change',
  'xtend:network-diagnostic'
];

const COMPONENT_NETWORK_REQUIRED_COMMANDS = [
  'focus',
  'validate',
  'reset',
  'submit',
  'announce',
  'open',
  'close',
  'navigate',
  'apply-theme',
  'snapshot'
];

const COMPONENT_NETWORK_ASSERTIONS = [
  'events-composed-bubbling',
  'commands-diagnostics-first',
  'form-association-safe',
  'validation-feedback-linked',
  'overlay-stack-coordinated',
  'router-context-stable',
  'theme-density-propagated',
  'fabric-context-resolved',
  'rmt-authoring-host-neutral',
  'no-global-magic-state'
];

const PROFILE_DEFAULTS = {
  'form-control': {
    contexts: ['form', 'validation', 'feedback'],
    events: ['xtend:value-change', 'xtend:validation-change'],
    commands: ['focus', 'validate', 'reset'],
    lane: 'user-blocking'
  },
  'form-container': {
    contexts: ['form', 'validation', 'feedback'],
    events: ['xtend:form-submit', 'xtend:validation-change', 'xtend:feedback-request'],
    commands: ['submit', 'validate', 'reset', 'focus'],
    lane: 'user-blocking'
  },
  'feedback-source': {
    contexts: ['feedback', 'diagnostics'],
    events: ['xtend:feedback-request', 'xtend:network-diagnostic'],
    commands: ['announce', 'snapshot'],
    lane: 'a11y'
  },
  'feedback-consumer': {
    contexts: ['feedback', 'state'],
    events: ['xtend:feedback-request'],
    commands: ['announce', 'close'],
    lane: 'a11y'
  },
  'overlay-trigger': {
    contexts: ['overlay', 'focus'],
    events: ['xtend:overlay-open', 'xtend:overlay-close'],
    commands: ['open', 'close', 'focus'],
    lane: 'user-blocking'
  },
  'overlay-surface': {
    contexts: ['overlay', 'focus', 'feedback'],
    events: ['xtend:overlay-open', 'xtend:overlay-close', 'xtend:feedback-request'],
    commands: ['open', 'close', 'focus', 'announce'],
    lane: 'user-blocking'
  },
  'router-link': {
    contexts: ['router', 'focus'],
    events: ['xtend:route-change'],
    commands: ['navigate', 'focus'],
    lane: 'transition'
  },
  'router-outlet': {
    contexts: ['router', 'feedback', 'focus'],
    events: ['xtend:route-change', 'xtend:feedback-request'],
    commands: ['navigate', 'announce', 'focus'],
    lane: 'transition'
  },
  'theme-provider': {
    contexts: ['theme', 'state'],
    events: ['xtend:theme-change'],
    commands: ['apply-theme', 'snapshot'],
    lane: 'visible'
  },
  'state-source': {
    contexts: ['state', 'diagnostics'],
    events: ['xtend:network-diagnostic'],
    commands: ['snapshot'],
    lane: 'diagnostics'
  },
  'display-consumer': {
    contexts: ['theme', 'state'],
    events: ['xtend:theme-change'],
    commands: ['snapshot'],
    lane: 'visible'
  }
};

function normalizeArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function unique(values) {
  return Array.from(new Set(normalizeArray(values).filter(Boolean)));
}

function normalizeProfiles(profiles) {
  const list = normalizeArray(profiles).length > 0 ? profiles : ['display-consumer'];
  const normalized = unique(list.map((profile) => String(profile).trim()).filter(Boolean));
  const known = normalized.filter((profile) => COMPONENT_NETWORK_PROFILES.includes(profile));
  return known.length > 0 ? known : ['display-consumer'];
}

function collectProfileValue(profiles, key) {
  return unique(profiles.flatMap((profile) => PROFILE_DEFAULTS[profile][key] || []));
}

function pickPrimaryProfile(profiles) {
  return [
    'form-container',
    'form-control',
    'overlay-surface',
    'overlay-trigger',
    'router-outlet',
    'router-link',
    'feedback-source',
    'feedback-consumer',
    'theme-provider',
    'state-source',
    'display-consumer'
  ].find((profile) => profiles.includes(profile)) || 'display-consumer';
}

function pickLane(profiles) {
  const lanes = collectProfileValue(profiles, 'lane');
  if (lanes.includes('user-blocking')) return 'user-blocking';
  if (lanes.includes('a11y')) return 'a11y';
  if (lanes.includes('transition')) return 'transition';
  if (lanes.includes('visible')) return 'visible';
  return lanes[0] || 'visible';
}

function createEventRecord(name) {
  return {
    name,
    bubbles: true,
    composed: true,
    cancelable: name === 'xtend:form-submit' || name === 'xtend:overlay-close' || name === 'xtend:route-change',
    detailSchema: `${name.replace(/[:]/g, '.')}.detail.v1`,
    diagnosticsRequired: name === 'xtend:network-diagnostic'
  };
}

function createCommandRecord(name) {
  return {
    name,
    requestSchema: `xtend.command.${name}.request.v1`,
    resultSchema: `xtend.command.${name}.result.v1`,
    diagnosticsFirst: true,
    asyncAllowed: ['submit', 'announce', 'navigate', 'snapshot'].includes(name)
  };
}

function createComponentNetworkContract(input = {}) {
  const tag = input.tag || 'x-example';
  const profiles = normalizeProfiles(input.profiles);
  const primaryProfile = input.primaryProfile || pickPrimaryProfile(profiles);
  const contexts = unique(COMPONENT_NETWORK_CONTEXTS.concat(collectProfileValue(profiles, 'contexts'), normalizeArray(input.contexts)));
  const eventNames = unique(COMPONENT_NETWORK_REQUIRED_EVENTS.concat(collectProfileValue(profiles, 'events'), normalizeArray(input.events)));
  const commandNames = unique(COMPONENT_NETWORK_REQUIRED_COMMANDS.concat(collectProfileValue(profiles, 'commands'), normalizeArray(input.commands)));
  const lane = input.lane || pickLane(profiles);

  return {
    schema: COMPONENT_NETWORK_CONTRACT_SCHEMA,
    status: 'contract-draft',
    workpackage: COMPONENT_NETWORK_WORKPACKAGE,
    componentContract: COMPONENT_CONTRACT_V2_SCHEMA,
    shellContract: COMPONENT_SHELL_CONTRACT_SCHEMA,
    stylingContract: COMPONENT_STYLING_CONTRACT_SCHEMA,
    runtimeA11yContract: RUNTIME_A11Y_CONTRACT_SCHEMA,
    uxPerformanceContract: COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA,
    tag,
    profiles,
    primaryProfile,
    lane,
    events: {
      required: eventNames.map(createEventRecord),
      propagation: 'bubbles-composed',
      namingPolicy: 'xtend-colon-domain-action',
      payloadPolicy: 'detail-schema-required',
      noGlobalEventBus: true
    },
    commands: {
      required: commandNames.map(createCommandRecord),
      invocation: 'host-method-or-rmt-command',
      resultPolicy: 'diagnostics-first-result-record',
      noThrowAcrossBoundary: true
    },
    contexts: {
      provided: contexts,
      discovery: 'closest-provider-or-adapter-context',
      overrideOrder: ['rmt-component-record', 'host-context', 'component-property', 'default-contract'],
      noImplicitGlobals: true
    },
    forms: {
      formAssociation: profiles.includes('form-control') || profiles.includes('form-container'),
      valueEvent: 'xtend:value-change',
      submitEvent: 'xtend:form-submit',
      controlsRegisterByEvent: true,
      nativeFormInteropRequired: true
    },
    validation: {
      event: 'xtend:validation-change',
      command: 'validate',
      feedbackEvent: 'xtend:feedback-request',
      firstInvalidFocusPolicy: 'form-summary-or-first-invalid-control',
      validationStateFields: ['valid', 'invalid', 'required', 'message', 'controlRef']
    },
    feedback: {
      event: 'xtend:feedback-request',
      command: 'announce',
      liveRegionContract: 'xtend.a11y.screenreader-signals.v1',
      statusComponents: ['x-alert', 'x-toast', 'x-status', 'x-progress'],
      lane: 'a11y'
    },
    overlays: {
      stackContext: 'xtend.overlay.stack.v1',
      openEvent: 'xtend:overlay-open',
      closeEvent: 'xtend:overlay-close',
      commands: ['open', 'close', 'focus'],
      escapePolicy: 'topmost-dismissible-only',
      inertPolicy: 'background-inert-while-modal'
    },
    routing: {
      context: 'xtend.router.context.v1',
      routeEvent: 'xtend:route-change',
      command: 'navigate',
      activeStatePolicy: 'aria-current-and-data-active',
      focusRestoreRequired: true,
      xrouterAdapter: 'xtend.xrouter'
    },
    theme: {
      context: 'xtend.theme.context.v1',
      event: 'xtend:theme-change',
      command: 'apply-theme',
      densityPropagation: true,
      tokenPropagation: true
    },
    state: {
      context: 'xtend.state.context.v1',
      localFirst: true,
      externalStateBridgeAllowed: true,
      snapshotCommand: 'snapshot',
      noGlobalMutableSingleton: true
    },
    slots: {
      projectionPolicy: 'named-slots-stay-local',
      contextProjectionAllowed: ['label', 'helper', 'error', 'actions', 'feedback'],
      noCrossComponentSlotMutation: true
    },
    focus: {
      restoreEvents: ['xtend:route-change', 'xtend:overlay-close', 'xtend:validation-change'],
      command: 'focus',
      focusTrapSharedByOverlays: true,
      rovingScopeMustBeLocal: true
    },
    a11y: {
      runtimeContract: RUNTIME_A11Y_CONTRACT_SCHEMA,
      screenreaderSignals: 'xtend.a11y.screenreader-signals.v1',
      routeAnnouncementsRequired: profiles.includes('router-outlet') || profiles.includes('router-link'),
      validationAnnouncementsRequired: profiles.includes('form-control') || profiles.includes('form-container'),
      overlayContextAnnouncementsRequired: profiles.includes('overlay-surface')
    },
    performance: {
      contract: COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA,
      lane,
      eventBudgetRequired: true,
      coalescingRequiredForRepeatedEvents: true,
      backpressureAware: true
    },
    rmt: {
      schema: RMT_NETWORK_AUTHORING_SCHEMA,
      adapter: 'xtend.component',
      fields: ['events', 'commands', 'contexts', 'form', 'validation', 'feedback', 'overlay', 'router', 'theme', 'state'],
      kernelBoundary: KERNEL_BOUNDARY
    },
    fabric: {
      schema: FABRIC_BOUNDARY_SCHEMA,
      lane,
      diagnostics: ['network.event.unhandled', 'network.command.failed', 'network.context.missing', 'network.global-state.refused'],
      reporterFields: ['componentRef', 'eventName', 'commandName', 'context', 'lane', 'correlationId']
    },
    compatibility: {
      hostModes: ['xtend-only', 'rmt-first', 'vanilla', 'react', 'vue', 'custom-shell'],
      nativeDomEventsRequired: true,
      noFrameworkSpecificWrapperRequired: true,
      noGlobalMagicState: true,
      noCdnDependency: true
    },
    docs: {
      contract: COMPONENT_NETWORK_CONTRACT_DOC,
      requiredSections: ['Events', 'Commands', 'Contexts', 'Forms', 'Validation', 'Feedback', 'Overlays', 'Routing', 'Theme', 'RMT Authoring']
    },
    tests: {
      requiredSuites: ['component-network-contract', 'components', 'browser', 'references'],
      assertions: COMPONENT_NETWORK_ASSERTIONS.slice(),
      browserSmokeRequiredForP0Journeys: true
    }
  };
}

function validateComponentNetworkContract(contract = {}) {
  const errors = [];

  if (contract.schema !== COMPONENT_NETWORK_CONTRACT_SCHEMA) {
    errors.push(`schema must be ${COMPONENT_NETWORK_CONTRACT_SCHEMA}`);
  }
  if (!/^x-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(contract.tag || ''))) {
    errors.push('tag must be a valid XTend custom element tag');
  }

  COMPONENT_NETWORK_REQUIRED_DOMAINS.forEach((domain) => {
    if (!contract[domain]) {
      errors.push(`missing domain: ${domain}`);
    }
  });

  if (!Array.isArray(contract.profiles) || contract.profiles.some((profile) => !COMPONENT_NETWORK_PROFILES.includes(profile))) {
    errors.push(`profiles must use known values: ${COMPONENT_NETWORK_PROFILES.join(', ')}`);
  }
  if (!contract.events || !Array.isArray(contract.events.required) || contract.events.required.length === 0) {
    errors.push('events.required must not be empty');
  }
  if (contract.events && Array.isArray(contract.events.required)) {
    contract.events.required.forEach((event) => {
      if (!/^xtend:[a-z0-9-]+$/.test(String(event.name || ''))) {
        errors.push(`event name must use xtend:* naming: ${event.name}`);
      }
      if (event.bubbles !== true || event.composed !== true) {
        errors.push(`event ${event.name} must bubble and be composed`);
      }
    });
  }
  if (!contract.commands || !Array.isArray(contract.commands.required) || contract.commands.required.length === 0) {
    errors.push('commands.required must not be empty');
  }
  if (contract.commands && Array.isArray(contract.commands.required) && contract.commands.required.some((command) => command.diagnosticsFirst !== true)) {
    errors.push('commands must be diagnostics-first');
  }
  if (!contract.contexts || contract.contexts.noImplicitGlobals !== true) {
    errors.push('contexts.noImplicitGlobals must be true');
  }
  if (!contract.forms || contract.forms.controlsRegisterByEvent !== true) {
    errors.push('forms.controlsRegisterByEvent must be true');
  }
  if (!contract.validation || contract.validation.feedbackEvent !== 'xtend:feedback-request') {
    errors.push('validation.feedbackEvent must link to xtend:feedback-request');
  }
  if (!contract.overlays || contract.overlays.stackContext !== 'xtend.overlay.stack.v1') {
    errors.push('overlays.stackContext must be xtend.overlay.stack.v1');
  }
  if (!contract.routing || contract.routing.xrouterAdapter !== 'xtend.xrouter') {
    errors.push('routing.xrouterAdapter must be xtend.xrouter');
  }
  if (!contract.theme || contract.theme.densityPropagation !== true) {
    errors.push('theme.densityPropagation must be true');
  }
  if (!contract.state || contract.state.noGlobalMutableSingleton !== true) {
    errors.push('state.noGlobalMutableSingleton must be true');
  }
  if (contract.rmt && contract.rmt.kernelBoundary !== KERNEL_BOUNDARY) {
    errors.push('rmt.kernelBoundary must keep the RMT kernel decoupled from XTend types');
  }
  if (contract.compatibility && contract.compatibility.noGlobalMagicState !== true) {
    errors.push('compatibility.noGlobalMagicState must be true');
  }
  if (!contract.tests || !normalizeArray(contract.tests.requiredSuites).includes('component-network-contract')) {
    errors.push('tests.requiredSuites must include component-network-contract');
  }

  return {
    schema: COMPONENT_NETWORK_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  COMPONENT_CONTRACT_V2_SCHEMA,
  COMPONENT_NETWORK_ASSERTIONS,
  COMPONENT_NETWORK_CONTEXTS,
  COMPONENT_NETWORK_CONTRACT_DOC,
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
};
