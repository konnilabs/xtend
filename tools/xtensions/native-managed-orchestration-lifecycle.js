// SPDX-License-Identifier: Apache-2.0
'use strict';
const {createNativeOrchestrationLifecycleRuntime}=require('./native-orchestration-lifecycle-core');
const nativeScopes=require('./native-managed-surface-scopes');
const {NATIVE_ORCHESTRATION_LIFECYCLE_API_VERSION, NATIVE_ORCHESTRATION_LIFECYCLE_PLAN_SCHEMA, validateNativeOrchestrationLifecyclePlan, evaluateNativeOrchestrationLifecyclePlan, nativeOrchestrationLifecycleAdmission}=createNativeOrchestrationLifecycleRuntime({nativeScopes,apiVersion:'3.0.0',planSchema:'xtend.rmt.native-lifecycle-plan.v3',evaluationSchema:'xtend.rmt.native-lifecycle-evaluation.v3',programSchema:'xtend.rmt.app-orchestration.v6',headerSchema:'xtend.rmt.native-view.v3',sourceVersion:'8.0.0',viewVersion:'8.0.0',actionVersion:'8.0.0'});
module.exports={NATIVE_ORCHESTRATION_LIFECYCLE_API_VERSION, NATIVE_ORCHESTRATION_LIFECYCLE_PLAN_SCHEMA, validateNativeOrchestrationLifecyclePlan, evaluateNativeOrchestrationLifecyclePlan, nativeOrchestrationLifecycleAdmission};
