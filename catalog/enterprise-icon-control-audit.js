const fs = require('fs');
const path = require('path');

const ENTERPRISE_ICON_CONTROL_AUDIT_SCHEMA = 'xtend.enterprise.icon-control-audit.v1';
const ENTERPRISE_ICON_CONTROL_AUDIT_FINDING_SCHEMA = 'xtend.enterprise.icon-control-audit-finding.v1';
const ENTERPRISE_ICON_CONTROL_AUDIT_REPORT_SCHEMA = 'xtend.enterprise.icon-control-audit-report.v1';
const ENTERPRISE_ICON_CONTROL_AUDIT_WORKPACKAGE = 'ECH-WP-04';
const ENTERPRISE_ICON_CONTROL_AUDIT_LOCAL_GATE = 'node scripts/run_xtend_tests.js enterprise-icon-control-audit --json';

const PRODUCTION_SCAN_PATHS = Object.freeze([
  'components',
  'src/components',
  'xtend.js',
  'xtend-dev.js',
  'xtend-loader.js'
]);

const IGNORED_FILES = Object.freeze([
  'components/prism.js'
]);

const SCAN_EXTENSIONS = Object.freeze(['.js', '.ts']);

const REQUIRED_CORE_ICONS = Object.freeze([
  'close',
  'menu',
  'chevron-left',
  'chevron-right',
  'chevron-up',
  'chevron-down',
  'success',
  'warning',
  'error',
  'info',
  'pin',
  'minus',
  'maximize'
]);

const CONTROL_KEYWORDS = Object.freeze([
  'close',
  'dismiss',
  'menu',
  'collapse',
  'expand',
  'minimize',
  'maximize',
  'pin',
  'previous',
  'next',
  'scroll',
  'copy'
]);

const TEXT_GLYPH_ENTITIES = Object.freeze([
  '&times;',
  '&#215;',
  '&#x00d7;',
  '&#x0d7;',
  '&lt;',
  '&gt;',
  '&#9776;',
  '&#10003;',
  '&#9888;'
]);

const TEXT_GLYPH_LITERALS = Object.freeze([
  'x',
  'X',
  '_',
  '[]',
  '-',
  '+',
  'P',
  '\\u00d7',
  '\\u2630',
  '\\u2713',
  '\\u26a0',
  '\\u2191',
  '\\u2192',
  '\\u2193',
  '\\u2190'
]);

function normalizePath(value) {
  return String(value || '').replace(/\\/g, '/');
}

function resolveRootDir(rootDir) {
  return rootDir || path.resolve(__dirname, '..');
}

function walkFiles(rootDir, relativePath, output = []) {
  const normalized = normalizePath(relativePath);
  if (IGNORED_FILES.includes(normalized)) return output;
  const absolutePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(absolutePath)) return output;
  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) {
    if (SCAN_EXTENSIONS.includes(path.extname(absolutePath))) output.push(normalized);
    return output;
  }
  fs.readdirSync(absolutePath).forEach((entry) => {
    walkFiles(rootDir, path.join(relativePath, entry), output);
  });
  return output;
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split(/\r?\n/u).length;
}

function stripTags(value) {
  return String(value || '')
    .replace(/<[^>]+>/gu, '')
    .replace(/\$\{[^}]+\}/gu, '')
    .trim();
}

function isTextGlyphControlContent(value) {
  const text = stripTags(value);
  const lowered = text.toLowerCase();
  if (!text) return false;
  if (TEXT_GLYPH_ENTITIES.includes(lowered)) return true;
  return TEXT_GLYPH_LITERALS.some((glyph) => text === glyph || text === JSON.parse(`"${glyph}"`));
}

function isControlButton(attrs, body) {
  const haystack = `${attrs || ''} ${body || ''}`.toLowerCase();
  return CONTROL_KEYWORDS.some((keyword) => new RegExp(`(?:^|[^a-z0-9-])${keyword}(?:$|[^a-z0-9-])`, 'u').test(haystack)) ||
    /class=["'][^"']*(close|copy|burger|trigger)[^"']*["']/u.test(haystack) ||
    /data-action=["'][^"']*(close|pin|collapse|minimize|maximize)[^"']*["']/u.test(haystack);
}

function hasAccessibleName(attrs) {
  return /\s(aria-label|aria-labelledby|title)=["'][^"']+["']/u.test(attrs || '');
}

function hasControlPart(attrs) {
  return /part=["'][^"']*\bcontrol\b[^"']*["']/u.test(attrs || '');
}

function hasIconGraphic(body) {
  return /<\s*(svg|x-icon)\b/iu.test(body || '') ||
    /part=["'][^"']*\bicon\b[^"']*["']/iu.test(body || '') ||
    /xtendLegacyControlIcon/u.test(body || '');
}

function hasIconPart(body) {
  return /part=["'][^"']*\bicon\b[^"']*["']/iu.test(body || '') ||
    /xtendLegacyControlIcon/u.test(body || '');
}

function addFinding(findings, category, file, line, message, excerpt) {
  findings.push({
    schema: ENTERPRISE_ICON_CONTROL_AUDIT_FINDING_SCHEMA,
    category,
    file,
    line,
    message,
    excerpt: String(excerpt || '').trim().slice(0, 220),
    blocking: true
  });
}

function scanFile(rootDir, relativePath) {
  const file = normalizePath(relativePath);
  const text = fs.readFileSync(path.join(rootDir, file), 'utf8');
  const findings = [];
  const buttonPattern = /<button\b([^>]*)>([\s\S]*?)<\/button>/giu;
  let match;

  while ((match = buttonPattern.exec(text))) {
    const attrs = match[1] || '';
    const body = match[2] || '';
    const block = match[0];
    const line = lineNumberAt(text, match.index);
    const control = isControlButton(attrs, body);

    if (isTextGlyphControlContent(body)) {
      addFinding(findings, 'control.text-glyph', file, line, 'visible text glyph used as a control graphic', block);
    }
    if (control && hasIconGraphic(body) && !hasAccessibleName(attrs)) {
      addFinding(findings, 'control.missing-accessible-name', file, line, 'icon control is missing an accessible name', block);
    }
    if (control && hasIconGraphic(body) && !hasControlPart(attrs)) {
      addFinding(findings, 'control.missing-control-part', file, line, 'icon control button must expose a control CSS part', block);
    }
    if (control && hasIconGraphic(body) && !hasIconPart(body)) {
      addFinding(findings, 'control.missing-icon-part', file, line, 'icon control graphic must expose an icon CSS part', block);
    }
  }

  return findings;
}

function createEnterpriseIconControlAuditReport(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const files = (options.files && options.files.length ? options.files : PRODUCTION_SCAN_PATHS.flatMap((entry) => walkFiles(rootDir, entry)))
    .map(normalizePath)
    .filter((file) => !IGNORED_FILES.includes(file));
  const findings = files.flatMap((file) => scanFile(rootDir, file));
  const summary = findings.reduce((result, finding) => {
    result.total += 1;
    result.byCategory[finding.category] = (result.byCategory[finding.category] || 0) + 1;
    return result;
  }, { total: 0, byCategory: {} });

  return {
    schema: ENTERPRISE_ICON_CONTROL_AUDIT_SCHEMA,
    reportSchema: ENTERPRISE_ICON_CONTROL_AUDIT_REPORT_SCHEMA,
    findingSchema: ENTERPRISE_ICON_CONTROL_AUDIT_FINDING_SCHEMA,
    workpackage: ENTERPRISE_ICON_CONTROL_AUDIT_WORKPACKAGE,
    localGate: ENTERPRISE_ICON_CONTROL_AUDIT_LOCAL_GATE,
    scanPaths: PRODUCTION_SCAN_PATHS.slice(),
    ignoredFiles: IGNORED_FILES.slice(),
    requiredCoreIcons: REQUIRED_CORE_ICONS.slice(),
    files,
    findings,
    summary,
    ok: findings.length === 0
  };
}

function validateEnterpriseIconControlAuditReport(report = {}) {
  const errors = [];
  if (report.schema !== ENTERPRISE_ICON_CONTROL_AUDIT_SCHEMA) errors.push(`schema must be ${ENTERPRISE_ICON_CONTROL_AUDIT_SCHEMA}`);
  if (report.reportSchema !== ENTERPRISE_ICON_CONTROL_AUDIT_REPORT_SCHEMA) errors.push(`reportSchema must be ${ENTERPRISE_ICON_CONTROL_AUDIT_REPORT_SCHEMA}`);
  if (report.findingSchema !== ENTERPRISE_ICON_CONTROL_AUDIT_FINDING_SCHEMA) errors.push(`findingSchema must be ${ENTERPRISE_ICON_CONTROL_AUDIT_FINDING_SCHEMA}`);
  if (report.workpackage !== ENTERPRISE_ICON_CONTROL_AUDIT_WORKPACKAGE) errors.push(`workpackage must be ${ENTERPRISE_ICON_CONTROL_AUDIT_WORKPACKAGE}`);
  if (!Array.isArray(report.requiredCoreIcons) || !REQUIRED_CORE_ICONS.every((name) => report.requiredCoreIcons.includes(name))) errors.push('requiredCoreIcons must include every ECH-WP-04 core icon');
  if (!report.summary || typeof report.summary.total !== 'number') errors.push('summary.total must be numeric');
  if (!Array.isArray(report.findings)) errors.push('findings must be an array');
  if (report.ok !== (Array.isArray(report.findings) && report.findings.length === 0)) errors.push('ok must reflect finding count');
  return {
    schema: ENTERPRISE_ICON_CONTROL_AUDIT_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  CONTROL_KEYWORDS,
  ENTERPRISE_ICON_CONTROL_AUDIT_FINDING_SCHEMA,
  ENTERPRISE_ICON_CONTROL_AUDIT_LOCAL_GATE,
  ENTERPRISE_ICON_CONTROL_AUDIT_REPORT_SCHEMA,
  ENTERPRISE_ICON_CONTROL_AUDIT_SCHEMA,
  ENTERPRISE_ICON_CONTROL_AUDIT_WORKPACKAGE,
  IGNORED_FILES,
  PRODUCTION_SCAN_PATHS,
  REQUIRED_CORE_ICONS,
  SCAN_EXTENSIONS,
  TEXT_GLYPH_ENTITIES,
  TEXT_GLYPH_LITERALS,
  createEnterpriseIconControlAuditReport,
  isTextGlyphControlContent,
  validateEnterpriseIconControlAuditReport
};
