// SPDX-License-Identifier: Apache-2.0
import type { ManagedRmtxRuntimeOptions17, RmtxSSRHandoffOptions, RmtxSSRPlanRuntime18 } from './plan-runtime';
export const NATIVE_MANAGED_SSR_RUNTIME_API_VERSION: '1.0.0';
/** Separate SSR-v3 entry; the retained Source8 factory remains CSR-only. */
export declare function createMaracaRmtxSSRNativeManagedRuntime(options:
  Omit<ManagedRmtxRuntimeOptions17, 'xtensionCompositionPort' | 'adoptExisting'> & RmtxSSRHandoffOptions & {
    adoptExisting?: boolean;
    xtensionCompositionPort?: Readonly<{schema:'xtend.maraca.xtension-composition-port.v11';ssrSession:RmtxSSRHandoffOptions['rmtxSSRSession'];[key:string]:unknown}>;
  }): RmtxSSRPlanRuntime18;
export { createMaracaRmtxSSRModelSnapshot } from './plan-runtime';
export { createMaracaNativeManagedRuntime } from './native-managed-runtime';
