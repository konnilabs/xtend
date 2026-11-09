'use strict';
// URL-state policy/codec and sealed restore plans. Ports are injected by the trusted owner.
const bindingsApi = require('./state-binding');
const { data, record, fields, name, segments, typed, clone, freeze, readBindingPath } = require('./state-binding-contract');
const policySchema = freeze(clone(require('./url-state-contracts/policy.v1.schema.json')));
const stateSchema = freeze(clone(require('./url-state-contracts/state.v1.schema.json')));
const planSchema = freeze(clone(require('./url-state-contracts/restore-plan.v1.schema.json')));
const historySchema = freeze(clone(require('./url-state-contracts/history-proposal.v1.schema.json')));
const API_VERSION = '1.0.0';
const PARAMETER = 'xtend-state';
const encoder = new TextEncoder();
function fail(message, code = 'invalid') { throw Object.assign(new TypeError(message), { code: `xtend.xtensions.url-state.${code}` }); }
function demand(value, message, code) { if (!value) fail(message, code); }
function closed(value, schema) {
  fields(value, Object.keys(schema.properties), schema.title || 'Wire record');
  demand(schema.required.every(key => Object.hasOwn(value, key)), 'Required wire field missing.');
}
function scalar(value) { demand(value === null || ['string','boolean'].includes(typeof value) || typeof value === 'number' && Number.isFinite(value), 'URL values must be finite JSON scalars.'); }
function named(value, maximum = 128) { name(value); demand([...value].length <= maximum, 'URL identity exceeds its bound.'); }
function address(value) {
  closed(value, policySchema.definitions.address); named(value.declarationId); segments(value.keys);
  demand(value.keys.length <= 32, 'Too many address keys.');
  for (const key of value.keys) if (typeof key === 'string') named(key, 256);
}
function canonical(value) {
  data(value);
  const sort = entry => Array.isArray(entry) ? entry.map(sort) : entry && typeof entry === 'object'
    ? Object.fromEntries(Object.keys(entry).sort().map(key => [key, sort(entry[key])])) : entry;
  return JSON.stringify(sort(value));
}
const same = (left,right) => canonical(left) === canonical(right);
const bytes = value => encoder.encode(canonical(value)).length;
const addressId = entry => canonical([entry.declarationId,entry.keys]);
function modelStates(snapshot) {
  const descriptor = snapshot && Object.getOwnPropertyDescriptor(snapshot,'states');
  demand(descriptor && 'value' in descriptor,'A data-only Model states snapshot is required.');
  record(descriptor.value,'Model states'); data(descriptor.value); return descriptor.value;
}
function prefix(a,b) { return a.length <= b.length && a.every((part,i) => part === b[i]); }
function physical(states, state, path) {
  demand(Object.hasOwn(states,state),'Model source is absent.');
  let value = states[state]; const result = [];
  for (const part of path) {
    if (part && typeof part === 'object') {
      // The production reader checks key validity and uniqueness before lookup.
      const match = readBindingPath(value,[part]);
      const index = value.indexOf(match); demand(index >= 0,'Keyed Model source is absent.');
      result.push(index); value = match;
    } else { value = readBindingPath(value,[part]); result.push(part); }
  }
  return { state, path: result, value };
}
function templatePath(source, blueprint, keys) {
  return source.path.map(part => part && typeof part === 'object' && Object.hasOwn(part,'repeat')
    ? { key:{path:blueprint.repeat[part.repeat].key,value:keys[part.repeat]} } : part);
}
function createURLStateContract(input, { program, bindings }) {
  data(input); closed(input,policySchema);
  input=freeze(clone(input));
  demand(input.schema === policySchema.$id && input.exposure === 'public-url','Unsupported policy or missing explicit public URL grant.');
  named(input.id); named(input.documentId);
  demand(Number.isSafeInteger(input.version) && input.version > 0 && input.version <= 2147483647,'Invalid application policy version.');
  const artifact = bindingsApi.validateStateBindingArtifact(bindings,program);
  demand(input.documentId === artifact.documentId,'Policy document differs from bindings.');
  closed(input.limits,policySchema.properties.limits);
  for (const [key,rule] of Object.entries(policySchema.properties.limits.properties)) demand(Number.isSafeInteger(input.limits[key]) && input.limits[key] >= rule.minimum && input.limits[key] <= rule.maximum,'Invalid URL budget.');
  demand(input.limits.entries <= input.limits.instances,'Entry budget exceeds instance budget.');
  demand(Array.isArray(input.fields) && input.fields.length > 0 && input.fields.length <= 32,'Invalid public field grant count.');
  const bySurface = new Map(artifact.bindings.map(entry => [entry.surface,entry]));
  const grants = new Map(), selected = new Set(), sources = new Set();
  for (const field of input.fields) {
    closed(field,policySchema.properties.fields.items); named(field.surface); named(field.prop);
    demand(typeof field.id === 'string' && /^[A-Za-z][A-Za-z0-9._-]{0,63}$/.test(field.id),'Invalid public field id.'); name(field.id);
    const blueprint = bySurface.get(field.surface), source = blueprint?.binding.props[field.prop];
    demand(source && ['string','number','boolean'].includes(source.type),'URL grants require an existing, scalar controlled prop.');
    demand(!grants.has(field.id) && !sources.has(canonical([field.surface,field.prop])),'Duplicate public field grant.');
    scalar(field.default); typed(field.default,source,'URL default');
    demand(bytes(field.default) <= input.limits.valueBytes,'URL default exceeds its budget.');
    grants.set(field.id,{field,blueprint,source}); selected.add(blueprint); sources.add(canonical([field.surface,field.prop]));
  }
  // Prove selected logical address domains disjoint even when collections are empty.
  const blueprints = [...selected];
  for (let i=0;i<blueprints.length;i++) for (let j=0;j<i;j++) {
    const a=blueprints[i],b=blueprints[j],aa=a.binding.address,bb=b.binding.address;
    demand(aa.declarationId !== bb.declarationId || aa.keys.length+(a.repeat?.length||0) !== bb.keys.length+(b.repeat?.length||0) ||
      !(prefix(aa.keys,bb.keys)||prefix(bb.keys,aa.keys)),'Public logical address domains overlap.');
  }
  const policy=freeze(clone(input));
  function match(entry) {
    const candidates = blueprints.filter(b => b.binding.address.declarationId === entry.declarationId && entry.keys.length === b.binding.address.keys.length+(b.repeat?.length||0) && prefix(b.binding.address.keys,entry.keys));
    demand(candidates.length === 1,'Unknown logical declaration, key prefix or key arity.'); return candidates[0];
  }
  function scalarFor(value,grant) {
    scalar(value); typed(value,grant.source,'Public field'); demand(bytes(value) <= policy.limits.valueBytes,'Public field exceeds its budget.','limit');
  }
  function normalize(payload) {
    data(payload); closed(payload,stateSchema);
    demand(payload.schema === stateSchema.$id && payload.documentId === policy.documentId && payload.policyId === policy.id && payload.policyVersion === policy.version,'URL document, policy or version mismatch.');
    demand(Array.isArray(payload.entries) && payload.entries.length <= policy.limits.entries,'URL entry budget exceeded.','limit');
    const seen = new Set(), entries=[];
    for (const entry of payload.entries) {
      closed(entry,stateSchema.properties.entries.items); address({declarationId:entry.declarationId,keys:entry.keys});
      const id=addressId(entry), blueprint=match(entry);
      demand(!seen.has(id),'Duplicate logical address in URL.'); seen.add(id); record(entry.values,'Public values');
      demand(Object.keys(entry.values).length > 0,'Empty URL entry.'); const values={};
      for (const [id,value] of Object.entries(entry.values)) {
        const grant=grants.get(id); demand(grant && grant.blueprint === blueprint,'Field is not granted for this logical declaration.'); scalarFor(value,grant);
        if (!same(value,grant.field.default)) values[id]=value;
      }
      if (Object.keys(values).length) entries.push({declarationId:entry.declarationId,keys:clone(entry.keys),values});
    }
    entries.sort((a,b)=>addressId(a)<addressId(b)?-1:addressId(a)>addressId(b)?1:0);
    return freeze({schema:stateSchema.$id,documentId:policy.documentId,policyId:policy.id,policyVersion:policy.version,entries});
  }
  function envelope(entries) { return {schema:stateSchema.$id,documentId:policy.documentId,policyId:policy.id,policyVersion:policy.version,entries}; }
  function encode(payload) {
    const normalized=normalize(payload), raw=encoder.encode(canonical(normalized));
    let binary=''; for (const byte of raw) binary+=String.fromCharCode(byte);
    const token='1.'+btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    demand(token.length <= policy.limits.tokenBytes,'URL token budget exceeded.','limit'); return token;
  }
  function decode(token) {
    demand(typeof token === 'string' && token.length <= policy.limits.tokenBytes,'URL token budget exceeded or invalid.','limit');
    demand(/^1\.[A-Za-z0-9_-]+$/.test(token) && token.length%4 !== 3,'Unsupported or malformed URL token.');
    let payload, text;
    try {
      const body=token.slice(2), binary=atob(body.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-body.length%4)%4));
      text=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(binary,char=>char.charCodeAt(0))); payload=JSON.parse(text);
    } catch (_) { fail('Malformed URL JSON/UTF-8/base64url.'); }
    const normalized=normalize(payload);
    demand(text === canonical(normalized) && encode(normalized) === token,'URL token is not in canonical minimal form.'); return normalized;
  }
  function rowsAndTargets(snapshot) {
    const states=modelStates(snapshot), rows=[], keyTargets=[], identities=new Set();
    for (const blueprint of artifact.bindings) {
      const visit=(level,item,itemState,itemPath,keys)=>{
        const scope=blueprint.repeat?.[level];
        if (scope) {
          const state=level===0?scope.state:itemState, path=level===0?scope.path:[...itemPath,...scope.path];
          const collection=readBindingPath(states,[state,...path]); demand(Array.isArray(collection),'Repeat source is not an array.'); const seen=new Set();
          collection.forEach((child,index)=>{
            const key=readBindingPath(child,scope.key); segments([key]);
            const id=canonical(key); demand(!seen.has(id),'Duplicate Model item key.'); seen.add(id);
            keyTargets.push({state,path:[...path,index,...scope.key]}); visit(level+1,child,state,[...path,index],[...keys,key]);
          }); return;
        }
        const addr={declarationId:blueprint.binding.address.declarationId,keys:[...blueprint.binding.address.keys,...keys]}, id=addressId(addr);
        demand(!identities.has(id),'Ambiguous Model logical address.'); identities.add(id);
        if (selected.has(blueprint)) { address(addr); rows.push({blueprint,address:addr,keys}); demand(rows.length<=policy.limits.instances,'Public instance budget exceeded.','limit'); }
      };
      visit(0,null,null,[],[]);
    }
    const targets=[];
    for (const row of rows) for (const grant of grants.values()) if (grant.blueprint === row.blueprint) {
      const path=templatePath(grant.source,row.blueprint,row.keys), target=physical(states,grant.source.state,path);
      scalarFor(target.value,grant);
      demand(!keyTargets.some(key=>key.state===target.state&&(prefix(key.path,target.path)||prefix(target.path,key.path))),'URL fields cannot modify instance keys.');
      demand(!targets.some(old=>old.state===target.state&&(prefix(old.path,target.path)||prefix(target.path,old.path))),'URL targets overlap; grant one logical owner per Model slice.');
      targets.push({...target,address:row.address,field:grant.field.id,default:grant.field.default});
    }
    return {states,rows,targets};
  }
  function capture(snapshot) {
    const {targets}=rowsAndTargets(snapshot), entries=new Map();
    for (const target of targets) if (!same(target.value,target.default)) {
      const id=addressId(target.address); if (!entries.has(id)) entries.set(id,{...target.address,values:{}});
      entries.get(id).values[target.field]=target.value;
    }
    const payload=normalize(envelope([...entries.values()])); encode(payload); return payload;
  }
  let plans=new WeakMap(), proposals=new WeakMap(), navigation=null, disposed=false;
  function planRestore(token,snapshot,{navigationId}) {
    named(navigationId); navigation={id:navigationId,settled:false,plan:null};
    const payload=token===null?normalize(envelope([])):decode(token);
    const {states,rows,targets}=rowsAndTargets(snapshot), byAddress=new Map(rows.map(row=>[addressId(row.address),row])), wanted=new Map(), missing=[];
    for (const entry of payload.entries) {
      if (!byAddress.has(addressId(entry))) { missing.push({declarationId:entry.declarationId,keys:entry.keys}); continue; }
      for (const [field,value] of Object.entries(entry.values)) wanted.set(canonical([addressId(entry),field]),value);
    }
    const changes=[], operations=[], roots=new Map();
    if (!missing.length) for (const target of targets) {
      const id=canonical([addressId(target.address),target.field]), value=wanted.has(id)?wanted.get(id):target.default;
      if (same(value,target.value)) continue;
      changes.push({...target.address,field:target.field,previous:target.value,value});
      if (!roots.has(target.state)) roots.set(target.state,clone(states[target.state]));
      if (!target.path.length) roots.set(target.state,clone(value));
      else { let owner=roots.get(target.state); for (const part of target.path.slice(0,-1)) owner=owner[part]; owner[target.path.at(-1)]=clone(value); }
    }
    for (const [state,value] of roots) operations.push({operation:'set',state,value});
    changes.sort((a,b)=>canonical([addressId(a),a.field])<canonical([addressId(b),b.field])?-1:1);
    const plan=freeze({schema:planSchema.$id,documentId:policy.documentId,policyId:policy.id,policyVersion:policy.version,navigationId,
      status:missing.length?'deferred':changes.length?'ready':'unchanged',changes,missing});
    plans.set(plan,{expected:missing.length?null:canonical(states),operations,used:false}); navigation.plan=plan; return plan;
  }
  function current(navigationId,lifetime) {
    demand(!disposed && lifetime && typeof lifetime.navigationId === 'function' && typeof lifetime.isCurrent === 'function' && lifetime.navigationId()===navigationId && lifetime.isCurrent()===true && !lifetime.signal?.aborted,'Navigation lifetime is obsolete.','stale');
  }
  function applyRestore(plan,{modelReader,modelCommandPort},lifetime) {
    const sealed=plans.get(plan); demand(sealed && !sealed.used,'Restore plan is untrusted or already consumed.','stale');
    demand(navigation?.plan===plan,'A newer restore plan superseded this plan.','stale');
    demand(plan.status!=='deferred','Missing keys require a new plan; no partial restore.');
    current(plan.navigationId,lifetime);
    demand(canonical(modelStates(modelReader.snapshot()))===sealed.expected,'Model changed; rebuild the restore plan.','stale');
    demand(modelCommandPort?.schema === 'xtend.rmt.model-command-port.v1' && typeof modelCommandPort.apply==='function','Reference requires the synchronous atomic RMT Model command port.');
    sealed.used=true;
    if (!sealed.operations.length) { sealed.expected=null; navigation.settled=true; return false; }
    current(plan.navigationId,lifetime);
    let result;
    try { result=modelCommandPort.apply(sealed.operations,{source:'xtension-url-restore',policyId:policy.id,policyVersion:policy.version,navigationId:plan.navigationId}); }
    finally { sealed.operations=[]; sealed.expected=null; }
    demand(!result || typeof result.then!=='function','Reference Model command port must be synchronous.');
    if (navigation?.plan===plan) navigation.settled=true; return true;
  }
  function proposeHistory(snapshot,{cause,currentToken,navigationId}) {
    named(navigationId); demand(['initialize','commit','checkpoint','traverse','reset'].includes(cause),'Unknown History cause.');
    demand(navigation?.id===navigationId && navigation.settled,'URL restore is not settled; no History publication.','stale');
    demand(currentToken===null || typeof currentToken==='string','Invalid current URL token.');
    if (cause!=='reset' && currentToken!==null) decode(currentToken);
    const payload=capture(snapshot), token=payload.entries.length?encode(payload):null;
    if (cause==='reset') demand(token===null,'Explicit reset requires restored public defaults.');
    const mode=cause==='reset'?'replace':cause==='traverse'||token===currentToken?'none':cause==='checkpoint'?'push':'replace';
    const proposal=freeze({schema:historySchema.$id,documentId:policy.documentId,policyId:policy.id,policyVersion:policy.version,navigationId,parameter:PARAMETER,mode,cause,token});
    proposals.set(proposal,navigation); navigation.proposal=proposal; return proposal;
  }
  function checkHistory(proposal,snapshot,lifetime) {
    demand(proposals.has(proposal) && proposals.get(proposal)===navigation && navigation?.proposal===proposal,'Untrusted or superseded History proposal.'); current(proposal.navigationId,lifetime);
    demand(navigation?.id===proposal.navigationId && navigation.settled,'URL restore is not settled.','stale');
    demand(typeof lifetime.isViewCommitted==='function' && lifetime.isViewCommitted()===true,'History publication requires the current View/Props commit.','stale');
    const payload=capture(snapshot), token=payload.entries.length?encode(payload):null;
    demand(proposal.token===token,'Shared Model state changed; rebuild the History proposal.','stale');
    current(proposal.navigationId,lifetime); proposals.delete(proposal); navigation.proposal=null; return proposal.mode!=='none';
  }
  const open=fn=>(...args)=>{demand(!disposed,'URL contract session is disposed.','stale');return fn(...args);};
  return freeze({apiVersion:API_VERSION,policy,capture:open(capture),encode:open(encode),decode:open(decode),planRestore:open(planRestore),
    applyRestore:open(applyRestore),proposeHistory:open(proposeHistory),checkHistory:open(checkHistory),
    dispose(){disposed=true;navigation=null;plans=new WeakMap();proposals=new WeakMap();}});
}
function readQuery(query) {
  demand(typeof query==='string' && !query.startsWith('?'),'Pass only the active router query area, without ?.');
  let token=null, found=false;
  for (const part of query.split('&')) {
    const equals=part.indexOf('='), rawName=equals<0?part:part.slice(0,equals); let key;
    try { key=decodeURIComponent(rawName.replace(/\+/g,' ')); } catch (_) { continue; }
    if (key!==PARAMETER) continue;
    demand(!found,'Duplicate reserved URL state parameter.'); found=true;
    try { token=decodeURIComponent((equals<0?'':part.slice(equals+1)).replace(/\+/g,' ')); } catch (_) { fail('Malformed reserved URL parameter.'); }
  }
  return token;
}
function withToken(query,token) {
  demand(typeof query==='string' && !query.startsWith('?'),'Pass only the active router query area, without ?.');
  if (token!==null) readQuery(query);
  demand(token===null||typeof token==='string'&&/^1\.[A-Za-z0-9_-]+$/.test(token)&&token.length<=8192,'Invalid query token.');
  const parts=(query?query.split('&'):[]).filter(part=>{
    try { return decodeURIComponent(part.split('=')[0].replace(/\+/g,' '))!==PARAMETER; } catch (_) { return true; }
  });
  if (token!==null) parts.push(`${PARAMETER}=${token}`); return parts.join('&');
}
module.exports={API_VERSION,PARAMETER,createURLStateContract,readQuery,withToken,canonical};
