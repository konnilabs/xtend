'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { buildMaracaBundleAsync, createMaracaBuildPlan } = require('../../xtend-maraca');
const { runCli } = require('../../xtend-builder/lib/cli');
const { getGeneratorRegistry } = require('../../xtend-builder/generators/registry');
const {
  MATERIAL_APP_SCAFFOLD_REPORT_SCHEMA,
  MATERIAL_APP_SCAFFOLD_SCHEMA,
  MATERIAL_APP_TEMPLATES,
  createMaterialAppScaffold
} = require('../../xtend-builder/generators/material-app');
const { getTemplateRegistry } = require('../../xtend-builder/templates/registry');
const {
  closeServer,
  contentTypeFor,
  listenXtendDevServer,
  normalizeServeOptions,
  pathnameFromRequestUrl,
  resolveSafePath
} = require('../../xtend-builder/lib/dev-server');

const BACKLOG = 'development/BACKLOG-XTend-Material-Tailwind-CSS-Fast-Path.md';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js xtend-material-scaffold maraca-rmt-source-to-bundle scaffold-ownership --json';

function read(rootDir, relativePath) {
  return fs.readFileSync(path.resolve(rootDir, relativePath), 'utf8');
}

function createIo() {
  let stdout = '';
  let stderr = '';
  return {
    stdout: { write(value) { stdout += String(value); } },
    stderr: { write(value) { stderr += String(value); } },
    readStdout() { return stdout; },
    readStderr() { return stderr; }
  };
}

function requestLocal(origin, pathname) {
  return new Promise((resolve, reject) => {
    http.get(`${origin}${pathname}`, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve({ statusCode: response.statusCode, headers: response.headers, body }));
    }).on('error', reject);
  });
}

async function runXtendMaterialScaffoldSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({ id: 'xtend-material-scaffold', label: 'XTM-09 XTend Material App Scaffold' });
  const suffix = `${process.pid}-${Date.now()}`;
  const outputDir = `.xtend-build/xtm09-material-app-${suffix}`;
  const conflictDir = `.xtend-build/xtm09-material-conflict-${suffix}`;
  const outputRoot = path.resolve(rootDir, outputDir);
  const conflictRoot = path.resolve(rootDir, conflictDir);
  const backlog = read(rootDir, BACKLOG);

  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.rmSync(conflictRoot, { recursive: true, force: true });
  try {
    const generatorRegistry = getGeneratorRegistry();
    const templateRegistry = getTemplateRegistry();
    context.assert(generatorRegistry.generators.some((entry) => entry.id === 'material-app' && entry.command === 'create-app'), 'generator registry exposes the productive Material app preset');
    MATERIAL_APP_TEMPLATES.forEach((definition) => context.assert(templateRegistry.templates.some((entry) => entry.artifact === definition.artifact && /^implemented-XTM-(?:09|14)$/u.test(entry.status)), `template registry exposes ${definition.artifact}`));

    const dryRun = createMaterialAppScaffold({ rootDir, runtime: 'maraca', designKit: 'material', out: outputDir, name: 'ops-console' });
    context.assert(dryRun.schema === MATERIAL_APP_SCAFFOLD_REPORT_SCHEMA && dryRun.scaffoldSchema === MATERIAL_APP_SCAFFOLD_SCHEMA, 'dry run emits stable scaffold and report schemas');
    context.assert(dryRun.ok && dryRun.status === 'planned' && dryRun.writeReport.mode === 'dry-run', 'default invocation is a non-writing dry run');
    context.assert(dryRun.files.length === 8 && dryRun.files.every((file) => file.action === 'create'), 'dry run plans the complete RMT, CSS, runtime host, config, package and smoke app');
    context.assert(!fs.existsSync(outputRoot), 'dry run creates no application directory');

    const cliIo = createIo();
    const previousCwd = process.cwd();
    process.chdir(rootDir);
    let cliStatus;
    try {
      cliStatus = runCli(['create', 'app', '--runtime', 'maraca', '--design-kit', 'material', '--out', outputDir, '--name', 'ops-console', '--json'], cliIo);
    } finally {
      process.chdir(previousCwd);
    }
    const cliReport = JSON.parse(cliIo.readStdout());
    context.assert(cliStatus === 0 && cliReport.schema === MATERIAL_APP_SCAFFOLD_REPORT_SCHEMA && cliIo.readStderr() === '', 'xt create app exposes the Material dry run through JSON CLI output');
    const configIo = createIo();
    process.chdir(rootDir);
    let configStatus;
    try {
      configStatus = runCli(['config', '--json'], configIo);
    } finally {
      process.chdir(previousCwd);
    }
    const configSummary = JSON.parse(configIo.readStdout());
    context.assert(configStatus === 0 && configSummary.materialAppScaffold.reportSchema === MATERIAL_APP_SCAFFOLD_REPORT_SCHEMA, 'CLI config summary exposes the Material scaffold contract');

    const written = createMaterialAppScaffold({ rootDir, runtime: 'maraca', designKit: 'material', out: outputDir, name: 'ops-console', write: true });
    context.assert(written.ok && written.status === 'written' && written.writeReport.writes.filter((entry) => entry.changed).length === 8, '--write creates all eight planned artifacts');
    context.assert(fs.existsSync(path.join(outputRoot, '.xtend-build/scaffold-ownership.json')), 'write records an app-local Scaffold ownership manifest');
    ['src/app.rmt', 'src/app.css', 'src/material-runtime-host.mjs', 'src/material-dev-api.mjs', 'site/index.html', 'maraca.config.json', 'package.json', 'test/material-app.smoke.test.cjs'].forEach((file) => context.assert(fs.existsSync(path.join(outputRoot, file)), `generated app contains ${file}`));

    const config = JSON.parse(read(outputRoot, 'maraca.config.json'));
    const manifest = JSON.parse(read(outputRoot, 'package.json'));
    const rootManifest = JSON.parse(read(rootDir, 'package.json'));
    const rmt = read(outputRoot, 'src/app.rmt');
    const css = read(outputRoot, 'src/app.css');
    const host = read(outputRoot, 'site/index.html');
    context.assert(config.schema === 'xtend.maraca.build-config.v1' && config.options.cssProvider === 'tailwind' && config.options.cssPreflight === 'disabled', 'Maraca config selects the local Tailwind provider with disabled Preflight');
    context.assert(config.options.cssInput === 'src/app.css' && config.options.cssSources.join(',') === 'src/app.rmt,src/app.css' && config.options.cssProviderFallback === 'none', 'Maraca config closes source discovery and fails closed');
    context.assert(config.options.orchestration === 'strict' && config.options.kernel === 'strict' && config.options.hydration === 'strict' && config.options.validation === 'strict' && config.options.transitions === 'strict', 'generated config fails closed across Kernel orchestration, validation and transitions');
    context.assert(manifest.scripts.plan && manifest.scripts.build && manifest.scripts.serve === 'npm run build && xt serve --root . --default site/index.html --port 4173' && manifest.scripts.tune && manifest.scripts.test, 'generated package exposes local plan, build-first serve, tune and test scripts');
    context.assert(written.commands.serve === 'npm run serve', 'scaffold report exposes the generated serve command');
    context.assert(rootManifest.xtend.materialAppScaffold.artifacts.length === 8 && rootManifest.xtend.materialAppScaffold.artifacts.includes('site/index.html') && rootManifest.xtend.materialAppScaffold.serveCommand === 'npm run serve', 'root metadata exposes all eight scaffold artifacts and the serve command');
    context.assert(manifest.devDependencies.tailwindcss === '4.3.2' && manifest.devDependencies['@xtend-material/maraca-tailwind'] === '^0.1.0', 'Tailwind and its adapter are app-local development dependencies');
    context.assert(!manifest.dependencies.tailwindcss && !manifest.dependencies['@xtend-material/maraca-tailwind'], 'Tailwind tooling never enters productive runtime dependencies');
    context.assert(rmt.includes('class "xtm-app-shell"') && rmt.includes('class "xtm-content-page"') && !/class "(?:grid|flex|p-\d)/u.test(rmt), 'generated RMT uses semantic Material classes without utility authoring');
    context.assert(css.includes('tailwindcss/theme.css') && css.includes('tailwindcss/utilities.css') && !css.includes('preflight.css'), 'generated CSS uses only pinned air-gapped Tailwind imports');
    context.assert(host.includes('<main id="material-app"') && host.includes('<link rel="stylesheet" href="../dist/xtend.maraca.css">') && host.includes('<script type="module" src="../src/material-runtime-host.mjs"></script>'), 'generated HTML host owns the mount point and local CSS/module tags');

    context.assert(contentTypeFor('app.css') === 'text/css; charset=utf-8' && contentTypeFor('host.mjs') === 'text/javascript; charset=utf-8', 'packaged serve module exposes CSS and module MIME types');
    context.assert(pathnameFromRequestUrl('/src/app.css?cache=off') === '/src/app.css' && resolveSafePath(outputRoot, '/../package.json', 'site/index.html') === null, 'packaged serve module strips query strings and blocks path traversal');
    const invalidPort = normalizeServeOptions({ root: outputRoot, default: 'site/index.html', port: '70000' });
    const missingDefault = normalizeServeOptions({ root: outputRoot, default: 'site/missing.html', port: '0' });
    context.assert(!invalidPort.ok && invalidPort.errors.some((error) => error.includes('Port must be an integer')) && !missingDefault.ok && missingDefault.errors.some((error) => error.includes('Default document does not exist')), 'serve option validation blocks invalid ports and missing default documents');

    const localServer = await listenXtendDevServer({ rootDir: outputRoot, defaultPath: 'site/index.html', port: 0 });
    try {
      const defaultResponse = await requestLocal(localServer.origin, '/?theme=dark');
      const cssResponse = await requestLocal(localServer.origin, '/src/app.css?cache=off');
      const moduleResponse = await requestLocal(localServer.origin, '/src/material-runtime-host.mjs');
      const missingResponse = await requestLocal(localServer.origin, '/missing.txt');
      const forbiddenResponse = await requestLocal(localServer.origin, '/..%2Fpackage.json');
      context.assert(defaultResponse.statusCode === 200 && defaultResponse.body.includes('id="material-app"'), 'serve module resolves the generated default document with a query string');
      context.assert(cssResponse.statusCode === 200 && cssResponse.headers['content-type'] === 'text/css; charset=utf-8' && moduleResponse.statusCode === 200 && moduleResponse.headers['content-type'] === 'text/javascript; charset=utf-8', 'serve module returns correct CSS and MJS content types');
      context.assert(missingResponse.statusCode === 404 && forbiddenResponse.statusCode === 403, 'serve module distinguishes missing files from blocked traversal');

      const bindFailure = childProcess.spawnSync(process.execPath, [path.join(rootDir, 'xtend-builder/bin/xt.js'), 'serve', '--root', '.', '--default', 'site/index.html', '--port', String(localServer.port), '--check', '--json'], { cwd: outputRoot, encoding: 'utf8' });
      let bindFailureReport = null;
      try { bindFailureReport = JSON.parse(bindFailure.stdout); } catch (_) {}
      context.assert(bindFailure.status === 1 && bindFailureReport && bindFailureReport.ok === false && bindFailureReport.diagnostics.some((entry) => /EADDRINUSE/u.test(entry.message)), 'public xt serve reports bind failures as structured diagnostics');
    } finally {
      await closeServer(localServer.server);
    }

    const serveCheck = childProcess.spawnSync(process.execPath, [path.join(rootDir, 'xtend-builder/bin/xt.js'), 'serve', '--root', '.', '--default', 'site/index.html', '--port', '0', '--check', '--json'], { cwd: outputRoot, encoding: 'utf8' });
    let serveCheckReport = null;
    try { serveCheckReport = JSON.parse(serveCheck.stdout); } catch (_) {}
    context.assert(serveCheck.status === 0 && serveCheckReport && serveCheckReport.schema === 'xtend.local-dev-server.v1' && serveCheckReport.ok && serveCheckReport.status === 'checked' && serveCheckReport.port > 0, 'public xt serve validates, binds and closes the generated HTML host');

    const check = createMaterialAppScaffold({ rootDir, runtime: 'maraca', designKit: 'material', out: outputDir, name: 'ops-console', check: true });
    context.assert(check.ok && check.status === 'current' && check.writeReport.plan.changedCount === 0, 'second --check run is current');
    const secondWrite = createMaterialAppScaffold({ rootDir, runtime: 'maraca', designKit: 'material', out: outputDir, name: 'ops-console', write: true });
    context.assert(secondWrite.ok && secondWrite.writeReport.plan.changedCount === 0 && secondWrite.writeReport.writes.every((entry) => entry.action === 'skip'), 'second --write run is idempotent');

    const smoke = childProcess.spawnSync(process.execPath, ['--test', 'test/material-app.smoke.test.cjs'], { cwd: outputRoot, encoding: 'utf8' });
    context.assert(smoke.status === 0, `generated smoke test passes${smoke.status === 0 ? '' : `: ${smoke.stderr}`}`);
    const plan = createMaracaBuildPlan({ config: 'maraca.config.json' }, { rootDir: outputRoot });
    context.assert(plan.ok && plan.status === 'planned' && plan.cssBuild.resolvedProvider === 'tailwind', 'generated config reaches a Tailwind Maraca build plan');
    context.assert(plan.cssBuild.inventory.materialClasses.join(',') === 'xtm-app-shell,xtm-card,xtm-confirmation-flow,xtm-content-page,xtm-dashboard,xtm-empty-state,xtm-feedback-stack,xtm-form-flow,xtm-navigation-rail,xtm-primary-action,xtm-top-app-bar,xtm-workspace', 'source-to-sea plan inventories only generated semantic classes');
    const build = await buildMaracaBundleAsync({ config: 'maraca.config.json' }, { rootDir: outputRoot });
    context.assert(build.ok && build.status === 'built', 'freshly generated Material app builds without manual correction');
    const builtCss = fs.readFileSync(build.plan.outputs.css, 'utf8');
    context.assert(builtCss.includes('.xtm-app-shell') && builtCss.includes('container:xtm-shell'), 'source-to-sea bundle contains utility expansion and native Material composition');
    context.assert(build.plan.cssBuild.evidence.designKit.stylesFingerprint && build.plan.cssBuild.evidence.toolchain.versions.tailwindcss === '4.3.2', 'bundle Evidence identifies Material styles and the pinned Tailwind toolchain');

    fs.appendFileSync(path.join(outputRoot, 'src/app.css'), '\n/* user drift */\n', 'utf8');
    const drift = createMaterialAppScaffold({ rootDir, runtime: 'maraca', designKit: 'material', out: outputDir, name: 'ops-console', check: true });
    context.assert(!drift.ok && drift.status === 'blocked' && drift.errors.some((error) => error.includes('changed since the last Scaffold ownership record')), 'ownership guard blocks generated-file drift without overwriting it');
    context.assert(read(outputRoot, 'src/app.css').includes('user drift'), 'blocked re-run preserves the user-modified file');

    fs.mkdirSync(conflictRoot, { recursive: true });
    fs.writeFileSync(path.join(conflictRoot, 'package.json'), '{"name":"user-owned"}\n', 'utf8');
    const conflict = createMaterialAppScaffold({ rootDir, runtime: 'maraca', designKit: 'material', out: conflictDir, write: true });
    context.assert(!conflict.ok && conflict.status === 'blocked' && conflict.errors.some((error) => error.includes('not owned by Scaffold')), 'unowned target blocks the complete write before partial output');
    context.assert(!fs.existsSync(path.join(conflictRoot, 'src/app.rmt')) && JSON.parse(read(conflictRoot, 'package.json')).name === 'user-owned', 'blocked write neither partially scaffolds nor overwrites user content');

    const missingAdapter = createMaterialAppScaffold({ rootDir, out: `${conflictDir}-missing-adapter` }, { resolveAdapter: () => false });
    context.assert(missingAdapter.ok && missingAdapter.diagnostics.some((entry) => entry.code === 'xtend.scaffold.material_adapter_missing' && entry.repairHint.includes('npm install')), 'missing adapter produces a non-destructive diagnostic with repair hint');
    const otherPreset = createMaterialAppScaffold({ rootDir, out: `${conflictDir}-native`, designKit: 'native' });
    context.assert(!otherPreset.ok && otherPreset.files.length === 0 && otherPreset.errors.some((entry) => entry.includes('does not activate Tailwind')), 'non-Material presets never install or activate Tailwind');

    const helpIo = createIo();
    context.assert(runCli(['create', '--help'], helpIo) === 0 && helpIo.readStdout().includes('--runtime maraca --design-kit material') && helpIo.readStdout().includes('--check') && helpIo.readStdout().includes('eight artifacts') && helpIo.readStdout().includes('npm run serve'), 'CLI help documents selection, ownership and generated serve modes');
    context.assert(backlog.includes('| `XTM-09` | P1 | completed | WS5 |') && backlog.includes(LOCAL_GATE), 'backlog closes XTM-09 and exposes its complete local gate');
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
    fs.rmSync(conflictRoot, { recursive: true, force: true });
    fs.rmSync(`${conflictRoot}-missing-adapter`, { recursive: true, force: true });
    fs.rmSync(`${conflictRoot}-native`, { recursive: true, force: true });
  }

  return context.result({
    report: {
      schema: MATERIAL_APP_SCAFFOLD_REPORT_SCHEMA,
      preset: 'material',
      runtime: 'maraca',
      artifactCount: 8,
      localGate: LOCAL_GATE
    }
  });
}

function printXtendMaterialScaffoldReport(result) {
  printSuiteReport(result, { successTitle: 'XTM-09 Material app scaffold passed.', failureTitle: 'XTM-09 Material app scaffold failed:' });
}

module.exports = { printXtendMaterialScaffoldReport, runXtendMaterialScaffoldSuite };
