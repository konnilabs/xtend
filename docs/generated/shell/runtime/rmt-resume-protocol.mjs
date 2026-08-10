export const RMT_RESUME_RUNTIME_SCHEMA = 'xtend.rmt.resume-runtime.v1';
export const RMT_RESUME_ENVELOPE_SCHEMA = 'xtend.rmt.ssr-resume-envelope.v1';
export const RMT_RESUME_RESULT_SCHEMA = 'xtend.rmt.resume-result.v1';
export const RMT_RESUME_INTENT_SCHEMA = 'xtend.rmt.resume-intent.v1';
export const RMT_RESUME_ADAPTER_SCHEMA = 'xtend.xtensions.resume-adapter.v1';
export const RMT_RESUME_MAX_INTENTS = 128;

export function objectRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function toArray(value) {
  return Array.isArray(value) ? value : (value == null ? [] : [value]);
}

export function clampString(value, fallback = '') {
  const normalized = String(value == null ? '' : value).trim();
  return normalized || fallback;
}

export function cloneSafe(value, fallback = null) {
  if (typeof value === 'undefined') return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return fallback;
  }
}

export function freezeClone(value, fallback = null) {
  const cloned = cloneSafe(value, fallback);
  const seen = new WeakSet();
  const freeze = (entry) => {
    if (!entry || typeof entry !== 'object' || seen.has(entry)) return entry;
    seen.add(entry);
    Object.values(entry).forEach(freeze);
    return Object.freeze(entry);
  };
  return freeze(cloned);
}

export function canonicalizeRmtResumePayload(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalizeRmtResumePayload).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().filter((key) => value[key] !== undefined).map((key) => `${JSON.stringify(key)}:${canonicalizeRmtResumePayload(value[key])}`).join(',')}}`;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) return 'null';
  return JSON.stringify(value);
}

export function unsignedEnvelope(envelope) {
  const source = objectRecord(envelope);
  const result = {};
  Object.keys(source).forEach((key) => {
    if (key !== 'integrity') result[key] = source[key];
  });
  return result;
}

export function normalizeEnvelope(input) {
  if (typeof input === 'string') {
    try {
      return normalizeEnvelope(JSON.parse(input));
    } catch (_) {
      return {};
    }
  }
  const source = objectRecord(input);
  return objectRecord(source.resume || source.response && source.response.resume || source.result && source.result.resume || source);
}

export function normalizeResponse(input) {
  if (typeof input === 'string') {
    try {
      return normalizeResponse(JSON.parse(input));
    } catch (_) {
      return {};
    }
  }
  const source = objectRecord(input);
  return objectRecord(source.response || source.result && source.result.response || source);
}

export function createResumeDiagnostic(code, severity, message, details = {}) {
  return {
    schema: 'xtend.rmt.resume-diagnostic.v1',
    code,
    severity,
    message,
    details: cloneSafe(details, {})
  };
}
