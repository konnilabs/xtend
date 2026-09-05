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
  COMPONENT_LAB_UX_FAMILY_IDS,
  COMPONENT_LAB_UX_INSPECTOR_DOC_PATH,
  COMPONENT_LAB_UX_INSPECTOR_DOMAINS,
  COMPONENT_LAB_UX_INSPECTOR_FIXTURE_PATH,
  COMPONENT_LAB_UX_INSPECTOR_LOCAL_GATE,
  COMPONENT_LAB_UX_INSPECTOR_REPORT_SCHEMA,
  COMPONENT_LAB_UX_INSPECTOR_SCHEMA,
  COMPONENT_LAB_UX_INSPECTOR_SUITE_PATH,
  COMPONENT_LAB_UX_INSPECTOR_WORKPACKAGE,
  COMPONENT_LAB_UX_INSPECTOR_WP_PATH,
  COMPONENT_LAB_UX_NEXT_WORKPACKAGE,
  COMPONENT_LAB_UX_REQUIRED_PANELS,
  COMPONENT_LAB_UX_TARGET_DIMENSIONS,
  createComponentLabUxInspectorGate,
  createComponentLabUxInspectorPlan,
  validateComponentLabUxInspectorPlan
} = require('../../xtend-builder/preview/component-lab-ux-inspector');
const {
  FORM_CONTROLS_UX_SCHEMA
} = require('../../xtend-builder/typing/form-controls-ux-contract');
const {
  FEEDBACK_STATUS_UX_SCHEMA
} = require('../../xtend-builder/typing/feedback-status-ux-contract');
const {
  NAVIGATION_ROUTING_UX_SCHEMA
} = require('../../xtend-builder/typing/navigation-routing-ux-contract');
const {
  OVERLAY_INTERACTION_UX_SCHEMA
} = require('../../xtend-builder/typing/overlay-interaction-ux-contract');
const {
  LAYOUT_DISPLAY_MEDIA_UX_SCHEMA
} = require('../../xtend-builder/typing/layout-display-media-ux-contract');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function indexById(records) {
  return new Map((Array.isArray(records) ? records : []).map((record) => [record.id, record]));
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
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

function assertAllComponentSchedulesResolve(context, document) {
  const schedules = indexById(document.schedules);
  (document.components || []).forEach((component) => {
    context.assert(schedules.has(component.schedule), `${component.id}: component schedule resolves`);
  });
}

function runComponentLabUxInspectorSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'component-lab-ux-inspector',
    label: 'Epic 11 Component Lab UX Inspector'
  });
  const plan = createComponentLabUxInspectorPlan({ rootDir });
  const validation = validateComponentLabUxInspectorPlan(plan);
  const gate = createComponentLabUxInspectorGate({ rootDir, plan });
  const fixture = readJson(COMPONENT_LAB_UX_INSPECTOR_FIXTURE_PATH, rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.componentLabUxInspector;
  const epic = readText('development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const doc = readText(COMPONENT_LAB_UX_INSPECTOR_DOC_PATH, rootDir);
  const workpackage = readText(COMPONENT_LAB_UX_INSPECTOR_WP_PATH, rootDir);
  const docsComponentLab = readText('docs/component-lab.md', rootDir);
  const previewReadme = readText('xtend-builder/preview/README.md', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const routeIds = (fixture.routes || []).map((route) => route.id);
  const componentIds = (fixture.components || []).map((component) => component.id);
  const scheduleIds = (fixture.schedules || []).map((schedule) => schedule.id);
  const templateIds = (fixture.templates || []).map((template) => template.id);
  const adapterIds = (fixture.adapters || []).map((adapter) => adapter.id);
  const moduleSyntax = syntaxCheckFile('xtend-builder/preview/component-lab-ux-inspector.js', { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(COMPONENT_LAB_UX_INSPECTOR_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, 'xtend-builder/preview/component-lab-ux-inspector.js', rootDir, 'Component Lab UX Inspector module exists');
  assertFileExists(context, COMPONENT_LAB_UX_INSPECTOR_FIXTURE_PATH, rootDir, 'Component Lab UX Inspector RMT fixture exists');
  assertFileExists(context, COMPONENT_LAB_UX_INSPECTOR_DOC_PATH, rootDir, 'Component Lab UX Inspector contract document exists');
  assertFileExists(context, COMPONENT_LAB_UX_INSPECTOR_WP_PATH, rootDir, 'WP-E11-13 workpackage document exists');
  assertFileExists(context, COMPONENT_LAB_UX_INSPECTOR_SUITE_PATH, rootDir, 'Component Lab UX Inspector suite exists');
  assertFileExists(context, 'docs/component-lab.md', rootDir, 'Component Lab developer docs exist');
  context.assert(moduleSyntax.ok, `Component Lab UX Inspector module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Component Lab UX Inspector suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(plan.schema === COMPONENT_LAB_UX_INSPECTOR_SCHEMA, 'UX Inspector plan declares schema');
  context.assert(plan.status === 'accepted-inspector', 'UX Inspector plan is accepted');
  context.assert(plan.workpackage === COMPONENT_LAB_UX_INSPECTOR_WORKPACKAGE, 'UX Inspector plan belongs to WP-E11-13');
  context.assert(plan.renderMode === 'shell-first', 'UX Inspector plan is shell-first');
  context.assert(plan.localOnly === true, 'UX Inspector plan is local-only');
  context.assert(plan.externalNetworkAllowed === false, 'UX Inspector rejects external network');
  context.assert(plan.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'UX Inspector keeps RMT kernel boundary');
  context.assert(plan.handoff.nextWorkpackage === COMPONENT_LAB_UX_NEXT_WORKPACKAGE, 'UX Inspector hands off to WP-E11-14');
  context.assert(validation.schema === COMPONENT_LAB_UX_INSPECTOR_REPORT_SCHEMA, 'UX Inspector validator emits report schema');
  context.assert(validation.ok === true, 'UX Inspector validator accepts generated plan');
  context.assert(gate.ok === true, 'UX Inspector gate passes');
  context.assert(plan.localGate === COMPONENT_LAB_UX_INSPECTOR_LOCAL_GATE, 'UX Inspector exposes local gate command');
  context.assert(plan.uxFamilies.length === 5, 'UX Inspector exposes five UX families');
  context.assert(plan.previewTargets.length === 31, 'UX Inspector exposes 31 preview targets');
  context.assert(plan.coverageSummary.enterpriseReadyTargets === 31, 'UX Inspector targets are enterprise-ready');

  assertIncludesAll(context, plan.uxFamilies.map((family) => family.id), COMPONENT_LAB_UX_FAMILY_IDS, 'UX Inspector families');
  assertIncludesAll(context, plan.lab.requiredPanels, COMPONENT_LAB_UX_REQUIRED_PANELS, 'UX Inspector panels');
  assertIncludesAll(context, plan.inspector.domains, COMPONENT_LAB_UX_INSPECTOR_DOMAINS, 'UX Inspector domains');

  plan.uxFamilies.forEach((family) => {
    context.assert(family.schema && family.schema.startsWith('xtend.component.'), `${family.id}: family schema is declared`);
    context.assert(family.fixture && family.fixture.startsWith('tests/fixtures/'), `${family.id}: family fixture is local`);
    context.assert(family.suite && family.suite.endsWith('-ux'), `${family.id}: family suite is declared`);
    context.assert(family.coverage.enterpriseReady === family.targetCount, `${family.id}: all family targets are enterprise-ready`);
  });
  plan.previewTargets.forEach((target) => {
    context.assert(target.maturity === 'enterprise-ready', `${target.tag}: target is enterprise-ready`);
    context.assert(target.coverage.types === true, `${target.tag}: target has public types`);
    context.assert(target.coverage.a11y === true, `${target.tag}: target has a11y coverage`);
    context.assert(target.coverage.performance === true, `${target.tag}: target has performance coverage`);
    context.assert(target.paths.runtime.startsWith('components/'), `${target.tag}: runtime path is local`);
    context.assert(target.paths.docs.startsWith('docs/components/'), `${target.tag}: docs path is local`);
    context.assert(target.paths.types.endsWith('.d.ts'), `${target.tag}: types path is declared`);
    context.assert(target.paths.fixture.startsWith('tests/components/fixtures/'), `${target.tag}: fixture path is local`);
    context.assert(target.paths.suite.startsWith('tests/components/'), `${target.tag}: suite path is local`);
    context.assert(target.rmt.adapter === 'xtend.component', `${target.tag}: uses XTend component adapter`);
    context.assert(target.rmt.shellFirst === true, `${target.tag}: is shell-first authorable`);
    context.assert(target.fabric.api === '@xtend-fabric', `${target.tag}: exposes Fabric API`);
    context.assert(target.fabric.laneIngestRequired === true, `${target.tag}: ingests lane metadata`);
    context.assert(target.telemetry.snapshotPath === 'snapshot.componentTelemetry', `${target.tag}: binds telemetry snapshot`);
    COMPONENT_LAB_UX_TARGET_DIMENSIONS.forEach((dimension) => {
      context.assert(target.inspector.dimensions.includes(dimension), `${target.tag}: inspector exposes ${dimension}`);
    });
  });

  context.assert(fixture.kind === 'rmt_document', 'UX Inspector fixture is an RMT document');
  context.assert(fixture.manifest.metadata.contractVersion === COMPONENT_LAB_UX_INSPECTOR_SCHEMA, 'UX Inspector fixture declares contract schema');
  context.assert(fixture.manifest.metadata.workpackage === COMPONENT_LAB_UX_INSPECTOR_WORKPACKAGE, 'UX Inspector fixture declares workpackage');
  context.assert(fixture.manifest.metadata.renderMode === 'shell-first', 'UX Inspector fixture declares shell-first mode');
  context.assert(fixture.manifest.metadata.targetCount === 31, 'UX Inspector fixture declares target count');
  context.assert(fixture.manifest.metadata.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'UX Inspector fixture keeps kernel boundary visible');
  assertIncludesAll(context, adapterIds, ['xtend.component', 'xtend.xrouter', 'rmt.state-scheduler-diagnostics', 'xtend.fabric-telemetry', 'xtend.component-lab-ux-inspector'], 'UX Inspector adapters');
  assertIncludesAll(context, componentIds, ['lab.ux.shell', 'lab.ux.router', 'lab.ux.family.matrix', 'lab.ux.preview.host', 'lab.ux.panel.state', 'lab.ux.panel.styling', 'lab.ux.panel.a11y', 'lab.ux.panel.performance', 'lab.ux.panel.component.network', 'lab.ux.panel.telemetry', 'lab.ux.panel.source.links'], 'UX Inspector components');
  assertIncludesAll(context, routeIds, ['lab.ux.overview', 'lab.ux.family', 'lab.ux.component.preview', 'lab.ux.rmt', 'lab.ux.telemetry', 'lab.ux.network'], 'UX Inspector routes');
  assertIncludesAll(context, scheduleIds, ['lab.ux.shell.render', 'lab.ux.route.render', 'component.visible.mount', 'component.idle.hydrate', 'component.lazy.hydrate', 'inspector.ux.aggregate', 'inspector.rmt.parse', 'inspector.state.snapshot', 'inspector.styling.tokens', 'inspector.a11y.hints', 'inspector.performance.hints', 'inspector.network.map', 'inspector.telemetry.snapshot', 'inspector.source.links', 'diagnostics.snapshot'], 'UX Inspector schedules');
  assertIncludesAll(context, templateIds, ['lab.ux.shell.template', 'lab.ux.header', 'lab.ux.overview.template', 'lab.ux.family.template', 'lab.ux.preview.template', 'lab.ux.rmt.template', 'lab.ux.telemetry.template', 'lab.ux.network.template'], 'UX Inspector templates');
  context.assert(fixture.diagnostics.schema === 'xtend.epic11.component-lab-ux-inspector-diagnostics.v1', 'UX Inspector fixture declares diagnostics schema');
  assertIncludesAll(context, fixture.diagnostics.familySchemas, [FORM_CONTROLS_UX_SCHEMA, FEEDBACK_STATUS_UX_SCHEMA, NAVIGATION_ROUTING_UX_SCHEMA, OVERLAY_INTERACTION_UX_SCHEMA, LAYOUT_DISPLAY_MEDIA_UX_SCHEMA], 'UX Inspector family schemas');
  assertAllRouteReferencesResolve(context, fixture);
  assertAllComponentSchedulesResolve(context, fixture);

  context.assertIncludes(doc, COMPONENT_LAB_UX_INSPECTOR_SCHEMA, 'UX Inspector contract document declares schema');
  context.assertIncludes(doc, COMPONENT_LAB_UX_INSPECTOR_LOCAL_GATE, 'UX Inspector contract documents local gate');
  context.assertIncludes(doc, FORM_CONTROLS_UX_SCHEMA, 'UX Inspector contract links Form Controls UX schema');
  context.assertIncludes(doc, FEEDBACK_STATUS_UX_SCHEMA, 'UX Inspector contract links Feedback Status UX schema');
  context.assertIncludes(doc, NAVIGATION_ROUTING_UX_SCHEMA, 'UX Inspector contract links Navigation Routing UX schema');
  context.assertIncludes(doc, OVERLAY_INTERACTION_UX_SCHEMA, 'UX Inspector contract links Overlay Interaction UX schema');
  context.assertIncludes(doc, LAYOUT_DISPLAY_MEDIA_UX_SCHEMA, 'UX Inspector contract links Layout Display Media UX schema');
  context.assertIncludes(doc, '31', 'UX Inspector contract documents target count');
  context.assertIncludes(doc, 'no-rmt-kernel-import-of-xtend-types', 'UX Inspector contract keeps kernel boundary visible');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E11-13 is completed');
  context.assertIncludes(workpackage, COMPONENT_LAB_UX_INSPECTOR_LOCAL_GATE, 'WP-E11-13 documents local gate');
  context.assertIncludes(docsComponentLab, COMPONENT_LAB_UX_INSPECTOR_SCHEMA, 'Component Lab docs document UX Inspector schema');
  context.assertIncludes(docsComponentLab, '31', 'Component Lab docs document 31 UX targets');
  context.assertIncludes(previewReadme, COMPONENT_LAB_UX_INSPECTOR_SCHEMA, 'Preview README documents UX Inspector schema');
  context.assertIncludes(scaffoldConfig, 'componentLabUxInspector', 'Scaffold config exposes UX Inspector metadata');
  context.assertIncludes(epic, '| `WP-E11-13` | P1 | completed |', 'Epic 11 marks WP-E11-13 completed');
  context.assertIncludes(epic, '| `WP-E11-14` | P1 | completed |', 'Epic 11 marks WP-E11-14 completed');
  context.assertIncludes(epic, '| `WP-E11-15` | P1 | completed |', 'Epic 11 marks WP-E11-15 completed');
  context.assertIncludes(epic, '| `WP-E11-16` | P1 | completed |', 'Epic 11 marks WP-E11-16 completed');
  context.assertIncludes(epic, '| `WP-E11-17` | P2 | completed |', 'Epic 11 marks WP-E11-17 completed');
  context.assertIncludes(backlog, '| `WP-E11-13` | P1 | completed | WS7 |', 'Backlog marks WP-E11-13 completed');
  context.assertIncludes(backlog, '| `WP-E11-14` | P1 | completed | WS8 |', 'Backlog marks WP-E11-14 completed');
  context.assertIncludes(backlog, '| `WP-E11-15` | P1 | completed | WS8 |', 'Backlog marks WP-E11-15 completed');
  context.assertIncludes(backlog, '| `WP-E11-16` | P1 | completed | WS9 |', 'Backlog marks WP-E11-16 completed');
  context.assertIncludes(backlog, '| `WP-E11-17` | P2 | completed | WS10 |', 'Backlog marks WP-E11-17 completed');
  context.assertIncludes(registry, COMPONENT_LAB_UX_INSPECTOR_DOC_PATH, 'Reference registry links UX Inspector contract');
  context.assertIncludes(registry, COMPONENT_LAB_UX_INSPECTOR_FIXTURE_PATH, 'Reference registry links UX Inspector fixture');
  context.assertIncludes(registry, COMPONENT_LAB_UX_INSPECTOR_SUITE_PATH, 'Reference registry links UX Inspector suite');
  context.assert(runner.hasSuite("component-lab-ux-inspector"), 'XTend runner registers UX Inspector suite');
  context.assert((typeof packageManifest.exports['./builder/preview/component-lab-ux-inspector'] === 'string' ? packageManifest.exports['./builder/preview/component-lab-ux-inspector'] : packageManifest.exports['./builder/preview/component-lab-ux-inspector'] && packageManifest.exports['./builder/preview/component-lab-ux-inspector'].default) === './xtend-builder/preview/component-lab-ux-inspector.js', 'Package exports UX Inspector module');
  context.assert(packageManifest.scripts['test:component-lab-ux-inspector'] === 'node scripts/run_xtend_tests.js component-lab-ux-inspector', 'Package exposes UX Inspector test script');
  context.assert(metadata && metadata.schema === COMPONENT_LAB_UX_INSPECTOR_SCHEMA, 'Package metadata exposes UX Inspector schema');
  context.assert(metadata && metadata.reportSchema === COMPONENT_LAB_UX_INSPECTOR_REPORT_SCHEMA, 'Package metadata exposes UX Inspector report schema');
  context.assert(metadata && metadata.fixture === COMPONENT_LAB_UX_INSPECTOR_FIXTURE_PATH, 'Package metadata exposes UX Inspector fixture');
  context.assert(metadata && metadata.localGate === COMPONENT_LAB_UX_INSPECTOR_LOCAL_GATE, 'Package metadata exposes UX Inspector local gate');
  context.assert(metadata && metadata.previewTargetCount === 31, 'Package metadata exposes 31 UX preview targets');
  context.assert(Array.isArray(metadata.uxFamilies) && metadata.uxFamilies.length === 5, 'Package metadata exposes five UX families');

  return context.result({
    report: {
      schema: COMPONENT_LAB_UX_INSPECTOR_REPORT_SCHEMA,
      targetCount: plan.previewTargets.length,
      familyCount: plan.uxFamilies.length,
      panelCount: plan.lab.requiredPanels.length,
      inspectorDomains: plan.inspector.domains.length,
      fixture: COMPONENT_LAB_UX_INSPECTOR_FIXTURE_PATH
    }
  });
}

function printComponentLabUxInspectorReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 11 Component Lab UX Inspector erfolgreich.',
    failureTitle: 'Epic 11 Component Lab UX Inspector fehlgeschlagen:'
  });
}

module.exports = {
  printComponentLabUxInspectorReport,
  runComponentLabUxInspectorSuite
};
