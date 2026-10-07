// SPDX-License-Identifier: Apache-2.0
// Local extraction provenance and third-party notices: ./NOTICE
'use strict';

const { createRuntimeHostController } = require('./runtime-host-controller');
const { inspectVuePayloadBoundary } = require('./vue-payload-boundary');
const { normalizeVueRuntimeBoundary } = require('./vue-runtime-boundary');

function normalizeVuePeers(peers = {}) {
  const Vue = peers.Vue || peers;
  if (!/^3\.\d+\.\d+$/.test(Vue.version || '')) throw new TypeError('A stable Vue 3.x peer with its actual version is required.');
  for (const name of ['createApp', 'h', 'reactive', 'nextTick']) {
    if (typeof Vue[name] !== 'function') throw new TypeError(`Vue peer export ${name} is missing.`);
  }
  return { Vue, versions: { vue: Vue.version } };
}
function createVueInstance({ Vue: V }, component, target, xtension, onError) {
  const state = V.reactive({ props: {} });
  const app = V.createApp({ name: 'XTensionHost', setup: () => () => V.h(component, { ...state.props, xtension }) });
  if (!app || typeof app.mount !== 'function' || typeof app.unmount !== 'function' || !app.config) throw new TypeError('Vue.createApp returned an invalid application.');
  app.config.errorHandler = onError;
  let mounted = false, destroyed = false;
  return {
    async render(props) {
      if (destroyed) throw new Error('Vue application is destroyed.');
      state.props = props;
      if (!mounted) { mounted = true; app.mount(target); }
      await V.nextTick();
    },
    destroy() { if (destroyed) return; destroyed = true; if (mounted) app.unmount(); }
  };
}
function createVueRuntimeAdapter(options = {}) {
  return createRuntimeHostController({ ...options }, { framework: 'vue', normalizeBoundary: normalizeVueRuntimeBoundary,
    inspectPayload: inspectVuePayloadBoundary, normalizePeers: normalizeVuePeers, create: createVueInstance });
}
module.exports = { createVueRuntimeAdapter, normalizeVuePeers };
