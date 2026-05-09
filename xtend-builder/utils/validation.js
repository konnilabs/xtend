const config = require('../scaffold.config');
const {
  getComponentBlueprintContract
} = require('../blueprints/component-blueprint.contract');
const {
  getComponentNameFromTag,
  normalizeTag
} = require('./naming');

const ALLOWED_FEATURES = [
  'accessibility',
  'css',
  'demo',
  'docs',
  'events',
  'fixtures',
  'manifest',
  'slots',
  'state',
  'types'
];

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.flatMap(normalizeList);
  }

  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function unique(values) {
  return Array.from(new Set(values));
}

function validateComponentPlanInput(input = {}, options = {}) {
  const scaffoldConfig = options.config || config;
  const blueprint = options.blueprint || getComponentBlueprintContract();
  const errors = [];
  const tag = normalizeTag(input.tag || input.name || '');
  const profiles = unique(normalizeList(input.profile || input.profiles));
  const features = unique(normalizeList(input.feature || input.features));
  const profileNames = Array.isArray(blueprint.profiles) ? blueprint.profiles.map((profile) => profile.profile) : [];
  const tagPattern = new RegExp(scaffoldConfig.namingConventions.componentTagPattern);

  if (!tag) {
    errors.push('Missing required --tag <x-name> input.');
  } else if (!tagPattern.test(tag)) {
    errors.push(`Invalid component tag "${tag}". Expected pattern ${scaffoldConfig.namingConventions.componentTagPattern}.`);
  }

  if (profiles.length === 0) {
    errors.push('Missing required --profile <profile> input.');
  }

  profiles.forEach((profile) => {
    if (!profileNames.includes(profile)) {
      errors.push(`Invalid component profile "${profile}". Allowed profiles: ${profileNames.join(', ')}.`);
    }
  });

  features.forEach((feature) => {
    if (!ALLOWED_FEATURES.includes(feature)) {
      errors.push(`Invalid feature "${feature}". Allowed features: ${ALLOWED_FEATURES.join(', ')}.`);
    }
  });

  const name = input.componentName ? String(input.componentName).trim() : getComponentNameFromTag(tag);
  if (!name && tag) {
    errors.push(`Unable to derive component name from tag "${tag}".`);
  }

  return {
    ok: errors.length === 0,
    errors,
    value: {
      tag,
      name,
      profiles,
      features
    }
  };
}

module.exports = {
  ALLOWED_FEATURES,
  normalizeList,
  validateComponentPlanInput
};
