'use strict';

const XTENSIONS_VUE_ADAPTER_SCHEMA = 'xtend.xtensions.vue-adapter.v1';
const XTENSIONS_VUE_RUNTIME_BOUNDARY_SCHEMA = 'xtend.xtensions.vue-runtime-boundary.v1';
const XTENSIONS_VUE_ADAPTER_DIAGNOSTIC_SCHEMA = 'xtend.xtensions.vue-adapter-diagnostic.v1';
const XTENSIONS_VUE_ADAPTER_WORKPACKAGE = 'XTN-19';

const VUE_ADAPTER_RUNTIME_BOUNDARY_CODE = 'xtensions.vue.runtime_boundary';
const VUE_ADAPTER_HOST_RUNTIME_MISSING_CODE = 'xtensions.vue.host_runtime_missing';

const VUE_ADAPTER_CAPABILITIES = Object.freeze([
  'vue.app.lifecycle',
  'vue.explicit-update-adapter',
  'vue.event-normalization',
  'host.lifecycle.mount',
  'host.lifecycle.update',
  'host.lifecycle.suspend',
  'host.lifecycle.resume',
  'host.lifecycle.unmount',
  'signal.downstream',
  'event.upstream',
  'loading.dynamic-import',
  'fallback.native-placeholder',
  'scheduler.hints',
  'dom.boundary.host-owned-container',
  'style.boundary.host-css-owned'
]);

const VUE_HOST_PROVIDED_DEPENDENCIES = Object.freeze([
  Object.freeze({
    name: 'vue',
    versionRange: '^3.5.0',
    classification: 'host-provided',
    bundled: false,
    packageIncluded: false
  })
]);

const VUE_RUNTIME_PROVIDER_MODULES = Object.freeze([
  '/dist/xtensions/frameworks/vue/index.mjs'
]);

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function createVueAdapterDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    schema: XTENSIONS_VUE_ADAPTER_DIAGNOSTIC_SCHEMA,
    source: XTENSIONS_VUE_ADAPTER_SCHEMA,
    workpackage: XTENSIONS_VUE_ADAPTER_WORKPACKAGE,
    severity,
    code,
    message,
    xtensionId: subject && (subject.id || subject.xtensionId) || null,
    framework: 'vue',
    field: metadata.field || null,
    metadata: cloneJson(metadata) || {}
  };
}

function normalizeDependency(dependency = {}) {
  const source = dependency && typeof dependency === 'object' ? dependency : {};
  return {
    name: normalizeString(source.name || source.package),
    versionRange: normalizeString(source.versionRange || source.version || source.range),
    classification: normalizeString(source.classification || source.kind || 'host-provided') || 'host-provided',
    bundled: source.bundled === true || source.vendored === true,
    packageIncluded: source.packageIncluded === true || source.rootDependency === true
  };
}

function isLocalRuntimeProviderModule(modulePath) {
  const normalized = normalizeString(modulePath);
  if (!normalized || normalized.startsWith('//')) return false;
  if (/^[a-z][a-z0-9+.-]*:/iu.test(normalized)) return false;
  return normalized.startsWith('/') || normalized.startsWith('./') || normalized.startsWith('../');
}

function normalizeRuntimeProvider(provider = {}) {
  const source = provider && typeof provider === 'object' ? provider : {};
  return {
    mode: normalizeString(source.mode || 'host-provided-local'),
    framework: 'vue',
    modules: toArray(source.modules || VUE_RUNTIME_PROVIDER_MODULES).map(normalizeString).filter(Boolean),
    bundledInXtension: source.bundledInXtension === true,
    remoteAllowed: source.remoteAllowed === true,
    evidence: normalizeString(source.evidence || 'local-runtime-provider')
  };
}

function normalizeVueRuntimeBoundary(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const dependencies = (source.dependencies ? toArray(source.dependencies) : VUE_HOST_PROVIDED_DEPENDENCIES)
    .map(normalizeDependency)
    .filter((dependency) => dependency.name);
  const runtimeProvider = normalizeRuntimeProvider(source.runtimeProvider || source.provider);
  const diagnostics = [];

  dependencies.forEach((dependency) => {
    if (!['host-provided', 'external-peer'].includes(dependency.classification) || dependency.bundled || dependency.packageIncluded) {
      diagnostics.push(createVueAdapterDiagnostic(
        { id: source.xtensionId || source.id || 'xtension.vue.adapter' },
        VUE_ADAPTER_RUNTIME_BOUNDARY_CODE,
        `Vue runtime dependency "${dependency.name}" must be host-provided/external-peer and excluded from the XTension bundle.`,
        'error',
        { field: 'dependencies', dependency }
      ));
    }
  });

  const unsafeRuntimeModules = runtimeProvider.modules.filter((modulePath) => !isLocalRuntimeProviderModule(modulePath));

  if (runtimeProvider.mode !== 'host-provided-local' || runtimeProvider.modules.length < 1 || runtimeProvider.remoteAllowed || runtimeProvider.bundledInXtension || unsafeRuntimeModules.length > 0) {
    diagnostics.push(createVueAdapterDiagnostic(
      { id: source.xtensionId || source.id || 'xtension.vue.adapter' },
      VUE_ADAPTER_HOST_RUNTIME_MISSING_CODE,
      'Vue adapter requires a local host-provided Vue runtime provider module.',
      'error',
      { field: 'runtimeProvider', runtimeProvider, unsafeRuntimeModules }
    ));
  }

  return {
    schema: XTENSIONS_VUE_RUNTIME_BOUNDARY_SCHEMA,
    runtimeClass: 'vue',
    dependencyClassification: 'host-provided',
    dependencies,
    runtimeProvider,
    hostProvided: true,
    bundledInXtension: false,
    remoteArtifactsAllowed: false,
    domBoundary: 'host-owned-container',
    styleBoundary: 'host-css-owned',
    sameRealmHardSecurity: false,
    explicitUpdateAdapterRequired: true,
    globalPropertiesPatchAllowed: false,
    proxyRefStoreBoundary: 'internal-only',
    capabilities: VUE_ADAPTER_CAPABILITIES.slice(),
    diagnostics,
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error')
  };
}

module.exports = { XTENSIONS_VUE_ADAPTER_SCHEMA, XTENSIONS_VUE_RUNTIME_BOUNDARY_SCHEMA, XTENSIONS_VUE_ADAPTER_DIAGNOSTIC_SCHEMA, XTENSIONS_VUE_ADAPTER_WORKPACKAGE, VUE_ADAPTER_RUNTIME_BOUNDARY_CODE, VUE_ADAPTER_HOST_RUNTIME_MISSING_CODE, VUE_ADAPTER_CAPABILITIES, VUE_HOST_PROVIDED_DEPENDENCIES, VUE_RUNTIME_PROVIDER_MODULES, normalizeVueRuntimeBoundary, createVueAdapterDiagnostic };
