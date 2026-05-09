const OVERLAY_INTERACTION_UX_SCHEMA = 'xtend.component.overlay-interaction-ux.v1';
const OVERLAY_INTERACTION_UX_REPORT_SCHEMA = 'xtend.component.overlay-interaction-ux-report.v1';
const OVERLAY_INTERACTION_UX_WORKPACKAGE = 'WP-E11-11';
const OVERLAY_INTERACTION_UX_CONTRACT_DOC = 'development/XTend-Overlay-und-Interaction-UX-Reife-Contract.md';
const OVERLAY_INTERACTION_UX_FIXTURE = 'tests/fixtures/rmt-overlay-interaction-ux.rmt';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';
const COMPONENT_CONTRACT_V2_SCHEMA = 'xtend.component.contract.v2';
const COMPONENT_SHELL_CONTRACT_SCHEMA = 'xtend.component.shell.v1';
const COMPONENT_STYLING_CONTRACT_SCHEMA = 'xtend.component.styling.v1';
const RUNTIME_A11Y_CONTRACT_SCHEMA = 'xtend.component.runtime-a11y.v1';
const COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA = 'xtend.component.ux-performance.v1';
const COMPONENT_NETWORK_CONTRACT_SCHEMA = 'xtend.component.network.v1';
const RMT_SHELL_AUTHORING_SCHEMA = 'xtend.rmt.shell-authoring.v1';
const FABRIC_BOUNDARY_SCHEMA = 'xtend.component.fabric-boundary.v2';

const OVERLAY_INTERACTION_TARGETS = [
  'x-modal',
  'x-dialog',
  'x-popover',
  'x-tooltip',
  'x-drawer'
];

const OVERLAY_INTERACTION_REQUIRED_DOMAINS = [
  'shell',
  'style',
  'a11y',
  'overlayStack',
  'focusTrap',
  'inert',
  'scrollLock',
  'escape',
  'outsideClick',
  'portal',
  'events',
  'commands',
  'state',
  'rmt',
  'fabric',
  'performance',
  'docs',
  'tests'
];

const OVERLAY_INTERACTION_REQUIRED_EVENTS = [
  'modal-opened',
  'modal-closed',
  'modal-action',
  'dialog-opened',
  'dialog-closed',
  'popover-opened',
  'popover-closed',
  'tooltip-opened',
  'tooltip-closed',
  'drawer-opened',
  'drawer-closed',
  'drawer-route-selected'
];

const OVERLAY_INTERACTION_REQUIRED_COMMANDS = [
  'open',
  'close',
  'show',
  'hide',
  'toggle',
  'focus-trap',
  'release-focus',
  'apply-inert',
  'release-inert',
  'lock-scroll',
  'unlock-scroll',
  'snapshot'
];

const OVERLAY_INTERACTION_REQUIRED_SCHEDULES = [
  'component.visible.mount',
  'component.idle.hydrate',
  'component.lazy.hydrate',
  'overlay.stack.open',
  'overlay.stack.close',
  'overlay.focus.trap',
  'overlay.inert.apply',
  'overlay.scroll.lock',
  'overlay.position.update',
  'a11y.announce',
  'diagnostics.snapshot'
];

const OVERLAY_INTERACTION_REQUIRED_ASSERTIONS = [
  'focus-trap-contained',
  'focus-return-on-close',
  'escape-topmost-only',
  'outside-click-policy',
  'inert-background-policy',
  'scroll-lock-balanced',
  'portal-container-stable',
  'reduced-motion-safe',
  'forced-colors-safe',
  'kernel-boundary-preserved'
];

const OVERLAY_INTERACTION_PROFILES = [
  {
    tag: 'x-modal',
    role: 'dialog',
    family: 'modal-dialog',
    modality: 'modal',
    focusTrap: 'required',
    inertStrategy: 'document-background-inert',
    escapeBehavior: 'close-topmost',
    outsideClick: 'overlay-close',
    scrollLock: 'balanced-document-lock',
    portalStrategy: 'host-local-fixed-layer',
    events: ['modal-opened', 'modal-closed', 'modal-action'],
    stateKey: 'modal-open-<id>',
    requiredCommands: ['open', 'close', 'focus-trap', 'apply-inert', 'lock-scroll', 'snapshot'],
    schedule: 'overlay.stack.open'
  },
  {
    tag: 'x-dialog',
    role: 'dialog',
    family: 'dialog',
    modality: 'modal',
    focusTrap: 'required',
    inertStrategy: 'document-background-inert',
    escapeBehavior: 'close-topmost',
    outsideClick: 'overlay-close',
    scrollLock: 'balanced-document-lock',
    portalStrategy: 'host-local-fixed-layer',
    events: ['dialog-opened', 'dialog-closed'],
    stateKey: 'dialog-open-<id>',
    requiredCommands: ['open', 'close', 'focus-trap', 'apply-inert', 'lock-scroll', 'snapshot'],
    schedule: 'overlay.stack.open'
  },
  {
    tag: 'x-popover',
    role: 'dialog',
    family: 'popover',
    modality: 'modal-optional',
    focusTrap: 'conditional-when-modal',
    inertStrategy: 'none-by-default',
    escapeBehavior: 'close-topmost',
    outsideClick: 'outside-click-close',
    scrollLock: 'none-by-default',
    portalStrategy: 'anchor-local-layer',
    events: ['popover-opened', 'popover-closed'],
    stateKey: 'xpopover-open-<id>',
    requiredCommands: ['show', 'hide', 'toggle', 'focus-trap', 'snapshot'],
    schedule: 'overlay.position.update'
  },
  {
    tag: 'x-tooltip',
    role: 'tooltip',
    family: 'tooltip',
    modality: 'non-modal',
    focusTrap: 'not-applicable',
    inertStrategy: 'not-applicable',
    escapeBehavior: 'dismiss-visible-tooltip',
    outsideClick: 'anchor-blur-or-hover-leave',
    scrollLock: 'not-applicable',
    portalStrategy: 'anchor-local-layer',
    events: ['tooltip-opened', 'tooltip-closed'],
    stateKey: 'xtooltip-open-<id>',
    requiredCommands: ['show', 'hide', 'toggle', 'snapshot'],
    schedule: 'overlay.position.update'
  },
  {
    tag: 'x-drawer',
    role: 'dialog',
    family: 'drawer',
    modality: 'modal-optional',
    focusTrap: 'conditional-when-modal',
    inertStrategy: 'document-background-inert-when-modal',
    escapeBehavior: 'close-topmost',
    outsideClick: 'overlay-close',
    scrollLock: 'balanced-document-lock-when-modal',
    portalStrategy: 'host-local-fixed-layer',
    events: ['drawer-opened', 'drawer-closed', 'drawer-route-selected'],
    stateKey: 'xdrawer-open-<id>',
    requiredCommands: ['open', 'close', 'toggle', 'focus-trap', 'apply-inert', 'lock-scroll', 'snapshot'],
    schedule: 'overlay.stack.open'
  }
];

function normalizeArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function unique(values) {
  return Array.from(new Set(normalizeArray(values).filter(Boolean)));
}

function createOverlayInteractionUxContract(input = {}) {
  const targets = unique(OVERLAY_INTERACTION_TARGETS.concat(normalizeArray(input.targets)));
  const profiles = OVERLAY_INTERACTION_PROFILES.map((profile) => ({ ...profile }));

  return {
    schema: OVERLAY_INTERACTION_UX_SCHEMA,
    status: 'accepted',
    workpackage: OVERLAY_INTERACTION_UX_WORKPACKAGE,
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
    domains: unique(OVERLAY_INTERACTION_REQUIRED_DOMAINS.concat(normalizeArray(input.domains))),
    requiredEvents: unique(OVERLAY_INTERACTION_REQUIRED_EVENTS.concat(normalizeArray(input.requiredEvents))),
    requiredCommands: unique(OVERLAY_INTERACTION_REQUIRED_COMMANDS.concat(normalizeArray(input.requiredCommands))),
    requiredSchedules: unique(OVERLAY_INTERACTION_REQUIRED_SCHEDULES.concat(normalizeArray(input.requiredSchedules))),
    overlayStack: {
      topmostEscapeOnly: true,
      zIndexPolicy: 'component-local-with-rmt-stack-record',
      stackEventRequired: true,
      routeChangeCloseAllowed: true
    },
    focusTrap: {
      containedTabCycleRequired: true,
      returnFocusRequired: true,
      preventScrollPreferred: true,
      delegatedFocusAllowed: true
    },
    inert: {
      backgroundInertRequired: true,
      ariaHiddenFallbackRequired: true,
      hostAdapterOwnsDomMutation: true
    },
    scrollLock: {
      balancedLockRequired: true,
      restoreScrollPositionRequired: true,
      bodyMutationOwnedByHostAdapter: true
    },
    portal: {
      stableContainerRequired: true,
      hostLocalLayerPreferred: true,
      rmtKernelDoesNotOwnDom: true
    },
    shell: {
      requiredSlots: ['default', 'trigger', 'actions'],
      requiredParts: ['root', 'overlay', 'surface', 'trigger', 'close', 'content'],
      states: ['closed', 'opening', 'open', 'closing', 'dismissed']
    },
    style: {
      tokens: ['--xtend-overlay-bg', '--xtend-overlay-surface', '--xtend-focus-outline', '--xtend-z-overlay'],
      forcedColorsRequired: true,
      reducedMotionRequired: true
    },
    events: {
      bubblingRequired: true,
      composedRequired: true,
      sourceDetailRequired: true,
      networkSchema: COMPONENT_NETWORK_CONTRACT_SCHEMA
    },
    rmt: {
      fixture: OVERLAY_INTERACTION_UX_FIXTURE,
      adapters: ['xtend.component', 'rmt.overlay-stack', 'rmt.state-scheduler-diagnostics'],
      shellFirst: true,
      noInlineRuntimeCode: true,
      scheduleRefsRequired: true,
      kernelBoundary: KERNEL_BOUNDARY
    },
    fabric: {
      lane: 'user-blocking',
      a11yLane: 'a11y',
      visibleLane: 'visible',
      diagnosticsLane: 'diagnostics',
      telemetryCorrelationRequired: true
    },
    docs: {
      contract: OVERLAY_INTERACTION_UX_CONTRACT_DOC,
      requiredSections: ['Overlay Stack', 'Focus Trap', 'Inert', 'Scroll Lock', 'Portal', 'RMT', 'Fabric', 'Testing']
    },
    tests: {
      suite: 'overlay-interaction-ux',
      assertions: OVERLAY_INTERACTION_REQUIRED_ASSERTIONS.slice(),
      fixtureRequired: true
    }
  };
}

function validateOverlayInteractionUxContract(contract) {
  const failures = [];
  const report = {
    schema: OVERLAY_INTERACTION_UX_REPORT_SCHEMA,
    ok: true,
    failures
  };

  if (!contract || contract.schema !== OVERLAY_INTERACTION_UX_SCHEMA) {
    failures.push('schema');
  }
  if (!contract || contract.kernelBoundary !== KERNEL_BOUNDARY) {
    failures.push('kernelBoundary');
  }
  OVERLAY_INTERACTION_TARGETS.forEach((tag) => {
    if (!contract || !Array.isArray(contract.targets) || !contract.targets.includes(tag)) {
      failures.push(`target:${tag}`);
    }
  });
  OVERLAY_INTERACTION_REQUIRED_DOMAINS.forEach((domain) => {
    if (!contract || !Array.isArray(contract.domains) || !contract.domains.includes(domain)) {
      failures.push(`domain:${domain}`);
    }
  });
  OVERLAY_INTERACTION_REQUIRED_EVENTS.forEach((eventName) => {
    if (!contract || !Array.isArray(contract.requiredEvents) || !contract.requiredEvents.includes(eventName)) {
      failures.push(`event:${eventName}`);
    }
  });
  OVERLAY_INTERACTION_REQUIRED_COMMANDS.forEach((commandName) => {
    if (!contract || !Array.isArray(contract.requiredCommands) || !contract.requiredCommands.includes(commandName)) {
      failures.push(`command:${commandName}`);
    }
  });
  OVERLAY_INTERACTION_REQUIRED_SCHEDULES.forEach((scheduleId) => {
    if (!contract || !Array.isArray(contract.requiredSchedules) || !contract.requiredSchedules.includes(scheduleId)) {
      failures.push(`schedule:${scheduleId}`);
    }
  });
  if (!contract || !contract.overlayStack || contract.overlayStack.topmostEscapeOnly !== true) {
    failures.push('overlayStack.topmostEscapeOnly');
  }
  if (!contract || !contract.focusTrap || contract.focusTrap.containedTabCycleRequired !== true) {
    failures.push('focusTrap.containedTabCycleRequired');
  }
  if (!contract || !contract.focusTrap || contract.focusTrap.returnFocusRequired !== true) {
    failures.push('focusTrap.returnFocusRequired');
  }
  if (!contract || !contract.inert || contract.inert.backgroundInertRequired !== true) {
    failures.push('inert.backgroundInertRequired');
  }
  if (!contract || !contract.scrollLock || contract.scrollLock.balancedLockRequired !== true) {
    failures.push('scrollLock.balancedLockRequired');
  }
  if (!contract || !contract.portal || contract.portal.stableContainerRequired !== true) {
    failures.push('portal.stableContainerRequired');
  }
  if (!contract || !contract.rmt || contract.rmt.shellFirst !== true || contract.rmt.noInlineRuntimeCode !== true) {
    failures.push('rmt.shellFirst');
  }
  if (!contract || !contract.fabric || contract.fabric.telemetryCorrelationRequired !== true) {
    failures.push('fabric.telemetryCorrelationRequired');
  }
  OVERLAY_INTERACTION_REQUIRED_ASSERTIONS.forEach((assertion) => {
    if (!contract || !contract.tests || !Array.isArray(contract.tests.assertions) || !contract.tests.assertions.includes(assertion)) {
      failures.push(`assertion:${assertion}`);
    }
  });

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
  KERNEL_BOUNDARY,
  OVERLAY_INTERACTION_PROFILES,
  OVERLAY_INTERACTION_REQUIRED_ASSERTIONS,
  OVERLAY_INTERACTION_REQUIRED_COMMANDS,
  OVERLAY_INTERACTION_REQUIRED_DOMAINS,
  OVERLAY_INTERACTION_REQUIRED_EVENTS,
  OVERLAY_INTERACTION_REQUIRED_SCHEDULES,
  OVERLAY_INTERACTION_TARGETS,
  OVERLAY_INTERACTION_UX_CONTRACT_DOC,
  OVERLAY_INTERACTION_UX_FIXTURE,
  OVERLAY_INTERACTION_UX_REPORT_SCHEMA,
  OVERLAY_INTERACTION_UX_SCHEMA,
  OVERLAY_INTERACTION_UX_WORKPACKAGE,
  RMT_SHELL_AUTHORING_SCHEMA,
  RUNTIME_A11Y_CONTRACT_SCHEMA,
  createOverlayInteractionUxContract,
  validateOverlayInteractionUxContract
};
