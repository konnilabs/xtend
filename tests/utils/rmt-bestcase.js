const {
  readJson,
  readText
} = require('./files');

const DEMO_SOURCE_PATH = 'demos/xtendrmt/examples/flagship/source.rmt';
const DEMO_CORE_PATH = 'demos/xtendrmt/examples/flagship/generated/core.json';
const MINIMUM_GATE = 'node scripts/run_xtend_tests.js rmt-compatibility --json';
const ROUTE_COMPONENTS = Object.freeze({
  kernel: 'x-rmt-route-overview',
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
const ROUTE_SCHEDULES = Object.freeze({
  kernel: 'route.visible.render',
  scheduler: 'route.visible.render',
  routing: 'route.visible.render',
  templating: 'route.visible.render',
  primitives: 'component.primitive.matrix',
  media: 'media.visible.contract',
  adapter: 'component.idle.hydrate',
  streaming: 'streaming.visible.render',
  sourceToSea: 'source-to-sea.visible.render',
  enterprise: 'enterprise.visible.contract',
  governance: 'event-governance.visible.render',
  nativeFirst: 'native-first.visible.render'
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function firstOperationForSurface(core, surfaceName) {
  const surface = list(core.surfaces).find((entry) => entry && entry.name === surfaceName);
  if (!surface) return null;
  const lanes = list(surface.laneRefs)
    .map((laneRef) => list(core.lanes).find((lane) => lane && lane.id === laneRef))
    .filter(Boolean);
  const operationRefs = lanes.flatMap((lane) => list(lane.operationRefs));
  return operationRefs
    .map((operationRef) => list(core.operations).find((operation) => operation && operation.id === operationRef))
    .find((operation) => operation && operation.target && operation.target.ref)
    || null;
}

function templateAuthoring(templateRef, componentRefs = [], extra = {}) {
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

function createProjectedMetadata(core) {
  return {
    templateAuthoring: {
      contractVersion: 'xtend.rmt.template-authoring.v1',
      adapter: 'xtend.template',
      componentAdapter: 'xtend.component',
      kernelVisible: false
    },
    rootLifecycle: {
      contractVersion: 'xtend.rmt.root-handshake.v1',
      planner: 'rmt-scheduler',
      executor: 'xtend-host-adapter',
      schedulerEndpointHints: [
        { endpointName: 'xtendrmt.component.hydrate' }
      ],
      kernelVisible: false
    },
    hostCapabilities: {
      contractVersion: 'xtend.rmt.host-capabilities.v1',
      requiredCapabilities: ['manifest', 'customElements', 'stateBridge', 'hydration', 'schedulerEndpoints'],
      optionalCapabilities: ['theme', 'api', 'router', 'diagnostics'],
      capabilityRefs: ['xtend.hydration'],
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
      stateBridge: 'state-host-bridge',
      themeTokens: ['--x-player-primary', '--x-player-accent', '--x-player-background', '--x-player-radius'],
      parts: ['root', 'media', 'title', 'overlay', 'controls', 'progress'],
      kernelBoundary: 'no-product-shadowRoot-patching'
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
      streamRef: 'activity-feed'
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
      owner: 'platform-runtime',
      sensitivity: 'internal',
      events: [
        'bestcase.audit.opened.v1',
        'demo.enterprise.audit.requested.v1',
        'demo.governance.published.v1'
      ]
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
      surfaces: ['typing', 'manifest-plan', 'preview-plan', 'extension-points', 'component-files'],
      requiredContracts: [
        'xtend.rmt.component-contract.v1',
        'xtend.rmt.template-authoring.v1',
        'xtend.rmt.root-handshake.v1',
        'xtend.rmt.host-capabilities.v1'
      ],
      minimumGate: MINIMUM_GATE,
      kernelVisible: false
    },
    pilotFlow: {
      contractVersion: 'xtend.rmt.template-pilot-flow.v1',
      status: 'reference-only',
      templateRef: 'demo.templating.pilot',
      routeRef: 'templating',
      minimumGate: MINIMUM_GATE,
      bridgeRuntime: 'reserved-for-Epic-05',
      kernelVisible: false,
      componentAttachment: {
        adapter: 'xtend.template',
        componentAdapter: 'xtend.component',
        componentRefs: ['pilot.shell', 'kernel.cards', 'feedback.status']
      }
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
    },
    vNextCore: {
      schema: core.schema,
      surfaceCount: list(core.surfaces).length,
      laneCount: list(core.lanes).length,
      operationCount: list(core.operations).length
    }
  };
}

function createProjectedRoutes(core) {
  const routeConfigs = [
    ['kernel', '/', 'XTendRMT Kernel BestCase', 'demo.kernel', 'route.visible.render'],
    ['scheduler', '/scheduler', 'XTendRMT Scheduler', 'demo.scheduler', 'route.visible.render'],
    ['routing', '/routing', 'XTendRMT Routing DSL', 'demo.routing', 'route.visible.render'],
    ['templating', '/templating', 'RMT Template Pilot', 'demo.templating.pilot', 'route.visible.render'],
    ['primitives', '/primitives', 'RMT Component Primitives', 'demo.primitives', 'component.primitive.matrix'],
    ['media', '/media', 'RMT Player and Media Contract', 'demo.media', 'media.visible.contract'],
    ['adapter', '/adapter', 'XTend Product Adapter', 'demo.adapter', 'component.idle.hydrate'],
    ['streaming', '/streaming', 'RMT vNext Streaming', 'demo.streaming', 'streaming.visible.render'],
    ['sourceToSea', '/source-to-sea', 'Source-to-Sea Evidence', 'demo.sourceToSea', 'source-to-sea.visible.render'],
    ['enterprise', '/enterprise', 'Enterprise Remote Surface', 'demo.enterprise', 'enterprise.visible.contract'],
    ['governance', '/governance', 'Cross-Surface Event Governance', 'demo.governance', 'event-governance.visible.render'],
    ['nativeFirst', '/native-first', 'Native-First Owned RMT', 'demo.nativeFirst', 'native-first.visible.render']
  ];
  const routes = routeConfigs.map(([id, path, title, template, schedule]) => {
    const operation = firstOperationForSurface(core, id);
    return {
      id,
      path,
      router: 'xtend.xrouter',
      title,
      component: operation && operation.target && operation.target.ref ? operation.target.ref : ROUTE_COMPONENTS[id],
      template,
      schedule
    };
  });
  routes.push({
    id: 'not-found',
    path: '*',
    router: 'xtend.xrouter',
    title: 'XTendRMT Route Fallback',
    component: ROUTE_COMPONENTS.kernel,
    template: 'demo.kernel',
    schedule: 'route.visible.render'
  });
  return routes;
}

function createProjectedComponents(core) {
  const routeComponents = Object.keys(ROUTE_COMPONENTS).map((routeId) => {
    const operation = firstOperationForSurface(core, routeId);
    const id = operation && operation.target && operation.target.ref ? operation.target.ref : ROUTE_COMPONENTS[routeId];
    return {
      id,
      adapter: 'xtend.component',
      kind: 'custom_element',
      tag: id,
      schedule: ROUTE_SCHEDULES[routeId] || (routeId === 'adapter' ? 'component.idle.hydrate' : 'component.visible.mount'),
      metadata: {
        routeComponent: true
      }
    };
  });
  return routeComponents.concat([
    { id: 'shell.header', adapter: 'xtend.component', kind: 'custom_element', tag: 'x-header', schedule: 'component.visible.mount' },
    { id: 'kernel.cards', adapter: 'xtend.component', kind: 'custom_element', tag: 'x-cards', schedule: 'component.visible.mount' },
    { id: 'code.snapshot', adapter: 'xtend.component', kind: 'custom_element', tag: 'x-code', schedule: 'component.idle.hydrate' },
    { id: 'feedback.status', adapter: 'xtend.component', kind: 'custom_element', tag: 'x-alert', schedule: 'component.visible.mount' },
    { id: 'pilot.shell', adapter: 'xtend.component', kind: 'custom_element', tag: 'x-section', schedule: 'component.visible.mount' },
    { id: 'primitive.matrix', adapter: 'xtend.component', kind: 'custom_element', tag: 'x-status', schedule: 'component.primitive.matrix' },
    { id: 'primitive.progress', adapter: 'xtend.component', kind: 'custom_element', tag: 'x-progress', schedule: 'component.primitive.matrix' },
    { id: 'media.player', adapter: 'xtend.component', kind: 'custom_element', tag: 'x-player', schedule: 'media.visible.contract' },
    { id: 'media.toast', adapter: 'xtend.component', kind: 'custom_element', tag: 'x-toast', schedule: 'diagnostics.snapshot' },
    { id: 'streaming.feed', adapter: 'xtend.component', kind: 'custom_element', tag: 'x-status', schedule: 'streaming.visible.render' },
    { id: 'sourceToSea.evidence', adapter: 'xtend.component', kind: 'custom_element', tag: 'x-code', schedule: 'source-to-sea.visible.render' },
    { id: 'enterprise.remoteContract', adapter: 'xtend.component', kind: 'custom_element', tag: 'x-status', schedule: 'enterprise.visible.contract' },
    { id: 'enterprise.fallback', adapter: 'xtend.component', kind: 'custom_element', tag: ROUTE_COMPONENTS.enterpriseFallback, schedule: 'enterprise.fallback.visible' },
    { id: 'governance.events', adapter: 'xtend.component', kind: 'custom_element', tag: 'x-code', schedule: 'event-governance.visible.render' },
    { id: 'nativeFirst.recipes', adapter: 'xtend.component', kind: 'custom_element', tag: 'x-status', schedule: 'native-first.visible.render' }
  ]);
}

function createProjectedSchedules() {
  return [
    { id: 'template.visible.inspect', endpointName: 'xtendrmt.template.inspect', scope: 'xtendrmt.template.pilot', lane: 'visible', priority: 70 },
    { id: 'route.visible.render', endpointName: 'xtendrmt.route.render', scope: 'xtendrmt.router.current', lane: 'visible', priority: 88 },
    { id: 'component.visible.mount', endpointName: 'xtendrmt.component.mount', scope: 'xtendrmt.component.visible', lane: 'visible', priority: 76 },
    { id: 'component.idle.hydrate', endpointName: 'xtendrmt.component.hydrate', scope: 'xtendrmt.component.idle', lane: 'idle', priority: 42 },
    { id: 'component.primitive.matrix', endpointName: 'xtendrmt.component-capability.matrix', scope: 'xtendrmt.component.capabilities', lane: 'visible', priority: 92 },
    { id: 'media.visible.contract', endpointName: 'xtendrmt.player.contract', scope: 'xtendrmt.media.player', lane: 'visible', priority: 84 },
    { id: 'diagnostics.snapshot', endpointName: 'xtendrmt.diagnostics.snapshot', scope: 'xtendrmt.diagnostics', lane: 'diagnostics', priority: 34 },
    { id: 'streaming.visible.render', endpointName: 'xtendrmt.route.render', scope: 'xtendrmt.streaming', lane: 'visible', priority: 86 },
    { id: 'streaming.event.stream', endpointName: 'feed.activity', scope: 'xtendrmt.streaming.feed', lane: 'idle', priority: 32 },
    { id: 'source-to-sea.visible.render', endpointName: 'xtendrmt.source-to-sea.render', scope: 'xtendrmt.source-to-sea.evidence', lane: 'visible', priority: 90 },
    { id: 'source-to-sea.diagnostics', endpointName: 'xtendrmt.source-to-sea.diagnostics', scope: 'xtendrmt.source-to-sea.diagnostics', lane: 'diagnostics', priority: 44 },
    { id: 'enterprise.visible.contract', endpointName: 'xtendrmt.enterprise.contract', scope: 'xtendrmt.enterprise.remote-surface', lane: 'visible', priority: 89 },
    { id: 'enterprise.fallback.visible', endpointName: 'xtendrmt.enterprise.fallback', scope: 'xtendrmt.enterprise.fallback', lane: 'visible', priority: 76 },
    { id: 'event-governance.visible.render', endpointName: 'xtendrmt.event-governance.render', scope: 'xtendrmt.event-governance', lane: 'visible', priority: 82 },
    { id: 'native-first.visible.render', endpointName: 'xtendrmt.native-first.render', scope: 'xtendrmt.native-first.owned-rmt', lane: 'visible', priority: 85 }
  ];
}

function createProjectedTemplates() {
  const simpleTemplates = [
    ['demo.kernel', 'kernel', ['kernel.cards']],
    ['demo.scheduler', 'scheduler', ['kernel.cards']],
    ['demo.routing', 'routing', []],
    ['demo.adapter', 'adapter', []]
  ].map(([id, route, componentRefs]) => ({
    id,
    mode: 'html_fragment',
    markup: '<x-section layout="column"></x-section>',
    metadata: {
      route,
      authoring: templateAuthoring(id, componentRefs)
    },
    hydration: {
      mode: 'runtime_render',
      ownershipMode: 'managed_subtree',
      preferInsularHydration: true
    }
  }));

  return simpleTemplates.concat({
    id: 'demo.templating.pilot',
    mode: 'dom_descriptor',
    markup: '<x-section layout="column" label="RMT Template Pilot"></x-section>',
    slots: {
      title: { kind: 'text', value: 'RMT vNext authors; XTend host materializes.' },
      summary: { kind: 'text', value: 'vNext Core keeps the authoring record declarative.' },
      cards: { kind: 'template', template: 'demo.kernel' },
      feedback: { kind: 'template', markup: 'Bridge runtime stays reserved for Epic 05.' }
    },
    events: {
      'pilot-run': {
        kind: 'command',
        commandName: 'xtendrmt.template.pilot.inspect'
      }
    },
    metadata: {
      route: 'templating',
      authoring: templateAuthoring('demo.templating.pilot', ['pilot.shell', 'kernel.cards', 'feedback.status'], {
        componentAttachment: {
          adapter: 'xtend.template',
          componentAdapter: 'xtend.component',
          componentRefs: ['pilot.shell', 'kernel.cards', 'feedback.status']
        },
        bridgeRuntime: 'reserved-for-Epic-05'
      })
    },
    hydration: {
      mode: 'runtime_render',
      ownershipMode: 'managed_subtree',
      preferInsularHydration: true,
      metadata: {
        endpointHint: 'xtendrmt.template.inspect'
      }
    }
  }, {
    id: 'demo.primitives',
    mode: 'dom_descriptor',
    markup: '<x-section layout="column" label="RMT Component Primitives"></x-section>',
    metadata: {
      route: 'primitives',
      authoring: templateAuthoring('demo.primitives', ['primitive.matrix', 'primitive.progress'], {
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
  }, {
    id: 'demo.media',
    mode: 'dom_descriptor',
    markup: '<x-section layout="column" label="RMT Player Contract"></x-section>',
    metadata: {
      route: 'media',
      authoring: templateAuthoring('demo.media', ['media.player', 'media.toast'], {
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
  }, {
    id: 'demo.streaming',
    mode: 'dom_descriptor',
    markup: '<x-section layout="column" label="RMT vNext Streaming"></x-section>',
    metadata: {
      route: 'streaming',
      authoring: templateAuthoring('demo.streaming', ['streaming.feed'], {
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
  }, {
    id: 'demo.sourceToSea',
    mode: 'dom_descriptor',
    markup: '<x-section layout="column" label="Source-to-Sea Evidence"></x-section>',
    metadata: {
      route: 'sourceToSea',
      authoring: templateAuthoring('demo.sourceToSea', ['sourceToSea.evidence'], {
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
  }, {
    id: 'demo.enterprise',
    mode: 'dom_descriptor',
    markup: '<x-section layout="column" label="Enterprise Remote Surface"></x-section>',
    metadata: {
      route: 'enterprise',
      authoring: templateAuthoring('demo.enterprise', ['enterprise.remoteContract', 'enterprise.fallback'], {
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
  }, {
    id: 'demo.governance',
    mode: 'dom_descriptor',
    markup: '<x-section layout="column" label="Cross-Surface Event Governance"></x-section>',
    metadata: {
      route: 'governance',
      authoring: templateAuthoring('demo.governance', ['governance.events'], {
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
  }, {
    id: 'demo.nativeFirst',
    mode: 'dom_descriptor',
    markup: '<x-section layout="column" label="Native-First Owned RMT"></x-section>',
    metadata: {
      route: 'nativeFirst',
      authoring: templateAuthoring('demo.nativeFirst', ['nativeFirst.recipes'], {
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
  });
}

function createBestcaseDemoProjection(core) {
  const safeCore = core || {};
  return {
    kind: 'rmt_document',
    version: '2.0-vnext',
    documentId: 'xtendrmt.bestcase.demo',
    namespace: 'xtendrmt.demo',
    manifest: {
      documentId: 'xtendrmt.bestcase.demo',
      namespace: 'xtendrmt.demo',
      contentType: 'application/vnd.xtendrmt.rmt+vnext',
      loaderHint: 'xtendrmt-bestcase-vnext',
      sourceUrl: DEMO_SOURCE_PATH,
      metadata: createProjectedMetadata(safeCore)
    },
    adapters: [
      { id: 'xtend', kind: 'host_adapter' },
      { id: 'xtend.component', kind: 'component_adapter' },
      { id: 'xtend.template', kind: 'component_adapter' },
      { id: 'xtend.xrouter', kind: 'router_adapter' },
      { id: 'rmt.state-scheduler-diagnostics', kind: 'scheduler_adapter' }
    ],
    components: createProjectedComponents(safeCore),
    routes: createProjectedRoutes(safeCore),
    schedules: createProjectedSchedules(),
    templates: createProjectedTemplates()
  };
}

function readBestcaseVNextDemo(rootDir) {
  const source = readText(DEMO_SOURCE_PATH, rootDir);
  const core = readJson(DEMO_CORE_PATH, rootDir);
  return {
    source,
    core,
    projection: createBestcaseDemoProjection(core)
  };
}

module.exports = {
  DEMO_CORE_PATH,
  DEMO_SOURCE_PATH,
  createBestcaseDemoProjection,
  readBestcaseVNextDemo
};
