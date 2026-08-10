/* modules/rmt-product-surface.js */
(function registerRmtProductSurfaceModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});
    const PRODUCT_NAME = 'XTendRMT';
    const DEFAULT_GLOBAL_NAME = 'xtend.rmt';

    function clampString(value, fallbackValue = '') {
        const safeValue = String(value || '').trim();
        return safeValue || fallbackValue;
    }

    function resolveFactory(factoryName, explicitFactory) {
        if (typeof explicitFactory === 'function') return explicitFactory;
        return typeof appModules[factoryName] === 'function'
            ? appModules[factoryName]
            : null;
    }

    function resolveRmtFactory(primaryName, legacyName, explicitFactory, explicitLegacyFactory) {
        return resolveFactory(primaryName, explicitFactory)
            || resolveFactory(legacyName, explicitLegacyFactory);
    }

    function resolveGlobalPath(globalName) {
        return clampString(globalName, DEFAULT_GLOBAL_NAME)
            .split('.')
            .map((entry) => clampString(entry, ''))
            .filter(Boolean);
    }

    function readNestedGlobal(windowTarget, globalName) {
        const path = resolveGlobalPath(globalName);
        return path.reduce((current, segment) => (
            current && typeof current === 'object' ? current[segment] : undefined
        ), windowTarget);
    }

    function writeNestedGlobal(windowTarget, globalName, value) {
        const path = resolveGlobalPath(globalName);
        if (path.length === 0) return value;
        const finalSegment = path[path.length - 1];
        const parent = path.slice(0, -1).reduce((current, segment) => {
            if (!current[segment] || typeof current[segment] !== 'object') {
                Object.defineProperty(current, segment, {
                    configurable: true,
                    enumerable: false,
                    writable: true,
                    value: {}
                });
            }
            return current[segment];
        }, windowTarget);
        Object.defineProperty(parent, finalSegment, {
            configurable: true,
            enumerable: false,
            writable: true,
            value
        });
        return value;
    }

    function createOptionalCompatSnapshot() {
        return Object.freeze({
            browserHostAdapter: typeof appModules.createRmtBrowserHostAdapter === 'function',
        });
    }

    function buildProductSurface(deps = {}) {
        const createCore = resolveRmtFactory('createRmtCore', 'createRmtCore', deps.createRmtCore, deps.createRmtCore);
        const createDomCompat = resolveRmtFactory('createRmtDomCompat', 'createRmtDomCompat', deps.createRmtDomCompat, deps.createRmtDomCompat);
        const createDomDescriptorRenderer = resolveRmtFactory('createRmtDomDescriptorRenderer', 'createRmtDomDescriptorRenderer', deps.createRmtDomDescriptorRenderer, deps.createRmtDomDescriptorRenderer);
        const createPerformanceRuntime = resolveRmtFactory('createRmtPerformanceRuntime', 'createRmtPerformanceRuntime', deps.createRmtPerformanceRuntime, deps.createRmtPerformanceRuntime);
        const createBrowserRuntime = resolveRmtFactory('createRmtBrowserRuntime', 'createRmtBrowserRuntime', deps.createRmtBrowserRuntime, deps.createRmtBrowserRuntime);
        const createDetachedRuntime = resolveRmtFactory('createRmtDetachedRuntime', 'createRmtDetachedDomRuntime', deps.createRmtDetachedRuntime, deps.createRmtDetachedDomRuntime);
        const createWorkerRuntime = resolveRmtFactory('createRmtWorkerPrerenderRuntime', 'createRmtWorkerPrerenderRuntime', deps.createRmtWorkerPrerenderRuntime, deps.createRmtWorkerPrerenderRuntime);
        const createServerRuntime = resolveRmtFactory('createRmtServerPrerenderRuntime', 'createRmtServerPrerenderRuntime', deps.createRmtServerPrerenderRuntime, deps.createRmtServerPrerenderRuntime);
        const createPublicApi = resolveRmtFactory('createRmtPublicApi', 'createRmtPublicApi', deps.createRmtPublicApi, deps.createRmtPublicApi);
        const createTemplateApi = resolveRmtFactory('createRmtTemplateApi', 'createRmtTemplateApi', deps.createRmtTemplateApi, deps.createRmtTemplateApi);
        const createTemplateCompiler = resolveRmtFactory('createRmtTemplateCompiler', 'createRmtTemplateCompiler', deps.createRmtTemplateCompiler, deps.createRmtTemplateCompiler);
        const createTemplateArtifacts = resolveRmtFactory('createRmtTemplateArtifacts', 'createRmtTemplateArtifacts', deps.createRmtTemplateArtifacts, deps.createRmtTemplateArtifacts);
        const createTemplateRuntimeRenderer = resolveRmtFactory('createRmtTemplateRuntimeRenderer', 'createRmtTemplateRuntimeRenderer', deps.createRmtTemplateRuntimeRenderer, deps.createRmtTemplateRuntimeRenderer);
        const createTemplateExecutionPath = resolveRmtFactory('createRmtTemplateExecutionPath', 'createRmtTemplateExecutionPath', deps.createRmtTemplateExecutionPath, deps.createRmtTemplateExecutionPath);
        const createTemplateWorkerAdapter = resolveRmtFactory('createRmtTemplateWorkerAdapter', 'createRmtTemplateWorkerAdapter', deps.createRmtTemplateWorkerAdapter, deps.createRmtTemplateWorkerAdapter);
        const createTemplateServerAdapter = resolveRmtFactory('createRmtTemplateServerAdapter', 'createRmtTemplateServerAdapter', deps.createRmtTemplateServerAdapter, deps.createRmtTemplateServerAdapter);
        const createPrewarmWorkerRuntime = resolveRmtFactory('createRmtPrewarmWorkerRuntime', 'createRmtPrewarmWorkerRuntime', deps.createRmtPrewarmWorkerRuntime, deps.createRmtPrewarmWorkerRuntime);
        const createProductManifest = resolveRmtFactory('createRmtProductManifest', 'createRmtProductManifest', deps.createRmtProductManifest, deps.createRmtProductManifest);
        if (
            typeof createCore !== 'function'
            || typeof createDomCompat !== 'function'
            || typeof createDomDescriptorRenderer !== 'function'
            || typeof createPerformanceRuntime !== 'function'
            || typeof createBrowserRuntime !== 'function'
            || typeof createDetachedRuntime !== 'function'
            || typeof createWorkerRuntime !== 'function'
            || typeof createServerRuntime !== 'function'
            || typeof createPublicApi !== 'function'
            || typeof createTemplateApi !== 'function'
            || typeof createTemplateCompiler !== 'function'
            || typeof createTemplateArtifacts !== 'function'
            || typeof createTemplateRuntimeRenderer !== 'function'
            || typeof createTemplateExecutionPath !== 'function'
            || typeof createTemplateWorkerAdapter !== 'function'
            || typeof createTemplateServerAdapter !== 'function'
        ) {
            throw new Error('XTendRMT ProductSurface benoetigt Core-, DomCompat-, PerformanceRuntime-, BrowserRuntime-, DetachedRuntime-, WorkerRuntime-, ServerRuntime-, PublicApi-, TemplateApi-, TemplateCompiler-, TemplateArtifacts-, TemplateRuntimeRenderer-, TemplateExecutionPath- sowie Template-Transport-Adapter-Factories.');
        }

        const globalName = clampString(deps.globalName, DEFAULT_GLOBAL_NAME);
        const manifest = typeof createProductManifest === 'function'
            ? createProductManifest({
                ...deps,
                globalName
            })
            : {
                productName: PRODUCT_NAME,
                version: '0.0.0',
                classicGlobalName: globalName
            };
        const optionalCompat = createOptionalCompatSnapshot();

        function listEntryPoints() {
            const appModuleFactories = manifest && manifest.entryPoints && manifest.entryPoints.appModulesFactories
                ? manifest.entryPoints.appModulesFactories
                : {};
            const classicSurface = manifest && manifest.entryPoints && manifest.entryPoints.classicSurface
                ? manifest.entryPoints.classicSurface
                : {};
            return [
                {
                    kind: 'appmodules_factory',
                    name: clampString(appModuleFactories.core, 'createRmtCore')
                },
                {
                    kind: 'appmodules_factory',
                    name: clampString(appModuleFactories.domCompat, 'createRmtDomCompat')
                },
                {
                    kind: 'appmodules_factory',
                    name: clampString(appModuleFactories.domDescriptorRenderer, 'createRmtDomDescriptorRenderer')
                },
                {
                    kind: 'appmodules_factory',
                    name: clampString(appModuleFactories.performanceRuntime, 'createRmtPerformanceRuntime')
                },
                {
                    kind: 'appmodules_factory',
                    name: clampString(appModuleFactories.browserRuntime, 'createRmtRuntime')
                },
                {
                    kind: 'appmodules_factory',
                    name: clampString(appModuleFactories.detachedDomRuntime, 'createRmtDetachedRuntime')
                },
                {
                    kind: 'appmodules_factory',
                    name: clampString(appModuleFactories.workerPrerenderRuntime, 'createRmtWorkerRuntime')
                },
                {
                    kind: 'appmodules_factory',
                    name: clampString(appModuleFactories.serverPrerenderRuntime, 'createRmtServerRuntime')
                },
                {
                    kind: 'appmodules_factory',
                    name: clampString(appModuleFactories.publicApi, 'createRmtPublicApi')
                },
                {
                    kind: 'appmodules_factory',
                    name: clampString(appModuleFactories.templateApi, 'createRmtTemplateApi')
                },
                {
                    kind: 'appmodules_factory',
                    name: clampString(appModuleFactories.templateCompiler, 'createRmtTemplateCompiler')
                },
                {
                    kind: 'appmodules_factory',
                    name: clampString(appModuleFactories.templateArtifacts, 'createRmtTemplateArtifacts')
                },
                {
                    kind: 'appmodules_factory',
                    name: clampString(appModuleFactories.templateRuntimeRenderer, 'createRmtTemplateRuntimeRenderer')
                },
                {
                    kind: 'appmodules_factory',
                    name: clampString(appModuleFactories.templateExecutionPath, 'createRmtTemplateExecutionPath')
                },
                {
                    kind: 'appmodules_factory',
                    name: clampString(appModuleFactories.templateWorkerAdapter, 'createRmtTemplateWorkerAdapter')
                },
                {
                    kind: 'appmodules_factory',
                    name: clampString(appModuleFactories.templateServerAdapter, 'createRmtTemplateServerAdapter')
                },
                {
                    kind: 'appmodules_factory',
                    name: clampString(appModuleFactories.prewarmWorkerRuntime, 'createRmtPrewarmWorkerRuntime')
                },
                {
                    kind: 'classic_global',
                    name: clampString(classicSurface.globalName, globalName)
                }
            ];
        }

        function listBuildTargets() {
            const buildTargets = manifest && manifest.entryPoints && Array.isArray(manifest.entryPoints.buildTargets)
                ? manifest.entryPoints.buildTargets
                : [];
            return buildTargets.map((target) => ({
                ...target,
                namedExports: Array.isArray(target.namedExports) ? target.namedExports.slice() : [],
                sourceModules: Array.isArray(target.sourceModules) ? target.sourceModules.slice() : []
            }));
        }

        return Object.freeze({
            compat: Object.freeze({
                createBrowserHostAdapter: resolveRmtFactory('createRmtBrowserHostAdapter', 'createRmtBrowserHostAdapter', deps.createRmtBrowserHostAdapter, deps.createRmtBrowserHostAdapter),
            }),
            createCore: (options = {}) => createCore({
                ...options,
                globalName
            }),
            createDomCompat: (options = {}) => createDomCompat({
                ...options,
                globalName
            }),
            createDomDescriptorRenderer: (options = {}) => createDomDescriptorRenderer({
                ...options,
                globalName
            }),
            createPerformanceRuntime: (options = {}) => createPerformanceRuntime({
                ...options,
                globalName
            }),
            createRuntime: (options = {}) => createBrowserRuntime({
                ...options,
                globalName
            }),
            createBrowserRuntime: (options = {}) => createBrowserRuntime({
                ...options,
                globalName
            }),
            createDetachedDomRuntime: (options = {}) => createDetachedRuntime({
                ...options,
                globalName
            }),
            createWorkerPrerenderRuntime: (options = {}) => createWorkerRuntime({
                ...options,
                globalName
            }),
            createWorkerRuntime: (options = {}) => createWorkerRuntime({
                ...options,
                globalName
            }),
            createServerPrerenderRuntime: (options = {}) => createServerRuntime({
                ...options,
                globalName
            }),
            createServerRuntime: (options = {}) => createServerRuntime({
                ...options,
                globalName
            }),
            createManifest: (options = {}) => (typeof createProductManifest === 'function'
                ? createProductManifest({
                    ...deps,
                    ...options,
                    globalName: clampString(options.globalName, globalName)
                })
                : manifest),
            createPublicApi: (options = {}) => createPublicApi({
                ...options,
                globalName
            }),
            createTemplateApi: (options = {}) => createTemplateApi({
                ...options,
                globalName
            }),
            createTemplateCompiler: (options = {}) => createTemplateCompiler({
                ...options,
                globalName
            }),
            createTemplateArtifacts: (options = {}) => createTemplateArtifacts({
                ...options,
                globalName
            }),
            createTemplateRuntimeRenderer: (options = {}) => createTemplateRuntimeRenderer({
                ...options,
                globalName
            }),
            createTemplateExecutionPath: (options = {}) => createTemplateExecutionPath({
                ...options,
                globalName
            }),
            createTemplateServerAdapter: (options = {}) => createTemplateServerAdapter({
                ...options,
                globalName
            }),
            createTemplateWorkerAdapter: (options = {}) => createTemplateWorkerAdapter({
                ...options,
                globalName
            }),
            createPrewarmWorkerRuntime: (options = {}) => (
                typeof createPrewarmWorkerRuntime === 'function'
                    ? createPrewarmWorkerRuntime({
                        ...options,
                        globalName
                    })
                    : null
            ),
            getManifest: () => manifest,
            globalName,
            listBuildTargets,
            listEntryPoints,
            listOptionalCompat: () => optionalCompat,
            productName: clampString(manifest.productName, PRODUCT_NAME),
            version: clampString(manifest.version, '0.0.0')
        });
    }

    appModules.createRmtProductSurface = function createRmtProductSurface(deps = {}) {
        return buildProductSurface(deps);
    };


    appModules.installRmtProductSurface = function installRmtProductSurface(deps = {}) {
        const windowTarget = deps.windowTarget || global;
        const globalName = clampString(deps.globalName, DEFAULT_GLOBAL_NAME);
        if (!windowTarget || typeof windowTarget !== 'object') {
            throw new Error('installRmtProductSurface benoetigt ein gueltiges windowTarget.');
        }

        const existingSurface = readNestedGlobal(windowTarget, globalName);
        if (deps.replace !== true && existingSurface && typeof existingSurface === 'object') {
            return existingSurface;
        }

        const productSurface = deps.productSurface && typeof deps.productSurface === 'object'
            ? deps.productSurface
            : buildProductSurface({
                ...deps,
                globalName
            });
        writeNestedGlobal(windowTarget, globalName, productSurface);
        return productSurface;
    };



    appModules.createRmtRuntime = function createRmtRuntime(deps = {}) {
        return appModules.createRmtProductSurface(deps).createRuntime(deps);
    };

    appModules.createRmtWorkerRuntime = function createRmtWorkerRuntime(deps = {}) {
        return appModules.createRmtProductSurface(deps).createWorkerRuntime(deps);
    };

    appModules.createRmtServerRuntime = function createRmtServerRuntime(deps = {}) {
        return appModules.createRmtProductSurface(deps).createServerRuntime(deps);
    };

})(__XTENDRMT_GLOBAL__);
