'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA } = require('../../tools/xtensions/host-controller-contract');
const LEGACY_RUNTIME_ACCEPTANCE_REPORT_SCHEMA = 'xtend.xtensions.runtime-acceptance-report.v1';

function runExportChecks() {
  const root = path.resolve(__dirname, '../..');
  const metadata = require('../../package.json');
  const runtime = {}, all = {};
  const bindingName = '@ccslabs/xtend/xtensions/state-binding';
  const binding = require(bindingName);
  assert.deepEqual(Object.keys(binding).sort(), [
    'LIFECYCLE_STATE_BINDING_ARTIFACT_SCHEMA', 'NATIVE_STATE_BINDING_ARTIFACT_SCHEMA',
    'ORCHESTRATED_STATE_BINDING_ARTIFACT_SCHEMA', 'ORCHESTRATED_STATE_BINDING_RUNTIME',
    'PROJECTION_BINDING_SCHEMA', 'PROJECTION_STATE_BINDING_ARTIFACT_SCHEMA',
    'XTENSION_LIFECYCLE_STATE_BINDING_API_VERSION', 'XTENSION_NATIVE_STATE_BINDING_API_VERSION',
    'XTENSION_ORCHESTRATED_STATE_BINDING_API_VERSION', 'XTENSION_PROJECTION_STATE_BINDING_API_VERSION',
    'XTENSION_RESUME_STATE_BINDING_API_VERSION', 'XTENSION_STATE_BINDING_API_VERSION',
    'XTENSION_STATE_BINDING_ARTIFACT_SCHEMA', 'XTENSION_STATE_BINDING_SCHEMA',
    'createXTensionLifecycleStateRegistry', 'createXTensionNativeStateRegistry',
    'createXTensionOrchestratedStateRegistry', 'createXTensionProjectionStateRegistry',
    'createXTensionResumeStateRegistry', 'createXTensionStateRegistry',
    'materializeOrchestratedStateBindingArtifact', 'materializeStateBindingArtifact',
    'validateLifecycleStateBindingArtifact', 'validateOrchestratedStateBindingArtifact',
    'validateStateBinding', 'validateStateBindingArtifact'
  ]);
  assert.equal(require('@ccslabs/xtend-compiler/xtensions/state-binding').createXTensionStateRegistry, binding.createXTensionStateRegistry);
  all[bindingName] = Object.entries(binding).map(([key, value]) => [key, typeof value]).sort();
  assert.equal(binding.XTENSION_NATIVE_STATE_BINDING_API_VERSION, '4.0.0');
  assert.equal(binding.XTENSION_LIFECYCLE_STATE_BINDING_API_VERSION, '5.0.0');
  assert.equal(binding.LIFECYCLE_STATE_BINDING_ARTIFACT_SCHEMA, 'xtend.xtensions.state-binding-artifact.v6');
  assert.equal(binding.XTENSION_ORCHESTRATED_STATE_BINDING_API_VERSION, '6.0.0');
  assert.equal(binding.ORCHESTRATED_STATE_BINDING_ARTIFACT_SCHEMA, 'xtend.xtensions.state-binding-artifact.v7');
  assert.equal(binding.ORCHESTRATED_STATE_BINDING_RUNTIME.createXTensionStateRegistry, binding.createXTensionOrchestratedStateRegistry);
  for (const key of ['createXTensionOrchestratedStateRegistry', 'validateOrchestratedStateBindingArtifact', 'materializeOrchestratedStateBindingArtifact']) {
    assert.equal(typeof binding[key], 'function');
    assert.equal(require('@ccslabs/xtend-compiler/xtensions/state-binding')[key], binding[key]);
  }
  assert.equal(binding.XTENSION_PROJECTION_STATE_BINDING_API_VERSION, '3.0.0');
  assert.equal(require('@ccslabs/xtend-compiler/xtensions/state-binding').createXTensionNativeStateRegistry, binding.createXTensionNativeStateRegistry);
  const nativeName = '@ccslabs/xtend/xtensions/native-view-projection', native = require(nativeName);
  assert.equal(native.NATIVE_VIEW_PROJECTION_API_VERSION, '1.0.0');
  for (const key of ['assertNativeCanonicalData', 'validateNativeViewProgram', 'materializeNativeView']) {
    assert.equal(typeof native[key], 'function');
    assert.equal(require('@ccslabs/xtend-compiler/xtensions/native-view-projection')[key], native[key]);
  }
  all[nativeName] = Object.entries(native).map(([key, value]) => [key, typeof value]).sort();
  assert.equal(native.NATIVE_LIFECYCLE_VIEW_RUNTIME.NATIVE_VIEW_PROJECTION_API_VERSION, '2.0.0');
  const lifecycleName = '@ccslabs/xtend/xtensions/native-lifecycle';
  const lifecycle = require(lifecycleName);
  assert.equal(lifecycle.NATIVE_LIFECYCLE_API_VERSION, '1.0.0');
  assert.equal(require('@ccslabs/xtend-compiler/xtensions/native-lifecycle').validateNativeLifecyclePlan, lifecycle.validateNativeLifecyclePlan);
  all[lifecycleName] = Object.entries(lifecycle).map(([key, value]) => [key, typeof value]).sort();
  for (const subpath of ['native-surface-scopes', 'native-surface-projection', 'native-orchestration-lifecycle']) {
    const name = '@ccslabs/xtend/xtensions/' + subpath, api = require(name);
    const compilerApi = require('@ccslabs/xtend-compiler/xtensions/' + subpath);
    for (const [key, value] of Object.entries(api)) assert.equal(compilerApi[key], value);
    all[name] = Object.entries(api).map(([key, value]) => [key, typeof value]).sort();
  }
  assert.equal(require('@ccslabs/xtend/xtensions/native-surface-projection').NATIVE_ORCHESTRATION_VIEW_RUNTIME.NATIVE_VIEW_PROJECTION_API_VERSION, '3.0.0');
  assert.equal(require('@ccslabs/xtend/xtensions/native-orchestration-lifecycle').NATIVE_ORCHESTRATION_LIFECYCLE_API_VERSION, '2.0.0');
  const url = require('@ccslabs/xtend/xtensions/url-state');
  assert.equal(url.API_VERSION, '1.0.0');
  assert.equal(url.LIFECYCLE_URL_STATE_RUNTIME.API_VERSION, '4.0.0');
  assert.equal(url.ORCHESTRATED_URL_STATE_RUNTIME.API_VERSION, '5.0.0');
  assert.equal(require('@ccslabs/xtend-compiler/xtensions/url-state').createURLStateContract, url.createURLStateContract);
  all['@ccslabs/xtend/xtensions/url-state'] = Object.entries(url).map(([key,value]) => [key,typeof value]).sort();
  for (const framework of ['react', 'vue']) {
    const title = framework[0].toUpperCase() + framework.slice(1);
    for (const kind of ['host', 'runtime']) {
      const subpath = `./xtensions/${framework}-${kind}-adapter`;
      const name = `@ccslabs/xtend/${subpath.slice(2)}`;
      const entry = metadata.exports[subpath];
      assert.equal(entry.default, `./tools/xtensions/${framework}-${kind}-adapter.js`);
      assert.equal(entry.types, `./tools/xtensions/${framework}-${kind}-adapter.d.ts`);
      assert.equal(entry.browser, undefined, 'no alternate API under browser conditions');
      const exports = require(name);
        if (kind === 'runtime') {
          const target = {};
          const controller = exports[`create${title}RuntimeAdapter`]({ container: target, component: {} });
          assert.equal(controller.apiVersion, '2.0.0');
          assert.equal(controller.schema, 'xtend.xtensions.runtime-host-controller.v2');
          assert.equal(controller.adapterSchema, `xtend.xtensions.${framework}-runtime-adapter.v2`);
        }
      all[name] = Object.entries(exports).map(([key, value]) => [key, typeof value]).sort();
      if (kind === 'runtime') {
        runtime[framework] = all[name];
        assert.deepEqual(Object.keys(exports).sort(), [`create${title}KernelRuntimeAdapter`, `create${title}RuntimeAdapter`, `create${title}SSRRuntimeAdapter`, `normalize${title}Peers`, `normalize${title}SSRPeers`]);
        const declaration = fs.readFileSync(path.resolve(root, entry.types), 'utf8');
        const declared = [...declaration.matchAll(/export function (\w+)\(/g)].map((match) => match[1]).sort();
        assert.deepEqual([...new Set(declared)], Object.keys(exports).sort(), 'declarations describe every runtime value export, including typed overloads');
        const compiler = require(`@ccslabs/xtend-compiler/xtensions/${framework}-runtime-adapter`);
        assert.equal(compiler[`create${title}RuntimeAdapter`], exports[`create${title}RuntimeAdapter`]);
        assert.equal(compiler[`create${title}KernelRuntimeAdapter`], exports[`create${title}KernelRuntimeAdapter`]);
      } else {
        const adapter = exports[`create${title}HostAdapter`]();
        const initial = adapter.snapshot();
        assert.equal(initial.hostId, `${framework}-host-adapter`);
        assert.equal(initial.surfaceId, `surface.${framework}.adapter`);
        assert.equal(initial.xtensionId, `xtension.${framework}.host-adapter`);
        assert.equal(initial.state.mounted, false);
        for (const method of framework === 'react' ? ['getSchedulingDecisions', 'getRenderRecords', 'getBoundaryRecords'] : ['emit', 'getUpdateRecords', 'getEventRecords', 'getBoundaryRecords']) assert.equal(typeof adapter[method], 'function');
        for (const [operation, args] of [['mount', []], ['update', [{ type: 'props.update', payload: { title: 'legacy' } }]], ['suspend', []], ['resume', []], ['unmount', []]]) {
          const result = adapter[operation](...args);
          assert.equal(typeof result.then, 'undefined', `${framework} ${operation} stays synchronous`);
          assert.equal(result.schema, XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA);
        }
        assert.equal(adapter.snapshot().state.destroyed, true);
      }
    }
  }
  const browserConditions = JSON.parse(execFileSync(process.execPath, ['--conditions=browser', '-e',
    `const names=${JSON.stringify(Object.keys(all))};console.log(JSON.stringify(Object.fromEntries(names.map(name=>[name,Object.entries(require(name)).map(([key,value])=>[key,typeof value]).sort()]))));`
  ], { cwd: root, encoding: 'utf8' }));
  assert.deepEqual(browserConditions, all, 'Node browser condition preserves complete host and runtime exports');
  return { ok: true, runtime, legacyAcceptanceReportSchema: LEGACY_RUNTIME_ACCEPTANCE_REPORT_SCHEMA,
    legacySynchronousContracts: true, browserConditionParity: true, declarationExportParity: true };
}

module.exports = { runExportChecks, LEGACY_RUNTIME_ACCEPTANCE_REPORT_SCHEMA };
