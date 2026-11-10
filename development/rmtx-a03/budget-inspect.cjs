'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { createHash } = require('node:crypto');
const { createKernelWorkScope } = require('../../tools/xtensions/kernel-work-scope');
const { createXtendFabric } = require('../../fabric/xtend-fabric');
async function inspect() {
  const { createRmtKernelScheduler } = await import('../../xtendrmt/rmt-kernel-scheduler.js');
  const root = path.resolve(__dirname, '../..'), checked = [], fabric = createXtendFabric(); let at = 0;
  const scheduler = createRmtKernelScheduler({ preferPostTask: false, hostPort: { now: () => at } });
  const input = { scheduler, rootId: 'budget-reference', scope: 'budget-instance', work: { scan: { lane: 'background', maxChunkMs: 8 } } };
  const budget = { schema: 'xtend.xtensions.work-budget-policy.v1', maxPending: 1, work: { scan: { maxPending: 1, overflow: 'replace-oldest', pressure: { constrained: { maxChunkMs: 1 }, critical: { admission: 'reject' } } } } };
  const boundary = (operation, callback, metadata) => fabric.createBoundary(input.scope, { source: 'xtension', lane: metadata.kernelLane }).run(operation, callback, metadata);
  const make = policy => createKernelWorkScope(input, { framework: 'react' }, () => {}, boundary, () => {}, () => {}, policy);
  const check = (name, callback) => { callback(); checked.push(name); };
  const scope = make(budget); scope.activate();
  try {
    for (const [name, policy] of [['unsupported version', { ...budget, schema: 'unsupported' }], ['unbounded total', { ...budget, maxPending: 129 }],
      ['missing grant', { ...budget, work: {} }], ['unknown grant', { ...budget, work: { scan: budget.work.scan, extra: {} } }],
      ['budget amplification', { ...budget, work: { scan: { maxPending: 1, pressure: { critical: { maxChunkMs: 9 } } } } }],
      ['pressure authority injection', { ...budget, work: { scan: { maxPending: 1, pressure: { critical: { lane: 'user-blocking' } } } } }]]) check('reject ' + name, () => assert.throws(() => make(policy)));
    scheduler.updatePressure('critical'); const refused = scope.work.schedule('scan', () => true);
    assert.equal(refused.jobId, null); await assert.rejects(refused.result, { reason: 'kernel-pressure' }); checked.push('pressure refusal creates no native job');
    scheduler.updatePressure('normal'); const queued = scope.work.schedule('scan', () => true); scheduler.updatePressure('critical');
    await assert.rejects(queued.result, { reason: 'kernel-pressure' }); assert.equal(scheduler.getJob(queued.jobId).status, 'failed'); checked.push('queued work rechecks pressure before Fabric');
    scheduler.updatePressure('normal');
    const chunk = scope.work.schedule('scan', async context => { at += 2; assert.equal(context.shouldYield(), false); scheduler.updatePressure('constrained'); assert.equal(context.shouldYield(), true); await context.yield('pressure-chunk'); assert.equal(context.shouldYield(), false); return 42; });
    assert.equal(await chunk.result, 42); checked.push('live pressure reduces cooperative chunks through real kernel yield');
    const next = scope.work.schedule('scan', () => true); await next.result; assert.equal(scheduler.getJob(next.jobId).snapshot().request.maxChunkMs, 1); checked.push('new native requests receive the reduced budget');
    let enter, release; const entered = new Promise(resolve => { enter = resolve; }), held = new Promise(resolve => { release = resolve; }); let guard, hits = 0;
    const first = scope.work.schedule('scan', async context => { guard = context.guard(() => hits++); enter(); await held; guard(); }); await entered;
    const replacement = scope.work.schedule('scan', () => 42); assert(first.signal.aborted); await assert.rejects(first.result); assert.equal(await replacement.result, 42); release(); guard(); assert.equal(hits, 0); checked.push('explicit replacement revokes only owned guards');
    const fiber = fabric.getFibers().find(row => row.metadata.kernelJobId === replacement.jobId); assert.equal(fiber.lane, 'background'); checked.push('replacement still executes inside mandatory Fabric');
    check('budget state is versioned and bounded', () => { const state = scope.budgetSnapshot(); assert.equal(state.schema, 'xtend.xtensions.work-budget-state.v1'); assert.equal(state.pending, 0); assert.equal(state.replaced, 1); assert.equal(state.rejected, 2); assert(Object.isFrozen(state)); });
    check('registry supports the new host major explicitly', () => assert.equal(require('../../tools/xtensions/state-binding').XTENSION_STATE_BINDING_API_VERSION, '2.4.0'));
    const sources = ['tools/xtensions/work-budget-policy.js', 'tools/xtensions/kernel-work-scope.js', 'tools/xtensions/runtime-host-controller.js', 'tools/xtensions/runtime-host-controller.d.ts', 'tools/xtensions/react-runtime-adapter.d.ts', 'tools/xtensions/vue-runtime-adapter.d.ts', 'tools/xtensions/state-binding.js', 'tools/xtensions/state-binding.d.ts', 'tools/package.json', 'xtend-maraca/plan-runtime.d.ts', 'tests/xtensions/work-budget-acceptance.js', 'tests/xtensions/work-budget-maraca-acceptance.js', 'tests/types/xtensions_work_budget.mts', 'tests/xtensions/xtensions_runtime_gate_suite.js', 'tests/xtensions/xtensions_consumer_package_suite.js'];
    const report = { format: 1, stage: 'A03.3-bounded-pressure-budgets', status: 'a03-in-progress', budgetHostApiVersion: '5.0.0', registryApiVersion: '2.4.0', fabricRequired: true,
      frameworkExecutionInPreparationCheck: false, preemption: false, contractChecks: checked.length, names: checked, requiredRealIntegrationCases: 26, requiredRuntimeCasesPerEnvironment: 242, requiredCompilerChecks: 88,
      sources: Object.fromEntries(sources.map(name => [name, createHash('sha256').update(fs.readFileSync(path.join(root, name))).digest('hex')])) };
    const text = JSON.stringify(report, null, 2) + '\n', file = path.join(__dirname, 'budget-evidence.json');
    if (process.argv.includes('--write')) fs.writeFileSync(file, text);
    if (process.argv.includes('--check')) assert.equal(fs.readFileSync(file, 'utf8'), text, 'A03.3 budget contract/source drift');
    console.log(`A03.3: ${checked.length} native pressure/budget checks; actual React/Vue and Maraca acceptance remains mandatory.`); return report;
  } finally { scope.dispose(); scheduler.dispose(); }
}
if (require.main === module) inspect().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { inspect };
