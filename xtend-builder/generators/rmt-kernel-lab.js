'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  generateEntrypoint
} = require('../../scripts/generate_xtendrmt_esm_entrypoints');
const {
  DOM_COMMIT_RESULT_SCHEMA,
  DOM_RENDERER_FACTORY,
  DOM_RENDERER_MODULE_PATH,
  DOM_RENDERER_SCHEMA,
  DOM_RENDERER_SOURCE_PATH,
  DOM_RENDERER_TYPES_PATH,
  createBundledRendererModule,
  createDomSourceReport,
  synchronizeKernelArtifact,
  validateDomCommitArtifact
} = require('./rmt-kernel-lab-dom-commit');

const RMT_KERNEL_LAB_ANALYSIS_SCHEMA = 'xtend.scaffold.rmt-kernel-lab.analysis.v1';
const RMT_KERNEL_LAB_BUILD_SCHEMA = 'xtend.scaffold.rmt-kernel-lab.build.v1';
const RMT_KERNEL_MODULE_MANIFEST_SCHEMA = 'xtend.rmt.kernel-module-manifest.v2';
const RMT_KERNEL_SOURCE_MANIFEST_SCHEMA = 'xtend.rmt.kernel-sources.v2';
const RMT_KERNEL_MVC_REPORT_SCHEMA = 'xtend.rmt.kernel-mvc-report.v1';
const RMT_KERNEL_OPTIMIZATION_REPORT_SCHEMA = 'xtend.rmt.kernel-lab.optimization-report.v1';
const RMT_KERNEL_SOURCE_ARTIFACT_SCHEMA = 'xtend.rmt.kernel-source-artifact.v1';
const DEFAULT_PROFILE = 'clean';
const MODULE_MANIFEST_PATH = 'xtendrmt/rmt-kernel-module-manifest.json';
const SOURCE_MANIFEST_PATH = 'xtendrmt/kernel/rmt-kernel-sources.json';
const DEFAULT_KERNEL_VERSION = '0.0.0';
const KERNEL_LAB_BUILD_COMMAND_BASE = 'xtend kernel-lab build --profile clean';
const DEPRECATED_BRAND_PARTS = Object.freeze(['Render', 'Man']);
const DEPRECATED_BRAND_NAME = DEPRECATED_BRAND_PARTS.join('');
const DEPRECATED_BRAND_LOWER = DEPRECATED_BRAND_NAME.toLowerCase();
const DEPRECATED_BRAND_CAMEL = `${DEPRECATED_BRAND_LOWER.slice(0, 6)}${DEPRECATED_BRAND_NAME.slice(6)}`;
const DEPRECATED_BRAND_KEBAB = `${DEPRECATED_BRAND_LOWER.slice(0, 6)}-${DEPRECATED_BRAND_LOWER.slice(6)}`;
const DEPRECATED_FACTORY_PREFIX = `create${DEPRECATED_BRAND_NAME}`;
const DEPRECATED_GETTER_PREFIX = `get${DEPRECATED_BRAND_NAME}`;
const DEPRECATED_INSTALL_PREFIX = `install${DEPRECATED_BRAND_NAME}`;

const KERNEL_ANALYSIS_TARGETS = Object.freeze([
  { id: 'rmt-core-esm', path: 'xtendrmt/rmt-core.esm.js', kind: 'esm' },
  { id: 'rmt-runtime-esm', path: 'xtendrmt/rmt-runtime.esm.js', kind: 'esm' },
  { id: 'rmt-runtime-browser', path: 'xtendrmt/rmt-runtime.browser.js', kind: 'browser' },
  { id: 'rmt-core-types', path: 'xtendrmt/rmt-core.d.ts', kind: 'types' },
  { id: 'rmt-schema', path: 'xtendrmt/rmt.schema.json', kind: 'schema' },
  { id: 'rmt-manifest', path: 'xtendrmt/rmt-manifest.json', kind: 'manifest' }
]);

function createKernelSourceInputCatalog() {
  const repositoryRoot = path.resolve(__dirname, '..', '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(repositoryRoot, SOURCE_MANIFEST_PATH), 'utf8'));
  const inputs = new Map();
  const add = (sourcePath, kind, id) => {
    if (!sourcePath || inputs.has(sourcePath)) return;
    inputs.set(sourcePath, Object.freeze({
      id: id || `rmt-kernel-source-${String(sourcePath).replace(/[^A-Za-z0-9]+/gu, '-')}`,
      path: sourcePath,
      kind
    }));
  };
  add(SOURCE_MANIFEST_PATH, 'source-manifest', 'rmt-kernel-source-manifest');
  (manifest.modules || [])
    .filter((entry) => entry && entry.sourceMode === 'canonical')
    .forEach((entry) => add(
      entry.sourcePath,
      String(entry.sourcePath).includes('/kernel/modules/') ? 'module-source' : 'source',
      entry.id
    ));
  add(DOM_RENDERER_TYPES_PATH, 'source-types', 'rmt-dom-descriptor-renderer-types-source');
  Object.values(manifest.bundle || {}).forEach((value) => {
    if (typeof value === 'string') add(value, 'template-source');
  });
  return Object.freeze(Array.from(inputs.values()));
}

const KERNEL_SOURCE_INPUTS = createKernelSourceInputCatalog();

const KERNEL_BUILD_TARGETS = Object.freeze([
  ...KERNEL_ANALYSIS_TARGETS,
  { id: 'rmt-kernel-module-manifest', path: MODULE_MANIFEST_PATH, kind: 'module-manifest' }
]);

const DASHBOARD_SYMBOLS = Object.freeze([
  'createRmtDashboardAdapter',
  'createRmtDashboardCompatBootstrap',
  'createRmtDashboardCommandCatalog',
  'createRmtDashboardProductRuntime',
  `${DEPRECATED_FACTORY_PREFIX}DashboardAdapter`,
  `${DEPRECATED_FACTORY_PREFIX}DashboardCompatBootstrap`,
  `${DEPRECATED_FACTORY_PREFIX}DashboardCommandCatalog`,
  `${DEPRECATED_FACTORY_PREFIX}DashboardProductRuntime`,
  'dashboardAdapter',
  'dashboardCompatBootstrap',
  'dashboardCommandCatalog'
]);

const JS_DASHBOARD_LINE_FRAGMENTS = Object.freeze([
  "dashboardAdapter: 'createRmtDashboardAdapter'",
  "dashboardCompatBootstrap: 'createRmtDashboardCompatBootstrap'",
  "dashboardCommandCatalog: 'createRmtDashboardCommandCatalog'",
  `dashboardAdapter: '${DEPRECATED_FACTORY_PREFIX}DashboardAdapter'`,
  `dashboardCompatBootstrap: '${DEPRECATED_FACTORY_PREFIX}DashboardCompatBootstrap'`,
  `dashboardCommandCatalog: '${DEPRECATED_FACTORY_PREFIX}DashboardCommandCatalog'`,
  'dashboardAdapter: typeof appModules.createRmtDashboardAdapter',
  `|| typeof appModules.${DEPRECATED_FACTORY_PREFIX}DashboardAdapter`,
  'dashboardCompatBootstrap: typeof appModules.createRmtDashboardCompatBootstrap',
  `|| typeof appModules.${DEPRECATED_FACTORY_PREFIX}DashboardCompatBootstrap`,
  'dashboardCommandCatalog: typeof appModules.createRmtDashboardCommandCatalog',
  `|| typeof appModules.${DEPRECATED_FACTORY_PREFIX}DashboardCommandCatalog`,
  'createDashboardAdapter: resolveRmtFactory',
  'createDashboardCompatBootstrap: resolveRmtFactory',
  'createDashboardCommandCatalog: resolveRmtFactory'
]);

const DEPRECATED_BRANDING_REPLACEMENTS = Object.freeze([
  { from: new RegExp(`${DEPRECATED_FACTORY_PREFIX}RmtFormat`, 'gu'), to: 'createRmtFormat' },
  { from: new RegExp(`${DEPRECATED_BRAND_NAME}RmtFormat`, 'gu'), to: 'RmtFormat' },
  { from: new RegExp(`register${DEPRECATED_BRAND_NAME}RmtFormatModule`, 'gu'), to: 'registerRmtFormatModelModule' },
  { from: new RegExp(`register${DEPRECATED_BRAND_NAME}Module`, 'gu'), to: 'registerRmtEngineModule' },
  { from: new RegExp(`modules/${DEPRECATED_BRAND_KEBAB}\\.js`, 'gu'), to: 'modules/rmt-engine.js' },
  { from: new RegExp(DEPRECATED_BRAND_NAME, 'gu'), to: 'Rmt' },
  { from: new RegExp(DEPRECATED_BRAND_CAMEL, 'gu'), to: 'rmt' },
  { from: new RegExp(DEPRECATED_BRAND_KEBAB, 'gu'), to: 'rmt' },
  { from: new RegExp(DEPRECATED_BRAND_LOWER, 'gu'), to: 'rmt' },
  { from: /RmtRmt/gu, to: 'Rmt' },
  { from: /rmt-rmt/gu, to: 'rmt' },
  { from: /rmt_rmt/gu, to: 'rmt' },
  { from: /rmt\.rmt/gu, to: 'rmt' }
]);

const TYPE_DASHBOARD_LINE_FRAGMENTS = Object.freeze([
  'dashboardAdapter:',
  'dashboardCompatBootstrap:',
  'dashboardCommandCatalog:',
  'createDashboardAdapter:',
  'createDashboardCompatBootstrap:',
  'createDashboardCommandCatalog:'
]);

const JS_COMMENT_REPLACEMENTS = Object.freeze([
  {
    from: 'Command-Response-Hooks duerfen die Delegation nicht destabilisieren.',
    to: 'Command response hooks must not destabilize delegation.'
  },
  {
    from: 'Diagnostics subscribers duerfen den Runtime-Pfad nicht unterbrechen.',
    to: 'Diagnostics subscribers must not interrupt the runtime path.'
  },
  {
    from: 'Command-Subscribers duerfen den Runtime-Pfad nicht unterbrechen.',
    to: 'Command subscribers must not interrupt the runtime path.'
  },
  {
    from: 'Reaktive Subscribers duerfen den Runtime-Pfad nicht unterbrechen.',
    to: 'Reactive subscribers must not interrupt the runtime path.'
  },
  {
    from: 'Reaktive Effects duerfen den Runtime-Pfad nicht unterbrechen.',
    to: 'Reactive effects must not interrupt the runtime path.'
  },
  {
    from: 'Reaktive Root-Disposer duerfen den Runtime-Pfad nicht unterbrechen.',
    to: 'Reactive root disposers must not interrupt the runtime path.'
  },
  {
    from: 'Template-Commands duerfen den Runtime-Pfad nicht unterbrechen.',
    to: 'Template commands must not interrupt the runtime path.'
  },
  {
    from: 'Template-Root-Events duerfen den Runtime-Pfad nicht unterbrechen.',
    to: 'Template root events must not interrupt the runtime path.'
  },
  {
    from: 'Template-Binding-Disposer duerfen den Runtime-Pfad nicht unterbrechen.',
    to: 'Template binding disposers must not interrupt the runtime path.'
  }
]);

function toBoolean(value) {
  return value === true || value === 'true' || value === '1' || value === 'yes';
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function toPosixPath(value) {
  return String(value || '').replace(/\\/g, '/');
}

function resolveRootDir(rootDir) {
  return path.resolve(rootDir || process.cwd());
}

function resolvePath(rootDir, relativePath) {
  return path.join(rootDir, relativePath);
}

function readText(rootDir, relativePath) {
  return fs.readFileSync(resolvePath(rootDir, relativePath), 'utf8');
}

function writeText(rootDir, relativePath, content) {
  const targetPath = resolvePath(rootDir, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, 'utf8');
}

function maybeReadText(rootDir, relativePath) {
  const targetPath = resolvePath(rootDir, relativePath);
  return fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : null;
}

const MVC_ROLES = Object.freeze(new Set(['shared', 'model', 'view', 'controller', 'adapter', 'composition']));
const ADAPTER_DIRECTIONS = Object.freeze(new Set(['input', 'output', 'host']));
const MVC_SOURCE_MODES = Object.freeze(new Set(['canonical', 'legacy-bundle']));
const MVC_COMPATIBILITY_COMPOSER_KIND = '0.6-compatibility-composer';
const MVC_GLOBAL_MIRROR_KIND = '0.6-global-mirror';
const MVC_CONTROLLER_STATE_WRITER_KIND = '0.6-controller-state-writer';
const MVC_COMPATIBILITY_SHELL_START = '/* xtend-kernel-mvc:compatibility-shell-start */';
const MVC_COMPATIBILITY_SHELL_END = '/* xtend-kernel-mvc:compatibility-shell-end */';
const MVC_COMPATIBILITY_SINCE = '0.6.0';
const MVC_COMPATIBILITY_REMOVE_BY = '0.7.0';
const MVC_CAPABILITIES = Object.freeze(new Set([
  'dom.read',
  'dom.write',
  'dom.trustedHtml',
  'event.listen',
  'event.dispatch',
  'state.read',
  'state.write',
  'host.clock',
  'host.scheduler',
  'host.abort',
  'network',
  'worker',
  'storage',
  'global.read',
  'global.write'
]));
const CONTROLLER_FORBIDDEN_CAPABILITIES = Object.freeze(new Set([
  'dom.read',
  'dom.write',
  'dom.trustedHtml',
  'event.listen',
  'event.dispatch',
  'state.write',
  'host.clock',
  'host.scheduler',
  'host.abort',
  'network',
  'worker',
  'storage',
  'global.read',
  'global.write'
]));
const MODEL_FORBIDDEN_CAPABILITIES = Object.freeze(new Set([
  'dom.read',
  'dom.write',
  'dom.trustedHtml',
  'event.listen',
  'event.dispatch',
  'network',
  'worker',
  'storage',
  'host.clock',
  'host.scheduler',
  'host.abort',
  'global.read',
  'global.write'
]));
const VIEW_FORBIDDEN_CAPABILITIES = Object.freeze(new Set([
  'state.write',
  'network',
  'worker',
  'storage',
  'host.abort'
]));
const COMPOSITION_FORBIDDEN_CAPABILITIES = Object.freeze(new Set(MVC_CAPABILITIES));
const COMPATIBILITY_COMPOSER_ALLOWED_CAPABILITIES = Object.freeze(new Set([
  'state.read',
  'global.read',
  'global.write'
]));
const ADAPTER_DIRECTION_FORBIDDEN_CAPABILITIES = Object.freeze({
  input: new Set(['dom.write', 'dom.trustedHtml', 'event.dispatch', 'state.write', 'global.write', 'host.abort']),
  output: new Set(['event.listen', 'network', 'storage', 'host.abort']),
  host: new Set(['state.write'])
});
const MVC_ROLE_OWNERSHIP_PREFIXES = Object.freeze({
  shared: ['shared.'],
  model: ['model.'],
  view: ['view.', 'dom.'],
  controller: ['controller.'],
  composition: ['composition.'],
  adapter: []
});
const ADAPTER_OWNERSHIP_PREFIXES = Object.freeze({
  input: ['input.'],
  output: ['output.', 'view.', 'preview.'],
  host: ['host.']
});

function parseJsonSource(source, sourcePath) {
  try {
    return JSON.parse(String(source || '{}'));
  } catch (error) {
    const wrapped = new Error(`Kernel source manifest ${sourcePath} is not valid JSON: ${error.message}`);
    wrapped.code = 'xtend.rmt.kernel_lab.source_manifest_invalid';
    wrapped.path = sourcePath;
    throw wrapped;
  }
}

function readKernelSourceManifest(rootDir, override = null) {
  if (override && typeof override === 'object') return override;
  const source = maybeReadText(rootDir, SOURCE_MANIFEST_PATH);
  if (source === null) {
    const error = new Error(`Kernel source manifest is missing: ${SOURCE_MANIFEST_PATH}`);
    error.code = 'xtend.rmt.kernel_lab.source_manifest_missing';
    error.path = SOURCE_MANIFEST_PATH;
    throw error;
  }
  return parseJsonSource(source, SOURCE_MANIFEST_PATH);
}

function stripCommentsAndStrings(source) {
  const text = String(source || '');
  let output = '';
  let state = 'code';
  let stringQuote = '';
  let escaped = false;
  let regexCharacterClass = false;
  const templateStack = [];
  const regexPrefixKeywords = new Set([
    'await', 'case', 'delete', 'else', 'in', 'instanceof', 'new', 'of',
    'return', 'throw', 'typeof', 'void', 'yield'
  ]);
  const canStartRegex = () => {
    const prefix = output.trimEnd();
    if (!prefix) return true;
    const previous = prefix[prefix.length - 1];
    if ('([{,:;=!?&|+-*%^~<>'.includes(previous)) return true;
    const word = prefix.match(/([A-Za-z_$][A-Za-z0-9_$]*)$/u);
    return Boolean(word && regexPrefixKeywords.has(word[1]));
  };
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1] || '';
    if (state === 'line-comment') {
      if (char === '\n') {
        state = 'code';
        output += '\n';
      } else output += ' ';
      continue;
    }
    if (state === 'block-comment') {
      if (char === '*' && next === '/') {
        output += '  ';
        index += 1;
        state = 'code';
      } else output += char === '\n' ? '\n' : ' ';
      continue;
    }
    if (state === 'string') {
      if (escaped) {
        escaped = false;
        output += char === '\n' ? '\n' : ' ';
      } else if (char === '\\') {
        escaped = true;
        output += ' ';
      } else if (char === stringQuote) {
        output += ' ';
        state = 'code';
      } else output += char === '\n' ? '\n' : ' ';
      continue;
    }
    if (state === 'template') {
      if (escaped) {
        escaped = false;
        output += char === '\n' ? '\n' : ' ';
      } else if (char === '\\') {
        escaped = true;
        output += ' ';
      } else if (char === '`') {
        output += ' ';
        templateStack.pop();
        state = 'code';
      } else if (char === '$' && next === '{') {
        const frame = templateStack[templateStack.length - 1];
        frame.expressionDepth = 1;
        output += '  ';
        index += 1;
        state = 'code';
      } else output += char === '\n' ? '\n' : ' ';
      continue;
    }
    if (state === 'regex') {
      if (escaped) {
        escaped = false;
        output += char === '\n' ? '\n' : ' ';
      } else if (char === '\\') {
        escaped = true;
        output += ' ';
      } else if (char === '[') {
        regexCharacterClass = true;
        output += ' ';
      } else if (char === ']' && regexCharacterClass) {
        regexCharacterClass = false;
        output += ' ';
      } else if (char === '/' && !regexCharacterClass) {
        output += ' ';
        state = 'regex-flags';
      } else {
        output += char === '\n' ? '\n' : ' ';
      }
      continue;
    }
    if (state === 'regex-flags') {
      if (/[A-Za-z]/u.test(char)) {
        output += ' ';
        continue;
      }
      state = 'code';
    }
    if (char === '/' && next === '/') {
      output += '  ';
      index += 1;
      state = 'line-comment';
      continue;
    }
    if (char === '/' && next === '*') {
      output += '  ';
      index += 1;
      state = 'block-comment';
      continue;
    }
    if (char === '/' && canStartRegex()) {
      state = 'regex';
      regexCharacterClass = false;
      escaped = false;
      output += ' ';
      continue;
    }
    if (char === '\'' || char === '"') {
      stringQuote = char;
      state = 'string';
      output += ' ';
      continue;
    }
    if (char === '`') {
      templateStack.push({ expressionDepth: 0 });
      state = 'template';
      escaped = false;
      output += ' ';
      continue;
    }
    const templateFrame = templateStack[templateStack.length - 1];
    if (templateFrame && templateFrame.expressionDepth > 0) {
      if (char === '{') templateFrame.expressionDepth += 1;
      else if (char === '}') {
        templateFrame.expressionDepth -= 1;
        if (templateFrame.expressionDepth === 0) {
          output += ' ';
          state = 'template';
          continue;
        }
      }
    }
    output += char;
  }
  return output;
}

function detectObservedCapabilities(source) {
  const code = stripCommentsAndStrings(source);
  const observed = new Set();
  const matches = (pattern) => pattern.test(code);
  if (matches(/\b(?:document|window\.document)\s*\.|\.querySelector(?:All)?\s*\(|\.getAttribute\s*\(|\.ownerDocument\b/u)) observed.add('dom.read');
  if (matches(/\.setAttribute\s*\(|\.removeAttribute\s*\(|\.appendChild\s*\(|\.insertBefore\s*\(|\.removeChild\s*\(|\.replaceChildren\s*\(|\.style\s*(?:\[[^\]]+\]|\.[A-Za-z_$][A-Za-z0-9_$]*)\s*=|\.style\.(?:setProperty|removeProperty)\s*\(/u)) observed.add('dom.write');
  if (matches(/\.innerHTML\s*=(?!=)|\.insertAdjacentHTML\s*\(/u)) observed.add('dom.trustedHtml');
  const listenerTargets = Array.from(code.matchAll(/\b([A-Za-z0-9_$.]+)\.addEventListener\s*\(/gu)).map((match) => match[1]);
  if (listenerTargets.some((target) => !/(?:signal|Signal)$/u.test(target))) observed.add('event.listen');
  if (matches(/\.dispatchEvent\s*\(/u)) observed.add('event.dispatch');
  if (matches(/\.(?:getState|getSelectorValues|getDerivedValues|select)\s*\(|\b(?:model|modelReader|state|stateReader|stateRuntime)[A-Za-z0-9_$]*\??\.snapshot\s*\(/u)) observed.add('state.read');
  if (matches(/\.(?:setState|patchState|batchUpdate)\s*\(|\b(?:xtendState|stateRuntime)\??\.[A-Za-z0-9_$]*set\s*\(/u)) observed.add('state.write');
  if (matches(/\bDate\.now\s*\(|\bnew\s+Date\s*\(\s*\)|\bperformance\.now\s*\(/u)) observed.add('host.clock');
  if (matches(/(?:^|[^\w$.])(?:requestAnimationFrame|cancelAnimationFrame|queueMicrotask|setTimeout|clearTimeout|setInterval|clearInterval)\s*\(/u)) observed.add('host.scheduler');
  if (matches(/\bnew\s+(?:[A-Za-z_$][A-Za-z0-9_$]*\.)?AbortController\s*\(/u)) observed.add('host.abort');
  // A controller calling an injected `adapter.fetch()` uses a port; only a
  // direct host fetch is a network capability owned by the module itself.
  if (matches(/(?:^|[^\w$.])fetch\s*\(|\bXMLHttpRequest\b|\.serviceWorker\.register\s*\(|\bserviceWorker\.register\s*\(/u)) observed.add('network');
  if (matches(/\b(?:Worker|SharedWorker)\s*\(|\.serviceWorker\.register\s*\(|\bserviceWorker\.register\s*\(/u)) observed.add('worker');
  if (matches(/\b(?:localStorage|sessionStorage|indexedDB)\b/u)) observed.add('storage');
  if (matches(/\b(?:globalThis|globalTarget)\b|\btypeof\s+window\b|(?:^|[^\w$.])window\s*(?:\.|\[)/u)) observed.add('global.read');
  if (matches(/\b(?:globalThis|globalTarget)\s*(?:\.[A-Za-z0-9_$]+|\[[^\]]+\])\s*=|(?:^|[^\w$.])window\s*(?:\.[A-Za-z0-9_$]+|\[[^\]]+\])\s*=/u)) observed.add('global.write');
  return Array.from(observed).sort();
}

function extractCompatibilityShell(source) {
  const input = String(source || '');
  const segments = [];
  let cursor = 0;
  let coreSource = '';
  let malformed = false;
  while (cursor < input.length) {
    const start = input.indexOf(MVC_COMPATIBILITY_SHELL_START, cursor);
    const orphanEnd = input.indexOf(MVC_COMPATIBILITY_SHELL_END, cursor);
    if (start === -1) {
      if (orphanEnd !== -1) malformed = true;
      coreSource += input.slice(cursor);
      break;
    }
    if (orphanEnd !== -1 && orphanEnd < start) {
      malformed = true;
      coreSource += input.slice(cursor, orphanEnd + MVC_COMPATIBILITY_SHELL_END.length);
      cursor = orphanEnd + MVC_COMPATIBILITY_SHELL_END.length;
      continue;
    }
    coreSource += input.slice(cursor, start);
    const contentStart = start + MVC_COMPATIBILITY_SHELL_START.length;
    const end = input.indexOf(MVC_COMPATIBILITY_SHELL_END, contentStart);
    if (end === -1) {
      malformed = true;
      coreSource += input.slice(start);
      break;
    }
    segments.push(input.slice(contentStart, end));
    coreSource += '\n';
    cursor = end + MVC_COMPATIBILITY_SHELL_END.length;
  }
  return {
    coreSource,
    shellSource: segments.join('\n'),
    segmentCount: segments.length,
    malformed
  };
}

function detectsConcreteViewDescriptor(source) {
  const code = stripCommentsAndStrings(source);
  return /\{[^{}]{0,480}\btype\s*:[^{}]{0,240}\btag\s*:|\{[^{}]{0,480}\btag\s*:[^{}]{0,240}\btype\s*:/su.test(code);
}

function sourceProvidesSymbol(source, provider) {
  const escaped = String(provider || '').replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  if (!escaped) return false;
  return new RegExp(
    `(?:appModules\\.${escaped}\\s*=|export\\s+(?:const|function|class)\\s+${escaped}\\b|function\\s+${escaped}\\s*\\(|\\b${escaped}\\s*[:,])`,
    'u'
  ).test(String(source || ''));
}

function detectAppModuleConsumes(source, ownProviders, providerOwners) {
  const own = new Set(ownProviders || []);
  return Array.from(new Set(Array.from(String(source || '').matchAll(/appModules\.([A-Za-z0-9_]+)/gu))
    .map((match) => match[1])
    .filter((provider) => providerOwners.has(provider) && !own.has(provider))))
    .sort();
}

function detectStaticSourceDependencies(source, sourcePath, sourceOwnerByPath) {
  const dependencies = new Set();
  const importPattern = /\b(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"](\.[^'"]+)['"]/gu;
  let match = importPattern.exec(String(source || ''));
  while (match) {
    const resolvedPath = path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), match[1]));
    const dependencyId = sourceOwnerByPath.get(resolvedPath);
    if (dependencyId) dependencies.add(dependencyId);
    match = importPattern.exec(String(source || ''));
  }
  return Array.from(dependencies).sort();
}

function normalizeKernelSourceEntries(manifest) {
  const canonical = Array.isArray(manifest.modules) ? manifest.modules : [];
  const legacy = (Array.isArray(manifest.legacyBundles) ? manifest.legacyBundles : []).flatMap((bundle) => (
    (Array.isArray(bundle.moduleIds) ? bundle.moduleIds : []).map((id) => ({
      id,
      sourcePath: bundle.sourcePath,
      sourceMode: bundle.sourceMode || 'legacy-bundle',
      mvcRole: bundle.mvcRole || 'composition',
      adapterDirection: bundle.adapterDirection || null,
      provides: Array.isArray(bundle.provides) ? bundle.provides : [],
      consumes: Array.isArray(bundle.consumes) ? bundle.consumes : [],
      dependsOn: Array.isArray(bundle.dependsOn) ? bundle.dependsOn : [],
      ports: Array.isArray(bundle.ports) ? bundle.ports : [],
      capabilities: Array.isArray(bundle.capabilities) ? bundle.capabilities : [],
      compatibility: bundle.compatibility && typeof bundle.compatibility === 'object' ? bundle.compatibility : null,
      compatibilityShell: bundle.compatibilityShell && typeof bundle.compatibilityShell === 'object' ? bundle.compatibilityShell : null,
      ownershipDomains: Array.isArray(bundle.ownershipDomains) ? bundle.ownershipDomains : [],
      targets: Array.isArray(bundle.targets) ? bundle.targets : []
    }))
  ));
  return [...canonical, ...legacy].map((entry) => ({
    ...entry,
    sourceMode: entry.sourceMode || 'canonical',
    adapterDirection: entry.adapterDirection || null,
    provides: Array.isArray(entry.provides) ? entry.provides : [],
    consumes: Array.isArray(entry.consumes) ? entry.consumes : [],
    dependsOn: Array.isArray(entry.dependsOn) ? entry.dependsOn : [],
    ports: Array.isArray(entry.ports) ? entry.ports : [],
    capabilities: Array.isArray(entry.capabilities) ? entry.capabilities : [],
    compatibility: entry.compatibility && typeof entry.compatibility === 'object' ? {
      ...entry.compatibility,
      allowedCapabilities: Array.isArray(entry.compatibility.allowedCapabilities)
        ? entry.compatibility.allowedCapabilities
        : []
    } : null,
    compatibilityShell: entry.compatibilityShell && typeof entry.compatibilityShell === 'object'
      ? { ...entry.compatibilityShell }
      : null,
    ownershipDomains: Array.isArray(entry.ownershipDomains) ? entry.ownershipDomains : [],
    targets: Array.isArray(entry.targets) ? entry.targets : []
  }));
}

function findDependencyCycles(entries) {
  const graph = new Map(entries.map((entry) => [entry.id, entry.dependsOn.filter((id) => id !== entry.id)]));
  const visiting = new Set();
  const visited = new Set();
  const cycles = [];
  function visit(id, stack) {
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      cycles.push([...stack.slice(start), id]);
      return;
    }
    if (visited.has(id) || !graph.has(id)) return;
    visiting.add(id);
    stack.push(id);
    graph.get(id).forEach((dependency) => visit(dependency, stack));
    stack.pop();
    visiting.delete(id);
    visited.add(id);
  }
  graph.forEach((_, id) => visit(id, []));
  return cycles;
}

function allowedDependencyRoles(role) {
  if (role === 'shared') return new Set(['shared']);
  if (role === 'model') return new Set(['shared', 'model']);
  if (role === 'view') return new Set(['shared', 'model', 'view']);
  if (role === 'controller') return new Set(['shared', 'model', 'controller']);
  return MVC_ROLES;
}

function roleForbiddenCapabilities(entry) {
  if (entry.mvcRole === 'model') return MODEL_FORBIDDEN_CAPABILITIES;
  if (entry.mvcRole === 'view') return VIEW_FORBIDDEN_CAPABILITIES;
  if (entry.mvcRole === 'controller') return CONTROLLER_FORBIDDEN_CAPABILITIES;
  if (entry.mvcRole === 'composition') return COMPOSITION_FORBIDDEN_CAPABILITIES;
  return null;
}

function compatibilityAllowsCapability(entry, capability) {
  const compatibility = entry.compatibility;
  if (!compatibility
    || !Array.isArray(compatibility.allowedCapabilities)
    || !compatibility.allowedCapabilities.includes(capability)) return false;
  if (compatibility.kind === MVC_GLOBAL_MIRROR_KIND) {
    return capability === 'global.read' || capability === 'global.write';
  }
  if (compatibility.kind === MVC_COMPATIBILITY_COMPOSER_KIND) {
    return COMPATIBILITY_COMPOSER_ALLOWED_CAPABILITIES.has(capability);
  }
  if (compatibility.kind === MVC_CONTROLLER_STATE_WRITER_KIND) {
    return capability === 'state.write';
  }
  return false;
}

function ownershipPrefixesFor(entry) {
  if (entry.mvcRole === 'adapter') return ADAPTER_OWNERSHIP_PREFIXES[entry.adapterDirection] || [];
  if (entry.mvcRole === 'composition'
    && entry.compatibility
    && entry.compatibility.kind === MVC_COMPATIBILITY_COMPOSER_KIND) {
    return ['compatibility.composition.'];
  }
  return MVC_ROLE_OWNERSHIP_PREFIXES[entry.mvcRole] || [];
}

function domainsOverlap(left, right) {
  return left === right || left.startsWith(`${right}.`) || right.startsWith(`${left}.`);
}

function createMvcViolation(code, message, details = {}) {
  return {
    severity: 'error',
    code,
    message,
    ...details
  };
}

function analyzeKernelMvcArchitecture(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const manifest = readKernelSourceManifest(rootDir, options.manifest);
  const entries = normalizeKernelSourceEntries(manifest);
  const entryById = new Map();
  const sourceOwnerByPath = new Map();
  const providerOwners = new Map();
  const ownershipOwners = new Map();
  const violations = [];
  const sources = options.sources || {};

  if (manifest.schema !== RMT_KERNEL_SOURCE_MANIFEST_SCHEMA) {
    violations.push(createMvcViolation(
      'xtend.rmt.kernel_mvc.source_manifest_schema',
      `Kernel source manifest must use ${RMT_KERNEL_SOURCE_MANIFEST_SCHEMA}.`,
      { actual: manifest.schema || null }
    ));
  }
  if (!manifest.architecture || manifest.architecture.pattern !== 'mvc' || manifest.architecture.strict !== true) {
    violations.push(createMvcViolation(
      'xtend.rmt.kernel_mvc.strict_required',
      'Kernel source manifests must enable the strict MVC architecture gate.',
      { architecture: manifest.architecture || null }
    ));
  }

  entries.forEach((entry) => {
    if (!entry.id || !entry.sourcePath || !entry.sourceMode || !entry.mvcRole) {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.entry_incomplete', 'Kernel source entry is missing a required field.', { moduleId: entry.id || null }));
      return;
    }
    if (entryById.has(entry.id)) {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.duplicate_module', `Kernel module ${entry.id} is declared more than once.`, { moduleId: entry.id }));
    }
    entryById.set(entry.id, entry);
    if (sourceOwnerByPath.has(entry.sourcePath) && sourceOwnerByPath.get(entry.sourcePath) !== entry.id) {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.mixed_role', `Canonical source ${entry.sourcePath} is assigned to multiple MVC modules or roles.`, { moduleId: entry.id, sourcePath: entry.sourcePath, owners: [sourceOwnerByPath.get(entry.sourcePath), entry.id] }));
    } else sourceOwnerByPath.set(entry.sourcePath, entry.id);
    if (!MVC_ROLES.has(entry.mvcRole)) {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.role_invalid', `Kernel module ${entry.id} has invalid MVC role ${entry.mvcRole}.`, { moduleId: entry.id, mvcRole: entry.mvcRole }));
    }
    if (!MVC_SOURCE_MODES.has(entry.sourceMode)) {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.source_mode_invalid', `Kernel module ${entry.id} has invalid source mode ${entry.sourceMode}.`, { moduleId: entry.id, sourceMode: entry.sourceMode }));
    }
    if (entry.mvcRole === 'adapter' && !ADAPTER_DIRECTIONS.has(entry.adapterDirection)) {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.adapter_direction_missing', `Kernel adapter ${entry.id} requires input, output or host direction.`, { moduleId: entry.id }));
    }
    if (entry.mvcRole !== 'adapter' && entry.adapterDirection !== null) {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.adapter_direction_forbidden', `Non-adapter module ${entry.id} cannot declare adapter direction ${entry.adapterDirection}.`, { moduleId: entry.id, mvcRole: entry.mvcRole, adapterDirection: entry.adapterDirection }));
    }
    if (['adapter', 'controller', 'composition'].includes(entry.mvcRole) && entry.ports.length === 0) {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.port_missing', `MVC ${entry.mvcRole} module ${entry.id} requires at least one typed port.`, { moduleId: entry.id, mvcRole: entry.mvcRole }));
    }
    if (entry.ownershipDomains.length === 0) {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.ownership_missing', `Kernel module ${entry.id} requires an ownership domain.`, { moduleId: entry.id, mvcRole: entry.mvcRole }));
    }
    const ownershipPrefixes = ownershipPrefixesFor(entry);
    entry.ownershipDomains.forEach((domain) => {
      if (ownershipPrefixes.length > 0 && !ownershipPrefixes.some((prefix) => domain.startsWith(prefix))) {
        violations.push(createMvcViolation('xtend.rmt.kernel_mvc.ownership_role', `Ownership domain ${domain} does not match ${entry.mvcRole}${entry.adapterDirection ? `/${entry.adapterDirection}` : ''}.`, { moduleId: entry.id, mvcRole: entry.mvcRole, adapterDirection: entry.adapterDirection, domain }));
      }
    });
    if (entry.mvcRole === 'composition' && !entry.compatibility && (entry.dependsOn.length === 0 || entry.ports.length === 0)) {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.composition_root_invalid', `Composition root ${entry.id} must wire declared dependencies through typed ports.`, { moduleId: entry.id, dependsOn: entry.dependsOn, ports: entry.ports }));
    }
    if (entry.compatibility) {
      const compatibility = entry.compatibility;
      const validKind = compatibility.kind === MVC_COMPATIBILITY_COMPOSER_KIND
        ? entry.mvcRole === 'composition'
        : compatibility.kind === MVC_GLOBAL_MIRROR_KIND
          ? entry.mvcRole !== 'composition'
          : compatibility.kind === MVC_CONTROLLER_STATE_WRITER_KIND && entry.mvcRole === 'controller';
      if (!validKind
        || compatibility.since !== MVC_COMPATIBILITY_SINCE
        || compatibility.removeBy !== MVC_COMPATIBILITY_REMOVE_BY
        || typeof compatibility.reason !== 'string'
        || compatibility.reason.trim().length < 20
        || compatibility.allowedCapabilities.length === 0
        || (compatibility.kind === MVC_COMPATIBILITY_COMPOSER_KIND
          && (entry.dependsOn.length === 0 || entry.ports.length === 0))) {
        violations.push(createMvcViolation('xtend.rmt.kernel_mvc.compatibility_invalid', `Kernel module ${entry.id} has an invalid or unbounded MVC compatibility exception.`, { moduleId: entry.id, mvcRole: entry.mvcRole, compatibility }));
      }
      compatibility.allowedCapabilities.forEach((capability) => {
        if (!MVC_CAPABILITIES.has(capability) || !entry.capabilities.includes(capability)) {
          violations.push(createMvcViolation('xtend.rmt.kernel_mvc.compatibility_capability_invalid', `Compatibility exception on ${entry.id} allows undeclared capability ${capability}.`, { moduleId: entry.id, capability }));
        }
        if (compatibility.kind === MVC_GLOBAL_MIRROR_KIND && !['global.read', 'global.write'].includes(capability)) {
          violations.push(createMvcViolation('xtend.rmt.kernel_mvc.compatibility_capability_invalid', `Global mirror exception on ${entry.id} can only allow global.read/global.write.`, { moduleId: entry.id, capability }));
        }
        if (compatibility.kind === MVC_COMPATIBILITY_COMPOSER_KIND && !COMPATIBILITY_COMPOSER_ALLOWED_CAPABILITIES.has(capability)) {
          violations.push(createMvcViolation('xtend.rmt.kernel_mvc.compatibility_capability_invalid', `Compatibility composer ${entry.id} can only observe Model snapshots or maintain the temporary 0.6 global factory mirror.`, { moduleId: entry.id, capability }));
        }
        if (compatibility.kind === MVC_CONTROLLER_STATE_WRITER_KIND && capability !== 'state.write') {
          violations.push(createMvcViolation('xtend.rmt.kernel_mvc.compatibility_capability_invalid', `Controller state-writer compatibility on ${entry.id} can only allow state.write.`, { moduleId: entry.id, capability }));
        }
      });
    }
    if (entry.compatibilityShell) {
      const shell = entry.compatibilityShell;
      if (shell.kind !== MVC_GLOBAL_MIRROR_KIND
        || shell.since !== MVC_COMPATIBILITY_SINCE
        || shell.removeBy !== MVC_COMPATIBILITY_REMOVE_BY
        || typeof shell.reason !== 'string'
        || shell.reason.trim().length < 20) {
        violations.push(createMvcViolation('xtend.rmt.kernel_mvc.compatibility_shell_invalid', `Kernel module ${entry.id} has an invalid or unbounded MVC compatibility shell.`, { moduleId: entry.id, mvcRole: entry.mvcRole, compatibilityShell: shell }));
      }
    }
    entry.capabilities.forEach((capability) => {
      if (!MVC_CAPABILITIES.has(capability)) {
        violations.push(createMvcViolation('xtend.rmt.kernel_mvc.capability_invalid', `Kernel module ${entry.id} declares unknown capability ${capability}.`, { moduleId: entry.id, capability }));
      }
    });
    const forbiddenDeclared = roleForbiddenCapabilities(entry);
    if (forbiddenDeclared) {
      entry.capabilities.filter((capability) => forbiddenDeclared.has(capability) && !compatibilityAllowsCapability(entry, capability)).forEach((capability) => {
        violations.push(createMvcViolation('xtend.rmt.kernel_mvc.role_capability_declared', `MVC ${entry.mvcRole} module ${entry.id} cannot declare ${capability}.`, { moduleId: entry.id, mvcRole: entry.mvcRole, capability }));
      });
    }
    if (entry.mvcRole === 'adapter' && ADAPTER_DIRECTIONS.has(entry.adapterDirection)) {
      const forbiddenDirection = ADAPTER_DIRECTION_FORBIDDEN_CAPABILITIES[entry.adapterDirection];
      entry.capabilities.filter((capability) => (
        forbiddenDirection.has(capability) && !compatibilityAllowsCapability(entry, capability)
      )).forEach((capability) => {
        violations.push(createMvcViolation('xtend.rmt.kernel_mvc.adapter_capability_direction', `Adapter ${entry.id} direction ${entry.adapterDirection} cannot declare ${capability}.`, { moduleId: entry.id, adapterDirection: entry.adapterDirection, capability }));
      });
    }
    if (entry.mvcRole === 'composition') {
      const mixedCapabilities = entry.capabilities.filter((capability) => (
        COMPOSITION_FORBIDDEN_CAPABILITIES.has(capability)
        && !compatibilityAllowsCapability(entry, capability)
      ));
      if (mixedCapabilities.length > 0) {
        violations.push(createMvcViolation('xtend.rmt.kernel_mvc.mixed_role', `Composition module ${entry.id} contains Fach-, View- or Host-capabilities instead of wiring ports only.`, { moduleId: entry.id, capabilities: mixedCapabilities }));
      }
    }
    entry.provides.forEach((provider) => {
      if (providerOwners.has(provider) && providerOwners.get(provider) !== entry.id) {
        violations.push(createMvcViolation('xtend.rmt.kernel_mvc.duplicate_provider', `Provider ${provider} is owned by multiple modules.`, { provider, owners: [providerOwners.get(provider), entry.id] }));
      } else providerOwners.set(provider, entry.id);
    });
    entry.ownershipDomains.forEach((domain) => {
      const conflict = Array.from(ownershipOwners.entries()).find(([ownedDomain, owner]) => owner !== entry.id && domainsOverlap(domain, ownedDomain));
      if (conflict) {
        violations.push(createMvcViolation('xtend.rmt.kernel_mvc.ownership_conflict', `Ownership domain ${domain} overlaps ${conflict[0]}.`, { domain, conflictingDomain: conflict[0], owners: [conflict[1], entry.id] }));
      } else ownershipOwners.set(domain, entry.id);
    });
  });

  const generatedArtifactPaths = new Set(KERNEL_ANALYSIS_TARGETS.map((target) => target.path));
  entries.filter((entry) => entry.sourceMode === 'canonical').forEach((entry) => {
    if (generatedArtifactPaths.has(entry.sourcePath)) {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.canonical_output_cycle', `Generated artifact ${entry.sourcePath} cannot be a canonical source.`, { moduleId: entry.id, sourcePath: entry.sourcePath }));
    }
  });
  const packageSource = options.manifest ? null : maybeReadText(rootDir, 'xtendrmt/package.json');
  if (packageSource !== null) {
    const packageManifest = parseJsonSource(packageSource, 'xtendrmt/package.json');
    const canonicalPaths = new Set(entries.filter((entry) => entry.sourceMode === 'canonical').map((entry) => entry.sourcePath));
    const publicSources = Array.from(new Set(Object.values(packageManifest.exports || {})
      .map((value) => typeof value === 'string' ? value : value && value.default)
      .filter((value) => typeof value === 'string' && value.endsWith('.js'))
      .map((value) => `xtendrmt/${value.replace(/^\.\//u, '')}`)))
      .filter((sourcePath) => !generatedArtifactPaths.has(sourcePath));
    publicSources.filter((sourcePath) => !canonicalPaths.has(sourcePath)).forEach((sourcePath) => {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.public_source_uninventoried', `Public RMT source ${sourcePath} is not inventoried in the kernel source manifest.`, { sourcePath }));
    });
  }

  entries.forEach((entry) => {
    entry.dependsOn.forEach((dependencyId) => {
      const dependency = entryById.get(dependencyId);
      if (!dependency) {
        violations.push(createMvcViolation('xtend.rmt.kernel_mvc.dependency_missing', `Kernel module ${entry.id} depends on unknown module ${dependencyId}.`, { moduleId: entry.id, dependencyId }));
        return;
      }
      if (!allowedDependencyRoles(entry.mvcRole).has(dependency.mvcRole)) {
        violations.push(createMvcViolation('xtend.rmt.kernel_mvc.layer_edge', `MVC layer edge ${entry.mvcRole} -> ${dependency.mvcRole} is not allowed.`, { moduleId: entry.id, dependencyId, mvcRole: entry.mvcRole, dependencyRole: dependency.mvcRole }));
      }
    });
    if (entry.sourceMode !== 'canonical') return;
    const source = Object.prototype.hasOwnProperty.call(sources, entry.sourcePath)
      ? sources[entry.sourcePath]
      : maybeReadText(rootDir, entry.sourcePath);
    if (source === null || typeof source === 'undefined') {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.source_missing', `Canonical kernel source ${entry.sourcePath} is missing.`, { moduleId: entry.id, sourcePath: entry.sourcePath }));
      entry.observedCapabilities = [];
      entry.sourceSha256 = null;
      return;
    }
    const compatibilityShell = extractCompatibilityShell(source);
    if (entry.compatibilityShell && (compatibilityShell.segmentCount === 0 || compatibilityShell.malformed)) {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.compatibility_shell_invalid', `Kernel module ${entry.id} declares a compatibility shell without balanced source markers.`, { moduleId: entry.id, sourcePath: entry.sourcePath, segmentCount: compatibilityShell.segmentCount, malformed: compatibilityShell.malformed }));
    }
    if (!entry.compatibilityShell && compatibilityShell.segmentCount > 0) {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.compatibility_shell_undeclared', `Kernel module ${entry.id} contains an undeclared compatibility shell.`, { moduleId: entry.id, sourcePath: entry.sourcePath, segmentCount: compatibilityShell.segmentCount }));
    }
    entry.observedCompatibilityCapabilities = compatibilityShell.segmentCount > 0
      ? detectObservedCapabilities(compatibilityShell.shellSource)
      : [];
    const illegalShellCapabilities = entry.observedCompatibilityCapabilities.filter((capability) => !['global.read', 'global.write'].includes(capability));
    if (illegalShellCapabilities.length > 0) {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.compatibility_shell_capability', `Compatibility shell on ${entry.id} contains capabilities beyond the 0.6 global mirror.`, { moduleId: entry.id, sourcePath: entry.sourcePath, capabilities: illegalShellCapabilities }));
    }
    entry.observedCapabilities = detectObservedCapabilities(compatibilityShell.coreSource);
    entry.observedConcreteViewDescriptor = detectsConcreteViewDescriptor(compatibilityShell.coreSource);
    entry.sourceSha256 = sha256(source);
    entry.provides.forEach((provider) => {
      if (!sourceProvidesSymbol(source, provider)) {
        violations.push(createMvcViolation('xtend.rmt.kernel_mvc.provider_missing', `Declared provider ${provider} is not exported by ${entry.id}.`, { moduleId: entry.id, provider, sourcePath: entry.sourcePath }));
      }
    });
    const unmanifestedProviders = extractFactories(source).filter((provider) => !entry.provides.includes(provider));
    unmanifestedProviders.forEach((provider) => {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.provider_unmanifested', `Kernel module ${entry.id} exports undeclared provider ${provider}.`, { moduleId: entry.id, provider, sourcePath: entry.sourcePath }));
    });
    entry.observedConsumes = detectAppModuleConsumes(source, entry.provides, providerOwners);
    entry.observedConsumes.forEach((provider) => {
      if (!entry.consumes.includes(provider)) {
        violations.push(createMvcViolation('xtend.rmt.kernel_mvc.consume_undeclared', `Kernel module ${entry.id} consumes undeclared provider ${provider}.`, { moduleId: entry.id, provider, sourcePath: entry.sourcePath }));
      }
      const owner = providerOwners.get(provider);
      if (owner && owner !== entry.id && !entry.dependsOn.includes(owner)) {
        violations.push(createMvcViolation('xtend.rmt.kernel_mvc.dependency_undeclared', `Kernel module ${entry.id} consumes ${provider} without depending on ${owner}.`, { moduleId: entry.id, provider, dependencyId: owner, sourcePath: entry.sourcePath }));
      }
    });
    entry.observedDependencies = detectStaticSourceDependencies(source, entry.sourcePath, sourceOwnerByPath);
    entry.observedDependencies.forEach((dependencyId) => {
      if (dependencyId !== entry.id && !entry.dependsOn.includes(dependencyId)) {
        violations.push(createMvcViolation('xtend.rmt.kernel_mvc.dependency_undeclared', `Kernel module ${entry.id} imports ${dependencyId} without declaring the dependency.`, { moduleId: entry.id, dependencyId, sourcePath: entry.sourcePath }));
      }
    });
    const declared = new Set(entry.capabilities);
    entry.observedCapabilities.forEach((capability) => {
      if (!declared.has(capability)) {
        violations.push(createMvcViolation('xtend.rmt.kernel_mvc.capability_undeclared', `Kernel module ${entry.id} uses undeclared capability ${capability}.`, { moduleId: entry.id, capability, sourcePath: entry.sourcePath }));
      }
    });
    const forbidden = roleForbiddenCapabilities(entry);
    if (forbidden) {
      entry.observedCapabilities.filter((capability) => forbidden.has(capability) && !compatibilityAllowsCapability(entry, capability)).forEach((capability) => {
        violations.push(createMvcViolation('xtend.rmt.kernel_mvc.role_capability', `MVC ${entry.mvcRole} module ${entry.id} cannot use ${capability}.`, { moduleId: entry.id, mvcRole: entry.mvcRole, capability, sourcePath: entry.sourcePath }));
      });
    }
    if (entry.mvcRole === 'controller' && entry.observedCapabilities.some((capability) => ['dom.read', 'dom.write', 'dom.trustedHtml', 'event.listen', 'event.dispatch'].includes(capability))) {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.controller_concrete_view', `Controller ${entry.id} accesses a concrete DOM or browser-event View instead of a port.`, { moduleId: entry.id, sourcePath: entry.sourcePath, capabilities: entry.observedCapabilities.filter((capability) => ['dom.read', 'dom.write', 'dom.trustedHtml', 'event.listen', 'event.dispatch'].includes(capability)) }));
    }
    if (entry.mvcRole === 'controller' && entry.observedConcreteViewDescriptor) {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.controller_concrete_view', `Controller ${entry.id} constructs a concrete tagged View descriptor instead of delegating through a presentation port.`, { moduleId: entry.id, sourcePath: entry.sourcePath, descriptorLiteral: true }));
    }
    if (entry.mvcRole === 'controller'
      && entry.observedCapabilities.includes('state.write')
      && !compatibilityAllowsCapability(entry, 'state.write')) {
      violations.push(createMvcViolation('xtend.rmt.kernel_mvc.controller_state_write', `Controller ${entry.id} mutates state directly instead of emitting operations through a Model Command port.`, { moduleId: entry.id, sourcePath: entry.sourcePath }));
    }
    if (entry.mvcRole === 'controller') {
      const concreteHostCapabilities = entry.observedCapabilities.filter((capability) => (
        ['host.clock', 'host.scheduler', 'host.abort', 'network', 'worker', 'storage', 'global.read', 'global.write'].includes(capability)
      ));
      if (concreteHostCapabilities.length > 0) {
        violations.push(createMvcViolation('xtend.rmt.kernel_mvc.controller_concrete_host', `Controller ${entry.id} accesses concrete Host APIs instead of an injected typed port.`, { moduleId: entry.id, sourcePath: entry.sourcePath, capabilities: concreteHostCapabilities }));
      }
    }
  });

  findDependencyCycles(entries).forEach((cycle) => {
    violations.push(createMvcViolation('xtend.rmt.kernel_mvc.dependency_cycle', `Kernel MVC dependency cycle detected: ${cycle.join(' -> ')}.`, { cycle }));
  });

  return {
    schema: RMT_KERNEL_MVC_REPORT_SCHEMA,
    ok: violations.length === 0,
    status: violations.length === 0 ? 'conformant' : 'blocked',
    pattern: 'mvc',
    strict: manifest.architecture && manifest.architecture.strict === true,
    sourceManifestPath: SOURCE_MANIFEST_PATH,
    moduleCount: entries.length,
    canonicalModuleCount: entries.filter((entry) => entry.sourceMode === 'canonical').length,
    legacyBundleModuleCount: entries.filter((entry) => entry.sourceMode === 'legacy-bundle').length,
    compatibilityComposerCount: entries.filter((entry) => (
      entry.compatibility && entry.compatibility.kind === MVC_COMPATIBILITY_COMPOSER_KIND
    )).length,
    globalMirrorCompatibilityCount: entries.filter((entry) => (
      entry.compatibility && entry.compatibility.kind === MVC_GLOBAL_MIRROR_KIND
    )).length + entries.filter((entry) => (
      entry.compatibilityShell && entry.compatibilityShell.kind === MVC_GLOBAL_MIRROR_KIND
    )).length,
    entries,
    violations
  };
}

function lineCount(source) {
  return String(source || '').split('\n').length;
}

function byteCount(source) {
  return Buffer.byteLength(String(source || ''), 'utf8');
}

function moduleIdFromRegisterName(registerName) {
  return String(registerName || 'module')
    .replace(/^register/u, '')
    .replace(/Module$/u, '')
    .replace(/([a-z0-9])([A-Z])/gu, '$1-$2')
    .replace(/_/gu, '-')
    .toLowerCase();
}

function extractFactories(source) {
  const factories = new Set();
  const regex = /appModules\.([A-Za-z0-9_]+)\s*=(?!=)/gu;
  let match = regex.exec(source);
  while (match) {
    factories.add(match[1]);
    match = regex.exec(source);
  }
  return Array.from(factories).sort();
}

function extractLooseFactoryCandidates(source) {
  const factories = new Set();
  const regex = /appModules\.([A-Za-z0-9_]+)\s*=/gu;
  let match = regex.exec(source);
  while (match) {
    factories.add(match[1]);
    match = regex.exec(source);
  }
  return Array.from(factories).sort();
}

function extractEsmNamedExports(source) {
  const exportMatch = String(source || '').match(/export\s+\{\s*([^}]+?)\s*\};\s*export default/u);
  if (!exportMatch) return [];
  return exportMatch[1]
    .split(',')
    .map((entry) => entry.trim().split(/\s+as\s+/u)[0].trim())
    .filter(Boolean)
    .sort();
}

function extractRegisterModules(source, artifactPath) {
  const matches = Array.from(String(source || '').matchAll(/^\(function\s+(register[A-Za-z0-9_]+)\(global\)\s*\{/gmu));
  return matches.map((match, index) => {
    const start = match.index;
    const next = matches[index + 1] ? matches[index + 1].index : -1;
    const exportStart = source.indexOf('\nconst AppModules =', start);
    const end = next >= 0 ? next : (exportStart >= 0 ? exportStart : source.length);
    const moduleSource = source.slice(start, end);
    const factories = extractFactories(moduleSource);
    const legacyAliases = factories.filter((factoryName) => (
      factoryName.includes(DEPRECATED_BRAND_NAME) || factoryName.startsWith(DEPRECATED_GETTER_PREFIX)
    ));
    const droppedSymbols = DASHBOARD_SYMBOLS.filter((symbol) => moduleSource.includes(symbol));

    return {
      order: index + 1,
      id: moduleIdFromRegisterName(match[1]),
      registerName: match[1],
      artifactPath,
      classification: droppedSymbols.length > 0 ? 'drop' : 'keep',
      byteCount: byteCount(moduleSource),
      lineCount: lineCount(moduleSource),
      factories,
      publicExports: factories.filter((factoryName) => !legacyAliases.includes(factoryName)),
      legacyAliases,
      droppedSymbols
    };
  });
}

function lineNumberAt(source, index) {
  return String(source || '').slice(0, Math.max(Number(index) || 0, 0)).split('\n').length;
}

function findRedundantFactoryResolution(source, artifactPath) {
  const entries = [];
  const regex = /resolveFactory\('([A-Za-z0-9_]+)',\s*([^)\n]+?)\)\s*\n\s*\|\|\s*resolveFactory\('\1',\s*\2\)/gu;
  let match = regex.exec(String(source || ''));
  while (match) {
    entries.push({
      artifactPath,
      line: lineNumberAt(source, match.index),
      factoryName: match[1],
      dependencyExpression: match[2].trim(),
      pattern: 'duplicate-resolveFactory'
    });
    match = regex.exec(String(source || ''));
  }
  return entries;
}

function findRedundantFallbacks(source, artifactPath) {
  const text = String(source || '');
  const entries = [];
  const factoryFallbackRegex = /(\|\|\s*\(typeof appModules\.([A-Za-z0-9_]+) === 'function'\s*\?\s*appModules\.\2\(\{[\s\S]*?\}\)\s*:\s*null\))\s*\n\s*\1/gu;
  let factoryMatch = factoryFallbackRegex.exec(text);
  while (factoryMatch) {
    entries.push({
      artifactPath,
      line: lineNumberAt(text, factoryMatch.index),
      factoryName: factoryMatch[2],
      pattern: 'duplicate-factory-fallback'
    });
    factoryMatch = factoryFallbackRegex.exec(text);
  }

  const typeofFallbackRegex = /(typeof appModules\.([A-Za-z0-9_]+) === 'function')\s*\n\s*\|\|\s*\1/gu;
  let typeofMatch = typeofFallbackRegex.exec(text);
  while (typeofMatch) {
    entries.push({
      artifactPath,
      line: lineNumberAt(text, typeofMatch.index),
      factoryName: typeofMatch[2],
      pattern: 'duplicate-typeof-fallback'
    });
    typeofMatch = typeofFallbackRegex.exec(text);
  }

  return entries.sort((left, right) => (
    left.artifactPath.localeCompare(right.artifactPath)
    || left.line - right.line
    || left.factoryName.localeCompare(right.factoryName)
  ));
}

function findFactoryAttributionWarnings(source, artifactPath) {
  return extractRegisterModules(source, artifactPath)
    .flatMap((moduleEntry) => {
      const moduleStart = String(source || '').indexOf(`(function ${moduleEntry.registerName}(global)`);
      const nextModuleStart = moduleStart >= 0
        ? String(source || '').indexOf('\n(function register', moduleStart + 1)
        : -1;
      const exportStart = moduleStart >= 0 ? String(source || '').indexOf('\nconst AppModules =', moduleStart) : -1;
      const moduleEnd = nextModuleStart >= 0
        ? nextModuleStart
        : (exportStart >= 0 ? exportStart : String(source || '').length);
      const moduleSource = moduleStart >= 0 ? String(source || '').slice(moduleStart, moduleEnd) : '';
      const strictFactories = extractFactories(moduleSource);
      const looseOnly = extractLooseFactoryCandidates(moduleSource)
        .filter((factoryName) => !strictFactories.includes(factoryName));
      return looseOnly.map((factoryName) => ({
        artifactPath,
        moduleId: moduleEntry.id,
        registerName: moduleEntry.registerName,
        factoryName,
        pattern: 'comparison-was-not-attributed-as-factory'
      }));
    })
    .sort((left, right) => (
      left.artifactPath.localeCompare(right.artifactPath)
      || left.moduleId.localeCompare(right.moduleId)
      || left.factoryName.localeCompare(right.factoryName)
    ));
}

function findFunctionEnd(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  const text = String(source || '');
  for (let index = openIndex; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function extractModuleSections(source, artifactPath) {
  const text = String(source || '');
  const matches = Array.from(text.matchAll(/\/\* modules\/([^*]+?) \*\/\n/g));
  const exportStart = text.indexOf('\nconst AppModules =');
  return matches.map((match, index) => {
    const nextStart = matches[index + 1] ? matches[index + 1].index : -1;
    const end = nextStart >= 0 ? nextStart : (exportStart >= 0 ? exportStart : text.length);
    return {
      artifactPath,
      moduleId: moduleIdFromRegisterName(match[1].replace(/\.js$/u, 'Module')),
      modulePath: match[1],
      start: match.index,
      source: text.slice(match.index, end)
    };
  });
}

function normalizeFunctionBodyForHash(source) {
  return String(source || '')
    .replace(/\/\/[^\n]*/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

function findDuplicateFunctionBodies(source, artifactPath, options = {}) {
  const minBytes = Number.isFinite(options.minBytes) ? options.minBytes : 32;
  const maxGroups = Number.isFinite(options.maxGroups) ? options.maxGroups : 30;
  const groups = new Map();

  extractModuleSections(source, artifactPath).forEach((section) => {
    const regex = /\bfunction\s+([A-Za-z0-9_$]+)\s*\([^)]*\)\s*\{/gu;
    let match = regex.exec(section.source);
    while (match) {
      const openIndex = section.source.indexOf('{', match.index);
      const endIndex = findFunctionEnd(section.source, openIndex);
      if (endIndex >= 0) {
        const functionSource = section.source.slice(match.index, endIndex);
        const bytes = byteCount(functionSource);
        if (bytes >= minBytes) {
          const hash = sha256(normalizeFunctionBodyForHash(functionSource));
          if (!groups.has(hash)) groups.set(hash, []);
          groups.get(hash).push({
            artifactPath,
            moduleId: section.modulePath.replace(/\.js$/u, ''),
            functionName: match[1],
            line: lineNumberAt(source, section.start + match.index),
            byteCount: bytes
          });
        }
        regex.lastIndex = match.index + 1;
      }
      match = regex.exec(section.source);
    }
  });

  return Array.from(groups.entries())
    .filter(([, entries]) => entries.length > 1)
    .map(([hash, entries]) => ({
      hash,
      count: entries.length,
      byteCount: entries[0].byteCount,
      estimatedRepeatedBytes: entries[0].byteCount * (entries.length - 1),
      entries
    }))
    .sort((left, right) => (
      right.estimatedRepeatedBytes - left.estimatedRepeatedBytes
      || left.entries[0].functionName.localeCompare(right.entries[0].functionName)
    ))
    .slice(0, maxGroups);
}

function createKernelOptimizationReport(rootDir, contentsByPath = {}) {
  const canonicalDuplicateTarget = KERNEL_ANALYSIS_TARGETS.find((target) => target.path === 'xtendrmt/rmt-core.esm.js');
  const jsTargets = KERNEL_ANALYSIS_TARGETS.filter((target) => target.kind === 'esm' || target.kind === 'browser');
  const readTargetSource = (target) => (
    Object.prototype.hasOwnProperty.call(contentsByPath, target.path)
      ? contentsByPath[target.path]
      : maybeReadText(rootDir, target.path)
  ) || '';
  const redundantFallbacks = jsTargets.flatMap((target) => findRedundantFallbacks(readTargetSource(target), target.path));
  const redundantFactoryResolution = jsTargets.flatMap((target) => findRedundantFactoryResolution(readTargetSource(target), target.path));
  const factoryAttributionWarnings = jsTargets.flatMap((target) => findFactoryAttributionWarnings(readTargetSource(target), target.path));
  const duplicateFunctionBodies = canonicalDuplicateTarget
    ? findDuplicateFunctionBodies(readTargetSource(canonicalDuplicateTarget), canonicalDuplicateTarget.path)
    : [];

  return {
    schema: RMT_KERNEL_OPTIMIZATION_REPORT_SCHEMA,
    profile: DEFAULT_PROFILE,
    redundantFallbacks,
    redundantFactoryResolution,
    duplicateFunctionBodies,
    factoryAttributionWarnings,
    summary: {
      redundantFallbackCount: redundantFallbacks.length,
      redundantFactoryResolutionCount: redundantFactoryResolution.length,
      duplicateFunctionBodyGroupCount: duplicateFunctionBodies.length,
      factoryAttributionWarningCount: factoryAttributionWarnings.length,
      estimatedDuplicateFunctionBytes: duplicateFunctionBodies.reduce((total, group) => total + group.estimatedRepeatedBytes, 0)
    }
  };
}

function findDashboardSymbols(source) {
  return DASHBOARD_SYMBOLS.filter((symbol) => String(source || '').includes(symbol));
}

function normalizeDeprecatedKernelBranding(source) {
  return DEPRECATED_BRANDING_REPLACEMENTS.reduce(
    (next, replacement) => next.replace(replacement.from, replacement.to),
    String(source || '')
  );
}

function findDeprecatedKernelBranding(source) {
  const text = String(source || '');
  return [
    DEPRECATED_BRAND_NAME,
    DEPRECATED_BRAND_CAMEL,
    DEPRECATED_BRAND_KEBAB,
    DEPRECATED_BRAND_LOWER
  ].filter((token) => text.includes(token));
}

function normalizeJsComments(source) {
  return JS_COMMENT_REPLACEMENTS.reduce((next, replacement) => (
    next.split(`// ${replacement.from}`).join(`// ${replacement.to}`)
  ), String(source || ''));
}

function uniqueValues(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
}

function toPublicReportSymbols(symbols) {
  return uniqueValues((Array.isArray(symbols) ? symbols : [])
    .map((symbol) => normalizeDeprecatedKernelBranding(symbol))
    .filter((symbol) => findDeprecatedKernelBranding(symbol).length === 0))
    .sort();
}

function removeDeprecatedAliasAssignments(source) {
  const deprecatedAssignmentPattern = new RegExp(
    `\\n    appModules\\.(?:${DEPRECATED_GETTER_PREFIX}|${DEPRECATED_FACTORY_PREFIX}|${DEPRECATED_INSTALL_PREFIX})[A-Za-z0-9_]*\\s*=\\s*function\\s+(?:${DEPRECATED_GETTER_PREFIX}|${DEPRECATED_FACTORY_PREFIX}|${DEPRECATED_INSTALL_PREFIX})[A-Za-z0-9_]*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n    \\};`,
    'gu'
  );
  const deprecatedDirectAliasPattern = new RegExp(
    `\\n    appModules\\.${DEPRECATED_FACTORY_PREFIX}[A-Za-z0-9_]*\\s*=\\s*appModules\\.createRmt[A-Za-z0-9_]*;\\s*`,
    'gu'
  );
  const deprecatedAliasBackfillPattern = new RegExp(
    `\\n    \\[\\n        \\['createRmtCore', '${DEPRECATED_FACTORY_PREFIX}Core'\\][\\s\\S]*?\\n    \\]\\.forEach\\(\\(\\[aliasName, legacyName\\]\\) => \\{[\\s\\S]*?\\n    \\}\\);\\n`,
    'u'
  );

  return String(source || '')
    .replace(deprecatedAssignmentPattern, (block) => (
      /return\s+appModules\.(?:getRmt|createRmt|installRmt)/u.test(block) ? '' : block
    ))
    .replace(deprecatedDirectAliasPattern, '\n')
    .replace(deprecatedAliasBackfillPattern, '\n');
}

function removeDeprecatedProductSurfaceCompatibility(source) {
  return String(source || '')
    .replace(/\n    const LEGACY_GLOBAL_NAME = '[^']+';\n/u, '\n')
    .replace(
      /\n        if \(deps\.installLegacyAlias !== false\) \{\n            writeNestedGlobal\(windowTarget, LEGACY_GLOBAL_NAME, productSurface\);\n        \}/u,
      ''
    )
    .replace(
      /\n            legacyCompatibility: Object\.freeze\(\{[\s\S]*?\n            \}\),\n(?=\s{12}migrationPolicy:)/u,
      '\n'
    );
}

function removeDeprecatedTypeDeclarations(source) {
  return String(source || '')
    .replace(
      new RegExp(`\\n/\\*\\* @deprecated[^\\n]*\\*/\\nexport declare function (?:${DEPRECATED_GETTER_PREFIX}|${DEPRECATED_FACTORY_PREFIX})[^\\n]*;\\n`, 'gu'),
      '\n'
    )
    .replace(
      new RegExp(`\\n/\\*\\* @deprecated[^\\n]*\\*/\\nexport declare function ${DEPRECATED_INSTALL_PREFIX}ProductSurface\\(\\n[\\s\\S]*?\\n\\): RmtProductSurface;\\n`, 'u'),
      '\n'
    )
    .replace(
      new RegExp(`\\n/\\*\\* @deprecated[^\\n]*\\*/\\nexport type ${DEPRECATED_BRAND_NAME}LegacyCompatibility = RmtLegacyCompatibility;\\n`, 'u'),
      '\n'
    )
    .replace(/\nexport interface RmtLegacyCompatibility \{[\s\S]*?\n\}\n(?=\nexport interface RmtProductManifest)/u, '\n')
    .replace(/\n    legacyCompatibility: RmtLegacyCompatibility;/u, '')
    .replace(/; installLegacyAlias\?: boolean/gu, '');
}

function normalizeDeprecatedManifestValue(value) {
  if (typeof value === 'string') return normalizeDeprecatedKernelBranding(value);
  if (Array.isArray(value)) return value.map((entry) => normalizeDeprecatedManifestValue(entry));
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).reduce((record, key) => {
    record[key] = normalizeDeprecatedManifestValue(value[key]);
    return record;
  }, {});
}

function normalizeKernelVersion(value) {
  const version = String(value || '').trim();
  return version || null;
}

function isValidKernelVersion(value) {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u.test(String(value || '').trim());
}

function extractKernelVersionFromManifestSource(source) {
  try {
    const manifest = JSON.parse(String(source || '{}'));
    return normalizeKernelVersion(manifest.version) || normalizeKernelVersion(manifest.apiVersion);
  } catch (error) {
    return null;
  }
}

function extractKernelVersionFromJsSource(source) {
  const publicApiMatch = String(source || '').match(/\bconst\s+PUBLIC_API_VERSION\s*=\s*['"]([^'"]+)['"]\s*;/u);
  if (publicApiMatch) return normalizeKernelVersion(publicApiMatch[1]);
  const headerMatch = String(source || '').match(/^\s*\*\s+XTendRMT\s+([^\s]+)/mu);
  return headerMatch ? normalizeKernelVersion(headerMatch[1]) : null;
}

function resolveKernelVersion(rootDir, requestedVersion) {
  const requested = normalizeKernelVersion(requestedVersion);
  if (requested) {
    if (!isValidKernelVersion(requested)) {
      return {
        ok: false,
        version: requested,
        source: 'flag',
        diagnostics: [{
          severity: 'error',
          code: 'xtend.rmt.kernel_lab.invalid_version',
          message: `KernelLab version "${requested}" is invalid. Use semantic versions such as "0.6.0".`,
          version: requested
        }]
      };
    }
    return {
      ok: true,
      version: requested,
      source: 'flag',
      diagnostics: []
    };
  }

  const manifestVersion = extractKernelVersionFromManifestSource(maybeReadText(rootDir, 'xtendrmt/rmt-manifest.json'));
  if (manifestVersion) {
    return {
      ok: true,
      version: manifestVersion,
      source: 'manifest',
      diagnostics: []
    };
  }

  const runtimeVersion = extractKernelVersionFromJsSource(maybeReadText(rootDir, 'xtendrmt/rmt-core.esm.js'));
  if (runtimeVersion) {
    return {
      ok: true,
      version: runtimeVersion,
      source: 'runtime',
      diagnostics: []
    };
  }

  return {
    ok: true,
    version: DEFAULT_KERNEL_VERSION,
    source: 'default',
    diagnostics: [{
      severity: 'warning',
      code: 'xtend.rmt.kernel_lab.version_defaulted',
      message: `KernelLab could not infer a kernel version and defaulted to ${DEFAULT_KERNEL_VERSION}.`
    }]
  };
}

function resolveKernelSourceVersion(rootDir, requestedVersion) {
  const requested = normalizeKernelVersion(requestedVersion);
  if (requested) {
    if (!isValidKernelVersion(requested)) {
      return {
        ok: false,
        version: requested,
        source: 'flag',
        diagnostics: [{
          severity: 'error',
          code: 'xtend.rmt.kernel_lab.invalid_version',
          message: `KernelLab version "${requested}" is invalid. Use semantic versions such as "0.6.0".`,
          version: requested
        }]
      };
    }
    return { ok: true, version: requested, source: 'flag', diagnostics: [] };
  }

  const packageSource = maybeReadText(rootDir, 'xtendrmt/package.json');
  if (packageSource !== null) {
    try {
      const packageVersion = normalizeKernelVersion(JSON.parse(packageSource).version);
      if (packageVersion && isValidKernelVersion(packageVersion)) {
        return { ok: true, version: packageVersion, source: 'source-package', diagnostics: [] };
      }
    } catch (_) {
      // The source-artifact report below provides one stable fail-closed diagnostic.
    }
  }

  return {
    ok: false,
    version: DEFAULT_KERNEL_VERSION,
    source: 'source-package',
    diagnostics: [{
      severity: 'error',
      code: 'xtend.rmt.kernel_lab.source_version_missing',
      message: 'KernelLab source assembly requires a valid version in xtendrmt/package.json.'
    }]
  };
}

function buildProvenance(version) {
  const normalizedVersion = normalizeKernelVersion(version);
  return normalizedVersion
    ? `${KERNEL_LAB_BUILD_COMMAND_BASE} --version ${normalizedVersion}`
    : KERNEL_LAB_BUILD_COMMAND_BASE;
}

function normalizeJsBuildHeader(source, version) {
  const text = String(source || '');
  const normalizedHeader = normalizeKernelVersion(version)
    ? text.replace(/^(\s*\*\s+XTendRMT\s+)[^\n]+/mu, `$1${version}`)
    : text;
  const replacement = `$1 * generated by: ${buildProvenance(version)}\n$2`;
  const normalized = normalizedHeader.replace(
    /^(\/\*![\s\S]*?\n \* format: [^\n]+\n) \* generated (?:at|by): [^\n]+\n( \*\/)/u,
    replacement
  );
  if (normalized !== normalizedHeader) return normalized;
  return normalizedHeader.replace(
    /^(\/\*![\s\S]*?\n \* format: [^\n]+\n)( \*\/)/u,
    `$1 * generated by: ${buildProvenance(version)}\n$2`
  );
}

function normalizeJsRuntimeVersion(source, version) {
  const normalizedVersion = normalizeKernelVersion(version);
  if (!normalizedVersion) return String(source || '');
  return String(source || '')
    .replace(/\bconst\s+PUBLIC_API_VERSION\s*=\s*['"][^'"]+['"]\s*;/gu, `const PUBLIC_API_VERSION = '${normalizedVersion}';`)
    .replace(
      /(const version = typeof AppModules\.getRmtApiVersion === 'function'\n\s*\? AppModules\.getRmtApiVersion\(\)\n\s*:\s*)["'][^"']+["'](\s*;)/u,
      `$1"${normalizedVersion}"$2`
    );
}

function collapseDuplicateFactoryFallbacks(source) {
  const regex = /(\|\|\s*\(typeof appModules\.([A-Za-z0-9_]+) === 'function'\s*\?\s*appModules\.\2\(\{[\s\S]*?\}\)\s*:\s*null\))\s*\n\s*\1/gu;
  let next = String(source || '');
  let previous = null;
  while (previous !== next) {
    previous = next;
    next = next.replace(regex, '$1');
  }
  return next;
}

function collapseDuplicateTypeofFallbacks(source) {
  return String(source || '').replace(
    /(typeof appModules\.([A-Za-z0-9_]+) === 'function')\s*\n\s*\|\|\s*\1/gu,
    '$1'
  );
}

function collapseDuplicateResolveFactoryCalls(source) {
  return String(source || '').replace(
    /(const\s+[A-Za-z0-9_$]+\s*=\s*resolveFactory\('([A-Za-z0-9_]+)',\s*([^)\n]+?)\))\s*\n\s*\|\|\s*resolveFactory\('\2',\s*\3\);/gu,
    '$1;'
  );
}

function analyzeArtifact(rootDir, target, contentsByPath = {}) {
  const source = Object.prototype.hasOwnProperty.call(contentsByPath, target.path)
    ? contentsByPath[target.path]
    : maybeReadText(rootDir, target.path);
  const exists = source !== null;
  const text = source || '';
  const modules = target.kind === 'esm' || target.kind === 'browser'
    ? extractRegisterModules(text, target.path)
    : [];

  return {
    id: target.id,
    path: target.path,
    kind: target.kind,
    exists,
    byteCount: byteCount(text),
    lineCount: lineCount(text),
    sha256: sha256(text),
    moduleCount: modules.length,
    factories: extractFactories(text),
    publicExports: extractEsmNamedExports(text),
    legacyAliases: extractFactories(text).filter((factoryName) => (
      factoryName.includes(DEPRECATED_BRAND_NAME) || factoryName.startsWith(DEPRECATED_GETTER_PREFIX)
    )),
    deprecatedBrandingCount: findDeprecatedKernelBranding(text).length,
    dashboardSymbols: findDashboardSymbols(text),
    modules
  };
}

function createKernelModuleManifest(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const contentsByPath = options.contentsByPath || {};
  const mvcReport = options.mvcReport || analyzeKernelMvcArchitecture({ rootDir });
  const sourceManifest = readKernelSourceManifest(rootDir);
  const sourceEntryById = new Map(mvcReport.entries.map((entry) => [entry.id, entry]));
  const domSources = options.domSources || {
    rendererSource: maybeReadText(rootDir, DOM_RENDERER_SOURCE_PATH) || '',
    rendererTypesSource: maybeReadText(rootDir, DOM_RENDERER_TYPES_PATH) || ''
  };
  const artifactReports = KERNEL_ANALYSIS_TARGETS.map((target) => analyzeArtifact(rootDir, target, contentsByPath));
  const optimizationReport = createKernelOptimizationReport(rootDir, contentsByPath);
  const primaryArtifact = artifactReports.find((artifact) => artifact.path === 'xtendrmt/rmt-core.esm.js') || artifactReports[0];
  const modules = primaryArtifact ? primaryArtifact.modules : [];
  const visibleModuleCount = modules.length;
  const expectedBundledModuleCount = sourceManifest.bundle && Array.isArray(sourceManifest.bundle.moduleOrder)
    ? sourceManifest.bundle.moduleOrder.length
    : 0;
  const moduleCountMatchesSource = visibleModuleCount === expectedBundledModuleCount;
  const kernelVersion = normalizeKernelVersion(options.version) || null;

  return {
    schema: RMT_KERNEL_MODULE_MANIFEST_SCHEMA,
    profile: DEFAULT_PROFILE,
    kernelVersion,
    sourceOfTruth: SOURCE_MANIFEST_PATH,
    generatedFrom: 'kernel-lab-canonical-module-sources',
    sourceManifest: {
      path: SOURCE_MANIFEST_PATH,
      schema: RMT_KERNEL_SOURCE_MANIFEST_SCHEMA,
      sha256: sha256(maybeReadText(rootDir, SOURCE_MANIFEST_PATH) || '')
    },
    architecture: {
      pattern: 'mvc',
      strict: mvcReport.strict,
      status: mvcReport.status,
      violationCount: mvcReport.violations.length,
      cycleCount: mvcReport.violations.filter((entry) => entry.code === 'xtend.rmt.kernel_mvc.dependency_cycle').length,
      ownershipConflictCount: mvcReport.violations.filter((entry) => entry.code === 'xtend.rmt.kernel_mvc.ownership_conflict').length,
      compatibilityComposerCount: mvcReport.compatibilityComposerCount,
      globalMirrorCompatibilityCount: mvcReport.globalMirrorCompatibilityCount
    },
    sourceModuleCount: mvcReport.canonicalModuleCount,
    bundledModuleCount: visibleModuleCount,
    standaloneModuleCount: mvcReport.entries.filter((entry) => entry.targets.includes('standalone')).length,
    legacyBundleModuleCount: mvcReport.legacyBundleModuleCount,
    canonicalSources: KERNEL_SOURCE_INPUTS.map((entry) => entry.path),
    domCommitSource: createDomSourceReport(domSources),
    expectedBundledModuleCount,
    expectedHistoricalModuleCount: expectedBundledModuleCount,
    visibleModuleCount,
    moduleCountMatchesSource,
    moduleCountMatchesHistory: moduleCountMatchesSource,
    moduleCountReconciliation: moduleCountMatchesSource
      ? 'visible module topology matches the canonical source manifest'
      : `visible module topology has ${visibleModuleCount} modules, canonical source manifest declares ${expectedBundledModuleCount}`,
    dashboardCleanup: {
      policy: 'removed-from-standard-kernel',
      compatibilityStubs: false,
      removedSymbols: toPublicReportSymbols(DASHBOARD_SYMBOLS)
    },
    optimizationReport,
    sourceArtifacts: artifactReports.map((artifact) => ({
      id: artifact.id,
      path: artifact.path,
      kind: artifact.kind,
      exists: artifact.exists,
      byteCount: artifact.byteCount,
      lineCount: artifact.lineCount,
      sha256: artifact.sha256,
      moduleCount: artifact.moduleCount,
      publicExports: artifact.publicExports,
      legacyAliases: [],
      deprecatedAliasCount: artifact.legacyAliases.length,
      deprecatedBrandingCount: artifact.deprecatedBrandingCount,
      dashboardSymbols: toPublicReportSymbols(artifact.dashboardSymbols)
    })),
    modules: modules.map((entry) => {
      const sourceEntry = sourceEntryById.get(entry.id) || {};
      return {
        ...entry,
        sourcePath: sourceEntry.sourcePath || entry.artifactPath,
        sourceMode: sourceEntry.sourceMode || 'legacy-bundle',
        sourceSha256: sourceEntry.sourceSha256 || null,
        mvcRole: sourceEntry.mvcRole || 'composition',
        adapterDirection: sourceEntry.adapterDirection || null,
        provides: sourceEntry.provides && sourceEntry.provides.length ? sourceEntry.provides : entry.factories,
        consumes: sourceEntry.consumes || [],
        dependsOn: sourceEntry.dependsOn || [],
        observedDependencies: sourceEntry.observedDependencies || [],
        ports: sourceEntry.ports || [],
        declaredCapabilities: sourceEntry.capabilities || [],
        observedCapabilities: sourceEntry.observedCapabilities || [],
        compatibility: sourceEntry.compatibility || null,
        ownershipDomains: sourceEntry.ownershipDomains || [],
        targets: sourceEntry.targets || ['core-esm', 'runtime-esm', 'browser'],
        legacyAliases: [],
        deprecatedAliasCount: entry.legacyAliases.length,
        droppedSymbols: toPublicReportSymbols(entry.droppedSymbols)
      };
    }),
    sourceModules: mvcReport.entries
      .filter((entry) => entry.sourceMode === 'canonical')
      .map((entry) => ({
        id: entry.id,
        sourcePath: entry.sourcePath,
        sourceMode: entry.sourceMode,
        sourceSha256: entry.sourceSha256 || null,
        mvcRole: entry.mvcRole,
        adapterDirection: entry.adapterDirection,
        provides: entry.provides,
        consumes: entry.consumes,
        dependsOn: entry.dependsOn,
        observedDependencies: entry.observedDependencies || [],
        ports: entry.ports,
        declaredCapabilities: entry.capabilities,
        observedCapabilities: entry.observedCapabilities || [],
        compatibility: entry.compatibility || null,
        ownershipDomains: entry.ownershipDomains,
        targets: entry.targets
      })),
    architectureViolations: mvcReport.violations
  };
}

function cleanJsSource(source, options = {}) {
  let next = normalizeJsRuntimeVersion(normalizeJsBuildHeader(source, options.version), options.version).replace(
    /\n    appModules\.createRmtDashboardProductRuntime = function createRmtDashboardProductRuntime\(deps = \{\}\) \{[\s\S]*?\n    \};(?=\n\}\)\(__XTENDRMT_GLOBAL__\);)/gu,
    ''
  );

  next = normalizeJsComments(next);
  next = removeDeprecatedProductSurfaceCompatibility(removeDeprecatedAliasAssignments(next));
  next = collapseDuplicateResolveFactoryCalls(collapseDuplicateTypeofFallbacks(collapseDuplicateFactoryFallbacks(next)));

  next = next
    .split('\n')
    .filter((line) => !JS_DASHBOARD_LINE_FRAGMENTS.some((fragment) => line.includes(fragment)))
    .join('\n');

  return normalizeDeprecatedKernelBranding(next);
}

function cleanTypeSource(source, options = {}) {
  const version = normalizeKernelVersion(options.version);
  const next = version
    ? String(source || '').replace(/^\/\/ XTendRMT [^\n]+ type definitions/mu, `// XTendRMT ${version} type definitions`)
    : String(source || '');
  const withoutDeprecatedTypes = removeDeprecatedTypeDeclarations(next);
  return normalizeDeprecatedKernelBranding(withoutDeprecatedTypes
    .split('\n')
    .filter((line) => !TYPE_DASHBOARD_LINE_FRAGMENTS.some((fragment) => line.includes(fragment)))
    .join('\n'));
}

function getCanonicalBundleSourceModules(sourceManifest) {
  if (!sourceManifest || !sourceManifest.bundle || !Array.isArray(sourceManifest.bundle.moduleOrder)) {
    return [];
  }
  const sourceEntryById = new Map(normalizeKernelSourceEntries(sourceManifest).map((entry) => [entry.id, entry]));
  return sourceManifest.bundle.moduleOrder.map((moduleId) => {
    if (moduleId === 'rmt-dom-descriptor-renderer') return DOM_RENDERER_MODULE_PATH;
    const entry = sourceEntryById.get(moduleId);
    if (!entry || !entry.sourcePath.startsWith('xtendrmt/kernel/')) {
      throw new Error(`Kernel public manifest cannot resolve canonical source module ${moduleId}.`);
    }
    return entry.sourcePath.slice('xtendrmt/kernel/'.length);
  });
}

function cleanManifestSource(source, options = {}) {
  const manifest = JSON.parse(String(source || '{}'));
  const version = normalizeKernelVersion(options.version);
  if (version) {
    manifest.version = version;
    manifest.apiVersion = version;
  }
  const optionalCompat = manifest.entryPoints && manifest.entryPoints.optionalCompat;
  if (optionalCompat && typeof optionalCompat === 'object') {
    delete optionalCompat.dashboardAdapter;
    delete optionalCompat.dashboardCompatBootstrap;
    delete optionalCompat.dashboardCommandCatalog;
  }

  const legacyFactories = manifest.legacyCompatibility && manifest.legacyCompatibility.appModulesFactories;
  if (legacyFactories && typeof legacyFactories === 'object') {
    delete legacyFactories.dashboardAdapter;
    delete legacyFactories.dashboardCompatBootstrap;
    delete legacyFactories.dashboardCommandCatalog;
  }
  delete manifest.legacyCompatibility;
  delete manifest.compatibilityArtifacts;
  if (manifest.schemaArtifacts && typeof manifest.schemaArtifacts === 'object') {
    delete manifest.schemaArtifacts.legacyRmtDocument;
  }
  const sourceManifest = options.sourceManifest;
  if (sourceManifest && sourceManifest.bundle && Array.isArray(sourceManifest.bundle.moduleOrder)) {
    const sourceModules = getCanonicalBundleSourceModules(sourceManifest);
    const declaredBuildTargets = manifest.entryPoints && Array.isArray(manifest.entryPoints.buildTargets)
      ? manifest.entryPoints.buildTargets
      : [];
    declaredBuildTargets.forEach((target) => {
      target.sourceModules = sourceModules.slice();
    });
    (Array.isArray(manifest.builtTargets) ? manifest.builtTargets : []).forEach((target) => {
      target.sourceModules = sourceModules.slice();
      target.sourceModuleCount = sourceModules.length;
    });
  }

  return stableJson(normalizeDeprecatedManifestValue(manifest));
}

function cleanRmtKernelArtifactContent(source, artifactPath, options = {}) {
  if (artifactPath.endsWith('.d.ts')) return cleanTypeSource(source, options);
  if (artifactPath === 'xtendrmt/rmt-manifest.json') return cleanManifestSource(source, options);
  if (artifactPath.endsWith('.js')) return cleanJsSource(source, options);
  return String(source || '');
}

function readKernelDomSources(rootDir) {
  const rendererSource = maybeReadText(rootDir, DOM_RENDERER_SOURCE_PATH);
  const rendererTypesSource = maybeReadText(rootDir, DOM_RENDERER_TYPES_PATH);
  if (rendererSource === null || rendererTypesSource === null) {
    const missing = [
      rendererSource === null ? DOM_RENDERER_SOURCE_PATH : '',
      rendererTypesSource === null ? DOM_RENDERER_TYPES_PATH : ''
    ].filter(Boolean);
    const error = new Error(`KernelLab DOM commit sources are missing: ${missing.join(', ')}`);
    error.code = 'xtend.rmt.kernel_lab.dom_source_missing';
    error.paths = missing;
    throw error;
  }
  return {
    rendererSource,
    rendererTypesSource
  };
}

function createRmtKernelLabAnalysis(input = {}) {
  const rootDir = resolveRootDir(input.rootDir);
  const versionInfo = resolveKernelVersion(rootDir, input.version);
  let mvcReport = null;
  try {
    mvcReport = analyzeKernelMvcArchitecture({ rootDir });
  } catch (error) {
    mvcReport = {
      schema: RMT_KERNEL_MVC_REPORT_SCHEMA,
      ok: false,
      status: 'blocked',
      pattern: 'mvc',
      strict: true,
      sourceManifestPath: SOURCE_MANIFEST_PATH,
      moduleCount: 0,
      canonicalModuleCount: 0,
      legacyBundleModuleCount: 0,
      entries: [],
      violations: [{
        severity: 'error',
        code: error.code || 'xtend.rmt.kernel_lab.source_manifest_invalid',
        message: error.message,
        path: error.path || SOURCE_MANIFEST_PATH
      }]
    };
  }
  let domSources = null;
  try {
    domSources = readKernelDomSources(rootDir);
  } catch (error) {
    domSources = {
      rendererSource: '',
      rendererTypesSource: ''
    };
    versionInfo.diagnostics.push({
      severity: 'error',
      code: error.code || 'xtend.rmt.kernel_lab.dom_source_missing',
      message: error.message,
      paths: error.paths || []
    });
  }
  const moduleManifest = createKernelModuleManifest({
    rootDir,
    version: versionInfo.version,
    versionSource: versionInfo.source,
    domSources,
    mvcReport
  });
  const optimizationReport = moduleManifest.optimizationReport;
  const artifacts = KERNEL_ANALYSIS_TARGETS.map((target) => analyzeArtifact(rootDir, target));
  const diagnostics = versionInfo.diagnostics.slice();
  mvcReport.violations.forEach((violation) => diagnostics.push(violation));

  if (!moduleManifest.moduleCountMatchesHistory) {
    diagnostics.push({
      severity: 'warning',
      code: 'xtend.rmt.kernel_lab.module_count_mismatch',
      message: moduleManifest.moduleCountReconciliation,
      expected: moduleManifest.expectedBundledModuleCount,
      actual: moduleManifest.visibleModuleCount
    });
  }

  artifacts.forEach((artifact) => {
    if (artifact.dashboardSymbols.length > 0) {
      diagnostics.push({
        severity: 'warning',
        code: 'xtend.rmt.kernel_lab.dashboard_symbol_present',
        message: `${artifact.path} still contains Dashboard-specific kernel symbols.`,
        path: artifact.path,
        symbols: toPublicReportSymbols(artifact.dashboardSymbols),
        matchCount: artifact.dashboardSymbols.length
      });
    }
    if (artifact.deprecatedBrandingCount > 0) {
      diagnostics.push({
        severity: 'warning',
        code: 'xtend.rmt.kernel_lab.deprecated_branding_present',
        message: `${artifact.path} still contains deprecated kernel branding.`,
        path: artifact.path,
        matchCount: artifact.deprecatedBrandingCount
      });
    }
  });

  const publicArtifacts = artifacts.map((artifact) => ({
    ...artifact,
    legacyAliases: [],
    deprecatedAliasCount: artifact.legacyAliases.length,
    dashboardSymbols: toPublicReportSymbols(artifact.dashboardSymbols),
    modules: artifact.modules.map((entry) => ({
      ...entry,
      legacyAliases: [],
      deprecatedAliasCount: entry.legacyAliases.length,
      droppedSymbols: toPublicReportSymbols(entry.droppedSymbols)
    }))
  }));

  return {
    schema: RMT_KERNEL_LAB_ANALYSIS_SCHEMA,
    ok: !diagnostics.some((diagnostic) => diagnostic.severity === 'error'),
    status: diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'analyzed',
    profile: DEFAULT_PROFILE,
    kernelVersion: versionInfo.version,
    versionSource: versionInfo.source,
    moduleManifestPath: MODULE_MANIFEST_PATH,
    expectedBundledModuleCount: moduleManifest.expectedBundledModuleCount,
    expectedHistoricalModuleCount: moduleManifest.expectedBundledModuleCount,
    visibleModuleCount: moduleManifest.visibleModuleCount,
    moduleCountMatchesHistory: moduleManifest.moduleCountMatchesHistory,
    moduleCountReconciliation: moduleManifest.moduleCountReconciliation,
    dashboardCleanupPolicy: moduleManifest.dashboardCleanup,
    optimizationReport,
    architectureReport: mvcReport,
    domSourceReport: createDomSourceReport(domSources),
    artifacts: publicArtifacts,
    moduleManifest,
    diagnostics
  };
}

function materializeKernelTemplate(source, version, buildTarget) {
  return String(source || '')
    .replace(/\{\{KERNEL_VERSION\}\}/gu, normalizeKernelVersion(version) || DEFAULT_KERNEL_VERSION)
    .replace(/\{\{KERNEL_BUILD_TARGET\}\}/gu, buildTarget);
}

function assembleCanonicalKernelJs(rootDir, target, version, sourceManifest, domSources) {
  const bundle = sourceManifest && sourceManifest.bundle;
  if (!bundle || !Array.isArray(bundle.moduleOrder)) {
    const error = new Error('Kernel source manifest requires bundle.moduleOrder and canonical shell templates.');
    error.code = 'xtend.rmt.kernel_lab.bundle_manifest_missing';
    throw error;
  }
  const browser = target.kind === 'browser';
  const preamblePath = browser ? bundle.browserPreamble : bundle.esmPreamble;
  const suffixPath = browser ? bundle.browserSuffix : bundle.esmSuffix;
  const buildTarget = target.path.split('/').pop().replace(/\.js$/u, '');
  const preamble = materializeKernelTemplate(readText(rootDir, preamblePath), version, buildTarget);
  const suffix = materializeKernelTemplate(readText(rootDir, suffixPath), version, buildTarget);
  const entryById = new Map(normalizeKernelSourceEntries(sourceManifest).map((entry) => [entry.id, entry]));
  const moduleSources = bundle.moduleOrder.map((moduleId) => {
    if (moduleId === 'rmt-dom-descriptor-renderer') {
      return createBundledRendererModule(domSources.rendererSource).trimEnd();
    }
    const entry = entryById.get(moduleId);
    if (!entry || entry.sourceMode !== 'canonical') {
      const error = new Error(`Kernel bundle module ${moduleId} has no canonical source entry.`);
      error.code = 'xtend.rmt.kernel_lab.bundle_module_source_missing';
      throw error;
    }
    const moduleSource = materializeKernelTemplate(
      readText(rootDir, entry.sourcePath),
      version,
      buildTarget
    ).trim();
    if (!moduleSource.startsWith('/* modules/') || !moduleSource.includes('(function register')) {
      const error = new Error(`Canonical kernel module ${moduleId} is not an assemblable module source.`);
      error.code = 'xtend.rmt.kernel_lab.bundle_module_invalid';
      throw error;
    }
    return moduleSource;
  });
  const canonicalSourceModules = getCanonicalBundleSourceModules(sourceManifest);
  const sourceTopology = `const __XTENDRMT_CANONICAL_SOURCE_MODULES__ = Object.freeze(${JSON.stringify(canonicalSourceModules)});\n`;
  return `${preamble}${sourceTopology}${moduleSources.join('\n\n')}\n${suffix.replace(/^\n/u, '')}`;
}

function canonicalTemplatePathForTarget(sourceManifest, target) {
  const bundle = sourceManifest && sourceManifest.bundle || {};
  if (target.kind === 'types') return bundle.typesTemplate;
  if (target.kind === 'schema') return bundle.schemaTemplate;
  if (target.kind === 'manifest') return bundle.manifestTemplate;
  return null;
}

function createDesiredCleanOutputs(rootDir, options = {}) {
  const version = normalizeKernelVersion(options.version);
  const domSources = readKernelDomSources(rootDir);
  const sourceManifest = readKernelSourceManifest(rootDir);
  const mvcReport = analyzeKernelMvcArchitecture({ rootDir, manifest: sourceManifest });
  if (mvcReport.legacyBundleModuleCount > 0) {
    const error = new Error(`KernelLab release build refuses ${mvcReport.legacyBundleModuleCount} legacy bundle module sources.`);
    error.code = 'xtend.rmt.kernel_lab.legacy_bundle_release_blocked';
    error.architectureReport = mvcReport;
    throw error;
  }
  if (!mvcReport.ok) {
    const error = new Error(`KernelLab MVC architecture gate has ${mvcReport.violations.length} violation(s).`);
    error.code = 'xtend.rmt.kernel_lab.mvc_release_blocked';
    error.architectureReport = mvcReport;
    throw error;
  }
  const contentsByPath = {};
  const outputs = KERNEL_ANALYSIS_TARGETS.map((target) => {
    const current = maybeReadText(rootDir, target.path);
    const templatePath = canonicalTemplatePathForTarget(sourceManifest, target);
    const source = target.kind === 'esm' || target.kind === 'browser'
      ? assembleCanonicalKernelJs(rootDir, target, version, sourceManifest, domSources)
      : materializeKernelTemplate(readText(rootDir, templatePath), version, target.id);
    const cleaned = cleanRmtKernelArtifactContent(source, target.path, { version, sourceManifest });
    const synchronized = synchronizeKernelArtifact(cleaned, target.path, domSources);
    const desired = target.kind === 'esm'
      ? generateEntrypoint(synchronized, target.path)
      : synchronized;
    contentsByPath[target.path] = desired;
    return {
      ...target,
      current,
      desired
    };
  });
  const moduleManifest = createKernelModuleManifest({
    rootDir,
    contentsByPath,
    version,
    versionSource: options.versionSource || null,
    domSources,
    mvcReport
  });
  outputs.push({
    id: 'rmt-kernel-module-manifest',
    path: MODULE_MANIFEST_PATH,
    kind: 'module-manifest',
    current: maybeReadText(rootDir, MODULE_MANIFEST_PATH),
    desired: stableJson(moduleManifest)
  });
  return {
    domSourceReport: createDomSourceReport(domSources),
    moduleManifest,
    outputs
  };
}

/**
 * Assemble one public Kernel artifact exclusively from the canonical source
 * manifest, canonical module sources and KernelLab shell templates.
 *
 * This intentionally does not read the current public artifact. Consumers such
 * as Maraca can therefore package a Kernel runtime even when all generated RMT
 * products are absent or corrupt.
 */
function createRmtKernelSourceArtifact(input = {}) {
  const rootDir = resolveRootDir(input.rootDir);
  const artifactPath = String(input.artifactPath || input.path || '').trim();
  const target = KERNEL_ANALYSIS_TARGETS.find((entry) => entry.path === artifactPath);
  if (!target) {
    return {
      schema: RMT_KERNEL_SOURCE_ARTIFACT_SCHEMA,
      ok: false,
      status: 'unsupported_target',
      path: artifactPath,
      content: null,
      diagnostics: [{
        severity: 'error',
        code: 'xtend.rmt.kernel_lab.source_artifact_target_unsupported',
        message: `KernelLab cannot assemble unsupported source artifact "${artifactPath}".`
      }]
    };
  }

  const versionInfo = resolveKernelSourceVersion(rootDir, input.version);
  if (!versionInfo.ok) {
    return {
      schema: RMT_KERNEL_SOURCE_ARTIFACT_SCHEMA,
      ok: false,
      status: 'invalid_version',
      path: artifactPath,
      kind: target.kind,
      kernelVersion: versionInfo.version,
      versionSource: versionInfo.source,
      content: null,
      diagnostics: versionInfo.diagnostics
    };
  }

  try {
    const sourceManifest = readKernelSourceManifest(rootDir);
    const mvcReport = analyzeKernelMvcArchitecture({ rootDir, manifest: sourceManifest });
    if (mvcReport.legacyBundleModuleCount > 0 || !mvcReport.ok) {
      return {
        schema: RMT_KERNEL_SOURCE_ARTIFACT_SCHEMA,
        ok: false,
        status: 'blocked',
        path: artifactPath,
        kind: target.kind,
        kernelVersion: versionInfo.version,
        versionSource: versionInfo.source,
        sourceManifestPath: SOURCE_MANIFEST_PATH,
        architectureReport: mvcReport,
        content: null,
        diagnostics: mvcReport.violations
      };
    }

    const domSources = readKernelDomSources(rootDir);
    const templatePath = canonicalTemplatePathForTarget(sourceManifest, target);
    const source = target.kind === 'esm' || target.kind === 'browser'
      ? assembleCanonicalKernelJs(rootDir, target, versionInfo.version, sourceManifest, domSources)
      : materializeKernelTemplate(readText(rootDir, templatePath), versionInfo.version, target.id);
    const cleaned = cleanRmtKernelArtifactContent(source, target.path, {
      version: versionInfo.version,
      sourceManifest
    });
    const synchronized = synchronizeKernelArtifact(cleaned, target.path, domSources);
    const content = target.kind === 'esm'
      ? generateEntrypoint(synchronized, target.path)
      : synchronized;
    const diagnostics = validateDomCommitArtifact(content, target.path);
    const ok = !diagnostics.some((diagnostic) => diagnostic.severity === 'error');

    return {
      schema: RMT_KERNEL_SOURCE_ARTIFACT_SCHEMA,
      ok,
      status: ok ? 'assembled' : 'failed',
      path: target.path,
      kind: target.kind,
      kernelVersion: versionInfo.version,
      versionSource: versionInfo.source,
      sourceManifestPath: SOURCE_MANIFEST_PATH,
      sourceManifestSchema: sourceManifest.schema,
      sourceModuleCount: Array.isArray(sourceManifest.bundle && sourceManifest.bundle.moduleOrder)
        ? sourceManifest.bundle.moduleOrder.length
        : 0,
      architectureReport: mvcReport,
      content,
      byteCount: byteCount(content),
      sha256: sha256(content),
      diagnostics
    };
  } catch (error) {
    return {
      schema: RMT_KERNEL_SOURCE_ARTIFACT_SCHEMA,
      ok: false,
      status: 'failed',
      path: artifactPath,
      kind: target.kind,
      kernelVersion: versionInfo.version,
      versionSource: versionInfo.source,
      sourceManifestPath: SOURCE_MANIFEST_PATH,
      content: null,
      diagnostics: [{
        severity: 'error',
        code: error.code || 'xtend.rmt.kernel_lab.source_artifact_failed',
        message: error.message,
        paths: error.paths || []
      }]
    };
  }
}

function summarizeOutput(output, mode) {
  const current = output.current == null ? null : output.current;
  const desired = output.desired;
  const changed = current !== desired;
  return {
    id: output.id,
    path: output.path,
    kind: output.kind,
    action: mode === 'write'
      ? (changed ? 'write' : 'skip')
      : mode === 'check'
        ? (changed ? 'out-of-date' : 'current')
        : 'plan',
    changed,
    byteCountBefore: current == null ? 0 : byteCount(current),
    byteCountAfter: byteCount(desired),
    sha256Before: current == null ? null : sha256(current),
    sha256After: sha256(desired)
  };
}

function validateCleanOutputs(outputSummaries, desiredOutputs) {
  const diagnostics = [];
  desiredOutputs.forEach((output) => {
    const symbols = output.kind === 'module-manifest' ? [] : findDashboardSymbols(output.desired);
    if (symbols.length > 0) {
      diagnostics.push({
        severity: 'error',
        code: 'xtend.rmt.kernel_lab.dashboard_symbol_remaining',
        message: `${output.path} still contains Dashboard-specific kernel symbols after clean transform.`,
        path: output.path,
        symbols: toPublicReportSymbols(symbols),
        matchCount: symbols.length
      });
    }
    const deprecatedBranding = findDeprecatedKernelBranding(output.desired);
    if (deprecatedBranding.length > 0) {
      diagnostics.push({
        severity: 'error',
        code: 'xtend.rmt.kernel_lab.deprecated_branding_remaining',
        message: `${output.path} still contains deprecated kernel branding after clean transform.`,
        path: output.path,
        matchCount: deprecatedBranding.length
      });
    }
    validateDomCommitArtifact(output.desired, output.path).forEach((diagnostic) => {
      diagnostics.push(diagnostic);
    });
  });

  outputSummaries.forEach((output) => {
    if (output.kind === 'module-manifest') return;
    if (output.byteCountAfter <= 0) {
      diagnostics.push({
        severity: 'error',
        code: 'xtend.rmt.kernel_lab.empty_output',
        message: `${output.path} would be empty after KernelLab build.`,
        path: output.path
      });
    }
  });

  return diagnostics;
}

function createRmtKernelLabBuild(input = {}) {
  const rootDir = resolveRootDir(input.rootDir);
  const profile = String(input.profile || DEFAULT_PROFILE).trim() || DEFAULT_PROFILE;
  const write = toBoolean(input.write);
  const check = toBoolean(input.check);
  const mode = write ? 'write' : check ? 'check' : 'plan';

  if (profile !== DEFAULT_PROFILE) {
    return {
      schema: RMT_KERNEL_LAB_BUILD_SCHEMA,
      ok: false,
      status: 'unsupported_profile',
      profile,
      diagnostics: [{
        severity: 'error',
        code: 'xtend.rmt.kernel_lab.unsupported_profile',
        message: `KernelLab profile "${profile}" is not supported. Use "clean".`
      }],
      outputs: []
    };
  }

  const versionInfo = resolveKernelVersion(rootDir, input.version);
  if (!versionInfo.ok) {
    return {
      schema: RMT_KERNEL_LAB_BUILD_SCHEMA,
      ok: false,
      status: 'invalid_version',
      profile,
      mode,
      kernelVersion: versionInfo.version,
      versionSource: versionInfo.source,
      diagnostics: versionInfo.diagnostics,
      outputs: []
    };
  }

  let desired = null;
  try {
    desired = createDesiredCleanOutputs(rootDir, {
      version: versionInfo.version,
      versionSource: versionInfo.source
    });
  } catch (error) {
    const architectureReport = error.architectureReport || null;
    const architectureDiagnostics = architectureReport && Array.isArray(architectureReport.violations)
      ? architectureReport.violations
      : [];
    return {
      schema: RMT_KERNEL_LAB_BUILD_SCHEMA,
      ok: false,
      status: architectureReport ? 'blocked' : 'failed',
      profile,
      mode,
      kernelVersion: versionInfo.version,
      versionSource: versionInfo.source,
      changedCount: 0,
      outputCount: 0,
      outputs: [],
      architectureReport,
      diagnostics: [
        ...versionInfo.diagnostics,
        {
          severity: 'error',
          code: error.code || 'xtend.rmt.kernel_lab.dom_source_invalid',
          message: error.message,
          paths: error.paths || []
        },
        ...architectureDiagnostics
      ]
    };
  }
  const outputs = desired.outputs.map((output) => summarizeOutput(output, mode));
  const validationDiagnostics = validateCleanOutputs(outputs, desired.outputs);
  const changedCount = outputs.filter((output) => output.changed).length;
  const diagnostics = versionInfo.diagnostics.slice();
  desired.moduleManifest.architectureViolations.forEach((violation) => diagnostics.push(violation));

  if (!desired.moduleManifest.moduleCountMatchesHistory) {
    diagnostics.push({
      severity: 'warning',
      code: 'xtend.rmt.kernel_lab.module_count_mismatch',
      message: desired.moduleManifest.moduleCountReconciliation,
      expected: desired.moduleManifest.expectedBundledModuleCount,
      actual: desired.moduleManifest.visibleModuleCount
    });
  }

  validationDiagnostics.forEach((diagnostic) => diagnostics.push(diagnostic));
  const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === 'error');

  if (!hasErrors && write) {
    desired.outputs.forEach((output, index) => {
      if (outputs[index].changed) {
        writeText(rootDir, output.path, output.desired);
      }
    });
  }

  const ok = !hasErrors && (!check || changedCount === 0);
  const status = hasErrors
    ? 'failed'
    : check
      ? (changedCount === 0 ? 'current' : 'out_of_date')
      : write
        ? (changedCount === 0 ? 'current' : 'written')
        : 'planned';

  return {
    schema: RMT_KERNEL_LAB_BUILD_SCHEMA,
    ok,
    status,
    profile,
    mode,
    kernelVersion: versionInfo.version,
    versionSource: versionInfo.source,
    moduleManifestPath: MODULE_MANIFEST_PATH,
    expectedBundledModuleCount: desired.moduleManifest.expectedBundledModuleCount,
    expectedHistoricalModuleCount: desired.moduleManifest.expectedBundledModuleCount,
    visibleModuleCount: desired.moduleManifest.visibleModuleCount,
    moduleCountMatchesHistory: desired.moduleManifest.moduleCountMatchesHistory,
    changedCount,
    outputCount: outputs.length,
    outputs,
    domSourceReport: desired.domSourceReport,
    moduleManifest: desired.moduleManifest,
    architectureReport: {
      schema: RMT_KERNEL_MVC_REPORT_SCHEMA,
      ok: desired.moduleManifest.architecture.violationCount === 0,
      status: desired.moduleManifest.architecture.status,
      strict: desired.moduleManifest.architecture.strict,
      sourceManifestPath: SOURCE_MANIFEST_PATH,
      canonicalModuleCount: desired.moduleManifest.sourceModuleCount,
      legacyBundleModuleCount: desired.moduleManifest.legacyBundleModuleCount,
      compatibilityComposerCount: desired.moduleManifest.architecture.compatibilityComposerCount,
      globalMirrorCompatibilityCount: desired.moduleManifest.architecture.globalMirrorCompatibilityCount,
      violations: desired.moduleManifest.architectureViolations
    },
    optimizationReport: desired.moduleManifest.optimizationReport,
    diagnostics
  };
}

function createRmtKernelLabReport(input = {}) {
  const command = String(input.command || input.subcommand || (Array.isArray(input._) ? input._[0] : '') || 'analyze').trim();
  if (command === 'analyze') return createRmtKernelLabAnalysis(input);
  if (command === 'build') return createRmtKernelLabBuild(input);
  return {
    schema: RMT_KERNEL_LAB_ANALYSIS_SCHEMA,
    ok: false,
    status: 'unknown_command',
    diagnostics: [{
      severity: 'error',
      code: 'xtend.rmt.kernel_lab.unknown_command',
      message: `Unknown KernelLab command "${command}".`
    }]
  };
}

module.exports = {
  DASHBOARD_SYMBOLS,
  KERNEL_ANALYSIS_TARGETS,
  KERNEL_BUILD_TARGETS,
  KERNEL_SOURCE_INPUTS,
  MODULE_MANIFEST_PATH,
  SOURCE_MANIFEST_PATH,
  DOM_COMMIT_RESULT_SCHEMA,
  DOM_RENDERER_FACTORY,
  DOM_RENDERER_MODULE_PATH,
  DOM_RENDERER_SCHEMA,
  RMT_KERNEL_LAB_ANALYSIS_SCHEMA,
  RMT_KERNEL_LAB_BUILD_SCHEMA,
  RMT_KERNEL_MODULE_MANIFEST_SCHEMA,
  RMT_KERNEL_SOURCE_MANIFEST_SCHEMA,
  RMT_KERNEL_SOURCE_ARTIFACT_SCHEMA,
  RMT_KERNEL_MVC_REPORT_SCHEMA,
  RMT_KERNEL_OPTIMIZATION_REPORT_SCHEMA,
  cleanRmtKernelArtifactContent,
  analyzeKernelMvcArchitecture,
  createKernelModuleManifest,
  createKernelOptimizationReport,
  createRmtKernelLabAnalysis,
  createRmtKernelLabBuild,
  createRmtKernelLabReport,
  createRmtKernelSourceArtifact,
  findDeprecatedKernelBranding
};
