const FEEDBACK_STATUS_UX_SCHEMA = 'xtend.component.feedback-status-ux.v1';
const FEEDBACK_STATUS_UX_REPORT_SCHEMA = 'xtend.component.feedback-status-ux-report.v1';
const FEEDBACK_STATUS_UX_WORKPACKAGE = 'WP-E11-09';
const FEEDBACK_STATUS_UX_CONTRACT_DOC = 'development/XTend-Feedback-und-Status-UX-Reife-Contract.md';
const FEEDBACK_STATUS_UX_FIXTURE = 'tests/fixtures/rmt-feedback-status-ux.rmt';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';
const COMPONENT_CONTRACT_V2_SCHEMA = 'xtend.component.contract.v2';
const COMPONENT_SHELL_CONTRACT_SCHEMA = 'xtend.component.shell.v1';
const COMPONENT_STYLING_CONTRACT_SCHEMA = 'xtend.component.styling.v1';
const RUNTIME_A11Y_CONTRACT_SCHEMA = 'xtend.component.runtime-a11y.v1';
const COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA = 'xtend.component.ux-performance.v1';
const COMPONENT_NETWORK_CONTRACT_SCHEMA = 'xtend.component.network.v1';
const RMT_SHELL_AUTHORING_SCHEMA = 'xtend.rmt.shell-authoring.v1';
const FABRIC_BOUNDARY_SCHEMA = 'xtend.component.fabric-boundary.v2';

const FEEDBACK_STATUS_TARGETS = [
  'x-alert',
  'x-toast',
  'x-status',
  'x-progress',
  'x-spinner'
];

const FEEDBACK_STATUS_REQUIRED_DOMAINS = [
  'shell',
  'style',
  'a11y',
  'liveRegion',
  'motion',
  'timeout',
  'dismiss',
  'statusSemantics',
  'events',
  'commands',
  'state',
  'rmt',
  'fabric',
  'performance',
  'docs',
  'tests'
];

const FEEDBACK_STATUS_REQUIRED_EVENTS = [
  'alert-shown',
  'alert-dismissed',
  'toast-shown',
  'toast-dismissed',
  'status-changed',
  'status-dismissed',
  'progress-changed',
  'progress-complete',
  'spinner-started',
  'spinner-stopped',
  'paused',
  'resumed'
];

const FEEDBACK_STATUS_REQUIRED_COMMANDS = [
  'announce',
  'dismiss',
  'update-status',
  'set-progress',
  'complete',
  'pause',
  'resume',
  'snapshot'
];

const FEEDBACK_STATUS_REQUIRED_SCHEDULES = [
  'component.visible.mount',
  'component.idle.hydrate',
  'a11y.announce',
  'feedback.status.update',
  'feedback.progress.update',
  'diagnostics.snapshot'
];

const FEEDBACK_STATUS_REQUIRED_ASSERTIONS = [
  'live-region-semantics',
  'dismiss-timeout-policy',
  'reduced-motion-safe',
  'forced-colors-safe',
  'no-color-only-status',
  'event-source-detail',
  'fabric-lane-profile',
  'rmt-shell-authoring-ready',
  'form-feedback-compatible',
  'kernel-boundary-preserved'
];

const FEEDBACK_STATUS_PROFILES = [
  {
    tag: 'x-alert',
    role: 'alert-or-status',
    family: 'alert',
    severityModel: 'info-success-warning-error',
    liveRegion: 'polite-or-assertive',
    timeoutMode: 'optional-duration',
    dismissMode: 'closable-or-programmatic',
    events: ['alert-shown', 'alert-dismissed'],
    stateKey: 'xalert-state-<id>',
    requiredCommands: ['announce', 'dismiss', 'snapshot'],
    schedule: 'a11y.announce'
  },
  {
    tag: 'x-toast',
    role: 'status',
    family: 'toast',
    severityModel: 'info-success-warning-error',
    liveRegion: 'polite-or-assertive',
    timeoutMode: 'default-duration',
    dismissMode: 'button-timeout-or-programmatic',
    events: ['toast-shown', 'toast-dismissed'],
    stateKey: 'xtoast-state-<id>',
    requiredCommands: ['announce', 'dismiss', 'snapshot'],
    schedule: 'a11y.announce'
  },
  {
    tag: 'x-status',
    role: 'status-or-alert',
    family: 'inline-status',
    severityModel: 'type-plus-state',
    liveRegion: 'polite-or-assertive',
    timeoutMode: 'none',
    dismissMode: 'dismissible-attribute',
    events: ['status-changed', 'status-dismissed'],
    stateKey: 'xstatus-state-<id>',
    requiredCommands: ['announce', 'dismiss', 'update-status', 'snapshot'],
    schedule: 'feedback.status.update'
  },
  {
    tag: 'x-progress',
    role: 'progressbar',
    family: 'progress',
    severityModel: 'progress-plus-status',
    liveRegion: 'polite',
    timeoutMode: 'none',
    dismissMode: 'none',
    events: ['progress-changed', 'progress-complete'],
    stateKey: 'xprogress-value-<id>',
    requiredCommands: ['set-progress', 'complete', 'snapshot'],
    schedule: 'feedback.progress.update'
  },
  {
    tag: 'x-spinner',
    role: 'status',
    family: 'spinner',
    severityModel: 'busy-paused',
    liveRegion: 'polite',
    timeoutMode: 'none',
    dismissMode: 'none',
    events: ['spinner-started', 'spinner-stopped', 'paused', 'resumed'],
    stateKey: 'xspinner-paused-<id>',
    requiredCommands: ['pause', 'resume', 'snapshot'],
    schedule: 'component.visible.mount'
  }
];

function normalizeArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function unique(values) {
  return Array.from(new Set(normalizeArray(values).filter(Boolean)));
}

function createFeedbackStatusUxContract(input = {}) {
  const targets = unique(FEEDBACK_STATUS_TARGETS.concat(normalizeArray(input.targets)));
  const profiles = FEEDBACK_STATUS_PROFILES.map((profile) => ({ ...profile }));

  return {
    schema: FEEDBACK_STATUS_UX_SCHEMA,
    status: 'accepted',
    workpackage: FEEDBACK_STATUS_UX_WORKPACKAGE,
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
    domains: unique(FEEDBACK_STATUS_REQUIRED_DOMAINS.concat(normalizeArray(input.domains))),
    requiredEvents: unique(FEEDBACK_STATUS_REQUIRED_EVENTS.concat(normalizeArray(input.requiredEvents))),
    requiredCommands: unique(FEEDBACK_STATUS_REQUIRED_COMMANDS.concat(normalizeArray(input.requiredCommands))),
    requiredSchedules: unique(FEEDBACK_STATUS_REQUIRED_SCHEDULES.concat(normalizeArray(input.requiredSchedules))),
    liveRegion: {
      politeDefault: true,
      assertiveForError: true,
      ariaAtomicRequired: true,
      screenreaderSignalContract: 'xtend.a11y.screenreader-signals.v1'
    },
    statusSemantics: {
      roles: ['status', 'alert', 'progressbar'],
      noColorOnlyStatus: true,
      ariaBusyMirroring: true,
      progressValueTextRequired: true
    },
    dismiss: {
      buttonLabelRequired: true,
      eventRequired: true,
      timeoutReasonRequired: true,
      programmaticDismissRequired: true
    },
    motion: {
      reducedMotionRequired: true,
      forcedColorsRequired: true,
      motionContrastPolicy: 'xtend.a11y.motion-contrast-policy.v1'
    },
    shell: {
      requiredSlots: ['default', 'label', 'content'],
      requiredParts: ['root', 'content', 'control', 'icon', 'close', 'track', 'bar'],
      states: ['ready', 'busy', 'dismissed', 'paused', 'complete', 'error']
    },
    style: {
      tokens: ['--xtend-feedback-bg', '--xtend-feedback-color', '--xtend-feedback-border', '--xtend-feedback-radius', '--xtend-feedback-focus'],
      legacyFallbacksAllowed: true,
      forcedColorsRequired: true
    },
    events: {
      bubblingRequired: true,
      composedRequired: true,
      sourceDetailRequired: true,
      networkSchema: COMPONENT_NETWORK_CONTRACT_SCHEMA
    },
    rmt: {
      fixture: FEEDBACK_STATUS_UX_FIXTURE,
      adapter: 'xtend.component',
      shellFirst: true,
      noInlineRuntimeCode: true,
      scheduleRefsRequired: true
    },
    fabric: {
      lane: 'a11y',
      feedbackLane: 'feedback',
      diagnosticsLane: 'diagnostics',
      telemetryCorrelationRequired: true
    },
    docs: {
      contract: FEEDBACK_STATUS_UX_CONTRACT_DOC,
      requiredSections: ['Live Regions', 'Motion', 'Dismiss', 'Status-Semantik', 'Events', 'RMT', 'Fabric', 'Testing']
    },
    tests: {
      suite: 'feedback-status-ux',
      assertions: FEEDBACK_STATUS_REQUIRED_ASSERTIONS.slice(),
      fixtureRequired: true
    }
  };
}

function validateFeedbackStatusUxContract(contract) {
  const failures = [];
  const report = {
    schema: FEEDBACK_STATUS_UX_REPORT_SCHEMA,
    ok: true,
    failures
  };

  if (!contract || contract.schema !== FEEDBACK_STATUS_UX_SCHEMA) {
    failures.push('schema');
  }
  if (!contract || contract.kernelBoundary !== KERNEL_BOUNDARY) {
    failures.push('kernelBoundary');
  }
  FEEDBACK_STATUS_TARGETS.forEach((tag) => {
    if (!contract || !Array.isArray(contract.targets) || !contract.targets.includes(tag)) {
      failures.push(`target:${tag}`);
    }
  });
  FEEDBACK_STATUS_REQUIRED_DOMAINS.forEach((domain) => {
    if (!contract || !Array.isArray(contract.domains) || !contract.domains.includes(domain)) {
      failures.push(`domain:${domain}`);
    }
  });
  FEEDBACK_STATUS_REQUIRED_EVENTS.forEach((eventName) => {
    if (!contract || !Array.isArray(contract.requiredEvents) || !contract.requiredEvents.includes(eventName)) {
      failures.push(`event:${eventName}`);
    }
  });
  FEEDBACK_STATUS_REQUIRED_COMMANDS.forEach((commandName) => {
    if (!contract || !Array.isArray(contract.requiredCommands) || !contract.requiredCommands.includes(commandName)) {
      failures.push(`command:${commandName}`);
    }
  });
  FEEDBACK_STATUS_REQUIRED_SCHEDULES.forEach((scheduleId) => {
    if (!contract || !Array.isArray(contract.requiredSchedules) || !contract.requiredSchedules.includes(scheduleId)) {
      failures.push(`schedule:${scheduleId}`);
    }
  });
  if (!contract || !contract.liveRegion || contract.liveRegion.assertiveForError !== true) {
    failures.push('liveRegion.assertiveForError');
  }
  if (!contract || !contract.statusSemantics || contract.statusSemantics.noColorOnlyStatus !== true) {
    failures.push('statusSemantics.noColorOnlyStatus');
  }
  if (!contract || !contract.dismiss || contract.dismiss.eventRequired !== true) {
    failures.push('dismiss.eventRequired');
  }
  if (!contract || !contract.motion || contract.motion.reducedMotionRequired !== true || contract.motion.forcedColorsRequired !== true) {
    failures.push('motion.policy');
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
    FEEDBACK_STATUS_REQUIRED_ASSERTIONS.forEach((assertion) => {
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
  FEEDBACK_STATUS_PROFILES,
  FEEDBACK_STATUS_REQUIRED_ASSERTIONS,
  FEEDBACK_STATUS_REQUIRED_COMMANDS,
  FEEDBACK_STATUS_REQUIRED_DOMAINS,
  FEEDBACK_STATUS_REQUIRED_EVENTS,
  FEEDBACK_STATUS_REQUIRED_SCHEDULES,
  FEEDBACK_STATUS_TARGETS,
  FEEDBACK_STATUS_UX_CONTRACT_DOC,
  FEEDBACK_STATUS_UX_FIXTURE,
  FEEDBACK_STATUS_UX_REPORT_SCHEMA,
  FEEDBACK_STATUS_UX_SCHEMA,
  FEEDBACK_STATUS_UX_WORKPACKAGE,
  KERNEL_BOUNDARY,
  RMT_SHELL_AUTHORING_SCHEMA,
  RUNTIME_A11Y_CONTRACT_SCHEMA,
  createFeedbackStatusUxContract,
  validateFeedbackStatusUxContract
};
