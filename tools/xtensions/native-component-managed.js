// SPDX-License-Identifier: Apache-2.0
'use strict';
const { data, fields, clone, freeze, segments } = require('./state-binding-contract');
const { validateCapturedNativeComponentMetadataV2, validateNativeComponentValuesV2, validateNativeComponentEventV2, validateNativeComponentCommandV2, validateNativeValueV2,canonical } = require('./native-component-contract-v2');
const MANAGED_NATIVE_CONTEXT = Symbol.for('xtend.native-component.managed.v2');
const MANAGED_NATIVE_CLASS = Symbol.for('xtend.native-component.class.v2');
const instances = new WeakMap(), handles = new Map();
let nextHandle = 0;
function assertNativeComponentClass(constructor, descriptor) {
  const marker = constructor && Object.getOwnPropertyDescriptor(constructor, MANAGED_NATIVE_CLASS);
  if (!marker || !('value' in marker) || marker.value?.apiVersion !== '2.0.0' || marker.value?.tag !== descriptor.tag || marker.writable || marker.configurable) throw new TypeError('The existing CustomElement class is not the pinned managed-compatible definition for ' + descriptor.tag + '.');
  return constructor;
}
function identity(owner, ref, keys) {
  data(owner); fields(owner, ['documentId', 'surfaceId', 'controllerId', 'generation'], 'Native owner');
  if (typeof owner.documentId !== 'string' || !owner.documentId || typeof owner.surfaceId !== 'string' || !owner.surfaceId || owner.controllerId !== undefined && (typeof owner.controllerId !== 'string' || !owner.controllerId) || !Number.isSafeInteger(owner.generation) || owner.generation < 0 || typeof ref !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(ref)) throw new TypeError('Native handles require an owning Surface, Controller generation and local ref.');
  segments(keys);
  return JSON.stringify([owner.documentId, owner.surfaceId, owner.controllerId || null, owner.generation, ref, keys]);
}
function resolveManagedComponent(element) { return instances.get(element)?.context || null; }
function alive(record) { return !record.disposed && !record.controller.signal.aborted && record.isCurrent() && handles.get(record.key) === record; }
function admitted(record) { return alive(record) && record.connected && !record.suspended && !record.activationFailed && record.isActive(); }
function active(record) { return admitted(record) && record.activityState; }
function assertLifetime(record) { if (!alive(record)) throw new TypeError('The native component handle no longer belongs to the current Surface generation.'); }
function assertCurrent(record) { assertLifetime(record); if (record.suspended) throw new TypeError('Native component activity is suspended.'); if (!active(record)) throw new TypeError('Native component activity is not admitted by its owner.'); }
function makeLease(record) {
  const signal=record.activityController.signal;
  return Object.freeze({ element: record.element, owner: record.owner, ref: record.ref, keys: record.keys, handle: record.handle, signal, isCurrent: () => alive(record), isAlive: () => alive(record), isActive: () => !signal.aborted&&active(record), resolveFile(handle) { assertCurrent(record); if(signal.aborted)throw new TypeError('File handle lease belongs to an aborted activity lifetime.'); if (!record.files.has(handle)) throw new TypeError('File handle is absent from this native component lifetime.'); return record.files.get(handle); } });
}
function synchronize(record) {
  const enabled=admitted(record);
  if(enabled===record.activityState)return enabled;
  record.activityState=enabled;
  if(enabled)record.activityController=new AbortController();else record.activityController.abort();
  const callbacks=enabled?record.activations:record.deactivations;
  try { for(const callback of [...callbacks])callback(); }
  catch(error){if(enabled){record.activationFailed=true;record.activityState=false;record.activityController.abort();for(const cleanup of [...record.deactivations]){try{cleanup();}catch{}}}throw error;}
  return enabled;
}
function dispatchCapability(record, capability, args) {
  assertCurrent(record); data(args);
  if (!record.descriptor.capabilities.includes(capability) || typeof record.ports.dispatch !== 'function') throw new TypeError('Native capability requires a trusted injected port: ' + capability);
  const lease=makeLease(record),result = record.ports.dispatch(capability, freeze(clone(args)), lease);
  if (result && typeof result.then === 'function') return Promise.resolve(result).then(value => { if (!active(record)||lease.signal.aborted) { value?.release?.(); assertCurrent(record);throw new TypeError('Native resource result belongs to an aborted activity lifetime.'); } return value; });
  return result;
}
function pickDeclared(value, rule, label) {
  if (value === null && rule.nullable) return null;
  if (rule.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(label + ' requires a DTO object.');
    const result = {};
    for (const [key, child] of Object.entries(rule.fields)) {
      const property = Object.getOwnPropertyDescriptor(value, key);
      if (!property) { if (!(rule.optional || []).includes(key)) throw new TypeError(label + '.' + key + ' is required.'); }
      else { if (!('value' in property)) throw new TypeError('Native DTO fields cannot be accessors.'); result[key] = pickDeclared(property.value, child, label + '.' + key); }
    }
    return result;
  }
  if (rule.type === 'array') { if (!Array.isArray(value)) throw new TypeError(label + ' requires an array.'); return value.map(item => pickDeclared(item, rule.items, label)); }
  validateNativeValueV2(value, rule, label); return clone(value);
}
function emit(record, event, payload) {
  assertLifetime(record);
  if (!active(record) || record.updating) return false;
  const spec = Object.hasOwn(record.descriptor.events, event) && record.descriptor.events[event];
  if (!spec) throw new TypeError('Undeclared native event.');
  data(payload);
  const dto = validateNativeComponentEventV2(record.descriptor, event, pickDeclared(payload, spec.payload, 'Native event DTO'));
  const bindings = record.bindings.filter(binding => binding.event === event);
  for (const binding of bindings) {
    if(binding.eventId!==undefined){if(typeof record.ports.isNativeEventEnabled!=='function')throw new TypeError('Compiled native events require their exact live Model condition port.');const enabled=record.ports.isNativeEventEnabled(binding.eventId,makeLease(record));if(typeof enabled!=='boolean')throw new TypeError('Native event conditions require a strict Boolean result.');if(!enabled)continue;}
    const mapped = {};
    for (const [field, path] of Object.entries(binding.payload)) {
      let value = dto;
      for (const part of path) { if (!value || typeof value !== 'object' || !Object.hasOwn(value, part)) throw new TypeError('Native intent projection is absent.'); value = value[part]; }
      mapped[field] = clone(value);
    }
    for (const [field, index] of Object.entries(binding.keyFields || {})) mapped[field] = record.keys[index];
    if (typeof record.ports.dispatchValidatedIntent !== 'function') throw new TypeError('Native intents require the Kernel/Fabric validated Action port.');
    const result = record.ports.dispatchValidatedIntent(binding.action, freeze(mapped), makeLease(record));
    if (result && typeof result.then === 'function') result.catch(error => report(record, error));
  }
  return bindings.length > 0;
}
function report(record, error) { if (active(record) && typeof record.ports.onError === 'function') record.ports.onError(error, makeLease(record)); }
function prepareNativeComponent(element, options) {
  if (!element || typeof element !== 'object' || !options || typeof options !== 'object') throw new TypeError('A native element and trusted preparation are required.');
  if (instances.has(element) || Object.hasOwn(element, MANAGED_NATIVE_CONTEXT)) throw new TypeError('A native component can only be prepared once.');
  const descriptor = validateCapturedNativeComponentMetadataV2(options.descriptor);
  if (!['ui', 'platform', 'demo'].includes(descriptor.role) || String(element.localName).toLowerCase() !== descriptor.tag) throw new TypeError('Only the matching captured CustomElement can be prepared.');
  assertNativeComponentClass(element.constructor, descriptor);
  const suppliedKeys = Object.hasOwn(options,'keys') ? options.keys : [];
  data(options.owner); segments(suppliedKeys);
  const owner = freeze(clone(options.owner)), keys = freeze(clone(suppliedKeys)), ref = options.ref;
  const key = identity(owner, ref, keys);
  if (handles.has(key)) throw new TypeError('Duplicate native ref in the same owning Surface and typed key tuple.');
  if (typeof options.isCurrent !== 'function' || options.isActive !== undefined && typeof options.isActive !== 'function') throw new TypeError('Native preparation requires the owning Controller generation fence and activity admission.');
  if (!options.isCurrent()) throw new TypeError('Native preparation belongs to a stale owning Controller.');
  if(options.signal?.aborted)throw new TypeError('Native preparation belongs to an aborted owner lifetime.');
  const controller = new AbortController();
  const activityController=new AbortController();activityController.abort();
  const record = { element, descriptor, owner, keys, ref, key, handle: 'native-' + (++nextHandle), controller,activityController,activityState:false,activations:new Set(),deactivations:new Set(),projectionValidators:new Set(),projections:new Set(),activationFailed:false,attributeBaselines:new Map(),propertyBaselines:new Map(),controlledAttributes:new Set(),controlledProperties:new Set(), isCurrent: options.isCurrent, isActive: options.isActive || (() => true), ports: options.ports || {}, commands: new Map(), files: new Map(), fileIds: new WeakMap(), cleanups: new Set(), bindings: [], listeners: [], updating: 0, suspended: false, disposed: false, connected: false };
  const context = Object.freeze({ apiVersion: '2.0.0', tag: descriptor.tag, owner, keys, ref, signal: controller.signal,
    isCurrent: () => alive(record), isAlive: () => alive(record), isActive: () => active(record), get activitySignal(){return record.activityController.signal;},isApplyingUpdate: () => record.updating > 0, acceptsEvent: event => Object.hasOwn(descriptor.events, event), emit: (event, payload) => emit(record, event, payload), request: (capability, args = {}) => dispatchCapability(record, capability, args),
    captureFile(file) { assertCurrent(record); const FileClass = element.ownerDocument?.defaultView?.File; if (!descriptor.capabilities.includes('file.read') || typeof FileClass !== 'function' || !(file instanceof FileClass)) throw new TypeError('File capture requires a real scoped File and the declared file.read capability.'); let handle = record.fileIds.get(file); if (!handle) { handle = record.handle + ':file-' + (record.files.size + 1); record.fileIds.set(file, handle); record.files.set(handle, file); } return freeze({ handle, name: file.name, type: file.type, size: file.size, lastModified: file.lastModified }); },
    registerCommand(name, handler) { assertLifetime(record); if (!Object.hasOwn(descriptor.commands, name) || typeof handler !== 'function' || record.commands.has(name)) throw new TypeError('A native command registration must match a unique captured command.'); record.commands.set(name, handler); return () => { if (record.commands.get(name) !== handler) return false; return record.commands.delete(name); }; },
    onCleanup(cleanup) { if (typeof cleanup !== 'function') throw new TypeError('Native cleanup must be a function.'); if (record.disposed) cleanup(); else record.cleanups.add(cleanup); return () => record.cleanups.delete(cleanup); },
    registerActivityHooks(hooks){assertLifetime(record);if(!hooks||typeof hooks.resume!=='function'||typeof hooks.suspend!=='function')throw new TypeError('Native activity hooks require explicit resume and suspend callbacks.');record.activations.add(hooks.resume);record.deactivations.add(hooks.suspend);if(record.activityState)hooks.resume();return()=>{record.activations.delete(hooks.resume);record.deactivations.delete(hooks.suspend);};},
    onActivation(callback){assertLifetime(record);if(typeof callback!=='function')throw new TypeError('Native activation hook must be a function.');record.activations.add(callback);if(record.activityState)callback();return()=>record.activations.delete(callback);},
    onDeactivation(callback){assertLifetime(record);if(typeof callback!=='function')throw new TypeError('Native deactivation hook must be a function.');record.deactivations.add(callback);return()=>record.deactivations.delete(callback);},
    registerProjectionValidator(callback){assertLifetime(record);if(typeof callback!=='function')throw new TypeError('Native projection validator must be a function.');record.projectionValidators.add(callback);return()=>record.projectionValidators.delete(callback);},
    onProjection(callback){assertLifetime(record);if(typeof callback!=='function')throw new TypeError('Native projection hook must be a function.');record.projections.add(callback);return()=>record.projections.delete(callback);},
    connect() { assertLifetime(record);record.connected = true;synchronize(record); },
    disconnect() { record.connected = false;synchronize(record); }
  });
  record.context = context;
  Object.defineProperty(element, MANAGED_NATIVE_CONTEXT, { value: context, configurable: false, enumerable: false, writable: false });
  instances.set(element, record); handles.set(key, record);
  const preparation=Object.getOwnPropertyDescriptor(element.constructor,MANAGED_NATIVE_CLASS).value.prepare;
  if(preparation!==undefined){try{if(typeof preparation!=='function')throw new TypeError('Native class preparation must be a pinned function.');const result=preparation(element,context);if(result&&typeof result.then==='function')throw new TypeError('Native class preparation must complete before attributes and connection.');}catch(error){disposeNativeComponent(element);throw error;}}
  if (options.signal) {
    if (options.signal.aborted) disposeNativeComponent(element);
    else { const abort = () => disposeNativeComponent(element); options.signal.addEventListener('abort', abort, { once: true }); record.cleanups.add(() => options.signal.removeEventListener('abort', abort)); }
  }
  return context;
}
function updateNativeComponent(element, input) {
  const record = instances.get(element); if (!record) throw new TypeError('Native component was not prepared.'); assertLifetime(record);
  // Validate the whole transaction before invoking the first author-visible setter.
  const checked = validateNativeComponentValuesV2(record.descriptor, input);
  const attributes=checked.attributes||{},properties=checked.properties||{};
  for(const name of Object.keys(attributes))if(!record.attributeBaselines.has(name))record.attributeBaselines.set(name,typeof element.getAttribute==='function'?element.getAttribute(name):null);
  for(const name of Object.keys(properties))if(!record.propertyBaselines.has(name)){const baseline=element[name];if(baseline!==undefined)data(baseline);record.propertyBaselines.set(name,baseline===undefined?undefined:clone(baseline));}
  const prospective={attributes:clone(attributes),properties:{}};
  if(record.projectionValidators.size||record.projections.size){for(const name of Object.keys(record.descriptor.properties)){const value=Object.hasOwn(properties,name)?properties[name]:record.controlledProperties.has(name)?record.propertyBaselines.get(name):element[name];if(value!==undefined){data(value);prospective.properties[name]=clone(value);}}freeze(prospective);for(const validate of [...record.projectionValidators]){const result=validate(prospective);if(result&&typeof result.then==='function')throw new TypeError('Native projection validation must complete synchronously.');}}
  record.updating++;
  try {
    for(const name of record.controlledAttributes)if(!Object.hasOwn(attributes,name)){const baseline=record.attributeBaselines.get(name);if(baseline===null)element.removeAttribute(name);else element.setAttribute(name,baseline);}
    for(const name of record.controlledProperties)if(!Object.hasOwn(properties,name)){const baseline=record.propertyBaselines.get(name);element[name]=baseline===undefined?undefined:clone(baseline);}
    for (const [name, value] of Object.entries(attributes)) {
      if (value === null || value === false) element.removeAttribute(name);
      else element.setAttribute(name, value === true ? '' : String(value));
    }
    for (const [name, value] of Object.entries(properties)) element[name] = clone(value);
    record.controlledAttributes=new Set(Object.keys(attributes));record.controlledProperties=new Set(Object.keys(properties));
    for(const project of [...record.projections]){const result=project(prospective);if(result&&typeof result.then==='function')throw new TypeError('Native projection commit hooks must complete synchronously.');}
  } finally { record.updating--; }
  return checked;
}
function bindNativeComponentEvents(element, bindings = []) {
  const record = instances.get(element); if (!record) throw new TypeError('Native event bindings require a prepared component.'); assertLifetime(record); data(bindings);
  if (!Array.isArray(bindings) || bindings.length > 128) throw new TypeError('Native event bindings must be bounded.');
  const seen = new Set(),manualEvents=new Set(),allEvents=new Set();
  const checked = bindings.map(binding => {
    fields(binding, ['event', 'action', 'payload', 'keyFields','eventId'], 'Native event binding');
    if (!Object.hasOwn(record.descriptor.events, binding.event) || typeof binding.action !== 'string' || !binding.action) throw new TypeError('Native event bindings require declared events and Actions.');
    if(binding.eventId!==undefined&&(typeof binding.eventId!=='string'||!binding.eventId||binding.eventId.trim()!==binding.eventId))throw new TypeError('Native compiled events require an exact event identity.');
    if(binding.eventId===undefined){if(allEvents.has(binding.event))throw new TypeError('Manual native bindings require unique event names.');manualEvents.add(binding.event);}else{if(seen.has(binding.eventId)||manualEvents.has(binding.event))throw new TypeError('Compiled native bindings require unique event IDs without ambiguous manual routes.');seen.add(binding.eventId);}allEvents.add(binding.event);
    fields(binding.payload, Object.keys(binding.payload || {}), 'Native event mapping');
    const payload = Object.fromEntries(Object.entries(binding.payload).map(([field, source]) => {
      if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(field) || ['constructor', 'prototype', '__proto__'].includes(field)) throw new TypeError('Unsafe native Action argument.');
      const path = Array.isArray(source) ? source : typeof source === 'string' ? source.split('.') : [];
      if (!path.length || path.some(part => typeof part !== 'string' || !/^[A-Za-z][A-Za-z0-9_]*$/.test(part) || ['constructor', 'prototype', '__proto__'].includes(part))) throw new TypeError('Native intent mapping requires a declared DTO path.');
      let rule = record.descriptor.events[binding.event].payload;
      for (const part of path) { if (rule.type !== 'object' || !Object.hasOwn(rule.fields, part)) throw new TypeError('Native intent mapping path is undeclared.'); rule = rule.fields[part]; }
      return [field, path];
    }));
    const keyFields = {};
    if (binding.keyFields !== undefined) {
      fields(binding.keyFields, Object.keys(binding.keyFields || {}), 'Native trusted key mappings');
      for (const [field, index] of Object.entries(binding.keyFields)) {
        if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(field) || ['constructor','prototype','__proto__'].includes(field) || Object.hasOwn(payload,field) || !Number.isSafeInteger(index) || index < 0 || index >= record.keys.length) throw new TypeError('Native trusted key mappings require unique fields and exact typed key indices.');
        keyFields[field] = index;
      }
    }
    return { event: binding.event, action: binding.action, payload, ...(Object.keys(keyFields).length ? {keyFields} : {}),...(binding.eventId===undefined?{}:{eventId:binding.eventId}) };
  });
  record.listeners.forEach(([event, listener]) => element.removeEventListener(event, listener)); record.listeners = [];
  record.bindings = freeze(clone(checked));
  for (const eventName of new Set(checked.map(binding=>binding.event))) {
    const listener = event => {
      if (event.target !== element || !active(record) || record.updating || record.suspended) return;
      try { const rule = record.descriptor.events[eventName].payload; const payload = pickDeclared({ detail: event.detail && typeof event.detail === 'object' ? event.detail : {} }, rule, 'Native DOM event'); emit(record, eventName, payload); }
      catch (error) { report(record, error); }
    };
    element.addEventListener(eventName, listener); record.listeners.push([eventName, listener]);
  }
  return record.bindings;
}
async function dispatchNativeComponentCommand(request, ports) {
  data(request); fields(request, ['owner', 'target', 'keys', 'command', 'args'], 'Native command request');
  const prefix = request.owner?.surfaceId + '.';
  if (typeof request.target !== 'string' || !request.target.startsWith(prefix)) throw new TypeError('Native command targets must name the owning Surface and local ref.');
  const key = identity(request.owner, request.target.slice(prefix.length), Object.hasOwn(request,'keys') ? request.keys : []), record = handles.get(key);
  if (!record) throw new TypeError('Native command target has no active scoped handle.'); assertCurrent(record);
  if (record.suspended) throw new TypeError('Native commands cannot target a suspended component.');
  const args = validateNativeComponentCommandV2(record.descriptor, request.command, Object.hasOwn(request,'args') ? request.args : {}), spec = record.descriptor.commands[request.command], handler = record.commands.get(request.command);
  if (!handler || typeof (ports || record.ports).dispatchComponentCommand !== 'function') throw new TypeError('Native command requires an explicit implementation and Kernel/Fabric command port.');
  // The authority port schedules the actual invocation; no reflective method lookup.
  const terminal=record.descriptor.role==='platform'&&spec.capability==='surface.command'&&['close','minimize','collapse'].includes(request.command),verifier=ports?.verifyNativeTerminalReceipt||record.ports.verifyNativeTerminalReceipt;
  let invoked = false,completion,terminalRaw;const lease=makeLease(record),assertOperation=()=>{assertCurrent(record);if(lease.signal.aborted)throw new TypeError('Native command belongs to an aborted activity lifetime.');};
  const verifyTerminal=raw=>{assertLifetime(record);if(typeof verifier!=='function'||verifier(request.command,raw,lease)!==true)throw new TypeError('Native terminal command requires its actual private Controller commit receipt.');};
  const invoke = () => { if (invoked) throw new TypeError('Native command invocation is single-use.'); invoked = true; completion=(async()=>{assertOperation(); const raw = await handler(args, lease), result = raw === undefined && spec.result.nullable ? null : raw;if(terminal){verifyTerminal(raw);terminalRaw=raw;}else assertOperation(); validateNativeValueV2(result, spec.result, 'Native command result'); return freeze(clone(result));})();completion.catch(()=>{});return completion; };
  const result = await (ports || record.ports).dispatchComponentCommand(spec.capability, Object.freeze({ target: request.target, command: request.command, args, invoke }), lease);
  if (!invoked) throw new TypeError('Native command authority port did not invoke its bound component operation.');const actual=await completion;if(terminal)verifyTerminal(terminalRaw);else assertOperation();validateNativeValueV2(result, spec.result, 'Native command result');if(canonical(result)!==canonical(actual))throw new TypeError('Native command authority port substituted the actual bound operation result.');return freeze(clone(actual));
}
function synchronizeNativeComponentActivity(element){const record=instances.get(element);if(!record)return false;assertLifetime(record);return synchronize(record);}
function suspendNativeComponent(element) { const record = instances.get(element); if (!record) return false; assertLifetime(record); record.suspended = true;synchronize(record); return true; }
function resumeNativeComponent(element) { const record = instances.get(element); if (!record) return false; assertLifetime(record); record.suspended = false;synchronize(record); return true; }
function disposeNativeComponent(element) {
  const record = instances.get(element); if (!record || record.disposed) return false;
  record.disposed = true;try{synchronize(record);}catch(error){try{record.ports.onError?.(error,makeLease(record));}catch{}}record.controller.abort(); handles.delete(record.key);
  record.listeners.forEach(([event, listener]) => element.removeEventListener(event, listener)); record.listeners = [];
  for (const cleanup of record.cleanups) { try { cleanup(); } catch (error) { if (typeof record.ports.onError === 'function') record.ports.onError(error, makeLease(record)); } }
  record.cleanups.clear(); record.commands.clear(); record.files.clear();record.activations.clear();record.deactivations.clear();record.projectionValidators.clear();record.projections.clear(); record.bindings = [];
  return true;
}
module.exports = { MANAGED_NATIVE_CONTEXT, MANAGED_NATIVE_CLASS, assertNativeComponentClass, prepareNativeComponent, resolveManagedComponent, updateNativeComponent, bindNativeComponentEvents, dispatchNativeComponentCommand, synchronizeNativeComponentActivity,suspendNativeComponent, resumeNativeComponent, disposeNativeComponent };
