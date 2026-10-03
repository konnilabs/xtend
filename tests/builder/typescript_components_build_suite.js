const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
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

const TYPESCRIPT_COMPONENTS_SCHEMA = 'xtend.typescript.components-build.v1';
const TYPESCRIPT_COMPONENTS_LOCAL_GATE = 'node scripts/run_xtend_tests.js typescript-components --json';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function runTypeScriptComponentsBuildSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'typescript-components',
    label: 'XTend TypeScript Components Build'
  });

  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const tsconfig = readJson('tsconfig.components.json', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const source = readText('src/components/x-toggle/x-toggle.ts', rootDir);
  const finalizerSyntax = syntaxCheckFile('scripts/finalize_component_build.js', { rootDir, extension: '.js' });

  assertFileExists(context, 'src/components/x-toggle/x-toggle.ts', rootDir, 'x-toggle TypeScript source exists');
  assertFileExists(context, 'tsconfig.components.json', rootDir, 'TypeScript component tsconfig exists');
  assertFileExists(context, 'scripts/finalize_component_build.js', rootDir, 'TypeScript component finalizer exists');
  context.assert(finalizerSyntax.ok, `TypeScript finalizer syntax passes${finalizerSyntax.ok ? '' : ` (${finalizerSyntax.message})`}`);
  context.assert(tsconfig.compilerOptions && tsconfig.compilerOptions.declaration === true, 'tsconfig emits declaration artifacts');
  context.assert(Array.isArray(tsconfig.include) && tsconfig.include.includes('src/components/x-toggle/x-toggle.ts'), 'tsconfig includes x-toggle source');
  context.assert(source.includes('xtend.typescript.component-source-strategy.v1'), 'x-toggle source declares TypeScript source strategy');
  context.assert(source.includes('xtendFormControlUxProfile'), 'x-toggle source declares Form Control UX profile');
  context.assert(source.includes('xtend.rmt.component-contract.v1'), 'x-toggle source declares RMT contract');

  context.assert(packageManifest.devDependencies && packageManifest.devDependencies.typescript, 'Package declares TypeScript dev dependency');
  context.assert(packageManifest.scripts['build:components'] === 'tsc -p tsconfig.components.json && node scripts/finalize_component_build.js', 'Package exposes component build script');
  context.assert(packageManifest.scripts['test:typescript-components'] === 'node scripts/run_xtend_tests.js typescript-components', 'Package exposes TypeScript component gate');
  context.assert(packageManifest.xtend && packageManifest.xtend.typescriptComponentSource && packageManifest.xtend.typescriptComponentSource.productiveCompilerIntroduced === true, 'Package metadata marks component compiler productive');
  context.assert(packageManifest.xtend && packageManifest.xtend.typescriptComponentsBuild && packageManifest.xtend.typescriptComponentsBuild.schema === TYPESCRIPT_COMPONENTS_SCHEMA, 'Package metadata exposes TypeScript components build schema');
  context.assert(scaffoldConfig.includes('productiveCompilerIntroduced: true'), 'Scaffold config marks component compiler productive');
  context.assert(scaffoldConfig.includes('tsconfig.components.json'), 'Scaffold config points at component tsconfig');
  context.assert(runner.hasSuite("typescript-components"), 'Runner exposes TypeScript Components Build suite');
  context.assert(packageManifest.scripts['test:pr:report'].includes('builder-typescript-blueprint typescript-components component-ux-browser-smokes'), 'PR report gate runs TypeScript components before browser smokes');
  context.assert(packageManifest.scripts['test:release:full:report'].includes('builder-typescript-blueprint typescript-components component-ux-browser-smokes'), 'Release report gate runs TypeScript components before browser smokes');

  const build = spawnSync('npm', ['run', 'build:components'], {
    cwd: rootDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_config_audit: 'false',
      npm_config_fund: 'false'
    }
  });
  const buildOutput = `${build.stdout || ''}${build.stderr || ''}`.trim();
  context.assert(build.status === 0, `npm run build:components succeeds${build.status === 0 ? '' : ` (${buildOutput})`}`);

  const runtime = readText('components/xtoggle.js', rootDir);
  const types = readText('components/xtoggle.d.ts', rootDir);
  context.assert(runtime.includes("from './xtend-state.js'"), 'Generated runtime import is finalized to local XTend State');
  context.assert(runtime.includes("customElements.define('x-toggle'"), 'Generated runtime defines x-toggle');
  context.assert(types.includes("'x-toggle': XToggleElement"), 'Generated declaration augments HTMLElementTagNameMap');
  context.assert(types.includes('XToggleEventMap'), 'Generated declaration exposes event map');

  return context.result({
    report: {
      schema: TYPESCRIPT_COMPONENTS_SCHEMA,
      localGate: TYPESCRIPT_COMPONENTS_LOCAL_GATE,
      buildStatus: build.status,
      artifacts: ['components/xtoggle.js', 'components/xtoggle.d.ts']
    }
  });
}

function printTypeScriptComponentsBuildReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend TypeScript Components Build erfolgreich.',
    failureTitle: 'XTend TypeScript Components Build fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runTypeScriptComponentsBuildSuite();
  printTypeScriptComponentsBuildReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  TYPESCRIPT_COMPONENTS_LOCAL_GATE,
  TYPESCRIPT_COMPONENTS_SCHEMA,
  printTypeScriptComponentsBuildReport,
  runTypeScriptComponentsBuildSuite
};
