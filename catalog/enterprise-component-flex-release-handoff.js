const fs = require('fs');
const path = require('path');
const {
  LEGACY_ALIASES,
  P0_COMPONENTS
} = require('../design-tokens/xtheme-token-alias-layer');

const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SCHEMA = 'xtend.enterprise.component-flex-release-handoff.v1';
const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_REPORT_SCHEMA = 'xtend.enterprise.component-flex-release-handoff-report.v1';
const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_WORKPACKAGE = 'ECH-WP-12';
const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_STATUS = 'accepted-enterprise-design-system-ready-handoff';
const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_TARGET = 'enterprise-design-system-ready-release-candidate';
const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_DOC = 'docs/enterprise-component-flex-release-handoff.md';
const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_MODULE = 'catalog/enterprise-component-flex-release-handoff.js';
const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SUITE = 'tests/platform/enterprise_component_flex_release_handoff_suite.js';
const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_LOCAL_GATE = 'node scripts/run_xtend_tests.js enterprise-component-flex-release-handoff --json';
const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_PACKAGE_SCRIPT = 'npm run test:enterprise-component-flex-release-handoff';
const ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_BACKLOG = 'development/XTend-Enterprise-Component-Flexibilitaets-und-Theme-Hardening-Backlog.md';
const CURRENT_VERSION = '0.0.0-enterprise-readiness';
const PROPOSED_VERSION = '0.1.0-enterprise-design-system-rc.1';
const PUBLISH_BOUNDARY = 'private-until-release-owner-acceptance';

const REQUIRED_WORKPACKAGES = Object.freeze([
  'ECH-WP-00',
  'ECH-WP-01',
  'ECH-WP-02',
  'ECH-WP-03',
  'ECH-WP-04',
  'ECH-WP-05',
  'ECH-WP-06',
  'ECH-WP-07',
  'ECH-WP-08',
  'ECH-WP-09',
  'ECH-WP-10',
  'ECH-WP-11',
  'ECH-WP-12'
]);

const SOURCE_GATES = Object.freeze([
  'node scripts/run_xtend_tests.js signature-ui-visual-quality --json',
  'node scripts/run_xtend_tests.js enterprise-component-flex-hardening-contract --json',
  'node scripts/run_xtend_tests.js enterprise-component-style-audit --json',
  'node scripts/run_xtend_tests.js xtheme-token-alias-layer --json',
  'node scripts/run_xtend_tests.js enterprise-icon-control-audit --json',
  'node scripts/run_xtend_tests.js xheader-menu-modes --json',
  'node scripts/run_xtend_tests.js enterprise-overlay-mode-token-parity --json',
  'node scripts/run_xtend_tests.js enterprise-layout-display-media-tokenization --json',
  'node scripts/run_xtend_tests.js enterprise-form-control-theme-a11y --json',
  'node scripts/run_xtend_tests.js enterprise-navigation-routing-state-hardening --json',
  'node scripts/run_xtend_tests.js enterprise-visual-dom-snapshot-matrix --json',
  'node scripts/run_xtend_tests.js enterprise-third-party-authoring-guide --json'
]);

const RELEASE_GATES = Object.freeze([
  ...SOURCE_GATES,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_LOCAL_GATE,
  'node scripts/run_xtend_tests.js component-shell-theme-matrix --json',
  'node scripts/run_xtend_tests.js references --json',
  'node scripts/run_xtend_tests.js design-tokens --json'
]);

const SEMVER_IMPACTS = Object.freeze([
  {
    id: 'x-header-menu-presentation-modes',
    classification: 'minor-additive-public-api',
    defaultCompatible: true,
    migrationRequired: false,
    note: 'menu-mode, placement, modal and sizing APIs are additive; default remains drawer.'
  },
  {
    id: 'xtheme-token-alias-layer',
    classification: 'minor-additive-token-api',
    defaultCompatible: true,
    migrationRequired: false,
    note: 'normalized --xtend-* aliases are additive while legacy names remain bridged.'
  },
  {
    id: 'icon-control-hardening',
    classification: 'patch-compatible-a11y-hardening',
    defaultCompatible: true,
    migrationRequired: false,
    note: 'visible text glyph controls were replaced by icon controls without changing host command intent.'
  },
  {
    id: 'overlay-layout-form-navigation-parts',
    classification: 'minor-additive-css-parts-and-tokens',
    defaultCompatible: true,
    migrationRequired: false,
    note: 'new parts and component tokens expand skinning surfaces without removing existing documented defaults.'
  },
  {
    id: 'visual-dom-snapshot-matrix',
    classification: 'test-artifact-only',
    defaultCompatible: true,
    migrationRequired: false,
    note: 'DOM baselines and visual quality reports are local gates, not runtime breaking changes.'
  },
  {
    id: 'third-party-authoring-guide',
    classification: 'docs-only-adoption-handoff',
    defaultCompatible: true,
    migrationRequired: false,
    note: 'Corporate design guide documents the supported override path.'
  }
]);

const COMPATIBILITY_ALIASES = Object.freeze([
  ...LEGACY_ALIASES.map((entry) => ({
    kind: 'css-token',
    deprecated: entry.legacy,
    replacement: entry.normalized,
    removal: 'not-before-next-major-or-explicit-migration-window'
  })),
  {
    kind: 'css-part',
    deprecated: 'drawer',
    replacement: 'menu',
    removal: 'not-before-next-major-or-explicit-migration-window'
  },
  {
    kind: 'css-part',
    deprecated: 'drawer-surface',
    replacement: 'menu-surface',
    removal: 'not-before-next-major-or-explicit-migration-window'
  },
  {
    kind: 'slot',
    deprecated: 'utility',
    replacement: 'actions',
    removal: 'not-before-next-major-or-explicit-migration-window'
  },
  {
    kind: 'density',
    deprecated: 'spacious',
    replacement: 'comfortable',
    removal: 'normalized-at-runtime'
  }
]);

const MIGRATION_SECTIONS = Object.freeze([
  {
    id: 'adopt-token-alias-layer',
    owner: 'design-system',
    action: 'Map Corporate tokens to --xtend-* aliases before overriding component internals.',
    risk: 'Legacy token overrides can drift from XTheme and forced-colors behavior.'
  },
  {
    id: 'replace-glyph-controls-with-icons',
    owner: 'component-authors',
    action: 'Use x-icon, inline SVG or registered icon packs for close, menu, disclosure and status controls.',
    risk: 'Text glyph controls are no longer accepted in enterprise-ready components.'
  },
  {
    id: 'choose-xheader-menu-mode',
    owner: 'app-shell',
    action: 'Keep default drawer or opt into side-panel, popover, fullscreen or inline-main explicitly.',
    risk: 'Custom CSS assuming one fixed full-width drawer must move to tokens and parts.'
  },
  {
    id: 'map-overlay-form-nav-parts',
    owner: 'component-authors',
    action: 'Use surface, backdrop, close, content, control, label, icon and nav parts for skinning.',
    risk: 'Shadow-DOM deep selectors remain unsupported and can break on component updates.'
  },
  {
    id: 'run-visual-dom-matrix',
    owner: 'quality',
    action: 'Run the WP-10 DOM snapshot matrix for header modes, themes, densities, motion and typography states.',
    risk: 'A corporate theme can pass static token checks while still failing contrast, focus or layout readability.'
  },
  {
    id: 'publish-third-party-guide',
    owner: 'docs',
    action: 'Use the WP-11 authoring guide as the default onboarding path for external design systems.',
    risk: 'Teams may fork components instead of using XTheme, XTend.css, parts, slots and icon packs.'
  },
  {
    id: 'keep-release-owner-boundary',
    owner: 'release-owner',
    action: 'Keep package publishing blocked until owner review accepts gates, migration notes and optional artifacts.',
    risk: 'This handoff makes the wave release-ready, not automatically published.'
  }
]);

const RELEASE_CHECKLIST = Object.freeze([
  'package-private',
  'all-ech-gates-green',
  'semver-classification-recorded',
  'deprecated-aliases-documented',
  'migration-notes-complete',
  'third-party-authoring-guide-linked',
  'visual-dom-matrix-clean',
  'references-clean',
  'release-owner-review-required',
  'conditional-network-evidence-if-publish'
]);

const ADOPTION_RISKS = Object.freeze([
  {
    id: 'shadow-dom-deep-selector-risk',
    severity: 'medium',
    mitigation: 'Use CSS Parts and Custom Properties instead of private Shadow DOM selectors.'
  },
  {
    id: 'legacy-token-drift-risk',
    severity: 'medium',
    mitigation: 'Map legacy tokens to normalized aliases and keep XTheme and XTend.css synchronized.'
  },
  {
    id: 'forced-colors-brand-risk',
    severity: 'high',
    mitigation: 'Use Canvas, CanvasText, Highlight and HighlightText in forced-colors paths.'
  },
  {
    id: 'visual-signature-generic-risk',
    severity: 'medium',
    mitigation: 'Run the Signature UI and Visual DOM matrix gates when applying Corporate palettes.'
  },
  {
    id: 'publish-boundary-risk',
    severity: 'high',
    mitigation: 'Keep private package boundary until release-owner acceptance.'
  }
]);

function resolveRootDir(rootDir) {
  return rootDir || path.resolve(__dirname, '..');
}

function readFile(rootDir, relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function createEnterpriseComponentFlexReleaseHandoff(options = {}) {
  return {
    schema: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SCHEMA,
    reportSchema: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_REPORT_SCHEMA,
    workpackage: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_WORKPACKAGE,
    status: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_STATUS,
    targetReadiness: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_TARGET,
    generatedAt: options.generatedAt || 'static-local',
    module: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_MODULE,
    docs: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_DOC,
    suite: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SUITE,
    backlog: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_BACKLOG,
    localGate: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_LOCAL_GATE,
    packageScript: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_PACKAGE_SCRIPT,
    currentVersion: CURRENT_VERSION,
    proposedVersion: PROPOSED_VERSION,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    packagePrivateRequired: true,
    semverDecision: {
      classification: 'minor-pre-1.0-additive-public-api-hardening',
      defaultCompatibility: 'preserved',
      publicSurfaceChanged: true,
      breakingChanges: [],
      migrationNotesRequired: true,
      releaseOwnerAcceptanceRequired: true,
      proposedVersion: PROPOSED_VERSION
    },
    compatibility: {
      existingDefaultsRemainCompatible: true,
      newModesAreAdditive: true,
      breakingChangesAvoided: true,
      deprecatedAliasesRemainBridged: true,
      legacyDrawerDefaultPreserved: true,
      p0Components: P0_COMPONENTS.slice()
    },
    requiredWorkpackages: REQUIRED_WORKPACKAGES.slice(),
    sourceGates: SOURCE_GATES.slice(),
    releaseGates: RELEASE_GATES.slice(),
    semverImpacts: SEMVER_IMPACTS.map((entry) => ({ ...entry })),
    deprecatedAliases: COMPATIBILITY_ALIASES.map((entry) => ({ ...entry })),
    migrationSections: MIGRATION_SECTIONS.map((entry) => ({ ...entry })),
    releaseChecklist: RELEASE_CHECKLIST.slice(),
    adoptionRisks: ADOPTION_RISKS.map((entry) => ({ ...entry })),
    handoff: {
      decision: 'enterprise-design-system-ready-release-owner-review',
      nextWorkpackage: null,
      publishBoundary: PUBLISH_BOUNDARY
    }
  };
}

function validateEnterpriseComponentFlexReleaseHandoff(handoff = createEnterpriseComponentFlexReleaseHandoff()) {
  const errors = [];
  if (!handoff || handoff.schema !== ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SCHEMA) errors.push(`schema must be ${ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SCHEMA}`);
  if (!handoff || handoff.reportSchema !== ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_REPORT_SCHEMA) errors.push(`reportSchema must be ${ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_REPORT_SCHEMA}`);
  if (!handoff || handoff.workpackage !== ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_WORKPACKAGE) errors.push(`workpackage must be ${ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_WORKPACKAGE}`);
  if (!handoff || handoff.status !== ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_STATUS) errors.push(`status must be ${ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_STATUS}`);
  if (!handoff || handoff.targetReadiness !== ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_TARGET) errors.push(`targetReadiness must be ${ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_TARGET}`);
  if (!handoff || handoff.currentVersion !== CURRENT_VERSION) errors.push(`currentVersion must be ${CURRENT_VERSION}`);
  if (!handoff || handoff.proposedVersion !== PROPOSED_VERSION) errors.push(`proposedVersion must be ${PROPOSED_VERSION}`);
  if (!handoff || handoff.publishAllowed !== false || handoff.packagePrivateRequired !== true) errors.push('publish must stay blocked and package private');
  if (!handoff || handoff.publishBoundary !== PUBLISH_BOUNDARY) errors.push(`publishBoundary must be ${PUBLISH_BOUNDARY}`);

  REQUIRED_WORKPACKAGES.forEach((id) => {
    if (!handoff.requiredWorkpackages || !handoff.requiredWorkpackages.includes(id)) errors.push(`requiredWorkpackages missing ${id}`);
  });
  SOURCE_GATES.forEach((gate) => {
    if (!handoff.sourceGates || !handoff.sourceGates.includes(gate)) errors.push(`sourceGates missing ${gate}`);
  });
  RELEASE_GATES.forEach((gate) => {
    if (!handoff.releaseGates || !handoff.releaseGates.includes(gate)) errors.push(`releaseGates missing ${gate}`);
  });
  RELEASE_CHECKLIST.forEach((item) => {
    if (!handoff.releaseChecklist || !handoff.releaseChecklist.includes(item)) errors.push(`releaseChecklist missing ${item}`);
  });
  MIGRATION_SECTIONS.forEach((entry) => {
    if (!handoff.migrationSections || !handoff.migrationSections.some((candidate) => candidate.id === entry.id)) errors.push(`migrationSections missing ${entry.id}`);
  });
  COMPATIBILITY_ALIASES.forEach((entry) => {
    if (!handoff.deprecatedAliases || !handoff.deprecatedAliases.some((candidate) => candidate.deprecated === entry.deprecated && candidate.replacement === entry.replacement)) {
      errors.push(`deprecatedAliases missing ${entry.deprecated}`);
    }
  });
  if (!handoff.semverDecision || handoff.semverDecision.classification !== 'minor-pre-1.0-additive-public-api-hardening') errors.push('invalid SemVer classification');
  if (!handoff.semverDecision || !Array.isArray(handoff.semverDecision.breakingChanges) || handoff.semverDecision.breakingChanges.length !== 0) errors.push('breakingChanges must be an empty array');
  if (!handoff.compatibility || handoff.compatibility.existingDefaultsRemainCompatible !== true) errors.push('existing defaults must remain compatible');
  if (!handoff.compatibility || handoff.compatibility.newModesAreAdditive !== true) errors.push('new modes must be additive');
  if (!handoff.compatibility || handoff.compatibility.breakingChangesAvoided !== true) errors.push('breaking changes must be avoided');
  if (!handoff.compatibility || handoff.compatibility.deprecatedAliasesRemainBridged !== true) errors.push('deprecated aliases must remain bridged');
  if (!handoff.handoff || handoff.handoff.decision !== 'enterprise-design-system-ready-release-owner-review') errors.push('invalid handoff decision');
  return {
    schema: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function addFinding(findings, category, message, file, pattern) {
  findings.push({
    schema: `${ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_REPORT_SCHEMA}.finding`,
    category,
    file,
    message,
    pattern,
    blocking: true
  });
}

function createEnterpriseComponentFlexReleaseHandoffReport(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const handoff = options.handoff || createEnterpriseComponentFlexReleaseHandoff(options);
  const validation = validateEnterpriseComponentFlexReleaseHandoff(handoff);
  const findings = [];
  let docs = '';
  let backlog = '';

  try {
    docs = readFile(rootDir, ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_DOC);
  } catch (error) {
    addFinding(findings, 'docs.missing', error.message, ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_DOC, ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_DOC);
  }
  try {
    backlog = readFile(rootDir, ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_BACKLOG);
  } catch (error) {
    addFinding(findings, 'backlog.missing', error.message, ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_BACKLOG, ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_BACKLOG);
  }

  if (docs) {
    [
      ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SCHEMA,
      ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_LOCAL_GATE,
      PROPOSED_VERSION,
      'SemVer-Bewertung',
      'Deprecated Aliases',
      'Migration Notes',
      'Release Checklist',
      'Adoption Risiken',
      PUBLISH_BOUNDARY
    ].forEach((marker) => {
      if (!docs.includes(marker)) {
        addFinding(findings, 'docs.marker.missing', `Handoff docs must include ${marker}`, ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_DOC, marker);
      }
    });
    handoff.sourceGates.forEach((gate) => {
      if (!docs.includes(gate)) {
        addFinding(findings, 'docs.gate.missing', `Handoff docs must include ${gate}`, ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_DOC, gate);
      }
    });
  }

  if (backlog) {
    if (!backlog.includes('| `ECH-WP-12` | P2 | completed |')) {
      addFinding(findings, 'backlog.status.missing', 'Backlog must mark ECH-WP-12 completed', ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_BACKLOG, 'ECH-WP-12 completed');
    }
    if (!backlog.includes(ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_LOCAL_GATE)) {
      addFinding(findings, 'backlog.gate.missing', 'Backlog must expose local gate', ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_BACKLOG, ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_LOCAL_GATE);
    }
  }

  return {
    schema: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_REPORT_SCHEMA,
    ok: validation.ok && findings.length === 0,
    errors: validation.errors,
    findings,
    handoff,
    workpackage: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_WORKPACKAGE,
    sourceGateCount: handoff.sourceGates.length,
    releaseGateCount: handoff.releaseGates.length,
    deprecatedAliasCount: handoff.deprecatedAliases.length,
    migrationSectionCount: handoff.migrationSections.length,
    adoptionRiskCount: handoff.adoptionRisks.length,
    publishAllowed: handoff.publishAllowed,
    localGate: ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_LOCAL_GATE
  };
}

module.exports = {
  ADOPTION_RISKS,
  COMPATIBILITY_ALIASES,
  CURRENT_VERSION,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_BACKLOG,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_DOC,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_LOCAL_GATE,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_MODULE,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_PACKAGE_SCRIPT,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_REPORT_SCHEMA,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SCHEMA,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_STATUS,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_SUITE,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_TARGET,
  ENTERPRISE_COMPONENT_FLEX_RELEASE_HANDOFF_WORKPACKAGE,
  MIGRATION_SECTIONS,
  PROPOSED_VERSION,
  PUBLISH_BOUNDARY,
  RELEASE_CHECKLIST,
  RELEASE_GATES,
  REQUIRED_WORKPACKAGES,
  SEMVER_IMPACTS,
  SOURCE_GATES,
  createEnterpriseComponentFlexReleaseHandoff,
  createEnterpriseComponentFlexReleaseHandoffReport,
  validateEnterpriseComponentFlexReleaseHandoff
};
