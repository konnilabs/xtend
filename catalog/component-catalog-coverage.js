const fs = require('fs');
const path = require('path');

const COMPONENT_CATALOG_COVERAGE_SCHEMA = 'xtend.catalog.component-coverage-matrix.v1';
const COMPONENT_CATALOG_ENTRY_SCHEMA = 'xtend.catalog.component-coverage-entry.v1';
const COMPONENT_CATALOG_GATE_SCHEMA = 'xtend.catalog.component-coverage-gate.v1';

const COVERAGE_DIMENSIONS = Object.freeze([
  'source',
  'docs',
  'componentSuite',
  'fixture',
  'types',
  'a11y',
  'performance'
]);

const EXPECTED_PROFILES_BY_TAG = Object.freeze({
  'xstate': ['stateful', 'infrastructure'],
  'x-theme': ['theme', 'stateful'],
  'x-button': ['interactive'],
  'x-icon': ['display', 'iconography'],
  'x-spinner': ['feedback', 'display'],
  'x-tabs': ['interactive', 'routing'],
  'x-menu': ['interactive'],
  'x-footer': ['display'],
  'x-alert': ['feedback', 'stateful'],
  'x-toast': ['feedback'],
  'x-dialog': ['overlay'],
  'x-lightbox': ['overlay', 'media'],
  'x-masonry': ['display'],
  'x-code': ['display'],
  'x-header': ['display'],
  'x-hero': ['display'],
  'x-type': ['display'],
  'x-input': ['form'],
  'x-select': ['form', 'interactive', 'stateful'],
  'x-checkbox': ['form', 'interactive'],
  'x-toggle': ['form', 'interactive', 'stateful'],
  'x-radio': ['form', 'interactive'],
  'x-rmt-lifecycle-demo-build': ['display', 'stateful'],
  'x-textarea': ['form', 'stateful'],
  'x-status': ['feedback', 'stateful'],
  'x-progress': ['feedback', 'stateful'],
  'x-tooltip': ['overlay', 'feedback'],
  'x-popover': ['overlay', 'interactive'],
  'x-drawer': ['overlay', 'routing'],
  'x-surface-manager': ['overlay', 'stateful'],
  'x-surface-portal': ['overlay', 'stateful'],
  'x-surface-region': ['display', 'stateful'],
  'x-surface-window': ['overlay', 'interactive'],
  'x-side-panel': ['overlay', 'stateful', 'interactive'],
  'x-form': ['form', 'stateful'],
  'x-calendar': ['form', 'interactive'],
  'x-summary': ['display', 'stateful'],
  'x-section': ['display'],
  'x-cards': ['display'],
  'x-player': ['media', 'interactive'],
  'x-writer': ['form', 'stateful'],
  'x-router': ['routing'],
  'x-link': ['routing', 'interactive'],
  'x-utils': ['utility'],
  'xtend-i18n': ['infrastructure'],
  'x-modal': ['overlay']
});

const PROFILE_PRIORITY = Object.freeze({
  routing: 'P0',
  form: 'P0',
  overlay: 'P0',
  feedback: 'P1',
  interactive: 'P1',
  media: 'P1',
  theme: 'P1',
  stateful: 'P1',
  display: 'P2',
  infrastructure: 'P2',
  utility: 'P2',
  iconography: 'P2'
});

const STATUS_LABELS = Object.freeze({
  enterpriseReady: 'enterprise-ready',
  typedContractGated: 'typed-contract-gated',
  contractGated: 'contract-gated',
  documented: 'documented',
  sourceOnly: 'source-only',
  missingSource: 'missing-source'
});

const DOCS_EXEMPT_TAGS = Object.freeze([
  'x-rmt-lifecycle-demo-build'
]);

function resolveRootDir(rootDir) {
  return rootDir || path.resolve(__dirname, '..');
}

function fileExists(rootDir, relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function readTextIfExists(rootDir, relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : '';
}

function readJson(rootDir, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), 'utf8'));
}

function normalizeManifestSource(source) {
  return String(source || '').replace(/^\.\//, '');
}

function basenameWithoutExtension(relativePath) {
  return path.basename(relativePath, path.extname(relativePath));
}

function createExpectedPaths(tag, manifestSource) {
  const normalizedSource = normalizeManifestSource(manifestSource);
  const basename = basenameWithoutExtension(normalizedSource);

  return {
    source: `components/${normalizedSource}`,
    docs: `docs/de/components/${basename}.md`,
    docsEn: `docs/en/components/${basename}.md`,
    componentSuite: `tests/components/${basename}.component_suite.js`,
    fixture: `tests/components/fixtures/${basename}.component.html`,
    types: `components/${basename}.d.ts`
  };
}

function hasPublicDocs(rootDir, paths, tag) {
  if (DOCS_EXEMPT_TAGS.includes(tag)) return true;
  return fileExists(rootDir, paths.docs) && fileExists(rootDir, paths.docsEn);
}

function resolveProfiles(tag) {
  return EXPECTED_PROFILES_BY_TAG[tag] || ['display'];
}

function resolvePriority(profiles) {
  const ordered = ['P0', 'P1', 'P2'];
  const priorities = profiles.map((profile) => PROFILE_PRIORITY[profile] || 'P2');
  return ordered.find((priority) => priorities.includes(priority)) || 'P2';
}

function hasA11yCoverage(sourceText) {
  return [
    'xtendScaffoldA11yProfile',
    'xtendScreenreaderSignals',
    'xtendMotionContrastPolicy',
    'aria-',
    'role',
    'tabindex'
  ].some((pattern) => sourceText.includes(pattern));
}

function hasPerformanceCoverage(sourceText) {
  return [
    'xtendScaffoldPerformanceProfile',
    'xtend.performance.component-profile.v1',
    'xtendScaffoldWiring'
  ].some((pattern) => sourceText.includes(pattern));
}

function classifyStatus(coverage) {
  if (!coverage.source) return STATUS_LABELS.missingSource;
  if (COVERAGE_DIMENSIONS.every((dimension) => coverage[dimension] === true)) {
    return STATUS_LABELS.enterpriseReady;
  }
  if (coverage.source && coverage.docs && coverage.componentSuite && coverage.fixture && coverage.types && coverage.a11y) {
    return STATUS_LABELS.typedContractGated;
  }
  if (coverage.source && coverage.docs && coverage.componentSuite && coverage.fixture) {
    return STATUS_LABELS.contractGated;
  }
  if (coverage.source && coverage.docs) return STATUS_LABELS.documented;
  return STATUS_LABELS.sourceOnly;
}

function resolveNextAction(coverage, context = {}) {
  if (!coverage.source) return 'ER-WP-32: Manifest- oder Source-Pfad korrigieren';
  if (!coverage.docs) return 'ER-WP-32: Docs-/Naming-Konvention klaeren';
  if (!coverage.componentSuite || !coverage.fixture) {
    if (context.priority === 'P2' || context.customElement === false) {
      return 'ER-WP-35: Long-Tail-Regression und Browser-Smokes priorisieren';
    }
    return 'ER-WP-33: Component-Level-Suite und Fixture nachziehen';
  }
  if (!coverage.types) return 'ER-WP-34: Public Types und Event Contracts nachziehen';
  if (!coverage.a11y) return 'ER-WP-35: A11y-Profil und Browser-Regression priorisieren';
  if (!coverage.performance) return 'ER-WP-35: Performance-Profil und Browser-Regression priorisieren';
  return 'release-candidate: Coverage halten und CI-Gates produktisieren';
}

function createCoverageEntry(rootDir, tag, manifestSource) {
  const paths = createExpectedPaths(tag, manifestSource);
  const sourceText = readTextIfExists(rootDir, paths.source);
  const coverage = {
    source: fileExists(rootDir, paths.source),
    docs: hasPublicDocs(rootDir, paths, tag),
    componentSuite: fileExists(rootDir, paths.componentSuite),
    fixture: fileExists(rootDir, paths.fixture),
    types: fileExists(rootDir, paths.types),
    a11y: hasA11yCoverage(sourceText),
    performance: hasPerformanceCoverage(sourceText)
  };
  const profiles = resolveProfiles(tag);
  const priority = resolvePriority(profiles);
  const customElement = new RegExp(`customElements\\.define\\(\\s*['"]${tag.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}['"]`, 'u').test(sourceText);
  const status = classifyStatus(coverage);

  return {
    schema: COMPONENT_CATALOG_ENTRY_SCHEMA,
    tag,
    manifestSource,
    profiles,
    priority,
    status,
    paths,
    docsRequired: !DOCS_EXEMPT_TAGS.includes(tag),
    coverage,
    coverageScore: COVERAGE_DIMENSIONS.filter((dimension) => coverage[dimension]).length,
    coverageMax: COVERAGE_DIMENSIONS.length,
    customElement,
    declaresManifestTag: sourceText.includes(`'${tag}'`) || sourceText.includes(`"${tag}"`),
    screenreaderSignals: sourceText.includes('xtendScreenreaderSignals'),
    motionContrastPolicy: sourceText.includes('xtendMotionContrastPolicy'),
    nextAction: resolveNextAction(coverage, { customElement, priority })
  };
}

function summarizeEntries(entries) {
  const byStatus = {};
  const byPriority = {};
  const missingByDimension = {};

  entries.forEach((entry) => {
    byStatus[entry.status] = (byStatus[entry.status] || 0) + 1;
    byPriority[entry.priority] = (byPriority[entry.priority] || 0) + 1;
    COVERAGE_DIMENSIONS.forEach((dimension) => {
      if (!entry.coverage[dimension]) {
        if (!missingByDimension[dimension]) missingByDimension[dimension] = [];
        missingByDimension[dimension].push(entry.tag);
      }
    });
  });

  return {
    manifestEntries: entries.length,
    byStatus,
    byPriority,
    byDimension: COVERAGE_DIMENSIONS.reduce((accumulator, dimension) => {
      const covered = entries.filter((entry) => entry.coverage[dimension]).length;
      accumulator[dimension] = {
        covered,
        missing: entries.length - covered,
        percent: entries.length === 0 ? 0 : Math.round((covered / entries.length) * 100)
      };
      return accumulator;
    }, {}),
    missingByDimension
  };
}

function createComponentCatalogCoverageReport(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const manifestPath = options.manifestPath || 'components/manifest.json';
  const manifest = readJson(rootDir, manifestPath);
  const entries = Object.entries(manifest).map(([tag, source]) => createCoverageEntry(rootDir, tag, source));
  const summary = summarizeEntries(entries);
  const warnings = [];

  Object.entries(summary.missingByDimension).forEach(([dimension, tags]) => {
    if (tags.length > 0) {
      warnings.push({
        dimension,
        count: tags.length,
        tags,
        message: `${dimension} coverage missing for ${tags.length} manifest entries`
      });
    }
  });

  return {
    schema: COMPONENT_CATALOG_COVERAGE_SCHEMA,
    generatedAt: options.generatedAt || 'static-local',
    manifestPath,
    dimensions: COVERAGE_DIMENSIONS.slice(),
    statusLabels: Object.assign({}, STATUS_LABELS),
    entries,
    summary,
    warnings,
    gates: {
      local: 'node scripts/run_xtend_tests.js catalog-coverage --json',
      packageScript: 'npm run test:catalog-coverage',
      references: 'node scripts/run_xtend_tests.js references --json'
    },
    handoff: {
      naming: 'ER-WP-32',
      componentSuites: 'ER-WP-33',
      types: 'ER-WP-34',
      visualRegression: 'ER-WP-35'
    }
  };
}

function validateComponentCatalogCoverageReport(report) {
  const errors = [];
  if (!report || report.schema !== COMPONENT_CATALOG_COVERAGE_SCHEMA) {
    errors.push('report schema must be xtend.catalog.component-coverage-matrix.v1');
  }
  if (!report || !Array.isArray(report.entries) || report.entries.length === 0) {
    errors.push('report entries must be a non-empty array');
  }
  (report && report.entries || []).forEach((entry) => {
    if (entry.schema !== COMPONENT_CATALOG_ENTRY_SCHEMA) {
      errors.push(`${entry.tag || '<unknown>'}: entry schema must be xtend.catalog.component-coverage-entry.v1`);
    }
    if (!entry.tag || typeof entry.tag !== 'string') {
      errors.push('entry tag must be a non-empty string');
    }
    if (!entry.status || typeof entry.status !== 'string') {
      errors.push(`${entry.tag}: entry status must be present`);
    }
    if (!entry.nextAction || typeof entry.nextAction !== 'string') {
      errors.push(`${entry.tag}: nextAction must be present`);
    }
    if (!entry.coverage || entry.coverage.source !== true) {
      errors.push(`${entry.tag}: manifest source must resolve to a local file`);
    }
  });

  return {
    schema: COMPONENT_CATALOG_GATE_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createMarkdownMatrix(report) {
  const rows = [
    '| Tag | Profile | Status | Prio | Docs | Suite | Fixture | Types | A11y | Performance | Next |',
    '|-----|----------|--------|------|------|-------|---------|-------|------|-------------|------|'
  ];

  report.entries.forEach((entry) => {
    const columns = [
      `\`${entry.tag}\``,
      `\`${entry.profiles.join(', ')}\``,
      `\`${entry.status}\``,
      `\`${entry.priority}\``,
      entry.coverage.docs ? 'yes' : 'no',
      entry.coverage.componentSuite ? 'yes' : 'no',
      entry.coverage.fixture ? 'yes' : 'no',
      entry.coverage.types ? 'yes' : 'no',
      entry.coverage.a11y ? 'yes' : 'no',
      entry.coverage.performance ? 'yes' : 'no',
      entry.nextAction
    ];
    rows.push(`| ${columns.join(' | ')} |`);
  });

  return rows.join('\n');
}

function createComponentCatalogCoverageGate(options = {}) {
  const report = createComponentCatalogCoverageReport(options);
  const validation = validateComponentCatalogCoverageReport(report);
  return {
    schema: COMPONENT_CATALOG_GATE_SCHEMA,
    ok: validation.ok,
    report,
    errors: validation.errors,
    warnings: report.warnings
  };
}

module.exports = {
  COMPONENT_CATALOG_COVERAGE_SCHEMA,
  COMPONENT_CATALOG_ENTRY_SCHEMA,
  COMPONENT_CATALOG_GATE_SCHEMA,
  COVERAGE_DIMENSIONS,
  EXPECTED_PROFILES_BY_TAG,
  STATUS_LABELS,
  createComponentCatalogCoverageGate,
  createComponentCatalogCoverageReport,
  createMarkdownMatrix,
  validateComponentCatalogCoverageReport
};
