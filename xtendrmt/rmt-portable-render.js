import { createRmtStateSelectorRuntime } from './rmt-state-selector-runtime.js';
import { createRmtDomDescriptorRenderer, RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA, RMT_DOM_DESCRIPTOR_RENDERER_LEGACY_SCHEMA } from './rmt-dom-descriptor-renderer.js';

export const RMT_PORTABLE_RENDER_SCHEMA = 'xtend.rmt.portable-render.v2';
export const RMT_PORTABLE_RENDER_LEGACY_SCHEMA = 'xtend.rmt.portable-render.v1';
// This is an execution capability list for existing descriptor expressions, not a language grammar.
const operators = new Set(['literal', 'const', 'static', 'path', 'fallback', 'concat', 'interpolate', 'slice', 'contains', 'includes', 'equals', 'eq', 'not-equals', 'neq', 'truthy', 'falsy', 'not', 'if', 'ternary', 'map', 'filter', 'reduce', 'countBy', 'count-by', 'formatBytes', 'bytes', 'formatDuration', 'duration']);
const nodeOnlyOperators = new Set(['uppercase', 'upper', 'lowercase', 'lower', 'replace', 'formatDateShort', 'dateShort']);
const modelOnlyOperators = new Set(['gt', 'gte', 'lt', 'lte', 'count', 'not-empty', 'empty', 'boolean', 'first']);
const ruleOperators = new Set(['equals', 'eq', 'not-equals', 'neq', 'truthy', 'falsy', 'gt', 'gte', 'lt', 'lte', 'in', 'contains', 'includes']);
const modelComputes = new Set(['count', 'countBy', 'count-by', 'not-empty', 'empty', 'boolean', 'first']);
const nodes = new Set(['element', 'component', 'text', 'fragment', 'empty', 'slot', 'conditional', 'repeat']);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
const renderer = createRmtDomDescriptorRenderer({ documentTarget: { createElement: () => ({}) } });
const pointerPart = value => String(value).replace(/~/gu, '~0').replace(/\//gu, '~1');

function renderTarget(target = 'php') {
  if (!['node', 'php'].includes(target)) throw new Error(`Unsupported portable render target: ${target}`);
  return target;
}

function validateJsonData(value, pointer) {
  const diagnostics = [];
  const ancestors = new Set();
  function walk(value, at) {
    if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint' || typeof value === 'number' && !Number.isFinite(value)) {
      diagnostics.push({ code: 'rmt.portable.value_unsupported', severity: 'error', pointer: at });
    } else if (value && typeof value === 'object') {
      if (ancestors.has(value)) { diagnostics.push({code:'rmt.portable.value_unsupported',severity:'error',pointer:at}); return; }
      ancestors.add(value);
      for (const [key, child] of Object.entries(value)) {
        const pointer = `${at}/${pointerPart(key)}`;
        if (['__proto__', 'prototype', 'constructor'].includes(key)) diagnostics.push({ code: 'rmt.portable.unsafe_key', severity: 'error', pointer });
        walk(child, pointer);
      }
      ancestors.delete(value);
    }
  }
  walk(value, pointer);
  return diagnostics;
}

function executionValidator(target, diagnostics) {
  function reject(code, pointer, context, detail = {}) {
    diagnostics.push({ code: `rmt.portable.${code}`, severity: 'error', pointer, target, context, ...detail });
  }
  function walk(value, at, role = 'node', model = false) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach((child, index) => walk(child, `${at}/${index}`, role, model)); return; }
    const context = role === 'node' ? 'render-node' : `${model ? 'model' : 'render'}-${role}`;
    const child = (key, nextRole = 'expression') => { if (own(value, key)) walk(value[key], `${at}/${pointerPart(key)}`, nextRole, model); };
    if (role === 'node') {
      const type = value.type || value.kind;
      if (type && !nodes.has(type)) reject('node_unsupported', at, context, { type });
      if (type === 'repeat' && value.item) reject('template_ref_requires_lowering', at, context);
      for (const key of ['children', 'nodes', 'template', 'node', 'then', 'else', 'fallback']) child(key, 'node');
      for (const key of ['text', 'source', 'test', 'when', 'key']) child(key);
      for (const key of ['attributes', 'attrs', 'properties', 'props', 'slots']) {
        for (const [name, entry] of Object.entries(value[key] || {})) walk(entry, `${at}/${key}/${pointerPart(name)}`, key === 'slots' ? 'node' : 'expression');
      }
      for (const key of ['class', 'className', 'classes']) child(key, 'classes');
      return;
    }
    if (role === 'classes') {
      for (const [key, entry] of Object.entries(value)) walk(entry, `${at}/${pointerPart(key)}`, 'expression', model);
      return;
    }
    const op = role === 'rule' ? value.op || value.operator : value.op || value.operator || value.kind || model && value.compute || value.format;
    const supported = role === 'rule' ? ruleOperators.has(op) : operators.has(op)
      || target === 'node' && (nodeOnlyOperators.has(op) || model && modelOnlyOperators.has(op));
    if (op && !supported) reject('operator_unsupported', at, context, { operator: op });
    if (target === 'php' && ['equals', 'eq', 'not-equals', 'neq'].includes(op)) {
      const structuredLiteral = expression => Array.isArray(expression) || expression
        && ['literal', 'const', 'static'].includes(expression.op || expression.operator || expression.kind || expression.format)
        && expression.value !== null && typeof expression.value === 'object';
      if ([value.left, value.right, value.value].some(structuredLiteral)) reject('structured_equality_unsupported', at, context, { operator: op });
    }
    if (role === 'rule') {
      for (const key of ['left', 'right', 'value']) child(key);
    } else if (['literal', 'const', 'static'].includes(op)) {
      // A literal may contain arbitrary op/type keys. Only a render fallback is evaluated.
      if (!model) child('fallback');
    } else {
      for (const key of ['value', 'from', 'source', 'left', 'right', 'search', 'item', 'replacement', 'start', 'end',
        'test', 'when', 'condition', 'then', 'else', 'fallback', 'values', 'parts', 'expression', 'key']) child(key);
      if (op === 'filter') for (const key of ['where', 'filter', 'rules']) child(key, 'rule');
    }
  }
  function state(config) {
    for (const domain of ['selectors', config?.derive ? 'derive' : 'derived']) {
      (config?.[domain] || []).forEach((definition, index) => {
        const at = `/state/${domain}/${index}`;
        if (target === 'php' && ['sort', 'find', 'transform', 'expression'].some(key => definition[key])) reject('state_provider_unsupported', at, 'model');
        if (domain === 'selectors' && definition.expression) reject('state_provider_unsupported', `${at}/expression`, 'model');
        if (definition.compute && (!modelComputes.has(definition.compute) || domain !== 'selectors' && definition.compute === 'first')) reject('operator_unsupported', `${at}/compute`, 'model', { operator: definition.compute });
        for (const key of ['from', 'transform', ...(domain === 'selectors' ? [] : ['expression'])]) walk(definition[key], `${at}/${key}`, 'expression', true);
        for (const key of ['where', 'filter', 'find']) walk(definition[key], `${at}/${key}`, 'rule', true);
        for (const key of ['map', 'slice']) {
          for (const field of key === 'map' ? ['expression', 'value'] : ['start', 'end']) walk(definition[key]?.[field], `${at}/${key}/${field}`, 'expression', true);
        }
      });
    }
  }
  return { walk, state };
}

export function validatePortableDescriptor(descriptor, pointer = '/descriptor', options = {}) {
  const target = renderTarget(options.target);
  const diagnostics = validateJsonData(descriptor, pointer);
  if (!diagnostics.length) executionValidator(target, diagnostics).walk(descriptor, pointer);
  return diagnostics;
}

function validateRenderInput(descriptor, state, defaults, target) {
  const diagnostics = validateJsonData({ descriptor, state, defaults }, '');
  if (diagnostics.length) return diagnostics;
  const validator = executionValidator(target, diagnostics);
  validator.walk(descriptor, '/descriptor');
  validator.state(state);
  return diagnostics;
}

function assertExecutable(diagnostics, target) {
  if (!diagnostics.length) return;
  const unsafe = diagnostics.some(diagnostic => ['rmt.portable.value_unsupported', 'rmt.portable.unsafe_key'].includes(diagnostic.code));
  throw Object.assign(new Error(unsafe ? 'Render artifacts require safe JSON data; Node callbacks belong to the Node host/adapter.'
    : `${target === 'node' ? 'Node' : 'PHP'} render target cannot execute ${diagnostics[0].pointer}: ${diagnostics[0].code}`), { diagnostics });
}

export function createPortableRenderArtifact(input, options = {}) {
  const target = renderTarget(options.target);
  const core = input.coreDocument || input.core || {};
  const defaults = {};
  for (const state of core.states || []) defaults[state.name || state.id] = state.initial ?? state.value ?? state.defaultValue ?? null;
  Object.assign(defaults, options.defaults || {});
  const descriptor = input.descriptor || input.orchestrationArtifacts?.render?.root;
  if (!descriptor) throw new Error('Portable SSR requires the compiler render descriptor.');
  const state = input.orchestrationArtifacts?.state || null;
  const nodeDiagnostics = validateRenderInput(descriptor, state, defaults, 'node');
  const phpDiagnostics = validateRenderInput(descriptor, state, defaults, 'php');
  assertExecutable(target === 'node' ? nodeDiagnostics : phpDiagnostics, target);
  const schema = options.schema || RMT_PORTABLE_RENDER_SCHEMA;
  if (![RMT_PORTABLE_RENDER_SCHEMA, RMT_PORTABLE_RENDER_LEGACY_SCHEMA].includes(schema)) throw new Error('Unsupported portable render contract.');
  const targets = [...(nodeDiagnostics.length ? [] : ['node']), ...(phpDiagnostics.length ? [] : ['php'])];
  return JSON.parse(JSON.stringify({ schema, ...(schema === RMT_PORTABLE_RENDER_SCHEMA ? { rendererSchema: RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA } : {}), sourceRef: options.sourceRef || core.sourceRef || null, targets, inputs: options.inputs || Object.keys(defaults), defaults, descriptor, state }));
}

export function projectPortableRender(artifact, props = {}) {
  if (![RMT_PORTABLE_RENDER_SCHEMA, RMT_PORTABLE_RENDER_LEGACY_SCHEMA].includes(artifact?.schema)) throw new Error('Unsupported portable render artifact.');
  const rendererSchema = artifact.schema === RMT_PORTABLE_RENDER_LEGACY_SCHEMA ? RMT_DOM_DESCRIPTOR_RENDERER_LEGACY_SCHEMA : artifact.rendererSchema;
  if (artifact.schema === RMT_PORTABLE_RENDER_SCHEMA && rendererSchema !== RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA) throw new Error('Unsupported portable renderer contract.');
  if (!Array.isArray(artifact.targets) || !artifact.targets.includes('node')) throw new Error('Unsupported portable Node render target.');
  assertExecutable(validateRenderInput(artifact.descriptor, artifact.state, artifact.defaults, 'node'), 'node');
  let model = { ...artifact.defaults };
  for (const name of artifact.inputs) if (own(props, name)) model[name] = props[name];
  if (artifact.state) {
    const runtime = createRmtStateSelectorRuntime({ ...artifact.state, initialState: model });
    if (runtime.listDiagnostics().some(d => ['error', 'fatal'].includes(d.severity))) throw new Error('Invalid page input state.');
    model = { ...model, ...runtime.snapshot().model };
  }
  const resolve = (value, item) => renderer.resolveValue(value, { model, item });
  function node(input, item) {
    if (Array.isArray(input)) return { type: 'fragment', children: input.map(value => node(value, item)) };
    if (input == null) return { type: 'empty' };
    if (typeof input !== 'object') return { type: 'text', text: input };
    const type = input.type || input.kind;
    if (type === 'conditional') {
      const key = input.test || input.when;
      const value = resolve(key, item);
      return node(typeof key === 'string' && key.startsWith('$') && value === key ? input.else || input.fallback : value ? input.then : input.else || input.fallback, item);
    }
    if (type === 'repeat') {
      const source = resolve(input.source, item);
      const keys = new Set();
      return { type: 'fragment', children: (Array.isArray(source) ? source : []).map((entry, index) => {
        const child = node(input.template || input.node || input.children || { type: 'text', text: '$item' }, entry);
        if (input.key) {
          const expression = String(input.key);
          const candidate = resolve(expression.startsWith('$') ? expression : `$item.${expression.replace(/^item\./u, '')}`, entry);
          const key = candidate == null || candidate === '' ? index : candidate;
          if (keys.has(String(key))) throw new Error(`Duplicate repeat key: ${key}`);
          keys.add(String(key));
          child.attributes = { ...child.attributes, 'data-rmt-key': key };
        }
        return child;
      }) };
    }
    const result = { ...input, ...(type ? { type } : {}) };
    if (own(input, 'text')) { const value = resolve(input.text, item); result.text = { op: 'literal', value: value == null || typeof value === 'object' ? '' : String(value) }; }
    for (const field of ['attributes', 'attrs', 'properties', 'props']) if (input[field]) result[field] = Object.fromEntries(Object.entries(input[field]).map(([key, value]) => [key, { op: 'literal', value: field === 'attributes' || field === 'attrs' ? renderer.resolveAttributeValue(value, {model,item,rendererSchema}) : resolve(value, item) }]));
    if (input.key) result.attributes = {...result.attributes, 'data-rmt-key': {op:'literal', value:resolve(input.key, item)}};
    const classes = renderer.resolveClasses([input.class, input.className, input.classes], {model,item});
    if (classes.length) result.attributes = {...result.attributes, class:{op:'literal', value:classes.join(' ')}};
    delete result.class; delete result.className; delete result.classes;
    for (const field of ['children', 'nodes']) if (input[field]) result[field] = (Array.isArray(input[field]) ? input[field] : [input[field]]).map(child => node(child, item));
    if (input.slots) result.slots = Object.fromEntries(Object.entries(input.slots).map(([key, value]) => [key, Array.isArray(value) ? value.map(child=>node(child,item)) : node(value, item)]));
    return result;
  }
  return { descriptor: node(artifact.descriptor), model };
}
