import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {performance} from 'node:perf_hooks';
import {createRmtKernelScheduler as create} from '../../xtendrmt/rmt-kernel-scheduler.js';
import {createRmtSafePreviewProjector} from '../../xtendrmt/rmt-safe-preview.js';
import {xtendState} from '../../components/xtend-state.js';
const {createXtendFabric}=createRequire(import.meta.url)('../../fabric/xtend-fabric.js');
function host(){let t=0;const tasks=[],timers=[];return {now:()=>t,queueMicrotask:f=>tasks.push(f),setTimeout(f,d){const h={f,at:t+d};timers.push(h);return h},clearTimeout:h=>h.off=true,createAbortController:()=>new AbortController(),flush(){let n=0;while(tasks.length){assert.ok(++n<10000);tasks.shift()()}},advance(v){t=v;for(const h of timers.filter(h=>!h.off&&h.at<=t)){h.off=true;h.f()}this.flush()}}}
test('Classic state rejects dangerous path segments before changing state or prototypes',()=>{
 try {for(const path of ['__proto__.auditPollution','nested.__proto__.auditPollution','constructor.prototype.auditPollution'])assert.throws(()=>xtendState.setPath(path,true));assert.equal(({}).auditPollution,undefined);xtendState.setPath('normal.name','Ada');assert.equal(xtendState.getPath('normal.name'),'Ada')}finally{delete Object.prototype.auditPollution;xtendState.clear()}
});
test('earlier delayed jobs rearm the timer',()=>{const h=host(),s=create({host:h}),order=[];try{s.schedule({delayMs:60000},()=>order.push('late'));h.flush();s.schedule({delayMs:10},()=>order.push('early'));h.flush();h.advance(10);assert.deepEqual(order,['early']);h.advance(60000);assert.deepEqual(order,['early','late'])}finally{s.dispose()}});
test('duplicate explicit IDs are rejected without orphaning accepted handles',()=>{const h=host(),s=create({host:h});const a=s.schedule({id:'same'},()=>1);try{assert.throws(()=>s.schedule({id:'same'},()=>2))}finally{s.dispose()}assert.equal(a.status,'cancelled');assert.equal(a.signal.aborted,true)});
test('automatic IDs avoid previously accepted explicit IDs',async()=>{const h=host(),s=create({host:h});const a=s.schedule({id:'rmt-job-2'},()=>1),b=s.schedule({},()=>2);try{assert.notEqual(a.id,b.id);h.flush();assert.deepEqual(await Promise.all([a,b]),[1,2])}finally{s.dispose()}});
test('self cancellation and disposal cannot revive a terminal async job',async()=>{for(const dispose of [false,true]){const s=create();let a;a=s.schedule({},()=>{dispose?s.dispose():a.cancel();return Promise.resolve('late')});await assert.rejects(a.result);await new Promise(r=>setImmediate(r));assert.equal(a.status,'aborted');assert.equal(s.snapshot().telemetry.completed,0);assert.equal(s.snapshot().telemetry.aborted,1);s.dispose()}});
test('cooperative chunks permit host tasks and timeout cancellation',async()=>{const s=create({preferPostTask:false,maxMicrotaskTurns:8});let chunks=0;const a=s.schedule({timeoutMs:1},async c=>{for(let i=0;i<10000;i++){chunks++;await c.yield()}});try{await assert.rejects(a.result);assert.ok(chunks<10000);assert.equal(a.status,'aborted')}finally{s.dispose()}});
test('opt-in completed history bound retains external handles and active jobs',async()=>{const s=create({maxCompletedJobs:2});const held=[];for(let i=0;i<5;i++)held.push(await (async()=>{const h=s.schedule({},()=>i);await h;return {h}})());assert.equal(s.getJob(held[0].h.id),null);assert.equal(await held[0].h,0);assert.equal(await s.getJob(held[4].h.id),4);assert.equal(s.snapshot().counts.completed,2);s.dispose()});
test('default job history remains queryable after dispose',async()=>{const s=create();const h=s.schedule({},()=>42);await h;s.dispose();assert.equal(s.getJob(h.id),h);assert.equal(await h,42)});
test('preview stops visiting siblings after the structural budget',()=>{let reads=0;const children=Array.from({length:1000},()=>({type:'text',get text(){reads++;return 'a'}}));const r=createRmtSafePreviewProjector({limits:{maxNodes:10}}).project({root:{type:'fragment',children}});assert.ok(reads<=10);assert.ok(r.descriptor.children.length<=10);assert.ok(r.diagnostics.length<=10);assert.ok(r.metrics.nodes<=10)});
test('preview byte limit includes attributes and unicode; invalid limits cannot disable budgets',()=>{for(const maxNodes of [10,NaN,Infinity,-1]){const r=createRmtSafePreviewProjector({limits:{maxNodes,maxTextBytes:10}}).project({root:{tag:'input',attributes:{value:'é'.repeat(100000)}}});assert.ok(Buffer.byteLength(r.descriptor.attributes?.value||'')<=10);assert.ok(r.metrics.textBytes<=10)}});
test('Fabric clears its transient marks without clearing foreign marks or measures',()=>{const own=performance;own.mark('foreign');own.measure('xtend.component.render');const f=createXtendFabric({performance:own,storeLimit:5});try{for(let i=0;i<100;i++)f.runFiber({kind:'component.render'},()=>1);assert.equal(own.getEntriesByType('mark').filter(x=>x.name!=='foreign').length,0);assert.equal(own.getEntriesByName('foreign').length,1);f.dispose();assert.ok(own.getEntriesByName('xtend.component.render','measure').length>=1)}finally{own.clearMarks();own.clearMeasures()}});
test('Fabric owns bounded timing entries, isolates instances and ignores disposed in-flight measurements',async()=>{
 performance.clearMarks();performance.clearMeasures();performance.mark('foreign-mark');performance.measure('xtend.component.render');
 const a=createXtendFabric({performance,storeLimit:3}),b=createXtendFabric({performance,storeLimit:3});let done;
 try {
  for(let i=0;i<30;i++){a.runFiber({kind:'component.render'},()=>1);b.runFiber({kind:'component.render'},()=>1)}
  assert.equal(performance.getEntriesByType('measure').length,7);
  const pending=a.runFiber({kind:'component.render'},()=>new Promise(r=>done=r));
  a.dispose();assert.equal(performance.getEntriesByType('measure').length,4);assert.equal(performance.getEntriesByType('mark').length,1);
  done();await pending;assert.equal(a.getFibers().length,0);assert.equal(performance.getEntriesByType('measure').length,4);
  b.dispose();assert.deepEqual(performance.getEntriesByType('measure').map(x=>x.name),['xtend.component.render']);
 }finally{a.dispose();b.dispose();performance.clearMarks();performance.clearMeasures()}
});
test('diagnostic reporters may dispose rejected fibers without repopulating disposed stores', async () => {
  for (const asynchronous of [true, false]) {
    const fabric = createXtendFabric({ performance });
    const original = new Error('original fiber failure');
    let published = 0;
    fabric.registerReporter({
      id: 'dispose-on-error',
      publish() { published++; fabric.dispose(); }
    });
    try {
      const run = () => fabric.runFiber({ kind: 'component.render' }, () => {
        if (asynchronous) return Promise.reject(original);
        throw original;
      });
      if (asynchronous) await assert.rejects(run(), error => error === original);
      else assert.throws(run, error => error === original);
      assert.equal(published, 1);
      assert.deepEqual(fabric.getFibers(), []);
      assert.deepEqual(fabric.getDiagnostics(), []);
      assert.equal(performance.getEntriesByType('mark').length, 0);
      assert.equal(performance.getEntriesByType('measure').length, 0);
    } finally {
      fabric.dispose();
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
});
test('waiting observers may cancel or dispose before late work rejection', async () => {
  for (const dispose of [false, true]) {
    let rejectWork;
    const work = new Promise((resolve, reject) => { rejectWork = reject; });
    let handle;
    const scheduler = create({ observer(event) {
      if (event.phase === 'waiting') {
        if (dispose) scheduler.dispose();
        else handle.cancel();
      }
    } });
    try {
      handle = scheduler.schedule({}, () => work);
      await assert.rejects(handle.result);
      rejectWork(new Error('late rejected work'));
      // node:test fails on any unhandled rejection; give rejection tracking a turn.
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(handle.status, 'aborted');
      assert.equal(scheduler.snapshot().telemetry.aborted, 1);
      assert.equal(scheduler.snapshot().telemetry.failed, 0);
      assert.equal(scheduler.snapshot().telemetry.completed, 0);
    } finally {
      scheduler.dispose();
    }
  }
});
test('thenable getters cannot revive jobs cancelled during assimilation', async () => {
  for (const dispose of [false, true]) {
    for (const rejected of [false, true]) {
      const scheduler = create();
      let handle;
      try {
        handle = scheduler.schedule({}, () => ({
          get then() {
            if (dispose) scheduler.dispose();
            else handle.cancel();
            return (resolve, reject) => rejected
              ? reject(new Error('late thenable rejection'))
              : resolve('late thenable value');
          }
        }));
        await assert.rejects(handle.result);
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(handle.status, 'aborted');
        const { telemetry } = scheduler.snapshot();
        assert.equal(telemetry.aborted, 1);
        assert.equal(telemetry.completed, 0);
        assert.equal(telemetry.failed, 0);
      } finally {
        scheduler.dispose();
      }
    }
  }
});
test('terminal history defaults to 200 and supports finite, zero and Infinity limits', async () => {
  for (const limit of [undefined, 3, 0, Infinity, Number.MAX_SAFE_INTEGER, -1, 1.5, NaN, -Infinity, '3', null, Number.MAX_SAFE_INTEGER + 1]) {
    const expected = limit === Infinity ? 205
      : Number.isSafeInteger(limit) && limit >= 0 ? Math.min(limit, 205) : 200;
    const scheduler = create({ maxCompletedJobs: limit });
    const held = [];
    try {
      for (let i = 0; i < 205; i++) {
        const handle = scheduler.schedule({}, () => i);
        held.push(handle);
        await handle;
      }
      assert.equal(scheduler.snapshot().counts.completed, expected);
      assert.equal(scheduler.snapshot().telemetry.completed, 205);
      assert.equal(scheduler.snapshot().telemetry.scheduled, 205);
      for (let i = 0; i < held.length; i++) {
        assert.equal(scheduler.getJob(held[i].id), i < 205 - expected ? null : held[i]);
        assert.equal(await held[i].result, i);
      }
      scheduler.dispose();
      assert.equal(scheduler.snapshot().counts.completed, expected);
      assert.equal(scheduler.snapshot().telemetry.completed, 205);
    } finally { scheduler.dispose(); }
  }
});
test('history evicts by terminal order while queued and waiting jobs remain accessible', async () => {
  const scheduler = create({ maxCompletedJobs: 2 });
  let finishFirst;
  const first = scheduler.schedule({}, () => new Promise(resolve => { finishFirst = resolve; }));
  const delayed = scheduler.schedule({ delayMs: 60000 }, () => 'delayed');
  const waiting = scheduler.schedule({}, () => new Promise(() => {}));
  try {
    const second = scheduler.schedule({}, () => 'second');
    await second;
    const third = scheduler.schedule({}, () => 'third');
    await third;
    assert.equal(scheduler.getJob(first.id), first);
    assert.equal(scheduler.getJob(delayed.id), delayed);
    assert.equal(scheduler.getJob(waiting.id), waiting);
    finishFirst('first');
    await first;
    assert.equal(scheduler.getJob(second.id), null);
    assert.equal(scheduler.getJob(third.id), third);
    assert.equal(scheduler.getJob(first.id), first);
    assert.equal(await second, 'second');
    scheduler.dispose();
    await assert.rejects(delayed.result);
    await assert.rejects(waiting.result);
    assert.equal(delayed.status, 'cancelled');
    assert.equal(waiting.status, 'aborted');
    assert.equal(scheduler.getJob(delayed.id), delayed);
    assert.equal(scheduler.getJob(waiting.id), waiting);
    assert.equal(scheduler.getJob(first.id), null);
    const snapshot = scheduler.snapshot();
    assert.equal(snapshot.counts.completed, 0);
    assert.equal(snapshot.counts.cancelled + snapshot.counts.aborted, 2);
    assert.equal(snapshot.telemetry.completed, 3);
    assert.equal(snapshot.telemetry.cancelled, 1);
    assert.equal(snapshot.telemetry.aborted, 1);
  } finally { scheduler.dispose(); }
});
test('terminal history ordering survives nested terminal observers and failed jobs', async () => {
  let queued;
  const scheduler = create({ maxCompletedJobs: 1, observer(event) {
    if (event.phase === 'failed') queued.cancel();
  } });
  try {
    queued = scheduler.schedule({ delayMs: 60000 }, () => 1);
    const failed = scheduler.schedule({}, () => { throw new Error('expected'); });
    await assert.rejects(failed.result, /expected/);
    await assert.rejects(queued.result);
    assert.equal(scheduler.getJob(failed.id), null);
    assert.equal(scheduler.getJob(queued.id), queued);
    assert.equal(scheduler.snapshot().telemetry.failed, 1);
    assert.equal(scheduler.snapshot().telemetry.cancelled, 1);
  } finally { scheduler.dispose(); }
});
