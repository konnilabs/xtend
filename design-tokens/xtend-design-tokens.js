const XTEND_DESIGN_TOKEN_SCHEMA = 'xtend.design-tokens.product-contract.v1';
const XTEND_DESIGN_TOKEN_PACK_SCHEMA = 'xtend.design-tokens.pack.v1';
const XTEND_DESIGN_TOKEN_REPORT_SCHEMA = 'xtend.design-tokens.report.v1';
const XTEND_DESIGN_TOKEN_WORKPACKAGE = 'WP-E12-12';
const XTEND_DESIGN_TOKEN_CONTRACT_PATH = 'development/XTend-Enterprise-Design-System-Token-Contract.md';
const XTEND_DESIGN_TOKEN_DOC_PATH = 'docs/design-tokens.md';
const XTEND_DESIGN_TOKEN_EXAMPLE_THEME_PATH = 'design-tokens/themes/enterprise-light.json';
const XTEND_DESIGN_TOKEN_MODULE_PATH = 'design-tokens/xtend-design-tokens.js';
const XTEND_DESIGN_TOKEN_SUITE_PATH = 'tests/tokens/design_token_contract_suite.js';
const XTEND_DESIGN_TOKEN_WP_PATH = 'development/WP-E12-12-Enterprise-Design-System-Token-Productization-vorbereiten.md';
const XTEND_DESIGN_TOKEN_LOCAL_GATE = 'node scripts/run_xtend_tests.js design-tokens --json';
const XTEND_DESIGN_TOKEN_PACKAGE_SCRIPT = 'npm run test:design-tokens';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const TOKEN_CATEGORIES = Object.freeze([
  'color',
  'surface',
  'text',
  'state',
  'border',
  'focus',
  'elevation',
  'radius',
  'typography',
  'motion',
  'density'
]);

const TOKEN_DEFINITIONS = Object.freeze([
  { name: '--xtend-color-primary', category: 'color', role: 'primary interactive color', requiredInTheme: true },
  { name: '--xtend-color-primary-dark', category: 'color', role: 'primary hover or active color', requiredInTheme: true },
  { name: '--xtend-color-accent', category: 'color', role: 'accent or inverse foreground color', requiredInTheme: true },
  { name: '--xtend-surface', category: 'surface', role: 'default application surface', requiredInTheme: true },
  { name: '--xtend-surface-muted', category: 'surface', role: 'secondary surface', requiredInTheme: true },
  { name: '--xtend-text', category: 'text', role: 'default foreground text', requiredInTheme: true },
  { name: '--xtend-overlay-bg', category: 'surface', role: 'overlay scrim background', requiredInTheme: true },
  { name: '--xtend-border-color', category: 'border', role: 'semantic border color', requiredInTheme: true },
  { name: '--xtend-border', category: 'border', role: 'composite border declaration', requiredInTheme: true },
  { name: '--xtend-focus-outline', category: 'focus', role: 'keyboard focus outline', requiredInTheme: true },
  { name: '--xtend-focus-outline-offset', category: 'focus', role: 'keyboard focus outline offset', requiredInTheme: true },
  { name: '--xtend-info-bg', category: 'state', role: 'info status background', requiredInTheme: true },
  { name: '--xtend-info-fg', category: 'state', role: 'info status foreground', requiredInTheme: true },
  { name: '--xtend-success-bg', category: 'state', role: 'success status background', requiredInTheme: true },
  { name: '--xtend-success-fg', category: 'state', role: 'success status foreground', requiredInTheme: true },
  { name: '--xtend-warning-bg', category: 'state', role: 'warning status background', requiredInTheme: true },
  { name: '--xtend-warning-fg', category: 'state', role: 'warning status foreground', requiredInTheme: true },
  { name: '--xtend-error-bg', category: 'state', role: 'error status background', requiredInTheme: true },
  { name: '--xtend-error-fg', category: 'state', role: 'error status foreground', requiredInTheme: true },
  { name: '--xtend-glass-bg', category: 'surface', role: 'glass surface fallback', requiredInTheme: true },
  { name: '--xtend-glass-blur', category: 'surface', role: 'glass blur token', requiredInTheme: true },
  { name: '--xtend-shadow', category: 'elevation', role: 'default elevated shadow', requiredInTheme: true },
  { name: '--xtend-radius', category: 'radius', role: 'default component radius', requiredInTheme: true },
  { name: '--xtend-font-family', category: 'typography', role: 'default font family', requiredInTheme: true },
  { name: '--xtend-font-scale', category: 'typography', role: 'density-aware font scale', densityOnly: true },
  { name: '--xtend-motion-duration-fast', category: 'motion', role: 'fast transition duration', requiredInTheme: true },
  { name: '--xtend-motion-duration-base', category: 'motion', role: 'base transition duration', requiredInTheme: true },
  { name: '--xtend-motion-scale', category: 'motion', role: 'motion scaling factor', requiredInTheme: true },
  { name: '--xtend-density-scale', category: 'density', role: 'density scale factor', densityOnly: true },
  { name: '--xtend-density-spacing', category: 'density', role: 'density-aware spacing unit', densityOnly: true },
  { name: '--xtend-control-height', category: 'density', role: 'density-aware control height', densityOnly: true }
]);

const CSS_PART_CONTRACT = Object.freeze([
  'root',
  'control',
  'label',
  'content',
  'helper',
  'error',
  'icon',
  'panel',
  'overlay',
  'backdrop',
  'listbox',
  'option',
  'track',
  'thumb',
  'media'
]);

const THEME_PACKS = Object.freeze({
  light: Object.freeze({
    '--xtend-color-primary': '#4fc3f7',
    '--xtend-color-primary-dark': '#0288d1',
    '--xtend-color-accent': '#ffffff',
    '--xtend-glass-bg': 'rgba(30, 34, 44, 0.55)',
    '--xtend-glass-blur': '18px',
    '--xtend-shadow': '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
    '--xtend-border': '1.5px solid rgba(255,255,255,0.12)',
    '--xtend-radius': '18px',
    '--xtend-font-family': "'Inter', 'Segoe UI', Arial, sans-serif",
    '--xtend-focus-outline': '2px solid #4fc3f7',
    '--xtend-info-bg': 'rgba(33, 150, 243, 0.92)',
    '--xtend-success-bg': 'rgba(56, 200, 120, 0.92)',
    '--xtend-warning-bg': 'rgba(255, 193, 7, 0.92)',
    '--xtend-error-bg': 'rgba(220, 53, 69, 0.92)',
    '--xtend-info-fg': '#ffffff',
    '--xtend-success-fg': '#ffffff',
    '--xtend-warning-fg': '#212529',
    '--xtend-error-fg': '#ffffff',
    '--xtend-motion-duration-fast': '160ms',
    '--xtend-motion-duration-base': '220ms',
    '--xtend-motion-scale': '1',
    '--xtend-focus-outline-offset': '2px',
    '--xtend-border-color': 'rgba(255,255,255,0.16)',
    '--xtend-surface': '#ffffff',
    '--xtend-surface-muted': 'rgba(255,255,255,0.85)',
    '--xtend-text': '#1f2635',
    '--xtend-overlay-bg': 'rgba(30, 34, 44, 0.55)'
  }),
  dark: Object.freeze({
    '--xtend-color-primary': '#4fc3f7',
    '--xtend-color-primary-dark': '#0288d1',
    '--xtend-color-accent': '#ffffff',
    '--xtend-glass-bg': 'rgba(30, 34, 44, 0.55)',
    '--xtend-glass-blur': '18px',
    '--xtend-shadow': '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
    '--xtend-border': '1.5px solid rgba(255,255,255,0.12)',
    '--xtend-radius': '18px',
    '--xtend-font-family': "'Inter', 'Segoe UI', Arial, sans-serif",
    '--xtend-focus-outline': '2px solid #4fc3f7',
    '--xtend-info-bg': 'rgba(33, 150, 243, 0.92)',
    '--xtend-success-bg': 'rgba(56, 200, 120, 0.92)',
    '--xtend-warning-bg': 'rgba(255, 193, 7, 0.92)',
    '--xtend-error-bg': 'rgba(220, 53, 69, 0.92)',
    '--xtend-info-fg': '#ffffff',
    '--xtend-success-fg': '#ffffff',
    '--xtend-warning-fg': '#212529',
    '--xtend-error-fg': '#ffffff',
    '--xtend-motion-duration-fast': '160ms',
    '--xtend-motion-duration-base': '220ms',
    '--xtend-motion-scale': '1',
    '--xtend-focus-outline-offset': '2px',
    '--xtend-border-color': 'rgba(255,255,255,0.16)',
    '--xtend-surface': '#1f2635',
    '--xtend-surface-muted': 'rgba(30, 34, 44, 0.88)',
    '--xtend-text': '#f5f7fb',
    '--xtend-overlay-bg': 'rgba(15, 18, 24, 0.72)'
  }),
  'high-contrast': Object.freeze({
    '--xtend-color-primary': '#ffff00',
    '--xtend-color-primary-dark': '#ffffff',
    '--xtend-color-accent': '#00ffff',
    '--xtend-glass-bg': 'rgba(30, 34, 44, 0.55)',
    '--xtend-glass-blur': '18px',
    '--xtend-shadow': '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
    '--xtend-border': '1.5px solid rgba(255,255,255,0.12)',
    '--xtend-radius': '18px',
    '--xtend-font-family': "'Inter', 'Segoe UI', Arial, sans-serif",
    '--xtend-focus-outline': '3px solid #ffff00',
    '--xtend-info-bg': '#0000ff',
    '--xtend-success-bg': '#008000',
    '--xtend-warning-bg': '#ffff00',
    '--xtend-error-bg': '#ff0000',
    '--xtend-info-fg': '#ffffff',
    '--xtend-success-fg': '#ffffff',
    '--xtend-warning-fg': '#000000',
    '--xtend-error-fg': '#ffffff',
    '--xtend-motion-duration-fast': '160ms',
    '--xtend-motion-duration-base': '220ms',
    '--xtend-motion-scale': '1',
    '--xtend-focus-outline-offset': '2px',
    '--xtend-border-color': '#ffffff',
    '--xtend-surface': '#000000',
    '--xtend-surface-muted': '#111111',
    '--xtend-text': '#ffffff',
    '--xtend-overlay-bg': 'rgba(0, 0, 0, 0.88)'
  }),
  'forced-colors': Object.freeze({
    '--xtend-color-primary': 'Highlight',
    '--xtend-color-primary-dark': 'Highlight',
    '--xtend-color-accent': 'HighlightText',
    '--xtend-glass-bg': 'rgba(30, 34, 44, 0.55)',
    '--xtend-glass-blur': '18px',
    '--xtend-shadow': '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
    '--xtend-border': '1.5px solid rgba(255,255,255,0.12)',
    '--xtend-radius': '18px',
    '--xtend-font-family': "'Inter', 'Segoe UI', Arial, sans-serif",
    '--xtend-focus-outline': '2px solid Highlight',
    '--xtend-info-bg': 'Canvas',
    '--xtend-success-bg': 'Canvas',
    '--xtend-warning-bg': 'Canvas',
    '--xtend-error-bg': 'Canvas',
    '--xtend-info-fg': 'CanvasText',
    '--xtend-success-fg': 'CanvasText',
    '--xtend-warning-fg': 'CanvasText',
    '--xtend-error-fg': 'CanvasText',
    '--xtend-motion-duration-fast': '160ms',
    '--xtend-motion-duration-base': '220ms',
    '--xtend-motion-scale': '1',
    '--xtend-focus-outline-offset': '2px',
    '--xtend-border-color': 'CanvasText',
    '--xtend-surface': 'Canvas',
    '--xtend-surface-muted': 'Canvas',
    '--xtend-text': 'CanvasText',
    '--xtend-overlay-bg': 'Canvas'
  })
});

const DENSITY_PACKS = Object.freeze({
  compact: Object.freeze({
    '--xtend-density-scale': '0.875',
    '--xtend-density-spacing': '0.5rem',
    '--xtend-control-height': '2.125rem',
    '--xtend-font-scale': '0.95'
  }),
  comfortable: Object.freeze({
    '--xtend-density-scale': '1',
    '--xtend-density-spacing': '0.75rem',
    '--xtend-control-height': '2.5rem',
    '--xtend-font-scale': '1'
  }),
  dense: Object.freeze({
    '--xtend-density-scale': '0.75',
    '--xtend-density-spacing': '0.375rem',
    '--xtend-control-height': '1.875rem',
    '--xtend-font-scale': '0.925'
  })
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function tokenNames() {
  return TOKEN_DEFINITIONS.map((token) => token.name);
}

function createThemePack(name, tokens = {}) {
  return {
    schema: XTEND_DESIGN_TOKEN_PACK_SCHEMA,
    type: 'theme',
    name,
    tokens: { ...(THEME_PACKS[name] || {}), ...tokens }
  };
}

function createDensityPack(name, tokens = {}) {
  return {
    schema: XTEND_DESIGN_TOKEN_PACK_SCHEMA,
    type: 'density',
    name,
    tokens: { ...(DENSITY_PACKS[name] || {}), ...tokens }
  };
}

function createXtendDesignTokenContract() {
  return {
    schema: XTEND_DESIGN_TOKEN_SCHEMA,
    status: 'accepted-productization-contract',
    workpackage: XTEND_DESIGN_TOKEN_WORKPACKAGE,
    sourceContracts: [
      'xtend.component.styling.v1',
      'xtend.theme.context.v1',
      'xtend.epic11.component-shell-theme-matrix.v1',
      'xtend.epic12.visual-snapshot-runner.v1'
    ],
    productSurface: {
      namespace: '--xtend-',
      runtimeProvider: 'x-theme',
      appAuthoring: ['css-custom-properties', 'theme-packs', 'density-packs', 'rmt-style-descriptors'],
      localOnly: true,
      externalNetworkAllowed: false,
      kernelBoundary: KERNEL_BOUNDARY
    },
    categories: TOKEN_CATEGORIES.slice(),
    tokens: clone(TOKEN_DEFINITIONS),
    tokenNames: tokenNames(),
    themePacks: Object.keys(THEME_PACKS).map((name) => createThemePack(name)),
    densityPacks: Object.keys(DENSITY_PACKS).map((name) => createDensityPack(name)),
    cssParts: CSS_PART_CONTRACT.slice(),
    highContrast: {
      requiredPacks: ['high-contrast', 'forced-colors'],
      requiredSystemColors: ['Canvas', 'CanvasText', 'Highlight', 'HighlightText'],
      focusToken: '--xtend-focus-outline',
      noColorOnlyState: true
    },
    docs: {
      contract: XTEND_DESIGN_TOKEN_CONTRACT_PATH,
      guide: XTEND_DESIGN_TOKEN_DOC_PATH,
      exampleTheme: XTEND_DESIGN_TOKEN_EXAMPLE_THEME_PATH
    },
    gates: {
      localGate: XTEND_DESIGN_TOKEN_LOCAL_GATE,
      packageScript: XTEND_DESIGN_TOKEN_PACKAGE_SCRIPT,
      requiredSuites: ['design-tokens', 'component-shell-theme-matrix', 'visual-snapshots', 'references']
    }
  };
}

function validateXtendDesignTokenContract(contract = createXtendDesignTokenContract()) {
  const errors = [];
  const requiredThemeNames = ['light', 'dark', 'high-contrast', 'forced-colors'];
  const requiredDensityNames = ['comfortable', 'compact', 'dense'];
  const requiredThemeTokens = TOKEN_DEFINITIONS
    .filter((token) => token.requiredInTheme)
    .map((token) => token.name);
  const requiredDensityTokens = TOKEN_DEFINITIONS
    .filter((token) => token.densityOnly)
    .map((token) => token.name);

  if (!contract || contract.schema !== XTEND_DESIGN_TOKEN_SCHEMA) {
    errors.push(`schema must be ${XTEND_DESIGN_TOKEN_SCHEMA}`);
  }
  if (!contract || contract.workpackage !== XTEND_DESIGN_TOKEN_WORKPACKAGE) {
    errors.push(`workpackage must be ${XTEND_DESIGN_TOKEN_WORKPACKAGE}`);
  }
  if (!contract.productSurface || contract.productSurface.namespace !== '--xtend-') {
    errors.push('product surface namespace must be --xtend-');
  }
  if (!contract.productSurface || contract.productSurface.runtimeProvider !== 'x-theme') {
    errors.push('runtime provider must be x-theme');
  }
  if (!contract.productSurface || contract.productSurface.kernelBoundary !== KERNEL_BOUNDARY) {
    errors.push(`kernel boundary must be ${KERNEL_BOUNDARY}`);
  }

  const contractTokenNames = Array.isArray(contract.tokenNames) ? contract.tokenNames : [];
  tokenNames().forEach((tokenName) => {
    if (!contractTokenNames.includes(tokenName)) {
      errors.push(`missing token name: ${tokenName}`);
    }
  });
  contractTokenNames.forEach((tokenName) => {
    if (!String(tokenName).startsWith('--xtend-')) {
      errors.push(`token must use --xtend- namespace: ${tokenName}`);
    }
  });

  const themePacks = Array.isArray(contract.themePacks) ? contract.themePacks : [];
  requiredThemeNames.forEach((name) => {
    const pack = themePacks.find((candidate) => candidate.name === name);
    if (!pack) {
      errors.push(`missing theme pack: ${name}`);
      return;
    }
    requiredThemeTokens.forEach((tokenName) => {
      if (!pack.tokens || !Object.prototype.hasOwnProperty.call(pack.tokens, tokenName)) {
        errors.push(`theme pack ${name} missing ${tokenName}`);
      }
    });
  });

  const densityPacks = Array.isArray(contract.densityPacks) ? contract.densityPacks : [];
  requiredDensityNames.forEach((name) => {
    const pack = densityPacks.find((candidate) => candidate.name === name);
    if (!pack) {
      errors.push(`missing density pack: ${name}`);
      return;
    }
    requiredDensityTokens.forEach((tokenName) => {
      if (!pack.tokens || !Object.prototype.hasOwnProperty.call(pack.tokens, tokenName)) {
        errors.push(`density pack ${name} missing ${tokenName}`);
      }
    });
  });

  CSS_PART_CONTRACT.slice(0, 6).forEach((part) => {
    if (!contract.cssParts || !contract.cssParts.includes(part)) {
      errors.push(`missing public css part: ${part}`);
    }
  });

  return {
    schema: XTEND_DESIGN_TOKEN_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  CSS_PART_CONTRACT,
  DENSITY_PACKS,
  KERNEL_BOUNDARY,
  THEME_PACKS,
  TOKEN_CATEGORIES,
  TOKEN_DEFINITIONS,
  XTEND_DESIGN_TOKEN_CONTRACT_PATH,
  XTEND_DESIGN_TOKEN_DOC_PATH,
  XTEND_DESIGN_TOKEN_EXAMPLE_THEME_PATH,
  XTEND_DESIGN_TOKEN_LOCAL_GATE,
  XTEND_DESIGN_TOKEN_MODULE_PATH,
  XTEND_DESIGN_TOKEN_PACKAGE_SCRIPT,
  XTEND_DESIGN_TOKEN_PACK_SCHEMA,
  XTEND_DESIGN_TOKEN_REPORT_SCHEMA,
  XTEND_DESIGN_TOKEN_SCHEMA,
  XTEND_DESIGN_TOKEN_SUITE_PATH,
  XTEND_DESIGN_TOKEN_WORKPACKAGE,
  XTEND_DESIGN_TOKEN_WP_PATH,
  createDensityPack,
  createThemePack,
  createXtendDesignTokenContract,
  tokenNames,
  validateXtendDesignTokenContract
};
