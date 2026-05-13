const fs = require('fs');
const path = require('path');

const ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_SCHEMA = 'xtend.enterprise.overlay-mode-token-parity.v1';
const ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_FINDING_SCHEMA = 'xtend.enterprise.overlay-mode-token-parity-finding.v1';
const ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_REPORT_SCHEMA = 'xtend.enterprise.overlay-mode-token-parity-report.v1';
const ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_WORKPACKAGE = 'ECH-WP-06';
const ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_LOCAL_GATE = 'node scripts/run_xtend_tests.js enterprise-overlay-mode-token-parity --json';

const OVERLAY_TARGETS = Object.freeze([
  {
    tag: 'x-drawer',
    file: 'components/xdrawer.js',
    docs: 'docs/components/xdrawer.md',
    modeModel: 'modal-optional',
    parts: ['part="backdrop overlay"', 'part="root surface overlay-surface"', 'part="close control"', 'part="content"'],
    tokens: ['--xtend-overlay-surface', '--xtend-overlay-backdrop', '--xtend-overlay-z', '--xtend-overlay-backdrop-z', '--xdrawer-bg', '--xdrawer-overlay-bg'],
    semantics: ['focus-trap', 'apply-inert', 'lock-scroll', 'outsideClick', 'escapeBehavior', 'xtend.surface.overlay-stack-bridge.v1']
  },
  {
    tag: 'x-side-panel',
    file: 'components/xsidepanel.js',
    docs: 'docs/components/xsidepanel.md',
    modeModel: 'docked-overlay-modal',
    parts: ['part="backdrop scrim"', 'part="root surface overlay-surface"', 'part="close control"', 'part="content"'],
    tokens: ['--xtend-overlay-surface', '--xtend-overlay-backdrop', '--xtend-overlay-z', '--side-panel-bg', '--side-panel-backdrop'],
    semantics: ['mode', 'modal', 'surface-manager', 'surface.visible.render', 'surface.user-blocking.open']
  },
  {
    tag: 'x-modal',
    file: 'components/xmodal.js',
    docs: 'docs/components/xmodal.md',
    modeModel: 'modal',
    parts: ['part="backdrop overlay"', 'part="surface overlay-surface"', 'part="close control"', 'part="content"'],
    tokens: ['--xtend-overlay-surface', '--xtend-overlay-backdrop', '--xtend-overlay-z', '--xmodal-surface', '--xmodal-overlay-bg'],
    semantics: ['focus-trap', 'apply-inert', 'lock-scroll', 'outsideClick', 'escapeBehavior', 'xtend.surface.overlay-stack-bridge.v1']
  },
  {
    tag: 'x-dialog',
    file: 'components/xdialog.js',
    docs: 'docs/components/xdialog.md',
    modeModel: 'modal',
    parts: ['part="backdrop overlay"', 'part="surface overlay-surface"', 'part="close control"', 'part="content"'],
    tokens: ['--xtend-overlay-surface', '--xtend-overlay-backdrop', '--xtend-overlay-z', '--xdialog-surface', '--xdialog-glass-bg'],
    semantics: ['focus-trap', 'apply-inert', 'lock-scroll', 'outsideClick', 'escapeBehavior', 'xtend.surface.overlay-stack-bridge.v1']
  },
  {
    tag: 'x-popover',
    file: 'components/xpopover.js',
    docs: 'docs/components/xpopover.md',
    modeModel: 'non-modal-default-modal-optional',
    parts: ['part="backdrop"', 'part="root surface overlay-surface"', 'part="close control"', 'part="content"'],
    tokens: ['--xtend-overlay-surface', '--xtend-overlay-backdrop', '--xtend-overlay-z', '--xpopover-bg', '--xpopover-backdrop'],
    semantics: ['inertStrategy', 'none-by-default', 'modal', '_handleFocusTrap', 'outside-click-close']
  },
  {
    tag: 'x-tooltip',
    file: 'components/xtooltip.js',
    docs: 'docs/components/xtooltip.md',
    modeModel: 'non-modal-informational',
    parts: ['part="backdrop"', 'part="root surface overlay-surface content"', 'part="close"'],
    tokens: ['--xtend-overlay-surface', '--xtend-overlay-text', '--xtend-overlay-z', '--xtooltip-bg', '--xtooltip-shadow'],
    semantics: ['role="tooltip"', 'not-applicable', 'tooltip-opened', 'tooltip-closed']
  }
]);

function resolveRootDir(rootDir) {
  return rootDir || path.resolve(__dirname, '..');
}

function readFile(rootDir, relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function addFinding(findings, target, category, message, pattern) {
  findings.push({
    schema: ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_FINDING_SCHEMA,
    category,
    tag: target.tag,
    file: target.file,
    message,
    pattern,
    blocking: true
  });
}

function inspectTarget(rootDir, target) {
  const source = readFile(rootDir, target.file);
  const docs = fs.existsSync(path.join(rootDir, target.docs)) ? readFile(rootDir, target.docs) : '';
  const findings = [];

  target.parts.forEach((pattern) => {
    if (!source.includes(pattern)) {
      addFinding(findings, target, 'overlay.part.missing', `${target.tag} is missing required overlay part ${pattern}`, pattern);
    }
  });
  target.tokens.forEach((pattern) => {
    if (!source.includes(pattern)) {
      addFinding(findings, target, 'overlay.token.missing', `${target.tag} is missing overlay token ${pattern}`, pattern);
    }
  });
  target.semantics.forEach((pattern) => {
    if (!source.includes(pattern)) {
      addFinding(findings, target, 'overlay.semantic.missing', `${target.tag} is missing overlay semantic marker ${pattern}`, pattern);
    }
  });
  if (!source.includes('prefers-reduced-motion')) {
    addFinding(findings, target, 'overlay.motion.missing', `${target.tag} must keep reduced-motion coverage`, 'prefers-reduced-motion');
  }
  if (!source.includes('forced-colors')) {
    addFinding(findings, target, 'overlay.forced-colors.missing', `${target.tag} must keep forced-colors coverage`, 'forced-colors');
  }
  if (!docs.includes('ECH-WP-06')) {
    addFinding(findings, target, 'overlay.docs.missing', `${target.tag} docs must describe ECH-WP-06 overlay parity`, 'ECH-WP-06');
  }

  return {
    tag: target.tag,
    file: target.file,
    docs: target.docs,
    modeModel: target.modeModel,
    partCount: target.parts.length,
    tokenCount: target.tokens.length,
    semanticCount: target.semantics.length,
    findings
  };
}

function createEnterpriseOverlayModeTokenParityReport(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const targets = OVERLAY_TARGETS.map((target) => inspectTarget(rootDir, target));
  const findings = targets.flatMap((target) => target.findings);
  const summary = findings.reduce((result, finding) => {
    result.total += 1;
    result.byCategory[finding.category] = (result.byCategory[finding.category] || 0) + 1;
    return result;
  }, { total: 0, byCategory: {} });

  return {
    schema: ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_SCHEMA,
    reportSchema: ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_REPORT_SCHEMA,
    findingSchema: ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_FINDING_SCHEMA,
    workpackage: ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_WORKPACKAGE,
    localGate: ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_LOCAL_GATE,
    requiredParts: ['surface', 'backdrop', 'close', 'content'],
    requiredTokenDomains: ['surface', 'text', 'border', 'elevation', 'backdrop', 'z-index', 'focus'],
    targets,
    findings,
    summary,
    ok: findings.length === 0
  };
}

function validateEnterpriseOverlayModeTokenParityReport(report) {
  const failures = [];
  if (!report || report.schema !== ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_SCHEMA) failures.push('invalid schema');
  if (!report || report.reportSchema !== ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_REPORT_SCHEMA) failures.push('invalid report schema');
  if (!report || report.workpackage !== ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_WORKPACKAGE) failures.push('invalid workpackage');
  if (!report || report.localGate !== ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_LOCAL_GATE) failures.push('invalid local gate');
  if (!report || !Array.isArray(report.targets) || report.targets.length !== OVERLAY_TARGETS.length) failures.push('invalid targets');
  if (!report || !Array.isArray(report.findings)) failures.push('invalid findings');
  if (!report || !report.summary || typeof report.summary.total !== 'number') failures.push('invalid summary');
  return {
    ok: failures.length === 0,
    failures
  };
}

module.exports = {
  ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_FINDING_SCHEMA,
  ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_LOCAL_GATE,
  ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_REPORT_SCHEMA,
  ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_SCHEMA,
  ENTERPRISE_OVERLAY_MODE_TOKEN_PARITY_WORKPACKAGE,
  OVERLAY_TARGETS,
  createEnterpriseOverlayModeTokenParityReport,
  validateEnterpriseOverlayModeTokenParityReport
};
