// SPDX-License-Identifier: Apache-2.0
'use strict';
const base = require('./url-state');
const bindings = require('./state-binding-managed');
const MANAGED_URL_STATE_API_VERSION = '6.0.0';
function createManagedURLStateContract(input, inputs) { return base._createURLStateContractProfile(input, inputs, 'managed', bindings.validateManagedStateBindingArtifact); }
const MANAGED_URL_STATE_RUNTIME = Object.freeze({ API_VERSION: MANAGED_URL_STATE_API_VERSION, PARAMETER: base.PARAMETER, createURLStateContract: createManagedURLStateContract, readQuery: base.readQuery, withToken: base.PROJECTION_URL_STATE_RUNTIME.withToken, canonical: base.canonical });
module.exports = { MANAGED_URL_STATE_API_VERSION, MANAGED_URL_STATE_RUNTIME, createManagedURLStateContract };
