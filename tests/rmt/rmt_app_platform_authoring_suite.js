const fs = require('fs');
const path = require('path');
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
  KERNEL_BOUNDARY,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_ADAPTERS,
  REQUIRED_ARTIFACTS,
  REQUIRED_BOUNDARIES,
  REQUIRED_COMPONENT_ADAPTER_CAPABILITIES,
  REQUIRED_DOCS,
  REQUIRED_LANES,
  REQUIRED_PRIMITIVES,
  REQUIRED_SCHEDULES,
  REQUIRED_TEMPLATE_PRIMITIVES,
  RMT_APP_PLATFORM_AUTHORING_DOCS,
  RMT_APP_PLATFORM_AUTHORING_FIXTURE,
  RMT_APP_PLATFORM_AUTHORING_LOCAL_GATE,
  RMT_APP_PLATFORM_AUTHORING_MODULE,
  RMT_APP_PLATFORM_AUTHORING_PACKAGE_SCRIPT,
  RMT_APP_PLATFORM_AUTHORING_REPORT_SCHEMA,
  RMT_APP_PLATFORM_AUTHORING_SCHEMA,
  RMT_APP_PLATFORM_AUTHORING_STATUS,
  RMT_APP_PLATFORM_AUTHORING_SUITE,
  RMT_APP_PLATFORM_AUTHORING_TARGET,
  RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE,
  RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE_DOC,
  RMT_APP_PLATFORM_FIXTURE_SCHEMA,
  collectFixturePrimitiveCoverage,
  createRmtAppPlatformAuthoringPlan,
  createRmtAppPlatformAuthoringReport,
  validateRmtAppPlatformAuthoringPlan
} = require('../../catalog/epic18-rmt-app-platform-authoring');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, label) {
  const values = Array.isArray(actual) ? actual : [];
  expected.forEach((entry) => {
    context.assert(values.includes(entry), `${label} includes ${entry}`);
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

function collectScheduleLanes(fixture) {
  return (fixture.schedules || []).map((schedule) => schedule.lane).filter(Boolean);
}

function adapterById(fixture, id) {
  return (fixture.adapters || []).find((adapter) => adapter.id === id) || null;
}

function collectTemplateComponentRefs(node, refs = []) {
  if (!node || typeof node !== 'object') return refs;
  if (node.component) refs.push(node.component);
  Object.values(node).forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => collectTemplateComponentRefs(entry, refs));
    } else if (value && typeof value === 'object') {
      collectTemplateComponentRefs(value, refs);
    }
  });
  return refs;
}

function assertGraphReferencesResolve(context, fixture) {
  const routes = indexById(fixture.routes);
  const surfaces = indexById(fixture.surfaces);
  const slots = indexById(fixture.slots);
  const templates = indexById(fixture.templates);
  const components = indexById(fixture.components);
  const state = indexById(fixture.state);
  const selectors = indexById(fixture.selectors);
  const derive = indexById(fixture.derive);
  const bind = indexById(fixture.bind);
  const actions = indexById(fixture.actions);
  const effects = indexById(fixture.effects);
  const datasources = indexById(fixture.datasources);
  const resources = indexById(fixture.resources);
  const events = indexById(fixture.events);
  const schedules = indexById(fixture.schedules);

  (fixture.app.routes || []).forEach((routeId) => {
    context.assert(routes.has(routeId), `app route resolves ${routeId}`);
  });
  (fixture.app.surfaces || []).forEach((surfaceId) => {
    context.assert(surfaces.has(surfaceId), `app surface resolves ${surfaceId}`);
  });
  (fixture.app.state || []).forEach((stateId) => {
    context.assert(state.has(stateId), `app state resolves ${stateId}`);
  });
  context.assert(templates.has(fixture.app.shell), 'app shell template resolves');

  (fixture.routes || []).forEach((route) => {
    context.assert(surfaces.has(route.surface), `${route.id}: surface resolves`);
    context.assert(templates.has(route.template), `${route.id}: template resolves`);
    context.assert(schedules.has(route.schedule), `${route.id}: schedule resolves`);
  });

  (fixture.surfaces || []).forEach((surface) => {
    context.assert(templates.has(surface.template), `${surface.id}: template resolves`);
    context.assert(state.has(surface.state) || derive.has(surface.state), `${surface.id}: state or derived state resolves`);
  });

  (fixture.slots || []).forEach((slot) => {
    context.assert(templates.has(slot.owner), `${slot.id}: owner template resolves`);
    context.assert(templates.has(slot.template), `${slot.id}: slot template resolves`);
  });

  (fixture.templates || []).forEach((template) => {
    collectTemplateComponentRefs(template.root).forEach((componentId) => {
      context.assert(components.has(componentId), `${template.id}: component resolves ${componentId}`);
    });
    Object.values((template.root && template.root.slots) || {}).forEach((slotId) => {
      context.assert(slots.has(slotId), `${template.id}: slot resolves ${slotId}`);
    });
    ((template.root && template.root.bindings) || []).forEach((bindingId) => {
      context.assert(bind.has(bindingId), `${template.id}: binding resolves ${bindingId}`);
    });
    ((template.root && template.root.events) || []).forEach((eventId) => {
      context.assert(events.has(eventId), `${template.id}: event resolves ${eventId}`);
    });
    if (template.resource) {
      context.assert(resources.has(template.resource), `${template.id}: resource resolves`);
    }
  });

  (fixture.components || []).forEach((component) => {
    context.assert(adapterById(fixture, component.adapter), `${component.id}: adapter resolves`);
  });

  (fixture.selectors || []).forEach((selector) => {
    context.assert(state.has(selector.from) || selectors.has(selector.from), `${selector.id}: source resolves`);
    (selector.params || []).forEach((param) => {
      context.assert(state.has(param), `${selector.id}: param resolves ${param}`);
    });
  });

  (fixture.derive || []).forEach((derived) => {
    context.assert(state.has(derived.from) || selectors.has(derived.from) || derived.from === 'action.last-result', `${derived.id}: source resolves`);
  });

  (fixture.bind || []).forEach((binding) => {
    context.assert(components.has(binding.target), `${binding.id}: target component resolves`);
    context.assert(state.has(binding.from) || selectors.has(binding.from) || derive.has(binding.from), `${binding.id}: binding source resolves`);
  });

  (fixture.actions || []).forEach((action) => {
    if (action.datasource) context.assert(datasources.has(action.datasource), `${action.id}: datasource resolves`);
    if (action.effect) context.assert(effects.has(action.effect), `${action.id}: effect resolves`);
    if (action.result) context.assert(state.has(action.result), `${action.id}: result state resolves`);
    if (action.feedback) context.assert(events.has(action.feedback), `${action.id}: feedback event resolves`);
  });

  (fixture.effects || []).forEach((effect) => {
    context.assert(datasources.has(effect.datasource), `${effect.id}: datasource resolves`);
    context.assert(resources.has(effect.resource), `${effect.id}: resource resolves`);
    context.assert(REQUIRED_LANES.includes(effect.lane), `${effect.id}: lane is known`);
  });

  (fixture.resources || []).forEach((resource) => {
    if (resource.fallback) context.assert(templates.has(resource.fallback), `${resource.id}: fallback template resolves`);
  });

  (fixture.events || []).forEach((event) => {
    context.assert(components.has(event.source) || actions.has(event.source), `${event.id}: source resolves`);
    if (event.action) context.assert(actions.has(event.action), `${event.id}: action resolves`);
    context.assert(event.scope === 'app' || surfaces.has(event.scope), `${event.id}: scope resolves`);
  });
}

function runRmtAppPlatformAuthoringSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-app-platform-authoring',
    label: 'Epic 18 RMT App Platform authoring model'
  });
  const plan = createRmtAppPlatformAuthoringPlan({ rootDir });
  const validation = validateRmtAppPlatformAuthoringPlan(plan);
  const report = createRmtAppPlatformAuthoringReport({ rootDir, plan });
  const fixture = readJson(RMT_APP_PLATFORM_AUTHORING_FIXTURE, rootDir);
  const fixtureText = readText(RMT_APP_PLATFORM_AUTHORING_FIXTURE, rootDir);
  const docs = readText(RMT_APP_PLATFORM_AUTHORING_DOCS, rootDir);
  const workpackageDoc = readText(RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE_DOC, rootDir);
  const backlog = readText('development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md', rootDir);
  const epic = readText('development/docs-evidence/root/epic18-media-manager-vendor-upstream.md', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const moduleSyntax = syntaxCheckFile(RMT_APP_PLATFORM_AUTHORING_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_APP_PLATFORM_AUTHORING_SUITE, { rootDir, extension: '.js' });

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as RMT App Platform authoring artifact`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as RMT App Platform authoring doc`);
  });

  context.assert(moduleSyntax.ok, `RMT App Platform authoring module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `RMT App Platform authoring suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === RMT_APP_PLATFORM_AUTHORING_SCHEMA, 'App Platform authoring schema is stable');
  context.assert(plan.reportSchema === RMT_APP_PLATFORM_AUTHORING_REPORT_SCHEMA, 'App Platform authoring report schema is stable');
  context.assert(plan.fixtureSchema === RMT_APP_PLATFORM_FIXTURE_SCHEMA, 'App Platform authoring fixture schema is stable');
  context.assert(plan.workpackage === RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE, 'App Platform authoring belongs to WP-E18-04');
  context.assert(plan.status === RMT_APP_PLATFORM_AUTHORING_STATUS, 'App Platform authoring status is accepted');
  context.assert(plan.targetReadiness === RMT_APP_PLATFORM_AUTHORING_TARGET, 'App Platform authoring target is ready');
  context.assert(plan.localGate === RMT_APP_PLATFORM_AUTHORING_LOCAL_GATE, 'App Platform authoring local gate is stable');
  context.assert(plan.packageScript === RMT_APP_PLATFORM_AUTHORING_PACKAGE_SCRIPT, 'App Platform authoring package script is stable');
  context.assert(validation.ok === true, 'App Platform authoring plan validates');
  context.assert(report.ok === true, 'App Platform authoring report validates');
  context.assert(report.rendererImplemented === false && report.runtimeImplemented === false, 'WP-E18-04 does not claim renderer/runtime implementation');
  context.assert(report.productSurfaceTaxonomyAllowed === false, 'App Platform authoring rejects product surface taxonomy');
  context.assert(report.mediaManagerRecordRequired === false, 'App Platform authoring rejects product-specific record requirements');
  context.assert(report.innerHtmlHelperRequired === false, 'App Platform authoring rejects external innerHTML helper dependency');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'App Platform authoring keeps RMT kernel boundary');
  context.assert(plan.nextWorkpackage === NEXT_WORKPACKAGE, 'App Platform authoring hands off to WP-E18-05');
  context.assert(plan.nextDecision === NEXT_DECISION, 'App Platform authoring exposes next decision');
  assertIncludesAll(context, plan.requiredPrimitives, REQUIRED_PRIMITIVES, 'required authoring primitives');
  assertIncludesAll(context, plan.templatePrimitives, REQUIRED_TEMPLATE_PRIMITIVES, 'template primitives');
  assertIncludesAll(context, plan.requiredAdapters, REQUIRED_ADAPTERS, 'required adapters');
  assertIncludesAll(context, plan.componentAdapterCapabilities, REQUIRED_COMPONENT_ADAPTER_CAPABILITIES, 'component adapter capabilities');
  assertIncludesAll(context, plan.requiredSchedules, REQUIRED_SCHEDULES, 'required schedules');
  assertIncludesAll(context, plan.scheduleLanes, REQUIRED_LANES, 'schedule lanes');
  assertIncludesAll(context, plan.boundaries, REQUIRED_BOUNDARIES, 'authoring boundaries');

  context.assert(fixture.kind === 'rmt_document', 'fixture is an RMT document');
  context.assert(fixture.schema === RMT_APP_PLATFORM_FIXTURE_SCHEMA, 'fixture declares App Platform fixture schema');
  context.assert(fixture.manifest.metadata.contractVersion === RMT_APP_PLATFORM_AUTHORING_SCHEMA, 'fixture declares authoring contract');
  context.assert(fixture.manifest.metadata.workpackage === RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE, 'fixture is owned by WP-E18-04');
  context.assert(fixture.manifest.metadata.renderMode === 'shell-first', 'fixture remains shell-first');
  context.assert(fixture.manifest.metadata.productSurfaceClone === false, 'fixture forbids product surface clone');
  context.assert(fixture.manifest.metadata.manualHtmlRendererAllowed === false, 'fixture forbids manual HTML renderer');
  context.assert(fixture.manifest.metadata.trustedHtmlBoundary === 'xtend.rmt.trusted-dom-boundary.explicit', 'fixture exposes explicit trusted HTML boundary');
  context.assert(fixture.manifest.metadata.kernelBoundary === KERNEL_BOUNDARY, 'fixture carries RMT kernel boundary');
  context.assert(fixture.app.recordContract === 'domain.record.generic-item.v1', 'fixture uses a generic record contract');
  context.assert(Array.isArray(fixture.domains) && fixture.domains.length >= 3, 'fixture demonstrates multiple developer-defined domains');
  context.assert(fixture.domains.every((domain) => /^domain\.record\.generic/u.test(domain.recordContracts[0])), 'domain contracts remain generic');
  assertIncludesAll(context, collectFixturePrimitiveCoverage(fixture), REQUIRED_PRIMITIVES, 'fixture primitive coverage');
  assertIncludesAll(context, collectFixturePrimitiveCoverage(fixture), REQUIRED_TEMPLATE_PRIMITIVES, 'fixture template primitive coverage');
  assertIncludesAll(context, collectScheduleLanes(fixture), REQUIRED_LANES, 'fixture schedule lanes');
  REQUIRED_ADAPTERS.forEach((adapterId) => {
    context.assert(adapterById(fixture, adapterId), `fixture declares adapter ${adapterId}`);
  });
  const componentAdapter = adapterById(fixture, 'xtend.component');
  assertIncludesAll(context, componentAdapter && componentAdapter.capabilities, REQUIRED_COMPONENT_ADAPTER_CAPABILITIES, 'fixture component adapter capabilities');
  context.assert(componentAdapter && componentAdapter.kernelVisible === false, 'component adapter stays outside the RMT kernel');
  context.assert((fixture.templates || []).every((template) => template.renderMode === 'dom_descriptor' || template.renderMode === 'trusted_html'), 'templates declare explicit render modes');
  context.assert((fixture.templates || []).filter((template) => template.renderMode === 'trusted_html').every((template) => template.trustedBoundary === 'xtend.rmt.trusted-dom-boundary.explicit'), 'trusted HTML templates require explicit boundary');
  context.assert((fixture.templates || []).filter((template) => template.renderMode === 'dom_descriptor').every((template) => !template.html && !template.innerHTML), 'structured templates do not carry raw HTML sinks');
  assertGraphReferencesResolve(context, fixture);
  context.assert(!/Media\s*Manager|media-manager|mediaManager|MediaRecord|mediaRecord|explorer\.|player\./u.test(fixtureText), 'fixture contains no Media Manager product taxonomy or record dependency');

  assertTextIncludesAll(context, docs, [
    '# RMT App Platform Authoring',
    RMT_APP_PLATFORM_AUTHORING_SCHEMA,
    'app',
    'route',
    'surface',
    'template',
    'state',
    'datasource',
    'trusted-html-explicit-boundary-only',
    NEXT_WORKPACKAGE
  ], 'App Platform authoring docs');
  assertTextIncludesAll(context, workpackageDoc, [
    RMT_APP_PLATFORM_AUTHORING_WORKPACKAGE,
    RMT_APP_PLATFORM_AUTHORING_SCHEMA,
    RMT_APP_PLATFORM_AUTHORING_LOCAL_GATE,
    'no-media-manager-product-surface-clone',
    NEXT_WORKPACKAGE
  ], 'WP-E18-04 workpackage doc');
  context.assert(backlog.includes('| `WP-E18-04` | P0 | completed'), 'Backlog marks WP-E18-04 completed');
  context.assert(
    backlog.includes('| `WP-E18-05` | P0 | ready') || backlog.includes('| `WP-E18-05` | P0 | completed'),
    'Backlog marks WP-E18-05 ready or completed after authoring model'
  );
  context.assert(epic.includes('| `WP-E18-04` | P0 | completed'), 'Epic marks WP-E18-04 completed');
  context.assert(epic.includes('rmt-app-platform-authoring'), 'Epic gate chain includes App Platform authoring gate');
  context.assert(runner.hasImplementation({ path: "tests/rmt/rmt_app_platform_authoring_suite.js" }), 'Runner imports App Platform authoring suite');
  context.assert(runner.hasSuite("rmt-app-platform-authoring"), 'Runner registers App Platform authoring suite');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:rmt-app-platform-authoring'] === 'node scripts/run_xtend_tests.js rmt-app-platform-authoring', 'Package exposes App Platform authoring script');

  return context.result({
    schema: RMT_APP_PLATFORM_AUTHORING_REPORT_SCHEMA,
    fixture: RMT_APP_PLATFORM_AUTHORING_FIXTURE,
    primitiveCount: REQUIRED_PRIMITIVES.length
  });
}

function printRmtAppPlatformAuthoringReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 18 RMT App Platform Authoring Model erfolgreich.',
    failureTitle: 'Epic 18 RMT App Platform Authoring Model fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runRmtAppPlatformAuthoringSuite();
  printRmtAppPlatformAuthoringReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printRmtAppPlatformAuthoringReport,
  runRmtAppPlatformAuthoringSuite
};
