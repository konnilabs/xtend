const fs = require('fs');
const path = require('path');

const ENTERPRISE_COMPONENT_STYLE_AUDIT_SCHEMA = 'xtend.enterprise.component-style-audit.v1';
const ENTERPRISE_COMPONENT_STYLE_AUDIT_FINDING_SCHEMA = 'xtend.enterprise.component-style-audit-finding.v1';
const ENTERPRISE_COMPONENT_STYLE_AUDIT_REPORT_SCHEMA = 'xtend.enterprise.component-style-audit-report.v1';
const ENTERPRISE_COMPONENT_STYLE_AUDIT_WORKPACKAGE = 'ECH-WP-02';
const ENTERPRISE_COMPONENT_STYLE_AUDIT_LOCAL_GATE = 'node scripts/run_xtend_tests.js enterprise-component-style-audit --json';

const AUDIT_CATEGORIES = Object.freeze([
  'style.color.literal',
  'style.surface.literal',
  'style.radius.literal',
  'style.shadow.literal',
  'style.spacing.literal',
  'style.typography.literal',
  'style.z-index.literal',
  'control.text-glyph',
  'control.missing-icon-part',
  'theme.missing-forced-colors',
  'theme.missing-reduced-motion'
]);

const CATEGORY_SUGGESTIONS = Object.freeze({
  'style.color.literal': 'Expose the value through a component token with an XTheme-backed fallback.',
  'style.surface.literal': 'Route the surface through a public component token and keep light/dark/forced-colors readable.',
  'style.radius.literal': 'Replace the literal radius with a public radius token or component-scoped alias.',
  'style.shadow.literal': 'Replace the literal shadow with an elevation token and a forced-colors-safe fallback.',
  'style.spacing.literal': 'Replace fixed spacing with a public density or spacing token.',
  'style.typography.literal': 'Use the XTend typography bridge tokens instead of a fixed font stack.',
  'style.z-index.literal': 'Use a named layer token and document the stacking contract.',
  'control.text-glyph': 'Replace text glyph controls with an icon part or an accessible component icon.',
  'control.missing-icon-part': 'Expose the control graphic through a stable icon CSS part.',
  'theme.missing-forced-colors': 'Add forced-colors handling for all visible surfaces, borders, and text.',
  'theme.missing-reduced-motion': 'Add prefers-reduced-motion handling for transitions and animations.'
});

const SCAN_ROOTS = Object.freeze([
  'components',
  'src/components',
  'docs/components',
  'tests/components/fixtures',
  'tests/browser/fixtures'
]);

const SCAN_EXTENSIONS = Object.freeze(['.js', '.ts', '.html', '.md']);

const P0_COMPONENTS = Object.freeze([
  'x-header',
  'x-theme',
  'x-icon',
  'x-button',
  'x-menu',
  'x-drawer',
  'x-side-panel',
  'x-modal',
  'x-dialog',
  'x-popover',
  'x-toast'
]);

const KNOWN_RESIDUAL_FILES = Object.freeze([
  'components/xheader.js',
  'components/xtheme.js',
  'components/xicon.js',
  'components/xbutton.js',
  'components/xmenu.js',
  'components/xdrawer.js',
  'components/xsidepanel.js',
  'components/xmodal.js',
  'components/xdialog.js',
  'components/xpopover.js',
  'components/xtoast.js',
  'docs/components/xheader.md',
  'docs/components/xtheme.md',
  'docs/components/xicon.md',
  'docs/components/xbutton.md',
  'docs/components/xmenu.md',
  'docs/components/xdrawer.md',
  'docs/components/xsidepanel.md',
  'docs/components/xmodal.md',
  'docs/components/xdialog.md',
  'docs/components/xpopover.md',
  'docs/components/xtoast.md'
]);

function normalizePath(value) {
  return String(value || '').replace(/\\/g, '/');
}

function resolveRootDir(rootDir) {
  return rootDir || path.resolve(__dirname, '..');
}

function readJsonIfExists(rootDir, relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function walkFiles(rootDir, relativePath, output = []) {
  const absolutePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(absolutePath)) return output;
  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) {
    if (SCAN_EXTENSIONS.includes(path.extname(absolutePath))) output.push(normalizePath(relativePath));
    return output;
  }
  fs.readdirSync(absolutePath).forEach((entry) => {
    walkFiles(rootDir, path.join(relativePath, entry), output);
  });
  return output;
}

function createPathTagMap(rootDir) {
  const manifest = readJsonIfExists(rootDir, 'components/manifest.json') || {};
  const map = new Map();
  Object.entries(manifest).forEach(([tag, source]) => {
    map.set(normalizePath(`components/${String(source).replace(/^\.\//, '')}`), tag);
  });
  return map;
}

function resolveTagForFile(relativePath, pathTagMap) {
  const normalized = normalizePath(relativePath);
  if (pathTagMap.has(normalized)) return pathTagMap.get(normalized);
  const basename = path.basename(normalized, path.extname(normalized));
  if (basename.startsWith('x') && basename !== 'xtend-state') {
    return `x-${basename.slice(1).replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`;
  }
  if (basename === 'xtend-state') return 'xtend-state';
  return null;
}

function isP0Tag(tag) {
  return P0_COMPONENTS.includes(tag);
}

function isAllowedFallbackLine(line) {
  return line.includes('var(') || line.includes('Canvas') || line.includes('CanvasText') || line.includes('Highlight');
}

function hasVisualLiteral(line) {
  return /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/u.test(line);
}

function addFinding(findings, category, message, line, lineNumber, file, tag, scope) {
  findings.push({
    schema: ENTERPRISE_COMPONENT_STYLE_AUDIT_FINDING_SCHEMA,
    category,
    message,
    suggestion: CATEGORY_SUGGESTIONS[category] || 'Review this finding against the Enterprise Component Hardening rules.',
    file,
    line: lineNumber,
    tag,
    scope,
    excerpt: line.trim().slice(0, 180)
  });
}

function detectLineFindings({ line, lineNumber = 1, file = '<inline>', tag = null, scope = 'source' }) {
  const findings = [];
  const text = String(line || '');
  const lower = text.toLowerCase();
  const allowedFallback = isAllowedFallbackLine(text);

  if (hasVisualLiteral(text) && !allowedFallback) {
    addFinding(findings, text.includes('background') || text.includes('surface') ? 'style.surface.literal' : 'style.color.literal', 'direct color/surface literal without public fallback', text, lineNumber, file, tag, scope);
  }
  if (/border-radius\s*:\s*[^;]*(px|rem|em|%)\b/u.test(text) && !allowedFallback) {
    addFinding(findings, 'style.radius.literal', 'direct border-radius literal without token', text, lineNumber, file, tag, scope);
  }
  if (/box-shadow\s*:\s*[^;]+/u.test(text) && !allowedFallback && !lower.includes('none')) {
    addFinding(findings, 'style.shadow.literal', 'direct box-shadow literal without token', text, lineNumber, file, tag, scope);
  }
  if (/(padding|margin|gap)\s*:\s*[^;]*(px|rem|em)\b/u.test(text) && !allowedFallback) {
    addFinding(findings, 'style.spacing.literal', 'direct spacing literal without token', text, lineNumber, file, tag, scope);
  }
  if (/font-family\s*:\s*[^;]+/u.test(text) && !allowedFallback) {
    addFinding(findings, 'style.typography.literal', 'direct font-family literal without token', text, lineNumber, file, tag, scope);
  }
  if (/z-index\s*:\s*\d+/u.test(text) && !allowedFallback) {
    addFinding(findings, 'style.z-index.literal', 'direct z-index literal without token', text, lineNumber, file, tag, scope);
  }
  if (/(&times;|&#9776;|&#10003;|&#9888;|>\s*[Xx]\s*<|>\s*[-+]\s*<|\u2630|\u2713|\u26a0)/u.test(text) || /innerHTML\s*=.*(&times;|\u2630|\u2713|\u26a0)/u.test(text)) {
    addFinding(findings, 'control.text-glyph', 'visible text glyph used as control graphic', text, lineNumber, file, tag, scope);
  }

  return findings;
}

function classifyScope(relativePath) {
  if (relativePath.startsWith('components/') || relativePath.startsWith('src/components/')) return 'source';
  if (relativePath.startsWith('docs/')) return 'docs';
  if (relativePath.startsWith('tests/')) return 'fixture';
  return 'other';
}

function isKnownResidual(finding) {
  if (KNOWN_RESIDUAL_FILES.includes(finding.file)) return true;
  if (finding.scope === 'docs' || finding.scope === 'fixture') return true;
  if (finding.category === 'theme.missing-forced-colors' || finding.category === 'theme.missing-reduced-motion') return true;
  return false;
}

function isBlockingFinding(finding) {
  if (!finding || finding.knownResidual) return false;
  if (!isP0Tag(finding.tag)) return false;
  return [
    'style.color.literal',
    'style.surface.literal',
    'style.radius.literal',
    'style.shadow.literal',
    'style.spacing.literal',
    'style.typography.literal',
    'style.z-index.literal',
    'control.text-glyph',
    'control.missing-icon-part'
  ].includes(finding.category);
}

function scanFile(rootDir, relativePath, pathTagMap) {
  const absolutePath = path.join(rootDir, relativePath);
  const text = fs.readFileSync(absolutePath, 'utf8');
  const lines = text.split(/\r?\n/u);
  const tag = resolveTagForFile(relativePath, pathTagMap);
  const scope = classifyScope(relativePath);
  const findings = [];

  lines.forEach((line, index) => {
    findings.push(...detectLineFindings({
      line,
      lineNumber: index + 1,
      file: relativePath,
      tag,
      scope
    }));
  });

  if (scope === 'source' && text.includes('customElements.define')) {
    if (!text.includes('forced-colors')) {
      addFinding(findings, 'theme.missing-forced-colors', 'component source does not declare forced-colors handling', relativePath, 1, relativePath, tag, scope);
    }
    if (!text.includes('prefers-reduced-motion')) {
      addFinding(findings, 'theme.missing-reduced-motion', 'component source does not declare reduced-motion handling', relativePath, 1, relativePath, tag, scope);
    }
    if (/(close|dismiss|menu|trigger)/iu.test(text) && !text.includes('part="icon"') && !text.includes('part="trigger-icon"') && !text.includes('part="close icon"')) {
      addFinding(findings, 'control.missing-icon-part', 'interactive control surface may be missing an icon part', relativePath, 1, relativePath, tag, scope);
    }
  }

  return findings.map((finding) => {
    const knownResidual = isKnownResidual(finding);
    const normalized = {
      ...finding,
      priority: isP0Tag(finding.tag) ? 'P0' : 'P1/P2',
      knownResidual
    };
    return {
      ...normalized,
      blocking: isBlockingFinding(normalized)
    };
  });
}

function summarizeFindings(findings) {
  return findings.reduce((summary, finding) => {
    summary.total += 1;
    summary.byCategory[finding.category] = (summary.byCategory[finding.category] || 0) + 1;
    summary.byScope[finding.scope] = (summary.byScope[finding.scope] || 0) + 1;
    if (finding.knownResidual) summary.knownResiduals += 1;
    if (finding.blocking) {
      summary.blocking += 1;
      summary.blockingFiles.push(finding.file);
    }
    return summary;
  }, {
    total: 0,
    byCategory: {},
    byScope: {},
    knownResiduals: 0,
    blocking: 0,
    blockingFiles: []
  });
}

function createEnterpriseComponentStyleAuditReport(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const pathTagMap = createPathTagMap(rootDir);
  const files = (options.files && options.files.length ? options.files : SCAN_ROOTS.flatMap((root) => walkFiles(rootDir, root)))
    .map(normalizePath)
    .filter((file) => SCAN_EXTENSIONS.includes(path.extname(file)));
  const findings = files.flatMap((file) => scanFile(rootDir, file, pathTagMap));
  const summary = summarizeFindings(findings);

  return {
    schema: ENTERPRISE_COMPONENT_STYLE_AUDIT_SCHEMA,
    reportSchema: ENTERPRISE_COMPONENT_STYLE_AUDIT_REPORT_SCHEMA,
    findingSchema: ENTERPRISE_COMPONENT_STYLE_AUDIT_FINDING_SCHEMA,
    workpackage: ENTERPRISE_COMPONENT_STYLE_AUDIT_WORKPACKAGE,
    generatedAt: options.generatedAt || 'static-local',
    localGate: ENTERPRISE_COMPONENT_STYLE_AUDIT_LOCAL_GATE,
    scanRoots: SCAN_ROOTS.slice(),
    categories: AUDIT_CATEGORIES.slice(),
    p0Components: P0_COMPONENTS.slice(),
    baselineMode: 'known-residual-file-baseline',
    residualPolicy: {
      knownResidualFiles: KNOWN_RESIDUAL_FILES.slice(),
      newP0FindingsBlock: true,
      docsAndFixturesReportOnly: true
    },
    files,
    findings,
    summary,
    ok: summary.blocking === 0
  };
}

function validateEnterpriseComponentStyleAuditReport(report = {}) {
  const errors = [];
  if (report.schema !== ENTERPRISE_COMPONENT_STYLE_AUDIT_SCHEMA) errors.push(`schema must be ${ENTERPRISE_COMPONENT_STYLE_AUDIT_SCHEMA}`);
  if (report.reportSchema !== ENTERPRISE_COMPONENT_STYLE_AUDIT_REPORT_SCHEMA) errors.push(`reportSchema must be ${ENTERPRISE_COMPONENT_STYLE_AUDIT_REPORT_SCHEMA}`);
  if (report.findingSchema !== ENTERPRISE_COMPONENT_STYLE_AUDIT_FINDING_SCHEMA) errors.push(`findingSchema must be ${ENTERPRISE_COMPONENT_STYLE_AUDIT_FINDING_SCHEMA}`);
  if (report.workpackage !== ENTERPRISE_COMPONENT_STYLE_AUDIT_WORKPACKAGE) errors.push(`workpackage must be ${ENTERPRISE_COMPONENT_STYLE_AUDIT_WORKPACKAGE}`);
  if (!Array.isArray(report.categories) || !AUDIT_CATEGORIES.every((category) => report.categories.includes(category))) errors.push('report categories must include every audit category');
  if (!Array.isArray(report.scanRoots) || !SCAN_ROOTS.every((root) => report.scanRoots.includes(root))) errors.push('report scanRoots must include the planned scan roots');
  if (!report.residualPolicy || report.residualPolicy.newP0FindingsBlock !== true) errors.push('residualPolicy.newP0FindingsBlock must be true');
  if (!report.summary || typeof report.summary.blocking !== 'number') errors.push('summary.blocking must be numeric');
  if (!Array.isArray(report.findings)) errors.push('findings must be an array');
  return {
    schema: ENTERPRISE_COMPONENT_STYLE_AUDIT_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  AUDIT_CATEGORIES,
  CATEGORY_SUGGESTIONS,
  ENTERPRISE_COMPONENT_STYLE_AUDIT_FINDING_SCHEMA,
  ENTERPRISE_COMPONENT_STYLE_AUDIT_LOCAL_GATE,
  ENTERPRISE_COMPONENT_STYLE_AUDIT_REPORT_SCHEMA,
  ENTERPRISE_COMPONENT_STYLE_AUDIT_SCHEMA,
  ENTERPRISE_COMPONENT_STYLE_AUDIT_WORKPACKAGE,
  KNOWN_RESIDUAL_FILES,
  P0_COMPONENTS,
  SCAN_EXTENSIONS,
  SCAN_ROOTS,
  createEnterpriseComponentStyleAuditReport,
  detectLineFindings,
  isBlockingFinding,
  validateEnterpriseComponentStyleAuditReport
};
