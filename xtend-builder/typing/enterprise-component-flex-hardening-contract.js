const ENTERPRISE_COMPONENT_FLEX_HARDENING_SCHEMA = 'xtend.enterprise.component-flex-hardening.v1';
const ENTERPRISE_COMPONENT_FLEX_HARDENING_REPORT_SCHEMA = 'xtend.enterprise.component-flex-hardening-report.v1';
const ENTERPRISE_COMPONENT_FLEX_HARDENING_WORKPACKAGE = 'ECH-WP-01';
const ENTERPRISE_COMPONENT_FLEX_HARDENING_CONTRACT_DOC = 'development/XTend-Enterprise-Component-Flexibilitaets-und-Theme-Hardening-Backlog.md';
const SIGNATURE_UI_DIRECTION_SCHEMA = 'xtend.signature-ui.direction.v1';
const COMPONENT_SHELL_CONTRACT_SCHEMA = 'xtend.component.shell.v1';
const COMPONENT_STYLING_CONTRACT_SCHEMA = 'xtend.component.styling.v1';
const RUNTIME_A11Y_CONTRACT_SCHEMA = 'xtend.component.runtime-a11y.v1';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const FLEX_HARDENING_RULE_IDS = Object.freeze([
  'R1',
  'R2',
  'R3',
  'R4',
  'R5',
  'R6',
  'R7',
  'R8',
  'R9',
  'R10',
  'R11',
  'R12'
]);

const FLEX_HARDENING_REQUIRED_DOMAINS = Object.freeze([
  'sourceContracts',
  'rules',
  'publicOverridePolicy',
  'themeCompatibility',
  'signatureDefault',
  'typography',
  'controlIconography',
  'layoutVariants',
  'xHeaderPilot',
  'docs',
  'gates',
  'residualPolicy',
  'handoff'
]);

const FLEX_HARDENING_THEME_MODES = Object.freeze([
  'light',
  'dark',
  'high-contrast',
  'forced-colors',
  'prefers-reduced-motion',
  'comfortable',
  'compact',
  'dense'
]);

const FLEX_HARDENING_TYPOGRAPHY_ROLES = Object.freeze([
  'display',
  'heading',
  'body',
  'label',
  'control',
  'caption',
  'numeric',
  'code'
]);

const FLEX_HARDENING_XHEADER_MENU_MODES = Object.freeze([
  'drawer',
  'side-panel',
  'popover',
  'fullscreen',
  'inline-main'
]);

const FLEX_HARDENING_REQUIRED_GATES = Object.freeze([
  'signature-ui-visual-quality',
  'enterprise-component-style-audit',
  'xheader-menu-modes',
  'component-shell-theme-matrix',
  'runtime-a11y-contract',
  'components'
]);

const RULE_DEFINITIONS = Object.freeze([
  {
    id: 'R1',
    domain: 'public-overrides',
    title: 'Keine visuell wirksame Hardcodierung ohne Public Override',
    verifies: ['color', 'border', 'radius', 'typography', 'spacing', 'motion', 'elevation', 'layout']
  },
  {
    id: 'R2',
    domain: 'tokens',
    title: 'Tokens folgen einer stabilen Alias-Kette',
    verifies: ['component-token', 'global-token', 'safe-fallback']
  },
  {
    id: 'R3',
    domain: 'parts',
    title: 'CSS Parts sind Skinning API',
    verifies: ['root', 'control', 'content', 'label', 'icon', 'surface']
  },
  {
    id: 'R4',
    domain: 'theme',
    title: 'XTheme ist Pflicht',
    verifies: FLEX_HARDENING_THEME_MODES
  },
  {
    id: 'R5',
    domain: 'controls',
    title: 'Keine Textzeichen, Emojis oder Glyphen als Controls',
    verifies: ['x-icon', 'inline-svg', 'css-graphic', 'aria-label', 'focus-visible']
  },
  {
    id: 'R6',
    domain: 'layout',
    title: 'Layoutvarianten sind Attribute, Tokens und Snapshots',
    verifies: ['attribute', 'token', 'snapshot', 'event', 'docs', 'fixture']
  },
  {
    id: 'R7',
    domain: 'shadow-dom',
    title: 'Shadow DOM darf Host-Design nicht blockieren',
    verifies: ['parts', 'custom-properties', 'slots', 'no-global-font-assumption']
  },
  {
    id: 'R8',
    domain: 'runtime-a11y',
    title: 'Accessibility gehoert zur Variante',
    verifies: ['keyboard', 'focus', 'escape', 'inert', 'focus-return', 'semantics']
  },
  {
    id: 'R9',
    domain: 'docs',
    title: 'Docs zeigen Override-Flaechen, nicht nur Defaults',
    verifies: ['tokens', 'parts', 'slots', 'xtheme', 'a11y', 'corporate-theme']
  },
  {
    id: 'R10',
    domain: 'gates',
    title: 'Gates muessen Drift verhindern',
    verifies: FLEX_HARDENING_REQUIRED_GATES
  },
  {
    id: 'R11',
    domain: 'signature-ui',
    title: 'Default UI muss eine XTend Signature haben',
    verifies: ['quiet-precision', 'material-ohne-dekor', 'productive-density', 'distinct-enterprise-voice']
  },
  {
    id: 'R12',
    domain: 'typography',
    title: 'Typografie ist ein eigenstaendiges Designsystem',
    verifies: FLEX_HARDENING_TYPOGRAPHY_ROLES
  }
]);

function normalizeArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function includesAll(actual, expected) {
  const values = normalizeArray(actual);
  return expected.every((entry) => values.includes(entry));
}

function createEnterpriseComponentFlexHardeningContract(input = {}) {
  const rules = normalizeArray(input.rules).length > 0 ? normalizeArray(input.rules) : RULE_DEFINITIONS.map((rule) => ({ ...rule }));
  const sourceContracts = normalizeArray(input.sourceContracts).length > 0
    ? normalizeArray(input.sourceContracts)
    : [
      COMPONENT_SHELL_CONTRACT_SCHEMA,
      COMPONENT_STYLING_CONTRACT_SCHEMA,
      RUNTIME_A11Y_CONTRACT_SCHEMA,
      SIGNATURE_UI_DIRECTION_SCHEMA
    ];

  return {
    schema: ENTERPRISE_COMPONENT_FLEX_HARDENING_SCHEMA,
    reportSchema: ENTERPRISE_COMPONENT_FLEX_HARDENING_REPORT_SCHEMA,
    status: input.status || 'accepted-contract',
    workpackage: ENTERPRISE_COMPONENT_FLEX_HARDENING_WORKPACKAGE,
    contract: ENTERPRISE_COMPONENT_FLEX_HARDENING_CONTRACT_DOC,
    sourceContracts,
    rules,
    publicOverridePolicy: {
      noVisualHardcodingWithoutOverride: true,
      tokenAliasChain: ['component-token', 'global-xtend-token', 'safe-fallback'],
      requiredVisualDomains: ['color', 'border', 'radius', 'typography', 'spacing', 'motion', 'elevation', 'layout', 'z-index'],
      cssPartsPublicApi: true,
      shadowDomSkinningRequired: true
    },
    themeCompatibility: {
      provider: 'x-theme',
      requiredModes: FLEX_HARDENING_THEME_MODES.slice(),
      noUnreadableSurfaces: true,
      forcedColorsRequired: true,
      reducedMotionRequired: true,
      noColorOnlyState: true
    },
    signatureDefault: {
      schema: SIGNATURE_UI_DIRECTION_SCHEMA,
      required: true,
      qualities: ['quiet-precision', 'material-ohne-dekor', 'productive-density', 'strong-defaults-strong-overrides', 'distinct-enterprise-voice'],
      antiPatterns: ['generic-saas-ui', 'tailwind-lookalike', 'card-stack-without-hierarchy', 'one-color-palette', 'decorative-gradient-as-structure'],
      fixture: 'tests/browser/fixtures/xtend-signature-ui-smoke.html',
      theme: 'design-tokens/themes/xtend-signature.json'
    },
    typography: {
      required: true,
      roles: FLEX_HARDENING_TYPOGRAPHY_ROLES.slice(),
      tokenPrefix: '--xtend-font-',
      noViewportScaledFonts: true,
      noNegativeLetterSpacingDefaults: true,
      corporateFontBridgeRequired: true
    },
    controlIconography: {
      noTextGlyphControls: true,
      allowedRenderers: ['x-icon', 'inline-svg', 'tokenized-css-graphic'],
      requiredA11y: ['native-button-or-equivalent', 'accessible-name', 'focus-visible'],
      requiredParts: ['control', 'icon']
    },
    layoutVariants: {
      publicApiRequired: true,
      requiredSurfaces: ['attribute-or-property', 'tokens', 'css-parts', 'snapshot', 'event', 'docs', 'fixture'],
      rmtAuthoringWhenCompatible: true
    },
    xHeaderPilot: {
      tag: 'x-header',
      requiredMenuModes: FLEX_HARDENING_XHEADER_MENU_MODES.slice(),
      requiredSnapshotFields: ['menuOpen', 'menuMode', 'menuPlacement', 'menuModal', 'compact'],
      signatureTokenPilot: true,
      legacyDrawerAliasAllowed: true
    },
    docs: {
      requiredSections: ['Sichtbare Design-Ambition', 'Nicht verhandelbare Regeln', 'Audit-Checkliste je Komponente', 'XHeader Zielbild', 'Backlog-Uebersicht', 'Definition of Done'],
      corporateThemeExampleRequired: true,
      signatureDesignNotesRequiredForP0: true
    },
    gates: {
      localGate: 'node scripts/run_xtend_tests.js enterprise-component-flex-hardening-contract --json',
      required: FLEX_HARDENING_REQUIRED_GATES.slice(),
      reportSchema: ENTERPRISE_COMPONENT_FLEX_HARDENING_REPORT_SCHEMA,
      driftBlocking: true
    },
    residualPolicy: {
      allowedOnlyWithOwnerAndExpiry: true,
      blockedResiduals: ['unreadable-dark-mode', 'unreadable-light-mode', 'invisible-focus', 'text-glyph-control', 'generic-default-ui', 'typography-without-roles']
    },
    handoff: {
      nextWorkpackages: ['ECH-WP-02', 'ECH-WP-03', 'ECH-WP-04', 'ECH-WP-05'],
      kernelBoundary: KERNEL_BOUNDARY,
      localOnly: true
    }
  };
}

function validateEnterpriseComponentFlexHardeningContract(contract = {}) {
  const errors = [];

  if (contract.schema !== ENTERPRISE_COMPONENT_FLEX_HARDENING_SCHEMA) {
    errors.push(`schema must be ${ENTERPRISE_COMPONENT_FLEX_HARDENING_SCHEMA}`);
  }
  if (contract.reportSchema !== ENTERPRISE_COMPONENT_FLEX_HARDENING_REPORT_SCHEMA) {
    errors.push(`reportSchema must be ${ENTERPRISE_COMPONENT_FLEX_HARDENING_REPORT_SCHEMA}`);
  }
  if (contract.workpackage !== ENTERPRISE_COMPONENT_FLEX_HARDENING_WORKPACKAGE) {
    errors.push(`workpackage must be ${ENTERPRISE_COMPONENT_FLEX_HARDENING_WORKPACKAGE}`);
  }
  FLEX_HARDENING_REQUIRED_DOMAINS.forEach((domain) => {
    if (!contract[domain]) errors.push(`missing domain: ${domain}`);
  });
  if (!includesAll(contract.sourceContracts, [COMPONENT_SHELL_CONTRACT_SCHEMA, COMPONENT_STYLING_CONTRACT_SCHEMA, RUNTIME_A11Y_CONTRACT_SCHEMA, SIGNATURE_UI_DIRECTION_SCHEMA])) {
    errors.push('sourceContracts must include shell, styling, runtime-a11y and signature-ui direction schemas');
  }
  const ruleIds = normalizeArray(contract.rules).map((rule) => rule && rule.id);
  if (!includesAll(ruleIds, FLEX_HARDENING_RULE_IDS) || ruleIds.length < FLEX_HARDENING_RULE_IDS.length) {
    errors.push(`rules must include ${FLEX_HARDENING_RULE_IDS.join(', ')}`);
  }
  if (!contract.publicOverridePolicy || contract.publicOverridePolicy.noVisualHardcodingWithoutOverride !== true) {
    errors.push('publicOverridePolicy.noVisualHardcodingWithoutOverride must be true');
  }
  if (!contract.themeCompatibility || !includesAll(contract.themeCompatibility.requiredModes, FLEX_HARDENING_THEME_MODES)) {
    errors.push(`themeCompatibility.requiredModes must include ${FLEX_HARDENING_THEME_MODES.join(', ')}`);
  }
  if (!contract.signatureDefault || contract.signatureDefault.required !== true || !normalizeArray(contract.signatureDefault.antiPatterns).includes('tailwind-lookalike')) {
    errors.push('signatureDefault must be required and reject tailwind-lookalike defaults');
  }
  if (!contract.typography || contract.typography.required !== true || !includesAll(contract.typography.roles, FLEX_HARDENING_TYPOGRAPHY_ROLES)) {
    errors.push(`typography.roles must include ${FLEX_HARDENING_TYPOGRAPHY_ROLES.join(', ')}`);
  }
  if (!contract.controlIconography || contract.controlIconography.noTextGlyphControls !== true) {
    errors.push('controlIconography.noTextGlyphControls must be true');
  }
  if (!contract.layoutVariants || contract.layoutVariants.publicApiRequired !== true) {
    errors.push('layoutVariants.publicApiRequired must be true');
  }
  if (!contract.xHeaderPilot || !includesAll(contract.xHeaderPilot.requiredMenuModes, FLEX_HARDENING_XHEADER_MENU_MODES)) {
    errors.push(`xHeaderPilot.requiredMenuModes must include ${FLEX_HARDENING_XHEADER_MENU_MODES.join(', ')}`);
  }
  if (!contract.gates || !includesAll(contract.gates.required, FLEX_HARDENING_REQUIRED_GATES)) {
    errors.push(`gates.required must include ${FLEX_HARDENING_REQUIRED_GATES.join(', ')}`);
  }
  if (!contract.handoff || contract.handoff.kernelBoundary !== KERNEL_BOUNDARY || contract.handoff.localOnly !== true) {
    errors.push('handoff must preserve kernel boundary and local-only policy');
  }

  return {
    schema: ENTERPRISE_COMPONENT_FLEX_HARDENING_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    ruleCount: ruleIds.length
  };
}

module.exports = {
  COMPONENT_SHELL_CONTRACT_SCHEMA,
  COMPONENT_STYLING_CONTRACT_SCHEMA,
  ENTERPRISE_COMPONENT_FLEX_HARDENING_CONTRACT_DOC,
  ENTERPRISE_COMPONENT_FLEX_HARDENING_REPORT_SCHEMA,
  ENTERPRISE_COMPONENT_FLEX_HARDENING_SCHEMA,
  ENTERPRISE_COMPONENT_FLEX_HARDENING_WORKPACKAGE,
  FLEX_HARDENING_REQUIRED_DOMAINS,
  FLEX_HARDENING_REQUIRED_GATES,
  FLEX_HARDENING_RULE_IDS,
  FLEX_HARDENING_THEME_MODES,
  FLEX_HARDENING_TYPOGRAPHY_ROLES,
  FLEX_HARDENING_XHEADER_MENU_MODES,
  KERNEL_BOUNDARY,
  RUNTIME_A11Y_CONTRACT_SCHEMA,
  SIGNATURE_UI_DIRECTION_SCHEMA,
  createEnterpriseComponentFlexHardeningContract,
  validateEnterpriseComponentFlexHardeningContract
};
