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
  SCAFFOLD_BUILD_REPORT_SCHEMA,
  SCAFFOLD_MANIFEST_PATCHER_SCHEMA,
  SCAFFOLD_PATCHERS_SCHEMA
} = require('../../xtend-builder/writing/manifest-patcher');
const {
  createComponentFiles
} = require('../../xtend-builder/generators/component-files');

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-scaffold-manifest-patch-'));
}

function tempPath(rootDir, relativePath) {
  return path.join(rootDir, relativePath);
}

function readTempText(rootDir, relativePath) {
  return fs.readFileSync(tempPath(rootDir, relativePath), 'utf8');
}

function readTempJson(rootDir, relativePath) {
  return JSON.parse(readTempText(rootDir, relativePath));
}

function writeTempText(rootDir, relativePath, content) {
  const targetPath = tempPath(rootDir, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, 'utf8');
}

function writeTempJson(rootDir, relativePath, content) {
  writeTempText(rootDir, relativePath, `${JSON.stringify(content, null, 2)}\n`);
}

function keysAreSorted(value) {
  const keys = Object.keys(value);
  return keys.join('\n') === keys.slice().sort().join('\n');
}

function runScaffoldManifestPatchSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'scaffold-manifest-patch',
    label: 'XTend Scaffold Manifest Patch'
  });
  const patchRoot = tempRoot();
  const updateRoot = tempRoot();
  const invalidRoot = tempRoot();

  [
    'xtend-builder/writing/manifest-patcher.js',
    'xtend-builder/writing/write-plan.js',
    'xtend-builder/generators/component-files.js',
    'tests/builder/scaffold_manifest_patch_suite.js'
  ].forEach((relativePath) => {
    const syntax = syntaxCheckFile(relativePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${relativePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  const manifestPatcherSource = readText('xtend-builder/writing/manifest-patcher.js', rootDir);
  const writerSource = readText('xtend-builder/writing/write-plan.js', rootDir);
  const componentFilesSource = readText('xtend-builder/generators/component-files.js', rootDir);
  const epic = readText('development/EPIC-17-XTend-Scaffold-Produktive-Builds-und-Dateischreibpfade.md', rootDir);
  const workpackage = readText('development/WP-E17-03-Manifest-Registry-und-Build-Report-Patcher.md', rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);

  context.assert(manifestPatcherSource.includes(SCAFFOLD_PATCHERS_SCHEMA), 'Manifest patcher exposes patcher umbrella schema');
  context.assert(manifestPatcherSource.includes(SCAFFOLD_MANIFEST_PATCHER_SCHEMA), 'Manifest patcher exposes manifest patch schema');
  context.assert(manifestPatcherSource.includes(SCAFFOLD_BUILD_REPORT_SCHEMA), 'Manifest patcher exposes build report schema');
  context.assert(writerSource.includes('structured-patch-existing-target'), 'WritePlan accepts structured patch operations explicitly');
  context.assert(componentFilesSource.includes('createManifestPatchEntry'), 'component-files creates manifest patch entry');
  context.assert(componentFilesSource.includes('createComponentBuildReportEntry'), 'component-files creates build report entry');
  context.assert(epic.includes('WP-E17-03'), 'Epic 17 tracks WP-E17-03');
  context.assert(workpackage.includes(SCAFFOLD_MANIFEST_PATCHER_SCHEMA), 'WP-E17-03 document declares manifest patch contract');
  context.assert(packageManifest.scripts['test:scaffold-manifest-patch'] === 'node scripts/run_xtend_tests.js scaffold-manifest-patch', 'Package exposes scaffold manifest patch script');
  context.assert(runner.hasSuite("scaffold-manifest-patch"), 'XTend test runner registers scaffold-manifest-patch gate');

  writeTempJson(patchRoot, 'components/manifest.json', {
    'x-alpha': './xalpha.js',
    'x-zeta': './xzeta.js'
  });
  const dryRun = createComponentFiles({
    tag: 'x-manifest-demo',
    profile: 'display',
    feature: 'state',
    rootDir: patchRoot
  });
  const dryManifestArtifact = dryRun.files.find((file) => file.id === 'manifest');
  context.assert(dryRun.ok, 'component-files dry-run prepares manifest patch');
  context.assert(dryRun.patches[0].decision === 'insert-entry', 'Dry-run reports manifest insert decision');
  context.assert(dryManifestArtifact.content.includes('xtend.scaffold.manifest-patch-plan.v1'), 'Dry-run keeps reviewable manifest patch-plan artifact');
  context.assert(!fs.existsSync(tempPath(patchRoot, dryRun.buildReportPath)), 'Dry-run does not write build report');

  const firstWrite = createComponentFiles({
    tag: 'x-manifest-demo',
    profile: 'display',
    feature: 'state',
    rootDir: patchRoot,
    write: true
  });
  context.assert(firstWrite.ok, 'component-files --write applies manifest patch');
  context.assert(firstWrite.patches[0].schema === SCAFFOLD_MANIFEST_PATCHER_SCHEMA, 'Write result reports manifest patch schema');
  context.assert(firstWrite.patches[0].source === './x-manifest-demo.js', 'Manifest source is normalized relative to components manifest');
  context.assert(firstWrite.written.some((entry) => entry.path === 'components/manifest.json' && entry.action === 'patch'), 'Manifest write is reported as structured patch');

  const manifest = readTempJson(patchRoot, 'components/manifest.json');
  context.assert(manifest['x-alpha'] === './xalpha.js', 'Manifest patch preserves existing entries');
  context.assert(manifest['x-zeta'] === './xzeta.js', 'Manifest patch preserves later existing entries');
  context.assert(manifest['x-manifest-demo'] === './x-manifest-demo.js', 'Manifest patch inserts component entry');
  context.assert(manifest.schema !== 'xtend.scaffold.manifest-patch-plan.v1', 'Manifest file is not overwritten by patch-plan content');
  context.assert(keysAreSorted(manifest), 'Manifest entries are sorted deterministically');

  const buildReportText = readTempText(patchRoot, firstWrite.buildReportPath);
  const buildReport = JSON.parse(buildReportText);
  context.assert(buildReport.schema === SCAFFOLD_BUILD_REPORT_SCHEMA, 'Build report is written as stable JSON artifact');
  context.assert(buildReport.patches[0].targetPath === 'components/manifest.json', 'Build report links manifest patch target');
  context.assert(buildReport.localGates.includes('node scripts/run_xtend_tests.js scaffold-manifest-patch --json'), 'Build report records local manifest gate');

  const ownership = readTempJson(patchRoot, DEFAULT_OWNERSHIP_PATH);
  context.assert(ownership.files['components/manifest.json'].kind === 'manifest-json', 'Ownership sidecar records manifest patch ownership');
  context.assert(ownership.files[firstWrite.buildReportPath].kind === 'scaffold-build-report', 'Ownership sidecar records build report ownership');

  const repeatWrite = createComponentFiles({
    tag: 'x-manifest-demo',
    profile: 'display',
    feature: 'state',
    rootDir: patchRoot,
    write: true
  });
  context.assert(repeatWrite.ok, 'Repeated manifest write succeeds');
  context.assert(repeatWrite.patches[0].decision === 'already-current', 'Repeated manifest write reports current patch');
  context.assert(repeatWrite.writePlan.changedCount === 0, 'Repeated manifest write is idempotent');
  context.assert(readTempText(patchRoot, repeatWrite.buildReportPath) === buildReportText, 'Repeated manifest write keeps build report stable');

  const checkCurrent = createComponentFiles({
    tag: 'x-manifest-demo',
    profile: 'display',
    feature: 'state',
    rootDir: patchRoot,
    check: true
  });
  context.assert(checkCurrent.ok, 'component-files --check passes for patched manifest and build report');
  context.assert(checkCurrent.status === 'current', 'Manifest patch check reports current');

  writeTempJson(updateRoot, 'components/manifest.json', {
    'x-legacy': './legacy.js',
    'x-manifest-demo': './old-manifest-demo.js'
  });
  const updateWrite = createComponentFiles({
    tag: 'x-manifest-demo',
    profile: 'display',
    feature: 'state',
    rootDir: updateRoot,
    write: true
  });
  const updatedManifest = readTempJson(updateRoot, 'components/manifest.json');
  context.assert(updateWrite.ok, 'Manifest patch updates existing tag source deterministically');
  context.assert(updateWrite.patches[0].decision === 'update-existing-entry', 'Existing manifest source update is reported');
  context.assert(updateWrite.patches[0].diagnostics.some((diagnostic) => diagnostic.code === 'manifest-entry-source-update'), 'Existing manifest source update is diagnosed');
  context.assert(updatedManifest['x-legacy'] === './legacy.js', 'Manifest update preserves unrelated existing entry');
  context.assert(updatedManifest['x-manifest-demo'] === './x-manifest-demo.js', 'Manifest update writes normalized component source');

  writeTempText(invalidRoot, 'components/manifest.json', '{ invalid json\n');
  const invalidWrite = createComponentFiles({
    tag: 'x-invalid-manifest',
    profile: 'display',
    feature: 'state',
    rootDir: invalidRoot,
    write: true
  });
  context.assert(!invalidWrite.ok, 'Invalid manifest JSON blocks component write');
  context.assert(invalidWrite.errors.some((error) => error.includes('Failed to parse manifest')), 'Invalid manifest produces parse diagnostic');
  context.assert(readTempText(invalidRoot, 'components/manifest.json') === '{ invalid json\n', 'Invalid manifest remains unchanged');

  return context.result({
    report: {
      schema: 'xtend.scaffold.manifest-patch-suite-report.v1',
      patchRoot,
      updateRoot,
      invalidRoot,
      manifestPath: 'components/manifest.json',
      buildReportPath: firstWrite.buildReportPath
    }
  });
}

function printScaffoldManifestPatchReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Scaffold Manifest Patch erfolgreich.',
    failureTitle: 'XTend Scaffold Manifest Patch fehlgeschlagen:'
  });
}

module.exports = {
  printScaffoldManifestPatchReport,
  runScaffoldManifestPatchSuite
};
