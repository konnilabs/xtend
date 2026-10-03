const {
  createComponentPlan
} = require('../generators/component-plan');
const {
  createFeatureWiring
} = require('../wiring/features');

const COMPONENT_TYPING_SCHEMA = 'xtend.scaffold.component-typing.v1';
const RMT_ATTACHMENT_SCHEMA = 'xtend.scaffold.rmt-attachment.v1';
const RMT_COMPONENT_CONTRACT_VERSION = 'xtend.rmt.component-contract.v1';
const RMT_TEMPLATE_AUTHORING_CONTRACT_VERSION = 'xtend.rmt.template-authoring.v1';
const RMT_ROOT_HANDSHAKE_CONTRACT_VERSION = 'xtend.rmt.root-handshake.v1';
const RMT_HOST_CAPABILITIES_CONTRACT_VERSION = 'xtend.rmt.host-capabilities.v1';
const RMT_COMPATIBILITY_BINDING_SCHEMA = 'xtend.scaffold.rmt-compatibility-binding.v1';

function findArtifact(plan, id) {
  return Array.isArray(plan.artifacts) ? plan.artifacts.find((artifact) => artifact.id === id) : null;
}

function toDomain(tag) {
  return String(tag || '').replace(/^x-/, '');
}

function createAttributeContract() {
  return [
    {
      name: 'variant',
      type: 'string | null',
      setterType: 'string',
      required: false,
      source: 'observedAttributes',
      reflects: true
    }
  ];
}

function createEventContracts(featureWiring, className) {
  const names = featureWiring && featureWiring.events ? featureWiring.events.names : [];
  return names.map((name) => ({
    name,
    typeName: `${className}EventDetail`,
    eventType: `CustomEvent<${className}EventDetail>`,
    bubbles: true,
    composed: true,
    detailShape: {
      id: 'string',
      stateKey: 'string | undefined',
      value: 'unknown',
      source: 'literal component tag'
    }
  }));
}

function createRootLifecycleAttachment(input, featureWiring, refs) {
  const scheduleHint = refs.scheduleHint;
  const statePrefix = featureWiring.state.prefix;

  return {
    contractVersion: RMT_ROOT_HANDSHAKE_CONTRACT_VERSION,
    rootRef: `${refs.domain}.root.<id>`,
    componentRef: refs.componentRef,
    templateRef: refs.templateRef,
    statePolicy: 'digital-twin-ssot-classic-state',
    stateKeys: {
      lifecycle: `${statePrefix}lifecycle`,
      hydration: `${statePrefix}hydration`,
      diagnostics: `${statePrefix}diagnostics`
    },
    phaseSequence: ['create', 'mount', 'hydrate', 'activate', 'update', 'unmount', 'diagnostics'],
    schedulerEndpointHints: [
      {
        phase: 'create',
        schedule: 'component.visible.mount',
        endpointName: 'xtendrmt.root.create',
        lane: 'visible',
        preferIdle: false,
        owner: 'xtend-host-adapter'
      },
      {
        phase: 'mount',
        schedule: 'component.visible.mount',
        endpointName: 'xtendrmt.component.mount',
        lane: 'visible',
        preferIdle: false,
        owner: 'xtend-host-adapter'
      },
      {
        phase: 'hydrate',
        schedule: 'component.idle.hydrate',
        endpointName: 'xtendrmt.component.hydrate',
        lane: 'idle',
        preferIdle: true,
        owner: 'xtend-host-adapter'
      },
      {
        phase: 'activate',
        schedule: scheduleHint,
        endpointName: input.profiles.includes('routing') ? 'xtendrmt.route.render' : 'xtendrmt.component.activate',
        lane: 'visible',
        preferIdle: false,
        owner: 'xtend-host-adapter'
      },
      {
        phase: 'update',
        schedule: scheduleHint,
        endpointName: 'xtendrmt.component.update',
        lane: 'visible',
        preferIdle: false,
        owner: 'xtend-host-adapter'
      },
      {
        phase: 'unmount',
        schedule: 'component.visible.mount',
        endpointName: 'xtendrmt.component.unmount',
        lane: 'visible',
        preferIdle: false,
        owner: 'xtend-host-adapter'
      },
      {
        phase: 'diagnostics',
        schedule: 'diagnostics.snapshot',
        endpointName: 'xtendrmt.diagnostics.snapshot',
        lane: 'diagnostics',
        preferIdle: true,
        owner: 'xtend-host-adapter'
      }
    ],
    handoff: {
      planner: 'rmt-scheduler',
      executor: 'xtend-host-adapter',
      jobContext: ['rootRef', 'componentRef', 'templateRef', 'phase', 'schedule', 'endpointName'],
      completionSignal: 'xtend.rmt.root.lifecycle.completed',
      diagnosticsSignal: 'xtend.rmt.root.lifecycle.diagnostics'
    },
    boundaries: {
      schedulerOwns: ['schedule-selection', 'lane', 'priority', 'budget', 'coalescing'],
      hostAdapterOwns: ['root-resolution', 'custom-element-lifecycle', 'template-materialization', 'state-bridge', 'cleanup', 'diagnostics'],
      forbidden: ['direct-classic-state-mutation-by-kernel', 'custom-element-callbacks-in-kernel', 'async-state-workarounds']
    },
    kernelBoundary: 'RMT scheduler may plan root phases through endpoint hints; XTend Host Adapter owns lifecycle execution.'
  };
}

function createHostCapabilitiesAttachment(input, featureWiring, refs) {
  const statePrefix = featureWiring.state.prefix;
  const apiNamespaces = featureWiring.api.namespaces.slice();

  return {
    contractVersion: RMT_HOST_CAPABILITIES_CONTRACT_VERSION,
    adapterId: 'xtend',
    adapterKind: 'host_adapter',
    status: 'contract-only-no-runtime-adapter',
    requiredCapabilities: ['manifest', 'customElements', 'stateBridge', 'hydration', 'schedulerEndpoints'],
    optionalCapabilities: ['theme', 'api', 'router', 'diagnostics'],
    capabilities: {
      manifest: {
        id: 'xtend.manifest',
        source: 'components/manifest.json',
        lookupBy: ['tag', 'id'],
        loaderCompatibleWith: ['xtend-loader.js', 'api.js', 'customElements.define'],
        localImportOnly: true,
        cdnAllowedByDefault: false,
        kernelVisible: false
      },
      customElements: {
        id: 'xtend.custom-elements',
        kind: 'web-component-host',
        registration: 'customElements.define',
        readiness: ['customElements.get', 'customElements.whenDefined'],
        lifecycleCallbacks: ['connectedCallback', 'attributeChangedCallback', 'disconnectedCallback'],
        kernelVisible: false
      },
      stateBridge: {
        id: 'xtend.state-projection.classic',
        source: 'xtend-state',
        read: 'xtendState.get(key)',
        write: 'xtendState.set(key, value)',
        subscribe: 'xtendState.subscribe(fn, keyFilter?)',
        canonicalPrefix: statePrefix,
        stateKeys: featureWiring.state.keys.slice(),
        localUiPolicy: featureWiring.state.localUiPolicy,
        forbidden: ['direct-classic-state-mutation-by-kernel', 'xtendState.on', 'xtendState.off'],
        kernelVisible: false
      },
      hydration: {
        id: 'xtend.hydration',
        mode: 'custom-element',
        ownershipMode: 'managed_subtree',
        stateAttribute: 'data-xtend-hydrated',
        minimumMethods: ['hydrate', 'render'],
        lifecycleCallbacks: ['connectedCallback', 'attributeChangedCallback', 'disconnectedCallback'],
        schedulerEndpoint: 'xtendrmt.component.hydrate',
        kernelVisible: false
      },
      schedulerEndpoints: {
        id: 'xtend.scheduler-endpoints',
        owner: 'xtend-host-adapter',
        endpoints: ['xtendrmt.root.create', 'xtendrmt.component.mount', 'xtendrmt.component.hydrate', 'xtendrmt.component.update', 'xtendrmt.component.unmount', 'xtendrmt.route.render', 'xtendrmt.diagnostics.snapshot'],
        endpointHintsOnly: true,
        kernelVisible: false
      },
      theme: {
        id: 'xtend.theme',
        optional: true,
        namespace: 'window.XTend.theme',
        legacyFacade: 'window.XTheme',
        stateKeys: ['xtend.theme.current', 'xtend.theme.available'],
        cssCustomProperties: true,
        kernelVisible: false
      },
      api: {
        id: 'xtend.api',
        optional: true,
        namespaceRoot: 'window.XTend',
        namespaces: apiNamespaces,
        complianceNamespace: 'window.XTend.compliance',
        forbiddenGlobals: ['unnamespaced-show-helper-pattern'],
        kernelVisible: false
      },
      router: {
        id: 'xtend.xrouter',
        optional: true,
        enabledByProfile: input.profiles.includes('routing'),
        routeRecordAdapter: 'xtend.xrouter',
        routeFields: ['id', 'path', 'title', 'component', 'template', 'schedule', 'metadata'],
        stateKeys: ['xtend.router.lastNavigated', 'xtend.router.current', 'xtend.router.lastRendered'],
        productiveBridge: 'reserved-for-Epic-05',
        kernelVisible: false
      },
      diagnostics: {
        id: 'xtend.diagnostics',
        optional: true,
        stateSnapshotKey: `${statePrefix}diagnostics`,
        eventNamespace: `xtend.rmt.host.${refs.domain}`,
        reportToRmt: true,
        errorBoundary: 'host-adapter-reports-errors-without-changing-ui-truth',
        kernelVisible: false
      }
    },
    negotiation: {
      documentMayRequire: ['manifest', 'customElements', 'stateBridge', 'hydration'],
      documentMayPrefer: ['theme', 'api', 'router', 'diagnostics'],
      missingRequiredCapability: 'diagnostic-fail-fast-before-mount',
      missingOptionalCapability: 'degrade-or-skip-with-diagnostics',
      capabilityRecordBoundary: 'RMT documents may reference capability IDs and versions only.'
    },
    boundaries: {
      kernelSees: ['adapterId', 'contractVersion', 'requiredCapabilities', 'optionalCapabilities', 'capabilityRefs'],
      hostAdapterOwns: ['manifest-lookup', 'custom-element-registration', 'classic-state-read-write-subscribe', 'theme-api', 'xtend-api', 'hydration', 'router-adapter', 'diagnostics'],
      forbidden: ['kernel-imports-api-js', 'kernel-imports-classic-state', 'kernel-imports-xrouter', 'kernel-calls-window-XTend', 'capability-as-second-ssot']
    },
    kernelBoundary: 'RMT kernel negotiates capability data only; XTend Host Adapter executes manifest, state, theme, API, hydration, router and diagnostics work.'
  };
}

function createRmtCompatibilityBinding(plan, featureWiring, rmtAttachment) {
  const input = plan.input;
  const typesArtifact = findArtifact(plan, 'types');
  const manifestArtifact = findArtifact(plan, 'manifest');
  const demoArtifact = findArtifact(plan, 'demo');

  return {
    schema: RMT_COMPATIBILITY_BINDING_SCHEMA,
    status: 'dry-run-contract-binding',
    component: {
      tag: input.tag,
      className: input.className,
      profiles: input.profiles.slice(),
      features: input.features.slice()
    },
    artifactBinding: {
      typing: typesArtifact ? typesArtifact.targetPath : `components/${input.tag}.d.ts`,
      manifest: manifestArtifact ? manifestArtifact.targetPath : 'components/manifest.json',
      preview: demoArtifact ? demoArtifact.targetPath : `docs/previews/${input.name}.preview.md`,
      extensions: 'static-getter:xtendScaffoldExtensionPoints'
    },
    contractRefs: {
      component: rmtAttachment.contractVersion,
      templateAuthoring: rmtAttachment.templateAuthoring.contractVersion,
      rootHandshake: rmtAttachment.rootLifecycle.contractVersion,
      hostCapabilities: rmtAttachment.hostCapabilities.contractVersion
    },
    adapterRefs: {
      component: rmtAttachment.adapter,
      template: rmtAttachment.templateAdapter,
      router: rmtAttachment.routerAdapter,
      host: rmtAttachment.hostCapabilities.adapterId
    },
    dryRunSurfaces: ['typing', 'manifest-plan', 'preview-plan', 'extension-points', 'component-files'],
    manifestPlanRequirements: {
      includeRmtAttachment: true,
      includeHostCapabilities: true,
      includeSchedulerHandshake: true,
      includePreviewReference: true,
      localImportOnly: true,
      cdnAllowed: false
    },
    previewPlanRequirements: {
      includeRmtAttachment: true,
      includeCompatibilityBinding: true,
      referenceRegistry: 'development/XTend-Dokumentations-und-Demo-Referenzpfade.md',
      externalNetworkAllowed: false
    },
    extensionPlanRequirements: {
      includeTemplateAuthoring: true,
      includeSchedulerHandshake: true,
      includeHostCapabilities: true,
      noRuntimeImports: true,
      noProductiveWrites: true
    },
    stateAndSignalRefs: {
      stateKeys: featureWiring.state.keys.slice(),
      events: featureWiring.events.names.slice(),
      apiNamespaces: featureWiring.api.namespaces.slice()
    },
    verification: {
      minimumGate: 'node scripts/run_xtend_tests.js rmt-compatibility --json',
      fullGate: 'npm test',
      requiredSuites: ['rmt-compatibility', 'references'],
      handoffSuites: ['components', 'a11y-hydration', 'references', 'rmt-compatibility']
    },
    boundaries: {
      typesOnly: true,
      noRuntimeImports: true,
      noProductiveWrites: true,
      noRmtKernelCoupling: true,
      noRouterRegistration: true,
      noTemplateParsing: true,
      bridgeRuntime: 'reserved-for-Epic-05'
    },
    nextStep: 'WP-E04-08 can expand test and reference gates for RMT-compatible XTend artifacts.'
  };
}

function createRmtAttachment(plan, featureWiring) {
  const input = plan.input;
  const domain = toDomain(input.tag);
  const componentRef = `${domain}.<id>`;
  const templateRef = `${domain}.template`;
  const scheduleHint = input.profiles.includes('routing')
    ? 'route.visible.render'
    : 'component.visible.mount';
  const statePrefix = featureWiring.state.prefix;
  const rootLifecycle = createRootLifecycleAttachment(input, featureWiring, {
    domain,
    componentRef,
    templateRef,
    scheduleHint
  });
  const hostCapabilities = createHostCapabilitiesAttachment(input, featureWiring, {
    domain
  });

  return {
    schema: RMT_ATTACHMENT_SCHEMA,
    status: 'prepared-contract-only',
    adapter: 'xtend.component',
    routerAdapter: 'xtend.xrouter',
    templateAdapter: 'xtend.template',
    contractVersion: RMT_COMPONENT_CONTRACT_VERSION,
    kernelBoundary: 'RMT kernel must not import XTend component types, XTend manifest records, XTend State keys or XRouter classes directly.',
    componentDefinition: {
      idPattern: componentRef,
      kind: 'custom_element',
      adapter: 'xtend.component',
      tag: input.tag,
      manifestLookup: {
        source: 'xtend.manifest',
        lookupBy: ['tag', 'id'],
        localImportOnly: true,
        kernelVisible: false
      },
      props: 'Record<string, unknown>',
      attributes: 'Record<string, string | boolean | number | null>',
      slots: 'Record<string, RmtTemplateRef>',
      events: 'Record<string, RmtCommandRef>',
      hydration: {
        mode: 'custom-element',
        ownershipMode: 'managed_subtree',
        stateAttribute: 'data-xtend-hydrated',
        lifecycle: ['connectedCallback', 'hydrate', 'attributeChangedCallback', 'disconnectedCallback']
      },
      schedule: scheduleHint,
      diagnostics: {
        eventNamespace: `xtend.rmt.component.${domain}`,
        stateSnapshotKey: `${statePrefix}diagnostics`,
        reportToRmt: true
      }
    },
    templateAuthoring: {
      contractVersion: RMT_TEMPLATE_AUTHORING_CONTRACT_VERSION,
      adapter: 'xtend.template',
      templateRef,
      componentRef,
      allowedModes: ['html_fragment', 'dom_descriptor'],
      slotBindingMode: 'named-slot-to-template-ref',
      eventBindingMode: 'dom-event-to-rmt-command',
      dataBindingMode: 'explicit-props-attributes-and-slots-only',
      hydrationMode: 'runtime_render',
      ownershipMode: 'managed_subtree',
      compositionModel: {
        root: 'RmtTemplateRootRef | RmtComponentRef | RmtDomFragment',
        componentRefs: 'Record<string, RmtComponentRef>',
        props: 'Record<string, unknown>',
        attributes: 'Record<string, string | boolean | number | null>',
        slots: 'Record<string, RmtTemplateRef | RmtTextRef | RmtComponentRef>',
        events: 'Record<string, RmtCommandRef | RmtRootEventRef>'
      },
      authoringRules: [
        'Templates reference XTend components by componentRef and adapter data only.',
        'Slots bind by name to template, text or component refs.',
        'Events bind DOM Custom Events to RMT commands or root events.',
        'Template records may carry XTend tags as data but must not require kernel imports.',
        'The XTend Host Adapter materializes DOM fragments and Custom Elements.'
      ],
      upstreamDslNeeds: [
        'native top-level components domain',
        'component_ref node shorthand',
        'named slot children syntax',
        'event command shorthand',
        'authoring diagnostics'
      ],
      kernelBoundary: 'RMT templates contain XTend references as data; the kernel must not parse XTend component internals.'
    },
    rootLifecycle,
    hostCapabilities,
    routeAttachment: {
      domain: 'routes',
      adapter: 'xtend.xrouter',
      routeFields: ['id', 'path', 'title', 'component', 'template', 'schedule', 'metadata'],
      componentRef,
      templateRef,
      scheduleRef: scheduleHint
    },
    dslDomains: ['adapters', 'components', 'routes', 'templates', 'schedules', 'actions', 'data'],
    sourceEpics: [
      'development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md',
      'development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md'
    ],
    featureSignals: {
      stateKeys: featureWiring.state.keys.slice(),
      events: featureWiring.events.names.slice(),
      apiNamespaces: featureWiring.api.namespaces.slice()
    },
    boundaries: {
      kernelForbidden: ['xtend-tags', 'xtend-manifest-shape', 'classic-state-keys', 'xrouter-classes'],
      dslRecordOwns: ['id', 'kind', 'adapter', 'tag', 'props', 'attributes', 'slots', 'events', 'hydration', 'schedule', 'diagnostics', 'templateRef', 'componentRef', 'rootRef', 'lifecyclePhase'],
      hostAdapterOwns: ['manifest-lookup', 'custom-element-definition-check', 'mount', 'hydrate', 'template-materialization', 'slot-projection', 'event-command-binding', 'event-bridge', 'state-bridge', 'theme-api', 'api-facade', 'root-lifecycle-execution', 'capability-negotiation', 'cleanup', 'diagnostics']
    }
  };
}

function createComponentTypingContract(input = {}, options = {}) {
  const plan = options.plan || createComponentPlan(input, options);
  if (!plan.ok) {
    return {
      schema: COMPONENT_TYPING_SCHEMA,
      ok: false,
      mode: 'dry-run-type-contract',
      errors: plan.errors,
      declarations: {},
      exceptions: []
    };
  }

  const featureWiring = options.featureWiring || createFeatureWiring({
    tag: plan.input.tag,
    name: plan.input.name,
    className: plan.input.className,
    profiles: plan.input.profiles,
    features: plan.input.features
  });
  const typesArtifact = findArtifact(plan, 'types');
  const attributes = createAttributeContract();
  const properties = [];
  const events = createEventContracts(featureWiring, plan.input.className);
  const rmtAttachment = createRmtAttachment(plan, featureWiring);
  const rmtCompatibility = createRmtCompatibilityBinding(plan, featureWiring, rmtAttachment);

  return {
    schema: COMPONENT_TYPING_SCHEMA,
    ok: true,
    mode: 'dry-run-type-contract',
    runtimeBoundary: 'types-only-no-runtime-imports',
    artifact: {
      id: 'types',
      targetPath: typesArtifact ? typesArtifact.targetPath : `components/${plan.input.tag}.d.ts`,
      action: 'plan-create',
      required: true
    },
    component: {
      tag: plan.input.tag,
      name: plan.input.name,
      className: plan.input.className,
      profiles: plan.input.profiles.slice(),
      features: plan.input.features.slice()
    },
    declarations: {
      eventNameType: `${plan.input.className}EventName`,
      eventDetailInterface: `${plan.input.className}EventDetail`,
      attributeNameType: `${plan.input.className}AttributeName`,
      attributeMapInterface: `${plan.input.className}AttributeMap`,
      propertyNameType: `${plan.input.className}PropertyName`,
      propertyMapInterface: `${plan.input.className}PropertyMap`,
      scaffoldWiringInterface: `${plan.input.className}ScaffoldWiring`,
      rmtComponentAttachmentInterface: `${plan.input.className}RmtComponentAttachment`,
      rmtTemplateAttachmentInterface: `${plan.input.className}RmtTemplateAttachment`,
      rmtRootAttachmentInterface: `${plan.input.className}RmtRootAttachment`,
      rmtHostCapabilitiesInterface: `${plan.input.className}RmtHostCapabilities`,
      rmtCompatibilityBindingInterface: `${plan.input.className}RmtCompatibilityBinding`,
      rmtRouteAttachmentInterface: `${plan.input.className}RmtRouteAttachment`,
      elementInterface: `${plan.input.className}Element`,
      constructorInterface: `${plan.input.className}Constructor`
    },
    attributes,
    properties,
    events,
    state: {
      prefix: featureWiring.state.prefix,
      keys: featureWiring.state.keys.slice(),
      localUiPolicy: featureWiring.state.localUiPolicy
    },
    rmtAttachment,
    rmtCompatibility,
    exceptionPolicy: {
      allowed: 'documented-type-exception-required',
      forbidden: ['undocumented-type-gap', 'implicit-any-public-api', 'runtime-import-from-d.ts']
    },
    reviewRules: [
      'Public attributes must be represented in the attribute map.',
      'Public Custom Events must expose an event-name union and event-detail interface.',
      'Generated declarations must not import runtime modules.',
      'RMT attachment types may reference adapter contracts but must not implement the XTendRMT bridge.',
      'Host capability contracts must describe XTend APIs as optional adapter data, never as RMT kernel dependencies.',
      'RMT compatibility bindings must connect typing, manifest, preview and extension dry-runs before runtime work.',
      'Typeless components require a documented exception in the component worklog or docs.'
    ],
    nextStep: 'WP-E04-08 can expand test and reference gates for RMT-compatible XTend artifacts.'
  };
}

module.exports = {
  COMPONENT_TYPING_SCHEMA,
  RMT_ATTACHMENT_SCHEMA,
  RMT_COMPONENT_CONTRACT_VERSION,
  RMT_TEMPLATE_AUTHORING_CONTRACT_VERSION,
  RMT_ROOT_HANDSHAKE_CONTRACT_VERSION,
  RMT_HOST_CAPABILITIES_CONTRACT_VERSION,
  RMT_COMPATIBILITY_BINDING_SCHEMA,
  createComponentTypingContract
};
