'use strict';

// Declarative authoring contracts. The compiler interprets these records; they
// never contain callbacks or execute template expressions.
const RMTX_OPERATOR_PROFILE_API_VERSION = '1.0.0';
const RMTX_OPERATOR_PROFILE_SCHEMA = 'xtend.rmtx.operator-profile.v1';
const attribute = (kind, required = false, extra = {}) => ({ kind, required, ...extra });
const operator = (astType, attributes, children = []) => ({ astType, attributes, children });
const baseOperators = {
  Program: operator('RmtTemplateDeclaration', { id: attribute('symbol', true) }, ['State', 'Action', 'Portal', 'Surface']),
  State: operator('RmtStateDeclaration', {
    id: attribute('symbol', true), type: attribute('string', true),
    initial: attribute('json-literal', true, { expressionContext: 'initial' }), preserve: attribute('boolean')
  }),
  Action: operator('RmtActionDeclaration', { id: attribute('symbol', true) }, ['Input', 'Reduce']),
  Input: operator('RmtActionInputClause', { name: attribute('symbol', true), type: attribute('string', true) }),
  Reduce: operator('RmtReducerStatement', {
    state: attribute('symbol', true), path: attribute('symbol'),
    value: attribute('reducer-value', true, { expressionContext: 'reduce' })
  }),
  Portal: operator('RmtPortalDeclaration', { id: attribute('symbol', true), root: attribute('string'), layer: attribute('string') }),
  Surface: operator('RmtSurfaceDeclaration', {
    id: attribute('symbol', true), kind: attribute('string'), component: attribute('string'), portal: attribute('symbol')
  }, ['Lane']),
  Lane: operator('RmtLaneDeclaration', { name: attribute('symbol', true) }, ['Mount']),
  Mount: operator('RmtLifecycleStatement', { target: attribute('symbol', true) })
};
const limits = { sourceUtf8Bytes: 1024 * 1024, literalDepth: 64, operatorDepth: 64, expressionDepth: 64, generatedNodes: 50000 };
const baseSemantics = {
  sourceExecution: false,
  importsExecuted: false,
  backendInput: 'validated-classic-ast',
  sourceModule: 'one-default-program-export',
  operatorIdentity: 'canonical-authoring-import-binding',
  unknownAttributes: 'reject',
  unknownOperators: 'reject',
  attributeSpreads: false,
  operatorTypeArguments: false,
  nativeUIChildren: false,
  prototypePathSegments: 'reject',
  literalReferenceDistinction: true
};
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function profile(version, imports, operators, expressionContexts, semantics = {}) {
  return freeze({
    schema: RMTX_OPERATOR_PROFILE_SCHEMA, apiVersion: RMTX_OPERATOR_PROFILE_API_VERSION,
    syntaxVersion: version, sourceProfile: { syntax: 'rmtx', version }, imports, operators,
    expressionContexts, limits: { ...limits }, semantics: { ...baseSemantics, ...semantics },
    reads: {
      tracking: 'static-reference-paths', allSyntacticBranches: true,
      symbolResolution: 'longest-declared-prefix', runtimeTracking: false,
      runtimeSubscriptionsChanged: false
    }
  });
}
const initial = { literals: 'finite-acyclic-json', objectFields: 'explicit-static-only', prototypeFields: 'reject' };
const v1 = profile('1.0.0', ['RMT', 'model', 'input'], baseOperators, {
  initial,
  reduce: { literals: 'json-scalars', roots: ['model', 'input'], paths: 'direct-property-only', computedPaths: false, optionalPaths: false }
});
const v2 = profile('2.0.0', ['RMT', 'model', 'input', 'selectors', 'item', 'params', 'contains'], {
  ...baseOperators,
  Program: { ...baseOperators.Program, children: [...baseOperators.Program.children, 'Selector'] },
  Selector: {
    ...operator('RmtSelectorDeclaration', {
      id: attribute('symbol', true), from: attribute('model-or-selector-path', true, { expressionContext: 'selector-source' })
    }, ['Where', 'Find', 'Sort', 'Output']),
    childCardinality: { Where: { min: 0, max: null }, Find: { min: 0, max: 1 }, Sort: { min: 0, max: 1 }, Output: { min: 0, max: 1 } }
  },
  Where: operator('RmtSelectorWhereClause', { test: attribute('boolean-predicate', true, { expressionContext: 'predicate' }) }),
  Find: operator('RmtSelectorFindClause', { test: attribute('boolean-predicate', true, { expressionContext: 'predicate' }) }),
  Sort: operator('RmtSelectorSortClause', {
    by: attribute('item-path', true, { expressionContext: 'sort-path' }),
    direction: attribute('enum', false, { values: ['asc', 'desc'], default: 'asc' })
  }),
  Output: operator('RmtSelectorOutputClause', { type: attribute('string', true) })
}, {
  initial,
  reduce: { literals: 'json-scalars', roots: ['model', 'input', 'selectors'], paths: 'direct-property-only', computedPaths: false, optionalPaths: false },
  'selector-source': { roots: ['model', 'selectors'], paths: 'direct-property-only', wholeDeclaredSymbolOnly: true },
  'sort-path': { roots: ['item'], paths: 'direct-property-only', fieldRequired: true },
  predicate: {
    result: 'boolean', literals: ['true', 'false'], scalarOperands: 'json-scalars-or-direct-paths',
    roots: ['model', 'selectors', 'item', 'params'],
    equality: { '===': '==', '!==': '!=' }, equalitySemantics: 'strict',
    comparisons: ['<', '<=', '>', '>='], comparisonSemantics: 'existing-classic-ordering',
    logical: ['&&', '||'], logicalOperands: 'boolean-predicates',
    negation: { operator: '!', requiresParenthesizedPredicate: true },
    calls: { contains: { binding: 'contains', arguments: 2, operands: 'json-scalars-or-direct-paths', semantics: 'classic-string-substring', nullOperand: 'empty-string' } },
    barePathTruthiness: false, scalarTruthiness: false, looseEquality: false,
    computedPaths: false, optionalPaths: false, methodCalls: false
  }
}, {
  selector: {
    executionOrder: ['where', 'find', 'sort'], sourceClauseOrderIndependent: true,
    sort: { comparison: 'string-locale-compare', copiesSource: true, numeric: false },
    output: { role: 'metadata-only', runtimeValueValidation: false },
    parameters: { forwardedToDependencies: false }
  }
});
const profiles = freeze({ '1.0.0': v1, '2.0.0': v2 });

/** Return an immutable profile. Mutating a separately cloned copy cannot alter it. */
function getRmtxOperatorProfile(version = '1.0.0') {
  if (typeof version !== 'string' || !Object.hasOwn(profiles, version)) {
    throw Object.assign(new TypeError('Unsupported RMTX operator profile version.'), { code: 'rmtx.operator-profile.unsupported' });
  }
  return profiles[version];
}
module.exports = { RMTX_OPERATOR_PROFILE_API_VERSION, RMTX_OPERATOR_PROFILE_SCHEMA, getRmtxOperatorProfile };
