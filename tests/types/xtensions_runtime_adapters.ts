import { createReactRuntimeAdapter } from '@ccslabs/xtend/xtensions/react-runtime-adapter';
import { createVueRuntimeAdapter } from '@ccslabs/xtend/xtensions/vue-runtime-adapter';
import type { ComponentCapabilities, RuntimeHostResult } from '../../tools/xtensions/runtime-host-controller';
import { createReactHostAdapter } from '@ccslabs/xtend/xtensions/react-host-adapter';
import { createVueHostAdapter } from '@ccslabs/xtend/xtensions/vue-host-adapter';
import { createReactRuntimeAdapter as compilerReact } from '@ccslabs/xtend-compiler/xtensions/react-runtime-adapter';
import { createVueRuntimeAdapter as compilerVue } from '@ccslabs/xtend-compiler/xtensions/vue-runtime-adapter';
import { createXtendFabric } from '../../fabric/xtend-fabric';
declare const container: HTMLElement;
declare const peers: unknown;
declare const component: unknown;
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
  await react.suspend(); await react.resume(); await react.unmount();
  return identity;
}
declare const capabilities: ComponentCapabilities;
capabilities.resources.register('timer', ({ signal, guard }) => {
  const timer = setInterval(guard(() => signal.aborted), 10);
  return () => clearInterval(timer);
});
void lifecycle;
