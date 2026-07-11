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
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');
const {
  APP_PATH,
  BROWSER_SMOKE_PATH,
  BUILD_COMMAND,
  CORE_PATH,
  GENERATED_COMPONENT_PATH,
  GENERATED_COMPONENT_TAG,
  HOST_PATH,
  LOCAL_GATE,
  RMT_LIFECYCLE_DEMO_BROWSER_SMOKE_SCHEMA,
  RMT_LIFECYCLE_DEMO_BUILD_SCHEMA,
  RMT_LIFECYCLE_DEMO_SCHEMA,
  SCAFFOLD_REPORT_PATH,
  SOURCE_PATH,
  createRmtLifecycleDemoBuild
} = require('../../xtend-builder/generators/rmt-lifecycle-demo');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function outputForPath(build, relativePath) {
  return build.outputs.find((output) => output.path === relativePath) || null;
}

function assertGeneratedOutputMatches(context, rootDir, plannedBuild, relativePath, label) {
  const output = outputForPath(plannedBuild, relativePath);
  context.assert(Boolean(output), `${label} is planned by Scaffold build`);
  if (output) {
    context.assert(readText(relativePath, rootDir) === output.content, `${label} matches current Scaffold build output`);
  }
}

function runRmtLifecycleDemoSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-lifecycle-demo',
    label: 'RMT Lifecycle Demo'
  });
  const source = readText(SOURCE_PATH, rootDir);
  const core = readJson(CORE_PATH, rootDir);
  const report = readJson(SCAFFOLD_REPORT_PATH, rootDir);
  const generatedComponent = readText(GENERATED_COMPONENT_PATH, rootDir);
  const app = readText(APP_PATH, rootDir);
  const host = readText(HOST_PATH, rootDir);
  const browserSmoke = readText(BROWSER_SMOKE_PATH, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtLifecycleDemo;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const browserSuite = readText('tests/browser/browser_smoke_suite.js', rootDir);
  const cli = readText('xtend-builder/lib/cli.js', rootDir);
  const registry = readText('xtend-builder/generators/registry.js', rootDir);
  const docs = readText('docs/rmt-lifecycle-demo.md', rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);

  [
    SOURCE_PATH,
    CORE_PATH,
    SCAFFOLD_REPORT_PATH,
    GENERATED_COMPONENT_PATH,
    APP_PATH,
    HOST_PATH,
    BROWSER_SMOKE_PATH,
    'xtend-builder/generators/rmt-lifecycle-demo.js',
    'docs/rmt-lifecycle-demo.md'
  ].forEach((relativePath) => {
    assertFileExists(context, relativePath, rootDir, `${relativePath} exists`);
  });

  [
    'xtend-builder/generators/rmt-lifecycle-demo.js',
    'xtend-builder/generators/registry.js',
    'xtend-builder/lib/cli.js',
    GENERATED_COMPONENT_PATH,
    APP_PATH,
    'tests/rmt/rmt_lifecycle_demo_suite.js'
  ].forEach((relativePath) => {
    const syntax = syntaxCheckFile(relativePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${relativePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  context.assert(source.trim().startsWith('template xtendrmt.lifecycle.demo'), 'Lifecycle demo source is a vNext template');
  context.assert(!source.trim().startsWith('{'), 'Lifecycle demo source is not legacy JSON syntax');
  context.assert(source.includes('surface scaffold'), 'Lifecycle demo models the Scaffold stage in vNext');
  context.assert(source.includes('on rebuild -> action scaffold.lifecycle.rebuild'), 'Lifecycle demo models rebuild action binding');

  const compileResult = compileRmtVNextSource({
    text: source,
    filePath: resolveRepoPath(SOURCE_PATH, rootDir),
    version: 1
  }, {
    documentId: 'xtendrmt.lifecycle.demo',
    namespace: 'xtendrmt.lifecycle'
  });
  context.assert(compileResult.ok, 'vNext compiler compiles lifecycle demo source');
  context.assert(readText(CORE_PATH, rootDir) === compileResult.coreJson, 'Core JSON is generated from current vNext source');
  context.assert(core.schema === 'xtend.rmt.core-format.vnext.v1', 'Core output uses vNext core schema');
  context.assert(core.manifest.documentId === 'xtendrmt.lifecycle.demo', 'Core output keeps lifecycle demo document id');
  context.assert(core.manifest.sourceSyntax === 'rmt-vnext', 'Core output records vNext source syntax');
  context.assert(core.surfaces.length === 4, 'Core output contains four lifecycle surfaces');
  context.assert(core.operations.length >= 5, 'Core output contains lifecycle operations');
  context.assert(core.slots.length === 1, 'Core output contains generated Scaffold slot');
  context.assert(core.events.some((event) => event.action === 'scaffold.lifecycle.rebuild'), 'Core output contains rebuild event binding');

  const plannedBuild = createRmtLifecycleDemoBuild({ write: false }, { rootDir });
  context.assert(plannedBuild.ok, 'Scaffold lifecycle demo build dry-run succeeds');
  context.assert(plannedBuild.status === 'planned', 'Scaffold lifecycle demo dry-run stays non-writing');
  assertGeneratedOutputMatches(context, rootDir, plannedBuild, CORE_PATH, 'Core output');
  assertGeneratedOutputMatches(context, rootDir, plannedBuild, SCAFFOLD_REPORT_PATH, 'Scaffold report');
  assertGeneratedOutputMatches(context, rootDir, plannedBuild, GENERATED_COMPONENT_PATH, 'Generated XTend component');
  assertGeneratedOutputMatches(context, rootDir, plannedBuild, APP_PATH, 'Generated XTend app module');
  assertGeneratedOutputMatches(context, rootDir, plannedBuild, HOST_PATH, 'Generated host');
  assertGeneratedOutputMatches(context, rootDir, plannedBuild, BROWSER_SMOKE_PATH, 'Generated browser smoke');

  context.assert(report.schema === RMT_LIFECYCLE_DEMO_BUILD_SCHEMA, 'Scaffold report uses lifecycle build schema');
  context.assert(report.demoSchema === RMT_LIFECYCLE_DEMO_SCHEMA, 'Scaffold report declares demo schema');
  context.assert(report.browserSmokeSchema === RMT_LIFECYCLE_DEMO_BROWSER_SMOKE_SCHEMA, 'Scaffold report declares browser smoke schema');
  context.assert(report.source === SOURCE_PATH, 'Scaffold report points at source template');
  context.assert(report.coreOutput === CORE_PATH, 'Scaffold report points at core output');
  context.assert(report.buildCommand === BUILD_COMMAND, 'Scaffold report documents build command');
  context.assert(report.localGate === LOCAL_GATE, 'Scaffold report documents local test gate');
  context.assert(report.generated.component === GENERATED_COMPONENT_PATH, 'Scaffold report points at generated component');
  context.assert(report.generated.app === APP_PATH, 'Scaffold report points at generated app');
  context.assert(report.generated.host === HOST_PATH, 'Scaffold report points at host');
  context.assert(report.generated.browserSmoke === BROWSER_SMOKE_PATH, 'Scaffold report points at browser smoke');
  context.assert(report.scaffold.generator === 'rmt-lifecycle-demo', 'Scaffold report records lifecycle generator');
  context.assert(report.scaffold.componentGenerator === 'xtend.scaffold.component-files.v1', 'Scaffold report uses component-files generator');
  context.assert(report.scaffold.componentTag === GENERATED_COMPONENT_TAG, 'Scaffold report records generated component tag');
  context.assert(report.lifecycle.length === 4, 'Scaffold report records four lifecycle stages');
  context.assert(report.checks.includes('compiler-emits-deterministic-core-json'), 'Scaffold report checks compiler output');
  context.assert(report.boundaries.includes('generated-files-owned-by-scaffold-build'), 'Scaffold report records generated ownership boundary');

  context.assert(generatedComponent.includes(`customElements.define('${GENERATED_COMPONENT_TAG}'`), 'Generated component registers lifecycle custom element');
  context.assert(generatedComponent.includes('xtendScaffoldWiring'), 'Generated component contains Scaffold wiring metadata');
  context.assert(generatedComponent.includes('xtendScaffoldA11yProfile'), 'Generated component contains Scaffold a11y metadata');
  context.assert(generatedComponent.includes('xtendScaffoldPerformanceProfile'), 'Generated component contains Scaffold performance metadata');
  context.assert(generatedComponent.includes("const variant = this._escapeAttribute(this.getAttribute('variant') || 'default');"), 'Generated component escapes variant before innerHTML interpolation');
  context.assert(!generatedComponent.includes('data-variant=\"${this.getAttribute'), 'Generated component does not interpolate raw variant attributes');

  context.assert(app.startsWith('// @generated by XTend Scaffold RMT lifecycle build.'), 'App module is marked as generated');
  context.assert(app.includes(`// Command: ${BUILD_COMMAND}`), 'App module records build command');
  context.assert(app.includes("import '../components/x-rmt-lifecycle-demo.js'"), 'App module imports generated component');
  context.assert(app.includes("new URL('./rmt-lifecycle-demo.rmt', import.meta.url)"), 'App module loads source relative to module URL');
  context.assert(app.includes('bootRmtLifecycleDemo'), 'App module exports boot function');
  context.assert(app.includes('data-rmt-lifecycle-stage'), 'App module renders lifecycle stage markers');
  context.assert(app.includes('x-rmt-lifecycle-demo::part(root)'), 'App module styles generated component host part');

  context.assert(host.includes('data-rmt-lifecycle-demo-root'), 'Host exposes lifecycle demo root');
  context.assert(host.includes('type="module" src="/xtend-loader.js"'), 'Host uses canonical XTend loader');
  context.assert(host.includes('data-manifest="/components/manifest.json"'), 'Host uses local manifest');
  context.assert(host.includes("import('/xtendrmt/rmt-lifecycle-demo.app.js')"), 'Host imports generated app');
  context.assert(!host.includes('https://cdn.ccs-networks.de/xtend'), 'Host has no CDN dependency');
  context.assert(!host.includes('<x-section'), 'Host has no static XTend shell markup');

  context.assert(browserSmoke.includes(RMT_LIFECYCLE_DEMO_BROWSER_SMOKE_SCHEMA), 'Browser smoke declares lifecycle schema');
  context.assert(browserSmoke.includes('__xtendRmtLifecycleDemoSmokeResult'), 'Browser smoke exposes result object');
  context.assert(browserSmoke.includes('/xtendrmt/rmt-lifecycle-demo.app.js'), 'Browser smoke imports generated app');
  [
    'lifecycle source loaded',
    'lifecycle scaffold component defined',
    'lifecycle generated app rendered',
    'lifecycle core has surfaces',
    'lifecycle scaffold report linked app',
    'lifecycle local http assets only'
  ].forEach((check) => {
    context.assert(browserSmoke.includes(`recordCheck('${check}'`), `Browser smoke records ${check}`);
  });

  context.assert(registry.includes("id: 'rmt-lifecycle-demo'"), 'Scaffold registry exposes lifecycle demo generator');
  context.assert(cli.includes("command === 'rmt-lifecycle-demo'"), 'Scaffold CLI exposes lifecycle demo build command');
  context.assert(runner.includes("id: 'rmt-lifecycle-demo'"), 'XTend test runner registers lifecycle demo suite');
  context.assert(browserSuite.includes(BROWSER_SMOKE_PATH), 'Browser smoke harness registers lifecycle fixture');
  context.assert(browserSuite.includes('__xtendRmtLifecycleDemoSmokeResult'), 'Browser smoke harness knows lifecycle result key');
  context.assert(packageManifest.scripts['build:rmt-lifecycle-demo'] === BUILD_COMMAND, 'Package exposes lifecycle build script');
  context.assert(packageManifest.scripts['test:rmt-lifecycle-demo'] === 'node scripts/run_xtend_tests.js rmt-lifecycle-demo', 'Package exposes lifecycle test script');
  context.assert(metadata && metadata.schema === RMT_LIFECYCLE_DEMO_SCHEMA, 'Package metadata declares lifecycle demo schema');
  context.assert(metadata && metadata.buildSchema === RMT_LIFECYCLE_DEMO_BUILD_SCHEMA, 'Package metadata declares lifecycle build schema');
  context.assert(metadata && metadata.source === SOURCE_PATH, 'Package metadata points at source template');
  context.assert(metadata && metadata.coreOutput === CORE_PATH, 'Package metadata points at core output');
  context.assert(metadata && metadata.generatedApp === APP_PATH, 'Package metadata points at generated app');
  context.assert(metadata && metadata.generatedComponent === GENERATED_COMPONENT_PATH, 'Package metadata points at generated component');
  context.assert(metadata && metadata.host === HOST_PATH, 'Package metadata points at host');
  context.assert(metadata && metadata.browserSmoke === BROWSER_SMOKE_PATH, 'Package metadata points at browser smoke');
  context.assert(metadata && metadata.buildCommand === BUILD_COMMAND, 'Package metadata exposes build command');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');

  context.assert(docs.includes(RMT_LIFECYCLE_DEMO_SCHEMA), 'Docs declare lifecycle demo schema');
  context.assert(docs.includes(BUILD_COMMAND), 'Docs document build command');
  context.assert(docs.includes(HOST_PATH), 'Docs link generated host');
  context.assert(docsReadme.includes('RMT Lifecycle Demo'), 'Docs README links lifecycle demo');
  context.assert(docsMenu.includes('rmt-lifecycle-demo'), 'Docs menu links lifecycle demo');

  return context.result({
    report: {
      schema: 'xtend.rmt.lifecycle-demo-report.v1',
      source: SOURCE_PATH,
      core: CORE_PATH,
      generatedApp: APP_PATH,
      generatedComponent: GENERATED_COMPONENT_PATH,
      host: HOST_PATH,
      counts: report.counts
    }
  });
}

function printRmtLifecycleDemoReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT Lifecycle Demo erfolgreich.',
    failureTitle: 'RMT Lifecycle Demo fehlgeschlagen:'
  });
}

module.exports = {
  printRmtLifecycleDemoReport,
  runRmtLifecycleDemoSuite
};
