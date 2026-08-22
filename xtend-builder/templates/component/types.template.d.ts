export type {{className}}EventName = {{featureEventTypeUnion}};
export type {{className}}AttributeName = {{typeAttributeNameUnion}};
export type {{className}}PropertyName = {{typePropertyNameUnion}};
export type {{className}}RootLifecycleHookName = {{extensionRootLifecycleHooksUnion}};
export type {{className}}RootLifecyclePhase = {{typeRmtRootPhasesUnion}};
export type {{className}}HostCapabilityName = {{typeRmtHostCapabilityNameUnion}};
export type {{className}}RmtCompatibilitySurface = 'typing' | 'manifest-plan' | 'preview-plan' | 'extension-points' | 'component-files';
export type {{className}}A11yKeyboardKey = {{a11yKeyboardTypeUnion}};
export type {{className}}A11yAriaState = {{a11yAriaStateTypeUnion}};
export type {{className}}ScreenreaderSignalName = {{a11yScreenreaderSignalTypeUnion}};
export type {{className}}ScreenreaderLiveRegion = 'none' | 'polite' | 'assertive';
export type {{className}}MotionMediaQuery = '{{a11yMotionMediaQuery}}';
export type {{className}}ContrastMediaQuery = '{{a11yContrastMediaQuery}}';
export type {{className}}PublicTypesSchema = 'xtend.enterprise.er-wp-34.public-component-types.v1';

export interface {{className}}EventDetail {
  id: string;
  stateKey?: string;
  value?: unknown;
  source: '{{tag}}';
}

export interface {{className}}PublicEventContract {
  schema: {{className}}PublicTypesSchema;
  name: {{className}}EventName;
  eventType: CustomEvent<{{className}}EventDetail>;
  bubbles: true;
  composed: true;
  source: '{{tag}}';
}

export interface {{className}}AttributeMap {
{{typeAttributeMapFields}}
}

export interface {{className}}PropertyMap {
{{typePropertyMapFields}}
}

export interface {{className}}ScreenreaderSignalRecord {
  schema: '{{a11yScreenreaderSignalRecordSchema}}';
  contract: '{{a11yScreenreaderContractSchema}}';
  componentRef: '{{tag}}';
  signal: {{className}}ScreenreaderSignalName | string;
  kind: string;
  region: 'semantic' | 'status' | 'error' | 'dialog' | 'focus' | string;
  role: string | null;
  liveRegion: {{className}}ScreenreaderLiveRegion;
  politeness: 'off' | 'polite' | 'assertive' | string;
  required: boolean;
}

export interface {{className}}ScreenreaderSignalContract {
  schema: '{{a11yScreenreaderContractSchema}}';
  componentRef: '{{tag}}';
  liveRegion: {{className}}ScreenreaderLiveRegion;
  signals: {{className}}ScreenreaderSignalRecord[];
  statusRegions: Array<{ id: string; sourceSignal: string; role: string; ariaLive: {{className}}ScreenreaderLiveRegion; required: boolean }>;
  errorRegions: Array<{ id: string; sourceSignal: string; role: string; ariaLive: {{className}}ScreenreaderLiveRegion; required: boolean }>;
  fabric: {
    lane: '{{a11yScreenreaderFabricLane}}';
    fiberKind: '{{a11yScreenreaderFabricFiberKind}}';
    scheduleRef: '{{a11yScreenreaderFabricScheduleRef}}';
    scheduleContract: string;
  };
  requiredAssertions: string[];
}

export interface {{className}}MotionContrastPolicy {
  schema: '{{a11yMotionContrastContractSchema}}';
  componentRef: '{{tag}}';
  primaryProfile: '{{a11yPrimaryProfile}}';
  motion: {
    schema: '{{a11yMotionContractSchema}}';
    reducedMotion: '{{a11yMotionReducedMotion}}';
    mediaQuery: {{className}}MotionMediaQuery;
    animationPolicy: '{{a11yMotionAnimationPolicy}}' | string;
    disableAnimations: boolean;
    disableTransitions: boolean;
    noMotionOnlyState: boolean;
    allowedAnimatedProperties: string[];
    requiredCss: string[];
  };
  contrast: {
    schema: '{{a11yContrastContractSchema}}';
    highContrast: '{{a11yContrastHighContrast}}';
    mediaQuery: {{className}}ContrastMediaQuery;
    contrastPolicy: '{{a11yContrastPolicy}}' | string;
    forcedColorAdjust: '{{a11yContrastForcedColorAdjust}}' | string;
    focusVisible: '{{a11yContrastFocusVisible}}';
    nonColorStatus: '{{a11yContrastNonColorStatus}}';
    tokenAware: boolean;
    systemColorTokens: Record<string, string>;
    requiredCss: string[];
  };
  fabric: {
    lane: '{{a11yMotionContrastFabricLane}}';
    fiberKind: '{{a11yMotionContrastFabricFiberKind}}';
    scheduleRef: '{{a11yMotionContrastFabricScheduleRef}}';
    scheduleContract: string;
  };
}

export interface {{className}}A11yProfile {
  schema: '{{a11yProfileSchema}}';
  planSchema: '{{a11yPlanSchema}}';
  componentContract: '{{a11yComponentContractSchema}}';
  testContract: '{{a11yTestContractSchema}}';
  status: 'scaffold-a11y-required';
  componentRef: '{{tag}}';
  primaryProfile: '{{a11yPrimaryProfile}}';
  role: '{{a11yRole}}';
  accessibleName: {
    source: '{{a11yAccessibleNameSource}}';
    required: boolean;
    defaultText: '{{a11yAccessibleNameDefault}}' | string;
    fallbackAttribute: 'aria-label';
  };
  focusStrategy: {
    mode: '{{a11yFocusMode}}';
    initial: '{{a11yFocusInitial}}';
    trap: boolean;
    restore: boolean;
    focusVisible: '{{a11yFocusVisible}}';
  };
  keyboard: {{className}}A11yKeyboardKey[];
  ariaStates: {{className}}A11yAriaState[];
  screenreader: {
    contract: '{{a11yScreenreaderContractSchema}}';
    signalRecordContract: '{{a11yScreenreaderSignalRecordSchema}}';
    liveRegion: '{{a11yScreenreaderLiveRegion}}';
    signals: {{className}}ScreenreaderSignalName[];
    signalContract: {{className}}ScreenreaderSignalContract;
    statusRegions: {{className}}ScreenreaderSignalContract['statusRegions'];
    errorRegions: {{className}}ScreenreaderSignalContract['errorRegions'];
    announcementRequired: boolean;
  };
  motion: {
    contract: '{{a11yMotionContractSchema}}';
    reducedMotion: '{{a11yMotionReducedMotion}}';
    mediaQuery: {{className}}MotionMediaQuery;
    animationPolicy: '{{a11yMotionAnimationPolicy}}' | string;
    noMotionOnlyState: boolean;
    requiredCss: string[];
  };
  contrast: {
    contract: '{{a11yContrastContractSchema}}';
    highContrast: '{{a11yContrastHighContrast}}';
    mediaQuery: {{className}}ContrastMediaQuery;
    contrastPolicy: '{{a11yContrastPolicy}}' | string;
    forcedColorAdjust: '{{a11yContrastForcedColorAdjust}}' | string;
    focusVisible: '{{a11yContrastFocusVisible}}';
    nonColorStatus: '{{a11yContrastNonColorStatus}}';
    tokenAware: boolean;
    systemColorTokens: Record<string, string>;
    requiredCss: string[];
  };
  motionContrast: {
    contract: '{{a11yMotionContrastContractSchema}}';
    testContract: '{{a11yMotionContrastTestContractSchema}}';
    policy: {{className}}MotionContrastPolicy;
  };
  testRefs: Array<'components' | 'a11y-hydration' | 'screenreader-signals' | 'motion-contrast' | 'references'>;
  reviewRules: string[];
}

export interface {{className}}PerformanceProfile {
  schema: '{{performanceProfileSchema}}';
  policySchema: '{{performancePolicySchema}}';
  budgetMatrix: '{{performanceBudgetMatrixSchema}}';
  measurementContract: '{{performanceMeasurementContract}}';
  regressionGate: '{{performanceRegressionGate}}';
  hydrationPolicyContract: '{{performanceHydrationPolicyContract}}';
  status: 'scaffold-performance-required';
  componentRef: '{{tag}}';
  primaryProfile: '{{performancePrimaryProfile}}';
  budgetClass: '{{performanceBudgetClass}}';
  lane: '{{performanceLane}}';
  hydrationPolicy: '{{performanceHydrationPolicy}}';
  criticalMeasurements: string[];
  idleOrBackgroundAllowed: boolean;
  requiresA11yFiber: boolean;
  reviewRules: string[];
}

export interface {{className}}ScaffoldWiring {
  schema: '{{featureWiringSchema}}';
  statePrefix: '{{featureStatePrefix}}';
  stateKeys: string[];
  events: {{className}}EventName[];
  apiNamespaces: string[];
  localUiPolicy: '{{featureLocalUiPolicy}}';
}

export interface {{className}}RootLifecycleExtension {
  schema: '{{extensionRootLifecycleSchema}}';
  contractVersion?: '{{typeRmtRootHandshakeContractVersion}}';
  rootRef?: '{{typeRmtRootRef}}' | string;
  hooks: Array<{
    name: {{className}}RootLifecycleHookName;
    phase: string;
    defaultBehavior: 'no-op';
    required: false;
  }>;
  phaseSequence?: {{className}}RootLifecyclePhase[];
  schedulerEndpointHints?: Array<{
    phase: {{className}}RootLifecyclePhase;
    schedule: string;
    endpointName: string;
    lane: string;
    preferIdle: boolean;
  }>;
  stateBoundary: string;
  schedulerBoundary: string;
  cleanupBoundary: string;
}

export interface {{className}}TemplateExtension {
  schema: '{{extensionTemplateSchema}}';
  adapter: '{{extensionTemplateAdapter}}';
  templateRef: '{{extensionTemplateRef}}';
  authoringBoundary: '{{extensionTemplateBoundary}}';
}

export interface {{className}}RenderingExtension {
  schema: '{{extensionRenderingSchema}}';
  mode: '{{extensionRenderingMode}}';
  renderTarget: '{{extensionRenderTarget}}';
  scheduleHint: '{{extensionScheduleHint}}' | string;
}

export interface {{className}}ExtensionPoints {
  schema: '{{extensionContractSchema}}';
  status: '{{extensionStatus}}';
  rootLifecycle: {{className}}RootLifecycleExtension;
  templating: {{className}}TemplateExtension;
  rendering: {{className}}RenderingExtension;
  hostCapabilities: {{className}}RmtHostCapabilities;
  rmtCompatibilityBinding: {{className}}RmtCompatibilityBinding;
  rmtBridge: {
    componentAdapter: '{{extensionRmtComponentAdapter}}';
    routerAdapter: '{{extensionRmtRouterAdapter}}';
    kernelBoundary: string;
  };
}

export interface {{className}}RmtComponentAttachment {
  schema: '{{typeRmtAttachmentSchema}}';
  adapter: '{{typeRmtAdapter}}';
  contractVersion?: '{{typeRmtComponentContractVersion}}';
  kind: 'custom_element';
  tag: '{{tag}}';
  manifestLookup?: {
    source: 'xtend.manifest';
    lookupBy: Array<'tag' | 'id'>;
    localImportOnly: true;
    kernelVisible: false;
  };
  props?: Partial<{{className}}AttributeMap> & Partial<{{className}}PropertyMap> & Record<string, unknown>;
  attributes?: Partial<{{className}}AttributeMap>;
  slots?: Record<string, string | { template: string }>;
  events?: Partial<Record<{{className}}EventName, string | { commandName: string }>>;
  hydration?: {
    mode: 'custom-element';
    ownershipMode: 'managed_subtree';
    stateAttribute: '{{hydrationStateAttribute}}';
    lifecycle: Array<'connectedCallback' | 'hydrate' | 'attributeChangedCallback' | 'disconnectedCallback'>;
  };
  schedule?: '{{typeRmtComponentSchedule}}' | string;
  diagnostics?: {
    eventNamespace: string;
    stateSnapshotKey: string;
    reportToRmt: boolean;
  };
}

export interface {{className}}RmtTemplateAttachment {
  schema: '{{typeRmtAttachmentSchema}}';
  adapter: '{{typeRmtTemplateAdapter}}';
  contractVersion?: '{{typeRmtTemplateAuthoringContractVersion}}';
  templateRef: '{{typeRmtTemplateRef}}' | string;
  componentRef?: '{{typeRmtTemplateComponentRef}}' | string;
  allowedModes?: Array<{{typeRmtTemplateAllowedModesUnion}}>;
  props?: Record<string, unknown>;
  attributes?: Partial<{{className}}AttributeMap>;
  slots?: Record<string, string | { template: string } | { component: string }>;
  events?: Partial<Record<{{className}}EventName, string | { commandName: string } | { rootEventName: string }>>;
  hydration?: {
    mode: 'runtime_render';
    ownershipMode: 'managed_subtree';
  };
  kernelBoundary?: string;
}

export interface {{className}}RmtRootAttachment {
  schema: '{{typeRmtAttachmentSchema}}';
  contractVersion?: '{{typeRmtRootHandshakeContractVersion}}';
  rootRef: '{{typeRmtRootRef}}' | string;
  componentRef?: '{{typeRmtTemplateComponentRef}}' | string;
  templateRef?: '{{typeRmtTemplateRef}}' | string;
  lifecyclePhases?: {{className}}RootLifecyclePhase[];
  schedulerEndpointHints?: Array<{
    phase: {{className}}RootLifecyclePhase;
    schedule: string;
    endpointName: string;
    lane: string;
    preferIdle: boolean;
  }>;
  statePolicy?: 'digital-twin-ssot-classic-state';
  kernelBoundary?: string;
}

export interface {{className}}RmtHostCapabilities {
  schema: '{{typeRmtAttachmentSchema}}';
  contractVersion?: '{{typeRmtHostCapabilitiesContractVersion}}';
  adapterId: 'xtend';
  adapterKind: 'host_adapter';
  requiredCapabilities: {{className}}HostCapabilityName[];
  optionalCapabilities?: {{className}}HostCapabilityName[];
  capabilities?: Partial<Record<{{className}}HostCapabilityName, {
    id: string;
    optional?: boolean;
    kernelVisible: false;
  }>>;
  manifest?: {
    source: '{{typeRmtHostManifestSource}}' | string;
    lookupBy: Array<'tag' | 'id'>;
    localImportOnly: true;
  };
  stateBridge?: {
    source: 'xtend-state';
    subscribe: '{{typeRmtHostStateBridge}}';
    forbidden: Array<'direct-classic-state-mutation-by-kernel' | 'xtendState.on' | 'xtendState.off'>;
  };
  hydration?: {
    mode: 'custom-element';
    stateAttribute: '{{hydrationStateAttribute}}';
    minimumMethods: Array<'hydrate' | 'render'>;
  };
  api?: {
    namespaceRoot: '{{typeRmtHostApiNamespaceRoot}}';
    forbiddenGlobals: string[];
  };
  kernelBoundary?: string;
}

export interface {{className}}RmtCompatibilityBinding {
  schema: '{{rmtCompatibilitySchema}}';
  status: 'dry-run-contract-binding' | 'preview-bound-to-rmt-compatibility' | 'extension-bound-to-rmt-compatibility';
  artifactBinding: {
    typing: string;
    manifest: string;
    preview: string;
    extensions: string;
  };
  contractRefs: {
    component: '{{typeRmtComponentContractVersion}}';
    templateAuthoring: '{{typeRmtTemplateAuthoringContractVersion}}';
    rootHandshake: '{{typeRmtRootHandshakeContractVersion}}';
    hostCapabilities: '{{typeRmtHostCapabilitiesContractVersion}}';
  };
  dryRunSurfaces: {{className}}RmtCompatibilitySurface[];
  manifestPlanRequirements: {
    includeRmtAttachment: true;
    includeHostCapabilities: true;
    includeSchedulerHandshake: true;
    includePreviewReference: true;
    localImportOnly: true;
    cdnAllowed: false;
  };
  previewPlanRequirements: {
    includeRmtAttachment: true;
    includeCompatibilityBinding: true;
    externalNetworkAllowed: false;
  };
  boundaries: {
    typesOnly: true;
    noRuntimeImports: true;
    noProductiveWrites: true;
    noRmtKernelCoupling: true;
    noRouterRegistration: true;
    noTemplateParsing: true;
    bridgeRuntime: 'reserved-for-Epic-05';
  };
}

export interface {{className}}RmtRouteAttachment {
  schema: '{{typeRmtAttachmentSchema}}';
  adapter: '{{typeRmtRouterAdapter}}';
  fields: Array<{{typeRmtRouteFieldsUnion}}>;
  component?: string;
  template?: string;
  schedule?: string;
}

export interface {{className}}Element extends HTMLElement {
  getAttribute(name: 'variant'): string | null;
  getAttribute(name: 'aria-label'): string | null;
  setAttribute(name: 'variant', value: string): void;
  setAttribute(name: 'aria-label', value: string): void;
  beforeHydrate(): void;
  afterHydrate(): void;
  beforeRender(): void;
  afterRender(): void;
  onDisconnect(): void;
{{typeEventOverloads}}
}

export interface {{className}}Constructor {
  new(): {{className}}Element;
  readonly xtendScaffoldWiring: {{className}}ScaffoldWiring;
  readonly xtendScaffoldA11yProfile: {{className}}A11yProfile;
  readonly xtendScaffoldPerformanceProfile: {{className}}PerformanceProfile;
  readonly {{extensionSourceGetter}}: {{className}}ExtensionPoints;
}

declare global {
  interface HTMLElementTagNameMap {
    '{{tag}}': {{className}}Element;
  }
}

export {};
