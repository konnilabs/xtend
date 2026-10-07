'use strict';

const XTENSIONS_REACT_ADAPTER_SCHEMA = 'xtend.xtensions.react-adapter.v1';
const XTENSIONS_REACT_RUNTIME_BOUNDARY_SCHEMA = 'xtend.xtensions.react-runtime-boundary.v1';
const XTENSIONS_REACT_ADAPTER_DIAGNOSTIC_SCHEMA = 'xtend.xtensions.react-adapter-diagnostic.v1';
const XTENSIONS_REACT_ADAPTER_WORKPACKAGE = 'XTN-18';

const REACT_ADAPTER_RUNTIME_BOUNDARY_CODE = 'xtensions.react.runtime_boundary';
const REACT_ADAPTER_HOST_RUNTIME_MISSING_CODE = 'xtensions.react.host_runtime_missing';

const REACT_ADAPTER_CAPABILITIES = Object.freeze([
  'react.root.lifecycle',
  'react.scheduling.hints',
  'react.boundary.diagnostics',
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

const REACT_HOST_PROVIDED_DEPENDENCIES = Object.freeze([
  Object.freeze({
    name: 'react',
    versionRange: '18.x || 19.x',
    classification: 'host-provided',
    bundled: false,
    packageIncluded: false
  }),
  Object.freeze({
    name: 'react-dom',
    versionRange: '18.x || 19.x',
    classification: 'host-provided',
    bundled: false,
    packageIncluded: false
  })
]);

const REACT_RUNTIME_PROVIDER_MODULES = Object.freeze([
  '/dist/xtensions/frameworks/react/index.mjs',
  '/dist/xtensions/frameworks/react-dom/client.mjs'
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

function createReactAdapterDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    schema: XTENSIONS_REACT_ADAPTER_DIAGNOSTIC_SCHEMA,
    source: XTENSIONS_REACT_ADAPTER_SCHEMA,
    workpackage: XTENSIONS_REACT_ADAPTER_WORKPACKAGE,
    severity,
    code,
    message,
    xtensionId: subject && (subject.id || subject.xtensionId) || null,
    framework: 'react',
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
    framework: 'react',
    modules: toArray(source.modules || REACT_RUNTIME_PROVIDER_MODULES).map(normalizeString).filter(Boolean),
    bundledInXtension: source.bundledInXtension === true,
    remoteAllowed: source.remoteAllowed === true,
    evidence: normalizeString(source.evidence || 'local-runtime-provider')
  };
}

function normalizeReactRuntimeBoundary(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const dependencies = (source.dependencies ? toArray(source.dependencies) : REACT_HOST_PROVIDED_DEPENDENCIES)
    .map(normalizeDependency)
    .filter((dependency) => dependency.name);
  const runtimeProvider = normalizeRuntimeProvider(source.runtimeProvider || source.provider);
  const diagnostics = [];

  dependencies.forEach((dependency) => {
    if (!['host-provided', 'external-peer'].includes(dependency.classification) || dependency.bundled || dependency.packageIncluded) {
      diagnostics.push(createReactAdapterDiagnostic(
        { id: source.xtensionId || source.id || 'xtension.react.adapter' },
        REACT_ADAPTER_RUNTIME_BOUNDARY_CODE,
        `React runtime dependency "${dependency.name}" must be host-provided/external-peer and excluded from the XTension bundle.`,
        'error',
        { field: 'dependencies', dependency }
      ));
    }
  });

  const unsafeRuntimeModules = runtimeProvider.modules.filter((modulePath) => !isLocalRuntimeProviderModule(modulePath));

  if (runtimeProvider.mode !== 'host-provided-local' || runtimeProvider.modules.length < 2 || runtimeProvider.remoteAllowed || runtimeProvider.bundledInXtension || unsafeRuntimeModules.length > 0) {
    diagnostics.push(createReactAdapterDiagnostic(
      { id: source.xtensionId || source.id || 'xtension.react.adapter' },
      REACT_ADAPTER_HOST_RUNTIME_MISSING_CODE,
      'React adapter requires local host-provided React and ReactDOM runtime provider modules.',
      'error',
      { field: 'runtimeProvider', runtimeProvider, unsafeRuntimeModules }
    ));
  }

  return {
    schema: XTENSIONS_REACT_RUNTIME_BOUNDARY_SCHEMA,
    runtimeClass: 'react',
    dependencyClassification: 'host-provided',
    dependencies,
    runtimeProvider,
    hostProvided: true,
    bundledInXtension: false,
    remoteArtifactsAllowed: false,
    domBoundary: 'host-owned-container',
    styleBoundary: 'host-css-owned',
    sameRealmHardSecurity: false,
    startTransitionIsSchedulingHint: true,
    contextStoreFiberBoundary: 'internal-only',
    capabilities: REACT_ADAPTER_CAPABILITIES.slice(),
    diagnostics,
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error')
  };
}

module.exports = { XTENSIONS_REACT_ADAPTER_SCHEMA, XTENSIONS_REACT_RUNTIME_BOUNDARY_SCHEMA, XTENSIONS_REACT_ADAPTER_DIAGNOSTIC_SCHEMA, XTENSIONS_REACT_ADAPTER_WORKPACKAGE, REACT_ADAPTER_RUNTIME_BOUNDARY_CODE, REACT_ADAPTER_HOST_RUNTIME_MISSING_CODE, REACT_ADAPTER_CAPABILITIES, REACT_HOST_PROVIDED_DEPENDENCIES, REACT_RUNTIME_PROVIDER_MODULES, normalizeReactRuntimeBoundary, createReactAdapterDiagnostic };
