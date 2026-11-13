// A06 explicit reference composition. Does not extend the automatic Maraca ABI.
import { createMaracaPlanRuntime } from '../../xtend-maraca/plan-runtime.mjs';
import { createRmtCore } from '../../xtendrmt/rmt-runtime.esm.js';
import { createRmtKernelScheduler } from '../../xtendrmt/rmt-kernel-scheduler.js';
import * as state from '../../xtendrmt/rmt-state-selector-runtime.js';
import * as stateProjection from '../../xtendrmt/rmt-state-host-adapter.js';
import * as action from '../../xtendrmt/rmt-action-effect-runtime.js';
import * as app from '../../xtendrmt/rmt-app-runtime.js';
import * as renderer from '../../xtendrmt/rmt-dom-descriptor-renderer.js';
import * as viewProjection from '../../xtendrmt/rmt-maraca-view-projection-adapter.js';
import * as presentation from '../../xtendrmt/rmt-presentation-effect-adapter.js';
import * as events from '../../xtendrmt/rmt-event-routing-runtime.js';
import * as surfaces from '../../xtendrmt/rmt-surface-resource-graph-runtime.js';
import * as surfaceControllerApi from '../../components/xsurfacemanager-controller.js';
import { xtendState } from '../../components/xtend-state.js';
import bindingRuntime from '../../tools/xtensions/state-binding.js';
import reactAdapter from '../../tools/xtensions/react-runtime-adapter.js';
import vueAdapter from '../../tools/xtensions/vue-runtime-adapter.js';
import fabricApi from '../../fabric/xtend-fabric.js';
import { createComponent as createGallery } from './providers/react-gallery.mjs';
import { createComponent as createReviews } from './providers/vue-reviews.mjs';

export function createTwoHostCase({ lowered, document, React, ReactDOM, Vue, waitForProvider } = {}) {
  const previousState = xtendState.snapshot().data;
  const root = document.createElement('main'); root.id = 'xtend-maraca-root'; document.body.append(root);
  const scheduler = createRmtKernelScheduler({ preferPostTask: false });
  const kernel = createRmtCore({ scheduler }).rmt, rootId = 'a06-product-details';
  const fabric = fabricApi.createXtendFabric(), controller = surfaceControllerApi.createSurfaceController({ fabric });
  const hosts = [], commands = [];
  kernel.mountRoot(rootId, root);
  let graph;
  // Independent, trusted application grants; JSX requests do not create them.
  const implementations = {
    'react-product-gallery': { framework: 'react', lane: 'visible', create: createGallery, peers: { React, ReactDOM } },
    'vue-product-reviews': { framework: 'vue', lane: 'idle', create: createReviews, peers: { Vue } }
  };
  const runtime = createMaracaPlanRuntime({ plan: lowered.plan, root, scheduler, fabric, surfaceController: controller,
    hydrateOnBoot: false, ensureComponentsOnBoot: false, stateProjectionTarget: xtendState,
    moduleApis: { state, stateProjection, action, app, renderer, viewProjection, presentation, events, surfaceController: surfaceControllerApi,
      surfaces: { ...surfaces, createRmtSurfaceResourceGraphRuntime(options) { graph = surfaces.createRmtSurfaceResourceGraphRuntime(options); return graph; } } },
    xtensionBindingsRuntime: bindingRuntime,
    viewProjectionPort: viewProjection.createRmtMaracaViewProjectionAdapter({ root, documentTarget: document }),
    createXTensionHost(context) {
      const definition = lowered.hosts.find(host => host.declarationId === context.identity.address.declarationId);
      if (!definition || context.surface !== definition.targetSurface) throw new TypeError('A06 host binding does not match its declared target.');
      const implementation = implementations[definition.providerId];
      if (!implementation || implementation.framework !== definition.framework || implementation.lane !== definition.lane) throw new TypeError('A06 source requests do not match application grants.');
      const react = definition.framework === 'react', entry = { context, definition };
      const factory = react ? reactAdapter.createReactKernelRuntimeAdapter : vueAdapter.createVueKernelRuntimeAdapter;
      entry.host = factory({ container: context.container, hostId: context.hostId, surfaceId: context.surfaceId, xtensionId: context.xtensionId,
        component: react ? props => { entry.facade = props.xtension; return React.createElement(entry.component, props); }
          : { inheritAttrs: false, setup(_props, { attrs }) { return () => { entry.facade = attrs.xtension; return Vue.h(entry.component, { ...attrs }); }; } },
        fabric, expectedVersions: definition.peers,
        kernelWork: { scheduler, rootId, scope: context.xtensionId, lifecycle: { lane: implementation.lane }, work: { inspect: { lane: 'background', maxChunkMs: 2 } } },
        // Trusted host composition supplies ownership; source data cannot obtain ports.
        resourceGraph: { kernel, surfaceGraph: graph, surfaceController: controller, surfaceId: lowered.ownerSurface },
        capabilityRequirements: { schema: 'xtend.xtensions.host-capability-requirements.v1', framework: definition.framework,
          required: { features: ['kernel.lifecycle', 'fabric.boundary', 'surface.lifecycle', 'props.controlled'], events: Object.keys(context.events), work: ['inspect'] } },
        policy: { events: context.events },
        onEvent(event) { commands.push({ declarationId: definition.declarationId, event: event.event }); return context.onEvent(event); },
        async loadRuntime({ signal }) {
          await waitForProvider?.({ definition, signal });
          if (signal.aborted) throw new Error('A06 provider lifetime ended.');
          const peers = implementation.peers;
          entry.component = implementation.create(peers);
          return peers;
        }
      });
      hosts.push(entry); return entry.host;
    }
  });
  return { root, runtime, kernel, scheduler, fabric, hosts, commands, state: xtendState,
    get graph() { return graph; },
    latest(id) { return [...hosts].reverse().find(host => host.definition.declarationId === id); },
    async idle() { await runtime.whenXTensionsIdle(); },
    async close() {
      runtime.dispose();
      try { await runtime.whenXTensionsIdle(); } finally {
        kernel.disposeRoot(rootId); controller.dispose(); scheduler.dispose(); root.remove();
        xtendState.clear(); xtendState.batchUpdate(previousState);
      }
    }
  };
}
