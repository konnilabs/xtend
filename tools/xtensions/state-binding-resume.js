// SPDX-License-Identifier: Apache-2.0
'use strict';
const { createStateRegistry } = require('./state-binding-registry-core');
const { assertNativeCanonicalData } = require('./native-data');
const XTENSION_RMTX_RESUME_STATE_BINDING_API_VERSION = '4.0.0';
const XTENSION_RESUME_STATE_BINDING_API_VERSION = '3.0.0';

/** Explicit projected binding + resume capability. Existing projection and
 * legacy resume registries retain their exact schemas and admission rules. */
function createXTensionRMTXResumeStateRegistry(options) {
  return createStateRegistry(options, true, true, assertNativeCanonicalData, XTENSION_RMTX_RESUME_STATE_BINDING_API_VERSION);
}
function createXTensionResumeStateRegistry(options) { return createStateRegistry(options, true); }

module.exports = { XTENSION_RMTX_RESUME_STATE_BINDING_API_VERSION, XTENSION_RESUME_STATE_BINDING_API_VERSION, createXTensionRMTXResumeStateRegistry, createXTensionResumeStateRegistry };
