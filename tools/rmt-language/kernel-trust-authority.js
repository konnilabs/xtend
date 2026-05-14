'use strict';

const {
  RMT_VNEXT_SECURITY_POLICY_SCHEMA
} = require('./vnext-security');

const RMT_KERNEL_TRUST_AUTHORITY_SCHEMA = 'xtend.rmt.kernel-trust-authority.v1';
const RMT_KERNEL_TRUST_VERDICT_SCHEMA = 'xtend.rmt.kernel-trust-verdict.v1';
const RMT_KERNEL_TRUST_DIAGNOSTIC_SCHEMA = 'xtend.rmt.kernel-trust-diagnostic.v1';
const RMT_KERNEL_TRUST_AUTHORITY_REPORT_SCHEMA = 'xtend.rmt.kernel-trust-authority-report.v1';
const RMT_KERNEL_TRUST_AUTHORITY_WORKPACKAGE = 'RKSH-WP-01';
const RMT_KERNEL_TRUST_AUTHORITY_MODULE_PATH = 'tools/rmt-language/kernel-trust-authority.js';
const RMT_KERNEL_TRUST_AUTHORITY_SUITE_PATH = 'tests/rmt-language/rmt_kernel_trust_authority_suite.js';
const RMT_KERNEL_TRUST_AUTHORITY_CONTRACT_PATH = 'development/XTendRMT-Kernel-Trust-Authority-Contract.md';
const RMT_KERNEL_TRUST_AUTHORITY_WP_PATH = 'development/WP-RKSH-01-KernelTrustAuthority-Contract-definieren.md';
const RMT_KERNEL_TRUST_AUTHORITY_PACKAGE_SCRIPT = 'npm run test:rmt-kernel-trust-authority';
const RMT_KERNEL_TRUST_HARDENING_CONTRACT = 'xtend.rmt.kernel-trust-hardening.v1';

const KERNEL_TRUST_VERDICTS = Object.freeze([
  'trusted',
  'sanitized',
  'blocked',
  'panic'
]);

const KERNEL_TRUST_SCOPES = Object.freeze([
  'binding',
  'slot',
  'template',
  'surface',
  'remote-surface',
  'scheduler-job',
  'adapter-output',
  'diagnostics',
  'kernel'
]);

const KERNEL_TRUST_SINKS = Object.freeze([
  'textContent',
  'attribute',
  'url-attribute',
  'property',
  'innerHTML',
  'insertAdjacentHTML',
  'template.innerHTML',
  'html_fragment',
  'slot.html',
  'prerender.html',
  'fallback.html',
  'remote-surface-output',
  'adapter-output',
  'diagnostic-event',
  'command-response',
  'scheduler-callback'
]);

const KERNEL_TRUST_SEVERITIES = Object.freeze([
  'info',
  'warning',
  'error',
  'fatal'
]);

const KERNEL_TRUST_REASON_CODES = Object.freeze({
  TEXT_SAFE: 'rmt.kernel.trust.text_safe',
  EXPLICIT_TRUST: 'rmt.kernel.trust.explicit_trust',
  HTML_SANITIZED: 'rmt.kernel.trust.html_sanitized',
  HTML_SANITIZER_MISSING: 'rmt.kernel.trust.html_sanitizer_missing',
  ATTRIBUTE_ALLOWED: 'rmt.kernel.trust.attribute_allowed',
  ATTRIBUTE_REFUSED: 'rmt.kernel.trust.attribute_refused',
  URL_PROTOCOL_REFUSED: 'rmt.kernel.trust.url_protocol_refused',
  PROPERTY_ALLOWED: 'rmt.kernel.trust.property_allowed',
  PROPERTY_REFUSED: 'rmt.kernel.trust.property_refused',
  REMOTE_BOUNDARY_MISSING: 'rmt.kernel.trust.remote_boundary_missing',
  ADAPTER_OUTPUT_UNSCOPED: 'rmt.kernel.trust.adapter_output_unscoped',
  CRITICAL_FAILURE: 'rmt.kernel.trust.critical_failure',
  PANIC_REQUESTED: 'rmt.kernel.trust.panic_requested'
});

const KERNEL_TRUST_DIAGNOSTIC_CODES = Object.freeze([
  'rmt.kernel.trust.verdict_missing',
  'rmt.kernel.trust.sink_refused',
  'rmt.kernel.trust.html_sanitizer_missing',
  'rmt.kernel.trust.attribute_refused',
  'rmt.kernel.trust.url_protocol_refused',
  'rmt.kernel.trust.property_refused',
  'rmt.kernel.trust.remote_boundary_missing',
  'rmt.kernel.trust.adapter_output_unscoped',
  'rmt.kernel.panic.candidate'
]);

const HTML_TRUST_SINKS = Object.freeze([
  'innerHTML',
  'insertAdjacentHTML',
  'template.innerHTML',
  'html_fragment',
  'slot.html',
  'prerender.html',
  'fallback.html'
]);

const URL_ATTRIBUTES = Object.freeze([
  'href',
  'src',
  'srcset',
  'action',
  'formaction',
  'poster',
  'xlink:href'
]);

const SAFE_PROPERTY_WRITES = Object.freeze([
  'textContent',
  'value',
  'checked',
  'disabled',
  'selected',
  'selectedIndex',
  'ariaLabel',
  'ariaDescription',
  'role',
  'id',
  'title'
]);

const UNSAFE_PROPERTY_WRITES = Object.freeze([
  'innerHTML',
  'outerHTML',
  'srcdoc',
  'onclick',
  'onerror',
  'onload'
]);

function normalizeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).trim();
  return normalized || fallback;
}

function normalizeEnum(value, allowed, fallback) {
  const normalized = normalizeString(value, fallback);
  return allowed.includes(normalized) ? normalized : fallback;
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

function stableSort(value) {
  if (Array.isArray(value)) return value.map(stableSort);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableSort(value[key]);
      return result;
    }, {});
  }
  return value;
}

function createCorrelationId(input) {
  const parts = [
    normalizeString(input.sourceRef, 'runtime-output'),
    normalizeString(input.scope, 'kernel'),
    normalizeString(input.sink, 'unknown-sink'),
    normalizeString(input.reasonCode, 'pending')
  ];
  return parts.join('#');
}

function isHtmlSink(sink, input = {}) {
  return HTML_TRUST_SINKS.includes(sink) || normalizeString(input.contentType).toLowerCase() === 'html';
}

function isEventAttribute(attributeName) {
  return normalizeString(attributeName).toLowerCase().startsWith('on');
}

function isUrlAttribute(attributeName) {
  return URL_ATTRIBUTES.includes(normalizeString(attributeName).toLowerCase());
}

function hasUnsafeProtocol(value) {
  const normalized = normalizeString(value).replace(/[\u0000-\u001F\u007F\s]+/gu, '').toLowerCase();
  if (!normalized) return false;
  return normalized.startsWith('javascript:')
    || normalized.startsWith('vbscript:')
    || normalized.startsWith('data:text/html')
    || normalized.startsWith('data:text/javascript')
    || normalized.startsWith('data:application/javascript')
    || normalized.startsWith('data:application/ecmascript');
}

function hasTrustBoundary(input) {
  return Boolean(normalizeString(input.trustBoundary || input.boundaryId || input.boundary));
}

function normalizeSink(input = {}) {
  const explicit = normalizeString(input.sink || input.sinkId || input.targetSink);
  if (KERNEL_TRUST_SINKS.includes(explicit)) return explicit;

  const kind = normalizeString(input.kind || input.type).toLowerCase();
  if (kind === 'html' || kind === 'html_fragment') return 'html_fragment';
  if (kind === 'attribute') return isUrlAttribute(input.attributeName || input.name) ? 'url-attribute' : 'attribute';
  if (kind === 'property') return 'property';
  if (kind === 'text') return 'textContent';
  return explicit || 'adapter-output';
}

function diagnosticCodeForVerdict(verdict) {
  if (verdict.diagnosticCode) return verdict.diagnosticCode;
  if (verdict.reasonCode === KERNEL_TRUST_REASON_CODES.HTML_SANITIZER_MISSING) return 'rmt.kernel.trust.html_sanitizer_missing';
  if (verdict.reasonCode === KERNEL_TRUST_REASON_CODES.ATTRIBUTE_REFUSED) return 'rmt.kernel.trust.attribute_refused';
  if (verdict.reasonCode === KERNEL_TRUST_REASON_CODES.URL_PROTOCOL_REFUSED) return 'rmt.kernel.trust.url_protocol_refused';
  if (verdict.reasonCode === KERNEL_TRUST_REASON_CODES.PROPERTY_REFUSED) return 'rmt.kernel.trust.property_refused';
  if (verdict.reasonCode === KERNEL_TRUST_REASON_CODES.REMOTE_BOUNDARY_MISSING) return 'rmt.kernel.trust.remote_boundary_missing';
  if (verdict.reasonCode === KERNEL_TRUST_REASON_CODES.ADAPTER_OUTPUT_UNSCOPED) return 'rmt.kernel.trust.adapter_output_unscoped';
  if (verdict.panicCandidate || verdict.verdict === 'panic') return 'rmt.kernel.panic.candidate';
  if (verdict.commitAllowed === false) return 'rmt.kernel.trust.sink_refused';
  return null;
}

function evaluateImplicitVerdict(input = {}) {
  const sink = normalizeSink(input);
  const attributeName = normalizeString(input.attributeName || input.name);
  const propertyName = normalizeString(input.propertyName || input.name);

  if (input.forcePanic === true || input.panic === true) {
    return {
      verdict: 'panic',
      reasonCode: KERNEL_TRUST_REASON_CODES.PANIC_REQUESTED,
      severity: 'fatal',
      commitAllowed: false,
      panicCandidate: true
    };
  }

  if (isHtmlSink(sink, input)) {
    if (input.sanitized === true) {
      return {
        verdict: 'sanitized',
        reasonCode: KERNEL_TRUST_REASON_CODES.HTML_SANITIZED,
        severity: 'info',
        commitAllowed: true,
        sanitized: true
      };
    }

    if (input.trusted === true) {
      return {
        verdict: 'trusted',
        reasonCode: KERNEL_TRUST_REASON_CODES.EXPLICIT_TRUST,
        severity: 'info',
        commitAllowed: true
      };
    }

    return {
      verdict: 'blocked',
      reasonCode: KERNEL_TRUST_REASON_CODES.HTML_SANITIZER_MISSING,
      severity: 'error',
      commitAllowed: false,
      panicCandidate: input.critical === true
    };
  }

  if (sink === 'attribute' || sink === 'url-attribute') {
    if (isEventAttribute(attributeName) || attributeName.toLowerCase() === 'srcdoc' || attributeName.toLowerCase() === 'style') {
      return {
        verdict: 'blocked',
        reasonCode: KERNEL_TRUST_REASON_CODES.ATTRIBUTE_REFUSED,
        severity: 'error',
        commitAllowed: false
      };
    }

    if (isUrlAttribute(attributeName) && hasUnsafeProtocol(input.value)) {
      return {
        verdict: 'blocked',
        reasonCode: KERNEL_TRUST_REASON_CODES.URL_PROTOCOL_REFUSED,
        severity: 'error',
        commitAllowed: false
      };
    }

    return {
      verdict: 'trusted',
      reasonCode: KERNEL_TRUST_REASON_CODES.ATTRIBUTE_ALLOWED,
      severity: 'info',
      commitAllowed: true
    };
  }

  if (sink === 'property') {
    const normalizedProperty = propertyName || normalizeString(input.property);
    if (UNSAFE_PROPERTY_WRITES.includes(normalizedProperty) || isEventAttribute(normalizedProperty)) {
      return {
        verdict: 'blocked',
        reasonCode: KERNEL_TRUST_REASON_CODES.PROPERTY_REFUSED,
        severity: 'error',
        commitAllowed: false
      };
    }

    if (SAFE_PROPERTY_WRITES.includes(normalizedProperty) || input.propertyTrusted === true) {
      return {
        verdict: 'trusted',
        reasonCode: KERNEL_TRUST_REASON_CODES.PROPERTY_ALLOWED,
        severity: 'info',
        commitAllowed: true
      };
    }

    return {
      verdict: 'blocked',
      reasonCode: KERNEL_TRUST_REASON_CODES.PROPERTY_REFUSED,
      severity: 'warning',
      commitAllowed: false
    };
  }

  if (sink === 'remote-surface-output') {
    if (hasTrustBoundary(input)) {
      return {
        verdict: 'trusted',
        reasonCode: KERNEL_TRUST_REASON_CODES.EXPLICIT_TRUST,
        severity: 'info',
        commitAllowed: true
      };
    }

    return {
      verdict: 'blocked',
      reasonCode: KERNEL_TRUST_REASON_CODES.REMOTE_BOUNDARY_MISSING,
      severity: 'error',
      commitAllowed: false,
      panicCandidate: input.critical === true
    };
  }

  if (input.critical === true) {
    return {
      verdict: 'panic',
      reasonCode: KERNEL_TRUST_REASON_CODES.CRITICAL_FAILURE,
      severity: 'fatal',
      commitAllowed: false,
      panicCandidate: true
    };
  }

  return {
    verdict: 'trusted',
    reasonCode: KERNEL_TRUST_REASON_CODES.EXPLICIT_TRUST,
    severity: 'info',
    commitAllowed: true
  };
}

function createKernelTrustVerdict(input = {}, options = {}) {
  const sink = normalizeSink(input);
  const scope = normalizeEnum(input.scope, KERNEL_TRUST_SCOPES, options.defaultScope || 'kernel');
  const implicit = evaluateImplicitVerdict({
    ...input,
    sink
  });
  const explicitVerdict = KERNEL_TRUST_VERDICTS.includes(input.verdict) ? input.verdict : implicit.verdict;
  const severity = normalizeEnum(input.severity || implicit.severity, KERNEL_TRUST_SEVERITIES, explicitVerdict === 'panic' ? 'fatal' : 'info');
  const commitAllowed = typeof input.commitAllowed === 'boolean'
    ? input.commitAllowed
    : explicitVerdict === 'trusted' || explicitVerdict === 'sanitized';
  const panicCandidate = input.panicCandidate === true || implicit.panicCandidate === true || explicitVerdict === 'panic';
  const reasonCode = normalizeString(input.reasonCode || implicit.reasonCode, KERNEL_TRUST_REASON_CODES.EXPLICIT_TRUST);

  const verdict = {
    schema: RMT_KERNEL_TRUST_VERDICT_SCHEMA,
    authoritySchema: RMT_KERNEL_TRUST_AUTHORITY_SCHEMA,
    source: RMT_KERNEL_TRUST_AUTHORITY_SCHEMA,
    workpackage: RMT_KERNEL_TRUST_AUTHORITY_WORKPACKAGE,
    verdict: explicitVerdict,
    scope,
    sink,
    sourceRef: normalizeString(input.sourceRef, null),
    ownerRef: normalizeString(input.ownerRef, null),
    attributeName: normalizeString(input.attributeName || input.name, null),
    propertyName: normalizeString(input.propertyName || input.property, null),
    severity,
    reasonCode,
    commitAllowed,
    sanitized: input.sanitized === true || implicit.sanitized === true || explicitVerdict === 'sanitized',
    trustBoundary: normalizeString(input.trustBoundary || input.boundaryId || input.boundary, null),
    panicCandidate,
    correlationId: normalizeString(input.correlationId, null),
    diagnosticCode: null,
    metadata: cloneJson(input.metadata || {})
  };

  verdict.correlationId = verdict.correlationId || createCorrelationId(verdict);
  verdict.diagnosticCode = diagnosticCodeForVerdict(verdict);
  return verdict;
}

function createKernelTrustDiagnostic(verdictInput = {}, overrides = {}) {
  const verdict = verdictInput && verdictInput.schema === RMT_KERNEL_TRUST_VERDICT_SCHEMA
    ? verdictInput
    : createKernelTrustVerdict(verdictInput);
  const code = normalizeString(overrides.code || verdict.diagnosticCode, 'rmt.kernel.trust.verdict_missing');
  const severity = normalizeEnum(overrides.severity || verdict.severity, KERNEL_TRUST_SEVERITIES, 'error');
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    trustDiagnosticSchema: RMT_KERNEL_TRUST_DIAGNOSTIC_SCHEMA,
    source: RMT_KERNEL_TRUST_AUTHORITY_SCHEMA,
    workpackage: RMT_KERNEL_TRUST_AUTHORITY_WORKPACKAGE,
    severity,
    code,
    message: normalizeString(overrides.message, `Kernel trust verdict ${verdict.verdict} for ${verdict.sink}`),
    sourceRef: verdict.sourceRef,
    scope: verdict.scope,
    sink: verdict.sink,
    correlationId: verdict.correlationId,
    reasonCode: verdict.reasonCode,
    commitAllowed: verdict.commitAllowed,
    panicCandidate: verdict.panicCandidate,
    metadata: cloneJson(overrides.metadata || {
      verdict: verdict.verdict,
      sanitized: verdict.sanitized,
      trustBoundary: verdict.trustBoundary || null
    })
  };
}

function createKernelTrustAuthorityContract(options = {}) {
  return {
    schema: RMT_KERNEL_TRUST_AUTHORITY_SCHEMA,
    hardeningContract: RMT_KERNEL_TRUST_HARDENING_CONTRACT,
    securityPolicyContract: RMT_VNEXT_SECURITY_POLICY_SCHEMA,
    verdictSchema: RMT_KERNEL_TRUST_VERDICT_SCHEMA,
    diagnosticSchema: RMT_KERNEL_TRUST_DIAGNOSTIC_SCHEMA,
    reportSchema: RMT_KERNEL_TRUST_AUTHORITY_REPORT_SCHEMA,
    workpackage: RMT_KERNEL_TRUST_AUTHORITY_WORKPACKAGE,
    status: 'accepted-kernel-trust-authority-contract',
    module: RMT_KERNEL_TRUST_AUTHORITY_MODULE_PATH,
    suite: RMT_KERNEL_TRUST_AUTHORITY_SUITE_PATH,
    localGate: 'node scripts/run_xtend_tests.js rmt-kernel-trust-authority --json',
    packageScript: RMT_KERNEL_TRUST_AUTHORITY_PACKAGE_SCRIPT,
    hostNeutral: true,
    runtimeMutations: false,
    verdicts: KERNEL_TRUST_VERDICTS.slice(),
    scopes: KERNEL_TRUST_SCOPES.slice(),
    sinks: KERNEL_TRUST_SINKS.slice(),
    reasonCodes: Object.values(KERNEL_TRUST_REASON_CODES),
    diagnosticCodes: KERNEL_TRUST_DIAGNOSTIC_CODES.slice(),
    defaultPolicy: {
      htmlRequiresSanitizing: true,
      eventAttributesAllowed: false,
      inlineStyleAttributesAllowed: false,
      unsafeUrlProtocolsAllowed: false,
      unknownPropertyWritesAllowed: false,
      remoteSurfaceRequiresBoundary: true,
      redactedDiagnostics: true,
      ...cloneJson(options.defaultPolicy || {})
    },
    diagnosticsIntegration: {
      hubChannel: 'rmt.kernel.trust',
      blockedOutputDiagnostic: 'rmt.kernel.trust.sink_refused',
      panicCandidateDiagnostic: 'rmt.kernel.panic.candidate',
      redactsRawOutput: true
    },
    hostAdapterExtension: {
      required: false,
      hooks: [
        'evaluateTrustOutput',
        'sanitizeHtmlOutput',
        'publishTrustDiagnostic'
      ]
    },
    handoff: [
      'RKSH-WP-02',
      'RKSH-WP-03',
      'RKSH-WP-04',
      'RKSH-WP-05'
    ]
  };
}

function createKernelTrustAuthority(options = {}) {
  const contract = createKernelTrustAuthorityContract(options);
  return {
    schema: RMT_KERNEL_TRUST_AUTHORITY_SCHEMA,
    contract,
    createVerdict(input = {}) {
      return createKernelTrustVerdict(input, options);
    },
    evaluateOutput(input = {}) {
      return createKernelTrustVerdict(input, options);
    },
    createDiagnostic(input = {}, overrides = {}) {
      return createKernelTrustDiagnostic(input, overrides);
    },
    serializeVerdict(input = {}) {
      return serializeKernelTrustVerdict(input && input.schema === RMT_KERNEL_TRUST_VERDICT_SCHEMA ? input : createKernelTrustVerdict(input, options));
    }
  };
}

function serializeKernelTrustVerdict(verdict) {
  return JSON.stringify(stableSort(verdict));
}

function serializeKernelTrustAuthorityContract(contract) {
  return JSON.stringify(stableSort(contract));
}

module.exports = {
  HTML_TRUST_SINKS,
  KERNEL_TRUST_DIAGNOSTIC_CODES,
  KERNEL_TRUST_REASON_CODES,
  KERNEL_TRUST_SCOPES,
  KERNEL_TRUST_SEVERITIES,
  KERNEL_TRUST_SINKS,
  KERNEL_TRUST_VERDICTS,
  RMT_KERNEL_TRUST_AUTHORITY_CONTRACT_PATH,
  RMT_KERNEL_TRUST_AUTHORITY_MODULE_PATH,
  RMT_KERNEL_TRUST_AUTHORITY_PACKAGE_SCRIPT,
  RMT_KERNEL_TRUST_AUTHORITY_REPORT_SCHEMA,
  RMT_KERNEL_TRUST_AUTHORITY_SCHEMA,
  RMT_KERNEL_TRUST_AUTHORITY_SUITE_PATH,
  RMT_KERNEL_TRUST_AUTHORITY_WORKPACKAGE,
  RMT_KERNEL_TRUST_AUTHORITY_WP_PATH,
  RMT_KERNEL_TRUST_DIAGNOSTIC_SCHEMA,
  RMT_KERNEL_TRUST_HARDENING_CONTRACT,
  RMT_KERNEL_TRUST_VERDICT_SCHEMA,
  SAFE_PROPERTY_WRITES,
  URL_ATTRIBUTES,
  UNSAFE_PROPERTY_WRITES,
  createKernelTrustAuthority,
  createKernelTrustAuthorityContract,
  createKernelTrustDiagnostic,
  createKernelTrustVerdict,
  hasUnsafeProtocol,
  serializeKernelTrustAuthorityContract,
  serializeKernelTrustVerdict
};
