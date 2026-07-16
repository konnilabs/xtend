'use strict';

const XTEND_MATERIAL_PERFORMANCE_REPORT_SCHEMA = 'xtend.material.performance-report.v1';
const XTEND_MATERIAL_QUALITY_POLICY_SCHEMA = 'xtend.material.quality-policy.v1';

const XTEND_MATERIAL_BUDGETS = Object.freeze({
  css: Object.freeze({ rawBytes: 16384, gzipBytes: 4096 }),
  build: Object.freeze({ coldMs: 1500, incrementalMs: 500 }),
  runtime: Object.freeze({ tailwindBytes: 0 }),
  unusedRecipeRatio: Object.freeze({ 'utility-app': 0.82, 'enterprise-workspace': 0.55 })
});

const MONKEYPATCH_RULES = Object.freeze([
  Object.freeze({ id: 'prototype-mutation', pattern: '(?:HTMLElement|Element|Node|CustomElementRegistry|CSSStyleSheet)\\.prototype(?:\\.[a-zA-Z_$][\\w$]*|\\[[^\\]]+\\])?\\s*=', message: 'Platform and component prototypes are immutable XTend boundaries.' }),
  Object.freeze({ id: 'registry-replacement', pattern: 'customElements\\.(?:define|upgrade|whenDefined)\\s*=', message: 'The CustomElementRegistry API must not be replaced.' }),
  Object.freeze({ id: 'private-shadow-access', pattern: '\\.shadowRoot\\b', message: 'Private shadow roots are not a Material integration seam.' }),
  Object.freeze({ id: 'unsafe-dom-sink', pattern: '(?:\\.innerHTML\\s*=|\\.outerHTML\\s*=|\\.insertAdjacentHTML\\s*\\(|document\\.write\\s*\\()', message: 'Material code must use public declarative or component-owned DOM contracts.' }),
  Object.freeze({ id: 'global-style-injection', pattern: 'document\\.(?:head|documentElement)\\.append(?:Child)?\\s*\\([^)]*(?:style|link)', message: 'Global runtime style injection bypasses the Maraca CSS provider lifecycle.' })
]);

function createXtendMaterialQualityPolicy() {
  return {
    schema: XTEND_MATERIAL_QUALITY_POLICY_SCHEMA,
    status: 'blocking',
    budgets: XTEND_MATERIAL_BUDGETS,
    runtimeBoundary: 'css-and-metadata-only',
    authoringBoundary: 'xtm-material-classes-only',
    mutationBoundary: 'public-contracts-only',
    monkeypatchingAllowed: false,
    browserTailwindRuntimeAllowed: false,
    privateShadowRootAccessAllowed: false,
    automaticSourceDiscoveryAllowed: false,
    networkBuildSourcesAllowed: false,
    rules: MONKEYPATCH_RULES.map((rule) => ({ id: rule.id, message: rule.message }))
  };
}

function auditXtendMaterialMonkeypatching(sources = []) {
  const findings = [];
  (Array.isArray(sources) ? sources : []).forEach((source) => {
    const content = String(source && source.content || '');
    MONKEYPATCH_RULES.forEach((rule) => {
      const match = new RegExp(rule.pattern, 'u').exec(content);
      if (match) findings.push({
        code: `xtend.material.monkeypatch.${rule.id}`,
        severity: 'error',
        path: String(source.path || '<inline>'),
        offset: match.index,
        evidence: match[0],
        message: rule.message
      });
    });
    if (source.runtime === true && /(?:require\s*\(\s*['"](?:tailwindcss|@tailwindcss\/node)|from\s+['"](?:tailwindcss|@tailwindcss\/node))/u.test(content)) {
      findings.push({
        code: 'xtend.material.monkeypatch.tailwind-runtime-import',
        severity: 'error',
        path: String(source.path || '<inline>'),
        offset: 0,
        evidence: 'tailwind runtime import',
        message: 'Tailwind is build-time-only and must not enter a browser runtime.'
      });
    }
  });
  return {
    schema: 'xtend.material.monkeypatch-audit.v1',
    ok: findings.length === 0,
    status: findings.length === 0 ? 'passed' : 'blocked',
    sourceCount: Array.isArray(sources) ? sources.length : 0,
    findings
  };
}

function validateXtendMaterialPerformanceReport(report = {}) {
  const errors = [];
  if (report.schema !== XTEND_MATERIAL_PERFORMANCE_REPORT_SCHEMA) errors.push('invalid performance report schema');
  if (!Array.isArray(report.referenceApps) || report.referenceApps.length !== 2) errors.push('two reference apps are required');
  (report.referenceApps || []).forEach((app) => {
    if (!app.deterministic) errors.push(`${app.id}: build output is not deterministic`);
    if (app.css.rawBytes > XTEND_MATERIAL_BUDGETS.css.rawBytes) errors.push(`${app.id}: raw CSS budget exceeded`);
    if (app.css.gzipBytes > XTEND_MATERIAL_BUDGETS.css.gzipBytes) errors.push(`${app.id}: gzip CSS budget exceeded`);
    if (app.build.coldMs > XTEND_MATERIAL_BUDGETS.build.coldMs) errors.push(`${app.id}: cold build budget exceeded`);
    if (app.build.incrementalMs > XTEND_MATERIAL_BUDGETS.build.incrementalMs) errors.push(`${app.id}: incremental build budget exceeded`);
    if (app.inventory.unusedRecipeRatio > XTEND_MATERIAL_BUDGETS.unusedRecipeRatio[app.id]) errors.push(`${app.id}: unused recipe ratio exceeded`);
  });
  if (!report.runtime || report.runtime.tailwindBytes !== 0) errors.push('Tailwind runtime bytes must remain zero');
  if (!report.nativeProviderExit || report.nativeProviderExit.ok !== true) errors.push('native provider exit test must pass');
  if (!report.supplyChain || report.supplyChain.ok !== true) errors.push('supply-chain evidence must pass');
  if (!report.packageDryRun || report.packageDryRun.ok !== true) errors.push('Material package dry run must pass');
  if (!report.cleanup || report.cleanup.ok !== true) errors.push('toolchain cleanup must pass');
  if (!report.monkeypatchAudit || report.monkeypatchAudit.ok !== true) errors.push('anti-monkeypatch audit must pass');
  return { schema: 'xtend.material.performance-validation.v1', ok: errors.length === 0, status: errors.length === 0 ? 'passed' : 'blocked', errors };
}

module.exports = {
  MONKEYPATCH_RULES,
  XTEND_MATERIAL_BUDGETS,
  XTEND_MATERIAL_PERFORMANCE_REPORT_SCHEMA,
  XTEND_MATERIAL_QUALITY_POLICY_SCHEMA,
  auditXtendMaterialMonkeypatching,
  createXtendMaterialQualityPolicy,
  validateXtendMaterialPerformanceReport
};
