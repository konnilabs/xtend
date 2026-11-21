import type { XTensionProjectionStateBinding, XTensionBindingHostContext, XTensionResumeBoundInstance } from './state-binding';
import type { SSRRuntimeHostController } from './runtime-host-controller';
import { createXTensionResumeStateRegistry } from './state-binding';

export const XTENSION_RMTX_RESUME_STATE_BINDING_API_VERSION: '4.0.0';
export const XTENSION_RESUME_STATE_BINDING_API_VERSION: '3.0.0';
export function createXTensionRMTXResumeStateRegistry(options: Parameters<typeof createXTensionResumeStateRegistry>[0]): {
  readonly apiVersion: '4.0.0';
  bind(definition: XTensionProjectionStateBinding, createHost: (context: XTensionBindingHostContext) => SSRRuntimeHostController): XTensionResumeBoundInstance;
  flush(): Promise<void>;
  dispose(): Promise<void>;
};
export { createXTensionResumeStateRegistry } from './state-binding';
