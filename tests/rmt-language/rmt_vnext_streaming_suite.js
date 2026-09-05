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
  RMT_VNEXT_CORE_SCHEMA,
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');
const {
  RMT_VNEXT_SCHEDULER_SCHEMA,
  createSchedulerPolicy
} = require('../../tools/rmt-language/vnext-scheduler');
const {
  RMT_VNEXT_SECURITY_POLICY_SCHEMA
} = require('../../tools/rmt-language/vnext-security');
const {
  DEFAULT_COMPLETION_SIGNALS,
  DEFAULT_ERROR_PATHS,
  RMT_VNEXT_STREAMING_MODULE_PATH,
  RMT_VNEXT_STREAMING_PACKAGE_SCRIPT,
  RMT_VNEXT_STREAMING_REPORT_SCHEMA,
  RMT_VNEXT_STREAMING_SCHEMA,
  RMT_VNEXT_STREAMING_SUITE_PATH,
  RMT_VNEXT_STREAMING_WORKPACKAGE,
  RMT_VNEXT_STREAM_OPERATION_SCHEMA,
  RMT_VNEXT_STREAM_RUNTIME_PROBE_SCHEMA,
  STREAM_BACKPRESSURE_MISSING_CODE,
  STREAM_CAPABILITY_MISSING_CODE,
  STREAM_COMPLETION_MISSING_CODE,
  STREAM_DATA_SOURCE_KIND_UNSUPPORTED_CODE,
  STREAM_DATA_SOURCE_MISSING_CODE,
  STREAM_ERROR_PATH_MISSING_CODE,
  STREAM_RUNTIME_PROBE_HOST_COUPLED_CODE,
  STREAM_SCHEDULER_MISSING_CODE,
  STREAM_SECURITY_MISSING_CODE,
  STREAM_SOURCE_MISSING_CODE,
  STREAM_VARIANT_CAPABILITIES,
  createRmtVNextStreamingContract,
  createStreamingContract,
  serializeStreamingContract
} = require('../../tools/rmt-language/vnext-streaming');

const EPIC_15_PATH = 'development/EPIC_E15_RMT_vNext_Syntax.md';
const STREAMING_CONTRACT_PATH = 'development/XTendRMT-vNext-Streaming-Contract.md';
const WP_E15_14_PATH = 'development/WP-E15-14-Streaming-und-Incremental-Rendering-Contract-vorbereiten.md';
const VALID_STREAMING_FIXTURE = 'tests/rmt-language/fixtures/vnext-streaming-progressive.rmt';
const MISSING_SECURITY_FIXTURE = 'tests/rmt-language/fixtures/vnext-security-missing-policy.rmt';
const VALID_COMPLEX_FIXTURE = 'tests/rmt-language/fixtures/vnext-valid-complex.rmt';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
}

function compileFixture(relativePath, rootDir) {
  return compileRmtVNextSource({
    text: readText(relativePath, rootDir),
    filePath: resolveRepoPath(relativePath, rootDir)
  });
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function createStreamingDataSources() {
  return [
    {
      id: 'ssr.hero',
      kind: 'endpoint',
      unsafe: true,
      format: 'html',
      requiresTrustBoundary: true,
      requiresSanitize: ['html']
    },
    {
      id: 'ssr.fragments',
      kind: 'endpoint',
      unsafe: true,
      format: 'html',
      requiresTrustBoundary: true,
      requiresSanitize: ['html']
    },
    {
      id: 'feed.live',
      kind: 'sse',
      unsafe: true,
      format: 'html',
      requiresTrustBoundary: true,
      requiresSanitize: ['html']
    },
    {
      id: 'preview.render',
      kind: 'worker',
      unsafe: true,
      format: 'html',
      requiresTrustBoundary: true,
      requiresSanitize: ['html']
    },
    {
      id: 'panel.chunk',
      kind: 'worker',
      unsafe: true,
      format: 'html',
      requiresTrustBoundary: true,
      requiresSanitize: ['html']
    }
  ];
}

function createSecurityDataSources() {
  return [
    {
      id: 'docs.parse',
      kind: 'endpoint',
      unsafe: true,
      format: 'html',
      requiresTrustBoundary: true,
      requiresSanitize: ['html']
    },
    {
      id: 'docs.feed',
      kind: 'sse',
      unsafe: true,
      format: 'html',
      requiresTrustBoundary: true,
      requiresSanitize: ['html']
    },
    {
      id: 'preview.render',
      kind: 'worker',
      unsafe: true,
      format: 'html',
      requiresTrustBoundary: true,
      requiresSanitize: ['html']
    }
  ];
}

function createComplexDataSources() {
  return [
    {
      id: 'settings.load',
      kind: 'endpoint',
      unsafe: false
    },
    {
      id: 'docs.feed',
      kind: 'sse',
      unsafe: true,
      format: 'html',
      requiresTrustBoundary: true,
      requiresSanitize: ['html']
    }
  ];
}

function createStrictContract(coreDocument, overrides = {}) {
  return createStreamingContract(coreDocument, {
    dataSources: createStreamingDataSources(),
    ...overrides
  });
}

function runRmtVNextStreamingSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-streaming',
    label: 'Epic 15 RMT vNext Streaming and Incremental Rendering Contract'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextStreaming;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const epic = readText(EPIC_15_PATH, rootDir);
  const streamingContractDoc = readText(STREAMING_CONTRACT_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_STREAMING_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_STREAMING_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_STREAMING_MODULE_PATH, rootDir, 'vNext streaming module exists');
  assertFileExists(context, RMT_VNEXT_STREAMING_SUITE_PATH, rootDir, 'vNext streaming suite exists');
  assertFileExists(context, WP_E15_14_PATH, rootDir, 'WP-E15-14 workpackage document exists');
  assertFileExists(context, VALID_STREAMING_FIXTURE, rootDir, 'vNext progressive streaming fixture exists');
  context.assert(moduleSyntax.ok, `vNext streaming module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext streaming suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_VNEXT_STREAMING_SCHEMA, 'package metadata declares streaming schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.streamOperationSchema === RMT_VNEXT_STREAM_OPERATION_SCHEMA, 'package metadata declares stream operation schema');
  context.assert(metadata && metadata.runtimeProbeSchema === RMT_VNEXT_STREAM_RUNTIME_PROBE_SCHEMA, 'package metadata declares runtime probe schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_STREAMING_REPORT_SCHEMA, 'package metadata declares streaming report schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_STREAMING_WORKPACKAGE, 'package metadata points to WP-E15-14');
  context.assert(metadata && metadata.module === RMT_VNEXT_STREAMING_MODULE_PATH, 'package metadata points to streaming module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_STREAMING_SUITE_PATH, 'package metadata points to streaming suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-streaming --json', 'package metadata declares streaming local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_STREAMING_PACKAGE_SCRIPT, 'package metadata declares streaming package script');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-streaming'] === 'string' ? packageManifest.exports['./rmt-language/vnext-streaming'] : packageManifest.exports['./rmt-language/vnext-streaming'] && packageManifest.exports['./rmt-language/vnext-streaming'].default) === './tools/rmt-language/vnext-streaming.js', 'package exports vNext streaming contract');
  context.assert(packageManifest.scripts['test:rmt-vnext-streaming'] === 'node scripts/run_xtend_tests.js rmt-vnext-streaming', 'package exposes vNext streaming script');
  context.assert(runner.hasSuite("rmt-vnext-streaming"), 'test runner exposes rmt-vnext-streaming suite');
  context.assert(epic.includes('| `WP-E15-14` | P1 | completed | WS4 |'), 'Epic marks WP-E15-14 completed');
  context.assert(epic.includes('| `WP-E15-15` | P1 | completed | WS5 |'), 'Epic keeps WP-E15-15 completed after streaming contract');
  context.assert(streamingContractDoc.includes('schema: "xtend.rmt.vnext-streaming-contract.v1"'), 'Streaming contract document declares schema');

  assertIncludesAll(context, Object.keys(STREAM_VARIANT_CAPABILITIES), ['sse', 'worker', 'ssr', 'hydration'], 'streaming variants');
  assertIncludesAll(context, Object.values(STREAM_VARIANT_CAPABILITIES), [
    'stream.sse.incremental',
    'stream.worker.incremental',
    'stream.ssr.incremental',
    'stream.hydration.chunked'
  ], 'streaming capability ids');
  context.assert(DEFAULT_COMPLETION_SIGNALS.sse.signal === 'rmt.vnext.stream.complete', 'default sse completion signal is declared');
  context.assert(DEFAULT_ERROR_PATHS.worker.signal === 'rmt.vnext.worker.error', 'default worker error path is declared');

  const compileResult = compileFixture(VALID_STREAMING_FIXTURE, rootDir);
  const core = compileResult.coreDocument;
  context.assert(compileResult.ok === true, 'progressive streaming fixture compiles successfully');
  context.assert(core.schema === RMT_VNEXT_CORE_SCHEMA, 'progressive streaming fixture emits vNext core schema');
  context.assert(core.operations.length === 6, 'progressive streaming fixture compiles six operations');
  context.assert(core.dataSources.length === 5, 'progressive streaming fixture compiles five data sources');
  context.assert(core.securityPolicies.length === 10, 'progressive streaming fixture compiles ten security policies');

  const contract = createStrictContract(core);
  context.assert(contract.schema === RMT_VNEXT_STREAMING_SCHEMA, 'streaming contract emits streaming schema');
  context.assert(contract.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'streaming contract carries core schema');
  context.assert(contract.schedulerSchema === RMT_VNEXT_SCHEDULER_SCHEMA, 'streaming contract carries scheduler schema');
  context.assert(contract.securityPolicySchema === RMT_VNEXT_SECURITY_POLICY_SCHEMA, 'streaming contract carries security schema');
  context.assert(contract.ok === true, 'streaming contract validates successfully');
  context.assert(contract.status === 'ready', 'streaming contract is ready');
  context.assert(contract.streamRecordCount === 5, 'streaming contract tracks five stream-capable records');
  context.assert(contract.streamOperationCount === 3, 'streaming contract tracks three stream operations');
  context.assert(contract.hydrationOperationCount === 2, 'streaming contract tracks two chunked hydration operations');
  assertIncludesAll(context, contract.variants, ['hydration', 'sse', 'ssr', 'worker'], 'streaming contract variants');
  context.assert(contract.streams.every((record) => record.schema === RMT_VNEXT_STREAM_OPERATION_SCHEMA), 'stream records use stream operation schema');
  context.assert(contract.streams.every((record) => record.chunking && record.backpressure), 'stream records expose chunking and backpressure');
  context.assert(contract.streams.every((record) => record.completion && record.errorPath), 'stream records expose completion and error paths');
  context.assert(contract.streams.every((record) => record.security && record.security.visible === true), 'stream records expose security posture');
  context.assert(contract.streams.every((record) => record.status === 'ready'), 'stream records are ready');
  context.assert(contract.streams.some((record) => record.variant === 'sse' && record.capability === STREAM_VARIANT_CAPABILITIES.sse && record.dataSource.kind === 'sse'), 'sse stream record exposes capability and data source');
  context.assert(contract.streams.some((record) => record.variant === 'worker' && record.capability === STREAM_VARIANT_CAPABILITIES.worker && record.dataSource.kind === 'worker'), 'worker stream record exposes capability and data source');
  context.assert(contract.streams.some((record) => record.variant === 'ssr' && record.capability === STREAM_VARIANT_CAPABILITIES.ssr && record.dataSource.kind === 'endpoint'), 'ssr stream record exposes endpoint capability');
  context.assert(contract.streams.some((record) => record.variant === 'hydration' && record.capability === STREAM_VARIANT_CAPABILITIES.hydration), 'hydration stream record exposes chunked hydration capability');
  context.assert(contract.runtimeProbe.schema === RMT_VNEXT_STREAM_RUNTIME_PROBE_SCHEMA, 'runtime probe emits streaming probe schema');
  context.assert(contract.runtimeProbe.hostCoupled === false && contract.runtimeProbe.domRequired === false, 'runtime probe is host-neutral');
  context.assert(contract.runtimeProbe.ok === true, 'runtime probe validates successfully');
  context.assert(contract.runtimeProbe.operationCount === contract.streamRecordCount, 'runtime probe covers all stream records');
  context.assert(contract.runtimeProbe.operations.every((operation) => operation.chunkingVisible && operation.backpressureVisible), 'runtime probe exposes chunking and backpressure');
  context.assert(contract.runtimeProbe.operations.every((operation) => operation.completionVisible && operation.errorPathVisible), 'runtime probe exposes completion and error paths');
  context.assert(contract.runtimeProbe.operations.every((operation) => operation.securityVisible), 'runtime probe exposes security');

  const repeatContract = createStrictContract(compileFixture(VALID_STREAMING_FIXTURE, rootDir).coreDocument);
  context.assert(serializeStreamingContract(contract) === serializeStreamingContract(repeatContract), 'streaming contract serialization is byte-stable');
  context.assert(JSON.parse(serializeStreamingContract(contract)).schema === RMT_VNEXT_STREAMING_SCHEMA, 'serialized streaming contract is parseable JSON');

  const complexResult = compileFixture(VALID_COMPLEX_FIXTURE, rootDir);
  const complexContract = createStreamingContract(complexResult.coreDocument, {
    dataSources: createComplexDataSources()
  });
  context.assert(complexContract.ok === true, 'complex fixture streaming contract validates successfully');
  context.assert(complexContract.streams.some((record) => record.variant === 'hydration' && record.target === 'settings-form'), 'complex fixture maps settings hydration');
  context.assert(complexContract.streams.some((record) => record.variant === 'sse' && record.dataSource.target === 'docs.feed'), 'complex fixture maps docs.feed sse stream');

  const missingSourceCore = cloneJson(core);
  const missingSourceOperation = missingSourceCore.operations.find((operation) => operation.kind === 'stream');
  delete missingSourceOperation.source;
  delete missingSourceOperation.sourceRef;
  const missingSourceContract = createStrictContract(missingSourceCore);
  context.assert(missingSourceContract.ok === false, 'streaming without source is blocked');
  context.assert(missingSourceContract.diagnostics.some((diagnostic) => diagnostic.code === STREAM_SOURCE_MISSING_CODE), 'missing source produces streaming diagnostic');

  const missingDataSourceCore = cloneJson(core);
  const sseOperation = missingDataSourceCore.operations.find((operation) => operation.source && operation.source.kind === 'sse');
  missingDataSourceCore.dataSources = missingDataSourceCore.dataSources.filter((dataSource) => dataSource.id !== sseOperation.source.ref);
  const missingDataSourceContract = createStrictContract(missingDataSourceCore);
  context.assert(missingDataSourceContract.ok === false, 'streaming with missing data source is blocked');
  context.assert(missingDataSourceContract.diagnostics.some((diagnostic) => diagnostic.code === STREAM_DATA_SOURCE_MISSING_CODE), 'missing data source produces streaming diagnostic');

  const unsupportedKindCore = cloneJson(core);
  unsupportedKindCore.dataSources.find((dataSource) => dataSource.kind === 'sse').kind = 'sql';
  const unsupportedKindContract = createStrictContract(unsupportedKindCore);
  context.assert(unsupportedKindContract.ok === false, 'unsupported stream data source kind is blocked');
  context.assert(unsupportedKindContract.diagnostics.some((diagnostic) => diagnostic.code === STREAM_DATA_SOURCE_KIND_UNSUPPORTED_CODE), 'unsupported kind produces streaming diagnostic');

  const missingSchedulerCore = cloneJson(core);
  missingSchedulerCore.operations.find((operation) => operation.kind === 'stream').scope.lane = 'lane:missing';
  const missingSchedulerContract = createStrictContract(missingSchedulerCore);
  context.assert(missingSchedulerContract.ok === false, 'streaming without scheduler lane is blocked');
  context.assert(missingSchedulerContract.diagnostics.some((diagnostic) => diagnostic.code === STREAM_SCHEDULER_MISSING_CODE), 'missing scheduler produces streaming diagnostic');

  const missingBackpressurePolicy = createSchedulerPolicy(core);
  missingBackpressurePolicy.lanes[0].backpressure = null;
  const missingBackpressureContract = createStrictContract(core, {
    schedulerPolicy: missingBackpressurePolicy
  });
  context.assert(missingBackpressureContract.ok === false, 'streaming without backpressure metadata is blocked');
  context.assert(missingBackpressureContract.diagnostics.some((diagnostic) => diagnostic.code === STREAM_BACKPRESSURE_MISSING_CODE), 'missing backpressure produces streaming diagnostic');

  const missingSecurityResult = compileFixture(MISSING_SECURITY_FIXTURE, rootDir);
  const missingSecurityContract = createStreamingContract(missingSecurityResult.coreDocument, {
    dataSources: createSecurityDataSources()
  });
  context.assert(missingSecurityContract.ok === false, 'streaming without required security policies is blocked');
  context.assert(missingSecurityContract.diagnostics.some((diagnostic) => diagnostic.code === STREAM_SECURITY_MISSING_CODE), 'missing security produces streaming diagnostic');

  const missingCompletionContract = createStrictContract(core, {
    completionSignals: {
      sse: null
    }
  });
  context.assert(missingCompletionContract.ok === false, 'streaming without completion signal is blocked');
  context.assert(missingCompletionContract.diagnostics.some((diagnostic) => diagnostic.code === STREAM_COMPLETION_MISSING_CODE), 'missing completion produces streaming diagnostic');

  const missingErrorPathContract = createStrictContract(core, {
    errorPaths: {
      worker: null
    }
  });
  context.assert(missingErrorPathContract.ok === false, 'streaming without error path is blocked');
  context.assert(missingErrorPathContract.diagnostics.some((diagnostic) => diagnostic.code === STREAM_ERROR_PATH_MISSING_CODE), 'missing error path produces streaming diagnostic');

  const missingCapabilityContract = createStrictContract(core, {
    capabilities: [STREAM_VARIANT_CAPABILITIES.sse]
  });
  context.assert(missingCapabilityContract.ok === false, 'streaming without required capability is blocked');
  context.assert(missingCapabilityContract.diagnostics.some((diagnostic) => diagnostic.code === STREAM_CAPABILITY_MISSING_CODE), 'missing capability produces streaming diagnostic');

  const hostCoupledContract = createStrictContract(core, {
    runtimeProbe: {
      hostCoupled: true
    }
  });
  context.assert(hostCoupledContract.ok === false, 'host-coupled runtime probe is blocked');
  context.assert(hostCoupledContract.diagnostics.some((diagnostic) => diagnostic.code === STREAM_RUNTIME_PROBE_HOST_COUPLED_CODE), 'host-coupled runtime probe produces diagnostic');

  const factory = createRmtVNextStreamingContract({
    dataSources: createStreamingDataSources()
  });
  context.assert(factory.schema === RMT_VNEXT_STREAMING_SCHEMA, 'factory exposes streaming schema');
  context.assert(factory.streamOperationSchema === RMT_VNEXT_STREAM_OPERATION_SCHEMA, 'factory exposes stream operation schema');
  context.assert(factory.runtimeProbeSchema === RMT_VNEXT_STREAM_RUNTIME_PROBE_SCHEMA, 'factory exposes runtime probe schema');
  context.assert(factory.createContract(core).ok === true, 'factory creates streaming contract');

  return context.result({
    schema: RMT_VNEXT_STREAMING_REPORT_SCHEMA,
    streamingSchema: RMT_VNEXT_STREAMING_SCHEMA,
    streamOperationSchema: RMT_VNEXT_STREAM_OPERATION_SCHEMA,
    runtimeProbeSchema: RMT_VNEXT_STREAM_RUNTIME_PROBE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    schedulerSchema: RMT_VNEXT_SCHEDULER_SCHEMA,
    securityPolicySchema: RMT_VNEXT_SECURITY_POLICY_SCHEMA,
    workpackage: RMT_VNEXT_STREAMING_WORKPACKAGE,
    streamingModule: RMT_VNEXT_STREAMING_MODULE_PATH,
    suite: RMT_VNEXT_STREAMING_SUITE_PATH,
    streamRecordCount: contract.streamRecordCount,
    variants: contract.variants
  });
}

function printRmtVNextStreamingReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 15 RMT vNext Streaming und Incremental Rendering Contract erfolgreich.',
    failureTitle: 'Epic 15 RMT vNext Streaming und Incremental Rendering Contract fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextStreamingReport,
  runRmtVNextStreamingSuite
};
