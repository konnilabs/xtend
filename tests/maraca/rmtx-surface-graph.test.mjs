import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createMaracaNativeSurfaceGraph } from '../../xtend-maraca/native-surface-graph.mjs';
import { createRmtSurfaceResourceGraphRuntime } from '../../xtendrmt/rmt-surface-resource-graph-runtime.js';
import { createSurfaceController } from '../../components/xsurfacemanager-controller.js';
const require = createRequire(import.meta.url);
const { compileRmtxSource } = require('../../tools/rmt-language/rmtx-compiler');
const scopes = require('../../tools/xtensions/native-surface-scopes');
function fixture(extra = {}) {
  const result = compileRmtxSource(`import {RMT,model,item} from '@ccslabs/xtend/rmt-language/rmtx';
    export default <RMT.Program id="graph.native">
    <RMT.State id="rows" type="collection" initial={[{id:1,title:'Number'},{id:'1',title:'String'}]}/>
    <RMT.Surface id="owner"><RMT.View/><RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Surface id="row"><RMT.View><RMT.Text value={item.title}/></RMT.View></RMT.Surface></RMT.Repeat></RMT.Surface>
    </RMT.Program>`, { syntaxVersion: '7.0.0' });
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  const program = result.orchestrationArtifacts, controller = createSurfaceController({maxTombstones: 1, ...extra});
  let actualGraph, actualController;
  const graph = createMaracaNativeSurfaceGraph({program, surfaceController: controller, createSurfaceGraph(options) { actualController = options.surfaceController; return actualGraph = createRmtSurfaceResourceGraphRuntime(options); }});
  const snapshot = {states: {rows: [{id:1,title:'Number'}, {id:'1',title:'String'}]}, selectors: {}};
  return {program, controller, graph, snapshot, get actualGraph() {return actualGraph;}, get actualController() {return actualController;},
    rows() {return scopes.materializeNativeSurfaceScopes(program, snapshot);},
    materialize() {return graph.materializeInstances(this.rows());},
    close() {graph.dispose(); controller.dispose();}};
}
function record(f, id) {return f.controller.readSnapshot({includeDestroyed:true}).surfaces.find(row=>row.id===id);}
test('Graph3 feeds exact opaque typed keys to actual Graph2 and registers closed records without opening', () => {
  const f = fixture(); try {
    const result = f.materialize(); assert.equal(result.ok, true);
    const ids = f.rows().instances.map(row=>row.id);
    assert.deepEqual(f.graph.listInstances().map(row=>row.id), ids);
    assert.equal(new Set(ids).size, 3); assert.notEqual(ids[1], ids[2]);
    for (const id of ids) {assert.equal(record(f,id).generation,1);assert.equal(record(f,id).status,'closed');}
    const generations = ids.map(id=>record(f,id).generation);f.snapshot.states.rows.reverse();f.materialize();
    assert.deepEqual(ids.map(id=>record(f,id).generation), generations);
    assert.equal(f.graph.getSurface(ids[1]).record.title,'Number');
  } finally {f.close();}
});
test('committed repeat exit/reinsert increments actual Controller generation after tombstone compaction', () => {
  const f = fixture(); try {
    f.materialize(); const [owner,number,string] = f.rows().instances.map(row=>row.id);
    f.snapshot.states.rows=[];const removed=f.materialize();assert.deepEqual(removed.retired,[string,number]);
    assert.equal(f.graph.getSurface(number).state,'destroyed');assert.equal(record(f,number),undefined,'old tombstone compacted');
    f.snapshot.states.rows=[{id:1,title:'Returned'}];f.materialize();
    assert.equal(record(f,number).generation,2);assert.equal(record(f,number).status,'closed');assert.equal(record(f,owner).generation,1);
    assert.equal(f.graph.getSurface(number).record.title,'Returned');
  } finally {f.close();}
});
test('external Destroy remains terminal across model removal, compaction and a returning typed key', () => {
  const f = fixture(); try {
    f.materialize();const [,number,string]=f.rows().instances.map(row=>row.id);
    f.graph.destroySurface(number,{reason:'external'});f.snapshot.states.rows=[];f.materialize();
    f.snapshot.states.rows=[{id:1,title:'No revive'},{id:'1',title:'Own return'}];f.materialize();
    assert.equal(f.graph.getSurface(number).state,'destroyed');assert.equal(record(f,string).generation,2);
    assert.equal(record(f,number),undefined);
  } finally {f.close();}
});
test('external repeated Destroy of an own tombstone revokes repeat-return permission', () => {
  const f = fixture(); try {
    f.materialize();const [,number]=f.rows().instances.map(row=>row.id);
    f.snapshot.states.rows=[{id:'1',title:'String'}];f.materialize();
    f.controller.destroySurface(number,'external-same-tombstone');
    f.snapshot.states.rows.push({id:1,title:'No revive'});f.materialize();
    assert.equal(record(f,number).status,'destroyed');assert.equal(record(f,number).generation,1);
  } finally {f.close();}
});
test('destroyed parent blocks new child registrations and retires descendants until trusted parent generation advances', async () => {
  const f = fixture(); try {
    f.materialize();const [owner,number]=f.rows().instances.map(row=>row.id);
    f.graph.destroySurface(owner,{reason:'outside-parent'});f.snapshot.states.rows.push({id:'new',title:'Blocked'});
    const result=f.materialize();assert.deepEqual(result.instances.map(row=>row.id),[owner]);
    const newId=scopes.resolveNativeSurfaceInstance(f.program,'row',['new']);assert.equal(record(f,newId),undefined);
    assert.equal(f.graph.getSurface(number).state,'destroyed');
    await f.graph.openSurface(owner,{recreate:true});f.materialize();
    assert.equal(record(f,owner).generation,2);assert.equal(record(f,number).generation,2);assert.equal(record(f,newId).generation,1);
    assert.equal(record(f,number).status,'closed');
  } finally {f.close();}
});
test('reentrant Controller writes during registration supersede the exact own revision fence', () => {
  const f = fixture();let once=false; const detach=f.controller.subscribe(snapshot=>{
    if(!once&&snapshot.surfaces.length){once=true;f.controller.closeSurface(snapshot.surfaces[0].id,'reentrant');}
  });try {const report=f.materialize();assert.equal(report.ok,false);assert.equal(report.status,'superseded');assert(report.authority.after>report.authority.before+report.authority.ownWrites);}
  finally {detach();f.close();}
});

test('resource leases receive the actual Graph2 and its shared authoritative Controller port', () => {
  const f = fixture(); try {
    assert.equal(Object.isFrozen(f.graph.resourceGraph), true);
    assert.equal(f.graph.schema, 'xtend.maraca.native-surface-graph.v3');
    assert.equal(f.graph.resourceGraph.surfaceGraph, f.actualGraph);
    assert.equal(f.graph.resourceGraph.surfaceGraph.schema, 'xtend.epic18.rmt-surface-resource-graph-runtime.v2');
    assert.equal(f.graph.resourceGraph.surfaceController, f.actualController);
    f.materialize();
    const id = f.rows().instances[1].id;
    assert.equal(f.graph.resourceGraph.surfaceGraph.getSurface(id).id, f.graph.getSurface(id).id);
    assert.equal(f.graph.resourceGraph.surfaceController.readSnapshot().version, f.controller.readSnapshot().version);
    f.controller.closeSurface(id, 'trusted-external-close');
    assert.equal(f.graph.resourceGraph.surfaceGraph.getSurface(id).state, 'closed');
  } finally { f.close(); }
});

test('open repeated native parents and nested host scopes reenter the actual strict Graph2 with fresh Controller generations', () => {
  const result = compileRmtxSource(`import {RMT,model,item} from '@ccslabs/xtend/rmt-language/rmtx';
    export default <RMT.Program id="nested.open">
    <RMT.State id="rows" type="collection" initial={[{id:1,title:'Numeric'},{id:'1',title:'Text'}]}/>
    <RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Surface id="owner"><RMT.View><RMT.Text value={item.title}/></RMT.View>
      <RMT.Surface id="first"><RMT.View/></RMT.Surface><RMT.Surface id="second"><RMT.View/></RMT.Surface>
    </RMT.Surface></RMT.Repeat></RMT.Program>`, {syntaxVersion:'7.0.0'});
  assert.equal(result.ok,true,JSON.stringify(result.diagnostics));
  const program=result.orchestrationArtifacts,controller=createSurfaceController({maxTombstones:1});
  const graph=createMaracaNativeSurfaceGraph({program,strict:true,surfaces:program.surfaces.map(row=>({...row,initialState:'open'})),surfaceController:controller,createSurfaceGraph:createRmtSurfaceResourceGraphRuntime});
  const snapshot={states:{rows:[{id:1,title:'Numeric'},{id:'1',title:'Text'}]},selectors:{}};
  const materialize=()=>graph.materializeInstances(scopes.materializeNativeSurfaceScopes(program,snapshot));
  try{
    const first=materialize();assert.equal(first.ok,true);const original=first.instances.filter(row=>row.keys[0]===1);assert.equal(original.length,3);
    for(const row of original){const record=controller.readSnapshot().surfaces.find(value=>value.id===row.id);assert.equal(record.status,'open');assert.equal(record.generation,1);}
    snapshot.states.rows=snapshot.states.rows.filter(row=>row.id!==1);assert.equal(materialize().ok,true);
    snapshot.states.rows.push({id:1,title:'Returned'});const returned=materialize();assert.equal(returned.ok,true);assert.equal(returned.instances.length,6);
    for(const row of original){const record=controller.readSnapshot().surfaces.find(value=>value.id===row.id);assert.ok(record,'Each native parent and nested scope is registered again');assert.equal(record.status,'open');assert.equal(record.generation,2);assert.equal(graph.getSurface(row.id).state,'open');assert.equal(graph.getSurface(row.id).record.title,'Returned');}
  }finally{graph.dispose();controller.dispose();}
});
