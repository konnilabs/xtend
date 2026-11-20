import type { ManagedRmtxRuntimeOptions17, ManagedRmtxPlanRuntime17 } from './plan-runtime';
export declare const NATIVE_MANAGED_RUNTIME_API_VERSION: '3.0.0';
export declare function createMaracaNativeManagedRuntime(options: ManagedRmtxRuntimeOptions17): ManagedRmtxPlanRuntime17;
declare const api: Readonly<{ NATIVE_MANAGED_RUNTIME_API_VERSION: typeof NATIVE_MANAGED_RUNTIME_API_VERSION; createMaracaNativeManagedRuntime: typeof createMaracaNativeManagedRuntime }>;
export default api;
