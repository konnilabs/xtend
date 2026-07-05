const fs = require('fs');
const path = require('path');

const ENTERPRISE_FORM_CONTROL_THEME_A11Y_SCHEMA = 'xtend.enterprise.form-control-theme-a11y.v1';
const ENTERPRISE_FORM_CONTROL_THEME_A11Y_FINDING_SCHEMA = 'xtend.enterprise.form-control-theme-a11y-finding.v1';
const ENTERPRISE_FORM_CONTROL_THEME_A11Y_REPORT_SCHEMA = 'xtend.enterprise.form-control-theme-a11y-report.v1';
const ENTERPRISE_FORM_CONTROL_THEME_A11Y_WORKPACKAGE = 'ECH-WP-08';
const ENTERPRISE_FORM_CONTROL_THEME_A11Y_LOCAL_GATE = 'node scripts/run_xtend_tests.js enterprise-form-control-theme-a11y --json';

const REQUIRED_FORM_TOKENS = Object.freeze([
  '--xtend-form-text',
  '--xtend-form-control-surface',
  '--xtend-form-control-text',
  '--xtend-form-label-text',
  '--xtend-form-helper-text',
  '--xtend-form-error-text',
  '--xtend-form-error-surface',
  '--xtend-form-error-border',
  '--xtend-form-focus-ring',
  '--xtend-form-radius',
  '--xtend-form-gap',
  '--xtend-form-font-family',
  '--xtend-form-control-font-size',
  '--xtend-form-helper-font-size',
  '--xtend-form-icon-color'
]);

const REQUIRED_SOURCE_MARKERS = Object.freeze([
  'signatureDesign',
  'densityProfiles',
  'states:',
  'density="comfortable"',
  'density="compact"',
  'density="dense"',
  'aria-invalid',
  'aria-busy',
  'prefers-reduced-motion',
  'forced-colors',
  'part="label',
  'part="helper',
  'part="error status"'
]);

const REQUIRED_DOC_MARKERS = Object.freeze([
  'ECH-WP-08',
  'signatureDesign',
  'Density-Profile',
  'Invalid'
]);

const REQUIRED_FIXTURE_MARKERS = Object.freeze([
  'data-xtend-form-theme="enterprise-foreign"',
  '--xtend-form-control-surface',
  '--xtend-form-error-border',
  '--xtend-form-focus-ring',
  'density='
]);

const FORM_CONTROL_THEME_TARGETS = Object.freeze([
  {
    tag: 'x-input',
    file: 'components/xinput.js',
    docs: 'docs/components/xinput.md',
    fixture: 'tests/components/fixtures/xinput.component.html',
    nonColorMarkers: ['border-inline-start', 'box-shadow: var(--xtend-form-error-shadow']
  },
  {
    tag: 'x-select',
    file: 'components/xselect.js',
    docs: 'docs/components/xselect.md',
    fixture: 'tests/components/fixtures/xselect.component.html',
    nonColorMarkers: ['border-inline-start', 'box-shadow: var(--xtend-form-error-shadow']
  },
  {
    tag: 'x-checkbox',
    file: 'components/xcheckbox.js',
    docs: 'docs/components/xcheckbox.md',
    fixture: 'tests/components/fixtures/xcheckbox.component.html',
    nonColorMarkers: ['border-inline-start', 'outline: var(--xtend-form-error-outline']
  },
  {
    tag: 'x-toggle',
    file: 'components/xtoggle.js',
    docs: 'docs/components/xtoggle.md',
    fixture: 'tests/components/fixtures/xtoggle.component.html',
    nonColorMarkers: ['border-inline-start', 'box-shadow: 0 0 0 2px']
  },
  {
    tag: 'x-radio',
    file: 'components/xradio.js',
    docs: 'docs/components/xradio.md',
    fixture: 'tests/components/fixtures/xradio.component.html',
    nonColorMarkers: ['border-inline-start', 'outline: var(--xtend-form-error-outline']
  },
  {
    tag: 'x-textarea',
    file: 'components/xtextarea.js',
    docs: 'docs/components/xtextarea.md',
    fixture: 'tests/components/fixtures/xtextarea.component.html',
    nonColorMarkers: ['border-inline-start', 'box-shadow: var(--xtend-form-error-shadow']
  },
  {
    tag: 'x-form',
    file: 'components/xform.js',
    docs: 'docs/components/xform.md',
    fixture: 'tests/components/fixtures/xform.component.html',
    nonColorMarkers: ['border-color: var(--xtend-form-error-border', 'box-shadow: var(--xtend-form-error-shadow']
  }
]);

function resolveRootDir(rootDir) {
  return rootDir || path.resolve(__dirname, '..');
}

function readFile(rootDir, relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  if (fs.existsSync(absolutePath)) return fs.readFileSync(absolutePath, 'utf8');
  if (relativePath.startsWith('docs/components/')) {
    const localizedPath = relativePath.replace('docs/components/', 'docs/de/components/');
    const englishPath = relativePath.replace('docs/components/', 'docs/en/components/');
    return [localizedPath, englishPath]
      .map((candidate) => path.join(rootDir, candidate))
      .filter((candidate) => fs.existsSync(candidate))
      .map((candidate) => fs.readFileSync(candidate, 'utf8'))
      .join('\n');
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

function addFinding(findings, target, category, message, pattern, file) {
  findings.push({
    schema: ENTERPRISE_FORM_CONTROL_THEME_A11Y_FINDING_SCHEMA,
    category,
    tag: target.tag,
    file: file || target.file,
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

  REQUIRED_FORM_TOKENS.forEach((token) => {
    if (!source.includes(token)) addFinding(findings, target, 'form.token.source-missing', `${target.tag} source must consume ${token}`, token);
    if (!docs.includes(token)) addFinding(findings, target, 'form.token.docs-missing', `${target.tag} docs must document ${token}`, token, target.docs);
  });

  REQUIRED_SOURCE_MARKERS.forEach((marker) => {
    if (!source.includes(marker)) addFinding(findings, target, 'form.source-marker.missing', `${target.tag} source must include ${marker}`, marker);
  });

  REQUIRED_DOC_MARKERS.forEach((marker) => {
    if (!docs.includes(marker)) addFinding(findings, target, 'form.docs-marker.missing', `${target.tag} docs must include ${marker}`, marker, target.docs);
  });

  REQUIRED_FIXTURE_MARKERS.forEach((marker) => {
    if (!fixture.includes(marker)) addFinding(findings, target, 'form.fixture-theme.missing', `${target.tag} fixture must include ${marker}`, marker, target.fixture);
  });

  target.nonColorMarkers.forEach((marker) => {
    if (!source.includes(marker)) addFinding(findings, target, 'form.invalid.non-color-missing', `${target.tag} invalid/error state must not be color-only`, marker);
  });

  return {
    tag: target.tag,
    file: target.file,
    docs: target.docs,
    fixture: target.fixture,
    tokenCount: REQUIRED_FORM_TOKENS.length,
    findings
  };
}

function createEnterpriseFormControlThemeA11yReport(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const targets = FORM_CONTROL_THEME_TARGETS.map((target) => inspectTarget(rootDir, target));
  const findings = targets.flatMap((target) => target.findings);
  const summary = findings.reduce((result, finding) => {
    result.total += 1;
    result.byCategory[finding.category] = (result.byCategory[finding.category] || 0) + 1;
    return result;
  }, { total: 0, byCategory: {} });

  return {
    schema: ENTERPRISE_FORM_CONTROL_THEME_A11Y_SCHEMA,
    reportSchema: ENTERPRISE_FORM_CONTROL_THEME_A11Y_REPORT_SCHEMA,
    findingSchema: ENTERPRISE_FORM_CONTROL_THEME_A11Y_FINDING_SCHEMA,
    workpackage: ENTERPRISE_FORM_CONTROL_THEME_A11Y_WORKPACKAGE,
    localGate: ENTERPRISE_FORM_CONTROL_THEME_A11Y_LOCAL_GATE,
    requiredTokens: REQUIRED_FORM_TOKENS.slice(),
    requiredSourceMarkers: REQUIRED_SOURCE_MARKERS.slice(),
    requiredDocMarkers: REQUIRED_DOC_MARKERS.slice(),
    requiredFixtureMarkers: REQUIRED_FIXTURE_MARKERS.slice(),
    targets,
    findings,
    summary,
    ok: findings.length === 0
  };
}

function validateEnterpriseFormControlThemeA11yReport(report = {}) {
  const errors = [];
  if (report.schema !== ENTERPRISE_FORM_CONTROL_THEME_A11Y_SCHEMA) errors.push(`schema must be ${ENTERPRISE_FORM_CONTROL_THEME_A11Y_SCHEMA}`);
  if (report.reportSchema !== ENTERPRISE_FORM_CONTROL_THEME_A11Y_REPORT_SCHEMA) errors.push(`reportSchema must be ${ENTERPRISE_FORM_CONTROL_THEME_A11Y_REPORT_SCHEMA}`);
  if (report.findingSchema !== ENTERPRISE_FORM_CONTROL_THEME_A11Y_FINDING_SCHEMA) errors.push(`findingSchema must be ${ENTERPRISE_FORM_CONTROL_THEME_A11Y_FINDING_SCHEMA}`);
  if (report.workpackage !== ENTERPRISE_FORM_CONTROL_THEME_A11Y_WORKPACKAGE) errors.push(`workpackage must be ${ENTERPRISE_FORM_CONTROL_THEME_A11Y_WORKPACKAGE}`);
  if (report.localGate !== ENTERPRISE_FORM_CONTROL_THEME_A11Y_LOCAL_GATE) errors.push('invalid local gate');
  if (!Array.isArray(report.requiredTokens) || !REQUIRED_FORM_TOKENS.every((token) => report.requiredTokens.includes(token))) errors.push('requiredTokens must include every form token');
  if (!Array.isArray(report.targets) || report.targets.length !== FORM_CONTROL_THEME_TARGETS.length) errors.push('targets must cover every WP-08 target');
  if (!Array.isArray(report.findings)) errors.push('findings must be an array');
  if (!report.summary || typeof report.summary.total !== 'number') errors.push('summary.total must be numeric');
  if (report.ok !== (Array.isArray(report.findings) && report.findings.length === 0)) errors.push('ok must reflect finding count');
  return {
    schema: ENTERPRISE_FORM_CONTROL_THEME_A11Y_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  ENTERPRISE_FORM_CONTROL_THEME_A11Y_FINDING_SCHEMA,
  ENTERPRISE_FORM_CONTROL_THEME_A11Y_LOCAL_GATE,
  ENTERPRISE_FORM_CONTROL_THEME_A11Y_REPORT_SCHEMA,
  ENTERPRISE_FORM_CONTROL_THEME_A11Y_SCHEMA,
  ENTERPRISE_FORM_CONTROL_THEME_A11Y_WORKPACKAGE,
  FORM_CONTROL_THEME_TARGETS,
  REQUIRED_DOC_MARKERS,
  REQUIRED_FIXTURE_MARKERS,
  REQUIRED_FORM_TOKENS,
  REQUIRED_SOURCE_MARKERS,
  createEnterpriseFormControlThemeA11yReport,
  validateEnterpriseFormControlThemeA11yReport
};
