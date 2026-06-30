'use strict';

const {
  REQUIRED_HOST_CONTROLLER_METHODS,
  XTENSIONS_HOST_CONTROLLER_SCHEMA,
  XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA,
  XTENSIONS_HOST_CONTROLLER_LIFECYCLE_RECORD_SCHEMA,
  assertNoFrameworkDependencies,
  createLifecycleRecord,
  normalizeHostControllerResult
} = require('./host-controller-contract');
const {
  XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
  XTENSIONS_SURFACE_EVENT_SCHEMA
} = require('./signal-bridge-contract');

const XTENSIONS_VANILLA_ADAPTER_SCHEMA = 'xtend.xtensions.vanilla-adapter.v1';
const XTENSIONS_DOM_BOUNDARY_SCHEMA = 'xtend.xtensions.dom-boundary.v1';
const XTENSIONS_LEGACY_SANDBOX_SCHEMA = 'xtend.xtensions.legacy-sandbox-adapter.v1';
const XTENSIONS_VANILLA_REPORT_SCHEMA = 'xtend.xtensions.vanilla-adapter-report.v1';
const XTENSIONS_VANILLA_DIAGNOSTIC_SCHEMA = 'xtend.xtensions.vanilla-adapter-diagnostic.v1';
const XTENSIONS_VANILLA_ADAPTER_MODULE_PATH = 'tools/xtensions/vanilla-host-adapter.js';
const XTENSIONS_VANILLA_ADAPTER_TYPES_PATH = 'tools/xtensions/vanilla-host-adapter.d.ts';
const XTENSIONS_VANILLA_ADAPTER_SUITE_PATH = 'tests/xtensions/xtensions_vanilla_host_adapter_suite.js';
const XTENSIONS_VANILLA_ADAPTER_FIXTURE_PATH = 'tests/fixtures/xtensions/vanilla-host-adapter-valid.json';
const XTENSIONS_VANILLA_ADAPTER_CONTRACT_PATH = 'development/XTensions-Vanilla-Host-Adapter-und-Legacy-Sandbox-Contract.md';
const XTENSIONS_VANILLA_ADAPTER_WORKPACKAGE = 'XTN-15';
const XTENSIONS_VANILLA_ADAPTER_PACKAGE_SCRIPT = 'npm run test:xtensions-vanilla-host-controller';
const XTENSIONS_DOM_BOUNDARY_PACKAGE_SCRIPT = 'npm run test:xtensions-dom-boundary';
const XTENSIONS_LEGACY_SANDBOX_PACKAGE_SCRIPT = 'npm run test:xtensions-legacy-sandbox-adapter';

const VANILLA_DOM_BOUNDARY_MODES = Object.freeze([
  'shadow-root',
  'host-owned-container',
  'iframe-sandbox'
]);

const VANILLA_STYLE_BOUNDARY_MODES = Object.freeze([
  'shadow-root',
  'scoped-css',
  'iframe'
]);

const VANILLA_TRUST_BOUNDARIES = Object.freeze([
  'same-origin-adapter',
  'sandboxed-adapter'
]);

const VANILLA_MUTATION_POLICIES = Object.freeze([
  'observe-and-degrade',
  'blocked-by-iframe',
  'contract-only'
]);

const VANILLA_ALLOWED_SANDBOX_TOKENS = Object.freeze([
  'allow-scripts'
]);

const VANILLA_BLOCKED_SANDBOX_TOKENS = Object.freeze([
  'allow-same-origin',
  'allow-top-navigation',
  'allow-top-navigation-by-user-activation',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-forms',
  'allow-modals',
  'allow-pointer-lock',
  'allow-downloads'
]);

const VANILLA_BOUNDARIES = Object.freeze([
  'same-realm-is-not-hard-security',
  'legacy-global-dom-requires-iframe-sandbox',
  'no-allow-same-origin-for-legacy-sandbox',
  'postmessage-allowlist-only',
  'hostcontroller-lifecycle-required'
]);

const VANILLA_BOUNDARY_UNSUPPORTED_CODE = 'xtensions.vanilla.boundary_unsupported';
const VANILLA_LEGACY_REQUIRES_IFRAME_CODE = 'xtensions.vanilla.legacy_requires_iframe';
const VANILLA_SANDBOX_UNSAFE_CODE = 'xtensions.vanilla.sandbox_unsafe';
const VANILLA_MUTATION_OUTSIDE_ROOT_CODE = 'xtensions.vanilla.mutation_outside_root';
const VANILLA_FRAMEWORK_DEPENDENCY_CODE = 'xtensions.vanilla.framework_dependency';
const VANILLA_REMOTE_ASSET_CODE = 'xtensions.vanilla.remote_asset';
const VANILLA_SCRIPT_URL_CODE = 'xtensions.vanilla.script_url';
const VANILLA_EMBED_BLOCKED_CODE = 'xtensions.vanilla.embed_blocked';
const VANILLA_GLOBAL_DOM_CODE = 'xtensions.vanilla.global_dom';

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function timestampFromOptions(options = {}) {
  if (options.timestamp) return options.timestamp;
  if (typeof options.clock === 'function') return options.clock();
  return new Date().toISOString();
}

function createVanillaDiagnostic(code, message, severity = 'error', metadata = {}) {
  return {
    schema: XTENSIONS_VANILLA_DIAGNOSTIC_SCHEMA,
    source: XTENSIONS_VANILLA_ADAPTER_SCHEMA,
    workpackage: XTENSIONS_VANILLA_ADAPTER_WORKPACKAGE,
    severity,
    code,
    message,
    field: metadata.field || null,
    metadata: cloneJson(metadata) || {}
  };
}

function normalizeSandboxTokens(value) {
  const tokens = toArray(value)
    .flatMap((entry) => normalizeString(entry).split(/\s+/u))
    .map(normalizeString)
    .filter(Boolean);
  return Array.from(new Set(tokens));
}

function normalizeVanillaIsolation(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const runtimeClass = normalizeString(source.runtimeClass || source.runtime || 'vanilla') || 'vanilla';
  const requestedDomBoundary = normalizeString(source.domBoundary || source.dom || (runtimeClass === 'legacy-global-dom' ? 'iframe-sandbox' : 'shadow-root'));
  const domBoundary = VANILLA_DOM_BOUNDARY_MODES.includes(requestedDomBoundary) ? requestedDomBoundary : 'shadow-root';
  const requestedStyleBoundary = normalizeString(source.styleBoundary || source.style || (domBoundary === 'iframe-sandbox' ? 'iframe' : domBoundary === 'shadow-root' ? 'shadow-root' : 'scoped-css'));
  const styleBoundary = VANILLA_STYLE_BOUNDARY_MODES.includes(requestedStyleBoundary) ? requestedStyleBoundary : (domBoundary === 'iframe-sandbox' ? 'iframe' : 'scoped-css');
  const requestedTrustBoundary = normalizeString(source.trustBoundary || source.trust || (domBoundary === 'iframe-sandbox' ? 'sandboxed-adapter' : 'same-origin-adapter'));
  const trustBoundary = VANILLA_TRUST_BOUNDARIES.includes(requestedTrustBoundary) ? requestedTrustBoundary : (domBoundary === 'iframe-sandbox' ? 'sandboxed-adapter' : 'same-origin-adapter');
  const requestedMutationPolicy = normalizeString(source.mutationPolicy || source.mutations || (domBoundary === 'iframe-sandbox' ? 'blocked-by-iframe' : 'observe-and-degrade'));
  const mutationPolicy = VANILLA_MUTATION_POLICIES.includes(requestedMutationPolicy) ? requestedMutationPolicy : (domBoundary === 'iframe-sandbox' ? 'blocked-by-iframe' : 'observe-and-degrade');
  const sandbox = normalizeSandboxTokens(source.sandbox || source.sandboxTokens || (domBoundary === 'iframe-sandbox' ? ['allow-scripts'] : []));
  const diagnostics = [];

  if (!VANILLA_DOM_BOUNDARY_MODES.includes(requestedDomBoundary)) {
    diagnostics.push(createVanillaDiagnostic(
      VANILLA_BOUNDARY_UNSUPPORTED_CODE,
      `DOM boundary "${requestedDomBoundary || 'missing'}" is unsupported for vanilla XTensions.`,
      'error',
      { field: 'isolation.domBoundary', requestedDomBoundary }
    ));
  }

  if (!VANILLA_STYLE_BOUNDARY_MODES.includes(requestedStyleBoundary)) {
    diagnostics.push(createVanillaDiagnostic(
      VANILLA_BOUNDARY_UNSUPPORTED_CODE,
      `Style boundary "${requestedStyleBoundary || 'missing'}" is unsupported for vanilla XTensions.`,
      'error',
      { field: 'isolation.styleBoundary', requestedStyleBoundary }
    ));
  }

  if (runtimeClass === 'legacy-global-dom' && domBoundary !== 'iframe-sandbox') {
    diagnostics.push(createVanillaDiagnostic(
      VANILLA_LEGACY_REQUIRES_IFRAME_CODE,
      'Legacy global-DOM widgets require iframe-sandbox isolation; shadow-root is only for cooperative widgets.',
      'error',
      { field: 'isolation.domBoundary', runtimeClass, domBoundary }
    ));
  }

  if (domBoundary === 'iframe-sandbox') {
    if (trustBoundary !== 'sandboxed-adapter' || styleBoundary !== 'iframe' || mutationPolicy !== 'blocked-by-iframe') {
      diagnostics.push(createVanillaDiagnostic(
        VANILLA_SANDBOX_UNSAFE_CODE,
        'iframe-sandbox XTensions must use sandboxed-adapter trust, iframe style boundary and blocked-by-iframe mutation policy.',
        'error',
        { field: 'isolation', trustBoundary, styleBoundary, mutationPolicy }
      ));
    }

    sandbox.forEach((token) => {
      if (!VANILLA_ALLOWED_SANDBOX_TOKENS.includes(token) || VANILLA_BLOCKED_SANDBOX_TOKENS.includes(token)) {
        diagnostics.push(createVanillaDiagnostic(
          VANILLA_SANDBOX_UNSAFE_CODE,
          `Sandbox token "${token}" is not allowed for legacy vanilla XTensions.`,
          'error',
          { field: 'isolation.sandbox', token }
        ));
      }
    });

    if (!sandbox.includes('allow-scripts')) {
      diagnostics.push(createVanillaDiagnostic(
        VANILLA_SANDBOX_UNSAFE_CODE,
        'Legacy sandbox proof requires allow-scripts and no other privileged sandbox token.',
        'error',
        { field: 'isolation.sandbox' }
      ));
    }
  }

  return {
    schema: XTENSIONS_DOM_BOUNDARY_SCHEMA,
    runtimeClass,
    domBoundary,
    styleBoundary,
    trustBoundary,
    mutationPolicy,
    sandbox,
    hardSecurity: domBoundary === 'iframe-sandbox' && trustBoundary === 'sandboxed-adapter',
    sameRealmHardSecurity: false,
    cooperative: runtimeClass !== 'legacy-global-dom' && domBoundary !== 'iframe-sandbox',
    legacy: runtimeClass === 'legacy-global-dom',
    diagnostics,
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error')
  };
}

function createVanillaAdapterContract(options = {}) {
  return {
    schema: XTENSIONS_VANILLA_ADAPTER_SCHEMA,
    domBoundarySchema: XTENSIONS_DOM_BOUNDARY_SCHEMA,
    legacySandboxSchema: XTENSIONS_LEGACY_SANDBOX_SCHEMA,
    hostControllerSchema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    signalBridgeSchema: XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
    surfaceEventSchema: XTENSIONS_SURFACE_EVENT_SCHEMA,
    workpackage: XTENSIONS_VANILLA_ADAPTER_WORKPACKAGE,
    status: 'accepted-by-XTN-15',
    framework: 'vanilla',
    hostNeutral: true,
    requiredMethods: REQUIRED_HOST_CONTROLLER_METHODS.slice(),
    domBoundaries: VANILLA_DOM_BOUNDARY_MODES.slice(),
    styleBoundaries: VANILLA_STYLE_BOUNDARY_MODES.slice(),
    trustBoundaries: VANILLA_TRUST_BOUNDARIES.slice(),
    mutationPolicies: VANILLA_MUTATION_POLICIES.slice(),
    boundaries: VANILLA_BOUNDARIES.slice(),
    sameRealmHardSecurity: false,
    legacyRequiresIframe: true,
    allowedSandboxTokens: (options.allowedSandboxTokens || VANILLA_ALLOWED_SANDBOX_TOKENS).slice(),
    blockedSandboxTokens: VANILLA_BLOCKED_SANDBOX_TOKENS.slice(),
    postMessagePolicy: {
      allowlistRequired: true,
      serializableOnly: true,
      topNavigationAllowed: false
    }
  };
}

function createDomBoundaryRecord(input = {}, options = {}) {
  const isolation = normalizeVanillaIsolation(input.isolation || input);
  return {
    schema: XTENSIONS_DOM_BOUNDARY_SCHEMA,
    xtensionId: normalizeString(input.xtensionId || input.id || options.xtensionId || 'xtension.vanilla.unknown'),
    surfaceId: normalizeString(input.surfaceId || options.surfaceId || 'surface.vanilla.unknown'),
    runtimeClass: isolation.runtimeClass,
    domBoundary: isolation.domBoundary,
    styleBoundary: isolation.styleBoundary,
    trustBoundary: isolation.trustBoundary,
    mutationPolicy: isolation.mutationPolicy,
    sandbox: isolation.sandbox.slice(),
    hardSecurity: isolation.hardSecurity,
    sameRealmHardSecurity: isolation.sameRealmHardSecurity,
    diagnostics: isolation.diagnostics.map(cloneJson),
    ok: isolation.ok,
    timestamp: timestampFromOptions(options)
  };
}

function createLegacySandboxRecord(input = {}, options = {}) {
  const isolation = normalizeVanillaIsolation({
    runtimeClass: 'legacy-global-dom',
    domBoundary: 'iframe-sandbox',
    styleBoundary: 'iframe',
    trustBoundary: 'sandboxed-adapter',
    mutationPolicy: 'blocked-by-iframe',
    sandbox: input.sandbox || ['allow-scripts']
  });

  return {
    schema: XTENSIONS_LEGACY_SANDBOX_SCHEMA,
    boundarySchema: XTENSIONS_DOM_BOUNDARY_SCHEMA,
    xtensionId: normalizeString(input.xtensionId || input.id || options.xtensionId || 'xtension.vanilla.legacy'),
    surfaceId: normalizeString(input.surfaceId || options.surfaceId || 'surface.vanilla.legacy'),
    runtimeClass: 'legacy-global-dom',
    iframeAttributes: {
      sandbox: isolation.sandbox.join(' '),
      allow: '',
      referrerPolicy: 'no-referrer'
    },
    allowSameOrigin: false,
    topNavigation: false,
    popupNavigation: false,
    postMessageOnly: true,
    allowedEventTypes: toArray(input.allowedEventTypes || ['ready', 'navigation-intent', 'user-intent', 'diagnostic'])
      .map(normalizeString)
      .filter(Boolean),
    isolation,
    diagnostics: isolation.diagnostics.map(cloneJson),
    ok: isolation.ok,
    timestamp: timestampFromOptions(options)
  };
}

function inspectLegacyAssetHtml(html = '', options = {}) {
  const text = String(html || '');
  const remoteMatches = text.match(/\b(?:https?:)?\/\/[^\s"'<>]+/giu) || [];
  const scriptUrlMatches = text.match(/\bhref\s*=\s*["']\s*javascript:[^"']*["']/giu) || [];
  const embedMatches = text.match(/<(?:embed|object)\b/giu) || [];
  const iframeMatches = text.match(/<iframe\b/giu) || [];
  const gaMatches = text.match(/(?:google-analytics|googletagmanager|_gaq|ga\.js)/giu) || [];
  const topNavigationMatches = text.match(/(?:window|top|parent)\.location\s*=/giu) || [];
  const globalDomMatches = text.match(/(?:document\.body|document\.head|document\.write|document\.getElementsByTagName|window\.onload)/giu) || [];
  const diagnostics = [];

  if (remoteMatches.length > 0) {
    diagnostics.push(createVanillaDiagnostic(
      VANILLA_REMOTE_ASSET_CODE,
      'Legacy asset contains remote URLs and must be sanitized for a local sandbox proof.',
      'error',
      { remoteCount: remoteMatches.length, sample: remoteMatches.slice(0, 3) }
    ));
  }

  if (scriptUrlMatches.length > 0) {
    diagnostics.push(createVanillaDiagnostic(
      VANILLA_SCRIPT_URL_CODE,
      'Legacy asset contains javascript: links and must route clicks through postMessage intents.',
      'error',
      { scriptUrlCount: scriptUrlMatches.length }
    ));
  }

  if (embedMatches.length > 0 || iframeMatches.length > 0) {
    diagnostics.push(createVanillaDiagnostic(
      VANILLA_EMBED_BLOCKED_CODE,
      'Legacy asset contains embedded browsing contexts or plugin tags that are blocked by the sandbox policy.',
      'error',
      { embedCount: embedMatches.length, iframeCount: iframeMatches.length }
    ));
  }

  if (gaMatches.length > 0 || topNavigationMatches.length > 0) {
    diagnostics.push(createVanillaDiagnostic(
      VANILLA_SANDBOX_UNSAFE_CODE,
      'Legacy asset contains analytics injection or top-level navigation writes.',
      'error',
      { analyticsCount: gaMatches.length, topNavigationCount: topNavigationMatches.length }
    ));
  }

  if (globalDomMatches.length > 0) {
    diagnostics.push(createVanillaDiagnostic(
      VANILLA_GLOBAL_DOM_CODE,
      'Legacy asset uses global DOM APIs and is not eligible for same-realm shadow-root isolation.',
      'warning',
      { globalDomCount: globalDomMatches.length }
    ));
  }

  return {
    schema: XTENSIONS_LEGACY_SANDBOX_SCHEMA,
    inspectedBytes: text.length,
    remoteAssetCount: remoteMatches.length,
    scriptUrlCount: scriptUrlMatches.length,
    embedCount: embedMatches.length,
    iframeCount: iframeMatches.length,
    analyticsInjectionCount: gaMatches.length,
    topNavigationWriteCount: topNavigationMatches.length,
    globalDomUsageCount: globalDomMatches.length,
    sameRealmEligible: globalDomMatches.length === 0 && diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
    iframeSandboxRequired: true,
    diagnostics,
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error') || options.allowNeedsSanitization === true
  };
}

function assertVanillaDependencyBoundary(input = {}) {
  const frameworkCheck = assertNoFrameworkDependencies(input);
  const diagnostics = frameworkCheck.diagnostics.map((diagnostic) => ({
    schema: XTENSIONS_VANILLA_DIAGNOSTIC_SCHEMA,
    source: XTENSIONS_VANILLA_ADAPTER_SCHEMA,
    workpackage: XTENSIONS_VANILLA_ADAPTER_WORKPACKAGE,
    severity: 'error',
    code: VANILLA_FRAMEWORK_DEPENDENCY_CODE,
    message: diagnostic.message,
    field: null,
    metadata: cloneJson(diagnostic.details || {})
  }));
  const sourceText = String(input.sourceText || input.text || '');

  if (/(?:document\.body|document\.head|document\.write|window\.location\s*=|top\.location\s*=)/u.test(sourceText)) {
    diagnostics.push(createVanillaDiagnostic(
      VANILLA_MUTATION_OUTSIDE_ROOT_CODE,
      'Same-realm vanilla adapter source must not write outside the host-owned root.',
      'error',
      { field: 'sourceText' }
    ));
  }

  return {
    ok: diagnostics.length === 0,
    diagnostics,
    forbiddenFrameworkDependencies: frameworkCheck.forbiddenFrameworkDependencies
  };
}

function createFrameworklessVanillaHostAdapter(options = {}) {
  const contract = createVanillaAdapterContract(options.contract || {});
  const hostId = options.id || 'xtension.vanilla.frameworkless-adapter';
  const surfaceId = options.surfaceId || 'surface.xtensions.vanilla';
  const lifecycleRecords = [];
  const state = {
    mounted: false,
    suspended: false,
    destroyed: false,
    status: 'idle',
    containerId: null,
    props: {},
    isolation: null,
    errors: []
  };
  let sequence = 0;

  function pushLifecycle(operation, status, payload = {}, diagnostics = []) {
    sequence += 1;
    const record = createLifecycleRecord(operation, null, {
      hostId,
      surfaceId,
      status,
      sequence,
      payload,
      diagnostics,
      clock: options.clock
    });
    lifecycleRecords.push(record);
    return record;
  }

  function result(operation, status, metadata = {}, diagnostics = [], lifecycleRecord = null) {
    return normalizeHostControllerResult(operation, {
      status,
      hostId,
      surfaceId,
      lifecycleRecord,
      diagnostics,
      metadata
    }, {
      hostId,
      surfaceId,
      clock: options.clock
    });
  }

  function notMounted(operation) {
    const diagnostic = createVanillaDiagnostic(
      state.destroyed ? 'xtensions.vanilla.destroyed' : 'xtensions.vanilla.not_mounted',
      state.destroyed ? 'Vanilla adapter has already been destroyed.' : 'Vanilla adapter is not mounted.',
      'error',
      { operation }
    );
    const lifecycleRecord = pushLifecycle(operation, 'failed', {}, [diagnostic]);
    return result(operation, 'failed', {}, [diagnostic], lifecycleRecord);
  }

  return {
    schema: XTENSIONS_VANILLA_ADAPTER_SCHEMA,
    id: hostId,
    framework: 'vanilla',
    version: '0.0.0-frameworkless',
    contract,
    methods: REQUIRED_HOST_CONTROLLER_METHODS.slice(),

    mount(container = {}, initialProps = {}, mountOptions = {}) {
      if (state.destroyed) return notMounted('mount');
      if (state.mounted) {
        const lifecycleRecord = pushLifecycle('mount', 'skipped', { reason: 'already-mounted' });
        return result('mount', 'skipped', { reason: 'already-mounted' }, [], lifecycleRecord);
      }

      const boundary = createDomBoundaryRecord({
        xtensionId: hostId,
        surfaceId,
        isolation: mountOptions.isolation || initialProps.isolation || options.isolation || {}
      }, { clock: options.clock });
      const status = boundary.ok ? 'ok' : 'policy-blocked';
      state.mounted = boundary.ok;
      state.suspended = false;
      state.status = boundary.ok ? 'mounted' : 'policy-blocked';
      state.containerId = mountOptions.containerId || container.id || container.name || 'anonymous-host-container';
      state.props = cloneJson(initialProps) || {};
      state.isolation = boundary;
      const lifecycleRecord = pushLifecycle('mount', status, {
        containerId: state.containerId,
        isolation: boundary
      }, boundary.diagnostics);
      return result('mount', status, { containerId: state.containerId, isolation: boundary }, boundary.diagnostics, lifecycleRecord);
    },

    update(signal = {}) {
      if (!state.mounted || state.destroyed) return notMounted('update');
      state.props = cloneJson(signal.props || signal.payload || signal) || {};
      const lifecycleRecord = pushLifecycle('update', 'ok', { signal: cloneJson(signal) || {} });
      return result('update', 'ok', { signal: cloneJson(signal) || {} }, [], lifecycleRecord);
    },

    suspend(reason = 'unspecified') {
      if (!state.mounted || state.destroyed) return notMounted('suspend');
      if (state.suspended) {
        const lifecycleRecord = pushLifecycle('suspend', 'skipped', { reason: 'already-suspended' });
        return result('suspend', 'skipped', { reason: 'already-suspended' }, [], lifecycleRecord);
      }
      state.suspended = true;
      const lifecycleRecord = pushLifecycle('suspend', 'ok', { reason });
      return result('suspend', 'ok', { reason }, [], lifecycleRecord);
    },

    resume(reason = 'unspecified') {
      if (!state.mounted || state.destroyed) return notMounted('resume');
      if (!state.suspended) {
        const lifecycleRecord = pushLifecycle('resume', 'skipped', { reason: 'not-suspended' });
        return result('resume', 'skipped', { reason: 'not-suspended' }, [], lifecycleRecord);
      }
      state.suspended = false;
      const lifecycleRecord = pushLifecycle('resume', 'ok', { reason });
      return result('resume', 'ok', { reason }, [], lifecycleRecord);
    },

    reportError(error, metadata = {}) {
      const diagnostic = createVanillaDiagnostic(
        'xtensions.vanilla.error_reported',
        error && error.message ? error.message : 'Vanilla adapter reported an error.',
        'error',
        { name: error && error.name || 'Error', metadata }
      );
      state.errors.push(diagnostic);
      state.status = 'degraded';
      const lifecycleRecord = pushLifecycle('reportError', 'degraded', { metadata }, [diagnostic]);
      return result('reportError', 'degraded', { metadata }, [diagnostic], lifecycleRecord);
    },

    unmount(reason = 'unspecified') {
      if (state.destroyed) {
        const lifecycleRecord = pushLifecycle('unmount', 'skipped', { reason: 'already-destroyed' });
        return result('unmount', 'skipped', { reason: 'already-destroyed' }, [], lifecycleRecord);
      }
      if (!state.mounted) return notMounted('unmount');
      state.mounted = false;
      state.suspended = false;
      state.destroyed = true;
      state.status = 'destroyed';
      const cleanupRecords = ['event-listeners', 'mutation-observer', 'shadow-root-or-iframe'].map((resource, index) => ({
        schema: 'xtend.xtensions.host-controller-cleanup-record.v1',
        hostId,
        surfaceId,
        resource,
        status: 'released',
        sequence: index + 1,
        timestamp: timestampFromOptions(options)
      }));
      const lifecycleRecord = pushLifecycle('unmount', 'ok', { reason, cleanupResources: cleanupRecords.map((record) => record.resource) });
      return normalizeHostControllerResult('unmount', {
        status: 'ok',
        hostId,
        surfaceId,
        lifecycleRecord,
        cleanupRecords,
        diagnostics: [],
        metadata: { reason }
      }, {
        hostId,
        surfaceId,
        clock: options.clock
      });
    },

    snapshot() {
      return {
        schema: 'xtend.xtensions.vanilla-adapter-snapshot.v1',
        hostId,
        surfaceId,
        state: cloneJson(state),
        lifecycleCount: lifecycleRecords.length
      };
    },

    getLifecycleRecords() {
      return lifecycleRecords.map(cloneJson);
    }
  };
}

function createVanillaAdapterReport(input = {}, options = {}) {
  const contract = createVanillaAdapterContract(input.contract || {});
  const cooperativeBoundary = createDomBoundaryRecord(input.cooperative || {
    isolation: {
      runtimeClass: 'vanilla',
      domBoundary: 'shadow-root',
      styleBoundary: 'shadow-root',
      trustBoundary: 'same-origin-adapter',
      mutationPolicy: 'observe-and-degrade'
    }
  }, options);
  const legacySandbox = createLegacySandboxRecord(input.legacy || {}, options);
  const dependencyBoundary = assertVanillaDependencyBoundary(input.dependencyBoundary || input);
  const legacyHtmlInspection = input.legacyHtml
    ? inspectLegacyAssetHtml(input.legacyHtml, { allowNeedsSanitization: true })
    : null;
  const diagnostics = []
    .concat(cooperativeBoundary.diagnostics || [])
    .concat(legacySandbox.diagnostics || [])
    .concat(dependencyBoundary.diagnostics || [])
    .concat(legacyHtmlInspection ? legacyHtmlInspection.diagnostics || [] : [])
    .filter(Boolean);

  return {
    schema: XTENSIONS_VANILLA_REPORT_SCHEMA,
    adapterSchema: XTENSIONS_VANILLA_ADAPTER_SCHEMA,
    domBoundarySchema: XTENSIONS_DOM_BOUNDARY_SCHEMA,
    legacySandboxSchema: XTENSIONS_LEGACY_SANDBOX_SCHEMA,
    workpackage: XTENSIONS_VANILLA_ADAPTER_WORKPACKAGE,
    status: diagnostics.some((diagnostic) => diagnostic.severity === 'error' && diagnostic.code !== VANILLA_REMOTE_ASSET_CODE && diagnostic.code !== VANILLA_SCRIPT_URL_CODE && diagnostic.code !== VANILLA_EMBED_BLOCKED_CODE && diagnostic.code !== VANILLA_SANDBOX_UNSAFE_CODE) ? 'blocked' : 'ready',
    ok: cooperativeBoundary.ok && legacySandbox.ok && dependencyBoundary.ok,
    contract,
    cooperativeBoundary,
    legacySandbox,
    legacyHtmlInspection,
    dependencyBoundary,
    diagnostics,
    timestamp: timestampFromOptions(options)
  };
}

function serializeVanillaAdapterReport(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

module.exports = {
  VANILLA_ALLOWED_SANDBOX_TOKENS,
  VANILLA_BLOCKED_SANDBOX_TOKENS,
  VANILLA_BOUNDARIES,
  VANILLA_BOUNDARY_UNSUPPORTED_CODE,
  VANILLA_DOM_BOUNDARY_MODES,
  VANILLA_EMBED_BLOCKED_CODE,
  VANILLA_FRAMEWORK_DEPENDENCY_CODE,
  VANILLA_GLOBAL_DOM_CODE,
  VANILLA_LEGACY_REQUIRES_IFRAME_CODE,
  VANILLA_MUTATION_OUTSIDE_ROOT_CODE,
  VANILLA_MUTATION_POLICIES,
  VANILLA_REMOTE_ASSET_CODE,
  VANILLA_SANDBOX_UNSAFE_CODE,
  VANILLA_SCRIPT_URL_CODE,
  VANILLA_STYLE_BOUNDARY_MODES,
  VANILLA_TRUST_BOUNDARIES,
  XTENSIONS_DOM_BOUNDARY_PACKAGE_SCRIPT,
  XTENSIONS_DOM_BOUNDARY_SCHEMA,
  XTENSIONS_LEGACY_SANDBOX_PACKAGE_SCRIPT,
  XTENSIONS_LEGACY_SANDBOX_SCHEMA,
  XTENSIONS_VANILLA_ADAPTER_CONTRACT_PATH,
  XTENSIONS_VANILLA_ADAPTER_FIXTURE_PATH,
  XTENSIONS_VANILLA_ADAPTER_MODULE_PATH,
  XTENSIONS_VANILLA_ADAPTER_PACKAGE_SCRIPT,
  XTENSIONS_VANILLA_ADAPTER_SCHEMA,
  XTENSIONS_VANILLA_ADAPTER_SUITE_PATH,
  XTENSIONS_VANILLA_ADAPTER_TYPES_PATH,
  XTENSIONS_VANILLA_ADAPTER_WORKPACKAGE,
  XTENSIONS_VANILLA_DIAGNOSTIC_SCHEMA,
  XTENSIONS_VANILLA_REPORT_SCHEMA,
  assertVanillaDependencyBoundary,
  createDomBoundaryRecord,
  createFrameworklessVanillaHostAdapter,
  createLegacySandboxRecord,
  createVanillaAdapterContract,
  createVanillaAdapterReport,
  createVanillaDiagnostic,
  inspectLegacyAssetHtml,
  normalizeVanillaIsolation,
  serializeVanillaAdapterReport
};
