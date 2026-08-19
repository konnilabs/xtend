import { createMaracaPlanRuntime } from '/xtend-maraca/plan-runtime.mjs';
import { createRmtMaracaViewProjectionAdapter } from '/xtendrmt/rmt-maraca-view-projection-adapter.js';

export function createDocsRmtPlaygroundPlanRuntime(options = {}) {
  const { appRoot, documentTarget, windowTarget, ...runtimeOptions } = options;
  if (!appRoot || !documentTarget || !windowTarget) {
    throw new Error('The Docs RMT playground island requires explicit browser targets.');
  }
  return createMaracaPlanRuntime({
    ...runtimeOptions,
    root: appRoot,
    viewProjectionPort: createRmtMaracaViewProjectionAdapter({
      root: appRoot,
      documentTarget,
      windowTarget
    }),
    ownsViewProjectionPort: true,
    documentTarget,
    windowTarget
  });
}
