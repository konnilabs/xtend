// SPDX-License-Identifier: Apache-2.0
import legacyLifecycle from '@ccslabs/xtend-compiler/xtensions/native-orchestration-lifecycle';
import legacyScopes from '@ccslabs/xtend-compiler/xtensions/native-surface-scopes';
import {createMaracaNativeSurfaceGraph} from './native-surface-graph.mjs';
import {createMaracaPlanRuntime} from './plan-runtime.mjs';
import {createNativeOrchestrationIntegration} from './native-orchestration-core.mjs';

export const NATIVE_ORCHESTRATION_RUNTIME_API_VERSION = '2.0.0';
const profile = Object.freeze({programSchema:'xtend.rmt.app-orchestration.v5',compositionArtifactSchema:'xtend.maraca.xtension-composition-artifact.v12',compositionPortSchema:'xtend.maraca.xtension-composition-port.v9',runtimeSchema:'xtend.maraca.plan-runtime.v16',bindingValidator:'validateOrchestratedStateBindingArtifact',registryFactory:'createXTensionOrchestratedStateRegistry',registryMarker:'XTENSION_ORCHESTRATED_STATE_BINDING_API_VERSION',registryVersion:'6.0.0',urlVersion:'5.0.0'});
function createIntegration(program,hooks) {
  return createNativeOrchestrationIntegration(program,hooks,{lifecycle:legacyLifecycle,scopes:legacyScopes,createGraph:createMaracaNativeSurfaceGraph});
}
const nativeLifecycleRuntimePort=Object.freeze({NATIVE_LIFECYCLE_RUNTIME_API_VERSION:'2.0.0',profile,createNativeLifecycleIntegration:createIntegration});
export function createMaracaNativeOrchestrationRuntime(options={}) {
  const schema=options.plan&&Object.getOwnPropertyDescriptor(options.plan,'schema');
  if(!schema||!Object.hasOwn(schema,'value')||schema.value!=='xtend.maraca.build-plan.v11')throw new TypeError('The native orchestration entry requires its own data Plan11 schema.');
  return createMaracaPlanRuntime({...options,nativeLifecycleRuntimePort});
}
export default Object.freeze({NATIVE_ORCHESTRATION_RUNTIME_API_VERSION,createMaracaNativeOrchestrationRuntime});
