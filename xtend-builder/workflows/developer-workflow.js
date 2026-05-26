const config = require('../scaffold.config');

const DEVELOPER_WORKFLOW_SCHEMA = 'xtend.scaffold.developer-workflow.v1';
const VERIFY_PLAN_SCHEMA = 'xtend.scaffold.verify-plan.v1';

function normalizeExampleInput(input = {}) {
  return {
    tag: input.tag || 'x-example',
    profile: input.profile || input.profiles || 'display',
    feature: input.feature || input.features || 'state'
  };
}

function toCommandParts(command) {
  return command.split(' ').filter(Boolean);
}

function createCommand(id, command, purpose, output = 'text') {
  return {
    id,
    command,
    argv: toCommandParts(command),
    purpose,
    output
  };
}

function createDeveloperWorkflow(input = {}) {
  const example = normalizeExampleInput(input);
  const planCommand = `xt component-plan --tag ${example.tag} --profile ${example.profile} --feature ${example.feature} --json`;
  const filesCommand = `xt component-files --tag ${example.tag} --profile ${example.profile} --feature ${example.feature} --json`;
  const typingCommand = `xt typing --tag ${example.tag} --profile ${example.profile} --feature ${example.feature} --json`;
  const previewCommand = `xt preview --tag ${example.tag} --profile ${example.profile} --feature ${example.feature} --json`;
  const extensionsCommand = `xt extensions --tag ${example.tag} --profile ${example.profile} --feature ${example.feature} --json`;

  return {
    schema: DEVELOPER_WORKFLOW_SCHEMA,
    ok: true,
    mode: 'dry-run-first',
    writePolicy: config.tooling.writeStrategy,
    entryPoints: [
      createCommand('help', 'xt --help', 'Print the local scaffold command overview.'),
      createCommand('config', 'xt config --json', 'Inspect scaffold configuration, wiring and test obligations.', 'json'),
      createCommand('generators', 'xt generators --json', 'Inspect available generator commands.', 'json'),
      createCommand('templates', 'xt templates --json', 'Inspect template availability.', 'json'),
      createCommand('component-plan', planCommand, 'Create the dry-run artifact plan for a component.', 'json'),
      createCommand('component-files', filesCommand, 'Render dry-run file contents plus manifest, hydration and feature wiring.', 'json'),
      createCommand('typing', typingCommand, 'Inspect the component .d.ts contract and prepared XTendRMT attachment.', 'json'),
      createCommand('preview', previewCommand, 'Inspect the component preview reference plan and local gate metadata.', 'json'),
      createCommand('extensions', extensionsCommand, 'Inspect templating, rendering and root-lifecycle extension points.', 'json'),
      createCommand('verify', 'xt verify --json', 'Inspect local verification commands and required suites.', 'json')
    ],
    npmScripts: {
      scaffold: 'npm run scaffold -- --help',
      scaffoldWorkflow: 'npm run scaffold:workflow',
      scaffoldVerify: 'npm run scaffold:verify',
      scaffoldDryRun: 'npm run scaffold:dry-run',
      scaffoldTyping: 'npm run scaffold:typing',
      scaffoldPreview: 'npm run scaffold:preview',
      scaffoldExtensions: 'npm run scaffold:extensions',
      test: 'npm test',
      testReport: 'npm run test:report'
    },
    rmtCompatibility: {
      schema: config.rmtCompatibility.schema,
      status: config.rmtCompatibility.status,
      surfaces: config.rmtCompatibility.surfaces.slice(),
      requiredContracts: config.rmtCompatibility.requiredContracts.slice(),
      inspectCommands: [typingCommand, previewCommand, extensionsCommand, filesCommand],
      minimumGate: config.rmtCompatibility.minimumGate,
      fullGate: config.rmtCompatibility.fullGate,
      bridgeRuntime: config.rmtCompatibility.bridgeRuntime
    },
    reviewChecklist: [
      'Run component-plan before component-files and keep both outputs reviewable.',
      'Confirm manifest.localImportOnly and manifest.cdnAllowed before productive work.',
      'Confirm hydration lifecycle metadata before adding runtime feature code.',
      'Confirm feature wiring uses canonical xtend.* keys and window.XTend.* API hints.',
      'Confirm generated .d.ts output includes event/detail types and prepared XTendRMT adapter attachment.',
      'Confirm rmtCompatibility binds typing, manifest, preview and extension dry-runs before bridge work.',
      'Confirm preview plans stay repo-local and include a reference-registry entry before productive writes.',
      'Confirm extension points remain no-op hooks and metadata without runtime imports.',
      'Run rmt-compatibility and references after scaffold contract changes and npm test before handoff.'
    ],
    nextStep: 'Use verify to select the smallest local test gate for the changed surface.'
  };
}

function createVerifyPlan(input = {}) {
  const requestedSuite = input.suite || input.suites || null;
  const requiredSuites = config.testObligation.requiredSuites.slice();
  const coreSuites = config.testObligation.coreSuitesForRuntimeChanges.slice();
  const selectedSuites = requestedSuite ? String(requestedSuite).split(',').map((entry) => entry.trim()).filter(Boolean) : config.workflows.defaultVerifySuites.slice();
  const suiteCommand = `node scripts/run_xtend_tests.js ${selectedSuites.join(' ')}`;
  const suiteJsonCommand = `${suiteCommand} --json`;

  return {
    schema: VERIFY_PLAN_SCHEMA,
    ok: true,
    mode: 'verify-plan',
    runner: config.testObligation.runner,
    requiredSuites,
    coreSuitesForRuntimeChanges: coreSuites,
    selectedSuites,
    commands: [
      createCommand('selected', suiteCommand, 'Run the selected local verification suites.'),
      createCommand('selected-json', suiteJsonCommand, 'Run selected suites with machine-readable JSON output.', 'json'),
      createCommand('references', 'node scripts/run_xtend_tests.js references --json', 'Run scaffold documentation and reference gates.', 'json'),
      createCommand('rmt-compatibility', config.rmtCompatibility.minimumGate, 'Run the dedicated RMT compatibility gate.', 'json'),
      createCommand('component-gates', 'node scripts/run_xtend_tests.js components a11y-hydration', 'Run component and hydration gates for generated artifact contracts.'),
      createCommand('full', 'npm test', 'Run the full XTend local suite before handoff.'),
      createCommand('report', config.testObligation.reportCommand, 'Write a machine-readable test report.', 'json-file')
    ],
    reportPath: '.xtend-test-results/xtend-test-report.json',
    exitPolicy: 'All commands that execute tests must exit 0 before the workpackage can be closed.',
    reviewActors: config.testObligation.reviewActors.slice()
  };
}

module.exports = {
  DEVELOPER_WORKFLOW_SCHEMA,
  VERIFY_PLAN_SCHEMA,
  createDeveloperWorkflow,
  createVerifyPlan
};
