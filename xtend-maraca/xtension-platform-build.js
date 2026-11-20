// SPDX-License-Identifier: Apache-2.0
'use strict';
const fs = require('node:fs'), path = require('node:path');

// This bridge is deliberately limited to XTend's own CommonJS runtime closure.
// Application providers retain their separate verified local ESM contract.
async function buildXTensionPlatform(plan, rollup) {
  const managedProfile = plan.xtensionComposition.schema === 'xtend.maraca.xtension-composition-manifest.v12';
  const entries = Object.fromEntries(['state-binding', ...new Set(plan.xtensionComposition.providers.map(provider => provider.framework + '-runtime-adapter'))].map(name =>
    [name, require.resolve('@ccslabs/xtend-compiler/xtensions/' + (name === 'state-binding' && managedProfile ? 'state-binding-managed' : name), { paths: [plan.rootDir, __dirname] })]));
  const compilerRoot = path.dirname(path.dirname(entries['state-binding']));
  const orchestratedProfile = managedProfile || plan.xtensionComposition.schema === 'xtend.maraca.xtension-composition-manifest.v11';
  const lifecycleProfile = orchestratedProfile || plan.xtensionComposition.schema === 'xtend.maraca.xtension-composition-manifest.v10';
  const nativeProfile = lifecycleProfile || plan.xtensionComposition.schema === 'xtend.maraca.xtension-composition-manifest.v9';
  const projectionProfile = nativeProfile || plan.xtensionComposition.schema === 'xtend.maraca.xtension-composition-manifest.v8';
  const projectionModule = path.join(compilerRoot, 'xtensions/state-binding-projection.js');
  const disabledProjectionModule = path.join(compilerRoot, 'xtensions/state-binding-projection-disabled.js');
  const orchestratedModule = path.join(compilerRoot, 'xtensions/state-binding-orchestrated.js');
  const disabledOrchestratedModule = path.join(compilerRoot, 'xtensions/state-binding-orchestrated-disabled.js');
  const { parseAst } = require('rollup/parseAst');
  const captured = new Map(), esmSources = new Map();
  function capture(file) {
    file = fs.realpathSync(file);
    if (captured.has(file)) return;
    const relative = path.relative(compilerRoot, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new TypeError('XTension platform dependencies must remain inside the compiler package.');
    const source = fs.readFileSync(file, 'utf8'), imports = new Map();
    function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'CallExpression' && node.callee?.type === 'Identifier' && node.callee.name === 'require') {
        const id = node.arguments.length === 1 && node.arguments[0].value;
        if (typeof id !== 'string' || !id.startsWith('.')) throw new TypeError('Only static relative XTend platform requires are supported.');
        const target = require.resolve(path.resolve(path.dirname(file), id));
        imports.set(id, !projectionProfile && target === projectionModule ? disabledProjectionModule
          : !orchestratedProfile && target === orchestratedModule ? disabledOrchestratedModule : target);
      }
      for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value === 'object') walk(value);
    }
    walk(parseAst(source));
    const emission = managedProfile && path.basename(file) === 'native-component-catalog-v2.js'
      ? `const {freeze}=require('./state-binding-contract');const NATIVE_COMPONENT_CATALOG_V2=freeze(${JSON.stringify(plan.orchestration.artifact.render.nativeView.components)});module.exports={NATIVE_COMPONENT_CATALOG_V2};`
      : source;
    captured.set(file, { source, emission, imports });
    imports.forEach(capture);
  }
  Object.values(entries).forEach(capture);
  const virtual = '\0xtend-xtension-platform';
  const runtime = path.join(__dirname, 'xtension-composition-runtime.mjs');
  const bindingContract = require.resolve(path.join(compilerRoot, 'xtensions/state-binding-contract'));
  capture(bindingContract);
  const componentProfile = ['xtend.maraca.xtension-composition-manifest.v6','xtend.maraca.xtension-composition-manifest.v7','xtend.maraca.xtension-composition-manifest.v8','xtend.maraca.xtension-composition-manifest.v9','xtend.maraca.xtension-composition-manifest.v10','xtend.maraca.xtension-composition-manifest.v11','xtend.maraca.xtension-composition-manifest.v12'].includes(plan.xtensionComposition.schema);
  const componentFile = path.join(compilerRoot, 'xtensions/component-interface.js');
  if (componentProfile) capture(componentFile);
  const componentImport = componentProfile ? `import * as componentInterfaceRuntime from ${JSON.stringify(componentFile)};\n` : '';
  const projectionExports = projectionProfile ? ',XTENSION_PROJECTION_STATE_BINDING_API_VERSION:api0.XTENSION_PROJECTION_STATE_BINDING_API_VERSION,createXTensionProjectionStateRegistry:api0.createXTensionProjectionStateRegistry' : '';
  const nativeExports = nativeProfile ? ',XTENSION_NATIVE_STATE_BINDING_API_VERSION:api0.XTENSION_NATIVE_STATE_BINDING_API_VERSION,createXTensionNativeStateRegistry:api0.createXTensionNativeStateRegistry' : '';
  const lifecycleExports = lifecycleProfile ? ',XTENSION_LIFECYCLE_STATE_BINDING_API_VERSION:api0.XTENSION_LIFECYCLE_STATE_BINDING_API_VERSION,createXTensionLifecycleStateRegistry:api0.createXTensionLifecycleStateRegistry,validateLifecycleStateBindingArtifact:api0.validateLifecycleStateBindingArtifact' : '';
  const source = componentImport + `import * as bindingContract from ${JSON.stringify(bindingContract)};\n` + (managedProfile ? '' : `import * as ssrRuntime from ${JSON.stringify(path.join(__dirname, 'xtension-ssr-runtime.mjs'))};\n`) + Object.entries(entries).map(([name, file], index) => `import * as api${index} from ${JSON.stringify(file)};`).join('\n') +
    `\nimport * as compositionRuntime from ${JSON.stringify(runtime)};\nexport default Object.freeze({ bindingsRuntime: ${managedProfile ? 'api0.MANAGED_STATE_BINDING_RUNTIME' : orchestratedProfile ? 'api0.ORCHESTRATED_STATE_BINDING_RUNTIME' : `Object.freeze({XTENSION_STATE_BINDING_API_VERSION:api0.XTENSION_STATE_BINDING_API_VERSION,validateStateBindingArtifact:api0.${lifecycleProfile ? 'validateLifecycleStateBindingArtifact' : 'validateStateBindingArtifact'},materializeStateBindingArtifact:api0.materializeStateBindingArtifact,createXTensionStateRegistry:api0.createXTensionStateRegistry${projectionExports}${nativeExports}${lifecycleExports}})`}, compositionRuntime, ${managedProfile ? '' : 'ssrRuntime,'} ${componentProfile ? 'componentInterfaceRuntime,' : ''} ${managedProfile ? '' : 'resumeBindingsRuntime: Object.freeze({XTENSION_RESUME_STATE_BINDING_API_VERSION:api0.XTENSION_RESUME_STATE_BINDING_API_VERSION,createXTensionResumeStateRegistry:api0.createXTensionResumeStateRegistry,typed:bindingContract.typed,propsFrom:bindingContract.propsFrom}),'} adapters: Object.freeze({${Object.keys(entries).slice(1).map((name, index) => {const framework=name.split('-')[0],title=framework==='react'?'React':'Vue';return `${JSON.stringify(framework)}: Object.freeze({create${title}KernelRuntimeAdapter:api${index+1}.create${title}KernelRuntimeAdapter,normalize${title}Peers:api${index+1}.normalize${title}Peers${managedProfile ? '' : `,create${title}SSRRuntimeAdapter:api${index+1}.create${title}SSRRuntimeAdapter,normalize${title}SSRPeers:api${index+1}.normalize${title}SSRPeers`}})`;}).join(',')} }) });\n`;
  const bundle = await rollup.rollup({ input: virtual, plugins: [{
    name: 'xtend-owned-xtension-platform',
    resolveId(id, importer) {
      if (id === virtual) return id;
      if (!componentProfile && id === './xtension-component-binding.mjs'
        && [runtime, path.join(__dirname, 'xtension-ssr-runtime.mjs')].includes(importer))
        return path.join(__dirname, 'xtension-component-binding-disabled.mjs');
      return null;
    },
    load(id) {
      if (id === virtual) return source;
      const record = captured.get(id);
      if (!record) {
        if (id.startsWith(__dirname + path.sep) && id.endsWith('.mjs')) {
          const source = fs.readFileSync(id, 'utf8'); esmSources.set(id, source); return source;
        }
        return null;
      }
      return require('./xtension-platform-esm').toESM(record.emission,parseAst,name=>{const target=record.imports.get(name);if(!target)throw new TypeError('Unknown platform dependency.');return target;});
    }
  }] });
  try {
    const result = await bundle.generate({ format: 'es' });
    if (result.output.length !== 1 || result.output[0].type !== 'chunk' || result.output[0].imports.length || result.output[0].dynamicImports.length) throw new TypeError('The XTension platform must have a closed native ESM output.');
    const fileName = 'runtime/xtension-platform.mjs', target = path.join(plan.outputDir, fileName);
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, result.output[0].code);
    const { createHash } = require('node:crypto');
    const sourceFiles = [...captured].map(([absolutePath, record]) => ({ absolutePath, source: 'compiler/' + path.relative(compilerRoot, absolutePath).split(path.sep).join('/'), content: record.source }))
      .concat([...esmSources].map(([absolutePath, content]) => ({ absolutePath, source: 'maraca/' + path.relative(__dirname, absolutePath).split(path.sep).join('/'), content })))
      .map(({ content, ...record }) => ({ ...record, bytes: Buffer.byteLength(content), sha256: createHash('sha256').update(content).digest('hex') }));
    return { sourceFiles, type: 'asset', fileName, path: target, bytes: fs.statSync(target).size, isEntry: false, isDynamicEntry: false, imports: [], dynamicImports: [] };
  } finally { await bundle.close(); }
}
module.exports = { buildXTensionPlatform };
