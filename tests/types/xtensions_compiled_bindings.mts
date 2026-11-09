import * as bindings from '@ccslabs/xtend/xtensions/state-binding';
import { compileRmtClassicSource, compileRmtClassicAstWithBindings, type RmtClassicAst } from '@ccslabs/xtend-compiler/rmt-language/classic-compiler';
import { createReactRuntimeAdapter } from '@ccslabs/xtend/xtensions/react-runtime-adapter';
import { createMaracaPlanRuntime } from '@ccslabs/xtend-maraca/plan-runtime';
import type { RmtModelReader } from '../../xtendrmt/rmt-state-selector-runtime.js';
declare const ast: RmtClassicAst;
declare const modelReader: RmtModelReader;
declare const declaration: bindings.XTensionStateBinding;
declare const root: HTMLElement;
const artifact: bindings.XTensionStateBindingArtifact = { schema: bindings.XTENSION_STATE_BINDING_ARTIFACT_SCHEMA,
  documentId: 'doc', bindings: [{ surface: 'panel', binding: declaration, presence: { state: 'hosts', path: ['left'] } }] };
const source = compileRmtClassicSource('state title type string initial "title"', { xtensionBindings: artifact });
const compiled = compileRmtClassicAstWithBindings(ast, artifact);
const runtime = createMaracaPlanRuntime({ root, plan: { xtensionBindings: compiled.xtensionBindings, orchestration: { artifact: compiled.orchestrationArtifacts } },
  xtensionBindingsRuntime: bindings, createXTensionHost(context) {
    return createReactRuntimeAdapter({ ...context, component: {}, peers: {}, policy: { events: context.events } });
  } });
const registry = bindings.createXTensionStateRegistry({ modelReader, commandDispatcher: {
  dispatch(command, payload, metadata, lifetime) { return runtime.dispatchCommand(command, payload, metadata, lifetime); }
} });
// @ts-expect-error Serialized bindings cannot provide host factories.
const invalid: bindings.XTensionStateBindingArtifact = { ...artifact, createHost() {} };
// @ts-expect-error A registry cannot have two command authorities.
bindings.createXTensionStateRegistry({ modelReader, modelCommandPort: { apply() {} }, commandDispatcher: { dispatch() {} } });
void source; void invalid; void registry.flush(); void runtime.whenXTensionsIdle();
void runtime.getXTensionBindings()[0]?.instance.identity;

// @ts-expect-error Legacy v1 cannot carry the v2 presence contract.
const legacyPresence: bindings.XTensionStateBindingArtifact = { schema: 'xtend.xtensions.state-binding-artifact.v1', documentId: 'doc', bindings: [{ surface: 'panel', binding: declaration, presence: { state: 'hosts', path: [] } }] };
void legacyPresence;
