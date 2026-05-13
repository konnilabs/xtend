const fs = require('fs');
const path = require('path');

const ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_SCHEMA = 'xtend.enterprise.navigation-routing-state-hardening.v1';
const ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_FINDING_SCHEMA = 'xtend.enterprise.navigation-routing-state-hardening-finding.v1';
const ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_REPORT_SCHEMA = 'xtend.enterprise.navigation-routing-state-hardening-report.v1';
const ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_WORKPACKAGE = 'ECH-WP-09';
const ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_LOCAL_GATE = 'node scripts/run_xtend_tests.js enterprise-navigation-routing-state-hardening --json';

const REQUIRED_NAVIGATION_TOKENS = Object.freeze([
  '--xtend-nav-surface',
  '--xtend-nav-text',
  '--xtend-nav-border-color',
  '--xtend-nav-radius',
  '--xtend-nav-gap',
  '--xtend-nav-font-family',
  '--xtend-nav-font-size',
  '--xtend-nav-active-surface',
  '--xtend-nav-active-text',
  '--xtend-nav-current-indicator',
  '--xtend-nav-hover-surface',
  '--xtend-nav-focus-ring',
  '--xtend-nav-disabled-opacity'
]);

const REQUIRED_SOURCE_MARKERS = Object.freeze([
  'xtendNavigationRoutingUxProfile',
  'signatureDesign',
  'activeState',
  'aria-current',
  'aria-selected',
  'routeAnnouncement',
  'keyboardNavigation',
  'disabled',
  'overflow-wrap: anywhere',
  'prefers-reduced-motion',
  'forced-colors'
]);

const REQUIRED_DOC_MARKERS = Object.freeze([
  'ECH-WP-09',
  'Token-Tabelle',
  'Keyboard-Verhalten',
  'Active/Current/Selected',
  'Fremdtheme'
]);

const REQUIRED_FIXTURE_MARKERS = Object.freeze([
  'data-xtend-nav-theme="enterprise-foreign"',
  '--xtend-nav-active-surface',
  '--xtend-nav-current-indicator',
  'aria-current="page"',
  'aria-selected="true"',
  'disabled',
  'Lang'
]);

const TEXT_GLYPH_CONTROL_PATTERNS = Object.freeze([
  'textContent = "X"',
  "textContent = 'X'",
  'textContent = "x"',
  "textContent = 'x'",
  'textContent = "×"',
  "textContent = '×'",
  '&times;',
  'textContent = ">"',
  "textContent = '>'",
  'textContent = "▶"',
  "textContent = '▶'",
  'textContent = "▼"',
  "textContent = '▼'"
]);

const NAVIGATION_ROUTING_STATE_TARGETS = Object.freeze([
  {
    tag: 'x-menu',
    file: 'components/xmenu.js',
    docs: 'docs/components/xmenu.md',
    fixture: 'tests/components/fixtures/xmenu.component.html',
    requiredEvents: ['menu-item-clicked', 'menu-navigate', 'menu-keyboard-navigation'],
    requiredCommands: ['_resolveNextEnabledIndex', '_syncDisclosureIconControl'],
    iconMarkers: ['disclosure-icon control icon', 'data-xtend-disclosure-icon']
  },
  {
    tag: 'x-tabs',
    file: 'components/xtabs.js',
    docs: 'docs/components/xtabs.md',
    fixture: 'tests/components/fixtures/xtabs.component.html',
    requiredEvents: ['tab-selected'],
    requiredCommands: ['_resolveNextEnabledTabIndex', 'selectTab(i)'],
    iconMarkers: []
  },
  {
    tag: 'x-router',
    file: 'components/xrouter.js',
    docs: 'docs/components/xrouter.md',
    fixture: 'tests/components/fixtures/xrouter.component.html',
    requiredEvents: ['route-announced', 'xrouter-after-navigate'],
    requiredCommands: ['announceRoute', 'focusRoute'],
    iconMarkers: []
  },
  {
    tag: 'x-link',
    file: 'components/xlink.js',
    docs: 'docs/components/xlink.md',
    fixture: 'tests/components/fixtures/xlink.component.html',
    requiredEvents: ['before-navigate', 'after-navigate', 'x-navigate'],
    requiredCommands: ['updateActive', '_syncAnchorState'],
    iconMarkers: []
  },
  {
    tag: 'x-header',
    file: 'components/xheader.js',
    docs: 'docs/components/xheader.md',
    fixture: 'tests/components/fixtures/xheader.component.html',
    requiredEvents: ['menu-opened', 'menu-closed', 'menu-mode-changed', 'menu-placement-changed'],
    requiredCommands: ['toggleMenu', '_trapMenuFocus'],
    iconMarkers: ['trigger-icon control icon', 'disclosure-icon control icon']
  }
]);

function resolveRootDir(rootDir) {
  return rootDir || path.resolve(__dirname, '..');
}

function readFile(rootDir, relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function addFinding(findings, target, category, message, pattern, file) {
  findings.push({
    schema: ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_FINDING_SCHEMA,
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

  REQUIRED_NAVIGATION_TOKENS.forEach((token) => {
    if (!source.includes(token)) addFinding(findings, target, 'navigation.token.source-missing', `${target.tag} source must consume ${token}`, token);
    if (!docs.includes(token)) addFinding(findings, target, 'navigation.token.docs-missing', `${target.tag} docs must document ${token}`, token, target.docs);
    if (!fixture.includes(token)) addFinding(findings, target, 'navigation.token.fixture-missing', `${target.tag} fixture must theme ${token}`, token, target.fixture);
  });

  REQUIRED_SOURCE_MARKERS.forEach((marker) => {
    if (!source.includes(marker)) addFinding(findings, target, 'navigation.source-marker.missing', `${target.tag} source must include ${marker}`, marker);
  });

  REQUIRED_DOC_MARKERS.forEach((marker) => {
    if (!docs.includes(marker)) addFinding(findings, target, 'navigation.docs-marker.missing', `${target.tag} docs must include ${marker}`, marker, target.docs);
  });

  REQUIRED_FIXTURE_MARKERS.forEach((marker) => {
    if (!fixture.includes(marker)) addFinding(findings, target, 'navigation.fixture-state.missing', `${target.tag} fixture must include ${marker}`, marker, target.fixture);
  });

  target.requiredEvents.forEach((marker) => {
    if (!source.includes(marker)) addFinding(findings, target, 'navigation.event.missing', `${target.tag} source must expose ${marker}`, marker);
  });

  target.requiredCommands.forEach((marker) => {
    if (!source.includes(marker)) addFinding(findings, target, 'navigation.command.missing', `${target.tag} source must expose ${marker}`, marker);
  });

  target.iconMarkers.forEach((marker) => {
    if (!source.includes(marker) && !fixture.includes(marker)) {
      addFinding(findings, target, 'navigation.icon-control.missing', `${target.tag} must expose icon controls for disclosure/menu states`, marker);
    }
  });

  TEXT_GLYPH_CONTROL_PATTERNS.forEach((pattern) => {
    if (source.includes(pattern)) addFinding(findings, target, 'navigation.text-glyph-control.present', `${target.tag} must not use text glyph controls`, pattern);
  });

  return {
    tag: target.tag,
    file: target.file,
    docs: target.docs,
    fixture: target.fixture,
    tokenCount: REQUIRED_NAVIGATION_TOKENS.length,
    findings
  };
}

function createEnterpriseNavigationRoutingStateHardeningReport(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const targets = NAVIGATION_ROUTING_STATE_TARGETS.map((target) => inspectTarget(rootDir, target));
  const findings = targets.flatMap((target) => target.findings);
  const summary = findings.reduce((result, finding) => {
    result.total += 1;
    result.byCategory[finding.category] = (result.byCategory[finding.category] || 0) + 1;
    return result;
  }, { total: 0, byCategory: {} });

  return {
    schema: ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_SCHEMA,
    reportSchema: ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_REPORT_SCHEMA,
    findingSchema: ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_FINDING_SCHEMA,
    workpackage: ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_WORKPACKAGE,
    localGate: ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_LOCAL_GATE,
    requiredTokens: REQUIRED_NAVIGATION_TOKENS.slice(),
    requiredSourceMarkers: REQUIRED_SOURCE_MARKERS.slice(),
    requiredDocMarkers: REQUIRED_DOC_MARKERS.slice(),
    requiredFixtureMarkers: REQUIRED_FIXTURE_MARKERS.slice(),
    textGlyphControlPatterns: TEXT_GLYPH_CONTROL_PATTERNS.slice(),
    targets,
    findings,
    summary,
    ok: findings.length === 0
  };
}

function validateEnterpriseNavigationRoutingStateHardeningReport(report = {}) {
  const errors = [];
  if (report.schema !== ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_SCHEMA) errors.push(`schema must be ${ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_SCHEMA}`);
  if (report.reportSchema !== ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_REPORT_SCHEMA) errors.push(`reportSchema must be ${ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_REPORT_SCHEMA}`);
  if (report.findingSchema !== ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_FINDING_SCHEMA) errors.push(`findingSchema must be ${ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_FINDING_SCHEMA}`);
  if (report.workpackage !== ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_WORKPACKAGE) errors.push(`workpackage must be ${ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_WORKPACKAGE}`);
  if (report.localGate !== ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_LOCAL_GATE) errors.push('invalid local gate');
  if (!Array.isArray(report.requiredTokens) || !REQUIRED_NAVIGATION_TOKENS.every((token) => report.requiredTokens.includes(token))) errors.push('requiredTokens must include every navigation token');
  if (!Array.isArray(report.targets) || report.targets.length !== NAVIGATION_ROUTING_STATE_TARGETS.length) errors.push('targets must cover every WP-09 target');
  if (!Array.isArray(report.findings)) errors.push('findings must be an array');
  if (!report.summary || typeof report.summary.total !== 'number') errors.push('summary.total must be numeric');
  if (report.ok !== (Array.isArray(report.findings) && report.findings.length === 0)) errors.push('ok must reflect finding count');
  return {
    schema: ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_FINDING_SCHEMA,
  ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_LOCAL_GATE,
  ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_REPORT_SCHEMA,
  ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_SCHEMA,
  ENTERPRISE_NAVIGATION_ROUTING_STATE_HARDENING_WORKPACKAGE,
  NAVIGATION_ROUTING_STATE_TARGETS,
  REQUIRED_DOC_MARKERS,
  REQUIRED_FIXTURE_MARKERS,
  REQUIRED_NAVIGATION_TOKENS,
  REQUIRED_SOURCE_MARKERS,
  TEXT_GLYPH_CONTROL_PATTERNS,
  createEnterpriseNavigationRoutingStateHardeningReport,
  validateEnterpriseNavigationRoutingStateHardeningReport
};
