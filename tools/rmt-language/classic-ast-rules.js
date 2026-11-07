'use strict';

// Curated compiler-input rules. These are grammar/producer decisions, never
// inferred required fields from fixture frequencies. Generate schema/types from
// this file; the compiler validates against the generated schema.
const string = { type: 'string' };
const name = { type: 'string', minLength: 1 };
const boolean = { type: 'boolean' };
const number = { type: 'number' };
const integer = { type: 'integer', minimum: 0 };
const scalar = { type: ['string', 'number', 'boolean', 'null'] };
const ref = key => ({ $ref: `#/definitions/${key}` });
const either = (...schemas) => ({ anyOf: schemas });
const nullable = schema => either(schema, { type: 'null' });
const list = (items, extra = {}) => ({ type: 'array', items, ...extra });
const choice = (...values) => ({ enum: values });
const nodes = (...types) => types.length === 1 ? ref(types[0]) : either(...types.map(ref));
const optional = schema => ({ ...schema, 'x-rmt-optional': true });
function object(properties, extra = {}) {
  return { type: 'object', properties: Object.fromEntries(Object.entries(properties).map(([key, value]) => {
    const { 'x-rmt-optional': ignored, ...schema } = value;
    return [key, schema];
  })), required: Object.keys(properties).filter(key => !properties[key]['x-rmt-optional']), additionalProperties: false, ...extra };
}
const definitions = {};
definitions.Position = object({ line: integer, character: integer });
definitions.Range = object({ start: ref('Position'), end: ref('Position'), startOffset: optional(integer), endOffset: optional(integer) });
definitions.Token = object({ type: name, value: scalar, startOffset: integer, endOffset: integer, raw: optional(string), escaped: optional(boolean) });
definitions.Scope = object(Object.fromEntries(['templateName', 'surfaceName', 'laneName'].map(key => [key, optional(nullable(name))]).concat([['topLevel', optional(boolean)]])));
const metadata = { range: optional(ref('Range')), astPointer: optional(string) };
const identifier = optional(nodes('RmtIdentifier'));
const value = nodes('RmtPrimitiveValue');
const strings = list(string);
const expression = nodes('RmtConditionExpression', 'RmtSelectorExpression');
function node(type, fields) { definitions[type] = object({ type: { const: type }, ...metadata, ...fields }); }
function variants(type, entries) {
  definitions[type] = { oneOf: entries.map(fields => object({ type: { const: type }, ...metadata, ...fields })) };
}
function declaration(type, children, fields = {}) {
  node(type, { name, nameNode: identifier, body: list(nodes(...children)), scope: optional(ref('Scope')), ...fields });
}
function namedValue(type, field, helper = field + 'Node', schema = name) {
  node(type, { [field]: schema, [helper]: identifier });
}
const lifecycle = ['RmtLifecycleStatement', 'RmtStreamStatement'];
const primitives = ['RmtStateDeclaration', 'RmtSelectorDeclaration', 'RmtDataSourceDeclaration', 'RmtActionDeclaration',
  'RmtValidationDeclaration', 'RmtAnimationDeclaration', 'RmtTransitionDeclaration', 'RmtPortalDeclaration',
  'RmtOverlayDeclaration', 'RmtResourceDeclaration', 'RmtSearchSourceDeclaration'];
const surfaces = ['RmtLaneDeclaration', 'RmtEventBinding', 'RmtSurfaceSourceClause', 'RmtSurfaceRepeatClause', 'RmtSurfaceKeyClause',
  'RmtSurfacePortalClause', 'RmtSurfaceBoundsClause', 'RmtSurfacePreserveClause', 'RmtSurfaceDestroyClause'];
const policies = ['RmtSlotDeclaration', 'RmtEventBinding', 'RmtTrustBoundaryPolicy', 'RmtSanitizePolicy',
  'RmtHydrationPolicy', 'RmtResumabilityPolicy', 'RmtIsolationPolicy'];
const topLevel = ['RmtImportDeclaration', 'RmtTemplateDeclaration', 'RmtSurfaceDeclaration', 'RmtRemoteSurfaceDeclaration', ...primitives];

node('RmtVNextDocument', { schema: { const: 'xtend.rmt.vnext.ast.v1' }, body: list(nodes(...topLevel)),
  imports: optional(list(nodes('RmtImportDeclaration'))), templates: optional(list(nodes('RmtTemplateDeclaration'))),
  surfaces: optional(list(nodes('RmtSurfaceDeclaration'))), remoteSurfaces: optional(list(nodes('RmtRemoteSurfaceDeclaration'))) });
node('RmtIdentifier', { value: name, parts: optional(list(name, { minItems: 1 })), escaped: optional(boolean),
  startToken: optional(ref('Token')), endToken: optional(ref('Token')) });
node('RmtImportDeclaration', { path: name, mode: choice('static_file', 'static_glob'), pathRange: optional(ref('Range')) });
node('RmtTemplateDeclaration', { name, nameNode: identifier, body: list(nodes('RmtImportDeclaration', 'RmtSurfaceDeclaration', ...primitives)) });
node('RmtSurfaceDeclaration', { name, nameNode: identifier, metadata: list(nodes('RmtSurfaceHeaderClause')), body: list(nodes(...surfaces)) });
node('RmtSurfaceHeaderClause', { keyword: choice('kind', 'component'), value });
node('RmtStateDeclaration', { name, nameNode: identifier, dataType: nodes('RmtTypeReference'), initial: nullable(value),
  preserve: optional(boolean), body: list(nodes('RmtInitialBlock')), scope: optional(ref('Scope')) });
node('RmtTypeReference', { value: name, tokens: optional(strings) });
node('RmtInitialBlock', { body: list(nodes('RmtInitialValueEntry')) });
node('RmtInitialValueEntry', { key: name, keyNode: identifier, value });
node('RmtObjectValueKey', { value: string });
node('RmtObjectValueField', { key: string, keyNode: optional(nodes('RmtIdentifier', 'RmtObjectValueKey')), value });
variants('RmtPrimitiveValue', [
  { kind: { const: 'literal' }, value: scalar },
  { kind: { const: 'path' }, value: name, path: list(name, { minItems: 1 }), pathNode: identifier },
  { kind: { const: 'array' }, items: list(value) },
  { kind: { const: 'object' }, fields: list(nodes('RmtObjectValueField')) }
]);
declaration('RmtSelectorDeclaration', ['RmtSelectorWhereClause', 'RmtSelectorFindClause', 'RmtSelectorSortClause', 'RmtSelectorOutputClause'],
  { source: nullable(nodes('RmtPrimitiveSourceReference')) });
for (const [type, keyword] of [['RmtSelectorWhereClause', 'where'], ['RmtSelectorFindClause', 'find']]) {
  node(type, { keyword: { const: keyword }, expression, text: optional(string), tokens: optional(strings) });
}
node('RmtSelectorSortClause', { by: name, byNode: identifier, direction: nullable(choice('asc', 'desc')) });
node('RmtSelectorOutputClause', { dataType: nodes('RmtTypeReference') });
variants('RmtConditionExpression', [
  { kind: { const: 'literal' }, value: scalar },
  { kind: { const: 'path' }, path: list(name, { minItems: 1 }), value: name },
  { kind: { const: 'unary' }, op: { const: '!' }, argument: expression },
  { kind: { const: 'binary' }, op: choice('==', '!=', '>', '>=', '<', '<='), left: expression, right: expression },
  { kind: { const: 'logical' }, op: choice('&&', '||'), left: expression, right: expression },
  { kind: { const: 'group' }, expression }
]);
variants('RmtSelectorExpression', [
  { kind: { const: 'path' }, path: list(name, { minItems: 1 }), value: name },
  { kind: { const: 'call' }, name: { const: 'contains' }, args: list(expression, { minItems: 2, maxItems: 2 }) }
]);
node('RmtPrimitiveSourceReference', { kind: name, value: name, valueNode: optional(nodes('RmtIdentifier', 'RmtPrimitiveValue')) });
declaration('RmtDataSourceDeclaration', ['RmtDataSourceModeClause', 'RmtDataSourceMethodClause', 'RmtDataSourceContractClause', 'RmtDataSourceResultClause', 'RmtDataSourceFallbackClause'],
  { source: nullable(nodes('RmtPrimitiveSourceReference')) });
for (const [type, keyword] of [['RmtDataSourceModeClause', 'mode'], ['RmtDataSourceMethodClause', 'method'],
  ['RmtDataSourceContractClause', 'contract'], ['RmtDataSourceResultClause', 'result'], ['RmtResourceImportClause', 'import'],
  ['RmtEventOptionClause', 'preventDefault'], ['RmtAnimationDurationClause', 'durationMs'], ['RmtAnimationEasingClause', 'easing'], ['RmtAnimationAllowFilterClause', 'allowFilter']]) {
  node(type, { keyword: { const: keyword }, value });
}
node('RmtDataSourceFallbackClause', { kind: name, value: name, valueNode: identifier });
declaration('RmtActionDeclaration', ['RmtActionInputClause', 'RmtActionStatusClause', 'RmtActionExecutionClause', 'RmtEffectStatement',
  'RmtReducerStatement', 'RmtReducerRecipeStatement', 'RmtEmitStatement', 'RmtActionResultHandler']);
node('RmtActionInputClause', { name, nameNode: identifier, dataType: nodes('RmtTypeReference'), policy: nullable(nodes('RmtActionInputPolicy')) });
node('RmtActionInputPolicy', { body: list(nodes('RmtTrustBoundaryPolicy', 'RmtSanitizePolicy')) });
for (const [type, keyword] of [['RmtActionStatusClause', 'status'], ['RmtActionExecutionClause', 'execution'],
  ['RmtSurfaceKeyClause', 'key'], ['RmtSurfacePortalClause', 'portal']]) node(type, { keyword: { const: keyword }, path: name, pathNode: identifier });
definitions.EffectSource = object({ kind: choice('datasource', 'resource', 'selector', 'surface'), value: name, valueNode: identifier });
definitions.ComponentCommand = object({ command: name, target: name, targetNode: identifier, authoringKind: { const: 'selector' } });
node('RmtEffectStatement', { effectKind: name, effectKindNode: identifier, source: nullable(ref('EffectSource')),
  path: optional(value), componentCommand: nullable(ref('ComponentCommand')) });
node('RmtReducerStatement', { target: name, targetNode: identifier, expression: name, expressionTokens: optional(strings) });
node('RmtReducerRecipeStatement', { recipe: value, target: name, targetNode: identifier, valueExpression: string, valueTokens: optional(strings) });
definitions.PayloadEntry = object({ key: name, keyNode: identifier, value });
node('RmtEmitStatement', { event: name, eventNode: identifier, payload: list(ref('PayloadEntry')) });
definitions.ResultEffect = object({ kind: name, text: name, tokens: strings });
node('RmtActionResultHandler', { phase: name, phaseNode: identifier, effect: ref('ResultEffect') });
declaration('RmtValidationDeclaration', ['RmtValidationModeClause', 'RmtValidationTargetClause', 'RmtValidationFieldClause', 'RmtValidationIncludeClause']);
namedValue('RmtValidationModeClause', 'mode');
node('RmtValidationTargetClause', { kind: name, target: name, targetNode: identifier });
node('RmtValidationFieldClause', { field: name, fieldNode: identifier, rules: list(nodes('RmtValidationRule')) });
const literalValue = schema => object({ type: { const: 'RmtPrimitiveValue' }, ...metadata, kind: { const: 'literal' }, value: schema });
variants('RmtValidationRule', [
  { kind: choice('required', 'email'), value: literalValue({ const: true }) },
  { kind: choice('minLength', 'maxLength'), value: literalValue(integer) },
  { kind: choice('pattern', 'message'), value: literalValue(string) }
]);
namedValue('RmtValidationIncludeClause', 'ref');
declaration('RmtAnimationDeclaration', ['RmtAnimationPresetClause', 'RmtAnimationEffectClause', 'RmtAnimationDurationClause', 'RmtAnimationEasingClause',
  'RmtAnimationSpringClause', 'RmtAnimationKeyframeClause', 'RmtAnimationTimelineClause', 'RmtAnimationReducedMotionClause', 'RmtAnimationAllowFilterClause']);
namedValue('RmtAnimationPresetClause', 'preset', 'valueNode');
namedValue('RmtAnimationEffectClause', 'effect', 'valueNode');
namedValue('RmtAnimationReducedMotionClause', 'policy', 'valueNode');
node('RmtAnimationSpringClause', { fields: list(nodes('RmtAnimationSpringField')) });
node('RmtAnimationSpringField', { key: name, keyNode: identifier, value });
node('RmtAnimationKeyframeClause', { phase: name, phaseNode: identifier, fields: list(nodes('RmtAnimationKeyframeField')) });
node('RmtAnimationKeyframeField', { key: name, keyNode: identifier, value });
declaration('RmtTransitionDeclaration', ['RmtTransitionTriggerClause', 'RmtTransitionFromClause', 'RmtTransitionToClause', 'RmtTransitionEffectClause',
  'RmtTransitionDurationClause', 'RmtTransitionEasingClause', 'RmtTransitionLaneClause', 'RmtTransitionUseAnimationClause', 'RmtTransitionTimelineClause',
  'RmtTransitionLayoutKeyClause', 'RmtTransitionInterruptClause', 'RmtTransitionReducedMotionClause']);
node('RmtTransitionTriggerClause', { kind: name, target: name, targetNode: identifier });
for (const type of ['RmtTransitionFromClause', 'RmtTransitionToClause', 'RmtTransitionDurationClause', 'RmtTransitionEasingClause', 'RmtTransitionLayoutKeyClause']) node(type, { value });
namedValue('RmtTransitionEffectClause', 'effect');
namedValue('RmtTransitionLaneClause', 'lane');
namedValue('RmtTransitionUseAnimationClause', 'ref');
namedValue('RmtTransitionInterruptClause', 'policy');
namedValue('RmtTransitionReducedMotionClause', 'policy');
for (const family of ['Animation', 'Transition']) {
  node(`Rmt${family}TimelineClause`, { text: string, steps: list(nodes(`Rmt${family}TimelineStep`)) });
  node(`Rmt${family}TimelineStep`, { text: string, tokens: strings });
}
node('RmtPrimitiveAttribute', { keyword: name, value });
declaration('RmtPortalDeclaration', ['RmtPortalPolicyClause'], { attributes: list(nodes('RmtPrimitiveAttribute')) });
declaration('RmtOverlayDeclaration', ['RmtOverlayPolicyClause'], { attributes: list(nodes('RmtPrimitiveAttribute')) });
declaration('RmtResourceDeclaration', ['RmtResourceImportClause', 'RmtResourceSourceClause', 'RmtResourceDisposeClause'], { attributes: list(nodes('RmtPrimitiveAttribute')) });
for (const [type, keyword] of [['RmtResourceSourceClause', 'source'], ['RmtSurfaceSourceClause', 'source'],
  ['RmtSearchQueryClause', 'query'], ['RmtSearchResourceClause', 'resource'], ['RmtSearchFallbackResourceClause', 'fallback']]) {
  node(type, { keyword: { const: keyword }, kind: name, ref: name, refNode: identifier });
}
for (const type of ['RmtPortalPolicyClause', 'RmtOverlayPolicyClause']) node(type, { text: string, tokens: strings });
for (const [type, keyword] of [['RmtResourceDisposeClause', 'dispose'], ['RmtSurfacePreserveClause', 'preserve'], ['RmtSurfaceDestroyClause', 'destroy']]) {
  node(type, { keyword: { const: keyword }, text: string, tokens: strings });
}
declaration('RmtSearchSourceDeclaration', ['RmtSearchQueryClause', 'RmtSearchResourceClause', 'RmtSearchFallbackResourceClause', 'RmtSearchWeightClause', 'RmtSearchValueClause']);
node('RmtSearchValueClause', { keyword: choice('minQueryLength', 'debounceMs', 'resultLimit', 'fallbackThreshold', 'resultTemplate', 'emptyTemplate',
  'loadingTemplate', 'activeIndexState', 'selectionState', 'localePolicy', 'a11y'), value });
node('RmtSearchWeightClause', { field: name, fieldNode: identifier, value });
node('RmtSurfaceRepeatClause', { source: nullable(nodes('RmtPrimitiveSourceReference')) });
definitions.BoundsField = object({ key: name, keyNode: identifier, value });
node('RmtSurfaceBoundsClause', { fields: list(ref('BoundsField')) });
node('RmtLaneDeclaration', { name, nameNode: identifier, weight: nullable(integer), body: list(nodes(...lifecycle)) });
node('RmtSlotDeclaration', { name, nameNode: identifier, body: list(nodes(...lifecycle)) });
for (const type of lifecycle) node(type, { op: type === 'RmtStreamStatement' ? { const: 'stream' }
  : choice('mount', 'hydrate', 'suspend', 'resume', 'invalidate', 'dispose', 'prewarm', 'recycle', 'detach', 'reattach'),
  target: nodes('RmtIdentifier'), source: type === 'RmtStreamStatement' ? nodes('RmtSourceClause') : nullable(nodes('RmtSourceClause')),
  condition: nullable(nodes('RmtConditionClause')), policy: nullable(nodes('RmtPolicyBlock')), scope: optional(ref('Scope')) });
node('RmtSourceClause', { kind: choice('endpoint', 'sse', 'worker', 'selector', 'state', 'datasource', 'fixture', 'resource'), target: name, targetNode: identifier });
node('RmtConditionClause', { expression: nodes('RmtConditionExpression') });
node('RmtPolicyBlock', { body: list(nodes(...policies)), scope: optional(ref('Scope')) });
node('RmtEventBinding', { event: name, eventNode: identifier, action: name, actionNode: identifier,
  selector: nullable(nodes('RmtEventSelector')), target: nullable(name), targetNode: optional(nullable(nodes('RmtIdentifier'))),
  condition: nullable(nodes('RmtConditionClause')), policy: nullable(nodes('RmtEventPayloadBlock')) });
node('RmtEventSelector', { value: string });
node('RmtEventPayloadBlock', { body: list(nodes('RmtEventPayloadMapping', 'RmtEventOptionClause')) });
node('RmtEventPayloadMapping', { name, nameNode: identifier, source: name, sourceNode: identifier });
node('RmtTrustBoundaryPolicy', { boundary: string });
node('RmtSanitizePolicy', { format: name, formatNode: identifier });
node('RmtHydrationPolicy', { policy: nullable(name), mode: nullable(name), insularHydration: nullable(boolean) });
node('RmtResumabilityPolicy', { mode: nullable(name), snapshot: nullable(name), eventReplay: nullable(name), integrity: nullable(name) });
node('RmtIsolationPolicy', { boundary: nullable(string), mode: nullable(name) });
node('RmtRemoteSurfaceDeclaration', { name, nameNode: identifier, remoteId: string, body: list(nodes('RmtRemoteOwnerClause', 'RmtRemoteVersionClause',
  'RmtRemoteOriginClause', 'RmtRemoteIntegrityClause', 'RmtRemoteTrustBoundaryClause', 'RmtRemoteFallbackClause', 'RmtRemoteExposeClause', 'RmtRemoteEventClause')) });
node('RmtRemoteOwnerClause', { kind: { const: 'team' }, id: string });
for (const type of ['RmtRemoteVersionClause', 'RmtRemoteOriginClause', 'RmtRemoteEventPayloadClause']) node(type, { value: string });
node('RmtRemoteIntegrityClause', { algorithm: name, algorithmNode: identifier, digest: string });
node('RmtRemoteTrustBoundaryClause', { boundary: string });
node('RmtRemoteFallbackClause', { kind: { const: 'surface' }, ref: name, refNode: identifier });
definitions.RemoteTarget = object({ type: name, ref: name, targetNode: identifier, astPointer: optional(string) });
node('RmtRemoteExposeClause', { surface: name, lane: name, laneNode: identifier, target: ref('RemoteTarget') });
node('RmtRemoteEventClause', { surface: name, kind: choice('emits', 'consumes'), event: name, eventNode: identifier,
  body: list(nodes('RmtRemoteOwnerClause', 'RmtRemoteEventDirectionClause', 'RmtRemoteEventLaneClause', 'RmtRemoteEventFromClause', 'RmtRemoteEventPayloadClause')) });
node('RmtRemoteEventDirectionClause', { direction: choice('outbound', 'inbound') });
namedValue('RmtRemoteEventLaneClause', 'lane');
node('RmtRemoteEventFromClause', { source: ref('RemoteTarget') });

function createClassicAstSchema() {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'xtend.rmt.vnext.ast.v1',
    title: 'RMT Classic compiler input, version 1',
    description: 'Shared declarative compiler input. The vnext discriminator is retained for wire compatibility. Core and execution plans are outputs, not alternative input shapes.',
    $ref: '#/definitions/RmtVNextDocument', definitions
  };
}

module.exports = { createClassicAstSchema };
