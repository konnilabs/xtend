const FORM_CONTROLS_UX_SCHEMA = 'xtend.component.form-controls-ux.v1';
const FORM_CONTROLS_UX_REPORT_SCHEMA = 'xtend.component.form-controls-ux-report.v1';
const FORM_CONTROLS_UX_WORKPACKAGE = 'WP-E11-08';
const FORM_CONTROLS_UX_CONTRACT_DOC = 'development/XTend-Form-Controls-UX-Reife-Contract.md';
const FORM_CONTROLS_UX_FIXTURE = 'tests/fixtures/rmt-form-controls-ux.rmt';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';
const COMPONENT_CONTRACT_V2_SCHEMA = 'xtend.component.contract.v2';
const COMPONENT_SHELL_CONTRACT_SCHEMA = 'xtend.component.shell.v1';
const COMPONENT_STYLING_CONTRACT_SCHEMA = 'xtend.component.styling.v1';
const RUNTIME_A11Y_CONTRACT_SCHEMA = 'xtend.component.runtime-a11y.v1';
const COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA = 'xtend.component.ux-performance.v1';
const COMPONENT_NETWORK_CONTRACT_SCHEMA = 'xtend.component.network.v1';
const RMT_SHELL_AUTHORING_SCHEMA = 'xtend.rmt.shell-authoring.v1';
const FABRIC_BOUNDARY_SCHEMA = 'xtend.component.fabric-boundary.v2';

const FORM_CONTROL_TARGETS = [
  'x-input',
  'x-select',
  'x-checkbox',
  'x-radio',
  'x-textarea',
  'x-calendar',
  'x-form',
  'x-writer'
];

const FORM_CONTROL_REQUIRED_DOMAINS = [
  'shell',
  'style',
  'a11y',
  'validation',
  'formAssociation',
  'events',
  'commands',
  'state',
  'rmt',
  'fabric',
  'performance',
  'docs',
  'tests'
];

const FORM_CONTROL_REQUIRED_EVENTS = [
  'input-changed',
  'select-changed',
  'checkbox-changed',
  'radio-changed',
  'textarea-changed',
  'date-select',
  'writer:change',
  'submit',
  'invalid',
  'reset'
];

const FORM_CONTROL_REQUIRED_COMMANDS = [
  'focus',
  'validate',
  'reset',
  'set-value',
  'submit',
  'announce-error',
  'snapshot'
];

const FORM_CONTROL_REQUIRED_SCHEDULES = [
  'component.visible.mount',
  'component.idle.hydrate',
  'ui.user-blocking.input',
  'a11y.announce',
  'diagnostics.snapshot'
];

const FORM_CONTROL_REQUIRED_ASSERTIONS = [
  'form-associated-or-form-host',
  'accessible-name-required',
  'help-and-error-regions',
  'runtime-validation-events',
  'form-data-aggregation',
  'keyboard-path-documented',
  'style-token-surface',
  'fabric-lane-profile',
  'rmt-shell-authoring-ready',
  'kernel-boundary-preserved'
];

const FORM_CONTROL_PROFILES = [
  {
    tag: 'x-input',
    role: 'textbox',
    family: 'text-entry',
    valueMode: 'string',
    events: ['input-changed', 'validation-failed'],
    stateKey: 'xinput-value-<id>',
    formAssociated: true,
    requiredCommands: ['focus', 'validate', 'reset', 'set-value'],
    schedule: 'ui.user-blocking.input'
  },
  {
    tag: 'x-select',
    role: 'combobox',
    family: 'selection',
    valueMode: 'string-or-list',
    events: ['select-changed', 'select-invalid'],
    stateKey: 'xselect-value-<id>',
    formAssociated: true,
    requiredCommands: ['focus', 'validate', 'reset', 'set-value'],
    schedule: 'ui.user-blocking.input'
  },
  {
    tag: 'x-checkbox',
    role: 'checkbox',
    family: 'selection',
    valueMode: 'boolean-or-token',
    events: ['checkbox-changed', 'checkbox-invalid'],
    stateKey: 'xcheckbox-checked-<id>',
    formAssociated: true,
    requiredCommands: ['focus', 'validate', 'reset', 'set-value'],
    schedule: 'ui.user-blocking.input'
  },
  {
    tag: 'x-radio',
    role: 'radio',
    family: 'selection',
    valueMode: 'group-token',
    events: ['radio-changed', 'radio-invalid'],
    stateKey: 'xradio-value-<name>',
    formAssociated: true,
    requiredCommands: ['focus', 'validate', 'reset', 'set-value'],
    schedule: 'ui.user-blocking.input'
  },
  {
    tag: 'x-textarea',
    role: 'textbox',
    family: 'text-entry',
    valueMode: 'string',
    events: ['textarea-changed', 'textarea-invalid'],
    stateKey: 'xtextarea-value-<id>',
    formAssociated: true,
    requiredCommands: ['focus', 'validate', 'reset', 'set-value'],
    schedule: 'ui.user-blocking.input'
  },
  {
    tag: 'x-calendar',
    role: 'grid',
    family: 'date-entry',
    valueMode: 'iso-date',
    events: ['date-select'],
    stateKey: 'xcalendar-state-<id>',
    formAssociated: true,
    requiredCommands: ['focus', 'reset', 'set-value'],
    schedule: 'ui.user-blocking.input'
  },
  {
    tag: 'x-form',
    role: 'form',
    family: 'form-host',
    valueMode: 'record',
    events: ['submit', 'invalid', 'reset'],
    stateKey: 'xform-data-<id>',
    formAssociated: false,
    requiredCommands: ['submit', 'validate', 'reset', 'snapshot', 'announce-error'],
    schedule: 'component.visible.mount'
  },
  {
    tag: 'x-writer',
    role: 'textbox',
    family: 'rich-text-entry',
    valueMode: 'html-markdown-plain',
    events: ['writer:change', 'writer:save', 'writer:error', 'writer:autosave', 'writer:export'],
    stateKey: 'xwriter-content',
    formAssociated: false,
    requiredCommands: ['focus', 'reset', 'set-value', 'snapshot'],
    schedule: 'component.idle.hydrate'
  }
];

function normalizeArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function unique(values) {
  return Array.from(new Set(normalizeArray(values).filter(Boolean)));
}

function createFormControlsUxContract(input = {}) {
  const targets = unique(FORM_CONTROL_TARGETS.concat(normalizeArray(input.targets)));
  const profiles = FORM_CONTROL_PROFILES.map((profile) => ({ ...profile }));

  return {
    schema: FORM_CONTROLS_UX_SCHEMA,
    status: 'accepted',
    workpackage: FORM_CONTROLS_UX_WORKPACKAGE,
    componentContract: COMPONENT_CONTRACT_V2_SCHEMA,
    shellContract: COMPONENT_SHELL_CONTRACT_SCHEMA,
    stylingContract: COMPONENT_STYLING_CONTRACT_SCHEMA,
    runtimeA11yContract: RUNTIME_A11Y_CONTRACT_SCHEMA,
    uxPerformanceContract: COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA,
    componentNetworkContract: COMPONENT_NETWORK_CONTRACT_SCHEMA,
    rmtShellAuthoring: RMT_SHELL_AUTHORING_SCHEMA,
    fabricBoundary: FABRIC_BOUNDARY_SCHEMA,
    kernelBoundary: KERNEL_BOUNDARY,
    targets,
    profiles,
    domains: unique(FORM_CONTROL_REQUIRED_DOMAINS.concat(normalizeArray(input.domains))),
    requiredEvents: unique(FORM_CONTROL_REQUIRED_EVENTS.concat(normalizeArray(input.requiredEvents))),
    requiredCommands: unique(FORM_CONTROL_REQUIRED_COMMANDS.concat(normalizeArray(input.requiredCommands))),
    requiredSchedules: unique(FORM_CONTROL_REQUIRED_SCHEDULES.concat(normalizeArray(input.requiredSchedules))),
    validation: {
      validityApiRequired: true,
      errorEventRequired: true,
      errorRegion: 'role=alert aria-live=assertive',
      formHostSummary: 'role=alert'
    },
    formAssociation: {
      associatedControls: ['x-input', 'x-select', 'x-checkbox', 'x-radio', 'x-textarea', 'x-calendar'],
      hostControls: ['x-form'],
      richTextControls: ['x-writer'],
      elementInternalsPreferred: true,
      fallbackAllowed: true
    },
    shell: {
      requiredSlots: ['label', 'hint', 'error'],
      requiredParts: ['root', 'control', 'label', 'helper', 'error'],
      states: ['ready', 'invalid', 'disabled', 'required', 'busy']
    },
    style: {
      tokens: ['--xtend-control-bg', '--xtend-control-border', '--xtend-control-color', '--xtend-control-radius', '--xtend-control-focus'],
      legacyFallbacksAllowed: true,
      densityRequired: true,
      forcedColorsRequired: true
    },
    a11y: {
      accessibleNameRequired: true,
      keyboardPathRequired: true,
      focusVisibleRequired: true,
      noColorOnlyState: true,
      reducedMotionRequired: true
    },
    events: {
      bubblingRequired: true,
      composedRequired: true,
      networkSchema: COMPONENT_NETWORK_CONTRACT_SCHEMA
    },
    rmt: {
      fixture: FORM_CONTROLS_UX_FIXTURE,
      adapter: 'xtend.component',
      shellFirst: true,
      noInlineRuntimeCode: true,
      scheduleRefsRequired: true
    },
    fabric: {
      lane: 'user-blocking',
      a11yLane: 'a11y',
      diagnosticsLane: 'diagnostics',
      telemetryCorrelationRequired: true
    },
    docs: {
      contract: FORM_CONTROLS_UX_CONTRACT_DOC,
      requiredSections: ['Shell', 'Style', 'A11y', 'Validation', 'Events', 'RMT', 'Fabric', 'Testing']
    },
    tests: {
      suite: 'form-controls-ux',
      assertions: FORM_CONTROL_REQUIRED_ASSERTIONS.slice(),
      fixtureRequired: true
    }
  };
}

function validateFormControlsUxContract(contract) {
  const failures = [];
  const report = {
    schema: FORM_CONTROLS_UX_REPORT_SCHEMA,
    ok: true,
    failures
  };

  if (!contract || contract.schema !== FORM_CONTROLS_UX_SCHEMA) {
    failures.push('schema');
  }
  if (!contract || contract.kernelBoundary !== KERNEL_BOUNDARY) {
    failures.push('kernelBoundary');
  }
  FORM_CONTROL_TARGETS.forEach((tag) => {
    if (!contract || !Array.isArray(contract.targets) || !contract.targets.includes(tag)) {
      failures.push(`target:${tag}`);
    }
  });
  FORM_CONTROL_REQUIRED_DOMAINS.forEach((domain) => {
    if (!contract || !Array.isArray(contract.domains) || !contract.domains.includes(domain)) {
      failures.push(`domain:${domain}`);
    }
  });
  FORM_CONTROL_REQUIRED_EVENTS.forEach((eventName) => {
    if (!contract || !Array.isArray(contract.requiredEvents) || !contract.requiredEvents.includes(eventName)) {
      failures.push(`event:${eventName}`);
    }
  });
  FORM_CONTROL_REQUIRED_COMMANDS.forEach((commandName) => {
    if (!contract || !Array.isArray(contract.requiredCommands) || !contract.requiredCommands.includes(commandName)) {
      failures.push(`command:${commandName}`);
    }
  });
  FORM_CONTROL_REQUIRED_SCHEDULES.forEach((scheduleId) => {
    if (!contract || !Array.isArray(contract.requiredSchedules) || !contract.requiredSchedules.includes(scheduleId)) {
      failures.push(`schedule:${scheduleId}`);
    }
  });
  if (!contract || !contract.validation || contract.validation.validityApiRequired !== true) {
    failures.push('validation.validityApiRequired');
  }
  if (!contract || !contract.a11y || contract.a11y.accessibleNameRequired !== true) {
    failures.push('a11y.accessibleNameRequired');
  }
  if (!contract || !contract.rmt || contract.rmt.shellFirst !== true || contract.rmt.noInlineRuntimeCode !== true) {
    failures.push('rmt.shellFirst');
  }
  if (!contract || !contract.fabric || contract.fabric.telemetryCorrelationRequired !== true) {
    failures.push('fabric.telemetryCorrelationRequired');
  }
  if (!contract || !contract.tests || !Array.isArray(contract.tests.assertions)) {
    failures.push('tests.assertions');
  } else {
    FORM_CONTROL_REQUIRED_ASSERTIONS.forEach((assertion) => {
      if (!contract.tests.assertions.includes(assertion)) failures.push(`assertion:${assertion}`);
    });
  }

  report.ok = failures.length === 0;
  return report;
}

module.exports = {
  COMPONENT_CONTRACT_V2_SCHEMA,
  COMPONENT_NETWORK_CONTRACT_SCHEMA,
  COMPONENT_SHELL_CONTRACT_SCHEMA,
  COMPONENT_STYLING_CONTRACT_SCHEMA,
  COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA,
  FABRIC_BOUNDARY_SCHEMA,
  FORM_CONTROLS_UX_CONTRACT_DOC,
  FORM_CONTROLS_UX_FIXTURE,
  FORM_CONTROLS_UX_REPORT_SCHEMA,
  FORM_CONTROLS_UX_SCHEMA,
  FORM_CONTROLS_UX_WORKPACKAGE,
  FORM_CONTROL_PROFILES,
  FORM_CONTROL_REQUIRED_ASSERTIONS,
  FORM_CONTROL_REQUIRED_COMMANDS,
  FORM_CONTROL_REQUIRED_DOMAINS,
  FORM_CONTROL_REQUIRED_EVENTS,
  FORM_CONTROL_REQUIRED_SCHEDULES,
  FORM_CONTROL_TARGETS,
  KERNEL_BOUNDARY,
  RMT_SHELL_AUTHORING_SCHEMA,
  RUNTIME_A11Y_CONTRACT_SCHEMA,
  createFormControlsUxContract,
  validateFormControlsUxContract
};
