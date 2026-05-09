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
  buildSemanticGraph
} = require('../../tools/rmt-language/semantic-graph');
const {
  AUTHORING_MODES,
  COMPONENT_LAB_PANELS,
  KERNEL_BOUNDARY,
  MIGRATION_STEPS,
  RELEASE_GATES,
  REQUIRED_ARTIFACTS,
  REQUIRED_DOCS,
  REQUIRED_PREVIOUS_CONTRACTS,
  SURFACE_ADAPTER_SCHEMA,
  SURFACE_MANAGER_AUTHORING_GUIDE,
  SURFACE_MANAGER_COMPONENT_LAB_DOCS,
  SURFACE_MANAGER_COMPONENT_LAB_FIXTURE,
  SURFACE_MANAGER_COMPONENT_LAB_FIXTURE_SCHEMA,
  SURFACE_MANAGER_MIGRATION_GUIDE,
  SURFACE_MANAGER_RELEASE_HANDOFF_CONTRACT,
  SURFACE_MANAGER_RELEASE_HANDOFF_DOCS,
  SURFACE_MANAGER_RELEASE_HANDOFF_LOCAL_GATE,
  SURFACE_MANAGER_RELEASE_HANDOFF_MODULE,
  SURFACE_MANAGER_RELEASE_HANDOFF_PACKAGE_SCRIPT,
  SURFACE_MANAGER_RELEASE_HANDOFF_PLAN,
  SURFACE_MANAGER_RELEASE_HANDOFF_REPORT_SCHEMA,
  SURFACE_MANAGER_RELEASE_HANDOFF_SCHEMA,
  SURFACE_MANAGER_RELEASE_HANDOFF_STATUS,
  SURFACE_MANAGER_RELEASE_HANDOFF_SUITE,
  SURFACE_MANAGER_RELEASE_HANDOFF_TARGET,
  SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE,
  SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE_DOC,
  SURFACE_NATIVE_RMT_SCHEMA,
  SURFACE_RECORD_SCHEMA,
  createSurfaceManagerReleaseHandoffPlan,
  createSurfaceManagerReleaseHandoffReport,
  validateSurfaceManagerReleaseHandoffPlan
} = require('../../catalog/surface-manager-release-handoff');

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

function collectComponentSurfaceRecords(document) {
  return (document.components || []).filter((component) => component.metadata && component.metadata.surface);
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
    navigator: { userAgent: 'xtend-surface-release-handoff-test' },
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
    context.fail(`RMT core bundle evaluates for Surface release handoff (${error.message})`);
    return null;
  }

  const factory = sandbox.AppModules && sandbox.AppModules.createRmtFormat;
  if (!context.assert(typeof factory === 'function', 'RMT core bundle exposes createRmtFormat for Surface release handoff')) {
    return null;
  }
  return factory();
}

function assertSurfaceReferencesResolve(context, fixture) {
  const adapters = indexById(fixture.adapters);
  const components = indexById(fixture.components);
  const routes = indexById(fixture.routes);
  const schedules = indexById(fixture.schedules);

  fixture.surfaces.forEach((surface, index) => {
    context.assert(adapters.has(surface.adapter), `surfaces[${index}].adapter resolves`);
    context.assert(components.has(surface.manager), `surfaces[${index}].manager resolves`);
    context.assert(components.has(surface.component), `surfaces[${index}].component resolves`);
    context.assert(routes.has(surface.route), `surfaces[${index}].route resolves`);
    context.assert(schedules.has(surface.schedule), `surfaces[${index}].schedule resolves`);
    context.assert(surface.schema === SURFACE_RECORD_SCHEMA, `surfaces[${index}] declares surface record schema`);
    context.assert(surface.metadata && surface.metadata.componentLabPanel, `surfaces[${index}] binds a Component Lab panel`);
  });
}

function assertNativeAndComponentRecordsMatch(context, fixture) {
  const components = indexById(fixture.components);
  const componentSurfaceRecords = collectComponentSurfaceRecords(fixture);

  context.assert(componentSurfaceRecords.length === fixture.surfaces.length, 'Component Lab fixture keeps one component metadata surface per native surface');
  fixture.surfaces.forEach((surface) => {
    const component = components.get(surface.component);
    const metadataSurface = component && component.metadata ? component.metadata.surface : null;
    context.assert(metadataSurface && metadataSurface.id === surface.id, `${surface.id}: component metadata keeps same surface id`);
    context.assert(metadataSurface && metadataSurface.type === surface.type, `${surface.id}: component metadata keeps same surface type`);
    context.assert(metadataSurface && metadataSurface.stateKey === surface.stateKey, `${surface.id}: component metadata keeps same state key`);
    context.assert(metadataSurface && metadataSurface.nativeRecord, `${surface.id}: component metadata points to native record`);
  });
}

function runSurfaceManagerReleaseHandoffSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'surface-release-handoff',
    label: 'SurfaceManager docs, Component Lab and migration release handoff'
  });
  const plan = createSurfaceManagerReleaseHandoffPlan({ rootDir });
  const validation = validateSurfaceManagerReleaseHandoffPlan(plan);
  const report = createSurfaceManagerReleaseHandoffReport({ rootDir, plan });
  const fixture = readJson(SURFACE_MANAGER_COMPONENT_LAB_FIXTURE, rootDir);
  const fixtureText = readText(SURFACE_MANAGER_COMPONENT_LAB_FIXTURE, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerReleaseHandoff;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const planningDoc = readText(SURFACE_MANAGER_RELEASE_HANDOFF_PLAN, rootDir);
  const contractDoc = readText(SURFACE_MANAGER_RELEASE_HANDOFF_CONTRACT, rootDir);
  const workpackageDoc = readText(SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE_DOC, rootDir);
  const releaseDocs = readText(SURFACE_MANAGER_RELEASE_HANDOFF_DOCS, rootDir);
  const authoringGuide = readText(SURFACE_MANAGER_AUTHORING_GUIDE, rootDir);
  const componentLabDocs = readText(SURFACE_MANAGER_COMPONENT_LAB_DOCS, rootDir);
  const migrationGuide = readText(SURFACE_MANAGER_MIGRATION_GUIDE, rootDir);
  const componentLabIndex = readText('docs/component-lab.md', rootDir);
  const nativeAuthoring = readText('docs/xtendrmt-native-authoring.md', rootDir);
  const nativeMigration = readText('docs/xtendrmt-migration-guide.md', rootDir);
  const nativeSurfacesDocs = readText('docs/surface-manager-native-rmt-surfaces.md', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const rmtReadme = readText('tests/rmt/README.md', rootDir);
  const referenceRegistry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as Surface release handoff artifact`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as Surface release handoff doc`);
  });
  [
    SURFACE_MANAGER_RELEASE_HANDOFF_MODULE,
    SURFACE_MANAGER_RELEASE_HANDOFF_SUITE,
    'scripts/run_xtend_tests.js'
  ].forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  context.assert(plan.schema === SURFACE_MANAGER_RELEASE_HANDOFF_SCHEMA, 'Surface release handoff schema is stable');
  context.assert(plan.reportSchema === SURFACE_MANAGER_RELEASE_HANDOFF_REPORT_SCHEMA, 'Surface release handoff report schema is stable');
  context.assert(plan.componentLabFixtureSchema === SURFACE_MANAGER_COMPONENT_LAB_FIXTURE_SCHEMA, 'Surface Component Lab fixture schema is stable');
  context.assert(plan.workpackage === SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE, 'Surface release handoff belongs to WP-SM-09');
  context.assert(plan.status === SURFACE_MANAGER_RELEASE_HANDOFF_STATUS, 'Surface release handoff status is accepted');
  context.assert(plan.targetReadiness === SURFACE_MANAGER_RELEASE_HANDOFF_TARGET, 'Surface release handoff target is ready');
  context.assert(plan.nativeRmtSchema === SURFACE_NATIVE_RMT_SCHEMA, 'Surface release handoff references native RMT surfaces schema');
  context.assert(plan.surfaceAdapterSchema === SURFACE_ADAPTER_SCHEMA, 'Surface release handoff references surface adapter schema');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'Surface release handoff keeps kernel boundary');
  context.assert(validation.ok === true, 'Surface release handoff plan validates');
  context.assert(report.ok === true, 'Surface release handoff report validates');
  assertIncludesAll(context, plan.previousContracts, REQUIRED_PREVIOUS_CONTRACTS, 'Surface release previous contracts');
  assertIncludesAll(context, plan.authoringModes, AUTHORING_MODES, 'Surface release authoring modes');
  assertIncludesAll(context, plan.componentLabPanels, COMPONENT_LAB_PANELS, 'Surface release Component Lab panels');
  assertIncludesAll(context, plan.migrationSteps, MIGRATION_STEPS, 'Surface release migration steps');
  assertIncludesAll(context, plan.releaseGates, RELEASE_GATES, 'Surface release gates');
  context.assert(plan.releaseDecision.readyForAppShellAuthoring === true, 'Surface release is ready for App Shell authoring');
  context.assert(plan.releaseDecision.readyForNativeSurfacesAuthoring === true, 'Surface release is ready for native surfaces authoring');
  context.assert(plan.featureFlags.surfaceAdapterRuntimeImplemented === false, 'xtend.surface runtime implementation remains deferred');
  context.assert(plan.featureFlags.createsSecondRegistry === false, 'Surface release does not create a second registry');
  context.assert(plan.featureFlags.rmtKernelImportsXtendTypes === false, 'Surface release keeps RMT kernel clean');

  context.assert(fixture.kind === 'rmt_document', 'Surface Component Lab fixture is an RMT document');
  context.assert(fixture.manifest.metadata.contractVersion === SURFACE_MANAGER_RELEASE_HANDOFF_SCHEMA, 'Surface Component Lab fixture declares release handoff schema');
  context.assert(fixture.manifest.metadata.componentLabFixture === SURFACE_MANAGER_COMPONENT_LAB_FIXTURE_SCHEMA, 'Surface Component Lab fixture declares fixture schema');
  context.assert(fixture.manifest.metadata.workpackage === SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE, 'Surface Component Lab fixture belongs to WP-SM-09');
  context.assert(fixture.manifest.metadata.preferredAuthoringPath === 'surfaces[*]', 'Surface Component Lab fixture prefers native surfaces');
  assertIncludesAll(context, fixture.manifest.metadata.authoringModes, AUTHORING_MODES, 'Surface Component Lab fixture authoring modes');
  assertIncludesAll(context, fixture.manifest.metadata.componentLabPanels, COMPONENT_LAB_PANELS, 'Surface Component Lab fixture panels');
  assertIncludesAll(context, fixture.adapters.map((adapter) => adapter.id), ['xtend.component', 'xtend.xrouter', 'rmt.state-scheduler-diagnostics', 'xtend.surface'], 'Surface Component Lab fixture adapters');
  const surfaceAdapter = fixture.adapters.find((adapter) => adapter.id === 'xtend.surface');
  context.assert(surfaceAdapter && surfaceAdapter.kind === 'surface_adapter', 'Surface Component Lab fixture exposes surface_adapter');
  context.assert(surfaceAdapter && surfaceAdapter.metadata && surfaceAdapter.metadata.runtimeImplemented === false, 'Surface Component Lab fixture keeps xtend.surface runtime deferred');
  context.assert(Array.isArray(fixture.surfaces) && fixture.surfaces.length === 5, 'Surface Component Lab fixture declares five native surfaces');
  assertIncludesAll(context, fixture.surfaces.map((surface) => surface.type), ['window', 'side-panel', 'dialog'], 'Surface Component Lab fixture surface types');
  assertSurfaceReferencesResolve(context, fixture);
  assertNativeAndComponentRecordsMatch(context, fixture);

  const rmtFormat = createRmtFormatFromBundle(context, rootDir);
  if (rmtFormat) {
    const normalizedDocument = rmtFormat.normalizeDocument(fixture);
    context.assert(Array.isArray(normalizedDocument.surfaces) && normalizedDocument.surfaces.length === 5, 'RMT normalizer preserves Surface Component Lab native surfaces');
    context.assert(normalizedDocument.normalization && normalizedDocument.normalization.domains.surfaces.source === 'top-level', 'RMT normalizer reads Component Lab surfaces from top-level domain');
    context.assert(normalizedDocument.normalization.referenceGraph.surfaces.includes('surface.lab.preview'), 'RMT normalizer indexes Surface Component Lab surface ids');
  }

  const graph = buildSemanticGraph({
    text: fixtureText,
    filePath: resolveRepoPath(SURFACE_MANAGER_COMPONENT_LAB_FIXTURE, rootDir)
  }, { rootDir });
  context.assert(graph.ok === true, 'Semantic graph accepts Surface Component Lab fixture');
  context.assert(graph.indexes.surfaces.byId.has('surface.lab.preview'), 'Semantic graph indexes Surface Component Lab surfaces');
  context.assert(graph.findReferenceAtPointer('/surfaces/0/component').resolved === true, 'Semantic graph resolves Component Lab surface component');
  context.assert(graph.findReferenceAtPointer('/surfaces/0/manager').resolved === true, 'Semantic graph resolves Component Lab surface manager');
  context.assert(graph.findReferenceAtPointer('/surfaces/0/route').resolved === true, 'Semantic graph resolves Component Lab surface route');
  context.assert(graph.findReferenceAtPointer('/surfaces/0/schedule').resolved === true, 'Semantic graph resolves Component Lab surface schedule');

  context.assert(metadata && metadata.schema === SURFACE_MANAGER_RELEASE_HANDOFF_SCHEMA, 'Package metadata exposes Surface release handoff schema');
  context.assert(metadata && metadata.workpackage === SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE, 'Package metadata exposes WP-SM-09');
  context.assert(metadata && metadata.componentLabFixture === SURFACE_MANAGER_COMPONENT_LAB_FIXTURE, 'Package metadata exposes Surface Component Lab fixture');
  context.assert(metadata && metadata.localGate === SURFACE_MANAGER_RELEASE_HANDOFF_LOCAL_GATE, 'Package metadata exposes Surface release handoff local gate');
  context.assert(metadata && metadata.packageScript === SURFACE_MANAGER_RELEASE_HANDOFF_PACKAGE_SCRIPT, 'Package metadata exposes Surface release handoff package script');
  assertIncludesAll(context, metadata && metadata.releaseGates, RELEASE_GATES, 'Package metadata Surface release gates');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:surface-release-handoff'] === 'node scripts/run_xtend_tests.js surface-release-handoff', 'Package script test:surface-release-handoff exists');
  context.assertIncludes(scaffoldConfig, 'surfaceManagerReleaseHandoff', 'Scaffold config exposes surfaceManagerReleaseHandoff');
  context.assertIncludes(scaffoldConfig, SURFACE_MANAGER_RELEASE_HANDOFF_SCHEMA, 'Scaffold config references Surface release handoff schema');
  context.assertIncludes(scaffoldConfig, SURFACE_MANAGER_COMPONENT_LAB_FIXTURE, 'Scaffold config references Surface Component Lab fixture');
  context.assertIncludes(scaffoldConfig, SURFACE_MANAGER_RELEASE_HANDOFF_LOCAL_GATE, 'Scaffold config references Surface release gate');
  context.assertIncludes(runner, "require('../tests/rmt/surface_manager_release_handoff_suite')", 'Runner imports Surface release handoff suite');
  context.assertIncludes(runner, "id: 'surface-release-handoff'", 'Runner registers Surface release handoff suite');

  assertTextIncludesAll(context, contractDoc, [
    SURFACE_MANAGER_RELEASE_HANDOFF_SCHEMA,
    SURFACE_MANAGER_COMPONENT_LAB_FIXTURE_SCHEMA,
    SURFACE_NATIVE_RMT_SCHEMA,
    SURFACE_ADAPTER_SCHEMA,
    SURFACE_MANAGER_RELEASE_HANDOFF_LOCAL_GATE,
    KERNEL_BOUNDARY
  ], 'Surface release handoff contract doc');
  assertTextIncludesAll(context, workpackageDoc, [
    'Status: completed',
    SURFACE_MANAGER_RELEASE_HANDOFF_SCHEMA,
    SURFACE_MANAGER_COMPONENT_LAB_FIXTURE,
    SURFACE_MANAGER_RELEASE_HANDOFF_LOCAL_GATE
  ], 'Surface release handoff workpackage doc');
  assertTextIncludesAll(context, authoringGuide, [
    SURFACE_MANAGER_RELEASE_HANDOFF_SCHEMA,
    'components[*].metadata.surface',
    'surfaces[*]',
    'native-surfaces-preferred',
    SURFACE_MANAGER_COMPONENT_LAB_FIXTURE
  ], 'Surface authoring guide');
  assertTextIncludesAll(context, componentLabDocs, [
    SURFACE_MANAGER_COMPONENT_LAB_FIXTURE_SCHEMA,
    SURFACE_MANAGER_COMPONENT_LAB_FIXTURE,
    'surface-preview',
    'native-rmt-inspector',
    'migration-diff',
    'quality-gates',
    'source-links'
  ], 'Surface Component Lab docs');
  assertTextIncludesAll(context, migrationGuide, [
    SURFACE_MANAGER_RELEASE_HANDOFF_SCHEMA,
    'inventory-component-metadata-surfaces',
    'add-native-surfaces-records',
    'keep-dual-records-during-handoff',
    'xtend.surface'
  ], 'Surface migration guide');
  assertTextIncludesAll(context, releaseDocs, [
    SURFACE_MANAGER_RELEASE_HANDOFF_SCHEMA,
    SURFACE_MANAGER_RELEASE_HANDOFF_LOCAL_GATE,
    'surface-native-rmt',
    'surface-manager-quality',
    'no-public-runtime-claim-for-xtend.surface-adapter-yet'
  ], 'Surface release handoff docs');
  context.assertIncludes(componentLabIndex, 'SurfaceManager Component Lab', 'Component Lab docs link SurfaceManager Component Lab');
  context.assertIncludes(nativeAuthoring, SURFACE_MANAGER_AUTHORING_GUIDE, 'Native authoring guide links Surface authoring guide');
  context.assertIncludes(nativeMigration, SURFACE_MANAGER_MIGRATION_GUIDE, 'Native migration guide links Surface migration guide');
  context.assertIncludes(nativeSurfacesDocs, SURFACE_MANAGER_RELEASE_HANDOFF_DOCS, 'Native surfaces docs link release handoff');
  context.assertIncludes(docsReadme, 'SurfaceManager Authoring Guide', 'Docs README links Surface authoring guide');
  context.assertIncludes(docsReadme, 'SurfaceManager Migration Guide', 'Docs README links Surface migration guide');
  context.assertIncludes(docsReadme, 'SurfaceManager Component Lab', 'Docs README links Surface Component Lab');
  context.assertIncludes(docsReadme, 'SurfaceManager Release Handoff', 'Docs README links Surface release handoff');
  ['surface-manager-authoring-guide', 'surface-manager-migration-guide', 'surface-manager-component-lab', 'surface-manager-release-handoff'].forEach((slug) => {
    context.assertIncludes(docsMenu, slug, `Docs menu contains ${slug}`);
  });
  context.assertIncludes(testsReadme, SURFACE_MANAGER_RELEASE_HANDOFF_LOCAL_GATE, 'Tests README documents Surface release handoff gate');
  context.assertIncludes(rmtReadme, SURFACE_MANAGER_RELEASE_HANDOFF_LOCAL_GATE, 'RMT README documents Surface release handoff gate');
  context.assertIncludes(referenceRegistry, 'WP-SM-09', 'Reference registry contains WP-SM-09');
  context.assertIncludes(referenceRegistry, SURFACE_MANAGER_COMPONENT_LAB_FIXTURE, 'Reference registry contains Surface Component Lab fixture');
  context.assertIncludes(referenceRegistry, SURFACE_MANAGER_RELEASE_HANDOFF_SUITE, 'Reference registry contains Surface release suite');
  context.assertIncludes(planningDoc, '`WP-SM-09` | P2 | completed', 'Planning doc marks WP-SM-09 completed');
  context.assertIncludes(planningDoc, 'Handoff nach WP-SM-09', 'Planning doc contains WP-SM-09 handoff');

  return context.result({
    report: {
      schema: SURFACE_MANAGER_RELEASE_HANDOFF_REPORT_SCHEMA,
      workpackage: SURFACE_MANAGER_RELEASE_HANDOFF_WORKPACKAGE,
      fixture: SURFACE_MANAGER_COMPONENT_LAB_FIXTURE,
      surfaces: Array.isArray(fixture.surfaces) ? fixture.surfaces.length : 0,
      releaseGates: RELEASE_GATES.length,
      componentLabPanels: COMPONENT_LAB_PANELS.length
    }
  });
}

function printSurfaceManagerReleaseHandoffReport(result) {
  printSuiteReport(result, {
    successTitle: 'SurfaceManager Release Handoff erfolgreich.',
    failureTitle: 'SurfaceManager Release Handoff fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceManagerReleaseHandoffReport,
  runSurfaceManagerReleaseHandoffSuite
};

if (require.main === module) {
  const result = runSurfaceManagerReleaseHandoffSuite();
  printSurfaceManagerReleaseHandoffReport(result);
  process.exit(result.ok ? 0 : 1);
}
