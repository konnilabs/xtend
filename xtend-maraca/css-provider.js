'use strict';

const crypto = require('crypto');

const MARACA_CSS_PROVIDER_SCHEMA = 'xtend.maraca.css-provider.v1';
const MARACA_CSS_BUILD_REQUEST_SCHEMA = 'xtend.maraca.css-build-request.v1';
const MARACA_CSS_INSPECTION_SCHEMA = 'xtend.maraca.css-provider-inspection.v1';
const MARACA_CSS_BUILD_PLAN_SCHEMA = 'xtend.maraca.css-build-plan.v1';
const MARACA_CSS_ARTIFACT_SCHEMA = 'xtend.maraca.css-artifact.v1';
const MARACA_CSS_BUILD_EVIDENCE_SCHEMA = 'xtend.maraca.css-build-evidence.v1';
const MARACA_CSS_LIFECYCLE_RESULT_SCHEMA = 'xtend.maraca.css-provider-lifecycle-result.v1';
const MARACA_CSS_DIAGNOSTIC_SCHEMA = 'xtend.maraca.css-provider-diagnostic.v1';

const CSS_PROVIDER_LIFECYCLE = Object.freeze(['inspect', 'plan', 'build', 'report', 'dispose']);
const CSS_PROVIDER_STATUSES = Object.freeze(['ready', 'unavailable', 'blocked', 'failed', 'degraded']);
const CSS_OUTPUT_MODES = Object.freeze(['inline', 'external']);
const CSS_PROVIDER_INVALID_CODE = 'xtend.maraca.css_provider.invalid';
const CSS_PROVIDER_UNAVAILABLE_CODE = 'xtend.maraca.css_provider.unavailable';
const CSS_PROVIDER_SOURCE_BLOCKED_CODE = 'xtend.maraca.css_provider.source_blocked';
const CSS_PROVIDER_BUILD_FAILED_CODE = 'xtend.maraca.css_provider.build_failed';
const CSS_PROVIDER_OUTPUT_MISSING_CODE = 'xtend.maraca.css_provider.output_missing';

function stableValue(value) {
  if (Array.isArray(value)) return value.map((entry) => stableValue(entry));
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((record, key) => {
    if (value[key] !== undefined && typeof value[key] !== 'function') record[key] = stableValue(value[key]);
    return record;
  }, {});
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(stableJson(value)).digest('hex');
}

function cloneSerializable(value) {
  return JSON.parse(stableJson(value));
}

function normalizeStatus(value, fallback = 'ready') {
  return CSS_PROVIDER_STATUSES.includes(value) ? value : fallback;
}

function diagnostic(code, severity, message, details = {}) {
  return {
    schema: MARACA_CSS_DIAGNOSTIC_SCHEMA,
    code,
    severity,
    message,
    ...cloneSerializable(details)
  };
}

function normalizeDiagnostics(value) {
  return (Array.isArray(value) ? value : []).map((entry) => diagnostic(
    String(entry && entry.code || CSS_PROVIDER_INVALID_CODE),
    ['error', 'warning', 'info'].includes(entry && entry.severity) ? entry.severity : 'error',
    String(entry && entry.message || 'CSS provider diagnostic.'),
    Object.keys(entry || {}).reduce((record, key) => {
      if (!['schema', 'code', 'severity', 'message'].includes(key)) record[key] = entry[key];
      return record;
    }, {})
  ));
}

function normalizeSource(source) {
  if (typeof source === 'string') {
    return { path: source, kind: 'file', fingerprint: null };
  }
  const input = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
  return {
    path: String(input.path || ''),
    kind: String(input.kind || 'file'),
    fingerprint: input.fingerprint ? String(input.fingerprint) : null
  };
}

function createCssBuildRequest(input = {}) {
  const request = {
    schema: MARACA_CSS_BUILD_REQUEST_SCHEMA,
    provider: String(input.provider || input.providerId || 'maraca-native'),
    mode: CSS_OUTPUT_MODES.includes(input.mode) ? input.mode : 'external',
    input: input.input ? String(input.input) : null,
    output: input.output ? String(input.output) : null,
    profile: String(input.profile || 'production'),
    minify: input.minify !== false,
    sourceMaps: Boolean(input.sourceMaps),
    strict: input.strict !== false,
    sources: (Array.isArray(input.sources) ? input.sources : []).map(normalizeSource),
    sourcePolicy: {
      root: String(input.sourcePolicy && input.sourcePolicy.root || ''),
      allow: (input.sourcePolicy && Array.isArray(input.sourcePolicy.allow) ? input.sourcePolicy.allow : []).map(String),
      deny: (input.sourcePolicy && Array.isArray(input.sourcePolicy.deny) ? input.sourcePolicy.deny : []).map(String),
      automaticDiscovery: Boolean(input.sourcePolicy && input.sourcePolicy.automaticDiscovery)
    },
    metadata: cloneSerializable(input.metadata || {})
  };
  request.fingerprint = fingerprint(request);
  return request;
}

function validateCssBuildRequest(input = {}) {
  const request = input && input.schema === MARACA_CSS_BUILD_REQUEST_SCHEMA ? cloneSerializable(input) : createCssBuildRequest(input);
  const diagnostics = [];
  const remotePath = /^(?:https?:)?\/\//iu;
  if (!request.provider) diagnostics.push(diagnostic(CSS_PROVIDER_INVALID_CODE, 'error', 'CSS build request needs a provider id.'));
  if (!CSS_OUTPUT_MODES.includes(request.mode)) diagnostics.push(diagnostic(CSS_PROVIDER_INVALID_CODE, 'error', `Unsupported CSS output mode ${request.mode}.`));
  if (request.input && remotePath.test(request.input)) {
    diagnostics.push(diagnostic(CSS_PROVIDER_SOURCE_BLOCKED_CODE, 'error', 'Remote CSS inputs are forbidden by the build-time provider contract.', { path: request.input }));
  }
  request.sources.forEach((source, index) => {
    if (!source.path) diagnostics.push(diagnostic(CSS_PROVIDER_INVALID_CODE, 'error', `CSS source ${index} needs a path.`, { sourceIndex: index }));
    else if (remotePath.test(source.path)) diagnostics.push(diagnostic(CSS_PROVIDER_SOURCE_BLOCKED_CODE, 'error', `Remote CSS source ${index} is forbidden by the build-time provider contract.`, { sourceIndex: index, path: source.path }));
  });
  return {
    ok: diagnostics.length === 0,
    status: diagnostics.length === 0 ? 'ready' : 'blocked',
    request,
    diagnostics
  };
}

function createCssProviderContract(input = {}) {
  const contract = {
    schema: MARACA_CSS_PROVIDER_SCHEMA,
    id: String(input.id || ''),
    version: String(input.version || ''),
    label: String(input.label || input.id || ''),
    lifecycle: CSS_PROVIDER_LIFECYCLE.slice(),
    runtimeBoundary: 'build-time-only',
    capabilities: {
      inline: input.capabilities && input.capabilities.inline !== false,
      external: input.capabilities && input.capabilities.external !== false,
      minify: Boolean(input.capabilities && input.capabilities.minify),
      sourceMaps: Boolean(input.capabilities && input.capabilities.sourceMaps)
    },
    sourcePolicy: {
      explicitSources: input.sourcePolicy && input.sourcePolicy.explicitSources !== false,
      automaticDiscovery: Boolean(input.sourcePolicy && input.sourcePolicy.automaticDiscovery),
      network: Boolean(input.sourcePolicy && input.sourcePolicy.network)
    },
    diagnostics: {
      schema: MARACA_CSS_DIAGNOSTIC_SCHEMA,
      codes: [
        CSS_PROVIDER_INVALID_CODE,
        CSS_PROVIDER_UNAVAILABLE_CODE,
        CSS_PROVIDER_SOURCE_BLOCKED_CODE,
        CSS_PROVIDER_BUILD_FAILED_CODE,
        CSS_PROVIDER_OUTPUT_MISSING_CODE
      ]
    }
  };
  contract.fingerprint = fingerprint(contract);
  return contract;
}

function validateCssProviderContract(input = {}) {
  const contract = input && input.schema === MARACA_CSS_PROVIDER_SCHEMA ? cloneSerializable(input) : createCssProviderContract(input);
  const diagnostics = [];
  if (!/^[a-z][a-z0-9.-]*$/u.test(contract.id || '')) {
    diagnostics.push(diagnostic(CSS_PROVIDER_INVALID_CODE, 'error', 'CSS provider id must use lowercase letters, digits, dots, or dashes.'));
  }
  if (!contract.version) diagnostics.push(diagnostic(CSS_PROVIDER_INVALID_CODE, 'error', 'CSS provider needs a version.'));
  if (stableJson(contract.lifecycle) !== stableJson(CSS_PROVIDER_LIFECYCLE)) {
    diagnostics.push(diagnostic(CSS_PROVIDER_INVALID_CODE, 'error', 'CSS provider must implement the canonical lifecycle.'));
  }
  if (contract.runtimeBoundary !== 'build-time-only') {
    diagnostics.push(diagnostic(CSS_PROVIDER_INVALID_CODE, 'error', 'CSS providers are build-time-only.'));
  }
  return {
    ok: diagnostics.length === 0,
    status: diagnostics.length === 0 ? 'ready' : 'blocked',
    contract,
    diagnostics
  };
}

function createCssProvider(definition = {}) {
  const contract = createCssProviderContract(definition);
  return {
    contract,
    inspect: definition.inspect,
    plan: definition.plan,
    build: definition.build,
    report: definition.report,
    dispose: definition.dispose
  };
}

function validateCssProvider(provider = {}) {
  const contractResult = validateCssProviderContract(provider.contract || provider);
  const diagnostics = contractResult.diagnostics.slice();
  CSS_PROVIDER_LIFECYCLE.forEach((method) => {
    if (typeof provider[method] !== 'function') {
      diagnostics.push(diagnostic(CSS_PROVIDER_INVALID_CODE, 'error', `CSS provider needs lifecycle method ${method}().`, { method }));
    }
  });
  return {
    ok: diagnostics.length === 0,
    status: diagnostics.length === 0 ? 'ready' : 'blocked',
    contract: contractResult.contract,
    diagnostics
  };
}

function createCssArtifact(input = {}) {
  const cssText = typeof input.cssText === 'string' ? input.cssText : '';
  const artifact = {
    schema: MARACA_CSS_ARTIFACT_SCHEMA,
    status: normalizeStatus(input.status, cssText ? 'ready' : 'failed'),
    mode: CSS_OUTPUT_MODES.includes(input.mode) ? input.mode : 'external',
    fileName: input.fileName ? String(input.fileName) : null,
    cssText,
    sourceMap: input.sourceMap || null,
    bytes: Buffer.byteLength(cssText),
    fingerprint: fingerprint(cssText),
    diagnostics: normalizeDiagnostics(input.diagnostics)
  };
  if (!cssText && !artifact.diagnostics.some((entry) => entry.code === CSS_PROVIDER_OUTPUT_MISSING_CODE)) {
    artifact.diagnostics.push(diagnostic(CSS_PROVIDER_OUTPUT_MISSING_CODE, 'error', 'CSS provider produced no CSS output.'));
    artifact.status = 'failed';
  }
  return artifact;
}

function createCssBuildEvidence(input = {}) {
  const artifact = input.artifact || null;
  const evidence = {
    schema: MARACA_CSS_BUILD_EVIDENCE_SCHEMA,
    provider: cloneSerializable(input.contract || {}),
    requestFingerprint: input.request && input.request.fingerprint || null,
    planFingerprint: input.plan && input.plan.fingerprint || null,
    status: normalizeStatus(input.status, artifact && artifact.status || 'failed'),
    mode: artifact && artifact.mode || input.request && input.request.mode || 'external',
    fileName: artifact && artifact.fileName || null,
    bytes: artifact && artifact.bytes || 0,
    outputFingerprint: artifact && artifact.fingerprint || null,
    sourceFingerprints: (input.request && input.request.sources || []).map((source) => ({
      path: source.path,
      fingerprint: source.fingerprint || null
    })),
    diagnostics: normalizeDiagnostics(input.diagnostics)
  };
  evidence.fingerprint = fingerprint(evidence);
  return evidence;
}

function normalizeInspection(value = {}) {
  const inspection = {
    schema: MARACA_CSS_INSPECTION_SCHEMA,
    status: normalizeStatus(value.status),
    available: value.available !== false,
    toolchain: cloneSerializable(value.toolchain || {}),
    diagnostics: normalizeDiagnostics(value.diagnostics)
  };
  inspection.fingerprint = fingerprint(inspection);
  return inspection;
}

function normalizePlan(value = {}, contract, request, inspection) {
  const plan = {
    schema: MARACA_CSS_BUILD_PLAN_SCHEMA,
    status: normalizeStatus(value.status),
    provider: contract.id,
    providerFingerprint: contract.fingerprint,
    requestFingerprint: request.fingerprint,
    inspectionFingerprint: inspection.fingerprint,
    mode: request.mode,
    output: value.output === undefined ? request.output : value.output,
    steps: (Array.isArray(value.steps) ? value.steps : []).map(String),
    metadata: cloneSerializable(value.metadata || {}),
    diagnostics: normalizeDiagnostics(value.diagnostics)
  };
  plan.fingerprint = fingerprint(plan);
  return plan;
}

function createNativeMaracaCssProvider(options = {}) {
  return createCssProvider({
    id: 'maraca-native',
    version: String(options.version || '1'),
    label: 'Maraca native CSS provider',
    capabilities: { inline: true, external: true, minify: false, sourceMaps: false },
    sourcePolicy: { explicitSources: true, automaticDiscovery: false, network: false },
    inspect() {
      return { status: 'ready', available: true, toolchain: { name: 'maraca-native', version: String(options.version || '1') } };
    },
    plan(request) {
      return { status: 'ready', output: request.output, steps: ['create-native-css'] };
    },
    async build(plan, request) {
      const cssText = typeof options.buildCss === 'function'
        ? await options.buildCss({ plan, request })
        : String(options.cssText || ':where([data-maraca-root]){display:grid;}');
      return createCssArtifact({ status: 'ready', mode: request.mode, fileName: request.output, cssText });
    },
    report(context) {
      return createCssBuildEvidence(context);
    },
    dispose() {
      return { status: 'disposed' };
    }
  });
}

function createDummyCssProvider(options = {}) {
  const state = options.state || {};
  return createCssProvider({
    id: String(options.id || 'test-dummy'),
    version: String(options.version || '1.0.0'),
    label: 'Deterministic CSS provider fixture',
    capabilities: { inline: true, external: true, minify: true, sourceMaps: true },
    sourcePolicy: { explicitSources: true, automaticDiscovery: false, network: false },
    inspect() {
      state.inspect = (state.inspect || 0) + 1;
      return options.inspection || { status: 'ready', available: true, toolchain: { name: 'dummy', version: '1' } };
    },
    plan(request) {
      state.plan = (state.plan || 0) + 1;
      return { status: 'ready', output: request.output, steps: ['scan-explicit-sources', 'emit-css'], metadata: options.planMetadata || {} };
    },
    async build(plan, request) {
      state.build = (state.build || 0) + 1;
      if (options.buildError) throw new Error(String(options.buildError));
      return createCssArtifact({
        status: 'ready',
        mode: request.mode,
        fileName: request.output,
        cssText: String(options.cssText || '.fixture{display:block;}'),
        sourceMap: options.sourceMap || null
      });
    },
    report(context) {
      state.report = (state.report || 0) + 1;
      return createCssBuildEvidence(context);
    },
    dispose() {
      state.dispose = (state.dispose || 0) + 1;
      return { status: 'disposed' };
    }
  });
}

async function runCssProviderLifecycle(provider, input = {}) {
  const lifecycle = [];
  const diagnostics = [];
  const requestValidation = validateCssBuildRequest(input);
  const providerValidation = validateCssProvider(provider);
  diagnostics.push(...requestValidation.diagnostics, ...providerValidation.diagnostics);
  const request = requestValidation.request;
  const contract = providerValidation.contract;
  if (request.provider !== contract.id) {
    diagnostics.push(diagnostic(
      CSS_PROVIDER_INVALID_CODE,
      'error',
      `CSS request targets provider ${request.provider}, but implementation ${contract.id} was supplied.`,
      { requestedProvider: request.provider, actualProvider: contract.id }
    ));
  }
  if (request.mode === 'inline' && !contract.capabilities.inline) {
    diagnostics.push(diagnostic(CSS_PROVIDER_INVALID_CODE, 'error', `CSS provider ${contract.id} does not support inline output.`));
  }
  if (request.mode === 'external' && !contract.capabilities.external) {
    diagnostics.push(diagnostic(CSS_PROVIDER_INVALID_CODE, 'error', `CSS provider ${contract.id} does not support external output.`));
  }
  let inspection = null;
  let plan = null;
  let artifact = null;
  let evidence = null;
  let status = diagnostics.length === 0 ? 'ready' : 'blocked';

  try {
    if (diagnostics.length > 0) return {
      schema: MARACA_CSS_LIFECYCLE_RESULT_SCHEMA,
      ok: false,
      status,
      contract,
      request,
      inspection,
      plan,
      artifact,
      evidence: createCssBuildEvidence({ contract, request, status, diagnostics }),
      diagnostics,
      lifecycle
    };

    lifecycle.push('inspect');
    inspection = normalizeInspection(await provider.inspect(request));
    diagnostics.push(...inspection.diagnostics);
    if (!inspection.available || inspection.status === 'unavailable' || inspection.status === 'blocked') {
      status = inspection.status === 'blocked' ? 'blocked' : 'unavailable';
      if (!diagnostics.some((entry) => entry.code === CSS_PROVIDER_UNAVAILABLE_CODE)) {
        diagnostics.push(diagnostic(CSS_PROVIDER_UNAVAILABLE_CODE, status === 'blocked' ? 'error' : 'warning', `CSS provider ${contract.id} is ${status}.`));
      }
    } else {
      lifecycle.push('plan');
      plan = normalizePlan(await provider.plan(request, inspection), contract, request, inspection);
      diagnostics.push(...plan.diagnostics);
      status = plan.status;
    }

    if (status === 'ready' || status === 'degraded') {
      lifecycle.push('build');
      artifact = await provider.build(plan, request, inspection);
      artifact = artifact && artifact.schema === MARACA_CSS_ARTIFACT_SCHEMA ? artifact : createCssArtifact(artifact || {});
      diagnostics.push(...artifact.diagnostics);
      status = artifact.status;
    }

    lifecycle.push('report');
    evidence = await provider.report({ contract, request, inspection, plan, artifact, status, diagnostics });
    evidence = evidence && evidence.schema === MARACA_CSS_BUILD_EVIDENCE_SCHEMA
      ? cloneSerializable(evidence)
      : createCssBuildEvidence({ contract, request, plan, artifact, status, diagnostics });
  } catch (error) {
    status = 'failed';
    diagnostics.push(diagnostic(CSS_PROVIDER_BUILD_FAILED_CODE, 'error', error && error.message || 'CSS provider lifecycle failed.'));
    evidence = createCssBuildEvidence({ contract, request, plan, artifact, status, diagnostics });
  } finally {
    if (typeof provider.dispose === 'function') {
      lifecycle.push('dispose');
      try {
        await provider.dispose({ contract, request, inspection, plan, artifact, evidence, status });
      } catch (error) {
        status = 'failed';
        diagnostics.push(diagnostic(CSS_PROVIDER_BUILD_FAILED_CODE, 'error', `CSS provider dispose failed: ${error && error.message || 'unknown error'}`));
      }
    }
  }

  if (!evidence) evidence = createCssBuildEvidence({ contract, request, plan, artifact, status, diagnostics });
  const ok = !['blocked', 'failed', 'unavailable'].includes(status) && diagnostics.every((entry) => entry.severity !== 'error');
  return {
    schema: MARACA_CSS_LIFECYCLE_RESULT_SCHEMA,
    ok,
    status: ok ? status : status === 'ready' ? 'failed' : status,
    contract,
    request,
    inspection,
    plan,
    artifact,
    evidence,
    diagnostics,
    lifecycle
  };
}

module.exports = {
  CSS_OUTPUT_MODES,
  CSS_PROVIDER_BUILD_FAILED_CODE,
  CSS_PROVIDER_INVALID_CODE,
  CSS_PROVIDER_LIFECYCLE,
  CSS_PROVIDER_OUTPUT_MISSING_CODE,
  CSS_PROVIDER_SOURCE_BLOCKED_CODE,
  CSS_PROVIDER_STATUSES,
  CSS_PROVIDER_UNAVAILABLE_CODE,
  MARACA_CSS_ARTIFACT_SCHEMA,
  MARACA_CSS_BUILD_EVIDENCE_SCHEMA,
  MARACA_CSS_BUILD_PLAN_SCHEMA,
  MARACA_CSS_BUILD_REQUEST_SCHEMA,
  MARACA_CSS_DIAGNOSTIC_SCHEMA,
  MARACA_CSS_INSPECTION_SCHEMA,
  MARACA_CSS_LIFECYCLE_RESULT_SCHEMA,
  MARACA_CSS_PROVIDER_SCHEMA,
  createCssArtifact,
  createCssBuildEvidence,
  createCssBuildRequest,
  createCssProvider,
  createCssProviderContract,
  createDummyCssProvider,
  createNativeMaracaCssProvider,
  runCssProviderLifecycle,
  validateCssBuildRequest,
  validateCssProvider,
  validateCssProviderContract
};
