'use strict';

// A source contract, not a descriptor/JavaScript escape. All expressions use
// the same finite projection grammar as controlled XTension props.
const { data, fields, name, segments, clone, freeze } = require('../xtensions/state-binding-contract');
const { visitProjection } = require('../xtensions/state-binding-projection');
const RMTX_NATIVE_ORCHESTRATION_VIEW_API_VERSION = '2.0.0';
const RMTX_NATIVE_ORCHESTRATION_VIEW_SCHEMA = 'xtend.rmtx.native-view.v2';
const RMT_NATIVE_ORCHESTRATION_VIEW_SCHEMA = 'xtend.rmt.native-view.v2';
const RMTX_NATIVE_ORCHESTRATION_VIEW_DEPENDENCIES_SCHEMA = 'xtend.rmtx.native-view-dependencies.v2';
const RMTX_NATIVE_VIEW_API_VERSION = '1.0.0';
const RMTX_NATIVE_VIEW_SCHEMA = 'xtend.rmtx.native-view.v1';
const RMT_NATIVE_VIEW_SCHEMA = 'xtend.rmt.native-view.v1';
const RMTX_NATIVE_VIEW_DEPENDENCIES_SCHEMA = 'xtend.rmtx.native-view-dependencies.v1';

function fail(message, pointer = '') {
  throw Object.assign(new TypeError(message), { code: 'rmtx.native-view.invalid',
    diagnostics: [{ code: 'rmtx.native-view.invalid', severity: 'error', message, pointer }] });
}
function guards() { return require('../xtensions/native-view-projection'); }
function scopeChain(value) {
  if (!Array.isArray(value) || !value.length || value.length > 32) fail('Native repeats require a nonempty canonical scope chain.');
  value.forEach((scope, index) => {
    fields(scope, index ? ['path', 'key'] : ['state', 'path', 'key'], 'Native repeat scope');
    if (!index) name(scope.state);
    segments(scope.path); segments(scope.key);
    if (!scope.key.length || scope.key.some(part => typeof part !== 'string')) fail('Native repeat keys require a nonempty direct item path.');
    if (scope.path.some(part => typeof part !== 'string')) fail('Native repeat sources require direct property paths.');
  });
}
function expression(value, scopes, symbols, reads, structured = false) {
  visitProjection(value, node => {
    if (!structured && (node.kind === 'object' || node.kind === 'array')) fail('Native text, attributes, properties and conditions use scalar projections only.');
    if (node.kind === 'literal') {
      if (node.value !== null && !['string', 'number', 'boolean'].includes(typeof node.value)) fail('Native literals must be finite JSON scalars.');
      return;
    }
    if (node.kind !== 'path') return;
    if (symbols && !(node.root === 'state' ? symbols.states : symbols.selectors).has(node.symbol)) fail('A native projection references an undeclared Model/selector symbol.');
    if (!Array.isArray(node.path)) fail('Native projection paths must be segment arrays.');
    const markers = node.path.filter(part => part && typeof part === 'object');
    if (markers.length) {
      for (const marker of markers) { fields(marker, ['repeat'], 'Native repeat path marker'); if (!Number.isSafeInteger(marker.repeat) || marker.repeat < 0 || Object.is(marker.repeat, -0)) fail('Native repeat markers require nonnegative canonical indices.'); }
      if (node.root !== 'state' || !scopes.length || node.symbol !== scopes[0].state) fail('Native item paths require their declared repeat Model.');
      const prefix = scopes.flatMap((scope, index) => [...scope.path, { repeat: index }]);
      if (markers.length !== scopes.length || JSON.stringify(node.path.slice(0, prefix.length)) !== JSON.stringify(prefix)) fail('Native item paths must retain their full canonical parent scope.');
      segments(node.path.slice(prefix.length));
    } else segments(node.path);
    if (reads) reads.set(JSON.stringify(node), { root: node.root, symbol: node.symbol, path: clone(node.path) });
  });
}
function wrap(value) {
  return value.kind === 'literal' ? { op: 'literal', value: value.value } : { op: 'native-projection', projection: clone(value) };
}
function validateNativeViewContract(contract, appPlatform = null) { return validateNativeViewProfile(contract, appPlatform, false); }
function validateRmtxNativeOrchestrationViewContract(contract, appPlatform = null, context = {}) { return validateNativeViewProfile(contract, appPlatform, true, context); }
function validateRmtxManagedNativeViewContract(contract, appPlatform = null, context = {}) {return validateNativeViewProfile(contract,appPlatform,true,context,true);}
function validateNativeViewProfile(contract, appPlatform, orchestration, context = {}, managed = false) {
  data(contract); fields(contract, managed ? ['schema','sourceProfile','documentId','views','components','scopes','eventKeys','bindings','events','commands'] : orchestration ? ['schema','sourceProfile','documentId','views','components','scopes','eventKeys'] : ['schema', 'sourceProfile', 'documentId', 'views'], 'Native view source contract');
  fields(contract.sourceProfile, ['syntax', 'version'], 'Native view source profile');
  if (contract.schema !== (managed ? 'xtend.rmtx.native-view.v3' : orchestration ? RMTX_NATIVE_ORCHESTRATION_VIEW_SCHEMA : RMTX_NATIVE_VIEW_SCHEMA) || contract.sourceProfile.syntax !== 'rmtx' || contract.sourceProfile.version !== (managed ? '8.0.0' : orchestration ? '7.0.0' : '5.0.0')) fail('Native views require the explicit RMTX5 source contract.');
  name(contract.documentId);
  if (!Array.isArray(contract.views) || contract.views.length > 256) fail('Native views require a bounded views array.');
  const symbols = appPlatform ? { states: new Set((appPlatform.state || []).map(value => value.id)), selectors: new Set((appPlatform.selectors || []).map(value => value.id)) } : null;
  const surfaces = appPlatform ? new Map((appPlatform.surfaces || []).map(value => [value.id, value])) : null;
  const seenSurfaces = new Set(), seenNodes = new Set(), dependencies = [], compiled = new Map();
  const { NATIVE_VIEW_TAG_NAMES, NATIVE_VIEW_VOID_TAG_NAMES, assertNativeAttributeName, assertNativePropertyName, assertNativeDomId } = guards();
  const componentContract = managed ? require('../xtensions/native-component-contract-v2') : orchestration ? require('../xtensions/native-component-contract') : null;
  const componentRecords = managed ? require('./rmtx-native-components-v2').validateRmtxNativeComponentsV2(contract.components) : orchestration ? require('./rmtx-native-components').validateRmtxNativeComponents(contract.components) : [];
  const publicComponents = new Map(componentRecords.map(record => [record.tag, record]));
  const scoped = new Map();
  if (orchestration) {
    if (!Array.isArray(contract.scopes) || contract.scopes.length > 256 || !Array.isArray(contract.eventKeys) || contract.eventKeys.length > 1024) fail('Source7 requires bounded scopes and event key declarations.');
    for (const scope of contract.scopes) {
      fields(scope,['surface','repeat','presence','parent','placement'],'Native Surface scope'); name(scope.surface);
      if(scoped.has(scope.surface)||surfaces&&!surfaces.has(scope.surface)||!scope.repeat&&!scope.presence&&!scope.parent)fail('Native scopes require distinct existing Surface declarations and real repeat/presence rules.');
      if(scope.parent){name(scope.parent);if(scope.parent===scope.surface||surfaces&&!surfaces.has(scope.parent))fail('Native scope parents require a distinct declared Surface.');}
      if(scope.placement!==undefined&&!['nested','portal'].includes(scope.placement))fail('Native scope placement must be nested or portal.');
      if(scope.repeat){scopeChain(scope.repeat); if(symbols&&!symbols.states.has(scope.repeat[0].state))fail('Native Surface repeat references an undeclared state.');}
      if(scope.presence){fields(scope.presence,['state','path'],'Surface presence');expression({kind:'path',root:'state',symbol:scope.presence.state,path:scope.presence.path},scope.repeat||[],symbols);}
      scoped.set(scope.surface,scope);
    }
    const events=new Set();
    for(const declaration of contract.eventKeys){
      fields(declaration,['astPointer','surface','fields'],'Native scoped event keys'); name(declaration.surface);
      if(typeof declaration.astPointer!=='string'||!/^\/body\/\d+(?:\/body\/\d+)*$/u.test(declaration.astPointer)||events.has(declaration.astPointer))fail('Scoped native events require exact distinct AST provenance.');
      events.add(declaration.astPointer);const scope=scoped.get(declaration.surface);
      if(!scope?.repeat?.length||!declaration.fields||typeof declaration.fields!=='object'||Array.isArray(declaration.fields)||!Object.keys(declaration.fields).length)fail('Event keys require a repeated native owning Surface.');
      for(const [field,index]of Object.entries(declaration.fields))if(!/^[A-Za-z_$][\w$-]*$/u.test(field)||['__proto__','prototype','constructor'].includes(field)||!Number.isSafeInteger(index)||index<0||Object.is(index,-0)||index>=scope.repeat.length)fail('Native event key fields require declared ancestor key indices.');
    }
  }
  let count = 0;
  function children(nodes, scopes, reads, depth) {
    if (!Array.isArray(nodes) || depth > 64) fail('Native children must be a bounded descriptor array.');
    return nodes.map(node => {
      if (++count > 50000) fail('Native views exceed the node budget.');
      fields(node, orchestration && node.type === 'native-component' ? (managed ? ['type','tag','attributes','properties','slots','nativeDeclarationId','ref','events'] : ['type','tag','attributes','properties','slots','nativeDeclarationId']) : node.type === 'element' ? ['type', 'tag', 'attributes', 'properties', 'children', 'nativeDeclarationId',...(managed?['ref']:[])]
        : node.type === 'text' ? ['type', 'value', 'nativeDeclarationId']
          : node.type === 'native-repeat' ? ['type', 'repeat', 'children', 'nativeDeclarationId']
            : node.type === 'native-when' ? ['type', 'test', 'children', 'nativeDeclarationId'] : [], 'Native node');
      name(node.nativeDeclarationId);
      if (seenNodes.has(node.nativeDeclarationId)) fail('Native declarations must have unique structural identities.');
      seenNodes.add(node.nativeDeclarationId);
      if (orchestration && node.type === 'native-component') {
        const metadata=publicComponents.get(node.tag);
        if(!metadata)fail('Public component tag is absent from the captured shipped metadata.');
        const output={type:'native-component',tag:node.tag,nativeDeclarationId:node.nativeDeclarationId,...(managed?{ref:node.ref,events:clone(node.events||[])}:{})};
        if(Object.hasOwn(node.attributes||{},'id')&&Object.hasOwn(node.properties||{},'id'))fail('A component DOM id uses exactly one source sink.');
        for(const field of ['attributes','properties']){
          fields(node[field]||{},Object.keys(node[field]||{}),'Public component scalar sinks');const values={};
          if(Object.keys(node[field]||{}).length>64)fail('Native component sinks exceed the bounded field map.');
          for(const [key,value]of Object.entries(node[field]||{})){
            if(!(managed?componentContract.nativeComponentSinkAllowedV2:componentContract.nativeComponentSinkAllowed)(metadata,key,field==='attributes'?'attribute':'property'))fail('Unknown or unsafe component field.');
            if(key==='id'){if(scopes.length||value.kind!=='literal')fail('Component DOM ids require an unscoped static literal.');assertNativeDomId(value.value);}
            expression(value,scopes,symbols,reads,managed&&field==='properties');values[key]=wrap(value);
          }
          if(Object.keys(values).length)output[field]=values;
        }
        if(Object.hasOwn(output.properties||{},'id')){output.attributes={...(output.attributes||{}),id:output.properties.id};delete output.properties.id;if(!Object.keys(output.properties).length)delete output.properties;}
        if(!Array.isArray(node.slots)||node.slots.length>metadata.slots.length)fail('Public component slots require a bounded declared list.');
        const names=new Set();
        output.slots=node.slots.map(slot=>{
          if(++count>50000)fail('Native slots exceed the total node budget.');
          fields(slot,['type','name','nativeDeclarationId','children'],'Public native slot');name(slot.nativeDeclarationId);
          if(slot.type!=='native-slot'||!metadata.slots.includes(slot.name)||names.has(slot.name)||seenNodes.has(slot.nativeDeclarationId))fail('Native slots require distinct captured names and structural identities.');
          names.add(slot.name);seenNodes.add(slot.nativeDeclarationId);
          return {type:'native-slot',name:slot.name,nativeDeclarationId:slot.nativeDeclarationId,children:children(slot.children,scopes,reads,depth+1)};
        });
        return output;
      }
      if (node.type === 'text') {
        expression(node.value, scopes, symbols, reads);
        return { type: 'text', nativeDeclarationId: node.nativeDeclarationId, value: wrap(node.value) };
      }
      if (node.type === 'native-when') {
        expression(node.test, scopes, symbols, reads);
        if (node.test.kind === 'literal' && typeof node.test.value !== 'boolean') fail('Native When requires a Boolean condition.');
        return { type: node.type, nativeDeclarationId: node.nativeDeclarationId, test: clone(node.test), children: children(node.children, scopes, reads, depth + 1) };
      }
      if (node.type === 'native-repeat') {
        scopeChain(node.repeat);
        if (node.repeat.length !== scopes.length + 1 || JSON.stringify(node.repeat.slice(0, -1)) !== JSON.stringify(scopes)) fail('Nested native repeats must extend the canonical parent scope once.');
        if (symbols && !symbols.states.has(node.repeat[0].state)) fail('Native repeat references an undeclared Model.');
        const source = node.repeat.slice(0, -1).flatMap((scope, index) => [...scope.path, { repeat: index }]);
        const read = { root: 'state', symbol: node.repeat[0].state, path: [...source, ...node.repeat.at(-1).path] };
        reads.set(JSON.stringify(read), read);
        const keyRead = { root: 'state', symbol: node.repeat[0].state, path: [...node.repeat.flatMap((scope, index) => [...scope.path, { repeat: index }]), ...node.repeat.at(-1).key] };
        reads.set(JSON.stringify(keyRead), keyRead);
        return { type: node.type, nativeDeclarationId: node.nativeDeclarationId, repeat: clone(node.repeat), children: children(node.children, node.repeat, reads, depth + 1) };
      }
      if (node.type !== 'element' || !NATIVE_VIEW_TAG_NAMES.includes(node.tag)) fail('Native Element requires an allowed HTML tag.');
      if (Object.hasOwn(node.attributes || {}, 'id') && Object.hasOwn(node.properties || {}, 'id'))
        fail('Native Element must declare a DOM id through exactly one source sink.');
      const output = { type: 'element', tag: node.tag, nativeDeclarationId: node.nativeDeclarationId,...(managed&&node.ref?{ref:node.ref}:{}) };
      for (const field of ['attributes', 'properties']) {
        fields(node[field] || {}, Object.keys(node[field] || {}), 'Native element fields');
        if (Object.keys(node[field] || {}).length > 64) fail('Native elements accept at most 64 fields per sink.');
        const values = {};
        for (const [key, value] of Object.entries(node[field] || {})) {
          (field === 'attributes' ? assertNativeAttributeName : assertNativePropertyName)(key);
          if (key === 'id' && scopes.length) fail('Repeated native elements cannot declare DOM ids.');
          if (key === 'id') {
            if (value.kind !== 'literal') fail('Native DOM ids must be literal strings or null.');
            assertNativeDomId(value.value);
          }
          expression(value, scopes, symbols, reads); values[key] = wrap(value);
        }
        if (Object.keys(values).length) output[field] = values;
      }
      // Portal composition sees one static DOM identity before render lowering.
      // Both source spellings use the canonical attributes.id compiled sink.
      if (Object.hasOwn(output.properties || {}, 'id')) {
        output.attributes = { ...(output.attributes || {}), id: output.properties.id };
        delete output.properties.id;
        if (!Object.keys(output.properties).length) delete output.properties;
      }
      if (!Array.isArray(node.children)) fail('Native element children must be an array.');
      if (NATIVE_VIEW_VOID_TAG_NAMES.includes(node.tag) && node.children.length) fail('Void HTML elements cannot have children.');
      output.children = children(node.children, scopes, reads, depth + 1);
      return output;
    });
  }
  for (const view of contract.views) {
    fields(view, orchestration ? ['surface','repeat','children'] : ['surface', 'children'], 'Native source view'); name(view.surface);
    if (seenSurfaces.has(view.surface) || surfaces && !surfaces.has(view.surface)) fail('Each native view requires one distinct declared owner surface.');
    seenSurfaces.add(view.surface);
    const reads = new Map();
    const repeat=orchestration ? scoped.get(view.surface)?.repeat || [] : [];
    if(orchestration&&JSON.stringify(view.repeat||[])!==JSON.stringify(repeat))fail('Native Views must match their complete Surface scope chain.');
    if(orchestration){
      for(let index=0;index<repeat.length;index++){
        const scope=repeat[index],prefix=repeat.slice(0,index).flatMap((value,i)=>[...value.path,{repeat:i}]);
        const collection={root:'state',symbol:repeat[0].state,path:[...prefix,...scope.path]},key={root:'state',symbol:repeat[0].state,path:[...prefix,...scope.path,{repeat:index},...scope.key]};
        reads.set(JSON.stringify(collection),collection);reads.set(JSON.stringify(key),key);
      }
      const presence=scoped.get(view.surface)?.presence;
      if(presence){const read={root:'state',symbol:presence.state,path:clone(presence.path)};reads.set(JSON.stringify(read),read);}
    }
    compiled.set(view.surface, children(view.children, repeat, reads, 0));
    dependencies.push({ surface: view.surface, reads: [...reads.values()].sort((a, b) => JSON.stringify(a) < JSON.stringify(b) ? -1 : JSON.stringify(a) > JSON.stringify(b) ? 1 : 0), allSyntacticBranches: true });
  }
  return { surfaces: compiled, contract: freeze({ schema: managed ? 'xtend.rmt.native-view.v3' : orchestration ? RMT_NATIVE_ORCHESTRATION_VIEW_SCHEMA : RMT_NATIVE_VIEW_SCHEMA, documentId: contract.documentId, surfaces: [...compiled.keys()],
      ...(orchestration ? {components:clone(componentRecords),scopes:clone(contract.scopes),eventKeys:context.core ? lowerRmtxNativeEventKeys(contract,context.core,context.events,context.inputContract) : [],...(managed?require('./rmtx-native-component-bindings').lowerNativeComponentBindings(contract,context):{})} : {}) }),
    dependencies: freeze({ schema: managed ? 'xtend.rmtx.native-view-dependencies.v3' : orchestration ? RMTX_NATIVE_ORCHESTRATION_VIEW_DEPENDENCIES_SCHEMA : RMTX_NATIVE_VIEW_DEPENDENCIES_SCHEMA, sourceProfile: clone(contract.sourceProfile), surfaces: dependencies,
      runtimeTracking: false, runtimeSubscriptionsChanged: false }) };
}
function lowerRmtxNativeViews(contract, appPlatform) {
  try { return validateNativeViewContract(contract, appPlatform); }
  catch (error) { if (error.code === 'rmtx.native-view.invalid') throw error; fail(error.message); }
}
function lowerRmtxNativeOrchestrationViews(contract, appPlatform, context = {}) {
  try { return validateRmtxNativeOrchestrationViewContract(contract,appPlatform,context); }
  catch(error){if(error.code==='rmtx.native-view.invalid')throw error;fail(error.message);}
}
function lowerRmtxNativeEventKeys(contract, core, events, inputContract) {
  return contract.eventKeys.map(declaration=>{
    const mappings=(core.sourceMap||[]).filter(row=>row.nodeType==='RmtEventBinding'&&row.astPointer===declaration.astPointer&&/^\/events\/\d+$/u.test(row.corePointer));
    if(mappings.length!==1)fail('Scoped event keys require exactly one AST-to-Core event mapping.');
    const original=core.events?.[Number(mappings[0].corePointer.slice('/events/'.length))],event=(events||[]).find(row=>row.id===original?.id);
    if(!event||event.surface!==declaration.surface||mappings[0].id!==`src:${event.id}`)fail('Scoped event key provenance differs from its owning native event.');
    const rules=inputContract?.actions?.find(row=>row.id===event.action)?.fields;
    for(const [field,index]of Object.entries(declaration.fields))if(!rules?.[field]||!['string','number','json'].includes(rules[field].type)||event.payload?.[field]!==`$detail.__rmtxScopedKeys.k${index}`)fail('Scoped native keys require matching Action scalar/json inputs and compiler-owned transport.');
    return {event:event.id,surface:declaration.surface,astPointer:declaration.astPointer,fields:clone(declaration.fields)};
  });
}
function lowerRmtxManagedNativeViews(contract, appPlatform, context={}) {try{return validateRmtxManagedNativeViewContract(contract,appPlatform,context);}catch(error){if(error.code==='rmtx.native-view.invalid')throw error;fail(error.message);}}
module.exports = { validateRmtxManagedNativeViewContract, lowerRmtxManagedNativeViews, RMTX_NATIVE_VIEW_API_VERSION, RMTX_NATIVE_VIEW_SCHEMA, RMT_NATIVE_VIEW_SCHEMA, RMTX_NATIVE_VIEW_DEPENDENCIES_SCHEMA,
  validateNativeViewContract, lowerRmtxNativeViews, RMTX_NATIVE_ORCHESTRATION_VIEW_API_VERSION, RMTX_NATIVE_ORCHESTRATION_VIEW_SCHEMA, RMT_NATIVE_ORCHESTRATION_VIEW_SCHEMA, RMTX_NATIVE_ORCHESTRATION_VIEW_DEPENDENCIES_SCHEMA,
  validateRmtxNativeOrchestrationViewContract, lowerRmtxNativeOrchestrationViews, lowerRmtxNativeEventKeys };
