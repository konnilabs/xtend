const fs = require('fs');
const path = require('path');
const {
  COMPONENT_ALIAS_GROUPS,
  LEGACY_ALIASES,
  P0_COMPONENTS
} = require('../design-tokens/xtheme-token-alias-layer');

const ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SCHEMA = 'xtend.enterprise.third-party-authoring-guide.v1';
const ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_REPORT_SCHEMA = 'xtend.enterprise.third-party-authoring-guide-report.v1';
const ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_WORKPACKAGE = 'ECH-WP-11';
const ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC = 'docs/third-party-design-authoring.md';
const ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_MODULE = 'catalog/enterprise-third-party-authoring-guide.js';
const ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SUITE = 'tests/docs/enterprise_third_party_authoring_guide_suite.js';
const ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_LOCAL_GATE = 'node scripts/run_xtend_tests.js enterprise-third-party-authoring-guide --json';
const ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_PACKAGE_SCRIPT = 'npm run test:enterprise-third-party-authoring-guide';

const REQUIRED_SECTIONS = Object.freeze([
  'XTend.css Override Patterns',
  'XTheme Token Bridge',
  'CSS Parts',
  'Icon Pack Registrierung',
  'Layout Modes',
  'A11y-Dos and Donts',
  'Vollstaendiges Fremdtheme-Beispiel',
  'P0 Token-/Part-Referenz',
  'Migration von Legacy Token-Namen'
]);

const REQUIRED_THEME_MODES = Object.freeze(['light', 'dark', 'high-contrast', 'forced-colors']);
const REQUIRED_DENSITIES = Object.freeze(['comfortable', 'compact', 'dense']);
const REQUIRED_A11Y_MARKERS = Object.freeze([
  'prefers-reduced-motion',
  'forced-colors',
  'Canvas',
  'CanvasText',
  'Highlight',
  'HighlightText',
  'focus-visible',
  'nicht nur ueber Farbe'
]);

const P0_COMPONENT_REFERENCES = Object.freeze([
  {
    tag: 'x-theme',
    doc: 'docs/components/xtheme.md',
    tokenSection: 'Zentrale XTend-Tokens',
    partSection: 'Design Tokens',
    parts: ['root'],
    primaryTokens: ['--xtend-theme-surface', '--xtend-theme-text']
  },
  {
    tag: 'x-header',
    doc: 'docs/components/xheader.md',
    tokenSection: 'ECH-WP-07 Token-Tabelle und signatureDesign',
    partSection: 'CSS Parts',
    parts: ['root', 'brand', 'trigger', 'trigger-icon', 'menu', 'menu-surface', 'backdrop'],
    primaryTokens: ['--xtend-header-surface', '--xtend-header-menu-surface', '--xtend-nav-active-surface']
  },
  {
    tag: 'x-icon',
    doc: 'docs/components/xicon.md',
    tokenSection: 'Styling & Theming',
    partSection: 'ECH-WP-04 Control-Regel',
    parts: ['root', 'control', 'icon'],
    primaryTokens: ['--xtend-icon-color', '--xtend-icon-size', '--xtend-icon-stroke-width']
  },
  {
    tag: 'x-button',
    doc: 'docs/components/xbutton.md',
    tokenSection: 'Styling & Theming',
    partSection: 'Accessibility',
    parts: ['root', 'control', 'label', 'icon'],
    primaryTokens: ['--xtend-button-surface', '--xtend-button-primary-surface', '--xtend-button-focus-outline']
  },
  {
    tag: 'x-menu',
    doc: 'docs/components/xmenu.md',
    tokenSection: 'ECH-WP-09 Token-Tabelle und Navigation States',
    partSection: 'ECH-WP-09 Keyboard-Verhalten',
    parts: ['root', 'nav', 'item', 'disclosure-icon'],
    primaryTokens: ['--xtend-menu-surface', '--xtend-menu-item-hover-surface', '--xtend-nav-current-indicator']
  },
  {
    tag: 'x-drawer',
    doc: 'docs/components/xdrawer.md',
    tokenSection: 'ECH-WP-06 Overlay-Paritaet',
    partSection: 'ECH-WP-06 Overlay-Paritaet',
    parts: ['root', 'surface', 'backdrop', 'close', 'content'],
    primaryTokens: ['--xtend-drawer-surface', '--xtend-drawer-overlay-surface', '--xtend-overlay-backdrop']
  },
  {
    tag: 'x-side-panel',
    doc: 'docs/components/xsidepanel.md',
    tokenSection: 'ECH-WP-06 Overlay-Paritaet',
    partSection: 'ECH-WP-06 Overlay-Paritaet',
    parts: ['root', 'surface', 'backdrop', 'close', 'content'],
    primaryTokens: ['--xtend-side-panel-surface', '--xtend-side-panel-text', '--xtend-overlay-focus-ring']
  },
  {
    tag: 'x-modal',
    doc: 'docs/components/xmodal.md',
    tokenSection: 'ECH-WP-06 Overlay-Paritaet',
    partSection: 'ECH-WP-06 Overlay-Paritaet',
    parts: ['root', 'surface', 'backdrop', 'close', 'content'],
    primaryTokens: ['--xtend-modal-surface', '--xtend-modal-overlay-surface', '--xtend-overlay-elevation']
  },
  {
    tag: 'x-dialog',
    doc: 'docs/components/xdialog.md',
    tokenSection: 'ECH-WP-06 Overlay-Paritaet',
    partSection: 'ECH-WP-06 Overlay-Paritaet',
    parts: ['root', 'surface', 'backdrop', 'close', 'content'],
    primaryTokens: ['--xtend-dialog-surface', '--xtend-dialog-text', '--xtend-overlay-radius']
  },
  {
    tag: 'x-popover',
    doc: 'docs/components/xpopover.md',
    tokenSection: 'ECH-WP-06 Overlay-Paritaet',
    partSection: 'ECH-WP-06 Overlay-Paritaet',
    parts: ['root', 'surface', 'backdrop', 'close', 'content'],
    primaryTokens: ['--xtend-popover-surface', '--xtend-popover-text', '--xtend-popover-elevation']
  },
  {
    tag: 'x-toast',
    doc: 'docs/components/xtoast.md',
    tokenSection: 'Styling & Theming',
    partSection: 'Accessibility',
    parts: ['root', 'surface', 'content', 'close', 'icon'],
    primaryTokens: ['--xtend-toast-surface', '--xtend-toast-text', '--xtend-toast-elevation']
  }
]);

function resolveRootDir(rootDir) {
  return rootDir || path.resolve(__dirname, '..');
}

function readFile(rootDir, relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function createEnterpriseThirdPartyAuthoringGuide(options = {}) {
  return {
    schema: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SCHEMA,
    reportSchema: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_REPORT_SCHEMA,
    workpackage: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_WORKPACKAGE,
    status: 'completed-third-party-authoring-guide',
    generatedAt: options.generatedAt || 'static-local',
    module: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_MODULE,
    docs: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC,
    suite: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SUITE,
    localGate: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_LOCAL_GATE,
    packageScript: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_PACKAGE_SCRIPT,
    sourceContracts: [
      'xtend.enterprise.component-flex-hardening.v1',
      'xtend.theme.token-alias-layer.v1',
      'xtend.signature-ui.visual-quality-report.v1',
      'xtend.design-tokens.product-contract.v1',
      'xtend.component.styling.v1',
      'xtend.component.runtime-a11y.v1'
    ],
    requiredSections: REQUIRED_SECTIONS.slice(),
    themeModes: REQUIRED_THEME_MODES.slice(),
    densities: REQUIRED_DENSITIES.slice(),
    a11yMarkers: REQUIRED_A11Y_MARKERS.slice(),
    p0Components: P0_COMPONENTS.slice(),
    p0ComponentReferences: P0_COMPONENT_REFERENCES.map((entry) => ({
      ...entry,
      aliasPrefix: COMPONENT_ALIAS_GROUPS[entry.tag] && COMPONENT_ALIAS_GROUPS[entry.tag].prefix
    })),
    legacyTokenMigrations: LEGACY_ALIASES.map((entry) => ({ ...entry })),
    requiredGates: [
      ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_LOCAL_GATE,
      'node scripts/run_xtend_tests.js xtheme-token-alias-layer --json',
      'node scripts/run_xtend_tests.js enterprise-component-style-audit --json',
      'node scripts/run_xtend_tests.js enterprise-visual-dom-snapshot-matrix --json',
      'node scripts/run_xtend_tests.js component-shell-theme-matrix --json'
    ],
    handoff: ['ECH-WP-12']
  };
}

function validateEnterpriseThirdPartyAuthoringGuide(guide = createEnterpriseThirdPartyAuthoringGuide()) {
  const errors = [];
  if (!guide || guide.schema !== ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SCHEMA) errors.push(`schema must be ${ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SCHEMA}`);
  if (!guide || guide.reportSchema !== ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_REPORT_SCHEMA) errors.push(`reportSchema must be ${ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_REPORT_SCHEMA}`);
  if (!guide || guide.workpackage !== ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_WORKPACKAGE) errors.push(`workpackage must be ${ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_WORKPACKAGE}`);
  if (!guide || guide.docs !== ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC) errors.push(`docs must be ${ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC}`);
  if (!guide || guide.localGate !== ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_LOCAL_GATE) errors.push('invalid local gate');
  REQUIRED_SECTIONS.forEach((section) => {
    if (!guide.requiredSections || !guide.requiredSections.includes(section)) errors.push(`requiredSections missing ${section}`);
  });
  REQUIRED_THEME_MODES.forEach((mode) => {
    if (!guide.themeModes || !guide.themeModes.includes(mode)) errors.push(`themeModes missing ${mode}`);
  });
  REQUIRED_DENSITIES.forEach((density) => {
    if (!guide.densities || !guide.densities.includes(density)) errors.push(`densities missing ${density}`);
  });
  REQUIRED_A11Y_MARKERS.forEach((marker) => {
    if (!guide.a11yMarkers || !guide.a11yMarkers.includes(marker)) errors.push(`a11yMarkers missing ${marker}`);
  });
  P0_COMPONENTS.forEach((tag) => {
    const reference = guide.p0ComponentReferences && guide.p0ComponentReferences.find((entry) => entry.tag === tag);
    if (!reference) errors.push(`p0ComponentReferences missing ${tag}`);
    if (reference && reference.aliasPrefix !== COMPONENT_ALIAS_GROUPS[tag].prefix) errors.push(`${tag} alias prefix mismatch`);
  });
  LEGACY_ALIASES.forEach((entry) => {
    const migration = guide.legacyTokenMigrations && guide.legacyTokenMigrations.find((candidate) => candidate.legacy === entry.legacy);
    if (!migration || migration.normalized !== entry.normalized) errors.push(`legacyTokenMigrations missing ${entry.legacy}`);
  });
  if (!guide.handoff || !guide.handoff.includes('ECH-WP-12')) errors.push('handoff must include ECH-WP-12');
  return {
    schema: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function addFinding(findings, category, message, file, pattern) {
  findings.push({
    schema: `${ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_REPORT_SCHEMA}.finding`,
    category,
    file,
    message,
    pattern,
    blocking: true
  });
}

function createEnterpriseThirdPartyAuthoringGuideReport(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const guide = options.guide || createEnterpriseThirdPartyAuthoringGuide(options);
  const validation = validateEnterpriseThirdPartyAuthoringGuide(guide);
  const findings = [];
  let guideDoc = '';

  try {
    guideDoc = readFile(rootDir, ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC);
  } catch (error) {
    addFinding(findings, 'docs.missing', error.message, ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC, ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC);
  }

  if (guideDoc) {
    [
      ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SCHEMA,
      ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_LOCAL_GATE,
      '@layer xtend-customer',
      "window.XTend.theme.registerTheme('acme-enterprise'",
      'window.XTend.icons.register',
      '::part(',
      'menu-mode="side-panel"',
      'data-theme="forced-colors"'
    ].forEach((marker) => {
      if (!guideDoc.includes(marker)) {
        addFinding(findings, 'docs.marker.missing', `Guide must include ${marker}`, ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC, marker);
      }
    });
    guide.requiredSections.forEach((section) => {
      if (!guideDoc.includes(section)) {
        addFinding(findings, 'docs.section.missing', `Guide must include section ${section}`, ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC, section);
      }
    });
    guide.p0ComponentReferences.forEach((entry) => {
      const docMarker = guideDoc.includes(entry.doc) ? entry.doc : entry.doc.replace('docs/', './');
      [entry.tag, docMarker, entry.aliasPrefix].forEach((marker) => {
        if (!guideDoc.includes(marker)) {
          addFinding(findings, 'docs.p0-reference.missing', `Guide must reference ${entry.tag} marker ${marker}`, ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC, marker);
        }
      });
    });
    guide.legacyTokenMigrations.forEach((entry) => {
      if (!guideDoc.includes(entry.legacy) || !guideDoc.includes(entry.normalized)) {
        addFinding(findings, 'docs.legacy-migration.missing', `Guide must document ${entry.legacy} to ${entry.normalized}`, ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC, entry.legacy);
      }
    });
  }

  return {
    schema: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_REPORT_SCHEMA,
    ok: validation.ok && findings.length === 0,
    errors: validation.errors,
    findings,
    guide,
    workpackage: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_WORKPACKAGE,
    docs: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC,
    p0ComponentCount: guide.p0ComponentReferences.length,
    legacyTokenMigrationCount: guide.legacyTokenMigrations.length,
    requiredSectionCount: guide.requiredSections.length,
    localGate: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_LOCAL_GATE
  };
}

module.exports = {
  ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC,
  ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_LOCAL_GATE,
  ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_MODULE,
  ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_PACKAGE_SCRIPT,
  ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_REPORT_SCHEMA,
  ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SCHEMA,
  ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SUITE,
  ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_WORKPACKAGE,
  P0_COMPONENT_REFERENCES,
  REQUIRED_A11Y_MARKERS,
  REQUIRED_DENSITIES,
  REQUIRED_SECTIONS,
  REQUIRED_THEME_MODES,
  createEnterpriseThirdPartyAuthoringGuide,
  createEnterpriseThirdPartyAuthoringGuideReport,
  validateEnterpriseThirdPartyAuthoringGuide
};
