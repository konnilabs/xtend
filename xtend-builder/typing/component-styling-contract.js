const COMPONENT_STYLING_CONTRACT_SCHEMA = 'xtend.component.styling.v1';
const COMPONENT_STYLING_REPORT_SCHEMA = 'xtend.component.styling-report.v1';
const COMPONENT_STYLING_WORKPACKAGE = 'WP-E11-03';
const COMPONENT_STYLING_CONTRACT_DOC = 'development/XTend-Component-Styling-Token-und-Part-Contract.md';
const COMPONENT_SHELL_CONTRACT_SCHEMA = 'xtend.component.shell.v1';
const COMPONENT_CONTRACT_V2_SCHEMA = 'xtend.component.contract.v2';
const UX_MATURITY_MODEL_SCHEMA = 'xtend.component.ux-maturity-model.v1';
const RMT_STYLE_AUTHORING_SCHEMA = 'xtend.rmt.style-authoring.v1';
const FABRIC_BOUNDARY_SCHEMA = 'xtend.component.fabric-boundary.v2';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const STYLING_REQUIRED_DOMAINS = [
  'tokens',
  'customProperties',
  'parts',
  'variants',
  'sizes',
  'density',
  'themes',
  'motion',
  'contrast',
  'rmt',
  'fabric',
  'compatibility',
  'docs',
  'tests'
];

const STYLING_TOKEN_CATEGORIES = [
  'color',
  'surface',
  'text',
  'space',
  'radius',
  'typography',
  'motion',
  'elevation',
  'state'
];

const STYLING_REQUIRED_VARIANTS = [
  'default',
  'primary',
  'secondary',
  'success',
  'warning',
  'danger',
  'neutral'
];

const STYLING_REQUIRED_SIZES = ['sm', 'md', 'lg'];
const STYLING_REQUIRED_DENSITIES = ['comfortable', 'compact', 'dense'];
const STYLING_REQUIRED_THEMES = ['light', 'dark', 'high-contrast', 'forced-colors'];
const STYLING_REQUIRED_PARTS = ['root', 'control', 'label', 'content', 'helper', 'error'];
const STYLING_MOTION_POLICIES = ['standard', 'reduced'];

function normalizeArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function unique(values) {
  return Array.from(new Set(normalizeArray(values).filter(Boolean)));
}

function toBasename(tag) {
  return String(tag || 'x-example').replace(/^x-/, '').replace(/-/g, '-');
}

function normalizeToken(token, tag) {
  if (typeof token === 'string') {
    return {
      name: token,
      category: 'state',
      defaultValue: `var(--xtend-${toBasename(tag)}-surface, inherit)`,
      fallbackRequired: true
    };
  }
  return {
    name: token.name,
    category: token.category || 'state',
    defaultValue: token.defaultValue || 'inherit',
    fallbackRequired: token.fallbackRequired !== false
  };
}

function createDefaultTokens(tag) {
  const basename = toBasename(tag);
  return [
    { name: `--xtend-${basename}-color`, category: 'color', defaultValue: 'var(--xtend-color-text, currentColor)' },
    { name: `--xtend-${basename}-surface`, category: 'surface', defaultValue: 'var(--xtend-color-surface, transparent)' },
    { name: `--xtend-${basename}-text`, category: 'text', defaultValue: 'var(--xtend-color-text, currentColor)' },
    { name: `--xtend-${basename}-gap`, category: 'space', defaultValue: 'var(--xtend-space-2, 0.5rem)' },
    { name: `--xtend-${basename}-radius`, category: 'radius', defaultValue: 'var(--xtend-radius-sm, 4px)' },
    { name: `--xtend-${basename}-font`, category: 'typography', defaultValue: 'var(--xtend-font-family, inherit)' },
    { name: `--xtend-${basename}-motion-duration`, category: 'motion', defaultValue: 'var(--xtend-motion-duration-fast, 120ms)' },
    { name: `--xtend-${basename}-elevation`, category: 'elevation', defaultValue: 'var(--xtend-elevation-0, none)' },
    { name: `--xtend-${basename}-state-color`, category: 'state', defaultValue: 'var(--xtend-color-accent, currentColor)' }
  ].map((token) => normalizeToken(token, tag));
}

function normalizePart(part) {
  if (typeof part === 'string') {
    return {
      name: part,
      stable: true,
      selector: `::part(${part})`
    };
  }
  return {
    name: part.name,
    stable: part.stable !== false,
    selector: part.selector || `::part(${part.name})`
  };
}

function createComponentStylingContract(input = {}) {
  const tag = input.tag || 'x-example';
  const tokenInput = normalizeArray(input.tokens);
  const parts = normalizeArray(input.parts).length > 0
    ? normalizeArray(input.parts).map(normalizePart)
    : STYLING_REQUIRED_PARTS.map(normalizePart);
  const tokens = tokenInput.length > 0
    ? tokenInput.map((token) => normalizeToken(token, tag))
    : createDefaultTokens(tag);
  const variants = unique(STYLING_REQUIRED_VARIANTS.concat(normalizeArray(input.variants)));
  const sizes = unique(STYLING_REQUIRED_SIZES.concat(normalizeArray(input.sizes)));
  const density = unique(STYLING_REQUIRED_DENSITIES.concat(normalizeArray(input.density)));
  const themes = unique(STYLING_REQUIRED_THEMES.concat(normalizeArray(input.themes)));

  return {
    schema: COMPONENT_STYLING_CONTRACT_SCHEMA,
    status: 'contract-draft',
    workpackage: COMPONENT_STYLING_WORKPACKAGE,
    componentContract: COMPONENT_CONTRACT_V2_SCHEMA,
    shellContract: COMPONENT_SHELL_CONTRACT_SCHEMA,
    uxMaturityModel: UX_MATURITY_MODEL_SCHEMA,
    tag,
    tokens,
    customProperties: {
      prefix: `--xtend-${toBasename(tag)}-`,
      fallbackRequired: true,
      hostThemeBridge: true,
      noUnscopedGlobals: true
    },
    parts,
    variants: {
      allowed: variants,
      defaultVariant: input.defaultVariant || 'default',
      unknownVariantPolicy: 'ignore-and-diagnose'
    },
    sizes: {
      allowed: sizes,
      defaultSize: input.defaultSize || 'md'
    },
    density: {
      allowed: density,
      defaultDensity: input.defaultDensity || 'comfortable',
      hostPropagation: true
    },
    themes: {
      supported: themes,
      bridge: 'x-theme',
      tokenInheritance: true,
      forcedColorsRequired: true
    },
    motion: {
      policies: STYLING_MOTION_POLICIES.slice(),
      reducedMotionSafe: true,
      noMotionRequiredForCoreFunction: true
    },
    contrast: {
      highContrastRequired: true,
      forcedColorsRequired: true,
      noColorOnlyState: true,
      focusVisibleRequired: true
    },
    rmt: {
      schema: RMT_STYLE_AUTHORING_SCHEMA,
      adapter: 'xtend.component',
      fields: ['style', 'tokens', 'parts', 'variant', 'size', 'density', 'theme', 'motion', 'contrast'],
      kernelBoundary: KERNEL_BOUNDARY
    },
    fabric: {
      schema: FABRIC_BOUNDARY_SCHEMA,
      diagnostics: ['style.token.missing', 'style.variant.unknown', 'style.theme.unsupported'],
      telemetryFields: ['componentId', 'variant', 'size', 'density', 'theme', 'forcedColors', 'reducedMotion']
    },
    compatibility: {
      hostModes: ['xtend-only', 'rmt-first', 'vanilla', 'react', 'vue', 'custom-shell'],
      cssPartsRequired: true,
      shadowDomSkinningAllowed: true,
      inlineStylePolicy: 'tokens-only',
      noCdnThemeDependency: true
    },
    docs: {
      contract: COMPONENT_STYLING_CONTRACT_DOC,
      componentGuideSection: 'Styling',
      requiredSections: ['Tokens', 'CSS Custom Properties', 'CSS Parts', 'Variants', 'Sizes', 'Density', 'Themes', 'Motion', 'Contrast', 'RMT Authoring']
    },
    tests: {
      requiredSuites: ['component-styling-contract', 'component-shell-contract', 'motion-contrast', 'references'],
      visualRegressionRequiredForP0: true,
      fixtureRequired: true
    }
  };
}

function validateComponentStylingContract(contract = {}) {
  const errors = [];

  if (contract.schema !== COMPONENT_STYLING_CONTRACT_SCHEMA) {
    errors.push(`schema must be ${COMPONENT_STYLING_CONTRACT_SCHEMA}`);
  }
  if (!/^x-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(contract.tag || ''))) {
    errors.push('tag must be a valid XTend custom element tag');
  }

  STYLING_REQUIRED_DOMAINS.forEach((domain) => {
    if (!contract[domain]) {
      errors.push(`missing domain: ${domain}`);
    }
  });

  if (!Array.isArray(contract.tokens) || contract.tokens.length === 0) {
    errors.push('tokens must include at least one token');
  } else {
    STYLING_TOKEN_CATEGORIES.forEach((category) => {
      if (!contract.tokens.some((token) => token && token.category === category)) {
        errors.push(`tokens must include category ${category}`);
      }
    });
    contract.tokens.forEach((token) => {
      if (!/^--xtend-[a-z0-9-]+$/.test(String(token.name || ''))) {
        errors.push(`token name must use --xtend-* prefix: ${token.name}`);
      }
      if (token.fallbackRequired !== true) {
        errors.push(`token ${token.name} must require a fallback`);
      }
    });
  }

  if (!contract.customProperties || contract.customProperties.fallbackRequired !== true) {
    errors.push('customProperties.fallbackRequired must be true');
  }
  if (!Array.isArray(contract.parts) || !STYLING_REQUIRED_PARTS.every((partName) => contract.parts.some((part) => part && part.name === partName))) {
    errors.push(`parts must include ${STYLING_REQUIRED_PARTS.join(', ')}`);
  }
  if (!contract.variants || !STYLING_REQUIRED_VARIANTS.every((variant) => normalizeArray(contract.variants.allowed).includes(variant))) {
    errors.push(`variants.allowed must include ${STYLING_REQUIRED_VARIANTS.join(', ')}`);
  }
  if (!contract.sizes || !STYLING_REQUIRED_SIZES.every((size) => normalizeArray(contract.sizes.allowed).includes(size))) {
    errors.push(`sizes.allowed must include ${STYLING_REQUIRED_SIZES.join(', ')}`);
  }
  if (!contract.density || !STYLING_REQUIRED_DENSITIES.every((density) => normalizeArray(contract.density.allowed).includes(density))) {
    errors.push(`density.allowed must include ${STYLING_REQUIRED_DENSITIES.join(', ')}`);
  }
  if (!contract.themes || !STYLING_REQUIRED_THEMES.every((theme) => normalizeArray(contract.themes.supported).includes(theme))) {
    errors.push(`themes.supported must include ${STYLING_REQUIRED_THEMES.join(', ')}`);
  }
  if (contract.motion && contract.motion.reducedMotionSafe !== true) {
    errors.push('motion.reducedMotionSafe must be true');
  }
  if (contract.contrast && contract.contrast.focusVisibleRequired !== true) {
    errors.push('contrast.focusVisibleRequired must be true');
  }
  if (contract.rmt && contract.rmt.kernelBoundary !== KERNEL_BOUNDARY) {
    errors.push('rmt.kernelBoundary must keep the RMT kernel decoupled from XTend types');
  }
  if (contract.compatibility && contract.compatibility.noCdnThemeDependency !== true) {
    errors.push('compatibility.noCdnThemeDependency must be true');
  }

  return {
    schema: COMPONENT_STYLING_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  COMPONENT_STYLING_CONTRACT_SCHEMA,
  COMPONENT_STYLING_REPORT_SCHEMA,
  COMPONENT_STYLING_WORKPACKAGE,
  COMPONENT_STYLING_CONTRACT_DOC,
  COMPONENT_SHELL_CONTRACT_SCHEMA,
  COMPONENT_CONTRACT_V2_SCHEMA,
  UX_MATURITY_MODEL_SCHEMA,
  RMT_STYLE_AUTHORING_SCHEMA,
  FABRIC_BOUNDARY_SCHEMA,
  KERNEL_BOUNDARY,
  STYLING_REQUIRED_DOMAINS,
  STYLING_TOKEN_CATEGORIES,
  STYLING_REQUIRED_VARIANTS,
  STYLING_REQUIRED_SIZES,
  STYLING_REQUIRED_DENSITIES,
  STYLING_REQUIRED_THEMES,
  STYLING_REQUIRED_PARTS,
  STYLING_MOTION_POLICIES,
  createComponentStylingContract,
  validateComponentStylingContract
};
