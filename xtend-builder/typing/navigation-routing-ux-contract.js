const NAVIGATION_ROUTING_UX_SCHEMA = 'xtend.component.navigation-routing-ux.v1';
const NAVIGATION_ROUTING_UX_REPORT_SCHEMA = 'xtend.component.navigation-routing-ux-report.v1';
const NAVIGATION_ROUTING_UX_WORKPACKAGE = 'WP-E11-10';
const NAVIGATION_ROUTING_UX_CONTRACT_DOC = 'development/XTend-Navigation-und-Routing-UX-Reife-Contract.md';
const NAVIGATION_ROUTING_UX_FIXTURE = 'tests/fixtures/rmt-navigation-routing-ux.rmt';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';
const COMPONENT_CONTRACT_V2_SCHEMA = 'xtend.component.contract.v2';
const COMPONENT_SHELL_CONTRACT_SCHEMA = 'xtend.component.shell.v1';
const COMPONENT_STYLING_CONTRACT_SCHEMA = 'xtend.component.styling.v1';
const RUNTIME_A11Y_CONTRACT_SCHEMA = 'xtend.component.runtime-a11y.v1';
const COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA = 'xtend.component.ux-performance.v1';
const COMPONENT_NETWORK_CONTRACT_SCHEMA = 'xtend.component.network.v1';
const RMT_SHELL_AUTHORING_SCHEMA = 'xtend.rmt.shell-authoring.v1';
const FABRIC_BOUNDARY_SCHEMA = 'xtend.component.fabric-boundary.v2';

const NAVIGATION_ROUTING_TARGETS = [
  'x-router',
  'x-link'
];

const NAVIGATION_ROUTING_REQUIRED_DOMAINS = [
  'shell',
  'style',
  'a11y',
  'activeState',
  'focusRestore',
  'routeAnnouncements',
  'keyboardNavigation',
  'events',
  'commands',
  'state',
  'rmt',
  'fabric',
  'performance',
  'docs',
  'tests'
];

const NAVIGATION_ROUTING_REQUIRED_EVENTS = [
  'xrouter-before-navigate',
  'route-changed',
  'routechange',
  'xrouter-after-navigate',
  'route-announced',
  'xrouter-routes-registered',
  'before-navigate',
  'after-navigate',
  'x-navigate'
];

const NAVIGATION_ROUTING_REQUIRED_COMMANDS = [
  'navigate',
  'register-routes',
  'focus-route',
  'announce-route',
  'update-active',
  'snapshot'
];

const NAVIGATION_ROUTING_REQUIRED_SCHEDULES = [
  'component.visible.mount',
  'route.visible.render',
  'route.transition.render',
  'route.focus.restore',
  'a11y.announce',
  'ui.user-blocking.navigation',
  'diagnostics.snapshot'
];

const NAVIGATION_ROUTING_REQUIRED_ASSERTIONS = [
  'active-state-aria-current',
  'focus-restore-after-route',
  'route-announcement-live-region',
  'keyboard-activation',
  'history-hash-mode-compatible',
  'event-source-detail',
  'fabric-lane-profile',
  'rmt-shell-authoring-ready',
  'feedback-status-compatible',
  'kernel-boundary-preserved'
];

const NAVIGATION_ROUTING_PROFILES = [
  {
    tag: 'x-router',
    role: 'main',
    family: 'router-outlet',
    navigationMode: 'hash-or-history',
    activeState: 'route-context',
    focusRestore: 'outlet-focus-after-render',
    routeAnnouncement: 'polite-live-region',
    keyboardNavigation: 'delegated-to-links',
    events: ['xrouter-before-navigate', 'route-changed', 'routechange', 'xrouter-after-navigate', 'route-announced', 'xrouter-routes-registered'],
    stateKey: 'xtend.router.current',
    requiredCommands: ['navigate', 'register-routes', 'focus-route', 'announce-route', 'snapshot'],
    schedule: 'route.visible.render'
  },
  {
    tag: 'x-link',
    role: 'link',
    family: 'router-link',
    navigationMode: 'hash-or-history',
    activeState: 'aria-current-page',
    focusRestore: 'preserve-link-focus',
    routeAnnouncement: 'delegated-to-router',
    keyboardNavigation: 'enter-space-activation',
    events: ['before-navigate', 'after-navigate', 'x-navigate'],
    stateKey: 'xlink-active-<id>',
    requiredCommands: ['navigate', 'update-active', 'snapshot'],
    schedule: 'ui.user-blocking.navigation'
  }
];

function normalizeArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function unique(values) {
  return Array.from(new Set(normalizeArray(values).filter(Boolean)));
}

function createNavigationRoutingUxContract(input = {}) {
  const targets = unique(NAVIGATION_ROUTING_TARGETS.concat(normalizeArray(input.targets)));
  const profiles = NAVIGATION_ROUTING_PROFILES.map((profile) => ({ ...profile }));

  return {
    schema: NAVIGATION_ROUTING_UX_SCHEMA,
    status: 'accepted',
    workpackage: NAVIGATION_ROUTING_UX_WORKPACKAGE,
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
    domains: unique(NAVIGATION_ROUTING_REQUIRED_DOMAINS.concat(normalizeArray(input.domains))),
    requiredEvents: unique(NAVIGATION_ROUTING_REQUIRED_EVENTS.concat(normalizeArray(input.requiredEvents))),
    requiredCommands: unique(NAVIGATION_ROUTING_REQUIRED_COMMANDS.concat(normalizeArray(input.requiredCommands))),
    requiredSchedules: unique(NAVIGATION_ROUTING_REQUIRED_SCHEDULES.concat(normalizeArray(input.requiredSchedules))),
    activeState: {
      ariaCurrentRequired: true,
      currentRouteStateRequired: true,
      linkStateMirrorRequired: true
    },
    focusRestore: {
      routeFocusTargetRequired: true,
      focusAfterRenderRequired: true,
      focusPreventScrollPreferred: true,
      skipExternalLinks: true
    },
    routeAnnouncements: {
      liveRegion: 'polite',
      ariaAtomicRequired: true,
      screenreaderSignalContract: 'xtend.a11y.screenreader-signals.v1',
      feedbackStatusCompatible: true
    },
    keyboardNavigation: {
      enterRequired: true,
      spaceRequired: true,
      nativeAnchorSemanticsPreserved: true,
      focusVisibleRequired: true
    },
    shell: {
      requiredSlots: ['default'],
      requiredParts: ['root', 'outlet', 'announcer', 'link'],
      states: ['ready', 'active', 'navigating', 'rendered', 'not-found']
    },
    style: {
      tokens: ['--xtend-router-focus', '--xtend-link-color', '--xtend-link-active-color', '--xtend-link-focus'],
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
      fixture: NAVIGATION_ROUTING_UX_FIXTURE,
      adapters: ['xtend.component', 'xtend.xrouter'],
      shellFirst: true,
      routeContextRequired: true,
      noInlineRuntimeCode: true,
      scheduleRefsRequired: true
    },
    fabric: {
      lane: 'transition',
      userBlockingLane: 'user-blocking',
      a11yLane: 'a11y',
      diagnosticsLane: 'diagnostics',
      telemetryCorrelationRequired: true
    },
    docs: {
      contract: NAVIGATION_ROUTING_UX_CONTRACT_DOC,
      requiredSections: ['Active State', 'Focus Restore', 'Route Announcements', 'Keyboard Navigation', 'RMT', 'Fabric', 'Testing']
    },
    tests: {
      suite: 'navigation-routing-ux',
      assertions: NAVIGATION_ROUTING_REQUIRED_ASSERTIONS.slice(),
      fixtureRequired: true
    }
  };
}

function validateNavigationRoutingUxContract(contract) {
  const failures = [];
  const report = {
    schema: NAVIGATION_ROUTING_UX_REPORT_SCHEMA,
    ok: true,
    failures
  };

  if (!contract || contract.schema !== NAVIGATION_ROUTING_UX_SCHEMA) {
    failures.push('schema');
  }
  if (!contract || contract.kernelBoundary !== KERNEL_BOUNDARY) {
    failures.push('kernelBoundary');
  }
  NAVIGATION_ROUTING_TARGETS.forEach((tag) => {
    if (!contract || !Array.isArray(contract.targets) || !contract.targets.includes(tag)) {
      failures.push(`target:${tag}`);
    }
  });
  NAVIGATION_ROUTING_REQUIRED_DOMAINS.forEach((domain) => {
    if (!contract || !Array.isArray(contract.domains) || !contract.domains.includes(domain)) {
      failures.push(`domain:${domain}`);
    }
  });
  NAVIGATION_ROUTING_REQUIRED_EVENTS.forEach((eventName) => {
    if (!contract || !Array.isArray(contract.requiredEvents) || !contract.requiredEvents.includes(eventName)) {
      failures.push(`event:${eventName}`);
    }
  });
  NAVIGATION_ROUTING_REQUIRED_COMMANDS.forEach((commandName) => {
    if (!contract || !Array.isArray(contract.requiredCommands) || !contract.requiredCommands.includes(commandName)) {
      failures.push(`command:${commandName}`);
    }
  });
  NAVIGATION_ROUTING_REQUIRED_SCHEDULES.forEach((scheduleId) => {
    if (!contract || !Array.isArray(contract.requiredSchedules) || !contract.requiredSchedules.includes(scheduleId)) {
      failures.push(`schedule:${scheduleId}`);
    }
  });
  if (!contract || !contract.activeState || contract.activeState.ariaCurrentRequired !== true) {
    failures.push('activeState.ariaCurrentRequired');
  }
  if (!contract || !contract.focusRestore || contract.focusRestore.focusAfterRenderRequired !== true) {
    failures.push('focusRestore.focusAfterRenderRequired');
  }
  if (!contract || !contract.routeAnnouncements || contract.routeAnnouncements.ariaAtomicRequired !== true) {
    failures.push('routeAnnouncements.ariaAtomicRequired');
  }
  if (!contract || !contract.keyboardNavigation || contract.keyboardNavigation.spaceRequired !== true) {
    failures.push('keyboardNavigation.spaceRequired');
  }
  if (!contract || !contract.rmt || contract.rmt.shellFirst !== true || contract.rmt.noInlineRuntimeCode !== true) {
    failures.push('rmt.shellFirst');
  }
  if (!contract || !contract.fabric || contract.fabric.telemetryCorrelationRequired !== true) {
    failures.push('fabric.telemetryCorrelationRequired');
  }
  NAVIGATION_ROUTING_REQUIRED_ASSERTIONS.forEach((assertion) => {
    if (!contract || !contract.tests || !Array.isArray(contract.tests.assertions) || !contract.tests.assertions.includes(assertion)) {
      failures.push(`assertion:${assertion}`);
    }
  });

  report.ok = failures.length === 0;
  return report;
}

module.exports = {
  NAVIGATION_ROUTING_PROFILES,
  NAVIGATION_ROUTING_REQUIRED_ASSERTIONS,
  NAVIGATION_ROUTING_REQUIRED_COMMANDS,
  NAVIGATION_ROUTING_REQUIRED_DOMAINS,
  NAVIGATION_ROUTING_REQUIRED_EVENTS,
  NAVIGATION_ROUTING_REQUIRED_SCHEDULES,
  NAVIGATION_ROUTING_TARGETS,
  NAVIGATION_ROUTING_UX_CONTRACT_DOC,
  NAVIGATION_ROUTING_UX_FIXTURE,
  NAVIGATION_ROUTING_UX_REPORT_SCHEMA,
  NAVIGATION_ROUTING_UX_SCHEMA,
  NAVIGATION_ROUTING_UX_WORKPACKAGE,
  KERNEL_BOUNDARY,
  createNavigationRoutingUxContract,
  validateNavigationRoutingUxContract
};
