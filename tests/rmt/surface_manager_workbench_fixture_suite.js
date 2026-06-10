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
  COMPONENT_TAGS,
  KERNEL_BOUNDARY,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_ADAPTERS,
  REQUIRED_ARTIFACTS,
  REQUIRED_COMPONENTS,
  REQUIRED_DOCS,
  REQUIRED_ROUTE_IDS,
  REQUIRED_SCHEDULES,
  REQUIRED_SURFACE_TYPES,
  REQUIRED_TEMPLATES,
  SURFACE_AUTHORING_SCHEMA,
  SURFACE_COMPONENTS,
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_MANAGER_SCHEMA,
  SURFACE_MANAGER_WORKBENCH_BROWSER_SMOKE,
  SURFACE_MANAGER_WORKBENCH_CONTRACT,
  SURFACE_MANAGER_WORKBENCH_DOCS,
  SURFACE_MANAGER_WORKBENCH_FIXTURE,
  SURFACE_MANAGER_WORKBENCH_HOST,
  SURFACE_MANAGER_WORKBENCH_LOCAL_GATE,
  SURFACE_MANAGER_WORKBENCH_MODULE,
  SURFACE_MANAGER_WORKBENCH_PACKAGE_SCRIPT,
  SURFACE_MANAGER_WORKBENCH_PLAN,
  SURFACE_MANAGER_WORKBENCH_REPORT_SCHEMA,
  SURFACE_MANAGER_WORKBENCH_RUNTIME,
  SURFACE_MANAGER_WORKBENCH_SCHEMA,
  SURFACE_MANAGER_WORKBENCH_STATUS,
  SURFACE_MANAGER_WORKBENCH_SUITE,
  SURFACE_MANAGER_WORKBENCH_TARGET,
  SURFACE_MANAGER_WORKBENCH_WORKPACKAGE,
  SURFACE_MANAGER_WORKBENCH_WORKPACKAGE_DOC,
  SURFACE_RECORD_SCHEMA,
  SURFACE_SNAPSHOT_SCHEMA,
  createSurfaceManagerWorkbenchFixturePlan,
  createSurfaceManagerWorkbenchFixtureReport,
  validateSurfaceManagerWorkbenchFixturePlan
} = require('../../catalog/surface-manager-workbench-fixture');

const RMT_VNEXT_CORE_SCHEMA = 'xtend.rmt.core-format.vnext.v1';
const SURFACE_MANAGER_WORKBENCH_CORE = 'xtendrmt/surface-workbench.core.json';
const SURFACE_MANAGER_WORKBENCH_VNEXT_CORE = 'xtendrmt/surface-workbench.vnext.core.json';
const SURFACE_MANAGER_WORKBENCH_SCAFFOLD = 'xtendrmt/surface-workbench.scaffold.json';

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

function indexById(records) {
  return new Map((Array.isArray(records) ? records : []).map((record) => [record.id, record]));
}

function hasAdapter(document, adapterId) {
  return Array.isArray(document.adapters) && document.adapters.some((adapter) => adapter.id === adapterId && adapter.kernelVisible === false);
}

function collectComponentTags(document) {
  return (document.components || []).map((component) => component.tag).filter(Boolean);
}

function collectSurfaceRecords(document) {
  return (document.components || []).filter((component) => component.metadata && component.metadata.surface);
}

function collectSurfaceManagers(document) {
  return (document.components || []).filter((component) => component.metadata && component.metadata.surfaceManager);
}

function collectScheduleLanes(document) {
  return (document.schedules || []).map((schedule) => schedule.lane).filter(Boolean);
}

function assertAllComponentSchedulesResolve(context, document) {
  const schedules = indexById(document.schedules);
  (document.components || []).forEach((component) => {
    context.assert(schedules.has(component.schedule), `${component.id}: component schedule resolves`);
  });
}

function assertAllRouteReferencesResolve(context, document) {
  const components = indexById(document.components);
  const templates = indexById(document.templates);
  const schedules = indexById(document.schedules);
  const adapters = indexById(document.adapters);

  (document.routes || []).forEach((route) => {
    context.assert(adapters.has(route.router), `${route.id}: router adapter resolves`);
    context.assert(components.has(route.component), `${route.id}: component ref resolves`);
    context.assert(templates.has(route.template), `${route.id}: template ref resolves`);
    context.assert(templates.has(route.shell), `${route.id}: shell template ref resolves`);
    context.assert(schedules.has(route.schedule), `${route.id}: schedule ref resolves`);
  });
}

function assertSlotReferencesResolve(context, document) {
  const components = indexById(document.components);
  const templates = indexById(document.templates);

  function assertSlot(slot, ownerId, slotName) {
    if (!slot || typeof slot !== 'object') return;
    if (slot.component) {
      context.assert(components.has(slot.component), `${ownerId}.${slotName}: slot component resolves`);
    }
    if (slot.template) {
      context.assert(templates.has(slot.template), `${ownerId}.${slotName}: slot template resolves`);
    }
    if (Array.isArray(slot.components)) {
      slot.components.forEach((componentId) => {
        context.assert(components.has(componentId), `${ownerId}.${slotName}: slot component list resolves ${componentId}`);
      });
    }
  }

  (document.components || []).forEach((component) => {
    Object.entries(component.slots || {}).forEach(([slotName, slot]) => {
      assertSlot(slot, component.id, slotName);
    });
  });
}

function assertTemplateComponentReferencesResolve(context, document) {
  const components = indexById(document.components);
  const templates = indexById(document.templates);

  function visitNode(templateId, node) {
    if (!node || typeof node !== 'object') return;
    if (node.component) {
      context.assert(components.has(node.component), `${templateId}: descriptor component resolves ${node.component}`);
    }
    if (node.template) {
      context.assert(templates.has(node.template), `${templateId}: descriptor template resolves ${node.template}`);
    }
    (node.children || []).forEach((child) => visitNode(templateId, child));
  }

  (document.templates || []).forEach((template) => {
    (template.nodes || []).forEach((node) => visitNode(template.id, node));
  });
}

function createRmtFormatFromBundle(context, rootDir) {
  const artifactPath = 'xtendrmt/rmt-core.esm.js';
  const source = readText(artifactPath, rootDir);
  const cjsCompatibleSource = source.replace(/\nexport\s+\{[\s\S]*?\};\s*\nexport default XtendRmtProduct;\s*$/u, '');
  function CustomEvent(type, init = {}) {
    this.type = type;
    this.detail = init.detail || null;
    this.bubbles = init.bubbles === true;
    this.composed = init.composed === true;
  }
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    performance: { now: () => 0 },
    navigator: { userAgent: 'xtend-surface-workbench-fixture-test' },
    CustomEvent,
    document: {
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return true;
      },
      createTextNode(text) {
        return { nodeType: 3, textContent: String(text || '') };
      },
      createElement(tagName) {
        return {
          tagName: String(tagName || '').toUpperCase(),
          attributes: {},
          children: [],
          setAttribute(name, value) {
            this.attributes[name] = String(value);
          },
          appendChild(child) {
            this.children.push(child);
            return child;
          }
        };
      }
    }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;

  try {
    vm.runInNewContext(cjsCompatibleSource, sandbox, {
      filename: artifactPath
    });
  } catch (error) {
    context.fail(`RMT core bundle evaluates for Surface Workbench fixture (${error.message})`);
    return null;
  }

  const factory = sandbox.AppModules && sandbox.AppModules.createRmtFormat;
  if (!context.assert(typeof factory === 'function', 'RMT core bundle exposes createRmtFormat for Surface Workbench fixture')) {
    return null;
  }
  return factory();
}

function runSurfaceManagerWorkbenchFixtureSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'surface-workbench-fixture',
    label: 'SurfaceManager RMT-first Workbench fixture'
  });
  const plan = createSurfaceManagerWorkbenchFixturePlan({ rootDir });
  const validation = validateSurfaceManagerWorkbenchFixturePlan(plan);
  const report = createSurfaceManagerWorkbenchFixtureReport({ rootDir, plan });
  const source = readText(SURFACE_MANAGER_WORKBENCH_FIXTURE, rootDir);
  const fixture = readJson(SURFACE_MANAGER_WORKBENCH_FIXTURE, rootDir);
  const runtimeCore = readJson(SURFACE_MANAGER_WORKBENCH_CORE, rootDir);
  const vnextCore = readJson(SURFACE_MANAGER_WORKBENCH_VNEXT_CORE, rootDir);
  const scaffold = readJson(SURFACE_MANAGER_WORKBENCH_SCAFFOLD, rootDir);
  const host = readText(SURFACE_MANAGER_WORKBENCH_HOST, rootDir);
  const runtime = readText(SURFACE_MANAGER_WORKBENCH_RUNTIME, rootDir);
  const browserSmoke = readText(SURFACE_MANAGER_WORKBENCH_BROWSER_SMOKE, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerWorkbenchFixture;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const planningDoc = readText(SURFACE_MANAGER_WORKBENCH_PLAN, rootDir);
  const contractDoc = readText(SURFACE_MANAGER_WORKBENCH_CONTRACT, rootDir);
  const workpackageDoc = readText(SURFACE_MANAGER_WORKBENCH_WORKPACKAGE_DOC, rootDir);
  const docs = readText(SURFACE_MANAGER_WORKBENCH_DOCS, rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const referenceRegistry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as Surface Workbench artifact`);
  });
  assertFileExists(context, SURFACE_MANAGER_WORKBENCH_CORE, rootDir, 'Surface Workbench runtime core exists');
  assertFileExists(context, SURFACE_MANAGER_WORKBENCH_VNEXT_CORE, rootDir, 'Surface Workbench vNext core exists');
  assertFileExists(context, SURFACE_MANAGER_WORKBENCH_SCAFFOLD, rootDir, 'Surface Workbench scaffold report exists');
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as Surface Workbench doc`);
  });

  [
    SURFACE_MANAGER_WORKBENCH_MODULE,
    SURFACE_MANAGER_WORKBENCH_SUITE,
    SURFACE_MANAGER_WORKBENCH_RUNTIME
  ].forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  context.assert(plan.schema === SURFACE_MANAGER_WORKBENCH_SCHEMA, 'Surface Workbench schema is stable');
  context.assert(plan.reportSchema === SURFACE_MANAGER_WORKBENCH_REPORT_SCHEMA, 'Surface Workbench report schema is stable');
  context.assert(plan.surfaceAuthoringSchema === SURFACE_AUTHORING_SCHEMA, 'Surface Workbench reuses authoring schema');
  context.assert(plan.surfaceManagerSchema === SURFACE_MANAGER_SCHEMA, 'Surface Workbench reuses manager schema');
  context.assert(plan.surfaceRecordSchema === SURFACE_RECORD_SCHEMA, 'Surface Workbench reuses record schema');
  context.assert(plan.surfaceControllerSchema === SURFACE_CONTROLLER_SCHEMA, 'Surface Workbench reuses controller schema');
  context.assert(plan.snapshotSchema === SURFACE_SNAPSHOT_SCHEMA, 'Surface Workbench reuses snapshot schema');
  context.assert(plan.workpackage === SURFACE_MANAGER_WORKBENCH_WORKPACKAGE, 'Surface Workbench belongs to WP-SM-05');
  context.assert(plan.status === SURFACE_MANAGER_WORKBENCH_STATUS, 'Surface Workbench status is accepted');
  context.assert(plan.targetReadiness === SURFACE_MANAGER_WORKBENCH_TARGET, 'Surface Workbench target is ready');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'Surface Workbench keeps kernel boundary');
  context.assert(plan.nextWorkpackage === NEXT_WORKPACKAGE, 'Surface Workbench hands off to WP-SM-06');
  context.assert(plan.nextDecision === NEXT_DECISION, 'Surface Workbench exposes next decision');
  context.assert(validation.ok === true, 'Surface Workbench plan validates');
  context.assert(report.ok === true, 'Surface Workbench report validates');
  context.assert(report.surfaceCount === SURFACE_COMPONENTS.length, 'Surface Workbench report counts surfaces');
  context.assert(report.routeCount === REQUIRED_ROUTE_IDS.length, 'Surface Workbench report counts route records');
  assertIncludesAll(context, plan.requiredAdapters, REQUIRED_ADAPTERS, 'Surface Workbench adapters');
  assertIncludesAll(context, plan.requiredComponents, REQUIRED_COMPONENTS, 'Surface Workbench components');
  assertIncludesAll(context, plan.componentTags, COMPONENT_TAGS, 'Surface Workbench component tags');
  assertIncludesAll(context, plan.requiredSchedules, REQUIRED_SCHEDULES, 'Surface Workbench schedules');
  assertIncludesAll(context, plan.requiredTemplates, REQUIRED_TEMPLATES, 'Surface Workbench templates');
  assertIncludesAll(context, plan.surfaceTypes, REQUIRED_SURFACE_TYPES, 'Surface Workbench surface types');
  context.assert(plan.featureFlags.rmtFirstWorkbenchFixtureImplemented === true, 'RMT-first Workbench fixture is implemented');
  context.assert(plan.featureFlags.hostHasNoManualShell === true, 'Surface Workbench host forbids manual shell');
  context.assert(plan.featureFlags.browserRequiredInLocalGate === false, 'Surface Workbench local gate is browser-free');
  context.assert(plan.featureFlags.externalNetworkAllowedInLocalGate === false, 'Surface Workbench local gate is network-free');

  context.assert(source.includes('template demo.xtend.surfaceWorkbench'), 'Surface Workbench source uses vNext template authoring');
  context.assert(!source.trimStart().startsWith('{'), 'Surface Workbench source is not legacy JSON authoring');
  context.assert(runtimeCore.manifest.sourceSyntax === 'rmt-vnext', 'Surface Workbench runtime core records vNext source syntax');
  context.assert(runtimeCore.manifest.authoringSource === SURFACE_MANAGER_WORKBENCH_FIXTURE, 'Surface Workbench runtime core points to authoring source');
  context.assert(vnextCore.schema === RMT_VNEXT_CORE_SCHEMA, 'Surface Workbench vNext core uses vNext core schema');
  context.assert(vnextCore.manifest.sourceSyntax === 'rmt-vnext', 'Surface Workbench vNext core records source syntax');
  context.assert(scaffold.source === SURFACE_MANAGER_WORKBENCH_FIXTURE, 'Surface Workbench scaffold links source');
  context.assert(scaffold.runtimeCore === SURFACE_MANAGER_WORKBENCH_CORE, 'Surface Workbench scaffold links runtime core');
  context.assert(scaffold.vnextCore === SURFACE_MANAGER_WORKBENCH_VNEXT_CORE, 'Surface Workbench scaffold links vNext core');
  context.assert(scaffold.sourceSyntax === 'rmt-vnext', 'Surface Workbench scaffold records source syntax');
  context.assert(scaffold.compilerStatus === 'compiled', 'Surface Workbench scaffold records compiled vNext core');
  context.assert(fixture.manifest.documentId === runtimeCore.manifest.documentId, 'Surface Workbench readJson fallback returns runtime core parity');
  context.assert(fixture.kind === 'rmt_document', 'Surface Workbench fixture is an RMT document');
  context.assert(fixture.manifest.documentId === 'demo.xtend.surface-workbench', 'Surface Workbench fixture has stable document id');
  context.assert(fixture.manifest.metadata.contractVersion === SURFACE_MANAGER_WORKBENCH_SCHEMA, 'Surface Workbench fixture declares WP-SM-05 schema');
  context.assert(fixture.manifest.metadata.sourceAuthoringContract === SURFACE_AUTHORING_SCHEMA, 'Surface Workbench fixture derives from WP-SM-01 authoring');
  context.assert(fixture.manifest.metadata.workpackage === SURFACE_MANAGER_WORKBENCH_WORKPACKAGE, 'Surface Workbench fixture is owned by WP-SM-05');
  context.assert(fixture.manifest.metadata.renderMode === 'shell-first', 'Surface Workbench fixture is shell-first');
  context.assert(fixture.manifest.metadata.manualShellAllowed === false, 'Surface Workbench fixture forbids manual shell');
  context.assert(fixture.manifest.metadata.hostShellMarkup === false, 'Surface Workbench fixture forbids host shell markup');
  context.assert(fixture.manifest.metadata.routeBoundContent === true, 'Surface Workbench fixture declares route-bound content');
  context.assert(fixture.manifest.metadata.sharedSurfaceSnapshot === true, 'Surface Workbench fixture declares shared surface snapshot');
  context.assert(fixture.manifest.metadata.reservedSurfaceAdapter === 'xtend.surface', 'Surface Workbench fixture reserves xtend.surface adapter');
  context.assert(!Object.prototype.hasOwnProperty.call(fixture, 'surfaces'), 'Surface Workbench keeps MVP inside component records');
  context.assert(!JSON.stringify(fixture).includes('html_fragment'), 'Surface Workbench avoids html_fragment templates');
  context.assert(hasAdapter(fixture, 'xtend.component'), 'Surface Workbench has XTend component adapter');
  context.assert(hasAdapter(fixture, 'xtend.xrouter'), 'Surface Workbench has XRouter adapter');
  context.assert(hasAdapter(fixture, 'rmt.state-scheduler-diagnostics'), 'Surface Workbench has scheduler diagnostics adapter');
  context.assert(!hasAdapter(fixture, 'xtend.surface'), 'Surface Workbench does not activate xtend.surface adapter yet');

  const components = indexById(fixture.components);
  const schedules = indexById(fixture.schedules);
  const templates = indexById(fixture.templates);
  const routes = indexById(fixture.routes);
  REQUIRED_COMPONENTS.forEach((componentId) => context.assert(components.has(componentId), `Surface Workbench declares ${componentId}`));
  REQUIRED_SCHEDULES.forEach((scheduleId) => context.assert(schedules.has(scheduleId), `Surface Workbench declares schedule ${scheduleId}`));
  REQUIRED_TEMPLATES.forEach((templateId) => context.assert(templates.has(templateId), `Surface Workbench declares template ${templateId}`));
  REQUIRED_ROUTE_IDS.forEach((routeId) => context.assert(routes.has(routeId), `Surface Workbench declares route ${routeId}`));
  assertIncludesAll(context, collectComponentTags(fixture), COMPONENT_TAGS, 'Surface Workbench fixture tags');
  assertIncludesAll(context, collectScheduleLanes(fixture), ['visible', 'user-blocking', 'transition', 'background', 'diagnostics', 'idle'], 'Surface Workbench schedule lanes');
  context.assert(templates.get('app.shell.template') && templates.get('app.shell.template').mode === 'dom_descriptor', 'Surface Workbench app shell uses dom_descriptor');
  context.assert(templates.get('workbench.route.template') && templates.get('workbench.route.template').metadata.routeBoundContent === true, 'Surface Workbench route template is route-bound');
  context.assert(templates.get('properties.content.template') && templates.get('properties.content.template').metadata.eventBindingMode === 'dom-event-to-rmt-command', 'Surface Workbench maps descriptor events to RMT commands');

  const surfaceManagers = collectSurfaceManagers(fixture);
  const surfaceRecords = collectSurfaceRecords(fixture);
  context.assert(surfaceManagers.length === 1 && surfaceManagers[0].id === 'workbench.manager', 'Surface Workbench has one manager record');
  context.assert(surfaceManagers[0].metadata.surfaceManager.snapshotKey === 'xtend.surface.snapshot', 'Surface Workbench manager declares shared snapshot key');
  context.assert(surfaceRecords.length === 3, 'Surface Workbench has three surface records');
  context.assert(surfaceRecords.filter((component) => component.metadata.surface.type === 'window').length === 2, 'Surface Workbench has two windows');
  context.assert(surfaceRecords.some((component) => component.metadata.surface.type === 'side-panel'), 'Surface Workbench has one side-panel');
  context.assert(surfaceRecords.every((component) => component.metadata.surface.manager === 'workbench.manager'), 'Surface Workbench surfaces point to workbench.manager');
  context.assert(surfaceRecords.every((component) => component.metadata.surface.route === 'workbench'), 'Surface Workbench surfaces are route-bound');
  context.assert(surfaceRecords.every((component) => component.metadata.surface.stateKey && component.metadata.fabric), 'Surface Workbench surfaces carry state keys and Fabric metadata');
  context.assert(surfaceRecords.every((component) => component.metadata.a11y && component.metadata.a11y.focusRestore === true), 'Surface Workbench surfaces require focus restore');
  context.assert(routes.get('workbench').component === 'workbench.manager', 'Surface Workbench route mounts manager component');
  context.assert(routes.get('workbench').metadata.routeBoundContent === true, 'Surface Workbench route declares route-bound content');
  context.assert(routes.get('workbench').metadata.routeBoundSurfaces.length === 3, 'Surface Workbench route binds three surfaces');
  context.assert(routes.get('workbench').metadata.sharedSnapshotKey === 'xtend.surface.snapshot', 'Surface Workbench route declares shared snapshot key');
  context.assert(schedules.get('surface.transition.layout').lane === 'transition', 'Surface Workbench layout uses transition lane');
  context.assert(schedules.get('surface.background.persist').preferIdle === true, 'Surface Workbench persistence prefers idle');
  context.assert(schedules.get('a11y.user-blocking.announce').metadata.fabricLane === 'a11y', 'Surface Workbench a11y schedule carries Fabric a11y lane');
  assertAllRouteReferencesResolve(context, fixture);
  assertAllComponentSchedulesResolve(context, fixture);
  assertSlotReferencesResolve(context, fixture);
  assertTemplateComponentReferencesResolve(context, fixture);

  const rmtFormat = createRmtFormatFromBundle(context, rootDir);
  if (rmtFormat) {
    const normalizedDocument = rmtFormat.normalizeDocument(fixture);
    const registries = rmtFormat.createRuntimeRegistries(fixture);
    context.assert(normalizedDocument.manifest.documentId === 'demo.xtend.surface-workbench', 'RMT format normalizes Surface Workbench document id');
    context.assert(normalizedDocument.adapters.length === REQUIRED_ADAPTERS.length, 'RMT format normalizes Surface Workbench adapters');
    context.assert(normalizedDocument.components.length === REQUIRED_COMPONENTS.length, 'RMT format normalizes Surface Workbench components');
    context.assert(normalizedDocument.routes.length === REQUIRED_ROUTE_IDS.length, 'RMT format normalizes Surface Workbench route');
    context.assert(normalizedDocument.schedules.length === REQUIRED_SCHEDULES.length, 'RMT format normalizes Surface Workbench schedules');
    context.assert(normalizedDocument.templates.length === REQUIRED_TEMPLATES.length, 'RMT format normalizes Surface Workbench templates');
    context.assert(registries.status === 'ready', 'Surface Workbench creates ready runtime registries');
    context.assert(registries.diagnosticCount === 0, 'Surface Workbench creates registries without diagnostics');
    context.assert(registries.componentRegistry.ids.includes('workbench.manager'), 'Surface Workbench indexes manager');
    context.assert(registries.routeRegistry.ids.includes('workbench'), 'Surface Workbench indexes route');
  }

  assertTextIncludesAll(context, host, [
    'data-rmt-host="surface-workbench"',
    'data-rmt-document-src="/xtendrmt/surface-workbench.core.json"',
    'data-rmt-source-src="/xtendrmt/surface-workbench.rmt"',
    'type="module" src="/xtend-loader.js"',
    'data-manifest="/components/manifest.json"',
    'window.__XTendLoaderBootPromise',
    "import('/xtendrmt/surface-workbench.js')",
    'renderSurfaceWorkbenchFromDocument'
  ], 'Surface Workbench host');
  context.assert(!host.includes('<x-surface-manager'), 'Surface Workbench host has no static x-surface-manager');
  context.assert(!host.includes('<x-surface-window'), 'Surface Workbench host has no static x-surface-window');
  context.assert(!host.includes('<x-side-panel'), 'Surface Workbench host has no static x-side-panel');
  context.assert(!host.includes('https://cdn.ccs-networks.de/xtend'), 'Surface Workbench host has no CDN dependency');

  assertTextIncludesAll(context, runtime, [
    'renderSurfaceWorkbenchFromDocument',
    'collectSurfaceSnapshot',
    'renderDomDescriptor',
    'createRouteElement',
    'attachRoutesFromDocument',
    'surface-workbench',
    'xtend.surface.snapshot.v1',
    'surface-window-command',
    'surface-panel-command',
    'surface-workbench.core.json',
    'response.json()',
    'root.replaceChildren(shellFragment)',
    'data-rmt-rendered-shell'
  ], 'Surface Workbench runtime');
  context.assert(!runtime.includes('parseDocument'), 'Surface Workbench runtime does not parse vNext authoring with legacy format');
  context.assert(!runtime.includes('innerHTML'), 'Surface Workbench runtime avoids string HTML rendering');

  assertTextIncludesAll(context, browserSmoke, [
    'xtend.surface.workbench-fixture.browser-smoke.v1',
    '/xtend-loader.js',
    '/xtendrmt/surface-workbench.js',
    '/xtendrmt/surface-workbench.core.json',
    '/xtendrmt/surface-workbench.rmt',
    '__xtendSurfaceWorkbenchSmokeResult',
    "recordCheck('surface workbench source is vnext authoring'",
    "recordCheck('surface workbench runtime core declares vnext source'",
    "recordCheck('surface workbench document loaded'",
    "recordCheck('surface workbench route-bound manager rendered'",
    "recordCheck('surface workbench two windows rendered'",
    "recordCheck('surface workbench shared snapshot visible'"
  ], 'Surface Workbench browser smoke');
  context.assert(!browserSmoke.includes('https://cdn.ccs-networks.de/xtend'), 'Surface Workbench browser smoke has no CDN dependency');

  assertTextIncludesAll(context, contractDoc, [
    SURFACE_MANAGER_WORKBENCH_SCHEMA,
    SURFACE_AUTHORING_SCHEMA,
    SURFACE_MANAGER_WORKBENCH_FIXTURE,
    SURFACE_MANAGER_WORKBENCH_HOST,
    'route-bound Content',
    'shared Surface Snapshot',
    KERNEL_BOUNDARY
  ], 'Surface Workbench contract doc');
  assertTextIncludesAll(context, workpackageDoc, [
    SURFACE_MANAGER_WORKBENCH_WORKPACKAGE,
    SURFACE_MANAGER_WORKBENCH_LOCAL_GATE,
    'Done Criteria',
    'WP-SM-06'
  ], 'Surface Workbench workpackage doc');
  assertTextIncludesAll(context, docs, [
    SURFACE_MANAGER_WORKBENCH_SCHEMA,
    SURFACE_MANAGER_WORKBENCH_FIXTURE,
    SURFACE_MANAGER_WORKBENCH_HOST,
    SURFACE_MANAGER_WORKBENCH_RUNTIME,
    'zwei Windows',
    'SidePanel',
    'route-bound Content',
    SURFACE_MANAGER_WORKBENCH_LOCAL_GATE
  ], 'Surface Workbench docs');

  context.assert(metadata && metadata.schema === SURFACE_MANAGER_WORKBENCH_SCHEMA, 'Package metadata exposes Surface Workbench schema');
  context.assert(metadata && metadata.reportSchema === SURFACE_MANAGER_WORKBENCH_REPORT_SCHEMA, 'Package metadata exposes Surface Workbench report schema');
  context.assert(metadata && metadata.workpackage === SURFACE_MANAGER_WORKBENCH_WORKPACKAGE, 'Package metadata exposes WP-SM-05');
  context.assert(metadata && metadata.fixture === SURFACE_MANAGER_WORKBENCH_FIXTURE, 'Package metadata exposes Surface Workbench fixture');
  context.assert(metadata && metadata.host === SURFACE_MANAGER_WORKBENCH_HOST, 'Package metadata exposes Surface Workbench host');
  context.assert(metadata && metadata.runtime === SURFACE_MANAGER_WORKBENCH_RUNTIME, 'Package metadata exposes Surface Workbench runtime');
  context.assert(metadata && metadata.browserSmoke === SURFACE_MANAGER_WORKBENCH_BROWSER_SMOKE, 'Package metadata exposes Surface Workbench browser smoke');
  context.assert(metadata && metadata.localGate === SURFACE_MANAGER_WORKBENCH_LOCAL_GATE, 'Package metadata exposes Surface Workbench local gate');
  context.assert(metadata && metadata.packageScript === SURFACE_MANAGER_WORKBENCH_PACKAGE_SCRIPT, 'Package metadata exposes Surface Workbench package script');
  context.assert(metadata && metadata.hostHasNoManualShell === true, 'Package metadata forbids manual shell');
  context.assert(metadata && metadata.routeBoundContent === true, 'Package metadata exposes route-bound content');
  context.assert(metadata && metadata.sharedSurfaceSnapshot === true, 'Package metadata exposes shared snapshot');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Package metadata exposes WP-SM-06 handoff');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:surface-workbench-fixture'] === 'node scripts/run_xtend_tests.js surface-workbench-fixture', 'Package script test:surface-workbench-fixture exists');
  context.assertIncludes(scaffoldConfig, 'surfaceManagerWorkbenchFixture', 'Scaffold config exposes surfaceManagerWorkbenchFixture');
  context.assertIncludes(scaffoldConfig, SURFACE_MANAGER_WORKBENCH_FIXTURE, 'Scaffold config references Surface Workbench fixture');
  context.assertIncludes(scaffoldConfig, SURFACE_MANAGER_WORKBENCH_LOCAL_GATE, 'Scaffold config references Surface Workbench local gate');
  context.assertIncludes(runner, "require('../tests/rmt/surface_manager_workbench_fixture_suite')", 'Runner imports Surface Workbench suite');
  context.assertIncludes(runner, "id: 'surface-workbench-fixture'", 'Runner registers Surface Workbench suite');
  context.assertIncludes(docsReadme, 'SurfaceManager Workbench Fixture', 'Docs README links Surface Workbench fixture');
  context.assertIncludes(docsMenu, 'surface-manager-workbench-fixture', 'Docs menu contains Surface Workbench page');
  context.assertIncludes(referenceRegistry, 'WP-SM-05', 'Reference registry contains WP-SM-05');
  context.assertIncludes(referenceRegistry, SURFACE_MANAGER_WORKBENCH_FIXTURE, 'Reference registry contains Surface Workbench fixture');
  context.assertIncludes(referenceRegistry, SURFACE_MANAGER_WORKBENCH_HOST, 'Reference registry contains Surface Workbench host');
  context.assertIncludes(planningDoc, '`WP-SM-05` | P1 | completed', 'Planning doc marks WP-SM-05 completed');
  context.assertIncludes(planningDoc, '`WP-SM-06` | P1 | completed', 'Planning doc marks WP-SM-06 completed');

  return context.result({
    report: {
      schema: SURFACE_MANAGER_WORKBENCH_REPORT_SCHEMA,
      workpackage: SURFACE_MANAGER_WORKBENCH_WORKPACKAGE,
      fixture: SURFACE_MANAGER_WORKBENCH_FIXTURE,
      host: SURFACE_MANAGER_WORKBENCH_HOST,
      runtime: SURFACE_MANAGER_WORKBENCH_RUNTIME,
      routes: fixture.routes.length,
      components: fixture.components.length,
      surfaces: surfaceRecords.length,
      schedules: fixture.schedules.length,
      templates: fixture.templates.length
    }
  });
}

function printSurfaceManagerWorkbenchFixtureReport(result) {
  printSuiteReport(result, {
    successTitle: 'SurfaceManager RMT-first Workbench Fixture erfolgreich.',
    failureTitle: 'SurfaceManager RMT-first Workbench Fixture fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceManagerWorkbenchFixtureReport,
  runSurfaceManagerWorkbenchFixtureSuite
};

if (require.main === module) {
  const result = runSurfaceManagerWorkbenchFixtureSuite();
  printSurfaceManagerWorkbenchFixtureReport(result);
  process.exit(result.ok ? 0 : 1);
}
