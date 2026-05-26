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
  createMaracaBuildPlan
} = requireLocalOrScoped(
  __filename,
  '../../xtend-maraca',
  '@ccslabs/xtend-maraca'
);

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
    '  xt validate --json',
    '  xt maraca plan app.rmt --json',
    '  xt maraca build app.rmt --out dist --profile production --lazy route --css inline --json',
    '  xt maraca build app.rmt --vendor xtend --out products/xtend-vendor-maraca --lazy none --json',
    '  xt rmt build app.rmt --bundle maraca --out dist --json',
    '  xt rmt lint app.rmt --json',
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
    '  node xtend-builder/scaffold.js rmt-lifecycle-demo --write --json',
    '  node xtend-builder/scaffold.js rmt-build --source xtendrmt/rmt-lifecycle-demo.rmt --write --json',
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
    '  rmt-lifecycle-demo Compile the vNext RMT lifecycle template and build the generated demo app.',
    '  rmt-build Compile an RMT vNext template into XTend app build artifacts.',
    '  rmt-app-platform Build App Platform diagnostics, source maps and scaffold reports.',
    '  workflow  Print the local dry-run developer workflow.',
    '  verify    Print the local scaffold verification plan.',
    '  validate  Alias for verify.',
    '  maraca plan   Compile an RMT document into a loaderless modern-ESM bundle plan.',
    '  maraca build  Build a loaderless modern-ESM app entry and Maraca reports.',
    '  rmt build     Build an RMT document; pass --bundle maraca for the one-step Maraca path.',
    '  rmt lint  Lint native .rmt files and fallback .rmt.json files.',
    '',
    'Boundary:',
    '  WP-E03-11 standardizes extension-point contracts without productive runtime code.',
    '  Productive file writes must use the WP-E17-01 WritePlan writer and WP-E17-03 structured patchers.'
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

function normalizeRmtBuildFlags(rest) {
  const flags = parseFlagArgs(rest);
  if (Array.isArray(flags._) && flags._[0] && !flags.source) {
    flags.source = flags._[0];
  }
  return flags;
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

  if (command === 'help' || (options.help && command !== 'rmt' && command !== 'maraca')) {
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

  if (command === 'rmt-lifecycle-demo') {
    const result = runGenerator('rmt-lifecycle-demo', parseFlagArgs(options.rest));
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

    writeLine(stdout, `XTend-Scaffold RMT Lifecycle Demo: ${result.status}`);
    writeLine(stdout, '');
    result.outputs.forEach((output) => {
      writeLine(stdout, `${output.id.padEnd(20)} ${output.path}`);
    });
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

  if (command === 'maraca') {
    const subcommand = options.rest[0] || 'help';
    const flags = normalizeRmtBuildFlags(options.rest.slice(1));
    flags.json = options.json || flags.json;

    if (subcommand === 'plan') {
      const result = createMaracaBuildPlan(flags, { rootDir: process.cwd() });
      if (flags.json || options.json) {
        writeLine(stdout, JSON.stringify(result, null, 2));
      } else if (result.ok) {
        writeLine(stdout, `XTend Maraca Plan: ${result.status}`);
        writeLine(stdout, `Source: ${result.source}`);
        writeLine(stdout, `Components: ${result.components.requiredTags.join(', ') || 'none'}`);
        writeLine(stdout, `Output: ${result.outputDir}`);
      } else {
        printMaracaDiagnostics(stderr, result);
      }
      return result.ok ? 0 : 1;
    }

    if (subcommand === 'build') {
      const result = buildMaracaBundle(flags, { rootDir: process.cwd() });
      if (flags.json || options.json) {
        writeLine(stdout, JSON.stringify(result, null, 2));
      } else if (result.ok) {
        writeLine(stdout, `XTend Maraca Build: ${result.status}`);
        writeLine(stdout, `Entry: ${result.bundleReport.entry}`);
        writeLine(stdout, `Bundle bytes: ${result.bundleReport.bytes}`);
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
        '  xt maraca plan app.rmt --json',
        '  xt maraca build app.rmt --out dist --profile production --lazy route --css inline --json',
        '  xt maraca build app.rmt --vendor xtend --out products/xtend-vendor-maraca --lazy none --json',
        '',
        'Commands:',
        '  plan   Compile an RMT document into a loaderless modern-ESM bundle plan.',
        '  build  Build a loaderless modern-ESM app entry and Maraca reports.'
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

    if (subcommand === 'build') {
      const flags = normalizeRmtBuildFlags(options.rest.slice(1));
      flags.json = options.json || flags.json;

      if (flags.bundle === 'maraca' || flags.maraca === true) {
        const result = buildMaracaBundle(flags, { rootDir: process.cwd() });
        if (flags.json || options.json) {
          writeLine(stdout, JSON.stringify(result, null, 2));
        } else if (result.ok) {
          writeLine(stdout, `XTend RMT Maraca Build: ${result.status}`);
          writeLine(stdout, `Entry: ${result.bundleReport.entry}`);
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

    if (subcommand === 'help' || options.help) {
      writeLine(stdout, [
        'XTend RMT Commands',
        '',
        'Usage:',
        '  xt rmt build app.rmt --bundle maraca --out dist --json',
        '  xt rmt lint app.rmt',
        '  xt rmt lint app.rmt --json',
        '  xt rmt lint tests/fixtures --fail-on warning',
        '  xt rmt lint app.rmt --format problem-matcher',
        '',
        'Commands:',
        '  build Build an RMT document; pass --bundle maraca for a loaderless ESM app bundle.',
        '  lint  Run the native RMT linter.'
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

  if (command === 'maraca') {
    const subcommand = options.rest[0] || 'help';
    const flags = normalizeRmtBuildFlags(options.rest.slice(1));
    flags.json = options.json || flags.json;

    if (subcommand === 'build') {
      const result = await buildMaracaBundleAsync(flags, { rootDir: process.cwd() });
      if (flags.json || options.json) {
        writeLine(stdout, JSON.stringify(result, null, 2));
      } else if (result.ok) {
        writeLine(stdout, `XTend Maraca Build: ${result.status}`);
        writeLine(stdout, `Entry: ${result.bundleReport.entry}`);
        writeLine(stdout, `Bundle bytes: ${result.bundleReport.bytes}`);
      } else {
        printMaracaDiagnostics(stderr, result);
      }
      return result.ok ? 0 : 1;
    }
  }

  if (command === 'rmt') {
    const subcommand = options.rest[0] || 'help';

    if (subcommand === 'build') {
      const flags = normalizeRmtBuildFlags(options.rest.slice(1));
      flags.json = options.json || flags.json;

      if (flags.bundle === 'maraca' || flags.maraca === true) {
        const result = await buildMaracaBundleAsync(flags, { rootDir: process.cwd() });
        if (flags.json || options.json) {
          writeLine(stdout, JSON.stringify(result, null, 2));
        } else if (result.ok) {
          writeLine(stdout, `XTend RMT Maraca Build: ${result.status}`);
          writeLine(stdout, `Entry: ${result.bundleReport.entry}`);
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
  normalizeCommand,
  parseArgs,
  parseFlagArgs,
  runCli,
  runCliAsync
};
