async function runActionRetentionAssertions(context, { createRmtActionEffectRuntime }) {
  const make = options => createRmtActionEffectRuntime({ actions: [{ id: 'tick' }], ...options });
  const defaults = make();
  let first;
  for (let i = 0; i < 350; i++) {
    const result = await defaults.runAction('tick', { frame: i });
    if (i === 0) first = result;
    if (result.diagnostics.length !== 2) throw new Error(`Action ${i} retained diagnostics from another run.`);
  }
  context.assert(true, '350 Actions retain only their own two diagnostics in every result');
  const recent = defaults.listHistory();
  context.assert(recent.length === 100 && recent[0].data.frame === 250 && recent[99].data.frame === 349, 'default Action history retains the latest 100 completed results in order');
  context.assert(defaults.listDiagnostics().length === 200, 'default Action diagnostic retention is bounded at 200');
  context.assert(first.data.frame === 0 && first.diagnostics.length === 2, 'evicting history preserves previously returned results');
  recent[0].data.frame = -1;
  context.assert(defaults.listHistory()[0].data.frame === 250, 'Action history reads remain defensive copies');

  for (const limit of [0, 1, 3, Infinity, -1, 1.5, NaN, null, '3', Number.MAX_SAFE_INTEGER + 1]) {
    const valid = limit === Infinity || Number.isSafeInteger(limit) && limit >= 0;
    const expected = valid ? Math.min(6, limit) : 6;
    const runtime = make({ historyLimit: limit, diagnosticLimit: limit });
    for (let i = 0; i < 6; i++) await runtime.runAction('tick', { frame: i });
    context.assert(runtime.listHistory().length === expected, `Action history normalizes limit ${String(limit)}`);
    context.assert(runtime.listDiagnostics().length === (valid ? Math.min(12, limit) : 12), `Action diagnostics normalize limit ${String(limit)}`);
  }
  const published = [];
  const none = make({ historyLimit: 0, diagnosticLimit: 0, resultDiagnostics: 'none', diagnosticsHub: { publish(_channel, event) { published.push(event); } } });
  const noneResult = await none.runAction('tick', { frame: 1 });
  context.assert(none.listHistory().length === 0 && none.listDiagnostics().length === 0 && noneResult.diagnostics.length === 0, 'zero retention and none results keep no diagnostic history');
  context.assert(published.length === 2 && noneResult.status === 'success', 'disabling retention still publishes live diagnostics and executes the Action');
  const history = make({ resultDiagnostics: 'history', diagnosticLimit: 3 });
  await history.runAction('tick');
  context.assert((await history.runAction('tick')).diagnostics.length === 3, 'history result mode explicitly includes the retained diagnostic window');
  const unlimited = make({ resultDiagnostics: 'history', diagnosticLimit: Infinity, historyLimit: Infinity });
  for (let i = 0; i < 110; i++) await unlimited.runAction('tick');
  context.assert(unlimited.listHistory().length === 110 && unlimited.listDiagnostics().length === 220 && unlimited.listHistory()[109].diagnostics.length === 220, 'Infinity and history mode explicitly preserve the former cumulative behavior');

  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const concurrent = createRmtActionEffectRuntime({
    actions: [{ id: 'slow', datasource: 'held' }, { id: 'fast' }],
    dataSources: [{ id: 'held', kind: 'host' }],
    dataSourceAdapters: { host: { invoke: () => gate } },
    historyLimit: 1
  });
  const slow = concurrent.runAction('slow');
  const fast = await concurrent.runAction('fast');
  release({ ready: true });
  const slowResult = await slow;
  context.assert(slowResult.diagnostics.length === 2 && slowResult.diagnostics.every(entry => entry.details.action === 'slow') && fast.diagnostics.every(entry => entry.details.action === 'fast'), 'concurrent Action diagnostics belong only to their own run');
  context.assert(concurrent.listHistory()[0].id === 'slow', 'Action eviction follows completion order');

  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const terminal = createRmtActionEffectRuntime({
    actions: [{ id: 'failure', datasource: 'failure' }, { id: 'cancel', datasource: 'held' }],
    dataSources: [{ id: 'failure', kind: 'host' }, { id: 'held', kind: 'host' }],
    dataSourceAdapters: { host: { invoke({ source }) { if (source.id === 'failure') throw new Error('expected'); return pending; } } },
    historyLimit: 1, diagnosticLimit: 0
  });
  const failure = await terminal.runAction('failure');
  const cancel = terminal.runAction('cancel');
  await Promise.resolve(); await Promise.resolve();
  terminal.cancelAction('cancel'); finish({ late: true });
  const cancelled = await cancel;
  context.assert(failure.status === 'error' && failure.diagnostics.length === 2 && failure.diagnostics[1].code === 'rmt.action.error', 'errors retain current-run diagnostics even with zero global retention');
  context.assert(cancelled.status === 'cancelled' && cancelled.diagnostics.length === 2 && cancelled.diagnostics[1].code === 'rmt.action.cancelled' && terminal.listHistory().length === 1, 'cancelled results use the same per-run collection and retention limit');
}

async function runCommandRetentionAssertions(context, { createRmtAppRuntime }) {
  const make = options => createRmtAppRuntime({ actionRuntime: { async runAction(id, data) { return { id, data, status: 'success' }; } }, ...options });
  const defaults = make();
  let first;
  for (let i = 0; i < 350; i++) { const result = await defaults.command('tick', { frame: i }); if (i === 0) first = result; }
  const recent = defaults.listCommands();
  context.assert(recent.length === 100 && recent[0].result.data.frame === 250 && recent[99].result.data.frame === 349, 'default Command history retains the latest 100 completed commands');
  context.assert(defaults.listDiagnostics().length === 200, 'default App diagnostic retention is bounded at 200');
  context.assert(defaults.getPerformanceTelemetrySnapshot().commandCount === 350, 'cumulative command telemetry survives history eviction');
  recent[0].result.data.frame = -1;
  context.assert(defaults.listCommands()[0].result.data.frame === 250 && first.result.data.frame === 0, 'Command eviction and history reads preserve held results');
  for (const limit of [0, 1, 3, Infinity, -1, 1.5, NaN, null, '3', Number.MAX_SAFE_INTEGER + 1]) {
    const valid = limit === Infinity || Number.isSafeInteger(limit) && limit >= 0;
    const runtime = make({ historyLimit: limit, diagnosticLimit: limit });
    for (let i = 0; i < 6; i++) await runtime.command('tick', { frame: i });
    context.assert(runtime.listCommands().length === (valid ? Math.min(6, limit) : 6) && runtime.listDiagnostics().length === (valid ? Math.min(6, limit) : 6), `Command and diagnostic limits normalize ${String(limit)}`);
  }
  const published = [];
  const disabled = make({ historyLimit: 0, diagnosticLimit: 0, diagnosticsHub: { publish(_channel, entry) { published.push(entry); } } });
  const result = await disabled.command('tick', { frame: 1 });
  context.assert(result.status === 'success' && disabled.listCommands().length === 0 && disabled.listDiagnostics().length === 0 && published.length === 1, 'zero Command retention preserves execution, returned results and live diagnostics');
}
module.exports = { runActionRetentionAssertions, runCommandRetentionAssertions };

async function runSurfaceRetentionAssertions(context, { createRmtSurfaceResourceGraphRuntime }, { createSurfaceController }) {
  for (const limit of [undefined, 0, 3, Infinity, -1]) {
    const published = [];
    const controller = createSurfaceController();
    const graph = createRmtSurfaceResourceGraphRuntime({ surfaces: [{ id: 'panel', kind: 'region', component: 'div' }], surfaceController: controller, diagnosticLimit: limit, diagnosticsHub: { publish(_channel, entry) { published.push(entry); } } });
    for (let i = 0; i < 250; i++) graph.materialize();
    const expected = limit === 0 ? 0 : limit === 3 ? 3 : limit === Infinity ? 250 : 200;
    context.assert(graph.listDiagnostics().length === expected, `Surface materialization bounds retained diagnostics for limit ${String(limit)}`);
    context.assert(published.length === 250, 'Surface diagnostic retention does not suppress live publication');
    graph.dispose(); controller.dispose();
  }
}
module.exports.runSurfaceRetentionAssertions = runSurfaceRetentionAssertions;
