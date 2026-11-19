// SPDX-License-Identifier: Apache-2.0
import type {OrchestratedRmtxRuntimeOptions16, OrchestratedRmtxPlanRuntime16} from './plan-runtime';
export const NATIVE_ORCHESTRATION_RUNTIME_API_VERSION: '2.0.0';
/** Explicit Source7 entry; executes through the shared real Kernel/Fabric path. */
export function createMaracaNativeOrchestrationRuntime(options: OrchestratedRmtxRuntimeOptions16): OrchestratedRmtxPlanRuntime16;
declare const api: Readonly<{NATIVE_ORCHESTRATION_RUNTIME_API_VERSION: typeof NATIVE_ORCHESTRATION_RUNTIME_API_VERSION; createMaracaNativeOrchestrationRuntime: typeof createMaracaNativeOrchestrationRuntime}>;
export default api;
