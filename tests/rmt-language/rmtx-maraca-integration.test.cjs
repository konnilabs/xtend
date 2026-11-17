'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const maraca = require('../../xtend-maraca');
const { compileRmtxSource } = require('../../tools/rmt-language/rmtx-compiler');
const { compileRmtClassicSource } = require('../../tools/rmt-language/classic-compiler');
const root = path.resolve(__dirname, '../..');
const source = `import { RMT, input } from '@ccslabs/xtend/rmt-language/rmtx';
export default (
  <RMT.Program id="integration">
    <RMT.State id="product" type="object" preserve initial={{ title: 'old' }} />
    <RMT.Action id="product.rename">
      <RMT.Input name="title" type="string" />
      <RMT.Reduce state="product" path="title" value={input.title} />
    </RMT.Action>
    <RMT.Portal id="root" root="#app" layer="surface" />
    <RMT.Surface id="panel" kind="region" component="section" portal="root">
      <RMT.Lane name="visible"><RMT.Mount target="panel" /></RMT.Lane>
    </RMT.Surface>
  </RMT.Program>
);`;
const bindings = {
  schema: 'xtend.xtensions.state-binding-artifact.v1', documentId: 'integration',
  bindings: [{ surface: 'panel', binding: {
    schema: 'xtend.xtensions.state-binding.v1',
    address: { documentId: 'integration', declarationId: 'panel', keys: [] },
    props: { title: { state: 'product', path: ['title'], type: 'string' } },
    intents: { rename: { command: 'product.rename', payloadSchema: 'xtend.schemas.xtension.intent.v1', fields: { title: { type: 'string' } } } }
  } }]
};
const input = (sourceText = source, xtensionBindings = bindings) => ({
  sourceText, virtualSourcePath: 'integration.rmtx', xtensionBindings,
  orchestration: 'strict', kernel: 'off', hydration: 'off', validation: 'off', transitions: 'off'
});
const options = { rootDir: root, inspectToolchain: false, compileSource: compileRmtxSource };

test('RMTX builds a real Maraca plan through the explicit compiler port and existing XTension sidecar', () => {
  const result = compileRmtxSource({ text: source, filePath: 'integration.rmtx' }, { xtensionBindings: bindings });
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  const plan = maraca.createMaracaBuildPlan(input(), options);
  assert.equal(plan.ok, true, JSON.stringify(plan.diagnostics));
  assert.equal(plan.source, 'integration.rmtx');
  assert.deepEqual(plan.xtensionBindings, result.xtensionBindings);
  assert(plan.orchestration.artifact.surfaces.some(surface => surface.id === 'panel'));
  assert.equal(plan.orchestration.artifact.state.states.find(state => state.id === 'product').initial.title, 'old');
});

test('Maraca preserves the injected frontend result schema when it revalidates a binding sidecar', () => {
  const compiled = compileRmtxSource({ text: source, filePath: 'integration.rmtx' }, { xtensionBindings: bindings });
  assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics));
  const plan = maraca.createMaracaBuildPlan(input(), options);
  assert.equal(plan.ok, true, JSON.stringify(plan.diagnostics));
  assert.equal(plan.rmt.compilerSchema, compiled.schema);
  assert.notEqual(plan.rmt.compilerSchema, require('../../tools/rmt-language/classic-compiler').RMT_CLASSIC_COMPILE_RESULT_SCHEMA);
});

test('bad RMTX syntax and invalid XTension bindings block the plan before runtime work', () => {
  const syntax = maraca.createMaracaBuildPlan(input(source.replace('RMT.State', 'RMT.Unknown')), options);
  assert.equal(syntax.ok, false);
  assert.equal(syntax.status, 'compile_failed');
  assert(syntax.diagnostics.some(diagnostic => diagnostic.severity === 'error'));
  const invalid = structuredClone(bindings);
  invalid.bindings[0].binding.intents.rename.command = 'missing';
  const binding = maraca.createMaracaBuildPlan(input(source, invalid), options);
  assert.equal(binding.ok, false);
  assert.equal(binding.status, 'compile_failed');
  assert(binding.diagnostics.some(diagnostic => diagnostic.code === 'rmt.xtensions.binding.invalid'));
});

test('Classic defaults remain Classic and an extension does not silently select a different compiler', () => {
  const classic = compileRmtClassicSource({ text: 'state count type number initial 0', filePath: 'ordinary.rmt' });
  assert.equal(classic.ok, true);
  assert.equal(classic.schema, require('../../tools/rmt-language/classic-compiler').RMT_CLASSIC_COMPILE_RESULT_SCHEMA);
  const unselected = maraca.createMaracaBuildPlan(input(), { rootDir: root, inspectToolchain: false });
  assert.equal(unselected.ok, false);
  assert.equal(unselected.status, 'compile_failed');
});

let packaging;
function packedPackages() {
  if (packaging) return packaging;
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmtx-pack-'));
  const nodeModules = path.join(temporary, 'node_modules', '@ccslabs');
  fs.mkdirSync(nodeModules, { recursive: true });
  const packages = [];
  for (const [name, location] of [['xtend', root], ['xtend-compiler', path.join(root, 'tools')], ['xtend-maraca', path.join(root, 'xtend-maraca')]]) {
    const output = execFileSync('npm', ['pack', location, '--ignore-scripts', '--json', '--pack-destination', temporary], {
      cwd: temporary, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
      env: { ...process.env, PATH: path.dirname(process.execPath) + path.delimiter + process.env.PATH, npm_config_cache: path.join(temporary, 'npm-cache'), npm_config_offline: 'true' }, timeout: 180000, stdio: ['ignore', 'pipe', 'pipe']
    });
    const [report] = JSON.parse(output);
    const directory = path.join(nodeModules, name);
    fs.mkdirSync(directory);
    execFileSync('tar', ['-xzf', path.join(temporary, report.filename), '--strip-components=1', '-C', directory]);
    packages.push({ directory, report, manifest: JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8')) });
  }
  packaging = { temporary, packages };
  return packaging;
}
test.after(() => { if (packaging) fs.rmSync(packaging.temporary, { recursive: true, force: true }); });

test('actual root and compiler tarballs expose typed RMTX entrypoints and declare their parser dependency', () => {
  for (const { directory, report, manifest } of packedPackages().packages.filter(entry => entry.manifest.exports['./rmt-language/rmtx-compiler'])) {
    assert.equal(manifest.dependencies.typescript, '5.9.3');
    assert.equal(manifest.devDependencies?.typescript, undefined);
    for (const name of ['rmtx-parser', 'rmtx-compiler', 'rmtx']) {
      const entry = manifest.exports['./rmt-language/' + name];
      assert(entry && typeof entry.types === 'string' && typeof entry.default === 'string');
      for (const target of [entry.types, entry.default]) {
        assert(report.files.some(file => file.path === target.replace(/^\.\//, '')));
        assert(fs.existsSync(path.join(directory, target)));
      }
    }
    const compiler = require(path.join(directory, manifest.exports['./rmt-language/rmtx-compiler'].default));
    const compiled = compiler.compileRmtxSource({ text: source, filePath: 'packed.rmtx' });
    assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics));
    for (const framework of ['react', 'react-dom', 'vue']) assert.equal(manifest.dependencies[framework], undefined);
  }
});

test('packed frontend declarations accept the existing Maraca compiler port in both public packages', () => {
  const { temporary } = packedPackages();
  const fixture = path.join(temporary, 'consumer.cts');
  fs.writeFileSync(fixture, `import { compileRmtxSource as rootCompile } from '@ccslabs/xtend/rmt-language/rmtx-compiler';
import { parseRmtxSource } from '@ccslabs/xtend-compiler/rmt-language/rmtx-parser';
import { compileRmtxSource } from '@ccslabs/xtend-compiler/rmt-language/rmtx-compiler';
import { RMT } from '@ccslabs/xtend-compiler/rmt-language/rmtx';
import { createMaracaBuildPlan, type MaracaRunOptions } from '@ccslabs/xtend/maraca';
const left: MaracaRunOptions = { compileSource: rootCompile };
const right: MaracaRunOptions = { compileSource: compileRmtxSource };
const parsed = parseRmtxSource({ text: '', filePath: 'app.rmtx' });
const compiled = compileRmtxSource({ text: '', filePath: 'app.rmtx' });
const ok: boolean = parsed.ok && compiled.ok;
createMaracaBuildPlan({ sourceText: '', virtualSourcePath: 'app.rmtx' }, left);
void [right, RMT, ok];
`);
  const ts = require('typescript');
  const program = ts.createProgram([fixture], { noEmit: true, strict: true, skipLibCheck: true, types: [],
    module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, target: ts.ScriptTarget.ES2022 });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => temporary, getCanonicalFileName: file => file, getNewLine: () => '\n'
  }));
});

const source4 = `import {RMT,input,model,result} from '@ccslabs/xtend/rmt-language/rmtx';
export default <RMT.Program id="packed4">
  <RMT.State id="app" type="object" initial={{title:'initial',count:0,ready:true}}/>
  <RMT.Action id="save"><RMT.Input name="title" type="string" default={'fallback'}/>
    <RMT.Input name="count" type="number" optional={true} nullable={true}/>
    <RMT.Reduce state="app" path="title" value={{title:input.title,nested:[input.title,1]}}/>
    <RMT.ResultHandler phase="success" kind="reduce" state="app" path="count" value={{value:result.value}}/>
  </RMT.Action>
  <RMT.Action id="visit"><RMT.Reduce state="app" path="count" value={1}/></RMT.Action>
  <RMT.Portal id="root" root="#app" layer="surface"/>
  <RMT.Surface id="panel" kind="region" component="button" portal="root">
    <RMT.Lane name="visible"><RMT.Mount target="panel"/></RMT.Lane>
    <RMT.On event="click" action="save" payload={{title:'detail.title'}} when={model.app.ready===true}/>
    <RMT.On event="visit" action="visit" payload={{}}/>
  </RMT.Surface>
</RMT.Program>`;

test('the compiler tarball alone carries the complete opt-in Source4 frontend and input contracts', t => {
  assert.equal(require('../../scripts/sync_rmt_compiler_contracts.cjs').syncRmtCompilerContracts({ rootDir: root }).ok, true);
  const { temporary, packages } = packedPackages();
  const entry = packages.find(value => value.manifest.name === '@ccslabs/xtend-compiler');
  const standaloneRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-compiler-only-'));
  t.after(() => fs.rmSync(standaloneRoot, { recursive: true, force: true }));
  const isolated = path.join(standaloneRoot, 'node_modules', '@ccslabs', 'xtend-compiler');
  fs.mkdirSync(isolated, { recursive: true });
  execFileSync('tar', ['-xzf', path.join(temporary, entry.report.filename), '--strip-components=1', '-C', isolated]);
  assert.equal(fs.existsSync(path.join(isolated, '..', 'xtend')), false);
  for (const file of ['rmt-language/action-input-contract.js', 'rmt-language/action-input-contract.d.ts',
    'rmt-language/contracts/action-input-contract.v1.schema.json', 'rmt-language/rmtx-host-scopes.js',
    'rmt-language/rmtx-component-bindings.js', 'rmt-language/rmtx-extended-operators.js', 'rmt-language/rmtx-operator-coverage.json',
    'rmt-language/vendor/manifest.json', 'rmt-language/vendor/fastpass-contract.js', 'xtensions/state-binding-projection-disabled.js'])
    assert(entry.report.files.some(item => item.path === file), file);
  const parser = require(path.join(isolated, 'rmt-language/rmtx-parser.js'));
  const compiler = require(path.join(isolated, 'rmt-language/rmtx-compiler.js'));
  assert.equal(parser.RMTX_PARSER_API_VERSION, '4.0.0');
  assert.equal(Object.keys(parser.getRmtxOperatorProfile('4.0.0').operators).length, 110);
  const selected = compiler.createRmtxCompiler({ syntaxVersion: '4.0.0' });
  const parsed = parser.parseRmtxSource({ text: source4, filePath: 'packed.rmtx' }, { syntaxVersion: '4.0.0' });
  assert.equal(parsed.ok, true, JSON.stringify(parsed.diagnostics)); assert.equal(parsed.schema, 'xtend.rmtx.parser-result.v4');
  const result = selected.compileSource({ text: source4, filePath: 'packed.rmtx' });
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics)); assert.equal(result.schema, 'xtend.rmtx.compile-result.v4');
  assert.equal(result.orchestrationArtifacts.schema, 'xtend.rmt.app-orchestration.v2');
  assert.equal(result.orchestrationArtifacts.actions.schema, 'xtend.rmt.action-plan.v2');
  assert.equal(result.orchestrationArtifacts.actions.actions[0].reducers[0].valueKind, 'template');
  const rules = result.orchestrationArtifacts.actions.inputContract.actions.find(action => action.id === 'save').fields;
  assert.deepEqual(rules.title, { type: 'string', nullable: false, required: false, default: 'fallback' });
  assert.equal(rules.count.nullable, true); assert.equal(rules.count.required, false);
  assert.equal(compiler.createRmtxCompiler().apiVersion, '1.0.0');
  assert.equal(compiler.compileRmtxSource({ text: source, filePath: 'legacy.rmtx' }).schema, 'xtend.rmtx.compile-result.v1');
});

test('the actual Maraca tarball builds Source4 Plan8 through the explicit packed compiler port', () => {
  const { temporary, packages } = packedPackages();
  const maracaEntry = packages.find(value => value.manifest.name === '@ccslabs/xtend-maraca');
  assert(maracaEntry.report.files.some(file => file.path === 'xtension-component-binding-disabled.mjs'));
  const compilerEntry = packages.find(value => value.manifest.name === '@ccslabs/xtend-compiler');
  const packedMaraca = require(path.join(maracaEntry.directory, 'index.js'));
  const compiler = require(path.join(compilerEntry.directory, 'rmt-language/rmtx-compiler.js')).createRmtxCompiler({ syntaxVersion: '4.0.0' });
  const plan = packedMaraca.createMaracaBuildPlan({ sourceText: source4, virtualSourcePath: 'packed.rmtx',
    orchestration: 'strict', kernel: 'off', hydration: 'off', validation: 'off', transitions: 'off', pwa: false, services: false },
    { rootDir: temporary, inspectToolchain: false, compileSource: compiler.compileSource });
  assert.equal(plan.ok, true, JSON.stringify(plan.diagnostics)); assert.equal(plan.schema, 'xtend.maraca.build-plan.v8');
  assert.equal(plan.rmt.compilerSchema, 'xtend.rmtx.compile-result.v4');
  assert.equal(plan.orchestration.artifact.schema, 'xtend.rmt.app-orchestration.v2');
  assert(plan.orchestration.artifact.events.every(event => event.schema === 'xtend.rmt.native-event-binding.v2'));
  const invalid = packedMaraca.createMaracaBuildPlan({ sourceText: source4.replace('type="string"', 'type="Customer"'), virtualSourcePath: 'packed.rmtx',
    orchestration: 'strict', kernel: 'off', hydration: 'off', validation: 'off', transitions: 'off' },
    { rootDir: temporary, inspectToolchain: false, compileSource: compiler.compileSource });
  assert.equal(invalid.ok, false);
});

test('packed Source4 and standalone Maraca declarations preserve legacy results and discriminate opt-in types', () => {
  const { temporary } = packedPackages(), fixture = path.join(temporary, 'source4-consumer.cts');
  fs.writeFileSync(fixture, `import {compileRmtxSource as rootCompile,createRmtxCompiler as rootFactory,type RmtxCompileResult,type RmtxCompileResultV4} from '@ccslabs/xtend/rmt-language/rmtx-compiler';
import {compileRmtxSource,createRmtxCompiler,type RmtxCompilerOptionsV4,type RmtxCompilerV4} from '@ccslabs/xtend-compiler/rmt-language/rmtx-compiler';
import {parseRmtxSource,type RmtxParseResultV4} from '@ccslabs/xtend-compiler/rmt-language/rmtx-parser';
import {createMaracaBuildPlan,type MaracaRunOptions} from '@ccslabs/xtend-maraca';
import {type MaracaRunOptions as RootOptions} from '@ccslabs/xtend/maraca';
import * as legacyURL from '@ccslabs/xtend/xtensions/url-state';
import {PROJECTION_URL_STATE_RUNTIME,type PolicyV2,type ProjectionURLStateRuntime} from '@ccslabs/xtend-compiler/xtensions/url-state';
import {createMaracaBrowserCompositionRoot,type ProjectionComponentBootOptions,type ProjectionComponentBrowserFacade} from '@ccslabs/xtend-maraca/browser-composition-runtime';
import type {RmtxPlanRuntime,RmtxPlanRuntimeOptions,MaracaPlanRuntime,MaracaPlanRuntimeOptions,MaracaURLStateLifetime} from '@ccslabs/xtend-maraca/plan-runtime';
import type {ProjectionComponentArtifact} from '@ccslabs/xtend-maraca/xtension-composition-runtime';
import {normalizeComponentInterface,createComponentInterfaceCatalog,type ComponentInterfaceV2,type ComponentInterfaceCaptureV2} from '@ccslabs/xtend-compiler/xtensions/component-interface';
import {createXRouterProjectionURLStateHost,type XRouterURLStateHost} from '@ccslabs/xtend/components/xrouter-url-state.js';
import type {XRouterElement} from '@ccslabs/xtend/components/xrouter.js';
const selected:RmtxCompilerOptionsV4={syntaxVersion:'4.0.0'};
declare const interface2:ComponentInterfaceV2;
const normalizedInterface2:ComponentInterfaceV2=normalizeComponentInterface(interface2);
const interface2Schema:'xtend.xtensions.component-interface.v2'=normalizedInterface2.schema;
declare const capture2:ComponentInterfaceCaptureV2;
const catalog2=createComponentInterfaceCatalog([capture2]);
for(const capture of catalog2.entries())if(capture.definition.schema==='xtend.xtensions.component-interface.v2'){const definition:ComponentInterfaceV2=capture.definition;void definition;}
const compiler:Readonly<RmtxCompilerV4>=createRmtxCompiler(selected);
const options:MaracaRunOptions={compileSource:compiler.compileSource};
const rootOptions:RootOptions={compileSource:rootFactory(selected).compileSource};
const legacy:RmtxCompileResult=rootCompile('');
const compiled:RmtxCompileResultV4=compileRmtxSource('',selected);
const parsed:RmtxParseResultV4=parseRmtxSource('',selected);
const newSchema:'xtend.rmtx.compile-result.v4'=compiled.schema;
const oldSchema:'xtend.rmtx.compile-result.v1'=legacy.schema;
const rulesSchema:'xtend.rmtx.action-input-rules.v1'|undefined=parsed.actionInputRules?.schema;
const plan=createMaracaBuildPlan({sourceText:'',virtualSourcePath:'app.rmtx'},options);
const legacyURLVersion:'1.0.0'=legacyURL.API_VERSION;
const projectionURLVersion:'2.0.0'=PROJECTION_URL_STATE_RUNTIME.API_VERSION;
const projectionURL:ProjectionURLStateRuntime=legacyURL.PROJECTION_URL_STATE_RUNTIME;
declare const runtime13:RmtxPlanRuntime;
declare const oldRuntime:MaracaPlanRuntime;
declare const windowTarget:Window;
const routerHost2=createXRouterProjectionURLStateHost({runtime:runtime13,codec:PROJECTION_URL_STATE_RUNTIME,windowTarget});
const routerHost2Schema:'xtend.router.url-state-host.v2'=routerHost2.schema;
const routerHost2Version:'2.0.0'=routerHost2.apiVersion;
routerHost2.navigate().then(result=>{if(result.plan){const schema:'xtend.xtensions.url-state-restore-plan.v2'=result.plan.schema;void schema;}});
// @ts-expect-error the explicit URL2 router host rejects a legacy URL1 codec
createXRouterProjectionURLStateHost({runtime:runtime13,codec:legacyURL,windowTarget});
// @ts-expect-error a projection router host is not legacy host1 data
const wrongHost1:XRouterURLStateHost=routerHost2;
declare const routerElement:XRouterElement;
const connected2:'xtend.router.url-state-host.v2'=routerElement.connectURLState(runtime13,PROJECTION_URL_STATE_RUNTIME).schema;
const connected1:'xtend.router.url-state-host.v1'=routerElement.connectURLState(oldRuntime,legacyURL).schema;
declare const policy2:PolicyV2;
declare const policy1:legacyURL.Policy;
declare const projectionInputs:Parameters<ProjectionURLStateRuntime['createURLStateContract']>[1];
const projectionCodec=PROJECTION_URL_STATE_RUNTIME.createURLStateContract(policy2,projectionInputs);
const projectionContractVersion:'2.0.0'=projectionCodec.apiVersion;
declare const snapshotInput:Parameters<typeof projectionCodec.capture>[0];
const snapshot2:'xtend.xtensions.url-state.v2'=projectionCodec.capture(snapshotInput).schema;
// @ts-expect-error projection snapshots cannot masquerade as legacy URL1 data
const legacySnapshot:legacyURL.Snapshot=projectionCodec.capture(snapshotInput);
declare const components:ProjectionComponentArtifact;
const browser10=createMaracaBrowserCompositionRoot({schema:'xtend.maraca.browser-composition-root.v10',buildPlanSchema:'xtend.maraca.build-plan.v8',xtensionComposition:components});
const root10Schema:'xtend.maraca.browser-composition-root.v10'=browser10.schema;
const facade10:ProjectionComponentBrowserFacade=browser10.facade;
const facade10Version:'10.0.0'=facade10.apiVersion;
const snapshot13:'xtend.maraca.plan-runtime.v13'=browser10.facade.snapshot().schema;
browser10.facade.subscribe(snapshot=>{const schema:'xtend.maraca.plan-runtime.v13'=snapshot.schema;void schema;});
declare const bootOptions:ProjectionComponentBootOptions;
browser10.boot({...bootOptions,urlStatePolicy:policy2,urlStateRuntime:PROJECTION_URL_STATE_RUNTIME});
// @ts-expect-error Source4 boot requires its projection URL2 policy
browser10.boot({...bootOptions,urlStatePolicy:policy1});
// @ts-expect-error the legacy URL1 module is not the explicit projection URL2 port
browser10.boot({...bootOptions,urlStateRuntime:legacyURL});
// @ts-expect-error Source4 provider composition currently exposes no SSR capture
browser10.facade.captureXTensionSSR();
// @ts-expect-error Source4 provider composition currently disallows SSR boot
browser10.boot({...bootOptions,xtensions:{...bootOptions.xtensions,ssr:{}}});
declare const planOptions:RmtxPlanRuntimeOptions;
const selectedRuntimeOptions:RmtxPlanRuntimeOptions={...planOptions,urlStatePolicy:policy2,urlStateRuntime:PROJECTION_URL_STATE_RUNTIME};
// @ts-expect-error the projection plan runtime cannot receive legacy URL1
const legacyCodecOptions:RmtxPlanRuntimeOptions={...planOptions,urlStateRuntime:legacyURL};
declare const legacyPlanOptions:MaracaPlanRuntimeOptions;
// @ts-expect-error legacy runtime options cannot silently opt into URL2 policy data
const legacyPolicyOptions:MaracaPlanRuntimeOptions={...legacyPlanOptions,urlStatePolicy:policy2};
declare const lifetime:MaracaURLStateLifetime;
browser10.facade.restoreURLState(null,lifetime).then(result=>{if(result.plan){const schema:'xtend.xtensions.url-state-restore-plan.v2'=result.plan.schema;void schema;}});
browser10.facade.publishURLState({cause:'checkpoint',currentToken:null,lifetime,write(proposal){const schema:'xtend.xtensions.url-history-proposal.v2'=proposal.schema;void schema;}});
// @ts-expect-error selected v4 data is not a legacy compile result
const badLegacy:RmtxCompileResult=compiled;
void[rootOptions,newSchema,oldSchema,rulesSchema,plan,badLegacy,legacyURLVersion,projectionURLVersion,projectionURL,projectionContractVersion,snapshot2,legacySnapshot,root10Schema,facade10Version,snapshot13,selectedRuntimeOptions,legacyCodecOptions,legacyPolicyOptions,interface2Schema,catalog2,routerHost2Schema,routerHost2Version,wrongHost1,connected1,connected2];`);
  const ts = require('typescript');
  const program = ts.createProgram([fixture], { noEmit: true, strict: true, skipLibCheck: false, types: [],
    module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, target: ts.ScriptTarget.ES2022 });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => temporary, getCanonicalFileName: file => file, getNewLine: () => '\n'
  }));
});
