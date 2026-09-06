'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createHash } = require('node:crypto');
const { compileRmtVNextSource } = require('./vnext-compiler');
const { createRmtVNextImportResolver } = require('./vnext-import-resolver');
const { inside } = require('../project-index/sources');
const hash = value => createHash('sha256').update(value).digest('hex');
async function buildPages(options) {
  const root = fs.realpathSync(path.resolve(options.root));
  const configPath = path.resolve(root, options.config || 'xtend.pages.json');
  if (!inside(root, fs.realpathSync(configPath))) throw new Error('Page configuration is outside the project root.');
  const configuration = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (configuration.schema && configuration.schema !== 'xtend.page-build.v1') throw new Error('Unsupported page build configuration.');
  const target = options.target || configuration.target || 'both';
  if (!['node', 'php', 'both'].includes(target)) throw new Error('Page target must be node, php or both.');
  const bundledRuntime = path.resolve(__dirname, '../../xtendrmt/rmt-portable-render.js');
  const runtime = fs.existsSync(bundledRuntime) ? bundledRuntime : require.resolve('@ccslabs/xtend-rmt/portable-render');
  const { createPortableRenderArtifact } = await import(pathToFileURL(runtime).href);
  const pages = {}, layouts = {}, sourceFiles = new Map(), compiled = new Map();
  const compileSource = (input, settings) => {
    const fingerprint = hash(input.text);
    const previous = compiled.get(input.filePath);
    if (previous?.fingerprint === fingerprint) return previous.result;
    const result = (options.compileSource || compileRmtVNextSource)(input, settings);
    compiled.set(input.filePath, { fingerprint, result });
    sourceFiles.set(path.relative(root, input.filePath).replace(/\\/gu, '/'), fingerprint);
    return result;
  };
  function compileDefinition(name, definition) {
    if (!name || ['__proto__', 'constructor', 'prototype'].includes(name)) throw new Error('Invalid page identity.');
    const source = path.resolve(root, definition.source);
    const graph = createRmtVNextImportResolver({ rootDir: root, roots: [root], compileSource }).createGraph({ entryFile: source });
    if (!graph.ok) throw Object.assign(new Error(`Page ${name} has invalid RMT imports or compiler diagnostics.`), { diagnostics: graph.diagnostics });
    const result = compiled.get(source)?.result;
    if (!result?.ok) throw new Error(`Page ${name} did not compile.`);
    const artifact = createPortableRenderArtifact(result, { target: target === 'node' ? 'node' : 'php', inputs: definition.inputs, defaults: definition.defaults, sourceRef: path.relative(root, source).replace(/\\/gu, '/') });
    return { artifact, source: artifact.sourceRef, layout: definition.layout || null, head: definition.head || [], ...(definition.maraca ? {maraca: definition.maraca} : {}) };
  }
  for (const name of Object.keys(configuration.layouts || {}).sort()) {
    const definition = configuration.layouts[name];
    const layout = compileDefinition(name, definition);
    let outlets = 0;
    function mark(node) {
      if (!node || typeof node !== 'object') return;
      if (node.id === definition.outlet && typeof definition.outlet === 'string') { node.pageOutlet = true; outlets++; }
      for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(mark); else if (value && typeof value === 'object') mark(value);
    }
    mark(layout.artifact.descriptor);
    if (outlets !== 1) throw new Error(`Layout ${name} must identify exactly one compiled outlet node.`);
    layouts[name] = layout;
  }
  for (const name of Object.keys(configuration.pages || {}).sort()) {
    const page = compileDefinition(name, configuration.pages[name]);
    if (page.layout && !layouts[page.layout]) throw new Error(`Page ${name} uses an unknown layout.`);
    pages[name] = page;
  }
  if (!Object.keys(pages).length) throw new Error('A page build needs at least one declared page.');
  const host = options.host || configuration.host;
  if (host && host !== 'laravel') throw new Error('Unsupported page host integration.');
  const output = path.resolve(root, options.output || configuration.output || (host === 'laravel' ? 'bootstrap/xtend/pages.json' : '.xtend-build/pages.json'));
  if (!inside(root, output)) throw new Error('Page build output is outside the project root.');
  const assets = {...(configuration.assets || {})}, assetFingerprints = {}, viteAssets = new Set();
  const assetDirectory=path.resolve(root,configuration.assetRoot || 'public');
  const assetRoot=fs.existsSync(assetDirectory)?fs.realpathSync(assetDirectory):assetDirectory;
  for(const definition of [...Object.values(pages),...Object.values(layouts)]) if(definition.maraca){
    const entry=definition.maraca.entry;
    if(typeof entry!=='string'||!/^\/(?!\/)/u.test(entry)||entry.includes('?')||entry.includes('#'))throw new Error('Maraca page entries require same-origin asset paths.');
    const entryFile=fs.realpathSync(path.resolve(assetRoot,entry.slice(1)));
    if(!inside(assetRoot,entryFile))throw new Error('Maraca page entry crosses the asset root.');
    const directory=path.dirname(entryFile),files={};
    function collect(directory){
      for(const child of fs.readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
        const file=path.join(directory,child.name),real=fs.realpathSync(file);
        if(!inside(assetRoot,real))throw new Error('Maraca artifact crosses the asset root.');
        if(child.isDirectory())collect(file);
        else if(/\.(?:m?js|css)$/u.test(child.name)||child.name==='xtend.maraca.services.json'){
          const url='/'+path.relative(assetRoot,file).replace(/\\/gu,'/');files[url]=hash(fs.readFileSync(file));viteAssets.add(url);
        }
      }
    }
    collect(directory);
    definition.maraca={...definition.maraca,files,integrity:'sha256-'+createHash('sha256').update(fs.readFileSync(entryFile)).digest('base64'),sourceFingerprint:sourceFiles.get(definition.source)};
  }
  if (configuration.vite) {
    const vitePath = fs.realpathSync(path.resolve(root, configuration.vite.manifest || 'public/build/manifest.json'));
    if (!inside(root, vitePath)) throw new Error('Vite manifest is outside the project root.');
    const vite = JSON.parse(fs.readFileSync(vitePath, 'utf8'));
    const entry = vite[configuration.vite.entry];
    if (!entry?.file) throw new Error('The page entry is absent from the Vite manifest.');
    const base = configuration.vite.base || '/build/';
    if (!/^\/(?!\/)/u.test(base) || !base.endsWith('/')) throw new Error('Vite base requires a same-origin path ending in /.');
    const css = new Set(assets.css || []), visited = new Set();
    function collect(key) {
      if (visited.has(key)) return; visited.add(key);
      const chunk = vite[key]; if (!chunk?.file) throw new Error(`Missing Vite chunk: ${key}`);
      viteAssets.add(base + chunk.file);
      for (const dependency of chunk.imports || []) collect(dependency);
      for (const file of chunk.css || []) css.add(base + file);
    }
    collect(configuration.vite.entry);
    assets.entry = base + entry.file; assets.css = [...css];
    sourceFiles.set(path.relative(root, vitePath).replace(/\\/gu, '/'), hash(fs.readFileSync(vitePath)));
  }
  for (const url of new Set([...viteAssets, ...(assets.css || []), ...(assets.entry ? [assets.entry] : [])])) {
    if (typeof url !== 'string' || !/^\/(?!\/)/u.test(url)) throw new Error('Page assets require same-origin absolute URLs.');
    const file = fs.realpathSync(path.resolve(root, configuration.assetRoot || 'public', url.slice(1)));
    if (!inside(root,file)) throw new Error('Page asset crosses the project root.');
    assetFingerprints[url] = hash(fs.readFileSync(file));
  }
  const runtimeDirectory = path.dirname(runtime);
  const runtimeFingerprints = {node:{},php:{}};
  for (const file of ['rmt-portable-render.js','rmt-state-selector-runtime.js','rmt-dom-descriptor-renderer.js','rmt-node-ssr-adapter.js','rmt-ssr-stream-host.js','node-page-host.mjs','page-contract.mjs','page-wire.mjs','page-client.mjs','page-form.mjs']) runtimeFingerprints.node[file] = hash(fs.readFileSync(path.join(runtimeDirectory,file)));
  for (const file of ['rmt-portable-render.php','rmt-php-ssr-adapter.php','rmt-page-data.php']) runtimeFingerprints.php[file] = hash(fs.readFileSync(path.join(runtimeDirectory,file)));
  if (host === 'laravel') {
    runtimeFingerprints.php['rmt-php-app-service-adapter.php'] = hash(fs.readFileSync(path.join(runtimeDirectory,'rmt-php-app-service-adapter.php')));
    for (const file of (Object.values(pages).some(page=>page.maraca) ? ['xscaler-preflight.php','xscaler-php-fragment-adapter.php'] : [])) {
      const bundled = path.join(runtimeDirectory,'../xscaler',file);
      const source = fs.existsSync(bundled) ? bundled : path.join(root,'vendor/ccslabs/xtend-laravel/runtime',file);
      if (!fs.existsSync(source)) throw new Error('Maraca page builds require the packaged XScaler PHP runtime: ' + file);
      runtimeFingerprints.php[file] = hash(fs.readFileSync(source));
    }
  }
  const base = { schema: 'xtend.page-manifest.v1', assets, assetFingerprints, runtimeFingerprints, configurationFingerprint:hash(fs.readFileSync(configPath)), pages, layouts, sources: Object.fromEntries([...sourceFiles].sort(([a],[b]) => a.localeCompare(b))), target };
  const manifest = { ...base, version: hash(JSON.stringify(base)) };
  let existingParent = path.dirname(output);
  while (!fs.existsSync(existingParent)) existingParent = path.dirname(existingParent);
  if (!inside(root, fs.realpathSync(existingParent))) throw new Error('Page output crosses the project root through a symlink.');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  if (!inside(root, fs.realpathSync(path.dirname(output)))) throw new Error('Page output crosses the project root through a symlink.');
  const temporary = `${output}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(manifest, null, 2) + '\n'); fs.renameSync(temporary, output);
  const types = ['import type { JsonValue } from "@ccslabs/xtend-rmt/portable-render";', `export type PageName = ${Object.keys(pages).map(name => JSON.stringify(name)).join(' | ')};`, 'export interface PageProps {'];
  const inputTypes = artifact => artifact.inputs.map(key => {
    const declaration = artifact.state?.states?.find(state => state.id === key);
    const type = {string:'string',number:'number',boolean:'boolean',array:'JsonValue[]',object:'Record<string, JsonValue>'}[declaration?.type] || 'JsonValue';
    return `${JSON.stringify(key)}: ${type}`;
  }).join('; ');
  for (const [name, page] of Object.entries(pages)) types.push(`  ${JSON.stringify(name)}: { ${inputTypes(page.artifact)} };`);
  types.push('}', '');
  types.push(`export type LayoutName = ${Object.keys(layouts).map(name=>JSON.stringify(name)).join(' | ') || 'never'};`, 'export interface LayoutProps {');
  for (const [name, layout] of Object.entries(layouts)) types.push(`  ${JSON.stringify(name)}: { ${inputTypes(layout.artifact)} };`);
  types.push('}', '');
  const typeOutput = output.replace(/\.json$/u, '') + '.d.ts', typeTemporary = `${typeOutput}.${process.pid}.tmp`;
  fs.writeFileSync(typeTemporary, types.join('\n')); fs.renameSync(typeTemporary, typeOutput);
  return { ok: true, manifest, output, sourceCount: sourceFiles.size };
}
async function runPageBuildCli(args, io = {}) {
  const stdout = io.stdout || process.stdout, stderr = io.stderr || process.stderr;
  if (args.includes('--help') || args[0] !== 'build') { stdout.write('xt pages build --root <project> [--config xtend.pages.json] [--target node|php|both] [--host laravel] [--output path] --json\n'); return args.includes('--help') ? 0 : 1; }
  try {
    const options = {}; for (let i=1;i<args.length;i++) { if (args[i] === '--json') continue; const key=args[i].replace(/^--/u,''); if (!args[i].startsWith('--') || !['root','config','target','host','output'].includes(key) || !args[i+1] || args[i+1].startsWith('--') || options[key]) throw new Error(`Invalid page build argument: ${args[i]}`); options[key]=args[++i]; }
    if (!options.root) throw new Error('Page builds require an explicit --root.');
    const result = await buildPages(options); stdout.write(JSON.stringify({ ok: true, output: result.output, version: result.manifest.version, pages: Object.keys(result.manifest.pages), sourceCount: result.sourceCount })+'\n'); return 0; }
  catch (error) { stderr.write(JSON.stringify({ok:false,error:error.message,diagnostics:error.diagnostics || []})+'\n'); return 1; }
}
module.exports = { buildPages, runPageBuildCli };
