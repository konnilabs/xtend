// SPDX-License-Identifier: Apache-2.0
'use strict';
const {createNativeSurfaceViewRuntime}=require('./native-surface-projection-core');
const metadata=require('./native-component-contract');
const scopes=require('./native-surface-scopes');
const lifecycle=require('./native-orchestration-lifecycle');
const {createNativeComponentRegistry, NATIVE_SURFACE_VIEW_API_VERSION, NATIVE_SURFACE_VIEW_SCHEMA, NATIVE_SURFACE_VIEW_RUNTIME, NATIVE_ORCHESTRATION_VIEW_RUNTIME, assertNativeCanonicalData, validateNativeSurfaceViewProgram, validateNativeOrchestrationViewProgram, materializeNativeSurfaceView, materializeNativeOrchestrationView}=createNativeSurfaceViewRuntime({apiVersion:'3.0.0',headerSchema:'xtend.rmt.native-view.v2',programSchema:'xtend.rmt.app-orchestration.v5',validateMetadata:metadata.validateCapturedNativeComponentMetadata,nativeComponentSinkAllowed:metadata.nativeComponentSinkAllowed,scopes,lifecycle});
module.exports={createNativeComponentRegistry, NATIVE_SURFACE_VIEW_API_VERSION, NATIVE_SURFACE_VIEW_SCHEMA, NATIVE_SURFACE_VIEW_RUNTIME, NATIVE_ORCHESTRATION_VIEW_RUNTIME, assertNativeCanonicalData, validateNativeSurfaceViewProgram, validateNativeOrchestrationViewProgram, materializeNativeSurfaceView, materializeNativeOrchestrationView};
