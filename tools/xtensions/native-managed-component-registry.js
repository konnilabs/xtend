// SPDX-License-Identifier: Apache-2.0
'use strict';
const { data, fields, segments, freeze, clone } = require('./state-binding-contract');
const { validateNativeComponentValuesV2 } = require('./native-component-contract-v2');
const scopes = require('./native-managed-surface-scopes');
const bridge = require('./native-component-managed');
function createManagedNativeComponentRegistry(program, supplied = null) {
  const header = program.render.nativeView, metadata = new Map(header.components.map(row => [row.tag, row])), declarations = new Map(header.bindings.map(row => [row.declarationId, row]));
  const scopeContract = scopes.validateNativeSurfaceScopes(program), scopeMap = new Map(scopeContract.declarations.map(row => [row.surface, row]));
  const prepared = new WeakMap(),ownedElements=new Set(), slotAssignments = new Map();
  function slotChildren(nodes, owner, name) { for (const node of nodes) { if (node.type === 'native-component') slotAssignments.set(node.nativeDeclarationId,{ownerDeclarationId:owner,name}); else if (['native-repeat','native-when','fragment'].includes(node.type)) slotChildren(node.children||[],owner,name); } }
  function collect(node) { if(Array.isArray(node)){node.forEach(collect);return;} if(!node||typeof node!=='object')return; for(const slot of node.slots||[]){slotChildren(slot.children,node.nativeDeclarationId,slot.name);collect(slot.children);}collect(node.children); }
  collect(program.render.root);
  function validatePlatformAuthority(checked,values,context,element){
    if(checked.component.role!=='platform')return;
    const attributes=values?.attributes||{},properties=values?.properties||{};
    if(Object.hasOwn(attributes,'surface-id')&&attributes['surface-id']!==null&&attributes['surface-id']!==checked.binding.surfaceId)throw new TypeError('Native surface-id must retain the exact owning Surface instance.');
    if(Object.hasOwn(attributes,'manager-id')&&attributes['manager-id']!==null){
      const owner=element?bridge.resolveManagedComponent(element)?.owner:supplied?.nativeRuntimeHost?.resolve?.(freeze(clone(checked.binding)),context)?.owner;
      if(!owner||owner.documentId!==header.documentId||owner.surfaceId!==checked.binding.surfaceId||typeof owner.controllerId!=='string'||attributes['manager-id']!==owner.controllerId)throw new TypeError('Native manager-id must retain the actual owning Controller.');
    }
    if(checked.component.tag==='x-surface-portal'){
      const surface=program.surfaces.find(row=>row.id===checked.declaration.surface),portal=(program.portals||[]).find(row=>row.id===surface?.portal);
      if(!portal)throw new TypeError('Native Portal requires the owning Surface explicit compiled Portal.');
      if(Object.hasOwn(attributes,'portal-id')&&attributes['portal-id']!==null&&attributes['portal-id']!==portal.id)throw new TypeError('Native portal-id must retain its exact compiled Portal.');
      if(Object.hasOwn(attributes,'for')&&attributes.for!==null&&attributes.for!==(portal.root||''))throw new TypeError('Native Portal target must retain its exact compiled root.');
    }
    if(checked.component.tag==='x-router'&&Object.hasOwn(properties,'routes')){
      const routes=properties.routes,paths=new Set();
      if(routes.length>256)throw new TypeError('Native routes require a bounded local destination whitelist.');
      for(const route of routes){const path=route.path;if(!path||path.length>2048||!path.startsWith('/')||path.startsWith('//')||/[\\\u0000-\u001f\u007f]/u.test(path)||paths.has(path))throw new TypeError('Native routes require unique bounded local absolute paths.');const url=new URL(path,'https://native.invalid');if(url.origin!=='https://native.invalid'||url.pathname!==path||url.search||url.hash)throw new TypeError('Native routes must use canonical local path data without redirects or executable modules.');paths.add(path);}
    }
  }
  function descriptorRecord(descriptor, values) {
    const binding = descriptor?.nativeBinding; data(binding); fields(binding, ['declarationId', 'ref', 'surfaceId', 'keys'], 'Projected native component binding'); segments(binding.keys);
    const declaration = declarations.get(binding.declarationId), component = metadata.get(descriptor.tag || descriptor.component);
    if (!declaration || !component || declaration.tag !== component.tag || declaration.ref !== binding.ref || binding.keys.length !== declaration.repeat.length || !['component','element'].includes(descriptor.type) || descriptor.component !== component.tag || descriptor.tag !== component.tag) throw new TypeError('Projected native descriptor differs from its exact compiled component binding.');
    const ownerDepth = scopeMap.get(declaration.surface)?.repeat?.length || 0;
    if (binding.surfaceId !== scopes.resolveNativeSurfaceInstance(program, declaration.surface, binding.keys.slice(0, ownerDepth))) throw new TypeError('Projected native component owner differs from its exact typed Surface scope.');
    const slot = descriptor.nativeSlot;
    if (slot !== undefined) { data(slot);fields(slot,['ownerDeclarationId','name'],'Projected native slot assignment');const expected=slotAssignments.get(binding.declarationId);if(!expected||slot.ownerDeclarationId!==expected.ownerDeclarationId||slot.name!==expected.name||slot.name==='default'||descriptor.attributes?.slot?.op!=='literal'||descriptor.attributes.slot.value!==slot.name)throw new TypeError('Native slot assignment differs from its exact compiled owning slot.'); }
    const controlledValues = values === undefined ? undefined : { ...values, ...(values.attributes ? {attributes:Object.fromEntries(Object.entries(values.attributes).filter(([name])=>name!=='slot'||!slot))} : {}) };
    if (slot && values && values.attributes?.slot !== slot.name) throw new TypeError('Native slot values must retain the trusted owning assignment.');
    if (controlledValues !== undefined) validateNativeComponentValuesV2(component, controlledValues);
    return { binding, declaration, component, controlledValues, slot };
  }
  function eventBindings(declaration) {
    return header.events.filter(row => row.component === declaration.declarationId).map(row => {
      const payload = {}, keyFields = {};
      for (const [field, source] of Object.entries(row.payload)) {
        if (typeof source !== 'string' || !source.startsWith('$detail.')) throw new TypeError('Native component event payload requires explicit DTO detail paths.');
        const key = /^\$detail\.__rmtxScopedKeys\.k(\d+)$/.exec(source);
        if (key) keyFields[field] = Number(key[1]);
        else payload[field] = source.slice(1).split('.');
      }
      return { event: row.event, action: row.action, payload,eventId:row.eventId, ...(Object.keys(keyFields).length ? {keyFields} : {}) };
    });
  }
  const registry = {
    resolveComponentCapability(tag) { const row = metadata.get(tag); return row ? Object.freeze({properties:Object.freeze(Object.keys(row.properties)),managed:true}) : null; },
    validateNativeComponentDescriptor(descriptor, context, values) { const checked=descriptorRecord(descriptor, values);validatePlatformAuthority(checked,checked.controlledValues,context); return true; },
    prepareNativeComponent(element, component, descriptor, context) {
      const checked = descriptorRecord(descriptor);
      if (component?.tag !== checked.component.tag || element.localName !== checked.component.tag || typeof supplied?.nativeRuntimeHost?.resolve !== 'function') throw new TypeError('Source8 native preparation requires its captured tag and actual Controller host resolver.');
      const options = supplied.nativeRuntimeHost.resolve(freeze(clone(checked.binding)), context);
      if (!options || options.owner?.documentId !== header.documentId || options.owner?.surfaceId !== checked.binding.surfaceId || typeof options.isCurrent !== 'function' || typeof options.isActive !== 'function') throw new TypeError('Native host owner must match the exact projected document/Surface and real lifetime/activity fences.');
      validatePlatformAuthority(checked,undefined,context);
      bridge.prepareNativeComponent(element, { ...options, descriptor: checked.component, ref: checked.binding.ref, keys: checked.binding.keys });
      try { bridge.bindNativeComponentEvents(element, eventBindings(checked.declaration)); } catch(error) { bridge.disposeNativeComponent(element);throw error; }
      const handle = Object.freeze({ dispose() { ownedElements.delete(element);return bridge.disposeNativeComponent(element); } });
      prepared.set(element, handle);ownedElements.add(element); return handle;
    },
    updateNativeComponent(element, descriptor, context, values) { const checked=descriptorRecord(descriptor, values); if (!prepared.has(element)) throw new TypeError('Managed native updates require pre-attribute preparation.');validatePlatformAuthority(checked,checked.controlledValues,context,element); const result=bridge.updateNativeComponent(element, checked.controlledValues);if(checked.slot)element.setAttribute('slot',checked.slot.name);bridge.synchronizeNativeComponentActivity(element);return result; },
    bindComponentInstance(element, component, descriptor, context) {
      if(!metadata.has(component?.tag))return typeof supplied?.bindComponentInstance==='function'?supplied.bindComponentInstance(element,component,descriptor,context):null;
      const handle = prepared.get(element); if (!handle) throw new TypeError('Managed native binding cannot prepare an already-rendered component.');
      let external;
      if (typeof supplied?.bindComponentInstance === 'function') external = supplied.bindComponentInstance(element, component, descriptor, context);
      let disposed=false;
      return Object.freeze({ dispose() { if(disposed)return;disposed=true;try { external?.dispose?.(); } finally { handle.dispose(); } } });
    },
    synchronizeNativeComponents(){for(const element of [...ownedElements]){const context=bridge.resolveManagedComponent(element);if(!context?.isAlive()){prepared.get(element)?.dispose();continue;}bridge.synchronizeNativeComponentActivity(element);}return ownedElements.size;}
  };
  for (const method of ['ensureTags', 'hydrate', 'snapshot']) if (typeof supplied?.[method] === 'function') registry[method] = supplied[method].bind(supplied);
  return Object.freeze(registry);
}
module.exports = { createManagedNativeComponentRegistry };
