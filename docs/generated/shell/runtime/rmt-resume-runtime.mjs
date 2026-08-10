import {
  RMT_RESUME_ADAPTER_SCHEMA,
  RMT_RESUME_ENVELOPE_SCHEMA,
  RMT_RESUME_INTENT_SCHEMA,
  RMT_RESUME_MAX_INTENTS,
  RMT_RESUME_RESULT_SCHEMA,
  RMT_RESUME_RUNTIME_SCHEMA,
  canonicalizeRmtResumePayload
} from './rmt-resume-protocol.mjs';
import { createRmtResumeCaptureAdapter } from './rmt-resume-capture-adapter.mjs';
import { createRmtResumeHostAdapter } from './rmt-resume-host-adapter.mjs';
import { createRmtResumeCommandAdapter } from './rmt-resume-command-adapter.mjs';
import { createRmtResumeCommandController } from './rmt-resume-command-controller.mjs';

export {
  RMT_RESUME_ADAPTER_SCHEMA,
  RMT_RESUME_ENVELOPE_SCHEMA,
  RMT_RESUME_INTENT_SCHEMA,
  RMT_RESUME_MAX_INTENTS,
  RMT_RESUME_RESULT_SCHEMA,
  RMT_RESUME_RUNTIME_SCHEMA,
  canonicalizeRmtResumePayload
};

export function createRmtResumeRuntime(options = {}) {
  const capturePort = options.capturePort || createRmtResumeCaptureAdapter(options);
  const hostPort = options.hostPort || createRmtResumeHostAdapter({
    ...options,
    globalTarget
  });
  const commandPort = options.commandPort || createRmtResumeCommandAdapter(options);
  return createRmtResumeCommandController({
    ...options,
    capturePort,
    hostPort,
    commandPort
  });
}

export function installRmtPrebootIntentCapture(root, events, options = {}) {
  return createRmtResumeRuntime(options).installPrebootCapture(root, events, options);
}

export function resumeResponse(response, request = {}, options = {}) {
  return createRmtResumeRuntime(options).resumeResponse(response, request, options);
}

export function resumeTemplate(request, options = {}) {
  return createRmtResumeRuntime(options).resumeTemplate(request, options);
}

const api = Object.freeze({
  RMT_RESUME_RUNTIME_SCHEMA,
  RMT_RESUME_ENVELOPE_SCHEMA,
  RMT_RESUME_RESULT_SCHEMA,
  RMT_RESUME_INTENT_SCHEMA,
  RMT_RESUME_ADAPTER_SCHEMA,
  RMT_RESUME_MAX_INTENTS,
  canonicalizeRmtResumePayload,
  createRmtResumeRuntime,
  installRmtPrebootIntentCapture,
  resumeResponse,
  resumeTemplate
});
const globalTarget = typeof globalThis !== 'undefined' ? globalThis : null;

if (globalTarget) globalTarget.XTendRmtResumeRuntime = api;

export default api;
