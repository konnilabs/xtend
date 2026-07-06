const {
  createComponentPlan
} = require('./component-plan');
const {
  createComponentFiles
} = require('./component-files');
const {
  createComponentTypingContract
} = require('../typing/component-types');
const {
  createComponentPreviewContract
} = require('../preview/component-preview');
const {
  createComponentExtensionPoints
} = require('../extensions/component-extension-points');
const {
  createRmtLifecycleDemoBuild
} = require('./rmt-lifecycle-demo');
const {
  createRmtAppBuild
} = require('./rmt-build');
const {
  createRmtAppPlatformBuild
} = require('./rmt-app-platform');
const {
  createRmtKernelLabReport
} = require('./rmt-kernel-lab');

const GENERATOR_REGISTRY_SCHEMA = 'xtend.scaffold.generator-registry.v1';

const GENERATORS = [
  {
    id: 'component',
    command: 'component-plan',
    status: 'plan-only',
    owner: 'WP-E03-04',
    description: 'Creates a dry-run plan for a scaffolded XTend component.',
    run: createComponentPlan
  },
  {
    id: 'component-files',
    command: 'component-files',
    status: 'template-render-write-plan-manifest-patch-and-build-report-output',
    owner: 'WP-E17-03',
    description: 'Renders scaffold component artifacts and can write them through WritePlan ownership guards, manifest patchers and build reports.',
    run: createComponentFiles
  },
  {
    id: 'component-typing',
    command: 'typing',
    status: 'type-contract-and-rmt-attachment',
    owner: 'WP-E03-09',
    description: 'Creates the component .d.ts contract plus prepared XTendRMT attachment metadata.',
    run: createComponentTypingContract
  },
  {
    id: 'component-preview',
    command: 'preview',
    status: 'preview-reference-contract',
    owner: 'WP-E03-10',
    description: 'Creates the component preview reference plan and local reference-gate metadata.',
    run: createComponentPreviewContract
  },
  {
    id: 'component-extensions',
    command: 'extensions',
    status: 'extension-point-contract',
    owner: 'WP-E03-11',
    description: 'Creates the component templating, rendering and root-lifecycle extension-point contract.',
    run: createComponentExtensionPoints
  },
  {
    id: 'rmt-lifecycle-demo',
    command: 'rmt-lifecycle-demo',
    status: 'productive-demo-build',
    owner: 'RMT-Lifecycle-Demo',
    description: 'Compiles the RMT vNext lifecycle template and writes the generated XTend demo app artifacts when --write is set.',
    run: createRmtLifecycleDemoBuild
  },
  {
    id: 'rmt-build',
    command: 'rmt-build',
    status: 'rmt-vnext-app-build-pipeline',
    owner: 'WP-E17-04',
    description: 'Compiles an RMT vNext template into Core JSON, XTend component/app, host, browser smoke and Scaffold report artifacts.',
    run: createRmtAppBuild
  },
  {
    id: 'rmt-app-platform',
    command: 'rmt-app-platform',
    status: 'rmt-app-platform-diagnostics-source-map-and-scaffold-report',
    owner: 'WP-E18-11',
    description: 'Builds diagnostics, source maps and scaffold reports for generic Epic 18 RMT App Platform sources.',
    run: createRmtAppPlatformBuild
  },
  {
    id: 'rmt-kernel-lab',
    command: 'kernel-lab',
    status: 'rmt-kernel-analysis-clean-build-and-module-manifest',
    owner: 'RMT-KernelLab',
    description: 'Analyzes the bundled RMT kernel and builds the clean Dashboard-free standard kernel artifacts.',
    run: createRmtKernelLabReport
  }
];

function getGeneratorRegistry() {
  return {
    schema: GENERATOR_REGISTRY_SCHEMA,
    generators: GENERATORS.map((generator) => ({
      id: generator.id,
      command: generator.command,
      status: generator.status,
      owner: generator.owner,
      description: generator.description
    }))
  };
}

function getGenerator(idOrCommand) {
  return GENERATORS.find((generator) => generator.id === idOrCommand || generator.command === idOrCommand) || null;
}

function runGenerator(idOrCommand, input = {}) {
  const generator = getGenerator(idOrCommand);
  if (!generator) {
    return {
      ok: false,
      errors: [`Unknown scaffold generator "${idOrCommand}".`]
    };
  }

  return generator.run(input);
}

module.exports = {
  GENERATOR_REGISTRY_SCHEMA,
  getGenerator,
  getGeneratorRegistry,
  runGenerator
};
