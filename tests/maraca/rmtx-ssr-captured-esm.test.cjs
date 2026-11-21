'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { importCapturedSSRGraph, normalizeCapturedSSRModuleBaseURL, resolveCapturedSSRImportMeta, createCapturedSSRModuleCache } = require('../../xtend-maraca/server-captured-esm.cjs');
const chunk = (fileName, code) => ({ type:'chunk', fileName, code });

test('captured SSR preserves native dynamic import timing without browser globals', async () => {
  assert.equal(typeof globalThis.HTMLElement,'undefined');
  const app = await importCapturedSSRGraph([
    chunk('entry.mjs',`export const ready=true;export const provider=()=>import('./provider.mjs');export const browserClass=()=>import('./browser.mjs');`),
    chunk('provider.mjs',`export function create(){return 'actual-provider';}`),
    chunk('browser.mjs',`export class NativeControl extends HTMLElement{}`)
  ],'entry.mjs');
  assert.equal(app.ready,true);
  assert.equal((await app.provider()).create(),'actual-provider');
  await assert.rejects(app.browserClass(),/HTMLElement is not defined/);
  assert.equal(typeof globalThis.HTMLElement,'undefined');
});

test('one captured graph retains shared module identity and dynamic-to-entry edges', async () => {
  const app = await importCapturedSSRGraph([
    chunk('entry.mjs',`import {state} from './shared.mjs';export {state};export const load=()=>import('./lazy.mjs');`),
    chunk('shared.mjs',`export const state={value:0};`),
    chunk('lazy.mjs',`import {state} from './entry.mjs';export const read=()=>state.value;export const write=value=>state.value=value;`)
  ],'entry.mjs');
  const lazy = await app.load();
  app.state.value=3;assert.equal(lazy.read(),3);
  lazy.write(4);assert.equal(app.state.value,4);assert.equal(await app.load(),lazy);
});

test('request factories own independent state while native module state is explicit', async () => {
  const chunks=[chunk('entry.mjs',`export let factories=0;export function create(){factories++;let value=0;return {write(next){value=next},read(){return value}};}`)];
  const app=await importCapturedSSRGraph(chunks,'entry.mjs'), first=app.create(), second=app.create();
  first.write('first-request');assert.equal(second.read(),0);assert.equal(app.factories,2);
  const revision=await importCapturedSSRGraph(chunks,'entry.mjs');assert.notEqual(revision,app);assert.equal(revision.factories,0);
});

test('unknown, external and nonliteral imports fail before entry execution', async () => {
  for(const source of [
    `import './absent.mjs';throw new Error('entry-executed');`,
    `export const load=()=>import('node:fs');throw new Error('entry-executed');`,
    `const module='./provider.mjs';export const load=()=>import(module);throw new Error('entry-executed');`,
    `export * from 'https://example.invalid/module.mjs';throw new Error('entry-executed');`
  ]) await assert.rejects(importCapturedSSRGraph([chunk('entry.mjs',source)],'entry.mjs'),/captured imports|captured chunk graph/);
});

test('static cycles and malformed graph membership fail closed', async () => {
  await assert.rejects(importCapturedSSRGraph([chunk('entry.mjs',`import './a.mjs';`),chunk('a.mjs',`import './entry.mjs';`)],'entry.mjs'),/Static SSR chunk cycles/);
  await assert.rejects(importCapturedSSRGraph([chunk('entry.mjs',''),chunk('entry.mjs','')],'entry.mjs'),/unique/);
  await assert.rejects(importCapturedSSRGraph([{type:'asset',fileName:'entry.mjs',source:''}],'entry.mjs'),/JavaScript chunks/);
  await assert.rejects(importCapturedSSRGraph([chunk('../entry.mjs','')],'../entry.mjs'),/bounded/);
  await assert.rejects(importCapturedSSRGraph([chunk('other.mjs','')],'entry.mjs'),/entry is absent/);
});

test('captured source and nested data URL expansion have hard byte limits', async () => {
  await assert.rejects(importCapturedSSRGraph(Array.from({length:2049},(_,index)=>chunk(`entry${index}.mjs`,'')),'entry0.mjs'),/bounded/);
  await assert.rejects(importCapturedSSRGraph([chunk('entry.mjs',' '.repeat(16*1024*1024+1))],'entry.mjs'),/source exceeds/);
  const shared=`export const value=${JSON.stringify('x'.repeat(1024*1024))};`;
  const imports=Array.from({length:200},()=>`import './shared.mjs';`).join('\n');
  await assert.rejects(importCapturedSSRGraph([chunk('entry.mjs',imports),chunk('shared.mjs',shared)],'entry.mjs'),/URL graph exceeds/);
});

test('trusted module bases are explicit stable HTTP(S) entry URLs', () => {
  assert.equal(normalizeCapturedSSRModuleBaseURL(undefined),null);
  assert.equal(normalizeCapturedSSRModuleBaseURL('https://assets.example/app/entry.mjs'), 'https://assets.example/app/entry.mjs');
  assert.throws(()=>normalizeCapturedSSRModuleBaseURL(undefined,true),/require/);
  for(const value of [null,{},'./entry.mjs','file:///private/entry.mjs','https://user:secret@example.test/entry.mjs','https://example.test/','https://example.test/entry.mjs?v=1','https://example.test/entry.mjs#other',' https://example.test/entry.mjs']) assert.throws(()=>normalizeCapturedSSRModuleBaseURL(value));
});

test('import.meta.url retains original captured asset folders after code splitting', async () => {
  const { rollup } = require('rollup'), path = require('node:path').posix;
  const entry = 'entry.mjs', moduleBaseURL = 'https://assets.example/deployment/entry.mjs';
  const files = new Map([
    [entry, `export const css=new URL('./app.css',import.meta.url).href;export const provider=()=>import('./providers/view.mjs');`],
    ['providers/view.mjs', `export const image=new URL('./image.png',import.meta.url).href;`]
  ]);
  const bundle = await rollup({input:entry,plugins:[{
    name:'captured-module-base-test',resolveId(id,importer){return importer?path.normalize(path.join(path.dirname(importer),id)):id;},load:id=>files.get(id),
    resolveImportMeta:(property,{moduleId})=>resolveCapturedSSRImportMeta(property,{moduleId,entry,moduleBaseURL,files})
  }]});
  try {
    const output=await bundle.generate({format:'es',entryFileNames:'entry.mjs',chunkFileNames:'changed-output-folder/[name].mjs'});
    const app=await importCapturedSSRGraph(output.output,entry);
    assert.equal(app.css,'https://assets.example/deployment/app.css');
    assert.equal((await app.provider()).image,'https://assets.example/deployment/providers/image.png');
  } finally {await bundle.close();}
  assert.throws(()=>resolveCapturedSSRImportMeta('url',{moduleId:'missing.mjs',entry,moduleBaseURL,files}),/original captured/);
});

test('one immutable build reuses its namespace and cannot change deployment bases', async () => {
  const cache=createCapturedSSRModuleCache(),build={},moduleBaseURL='https://assets.example/app/entry.mjs';
  let loads=0;const namespace={create(){let value=0;return{write(next){value=next;},read(){return value;}};}};
  const first=cache(build,moduleBaseURL,async()=>{loads++;return namespace;});
  assert.equal(cache(build,moduleBaseURL,()=>{throw Error('must reuse');}),first);
  assert.equal(await first,namespace);assert.equal(loads,1);
  const request1=namespace.create(),request2=namespace.create();request1.write('request1');assert.equal(request2.read(),0);
  assert.throws(()=>cache(build,'https://different.example/entry.mjs',()=>{loads++;}),/cannot change/);assert.equal(loads,1);
  assert.notEqual(cache({},moduleBaseURL,async()=>namespace),first);
});
