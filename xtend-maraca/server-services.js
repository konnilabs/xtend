'use strict';

const appServices = require('./app-services');
const nodeHost = require('./node-app-service-host');

function service(options = {}) {
  return appServices.service({
    ...options,
    target: options && options.target || 'server'
  });
}

module.exports = {
  MARACA_APP_SERVICES_SCHEMA: appServices.MARACA_APP_SERVICES_SCHEMA,
  MARACA_APP_SERVICE_SCHEMA: appServices.MARACA_APP_SERVICE_SCHEMA,
  MARACA_APP_SERVICE_REGISTRY_SCHEMA: appServices.MARACA_APP_SERVICE_REGISTRY_SCHEMA,
  MARACA_APP_SERVICE_REQUEST_SCHEMA: appServices.MARACA_APP_SERVICE_REQUEST_SCHEMA,
  MARACA_APP_SERVICE_RESPONSE_SCHEMA: appServices.MARACA_APP_SERVICE_RESPONSE_SCHEMA,
  MARACA_APP_SERVICE_STREAM_SCHEMA: appServices.MARACA_APP_SERVICE_STREAM_SCHEMA,
  MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA: appServices.MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA,
  MARACA_APP_SERVICE_INPUT_POLICY_SCHEMA: appServices.MARACA_APP_SERVICE_INPUT_POLICY_SCHEMA,
  MARACA_APP_SERVICE_INPUT_VERDICT_SCHEMA: appServices.MARACA_APP_SERVICE_INPUT_VERDICT_SCHEMA,
  MARACA_NODE_APP_SERVICE_HOST_SCHEMA: nodeHost.MARACA_NODE_APP_SERVICE_HOST_SCHEMA,
  AppServiceError: appServices.AppServiceError,
  AppServiceAbortError: appServices.AppServiceAbortError,
  AppServiceStaleResultError: appServices.AppServiceStaleResultError,
  service,
  defineServerServices: appServices.defineServerServices,
  applyAppServiceInputPolicy: appServices.applyAppServiceInputPolicy,
  createAppServiceRegistry: appServices.createAppServiceRegistry,
  createNodeAppServiceHost: nodeHost.createNodeAppServiceHost
};
