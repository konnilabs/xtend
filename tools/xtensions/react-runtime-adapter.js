// SPDX-License-Identifier: Apache-2.0
// Local extraction provenance and third-party notices: ./NOTICE
'use strict';

const { createRuntimeHostController } = require('./runtime-host-controller');
const { inspectReactPayloadBoundary } = require('./react-payload-boundary');
const { normalizeReactRuntimeBoundary } = require('./react-runtime-boundary');

function normalizeReactPeers(peers = {}) {
  const React = peers.React || peers.default;
  const ReactDOM = peers.ReactDOM || peers;
  const version = React?.version;
  const domExportVersion = ReactDOM.version || peers.reactDOMVersion;
  // The official react-dom@18.3.1 production artifact reports this exact build
  // string; its development artifact reports 18.3.1. Do not accept arbitrary RCs.
  const domVersion = domExportVersion === '18.3.1-next-f1338f8080-20240426' ? '18.3.1' : domExportVersion;
  if (!/^1[89]\.\d+\.\d+$/.test(version || '') || version !== domVersion) throw new TypeError('Matching stable React/ReactDOM 18.x or 19.x peers and their actual versions are required.');
  for (const name of ['createElement', 'Component', 'useLayoutEffect']) {
    if (typeof React[name] !== 'function') throw new TypeError(`React peer export ${name} is missing.`);
  }
  if (!React.Suspense || typeof ReactDOM.createRoot !== 'function') throw new TypeError('React Suspense and ReactDOM.createRoot exports are required.');
  if (peers.flushSync !== undefined && typeof peers.flushSync !== 'function') throw new TypeError('flushSync must be a function when supplied.');
  return { React, ReactDOM, versions: { react: version, 'react-dom': domVersion, 'react-dom-export': domExportVersion } };
}
function createReactInstance(runtime, component, target, xtension, onError) {
  const { React: R, ReactDOM } = runtime;
  let finish = null;
  let destroyed = false;
  let failure = null;
  const complete = (error) => { const pending = finish; finish = null; if (error) pending?.reject(error); else pending?.resolve(); };
  const fail = (error) => { failure = error; complete(error); onError(error); };
  class ErrorBoundary extends R.Component {
    constructor(props) { super(props); this.state = { failed: false }; }
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch(error) { fail(error); }
    render() { return this.state.failed ? null : this.props.children; }
  }
  function Commit({ data }) {
    R.useLayoutEffect(() => { complete(); });
    return R.createElement(R.Suspense, { fallback: null }, R.createElement(component, { ...data, xtension }));
  }
  const root = ReactDOM.createRoot(target, { onRecoverableError: fail, onUncaughtError: fail });
  if (!root || typeof root.render !== 'function' || typeof root.unmount !== 'function') throw new TypeError('ReactDOM.createRoot returned an invalid root.');
  return {
    render(data) {
      if (destroyed) throw new Error('React root is destroyed.');
      if (failure) return Promise.reject(failure);
      return new Promise((resolve, reject) => {
        finish = { resolve, reject };
        try { root.render(R.createElement(ErrorBoundary, null, R.createElement(Commit, { data }))); }
        catch (error) { finish = null; reject(error); }
      });
    },
    destroy() { if (destroyed) return; destroyed = true; try { root.unmount(); } finally { complete(new Error('React render cancelled by disposal.')); } }
  };
}
function createReactRuntimeAdapter(options = {}) {
  return createRuntimeHostController({ ...options }, { framework: 'react', normalizeBoundary: normalizeReactRuntimeBoundary,
    inspectPayload: inspectReactPayloadBoundary, normalizePeers: normalizeReactPeers, create: createReactInstance });
}
module.exports = { createReactRuntimeAdapter, normalizeReactPeers };
