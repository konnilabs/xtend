'use strict';

// This is a closed source vocabulary, not a public AST input port. The lowering
// modes are interpreted by rmtx-extended-operators; source cannot supply a mode,
// AST type, text fragment or token stream.
const attribute = (kind, required = false, extra = {}) => ({ kind, required, ...extra });
const symbol = (required = true) => attribute('symbol', required);
const string = (required = true) => attribute('string', required);
const literal = (required = true) => attribute('json-literal', required, { expressionContext: 'initial' });
const expression = (required = true) => attribute('primitive-expression', required, { expressionContext: 'action-value' });
const enumeration = (values, required = true) => attribute('enum', required, { values });
const sourceKinds = ['endpoint', 'sse', 'worker', 'selector', 'state', 'datasource', 'fixture', 'resource'];
const rules = {};
function add(name, astType, attributes, children = [], mode = 'fields', fields = {}, constants = {}) {
  rules[name] = { astType, attributes, children, lowering: { mode, fields, constants } };
}
function field(name, astType, attrName, astName = attrName, kind = 'symbol', constants = {}) {
  add(name, astType, { [attrName]: attribute(kind, true) }, [], 'fields', { [attrName]: astName }, constants);
}
function valueClause(name, astType, keyword = null, kind = 'json-literal') {
  add(name, astType, { value: attribute(kind, true, kind === 'json-literal' ? { expressionContext: 'initial' } : {}) }, [], 'value-clause', {}, keyword ? { keyword } : {});
}
function declaration(name, astType, children, attributes = {}) {
  add(name, astType, { id: symbol(), ...attributes }, children, 'declaration', { id: 'name' });
}
function reference(name, astType, keyword) {
  add(name, astType, { kind: enumeration(sourceKinds), ref: string() }, [], 'fields', { kind: 'kind', ref: 'ref' }, { keyword });
}

declaration('DataSource', 'RmtDataSourceDeclaration', ['DataSourceMode', 'DataSourceMethod', 'DataSourceContract', 'DataSourceResult', 'DataSourceFallback'], {
  sourceKind: enumeration(sourceKinds, false), source: string(false),
  mode: string(false), method: string(false), contract: string(false), result: string(false), fallbackKind: enumeration(sourceKinds, false), fallback: symbol(false)
});
for (const [name, keyword] of [['Mode', 'mode'], ['Method', 'method'], ['Contract', 'contract'], ['Result', 'result']])
  valueClause('DataSource' + name, 'RmtDataSource' + name + 'Clause', keyword);
add('DataSourceFallback', 'RmtDataSourceFallbackClause', { kind: enumeration(sourceKinds), ref: symbol() }, [], 'fields', { kind: 'kind', ref: 'value' });
field('Status', 'RmtActionStatusClause', 'path', 'path', 'symbol', { keyword: 'status' });
field('Execution', 'RmtActionExecutionClause', 'path', 'path', 'enum', { keyword: 'execution' });
rules.Execution.attributes.path.values = ['fastpass'];
add('InputPolicy', 'RmtActionInputPolicy', {}, ['TrustBoundary', 'Sanitize'], 'body');
add('Effect', 'RmtEffectStatement', {
  kind: symbol(), sourceKind: enumeration(['datasource', 'resource', 'selector', 'surface'], false), source: symbol(false), path: expression(false)
}, [], 'action-effect');
add('Recipe', 'RmtReducerRecipeStatement', {
  recipe: string(), state: symbol(), path: symbol(false), value: expression(false)
}, [], 'recipe');
add('Emit', 'RmtEmitStatement', { event: symbol(), payload: expression(false) }, [], 'emit');
add('ResultHandler', 'RmtActionResultHandler', {
  phase: enumeration(['success', 'error']), kind: enumeration(['reduce', 'emit', 'overlay']),
  state: symbol(false), path: symbol(false), value: expression(false), event: symbol(false), payload: expression(false),
  target: symbol(false), message: expression(false), tone: expression(false)
}, [], 'result-handler');

declaration('Validation', 'RmtValidationDeclaration', ['ValidationMode', 'ValidationTarget', 'ValidationField', 'ValidationInclude']);
field('ValidationMode', 'RmtValidationModeClause', 'mode');
add('ValidationTarget', 'RmtValidationTargetClause', { kind: enumeration(['action', 'surface', 'state']), target: symbol() }, [], 'fields', { kind: 'kind', target: 'target' });
add('ValidationField', 'RmtValidationFieldClause', { field: symbol() }, ['ValidationRule'], 'validation-field');
add('ValidationRule', 'RmtValidationRule', {
  kind: enumeration(['required', 'email', 'minLength', 'maxLength', 'pattern', 'message']), value: literal(false)
}, [], 'validation-rule');
field('ValidationInclude', 'RmtValidationIncludeClause', 'ref');

const animationChildren = ['AnimationPreset', 'AnimationEffect', 'AnimationDuration', 'AnimationEasing', 'AnimationSpring', 'AnimationKeyframe', 'AnimationTimeline', 'AnimationReducedMotion', 'AnimationAllowFilter'];
declaration('Animation', 'RmtAnimationDeclaration', animationChildren);
field('AnimationPreset', 'RmtAnimationPresetClause', 'preset');
field('AnimationEffect', 'RmtAnimationEffectClause', 'effect');
valueClause('AnimationDuration', 'RmtAnimationDurationClause', 'durationMs', 'number');
valueClause('AnimationEasing', 'RmtAnimationEasingClause', 'easing', 'string');
valueClause('AnimationAllowFilter', 'RmtAnimationAllowFilterClause', 'allowFilter', 'boolean');
field('AnimationReducedMotion', 'RmtAnimationReducedMotionClause', 'policy');
add('AnimationSpring', 'RmtAnimationSpringClause', {
  stiffness: attribute('number'), damping: attribute('number'), mass: attribute('number'), velocity: attribute('number')
}, [], 'spring-fields');
add('AnimationKeyframe', 'RmtAnimationKeyframeClause', {
  phase: enumeration(['enter', 'exit']), opacity: attribute('number'), transform: string(false), filter: string(false), offset: attribute('number')
}, [], 'keyframe-fields');
for (const family of ['Animation', 'Transition']) {
  add(family + 'Timeline', 'Rmt' + family + 'TimelineClause', {}, [family + 'TimelineStep'], 'timeline');
  add(family + 'TimelineStep', 'Rmt' + family + 'TimelineStep', {
    kind: enumeration(['enter', 'exit', 'sequence', 'parallel', 'stagger']), phase: enumeration(['enter', 'exit'], false),
    delayMs: attribute('number'), durationMs: attribute('number'), eachMs: attribute('number')
  }, [], 'timeline-step');
}

const transitionChildren = ['TransitionTrigger', 'TransitionFrom', 'TransitionTo', 'TransitionEffect', 'TransitionDuration', 'TransitionEasing', 'TransitionLane', 'TransitionUseAnimation', 'TransitionTimeline', 'TransitionLayoutKey', 'TransitionInterrupt', 'TransitionReducedMotion'];
declaration('Transition', 'RmtTransitionDeclaration', transitionChildren);
add('TransitionTrigger', 'RmtTransitionTriggerClause', { kind: enumeration(['action', 'event', 'state', 'surface']), target: symbol() }, [], 'fields', { kind: 'kind', target: 'target' });
for (const [name, kind] of [['From', 'string-or-string-array'], ['To', 'string-or-string-array'], ['Duration', 'number'], ['Easing', 'string'], ['LayoutKey', 'string']])
  valueClause('Transition' + name, 'RmtTransition' + name + 'Clause', null, kind);
field('TransitionEffect', 'RmtTransitionEffectClause', 'effect');
field('TransitionLane', 'RmtTransitionLaneClause', 'lane');
field('TransitionUseAnimation', 'RmtTransitionUseAnimationClause', 'ref');
field('TransitionInterrupt', 'RmtTransitionInterruptClause', 'policy');
field('TransitionReducedMotion', 'RmtTransitionReducedMotionClause', 'policy');

declaration('Portal', 'RmtPortalDeclaration', ['PortalPolicy'], { root: string(false), layer: string(false), z: attribute('number') });
declaration('Overlay', 'RmtOverlayDeclaration', ['OverlayPolicy'], { kind: symbol(false), portal: symbol(false) });
for (const family of ['Portal', 'Overlay']) add(family + 'Policy', 'Rmt' + family + 'PolicyClause', {
  name: enumeration(['escape', 'focus', 'pointer', 'scroll', 'stack', 'close', 'singleton', 'dismissible', 'inert']),
  values: attribute('policy-values', true, { expressionContext: 'policy-values' })
}, [], 'policy-tokens');
declaration('Resource', 'RmtResourceDeclaration', ['ResourceImport', 'ResourceSource', 'ResourceDispose'], {
  kind: symbol(false), owner: symbol(false), source: string(false)
});
valueClause('ResourceImport', 'RmtResourceImportClause', 'import', 'string');
reference('ResourceSource', 'RmtResourceSourceClause', 'source');
add('ResourceDispose', 'RmtResourceDisposeClause', { on: symbol() }, [], 'dispose-tokens', {}, { keyword: 'dispose' });
reference('SurfaceSource', 'RmtSurfaceSourceClause', 'source');
add('SurfaceBounds', 'RmtSurfaceBoundsClause', {
  mode: enumeration(['fixed', 'responsive'], false), scope: enumeration(['viewport', 'container'], false), width: attribute('number-or-string'), height: attribute('number-or-string'),
  minWidth: attribute('number-or-string'), minHeight: attribute('number-or-string'), maxWidth: attribute('number-or-string'), maxHeight: attribute('number-or-string'),
  x: attribute('number-or-string'), y: attribute('number-or-string')
}, [], 'bounds-fields');
add('SurfacePreserve', 'RmtSurfacePreserveClause', { value: enumeration(['true', 'false', 'state', 'resources', 'all']) }, [], 'preserve-tokens', {}, { keyword: 'preserve' });
add('SurfaceDestroy', 'RmtSurfaceDestroyClause', { resource: symbol() }, [], 'destroy-tokens', {}, { keyword: 'destroy' });

declaration('SearchSource', 'RmtSearchSourceDeclaration', ['SearchQuery', 'SearchResource', 'SearchFallbackResource', 'SearchWeight', 'SearchValue']);
reference('SearchQuery', 'RmtSearchQueryClause', 'query');
reference('SearchResource', 'RmtSearchResourceClause', 'resource');
reference('SearchFallbackResource', 'RmtSearchFallbackResourceClause', 'fallback');
add('SearchWeight', 'RmtSearchWeightClause', { field: symbol(), value: attribute('number', true) }, [], 'search-weight');
add('SearchValue', 'RmtSearchValueClause', {
  name: enumeration(['minQueryLength', 'debounceMs', 'resultLimit', 'fallbackThreshold', 'resultTemplate', 'emptyTemplate', 'loadingTemplate', 'activeIndexState', 'selectionState', 'localePolicy', 'a11y']), value: literal()
}, [], 'search-value');

const lifecycleOps = ['Mount', 'Hydrate', 'Suspend', 'Resume', 'Invalidate', 'Dispose', 'Prewarm', 'Recycle', 'Detach', 'Reattach'];
for (const name of lifecycleOps) add(name, 'RmtLifecycleStatement', { target: symbol() }, ['Source', 'Policy'], 'lifecycle', {}, { op: name.toLowerCase() });
add('Stream', 'RmtStreamStatement', { target: symbol() }, ['Source', 'Policy'], 'lifecycle', {}, { op: 'stream' });
add('Source', 'RmtSourceClause', { kind: enumeration(sourceKinds), target: string() }, [], 'fields', { kind: 'kind', target: 'target' });
add('Policy', 'RmtPolicyBlock', {}, ['Slot', 'On', 'TrustBoundary', 'Sanitize', 'Hydration', 'Resumability', 'Isolation'], 'body');
add('Slot', 'RmtSlotDeclaration', { name: symbol() }, [...lifecycleOps, 'Stream'], 'slot');
field('TrustBoundary', 'RmtTrustBoundaryPolicy', 'boundary', 'boundary', 'string');
field('Sanitize', 'RmtSanitizePolicy', 'format');
add('Hydration', 'RmtHydrationPolicy', { policy: symbol(false), mode: symbol(false), insularHydration: attribute('boolean') }, [], 'nullable-fields', { policy: 'policy', mode: 'mode', insularHydration: 'insularHydration' });
add('Resumability', 'RmtResumabilityPolicy', { mode: symbol(false), snapshot: symbol(false), eventReplay: symbol(false), integrity: string(false) }, [], 'nullable-fields', { mode: 'mode', snapshot: 'snapshot', eventReplay: 'eventReplay', integrity: 'integrity' });
add('Isolation', 'RmtIsolationPolicy', { boundary: string(false), mode: symbol(false) }, [], 'nullable-fields', { boundary: 'boundary', mode: 'mode' });

declaration('RemoteSurface', 'RmtRemoteSurfaceDeclaration', ['RemoteOwner', 'RemoteVersion', 'RemoteOrigin', 'RemoteIntegrity', 'RemoteTrustBoundary', 'RemoteFallback', 'RemoteExpose', 'RemoteEvent'], { remoteId: string() });
add('RemoteOwner', 'RmtRemoteOwnerClause', { id: string() }, [], 'fields', { id: 'id' }, { kind: 'team' });
for (const name of ['Version', 'Origin', 'EventPayload']) field('Remote' + name, 'RmtRemote' + name + 'Clause', 'value', 'value', 'string');
add('RemoteIntegrity', 'RmtRemoteIntegrityClause', { algorithm: enumeration(['sha256', 'sha384', 'sha512']), digest: string() }, [], 'fields', { algorithm: 'algorithm', digest: 'digest' });
field('RemoteTrustBoundary', 'RmtRemoteTrustBoundaryClause', 'boundary', 'boundary', 'string');
add('RemoteFallback', 'RmtRemoteFallbackClause', { ref: symbol() }, [], 'fields', { ref: 'ref' }, { kind: 'surface' });
add('RemoteExpose', 'RmtRemoteExposeClause', { surface: symbol(), lane: symbol(), targetKind: symbol(), target: string() }, [], 'remote-target');
add('RemoteEvent', 'RmtRemoteEventClause', { surface: symbol(), kind: enumeration(['emits', 'consumes']), event: symbol() }, ['RemoteOwner', 'RemoteEventDirection', 'RemoteEventLane', 'RemoteEventFrom', 'RemoteEventPayload'], 'remote-event');
add('RemoteEventDirection', 'RmtRemoteEventDirectionClause', { direction: enumeration(['outbound', 'inbound']) }, [], 'fields', { direction: 'direction' });
field('RemoteEventLane', 'RmtRemoteEventLaneClause', 'lane');
add('RemoteEventFrom', 'RmtRemoteEventFromClause', { kind: symbol(), ref: string() }, [], 'remote-from');

// Imports are declarative Classic source dependencies. Resolving a source module
// graph, executing JS imports or supporting a watcher belongs to A06.5.
add('Import', 'RmtImportDeclaration', { path: string(), mode: enumeration(['static_file', 'static_glob'], false) }, [], 'import');

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
}
const RMTX_EXTENDED_OPERATOR_RULES = freeze(rules);
const RMTX_EXTENDED_PROGRAM_CHILDREN = freeze(['DataSource', 'Validation', 'Animation', 'Transition', 'Overlay', 'Resource', 'SearchSource', 'RemoteSurface', 'Import']);
const RMTX_CLASSIC_AST_COVERAGE = freeze(require('./rmtx-operator-coverage.json'));
module.exports = { RMTX_EXTENDED_OPERATOR_RULES, RMTX_EXTENDED_PROGRAM_CHILDREN, RMTX_CLASSIC_AST_COVERAGE };
