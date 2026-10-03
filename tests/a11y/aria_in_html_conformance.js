const CONFORMANCE_SCHEMA = 'xtend.a11y.aria-in-html-conformance.v1';
const REPORT_SCHEMA = 'xtend.a11y.aria-in-html-conformance-report.v1';

const GLOBAL_ARIA_ATTRIBUTES = new Set([
  'aria-atomic',
  'aria-braillelabel',
  'aria-brailleroledescription',
  'aria-busy',
  'aria-controls',
  'aria-current',
  'aria-describedby',
  'aria-description',
  'aria-details',
  'aria-disabled',
  'aria-dropeffect',
  'aria-errormessage',
  'aria-flowto',
  'aria-grabbed',
  'aria-haspopup',
  'aria-hidden',
  'aria-invalid',
  'aria-keyshortcuts',
  'aria-label',
  'aria-labelledby',
  'aria-live',
  'aria-owns',
  'aria-relevant',
  'aria-roledescription'
]);

const NAMING_ATTRIBUTES = new Set(['aria-label', 'aria-labelledby']);

function validateRule(rule, sample) {
  const errors = [];
  const advisories = [];
  const role = sample.role || null;
  const aria = sample.aria && typeof sample.aria === 'object' ? sample.aria : {};
  const context = sample.context && typeof sample.context === 'object' ? sample.context : {};

  if (rule.rolePolicy === 'none' && role) {
    errors.push(`role ${role} is prohibited`);
  }
  if (rule.rolePolicy === 'allowed' && role && !rule.allowedRoles.includes(role)) {
    errors.push(`role ${role} is not allowed`);
  }
  if (role && Array.isArray(rule.notRecommendedRoles) && rule.notRecommendedRoles.includes(role)) {
    advisories.push(`role ${role} is conforming but not recommended`);
  }

  Object.entries(aria).forEach(([name, value]) => {
    const explicitlyAllowed = Array.isArray(rule.allowedAria) && rule.allowedAria.includes(name);
    const globallyAllowed = rule.allowGlobalAria === true && GLOBAL_ARIA_ATTRIBUTES.has(name);
    if (rule.allowAria === false || (!explicitlyAllowed && !globallyAllowed)) {
      errors.push(`${name} is not allowed`);
      return;
    }
    if (rule.allowedAriaValues && Array.isArray(rule.allowedAriaValues[name]) && !rule.allowedAriaValues[name].includes(String(value))) {
      errors.push(`${name}=${value} is not allowed`);
    }
    if (rule.namingProhibited === true && NAMING_ATTRIBUTES.has(name)) {
      errors.push(`${name} is prohibited because naming is prohibited`);
    }
  });

  if (context.hidden === true && Object.prototype.hasOwnProperty.call(aria, 'aria-hidden')) {
    if (context.hiddenUntilFound === true) errors.push('aria-hidden is prohibited with hidden=until-found');
    if (context.focusable === true) errors.push('aria-hidden is prohibited on a focusable hidden element');
    if (sample.element === 'body') errors.push('aria-hidden is prohibited on body');
    if (String(aria['aria-hidden']) === 'true' && !context.hiddenUntilFound && !context.focusable && sample.element !== 'body') {
      advisories.push('aria-hidden=true is conforming but redundant with hidden');
    }
  }

  return {
    schema: REPORT_SCHEMA,
    ruleId: rule.id,
    ok: errors.length === 0,
    errors,
    advisories
  };
}

function validateConformanceCase(matrix, sample) {
  const rule = matrix.rules.find((candidate) => candidate.id === sample.ruleRef);
  if (!rule) {
    return {
      schema: REPORT_SCHEMA,
      ruleId: sample.ruleRef,
      ok: false,
      errors: [`unknown rule ${sample.ruleRef}`],
      advisories: []
    };
  }
  return validateRule(rule, sample);
}

function validateConformanceMatrix(matrix) {
  const errors = [];
  if (!matrix || matrix.schema !== CONFORMANCE_SCHEMA) errors.push('invalid conformance schema');
  if (!matrix || !Array.isArray(matrix.rules) || matrix.rules.length === 0) errors.push('rules are required');
  if (!matrix || !Array.isArray(matrix.cases) || matrix.cases.length === 0) errors.push('cases are required');

  const ruleIds = new Set();
  (matrix.rules || []).forEach((rule) => {
    if (!rule.id || ruleIds.has(rule.id)) errors.push(`duplicate or missing rule id ${rule.id || '<missing>'}`);
    ruleIds.add(rule.id);
  });

  const caseIds = new Set();
  const caseReports = (matrix.cases || []).map((sample) => {
    if (!sample.id || caseIds.has(sample.id)) errors.push(`duplicate or missing case id ${sample.id || '<missing>'}`);
    caseIds.add(sample.id);
    const report = validateConformanceCase(matrix, sample);
    if (report.ok !== sample.expectedValid) errors.push(`${sample.id} expectedValid mismatch`);
    return { id: sample.id, ...report };
  });

  return {
    schema: REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    caseReports
  };
}

module.exports = {
  CONFORMANCE_SCHEMA,
  GLOBAL_ARIA_ATTRIBUTES,
  REPORT_SCHEMA,
  validateConformanceCase,
  validateConformanceMatrix,
  validateRule
};
