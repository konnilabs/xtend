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
  REQUIRED_MODES,
  REQUIRED_PANEL_METHODS,
  REQUIRED_PLACEMENTS,
  RUNTIME_ARTIFACTS,
  SOURCE_ARTIFACTS,
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_MANAGER_SCHEMA,
  SURFACE_MANAGER_SIDE_PANEL_CONTRACT,
  SURFACE_MANAGER_SIDE_PANEL_DOCS,
  SURFACE_MANAGER_SIDE_PANEL_LOCAL_GATE,
  SURFACE_MANAGER_SIDE_PANEL_MODULE,
  SURFACE_MANAGER_SIDE_PANEL_PACKAGE_SCRIPT,
  SURFACE_MANAGER_SIDE_PANEL_PLAN,
  SURFACE_MANAGER_SIDE_PANEL_REPORT_SCHEMA,
  SURFACE_MANAGER_SIDE_PANEL_SCHEMA,
  SURFACE_MANAGER_SIDE_PANEL_STATUS,
  SURFACE_MANAGER_SIDE_PANEL_SUITE,
  SURFACE_MANAGER_SIDE_PANEL_TARGET,
  SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE,
  SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE_DOC,
  SURFACE_RECORD_SCHEMA,
  SURFACE_SNAPSHOT_SCHEMA,
  createSurfaceManagerSidePanelPlan,
  createSurfaceManagerSidePanelReport,
  validateSurfaceManagerSidePanelPlan
} = require('../../catalog/surface-manager-side-panel-runtime');

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

function runSurfaceManagerSidePanelSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'surface-side-panel',
    label: 'SurfaceManager side-panel runtime contract'
  });
  const plan = createSurfaceManagerSidePanelPlan({ rootDir });
  const validation = validateSurfaceManagerSidePanelPlan(plan);
  const report = createSurfaceManagerSidePanelReport({ rootDir, plan });
  const manifest = readJson('components/manifest.json', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerSidePanelRuntime;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const managerRuntime = readText('components/xsurfacemanager.js', rootDir);
  const panelRuntime = readText('components/xsidepanel.js', rootDir);
  const panelTypes = readText('components/xsidepanel.d.ts', rootDir);
  const sourceText = SOURCE_ARTIFACTS.map((filePath) => readText(filePath, rootDir)).join('\n');
  const panelFixture = readText('tests/components/fixtures/xsidepanel.component.html', rootDir);
  const panelDocs = readText('docs/components/xsidepanel.md', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const referenceRegistry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const planningDoc = readText(SURFACE_MANAGER_SIDE_PANEL_PLAN, rootDir);
  const contractDoc = readText(SURFACE_MANAGER_SIDE_PANEL_CONTRACT, rootDir);
  const workpackageDoc = readText(SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE_DOC, rootDir);
  const docs = readText(SURFACE_MANAGER_SIDE_PANEL_DOCS, rootDir);

  const syntaxTargets = [
    SURFACE_MANAGER_SIDE_PANEL_MODULE,
    SURFACE_MANAGER_SIDE_PANEL_SUITE,
    'components/xsidepanel.js',
    'tests/components/xsidepanel.component_suite.js'
  ];

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as SurfaceManager side-panel artifact`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as SurfaceManager side-panel doc`);
  });

  syntaxTargets.forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  context.assert(plan.schema === SURFACE_MANAGER_SIDE_PANEL_SCHEMA, 'SurfaceManager side-panel schema is stable');
  context.assert(plan.reportSchema === SURFACE_MANAGER_SIDE_PANEL_REPORT_SCHEMA, 'SurfaceManager side-panel report schema is stable');
  context.assert(plan.surfaceManagerSchema === SURFACE_MANAGER_SCHEMA, 'SurfaceManager side-panel reuses manager schema');
  context.assert(plan.surfaceRecordSchema === SURFACE_RECORD_SCHEMA, 'SurfaceManager side-panel reuses record schema');
  context.assert(plan.surfaceControllerSchema === SURFACE_CONTROLLER_SCHEMA, 'SurfaceManager side-panel reuses controller schema');
  context.assert(plan.snapshotSchema === SURFACE_SNAPSHOT_SCHEMA, 'SurfaceManager side-panel reuses snapshot schema');
  context.assert(plan.workpackage === SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE, 'SurfaceManager side-panel belongs to WP-SM-04');
  context.assert(plan.status === SURFACE_MANAGER_SIDE_PANEL_STATUS, 'SurfaceManager side-panel status is accepted');
  context.assert(plan.targetReadiness === SURFACE_MANAGER_SIDE_PANEL_TARGET, 'SurfaceManager side-panel target is ready');
  context.assert(plan.featureFlags.xSidePanelImplemented === true, 'x-side-panel is implemented');
  context.assert(plan.featureFlags.dockedModeImplemented === true, 'Docked side-panel mode is implemented');
  context.assert(plan.featureFlags.overlayModeImplemented === true, 'Overlay side-panel mode is implemented');
  context.assert(plan.featureFlags.pinnedModeImplemented === true, 'Pinned side-panel mode is implemented');
  context.assert(plan.featureFlags.collapsedModeImplemented === true, 'Collapsed side-panel mode is implemented');
  context.assert(plan.featureFlags.responsiveFullscreenImplemented === true, 'Responsive full-screen mode is implemented');
  context.assert(plan.featureFlags.usesControllerFromWpSm02 === true, 'WP-SM-04 uses the WP-SM-02 controller');
  context.assert(plan.featureFlags.createsSecondRegistry === false, 'WP-SM-04 rejects a second controller registry');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'SurfaceManager side-panel keeps kernel boundary');
  context.assert(plan.nextWorkpackage === NEXT_WORKPACKAGE, 'SurfaceManager side-panel hands off to WP-SM-05');
  context.assert(plan.nextDecision === NEXT_DECISION, 'SurfaceManager side-panel exposes next decision');
  context.assert(validation.ok === true, 'SurfaceManager side-panel plan validates');
  context.assert(report.ok === true, 'SurfaceManager side-panel report validates');
  assertIncludesAll(context, plan.componentTags, COMPONENT_TAGS, 'SurfaceManager side-panel component tags');
  assertIncludesAll(context, plan.managerMethods, REQUIRED_MANAGER_METHODS, 'SurfaceManager side-panel manager methods');
  assertIncludesAll(context, plan.panelMethods, REQUIRED_PANEL_METHODS, 'SidePanel methods');
  assertIncludesAll(context, plan.events, REQUIRED_EVENTS, 'Surface side-panel events');
  assertIncludesAll(context, plan.placements, REQUIRED_PLACEMENTS, 'Surface side-panel placements');
  assertIncludesAll(context, plan.modes, REQUIRED_MODES, 'Surface side-panel modes');

  context.assert(manifest['x-side-panel'] === './xsidepanel.js', 'Manifest loads x-side-panel locally');
  context.assert(manifest['x-surface-manager'] === './xsurfacemanager.js', 'Manifest still loads x-surface-manager locally');

  assertTextIncludesAll(context, managerRuntime, [
    'x-surface-window, x-side-panel',
    'surface-panel-command',
    'pinSurface(id, pinned = true)',
    'collapseSurface(id)',
    'expandSurface(id, mode = \'docked\')',
    'dockSurface(id, placement = \'right\', mode = \'docked\')',
    'x-side-panel[surface-id=',
    'no-rmt-kernel-import-of-xtend-types'
  ], 'x-surface-manager side-panel bridge');

  assertTextIncludesAll(context, panelRuntime, [
    "customElements.define('x-side-panel'",
    'attachShadow({ mode: \'open\' })',
    'xtend.surface.record.v1',
    'type: \'side-panel\'',
    'surface-panel-command',
    'toSurfaceRecord(managerId)',
    'applySurfaceSnapshot(record)',
    'openPanel()',
    'closePanel(reason)',
    'focusPanel()',
    'minimizePanel()',
    'pinPanel()',
    'collapsePanel()',
    'expandPanel(mode = \'docked\')',
    'setPanelMode(mode, placement = this._placement())',
    'resizePanel(bounds)',
    'collapsible',
    'closable',
    'pinnable',
    'disabledCapabilities',
    '_disabledCapabilities()',
    '_applyLocalCommand(command, payload = {})',
    'minimized',
    'placement="bottom"',
    'mode="overlay"',
    'mode="pinned"',
    'collapsed',
    'fullscreen-under-720',
    'prefers-reduced-motion',
    'forced-colors',
    'no-rmt-kernel-import-of-xtend-types'
  ], 'x-side-panel runtime');

  assertTextIncludesAll(context, panelTypes, [
    'interface XSidePanelElement',
    'XSidePanelPlacement',
    'XSidePanelMode',
    'collapsible',
    'closable',
    'pinnable',
    'toSurfaceRecord',
    'applySurfaceSnapshot',
    'minimizePanel',
    'surface-panel-command'
  ], 'x-side-panel types');
  assertTextIncludesAll(context, sourceText, [
    'xSurfaceManagerContract',
    'xSidePanelContract',
    'x-side-panel',
    'xtend.surface.record.v1',
    'minimizePanel',
    'collapsible',
    'closable',
    'pinnable',
    'surface-panel-command',
    'fullscreen-under-720'
  ], 'SurfaceManager side-panel TypeScript source');

  assertTextIncludesAll(context, panelFixture, [
    '<x-side-panel',
    '/components/xsidepanel.js',
    'surface-panel-command',
    'surface-id="workbench.properties"',
    'placement="right"',
    'mode="pinned"',
    'collapsible',
    'closable="false"',
    'pinnable="false"',
    'initial-width="320"',
    '__xtendComponentResult'
  ], 'x-side-panel fixture');
  context.assert(!panelFixture.includes('https://cdn.ccs-networks.de'), 'x-side-panel fixture has no CDN dependency');

  assertTextIncludesAll(context, panelDocs, [
    '# x-side-panel',
    'surface-panel-command',
    'docked',
    'overlay',
    'pinned',
    'collapsed',
    'fullscreen-under-720',
    'collapsible',
    'closable',
    'pinnable',
    'applySurfaceSnapshot'
  ], 'x-side-panel component docs');
  assertTextIncludesAll(context, docs, [
    SURFACE_MANAGER_SIDE_PANEL_SCHEMA,
    'x-side-panel',
    'collapsible',
    'closable',
    'pinnable',
    'docked',
    'pinned',
    'overlay',
    'WP-SM-05'
  ], 'SurfaceManager side-panel docs');
  assertTextIncludesAll(context, contractDoc, [
    SURFACE_MANAGER_SIDE_PANEL_SCHEMA,
    'x-side-panel',
    'surface-panel-command',
    'controller-snapshot-to-panel-attributes-css-vars',
    'fullscreen-under-720'
  ], 'SurfaceManager side-panel contract doc');
  assertTextIncludesAll(context, workpackageDoc, [
    SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE,
    SURFACE_MANAGER_SIDE_PANEL_LOCAL_GATE,
    'Done Criteria',
    'WP-SM-05'
  ], 'SurfaceManager side-panel workpackage doc');

  context.assert(metadata && metadata.schema === SURFACE_MANAGER_SIDE_PANEL_SCHEMA, 'Package metadata exposes SurfaceManager side-panel schema');
  context.assert(metadata && metadata.workpackage === SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE, 'Package metadata exposes WP-SM-04');
  context.assert(metadata && metadata.localGate === SURFACE_MANAGER_SIDE_PANEL_LOCAL_GATE, 'Package metadata exposes SurfaceManager side-panel local gate');
  context.assert(metadata && metadata.packageScript === SURFACE_MANAGER_SIDE_PANEL_PACKAGE_SCRIPT, 'Package metadata exposes SurfaceManager side-panel package script');
  context.assert(metadata && Array.isArray(metadata.componentTags) && metadata.componentTags.includes('x-side-panel'), 'Package metadata exposes x-side-panel tag');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Package metadata exposes WP-SM-05 handoff');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:surface-side-panel'] === 'node scripts/run_xtend_tests.js surface-side-panel', 'Package script test:surface-side-panel exists');
  context.assertIncludes(scaffoldConfig, 'surfaceManagerSidePanelRuntime', 'Scaffold config exposes surfaceManagerSidePanelRuntime');
  context.assertIncludes(scaffoldConfig, 'components/xsidepanel.js', 'Scaffold config references x-side-panel runtime');
  context.assertIncludes(runner, "require('../tests/components/surface_manager_side_panel_suite')", 'Runner imports SurfaceManager side-panel suite');
  context.assertIncludes(runner, "id: 'surface-side-panel'", 'Runner registers surface-side-panel suite');
  context.assertIncludes(docsReadme, 'SurfaceManager SidePanel Runtime', 'Docs README links SurfaceManager side-panel runtime');
  context.assertIncludes(docsMenu, 'surface-manager-side-panel-runtime', 'Docs menu contains SurfaceManager side-panel page');
  context.assertIncludes(referenceRegistry, 'WP-SM-04', 'Reference registry contains WP-SM-04');
  context.assertIncludes(referenceRegistry, 'components/xsidepanel.js', 'Reference registry contains x-side-panel runtime');
  context.assertIncludes(planningDoc, '`WP-SM-04` | P1 | completed', 'Planning doc marks WP-SM-04 completed');
  context.assertIncludes(planningDoc, '`WP-SM-05` | P1 | completed', 'Planning doc marks WP-SM-05 completed');

  RUNTIME_ARTIFACTS.forEach((filePath) => context.assert(plan.runtimeArtifacts.includes(filePath), `Plan lists runtime artifact ${filePath}`));
  SOURCE_ARTIFACTS.forEach((filePath) => context.assert(plan.sourceArtifacts.includes(filePath), `Plan lists source artifact ${filePath}`));
  COMPONENT_DOCS.forEach((filePath) => context.assert(plan.componentDocs.includes(filePath), `Plan lists component doc ${filePath}`));
  COMPONENT_FIXTURES.forEach((filePath) => context.assert(plan.componentFixtures.includes(filePath), `Plan lists component fixture ${filePath}`));
  COMPONENT_SUITES.forEach((filePath) => context.assert(plan.componentSuites.includes(filePath), `Plan lists component suite ${filePath}`));

  return context.result({
    schema: SURFACE_MANAGER_SIDE_PANEL_REPORT_SCHEMA,
    workpackage: SURFACE_MANAGER_SIDE_PANEL_WORKPACKAGE,
    targetReadiness: SURFACE_MANAGER_SIDE_PANEL_TARGET,
    components: COMPONENT_TAGS.length,
    events: REQUIRED_EVENTS.length,
    modes: REQUIRED_MODES.length
  });
}

function printSurfaceManagerSidePanelReport(result) {
  printSuiteReport(result, {
    successTitle: 'SurfaceManager SidePanel Runtime Contract erfolgreich.',
    failureTitle: 'SurfaceManager SidePanel Runtime Contract fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceManagerSidePanelReport,
  runSurfaceManagerSidePanelSuite
};

if (require.main === module) {
  const result = runSurfaceManagerSidePanelSuite();
  printSurfaceManagerSidePanelReport(result);
  process.exit(result.ok ? 0 : 1);
}
