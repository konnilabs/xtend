// SPDX-License-Identifier: Apache-2.0
// Private shared integration; public CSR/SSR entries expose no hook factories.
import legacyLifecycle from '@ccslabs/xtend-compiler/xtensions/native-orchestration-lifecycle';
import legacyScopes from '@ccslabs/xtend-compiler/xtensions/native-surface-scopes';
import {createMaracaNativeSurfaceGraph} from './native-surface-graph.mjs';
import {createNativeOrchestrationIntegration} from './native-orchestration-core.mjs';
const profile = Object.freeze({programSchema:'xtend.rmt.app-orchestration.v5',compositionArtifactSchema:'xtend.maraca.xtension-composition-artifact.v12',compositionPortSchema:'xtend.maraca.xtension-composition-port.v9',runtimeSchema:'xtend.maraca.plan-runtime.v16',bindingValidator:'validateOrchestratedStateBindingArtifact',registryFactory:'createXTensionOrchestratedStateRegistry',registryMarker:'XTENSION_ORCHESTRATED_STATE_BINDING_API_VERSION',registryVersion:'6.0.0',urlVersion:'5.0.0'});
function createIntegration(program,hooks) {
  return createNativeOrchestrationIntegration(program,hooks,{lifecycle:legacyLifecycle,scopes:legacyScopes,createGraph:createMaracaNativeSurfaceGraph});
}
export const nativeLifecycleRuntimePort=Object.freeze({NATIVE_LIFECYCLE_RUNTIME_API_VERSION:'2.0.0',profile,createNativeLifecycleIntegration:createIntegration});
