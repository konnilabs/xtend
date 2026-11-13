// SPDX-License-Identifier: Apache-2.0
'use strict';
const { createRuntimeHostController } = require('./runtime-host-controller');
const { clone, freeze } = require('./state-binding-contract');
const XTENSION_FRAMEWORK_SSR_API_VERSION = '1.0.0';
function nodes(target) {
  const result = [];
  function visit(node) { for (const child of node.childNodes) { result.push(child); visit(child); } }
  visit(target); return result;
}
function normalizeFrameworkSSRPeers(mode, framework, loaded, normalizePeers) {
    if (mode === 'client') {
      const normalized = normalizePeers(loaded);
      if (framework === 'react' && (typeof normalized.ReactDOM.hydrateRoot !== 'function' || typeof normalized.React.useEffect !== 'function') || framework === 'vue' && typeof normalized.Vue.createSSRApp !== 'function') throw new TypeError('Actual framework hydration exports are required.');
      return normalized;
    }
    if (framework === 'react') {
      const React = loaded?.React, ReactDOM = loaded?.ReactDOMServer;
      if (!/^(18|19)\.\d+\.\d+$/.test(React?.version || '') || ReactDOM?.version !== React.version || typeof React.createElement !== 'function' || typeof React.Component !== 'function' || typeof React.useEffect !== 'function' || typeof ReactDOM.renderToString !== 'function') throw new TypeError('Matching stable React/ReactDOMServer peers are required.');
      return { React, ReactDOM, ReactDOMServer: ReactDOM, versions: { react: React.version, 'react-dom': ReactDOM.version } };
    }
    const normalized = normalizePeers(loaded), renderer = loaded?.VueServerRenderer;
    if (typeof normalized.Vue.createSSRApp !== 'function' || typeof renderer?.renderToString !== 'function' || loaded.vueServerRendererVersion !== normalized.Vue.version) throw new TypeError('Matching Vue and server-renderer peers are required.');
    return { ...normalized, VueServerRenderer: renderer };
  
}
function createFrameworkSSRAdapter(options, driver) {
  const input = options.ssr;
  if (!input || !['server', 'client'].includes(input.mode) || typeof input.identifierPrefix !== 'string' || !/^[A-Za-z0-9_-]{1,256}$/.test(input.identifierPrefix) || typeof input.validateTarget !== 'function' || !['reject', 'mount'].includes(input.fallback)) throw new TypeError('An explicit trusted SSR session context is required.');
  if (!options.resourceGraph || !options.capabilityRequirements) throw new TypeError('SSR requires graph-bound, capability-negotiated Kernel/Fabric hosts.');
  const ssr = Object.freeze({ ...input });
  let matches = true;
  return createRuntimeHostController(options, { ...driver, kernel: true, ssr: {
    mode: ssr.mode,
    validateTarget(target, props) { matches = ssr.validateTarget(target, props); if (matches !== true && ssr.fallback !== 'mount') throw new Error('Verified SSR host DOM does not match.'); }
  },
  normalizePeers: loaded => normalizeFrameworkSSRPeers(ssr.mode, driver.framework, loaded, driver.normalizePeers),
  create(runtime, component, target, xtension, onError, { adopting }) {
    const before = nodes(target), hydrate = ssr.mode === 'client' && adopting && matches;
    let root, app, destroyed = false, mounted = false, state, failure = null, complete;
    let report = null;
    const fail = error => { failure = error; complete?.reject(error); onError(error); };
    const ErrorBoundary = runtime.React ? class extends runtime.React.Component {
      constructor(props) { super(props); this.state = { failed: false }; }
      static getDerivedStateFromError() { return { failed: true }; }
      componentDidCatch(error) { fail(error); }
      render() { return this.state.failed ? null : this.props.children; }
    } : null;
    const reactTree = props => runtime.React.createElement(ErrorBoundary, null, runtime.React.createElement(ReactHost, { data: props }));
    const useCommitEffect = runtime.React && (ssr.mode === 'server' ? runtime.React.useEffect : runtime.React.useLayoutEffect);
    function ReactHost({ data }) {
      useCommitEffect(() => { complete?.resolve(); });
      return runtime.React.createElement(component, { ...data, xtension });
    }
    if (runtime.Vue) state = runtime.Vue.reactive({ props: {} });
    async function renderVueServer(props) {
      const serverApp = runtime.Vue.createSSRApp({ render: () => runtime.Vue.h(component, { ...props, xtension }) });
      serverApp.config.idPrefix = ssr.identifierPrefix;
      return runtime.VueServerRenderer.renderToString(serverApp);
    }
    return {
      async render(props) {
        if (destroyed) throw new Error('SSR host is destroyed.');
        if (failure) throw failure;
        if (ssr.mode === 'server') {
          if (mounted) throw new Error('A server-rendered host is immutable; render a new request.');
          const html = runtime.React
            ? runtime.ReactDOM.renderToString(reactTree(props), { identifierPrefix: ssr.identifierPrefix })
            : await renderVueServer(props);
          if (destroyed) throw new Error('SSR rendering was cancelled.');
          if (runtime.React && /<!--\$|<template\b/.test(html)) throw new Error('SSR v1 requires synchronous React output without Suspense boundaries.');
          if (/<!--teleport (?:start|end)/i.test(html)) throw new Error('SSR v1 requires exclusive containers without Vue Teleport.');
          // Provider HTML is produced by the actual framework from trusted code.
          target.innerHTML = html; mounted = true;
          report = { schema: 'xtend.xtensions.framework-ssr-result.v1', framework: driver.framework, status: 'server-rendered', nodeIdentityPreserved: false };
          return;
        }
        if (!mounted && adopting && !hydrate) target.replaceChildren();
        if (runtime.React) {
          await new Promise((resolve, reject) => {
            complete = { resolve, reject };
            const tree = reactTree(props);
            try {
              if (!root) root = hydrate ? runtime.ReactDOM.hydrateRoot(target, tree, { identifierPrefix: ssr.identifierPrefix, onRecoverableError: fail, onUncaughtError: fail }) : runtime.ReactDOM.createRoot(target, { identifierPrefix: ssr.identifierPrefix, onRecoverableError: fail, onUncaughtError: fail });
              if (!hydrate || mounted) root.render(tree);
            } catch (error) { reject(error); }
          });
        } else {
          state.props = props;
          if (!app) {
            const V = runtime.Vue;
            app = (hydrate ? V.createSSRApp : V.createApp)({ name: 'XTensionSSRHost', setup: () => () => V.h(component, { ...state.props, xtension }) });
            app.config.idPrefix = ssr.identifierPrefix; app.config.errorHandler = fail; app.mount(target);
          }
          await runtime.Vue.nextTick();
        }
        if (failure) throw failure;
        if (!mounted) {
          const after = nodes(target), preserved = hydrate && before.length === after.length && before.every((node, i) => after[i] === node);
          if (hydrate && (!preserved || ssr.validateTarget(target, props) !== true)) throw new Error('Framework hydration changed signed server DOM; adoption failed.');
          report = { schema: 'xtend.xtensions.framework-ssr-result.v1', framework: driver.framework, status: hydrate ? 'resumed' : adopting ? 'fallback-mounted' : 'mounted', nodeIdentityPreserved: preserved };
        }
        mounted = true;
      },
      ssrReport: () => report && freeze(clone(report)),
      destroy() { if (destroyed) return; destroyed = true; root?.unmount(); if (app) app.unmount(); complete?.reject(new Error('SSR host disposed.')); }
    };
  } });
}
module.exports = { XTENSION_FRAMEWORK_SSR_API_VERSION, createFrameworkSSRAdapter, normalizeFrameworkSSRPeers };
