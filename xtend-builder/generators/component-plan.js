const config = require('../scaffold.config');
const {
  getComponentBlueprintContract
} = require('../blueprints/component-blueprint.contract');
const {
  getClassNameFromTag,
  replaceArtifactTokens
} = require('../utils/naming');
const {
  validateComponentPlanInput
} = require('../utils/validation');
const {
  getTemplateForArtifact
} = require('../templates/registry');
const {
  createComponentA11yProfile
} = require('../a11y/component-a11y-profile');
const {
  createComponentPerformanceProfile
} = require('../performance/component-performance-profile');

const COMPONENT_PLAN_SCHEMA = 'xtend.scaffold.component-plan.v1';

function toArtifactPlan(artifact, values) {
  const template = getTemplateForArtifact(artifact.id);
  const action = artifact.mode === 'patch-plan'
    ? 'plan-patch'
    : artifact.mode === 'reference-plan'
      ? 'plan-reference'
      : 'plan-create';
  return {
    id: artifact.id,
    required: artifact.required,
    mode: artifact.mode,
    action,
    targetPath: replaceArtifactTokens(artifact.pathTemplate, values),
    templateId: template ? template.id : null,
    templateStatus: template ? template.status : 'not-registered',
    purpose: artifact.purpose,
    minimumContract: artifact.minimumContract
  };
}

function createComponentPlan(input = {}, options = {}) {
  const scaffoldConfig = options.config || config;
  const blueprint = options.blueprint || getComponentBlueprintContract();
  const validation = validateComponentPlanInput(input, {
    config: scaffoldConfig,
    blueprint
  });

  if (!validation.ok) {
    return {
      schema: COMPONENT_PLAN_SCHEMA,
      ok: false,
      mode: 'dry-run',
      errors: validation.errors,
      artifacts: []
    };
  }

  const values = {
    tag: validation.value.tag,
    name: validation.value.name,
    className: getClassNameFromTag(validation.value.tag)
  };
  const artifacts = blueprint.artifacts.map((artifact) => toArtifactPlan(artifact, values));
  const a11yProfile = createComponentA11yProfile({
    tag: values.tag,
    name: values.name,
    className: values.className,
    profiles: validation.value.profiles
  });
  const performanceProfile = createComponentPerformanceProfile({
    tag: values.tag,
    name: values.name,
    className: values.className,
    profiles: validation.value.profiles
  });

  return {
    schema: COMPONENT_PLAN_SCHEMA,
    ok: true,
    mode: 'dry-run',
    generator: 'component',
    writeStrategy: scaffoldConfig.tooling.writeStrategy,
    input: {
      tag: values.tag,
      name: values.name,
      className: values.className,
      profiles: validation.value.profiles,
      features: validation.value.features
    },
    a11yProfile,
    performanceProfile,
    artifacts,
    nextStep: 'Use component-files, typing, preview and extensions to inspect the dry-run artifact contracts before productive writes.'
  };
}

module.exports = {
  COMPONENT_PLAN_SCHEMA,
  createComponentPlan
};
