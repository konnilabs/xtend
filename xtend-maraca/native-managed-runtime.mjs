// SPDX-License-Identifier: Apache-2.0
import { createMaracaPlanRuntime } from './plan-runtime.mjs';
import { nativeLifecycleRuntimePort } from './native-managed-integration.mjs';
export const NATIVE_MANAGED_RUNTIME_API_VERSION = '3.0.0';

export function createMaracaNativeManagedRuntime(options={}) {
  const schema=options.plan&&Object.getOwnPropertyDescriptor(options.plan,'schema');
  if (!schema||!Object.hasOwn(schema,'value')||schema.value!=='xtend.maraca.build-plan.v12') throw new TypeError('The managed native entry requires its own data Plan12 schema');
  return createMaracaPlanRuntime({ ...options, nativeLifecycleRuntimePort });
}
export default Object.freeze({ NATIVE_MANAGED_RUNTIME_API_VERSION, createMaracaNativeManagedRuntime });
