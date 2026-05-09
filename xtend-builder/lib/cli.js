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
  runRmtLinterCli
} = require('../../tools/rmt-linter/cli');

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
    '  xt rmt lint app.rmt --json',
    '  xt rmt lint tests/fixtures',
    '  xt component-files --tag x-example --profile display --json',
    '  xtend validate --json',
    '  xtend rmt lint app.rmt',
    '  xtend-scaffold verify --json',
    '  node xtend-builder/scaffold.js --help',
    '  node xtend-builder/scaffold.js layout',
    '  node xtend-builder/scaffold.js layout --json',
    '  node xtend-builder/scaffold.js blueprint --json',
    '  node xtend-builder/scaffold.js generators --json',
    '  node xtend-builder/scaffold.js templates --json',
    '  node xtend-builder/scaffold.js component-plan --tag x-example --profile display --json',
    '  node xtend-builder/scaffold.js component-files --tag x-example --profile display --json',
    '  node xtend-builder/scaffold.js typing --tag x-example --profile display --json',
    '  node xtend-builder/scaffold.js preview --tag x-example --profile display --json',
    '  node xtend-builder/scaffold.js extensions --tag x-example --profile display --json',
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
    '  component-files Render dry-run component artifact file contents.',
    '  typing   Create the dry-run component type and XTendRMT attachment contract.',
    '  preview  Create the dry-run component preview and reference-gate contract.',
    '  extensions Create the dry-run templating, rendering and root-lifecycle extension contract.',
    '  workflow  Print the local dry-run developer workflow.',
    '  verify    Print the local scaffold verification plan.',
    '  validate  Alias for verify.',
    '  rmt lint  Lint native .rmt files and fallback .rmt.json files.',
    '',
    'Boundary:',
    '  WP-E03-11 standardizes extension-point contracts without productive runtime code.',
    '  Productive file writes are reserved for later packages.'
  ].join('\n');
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

  if (command === 'help' || (options.help && command !== 'rmt')) {
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
        '  xt rmt lint app.rmt',
        '  xt rmt lint app.rmt --json',
        '  xt rmt lint tests/fixtures --fail-on warning',
        '',
        'Commands:',
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

module.exports = {
  COMMAND_ALIASES,
  buildConfigSummary,
  buildHelpText,
  normalizeCommand,
  parseArgs,
  parseFlagArgs,
  runCli
};
