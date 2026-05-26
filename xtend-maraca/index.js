const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MARACA_PACKAGE_SCHEMA = 'xtend.maraca.package-metadata.v1';
const MARACA_BUILD_PLAN_SCHEMA = 'xtend.maraca.build-plan.v1';
const MARACA_BUNDLE_REPORT_SCHEMA = 'xtend.maraca.bundle-report.v1';
const MARACA_SIZE_BUDGET_REPORT_SCHEMA = 'xtend.maraca.size-budget-report.v1';

const DEFAULT_SOURCE = 'tests/rmt-language/fixtures/maraca-known-components.rmt';
const DEFAULT_OUT_DIR = '.xtend-build/maraca/app';
const VALID_PROFILES = new Set(['debug', 'production', 'max']);
const VALID_LAZY_MODES = new Set(['route', 'component', 'none']);
const VALID_CSS_MODES = new Set(['inline', 'external']);
const VALID_COMPONENT_MODES = new Set(['document', 'all']);
const VALID_STACK_MODES = new Set(['plan', 'runtime', 'full', 'none']);
const COMPONENT_UNKNOWN_CODE = 'xtend.maraca.component_unknown';
const COMPONENT_DYNAMIC_CODE = 'xtend.maraca.dynamic_component_requires_opt_in';
const COMPILER_ERROR_CODE = 'xtend.maraca.rmt_compile_failed';
const XTEND_VENDOR_STACK_MODULES = Object.freeze([
  'api.js',
  'xtendrmt/rmt-core.esm.js',
  'xtendrmt/rmt-runtime.esm.js',
  'xtendrmt/rmt-dom-descriptor-renderer.js',
  'xtendrmt/rmt-action-effect-runtime.js',
  'xtendrmt/rmt-event-routing-runtime.js',
  'xtendrmt/rmt-state-selector-runtime.js',
  'xtendrmt/rmt-surface-resource-graph-runtime.js',
  'xtendrmt/rmt-component-capability-registry.js',
  'xtendrmt/rmt-native-shell-runtime.js',
  'fabric/xtend-fabric.js',
  'fabric/rmt-lane-mapping.js',
  'fabric/hydration-policy.js'
]);
const PUBLIC_NAME_RESERVATIONS = Object.freeze([
  'XTendMaraca',
  'XTendLoader',
  'XTendRMT',
  'XTendFabric',
  'ensureMaracaComponent',
  'bootXtendMaraca',
  'MARACA_COMPONENTS',
  'MARACA_SURFACES',
  'MARACA_EVENTS',
  'MARACA_PUBLIC_NAMES',
  'MARACA_STACK_MODULES',
  'customElements',
  'HTMLElement',
  'ShadowRoot',
  'CSSStyleSheet',
  'IntersectionObserver',
  'connectedCallback',
  'disconnectedCallback',
  'attributeChangedCallback',
  'adoptedCallback',
  'observedAttributes',
  'data-maraca-root',
  'data-maraca-surface',
  'data-rmt-component',
  'part',
  'slot',
  'tone',
  'variant',
  'disabled',
  'open',
  'value',
  'change',
  'input',
  'click',
  'submit',
  'xtend.rmt.core-format.vnext.v1',
  MARACA_BUILD_PLAN_SCHEMA,
  MARACA_BUNDLE_REPORT_SCHEMA,
  MARACA_SIZE_BUDGET_REPORT_SCHEMA
]);

function resolveRootDir(rootDir) {
  return path.resolve(rootDir || process.cwd());
}

function toPosix(value) {
  return String(value).split(path.sep).join('/');
}

function repoRelative(filePath, rootDir) {
  const relative = path.relative(rootDir, filePath);
  return toPosix(relative || '.');
}

function ensureRelativeImport(fromDir, targetPath) {
  const relative = toPosix(path.relative(fromDir, targetPath));
  return relative.startsWith('.') ? relative : `./${relative}`;
}

function stableJson(value) {
  return JSON.stringify(value, null, 2);
}

function hashText(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function toBoolean(value) {
  if (value === true || value === false) return value;
  if (value === undefined || value === null) return false;
  const normalized = String(value).toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function toVendorBoolean(value) {
  if (value === true) return true;
  if (value === undefined || value === null || value === false) return false;
  return ['1', 'true', 'yes', 'all', 'xtend', 'vendor'].includes(String(value).toLowerCase());
}

function normalizeInput(input) {
  if (typeof input === 'string') return { source: input };
  return input && typeof input === 'object' ? { ...input } : {};
}

function normalizeOptions(input = {}, options = {}) {
  const values = normalizeInput(input);
  const rootDir = resolveRootDir(options.rootDir || values.rootDir);
  const positionalSource = Array.isArray(values._) && values._[0] ? values._[0] : null;
  const source = values.source || values.src || values.app || positionalSource || DEFAULT_SOURCE;
  const sourcePath = path.resolve(rootDir, source);
  const outDirValue = values.out || values.outDir || values.output || DEFAULT_OUT_DIR;
  const outputDir = path.resolve(rootDir, outDirValue);
  const profile = VALID_PROFILES.has(values.profile) ? values.profile : 'production';
  const lazy = VALID_LAZY_MODES.has(values.lazy) ? values.lazy : 'route';
  const css = VALID_CSS_MODES.has(values.css) ? values.css : 'inline';
  const vendor = toVendorBoolean(values.vendor || values['vendor-version']);
  const requestedComponentMode = values.components || values.componentMode || values['component-mode'];
  const componentMode = VALID_COMPONENT_MODES.has(requestedComponentMode)
    ? requestedComponentMode
    : (vendor ? 'all' : 'document');
  const requestedStackMode = values.stack || values.stackMode || values['stack-mode'];
  const stackMode = VALID_STACK_MODES.has(requestedStackMode)
    ? requestedStackMode
    : (vendor ? 'full' : 'plan');
  const allowDynamicComponents = toBoolean(
    values.allowDynamicComponents !== undefined
      ? values.allowDynamicComponents
      : values['allow-dynamic-components']
  );

  return {
    rootDir,
    source,
    sourcePath,
    outputDir,
    profile,
    lazy,
    css,
    vendor,
    componentMode,
    stackMode,
    json: toBoolean(values.json),
    allowDynamicComponents
  };
}

function requireOptional(request, baseDir) {
  try {
    const resolved = require.resolve(request, { paths: [baseDir || process.cwd(), __dirname] });
    const mod = require(resolved);
    let version = null;
    try {
      const packagePath = require.resolve(`${request}/package.json`, { paths: [baseDir || process.cwd(), __dirname] });
      version = require(packagePath).version || null;
    } catch (_) {}
    return { available: true, module: mod, version, resolved };
  } catch (error) {
    return { available: false, error: error && error.message };
  }
}

function getMaracaToolchainAvailability(rootDir = process.cwd()) {
  const rollup = requireOptional('rollup', rootDir);
  const terser = requireOptional('terser', rootDir);
  return {
    rollup: {
      requested: true,
      available: rollup.available,
      version: rollup.version || null,
      mode: rollup.available ? 'rollup-js-api' : 'local-esm-importgraph-fallback'
    },
    terser: {
      requested: true,
      available: terser.available,
      version: terser.version || null,
      mode: terser.available ? 'terser-js-api' : 'local-minifier-fallback'
    }
  };
}

function loadVNextCompiler(rootDir) {
  const localPath = path.join(rootDir, 'tools', 'rmt-language', 'vnext-compiler.js');
  if (fs.existsSync(localPath)) {
    return require(localPath);
  }
  return require('@ccslabs/xtend-compiler/rmt-language/vnext-compiler');
}

function compileSource(options) {
  const sourceText = fs.readFileSync(options.sourcePath, 'utf8');
  const compiler = loadVNextCompiler(options.rootDir);
  return {
    sourceText,
    compileResult: compiler.compileRmtVNextSource({
      text: sourceText,
      filePath: options.sourcePath
    })
  };
}

function loadComponentManifest(rootDir) {
  const manifestPath = path.join(rootDir, 'components', 'manifest.json');
  const manifest = readJson(manifestPath);
  const entries = Object.keys(manifest).sort().map((tag) => {
    const module = manifest[tag];
    const absolutePath = path.resolve(path.dirname(manifestPath), module);
    return {
      tag,
      module,
      absolutePath,
      source: repoRelative(absolutePath, rootDir)
    };
  });
  return {
    manifestPath,
    entries,
    byTag: new Map(entries.map((entry) => [entry.tag, entry]))
  };
}

function collectSurfaces(coreDocument) {
  const appSurfaces = coreDocument && coreDocument.appPlatform && Array.isArray(coreDocument.appPlatform.surfaces)
    ? coreDocument.appPlatform.surfaces
    : [];
  const coreSurfaces = coreDocument && Array.isArray(coreDocument.surfaces)
    ? coreDocument.surfaces
    : [];
  const merged = new Map();

  coreSurfaces.forEach((surface) => {
    const id = surface.name || surface.id;
    if (!id) return;
    merged.set(id, {
      id,
      coreId: surface.id || id,
      kind: surface.kind || 'surface',
      component: surface.component || null,
      source: surface.source && (surface.source.target || surface.source.ref) || surface.source || null,
      laneRefs: Array.isArray(surface.laneRefs) ? surface.laneRefs : [],
      eventRefs: Array.isArray(surface.eventRefs) ? surface.eventRefs : [],
      bounds: surface.bounds || null,
      portal: surface.portal && (surface.portal.target || surface.portal.ref) || surface.portal || null,
      key: surface.key || null
    });
  });

  appSurfaces.forEach((surface) => {
    const id = surface.id || surface.name;
    if (!id) return;
    const existing = merged.get(id) || {};
    merged.set(id, {
      ...existing,
      id,
      coreId: existing.coreId || id,
      kind: surface.kind || existing.kind || 'surface',
      component: surface.component || existing.component || null,
      source: surface.source || existing.source || null,
      laneRefs: existing.laneRefs || [],
      eventRefs: Array.isArray(surface.events) ? surface.events : existing.eventRefs || [],
      bounds: surface.bounds || existing.bounds || null,
      portal: surface.portal || existing.portal || null,
      key: surface.key || existing.key || null,
      resources: Array.isArray(surface.resources) ? surface.resources : []
    });
  });

  return Array.from(merged.values());
}

function collectInitialState(coreDocument) {
  const map = {};
  const states = Array.isArray(coreDocument && coreDocument.states) ? coreDocument.states : [];
  states.forEach((state) => {
    const key = state.name || state.id;
    if (!key) return;
    map[key] = state.initial && typeof state.initial === 'object' ? state.initial : {};
  });
  return map;
}

function collectEvents(coreDocument) {
  const events = Array.isArray(coreDocument && coreDocument.events) ? coreDocument.events : [];
  return events.map((event) => ({
    id: event.id || null,
    type: event.type || event.name || null,
    action: event.action || null,
    surface: event.scope && event.scope.surface || null,
    selector: event.selector || null
  }));
}

function collectLanes(coreDocument) {
  const lanes = Array.isArray(coreDocument && coreDocument.lanes) ? coreDocument.lanes : [];
  return lanes.map((lane) => ({
    id: lane.id || null,
    name: lane.name || null,
    weight: lane.weight || 0,
    operations: Array.isArray(lane.operationRefs) ? lane.operationRefs : []
  }));
}

function collectRequiredTags(surfaces) {
  const tags = new Set();
  surfaces.forEach((surface) => {
    if (surface.component && typeof surface.component === 'string') {
      tags.add(surface.component);
    }
  });
  return Array.from(tags).sort();
}

function collectRequestedTags(surfaces, componentManifest, options) {
  if (options.componentMode === 'all') {
    return componentManifest.entries.map((entry) => entry.tag).sort();
  }
  return collectRequiredTags(surfaces);
}

function isPotentialDynamicTag(tag) {
  return typeof tag === 'string' && (tag.includes('{') || tag.includes('*') || tag.includes('$'));
}

function createComponentRecords(requiredTags, componentManifest, options) {
  const selected = [];
  const unknown = [];
  const diagnostics = [];

  requiredTags.forEach((tag) => {
    const known = componentManifest.byTag.get(tag);
    if (known) {
      selected.push({
        tag,
        module: known.module,
        absolutePath: known.absolutePath,
        source: known.source,
        known: true
      });
      return;
    }

    unknown.push(tag);
    diagnostics.push({
      code: isPotentialDynamicTag(tag) ? COMPONENT_DYNAMIC_CODE : COMPONENT_UNKNOWN_CODE,
      severity: options.allowDynamicComponents ? 'warning' : 'error',
      tag,
      message: options.allowDynamicComponents
        ? `Component tag "${tag}" is not in the static XTend component registry and will need a host adapter.`
        : `Component tag "${tag}" is not in components/manifest.json. Pass --allow-dynamic-components only when the host supplies it.`
    });
  });

  return { selected, unknown, diagnostics };
}

function buildRuntimeModuleList(coreDocument) {
  const modules = new Set([
    'xtendrmt/rmt-runtime.esm.js',
    'xtendrmt/rmt-dom-descriptor-renderer.js'
  ]);
  const hasActions = Array.isArray(coreDocument && coreDocument.actions) && coreDocument.actions.length > 0;
  const hasEvents = Array.isArray(coreDocument && coreDocument.events) && coreDocument.events.length > 0;
  const hasSelectors = Array.isArray(coreDocument && coreDocument.selectors) && coreDocument.selectors.length > 0;
  if (hasActions) modules.add('xtendrmt/rmt-action-effect-runtime.js');
  if (hasEvents) modules.add('xtendrmt/rmt-event-routing-runtime.js');
  if (hasSelectors) modules.add('xtendrmt/rmt-state-selector-runtime.js');
  return Array.from(modules).sort();
}

function resolveStackModuleRecords(runtimeModules, options) {
  let moduleIds = [];
  if (options.stackMode === 'runtime') {
    moduleIds = runtimeModules;
  } else if (options.stackMode === 'full') {
    moduleIds = XTEND_VENDOR_STACK_MODULES;
  }

  return Array.from(new Set(moduleIds)).sort().map((moduleId) => ({
    id: moduleId,
    source: moduleId,
    absolutePath: path.resolve(options.rootDir, moduleId)
  })).filter((entry) => fs.existsSync(entry.absolutePath));
}

function createMaracaBuildPlan(input = {}, options = {}) {
  const normalized = normalizeOptions(input, options);
  const diagnostics = [];

  if (!fs.existsSync(normalized.sourcePath)) {
    return {
      schema: MARACA_BUILD_PLAN_SCHEMA,
      ok: false,
      status: 'source_missing',
      source: normalized.source,
      sourcePath: normalized.sourcePath,
      rootDir: normalized.rootDir,
      profile: normalized.profile,
      lazy: normalized.lazy,
      css: normalized.css,
      vendor: normalized.vendor,
      componentMode: normalized.componentMode,
      stackMode: normalized.stackMode,
      outputDir: normalized.outputDir,
      diagnostics: [{
        code: 'xtend.maraca.source_missing',
        severity: 'error',
        message: `RMT source not found: ${normalized.sourcePath}`
      }],
      toolchain: getMaracaToolchainAvailability(normalized.rootDir),
      components: { requiredTags: [], selected: [], unknown: [] },
      surfaces: [],
      events: [],
      lanes: [],
      runtimeModules: [],
      stackModules: [],
      publicNameReservations: Array.from(PUBLIC_NAME_RESERVATIONS)
    };
  }

  const { sourceText, compileResult } = compileSource(normalized);
  if (!compileResult.ok || !compileResult.coreDocument) {
    const compilerDiagnostics = Array.isArray(compileResult.diagnostics) ? compileResult.diagnostics : [];
    return {
      schema: MARACA_BUILD_PLAN_SCHEMA,
      ok: false,
      status: 'compile_failed',
      source: repoRelative(normalized.sourcePath, normalized.rootDir),
      sourcePath: normalized.sourcePath,
      rootDir: normalized.rootDir,
      sourceHash: hashText(sourceText),
      profile: normalized.profile,
      lazy: normalized.lazy,
      css: normalized.css,
      vendor: normalized.vendor,
      componentMode: normalized.componentMode,
      stackMode: normalized.stackMode,
      outputDir: normalized.outputDir,
      diagnostics: [{
        code: COMPILER_ERROR_CODE,
        severity: 'error',
        message: 'RMT vNext compiler did not produce a Core document.'
      }].concat(compilerDiagnostics),
      toolchain: getMaracaToolchainAvailability(normalized.rootDir),
      components: { requiredTags: [], selected: [], unknown: [] },
      surfaces: [],
      events: [],
      lanes: [],
      runtimeModules: [],
      stackModules: [],
      publicNameReservations: Array.from(PUBLIC_NAME_RESERVATIONS)
    };
  }

  const coreDocument = compileResult.coreDocument;
  const componentManifest = loadComponentManifest(normalized.rootDir);
  const surfaces = collectSurfaces(coreDocument);
  const requiredTags = collectRequestedTags(surfaces, componentManifest, normalized);
  const componentRecords = createComponentRecords(requiredTags, componentManifest, normalized);
  diagnostics.push(...componentRecords.diagnostics);

  const ok = diagnostics.every((diagnostic) => diagnostic.severity !== 'error');
  const runtimeModules = buildRuntimeModuleList(coreDocument);
  const stackModules = resolveStackModuleRecords(runtimeModules, normalized);
  const selectedWithPolicy = componentRecords.selected.map((entry) => ({
    ...entry,
    lazy: normalized.lazy !== 'none',
    sideEffectBoundary: 'selected-component-module'
  }));

  return {
    schema: MARACA_BUILD_PLAN_SCHEMA,
    ok,
    status: ok ? 'planned' : 'blocked',
    source: repoRelative(normalized.sourcePath, normalized.rootDir),
    sourcePath: normalized.sourcePath,
    rootDir: normalized.rootDir,
    sourceHash: hashText(sourceText),
    profile: normalized.profile,
    lazy: normalized.lazy,
    css: normalized.css,
    vendor: normalized.vendor,
    componentMode: normalized.componentMode,
    stackMode: normalized.stackMode,
    outputDir: normalized.outputDir,
    diagnostics,
    toolchain: getMaracaToolchainAvailability(normalized.rootDir),
    loader: {
      mode: 'inline-registry',
      usesExternalManifest: false,
      usesXtendLoader: false,
      manifestParseAtRuntime: false
    },
    rmt: {
      compilerSchema: compileResult.schema || null,
      coreSchema: coreDocument.schema || null,
      documentId: coreDocument.manifest && coreDocument.manifest.documentId || null,
      artifactCount: Number(compileResult.artifactCount || 0)
    },
    components: {
      requiredTags,
      selected: selectedWithPolicy,
      unknown: componentRecords.unknown,
      allowDynamicComponents: normalized.allowDynamicComponents
    },
    surfaces,
    events: collectEvents(coreDocument),
    lanes: collectLanes(coreDocument),
    state: collectInitialState(coreDocument),
    runtimeModules,
    stackModules,
    stack: {
      mode: normalized.stackMode,
      included: stackModules.map((entry) => entry.source),
      fullStackAvailable: Array.from(XTEND_VENDOR_STACK_MODULES)
    },
    fabric: {
      lanes: collectLanes(coreDocument).map((lane) => lane.name).filter(Boolean),
      laneMapping: 'xtend.fabric.rmt-lane-mapping.v1'
    },
    outputs: {
      entry: path.join(normalized.outputDir, 'xtend.maraca.mjs'),
      css: normalized.css === 'external' ? path.join(normalized.outputDir, 'xtend.maraca.css') : null,
      bundleReport: path.join(normalized.outputDir, 'xtend.maraca.report.json'),
      sizeBudgetReport: path.join(normalized.outputDir, 'xtend.maraca.size.json')
    },
    publicNameReservations: Array.from(PUBLIC_NAME_RESERVATIONS),
    propertyMangling: {
      profile: normalized.profile,
      enabled: normalized.profile === 'max',
      mode: normalized.profile === 'max' ? 'private-only-with-public-reservations' : 'disabled',
      reserved: Array.from(PUBLIC_NAME_RESERVATIONS)
    }
  };
}

function jsValue(value) {
  return JSON.stringify(value, null, 2);
}

function createCssText() {
  return [
    ':where([data-maraca-root]){display:grid;gap:12px;align-content:start;font-family:system-ui,sans-serif;}',
    ':where([data-maraca-surface]){box-sizing:border-box;}'
  ].join('');
}

function createBundleSource(plan) {
  const outDir = plan.outputDir;
  const stackEntries = (plan.stackModules || []).map((entry) => ({
    id: entry.id || entry.source,
    module: ensureRelativeImport(outDir, entry.absolutePath)
  }));
  const componentEntries = plan.components.selected.map((entry) => ({
    tag: entry.tag,
    module: ensureRelativeImport(outDir, entry.absolutePath)
  }));
  const surfaces = plan.surfaces.map((surface) => ({
    id: surface.id,
    kind: surface.kind,
    component: surface.component,
    source: surface.source,
    bounds: surface.bounds,
    portal: surface.portal,
    events: surface.eventRefs || []
  }));
  const css = createCssText();
  const header = [
    `const MARACA_COMPONENTS = Object.freeze(${jsValue(componentEntries)});`,
    `const MARACA_SURFACES = Object.freeze(${jsValue(surfaces)});`,
    `const MARACA_STATE = Object.freeze(${jsValue(plan.state || {})});`,
    `const MARACA_EVENTS = Object.freeze(${jsValue(plan.events || [])});`,
    `const MARACA_PUBLIC_NAMES = Object.freeze(${jsValue(plan.publicNameReservations)});`,
    `const MARACA_STACK_MODULES = Object.freeze(${jsValue(stackEntries)});`,
    `const MARACA_LAZY_MODE = ${JSON.stringify(plan.lazy)};`
  ];

  stackEntries.forEach((entry) => {
    header.unshift(`import "${entry.module}";`);
  });

  if (plan.lazy === 'none') {
    componentEntries.forEach((entry) => {
      header.unshift(`import "${entry.module}";`);
    });
    header.push('const MARACA_IMPORTERS = Object.freeze(Object.fromEntries(MARACA_COMPONENTS.map((entry) => [entry.tag, () => Promise.resolve(entry.module)])));');
  } else {
    const importers = componentEntries
      .map((entry) => `  ${JSON.stringify(entry.tag)}: () => import(${JSON.stringify(entry.module)})`)
      .join(',\n');
    header.push(`const MARACA_IMPORTERS = Object.freeze({\n${importers}\n});`);
  }

  if (plan.css === 'inline') {
    header.push(`const MARACA_CSS_TEXT = ${JSON.stringify(css)};`);
  } else {
    header.push('const MARACA_CSS_HREF = new URL("./xtend.maraca.css", import.meta.url).href;');
  }

  return `${header.join('\n')}

const MARACA_SCHEMA = ${JSON.stringify(MARACA_BUNDLE_REPORT_SCHEMA)};

function attachMaracaCss(root) {
  if (typeof document === "undefined") return;
  if (${JSON.stringify(plan.css)} === "inline") {
    if (document.querySelector("style[data-maraca-style]")) return;
    const style = document.createElement("style");
    style.setAttribute("data-maraca-style", "inline");
    style.textContent = MARACA_CSS_TEXT;
    (document.head || root || document.documentElement).appendChild(style);
    return;
  }
  if (document.querySelector("link[data-maraca-style]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = MARACA_CSS_HREF;
  link.setAttribute("data-maraca-style", "external");
  (document.head || root || document.documentElement).appendChild(link);
}

async function ensureMaracaComponent(tag) {
  const load = MARACA_IMPORTERS[tag];
  if (!load) {
    throw new Error("XTend Maraca has no inline registry entry for " + tag);
  }
  await load();
  return tag;
}

async function ensureMaracaComponents(tags) {
  const uniqueTags = Array.from(new Set((tags || []).filter(Boolean)));
  if (uniqueTags.length === 0) return [];
  const loaded = [];
  for (const tag of uniqueTags) {
    loaded.push(await ensureMaracaComponent(tag));
  }
  return loaded;
}

function stateForSurface(surface) {
  if (!surface || !surface.source) return {};
  return MARACA_STATE[surface.source] || {};
}

function createSurfaceElement(surface) {
  const tag = surface.component || "section";
  const element = document.createElement(tag);
  element.setAttribute("data-maraca-surface", surface.id || tag);
  element.setAttribute("data-rmt-component", tag);
  const state = stateForSurface(surface);
  if (state.id) element.id = String(state.id);
  if (state.tone) element.setAttribute("tone", String(state.tone));
  if (state.text) element.textContent = String(state.text);
  if (surface.kind) element.setAttribute("data-maraca-kind", String(surface.kind));
  return element;
}

function resolveLazyStrategy(options) {
  if (MARACA_LAZY_MODE === "none") return "eager";
  const requested = options.lazyStrategy || options.lazy || "viewport";
  if (requested === "eager" || requested === "immediate") return "eager";
  if (requested === "viewport" && typeof IntersectionObserver === "function") return "viewport";
  return "eager";
}

function dispatchMaracaEvent(name, detail) {
  if (typeof window === "undefined" || typeof CustomEvent !== "function") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function observeViewportComponents(surfaceEntries, options = {}) {
  const observed = [];
  const loadingTags = new Set();
  const observer = new IntersectionObserver((records) => {
    records.forEach((record) => {
      if (!record.isIntersecting && record.intersectionRatio <= 0) return;
      observer.unobserve(record.target);
      const tag = record.target && record.target.getAttribute("data-rmt-component");
      if (!tag || loadingTags.has(tag)) return;
      loadingTags.add(tag);
      ensureMaracaComponent(tag)
        .then(() => dispatchMaracaEvent("xtend-maraca:component-load", {
          tag,
          strategy: "viewport"
        }))
        .catch((error) => dispatchMaracaEvent("xtend-maraca:component-error", {
          tag,
          message: error && error.message ? error.message : String(error)
        }));
    });
  }, {
    root: options.viewportRoot || null,
    rootMargin: options.rootMargin || "160px",
    threshold: options.threshold === undefined ? 0 : options.threshold
  });

  surfaceEntries.forEach((entry) => {
    if (!entry || !entry.element || !entry.surface || !entry.surface.component) return;
    observer.observe(entry.element);
    observed.push(entry.surface.component);
  });

  return {
    strategy: "viewport",
    observedTags: Array.from(new Set(observed)),
    observedCount: observed.length,
    observer
  };
}

async function bootXtendMaraca(options = {}) {
  if (typeof document === "undefined") {
    return { ok: false, status: "no_document", schema: MARACA_SCHEMA };
  }
  const root = options.root || document.querySelector("[data-maraca-root]") || document.getElementById("xtend-maraca-root") || document.body;
  attachMaracaCss(root);
  const fragment = document.createDocumentFragment();
  const surfaceEntries = MARACA_SURFACES.map((surface) => {
    const element = createSurfaceElement(surface);
    fragment.appendChild(element);
    return { surface, element };
  });
  root.appendChild(fragment);
  const lazyStrategy = resolveLazyStrategy(options);
  let lazyController = null;
  if (lazyStrategy === "viewport") {
    lazyController = observeViewportComponents(surfaceEntries, options);
  } else {
    await ensureMaracaComponents(MARACA_COMPONENTS.map((entry) => entry.tag));
  }
  const result = {
    ok: true,
    status: lazyStrategy === "viewport" ? "booted_lazy" : "booted",
    schema: MARACA_SCHEMA,
    lazyStrategy,
    componentTags: MARACA_COMPONENTS.map((entry) => entry.tag),
    pendingComponentCount: lazyStrategy === "viewport" ? MARACA_COMPONENTS.length : 0,
    surfaceCount: MARACA_SURFACES.length,
    eventCount: MARACA_EVENTS.length,
    lazyObservedCount: lazyController ? lazyController.observedCount : 0,
    publicNameReservations: MARACA_PUBLIC_NAMES
  };
  window.__XTendMaracaResult = result;
  window.__XTendMaracaLazyController = lazyController;
  dispatchMaracaEvent("xtend-maraca:boot", result);
  return result;
}

const XTendMaraca = Object.freeze({
  schema: MARACA_SCHEMA,
  components: MARACA_COMPONENTS,
  surfaces: MARACA_SURFACES,
  events: MARACA_EVENTS,
  stackModules: MARACA_STACK_MODULES,
  ensureComponent: ensureMaracaComponent,
  boot: bootXtendMaraca
});

if (typeof window !== "undefined") {
  window.XTendMaraca = XTendMaraca;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => bootXtendMaraca(), { once: true });
  } else {
    bootXtendMaraca();
  }
}

export { MARACA_COMPONENTS, MARACA_SURFACES, MARACA_EVENTS, MARACA_PUBLIC_NAMES, MARACA_STACK_MODULES, ensureMaracaComponent, bootXtendMaraca };
export default XTendMaraca;
`;
}

function minifyLocalEsModule(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\n\s+/g, '\n')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const ROLLUP_VIRTUAL_ENTRY_ID = 'xtend-maraca:entry';
const ROLLUP_VIRTUAL_ENTRY_RESOLVED = '\0xtend-maraca-entry';

function createRollupVirtualEntryPlugin(plan, source) {
  return {
    name: 'xtend-maraca-virtual-entry',
    resolveId(id, importer) {
      if (id === ROLLUP_VIRTUAL_ENTRY_ID) return ROLLUP_VIRTUAL_ENTRY_RESOLVED;
      if (importer === ROLLUP_VIRTUAL_ENTRY_RESOLVED && id.startsWith('.')) {
        return path.resolve(plan.outputDir, id);
      }
      return null;
    },
    load(id) {
      if (id === ROLLUP_VIRTUAL_ENTRY_RESOLVED) return source;
      return null;
    }
  };
}

function createRollupManualChunks(plan) {
  if (plan.lazy === 'none') return undefined;
  const componentChunks = new Map(plan.components.selected.map((entry) => [
    path.resolve(entry.absolutePath),
    entry.tag.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'component'
  ]));

  return (id) => componentChunks.get(path.resolve(id)) || null;
}

function createRollupTreeshakeOptions(plan) {
  if (plan.profile === 'debug') return false;
  return {
    moduleSideEffects: true,
    propertyReadSideEffects: true,
    tryCatchDeoptimization: false,
    unknownGlobalSideEffects: true
  };
}

function createTerserOptions(plan, nameCache) {
  if (plan.profile === 'debug') return null;
  const reserved = Array.from(new Set(plan.publicNameReservations.concat([
    'XTendMaraca',
    'ensureMaracaComponent',
    'bootXtendMaraca'
  ])));
  const mangle = {
    toplevel: true,
    reserved
  };

  if (plan.profile === 'max') {
    mangle.properties = {
      regex: /^_/,
      reserved
    };
  }

  return {
    ecma: 2020,
    module: true,
    toplevel: true,
    compress: {
      module: true,
      passes: plan.profile === 'max' ? 3 : 2,
      toplevel: true,
      unsafe: false
    },
    mangle,
    format: {
      comments: false
    },
    nameCache
  };
}

async function minifyRollupChunks(plan, output, terserModule) {
  if (plan.profile === 'debug') return { output, nameCache: null };

  const nameCachePath = path.join(plan.outputDir, 'xtend.maraca.name-cache.json');
  const nameCache = plan.profile === 'max' && fs.existsSync(nameCachePath)
    ? readJson(nameCachePath)
    : {};
  const terserOptions = createTerserOptions(plan, nameCache);
  const minifiedOutput = [];

  for (const chunk of output) {
    if (chunk.type !== 'chunk') {
      minifiedOutput.push(chunk);
      continue;
    }

    const result = await terserModule.minify({ [chunk.fileName]: chunk.code }, terserOptions);
    if (!result || typeof result.code !== 'string') {
      throw new Error(`Terser did not return code for ${chunk.fileName}`);
    }
    minifiedOutput.push({
      ...chunk,
      code: result.code,
      map: null
    });
  }

  if (plan.profile === 'max') {
    writeJson(nameCachePath, nameCache);
  }

  return { output: minifiedOutput, nameCache: plan.profile === 'max' ? nameCachePath : null };
}

function writeRollupOutput(plan, output) {
  const files = [];
  output.forEach((item) => {
    const filePath = path.join(plan.outputDir, item.fileName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    if (item.type === 'asset') {
      fs.writeFileSync(filePath, item.source);
    } else {
      fs.writeFileSync(filePath, `${item.code}\n`);
      if (item.map) {
        fs.writeFileSync(`${filePath}.map`, item.map.toString());
      }
    }

    const bytes = fs.statSync(filePath).size;
    files.push({
      type: item.type,
      fileName: item.fileName,
      path: filePath,
      bytes,
      isEntry: item.type === 'chunk' && item.isEntry === true,
      isDynamicEntry: item.type === 'chunk' && item.isDynamicEntry === true,
      imports: item.type === 'chunk' ? item.imports : [],
      dynamicImports: item.type === 'chunk' ? item.dynamicImports : []
    });
  });
  return files;
}

async function createRollupBundleFiles(plan, rawSource) {
  const rootDir = plan.rootDir || path.dirname(path.dirname(__filename));
  const rollupTool = requireOptional('rollup', rootDir);
  const terserTool = requireOptional('terser', rootDir);

  if (!rollupTool.available || !terserTool.available) {
    return {
      ok: false,
      reason: 'toolchain_unavailable',
      rollup: rollupTool,
      terser: terserTool,
      files: []
    };
  }

  const warnings = [];
  const bundle = await rollupTool.module.rollup({
    input: ROLLUP_VIRTUAL_ENTRY_ID,
    plugins: [createRollupVirtualEntryPlugin(plan, rawSource)],
    treeshake: createRollupTreeshakeOptions(plan),
    onwarn(warning) {
      warnings.push({
        code: warning && warning.code || 'ROLLUP_WARNING',
        message: warning && warning.message || String(warning)
      });
    }
  });

  try {
    const generated = await bundle.generate({
      format: 'es',
      dir: plan.outputDir,
      entryFileNames: 'xtend.maraca.mjs',
      chunkFileNames: 'chunks/[name]-[hash].mjs',
      sourcemap: plan.profile === 'debug',
      manualChunks: createRollupManualChunks(plan),
      generatedCode: {
        constBindings: true,
        objectShorthand: true
      }
    });
    const minified = await minifyRollupChunks(plan, generated.output, terserTool.module);
    const files = writeRollupOutput(plan, minified.output);

    return {
      ok: true,
      reason: 'rollup-terser',
      rollup: rollupTool,
      terser: terserTool,
      files,
      warnings,
      nameCache: minified.nameCache
    };
  } finally {
    if (typeof bundle.close === 'function') {
      await bundle.close();
    }
  }
}

function createBundleReport(plan, bundleFiles, sizeBudgetReport, options = {}) {
  const repoRoot = plan.rootDir || path.dirname(path.dirname(__filename));
  const entryFile = bundleFiles.find((file) => file.isEntry) || {
    path: plan.outputs.entry,
    fileName: path.basename(plan.outputs.entry),
    bytes: fs.existsSync(plan.outputs.entry) ? fs.statSync(plan.outputs.entry).size : 0
  };
  const totalBytes = bundleFiles.reduce((sum, file) => sum + Number(file.bytes || 0), 0) || entryFile.bytes;

  return {
    schema: MARACA_BUNDLE_REPORT_SCHEMA,
    ok: true,
    status: 'built',
    source: plan.source,
    outputDir: repoRelative(plan.outputDir, repoRoot),
    profile: plan.profile,
    lazy: plan.lazy,
    css: plan.css,
    vendor: plan.vendor,
    componentMode: plan.componentMode,
    stackMode: plan.stackMode,
    target: 'modern-esm',
    entry: entryFile.path,
    entryRelative: repoRelative(entryFile.path, repoRoot),
    entryBytes: entryFile.bytes,
    bytes: totalBytes,
    bundleFiles: bundleFiles.map((file) => ({
      type: file.type,
      fileName: file.fileName,
      path: repoRelative(file.path, repoRoot),
      bytes: file.bytes,
      isEntry: file.isEntry,
      isDynamicEntry: file.isDynamicEntry,
      imports: file.imports,
      dynamicImports: file.dynamicImports
    })),
    loader: plan.loader,
    components: {
      selected: plan.components.selected.map((entry) => ({
        tag: entry.tag,
        source: entry.source,
        importPath: ensureRelativeImport(plan.outputDir, entry.absolutePath)
      })),
      unknown: []
    },
    runtimeModules: plan.runtimeModules,
    stackModules: (plan.stackModules || []).map((entry) => ({
      id: entry.id,
      source: entry.source
    })),
    publicNameReservations: plan.publicNameReservations,
    toolchain: {
      ...plan.toolchain,
      active: options.activeToolchain || 'local-esm-importgraph-fallback',
      warnings: options.warnings || [],
      nameCache: options.nameCache || null
    },
    sizeBudget: sizeBudgetReport,
    forbiddenRuntimeDependencies: {
      componentManifestJson: false,
      dataManifestAttribute: false,
      xtendLoader: false
    }
  };
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${stableJson(value)}\n`);
}

function createMaracaSizeBudgetReport(input) {
  const plan = input.plan;
  const selectedBytes = plan.components.selected.reduce((sum, entry) => {
    try {
      return sum + fs.statSync(entry.absolutePath).size;
    } catch (_) {
      return sum;
    }
  }, 0);
  const stackBytes = (plan.stackModules || []).reduce((sum, entry) => {
    try {
      return sum + fs.statSync(entry.absolutePath).size;
    } catch (_) {
      return sum;
    }
  }, 0);
  let loaderBytes = 0;
  try {
    loaderBytes = fs.statSync(path.join(path.dirname(path.dirname(__filename)), 'xtend-loader.js')).size;
  } catch (_) {}
  const baselineBytes = loaderBytes + selectedBytes + stackBytes;
  const bundleBytes = Number(input.entryBytes || 0);
  const ratio = baselineBytes > 0 ? bundleBytes / baselineBytes : 1;
  const enforced = plan.profile !== 'debug';
  const ok = enforced ? baselineBytes > 0 && bundleBytes < baselineBytes : true;

  return {
    schema: MARACA_SIZE_BUDGET_REPORT_SCHEMA,
    ok,
    status: enforced ? (ok ? 'within_budget' : 'over_budget') : 'debug_not_enforced',
    profile: plan.profile,
    baseline: {
      mode: stackBytes > 0
        ? 'legacy-loader-plus-selected-component-modules-plus-stack-modules'
        : 'legacy-loader-plus-selected-component-modules',
      loaderBytes,
      selectedComponentBytes: selectedBytes,
      stackModuleBytes: stackBytes,
      bytes: baselineBytes
    },
    baselineBytes,
    bundleBytes,
    ratio,
    budgets: {
      modernEsmEntryMustBeSmallerThanBaseline: enforced
    }
  };
}

function buildMaracaBundle(input = {}, options = {}) {
  const plan = createMaracaBuildPlan(input, options);
  if (!plan.ok) {
    return {
      schema: MARACA_BUNDLE_REPORT_SCHEMA,
      ok: false,
      status: plan.status,
      plan,
      bundleReport: null,
      sizeBudgetReport: null
    };
  }

  fs.mkdirSync(plan.outputDir, { recursive: true });
  const entryPath = plan.outputs.entry;
  const rawSource = createBundleSource(plan);
  const source = plan.profile === 'debug' ? rawSource : minifyLocalEsModule(rawSource);
  fs.writeFileSync(entryPath, `${source}\n`);

  if (plan.css === 'external' && plan.outputs.css) {
    fs.writeFileSync(plan.outputs.css, `${createCssText()}\n`);
  }

  const entryBytes = fs.statSync(entryPath).size;
  const sizeBudgetReport = createMaracaSizeBudgetReport({
    plan,
    entryPath,
    entryBytes
  });
  const bundleFiles = [{
    type: 'chunk',
    fileName: path.basename(entryPath),
    path: entryPath,
    bytes: entryBytes,
    isEntry: true,
    isDynamicEntry: false,
    imports: [],
    dynamicImports: []
  }];
  const bundleReport = createBundleReport(plan, bundleFiles, sizeBudgetReport, {
    activeToolchain: 'local-esm-importgraph-fallback'
  });

  writeJson(plan.outputs.bundleReport, bundleReport);
  writeJson(plan.outputs.sizeBudgetReport, sizeBudgetReport);

  return {
    schema: MARACA_BUNDLE_REPORT_SCHEMA,
    ok: bundleReport.ok && sizeBudgetReport.ok,
    status: bundleReport.ok && sizeBudgetReport.ok ? 'built' : 'built_over_budget',
    plan,
    bundleReport,
    sizeBudgetReport
  };
}

async function buildMaracaBundleAsync(input = {}, options = {}) {
  const plan = createMaracaBuildPlan(input, options);
  if (!plan.ok) {
    return {
      schema: MARACA_BUNDLE_REPORT_SCHEMA,
      ok: false,
      status: plan.status,
      plan,
      bundleReport: null,
      sizeBudgetReport: null
    };
  }

  fs.mkdirSync(plan.outputDir, { recursive: true });
  const rawSource = createBundleSource(plan);
  let rollupResult;

  try {
    rollupResult = await createRollupBundleFiles(plan, rawSource);
  } catch (error) {
    return {
      schema: MARACA_BUNDLE_REPORT_SCHEMA,
      ok: false,
      status: 'build_failed',
      plan: {
        ...plan,
        diagnostics: plan.diagnostics.concat({
          code: 'xtend.maraca.rollup_terser_failed',
          severity: 'error',
          message: error && error.message ? error.message : String(error)
        })
      },
      bundleReport: null,
      sizeBudgetReport: null
    };
  }

  if (!rollupResult.ok) {
    return buildMaracaBundle(input, options);
  }

  if (plan.css === 'external' && plan.outputs.css) {
    fs.writeFileSync(plan.outputs.css, `${createCssText()}\n`);
    const cssFile = {
      type: 'asset',
      fileName: path.basename(plan.outputs.css),
      path: plan.outputs.css,
      bytes: fs.statSync(plan.outputs.css).size,
      isEntry: false,
      isDynamicEntry: false,
      imports: [],
      dynamicImports: []
    };
    rollupResult.files.push(cssFile);
  }

  const entryFile = rollupResult.files.find((file) => file.isEntry) || {
    path: plan.outputs.entry,
    bytes: fs.existsSync(plan.outputs.entry) ? fs.statSync(plan.outputs.entry).size : 0
  };
  const bundleBytes = rollupResult.files.reduce((sum, file) => sum + Number(file.bytes || 0), 0);
  const sizeBudgetReport = createMaracaSizeBudgetReport({
    plan,
    entryPath: entryFile.path,
    entryBytes: bundleBytes
  });
  const bundleReport = createBundleReport(plan, rollupResult.files, sizeBudgetReport, {
    activeToolchain: 'rollup-terser',
    warnings: rollupResult.warnings,
    nameCache: rollupResult.nameCache
  });

  writeJson(plan.outputs.bundleReport, bundleReport);
  writeJson(plan.outputs.sizeBudgetReport, sizeBudgetReport);

  return {
    schema: MARACA_BUNDLE_REPORT_SCHEMA,
    ok: bundleReport.ok && sizeBudgetReport.ok,
    status: bundleReport.ok && sizeBudgetReport.ok ? 'built' : 'built_over_budget',
    plan,
    bundleReport,
    sizeBudgetReport
  };
}

module.exports = {
  MARACA_PACKAGE_SCHEMA,
  MARACA_BUILD_PLAN_SCHEMA,
  MARACA_BUNDLE_REPORT_SCHEMA,
  MARACA_SIZE_BUDGET_REPORT_SCHEMA,
  COMPONENT_UNKNOWN_CODE,
  COMPONENT_DYNAMIC_CODE,
  DEFAULT_SOURCE,
  createMaracaBuildPlan,
  buildMaracaBundle,
  buildMaracaBundleAsync,
  createMaracaSizeBudgetReport,
  getMaracaToolchainAvailability
};
