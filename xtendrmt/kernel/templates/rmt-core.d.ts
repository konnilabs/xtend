// XTendRMT {{KERNEL_VERSION}} type definitions
import type { RmtJobContext, RmtJobHandle, RmtKernelScheduler } from './rmt-kernel-scheduler.js';

export {
    RMT_RESUME_RUNTIME_SCHEMA,
    RMT_RESUME_ENVELOPE_SCHEMA,
    RMT_RESUME_RESULT_SCHEMA,
    RMT_RESUME_INTENT_SCHEMA,
    RMT_RESUME_ADAPTER_SCHEMA,
    RMT_RESUME_MAX_INTENTS,
    canonicalizeRmtResumePayload,
    createRmtResumeRuntime,
    installRmtPrebootIntentCapture,
    resumeResponse,
    resumeTemplate
} from './rmt-resume-runtime.js';
export type {
    RmtResumeEnvelope,
    RmtResumeIntegrity,
    RmtResumeIntent,
    RmtResumeResult,
    RmtResumeRuntime,
    RmtResumeRuntimeOptions,
    RmtResumeVerifier
} from './rmt-resume-runtime.js';
export type RmtOwnershipMode =
    | 'observe_only'
    | 'hydrate_existing'
    | 'replace_children'
    | 'managed_subtree';

export type RmtBuildFormat = 'browser_classic' | 'esm' | string;
export type RmtTemplateMode = 'html_fragment' | 'text' | 'dom_descriptor' | string;
export type RmtTemplateBindingKind = 'text' | 'attribute' | 'property' | 'class_toggle' | 'command' | 'root_event' | 'template_outlet' | 'template_repeat' | string;
export type RmtTemplateSlotKind = 'text' | 'html_fragment' | 'template' | string;
export type RmtTemplateHydrationMode = 'runtime_render' | 'hydrate_prerendered' | 'worker_prerender_hydrate' | 'server_prerender_hydrate' | 'server_prerender_resume' | 'prerender_only' | string;

export interface RmtRuntimeContract {
    rootLifecycle: boolean;
    commandTransport: boolean;
    diagnostics: boolean;
    reactivity: boolean;
    kernelScheduler: boolean;
    runtimeProfiles: boolean;
    performanceRuntime: boolean;
    performanceBudgeting: boolean;
    adaptiveScheduling: boolean;
    templateInfrastructure: boolean;
    templatePreparation: boolean;
    templateArtifacts: boolean;
    rmtDocuments: boolean;
    rmtFileExtensions: boolean;
    templateExecutionPath: boolean;
    templateExecutionTransports: boolean;
    templateRuntimeBindings: boolean;
    templateSlotComposition: boolean;
    templateProps: boolean;
    templateActionBindings: boolean;
    templateHydrationContracts: boolean;
    templateErrorBoundaries: boolean;
    insularHydration: boolean;
    minimalDomPatching: boolean;
    prerenderHydration: boolean;
    kernelTrustAuthority?: boolean;
    trustedDomRuntime?: boolean;
    bindingSecurity?: boolean;
    panicMonitor?: boolean;
    recovery?: boolean;
    kernelEscalation?: boolean;
    schedulerFailureSemantics?: boolean;
    policyParity?: boolean;
    securityRegression?: boolean;
}

export interface RmtDistributionFormat {
    id: string;
    status: string;
    globalName: string;
    installerFactory: string;
    artifactPath: string;
    typesArtifactPath: string;
    entryPointId: string;
}

export interface RmtBuildTarget {
    id: string;
    format: RmtBuildFormat;
    status: string;
    artifactPath: string;
    typesArtifactPath: string;
    globalName: string;
    autoInstallGlobal: boolean;
    sourceModules: string[];
    namedExports?: string[];
    manifestPath: string;
}

export interface RmtBuiltTargetSummary {
    id: string;
    format: RmtBuildFormat;
    artifactPath: string;
    sourceModuleCount: number;
}

export interface RmtAppModulesFactories {
    core: string;
    domCompat: string;
    browserRuntime: string;
    detachedDomRuntime: string;
    workerPrerenderRuntime: string;
    serverPrerenderRuntime: string;
    manifest: string;
    publicApi: string;
    templateApi: string;
    format: string;
    templateCompiler: string;
    templateArtifacts: string;
    templateRuntimeRenderer: string;
    templateExecutionPath: string;
    templateWorkerAdapter: string;
    templateServerAdapter: string;
    xrouterAdapter?: string;
    xtendComponentAdapter?: string;
    surfaceAdapter?: string;
    stateSchedulerDiagnosticsBridge?: string;
    kernelPolicyParity?: string;
    prewarmWorkerSource?: string;
    prewarmWorkerRuntime?: string;
}

export interface RmtClassicSurfaceEntryPoint {
    createSurfaceFactory: string;
    installFactory: string;
    globalName: string;
}

export interface RmtOptionalCompatFactories {
    browserHostAdapter: string;
}

export interface RmtMigrationPolicy {
    additiveChanges: string;
    breakingChanges: string;
    preReleaseLabelRequired: boolean;
}

export interface RmtEntryPointManifest {
    appModulesFactories: RmtAppModulesFactories;
    classicSurface: RmtClassicSurfaceEntryPoint;
    buildTargets: RmtBuildTarget[];
    optionalCompat: RmtOptionalCompatFactories;
}


export interface RmtProductManifest {
    productName: 'XTendRMT' | string;
    version: string;
    apiVersion: string;
    releaseStage: string;
    classicGlobalName: string;
    runtimeContract: RmtRuntimeContract;
    ownershipModes: RmtOwnershipMode[];
    distributionFormats: RmtDistributionFormat[];
    schemaArtifacts: {
        rmtDocument: string;
        [key: string]: string;
    };
    templateDocumentFileTypes: {
        preferredExtension: string;
        supportedExtensions: string[];
        jsonFallbackExtensions: string[];
        contentType: string;
        jsonFallbackContentType: string;
        jsonFallbackPolicy?: string;
    };
    entryPoints: RmtEntryPointManifest;
    migrationPolicy: RmtMigrationPolicy;
    hostAdapterLifecycleContracts?: RmtHostAdapterLifecycleContract[];
    adapterRegistryContracts?: RmtAdapterRegistryContract[];
    nativeDomainContracts?: RmtNativeDomainContract[];
    dslNormalizationContracts?: RmtDslNormalizationContract[];
    runtimeRegistryContracts?: RmtRuntimeRegistryContract[];
    xrouterAdapterContracts?: RmtXRouterAdapterContract[];
    xtendComponentAdapterContracts?: RmtXtendComponentAdapterContract[];
    stateSchedulerDiagnosticsBridgeContracts?: RmtStateSchedulerDiagnosticsBridgeContract[];
    artifactParityContracts?: RmtArtifactParityContract[];
    surfaceAdapterContracts?: RmtSurfaceAdapterContract[];
    builtTargets?: RmtBuiltTargetSummary[];
}

export interface RmtMountElement extends EventTarget {
    id?: string;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
    replaceChildren?(...nodes: Array<Node | string>): void;
}

export interface RmtHostAdapter {
    hostKind: string;
    windowTarget?: unknown;
    documentTarget?: Document | null | unknown;
    now(): number;
    scheduleTimeout(callback: (...args: unknown[]) => void, delay?: number): unknown;
    clearTimeout(handle: unknown): unknown;
    scheduleAnimationFrame(callback: FrameRequestCallback): unknown;
    cancelAnimationFrame(handle: unknown): unknown;
    scheduleIdleCallback(
        callback: (deadline: IdleDeadline | { didTimeout: boolean; timeRemaining(): number }) => void,
        options?: { timeout?: number }
    ): unknown;
    cancelIdleCallback(handle: unknown): unknown;
    createAbortController(): AbortController | null;
    createCustomEvent<T = unknown>(eventName: string, init?: CustomEventInit<T>): Event | CustomEvent<T> | null;
}

/** Host effects consumed by the Command Bus Controller through composition. */
export interface RmtCommandHostPort {
    readonly schema?: string;
    now(): number;
    createAbortController(): AbortController | null;
}

export type RmtHostAdapterKind =
    | 'host_adapter'
    | 'component_adapter'
    | 'router_adapter'
    | 'state_adapter'
    | 'scheduler_adapter'
    | 'surface_adapter'
    | string;

export type RmtHostAdapterRuntimeSurface =
    | 'esm'
    | 'browser_classic'
    | 'worker'
    | 'server'
    | string;

export type RmtHostAdapterLifecyclePhase =
    | 'register'
    | 'negotiate'
    | 'prepare'
    | 'mount'
    | 'hydrate'
    | 'route'
    | 'state'
    | 'schedule'
    | 'diagnose'
    | 'dispose'
    | string;

export type RmtHostAdapterOperation =
    | 'registerAdapter'
    | 'negotiateCapabilities'
    | 'registerComponent'
    | 'mountComponent'
    | 'hydrateComponent'
    | 'registerRoutes'
    | 'navigate'
    | 'createStateBridge'
    | 'scheduleEndpoint'
    | 'registerSurface'
    | 'openSurface'
    | 'closeSurface'
    | 'destroySurface'
    | 'focusSurface'
    | 'moveSurface'
    | 'resizeSurface'
    | 'dockSurface'
    | 'undockSurface'
    | 'registerRemoteSurface'
    | 'applyRemoteSurfacePolicy'
    | 'governRemoteSurfaceEvent'
    | 'snapshotSurfaces'
    | 'recordAdapterResult'
    | 'recordTelemetrySnapshot'
    | 'recordBackpressureSignal'
    | 'listTelemetrySnapshots'
    | 'listBackpressureSignals'
    | 'getTelemetryDebugSnapshot'
    | 'emitDiagnostic'
    | 'disposeAdapter'
    | string;

export type RmtHostAdapterOperationStatus =
    | 'ok'
    | 'degraded'
    | 'skipped'
    | 'failed'
    | string;

export interface RmtHostAdapterCapabilities {
    requiredCapabilities?: string[];
    preferredCapabilities?: string[];
    providedCapabilities?: string[];
    metadata?: Record<string, unknown>;
}

export interface RmtHostAdapterDefinition {
    id: string;
    kind: RmtHostAdapterKind;
    version: string;
    package?: string;
    moduleRef?: string;
    runtimeSurface: RmtHostAdapterRuntimeSurface[];
    capabilities: RmtHostAdapterCapabilities;
    kernelVisible?: boolean;
    metadata?: Record<string, unknown>;
}

export interface RmtHostAdapterOperationOptions {
    adapterId?: string;
    rootId?: string;
    scope?: string;
    schedule?: string | Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

export interface RmtHostAdapterDiagnosticEvent {
    level: 'info' | 'warn' | 'error' | string;
    code: string;
    message: string;
    adapterId?: string;
    operation?: RmtHostAdapterOperation;
    phase?: RmtHostAdapterLifecyclePhase;
    metadata?: Record<string, unknown>;
}

export interface RmtHostAdapterOperationResult<THandle = unknown> {
    ok: boolean;
    status: RmtHostAdapterOperationStatus;
    adapterId: string;
    operation: RmtHostAdapterOperation;
    phase: RmtHostAdapterLifecyclePhase;
    handle?: THandle;
    diagnostics?: RmtHostAdapterDiagnosticEvent[];
    metadata?: Record<string, unknown>;
}

export interface RmtHostAdapterOperationContract {
    operation: RmtHostAdapterOperation;
    phase: RmtHostAdapterLifecyclePhase;
    requiredFor: RmtHostAdapterKind[];
    inputContract: string[];
    outputContract: string[];
}

export interface RmtHostAdapterLifecycleContract {
    id: 'xtend.rmt.host-adapter-lifecycle.v1' | string;
    status: 'epic-05-wp-02-contract' | string;
    adapterKinds: RmtHostAdapterKind[];
    lifecyclePhases: RmtHostAdapterLifecyclePhase[];
    runtimeSurfaces: RmtHostAdapterRuntimeSurface[];
    operations: RmtHostAdapterOperationContract[];
    minimumGates: string[];
    kernelBoundary: string;
}

export interface RmtHostAdapterRuntimeBridge {
    registerAdapter(definition: RmtHostAdapterDefinition, options?: RmtHostAdapterOperationOptions): RmtHostAdapterOperationResult;
    negotiateCapabilities(requirements: RmtHostAdapterCapabilities, options?: RmtHostAdapterOperationOptions): RmtHostAdapterOperationResult;
    registerComponent?(definition: Record<string, unknown>, options?: RmtHostAdapterOperationOptions): RmtHostAdapterOperationResult;
    mountComponent?(target: unknown, componentRef: string | Record<string, unknown>, model?: unknown, options?: RmtHostAdapterOperationOptions): RmtHostAdapterOperationResult;
    hydrateComponent?(target: unknown, componentRef: string | Record<string, unknown>, model?: unknown, options?: RmtHostAdapterOperationOptions): RmtHostAdapterOperationResult;
    registerRoutes?(routes: Array<Record<string, unknown>>, options?: RmtHostAdapterOperationOptions): RmtHostAdapterOperationResult;
    navigate?(to: string | Record<string, unknown>, options?: RmtHostAdapterOperationOptions): RmtHostAdapterOperationResult | Promise<RmtHostAdapterOperationResult>;
    createStateBridge?(options?: RmtHostAdapterOperationOptions): RmtHostAdapterOperationResult;
    scheduleEndpoint?(endpointName: string, scope: string, callback: () => void, options?: RmtHostAdapterOperationOptions): RmtHostAdapterOperationResult;
    registerSurface?(surface: RmtSurfaceDomainRecord | Record<string, unknown>, options?: RmtHostAdapterOperationOptions): RmtHostAdapterOperationResult;
    openSurface?(surfaceRef: string | RmtSurfaceDomainRecord | Record<string, unknown>, options?: RmtHostAdapterOperationOptions): RmtHostAdapterOperationResult;
    closeSurface?(surfaceRef: string | RmtSurfaceDomainRecord | Record<string, unknown>, options?: RmtHostAdapterOperationOptions): RmtHostAdapterOperationResult;
    destroySurface?(surfaceRef: string | RmtSurfaceDomainRecord | Record<string, unknown>, options?: RmtHostAdapterOperationOptions): RmtHostAdapterOperationResult;
    focusSurface?(surfaceRef: string | RmtSurfaceDomainRecord | Record<string, unknown>, options?: RmtHostAdapterOperationOptions): RmtHostAdapterOperationResult;
    snapshotSurfaces?(options?: RmtHostAdapterOperationOptions): RmtHostAdapterOperationResult;
    recordAdapterResult?(result: RmtHostAdapterOperationResult | Record<string, unknown>, options?: RmtHostAdapterOperationOptions): RmtHostAdapterOperationResult;
    emitDiagnostic(event: RmtHostAdapterDiagnosticEvent, payload?: Record<string, unknown>): RmtHostAdapterOperationResult;
    disposeAdapter?(adapterId: string, options?: RmtHostAdapterOperationOptions): RmtHostAdapterOperationResult;
}

export type RmtAdapterRegistryStatus =
    | 'registered'
    | 'available'
    | 'degraded'
    | 'missing'
    | 'failed'
    | string;

export type RmtCapabilityNegotiationStatus =
    | 'accepted'
    | 'degraded'
    | 'failed'
    | 'skipped'
    | string;

export type RmtCapabilityNegotiationPhase =
    | 'collect'
    | 'normalize'
    | 'match'
    | 'validate'
    | 'select'
    | 'degrade'
    | 'diagnose'
    | 'finalize'
    | string;

export type RmtCapabilityFallbackPolicy =
    | 'fail'
    | 'degrade'
    | 'skip'
    | 'diagnose_only'
    | string;

export interface RmtAdapterRegistryRecord extends RmtHostAdapterDefinition {
    providedCapabilities: string[];
    requiredCapabilities?: string[];
    preferredCapabilities?: string[];
    lifecycleContract?: string;
    status: RmtAdapterRegistryStatus;
    diagnostics?: RmtHostAdapterDiagnosticEvent[];
}

export interface RmtCapabilityRequest {
    scope: 'document' | 'route' | 'component' | 'template' | 'schedule' | string;
    adapterKind: RmtHostAdapterKind;
    adapterId?: string;
    requiredCapabilities?: string[];
    preferredCapabilities?: string[];
    runtimeSurface?: RmtHostAdapterRuntimeSurface;
    fallbackPolicy?: RmtCapabilityFallbackPolicy;
    metadata?: Record<string, unknown>;
}

export interface RmtCapabilityNegotiationResult {
    ok: boolean;
    status: RmtCapabilityNegotiationStatus;
    scope: string;
    adapterId?: string;
    adapterKind: RmtHostAdapterKind;
    acceptedCapabilities: string[];
    missingRequiredCapabilities: string[];
    missingPreferredCapabilities: string[];
    degradedCapabilities: string[];
    diagnostics: RmtHostAdapterDiagnosticEvent[];
    metadata?: Record<string, unknown>;
}

export interface RmtAdapterRegistryContract {
    id: 'xtend.rmt.adapter-registry.v1' | string;
    status: 'epic-05-wp-03-contract' | string;
    sourceOfTruth: string;
    registryStatuses: RmtAdapterRegistryStatus[];
    negotiationStatuses: RmtCapabilityNegotiationStatus[];
    negotiationPhases: RmtCapabilityNegotiationPhase[];
    fallbackPolicies: RmtCapabilityFallbackPolicy[];
    diagnosticCodes: string[];
    stableAdapterIds: string[];
    minimumGates: string[];
    kernelBoundary: string;
}

export interface RmtNativeDomainContract {
    id: 'xtend.rmt.adapters-domain.v1' | 'xtend.rmt.components-domain.v1' | 'xtend.rmt.routes-domain.v1' | 'xtend.rmt.schedules-domain.v1' | 'xtend.rmt.surfaces-domain.v1' | string;
    status: 'epic-05-wp-04-contract' | 'epic-05-wp-05-contract' | 'epic-05-wp-06-contract' | 'epic-05-wp-07-contract' | 'wp-sm-08-contract' | string;
    sourceOfTruth: string;
    domain: 'adapters' | 'components' | 'routes' | 'schedules' | 'surfaces' | string;
    schemaRef: string;
    topLevelProperty: string;
    optional: boolean;
    allowedAdapterKinds?: RmtHostAdapterKind[];
    componentKinds?: RmtComponentDomainKind[];
    stableAdapterIds?: string[];
    requiredFields?: string[];
    adapterRefField?: string;
    routerRefField?: string;
    managerRefField?: string;
    componentRefField?: string;
    routeRefField?: string;
    templateRefField?: string;
    scheduleRefField?: string;
    scheduleRefFields?: string[];
    scheduleFields?: string[];
    surfaceFields?: string[];
    surfaceTypes?: RmtSurfaceType[];
    adapterId?: string;
    adapterKind?: RmtHostAdapterKind;
    referenceChecks?: string[];
    lanes?: RmtScheduleLane[];
    budgetClasses?: RmtScheduleBudgetClass[];
    routeFields?: string[];
    routerAdapters?: string[];
    capabilityFields?: string[];
    backwardCompatibility?: string;
    kernelBoundary: string;
    minimumGates: string[];
    nextWorkpackages?: string[];
}

export interface RmtSurfaceAdapterContract {
    id: 'xtend.surface.adapter.v1' | string;
    status: 'wp-sm-08-adapter-handoff' | string;
    sourceOfTruth: string;
    adapterId: 'xtend.surface' | string;
    adapterKind: 'surface_adapter' | string;
    inputContracts: string[];
    consumes: string[];
    operations: RmtHostAdapterOperation[];
    runtimeImplemented: boolean;
    kernelVisible: boolean;
    componentCompatibility: string;
    kernelBoundary: string;
    minimumGates: string[];
    nextWorkpackages?: string[];
}

export interface RmtDslNormalizationContract {
    id: 'xtend.rmt.dsl-normalization.v1' | string;
    status: 'epic-05-wp-08-contract' | string;
    sourceOfTruth: string;
    inputModes: string[];
    normalizedDomains: string[];
    legacyPromotionPaths: string[];
    referenceChecks: string[];
    diagnosticCodes: RmtDslDiagnosticCode[];
    artifactSurfaces: string[];
    backwardCompatibility: string;
    kernelBoundary: string;
    minimumGates: string[];
    nextWorkpackages?: string[];
}

export type RmtRuntimeRegistryDiagnosticCode =
    | 'rmt.runtime.registry.missing_route'
    | 'rmt.runtime.registry.missing_component'
    | 'rmt.runtime.registry.duplicate_route'
    | 'rmt.runtime.registry.duplicate_component'
    | string;

export type RmtRuntimeRegistryStatus =
    | 'ready'
    | 'ready_with_diagnostics'
    | 'empty'
    | string;

export type RmtRuntimeLifecycleEvent =
    | 'create'
    | 'mount'
    | 'hydrate'
    | 'update'
    | 'dispose'
    | string;

export interface RmtRuntimeRegistryOptions {
    requiredRoutes?: string[];
    requiredRouteIds?: string[];
    requiredComponents?: string[];
    requiredComponentIds?: string[];
    [key: string]: unknown;
}

export interface RmtRouteRegistryEntry {
    id: string;
    index: number;
    path: string;
    routerId: string;
    componentId: string;
    templateRef: string;
    redirect: string;
    scheduleRef: string;
    lifecycleEvents: RmtRuntimeLifecycleEvent[];
    targetKind: 'component' | 'template' | 'redirect' | 'none' | string;
    record: RmtRouteDomainRecord | Record<string, unknown>;
}

export interface RmtComponentRegistryEntry {
    id: string;
    index: number;
    kind: RmtComponentDomainKind | string;
    adapterId: string;
    tag: string;
    scheduleRef: string;
    lifecycleEvents: RmtRuntimeLifecycleEvent[];
    record: RmtComponentDomainRecord | Record<string, unknown>;
}

export interface RmtRouteRegistryIndex {
    ids: string[];
    byId: Record<string, RmtRouteRegistryEntry>;
    byPath: Record<string, string[]>;
    byRouter: Record<string, string[]>;
    byComponent: Record<string, string[]>;
}

export interface RmtComponentRegistryIndex {
    ids: string[];
    byId: Record<string, RmtComponentRegistryEntry>;
    byTag: Record<string, string[]>;
    byAdapter: Record<string, string[]>;
}

export interface RmtRuntimeRegistrySnapshot {
    schema: 'xtend.rmt.runtime-registry.v1' | string;
    status: RmtRuntimeRegistryStatus;
    documentId: string;
    normalization?: RmtDslNormalizationSummary | null;
    diagnostics: RmtDslDiagnostic[];
    sourceDiagnostics: RmtDslDiagnostic[];
    diagnosticCount: number;
    lifecycleEvents: RmtRuntimeLifecycleEvent[];
    routes: RmtRouteRegistryEntry[];
    components: RmtComponentRegistryEntry[];
    routeRegistry: RmtRouteRegistryIndex;
    componentRegistry: RmtComponentRegistryIndex;
}

export interface RmtRuntimeRegistryContract {
    id: 'xtend.rmt.runtime-registry.v1' | string;
    status: 'epic-05-wp-09-contract' | string;
    sourceOfTruth: string;
    inputContract: string;
    registryKinds: string[];
    indexes: string[];
    lifecycleEvents: RmtRuntimeLifecycleEvent[];
    diagnosticCodes: RmtRuntimeRegistryDiagnosticCode[];
    artifactSurfaces: string[];
    adapterConsumption: string[];
    kernelBoundary: string;
    minimumGates: string[];
    nextWorkpackages?: string[];
}

export type RmtXRouterAdapterDiagnosticCode =
    | 'rmt.xrouter.route.missing_path'
    | 'rmt.xrouter.route.missing_component'
    | 'rmt.xrouter.target.missing'
    | 'rmt.xrouter.navigation.skipped'
    | string;

export interface RmtXRouterMappedRoute {
    id: string;
    routeId: string;
    path: string;
    router: string;
    component: string;
    title: string;
    documentTitle: string;
    titleTemplate: string;
    metaDescription: string;
    metaKeywords: string;
    redirect: string;
    template: string;
    schedule: string;
    scheduleRef: string;
    params: Record<string, unknown>;
    query: Record<string, unknown>;
    metadata: Record<string, unknown>;
    lifecycle: Record<string, unknown>;
    import: string;
    targetKind: 'component' | 'template' | 'redirect' | 'none' | string;
    attributes: Record<string, string>;
    sourceRoute: RmtRouteDomainRecord | Record<string, unknown>;
    children: RmtXRouterMappedRoute[];
}

export interface RmtXRouterRouteMapping {
    schema: 'xtend.rmt.xrouter-adapter.v1' | string;
    adapterId: 'xtend.xrouter' | string;
    status: 'mapped' | 'mapped_with_diagnostics' | string;
    routes: RmtXRouterMappedRoute[];
    diagnostics: RmtHostAdapterDiagnosticEvent[];
    sourceDiagnostics: RmtDslDiagnostic[];
    routeCount: number;
    scheduleRefs: string[];
    modelFields: string[];
}

export interface RmtXRouterNavigationTarget {
    path: string;
    routeId?: string;
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

export interface RmtXRouterAdapter {
    id: 'xtend.xrouter' | string;
    schema: 'xtend.rmt.xrouter-adapter.v1' | string;
    kind: 'router_adapter' | string;
    version: string;
    runtimeSurface: RmtHostAdapterRuntimeSurface[];
    capabilities: RmtHostAdapterCapabilities;
    definition: RmtHostAdapterDefinition;
    mapRoute(routeEntry: RmtRouteRegistryEntry | RmtRouteDomainRecord | Record<string, unknown>, options?: Record<string, unknown>): RmtXRouterMappedRoute;
    mapRoutes(routesInput?: RmtRuntimeRegistrySnapshot | RmtDocument | RmtRouteRegistryEntry[] | Record<string, unknown>, options?: Record<string, unknown>): RmtXRouterRouteMapping;
    registerRoutes(routesInput?: RmtRuntimeRegistrySnapshot | RmtDocument | RmtRouteRegistryEntry[] | Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    navigate(to: string | RmtXRouterNavigationTarget | Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult | Promise<RmtHostAdapterOperationResult>;
    emitDiagnostic(event: RmtHostAdapterDiagnosticEvent | Record<string, unknown>, payload?: Record<string, unknown>): RmtHostAdapterOperationResult;
    listDiagnosticCodes(): RmtXRouterAdapterDiagnosticCode[];
}

export interface RmtXRouterAdapterContract {
    id: 'xtend.rmt.xrouter-adapter.v1' | string;
    status: 'epic-05-wp-10-contract' | string;
    sourceOfTruth: string;
    adapterId: 'xtend.xrouter' | string;
    inputContract: 'xtend.rmt.runtime-registry.v1' | string;
    consumes: string[];
    operations: RmtHostAdapterOperation[];
    routeMappingFields: string[];
    navigationSync: string[];
    modelFields: string[];
    diagnosticCodes: RmtXRouterAdapterDiagnosticCode[];
    artifactSurfaces: string[];
    kernelBoundary: string;
    minimumGates: string[];
    nextWorkpackages?: string[];
}

export type RmtXtendComponentAdapterDiagnosticCode =
    | 'rmt.xtend.component.missing_tag'
    | 'rmt.xtend.component.target.missing'
    | 'rmt.xtend.component.manifest.missing'
    | 'rmt.xtend.component.custom_element.unregistered'
    | 'rmt.xtend.component.mount.skipped'
    | 'rmt.xtend.component.hydration.skipped'
    | 'rmt.xtend.component.fabric_lane.conflict'
    | 'rmt.xtend.component.fabric_lane.defaulted'
    | 'rmt.xtend.component.event.failed'
    | string;

export type RmtXtendComponentFabricLaneSource =
    | 'rmt.schedule-record'
    | 'rmt.component-metadata'
    | 'fabric.runtime-override'
    | 'component.static-contract'
    | 'scaffold.blueprint-default'
    | string;

export interface RmtXtendComponentFabricContext {
    schema: 'xtend.component.fabric-lane-ingestion.v2' | string;
    status: 'resolved' | 'resolved_with_diagnostics' | 'skipped' | string;
    operation: 'mountComponent' | 'hydrateComponent' | 'registerComponent' | string;
    phase?: 'mount' | 'hydrate' | 'prepare' | string;
    adapterId: 'xtend.component' | string;
    componentId: string;
    tag: string;
    scheduleRef: string;
    lane: string;
    fabricLane: string;
    rmtLane: string;
    fiberKind: string;
    endpointNameHint: string;
    preferIdle?: boolean;
    budgetClass?: string;
    source: RmtXtendComponentFabricLaneSource;
    sourceId?: string;
    precedence: RmtXtendComponentFabricLaneSource[];
    sources: Array<Record<string, unknown>>;
    diagnostics: RmtHostAdapterDiagnosticEvent[];
}

export type RmtXtendComponentLifecycleOperation =
    | 'mount'
    | 'hydrate'
    | 'render'
    | 'update'
    | 'event'
    | 'unmount'
    | 'dispose'
    | 'error'
    | string;

export type RmtXtendComponentLifecycleTelemetryStatus =
    | 'ok'
    | 'degraded'
    | 'skipped'
    | 'failed'
    | string;

export interface RmtXtendComponentLifecycleTelemetry {
    schema: 'xtend.component.lifecycle-telemetry.v1' | string;
    id: string;
    timestamp: string;
    source: string;
    operation: RmtXtendComponentLifecycleOperation;
    phase: string;
    status: RmtXtendComponentLifecycleTelemetryStatus;
    ok: boolean;
    adapterId: 'xtend.component' | string;
    componentId: string;
    rmtComponentId: string;
    tag: string;
    routeRef: string;
    scheduleRef: string;
    fabricLane: string;
    rmtLane: string;
    fiberKind: string;
    endpointNameHint: string;
    durationMs: number;
    diagnosticCount: number;
    diagnostics: RmtHostAdapterDiagnosticEvent[];
    backpressureSignal?: Record<string, unknown> | string | null;
    correlationId?: string;
    metadata: Record<string, unknown>;
}

export interface RmtXtendMappedComponent {
    id: string;
    componentId: string;
    kind: RmtComponentDomainKind | string;
    adapter: 'xtend.component' | string;
    tag: string;
    props: Record<string, unknown>;
    attributes: Record<string, unknown>;
    serializedAttributes: Record<string, string>;
    slots: Record<string, unknown>;
    events: Record<string, unknown>;
    hydration: Record<string, unknown>;
    schedule: string;
    scheduleRef: string;
    metadata: Record<string, unknown>;
    diagnostics: RmtHostAdapterDiagnosticEvent[];
    manifestEntry: string;
    targetKind: 'custom_element' | 'none' | string;
    sourceComponent: RmtComponentDomainRecord | Record<string, unknown>;
    registryIndex: number;
}

export interface RmtXtendComponentMapping {
    schema: 'xtend.rmt.xtend-component-adapter.v1' | string;
    adapterId: 'xtend.component' | string;
    status: 'mapped' | 'mapped_with_diagnostics' | string;
    components: RmtXtendMappedComponent[];
    diagnostics: RmtHostAdapterDiagnosticEvent[];
    sourceDiagnostics: RmtDslDiagnostic[];
    schedules?: Array<RmtScheduleDomainRecord | Record<string, unknown>>;
    componentCount: number;
    scheduleRefs: string[];
    modelFields: string[];
}

export interface RmtXtendComponentAdapter {
    id: 'xtend.component' | string;
    schema: 'xtend.rmt.xtend-component-adapter.v1' | string;
    kind: 'component_adapter' | string;
    version: string;
    runtimeSurface: RmtHostAdapterRuntimeSurface[];
    capabilities: RmtHostAdapterCapabilities;
    definition: RmtHostAdapterDefinition;
    mapComponent(componentEntry: RmtComponentRegistryEntry | RmtComponentDomainRecord | Record<string, unknown>, options?: Record<string, unknown>): RmtXtendMappedComponent;
    mapComponents(componentsInput?: RmtRuntimeRegistrySnapshot | RmtDocument | RmtComponentRegistryEntry[] | Record<string, unknown>, options?: Record<string, unknown>): RmtXtendComponentMapping;
    registerComponent(componentInput?: RmtRuntimeRegistrySnapshot | RmtDocument | RmtComponentRegistryEntry[] | RmtXtendComponentMapping | Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    resolveFabricContext(componentRef: string | RmtXtendMappedComponent | RmtXtendComponentMapping | Record<string, unknown>, operation?: 'mountComponent' | 'hydrateComponent' | string, model?: Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtXtendComponentFabricContext;
    recordComponentTelemetry(record: RmtXtendComponentLifecycleTelemetry | Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    mountComponent(target: unknown, componentRef: string | RmtXtendMappedComponent | RmtXtendComponentMapping | Record<string, unknown>, model?: Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    hydrateComponent(target: unknown, componentRef: string | RmtXtendMappedComponent | RmtXtendComponentMapping | Record<string, unknown>, model?: Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    emitDiagnostic(event: RmtHostAdapterDiagnosticEvent | Record<string, unknown>, payload?: Record<string, unknown>): RmtHostAdapterOperationResult;
    listDiagnosticCodes(): RmtXtendComponentAdapterDiagnosticCode[];
}

export interface RmtXtendComponentAdapterContract {
    id: 'xtend.rmt.xtend-component-adapter.v1' | string;
    status: 'epic-05-wp-11-contract' | string;
    sourceOfTruth: string;
    adapterId: 'xtend.component' | string;
    inputContract: 'xtend.rmt.runtime-registry.v1' | string;
    consumes: string[];
    operations: RmtHostAdapterOperation[];
    componentMappingFields: string[];
    mountHydrationModel: string[];
    modelFields: string[];
    diagnosticCodes: RmtXtendComponentAdapterDiagnosticCode[];
    artifactSurfaces: string[];
    kernelBoundary: string;
    minimumGates: string[];
    nextWorkpackages?: string[];
}

export type RmtSurfaceAdapterDiagnosticCode =
    | 'rmt.surface.missing_id'
    | 'rmt.surface.missing_manager'
    | 'rmt.surface.missing_component'
    | 'rmt.surface.target.missing'
    | 'rmt.surface.target.unsupported'
    | 'rmt.surface.materialization.target.missing'
    | 'rmt.surface.materialization.created'
    | 'rmt.surface.remote_policy.blocked'
    | 'rmt.surface.remote_policy.degraded'
    | 'rmt.surface.remote_policy.kernel_runtime_refused'
    | 'rmt.surface.remote_event_governance.blocked'
    | 'rmt.surface.dom_compat_ownership_unsupported'
    | 'rmt.surface.operation.skipped'
    | 'rmt.surface.diagnostic'
    | string;

export interface RmtSurfaceMappedSurface {
    id: string;
    surfaceId: string;
    schema: 'xtend.surface.record.v1' | string;
    type: RmtSurfaceType | string;
    kind?: string;
    adapter: 'xtend.surface' | string;
    manager: string;
    component: string;
    route: string;
    schedule: string;
    scheduleRef: string;
    stateKey: string;
    defaultOpen: boolean;
    active: boolean;
    bounds: Record<string, unknown>;
    placement: string;
    mode: string;
    layer: string;
    ownershipMode: RmtOwnershipMode | string;
    requestedOwnershipMode?: string;
    capabilities: string[];
    a11y: Record<string, unknown>;
    persistence: Record<string, unknown>;
    metadata: Record<string, unknown>;
    remoteSurface?: Record<string, unknown> | null;
    remotePolicy?: Record<string, unknown> | null;
    enterpriseSurface?: Record<string, unknown> | null;
    degradation?: Record<string, unknown> | null;
    eventGovernance?: Record<string, unknown> | null;
    componentRecord: RmtComponentDomainRecord | Record<string, unknown> | null;
    managerRecord: RmtComponentDomainRecord | Record<string, unknown> | null;
    routeRecord: RmtRouteDomainRecord | Record<string, unknown> | null;
    scheduleRecord: RmtScheduleDomainRecord | Record<string, unknown> | null;
    sourceSurface: RmtSurfaceDomainRecord | Record<string, unknown>;
    registryIndex: number;
}

export interface RmtSurfaceAdapterMapping {
    schema: 'xtend.surface.adapter.v1' | string;
    adapterId: 'xtend.surface' | string;
    status: 'mapped' | 'mapped_with_diagnostics' | string;
    surfaces: RmtSurfaceMappedSurface[];
    diagnostics: RmtHostAdapterDiagnosticEvent[];
    sourceDiagnostics: RmtDslDiagnostic[];
    surfaceCount: number;
    scheduleRefs: string[];
    modelFields: string[];
}

export interface RmtSurfaceMaterializedElementHandle {
    surfaceId: string;
    tag: string;
    slot: 'windows' | 'panels' | 'overlays' | string;
    element: Element | unknown;
    contentElement?: Element | unknown;
    managerElement?: Element | unknown;
}

export interface RmtSurfaceMaterializationHandle {
    schema: 'xtend.surface.materialization.v1' | string;
    mapping: RmtSurfaceAdapterMapping;
    materialized: RmtSurfaceMaterializedElementHandle[];
    bound: RmtSurfaceMaterializedElementHandle[];
    registered: Array<Record<string, unknown>>;
    managers: Array<{
        managerId: string;
        element: Element | unknown;
        created: boolean;
    }>;
}

export interface RmtSurfaceAdapter {
    id: 'xtend.surface' | string;
    schema: 'xtend.surface.adapter.v1' | string;
    kind: 'surface_adapter' | string;
    version: string;
    runtimeSurface: RmtHostAdapterRuntimeSurface[];
    capabilities: RmtHostAdapterCapabilities;
    definition: RmtHostAdapterDefinition;
    mapSurface(surfaceEntry: RmtSurfaceDomainRecord | Record<string, unknown>, options?: Record<string, unknown>): RmtSurfaceMappedSurface;
    mapSurfaces(surfacesInput?: RmtDocument | RmtSurfaceDomainRecord[] | RmtRuntimeRegistrySnapshot | Record<string, unknown>, options?: Record<string, unknown>): RmtSurfaceAdapterMapping;
    registerSurface(surfaceInput?: RmtDocument | RmtSurfaceDomainRecord[] | RmtSurfaceAdapterMapping | Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    registerRemoteSurface(remoteSurfaceInput?: Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    applyRemoteSurfacePolicy(remoteSurfaceInput?: Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    openSurface(surfaceRef: string | RmtSurfaceMappedSurface | Record<string, unknown>, input?: Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    closeSurface(surfaceRef: string | RmtSurfaceMappedSurface | Record<string, unknown>, reason?: string, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    destroySurface(surfaceRef: string | RmtSurfaceMappedSurface | Record<string, unknown>, input?: Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    focusSurface(surfaceRef: string | RmtSurfaceMappedSurface | Record<string, unknown>, input?: Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    moveSurface(surfaceRef: string | RmtSurfaceMappedSurface | Record<string, unknown>, bounds?: Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    resizeSurface(surfaceRef: string | RmtSurfaceMappedSurface | Record<string, unknown>, bounds?: Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    dockSurface(surfaceRef: string | RmtSurfaceMappedSurface | Record<string, unknown>, placement?: string, mode?: string, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    undockSurface(surfaceRef: string | RmtSurfaceMappedSurface | Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    snapshotSurfaces(surfaceInput?: RmtDocument | RmtSurfaceAdapterMapping | Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    materializeSurfaces(surfaceInput?: RmtDocument | RmtSurfaceAdapterMapping | Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult & { handle?: RmtSurfaceMaterializationHandle };
    governRemoteSurfaceEvent(eventRecord?: Record<string, unknown>, payload?: Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    emitDiagnostic(event: RmtHostAdapterDiagnosticEvent | Record<string, unknown>, payload?: Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    listDiagnosticCodes(): RmtSurfaceAdapterDiagnosticCode[];
}

export interface RmtSurfaceAdapterRuntimeContract {
    id: 'xtend.surface.adapter.v1' | string;
    status: 'wp-sm-10-runtime-contract' | string;
    sourceOfTruth: string;
    adapterId: 'xtend.surface' | string;
    inputContract: 'xtend.rmt.runtime-registry.v1' | string;
    consumes: string[];
    operations: RmtHostAdapterOperation[];
    surfaceMappingFields: string[];
    modelFields: string[];
    diagnosticCodes: RmtSurfaceAdapterDiagnosticCode[];
    artifactSurfaces: string[];
    kernelBoundary: string;
    createsSecondRegistry: false;
    runtimeImplemented: true;
    minimumGates: string[];
    nextWorkpackages?: string[];
}

export type RmtStateSchedulerDiagnosticsBridgeDiagnosticCode =
    | 'rmt.bridge.state.mirrored'
    | 'rmt.bridge.state.unavailable'
    | 'rmt.bridge.state-projection.legacy-alias'
    | 'rmt.bridge.scheduler.endpoint.scheduled'
    | 'rmt.bridge.scheduler.endpoint.queued'
    | 'rmt.bridge.diagnostics.emitted'
    | 'rmt.bridge.adapter.result.degraded'
    | 'rmt.bridge.telemetry.snapshot.recorded'
    | 'rmt.bridge.backpressure.signal.recorded'
    | 'rmt.bridge.backpressure.high'
    | 'rmt.bridge.backpressure.critical'
    | string;

export interface RmtBridgeSchedulePolicy {
    id: string;
    endpointName: string;
    scope: string;
    lane: RmtScheduleLane | string;
    priority: number;
    deadlineMs: number;
    preferIdle: boolean;
    coalesceKey: string;
    budgetClass: RmtScheduleBudgetClass | string;
    maxRetries: number;
    timeoutMs: number;
    metadata: Record<string, unknown>;
}

export interface RmtBridgeScheduledEndpoint {
    status: 'scheduled' | 'queued' | string;
    endpointName: string;
    scope: string;
    schedule: RmtBridgeSchedulePolicy;
    targetResult?: unknown;
}

export interface RmtStateBridgeHandle {
    set(key: string, value: unknown, metadata?: Record<string, unknown>): Record<string, unknown>;
    get(key: string, fallbackValue?: unknown): unknown;
    snapshot(): Record<string, unknown>;
    publish(eventName: string, payload?: Record<string, unknown>, metadata?: Record<string, unknown>): RmtHostAdapterOperationResult;
}

export interface RmtStateTelemetryProjectionPort {
    readonly portSchema?: 'xtend.rmt.state-projection-port.v1' | string;
    batchUpdate(updates: Record<string, unknown>, metadata?: Record<string, unknown>): unknown;
}

export interface RmtStateSchedulerDiagnosticsBridgeOptions extends Record<string, unknown> {
    adapterId?: string;
    stateProjectionPort?: RmtStateTelemetryProjectionPort | null;
    diagnosticsHub?: unknown;
    scheduler?: unknown;
    performanceRuntime?: unknown;
    rmt?: RmtInstance;
    schedules?: RmtScheduleDomainRecord[];
    document?: Record<string, unknown>;
    maxTelemetryRecords?: number;
}

export interface RmtStateSchedulerDiagnosticsBridge {
    id: 'rmt.state-scheduler-diagnostics' | string;
    schema: 'xtend.rmt.state-scheduler-diagnostics-bridge.v1' | string;
    kind: 'host_adapter' | string;
    version: string;
    runtimeSurface: RmtHostAdapterRuntimeSurface[];
    capabilities: RmtHostAdapterCapabilities;
    definition: RmtHostAdapterDefinition;
    createStateBridge(options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult<RmtStateBridgeHandle>;
    scheduleEndpoint(endpointName: string, scope: string, callback?: (jobContext: Record<string, unknown>) => unknown, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult<RmtBridgeScheduledEndpoint>;
    emitDiagnostic(event: RmtHostAdapterDiagnosticEvent | Record<string, unknown>, payload?: Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    recordAdapterResult(result: RmtHostAdapterOperationResult | Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult;
    recordTelemetrySnapshot(snapshot: Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult<Record<string, unknown>>;
    recordBackpressureSignal(signal: Record<string, unknown>, options?: RmtHostAdapterOperationOptions & Record<string, unknown>): RmtHostAdapterOperationResult<Record<string, unknown>>;
    listTelemetrySnapshots(options?: { limit?: number } & Record<string, unknown>): Record<string, unknown>[];
    listBackpressureSignals(options?: { limit?: number } & Record<string, unknown>): Record<string, unknown>[];
    getTelemetryDebugSnapshot(options?: { limit?: number } & Record<string, unknown>): Record<string, unknown>;
    resolveSchedulePolicy(scheduleRef: string | RmtScheduleDomainRecord | Record<string, unknown>, options?: Record<string, unknown>): RmtBridgeSchedulePolicy;
    listScheduledEndpoints(): RmtBridgeScheduledEndpoint[];
    listDiagnostics(): RmtHostAdapterDiagnosticEvent[];
    listDiagnosticCodes(): RmtStateSchedulerDiagnosticsBridgeDiagnosticCode[];
}

export interface RmtStateSchedulerDiagnosticsBridgeContract {
    id: 'xtend.rmt.state-scheduler-diagnostics-bridge.v1' | string;
    status: 'epic-05-wp-12-contract' | string;
    sourceOfTruth: string;
    adapterId: 'rmt.state-scheduler-diagnostics' | string;
    inputContracts: string[];
    consumes: string[];
    operations: RmtHostAdapterOperation[];
    stateMirrors: string[];
    schedulerEndpoints: string[];
    diagnosticsEventMatrix: string[];
    performanceBudgetFields: string[];
    diagnosticCodes: RmtStateSchedulerDiagnosticsBridgeDiagnosticCode[];
    artifactSurfaces: string[];
    kernelBoundary: string;
    minimumGates: string[];
    nextWorkpackages?: string[];
}

export interface RmtArtifactParityContract {
    id: 'xtend.rmt.artifact-parity.v1' | string;
    status: 'epic-05-wp-13-contract' | string;
    sourceOfTruth: string;
    gateCommand: string;
    artifactPaths: string[];
    entryPointTargets: string[];
    requiredFactories: string[];
    requiredContractIds: string[];
    artifactSurfaces: string[];
    driftChecks: string[];
    buildPolicy: string;
    kernelBoundary: string;
    kernelHardeningSourceOfTruth?: string;
    kernelHardeningContracts?: string[];
    kernelHardeningRuntimeHooks?: string[];
    kernelHardeningTypeSurfaces?: string[];
    kernelHardeningToolingModules?: string[];
    kernelHardeningGates?: string[];
    minimumGates: string[];
    nextWorkpackages?: string[];
}

export interface RmtAdapterDomainRecord {
    id: string;
    kind: RmtHostAdapterKind;
    version?: string;
    package?: string;
    moduleRef?: string;
    runtimeSurface?: RmtHostAdapterRuntimeSurface[];
    providedCapabilities?: string[];
    requiredCapabilities?: string[];
    preferredCapabilities?: string[];
    lifecycleContract?: string;
    kernelVisible?: boolean;
    status?: RmtAdapterRegistryStatus;
    diagnostics?: RmtHostAdapterDiagnosticEvent[];
    metadata?: Record<string, unknown>;
}

export type RmtComponentDomainKind =
    | 'custom_element'
    | 'web_component'
    | 'host_component'
    | 'template_component'
    | 'fragment'
    | string;

export interface RmtComponentDomainRecord {
    id: string;
    kind: RmtComponentDomainKind;
    adapter: string;
    tag?: string;
    renderer?: string;
    props?: Record<string, unknown> | RmtTemplateProp[];
    attributes?: Record<string, unknown>;
    slots?: Record<string, unknown>;
    events?: Record<string, unknown>;
    hydration?: Record<string, unknown> | RmtTemplateHydrationMode;
    schedule?: string | Record<string, unknown>;
    requiredCapabilities?: string[];
    preferredCapabilities?: string[];
    diagnostics?: RmtHostAdapterDiagnosticEvent[];
    metadata?: Record<string, unknown>;
}

export type RmtScheduleLane =
    | 'visible'
    | 'idle'
    | 'background'
    | 'diagnostics'
    | 'user-blocking'
    | 'transition'
    | string;

export type RmtScheduleBudgetClass =
    | 'interactive'
    | 'background'
    | 'diagnostics'
    | 'critical'
    | 'best_effort'
    | string;

export interface RmtScheduleDomainRecord {
    id: string;
    endpointName: string;
    scope: string;
    lane?: RmtScheduleLane;
    priority?: number;
    deadlineMs?: number;
    preferIdle?: boolean;
    coalesceKey?: string;
    budgetClass?: RmtScheduleBudgetClass;
    maxRetries?: number;
    timeoutMs?: number;
    diagnostics?: RmtHostAdapterDiagnosticEvent[];
    metadata?: Record<string, unknown>;
}

export type RmtSurfaceType =
    | 'window'
    | 'side-panel'
    | 'modal'
    | 'dialog'
    | 'drawer'
    | 'popover'
    | 'tooltip'
    | 'region'
    | 'toast'
    | 'lightbox'
    | 'menu'
    | string;

export type RmtSurfaceBoundsValue = number | string;
export type RmtSurfaceBoundsMode = 'fixed' | 'responsive';
export type RmtSurfaceBoundsScope = 'viewport' | 'container';

export interface RmtSurfaceBounds {
    mode?: RmtSurfaceBoundsMode;
    scope?: RmtSurfaceBoundsScope;
    x?: RmtSurfaceBoundsValue;
    y?: RmtSurfaceBoundsValue;
    width?: RmtSurfaceBoundsValue;
    height?: RmtSurfaceBoundsValue;
    minWidth?: RmtSurfaceBoundsValue;
    minHeight?: RmtSurfaceBoundsValue;
    maxWidth?: RmtSurfaceBoundsValue;
    maxHeight?: RmtSurfaceBoundsValue;
}

export interface RmtSurfaceA11y {
    role?: string;
    label?: string;
    modal?: boolean;
    focusRestore?: boolean;
    trapFocus?: boolean;
    [key: string]: unknown;
}

export interface RmtSurfaceDomainRecord {
    id: string;
    schema?: 'xtend.surface.record.v1' | string;
    type: RmtSurfaceType;
    kind?: string;
    adapter?: 'xtend.surface' | string;
    manager: string;
    component: string;
    route?: string;
    schedule?: string | Record<string, unknown>;
    stateKey?: string;
    defaultOpen?: boolean;
    active?: boolean;
    bounds?: RmtSurfaceBounds;
    placement?: string;
    mode?: string;
    layer?: string;
    capabilities?: string[];
    a11y?: RmtSurfaceA11y;
    persistence?: Record<string, unknown>;
    diagnostics?: RmtHostAdapterDiagnosticEvent[];
    metadata?: Record<string, unknown>;
}

export type RmtDslDiagnosticLevel = 'info' | 'warning' | 'error' | string;

export type RmtDslDiagnosticCode =
    | 'rmt.dsl.legacy_metadata_promoted'
    | 'rmt.dsl.reference.missing_adapter'
    | 'rmt.dsl.reference.missing_component'
    | 'rmt.dsl.reference.missing_template'
    | 'rmt.dsl.reference.missing_schedule'
    | 'rmt.dsl.reference.missing_route'
    | string;

export interface RmtDslDiagnostic {
    level: RmtDslDiagnosticLevel;
    code: RmtDslDiagnosticCode;
    message: string;
    path: string;
    metadata?: Record<string, unknown>;
}

export interface RmtDslNormalizationDomainSummary {
    source: 'top-level' | 'default-empty' | string;
    count: number;
}

export interface RmtDslReferenceGraph {
    adapters: string[];
    components: string[];
    routes: string[];
    schedules: string[];
    surfaces: string[];
    templates: string[];
}

export interface RmtDslNormalizationSummary {
    schema: 'xtend.rmt.dsl-normalization.v1' | string;
    status: 'normalized' | 'normalized_with_diagnostics' | string;
    domains: Record<string, RmtDslNormalizationDomainSummary>;
    referenceGraph: RmtDslReferenceGraph;
    diagnosticCodes: RmtDslDiagnosticCode[];
    diagnosticCount: number;
    templateOnlyCompatible: boolean;
}

export interface RmtRouteDomainRecord {
    id: string;
    path: string;
    router: string;
    title?: string;
    documentTitle?: string;
    titleTemplate?: string;
    metaDescription?: string;
    metaKeywords?: string | string[];
    component?: string;
    template?: string | Record<string, unknown>;
    redirect?: string;
    schedule?: string | Record<string, unknown>;
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
    lifecycle?: Record<string, unknown>;
    requiredCapabilities?: string[];
    preferredCapabilities?: string[];
    diagnostics?: RmtHostAdapterDiagnosticEvent[];
    metadata?: Record<string, unknown>;
}

export interface RmtResourceDescriptor {
    id: string;
    rootId: string;
    type: string;
    attachedAt: number;
    meta: Record<string, unknown>;
}

export interface RmtRootDescriptor {
    id: string;
    mounted: boolean;
    namespace: string;
    version: number;
    elementId: string;
    scheduledJobCount: number;
    resourceCount: number;
}

export interface RmtCommandEnvelope {
    type?: 'command' | string;
    commandName: string;
    rootId?: string;
    payload?: Record<string, unknown>;
    meta?: Record<string, unknown>;
    requestedAt?: number;
}

export interface RmtKernelRuntimeEscalationPolicy {
    schema?: 'xtend.rmt.kernel-escalation-policy.v1' | string;
    escalationSchema?: 'xtend.rmt.kernel-escalation.v1' | string;
    diagnosticsSubscriberFailureSeverity?: 'info' | 'warning' | 'error' | 'critical' | 'fatal' | string;
    commandHandlerFailureSeverity?: 'info' | 'warning' | 'error' | 'critical' | 'fatal' | string;
    missingCommandHandlerSeverity?: 'info' | 'warning' | 'error' | 'critical' | 'fatal' | string;
    commandSubscriberFailureSeverity?: 'info' | 'warning' | 'error' | 'critical' | 'fatal' | string;
    panicSeverityThreshold?: 'info' | 'warning' | 'error' | 'critical' | 'fatal' | string;
    diagnosticsChannel?: string;
    panicDiagnosticsChannel?: string;
    escalateCriticalDiagnostics?: boolean;
    escalateCriticalCommandFailures?: boolean;
    passthroughNonCriticalFailures?: boolean;
    redactsPayload?: boolean;
    trustRelevantActivatesPanic?: boolean;
}

export interface RmtKernelRuntimeEscalationEnvelope {
    schema: 'xtend.rmt.kernel-escalation-envelope.v1' | string;
    escalationSchema: 'xtend.rmt.kernel-escalation.v1' | string;
    policySchema: 'xtend.rmt.kernel-escalation-policy.v1' | string;
    panicMonitorSchema: 'xtend.rmt.kernel-panic-monitor.v1' | string;
    panicStateSchema: 'xtend.rmt.kernel-panic-state.v1' | string;
    workpackage: 'RKSH-WP-06' | string;
    envelopeId: string;
    source: 'diagnostics' | 'command-bus' | 'scheduler' | 'adapter' | 'kernel' | string;
    eventType: 'diagnostics-subscriber-failure' | 'command-handler-failure' | 'command-response-failed' | 'command-missing-handler' | 'command-subscriber-failure' | 'manual' | string;
    severity: 'info' | 'warning' | 'error' | 'critical' | 'fatal' | string;
    panicRelevant: boolean;
    trustRelevant: boolean;
    trigger: 'diagnostics-failure' | 'command-bus-failure' | string;
    scope: string;
    sourceRef: string | null;
    channel: string | null;
    commandName: string | null;
    correlationId: string | null;
    rootId: string | null;
    responseStatus: string | null;
    reasonCode: string;
    diagnosticCode: string;
    error: Record<string, unknown> | null;
    createdAt: number;
    panicState?: RmtKernelRuntimePanicSnapshot | Record<string, unknown> | null;
    metadata: Record<string, unknown>;
}

export interface RmtKernelRuntimeSchedulerFailurePolicy {
    schema?: 'xtend.rmt.kernel-scheduler-failure-policy.v1' | string;
    schedulerFailureSchema?: 'xtend.rmt.kernel-scheduler-failure.v1' | string;
    callbackFailureSeverity?: 'info' | 'warning' | 'error' | 'critical' | 'fatal' | string;
    abortSeverity?: 'info' | 'warning' | 'error' | 'critical' | 'fatal' | string;
    panicBlockedSeverity?: 'info' | 'warning' | 'error' | 'critical' | 'fatal' | string;
    backpressureSeverity?: 'info' | 'warning' | 'error' | 'critical' | 'fatal' | string;
    panicSeverityThreshold?: 'info' | 'warning' | 'error' | 'critical' | 'fatal' | string;
    diagnosticsChannel?: string;
    escalationDiagnosticsChannel?: string;
    callbackFailureActivatesPanic?: boolean;
    backpressureActivatesPanic?: boolean;
    trustRelevantActivatesPanic?: boolean;
    redactsPayload?: boolean;
}

export interface RmtKernelRuntimeSchedulerFailureRecord {
    schema: 'xtend.rmt.kernel-scheduler-failure-record.v1' | string;
    schedulerFailureSchema: 'xtend.rmt.kernel-scheduler-failure.v1' | string;
    policySchema: 'xtend.rmt.kernel-scheduler-failure-policy.v1' | string;
    panicMonitorSchema: 'xtend.rmt.kernel-panic-monitor.v1' | string;
    panicStateSchema: 'xtend.rmt.kernel-panic-state.v1' | string;
    workpackage: 'RKSH-WP-07' | string;
    recordId: string;
    jobId: string | number;
    status: 'failed' | 'aborted' | 'panic_blocked' | string;
    reason: string;
    severity: 'info' | 'warning' | 'error' | 'critical' | 'fatal' | string;
    panicRelevant: boolean;
    trustRelevant: boolean;
    trigger: 'scheduler-failure' | 'scheduler-backpressure' | string;
    scope: string;
    rootId: string;
    rootVersion: number;
    lane: string;
    strategy: string;
    waitMs: number;
    runMs: number;
    scheduledAt: number;
    startedAt: number;
    finishedAt: number;
    diagnosticCode: string;
    reasonCode: string;
    error: Record<string, unknown> | null;
    metadata: Record<string, unknown>;
    panicState?: RmtKernelRuntimePanicSnapshot | Record<string, unknown> | null;
}

export interface RmtKernelRuntimePolicyParityMatrixEntry {
    id: string;
    sourceSchema: string;
    policyFamily: string;
    compileTimeCodes: string[];
    compileTimeStatuses: string[];
    runtimeScope: string;
    runtimeHooks: string[];
    runtimeSchemas: string[];
    runtimeVerdicts: Array<'trusted' | 'sanitized' | 'blocked' | 'panic' | 'recovered' | 'drift' | string>;
    trustBoundary: string | null;
    panicTrigger: string;
    recoveryAction: string;
}

export interface RmtKernelRuntimePolicyParityMatrix {
    schema: 'xtend.rmt.kernel-policy-parity-matrix.v1' | string;
    paritySchema: 'xtend.rmt.kernel-policy-parity.v1' | string;
    workpackage: 'RKSH-WP-08' | string;
    entryCount: number;
    entries: RmtKernelRuntimePolicyParityMatrixEntry[];
}

export interface RmtKernelRuntimePolicyParityAppliedPolicy {
    blockCode: string;
    sourceSchema: string;
    matrixEntryId: string;
    policyFamily: string;
    runtimeScope: string;
    runtimeHooks: string[];
    missingRuntimeHooks: string[];
    runtimeSchemas: string[];
    runtimeVerdicts: string[];
    appliedPolicy: string;
    verdict: 'trusted' | 'sanitized' | 'blocked' | 'panic' | 'recovered' | 'drift' | string;
    panicTrigger: string;
    recoveryAction: string;
    trustBoundary: string | null;
}

export interface RmtKernelRuntimePolicyParityDrift {
    schema: 'xtend.rmt.kernel-policy-parity-drift.v1' | string;
    type: 'missing-runtime-mapping' | 'missing-runtime-hook' | string;
    sourceSchema: string;
    blockCode: string;
    sourceRef: string;
    matrixEntryId?: string;
    missingRuntimeHooks?: string[];
    message: string;
}

export interface RmtKernelRuntimePolicyParityReport {
    schema: 'xtend.rmt.kernel-policy-parity-report.v1' | string;
    paritySchema: 'xtend.rmt.kernel-policy-parity.v1' | string;
    matrixSchema: 'xtend.rmt.kernel-policy-parity-matrix.v1' | string;
    workpackage: 'RKSH-WP-08' | string;
    status: 'ready' | 'drift' | string;
    ok: boolean;
    compileTimeBlockCount: number;
    appliedPolicyCount: number;
    driftCount: number;
    sourcePolicySchemas: string[];
    runtimeScopes: string[];
    runtimeCapabilities: {
        hooks: string[];
        missingDefaultHooks: string[];
    };
    compileTimeBlocks: Array<Record<string, unknown>>;
    appliedPolicies: RmtKernelRuntimePolicyParityAppliedPolicy[];
    drift: RmtKernelRuntimePolicyParityDrift[];
}

export interface RmtKernelRuntimePolicyParityController {
    schema: 'xtend.rmt.kernel-policy-parity.v1' | string;
    contract: Record<string, unknown>;
    getMatrix(): RmtKernelRuntimePolicyParityMatrix;
    createRuntimeReport(input?: Record<string, unknown>): RmtKernelRuntimePolicyParityReport;
    checkDrift(input?: Record<string, unknown>): RmtKernelRuntimePolicyParityDrift[];
    listReports(): RmtKernelRuntimePolicyParityReport[];
}

export interface RmtRootHandle {
    dispose(): boolean;
    disposeResource(resourceId: string, reason?: string): boolean;
    getElement(): RmtMountElement | null;
    getId(): string;
    getResources(): RmtResourceDescriptor[];
    getVersion(): number;
    invalidate(): number;
    attachResource(resourceId: string, resourceValue: unknown, options?: Record<string, unknown>): unknown;
    cancelScheduledWork(): number;
    off(handlerRef: unknown): boolean;
    on(eventType: string, config: Record<string, unknown>): unknown;
    once(eventType: string, config: Record<string, unknown>): unknown;
    replaceResource(resourceId: string, resourceValue: unknown, options?: Record<string, unknown>): unknown;
    attachSortable?(
        resourceId: string,
        element: RmtMountElement,
        sortableOptions?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): unknown;
}

export interface RmtInstance {
    afterPaint<T = unknown>(scope: string, callback: (context: RmtJobContext) => T | PromiseLike<T>, options?: Record<string, unknown>): RmtJobHandle<T>;
    attachResource(rootId: string, resourceId: string, resourceValue: unknown, options?: Record<string, unknown>): unknown;
    abortScope(scope: string, reason?: string): number;
    cancel(scope: string, reason?: string): number;
    cancelRoot(rootId: string): number;
    cancelScope(scope: string, reason?: string): number;
    deferred<T = unknown>(scope: string, callback: (context: RmtJobContext) => T | PromiseLike<T>, options?: Record<string, unknown>): RmtJobHandle<T>;
    describeGlobalListener(config?: Record<string, unknown>): number;
    dispatchCommand(command: string | RmtCommandEnvelope, options?: Record<string, unknown>): Promise<unknown>;
    disposeResource(rootId: string, resourceId: string, reason?: string): boolean;
    disposeRoot(rootId: string, options?: { clearHandlers?: boolean; removeState?: boolean }): boolean;
    emitRootEvent(rootId: string, eventName: string, detail?: unknown, options?: Record<string, unknown>): unknown;
    getCommandBus(): unknown;
    getDiagnosticsHub(): unknown;
    getHostAdapter(): RmtHostAdapter;
    getReactivity(): unknown;
    getScheduler(): RmtKernelScheduler;
    getSchedulerDiagnostics(): unknown;
    getSchedulerPressureLevel(): string;
    getRootElement(rootId: string): RmtMountElement | null;
    getRootHandle(rootId: string): RmtRootHandle;
    getRootState(rootId: string): unknown;
    getRootVersion(rootId: string): number;
    getSchedulerStats(): unknown;
    hasRoot(rootId: string): boolean;
    invalidateRoot(rootId: string): number;
    isCurrent(scope: string, token: number): boolean;
    listGlobalListeners(): Array<Record<string, unknown>>;
    listResources(rootId?: string): RmtResourceDescriptor[];
    listScheduledJobs(): Array<Record<string, unknown>>;
    listRoots(): RmtRootDescriptor[];
    listenGlobal(target: EventTarget, eventType: string, handler: EventListenerOrEventListenerObject, options?: Record<string, unknown>): unknown;
    mountRoot(rootId: string, element: RmtMountElement | null, options?: Record<string, unknown>): RmtRootHandle;
    mountRoots(rootDefinitions?: Array<Record<string, unknown>>): RmtRootHandle[];
    nextToken(scope: string): number;
    off(rootId: string, eventType: string | null, handlerRef: unknown): boolean;
    on(rootId: string, eventType: string, config?: Record<string, unknown>): unknown;
    once(rootId: string, eventType: string, config?: Record<string, unknown>): unknown;
    panicBlockScope(scope: string, reason?: string): number;
    reportPerformanceSample(sample?: Record<string, unknown>): unknown;
    registerBindings(bindingGroups?: Array<Record<string, unknown>> | Record<string, unknown>): unknown;
    removeGlobalListener(listenerRef: unknown): boolean;
    replaceResource(rootId: string, resourceId: string, resourceValue: unknown, options?: Record<string, unknown>): unknown;
    schedule<T = unknown>(scope: string, callback: (context: RmtJobContext) => T | PromiseLike<T>, options?: Record<string, unknown>): RmtJobHandle<T>;
}

export interface RmtCoreCapabilities {
    apiVersion: string;
    hostKind: string;
    diagnostics: boolean;
    diagnosticsHub: boolean;
    reactivity: boolean;
    commandBus: boolean;
    kernelScheduler: boolean;
    mountRoot: boolean;
    registerBindings: boolean;
    listRoots: boolean;
}

export interface RmtCore {
    apiVersion: string;
    version: string;
    compatibilityAdapters: unknown[];
    commandBus: unknown;
    diagnostics: unknown;
    diagnosticsHub: unknown;
    hostAdapter: RmtHostAdapter;
    reactivity: unknown;
    scheduler: RmtKernelScheduler;
    rmt: RmtInstance;
    getCapabilities(): RmtCoreCapabilities;
    getManifest(): RmtProductManifest;
    getCommandBus(): unknown;
    getDiagnostics(): unknown;
    getDiagnosticsHub(): unknown;
    getHostAdapter(): RmtHostAdapter;
    getReactivity(): unknown;
    getScheduler(): RmtKernelScheduler;
    getRmt(): RmtInstance;
}

export interface RmtHostContract {
    apiVersion: string;
    hostKind: string;
    publicEntrypoints: string[];
    ownershipModes: RmtOwnershipMode[];
    defaultOwnershipMode: RmtOwnershipMode;
    supportsDocumentLookup: boolean;
    supportsHydration: boolean;
    supportsReplaceChildren: boolean;
    supportsCommandTransport: boolean;
    supportsDiagnostics: boolean;
    supportsPerformanceBudgeting: boolean;
    supportsReactivity: boolean;
    supportsTemplateLoading: boolean;
    supportsTemplatePreparation: boolean;
    supportsTemplateArtifacts: boolean;
    supportsTemplateRuntimeBindings: boolean;
    supportedTemplateDocumentKinds: string[];
    supportedTemplateFileExtensions: string[];
    preferredTemplateFileExtension: string;
    supportedTemplateBindingKinds: string[];
    supportedTemplateSlotKinds: string[];
    supportedTemplateExecutionModes: string[];
    supportedTemplateHydrationModes: string[];
    supportsTemplateSlotComposition: boolean;
    supportsTemplateProps: boolean;
    supportsTemplateActionBindings: boolean;
    supportsTemplateHydrationContracts: boolean;
    supportsTemplateErrorBoundaries: boolean;
    supportsInsularHydration: boolean;
    supportsMinimalDomPatching: boolean;
    supportsWorkerPrerender: boolean;
    supportsPrewarmWorker: boolean;
    supportsServerPrerender: boolean;
}

export interface RmtIslandInput {
    id?: string;
    rootId?: string;
    element?: RmtMountElement | null;
    elementId?: string;
    selector?: string;
    namespace?: string;
    ownershipMode?: RmtOwnershipMode;
    clearChildrenBeforeMount?: boolean;
    rootOptions?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

export type RmtIslandTarget = string | RmtMountElement | RmtIslandInput;

export interface RmtIslandContract {
    rootId: string;
    element: RmtMountElement;
    elementId: string;
    namespace: string;
    ownershipMode: RmtOwnershipMode;
    mountedAt: number;
    clearChildrenBeforeMount: boolean;
    rootOptions: Record<string, unknown>;
    metadata: Record<string, unknown>;
    selector: string;
}

export interface RmtIslandDescriptor {
    rootId: string;
    elementId: string;
    namespace: string;
    ownershipMode: RmtOwnershipMode;
    mountedAt: number;
}

export interface RmtIslandHandle {
    dispatchCommand(commandName: string, payload?: Record<string, unknown>, options?: Record<string, unknown>): Promise<unknown>;
    getContract(): RmtIslandContract | null;
    getElement(): RmtMountElement | null;
    getRootHandle(): RmtRootHandle;
    getRootId(): string;
    invalidate(): number;
    unmount(options?: RmtUnmountIslandOptions): boolean;
}

export interface RmtUnmountIslandOptions {
    clearHandlers?: boolean;
    removeState?: boolean;
    clearChildren?: boolean;
}

export interface RmtDomCompat {
    apiVersion: string;
    version: string;
    finalizeIslandUnmount(contract?: Partial<RmtIslandContract>, options?: RmtUnmountIslandOptions): boolean;
    getHostContract(): RmtHostContract;
    getHostKind(): string;
    prepareIslandMount(contract?: Partial<RmtIslandContract>): RmtMountElement;
    resolveElement(target: RmtIslandTarget, options?: RmtIslandInput): RmtMountElement | null;
    supportsOwnershipMode(mode: string): boolean;
}

export interface RmtPublicApi {
    apiVersion: string;
    version: string;
    dispatchCommand(commandName: string, payload?: Record<string, unknown>, options?: Record<string, unknown>): Promise<unknown>;
    getCore(): RmtCore;
    getDomCompat(): RmtDomCompat;
    getHostContract(): RmtHostContract;
    getIslandContract(islandRef: string | RmtIslandHandle): RmtIslandContract | null;
    getIslandHandle(islandRef: string | RmtIslandHandle): RmtIslandHandle | null;
    getManifest(): RmtProductManifest;
    getRmt(): RmtInstance;
    getTemplateApi(): RmtTemplateApi | null;
    hydrateIsland(target: RmtIslandTarget, options?: RmtIslandInput): RmtIslandHandle;
    invalidateIsland(islandRef: string | RmtIslandHandle): number;
    listIslands(): RmtIslandDescriptor[];
    mountIsland(target: RmtIslandTarget, options?: RmtIslandInput): RmtIslandHandle;
    observeIsland(target: RmtIslandTarget, options?: RmtIslandInput): RmtIslandHandle;
    unmountIsland(islandRef: string | RmtIslandHandle, options?: RmtUnmountIslandOptions): boolean;
}

export interface RmtPerformanceEndpointProfile {
    endpointName: string;
    endpointGroup: string;
    requestedKind: string;
    executionMode: string;
    executionStrategy?: string;
    scope?: string;
    rootId?: string;
    renderPackageId?: string;
    lane: string;
    priority: number;
    budgetClass: string;
    delayMs?: number;
    timeoutMs?: number;
    preferIdle: boolean;
    isVisible: boolean;
    userBlocking: boolean;
    pressureLevel?: string;
    coalesceKey?: string;
    deadlineMs?: number;
    metadata: Record<string, unknown>;
}

export interface RmtPerformanceEndpointEvent {
    at: number;
    endpointName: string;
    endpointGroup: string;
    runtimeKind: string;
    rootId: string;
    lane: string;
    durationMs: number;
    waitMs: number;
    scheduled: boolean;
    async: boolean;
    status: string;
    renderPackageId: string;
    measurementPhase?: string;
    budgetId?: string;
    totalMs?: number;
    budgetStatus?: string;
    budgetViolations?: string[];
    budgetThresholds?: Record<string, number>;
    metadata: Record<string, unknown>;
}

export interface RmtPerformanceEndpointStats {
    endpointName: string;
    endpointGroup: string;
    totalCount: number;
    scheduledCount: number;
    syncCount: number;
    asyncCount: number;
    errorCount: number;
    avgDurationMs: number;
    avgWaitMs: number;
    maxDurationMs: number;
    maxWaitMs: number;
    lastAt: number;
    lastDurationMs: number;
    lastWaitMs: number;
    lastStatus: string;
    budgetViolationCount: number;
    lastBudgetStatus: string;
    lastMeasurementPhase: string;
    measurementPhaseCounts: Record<string, number>;
    lastRenderPackageId: string;
    lastRootId: string;
}

export interface RmtPerformanceBudgetProfile {
    budgetId: string;
    label: string;
    endpointName: string;
    endpointGroup: string;
    budgetClass: string;
    maxDurationMs: number;
    maxWaitMs: number;
    maxTotalMs: number;
    maxLongTaskMs: number;
    metadata: Record<string, unknown>;
}

export interface RmtPerformanceBudgetEvaluation {
    budgetId: string;
    label: string;
    endpointName: string;
    endpointGroup: string;
    budgetClass: string;
    measurementPhase: string;
    renderPackageId: string;
    rootId: string;
    durationMs: number;
    waitMs: number;
    totalMs: number;
    longTaskMs: number;
    withinBudget: boolean;
    status: string;
    violations: string[];
    thresholds: Record<string, number>;
    metadata: Record<string, unknown>;
}

export interface RmtPerformanceBudgetSummary {
    budgetId: string;
    label: string;
    totalCount: number;
    withinBudgetCount: number;
    violationCount: number;
    maxDurationMs: number;
    maxWaitMs: number;
    maxTotalMs: number;
    lastStatus: string;
    lastMeasurementPhase: string;
    measurementPhaseCounts: Record<string, number>;
    lastRenderPackageId: string;
    lastRootId: string;
    endpointNames: string[];
    renderPackageIds: string[];
}

export interface RmtPerformancePhaseSummary {
    measurementPhase: string;
    totalCount: number;
    withinBudgetCount: number;
    violationCount: number;
    maxDurationMs: number;
    maxWaitMs: number;
    maxTotalMs: number;
    lastStatus: string;
    budgetIds: string[];
    renderPackageIds: string[];
}

export interface RmtPerformanceBudgetSnapshot {
    runtimeKind: string;
    updatedAt: number;
    reason: string;
    pressureLevel: string;
    totals: {
        totalCount: number;
        withinBudgetCount: number;
        violationCount: number;
    };
    budgets: RmtPerformanceBudgetSummary[];
    phaseTotals: {
        totalCount: number;
        withinBudgetCount: number;
        violationCount: number;
    };
    phases: RmtPerformancePhaseSummary[];
    violations: Array<{
        at: number;
        budgetId: string;
        endpointName: string;
        measurementPhase: string;
        renderPackageId: string;
        rootId: string;
        durationMs: number;
        waitMs: number;
        totalMs: number;
        violations: string[];
    }>;
}

export interface RmtBrowserNativeMetricSample {
    at: number;
    runtimeKind: string;
    signalType: string;
    nativeEntryType: string;
    source: string;
    reason: string;
    durationMs: number;
    waitMs: number;
    inputDelayMs: number;
    frameIntervalMs: number;
    droppedFrameCount: number;
    longTask: boolean;
    inputPending: boolean;
    fallback: boolean;
    memory: Record<string, unknown> | null;
    metadata: Record<string, unknown>;
}

export interface RmtBrowserSignalSnapshot {
    kind: 'rmt_browser_native_metrics' | string;
    runtimeKind: string;
    updatedAt: number;
    reason: string;
    available: boolean;
    started: boolean;
    fallbackActive: boolean;
    capabilities: Record<string, unknown>;
    observers: Array<{ entryType: string }>;
    observerErrors: Array<Record<string, unknown>>;
    lastMemory: Record<string, unknown> | null;
    lastInputPending: boolean | null;
    pressureLevel: string;
    summary: Record<string, number | string>;
    history: RmtBrowserNativeMetricSample[];
}

export interface RmtBackpressureProfile {
    kind: 'rmt_backpressure_profile' | string;
    runtimeKind: string;
    updatedAt: number;
    reason: string;
    pressureLevel: string;
    internalPressureLevel: string;
    browserPressureLevel: string;
    fallbackActive: boolean;
    chunkScale: number;
    followupChunkScale: number;
    prewarmFootprintRatio: number;
    prewarmMaxItems: number;
    prewarmMaxDomNodes: number;
    preferIdle: boolean;
    delayMultiplier: number;
    signals: Record<string, number | string | boolean>;
}

export interface RmtPerformanceMetricComparison {
    kind: 'rmt_metric_comparison' | string;
    runtimeKind: string;
    updatedAt: number;
    reason: string;
    internal: Record<string, number | string>;
    browserNative: Record<string, number | string>;
    pressureDelta: number;
    combinedPressureLevel: string;
}

export interface RmtPerformanceSnapshot {
    runtimeKind: string;
    updatedAt: number;
    reason: string;
    pressureLevel: string;
    endpoints: RmtPerformanceEndpointStats[];
    history: RmtPerformanceEndpointEvent[];
    budgets: RmtPerformanceBudgetSummary[];
    budgetTotals: {
        totalCount: number;
        withinBudgetCount: number;
        violationCount: number;
    };
    phaseTotals: {
        totalCount: number;
        withinBudgetCount: number;
        violationCount: number;
    };
    phases: RmtPerformancePhaseSummary[];
    budgetViolations: Array<{
        at: number;
        budgetId: string;
        endpointName: string;
        measurementPhase: string;
        renderPackageId: string;
        rootId: string;
        durationMs: number;
        waitMs: number;
        totalMs: number;
        violations: string[];
    }>;
    browserSignals: RmtBrowserSignalSnapshot;
    metricComparison: RmtPerformanceMetricComparison;
    backpressureProfile: RmtBackpressureProfile;
}

export interface RmtPerformanceRunReport {
    kind: 'rmt_performance_run_report' | string;
    runtimeKind: string;
    exportedAt: number;
    reason: string;
    runId: string;
    label: string;
    metadata: Record<string, unknown>;
    filters: {
        endpointNames: string[];
        measurementPhases: string[];
        renderPackageIds: string[];
        rootIds: string[];
    };
    summary: {
        endpointCount: number;
        sampleCount: number;
        budgetCount: number;
        phaseCount: number;
        renderPackageCount: number;
        rootCount: number;
        violationCount: number;
        firstSampleAt: number;
        lastSampleAt: number;
        windowMs: number;
        pressureLevel: string;
    };
    snapshot: RmtPerformanceSnapshot;
    renderPackages: Array<{
        renderPackageId: string;
        totalCount: number;
        withinBudgetCount: number;
        violationCount: number;
        maxDurationMs: number;
        maxWaitMs: number;
        maxTotalMs: number;
        lastAt: number;
        lastMeasurementPhase: string;
        lastStatus: string;
        budgetIds: string[];
        endpointNames: string[];
        rootIds: string[];
    }>;
    roots: Array<{
        rootId: string;
        totalCount: number;
        withinBudgetCount: number;
        violationCount: number;
        maxDurationMs: number;
        maxWaitMs: number;
        maxTotalMs: number;
        lastAt: number;
        lastMeasurementPhase: string;
        lastStatus: string;
        budgetIds: string[];
        endpointNames: string[];
        renderPackageIds: string[];
    }>;
}

export interface RmtPerformanceRunComparison {
    kind: 'rmt_performance_run_comparison' | string;
    runtimeKind: string;
    comparedAt: number;
    label: string;
    baseRunId: string;
    targetRunId: string;
    baseLabel: string;
    targetLabel: string;
    summary: {
        sampleCountDelta: number;
        budgetCountDelta: number;
        phaseCountDelta: number;
        renderPackageCountDelta: number;
        rootCountDelta: number;
        violationCountDelta: number;
        windowMsDelta: number;
    };
    budgetDeltas: Array<{
        budgetId: string;
        baseTotalCount: number;
        targetTotalCount: number;
        totalCountDelta: number;
        baseWithinBudgetCount: number;
        targetWithinBudgetCount: number;
        withinBudgetDelta: number;
        baseViolationCount: number;
        targetViolationCount: number;
        violationDelta: number;
        baseMaxTotalMs: number;
        targetMaxTotalMs: number;
        maxTotalMsDelta: number;
        baseLastStatus: string;
        targetLastStatus: string;
        baseLastMeasurementPhase: string;
        targetLastMeasurementPhase: string;
    }>;
    phaseDeltas: Array<{
        measurementPhase: string;
        baseTotalCount: number;
        targetTotalCount: number;
        totalCountDelta: number;
        baseWithinBudgetCount: number;
        targetWithinBudgetCount: number;
        withinBudgetDelta: number;
        baseViolationCount: number;
        targetViolationCount: number;
        violationDelta: number;
        baseMaxTotalMs: number;
        targetMaxTotalMs: number;
        maxTotalMsDelta: number;
        baseLastStatus: string;
        targetLastStatus: string;
        baseLastMeasurementPhase: string;
        targetLastMeasurementPhase: string;
    }>;
    renderPackageDeltas: Array<{
        renderPackageId: string;
        baseTotalCount: number;
        targetTotalCount: number;
        totalCountDelta: number;
        baseWithinBudgetCount: number;
        targetWithinBudgetCount: number;
        withinBudgetDelta: number;
        baseViolationCount: number;
        targetViolationCount: number;
        violationDelta: number;
        baseMaxTotalMs: number;
        targetMaxTotalMs: number;
        maxTotalMsDelta: number;
        baseLastStatus: string;
        targetLastStatus: string;
        baseLastMeasurementPhase: string;
        targetLastMeasurementPhase: string;
    }>;
    rootDeltas: Array<{
        rootId: string;
        baseTotalCount: number;
        targetTotalCount: number;
        totalCountDelta: number;
        baseWithinBudgetCount: number;
        targetWithinBudgetCount: number;
        withinBudgetDelta: number;
        baseViolationCount: number;
        targetViolationCount: number;
        violationDelta: number;
        baseMaxTotalMs: number;
        targetMaxTotalMs: number;
        maxTotalMsDelta: number;
        baseLastStatus: string;
        targetLastStatus: string;
        baseLastMeasurementPhase: string;
        targetLastMeasurementPhase: string;
    }>;
}

export interface RmtPerformanceBaseline {
    kind: 'rmt_performance_baseline' | string;
    runtimeKind: string;
    createdAt: number;
    baselineId: string;
    label: string;
    metadata: Record<string, unknown>;
    summary: {
        runCount: number;
        avgSampleCount: number;
        avgViolationCount: number;
        avgWindowMs: number;
        minWindowMs: number;
        maxWindowMs: number;
        avgBudgetCount: number;
        avgPhaseCount: number;
        avgRenderPackageCount: number;
        avgRootCount: number;
    };
    runs: Array<{
        runId: string;
        label: string;
        exportedAt: number;
    }>;
    budgets: Array<{
        budgetId: string;
        runCount: number;
        coverage: number;
        avgTotalCount: number;
        avgWithinBudgetCount: number;
        avgViolationCount: number;
        avgMaxTotalMs: number;
        minTotalCount: number;
        maxTotalCount: number;
        minMaxTotalMs: number;
        maxMaxTotalMs: number;
        latestStatus: string;
        latestMeasurementPhase: string;
    }>;
    phases: Array<{
        measurementPhase: string;
        runCount: number;
        coverage: number;
        avgTotalCount: number;
        avgWithinBudgetCount: number;
        avgViolationCount: number;
        avgMaxTotalMs: number;
        minTotalCount: number;
        maxTotalCount: number;
        minMaxTotalMs: number;
        maxMaxTotalMs: number;
        latestStatus: string;
        latestMeasurementPhase: string;
    }>;
    renderPackages: Array<{
        renderPackageId: string;
        runCount: number;
        coverage: number;
        avgTotalCount: number;
        avgWithinBudgetCount: number;
        avgViolationCount: number;
        avgMaxTotalMs: number;
        minTotalCount: number;
        maxTotalCount: number;
        minMaxTotalMs: number;
        maxMaxTotalMs: number;
        latestStatus: string;
        latestMeasurementPhase: string;
    }>;
    roots: Array<{
        rootId: string;
        runCount: number;
        coverage: number;
        avgTotalCount: number;
        avgWithinBudgetCount: number;
        avgViolationCount: number;
        avgMaxTotalMs: number;
        minTotalCount: number;
        maxTotalCount: number;
        minMaxTotalMs: number;
        maxMaxTotalMs: number;
        latestStatus: string;
        latestMeasurementPhase: string;
    }>;
}

export interface RmtPerformanceTrendSeries {
    kind: 'rmt_performance_trend_series' | string;
    runtimeKind: string;
    createdAt: number;
    seriesId: string;
    label: string;
    metadata: Record<string, unknown>;
    summary: {
        runCount: number;
        budgetSeriesCount: number;
        phaseSeriesCount: number;
        renderPackageSeriesCount: number;
        rootSeriesCount: number;
    };
    runs: Array<{
        runId: string;
        label: string;
        exportedAt: number;
        sampleCount: number;
        violationCount: number;
        windowMs: number;
        pressureLevel: string;
    }>;
    budgets: Array<{
        budgetId: string;
        pointCount: number;
        points: Array<{
            runId: string;
            label: string;
            exportedAt: number;
            totalCount: number;
            withinBudgetCount: number;
            violationCount: number;
            maxTotalMs: number;
            lastStatus: string;
            lastMeasurementPhase: string;
        }>;
    }>;
    phases: Array<{
        measurementPhase: string;
        pointCount: number;
        points: Array<{
            runId: string;
            label: string;
            exportedAt: number;
            totalCount: number;
            withinBudgetCount: number;
            violationCount: number;
            maxTotalMs: number;
            lastStatus: string;
            lastMeasurementPhase: string;
        }>;
    }>;
    renderPackages: Array<{
        renderPackageId: string;
        pointCount: number;
        points: Array<{
            runId: string;
            label: string;
            exportedAt: number;
            totalCount: number;
            withinBudgetCount: number;
            violationCount: number;
            maxTotalMs: number;
            lastStatus: string;
            lastMeasurementPhase: string;
        }>;
    }>;
    roots: Array<{
        rootId: string;
        pointCount: number;
        points: Array<{
            runId: string;
            label: string;
            exportedAt: number;
            totalCount: number;
            withinBudgetCount: number;
            violationCount: number;
            maxTotalMs: number;
            lastStatus: string;
            lastMeasurementPhase: string;
        }>;
    }>;
}

export interface RmtPerformanceBaselineComparison {
    kind: 'rmt_performance_baseline_comparison' | string;
    runtimeKind: string;
    comparedAt: number;
    label: string;
    runId: string;
    baselineId: string;
    runLabel: string;
    baselineLabel: string;
    summary: {
        sampleCountDelta: number;
        violationCountDelta: number;
        windowMsDelta: number;
        budgetCountDelta: number;
        phaseCountDelta: number;
        renderPackageCountDelta: number;
        rootCountDelta: number;
    };
    budgets: Array<{
        budgetId: string;
        baselineRunCount: number;
        baselineCoverage: number;
        reportTotalCount: number;
        baselineAvgTotalCount: number;
        totalCountDelta: number;
        reportWithinBudgetCount: number;
        baselineAvgWithinBudgetCount: number;
        withinBudgetDelta: number;
        reportViolationCount: number;
        baselineAvgViolationCount: number;
        violationDelta: number;
        reportMaxTotalMs: number;
        baselineAvgMaxTotalMs: number;
        maxTotalMsDelta: number;
        reportLastStatus: string;
        baselineLatestStatus: string;
        reportLastMeasurementPhase: string;
        baselineLatestMeasurementPhase: string;
    }>;
    phases: Array<{
        measurementPhase: string;
        baselineRunCount: number;
        baselineCoverage: number;
        reportTotalCount: number;
        baselineAvgTotalCount: number;
        totalCountDelta: number;
        reportWithinBudgetCount: number;
        baselineAvgWithinBudgetCount: number;
        withinBudgetDelta: number;
        reportViolationCount: number;
        baselineAvgViolationCount: number;
        violationDelta: number;
        reportMaxTotalMs: number;
        baselineAvgMaxTotalMs: number;
        maxTotalMsDelta: number;
        reportLastStatus: string;
        baselineLatestStatus: string;
        reportLastMeasurementPhase: string;
        baselineLatestMeasurementPhase: string;
    }>;
    renderPackages: Array<{
        renderPackageId: string;
        baselineRunCount: number;
        baselineCoverage: number;
        reportTotalCount: number;
        baselineAvgTotalCount: number;
        totalCountDelta: number;
        reportWithinBudgetCount: number;
        baselineAvgWithinBudgetCount: number;
        withinBudgetDelta: number;
        reportViolationCount: number;
        baselineAvgViolationCount: number;
        violationDelta: number;
        reportMaxTotalMs: number;
        baselineAvgMaxTotalMs: number;
        maxTotalMsDelta: number;
        reportLastStatus: string;
        baselineLatestStatus: string;
        reportLastMeasurementPhase: string;
        baselineLatestMeasurementPhase: string;
    }>;
    roots: Array<{
        rootId: string;
        baselineRunCount: number;
        baselineCoverage: number;
        reportTotalCount: number;
        baselineAvgTotalCount: number;
        totalCountDelta: number;
        reportWithinBudgetCount: number;
        baselineAvgWithinBudgetCount: number;
        withinBudgetDelta: number;
        reportViolationCount: number;
        baselineAvgViolationCount: number;
        violationDelta: number;
        reportMaxTotalMs: number;
        baselineAvgMaxTotalMs: number;
        maxTotalMsDelta: number;
        reportLastStatus: string;
        baselineLatestStatus: string;
        reportLastMeasurementPhase: string;
        baselineLatestMeasurementPhase: string;
    }>;
}

export interface RmtPerformanceHarnessOutput {
    kind: 'rmt_performance_harness_output' | string;
    runtimeKind: string;
    exportedAt: number;
    reason: string;
    outputId: string;
    label: string;
    metadata: Record<string, unknown>;
    batchId: string;
    batchLabel: string;
    runReport: RmtPerformanceRunReport | null;
    baseline: RmtPerformanceBaseline | null;
    trendSeries: RmtPerformanceTrendSeries | null;
    baselineComparison: RmtPerformanceBaselineComparison | null;
    historySummary: {
        persistedOutputCount: number;
        persistedRunCount: number;
        baselineRunCount: number;
        trendRunCount: number;
        storageBackend: string;
        storageKey: string;
        persistentAvailable: boolean;
    };
}

export interface RmtPerformanceHarnessHistory {
    kind: 'rmt_performance_harness_history' | string;
    runtimeKind: string;
    exportedAt: number;
    historyId: string;
    label: string;
    metadata: Record<string, unknown>;
    summary: {
        outputCount: number;
        runCount: number;
        baselineRunCount: number;
        trendRunCount: number;
        latestOutputId: string;
        storageBackend: string;
        storageKey: string;
        persistentAvailable: boolean;
    };
    outputs: Array<RmtPerformanceHarnessOutput>;
    baseline: RmtPerformanceBaseline | null;
    trendSeries: RmtPerformanceTrendSeries | null;
}

export interface RmtPerformanceBatchSeries {
    kind: 'rmt_performance_batch_series' | string;
    runtimeKind: string;
    createdAt: number;
    seriesId: string;
    label: string;
    metadata: Record<string, unknown>;
    summary: {
        batchCount: number;
        outputCount: number;
        runCount: number;
    };
    batches: Array<{
        batchId: string;
        batchLabel: string;
        outputCount: number;
        runCount: number;
        firstExportedAt: number;
        lastExportedAt: number;
        latestOutputId: string;
        latestRunId: string;
        baseline: RmtPerformanceBaseline | null;
        trendSeries: RmtPerformanceTrendSeries | null;
        outputs: Array<{
            outputId: string;
            runId: string;
            label: string;
            exportedAt: number;
            violationCount: number;
            windowMs: number;
            pressureLevel: string;
        }>;
    }>;
}

export interface RmtPerformanceFileArtifact {
    kind: 'rmt_performance_file_artifact' | string;
    runtimeKind: string;
    createdAt: number;
    artifactId: string;
    label: string;
    artifactType: string;
    format: 'json' | string;
    fileName: string;
    contentType: string;
    metadata: Record<string, unknown>;
    payload: Record<string, unknown> | Array<unknown> | string | number | boolean | null;
    text: string;
}

export interface RmtPerformanceCiSummary {
    kind: 'rmt_performance_ci_summary' | string;
    runtimeKind: string;
    createdAt: number;
    summaryId: string;
    title: string;
    metadata: Record<string, unknown>;
    text: string;
}

export interface RmtPerformanceArtifactWriteResult {
    kind: 'rmt_performance_artifact_write_result' | 'rmt_performance_ci_summary_write_result' | string;
    runtimeKind: string;
    wroteAt: number;
    ok: boolean;
    deferred: boolean;
    targetKind: string;
    relativePath: string;
    fileName?: string;
    artifactId?: string;
    artifactType?: string;
    summaryId?: string;
    bytes?: number;
    backendResult?: Record<string, unknown> | Array<unknown> | string | number | boolean | null;
}

export interface RmtPerformanceBatchHarnessRun {
    kind: 'rmt_performance_batch_harness_run' | string;
    runtimeKind: string;
    createdAt: number;
    label: string;
    outputCount: number;
    persisted: boolean;
    outputs: Array<RmtPerformanceHarnessOutput>;
    batchSeries: RmtPerformanceBatchSeries | null;
    history: RmtPerformanceHarnessHistory | null;
    artifactWrites: Record<string, unknown> | null;
    summaryWrite: RmtPerformanceArtifactWriteResult | null;
}

export interface RmtPerformanceAutomationHarnessRun extends RmtPerformanceBatchHarnessRun {
    kind: 'rmt_performance_automation_harness_run' | string;
    automation: boolean;
    adapterKind: string;
}

export interface RmtPerformanceNightlyTrendlineNight {
    nightlyKey: string;
    nightlyLabel: string;
    outputCount: number;
    runCount: number;
    firstExportedAt: number;
    lastExportedAt: number;
    latestOutputId: string;
    latestRunId: string;
    baseline: RmtPerformanceBaseline | null;
    trendSeries: RmtPerformanceTrendSeries | null;
    comparisonToPreviousNight: RmtPerformanceRunComparison | null;
    outputs: Array<Record<string, unknown>>;
}

export interface RmtPerformanceNightlyTrendlines {
    kind: 'rmt_performance_nightly_trendlines' | string;
    runtimeKind: string;
    createdAt: number;
    trendlineId: string;
    label: string;
    metadata: Record<string, unknown>;
    summary: {
        nightCount: number;
        outputCount: number;
        runCount: number;
    };
    nights: Array<RmtPerformanceNightlyTrendlineNight>;
}

export interface RmtPerformanceExternalExportResult {
    kind: 'rmt_performance_external_export_result' | 'rmt_performance_external_batch_export' | string;
    runtimeKind: string;
    exportedAt: number;
    ok?: boolean;
    deferred?: boolean;
    targetKind?: string;
    targetPath?: string;
    fileName?: string;
    artifactId?: string;
    artifactType?: string;
    bytes?: number;
    batchSeriesId?: string;
    exportCount?: number;
    exports?: Array<RmtPerformanceExternalExportResult>;
    backendResult?: Record<string, unknown> | Array<unknown> | string | number | boolean | null;
}

export interface RmtPerformanceHistoryStorageStatus {
    storageKey: string;
    backend: string;
    persistentAvailable: boolean;
    memoryFallbackActive: boolean;
    historyLimit: number;
}

export interface RmtPerformanceRuntime {
    runtimeKind: string;
    endpointEventChannel: string;
    budgetEvaluationChannel: string;
    snapshotChannel: string;
    browserSignalChannel: string;
    backpressureProfileChannel: string;
    evaluateBudget(endpointName: string, sample?: Partial<RmtPerformanceEndpointEvent>, options?: Record<string, unknown>): RmtPerformanceBudgetEvaluation;
    evaluateBudgets(reasonOrOptions?: string | Record<string, unknown>, maybeOptions?: Record<string, unknown>): RmtPerformanceBudgetSnapshot;
    exportRunReport(reasonOrOptions?: string | Record<string, unknown>, maybeOptions?: Record<string, unknown>): RmtPerformanceRunReport;
    compareRunReports(baseReport: RmtPerformanceRunReport | Record<string, unknown>, targetReport: RmtPerformanceRunReport | Record<string, unknown>, options?: Record<string, unknown>): RmtPerformanceRunComparison;
    createRunBaseline(reportInputs?: Array<RmtPerformanceRunReport | Record<string, unknown>>, options?: Record<string, unknown>): RmtPerformanceBaseline;
    createTrendSeries(reportInputs?: Array<RmtPerformanceRunReport | Record<string, unknown>>, options?: Record<string, unknown>): RmtPerformanceTrendSeries;
    compareRunReportToBaseline(report: RmtPerformanceRunReport | Record<string, unknown>, baseline: RmtPerformanceBaseline | Record<string, unknown>, options?: Record<string, unknown>): RmtPerformanceBaselineComparison;
    createHarnessOutput(reasonOrOptions?: string | Record<string, unknown>, maybeOptions?: Record<string, unknown>): RmtPerformanceHarnessOutput;
    createBatchSeries(outputInputs?: Array<RmtPerformanceHarnessOutput | Record<string, unknown>>, options?: Record<string, unknown>): RmtPerformanceBatchSeries;
    createNightlyTrendlines(outputInputs?: Array<RmtPerformanceHarnessOutput | Record<string, unknown>>, options?: Record<string, unknown>): RmtPerformanceNightlyTrendlines;
    createCiSummary(sourceOrOptions?: Record<string, unknown>, maybeOptions?: Record<string, unknown>): RmtPerformanceCiSummary;
    createFileArtifact(sourceOrOptions?: Record<string, unknown>, maybeOptions?: Record<string, unknown>): RmtPerformanceFileArtifact;
    publishArtifactToTarget(artifactOrSource?: Record<string, unknown>, options?: Record<string, unknown>): Promise<RmtPerformanceExternalExportResult>;
    publishBatchToTarget(seriesOrOutputs?: Record<string, unknown> | Array<Record<string, unknown>>, options?: Record<string, unknown>): Promise<RmtPerformanceExternalExportResult>;
    writeArtifact(artifactOrSource?: Record<string, unknown>, options?: Record<string, unknown>): RmtPerformanceArtifactWriteResult;
    writeBatchArtifacts(seriesOrOutputs?: Record<string, unknown> | Array<Record<string, unknown>>, options?: Record<string, unknown>): Record<string, unknown>;
    writeCiSummary(summaryOrSource?: Record<string, unknown>, options?: Record<string, unknown>): RmtPerformanceArtifactWriteResult;
    persistHarnessOutput(outputOrReason?: RmtPerformanceHarnessOutput | string | Record<string, unknown>, maybeOptions?: Record<string, unknown>): RmtPerformanceHarnessOutput;
    exportPersistedHistory(options?: Record<string, unknown>): RmtPerformanceHarnessHistory;
    listPersistedHarnessOutputs(limit?: number): RmtPerformanceHarnessOutput[];
    clearPersistedHistory(): boolean;
    getHistoryStorageStatus(): RmtPerformanceHistoryStorageStatus;
    getDiagnosticsHub(): unknown;
    getBudgetProfile(endpointName: string, options?: Record<string, unknown>): RmtPerformanceBudgetProfile;
    getEndpointProfile(endpointName: string): RmtPerformanceEndpointProfile;
    getBackpressureProfile(reason?: string): RmtBackpressureProfile;
    getBrowserSignalSnapshot(reason?: string): RmtBrowserSignalSnapshot;
    getRmt(): RmtInstance | null;
    getSnapshot(reason?: string): RmtPerformanceSnapshot;
    listBudgetProfiles(): RmtPerformanceBudgetProfile[];
    listEndpointProfiles(): RmtPerformanceEndpointProfile[];
    listMeasurementPhases(): string[];
    recordBrowserSignalSample(sample?: Partial<RmtBrowserNativeMetricSample>, options?: Record<string, unknown>): RmtBrowserNativeMetricSample;
    reportEndpointSample(endpointName: string, sample?: Partial<RmtPerformanceEndpointEvent>, options?: Record<string, unknown>): RmtPerformanceEndpointEvent;
    resolveBudgetProfile(endpointName: string, options?: Record<string, unknown>): RmtPerformanceBudgetProfile;
    resolveEndpointPlan(endpointName: string, options?: Record<string, unknown>): RmtPerformanceEndpointProfile;
    reset(): boolean;
    runEndpoint<T = unknown>(endpointName: string, callback: (plan: RmtPerformanceEndpointProfile) => T | Promise<T>, options?: Record<string, unknown>): T | Promise<T>;
    runBatchHarness(runInputs: Array<Record<string, unknown>>, runner: (input: Record<string, unknown>, index: number, context: Record<string, unknown>) => unknown | Promise<unknown>, options?: Record<string, unknown>): Promise<RmtPerformanceBatchHarnessRun>;
    runAutomationHarness(runInputs: Array<Record<string, unknown>>, automationAdapter: Record<string, unknown> | ((input: Record<string, unknown>, index: number, context: Record<string, unknown>) => unknown | Promise<unknown>), options?: Record<string, unknown>): Promise<RmtPerformanceAutomationHarnessRun>;
    sampleBrowserNativeState(reason?: string, options?: Record<string, unknown>): RmtBrowserSignalSnapshot;
    scheduleEndpoint(endpointName: string, scope: string, callback: (jobContext: Record<string, unknown>) => unknown, options?: Record<string, unknown>): unknown;
    startBrowserSignalCollection(options?: Record<string, unknown>): RmtBrowserSignalSnapshot;
    stopBrowserSignalCollection(reason?: string): RmtBrowserSignalSnapshot;
}

export interface RmtDocumentManifest {
    documentId: string;
    namespace: string;
    contentType: string;
    loaderHint: string;
    sourceUrl: string;
    metadata: Record<string, unknown>;
    reactivityHints: Record<string, unknown>;
}

export interface RmtRegisteredTemplate {
    id: string;
    qualifiedId: string;
    namespace: string;
    mode: RmtTemplateMode;
    markup: string;
    props: RmtTemplateProp[];
    bindings: RmtTemplateRuntimeBinding[];
    slots: RmtTemplateSlot[];
    hydration: RmtTemplateHydrationContract;
    errorBoundary: RmtTemplateErrorBoundary;
    metadata: Record<string, unknown>;
    reactivityHints: Record<string, unknown>;
    documentId: string;
    sourceUrl: string;
    loaderHint: string;
}

export interface RmtDocument {
    kind: 'rmt_document' | string;
    version: string;
    manifest: RmtDocumentManifest;
    adapters?: RmtAdapterDomainRecord[];
    components?: RmtComponentDomainRecord[];
    routes?: RmtRouteDomainRecord[];
    schedules?: RmtScheduleDomainRecord[];
    surfaces?: RmtSurfaceDomainRecord[];
    diagnostics?: RmtDslDiagnostic[];
    normalization?: RmtDslNormalizationSummary;
    templates: RmtRegisteredTemplate[];
}

export interface RmtTemplateProp {
    name: string;
    source: string;
    type?: string;
    required?: boolean;
    hasDefault?: boolean;
    defaultValue?: unknown;
    attribute?: string;
    property?: string;
    reflect?: boolean;
    metadata?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface RmtTemplateHydrationContract {
    mode?: RmtTemplateHydrationMode;
    executionMode?: RmtTemplateHydrationMode;
    ownershipMode?: RmtOwnershipMode | string;
    autoHydrate?: boolean | null;
    preferInsularHydration?: boolean;
    clearChildrenBeforeMount?: boolean | null;
    transport?: string;
    metadata?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface RmtTemplateErrorBoundary {
    enabled: boolean;
    name?: string;
    target?: string;
    fallbackMarkup?: string;
    fallbackText?: string;
    fallbackTemplate?: string | Record<string, unknown> | null;
    modelSource?: string;
    capture?: boolean;
    emitEvent?: string;
    metadata?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface RmtTemplateRuntimeBinding {
    kind: RmtTemplateBindingKind;
    bindingId?: string;
    target?: string;
    source?: string;
    sourceName?: string;
    attribute?: string;
    property?: string;
    className?: string;
    eventType?: string;
    commandName?: string;
    eventName?: string;
    action?: string;
    actionAttribute?: string;
    setActionAttribute?: boolean;
    payloadSource?: string;
    payload?: unknown;
    detail?: unknown;
    fallback?: unknown;
    invert?: boolean;
    preventDefault?: boolean;
    stopPropagation?: boolean;
    capture?: boolean;
    passive?: boolean;
    once?: boolean;
    includeInteractionMeta?: boolean;
    supersessionKey?: string;
    payloadContract?: unknown;
    payloadAdapter?: unknown;
    closest?: string;
    condition?: unknown;
    guard?: unknown;
    postAction?: unknown | unknown[];
    commandTarget?: unknown;
    lane?: string;
    template?: string | Record<string, unknown> | null;
    templateSource?: string;
    modelSource?: string;
    itemsSource?: string;
    itemAlias?: string;
    indexAlias?: string;
    wrapperTag?: string;
    clearWhenMissing?: boolean;
    removeWhenEmpty?: boolean;
    emptyMarkup?: string;
    metadata?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface RmtTemplateSlot {
    name?: string;
    kind: RmtTemplateSlotKind;
    target?: string;
    source?: string;
    sourceName?: string;
    modelSource?: string;
    fallback?: unknown;
    template?: string | Record<string, unknown> | null;
    markup?: string;
    clearWhenMissing?: boolean;
    emptyMarkup?: string;
    metadata?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface RmtTemplateDocumentRegistration {
    documentId: string;
    namespace: string;
    sourceUrl: string;
    contentType: string;
    metadata: Record<string, unknown>;
    reactivityHints: Record<string, unknown>;
    templateCount: number;
    templateIds: string[];
}

export interface RmtPreparedTemplateDependencyRef {
    kind: string;
    id?: string;
    qualifiedId?: string;
    namespace?: string;
    path?: string;
}

export interface RmtPreparedTemplate {
    kind: 'rmt_prepared_template' | string;
    version: string;
    preparedAt: number;
    id: string;
    qualifiedId: string;
    namespace: string;
    documentId: string;
    sourceUrl: string;
    loaderHint: string;
    mode: RmtTemplateMode;
    markup: string;
    props: RmtTemplateProp[];
    bindings: RmtTemplateRuntimeBinding[];
    slots: RmtTemplateSlot[];
    hydration: RmtTemplateHydrationContract;
    errorBoundary: RmtTemplateErrorBoundary;
    metadata: Record<string, unknown>;
    reactivityHints: Record<string, unknown>;
    dependencyRefs: RmtPreparedTemplateDependencyRef[];
    structureSignature: string;
    fingerprint: string;
    sourceFingerprint: string;
}

export interface RmtPreparedDocument {
    kind: 'rmt_prepared_document' | string;
    version: string;
    preparedAt: number;
    documentId: string;
    namespace: string;
    sourceUrl: string;
    contentType: string;
    metadata: Record<string, unknown>;
    reactivityHints: Record<string, unknown>;
    fingerprint: string;
    sourceFingerprint: string;
    templateCount: number;
    templateIds: string[];
    templates: RmtPreparedTemplate[];
}

export interface RmtTemplateRegistry {
    getDocument(documentId: string, fallbackValue?: null): RmtTemplateDocumentRegistration | null;
    getTemplate(templateRef: string | Record<string, unknown>, options?: Record<string, unknown>): RmtRegisteredTemplate | null;
    hasDocument(documentId: string): boolean;
    hasTemplate(templateRef: string | Record<string, unknown>, options?: Record<string, unknown>): boolean;
    listDocuments(): RmtTemplateDocumentRegistration[];
    listTemplates(): RmtRegisteredTemplate[];
    registerDocument(documentInput: string | Record<string, unknown>, options?: Record<string, unknown>): RmtTemplateDocumentRegistration;
    registerTemplate(templateInput: Record<string, unknown>, options?: Record<string, unknown>): RmtRegisteredTemplate;
    removeDocument(documentId: string): boolean;
    removeTemplate(templateRef: string | Record<string, unknown>, options?: Record<string, unknown>): boolean;
    reset(): boolean;
    resolveTemplate(templateRef: string | Record<string, unknown>, options?: Record<string, unknown>): RmtRegisteredTemplate | null;
}

export interface RmtFormat {
    contentType: string;
    documentKind: string;
    documentVersion: string;
    createEmptyDocument(options?: Record<string, unknown>): RmtDocument;
    describeSourceFile(sourceUrl: string): {
        fileExtension: string;
        isPreferredRmtExtension: boolean;
        isJsonFallbackExtension: boolean;
        isSupportedRmtExtension: boolean;
        loaderHint: string;
        contentType: string;
    };
    getJsonFallbackFileExtensions(): string[];
    getPreferredFileExtension(): string;
    inferFileExtension(sourceUrl: string): string;
    isSupportedFileExtension(value: string): boolean;
    createRuntimeRegistries(documentInput?: string | Record<string, unknown>, options?: RmtRuntimeRegistryOptions): RmtRuntimeRegistrySnapshot;
    listSupportedFileExtensions(): string[];
    listSupportedBindingKinds(): RmtTemplateBindingKind[];
    listDslDiagnosticCodes(): RmtDslDiagnosticCode[];
    listRuntimeRegistryDiagnosticCodes(): RmtRuntimeRegistryDiagnosticCode[];
    listSupportedHydrationModes(): RmtTemplateHydrationMode[];
    listSupportedOwnershipModes(): RmtOwnershipMode[];
    listSupportedSlotKinds(): RmtTemplateSlotKind[];
    listSupportedTemplateModes(): RmtTemplateMode[];
    normalizeBindingEntry(bindingInput?: Record<string, unknown>): RmtTemplateRuntimeBinding;
    normalizeBindingKind(value: string, fallbackValue?: RmtTemplateBindingKind): RmtTemplateBindingKind;
    normalizeDslDomains(documentInput?: Record<string, unknown>, documentManifest?: RmtDocumentManifest, templates?: RmtRegisteredTemplate[]): {
        adapters: RmtAdapterDomainRecord[];
        components: RmtComponentDomainRecord[];
        routes: RmtRouteDomainRecord[];
        schedules: RmtScheduleDomainRecord[];
        surfaces: RmtSurfaceDomainRecord[];
        diagnostics: RmtDslDiagnostic[];
        normalization: RmtDslNormalizationSummary;
    };
    normalizeDocument(documentInput: string | Record<string, unknown>, options?: Record<string, unknown>): RmtDocument;
    normalizeDocumentManifest(manifestInput?: Record<string, unknown>, options?: Record<string, unknown>): RmtDocumentManifest;
    normalizeErrorBoundary(errorBoundaryInput?: string | Record<string, unknown>): RmtTemplateErrorBoundary;
    normalizeHydrationContract(hydrationInput?: Record<string, unknown>): RmtTemplateHydrationContract;
    normalizeHydrationMode(value: string, fallbackValue?: RmtTemplateHydrationMode): RmtTemplateHydrationMode;
    normalizeOwnershipMode(value: string, fallbackValue?: RmtOwnershipMode): RmtOwnershipMode;
    normalizePropEntry(propInput?: Record<string, unknown>, fallbackName?: string): RmtTemplateProp;
    normalizePropEntries(propsInput?: Array<Record<string, unknown>> | Record<string, unknown>): RmtTemplateProp[];
    normalizeSlotEntry(slotInput?: Record<string, unknown>): RmtTemplateSlot;
    normalizeSlotKind(value: string, fallbackValue?: RmtTemplateSlotKind): RmtTemplateSlotKind;
    normalizeTemplateEntry(templateInput?: Record<string, unknown>, options?: Record<string, unknown>): RmtRegisteredTemplate;
    normalizeTemplateMode(value: string, fallbackValue?: RmtTemplateMode): RmtTemplateMode;
    parseDocument(documentSource: string, options?: Record<string, unknown>): RmtDocument;
    qualifyTemplateId(namespace: string, templateId: string): string;
    serializeDocument(documentInput: string | Record<string, unknown>, options?: Record<string, unknown>): string;
}

export interface RmtTemplateLoader {
    loadRmtDocument(source: string | Record<string, unknown>, options?: Record<string, unknown>): Promise<RmtTemplateDocumentRegistration>;
    loadTemplateSource(source: string | Record<string, unknown>, options?: Record<string, unknown>): Promise<RmtTemplateDocumentRegistration | RmtRegisteredTemplate>;
    readSourceText(source: string | Record<string, unknown>, options?: Record<string, unknown>): Promise<string>;
}

export interface RmtTemplateCompiler {
    kind: 'rmt_template_compiler' | string;
    version: string;
    clearPreparedCache(): boolean;
    getPreparedDocument(documentId: string, fallbackValue?: null): RmtPreparedDocument | null;
    getPreparedTemplate(templateRef: string | Record<string, unknown>, fallbackValue?: null): RmtPreparedTemplate | null;
    listPreparedDocuments(): RmtPreparedDocument[];
    listPreparedTemplates(): RmtPreparedTemplate[];
    prepareDocument(documentInput: string | Record<string, unknown>, options?: Record<string, unknown>): RmtPreparedDocument;
    prepareTemplate(templateInput: string | Record<string, unknown>, options?: Record<string, unknown>): RmtPreparedTemplate;
    resolvePreparedTemplate(templateRef: string | Record<string, unknown>, options?: Record<string, unknown>): RmtPreparedTemplate | null;
}

export interface RmtTemplateArtifactDocument {
    kind: 'rmt_template_artifact_document' | string;
    version: string;
    artifactId: string;
    documentId: string;
    namespace: string;
    sourceUrl: string;
    contentType: string;
    templateCount: number;
    templateIds: string[];
    metadata: Record<string, unknown>;
    reactivityHints: Record<string, unknown>;
    fingerprint: string;
    sourceFingerprint: string;
    templates: RmtPreparedTemplate[];
    runtimeProfileHints: string[];
    createdAt: number;
}

export interface RmtTemplateArtifactBundleManifest {
    artifactVersion: string;
    bundleId: string;
    createdAt: number;
    releaseStage: string;
    runtimeProfileHints: string[];
    metadata: Record<string, unknown>;
    documentCount: number;
    templateCount: number;
    fingerprint: string;
}

export interface RmtTemplateArtifactBundle {
    kind: 'rmt_template_artifact_bundle' | string;
    version: string;
    manifest: RmtTemplateArtifactBundleManifest;
    documents: RmtTemplateArtifactDocument[];
    templateIds: string[];
}

export interface RmtTemplateArtifactRegistrationResult {
    ok: boolean;
    bundleId: string;
    documentCount: number;
    templateCount: number;
    documentIds: string[];
}

export interface RmtTemplateArtifacts {
    kind: 'rmt_template_artifacts' | string;
    version: string;
    createArtifactBundle(documentInputs?: Array<string | Record<string, unknown>> | string | Record<string, unknown>, options?: Record<string, unknown>): RmtTemplateArtifactBundle;
    createArtifactManifest(options?: Record<string, unknown>): RmtTemplateArtifactBundleManifest;
    createDocumentArtifact(documentInput: string | Record<string, unknown>, options?: Record<string, unknown>): RmtTemplateArtifactDocument;
    getCompiler(): RmtTemplateCompiler;
    registerArtifactBundle(bundleInput: RmtTemplateArtifactBundle | Array<string | Record<string, unknown>> | string | Record<string, unknown>, options?: Record<string, unknown>): RmtTemplateArtifactRegistrationResult;
    resolvePreparedTemplate(templateRef: string | Record<string, unknown>, options?: Record<string, unknown>): RmtPreparedTemplate | null;
}

export type RmtTemplateExecutionMode =
    | 'runtime_render'
    | 'hydrate_prerendered'
    | 'worker_prerender_hydrate'
    | 'server_prerender_hydrate'
    | 'server_prerender_resume'
    | 'prerender_only';

export interface RmtTemplateExecutionTarget {
    element?: RmtMountElement | null;
    elementId?: string;
    selector?: string;
    rootId?: string;
}

export interface RmtTemplateExecutionRequest {
    executionMode?: RmtTemplateExecutionMode;
    template: string | Record<string, unknown>;
    target?: string | RmtMountElement | RmtTemplateExecutionTarget;
    rootId?: string;
    namespace?: string;
    elementId?: string;
    selector?: string;
    ownershipMode?: RmtOwnershipMode;
    model?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    prerenderTransport?: string;
    chunk?: RmtTemplateChunk | string | null;
}

export interface RmtTemplateExecutionPhase {
    id: string;
    kind: 'prerender' | 'transfer' | 'hydrate' | 'render' | string;
    transport: string;
}

export interface RmtTemplateExecutionPlan {
    executionMode: RmtTemplateExecutionMode;
    rootId: string;
    templateQualifiedId: string;
    namespace: string;
    phases: RmtTemplateExecutionPhase[];
}

export interface RmtTemplatePrerenderEnvelope {
    kind: 'rmt_template_prerender_request' | string;
    version: string;
    executionMode: RmtTemplateExecutionMode;
    prerenderTransport: string;
    rootId: string;
    template: {
        id: string;
        qualifiedId: string;
        namespace: string;
        documentId: string;
        props?: RmtTemplateProp[];
        hydration?: RmtTemplateHydrationContract;
        errorBoundary?: RmtTemplateErrorBoundary;
    };
    target: {
        elementId: string;
        selector: string;
        ownershipMode: string;
    };
    model: Record<string, unknown>;
    metadata: Record<string, unknown>;
    plan: RmtTemplateExecutionPlan;
    requestedAt: number;
}

export interface RmtTemplatePrerenderRequestSnapshot {
    kind: 'rmt_template_prerender_request' | string;
    version: string;
    executionMode: RmtTemplateExecutionMode;
    prerenderTransport: string;
    rootId: string;
    template: {
        id: string;
        qualifiedId: string;
        namespace: string;
        documentId: string;
    } | null;
    target: {
        elementId: string;
        selector: string;
        ownershipMode?: string;
    } | null;
    requestedAt: number;
}

export interface RmtTemplateChunk {
    kind: 'rmt_template_chunk' | string;
    version: string;
    executionMode: RmtTemplateExecutionMode;
    transport: string;
    rootId: string;
    template: {
        id: string;
        qualifiedId: string;
        namespace: string;
        documentId: string;
        mode: RmtTemplateMode;
        props?: RmtTemplateProp[];
    };
    target: {
        elementId: string;
        selector: string;
        ownershipMode: string;
        namespace: string;
    };
    markup: {
        html: string;
        textContent: string;
        descriptor: Record<string, unknown> | null;
    };
    hydration: {
        bindings: RmtTemplateRuntimeBinding[];
        slots: RmtTemplateSlot[];
        props: RmtTemplateProp[];
        templateHydration: RmtTemplateHydrationContract;
        errorBoundary: RmtTemplateErrorBoundary;
        reactivityHints: Record<string, unknown>;
        ownershipMode: string;
        resourceId: string;
        metadata: Record<string, unknown>;
    };
    modelSnapshot: Record<string, unknown>;
    plan: RmtTemplateExecutionPlan;
    renderedAt: number;
}

export interface RmtTemplatePrerenderResponseEnvelope {
    kind: 'rmt_template_prerender_response' | string;
    version: string;
    ok: boolean;
    superseded: boolean;
    transport: string;
    executionMode: RmtTemplateExecutionMode;
    rootId: string;
    template: {
        id: string;
        qualifiedId: string;
        namespace: string;
        documentId: string;
        mode?: RmtTemplateMode;
    } | null;
    plan: RmtTemplateExecutionPlan | null;
    request: RmtTemplatePrerenderRequestSnapshot | null;
    metadata: Record<string, unknown>;
    chunk: RmtTemplateChunk | null;
    error: {
        name: string;
        message: string;
        code?: string;
    } | null;
    worker?: Record<string, unknown> | null;
    requestedAt: number;
    respondedAt: number;
}

export interface RmtKernelRuntimeTrustVerdict {
    schema: 'xtend.rmt.kernel-trust-verdict.v1' | string;
    authoritySchema?: 'xtend.rmt.kernel-trust-authority.v1' | string;
    source?: 'xtend.rmt.runtime-trust-sink-adapter.v1' | string;
    workpackage?: 'RKSH-WP-02' | string;
    verdict: 'trusted' | 'sanitized' | 'blocked' | 'panic' | string;
    scope: string;
    sink: string;
    sourceRef: string | null;
    ownerRef?: string | null;
    attributeName?: string | null;
    propertyName?: string | null;
    severity: 'info' | 'warning' | 'error' | 'fatal' | string;
    reasonCode: string;
    commitAllowed: boolean;
    sanitized: boolean;
    trustBoundary?: string | null;
    panicCandidate?: boolean;
    correlationId: string;
    diagnosticCode?: string | null;
    metadata: Record<string, unknown>;
}

export interface RmtKernelRuntimePanicEvent {
    schema: 'xtend.rmt.kernel-panic-event.v1' | string;
    monitorSchema: 'xtend.rmt.kernel-panic-monitor.v1' | string;
    stateSchema: 'xtend.rmt.kernel-panic-state.v1' | string;
    workpackage: 'RKSH-WP-04' | string;
    eventId: string;
    type: 'signal-recorded' | 'state-transition' | 'recovery-started' | 'recovery-completed' | 'recovery-failed' | 'reset' | string;
    previousState: 'none' | 'suspected' | 'active' | 'recovering' | 'recovered' | 'failed' | string;
    state: 'none' | 'suspected' | 'active' | 'recovering' | 'recovered' | 'failed' | string;
    severity: 'info' | 'warning' | 'error' | 'critical' | 'fatal' | string;
    trigger: string;
    panicId: string | null;
    correlationId: string | null;
    sourceRef: string | null;
    scope: string | null;
    sink: string | null;
    reasonCode: string | null;
    diagnosticCode: string | null;
    blockedCommitCount: number;
    criticalViolationCount: number;
    recoveryAttemptCount: number;
    recoveryFailureCount: number;
    recoveryAction: string;
    at: number;
    metadata: Record<string, unknown>;
}

export interface RmtKernelRuntimePanicSnapshot {
    schema: 'xtend.rmt.kernel-panic-state.v1' | string;
    monitorSchema: 'xtend.rmt.kernel-panic-monitor.v1' | string;
    workpackage: 'RKSH-WP-04' | string;
    state: 'none' | 'suspected' | 'active' | 'recovering' | 'recovered' | 'failed' | string;
    previousState: 'none' | 'suspected' | 'active' | 'recovering' | 'recovered' | 'failed' | string;
    severity: 'info' | 'warning' | 'error' | 'critical' | 'fatal' | string;
    trigger: string;
    panicId: string | null;
    correlationId: string | null;
    sourceRef: string | null;
    scope: string | null;
    sink: string | null;
    reasonCode: string | null;
    diagnosticCode: string | null;
    blockedCommitCount: number;
    criticalViolationCount: number;
    recoveryAttemptCount: number;
    recoveryFailureCount: number;
    recoveryAction: string;
    affectedScopes: string[];
    affectedJobs: string[];
    activeSince: number | null;
    recoveringSince: number | null;
    recoveredAt: number | null;
    failedAt: number | null;
    lastSeenAt: number;
    eventCount: number;
    lastEventId: string | null;
    lastVerdict: Record<string, unknown> | null;
    metadata: Record<string, unknown>;
}

export interface RmtKernelRuntimeRecoverySafeSnapshot {
    schema: 'xtend.rmt.kernel-recovery-safe-snapshot.v1' | string;
    recoverySchema: 'xtend.rmt.kernel-recovery.v1' | string;
    workpackage: 'RKSH-WP-05' | string;
    snapshotId: string;
    snapshotKey: string;
    rootId: string | null;
    scope: string;
    sourceRef: string | null;
    templateQualifiedId: string | null;
    trustBoundary: string;
    sanitized: boolean;
    html: string;
    textContent: string;
    modelSnapshot: Record<string, unknown>;
    capturedAt: number;
    metadata: Record<string, unknown>;
}

export interface RmtKernelRuntimeRecoveryOutcome {
    schema: 'xtend.rmt.kernel-recovery-outcome.v1' | string;
    recoverySchema: 'xtend.rmt.kernel-recovery.v1' | string;
    policySchema: 'xtend.rmt.kernel-recovery-policy.v1' | string;
    safeSnapshotSchema: 'xtend.rmt.kernel-recovery-safe-snapshot.v1' | string;
    workpackage: 'RKSH-WP-05' | string;
    outcomeId: string;
    status: 'planned' | 'recovering' | 'recovered' | 'failed' | 'skipped' | string;
    scope: string | null;
    rootId: string | null;
    panicId: string | null;
    correlationId: string | null;
    quarantined: boolean;
    restoredSnapshotId: string | null;
    fallbackRendered: boolean;
    hostNotified: boolean;
    failures: Array<Record<string, unknown>>;
    panicState: RmtKernelRuntimePanicSnapshot | Record<string, unknown> | null;
    completedAt: number;
    metadata: Record<string, unknown>;
}

export interface RmtKernelRuntimePanicRecoveryRecord {
    schema: 'xtend.rmt.kernel-panic-recovery-record.v1' | string;
    kind: 'trustVerdict' | 'panicEvent' | 'safeSnapshot' | 'recoveryOutcome' | string;
    lane: 'diagnostics' | string;
    status: string;
    scope: string | null;
    correlationId: string | null;
    record: RmtKernelRuntimeTrustVerdict
        | RmtKernelRuntimePanicEvent
        | RmtKernelRuntimeRecoverySafeSnapshot
        | RmtKernelRuntimeRecoveryOutcome
        | Record<string, unknown>;
}

export interface RmtKernelRuntimePanicRecoverySnapshot {
    schema: 'xtend.rmt.kernel-panic-recovery-snapshot.v1' | string;
    lane: 'diagnostics' | string;
    trustVerdictCount: number;
    blockedTrustVerdictCount: number;
    panicEventCount: number;
    recoveryOutcomeCount: number;
    safeSnapshotCount: number;
    quarantineScopeCount: number;
    panicState: string;
    recoveryStatus: string;
    quarantineScopes: string[];
    lastTrustVerdict: RmtKernelRuntimeTrustVerdict | null;
    lastPanicEvent: RmtKernelRuntimePanicEvent | null;
    lastRecoveryOutcome: RmtKernelRuntimeRecoveryOutcome | null;
    panicSnapshot: RmtKernelRuntimePanicSnapshot | Record<string, unknown> | null;
}

export interface RmtTemplateBindingSession {
    appliedAt: number;
    destroy(): boolean;
    getApplicationBindingCommitResult(): RmtDomCommitResult;
    getBindingCount(): number;
    getResolvedBindingCount(): number;
    getResolvedSlotCount(): number;
    getModelSnapshot(): Record<string, unknown>;
    getRootElement(): RmtMountElement | null;
    getRootId(): string;
    getSlotCount(): number;
    getTemplateQualifiedId(): string;
    listApplicationBindings(): RmtDomApplicationBindingRecord[];
    listBindings(): Array<{
        kind: RmtTemplateBindingKind;
        target: string;
        source: string;
        sourceName: string;
        eventType: string;
        commandName: string;
        eventName: string;
        action: string;
        actionAttribute: string;
        resolved: boolean;
    }>;
    listSlots(): Array<{
        kind: RmtTemplateSlotKind;
        name?: string;
        target: string;
        source: string;
        sourceName: string;
        templateQualifiedId: string;
        resolved: boolean;
    }>;
    listTrustVerdicts(): RmtKernelRuntimeTrustVerdict[];
    getPanicSnapshot(): RmtKernelRuntimePanicSnapshot;
    listPanicEvents(): RmtKernelRuntimePanicEvent[];
    beginPanicRecovery(input?: Record<string, unknown>): RmtKernelRuntimePanicSnapshot;
    completePanicRecovery(input?: Record<string, unknown>): RmtKernelRuntimePanicSnapshot;
    failPanicRecovery(input?: Record<string, unknown>): RmtKernelRuntimePanicSnapshot;
    rememberSafeSnapshot(input?: Record<string, unknown>): RmtKernelRuntimeRecoverySafeSnapshot;
    getLastSafeSnapshot(input?: Record<string, unknown>): RmtKernelRuntimeRecoverySafeSnapshot | null;
    listSafeSnapshots(): RmtKernelRuntimeRecoverySafeSnapshot[];
    restoreLastSafeSnapshot(input?: Record<string, unknown>): boolean;
    renderSafeFallback(input?: Record<string, unknown>): boolean;
    recoverFromPanic(input?: Record<string, unknown>): RmtKernelRuntimeRecoveryOutcome;
    listRecoveryOutcomes(): RmtKernelRuntimeRecoveryOutcome[];
    listPanicRecoveryRecords(): RmtKernelRuntimePanicRecoveryRecord[];
    getPanicRecoverySnapshot(): RmtKernelRuntimePanicRecoverySnapshot;
    listQuarantinedScopes(): string[];
    isScopeQuarantined(input?: Record<string, unknown>): boolean;
    rebindChunk(nextChunkInput?: RmtTemplateChunk | Record<string, unknown> | null): boolean;
    updateModel(nextModelSnapshot?: Record<string, unknown>): number;
}

export interface RmtTemplateExecutionResult {
    executionMode: RmtTemplateExecutionMode;
    plan: RmtTemplateExecutionPlan;
    chunk: RmtTemplateChunk | null;
    islandHandle: RmtIslandHandle | null;
    bindingSession: RmtTemplateBindingSession | null;
    applied: boolean;
    deferred: boolean;
    prerenderEnvelope?: RmtTemplatePrerenderEnvelope;
    errorBoundary?: {
        handled: boolean;
        name: string;
        target: string;
        eventName: string;
    };
    error?: {
        name: string;
        message: string;
    };
}

export interface RmtTemplateTransportExecutionResult {
    ok: boolean;
    status?: 'hydrated' | 'deferred' | 'superseded' | 'error' | string;
    transport: string;
    request: RmtTemplatePrerenderRequestSnapshot | null;
    response: RmtTemplatePrerenderResponseEnvelope;
    executionResult: RmtTemplateExecutionResult | null;
    chunk: RmtTemplateChunk | null;
    islandHandle: RmtIslandHandle | null;
    bindingSession: RmtTemplateBindingSession | null;
    applied: boolean;
    hydrated: boolean;
    superseded: boolean;
    deferred: boolean;
    hydrationGeneration?: string | null;
    expectedGeneration?: string | null;
    hydrationKey?: string | null;
    trustedDomCommit?: {
        required: boolean;
        status: 'committed' | 'bindings-only' | 'deferred' | 'skipped' | string;
        mainThread: boolean;
        reason?: string;
    };
    blockedHostServiceRequests?: number;
    hostServicesExecuted?: number;
    diagnostics?: Array<Record<string, unknown>>;
    error: {
        name: string;
        message: string;
        code?: string;
    } | null;
}

export interface RmtTemplateRuntimeRenderer {
    applyBindings(
        sessionInput?: RmtTemplateRuntimeBindingSessionInput,
        options?: Record<string, unknown>
    ): RmtTemplateBindingSession;
    createTemplateStructureSignature(
        bindingsInput?: RmtTemplateRuntimeBinding[],
        slotsInput?: RmtTemplateSlot[],
        templateMode?: RmtTemplateMode
    ): string;
    createBindingSession(
        sessionInput?: RmtTemplateRuntimeBindingSessionInput,
        options?: Record<string, unknown>
    ): RmtTemplateBindingSession;
    listSupportedBindingKinds(): RmtTemplateBindingKind[];
    listSupportedSlotKinds(): RmtTemplateSlotKind[];
    listTrustVerdicts(): RmtKernelRuntimeTrustVerdict[];
    getPanicSnapshot(): RmtKernelRuntimePanicSnapshot;
    listPanicEvents(): RmtKernelRuntimePanicEvent[];
    beginPanicRecovery(input?: Record<string, unknown>): RmtKernelRuntimePanicSnapshot;
    completePanicRecovery(input?: Record<string, unknown>): RmtKernelRuntimePanicSnapshot;
    failPanicRecovery(input?: Record<string, unknown>): RmtKernelRuntimePanicSnapshot;
    rememberSafeSnapshot(input?: Record<string, unknown>): RmtKernelRuntimeRecoverySafeSnapshot;
    getLastSafeSnapshot(input?: Record<string, unknown>): RmtKernelRuntimeRecoverySafeSnapshot | null;
    listSafeSnapshots(): RmtKernelRuntimeRecoverySafeSnapshot[];
    quarantineScope(input?: Record<string, unknown>): string;
    restoreLastSafeSnapshot(input?: Record<string, unknown>): boolean;
    renderSafeFallback(input?: Record<string, unknown>): boolean;
    recoverFromPanic(input?: Record<string, unknown>): RmtKernelRuntimeRecoveryOutcome;
    listRecoveryOutcomes(): RmtKernelRuntimeRecoveryOutcome[];
    listPanicRecoveryRecords(): RmtKernelRuntimePanicRecoveryRecord[];
    getPanicRecoverySnapshot(): RmtKernelRuntimePanicRecoverySnapshot;
    listQuarantinedScopes(): string[];
    isScopeQuarantined(input?: Record<string, unknown>): boolean;
    normalizeBinding(bindingInput?: Record<string, unknown>): RmtTemplateRuntimeBinding | null;
    normalizeBindings(bindingsInput?: Array<Record<string, unknown>>): RmtTemplateRuntimeBinding[];
    normalizeSlot(slotInput?: Record<string, unknown>): RmtTemplateSlot;
    normalizeSlots(slotsInput?: Array<Record<string, unknown>>): RmtTemplateSlot[];
    resolveBindingValue(
        binding: RmtTemplateRuntimeBinding,
        modelSnapshot?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): unknown;
}

export interface RmtTemplateRuntimeBindingSessionInput {
    rootId?: string;
    element?: RmtMountElement | null;
    rootElement?: RmtMountElement | null;
    target?: string | RmtMountElement | RmtTemplateExecutionTarget;
    elementId?: string;
    selector?: string;
    chunk?: RmtTemplateChunk | null;
    bindings?: RmtTemplateRuntimeBinding[];
    modelSnapshot?: Record<string, unknown>;
    reactivityHints?: Record<string, unknown>;
    templateQualifiedId?: string;
}

export interface RmtTemplateExecutionPath {
    applyPrerenderChunk(
        target: string | RmtMountElement | RmtTemplateExecutionTarget,
        chunkInput: RmtTemplateChunk | string | Record<string, unknown>,
        options?: Record<string, unknown>
    ): boolean;
    applyRuntimeBindings(
        target: string | RmtMountElement | RmtTemplateExecutionTarget,
        chunkInput: RmtTemplateChunk | string | Record<string, unknown>,
        options?: Record<string, unknown>
    ): RmtTemplateBindingSession | null;
    createExecutionPlan(requestInput: RmtTemplateExecutionRequest, options?: Record<string, unknown>): RmtTemplateExecutionPlan;
    createPrerenderEnvelope(requestInput: RmtTemplateExecutionRequest, options?: Record<string, unknown>): RmtTemplatePrerenderEnvelope;
    executeTemplate(requestInput: RmtTemplateExecutionRequest, options?: Record<string, unknown>): RmtTemplateExecutionResult;
    getRuntimeRenderer(): RmtTemplateRuntimeRenderer | null;
    getSupportedExecutionModes(): RmtTemplateExecutionMode[];
    listTrustVerdicts(): RmtKernelRuntimeTrustVerdict[];
    getPanicSnapshot(): RmtKernelRuntimePanicSnapshot;
    listPanicEvents(): RmtKernelRuntimePanicEvent[];
    beginPanicRecovery(input?: Record<string, unknown>): RmtKernelRuntimePanicSnapshot;
    completePanicRecovery(input?: Record<string, unknown>): RmtKernelRuntimePanicSnapshot;
    failPanicRecovery(input?: Record<string, unknown>): RmtKernelRuntimePanicSnapshot;
    rememberSafeSnapshot(input?: Record<string, unknown>): RmtKernelRuntimeRecoverySafeSnapshot;
    getLastSafeSnapshot(input?: Record<string, unknown>): RmtKernelRuntimeRecoverySafeSnapshot | null;
    listSafeSnapshots(): RmtKernelRuntimeRecoverySafeSnapshot[];
    quarantineScope(input?: Record<string, unknown>): string;
    restoreLastSafeSnapshot(input?: Record<string, unknown>): boolean;
    renderSafeFallback(input?: Record<string, unknown>): boolean;
    recoverFromPanic(input?: Record<string, unknown>): RmtKernelRuntimeRecoveryOutcome;
    listRecoveryOutcomes(): RmtKernelRuntimeRecoveryOutcome[];
    listPanicRecoveryRecords(): RmtKernelRuntimePanicRecoveryRecord[];
    getPanicRecoverySnapshot(): RmtKernelRuntimePanicRecoverySnapshot;
    listQuarantinedScopes(): string[];
    isScopeQuarantined(input?: Record<string, unknown>): boolean;
    hydrateTemplate(requestInput: RmtTemplateExecutionRequest, options?: Record<string, unknown>): RmtTemplateExecutionResult;
    normalizeChunk(chunkInput: RmtTemplateChunk | string | Record<string, unknown>, options?: Record<string, unknown>): RmtTemplateChunk;
    normalizeExecutionMode(value: string, fallbackValue?: RmtTemplateExecutionMode): RmtTemplateExecutionMode;
    prerenderTemplate(requestInput: RmtTemplateExecutionRequest, options?: Record<string, unknown>): RmtTemplateChunk;
    renderTemplate(requestInput: RmtTemplateExecutionRequest, options?: Record<string, unknown>): RmtTemplateExecutionResult;
}

export interface RmtTemplateTransportAdapter {
    createErrorResponseEnvelope(
        errorInput?: unknown,
        options?: Record<string, unknown>
    ): RmtTemplatePrerenderResponseEnvelope;
    createPrerenderEnvelope(
        requestInput: RmtTemplateExecutionRequest | RmtTemplatePrerenderEnvelope,
        options?: Record<string, unknown>
    ): RmtTemplatePrerenderEnvelope;
    createPrerenderResponseEnvelope(
        responseInput?: RmtTemplateChunk | RmtTemplatePrerenderResponseEnvelope | Record<string, unknown> | string,
        options?: Record<string, unknown>
    ): RmtTemplatePrerenderResponseEnvelope;
    execute(
        requestInput: RmtTemplateExecutionRequest | RmtTemplatePrerenderEnvelope,
        options?: Record<string, unknown>
    ): Promise<RmtTemplateTransportExecutionResult>;
    getSupportedExecutionModes(): RmtTemplateExecutionMode[];
    getTransportKind(): string;
    getLatestHydrationGeneration(hydrationKey: string): string | null;
    handlePrerenderEnvelope(
        envelopeInput: RmtTemplateExecutionRequest | RmtTemplatePrerenderEnvelope | Record<string, unknown> | string,
        options?: Record<string, unknown>
    ): RmtTemplatePrerenderResponseEnvelope;
    hydrateResponse(
        responseInput?: RmtTemplatePrerenderResponseEnvelope | RmtTemplateChunk | Record<string, unknown> | string,
        requestInput?: RmtTemplateExecutionRequest | RmtTemplatePrerenderEnvelope | Record<string, unknown>,
        options?: Record<string, unknown>
    ): RmtTemplateTransportExecutionResult;
    rememberHydrationGeneration(hydrationKey: string, generation: string | number): boolean;
    normalizeExecutionMode(value: string): RmtTemplateExecutionMode;
    normalizePrerenderResponse(
        responseInput?: RmtTemplatePrerenderResponseEnvelope | RmtTemplateChunk | Record<string, unknown> | string,
        options?: Record<string, unknown>
    ): RmtTemplatePrerenderResponseEnvelope;
    requestPrerender(
        requestInput: RmtTemplateExecutionRequest | RmtTemplatePrerenderEnvelope,
        options?: Record<string, unknown>
    ): Promise<RmtTemplatePrerenderResponseEnvelope>;
}

export interface RmtTemplateApi {
    apiVersion: string;
    version: string;
    createArtifactBundle(documentInputs?: Array<string | Record<string, unknown>> | string | Record<string, unknown>, options?: Record<string, unknown>): RmtTemplateArtifactBundle;
    createExecutionPlan(requestInput: RmtTemplateExecutionRequest, options?: Record<string, unknown>): RmtTemplateExecutionPlan;
    createPrerenderEnvelope(requestInput: RmtTemplateExecutionRequest, options?: Record<string, unknown>): RmtTemplatePrerenderEnvelope;
    createDocumentArtifact(documentInput: string | Record<string, unknown>, options?: Record<string, unknown>): RmtTemplateArtifactDocument;
    createServerAdapter(options?: RmtTemplateApiOptions): RmtTemplateTransportAdapter;
    createWorkerAdapter(options?: RmtTemplateApiOptions): RmtTemplateTransportAdapter;
    executeTemplate(requestInput: RmtTemplateExecutionRequest, options?: Record<string, unknown>): RmtTemplateExecutionResult;
    getArtifactApi(): RmtTemplateArtifacts | null;
    getCompiler(): RmtTemplateCompiler | null;
    getFormat(): RmtFormat;
    getExecutionPath(): RmtTemplateExecutionPath | null;
    getLoader(): RmtTemplateLoader;
    getManifest(): RmtProductManifest;
    getRegistry(): RmtTemplateRegistry;
    getRuntimeRenderer(): RmtTemplateRuntimeRenderer | null;
    listDocuments(): RmtTemplateDocumentRegistration[];
    listSupportedBindingKinds(): RmtTemplateBindingKind[];
    listSupportedHydrationModes(): RmtTemplateHydrationMode[];
    listSupportedSlotKinds(): RmtTemplateSlotKind[];
    listSupportedExecutionModes(): RmtTemplateExecutionMode[];
    listTrustVerdicts(): RmtKernelRuntimeTrustVerdict[];
    getPanicSnapshot(): RmtKernelRuntimePanicSnapshot | null;
    listPanicEvents(): RmtKernelRuntimePanicEvent[];
    listSafeSnapshots(): RmtKernelRuntimeRecoverySafeSnapshot[];
    listRecoveryOutcomes(): RmtKernelRuntimeRecoveryOutcome[];
    listQuarantinedScopes(): string[];
    listPanicRecoveryRecords(): RmtKernelRuntimePanicRecoveryRecord[];
    getPanicRecoverySnapshot(): RmtKernelRuntimePanicRecoverySnapshot | null;
    listSupportedFileExtensions(): string[];
    getPreferredFileExtension(): string;
    getJsonFallbackFileExtensions(): string[];
    listSupportedTemplateModes(): RmtTemplateMode[];
    listTemplates(): RmtRegisteredTemplate[];
    prepareDocument(documentInput: string | Record<string, unknown>, options?: Record<string, unknown>): RmtPreparedDocument;
    prepareTemplate(templateInput: string | Record<string, unknown>, options?: Record<string, unknown>): RmtPreparedTemplate;
    hydrateTemplate(requestInput: RmtTemplateExecutionRequest, options?: Record<string, unknown>): RmtTemplateExecutionResult;
    loadRmtDocument(source: string | Record<string, unknown>, options?: Record<string, unknown>): Promise<RmtTemplateDocumentRegistration>;
    loadTemplateSource(source: string | Record<string, unknown>, options?: Record<string, unknown>): Promise<RmtTemplateDocumentRegistration | RmtRegisteredTemplate>;
    prerenderTemplate(requestInput: RmtTemplateExecutionRequest, options?: Record<string, unknown>): RmtTemplateChunk;
    registerArtifactBundle(bundleInput: RmtTemplateArtifactBundle | Array<string | Record<string, unknown>> | string | Record<string, unknown>, options?: Record<string, unknown>): RmtTemplateArtifactRegistrationResult;
    registerDocument(documentInput: string | Record<string, unknown>, options?: Record<string, unknown>): RmtTemplateDocumentRegistration;
    registerTemplate(templateInput: Record<string, unknown>, options?: Record<string, unknown>): RmtRegisteredTemplate;
    renderTemplate(requestInput: RmtTemplateExecutionRequest, options?: Record<string, unknown>): RmtTemplateExecutionResult;
    resolvePreparedTemplate(templateRef: string | Record<string, unknown>, options?: Record<string, unknown>): RmtPreparedTemplate | null;
    resolveTemplate(templateRef: string | Record<string, unknown>, options?: Record<string, unknown>): RmtRegisteredTemplate | null;
    serializeDocument(documentInput: string | Record<string, unknown>, options?: Record<string, unknown>): string;
}

export interface RmtBrowserRuntimeDefaults {
    namespace: string;
    metadata: Record<string, unknown>;
}

export interface RmtBrowserRuntime {
    apiVersion: string;
    runtimeKind: 'browser' | string;
    version: string;
    hostKind: string;
    defaults: RmtBrowserRuntimeDefaults;
    createServerAdapter(options?: Record<string, unknown>): RmtTemplateTransportAdapter;
    createServerTransport(options?: Record<string, unknown>): RmtTemplateTransportAdapter;
    createArtifactBundle(documentInputs?: Array<string | Record<string, unknown>> | string | Record<string, unknown>, options?: Record<string, unknown>): RmtTemplateArtifactBundle;
    createWorkerAdapter(options?: Record<string, unknown>): RmtTemplateTransportAdapter;
    createWorkerTransport(options?: Record<string, unknown>): RmtTemplateTransportAdapter;
    dispatchCommand(commandName: string, payload?: Record<string, unknown>, options?: Record<string, unknown>): Promise<unknown>;
    execute(
        targetOrRequest: RmtTemplateExecutionRequest | RmtIslandTarget,
        templateRef?: string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): RmtTemplateExecutionResult;
    executeTemplate(
        targetOrRequest: RmtTemplateExecutionRequest | RmtIslandTarget,
        templateRef?: string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): RmtTemplateExecutionResult;
    getCapabilities(): RmtCoreCapabilities | Record<string, unknown>;
    getCompiler(): RmtTemplateCompiler | null;
    getCore(): RmtCore;
    getDefaults(): RmtBrowserRuntimeDefaults;
    getExecutionPath(): RmtTemplateExecutionPath | null;
    getHostAdapter(): RmtHostAdapter;
    getHostContract(): RmtHostContract | Record<string, unknown>;
    getManifest(): RmtProductManifest | null;
    getPerformanceRuntime(): RmtPerformanceRuntime | null;
    getPrewarmWorkerRuntime(): RmtPrewarmWorkerRuntime | null;
    getPrewarmWorkerTopology(): RmtPrewarmWorkerTopology;
    getUiCoprocessorSnapshot(): RmtUiCoprocessorSnapshot;
    requestUiCompute(
        envelope?: RmtTemplatePrerenderEnvelope | Record<string, unknown>,
        options?: Record<string, unknown>
    ): Promise<RmtTemplatePrerenderResponseEnvelope | Record<string, unknown>>;
    dispatchUiComputeEnvelope(
        envelope?: RmtTemplatePrerenderEnvelope | Record<string, unknown>,
        options?: Record<string, unknown>
    ): Promise<RmtTemplatePrerenderResponseEnvelope | Record<string, unknown>>;
    terminatePrewarmWorker(reason?: string): boolean;
    terminateUiCoprocessor(reason?: string): boolean;
    getPerformanceSnapshot(reason?: string): RmtPerformanceSnapshot | null;
    getBrowserSignalSnapshot(reason?: string): RmtBrowserSignalSnapshot | null;
    getBackpressureProfile(reason?: string): RmtBackpressureProfile | null;
    sampleBrowserNativeState(reason?: string, options?: Record<string, unknown>): RmtBrowserSignalSnapshot | null;
    startBrowserSignalCollection(options?: Record<string, unknown>): RmtBrowserSignalSnapshot | null;
    stopBrowserSignalCollection(reason?: string): RmtBrowserSignalSnapshot | null;
    recordBrowserSignalSample(sample?: Partial<RmtBrowserNativeMetricSample>, options?: Record<string, unknown>): RmtBrowserNativeMetricSample | null;
    evaluatePerformanceBudget(endpointName: string, sample?: Partial<RmtPerformanceEndpointEvent>, options?: Record<string, unknown>): RmtPerformanceBudgetEvaluation | null;
    evaluatePerformanceBudgets(reasonOrOptions?: string | Record<string, unknown>, maybeOptions?: Record<string, unknown>): RmtPerformanceBudgetSnapshot | null;
    exportPerformanceRunReport(reasonOrOptions?: string | Record<string, unknown>, maybeOptions?: Record<string, unknown>): RmtPerformanceRunReport | null;
    comparePerformanceRunReports(baseReport: RmtPerformanceRunReport | Record<string, unknown>, targetReport: RmtPerformanceRunReport | Record<string, unknown>, options?: Record<string, unknown>): RmtPerformanceRunComparison | null;
    createPerformanceBaseline(reportInputs?: Array<RmtPerformanceRunReport | Record<string, unknown>>, options?: Record<string, unknown>): RmtPerformanceBaseline | null;
    createPerformanceTrendSeries(reportInputs?: Array<RmtPerformanceRunReport | Record<string, unknown>>, options?: Record<string, unknown>): RmtPerformanceTrendSeries | null;
    comparePerformanceReportToBaseline(report: RmtPerformanceRunReport | Record<string, unknown>, baseline: RmtPerformanceBaseline | Record<string, unknown>, options?: Record<string, unknown>): RmtPerformanceBaselineComparison | null;
    createPerformanceHarnessOutput(reasonOrOptions?: string | Record<string, unknown>, maybeOptions?: Record<string, unknown>): RmtPerformanceHarnessOutput | null;
    createPerformanceBatchSeries(outputInputs?: Array<RmtPerformanceHarnessOutput | Record<string, unknown>>, options?: Record<string, unknown>): RmtPerformanceBatchSeries | null;
    createPerformanceNightlyTrendlines(outputInputs?: Array<RmtPerformanceHarnessOutput | Record<string, unknown>>, options?: Record<string, unknown>): RmtPerformanceNightlyTrendlines | null;
    createPerformanceCiSummary(sourceOrOptions?: Record<string, unknown>, maybeOptions?: Record<string, unknown>): RmtPerformanceCiSummary | null;
    exportPerformanceFileArtifact(sourceOrOptions?: Record<string, unknown>, maybeOptions?: Record<string, unknown>): RmtPerformanceFileArtifact | null;
    publishPerformanceArtifactToTarget(artifactOrSource?: Record<string, unknown>, options?: Record<string, unknown>): Promise<RmtPerformanceExternalExportResult | null>;
    writePerformanceArtifact(artifactOrSource?: Record<string, unknown>, options?: Record<string, unknown>): RmtPerformanceArtifactWriteResult | null;
    publishPerformanceBatchToTarget(seriesOrOutputs?: Record<string, unknown> | Array<Record<string, unknown>>, options?: Record<string, unknown>): Promise<RmtPerformanceExternalExportResult | null>;
    writePerformanceBatchArtifacts(seriesOrOutputs?: Record<string, unknown> | Array<Record<string, unknown>>, options?: Record<string, unknown>): Record<string, unknown> | null;
    writePerformanceCiSummary(summaryOrSource?: Record<string, unknown>, options?: Record<string, unknown>): RmtPerformanceArtifactWriteResult | null;
    persistPerformanceHarnessOutput(outputOrReason?: RmtPerformanceHarnessOutput | string | Record<string, unknown>, maybeOptions?: Record<string, unknown>): RmtPerformanceHarnessOutput | null;
    exportStoredPerformanceHistory(options?: Record<string, unknown>): RmtPerformanceHarnessHistory | null;
    listStoredPerformanceHarnessOutputs(limit?: number): RmtPerformanceHarnessOutput[];
    clearStoredPerformanceHistory(): boolean;
    getPerformanceHistoryStorageStatus(): RmtPerformanceHistoryStorageStatus | null;
    runPerformanceBatchHarness(runInputs: Array<Record<string, unknown>>, runner: (input: Record<string, unknown>, index: number, context: Record<string, unknown>) => unknown | Promise<unknown>, options?: Record<string, unknown>): Promise<RmtPerformanceBatchHarnessRun | null>;
    runPerformanceAutomationHarness(runInputs: Array<Record<string, unknown>>, automationAdapter: Record<string, unknown> | ((input: Record<string, unknown>, index: number, context: Record<string, unknown>) => unknown | Promise<unknown>), options?: Record<string, unknown>): Promise<RmtPerformanceAutomationHarnessRun | null>;
    getPublicApi(): RmtPublicApi;
    getRmt(): RmtInstance;
    getRuntimeRenderer(): RmtTemplateRuntimeRenderer | null;
    getTemplateArtifacts(): RmtTemplateArtifacts | null;
    getServerAdapter(): RmtTemplateTransportAdapter;
    getServerTransport(): RmtTemplateTransportAdapter;
    getTemplateApi(): RmtTemplateApi;
    getWorkerAdapter(): RmtTemplateTransportAdapter;
    getWorkerTransport(): RmtTemplateTransportAdapter;
    hydrate(target: RmtIslandTarget, options?: RmtIslandInput): RmtIslandHandle;
    hydrateTemplate(
        targetOrRequest: RmtTemplateExecutionRequest | RmtIslandTarget,
        templateRef?: string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): RmtTemplateExecutionResult;
    hydratePrepared(
        targetOrRequest: RmtTemplateExecutionRequest | RmtIslandTarget,
        preparedTemplate?: RmtPreparedTemplate | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): RmtTemplateExecutionResult;
    invalidate(islandRef: string | RmtIslandHandle): number;
    listDocuments(): RmtTemplateDocumentRegistration[];
    listIslands(): RmtIslandDescriptor[];
    listPerformanceBudgets(): RmtPerformanceBudgetProfile[];
    listPerformanceMeasurementPhases(): string[];
    listPerformanceProfiles(): RmtPerformanceEndpointProfile[];
    listSupportedBindingKinds(): RmtTemplateBindingKind[];
    listSupportedExecutionModes(): RmtTemplateExecutionMode[];
    listSupportedHydrationModes(): RmtTemplateHydrationMode[];
    listSupportedSlotKinds(): RmtTemplateSlotKind[];
    listTrustVerdicts(): RmtKernelRuntimeTrustVerdict[];
    getPanicSnapshot(): RmtKernelRuntimePanicSnapshot | null;
    listPanicEvents(): RmtKernelRuntimePanicEvent[];
    listSafeSnapshots(): RmtKernelRuntimeRecoverySafeSnapshot[];
    listRecoveryOutcomes(): RmtKernelRuntimeRecoveryOutcome[];
    listQuarantinedScopes(): string[];
    listPanicRecoveryRecords(): RmtKernelRuntimePanicRecoveryRecord[];
    getPanicRecoverySnapshot(): RmtKernelRuntimePanicRecoverySnapshot;
    listTemplates(): RmtRegisteredTemplate[];
    loadDocument(source: string | Record<string, unknown>, options?: Record<string, unknown>): Promise<RmtTemplateDocumentRegistration>;
    loadRmtDocument(source: string | Record<string, unknown>, options?: Record<string, unknown>): Promise<RmtTemplateDocumentRegistration>;
    loadTemplateSource(source: string | Record<string, unknown>, options?: Record<string, unknown>): Promise<RmtTemplateDocumentRegistration | RmtRegisteredTemplate>;
    mount(target: RmtIslandTarget, options?: RmtIslandInput): RmtIslandHandle;
    observe(target: RmtIslandTarget, options?: RmtIslandInput): RmtIslandHandle;
    prerender(
        templateOrRequest: RmtTemplateExecutionRequest | string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): RmtTemplateChunk;
    prerenderPrepared(
        templateOrRequest: RmtTemplateExecutionRequest | RmtPreparedTemplate | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): RmtTemplateChunk;
    prerenderTemplate(
        templateOrRequest: RmtTemplateExecutionRequest | string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): RmtTemplateChunk;
    prepareDocument(documentInput: string | Record<string, unknown>, options?: Record<string, unknown>): RmtPreparedDocument;
    prepareTemplate(templateRef: string | Record<string, unknown>, options?: Record<string, unknown>): RmtPreparedTemplate;
    registerArtifactBundle(bundleInput: RmtTemplateArtifactBundle | Array<string | Record<string, unknown>> | string | Record<string, unknown>, options?: Record<string, unknown>): RmtTemplateArtifactRegistrationResult;
    registerDocument(documentInput: string | Record<string, unknown>, options?: Record<string, unknown>): RmtTemplateDocumentRegistration;
    registerTemplate(templateInput: Record<string, unknown>, options?: Record<string, unknown>): RmtRegisteredTemplate;
    resolvePerformanceBudget(endpointName: string, options?: Record<string, unknown>): RmtPerformanceBudgetProfile | null;
    resolvePerformancePlan(endpointName: string, options?: Record<string, unknown>): RmtPerformanceEndpointProfile | null;
    render(
        targetOrRequest: RmtTemplateExecutionRequest | RmtIslandTarget,
        templateRef?: string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): RmtTemplateExecutionResult;
    renderPrepared(
        targetOrRequest: RmtTemplateExecutionRequest | RmtIslandTarget,
        preparedTemplate?: RmtPreparedTemplate | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): RmtTemplateExecutionResult;
    renderTemplate(
        targetOrRequest: RmtTemplateExecutionRequest | RmtIslandTarget,
        templateRef?: string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): RmtTemplateExecutionResult;
    resolvePreparedTemplate(templateRef: string | Record<string, unknown>, options?: Record<string, unknown>): RmtPreparedTemplate | null;
    resolveTemplate(templateRef: string | Record<string, unknown>, options?: Record<string, unknown>): RmtRegisteredTemplate | null;
    runEndpoint<T = unknown>(endpointName: string, callback: (plan: RmtPerformanceEndpointProfile | null) => T | Promise<T>, options?: Record<string, unknown>): T | Promise<T>;
    scheduleEndpoint(endpointName: string, scope: string, callback: (jobContext: Record<string, unknown>) => unknown, options?: Record<string, unknown>): unknown;
    unmount(islandRef: string | RmtIslandHandle, options?: RmtUnmountIslandOptions & { hard?: boolean; appUnmount?: boolean; disposeRoot?: boolean }): boolean;
    disposeRoot(rootId: string, options?: Record<string, unknown>): boolean;
    dispose(options?: Record<string, unknown>): { schema: 'xtend.rmt.browser-runtime-dispose.v1'; ok: boolean; prewarmWorkerTerminated: boolean; coreDisposed: boolean };
    withDefaults(nextDefaults?: Partial<RmtBrowserRuntimeDefaults> & Record<string, unknown>): RmtBrowserRuntime;
}

export interface RmtDetachedDomRuntime extends RmtBrowserRuntime {
    runtimeKind: 'detached_dom' | string;
    withDefaults(nextDefaults?: Partial<RmtBrowserRuntimeDefaults> & Record<string, unknown>): RmtDetachedDomRuntime;
}

export interface RmtWorkerPrerenderRuntime extends Omit<
    RmtBrowserRuntime,
    | 'createWorkerAdapter'
    | 'createWorkerTransport'
    | 'execute'
    | 'executeTemplate'
    | 'getWorkerAdapter'
    | 'getWorkerTransport'
    | 'prerender'
    | 'prerenderTemplate'
    | 'render'
    | 'renderTemplate'
    | 'withDefaults'
> {
    runtimeKind: 'worker_prerender' | string;
    createWorkerAdapter(options?: RmtWorkerPrerenderRuntimeOptions): RmtTemplateTransportAdapter;
    createWorkerTransport(options?: RmtWorkerPrerenderRuntimeOptions): RmtTemplateTransportAdapter;
    execute(
        targetOrRequest: RmtTemplateExecutionRequest | RmtIslandTarget,
        templateRef?: string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): Promise<RmtTemplateTransportExecutionResult>;
    executeTemplate(
        targetOrRequest: RmtTemplateExecutionRequest | RmtIslandTarget,
        templateRef?: string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): Promise<RmtTemplateTransportExecutionResult>;
    getBrowserRuntime(): RmtBrowserRuntime;
    getWorkerAdapter(): RmtTemplateTransportAdapter;
    getWorkerTransport(): RmtTemplateTransportAdapter;
    getWorkerTransportDispatcher(): ((envelope: RmtTemplatePrerenderEnvelope, options?: Record<string, unknown>) => Promise<RmtTemplatePrerenderResponseEnvelope> | RmtTemplatePrerenderResponseEnvelope) | null;
    getLatestHydrationGeneration(hydrationKey: string): string | null;
    hydrateResponse(
        responseInput?: RmtTemplatePrerenderResponseEnvelope | RmtTemplateChunk | Record<string, unknown> | string,
        requestInput?: RmtTemplateExecutionRequest | RmtTemplatePrerenderEnvelope | Record<string, unknown>,
        options?: Record<string, unknown>
    ): RmtTemplateTransportExecutionResult;
    rememberHydrationGeneration(hydrationKey: string, generation: string | number): boolean;
    prerender(
        templateOrRequest: RmtTemplateExecutionRequest | string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): Promise<RmtTemplatePrerenderResponseEnvelope>;
    prerenderTemplate(
        templateOrRequest: RmtTemplateExecutionRequest | string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): Promise<RmtTemplatePrerenderResponseEnvelope>;
    render(
        targetOrRequest: RmtTemplateExecutionRequest | RmtIslandTarget,
        templateRef?: string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): Promise<RmtTemplateTransportExecutionResult>;
    renderTemplate(
        targetOrRequest: RmtTemplateExecutionRequest | RmtIslandTarget,
        templateRef?: string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): Promise<RmtTemplateTransportExecutionResult>;
    requestPrerender(
        templateOrRequest: RmtTemplateExecutionRequest | string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): Promise<RmtTemplatePrerenderResponseEnvelope>;
    withDefaults(nextDefaults?: Partial<RmtBrowserRuntimeDefaults> & Record<string, unknown>): RmtWorkerPrerenderRuntime;
}

export interface RmtPrewarmWorkerTopology {
    schema: 'xtend.rmt.prewarm-worker-topology.v1';
    kind: 'rmt-prewarm' | string;
    enabled: boolean;
    status: 'disabled' | 'available' | 'ready' | 'degraded' | string;
    health: 'disabled' | 'available' | 'ready' | 'degraded' | string;
    reason?: string;
    workerName: string;
    workerType: 'classic' | 'module' | string;
    instantiated: boolean;
    pendingJobs: number;
    submittedJobs: number;
    templatesSynced: number;
    available: boolean;
    missingApis: string[];
    lastHealthAt: number;
    lastError: Record<string, unknown> | null;
    responsibilities: string[];
    supportedSignals: string[];
    excludedResponsibilities: string[];
    enabledBy?: 'none' | 'prewarmWorker' | 'uiCoprocessor' | string;
    coprocessor: RmtUiCoprocessorSnapshot;
    diagnostics?: Array<Record<string, unknown>>;
}

export interface RmtUiCoprocessorOptions {
    enabled?: boolean;
    mode?: 'opportunistic' | 'alwaysOn' | string;
    maxQueueDepth?: number;
    stalePolicy?: 'discard' | string;
    lifecycle?: 'runtime' | 'app' | string;
}

export interface RmtUiCoprocessorSnapshot {
    enabled: boolean;
    mode: 'opportunistic' | 'alwaysOn' | string;
    lifecycle: 'runtime' | 'app' | string;
    queueDepthMax: number;
    maxQueueDepth: number;
    stalePolicy: 'discard' | string;
    status: string;
    pendingJobs: number;
    submittedJobs: number;
    transferBytes: number;
    staleResponses: number;
    supersededResponses: number;
    stateOwnership: 'main-thread' | string;
    trustedDomCommit: 'main-thread' | string;
    clientDetermined: boolean;
    ssrRoundtripCount: number;
}

export interface RmtPrewarmWorkerRuntime {
    dispatchPrerenderEnvelope(
        envelope: RmtTemplatePrerenderEnvelope,
        options?: Record<string, unknown>
    ): Promise<RmtTemplatePrerenderResponseEnvelope | Record<string, unknown>>;
    dispatchUiComputeEnvelope(
        envelope: RmtTemplatePrerenderEnvelope | Record<string, unknown>,
        options?: Record<string, unknown>
    ): Promise<RmtTemplatePrerenderResponseEnvelope | Record<string, unknown>>;
    getTopologySnapshot(): RmtPrewarmWorkerTopology;
    getWorker(): Worker | unknown;
    healthCheck(): Promise<Record<string, unknown>>;
    syncTemplates(options?: Record<string, unknown>): Promise<Record<string, unknown>>;
    terminateWorker(reason?: string): boolean;
}

export interface RmtPrewarmWorkerSourceBuilder {
    buildSource(): string;
}

export interface RmtServerPrerenderRuntime extends Omit<
    RmtBrowserRuntime,
    | 'createServerAdapter'
    | 'createServerTransport'
    | 'execute'
    | 'executeTemplate'
    | 'getServerAdapter'
    | 'getServerTransport'
    | 'prerender'
    | 'prerenderTemplate'
    | 'render'
    | 'renderTemplate'
    | 'withDefaults'
> {
    runtimeKind: 'server_prerender' | string;
    createServerAdapter(options?: RmtServerPrerenderRuntimeOptions): RmtTemplateTransportAdapter;
    createServerTransport(options?: RmtServerPrerenderRuntimeOptions): RmtTemplateTransportAdapter;
    execute(
        targetOrRequest: RmtTemplateExecutionRequest | RmtIslandTarget,
        templateRef?: string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): Promise<RmtTemplateTransportExecutionResult>;
    executeTemplate(
        targetOrRequest: RmtTemplateExecutionRequest | RmtIslandTarget,
        templateRef?: string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): Promise<RmtTemplateTransportExecutionResult>;
    getBrowserRuntime(): RmtBrowserRuntime;
    getServerAdapter(): RmtTemplateTransportAdapter;
    getServerTransport(): RmtTemplateTransportAdapter;
    getServerTransportDispatcher(): ((envelope: RmtTemplatePrerenderEnvelope, options?: Record<string, unknown>) => Promise<RmtTemplatePrerenderResponseEnvelope> | RmtTemplatePrerenderResponseEnvelope) | null;
    hydrateResponse(
        responseInput?: RmtTemplatePrerenderResponseEnvelope | RmtTemplateChunk | Record<string, unknown> | string,
        requestInput?: RmtTemplateExecutionRequest | RmtTemplatePrerenderEnvelope | Record<string, unknown>,
        options?: Record<string, unknown>
    ): RmtTemplateTransportExecutionResult;
    prerender(
        templateOrRequest: RmtTemplateExecutionRequest | string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): Promise<RmtTemplatePrerenderResponseEnvelope>;
    prerenderTemplate(
        templateOrRequest: RmtTemplateExecutionRequest | string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): Promise<RmtTemplatePrerenderResponseEnvelope>;
    render(
        targetOrRequest: RmtTemplateExecutionRequest | RmtIslandTarget,
        templateRef?: string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): Promise<RmtTemplateTransportExecutionResult>;
    renderTemplate(
        targetOrRequest: RmtTemplateExecutionRequest | RmtIslandTarget,
        templateRef?: string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): Promise<RmtTemplateTransportExecutionResult>;
    requestPrerender(
        templateOrRequest: RmtTemplateExecutionRequest | string | Record<string, unknown>,
        model?: Record<string, unknown>,
        options?: Record<string, unknown>
    ): Promise<RmtTemplatePrerenderResponseEnvelope>;
    withDefaults(nextDefaults?: Partial<RmtBrowserRuntimeDefaults> & Record<string, unknown>): RmtServerPrerenderRuntime;
}

export interface RmtOptionalCompatAvailability {
    browserHostAdapter: boolean;
}

export interface RmtResolvedEntryPoint {
    kind: 'appmodules_factory' | 'classic_global' | string;
    name: string;
}

export interface RmtProductSurfaceCompat {
    createBrowserHostAdapter: ((options?: Record<string, unknown>) => RmtHostAdapter) | null;
}

export interface RmtProductSurface {
    compat: RmtProductSurfaceCompat;
    createPerformanceRuntime(options?: RmtPerformanceRuntimeOptions): RmtPerformanceRuntime;
    createRuntime(options?: RmtBrowserRuntimeOptions): RmtBrowserRuntime;
    createBrowserRuntime(options?: RmtBrowserRuntimeOptions): RmtBrowserRuntime;
    createDetachedDomRuntime(options?: RmtDetachedDomRuntimeOptions): RmtDetachedDomRuntime;
    createWorkerRuntime(options?: RmtWorkerPrerenderRuntimeOptions): RmtWorkerPrerenderRuntime;
    createWorkerPrerenderRuntime(options?: RmtWorkerPrerenderRuntimeOptions): RmtWorkerPrerenderRuntime;
    createServerRuntime(options?: RmtServerPrerenderRuntimeOptions): RmtServerPrerenderRuntime;
    createServerPrerenderRuntime(options?: RmtServerPrerenderRuntimeOptions): RmtServerPrerenderRuntime;
    createCore(options?: RmtCoreOptions): RmtCore;
    createDomCompat(options?: RmtDomCompatOptions): RmtDomCompat;
    createManifest(options?: RmtManifestOptions): RmtProductManifest;
    createPublicApi(options?: RmtPublicApiOptions): RmtPublicApi;
    createTemplateApi(options?: RmtTemplateApiOptions): RmtTemplateApi;
    createTemplateCompiler(options?: RmtTemplateApiOptions): RmtTemplateCompiler;
    createTemplateArtifacts(options?: RmtTemplateApiOptions): RmtTemplateArtifacts;
    createTemplateRuntimeRenderer(options?: RmtTemplateApiOptions): RmtTemplateRuntimeRenderer;
    createTemplateExecutionPath(options?: RmtTemplateApiOptions): RmtTemplateExecutionPath;
    createTemplateServerAdapter(options?: RmtTemplateApiOptions): RmtTemplateTransportAdapter;
    createTemplateWorkerAdapter(options?: RmtTemplateApiOptions): RmtTemplateTransportAdapter;
    createPrewarmWorkerRuntime(options?: RmtPrewarmWorkerRuntimeOptions): RmtPrewarmWorkerRuntime | null;
    getManifest(): RmtProductManifest;
    globalName: string;
    listBuildTargets(): RmtBuildTarget[];
    listEntryPoints(): RmtResolvedEntryPoint[];
    listOptionalCompat(): RmtOptionalCompatAvailability;
    productName: string;
    version: string;
}

export interface RmtCoreOptions extends Record<string, unknown> {
    windowTarget?: unknown;
    documentTarget?: Document | null | unknown;
    hostAdapter?: RmtHostAdapter;
    diagnosticsHub?: unknown;
    diagnostics?: unknown;
    reactivity?: unknown;
    commandBus?: unknown;
    scheduler?: RmtKernelScheduler;
    kernelScheduler?: RmtKernelScheduler;
    compatibilityAdapters?: unknown[];
    compatibilityAdapter?: unknown;
    rmt?: RmtInstance;
    globalName?: string;
    releaseStage?: string;
}

export interface RmtDomCompatOptions extends Record<string, unknown> {
    windowTarget?: unknown;
    documentTarget?: Document | null | unknown;
    rmtCore?: RmtCore;
    rmt?: RmtInstance;
    hostAdapter?: RmtHostAdapter;
    globalName?: string;
    allowDetachedElements?: boolean;
}

export interface RmtPublicApiOptions extends RmtDomCompatOptions {
    domCompat?: RmtDomCompat;
    templateApi?: RmtTemplateApi | null;
}

export interface RmtManifestOptions extends Record<string, unknown> {
    globalName?: string;
    releaseStage?: string;
}

export interface RmtApplicationEventRouterPort {
    reconcile(root?: unknown, commitResult?: RmtDomCommitResult | null): Readonly<Record<string, unknown>>;
}

export interface RmtTemplateApiOptions extends RmtManifestOptions {
    windowTarget?: unknown;
    documentTarget?: Document | null | unknown;
    publicApi?: RmtPublicApi;
    getPublicApi?: () => RmtPublicApi | null;
    rmtCore?: RmtCore;
    rmt?: RmtInstance;
    domCompat?: RmtDomCompat;
    rmtFormat?: RmtFormat;
    registry?: RmtTemplateRegistry;
    loader?: RmtTemplateLoader;
    compiler?: RmtTemplateCompiler;
    templateCompiler?: RmtTemplateCompiler;
    artifactApi?: RmtTemplateArtifacts;
    templateArtifacts?: RmtTemplateArtifacts;
    runtimeRenderer?: RmtTemplateRuntimeRenderer;
    eventRouter?: RmtApplicationEventRouterPort;
    eventRoutingRuntime?: RmtApplicationEventRouterPort;
    applicationEventRouter?: RmtApplicationEventRouterPort;
    commandBus?: {
        dispatchCommand(command: Record<string, unknown>, metadata?: Record<string, unknown>): unknown;
    };
    executionPath?: RmtTemplateExecutionPath;
    readText?: (source: string | Record<string, unknown>, options?: Record<string, unknown>) => Promise<string> | string;
}

export interface RmtBrowserRuntimeOptions extends RmtTemplateApiOptions {
    core?: RmtCore;
    rmtCore?: RmtCore;
    publicApi?: RmtPublicApi;
    templateApi?: RmtTemplateApi;
    prewarmWorkerRuntime?: RmtPrewarmWorkerRuntime;
    rmtPrewarmWorkerRuntime?: RmtPrewarmWorkerRuntime;
    hostAdapter?: RmtHostAdapter;
    browserHostAdapter?: RmtHostAdapter;
    defaults?: Partial<RmtBrowserRuntimeDefaults> & Record<string, unknown>;
    namespace?: string;
    defaultNamespace?: string;
    metadata?: Record<string, unknown>;
    enablePrewarmWorker?: boolean;
    enableUiCoprocessor?: boolean;
    uiCoprocessor?: RmtUiCoprocessorOptions;
    prewarmWorkerName?: string;
    prewarmWorkerType?: 'classic' | 'module' | string;
}

export interface RmtPrewarmWorkerRuntimeOptions extends RmtTemplateApiOptions {
    templateApi?: RmtTemplateApi;
    getTemplateApi?: () => RmtTemplateApi;
    buildWorkerSource?: () => string;
    blobCtor?: unknown;
    workerCtor?: unknown;
    urlApi?: unknown;
    workerName?: string;
    workerType?: 'classic' | 'module' | string;
    enableUiCoprocessor?: boolean;
    uiCoprocessor?: RmtUiCoprocessorOptions;
    now?: () => number;
}

export interface RmtPerformanceRuntimeOptions extends RmtTemplateApiOptions {
    rmtCore?: RmtCore;
    publicApi?: RmtPublicApi;
    rmt?: RmtInstance;
    hostAdapter?: RmtHostAdapter;
    diagnosticsHub?: unknown;
    schedulerDiagnostics?: Record<string, unknown>;
    runtimeKind?: string;
    hostKind?: string;
    now?: () => number;
    windowTarget?: Record<string, unknown>;
    performanceTarget?: Record<string, unknown>;
    navigatorTarget?: Record<string, unknown>;
    PerformanceObserverCtor?: unknown;
    collectBrowserSignals?: boolean;
    probeBrowserFrameOnInit?: boolean;
}

export interface RmtDetachedDomRuntimeOptions extends RmtBrowserRuntimeOptions {
    detachedHostAdapter?: RmtHostAdapter;
    allowDetachedElements?: boolean;
}

export interface RmtWorkerPrerenderRuntimeOptions extends RmtBrowserRuntimeOptions {
    browserRuntime?: RmtBrowserRuntime;
    baseRuntime?: RmtBrowserRuntime;
    workerTransport?: RmtTemplateTransportAdapter;
    templateWorkerAdapter?: RmtTemplateTransportAdapter;
    workerTransportOptions?: Record<string, unknown>;
    dispatchPrerenderEnvelope?: (
        envelope: RmtTemplatePrerenderEnvelope,
        options?: Record<string, unknown>
    ) => Promise<RmtTemplatePrerenderResponseEnvelope | Record<string, unknown>>
        | RmtTemplatePrerenderResponseEnvelope
        | Record<string, unknown>;
}

export interface RmtServerPrerenderRuntimeOptions extends RmtBrowserRuntimeOptions {
    browserRuntime?: RmtBrowserRuntime;
    baseRuntime?: RmtBrowserRuntime;
    serverTransport?: RmtTemplateTransportAdapter;
    templateServerAdapter?: RmtTemplateTransportAdapter;
    serverTransportOptions?: Record<string, unknown>;
    dispatchPrerenderEnvelope?: (
        envelope: RmtTemplatePrerenderEnvelope,
        options?: Record<string, unknown>
    ) => Promise<RmtTemplatePrerenderResponseEnvelope | Record<string, unknown>>
        | RmtTemplatePrerenderResponseEnvelope
        | Record<string, unknown>;
}

export declare function getRmtApiVersion(): string;
export declare function createRmtProductManifest(options?: RmtManifestOptions): RmtProductManifest;
export declare function createRmtCore(options?: RmtCoreOptions): RmtCore;
export declare function createRmtDomCompat(options?: RmtDomCompatOptions): RmtDomCompat;
export declare function createRmtPublicApi(options?: RmtPublicApiOptions): RmtPublicApi;
export declare function createRmtTemplateApi(options?: RmtTemplateApiOptions): RmtTemplateApi;
export declare function createRmtPerformanceRuntime(options?: RmtPerformanceRuntimeOptions): RmtPerformanceRuntime;
export declare function createRmtFormat(options?: Record<string, unknown>): RmtFormat;
export declare function createRmtTemplateRegistry(options?: { rmtFormat?: RmtFormat } & Record<string, unknown>): RmtTemplateRegistry;
export declare function createRmtTemplateLoader(options?: RmtTemplateApiOptions & { registry?: RmtTemplateRegistry }): RmtTemplateLoader;
export declare function createRmtTemplateCompiler(options?: RmtTemplateApiOptions): RmtTemplateCompiler;
export declare function createRmtTemplateArtifacts(options?: RmtTemplateApiOptions): RmtTemplateArtifacts;
export declare function createRmtTemplateRuntimeRenderer(options?: RmtTemplateApiOptions): RmtTemplateRuntimeRenderer;
export declare function createRmtTemplateExecutionPath(options?: RmtTemplateApiOptions): RmtTemplateExecutionPath;
export declare function createRmtTemplateWorkerAdapter(options?: RmtTemplateApiOptions): RmtTemplateTransportAdapter;
export declare function createRmtTemplateServerAdapter(options?: RmtTemplateApiOptions): RmtTemplateTransportAdapter;
export declare function createRmtXRouterAdapter(options?: Record<string, unknown>): RmtXRouterAdapter;
export declare function createRmtXtendComponentAdapter(options?: Record<string, unknown>): RmtXtendComponentAdapter;
export declare function createRmtSurfaceAdapter(options?: Record<string, unknown>): RmtSurfaceAdapter;
export declare function createRmtStateSchedulerDiagnosticsBridge(options?: RmtStateSchedulerDiagnosticsBridgeOptions): RmtStateSchedulerDiagnosticsBridge;
export declare function createRmtPrewarmWorkerSourceBuilder(options?: { workerName?: string } & Record<string, unknown>): RmtPrewarmWorkerSourceBuilder;
export declare function createRmtPrewarmWorkerRuntime(options?: RmtPrewarmWorkerRuntimeOptions): RmtPrewarmWorkerRuntime;
export declare function createRmtBrowserRuntime(options?: RmtBrowserRuntimeOptions): RmtBrowserRuntime;
export declare function createRmtRuntime(options?: RmtBrowserRuntimeOptions): RmtBrowserRuntime;
export declare function createRmtDetachedRuntime(options?: RmtDetachedDomRuntimeOptions): RmtDetachedDomRuntime;
export declare function createRmtWorkerPrerenderRuntime(options?: RmtWorkerPrerenderRuntimeOptions): RmtWorkerPrerenderRuntime;
export declare function createRmtWorkerRuntime(options?: RmtWorkerPrerenderRuntimeOptions): RmtWorkerPrerenderRuntime;
export declare function createRmtServerPrerenderRuntime(options?: RmtServerPrerenderRuntimeOptions): RmtServerPrerenderRuntime;
export declare function createRmtServerRuntime(options?: RmtServerPrerenderRuntimeOptions): RmtServerPrerenderRuntime;
export declare function createRmtProductSurface(options?: RmtManifestOptions): RmtProductSurface;
export declare function installRmtProductSurface(
    options?: RmtManifestOptions & { windowTarget?: unknown; productSurface?: RmtProductSurface; replace?: boolean }
): RmtProductSurface;
export declare function createRmtKernelPolicyParity(options?: Record<string, unknown>): RmtKernelRuntimePolicyParityController;
export declare function createRmtBrowserHostAdapter(options?: Record<string, unknown>): RmtHostAdapter;

/** @deprecated Use createRmtProductManifest(). */
export declare function createRmtProductManifest(options?: RmtManifestOptions): RmtProductManifest;
/** @deprecated Use createRmtDomCompat(). */
export declare function createRmtDomCompat(options?: RmtDomCompatOptions): RmtDomCompat;
/** @deprecated Use createRmtTemplateApi(). */
export declare function createRmtTemplateApi(options?: RmtTemplateApiOptions): RmtTemplateApi;
/** @deprecated Use createRmtFormat(). */
export declare function createRmtFormat(options?: Record<string, unknown>): RmtFormat;
/** @deprecated Use createRmtTemplateLoader(). */
export declare function createRmtTemplateLoader(options?: RmtTemplateApiOptions & { registry?: RmtTemplateRegistry }): RmtTemplateLoader;
/** @deprecated Use createRmtTemplateArtifacts(). */
export declare function createRmtTemplateArtifacts(options?: RmtTemplateApiOptions): RmtTemplateArtifacts;
/** @deprecated Use createRmtTemplateExecutionPath(). */
export declare function createRmtTemplateExecutionPath(options?: RmtTemplateApiOptions): RmtTemplateExecutionPath;
/** @deprecated Use createRmtTemplateServerAdapter(). */
export declare function createRmtTemplateServerAdapter(options?: RmtTemplateApiOptions): RmtTemplateTransportAdapter;
/** @deprecated Use createRmtXtendComponentAdapter(). */
export declare function createRmtXtendComponentAdapter(options?: Record<string, unknown>): RmtXtendComponentAdapter;
/** @deprecated Use createRmtStateSchedulerDiagnosticsBridge(). */
export declare function createRmtStateSchedulerDiagnosticsBridge(options?: RmtStateSchedulerDiagnosticsBridgeOptions): RmtStateSchedulerDiagnosticsBridge;
/** @deprecated Use createRmtPrewarmWorkerRuntime(). */
export declare function createRmtPrewarmWorkerRuntime(options?: RmtPrewarmWorkerRuntimeOptions): RmtPrewarmWorkerRuntime;
/** @deprecated Use createRmtDetachedRuntime(). */
export declare function createRmtDetachedDomRuntime(options?: RmtDetachedDomRuntimeOptions): RmtDetachedDomRuntime;
/** @deprecated Use createRmtServerPrerenderRuntime() or createRmtServerRuntime(). */
export declare function createRmtServerPrerenderRuntime(options?: RmtServerPrerenderRuntimeOptions): RmtServerPrerenderRuntime;
/** @deprecated Use createRmtBrowserHostAdapter(). */
export declare function createRmtBrowserHostAdapter(options?: Record<string, unknown>): RmtHostAdapter;


export type XtendRmtProductSurface = RmtProductSurface;
export type XtendRmtProductManifest = RmtProductManifest;
export type XtendRmtRuntime = RmtBrowserRuntime;
export type XtendRmtCore = RmtCore;


/** @deprecated Use RmtAppModulesFactories. */
export type RmtAppModulesFactories = RmtAppModulesFactories;
/** @deprecated Use RmtBackpressureProfile. */
export type RmtBackpressureProfile = RmtBackpressureProfile;
/** @deprecated Use RmtBrowserNativeMetricSample. */
export type RmtBrowserNativeMetricSample = RmtBrowserNativeMetricSample;
/** @deprecated Use RmtBrowserRuntime. */
export type RmtBrowserRuntime = RmtBrowserRuntime;
/** @deprecated Use RmtBrowserRuntimeDefaults. */
export type RmtBrowserRuntimeDefaults = RmtBrowserRuntimeDefaults;
/** @deprecated Use RmtBrowserRuntimeOptions. */
export type RmtBrowserRuntimeOptions = RmtBrowserRuntimeOptions;
/** @deprecated Use RmtBrowserSignalSnapshot. */
export type RmtBrowserSignalSnapshot = RmtBrowserSignalSnapshot;
/** @deprecated Use RmtBuildFormat. */
export type RmtBuildFormat = RmtBuildFormat;
/** @deprecated Use RmtBuildTarget. */
export type RmtBuildTarget = RmtBuildTarget;
/** @deprecated Use RmtBuiltTargetSummary. */
export type RmtBuiltTargetSummary = RmtBuiltTargetSummary;
/** @deprecated Use RmtClassicSurfaceEntryPoint. */
export type RmtClassicSurfaceEntryPoint = RmtClassicSurfaceEntryPoint;
/** @deprecated Use RmtCommandEnvelope. */
export type RmtCommandEnvelope = RmtCommandEnvelope;
/** @deprecated Use RmtCore. */
export type RmtCore = RmtCore;
/** @deprecated Use RmtCoreCapabilities. */
export type RmtCoreCapabilities = RmtCoreCapabilities;
/** @deprecated Use RmtCoreOptions. */
export type RmtCoreOptions = RmtCoreOptions;
/** @deprecated Use RmtDetachedDomRuntime. */
export type RmtDetachedDomRuntime = RmtDetachedDomRuntime;
/** @deprecated Use RmtDetachedDomRuntimeOptions. */
export type RmtDetachedDomRuntimeOptions = RmtDetachedDomRuntimeOptions;
/** @deprecated Use RmtDistributionFormat. */
export type RmtDistributionFormat = RmtDistributionFormat;
/** @deprecated Use RmtDomCompat. */
export type RmtDomCompat = RmtDomCompat;
/** @deprecated Use RmtDomCompatOptions. */
export type RmtDomCompatOptions = RmtDomCompatOptions;
/** @deprecated Use RmtEntryPointManifest. */
export type RmtEntryPointManifest = RmtEntryPointManifest;
/** @deprecated Use RmtHostAdapter. */
export type RmtHostAdapter = RmtHostAdapter;
/** @deprecated Use RmtHostContract. */
export type RmtHostContract = RmtHostContract;
/** @deprecated Use RmtInstance. */
export type RmtInstance = RmtInstance;
/** @deprecated Use RmtIslandContract. */
export type RmtIslandContract = RmtIslandContract;
/** @deprecated Use RmtIslandDescriptor. */
export type RmtIslandDescriptor = RmtIslandDescriptor;
/** @deprecated Use RmtIslandHandle. */
export type RmtIslandHandle = RmtIslandHandle;
/** @deprecated Use RmtIslandInput. */
export type RmtIslandInput = RmtIslandInput;
/** @deprecated Use RmtIslandTarget. */
export type RmtIslandTarget = RmtIslandTarget;
/** @deprecated Use RmtManifestOptions. */
export type RmtManifestOptions = RmtManifestOptions;
/** @deprecated Use RmtMigrationPolicy. */
export type RmtMigrationPolicy = RmtMigrationPolicy;
/** @deprecated Use RmtMountElement. */
export type RmtMountElement = RmtMountElement;
/** @deprecated Use RmtOptionalCompatAvailability. */
export type RmtOptionalCompatAvailability = RmtOptionalCompatAvailability;
/** @deprecated Use RmtOptionalCompatFactories. */
export type RmtOptionalCompatFactories = RmtOptionalCompatFactories;
/** @deprecated Use RmtOwnershipMode. */
export type RmtOwnershipMode = RmtOwnershipMode;
/** @deprecated Use RmtPerformanceArtifactWriteResult. */
export type RmtPerformanceArtifactWriteResult = RmtPerformanceArtifactWriteResult;
/** @deprecated Use RmtPerformanceAutomationHarnessRun. */
export type RmtPerformanceAutomationHarnessRun = RmtPerformanceAutomationHarnessRun;
/** @deprecated Use RmtPerformanceBaseline. */
export type RmtPerformanceBaseline = RmtPerformanceBaseline;
/** @deprecated Use RmtPerformanceBaselineComparison. */
export type RmtPerformanceBaselineComparison = RmtPerformanceBaselineComparison;
/** @deprecated Use RmtPerformanceBatchHarnessRun. */
export type RmtPerformanceBatchHarnessRun = RmtPerformanceBatchHarnessRun;
/** @deprecated Use RmtPerformanceBatchSeries. */
export type RmtPerformanceBatchSeries = RmtPerformanceBatchSeries;
/** @deprecated Use RmtPerformanceBudgetEvaluation. */
export type RmtPerformanceBudgetEvaluation = RmtPerformanceBudgetEvaluation;
/** @deprecated Use RmtPerformanceBudgetProfile. */
export type RmtPerformanceBudgetProfile = RmtPerformanceBudgetProfile;
/** @deprecated Use RmtPerformanceBudgetSnapshot. */
export type RmtPerformanceBudgetSnapshot = RmtPerformanceBudgetSnapshot;
/** @deprecated Use RmtPerformanceBudgetSummary. */
export type RmtPerformanceBudgetSummary = RmtPerformanceBudgetSummary;
/** @deprecated Use RmtPerformanceCiSummary. */
export type RmtPerformanceCiSummary = RmtPerformanceCiSummary;
/** @deprecated Use RmtPerformanceEndpointEvent. */
export type RmtPerformanceEndpointEvent = RmtPerformanceEndpointEvent;
/** @deprecated Use RmtPerformanceEndpointProfile. */
export type RmtPerformanceEndpointProfile = RmtPerformanceEndpointProfile;
/** @deprecated Use RmtPerformanceEndpointStats. */
export type RmtPerformanceEndpointStats = RmtPerformanceEndpointStats;
/** @deprecated Use RmtPerformanceExternalExportResult. */
export type RmtPerformanceExternalExportResult = RmtPerformanceExternalExportResult;
/** @deprecated Use RmtPerformanceFileArtifact. */
export type RmtPerformanceFileArtifact = RmtPerformanceFileArtifact;
/** @deprecated Use RmtPerformanceHarnessHistory. */
export type RmtPerformanceHarnessHistory = RmtPerformanceHarnessHistory;
/** @deprecated Use RmtPerformanceHarnessOutput. */
export type RmtPerformanceHarnessOutput = RmtPerformanceHarnessOutput;
/** @deprecated Use RmtPerformanceHistoryStorageStatus. */
export type RmtPerformanceHistoryStorageStatus = RmtPerformanceHistoryStorageStatus;
/** @deprecated Use RmtPerformanceMetricComparison. */
export type RmtPerformanceMetricComparison = RmtPerformanceMetricComparison;
/** @deprecated Use RmtPerformanceNightlyTrendlineNight. */
export type RmtPerformanceNightlyTrendlineNight = RmtPerformanceNightlyTrendlineNight;
/** @deprecated Use RmtPerformanceNightlyTrendlines. */
export type RmtPerformanceNightlyTrendlines = RmtPerformanceNightlyTrendlines;
/** @deprecated Use RmtPerformancePhaseSummary. */
export type RmtPerformancePhaseSummary = RmtPerformancePhaseSummary;
/** @deprecated Use RmtPerformanceRunComparison. */
export type RmtPerformanceRunComparison = RmtPerformanceRunComparison;
/** @deprecated Use RmtPerformanceRunReport. */
export type RmtPerformanceRunReport = RmtPerformanceRunReport;
/** @deprecated Use RmtPerformanceRuntime. */
export type RmtPerformanceRuntime = RmtPerformanceRuntime;
/** @deprecated Use RmtPerformanceRuntimeOptions. */
export type RmtPerformanceRuntimeOptions = RmtPerformanceRuntimeOptions;
/** @deprecated Use RmtPerformanceSnapshot. */
export type RmtPerformanceSnapshot = RmtPerformanceSnapshot;
/** @deprecated Use RmtPerformanceTrendSeries. */
export type RmtPerformanceTrendSeries = RmtPerformanceTrendSeries;
/** @deprecated Use RmtPreparedDocument. */
export type RmtPreparedDocument = RmtPreparedDocument;
/** @deprecated Use RmtPreparedTemplate. */
export type RmtPreparedTemplate = RmtPreparedTemplate;
/** @deprecated Use RmtPreparedTemplateDependencyRef. */
export type RmtPreparedTemplateDependencyRef = RmtPreparedTemplateDependencyRef;
/** @deprecated Use RmtPrewarmWorkerRuntime. */
export type RmtPrewarmWorkerRuntime = RmtPrewarmWorkerRuntime;
/** @deprecated Use RmtPrewarmWorkerRuntimeOptions. */
export type RmtPrewarmWorkerRuntimeOptions = RmtPrewarmWorkerRuntimeOptions;
/** @deprecated Use RmtPrewarmWorkerSourceBuilder. */
export type RmtPrewarmWorkerSourceBuilder = RmtPrewarmWorkerSourceBuilder;
/** @deprecated Use RmtPrewarmWorkerTopology. */
export type RmtPrewarmWorkerTopology = RmtPrewarmWorkerTopology;
/** @deprecated Use RmtProductManifest. */
export type RmtProductManifest = RmtProductManifest;
/** @deprecated Use RmtProductSurface. */
export type RmtProductSurface = RmtProductSurface;
/** @deprecated Use RmtProductSurfaceCompat. */
export type RmtProductSurfaceCompat = RmtProductSurfaceCompat;
/** @deprecated Use RmtPublicApi. */
export type RmtPublicApi = RmtPublicApi;
/** @deprecated Use RmtPublicApiOptions. */
export type RmtPublicApiOptions = RmtPublicApiOptions;
/** @deprecated Use RmtRegisteredTemplate. */
export type RmtRegisteredTemplate = RmtRegisteredTemplate;
/** @deprecated Use RmtResolvedEntryPoint. */
export type RmtResolvedEntryPoint = RmtResolvedEntryPoint;
/** @deprecated Use RmtResourceDescriptor. */
export type RmtResourceDescriptor = RmtResourceDescriptor;
/** @deprecated Use RmtDocument. */
export type RmtDocument = RmtDocument;
/** @deprecated Use RmtDocumentManifest. */
export type RmtDocumentManifest = RmtDocumentManifest;
/** @deprecated Use RmtFormat. */
export type RmtFormat = RmtFormat;
/** @deprecated Use RmtRootDescriptor. */
export type RmtRootDescriptor = RmtRootDescriptor;
/** @deprecated Use RmtRootHandle. */
export type RmtRootHandle = RmtRootHandle;
/** @deprecated Use RmtRuntimeContract. */
export type RmtRuntimeContract = RmtRuntimeContract;
/** @deprecated Use RmtServerPrerenderRuntime. */
export type RmtServerPrerenderRuntime = RmtServerPrerenderRuntime;
/** @deprecated Use RmtServerPrerenderRuntimeOptions. */
export type RmtServerPrerenderRuntimeOptions = RmtServerPrerenderRuntimeOptions;
/** @deprecated Use RmtTemplateApi. */
export type RmtTemplateApi = RmtTemplateApi;
/** @deprecated Use RmtTemplateApiOptions. */
export type RmtTemplateApiOptions = RmtTemplateApiOptions;
/** @deprecated Use RmtTemplateArtifactBundle. */
export type RmtTemplateArtifactBundle = RmtTemplateArtifactBundle;
/** @deprecated Use RmtTemplateArtifactBundleManifest. */
export type RmtTemplateArtifactBundleManifest = RmtTemplateArtifactBundleManifest;
/** @deprecated Use RmtTemplateArtifactDocument. */
export type RmtTemplateArtifactDocument = RmtTemplateArtifactDocument;
/** @deprecated Use RmtTemplateArtifactRegistrationResult. */
export type RmtTemplateArtifactRegistrationResult = RmtTemplateArtifactRegistrationResult;
/** @deprecated Use RmtTemplateArtifacts. */
export type RmtTemplateArtifacts = RmtTemplateArtifacts;
/** @deprecated Use RmtTemplateBindingKind. */
export type RmtTemplateBindingKind = RmtTemplateBindingKind;
/** @deprecated Use RmtTemplateBindingSession. */
export type RmtTemplateBindingSession = RmtTemplateBindingSession;
/** @deprecated Use RmtTemplateChunk. */
export type RmtTemplateChunk = RmtTemplateChunk;
/** @deprecated Use RmtTemplateCompiler. */
export type RmtTemplateCompiler = RmtTemplateCompiler;
/** @deprecated Use RmtTemplateDocumentRegistration. */
export type RmtTemplateDocumentRegistration = RmtTemplateDocumentRegistration;
/** @deprecated Use RmtTemplateErrorBoundary. */
export type RmtTemplateErrorBoundary = RmtTemplateErrorBoundary;
/** @deprecated Use RmtTemplateExecutionMode. */
export type RmtTemplateExecutionMode = RmtTemplateExecutionMode;
/** @deprecated Use RmtTemplateExecutionPath. */
export type RmtTemplateExecutionPath = RmtTemplateExecutionPath;
/** @deprecated Use RmtTemplateExecutionPhase. */
export type RmtTemplateExecutionPhase = RmtTemplateExecutionPhase;
/** @deprecated Use RmtTemplateExecutionPlan. */
export type RmtTemplateExecutionPlan = RmtTemplateExecutionPlan;
/** @deprecated Use RmtTemplateExecutionRequest. */
export type RmtTemplateExecutionRequest = RmtTemplateExecutionRequest;
/** @deprecated Use RmtTemplateExecutionResult. */
export type RmtTemplateExecutionResult = RmtTemplateExecutionResult;
/** @deprecated Use RmtTemplateExecutionTarget. */
export type RmtTemplateExecutionTarget = RmtTemplateExecutionTarget;
/** @deprecated Use RmtTemplateHydrationContract. */
export type RmtTemplateHydrationContract = RmtTemplateHydrationContract;
/** @deprecated Use RmtTemplateHydrationMode. */
export type RmtTemplateHydrationMode = RmtTemplateHydrationMode;
/** @deprecated Use RmtTemplateLoader. */
export type RmtTemplateLoader = RmtTemplateLoader;
/** @deprecated Use RmtTemplateMode. */
export type RmtTemplateMode = RmtTemplateMode;
/** @deprecated Use RmtTemplatePrerenderEnvelope. */
export type RmtTemplatePrerenderEnvelope = RmtTemplatePrerenderEnvelope;
/** @deprecated Use RmtTemplatePrerenderRequestSnapshot. */
export type RmtTemplatePrerenderRequestSnapshot = RmtTemplatePrerenderRequestSnapshot;
/** @deprecated Use RmtTemplatePrerenderResponseEnvelope. */
export type RmtTemplatePrerenderResponseEnvelope = RmtTemplatePrerenderResponseEnvelope;
/** @deprecated Use RmtTemplateProp. */
export type RmtTemplateProp = RmtTemplateProp;
/** @deprecated Use RmtTemplateRegistry. */
export type RmtTemplateRegistry = RmtTemplateRegistry;
/** @deprecated Use RmtTemplateRuntimeBinding. */
export type RmtTemplateRuntimeBinding = RmtTemplateRuntimeBinding;
/** @deprecated Use RmtTemplateRuntimeBindingSessionInput. */
export type RmtTemplateRuntimeBindingSessionInput = RmtTemplateRuntimeBindingSessionInput;
/** @deprecated Use RmtTemplateRuntimeRenderer. */
export type RmtTemplateRuntimeRenderer = RmtTemplateRuntimeRenderer;
/** @deprecated Use RmtTemplateSlot. */
export type RmtTemplateSlot = RmtTemplateSlot;
/** @deprecated Use RmtTemplateSlotKind. */
export type RmtTemplateSlotKind = RmtTemplateSlotKind;
/** @deprecated Use RmtTemplateTransportAdapter. */
export type RmtTemplateTransportAdapter = RmtTemplateTransportAdapter;
/** @deprecated Use RmtTemplateTransportExecutionResult. */
export type RmtTemplateTransportExecutionResult = RmtTemplateTransportExecutionResult;
/** @deprecated Use RmtUnmountIslandOptions. */
export type RmtUnmountIslandOptions = RmtUnmountIslandOptions;
/** @deprecated Use RmtWorkerPrerenderRuntime. */
export type RmtWorkerPrerenderRuntime = RmtWorkerPrerenderRuntime;
/** @deprecated Use RmtWorkerPrerenderRuntimeOptions. */
export type RmtWorkerPrerenderRuntimeOptions = RmtWorkerPrerenderRuntimeOptions;

declare const XtendRmtProduct: RmtProductSurface;
export default XtendRmtProduct;

declare global {
    const Rmt: RmtProductSurface;
    const xtend: {
        rmt: RmtProductSurface;
    };

    interface Window {
        Rmt: RmtProductSurface;
        xtend: {
            rmt: RmtProductSurface;
        };
    }
}

// <kernel-lab:rmt-dom-descriptor-renderer-types>
export const RMT_DOM_DESCRIPTOR_RENDERER_DIAGNOSTIC_SCHEMA: 'xtend.epic18.rmt-dom-renderer-diagnostic.v2';
export const RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA: 'xtend.epic18.rmt-dom-descriptor-renderer.v1';
export const RMT_DOM_COMMIT_RESULT_SCHEMA: 'xtend.rmt.dom-commit-result.v1';
export const RMT_DOM_APPLICATION_BINDING_SCHEMA: 'xtend.rmt.dom-application-binding.v1';
export const RMT_DOM_BINDING_SCOPE_SCHEMA: 'xtend.rmt.dom-binding-scope.v1';
export const TRUSTED_DOM_BOUNDARY: 'xtend.rmt.trusted-dom-boundary.explicit';

export interface RmtDomDescriptorSource {
  documentId?: string;
  templateId?: string;
  nodeId?: string;
  pointer?: string;
  line?: number | null;
  column?: number | null;
}

export interface RmtDomDescriptorDiagnostic {
  schema: typeof RMT_DOM_DESCRIPTOR_RENDERER_DIAGNOSTIC_SCHEMA;
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  source?: RmtDomDescriptorSource;
  sink?: string;
  filePath?: string;
  domain?: RmtDomOwnershipDomain;
  owner?: string;
  reservedOwner?: string;
  phase?: string;
  targetTag?: string;
}

export interface RmtDomDescriptorRendererOptions {
  documentTarget?: Document;
  diagnosticsHub?: {
    publish(channel: string, payload: unknown, meta?: Record<string, unknown>): unknown;
  };
  diagnosticChannel?: string;
  componentRegistry?: RmtComponentRegistryLike;
  registry?: RmtComponentRegistryLike;
  trustedDomRenderer?: (descriptor: unknown, context: unknown) => Node | Node[];
  /** @deprecated Use trustedDomRenderer. Removed in 1.0. */
  trustedDom?: (descriptor: unknown, context: unknown) => Node | Node[];
  renderOptions?: RmtDomDescriptorRenderOptions;
}

export interface RmtComponentRegistryLike {
  resolveComponentCapability?(tag: string): unknown;
  buildComponentDescriptor?(input: Record<string, unknown>, options?: Record<string, unknown>): unknown;
  bindComponentInstance?(element: Element, binding?: Record<string, unknown>, options?: Record<string, unknown>): unknown;
}

export interface RmtDomDescriptorRenderOptions {
  model?: Record<string, unknown>;
  selectorValues?: Record<string, unknown>;
  components?: Map<string, unknown> | unknown[];
  templates?: Map<string, unknown> | unknown[];
  slots?: Map<string, unknown> | unknown[];
  selectors?: Map<string, unknown> | unknown[];
  componentRegistry?: RmtComponentRegistryLike;
  registry?: RmtComponentRegistryLike;
  componentBindingOptions?: Record<string, unknown>;
  stateBridge?: {
    read?: (key: string) => unknown;
    write?: (key: string, value: unknown) => void;
  };
  refs?: Map<string, Element>;
  source?: RmtDomDescriptorSource;
  dispatchEvent?: (event: unknown) => void;
  trustedDomRenderer?: (descriptor: unknown, context: unknown) => Node | Node[];
  /** @deprecated Use trustedDomRenderer. Removed in 1.0. */
  trustedDom?: (descriptor: unknown, context: unknown) => Node | Node[];
  metadata?: unknown;
}

export type RmtTrustedDomPolicyReference =
  | string
  | { ref: string }
  | { id: string }
  | { name: string };

interface RmtTrustedHtmlDescriptorBase {
  type: 'trusted_html';
  trustedBoundary: typeof TRUSTED_DOM_BOUNDARY;
  html?: unknown;
  resource?: string;
  [key: string]: unknown;
}

/**
 * Canonical trusted-HTML descriptor. The referenced policy and
 * trustedDomRenderer boundary are both required before HTML can be materialized.
 */
export type RmtTrustedHtmlDescriptor =
  | (RmtTrustedHtmlDescriptorBase & {
      policyRef: string;
    })
  | (RmtTrustedHtmlDescriptorBase & {
      /** @deprecated Use policyRef. Retained as a 0.6/0.7 compatibility input. */
      policyId: string;
    })
  | (RmtTrustedHtmlDescriptorBase & {
      /** @deprecated Use policyRef. Retained as a 0.6/0.7 compatibility input. */
      trustedPolicy: RmtTrustedDomPolicyReference;
    })
  | (RmtTrustedHtmlDescriptorBase & {
      /** @deprecated Use policyRef. Retained as a 0.6/0.7 compatibility input. */
      policy: RmtTrustedDomPolicyReference;
    });

export type RmtDomSlotContent =
  | string
  | { markup: string; html?: never }
  | { html: string; markup?: never }
  | { descriptor: unknown }
  | { template: string }
  | RmtTrustedHtmlDescriptor;

export type RmtDomOwnershipDomain =
  | 'structure'
  | 'content'
  | 'attributes'
  | 'properties'
  | 'class'
  | 'part'
  | 'styleTokens'
  | 'events'
  | 'visibility'
  | 'validation';

export interface RmtDomOwnershipPolicy {
  /** Omission keeps the 0.6 legacy renderer behavior; supplied policies are validated fail-closed. */
  mode?: 'strict' | 'compatibility';
  strict?: boolean;
  owner?: string;
  writer?: string;
  domains?: Partial<Record<RmtDomOwnershipDomain, string>>;
  owners?: Partial<Record<RmtDomOwnershipDomain, string>>;
  domainOwners?: Partial<Record<RmtDomOwnershipDomain, string>>;
  reservations?: Partial<Record<RmtDomOwnershipDomain, string>>;
  /** Logical writer provenance for domains aggregated into this commit request. */
  claims?: Partial<Record<RmtDomOwnershipDomain, string>>;
  domainClaims?: Partial<Record<RmtDomOwnershipDomain, string>>;
  domainWriters?: Partial<Record<RmtDomOwnershipDomain, string>>;
}

interface RmtDomCommitRequestBase {
  context?: RmtDomDescriptorRenderOptions;
  ownership?: RmtDomOwnershipPolicy;
  metadata?: unknown;
}

export type RmtDomCommitRequest =
  | (RmtDomCommitRequestBase & {
      operation: 'create-node';
      descriptor: unknown;
    })
  | (RmtDomCommitRequestBase & {
      operation: 'replace-children';
      target: ParentNode;
      descriptor: unknown;
    })
  | (RmtDomCommitRequestBase & {
      operation: 'reconcile-children';
      target: ParentNode;
      descriptors: unknown[];
    })
  | (RmtDomCommitRequestBase & {
      operation: 'reconcile-element';
      target: Element;
      descriptor: unknown;
    })
  | (RmtDomCommitRequestBase & {
      operation: 'merge-element';
      target: Element;
      descriptor: unknown;
    });

export interface RmtDomApplicationBindingRecord {
  schema: typeof RMT_DOM_APPLICATION_BINDING_SCHEMA;
  id: string;
  bindingId: string;
  kind: 'application';
  target: EventTarget;
  event: string;
  command: string;
  action: string;
  options: Readonly<{ capture: boolean; once: boolean; passive: boolean }>;
  governance: Readonly<{
    capture: boolean;
    once: boolean;
    passive: boolean;
    preventDefault: boolean;
    stopPropagation: boolean;
    stopImmediatePropagation: boolean;
    retarget: string;
  }>;
  owner: string;
  component: string;
  payload?: unknown;
  payloadContract?: unknown;
  payloadAdapter?: unknown;
  closest?: unknown;
  condition?: unknown;
  guard?: unknown;
  postAction: readonly unknown[];
  commandTarget: unknown;
  lane: unknown;
  scope: string;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface RmtDomBindingScope {
  schema: typeof RMT_DOM_BINDING_SCOPE_SCHEMA;
  id: string;
  target: EventTarget | null;
  roots: readonly EventTarget[];
  complete: boolean;
  bindingIds: readonly string[];
  removedBindings: ReadonlyArray<{ bindingId: string; target: EventTarget }>;
}

export interface RmtDomCommitResult {
  schema: typeof RMT_DOM_COMMIT_RESULT_SCHEMA;
  operation: RmtDomCommitRequest['operation'];
  target: Node | null;
  nodes: Node[];
  nodeCount: number;
  changed: boolean;
  structural: boolean;
  bindings: readonly RmtDomApplicationBindingRecord[];
  bindingScope: RmtDomBindingScope;
  diagnostics: RmtDomDescriptorDiagnostic[];
  metadata: unknown;
}

export interface RmtDomDescriptorTransformExpression {
  op?: 'path' | 'map' | 'filter' | 'reduce' | 'countBy' | 'slice' | 'contains' | 'uppercase' | 'lowercase' | 'replace' | 'concat' | 'interpolate' | 'formatBytes' | 'formatDateShort' | 'formatDuration' | 'fallback' | string;
  operator?: string;
  kind?: string;
  format?: string;
  value?: unknown;
  from?: unknown;
  source?: unknown;
  path?: string;
  expression?: unknown;
  where?: unknown[] | unknown;
  filter?: unknown[] | unknown;
  rules?: unknown[] | unknown;
  values?: unknown[];
  parts?: unknown[];
  separator?: string;
  start?: unknown;
  end?: unknown;
  search?: unknown;
  replacement?: unknown;
  flags?: string;
  fallback?: unknown;
  key?: unknown;
  mode?: string;
}

export interface RmtNoManualHtmlGate {
  schema: 'xtend.epic18.no-manual-html-gate.v1';
  scanText(sourceText: string, options?: { filePath?: string }): RmtDomDescriptorDiagnostic[];
  scanFiles(files: Record<string, string>): RmtDomDescriptorDiagnostic[];
}

export interface RmtDomDescriptorRenderer {
  schema: typeof RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA;
  trustedDomBoundary: typeof TRUSTED_DOM_BOUNDARY;
  commit(request: RmtDomCommitRequest): RmtDomCommitResult;
  dispose(target?: Node, options?: { clearOwnedDom?: boolean }): void;
  render(root: Element, descriptor: unknown, options?: RmtDomDescriptorRenderOptions): {
    schema: 'xtend.epic18.rmt-dom-render-result.v1';
    root: Element;
    nodeCount: number;
    diagnostics: RmtDomDescriptorDiagnostic[];
  };
  renderNode(descriptor: unknown, options?: RmtDomDescriptorRenderOptions): Node | Node[];
  renderKeyed(root: Element, descriptors: unknown[], options?: RmtDomDescriptorRenderOptions): Node[];
  /** @deprecated Use commit({ operation: 'merge-element', ... }). Removed in 1.0. */
  patchElement(element: Element, descriptor: unknown, options?: RmtDomDescriptorRenderOptions): Element;
  resolveValue(value: unknown, options?: RmtDomDescriptorRenderOptions & { item?: unknown }): unknown;
  createNoManualHtmlGate(options?: unknown): RmtNoManualHtmlGate;
  isUrlAllowed(value: unknown): boolean;
  listDiagnostics(): RmtDomDescriptorDiagnostic[];
}

export function createNoManualHtmlGate(options?: unknown): RmtNoManualHtmlGate;
export function createRmtDomDescriptorRenderer(options?: RmtDomDescriptorRendererOptions): RmtDomDescriptorRenderer;
// </kernel-lab:rmt-dom-descriptor-renderer-types>
