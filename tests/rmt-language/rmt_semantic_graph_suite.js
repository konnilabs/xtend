const fs = require('fs');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  DUPLICATE_ID_CODE,
  DUPLICATE_ROUTE_PATH_CODE,
  FABRIC_LANE_CONFLICT_CODE,
  REFERENCE_DIAGNOSTIC_CODES,
  RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES,
  RMT_VNEXT_PRIMITIVE_DOMAIN_NAMES,
  RMT_VNEXT_PRIMITIVE_SEMANTIC_GRAPH_SCHEMA,
  RMT_VNEXT_PRIMITIVE_SEMANTIC_GRAPH_WORKPACKAGE,
  RMT_SEMANTIC_GRAPH_MODULE_PATH,
  RMT_SEMANTIC_GRAPH_PACKAGE_SCRIPT,
  RMT_SEMANTIC_GRAPH_REPORT_SCHEMA,
  RMT_SEMANTIC_GRAPH_SCHEMA,
  RMT_SEMANTIC_GRAPH_SUITE_PATH,
  RMT_SEMANTIC_GRAPH_WORKPACKAGE,
  buildRmtVNextPrimitiveSemanticGraph,
  buildSemanticGraph
} = require('../../tools/rmt-language/semantic-graph');

const RMT_SEMANTIC_GRAPH_WP_PATH = 'development/WP-E14-04-Semantic-Graph-fuer-RMT-Domains-und-Referenzen-implementieren.md';
const EPIC_14_PATH = 'development/EPIC-14-XTendRMT-DSL-Linter-und-Language-Server.md';
const TOOLING_ARCHITECTURE_PATH = 'development/XTendRMT-DSL-Tooling-Architektur.md';
const VALID_FIXTURE_PATH = 'xtendrmt/rmt-first-demo-app.rmt';
const MISSING_REFS_FIXTURE_PATH = 'tests/fixtures/rmt-app-dsl.missing-refs.rmt';
const VNEXT_PRIMITIVE_FIXTURE_PATH = 'tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt';
const VNEXT_PRIMITIVE_INVALID_FIXTURE_PATH = 'tests/rmt-language/fixtures/vnext-primitives-semantic-invalid.rmt';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertDiagnosticRange(context, diagnostic, message) {
  context.assert(
    diagnostic
      && diagnostic.range
      && diagnostic.range.start
      && diagnostic.range.end
      && Number.isInteger(diagnostic.range.start.line)
      && Number.isInteger(diagnostic.range.start.character)
      && Number.isInteger(diagnostic.range.end.line)
      && Number.isInteger(diagnostic.range.end.character),
    message
  );
}

function assertGraphReference(context, graph, pointer, targetDomain, targetId, message) {
  const reference = graph.findReferenceAtPointer(pointer);

  context.assert(reference && reference.targetDomain === targetDomain && reference.targetId === targetId, `${message}: reference exists`);
  context.assert(reference && reference.resolved === true, `${message}: reference resolves`);
  context.assert(graph.getDefinitionForReference(reference) && graph.getDefinitionForReference(reference).id === targetId, `${message}: definition resolves`);
  context.assert(graph.listReferencesForTarget(targetDomain, targetId).some((entry) => entry.sourcePointer === pointer), `${message}: reverse references include source`);
}

function runValidFixtureChecks(context, rootDir) {
  const graph = buildSemanticGraph({
    text: readText(VALID_FIXTURE_PATH, rootDir),
    filePath: resolveRepoPath(VALID_FIXTURE_PATH, rootDir),
    version: 4
  }, {
    rootDir
  });

  context.assert(graph.schema === RMT_SEMANTIC_GRAPH_SCHEMA, 'Semantic graph declares schema');
  context.assert(graph.reportSchema === RMT_SEMANTIC_GRAPH_REPORT_SCHEMA, 'Semantic graph declares report schema');
  context.assert(graph.workpackage === RMT_SEMANTIC_GRAPH_WORKPACKAGE, 'Semantic graph belongs to WP-E14-04');
  context.assert(graph.ok === true, 'Valid RMT-first demo fixture has no semantic errors');
  context.assert(graph.status === 'indexed', 'Valid RMT-first demo fixture indexes successfully');
  context.assert(graph.manifestHints.documentId === 'demo.xtend.rmt-first-app', 'Graph exposes manifest documentId');
  context.assert(graph.manifestHints.contractVersion === 'xtend.epic10.rmt-first-demo-app.v1', 'Graph exposes contract version hint');
  context.assert(graph.catalogHints.componentTags.includes('x-section'), 'Graph exposes component tag catalog hints');
  context.assert(graph.catalogHints.routePaths.includes('/settings'), 'Graph exposes route path catalog hints');
  context.assert(graph.catalogHints.scheduleEndpoints.includes('xtendrmt.component.hydrate'), 'Graph exposes schedule endpoint catalog hints');

  context.assert(graph.indexes.adapters.byId.has('xtend.component'), 'Graph indexes adapters.byId');
  context.assert(graph.indexes.components.byId.has('page.settings'), 'Graph indexes components.byId');
  context.assert(graph.indexes.components.byTag.get('x-section').length >= 2, 'Graph indexes components.byTag');
  context.assert(graph.indexes.routes.byId.has('settings'), 'Graph indexes routes.byId');
  context.assert(graph.indexes.routes.byPath.get('/settings').length === 1, 'Graph indexes routes.byPath');
  context.assert(graph.indexes.schedules.byId.has('component.idle.hydrate'), 'Graph indexes schedules.byId');
  context.assert(graph.indexes.schedules.byEndpointName.get('xtendrmt.component.hydrate').length >= 1, 'Graph indexes schedules.byEndpointName');
  context.assert(graph.indexes.templates.byId.has('page.settings.template'), 'Graph indexes templates.byId');

  assertGraphReference(context, graph, '/routes/1/component', 'components', 'page.settings', 'Route component reference');
  assertGraphReference(context, graph, '/routes/1/template', 'templates', 'page.settings.template', 'Route template reference');
  assertGraphReference(context, graph, '/routes/1/schedule', 'schedules', 'route.transition.render', 'Route schedule reference');
  assertGraphReference(context, graph, '/components/0/adapter', 'adapters', 'xtend.component', 'Component adapter reference');
  assertGraphReference(context, graph, '/components/0/schedule', 'schedules', 'app.shell.render', 'Component schedule reference');
  assertGraphReference(context, graph, '/components/0/slots/header/template', 'templates', 'app.header', 'Component slot template reference');
  assertGraphReference(context, graph, '/components/0/slots/default/component', 'components', 'app.router', 'Component slot component reference');
  assertGraphReference(context, graph, '/templates/0/nodes/0/component', 'components', 'app.shell', 'Template node component reference');
  assertGraphReference(context, graph, '/templates/3/metadata/lazySchedule', 'schedules', 'component.idle.hydrate', 'Template metadata lazySchedule reference');
  assertGraphReference(context, graph, '/templates/4/metadata/lazySchedule', 'schedules', 'overlay.visible.mount', 'Template overlay lazySchedule reference');

  context.assert(graph.references.records.length >= 25, 'Graph collects cross-domain references');
  context.assert(graph.references.unresolved.length === 0, 'Valid RMT-first demo fixture has no unresolved references');
  context.assert(graph.listCompletions('components', { prefix: 'page.' }).some((entry) => entry.label === 'page.settings'), 'Graph exposes component completions');
  context.assert(graph.listCompletions('routes').some((entry) => entry.label === 'settings'), 'Graph exposes route completions');
  context.assert(graph.getDefinition('templates', 'page.settings.template').id === 'page.settings.template', 'Graph provides direct definition lookup');
  context.assert(graph.listDiagnostics({ severity: 'error' }).length === 0, 'Valid graph exposes no error diagnostics');
}

function runEndpointHintChecks(context, rootDir) {
  const endpointText = JSON.stringify({
    kind: 'rmt_document',
    version: '1.0',
    manifest: {
      documentId: 'fixture.semantic.endpoint-hint'
    },
    adapters: [],
    components: [],
    routes: [],
    schedules: [
      { id: 'component.visible.mount', endpointName: 'xtendrmt.component.mount', lane: 'visible' }
    ],
    templates: [
      {
        id: 'tpl.endpoint',
        mode: 'dom_descriptor',
        hydration: {
          mode: 'runtime_render',
          metadata: {
            endpointHint: 'xtendrmt.component.mount'
          }
        },
        nodes: []
      }
    ]
  }, null, 2);
  const graph = buildSemanticGraph({
    text: endpointText,
    uri: 'file:///virtual/endpoint-hint.rmt'
  }, {
    rootDir
  });
  const endpointReference = graph.findReferenceAtPointer('/templates/0/hydration/metadata/endpointHint');

  context.assert(graph.ok === true, 'Resolved endpointHint graph has no errors');
  context.assert(endpointReference && endpointReference.targetDomain === 'scheduleEndpoints', 'Hydration endpointHint is modeled as schedule endpoint reference');
  context.assert(endpointReference && endpointReference.resolved === true, 'Hydration endpointHint resolves through schedules.byEndpointName');
  context.assert(graph.getDefinitionForReference(endpointReference).id === 'component.visible.mount', 'Hydration endpointHint definition resolves to schedule');
}

function runMissingReferenceChecks(context, rootDir) {
  const graph = buildSemanticGraph({
    text: readText(MISSING_REFS_FIXTURE_PATH, rootDir),
    filePath: resolveRepoPath(MISSING_REFS_FIXTURE_PATH, rootDir)
  }, {
    rootDir
  });
  const diagnostics = graph.listDiagnostics();
  const codes = diagnostics.map((diagnostic) => diagnostic.code);

  context.assert(graph.ok === false, 'Missing refs fixture fails semantic graph');
  context.assert(graph.references.unresolved.length >= 6, 'Missing refs fixture exposes unresolved references');
  context.assert(codes.includes(REFERENCE_DIAGNOSTIC_CODES.adapters), 'Missing refs fixture reports unknown adapter');
  context.assert(codes.includes(REFERENCE_DIAGNOSTIC_CODES.components), 'Missing refs fixture reports unresolved component');
  context.assert(codes.includes(REFERENCE_DIAGNOSTIC_CODES.templates), 'Missing refs fixture reports unresolved template');
  context.assert(codes.includes(REFERENCE_DIAGNOSTIC_CODES.schedules), 'Missing refs fixture reports unresolved schedule');
  context.assert(codes.includes(REFERENCE_DIAGNOSTIC_CODES.scheduleEndpoints), 'Missing refs fixture reports missing schedule endpoint');
  diagnostics.forEach((diagnostic) => assertDiagnosticRange(context, diagnostic, `${diagnostic.code} diagnostic has range`));
  context.assert(graph.findReferenceAtPointer('/routes/0/component').resolved === false, 'Graph marks unresolved route component reference');
  context.assert(graph.getDefinitionForReference('/routes/0/component') === null, 'Graph returns null definition for unresolved reference');
}

function runDuplicateChecks(context, rootDir) {
  const duplicateText = JSON.stringify({
    kind: 'rmt_document',
    version: '1.0',
    manifest: {
      documentId: 'fixture.semantic.duplicates'
    },
    adapters: [
      { id: 'xtend.component', kind: 'component_adapter' },
      { id: 'xtend.xrouter', kind: 'router_adapter' }
    ],
    components: [
      { id: 'page.one', kind: 'custom_element', adapter: 'xtend.component', tag: 'x-section', schedule: 'component.visible.mount' },
      { id: 'page.one', kind: 'custom_element', adapter: 'xtend.component', tag: 'x-alert', schedule: 'component.visible.mount' }
    ],
    routes: [
      { id: 'home', path: '/', router: 'xtend.xrouter', component: 'page.one', template: 'tpl.home', schedule: 'route.visible.render' },
      { id: 'copy', path: '/', router: 'xtend.xrouter', component: 'page.one', template: 'tpl.home', schedule: 'route.visible.render' }
    ],
    schedules: [
      { id: 'component.visible.mount', endpointName: 'xtendrmt.component.mount', lane: 'visible' },
      { id: 'route.visible.render', endpointName: 'xtendrmt.route.render', lane: 'visible' }
    ],
    templates: [
      { id: 'tpl.home', mode: 'dom_descriptor', nodes: [{ component: 'page.one' }] }
    ]
  }, null, 2);
  const graph = buildSemanticGraph({
    text: duplicateText,
    uri: 'file:///virtual/duplicates.rmt'
  }, {
    rootDir
  });

  context.assert(graph.listDiagnostics({ code: DUPLICATE_ID_CODE }).length === 1, 'Graph detects duplicate component ID');
  context.assert(graph.listDiagnostics({ code: DUPLICATE_ROUTE_PATH_CODE }).length === 1, 'Graph detects duplicate route path');
  assertDiagnosticRange(context, graph.listDiagnostics({ code: DUPLICATE_ID_CODE })[0], 'Duplicate ID diagnostic has range');
  assertDiagnosticRange(context, graph.listDiagnostics({ code: DUPLICATE_ROUTE_PATH_CODE })[0], 'Duplicate route path diagnostic has range');
}

function runFabricLaneChecks(context, rootDir) {
  const laneConflictText = JSON.stringify({
    kind: 'rmt_document',
    version: '1.0',
    manifest: {
      documentId: 'fixture.semantic.fabric'
    },
    adapters: [
      { id: 'xtend.component', kind: 'component_adapter' }
    ],
    components: [
      {
        id: 'page.fabric',
        kind: 'custom_element',
        adapter: 'xtend.component',
        tag: 'x-section',
        schedule: 'component.visible.mount',
        metadata: {
          fabric: {
            lane: 'idle'
          }
        }
      }
    ],
    routes: [],
    schedules: [
      { id: 'component.visible.mount', endpointName: 'xtendrmt.component.mount', lane: 'visible' }
    ],
    templates: []
  }, null, 2);
  const graph = buildSemanticGraph({
    text: laneConflictText,
    uri: 'file:///virtual/fabric-conflict.rmt'
  }, {
    rootDir
  });
  const diagnostic = graph.listDiagnostics({ code: FABRIC_LANE_CONFLICT_CODE })[0];

  context.assert(!!diagnostic, 'Graph detects Fabric/RMT lane conflict');
  context.assert(diagnostic.severity === 'warning', 'Fabric lane conflict is a warning');
  assertDiagnosticRange(context, diagnostic, 'Fabric lane conflict diagnostic has range');
}

function runVNextPrimitiveGraphChecks(context, rootDir) {
  const graph = buildRmtVNextPrimitiveSemanticGraph({
    text: readText(VNEXT_PRIMITIVE_FIXTURE_PATH, rootDir),
    filePath: resolveRepoPath(VNEXT_PRIMITIVE_FIXTURE_PATH, rootDir)
  }, {
    rootDir
  });
  const expectedDomains = RMT_VNEXT_PRIMITIVE_DOMAIN_NAMES;

  context.assert(graph.schema === RMT_VNEXT_PRIMITIVE_SEMANTIC_GRAPH_SCHEMA, 'vNext primitive graph declares schema');
  context.assert(graph.reportSchema === RMT_SEMANTIC_GRAPH_REPORT_SCHEMA, 'vNext primitive graph reuses semantic graph report schema');
  context.assert(graph.workpackage === RMT_VNEXT_PRIMITIVE_SEMANTIC_GRAPH_WORKPACKAGE, 'vNext primitive graph belongs to PRIM-03');
  context.assert(graph.ok === true, 'vNext primitive fixture has no semantic errors');
  context.assert(graph.status === 'indexed', 'vNext primitive graph indexes successfully');
  expectedDomains.forEach((domain) => {
    context.assert(graph.indexes[domain] && Array.isArray(graph.indexes[domain].records), `vNext primitive graph exposes ${domain} index`);
  });

  context.assert(graph.indexes.states.byId.has('media.records'), 'vNext primitive graph indexes state declarations');
  context.assert(graph.indexes.selectors.byId.has('media.filtered'), 'vNext primitive graph indexes selector declarations');
  context.assert(graph.indexes.dataSources.byId.has('media.reindex'), 'vNext primitive graph indexes datasource declarations');
  context.assert(graph.indexes.actions.byId.has('media.select'), 'vNext primitive graph indexes action declarations');
  context.assert(graph.indexes.surfaces.byId.has('media.player'), 'vNext primitive graph indexes surface declarations');
  context.assert(graph.indexes.portals.byId.has('surface.root'), 'vNext primitive graph indexes portal declarations');
  context.assert(graph.indexes.overlays.byId.has('feedback.toast'), 'vNext primitive graph indexes overlay declarations');
  context.assert(graph.indexes.resources.byId.has('preview.objectUrl'), 'vNext primitive graph indexes resource declarations');
  context.assert(graph.indexes.events.records.length === 2, 'vNext primitive graph indexes event bindings');

  context.assert(graph.catalogHints.actionIds.includes('media.select'), 'vNext primitive graph exposes action catalog hints');
  context.assert(graph.catalogHints.surfaceIds.includes('media.explorer'), 'vNext primitive graph exposes surface catalog hints');
  context.assert(graph.listCompletions('selectors', { prefix: 'media.' }).some((entry) => entry.label === 'media.filtered'), 'vNext primitive graph exposes selector completions');
  context.assert(graph.getDefinition('resources', 'preview.objectUrl').id === 'preview.objectUrl', 'vNext primitive graph exposes direct primitive definitions');

  context.assert(
    graph.references.records.some((reference) => reference.relationship === 'selector.source' && reference.targetDomain === 'states' && reference.targetId === 'media.records' && reference.resolved),
    'vNext primitive graph resolves selector source references'
  );
  context.assert(
    graph.references.records.some((reference) => reference.relationship === 'surface.portal' && reference.targetDomain === 'portals' && reference.targetId === 'surface.root' && reference.resolved),
    'vNext primitive graph resolves surface portal references'
  );
  context.assert(
    graph.references.records.some((reference) => reference.relationship === 'event.action' && reference.targetDomain === 'actions' && reference.targetId === 'media.select' && reference.resolved),
    'vNext primitive graph resolves event action references'
  );
  context.assert(
    graph.references.records.some((reference) => reference.relationship === 'resource.owner' && reference.targetDomain === 'surfaces' && reference.targetId === 'media.player' && reference.resolved),
    'vNext primitive graph resolves resource owner references'
  );
  context.assert(
    graph.listReferencesForTarget('actions', 'media.select').some((entry) => entry.relationship === 'event.action'),
    'vNext primitive graph exposes reverse event action references'
  );
  context.assert(graph.references.unresolved.length === 0, 'vNext primitive fixture has no unresolved primitive references');
  context.assert(graph.listDiagnostics({ severity: 'error' }).length === 0, 'vNext primitive fixture exposes no error diagnostics');
}

function runVNextPrimitiveDiagnosticChecks(context, rootDir) {
  const graph = buildRmtVNextPrimitiveSemanticGraph({
    text: readText(VNEXT_PRIMITIVE_INVALID_FIXTURE_PATH, rootDir),
    filePath: resolveRepoPath(VNEXT_PRIMITIVE_INVALID_FIXTURE_PATH, rootDir)
  }, {
    rootDir
  });
  const diagnostics = graph.listDiagnostics();
  const codes = diagnostics.map((diagnostic) => diagnostic.code);

  context.assert(graph.ok === false, 'Invalid vNext primitive fixture fails semantic graph');
  context.assert(graph.references.unresolved.length >= 3, 'Invalid vNext primitive fixture exposes unresolved primitive references');
  context.assert(codes.includes(RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.unknownReference), 'Invalid vNext primitive fixture reports unknown primitive references');
  context.assert(codes.includes(RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.ownerMissing), 'Invalid vNext primitive fixture reports missing resource owner');
  context.assert(codes.includes(RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.unkeyedRepeat), 'Invalid vNext primitive fixture reports unkeyed surface repeater');
  context.assert(codes.includes(RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.payloadContractMissing), 'Invalid vNext primitive fixture reports missing event payload contract');
  context.assert(codes.includes(RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.kernelBoundary), 'Invalid vNext primitive fixture reports kernel boundary violation');
  diagnostics.forEach((diagnostic) => assertDiagnosticRange(context, diagnostic, `${diagnostic.code} diagnostic has range`));
}

function runSyntaxFallbackChecks(context, rootDir) {
  const graph = buildSemanticGraph({
    text: '{\n  "kind": "rmt_document"\n  "version": "1.0"\n}',
    uri: 'file:///virtual/broken-semantic.rmt'
  }, {
    rootDir
  });

  context.assert(graph.ok === false, 'Syntax-broken source returns failed graph');
  context.assert(graph.status === 'source_unavailable', 'Syntax-broken source does not build indexes');
  context.assert(graph.indexes.components.records.length === 0, 'Syntax-broken graph has empty component index');
  context.assert(graph.listDiagnostics({ code: 'rmt.syntax.invalid-json' }).length === 1, 'Syntax-broken graph preserves parser diagnostic');
}

function runRmtSemanticGraphSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-semantic-graph',
    label: 'Epic 14 RMT Semantic Graph'
  });
  const packageManifest = JSON.parse(readText('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtSemanticGraph;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_14_PATH, rootDir);
  const architecture = readText(TOOLING_ARCHITECTURE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_SEMANTIC_GRAPH_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_SEMANTIC_GRAPH_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_SEMANTIC_GRAPH_MODULE_PATH, rootDir, 'RMT Semantic Graph module exists');
  assertFileExists(context, RMT_SEMANTIC_GRAPH_SUITE_PATH, rootDir, 'RMT Semantic Graph suite exists');
  assertFileExists(context, RMT_SEMANTIC_GRAPH_WP_PATH, rootDir, 'WP-E14-04 workpackage document exists');
  assertFileExists(context, VNEXT_PRIMITIVE_FIXTURE_PATH, rootDir, 'vNext primitive semantic graph fixture exists');
  assertFileExists(context, VNEXT_PRIMITIVE_INVALID_FIXTURE_PATH, rootDir, 'vNext primitive invalid semantic graph fixture exists');
  context.assert(moduleSyntax.ok, `RMT Semantic Graph module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `RMT Semantic Graph suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_SEMANTIC_GRAPH_SCHEMA, 'package metadata declares Semantic Graph schema');
  context.assert(metadata && metadata.reportSchema === RMT_SEMANTIC_GRAPH_REPORT_SCHEMA, 'package metadata declares Semantic Graph report schema');
  context.assert(metadata && metadata.workpackage === RMT_SEMANTIC_GRAPH_WORKPACKAGE, 'package metadata points to WP-E14-04');
  context.assert(metadata && metadata.module === RMT_SEMANTIC_GRAPH_MODULE_PATH, 'package metadata points to semantic graph module');
  context.assert(metadata && metadata.suite === RMT_SEMANTIC_GRAPH_SUITE_PATH, 'package metadata points to semantic graph suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-semantic-graph --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === RMT_SEMANTIC_GRAPH_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert((typeof packageManifest.exports['./rmt-language/semantic-graph'] === 'string' ? packageManifest.exports['./rmt-language/semantic-graph'] : packageManifest.exports['./rmt-language/semantic-graph'] && packageManifest.exports['./rmt-language/semantic-graph'].default) === './tools/rmt-language/semantic-graph.js', 'package exports RMT Semantic Graph');
  context.assert(runner.includes("id: 'rmt-semantic-graph'"), 'test runner exposes rmt-semantic-graph suite');
  context.assert(epic.includes('| `WP-E14-04` | P0 | completed | WS2 |'), 'Epic marks WP-E14-04 completed');
  context.assert(epic.includes('WP-E14-05` ist `ready`'), 'Epic hands off WP-E14-05 as ready');
  context.assert(architecture.includes('references.bySourcePointer'), 'Architecture keeps references.bySourcePointer duty visible');
  context.assert(architecture.includes('references.byTargetId'), 'Architecture keeps references.byTargetId duty visible');

  runValidFixtureChecks(context, rootDir);
  runEndpointHintChecks(context, rootDir);
  runMissingReferenceChecks(context, rootDir);
  runDuplicateChecks(context, rootDir);
  runFabricLaneChecks(context, rootDir);
  runVNextPrimitiveGraphChecks(context, rootDir);
  runVNextPrimitiveDiagnosticChecks(context, rootDir);
  runSyntaxFallbackChecks(context, rootDir);

  return context.result({
    schema: RMT_SEMANTIC_GRAPH_REPORT_SCHEMA,
    graphSchema: RMT_SEMANTIC_GRAPH_SCHEMA,
    vNextPrimitiveGraphSchema: RMT_VNEXT_PRIMITIVE_SEMANTIC_GRAPH_SCHEMA,
    workpackage: RMT_SEMANTIC_GRAPH_WORKPACKAGE,
    vNextPrimitiveWorkpackage: RMT_VNEXT_PRIMITIVE_SEMANTIC_GRAPH_WORKPACKAGE,
    module: RMT_SEMANTIC_GRAPH_MODULE_PATH,
    suite: RMT_SEMANTIC_GRAPH_SUITE_PATH
  });
}

function printRmtSemanticGraphReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 14 RMT Semantic Graph erfolgreich.',
    failureTitle: 'Epic 14 RMT Semantic Graph fehlgeschlagen:'
  });
}

module.exports = {
  printRmtSemanticGraphReport,
  runRmtSemanticGraphSuite
};
