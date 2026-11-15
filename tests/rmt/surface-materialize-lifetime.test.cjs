'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const modules = Promise.all([import('../../xtendrmt/rmt-surface-resource-graph-runtime.js'), import('../../components/xsurfacemanager-controller.js')]);
async function fixture(surfaces = [{id:'owner',initialState:'open'},{id:'sibling',initialState:'open'}], controllerOptions = {}) {
  const [graphApi, controllerApi] = await modules;
  const controller = controllerApi.createSurfaceController(controllerOptions);
  const graph = graphApi.createRmtSurfaceResourceGraphRuntime({surfaces,surfaceController:controller,strict:true});
  return {graph,controller,graphApi,close(){graph.dispose();controller.dispose();}};
}
function record(f,id) { return f.controller.readSnapshot({includeDestroyed:true}).surfaces.find(s=>s.id===id); }

test('managed materialization preserves a destroyed lifetime and its tombstone while retaining live siblings',async()=>{
  const f=await fixture();
  try {
    assert.equal(f.graphApi.RMT_SURFACE_RESOURCE_GRAPH_API_VERSION,'2.2.1');
    f.graph.materialize({}, {preserveDestroyed:true});
    f.graph.destroySurface('owner');const generation=record(f,'owner').generation,sibling=record(f,'sibling').generation;
    const report=f.graph.materialize({}, {preserveDestroyed:true});
    assert.equal(record(f,'owner').status,'destroyed');assert.equal(record(f,'owner').generation,generation);
    assert.equal(record(f,'sibling').status,'open');assert.equal(record(f,'sibling').generation,sibling);
    assert.deepEqual(report.created,[]);assert.deepEqual(report.reused,['sibling']);
    assert.deepEqual(Object.keys(report).sort(),['schema','createdCount','reusedCount','created','reused'].sort());
  } finally { f.close(); }
});

test('the legacy standalone default still rematerializes a destroyed surface',async()=>{
  const f=await fixture();
  try {
    f.graph.materialize();f.graph.destroySurface('owner');const generation=record(f,'owner').generation;
    const report=f.graph.materialize();assert.deepEqual(report.created,['owner']);
    assert.equal(record(f,'owner').status,'open');assert(record(f,'owner').generation>generation);
  } finally { f.close(); }
});

test('an explicit trusted recreate permits a new lifetime without reviving the old generation',async()=>{
  const f=await fixture();
  try {
    f.graph.materialize({}, {preserveDestroyed:true});f.graph.destroySurface('owner');const generation=record(f,'owner').generation;
    await assert.rejects(f.graph.openSurface('owner'),/zerstoert/);
    await f.graph.openSurface('owner',{recreate:true});const renewed=record(f,'owner');
    assert.equal(renewed.status,'open');assert(renewed.generation>generation);
    const report=f.graph.materialize({}, {preserveDestroyed:true});assert.deepEqual(report.created,[]);
    assert.deepEqual(report.reused,['owner','sibling']);assert.equal(record(f,'owner').generation,renewed.generation);
  } finally { f.close(); }
});

test('preserving destroyed keyed instances does not freeze their live siblings',async()=>{
  const f=await fixture([{id:'card',source:'rows',repeat:true,key:'$record.id',initialState:'open'}]);
  try {
    f.graph.materialize({rows:[{id:'a'},{id:'b'}]}, {preserveDestroyed:true});f.graph.destroySurface('card:a');
    const report=f.graph.materialize({rows:[{id:'a'},{id:'b'},{id:'c'}]}, {preserveDestroyed:true});
    assert.deepEqual(report.created,['card:c']);assert.deepEqual(report.reused,['card:b']);
    assert.equal(record(f,'card:a').status,'destroyed');assert.equal(record(f,'card:b').status,'open');assert.equal(record(f,'card:c').status,'open');
  } finally {f.close();}
});

test('invalid preserveDestroyed values fail before lifecycle mutation',async()=>{
  const f=await fixture();
  try {
    const before=f.controller.readSnapshot({includeDestroyed:true});
    for(const value of ['true',1,null])assert.throws(()=>f.graph.materialize({}, {preserveDestroyed:value}),/must be a boolean/);
    assert.deepEqual(f.controller.readSnapshot({includeDestroyed:true}),before);
  } finally {f.close();}
});

test('compacted tombstones remain revoked and explicit recreation advances the cached authoritative generation',async()=>{
  const f=await fixture(undefined,{maxTombstones:1});
  try {
    f.graph.materialize({}, {preserveDestroyed:true});const previous=record(f,'owner').generation;
    assert(f.controller.apply([{operation:'destroy',id:'owner'},{operation:'destroy',id:'sibling'}]).ok);
    assert.equal(record(f,'owner'),undefined);assert.equal(f.graph.getSurface('owner').state,'destroyed');
    const report=f.graph.materialize({}, {preserveDestroyed:true});assert.deepEqual(report.created,[]);assert.equal(record(f,'owner'),undefined);
    await assert.rejects(f.graph.openSurface('owner'),/zerstoert/);
    await f.graph.openSurface('owner',{recreate:true});assert.equal(record(f,'owner').status,'open');assert(record(f,'owner').generation>previous);
    assert.equal(record(f,'sibling').status,'destroyed');
  } finally {f.close();}
});
