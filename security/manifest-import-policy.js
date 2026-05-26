const LOADER_POLICY_CONTRACT = 'xtend.security.loader-policy.v1';
const MANIFEST_POLICY_CONTRACT = 'xtend.security.manifest-policy.v1';
const IMPORT_POLICY_CONTRACT = 'xtend.security.import-policy.v1';
const MANIFEST_IMPORT_GATE_CONTRACT = 'xtend.security.manifest-import-gate.v1';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
const ALLOWED_IMPORT_PROTOCOLS = ['http:', 'https:', 'file:'];
const REFUSED_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'blob:'];
const ALLOWED_MANIFEST_EXTENSIONS = ['.json'];
const ALLOWED_MODULE_EXTENSIONS = ['.js', '.mjs'];
const RESERVED_BOOTSTRAP_KEYS = ['xstate', 'xtend-i18n'];
const CUSTOM_ELEMENT_NAME_PATTERN = /^[a-z][a-z0-9]*-[a-z0-9-]*[a-z0-9]$/;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeHostname(hostname = '') {
  return String(hostname).replace(/^\[|\]$/g, '').toLowerCase();
}

function isLocalHost(hostname) {
  return LOCAL_HOSTS.includes(normalizeHostname(hostname));
}

function createUrl(value, baseUrl) {
  try {
    return new URL(String(value), baseUrl);
  } catch (_) {
    return null;
  }
}

function hasPathTraversal(url) {
  try {
    return decodeURIComponent(url.pathname).split('/').includes('..');
  } catch (_) {
    return true;
  }
}

function hasTraversalLikeInput(value) {
  try {
    const pathPart = decodeURIComponent(String(value)).split(/[?#]/)[0];
    return pathPart === '..' ||
      pathPart.startsWith('../') ||
      pathPart.includes('/../') ||
      pathPart.endsWith('/..');
  } catch (_) {
    return true;
  }
}

function hasAllowedExtension(url, kind) {
  const pathname = url.pathname.toLowerCase();
  const extensions = kind === 'manifest'
    ? ALLOWED_MANIFEST_EXTENSIONS
    : ALLOWED_MODULE_EXTENSIONS;
  return extensions.some((extension) => pathname.endsWith(extension));
}

function classifyPolicyUrl(value, options = {}) {
  const kind = options.kind || 'module';
  const baseUrl = options.baseUrl || options.currentUrl || 'http://127.0.0.1/';
  const currentUrl = createUrl(options.currentUrl || baseUrl, baseUrl);
  const targetUrl = createUrl(value, baseUrl);
  const diagnostics = [];
  const source = options.source || kind;

  if (!targetUrl || !currentUrl) {
    diagnostics.push('xtend.security.import.refused.invalid_url');
  } else if (hasTraversalLikeInput(value)) {
    diagnostics.push('xtend.security.import.refused.path_traversal');
  } else if (REFUSED_PROTOCOLS.includes(targetUrl.protocol)) {
    diagnostics.push('xtend.security.import.refused.protocol');
  } else if (!ALLOWED_IMPORT_PROTOCOLS.includes(targetUrl.protocol)) {
    diagnostics.push('xtend.security.import.refused.protocol');
  } else if (hasPathTraversal(targetUrl)) {
    diagnostics.push('xtend.security.import.refused.path_traversal');
  } else if (!hasAllowedExtension(targetUrl, kind)) {
    diagnostics.push(kind === 'manifest'
      ? 'xtend.security.manifest.invalid.extension'
      : 'xtend.security.import.refused.extension');
  } else {
    const sameOrigin = targetUrl.origin === currentUrl.origin;
    const localLoopback = isLocalHost(targetUrl.hostname) && (
      isLocalHost(currentUrl.hostname) ||
      currentUrl.protocol === 'file:'
    );
    const localFile = targetUrl.protocol === 'file:' && currentUrl.protocol === 'file:';

    if (!sameOrigin && !localLoopback && !localFile) {
      diagnostics.push(kind === 'manifest'
        ? 'xtend.security.loader.refused.external_manifest'
        : 'xtend.security.import.refused.external_module');
    }
  }

  return {
    schema: IMPORT_POLICY_CONTRACT,
    ok: diagnostics.length === 0,
    kind,
    source,
    input: String(value),
    url: targetUrl ? targetUrl.href : null,
    local: targetUrl && currentUrl
      ? targetUrl.origin === currentUrl.origin || isLocalHost(targetUrl.hostname) || targetUrl.protocol === 'file:'
      : false,
    diagnostics
  };
}

function isAllowedManifestKey(key) {
  if (RESERVED_BOOTSTRAP_KEYS.includes(key)) {
    return true;
  }
  return CUSTOM_ELEMENT_NAME_PATTERN.test(key);
}

function getManifestRecordUrl(record) {
  if (typeof record === 'string') {
    return record;
  }
  if (record && typeof record === 'object') {
    if (typeof record.url === 'string') return record.url;
    if (typeof record.path === 'string') return record.path;
  }
  return null;
}

function dependenciesAreComponentIds(record) {
  if (!record || typeof record !== 'object' || !Array.isArray(record.dependencies)) {
    return true;
  }
  return record.dependencies.every((dependency) => (
    typeof dependency === 'string' &&
    isAllowedManifestKey(dependency) &&
    !dependency.includes('/') &&
    !dependency.includes(':')
  ));
}

function classifyManifestRecord(key, record, options = {}) {
  const diagnostics = [];
  const normalizedKey = typeof key === 'string' ? key.trim() : '';
  const recordUrl = getManifestRecordUrl(record);

  if (!normalizedKey || normalizedKey !== normalizedKey.toLowerCase() || !isAllowedManifestKey(normalizedKey)) {
    diagnostics.push('xtend.security.manifest.invalid.tag');
  }

  if (!recordUrl) {
    diagnostics.push('xtend.security.manifest.invalid.url');
  }

  if (!dependenciesAreComponentIds(record)) {
    diagnostics.push('xtend.security.manifest.invalid.dependencies');
  }

  const urlPolicy = recordUrl
    ? classifyPolicyUrl(recordUrl, {
      ...options,
      kind: 'module',
      source: normalizedKey || 'manifest-record'
    })
    : null;

  if (urlPolicy && !urlPolicy.ok) {
    diagnostics.push(...urlPolicy.diagnostics);
  }

  return {
    schema: MANIFEST_POLICY_CONTRACT,
    ok: diagnostics.length === 0,
    key: normalizedKey,
    url: urlPolicy ? urlPolicy.url : null,
    source: 'manifest-record',
    diagnostics
  };
}

function normalizeManifest(rawManifest, options = {}) {
  const diagnostics = [];
  const entries = {};

  if (!rawManifest || typeof rawManifest !== 'object' || Array.isArray(rawManifest)) {
    return {
      schema: MANIFEST_POLICY_CONTRACT,
      ok: false,
      entries,
      diagnostics: ['xtend.security.manifest.invalid.shape']
    };
  }

  Object.entries(rawManifest).forEach(([key, record]) => {
    const classification = classifyManifestRecord(key, record, options);
    if (classification.ok) {
      entries[classification.key] = classification.url;
    } else {
      diagnostics.push({
        key,
        codes: classification.diagnostics
      });
    }
  });

  return {
    schema: MANIFEST_POLICY_CONTRACT,
    ok: diagnostics.length === 0,
    entries,
    diagnostics
  };
}

function createManifestImportPolicy(options = {}) {
  return {
    schema: MANIFEST_IMPORT_GATE_CONTRACT,
    loaderPolicy: LOADER_POLICY_CONTRACT,
    manifestPolicy: MANIFEST_POLICY_CONTRACT,
    importPolicy: IMPORT_POLICY_CONTRACT,
    mode: options.mode || 'local-self-and-loopback-only',
    allowedProtocols: clone(ALLOWED_IMPORT_PROTOCOLS),
    refusedProtocols: clone(REFUSED_PROTOCOLS),
    localHosts: clone(LOCAL_HOSTS),
    manifestExtensions: clone(ALLOWED_MANIFEST_EXTENSIONS),
    moduleExtensions: clone(ALLOWED_MODULE_EXTENSIONS),
    reservedBootstrapKeys: clone(RESERVED_BOOTSTRAP_KEYS),
    diagnostics: [
      'xtend.security.loader.refused',
      'xtend.security.manifest.invalid',
      'xtend.security.import.refused'
    ],
    rules: {
      manifestUrl: 'Must be same-origin, file-local or loopback-local JSON.',
      moduleUrl: 'Must be same-origin, file-local or loopback-local JavaScript module.',
      preload: 'Component IDs only; no free URLs.',
      dependencies: 'Component IDs only; no URL-like dependency values.',
      cdn: 'External CDN URLs are refused by default.'
    }
  };
}

module.exports = {
  ALLOWED_IMPORT_PROTOCOLS,
  ALLOWED_MANIFEST_EXTENSIONS,
  ALLOWED_MODULE_EXTENSIONS,
  CUSTOM_ELEMENT_NAME_PATTERN,
  IMPORT_POLICY_CONTRACT,
  LOADER_POLICY_CONTRACT,
  LOCAL_HOSTS,
  MANIFEST_IMPORT_GATE_CONTRACT,
  MANIFEST_POLICY_CONTRACT,
  REFUSED_PROTOCOLS,
  RESERVED_BOOTSTRAP_KEYS,
  classifyManifestRecord,
  classifyPolicyUrl,
  createManifestImportPolicy,
  isAllowedManifestKey,
  normalizeManifest
};
