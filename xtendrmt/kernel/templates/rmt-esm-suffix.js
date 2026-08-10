
const AppModules = Object.freeze({ ...__XTENDRMT_MODULE_APP_MODULES__ });
Object.assign(__XTENDRMT_COMPAT_APP_MODULES__, AppModules);
__XTENDRMT_GLOBAL__.AppModules = __XTENDRMT_COMPAT_APP_MODULES__;
const getRmtApiVersion = (...args) => AppModules.getRmtApiVersion(...args);
const createRmtProductManifest = (...args) => AppModules.createRmtProductManifest(...args);
const createRmtCore = (...args) => AppModules.createRmtCore(...args);
const createRmtDomCompat = (...args) => AppModules.createRmtDomCompat(...args);
const createRmtDomDescriptorRenderer = (...args) => AppModules.createRmtDomDescriptorRenderer(...args);
const createRmtPublicApi = (...args) => AppModules.createRmtPublicApi(...args);
const createRmtTemplateApi = (...args) => AppModules.createRmtTemplateApi(...args);
const createRmtFormat = (...args) => AppModules.createRmtFormat(...args);
const createRmtTemplateRegistry = (...args) => AppModules.createRmtTemplateRegistry(...args);
const createRmtTemplateLoader = (...args) => AppModules.createRmtTemplateLoader(...args);
const createRmtTemplateCompiler = (...args) => AppModules.createRmtTemplateCompiler(...args);
const createRmtTemplateArtifacts = (...args) => AppModules.createRmtTemplateArtifacts(...args);
const createRmtTemplateRuntimeRenderer = (...args) => AppModules.createRmtTemplateRuntimeRenderer(...args);
const createRmtTemplateExecutionPath = (...args) => AppModules.createRmtTemplateExecutionPath(...args);
const createRmtTemplateWorkerAdapter = (...args) => AppModules.createRmtTemplateWorkerAdapter(...args);
const createRmtTemplateServerAdapter = (...args) => AppModules.createRmtTemplateServerAdapter(...args);
const createRmtXRouterAdapter = (...args) => AppModules.createRmtXRouterAdapter(...args);
const createRmtXtendComponentAdapter = (...args) => AppModules.createRmtXtendComponentAdapter(...args);
const createRmtSurfaceAdapter = (...args) => AppModules.createRmtSurfaceAdapter(...args);
const createRmtStateSchedulerDiagnosticsBridge = (...args) => AppModules.createRmtStateSchedulerDiagnosticsBridge(...args);
const createRmtPrewarmWorkerSourceBuilder = (...args) => AppModules.createRmtPrewarmWorkerSourceBuilder(...args);
const createRmtPrewarmWorkerRuntime = (...args) => AppModules.createRmtPrewarmWorkerRuntime(...args);
const createRmtPerformanceRuntime = (...args) => AppModules.createRmtPerformanceRuntime(...args);
const createRmtRuntime = (...args) => AppModules.createRmtRuntime(...args);
const createRmtDetachedRuntime = (...args) => AppModules.createRmtDetachedRuntime(...args);
const createRmtWorkerRuntime = (...args) => AppModules.createRmtWorkerRuntime(...args);
const createRmtServerRuntime = (...args) => AppModules.createRmtServerRuntime(...args);
const createRmtProductSurface = (...args) => AppModules.createRmtProductSurface(...args);
const installRmtProductSurface = (...args) => AppModules.installRmtProductSurface(...args);
const createRmtKernelPolicyParity = (...args) => AppModules.createRmtKernelPolicyParity(...args);
const createRmtBrowserHostAdapter = (...args) => AppModules.createRmtBrowserHostAdapter(...args);
const createRmtBrowserRuntime = (...args) => AppModules.createRmtBrowserRuntime(...args);
const createRmtWorkerPrerenderRuntime = (...args) => AppModules.createRmtWorkerPrerenderRuntime(...args);
const createRmtServerPrerenderRuntime = (...args) => AppModules.createRmtServerPrerenderRuntime(...args);
const version = typeof AppModules.getRmtApiVersion === 'function'
    ? AppModules.getRmtApiVersion()
    : "{{KERNEL_VERSION}}";
const XtendRmtProduct = createRmtProductSurface();

export { version, getRmtApiVersion, createRmtProductManifest, createRmtCore, createRmtDomCompat, createRmtDomDescriptorRenderer, createRmtPublicApi, createRmtTemplateApi, createRmtFormat, createRmtTemplateRegistry, createRmtTemplateLoader, createRmtTemplateCompiler, createRmtTemplateArtifacts, createRmtTemplateRuntimeRenderer, createRmtTemplateExecutionPath, createRmtTemplateWorkerAdapter, createRmtTemplateServerAdapter, createRmtXRouterAdapter, createRmtXtendComponentAdapter, createRmtSurfaceAdapter, createRmtStateSchedulerDiagnosticsBridge, createRmtPrewarmWorkerSourceBuilder, createRmtPrewarmWorkerRuntime, createRmtPerformanceRuntime, createRmtRuntime, createRmtDetachedRuntime, createRmtWorkerRuntime, createRmtServerRuntime, createRmtProductSurface, installRmtProductSurface, createRmtKernelPolicyParity, createRmtBrowserHostAdapter, createRmtBrowserRuntime, createRmtWorkerPrerenderRuntime, createRmtServerPrerenderRuntime, createRmtResumeRuntime, resumeResponse, resumeTemplate };
export default XtendRmtProduct;
