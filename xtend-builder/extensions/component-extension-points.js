const {
  createComponentPlan
} = require('../generators/component-plan');
const {
  createFeatureWiring
} = require('../wiring/features');
const {
  createHydrationWiring
} = require('../wiring/hydration');
const {
  createComponentTypingContract
} = require('../typing/component-types');
const {
  createComponentPreviewContract
} = require('../preview/component-preview');

const COMPONENT_EXTENSION_POINTS_SCHEMA = 'xtend.scaffold.component-extension-points.v1';
const ROOT_LIFECYCLE_SCHEMA = 'xtend.scaffold.root-lifecycle.v1';
const TEMPLATE_EXTENSION_SCHEMA = 'xtend.scaffold.template-extension.v1';
const RENDERING_EXTENSION_SCHEMA = 'xtend.scaffold.rendering-extension.v1';
const ROOT_HANDSHAKE_CONTRACT_VERSION = 'xtend.rmt.root-handshake.v1';
const HOST_CAPABILITIES_CONTRACT_VERSION = 'xtend.rmt.host-capabilities.v1';
const RMT_COMPATIBILITY_BINDING_SCHEMA = 'xtend.scaffold.rmt-compatibility-binding.v1';

const ROOT_LIFECYCLE_HOOKS = [
  {
    name: 'beforeHydrate',
    phase: 'pre-hydration',
    defaultBehavior: 'no-op',
    required: false
  },
  {
    name: 'afterHydrate',
    phase: 'post-hydration',
    defaultBehavior: 'no-op',
    required: false
  },
  {
    name: 'beforeRender',
    phase: 'pre-render',
    defaultBehavior: 'no-op',
    required: false
  },
  {
    name: 'afterRender',
    phase: 'post-render',
    defaultBehavior: 'no-op',
    required: false
  },
  {
    name: 'onDisconnect',
    phase: 'disconnect-cleanup',
    defaultBehavior: 'no-op',
    required: false
  }
];

function toDomain(tag) {
  return String(tag || '').replace(/^x-/, '');
}

function createComponentExtensionPoints(input = {}, options = {}) {
  const plan = options.plan || createComponentPlan(input, options);
  if (!plan.ok) {
    return {
      schema: COMPONENT_EXTENSION_POINTS_SCHEMA,
      ok: false,
      mode: 'dry-run-extension-contract',
      errors: plan.errors,
      extensionPoints: {}
    };
  }

  const featureWiring = options.featureWiring || createFeatureWiring({
    tag: plan.input.tag,
    name: plan.input.name,
    className: plan.input.className,
    profiles: plan.input.profiles,
    features: plan.input.features
  });
  const hydrationWiring = options.hydrationWiring || createHydrationWiring({
    tag: plan.input.tag,
    className: plan.input.className
  });
  const typingContract = options.typingContract || createComponentTypingContract({}, {
    plan,
    featureWiring
  });
  const previewContract = options.previewContract || createComponentPreviewContract({}, {
    plan,
    hydrationWiring,
    featureWiring,
    typingContract
  });
  const domain = toDomain(plan.input.tag);
  const isRouting = plan.input.profiles.includes('routing');
  const scheduleHint = isRouting ? 'route.visible.render' : 'component.visible.mount';
  const rmtAttachment = typingContract.rmtAttachment || {};
  const templateAuthoring = rmtAttachment.templateAuthoring || {};
  const rootLifecycleAttachment = rmtAttachment.rootLifecycle || {};
  const hostCapabilitiesAttachment = rmtAttachment.hostCapabilities || {};
  const compatibilityBinding = typingContract.rmtCompatibility || {};
  const previewCompatibility = previewContract.rmtCompatibility || {};

  return {
    schema: COMPONENT_EXTENSION_POINTS_SCHEMA,
    ok: true,
    mode: 'dry-run-extension-contract',
    status: 'prepared-extension-points-only',
    component: {
      tag: plan.input.tag,
      name: plan.input.name,
      className: plan.input.className,
      profiles: plan.input.profiles.slice(),
      features: plan.input.features.slice()
    },
    rootLifecycle: {
      schema: ROOT_LIFECYCLE_SCHEMA,
      contractVersion: rootLifecycleAttachment.contractVersion || ROOT_HANDSHAKE_CONTRACT_VERSION,
      rootRef: rootLifecycleAttachment.rootRef || `${domain}.root.<id>`,
      componentRef: rootLifecycleAttachment.componentRef || `${domain}.<id>`,
      templateRef: rootLifecycleAttachment.templateRef || `${domain}.template`,
      host: 'custom-element',
      stateAttribute: hydrationWiring.component.stateAttribute,
      hooks: ROOT_LIFECYCLE_HOOKS.map((hook) => Object.assign({}, hook)),
      phaseSequence: Array.isArray(rootLifecycleAttachment.phaseSequence)
        ? rootLifecycleAttachment.phaseSequence.slice()
        : ['create', 'mount', 'hydrate', 'activate', 'update', 'unmount', 'diagnostics'],
      schedulerEndpointHints: Array.isArray(rootLifecycleAttachment.schedulerEndpointHints)
        ? rootLifecycleAttachment.schedulerEndpointHints.map((hint) => Object.assign({}, hint))
        : [],
      handoff: rootLifecycleAttachment.handoff || {},
      stateKeys: rootLifecycleAttachment.stateKeys || {},
      statePolicy: rootLifecycleAttachment.statePolicy || 'digital-twin-ssot-classic-state',
      sequence: [
        'constructor',
        'connectedCallback',
        'beforeHydrate',
        'hydrate',
        'afterHydrate',
        'beforeRender',
        'render',
        'afterRender',
        'disconnectedCallback',
        'onDisconnect'
      ],
      stateBoundary: 'hooks-may-read-derived-state-but-must-not-create-ssot',
      schedulerBoundary: 'rmt-schedules-host-work-via-endpoint-hints-only',
      cleanupBoundary: 'onDisconnect-cleans-local-subscriptions-only'
    },
    templating: {
      schema: TEMPLATE_EXTENSION_SCHEMA,
      contractVersion: templateAuthoring.contractVersion || 'xtend.rmt.template-authoring.v1',
      adapter: templateAuthoring.adapter || 'xtend.template',
      templateRef: templateAuthoring.templateRef || `${domain}.template`,
      componentRef: templateAuthoring.componentRef || `${domain}.<id>`,
      allowedModes: Array.isArray(templateAuthoring.allowedModes) ? templateAuthoring.allowedModes.slice() : ['html_fragment', 'dom_descriptor'],
      slotBindingMode: templateAuthoring.slotBindingMode || 'named-slot-to-template-ref',
      eventBindingMode: templateAuthoring.eventBindingMode || 'dom-event-to-rmt-command',
      dataBindingMode: templateAuthoring.dataBindingMode || 'explicit-props-attributes-and-slots-only',
      hydrationMode: templateAuthoring.hydrationMode || 'runtime_render',
      ownershipMode: templateAuthoring.ownershipMode || 'managed_subtree',
      authoringBoundary: 'no-template-runtime-in-scaffold',
      kernelBoundary: templateAuthoring.kernelBoundary || 'RMT templates contain XTend references as data; the kernel must not parse XTend component internals.',
      compositionModel: templateAuthoring.compositionModel || {},
      upstreamDslNeeds: Array.isArray(templateAuthoring.upstreamDslNeeds) ? templateAuthoring.upstreamDslNeeds.slice() : [],
      supportedDomains: ['templates', 'data', 'actions'],
      futureEpic: 'development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md'
    },
    rendering: {
      schema: RENDERING_EXTENSION_SCHEMA,
      mode: 'custom-element-render-method',
      renderTarget: 'shadowRoot',
      activation: 'visible-ui-after-hydration',
      scheduleHint,
      schedulerPolicyRef: scheduleHint,
      delegationBoundary: 'render-method-stays-local-until-Epic-04-runtime-decision',
      hostBoundary: 'framework-agnostic-host-adapter-contract'
    },
    schedulerHandshake: {
      contractVersion: rootLifecycleAttachment.contractVersion || ROOT_HANDSHAKE_CONTRACT_VERSION,
      planner: rootLifecycleAttachment.handoff ? rootLifecycleAttachment.handoff.planner : 'rmt-scheduler',
      executor: rootLifecycleAttachment.handoff ? rootLifecycleAttachment.handoff.executor : 'xtend-host-adapter',
      scheduleRef: scheduleHint,
      endpointHints: Array.isArray(rootLifecycleAttachment.schedulerEndpointHints)
        ? rootLifecycleAttachment.schedulerEndpointHints.map((hint) => Object.assign({}, hint))
        : [],
      visibleActivation: 'afterHydrate-afterRender-route-visible-render',
      statePolicy: rootLifecycleAttachment.statePolicy || 'digital-twin-ssot-classic-state',
      diagnosticsRef: rootLifecycleAttachment.stateKeys ? rootLifecycleAttachment.stateKeys.diagnostics : '',
      boundaries: rootLifecycleAttachment.boundaries || {}
    },
    hostCapabilities: {
      contractVersion: hostCapabilitiesAttachment.contractVersion || HOST_CAPABILITIES_CONTRACT_VERSION,
      adapterId: hostCapabilitiesAttachment.adapterId || 'xtend',
      adapterKind: hostCapabilitiesAttachment.adapterKind || 'host_adapter',
      requiredCapabilities: Array.isArray(hostCapabilitiesAttachment.requiredCapabilities)
        ? hostCapabilitiesAttachment.requiredCapabilities.slice()
        : ['manifest', 'customElements', 'stateBridge', 'hydration', 'schedulerEndpoints'],
      optionalCapabilities: Array.isArray(hostCapabilitiesAttachment.optionalCapabilities)
        ? hostCapabilitiesAttachment.optionalCapabilities.slice()
        : ['theme', 'api', 'router', 'diagnostics'],
      capabilities: hostCapabilitiesAttachment.capabilities || {},
      negotiation: hostCapabilitiesAttachment.negotiation || {},
      boundaries: hostCapabilitiesAttachment.boundaries || {},
      kernelBoundary: hostCapabilitiesAttachment.kernelBoundary || 'RMT kernel negotiates capability data only; XTend Host Adapter executes host work.'
    },
    rmtCompatibilityBinding: {
      schema: compatibilityBinding.schema || RMT_COMPATIBILITY_BINDING_SCHEMA,
      status: 'extension-bound-to-rmt-compatibility',
      contractRefs: compatibilityBinding.contractRefs || {},
      adapterRefs: compatibilityBinding.adapterRefs || {},
      artifactBinding: compatibilityBinding.artifactBinding || {},
      dryRunSurfaces: Array.isArray(compatibilityBinding.dryRunSurfaces)
        ? compatibilityBinding.dryRunSurfaces.slice()
        : ['typing', 'manifest-plan', 'preview-plan', 'extension-points', 'component-files'],
      manifestPlanRequirements: compatibilityBinding.manifestPlanRequirements || {},
      previewPlan: {
        schema: previewCompatibility.schema || RMT_COMPATIBILITY_BINDING_SCHEMA,
        previewRef: previewCompatibility.previewRef || '',
        localOnly: previewCompatibility.localOnly === true,
        bridgeBoundary: previewCompatibility.bridgeBoundary || 'reserved-for-Epic-05'
      },
      extensionPlanRequirements: compatibilityBinding.extensionPlanRequirements || {},
      verification: compatibilityBinding.verification || {},
      boundaries: compatibilityBinding.boundaries || {}
    },
    rmtBridge: {
      status: 'bridge-contract-only',
      componentAdapter: rmtAttachment.adapter || 'xtend.component',
      routerAdapter: rmtAttachment.routerAdapter || 'xtend.xrouter',
      routeFields: rmtAttachment.routeAttachment ? rmtAttachment.routeAttachment.routeFields.slice() : [],
      kernelBoundary: rmtAttachment.kernelBoundary || 'RMT kernel must not import XTend component types directly.',
      bridgeEpic: 'development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md'
    },
    integration: {
      sourceStaticGetter: 'xtendScaffoldExtensionPoints',
      manifestKey: 'extensions',
      typingSchema: typingContract.schema,
      previewSchema: previewContract.schema,
      stateSignals: featureWiring.state.keys.slice(),
      eventSignals: featureWiring.events.names.slice()
    },
    boundaries: {
      noRuntimeImports: true,
      noProductiveWrites: true,
      noRmtKernelCoupling: true,
      noRouterRegistration: true,
      noTemplateParsing: true,
      outOfScope: ['rendering-runtime', 'rmt-bridge-runtime', 'route-registration-runtime', 'template-parser-runtime']
    },
    reviewRules: [
      'Extension points must remain metadata and no-op hooks until Epic 04 or Epic 05 implements a runtime.',
      'Root lifecycle hooks may not create a second source of truth beside XTend State or the host runtime.',
      'RMT scheduler handshakes may plan endpoint work but the XTend Host Adapter owns root lifecycle execution.',
      'Host capabilities may be negotiated as adapter data but must not become RMT kernel imports or window.XTend calls.',
      'RMT compatibility bindings must keep typing, manifest, preview and extension dry-runs aligned before productive bridge work.',
      'Template references must stay adapter-based and must not parse .rmt files inside scaffolded components.',
      'Template authoring records may reference XTend components only as adapter data.',
      'Rendering hints may name schedule policies but must not execute RMT scheduler jobs.',
      'XRouter support remains an adapter contract; scaffolded components must not register routes directly.'
    ],
    nextStep: 'WP-E04-08 can expand test and reference gates for RMT-compatible XTend artifacts.'
  };
}

module.exports = {
  COMPONENT_EXTENSION_POINTS_SCHEMA,
  ROOT_LIFECYCLE_SCHEMA,
  TEMPLATE_EXTENSION_SCHEMA,
  RENDERING_EXTENSION_SCHEMA,
  ROOT_HANDSHAKE_CONTRACT_VERSION,
  HOST_CAPABILITIES_CONTRACT_VERSION,
  RMT_COMPATIBILITY_BINDING_SCHEMA,
  ROOT_LIFECYCLE_HOOKS,
  createComponentExtensionPoints
};
