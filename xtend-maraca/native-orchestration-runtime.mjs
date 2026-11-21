// SPDX-License-Identifier: Apache-2.0
import { createMaracaPlanRuntime } from './plan-runtime.mjs';
import { nativeLifecycleRuntimePort } from './native-orchestration-integration.mjs';
export const NATIVE_ORCHESTRATION_RUNTIME_API_VERSION = '2.0.0';

export function createMaracaNativeOrchestrationRuntime(options={}) {
  const schema=options.plan&&Object.getOwnPropertyDescriptor(options.plan,'schema');
  if(!schema||!Object.hasOwn(schema,'value')||schema.value!=='xtend.maraca.build-plan.v11')throw new TypeError('The native orchestration entry requires its own data Plan11 schema.');
  return createMaracaPlanRuntime({...options,nativeLifecycleRuntimePort});
}
export default Object.freeze({NATIVE_ORCHESTRATION_RUNTIME_API_VERSION,createMaracaNativeOrchestrationRuntime});
