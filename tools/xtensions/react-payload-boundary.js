'use strict';

const XTENSIONS_REACT_HOST_CONTROLLER_POC_SCHEMA = 'xtend.xtensions.react-host-controller-poc.v1';
const XTENSIONS_REACT_HOST_CONTROLLER_POC_WORKPACKAGE = 'XTN-06';
const REACT_POC_CONTEXT_LEAK_CODE = 'xtensions.react_poc.context_leak';
const REACT_POC_STORE_LEAK_CODE = 'xtensions.react_poc.store_leak';
const REACT_POC_NON_SERIALIZABLE_PAYLOAD_CODE = 'xtensions.react_poc.non_serializable_payload';

const REACT_LEAK_KEYS = Object.freeze([
  'reactContext',
  '$reactContext',
  'ReactContext',
  'providerValue',
  'reduxStore',
  'zustandStore',
  'reactStore',
  '_owner',
  '$$typeof'
]);

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function createReactPocDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  const diagnosticMetadata = cloneJson(metadata) || {};
  return {
    code,
    message,
    // `details` is retained as the legacy HostController diagnostic alias.
    details: diagnosticMetadata,
    schema: 'xtend.xtensions.react-host-controller-diagnostic.v1',
    source: XTENSIONS_REACT_HOST_CONTROLLER_POC_SCHEMA,
    workpackage: XTENSIONS_REACT_HOST_CONTROLLER_POC_WORKPACKAGE,
    severity,
    xtensionId: subject && (subject.xtensionId || subject.id) || null,
    framework: 'react',
    field: diagnosticMetadata.field || null,
    metadata: diagnosticMetadata
  };
}

function collectPayloadDiagnostics(value, path = 'payload', seen = new Set()) {
  const diagnostics = [];
  const valueType = typeof value;
  if (valueType === 'function' || valueType === 'symbol' || valueType === 'bigint') {
    diagnostics.push(createReactPocDiagnostic(
      { id: 'xtension.react.poc' },
      REACT_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
      `React XTension payload field "${path}" must be serializable.`,
      'error',
      { field: path, valueType }
    ));
    return diagnostics;
  }

  if (!value || valueType !== 'object') return diagnostics;
  if (seen.has(value)) {
    diagnostics.push(createReactPocDiagnostic(
      { id: 'xtension.react.poc' },
      REACT_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
      `React XTension payload field "${path}" must not contain cycles.`,
      'error',
      { field: path, valueType: 'cycle' }
    ));
    return diagnostics;
  }
  seen.add(value);

  Object.keys(value).forEach((key) => {
    const childPath = `${path}.${key}`;
    if (REACT_LEAK_KEYS.includes(key)) {
      diagnostics.push(createReactPocDiagnostic(
        { id: 'xtension.react.poc' },
        key.toLowerCase().includes('store') ? REACT_POC_STORE_LEAK_CODE : REACT_POC_CONTEXT_LEAK_CODE,
        `React XTension payload must not expose host-internal React context or store field "${key}".`,
        'error',
        { field: childPath, key }
      ));
    }
    diagnostics.push(...collectPayloadDiagnostics(value[key], childPath, seen));
  });
  seen.delete(value);
  return diagnostics;
}

function inspectReactPayloadBoundary(payload = {}) {
  const diagnostics = collectPayloadDiagnostics(payload, 'payload');
  return {
    ok: diagnostics.length === 0,
    diagnostics,
    contextBoundary: 'internal-only',
    serializable: diagnostics.every((diagnostic) => diagnostic.code !== REACT_POC_NON_SERIALIZABLE_PAYLOAD_CODE)
  };
}

module.exports = { REACT_LEAK_KEYS, createReactPocDiagnostic, inspectReactPayloadBoundary };
