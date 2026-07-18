import { xstate } from '../../../../components/xstate.js';
import {
  createRmtFormat,
  createRmtRuntime,
  createRmtStateSchedulerDiagnosticsBridge,
  createRmtXRouterAdapter,
  createRmtXtendComponentAdapter
} from '../../../../xtendrmt/rmt-runtime.esm.js';
import {
  createRmtComponentCapabilityRegistry
} from '../../../../xtendrmt/rmt-component-capability-registry.js';

const DEMO_DOCUMENT_URL = '/demos/xtendrmt/examples/flagship/source.rmt';
const DEMO_CORE_DOCUMENT_URL = '/demos/xtendrmt/examples/flagship/generated/core.json';
const ROUTE_COMPONENTS = Object.freeze({
  overview: 'x-rmt-route-overview',
  scheduler: 'x-rmt-route-scheduler',
  routing: 'x-rmt-route-routing',
  templating: 'x-rmt-route-template-pilot',
  primitives: 'x-rmt-route-primitives',
  media: 'x-rmt-route-media',
  adapter: 'x-rmt-route-adapter',
  streaming: 'x-rmt-route-streaming',
  sourceToSea: 'x-rmt-route-source-to-sea',
  enterprise: 'x-rmt-route-enterprise',
  governance: 'x-rmt-route-governance',
  nativeFirst: 'x-rmt-route-native-first',
  enterpriseFallback: 'x-rmt-route-enterprise-fallback'
});

const XTEND_COMPONENT_MANIFEST = Object.freeze({
  'x-rmt-route-overview': 'xtendrmt-bestcase-demo.js#x-rmt-route-overview',
  'x-rmt-route-scheduler': 'xtendrmt-bestcase-demo.js#x-rmt-route-scheduler',
  'x-rmt-route-routing': 'xtendrmt-bestcase-demo.js#x-rmt-route-routing',
  'x-rmt-route-template-pilot': 'xtendrmt-bestcase-demo.js#x-rmt-route-template-pilot',
  'x-rmt-route-primitives': 'xtendrmt-bestcase-demo.js#x-rmt-route-primitives',
  'x-rmt-route-media': 'xtendrmt-bestcase-demo.js#x-rmt-route-media',
  'x-rmt-route-adapter': 'xtendrmt-bestcase-demo.js#x-rmt-route-adapter',
  'x-rmt-route-streaming': 'xtendrmt-bestcase-demo.js#x-rmt-route-streaming',
  'x-rmt-route-source-to-sea': 'xtendrmt-bestcase-demo.js#x-rmt-route-source-to-sea',
  'x-rmt-route-enterprise': 'xtendrmt-bestcase-demo.js#x-rmt-route-enterprise',
  'x-rmt-route-governance': 'xtendrmt-bestcase-demo.js#x-rmt-route-governance',
  'x-rmt-route-native-first': 'xtendrmt-bestcase-demo.js#x-rmt-route-native-first',
  'x-rmt-route-enterprise-fallback': 'xtendrmt-bestcase-demo.js#x-rmt-route-enterprise-fallback',
  'x-header': '../../../../components/xheader.js',
  'x-section': '../../../../components/xsection.js',
  'x-cards': '../../../../components/xcards.js',
  'x-card': '../../../../components/xcard.js',
  'x-tabs': '../../../../components/xtabs.js',
  'x-tab': '../../../../components/xtab.js',
  'x-button': '../../../../components/xbutton.js',
  'x-alert': '../../../../components/xalert.js',
  'x-code': '../../../../components/xcode.js',
  'x-player': '../../../../components/xplayer.js',
  'x-popover': '../../../../components/xpopover.js',
  'x-progress': '../../../../components/xprogress.js',
  'x-status': '../../../../components/xstatus.js',
  'x-toast': '../../../../components/xtoast.js',
  'x-modal': '../../../../components/xmodal.js',
  'x-router': '../../../../components/xrouter.js',
  'x-route': '../../../../components/xrouter.js',
  'x-footer': '../../../../components/xfooter.js'
});

const DEMO_ROUTE_ORDER = Object.freeze([
  'kernel',
  'scheduler',
  'routing',
  'templating',
  'primitives',
  'media',
  'adapter',
  'streaming',
  'sourceToSea',
  'enterprise',
  'governance',
  'nativeFirst'
]);
const DEMO_ROUTE_CONFIG = Object.freeze({
  kernel: Object.freeze({
    path: '/',
    title: 'XTendRMT Kernel BestCase',
    component: ROUTE_COMPONENTS.overview,
    template: 'demo.kernel',
    schedule: 'route.visible.render',
    metadata: Object.freeze({
      metaDescription: 'RMT Kernel und XTend UI in einer Demo.'
    })
  }),
  scheduler: Object.freeze({
    path: '/scheduler',
    title: 'XTendRMT Scheduler',
    component: ROUTE_COMPONENTS.scheduler,
    template: 'demo.scheduler',
    schedule: 'route.visible.render',
    metadata: Object.freeze({
      metaDescription: 'RMT Scheduler Diagnostics und Endpoint-Ausfuehrung.'
    })
  }),
  routing: Object.freeze({
    path: '/routing',
    title: 'XTendRMT Routing DSL',
    component: ROUTE_COMPONENTS.routing,
    template: 'demo.routing',
    schedule: 'route.visible.render',
    metadata: Object.freeze({
      metaDescription: 'XRouter-Routen werden aus RMT vNext Surfaces erzeugt.'
    })
  }),
  templating: Object.freeze({
    path: '/templating',
    title: 'RMT Template Pilot',
    component: ROUTE_COMPONENTS.templating,
    template: 'demo.templating.pilot',
    schedule: 'route.visible.render',
    metadata: Object.freeze({
      metaDescription: 'Pilot-Flow fuer RMT-vNext-basiertes XTend-Templating mit Component Attachment.'
    })
  }),
  primitives: Object.freeze({
    path: '/primitives',
    title: 'RMT Component Primitives',
    component: ROUTE_COMPONENTS.primitives,
    template: 'demo.primitives',
    schedule: 'component.primitive.matrix',
    metadata: Object.freeze({
      metaDescription: 'Component Capability Registry, Manifest-Matrix, keyed DOM Descriptor und RMT Primitive Coverage.'
    })
  }),
  media: Object.freeze({
    path: '/media',
    title: 'RMT Player and Media Contract',
    component: ROUTE_COMPONENTS.media,
    template: 'demo.media',
    schedule: 'media.visible.contract',
    metadata: Object.freeze({
      metaDescription: 'x-player Contract, State Bridge, Parts, Theme Tokens und Resource Ownership fuer RMT.'
    })
  }),
  adapter: Object.freeze({
    path: '/adapter',
    title: 'XTend Product Adapter',
    component: ROUTE_COMPONENTS.adapter,
    template: 'demo.adapter',
    schedule: 'component.idle.hydrate',
    metadata: Object.freeze({
      metaDescription: 'XTend ist der First-Class Product Adapter fuer RMT.'
    })
  }),
  streaming: Object.freeze({
    path: '/streaming',
    title: 'RMT vNext Streaming',
    component: ROUTE_COMPONENTS.streaming,
    template: 'demo.streaming',
    schedule: 'streaming.visible.render',
    metadata: Object.freeze({
      metaDescription: 'SSE Streaming bleibt an Security Boundary und Sanitizing Policy gebunden.'
    })
  }),
  sourceToSea: Object.freeze({
    path: '/source-to-sea',
    title: 'Source-to-Sea Evidence',
    component: ROUTE_COMPONENTS.sourceToSea,
    template: 'demo.sourceToSea',
    schedule: 'source-to-sea.visible.render',
    metadata: Object.freeze({
      metaDescription: 'RMT Primitive, Schedule Ref, Fabric Fiber und Source Pointer bleiben korreliert.'
    })
  }),
  enterprise: Object.freeze({
    path: '/enterprise',
    title: 'Enterprise Remote Surface',
    component: ROUTE_COMPONENTS.enterprise,
    template: 'demo.enterprise',
    schedule: 'enterprise.visible.contract',
    metadata: Object.freeze({
      metaDescription: 'Remote Surface Contract, Fallback und Degradation bleiben offline und contract-only.'
    })
  }),
  governance: Object.freeze({
    path: '/governance',
    title: 'Cross-Surface Event Governance',
    component: ROUTE_COMPONENTS.governance,
    template: 'demo.governance',
    schedule: 'event-governance.visible.render',
    metadata: Object.freeze({
      metaDescription: 'Typed Events, ownership, delivery policy and remote contracts are gateable.'
    })
  }),
  nativeFirst: Object.freeze({
    path: '/native-first',
    title: 'Native-First Owned RMT',
    component: ROUTE_COMPONENTS.nativeFirst,
    template: 'demo.nativeFirst',
    schedule: 'native-first.visible.render',
    metadata: Object.freeze({
      metaDescription: 'Owned recipes, DOM descriptor proofs and action/effect/data/resource parity.'
    })
  })
});

const DEMO_ADAPTERS = Object.freeze([
  Object.freeze({
    id: 'xtend',
    kind: 'host_adapter',
    runtimeSurface: Object.freeze(['esm', 'browser_classic']),
    providedCapabilities: Object.freeze([
      'manifest',
      'customElements',
      'stateBridge',
      'hydration',
      'schedulerEndpoints',
      'theme',
      'api',
      'diagnostics'
    ]),
    kernelVisible: false,
    metadata: Object.freeze({
      factory: 'host-provided',
      boundary: 'RMT schedules host work without importing XTend.'
    })
  }),
  Object.freeze({
    id: 'xtend.component',
    kind: 'component_adapter',
    runtimeSurface: Object.freeze(['esm', 'browser_classic']),
    providedCapabilities: Object.freeze([
      'components',
      'customElements',
      'manifestLookup',
      'props',
      'attributes',
      'slots',
      'events',
      'hydration',
      'componentCapabilityRegistry',
      'lazyComponentImport',
      'diagnostics',
      'scheduleRefs',
      'sourceToSeaRefs',
      'domDescriptorProofs'
    ]),
    kernelVisible: false,
    metadata: Object.freeze({
      factory: 'createRmtXtendComponentAdapter',
      contract: 'xtend.rmt.xtend-component-adapter.v1'
    })
  }),
  Object.freeze({
    id: 'xtend.template',
    kind: 'component_adapter',
    runtimeSurface: Object.freeze(['esm', 'browser_classic']),
    providedCapabilities: Object.freeze(['templates', 'slots', 'events', 'hydration', 'diagnostics']),
    kernelVisible: false,
    metadata: Object.freeze({
      factory: 'RMT Template API',
      contract: 'xtend.rmt.template-authoring.v1'
    })
  }),
  Object.freeze({
    id: 'xtend.xrouter',
    kind: 'router_adapter',
    runtimeSurface: Object.freeze(['esm', 'browser_classic']),
    providedCapabilities: Object.freeze(['routes', 'navigation', 'params', 'query', 'diagnostics', 'scheduleRefs']),
    kernelVisible: false,
    metadata: Object.freeze({
      factory: 'createRmtXRouterAdapter',
      contract: 'xtend.rmt.xrouter-adapter.v1'
    })
  }),
  Object.freeze({
    id: 'rmt.state-scheduler-diagnostics',
    kind: 'scheduler_adapter',
    runtimeSurface: Object.freeze(['esm', 'browser_classic']),
    providedCapabilities: Object.freeze([
      'stateBridge',
      'schedulerEndpoints',
      'diagnostics',
      'adapterResults',
      'performanceBudgets',
      'lifecycleEvents',
      'streamingBoundaries',
      'eventGovernance'
    ]),
    kernelVisible: false,
    metadata: Object.freeze({
      factory: 'createRmtStateSchedulerDiagnosticsBridge',
      contract: 'xtend.rmt.state-scheduler-diagnostics-bridge.v1'
    })
  })
]);

const DEMO_STATIC_COMPONENTS = Object.freeze([
  Object.freeze({ id: 'shell.header', tag: 'x-header', schedule: 'component.visible.mount' }),
  Object.freeze({ id: 'kernel.cards', tag: 'x-cards', schedule: 'component.visible.mount' }),
  Object.freeze({ id: 'code.snapshot', tag: 'x-code', schedule: 'component.idle.hydrate' }),
  Object.freeze({ id: 'feedback.status', tag: 'x-alert', schedule: 'component.visible.mount' }),
  Object.freeze({ id: 'pilot.shell', tag: 'x-section', schedule: 'component.visible.mount' }),
  Object.freeze({ id: 'primitive.matrix', tag: 'x-status', schedule: 'component.primitive.matrix' }),
  Object.freeze({ id: 'primitive.progress', tag: 'x-progress', schedule: 'component.primitive.matrix' }),
  Object.freeze({ id: 'media.player', tag: 'x-player', schedule: 'media.visible.contract' }),
  Object.freeze({ id: 'media.toast', tag: 'x-toast', schedule: 'diagnostics.snapshot' }),
  Object.freeze({ id: 'streaming.feed', tag: 'x-status', schedule: 'streaming.visible.render' }),
  Object.freeze({ id: 'sourceToSea.evidence', tag: 'x-code', schedule: 'source-to-sea.visible.render' }),
  Object.freeze({ id: 'enterprise.remoteContract', tag: 'x-status', schedule: 'enterprise.visible.contract' }),
  Object.freeze({ id: 'enterprise.fallback', tag: ROUTE_COMPONENTS.enterpriseFallback, schedule: 'enterprise.fallback.visible' }),
  Object.freeze({ id: 'governance.events', tag: 'x-code', schedule: 'event-governance.visible.render' }),
  Object.freeze({ id: 'nativeFirst.recipes', tag: 'x-status', schedule: 'native-first.visible.render' })
]);

const DEMO_SCHEDULES = Object.freeze([
  Object.freeze({
    id: 'template.visible.inspect',
    endpointName: 'xtendrmt.template.inspect',
    scope: 'xtendrmt.template.pilot',
    lane: 'visible',
    priority: 70,
    preferIdle: false,
    deadlineMs: 150,
    coalesceKey: 'template.pilot.inspect',
    budgetClass: 'interactive'
  }),
  Object.freeze({
    id: 'route.visible.render',
    endpointName: 'xtendrmt.route.render',
    scope: 'xtendrmt.router.current',
    lane: 'visible',
    priority: 88,
    preferIdle: false,
    deadlineMs: 120,
    coalesceKey: 'route.current',
    budgetClass: 'interactive'
  }),
  Object.freeze({
    id: 'component.visible.mount',
    endpointName: 'xtendrmt.component.mount',
    scope: 'xtendrmt.component.visible',
    lane: 'visible',
    priority: 76,
    preferIdle: false,
    deadlineMs: 160,
    coalesceKey: 'component.mount',
    budgetClass: 'interactive'
  }),
  Object.freeze({
    id: 'component.idle.hydrate',
    endpointName: 'xtendrmt.component.hydrate',
    scope: 'xtendrmt.component.idle',
    lane: 'idle',
    priority: 42,
    preferIdle: true,
    deadlineMs: 420,
    coalesceKey: 'component.hydrate',
    budgetClass: 'background'
  }),
  Object.freeze({
    id: 'component.primitive.matrix',
    endpointName: 'xtendrmt.component-capability.matrix',
    scope: 'xtendrmt.component.capabilities',
    lane: 'visible',
    priority: 92,
    preferIdle: false,
    deadlineMs: 180,
    coalesceKey: 'component.capability.matrix',
    budgetClass: 'interactive'
  }),
  Object.freeze({
    id: 'media.visible.contract',
    endpointName: 'xtendrmt.player.contract',
    scope: 'xtendrmt.media.player',
    lane: 'visible',
    priority: 84,
    preferIdle: false,
    deadlineMs: 180,
    coalesceKey: 'media.player.contract',
    budgetClass: 'media-interactive'
  }),
  Object.freeze({
    id: 'diagnostics.snapshot',
    endpointName: 'xtendrmt.diagnostics.snapshot',
    scope: 'xtendrmt.diagnostics',
    lane: 'diagnostics',
    priority: 34,
    preferIdle: true,
    deadlineMs: 260,
    coalesceKey: 'diagnostics.snapshot',
    budgetClass: 'background'
  }),
  Object.freeze({
    id: 'streaming.visible.render',
    endpointName: 'xtendrmt.route.render',
    scope: 'xtendrmt.streaming',
    lane: 'visible',
    priority: 86,
    preferIdle: false,
    deadlineMs: 140,
    coalesceKey: 'streaming.visible',
    budgetClass: 'interactive'
  }),
  Object.freeze({
    id: 'streaming.event.stream',
    endpointName: 'feed.activity',
    scope: 'xtendrmt.streaming.feed',
    lane: 'idle',
    priority: 32,
    preferIdle: true,
    deadlineMs: 500,
    coalesceKey: 'streaming.activity',
    budgetClass: 'background'
  }),
  Object.freeze({
    id: 'source-to-sea.visible.render',
    endpointName: 'xtendrmt.source-to-sea.render',
    scope: 'xtendrmt.source-to-sea.evidence',
    lane: 'visible',
    priority: 90,
    preferIdle: false,
    deadlineMs: 150,
    coalesceKey: 'source-to-sea.evidence',
    budgetClass: 'interactive'
  }),
  Object.freeze({
    id: 'source-to-sea.diagnostics',
    endpointName: 'xtendrmt.source-to-sea.diagnostics',
    scope: 'xtendrmt.source-to-sea.diagnostics',
    lane: 'diagnostics',
    priority: 44,
    preferIdle: true,
    deadlineMs: 300,
    coalesceKey: 'source-to-sea.diagnostics',
    budgetClass: 'background'
  }),
  Object.freeze({
    id: 'enterprise.visible.contract',
    endpointName: 'xtendrmt.enterprise.contract',
    scope: 'xtendrmt.enterprise.remote-surface',
    lane: 'visible',
    priority: 89,
    preferIdle: false,
    deadlineMs: 150,
    coalesceKey: 'enterprise.contract',
    budgetClass: 'interactive'
  }),
  Object.freeze({
    id: 'enterprise.fallback.visible',
    endpointName: 'xtendrmt.enterprise.fallback',
    scope: 'xtendrmt.enterprise.fallback',
    lane: 'visible',
    priority: 76,
    preferIdle: false,
    deadlineMs: 180,
    coalesceKey: 'enterprise.fallback',
    budgetClass: 'interactive'
  }),
  Object.freeze({
    id: 'event-governance.visible.render',
    endpointName: 'xtendrmt.event-governance.render',
    scope: 'xtendrmt.event-governance',
    lane: 'visible',
    priority: 82,
    preferIdle: false,
    deadlineMs: 150,
    coalesceKey: 'event-governance',
    budgetClass: 'interactive'
  }),
  Object.freeze({
    id: 'native-first.visible.render',
    endpointName: 'xtendrmt.native-first.render',
    scope: 'xtendrmt.native-first.owned-rmt',
    lane: 'visible',
    priority: 85,
    preferIdle: false,
    deadlineMs: 160,
    coalesceKey: 'native-first.owned-rmt',
    budgetClass: 'interactive'
  })
]);

const state = {
  initialized: false,
  document: null,
  rawDocument: null,
  normalizedDocument: null,
  vnextSource: '',
  vnextCore: null,
  sourceSyntax: 'legacy-json',
  rmtFormat: null,
  registries: null,
  metadata: {
    adapters: [],
    components: [],
    routes: [],
    schedules: [],
    pilotFlow: null,
    nativeDemoMigration: null,
    componentPrimitives: null,
    playerContract: null,
    surfaceResourceLifecycle: null,
    flagship: null,
    streaming: null,
    sourceToSeaEvidence: null,
    enterpriseRemoteSurface: null,
    eventGovernance: null,
    nativeFirstOwnedRmt: null
  },
  componentCapabilityRegistry: null,
  componentCapabilityMatrix: null,
  playerSnapshot: null,
  runtime: null,
  stateBridge: null,
  adapters: {
    router: null,
    component: null,
    bridge: null
  },
  mappings: {
    routes: null,
    components: null
  },
  adapterResults: [],
  jobs: [],
  activeRoute: '/',
  activeComponent: ROUTE_COMPONENTS.overview,
  activeSchedule: 'route.visible.render',
  completedJobs: 0,
  failedJobs: 0,
  lastDurationMs: 0,
  schedulerPressure: 'normal'
};

function cloneSerializable(value, fallback = null) {
  if (value === undefined) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_error) {
    return fallback;
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function createDemoMetadata(vnextCore = {}) {
  return {
    title: 'XTendRMT BestCase Demo',
    description: 'RMT vNext beschreibt Surfaces, Lanes und Lifecycle-Operationen; die Demo projiziert diese Core-Records auf XTend und XRouter Adapter.',
    sourceSyntax: 'rmt-vnext',
    vNextCore: {
      schema: vnextCore.schema || 'xtend.rmt.core-format.vnext.v1',
      sourceUrl: DEMO_DOCUMENT_URL,
      coreUrl: DEMO_CORE_DOCUMENT_URL,
      surfaceCount: asArray(vnextCore.surfaces).length,
      laneCount: asArray(vnextCore.lanes).length,
      operationCount: asArray(vnextCore.operations).length
    },
    flagship: {
      schema: 'xtend.rmt.bestcase-flagship.v1',
      status: 'cutting-edge-gateable',
      sourceSyntax: 'rmt-vnext',
      localGate: 'node scripts/run_xtend_tests.js rmt-bestcase-flagship --json',
      browserSmokeSchema: 'xtend.rmt.bestcase-flagship-browser-smoke.v1',
      families: [
        'vnext-streaming',
        'source-to-sea-fabric-evidence',
        'enterprise-remote-surfaces',
        'degradation-fallback',
        'cross-surface-event-governance',
        'native-first-owned-rmt'
      ],
      offlineOnly: true,
      remoteExecution: false,
      networkRequests: 0
    },
    streaming: {
      schema: 'xtend.rmt.vnext-streaming-bestcase.v1',
      routeRef: 'streaming',
      trustBoundary: 'xtend.security.streaming-boundary.v1',
      transport: 'sse',
      sanitize: 'html',
      streamRef: 'activity-feed',
      networkPolicy: 'fixture-or-local-only'
    },
    sourceToSeaEvidence: {
      schema: 'xtend.rmt.vnext.source-to-sea-browser-probe.v1',
      routeRef: 'sourceToSea',
      primitiveId: 'bestcase.evidence.summary',
      scheduleRef: 'schedule:xtendrmt.bestcase.demo/sourceToSea/visible',
      fiberRef: 'fiber:xtendrmt.bestcase.demo/sourceToSea/visible/0',
      fabricLane: 'visible',
      fabricEndpoint: 'xtendrmt.source-to-sea.render',
      sourcePointer: '/surfaces/sourceToSea/lane/visible',
      browserProbe: 'demos/xtendrmt/examples/flagship/browser-smoke.html'
    },
    enterpriseRemoteSurface: {
      schema: 'xtend.rmt.vnext-enterprise-browser-smoke.v1',
      routeRef: 'enterprise',
      remoteSurface: 'bestcase.audit',
      remoteId: '@xtend/audit-panel',
      versionRange: '^2.0.0',
      fallbackSurface: 'enterpriseFallback',
      degradationStatus: 'full',
      remoteExecution: false,
      networkRequests: 0,
      trustBoundary: 'xtend.security.remote-surface.v1'
    },
    eventGovernance: {
      schema: 'xtend.rmt.vnext-event-governance-policy.v1',
      routeRef: 'governance',
      deliveryPolicy: 'typed-contract-only',
      events: [
        'bestcase.audit.opened.v1',
        'demo.enterprise.audit.requested.v1',
        'demo.governance.published.v1'
      ],
      owner: 'platform-runtime',
      sensitivity: 'internal'
    },
    nativeFirstOwnedRmt: {
      schema: 'xtend.native-first.rmt-owned-flagship.v1',
      routeRef: 'nativeFirst',
      coverage: [
        'dom-descriptor-proof',
        'action-effect-data-resource-primitives',
        'owned-recipes',
        'runtime-parity'
      ],
      releaseGate: 'npm run test:native-first-rmt-owned-release:report',
      noHtmlSinkForRmtAppUi: true,
      runtimeParity: true
    },
    templateAuthoring: {
      contractVersion: 'xtend.rmt.template-authoring.v1',
      adapter: 'xtend.template',
      componentAdapter: 'xtend.component',
      componentRefField: 'metadata.authoring.componentRefs',
      slotBindingMode: 'named-slot-to-template-ref',
      eventBindingMode: 'dom-event-to-rmt-command',
      dataBindingMode: 'explicit-props-attributes-and-slots-only',
      kernelVisible: false,
      sourceSyntax: 'rmt-vnext'
    },
    rootLifecycle: {
      contractVersion: 'xtend.rmt.root-handshake.v1',
      planner: 'rmt-scheduler',
      executor: 'xtend-host-adapter',
      phaseSequence: ['create', 'mount', 'hydrate', 'activate', 'update', 'unmount', 'diagnostics'],
      statePolicy: 'digital-twin-ssot-xstate',
      schedulerEndpointHints: [
        {
          phase: 'mount',
          schedule: 'component.visible.mount',
          endpointName: 'xtendrmt.component.mount',
          lane: 'visible',
          preferIdle: false
        },
        {
          phase: 'hydrate',
          schedule: 'component.idle.hydrate',
          endpointName: 'xtendrmt.component.hydrate',
          lane: 'idle',
          preferIdle: true
        },
        {
          phase: 'activate',
          schedule: 'route.visible.render',
          endpointName: 'xtendrmt.route.render',
          lane: 'visible',
          preferIdle: false
        },
        {
          phase: 'diagnostics',
          schedule: 'diagnostics.snapshot',
          endpointName: 'xtendrmt.diagnostics.snapshot',
          lane: 'diagnostics',
          preferIdle: true
        }
      ],
      kernelVisible: false
    },
    hostCapabilities: {
      contractVersion: 'xtend.rmt.host-capabilities.v1',
      adapterId: 'xtend',
      adapterKind: 'host_adapter',
      requiredCapabilities: ['manifest', 'customElements', 'stateBridge', 'hydration', 'schedulerEndpoints'],
      optionalCapabilities: ['theme', 'api', 'router', 'diagnostics'],
      capabilityRefs: [
        'xtend.manifest',
        'xtend.custom-elements',
        'xtend.state-bridge.xstate',
        'xtend.hydration',
        'xtend.scheduler-endpoints',
        'xtend.theme',
        'xtend.api',
        'xtend.xrouter',
        'xtend.diagnostics'
      ],
      negotiation: {
        missingRequiredCapability: 'diagnostic-fail-fast-before-mount',
        missingOptionalCapability: 'degrade-or-skip-with-diagnostics'
      },
      kernelVisible: false
    },
    componentPrimitives: {
      schema: 'xtend.rmt.component-capability-registry.v1',
      status: 'runtime-projection-active',
      registry: './rmt-component-capability-registry.js',
      manifest: './components/manifest.json',
      coverageTarget: 'all-public-xtend-components',
      publicManifestCount: 45,
      publicUiCount: 40,
      nonVisualCount: 5,
      families: ['form', 'navigation', 'overlay-surface', 'media-feedback-layout', 'theme-layout'],
      rendererMode: 'generic-dom-descriptor-with-keyed-reuse',
      importPolicy: 'explicit-importer-only',
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types',
      noShadowRootPatching: true,
      noHtmlSinkForRmtAppUi: true
    },
    playerContract: {
      schema: 'xtend.mm-rmt.player-contract.v1',
      tag: 'x-player',
      commands: ['play-media', 'pause-media', 'set-source', 'set-state', 'apply-theme'],
      events: ['xplayer-play', 'xplayer-pause', 'xplayer-state'],
      stateBridge: 'xstate-host-bridge',
      themeTokens: ['--x-player-primary', '--x-player-accent', '--x-player-background', '--x-player-radius'],
      parts: ['root', 'media', 'title', 'overlay', 'controls', 'progress'],
      kernelBoundary: 'no-product-shadowRoot-patching'
    },
    surfaceResourceLifecycle: {
      schema: 'xtend.rmt.surface-resource-lifecycle.v1',
      portals: ['bestcase.surface.root', 'bestcase.overlay.root'],
      overlays: ['bestcase.toast'],
      resources: [
        'bestcase.capabilityRegistry',
        'bestcase.playerObjectUrl',
        'bestcase.runtimeSubscription',
        'bestcase.streamSubscription',
        'bestcase.enterpriseRemoteManifest',
        'bestcase.nativeFirstRecipeRegistry'
      ],
      cleanupPolicy: 'close-and-dispose-on-owner-destroy',
      sourceToSeaCoverage: true
    },
    scaffoldCompatibility: {
      schema: 'xtend.scaffold.rmt-compatibility-binding.v1',
      status: 'demo-reference-only',
      surfaces: ['typing', 'manifest-plan', 'preview-plan', 'extension-points', 'component-files'],
      requiredContracts: [
        'xtend.rmt.component-contract.v1',
        'xtend.rmt.template-authoring.v1',
        'xtend.rmt.root-handshake.v1',
        'xtend.rmt.host-capabilities.v1'
      ],
      minimumGate: 'node scripts/run_xtend_tests.js rmt-compatibility --json',
      bridgeRuntime: 'reserved-for-Epic-05',
      kernelVisible: false
    },
    pilotFlow: {
      contractVersion: 'xtend.rmt.template-pilot-flow.v1',
      status: 'reference-only',
      templateRef: 'demo.templating.pilot',
      routeRef: 'templating',
      componentAttachment: {
        adapter: 'xtend.template',
        componentAdapter: 'xtend.component',
        componentRefs: ['pilot.shell', 'kernel.cards', 'feedback.status'],
        slotBindingMode: 'named-slot-to-template-ref',
        eventBindingMode: 'dom-event-to-rmt-command',
        dataBindingMode: 'explicit-props-attributes-and-slots-only'
      },
      adapterSequence: [
        'rmt-vnext compiler emits template/surface/lane/operation Core',
        'runtime projection maps route surfaces to XRouter records',
        'xtend-host-adapter materializes Custom Elements',
        'xstate records pilot diagnostics'
      ],
      minimumGate: 'node scripts/run_xtend_tests.js rmt-compatibility --json',
      bridgeRuntime: 'reserved-for-Epic-05',
      kernelVisible: false
    },
    nativeDemoMigration: {
      contractVersion: 'xtend.rmt.native-demo-migration.v1',
      status: 'vnext-demo-runtime-projection',
      usesTopLevelDomains: true,
      sourceSyntax: 'rmt-vnext',
      routesSource: 'vnext.surfaces',
      componentsSource: 'vnext.operations',
      primitivesSource: 'vnext.states-selectors-actions-portals-resources',
      adaptersSource: 'runtimeProjection.adapters',
      schedulesSource: 'vnext.lanes',
      flagshipRoutes: ['streaming', 'sourceToSea', 'enterprise', 'governance', 'nativeFirst'],
      productiveAdapters: [
        'createRmtXRouterAdapter',
        'createRmtXtendComponentAdapter',
        'createRmtStateSchedulerDiagnosticsBridge',
        'createRmtComponentCapabilityRegistry'
      ],
      kernelVisible: false
    }
  };
}

function createTemplateAuthoring(templateRef, componentRefs = [], extra = {}) {
  return {
    contractVersion: 'xtend.rmt.template-authoring.v1',
    templateRef,
    componentRefs,
    slotBindingMode: 'named-slot-to-template-ref',
    eventBindingMode: 'dom-event-to-rmt-command',
    kernelVisible: false,
    ...extra
  };
}

function createRuntimeTemplates() {
  return [
    {
      id: 'demo.kernel',
      mode: 'html_fragment',
      markup: '<x-section layout="column"><x-cards columns="3"><x-card><h3>RMT Kernel</h3><p>Scheduler, roots, diagnostics and execution planning.</p></x-card><x-card><h3>XTend UI</h3><p>Visible surface is composed with XTend components.</p></x-card><x-card><h3>XRouter</h3><p>Routes are declared in RMT vNext and mounted through XRouter.</p></x-card></x-cards></x-section>',
      metadata: {
        route: 'kernel',
        adapter: 'xtend.component',
        authoring: createTemplateAuthoring('demo.kernel', ['kernel.cards'])
      },
      hydration: {
        mode: 'runtime_render',
        ownershipMode: 'managed_subtree',
        preferInsularHydration: true
      }
    },
    {
      id: 'demo.scheduler',
      mode: 'html_fragment',
      markup: '<x-section layout="column"><x-cards columns="2"><x-card><h3>Visible lane</h3><p>Interactive route work.</p></x-card><x-card><h3>Idle lane</h3><p>Background hydration and diagnostics.</p></x-card></x-cards></x-section>',
      metadata: {
        route: 'scheduler',
        adapter: 'xtend.component',
        authoring: createTemplateAuthoring('demo.scheduler', ['kernel.cards'])
      },
      hydration: {
        mode: 'runtime_render',
        ownershipMode: 'managed_subtree',
        preferInsularHydration: true
      }
    },
    {
      id: 'demo.routing',
      mode: 'html_fragment',
      markup: '<x-section layout="column"><x-card><h3>Routes from RMT vNext</h3><p>XRouter consumes route records projected from vNext Surfaces and Lifecycle operations.</p></x-card></x-section>',
      metadata: {
        route: 'routing',
        adapter: 'xtend.xrouter',
        authoring: createTemplateAuthoring('demo.routing', [])
      },
      hydration: {
        mode: 'runtime_render',
        ownershipMode: 'managed_subtree',
        preferInsularHydration: true
      }
    },
    {
      id: 'demo.templating.pilot',
      mode: 'dom_descriptor',
      markup: '<x-section layout="column" label="RMT Template Pilot"><div slot="header"><h2 data-slot="title"></h2><p data-slot="summary"></p></div><x-cards columns="2" data-slot="cards"></x-cards><x-alert type="info" data-slot="feedback"></x-alert></x-section>',
      props: {
        layout: 'column'
      },
      slots: {
        title: {
          kind: 'text',
          value: 'RMT vNext authors; XTend host materializes.'
        },
        summary: {
          kind: 'text',
          value: 'The vNext source stays declarative while XTend component attachments remain host adapter data.'
        },
        cards: {
          kind: 'template',
          template: 'demo.kernel'
        },
        feedback: {
          kind: 'template',
          markup: 'Bridge runtime stays reserved for Epic 05.'
        }
      },
      events: {
        'pilot-run': {
          kind: 'command',
          target: 'x-section',
          commandName: 'xtendrmt.template.pilot.inspect',
          payload: {
            templateRef: 'demo.templating.pilot',
            componentRefs: ['pilot.shell', 'kernel.cards', 'feedback.status']
          }
        }
      },
      metadata: {
        route: 'templating',
        adapter: 'xtend.template',
        pilotFlow: true,
        authoring: createTemplateAuthoring('demo.templating.pilot', ['pilot.shell', 'kernel.cards', 'feedback.status'], {
          componentAttachment: {
            adapter: 'xtend.template',
            componentAdapter: 'xtend.component',
            componentRefs: ['pilot.shell', 'kernel.cards', 'feedback.status'],
            slotBindingMode: 'named-slot-to-template-ref',
            eventBindingMode: 'dom-event-to-rmt-command',
            dataBindingMode: 'explicit-props-attributes-and-slots-only'
          },
          dataBindingMode: 'explicit-props-attributes-and-slots-only',
          bridgeRuntime: 'reserved-for-Epic-05'
        })
      },
      hydration: {
        mode: 'runtime_render',
        ownershipMode: 'managed_subtree',
        preferInsularHydration: true,
        metadata: {
          planner: 'rmt-scheduler',
          executor: 'xtend-host-adapter',
          endpointHint: 'xtendrmt.template.inspect'
        }
      }
    },
    {
      id: 'demo.primitives',
      mode: 'dom_descriptor',
      markup: '<x-section layout="column" label="RMT Component Primitives"></x-section>',
      metadata: {
        route: 'primitives',
        adapter: 'xtend.component',
        authoring: createTemplateAuthoring('demo.primitives', ['primitive.matrix', 'primitive.progress'], {
          componentCapabilityRegistry: 'xtend.rmt.component-capability-registry.v1',
          rendererMode: 'generic-dom-descriptor-with-keyed-reuse',
          importPolicy: 'explicit-importer-only'
        })
      },
      hydration: {
        mode: 'runtime_render',
        ownershipMode: 'managed_subtree',
        preferInsularHydration: true,
        metadata: {
          endpointHint: 'xtendrmt.component-capability.matrix'
        }
      }
    },
    {
      id: 'demo.media',
      mode: 'dom_descriptor',
      markup: '<x-section layout="column" label="RMT Player Contract"></x-section>',
      metadata: {
        route: 'media',
        adapter: 'xtend.component',
        authoring: createTemplateAuthoring('demo.media', ['media.player', 'media.toast'], {
          playerContract: 'xtend.mm-rmt.player-contract.v1',
          componentRef: 'x-player',
          resourceOwnership: 'object-url-disposed-on-surface-destroy'
        })
      },
      hydration: {
        mode: 'runtime_render',
        ownershipMode: 'managed_subtree',
        preferInsularHydration: true,
        metadata: {
          endpointHint: 'xtendrmt.player.contract'
        }
      }
    },
    {
      id: 'demo.streaming',
      mode: 'dom_descriptor',
      markup: '<x-section layout="column" label="RMT vNext Streaming"></x-section>',
      metadata: {
        route: 'streaming',
        adapter: 'xtend.component',
        authoring: createTemplateAuthoring('demo.streaming', ['streaming.feed'], {
          streamingContract: 'xtend.rmt.vnext-streaming-bestcase.v1',
          trustBoundary: 'xtend.security.streaming-boundary.v1',
          sanitize: 'html'
        })
      },
      hydration: {
        mode: 'runtime_render',
        ownershipMode: 'managed_subtree',
        preferInsularHydration: true,
        metadata: {
          endpointHint: 'xtendrmt.route.render'
        }
      }
    },
    {
      id: 'demo.sourceToSea',
      mode: 'dom_descriptor',
      markup: '<x-section layout="column" label="Source-to-Sea Evidence"></x-section>',
      metadata: {
        route: 'sourceToSea',
        adapter: 'xtend.component',
        authoring: createTemplateAuthoring('demo.sourceToSea', ['sourceToSea.evidence'], {
          sourceToSeaContract: 'xtend.rmt.vnext.source-to-sea-browser-probe.v1',
          primitiveId: 'bestcase.evidence.summary',
          scheduleRef: 'schedule:xtendrmt.bestcase.demo/sourceToSea/visible',
          fiberRef: 'fiber:xtendrmt.bestcase.demo/sourceToSea/visible/0'
        })
      },
      hydration: {
        mode: 'runtime_render',
        ownershipMode: 'managed_subtree',
        preferInsularHydration: true,
        metadata: {
          endpointHint: 'xtendrmt.source-to-sea.render'
        }
      }
    },
    {
      id: 'demo.enterprise',
      mode: 'dom_descriptor',
      markup: '<x-section layout="column" label="Enterprise Remote Surface"></x-section>',
      metadata: {
        route: 'enterprise',
        adapter: 'xtend.component',
        authoring: createTemplateAuthoring('demo.enterprise', ['enterprise.remoteContract', 'enterprise.fallback'], {
          enterpriseRemoteSurface: 'xtend.rmt.vnext-enterprise-browser-smoke.v1',
          remoteSurface: 'bestcase.audit',
          fallbackSurface: 'enterpriseFallback',
          remoteExecution: false
        })
      },
      hydration: {
        mode: 'runtime_render',
        ownershipMode: 'managed_subtree',
        preferInsularHydration: true,
        metadata: {
          endpointHint: 'xtendrmt.enterprise.contract'
        }
      }
    },
    {
      id: 'demo.governance',
      mode: 'dom_descriptor',
      markup: '<x-section layout="column" label="Cross-Surface Event Governance"></x-section>',
      metadata: {
        route: 'governance',
        adapter: 'xtend.component',
        authoring: createTemplateAuthoring('demo.governance', ['governance.events'], {
          eventGovernancePolicy: 'xtend.rmt.vnext-event-governance-policy.v1',
          deliveryPolicy: 'typed-contract-only',
          sensitivity: 'internal'
        })
      },
      hydration: {
        mode: 'runtime_render',
        ownershipMode: 'managed_subtree',
        preferInsularHydration: true,
        metadata: {
          endpointHint: 'xtendrmt.event-governance.render'
        }
      }
    },
    {
      id: 'demo.nativeFirst',
      mode: 'dom_descriptor',
      markup: '<x-section layout="column" label="Native-First Owned RMT"></x-section>',
      metadata: {
        route: 'nativeFirst',
        adapter: 'xtend.component',
        authoring: createTemplateAuthoring('demo.nativeFirst', ['nativeFirst.recipes'], {
          nativeFirstContract: 'xtend.native-first.rmt-owned-flagship.v1',
          coverage: ['dom-descriptor-proof', 'action-effect-data-resource-primitives', 'owned-recipes', 'runtime-parity']
        })
      },
      hydration: {
        mode: 'runtime_render',
        ownershipMode: 'managed_subtree',
        preferInsularHydration: true,
        metadata: {
          endpointHint: 'xtendrmt.native-first.render'
        }
      }
    },
    {
      id: 'demo.adapter',
      mode: 'html_fragment',
      markup: '<x-section layout="column"><x-card><h3>XTend Product Adapter</h3><p>XTend remains a product adapter; RMT remains framework-agnostic.</p></x-card></x-section>',
      metadata: {
        route: 'adapter',
        adapter: 'xtend.component',
        authoring: createTemplateAuthoring('demo.adapter', [])
      },
      hydration: {
        mode: 'runtime_render',
        ownershipMode: 'managed_subtree',
        preferInsularHydration: true
      }
    }
  ];
}

function getCoreRecordById(records, id) {
  return asArray(records).find((record) => record && record.id === id) || null;
}

function findSurfaceOperation(vnextCore, surfaceName) {
  const surface = asArray(vnextCore.surfaces).find((entry) => entry && entry.name === surfaceName);
  if (!surface) return null;
  const laneRefs = asArray(surface.laneRefs);
  const lanes = laneRefs.map((laneRef) => getCoreRecordById(vnextCore.lanes, laneRef)).filter(Boolean);
  const operationRefs = lanes.flatMap((lane) => asArray(lane.operationRefs));
  return operationRefs
    .map((operationRef) => getCoreRecordById(vnextCore.operations, operationRef))
    .find((operation) => operation && operation.target && operation.target.ref)
    || null;
}

function createRoutesFromVNextCore(vnextCore = {}) {
  const routes = DEMO_ROUTE_ORDER.map((routeId) => {
    const config = DEMO_ROUTE_CONFIG[routeId];
    const surface = asArray(vnextCore.surfaces).find((entry) => entry && entry.name === routeId);
    const operation = findSurfaceOperation(vnextCore, routeId);
    return {
      id: routeId,
      path: config.path,
      router: 'xtend.xrouter',
      title: config.title,
      component: operation && operation.target && operation.target.ref ? operation.target.ref : config.component,
      template: config.template,
      schedule: config.schedule,
      metadata: {
        ...cloneSerializable(config.metadata, {}),
        sourceSyntax: 'rmt-vnext',
        vNextSurface: surface ? surface.id : null,
        vNextOperation: operation ? operation.id : null
      }
    };
  });

  routes.push({
    id: 'not-found',
    path: '*',
    router: 'xtend.xrouter',
    title: 'XTendRMT Route Fallback',
    component: ROUTE_COMPONENTS.overview,
    template: 'demo.kernel',
    schedule: 'route.visible.render',
    metadata: {
      sourceSyntax: 'rmt-vnext',
      fallback: true
    }
  });

  return routes;
}

function createComponentsFromVNextCore(vnextCore = {}) {
  const routeComponents = DEMO_ROUTE_ORDER.map((routeId) => {
    const config = DEMO_ROUTE_CONFIG[routeId];
    const operation = findSurfaceOperation(vnextCore, routeId);
    const id = operation && operation.target && operation.target.ref ? operation.target.ref : config.component;
    return {
      id,
      adapter: 'xtend.component',
      kind: 'custom_element',
      tag: id,
      schedule: config.schedule || (routeId === 'adapter' ? 'component.idle.hydrate' : 'component.visible.mount'),
      metadata: {
        routeComponent: true,
        template: config.template,
        sourceSyntax: 'rmt-vnext',
        vNextOperation: operation ? operation.id : null
      }
    };
  });

  const staticComponents = DEMO_STATIC_COMPONENTS.map((component) => ({
    id: component.id,
    adapter: 'xtend.component',
    kind: 'custom_element',
    tag: component.tag,
    schedule: component.schedule,
    metadata: {
      sourceSyntax: 'runtime-projection'
    }
  }));

  return routeComponents.concat(staticComponents);
}

function createSchedulesFromVNextCore(vnextCore = {}) {
  return DEMO_SCHEDULES.map((schedule) => {
    const matchingLanes = asArray(vnextCore.lanes)
      .filter((lane) => lane && lane.name === schedule.lane)
      .map((lane) => lane.id);
    return {
      ...cloneSerializable(schedule, {}),
      metadata: {
        sourceSyntax: 'rmt-vnext',
        vNextLaneRefs: matchingLanes
      }
    };
  });
}

function createRuntimeDocumentFromVNextCore(vnextCore = {}, options = {}) {
  const manifest = vnextCore.manifest && typeof vnextCore.manifest === 'object'
    ? vnextCore.manifest
    : {};
  return {
    kind: 'rmt_document',
    version: '2.0-vnext',
    documentId: manifest.documentId || 'xtendrmt.bestcase.demo',
    namespace: manifest.namespace || 'xtendrmt.demo',
    manifest: {
      documentId: manifest.documentId || 'xtendrmt.bestcase.demo',
      namespace: manifest.namespace || 'xtendrmt.demo',
      contentType: 'application/vnd.xtendrmt.rmt+vnext',
      loaderHint: 'xtendrmt-bestcase-vnext',
      sourceUrl: options.sourceUrl || DEMO_DOCUMENT_URL,
      metadata: createDemoMetadata(vnextCore),
      reactivityHints: {
        stateBridge: 'xstate',
        schedulerSnapshot: 'xtend.rmt.scheduler.snapshot',
        routeSnapshot: 'xtend.rmt.router.current'
      }
    },
    adapters: cloneSerializable(DEMO_ADAPTERS, []),
    components: createComponentsFromVNextCore(vnextCore),
    routes: createRoutesFromVNextCore(vnextCore),
    schedules: createSchedulesFromVNextCore(vnextCore),
    templates: createRuntimeTemplates(),
    metadata: {
      sourceSyntax: 'rmt-vnext',
      coreSchema: vnextCore.schema || null
    }
  };
}

function ensureXTendNamespace() {
  window.XTend = window.XTend || {};
  window.XTend.rmt = window.XTend.rmt || {};
  return window.XTend;
}

function byId(id) {
  const router = document.getElementById('rmt-demo-router');
  return document.getElementById(id)
    || (router && router.shadowRoot && router.shadowRoot.getElementById(id))
    || null;
}

function setText(id, value) {
  const element = byId(id);
  if (element) {
    element.textContent = String(value);
  }
}

function setStatus(message, type = 'info') {
  const status = byId('demo-status');
  if (!status) return;
  status.setAttribute('type', type);
  status.innerHTML = `<span class="status-dot"></span>${message}`;
}

function setXCode(id, value, lang = 'json') {
  const code = byId(id);
  if (!code) return;
  let template = code.querySelector('template');
  if (!template) {
    template = document.createElement('template');
    code.appendChild(template);
  }
  template.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  code.setAttribute('lang', lang);
  if (typeof code._render === 'function') {
    code._render();
  }
}

function getRmtFormat() {
  if (!state.rmtFormat) {
    state.rmtFormat = createRmtFormat();
  }
  return state.rmtFormat;
}

async function loadComponentCapabilityMatrix() {
  if (state.componentCapabilityMatrix) {
    return state.componentCapabilityMatrix;
  }

  try {
    const manifestResponse = await fetch('./components/manifest.json', { cache: 'no-store' });
    if (!manifestResponse.ok) {
      throw new Error(`component manifest failed to load: ${manifestResponse.status}`);
    }
    const manifest = await manifestResponse.json();
    const entries = Object.entries(manifest);
    const sourcePairs = await Promise.all(entries.map(async ([tag, modulePath]) => {
      const componentPath = `./components/${String(modulePath).replace(/^\.\//u, '')}`;
      try {
        const response = await fetch(componentPath, { cache: 'no-store' });
        return [tag, response.ok ? await response.text() : ''];
      } catch (_error) {
        return [tag, ''];
      }
    }));
    const sourceTexts = Object.fromEntries(sourcePairs);
    const registry = createRmtComponentCapabilityRegistry({
      manifest,
      sourceTexts,
      customElements
    });
    state.componentCapabilityRegistry = registry;
    state.componentCapabilityMatrix = registry.createMatrixReport();
  } catch (error) {
    state.componentCapabilityMatrix = {
      schema: 'xtend.rmt.component-capability-registry-report.v1',
      ok: false,
      status: 'failed',
      reason: error && error.message ? error.message : String(error),
      manifestCount: 0,
      publicComponentCount: 0,
      diagnostics: []
    };
  }

  return state.componentCapabilityMatrix;
}

function readComponentCapabilitySnapshot() {
  const matrix = state.componentCapabilityMatrix || {};
  return {
    schema: matrix.schema || 'xtend.rmt.component-capability-registry-report.v1',
    status: matrix.status || (matrix.ok ? 'passed' : 'pending'),
    ok: matrix.ok === true,
    manifestCount: matrix.manifestCount || 0,
    publicComponentCount: matrix.publicComponentCount || 0,
    nonVisualCount: matrix.nonVisualCount || 0,
    withRmtMetadata: matrix.withRmtMetadata || 0,
    withComponentContract: matrix.withComponentContract || 0,
    browserSmokeFamilies: matrix.browserSmokeFamilies || [],
    familyCounts: matrix.familyCounts || {},
    sourceToSeaRisk: 'browser-smoke-representative',
    kernelBoundary: matrix.kernelBoundary || 'no-rmt-kernel-import-of-xtend-types',
    diagnostics: Array.isArray(matrix.diagnostics) ? matrix.diagnostics.slice(0, 5) : []
  };
}

function readPlayerContractSnapshot() {
  const playerClass = customElements.get('x-player');
  const contract = playerClass && playerClass.xtendRmtPlayerContract
    ? cloneSerializable(playerClass.xtendRmtPlayerContract, {})
    : {
      schema: 'xtend.mm-rmt.player-contract.v1',
      tag: 'x-player',
      commands: ['play-media', 'pause-media', 'set-source', 'set-state', 'apply-theme'],
      events: ['xplayer-play', 'xplayer-pause', 'xplayer-state'],
      stateBridge: 'xstate-host-bridge'
    };
  return {
    ...contract,
    state: state.playerSnapshot || {
      mediaId: 'intro',
      status: 'paused',
      title: 'XTendRMT Runtime Walkthrough'
    },
    resourceOwnership: 'object-url-disposed-on-surface-destroy',
    kernelBoundary: contract.kernelBoundary || 'no-product-shadowRoot-patching'
  };
}

function recordAdapterResult(result, options = {}) {
  if (!result || typeof result !== 'object') return null;
  state.adapterResults.push(result);
  if (state.adapterResults.length > 20) {
    state.adapterResults.splice(0, state.adapterResults.length - 20);
  }
  if (state.adapters.bridge && typeof state.adapters.bridge.recordAdapterResult === 'function') {
    return state.adapters.bridge.recordAdapterResult(result, options);
  }
  return null;
}

function findRouteFromDetail(detail = {}) {
  const routeId = detail.routeId || detail.id || '';
  return state.metadata.routes.find((candidate) => candidate.id === routeId)
    || state.metadata.routes.find((candidate) => candidate.component === detail.component)
    || state.metadata.routes.find((candidate) => candidate.path === detail.path)
    || state.metadata.routes[0]
    || null;
}

function findSchedule(scheduleId) {
  return state.metadata.schedules.find((schedule) => schedule.id === scheduleId)
    || state.metadata.schedules[0]
    || {
      id: scheduleId || 'host.fallback',
      endpointName: scheduleId || 'host.fallback',
      scope: 'xtendrmt.demo',
      lane: 'visible',
      priority: 50,
      preferIdle: false,
      deadlineMs: 160,
      budgetClass: 'interactive'
    };
}

function findTemplate(templateRef) {
  const templates = state.document && Array.isArray(state.document.templates)
    ? state.document.templates
    : [];
  return templates.find((template) => template.id === templateRef || template.templateId === templateRef)
    || null;
}

function readPilotFlowSnapshot() {
  const pilot = state.metadata.pilotFlow || {};
  const templateRef = pilot.templateRef || 'demo.templating.pilot';
  const template = findTemplate(templateRef) || {};
  const authoring = template.metadata && template.metadata.authoring
    ? template.metadata.authoring
    : {};
  const componentAttachment = pilot.componentAttachment
    || authoring.componentAttachment
    || {
      adapter: authoring.adapter || 'xtend.template',
      componentAdapter: 'xtend.component',
      componentRefs: Array.isArray(authoring.componentRefs) ? authoring.componentRefs : []
    };

  return {
    contractVersion: pilot.contractVersion || 'xtend.rmt.template-pilot-flow.v1',
    status: pilot.status || 'reference-only',
    templateRef,
    routeRef: pilot.routeRef || 'templating',
    templateMode: template.mode || template.templateMode || 'dom_descriptor',
    componentAttachment,
    slots: template.slots ? Object.keys(template.slots) : [],
    events: template.events ? Object.keys(template.events) : [],
    hydration: template.hydration || {},
    adapterSequence: Array.isArray(pilot.adapterSequence) ? pilot.adapterSequence : [],
    minimumGate: pilot.minimumGate || 'node scripts/run_xtend_tests.js rmt-compatibility --json',
    kernelBoundary: 'RMT keeps XTend component attachment as adapter data.',
    bridgeRuntime: pilot.bridgeRuntime || authoring.bridgeRuntime || 'reserved-for-Epic-05',
    kernelVisible: pilot.kernelVisible === true ? true : false
  };
}

function readFlagshipSnapshot() {
  const coreMetadata = state.vnextCore && state.vnextCore.manifest && state.vnextCore.manifest.metadata
    ? state.vnextCore.manifest.metadata
    : {};
  const metadata = {
    flagship: state.metadata.flagship || coreMetadata.flagship || {},
    streaming: state.metadata.streaming || coreMetadata.streaming || {},
    sourceToSeaEvidence: state.metadata.sourceToSeaEvidence || coreMetadata.sourceToSea || {},
    enterpriseRemoteSurface: state.metadata.enterpriseRemoteSurface || coreMetadata.enterprise || {},
    eventGovernance: state.metadata.eventGovernance || {},
    nativeFirstOwnedRmt: state.metadata.nativeFirstOwnedRmt || coreMetadata.nativeFirst || {}
  };
  return {
    schema: metadata.flagship.schema || 'xtend.rmt.bestcase-flagship.v1',
    status: metadata.flagship.status || 'cutting-edge-gateable',
    families: Array.isArray(metadata.flagship.families) ? metadata.flagship.families : [],
    localGate: metadata.flagship.localGate || 'node scripts/run_xtend_tests.js rmt-bestcase-flagship --json',
    browserSmokeSchema: metadata.flagship.browserSmokeSchema || 'xtend.rmt.bestcase-flagship-browser-smoke.v1',
    offlineOnly: metadata.flagship.offlineOnly !== false,
    remoteExecution: metadata.flagship.remoteExecution === true,
    networkRequests: Number(metadata.flagship.networkRequests || 0),
    streaming: metadata.streaming,
    sourceToSeaEvidence: metadata.sourceToSeaEvidence,
    enterpriseRemoteSurface: metadata.enterpriseRemoteSurface,
    eventGovernance: metadata.eventGovernance,
    nativeFirstOwnedRmt: metadata.nativeFirstOwnedRmt
  };
}

function createJobRecord(schedule, label) {
  const now = performance.now();
  return {
    id: `${schedule.id}:${Math.round(now)}:${state.jobs.length + 1}`,
    label,
    scheduleId: schedule.id,
    endpointName: schedule.endpointName,
    lane: schedule.lane || 'visible',
    priority: Number(schedule.priority || 0),
    status: 'queued',
    queuedAt: now,
    startedAt: 0,
    finishedAt: 0,
    durationMs: 0,
    source: 'rmt'
  };
}

function readSchedulerSnapshot() {
  const runtime = state.runtime;
  const rmt = runtime && typeof runtime.getRmt === 'function'
    ? runtime.getRmt()
    : null;
  const diagnostics = rmt && typeof rmt.getSchedulerDiagnostics === 'function'
    ? rmt.getSchedulerDiagnostics()
    : null;
  const stats = rmt && typeof rmt.getSchedulerStats === 'function'
    ? rmt.getSchedulerStats()
    : null;
  const scheduledJobs = rmt && typeof rmt.listScheduledJobs === 'function'
    ? rmt.listScheduledJobs()
    : [];

  const pressure = diagnostics && diagnostics.pressureLevel
    ? diagnostics.pressureLevel
    : (runtime && typeof runtime.getBackpressureProfile === 'function'
      ? (runtime.getBackpressureProfile('demo') || {}).pressureLevel
      : 'normal');

  state.schedulerPressure = pressure || 'normal';
  return {
    pressureLevel: state.schedulerPressure,
    stats: stats || {},
    diagnostics: diagnostics || {},
    queuedJobs: Array.isArray(scheduledJobs) ? scheduledJobs.length : 0,
    completedJobs: state.completedJobs,
    failedJobs: state.failedJobs,
    lastDurationMs: Number(state.lastDurationMs.toFixed(2))
  };
}

function syncState() {
  const snapshot = readSchedulerSnapshot();
  const pilotSnapshot = readPilotFlowSnapshot();
  const componentSnapshot = readComponentCapabilitySnapshot();
  const playerSnapshot = readPlayerContractSnapshot();
  const flagshipSnapshot = readFlagshipSnapshot();
  const routeSnapshot = {
    path: state.activeRoute,
    component: state.activeComponent,
    schedule: state.activeSchedule
  };

  xstate.set('xtend.rmt.demo.document', {
    documentId: state.document && state.document.manifest
      ? state.document.manifest.documentId
      : 'unknown',
    routeCount: state.metadata.routes.length,
    templateCount: state.document && Array.isArray(state.document.templates)
      ? state.document.templates.length
      : 0
  });
  xstate.set('xtend.rmt.router.current', routeSnapshot);
  xstate.set('xtend.rmt.templating.pilot', pilotSnapshot);
  xstate.set('xtend.rmt.component.capabilities', componentSnapshot);
  xstate.set('xtend.rmt.player.contract', playerSnapshot);
  xstate.set('xtend.rmt.scheduler.snapshot', snapshot);
  xstate.set('xtend.rmt.scheduler.jobs', state.jobs.slice(-12));
  xstate.set('xtend.rmt.bestcase.flagship', flagshipSnapshot);
}

function renderTimeline() {
  const timeline = byId('demo-timeline');
  if (!timeline) return;

  const recentJobs = state.jobs.slice(-5).reverse();
  timeline.innerHTML = recentJobs.length
    ? recentJobs.map((job) => `
      <x-card>
        <div class="timeline-row">
          <div>
            <strong>${job.label}</strong><br>
            <small>${job.endpointName} · ${job.scheduleId}</small>
          </div>
          <span class="pill">${job.status} · ${job.durationMs.toFixed(1)}ms</span>
        </div>
      </x-card>
    `).join('')
    : `
      <x-card>
        <h3>No scheduler jobs yet</h3>
        <p>Run a route, hydration or diagnostics cycle to see RMT work items here.</p>
      </x-card>
    `;
}

function refreshDemoUi() {
  const snapshot = readSchedulerSnapshot();
  const pilotSnapshot = readPilotFlowSnapshot();
  const componentSnapshot = readComponentCapabilitySnapshot();
  const playerSnapshot = readPlayerContractSnapshot();
  const flagshipSnapshot = readFlagshipSnapshot();
  const pilotTemplate = findTemplate(pilotSnapshot.templateRef) || {};
  const templateCount = state.document && Array.isArray(state.document.templates)
    ? state.document.templates.length
    : 0;

  setText('metric-routes', state.metadata.routes.length);
  setText('metric-components', state.metadata.components.length);
  setText('metric-templates', templateCount);
  setText('metric-schedules', state.metadata.schedules.length);
  setText('metric-jobs', state.completedJobs);
  setText('metric-pressure', snapshot.pressureLevel);
  setText('metric-active-route', state.activeRoute);
  setText('metric-active-schedule', state.activeSchedule);
  setText('metric-states', state.vnextCore && Array.isArray(state.vnextCore.states) ? state.vnextCore.states.length : 0);
  setText('metric-actions', state.vnextCore && Array.isArray(state.vnextCore.actions) ? state.vnextCore.actions.length : 0);
  setText('metric-resources', state.vnextCore && Array.isArray(state.vnextCore.resources) ? state.vnextCore.resources.length : 0);
  setText('metric-remote-surfaces', state.vnextCore && Array.isArray(state.vnextCore.remoteSurfaces) ? state.vnextCore.remoteSurfaces.length : 0);
  setText('metric-public-components', componentSnapshot.publicComponentCount);
  setText('metric-rmt-metadata', componentSnapshot.withRmtMetadata);
  setText('metric-player-state', playerSnapshot.state && playerSnapshot.state.status ? playerSnapshot.state.status : 'paused');

  renderTimeline();
  setXCode('demo-runtime-snapshot', snapshot);
  setXCode('demo-route-dsl', {
    sourceSyntax: state.sourceSyntax,
    vNextSurfaces: state.vnextCore
      ? state.vnextCore.surfaces.map((surface) => ({
        id: surface.id,
        name: surface.name,
        laneRefs: surface.laneRefs
      }))
      : [],
    routes: state.metadata.routes.map((route) => ({
      id: route.id,
      path: route.path,
      router: route.router,
      component: route.component,
      template: route.template,
      schedule: route.schedule
    }))
  });
  setXCode('demo-adapter-contract', {
    adapters: state.metadata.adapters.map((adapter) => ({
      id: adapter.id,
      kind: adapter.kind,
      providedCapabilities: adapter.providedCapabilities || [],
      factory: adapter.metadata && adapter.metadata.factory
    })),
    productiveAdapterFactories: [
      'createRmtXRouterAdapter',
      'createRmtXtendComponentAdapter',
      'createRmtStateSchedulerDiagnosticsBridge',
      'createRmtComponentCapabilityRegistry'
    ],
    routeMapping: state.mappings.routes
      ? {
        schema: state.mappings.routes.schema,
        routeCount: state.mappings.routes.routeCount,
        scheduleRefs: state.mappings.routes.scheduleRefs
      }
      : null,
    componentMapping: state.mappings.components
      ? {
        schema: state.mappings.components.schema,
        componentCount: state.mappings.components.componentCount,
        scheduleRefs: state.mappings.components.scheduleRefs
      }
      : null,
    lastAdapterResults: state.adapterResults.slice(-5).map((result) => ({
      adapterId: result.adapterId,
      operation: result.operation,
      status: result.status,
      phase: result.phase
    })),
    kernelBoundary: 'RMT does not import XTend; XTend registers as host adapter.',
    canonicalNamespace: 'window.XTend.rmt'
  });
  setXCode('demo-document-preview', {
    kind: state.document ? state.document.kind : 'rmt_document',
    version: state.document ? state.document.version : '2.0-vnext',
    documentId: state.document && state.document.manifest ? state.document.manifest.documentId : '',
    sourceSyntax: state.sourceSyntax,
    vNextCore: state.vnextCore
      ? {
        schema: state.vnextCore.schema,
        templates: state.vnextCore.templates.length,
        surfaces: state.vnextCore.surfaces.length,
        lanes: state.vnextCore.lanes.length,
        operations: state.vnextCore.operations.length,
        slots: state.vnextCore.slots.length,
        events: state.vnextCore.events.length,
        dataSources: state.vnextCore.dataSources.length,
        states: state.vnextCore.states.length,
        selectors: state.vnextCore.selectors.length,
        actions: state.vnextCore.actions.length,
        portals: state.vnextCore.portals.length,
        overlays: state.vnextCore.overlays.length,
        resources: state.vnextCore.resources.length,
        remoteSurfaces: state.vnextCore.remoteSurfaces.length
      }
      : null,
    runtimeProjectionDomains: ['adapters', 'components', 'routes', 'schedules'],
    normalization: state.document ? state.document.normalization : null,
    registries: state.registries
      ? {
        routes: state.registries.routes ? state.registries.routes.length : 0,
        components: state.registries.components ? state.registries.components.length : 0,
        diagnostics: state.registries.diagnostics ? state.registries.diagnostics.length : 0
      }
      : null,
    templates: state.document && Array.isArray(state.document.templates)
      ? state.document.templates.map((template) => template.id || template.templateId)
      : []
  });
  setXCode('demo-template-pilot', pilotSnapshot);
  setXCode('demo-component-attachment', pilotSnapshot.componentAttachment || {});
  setXCode('demo-template-record', {
    id: pilotTemplate.id || pilotSnapshot.templateRef,
    mode: pilotTemplate.mode || pilotSnapshot.templateMode,
    slots: pilotSnapshot.slots,
    events: pilotSnapshot.events,
    hydration: pilotSnapshot.hydration,
    authoring: pilotTemplate.metadata && pilotTemplate.metadata.authoring
      ? pilotTemplate.metadata.authoring
      : {}
  });
  setXCode('demo-primitive-matrix', componentSnapshot);
  setXCode('demo-vnext-primitives', state.vnextCore
    ? {
      states: state.vnextCore.states.map((entry) => entry.id),
      selectors: state.vnextCore.selectors.map((entry) => entry.id),
      actions: state.vnextCore.actions.map((entry) => entry.id),
      portals: state.vnextCore.portals.map((entry) => entry.id),
      overlays: state.vnextCore.overlays.map((entry) => entry.id),
      resources: state.vnextCore.resources.map((entry) => ({
        id: entry.id,
        kind: entry.kind,
        owner: entry.owner
      })),
      remoteSurfaces: state.vnextCore.remoteSurfaces.map((entry) => ({
        id: entry.id,
        remote: entry.remote,
        fallbackSurface: entry.fallbackSurface
      }))
    }
    : {});
  setXCode('demo-player-contract', playerSnapshot);
  setXCode('demo-flagship-snapshot', flagshipSnapshot);
  setXCode('demo-streaming-contract', flagshipSnapshot.streaming || {});
  setXCode('demo-source-to-sea-evidence', flagshipSnapshot.sourceToSeaEvidence || {});
  setXCode('demo-enterprise-contract', flagshipSnapshot.enterpriseRemoteSurface || {});
  setXCode('demo-governance-contract', {
    ...(flagshipSnapshot.eventGovernance || {}),
    remoteEvents: flagshipSnapshot.enterpriseRemoteSurface && flagshipSnapshot.enterpriseRemoteSurface.crossSurfaceEvents
      ? flagshipSnapshot.enterpriseRemoteSurface.crossSurfaceEvents
      : []
  });
  setXCode('demo-native-first-contract', flagshipSnapshot.nativeFirstOwnedRmt || {});

  syncState();
}

function runScheduled(scheduleId, label, work) {
  const schedule = findSchedule(scheduleId);
  const job = createJobRecord(schedule, label);
  state.jobs.push(job);
  refreshDemoUi();

  return new Promise((resolve) => {
    let started = false;

    const finish = (status, result = null) => {
      job.status = status;
      job.finishedAt = performance.now();
      job.durationMs = job.finishedAt - (job.startedAt || job.queuedAt);
      state.lastDurationMs = job.durationMs;
      if (status === 'completed') {
        state.completedJobs += 1;
      } else if (status === 'failed') {
        state.failedJobs += 1;
      }
      refreshDemoUi();
      resolve(result);
    };

    const execute = async (jobContext = {}) => {
      if (started) return;
      started = true;
      job.status = 'running';
      job.startedAt = performance.now();
      refreshDemoUi();
      try {
        const result = await work({
          ...jobContext,
          schedule,
          job
        });
        finish('completed', result);
      } catch (error) {
        job.error = error && error.message ? error.message : String(error);
        finish('failed', null);
      }
    };

    try {
      const scheduleOptions = {
        schedule,
        lane: schedule.lane,
        priority: schedule.priority,
        preferIdle: schedule.preferIdle,
        deadlineMs: schedule.deadlineMs,
        budgetClass: schedule.budgetClass,
        coalesceKey: schedule.coalesceKey,
        metadata: {
          scheduleId: schedule.id,
          demo: true
        }
      };
      if (state.adapters.bridge && typeof state.adapters.bridge.scheduleEndpoint === 'function') {
        state.adapters.bridge.scheduleEndpoint(schedule.endpointName, schedule.scope, execute, scheduleOptions);
      } else if (state.runtime && typeof state.runtime.scheduleEndpoint === 'function') {
        state.runtime.scheduleEndpoint(schedule.endpointName, schedule.scope, execute, scheduleOptions);
      } else {
        window.setTimeout(() => execute({ source: 'host-fallback' }), schedule.preferIdle ? 120 : 16);
      }

      window.setTimeout(() => {
        if (!started) {
          job.source = 'host-fallback';
          execute({ source: 'host-fallback-timeout' });
        }
      }, 1200);
    } catch (error) {
      job.source = 'host-fallback';
      window.setTimeout(() => execute({ source: 'host-fallback-error', error }), 16);
    }
  });
}

function navigateWithRmt(path) {
  const route = state.metadata.routes.find((candidate) => candidate.path === path)
    || state.metadata.routes[0];
  if (!route) return Promise.resolve();

  return runScheduled(route.schedule || 'route.visible.render', `Navigate ${route.path}`, async () => {
    if (state.adapters.router && typeof state.adapters.router.navigate === 'function') {
      const result = state.adapters.router.navigate({
        routeId: route.id,
        path: route.path,
        params: route.params || {},
        query: route.query || {},
        metadata: route.metadata || {}
      }, {
        mapping: state.mappings.routes,
        source: 'xtendrmt.bestcase.demo'
      });
      recordAdapterResult(result, { scheduleRef: route.schedule || 'route.visible.render' });
    } else {
      xstate.set('router-navigate', route.path);
      if (window.location.hash.replace(/^#/, '') !== route.path) {
        window.location.hash = route.path;
      }
    }
    state.activeRoute = route.path;
    state.activeComponent = route.component;
    state.activeSchedule = route.schedule || 'route.visible.render';
    setStatus(`RMT scheduled route ${route.path} through XRouter using ${state.activeSchedule}.`, 'success');
    return route;
  });
}

function runHydrationCycle() {
  return runScheduled('component.idle.hydrate', 'Hydrate XTend component subtree', async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 90));
    setStatus('RMT completed an idle hydration cycle for XTend component state.', 'success');
    return readSchedulerSnapshot();
  });
}

function runDiagnosticsCycle() {
  return runScheduled('diagnostics.snapshot', 'Export scheduler diagnostics', async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 60));
    const snapshot = readSchedulerSnapshot();
    setStatus(`Diagnostics snapshot exported with pressure level ${snapshot.pressureLevel}.`, 'info');
    return snapshot;
  });
}

function runTemplatePilotCycle() {
  return runScheduled('template.visible.inspect', 'Inspect RMT template pilot', async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 45));
    const snapshot = readPilotFlowSnapshot();
    xstate.set('xtend.rmt.templating.pilot', snapshot);
    setStatus(`RMT inspected template ${snapshot.templateRef}; XTend attachment remains adapter data.`, 'success');
    return snapshot;
  });
}

function runPrimitiveMatrixCycle() {
  return runScheduled('component.primitive.matrix', 'Refresh XTend component primitive matrix', async () => {
    const matrix = await loadComponentCapabilityMatrix();
    const snapshot = readComponentCapabilitySnapshot();
    xstate.set('xtend.rmt.component.capabilities', snapshot);
    setStatus(`RMT refreshed ${snapshot.publicComponentCount || matrix.publicComponentCount || 0} XTend component capabilities without kernel imports.`, snapshot.ok ? 'success' : 'warning');
    return snapshot;
  });
}

function runPlayerContractCycle(status = 'playing') {
  return runScheduled('media.visible.contract', `Apply x-player ${status} contract`, async () => {
    state.playerSnapshot = {
      mediaId: 'intro',
      status,
      title: 'XTendRMT Runtime Walkthrough',
      updatedAt: new Date().toISOString()
    };
    const player = byId('bestcase-player');
    if (player) {
      player.setAttribute('title', state.playerSnapshot.title);
      player.dataset.rmtState = status;
    }
    const snapshot = readPlayerContractSnapshot();
    xstate.set('xtend.rmt.player.contract', snapshot);
    setStatus(`RMT applied x-player ${status} request through the public player contract.`, 'success');
    return snapshot;
  });
}

function runFlagshipEvidenceCycle(kind = 'flagship') {
  const scheduleByKind = {
    streaming: 'streaming.visible.render',
    sourceToSea: 'source-to-sea.visible.render',
    enterprise: 'enterprise.visible.contract',
    governance: 'event-governance.visible.render',
    nativeFirst: 'native-first.visible.render',
    flagship: 'source-to-sea.visible.render'
  };
  const scheduleId = scheduleByKind[kind] || scheduleByKind.flagship;
  return runScheduled(scheduleId, `Verify ${kind} flagship evidence`, async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 50));
    const snapshot = readFlagshipSnapshot();
    xstate.set('xtend.rmt.bestcase.flagship', snapshot);
    setStatus(`RMT verified ${kind} flagship evidence through ${scheduleId}.`, 'success');
    return snapshot;
  });
}

async function runFullCycle() {
  const button = byId('demo-run-all');
  if (button) button.setAttribute('loading', '');
  await navigateWithRmt(state.activeRoute || '/');
  await runTemplatePilotCycle();
  await runPrimitiveMatrixCycle();
  await runPlayerContractCycle('playing');
  await runFlagshipEvidenceCycle('streaming');
  await runFlagshipEvidenceCycle('sourceToSea');
  await runFlagshipEvidenceCycle('enterprise');
  await runFlagshipEvidenceCycle('governance');
  await runFlagshipEvidenceCycle('nativeFirst');
  await runHydrationCycle();
  await runDiagnosticsCycle();
  if (button) button.removeAttribute('loading');

  const modalCopy = byId('demo-modal-copy');
  const modal = byId('rmt-demo-modal');
  if (modalCopy) {
    modalCopy.textContent = `RMT cycle complete: ${state.completedJobs} completed jobs, last duration ${state.lastDurationMs.toFixed(1)}ms.`;
  }
  if (modal && typeof modal.open === 'function') {
    modal.open();
  }
}

function bindRouteControls(root = document) {
  root.querySelectorAll('[data-demo-run]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-demo-run');
      if (action === 'full') runFullCycle();
      if (action === 'hydrate') runHydrationCycle();
      if (action === 'diagnostics') runDiagnosticsCycle();
      if (action === 'template-pilot') runTemplatePilotCycle();
      if (action === 'primitive-matrix') runPrimitiveMatrixCycle();
      if (action === 'player-play') runPlayerContractCycle('playing');
      if (action === 'player-pause') runPlayerContractCycle('paused');
      if (action === 'route') navigateWithRmt(state.activeRoute || '/');
      if (action === 'streaming') runFlagshipEvidenceCycle('streaming');
      if (action === 'source-to-sea') runFlagshipEvidenceCycle('sourceToSea');
      if (action === 'enterprise-audit') runFlagshipEvidenceCycle('enterprise');
      if (action === 'governance-publish') runFlagshipEvidenceCycle('governance');
      if (action === 'native-first') runFlagshipEvidenceCycle('nativeFirst');
    });
  });

  root.querySelectorAll('[data-demo-route]').forEach((button) => {
    button.addEventListener('click', () => {
      navigateWithRmt(button.getAttribute('data-demo-route') || '/');
    });
  });
}

function defineDemoRouteComponents() {
  if (!customElements.get(ROUTE_COMPONENTS.overview)) {
    customElements.define(ROUTE_COMPONENTS.overview, class XRmtRouteOverview extends HTMLElement {
      connectedCallback() {
        this.innerHTML = `
          <x-section layout="column" label="RMT Kernel Overview">
            <div slot="header">
              <h2>RMT orchestrates; XTend renders.</h2>
              <p class="muted">The active <code>.rmt</code> document is RMT vNext syntax. XRouter receives route records projected from vNext Core through the productive adapter. Every visible panel below is composed with XTend components.</p>
              <div class="demo-actions">
                <x-button data-demo-run="full" variant="primary">Run full RMT cycle</x-button>
                <x-button data-demo-route="/scheduler" variant="secondary">Open scheduler route</x-button>
              </div>
            </div>
            <x-cards columns="3" gap="1rem">
              <x-card>
                <h3>Routes</h3>
                <span id="metric-routes" class="metric">0</span>
                <span class="metric-label">XRouter entries projected from vNext Surfaces</span>
              </x-card>
              <x-card>
                <h3>XTend Components</h3>
                <span id="metric-components" class="metric">0</span>
                <span class="metric-label">First-class component records in the RMT document</span>
              </x-card>
              <x-card>
                <h3>Templates</h3>
                <span id="metric-templates" class="metric">0</span>
                <span class="metric-label">Registered through the RMT Template API</span>
              </x-card>
            </x-cards>
            <x-tabs>
              <x-tab name="Kernel">
                <x-card>
                  <h3>RMT Boundary</h3>
                  <p>RMT owns scheduling, execution planning, diagnostics and template registration. XTend is mounted as a host adapter, not baked into the kernel.</p>
                </x-card>
              </x-tab>
              <x-tab name="XTend">
                <x-card>
                  <h3>First-Class UI Adapter</h3>
                  <p>XTend components are represented by RMT component records and rendered through native Custom Elements.</p>
                </x-card>
              </x-tab>
              <x-tab name="XRouter">
                <x-card>
                  <h3>Routes from RMT</h3>
                  <p>The router on this page is an actual <code>x-router</code>. Its <code>x-route</code> children are generated from the RMT document.</p>
                </x-card>
              </x-tab>
            </x-tabs>
            <x-code id="demo-document-preview" lang="json"><template>{}</template></x-code>
          </x-section>
        `;
        bindRouteControls(this);
        refreshDemoUi();
      }
    });
  }

  if (!customElements.get(ROUTE_COMPONENTS.scheduler)) {
    customElements.define(ROUTE_COMPONENTS.scheduler, class XRmtRouteScheduler extends HTMLElement {
      connectedCallback() {
        this.innerHTML = `
          <x-section layout="column" label="RMT Scheduler Runtime">
            <div slot="header">
              <h2>Scheduler lanes and diagnostics</h2>
              <p class="muted">This view schedules interactive route work, idle hydration and diagnostics through the current RMT runtime.</p>
              <div class="demo-actions">
                <x-button data-demo-run="route" variant="primary">Schedule current route</x-button>
                <x-button data-demo-run="hydrate" variant="secondary">Idle hydration</x-button>
                <x-button data-demo-run="diagnostics" variant="secondary">Diagnostics snapshot</x-button>
              </div>
            </div>
            <x-cards columns="4" gap="1rem">
              <x-card>
                <h3>Schedules</h3>
                <span id="metric-schedules" class="metric">0</span>
                <span class="metric-label">Policies from native RMT schedules</span>
              </x-card>
              <x-card>
                <h3>Completed</h3>
                <span id="metric-jobs" class="metric">0</span>
                <span class="metric-label">RMT scheduled jobs</span>
              </x-card>
              <x-card>
                <h3>Pressure</h3>
                <span id="metric-pressure" class="metric">normal</span>
                <span class="metric-label">Current scheduler pressure</span>
              </x-card>
              <x-card>
                <h3>Active Route</h3>
                <span id="metric-active-route" class="metric">/</span>
                <span class="metric-label">XRouter state mirrored from RMT</span>
              </x-card>
            </x-cards>
            <x-cards id="demo-timeline" columns="1" gap="0.8rem"></x-cards>
            <x-code id="demo-runtime-snapshot" lang="json"><template>{}</template></x-code>
          </x-section>
        `;
        bindRouteControls(this);
        refreshDemoUi();
      }
    });
  }

  if (!customElements.get(ROUTE_COMPONENTS.routing)) {
    customElements.define(ROUTE_COMPONENTS.routing, class XRmtRouteRouting extends HTMLElement {
      connectedCallback() {
        this.innerHTML = `
          <x-section layout="column" label="RMT Routing DSL">
            <div slot="header">
              <h2>XRouter routes generated from <code>.rmt</code></h2>
              <p class="muted">The RMT document now stores route intent as vNext <code>surface</code>, <code>lane</code> and lifecycle records. The productive XRouter adapter receives the runtime projection and schedules navigation work through RMT.</p>
              <div class="demo-route-nav">
                <x-button data-demo-route="/" variant="secondary">Kernel</x-button>
                <x-button data-demo-route="/scheduler" variant="secondary">Scheduler</x-button>
                <x-button data-demo-route="/routing" variant="primary">Routing DSL</x-button>
                <x-button data-demo-route="/templating" variant="secondary">Templating Pilot</x-button>
                <x-button data-demo-route="/primitives" variant="secondary">Primitives</x-button>
                <x-button data-demo-route="/media" variant="secondary">Media</x-button>
                <x-button data-demo-route="/adapter" variant="secondary">Adapter</x-button>
                <x-button data-demo-route="/streaming" variant="secondary">Streaming</x-button>
                <x-button data-demo-route="/source-to-sea" variant="secondary">Source-to-Sea</x-button>
                <x-button data-demo-route="/enterprise" variant="secondary">Enterprise</x-button>
                <x-button data-demo-route="/governance" variant="secondary">Governance</x-button>
                <x-button data-demo-route="/native-first" variant="secondary">Native-First</x-button>
              </div>
            </div>
            <x-cards columns="2" gap="1rem">
              <x-card>
                <h3>Route Schedule</h3>
                <span id="metric-active-schedule" class="metric">route.visible.render</span>
                <span class="metric-label">Schedule policy attached to current route</span>
              </x-card>
              <x-card>
                <h3>Router Adapter</h3>
                <span class="metric">XRouter</span>
                <span class="metric-label">First official RMT route adapter for XTend</span>
              </x-card>
            </x-cards>
            <x-code id="demo-route-dsl" lang="json"><template>{}</template></x-code>
            <p class="code-note">This is intentionally adapter-shaped: the RMT Kernel stays on vNext Core while host adapters map it to XRouter, React Router, Vue Router or custom routing.</p>
          </x-section>
        `;
        bindRouteControls(this);
        refreshDemoUi();
      }
    });
  }

  if (!customElements.get(ROUTE_COMPONENTS.templating)) {
    customElements.define(ROUTE_COMPONENTS.templating, class XRmtRouteTemplatePilot extends HTMLElement {
      connectedCallback() {
        this.innerHTML = `
          <x-section layout="column" label="RMT Template Pilot">
            <div slot="header">
              <h2>RMT authors the template record; XTend materializes the component tree.</h2>
              <p class="muted">This pilot uses a real vNext <code>.rmt</code> template flow with XTend component attachment data. The demo runs through the productive Bridge, Component Adapter and XRouter Adapter.</p>
              <div class="demo-actions">
                <x-button data-demo-run="template-pilot" variant="primary">Inspect template pilot</x-button>
                <x-button data-demo-run="full" variant="secondary">Run full cycle</x-button>
                <x-button data-demo-route="/adapter" variant="secondary">Adapter boundary</x-button>
              </div>
            </div>
            <x-cards columns="3" gap="1rem">
              <x-card>
                <h3>Template</h3>
                <span class="metric">RMT</span>
                <span class="metric-label">Owns serializable records, slots, events and hydration hints</span>
              </x-card>
              <x-card>
                <h3>Attachment</h3>
                <span class="metric">XTend</span>
                <span class="metric-label">Resolves Custom Elements through host adapter data</span>
              </x-card>
              <x-card>
                <h3>Bridge</h3>
                <span class="metric">E05</span>
                <span class="metric-label">Runtime adapter paths are active in the demo shell</span>
              </x-card>
            </x-cards>
            <x-code id="demo-template-pilot" lang="json"><template>{}</template></x-code>
            <x-code id="demo-component-attachment" lang="json"><template>{}</template></x-code>
            <x-code id="demo-template-record" lang="json"><template>{}</template></x-code>
          </x-section>
        `;
        bindRouteControls(this);
        refreshDemoUi();
      }
    });
  }

  if (!customElements.get(ROUTE_COMPONENTS.primitives)) {
    customElements.define(ROUTE_COMPONENTS.primitives, class XRmtRoutePrimitives extends HTMLElement {
      connectedCallback() {
        this.innerHTML = `
          <x-section layout="column" label="RMT Component Primitives">
            <div slot="header">
              <h2>Manifest-wide XTend component compatibility from RMT.</h2>
              <p class="muted">This route uses the Component Capability Registry to read XTend component contracts, RMT metadata, events, slots, parts and source-to-sea risk without importing XTend types into the RMT kernel.</p>
              <div class="demo-actions">
                <x-button data-demo-run="primitive-matrix" data-demo-route="/primitives" variant="primary">Refresh matrix</x-button>
                <x-button data-demo-route="/media" variant="secondary">Open player contract</x-button>
              </div>
            </div>
            <x-cards columns="4" gap="1rem">
              <x-card>
                <h3>Public UI</h3>
                <span id="metric-public-components" class="metric">0</span>
                <span class="metric-label">Renderable XTend manifest components</span>
              </x-card>
              <x-card>
                <h3>RMT Metadata</h3>
                <span id="metric-rmt-metadata" class="metric">0</span>
                <span class="metric-label">Component entries with RMT compatibility metadata</span>
              </x-card>
              <x-card>
                <h3>State</h3>
                <span id="metric-states" class="metric">0</span>
                <span class="metric-label">vNext state declarations in this demo source</span>
              </x-card>
              <x-card>
                <h3>Actions</h3>
                <span id="metric-actions" class="metric">0</span>
                <span class="metric-label">Declarative event/action records</span>
              </x-card>
            </x-cards>
            <x-status id="primitive-status" label="Component primitive matrix" state="ready"></x-status>
            <x-progress value="90" max="100" label="RMT primitive coverage"></x-progress>
            <x-code id="demo-primitive-matrix" lang="json"><template>{}</template></x-code>
            <x-code id="demo-vnext-primitives" lang="json"><template>{}</template></x-code>
          </x-section>
        `;
        bindRouteControls(this);
        refreshDemoUi();
      }
    });
  }

  if (!customElements.get(ROUTE_COMPONENTS.media)) {
    customElements.define(ROUTE_COMPONENTS.media, class XRmtRouteMedia extends HTMLElement {
      connectedCallback() {
        this.innerHTML = `
          <x-section layout="column" label="RMT Player Contract">
            <div slot="header">
              <h2>x-player is driven through a public RMT contract.</h2>
              <p class="muted">The demo records play/pause requests, state bridge output, theme tokens, CSS parts and object-URL ownership without product code touching <code>shadowRoot</code>.</p>
              <div class="demo-actions">
                <x-button data-demo-run="player-play" variant="primary">Play request</x-button>
                <x-button data-demo-run="player-pause" variant="secondary">Pause request</x-button>
                <x-button data-demo-route="/primitives" variant="secondary">Component matrix</x-button>
              </div>
            </div>
            <x-cards columns="4" gap="1rem">
              <x-card>
                <h3>Player State</h3>
                <span id="metric-player-state" class="metric">paused</span>
                <span class="metric-label">Mirrored through xstate host bridge</span>
              </x-card>
              <x-card>
                <h3>Resources</h3>
                <span id="metric-resources" class="metric">0</span>
                <span class="metric-label">Owner-scoped resources with destroy cleanup</span>
              </x-card>
              <x-card>
                <h3>Remote</h3>
                <span id="metric-remote-surfaces" class="metric">0</span>
                <span class="metric-label">Declarative remote surface contracts</span>
              </x-card>
              <x-card>
                <h3>Boundary</h3>
                <span class="metric">API</span>
                <span class="metric-label">No product shadowRoot patching</span>
              </x-card>
            </x-cards>
            <x-player id="bestcase-player" title="XTendRMT Runtime Walkthrough" height="260"></x-player>
            <x-code id="demo-player-contract" lang="json"><template>{}</template></x-code>
          </x-section>
        `;
        bindRouteControls(this);
        refreshDemoUi();
      }
    });
  }

  if (!customElements.get(ROUTE_COMPONENTS.adapter)) {
    customElements.define(ROUTE_COMPONENTS.adapter, class XRmtRouteAdapter extends HTMLElement {
      connectedCallback() {
        this.innerHTML = `
          <x-section layout="column" label="XTend Product Adapter">
            <div slot="header">
              <h2>XTend is first-class; RMT stays agnostic.</h2>
              <p class="muted">The adapter boundary lets RMT serve large web apps where XTend runs beside React, Vue, Vanilla JS or custom host runtimes.</p>
              <div class="demo-actions">
                <x-button data-demo-run="full" variant="primary">Run adapter cycle</x-button>
                <x-button data-demo-route="/routing" variant="secondary">Inspect route DSL</x-button>
              </div>
            </div>
            <x-cards columns="3" gap="1rem">
              <x-card>
                <h3>Kernel</h3>
                <p>Owns scheduling, diagnostics and execution plans.</p>
              </x-card>
              <x-card>
                <h3>Host Adapter</h3>
                <p>Maps generic RMT contracts to XTend components and XRouter.</p>
              </x-card>
              <x-card>
                <h3>Future Hosts</h3>
                <p>React, Vue and Custom adapters can reuse the same scheduler core.</p>
              </x-card>
            </x-cards>
            <x-code id="demo-adapter-contract" lang="json"><template>{}</template></x-code>
          </x-section>
        `;
        bindRouteControls(this);
        refreshDemoUi();
      }
    });
  }

  if (!customElements.get(ROUTE_COMPONENTS.streaming)) {
    customElements.define(ROUTE_COMPONENTS.streaming, class XRmtRouteStreaming extends HTMLElement {
      connectedCallback() {
        this.innerHTML = `
          <x-section layout="column" label="RMT vNext Streaming">
            <div slot="header">
              <h2>Streaming is declarative, sanitized and boundary-aware.</h2>
              <p class="muted">The Bestcase stream records the SSE source, the security boundary and the HTML sanitizing rule in vNext Core. The demo keeps the proof offline and never opens a remote stream.</p>
              <div class="demo-actions">
                <x-button data-demo-run="streaming" variant="primary">Verify streaming contract</x-button>
                <x-button data-demo-route="/source-to-sea" variant="secondary">Source-to-Sea evidence</x-button>
              </div>
            </div>
            <x-cards columns="3" gap="1rem">
              <x-card>
                <h3>Boundary</h3>
                <span class="metric">SSE</span>
                <span class="metric-label">xtend.security.streaming-boundary.v1</span>
              </x-card>
              <x-card>
                <h3>Sanitize</h3>
                <span class="metric">HTML</span>
                <span class="metric-label">Stream payloads are sanitized before host render</span>
              </x-card>
              <x-card>
                <h3>Network</h3>
                <span class="metric">0</span>
                <span class="metric-label">Offline fixture mode for the flagship gate</span>
              </x-card>
            </x-cards>
            <x-status label="Streaming contract" state="ready"></x-status>
            <x-code id="demo-streaming-contract" lang="json"><template>{}</template></x-code>
            <x-code id="demo-flagship-snapshot" lang="json"><template>{}</template></x-code>
          </x-section>
        `;
        bindRouteControls(this);
        refreshDemoUi();
      }
    });
  }

  if (!customElements.get(ROUTE_COMPONENTS.sourceToSea)) {
    customElements.define(ROUTE_COMPONENTS.sourceToSea, class XRmtRouteSourceToSea extends HTMLElement {
      connectedCallback() {
        this.innerHTML = `
          <x-section layout="column" label="Source-to-Sea Evidence">
            <div slot="header">
              <h2>RMT source, schedule, Fabric fiber and UI marker stay correlated.</h2>
              <p class="muted">This route exposes the same evidence shape as the Source-to-Sea browser probe: primitive id, schedule ref, fiber ref, lane, endpoint and source pointer.</p>
              <div class="demo-actions">
                <x-button data-demo-run="source-to-sea" data-rmt-primitive-id="bestcase.evidence.summary" variant="primary">Inspect evidence</x-button>
                <x-button data-demo-route="/enterprise" variant="secondary">Enterprise contract</x-button>
              </div>
            </div>
            <x-cards columns="4" gap="1rem">
              <x-card data-rmt-primitive-id="bestcase.evidence.summary" data-rmt-schedule-ref="schedule:xtendrmt.bestcase.demo/sourceToSea/visible" data-rmt-fiber-ref="fiber:xtendrmt.bestcase.demo/sourceToSea/visible/0" data-xtend-fabric-lane="visible" data-rmt-source-pointer="/surfaces/sourceToSea/lane/visible">
                <h3>Primitive</h3>
                <span class="metric">bestcase</span>
                <span class="metric-label">Source-to-Sea marker is visible in DOM and Core</span>
              </x-card>
              <x-card>
                <h3>Schedule</h3>
                <span class="metric">visible</span>
                <span class="metric-label">source-to-sea.visible.render</span>
              </x-card>
              <x-card>
                <h3>Fiber</h3>
                <span class="metric">0</span>
                <span class="metric-label">Fabric fiber reference is stable</span>
              </x-card>
              <x-card>
                <h3>Endpoint</h3>
                <span class="metric">RMT</span>
                <span class="metric-label">xtendrmt.source-to-sea.render</span>
              </x-card>
            </x-cards>
            <x-code id="demo-source-to-sea-evidence" lang="json"><template>{}</template></x-code>
          </x-section>
        `;
        bindRouteControls(this);
        refreshDemoUi();
      }
    });
  }

  if (!customElements.get(ROUTE_COMPONENTS.enterprise)) {
    customElements.define(ROUTE_COMPONENTS.enterprise, class XRmtRouteEnterprise extends HTMLElement {
      connectedCallback() {
        this.innerHTML = `
          <x-section layout="column" label="Enterprise Remote Surface">
            <div slot="header">
              <h2>Remote Surfaces are contracts first.</h2>
              <p class="muted">The flagship demo carries owner, version, origin, integrity, trust boundary, typed events and degradation fallback without executing a remote module.</p>
              <div class="demo-actions">
                <x-button data-demo-run="enterprise-audit" data-remote-surface="bestcase.audit" variant="primary">Verify remote contract</x-button>
                <x-button data-demo-route="/governance" variant="secondary">Event governance</x-button>
              </div>
            </div>
            <x-cards columns="3" gap="1rem">
              <x-card data-remote-surface="bestcase.audit" data-remote-execution="false">
                <h3>Remote</h3>
                <span class="metric">audit</span>
                <span class="metric-label">@xtend/audit-panel ^2.0.0</span>
              </x-card>
              <x-card>
                <h3>Fallback</h3>
                <span class="metric">full</span>
                <span class="metric-label">enterpriseFallback resolves degradation locally</span>
              </x-card>
              <x-card>
                <h3>Network</h3>
                <span class="metric">0</span>
                <span class="metric-label">No remote execution in the Bestcase gate</span>
              </x-card>
            </x-cards>
            <x-rmt-route-enterprise-fallback></x-rmt-route-enterprise-fallback>
            <x-code id="demo-enterprise-contract" lang="json"><template>{}</template></x-code>
          </x-section>
        `;
        bindRouteControls(this);
        refreshDemoUi();
      }
    });
  }

  if (!customElements.get(ROUTE_COMPONENTS.enterpriseFallback)) {
    customElements.define(ROUTE_COMPONENTS.enterpriseFallback, class XRmtRouteEnterpriseFallback extends HTMLElement {
      connectedCallback() {
        this.innerHTML = `
          <x-alert type="info">
            <strong>Local degradation fallback:</strong>
            remote surface <code>bestcase.audit</code> is represented by an offline contract and resolved to <code>enterpriseFallback</code>.
          </x-alert>
        `;
      }
    });
  }

  if (!customElements.get(ROUTE_COMPONENTS.governance)) {
    customElements.define(ROUTE_COMPONENTS.governance, class XRmtRouteGovernance extends HTMLElement {
      connectedCallback() {
        this.innerHTML = `
          <x-section layout="column" label="Cross-Surface Event Governance">
            <div slot="header">
              <h2>Events carry owners, payload contracts and delivery boundaries.</h2>
              <p class="muted">The flagship route records typed inbound/outbound events from the remote surface contract and keeps governance data visible to CI.</p>
              <div class="demo-actions">
                <x-button data-demo-run="governance-publish" variant="primary">Publish governed event</x-button>
                <x-button data-demo-route="/native-first" variant="secondary">Native-First route</x-button>
              </div>
            </div>
            <x-cards columns="3" gap="1rem">
              <x-card>
                <h3>Owner</h3>
                <span class="metric">team</span>
                <span class="metric-label">platform-runtime owns the governance policy</span>
              </x-card>
              <x-card>
                <h3>Payload</h3>
                <span class="metric">typed</span>
                <span class="metric-label">Event payload schemas are explicit</span>
              </x-card>
              <x-card>
                <h3>Delivery</h3>
                <span class="metric">strict</span>
                <span class="metric-label">Contract-only cross-surface delivery</span>
              </x-card>
            </x-cards>
            <x-code id="demo-governance-contract" lang="json"><template>{}</template></x-code>
          </x-section>
        `;
        bindRouteControls(this);
        refreshDemoUi();
      }
    });
  }

  if (!customElements.get(ROUTE_COMPONENTS.nativeFirst)) {
    customElements.define(ROUTE_COMPONENTS.nativeFirst, class XRmtRouteNativeFirst extends HTMLElement {
      connectedCallback() {
        this.innerHTML = `
          <x-section layout="column" label="Native-First Owned RMT">
            <div slot="header">
              <h2>Owned RMT recipes stay native, inspectable and parity-gated.</h2>
              <p class="muted">The Bestcase route marks DOM descriptor proofs, action/effect/data/resource primitives, owned recipe extension and runtime parity as first-class demo capabilities.</p>
              <div class="demo-actions">
                <x-button data-demo-run="native-first" data-recipe-ref="native-first.owned-rmt.flagship" variant="primary">Verify Native-First coverage</x-button>
                <x-button data-demo-route="/" variant="secondary">Back to overview</x-button>
              </div>
            </div>
            <x-cards columns="4" gap="1rem">
              <x-card>
                <h3>DOM</h3>
                <span class="metric">proof</span>
                <span class="metric-label">DOM descriptor renderer evidence</span>
              </x-card>
              <x-card>
                <h3>Actions</h3>
                <span class="metric">owned</span>
                <span class="metric-label">Action/effect/data/resource primitives</span>
              </x-card>
              <x-card>
                <h3>Recipes</h3>
                <span class="metric">RMT</span>
                <span class="metric-label">Owned recipe extension path</span>
              </x-card>
              <x-card>
                <h3>Parity</h3>
                <span class="metric">true</span>
                <span class="metric-label">Contract budget runtime parity</span>
              </x-card>
            </x-cards>
            <x-status label="Native-First Owned RMT" state="ready"></x-status>
            <x-code id="demo-native-first-contract" lang="json"><template>{}</template></x-code>
          </x-section>
        `;
        bindRouteControls(this);
        refreshDemoUi();
      }
    });
  }
}

async function waitForXtendElements() {
  await Promise.all([
    'x-header',
    'x-section',
    'x-cards',
    'x-card',
    'x-tabs',
    'x-tab',
    'x-button',
    'x-alert',
    'x-code',
    'x-player',
    'x-progress',
    'x-status',
    'x-toast',
    'x-modal',
    'x-router',
    'x-route',
    'x-footer'
  ].map((tag) => customElements.whenDefined(tag)));
}

function registerDocumentWithRuntime(documentInput) {
  if (!state.runtime) return;
  try {
    if (typeof state.runtime.registerDocument === 'function') {
      state.runtime.registerDocument(documentInput);
      return;
    }
    const templateApi = typeof state.runtime.getTemplateApi === 'function'
      ? state.runtime.getTemplateApi()
      : null;
    if (templateApi && typeof templateApi.registerDocument === 'function') {
      templateApi.registerDocument(documentInput);
    }
  } catch (error) {
    console.warn('XTendRMT Demo: RMT document registration failed.', error);
  }
}

function initializeProductiveAdapters() {
  const router = document.getElementById('rmt-demo-router');
  if (!router || !state.document || !state.registries) return false;

  state.adapters.router = createRmtXRouterAdapter({
    rmtFormat: getRmtFormat(),
    routerElement: router,
    xstate
  });
  state.adapters.component = createRmtXtendComponentAdapter({
    rmtFormat: getRmtFormat(),
    document,
    customElements,
    xstate,
    manifest: XTEND_COMPONENT_MANIFEST,
    dispatchCommand(commandName, payload) {
      xstate.set(commandName, payload);
    }
  });
  state.adapters.bridge = createRmtStateSchedulerDiagnosticsBridge({
    xstate,
    scheduler: state.runtime,
    schedules: state.metadata.schedules,
    document: state.document
  });

  const stateBridgeResult = state.adapters.bridge.createStateBridge();
  state.stateBridge = stateBridgeResult.handle || null;
  recordAdapterResult(stateBridgeResult);

  state.mappings.routes = state.adapters.router.mapRoutes(state.registries);
  state.mappings.components = state.adapters.component.mapComponents(state.registries, {
    manifest: XTEND_COMPONENT_MANIFEST
  });

  return true;
}

function buildRoutesFromDocument() {
  const router = document.getElementById('rmt-demo-router');
  if (!router || !initializeProductiveAdapters()) return;

  const routeResult = state.adapters.router.registerRoutes(state.registries, {
    mapping: state.mappings.routes,
    replace: true,
    render: false
  });
  recordAdapterResult(routeResult, { scheduleRef: 'route.visible.render' });

  const componentResult = state.adapters.component.registerComponent(state.registries, {
    mapping: state.mappings.components,
    manifest: XTEND_COMPONENT_MANIFEST
  });
  recordAdapterResult(componentResult, { scheduleRef: 'component.visible.mount' });

  if (!router.__xtendrmtDemoRouteHandlerBound) {
    router.__xtendrmtDemoRouteHandlerBound = true;
    router.addEventListener('route-changed', (event) => {
      const detail = event.detail || {};
      const route = findRouteFromDetail(detail);
      if (route) {
        state.activeRoute = route.path;
        state.activeComponent = route.component;
        state.activeSchedule = route.schedule || 'route.visible.render';
        const hydrationResult = state.adapters.component.hydrateComponent(router, route.component, {
          routeId: route.id,
          path: route.path,
          template: route.template,
          schedule: state.activeSchedule
        }, {
          mapping: state.mappings.components,
          manifest: XTEND_COMPONENT_MANIFEST
        });
        recordAdapterResult(hydrationResult, {
          scheduleRef: hydrationResult.metadata && hydrationResult.metadata.scheduleRef
            ? hydrationResult.metadata.scheduleRef
            : 'component.visible.mount'
        });
        runScheduled(state.activeSchedule, `Render route ${route.path}`, async () => {
          setStatus(`XRouter rendered ${route.path}; RMT tracked native route ${route.id} with ${route.schedule}.`, 'success');
          return route;
        });
      }
      refreshDemoUi();
    });
  }

  if (typeof router._handleNavigation === 'function') {
    router._handleNavigation();
  }
}

function bindGlobalControls() {
  const runAll = byId('demo-run-all');
  if (runAll) {
    runAll.addEventListener('click', () => runFullCycle());
  }

  const modalClose = byId('demo-modal-close');
  const modal = byId('rmt-demo-modal');
  if (modalClose && modal && typeof modal.close === 'function') {
    modalClose.addEventListener('click', () => modal.close());
  }
}

async function loadDemoDocument() {
  const response = await fetch(DEMO_DOCUMENT_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`RMT document failed to load: ${response.status}`);
  }
  const rmtFormat = getRmtFormat();
  const documentText = await response.text();
  const isLegacyJson = documentText.trimStart().startsWith('{');
  let documentInput;
  let normalizedDocument;
  let vnextCore = null;

  if (isLegacyJson) {
    documentInput = rmtFormat.parseDocument(documentText, { sourceUrl: DEMO_DOCUMENT_URL });
    normalizedDocument = rmtFormat.normalizeDocument(documentInput);
  } else {
    const coreResponse = await fetch(DEMO_CORE_DOCUMENT_URL, { cache: 'no-store' });
    if (!coreResponse.ok) {
      throw new Error(`RMT vNext core document failed to load: ${coreResponse.status}`);
    }
    vnextCore = await coreResponse.json();
    documentInput = createRuntimeDocumentFromVNextCore(vnextCore, {
      sourceUrl: DEMO_DOCUMENT_URL
    });
    normalizedDocument = rmtFormat.normalizeDocument(documentInput);
  }

  const registries = rmtFormat.createRuntimeRegistries(normalizedDocument);
  const metadata = normalizedDocument && normalizedDocument.manifest && normalizedDocument.manifest.metadata
    ? normalizedDocument.manifest.metadata
    : {};

  state.vnextSource = isLegacyJson ? '' : documentText;
  state.vnextCore = vnextCore;
  state.sourceSyntax = isLegacyJson ? 'legacy-json' : 'rmt-vnext';
  state.rawDocument = documentInput;
  state.document = normalizedDocument;
  state.normalizedDocument = normalizedDocument;
  state.registries = registries;
  state.metadata = {
    adapters: Array.isArray(normalizedDocument.adapters) ? normalizedDocument.adapters : [],
    components: Array.isArray(normalizedDocument.components) ? normalizedDocument.components : [],
    routes: Array.isArray(normalizedDocument.routes) ? normalizedDocument.routes : [],
    schedules: Array.isArray(normalizedDocument.schedules) ? normalizedDocument.schedules : [],
    pilotFlow: metadata.pilotFlow || null,
    nativeDemoMigration: metadata.nativeDemoMigration || null,
    componentPrimitives: metadata.componentPrimitives || null,
    playerContract: metadata.playerContract || null,
    surfaceResourceLifecycle: metadata.surfaceResourceLifecycle || null,
    flagship: metadata.flagship || null,
    streaming: metadata.streaming || null,
    sourceToSeaEvidence: metadata.sourceToSeaEvidence || null,
    enterpriseRemoteSurface: metadata.enterpriseRemoteSurface || null,
    eventGovernance: metadata.eventGovernance || null,
    nativeFirstOwnedRmt: metadata.nativeFirstOwnedRmt || null
  };
  return normalizedDocument;
}

async function initDemo() {
  try {
    ensureXTendNamespace();
    defineDemoRouteComponents();
    await waitForXtendElements();
    await loadComponentCapabilityMatrix();

    state.runtime = createRmtRuntime({
      windowTarget: window,
      documentTarget: document,
      globalName: 'xtend.rmt',
      enablePrewarmWorker: false,
      defaults: {
        namespace: 'xtendrmt.demo',
        metadata: {
          host: 'xtend',
          demo: true
        }
      }
    });

    const xtend = ensureXTendNamespace();
    xtend.rmt = {
      ...(typeof xtend.rmt === 'object' ? xtend.rmt : {}),
      runtime: state.runtime,
      scheduler: {
        run: runScheduled,
        snapshot: readSchedulerSnapshot
      },
      templating: {
        inspect: runTemplatePilotCycle,
        snapshot: readPilotFlowSnapshot
      },
      router: {
        navigate: navigateWithRmt
      },
      demo: state
    };

    await loadDemoDocument();
    registerDocumentWithRuntime(state.document);
    buildRoutesFromDocument();
    bindGlobalControls();

    state.initialized = true;
    setStatus('XTendRMT Demo bereit: RMT vNext Core geladen, Runtime-Projektion erstellt, produktive Adapter aktiv.', 'success');
    refreshDemoUi();
  } catch (error) {
    console.error('XTendRMT BestCase Demo failed.', error);
    setStatus(`Demo konnte nicht initialisiert werden: ${error.message || error}`, 'error');
  }
}

const demoApi = {
  state,
  bindRouteControls,
  refresh: refreshDemoUi,
  navigate: navigateWithRmt,
  runFullCycle,
  runHydrationCycle,
  runDiagnosticsCycle,
  runTemplatePilotCycle,
  runPrimitiveMatrixCycle,
  runPlayerContractCycle,
  readPilotFlowSnapshot,
  readComponentCapabilitySnapshot,
  readPlayerContractSnapshot,
  snapshot: readSchedulerSnapshot
};

if (typeof window !== 'undefined') {
  window.XTendRmtDemo = demoApi;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDemo, { once: true });
  } else {
    initDemo();
  }
}

export { demoApi as XTendRmtDemo };
