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
  getRmtCompletions,
  inferCompletionContext
} = require('../../tools/rmt-language/completions');
const {
  lintRmtSource
} = require('../../tools/rmt-language/diagnostics');
const {
  KERNEL_BOUNDARY,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_ADAPTERS,
  REQUIRED_ARTIFACTS,
  REQUIRED_DOCS,
  REQUIRED_DOMAINS,
  SURFACE_ADAPTER_ID,
  SURFACE_ADAPTER_KIND,
  SURFACE_ADAPTER_OPERATIONS,
  SURFACE_ADAPTER_SCHEMA,
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_DOMAIN,
  SURFACE_FIELDS,
  SURFACE_MANAGER_NATIVE_RMT_CONTRACT,
  SURFACE_MANAGER_NATIVE_RMT_DOCS,
  SURFACE_MANAGER_NATIVE_RMT_FIXTURE,
  SURFACE_MANAGER_NATIVE_RMT_LOCAL_GATE,
  SURFACE_MANAGER_NATIVE_RMT_MODULE,
  SURFACE_MANAGER_NATIVE_RMT_PACKAGE_SCRIPT,
  SURFACE_MANAGER_NATIVE_RMT_PLAN,
  SURFACE_MANAGER_NATIVE_RMT_REPORT_SCHEMA,
  SURFACE_MANAGER_NATIVE_RMT_SCHEMA,
  SURFACE_MANAGER_NATIVE_RMT_STATUS,
  SURFACE_MANAGER_NATIVE_RMT_SUITE,
  SURFACE_MANAGER_NATIVE_RMT_TARGET,
  SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE,
  SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE_DOC,
  SURFACE_MANAGER_SCHEMA,
  SURFACE_QUALITY_GATES_SCHEMA,
  SURFACE_RECORD_SCHEMA,
  SURFACE_REFERENCE_CHECKS,
  SURFACE_SNAPSHOT_SCHEMA,
  SURFACE_TYPES,
  TOOLING_ARTIFACTS,
  createSurfaceManagerNativeRmtSurfacesPlan,
  createSurfaceManagerNativeRmtSurfacesReport,
  validateSurfaceManagerNativeRmtSurfacesPlan
} = require('../../catalog/surface-manager-native-rmt-surfaces');

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

function collectSurfaceMetadataRecords(document) {
  return (document.components || []).filter((component) => component.metadata && component.metadata.surface);
}

function findAdapter(document, adapterId) {
  return (document.adapters || []).find((adapter) => adapter.id === adapterId) || null;
}

function labels(report) {
  return (report.items || []).map((item) => item.label);
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
    navigator: { userAgent: 'xtend-native-surfaces-test' },
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
    context.fail(`RMT core bundle evaluates for native surfaces (${error.message})`);
    return null;
  }

  const factory = sandbox.AppModules && sandbox.AppModules.createRmtFormat;
  if (!context.assert(typeof factory === 'function', 'RMT core bundle exposes createRmtFormat for native surfaces')) {
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
    context.assert(surface.metadata && surface.metadata.migrationSource, `surfaces[${index}] carries migration source`);
  });
}

function assertNativeAndComponentRecordsMatch(context, fixture) {
  const componentSurfaceRecords = collectSurfaceMetadataRecords(fixture);
  const componentsById = indexById(fixture.components);

  context.assert(componentSurfaceRecords.length === fixture.surfaces.length, 'Native surface fixture keeps one component metadata surface per native surface');
  fixture.surfaces.forEach((surface) => {
    const component = componentsById.get(surface.component);
    const metadataSurface = component && component.metadata ? component.metadata.surface : null;
    context.assert(metadataSurface && metadataSurface.id === surface.id, `${surface.id}: component metadata keeps same surface id`);
    context.assert(metadataSurface && metadataSurface.type === surface.type, `${surface.id}: component metadata keeps same surface type`);
    context.assert(metadataSurface && metadataSurface.stateKey === surface.stateKey, `${surface.id}: component metadata keeps same state key`);
    context.assert(metadataSurface && metadataSurface.nativeRecord, `${surface.id}: component metadata points back to native record`);
  });
}

function runSurfaceManagerNativeRmtSurfacesSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'surface-native-rmt',
    label: 'SurfaceManager native RMT surfaces domain and xtend.surface adapter handoff'
  });
  const plan = createSurfaceManagerNativeRmtSurfacesPlan({ rootDir });
  const validation = validateSurfaceManagerNativeRmtSurfacesPlan(plan);
  const report = createSurfaceManagerNativeRmtSurfacesReport({ rootDir, plan });
  const fixture = readJson(SURFACE_MANAGER_NATIVE_RMT_FIXTURE, rootDir);
  const fixtureText = readText(SURFACE_MANAGER_NATIVE_RMT_FIXTURE, rootDir);
  const schema = readJson('xtendrmt/rmt.schema.json', rootDir);
  const schemaText = readText('xtendrmt/rmt.schema.json', rootDir);
  const coreTypes = readText('xtendrmt/rmt-core.d.ts', rootDir);
  const coreBundle = readText('xtendrmt/rmt-core.esm.js', rootDir);
  const runtimeBundle = readText('xtendrmt/rmt-runtime.esm.js', rootDir);
  const browserBundle = readText('xtendrmt/rmt-runtime.browser.js', rootDir);
  const semanticGraph = readText('tools/rmt-language/semantic-graph.js', rootDir);
  const completions = readText('tools/rmt-language/completions.js', rootDir);
  const linterDiagnostics = readText('tools/rmt-language/diagnostics.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerNativeRmtSurfaces;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const planningDoc = readText(SURFACE_MANAGER_NATIVE_RMT_PLAN, rootDir);
  const contractDoc = readText(SURFACE_MANAGER_NATIVE_RMT_CONTRACT, rootDir);
  const workpackageDoc = readText(SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE_DOC, rootDir);
  const docs = readText(SURFACE_MANAGER_NATIVE_RMT_DOCS, rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const rmtReadme = readText('tests/rmt/README.md', rootDir);
  const referenceRegistry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as native surfaces artifact`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as native surfaces doc`);
  });

  [
    SURFACE_MANAGER_NATIVE_RMT_MODULE,
    SURFACE_MANAGER_NATIVE_RMT_SUITE,
    'tools/rmt-language/semantic-graph.js',
    'tools/rmt-language/completions.js',
    'tools/rmt-language/diagnostics.js'
  ].forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  context.assert(plan.schema === SURFACE_MANAGER_NATIVE_RMT_SCHEMA, 'Native surfaces schema is stable');
  context.assert(plan.reportSchema === SURFACE_MANAGER_NATIVE_RMT_REPORT_SCHEMA, 'Native surfaces report schema is stable');
  context.assert(plan.adapterSchema === SURFACE_ADAPTER_SCHEMA, 'Native surfaces adapter schema is stable');
  context.assert(plan.surfaceManagerSchema === SURFACE_MANAGER_SCHEMA, 'Native surfaces reuses manager schema');
  context.assert(plan.surfaceRecordSchema === SURFACE_RECORD_SCHEMA, 'Native surfaces reuses record schema');
  context.assert(plan.surfaceControllerSchema === SURFACE_CONTROLLER_SCHEMA, 'Native surfaces reuses controller schema');
  context.assert(plan.snapshotSchema === SURFACE_SNAPSHOT_SCHEMA, 'Native surfaces reuses snapshot schema');
  context.assert(plan.qualityGatesSchema === SURFACE_QUALITY_GATES_SCHEMA, 'Native surfaces uses WP-SM-07 as regression base');
  context.assert(plan.workpackage === SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE, 'Native surfaces belongs to WP-SM-08');
  context.assert(plan.status === SURFACE_MANAGER_NATIVE_RMT_STATUS, 'Native surfaces status is accepted');
  context.assert(plan.targetReadiness === SURFACE_MANAGER_NATIVE_RMT_TARGET, 'Native surfaces target is ready');
  context.assert(plan.domain === SURFACE_DOMAIN, 'Native surfaces declares top-level surfaces domain');
  context.assert(plan.adapterId === SURFACE_ADAPTER_ID, 'Native surfaces declares xtend.surface adapter');
  context.assert(plan.adapterKind === SURFACE_ADAPTER_KIND, 'Native surfaces declares surface_adapter kind');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'Native surfaces keeps kernel boundary');
  context.assert(plan.nextWorkpackage === NEXT_WORKPACKAGE, 'Native surfaces hands off to WP-SM-09');
  context.assert(plan.nextDecision === NEXT_DECISION, 'Native surfaces exposes next decision');
  context.assert(validation.ok === true, 'Native surfaces plan validates');
  context.assert(report.ok === true, 'Native surfaces report validates');
  assertIncludesAll(context, plan.requiredDomains, REQUIRED_DOMAINS, 'Native surfaces required domains');
  assertIncludesAll(context, plan.requiredAdapters, REQUIRED_ADAPTERS, 'Native surfaces required adapters');
  assertIncludesAll(context, plan.surfaceTypes, SURFACE_TYPES, 'Native surfaces surface types');
  assertIncludesAll(context, plan.surfaceFields, SURFACE_FIELDS, 'Native surfaces fields');
  assertIncludesAll(context, plan.referenceChecks, SURFACE_REFERENCE_CHECKS, 'Native surfaces reference checks');
  assertIncludesAll(context, plan.adapterOperations, SURFACE_ADAPTER_OPERATIONS, 'Native surfaces adapter operations');
  context.assert(plan.featureFlags.nativeSurfacesDomainDesigned === true, 'Native surfaces domain is designed');
  context.assert(plan.featureFlags.rmtSchemaSynchronized === true, 'RMT schema is synchronized');
  context.assert(plan.featureFlags.rmtTypesSynchronized === true, 'RMT types are synchronized');
  context.assert(plan.featureFlags.rmtNormalizerReadsSurfaces === true, 'RMT normalizer reads surfaces');
  context.assert(plan.featureFlags.surfaceAdapterRuntimeImplemented === false, 'xtend.surface runtime implementation remains deferred');
  context.assert(plan.featureFlags.componentRecordCompatibilityKept === true, 'Component metadata compatibility is kept');
  context.assert(plan.featureFlags.createsSecondRegistry === false, 'Native surfaces do not create second registry');

  context.assert(fixture.kind === 'rmt_document', 'Native surfaces fixture is an RMT document');
  context.assert(fixture.manifest.metadata.contractVersion === SURFACE_MANAGER_NATIVE_RMT_SCHEMA, 'Native surfaces fixture declares contract version');
  context.assert(fixture.manifest.metadata.adapterContract === SURFACE_ADAPTER_SCHEMA, 'Native surfaces fixture declares adapter contract');
  context.assert(fixture.manifest.metadata.workpackage === SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE, 'Native surfaces fixture belongs to WP-SM-08');
  context.assert(fixture.manifest.metadata.nativeDomain === SURFACE_DOMAIN, 'Native surfaces fixture declares native domain');
  context.assert(fixture.manifest.metadata.surfaceAdapter === SURFACE_ADAPTER_ID, 'Native surfaces fixture declares xtend.surface adapter');
  context.assert(fixture.manifest.metadata.compatibilitySource === 'components[*].metadata.surface', 'Native surfaces fixture declares compatibility source');
  context.assert(fixture.manifest.metadata.qualityRegressionBase === 'WP-SM-07', 'Native surfaces fixture points to WP-SM-07');
  const surfaceAdapter = findAdapter(fixture, SURFACE_ADAPTER_ID);
  context.assert(surfaceAdapter && surfaceAdapter.kind === SURFACE_ADAPTER_KIND, 'Native surfaces fixture has xtend.surface surface_adapter');
  context.assert(surfaceAdapter && surfaceAdapter.kernelVisible === false, 'xtend.surface adapter remains host-only');
  context.assert(surfaceAdapter && surfaceAdapter.lifecycleContract === SURFACE_ADAPTER_SCHEMA, 'xtend.surface adapter points to adapter schema');
  context.assert(surfaceAdapter && surfaceAdapter.metadata && surfaceAdapter.metadata.runtimeImplemented === false, 'xtend.surface adapter fixture is handoff-only');
  assertIncludesAll(context, surfaceAdapter && surfaceAdapter.providedCapabilities, ['surfaces', 'multiWindow', 'sidePanels', 'overlaySurfaces', 'stateBridge', 'diagnostics'], 'xtend.surface provided capabilities');
  context.assert(Array.isArray(fixture.surfaces) && fixture.surfaces.length === 6, 'Native surfaces fixture declares six native surface records');
  assertIncludesAll(context, fixture.surfaces.map((surface) => surface.type), SURFACE_TYPES, 'Native surfaces fixture surface types');
  assertSurfaceReferencesResolve(context, fixture);
  assertNativeAndComponentRecordsMatch(context, fixture);

  context.assert(schema.properties && schema.properties.surfaces && schema.properties.surfaces.$ref === '#/$defs/surfaces', 'RMT schema exposes top-level surfaces property');
  context.assert(schema.$defs && schema.$defs.surface && schema.$defs.surfaces && schema.$defs.surfaceType && schema.$defs.surfaceBounds, 'RMT schema exposes surface defs');
  context.assert(schema.$defs.adapterKind.enum.includes(SURFACE_ADAPTER_KIND), 'RMT schema adapterKind includes surface_adapter');
  const nativeDomainContracts = schema['x-xtendrmt'] && schema['x-xtendrmt'].nativeDomainContracts;
  const surfacesDomain = Array.isArray(nativeDomainContracts)
    ? nativeDomainContracts.find((entry) => entry.id === SURFACE_MANAGER_NATIVE_RMT_SCHEMA)
    : null;
  context.assert(surfacesDomain && surfacesDomain.status === 'wp-sm-08-contract', 'RMT schema exposes native surfaces domain contract');
  context.assert(surfacesDomain && surfacesDomain.domain === SURFACE_DOMAIN, 'RMT schema native surfaces contract points to surfaces domain');
  context.assert(surfacesDomain && surfacesDomain.topLevelProperty === SURFACE_DOMAIN, 'RMT schema native surfaces contract declares top-level property');
  context.assert(surfacesDomain && surfacesDomain.adapterId === SURFACE_ADAPTER_ID, 'RMT schema native surfaces contract declares xtend.surface adapter');
  assertIncludesAll(context, surfacesDomain && surfacesDomain.requiredFields, ['id', 'type', 'manager', 'component'], 'RMT schema native surfaces required fields');
  assertIncludesAll(context, surfacesDomain && surfacesDomain.surfaceTypes, SURFACE_TYPES, 'RMT schema native surfaces types');
  const surfaceAdapterContracts = schema['x-xtendrmt'] && schema['x-xtendrmt'].surfaceAdapterContracts;
  const surfaceAdapterContract = Array.isArray(surfaceAdapterContracts)
    ? surfaceAdapterContracts.find((entry) => entry.id === SURFACE_ADAPTER_SCHEMA)
    : null;
  context.assert(surfaceAdapterContract && surfaceAdapterContract.adapterId === SURFACE_ADAPTER_ID, 'RMT schema exposes xtend.surface adapter handoff');
  context.assert(surfaceAdapterContract && surfaceAdapterContract.runtimeImplemented === false, 'RMT schema marks xtend.surface runtime as deferred');
  assertIncludesAll(context, surfaceAdapterContract && surfaceAdapterContract.operations, SURFACE_ADAPTER_OPERATIONS, 'RMT schema surface adapter operations');
  context.assertIncludes(schemaText, '"surfaces[*].component -> components[*].id"', 'RMT schema documents surface component reference');
  context.assertIncludes(schemaText, '"rmt.dsl.reference.missing_route"', 'RMT schema documents surface route diagnostic');

  assertTextIncludesAll(context, coreTypes, [
    'RmtSurfaceDomainRecord',
    'RmtSurfaceType',
    'surfaces?: RmtSurfaceDomainRecord[]',
    'surfaces: RmtSurfaceDomainRecord[]',
    SURFACE_MANAGER_NATIVE_RMT_SCHEMA,
    SURFACE_ADAPTER_SCHEMA,
    "'surface_adapter'"
  ], 'RMT type artifact native surfaces');
  [coreBundle, runtimeBundle, browserBundle].forEach((source, index) => {
    const label = ['core', 'runtime', 'browser'][index];
    assertTextIncludesAll(context, source, [
      "'surfaces'",
      'rmt.dsl.reference.missing_route',
      'domains.surfaces'
    ], `${label} bundle native surfaces normalization`);
  });

  const rmtFormat = createRmtFormatFromBundle(context, rootDir);
  if (rmtFormat) {
    const normalizedDocument = rmtFormat.normalizeDocument(fixture);
    const serializedDocument = JSON.parse(rmtFormat.serializeDocument(fixture, { includeNormalization: true }));
    context.assert(Array.isArray(normalizedDocument.surfaces) && normalizedDocument.surfaces.length === 6, 'RMT normalizer preserves native surfaces records');
    context.assert(normalizedDocument.normalization && normalizedDocument.normalization.domains.surfaces.source === 'top-level', 'RMT normalizer reads surfaces from top-level domain');
    context.assert(normalizedDocument.normalization.referenceGraph.surfaces.includes('surface.inspector'), 'RMT normalizer indexes surface ids in reference graph');
    context.assert(Array.isArray(serializedDocument.surfaces) && serializedDocument.surfaces.length === 6, 'RMT serializer keeps native surfaces');
    context.assert(!Object.prototype.hasOwnProperty.call(rmtFormat.createRuntimeRegistries(fixture), 'surfaceRegistry'), 'WP-SM-08 does not claim runtime surface registry');
  }

  const graph = buildSemanticGraph({
    text: fixtureText,
    filePath: resolveRepoPath(SURFACE_MANAGER_NATIVE_RMT_FIXTURE, rootDir)
  }, { rootDir });
  context.assert(graph.ok === true, 'Semantic graph accepts native surfaces fixture');
  context.assert(graph.indexes.surfaces.byId.has('surface.inspector'), 'Semantic graph indexes surfaces.byId');
  context.assert(graph.getDefinition('surfaces', 'surface.editor').id === 'surface.editor', 'Semantic graph returns surface definition');
  context.assert(graph.findReferenceAtPointer('/surfaces/0/component').resolved === true, 'Semantic graph resolves surface component reference');
  context.assert(graph.findReferenceAtPointer('/surfaces/0/manager').resolved === true, 'Semantic graph resolves surface manager reference');
  context.assert(graph.findReferenceAtPointer('/surfaces/0/route').resolved === true, 'Semantic graph resolves surface route reference');
  context.assert(graph.findReferenceAtPointer('/surfaces/0/schedule').resolved === true, 'Semantic graph resolves surface schedule reference');
  context.assert(labels(getRmtCompletions({ text: fixtureText }, { rootDir, context: 'top-level' })).includes(SURFACE_DOMAIN), 'Completion provider offers surfaces top-level domain');
  context.assert(labels(getRmtCompletions({ text: fixtureText }, { rootDir, domain: SURFACE_DOMAIN })).includes('component'), 'Completion provider offers surface fields');
  context.assert(labels(getRmtCompletions({ text: fixtureText }, { rootDir, pointer: '/surfaces/0/component', prefix: 'workbench.' })).includes('workbench.inspector'), 'Completion provider resolves surface component IDs');
  context.assert(labels(getRmtCompletions({ text: fixtureText }, { rootDir, pointer: '/surfaces/0/adapter' })).includes(SURFACE_ADAPTER_ID), 'Completion provider offers xtend.surface adapter');
  context.assert(inferCompletionContext({ domain: SURFACE_DOMAIN }) === 'surface-fields', 'Completion context infers surface fields');
  context.assert(inferCompletionContext({ pointer: '/surfaces/0/type' }) === 'surface-types', 'Completion context infers surface types');
  const lintReport = lintRmtSource({
    text: fixtureText,
    filePath: resolveRepoPath(SURFACE_MANAGER_NATIVE_RMT_FIXTURE, rootDir)
  }, { rootDir });
  context.assert(!lintReport.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.domain.unknown' && diagnostic.pointer === '/surfaces'), 'RMT linter accepts surfaces top-level domain');
  assertTextIncludesAll(context, semanticGraph, [SURFACE_DOMAIN, 'collectSurfaceReferences'], 'Semantic graph source native surfaces');
  assertTextIncludesAll(context, completions, [SURFACE_DOMAIN, SURFACE_ADAPTER_ID, 'surface-types'], 'Completion source native surfaces');
  assertTextIncludesAll(context, linterDiagnostics, [SURFACE_DOMAIN], 'Linter diagnostics native surfaces');

  context.assert(metadata && metadata.schema === SURFACE_MANAGER_NATIVE_RMT_SCHEMA, 'Package metadata exposes native surfaces schema');
  context.assert(metadata && metadata.reportSchema === SURFACE_MANAGER_NATIVE_RMT_REPORT_SCHEMA, 'Package metadata exposes native surfaces report schema');
  context.assert(metadata && metadata.adapterSchema === SURFACE_ADAPTER_SCHEMA, 'Package metadata exposes surface adapter schema');
  context.assert(metadata && metadata.workpackage === SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE, 'Package metadata exposes WP-SM-08');
  context.assert(metadata && metadata.domain === SURFACE_DOMAIN, 'Package metadata exposes surfaces domain');
  context.assert(metadata && metadata.adapterId === SURFACE_ADAPTER_ID, 'Package metadata exposes xtend.surface adapter');
  context.assert(metadata && metadata.fixture === SURFACE_MANAGER_NATIVE_RMT_FIXTURE, 'Package metadata exposes native surfaces fixture');
  context.assert(metadata && metadata.localGate === SURFACE_MANAGER_NATIVE_RMT_LOCAL_GATE, 'Package metadata exposes native surfaces local gate');
  context.assert(metadata && metadata.packageScript === SURFACE_MANAGER_NATIVE_RMT_PACKAGE_SCRIPT, 'Package metadata exposes native surfaces package script');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Package metadata exposes WP-SM-09 handoff');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:surface-native-rmt'] === 'node scripts/run_xtend_tests.js surface-native-rmt', 'Package script test:surface-native-rmt exists');
  context.assertIncludes(scaffoldConfig, 'surfaceManagerNativeRmtSurfaces', 'Scaffold config exposes surfaceManagerNativeRmtSurfaces');
  context.assertIncludes(scaffoldConfig, SURFACE_MANAGER_NATIVE_RMT_SCHEMA, 'Scaffold config references native surfaces schema');
  context.assertIncludes(scaffoldConfig, SURFACE_MANAGER_NATIVE_RMT_FIXTURE, 'Scaffold config references native surfaces fixture');
  context.assertIncludes(scaffoldConfig, SURFACE_MANAGER_NATIVE_RMT_LOCAL_GATE, 'Scaffold config references native surfaces gate');
  context.assertIncludes(runner, "require('../tests/rmt/surface_manager_native_rmt_surfaces_suite')", 'Runner imports native surfaces suite');
  context.assertIncludes(runner, "id: 'surface-native-rmt'", 'Runner registers surface-native-rmt suite');

  assertTextIncludesAll(context, contractDoc, [
    SURFACE_MANAGER_NATIVE_RMT_SCHEMA,
    SURFACE_ADAPTER_SCHEMA,
    SURFACE_ADAPTER_ID,
    SURFACE_ADAPTER_KIND,
    SURFACE_DOMAIN,
    'components[*].metadata.surface',
    'surfaces[*].component -> components[*].id',
    'runtimeImplemented: false',
    KERNEL_BOUNDARY
  ], 'Native surfaces contract doc');
  assertTextIncludesAll(context, workpackageDoc, [
    'Status: completed',
    SURFACE_MANAGER_NATIVE_RMT_SCHEMA,
    SURFACE_MANAGER_NATIVE_RMT_LOCAL_GATE,
    SURFACE_MANAGER_NATIVE_RMT_FIXTURE,
    NEXT_WORKPACKAGE
  ], 'Native surfaces workpackage doc');
  assertTextIncludesAll(context, docs, [
    SURFACE_MANAGER_NATIVE_RMT_SCHEMA,
    SURFACE_ADAPTER_SCHEMA,
    SURFACE_MANAGER_NATIVE_RMT_FIXTURE,
    SURFACE_MANAGER_NATIVE_RMT_LOCAL_GATE,
    'surface_adapter',
    'WP-SM-09'
  ], 'Native surfaces docs');
  context.assertIncludes(docsReadme, 'SurfaceManager Native RMT Surfaces', 'Docs README links native surfaces');
  context.assertIncludes(docsMenu, 'surface-manager-native-rmt-surfaces', 'Docs menu contains native surfaces page');
  context.assertIncludes(testsReadme, SURFACE_MANAGER_NATIVE_RMT_LOCAL_GATE, 'Tests README documents native surfaces gate');
  context.assertIncludes(rmtReadme, SURFACE_MANAGER_NATIVE_RMT_LOCAL_GATE, 'RMT README documents native surfaces gate');
  context.assertIncludes(referenceRegistry, 'WP-SM-08', 'Reference registry contains WP-SM-08');
  context.assertIncludes(referenceRegistry, SURFACE_MANAGER_NATIVE_RMT_FIXTURE, 'Reference registry contains native surfaces fixture');
  context.assertIncludes(planningDoc, '`WP-SM-08` | P2 | completed', 'Planning doc marks WP-SM-08 completed');
  context.assertIncludes(planningDoc, '`WP-SM-09` | P2 | completed', 'Planning doc marks WP-SM-09 completed');
  TOOLING_ARTIFACTS.forEach((artifact) => {
    context.assert(plan.toolingArtifacts.includes(artifact), `Native surfaces plan tracks ${artifact}`);
  });

  return context.result({
    report: {
      schema: SURFACE_MANAGER_NATIVE_RMT_REPORT_SCHEMA,
      workpackage: SURFACE_MANAGER_NATIVE_RMT_WORKPACKAGE,
      domain: SURFACE_DOMAIN,
      adapterId: SURFACE_ADAPTER_ID,
      surfaces: Array.isArray(fixture.surfaces) ? fixture.surfaces.length : 0,
      surfaceTypes: SURFACE_TYPES.length,
      referenceChecks: SURFACE_REFERENCE_CHECKS.length
    }
  });
}

function printSurfaceManagerNativeRmtSurfacesReport(result) {
  printSuiteReport(result, {
    successTitle: 'SurfaceManager Native RMT Surfaces erfolgreich.',
    failureTitle: 'SurfaceManager Native RMT Surfaces fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceManagerNativeRmtSurfacesReport,
  runSurfaceManagerNativeRmtSurfacesSuite
};

if (require.main === module) {
  const result = runSurfaceManagerNativeRmtSurfacesSuite();
  printSurfaceManagerNativeRmtSurfacesReport(result);
  process.exit(result.ok ? 0 : 1);
}
