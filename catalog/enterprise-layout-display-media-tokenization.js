const fs = require('fs');
const path = require('path');

const ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_SCHEMA = 'xtend.enterprise.layout-display-media-tokenization.v1';
const ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_FINDING_SCHEMA = 'xtend.enterprise.layout-display-media-tokenization-finding.v1';
const ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_REPORT_SCHEMA = 'xtend.enterprise.layout-display-media-tokenization-report.v1';
const ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_WORKPACKAGE = 'ECH-WP-07';
const ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_LOCAL_GATE = 'node scripts/run_xtend_tests.js enterprise-layout-display-media-tokenization --json';

const REQUIRED_LAYOUT_TOKENS = Object.freeze([
  '--xtend-layout-surface',
  '--xtend-layout-text',
  '--xtend-layout-border-color',
  '--xtend-layout-radius',
  '--xtend-layout-elevation',
  '--xtend-layout-spacing',
  '--xtend-layout-gap',
  '--xtend-layout-font-family',
  '--xtend-layout-font-size',
  '--xtend-layout-media-radius',
  '--xtend-layout-focus-ring',
  '--xtend-layout-grid-min',
  '--xtend-layout-content-max'
]);

const REQUIRED_DOC_MARKERS = Object.freeze([
  'ECH-WP-07',
  'Token-Tabelle',
  'signatureDesign',
  'Fremdtheme'
]);

const REQUIRED_SOURCE_MARKERS = Object.freeze([
  'signatureDesign',
  'overflow-wrap: anywhere',
  'prefers-reduced-motion',
  'forced-colors'
]);

const REQUIRED_FIXTURE_MARKERS = Object.freeze([
  'data-xtend-layout-theme="enterprise-foreign"',
  '--xtend-layout-surface',
  '--xtend-layout-text',
  '--xtend-layout-radius',
  '--xtend-layout-font-family'
]);

const TEXT_GLYPH_CONTROL_PATTERNS = Object.freeze([
  'textContent = "▼"',
  'textContent = "▶"',
  '&times;',
  '>x</button>',
  '>X</button>'
]);

const LAYOUT_DISPLAY_MEDIA_TARGETS = Object.freeze([
  {
    tag: 'x-header',
    file: 'components/xheader.js',
    docs: 'docs/components/xheader.md',
    fixture: 'tests/components/fixtures/xheader.component.html',
    signatureRole: 'enterprise-app-shell'
  },
  {
    tag: 'x-footer',
    file: 'components/xfooter.js',
    docs: 'docs/components/xfooter.md',
    fixture: 'tests/components/fixtures/xfooter.component.html',
    signatureRole: 'enterprise-footer'
  },
  {
    tag: 'x-hero',
    file: 'components/xhero.js',
    docs: 'docs/components/xhero.md',
    fixture: 'tests/components/fixtures/xhero.component.html',
    signatureRole: 'editorial-hero'
  },
  {
    tag: 'x-section',
    file: 'components/xsection.js',
    docs: 'docs/components/xsection.md',
    fixture: 'tests/components/fixtures/xsection.component.html',
    signatureRole: 'content-section'
  },
  {
    tag: 'x-cards',
    file: 'components/xcards.js',
    docs: 'docs/components/xcards.md',
    fixture: 'tests/components/fixtures/xcards.component.html',
    signatureRole: 'card-grid'
  },
  {
    tag: 'x-masonry',
    file: 'components/xmasonry.js',
    docs: 'docs/components/xmasonry.md',
    fixture: 'tests/components/fixtures/xmasonry.component.html',
    signatureRole: 'masonry-grid'
  },
  {
    tag: 'x-code',
    file: 'components/xcode.js',
    docs: 'docs/components/xcode.md',
    fixture: 'tests/components/fixtures/xcode.component.html',
    signatureRole: 'code-surface'
  }
]);

function resolveRootDir(rootDir) {
  return rootDir || path.resolve(__dirname, '..');
}

function readFile(rootDir, relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function addFinding(findings, target, category, message, pattern, surface) {
  findings.push({
    schema: ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_FINDING_SCHEMA,
    category,
    tag: target.tag,
    file: surface || target.file,
    message,
    pattern,
    blocking: true
  });
}

function inspectTarget(rootDir, target) {
  const source = readFile(rootDir, target.file);
  const docs = readFile(rootDir, target.docs);
  const fixture = readFile(rootDir, target.fixture);
  const findings = [];

  REQUIRED_LAYOUT_TOKENS.forEach((token) => {
    if (!source.includes(token)) {
      addFinding(findings, target, 'layout.token.source-missing', `${target.tag} source must consume ${token}`, token);
    }
    if (!docs.includes(token)) {
      addFinding(findings, target, 'layout.token.docs-missing', `${target.tag} docs must document ${token}`, token, target.docs);
    }
  });

  REQUIRED_SOURCE_MARKERS.forEach((marker) => {
    if (!source.includes(marker)) {
      addFinding(findings, target, 'layout.source-marker.missing', `${target.tag} source must include ${marker}`, marker);
    }
  });

  REQUIRED_DOC_MARKERS.forEach((marker) => {
    if (!docs.includes(marker)) {
      addFinding(findings, target, 'layout.docs-marker.missing', `${target.tag} docs must include ${marker}`, marker, target.docs);
    }
  });

  REQUIRED_FIXTURE_MARKERS.forEach((marker) => {
    if (!fixture.includes(marker)) {
      addFinding(findings, target, 'layout.fixture-theme.missing', `${target.tag} fixture must show a foreign enterprise theme marker ${marker}`, marker, target.fixture);
    }
  });

  TEXT_GLYPH_CONTROL_PATTERNS.forEach((pattern) => {
    if (source.includes(pattern)) {
      addFinding(findings, target, 'layout.control.text-glyph', `${target.tag} must not use visible text glyphs as controls`, pattern);
    }
  });

  return {
    tag: target.tag,
    file: target.file,
    docs: target.docs,
    fixture: target.fixture,
    signatureRole: target.signatureRole,
    tokenCount: REQUIRED_LAYOUT_TOKENS.length,
    findings
  };
}

function createEnterpriseLayoutDisplayMediaTokenizationReport(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const targets = LAYOUT_DISPLAY_MEDIA_TARGETS.map((target) => inspectTarget(rootDir, target));
  const findings = targets.flatMap((target) => target.findings);
  const summary = findings.reduce((result, finding) => {
    result.total += 1;
    result.byCategory[finding.category] = (result.byCategory[finding.category] || 0) + 1;
    return result;
  }, { total: 0, byCategory: {} });

  return {
    schema: ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_SCHEMA,
    reportSchema: ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_REPORT_SCHEMA,
    findingSchema: ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_FINDING_SCHEMA,
    workpackage: ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_WORKPACKAGE,
    localGate: ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_LOCAL_GATE,
    requiredTokens: REQUIRED_LAYOUT_TOKENS.slice(),
    requiredDocMarkers: REQUIRED_DOC_MARKERS.slice(),
    requiredFixtureMarkers: REQUIRED_FIXTURE_MARKERS.slice(),
    targets,
    findings,
    summary,
    ok: findings.length === 0
  };
}

function validateEnterpriseLayoutDisplayMediaTokenizationReport(report = {}) {
  const errors = [];
  if (report.schema !== ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_SCHEMA) errors.push(`schema must be ${ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_SCHEMA}`);
  if (report.reportSchema !== ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_REPORT_SCHEMA) errors.push(`reportSchema must be ${ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_REPORT_SCHEMA}`);
  if (report.findingSchema !== ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_FINDING_SCHEMA) errors.push(`findingSchema must be ${ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_FINDING_SCHEMA}`);
  if (report.workpackage !== ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_WORKPACKAGE) errors.push(`workpackage must be ${ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_WORKPACKAGE}`);
  if (report.localGate !== ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_LOCAL_GATE) errors.push('invalid local gate');
  if (!Array.isArray(report.requiredTokens) || !REQUIRED_LAYOUT_TOKENS.every((token) => report.requiredTokens.includes(token))) errors.push('requiredTokens must include every layout token');
  if (!Array.isArray(report.targets) || report.targets.length !== LAYOUT_DISPLAY_MEDIA_TARGETS.length) errors.push('targets must cover every WP-07 target');
  if (!Array.isArray(report.findings)) errors.push('findings must be an array');
  if (!report.summary || typeof report.summary.total !== 'number') errors.push('summary.total must be numeric');
  if (report.ok !== (Array.isArray(report.findings) && report.findings.length === 0)) errors.push('ok must reflect finding count');
  return {
    schema: ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_FINDING_SCHEMA,
  ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_LOCAL_GATE,
  ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_REPORT_SCHEMA,
  ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_SCHEMA,
  ENTERPRISE_LAYOUT_DISPLAY_MEDIA_TOKENIZATION_WORKPACKAGE,
  LAYOUT_DISPLAY_MEDIA_TARGETS,
  REQUIRED_DOC_MARKERS,
  REQUIRED_FIXTURE_MARKERS,
  REQUIRED_LAYOUT_TOKENS,
  REQUIRED_SOURCE_MARKERS,
  TEXT_GLYPH_CONTROL_PATTERNS,
  createEnterpriseLayoutDisplayMediaTokenizationReport,
  validateEnterpriseLayoutDisplayMediaTokenizationReport
};
