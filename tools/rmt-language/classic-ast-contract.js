'use strict';
// Do not share the mutable Node JSON-module cache with schema consumers.
const schema = JSON.parse(JSON.stringify(require('./contracts/classic-ast.v1.schema.json')));
const pointerPart = value => String(value).replace(/~/gu, '~0').replace(/\//gu, '~1');

const RMT_CLASSIC_COMPILER_CONTRACT = Object.freeze({
  schema: 'xtend.rmt.classic.compiler-contract.v1',
  version: '1.0.0', name: 'RMT Classic',
  inputSchema: 'xtend.rmt.vnext.ast.v1',
  coreSchema: 'xtend.rmt.core-format.vnext.v1',
  appPlatformSchema: 'xtend.rmt.vnext.app-platform-records.v1',
  kernelSchema: 'xtend.rmt.vnext.kernel-records.v1',
  orchestrationSchema: 'xtend.rmt.app-orchestration.v1',
  portableRenderSchema: 'xtend.rmt.portable-render.v2'
});
function getRmtClassicAstSchema() { return JSON.parse(JSON.stringify(schema)); }

function validateRmtClassicAst(ast, options = {}) {
  const diagnostics = [];
  function reject(message, pointer, node, rule = 'structure') {
    if (diagnostics.length >= 64) return;
    diagnostics.push({ schema: 'xtend.rmt.linter.diagnostic.v1', source: 'rmt-language',
      code: 'rmt.vnext.ast.invalid', severity: 'error', message, rule,
      uri: options.sourceModel?.uri || options.uri || null, file: options.sourceModel?.filePath || options.filePath || null,
      pointer: pointer || '/', range: rule === 'data' ? null : node?.range || null });
  }
  const ancestors = new Set();
  function data(value, pointer, owner) {
    if (value === null || ['string', 'boolean'].includes(typeof value) || typeof value === 'number' && Number.isFinite(value)) return;
    if (!value || typeof value !== 'object' || ancestors.has(value)) { reject('AST requires finite, acyclic JSON data.', pointer, owner, 'data'); return; }
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value) ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) {
      reject('AST requires plain records and arrays.', pointer, owner, 'data'); return;
    }
    if (Array.isArray(value) && Object.keys(value).length !== value.length) {
      reject('AST arrays must be dense indexed JSON data.', pointer, owner, 'data'); return;
    }
    ancestors.add(value);
    for (const key of Reflect.ownKeys(value)) {
      if (Array.isArray(value) && key === 'length') continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      const child = `${pointer}/${pointerPart(key)}`;
      if (Array.isArray(value) && (typeof key !== 'string' || !/^(?:0|[1-9][0-9]*)$/u.test(key) || Number(key) >= value.length)) {
        reject('AST arrays cannot contain additional fields.', child, owner, 'data'); continue;
      }
      if (typeof key !== 'string' || !descriptor.enumerable || !('value' in descriptor)) reject('AST cannot contain accessors, symbols or hidden fields.', child, owner, 'data');
      else data(descriptor.value, child, value);
    }
    ancestors.delete(value);
  }
  data(ast, '', null);
  if (diagnostics.length) return diagnostics;
  function resolved(rule) { return rule.$ref ? schema.definitions[rule.$ref.split('/').pop()] : rule; }
  function matchesDiscriminator(value, rule) {
    rule = resolved(rule);
    if (value && typeof value === 'object' && rule.properties) {
      return ['type', 'kind'].every(key => !Object.hasOwn(rule.properties[key] || {}, 'const') || value[key] === rule.properties[key].const);
    }
    return true;
  }
  function check(value, rule, pointer, owner) {
    if (diagnostics.length >= 64) return;
    rule = resolved(rule);
    const alternatives = rule.oneOf || rule.anyOf;
    if (alternatives) {
      const candidates = alternatives.filter(candidate => matchesDiscriminator(value, candidate));
      let best;
      for (const candidate of candidates) {
        const start = diagnostics.length;
        check(value, candidate, pointer, owner);
        const errors = diagnostics.splice(start);
        if (!errors.length) return;
        if (!best || errors.length < best.length) best = errors;
      }
      if (best) diagnostics.push(...best);
      else reject('Unknown AST node or expression variant in this context.', pointer, owner);
      return;
    }
    if (Object.hasOwn(rule, 'const') && value !== rule.const) reject(`Expected ${JSON.stringify(rule.const)}.`, pointer, owner);
    if (rule.enum && !rule.enum.includes(value)) reject(`Expected one of ${rule.enum.map(JSON.stringify).join(', ')}.`, pointer, owner);
    if (!rule.type) return;
    const types = Array.isArray(rule.type) ? rule.type : [rule.type];
    const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    if (!types.includes(actual) && !(types.includes('integer') && Number.isInteger(value))) {
      reject(`Expected ${types.join(' or ')}, received ${actual}.`, pointer, owner); return;
    }
    if (typeof value === 'string' && value.length < (rule.minLength || 0)) reject('Value must not be empty.', pointer, owner);
    if (typeof value === 'number' && rule.minimum !== undefined && value < rule.minimum) reject(`Expected a number >= ${rule.minimum}.`, pointer, owner);
    if (Array.isArray(value)) {
      if (value.length < (rule.minItems || 0) || rule.maxItems !== undefined && value.length > rule.maxItems) reject('Wrong number of items.', pointer, owner);
      value.forEach((entry, index) => check(entry, rule.items, `${pointer}/${index}`, owner));
    } else if (actual === 'object') {
      const node = typeof value.type === 'string' && value.type.startsWith('Rmt') ? value : owner;
      for (const key of rule.required || []) if (!Object.hasOwn(value, key)) reject(`Missing required field ${key}.`, `${pointer}/${pointerPart(key)}`, node);
      for (const [key, child] of Object.entries(value)) {
        const at = `${pointer}/${pointerPart(key)}`;
        if (!Object.hasOwn(rule.properties, key)) reject(`Unknown field ${key}.`, at, node);
        else check(child, rule.properties[key], at, node);
      }
    }
  }
  check(ast, schema, '', ast);
  if (diagnostics.length) return diagnostics;
  validateRelationships(ast, reject);
  return diagnostics;
}

function validateRelationships(ast, reject) {
  function unique(entries, key, pointer, owner) {
    const first = new Set();
    entries.forEach((entry, index) => {
      const value = key(entry);
      if (value === undefined) return;
      if (first.has(value)) reject(`Duplicate ${value}.`, `${pointer}/${index}`, owner, 'cardinality');
      first.add(value);
    });
  }
  function walk(value, pointer, expressionContext = null, owner = value) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach((entry, index) => walk(entry, `${pointer}/${index}`, expressionContext, owner)); return; }
    const node = value.type?.startsWith('Rmt') ? value : owner;
    if (value.type === 'RmtConditionClause') expressionContext = 'condition';
    if (['RmtSelectorWhereClause', 'RmtSelectorFindClause'].includes(value.type)) expressionContext = 'selector';
    if (value.type === 'RmtSelectorExpression' && expressionContext !== 'selector') reject('Selector expression outside a selector predicate.', pointer, node, 'context');
    if (node === value && value.astPointer !== undefined && value.astPointer !== (pointer || '/')) reject('AST pointer disagrees with its canonical tree position.', `${pointer}/astPointer`, node, 'coherence');
    if (Array.isArray(value.path) && typeof value.value === 'string' && value.path.join('.') !== value.value) reject('Path and value disagree.', pointer, node, 'coherence');
    if (value.type === 'RmtIdentifier' && value.parts && value.parts.join('.') !== value.value) reject('Identifier parts and value disagree.', pointer, node, 'coherence');
    if (expressionContext === 'selector' && value.kind === 'path' && ['RmtConditionExpression', 'RmtSelectorExpression'].includes(value.type)) {
      if (!['item', 'record', 'state', 'selector', 'input'].includes(value.path[0]) || ['state', 'selector'].includes(value.path[0]) && value.path.length < 2) reject('Invalid selector operand scope.', pointer, node, 'operand');
      if (value.path.some(part => part.split('.').some(segment => ['__proto__', 'prototype', 'constructor'].includes(segment)))) reject('Unsafe selector operand path.', pointer, node, 'operand');
    }
    for (const [field, helper] of [['name', 'nameNode'], ['target', 'targetNode'], ['key', 'keyNode'], ['ref', 'refNode'], ['path', 'pathNode'],
      ['event', 'eventNode'], ['action', 'actionNode'], ['field', 'fieldNode'], ['by', 'byNode'], ['phase', 'phaseNode'],
      ['mode', 'modeNode'], ['effect', 'effectNode'], ['effectKind', 'effectKindNode'], ['policy', 'policyNode'], ['lane', 'laneNode'], ['algorithm', 'algorithmNode']]) {
      if (typeof value[field] === 'string' && value[helper]?.type === 'RmtIdentifier' && value[field] !== value[helper].value) reject(`${field} and ${helper} disagree.`, `${pointer}/${helper}`, node, 'coherence');
    }
    if (value.valueNode) {
      const field = ['value', 'preset', 'effect', 'policy'].find(key => typeof value[key] === 'string');
      if (field && value[field] !== value.valueNode.value) reject(`${field} and valueNode disagree.`, `${pointer}/valueNode`, node, 'coherence');
    }
    if (value.type === 'RmtEffectStatement' && value.componentCommand && (value.componentCommand.command !== value.effectKind
      || value.componentCommand.target !== value.source?.value || value.source?.kind !== 'selector')) reject('Component command and effect source disagree.', pointer, node, 'coherence');
    if (value.range) {
      const { start, end, startOffset, endOffset } = value.range;
      if (end.line < start.line || end.line === start.line && end.character < start.character || startOffset !== undefined && endOffset !== undefined && endOffset < startOffset) reject('Reversed source range.', `${pointer}/range`, node, 'range');
    }
    if (value.type === 'RmtSelectorDeclaration') {
      unique(value.body, child => ['RmtSelectorFindClause', 'RmtSelectorSortClause', 'RmtSelectorOutputClause'].includes(child.type) ? child.type : undefined, `${pointer}/body`, node);
    }
    if (value.type === 'RmtPrimitiveValue' && value.kind === 'object') unique(value.fields, field => field.key, `${pointer}/fields`, node);
    if (['RmtObjectValueField', 'RmtInitialValueEntry'].includes(value.type) && ['__proto__', 'prototype', 'constructor'].includes(value.key)) reject('Unsafe object key.', pointer, node, 'operand');
    if (value.type === 'RmtInitialBlock') unique(value.body, entry => entry.key, `${pointer}/body`, node);
    if (value.type === 'RmtActionDeclaration') unique(value.body, child => child.type === 'RmtActionInputClause' ? child.name : undefined, `${pointer}/body`, node);
    if (value.type === 'RmtEventPayloadBlock') unique(value.body, child => child.type === 'RmtEventPayloadMapping' ? child.name : undefined, `${pointer}/body`, node);
    const repeatable = {
      RmtStateDeclaration: [], RmtDataSourceDeclaration: [], RmtAnimationDeclaration: ['RmtAnimationKeyframeClause'],
      RmtValidationDeclaration: ['RmtValidationTargetClause', 'RmtValidationFieldClause', 'RmtValidationIncludeClause'],
      RmtTransitionDeclaration: [], RmtResourceDeclaration: [], RmtRemoteSurfaceDeclaration: ['RmtRemoteExposeClause', 'RmtRemoteEventClause'],
      RmtRemoteEventClause: [], RmtSurfaceDeclaration: ['RmtLaneDeclaration', 'RmtEventBinding', 'RmtSurfaceDestroyClause']
    }[value.type];
    if (repeatable) unique(value.body, child => repeatable.includes(child.type) ? undefined : child.type, `${pointer}/body`, node);
    if (value.type === 'RmtStateDeclaration' && value.initial && value.body.length) reject('State cannot combine inline initial and an initial block.', pointer, node, 'alternative');
    if (value.type === 'RmtSurfaceDeclaration') unique(value.metadata, child => child.keyword, `${pointer}/metadata`, node);
    if (value.type === 'RmtActionDeclaration') unique(value.body, child => child.type === 'RmtActionStatusClause' ? child.type : undefined, `${pointer}/body`, node);
    if (value.type === 'RmtSearchSourceDeclaration') unique(value.body, child => child.type === 'RmtSearchWeightClause' ? `weight:${child.field}`
      : child.type === 'RmtSearchValueClause' ? `value:${child.keyword}` : child.type, `${pointer}/body`, node);
    if (value.type === 'RmtHydrationPolicy' && [value.policy, value.mode, value.insularHydration].filter(entry => entry !== null).length !== 1) reject('Hydration clause requires exactly one policy, mode or insular value.', pointer, node, 'alternative');
    if (value.type === 'RmtResumabilityPolicy' && [value.mode, value.snapshot, value.eventReplay, value.integrity].filter(entry => entry !== null).length !== 1) reject('Resumability clause requires exactly one value.', pointer, node, 'alternative');
    if (value.type === 'RmtIsolationPolicy' && [value.boundary, value.mode].filter(entry => entry !== null).length !== 1) reject('Isolation clause requires exactly one boundary or mode.', pointer, node, 'alternative');
    const attributes = { RmtPortalDeclaration: ['root', 'layer', 'z'], RmtOverlayDeclaration: ['kind', 'portal'], RmtResourceDeclaration: ['kind', 'owner', 'source'] }[value.type];
    if (attributes) {
      unique(value.attributes, entry => entry.keyword, `${pointer}/attributes`, node);
      value.attributes.forEach((entry, index) => { if (!attributes.includes(entry.keyword)) reject('Attribute is not allowed in this declaration.', `${pointer}/attributes/${index}`, entry, 'context'); });
    }
    for (const [key, child] of Object.entries(value)) {
      if (['range', 'astPointer', 'startToken', 'endToken', 'imports', 'templates', 'surfaces', 'remoteSurfaces'].includes(key)) continue;
      walk(child, `${pointer}/${pointerPart(key)}`, expressionContext, node);
    }
  }
  walk(ast, '');
  const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
  for (const [field, type] of [['imports', 'RmtImportDeclaration'], ['templates', 'RmtTemplateDeclaration'], ['surfaces', 'RmtSurfaceDeclaration'], ['remoteSurfaces', 'RmtRemoteSurfaceDeclaration']]) {
    if (ast[field] && JSON.stringify(stable(ast[field])) !== JSON.stringify(stable(ast.body.filter(node => node.type === type)))) reject(`Convenience index ${field} disagrees with body.`, `/${field}`, ast, 'coherence');
  }
}

module.exports = { RMT_CLASSIC_COMPILER_CONTRACT, getRmtClassicAstSchema, validateRmtClassicAst };
