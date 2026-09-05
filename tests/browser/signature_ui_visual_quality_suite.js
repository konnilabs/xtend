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

const SIGNATURE_UI_SCHEMA = 'xtend.signature-ui.direction.v1';
const SIGNATURE_VISUAL_QUALITY_SCHEMA = 'xtend.signature-ui.visual-quality.v1';
const SIGNATURE_VISUAL_QUALITY_REPORT_SCHEMA = 'xtend.signature-ui.visual-quality-report.v1';
const SIGNATURE_WORKPACKAGE = 'ECH-WP-00';
const SIGNATURE_DIRECTION_PATH = 'development/XTend-Signature-UI-und-Typografie-Designrichtung.md';
const SIGNATURE_BACKLOG_PATH = 'development/XTend-Enterprise-Component-Flexibilitaets-und-Theme-Hardening-Backlog.md';
const SIGNATURE_THEME_PATH = 'design-tokens/themes/xtend-signature.json';
const SIGNATURE_FIXTURE_PATH = 'tests/browser/fixtures/xtend-signature-ui-smoke.html';
const SIGNATURE_SUITE_PATH = 'tests/browser/signature_ui_visual_quality_suite.js';
const SIGNATURE_LOCAL_GATE = 'node scripts/run_xtend_tests.js signature-ui-visual-quality --json';
const SIGNATURE_RESULT_KEY = '__xtendSignatureUiVisualQualityResult';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const REQUIRED_SIGNATURE_TOKENS = Object.freeze([
  '--xtend-signature-surface-page',
  '--xtend-signature-surface-raised',
  '--xtend-signature-surface-panel',
  '--xtend-signature-surface-inset',
  '--xtend-signature-edge-subtle',
  '--xtend-signature-edge-strong',
  '--xtend-signature-ink',
  '--xtend-signature-ink-muted',
  '--xtend-signature-accent',
  '--xtend-signature-accent-soft',
  '--xtend-signature-shadow-control',
  '--xtend-signature-shadow-panel',
  '--xtend-signature-shadow-overlay'
]);

const REQUIRED_TYPOGRAPHY_TOKENS = Object.freeze([
  '--xtend-font-family-body',
  '--xtend-font-family-heading',
  '--xtend-font-family-control',
  '--xtend-font-family-code',
  '--xtend-font-size-display',
  '--xtend-font-size-heading-md',
  '--xtend-font-size-body',
  '--xtend-font-size-label',
  '--xtend-font-size-control',
  '--xtend-font-size-caption',
  '--xtend-line-height-heading',
  '--xtend-line-height-body',
  '--xtend-line-height-control',
  '--xtend-font-weight-heading',
  '--xtend-font-weight-label',
  '--xtend-font-weight-control',
  '--xtend-font-feature-numeric'
]);

const REQUIRED_P0_COMPONENTS = Object.freeze([
  'x-header',
  'x-button',
  'x-menu',
  'x-drawer',
  'x-side-panel',
  'x-modal',
  'x-popover',
  'x-toast',
  'x-input'
]);

const REQUIRED_FIXTURE_CHECKS = Object.freeze([
  'signature fixture loaded local components',
  'signature typography roles visible',
  'signature surface tokens visible',
  'signature interaction tokens visible',
  'signature p0 components rendered',
  'corporate override keeps xtend bridge',
  'signature visual states annotated',
  'signature avoids import maps and cdn'
]);

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assert(source.includes(entry), `${label} includes ${entry}`);
  });
}

function runSignatureUiVisualQualitySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'signature-ui-visual-quality',
    label: 'ECH-WP-00 XTend Signature UI Visual Quality'
  });
  const direction = readText(SIGNATURE_DIRECTION_PATH, rootDir);
  const backlog = readText(SIGNATURE_BACKLOG_PATH, rootDir);
  const theme = readJson(SIGNATURE_THEME_PATH, rootDir);
  const fixture = readText(SIGNATURE_FIXTURE_PATH, rootDir);
  const suiteSource = readText(SIGNATURE_SUITE_PATH, rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const xHeaderSource = readText('components/xheader.js', rootDir);
  const themeSyntax = (() => {
    try {
      JSON.stringify(theme);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  })();
  const suiteSyntax = syntaxCheckFile(SIGNATURE_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, SIGNATURE_DIRECTION_PATH, rootDir, 'Signature UI direction document exists');
  assertFileExists(context, SIGNATURE_THEME_PATH, rootDir, 'Signature theme reference pack exists');
  assertFileExists(context, SIGNATURE_FIXTURE_PATH, rootDir, 'Signature UI browser fixture exists');
  assertFileExists(context, SIGNATURE_SUITE_PATH, rootDir, 'Signature UI visual quality suite exists');
  context.assert(themeSyntax.ok, `Signature theme JSON parses${themeSyntax.ok ? '' : ` (${themeSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Signature UI suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(theme.schema === 'xtend.design-tokens.pack.v1', 'Signature theme uses design token pack schema');
  context.assert(theme.name === 'xtend-signature', 'Signature theme declares xtend-signature name');
  context.assert(theme.workpackage === SIGNATURE_WORKPACKAGE, 'Signature theme belongs to ECH-WP-00');
  context.assert(theme.status === 'reference-draft', 'Signature theme is marked as reference draft');
  context.assert(theme.kernelBoundary === KERNEL_BOUNDARY, 'Signature theme keeps kernel boundary visible');
  context.assert(theme.localOnly === true, 'Signature theme is local-only');
  context.assert(theme.exportPolicy === 'reference-only-until-ECH-WP-03', 'Signature theme stays reference-only before ECH-WP-03');
  assertIncludesAll(context, Object.keys(theme.tokens || {}), REQUIRED_SIGNATURE_TOKENS, 'Signature theme tokens');
  assertIncludesAll(context, Object.keys(theme.tokens || {}), REQUIRED_TYPOGRAPHY_TOKENS, 'Signature typography tokens');
  assertIncludesAll(context, theme.signaturePrinciples || [], [
    'quiet-precision',
    'material-ohne-dekor',
    'productive-density',
    'strong-defaults-strong-overrides',
    'distinct-enterprise-voice'
  ], 'Signature principle metadata');
  assertIncludesAll(context, theme.typographyRoles || [], [
    'display',
    'heading',
    'body',
    'label',
    'control',
    'caption',
    'numeric',
    'code'
  ], 'Signature typography roles');

  context.assertIncludes(direction, SIGNATURE_UI_SCHEMA, 'Signature direction declares schema');
  context.assertIncludes(direction, SIGNATURE_WORKPACKAGE, 'Signature direction links ECH-WP-00');
  assertIncludesAll(context, direction, [
    'Quiet Precision',
    'Material ohne Dekor',
    'Productive Density',
    'Strong Defaults, Strong Overrides',
    'Distinct Enterprise Voice',
    'Typography System',
    'Corporate Theme Bridge',
    'Anti-Pattern Gates',
    'Signature Fixture Matrix'
  ], 'Signature direction document');
  assertIncludesAll(context, direction, REQUIRED_SIGNATURE_TOKENS.slice(0, 6), 'Signature direction token examples');
  assertIncludesAll(context, direction, REQUIRED_TYPOGRAPHY_TOKENS.slice(0, 8), 'Signature direction typography examples');
  REQUIRED_P0_COMPONENTS.slice(0, 8).forEach((tag) => {
    context.assertIncludes(direction, `\`${tag}\``, `Signature direction includes ${tag}`);
  });

  context.assertIncludes(backlog, '| `ECH-WP-00` | P0 | completed |', 'Backlog marks ECH-WP-00 completed');
  context.assertIncludes(backlog, SIGNATURE_DIRECTION_PATH, 'Backlog links Signature direction document');
  context.assertIncludes(backlog, SIGNATURE_THEME_PATH, 'Backlog links Signature theme pack');
  context.assertIncludes(backlog, SIGNATURE_FIXTURE_PATH, 'Backlog links Signature browser fixture');
  context.assertIncludes(backlog, SIGNATURE_LOCAL_GATE, 'Backlog exposes Signature local gate');

  context.assertIncludes(fixture, SIGNATURE_VISUAL_QUALITY_SCHEMA, 'Signature fixture declares visual quality schema');
  context.assertIncludes(fixture, SIGNATURE_RESULT_KEY, 'Signature fixture exposes stable result key');
  context.assert(!fixture.includes('type="importmap"'), 'Signature fixture avoids import maps');
  context.assert(!fixture.includes('https://cdn'), 'Signature fixture has no CDN dependency');
  assertIncludesAll(context, fixture, REQUIRED_SIGNATURE_TOKENS, 'Signature fixture tokens');
  assertIncludesAll(context, fixture, REQUIRED_TYPOGRAPHY_TOKENS, 'Signature fixture typography tokens');
  REQUIRED_P0_COMPONENTS.forEach((tag) => {
    context.assertIncludes(fixture, `<${tag}`, `Signature fixture renders ${tag}`);
  });
  REQUIRED_FIXTURE_CHECKS.forEach((check) => {
    context.assertIncludes(fixture, `recordCheck('${check}'`, `Signature fixture records ${check}`);
  });
  context.assertIncludes(fixture, 'data-theme="corporate-override"', 'Signature fixture includes corporate override surface');
  context.assertIncludes(fixture, 'data-signature-state="default focus active"', 'Signature fixture includes default/focus/active state coverage');
  context.assertIncludes(fixture, 'data-signature-state="empty loading error disabled"', 'Signature fixture includes empty/loading/error/disabled state coverage');

  assertIncludesAll(context, xHeaderSource, [
    '--xtend-header-surface',
    '--xtend-signature-surface-panel',
    '--xtend-signature-edge-subtle',
    '--xtend-signature-shadow-panel',
    '--xtend-font-family-body',
    '--xtend-font-weight-heading'
  ], 'x-header source consumes Signature tokens');

  context.assertIncludes(suiteSource, SIGNATURE_VISUAL_QUALITY_REPORT_SCHEMA, 'Signature suite declares report schema');
  context.assert(runner.hasSuite("signature-ui-visual-quality"), 'XTend runner registers Signature visual quality suite');
  context.assert(runner.hasImplementation({ function: "runSignatureUiVisualQualitySuite" }), 'XTend runner imports Signature visual quality suite');

  return context.result({
    report: {
      schema: SIGNATURE_VISUAL_QUALITY_REPORT_SCHEMA,
      workpackage: SIGNATURE_WORKPACKAGE,
      fixture: SIGNATURE_FIXTURE_PATH,
      theme: SIGNATURE_THEME_PATH,
      p0ComponentCount: REQUIRED_P0_COMPONENTS.length,
      signatureTokenCount: REQUIRED_SIGNATURE_TOKENS.length,
      typographyTokenCount: REQUIRED_TYPOGRAPHY_TOKENS.length,
      localGate: SIGNATURE_LOCAL_GATE
    }
  });
}

function printSignatureUiVisualQualityReport(result) {
  printSuiteReport(result, {
    successTitle: 'ECH-WP-00 XTend Signature UI Visual Quality erfolgreich.',
    failureTitle: 'ECH-WP-00 XTend Signature UI Visual Quality fehlgeschlagen:'
  });
}

module.exports = {
  KERNEL_BOUNDARY,
  REQUIRED_FIXTURE_CHECKS,
  REQUIRED_P0_COMPONENTS,
  REQUIRED_SIGNATURE_TOKENS,
  REQUIRED_TYPOGRAPHY_TOKENS,
  SIGNATURE_BACKLOG_PATH,
  SIGNATURE_DIRECTION_PATH,
  SIGNATURE_FIXTURE_PATH,
  SIGNATURE_LOCAL_GATE,
  SIGNATURE_RESULT_KEY,
  SIGNATURE_SUITE_PATH,
  SIGNATURE_THEME_PATH,
  SIGNATURE_UI_SCHEMA,
  SIGNATURE_VISUAL_QUALITY_REPORT_SCHEMA,
  SIGNATURE_VISUAL_QUALITY_SCHEMA,
  SIGNATURE_WORKPACKAGE,
  printSignatureUiVisualQualityReport,
  runSignatureUiVisualQualitySuite
};
