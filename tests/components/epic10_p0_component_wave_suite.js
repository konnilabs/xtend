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
  createComponentPlan
} = require('../../xtend-builder/generators/component-plan');
const {
  createComponentFiles
} = require('../../xtend-builder/generators/component-files');
const {
  EPIC10_P0_COMPONENT_WAVE_SCHEMA,
  EPIC10_P0_COMPONENT_STUB_SCHEMA,
  EPIC10_P0_COMPONENT_WAVE_GATE_SCHEMA,
  EPIC10_P0_COMPONENT_WAVE_WORKPACKAGE,
  EPIC10_P0_COMPONENT_WAVE_DOC,
  EPIC10_P0_COMPONENT_WAVE_SUITE,
  EPIC10_P0_COMPONENT_WAVE_GATE,
  REQUIRED_TS_COMPONENT_ARTIFACTS,
  REQUIRED_LOCAL_GATES,
  EXPECTED_COMPONENT_ORDER,
  WORKPACKAGE_COMPONENT_MAP,
  createP0ComponentWavePlan,
  createP0ComponentWaveGate,
  validateP0ComponentWavePlan
} = require('../../catalog/epic10-p0-component-wave');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function collectRenderedIds(result) {
  return Array.isArray(result.files) ? result.files.map((file) => file.id) : [];
}

function runEpic10P0ComponentWaveSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic10-p0-component-wave',
    label: 'Epic 10 P0 Component Wave Contract'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const epic = readText('development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const contractDoc = readText(EPIC10_P0_COMPONENT_WAVE_DOC, rootDir);
  const workpackageDoc = readText('development/WP-E10-08-P0-Komponentenwelle-priorisieren-und-Contracts-anlegen.md', rootDir);
  const docs = readText('development/docs-evidence/root/component-platform.md', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.epic10P0ComponentWave;
  const plan = createP0ComponentWavePlan();
  const validation = validateP0ComponentWavePlan(plan);
  const gate = createP0ComponentWaveGate({ plan });
  const tags = plan.stubs.map((stub) => stub.tag);

  assertFileExists(context, 'catalog/epic10-p0-component-wave.js', rootDir, 'P0 component wave module exists');
  assertFileExists(context, EPIC10_P0_COMPONENT_WAVE_DOC, rootDir, 'P0 component wave contract document exists');
  assertFileExists(context, 'development/WP-E10-08-P0-Komponentenwelle-priorisieren-und-Contracts-anlegen.md', rootDir, 'WP-E10-08 workpackage document exists');
  assertFileExists(context, EPIC10_P0_COMPONENT_WAVE_SUITE, rootDir, 'P0 component wave suite exists');
  assertFileExists(context, 'development/docs-evidence/root/component-platform.md', rootDir, 'Component Platform docs exist');

  context.assert(plan.schema === EPIC10_P0_COMPONENT_WAVE_SCHEMA, 'P0 wave plan declares schema');
  context.assert(plan.status === 'accepted-contract', 'P0 wave plan is accepted as contract');
  context.assert(plan.workpackage === EPIC10_P0_COMPONENT_WAVE_WORKPACKAGE, 'P0 wave plan belongs to WP-E10-08');
  context.assert(plan.componentCount === 9, 'P0 wave contains nine component stubs');
  context.assert(validation.schema === EPIC10_P0_COMPONENT_WAVE_GATE_SCHEMA, 'P0 wave validator emits gate schema');
  context.assert(validation.ok === true, 'P0 wave validator accepts the generated plan');
  context.assert(gate.ok === true, 'P0 wave gate passes');
  context.assert(gate.localGate === EPIC10_P0_COMPONENT_WAVE_GATE, 'P0 wave gate exposes local gate command');
  context.assert(JSON.stringify(tags) === JSON.stringify(EXPECTED_COMPONENT_ORDER), 'P0 wave order is deterministic');

  Object.entries(WORKPACKAGE_COMPONENT_MAP).forEach(([workpackage, expectedTags]) => {
    const actualTags = plan.stubs
      .filter((stub) => stub.implementationWorkpackage === workpackage)
      .map((stub) => stub.tag);
    context.assert(JSON.stringify(actualTags) === JSON.stringify(expectedTags), `${workpackage} receives the expected components`);
  });

  plan.stubs.forEach((stub) => {
    context.assert(stub.schema === EPIC10_P0_COMPONENT_STUB_SCHEMA, `${stub.tag} declares stub schema`);
    context.assert(stub.sourceState === 'ts-planned', `${stub.tag} is TypeScript-planned`);
    context.assert(stub.targetMaturity === 'stable', `${stub.tag} targets stable maturity`);
    context.assert(stub.componentContract.schema === 'xtend.component.contract.v2', `${stub.tag} exposes Component Contract v2`);
    context.assert(stub.componentContractValidation.ok === true, `${stub.tag} Component Contract v2 validates`);
    context.assert(stub.componentContract.runtime.localOnly === true, `${stub.tag} remains local runtime only`);
    context.assert(stub.componentContract.runtime.cdnAllowed === false, `${stub.tag} forbids CDN runtime`);
    context.assert(stub.rmt.adapter === 'xtend.component', `${stub.tag} uses XTend component RMT adapter`);
    context.assert(stub.rmt.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', `${stub.tag} keeps RMT kernel boundary`);
    context.assert(stub.fabric.api === '@xtend-fabric', `${stub.tag} binds Fabric API`);
    context.assert(stub.telemetry.backpressureAware === true, `${stub.tag} is telemetry/backpressure aware`);
    context.assert(stub.a11y.contract === 'xtend.a11y.component-contract.v1', `${stub.tag} declares A11y contract`);
    context.assert(stub.performance.contract === 'xtend.performance.component-profile.v1', `${stub.tag} declares Performance contract`);
    REQUIRED_TS_COMPONENT_ARTIFACTS.forEach((artifact) => {
      context.assert(stub.artifactPlan.required.includes(artifact), `${stub.tag} requires ${artifact}`);
    });
    REQUIRED_LOCAL_GATES.forEach((gateId) => {
      context.assert(stub.gates.includes(gateId), `${stub.tag} includes ${gateId} gate`);
    });

    const dryRunPlan = createComponentPlan({
      tag: stub.tag,
      profiles: stub.profiles,
      features: ['events', 'accessibility', 'fixtures', 'types']
    });
    const dryRunFiles = createComponentFiles({
      tag: stub.tag,
      profiles: stub.profiles,
      features: ['events', 'accessibility', 'fixtures', 'types']
    });
    const renderedIds = collectRenderedIds(dryRunFiles);

    context.assert(dryRunPlan.ok === true, `${stub.tag} is accepted by the TypeScript component plan`);
    context.assert(dryRunFiles.ok === true, `${stub.tag} is accepted by the TypeScript component files generator`);
    REQUIRED_TS_COMPONENT_ARTIFACTS.forEach((artifact) => {
      context.assert(renderedIds.includes(artifact), `${stub.tag} generator renders ${artifact}`);
    });
    context.assert(dryRunFiles.wiring.componentContractV2Report.ok === true, `${stub.tag} generated Component Contract v2 report passes`);
  });

  EXPECTED_COMPONENT_ORDER.forEach((tag) => {
    context.assertIncludes(contractDoc, tag, `P0 wave contract documents ${tag}`);
    context.assertIncludes(workpackageDoc, tag, `WP-E10-08 documents ${tag}`);
    context.assertIncludes(docs, tag, `Component Platform docs document ${tag}`);
  });

  context.assertIncludes(contractDoc, EPIC10_P0_COMPONENT_WAVE_SCHEMA, 'P0 wave contract declares schema');
  context.assertIncludes(contractDoc, EPIC10_P0_COMPONENT_STUB_SCHEMA, 'P0 wave contract declares stub schema');
  context.assertIncludes(contractDoc, EPIC10_P0_COMPONENT_WAVE_GATE, 'P0 wave contract documents local gate');
  context.assertIncludes(workpackageDoc, 'Status: `completed`', 'WP-E10-08 workpackage is completed');
  context.assertIncludes(workpackageDoc, EPIC10_P0_COMPONENT_WAVE_GATE, 'WP-E10-08 documents local gate');
  context.assertIncludes(epic, '| `WP-E10-08` | P1 | completed |', 'Epic 10 marks WP-E10-08 completed');
  context.assertIncludes(epic, '| `WP-E10-09` | P1 | completed |', 'Epic 10 marks WP-E10-09 completed');
  context.assertIncludes(epic, '| `WP-E10-10` | P1 | completed |', 'Epic 10 marks WP-E10-10 completed');
  context.assertIncludes(epic, '| `WP-E10-11` | P1 | completed |', 'Epic 10 marks WP-E10-11 completed');
  context.assertIncludes(backlog, '| `WP-E10-08` | P1 | completed |', 'Backlog marks WP-E10-08 completed');
  context.assertIncludes(backlog, '| `WP-E10-09` | P1 | completed |', 'Backlog marks WP-E10-09 completed');
  context.assertIncludes(backlog, '| `WP-E10-10` | P1 | completed |', 'Backlog marks WP-E10-10 completed');
  context.assertIncludes(backlog, '| `WP-E10-11` | P1 | completed |', 'Backlog marks WP-E10-11 completed');
  context.assertIncludes(registry, 'catalog/epic10-p0-component-wave.js', 'Reference registry links P0 wave module');
  context.assertIncludes(registry, EPIC10_P0_COMPONENT_WAVE_DOC, 'Reference registry links P0 wave contract');
  context.assertIncludes(registry, EPIC10_P0_COMPONENT_WAVE_SUITE, 'Reference registry links P0 wave suite');
  context.assertIncludes(registry, 'development/docs-evidence/root/component-platform.md', 'Reference registry links Component Platform docs');
  context.assertIncludes(scaffoldConfig, 'componentPlatformP0Wave', 'Scaffold config exposes P0 component wave metadata');
  context.assert(runner.hasSuite("epic10-p0-component-wave"), 'Runner registers P0 component wave suite');
  context.assert((packageManifest.exports['./catalog/epic10-p0-component-wave'] === './catalog/epic10-p0-component-wave.js' || (packageManifest.exports['./catalog/epic10-p0-component-wave'] && packageManifest.exports['./catalog/epic10-p0-component-wave'].default === './catalog/epic10-p0-component-wave.js')), 'Package exports P0 component wave module');
  context.assert(packageManifest.scripts['test:epic10-p0-component-wave'] === 'node scripts/run_xtend_tests.js epic10-p0-component-wave', 'Package exposes P0 component wave test script');
  context.assert(metadata && metadata.schema === EPIC10_P0_COMPONENT_WAVE_SCHEMA, 'Package metadata exposes P0 wave schema');
  context.assert(metadata.contract === EPIC10_P0_COMPONENT_WAVE_DOC, 'Package metadata points at P0 wave contract document');
  context.assert(metadata.suite === EPIC10_P0_COMPONENT_WAVE_SUITE, 'Package metadata points at P0 wave suite');
  context.assert(JSON.stringify(metadata.implementationOrder) === JSON.stringify(EXPECTED_COMPONENT_ORDER), 'Package metadata exposes P0 implementation order');
  context.assert(metadata.localGate === EPIC10_P0_COMPONENT_WAVE_GATE, 'Package metadata exposes P0 wave local gate');

  return context.result({
    schema: EPIC10_P0_COMPONENT_WAVE_SCHEMA,
    gateSchema: EPIC10_P0_COMPONENT_WAVE_GATE_SCHEMA,
    components: EXPECTED_COMPONENT_ORDER
  });
}

function printEpic10P0ComponentWaveReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 10 P0 Component Wave Contract erfolgreich.',
    failureTitle: 'Epic 10 P0 Component Wave Contract fehlgeschlagen:'
  });
}

module.exports = {
  printEpic10P0ComponentWaveReport,
  runEpic10P0ComponentWaveSuite
};
