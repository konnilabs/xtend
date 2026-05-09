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
  getComponentBlueprintContract,
  getArtifactContract,
  TYPESCRIPT_COMPONENT_BLUEPRINT_SCHEMA
} = require('../../xtend-builder/blueprints/component-blueprint.contract');
const {
  getTemplateRegistry
} = require('../../xtend-builder/templates/registry');
const {
  createComponentPlan
} = require('../../xtend-builder/generators/component-plan');
const {
  createComponentFiles
} = require('../../xtend-builder/generators/component-files');

const REQUIRED_TS_ARTIFACTS = [
  'ts-source',
  'ts-contract',
  'ts-rmt',
  'ts-a11y',
  'ts-performance',
  'ts-fixture'
];

const REQUIRED_TS_TEMPLATES = [
  'component.ts-source',
  'component.ts-contract',
  'component.ts-rmt',
  'component.ts-a11y',
  'component.ts-performance',
  'component.ts-fixture'
];

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function getRenderedFile(result, id) {
  return result.files.find((file) => file.id === id);
}

function runBuilderTypeScriptBlueprintSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'builder-typescript-blueprint',
    label: 'XTend Builder TypeScript Component Blueprint'
  });
  const packageManifest = readJson('package.json', rootDir);
  const scaffoldConfigSource = readText('xtend-builder/scaffold.config.js', rootDir);
  const epic = readText('development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const referenceRegistry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const contractDoc = readText('development/XTend-TypeScript-Component-Blueprint.md', rootDir);
  const workpackage = readText('development/WP-E10-07-xtend-builder-TypeScript-Blueprint-vorbereiten.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.typescriptComponentBlueprint;
  const blueprint = getComponentBlueprintContract();
  const templateRegistry = getTemplateRegistry();
  const artifactIds = blueprint.artifacts.map((artifact) => artifact.id);
  const templateIds = templateRegistry.templates.map((template) => template.id);
  const plan = createComponentPlan({
    tag: 'x-enterprise-card',
    profile: 'display',
    feature: 'state'
  });
  const files = createComponentFiles({
    tag: 'x-enterprise-card',
    profile: 'display',
    feature: 'state'
  });
  const renderedIds = files.files.map((file) => file.id);

  assertFileExists(context, 'development/XTend-TypeScript-Component-Blueprint.md', rootDir, 'TypeScript Component Blueprint document exists');
  assertFileExists(context, 'development/WP-E10-07-xtend-builder-TypeScript-Blueprint-vorbereiten.md', rootDir, 'WP-E10-07 workpackage document exists');
  assertFileExists(context, 'tests/builder/typescript_component_blueprint_suite.js', rootDir, 'TypeScript Component Blueprint suite exists');

  REQUIRED_TS_ARTIFACTS.forEach((artifact) => {
    context.assert(artifactIds.includes(artifact), `Component blueprint includes ${artifact}`);
    context.assert(getArtifactContract(artifact) && getArtifactContract(artifact).required === true, `${artifact} is required`);
  });

  context.assert(blueprint.typescriptBlueprint && blueprint.typescriptBlueprint.schema === TYPESCRIPT_COMPONENT_BLUEPRINT_SCHEMA, 'Blueprint exposes TypeScript Component Blueprint schema');
  context.assert(blueprint.typescriptBlueprint.componentContract === 'xtend.component.contract.v2', 'Blueprint binds Component Contract v2');
  context.assert(blueprint.typescriptBlueprint.sourceStrategy === 'xtend.typescript.component-source-strategy.v1', 'Blueprint binds TypeScript source strategy');
  context.assert(blueprint.typescriptBlueprint.rmtComponentContract === 'xtend.rmt.component-contract.v1', 'Blueprint binds RMT component contract');
  context.assert(blueprint.typescriptBlueprint.fabricLaneIngestion === 'xtend.component.fabric-lane-ingestion.v2', 'Blueprint binds Fabric/Lane ingestion');
  context.assert(blueprint.typescriptBlueprint.lifecycleTelemetry === 'xtend.component.lifecycle-telemetry.v1', 'Blueprint binds Component Lifecycle Telemetry');
  context.assert(blueprint.typescriptBlueprint.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Blueprint keeps RMT kernel boundary');

  REQUIRED_TS_TEMPLATES.forEach((templateId) => {
    const template = templateRegistry.templates.find((entry) => entry.id === templateId);
    context.assert(templateIds.includes(templateId), `Template registry includes ${templateId}`);
    context.assert(template && template.status === 'implemented-WP-E10-07', `${templateId} is owned by WP-E10-07`);
    context.assert(template && fs.existsSync(resolveRepoPath(template.path, rootDir)), `${templateId} file exists`);
  });

  context.assert(plan.ok === true, 'Component plan accepts TypeScript blueprint sample input');
  context.assert(plan.artifacts.some((artifact) => artifact.id === 'ts-source' && artifact.targetPath === 'src/components/x-enterprise-card/x-enterprise-card.ts'), 'Plan resolves TypeScript source path');
  context.assert(plan.artifacts.some((artifact) => artifact.id === 'ts-contract' && artifact.targetPath === 'src/components/x-enterprise-card/x-enterprise-card.contract.ts'), 'Plan resolves TypeScript contract path');
  context.assert(plan.artifacts.some((artifact) => artifact.id === 'ts-rmt' && artifact.targetPath === 'src/components/x-enterprise-card/x-enterprise-card.rmt.ts'), 'Plan resolves RMT metadata path');

  context.assert(files.ok === true, 'Component files generator renders TypeScript blueprint sample');
  REQUIRED_TS_ARTIFACTS.forEach((artifact) => {
    context.assert(renderedIds.includes(artifact), `Component files generator renders ${artifact}`);
  });
  context.assert(files.wiring.componentContractV2 && files.wiring.componentContractV2.schema === 'xtend.component.contract.v2', 'Component files exposes Component Contract v2 wiring');
  context.assert(files.wiring.componentContractV2Report && files.wiring.componentContractV2Report.ok === true, 'Component files validates Component Contract v2 wiring');
  context.assert(files.wiring.typescript && files.wiring.typescript.schema === TYPESCRIPT_COMPONENT_BLUEPRINT_SCHEMA, 'Component files exposes TypeScript blueprint wiring');
  context.assert(files.wiring.typescript.runtimeOutput === 'components/xenterprisecard.js', 'Component files exposes ESM runtime output plan');
  context.assert(files.wiring.typescript.declarationOutput === 'components/xenterprisecard.d.ts', 'Component files exposes declaration output plan');

  const tsSource = getRenderedFile(files, 'ts-source');
  const tsContract = getRenderedFile(files, 'ts-contract');
  const tsRmt = getRenderedFile(files, 'ts-rmt');
  const tsA11y = getRenderedFile(files, 'ts-a11y');
  const tsPerformance = getRenderedFile(files, 'ts-performance');
  const tsFixture = getRenderedFile(files, 'ts-fixture');

  context.assert(tsSource && tsSource.content.includes('export class XEnterpriseCard extends HTMLElement'), 'TypeScript source renders class');
  context.assert(tsSource && tsSource.content.includes('xtendComponentContract'), 'TypeScript source exposes Component Contract metadata');
  context.assert(tsSource && tsSource.content.includes('xtendRmtMetadata'), 'TypeScript source exposes RMT metadata');
  context.assert(tsSource && tsSource.content.includes('xtendComponentLifecycleTelemetry'), 'TypeScript source exposes lifecycle telemetry metadata');
  context.assert(tsSource && tsSource.content.includes('xtend.component.lifecycle-telemetry.v1'), 'TypeScript source includes lifecycle telemetry schema');
  context.assert(tsSource && tsSource.content.includes('xtend.component.fabric-lane-ingestion.v2'), 'TypeScript source includes Fabric/Lane schema');
  context.assert(tsContract && tsContract.content.includes('xtend.component.contract.v2'), 'TypeScript contract includes Component Contract v2 schema');
  context.assert(tsContract && tsContract.content.includes('xtend.typescript.component-source-strategy.v1'), 'TypeScript contract includes source strategy schema');
  context.assert(tsRmt && tsRmt.content.includes('xtend.rmt.component-contract.v1'), 'RMT metadata includes RMT component contract');
  context.assert(tsRmt && tsRmt.content.includes('no-rmt-kernel-import-of-xtend-types'), 'RMT metadata keeps kernel boundary');
  context.assert(tsA11y && tsA11y.content.includes('xtend.a11y.profile.v1'), 'A11y template includes A11y profile schema');
  context.assert(tsPerformance && tsPerformance.content.includes('xtend.performance.component-profile.v1'), 'Performance template includes component Performance schema');
  context.assert(tsFixture && tsFixture.content.includes('expectedTelemetry'), 'Fixture data includes telemetry expectations');
  context.assert(tsFixture && tsFixture.content.includes('expectedA11y'), 'Fixture data includes A11y expectations');

  context.assertIncludes(contractDoc, TYPESCRIPT_COMPONENT_BLUEPRINT_SCHEMA, 'Contract doc declares TypeScript Component Blueprint schema');
  context.assertIncludes(contractDoc, 'ts-source', 'Contract doc documents TypeScript source artifact');
  context.assertIncludes(contractDoc, 'ts-rmt', 'Contract doc documents RMT metadata artifact');
  context.assertIncludes(contractDoc, 'no-rmt-kernel-import-of-xtend-types', 'Contract doc keeps RMT kernel boundary visible');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E10-07 is completed');
  context.assertIncludes(workpackage, 'node scripts/run_xtend_tests.js builder-typescript-blueprint --json', 'WP-E10-07 documents local gate');
  context.assertIncludes(epic, '| `WP-E10-07` | P0 | completed |', 'Epic 10 marks WP-E10-07 completed');
  context.assertIncludes(epic, '| `WP-E10-08` | P1 | completed |', 'Epic 10 marks WP-E10-08 completed');
  context.assertIncludes(epic, '| `WP-E10-09` | P1 | completed |', 'Epic 10 marks WP-E10-09 completed');
  context.assertIncludes(epic, '| `WP-E10-10` | P1 | completed |', 'Epic 10 marks WP-E10-10 completed');
  context.assertIncludes(epic, '| `WP-E10-11` | P1 | completed |', 'Epic 10 marks WP-E10-11 completed');
  context.assertIncludes(backlog, '| `WP-E10-07` | P0 | completed |', 'Backlog marks WP-E10-07 completed');
  context.assertIncludes(backlog, '| `WP-E10-08` | P1 | completed |', 'Backlog marks WP-E10-08 completed');
  context.assertIncludes(backlog, '| `WP-E10-09` | P1 | completed |', 'Backlog marks WP-E10-09 completed');
  context.assertIncludes(backlog, '| `WP-E10-10` | P1 | completed |', 'Backlog marks WP-E10-10 completed');
  context.assertIncludes(backlog, '| `WP-E10-11` | P1 | completed |', 'Backlog marks WP-E10-11 completed');
  context.assertIncludes(referenceRegistry, 'development/XTend-TypeScript-Component-Blueprint.md', 'Reference registry links TypeScript Component Blueprint contract');
  context.assertIncludes(referenceRegistry, 'tests/builder/typescript_component_blueprint_suite.js', 'Reference registry links TypeScript Component Blueprint suite');
  context.assertIncludes(scaffoldConfigSource, 'typescriptComponentBlueprint', 'Scaffold config exposes TypeScript Component Blueprint section');
  context.assert(metadata && metadata.schema === TYPESCRIPT_COMPONENT_BLUEPRINT_SCHEMA, 'Package metadata exposes TypeScript Component Blueprint schema');
  context.assert(metadata.workpackage === 'WP-E10-07', 'Package metadata exposes WP-E10-07 owner');
  context.assert(metadata.contract === 'development/XTend-TypeScript-Component-Blueprint.md', 'Package metadata points at TypeScript Component Blueprint document');
  context.assert(metadata.suite === 'tests/builder/typescript_component_blueprint_suite.js', 'Package metadata points at TypeScript Component Blueprint suite');
  context.assert(Array.isArray(metadata.requiredArtifacts) && metadata.requiredArtifacts.includes('ts-rmt'), 'Package metadata requires RMT metadata artifact');
  context.assert(Array.isArray(metadata.templateArtifacts) && metadata.templateArtifacts.includes('component.ts-source'), 'Package metadata exposes TS source template artifact');
  context.assert(metadata.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Package metadata keeps RMT kernel boundary');
  context.assert(packageManifest.scripts['test:builder-typescript-blueprint'] === 'node scripts/run_xtend_tests.js builder-typescript-blueprint', 'Package exposes TypeScript Blueprint test script');
  context.assertIncludes(runner, "id: 'builder-typescript-blueprint'", 'XTend runner registers TypeScript Blueprint suite');

  return context.result({
    schema: TYPESCRIPT_COMPONENT_BLUEPRINT_SCHEMA,
    artifacts: REQUIRED_TS_ARTIFACTS
  });
}

function printBuilderTypeScriptBlueprintReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Builder TypeScript Component Blueprint erfolgreich.',
    failureTitle: 'XTend Builder TypeScript Component Blueprint fehlgeschlagen:'
  });
}

module.exports = {
  printBuilderTypeScriptBlueprintReport,
  runBuilderTypeScriptBlueprintSuite
};
