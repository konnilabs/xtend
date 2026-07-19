import * as appServices from './app-services.mjs';
import {
  MARACA_NODE_APP_SERVICE_HOST_SCHEMA,
  createNodeAppServiceHost
} from './node-app-service-host.mjs';

function service(options = {}) {
  return appServices.service({
    ...options,
    target: options && options.target || 'server'
  });
}

const {
  MARACA_APP_SERVICES_SCHEMA,
  MARACA_APP_SERVICE_SCHEMA,
  MARACA_APP_SERVICE_REGISTRY_SCHEMA,
  MARACA_APP_SERVICE_REQUEST_SCHEMA,
  MARACA_APP_SERVICE_RESPONSE_SCHEMA,
  MARACA_APP_SERVICE_STREAM_SCHEMA,
  MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA,
  AppServiceError,
  AppServiceAbortError,
  AppServiceStaleResultError,
  defineServerServices,
  createAppServiceRegistry
} = appServices;

export {
  MARACA_APP_SERVICES_SCHEMA,
  MARACA_APP_SERVICE_SCHEMA,
  MARACA_APP_SERVICE_REGISTRY_SCHEMA,
  MARACA_APP_SERVICE_REQUEST_SCHEMA,
  MARACA_APP_SERVICE_RESPONSE_SCHEMA,
  MARACA_APP_SERVICE_STREAM_SCHEMA,
  MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA,
  MARACA_NODE_APP_SERVICE_HOST_SCHEMA,
  AppServiceError,
  AppServiceAbortError,
  AppServiceStaleResultError,
  service,
  defineServerServices,
  createAppServiceRegistry,
  createNodeAppServiceHost
};
