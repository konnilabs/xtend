'use strict';

// Verifies the restored compiler/runtime contract. The original observations
// remain in operator-runtime-evidence.before-fix.json.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { createHash } = require('node:crypto');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '../..');
const text = `template probe {
  state count type object { initial { value 2 } }
  action save {
    input id string
    reduce state.count.value = 1
  }
  surface panel kind panel component x-section {
    lane visible weight 80 { hydrate panel from state count }
    on click "x-section" -> action save when false {
      payload id from detail.id
    }
  }
}`;

async function inspectActions(dir, moduleApis, xtendState, createMaracaPlanRuntime, createRmtKernelScheduler) {
  const source = `template actionaudit {
    state flags type object initial { direct 0; success 0; error 0 }
    state original type string initial "expected"
    state copied type string initial "unset"
    datasource remote from endpoint "/audit" { method POST; contract Audit; result data }
    action execute {
      input value number
      effect navigation "/before"
      reduce state.flags.direct = input.value
      effect fetch datasource remote
      effect navigation "/after"
      emit audit.done with value input.value
      on success -> reduce state.flags.success = 1
      on error -> reduce state.flags.error = 1
    }
    action copystate { reduce state.copied = state.original }
    portal rootportal root "#xtend-maraca-root" layer surface
    surface panel kind region component div {
      portal rootportal
      lane visible { mount pane }
    }
  }`;
  const { compileRmtClassicSource } = require('../../tools/rmt-language/classic-compiler');
  const compiled = compileRmtClassicSource(source); assert(compiled.ok);
  const file = path.join(dir, 'actions.rmt'); fs.writeFileSync(file, source);
  const plan = require('../../xtend-maraca').createMaracaBuildPlan({ source: file, orchestration: 'strict', kernel: 'off', hydration: 'off', validation: 'off', transitions: 'off' }, { rootDir: root, inspectToolchain: false });
  assert(plan.ok, JSON.stringify(plan.diagnostics));
  const core = compiled.coreDocument.actions[0], app = compiled.coreDocument.appPlatform.actions[0];
  assert.equal(core.handlers.length, 2); assert.equal(app.handlers.length, 2);
  assert.equal(core.emits[0].payload[0].name, 'value');
  const runs = [];
  for (const fail of [false, true]) {
    const dom = new JSDOM('<main id="xtend-maraca-root"></main>', { url: 'https://audit.invalid/' });
    const host = dom.window.document.querySelector('main'), trace = [], scheduler = createRmtKernelScheduler({ preferPostTask: false });
    let runtime;
    try {
      runtime = createMaracaPlanRuntime({ plan, root: host, scheduler, documentTarget: dom.window.document, moduleApis,
        hydrateOnBoot: false, ensureComponentsOnBoot: false, stateProjectionTarget: xtendState,
        viewProjectionPort: moduleApis.viewProjection.createRmtMaracaViewProjectionAdapter({ root: host, documentTarget: dom.window.document }),
        dataSourceAdapters: { rest: { async fetch() {
          trace.push({ phase: 'datasource', flags: runtime.model.getState('flags') });
          if (fail) throw new Error('Controlled analysis datasource failure');
          return { data: { serverValue: 9 } };
        } } },
        effectAdapter: { invoke(effect, context) {
          trace.push({ phase: 'presentation:' + effect.kind, path: effect.path, flags: runtime.model.getState('flags'), contextPhase: context.phase });
          return { observed: true };
        } }
      });
      await runtime.boot();
      const result = await runtime.dispatchCommand('execute', { value: 7 }), flags = runtime.model.getState('flags');
      assert.equal(flags.success, fail ? 0 : 1); assert.equal(flags.error, fail ? 1 : 0); assert.equal(flags.direct, fail ? 0 : 7);
      assert.equal(trace[0].phase, 'datasource');
      if (!fail) {
        assert.deepEqual(trace.map(x => x.phase), ['datasource', 'presentation:navigation', 'presentation:fetch', 'presentation:navigation']);
        assert.equal(trace[1].flags.direct, 7);
      }
      const copyResult = await runtime.dispatchCommand('copystate', {});
      const copied = runtime.model.getState('copied');
      assert.equal(copyResult.status, 'success'); assert.equal(copied, 'expected');
      runs.push({ datasourceFails: fail, status: result.status, flags, trace,
        stateReferenceCopy: { status: copyResult.status, original: runtime.model.getState('original'), expected: 'expected', actual: copied, resolvedCorrectly: true } });
    } finally { runtime?.dispose(); scheduler.dispose(); dom.window.close(); xtendState.clear(); }
  }
  return { source, compileOk: compiled.ok, planOk: plan.ok, diagnostics: plan.diagnostics, coreHandlerCount: core.handlers.length,
    appPlatformHandlersPresent: true, emitPayloadNamePreserved: true, emitExecutionContractInStockRuntime: true,
    realManagedMaracaRuntime: true, kernelPlan: 'off', controlledDatasourceAndPresentationAdapters: true, runs };
}

async function inspect() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-event-condition-analysis-'));
  let runtime, scheduler, dom;
  try {
    const source = path.join(dir, 'source.rmt'); fs.writeFileSync(source, text);
    const { compileRmtClassicSource } = require('../../tools/rmt-language/classic-compiler');
    const compiled = compileRmtClassicSource(text); assert(compiled.ok);
    const coreCondition = compiled.coreDocument.events[0].condition;
    assert.equal(coreCondition.expression.kind, 'literal'); assert.equal(coreCondition.expression.value, false);
    const maraca = require('../../xtend-maraca');
    const plan = maraca.createMaracaBuildPlan({ source, out: path.join(dir, 'build'), orchestration: 'strict', kernel: 'strict', hydration: 'off', validation: 'off', transitions: 'off', lazy: false, pwa: false, services: false }, { rootDir: root, inspectToolchain: false });
    assert(plan.ok, JSON.stringify(plan.diagnostics)); assert.deepEqual(plan.diagnostics, []);
    assert.deepEqual(plan.orchestration.artifact.events[0].condition, coreCondition);
    const files = {
      state: 'xtendrmt/rmt-state-selector-runtime.js', stateProjection: 'xtendrmt/rmt-state-host-adapter.js',
      action: 'xtendrmt/rmt-action-effect-runtime.js', app: 'xtendrmt/rmt-app-runtime.js',
      renderer: 'xtendrmt/rmt-dom-descriptor-renderer.js', viewProjection: 'xtendrmt/rmt-maraca-view-projection-adapter.js',
      presentation: 'xtendrmt/rmt-presentation-effect-adapter.js', events: 'xtendrmt/rmt-event-routing-runtime.js',
      surfaces: 'xtendrmt/rmt-surface-resource-graph-runtime.js', surfaceController: 'components/xsurfacemanager-controller.js',
      kernel: 'xtendrmt/rmt-kernel-orchestration-controller.js'
    };
    const moduleApis = {};
    for (const [key, file] of Object.entries(files)) moduleApis[key] = await import(pathToFileURL(path.join(root, file)));
    const { createMaracaPlanRuntime } = await import(pathToFileURL(path.join(root, 'xtend-maraca/plan-runtime.mjs')));
    const { createRmtKernelScheduler } = await import(pathToFileURL(path.join(root, 'xtendrmt/rmt-kernel-scheduler.js')));
    const { xtendState } = await import(pathToFileURL(path.join(root, 'components/xtend-state.js')));
    const kernelApi = await import(pathToFileURL(path.join(root, 'xtendrmt/rmt-runtime.esm.js')));
    const fabric = require('../../fabric/xtend-fabric').createXtendFabric();
    dom = new JSDOM('<main id="app"></main>', { url: 'https://example.test/' });
    const document = dom.window.document, host = document.querySelector('main');
    scheduler = createRmtKernelScheduler({ preferPostTask: false });
    runtime = createMaracaPlanRuntime({ kernelApi, fabric, root: host, plan, moduleApis, scheduler, stateProjectionTarget: xtendState,
      documentTarget: document, windowTarget: dom.window, hydrateOnBoot: false, ensureComponentsOnBoot: false,
      viewProjectionPort: moduleApis.viewProjection.createRmtMaracaViewProjectionAdapter({ root: host, documentTarget: document }) });
    await runtime.boot();
    const before = runtime.model.getState('count'); assert.equal(before.value, 2);
    const target = host.querySelector('[data-rmt-surface="panel"]'); assert(target);
    target.dispatchEvent(new dom.window.CustomEvent('click', { detail: { id: 'x' }, bubbles: true }));
    await runtime.whenXTensionsIdle();
    const after = runtime.model.getState('count'), actions = runtime.snapshot().actions.map(a => ({ id: a.id, status: a.status }));
    assert.equal(after.value, 2); assert.deepEqual(actions, []);
    runtime.dispose(); runtime = null; scheduler.dispose(); scheduler = null; dom.window.close(); dom = null;
    const actionObservations = await inspectActions(dir, moduleApis, xtendState, createMaracaPlanRuntime, createRmtKernelScheduler);
    const sources = [...new Set(['development/rmtx-a06/operator-runtime-probes.cjs', 'tools/rmt-language/vnext-compiler.js',
      'tools/rmt-language/action-execution-lowering.js', 'tools/rmt-language/classic-semantic-rules.js',
      'xtend-maraca/index.js', 'xtend-maraca/plan-runtime.mjs', ...Object.values(files), 'xtendrmt/rmt-kernel-scheduler.js',
      'xtendrmt/rmt-runtime.esm.js', 'fabric/xtend-fabric.js', 'components/xtend-state.js'])];
    return { format: 1, version: '1.0.0', date: '2026-11-15', node: process.version, jsdom: require('jsdom/package.json').version,
      observation: 'restored-event-guard-reference-and-action-result-semantics', passed: true, expectedBehavior: 'no-action-dispatch',
      existingRuntimeGap: false, gapPatched: true, source: text, compileOk: compiled.ok, planOk: plan.ok, diagnostics: plan.diagnostics,
      coreConditionPreserved: true, artifactConditionPresent: true, before, after, observedActions: actions,
      actionObservations,
      nativeKernelFabricSurfaceAndModelUsed: true, realDOMEventDispatched: true, generatedBundleOrChromiumTest: false,
      sources: Object.fromEntries(sources.map(p => [p, createHash('sha256').update(fs.readFileSync(path.join(root, p))).digest('hex')])) };
  } finally { runtime?.dispose(); scheduler?.dispose(); dom?.window.close(); fs.rmSync(dir, { recursive: true, force: true }); }
}

if (require.main === module) inspect().then(result => {
  const text = JSON.stringify(result, null, 2) + '\n', file = path.join(__dirname, 'operator-runtime-evidence.json');
  if (process.argv.includes('--write')) fs.writeFileSync(file, text);
  if (process.argv.includes('--check')) assert.equal(fs.readFileSync(file, 'utf8'), text, 'Runtime observation or source drift');
  console.log(JSON.stringify({ passed: result.passed, gapPatched: result.gapPatched, before: result.before, after: result.after, node: result.node }));
}).catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { inspect };
