// SPDX-License-Identifier: Apache-2.0
import { createMaracaRmtxSSRPlanRuntime } from './plan-runtime.mjs';
import { nativeLifecycleRuntimePort } from './native-lifecycle-integration.mjs';
export const NATIVE_LIFECYCLE_SSR_RUNTIME_API_VERSION = '1.0.0';
/** Separate prepared SSR-v3 entry; the retained CSR entry never infers it. */
export function createMaracaRmtxSSRNativeLifecycleRuntime(options = {}) {
  const schema = options.plan && Object.getOwnPropertyDescriptor(options.plan, 'schema');
  if (!schema || !Object.hasOwn(schema, 'value') || schema.value !== 'xtend.maraca.build-plan.v10') throw new TypeError('The explicit native SSR entry requires its matching own data plan.');
  return createMaracaRmtxSSRPlanRuntime({ ...options, nativeLifecycleRuntimePort });
}
export { createMaracaRmtxSSRModelSnapshot } from './plan-runtime.mjs';
// The generated guarded default app shares this asset, without changing the
// independently versioned public CSR module or widening its capabilities.
export { createMaracaNativeLifecycleRuntime } from './native-lifecycle-runtime.mjs';
