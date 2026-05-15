const {
  readJson,
  readText
} = require('./files');

const DEMO_SOURCE_PATH = 'xtendrmt/xtendrmt-bestcase-demo.rmt';
const DEMO_CORE_PATH = 'xtendrmt/xtendrmt-bestcase-demo.core.json';
const MINIMUM_GATE = 'node scripts/run_xtend_tests.js rmt-compatibility --json';
const ROUTE_COMPONENTS = Object.freeze({
  kernel: 'x-rmt-route-overview',
  scheduler: 'x-rmt-route-scheduler',
  routing: 'x-rmt-route-routing',
  templating: 'x-rmt-route-template-pilot',
  adapter: 'x-rmt-route-adapter'
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
      adaptersSource: 'runtimeProjection.adapters',
      schedulesSource: 'vnext.lanes',
      productiveAdapters: [
        'createRmtXRouterAdapter',
        'createRmtXtendComponentAdapter',
        'createRmtStateSchedulerDiagnosticsBridge'
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
    ['adapter', '/adapter', 'XTend Product Adapter', 'demo.adapter', 'component.idle.hydrate']
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
      schedule: routeId === 'adapter' ? 'component.idle.hydrate' : 'component.visible.mount',
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
    { id: 'pilot.shell', adapter: 'xtend.component', kind: 'custom_element', tag: 'x-section', schedule: 'component.visible.mount' }
  ]);
}

function createProjectedSchedules() {
  return [
    { id: 'template.visible.inspect', endpointName: 'xtendrmt.template.inspect', scope: 'xtendrmt.template.pilot', lane: 'visible', priority: 70 },
    { id: 'route.visible.render', endpointName: 'xtendrmt.route.render', scope: 'xtendrmt.router.current', lane: 'visible', priority: 88 },
    { id: 'component.visible.mount', endpointName: 'xtendrmt.component.mount', scope: 'xtendrmt.component.visible', lane: 'visible', priority: 76 },
    { id: 'component.idle.hydrate', endpointName: 'xtendrmt.component.hydrate', scope: 'xtendrmt.component.idle', lane: 'idle', priority: 42 },
    { id: 'diagnostics.snapshot', endpointName: 'xtendrmt.diagnostics.snapshot', scope: 'xtendrmt.diagnostics', lane: 'diagnostics', priority: 34 }
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
