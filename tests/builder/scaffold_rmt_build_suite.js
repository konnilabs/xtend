const fs = require('fs');
const os = require('os');
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
  syntaxCheckFile
} = require('../utils/process');
const {
  DEFAULT_OWNERSHIP_PATH
} = require('../../xtend-builder/writing/write-plan');
const {
  RMT_APP_BROWSER_SMOKE_SCHEMA,
  RMT_APP_BUILD_REPORT_SCHEMA,
  RMT_APP_BUILD_SCHEMA,
  createRmtAppBuild
} = require('../../xtend-builder/generators/rmt-build');

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-scaffold-rmt-build-'));
}

function tempPath(rootDir, relativePath) {
  return path.join(rootDir, relativePath);
}

function writeTempText(rootDir, relativePath, content) {
  const targetPath = tempPath(rootDir, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, 'utf8');
}

function writeTempJson(rootDir, relativePath, content) {
  writeTempText(rootDir, relativePath, `${JSON.stringify(content, null, 2)}\n`);
}

function readTempText(rootDir, relativePath) {
  return fs.readFileSync(tempPath(rootDir, relativePath), 'utf8');
}

function readTempJson(rootDir, relativePath) {
  return JSON.parse(readTempText(rootDir, relativePath));
}

function assertTempFileExists(context, rootDir, relativePath, message) {
  context.assert(fs.existsSync(tempPath(rootDir, relativePath)), message);
}

function outputFor(build, id) {
  return build.outputs.find((output) => output.id === id) || null;
}

function runScaffoldRmtBuildSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'scaffold-rmt-build',
    label: 'XTend Scaffold RMT Build'
  });
  const buildRoot = tempRoot();
  const invalidRoot = tempRoot();
  const sourcePath = 'xtendrmt/rmt-build-demo.rmt';
  const source = readText('xtendrmt/rmt-lifecycle-demo.rmt', rootDir);

  writeTempText(buildRoot, sourcePath, source);
  writeTempJson(buildRoot, 'components/manifest.json', {
    'x-alpha': './xalpha.js'
  });
  writeTempText(invalidRoot, 'xtendrmt/invalid.rmt', 'template {\n');

  [
    'xtend-builder/generators/rmt-build.js',
    'xtend-builder/generators/registry.js',
    'xtend-builder/lib/cli.js',
    'tests/builder/scaffold_rmt_build_suite.js'
  ].forEach((relativePath) => {
    const syntax = syntaxCheckFile(relativePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${relativePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  const generatorSource = readText('xtend-builder/generators/rmt-build.js', rootDir);
  const registrySource = readText('xtend-builder/generators/registry.js', rootDir);
  const cliSource = readText('xtend-builder/lib/cli.js', rootDir);
  const configSource = readText('xtend-builder/scaffold.config.js', rootDir);
  const readme = readText('xtend-builder/README.md', rootDir);
  const epic = readText('development/EPIC-17-XTend-Scaffold-Produktive-Builds-und-Dateischreibpfade.md', rootDir);
  const workpackage = readText('development/WP-E17-04-RMT-vNext-App-Build-Pipeline-und-1-0-Gate.md', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);

  context.assert(generatorSource.includes(RMT_APP_BUILD_SCHEMA), 'RMT build generator exposes app build schema');
  context.assert(generatorSource.includes('compileRmtVNextSource'), 'RMT build generator compiles vNext source');
  context.assert(generatorSource.includes('writeScaffoldFiles'), 'RMT build generator uses central writer');
  context.assert(generatorSource.includes('createManifestPatchEntry'), 'RMT build generator uses structured manifest patcher');
  context.assert(registrySource.includes("id: 'rmt-build'"), 'Generator registry exposes rmt-build');
  context.assert(cliSource.includes("command === 'rmt-build'"), 'CLI exposes rmt-build command');
  context.assert(configSource.includes('rmtAppBuild'), 'Scaffold config declares RMT app build contract');
  context.assert(readme.includes('rmt-build --source'), 'Scaffold README documents rmt-build command');
  context.assert(epic.includes('WP-E17-04'), 'Epic 17 tracks WP-E17-04');
  context.assert(workpackage.includes(RMT_APP_BUILD_SCHEMA), 'WP-E17-04 document declares RMT app build contract');
  context.assert(packageManifest.scripts['build:rmt'] === 'node xtend-builder/scaffold.js rmt-build --source xtendrmt/rmt-lifecycle-demo.rmt --write --json', 'Package exposes generic RMT build script');
  context.assert(packageManifest.scripts['test:scaffold-rmt-build'] === 'node scripts/run_xtend_tests.js scaffold-rmt-build', 'Package exposes scaffold RMT build test script');
  context.assert(runner.includes("id: 'scaffold-rmt-build'"), 'XTend test runner registers scaffold-rmt-build gate');

  const dryRun = createRmtAppBuild({
    source: sourcePath,
    rootDir: buildRoot
  });
  context.assert(dryRun.ok, 'rmt-build dry-run succeeds');
  context.assert(dryRun.schema === RMT_APP_BUILD_SCHEMA, 'rmt-build dry-run uses app build schema');
  context.assert(dryRun.status === 'planned', 'rmt-build dry-run stays non-writing');
  context.assert(dryRun.writePlan.schema === 'xtend.scaffold.write-plan.v1', 'rmt-build dry-run embeds WritePlan');
  context.assert(dryRun.writePlan.operationCount === 7, 'rmt-build plans core, manifest, component, app, host, smoke and report');
  context.assert(dryRun.patches[0].decision === 'insert-entry', 'rmt-build dry-run reports manifest insert');
  context.assert(outputFor(dryRun, 'core').path === 'xtendrmt/rmt-build-demo.rmt-build.core.json', 'rmt-build derives core output path');
  context.assert(outputFor(dryRun, 'generated-app').path === 'xtendrmt/rmt-build-demo.rmt-build.app.js', 'rmt-build derives app output path');
  context.assert(!fs.existsSync(tempPath(buildRoot, dryRun.coreOutput)), 'rmt-build dry-run does not write core output');

  const firstWrite = createRmtAppBuild({
    source: sourcePath,
    rootDir: buildRoot,
    write: true
  });
  context.assert(firstWrite.ok, 'rmt-build --write succeeds');
  context.assert(firstWrite.status === 'written', 'rmt-build --write reports written');
  context.assert(firstWrite.report.schema === RMT_APP_BUILD_REPORT_SCHEMA, 'rmt-build writes build report schema');
  context.assert(firstWrite.browserSmokeSchema === RMT_APP_BROWSER_SMOKE_SCHEMA, 'rmt-build reports browser smoke schema');
  context.assert(firstWrite.componentTag === 'x-rmt-build-demo-build', 'rmt-build derives deterministic component tag');
  context.assert(firstWrite.counts.templates === 1, 'rmt-build compiles template count');
  context.assert(firstWrite.counts.surfaces >= 4, 'rmt-build compiles surfaces');
  context.assert(firstWrite.written.some((entry) => entry.path === 'components/manifest.json' && entry.action === 'patch'), 'rmt-build writes manifest through patch action');

  firstWrite.outputs.forEach((output) => {
    assertTempFileExists(context, buildRoot, output.path, `${output.path} was written`);
  });

  const core = readTempJson(buildRoot, firstWrite.coreOutput);
  const manifest = readTempJson(buildRoot, 'components/manifest.json');
  const report = readTempJson(buildRoot, firstWrite.report.generated.report);
  const app = readTempText(buildRoot, firstWrite.report.generated.app);
  const host = readTempText(buildRoot, firstWrite.report.generated.host);
  const smoke = readTempText(buildRoot, firstWrite.report.generated.browserSmoke);
  const ownership = readTempJson(buildRoot, DEFAULT_OWNERSHIP_PATH);

  context.assert(core.schema === 'xtend.rmt.core-format.vnext.v1', 'rmt-build writes vNext Core JSON');
  context.assert(core.manifest.sourceSyntax === 'rmt-vnext', 'rmt-build core records vNext syntax');
  context.assert(manifest['x-alpha'] === './xalpha.js', 'rmt-build manifest patch preserves existing entry');
  context.assert(manifest['x-rmt-build-demo-build'] === './x-rmt-build-demo-build.js', 'rmt-build manifest patch inserts generated component');
  context.assert(report.generated.app === 'xtendrmt/rmt-build-demo.rmt-build.app.js', 'rmt-build report points at app module');
  context.assert(report.manifestPatch.schema === 'xtend.scaffold.manifest-patcher.v1', 'rmt-build report links manifest patcher');
  context.assert(report.localGate === 'node scripts/run_xtend_tests.js scaffold-rmt-build --json', 'rmt-build report records local gate');
  context.assert(app.includes("import '../components/x-rmt-build-demo-build.js'"), 'rmt-build app imports generated component');
  context.assert(app.includes('bootRmtBuildApp'), 'rmt-build app exports boot function');
  context.assert(host.includes("import('./xtendrmt/rmt-build-demo.rmt-build.app.js')"), 'rmt-build host imports generated app');
  context.assert(host.includes('data-manifest="components/manifest.json"'), 'rmt-build host uses local manifest');
  context.assert(smoke.includes(RMT_APP_BROWSER_SMOKE_SCHEMA), 'rmt-build browser smoke exposes schema');
  context.assert(smoke.includes('/xtendrmt/rmt-build-demo.rmt-build.app.js'), 'rmt-build browser smoke imports app');
  context.assert(smoke.includes('rmt build local http assets only'), 'rmt-build browser smoke checks local assets');
  context.assert(ownership.files['components/manifest.json'].kind === 'manifest-json', 'Ownership sidecar records manifest patch');
  context.assert(ownership.files['components/x-rmt-build-demo-build.js'].kind === 'xtend-custom-element', 'Ownership sidecar records generated component');
  context.assert(ownership.files[firstWrite.report.generated.report].kind === 'scaffold-rmt-app-build-report', 'Ownership sidecar records RMT build report');

  const repeatWrite = createRmtAppBuild({
    source: sourcePath,
    rootDir: buildRoot,
    write: true
  });
  context.assert(repeatWrite.ok, 'Repeated rmt-build --write succeeds');
  context.assert(repeatWrite.writePlan.changedCount === 0, 'Repeated rmt-build write is idempotent');
  context.assert(repeatWrite.written.every((entry) => entry.action === 'skip' && entry.changed === false), 'Repeated rmt-build write skips unchanged files');

  const currentCheck = createRmtAppBuild({
    source: sourcePath,
    rootDir: buildRoot,
    check: true
  });
  context.assert(currentCheck.ok, 'rmt-build --check passes for current generated app');
  context.assert(currentCheck.status === 'current', 'rmt-build --check reports current');

  const invalidBuild = createRmtAppBuild({
    source: 'xtendrmt/invalid.rmt',
    rootDir: invalidRoot,
    write: true
  });
  context.assert(!invalidBuild.ok, 'Invalid RMT vNext source blocks rmt-build');
  context.assert(invalidBuild.status === 'compile_failed', 'Invalid RMT source reports compile failure');
  context.assert(invalidBuild.outputs.length === 0, 'Invalid RMT source produces no write outputs');

  return context.result({
    report: {
      schema: 'xtend.scaffold.rmt-build-suite-report.v1',
      buildRoot,
      invalidRoot,
      source: sourcePath,
      outputCount: firstWrite.outputs.length,
      buildReport: firstWrite.report.generated.report
    }
  });
}

function printScaffoldRmtBuildReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Scaffold RMT Build erfolgreich.',
    failureTitle: 'XTend Scaffold RMT Build fehlgeschlagen:'
  });
}

module.exports = {
  printScaffoldRmtBuildReport,
  runScaffoldRmtBuildSuite
};
