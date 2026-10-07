'use strict';

const XTENSIONS_VUE_HOST_CONTROLLER_POC_SCHEMA = 'xtend.xtensions.vue-host-controller-poc.v1';
const XTENSIONS_VUE_HOST_CONTROLLER_POC_WORKPACKAGE = 'XTN-07';
const VUE_POC_PROXY_LEAK_CODE = 'xtensions.vue_poc.proxy_leak';
const VUE_POC_STORE_LEAK_CODE = 'xtensions.vue_poc.store_leak';
const VUE_POC_NON_SERIALIZABLE_PAYLOAD_CODE = 'xtensions.vue_poc.non_serializable_payload';
const VUE_POC_IMPLICIT_GLOBAL_PATCH_CODE = 'xtensions.vue_poc.implicit_global_patch';

const VUE_LEAK_KEYS = Object.freeze([
  '__v_isReactive',
  '__v_isReadonly',
  '__v_isRef',
  '__v_raw',
  '_isVue',
  '$el',
  '$data',
  '$props',
  '$refs',
  '$store',
  'vuexStore',
  'pinia',
  'piniaStore',
  'reactiveState',
  'globalProperties',
  '$patch'
]);

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function createVuePocDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    code,
    message,
    details: cloneJson(metadata) || {},
    schema: 'xtend.xtensions.vue-host-controller-diagnostic.v1',
    source: XTENSIONS_VUE_HOST_CONTROLLER_POC_SCHEMA,
    workpackage: XTENSIONS_VUE_HOST_CONTROLLER_POC_WORKPACKAGE,
    severity,
    xtensionId: subject && (subject.xtensionId || subject.id) || null,
    framework: 'vue',
    field: metadata.field || null,
    metadata: cloneJson(metadata) || {}
  };
}

function leakCodeForKey(key) {
  if (key === 'globalProperties' || key === '$patch') return VUE_POC_IMPLICIT_GLOBAL_PATCH_CODE;
  if (key.toLowerCase().includes('store') || key === 'pinia' || key === 'piniaStore') return VUE_POC_STORE_LEAK_CODE;
  return VUE_POC_PROXY_LEAK_CODE;
}

function collectVuePayloadDiagnostics(value, path = 'payload', seen = new Set()) {
  const diagnostics = [];
  const valueType = typeof value;
  if (valueType === 'function' || valueType === 'symbol' || valueType === 'bigint') {
    diagnostics.push(createVuePocDiagnostic(
      { id: 'xtension.vue.poc' },
      VUE_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
      `Vue XTension payload field "${path}" must be serializable.`,
      'error',
      { field: path, valueType }
    ));
    return diagnostics;
  }

  if (!value || valueType !== 'object') return diagnostics;
  if (seen.has(value)) {
    diagnostics.push(createVuePocDiagnostic(
      { id: 'xtension.vue.poc' },
      VUE_POC_NON_SERIALIZABLE_PAYLOAD_CODE,
      `Vue XTension payload field "${path}" must not contain cycles.`,
      'error',
      { field: path, valueType: 'cycle' }
    ));
    return diagnostics;
  }
  seen.add(value);

  Object.keys(value).forEach((key) => {
    const childPath = `${path}.${key}`;
    if (VUE_LEAK_KEYS.includes(key)) {
      diagnostics.push(createVuePocDiagnostic(
        { id: 'xtension.vue.poc' },
        leakCodeForKey(key),
        `Vue XTension payload must not expose host-internal Vue proxy, store or global patch field "${key}".`,
        'error',
        { field: childPath, key }
      ));
    }
    diagnostics.push(...collectVuePayloadDiagnostics(value[key], childPath, seen));
  });
  seen.delete(value);
  return diagnostics;
}

function inspectVuePayloadBoundary(payload = {}) {
  const diagnostics = collectVuePayloadDiagnostics(payload, 'payload');
  return {
    ok: diagnostics.length === 0,
    diagnostics,
    proxyBoundary: 'internal-only',
    serializable: diagnostics.every((diagnostic) => diagnostic.code !== VUE_POC_NON_SERIALIZABLE_PAYLOAD_CODE)
  };
}

module.exports = { VUE_LEAK_KEYS, createVuePocDiagnostic, inspectVuePayloadBoundary };
