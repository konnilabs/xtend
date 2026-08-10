// Public 0.6 composition facade. The canonical App Controller consumes only
// the typed presentation port; this module wires the default Descriptor View.
import controllerApi, {
  createRmtAppRuntime as createRmtAppControllerRuntime,
  createRmtViewTemplateDescriptor as projectRmtViewTemplateDescriptor
} from './rmt-app-runtime.js';
import {
  RMT_APP_PRESENTATION_VIEW_PORT_SCHEMA,
  createRmtAppPresentationViewPort
} from './rmt-app-view-projector.js';
import {
  RMT_APP_HOST_PORT_SCHEMA,
  createRmtAppHostAdapter
} from './rmt-app-host-adapter.js';

const defaultPresentationViewPort = createRmtAppPresentationViewPort();

export * from './rmt-app-runtime.js';
export {
  RMT_APP_PRESENTATION_VIEW_PORT_SCHEMA,
  createRmtAppPresentationViewPort
} from './rmt-app-view-projector.js';
export {
  RMT_APP_HOST_PORT_SCHEMA,
  createRmtAppHostAdapter
} from './rmt-app-host-adapter.js';

function withDefaultHostPort(options = {}) {
  if (options.hostPort || options.appHostPort) return options;
  return {
    ...options,
    hostPort: createRmtAppHostAdapter({
      hostTarget: options.windowTarget,
      windowTarget: options.windowTarget,
      performanceTarget: options.performanceTarget,
      cryptoTarget: options.cryptoTarget,
      Worker: options.Worker,
      Blob: options.Blob,
      URL: options.URL,
      setTimeout: options.setTimeout,
      schedule: options.scheduleRecommendation || options.schedule,
      clock: options.clock,
      now: options.now,
      random: options.random
    })
  };
}

export function createRmtCommandEnvelope(input = {}, defaults = {}) {
  return controllerApi.createRmtCommandEnvelope(input, withDefaultHostPort(defaults));
}

export function commandFromComponentEvent(eventName, detail = {}, defaults = {}) {
  return controllerApi.commandFromComponentEvent(eventName, detail, withDefaultHostPort(defaults));
}

export function createRmtHostServiceRegistry(options = {}) {
  return controllerApi.createRmtHostServiceRegistry(withDefaultHostPort(options));
}

export function createRmtStreamPatch(input = {}, defaults = {}) {
  return controllerApi.createRmtStreamPatch(input, withDefaultHostPort(defaults));
}

export function createRmtStreamPatchPlan(modelSnapshot = {}, patch = {}, options = {}) {
  return controllerApi.createRmtStreamPatchPlan(modelSnapshot, patch, withDefaultHostPort(options));
}

export function applyRmtStreamPatch(state = {}, patch = {}, options = {}) {
  return controllerApi.applyRmtStreamPatch(state, patch, withDefaultHostPort(options));
}

export function createRmtSearchPrewarmWorker(options = {}) {
  return controllerApi.createRmtSearchPrewarmWorker(withDefaultHostPort(options));
}

export function createRmtSearchRuntime(options = {}) {
  return controllerApi.createRmtSearchRuntime(withDefaultHostPort(options));
}

export function createRmtViewTemplateDescriptor(template = {}, model = {}, options = {}) {
  return projectRmtViewTemplateDescriptor(template, model, {
    ...options,
    presentationViewPort: options.presentationViewPort
      || options.viewProjectionPort
      || options.viewPort
      || defaultPresentationViewPort
  });
}

export function createRmtAppRuntime(options = {}) {
  return createRmtAppControllerRuntime({
    ...withDefaultHostPort(options),
    presentationViewPort: options.presentationViewPort
      || options.viewProjectionPort
      || defaultPresentationViewPort
  });
}

export const rmtAppRuntimeCompatibilityApi = Object.freeze({
  ...controllerApi,
  RMT_APP_HOST_PORT_SCHEMA,
  createRmtAppHostAdapter,
  RMT_APP_PRESENTATION_VIEW_PORT_SCHEMA,
  createRmtAppPresentationViewPort,
  createRmtCommandEnvelope,
  commandFromComponentEvent,
  createRmtHostServiceRegistry,
  createRmtStreamPatch,
  createRmtStreamPatchPlan,
  applyRmtStreamPatch,
  createRmtSearchPrewarmWorker,
  createRmtSearchRuntime,
  createRmtViewTemplateDescriptor,
  createRmtAppRuntime
});

export default rmtAppRuntimeCompatibilityApi;
