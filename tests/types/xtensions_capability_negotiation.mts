import { createReactKernelRuntimeAdapter, type HostCapabilityRequirements, type NegotiatedRuntimeHostOptions } from '@ccslabs/xtend/xtensions/react-runtime-adapter';
import { createVueKernelRuntimeAdapter } from '@ccslabs/xtend-compiler/xtensions/vue-runtime-adapter';
import { createRmtCore } from '@ccslabs/xtend/rmt';
import { createRmtKernelScheduler } from '../../xtendrmt/rmt-kernel-scheduler.js';
import { createRmtSurfaceResourceGraphRuntime } from '../../xtendrmt/rmt-surface-resource-graph-runtime.js';
import { createSurfaceController } from '../../components/xsurfacemanager-controller.js';
import { createXtendFabric } from '../../fabric/xtend-fabric.js';
import { createMaracaPlanRuntime } from '@ccslabs/xtend-maraca/plan-runtime';
import { createXTensionStateRegistry } from '@ccslabs/xtend/xtensions/state-binding';
const scheduler = createRmtKernelScheduler(), kernel = createRmtCore({ scheduler }).rmt, fabric = createXtendFabric();
const surfaceGraph = createRmtSurfaceResourceGraphRuntime(), surfaceController = createSurfaceController({ fabric });
const capabilityRequirements = { schema: 'xtend.xtensions.host-capability-requirements.v1', required: { features: ['kernel.lifecycle'], work: ['scan'] },
  optional: { features: ['render.ssr'] } } satisfies HostCapabilityRequirements;
const kernelOptions = { container: document.body, component: {}, fabric, kernelWork: { scheduler, rootId: 'app', scope: 'item', work: { scan: { maxChunkMs: 4 } } }, capabilityRequirements } satisfies NegotiatedRuntimeHostOptions;
const graphOptions = { ...kernelOptions, resourceGraph: { kernel, surfaceGraph, surfaceController, surfaceId: 'panel' } } satisfies NegotiatedRuntimeHostOptions;
const budgetOptions = { ...graphOptions, workBudget: { schema: 'xtend.xtensions.work-budget-policy.v1' as const, maxPending: 1, work: { scan: { maxPending: 1 } } } } satisfies NegotiatedRuntimeHostOptions;
const react = createReactKernelRuntimeAdapter(kernelOptions), vue = createVueKernelRuntimeAdapter(graphOptions), budget = createReactKernelRuntimeAdapter(budgetOptions);
const schema: 'xtend.xtensions.runtime-host-controller.v6' = react.schema;
const version: '6.0.0' = vue.apiVersion;
const adapter: 'xtend.xtensions.react-runtime-adapter.v6' = budget.adapterSchema;
const capabilities: 'xtend.xtensions.runtime-capabilities.v2' = vue.getCapabilities().schema;
const noPreemption: false = react.getCapabilities().features['execution.preemption'];
const report: 'xtend.xtensions.host-capability-negotiation.v1' = budget.getCapabilityNegotiation().schema;
const runtime = createMaracaPlanRuntime({ root: document.body, plan: {}, createXTensionHost: () => react });
const registry = createXTensionStateRegistry({ modelReader: runtime.model as any, commandDispatcher: { dispatch: () => Promise.resolve() } });
registry.bind({ schema: 'xtend.xtensions.state-binding.v2', address: { documentId: 'd', declarationId: 'n', keys: [] }, props: {}, intents: {} }, () => vue);
// @ts-expect-error Invalid requirements cannot fall through to the legacy overloads.
createReactKernelRuntimeAdapter({ ...kernelOptions, capabilityRequirements: { schema: 'unsupported' } });
// @ts-expect-error Requirements use the reviewed feature vocabulary.
createVueKernelRuntimeAdapter({ ...graphOptions, capabilityRequirements: { schema: 'xtend.xtensions.host-capability-requirements.v1', required: { features: ['invented.feature'] } } });
// @ts-expect-error Budget negotiation still requires real graph ports.
createReactKernelRuntimeAdapter({ ...kernelOptions, workBudget: budgetOptions.workBudget });
// @ts-expect-error Negotiation facts are deeply readonly.
react.getCapabilities().features['execution.preemption'] = true;
// @ts-expect-error Component work never receives a freely selectable negotiation/request policy.
const invalid: HostCapabilityRequirements = { ...capabilityRequirements, provided: { preemption: true } };
void schema; void version; void adapter; void capabilities; void noPreemption; void report; void invalid;
