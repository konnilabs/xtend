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
  COMPONENT_LAB_DOC_PATH,
  COMPONENT_LAB_FIXTURE_PATH,
  COMPONENT_LAB_GATE_SCHEMA,
  COMPONENT_LAB_LOCAL_GATE,
  COMPONENT_LAB_SCHEMA,
  COMPONENT_LAB_SUITE_PATH,
  COMPONENT_LAB_WP_PATH,
  REQUIRED_INSPECTOR_DOMAINS,
  REQUIRED_LAB_PANELS,
  createComponentLabGate,
  createComponentLabPlan,
  validateComponentLabPlan
} = require('../../xtend-builder/preview/component-lab');
const {
  EXPECTED_COMPONENT_ORDER
} = require('../../catalog/epic10-p0-component-wave');

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

function runComponentLabRmtInspectorSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'component-lab-rmt-inspector',
    label: 'Epic 10 Component Lab and RMT Inspector Pilot'
  });
  const plan = createComponentLabPlan({ rootDir });
  const validation = validateComponentLabPlan(plan);
  const gate = createComponentLabGate({ rootDir, plan });
  const fixture = readJson(COMPONENT_LAB_FIXTURE_PATH, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const epic = readText('development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const componentPlatformDocs = readText('docs/component-platform.md', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const doc = readText(COMPONENT_LAB_DOC_PATH, rootDir);
  const workpackage = readText(COMPONENT_LAB_WP_PATH, rootDir);
  const previewReadme = readText('xtend-builder/preview/README.md', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.componentLabRmtInspector;
  const routeIds = (fixture.routes || []).map((route) => route.id);
  const scheduleIds = (fixture.schedules || []).map((schedule) => schedule.id);
  const componentIds = (fixture.components || []).map((component) => component.id);
  const templateIds = (fixture.templates || []).map((template) => template.id);
  const targetTags = plan.lab.previewTargets.map((target) => target.tag);

  assertFileExists(context, 'xtend-builder/preview/component-lab.js', rootDir, 'Component Lab module exists');
  assertFileExists(context, COMPONENT_LAB_FIXTURE_PATH, rootDir, 'Component Lab RMT fixture exists');
  assertFileExists(context, COMPONENT_LAB_DOC_PATH, rootDir, 'Component Lab contract document exists');
  assertFileExists(context, COMPONENT_LAB_WP_PATH, rootDir, 'WP-E10-12 workpackage document exists');
  assertFileExists(context, COMPONENT_LAB_SUITE_PATH, rootDir, 'Component Lab suite exists');
  assertFileExists(context, 'docs/component-lab.md', rootDir, 'Component Lab developer docs exist');

  context.assert(plan.schema === COMPONENT_LAB_SCHEMA, 'Component Lab plan declares schema');
  context.assert(plan.status === 'accepted-pilot', 'Component Lab plan is accepted as pilot');
  context.assert(plan.workpackage === 'WP-E10-12', 'Component Lab plan belongs to WP-E10-12');
  context.assert(plan.renderMode === 'shell-first', 'Component Lab plan is shell-first');
  context.assert(plan.localOnly === true, 'Component Lab plan is local-only');
  context.assert(plan.externalNetworkAllowed === false, 'Component Lab rejects external network');
  context.assert(plan.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Component Lab keeps RMT kernel boundary');
  context.assert(validation.schema === COMPONENT_LAB_GATE_SCHEMA, 'Component Lab validator emits gate schema');
  context.assert(validation.ok === true, 'Component Lab validator accepts generated plan');
  context.assert(gate.ok === true, 'Component Lab gate passes');
  context.assert(gate.localGate || plan.localGate === COMPONENT_LAB_LOCAL_GATE, 'Component Lab exposes local gate command');
  context.assert(JSON.stringify(targetTags) === JSON.stringify(EXPECTED_COMPONENT_ORDER), 'Component Lab target order follows Epic 10 P0 wave');
  context.assert(plan.lab.previewTargets.length === 9, 'Component Lab contains nine preview targets');

  REQUIRED_LAB_PANELS.forEach((panel) => {
    context.assert(plan.lab.requiredPanels.includes(panel), `Component Lab requires ${panel} panel`);
  });
  REQUIRED_INSPECTOR_DOMAINS.forEach((domain) => {
    context.assert(plan.inspector.domains.includes(domain), `RMT Inspector exposes ${domain} domain`);
  });

  plan.lab.previewTargets.forEach((target) => {
    context.assert(target.maturity === 'enterprise-ready', `${target.tag} preview target is enterprise-ready`);
    context.assert(target.paths.runtime.startsWith('components/'), `${target.tag} runtime path is local`);
    context.assert(target.paths.source.startsWith('src/components/'), `${target.tag} TypeScript source path is local`);
    context.assert(target.paths.rmtMetadata.endsWith('.rmt.ts'), `${target.tag} exposes RMT metadata source`);
    context.assert(target.paths.fixture.startsWith('tests/components/fixtures/'), `${target.tag} fixture path is local`);
    context.assert(target.paths.docs.startsWith('docs/components/'), `${target.tag} docs path is local`);
    context.assert(target.paths.types.endsWith('.d.ts'), `${target.tag} public types path is declared`);
    context.assert(target.rmt.adapter === 'xtend.component', `${target.tag} uses XTend component adapter`);
    context.assert(target.rmt.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', `${target.tag} keeps RMT boundary`);
    context.assert(target.fabric.api === '@xtend-fabric', `${target.tag} exposes Fabric API`);
    context.assert(target.telemetry.snapshotPath === 'snapshot.componentTelemetry', `${target.tag} binds Component Telemetry snapshot`);
    context.assert(Array.isArray(target.performance.criticalMeasurements) && target.performance.criticalMeasurements.length > 0, `${target.tag} exposes performance hints`);
  });

  context.assert(fixture.kind === 'rmt_document', 'Component Lab fixture is an RMT document');
  context.assert(fixture.manifest.metadata.contractVersion === COMPONENT_LAB_SCHEMA, 'Component Lab fixture declares contract schema');
  context.assert(fixture.manifest.metadata.workpackage === 'WP-E10-12', 'Component Lab fixture is owned by WP-E10-12');
  context.assert(fixture.manifest.metadata.renderMode === 'shell-first', 'Component Lab fixture declares shell-first mode');
  context.assert(fixture.manifest.metadata.kernelBoundary.includes('XTend component execution'), 'Component Lab fixture keeps host execution outside kernel');
  assertIncludesAll(context, fixture.adapters.map((adapter) => adapter.id), ['xtend.component', 'xtend.xrouter', 'rmt.state-scheduler-diagnostics', 'xtend.fabric-telemetry'], 'Component Lab adapters');
  assertIncludesAll(context, componentIds, ['lab.shell', 'lab.router', 'lab.preview.host', 'lab.panel.rmt.inspector', 'lab.panel.telemetry', 'lab.panel.a11y', 'lab.panel.performance', 'lab.panel.source-links'], 'Component Lab components');
  assertIncludesAll(context, routeIds, ['lab.overview', 'lab.component.preview', 'lab.rmt.inspector', 'lab.telemetry'], 'Component Lab routes');
  assertIncludesAll(context, scheduleIds, ['lab.shell.render', 'lab.route.render', 'component.visible.mount', 'component.idle.hydrate', 'inspector.rmt.parse', 'inspector.telemetry.snapshot', 'inspector.a11y.hints', 'inspector.performance.hints'], 'Component Lab schedules');
  assertIncludesAll(context, templateIds, ['lab.shell.template', 'lab.header', 'lab.overview.template', 'lab.preview.template', 'lab.inspector.template', 'lab.telemetry.template'], 'Component Lab templates');
  context.assert(JSON.stringify(fixture).includes('x-select'), 'Component Lab fixture previews x-select');
  context.assert(JSON.stringify(fixture).includes('x-tooltip'), 'Component Lab fixture previews x-tooltip');
  context.assert(JSON.stringify(fixture).includes('x-drawer'), 'Component Lab fixture previews x-drawer');
  context.assert(fixture.diagnostics && fixture.diagnostics.schema === 'xtend.epic10.component-lab-diagnostics.v1', 'Component Lab fixture declares diagnostics schema');
  assertAllRouteReferencesResolve(context, fixture);
  assertAllComponentSchedulesResolve(context, fixture);

  context.assertIncludes(doc, COMPONENT_LAB_SCHEMA, 'Component Lab contract document declares schema');
  context.assertIncludes(doc, 'Component Lab Shell', 'Component Lab contract documents shell');
  context.assertIncludes(doc, 'RMT Inspector', 'Component Lab contract documents RMT Inspector');
  context.assertIncludes(doc, 'Telemetry Panel', 'Component Lab contract documents telemetry panel');
  context.assertIncludes(doc, 'A11y/Performance Hinweise', 'Component Lab contract documents A11y and performance hints');
  context.assertIncludes(doc, 'no-rmt-kernel-import-of-xtend-types', 'Component Lab contract keeps kernel boundary visible');
  context.assertIncludes(doc, COMPONENT_LAB_LOCAL_GATE, 'Component Lab contract documents local gate');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E10-12 is completed');
  context.assertIncludes(workpackage, COMPONENT_LAB_LOCAL_GATE, 'WP-E10-12 documents local gate');
  context.assertIncludes(componentPlatformDocs, 'Component Lab', 'Component Platform docs document Component Lab');
  context.assertIncludes(componentPlatformDocs, 'RMT Inspector', 'Component Platform docs document RMT Inspector');
  context.assertIncludes(docsReadme, 'Component Lab', 'Docs README links Component Lab');
  context.assertIncludes(previewReadme, COMPONENT_LAB_SCHEMA, 'Preview README documents Component Lab schema');
  context.assertIncludes(scaffoldConfig, 'componentLabRmtInspector', 'Scaffold config exposes Component Lab metadata');
  context.assertIncludes(epic, '| `WP-E10-12` | P1 | completed |', 'Epic 10 marks WP-E10-12 completed');
  context.assertIncludes(epic, '| `WP-E10-13` | P1 | completed |', 'Epic 10 marks WP-E10-13 completed');
  context.assertIncludes(epic, '| `WP-E10-14` | P1 | completed |', 'Epic 10 marks WP-E10-14 completed');
  context.assertIncludes(epic, '| `WP-E10-15` | P1 | completed |', 'Epic 10 marks WP-E10-15 completed');
  context.assertIncludes(epic, '| `WP-E10-16` | P2 | completed |', 'Epic 10 marks WP-E10-16 completed');
  context.assertIncludes(backlog, '| `WP-E10-12` | P1 | completed |', 'Backlog marks WP-E10-12 completed');
  context.assertIncludes(backlog, '| `WP-E10-13` | P1 | completed |', 'Backlog marks WP-E10-13 completed');
  context.assertIncludes(backlog, '| `WP-E10-14` | P1 | completed |', 'Backlog marks WP-E10-14 completed');
  context.assertIncludes(backlog, '| `WP-E10-15` | P1 | completed |', 'Backlog marks WP-E10-15 completed');
  context.assertIncludes(backlog, '| `WP-E10-16` | P2 | completed |', 'Backlog marks WP-E10-16 completed');
  context.assertIncludes(registry, COMPONENT_LAB_DOC_PATH, 'Reference registry links Component Lab contract');
  context.assertIncludes(registry, COMPONENT_LAB_FIXTURE_PATH, 'Reference registry links Component Lab fixture');
  context.assertIncludes(registry, COMPONENT_LAB_SUITE_PATH, 'Reference registry links Component Lab suite');
  context.assertIncludes(runner, "id: 'component-lab-rmt-inspector'", 'XTend runner registers Component Lab suite');
  context.assert((typeof packageManifest.exports['./builder/preview/component-lab'] === 'string' ? packageManifest.exports['./builder/preview/component-lab'] : packageManifest.exports['./builder/preview/component-lab'] && packageManifest.exports['./builder/preview/component-lab'].default) === './xtend-builder/preview/component-lab.js', 'Package exports Component Lab module');
  context.assert(packageManifest.scripts['test:component-lab'] === 'node scripts/run_xtend_tests.js component-lab-rmt-inspector', 'Package exposes Component Lab test script');
  context.assert(metadata && metadata.schema === COMPONENT_LAB_SCHEMA, 'Package metadata exposes Component Lab schema');
  context.assert(metadata && metadata.fixture === COMPONENT_LAB_FIXTURE_PATH, 'Package metadata exposes Component Lab fixture path');
  context.assert(metadata && metadata.localGate === COMPONENT_LAB_LOCAL_GATE, 'Package metadata exposes Component Lab local gate');
  context.assert(Array.isArray(metadata.previewTargets) && metadata.previewTargets.length === 9, 'Package metadata exposes nine Component Lab preview targets');

  return context.result({
    report: {
      schema: COMPONENT_LAB_GATE_SCHEMA,
      previewTargets: plan.lab.previewTargets.length,
      panels: plan.lab.requiredPanels.length,
      inspectorDomains: plan.inspector.domains.length,
      fixture: COMPONENT_LAB_FIXTURE_PATH
    }
  });
}

function printComponentLabRmtInspectorReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 10 Component Lab und RMT Inspector Pilot erfolgreich.',
    failureTitle: 'Epic 10 Component Lab und RMT Inspector Pilot fehlgeschlagen:'
  });
}

module.exports = {
  printComponentLabRmtInspectorReport,
  runComponentLabRmtInspectorSuite
};
