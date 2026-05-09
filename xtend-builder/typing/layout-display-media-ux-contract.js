const LAYOUT_DISPLAY_MEDIA_UX_SCHEMA = 'xtend.component.layout-display-media-ux.v1';
const LAYOUT_DISPLAY_MEDIA_UX_REPORT_SCHEMA = 'xtend.component.layout-display-media-ux-report.v1';
const LAYOUT_DISPLAY_MEDIA_UX_WORKPACKAGE = 'WP-E11-12';
const LAYOUT_DISPLAY_MEDIA_UX_CONTRACT_DOC = 'development/XTend-Layout-Display-und-Media-Shell-Reife-Contract.md';
const LAYOUT_DISPLAY_MEDIA_UX_FIXTURE = 'tests/fixtures/rmt-layout-display-media-ux.rmt';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';
const COMPONENT_CONTRACT_V2_SCHEMA = 'xtend.component.contract.v2';
const COMPONENT_SHELL_CONTRACT_SCHEMA = 'xtend.component.shell.v1';
const COMPONENT_STYLING_CONTRACT_SCHEMA = 'xtend.component.styling.v1';
const RUNTIME_A11Y_CONTRACT_SCHEMA = 'xtend.component.runtime-a11y.v1';
const COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA = 'xtend.component.ux-performance.v1';
const COMPONENT_NETWORK_CONTRACT_SCHEMA = 'xtend.component.network.v1';
const RMT_SHELL_AUTHORING_SCHEMA = 'xtend.rmt.shell-authoring.v1';
const FABRIC_BOUNDARY_SCHEMA = 'xtend.component.fabric-boundary.v2';

const LAYOUT_DISPLAY_MEDIA_TARGETS = [
  'x-section',
  'x-cards',
  'x-header',
  'x-footer',
  'x-hero',
  'x-type',
  'x-code',
  'x-masonry',
  'x-summary',
  'x-player',
  'x-lightbox'
];

const LAYOUT_DISPLAY_MEDIA_REQUIRED_DOMAINS = [
  'shell',
  'style',
  'a11y',
  'responsiveLayout',
  'contentProjection',
  'mediaLifecycle',
  'lazyLoading',
  'overflow',
  'aspectRatio',
  'events',
  'commands',
  'state',
  'rmt',
  'fabric',
  'performance',
  'docs',
  'tests'
];

const LAYOUT_DISPLAY_MEDIA_REQUIRED_EVENTS = [
  'section-rendered',
  'cards-layout',
  'header-ready',
  'footer-ready',
  'hero-rendered',
  'typing-started',
  'typing-completed',
  'code-copied',
  'masonry-layout',
  'open',
  'close',
  'xplayer-play',
  'xplayer-pause',
  'lightbox-opened',
  'lightbox-closed'
];

const LAYOUT_DISPLAY_MEDIA_REQUIRED_COMMANDS = [
  'render',
  'hydrate',
  'measure',
  'layout',
  'lazy-load',
  'preload-media',
  'play-media',
  'pause-media',
  'copy',
  'expand',
  'collapse',
  'snapshot'
];

const LAYOUT_DISPLAY_MEDIA_REQUIRED_SCHEDULES = [
  'component.shell.render',
  'component.visible.mount',
  'component.idle.hydrate',
  'component.lazy.hydrate',
  'layout.measure',
  'layout.reflow.commit',
  'media.lazy.load',
  'media.playback.user',
  'a11y.announce',
  'diagnostics.snapshot'
];

const LAYOUT_DISPLAY_MEDIA_REQUIRED_ASSERTIONS = [
  'responsive-overflow-safe',
  'css-parts-present',
  'slot-contract-stable',
  'lazy-media-scheduled',
  'aspect-ratio-stable',
  'reduced-motion-safe',
  'forced-colors-safe',
  'docs-app-compatible',
  'fabric-lane-profile',
  'kernel-boundary-preserved'
];

const LAYOUT_DISPLAY_MEDIA_PROFILES = [
  {
    tag: 'x-section',
    role: 'region',
    family: 'layout-section',
    contentKind: 'sectioned-content',
    responsiveStrategy: 'slot-grid-column-row',
    lazyPolicy: 'visible-hydrate',
    overflowPolicy: 'horizontal-scroll-contained',
    aspectRatio: 'content-driven',
    events: ['section-rendered'],
    stateKey: 'xsection-state-<id>',
    requiredCommands: ['render', 'measure', 'layout', 'snapshot'],
    schedule: 'layout.measure'
  },
  {
    tag: 'x-cards',
    role: 'list',
    family: 'layout-cards',
    contentKind: 'card-grid',
    responsiveStrategy: 'auto-collapse-grid',
    lazyPolicy: 'visible-hydrate',
    overflowPolicy: 'no-page-overflow',
    aspectRatio: 'card-content-driven',
    events: ['cards-layout'],
    stateKey: 'xcards-state-<id>',
    requiredCommands: ['render', 'measure', 'layout', 'snapshot'],
    schedule: 'layout.reflow.commit'
  },
  {
    tag: 'x-header',
    role: 'banner',
    family: 'layout-header',
    contentKind: 'app-shell-navigation',
    responsiveStrategy: 'utility-slot-drawer-reflow',
    lazyPolicy: 'visible-hydrate',
    overflowPolicy: 'drawer-contained',
    aspectRatio: 'content-driven',
    events: ['header-ready', 'menu-opened', 'menu-closed'],
    stateKey: 'xheader-state-<id>',
    requiredCommands: ['render', 'measure', 'layout', 'snapshot'],
    schedule: 'component.visible.mount'
  },
  {
    tag: 'x-footer',
    role: 'contentinfo',
    family: 'layout-footer',
    contentKind: 'app-shell-footer',
    responsiveStrategy: 'wrap-to-column',
    lazyPolicy: 'visible-hydrate',
    overflowPolicy: 'no-page-overflow',
    aspectRatio: 'content-driven',
    events: ['footer-ready', 'theme-applied', 'logo-loaded'],
    stateKey: 'xfooter-state-<id>',
    requiredCommands: ['render', 'measure', 'layout', 'snapshot'],
    schedule: 'component.visible.mount'
  },
  {
    tag: 'x-hero',
    role: 'banner',
    family: 'display-hero',
    contentKind: 'hero-media-copy',
    responsiveStrategy: 'fluid-content-box',
    lazyPolicy: 'visible-hydrate',
    overflowPolicy: 'viewport-bounded',
    aspectRatio: 'viewport-or-content',
    events: ['hero-rendered', 'hero-animated'],
    stateKey: 'xhero-state-<id>',
    requiredCommands: ['render', 'measure', 'layout', 'snapshot'],
    schedule: 'component.shell.render'
  },
  {
    tag: 'x-type',
    role: 'text',
    family: 'display-text-effect',
    contentKind: 'animated-text',
    responsiveStrategy: 'inline-text-preserve',
    lazyPolicy: 'idle-hydrate',
    overflowPolicy: 'inline-overflow-safe',
    aspectRatio: 'text-driven',
    events: ['typing-started', 'typing-completed', 'text-erased'],
    stateKey: 'xtype-current',
    requiredCommands: ['render', 'hydrate', 'snapshot'],
    schedule: 'component.idle.hydrate'
  },
  {
    tag: 'x-code',
    role: 'region',
    family: 'display-code',
    contentKind: 'code-block',
    responsiveStrategy: 'pre-wrap-overflow-contained',
    lazyPolicy: 'idle-hydrate',
    overflowPolicy: 'internal-scroll',
    aspectRatio: 'content-driven',
    events: ['code-copied'],
    stateKey: 'xcode-state-<id>',
    requiredCommands: ['render', 'copy', 'snapshot'],
    schedule: 'component.idle.hydrate'
  },
  {
    tag: 'x-masonry',
    role: 'list',
    family: 'layout-masonry',
    contentKind: 'reorderable-card-grid',
    responsiveStrategy: 'column-count-grid',
    lazyPolicy: 'visible-hydrate',
    overflowPolicy: 'drag-contained',
    aspectRatio: 'content-driven',
    events: ['masonry-layout'],
    stateKey: 'xmasonry-state-<id>',
    requiredCommands: ['render', 'measure', 'layout', 'snapshot'],
    schedule: 'layout.reflow.commit'
  },
  {
    tag: 'x-summary',
    role: 'button',
    family: 'display-disclosure',
    contentKind: 'collapsible-content',
    responsiveStrategy: 'block-disclosure',
    lazyPolicy: 'visible-hydrate',
    overflowPolicy: 'content-contained',
    aspectRatio: 'content-driven',
    events: ['open', 'close'],
    stateKey: 'xsummary-open-<id>',
    requiredCommands: ['expand', 'collapse', 'snapshot'],
    schedule: 'component.visible.mount'
  },
  {
    tag: 'x-player',
    role: 'region',
    family: 'media-player',
    contentKind: 'audio-video',
    responsiveStrategy: 'aspect-ratio-media-box',
    lazyPolicy: 'lazy-media-load',
    overflowPolicy: 'controls-contained',
    aspectRatio: '16:9-default-or-author-width-height',
    events: ['xplayer-play', 'xplayer-pause', 'xplayer-fullscreen', 'xplayer-pip'],
    stateKey: 'xplayer-state-<id>',
    requiredCommands: ['preload-media', 'play-media', 'pause-media', 'snapshot'],
    schedule: 'media.lazy.load'
  },
  {
    tag: 'x-lightbox',
    role: 'dialog',
    family: 'media-lightbox',
    contentKind: 'image-preview-overlay',
    responsiveStrategy: 'viewport-bounded-media',
    lazyPolicy: 'lazy-media-load',
    overflowPolicy: 'viewport-overlay-contained',
    aspectRatio: 'media-contain',
    events: ['lightbox-opened', 'lightbox-closed'],
    stateKey: 'xlightbox-open-<id>',
    requiredCommands: ['lazy-load', 'expand', 'collapse', 'snapshot'],
    schedule: 'media.lazy.load'
  }
];

function normalizeArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function unique(values) {
  return Array.from(new Set(normalizeArray(values).filter(Boolean)));
}

function createLayoutDisplayMediaUxContract(input = {}) {
  const targets = unique(LAYOUT_DISPLAY_MEDIA_TARGETS.concat(normalizeArray(input.targets)));
  const profiles = LAYOUT_DISPLAY_MEDIA_PROFILES.map((profile) => ({ ...profile }));

  return {
    schema: LAYOUT_DISPLAY_MEDIA_UX_SCHEMA,
    status: 'accepted',
    workpackage: LAYOUT_DISPLAY_MEDIA_UX_WORKPACKAGE,
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
    domains: unique(LAYOUT_DISPLAY_MEDIA_REQUIRED_DOMAINS.concat(normalizeArray(input.domains))),
    requiredEvents: unique(LAYOUT_DISPLAY_MEDIA_REQUIRED_EVENTS.concat(normalizeArray(input.requiredEvents))),
    requiredCommands: unique(LAYOUT_DISPLAY_MEDIA_REQUIRED_COMMANDS.concat(normalizeArray(input.requiredCommands))),
    requiredSchedules: unique(LAYOUT_DISPLAY_MEDIA_REQUIRED_SCHEDULES.concat(normalizeArray(input.requiredSchedules))),
    responsiveLayout: {
      viewportSafeRequired: true,
      noPageOverflowRequired: true,
      slotReflowRequired: true,
      docsAppShellCompatible: true
    },
    contentProjection: {
      namedSlotsRequired: true,
      defaultSlotRequired: true,
      slottedContentMustNotBreakShell: true
    },
    mediaLifecycle: {
      lazyMediaLoadRequired: true,
      playbackUserLaneRequired: true,
      posterOrPlaceholderRequired: true,
      noAutoplayDependency: true
    },
    lazyLoading: {
      visibleHydrationRequired: true,
      idleHydrationAllowed: true,
      lazyMediaScheduleRequired: true
    },
    shell: {
      requiredSlots: ['default', 'header', 'footer', 'media', 'actions'],
      requiredParts: ['root', 'container', 'content', 'media', 'controls', 'item'],
      states: ['empty', 'loading', 'ready', 'error', 'expanded', 'collapsed', 'playing', 'paused']
    },
    style: {
      tokens: ['--xtend-layout-gap', '--xtend-layout-padding', '--xtend-media-radius', '--xtend-focus-outline'],
      forcedColorsRequired: true,
      reducedMotionRequired: true,
      densitySafe: true
    },
    rmt: {
      fixture: LAYOUT_DISPLAY_MEDIA_UX_FIXTURE,
      adapters: ['xtend.component', 'rmt.layout-host', 'rmt.media-host', 'rmt.state-scheduler-diagnostics'],
      shellFirst: true,
      noInlineRuntimeCode: true,
      scheduleRefsRequired: true,
      kernelBoundary: KERNEL_BOUNDARY
    },
    fabric: {
      lane: 'visible',
      mediaLane: 'media',
      a11yLane: 'a11y',
      diagnosticsLane: 'diagnostics',
      telemetryCorrelationRequired: true
    },
    docs: {
      contract: LAYOUT_DISPLAY_MEDIA_UX_CONTRACT_DOC,
      requiredSections: ['Responsive Shell', 'Slots', 'CSS Parts', 'Lazy Media', 'RMT', 'Fabric', 'Testing']
    },
    tests: {
      suite: 'layout-display-media-ux',
      assertions: LAYOUT_DISPLAY_MEDIA_REQUIRED_ASSERTIONS.slice(),
      fixtureRequired: true
    }
  };
}

function validateLayoutDisplayMediaUxContract(contract) {
  const failures = [];
  const report = {
    schema: LAYOUT_DISPLAY_MEDIA_UX_REPORT_SCHEMA,
    ok: true,
    failures
  };

  if (!contract || contract.schema !== LAYOUT_DISPLAY_MEDIA_UX_SCHEMA) failures.push('schema');
  if (!contract || contract.kernelBoundary !== KERNEL_BOUNDARY) failures.push('kernelBoundary');
  LAYOUT_DISPLAY_MEDIA_TARGETS.forEach((tag) => {
    if (!contract || !Array.isArray(contract.targets) || !contract.targets.includes(tag)) failures.push(`target:${tag}`);
  });
  LAYOUT_DISPLAY_MEDIA_REQUIRED_DOMAINS.forEach((domain) => {
    if (!contract || !Array.isArray(contract.domains) || !contract.domains.includes(domain)) failures.push(`domain:${domain}`);
  });
  LAYOUT_DISPLAY_MEDIA_REQUIRED_EVENTS.forEach((eventName) => {
    if (!contract || !Array.isArray(contract.requiredEvents) || !contract.requiredEvents.includes(eventName)) failures.push(`event:${eventName}`);
  });
  LAYOUT_DISPLAY_MEDIA_REQUIRED_COMMANDS.forEach((commandName) => {
    if (!contract || !Array.isArray(contract.requiredCommands) || !contract.requiredCommands.includes(commandName)) failures.push(`command:${commandName}`);
  });
  LAYOUT_DISPLAY_MEDIA_REQUIRED_SCHEDULES.forEach((scheduleId) => {
    if (!contract || !Array.isArray(contract.requiredSchedules) || !contract.requiredSchedules.includes(scheduleId)) failures.push(`schedule:${scheduleId}`);
  });
  if (!contract || !contract.responsiveLayout || contract.responsiveLayout.viewportSafeRequired !== true) failures.push('responsiveLayout.viewportSafeRequired');
  if (!contract || !contract.contentProjection || contract.contentProjection.namedSlotsRequired !== true) failures.push('contentProjection.namedSlotsRequired');
  if (!contract || !contract.mediaLifecycle || contract.mediaLifecycle.lazyMediaLoadRequired !== true) failures.push('mediaLifecycle.lazyMediaLoadRequired');
  if (!contract || !contract.lazyLoading || contract.lazyLoading.visibleHydrationRequired !== true) failures.push('lazyLoading.visibleHydrationRequired');
  if (!contract || !contract.rmt || contract.rmt.shellFirst !== true || contract.rmt.noInlineRuntimeCode !== true) failures.push('rmt.shellFirst');
  if (!contract || !contract.fabric || contract.fabric.telemetryCorrelationRequired !== true) failures.push('fabric.telemetryCorrelationRequired');
  LAYOUT_DISPLAY_MEDIA_REQUIRED_ASSERTIONS.forEach((assertion) => {
    if (!contract || !contract.tests || !Array.isArray(contract.tests.assertions) || !contract.tests.assertions.includes(assertion)) failures.push(`assertion:${assertion}`);
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
  LAYOUT_DISPLAY_MEDIA_PROFILES,
  LAYOUT_DISPLAY_MEDIA_REQUIRED_ASSERTIONS,
  LAYOUT_DISPLAY_MEDIA_REQUIRED_COMMANDS,
  LAYOUT_DISPLAY_MEDIA_REQUIRED_DOMAINS,
  LAYOUT_DISPLAY_MEDIA_REQUIRED_EVENTS,
  LAYOUT_DISPLAY_MEDIA_REQUIRED_SCHEDULES,
  LAYOUT_DISPLAY_MEDIA_TARGETS,
  LAYOUT_DISPLAY_MEDIA_UX_CONTRACT_DOC,
  LAYOUT_DISPLAY_MEDIA_UX_FIXTURE,
  LAYOUT_DISPLAY_MEDIA_UX_REPORT_SCHEMA,
  LAYOUT_DISPLAY_MEDIA_UX_SCHEMA,
  LAYOUT_DISPLAY_MEDIA_UX_WORKPACKAGE,
  RMT_SHELL_AUTHORING_SCHEMA,
  RUNTIME_A11Y_CONTRACT_SCHEMA,
  createLayoutDisplayMediaUxContract,
  validateLayoutDisplayMediaUxContract
};
