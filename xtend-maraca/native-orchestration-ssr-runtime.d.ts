// SPDX-License-Identifier: Apache-2.0
import type { OrchestratedRmtxRuntimeOptions16, RmtxSSRHandoffOptions, RmtxSSRPlanRuntime18 } from './plan-runtime';
export const NATIVE_ORCHESTRATION_SSR_RUNTIME_API_VERSION: '1.0.0';
/** Separate SSR-v3 entry; the retained Source7 factory remains CSR-only. */
export function createMaracaRmtxSSRNativeOrchestrationRuntime(options:
  Omit<OrchestratedRmtxRuntimeOptions16, 'xtensionCompositionPort' | 'adoptExisting'> & RmtxSSRHandoffOptions & {
    adoptExisting?: boolean;
    xtensionCompositionPort?: Readonly<{schema:'xtend.maraca.xtension-composition-port.v11';ssrSession:RmtxSSRHandoffOptions['rmtxSSRSession'];[key:string]:unknown}>;
  }): RmtxSSRPlanRuntime18;
export { createMaracaRmtxSSRModelSnapshot } from './plan-runtime';
export { createMaracaNativeOrchestrationRuntime } from './native-orchestration-runtime';
