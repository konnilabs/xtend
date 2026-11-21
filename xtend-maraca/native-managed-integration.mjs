// SPDX-License-Identifier: Apache-2.0
// Private shared integration; public CSR/SSR entries expose no hook factories.
import managedLifecycle from '@ccslabs/xtend-compiler/xtensions/native-managed-lifecycle';
import managedScopes from '@ccslabs/xtend-compiler/xtensions/native-managed-surface-scopes';
import { createNativeOrchestrationIntegration } from './native-orchestration-core.mjs';
import { createNativeSurfaceGraphProfile } from './native-surface-graph-core.mjs';
import { createMaracaNativePlatformHost } from './native-platform-host.mjs';
const profile = Object.freeze({ programSchema:'xtend.rmt.app-orchestration.v6', actionSchema:'xtend.rmt.action-plan.v3', compositionArtifactSchema:'xtend.maraca.xtension-composition-artifact.v13', compositionPortSchema:'xtend.maraca.xtension-composition-port.v10', runtimeSchema:'xtend.maraca.plan-runtime.v17', bindingValidator:'validateManagedStateBindingArtifact', registryFactory:'createXTensionManagedStateRegistry', registryMarker:'XTENSION_MANAGED_STATE_BINDING_API_VERSION', registryVersion:'7.0.0', urlVersion:'6.0.0' });
const lifecycle = managedLifecycle;
function createIntegration(program,hooks) {
  const host = createMaracaNativePlatformHost({ program, nativePort: hooks.platform().options.nativeViewRuntimePort, platform: hooks.platform });
  hooks.installNativePlatformHost(host);
  const integration = createNativeOrchestrationIntegration(program,hooks,{
    lifecycle, scopes:managedScopes,
    afterSynchronize(platform) { platform.options.synchronizeNativeComponents?.(); },
    createGraph:options=>createNativeSurfaceGraphProfile(options,managedScopes,'xtend.maraca.native-surface-graph.v4'),
    prepareRegistry(supplied) {
      const host=hooks.nativeRuntimeHost;
      if (!host || typeof host.resolve!=='function') throw new TypeError('Source8 native registry requires its actual Controller/Kernel owner port');
      return Object.freeze({ ...(supplied||{}), nativeRuntimeHost:host });
    }
  });
  return Object.freeze({ ...integration, async dispose() { try { await integration.dispose(); } finally { host.dispose(); } } });
}
export const nativeLifecycleRuntimePort=Object.freeze({ NATIVE_LIFECYCLE_RUNTIME_API_VERSION:'3.0.0', profile, createNativeLifecycleIntegration:createIntegration });
