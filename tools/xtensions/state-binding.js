// SPDX-License-Identifier: Apache-2.0
'use strict';

const { XTENSION_STATE_BINDING_SCHEMA, PROJECTION_BINDING_SCHEMA, validateStateBinding, addressKey, propsFrom, clone, freeze, data, record, typed } = require('./state-binding-contract');
const { XTENSION_STATE_BINDING_ARTIFACT_SCHEMA, PROJECTION_STATE_BINDING_ARTIFACT_SCHEMA, NATIVE_STATE_BINDING_ARTIFACT_SCHEMA, LIFECYCLE_STATE_BINDING_ARTIFACT_SCHEMA, validateStateBindingArtifact, validateLifecycleStateBindingArtifact, materializeStateBindingArtifact } = require('./state-binding-artifact');
const { createStateRegistry } = require('./state-binding-registry-core');
const { validateOrchestratedStateBindingArtifact, materializeOrchestratedStateBindingArtifact } = require('./state-binding-orchestrated');
const { assertNativeCanonicalData } = require('./native-data');
const XTENSION_STATE_BINDING_API_VERSION = '2.4.0';
const XTENSION_PROJECTION_STATE_BINDING_API_VERSION = '3.0.0';
const XTENSION_NATIVE_STATE_BINDING_API_VERSION = '4.0.0';
const XTENSION_ORCHESTRATED_STATE_BINDING_API_VERSION = '6.0.0';
const ORCHESTRATED_STATE_BINDING_ARTIFACT_SCHEMA = 'xtend.xtensions.state-binding-artifact.v7';
const XTENSION_LIFECYCLE_STATE_BINDING_API_VERSION = '5.0.0';
const XTENSION_RESUME_STATE_BINDING_API_VERSION = '3.0.0';
function createXTensionOrchestratedStateRegistry(options) { return createStateRegistry(options, false, true, assertNativeCanonicalData, XTENSION_ORCHESTRATED_STATE_BINDING_API_VERSION); }
function createXTensionStateRegistry(options) { return createStateRegistry(options, false); }
function createXTensionResumeStateRegistry(options) { return createStateRegistry(options, true); }
function createXTensionProjectionStateRegistry(options) { return createStateRegistry(options, false, true); }
function createXTensionNativeStateRegistry(options) { return createStateRegistry(options, false, true, assertNativeCanonicalData); }
function createXTensionLifecycleStateRegistry(options) { return createStateRegistry(options, false, true, assertNativeCanonicalData, XTENSION_LIFECYCLE_STATE_BINDING_API_VERSION); }


const ORCHESTRATED_STATE_BINDING_RUNTIME = Object.freeze({ XTENSION_STATE_BINDING_API_VERSION, XTENSION_ORCHESTRATED_STATE_BINDING_API_VERSION, ORCHESTRATED_STATE_BINDING_ARTIFACT_SCHEMA,
  validateStateBindingArtifact: validateOrchestratedStateBindingArtifact, validateOrchestratedStateBindingArtifact,
  materializeStateBindingArtifact: materializeOrchestratedStateBindingArtifact, materializeOrchestratedStateBindingArtifact,
  createXTensionStateRegistry: createXTensionOrchestratedStateRegistry, createXTensionOrchestratedStateRegistry });
module.exports = { ORCHESTRATED_STATE_BINDING_RUNTIME, XTENSION_ORCHESTRATED_STATE_BINDING_API_VERSION, ORCHESTRATED_STATE_BINDING_ARTIFACT_SCHEMA, validateOrchestratedStateBindingArtifact, materializeOrchestratedStateBindingArtifact, createXTensionOrchestratedStateRegistry, validateLifecycleStateBindingArtifact, XTENSION_LIFECYCLE_STATE_BINDING_API_VERSION, createXTensionLifecycleStateRegistry, LIFECYCLE_STATE_BINDING_ARTIFACT_SCHEMA, XTENSION_RESUME_STATE_BINDING_API_VERSION, createXTensionResumeStateRegistry, createXTensionProjectionStateRegistry, createXTensionNativeStateRegistry, XTENSION_STATE_BINDING_API_VERSION, XTENSION_PROJECTION_STATE_BINDING_API_VERSION, XTENSION_NATIVE_STATE_BINDING_API_VERSION, XTENSION_STATE_BINDING_SCHEMA, PROJECTION_BINDING_SCHEMA, XTENSION_STATE_BINDING_ARTIFACT_SCHEMA, PROJECTION_STATE_BINDING_ARTIFACT_SCHEMA, NATIVE_STATE_BINDING_ARTIFACT_SCHEMA, validateStateBinding, validateStateBindingArtifact, materializeStateBindingArtifact, createXTensionStateRegistry };
