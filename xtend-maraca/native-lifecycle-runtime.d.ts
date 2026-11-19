// SPDX-License-Identifier: Apache-2.0
import type { LifecycleRmtxRuntimeOptions, LifecycleRmtxPlanRuntime } from './plan-runtime';
export const NATIVE_LIFECYCLE_RUNTIME_API_VERSION: '1.0.0';
/** Explicit Source6 entry; retains the shared real Kernel/Fabric runtime. */
export function createMaracaNativeLifecycleRuntime(options: LifecycleRmtxRuntimeOptions): LifecycleRmtxPlanRuntime;
declare const api: Readonly<{ NATIVE_LIFECYCLE_RUNTIME_API_VERSION: typeof NATIVE_LIFECYCLE_RUNTIME_API_VERSION;
  createMaracaNativeLifecycleRuntime: typeof createMaracaNativeLifecycleRuntime }>;
export default api;
