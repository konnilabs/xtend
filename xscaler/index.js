'use strict';

const protocol = require('./protocol');
const loader = require('./remote-adapter-loader');
const appServiceTransport = require('./app-service-transport');

const XSCALER_PUBLIC_API_SCHEMA = 'xtend.xscaler.public-api.v1';

module.exports = Object.freeze({
  XSCALER_PUBLIC_API_SCHEMA,
  ...protocol,
  ...loader,
  ...appServiceTransport
});
