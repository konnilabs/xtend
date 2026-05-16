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
  DEFAULT_OWNERSHIP_PATH,
  SCAFFOLD_GENERATED_OWNERSHIP_SCHEMA
} = require('../../xtend-builder/writing/write-plan');
const {
  createComponentFiles
} = require('../../xtend-builder/generators/component-files');

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-scaffold-component-write-'));
}

function tempPath(rootDir, relativePath) {
  return path.join(rootDir, relativePath);
}

function readTempText(rootDir, relativePath) {
  return fs.readFileSync(tempPath(rootDir, relativePath), 'utf8');
}

function writeTempText(rootDir, relativePath, content) {
  const targetPath = tempPath(rootDir, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, 'utf8');
}

function assertTempFileExists(context, rootDir, relativePath, message) {
  context.assert(fs.existsSync(tempPath(rootDir, relativePath)), message);
}

function runScaffoldComponentWriteSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'scaffold-component-write',
    label: 'XTend Scaffold Component Write'
  });
  const componentRoot = tempRoot();
  const conflictRoot = tempRoot();

  [
    'xtend-builder/writing/write-plan.js',
    'xtend-builder/writing/manifest-patcher.js',
    'xtend-builder/generators/component-files.js',
    'tests/builder/scaffold_component_write_suite.js'
  ].forEach((relativePath) => {
    const syntax = syntaxCheckFile(relativePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${relativePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  const writerSource = readText('xtend-builder/writing/write-plan.js', rootDir);
  const manifestPatcherSource = readText('xtend-builder/writing/manifest-patcher.js', rootDir);
  const componentFilesSource = readText('xtend-builder/generators/component-files.js', rootDir);
  const cliSource = readText('xtend-builder/lib/cli.js', rootDir);
  const epic = readText('development/EPIC-17-XTend-Scaffold-Produktive-Builds-und-Dateischreibpfade.md', rootDir);
  const workpackage = readText('development/WP-E17-02-Ownership-Konfliktmodell-und-component-files-write.md', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);

  context.assert(writerSource.includes(SCAFFOLD_GENERATED_OWNERSHIP_SCHEMA), 'Writer exposes generated ownership schema');
  context.assert(writerSource.includes('owned-file-drift'), 'Writer diagnoses generated file drift');
  context.assert(writerSource.includes('unowned-existing-target'), 'Writer diagnoses unowned existing targets');
  context.assert(writerSource.includes('force-update'), 'Writer supports force-update action');
  context.assert(manifestPatcherSource.includes('xtend.scaffold.manifest-patcher.v1'), 'Manifest patcher exposes stable schema');
  context.assert(componentFilesSource.includes("require('../writing/write-plan')"), 'component-files uses central writer');
  context.assert(componentFilesSource.includes("require('../writing/manifest-patcher')"), 'component-files uses Manifest patcher');
  context.assert(componentFilesSource.includes('writeScaffoldFiles(writeEntries'), 'component-files delegates writes through WritePlan');
  context.assert(cliSource.includes('component-files'), 'CLI exposes component-files command');
  context.assert(epic.includes('WP-E17-02'), 'Epic 17 tracks WP-E17-02');
  context.assert(workpackage.includes(SCAFFOLD_GENERATED_OWNERSHIP_SCHEMA), 'WP-E17-02 document declares ownership contract');
  context.assert(packageManifest.scripts['test:scaffold-component-write'] === 'node scripts/run_xtend_tests.js scaffold-component-write', 'Package exposes scaffold component write script');
  context.assert(runner.includes("id: 'scaffold-component-write'"), 'XTend test runner registers scaffold-component-write gate');

  const firstWrite = createComponentFiles({
    tag: 'x-owned-demo',
    profile: 'display',
    feature: 'state',
    rootDir: componentRoot,
    write: true
  });
  context.assert(firstWrite.ok, 'component-files --write succeeds in temp workspace');
  context.assert(firstWrite.mode === 'write', 'component-files records write mode');
  context.assert(firstWrite.status === 'written', 'component-files reports written status');
  context.assert(firstWrite.files.length >= 13, 'component-files renders the full artifact set');
  context.assert(firstWrite.writePlan.schema === 'xtend.scaffold.write-plan.v1', 'component-files write embeds WritePlan');
  context.assert(firstWrite.writePlan.ownershipSchema === SCAFFOLD_GENERATED_OWNERSHIP_SCHEMA, 'component-files write embeds ownership schema');
  context.assert(firstWrite.writePlan.force === false, 'component-files write is not forced by default');
  context.assert(firstWrite.written.length === firstWrite.files.length + 1, 'component-files writes rendered files plus build report');
  context.assert(firstWrite.ownershipManifest && firstWrite.ownershipManifest.path === DEFAULT_OWNERSHIP_PATH, 'component-files writes ownership manifest');
  context.assert(firstWrite.patches[0].schema === 'xtend.scaffold.manifest-patcher.v1', 'component-files exposes manifest patch decision');
  context.assert(firstWrite.buildReport.schema === 'xtend.scaffold.build-report.v1', 'component-files exposes build report');

  firstWrite.files.forEach((file) => {
    assertTempFileExists(context, componentRoot, file.targetPath, `${file.targetPath} was written`);
  });
  assertTempFileExists(context, componentRoot, firstWrite.buildReportPath, 'Scaffold build report was written');

  const componentManifest = JSON.parse(readTempText(componentRoot, 'components/manifest.json'));
  context.assert(componentManifest['x-owned-demo'] === './x-owned-demo.js', 'Manifest patcher writes repo-local component source');
  context.assert(componentManifest.schema !== 'xtend.scaffold.manifest-patch-plan.v1', 'Manifest target is real manifest JSON, not a patch-plan file');

  const ownership = JSON.parse(readTempText(componentRoot, DEFAULT_OWNERSHIP_PATH));
  context.assert(ownership.schema === SCAFFOLD_GENERATED_OWNERSHIP_SCHEMA, 'Ownership sidecar uses stable schema');
  context.assert(ownership.files['components/x-owned-demo.js'].owner === 'component-files:x-owned-demo', 'Ownership sidecar records component owner');
  context.assert(ownership.files['components/x-owned-demo.js'].generator === 'component-files', 'Ownership sidecar records generator');
  context.assert(ownership.files['components/x-owned-demo.js'].templateId === 'component.source', 'Ownership sidecar records template id');
  context.assert(typeof ownership.files['components/x-owned-demo.js'].buildSha256 === 'string', 'Ownership sidecar records build hash');
  context.assert(ownership.files['components/manifest.json'].kind === 'manifest-json', 'Ownership sidecar records structured manifest patch');
  context.assert(ownership.files[firstWrite.buildReportPath].kind === 'scaffold-build-report', 'Ownership sidecar records build report');

  const repeatWrite = createComponentFiles({
    tag: 'x-owned-demo',
    profile: 'display',
    feature: 'state',
    rootDir: componentRoot,
    write: true
  });
  context.assert(repeatWrite.ok, 'Repeated component-files --write succeeds');
  context.assert(repeatWrite.writePlan.changedCount === 0, 'Repeated component write is idempotent');
  context.assert(repeatWrite.written.every((entry) => entry.action === 'skip' && entry.changed === false), 'Repeated component write skips unchanged files');
  context.assert(repeatWrite.ownershipManifest && repeatWrite.ownershipManifest.changed === false, 'Repeated component write keeps ownership manifest stable');

  const currentCheck = createComponentFiles({
    tag: 'x-owned-demo',
    profile: 'display',
    feature: 'state',
    rootDir: componentRoot,
    check: true
  });
  context.assert(currentCheck.ok, 'component-files --check passes for current generated files');
  context.assert(currentCheck.status === 'current', 'component-files --check reports current');

  writeTempText(componentRoot, 'components/x-owned-demo.js', `${readTempText(componentRoot, 'components/x-owned-demo.js')}\n// user edit\n`);
  const driftCheck = createComponentFiles({
    tag: 'x-owned-demo',
    profile: 'display',
    feature: 'state',
    rootDir: componentRoot,
    check: true
  });
  context.assert(!driftCheck.ok, 'component-files --check blocks generated file drift');
  context.assert(driftCheck.status === 'blocked', 'Generated drift is blocked before write');
  context.assert(driftCheck.errors.some((error) => error.includes('changed since the last Scaffold ownership record')), 'Generated drift produces ownership diagnostic');

  const forceWrite = createComponentFiles({
    tag: 'x-owned-demo',
    profile: 'display',
    feature: 'state',
    rootDir: componentRoot,
    write: true,
    force: true
  });
  context.assert(forceWrite.ok, 'component-files --write --force succeeds for intentional replacement');
  context.assert(forceWrite.writePlan.force === true, 'Force write records force mode');
  context.assert(forceWrite.written.some((entry) => entry.path === 'components/x-owned-demo.js' && entry.action === 'force-update'), 'Force write records force-update for drifted component');
  context.assert(!readTempText(componentRoot, 'components/x-owned-demo.js').includes('// user edit'), 'Force write restores generated component content');

  writeTempText(conflictRoot, 'components/x-user-owned.js', '// manually owned file\n');
  const unownedWrite = createComponentFiles({
    tag: 'x-user-owned',
    profile: 'display',
    feature: 'state',
    rootDir: conflictRoot,
    write: true
  });
  context.assert(!unownedWrite.ok, 'component-files --write refuses existing unowned files');
  context.assert(unownedWrite.status === 'blocked', 'Unowned target is blocked before write');
  context.assert(unownedWrite.errors.some((error) => error.includes('is not owned by Scaffold')), 'Unowned target produces conflict diagnostic');
  context.assert(readTempText(conflictRoot, 'components/x-user-owned.js') === '// manually owned file\n', 'Unowned file remains unchanged');

  return context.result({
    report: {
      schema: 'xtend.scaffold.component-write-suite-report.v1',
      componentRoot,
      conflictRoot,
      artifactCount: firstWrite.files.length,
      ownershipPath: DEFAULT_OWNERSHIP_PATH
    }
  });
}

function printScaffoldComponentWriteReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Scaffold Component Write erfolgreich.',
    failureTitle: 'XTend Scaffold Component Write fehlgeschlagen:'
  });
}

module.exports = {
  printScaffoldComponentWriteReport,
  runScaffoldComponentWriteSuite
};
