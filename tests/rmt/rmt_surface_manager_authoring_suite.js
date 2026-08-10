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
  COMPATIBILITY_SURFACE_TAGS,
  KERNEL_BOUNDARY,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_ADAPTERS,
  REQUIRED_ARTIFACTS,
  REQUIRED_COMPONENTS,
  REQUIRED_DOCS,
  REQUIRED_DOMAINS,
  REQUIRED_LANES,
  REQUIRED_SCHEDULES,
  RESERVED_ADAPTERS,
  SURFACE_COMPONENT_TAGS,
  SURFACE_MANAGER_RMT_AUTHORING_CONTRACT,
  SURFACE_MANAGER_RMT_AUTHORING_DOCS,
  SURFACE_MANAGER_RMT_AUTHORING_FIXTURE,
  SURFACE_MANAGER_RMT_AUTHORING_LOCAL_GATE,
  SURFACE_MANAGER_RMT_AUTHORING_MODULE,
  SURFACE_MANAGER_RMT_AUTHORING_PACKAGE_SCRIPT,
  SURFACE_MANAGER_RMT_AUTHORING_PLAN,
  SURFACE_MANAGER_RMT_AUTHORING_REPORT_SCHEMA,
  SURFACE_MANAGER_RMT_AUTHORING_SCHEMA,
  SURFACE_MANAGER_RMT_AUTHORING_STATUS,
  SURFACE_MANAGER_RMT_AUTHORING_SUITE,
  SURFACE_MANAGER_RMT_AUTHORING_TARGET,
  SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE,
  SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE_DOC,
  SURFACE_MANAGER_SCHEMA,
  SURFACE_RECORD_SCHEMA,
  SURFACE_TYPES,
  createSurfaceManagerRmtAuthoringPlan,
  createSurfaceManagerRmtAuthoringReport,
  validateSurfaceManagerRmtAuthoringPlan
} = require('../../catalog/surface-manager-rmt-authoring');

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

function createRmtFormatFromBundle(context, rootDir) {
  const artifactPath = 'xtendrmt/rmt-core.esm.js';
  const source = readText(artifactPath, rootDir);
  const cjsCompatibleSource = source
    .replace(/^\s*import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];\s*$/gmu, '')
    .replace(/^\s*import\s+['"][^'"]+['"];\s*$/gmu, '')
    .replace(/\nexport\s+\{[\s\S]*?\};\s*\nexport default XtendRmtProduct;\s*$/u, '');
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
    navigator: { userAgent: 'xtend-surface-manager-authoring-test' },
    CustomEvent,
    document: {
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return true;
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
    context.fail(`RMT core bundle evaluates for SurfaceManager authoring (${error.message})`);
    return null;
  }

  const factory = sandbox.AppModules && sandbox.AppModules.createRmtFormat;
  if (!context.assert(typeof factory === 'function', 'RMT core bundle exposes createRmtFormat for SurfaceManager authoring')) {
    return null;
  }
  return factory();
}

function runRmtSurfaceManagerAuthoringSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-surface-authoring',
    label: 'RMT SurfaceManager authoring contract'
  });
  const plan = createSurfaceManagerRmtAuthoringPlan({ rootDir });
  const validation = validateSurfaceManagerRmtAuthoringPlan(plan);
  const report = createSurfaceManagerRmtAuthoringReport({ rootDir, plan });
  const fixture = readJson(SURFACE_MANAGER_RMT_AUTHORING_FIXTURE, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerRmtAuthoring;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const planningDoc = readText(SURFACE_MANAGER_RMT_AUTHORING_PLAN, rootDir);
  const contractDoc = readText(SURFACE_MANAGER_RMT_AUTHORING_CONTRACT, rootDir);
  const workpackageDoc = readText(SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE_DOC, rootDir);
  const docs = readText(SURFACE_MANAGER_RMT_AUTHORING_DOCS, rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const referenceRegistry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const rmtSchema = readText('xtendrmt/rmt.schema.json', rootDir);
  const moduleSyntax = syntaxCheckFile(SURFACE_MANAGER_RMT_AUTHORING_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(SURFACE_MANAGER_RMT_AUTHORING_SUITE, { rootDir, extension: '.js' });

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as SurfaceManager authoring artifact`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as SurfaceManager authoring doc`);
  });

  context.assert(moduleSyntax.ok, `SurfaceManager authoring module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `SurfaceManager authoring suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === SURFACE_MANAGER_RMT_AUTHORING_SCHEMA, 'SurfaceManager authoring exposes stable RMT schema');
  context.assert(plan.reportSchema === SURFACE_MANAGER_RMT_AUTHORING_REPORT_SCHEMA, 'SurfaceManager authoring exposes report schema');
  context.assert(plan.surfaceManagerSchema === SURFACE_MANAGER_SCHEMA, 'SurfaceManager schema is stable');
  context.assert(plan.surfaceRecordSchema === SURFACE_RECORD_SCHEMA, 'Surface record schema is stable');
  context.assert(plan.workpackage === SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE, 'SurfaceManager authoring belongs to WP-SM-01');
  context.assert(plan.status === SURFACE_MANAGER_RMT_AUTHORING_STATUS, 'SurfaceManager authoring contract is accepted');
  context.assert(plan.targetReadiness === SURFACE_MANAGER_RMT_AUTHORING_TARGET, 'SurfaceManager authoring target is ready');
  context.assert(plan.runtimeComponentsImplemented === false, 'WP-SM-01 does not claim runtime components are implemented');
  context.assert(plan.localGateMode === 'static-rmt-surface-authoring-contract', 'SurfaceManager authoring local gate is static');
  context.assert(plan.externalBrowserRequiredInLocalGate === false && plan.externalNetworkAllowedInLocalGate === false, 'SurfaceManager authoring local gate is browser/network free');
  context.assert(plan.frameworkAgnostic === true, 'SurfaceManager authoring remains framework agnostic');
  context.assert(plan.rmtKernelImportsXtendTypes === false, 'SurfaceManager authoring rejects RMT kernel XTend imports');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'SurfaceManager authoring keeps kernel boundary');
  context.assert(plan.fabricRelationship === 'surface-manager-consumes-fabric-does-not-replace-fabric', 'SurfaceManager consumes Fabric without replacing it');
  context.assert(plan.nextWorkpackage === NEXT_WORKPACKAGE, 'SurfaceManager authoring hands off to WP-SM-02');
  context.assert(plan.nextDecision === NEXT_DECISION, 'SurfaceManager authoring exposes next decision');
  context.assert(validation.schema === SURFACE_MANAGER_RMT_AUTHORING_REPORT_SCHEMA, 'SurfaceManager validator emits report schema');
  context.assert(validation.ok === true, 'SurfaceManager authoring plan validates');
  context.assert(report.ok === true, 'SurfaceManager authoring report validates');
  context.assert(report.componentCount === REQUIRED_COMPONENTS.length, 'SurfaceManager report counts required components');
  context.assert(report.scheduleCount === REQUIRED_SCHEDULES.length, 'SurfaceManager report counts schedules');
  context.assert(report.futureDomain === 'surfaces', 'SurfaceManager report reserves native surfaces domain');
  context.assert(report.futureAdapter === 'xtend.surface', 'SurfaceManager report reserves xtend.surface adapter');
  assertIncludesAll(context, plan.requiredDomains, REQUIRED_DOMAINS, 'SurfaceManager required domains');
  assertIncludesAll(context, plan.requiredAdapters, REQUIRED_ADAPTERS, 'SurfaceManager required adapters');
  assertIncludesAll(context, plan.reservedAdapters, RESERVED_ADAPTERS, 'SurfaceManager reserved adapters');
  assertIncludesAll(context, plan.requiredComponents, REQUIRED_COMPONENTS, 'SurfaceManager required components');
  assertIncludesAll(context, plan.componentTags, SURFACE_COMPONENT_TAGS, 'SurfaceManager component tags');
  assertIncludesAll(context, plan.compatibilityTags, COMPATIBILITY_SURFACE_TAGS, 'SurfaceManager compatibility tags');
  assertIncludesAll(context, plan.supportedSurfaceTypes, SURFACE_TYPES, 'SurfaceManager supported surface types');
  assertIncludesAll(context, plan.requiredSchedules, REQUIRED_SCHEDULES, 'SurfaceManager required schedules');
  assertIncludesAll(context, plan.scheduleLanes, REQUIRED_LANES, 'SurfaceManager lanes');

  context.assert(fixture.kind === 'rmt_document', 'SurfaceManager fixture is an RMT document');
  context.assert(fixture.manifest.metadata.contractVersion === SURFACE_MANAGER_RMT_AUTHORING_SCHEMA, 'SurfaceManager fixture declares authoring schema');
  context.assert(fixture.manifest.metadata.workpackage === SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE, 'SurfaceManager fixture is owned by WP-SM-01');
  context.assert(fixture.manifest.metadata.renderMode === 'shell-first', 'SurfaceManager fixture is shell-first');
  context.assert(fixture.manifest.metadata.surfaceManager === SURFACE_MANAGER_SCHEMA, 'SurfaceManager fixture declares manager schema');
  context.assert(fixture.manifest.metadata.surfaceRecord === SURFACE_RECORD_SCHEMA, 'SurfaceManager fixture declares record schema');
  context.assert(fixture.manifest.metadata.reservedSurfaceAdapter === 'xtend.surface', 'SurfaceManager fixture reserves xtend.surface adapter');
  context.assert(!Object.prototype.hasOwnProperty.call(fixture, 'surfaces'), 'SurfaceManager fixture keeps MVP inside component records, not top-level surfaces');
  context.assert(hasAdapter(fixture, 'xtend.component'), 'SurfaceManager fixture has XTend component adapter');
  context.assert(hasAdapter(fixture, 'xtend.xrouter'), 'SurfaceManager fixture has XRouter adapter');
  context.assert(hasAdapter(fixture, 'rmt.state-scheduler-diagnostics'), 'SurfaceManager fixture has scheduler diagnostics adapter');
  context.assert(!hasAdapter(fixture, 'xtend.surface'), 'SurfaceManager fixture does not add unsupported xtend.surface adapter yet');
  const components = indexById(fixture.components);
  const schedules = indexById(fixture.schedules);
  const templates = indexById(fixture.templates);
  REQUIRED_COMPONENTS.forEach((componentId) => {
    context.assert(components.has(componentId), `SurfaceManager fixture declares ${componentId}`);
  });
  REQUIRED_SCHEDULES.forEach((scheduleId) => {
    context.assert(schedules.has(scheduleId), `SurfaceManager fixture declares ${scheduleId}`);
  });
  context.assert(templates.get('app.shell') && templates.get('app.shell').mode === 'dom_descriptor', 'SurfaceManager fixture app shell uses dom_descriptor');
  context.assert(templates.get('properties.content.template') && templates.get('properties.content.template').metadata.eventBindingMode === 'dom-event-to-rmt-command', 'SurfaceManager fixture maps events to RMT commands');
  assertIncludesAll(context, collectComponentTags(fixture), SURFACE_COMPONENT_TAGS, 'SurfaceManager fixture component tags');
  const surfaceRecords = collectSurfaceRecords(fixture);
  const surfaceManagers = collectSurfaceManagers(fixture);
  context.assert(surfaceManagers.length === 1 && surfaceManagers[0].id === 'workbench.manager', 'SurfaceManager fixture has one manager record');
  context.assert(surfaceRecords.length === 3, 'SurfaceManager fixture has three surface records');
  context.assert(surfaceRecords.filter((component) => component.metadata.surface.type === 'window').length === 2, 'SurfaceManager fixture has two windows');
  context.assert(surfaceRecords.some((component) => component.metadata.surface.type === 'side-panel'), 'SurfaceManager fixture has one side-panel');
  context.assert(surfaceRecords.every((component) => component.metadata.surface.manager === 'workbench.manager'), 'Surface records point to workbench.manager');
  context.assert(surfaceRecords.every((component) => component.metadata.surface.stateKey && component.metadata.fabric), 'Surface records carry state keys and Fabric metadata');
  context.assert(surfaceRecords.every((component) => component.metadata.a11y && component.metadata.a11y.focusRestore === true), 'Surface records require focus restore');
  assertIncludesAll(context, collectScheduleLanes(fixture), REQUIRED_LANES, 'SurfaceManager fixture schedule lanes');
  context.assert(schedules.get('surface.user-blocking.open').endpointName === 'xtendrmt.surface.open', 'Surface open endpoint is reserved');
  context.assert(schedules.get('surface.transition.layout').lane === 'transition', 'Surface layout uses transition lane');
  context.assert(schedules.get('surface.background.persist').preferIdle === true, 'Surface persistence prefers idle');
  context.assert(schedules.get('a11y.user-blocking.announce').metadata.fabricLane === 'a11y', 'Surface a11y schedule carries Fabric a11y lane');
  assertAllRouteReferencesResolve(context, fixture);
  assertAllComponentSchedulesResolve(context, fixture);
  assertSlotReferencesResolve(context, fixture);

  const rmtFormat = createRmtFormatFromBundle(context, rootDir);
  if (rmtFormat) {
    const normalizedDocument = rmtFormat.normalizeDocument(fixture);
    const registries = rmtFormat.createRuntimeRegistries(fixture);
    context.assert(normalizedDocument.manifest.documentId === 'fixture.xtend.surface-manager-workbench', 'RMT format normalizes SurfaceManager fixture document id');
    context.assert(normalizedDocument.adapters.length === 3, 'RMT format normalizes SurfaceManager adapters');
    context.assert(normalizedDocument.components.length === REQUIRED_COMPONENTS.length, 'RMT format normalizes SurfaceManager components');
    context.assert(normalizedDocument.routes.length === 1, 'RMT format normalizes SurfaceManager route');
    context.assert(normalizedDocument.schedules.length === REQUIRED_SCHEDULES.length, 'RMT format normalizes SurfaceManager schedules');
    context.assert(normalizedDocument.templates.length === 3, 'RMT format normalizes SurfaceManager templates');
    context.assert(registries.status === 'ready', 'SurfaceManager fixture creates ready runtime registries');
    context.assert(registries.diagnosticCount === 0, 'SurfaceManager fixture creates runtime registries without diagnostics');
    context.assert(registries.componentRegistry.ids.includes('workbench.manager'), 'SurfaceManager runtime registry indexes manager');
    context.assert(registries.componentRegistry.ids.includes('workbench.inspector'), 'SurfaceManager runtime registry indexes window');
  }

  context.assert(packageManifest.scripts['test:rmt-surface-authoring'] === 'node scripts/run_xtend_tests.js rmt-surface-authoring', 'Package exposes SurfaceManager authoring test script');
  context.assert(metadata && metadata.schema === SURFACE_MANAGER_RMT_AUTHORING_SCHEMA, 'Package metadata exposes SurfaceManager authoring schema');
  context.assert(metadata && metadata.reportSchema === SURFACE_MANAGER_RMT_AUTHORING_REPORT_SCHEMA, 'Package metadata exposes SurfaceManager authoring report schema');
  context.assert(metadata && metadata.workpackage === SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE, 'Package metadata exposes WP-SM-01');
  context.assert(metadata && metadata.contract === SURFACE_MANAGER_RMT_AUTHORING_CONTRACT, 'Package metadata exposes SurfaceManager contract path');
  context.assert(metadata && metadata.fixture === SURFACE_MANAGER_RMT_AUTHORING_FIXTURE, 'Package metadata exposes SurfaceManager fixture path');
  context.assert(metadata && metadata.localGate === SURFACE_MANAGER_RMT_AUTHORING_LOCAL_GATE, 'Package metadata exposes SurfaceManager local gate');
  context.assert(metadata && metadata.runtimeComponentsImplemented === false, 'Package metadata keeps runtime implementation deferred');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Package metadata hands off to WP-SM-02');
  context.assert(metadata && metadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata keeps kernel boundary');
  assertIncludesAll(context, metadata && metadata.componentTags, SURFACE_COMPONENT_TAGS, 'Package SurfaceManager component tags');
  assertIncludesAll(context, metadata && metadata.requiredSchedules, REQUIRED_SCHEDULES, 'Package SurfaceManager schedules');
  context.assertIncludes(scaffoldConfig, 'surfaceManagerRmtAuthoring', 'Scaffold config exposes SurfaceManager authoring');
  context.assertIncludes(scaffoldConfig, SURFACE_MANAGER_RMT_AUTHORING_SCHEMA, 'Scaffold config declares SurfaceManager authoring schema');
  context.assertIncludes(scaffoldConfig, SURFACE_MANAGER_RMT_AUTHORING_LOCAL_GATE, 'Scaffold config references SurfaceManager local gate');
  context.assertIncludes(runner, "id: 'rmt-surface-authoring'", 'Runner registers SurfaceManager authoring suite');

  assertTextIncludesAll(context, planningDoc, [
    SURFACE_MANAGER_RMT_AUTHORING_WORKPACKAGE,
    SURFACE_MANAGER_SCHEMA,
    SURFACE_RECORD_SCHEMA,
    NEXT_WORKPACKAGE
  ], 'SurfaceManager planning document');
  assertTextIncludesAll(context, contractDoc, [
    SURFACE_MANAGER_RMT_AUTHORING_SCHEMA,
    SURFACE_MANAGER_SCHEMA,
    SURFACE_RECORD_SCHEMA,
    'x-surface-manager',
    'x-surface-window',
    'x-side-panel',
    'component-records-with-metadata.surface',
    'surface.user-blocking.open',
    KERNEL_BOUNDARY,
    NEXT_WORKPACKAGE
  ], 'SurfaceManager contract doc');
  assertTextIncludesAll(context, workpackageDoc, [
    'Status: `completed`',
    SURFACE_MANAGER_RMT_AUTHORING_SCHEMA,
    SURFACE_MANAGER_RMT_AUTHORING_LOCAL_GATE,
    SURFACE_MANAGER_RMT_AUTHORING_FIXTURE,
    NEXT_WORKPACKAGE
  ], 'SurfaceManager workpackage doc');
  assertTextIncludesAll(context, docs, [
    SURFACE_MANAGER_RMT_AUTHORING_SCHEMA,
    'x-surface-manager',
    'x-surface-window',
    'x-side-panel',
    'xtend.surface',
    SURFACE_MANAGER_RMT_AUTHORING_LOCAL_GATE
  ], 'SurfaceManager docs page');
  context.assertIncludes(docsReadme, 'SurfaceManager RMT Authoring', 'Docs README links SurfaceManager authoring');
  context.assertIncludes(docsMenu, '"slug": "surface-manager-rmt-authoring"', 'Docs menu registers SurfaceManager authoring');
  context.assertIncludes(referenceRegistry, SURFACE_MANAGER_RMT_AUTHORING_SCHEMA, 'Reference registry mentions SurfaceManager authoring');
  context.assertIncludes(rmtSchema, '"components"', 'RMT schema still supports component-domain MVP');
  context.assertIncludes(rmtSchema, '"surface_adapter"', 'RMT schema now exposes surface_adapter through WP-SM-08');
  context.assertIncludes(rmtSchema, 'xtend.rmt.surfaces-domain.v1', 'RMT schema now exposes native surfaces domain through WP-SM-08');

  return context.result({
    report: {
      schema: SURFACE_MANAGER_RMT_AUTHORING_REPORT_SCHEMA,
      document: SURFACE_MANAGER_RMT_AUTHORING_FIXTURE,
      components: Array.isArray(fixture.components) ? fixture.components.length : 0,
      surfaceRecords: surfaceRecords.length,
      schedules: Array.isArray(fixture.schedules) ? fixture.schedules.length : 0,
      templates: Array.isArray(fixture.templates) ? fixture.templates.length : 0,
      nextWorkpackage: NEXT_WORKPACKAGE
    }
  });
}

function printRmtSurfaceManagerAuthoringReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT SurfaceManager authoring contract erfolgreich.',
    failureTitle: 'RMT SurfaceManager authoring contract fehlgeschlagen:'
  });
}

module.exports = {
  printRmtSurfaceManagerAuthoringReport,
  runRmtSurfaceManagerAuthoringSuite
};
