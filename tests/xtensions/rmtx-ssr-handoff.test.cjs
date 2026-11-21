'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const contract = require('../../xtend-maraca/xtension-rmtx-ssr-contract.mjs');
const resume = require('../../tools/xtensions/state-binding-resume');
const bindingContract = require('../../tools/xtensions/state-binding-contract');
const { createMaracaXTensionSSRSession } = require('../../xtend-maraca/xtension-ssr-runtime.mjs');
const canonical = require('../../xtend-maraca/xtension-composition-contract.mjs').canonical;

const identity = version => ({ schema: 'xtend.maraca.rmtx-ssr-source-identity.v1', sourceProfile: { syntax: 'rmtx', version }, sourceHash: 'a'.repeat(64),
  project: { schema: 'xtend.rmt.project-report.v1', apiVersion: '1.0.0', identity: 'b'.repeat(64), sourceSyntax: 'rmt-vnext' } });
const projection = { schema: 'xtend.xtensions.state-binding.v3', address: { documentId: 'app', declarationId: 'host', keys: [1] },
  props: { value: { type: 'string', projection: { kind: 'path', root: 'state', symbol: 'catalog', path: ['value'] } } },
  intents: { select: { command: 'catalog.select', payloadSchema: 'select.v1', fields: { value: { type: 'string' } }, keyFields: { id: { index: 0, type: 'number' } } } } };

test('RMTX SSR provenance closes versions, hashes and project source identity independently of old artifacts', () => {
  const input = identity('8.0.0'), captured = contract.normalizeRmtxSSRSourceIdentity(input, { sourceHash: input.sourceHash });
  assert.deepEqual(captured, input); assert(Object.isFrozen(captured.project));
  input.project.identity = 'c'.repeat(64); assert.notEqual(captured.project.identity, input.project.identity);
  for (const mutate of [
    row => { row.untrusted = true; }, row => { delete row.project; }, row => { row.sourceProfile.version = '9.0.0'; },
    row => { row.sourceProfile.extra = true; }, row => { row.project.apiVersion = '2.0.0'; },
    row => { row.project.sourceSyntax = 'tsx'; }, row => { row.project.identity = 'short'; }, row => { row.project.entryFile = '/outside'; }
  ]) { const row = identity('8.0.0'); mutate(row); assert.throws(() => contract.normalizeRmtxSSRSourceIdentity(row)); }
  assert.throws(() => contract.normalizeRmtxSSRSourceIdentity(identity('8.0.0'), { sourceHash: '0'.repeat(64) }));
});

test('resume API4 adopts controlled projections and typed intents through the existing Model boundary', async () => {
  const calls = [], commands = []; let subscription, state = { states: { catalog: { value: 'restored' } }, selectors: {} };
  const options = { modelReader: { snapshot: () => state, subscribe: listener => { subscription = listener; return () => {}; } }, modelCommandPort: { apply: (...args) => commands.push(args) } };
  const old = resume.createXTensionResumeStateRegistry(options);
  assert.equal(old.apiVersion, '3.0.0');
  assert.throws(() => old.bind(projection, () => {}), /versioned registry/);
  await old.dispose();
  const registry = resume.createXTensionRMTXResumeStateRegistry(options);
  assert.equal(registry.apiVersion, '4.0.0');
  const instance = registry.bind(projection, context => ({
    schema: 'xtend.xtensions.runtime-host-controller.v7', apiVersion: '7.0.0',
    adopt(target, props) { calls.push(['adopt', target, props]); return { status: 'ok' }; },
    mount() { throw new Error('Adoption must not silently mount.'); },
    update(value) { calls.push(['update', value.props]); return { status: 'ok' }; },
    suspend() { return { status: 'ok' }; }, resume() { return { status: 'ok' }; }, unmount() { calls.push(['unmount']); },
    async whenIdle() {}, getSSRReport() { return { status: 'resumed' }; },
    emit(event) {
      const accepted = context.onEvent({ ok: true, direction: 'upstream', event: event.type, payload: event.payload, payloadSchema: 'select.v1',
        source: { hostId: context.hostId, surfaceId: context.surfaceId, xtensionId: context.xtensionId } });
      return { ok: accepted };
    }
  }));
  const target = {};
  await instance.adopt(target);
  assert.deepEqual(calls[0], ['adopt', target, { value: 'restored' }]);
  instance.replay({ type: 'select', payload: { value: 'selected' } });
  assert.equal(commands.length, 1);
  assert.deepEqual(commands[0][0].payload, { value: 'selected', id: 1 });
  assert.throws(() => instance.replay({ type: 'select', payload: { value: 42 } }));
  assert.equal(commands.length, 1);
  state = { states: { catalog: { value: 'next' } }, selectors: {} }; subscription({ pending: false });
  await registry.flush(); assert.deepEqual(calls.at(-1), ['update', { value: 'next' }]);
  await instance.suspend(); assert.throws(() => instance.replay({ type: 'select', payload: { value: 'late' } }));
  await registry.dispose(); assert.equal(calls.at(-1)[0], 'unmount'); assert.equal(commands.length, 1);
});

test('initial SSR binding admission uses the compiled lifecycle guards and closed ancestors', () => {
  const { compileRmtxSource } = require('../../tools/rmt-language/rmtx-compiler');
  const { createRMTXSSRBindingAdmissionRuntime } = require('../../tools/xtensions/state-binding-resume-admission');
  for (const version of ['6.0.0', '7.0.0', '8.0.0']) {
    const compile = compileRmtxSource(`import {RMT,model} from '@ccslabs/xtend/rmt-language/rmtx';
      export default <RMT.Program id="native"><RMT.State id="ui" type="object" initial={{mount:true,hydrate:true}}/>
      <RMT.Surface id="parent"><RMT.Lane name="visible"><RMT.Mount target="parent" when={model.ui.mount}/>
      ${version === '6.0.0' ? '' : '<RMT.Hydrate target="parent" when={model.ui.hydrate}/>'}</RMT.Lane>
      <RMT.View><RMT.Text value="native"/></RMT.View></RMT.Surface></RMT.Program>`, { syntaxVersion: version });
    assert.equal(compile.ok, true, JSON.stringify(compile.diagnostics));
    const program = compile.orchestrationArtifacts;
    const native = require('../../tools/xtensions/' + (version === '6.0.0' ? 'native-lifecycle' : version === '7.0.0' ? 'native-orchestration-lifecycle' : 'native-managed-lifecycle'));
    const admission = createRMTXSSRBindingAdmissionRuntime({ programSchema: program.schema,
      ...(version === '6.0.0' ? { nativeLifecycleAdmission: native.nativeLifecycleAdmission } : version === '7.0.0'
        ? { validateLifecyclePlan: native.validateNativeOrchestrationLifecyclePlan, evaluateLifecyclePlan: native.evaluateNativeOrchestrationLifecyclePlan, nativeOrchestrationAdmission: native.nativeOrchestrationLifecycleAdmission }
        : { validateLifecyclePlan: native.validateNativeManagedLifecyclePlan, evaluateLifecyclePlan: native.evaluateNativeManagedLifecyclePlan, nativeOrchestrationAdmission: native.nativeManagedLifecycleAdmission }) });
    const snapshot = (mount, hydrate) => ({ states: { ui: { mount, hydrate } }, selectors: {} });
    assert.equal(admission(program, snapshot(true, true)).parent, true);
    // Closed or unmounted initial content cannot create framework roots.
    assert.equal(admission(program, snapshot(false, true)).parent, false);
    if (version !== '6.0.0') assert.equal(admission(program, snapshot(true, false)).parent, false);
    const closed = structuredClone(program); closed.surfaces[0].initialState = 'closed';
    assert.equal(admission(closed, snapshot(true, true)).parent, false);
    assert.throws(() => createRMTXSSRBindingAdmissionRuntime()(program, snapshot(true, true)), /profile differs/);
  }
  assert.equal(createRMTXSSRBindingAdmissionRuntime()({ schema: 'xtend.rmt.app-orchestration.v2' }, { states: {} }), undefined);
});

test('native-only v3 signs an independent native handoff and verifies before Model preview', async t => {
  const { JSDOM } = require('jsdom');
  const doms = []; t.after(() => doms.forEach(dom => dom.window.close()));
  const document = html => { const dom = new JSDOM(html); doms.push(dom); return dom.window.document; };
  const state = { catalog: { title: 'signed' } }, sourceIdentity = identity('5.0.0');
  const program = { schema: 'xtend.rmt.app-orchestration.v3', state: { states: [{ id: 'catalog', initial: state.catalog }] }, surfaces: [{ id: 'native' }], render: { nativeView: { schema: 'xtend.rmt.native-view.v1' } } };
  const artifact = contract.createRmtxSSRNativeArtifact(program, sourceIdentity);
  assert.equal(artifact.schema, 'xtend.maraca.rmtx-ssr-native-artifact.v1'); assert.equal(Object.hasOwn(artifact, 'manifest'), false);
  assert.throws(() => contract.createRmtxSSRNativeArtifact(program, identity('6.0.0')));
  const digest = text => createHash('sha256').update(text).digest('hex');
  const ports = { artifact, sourceIdentity, createModelSnapshot: states => ({ states, selectors: {} }),
    resumeBindingsRuntime: { ...resume, typed: bindingContract.typed, propsFrom: bindingContract.propsFrom } };
  const server = createMaracaXTensionSSRSession({ ...ports, options: { schema: 'xtend.maraca.xtension-ssr-options.v3', mode: 'server', generation: 'request', sign: digest } });
  const root = document('<main id="app"></main>').getElementById('app');
  await server.prepare(root); server.confirmRestored({ states: state, selectors: {} });
  root.innerHTML = '<section data-maraca-surface="native">signed</section>';
  await server.finish(); const response = await server.capture({ states: state });
  assert.equal(response.schema, 'xtend.maraca.xtension-ssr-response.v3');
  assert.deepEqual(response.snapshot.payload.sourceIdentity, sourceIdentity);
  assert.equal(response.snapshot.payload.hosts.length, 0);
  assert.equal(response.snapshot.signature, digest(canonical(response.snapshot.payload)));
  let previews = 0;
  const snapshot = structuredClone(response.snapshot);
  const client = createMaracaXTensionSSRSession({ ...ports, createModelSnapshot(states) { previews++; return { states, selectors: {} }; },
    options: { schema: 'xtend.maraca.xtension-ssr-options.v3', mode: 'client', snapshot, verify: (text, signature) => digest(text) === signature } });
  const clientRoot = document(response.html).getElementById('app'), child = clientRoot.firstChild;
  const restored = await client.prepare(clientRoot); assert.equal(previews, 1); assert.deepEqual(restored.initialState, state);
  client.confirmRestored({ states: state, selectors: {} }); await client.finish(); assert.equal(clientRoot.firstChild, child);
  assert.deepEqual(client.getReport().phases, ['verified', 'restored', 'adopted', 'replayed']);
  for (const mutate of [row => { row.signature = 'bad'; }, row => { row.payload.sourceIdentity.project.identity = '0'.repeat(64); }, row => { row.schema = 'xtend.maraca.xtension-ssr-snapshot.v2'; }]) {
    const changed = structuredClone(response.snapshot); mutate(changed); let touched = 0;
    const rejected = createMaracaXTensionSSRSession({ ...ports, createModelSnapshot(states) { touched++; return { states }; }, options: {
      schema: 'xtend.maraca.xtension-ssr-options.v3', mode: 'client', snapshot: changed, verify: (text, signature) => digest(text) === signature
    } });
    await assert.rejects(rejected.prepare(document(response.html).getElementById('app'))); assert.equal(touched, 0);
  }
  assert.throws(() => createMaracaXTensionSSRSession({ ...ports, options: { schema: 'xtend.maraca.xtension-ssr-options.v2', mode: 'server', generation: 'legacy', sign: digest } }));
  server.dispose(); client.dispose();
});
