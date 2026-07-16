export const WORKBENCH_RUNTIME_HOST_SCHEMA = 'xtend.material.workbench-runtime-host.v1';

import { installWorkbenchDevApi } from './workbench-dev-api.mjs';

const root = document.getElementById('xtend-material-workbench');
const output = document.getElementById('xtm-runtime-status');
const mount = document.getElementById('xtm-runtime-mount');
const bootStateOutput = document.getElementById('xtm-runtime-boot-state');
const surfaceCountOutput = document.getElementById('xtm-runtime-surface-count');
const devApiStateOutput = document.getElementById('xtm-runtime-dev-api-state');

globalThis.__XTendMaracaDisableAutoBoot = true;
const bootStartedAt = performance.now();

try {
  const { bootXtendMaraca } = await import('../dist/xtend.maraca.mjs');
  const result = await bootXtendMaraca({ root, lazyStrategy: 'eager' });
  const devApiController = installWorkbenchDevApi({
    globalTarget: globalThis,
    bootResult: result,
    bootDurationMs: performance.now() - bootStartedAt
  });
  const surfaceCount = root.querySelectorAll('[data-maraca-surface]').length;
  const requiredDevApiMethods = ['getPerformanceSnapshot', 'getFabricTelemetrySnapshot', 'getKernelSnapshot'];
  const devApiReady = Boolean(devApiController && requiredDevApiMethods.every((method) => typeof devApiController.api[method] === 'function'));
  const snapshotsSerializable = devApiReady && requiredDevApiMethods.every((method) => {
    try { JSON.stringify(devApiController.api[method]()); return true; } catch (_) { return false; }
  });
  const mountStyle = mount ? getComputedStyle(mount) : null;
  const mountRect = mount ? mount.getBoundingClientRect() : null;
  const presentationReady = Boolean(mountStyle && mountRect
    && mountStyle.position === 'absolute'
    && mountStyle.overflow === 'hidden'
    && mountRect.width <= 1
    && mountRect.height <= 1);
  const ok = Boolean(result && result.ok && result.orchestration && result.orchestration.enabled && surfaceCount >= 15 && devApiReady && snapshotsSerializable && presentationReady);
  document.documentElement.dataset.maracaRuntimeReady = String(ok);
  document.documentElement.dataset.xtendDevApiReady = String(devApiReady && snapshotsSerializable);
  document.documentElement.dataset.xtmRuntimePresentationReady = String(presentationReady);
  if (bootStateOutput) bootStateOutput.value = result && result.status === 'booted' ? 'Booted' : String(result && result.status || 'Unknown');
  if (surfaceCountOutput) surfaceCountOutput.value = String(surfaceCount);
  if (devApiStateOutput) devApiStateOutput.value = devApiReady && snapshotsSerializable ? 'Ready' : 'Invalid';
  if (output) output.value = `${ok ? 'Runtime gate passed' : 'Runtime gate failed'}; surfaces=${surfaceCount}; status=${result && result.status || 'unknown'}; devApi=${devApiReady && snapshotsSerializable ? 'ready' : 'invalid'}`;
  Object.defineProperty(globalThis, '__XTEND_MATERIAL_RUNTIME_HOST__', {
    configurable: true,
    enumerable: false,
    value: Object.freeze({ schema: WORKBENCH_RUNTIME_HOST_SCHEMA, ok, surfaceCount, result })
  });
} catch (error) {
  document.documentElement.dataset.maracaRuntimeReady = 'false';
  document.documentElement.dataset.xtendDevApiReady = 'false';
  document.documentElement.dataset.xtmRuntimePresentationReady = 'false';
  if (bootStateOutput) bootStateOutput.value = 'Failed';
  if (devApiStateOutput) devApiStateOutput.value = 'Invalid';
  if (output) output.value = `Runtime gate failed; ${error && error.message ? error.message : String(error)}`;
}
