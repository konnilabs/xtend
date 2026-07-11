const fs = require('fs');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  LEGACY_ALIASES,
  P0_COMPONENTS
} = require('../../design-tokens/xtheme-token-alias-layer');
const {
  ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC,
  ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_LOCAL_GATE,
  ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_MODULE,
  ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_PACKAGE_SCRIPT,
  ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_REPORT_SCHEMA,
  ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SCHEMA,
  ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SUITE,
  ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_WORKPACKAGE,
  REQUIRED_A11Y_MARKERS,
  REQUIRED_DENSITIES,
  REQUIRED_SECTIONS,
  REQUIRED_THEME_MODES,
  createEnterpriseThirdPartyAuthoringGuide,
  createEnterpriseThirdPartyAuthoringGuideReport,
  validateEnterpriseThirdPartyAuthoringGuide
} = require('../../catalog/enterprise-third-party-authoring-guide');

const BACKLOG_PATH = 'development/XTend-Enterprise-Component-Flexibilitaets-und-Theme-Hardening-Backlog.md';
const DOCS_README = 'docs/en/README.md';
const DOCS_MENU = 'docs/menu.json';
const ENTERPRISE_ADOPTION_DOC = 'docs/enterprise-adoption.md';
const DESIGN_TOKENS_DOC = 'docs/design-tokens.md';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertTextIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(source, entry, `${label} includes ${entry}`);
  });
}

function runEnterpriseThirdPartyAuthoringGuideSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'enterprise-third-party-authoring-guide',
    label: 'ECH-WP-11 Enterprise Third-Party Authoring Guide'
  });
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const docsReadme = readText(DOCS_README, rootDir);
  const docsMenu = readJson(DOCS_MENU, rootDir);
  const enterpriseAdoption = readText(ENTERPRISE_ADOPTION_DOC, rootDir);
  const designTokens = readText(DESIGN_TOKENS_DOC, rootDir);
  const guideDoc = readText(ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC, rootDir);
  const moduleSource = readText(ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_MODULE, rootDir);
  const suiteSource = readText(ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SUITE, rootDir);
  const guide = createEnterpriseThirdPartyAuthoringGuide();
  const validation = validateEnterpriseThirdPartyAuthoringGuide(guide);
  const invalidValidation = validateEnterpriseThirdPartyAuthoringGuide({
    schema: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SCHEMA,
    reportSchema: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_REPORT_SCHEMA,
    workpackage: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_WORKPACKAGE,
    docs: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC,
    localGate: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_LOCAL_GATE,
    requiredSections: [],
    themeModes: ['light'],
    densities: ['comfortable'],
    a11yMarkers: [],
    p0ComponentReferences: [],
    legacyTokenMigrations: [],
    handoff: []
  });
  const report = createEnterpriseThirdPartyAuthoringGuideReport({ rootDir, guide });
  const moduleSyntax = syntaxCheckFile(ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SUITE, { rootDir, extension: '.js' });

  [
    ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_MODULE,
    ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC,
    ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SUITE,
    DOCS_README,
    DOCS_MENU,
    ENTERPRISE_ADOPTION_DOC,
    DESIGN_TOKENS_DOC
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `Enterprise third-party authoring module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Enterprise third-party authoring suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(guide.schema === ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SCHEMA, 'Authoring guide factory emits schema');
  context.assert(guide.reportSchema === ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_REPORT_SCHEMA, 'Authoring guide factory emits report schema');
  context.assert(guide.workpackage === ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_WORKPACKAGE, 'Authoring guide binds ECH-WP-11');
  context.assert(validation.ok === true, 'Authoring guide validator accepts generated guide');
  context.assert(invalidValidation.ok === false, 'Authoring guide validator rejects incomplete guide');
  context.assert(report.ok === true, 'Authoring guide report has no blocking findings');
  context.assert(report.p0ComponentCount === P0_COMPONENTS.length, 'Authoring guide report covers all P0 components');
  context.assert(report.legacyTokenMigrationCount === LEGACY_ALIASES.length, 'Authoring guide report covers all legacy token migrations');

  assertTextIncludesAll(context, guideDoc, [
    ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SCHEMA,
    ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_LOCAL_GATE,
    '@layer xtend-customer',
    "window.XTend.theme.registerTheme('acme-enterprise'",
    'window.XTend.icons.register',
    '::part(',
    'menu-mode="side-panel"',
    'data-theme="forced-colors"',
    'Vollstaendiges Fremdtheme-Beispiel',
    'Migration von Legacy Token-Namen'
  ], 'Third-party authoring guide');
  REQUIRED_SECTIONS.forEach((section) => {
    context.assertIncludes(guideDoc, section, `Guide includes ${section}`);
  });
  REQUIRED_THEME_MODES.forEach((mode) => {
    context.assertIncludes(guideDoc, mode, `Guide documents ${mode}`);
  });
  REQUIRED_DENSITIES.forEach((density) => {
    context.assertIncludes(guideDoc, density, `Guide documents ${density}`);
  });
  REQUIRED_A11Y_MARKERS.forEach((marker) => {
    context.assertIncludes(guideDoc, marker, `Guide documents A11y marker ${marker}`);
  });
  guide.p0ComponentReferences.forEach((entry) => {
    context.assertIncludes(guideDoc, `\`${entry.tag}\``, `Guide references ${entry.tag}`);
    context.assertIncludes(guideDoc, entry.aliasPrefix, `Guide references ${entry.tag} alias prefix`);
    context.assertIncludes(guideDoc, entry.tokenSection, `Guide references ${entry.tag} token section`);
    assertFileExists(context, entry.doc, rootDir, `${entry.doc} exists`);
  });
  LEGACY_ALIASES.forEach((entry) => {
    context.assertIncludes(guideDoc, entry.legacy, `Guide documents legacy token ${entry.legacy}`);
    context.assertIncludes(guideDoc, entry.normalized, `Guide documents normalized token ${entry.normalized}`);
  });

  assertTextIncludesAll(context, moduleSource, [
    ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SCHEMA,
    'createEnterpriseThirdPartyAuthoringGuide',
    'validateEnterpriseThirdPartyAuthoringGuide',
    'createEnterpriseThirdPartyAuthoringGuideReport',
    'P0_COMPONENT_REFERENCES',
    'REQUIRED_SECTIONS'
  ], 'Third-party authoring module');
  context.assertIncludes(suiteSource, 'ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_REPORT_SCHEMA', 'Suite source declares report schema');

  const menuSlugs = docsMenu.map((entry) => entry.slug);
  context.assert(menuSlugs.includes('third-party-design-authoring'), 'Docs menu exposes third-party-design-authoring');
  context.assertIncludes(docsReadme, 'third-party-design-authoring.md', 'Docs README links third-party authoring guide');
  context.assertIncludes(enterpriseAdoption, ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_SCHEMA, 'Enterprise Adoption links third-party authoring guide schema');
  context.assertIncludes(enterpriseAdoption, ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_LOCAL_GATE, 'Enterprise Adoption documents third-party authoring local gate');
  context.assertIncludes(designTokens, 'Drittanbieter Design Authoring', 'Design Tokens links third-party authoring guide');
  context.assertIncludes(designTokens, ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_LOCAL_GATE, 'Design Tokens documents third-party authoring gate');

  context.assertIncludes(backlog, '| `ECH-WP-11` | P2 | completed |', 'Backlog marks ECH-WP-11 completed');
  context.assertIncludes(backlog, ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC, 'Backlog links third-party guide doc');
  context.assertIncludes(backlog, ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_LOCAL_GATE, 'Backlog exposes third-party authoring local gate');
  context.assertIncludes(runner, "id: 'enterprise-third-party-authoring-guide'", 'Runner exposes third-party authoring guide suite');
  context.assertIncludes(runner, 'runEnterpriseThirdPartyAuthoringGuideSuite', 'Runner imports third-party authoring guide suite');
  context.assert(packageManifest.scripts['test:enterprise-third-party-authoring-guide'] === 'node scripts/run_xtend_tests.js enterprise-third-party-authoring-guide', 'Package exposes third-party authoring guide script');

  return context.result({
    report: {
      schema: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_REPORT_SCHEMA,
      workpackage: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_WORKPACKAGE,
      docs: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_DOC,
      p0ComponentCount: report.p0ComponentCount,
      legacyTokenMigrationCount: report.legacyTokenMigrationCount,
      localGate: ENTERPRISE_THIRD_PARTY_AUTHORING_GUIDE_LOCAL_GATE
    }
  });
}

function printEnterpriseThirdPartyAuthoringGuideReport(result) {
  printSuiteReport(result, {
    successTitle: 'ECH-WP-11 Enterprise Third-Party Authoring Guide erfolgreich.',
    failureTitle: 'ECH-WP-11 Enterprise Third-Party Authoring Guide fehlgeschlagen:'
  });
}

module.exports = {
  printEnterpriseThirdPartyAuthoringGuideReport,
  runEnterpriseThirdPartyAuthoringGuideSuite
};
