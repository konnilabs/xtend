'use strict';

// Declarative authoring contracts. The compiler interprets these records; they
// never contain callbacks or execute template expressions.
const { RMTX_EXTENDED_OPERATOR_RULES, RMTX_EXTENDED_PROGRAM_CHILDREN } = require('./rmtx-operator-coverage');
const RMTX_OPERATOR_PROFILE_API_VERSION = '6.0.0';
const RMTX_OPERATOR_PROFILE_SCHEMA = 'xtend.rmtx.operator-profile.v1';
const RMTX_OPERATOR_PROFILE_SCHEMA_V2 = 'xtend.rmtx.operator-profile.v2';
const RMTX_OPERATOR_PROFILE_SCHEMA_V3 = 'xtend.rmtx.operator-profile.v3';
const RMTX_OPERATOR_PROFILE_SCHEMA_V4 = 'xtend.rmtx.operator-profile.v4';
const RMTX_OPERATOR_PROFILE_SCHEMA_V6 = 'xtend.rmtx.operator-profile.v6';
const RMTX_OPERATOR_PROFILE_SCHEMA_V5 = 'xtend.rmtx.operator-profile.v5';
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
    schema: version === '7.0.0' ? RMTX_OPERATOR_PROFILE_SCHEMA_V6 : version === '6.0.0' ? RMTX_OPERATOR_PROFILE_SCHEMA_V5 : version === '5.0.0' ? RMTX_OPERATOR_PROFILE_SCHEMA_V4 : version === '4.0.0' ? RMTX_OPERATOR_PROFILE_SCHEMA_V3 : version === '3.0.0' ? RMTX_OPERATOR_PROFILE_SCHEMA_V2 : RMTX_OPERATOR_PROFILE_SCHEMA,
    apiVersion: version === '7.0.0' ? RMTX_OPERATOR_PROFILE_API_VERSION : version === '6.0.0' ? '5.0.0' : version === '5.0.0' ? '4.0.0' : version === '4.0.0' ? '3.0.0' : version === '3.0.0' ? '2.0.0' : '1.0.0',
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
const v3 = profile('3.0.0', [...v2.imports], {
  ...v2.operators,
  Program: { ...v2.operators.Program, children: [...v2.operators.Program.children, 'Repeat'] },
  Surface: {
    ...v2.operators.Surface,
    attributes: {
      ...v2.operators.Surface.attributes,
      present: attribute('boolean-model-or-item-path', false, { expressionContext: 'host-presence' })
    },
    children: ['Lane', 'On']
  },
  Repeat: {
    ...operator('RmtxHostRepeatScope', {
      from: attribute('model-or-item-path', true, { expressionContext: 'repeat-source' }),
      keyBy: attribute('item-path', true, { expressionContext: 'repeat-key' })
    }, ['Repeat', 'Surface']),
    lowering: 'host-scope-source-contract'
  },
  On: operator('RmtEventBinding', {
    event: attribute('symbol', true), action: attribute('symbol', true),
    payload: attribute('event-payload-map', true, { expressionContext: 'event-payload' }),
    when: attribute('boolean-condition', false, { expressionContext: 'condition' })
  })
}, {
  ...v2.expressionContexts,
  'event-payload': { kind: 'nonempty-static-field-map', sources: ['detail', 'target'], values: 'direct-path-strings', callbacks: false },
  'repeat-source': {
    roots: ['model', 'item'], rootScope: 'model', nestedScope: 'item',
    paths: 'direct-property-only', fieldRequired: true, computedPaths: false, optionalPaths: false
  },
  'repeat-key': {
    roots: ['item'], paths: 'direct-property-only', fieldRequired: true,
    computedPaths: false, optionalPaths: false
  },
  'host-presence': {
    roots: ['model', 'item'], paths: 'direct-property-only', fieldRequired: true,
    itemRequiresRepeatScope: true, result: 'boolean-model-value', predicates: false,
    barePathTruthiness: false, computedPaths: false, optionalPaths: false
  },
  condition: {
    result: 'boolean', literals: ['true', 'false'], scalarOperands: 'json-scalars-or-direct-model-paths',
    roots: ['model'], equality: { '===': '==', '!==': '!=' }, equalitySemantics: 'strict',
    comparisons: ['<', '<=', '>', '>='], comparisonSemantics: 'existing-classic-ordering',
    logical: ['&&', '||'], logicalOperands: 'boolean-predicates',
    negation: { operator: '!', requiresParenthesizedPredicate: true }, calls: {},
    barePathTruthiness: false, scalarTruthiness: false, looseEquality: false,
    computedPaths: false, optionalPaths: false, methodCalls: false
  }
}, {
  selector: v2.semantics.selector,
  hostScopes: {
    sourceContract: 'xtend.rmtx.host-scopes.v1',
    lowering: 'flattened-static-surfaces-with-host-scope-contract',
    bindingArtifact: 'xtend.xtensions.state-binding-artifact.v3',
    matchingXTensionBindingRequired: true,
    propsAndIntents: 'external-sidecars',
    nativeSurfaceRepeat: false,
    repeatedNativeEventsAndResources: false,
    nativeEventsOnScopedHosts: false,
    key: {
      values: ['nonempty-safe-string', 'nonnegative-safe-integer'],
      typeIdentityPreserved: true, uniqueWithinParent: true,
      ancestryIncludedInAddress: true, indexFallback: false
    },
    presence: { requiredValueType: 'boolean', truthiness: false }
  },
  events: { when: 'runtime-event-condition', target: 'owning-surface-dom-selector',
    inputNames: 'exact-declared-action-inputs', nativePayloadTypeValidation: false, mountWhenSupported: false }
});
const v4 = profile('4.0.0', [...v3.imports, 'result', 'error', 'payload'], {
  ...v3.operators,
  ...RMTX_EXTENDED_OPERATOR_RULES,
  Program: { ...v3.operators.Program, children: [...v3.operators.Program.children, ...RMTX_EXTENDED_PROGRAM_CHILDREN] },
  Action: { ...v3.operators.Action, children: ['Input', 'Status', 'Execution', 'Effect', 'Reduce', 'Recipe', 'Emit', 'ResultHandler'] },
  Input: { ...v3.operators.Input,
    attributes: { ...v3.operators.Input.attributes, optional: attribute('boolean'), nullable: attribute('boolean'), default: attribute('json-literal', false, { expressionContext: 'initial' }) },
    children: ['InputPolicy'] },
  Reduce: { ...v3.operators.Reduce, attributes: { ...v3.operators.Reduce.attributes, value: attribute('primitive-expression', true, { expressionContext: 'action-value' }) } },
  Surface: { ...v3.operators.Surface, children: [...v3.operators.Surface.children, 'SurfaceSource', 'SurfaceBounds', 'SurfacePreserve', 'SurfaceDestroy', 'XTension'] },
  Lane: { ...v3.operators.Lane, attributes: { ...v3.operators.Lane.attributes, weight: attribute('number') },
    children: ['Mount', 'Hydrate', 'Suspend', 'Resume', 'Invalidate', 'Dispose', 'Prewarm', 'Recycle', 'Detach', 'Reattach', 'Stream'] },
  On: { ...v3.operators.On, attributes: { ...v3.operators.On.attributes, preventDefault: attribute('boolean') } },
  XTension: {
    ...operator('RmtxXTensionDeclaration', {
      id: attribute('symbol', true), provider: attribute('string', true), owner: attribute('string', true), lane: attribute('symbol', true),
      props: attribute('projection-object', true, { expressionContext: 'props' }),
      intents: attribute('intent-map', false, { expressionContext: 'intents' })
    }), lowering: 'inline-provider-binding-source-contract'
  }
}, {
  ...v3.expressionContexts,
  reduce: { literals: 'finite-acyclic-json', roots: ['model', 'input', 'selectors', 'result', 'error', 'payload'], paths: 'direct-property-only', computedPaths: false, optionalPaths: false },
  'action-value': { literals: 'finite-acyclic-json', roots: ['model', 'input', 'selectors', 'result', 'error', 'payload'],
    objectFields: 'explicit-static-only', projections: ['object', 'array'], paths: 'direct-property-only', computedPaths: false, optionalPaths: false, calls: false },
  'policy-values': { literals: 'json-scalars', container: 'nonempty-static-array', sourceText: false },
  props: { literals: 'finite-acyclic-json', roots: ['model', 'selectors', 'item'], objectFields: 'explicit-static-only',
    projections: ['object', 'array', 'conditional', 'unary', 'binary'], paths: 'direct-property-only', computedPaths: false, optionalPaths: false,
    calls: false, getters: false, spreads: false, runtimeTracking: false },
  intents: { kind: 'provider-event-to-declared-action', mappings: 'explicit-provider-payload-paths-and-typed-key-positions', callbacks: false }
}, {
  selector: v3.semantics.selector,
  hostScopes: { ...v3.semantics.hostScopes, sourceContract: 'xtend.rmtx.host-scopes.v2', bindingArtifact: 'xtend.xtensions.state-binding-artifact.v4',
    propsAndIntents: 'validated-inline-provider-interface' },
  events: { ...v3.semantics.events, inputNames: 'all-required-and-only-declared-action-inputs', nativePayloadTypeValidation: true, optionalNullableDefaults: true },
  operators: { grammar: 'closed-qualified-operator-tags', astCoverage: '122-classic-nodes-classified', rawAstEscapeHatch: false,
    classicSourceStringEscapeHatch: false, tokenFields: 'generated-from-closed-attributes', lifecycleConditions: false,
    nativeDomRepeat: false, nativeUiChildren: false, imports: 'declarative-classic-source-metadata', sourceModuleGraph: false },
  actions: { values: 'closed-literal-path-object-array-trees', resultHandlers: ['reduce', 'emit', 'overlay'], callbacks: false },
  components: { providerInterface: 'xtend.xtensions.component-interface.v2', declaration: 'XTension', props: 'closed-projection-object',
    acceptedProviderInterfaces: ['xtend.xtensions.component-interface.v1', 'xtend.xtensions.component-interface.v2'],
    intents: 'provider-owned-payload-schema-and-required-action-input-mapping-with-typed-optional-defaults', nativeChildren: false,
    runtimeAuthority: 'validated-provider-interface-through-fabric-kernel' },
  acceptance: { release: 'preparing', nativeUi: false, projectTooling: false, ssrParity: false }
});
const nativeChildren = ['Element', 'Text', 'Repeat', 'When'];
const nativeSurfaceKinds = ['root', 'workspace', 'page', 'card', 'list', 'region', 'overlay-host', 'panel', 'side-panel', 'sidepanel', 'window', 'modal', 'dialog', 'drawer', 'popover', 'tooltip', 'toast', 'lightbox', 'menu'];
const v5 = profile('5.0.0', [...v4.imports], {
  ...v4.operators,
  Surface: { ...v4.operators.Surface, attributes: { ...v4.operators.Surface.attributes, kind: attribute('enum', false, { values: nativeSurfaceKinds, default: 'region' }) }, children: [...v4.operators.Surface.children, 'View'] },
  Repeat: { ...v4.operators.Repeat, children: ['Repeat', 'Surface', 'Element', 'Text', 'When'],
    lowering: 'contextual-host-or-native-repeat', contexts: { host: ['Repeat', 'Surface'], native: nativeChildren } },
  View: { ...operator('RmtxNativeView', {}, nativeChildren), lowering: 'validated-native-view-source-contract' },
  Element: { ...operator('RmtxNativeElement', { tag: attribute('string', true),
    attributes: attribute('native-scalar-map', false, { expressionContext: 'native-value' }),
    properties: attribute('native-scalar-map', false, { expressionContext: 'native-value' }) }, nativeChildren), lowering: 'native-view-element' },
  Text: { ...operator('RmtxNativeText', { value: attribute('native-scalar-projection', true, { expressionContext: 'native-value' }) }), lowering: 'native-view-text' },
  When: { ...operator('RmtxNativeWhen', { test: attribute('native-boolean-projection', true, { expressionContext: 'native-condition' }) }, nativeChildren), lowering: 'native-view-strict-condition' }
}, {
  ...v4.expressionContexts,
  'native-value': { ...v4.expressionContexts.props, result: 'json-scalar', projections: ['conditional', 'unary', 'binary'], objectAndArraySinks: false },
  'native-condition': { ...v4.expressionContexts.props, result: 'strict-boolean', projections: ['conditional', 'unary', 'binary'], objectAndArraySinks: false }
}, {
  ...v4.semantics, nativeUIChildren: true,
  hostScopes: { ...v4.semantics.hostScopes, sourceContract: 'xtend.rmtx.host-scopes.v3', bindingArtifact: 'xtend.xtensions.state-binding-artifact.v5' },
  operators: { ...v4.semantics.operators, nativeDomRepeat: true, nativeUiChildren: true, lifecycleConditions: false },
  nativeViews: { sourceContract: 'xtend.rmtx.native-view.v1', rendererContract: 'xtend.rmt.native-view.v1',
    values: 'closed-scalar-projections', keyIdentity: 'declaration-and-full-typed-parent-key-tuple',
    childrenOnProviderHosts: false, nativeRepeatedEvents: false, unsafeSinks: 'reject', sourceExecution: false,
    surfaceDefaults: { kind: 'region', component: 'div' }, surfaceComponents: 'closed-native-html-only' },
  actions: { ...v4.semantics.actions, subprofile: '4.0.0' },
  acceptance: { release: 'preparing', nativeUi: true, projectTooling: false, ssrParity: false }
});
const v6 = profile('6.0.0', [...v5.imports], {
  ...v5.operators,
  Mount: { ...v5.operators.Mount, attributes: { ...v5.operators.Mount.attributes,
    when: attribute('native-boolean-projection', false, { expressionContext: 'lifecycle-condition' }) } }
}, {
  ...v5.expressionContexts,
  'lifecycle-condition': { ...v5.expressionContexts['native-condition'], roots: ['model', 'selectors'], itemScopes: false }
}, {
  ...v5.semantics,
  operators: { ...v5.semantics.operators, lifecycleConditions: 'owning-static-native-mount-only' },
  nativeViews: { ...v5.semantics.nativeViews, subprofile: '5.0.0' },
  lifecycle: { sourceContract: 'xtend.rmtx.native-lifecycle.v1', plan: 'xtend.rmt.native-lifecycle-plan.v1',
    guard: 'strict-boolean-level-sensitive-content-admission', target: 'owning-static-native-surface',
    controllerAuthority: 'existing-current-active-owner', opensOrRecreatesOwners: false,
    sourceOrPolicy: false, providerOwnedTargets: false }
});
const lifecycleNames = ['Mount', 'Hydrate', 'Suspend', 'Resume', 'Invalidate', 'Dispose', 'Prewarm', 'Recycle', 'Detach', 'Reattach'];
const orchestrationChildren = [...nativeChildren, 'Component'];
const v7 = profile('7.0.0', [...v6.imports], {
  ...v6.operators,
  ...Object.fromEntries(lifecycleNames.map(op => [op, { ...v6.operators[op], attributes: { ...v6.operators[op].attributes,
    when: attribute('native-boolean-projection', false, { expressionContext: 'lifecycle-condition' }) } }])),
  On: {...v6.operators.On,attributes:{...v6.operators.On.attributes,keys:attribute('json-literal',false)}},
  Surface: {...v6.operators.Surface, children: [...new Set([...v6.operators.Surface.children,'Surface','Repeat'])]},
  View: {...v6.operators.View, children: orchestrationChildren},
  Element: {...v6.operators.Element, children: orchestrationChildren},
  When: {...v6.operators.When, children: orchestrationChildren},
  Repeat: {...v6.operators.Repeat, children: [...new Set([...v6.operators.Repeat.children,'Component'])],
    contexts:{host:['Repeat','Surface'],native:orchestrationChildren},lowering:'shared-typed-surface-or-native-element-scopes'},
  Component: {...operator('RmtxNativeComponent', {tag:attribute('string',true),attributes:attribute('native-scalar-map',false,{expressionContext:'native-value'}),
    properties:attribute('native-scalar-map',false,{expressionContext:'native-value'})},[...orchestrationChildren,'Slot']),lowering:'captured-shipped-shadow-component'},
  Slot: {...operator('RmtxNativeSlot',{name:attribute('string',true)},orchestrationChildren),lowering:'compiler-owned-light-dom-slot'}
}, {...v6.expressionContexts,'lifecycle-condition':{...v6.expressionContexts['native-condition'],roots:['model','selectors','item'],itemScopes:true}}, {
  ...v6.semantics,
  operators:{...v6.semantics.operators,nativeSurfaceRepeat:true,lifecycleConditions:'owning-native-surface-operations'},
  hostScopes:{...v6.semantics.hostScopes,sourceContract:'xtend.rmtx.host-scopes.v4',bindingArtifact:'xtend.xtensions.state-binding-artifact.v7'},
  nativeViews:{...v6.semantics.nativeViews,sourceContract:'xtend.rmtx.native-view.v2',rendererContract:'xtend.rmt.native-view.v2',subprofile:'7.0.0',
    publicComponents:'captured-shipped-shadow-dom',slots:'declared-native-light-dom-only',surfaceScopes:'whole-surface-typed-key-tuple'},
  lifecycle:{...v6.semantics.lifecycle,sourceContract:'xtend.rmtx.native-lifecycle.v2',plan:'xtend.rmt.native-lifecycle-plan.v2',
    target:'owning-native-surface-instance',guard:'mount-level-and-rising-edge-commands',operations:lifecycleNames.map(x=>x.toLowerCase())}
});
const profiles = freeze({ '1.0.0': v1, '2.0.0': v2, '3.0.0': v3, '4.0.0': v4, '5.0.0': v5, '6.0.0': v6, '7.0.0': v7 });

/** Return an immutable profile. Mutating a separately cloned copy cannot alter it. */
function getRmtxOperatorProfile(version = '1.0.0') {
  if (typeof version !== 'string' || !Object.hasOwn(profiles, version)) {
    throw Object.assign(new TypeError('Unsupported RMTX operator profile version.'), { code: 'rmtx.operator-profile.unsupported' });
  }
  return profiles[version];
}
module.exports = { RMTX_OPERATOR_PROFILE_API_VERSION, RMTX_OPERATOR_PROFILE_SCHEMA, RMTX_OPERATOR_PROFILE_SCHEMA_V2, RMTX_OPERATOR_PROFILE_SCHEMA_V3, RMTX_OPERATOR_PROFILE_SCHEMA_V4, RMTX_OPERATOR_PROFILE_SCHEMA_V5, RMTX_OPERATOR_PROFILE_SCHEMA_V6, getRmtxOperatorProfile };
