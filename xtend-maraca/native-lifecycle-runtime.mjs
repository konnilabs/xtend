// SPDX-License-Identifier: Apache-2.0
import { createMaracaPlanRuntime } from './plan-runtime.mjs';
import { nativeLifecycleRuntimePort } from './native-lifecycle-integration.mjs';
export const NATIVE_LIFECYCLE_RUNTIME_API_VERSION = '1.0.0';

/** Source6 is explicitly opted in; the old factory never infers this port. */
export function createMaracaNativeLifecycleRuntime(options = {}) {
  const schema = options.plan && Object.getOwnPropertyDescriptor(options.plan, 'schema');
  if (!schema || !Object.hasOwn(schema, 'value') || schema.value !== 'xtend.maraca.build-plan.v10')
    throw new TypeError('The Native lifecycle entry requires an own data Plan10 schema.');
  return createMaracaPlanRuntime({ ...options, nativeLifecycleRuntimePort });
}
export default Object.freeze({ NATIVE_LIFECYCLE_RUNTIME_API_VERSION, createMaracaNativeLifecycleRuntime });
