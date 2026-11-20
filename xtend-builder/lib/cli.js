const config = require('../scaffold.config');
const {
  formatScaffoldLayout,
  getScaffoldLayout
} = require('./layout');
const {
  getComponentBlueprintContract
} = require('../blueprints/component-blueprint.contract');
const {
  getGeneratorRegistry,
  runGenerator
} = require('../generators/registry');
const {
  getTemplateRegistry
} = require('../templates/registry');
const {
  createDeveloperWorkflow,
  createVerifyPlan
} = require('../workflows/developer-workflow');
const {
  requireLocalOrScoped
} = require('./package-resolver');
const {
  runRmtLinterCli
} = requireLocalOrScoped(
  __filename,
  '../../tools/rmt-linter/cli',
  '@ccslabs/xtend-compiler/rmt-linter/cli'
);
const {
  buildMaracaBundle,
  buildMaracaBundleAsync,
  createMaracaBuildPlan,
  createMaracaProjectBuildPlan,
  buildMaracaProjectBundle,
  buildMaracaProjectBundleAsync,
  tuneMaracaBuild
} = requireLocalOrScoped(
  __filename,
  '../../xtend-maraca',
  '@ccslabs/xtend-maraca'
);
const {
  exportRmtAiDeveloperKit
} = requireLocalOrScoped(
  __filename,
  '../../tools/rmt-language/rmt-ai-developer-kit',
  '@ccslabs/xtend-compiler/rmt-language/rmt-ai-developer-kit'
);
const {
  SERVER_CONTRACT,
  closeServer,
  listenXtendDevServer,
  normalizeServeOptions,
  waitForServerShutdown
} = require('./dev-server');

const CLI_SCHEMA = 'xtend.scaffold.cli.v1';
const LAYOUT_SCHEMA = 'xtend.scaffold.layout.v1';
const COMMAND_ALIASES = Object.freeze({
  validate: 'verify'
});

function writeLine(stream, value = '') {
  stream.write(`${value}\n`);
}

function parseArgs(args) {
  const options = {
    command: null,
    help: false,
    json: false,
    rest: []
  };

  args.forEach((arg) => {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      return;
    }

    if (arg === '--json') {
      options.json = true;
      return;
    }

    if (!options.command) {
      options.command = arg;
      return;
    }

    options.rest.push(arg);
  });

  return options;
}

function normalizeCommand(command) {
  return COMMAND_ALIASES[command] || command;
}

function parseFlagArgs(args) {
  const parsed = {};
  const positionals = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) {
      positionals.push(arg);
      continue;
    }

    const flag = arg.slice(2);
    const equalsIndex = flag.indexOf('=');
    let key = flag;
    let value = true;

    if (equalsIndex >= 0) {
      key = flag.slice(0, equalsIndex);
      value = flag.slice(equalsIndex + 1);
    } else if (args[index + 1] && !args[index + 1].startsWith('--')) {
      value = args[index + 1];
      index += 1;
    }

    if (Object.prototype.hasOwnProperty.call(parsed, key)) {
      parsed[key] = Array.isArray(parsed[key]) ? parsed[key].concat(value) : [parsed[key], value];
    } else {
      parsed[key] = value;
    }
  }

  if (positionals.length > 0) {
    parsed._ = positionals;
  }

  return parsed;
}

function buildHelpText() {
  return [
    'XTend-Scaffold CLI',
    '',
    'Usage:',
    '  xt --help',
    '  xt index build|symbols|references|impact --root <project> --json',
    '  xt pages build --root <project> --target node|php|both --json',
    '  xt create app --runtime maraca --design-kit none --out rmt-app --write --json',
    '  xt create app --runtime maraca --design-kit material --out material-app --write --json',
    '  xt serve --root dist --port 4173',
    '  xt validate --json',
    '  xt maraca plan app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --json',
    '  xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --out dist --profile production --lazy route --css external --css-provider maraca-native --pwa --json',
    '  xt maraca build app.rmt --out dist --web-app-manifest --json',
    '  xt maraca build app.rmt --services-entry src/services.ts --server-services-entry src/server-services.ts --service-targets browser,node --json',
    '  xt maraca build app.rmt --vendor xtend --out products/xtend-vendor-maraca --lazy none --json',
    '  xt maraca tune app.rmt --config maraca.config.json --out dist --write --json',
    '  xt rmt build app.rmt --bundle maraca --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --out dist --json',
    '  xt rmt lint app.rmt --json',
    '  xt rmt check app.rmtx --project --source-syntax rmtx --rmtx-syntax-version 8.0.0 --json',
    '  xt rmt watch app.rmtx --project --json',
    '  xt maraca build app.rmtx --project --source-syntax rmtx --out dist --json',
    '  xt rmt ai-kit export --profile compact --format md --json',
    '  xt rmt ai-kit export --profile full --format jsonl --out tools/rmt-language/generated/rmt-ai-developer-kit --json',
    '  xt kernel-lab analyze --json',
    '  xt kernel-lab build --profile clean --check --json',
    '  xt kernel-lab build --profile clean --version 0.8.0 --write --json',
    '  xt rmt kernel-lab build --profile clean --version 0.8.0 --write --json',
    '  xt rmt lint tests/fixtures',
    '  xt component-files --tag x-example --profile display --json',
    '  xt workflow --json',
    '  xtend validate --json',
    '  xtend rmt lint app.rmt',
    '  xtend-scaffold verify --json',
    '  npx --no-install xt validate --json',
    '  node xtend-builder/scaffold.js --help',
    '  node xtend-builder/scaffold.js layout',
    '  node xtend-builder/scaffold.js layout --json',
    '  node xtend-builder/scaffold.js blueprint --json',
    '  node xtend-builder/scaffold.js generators --json',
    '  node xtend-builder/scaffold.js templates --json',
    '  node xtend-builder/scaffold.js component-plan --tag x-example --profile display --json',
    '  node xtend-builder/scaffold.js component-files --tag x-example --profile display --json',
    '  node xtend-builder/scaffold.js component-files --tag x-example --profile display --write --json',
    '  node xtend-builder/scaffold.js component-files --tag x-example --profile display --check --json',
    '  node xtend-builder/scaffold.js typing --tag x-example --profile display --json',
    '  node xtend-builder/scaffold.js preview --tag x-example --profile display --json',
    '  node xtend-builder/scaffold.js extensions --tag x-example --profile display --json',
    '  node xtend-builder/scaffold.js rmt-build --demo demos/xtendrmt/examples/lifecycle/demo.json --write --json',
    '  node xtend-builder/scaffold.js rmt-app-platform --source tests/fixtures/rmt-surface-resource-graph-runtime.rmt --write --json',
    '  node xtend-builder/scaffold.js workflow --json',
    '  node xtend-builder/scaffold.js verify --json',
    '  npm run scaffold -- layout',
    '  npm run scaffold:workflow',
    '  npm run scaffold:verify',
    '  npm run scaffold:dry-run',
    '  npm run scaffold:extensions',
    '',
    'Commands:',
    '  help      Print this help text.',
    '  create app Create a provider-neutral Maraca app or its Material/XTM overlay.',
    '  serve     Serve a local static app host with safe paths, local-only defaults and graceful shutdown.',
    '  layout    Print the reserved scaffold project layout.',
    '  config    Print the current scaffold configuration summary.',
    '  blueprint Print the component blueprint contract.',
    '  generators Print the scaffold generator registry.',
    '  templates Print the scaffold template registry.',
    '  component-plan Create a dry-run component artifact plan.',
    '  component-files Render component artifacts and optionally write them through WritePlan ownership guards.',
    '  typing   Create the dry-run component type and XTendRMT attachment contract.',
    '  preview  Create the dry-run component preview and reference-gate contract.',
    '  extensions Create the dry-run templating, rendering and root-lifecycle extension contract.',
    '  rmt-build Compile an RMT Classic template or --demo manifest into XTend app build artifacts.',
    '  rmt-app-platform Build App Platform diagnostics, source maps and scaffold reports.',
    '  workflow  Print the local dry-run developer workflow.',
    '  verify    Print the local scaffold verification plan.',
    '  validate  Alias for verify.',
    '  maraca plan   Compile an RMT document into a loaderless modern-ESM bundle plan.',
    '  maraca build  Build a loaderless modern-ESM app entry and Maraca reports.',
    '  maraca tune   Evaluate and lock a deterministic Rollup/Terser build configuration.',
    '  rmt build     Build an RMT document; pass --bundle maraca for the one-step Maraca path.',
    '  rmt lint  Lint native .rmt files and fallback .rmt.json files.',
    '  rmt ai-kit export  Export the RMT AI Developer Kit for agent ingest.',
    '  kernel-lab analyze|build  Analyze and assemble clean RMT kernel artifacts from bundled modules and canonical sources.',
    '',
    'Boundary:',
    '  WP-E03-11 standardizes extension-point contracts without productive runtime code.',
    '  Productive file writes must use the WP-E17-01 WritePlan writer and WP-E17-03 structured patchers.'
  ].join('\n');
}

function buildServeHelpText() {
  return [
    'XTend Local App Server',
    '',
    'Usage:',
    '  xt serve [options]',
    '',
    'Options:',
    '  --root <path>       Directory to serve. Default: current working directory',
    '  --default <path>    File served for /. Default: index.html',
    '  --host <host>       Host to bind. Default: 127.0.0.1',
    '  --port <port>       Port to bind; use 0 for an ephemeral port. Default: 4173',
    '  --check             Validate, bind and close immediately.',
    '  --json              Print a machine-readable startup or diagnostic record.',
    '  --help              Show this help.'
  ].join('\n');
}

function printMaracaDiagnostics(stderr, result) {
  const diagnostics = result && result.plan && Array.isArray(result.plan.diagnostics)
    ? result.plan.diagnostics
    : result && Array.isArray(result.diagnostics)
      ? result.diagnostics
      : [];

  diagnostics.forEach((diagnostic) => {
    const severity = diagnostic.severity ? diagnostic.severity.toUpperCase() : 'INFO';
    writeLine(stderr, `${severity} ${diagnostic.code}: ${diagnostic.message}`);
  });
}

function printDiagnostics(stderr, result) {
  const diagnostics = result && Array.isArray(result.diagnostics) ? result.diagnostics : [];
  diagnostics.forEach((diagnostic) => {
    const severity = diagnostic.severity ? String(diagnostic.severity).toUpperCase() : 'INFO';
    const code = diagnostic.code || 'xtend.scaffold.diagnostic';
    const message = diagnostic.message || '';
    writeLine(stderr, `${severity} ${code}: ${message}`);
  });
}

function buildKernelLabHelpText() {
  return [
    'XTend RMT KernelLab Commands',
    '',
    'Usage:',
    '  xt kernel-lab analyze --json',
    '  xt kernel-lab build --profile clean --check --json',
    '  xt kernel-lab build --profile clean --version 0.8.0 --write --json',
    '  xt rmt kernel-lab analyze --json',
    '  xt rmt kernel-lab build --profile clean --version 0.8.0 --write --json',
    '',
    'Commands:',
    '  analyze  Inventory all 26 kernel modules and emit the module manifest report.',
    '  build    Assemble and synchronize seven outputs from bundled modules and canonical sources.',
    '',
    'Options:',
    '  --version <semver>  Set the XTendRMT kernel release version for headers, runtime API and manifest.'
  ].join('\n');
}

function runKernelLabCli(subcommand, rest, options, stdout, stderr) {
  if (subcommand === 'help' || options.help) {
    writeLine(stdout, buildKernelLabHelpText());
    return 0;
  }

  if (subcommand !== 'analyze' && subcommand !== 'build') {
    writeLine(stderr, `Unknown XTend RMT KernelLab command: ${subcommand}`);
    writeLine(stderr, 'Run `xt kernel-lab --help` to see available KernelLab commands.');
    return 1;
  }

  const flags = parseFlagArgs(rest);
  flags.command = subcommand;
  flags.json = options.json || flags.json;
  flags.rootDir = process.cwd();
  const result = runGenerator('rmt-kernel-lab', flags);

  if (flags.json || options.json) {
    writeLine(stdout, JSON.stringify(result, null, 2));
  } else if (result.ok) {
    writeLine(stdout, `XTend RMT KernelLab ${subcommand}: ${result.status}`);
    if (result.moduleManifestPath) writeLine(stdout, `Module manifest: ${result.moduleManifestPath}`);
    if (typeof result.visibleModuleCount === 'number') writeLine(stdout, `Visible modules: ${result.visibleModuleCount}`);
    if (typeof result.changedCount === 'number') writeLine(stdout, `Changed outputs: ${result.changedCount}`);
  } else {
    printDiagnostics(stderr, result);
  }

  return result.ok ? 0 : 1;
}

function normalizeRmtBuildFlags(rest) {
  const flags = parseFlagArgs(rest);
  if (Array.isArray(flags._) && flags._[0] && !flags.source) {
    flags.source = flags._[0];
  }
  return flags;
}

function usesProjectBuild(flags) {
  if (flags.project === true || flags.project === 'true' || flags.sourceSyntax || flags['source-syntax'] || flags.rmtxProvidersFile || flags['rmtx-providers-file'] || /\.rmtx$/iu.test(flags.source || '')) return true;
  const configPath = flags.config || flags.configPath || flags['build-config'];
  if (configPath) {
    try { return JSON.parse(require('node:fs').readFileSync(require('node:path').resolve(process.cwd(), configPath), 'utf8')).schema === 'xtend.maraca.project-config.v1'; }
    catch (_) { return false; }
  }
  return false;
}
function projectSettings(flags) {
  const sourceSyntax = flags.sourceSyntax || flags['source-syntax'];
  return { ...(sourceSyntax ? { sourceSyntax: sourceSyntax === 'rmt' ? 'rmt-vnext' : sourceSyntax } : {}),
    ...(flags.rmtxProvidersFile || flags['rmtx-providers-file'] ? { rmtxProvidersFile: flags.rmtxProvidersFile || flags['rmtx-providers-file'] } : {}),
    rmtxSyntaxVersion: flags.rmtxSyntaxVersion || flags['rmtx-syntax-version'] || '8.0.0', semanticCheck: true };
}
function runProjectCheck(flags, stdout, stderr) {
  const path = require('node:path');
  const { compileRmtProjectSource } = requireLocalOrScoped(__filename, '../../tools/rmt-language/rmt-project', '@ccslabs/xtend-compiler/rmt-language/rmt-project');
  const rootDir = path.resolve(flags.rootDir || flags['root-dir'] || process.cwd());
  const filePath = path.resolve(rootDir, flags.source || flags._?.[0] || 'app.rmt');
  const result = compileRmtProjectSource({ filePath }, { ...projectSettings(flags), rootDir });
  const report = { schema: 'xtend.rmt.project-check.v1', apiVersion: '1.0.0', ok: result.ok, status: result.status, project: result.project, diagnostics: result.diagnostics };
  if (flags.json) writeLine(stdout, JSON.stringify(report, null, 2));
  else {
    for (const diagnostic of report.diagnostics || []) {
      const position = diagnostic.range?.start || { line: 0, character: 0 };
      writeLine(stderr, `${diagnostic.severity || 'error'} ${diagnostic.code} ${diagnostic.filePath || diagnostic.file || filePath}:${position.line + 1}:${position.character + 1} ${diagnostic.message}`);
    }
    if (report.ok) writeLine(stdout, `XTend project checked: ${report.project.entryFile}`);
  }
  return report.ok ? 0 : 1;
}
async function runProjectWatch(flags, stdout, stderr) {
  const { createRmtProjectWatcher } = requireLocalOrScoped(__filename, '../../tools/rmt-language/project-watch', '@ccslabs/xtend-compiler/rmt-language/project-watch');
  let result;
  const watcher = createRmtProjectWatcher({ ...projectSettings(flags), rootDir: flags.rootDir || flags['root-dir'] || process.cwd(),
    entryFile: flags.source || flags._?.[0] || 'app.rmt', intervalMs: flags.interval ? Number(flags.interval) : 200,
    onResult(value) { result = value; const report = { schema: 'xtend.rmt.project-check.v1', apiVersion: '1.0.0', ok: value.ok, status: value.status, project: value.project, diagnostics: value.diagnostics };
      if (flags.json) writeLine(stdout, JSON.stringify(report)); else if (value.ok) writeLine(stdout, `XTend project checked: ${value.project.entryFile}`); else printMaracaDiagnostics(stderr, report); }
  });
  if (flags.once === true || flags.once === 'true') { try { watcher.poll(); return result.ok ? 0 : 1; } finally { watcher.dispose(); } }
  return new Promise((resolve, reject) => {
    const close = () => { watcher.dispose(); process.removeListener('SIGINT', close); process.removeListener('SIGTERM', close); resolve(0); };
    process.once('SIGINT', close); process.once('SIGTERM', close);
    try { watcher.start(); } catch (error) { watcher.dispose(); process.removeListener('SIGINT', close); process.removeListener('SIGTERM', close); reject(error); }
  });
}

function buildConfigSummary() {
  return {
    schema: CLI_SCHEMA,
    scaffoldName: config.scaffoldName,
    role: config.scaffoldRole,
    runtimeBoundary: config.runtimeBoundary,
    entryPoints: config.entryPoints,
    moduleLayout: config.moduleLayout,
    blueprints: config.blueprints,
    generators: config.generators,
    templates: config.templateLoader,
    typing: config.typing,
    preview: config.preview,
    rmtAppBuild: config.rmtAppBuild,
    materialAppScaffold: config.materialAppScaffold,
    rmtAppPlatformTooling: config.rmtAppPlatformTooling,
    rmtCompatibility: config.rmtCompatibility,
    extensions: config.extensions,
    workflows: config.workflows,
    wiring: config.wiring,
    tooling: config.tooling
  };
}

function printCommandList(stdout, title, commands) {
  writeLine(stdout, title);
  writeLine(stdout, '');
  commands.forEach((entry) => {
    writeLine(stdout, `${entry.id.padEnd(16)} ${entry.command}`);
    writeLine(stdout, `  ${entry.purpose}`);
  });
}

function runCli(args = process.argv.slice(2), io = {}) {
  const stdout = io.stdout || process.stdout;
  const stderr = io.stderr || process.stderr;
  const options = parseArgs(args);
  const command = normalizeCommand(options.command || (options.help ? 'help' : 'help'));

  if (command === 'index') {
    const { runProjectIndexCli } = requireLocalOrScoped(__filename, '../../tools/project-index/cli', '@ccslabs/xtend-compiler/project-index/cli');
    return runProjectIndexCli(options.rest.concat(options.json ? ['--json'] : [], options.help ? ['--help'] : []), { stdout, stderr });
  }

  if (command === 'help' || (options.help && command !== 'create' && command !== 'serve' && command !== 'rmt' && command !== 'maraca')) {
    writeLine(stdout, buildHelpText());
    return 0;
  }

  if (command === 'layout') {
    const layout = getScaffoldLayout();
    if (options.json) {
      writeLine(stdout, JSON.stringify({
        schema: LAYOUT_SCHEMA,
        scaffoldName: config.scaffoldName,
        layout
      }, null, 2));
      return 0;
    }

    writeLine(stdout, 'XTend-Scaffold Layout');
    writeLine(stdout, '');
    writeLine(stdout, formatScaffoldLayout(layout));
    return 0;
  }

  if (command === 'config') {
    const summary = buildConfigSummary();
    if (options.json) {
      writeLine(stdout, JSON.stringify(summary, null, 2));
      return 0;
    }

    writeLine(stdout, `${summary.scaffoldName}: ${summary.role}`);
    writeLine(stdout, `Runtime boundary: ${summary.runtimeBoundary}`);
    writeLine(stdout, `CLI entry point: ${summary.entryPoints && summary.entryPoints.cli}`);
    writeLine(stdout, `Legacy CLI entry point: ${summary.entryPoints && summary.entryPoints.legacyCli}`);
    return 0;
  }

  if (command === 'create') {
    const subcommand = options.rest[0] || 'help';
    if (subcommand === 'help' || options.help) {
      writeLine(stdout, [
        'XTend App Scaffold',
        '',
        'Usage:',
        '  xt create app --runtime maraca --design-kit none --server both --out rmt-app --write --json',
        '  xt create app --runtime maraca --design-kit none --source-syntax rmtx --out rmtx-app --write --json',
        '  xt create app --runtime maraca --design-kit material --server both --out material-app --write --json',
        '  xt create app --runtime maraca --design-kit material --server none --out material-app --check --json',
        '',
        'Base preset:',
        '  --design-kit none, native or neutral generates RMT, free CSS and TypeScript AppServices without product bootstrap wiring.',
        '',
        'Material/XTM overlay:',
        '  Generates RMT, CSS, TypeScript AppServices, optional Node/PHP handlers, HTML/runtime hosts, config, package and smoke test.',
        '  --server accepts none, node, php or both; both is the default.',
        '  The generated npm run serve builds first, then serves site/index.html through xt serve.',
        '  Uses cssProvider=tailwind with explicit local sources and disabled Preflight.',
        '  Dry-run is the default; --write records ownership and --check detects drift.',
        '  Other design-kit presets never activate or install Tailwind through this command.'
      ].join('\n'));
      return 0;
    }
    if (subcommand !== 'app') {
      writeLine(stderr, `Unknown XTend create command: ${subcommand}`);
      writeLine(stderr, 'Run `xt create --help` to see available app presets.');
      return 1;
    }
    const flags = parseFlagArgs(options.rest.slice(1));
    flags.json = options.json || flags.json;
    flags.rootDir = process.cwd();
    const designKit = String(flags['design-kit'] || flags.designKit || 'none').toLowerCase();
    if ((designKit === 'material' || designKit === 'xtm') && (flags.sourceSyntax === 'rmtx' || flags['source-syntax'] === 'rmtx')) {
      const report = { schema: 'xtend.scaffold.app-preset.rmt-report.v2', ok: false, status: 'blocked', errors: ['The RMTX scaffold uses the provider-neutral native preset; Material templates remain a separate Classic preset.'] };
      if (flags.json) writeLine(stdout, JSON.stringify(report)); else report.errors.forEach(error => writeLine(stderr, error));
      return 1;
    }
    const generator = designKit === 'material' || designKit === 'xtm' ? 'material-app' : 'rmt-app';
    const result = runGenerator(generator, flags);
    if (flags.json || options.json) {
      writeLine(stdout, JSON.stringify(result, null, 2));
    } else if (result.ok) {
      writeLine(stdout, `XTend ${generator === 'material-app' ? 'Material ' : ''}App Scaffold: ${result.status}`);
      writeLine(stdout, `Output: ${result.outputDir}`);
      result.files.forEach((file) => writeLine(stdout, `${file.action.padEnd(10)} ${file.path}`));
      (result.diagnostics || []).forEach((diagnostic) => {
        writeLine(stderr, `${String(diagnostic.severity || 'info').toUpperCase()} ${diagnostic.code}: ${diagnostic.message}`);
        if (diagnostic.repairHint) writeLine(stderr, `  Repair: ${diagnostic.repairHint}`);
      });
    } else {
      (result.diagnostics || []).forEach((diagnostic) => {
        writeLine(stderr, `${String(diagnostic.severity || 'info').toUpperCase()} ${diagnostic.code}: ${diagnostic.message}`);
        if (diagnostic.repairHint) writeLine(stderr, `  Repair: ${diagnostic.repairHint}`);
      });
      (result.errors || []).forEach((error) => writeLine(stderr, error));
    }
    return result.ok ? 0 : 1;
  }

  if (command === 'blueprint') {
    const blueprint = getComponentBlueprintContract();
    if (options.json) {
      writeLine(stdout, JSON.stringify(blueprint, null, 2));
      return 0;
    }

    writeLine(stdout, 'XTend-Scaffold Component Blueprint');
    writeLine(stdout, '');
    blueprint.artifacts.forEach((artifact) => {
      writeLine(stdout, `${artifact.id.padEnd(10)} ${String(artifact.required).padEnd(11)} ${artifact.pathTemplate}`);
    });
    return 0;
  }

  if (command === 'generators') {
    const registry = getGeneratorRegistry();
    if (options.json) {
      writeLine(stdout, JSON.stringify(registry, null, 2));
      return 0;
    }

    writeLine(stdout, 'XTend-Scaffold Generators');
    writeLine(stdout, '');
    registry.generators.forEach((generator) => {
      writeLine(stdout, `${generator.command.padEnd(16)} ${generator.status.padEnd(10)} ${generator.description}`);
    });
    return 0;
  }

  if (command === 'templates') {
    const registry = getTemplateRegistry();
    if (options.json) {
      writeLine(stdout, JSON.stringify(registry, null, 2));
      return 0;
    }

    writeLine(stdout, 'XTend-Scaffold Templates');
    writeLine(stdout, '');
    registry.templates.forEach((template) => {
      writeLine(stdout, `${template.id.padEnd(26)} ${template.status.padEnd(22)} ${template.path}`);
    });
    return 0;
  }

  if (command === 'component-plan') {
    const plan = runGenerator('component', parseFlagArgs(options.rest));
    if (!plan.ok) {
      if (options.json) {
        writeLine(stdout, JSON.stringify(plan, null, 2));
      } else {
        plan.errors.forEach((error) => writeLine(stderr, error));
      }
      return 1;
    }

    if (options.json) {
      writeLine(stdout, JSON.stringify(plan, null, 2));
      return 0;
    }

    writeLine(stdout, `XTend-Scaffold Component Plan: ${plan.input.tag}`);
    writeLine(stdout, '');
    plan.artifacts.forEach((artifact) => {
      writeLine(stdout, `${artifact.id.padEnd(10)} ${artifact.action.padEnd(11)} ${artifact.targetPath}`);
    });
    return 0;
  }

  if (command === 'component-files') {
    const result = runGenerator('component-files', parseFlagArgs(options.rest));
    if (!result.ok) {
      if (options.json) {
        writeLine(stdout, JSON.stringify(result, null, 2));
      } else {
        result.errors.forEach((error) => writeLine(stderr, error));
      }
      return 1;
    }

    if (options.json) {
      writeLine(stdout, JSON.stringify(result, null, 2));
      return 0;
    }

    writeLine(stdout, `XTend-Scaffold Component Files: ${result.input.tag}`);
    writeLine(stdout, '');
    result.files.forEach((file) => {
      writeLine(stdout, `${file.id.padEnd(10)} ${file.targetPath}`);
    });
    return 0;
  }

  if (command === 'typing') {
    const result = runGenerator('component-typing', parseFlagArgs(options.rest));
    if (!result.ok) {
      if (options.json) {
        writeLine(stdout, JSON.stringify(result, null, 2));
      } else {
        result.errors.forEach((error) => writeLine(stderr, error));
      }
      return 1;
    }

    if (options.json) {
      writeLine(stdout, JSON.stringify(result, null, 2));
      return 0;
    }

    writeLine(stdout, `XTend-Scaffold Component Typing: ${result.component.tag}`);
    writeLine(stdout, '');
    writeLine(stdout, `${result.artifact.id.padEnd(10)} ${result.artifact.targetPath}`);
    writeLine(stdout, `${'adapter'.padEnd(10)} ${result.rmtAttachment.adapter}`);
    return 0;
  }

  if (command === 'preview') {
    const result = runGenerator('component-preview', parseFlagArgs(options.rest));
    if (!result.ok) {
      if (options.json) {
        writeLine(stdout, JSON.stringify(result, null, 2));
      } else {
        result.errors.forEach((error) => writeLine(stderr, error));
      }
      return 1;
    }

    if (options.json) {
      writeLine(stdout, JSON.stringify(result, null, 2));
      return 0;
    }

    writeLine(stdout, `XTend-Scaffold Component Preview: ${result.component.tag}`);
    writeLine(stdout, '');
    writeLine(stdout, `${result.artifact.id.padEnd(10)} ${result.artifact.targetPath}`);
    writeLine(stdout, `${'registry'.padEnd(10)} ${result.registry.document}`);
    return 0;
  }

  if (command === 'extensions') {
    const result = runGenerator('component-extensions', parseFlagArgs(options.rest));
    if (!result.ok) {
      if (options.json) {
        writeLine(stdout, JSON.stringify(result, null, 2));
      } else {
        result.errors.forEach((error) => writeLine(stderr, error));
      }
      return 1;
    }

    if (options.json) {
      writeLine(stdout, JSON.stringify(result, null, 2));
      return 0;
    }

    writeLine(stdout, `XTend-Scaffold Component Extensions: ${result.component.tag}`);
    writeLine(stdout, '');
    writeLine(stdout, `${'lifecycle'.padEnd(12)} ${result.rootLifecycle.schema}`);
    writeLine(stdout, `${'template'.padEnd(12)} ${result.templating.adapter}`);
    writeLine(stdout, `${'rendering'.padEnd(12)} ${result.rendering.scheduleHint}`);
    return 0;
  }

  if (command === 'rmt-build') {
    const result = runGenerator('rmt-build', parseFlagArgs(options.rest));
    if (!result.ok) {
      if (options.json) {
        writeLine(stdout, JSON.stringify(result, null, 2));
      } else {
        result.errors.forEach((error) => writeLine(stderr, error));
      }
      return 1;
    }

    if (options.json) {
      writeLine(stdout, JSON.stringify({
        ...result,
        outputs: result.outputs.map((output) => ({
          id: output.id,
          path: output.path,
          kind: output.kind,
          generated: output.generated,
          sha256: output.sha256
        }))
      }, null, 2));
      return 0;
    }

    writeLine(stdout, `XTend-Scaffold RMT Build: ${result.status}`);
    writeLine(stdout, '');
    result.outputs.forEach((output) => {
      writeLine(stdout, `${output.id.padEnd(20)} ${output.path}`);
    });
    return 0;
  }

  if (command === 'kernel-lab') {
    const subcommand = options.rest[0] || 'help';
    return runKernelLabCli(subcommand, options.rest.slice(1), options, stdout, stderr);
  }

  if (command === 'maraca') {
    const subcommand = options.rest[0] || 'help';
    const flags = normalizeRmtBuildFlags(options.rest.slice(1));
    flags.json = options.json || flags.json;

    if (subcommand === 'plan') {
      const modern = usesProjectBuild(flags);
      const result = (modern ? createMaracaProjectBuildPlan : createMaracaBuildPlan)(flags, { rootDir: process.cwd() });
      const plan = modern ? result.plan : result;
      if (flags.json || options.json) {
        writeLine(stdout, JSON.stringify(result, null, 2));
      } else if (result.ok) {
        writeLine(stdout, `XTend Maraca Plan: ${result.status}`);
        writeLine(stdout, `Source: ${plan.source}`);
        writeLine(stdout, `Components: ${plan.components.requiredTags.join(', ') || 'none'}`);
        writeLine(stdout, `Output: ${plan.outputDir}`);
      } else {
        printMaracaDiagnostics(stderr, result);
      }
      return result.ok ? 0 : 1;
    }

    if (subcommand === 'build') {
      const modern = usesProjectBuild(flags);
      const result = (modern ? buildMaracaProjectBundle : buildMaracaBundle)(flags, { rootDir: process.cwd() });
      const build = modern ? result.build : result;
      if (flags.json || options.json) {
        writeLine(stdout, JSON.stringify(result, null, 2));
      } else if (result.ok) {
        writeLine(stdout, `XTend Maraca Build: ${result.status}`);
        writeLine(stdout, `Entry: ${build.bundleReport.entry}`);
        writeLine(stdout, `Host: ${build.plan.outputs.host}`);
        writeLine(stdout, `Serve: xt serve --root ${build.bundleReport.outputDir}`);
        writeLine(stdout, `Bundle bytes: ${build.bundleReport.bytes}`);
      } else {
        printMaracaDiagnostics(stderr, result);
      }
      return result.ok ? 0 : 1;
    }

    if (subcommand === 'help' || options.help) {
      writeLine(stdout, [
        'XTend Maraca Commands',
        '',
        'Usage:',
        '  xt maraca plan app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --json',
        '  xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --out dist --profile production --lazy route --css inline --css-provider maraca-native --pwa --json',
        '  xt maraca build app.rmt --out dist --manifest --json',
        '  xt maraca build app.rmt --vendor xtend --out products/xtend-vendor-maraca --lazy none --json',
        '  xt maraca tune app.rmt --config maraca.config.json --out dist --write --json',
        '',
        'Commands:',
        '  plan   Compile an RMT document into a loaderless modern-ESM bundle plan.',
        '  build  Build a loaderless modern-ESM app entry and Maraca reports.',
        '  tune   Evaluate twelve production candidates and write or check a build config.',
        '',
        'CSS provider options:',
        '  --css-provider <id>              Build-time CSS provider (default: maraca-native).',
        '  --css-input <path>               Explicit provider input stylesheet.',
        '  --css-sources <paths>            Comma-separated content/source paths.',
        '  --css-preflight <mode>           disabled, scoped, or enabled.',
        '  --css-budget <bytes>              Maximum provider CSS bytes.',
        '  --css-provider-fallback native   Explicit fallback; omitted means fail closed.',
        '',
        'AppServices options:',
        '  --services <true|false>           Enable defaults or preserve the legacy no-services path.',
        '  --services-entry <path>           Browser/local service entry (default: src/services.ts).',
        '  --server-services-entry <path>    Node-only service entry (default: src/server-services.ts).',
        '  --php-services-entry <path>       PHP callable registry (default: server/server-services.php).',
        '  --service-targets <targets>       Comma-separated browser,node,php target list.',
        '  --services-strict <true|false>    Error or compatibility diagnostics for service drift.'
      ].join('\n'));
      return 0;
    }

    writeLine(stderr, `Unknown XTend Maraca command: ${subcommand}`);
    writeLine(stderr, 'Run `xt maraca --help` to see available Maraca commands.');
    return 1;
  }

  if (command === 'rmt-app-platform') {
    const result = runGenerator('rmt-app-platform', parseFlagArgs(options.rest));
    if (!result.ok) {
      if (options.json) {
        writeLine(stdout, JSON.stringify(result, null, 2));
      } else {
        result.diagnostics && result.diagnostics.length
          ? result.diagnostics.forEach((diagnostic) => writeLine(stderr, `${diagnostic.severity.toUpperCase()} ${diagnostic.code}: ${diagnostic.message}`))
          : (result.errors || []).forEach((error) => writeLine(stderr, error));
      }
      return 1;
    }

    if (options.json) {
      writeLine(stdout, JSON.stringify({
        ...result,
        outputs: result.outputs.map((output) => ({
          id: output.id,
          path: output.path,
          kind: output.kind,
          generated: output.generated
        }))
      }, null, 2));
      return 0;
    }

    writeLine(stdout, `XTend-Scaffold RMT App Platform: ${result.status}`);
    writeLine(stdout, '');
    result.outputs.forEach((output) => {
      writeLine(stdout, `${output.id.padEnd(20)} ${output.path}`);
    });
    return 0;
  }

  if (command === 'workflow') {
    const workflow = createDeveloperWorkflow(parseFlagArgs(options.rest));
    if (options.json) {
      writeLine(stdout, JSON.stringify(workflow, null, 2));
      return 0;
    }

    printCommandList(stdout, 'XTend-Scaffold Developer Workflow', workflow.entryPoints);
    return 0;
  }

  if (command === 'verify') {
    const verifyPlan = createVerifyPlan(parseFlagArgs(options.rest));
    if (options.json) {
      writeLine(stdout, JSON.stringify(verifyPlan, null, 2));
      return 0;
    }

    printCommandList(stdout, 'XTend-Scaffold Verify Plan', verifyPlan.commands);
    return 0;
  }

  if (command === 'rmt') {
    const subcommand = options.rest[0] || 'help';

    if (subcommand === 'check') {
      const flags = normalizeRmtBuildFlags(options.rest.slice(1)); flags.json = options.json || flags.json;
      return runProjectCheck(flags, stdout, stderr);
    }

    if (subcommand === 'kernel-lab') {
      const kernelLabSubcommand = options.rest[1] || 'help';
      return runKernelLabCli(kernelLabSubcommand, options.rest.slice(2), options, stdout, stderr);
    }

    if (subcommand === 'build') {
      const flags = normalizeRmtBuildFlags(options.rest.slice(1));
      flags.json = options.json || flags.json;

      if (flags.bundle === 'maraca' || flags.maraca === true || usesProjectBuild(flags)) {
        const modern = usesProjectBuild(flags);
        const result = (modern ? buildMaracaProjectBundle : buildMaracaBundle)(flags, { rootDir: process.cwd() });
        const build = modern ? result.build : result;
        if (flags.json || options.json) {
          writeLine(stdout, JSON.stringify(result, null, 2));
        } else if (result.ok) {
          writeLine(stdout, `XTend RMT Maraca Build: ${result.status}`);
          writeLine(stdout, `Entry: ${build.bundleReport.entry}`);
          writeLine(stdout, `Host: ${build.plan.outputs.host}`);
          writeLine(stdout, `Serve: xt serve --root ${build.bundleReport.outputDir}`);
        } else {
          printMaracaDiagnostics(stderr, result);
        }
        return result.ok ? 0 : 1;
      }

      const result = runGenerator('rmt-build', flags);
      if (!result.ok) {
        if (options.json) {
          writeLine(stdout, JSON.stringify(result, null, 2));
        } else {
          result.errors.forEach((error) => writeLine(stderr, error));
        }
        return 1;
      }

      if (options.json) {
        writeLine(stdout, JSON.stringify(result, null, 2));
        return 0;
      }

      writeLine(stdout, `XTend RMT Build: ${result.status}`);
      return 0;
    }

    if (subcommand === 'lint') {
      const linterArgs = options.help ? options.rest.concat('--help') : options.rest;
      return runRmtLinterCli(linterArgs, {
        stdout,
        stderr,
        json: options.json,
        rootDir: process.cwd()
      });
    }

    if (subcommand === 'ai-kit') {
      const aiKitSubcommand = options.rest[1] || 'help';
      if (aiKitSubcommand === 'export') {
        const flags = parseFlagArgs(options.rest.slice(2));
        flags.json = options.json || flags.json;
        const result = exportRmtAiDeveloperKit({
          rootDir: process.cwd(),
          profile: flags.profile || 'full',
          format: flags.format || 'all',
          out: flags.out || flags.outputDir
        });

        if (flags.json || options.json) {
          writeLine(stdout, JSON.stringify(result, null, 2));
        } else {
          writeLine(stdout, `XTend RMT AI Developer Kit: ${result.status}`);
          result.outputs.forEach((output) => writeLine(stdout, `${output.id.padEnd(12)} ${output.path}`));
        }
        return result.ok ? 0 : 1;
      }

      if (aiKitSubcommand === 'help' || options.help) {
        writeLine(stdout, [
          'XTend RMT AI Kit Commands',
          '',
          'Usage:',
          '  xt rmt ai-kit export --profile compact --format md --json',
          '  xt rmt ai-kit export --profile full --format jsonl --out tools/rmt-language/generated/rmt-ai-developer-kit --json',
          '',
          'Commands:',
          '  export  Export the multi-format RMT AI Developer Kit.'
        ].join('\n'));
        return 0;
      }

      writeLine(stderr, `Unknown XTend RMT AI Kit command: ${aiKitSubcommand}`);
      writeLine(stderr, 'Run `xt rmt ai-kit --help` to see available AI Kit commands.');
      return 1;
    }

    if (subcommand === 'help' || options.help) {
      writeLine(stdout, [
        'XTend RMT Commands',
        '',
        'Usage:',
        '  xt rmt build app.rmt --bundle maraca --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --out dist --json',
        '  xt rmt lint app.rmt',
        '  xt rmt lint app.rmt --json',
        '  xt rmt ai-kit export --profile compact --format md --json',
        '  xt rmt ai-kit export --profile full --format jsonl --out tools/rmt-language/generated/rmt-ai-developer-kit --json',
        '  xt rmt kernel-lab analyze --json',
        '  xt rmt kernel-lab build --profile clean --check --json',
        '  xt rmt kernel-lab build --profile clean --version 0.8.0 --write --json',
        '  xt rmt lint tests/fixtures --fail-on warning',
        '  xt rmt lint app.rmt --format problem-matcher',
        '',
        'Commands:',
        '  build Build an RMT document; pass --bundle maraca for a loaderless ESM app bundle.',
        '  lint  Run the native RMT linter.',
        '  ai-kit export  Export the RMT AI Developer Kit for agent ingest.',
        '  kernel-lab analyze|build  Analyze and assemble clean RMT kernel artifacts from bundled modules and canonical sources.'
      ].join('\n'));
      return 0;
    }

    writeLine(stderr, `Unknown XTend RMT command: ${subcommand}`);
    writeLine(stderr, 'Run `xt rmt --help` to see available RMT commands.');
    return 1;
  }

  writeLine(stderr, `Unknown XTend-Scaffold command: ${command}`);
  writeLine(stderr, 'Run `xt --help` or `node xtend-builder/scaffold.js --help` to see available commands.');
  return 1;
}

async function runCliAsync(args = process.argv.slice(2), io = {}) {
  const stdout = io.stdout || process.stdout;
  const stderr = io.stderr || process.stderr;
  const options = parseArgs(args);
  const command = normalizeCommand(options.command || (options.help ? 'help' : 'help'));

  if (command === 'pages') {
    const { runPageBuildCli } = requireLocalOrScoped(__filename, '../../tools/rmt-language/page-build', '@ccslabs/xtend-compiler/rmt-language/page-build');
    return runPageBuildCli([...options.rest, ...(options.help ? ['--help'] : []), ...(options.json ? ['--json'] : [])], { stdout, stderr });
  }

  if (command === 'serve') {
    if (options.help) {
      writeLine(stdout, buildServeHelpText());
      return 0;
    }
    const flags = parseFlagArgs(options.rest);
    flags.json = options.json || flags.json;
    const normalized = normalizeServeOptions(flags, { rootDir: process.cwd() });
    if (!normalized.ok) {
      const failure = { schema: SERVER_CONTRACT, ok: false, status: 'blocked', diagnostics: normalized.errors.map((message) => ({ severity: 'error', message })) };
      if (flags.json) writeLine(stdout, JSON.stringify(failure));
      else normalized.errors.forEach((message) => writeLine(stderr, `ERROR: ${message}`));
      return 1;
    }

    let handle;
    try {
      handle = await listenXtendDevServer(normalized.value);
      const payload = {
        schema: SERVER_CONTRACT,
        ok: true,
        status: normalized.value.check ? 'checked' : 'serving',
        origin: handle.origin,
        host: handle.host,
        port: handle.port,
        rootDir: handle.rootDir,
        defaultPath: handle.defaultPath,
        check: normalized.value.check
      };
      if (normalized.value.json) writeLine(stdout, JSON.stringify(payload));
      else {
        writeLine(stdout, `XTend local app server running at ${handle.origin}/`);
        writeLine(stdout, `Serving ${handle.rootDir} (default: ${handle.defaultPath})`);
      }
      if (normalized.value.check) await closeServer(handle.server);
      else await waitForServerShutdown(handle.server);
      return 0;
    } catch (error) {
      if (handle && handle.server) await closeServer(handle.server).catch(() => {});
      const message = error && error.message ? error.message : String(error);
      const failure = { schema: SERVER_CONTRACT, ok: false, status: 'blocked', diagnostics: [{ severity: 'error', message }] };
      if (normalized.value.json) writeLine(stdout, JSON.stringify(failure));
      else writeLine(stderr, `ERROR: ${message}`);
      return 1;
    }
  }

  if (command === 'maraca') {
    const subcommand = options.rest[0] || 'help';
    const flags = normalizeRmtBuildFlags(options.rest.slice(1));
    flags.json = options.json || flags.json;

    if (subcommand === 'build') {
      const modern = usesProjectBuild(flags);
      const result = await (modern ? buildMaracaProjectBundleAsync : buildMaracaBundleAsync)(flags, { rootDir: process.cwd() });
      const build = modern ? result.build : result;
      if (flags.json || options.json) {
        writeLine(stdout, JSON.stringify(result, null, 2));
      } else if (result.ok) {
        writeLine(stdout, `XTend Maraca Build: ${result.status}`);
        writeLine(stdout, `Entry: ${build.bundleReport.entry}`);
        writeLine(stdout, `Host: ${build.plan.outputs.host}`);
        writeLine(stdout, `Serve: xt serve --root ${build.bundleReport.outputDir}`);
        writeLine(stdout, `Bundle bytes: ${build.bundleReport.bytes}`);
      } else {
        printMaracaDiagnostics(stderr, result);
      }
      return result.ok ? 0 : 1;
    }

    if (subcommand === 'tune') {
      if (usesProjectBuild(flags)) {
        const result = { schema: 'xtend.maraca.project-build-result.v1', apiVersion: '1.0.0', ok: false, status: 'project_tune_unavailable', project: null, build: null,
          diagnostics: [{ code: 'xtend.maraca.project.tune_unavailable', severity: 'error', message: 'Project builds require their explicit project configuration; legacy single-source tune does not lock transitive project inputs.' }] };
        if (flags.json) writeLine(stdout, JSON.stringify(result)); else printMaracaDiagnostics(stderr, result);
        return 1;
      }
      const result = await tuneMaracaBuild(flags, { rootDir: process.cwd() });
      if (flags.json || options.json) {
        writeLine(stdout, JSON.stringify(result, null, 2));
      } else if (result.ok) {
        writeLine(stdout, `XTend Maraca Tune: ${result.status}`);
        writeLine(stdout, `Selected: ${result.selected.id}`);
        writeLine(stdout, `Config: ${result.configPath}`);
      } else {
        printMaracaDiagnostics(stderr, result);
      }
      return result.ok ? 0 : 1;
    }
  }

  if (command === 'rmt') {
    const subcommand = options.rest[0] || 'help';

    if (subcommand === 'watch') {
      const flags = normalizeRmtBuildFlags(options.rest.slice(1)); flags.json = options.json || flags.json;
      return runProjectWatch(flags, stdout, stderr);
    }

    if (subcommand === 'build') {
      const flags = normalizeRmtBuildFlags(options.rest.slice(1));
      flags.json = options.json || flags.json;

      if (flags.bundle === 'maraca' || flags.maraca === true || usesProjectBuild(flags)) {
        const modern = usesProjectBuild(flags);
        const result = await (modern ? buildMaracaProjectBundleAsync : buildMaracaBundleAsync)(flags, { rootDir: process.cwd() });
        const build = modern ? result.build : result;
        if (flags.json || options.json) {
          writeLine(stdout, JSON.stringify(result, null, 2));
        } else if (result.ok) {
          writeLine(stdout, `XTend RMT Maraca Build: ${result.status}`);
          writeLine(stdout, `Entry: ${build.bundleReport.entry}`);
          writeLine(stdout, `Host: ${build.plan.outputs.host}`);
          writeLine(stdout, `Serve: xt serve --root ${build.bundleReport.outputDir}`);
        } else {
          printMaracaDiagnostics(stderr, result);
        }
        return result.ok ? 0 : 1;
      }
    }
  }

  return runCli(args, io);
}

module.exports = {
  COMMAND_ALIASES,
  buildConfigSummary,
  buildHelpText,
  buildServeHelpText,
  normalizeCommand,
  parseArgs,
  parseFlagArgs,
  runCli,
  runCliAsync
};
