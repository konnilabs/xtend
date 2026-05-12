const {
  RMT_VNEXT_CORE_SCHEMA
} = require('./vnext-compiler');

const RMT_VNEXT_SECURITY_POLICY_SCHEMA = 'xtend.rmt.vnext-security-policy-contract.v1';
const RMT_VNEXT_TRUST_BOUNDARY_SCHEMA = 'xtend.rmt.vnext-trust-boundary.v1';
const RMT_VNEXT_SANITIZE_POLICY_SCHEMA = 'xtend.rmt.vnext-sanitize-policy.v1';
const RMT_VNEXT_SECURITY_POSTURE_SCHEMA = 'xtend.rmt.vnext-security-posture.v1';
const RMT_VNEXT_SECURITY_REPORT_SCHEMA = 'xtend.rmt.vnext-security-policy-report.v1';
const RMT_VNEXT_SECURITY_WORKPACKAGE = 'WP-E15-13';
const RMT_VNEXT_SECURITY_MODULE_PATH = 'tools/rmt-language/vnext-security.js';
const RMT_VNEXT_SECURITY_SUITE_PATH = 'tests/rmt-language/rmt_vnext_security_suite.js';
const RMT_VNEXT_SECURITY_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-security';

const SECURITY_POLICY_OWNER_MISSING_CODE = 'rmt.vnext.security.policy.owner_missing';
const SECURITY_TRUST_BOUNDARY_MISSING_CODE = 'rmt.vnext.security.trust_boundary.missing';
const SECURITY_TRUST_BOUNDARY_UNKNOWN_CODE = 'rmt.vnext.security.trust_boundary.unknown';
const SECURITY_SANITIZE_MISSING_CODE = 'rmt.vnext.security.sanitize.missing';
const SECURITY_SANITIZE_FORMAT_UNSUPPORTED_CODE = 'rmt.vnext.security.sanitize.format_unsupported';
const SECURITY_POLICY_DUPLICATE_CODE = 'rmt.vnext.security.policy.duplicate';
const SECURITY_POLICY_CONFLICT_CODE = 'rmt.vnext.security.policy.conflict';
const SECURITY_SANITIZE_WITHOUT_BOUNDARY_CODE = 'rmt.vnext.security.sanitize.without_boundary';

const SECURITY_ALLOWED_SANITIZE_FORMATS = Object.freeze(['html', 'text', 'url', 'json']);
const UNSAFE_DATA_SOURCE_KINDS = Object.freeze(['sse']);

const DEFAULT_TRUST_BOUNDARY_PROFILES = Object.freeze({
  'xtend.security.sanitizing-boundary.v1': Object.freeze({
    id: 'xtend.security.sanitizing-boundary.v1',
    mode: 'sanitize-before-render',
    csp: Object.freeze({
      requireTrustedTypes: true,
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"]
    }),
    isolation: Object.freeze({
      mode: 'component-boundary',
      crossOriginIsolation: false
    }),
    sandbox: Object.freeze({
      mode: 'no-inline-script',
      allowScripts: false,
      allowForms: false
    }),
    escaping: Object.freeze({
      required: true,
      formats: ['html', 'text', 'url']
    })
  }),
  'xtend.security.streaming-boundary.v1': Object.freeze({
    id: 'xtend.security.streaming-boundary.v1',
    mode: 'stream-sanitize-gate',
    csp: Object.freeze({
      requireTrustedTypes: true,
      defaultSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"]
    }),
    isolation: Object.freeze({
      mode: 'stream-boundary',
      crossOriginIsolation: false
    }),
    sandbox: Object.freeze({
      mode: 'stream-no-script-execution',
      allowScripts: false,
      allowPopups: false
    }),
    escaping: Object.freeze({
      required: true,
      formats: ['html', 'text']
    })
  }),
  'xtend.security.worker-boundary.v1': Object.freeze({
    id: 'xtend.security.worker-boundary.v1',
    mode: 'worker-result-sanitize-gate',
    csp: Object.freeze({
      requireTrustedTypes: true,
      defaultSrc: ["'self'"],
      workerSrc: ["'self'"],
      objectSrc: ["'none'"]
    }),
    isolation: Object.freeze({
      mode: 'worker-boundary',
      crossOriginIsolation: true
    }),
    sandbox: Object.freeze({
      mode: 'worker-message-only',
      allowScripts: false,
      allowSameOrigin: false
    }),
    escaping: Object.freeze({
      required: true,
      formats: ['html', 'json']
    })
  })
});

function cloneRange(range = {}) {
  range = range || {};
  return {
    start: {
      line: range.start && Number.isInteger(range.start.line) ? range.start.line : 0,
      character: range.start && Number.isInteger(range.start.character) ? range.start.character : 0
    },
    end: {
      line: range.end && Number.isInteger(range.end.line) ? range.end.line : 0,
      character: range.end && Number.isInteger(range.end.character) ? range.end.character : 0
    },
    startOffset: Number.isInteger(range.startOffset) ? range.startOffset : 0,
    endOffset: Number.isInteger(range.endOffset) ? range.endOffset : 0
  };
}

function cloneJson(value) {
  if (!value || typeof value !== 'object') return value || null;
  return JSON.parse(JSON.stringify(value));
}

function uniqueList(values = []) {
  const result = [];
  values.forEach((value) => {
    if (value === null || value === undefined) return;
    const normalized = String(value).trim();
    if (normalized && !result.includes(normalized)) result.push(normalized);
  });
  return result;
}

function findSourceEntry(coreDocument, sourceRef) {
  const sourceMap = Array.isArray(coreDocument && coreDocument.sourceMap) ? coreDocument.sourceMap : [];
  return sourceMap.find((entry) => entry && entry.id === sourceRef) || null;
}

function createSecurityDiagnostic(coreDocument, subject, code, message, severity = 'error', metadata = {}) {
  const sourceEntry = findSourceEntry(coreDocument, subject && subject.sourceRef);
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: RMT_VNEXT_SECURITY_POLICY_SCHEMA,
    workpackage: RMT_VNEXT_SECURITY_WORKPACKAGE,
    severity,
    code,
    message,
    policyId: subject && (subject.policyId || subject.id && String(subject.id).startsWith('security:') && subject.id) || null,
    operationId: subject && (subject.operationId || subject.ownerOperation || subject.id && String(subject.id).startsWith('operation:') && subject.id) || null,
    dataSourceId: subject && (subject.dataSourceId || subject.source && subject.source.ref || null) || null,
    corePointer: sourceEntry && sourceEntry.corePointer ? sourceEntry.corePointer : null,
    sourceRef: subject && subject.sourceRef || null,
    range: cloneRange(sourceEntry && sourceEntry.range),
    metadata
  };
}

function createIndex(records = []) {
  const index = new Map();
  records.forEach((record) => {
    if (record && record.id) index.set(record.id, record);
  });
  return index;
}

function normalizeCatalogInput(input, pluralName) {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input[pluralName])) return input[pluralName];
  if (!input || typeof input !== 'object') return [];

  return Object.keys(input).map((key) => {
    const value = input[key];
    if (value && typeof value === 'object') {
      return {
        id: value.id || key,
        ...value
      };
    }
    return {
      id: key
    };
  });
}

function normalizeTrustBoundaryCatalog(boundaries = []) {
  const records = Object.values(DEFAULT_TRUST_BOUNDARY_PROFILES).map((profile) => cloneJson(profile));
  normalizeCatalogInput(boundaries, 'trustBoundaries').forEach((entry) => {
    if (!entry || !entry.id) return;
    const existingIndex = records.findIndex((record) => record.id === entry.id);
    const normalized = {
      id: entry.id,
      mode: entry.mode || 'custom-boundary',
      csp: cloneJson(entry.csp || {}),
      isolation: cloneJson(entry.isolation || {}),
      sandbox: cloneJson(entry.sandbox || {}),
      escaping: cloneJson(entry.escaping || { required: true, formats: ['html'] })
    };
    if (existingIndex >= 0) {
      records[existingIndex] = normalized;
    } else {
      records.push(normalized);
    }
  });

  return {
    count: records.length,
    ids: records.map((record) => record.id),
    records,
    byId: createIndex(records)
  };
}

function normalizeDataSourceSecurityEntry(input, fallbackId) {
  const source = input && typeof input === 'object' ? input : {};
  const id = String(source.id || source.dataSourceId || source.target || fallbackId || '').trim();
  if (!id) return null;
  const security = source.security && typeof source.security === 'object' ? source.security : {};
  const sanitize = security.requiresSanitize || source.requiresSanitize || [];

  return {
    id,
    kind: source.kind || source.type || null,
    unsafe: security.unsafe === true || source.unsafe === true || source.requiresTrustBoundary === true,
    format: security.format || source.format || null,
    requiresTrustBoundary: security.requiresTrustBoundary === true || source.requiresTrustBoundary === true,
    requiresSanitize: Array.isArray(sanitize) ? sanitize.slice() : (sanitize ? [sanitize] : []),
    source
  };
}

function normalizeDataSourceSecurityCatalog(dataSources = []) {
  const records = [];
  const byId = new Map();

  normalizeCatalogInput(dataSources, 'dataSources').forEach((entry, index) => {
    const normalized = normalizeDataSourceSecurityEntry(entry, `dataSource.${index}`);
    if (!normalized) return;
    records.push(normalized);
    byId.set(normalized.id, normalized);
  });

  return {
    count: records.length,
    ids: records.map((record) => record.id),
    records,
    byId
  };
}

function collectPoliciesByOwner(securityPolicies = []) {
  const byOwner = new Map();
  securityPolicies.forEach((policy) => {
    const owner = policy && policy.ownerOperation || 'missing';
    const list = byOwner.get(owner) || [];
    list.push(policy);
    byOwner.set(owner, list);
  });
  return byOwner;
}

function inferDataSourceRequirement(operation, dataSource, catalogRecord) {
  const operationText = [
    operation && operation.kind,
    operation && operation.op,
    operation && operation.target && operation.target.ref,
    dataSource && dataSource.kind,
    dataSource && dataSource.target,
    catalogRecord && catalogRecord.format
  ].filter(Boolean).join(' ').toLowerCase();
  const isStream = operation && (operation.kind === 'stream' || operation.op === 'stream');
  const unsafeByKind = dataSource && UNSAFE_DATA_SOURCE_KINDS.includes(dataSource.kind);
  const unsafeByName = !!dataSource && /(html|markup|markdown|content|feed|preview|render)/.test(operationText);
  const unsafe = !!(catalogRecord && catalogRecord.unsafe) || unsafeByKind || isStream || unsafeByName;
  const format = catalogRecord && catalogRecord.format
    ? catalogRecord.format
    : ((dataSource || isStream) && /(html|markup|markdown|content|feed|preview|render)/.test(operationText) ? 'html' : null);
  const requiresTrustBoundary = unsafe || !!(catalogRecord && catalogRecord.requiresTrustBoundary);
  const requiresSanitize = uniqueList([]
    .concat(catalogRecord && catalogRecord.requiresSanitize || [])
    .concat(format === 'html' ? ['html'] : []));

  return {
    unsafe,
    kind: dataSource && dataSource.kind || null,
    target: dataSource && dataSource.target || null,
    format,
    requiresTrustBoundary,
    requiresSanitize
  };
}

function createTrustBoundaryRecord(coreDocument, policy, context) {
  const diagnostics = [];
  const boundary = policy && policy.boundary || null;
  const profile = boundary ? context.trustBoundaryCatalog.byId.get(boundary) : null;

  if (!context.operationIndex.has(policy && policy.ownerOperation)) {
    diagnostics.push(createSecurityDiagnostic(
      coreDocument,
      policy,
      SECURITY_POLICY_OWNER_MISSING_CODE,
      `Security policy "${policy && policy.id || 'unknown'}" references missing owner operation "${policy && policy.ownerOperation || 'unknown'}".`
    ));
  }

  if (!profile) {
    diagnostics.push(createSecurityDiagnostic(
      coreDocument,
      policy,
      SECURITY_TRUST_BOUNDARY_UNKNOWN_CODE,
      `Trust boundary "${boundary || 'unknown'}" is not declared in the vNext trust boundary catalog.`,
      'error',
      { knownBoundaries: context.trustBoundaryCatalog.ids.slice() }
    ));
  }

  return {
    schema: RMT_VNEXT_TRUST_BOUNDARY_SCHEMA,
    policyId: policy && policy.id || null,
    ownerOperation: policy && policy.ownerOperation || null,
    boundaryId: boundary,
    boundaryKnown: !!profile,
    csp: cloneJson(profile && profile.csp),
    isolation: cloneJson(profile && profile.isolation),
    sandbox: cloneJson(profile && profile.sandbox),
    escaping: cloneJson(profile && profile.escaping),
    sourceRef: policy && policy.sourceRef || null,
    status: diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready',
    diagnostics
  };
}

function createSanitizeRecord(coreDocument, policy, context) {
  const diagnostics = [];
  const format = policy && policy.format || null;

  if (!context.operationIndex.has(policy && policy.ownerOperation)) {
    diagnostics.push(createSecurityDiagnostic(
      coreDocument,
      policy,
      SECURITY_POLICY_OWNER_MISSING_CODE,
      `Security policy "${policy && policy.id || 'unknown'}" references missing owner operation "${policy && policy.ownerOperation || 'unknown'}".`
    ));
  }

  if (!SECURITY_ALLOWED_SANITIZE_FORMATS.includes(format)) {
    diagnostics.push(createSecurityDiagnostic(
      coreDocument,
      policy,
      SECURITY_SANITIZE_FORMAT_UNSUPPORTED_CODE,
      `Sanitize format "${format || 'unknown'}" is not part of the vNext security policy contract.`,
      'error',
      { allowedFormats: SECURITY_ALLOWED_SANITIZE_FORMATS.slice() }
    ));
  }

  return {
    schema: RMT_VNEXT_SANITIZE_POLICY_SCHEMA,
    policyId: policy && policy.id || null,
    ownerOperation: policy && policy.ownerOperation || null,
    format,
    escaping: {
      required: true,
      format
    },
    sourceRef: policy && policy.sourceRef || null,
    status: diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready',
    diagnostics
  };
}

function detectPolicyDuplicates(coreDocument, policies) {
  const diagnostics = [];
  const seen = new Map();

  policies.forEach((policy) => {
    const key = [
      policy && policy.ownerOperation || 'unknown',
      policy && policy.kind || 'unknown',
      policy && (policy.boundary || policy.format || 'unknown')
    ].join(':');
    if (seen.has(key)) {
      diagnostics.push(createSecurityDiagnostic(
        coreDocument,
        policy,
        SECURITY_POLICY_DUPLICATE_CODE,
        `Security policy "${policy && policy.kind || 'unknown'}" is duplicated for owner operation "${policy && policy.ownerOperation || 'unknown'}".`,
        'error',
        { firstPolicyId: seen.get(key), duplicateKey: key }
      ));
    } else if (policy && policy.id) {
      seen.set(key, policy.id);
    }
  });

  return diagnostics;
}

function createOperationPosture(coreDocument, operation, dataSource, policies, context) {
  const diagnostics = [];
  const trustPolicies = policies.filter((policy) => policy && policy.kind === 'trust_boundary');
  const sanitizePolicies = policies.filter((policy) => policy && policy.kind === 'sanitize');
  const catalogRecord = dataSource && dataSource.target ? context.dataSourceSecurityCatalog.byId.get(dataSource.target) : null;
  const requirement = inferDataSourceRequirement(operation, dataSource, catalogRecord);
  const boundaryIds = uniqueList(trustPolicies.map((policy) => policy.boundary));
  const sanitizeFormats = uniqueList(sanitizePolicies.map((policy) => policy.format));

  if (boundaryIds.length > 1) {
    diagnostics.push(createSecurityDiagnostic(
      coreDocument,
      operation,
      SECURITY_POLICY_CONFLICT_CODE,
      `Operation "${operation && operation.id || 'unknown'}" declares conflicting trust boundaries.`,
      'error',
      { boundaryIds }
    ));
  }

  if (requirement.requiresTrustBoundary && boundaryIds.length === 0) {
    diagnostics.push(createSecurityDiagnostic(
      coreDocument,
      operation,
      SECURITY_TRUST_BOUNDARY_MISSING_CODE,
      `Unsafe operation "${operation && operation.id || 'unknown'}" requires an explicit trust boundary.`,
      'error',
      { requirement }
    ));
  }

  requirement.requiresSanitize.forEach((format) => {
    if (!sanitizeFormats.includes(format)) {
      diagnostics.push(createSecurityDiagnostic(
        coreDocument,
        operation,
        SECURITY_SANITIZE_MISSING_CODE,
        `Unsafe operation "${operation && operation.id || 'unknown'}" requires sanitize ${format}.`,
        'error',
        { requiredFormat: format, requirement }
      ));
    }
  });

  if (sanitizePolicies.length > 0 && trustPolicies.length === 0) {
    diagnostics.push(createSecurityDiagnostic(
      coreDocument,
      operation,
      SECURITY_SANITIZE_WITHOUT_BOUNDARY_CODE,
      `Operation "${operation && operation.id || 'unknown'}" sanitizes data without an explicit trust boundary.`
    ));
  }

  const boundaryProfiles = boundaryIds
    .map((boundaryId) => context.trustBoundaryCatalog.byId.get(boundaryId))
    .filter(Boolean);

  return {
    schema: RMT_VNEXT_SECURITY_POSTURE_SCHEMA,
    operationId: operation && operation.id || null,
    operationKind: operation && operation.kind || null,
    op: operation && operation.op || null,
    target: operation && operation.target && operation.target.ref || null,
    dataSource: dataSource ? {
      id: dataSource.id,
      kind: dataSource.kind,
      target: dataSource.target
    } : null,
    unsafeFlow: requirement.unsafe,
    required: {
      trustBoundary: requirement.requiresTrustBoundary,
      sanitizeFormats: requirement.requiresSanitize
    },
    trustBoundaryRefs: trustPolicies.map((policy) => policy.id),
    boundaryIds,
    sanitizeRefs: sanitizePolicies.map((policy) => policy.id),
    sanitizeFormats,
    csp: boundaryProfiles.map((profile) => cloneJson(profile.csp)),
    isolation: boundaryProfiles.map((profile) => cloneJson(profile.isolation)),
    sandbox: boundaryProfiles.map((profile) => cloneJson(profile.sandbox)),
    escaping: {
      required: requirement.requiresSanitize.length > 0 || boundaryProfiles.some((profile) => profile.escaping && profile.escaping.required),
      formats: uniqueList([].concat(requirement.requiresSanitize).concat(sanitizeFormats))
    },
    status: diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready',
    diagnostics
  };
}

function createSecurityPolicyContract(coreDocument, options = {}) {
  const operations = Array.isArray(coreDocument && coreDocument.operations) ? coreDocument.operations : [];
  const dataSources = Array.isArray(coreDocument && coreDocument.dataSources) ? coreDocument.dataSources : [];
  const securityPolicies = Array.isArray(coreDocument && coreDocument.securityPolicies) ? coreDocument.securityPolicies : [];
  const context = {
    operationIndex: createIndex(operations),
    dataSourceIndex: createIndex(dataSources),
    trustBoundaryCatalog: normalizeTrustBoundaryCatalog(options.trustBoundaries || options.trustBoundaryCatalog || []),
    dataSourceSecurityCatalog: normalizeDataSourceSecurityCatalog(options.dataSources || options.dataSourceCatalog || [])
  };
  const policiesByOwner = collectPoliciesByOwner(securityPolicies);
  const trustBoundaries = securityPolicies
    .filter((policy) => policy && policy.kind === 'trust_boundary')
    .map((policy) => createTrustBoundaryRecord(coreDocument, policy, context));
  const sanitizers = securityPolicies
    .filter((policy) => policy && policy.kind === 'sanitize')
    .map((policy) => createSanitizeRecord(coreDocument, policy, context));
  const candidateOperations = operations.filter((operation) => {
    const policies = policiesByOwner.get(operation && operation.id) || [];
    const dataSource = operation && operation.source && operation.source.ref
      ? context.dataSourceIndex.get(operation.source.ref)
      : null;
    const requirement = inferDataSourceRequirement(operation, dataSource, dataSource && context.dataSourceSecurityCatalog.byId.get(dataSource.target));
    return policies.length > 0 || requirement.unsafe || requirement.requiresTrustBoundary || requirement.requiresSanitize.length > 0;
  });
  const postures = candidateOperations.map((operation) => {
    const dataSource = operation && operation.source && operation.source.ref
      ? context.dataSourceIndex.get(operation.source.ref)
      : null;
    return createOperationPosture(coreDocument, operation, dataSource, policiesByOwner.get(operation.id) || [], context);
  });
  const duplicateDiagnostics = detectPolicyDuplicates(coreDocument, securityPolicies);
  const diagnostics = trustBoundaries
    .flatMap((record) => record.diagnostics)
    .concat(sanitizers.flatMap((record) => record.diagnostics))
    .concat(postures.flatMap((record) => record.diagnostics))
    .concat(duplicateDiagnostics);
  const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';

  return {
    schema: RMT_VNEXT_SECURITY_POLICY_SCHEMA,
    coreSchema: coreDocument && coreDocument.schema ? coreDocument.schema : RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_SECURITY_WORKPACKAGE,
    status,
    ok: status !== 'blocked',
    policyCount: securityPolicies.length,
    trustBoundaryCount: trustBoundaries.length,
    sanitizePolicyCount: sanitizers.length,
    unsafeFlowCount: postures.filter((posture) => posture.unsafeFlow).length,
    allowedSanitizeFormats: SECURITY_ALLOWED_SANITIZE_FORMATS.slice(),
    trustBoundaryCatalog: {
      count: context.trustBoundaryCatalog.count,
      ids: context.trustBoundaryCatalog.ids.slice()
    },
    dataSourceSecurityCatalog: {
      count: context.dataSourceSecurityCatalog.count,
      ids: context.dataSourceSecurityCatalog.ids.slice()
    },
    trustBoundaries,
    sanitizers,
    postures,
    diagnostics
  };
}

function serializeSecurityPolicyContract(contract) {
  return `${JSON.stringify(contract, null, 2)}\n`;
}

function createRmtVNextSecurityPolicyContract(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_SECURITY_POLICY_SCHEMA,
    trustBoundarySchema: RMT_VNEXT_TRUST_BOUNDARY_SCHEMA,
    sanitizePolicySchema: RMT_VNEXT_SANITIZE_POLICY_SCHEMA,
    postureSchema: RMT_VNEXT_SECURITY_POSTURE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_SECURITY_WORKPACKAGE,
    allowedSanitizeFormats: SECURITY_ALLOWED_SANITIZE_FORMATS.slice(),
    defaultTrustBoundaries: cloneJson(DEFAULT_TRUST_BOUNDARY_PROFILES),
    createContract: (coreDocument, options = {}) => createSecurityPolicyContract(coreDocument, {
      ...defaultOptions,
      ...options
    }),
    serializeContract: serializeSecurityPolicyContract
  });
}

module.exports = {
  DEFAULT_TRUST_BOUNDARY_PROFILES,
  RMT_VNEXT_SANITIZE_POLICY_SCHEMA,
  RMT_VNEXT_SECURITY_MODULE_PATH,
  RMT_VNEXT_SECURITY_PACKAGE_SCRIPT,
  RMT_VNEXT_SECURITY_POLICY_SCHEMA,
  RMT_VNEXT_SECURITY_POSTURE_SCHEMA,
  RMT_VNEXT_SECURITY_REPORT_SCHEMA,
  RMT_VNEXT_SECURITY_SUITE_PATH,
  RMT_VNEXT_SECURITY_WORKPACKAGE,
  RMT_VNEXT_TRUST_BOUNDARY_SCHEMA,
  SECURITY_ALLOWED_SANITIZE_FORMATS,
  SECURITY_POLICY_CONFLICT_CODE,
  SECURITY_POLICY_DUPLICATE_CODE,
  SECURITY_POLICY_OWNER_MISSING_CODE,
  SECURITY_SANITIZE_FORMAT_UNSUPPORTED_CODE,
  SECURITY_SANITIZE_MISSING_CODE,
  SECURITY_SANITIZE_WITHOUT_BOUNDARY_CODE,
  SECURITY_TRUST_BOUNDARY_MISSING_CODE,
  SECURITY_TRUST_BOUNDARY_UNKNOWN_CODE,
  UNSAFE_DATA_SOURCE_KINDS,
  createRmtVNextSecurityPolicyContract,
  createSecurityPolicyContract,
  normalizeDataSourceSecurityCatalog,
  normalizeTrustBoundaryCatalog,
  serializeSecurityPolicyContract
};
