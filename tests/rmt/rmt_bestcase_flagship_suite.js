const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');
const {
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');
const {
  readBestcaseVNextDemo
} = require('../utils/rmt-bestcase');

const BESTCASE_SOURCE = 'demos/xtendrmt/examples/flagship/source.rmt';
const BESTCASE_CORE = 'demos/xtendrmt/examples/flagship/generated/core.json';
const BESTCASE_JS = 'demos/xtendrmt/examples/flagship/generated/app.js';
const BESTCASE_BROWSER_FIXTURE = 'demos/xtendrmt/examples/flagship/browser-smoke.html';
const FLAGSHIP_SCHEMA = 'xtend.rmt.bestcase-flagship.v1';
const FLAGSHIP_BROWSER_SCHEMA = 'xtend.rmt.bestcase-flagship-browser-smoke.v1';
const REQUIRED_SURFACES = ['streaming', 'sourceToSea', 'enterprise', 'enterpriseFallback', 'governance', 'nativeFirst'];
const REQUIRED_ROUTES = ['/streaming', '/source-to-sea', '/enterprise', '/governance', '/native-first'];
const REQUIRED_FAMILIES = [
  'vnext-streaming',
  'source-to-sea-fabric-evidence',
  'enterprise-remote-surfaces',
  'degradation-fallback',
  'cross-surface-event-governance',
  'native-first-owned-rmt'
];

function assertIncludesAll(context, actual, expected, label) {
  const values = Array.isArray(actual) ? actual : [];
  expected.forEach((entry) => {
    context.assert(values.includes(entry), `${label} includes ${entry}`);
  });
}

function findByName(records, name) {
  return Array.isArray(records) ? records.find((record) => record && record.name === name) || null : null;
}

function operationByTarget(core, targetRef) {
  return Array.isArray(core.operations)
    ? core.operations.find((operation) => operation && operation.target && operation.target.ref === targetRef) || null
    : null;
}

function runRmtBestcaseFlagshipSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-bestcase-flagship',
    label: 'XTendRMT Bestcase Flagship Demo'
  });
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const source = readText(BESTCASE_SOURCE, rootDir);
  const core = readJson(BESTCASE_CORE, rootDir);
  const demo = readBestcaseVNextDemo(rootDir).projection;
  const demoJs = readText(BESTCASE_JS, rootDir);
  const fixture = readText(BESTCASE_BROWSER_FIXTURE, rootDir);
  const compileResult = compileRmtVNextSource({
    text: source,
    filePath: BESTCASE_SOURCE
  });
  const metadata = demo.manifest && demo.manifest.metadata ? demo.manifest.metadata : {};
  const coreMetadata = core.manifest && core.manifest.metadata ? core.manifest.metadata : {};
  const remoteSurface = Array.isArray(core.remoteSurfaces) ? core.remoteSurfaces[0] : null;
  const streamingOperation = operationByTarget(core, 'activity-feed');
  const routePaths = Array.isArray(demo.routes) ? demo.routes.map((route) => route.path) : [];
  const componentIds = Array.isArray(demo.components) ? demo.components.map((component) => component.id) : [];
  const scheduleIds = Array.isArray(demo.schedules) ? demo.schedules.map((schedule) => schedule.id) : [];
  const templateIds = Array.isArray(demo.templates) ? demo.templates.map((template) => template.id) : [];

  context.assert(compileResult.ok === true, 'Bestcase flagship source compiles through the vNext compiler');
  context.assert(core.schema === 'xtend.rmt.core-format.vnext.v1', 'Bestcase flagship core keeps vNext core schema');
  context.assert(compileResult.coreDocument && compileResult.coreDocument.surfaces.length === core.surfaces.length, 'Bestcase checked-in core surface count matches compiler output');
  context.assert(compileResult.coreDocument && compileResult.coreDocument.operations.length === core.operations.length, 'Bestcase checked-in core operation count matches compiler output');
  context.assert(compileResult.coreDocument && compileResult.coreDocument.remoteSurfaces.length === core.remoteSurfaces.length, 'Bestcase checked-in core remote surface count matches compiler output');

  assertIncludesAll(context, Array.isArray(core.surfaces) ? core.surfaces.map((surface) => surface.name) : [], REQUIRED_SURFACES, 'Bestcase core surfaces');
  context.assert(Boolean(findByName(core.surfaces, 'streaming')), 'Bestcase core exposes streaming surface');
  context.assert(streamingOperation && streamingOperation.kind === 'stream' && streamingOperation.source && streamingOperation.source.kind === 'sse', 'Bestcase core exposes SSE streaming operation');
  context.assert(Array.isArray(streamingOperation && streamingOperation.policyRefs) && streamingOperation.policyRefs.length >= 2, 'Bestcase streaming operation carries trust and sanitize policy refs');
  context.assert(JSON.stringify(core.securityPolicies || []).includes('xtend.security.streaming-boundary.v1'), 'Bestcase core records streaming trust boundary');
  context.assert(JSON.stringify(core.securityPolicies || []).includes('sanitize'), 'Bestcase core records streaming sanitize policy');

  context.assert(remoteSurface && remoteSurface.name === 'bestcase.audit', 'Bestcase core exposes audit remote surface');
  context.assert(remoteSurface && remoteSurface.remote && remoteSurface.remote.id === '@xtend/audit-panel', 'Bestcase remote surface uses audit panel remote id');
  context.assert(remoteSurface && remoteSurface.remote && remoteSurface.remote.versionRange === '^2.0.0', 'Bestcase remote surface is on flagship remote version range');
  context.assert(remoteSurface && remoteSurface.fallback && remoteSurface.fallback.ref === 'enterpriseFallback', 'Bestcase remote surface resolves local enterprise fallback');
  context.assert(remoteSurface && remoteSurface.runtime && remoteSurface.runtime.kernelRemoteExecution === false, 'Bestcase remote surface keeps kernel remote execution disabled');
  context.assert(JSON.stringify(remoteSurface && remoteSurface.events || {}).includes('demo.enterprise.audit.requested.v1'), 'Bestcase remote surface consumes enterprise audit event');
  context.assert(JSON.stringify(remoteSurface && remoteSurface.events || {}).includes('demo.governance.published.v1'), 'Bestcase remote surface consumes governed cross-surface event');

  context.assert(metadata.flagship && metadata.flagship.schema === FLAGSHIP_SCHEMA, 'Bestcase projection exposes flagship metadata schema');
  assertIncludesAll(context, metadata.flagship && metadata.flagship.families, REQUIRED_FAMILIES, 'Bestcase projection flagship families');
  context.assert(metadata.flagship && metadata.flagship.remoteExecution === false, 'Bestcase projection keeps remote execution disabled');
  context.assert(metadata.flagship && metadata.flagship.networkRequests === 0, 'Bestcase projection records zero flagship network requests');
  context.assert(metadata.streaming && metadata.streaming.trustBoundary === 'xtend.security.streaming-boundary.v1', 'Bestcase projection exposes streaming boundary metadata');
  context.assert(metadata.sourceToSeaEvidence && metadata.sourceToSeaEvidence.primitiveId === 'bestcase.evidence.summary', 'Bestcase projection exposes Source-to-Sea primitive metadata');
  context.assert(metadata.enterpriseRemoteSurface && metadata.enterpriseRemoteSurface.fallbackSurface === 'enterpriseFallback', 'Bestcase projection exposes enterprise fallback metadata');
  context.assert(metadata.eventGovernance && Array.isArray(metadata.eventGovernance.events) && metadata.eventGovernance.events.includes('demo.governance.published.v1'), 'Bestcase projection exposes event governance metadata');
  context.assert(metadata.nativeFirstOwnedRmt && metadata.nativeFirstOwnedRmt.runtimeParity === true, 'Bestcase projection exposes Native-First runtime parity metadata');

  assertIncludesAll(context, routePaths, REQUIRED_ROUTES, 'Bestcase projected routes');
  assertIncludesAll(context, componentIds, [
    'x-rmt-route-streaming',
    'x-rmt-route-source-to-sea',
    'x-rmt-route-enterprise',
    'x-rmt-route-governance',
    'x-rmt-route-native-first'
  ], 'Bestcase projected route components');
  assertIncludesAll(context, scheduleIds, [
    'streaming.visible.render',
    'source-to-sea.visible.render',
    'enterprise.visible.contract',
    'event-governance.visible.render',
    'native-first.visible.render'
  ], 'Bestcase projected schedules');
  assertIncludesAll(context, templateIds, [
    'demo.streaming',
    'demo.sourceToSea',
    'demo.enterprise',
    'demo.governance',
    'demo.nativeFirst'
  ], 'Bestcase projected templates');

  context.assert(source.includes('stream activity-feed from sse feed.activity'), 'Bestcase source includes vNext streaming authoring');
  context.assert(source.includes('trust boundary "xtend.security.streaming-boundary.v1"'), 'Bestcase source includes streaming trust boundary');
  context.assert(source.includes('sanitize html'), 'Bestcase source includes streaming sanitize policy');
  context.assert(source.includes('surface sourceToSea'), 'Bestcase source includes Source-to-Sea surface');
  context.assert(source.includes('surface enterpriseFallback'), 'Bestcase source includes enterprise fallback surface');
  context.assert(source.includes('surface nativeFirst'), 'Bestcase source includes Native-First surface');
  context.assert(demoJs.includes('x-rmt-route-source-to-sea'), 'Bestcase runtime defines Source-to-Sea route component');
  context.assert(demoJs.includes('data-remote-execution="false"'), 'Bestcase runtime renders remote surface as contract-only');
  context.assert(demoJs.includes('xtend.native-first.rmt-owned-flagship.v1'), 'Bestcase runtime exposes Native-First Owned RMT metadata');

  context.assert(fixture.includes(FLAGSHIP_BROWSER_SCHEMA), 'Bestcase browser fixture declares flagship browser schema');
  context.assert(fixture.includes('__xtendRmtBestcaseFlagshipSmokeResult'), 'Bestcase browser fixture exposes flagship result object');
  context.assert(fixture.includes('data-rmt-primitive-id="bestcase.evidence.summary"'), 'Bestcase browser fixture exposes Source-to-Sea primitive marker');
  context.assert(fixture.includes('data-remote-execution="false"'), 'Bestcase browser fixture disables remote execution');
  context.assert(fixture.includes('"networkRequests": 0'), 'Bestcase browser fixture records zero network requests');
  context.assert(fixture.includes('data-native-first-owned-rmt="true"'), 'Bestcase browser fixture exposes Native-First marker');
  context.assert(!/fetch\s*\(/u.test(fixture), 'Bestcase browser fixture performs no fetch');
  context.assert(!/import\s*\(/u.test(fixture), 'Bestcase browser fixture performs no dynamic import');

  context.assert(packageManifest.scripts && packageManifest.scripts['test:rmt-bestcase-flagship'] === 'node scripts/run_xtend_tests.js rmt-bestcase-flagship', 'package exposes Bestcase flagship test script');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:rmt-vnext-primitives'].includes('rmt-bestcase-flagship'), 'RMT vNext primitives aggregate includes Bestcase flagship suite');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:rmt-vnext-primitives:report'].includes('rmt-bestcase-flagship'), 'RMT vNext primitives report aggregate includes Bestcase flagship suite');
  context.assert(runner.includes("id: 'rmt-bestcase-flagship'"), 'test runner exposes rmt-bestcase-flagship suite');

  return context.result();
}

function printRmtBestcaseFlagshipReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTendRMT Bestcase Flagship Demo erfolgreich.',
    failureTitle: 'XTendRMT Bestcase Flagship Demo fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runRmtBestcaseFlagshipSuite();
  printRmtBestcaseFlagshipReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  runRmtBestcaseFlagshipSuite,
  printRmtBestcaseFlagshipReport
};
