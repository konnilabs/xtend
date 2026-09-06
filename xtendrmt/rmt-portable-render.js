import { createRmtStateSelectorRuntime } from './rmt-state-selector-runtime.js';
import { createRmtDomDescriptorRenderer } from './rmt-dom-descriptor-renderer.js';

export const RMT_PORTABLE_RENDER_SCHEMA = 'xtend.rmt.portable-render.v1';
// This is an execution capability list for existing descriptor expressions, not a language grammar.
const operators = new Set(['literal', 'const', 'static', 'path', 'fallback', 'concat', 'interpolate', 'slice', 'contains', 'includes', 'equals', 'eq', 'not-equals', 'neq', 'truthy', 'falsy', 'not', 'if', 'ternary', 'map', 'filter', 'reduce', 'countBy', 'count-by', 'formatBytes', 'bytes', 'formatDuration', 'duration']);
const nodes = new Set(['element', 'component', 'text', 'fragment', 'empty', 'slot', 'conditional', 'repeat']);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
const renderer = createRmtDomDescriptorRenderer({ documentTarget: { createElement: () => ({}) } });

export function validatePortableDescriptor(descriptor, pointer = '/descriptor') {
  const diagnostics = [];
  const ancestors = new Set();
  function walk(value, at, role = 'node') {
    if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint' || typeof value === 'number' && !Number.isFinite(value)) {
      diagnostics.push({ code: 'rmt.portable.value_unsupported', severity: 'error', pointer: at });
    } else if (value && typeof value === 'object') {
      if (ancestors.has(value)) { diagnostics.push({code:'rmt.portable.value_unsupported',severity:'error',pointer:at}); return; }
      ancestors.add(value);
      for (const key of Object.keys(value)) if (['__proto__', 'prototype', 'constructor'].includes(key)) diagnostics.push({ code: 'rmt.portable.unsafe_key', severity: 'error', pointer: `${at}/${key}` });
      const op = role === 'data' ? null : value.op || value.operator || value.format;
      if (op && !operators.has(op) && !(role === 'rule' && ['gt','gte','lt','lte','in'].includes(op))) diagnostics.push({ code: 'rmt.portable.operator_unsupported', severity: 'error', pointer: at, operator: op });
      if (['equals','eq','not-equals','neq'].includes(op)) {
        const structuredLiteral = expression => Array.isArray(expression) || expression && ['literal','const','static'].includes(expression.op) && expression.value !== null && typeof expression.value === 'object';
        if ([value.left,value.right,value.value].some(structuredLiteral)) diagnostics.push({code:'rmt.portable.structured_equality_unsupported',severity:'error',pointer:at,operator:op});
      }
      if (role === 'node' && typeof value.type === 'string' && !nodes.has(value.type)) diagnostics.push({ code: 'rmt.portable.node_unsupported', severity: 'error', pointer: at, type: value.type });
      if (role === 'node' && value.type === 'repeat' && value.item) diagnostics.push({ code: 'rmt.portable.template_ref_requires_lowering', severity: 'error', pointer: at });
      const literal = ['literal','const','static'].includes(op);
      for (const [key, child] of Object.entries(value)) walk(child, `${at}/${key}`, role === 'data' || literal && ['value','source'].includes(key) ? 'data' : Array.isArray(value) ? role : ['where','filter','rules'].includes(key) ? 'rule' : ['children', 'nodes', 'template', 'then', 'else', 'fallback'].includes(key) ? 'node' : 'value');
      ancestors.delete(value);
    }
  }
  walk(descriptor, pointer);
  return diagnostics;
}

export function createPortableRenderArtifact(input, options = {}) {
  const core = input.coreDocument || input.core || {};
  const defaults = {};
  for (const state of core.states || []) defaults[state.name || state.id] = state.initial ?? state.value ?? state.defaultValue ?? null;
  Object.assign(defaults, options.defaults || {});
  const descriptor = input.descriptor || input.orchestrationArtifacts?.render?.root;
  if (!descriptor) throw new Error('Portable SSR requires the compiler render descriptor.');
  const state = input.orchestrationArtifacts?.state || null;
  const diagnostics = validatePortableDescriptor(descriptor);
  if (diagnostics.some(diagnostic => ['rmt.portable.value_unsupported','rmt.portable.unsafe_key'].includes(diagnostic.code))) throw Object.assign(new Error('Render artifacts require safe JSON data; Node callbacks belong to the Node host/adapter.'),{diagnostics});
  if (state) for (const definition of [...(state.selectors || []), ...(state.derive || state.derived || [])]) {
    diagnostics.push(...validatePortableDescriptor(definition, `/state/${definition.id}`));
    if (definition.sort || definition.find || definition.transform || definition.expression) diagnostics.push({ code: 'rmt.portable.state_provider_unsupported', severity: 'error', pointer: `/state/${definition.id}` });
  }
  if (options.target !== 'node' && diagnostics.length) {
    const error = new Error(`PHP render target cannot execute ${diagnostics[0].pointer}: ${diagnostics[0].code}`);
    error.diagnostics = diagnostics;
    throw error;
  }
  return JSON.parse(JSON.stringify({ schema: RMT_PORTABLE_RENDER_SCHEMA, sourceRef: options.sourceRef || core.sourceRef || null, targets: diagnostics.length ? ['node'] : ['node', 'php'], inputs: options.inputs || Object.keys(defaults), defaults, descriptor, state }));
}

export function projectPortableRender(artifact, props = {}) {
  if (artifact?.schema !== RMT_PORTABLE_RENDER_SCHEMA) throw new Error('Unsupported portable render artifact.');
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
    const result = { ...input };
    if (own(input, 'text')) { const value = resolve(input.text, item); result.text = { op: 'literal', value: value == null || typeof value === 'object' ? '' : String(value) }; }
    for (const field of ['attributes', 'attrs', 'properties', 'props']) if (input[field]) result[field] = Object.fromEntries(Object.entries(input[field]).map(([key, value]) => [key, { op: 'literal', value: resolve(value, item) }]));
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
