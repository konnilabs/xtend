import { createReactRuntimeAdapter } from '@ccslabs/xtend/xtensions/react-runtime-adapter';
import { createVueRuntimeAdapter } from '@ccslabs/xtend/xtensions/vue-runtime-adapter';
import type { ComponentCapabilities, RuntimeHostResult } from '../../tools/xtensions/runtime-host-controller';
import { createReactHostAdapter } from '@ccslabs/xtend/xtensions/react-host-adapter';
import { createVueHostAdapter } from '@ccslabs/xtend/xtensions/vue-host-adapter';
import { createReactRuntimeAdapter as compilerReact } from '@ccslabs/xtend-compiler/xtensions/react-runtime-adapter';
import { createVueRuntimeAdapter as compilerVue } from '@ccslabs/xtend-compiler/xtensions/vue-runtime-adapter';
import { createXTensionStateRegistry, XTENSION_STATE_BINDING_SCHEMA } from '@ccslabs/xtend/xtensions/state-binding';
import { createXTensionStateRegistry as compilerStateRegistry } from '@ccslabs/xtend-compiler/xtensions/state-binding';
import type { RmtModelReader, RmtModelCommandPort } from '../../xtendrmt/rmt-state-selector-runtime.js' with { 'resolution-mode': 'import' };
import { createXtendFabric } from '../../fabric/xtend-fabric';
declare const container: HTMLElement;
declare const peers: unknown;
declare const component: unknown;
declare const modelReader: RmtModelReader;
declare const modelCommandPort: RmtModelCommandPort;
const sameStateRegistry: typeof createXTensionStateRegistry = compilerStateRegistry;
const registry = createXTensionStateRegistry({ modelReader, modelCommandPort });
const bound = registry.bind({ schema: XTENSION_STATE_BINDING_SCHEMA,
  address: { documentId: 'doc', declarationId: 'panel', keys: ['item-1'] },
  props: { title: { state: 'panel', path: ['title'], type: 'string' } },
  intents: { change: { command: 'panel.change', payloadSchema: 'xtend.schemas.xtension.intent.v1', fields: {
    selection: { type: 'object', fields: { ids: { type: 'array', items: { type: 'string' } } } }
  } } }
}, (context) => createReactRuntimeAdapter({ container, component, peers, ...context, policy: { events: context.events } }));
// @ts-expect-error Object rules require an explicit field contract.
registry.bind({ schema: XTENSION_STATE_BINDING_SCHEMA, address: { documentId: 'doc', declarationId: 'bad', keys: [] }, props: { x: { state: 'x', path: [], type: 'object' } }, intents: {} }, () => react);
void bound; void sameStateRegistry;
const react = createReactRuntimeAdapter({ container, component, peers, policy: { events: { selected: 'selection.v1' }, allowedResources: ['timer'] } });
const vue = createVueRuntimeAdapter({ container, component, loadRuntime: async ({ signal }) => { signal.throwIfAborted(); return peers; } });
const legacyReact: Record<string, unknown> = createReactHostAdapter();
const legacyVue: Record<string, unknown> = createVueHostAdapter();
const sameReact: typeof createReactRuntimeAdapter = compilerReact;
const sameVue: typeof createVueRuntimeAdapter = compilerVue;
const actualFabric = createXtendFabric();
createReactRuntimeAdapter({ container, component, peers, fabric: actualFabric });
createVueRuntimeAdapter({ container, component, peers, fabric: actualFabric });
// @ts-expect-error Runtime adapters require an explicit host configuration.
createReactRuntimeAdapter();
// @ts-expect-error A legacy Host adapter is not the asynchronous Runtime contract.
const wrongRuntime: ReturnType<typeof createVueRuntimeAdapter> = createVueHostAdapter();
async function lifecycle() {
  const result: RuntimeHostResult = await react.mount(container, { label: 'initial' });
  const identity: string | undefined = result.cleanupRecords[0]?.xtensionId;
  await vue.update({ updateAdapter: 'applyPropsUpdate', props: { label: 'next' } });
  await react.suspend(); await react.resume('latest-state', { props: { label: 'current' } }); await react.unmount();
  return identity;
}
declare const capabilities: ComponentCapabilities;
capabilities.resources.register('timer', ({ signal, guard }) => {
  const timer = setInterval(guard(() => signal.aborted), 10);
  return () => clearInterval(timer);
});
void lifecycle;
