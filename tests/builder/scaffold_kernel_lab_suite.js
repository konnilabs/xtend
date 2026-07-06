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
  DASHBOARD_SYMBOLS,
  KERNEL_ANALYSIS_TARGETS,
  KERNEL_BUILD_TARGETS,
  MODULE_MANIFEST_PATH,
  RMT_KERNEL_LAB_ANALYSIS_SCHEMA,
  RMT_KERNEL_LAB_BUILD_SCHEMA,
  RMT_KERNEL_MODULE_MANIFEST_SCHEMA,
  cleanRmtKernelArtifactContent,
  createRmtKernelLabAnalysis,
  createRmtKernelLabBuild,
  findDeprecatedKernelBranding
} = require('../../xtend-builder/generators/rmt-kernel-lab');

const DEPRECATED_BRAND_NAME = ['Render', 'Man'].join('');
const DEPRECATED_FACTORY_PREFIX = `create${DEPRECATED_BRAND_NAME}`;

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-scaffold-kernel-lab-'));
}

function tempPath(rootDir, relativePath) {
  return path.join(rootDir, relativePath);
}

function copyTempFile(sourceRoot, targetRoot, relativePath) {
  const sourcePath = path.join(sourceRoot, relativePath);
  const targetPath = tempPath(targetRoot, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

function assertNoDashboardSymbols(context, source, label) {
  const matches = DASHBOARD_SYMBOLS.filter((symbol) => source.includes(symbol));
  context.assert(matches.length === 0, `${label} does not contain Dashboard kernel symbols${matches.length ? ` (${matches.join(', ')})` : ''}`);
}

function assertNoDeprecatedBranding(context, source, label) {
  const matches = findDeprecatedKernelBranding(source);
  context.assert(matches.length === 0, `${label} does not contain deprecated kernel branding`);
}

function deprecatedFactory(name) {
  return `${DEPRECATED_FACTORY_PREFIX}${name}`;
}

function runScaffoldKernelLabSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'scaffold-kernel-lab',
    label: 'XTend Scaffold RMT KernelLab'
  });

  [
    'xtend-builder/generators/rmt-kernel-lab.js',
    'xtend-builder/generators/registry.js',
    'xtend-builder/lib/cli.js',
    'tests/builder/scaffold_kernel_lab_suite.js'
  ].forEach((relativePath) => {
    const syntax = syntaxCheckFile(relativePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${relativePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  const generatorSource = readText('xtend-builder/generators/rmt-kernel-lab.js', rootDir);
  const registrySource = readText('xtend-builder/generators/registry.js', rootDir);
  const cliSource = readText('xtend-builder/lib/cli.js', rootDir);
  const readme = readText('xtend-builder/README.md', rootDir);
  const generatorsReadme = readText('xtend-builder/generators/README.md', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);

  context.assert(generatorSource.includes(RMT_KERNEL_LAB_ANALYSIS_SCHEMA), 'KernelLab generator exposes analysis schema');
  context.assert(generatorSource.includes(RMT_KERNEL_LAB_BUILD_SCHEMA), 'KernelLab generator exposes build schema');
  context.assert(generatorSource.includes(RMT_KERNEL_MODULE_MANIFEST_SCHEMA), 'KernelLab generator exposes module manifest schema');
  context.assert(generatorSource.includes('EXPECTED_HISTORICAL_MODULE_COUNT = 26'), 'KernelLab records historical module count expectation');
  context.assert(registrySource.includes("id: 'rmt-kernel-lab'"), 'Generator registry exposes rmt-kernel-lab');
  context.assert(cliSource.includes("command === 'kernel-lab'"), 'CLI exposes kernel-lab command');
  context.assert(cliSource.includes("subcommand === 'kernel-lab'"), 'RMT CLI exposes rmt kernel-lab alias');
  context.assert(readme.includes('kernel-lab analyze --json'), 'Scaffold README documents kernel-lab analyze');
  context.assert(generatorsReadme.includes('rmt-kernel-lab'), 'Generator README documents rmt-kernel-lab');
  context.assert(packageManifest.scripts['test:scaffold-kernel-lab'] === 'node scripts/run_xtend_tests.js scaffold-kernel-lab', 'Package exposes scaffold KernelLab test script');
  context.assert(runner.includes("id: 'scaffold-kernel-lab'"), 'XTend test runner registers scaffold-kernel-lab gate');

  const dirtyJs = [
    "    function createOptionalCompatSnapshot() {",
    "        return Object.freeze({",
    "            browserHostAdapter: typeof appModules.createRmtBrowserHostAdapter === 'function'",
    `                || typeof appModules.${deprecatedFactory('BrowserHostAdapter')} === 'function',`,
    "            dashboardAdapter: typeof appModules.createRmtDashboardAdapter === 'function'",
    `                || typeof appModules.${deprecatedFactory('DashboardAdapter')} === 'function',`,
    "            dashboardCompatBootstrap: typeof appModules.createRmtDashboardCompatBootstrap === 'function'",
    `                || typeof appModules.${deprecatedFactory('DashboardCompatBootstrap')} === 'function',`,
    "            dashboardCommandCatalog: typeof appModules.createRmtDashboardCommandCatalog === 'function'",
    `                || typeof appModules.${deprecatedFactory('DashboardCommandCatalog')} === 'function'`,
    "        });",
    "    }",
    "",
    "    appModules.createRmtDashboardProductRuntime = function createRmtDashboardProductRuntime(deps = {}) {",
    `        return deps.${deprecatedFactory('DashboardProductRuntime')}();`,
    "    };",
    "})(__XTENDRMT_GLOBAL__);"
  ].join('\n');
  const cleanedJs = cleanRmtKernelArtifactContent(dirtyJs, 'xtendrmt/rmt-core.esm.js');
  assertNoDashboardSymbols(context, cleanedJs, 'Clean JS transform');
  assertNoDeprecatedBranding(context, cleanedJs, 'Clean JS transform');

  const dirtyHeader = [
    '/*!',
    ' * XTendRMT 0.3.0',
    ' * build target: rmt-core.esm',
    ' * format: esm',
    ' * generated at: 2026-05-03T18:31:08.225Z',
    ' */',
    'const AppModules = {};'
  ].join('\n');
  const cleanedHeader = cleanRmtKernelArtifactContent(dirtyHeader, 'xtendrmt/rmt-core.esm.js');
  context.assert(!cleanedHeader.includes('generated at:'), 'Clean JS transform removes legacy generated timestamp');
  context.assert(cleanedHeader.includes('generated by: xtend kernel-lab build --profile clean'), 'Clean JS transform records KernelLab build provenance');
  const versionedHeader = cleanRmtKernelArtifactContent(dirtyHeader, 'xtendrmt/rmt-core.esm.js', { version: '0.4.0' });
  context.assert(versionedHeader.includes('XTendRMT 0.4.0'), 'Clean JS transform applies explicit KernelLab version to header');
  context.assert(versionedHeader.includes('generated by: xtend kernel-lab build --profile clean --version 0.4.0'), 'Clean JS transform records explicit KernelLab version provenance');

  const dirtyRuntimeVersion = [
    "const PUBLIC_API_VERSION = '0.3.0';",
    'const version = typeof AppModules.getRmtApiVersion === \'function\'',
    '    ? AppModules.getRmtApiVersion()',
    '    : "0.3.0";',
    'export { version, getRmtApiVersion };'
  ].join('\n');
  const cleanedRuntimeVersion = cleanRmtKernelArtifactContent(dirtyRuntimeVersion, 'xtendrmt/rmt-core.esm.js', { version: '0.4.0' });
  context.assert(cleanedRuntimeVersion.includes("const PUBLIC_API_VERSION = '0.4.0';"), 'Clean JS transform applies explicit KernelLab version to PUBLIC_API_VERSION');
  context.assert(cleanedRuntimeVersion.includes(': "0.4.0";'), 'Clean JS transform applies explicit KernelLab version to ESM fallback export');

  const dirtyTypes = [
    'export interface RmtOptionalCompatAvailability {',
    '    browserHostAdapter: boolean;',
    '    dashboardAdapter: boolean;',
    '    dashboardCompatBootstrap: boolean;',
    '    dashboardCommandCatalog: boolean;',
    '}'
  ].join('\n');
  assertNoDashboardSymbols(
    context,
    cleanRmtKernelArtifactContent(dirtyTypes, 'xtendrmt/rmt-core.d.ts'),
    'Clean d.ts transform'
  );
  const versionedTypes = cleanRmtKernelArtifactContent('// XTendRMT 0.3.0 type definitions\n', 'xtendrmt/rmt-core.d.ts', { version: '0.4.0' });
  context.assert(versionedTypes.includes('XTendRMT 0.4.0 type definitions'), 'Clean d.ts transform applies explicit KernelLab version');

  const dirtyManifest = JSON.stringify({
    entryPoints: {
      optionalCompat: {
        browserHostAdapter: 'createRmtBrowserHostAdapter',
        dashboardAdapter: 'createRmtDashboardAdapter',
        dashboardCompatBootstrap: 'createRmtDashboardCompatBootstrap',
        dashboardCommandCatalog: 'createRmtDashboardCommandCatalog'
      }
    },
    legacyCompatibility: {
      appModulesFactories: {
        browserHostAdapter: deprecatedFactory('BrowserHostAdapter'),
        dashboardAdapter: deprecatedFactory('DashboardAdapter'),
        dashboardCompatBootstrap: deprecatedFactory('DashboardCompatBootstrap'),
        dashboardCommandCatalog: deprecatedFactory('DashboardCommandCatalog')
      }
    }
  }, null, 2);
  assertNoDashboardSymbols(
    context,
    cleanRmtKernelArtifactContent(dirtyManifest, 'xtendrmt/rmt-manifest.json'),
    'Clean manifest transform'
  );
  assertNoDeprecatedBranding(
    context,
    cleanRmtKernelArtifactContent(dirtyManifest, 'xtendrmt/rmt-manifest.json'),
    'Clean manifest transform'
  );
  const versionedManifest = JSON.parse(cleanRmtKernelArtifactContent(dirtyManifest, 'xtendrmt/rmt-manifest.json', { version: '0.4.0' }));
  context.assert(versionedManifest.version === '0.4.0' && versionedManifest.apiVersion === '0.4.0', 'Clean manifest transform applies explicit KernelLab version');

  const analysis = createRmtKernelLabAnalysis({ rootDir });
  context.assert(analysis.ok, 'KernelLab analysis succeeds');
  context.assert(analysis.schema === RMT_KERNEL_LAB_ANALYSIS_SCHEMA, 'KernelLab analysis uses analysis schema');
  context.assert(analysis.moduleManifest.schema === RMT_KERNEL_MODULE_MANIFEST_SCHEMA, 'KernelLab analysis embeds module manifest schema');
  context.assert(analysis.expectedHistoricalModuleCount === 26, 'KernelLab analysis records historical module count');
  context.assert(analysis.visibleModuleCount >= 20, 'KernelLab analysis detects bundled module topology');
  context.assert(analysis.moduleCountMatchesHistory === false, 'KernelLab analysis reports current 25 vs 26 module reconciliation');
  context.assert(analysis.moduleManifest.modules.every((entry, index) => entry.order === index + 1), 'KernelLab manifest keeps stable module order');
  context.assert(analysis.moduleManifest.modules.every((entry) => entry.classification === 'keep'), 'KernelLab clean manifest classifies remaining modules as keep');
  context.assert(analysis.artifacts.filter((artifact) => artifact.kind !== 'module-manifest').every((artifact) => artifact.dashboardSymbols.length === 0), 'KernelLab analysis sees clean standard artifacts');
  context.assert(analysis.artifacts.every((artifact) => artifact.deprecatedBrandingCount === 0), 'KernelLab analysis sees deprecated-branding-free artifacts');

  const dryRun = createRmtKernelLabBuild({ rootDir, profile: 'clean' });
  context.assert(dryRun.ok, 'KernelLab clean build dry-run succeeds');
  context.assert(dryRun.schema === RMT_KERNEL_LAB_BUILD_SCHEMA, 'KernelLab build uses build schema');
  context.assert(dryRun.kernelVersion === readJson('xtendrmt/rmt-manifest.json', rootDir).version, 'KernelLab build infers version from product manifest by default');
  context.assert(dryRun.versionSource === 'manifest', 'KernelLab build reports manifest as default version source');
  context.assert(dryRun.status === 'planned', 'KernelLab dry-run reports planned status');
  context.assert(dryRun.outputs.length === 6, 'KernelLab build covers runtime artifacts, types, manifest and module manifest');
  context.assert(dryRun.moduleManifest.sourceArtifacts.every((artifact) => artifact.dashboardSymbols.length === 0), 'KernelLab build outputs remain Dashboard-free');
  context.assert(dryRun.moduleManifest.sourceArtifacts.every((artifact) => artifact.deprecatedBrandingCount === 0), 'KernelLab build outputs remain deprecated-branding-free');

  const invalidVersion = createRmtKernelLabBuild({ rootDir, profile: 'clean', version: 'next' });
  context.assert(!invalidVersion.ok && invalidVersion.status === 'invalid_version', 'KernelLab build rejects invalid version flag');

  const currentCheck = createRmtKernelLabBuild({ rootDir, profile: 'clean', check: true });
  context.assert(currentCheck.ok, 'KernelLab --check passes for current clean artifacts');
  context.assert(currentCheck.status === 'current', 'KernelLab --check reports current');
  context.assert(currentCheck.changedCount === 0, 'KernelLab --check is idempotent');

  const currentManifest = readJson('xtendrmt/rmt-manifest.json', rootDir);
  const currentKernelVersion = currentManifest.version;
  [
    'xtendrmt/rmt-core.esm.js',
    'xtendrmt/rmt-runtime.esm.js',
    'xtendrmt/rmt-runtime.browser.js',
    'xtendrmt/rmt-core.d.ts',
    'xtendrmt/rmt-manifest.json'
  ].forEach((relativePath) => {
    const source = readText(relativePath, rootDir);
    assertNoDashboardSymbols(context, source, relativePath);
    assertNoDeprecatedBranding(context, source, relativePath);
    if (relativePath.endsWith('.js')) {
      context.assert(!source.includes('generated at:'), `${relativePath} does not carry a stale generated timestamp`);
      context.assert(source.includes(`XTendRMT ${currentKernelVersion}`), `${relativePath} header matches product manifest version`);
      context.assert(source.includes(`generated by: xtend kernel-lab build --profile clean --version ${currentKernelVersion}`), `${relativePath} records versioned KernelLab build provenance`);
      context.assert(source.includes(`const PUBLIC_API_VERSION = '${currentKernelVersion}';`), `${relativePath} runtime API version matches product manifest version`);
    }
    if (relativePath.endsWith('.d.ts')) {
      context.assert(source.includes(`XTendRMT ${currentKernelVersion} type definitions`), `${relativePath} type header matches product manifest version`);
    }
  });
  const moduleManifest = readJson(MODULE_MANIFEST_PATH, rootDir);
  context.assert(moduleManifest.schema === RMT_KERNEL_MODULE_MANIFEST_SCHEMA, 'Kernel module manifest artifact is written');
  context.assert(moduleManifest.kernelVersion === currentKernelVersion, 'Kernel module manifest records current kernel version');
  context.assert(moduleManifest.visibleModuleCount === analysis.visibleModuleCount, 'Kernel module manifest artifact records visible module count');
  assertNoDeprecatedBranding(context, JSON.stringify(moduleManifest), 'Kernel module manifest artifact');

  const buildRoot = tempRoot();
  KERNEL_ANALYSIS_TARGETS.forEach((target) => copyTempFile(rootDir, buildRoot, target.path));
  const firstWrite = createRmtKernelLabBuild({ rootDir: buildRoot, profile: 'clean', write: true });
  context.assert(firstWrite.ok, 'KernelLab --write succeeds in temp root');
  context.assert(firstWrite.status === 'written', 'KernelLab --write writes missing module manifest in temp root');
  context.assert(fs.existsSync(tempPath(buildRoot, MODULE_MANIFEST_PATH)), 'KernelLab --write creates module manifest artifact');
  const repeatWrite = createRmtKernelLabBuild({ rootDir: buildRoot, profile: 'clean', write: true });
  context.assert(repeatWrite.ok, 'Repeated KernelLab --write succeeds');
  context.assert(repeatWrite.changedCount === 0, 'Repeated KernelLab --write is idempotent');
  const tempCheck = createRmtKernelLabBuild({ rootDir: buildRoot, profile: 'clean', check: true });
  context.assert(tempCheck.ok && tempCheck.status === 'current', 'KernelLab --check is current after temp write');
  KERNEL_BUILD_TARGETS.forEach((target) => {
    assertNoDeprecatedBranding(context, readText(target.path, buildRoot), `Temp ${target.path}`);
  });

  const versionRoot = tempRoot();
  KERNEL_ANALYSIS_TARGETS.forEach((target) => copyTempFile(rootDir, versionRoot, target.path));
  const versionWrite = createRmtKernelLabBuild({ rootDir: versionRoot, profile: 'clean', version: '0.4.0', write: true });
  context.assert(versionWrite.ok && versionWrite.kernelVersion === '0.4.0', 'KernelLab --version writes explicit kernel version');
  context.assert(versionWrite.versionSource === 'flag', 'KernelLab --version reports flag as version source');
  context.assert(readText('xtendrmt/rmt-core.esm.js', versionRoot).includes('XTendRMT 0.4.0'), 'KernelLab --version updates JS header in temp root');
  context.assert(readText('xtendrmt/rmt-core.esm.js', versionRoot).includes("const PUBLIC_API_VERSION = '0.4.0';"), 'KernelLab --version updates runtime API version in temp root');
  context.assert(readText('xtendrmt/rmt-core.d.ts', versionRoot).includes('XTendRMT 0.4.0 type definitions'), 'KernelLab --version updates type header in temp root');
  const tempManifest = readJson('xtendrmt/rmt-manifest.json', versionRoot);
  context.assert(tempManifest.version === '0.4.0' && tempManifest.apiVersion === '0.4.0', 'KernelLab --version updates product manifest in temp root');
  const versionCheck = createRmtKernelLabBuild({ rootDir: versionRoot, profile: 'clean', version: '0.4.0', check: true });
  context.assert(versionCheck.ok && versionCheck.status === 'current', 'KernelLab --version --check is idempotent after temp write');
  KERNEL_BUILD_TARGETS.forEach((target) => {
    assertNoDeprecatedBranding(context, readText(target.path, versionRoot), `Versioned temp ${target.path}`);
  });

  return context.result({
    report: {
      schema: 'xtend.scaffold.rmt-kernel-lab-suite-report.v1',
      moduleManifestPath: MODULE_MANIFEST_PATH,
      visibleModuleCount: analysis.visibleModuleCount,
      buildRoot,
      outputCount: dryRun.outputs.length
    }
  });
}

function printScaffoldKernelLabReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Scaffold RMT KernelLab erfolgreich.',
    failureTitle: 'XTend Scaffold RMT KernelLab fehlgeschlagen:'
  });
}

module.exports = {
  printScaffoldKernelLabReport,
  runScaffoldKernelLabSuite
};
