const XTHEME_TOKEN_ALIAS_LAYER_SCHEMA = 'xtend.theme.token-alias-layer.v1';
const XTHEME_TOKEN_ALIAS_LAYER_REPORT_SCHEMA = 'xtend.theme.token-alias-layer-report.v1';
const XTHEME_TOKEN_ALIAS_LAYER_WORKPACKAGE = 'ECH-WP-03';
const XTHEME_TOKEN_ALIAS_LAYER_DOC_PATH = 'development/XTend-XTheme-Token-Alias-Layer.md';
const XTHEME_TOKEN_ALIAS_LAYER_FIXTURE_PATH = 'tests/browser/fixtures/xtheme-token-alias-layer-smoke.html';
const XTHEME_TOKEN_ALIAS_LAYER_MODULE_PATH = 'design-tokens/xtheme-token-alias-layer.js';
const XTHEME_TOKEN_ALIAS_LAYER_TYPES_PATH = 'design-tokens/xtheme-token-alias-layer.d.ts';
const XTHEME_TOKEN_ALIAS_LAYER_SUITE_PATH = 'tests/tokens/xtheme_token_alias_layer_suite.js';
const XTHEME_TOKEN_ALIAS_LAYER_LOCAL_GATE = 'node scripts/run_xtend_tests.js xtheme-token-alias-layer --json';
const XTHEME_TOKEN_ALIAS_LAYER_PACKAGE_SCRIPT = 'npm run test:xtheme-token-alias-layer';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const REQUIRED_GLOBAL_PREFIXES = Object.freeze([
  '--xtend-color-',
  '--xtend-surface-',
  '--xtend-text-',
  '--xtend-radius-',
  '--xtend-space-',
  '--xtend-elevation-',
  '--xtend-motion-'
]);

const P0_COMPONENTS = Object.freeze([
  'x-theme',
  'x-header',
  'x-icon',
  'x-button',
  'x-menu',
  'x-drawer',
  'x-side-panel',
  'x-modal',
  'x-dialog',
  'x-popover',
  'x-toast'
]);

const GLOBAL_ALIASES = Object.freeze([
  { name: '--xtend-color-action', category: 'color', mapsTo: '--xtend-color-primary', fallback: 'Highlight' },
  { name: '--xtend-color-action-hover', category: 'color', mapsTo: '--xtend-color-primary-dark', fallback: 'Highlight' },
  { name: '--xtend-color-action-subtle', category: 'color', mapsTo: '--xtend-signature-accent-soft', fallback: 'transparent' },
  { name: '--xtend-color-danger', category: 'color', mapsTo: '--xtend-error-bg', fallback: 'Mark' },
  { name: '--xtend-color-warning', category: 'color', mapsTo: '--xtend-warning-bg', fallback: 'Mark' },
  { name: '--xtend-color-success', category: 'color', mapsTo: '--xtend-success-bg', fallback: 'Mark' },
  { name: '--xtend-surface-page', category: 'surface', mapsTo: '--xtend-surface', fallback: 'Canvas' },
  { name: '--xtend-surface-panel', category: 'surface', mapsTo: '--xtend-surface-muted', fallback: 'Canvas' },
  { name: '--xtend-surface-raised', category: 'surface', mapsTo: '--xtend-signature-surface-raised', fallback: 'Canvas' },
  { name: '--xtend-surface-inset', category: 'surface', mapsTo: '--xtend-signature-surface-inset', fallback: 'Canvas' },
  { name: '--xtend-surface-overlay', category: 'surface', mapsTo: '--xtend-overlay-bg', fallback: 'Canvas' },
  { name: '--xtend-surface-control', category: 'surface', mapsTo: '--xtend-signature-surface-panel', fallback: 'ButtonFace' },
  { name: '--xtend-text-primary', category: 'text', mapsTo: '--xtend-text', fallback: 'CanvasText' },
  { name: '--xtend-text-muted', category: 'text', mapsTo: '--xtend-signature-ink-muted', fallback: 'CanvasText' },
  { name: '--xtend-text-inverse', category: 'text', mapsTo: '--xtend-color-accent', fallback: 'HighlightText' },
  { name: '--xtend-text-on-action', category: 'text', mapsTo: '--xtend-color-accent', fallback: 'HighlightText' },
  { name: '--xtend-border-subtle', category: 'border', mapsTo: '--xtend-border-color', fallback: 'CanvasText' },
  { name: '--xtend-border-strong', category: 'border', mapsTo: '--xtend-border-color', fallback: 'CanvasText' },
  { name: '--xtend-focus-ring', category: 'focus', mapsTo: '--xtend-focus-outline', fallback: '2px solid Highlight' },
  { name: '--xtend-radius-xs', category: 'radius', mapsTo: '--xtend-radius', fallback: '3px' },
  { name: '--xtend-radius-sm', category: 'radius', mapsTo: '--xtend-radius', fallback: '6px' },
  { name: '--xtend-radius-md', category: 'radius', mapsTo: '--xtend-radius', fallback: '10px' },
  { name: '--xtend-radius-lg', category: 'radius', mapsTo: '--xtend-radius', fallback: '14px' },
  { name: '--xtend-radius-panel', category: 'radius', mapsTo: '--xtend-radius-md', fallback: '10px' },
  { name: '--xtend-radius-control', category: 'radius', mapsTo: '--xtend-radius-sm', fallback: '6px' },
  { name: '--xtend-space-1', category: 'space', mapsTo: '--xtend-density-spacing', fallback: '0.375rem' },
  { name: '--xtend-space-2', category: 'space', mapsTo: '--xtend-density-spacing', fallback: '0.75rem' },
  { name: '--xtend-space-3', category: 'space', mapsTo: '--xtend-density-spacing', fallback: '1.125rem' },
  { name: '--xtend-space-4', category: 'space', mapsTo: '--xtend-density-spacing', fallback: '1.5rem' },
  { name: '--xtend-space-control-gap', category: 'space', mapsTo: '--xtend-density-spacing', fallback: '0.6rem' },
  { name: '--xtend-elevation-0', category: 'elevation', mapsTo: '--xtend-shadow', fallback: 'none' },
  { name: '--xtend-elevation-1', category: 'elevation', mapsTo: '--xtend-signature-shadow-control', fallback: 'none' },
  { name: '--xtend-elevation-2', category: 'elevation', mapsTo: '--xtend-shadow', fallback: 'none' },
  { name: '--xtend-elevation-3', category: 'elevation', mapsTo: '--xtend-signature-shadow-overlay', fallback: 'none' },
  { name: '--xtend-elevation-focus', category: 'elevation', mapsTo: '--xtend-focus-outline', fallback: 'none' },
  { name: '--xtend-font-family-body', category: 'typography', mapsTo: '--xtend-font-family', fallback: 'system-ui, sans-serif' },
  { name: '--xtend-font-family-heading', category: 'typography', mapsTo: '--xtend-font-family-body', fallback: 'system-ui, sans-serif' },
  { name: '--xtend-font-family-control', category: 'typography', mapsTo: '--xtend-font-family-body', fallback: 'system-ui, sans-serif' },
  { name: '--xtend-font-size-body', category: 'typography', mapsTo: '--xtend-font-scale', fallback: '0.95rem' },
  { name: '--xtend-font-size-label', category: 'typography', mapsTo: '--xtend-font-scale', fallback: '0.8125rem' },
  { name: '--xtend-font-size-control', category: 'typography', mapsTo: '--xtend-font-scale', fallback: '0.925rem' },
  { name: '--xtend-font-weight-control', category: 'typography', mapsTo: '--xtend-font-family-control', fallback: '560' },
  { name: '--xtend-font-weight-label', category: 'typography', mapsTo: '--xtend-font-family-control', fallback: '620' },
  { name: '--xtend-motion-duration-instant', category: 'motion', mapsTo: '--xtend-motion-duration-fast', fallback: '80ms' },
  { name: '--xtend-motion-easing-standard', category: 'motion', mapsTo: '--xtend-motion-duration-base', fallback: 'cubic-bezier(0.2, 0, 0, 1)' },
  { name: '--xtend-motion-easing-enter', category: 'motion', mapsTo: '--xtend-motion-duration-base', fallback: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  { name: '--xtend-motion-easing-exit', category: 'motion', mapsTo: '--xtend-motion-duration-base', fallback: 'cubic-bezier(0.4, 0, 1, 1)' }
]);

const LEGACY_ALIASES = Object.freeze([
  { legacy: '--xtend-glass-bg', normalized: '--xtend-surface-overlay' },
  { legacy: '--xtend-shadow', normalized: '--xtend-elevation-2' },
  { legacy: '--xtend-radius', normalized: '--xtend-radius-md' },
  { legacy: '--xtend-font-family', normalized: '--xtend-font-family-body' },
  { legacy: '--xtend-overlay-bg', normalized: '--xtend-surface-overlay' },
  { legacy: '--xtend-border-color', normalized: '--xtend-border-subtle' },
  { legacy: '--header-bg', normalized: '--xtend-header-surface' },
  { legacy: '--header-fg', normalized: '--xtend-header-text' },
  { legacy: '--drawer-bg', normalized: '--xtend-drawer-surface' },
  { legacy: '--drawer-color', normalized: '--xtend-drawer-text' },
  { legacy: '--button-text-color', normalized: '--xtend-button-text' }
]);

const COMPONENT_ALIAS_GROUPS = Object.freeze({
  'x-theme': Object.freeze({
    prefix: '--xtend-theme-',
    aliases: Object.freeze([
      { name: '--xtend-theme-surface', role: 'theme provider surface', mapsTo: '--xtend-surface-page' },
      { name: '--xtend-theme-text', role: 'theme provider text', mapsTo: '--xtend-text-primary' }
    ])
  }),
  'x-header': Object.freeze({
    prefix: '--xtend-header-',
    aliases: Object.freeze([
      { name: '--xtend-header-surface', role: 'header shell surface', mapsTo: '--xtend-surface-panel' },
      { name: '--xtend-header-text', role: 'header shell text', mapsTo: '--xtend-text-primary' },
      { name: '--xtend-header-border-color', role: 'header border', mapsTo: '--xtend-border-subtle' },
      { name: '--xtend-header-radius', role: 'header radius', mapsTo: '--xtend-radius-panel' },
      { name: '--xtend-header-elevation', role: 'header elevation', mapsTo: '--xtend-elevation-1' },
      { name: '--xtend-header-menu-surface', role: 'header menu surface', mapsTo: '--xtend-surface-raised' },
      { name: '--xtend-header-menu-text', role: 'header menu text', mapsTo: '--xtend-text-primary' }
    ])
  }),
  'x-icon': Object.freeze({
    prefix: '--xtend-icon-',
    aliases: Object.freeze([
      { name: '--xtend-icon-color', role: 'icon stroke or fill color', mapsTo: 'currentColor' },
      { name: '--xtend-icon-size', role: 'icon square size', mapsTo: '1em' },
      { name: '--xtend-icon-stroke-width', role: 'icon stroke width', mapsTo: '2' }
    ])
  }),
  'x-button': Object.freeze({
    prefix: '--xtend-button-',
    aliases: Object.freeze([
      { name: '--xtend-button-surface', role: 'button default surface', mapsTo: '--xtend-surface-control' },
      { name: '--xtend-button-text', role: 'button default text', mapsTo: '--xtend-text-primary' },
      { name: '--xtend-button-primary-surface', role: 'primary button surface', mapsTo: '--xtend-color-action' },
      { name: '--xtend-button-primary-text', role: 'primary button text', mapsTo: '--xtend-text-on-action' },
      { name: '--xtend-button-radius', role: 'button radius', mapsTo: '--xtend-radius-control' },
      { name: '--xtend-button-elevation', role: 'button elevation', mapsTo: '--xtend-elevation-1' },
      { name: '--xtend-button-focus-outline', role: 'button focus outline', mapsTo: '--xtend-focus-ring' }
    ])
  }),
  'x-menu': Object.freeze({
    prefix: '--xtend-menu-',
    aliases: Object.freeze([
      { name: '--xtend-menu-surface', role: 'menu shell surface', mapsTo: '--xtend-surface-panel' },
      { name: '--xtend-menu-text', role: 'menu shell text', mapsTo: '--xtend-text-primary' },
      { name: '--xtend-menu-item-surface', role: 'menu item surface', mapsTo: 'transparent' },
      { name: '--xtend-menu-item-hover-surface', role: 'menu item hover surface', mapsTo: '--xtend-color-action-subtle' },
      { name: '--xtend-menu-item-text', role: 'menu item text', mapsTo: '--xtend-text-primary' },
      { name: '--xtend-menu-radius', role: 'menu radius', mapsTo: '--xtend-radius-panel' },
      { name: '--xtend-menu-elevation', role: 'menu elevation', mapsTo: '--xtend-elevation-1' }
    ])
  }),
  'x-drawer': Object.freeze({
    prefix: '--xtend-drawer-',
    aliases: Object.freeze([
      { name: '--xtend-drawer-surface', role: 'drawer surface', mapsTo: '--xtend-surface-panel' },
      { name: '--xtend-drawer-text', role: 'drawer text', mapsTo: '--xtend-text-primary' },
      { name: '--xtend-drawer-border', role: 'drawer border', mapsTo: '--xtend-border-subtle' },
      { name: '--xtend-drawer-elevation', role: 'drawer elevation', mapsTo: '--xtend-elevation-3' },
      { name: '--xtend-drawer-overlay-surface', role: 'drawer overlay surface', mapsTo: '--xtend-surface-overlay' }
    ])
  }),
  'x-side-panel': Object.freeze({
    prefix: '--xtend-side-panel-',
    aliases: Object.freeze([
      { name: '--xtend-side-panel-surface', role: 'side panel surface', mapsTo: '--xtend-surface-panel' },
      { name: '--xtend-side-panel-text', role: 'side panel text', mapsTo: '--xtend-text-primary' },
      { name: '--xtend-side-panel-border', role: 'side panel border', mapsTo: '--xtend-border-subtle' },
      { name: '--xtend-side-panel-elevation', role: 'side panel elevation', mapsTo: '--xtend-elevation-2' }
    ])
  }),
  'x-modal': Object.freeze({
    prefix: '--xtend-modal-',
    aliases: Object.freeze([
      { name: '--xtend-modal-surface', role: 'modal surface', mapsTo: '--xtend-surface-raised' },
      { name: '--xtend-modal-text', role: 'modal text', mapsTo: '--xtend-text-primary' },
      { name: '--xtend-modal-overlay-surface', role: 'modal overlay surface', mapsTo: '--xtend-surface-overlay' },
      { name: '--xtend-modal-elevation', role: 'modal elevation', mapsTo: '--xtend-elevation-3' }
    ])
  }),
  'x-dialog': Object.freeze({
    prefix: '--xtend-dialog-',
    aliases: Object.freeze([
      { name: '--xtend-dialog-surface', role: 'dialog surface', mapsTo: '--xtend-surface-raised' },
      { name: '--xtend-dialog-text', role: 'dialog text', mapsTo: '--xtend-text-primary' },
      { name: '--xtend-dialog-elevation', role: 'dialog elevation', mapsTo: '--xtend-elevation-3' }
    ])
  }),
  'x-popover': Object.freeze({
    prefix: '--xtend-popover-',
    aliases: Object.freeze([
      { name: '--xtend-popover-surface', role: 'popover surface', mapsTo: '--xtend-surface-raised' },
      { name: '--xtend-popover-text', role: 'popover text', mapsTo: '--xtend-text-primary' },
      { name: '--xtend-popover-elevation', role: 'popover elevation', mapsTo: '--xtend-elevation-2' }
    ])
  }),
  'x-toast': Object.freeze({
    prefix: '--xtend-toast-',
    aliases: Object.freeze([
      { name: '--xtend-toast-surface', role: 'toast surface', mapsTo: '--xtend-surface-raised' },
      { name: '--xtend-toast-text', role: 'toast text', mapsTo: '--xtend-text-primary' },
      { name: '--xtend-toast-elevation', role: 'toast elevation', mapsTo: '--xtend-elevation-2' }
    ])
  })
});

const THEME_VARIANTS = Object.freeze({
  light: Object.freeze({
    requiredReadablePairs: Object.freeze([
      ['--xtend-surface-page', '--xtend-text-primary'],
      ['--xtend-surface-panel', '--xtend-text-primary'],
      ['--xtend-color-action', '--xtend-text-on-action']
    ])
  }),
  dark: Object.freeze({
    requiredReadablePairs: Object.freeze([
      ['--xtend-surface-page', '--xtend-text-primary'],
      ['--xtend-surface-panel', '--xtend-text-primary'],
      ['--xtend-color-action', '--xtend-text-on-action']
    ])
  }),
  'high-contrast': Object.freeze({
    requiredReadablePairs: Object.freeze([
      ['--xtend-surface-page', '--xtend-text-primary'],
      ['--xtend-color-action', '--xtend-text-on-action']
    ])
  }),
  'forced-colors': Object.freeze({
    systemColors: Object.freeze(['Canvas', 'CanvasText', 'Highlight', 'HighlightText', 'ButtonFace', 'ButtonText']),
    requiredReadablePairs: Object.freeze([
      ['Canvas', 'CanvasText'],
      ['Highlight', 'HighlightText'],
      ['ButtonFace', 'ButtonText']
    ])
  })
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function aliasValue(alias) {
  if (!alias || !alias.mapsTo) return '';
  if (String(alias.mapsTo).startsWith('--')) {
    return `var(${alias.mapsTo}, ${alias.fallback || 'initial'})`;
  }
  return String(alias.mapsTo);
}

function createGlobalAliasTokenMap() {
  return GLOBAL_ALIASES.reduce((tokens, alias) => {
    tokens[alias.name] = aliasValue(alias);
    return tokens;
  }, {});
}

function createComponentAliasTokenMap(componentTag) {
  const group = COMPONENT_ALIAS_GROUPS[componentTag];
  if (!group) return {};
  return group.aliases.reduce((tokens, alias) => {
    tokens[alias.name] = aliasValue(alias);
    return tokens;
  }, {});
}

function createAllComponentAliasTokenMap() {
  return P0_COMPONENTS.reduce((tokens, tag) => ({
    ...tokens,
    ...createComponentAliasTokenMap(tag)
  }), {});
}

function createXThemeAliasThemeTokens(themeName = 'light') {
  const tokens = {
    ...createGlobalAliasTokenMap(),
    ...createAllComponentAliasTokenMap()
  };

  if (themeName === 'forced-colors') {
    return {
      ...tokens,
      '--xtend-color-action': 'Highlight',
      '--xtend-color-action-hover': 'Highlight',
      '--xtend-surface-page': 'Canvas',
      '--xtend-surface-panel': 'Canvas',
      '--xtend-surface-raised': 'Canvas',
      '--xtend-surface-inset': 'Canvas',
      '--xtend-surface-overlay': 'Canvas',
      '--xtend-surface-control': 'ButtonFace',
      '--xtend-text-primary': 'CanvasText',
      '--xtend-text-muted': 'CanvasText',
      '--xtend-text-on-action': 'HighlightText',
      '--xtend-border-subtle': 'CanvasText',
      '--xtend-border-strong': 'CanvasText',
      '--xtend-elevation-0': 'none',
      '--xtend-elevation-1': 'none',
      '--xtend-elevation-2': 'none',
      '--xtend-elevation-3': 'none',
      '--xtend-elevation-focus': 'none'
    };
  }

  return tokens;
}

function createXThemeTokenAliasLayer() {
  return {
    schema: XTHEME_TOKEN_ALIAS_LAYER_SCHEMA,
    reportSchema: XTHEME_TOKEN_ALIAS_LAYER_REPORT_SCHEMA,
    workpackage: XTHEME_TOKEN_ALIAS_LAYER_WORKPACKAGE,
    status: 'completed-token-alias-layer',
    runtimeProvider: 'x-theme',
    namespace: '--xtend-',
    canonicalPrefixes: REQUIRED_GLOBAL_PREFIXES.slice(),
    globalAliases: clone(GLOBAL_ALIASES),
    legacyAliases: clone(LEGACY_ALIASES),
    componentAliases: clone(COMPONENT_ALIAS_GROUPS),
    p0Components: P0_COMPONENTS.slice(),
    themeVariants: clone(THEME_VARIANTS),
    overrideContract: {
      cssEntry: 'XTend.css',
      themeEntry: 'x-theme.registerTheme()',
      componentScopedAliasesRequired: true,
      noComponentLocalThemeForks: true,
      forcedColorsRequired: true,
      hostCanOverrideEveryVisibleSurface: true
    },
    docs: {
      mapping: XTHEME_TOKEN_ALIAS_LAYER_DOC_PATH,
      fixture: XTHEME_TOKEN_ALIAS_LAYER_FIXTURE_PATH
    },
    gates: {
      localGate: XTHEME_TOKEN_ALIAS_LAYER_LOCAL_GATE,
      packageScript: XTHEME_TOKEN_ALIAS_LAYER_PACKAGE_SCRIPT,
      requiredSuites: ['xtheme-token-alias-layer', 'design-tokens', 'component-shell-theme-matrix']
    },
    kernelBoundary: KERNEL_BOUNDARY
  };
}

function validateXThemeTokenAliasLayer(layer = createXThemeTokenAliasLayer()) {
  const errors = [];

  if (!layer || layer.schema !== XTHEME_TOKEN_ALIAS_LAYER_SCHEMA) errors.push(`schema must be ${XTHEME_TOKEN_ALIAS_LAYER_SCHEMA}`);
  if (!layer || layer.reportSchema !== XTHEME_TOKEN_ALIAS_LAYER_REPORT_SCHEMA) errors.push(`reportSchema must be ${XTHEME_TOKEN_ALIAS_LAYER_REPORT_SCHEMA}`);
  if (!layer || layer.workpackage !== XTHEME_TOKEN_ALIAS_LAYER_WORKPACKAGE) errors.push(`workpackage must be ${XTHEME_TOKEN_ALIAS_LAYER_WORKPACKAGE}`);
  if (!layer || layer.runtimeProvider !== 'x-theme') errors.push('runtimeProvider must be x-theme');
  if (!layer || layer.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernel boundary must be ${KERNEL_BOUNDARY}`);

  const globalAliases = Array.isArray(layer.globalAliases) ? layer.globalAliases : [];
  const globalNames = globalAliases.map((alias) => alias.name);
  REQUIRED_GLOBAL_PREFIXES.forEach((prefix) => {
    if (!globalNames.some((name) => String(name).startsWith(prefix))) {
      errors.push(`missing global alias prefix ${prefix}`);
    }
  });

  P0_COMPONENTS.forEach((tag) => {
    const group = layer.componentAliases && layer.componentAliases[tag];
    if (!group || !Array.isArray(group.aliases)) {
      errors.push(`missing component alias group ${tag}`);
      return;
    }
    if (!group.aliases.every((alias) => String(alias.name).startsWith(group.prefix))) {
      errors.push(`component aliases for ${tag} must use ${group.prefix}`);
    }
    if (!group.aliases.some((alias) => alias.name.includes('surface') || alias.name.includes('color'))) {
      errors.push(`component aliases for ${tag} must include a visible surface/color token`);
    }
  });

  ['light', 'dark', 'high-contrast', 'forced-colors'].forEach((themeName) => {
    if (!layer.themeVariants || !layer.themeVariants[themeName]) {
      errors.push(`missing theme variant ${themeName}`);
    }
  });

  const forcedColors = layer.themeVariants && layer.themeVariants['forced-colors'];
  ['Canvas', 'CanvasText', 'Highlight', 'HighlightText'].forEach((systemColor) => {
    if (!forcedColors || !forcedColors.systemColors || !forcedColors.systemColors.includes(systemColor)) {
      errors.push(`forced-colors missing ${systemColor}`);
    }
  });

  const legacyAliases = Array.isArray(layer.legacyAliases) ? layer.legacyAliases : [];
  ['--xtend-shadow', '--xtend-radius', '--xtend-font-family', '--header-bg', '--button-text-color'].forEach((legacy) => {
    if (!legacyAliases.some((alias) => alias.legacy === legacy && String(alias.normalized).startsWith('--xtend-'))) {
      errors.push(`missing legacy mapping ${legacy}`);
    }
  });

  return {
    schema: XTHEME_TOKEN_ALIAS_LAYER_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  COMPONENT_ALIAS_GROUPS,
  GLOBAL_ALIASES,
  KERNEL_BOUNDARY,
  LEGACY_ALIASES,
  P0_COMPONENTS,
  REQUIRED_GLOBAL_PREFIXES,
  THEME_VARIANTS,
  XTHEME_TOKEN_ALIAS_LAYER_DOC_PATH,
  XTHEME_TOKEN_ALIAS_LAYER_FIXTURE_PATH,
  XTHEME_TOKEN_ALIAS_LAYER_LOCAL_GATE,
  XTHEME_TOKEN_ALIAS_LAYER_MODULE_PATH,
  XTHEME_TOKEN_ALIAS_LAYER_PACKAGE_SCRIPT,
  XTHEME_TOKEN_ALIAS_LAYER_REPORT_SCHEMA,
  XTHEME_TOKEN_ALIAS_LAYER_SCHEMA,
  XTHEME_TOKEN_ALIAS_LAYER_SUITE_PATH,
  XTHEME_TOKEN_ALIAS_LAYER_TYPES_PATH,
  XTHEME_TOKEN_ALIAS_LAYER_WORKPACKAGE,
  createAllComponentAliasTokenMap,
  createComponentAliasTokenMap,
  createGlobalAliasTokenMap,
  createXThemeAliasThemeTokens,
  createXThemeTokenAliasLayer,
  validateXThemeTokenAliasLayer
};
