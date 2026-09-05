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
  APP_PLATFORM_PRIMITIVE_DOMAINS,
  LEGACY_DOMAINS,
  MIGRATION_LEGACY_BACKGROUNDED_CODE,
  MIGRATION_LEGACY_PARSE_FAILED_CODE,
  MIGRATION_LOSSY_DOMAIN_CODE,
  MIGRATION_OPT_IN_REQUIRED_CODE,
  MIGRATION_PRIMITIVE_PREVIEW_AVAILABLE_CODE,
  RMT_VNEXT_COMPATIBILITY_MODULE_PATH,
  RMT_VNEXT_COMPATIBILITY_PACKAGE_SCRIPT,
  RMT_VNEXT_COMPATIBILITY_REPORT_SCHEMA,
  RMT_VNEXT_COMPATIBILITY_SCHEMA,
  RMT_VNEXT_COMPATIBILITY_SUITE_PATH,
  RMT_VNEXT_COMPATIBILITY_WORKPACKAGE,
  RMT_VNEXT_LEGACY_PROJECTION_SCHEMA,
  RMT_VNEXT_MIGRATION_REPORT_SCHEMA,
  RMT_VNEXT_PRIMITIVE_MIGRATION_APPLY_PLAN_SCHEMA,
  RMT_VNEXT_PRIMITIVE_MIGRATION_SCHEMA,
  RMT_VNEXT_PRIMITIVE_MIGRATION_WORKPACKAGE,
  RMT_VNEXT_ROUNDTRIP_REPORT_SCHEMA,
  ROUNDTRIP_COMPATIBLE_WARNINGS,
  createAppPlatformPrimitiveAuthoringDraft,
  createAppPlatformPrimitiveMigrationApplyPlan,
  createAppPlatformPrimitiveMigrationPreview,
  createCompatibilityMatrix,
  createLegacyRoundtripReport,
  createMigrationReport,
  createRmtVNextCompatibilityAdapter,
  serializeMigrationReport
} = require('../../tools/rmt-language/vnext-compatibility');

const EPIC_15_PATH = 'development/EPIC_E15_RMT_vNext_Syntax.md';
const COMPATIBILITY_CONTRACT_PATH = 'development/XTendRMT-vNext-Compatibility-Migration-Contract.md';
const WP_E15_16_PATH = 'development/WP-E15-16-Compatibility-Migration-und-Legacy-JSON-Roundtrip-absichern.md';
const VALID_LEGACY_FIXTURE = 'tests/rmt-language/fixtures/regression-valid.rmt';
const LEGACY_FALLBACK_FIXTURE = 'tests/rmt-language/fixtures/regression-legacy.rmt.json';
const BROKEN_LEGACY_FIXTURE = 'tests/rmt-language/fixtures/regression-broken-syntax.rmt';
const LARGE_LEGACY_FIXTURE = 'tests/rmt-language/fixtures/regression-large.rmt';
const VALID_VNEXT_FIXTURE = 'tests/rmt-language/fixtures/vnext-streaming-progressive.rmt';
const APP_PLATFORM_FIXTURE = 'tests/fixtures/rmt-app-platform-tooling.rmt';
const APP_PLATFORM_LEGACY_CORE_FIXTURE = 'tests/fixtures/rmt-app-platform-tooling.core.json';
const PUBLIC_MIGRATION_DOC_PATHS = Object.freeze([
  'docs/de/xtendrmt-migration-guide.md',
  'docs/en/xtendrmt-migration-guide.md'
]);

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function fixtureInput(relativePath, rootDir) {
  return {
    text: readText(relativePath, rootDir),
    filePath: resolveRepoPath(relativePath, rootDir),
    version: 15
  };
}

function normalizeRepoRelativePath(filePath, rootDir) {
  return path.relative(rootDir, filePath).split(path.sep).join('/');
}

function collectRmtAuthoringFiles(rootDir) {
  const ignoredDirs = new Set([
    '.git',
    '.next',
    'coverage',
    'dist',
    'node_modules'
  ]);
  const files = [];

  function visit(directory) {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirs.has(entry.name)) {
          visit(absolutePath);
        }
        return;
      }

      if (entry.isFile() && (entry.name.endsWith('.rmt') || entry.name.endsWith('.rmt.json'))) {
        files.push(normalizeRepoRelativePath(absolutePath, rootDir));
      }
    });
  }

  visit(rootDir);
  return files.sort();
}

function isAllowedLegacyRmtFixture(relativePath) {
  return relativePath.endsWith('.legacy.rmt')
    || relativePath.startsWith('tests/rmt-language/fixtures/regression-')
    || relativePath === 'tests/rmt-language/fixtures/regression-legacy.rmt.json'
    || relativePath.startsWith('tests/rmt-language/fixtures/vnext-remote-compatibility-');
}

function legacyJsonAuthoringViolations(rootDir) {
  return collectRmtAuthoringFiles(rootDir).filter((relativePath) => {
    if (isAllowedLegacyRmtFixture(relativePath)) {
      return false;
    }
    return readText(relativePath, rootDir).trimStart().startsWith('{');
  });
}

function diagnosticCodes(report) {
  return (report.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function runMetadataChecks(context, rootDir) {
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const epic = readText(EPIC_15_PATH, rootDir);
  const contract = readText(COMPATIBILITY_CONTRACT_PATH, rootDir);
  const workpackage = readText(WP_E15_16_PATH, rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextCompatibility;

  context.assert(metadata && metadata.schema === RMT_VNEXT_COMPATIBILITY_SCHEMA, 'package metadata declares vNext compatibility schema');
  context.assert(metadata && metadata.migrationReportSchema === RMT_VNEXT_MIGRATION_REPORT_SCHEMA, 'package metadata declares migration report schema');
  context.assert(metadata && metadata.primitiveMigrationApplyPlanSchema === RMT_VNEXT_PRIMITIVE_MIGRATION_APPLY_PLAN_SCHEMA, 'package metadata declares primitive migration apply-plan schema');
  context.assert(metadata && metadata.roundtripReportSchema === RMT_VNEXT_ROUNDTRIP_REPORT_SCHEMA, 'package metadata declares roundtrip report schema');
  context.assert(metadata && metadata.projectionSchema === RMT_VNEXT_LEGACY_PROJECTION_SCHEMA, 'package metadata declares legacy projection schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_COMPATIBILITY_REPORT_SCHEMA, 'package metadata declares compatibility report schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_COMPATIBILITY_WORKPACKAGE, 'package metadata declares WP-E15-16 ownership');
  context.assert(metadata && metadata.module === RMT_VNEXT_COMPATIBILITY_MODULE_PATH, 'package metadata points to compatibility module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_COMPATIBILITY_SUITE_PATH, 'package metadata points to compatibility suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-compatibility --json', 'package metadata declares compatibility local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_COMPATIBILITY_PACKAGE_SCRIPT, 'package metadata declares compatibility package script');
  context.assert(metadata && metadata.migrationModes.includes('apply-plan'), 'package metadata declares primitive migration apply-plan mode');
  context.assert(metadata && Array.isArray(metadata.legacyDomains) && LEGACY_DOMAINS.every((domain) => metadata.legacyDomains.includes(domain)), 'package metadata lists legacy migration domains');
  context.assert(metadata && ROUNDTRIP_COMPATIBLE_WARNINGS.every((code) => metadata.compatibleWarnings.includes(code)), 'package metadata documents compatible warning codes');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-compatibility'] === 'string' ? packageManifest.exports['./rmt-language/vnext-compatibility'] : packageManifest.exports['./rmt-language/vnext-compatibility'] && packageManifest.exports['./rmt-language/vnext-compatibility'].default) === './tools/rmt-language/vnext-compatibility.js', 'package exports vNext compatibility adapter');
  context.assert(packageManifest.scripts['test:rmt-vnext-compatibility'] === 'node scripts/run_xtend_tests.js rmt-vnext-compatibility', 'package exposes vNext compatibility script');
  context.assert(runner.hasSuite("rmt-vnext-compatibility"), 'test runner exposes rmt-vnext-compatibility suite');
  context.assert(epic.includes('| `WP-E15-16` | P2 | completed | WS5 |'), 'Epic marks WP-E15-16 completed');
  context.assert(epic.includes('| `WP-E15-17` | P2 | completed | WS6 |'), 'Epic keeps WP-E15-17 completed after compatibility');
  context.assert(contract.includes(RMT_VNEXT_COMPATIBILITY_SCHEMA), 'compatibility contract declares matrix schema');
  context.assert(contract.includes(RMT_VNEXT_MIGRATION_REPORT_SCHEMA), 'compatibility contract declares migration report schema');
  context.assert(workpackage.includes('Status: `completed`'), 'WP-E15-16 document is completed');
}

function runLegacyAllowlistChecks(context, rootDir) {
  const violations = legacyJsonAuthoringViolations(rootDir);

  context.assert(
    violations.length === 0,
    `non-allowlisted .rmt/.rmt.json files must not use legacy JSON authoring${violations.length ? `: ${violations.join(', ')}` : ''}`
  );
  context.assert(isAllowedLegacyRmtFixture(VALID_LEGACY_FIXTURE), 'legacy regression-valid fixture is explicitly allowlisted');
  context.assert(isAllowedLegacyRmtFixture(LEGACY_FALLBACK_FIXTURE), 'legacy .rmt.json fallback fixture is explicitly allowlisted');
  context.assert(isAllowedLegacyRmtFixture(BROKEN_LEGACY_FIXTURE), 'broken legacy regression fixture is explicitly allowlisted');
}

function runRoundtripChecks(context, rootDir) {
  const validRoundtrip = createLegacyRoundtripReport(fixtureInput(VALID_LEGACY_FIXTURE, rootDir));
  const fallbackRoundtrip = createLegacyRoundtripReport(fixtureInput(LEGACY_FALLBACK_FIXTURE, rootDir));
  const largeRoundtrip = createLegacyRoundtripReport(fixtureInput(LARGE_LEGACY_FIXTURE, rootDir));

  context.assert(validRoundtrip.schema === RMT_VNEXT_ROUNDTRIP_REPORT_SCHEMA, 'legacy roundtrip report uses schema');
  context.assert(validRoundtrip.ok === true && validRoundtrip.status === 'ready', 'legacy fixture roundtrips as normalized JSON');
  context.assert(validRoundtrip.comparisonBoundary === 'semantic-normalized-json-with-normalization-metadata-excluded', 'legacy roundtrip documents metadata boundary');
  context.assert(validRoundtrip.serialized.includes('"kind": "rmt_document"'), 'legacy roundtrip serializes normalized document');
  context.assert(fallbackRoundtrip.ok === true && fallbackRoundtrip.status === 'ready', 'fallback .rmt.json fixture remains roundtrippable');
  context.assert(diagnosticCodes(fallbackRoundtrip).includes('rmt.document.extension.fallback-used'), 'fallback fixture keeps extension fallback warning');
  context.assert(largeRoundtrip.ok === true && largeRoundtrip.serializedLength > 1000, 'large legacy regression fixture remains parseable and roundtrippable');
}

function runMigrationChecks(context, rootDir) {
  const reportOnly = createMigrationReport(fixtureInput(VALID_LEGACY_FIXTURE, rootDir));
  const preview = createMigrationReport(fixtureInput(VALID_LEGACY_FIXTURE, rootDir), {
    migrationMode: 'preview'
  });
  const vnext = createMigrationReport(fixtureInput(VALID_VNEXT_FIXTURE, rootDir));
  const broken = createMigrationReport(fixtureInput(BROKEN_LEGACY_FIXTURE, rootDir), {
    migrationMode: 'preview'
  });
  const compiledDraft = compileRmtVNextSource({
    text: preview.authoringDraft,
    filePath: resolveRepoPath('tmp/wp-e15-16-authoring-preview.rmt', rootDir)
  });

  context.assert(reportOnly.schema === RMT_VNEXT_MIGRATION_REPORT_SCHEMA, 'migration report uses schema');
  context.assert(reportOnly.ok === true && reportOnly.status === 'ready', 'legacy report-only migration stays compatible');
  context.assert(reportOnly.languageMode === 'legacy-json' && reportOnly.migrationRequired === true, 'legacy input is detected as migration candidate');
  context.assert(reportOnly.migrationMode === 'report-only' && reportOnly.authoringDraft === null, 'report-only mode does not rewrite authoring source');
  context.assert(reportOnly.projection && reportOnly.projection.schema === RMT_VNEXT_CORE_SCHEMA, 'legacy migration produces vNext core projection');
  context.assert(reportOnly.projection && reportOnly.projection.projectionSchema === RMT_VNEXT_LEGACY_PROJECTION_SCHEMA, 'legacy projection declares projection schema');
  context.assert(diagnosticCodes(reportOnly).includes(MIGRATION_OPT_IN_REQUIRED_CODE), 'report-only migration emits opt-in warning');
  context.assert(diagnosticCodes(reportOnly).includes(MIGRATION_LOSSY_DOMAIN_CODE), 'migration reports lossy legacy boundaries');
  context.assert(reportOnly.errorCount === 0, 'compatible legacy warnings are not hard errors');
  context.assert(preview.ok === true && preview.migrationMode === 'preview', 'preview migration is opt-in and compatible');
  context.assert(typeof preview.authoringDraft === 'string' && preview.authoringDraft.includes('template regression.valid'), 'preview migration creates vNext authoring draft');
  context.assert(preview.authoringDraftCompileStatus === 'compiled' && compiledDraft.ok === true, 'preview authoring draft compiles to vNext core');
  context.assert(vnext.ok === true && vnext.languageMode === 'vnext', 'vNext source remains compatible without migration');
  context.assert(vnext.migrationRequired === false && vnext.roundtrip === null, 'vNext source bypasses legacy roundtrip migration');
  context.assert(broken.ok === false && broken.status === 'blocked', 'broken legacy syntax blocks migration');
  context.assert(diagnosticCodes(broken).includes(MIGRATION_LEGACY_PARSE_FAILED_CODE), 'broken legacy syntax receives precise migration diagnostic');
}

function runPrimitiveMigrationChecks(context, rootDir) {
  const input = fixtureInput(APP_PLATFORM_LEGACY_CORE_FIXTURE, rootDir);
  const reportOnly = createMigrationReport(input, {
    rootDir
  });
  const preview = createAppPlatformPrimitiveMigrationPreview(input, {
    rootDir
  });
  const applyPlan = createAppPlatformPrimitiveMigrationApplyPlan(input, {
    rootDir
  });
  const parseBlockedApplyPlan = createAppPlatformPrimitiveMigrationApplyPlan({
    text: '{',
    filePath: resolveRepoPath('tmp/rmt-app-platform-broken.json', rootDir)
  }, {
    rootDir
  });
  const previewReport = createMigrationReport(input, {
    rootDir,
    migrationMode: 'preview'
  });
  const applyPlanReport = createMigrationReport(input, {
    rootDir,
    migrationMode: 'apply-plan'
  });
  const primitiveMatrix = createCompatibilityMatrix([
    input,
    fixtureInput(VALID_VNEXT_FIXTURE, rootDir)
  ], {
    rootDir,
    migrationMode: 'preview'
  });
  const compiledDraft = compileRmtVNextSource({
    text: preview.authoringDraft,
    filePath: resolveRepoPath('tmp/rmt-vnext-prim08-authoring-preview.rmt', rootDir)
  });
  const previewDiagnostics = diagnosticCodes(preview);
  const reportDiagnostics = diagnosticCodes(reportOnly);
  const previewReportDiagnostics = diagnosticCodes(previewReport);
  const appPlatformEntry = primitiveMatrix.entries.find((entry) => entry.report.languageMode === 'legacy-app-platform-json');

  context.assert(preview.schema === RMT_VNEXT_PRIMITIVE_MIGRATION_SCHEMA, 'primitive migration preview uses dedicated schema');
  context.assert(applyPlan.schema === RMT_VNEXT_PRIMITIVE_MIGRATION_APPLY_PLAN_SCHEMA, 'primitive migration apply plan uses dedicated schema');
  context.assert(preview.workpackage === RMT_VNEXT_PRIMITIVE_MIGRATION_WORKPACKAGE, 'primitive migration preview declares PRIM-08 ownership');
  context.assert(preview.ok === true && preview.status === 'preview-ready', 'App-Platform primitive fixture produces a ready migration preview');
  context.assert(preview.languageMode === 'legacy-app-platform-json', 'App-Platform primitive input is detected as legacy App-Platform JSON');
  context.assert(preview.vNextAuthoring && preview.vNextAuthoring.role === 'default', 'primitive migration marks vNext as default authoring surface');
  context.assert(preview.legacyAuthoring && preview.legacyAuthoring.backgrounded === true, 'primitive migration backgrounds legacy authoring');
  context.assert(preview.legacyAuthoring && preview.legacyAuthoring.role === 'compiler-target', 'primitive migration keeps legacy as compiler target');
  context.assert(typeof preview.authoringDraft === 'string' && preview.authoringDraft.includes('template epic18.app-platform-tooling.fixture'), 'primitive migration creates vNext template draft');
  context.assert(preview.authoringDraft.includes('state items type collection'), 'primitive migration emits state primitive syntax');
  context.assert(preview.authoringDraft.includes('datasource items from fixture records.generic-items'), 'primitive migration emits datasource primitive syntax');
  context.assert(preview.authoringDraft.includes('action load-items'), 'primitive migration emits action primitive syntax');
  context.assert(preview.authoringDraft.includes('portal app root "#app-root"'), 'primitive migration emits portal primitive syntax');
  context.assert(preview.authoringDraft.includes('surface workspace kind window component workspace'), 'primitive migration emits surface primitive syntax');
  context.assert(preview.authoringDraft.includes('lane visible weight 70'), 'primitive migration keeps Fabric lane authoring in vNext');
  context.assert(preview.authoringDraft.includes('on open-detail target ref.row -> action open-detail'), 'primitive migration emits event-to-action primitive syntax');
  const actionResourceDraft = createAppPlatformPrimitiveAuthoringDraft({
    manifest: { id: 'action.resource.owner.fixture' },
    actions: [{ id: 'action.load', resources: ['resource.socket'] }],
    resources: [{ id: 'resource.socket', kind: 'subscription' }]
  });
  context.assert(!actionResourceDraft.includes('owner action.'), 'primitive migration does not emit action-owned resources');
  context.assert(actionResourceDraft.includes('resource socket kind subscription owner surface.root'), 'primitive migration falls back to surface lifecycle owner for action-only resources');
  context.assert(preview.authoringDraftCompileStatus === 'compiled' && compiledDraft.ok === true, 'primitive migration vNext draft compiles');
  context.assert(preview.projection && preview.projection.schema === RMT_VNEXT_CORE_SCHEMA, 'primitive migration carries compiled vNext projection');
  context.assert(preview.projection && preview.projection.appPlatform && preview.projection.kernelRecords, 'primitive migration produces App-Platform and Kernel records');
  context.assert(preview.projection.appPlatform.state.length >= 1, 'primitive migration projection carries state records');
  context.assert(preview.projection.appPlatform.dataSources.length >= 1, 'primitive migration projection carries datasource records');
  context.assert(preview.projection.appPlatform.actions.length >= 1, 'primitive migration projection carries action records');
  context.assert(preview.projection.appPlatform.surfaces.length >= 1, 'primitive migration projection carries surface records');
  context.assert(preview.projection.appPlatform.events.length >= 1, 'primitive migration projection carries event records');
  context.assert(applyPlan.ok === true && applyPlan.status === 'apply-plan-ready', 'primitive migration apply plan is ready for compilable vNext draft');
  context.assert(applyPlan.automaticWrite === false && applyPlan.writePolicy === 'manual-apply-only', 'primitive migration apply plan never writes files automatically');
  context.assert(applyPlan.targetPath.endsWith('.vnext.rmt'), 'primitive migration apply plan suggests vNext target path');
  context.assert(applyPlan.authoringDraft === preview.authoringDraft, 'primitive migration apply plan reuses preview authoring draft');
  context.assert(applyPlan.compileStatus === 'compiled', 'primitive migration apply plan reports compile status');
  context.assert(parseBlockedApplyPlan.status === 'blocked' && parseBlockedApplyPlan.ok === false, 'primitive migration apply plan blocks non-compilable or unparsable drafts');
  context.assert(preview.domainMapping.state === 1 && preview.domainMapping.dataSources === 1, 'primitive migration reports source domain counts');
  context.assert(preview.domainMapping.actions === 2 && preview.domainMapping.surfaces === 1, 'primitive migration maps actions and surfaces');
  context.assert(APP_PLATFORM_PRIMITIVE_DOMAINS.includes('surfaces') && APP_PLATFORM_PRIMITIVE_DOMAINS.includes('resources'), 'primitive migration exports App-Platform primitive domains');
  context.assert(previewDiagnostics.includes(MIGRATION_LEGACY_BACKGROUNDED_CODE), 'primitive migration reports legacy backgrounding');
  context.assert(preview.errorCount === 0, 'primitive migration preview has no hard errors');
  context.assert(reportOnly.ok === true && reportOnly.status === 'report-only' && reportOnly.migrationMode === 'report-only', 'App-Platform report-only mode stays compatible');
  context.assert(reportOnly.authoringDraft === null, 'App-Platform report-only mode does not rewrite source');
  context.assert(reportDiagnostics.includes(MIGRATION_OPT_IN_REQUIRED_CODE), 'App-Platform report-only mode requires explicit preview opt-in');
  context.assert(reportDiagnostics.includes(MIGRATION_PRIMITIVE_PREVIEW_AVAILABLE_CODE), 'App-Platform report-only mode advertises primitive preview availability');
  context.assert(previewReport.schema === RMT_VNEXT_MIGRATION_REPORT_SCHEMA, 'App-Platform preview integrates with generic migration report schema');
  context.assert(previewReport.workpackage === RMT_VNEXT_PRIMITIVE_MIGRATION_WORKPACKAGE, 'App-Platform preview report declares PRIM-08 ownership');
  context.assert(previewReport.status === 'preview-ready', 'App-Platform preview report exposes preview-ready status');
  context.assert(previewReport.primitiveMigration && previewReport.primitiveMigration.schema === RMT_VNEXT_PRIMITIVE_MIGRATION_SCHEMA, 'App-Platform preview report embeds primitive migration contract');
  context.assert(previewReport.authoringDraft === preview.authoringDraft, 'App-Platform preview report reuses primitive authoring draft');
  context.assert(applyPlanReport.status === 'apply-plan-ready', 'App-Platform apply-plan report exposes apply-plan-ready status');
  context.assert(applyPlanReport.primitiveMigrationApplyPlan && applyPlanReport.primitiveMigrationApplyPlan.schema === RMT_VNEXT_PRIMITIVE_MIGRATION_APPLY_PLAN_SCHEMA, 'App-Platform apply-plan report embeds migration apply plan');
  context.assert(previewReportDiagnostics.includes(MIGRATION_LEGACY_BACKGROUNDED_CODE), 'App-Platform preview report carries legacy backgrounding diagnostic');
  context.assert(primitiveMatrix.ok === true && primitiveMatrix.entryCount === 2, 'compatibility matrix accepts App-Platform primitive preview and vNext fixture');
  context.assert(appPlatformEntry && appPlatformEntry.report.primitiveMigration && appPlatformEntry.report.primitiveMigration.schema === RMT_VNEXT_PRIMITIVE_MIGRATION_SCHEMA, 'compatibility matrix includes App-Platform primitive migration entry');
}

function runMatrixChecks(context, rootDir) {
  const compatibleInputs = [
    VALID_LEGACY_FIXTURE,
    LEGACY_FALLBACK_FIXTURE,
    LARGE_LEGACY_FIXTURE,
    VALID_VNEXT_FIXTURE
  ].map((relativePath) => fixtureInput(relativePath, rootDir));
  const matrix = createCompatibilityMatrix(compatibleInputs, {
    rootDir
  });
  const blockedMatrix = createCompatibilityMatrix(compatibleInputs.concat(fixtureInput(BROKEN_LEGACY_FIXTURE, rootDir)), {
    rootDir,
    migrationMode: 'preview'
  });

  context.assert(matrix.schema === RMT_VNEXT_COMPATIBILITY_SCHEMA, 'compatibility matrix uses schema');
  context.assert(matrix.reportSchema === RMT_VNEXT_COMPATIBILITY_REPORT_SCHEMA, 'compatibility matrix declares report schema');
  context.assert(matrix.ok === true && matrix.status === 'ready', 'legacy regression, fallback and vNext fixtures are compatible');
  context.assert(matrix.entryCount === 4 && matrix.compatibleCount === 4 && matrix.blockedCount === 0, 'compatibility matrix counts compatible fixtures');
  context.assert(blockedMatrix.ok === false && blockedMatrix.blockedCount === 1, 'compatibility matrix isolates incompatible fixtures');
}

function runAdapterChecks(context, rootDir) {
  const adapter = createRmtVNextCompatibilityAdapter({
    readFile: (relativePath) => readText(relativePath, rootDir)
  });
  const matrix = adapter.createCompatibilityMatrix([
    VALID_LEGACY_FIXTURE,
    VALID_VNEXT_FIXTURE
  ]);
  const serializedA = serializeMigrationReport(matrix.entries[0].report);
  const serializedB = serializeMigrationReport(matrix.entries[0].report);

  context.assert(adapter.schema === RMT_VNEXT_COMPATIBILITY_SCHEMA, 'adapter exposes compatibility schema');
  context.assert(typeof adapter.createAppPlatformPrimitiveMigrationPreview === 'function', 'adapter exposes App-Platform primitive migration preview');
  context.assert(typeof adapter.createAppPlatformPrimitiveMigrationApplyPlan === 'function', 'adapter exposes App-Platform primitive migration apply plan');
  context.assert(matrix.ok === true && matrix.entryCount === 2, 'adapter builds compatibility matrix with default file reader');
  context.assert(serializedA === serializedB && serializedA.includes(RMT_VNEXT_MIGRATION_REPORT_SCHEMA), 'migration reports serialize deterministically for agents');
}

function runRmtVNextCompatibilitySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-compatibility',
    label: 'Epic 15 RMT vNext Compatibility and Migration'
  });
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_COMPATIBILITY_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_COMPATIBILITY_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_COMPATIBILITY_MODULE_PATH, rootDir, 'vNext compatibility module exists');
  assertFileExists(context, RMT_VNEXT_COMPATIBILITY_SUITE_PATH, rootDir, 'vNext compatibility suite exists');
  assertFileExists(context, COMPATIBILITY_CONTRACT_PATH, rootDir, 'vNext compatibility contract document exists');
  assertFileExists(context, WP_E15_16_PATH, rootDir, 'WP-E15-16 workpackage document exists');
  assertFileExists(context, VALID_LEGACY_FIXTURE, rootDir, 'legacy regression fixture exists');
  assertFileExists(context, LEGACY_FALLBACK_FIXTURE, rootDir, 'legacy fallback fixture exists');
  assertFileExists(context, LARGE_LEGACY_FIXTURE, rootDir, 'large legacy regression fixture exists');
  assertFileExists(context, VALID_VNEXT_FIXTURE, rootDir, 'vNext fixture exists');
  assertFileExists(context, APP_PLATFORM_FIXTURE, rootDir, 'App-Platform primitive fixture exists');
  assertFileExists(context, APP_PLATFORM_LEGACY_CORE_FIXTURE, rootDir, 'App-Platform legacy core parity fixture exists');
  PUBLIC_MIGRATION_DOC_PATHS.forEach((docPath) => {
    assertFileExists(context, docPath, rootDir, `${docPath} exists`);
  });
  context.assert(moduleSyntax.ok, `vNext compatibility module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext compatibility suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  runMetadataChecks(context, rootDir);
  runLegacyAllowlistChecks(context, rootDir);
  runRoundtripChecks(context, rootDir);
  runMigrationChecks(context, rootDir);
  runPrimitiveMigrationChecks(context, rootDir);
  runMatrixChecks(context, rootDir);
  runAdapterChecks(context, rootDir);

  return context.result({
    schema: RMT_VNEXT_COMPATIBILITY_REPORT_SCHEMA,
    compatibilitySchema: RMT_VNEXT_COMPATIBILITY_SCHEMA,
    migrationReportSchema: RMT_VNEXT_MIGRATION_REPORT_SCHEMA,
    roundtripReportSchema: RMT_VNEXT_ROUNDTRIP_REPORT_SCHEMA,
    projectionSchema: RMT_VNEXT_LEGACY_PROJECTION_SCHEMA,
    workpackage: RMT_VNEXT_COMPATIBILITY_WORKPACKAGE,
    module: RMT_VNEXT_COMPATIBILITY_MODULE_PATH,
    suite: RMT_VNEXT_COMPATIBILITY_SUITE_PATH
  });
}

function printRmtVNextCompatibilityReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 15 RMT vNext Compatibility und Migration erfolgreich.',
    failureTitle: 'Epic 15 RMT vNext Compatibility und Migration fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextCompatibilityReport,
  runRmtVNextCompatibilitySuite
};
