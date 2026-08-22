import {
  createApp,
  createStore,
  createXTendRegistry,
  getXTendHost,
  readyXTend,
  render,
  schedule,
  type XTendDescriptor,
  type XTendStore
} from '@ccslabs/xtend';
import { xtendState, type XTendStateRuntime } from '@ccslabs/xtend/classic-state';
// @ts-expect-error Classic state is intentionally absent from the side-effect-free root.
import { xtendState as rootStateRuntime } from '@ccslabs/xtend';
import {
  createMaracaPlanRuntime,
  type MaracaPlanRuntimeOptions,
  type MaracaPlanRuntimeSnapshot
} from '@ccslabs/xtend/maraca/plan-runtime';
import { createMaracaBrowserCompositionRoot, freezeMaracaConfiguration } from '@ccslabs/xtend/maraca/browser-composition-runtime';
import { createRmtMaracaViewProjectionAdapter } from '@ccslabs/xtend/rmt/maraca-view-projection-adapter';
import { createRmtPresentationEffectAdapter } from '@ccslabs/xtend/rmt/presentation-effect-adapter';
import {
  createRmtFormValidationEvaluator,
  createRmtFormValidationViewProjector
} from '@ccslabs/xtend/rmt/form-validation-runtime';
import { createRmtResumeRuntime } from '@ccslabs/xtend/rmt/resume-runtime';
import { createRmtStateBindingViewProjector } from '@ccslabs/xtend/rmt/state-binding-view-projector';
import { createRmtStateSelectorRuntime } from '@ccslabs/xtend/rmt/state-selector-runtime';
import { createRmtStateHostAdapter } from '@ccslabs/xtend/rmt/state-host-adapter';

void rootStateRuntime;
const classicRuntime: XTendStateRuntime = xtendState;
classicRuntime.set('fixture.ready', true);

await readyXTend();
const host = getXTendHost();
host.snapshot();
// @ts-expect-error managed hosts do not expose the mutable orchestration controller
host.controller;
const isolatedRegistry = createXTendRegistry({ orchestration: 'lightweight' });
await isolatedRegistry.readyXTend();
isolatedRegistry.disposeXTend();
const maracaRoot = document.createElement('main');
const maracaBrowserConfig = freezeMaracaConfiguration({ schema: 'xtend.maraca.bundle-report.v1', components: [], surfaces: [] });
const maracaBrowserComposition = createMaracaBrowserCompositionRoot(maracaBrowserConfig, { createPlanRuntime: createMaracaPlanRuntime });
maracaBrowserComposition.facade.snapshot();
maracaBrowserComposition.facade.orchestration.snapshot();
const maracaViewProjectionPort = createRmtMaracaViewProjectionAdapter({ root: maracaRoot, documentTarget: document, windowTarget: window });
const stateBindingProjector = createRmtStateBindingViewProjector({ strict: false, documentTarget: document });
const stateProjectionPort = createRmtStateHostAdapter({
  target: {
    batchUpdate(updates) { void updates; }
  },
  strictMaraca: true
});
stateProjectionPort.batchUpdate({ 'demo.count': 1 });
const projectedModel = createRmtStateSelectorRuntime({
  states: [{ id: 'demo.count', type: 'number', initial: 0 }],
  stateProjectionPort,
  createStateProjectionPort: createRmtStateHostAdapter,
  strictMaraca: true
});
projectedModel.stateProjectionPort?.batchUpdate({ 'demo.count': 2 });
stateBindingProjector.project(maracaRoot, [], { states: {}, selectors: {}, derived: {} });
const presentationEffectPort = createRmtPresentationEffectAdapter({ root: maracaRoot, strict: false });
presentationEffectPort.snapshot();
const validationEvaluator = createRmtFormValidationEvaluator({
  validationPlan: {
    groups: [{ id: 'profile', fields: [{ state: 'profile.name', surface: 'profile.name', rules: [{ kind: 'required' }] }] }]
  }
});
const validationViewProjector = createRmtFormValidationViewProjector({ root: maracaRoot, strict: false });
const validationProjectionPlan = validationViewProjector.prepare(validationEvaluator.evaluate({
  model: { 'profile.name': { value: '' } },
  report: true
}));
validationViewProjector.finalize(validationProjectionPlan);
// @ts-expect-error prepared Validation projection plans are immutable
validationProjectionPlan.projectionCount = 0;
// @ts-expect-error prepared Validation projection records are deeply immutable
validationProjectionPlan.projections[0].invalid = false;
const resumeRuntime = createRmtResumeRuntime({ root: maracaRoot, document });
resumeRuntime.snapshot();
const maracaRuntime = createMaracaPlanRuntime({ plan: {}, root: maracaRoot, viewProjectionPort: maracaViewProjectionPort });
const maracaOptions: MaracaPlanRuntimeOptions = {
  plan: {},
  root: maracaRoot,
  viewProjectionPort: maracaViewProjectionPort,
  stateProjectionTarget: { batchUpdate(updates) { void updates; } },
  targetResolver(binding, rootTarget) {
    void binding;
    return rootTarget;
  }
};
void maracaOptions;
const maracaBootSnapshot = await maracaRuntime.boot();
maracaBootSnapshot.commitCount;
// @ts-expect-error boot resolves to a snapshot, not the mutable runtime controller
maracaBootSnapshot.dispatchCommand('demo.save');
// @ts-expect-error managed runtime snapshots are immutable
maracaBootSnapshot.commitCount = 0;
maracaRuntime.model.snapshot();
const commandResult = await maracaRuntime.dispatchCommand('demo.save');
commandResult.status;
const unsubscribeMaraca = maracaRuntime.subscribe((runtimeSnapshot: MaracaPlanRuntimeSnapshot) => {
  runtimeSnapshot.commitCount;
  runtimeSnapshot.phase;
  // @ts-expect-error subscribers receive immutable snapshots without mutable runtime handles
  runtimeSnapshot.renderer;
});
unsubscribeMaraca();
const legacyRenderCommit = await maracaRuntime.render();
legacyRenderCommit.nodeCount;
// @ts-expect-error legacy render aliases expose no mutable DOM target
legacyRenderCommit.target;
// @ts-expect-error legacy render commit summaries are immutable
legacyRenderCommit.nodeCount = 0;
const streamCommit = await maracaRuntime.dispatchStreamPatch({ type: 'delta', target: 'demo.result' });
streamCommit.schema;
streamCommit.modelOperations;
// @ts-expect-error managed stream commit plans are immutable
streamCommit.modelOperations.push({ operation: 'set', state: 'demo.result', value: 'unsafe' });
// @ts-expect-error managed Maraca runtimes do not expose the DOM renderer
maracaRuntime.renderer;
// @ts-expect-error managed Maraca runtimes do not expose raw Action adapters
maracaRuntime.rawActionRuntime;
// @ts-expect-error managed Maraca runtimes do not expose an adapter escape hatch
maracaRuntime.getRuntimeAdapters();
// @ts-expect-error the compatibility state alias is read-only
maracaRuntime.stateRuntime.setState('demo', {});

interface State {
  count: number;
  profile: { name: string };
}

// @ts-expect-error XTendStore is a type, not a constructible runtime export.
new XTendStore<State>();

const app = createApp<State>({ initialState: { count: 0, profile: { name: 'Ada' } } });
const store = createStore<State>({
  states: [
    { id: 'count', type: 'number', initial: 0 },
    { id: 'profile', type: 'object', initial: { name: 'Ada' } }
  ]
});
const descriptor: XTendDescriptor = { type: 'text', text: String(store.getState('count')) };
const root = document.createElement('main');
render(root, descriptor);
schedule(() => app.setState({ count: 1, profile: { name: 'Grace' } }));

// @ts-expect-error unknown state id
store.getState('missing');
// @ts-expect-error count must remain numeric
store.setState('count', 'one');
// @ts-expect-error element descriptors require a tag
const invalidDescriptor: XTendDescriptor = { type: 'element', children: [] };
void invalidDescriptor;
