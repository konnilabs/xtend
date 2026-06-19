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
  COMPONENT_DOCS,
  COMPONENT_FIXTURES,
  COMPONENT_SUITES,
  COMPONENT_TAGS,
  KERNEL_BOUNDARY,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_ARTIFACTS,
  REQUIRED_DOCS,
  REQUIRED_EVENTS,
  REQUIRED_MANAGER_METHODS,
  REQUIRED_SLOTS,
  REQUIRED_WINDOW_METHODS,
  RUNTIME_ARTIFACTS,
  SOURCE_ARTIFACTS,
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_MANAGER_SCHEMA,
  SURFACE_MANAGER_WINDOW_RUNTIME_CONTRACT,
  SURFACE_MANAGER_WINDOW_RUNTIME_DOCS,
  SURFACE_MANAGER_WINDOW_RUNTIME_LOCAL_GATE,
  SURFACE_MANAGER_WINDOW_RUNTIME_MODULE,
  SURFACE_MANAGER_WINDOW_RUNTIME_PACKAGE_SCRIPT,
  SURFACE_MANAGER_WINDOW_RUNTIME_PLAN,
  SURFACE_MANAGER_WINDOW_RUNTIME_REPORT_SCHEMA,
  SURFACE_MANAGER_WINDOW_RUNTIME_SCHEMA,
  SURFACE_MANAGER_WINDOW_RUNTIME_STATUS,
  SURFACE_MANAGER_WINDOW_RUNTIME_SUITE,
  SURFACE_MANAGER_WINDOW_RUNTIME_TARGET,
  SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE,
  SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE_DOC,
  SURFACE_RECORD_SCHEMA,
  SURFACE_SNAPSHOT_SCHEMA,
  createSurfaceManagerWindowRuntimePlan,
  createSurfaceManagerWindowRuntimeReport,
  validateSurfaceManagerWindowRuntimePlan
} = require('../../catalog/surface-manager-window-runtime');

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

function runSurfaceManagerRuntimeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'surface-manager',
    label: 'SurfaceManager window runtime contract'
  });
  const plan = createSurfaceManagerWindowRuntimePlan({ rootDir });
  const validation = validateSurfaceManagerWindowRuntimePlan(plan);
  const report = createSurfaceManagerWindowRuntimeReport({ rootDir, plan });
  const manifest = readJson('components/manifest.json', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerWindowRuntime;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const managerRuntime = readText('components/xsurfacemanager.js', rootDir);
  const windowRuntime = readText('components/xsurfacewindow.js', rootDir);
  const managerTypes = readText('components/xsurfacemanager.d.ts', rootDir);
  const windowTypes = readText('components/xsurfacewindow.d.ts', rootDir);
  const sourceText = SOURCE_ARTIFACTS.map((filePath) => readText(filePath, rootDir)).join('\n');
  const managerFixture = readText('tests/components/fixtures/xsurfacemanager.component.html', rootDir);
  const windowFixture = readText('tests/components/fixtures/xsurfacewindow.component.html', rootDir);
  const managerDocs = readText('docs/components/xsurfacemanager.md', rootDir);
  const windowDocs = readText('docs/components/xsurfacewindow.md', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const referenceRegistry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const planningDoc = readText(SURFACE_MANAGER_WINDOW_RUNTIME_PLAN, rootDir);
  const contractDoc = readText(SURFACE_MANAGER_WINDOW_RUNTIME_CONTRACT, rootDir);
  const workpackageDoc = readText(SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE_DOC, rootDir);
  const docs = readText(SURFACE_MANAGER_WINDOW_RUNTIME_DOCS, rootDir);

  const syntaxTargets = [
    SURFACE_MANAGER_WINDOW_RUNTIME_MODULE,
    SURFACE_MANAGER_WINDOW_RUNTIME_SUITE,
    'components/xsurfacemanager.js',
    'components/xsurfacewindow.js',
    'tests/components/xsurfacemanager.component_suite.js',
    'tests/components/xsurfacewindow.component_suite.js'
  ];

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as SurfaceManager runtime artifact`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as SurfaceManager runtime doc`);
  });

  syntaxTargets.forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  context.assert(plan.schema === SURFACE_MANAGER_WINDOW_RUNTIME_SCHEMA, 'SurfaceManager runtime schema is stable');
  context.assert(plan.reportSchema === SURFACE_MANAGER_WINDOW_RUNTIME_REPORT_SCHEMA, 'SurfaceManager runtime report schema is stable');
  context.assert(plan.surfaceManagerSchema === SURFACE_MANAGER_SCHEMA, 'SurfaceManager runtime reuses manager schema');
  context.assert(plan.surfaceRecordSchema === SURFACE_RECORD_SCHEMA, 'SurfaceManager runtime reuses record schema');
  context.assert(plan.surfaceControllerSchema === SURFACE_CONTROLLER_SCHEMA, 'SurfaceManager runtime reuses controller schema');
  context.assert(plan.snapshotSchema === SURFACE_SNAPSHOT_SCHEMA, 'SurfaceManager runtime reuses snapshot schema');
  context.assert(plan.workpackage === SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE, 'SurfaceManager runtime belongs to WP-SM-03');
  context.assert(plan.status === SURFACE_MANAGER_WINDOW_RUNTIME_STATUS, 'SurfaceManager runtime status is accepted');
  context.assert(plan.targetReadiness === SURFACE_MANAGER_WINDOW_RUNTIME_TARGET, 'SurfaceManager runtime target is ready');
  context.assert(plan.featureFlags.xSurfaceManagerImplemented === true, 'x-surface-manager is implemented');
  context.assert(plan.featureFlags.xSurfaceWindowImplemented === true, 'x-surface-window is implemented');
  context.assert(plan.featureFlags.sidePanelImplemented === false, 'x-side-panel remains WP-SM-04');
  context.assert(plan.featureFlags.usesControllerFromWpSm02 === true, 'WP-SM-03 uses the WP-SM-02 controller');
  context.assert(plan.featureFlags.createsSecondRegistry === false, 'WP-SM-03 rejects a second controller registry');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'SurfaceManager runtime keeps kernel boundary');
  context.assert(plan.nextWorkpackage === NEXT_WORKPACKAGE, 'SurfaceManager runtime hands off to WP-SM-04');
  context.assert(plan.nextDecision === NEXT_DECISION, 'SurfaceManager runtime exposes next decision');
  context.assert(validation.ok === true, 'SurfaceManager runtime plan validates');
  context.assert(report.ok === true, 'SurfaceManager runtime report validates');
  assertIncludesAll(context, plan.componentTags, COMPONENT_TAGS, 'SurfaceManager runtime component tags');
  assertIncludesAll(context, plan.managerMethods, REQUIRED_MANAGER_METHODS, 'SurfaceManager methods');
  assertIncludesAll(context, plan.windowMethods, REQUIRED_WINDOW_METHODS, 'SurfaceWindow methods');
  assertIncludesAll(context, plan.events, REQUIRED_EVENTS, 'Surface runtime events');
  assertIncludesAll(context, plan.slots, REQUIRED_SLOTS, 'SurfaceManager slots');

  context.assert(manifest['x-surface-manager'] === './xsurfacemanager.js', 'Manifest loads x-surface-manager locally');
  context.assert(manifest['x-surface-window'] === './xsurfacewindow.js', 'Manifest loads x-surface-window locally');

  assertTextIncludesAll(context, managerRuntime, [
    "import { xstate } from './xstate.js';",
    "import './xsurfacemanager-controller.js';",
    "customElements.define('x-surface-manager'",
    'attachShadow({ mode: \'open\' })',
    'xtend.surface.manager.v1',
    'xtend.surface.controller.v1',
    'xtend.surface.snapshot.v1',
    'surface-window-command',
    'registerSurface(surface)',
    'openSurface(id, input)',
    'closeSurface(id, reason)',
    'destroySurface(id, options = {})',
    'focusSurface(id)',
    'moveSurface(id, bounds)',
    'resizeSurface(id, bounds)',
    'materializeSurface(id, input)',
    'toggleSurface(id, input)',
    "_cancelSurfaceHydration(surfaceId, reason = 'destroy')",
    '_cleanupDestroyedSurfaceState(surfaceId, options = {})',
    'surface-destroyed',
    'surface-destroy-error',
    'slot name="windows"',
    'slot name="panels"',
    'slot name="overlays"',
    'surface-layout-changed',
    'no-rmt-kernel-import-of-xtend-types'
  ], 'x-surface-manager runtime');

  assertTextIncludesAll(context, windowRuntime, [
    "customElements.define('x-surface-window'",
    'attachShadow({ mode: \'open\' })',
    'xtend.surface.record.v1',
    'surface-window-command',
    'toSurfaceRecord(managerId)',
    'applySurfaceSnapshot(record)',
    'openWindow()',
    'closeWindow(reason)',
    'focusWindow()',
    'minimizeWindow()',
    'maximizeWindow()',
    'restoreWindow()',
    'initial-x',
    'initial-y',
    'initial-width',
    'initial-height',
    'pointerdown',
    'ArrowLeft',
    'prefers-reduced-motion',
    'forced-colors',
    'no-rmt-kernel-import-of-xtend-types'
  ], 'x-surface-window runtime');

  assertTextIncludesAll(context, managerTypes, [
    'interface XSurfaceManagerElement',
    'registerSurface',
    'openSurface',
    'destroySurface',
    'surface-destroyed',
    'surface-destroy-error',
    'materializeSurface',
    'toggleSurface',
    'layoutSnapshot',
    'surfaceController'
  ], 'x-surface-manager types');
  assertTextIncludesAll(context, windowTypes, [
    'interface XSurfaceWindowElement',
    'toSurfaceRecord',
    'applySurfaceSnapshot',
    'surface-window-command'
  ], 'x-surface-window types');
  assertTextIncludesAll(context, sourceText, [
    'xSurfaceManagerContract',
    'xSurfaceWindowContract',
    'xtend.surface.manager.v1',
    'xtend.surface.record.v1',
    'xtend.surface.controller.v1',
    'destroySurface',
    'surface-destroyed'
  ], 'SurfaceManager TypeScript source');

  assertTextIncludesAll(context, managerFixture, [
    '<x-surface-manager',
    '/components/xsurfacemanager.js',
    '/components/xsurfacewindow.js',
    'surface-id="workbench.inspector"',
    'surface-id="workbench.editor"',
    '__xtendComponentResult'
  ], 'x-surface-manager fixture');
  assertTextIncludesAll(context, windowFixture, [
    '<x-surface-window',
    '/components/xsurfacewindow.js',
    'surface-window-command',
    'initial-width="640"',
    '__xtendComponentResult'
  ], 'x-surface-window fixture');
  [managerFixture, windowFixture].forEach((fixture, index) => {
    context.assert(!fixture.includes('https://cdn.ccs-networks.de'), `Surface fixture ${index + 1} has no CDN dependency`);
  });

  assertTextIncludesAll(context, managerDocs, [
    '# x-surface-manager',
    'xtend.surface.manager.v1',
    'xtend.surface.controller.v1',
    'surface-layout-changed',
    'destroySurface',
    'surface-destroyed',
    'xtend.surface.tombstone.v1'
  ], 'x-surface-manager component docs');
  assertTextIncludesAll(context, windowDocs, [
    '# x-surface-window',
    'xtend.surface.record.v1',
    'surface-window-command',
    'applySurfaceSnapshot'
  ], 'x-surface-window component docs');
  assertTextIncludesAll(context, docs, [
    SURFACE_MANAGER_WINDOW_RUNTIME_SCHEMA,
    'x-surface-manager',
    'x-surface-window',
    'surface-window-command',
    'destroySurface',
    'surface-destroyed',
    'xtend.surface.tombstone.v1',
    'WP-SM-04'
  ], 'SurfaceManager runtime docs');
  assertTextIncludesAll(context, contractDoc, [
    SURFACE_MANAGER_WINDOW_RUNTIME_SCHEMA,
    'x-surface-manager',
    'x-surface-window',
    'controller-snapshot-to-window-attributes-css-vars',
    'manifest-loadable-components'
  ], 'SurfaceManager runtime contract doc');
  assertTextIncludesAll(context, workpackageDoc, [
    SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE,
    SURFACE_MANAGER_WINDOW_RUNTIME_LOCAL_GATE,
    'Done Criteria',
    'x-side-panel'
  ], 'SurfaceManager runtime workpackage doc');

  context.assert(metadata && metadata.schema === SURFACE_MANAGER_WINDOW_RUNTIME_SCHEMA, 'Package metadata exposes SurfaceManager runtime schema');
  context.assert(metadata && metadata.workpackage === SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE, 'Package metadata exposes WP-SM-03');
  context.assert(metadata && metadata.localGate === SURFACE_MANAGER_WINDOW_RUNTIME_LOCAL_GATE, 'Package metadata exposes SurfaceManager runtime local gate');
  context.assert(metadata && metadata.packageScript === SURFACE_MANAGER_WINDOW_RUNTIME_PACKAGE_SCRIPT, 'Package metadata exposes SurfaceManager runtime package script');
  context.assert(metadata && Array.isArray(metadata.componentTags) && metadata.componentTags.includes('x-surface-window'), 'Package metadata exposes Surface component tags');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Package metadata exposes WP-SM-04 handoff');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:surface-manager'] === 'node scripts/run_xtend_tests.js surface-manager', 'Package script test:surface-manager exists');
  context.assertIncludes(scaffoldConfig, 'surfaceManagerWindowRuntime', 'Scaffold config exposes surfaceManagerWindowRuntime');
  context.assertIncludes(scaffoldConfig, 'components/xsurfacemanager.js', 'Scaffold config references x-surface-manager runtime');
  context.assertIncludes(runner, "require('../tests/components/surface_manager_runtime_suite')", 'Runner imports SurfaceManager runtime suite');
  context.assertIncludes(runner, "id: 'surface-manager'", 'Runner registers surface-manager suite');
  context.assertIncludes(docsReadme, 'SurfaceManager Window Runtime', 'Docs README links SurfaceManager runtime');
  context.assertIncludes(docsMenu, 'surface-manager-window-runtime', 'Docs menu contains SurfaceManager runtime page');
  context.assertIncludes(referenceRegistry, 'WP-SM-03', 'Reference registry contains WP-SM-03');
  context.assertIncludes(referenceRegistry, 'components/xsurfacemanager.js', 'Reference registry contains x-surface-manager runtime');
  context.assertIncludes(planningDoc, '`WP-SM-03` | P0 | completed', 'Planning doc marks WP-SM-03 completed');
  context.assertIncludes(planningDoc, '`WP-SM-04` | P1 | completed', 'Planning doc marks WP-SM-04 completed after side-panel runtime');

  RUNTIME_ARTIFACTS.forEach((filePath) => context.assert(plan.runtimeArtifacts.includes(filePath), `Plan lists runtime artifact ${filePath}`));
  SOURCE_ARTIFACTS.forEach((filePath) => context.assert(plan.sourceArtifacts.includes(filePath), `Plan lists source artifact ${filePath}`));
  COMPONENT_DOCS.forEach((filePath) => context.assert(plan.componentDocs.includes(filePath), `Plan lists component doc ${filePath}`));
  COMPONENT_FIXTURES.forEach((filePath) => context.assert(plan.componentFixtures.includes(filePath), `Plan lists component fixture ${filePath}`));
  COMPONENT_SUITES.forEach((filePath) => context.assert(plan.componentSuites.includes(filePath), `Plan lists component suite ${filePath}`));

  return context.result({
    schema: SURFACE_MANAGER_WINDOW_RUNTIME_REPORT_SCHEMA,
    workpackage: SURFACE_MANAGER_WINDOW_RUNTIME_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_WINDOW_RUNTIME_TARGET,
    components: COMPONENT_TAGS.length,
    events: REQUIRED_EVENTS.length
  });
}

function printSurfaceManagerRuntimeReport(result) {
  printSuiteReport(result, {
    successTitle: 'SurfaceManager Window Runtime Contract erfolgreich.',
    failureTitle: 'SurfaceManager Window Runtime Contract fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceManagerRuntimeReport,
  runSurfaceManagerRuntimeSuite
};

if (require.main === module) {
  const result = runSurfaceManagerRuntimeSuite();
  printSurfaceManagerRuntimeReport(result);
  process.exit(result.ok ? 0 : 1);
}
