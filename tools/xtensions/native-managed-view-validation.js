// SPDX-License-Identifier: Apache-2.0
'use strict';
// Private platform validator: identical contracts, no component instance bridge,
// registry or DOM materialization dependency. The public NativePort4 remains full.
const {createNativeSurfaceViewValidation}=require('./native-surface-validation-core');
const metadata=require('./native-component-contract-v2');
const scopes=require('./native-managed-surface-scopes');
const lifecycle=require('./native-managed-orchestration-lifecycle');
const {validateNativeComponentBindings}=require('./native-component-bindings');
const {validateNativeSurfaceViewProgram}=createNativeSurfaceViewValidation({apiVersion:'4.0.0',headerSchema:'xtend.rmt.native-view.v3',programSchema:'xtend.rmt.app-orchestration.v6',validateMetadata:metadata.validateCapturedNativeComponentMetadataV2,nativeComponentSinkAllowed:metadata.nativeComponentSinkAllowedV2,scopes,lifecycle,managed:true,validateComponentValues:metadata.validateNativeComponentValuesV2,validateComponentBindings:validateNativeComponentBindings});
const validateNativeManagedViewProgram=validateNativeSurfaceViewProgram;
module.exports={validateNativeSurfaceViewProgram,validateNativeManagedViewProgram};
