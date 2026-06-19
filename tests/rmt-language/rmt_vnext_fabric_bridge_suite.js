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
  RMT_VNEXT_FABRIC_BRIDGE_EVIDENCE_SCHEMA,
  RMT_VNEXT_FABRIC_BRIDGE_LANE_MATRIX,
  RMT_VNEXT_FABRIC_BRIDGE_WORKPACKAGE,
  RMT_VNEXT_HOST_ADAPTER_TELEMETRY_SCHEMA,
  RMT_VNEXT_ROUTE_COMPONENT_FIBER_EVIDENCE_SCHEMA,
  RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH,
  RMT_VNEXT_SOURCE_TO_SEA_FIXTURE_PATH,
  RMT_VNEXT_SOURCE_TO_SEA_MODULE_PATH,
  createRmtVNextSourceToSeaEvidence
} = require('../../tools/rmt-language/vnext-source-to-sea');
const {
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');

const RMT_VNEXT_FABRIC_BRIDGE_SUITE_PATH = 'tests/rmt-language/rmt_vnext_fabric_bridge_suite.js';
const FABRIC_BRIDGE_DOC_PATHS = Object.freeze([
  'docs/de/xtend-fabric-runtime.md',
  'docs/en/xtend-fabric-runtime.md',
  'docs/de/xtend-fabric-rmt-lane-mapping.md',
  'docs/en/xtend-fabric-rmt-lane-mapping.md'
]);
const PACKAGE_SCRIPT = 'node scripts/run_xtend_tests.js rmt-vnext-fabric-bridge';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function matrixScheduleRefs(laneMatrix) {
  return laneMatrix.map((entry) => entry.mapping && entry.mapping.scheduleRef).filter(Boolean);
}

function runRmtVNextFabricBridgeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-fabric-bridge',
    label: 'RMT vNext Fabric Lane/Fiber Bridge Evidence'
  });
  const sourceToSeaSyntax = syntaxCheckFile(RMT_VNEXT_SOURCE_TO_SEA_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_FABRIC_BRIDGE_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_SOURCE_TO_SEA_MODULE_PATH, rootDir, 'fabric bridge source module exists');
  assertFileExists(context, RMT_VNEXT_FABRIC_BRIDGE_SUITE_PATH, rootDir, 'fabric bridge suite exists');
  assertFileExists(context, RMT_VNEXT_SOURCE_TO_SEA_FIXTURE_PATH, rootDir, 'fabric bridge vNext fixture exists');
  assertFileExists(context, RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH, rootDir, 'fabric bridge browser fixture exists');
  FABRIC_BRIDGE_DOC_PATHS.forEach((docPath) => {
    assertFileExists(context, docPath, rootDir, `${docPath} exists as public Fabric documentation`);
  });
  context.assert(sourceToSeaSyntax.ok, `fabric bridge source module syntax passes${sourceToSeaSyntax.ok ? '' : ` (${sourceToSeaSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `fabric bridge suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  const source = readText(RMT_VNEXT_SOURCE_TO_SEA_FIXTURE_PATH, rootDir);
  const browserFixture = readText(RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH, rootDir);
  const evidence = createRmtVNextSourceToSeaEvidence({
    text: source,
    filePath: resolveRepoPath(RMT_VNEXT_SOURCE_TO_SEA_FIXTURE_PATH, rootDir)
  }, {
    browserFixtureText: browserFixture,
    browserFixturePath: RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH
  });
  const bridge = evidence.fabric && evidence.fabric.bridge;
  const laneMatrix = (bridge && bridge.laneMatrix) || [];
  const routeComponentFibers = bridge && bridge.routeComponentFibers;
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const bridgeDocs = FABRIC_BRIDGE_DOC_PATHS.map((docPath) => readText(docPath, rootDir)).join('\n');
  const workerPrerenderCompile = compileRmtVNextSource({
    text: [
      'template rkfa.prerender.demo {',
      '  state rkfa.prerender.card type object preserve {',
      '    initial {',
      '      id "worker-card"',
      '      text "Worker"',
      '    }',
      '  }',
      '',
      '  selector rkfa.prerender.card from state rkfa.prerender.card {',
      '    output WorkerCard',
      '  }',
      '',
      '  surface rkfa.prerender.card kind card component x-worker-card {',
      '    lane idle weight 30 {',
      '      hydrate worker-card from selector rkfa.prerender.card {',
      '        hydration mode worker_prerender_hydrate',
      '      }',
      '    }',
      '  }',
      '}'
    ].join('\n'),
    filePath: resolveRepoPath('tests/rmt-language/fixtures/rkfa-worker-prerender-inline.rmt', rootDir)
  });
  const workerHydration = workerPrerenderCompile.orchestrationArtifacts && workerPrerenderCompile.orchestrationArtifacts.hydration;
  const workerCapability = workerHydration && workerHydration.workerPrerender;
  const workerRecord = workerHydration && workerHydration.records && workerHydration.records.find((record) => record.mode === 'worker_prerender_hydrate');

  context.assert(evidence.ok === true, 'source-to-sea evidence is usable as PRIM-05 input');
  context.assert(bridge && bridge.schema === RMT_VNEXT_FABRIC_BRIDGE_EVIDENCE_SCHEMA, 'fabric bridge evidence declares schema');
  context.assert(bridge && bridge.workpackage === RMT_VNEXT_FABRIC_BRIDGE_WORKPACKAGE, 'fabric bridge evidence belongs to PRIM-05');
  context.assert(bridge && bridge.ok === true, 'fabric bridge evidence passes');
  context.assert(bridge && bridge.mapping.schema === 'xtend.fabric.rmt-lane-mapping.v1', 'fabric bridge uses lane mapping contract');
  context.assert(bridge && bridge.mapping.fabricLane === 'visible', 'fabric bridge maps primary fiber to Fabric visible lane');
  context.assert(bridge && bridge.mapping.rmtLane === 'visible', 'fabric bridge preserves RMT visible lane');
  context.assert(bridge && bridge.mapping.scheduleRef === 'component.visible.hydrate', 'fabric bridge resolves primary component hydration schedule');
  context.assert(bridge && bridge.mapping.endpointName === 'xtendrmt.component.hydrate', 'fabric bridge resolves primary component hydration endpoint');

  context.assert(bridge && bridge.fiber.schema === 'xtend.fabric.fiber.v1', 'fabric bridge records primary Fabric fiber');
  context.assert(bridge && bridge.fiber.status === 'completed', 'primary Fabric fiber completes');
  context.assert(bridge && bridge.fiber.source === 'rmt-vnext', 'primary Fabric fiber keeps vNext source');
  context.assert(bridge && bridge.fiber.metadata.workpackage === RMT_VNEXT_FABRIC_BRIDGE_WORKPACKAGE, 'primary Fabric fiber metadata keeps PRIM-05 workpackage');
  context.assert(bridge && bridge.fiber.metadata.kernelScheduleRef === evidence.kernel.scheduleRef, 'primary Fabric fiber correlates kernel schedule');
  context.assert(bridge && bridge.fiber.metadata.kernelFiberRef === evidence.fabric.fiber, 'primary Fabric fiber correlates kernel fiber');

  context.assert(bridge && bridge.telemetry.schema === 'xtend.fabric.telemetry-snapshot.v1', 'fabric bridge records telemetry snapshot');
  context.assert(bridge && bridge.telemetry.fiberCount >= 1 + RMT_VNEXT_FABRIC_BRIDGE_LANE_MATRIX.length + 4, 'fabric telemetry includes primary, matrix and route/component fibers');
  context.assert(bridge && bridge.telemetry.lane && bridge.telemetry.lane.scheduleRefs.includes('component.visible.hydrate'), 'fabric telemetry keeps primary hydration schedule');

  context.assert(laneMatrix.length === RMT_VNEXT_FABRIC_BRIDGE_LANE_MATRIX.length, 'fabric bridge records complete lane matrix');
  context.assert(laneMatrix.map((entry) => entry.lane).join('>') === 'user-blocking>transition>idle>background>diagnostics', 'fabric bridge lane matrix order is stable');
  context.assert(laneMatrix.every((entry) => entry.ok === true), 'fabric bridge lane matrix passes');
  context.assert(laneMatrix.every((entry) => entry.fiber && entry.fiber.schema === 'xtend.fabric.fiber.v1'), 'lane matrix records Fabric fibers');
  context.assert(laneMatrix.every((entry) => entry.fiber && entry.fiber.source === 'rmt-vnext-lane-matrix'), 'lane matrix fibers keep matrix source');
  context.assert(laneMatrix.every((entry) => entry.telemetry && entry.telemetry.scheduleRefs.includes(entry.mapping.scheduleRef)), 'lane matrix schedules reach telemetry');
  [
    'ui.user-blocking.input',
    'route.transition.render',
    'component.idle.hydrate',
    'ui.background.work',
    'diagnostics.snapshot'
  ].forEach((scheduleRef) => {
    context.assert(matrixScheduleRefs(laneMatrix).includes(scheduleRef), `lane matrix includes ${scheduleRef}`);
  });

  context.assert(bridge && bridge.hostAdapter.schema === RMT_VNEXT_HOST_ADAPTER_TELEMETRY_SCHEMA, 'fabric bridge records host adapter telemetry schema');
  context.assert(bridge && bridge.hostAdapter.summary && bridge.hostAdapter.summary.recordCount >= 1, 'fabric bridge summarizes host adapter telemetry');
  context.assert(bridge && bridge.hostAdapter.summary.lane && bridge.hostAdapter.summary.lane.scheduleRefs.includes('component.visible.hydrate'), 'host adapter telemetry keeps hydration schedule');

  context.assert(routeComponentFibers && routeComponentFibers.schema === RMT_VNEXT_ROUTE_COMPONENT_FIBER_EVIDENCE_SCHEMA, 'route/component fiber evidence declares schema');
  context.assert(routeComponentFibers && routeComponentFibers.ok === true, 'route/component fiber evidence passes');
  context.assert(routeComponentFibers && routeComponentFibers.counts.total === 4, 'route/component fiber evidence records four fibers');
  context.assert(routeComponentFibers && routeComponentFibers.component.every((entry) => entry.fiber && entry.fiber.source === 'component'), 'component fibers use component instrumentation source');
  context.assert(routeComponentFibers && routeComponentFibers.route.every((entry) => entry.fiber && entry.fiber.source === 'router'), 'route fibers use router instrumentation source');
  context.assert(routeComponentFibers && routeComponentFibers.component.every((entry) => entry.telemetry && entry.telemetry.scheduleRefs.includes(entry.expectedScheduleRef)), 'component fibers reach telemetry');
  context.assert(routeComponentFibers && routeComponentFibers.route.every((entry) => entry.telemetry && entry.telemetry.scheduleRefs.includes(entry.expectedScheduleRef)), 'route fibers reach telemetry');

  context.assert(bridge && bridge.browser.laneVisible === true, 'browser exposes Fabric lane marker');
  context.assert(bridge && bridge.browser.fiberVisible === true, 'browser exposes Fabric fiber marker');
  context.assert(bridge && bridge.browser.scheduleVisible === true, 'browser exposes Fabric schedule marker');
  context.assert(bridge && bridge.browser.hostAdapterTelemetryVisible === true, 'browser exposes host adapter telemetry marker');
  context.assert(evidence.checks.some((check) => check.name === 'kernel does not expose host imports' && check.ok === true), 'kernel boundary keeps host imports out');
  context.assert(bridge && bridge.correlation.map((entry) => entry.layer).join('>') === 'source>kernel.schedule>kernel.fiber>fabric.mapping>fabric.fiber>host.adapter>component.fibers>route.fibers>fabric.telemetry>browser', 'fabric bridge correlation is complete');

  context.assert(workerPrerenderCompile.ok === true, 'worker prerender hydration fixture compiles');
  context.assert(workerHydration && workerHydration.supportedModes.includes('worker_prerender_hydrate'), 'hydration artifact supports worker_prerender_hydrate');
  context.assert(workerCapability && workerCapability.id === 'workerPrerender', 'hydration artifact exposes workerPrerender capability');
  context.assert(workerCapability && workerCapability.status === 'supported', 'workerPrerender capability is supported when requested');
  context.assert(workerRecord && workerRecord.workerPrerender && workerRecord.workerPrerender.status === 'supported', 'worker hydration record carries workerPrerender support');
  context.assert(workerRecord && workerRecord.fabricSchedule && workerRecord.fabricSchedule.scheduleRef === 'component.worker_prerender_hydrate', 'worker hydration record links Fabric worker schedule');

  context.assert(runner.includes("id: 'rmt-vnext-fabric-bridge'"), 'test runner exposes PRIM-05 fabric bridge suite');
  context.assert(packageManifest.scripts['test:rmt-vnext-fabric-bridge'] === PACKAGE_SCRIPT, 'package exposes PRIM-05 fabric bridge script');
  context.assert(packageManifest.scripts['test:rmt-vnext-primitives'].includes('rmt-vnext-fabric-bridge'), 'primitive aggregate includes PRIM-05 fabric bridge gate');
  context.assert(packageManifest.scripts['test:rmt-vnext-primitives:report'].includes('rmt-vnext-fabric-bridge'), 'primitive report includes PRIM-05 fabric bridge gate');
  context.assert(RMT_VNEXT_FABRIC_BRIDGE_WORKPACKAGE === 'RMT-VNEXT-PRIM-05', 'fabric bridge source contract keeps PRIM-05 ownership');
  context.assert(bridgeDocs.includes('Fabric') && bridgeDocs.includes('RMT'), 'public Fabric docs describe the RMT/Fabric boundary');
  context.assert(bridgeDocs.includes('component.visible.hydrate'), 'public Fabric docs document component hydration schedule mapping');
  context.assert(bridgeDocs.includes('lane') && bridgeDocs.includes('fiber'), 'public Fabric docs explain lanes and fibers');

  return context.result({
    schema: RMT_VNEXT_FABRIC_BRIDGE_EVIDENCE_SCHEMA,
    workpackage: RMT_VNEXT_FABRIC_BRIDGE_WORKPACKAGE,
    fixture: RMT_VNEXT_SOURCE_TO_SEA_FIXTURE_PATH,
    browserFixture: RMT_VNEXT_SOURCE_TO_SEA_BROWSER_FIXTURE_PATH,
    laneCount: laneMatrix.length,
    fiberCount: bridge && bridge.telemetry && bridge.telemetry.fiberCount
  });
}

function printRmtVNextFabricBridgeReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT vNext Fabric Lane/Fiber Bridge Evidence erfolgreich.',
    failureTitle: 'RMT vNext Fabric Lane/Fiber Bridge Evidence fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextFabricBridgeReport,
  runRmtVNextFabricBridgeSuite
};

if (require.main === module) {
  const result = runRmtVNextFabricBridgeSuite();
  printRmtVNextFabricBridgeReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}
