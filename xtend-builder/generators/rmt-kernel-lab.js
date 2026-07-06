'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const RMT_KERNEL_LAB_ANALYSIS_SCHEMA = 'xtend.scaffold.rmt-kernel-lab.analysis.v1';
const RMT_KERNEL_LAB_BUILD_SCHEMA = 'xtend.scaffold.rmt-kernel-lab.build.v1';
const RMT_KERNEL_MODULE_MANIFEST_SCHEMA = 'xtend.rmt.kernel-module-manifest.v1';
const RMT_KERNEL_OPTIMIZATION_REPORT_SCHEMA = 'xtend.rmt.kernel-lab.optimization-report.v1';
const EXPECTED_HISTORICAL_MODULE_COUNT = 26;
const DEFAULT_PROFILE = 'clean';
const MODULE_MANIFEST_PATH = 'xtendrmt/rmt-kernel-module-manifest.json';
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
  { id: 'rmt-manifest', path: 'xtendrmt/rmt-manifest.json', kind: 'manifest' }
]);

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
  { from: new RegExp(`register${DEPRECATED_BRAND_NAME}RmtFormatModule`, 'gu'), to: 'registerRmtFormatModule' },
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
          message: `KernelLab version "${requested}" is invalid. Use semantic versions such as "0.4.0".`,
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
  const artifactReports = KERNEL_ANALYSIS_TARGETS.map((target) => analyzeArtifact(rootDir, target, contentsByPath));
  const optimizationReport = createKernelOptimizationReport(rootDir, contentsByPath);
  const primaryArtifact = artifactReports.find((artifact) => artifact.path === 'xtendrmt/rmt-core.esm.js') || artifactReports[0];
  const modules = primaryArtifact ? primaryArtifact.modules : [];
  const visibleModuleCount = modules.length;
  const moduleCountMatchesHistory = visibleModuleCount === EXPECTED_HISTORICAL_MODULE_COUNT;
  const kernelVersion = normalizeKernelVersion(options.version) || null;

  return {
    schema: RMT_KERNEL_MODULE_MANIFEST_SCHEMA,
    profile: DEFAULT_PROFILE,
    kernelVersion,
    sourceOfTruth: 'xtend-builder/generators/rmt-kernel-lab.js',
    generatedFrom: 'bundled-rmt-kernel-artifacts',
    expectedHistoricalModuleCount: EXPECTED_HISTORICAL_MODULE_COUNT,
    visibleModuleCount,
    moduleCountMatchesHistory,
    moduleCountReconciliation: moduleCountMatchesHistory
      ? 'visible module topology matches the historical module count'
      : `visible module topology has ${visibleModuleCount} modules, expected historical count is ${EXPECTED_HISTORICAL_MODULE_COUNT}`,
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
    modules: modules.map((entry) => ({
      ...entry,
      legacyAliases: [],
      deprecatedAliasCount: entry.legacyAliases.length,
      droppedSymbols: toPublicReportSymbols(entry.droppedSymbols)
    }))
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

  return stableJson(normalizeDeprecatedManifestValue(manifest));
}

function cleanRmtKernelArtifactContent(source, artifactPath, options = {}) {
  if (artifactPath.endsWith('.d.ts')) return cleanTypeSource(source, options);
  if (artifactPath === 'xtendrmt/rmt-manifest.json') return cleanManifestSource(source, options);
  if (artifactPath.endsWith('.js')) return cleanJsSource(source, options);
  return String(source || '');
}

function createRmtKernelLabAnalysis(input = {}) {
  const rootDir = resolveRootDir(input.rootDir);
  const versionInfo = resolveKernelVersion(rootDir, input.version);
  const moduleManifest = createKernelModuleManifest({
    rootDir,
    version: versionInfo.version,
    versionSource: versionInfo.source
  });
  const optimizationReport = moduleManifest.optimizationReport;
  const artifacts = KERNEL_ANALYSIS_TARGETS.map((target) => analyzeArtifact(rootDir, target));
  const diagnostics = versionInfo.diagnostics.slice();

  if (!moduleManifest.moduleCountMatchesHistory) {
    diagnostics.push({
      severity: 'warning',
      code: 'xtend.rmt.kernel_lab.module_count_mismatch',
      message: moduleManifest.moduleCountReconciliation,
      expected: EXPECTED_HISTORICAL_MODULE_COUNT,
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
    ok: true,
    status: diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'analyzed',
    profile: DEFAULT_PROFILE,
    kernelVersion: versionInfo.version,
    versionSource: versionInfo.source,
    moduleManifestPath: MODULE_MANIFEST_PATH,
    expectedHistoricalModuleCount: EXPECTED_HISTORICAL_MODULE_COUNT,
    visibleModuleCount: moduleManifest.visibleModuleCount,
    moduleCountMatchesHistory: moduleManifest.moduleCountMatchesHistory,
    moduleCountReconciliation: moduleManifest.moduleCountReconciliation,
    dashboardCleanupPolicy: moduleManifest.dashboardCleanup,
    optimizationReport,
    artifacts: publicArtifacts,
    moduleManifest,
    diagnostics
  };
}

function createDesiredCleanOutputs(rootDir, options = {}) {
  const version = normalizeKernelVersion(options.version);
  const contentsByPath = {};
  const outputs = KERNEL_ANALYSIS_TARGETS.map((target) => {
    const current = maybeReadText(rootDir, target.path);
    const source = current == null ? '' : current;
    const desired = cleanRmtKernelArtifactContent(source, target.path, { version });
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
    versionSource: options.versionSource || null
  });
  outputs.push({
    id: 'rmt-kernel-module-manifest',
    path: MODULE_MANIFEST_PATH,
    kind: 'module-manifest',
    current: maybeReadText(rootDir, MODULE_MANIFEST_PATH),
    desired: stableJson(moduleManifest)
  });
  return {
    moduleManifest,
    outputs
  };
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

  const desired = createDesiredCleanOutputs(rootDir, {
    version: versionInfo.version,
    versionSource: versionInfo.source
  });
  const outputs = desired.outputs.map((output) => summarizeOutput(output, mode));
  const validationDiagnostics = validateCleanOutputs(outputs, desired.outputs);
  const changedCount = outputs.filter((output) => output.changed).length;
  const diagnostics = versionInfo.diagnostics.slice();

  if (!desired.moduleManifest.moduleCountMatchesHistory) {
    diagnostics.push({
      severity: 'warning',
      code: 'xtend.rmt.kernel_lab.module_count_mismatch',
      message: desired.moduleManifest.moduleCountReconciliation,
      expected: EXPECTED_HISTORICAL_MODULE_COUNT,
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
    expectedHistoricalModuleCount: EXPECTED_HISTORICAL_MODULE_COUNT,
    visibleModuleCount: desired.moduleManifest.visibleModuleCount,
    moduleCountMatchesHistory: desired.moduleManifest.moduleCountMatchesHistory,
    changedCount,
    outputCount: outputs.length,
    outputs,
    moduleManifest: desired.moduleManifest,
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
  MODULE_MANIFEST_PATH,
  RMT_KERNEL_LAB_ANALYSIS_SCHEMA,
  RMT_KERNEL_LAB_BUILD_SCHEMA,
  RMT_KERNEL_MODULE_MANIFEST_SCHEMA,
  RMT_KERNEL_OPTIMIZATION_REPORT_SCHEMA,
  cleanRmtKernelArtifactContent,
  createKernelModuleManifest,
  createKernelOptimizationReport,
  createRmtKernelLabAnalysis,
  createRmtKernelLabBuild,
  createRmtKernelLabReport,
  findDeprecatedKernelBranding
};
