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
    status: 'template-render-with-feature-type-preview-and-extension-wiring',
    owner: 'WP-E03-07',
    description: 'Renders all required scaffold component artifacts plus manifest, hydration, feature, type, preview and extension wiring as dry-run output.',
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
