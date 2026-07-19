'use strict';

// Public contract facade. The tooling implementation remains the single source
// of truth while consumers get a stable module boundary that can be exported
// without exposing the complete RMT language-tooling tree.
const protocol = require('../tools/rmt-language/xscaler-protocol');

const XSCALER_PUBLIC_PROTOCOL_SCHEMA = 'xtend.xscaler.public-protocol.v1';

module.exports = Object.freeze({
  XSCALER_PUBLIC_PROTOCOL_SCHEMA,
  ...protocol
});
