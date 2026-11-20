// SPDX-License-Identifier: Apache-2.0
'use strict';
const {data,fields,clone,freeze}=require('./state-binding-contract');
const {assertNativeCanonicalData}=require('./native-data');
const projections=require('./state-binding-projection');
const {templatePath,expandRepeatScopes}=require('./repeat-scopes');
const {createNativeSurfaceViewValidation}=require('./native-surface-validation-core');
function createNativeSurfaceViewRuntime(profile) {
const {scopes,lifecycle,managed=false,registryFactory,validateComponentValues}=profile;
const {NATIVE_SURFACE_VIEW_API_VERSION,NATIVE_SURFACE_VIEW_SCHEMA,validateNativeSurfaceViewProgram,validateRoot,symbols,key,scalar,invalid,validated,booleanProperties,booleanAttributes}=createNativeSurfaceViewValidation(profile);
function snapshotData(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) invalid('Native Views require plain Model snapshots.');
  const result = {};
  for (const field of ['states', 'selectors']) {
    const descriptor = Object.getOwnPropertyDescriptor(input, field);
    if (!descriptor && field === 'selectors') { result.selectors = {}; continue; }
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) invalid('Native Model snapshots cannot invoke accessors.');
    fields(descriptor.value, Object.keys(descriptor.value || {}), 'Native Model symbols'); assertNativeCanonicalData(descriptor.value); result[field] = descriptor.value;
  }
  return result;
}
function materializeNativeSurfaceView(input, snapshot, root, restriction) {
  try {
    const program = validated.has(input) ? input : validateNativeSurfaceViewProgram(input), current = snapshotData(snapshot), header = program.render.nativeView;
    root = root === undefined ? program.render.root : root;
    assertNativeCanonicalData(root, true); validateRoot(root, program, symbols(program));
    const materialization = scopes.materializeNativeSurfaceScopes(program, current), admission = lifecycle.nativeOrchestrationLifecycleAdmission(program, current, restriction);
    const contract = scopes.validateNativeSurfaceScopes(program), scopeMap = new Map(contract.declarations.map(row => [row.surface, row]));
    const table = symbols(program), nativeKeys = new Set(), ids = new Set();
    const templates = new Map();
    function collect(node) { if (Array.isArray(node)) { node.forEach(collect); return; } if (!node || typeof node !== 'object') return;
      if (node.surface) templates.set(node.surface, node); if (node.children) collect(node.children);
      if (node.slots) node.slots.forEach(slot => collect(slot.children)); }
    const renderRoot = clone(root); collect(renderRoot);
    // Lexical native parents are explicit Source7 authority. Portal children
    // retain their physical compiler placement; ordinary nested children join
    // the parent template before either parent or child is instantiated.
    const nested = [...scopeMap.values()].filter(row => row.placement === 'nested' && row.parentId);
    function remove(node, id) { if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { for (let i = node.length - 1; i >= 0; i--) if (node[i]?.surface === id) node.splice(i, 1); else remove(node[i], id); return; }
      if (node.children) remove(node.children, id); if (node.slots) node.slots.forEach(slot => remove(slot.children, id)); }
    for (const row of nested) { const child = templates.get(row.surface), parent = templates.get(row.parentId); remove(renderRoot, row.surface); parent.children ||= []; parent.children.push(child); }
    function unique(declaration, keys) { const result = key(header.documentId, declaration, keys); if (nativeKeys.has(result)) invalid('Materialized native identities must be unique.'); nativeKeys.add(result); return result; }
    function value(marker, context, structured = false) { const resolved=marker.op === 'literal' ? marker.value : projections.evaluateProjection(scopes.scopeNativeProjection(marker.projection, context), current); if(structured){data(resolved);return resolved;} return scalar(resolved,'Native sink'); }
    function sink(marker, kind, name, context, component) {
      const structured = managed && component && kind === 'properties' && ['object','array','json'].includes(component.properties[name].type);
      const resolved = value(marker, context, structured);
      if (resolved !== null && (kind === 'attributes' && !(managed && component) && booleanAttributes.has(name) || !component && kind === 'properties' && booleanProperties.has(name)) && typeof resolved !== 'boolean') invalid('Native boolean sinks require Boolean or null values.');
      if (!component && kind === 'properties' && resolved !== null) {
        if (name === 'tabIndex' && !Number.isSafeInteger(resolved)) invalid('Native tabIndex requires a safe integer.');
        if (!booleanProperties.has(name) && !['tabIndex', 'value'].includes(name) && typeof resolved !== 'string') invalid('Native string properties require strings.');
        if (name === 'value' && !['string', 'number'].includes(typeof resolved)) invalid('Native value requires string or number.');
      }
      if (name === 'id' && resolved !== null) { if (ids.has(resolved)) invalid('Materialized DOM ids must be unique.'); ids.add(resolved); }
      return { op: 'literal', value: resolved };
    }
    function project(node, context = { repeat: [], keys: [], item: null, id: null }) {
      if (Array.isArray(node)) return node.flatMap(child => { const result = project(child, context); return Array.isArray(result) ? result : [result]; });
      if (node.surface) {
        const declaration = node.surface, scope = scopeMap.get(declaration);
        return materialization.instances.filter(row => row.surfaceId === declaration && admission[row.id] !== false && (!context.id || !scope.parentId || row.parentId === context.id)).map(row => {
          const result = { ...node, surface: row.id, id: 'surface:' + row.id, key: row.id, attributes: { ...node.attributes },
            bindings: (node.bindings || []).map(id => id + ':rmtx:' + JSON.stringify(row.keys)) };
          for (const name of ['data-rmt-surface', 'data-maraca-surface', 'data-rmt-primitive-id']) result.attributes[name] = { op: 'literal', value: row.id };
          // An omitted children field is the foreign provider's exclusive root.
          // Adding [] would direct the shared renderer to erase framework DOM.
          if (Object.hasOwn(node, 'children')) result.children = project(node.children, { ...row, item: row.record });
          return result;
        });
      }
      if (!node.nativeDeclarationId) return { ...node, ...(Object.hasOwn(node, 'children') ? { children: project(node.children, context) } : {}) };
      if (node.type === 'native-repeat') {
        const result = [];
        expandRepeatScopes(node.repeat, current, (keys, item) => result.push(...project(node.children, { ...context, repeat: node.repeat, keys, item })), { level: context.repeat?.length || 0, keys: context.keys, item: context.item }); return result;
      }
      if (node.type === 'native-when') {
        const enabled = projections.evaluateProjection(scopes.scopeNativeProjection(node.test, context), current);
        if (typeof enabled !== 'boolean') invalid('Native conditions require Boolean, not truthiness.');
        return enabled ? project(node.children, context) : [];
      }
      const identity = unique(node.nativeDeclarationId, context.keys);
      if (node.type === 'text') return { type: 'text', text: { op: 'literal', value: value(node.value, context) }, key: { op: 'literal', value: identity } };
      const component = node.type === 'native-component' ? table.components.get(node.tag) : null;
      const result = { type: component ? 'component' : 'element', ...(component ? { component: node.tag } : {}), tag: node.tag,
        key: { op: 'literal', value: identity }, attributes: {}, properties: {}, children: [] };
      for (const kind of ['attributes', 'properties']) for (const [name, marker] of Object.entries(node[kind] || {})) result[kind][name] = sink(marker, kind, name, context, component);
      if (managed && component) { validateComponentValues(component,Object.fromEntries(['attributes','properties'].map(kind=>[kind,Object.fromEntries(Object.entries(result[kind]).map(([name,marker])=>[name,marker.value]))]))); result.nativeBinding={declarationId:node.nativeDeclarationId,ref:node.ref,surfaceId:context.id,keys:context.keys.slice()}; }
      if(managed&&!component&&node.ref!==undefined)result.nativeRef={surfaceId:context.id,ref:node.ref,keys:context.keys.slice()};
      if (!component) result.children = project(node.children, context);
      else for (const slot of node.slots) for (const child of project(slot.children, context)) {
        if (slot.name === 'default') result.children.push(child);
        else if (['element', 'component'].includes(child.type)) result.children.push({ ...child, ...(managed && child.type === 'component' ? {nativeSlot:{ownerDeclarationId:node.nativeDeclarationId,name:slot.name}} : {}), attributes: { ...child.attributes, slot: { op: 'literal', value: slot.name } } });
        else {
          const wrapperId = unique(JSON.stringify(['slot-text', slot.nativeDeclarationId, child.key.value]), context.keys);
          result.children.push({ type: 'element', tag: 'span', key: { op: 'literal', value: wrapperId }, attributes: { slot: { op: 'literal', value: slot.name } }, children: [child] });
        }
      }
      return result;
    }
    return freeze(project(renderRoot));
  } catch (error) { if (error.code === 'rmt.native-view.invalid') throw error; invalid(error.message); }
}

/** Renderer capabilities come only from the validated compiled metadata.
 * Trusted operational ports may supply loading/hooks, never wider DOM grants. */
function createNativeComponentRegistry(input, supplied = null) {
  const program = validateNativeSurfaceViewProgram(input);
  if (managed) return registryFactory(program,supplied);
  const capabilities = new Map();
  for (const metadata of program.render.nativeView.components) capabilities.set(metadata.tag,
    Object.freeze({ properties: Object.freeze([...metadata.properties]) }));
  const registry = { resolveComponentCapability(tag) { return capabilities.get(tag) || null; } };
  for (const name of ['ensureTags', 'hydrate', 'bindComponentInstance', 'snapshot']) {
    const method = supplied?.[name];
    if (typeof method === 'function') registry[name] = method.bind(supplied);
  }
  return Object.freeze(registry);
}

const NATIVE_SURFACE_VIEW_RUNTIME = Object.freeze({ API_VERSION: NATIVE_SURFACE_VIEW_API_VERSION, NATIVE_VIEW_PROJECTION_API_VERSION: NATIVE_SURFACE_VIEW_API_VERSION,
  assertNativeCanonicalData, validateNativeViewProgram: validateNativeSurfaceViewProgram, materializeNativeView: materializeNativeSurfaceView,
  materializeSurfaceScopes: scopes.materializeNativeSurfaceScopes, resolveSurfaceInstance: scopes.resolveNativeSurfaceInstance,
  materializeNativeEvents: scopes.materializeNativeSurfaceEvents, scopeNativeEvent: scopes.scopeNativeEvent, createComponentRegistry: createNativeComponentRegistry });
return { createNativeComponentRegistry, NATIVE_SURFACE_VIEW_API_VERSION, NATIVE_SURFACE_VIEW_SCHEMA, NATIVE_SURFACE_VIEW_RUNTIME,
  NATIVE_ORCHESTRATION_VIEW_RUNTIME: NATIVE_SURFACE_VIEW_RUNTIME, assertNativeCanonicalData,
  validateNativeSurfaceViewProgram, validateNativeOrchestrationViewProgram: validateNativeSurfaceViewProgram,
  materializeNativeSurfaceView, materializeNativeOrchestrationView: materializeNativeSurfaceView };

}
module.exports = {createNativeSurfaceViewRuntime};
