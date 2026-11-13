// SPDX-License-Identifier: Apache-2.0
import { json, fields, canonical, copy, freeze, name } from './xtension-composition-contract.mjs';
export const XTENSION_SSR_API_VERSION = '1.0.0';
const limit = 1024 * 1024;
function bounded(value) { json(value); if (new TextEncoder().encode(canonical(value)).length > limit) throw new TypeError('SSR data exceeds one MiB.'); return freeze(copy(value)); }
async function digest(value) { return Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(value))))).map(byte => byte.toString(16).padStart(2, '0')).join(''); }
function shape(node, holes = new Set()) {
  if (node.nodeType === 3 || node.nodeType === 8) return [node.nodeType, node.data];
  if (node.nodeType !== 1) throw new TypeError('SSR supports element, text and comment nodes only.');
  return [1, node.namespaceURI, node.localName, Array.from(node.attributes, row => [row.namespaceURI, row.name, row.value]).sort((a, b) => canonical(a) < canonical(b) ? -1 : canonical(a) > canonical(b) ? 1 : 0), holes.has(node) ? null : Array.from(node.childNodes, child => shape(child, holes))];
}
const children = target => Array.from(target.childNodes, node => shape(node));
const key = address => canonical(address);
function targetFor(root, id) {
  const matches = Array.from(root.querySelectorAll('[data-maraca-surface]')).filter(node => node.getAttribute('data-maraca-surface') === id);
  if (matches.length !== 1) throw new Error('Each SSR host requires exactly one compiled Surface container.');
  return matches[0];
}
function exclusive(targets) {
  if (new Set(targets).size !== targets.length || targets.some(a => targets.some(b => a !== b && a.contains(b)))) throw new Error('SSR ownership requires disjoint exclusive host containers.');
}
/** The application supplies signature authority, peers and the trusted document.
 * Snapshot JSON never supplies executable ports, grants or command names. */
export function createMaracaXTensionSSRSession({ artifact, bindingsRuntime, resumeBindingsRuntime, options }) {
  if (!options || Object.keys(options).some(field => !['schema', 'mode', 'snapshot', 'verify', 'sign', 'generation', 'expiresInMs', 'fallback', 'intents', 'now'].includes(field)) || options.schema !== 'xtend.maraca.xtension-ssr-options.v1' || !['server', 'client'].includes(options.mode)) throw new TypeError('Versioned SSR options are required.');
  const mode = options.mode, fallback = options.fallback ?? 'reject', sign = options.sign, verify = options.verify, intentSource = options.intents, now = options.now || Date.now;
  if (!['reject', 'mount'].includes(fallback) || typeof now !== 'function' || mode === 'server' && (typeof sign !== 'function' || options.verify !== undefined || options.snapshot !== undefined || options.intents !== undefined || fallback !== 'reject') || mode === 'client' && (typeof verify !== 'function' || options.sign !== undefined || options.generation !== undefined || options.expiresInMs !== undefined)) throw new TypeError('SSR signing, verification and fallback authority must match the mode.');
  const supplied = mode === 'client' ? bounded(options.snapshot) : null;
  const capturedIntents = intentSource === undefined || typeof intentSource === 'function' ? intentSource : bounded(intentSource);
  const generation = mode === 'server' ? options.generation : supplied?.payload?.generation;
  if (typeof generation !== 'string' || !/^[A-Za-z0-9_-]{1,96}$/.test(generation)) throw new TypeError('An explicit SSR generation is required.');
  const expiresInMs = options.expiresInMs ?? 60000;
  if (mode === 'server' && (!Number.isSafeInteger(expiresInMs) || expiresInMs < 1 || expiresInMs > 86400000)) throw new TypeError('SSR lifetime must be 1..86400000 ms.');
  const validatedBindings = bindingsRuntime.validateStateBindingArtifact(artifact.plan.bindings, artifact.plan.program);
  let root, prepared = false, restored = false, ready = false, sourceDigest, rootPrefix, state, initial = [], counter = 0, closing = false;
  const records = new Map(), instances = new Map(), held = [], replayed = new Set(), phases = [];
  let report = null;
  function active() { if (closing) throw new Error('SSR session is disposed.'); }
  async function prepare(target) {
    active(); if (prepared) throw new Error('SSR sessions are single-use.');
    if (!target || target.nodeType !== 1 || target === target.ownerDocument.body || target === target.ownerDocument.documentElement || !target.id) throw new TypeError('SSR requires an identified owned application root.');
    root = target; sourceDigest = await digest(artifact); active();
    rootPrefix = await digest({ rootId: root.id, sourceDigest, generation }); active();
    if (mode === 'server') {
      if (root.childNodes.length) throw new Error('Server SSR requires an empty owned root.');
      prepared = true; return Object.freeze({ adoptExisting: false });
    }
    fields(supplied, ['schema', 'payload', 'signature'], 'signed SSR snapshot');
    const payload = supplied.payload;
    fields(payload, ['schema', 'generation', 'sourceHash', 'compositionSha256', 'rootId', 'issuedAt', 'expiresAt', 'state', 'hosts', 'shell'], 'SSR payload');
    const time = now();
    if (supplied.schema !== 'xtend.maraca.xtension-ssr-snapshot.v1' || payload.schema !== 'xtend.maraca.xtension-ssr-payload.v1' || payload.sourceHash !== artifact.plan.sourceHash || payload.compositionSha256 !== sourceDigest || payload.rootId !== root.id || !Number.isSafeInteger(time) || !Number.isSafeInteger(payload.issuedAt) || !Number.isSafeInteger(payload.expiresAt) || payload.issuedAt > time || payload.expiresAt <= time || payload.expiresAt - payload.issuedAt < 1 || payload.expiresAt - payload.issuedAt > 86400000 || !Array.isArray(payload.hosts) || payload.hosts.length > 1024) throw new Error('SSR snapshot identity or lifetime is invalid.');
    if (await verify(canonical(payload), supplied.signature) !== true) throw new Error('SSR signature verification failed.');
    active(); if (now() >= payload.expiresAt) throw new Error('SSR snapshot expired during verification.');
    state = payload.state;
    const stateIds = artifact.plan.program.state.states.map(row => row.id);
    fields(state, stateIds, 'restored Model state');
    if (Object.keys(state).length !== stateIds.length) throw new Error('SSR state must cover exactly the compiled Model states.');
    initial = bindingsRuntime.materializeStateBindingArtifact(validatedBindings, { states: state });
    if (initial.length !== payload.hosts.length) throw new Error('SSR snapshot does not cover the restored keyed host set.');
    const targets = [];
    initial.forEach((entry, i) => {
      const record = payload.hosts[i], provider = artifact.manifest.providers.find(row => row.id === artifact.manifest.hosts.find(row => row.declarationId === entry.binding.address.declarationId)?.providerId);
      fields(record, ['address', 'hostSurface', 'surface', 'providerId', 'framework', 'version', 'peers', 'identifierPrefix', 'props', 'dom'], 'SSR host');
      if (!provider || key(record.address) !== key(entry.binding.address) || record.hostSurface !== entry.hostSurface || record.surface !== entry.surface || record.providerId !== provider.id || record.framework !== provider.framework || record.version !== provider.version || canonical(record.peers) !== canonical(provider.peers) || record.identifierPrefix !== `xth-${generation}-${rootPrefix}-${i}-` || records.has(key(record.address))) throw new Error('SSR host identity differs from the compiled provider/binding.');
      if (canonical(resumeBindingsRuntime.propsFrom({ states: state }, entry.binding)) !== canonical(record.props)) throw new Error('Signed SSR props do not match the restored Model.');
      const target = targetFor(root, entry.hostSurface); targets.push(target); records.set(key(record.address), { record, target, anchor: shape(target, new Set([target])), claimed: false });
    });
    exclusive(targets);
    if (canonical(shape(root, new Set(targets))) !== canonical(payload.shell)) throw new Error('SSR shell ownership does not match the signed snapshot.');
    if (fallback === 'reject' && [...records.values()].some(({ record, target }) => canonical(children(target)) !== canonical(record.dom))) throw new Error('SSR framework DOM differs from the signed snapshot.');
    phases.push('verified'); prepared = true;
    return Object.freeze({ initialState: freeze(copy(state)), adoptExisting: true });
  }
  function confirmRestored(snapshot) {
    active(); if (!prepared || restored) throw new Error('SSR restore order is invalid.');
    if (mode === 'client' && canonical(snapshot.states) !== canonical(state)) throw new Error('The Model was not restored before adoption.');
    initial = bindingsRuntime.materializeStateBindingArtifact(validatedBindings, snapshot);
    restored = true; phases.push('restored');
  }
  function hostContext(context, provider) {
    active(); if (!restored) throw new Error('Framework work requires Model restore first.');
    const address = context.identity.address, id = key(address), previous = records.get(id);
    const isInitial = initial.some(entry => key(entry.binding.address) === id);
    if (mode === 'client' && !ready && (!previous || previous.claimed)) throw new Error('Unknown or duplicate SSR adoption claim.');
    if (previous && mode === 'client' && !ready && previous.target !== context.container) throw new Error('SSR container identity changed before adoption.');
    if (previous) previous.claimed = true;
    const index = initial.findIndex(entry => key(entry.binding.address) === id);
    const identifierPrefix = previous?.record?.identifierPrefix || previous?.identifierPrefix || (isInitial ? `xth-${generation}-${rootPrefix}-${index}-` : `xth-${generation}-${rootPrefix}-new-${++counter}-`);
    if (!root.contains(context.container) || context.container === root || [...records.values()].some(row => row.target !== context.container && (row.target.contains(context.container) || context.container.contains(row.target)))) throw new Error('SSR host container ownership overlaps.');
    if (!previous) records.set(id, { target: context.container, context, provider, identifierPrefix, claimed: true });
    return Object.freeze({ mode, fallback, identifierPrefix,
      validateTarget(target, props) {
        active(); if (target !== context.container || !root.contains(target)) throw new Error('SSR host escaped its owned root.');
        if (!previous || ready) return target.childNodes.length === 0;
        if (targetFor(root, previous.record.hostSurface) !== target || canonical(shape(target, new Set([target]))) !== canonical(previous.anchor)) throw new Error('SSR container identity or attributes changed while loading.');
        if (canonical(props) !== canonical(previous.record.props)) throw new Error('Restored props differ from the signed SSR host.');
        return canonical(children(target)) === canonical(previous.record.dom);
      }
    });
  }
  function gate(context) {
    return event => {
      if (closing || mode === 'server') return false;
      if (ready) return context.onEvent(event);
      if (held.length >= 128) throw new Error('SSR held-intent limit exceeded.');
      held.push({ schema: 'xtend.maraca.xtension-ssr-intent.v1', id: `held-${held.length}`, generation, address: context.identity.address, event: event.event, payload: event.payload });
      return false;
    };
  }
  function retire(address) { if (ready) { records.delete(key(address)); instances.delete(key(address)); } }
  function bind(entry, instance) { active(); instances.set(key(entry.binding.address), { entry, instance }); }
  function validatedIntents(input) {
    input = bounded(input); if (!Array.isArray(input) || input.length > 128) throw new Error('SSR replay requires at most 128 structured intents.');
    const unique = new Map();
    for (const intent of input) {
      fields(intent, ['schema', 'id', 'generation', 'address', 'event', 'payload'], 'SSR intent'); name(intent.id);
      const bound = instances.get(key(intent.address)), spec = bound?.entry.binding.intents[intent.event];
      if (intent.schema !== 'xtend.maraca.xtension-ssr-intent.v1' || intent.generation !== generation || !spec || !intent.payload || typeof intent.payload !== 'object' || Array.isArray(intent.payload) || Object.keys(intent.payload).length !== Object.keys(spec.fields).length) throw new Error('SSR replay intent is not bound to this restored generation.');
      for (const [field, type] of Object.entries(spec.fields)) {
        if (!Object.hasOwn(intent.payload, field)) throw new Error('Missing SSR replay field.');
        resumeBindingsRuntime.typed(intent.payload[field], type, 'SSR replay field');
      }
      if (unique.has(intent.id) && canonical(unique.get(intent.id)) !== canonical(intent)) throw new Error('SSR intent ID was reused with different data.');
      unique.set(intent.id, intent);
    }
    return [...unique.values()];
  }
  async function finish() {
    active(); if (!restored || ready) throw new Error('SSR adoption order is invalid.');
    if (initial.some(entry => !instances.has(key(entry.binding.address))) || instances.size !== initial.length) throw new Error('SSR host adoption is incomplete.');
    await Promise.all([...instances.values()].map(row => row.instance.whenIdle())); active();
    const hosts = [...instances.values()].map(({ entry, instance }) => ({ address: entry.binding.address, result: instance.getSSRReport() }));
    if (hosts.some(row => !row.result || mode === 'client' && !['resumed', 'fallback-mounted'].includes(row.result.status) || mode === 'server' && row.result.status !== 'server-rendered')) throw new Error('An SSR host did not complete its framework operation.');
    phases.push(mode === 'server' ? 'rendered' : 'adopted');
    // Validate the complete captured batch before the first Model command.
    const intents = mode === 'server' ? [] : validatedIntents([...(typeof capturedIntents === 'function' ? capturedIntents() : capturedIntents || []), ...held]);
    ready = true;
    for (const intent of intents) {
      active(); if (replayed.has(intent.id)) continue;
      const bound = instances.get(key(intent.address));
      if (!bound) throw new Error('SSR replay target ended its lifetime.');
      const before = bound.instance.snapshot().diagnostics.length;
      bound.instance.replay({ type: intent.event, payload: intent.payload });
      await bound.instance.whenIdle(); active();
      if (bound.instance.snapshot().diagnostics.length !== before) throw new Error('SSR replay command failed.');
      replayed.add(intent.id);
    }
    if (mode === 'client') phases.push('replayed');
    report = freeze({ schema: 'xtend.maraca.xtension-ssr-report.v1', apiVersion: XTENSION_SSR_API_VERSION, mode, generation,
      status: mode === 'server' ? 'server-rendered' : hosts.some(row => row.result.status === 'fallback-mounted') ? 'fallback-mounted' : 'resumed', hosts, replayedIntents: replayed.size, phases: [...phases] });
    return report;
  }
  async function capture(snapshot) {
    active(); if (mode !== 'server' || !ready || !report) throw new Error('Only completed SSR can produce a snapshot.');
    const hosts = initial.map(entry => {
      const row = records.get(key(entry.binding.address)), instance = instances.get(key(entry.binding.address)).instance;
      return { address: entry.binding.address, hostSurface: entry.hostSurface, surface: entry.surface, providerId: row.provider.id, framework: row.provider.framework, version: row.provider.version, peers: row.provider.peers,
        identifierPrefix: row.identifierPrefix, props: instance.snapshot().props, dom: children(row.target) };
    });
    root.setAttribute('data-maraca-ssr-shell', '');
    const targets = initial.map(entry => records.get(key(entry.binding.address)).target); exclusive(targets);
    const issuedAt = now();
    if (!Number.isSafeInteger(issuedAt) || !Number.isSafeInteger(issuedAt + expiresInMs)) throw new Error('SSR clock must return safe integer milliseconds.');
    const payload = bounded({ schema: 'xtend.maraca.xtension-ssr-payload.v1', generation, sourceHash: artifact.plan.sourceHash, compositionSha256: sourceDigest, rootId: root.id, issuedAt, expiresAt: issuedAt + expiresInMs, state: snapshot.states, hosts, shell: shape(root, new Set(targets)) });
    const html = root.outerHTML, signature = await sign(canonical(payload)); active();
    const signed = bounded({ schema: 'xtend.maraca.xtension-ssr-snapshot.v1', payload, signature });
    return freeze({ schema: 'xtend.maraca.xtension-ssr-response.v1', apiVersion: XTENSION_SSR_API_VERSION, html, snapshot: signed, report });
  }
  return Object.freeze({ schema: 'xtend.maraca.xtension-ssr-session.v1', mode, prepare, confirmRestored, hostContext, gate, bind, retire, finish, capture,
    shouldAdopt: entry => mode === 'client' && !ready && records.has(key(entry.binding.address)),
    getReport: () => report,
    dispose() { closing = true; held.length = 0; instances.clear(); records.clear(); }
  });
}
