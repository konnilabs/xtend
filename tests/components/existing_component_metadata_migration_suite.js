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
  EXISTING_COMPONENT_METADATA_DOC,
  EXISTING_COMPONENT_METADATA_GATE,
  EXISTING_COMPONENT_METADATA_GATE_SCHEMA,
  EXISTING_COMPONENT_METADATA_MODULE,
  EXISTING_COMPONENT_METADATA_SCHEMA,
  EXISTING_COMPONENT_METADATA_SUITE,
  EXISTING_COMPONENT_METADATA_WORKPACKAGE,
  KERNEL_BOUNDARY,
  MIGRATION_STRATEGY,
  TARGET_COMPONENTS,
  createExistingComponentMetadataGate,
  createExistingComponentMetadataPlan,
  validateExistingComponentMetadataPlan
} = require('../../catalog/epic10-existing-component-metadata');

const WORKPACKAGE_PATH = 'development/WP-E10-14-Existing-Component-Metadata-Migration-fuer-priorisierte-Komponenten.md';
const DOCS_PATH = 'docs/existing-component-metadata.md';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function runExistingComponentMetadataMigrationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'existing-component-metadata',
    label: 'Epic 10 Existing Component RMT/Fabric Metadata Migration'
  });
  const plan = createExistingComponentMetadataPlan();
  const validation = validateExistingComponentMetadataPlan(plan);
  const gate = createExistingComponentMetadataGate({ plan });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.existingComponentMetadataMigration;
  const epic = readText('development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const contract = readText(EXISTING_COMPONENT_METADATA_DOC, rootDir);
  const workpackage = readText(WORKPACKAGE_PATH, rootDir);
  const docs = readText(DOCS_PATH, rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const platformDocs = readText('docs/component-platform.md', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const rmtReadme = readText('tests/rmt/README.md', rootDir);

  assertFileExists(context, EXISTING_COMPONENT_METADATA_MODULE, rootDir, 'Existing component metadata module exists');
  assertFileExists(context, EXISTING_COMPONENT_METADATA_SUITE, rootDir, 'Existing component metadata suite exists');
  assertFileExists(context, EXISTING_COMPONENT_METADATA_DOC, rootDir, 'Existing component metadata contract exists');
  assertFileExists(context, WORKPACKAGE_PATH, rootDir, 'WP-E10-14 workpackage document exists');
  assertFileExists(context, DOCS_PATH, rootDir, 'Existing component metadata docs exist');

  context.assert(plan.schema === EXISTING_COMPONENT_METADATA_SCHEMA, 'Existing component metadata plan declares schema');
  context.assert(plan.status === 'accepted-migration', 'Existing component metadata plan is accepted');
  context.assert(plan.workpackage === EXISTING_COMPONENT_METADATA_WORKPACKAGE, 'Existing component metadata plan belongs to WP-E10-14');
  context.assert(plan.migrationStrategy === MIGRATION_STRATEGY, 'Existing component metadata plan declares migration strategy');
  context.assert(plan.noBigBangTypeScriptMigration === true, 'Existing component metadata plan rejects big-bang TypeScript migration');
  context.assert(plan.runtimeRewriteRequired === false, 'Existing component metadata plan avoids runtime rewrite');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'Existing component metadata plan keeps RMT kernel boundary');
  context.assert(JSON.stringify(plan.targetComponents) === JSON.stringify(TARGET_COMPONENTS), 'Existing component metadata target order is stable');
  context.assert(plan.records.length === 9, 'Existing component metadata plan contains nine records');
  context.assert(validation.schema === EXISTING_COMPONENT_METADATA_GATE_SCHEMA, 'Existing component metadata validator emits gate schema');
  context.assert(validation.ok === true, 'Existing component metadata validator accepts plan');
  context.assert(gate.ok === true, 'Existing component metadata gate passes');
  context.assert(gate.localGate === EXISTING_COMPONENT_METADATA_GATE, 'Existing component metadata gate exposes local gate');
  context.assert(plan.summary.byPriority.P0 === 7, 'Existing component metadata migrates seven P0 components');
  context.assert(plan.summary.byPriority.P1 === 2, 'Existing component metadata migrates two P1 components');
  context.assert(plan.summary.byLane.visible === 3, 'Existing component metadata keeps visible lane components');
  context.assert(plan.summary.byLane['user-blocking'] === 6, 'Existing component metadata keeps user-blocking lane components');

  plan.records.forEach((record) => {
    context.assert(TARGET_COMPONENTS.includes(record.tag), `${record.tag} is a WP-E10-14 target`);
    context.assert(record.status === 'metadata-migrated', `${record.tag} is metadata-migrated`);
    context.assert(record.sourceState === 'js-legacy', `${record.tag} stays js-legacy`);
    context.assert(record.migrationStrategy === MIGRATION_STRATEGY, `${record.tag} uses metadata overlay strategy`);
    context.assert(record.noBigBangTypeScriptMigration === true, `${record.tag} avoids big-bang TypeScript migration`);
    context.assert(record.runtimeRewriteRequired === false, `${record.tag} avoids runtime rewrite`);
    context.assert(record.componentContract.schema === 'xtend.component.contract.v2', `${record.tag} exposes Component Contract v2`);
    context.assert(record.componentContractValidation.ok === true, `${record.tag} Component Contract v2 validates`);
    context.assert(record.componentContract.source.state === 'js-legacy', `${record.tag} contract source state is js-legacy`);
    context.assert(record.componentContract.runtime.localOnly === true, `${record.tag} runtime stays local`);
    context.assert(record.componentContract.runtime.cdnAllowed === false, `${record.tag} forbids CDN runtime`);
    context.assert(record.rmt.schema === 'xtend.rmt.component-contract.v1', `${record.tag} exposes RMT component contract`);
    context.assert(record.rmt.adapter === 'xtend.component', `${record.tag} uses XTend component adapter`);
    context.assert(record.rmt.kernelBoundary === KERNEL_BOUNDARY, `${record.tag} keeps RMT kernel boundary`);
    context.assert(record.rmt.templateMode === 'dom_descriptor', `${record.tag} uses dom_descriptor templates`);
    context.assert(record.rmt.eventBindingMode === 'dom-event-to-rmt-command', `${record.tag} maps DOM events to RMT commands`);
    assertIncludesAll(context, record.rmt.fields, ['id', 'tag', 'props', 'attributes', 'slots', 'events', 'schedule', 'hydration', 'fabric', 'a11y', 'performance'], `${record.tag} RMT fields`);
    context.assert(record.rmt.schedules.includes('diagnostics.snapshot'), `${record.tag} exposes diagnostics snapshot schedule`);
    context.assert(record.fabric.api === '@xtend-fabric', `${record.tag} binds Fabric API`);
    context.assert(record.fabric.ingest.fabricContext === true, `${record.tag} ingests Fabric context`);
    context.assert(record.telemetry.schema === 'xtend.fabric.telemetry-snapshot.v1', `${record.tag} binds telemetry snapshots`);
    context.assert(record.telemetry.backpressureAware === true, `${record.tag} is backpressure aware`);
    assertIncludesAll(context, record.telemetry.operations, ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'], `${record.tag} telemetry operations`);
    assertIncludesAll(context, record.lanes.precedence, ['rmt.schedule-record', 'rmt.component-metadata', 'fabric.runtime-override', 'component.static-contract', 'scaffold.blueprint-default'], `${record.tag} lane precedence`);
    context.assert(record.performance.lane === record.lanes.default, `${record.tag} performance lane matches default lane`);
    assertFileExists(context, record.paths.artifact, rootDir, `${record.tag} runtime artifact exists`);
    assertFileExists(context, record.paths.declaration, rootDir, `${record.tag} declaration artifact exists`);
    assertFileExists(context, record.paths.docs, rootDir, `${record.tag} docs exist`);
    assertFileExists(context, record.paths.suite, rootDir, `${record.tag} component suite exists`);
    assertFileExists(context, record.paths.fixture, rootDir, `${record.tag} fixture exists`);
  });

  const byTag = new Map(plan.records.map((record) => [record.tag, record]));
  context.assert(byTag.get('x-router').rmt.routeAdapter === 'xtend.xrouter', 'x-router metadata binds XRouter adapter');
  context.assert(byTag.get('x-router').rmt.capabilities.includes('runtimeRouteRegistration'), 'x-router metadata exposes runtime route registration');
  context.assert(byTag.get('x-link').rmt.capabilities.includes('routeActivation'), 'x-link metadata exposes route activation');
  context.assert(byTag.get('x-form').rmt.capabilities.includes('formAggregation'), 'x-form metadata exposes form aggregation');
  context.assert(byTag.get('x-modal').rmt.capabilities.includes('focusTrap'), 'x-modal metadata exposes focus trap');
  context.assert(byTag.get('x-dialog').rmt.capabilities.includes('sizeHints'), 'x-dialog metadata exposes size hints');
  context.assert(byTag.get('x-tabs').rmt.capabilities.includes('keyboardSelection'), 'x-tabs metadata exposes keyboard selection');
  context.assert(byTag.get('x-toast').rmt.capabilities.includes('timerPolicy'), 'x-toast metadata exposes timer policy');
  context.assert(byTag.get('x-alert').rmt.capabilities.includes('stateSync'), 'x-alert metadata exposes state sync');

  TARGET_COMPONENTS.forEach((tag) => {
    context.assertIncludes(contract, tag, `Existing component metadata contract documents ${tag}`);
    context.assertIncludes(workpackage, tag, `WP-E10-14 documents ${tag}`);
    context.assertIncludes(docs, tag, `Existing component metadata docs document ${tag}`);
  });
  context.assertIncludes(contract, EXISTING_COMPONENT_METADATA_SCHEMA, 'Existing component metadata contract declares schema');
  context.assertIncludes(contract, MIGRATION_STRATEGY, 'Existing component metadata contract documents migration strategy');
  context.assertIncludes(contract, EXISTING_COMPONENT_METADATA_GATE, 'Existing component metadata contract documents local gate');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E10-14 is completed');
  context.assertIncludes(workpackage, EXISTING_COMPONENT_METADATA_GATE, 'WP-E10-14 documents local gate');
  context.assertIncludes(docs, EXISTING_COMPONENT_METADATA_SCHEMA, 'Existing component metadata docs declare schema');
  context.assertIncludes(docsReadme, 'Existing Component Metadata', 'Docs README links Existing Component Metadata');
  context.assertIncludes(docsMenu, 'existing-component-metadata', 'Docs menu links Existing Component Metadata');
  context.assertIncludes(platformDocs, 'Existing Component Metadata', 'Component Platform docs mention Existing Component Metadata');
  context.assertIncludes(epic, '| `WP-E10-14` | P1 | completed |', 'Epic 10 marks WP-E10-14 completed');
  context.assertIncludes(epic, '| `WP-E10-15` | P1 | completed |', 'Epic 10 marks WP-E10-15 completed');
  context.assertIncludes(epic, '| `WP-E10-16` | P2 | completed |', 'Epic 10 marks WP-E10-16 completed');
  context.assertIncludes(backlog, '| `WP-E10-14` | P1 | completed |', 'Backlog marks WP-E10-14 completed');
  context.assertIncludes(backlog, '| `WP-E10-15` | P1 | completed |', 'Backlog marks WP-E10-15 completed');
  context.assertIncludes(backlog, '| `WP-E10-16` | P2 | completed |', 'Backlog marks WP-E10-16 completed');
  context.assertIncludes(registry, EXISTING_COMPONENT_METADATA_MODULE, 'Reference registry links Existing Component Metadata module');
  context.assertIncludes(registry, EXISTING_COMPONENT_METADATA_DOC, 'Reference registry links Existing Component Metadata contract');
  context.assertIncludes(registry, EXISTING_COMPONENT_METADATA_SUITE, 'Reference registry links Existing Component Metadata suite');
  context.assertIncludes(registry, DOCS_PATH, 'Reference registry links Existing Component Metadata docs');
  context.assertIncludes(scaffoldConfig, 'existingComponentMetadataMigration', 'Scaffold config exposes Existing Component Metadata migration');
  context.assertIncludes(runner, "id: 'existing-component-metadata'", 'Runner registers Existing Component Metadata suite');
  context.assertIncludes(rmtReadme, EXISTING_COMPONENT_METADATA_SCHEMA, 'RMT test README documents Existing Component Metadata gate');
  context.assert(packageManifest.exports['./catalog/epic10-existing-component-metadata'] === './catalog/epic10-existing-component-metadata.js', 'Package exports Existing Component Metadata module');
  context.assert(packageManifest.scripts['test:existing-component-metadata'] === 'node scripts/run_xtend_tests.js existing-component-metadata', 'Package exposes Existing Component Metadata test script');
  context.assert(metadata && metadata.schema === EXISTING_COMPONENT_METADATA_SCHEMA, 'Package metadata exposes Existing Component Metadata schema');
  context.assert(metadata && metadata.workpackage === EXISTING_COMPONENT_METADATA_WORKPACKAGE, 'Package metadata exposes WP-E10-14 owner');
  context.assert(metadata && metadata.module === EXISTING_COMPONENT_METADATA_MODULE, 'Package metadata exposes Existing Component Metadata module');
  context.assert(metadata && metadata.suite === EXISTING_COMPONENT_METADATA_SUITE, 'Package metadata exposes Existing Component Metadata suite');
  context.assert(metadata && metadata.localGate === EXISTING_COMPONENT_METADATA_GATE, 'Package metadata exposes Existing Component Metadata local gate');
  context.assert(JSON.stringify(metadata.targetComponents) === JSON.stringify(TARGET_COMPONENTS), 'Package metadata exposes target components');
  context.assert(metadata && metadata.runtimeRewriteRequired === false, 'Package metadata avoids runtime rewrite');
  context.assert(metadata && metadata.noBigBangTypeScriptMigration === true, 'Package metadata avoids big-bang TypeScript migration');

  return context.result({
    report: {
      schema: EXISTING_COMPONENT_METADATA_GATE_SCHEMA,
      componentCount: plan.records.length,
      targets: TARGET_COMPONENTS,
      migrationStrategy: MIGRATION_STRATEGY
    }
  });
}

function printExistingComponentMetadataMigrationReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 10 Existing Component RMT/Fabric Metadata Migration erfolgreich.',
    failureTitle: 'Epic 10 Existing Component RMT/Fabric Metadata Migration fehlgeschlagen:'
  });
}

module.exports = {
  printExistingComponentMetadataMigrationReport,
  runExistingComponentMetadataMigrationSuite
};
