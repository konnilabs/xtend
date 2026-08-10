/* modules/rmt-public-api.js */
(function registerRmtPublicApiModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});
    const PUBLIC_API_VERSION = '{{KERNEL_VERSION}}';
    const PRODUCT_NAME = 'XTendRMT';
    const PRODUCT_GLOBAL_NAME = 'xtend.rmt';
    const TYPES_ARTIFACT_PATH = 'dist/xtendrmt/rmt-core.d.ts';
    const MANIFEST_ARTIFACT_PATH = 'dist/xtendrmt/rmt-manifest.json';
    const RMT_SCHEMA_ARTIFACT_PATH = 'dist/xtendrmt/rmt.schema.json';
    const CORE_RELEASE_SOURCE_MODULES = Object.freeze(
        typeof __XTENDRMT_CANONICAL_SOURCE_MODULES__ !== 'undefined'
        && Array.isArray(__XTENDRMT_CANONICAL_SOURCE_MODULES__)
            ? __XTENDRMT_CANONICAL_SOURCE_MODULES__.slice()
            : []
    );
    const CORE_RELEASE_NAMED_EXPORTS = Object.freeze([
        'getRmtApiVersion',
        'createRmtProductManifest',
        'createRmtCore',
        'createRmtDomCompat',
        'createRmtPublicApi',
        'createRmtTemplateApi',
        'createRmtDomDescriptorRenderer',
        'createRmtFormat',
        'createRmtTemplateRegistry',
        'createRmtTemplateLoader',
        'createRmtTemplateCompiler',
        'createRmtTemplateArtifacts',
        'createRmtTemplateRuntimeRenderer',
        'createRmtTemplateExecutionPath',
        'createRmtTemplateWorkerAdapter',
        'createRmtTemplateServerAdapter',
        'createRmtXRouterAdapter',
        'createRmtXtendComponentAdapter',
        'createRmtSurfaceAdapter',
        'createRmtStateSchedulerDiagnosticsBridge',
        'createRmtPrewarmWorkerSourceBuilder',
        'createRmtPrewarmWorkerRuntime',
        'createRmtPerformanceRuntime',
        'createRmtRuntime',
        'createRmtDetachedRuntime',
        'createRmtWorkerRuntime',
        'createRmtServerRuntime',
        'createRmtProductSurface',
        'installRmtProductSurface',
        'createRmtKernelPolicyParity',
        'createRmtBrowserHostAdapter',
        'createRmtBrowserRuntime',
        'createRmtWorkerPrerenderRuntime',
        'createRmtServerPrerenderRuntime'
    ]);
    const OWNERSHIP_MODES = Object.freeze([
        'observe_only',
        'hydrate_existing',
        'replace_children',
        'managed_subtree'
    ]);

    function clampString(value, fallbackValue = '') {
        const safeValue = String(value || '').trim();
        return safeValue || fallbackValue;
    }

    function normalizeOwnershipMode(value, fallbackValue = 'managed_subtree') {
        const safeValue = clampString(value, fallbackValue);
        return OWNERSHIP_MODES.includes(safeValue) ? safeValue : fallbackValue;
    }

    function cloneSerializable(value, fallbackValue = null) {
        if (value === undefined) return fallbackValue;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (_error) {
            return fallbackValue;
        }
    }

    function isElementLike(value) {
        return !!value
            && typeof value === 'object'
            && typeof value.addEventListener === 'function'
            && typeof value.removeEventListener === 'function';
    }

    function resolveDocumentTarget(deps, windowTarget) {
        if (deps && Object.prototype.hasOwnProperty.call(deps, 'documentTarget')) {
            return deps.documentTarget || null;
        }
        return windowTarget && windowTarget.document ? windowTarget.document : null;
    }

    function createFallbackHostAdapter(windowTarget, documentTarget, explicitFactory) {
        const factory = resolveFactory('createRmtGenericHostAdapter', explicitFactory);
        if (typeof factory !== 'function') {
            throw new Error('RmtPublicApi benoetigt einen gueltigen generischen Host-Adapter.');
        }
        return factory({
            hostGlobal: windowTarget,
            documentTarget
        });
    }

    function resolveFactory(factoryName, explicitFactory) {
        if (typeof explicitFactory === 'function') return explicitFactory;
        return typeof appModules[factoryName] === 'function'
            ? appModules[factoryName]
            : null;
    }

    function buildProductManifest(options = {}) {
        const globalName = clampString(options.globalName, PRODUCT_GLOBAL_NAME);
        const buildTargets = [
            {
                id: 'rmt-runtime.browser',
                format: 'browser_classic',
                status: 'build_defined',
                artifactPath: 'dist/xtendrmt/rmt-runtime.browser.js',
                typesArtifactPath: TYPES_ARTIFACT_PATH,
                globalName,
                autoInstallGlobal: true,
                sourceModules: CORE_RELEASE_SOURCE_MODULES.slice(),
                manifestPath: MANIFEST_ARTIFACT_PATH
            },
            {
                id: 'rmt-core.esm',
                format: 'esm',
                status: 'build_defined',
                artifactPath: 'dist/xtendrmt/rmt-core.esm.js',
                typesArtifactPath: TYPES_ARTIFACT_PATH,
                globalName,
                autoInstallGlobal: false,
                sourceModules: CORE_RELEASE_SOURCE_MODULES.slice(),
                namedExports: CORE_RELEASE_NAMED_EXPORTS.slice(),
                manifestPath: MANIFEST_ARTIFACT_PATH
            },
            {
                id: 'rmt-runtime.esm',
                format: 'esm',
                status: 'build_defined',
                artifactPath: 'dist/xtendrmt/rmt-runtime.esm.js',
                typesArtifactPath: TYPES_ARTIFACT_PATH,
                globalName,
                autoInstallGlobal: false,
                sourceModules: CORE_RELEASE_SOURCE_MODULES.slice(),
                namedExports: CORE_RELEASE_NAMED_EXPORTS.slice(),
                manifestPath: MANIFEST_ARTIFACT_PATH
            }
        ];
        return Object.freeze({
            productName: PRODUCT_NAME,
            version: PUBLIC_API_VERSION,
            apiVersion: PUBLIC_API_VERSION,
            releaseStage: clampString(options.releaseStage, 'pre-release'),
            classicGlobalName: globalName,
            runtimeContract: {
                rootLifecycle: true,
                commandTransport: true,
                diagnostics: true,
                reactivity: true,
                priorityQueue: true,
                runtimeProfiles: true,
                performanceRuntime: true,
                performanceBudgeting: true,
                adaptiveScheduling: true,
                templateInfrastructure: true,
                templatePreparation: true,
                templateArtifacts: true,
                rmtDocuments: true,
                rmtFileExtensions: true,
                templateExecutionPath: true,
                templateExecutionTransports: true,
                templateRuntimeBindings: true,
                templateSlotComposition: true,
                templateProps: true,
                templateActionBindings: true,
                templateHydrationContracts: true,
                templateErrorBoundaries: true,
                insularHydration: true,
                minimalDomPatching: true,
                domDescriptorCommit: true,
                prerenderHydration: true,
                kernelTrustAuthority: true,
                trustedDomRuntime: true,
                bindingSecurity: true,
                panicMonitor: true,
                recovery: true,
                kernelEscalation: true,
                schedulerFailureSemantics: true,
                policyParity: true,
                securityRegression: true
            },
            ownershipModes: OWNERSHIP_MODES.slice(),
            distributionFormats: [
                {
                    id: 'runtime_browser_classic',
                    status: 'build_defined',
                    globalName,
                    installerFactory: 'installRmtProductSurface',
                    artifactPath: 'dist/xtendrmt/rmt-runtime.browser.js',
                    typesArtifactPath: TYPES_ARTIFACT_PATH,
                    entryPointId: 'rmt-runtime.browser'
                },
                {
                    id: 'core_esm',
                    status: 'build_defined',
                    globalName: '',
                    installerFactory: '',
                    artifactPath: 'dist/xtendrmt/rmt-core.esm.js',
                    typesArtifactPath: TYPES_ARTIFACT_PATH,
                    entryPointId: 'rmt-core.esm'
                },
                {
                    id: 'runtime_esm',
                    status: 'build_defined',
                    globalName: '',
                    installerFactory: '',
                    artifactPath: 'dist/xtendrmt/rmt-runtime.esm.js',
                    typesArtifactPath: TYPES_ARTIFACT_PATH,
                    entryPointId: 'rmt-runtime.esm'
                }
            ],
            schemaArtifacts: {
                rmtDocument: RMT_SCHEMA_ARTIFACT_PATH,
                legacyRmtDocument: 'dist/rmt/rmt.schema.json'
            },
            artifactParityContracts: [
                Object.freeze({
                    id: 'xtend.rmt.artifact-parity.v1',
                    status: 'epic-05-wp-13-contract',
                    sourceOfTruth: 'development/WP-E05-13-Build-Pipeline-und-Artefakt-Paritaet-fuer-XTendRMT-absichern.md',
                    gateCommand: 'node scripts/verify_xtendrmt_artifact_parity.js --json',
                    artifactPaths: [
                        'xtendrmt/rmt-core.esm.js',
                        'xtendrmt/rmt-runtime.esm.js',
                        'xtendrmt/rmt-runtime.browser.js',
                        'xtendrmt/rmt-core.d.ts',
                        'xtendrmt/rmt.schema.json',
                        'xtendrmt/rmt-manifest.json'
                    ],
                    entryPointTargets: [
                        'rmt-core.esm',
                        'rmt-runtime.esm',
                        'rmt-runtime.browser'
                    ],
                    requiredFactories: [
                        'createRmtDomDescriptorRenderer',
                        'createRmtFormat',
                        'createRmtXRouterAdapter',
                        'createRmtXtendComponentAdapter',
                        'createRmtSurfaceAdapter',
                        'createRmtStateSchedulerDiagnosticsBridge',
                        'createRmtKernelPolicyParity'
                    ],
                    requiredContractIds: [
                        'xtend.epic18.rmt-dom-descriptor-renderer.v1',
                        'xtend.rmt.dom-commit-result.v1',
                        'xtend.rmt.runtime-registry.v1',
                        'xtend.rmt.xrouter-adapter.v1',
                        'xtend.rmt.xtend-component-adapter.v1',
                        'xtend.surface.adapter.v1',
                        'xtend.rmt.state-scheduler-diagnostics-bridge.v1',
                        'xtend.rmt.artifact-parity.v1',
                        'xtend.rmt.kernel-artifact-parity.v1',
                        'xtend.rmt.kernel-trust-hardening.v1',
                        'xtend.rmt.kernel-trust-authority.v1',
                        'xtend.rmt.kernel-trust-verdict.v1',
                        'xtend.rmt.kernel-trusted-dom-runtime.v1',
                        'xtend.rmt.kernel-binding-security.v1',
                        'xtend.rmt.kernel-panic-monitor.v1',
                        'xtend.rmt.kernel-panic-state.v1',
                        'xtend.rmt.kernel-panic-event.v1',
                        'xtend.rmt.kernel-recovery.v1',
                        'xtend.rmt.kernel-recovery-outcome.v1',
                        'xtend.rmt.kernel-recovery-safe-snapshot.v1',
                        'xtend.rmt.kernel-escalation.v1',
                        'xtend.rmt.kernel-escalation-envelope.v1',
                        'xtend.rmt.kernel-scheduler-failure.v1',
                        'xtend.rmt.kernel-scheduler-failure-record.v1',
                        'xtend.rmt.kernel-policy-parity.v1',
                        'xtend.rmt.kernel-security-regression.v1'
                    ],
                    artifactSurfaces: [
                        'scripts/verify_xtendrmt_artifact_parity.js',
                        'RmtArtifactParityContract',
                        'artifactParityContracts',
                        'createRmtDomDescriptorRenderer',
                        'createRmtProductManifest',
                        'rmt-manifest.json entryPoints.appModulesFactories',
                        'ESM namedExports',
                        'RmtKernelRuntimeTrustVerdict',
                        'RmtKernelRuntimePanicSnapshot',
                        'RmtKernelRuntimeRecoveryOutcome',
                        'createRmtKernelPolicyParity',
                        'getPanicSnapshot',
                        'recoverFromPanic'
                    ],
                    driftChecks: [
                        'schema-contract-present',
                        'manifest-factories-match-runtime',
                        'esm-named-exports-match-manifest',
                        'types-cover-public-factories',
                        'runtime-bundles-parse',
                        'kernel-hardening-contracts-present',
                        'kernel-hardening-types-cover-runtime',
                        'runtime-trust-hooks-present',
                        'panic-recovery-hooks-present',
                        'browser-runtime-hardening-surfaces'
                    ],
                    buildPolicy: 'Upstream RMT source remains the source-of-truth; xtendrmt/ artifacts are synchronized regression references in this repository. RKSH-WP-10 keeps the Trust/Panic/Recovery hardening layer in schema, manifest, types and runtime artifacts.',
                    kernelBoundary: 'Artifact parity checks drift only and must not introduce XTend, XRouter, xstate or DOM runtime imports into the RMT kernel.',
                    kernelHardeningSourceOfTruth: 'development/WP-RKSH-10-Buildprozess-und-Artefakt-Paritaet-fuer-neue-Layer-absichern.md',
                    kernelHardeningContracts: [
                        'xtend.rmt.kernel-artifact-parity.v1',
                        'xtend.rmt.kernel-trust-hardening.v1',
                        'xtend.rmt.kernel-trust-authority.v1',
                        'xtend.rmt.kernel-trust-verdict.v1',
                        'xtend.rmt.kernel-trusted-dom-runtime.v1',
                        'xtend.rmt.kernel-binding-security.v1',
                        'xtend.rmt.kernel-panic-monitor.v1',
                        'xtend.rmt.kernel-panic-state.v1',
                        'xtend.rmt.kernel-panic-event.v1',
                        'xtend.rmt.kernel-recovery.v1',
                        'xtend.rmt.kernel-recovery-outcome.v1',
                        'xtend.rmt.kernel-recovery-safe-snapshot.v1',
                        'xtend.rmt.kernel-escalation.v1',
                        'xtend.rmt.kernel-escalation-envelope.v1',
                        'xtend.rmt.kernel-scheduler-failure.v1',
                        'xtend.rmt.kernel-scheduler-failure-record.v1',
                        'xtend.rmt.kernel-policy-parity.v1',
                        'xtend.rmt.kernel-security-regression.v1'
                    ],
                    kernelHardeningRuntimeHooks: [
                        'commitTrustedHtml',
                        'commitTrustedAttribute',
                        'commitTrustedProperty',
                        'listTrustVerdicts',
                        'getPanicSnapshot',
                        'listPanicEvents',
                        'recoverFromPanic',
                        'listRecoveryOutcomes',
                        'recordEscalation',
                        'panicBlockScope',
                        'createRmtKernelPolicyParity'
                    ],
                    kernelHardeningTypeSurfaces: [
                        'RmtKernelRuntimeTrustVerdict',
                        'RmtKernelRuntimePanicEvent',
                        'RmtKernelRuntimePanicSnapshot',
                        'RmtKernelRuntimeRecoverySafeSnapshot',
                        'RmtKernelRuntimeRecoveryOutcome',
                        'RmtKernelRuntimeEscalationEnvelope',
                        'RmtKernelRuntimeSchedulerFailureRecord',
                        'RmtKernelRuntimePolicyParityReport',
                        'createRmtKernelPolicyParity'
                    ],
                    kernelHardeningToolingModules: [
                        'tools/rmt-language/kernel-trust-authority.js',
                        'tools/rmt-language/kernel-panic-monitor.js',
                        'tools/rmt-language/kernel-recovery.js',
                        'tools/rmt-language/kernel-escalation.js',
                        'tools/rmt-language/kernel-scheduler-failure.js',
                        'tools/rmt-language/kernel-policy-parity.js',
                        'tools/rmt-language/kernel-security-regression.js'
                    ],
                    kernelHardeningGates: [
                        'node scripts/run_xtend_tests.js rmt-kernel-trust-authority --json',
                        'node scripts/run_xtend_tests.js rmt-kernel-trusted-dom-runtime --json',
                        'node scripts/run_xtend_tests.js rmt-kernel-binding-security --json',
                        'node scripts/run_xtend_tests.js rmt-kernel-panic-monitor --json',
                        'node scripts/run_xtend_tests.js rmt-kernel-recovery --json',
                        'node scripts/run_xtend_tests.js rmt-kernel-escalation --json',
                        'node scripts/run_xtend_tests.js rmt-kernel-scheduler-failure --json',
                        'node scripts/run_xtend_tests.js rmt-kernel-policy-parity --json',
                        'node scripts/run_xtend_tests.js rmt-kernel-security-regression --json',
                        'node scripts/verify_xtendrmt_artifact_parity.js --json'
                    ],
                    minimumGates: [
                        'node scripts/verify_xtendrmt_artifact_parity.js --json',
                        'node scripts/run_xtend_tests.js rmt-compatibility --json',
                        'node scripts/run_xtend_tests.js references --json'
                    ],
                    nextWorkpackages: [
                        'development/WP-E05-14-Bestcase-Demo-auf-native-Routes-und-Components-migrieren.md',
                        'development/WP-E05-15-Contract-Schema-und-Runtime-Tests-erweitern.md'
                    ]
                })
            ],
            templateDocumentFileTypes: {
                preferredExtension: '.rmt',
                supportedExtensions: ['.rmt', '.rmt.json', '.json'],
                jsonFallbackExtensions: ['.rmt.json', '.json'],
                contentType: 'application/vnd.xtendrmt+json',
                jsonFallbackContentType: 'application/json',
                jsonFallbackPolicy: '.rmt.json and .json are compatibility fallbacks for hosts without native RMT MIME support; new artifacts use .rmt.'
            },
            entryPoints: {
                appModulesFactories: Object.freeze({
                    core: 'createRmtCore',
                    domCompat: 'createRmtDomCompat',
                    domDescriptorRenderer: 'createRmtDomDescriptorRenderer',
                    browserRuntime: 'createRmtRuntime',
                    detachedDomRuntime: 'createRmtDetachedRuntime',
                    workerPrerenderRuntime: 'createRmtWorkerRuntime',
                    serverPrerenderRuntime: 'createRmtServerRuntime',
                    performanceRuntime: 'createRmtPerformanceRuntime',
                    manifest: 'createRmtProductManifest',
                    publicApi: 'createRmtPublicApi',
                    templateApi: 'createRmtTemplateApi',
                    format: 'createRmtFormat',
                    templateCompiler: 'createRmtTemplateCompiler',
                    templateArtifacts: 'createRmtTemplateArtifacts',
                    templateRuntimeRenderer: 'createRmtTemplateRuntimeRenderer',
                    templateExecutionPath: 'createRmtTemplateExecutionPath',
                    templateWorkerAdapter: 'createRmtTemplateWorkerAdapter',
                    templateServerAdapter: 'createRmtTemplateServerAdapter',
                    xrouterAdapter: 'createRmtXRouterAdapter',
                    xtendComponentAdapter: 'createRmtXtendComponentAdapter',
                    surfaceAdapter: 'createRmtSurfaceAdapter',
                    stateSchedulerDiagnosticsBridge: 'createRmtStateSchedulerDiagnosticsBridge',
                    kernelPolicyParity: 'createRmtKernelPolicyParity',
                    prewarmWorkerSource: 'createRmtPrewarmWorkerSourceBuilder',
                    prewarmWorkerRuntime: 'createRmtPrewarmWorkerRuntime'
                }),
                classicSurface: Object.freeze({
                    createSurfaceFactory: 'createRmtProductSurface',
                    installFactory: 'installRmtProductSurface',
                    globalName
                }),
                buildTargets: buildTargets.map((target) => Object.freeze({
                    ...target,
                    namedExports: Array.isArray(target.namedExports) ? target.namedExports.slice() : undefined,
                    sourceModules: Array.isArray(target.sourceModules) ? target.sourceModules.slice() : []
                })),
                optionalCompat: Object.freeze({
                    browserHostAdapter: 'createRmtBrowserHostAdapter',
                })
            },
            migrationPolicy: Object.freeze({
                additiveChanges: 'minor',
                breakingChanges: 'major',
                preReleaseLabelRequired: true
            })
        });
    }

    appModules.getRmtApiVersion = function getRmtApiVersion() {
        return PUBLIC_API_VERSION;
    };


    appModules.createRmtProductManifest = function createRmtProductManifest(deps = {}) {
        return buildProductManifest(deps);
    };


    appModules.createRmtTemplateApi = function createRmtTemplateApi(deps = {}) {
        const windowTarget = deps.windowTarget || global;
        const documentTarget = resolveDocumentTarget(deps, windowTarget);
        const createRmtFormatFactory = resolveFactory('createRmtFormat', deps.createRmtFormat);
        const createRmtTemplateRegistryFactory = resolveFactory('createRmtTemplateRegistry', deps.createRmtTemplateRegistry);
        const createRmtTemplateLoaderFactory = resolveFactory('createRmtTemplateLoader', deps.createRmtTemplateLoader);
        const createRmtTemplateBindingModelFactory = resolveFactory('createRmtTemplateBindingModel', deps.createRmtTemplateBindingModel);
        const createRmtTemplateCompilerFactory = resolveFactory('createRmtTemplateCompiler', deps.createRmtTemplateCompiler);
        const createRmtTemplateArtifactsFactory = resolveFactory('createRmtTemplateArtifacts', deps.createRmtTemplateArtifacts);
        const createRmtTemplateRuntimeRendererFactory = resolveFactory('createRmtTemplateRuntimeRenderer', deps.createRmtTemplateRuntimeRenderer);
        const createRmtTemplateExecutionPathFactory = resolveFactory('createRmtTemplateExecutionPath', deps.createRmtTemplateExecutionPath);
        const createRmtTemplateWorkerAdapterFactory = resolveFactory('createRmtTemplateWorkerAdapter', deps.createRmtTemplateWorkerAdapter);
        const createRmtTemplateServerAdapterFactory = resolveFactory('createRmtTemplateServerAdapter', deps.createRmtTemplateServerAdapter);

        const rmtFormat = deps.rmtFormat && typeof deps.rmtFormat === 'object'
            ? deps.rmtFormat
            : (typeof createRmtFormatFactory === 'function'
                ? createRmtFormatFactory()
                : null);
        if (!rmtFormat || typeof rmtFormat.parseDocument !== 'function') {
            throw new Error('RMT TemplateApi benoetigt ein gueltiges RMT-Format.');
        }

        const registry = (deps.registry && typeof deps.registry === 'object')
            ? deps.registry
            : (deps.templateRegistry && typeof deps.templateRegistry === 'object'
                ? deps.templateRegistry
                : null)
            || (typeof createRmtTemplateRegistryFactory === 'function'
                ? createRmtTemplateRegistryFactory({
                    rmtFormat
                })
                : null);
        if (!registry || typeof registry.registerDocument !== 'function') {
            throw new Error('RMT TemplateApi benoetigt eine gueltige TemplateRegistry.');
        }

        const loader = (deps.loader && typeof deps.loader === 'object')
            ? deps.loader
            : ((deps.templateLoader && typeof deps.templateLoader === 'object')
                ? deps.templateLoader
                : (typeof createRmtTemplateLoaderFactory === 'function'
                ? createRmtTemplateLoaderFactory({
                        windowTarget,
                        documentTarget,
                        rmtFormat,
                        registry,
                        readText: deps.readText
                    })
                    : null));
        if (!loader || typeof loader.loadRmtDocument !== 'function') {
            throw new Error('RMT TemplateApi benoetigt einen gueltigen TemplateLoader.');
        }

        let executionPath = null;
        let runtimeRenderer = null;
        let bindingModel = null;
        let compiler = null;
        let artifactApi = null;
        let templateApiFacade = null;

        function getRuntimeRenderer() {
            if (runtimeRenderer) return runtimeRenderer;
            if (deps.runtimeRenderer && typeof deps.runtimeRenderer === 'object') {
                runtimeRenderer = deps.runtimeRenderer;
                return runtimeRenderer;
            }
            if (typeof createRmtTemplateRuntimeRendererFactory !== 'function') {
                return null;
            }
            runtimeRenderer = createRmtTemplateRuntimeRendererFactory({
                ...deps,
                windowTarget,
                documentTarget,
                templateApi: templateApiFacade,
                registry,
                templateRegistry: registry,
                loader,
                templateLoader: loader,
                rmtFormat,
                getPublicApi: typeof deps.getPublicApi === 'function' ? deps.getPublicApi : undefined
            });
            return runtimeRenderer;
        }

        function getCompiler() {
            if (compiler) return compiler;
            if (deps.compiler && typeof deps.compiler === 'object') {
                compiler = deps.compiler;
                return compiler;
            }
            if (deps.templateCompiler && typeof deps.templateCompiler === 'object') {
                compiler = deps.templateCompiler;
                return compiler;
            }
            if (typeof createRmtTemplateCompilerFactory !== 'function') {
                return null;
            }
            if (!bindingModel && typeof createRmtTemplateBindingModelFactory === 'function') {
                bindingModel = createRmtTemplateBindingModelFactory();
            }
            compiler = createRmtTemplateCompilerFactory({
                ...deps,
                windowTarget,
                documentTarget,
                templateApi: templateApiFacade,
                registry,
                templateRegistry: registry,
                loader,
                templateLoader: loader,
                bindingModel,
                templateBindingModel: bindingModel,
                rmtFormat,
                getPublicApi: typeof deps.getPublicApi === 'function' ? deps.getPublicApi : undefined
            });
            return compiler;
        }

        function getArtifactApi() {
            if (artifactApi) return artifactApi;
            if (deps.artifactApi && typeof deps.artifactApi === 'object') {
                artifactApi = deps.artifactApi;
                return artifactApi;
            }
            if (deps.templateArtifacts && typeof deps.templateArtifacts === 'object') {
                artifactApi = deps.templateArtifacts;
                return artifactApi;
            }
            if (typeof createRmtTemplateArtifactsFactory !== 'function') {
                return null;
            }
            artifactApi = createRmtTemplateArtifactsFactory({
                ...deps,
                windowTarget,
                documentTarget,
                templateApi: templateApiFacade,
                compiler: getCompiler(),
                templateCompiler: getCompiler(),
                registry,
                templateRegistry: registry,
                loader,
                templateLoader: loader,
                rmtFormat,
                getPublicApi: typeof deps.getPublicApi === 'function' ? deps.getPublicApi : undefined
            });
            return artifactApi;
        }

        function getExecutionPath() {
            if (executionPath) return executionPath;
            if (typeof createRmtTemplateExecutionPathFactory !== 'function') {
                return null;
            }
            executionPath = createRmtTemplateExecutionPathFactory({
                ...deps,
                windowTarget,
                documentTarget,
                templateApi: templateApiFacade,
                registry,
                templateRegistry: registry,
                loader,
                templateLoader: loader,
                runtimeRenderer: getRuntimeRenderer(),
                rmtFormat,
                getPublicApi: typeof deps.getPublicApi === 'function' ? deps.getPublicApi : undefined
            });
            return executionPath;
        }

        templateApiFacade = Object.freeze({
            apiVersion: PUBLIC_API_VERSION,
            createExecutionPlan: (requestInput = {}, options = {}) => {
                const path = getExecutionPath();
                if (!path || typeof path.createExecutionPlan !== 'function') {
                    throw new Error('RmtTemplateApi hat keinen verfuegbaren ExecutionPath.');
                }
                return path.createExecutionPlan(requestInput, options);
            },
            createPrerenderEnvelope: (requestInput = {}, options = {}) => {
                const path = getExecutionPath();
                if (!path || typeof path.createPrerenderEnvelope !== 'function') {
                    throw new Error('RmtTemplateApi hat keinen verfuegbaren ExecutionPath.');
                }
                return path.createPrerenderEnvelope(requestInput, options);
            },
            createServerAdapter: (options = {}) => {
                if (typeof createRmtTemplateServerAdapterFactory !== 'function') {
                    throw new Error('RMT TemplateApi hat keinen verfuegbaren Server-Transport-Adapter.');
                }
                return createRmtTemplateServerAdapterFactory({
                    ...deps,
                    ...options,
                    windowTarget,
                    documentTarget,
                    templateApi: templateApiFacade,
                    registry,
                    templateRegistry: registry,
                    loader,
                    templateLoader: loader,
                    runtimeRenderer: getRuntimeRenderer(),
                    executionPath: getExecutionPath(),
                    rmtFormat,
                    getPublicApi: typeof deps.getPublicApi === 'function' ? deps.getPublicApi : undefined
                });
            },
            createWorkerAdapter: (options = {}) => {
                if (typeof createRmtTemplateWorkerAdapterFactory !== 'function') {
                    throw new Error('RMT TemplateApi hat keinen verfuegbaren Worker-Transport-Adapter.');
                }
                return createRmtTemplateWorkerAdapterFactory({
                    ...deps,
                    ...options,
                    windowTarget,
                    documentTarget,
                    templateApi: templateApiFacade,
                    registry,
                    templateRegistry: registry,
                    loader,
                    templateLoader: loader,
                    runtimeRenderer: getRuntimeRenderer(),
                    executionPath: getExecutionPath(),
                    rmtFormat,
                    getPublicApi: typeof deps.getPublicApi === 'function' ? deps.getPublicApi : undefined
                });
            },
            executeTemplate: (requestInput = {}, options = {}) => {
                const path = getExecutionPath();
                if (!path || typeof path.executeTemplate !== 'function') {
                    throw new Error('RmtTemplateApi hat keinen verfuegbaren ExecutionPath.');
                }
                return path.executeTemplate(requestInput, options);
            },
            createArtifactBundle: (documentInputs = [], options = {}) => {
                const artifacts = getArtifactApi();
                if (!artifacts || typeof artifacts.createArtifactBundle !== 'function') {
                    throw new Error('RmtTemplateApi hat keine verfuegbare Template-Artefakt-Schicht.');
                }
                return artifacts.createArtifactBundle(documentInputs, options);
            },
            createDocumentArtifact: (documentInput, options = {}) => {
                const artifacts = getArtifactApi();
                if (!artifacts || typeof artifacts.createDocumentArtifact !== 'function') {
                    throw new Error('RmtTemplateApi hat keine verfuegbare Template-Artefakt-Schicht.');
                }
                return artifacts.createDocumentArtifact(documentInput, options);
            },
            getFormat: () => rmtFormat,
            getArtifactApi,
            getCompiler,
            getExecutionPath,
            getLoader: () => loader,
            getManifest: () => buildProductManifest({
                globalName: deps.globalName
            }),
            getRegistry: () => registry,
            getRuntimeRenderer,
            listDocuments: () => registry.listDocuments(),
            listSupportedBindingKinds: () => {
                const renderer = getRuntimeRenderer();
                return renderer && typeof renderer.listSupportedBindingKinds === 'function'
                    ? renderer.listSupportedBindingKinds()
                    : (typeof rmtFormat.listSupportedBindingKinds === 'function'
                        ? rmtFormat.listSupportedBindingKinds()
                        : []);
            },
            listSupportedSlotKinds: () => {
                const renderer = getRuntimeRenderer();
                return renderer && typeof renderer.listSupportedSlotKinds === 'function'
                    ? renderer.listSupportedSlotKinds()
                    : (typeof rmtFormat.listSupportedSlotKinds === 'function'
                        ? rmtFormat.listSupportedSlotKinds()
                        : []);
            },
            listSupportedTemplateModes: () => (
                typeof rmtFormat.listSupportedTemplateModes === 'function'
                    ? rmtFormat.listSupportedTemplateModes()
                    : []
            ),
            listSupportedFileExtensions: () => (
                typeof rmtFormat.listSupportedFileExtensions === 'function'
                    ? rmtFormat.listSupportedFileExtensions()
                    : ['.rmt', '.rmt.json', '.json']
            ),
            getPreferredFileExtension: () => (
                typeof rmtFormat.getPreferredFileExtension === 'function'
                    ? rmtFormat.getPreferredFileExtension()
                    : '.rmt'
            ),
            getJsonFallbackFileExtensions: () => (
                typeof rmtFormat.getJsonFallbackFileExtensions === 'function'
                    ? rmtFormat.getJsonFallbackFileExtensions()
                    : ['.rmt.json', '.json']
            ),
            listSupportedHydrationModes: () => (
                typeof rmtFormat.listSupportedHydrationModes === 'function'
                    ? rmtFormat.listSupportedHydrationModes()
                    : []
            ),
            listSupportedExecutionModes: () => {
                const path = getExecutionPath();
                return path && typeof path.getSupportedExecutionModes === 'function'
                    ? path.getSupportedExecutionModes()
                    : [];
            },
            listTrustVerdicts: () => {
                const path = getExecutionPath();
                return path && typeof path.listTrustVerdicts === 'function' ? path.listTrustVerdicts() : [];
            },
            getPanicSnapshot: () => {
                const path = getExecutionPath();
                return path && typeof path.getPanicSnapshot === 'function' ? path.getPanicSnapshot() : null;
            },
            listPanicEvents: () => {
                const path = getExecutionPath();
                return path && typeof path.listPanicEvents === 'function' ? path.listPanicEvents() : [];
            },
            listSafeSnapshots: () => {
                const path = getExecutionPath();
                return path && typeof path.listSafeSnapshots === 'function' ? path.listSafeSnapshots() : [];
            },
            listRecoveryOutcomes: () => {
                const path = getExecutionPath();
                return path && typeof path.listRecoveryOutcomes === 'function' ? path.listRecoveryOutcomes() : [];
            },
            listQuarantinedScopes: () => {
                const path = getExecutionPath();
                return path && typeof path.listQuarantinedScopes === 'function' ? path.listQuarantinedScopes() : [];
            },
            listPanicRecoveryRecords: () => {
                const path = getExecutionPath();
                return path && typeof path.listPanicRecoveryRecords === 'function' ? path.listPanicRecoveryRecords() : [];
            },
            getPanicRecoverySnapshot: () => {
                const path = getExecutionPath();
                return path && typeof path.getPanicRecoverySnapshot === 'function' ? path.getPanicRecoverySnapshot() : null;
            },
            listTemplates: () => registry.listTemplates(),
            prepareDocument: (documentInput, options = {}) => {
                const templateCompiler = getCompiler();
                if (!templateCompiler || typeof templateCompiler.prepareDocument !== 'function') {
                    throw new Error('RmtTemplateApi hat keinen verfuegbaren TemplateCompiler.');
                }
                return templateCompiler.prepareDocument(documentInput, options);
            },
            prepareTemplate: (templateInput, options = {}) => {
                const templateCompiler = getCompiler();
                if (!templateCompiler || typeof templateCompiler.prepareTemplate !== 'function') {
                    throw new Error('RmtTemplateApi hat keinen verfuegbaren TemplateCompiler.');
                }
                return templateCompiler.prepareTemplate(templateInput, options);
            },
            hydrateTemplate: (requestInput = {}, options = {}) => {
                const path = getExecutionPath();
                if (!path || typeof path.hydrateTemplate !== 'function') {
                    throw new Error('RmtTemplateApi hat keinen verfuegbaren ExecutionPath.');
                }
                return path.hydrateTemplate(requestInput, options);
            },
            loadRmtDocument: (source, options = {}) => loader.loadRmtDocument(source, options),
            loadTemplateSource: (source, options = {}) => loader.loadTemplateSource(source, options),
            prerenderTemplate: (requestInput = {}, options = {}) => {
                const path = getExecutionPath();
                if (!path || typeof path.prerenderTemplate !== 'function') {
                    throw new Error('RmtTemplateApi hat keinen verfuegbaren ExecutionPath.');
                }
                return path.prerenderTemplate(requestInput, options);
            },
            registerDocument: (documentInput, options = {}) => registry.registerDocument(documentInput, options),
            registerArtifactBundle: (bundleInput, options = {}) => {
                const artifacts = getArtifactApi();
                if (!artifacts || typeof artifacts.registerArtifactBundle !== 'function') {
                    throw new Error('RmtTemplateApi hat keine verfuegbare Template-Artefakt-Schicht.');
                }
                return artifacts.registerArtifactBundle(bundleInput, options);
            },
            registerTemplate: (templateInput, options = {}) => registry.registerTemplate(templateInput, options),
            renderTemplate: (requestInput = {}, options = {}) => {
                const path = getExecutionPath();
                if (!path || typeof path.renderTemplate !== 'function') {
                    throw new Error('RmtTemplateApi hat keinen verfuegbaren ExecutionPath.');
                }
                return path.renderTemplate(requestInput, options);
            },
            resolvePreparedTemplate: (templateRef, options = {}) => {
                const templateCompiler = getCompiler();
                if (!templateCompiler || typeof templateCompiler.resolvePreparedTemplate !== 'function') {
                    throw new Error('RmtTemplateApi hat keinen verfuegbaren TemplateCompiler.');
                }
                return templateCompiler.resolvePreparedTemplate(templateRef, options);
            },
            resolveTemplate: (templateRef, options = {}) => registry.resolveTemplate(templateRef, options),
            serializeDocument: (documentInput, options = {}) => rmtFormat.serializeDocument(documentInput, options),
            version: PUBLIC_API_VERSION
        });

        return templateApiFacade;
    };


    appModules.createRmtCore = function createRmtCore(deps = {}) {
        const windowTarget = deps.windowTarget || global;
        const documentTarget = resolveDocumentTarget(deps, windowTarget);
        const createRmtEngineFactory = resolveFactory('createRmtEngine', deps.createRmtEngine)
            || resolveFactory('createRmt', deps.createRmt);
        if (typeof createRmtEngineFactory !== 'function') {
            throw new Error('RMT Core benoetigt createRmtEngine().');
        }

        const createRmtBrowserHostAdapterFactory = resolveFactory('createRmtBrowserHostAdapter', deps.createRmtBrowserHostAdapter);
        const createRmtDiagnosticsFactory = resolveFactory('createRmtDiagnostics', deps.createRmtDiagnostics);
        const createRmtDiagnosticsHubFactory = resolveFactory('createRmtDiagnosticsHub', deps.createRmtDiagnosticsHub);
        const createRmtReactivityFactory = resolveFactory('createRmtReactivity', deps.createRmtReactivity);
        const createRmtCommandBusFactory = resolveFactory('createRmtCommandBus', deps.createRmtCommandBus);
        const createRmtQueueFactory = resolveFactory('createRmtQueue', deps.createRmtQueue)
            || resolveFactory('createRmtPriorityQueue', deps.createRmtPriorityQueue);

        const hostAdapter = deps.hostAdapter
            || (typeof createRmtBrowserHostAdapterFactory === 'function'
                ? createRmtBrowserHostAdapterFactory({
                    windowTarget,
                    documentTarget
                })
                : createFallbackHostAdapter(windowTarget, documentTarget));
        const diagnosticsHub = deps.diagnosticsHub
            || (typeof createRmtDiagnosticsHubFactory === 'function'
                ? createRmtDiagnosticsHubFactory({
                    now: hostAdapter && typeof hostAdapter.now === 'function' ? hostAdapter.now : undefined
                })
                : null);
        const diagnostics = deps.diagnostics
            || (typeof createRmtDiagnosticsFactory === 'function'
                ? createRmtDiagnosticsFactory({
                    now: hostAdapter && typeof hostAdapter.now === 'function' ? hostAdapter.now : undefined
                })
                : null);
        const reactivity = deps.reactivity
            || (typeof createRmtReactivityFactory === 'function'
                ? createRmtReactivityFactory({
                    now: hostAdapter && typeof hostAdapter.now === 'function' ? hostAdapter.now : undefined,
                    diagnosticsHub
                })
                : null);
        const commandBus = deps.commandBus
            || (typeof createRmtCommandBusFactory === 'function'
                ? createRmtCommandBusFactory({
                    now: hostAdapter && typeof hostAdapter.now === 'function' ? hostAdapter.now : undefined,
                    createAbortController: hostAdapter && typeof hostAdapter.createAbortController === 'function'
                        ? hostAdapter.createAbortController
                        : undefined,
                    diagnosticsHub
                })
                : null);
        const priorityQueue = deps.priorityQueue
            || (typeof createRmtQueueFactory === 'function'
                ? createRmtQueueFactory({
                    now: hostAdapter && typeof hostAdapter.now === 'function' ? hostAdapter.now : undefined
                })
                : null);
        const compatibilityAdapters = Array.isArray(deps.compatibilityAdapters)
            ? deps.compatibilityAdapters.filter(Boolean)
            : (deps.compatibilityAdapter ? [deps.compatibilityAdapter] : []);
        const rmt = deps.rmt && typeof deps.rmt === 'object'
            ? deps.rmt
            : createRmtEngineFactory({
                windowTarget,
                documentTarget,
                hostAdapter,
                schedulerDiagnostics: diagnostics,
                diagnosticsHub,
                reactivity,
                commandBus,
                priorityQueue,
                compatibilityAdapters
            });

        function listCapabilities() {
            return {
                apiVersion: PUBLIC_API_VERSION,
                hostKind: hostAdapter && hostAdapter.hostKind ? hostAdapter.hostKind : 'generic',
                diagnostics: !!diagnostics,
                diagnosticsHub: !!diagnosticsHub,
                reactivity: !!reactivity,
                commandBus: !!commandBus,
                priorityQueue: !!priorityQueue,
                mountRoot: !!(rmt && typeof rmt.mountRoot === 'function'),
                registerBindings: !!(rmt && typeof rmt.registerBindings === 'function'),
                listRoots: !!(rmt && typeof rmt.listRoots === 'function')
            };
        }

        return Object.freeze({
            apiVersion: PUBLIC_API_VERSION,
            compatibilityAdapters: compatibilityAdapters.slice(),
            commandBus,
            diagnostics,
            diagnosticsHub,
            getCapabilities: listCapabilities,
            getManifest: () => buildProductManifest({
                globalName: deps.globalName
            }),
            getCommandBus: () => commandBus,
            getDiagnostics: () => diagnostics,
            getDiagnosticsHub: () => diagnosticsHub,
            getHostAdapter: () => hostAdapter,
            getPriorityQueue: () => priorityQueue,
            getReactivity: () => reactivity,
            getRmt: () => rmt,
            hostAdapter,
            priorityQueue,
            reactivity,
            rmt,
            version: PUBLIC_API_VERSION
        });
    };


    appModules.createRmtPublicApi = function createRmtPublicApi(deps = {}) {
        const windowTarget = deps.windowTarget || global;
        const documentTarget = resolveDocumentTarget(deps, windowTarget);
        const createRmtCoreFactory = resolveFactory('createRmtCore', deps.createRmtCore);
        const createRmtDomCompatFactory = resolveFactory('createRmtDomCompat', deps.createRmtDomCompat);
        const createRmtTemplateApiFactory = resolveFactory('createRmtTemplateApi', deps.createRmtTemplateApi);
        const createRmtPublicIslandControllerFactory = resolveFactory(
            'createRmtPublicIslandController',
            deps.createRmtPublicIslandController
        );
        const rmtCore = deps.rmtCore && typeof deps.rmtCore === 'object'
            ? deps.rmtCore
            : (typeof createRmtCoreFactory === 'function'
                ? createRmtCoreFactory({ ...deps, windowTarget, documentTarget })
                : null);
        if (!rmtCore || typeof rmtCore !== 'object') {
            throw new Error('RMT PublicApi benoetigt einen gueltigen RMT Core.');
        }

        const rmt = deps.rmt
            || rmtCore.rmt
            || (typeof rmtCore.getRmt === 'function' ? rmtCore.getRmt() : null);
        if (!rmt || typeof rmt.mountRoot !== 'function') {
            throw new Error('RmtPublicApi benoetigt eine gueltige Rmt-Instanz.');
        }

        const domCompat = deps.domCompat && typeof deps.domCompat === 'object'
            ? deps.domCompat
            : (typeof createRmtDomCompatFactory === 'function'
                ? createRmtDomCompatFactory({
                    ...deps,
                    rmtCore,
                    rmt,
                    windowTarget,
                    documentTarget
                })
                : null);
        if (!domCompat || typeof domCompat.resolveElement !== 'function') {
            throw new Error('RmtPublicApi benoetigt einen gueltigen DOM-Compat-Layer.');
        }
        if (typeof createRmtPublicIslandControllerFactory !== 'function') {
            throw new Error('RmtPublicApi benoetigt einen gueltigen IslandController.');
        }

        let publicApiFacade = null;
        const templateApi = deps.templateApi && typeof deps.templateApi === 'object'
            ? deps.templateApi
            : (typeof createRmtTemplateApiFactory === 'function'
                ? createRmtTemplateApiFactory({
                    ...deps,
                    windowTarget,
                    documentTarget,
                    rmtCore,
                    rmt,
                    domCompat,
                    getPublicApi: () => publicApiFacade
                })
                : null);
        const hostAdapter = deps.hostAdapter
            || (typeof rmtCore.getHostAdapter === 'function' ? rmtCore.getHostAdapter() : null);
        const islandController = createRmtPublicIslandControllerFactory({
            rmt,
            domCompat,
            now: hostAdapter && typeof hostAdapter.now === 'function'
                ? () => hostAdapter.now()
                : deps.now
        });
        publicApiFacade = islandController.createFacade({
            rmtCore,
            templateApi,
            getManifest: () => buildProductManifest({ globalName: deps.globalName })
        });
        return publicApiFacade;
    };

})(__XTENDRMT_GLOBAL__);
