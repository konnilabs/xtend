import { createReactKernelRuntimeAdapter, type GraphRuntimeHostOptions } from '@ccslabs/xtend/xtensions/react-runtime-adapter';
import { createVueKernelRuntimeAdapter } from '@ccslabs/xtend/xtensions/vue-runtime-adapter';
import { createRmtCore } from '@ccslabs/xtend/rmt';
import { createRmtKernelScheduler } from '../../xtendrmt/rmt-kernel-scheduler.js';
import { createRmtSurfaceResourceGraphRuntime } from '../../xtendrmt/rmt-surface-resource-graph-runtime.js';
import { createSurfaceController } from '../../components/xsurfacemanager-controller.js';
import { createXtendFabric } from '../../fabric/xtend-fabric.js';
import { createMaracaPlanRuntime } from '@ccslabs/xtend-maraca/plan-runtime';
import { createXTensionStateRegistry } from '@ccslabs/xtend/xtensions/state-binding';
const scheduler = createRmtKernelScheduler(), kernel = createRmtCore({ scheduler }).rmt;
const fabric = createXtendFabric(), surfaceController = createSurfaceController({ fabric });
const surfaceGraph = createRmtSurfaceResourceGraphRuntime();
const options = { container: document.body, component: {}, fabric, kernelWork: { scheduler, rootId: 'app', scope: 'item' },
  resourceGraph: { kernel, surfaceGraph, surfaceController, surfaceId: 'panel' } } satisfies GraphRuntimeHostOptions;
const react = createReactKernelRuntimeAdapter(options), vue = createVueKernelRuntimeAdapter(options);
const schema: 'xtend.xtensions.runtime-host-controller.v4' = react.schema;
const version: '4.0.0' = vue.apiVersion;
const adapter: 'xtend.xtensions.react-runtime-adapter.v4' = react.adapterSchema;
const binding: 'xtend.xtensions.resource-graph-binding.v1' = vue.snapshot().resourceGraph.schema;
const runtime = createMaracaPlanRuntime({ root: document.body, plan: {}, createXTensionHost: () => react });
const registry = createXTensionStateRegistry({ modelReader: runtime.model as any, commandDispatcher: { dispatch: () => Promise.resolve() } });
registry.bind({ schema: 'xtend.xtensions.state-binding.v2', address: { documentId: 'd', declarationId: 'p', keys: [] }, props: {}, intents: {} }, () => vue);
// @ts-expect-error The graph option requires the canonical Surface Controller subscription port.
const invalid: GraphRuntimeHostOptions = { ...options, resourceGraph: { ...options.resourceGraph, surfaceController: {} } };
void schema; void version; void adapter; void binding; void invalid;
