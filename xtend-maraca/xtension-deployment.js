// SPDX-License-Identifier: Apache-2.0
'use strict';
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
const { json, fields, freeze, copy } = require('./xtension-composition-contract.mjs');
const builds = new WeakMap(), deployments = new WeakMap();
const pwaTools = require('./xtension-deployment-pwa');
const XTENSION_DEPLOYMENT_API_VERSION = '2.0.0', manifestFile = 'xtend.deployment.json';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sri = digest => 'sha256-' + Buffer.from(digest, 'hex').toString('base64');
const script = file => /\.(?:mjs|js)$/.test(file);
const safePath = value => typeof value === 'string' && /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(value) && value.split('/').every(part => !['.', '..'].includes(part));
function readFile(root, fileName) {
  if (!safePath(fileName)) throw new TypeError('Deployment files require canonical relative paths.');
  let target = root;
  for (const part of fileName.split('/')) { target = path.join(target, part); if (fs.lstatSync(target).isSymbolicLink()) throw new TypeError('Deployment inputs cannot contain symlinks.'); }
  const stat = fs.statSync(target);
  if (!stat.isFile() || stat.size > 64 * 1024 * 1024) throw new TypeError('Deployment input must be a bounded regular file.');
  return fs.readFileSync(target);
}
function record(fileName, bytes) { return { fileName, sha256: hash(bytes), bytes: bytes.length }; }
function graph(files) {
  if([...files.values()].reduce((sum,bytes)=>sum+bytes.length,0)>256*1024*1024)throw new TypeError('Deployment inventory exceeds its byte bound.');
  const { parseAst } = require('rollup/parseAst');
  for (const [fileName, bytes] of files) {
    if (!script(fileName)) continue;
    function edge(specifier) {
      if (typeof specifier !== 'string' || !/^(?:\.\/|(?:\.\.\/)+)[A-Za-z0-9_./-]+$/.test(specifier)) throw new TypeError('Sealed ESM requires literal relative module imports.');
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(fileName), specifier));
      if (!safePath(target) || !script(target) || !files.has(target)) throw new TypeError('Every sealed ESM dependency must belong to the captured JavaScript inventory.');
    }
    function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) && node.source) edge(node.source.value);
      if (node.type === 'ImportExpression') edge(node.source.type === 'Literal' ? node.source.value : null);
      for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value === 'object') walk(value);
    }
    walk(parseAst(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
  }
}
function envelope(publicPath, files, bootstrap, context) {
  const pwa = context?.runtime?.pwa === 'verified-static-cache';
  const integrity = Object.fromEntries([...files].filter(([file]) => script(file) && !(pwa && file === pwaTools.workerFile)).sort(([a],[b])=>a<b?-1:1).map(([file, bytes])=>[publicPath + file, sri(hash(bytes))]));
  const map = JSON.stringify({ integrity });
  const hashes = [...new Set([...Object.values(integrity), sri(hash(map))])].sort().map(value=>`'${value}'`).join(' ');
  const headers = { 'Content-Security-Policy': `script-src ${hashes}; script-src-attr 'none'; object-src 'none'; base-uri 'none'; worker-src ${pwa ? context.origin + publicPath + pwaTools.workerFile : "'none'"}`,
    'Integrity-Policy': 'blocked-destinations=(script)', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store, no-transform' };
  return { map, headers, tags: `<script type="importmap">${map}</script>\n  <script type="module" src="${publicPath + bootstrap}" integrity="${integrity[publicPath + bootstrap]}" crossorigin="anonymous"></script>` };
}
/** Private registration from the successful regular build, before it returns.
 * Neither serialized build reports nor caller-supplied digests create this brand. */
function registerBuild(result) {
  if (!result.ok || result.plan.xtensionComposition?.schema !== 'xtend.maraca.xtension-composition-manifest.v5') return;
  const root = fs.realpathSync(result.plan.outputDir), rows = result.sizeBudgetReport.accounting.files;
  const capture = rows.map(row => { const bytes = fs.readFileSync(path.join(root, row.fileName)); if (hash(bytes) !== row.sha256 || bytes.length !== row.bytes) throw new TypeError('Actual build bytes changed before deployment registration.'); return { ...row }; });
  const services = result.plan.services, pwa = result.plan.pwa;
  const privateRows = services?.enabled ? (result.serviceBuildReport?.files || []).map(file => {
    const fileName = path.relative(path.resolve(result.plan.outputDir), path.resolve(file)).split(path.sep).join('/');
    return record(fileName, fs.readFileSync(file));
  }) : [];
  builds.set(result, { root, rows: capture, host: path.basename(result.plan.outputs.host), budget: copy(result.sizeBudgetReport),
    incompatible: !!pwa?.enabled || !!services?.enabled, services: !!services?.enabled, privateRows,
    servicePath: services?.enabled ? services.transport.basePath : null,
    pwa: pwa?.enabled ? { manifest: path.basename(pwa.outputs.manifest), worker: path.basename(pwa.outputs.serviceWorker), report: path.basename(pwa.outputs.report),
      offline: pwa.outputs.offlineFallback ? path.basename(pwa.outputs.offlineFallback) : null,
      custom: !!pwa.businessLogicImport || pwa.serviceWorker?.type !== 'classic' || !!result.plan.uiCoprocessor?.enabled } : null });
}
function resultFor(root, manifest, files, manifestBytes, accounting, serverRoot) {
  const v2 = manifest.schema === 'xtend.maraca.xtension-deployment-manifest.v2';
  const result = freeze({ schema: v2 ? 'xtend.maraca.xtension-deployment-result.v2' : 'xtend.maraca.xtension-deployment-result.v1', apiVersion: v2 ? '2.0.0' : '1.0.0',
    outputDir: root, manifestFile, manifestSha256: hash(manifestBytes), manifest, headers: envelope(manifest.publicPath, files, manifest.bootstrap, manifest).headers,
    ...(serverRoot ? { serverOutputDir: serverRoot } : {}), ...(accounting ? { accounting } : {}), runtimeExecutionVerified: false });
  deployments.set(result, new Map([...files].map(([file,bytes])=>[file,Buffer.from(bytes)])));
  return result;
}
const separate = (a,b) => { const relative=path.relative(a,b); return relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative); };
const publicMember = file => !file.startsWith('server/') && !/\.(?:map|d\.ts|php)$/.test(file) && !file.startsWith('xtend.maraca.services.');
const servicePath = value => typeof value==='string' && /^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+$/.test(value);
function writeFiles(output, files) {
  fs.mkdirSync(output,{recursive:true}); const root=fs.realpathSync(output);
  for (const [fileName,value] of files) {
    let parent=root;
    for(const part of fileName.split('/').slice(0,-1)){parent=path.join(parent,part);if(fs.existsSync(parent)){if(fs.lstatSync(parent).isSymbolicLink()||!fs.statSync(parent).isDirectory())throw new TypeError('Deployment output cannot escape through symlinks.');}else fs.mkdirSync(parent);}
    const target=path.join(root,fileName);
    if(fs.existsSync(target)&&fs.lstatSync(target).isSymbolicLink())throw new TypeError('Deployment output cannot contain symlinks.');
    try{fs.writeFileSync(target,value,{flag:'wx'});}catch(error){if(error.code!=='EEXIST'||!fs.readFileSync(target).equals(value))throw error;}
  }
  return root;
}
function runtimeConfig(options,capture) {
  pwaTools.validatePolicy(options.runtime);pwaTools.validateOrigin(options.origin);
  if((options.runtime.pwa==='verified-static-cache')!==!!capture.pwa || (options.runtime.appServices==='separate-server')!==capture.services)throw new TypeError('Runtime policy must match the actual PWA/AppServices build.');
  if(capture.pwa?.custom)throw new TypeError('Sealed PWA excludes custom worker imports, module workers and UI coprocessors.');
  if(capture.services && (!capture.privateRows.length || !servicePath(capture.servicePath) || typeof options.serverOutputDir!=='string'))throw new TypeError('AppServices require captured private artifacts, a canonical transport path and a separate server output.');
  if(!capture.services && options.serverOutputDir!==undefined)throw new TypeError('Disabled AppServices have no server output.');
}

function buildMaracaXTensionDeployment(options) {
  const v2 = options?.schema === 'xtend.maraca.xtension-deployment-config.v2';
  fields(options, ['schema','build','application','publicPath','outputDir',...(v2 ? ['runtime','origin','serverOutputDir'] : [])], 'deployment config');
  if (!v2 && options.schema !== 'xtend.maraca.xtension-deployment-config.v1') throw new TypeError('Deployment config v1 or v2 is required.');
  const capture = builds.get(options.build);
  if (!capture) throw new TypeError('A successful actual regular build with the explicit delivery profile is required.');
  if (v2) runtimeConfig(options,capture);
  else if (capture.incompatible) throw new TypeError('Sealed deployment v1 excludes PWA and AppServices builds.');
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(options.publicPath || '')) throw new TypeError('An explicit canonical deployment publicPath is required.');
  fields(options.application,['rootDir','bootstrap','modules'],'deployment application');
  const application = options.application, appRoot = fs.realpathSync(application.rootDir);
  if (!Array.isArray(application.modules) || application.modules.length > 256) throw new TypeError('Pinned application modules are required.');
  const files = new Map();
  for (const row of capture.rows) {
    const bytes = readFile(capture.root, row.fileName);
    if (bytes.length !== row.bytes || hash(bytes) !== row.sha256) throw new TypeError('Build output differs from its actual capture.');
    files.set(row.fileName, bytes);
  }
  const privateFiles = new Map();
  if (v2) {
    for(const row of capture.privateRows){const bytes=readFile(capture.root,row.fileName);if(bytes.length!==row.bytes||hash(bytes)!==row.sha256)throw new TypeError('Private AppService output differs from the actual capture.');privateFiles.set(row.fileName,bytes);files.delete(row.fileName);}
    for(const file of [...files.keys()])if(!publicMember(file))files.delete(file);
    if(capture.pwa){for(const file of [capture.pwa.worker,capture.pwa.report,capture.pwa.offline])files.delete(file);}
  }
  for (const pin of [application.bootstrap,...application.modules]) {
    fields(pin,['fileName','sha256'],'application module');
    if (v2 && (!publicMember(pin.fileName || '') || pin.fileName === pwaTools.workerFile))throw new TypeError('Application modules cannot occupy private or worker paths.');
    if (!script(pin.fileName || '') || !/^[a-f0-9]{64}$/.test(pin.sha256 || '') || files.has(pin.fileName)) throw new TypeError('Application modules require unique explicit JavaScript pins.');
    const bytes = readFile(appRoot,pin.fileName);
    if (hash(bytes) !== pin.sha256) throw new TypeError('Application module integrity mismatch.');
    files.set(pin.fileName, bytes);
  }
  if (files.has(manifestFile) || files.size > 2048) throw new TypeError('Deployment inventory is bounded and reserves its manifest filename.');
  graph(files);
  const host = files.get(capture.host), source = '<script type="module" src="./xtend.maraca.mjs"></script>';
  if (!host || host.toString().split(source).length !== 2) throw new TypeError('The exact generated Maraca host is required.');
  const manifest = { schema: v2 ? 'xtend.maraca.xtension-deployment-manifest.v2' : 'xtend.maraca.xtension-deployment-manifest.v1',apiVersion:v2 ? '2.0.0' : '1.0.0',mode:'native-sri-importmap',
    publicPath:options.publicPath,documentFile:capture.host,bootstrap:application.bootstrap.fileName,
    ...(v2 ? {origin:options.origin,runtime:copy(options.runtime),servicePath:capture.servicePath,serverFiles:[...privateFiles].map(([file,bytes])=>record(file,bytes)).sort((a,b)=>a.fileName<b.fileName?-1:1),pwa:null} : {}) };
  if(v2 && capture.services && (manifest.servicePath===manifest.publicPath.slice(0,-1)||[...files.keys()].some(file=>(manifest.publicPath+file).startsWith(manifest.servicePath+'/'))))throw new TypeError('Service routes cannot overlap public static files.');
  if(v2 && capture.pwa){
    if(files.has(pwaTools.offlineFile))throw new TypeError('Reserved sealed fallback path.');
    const webmanifest=JSON.parse(files.get(capture.pwa.manifest));json(webmanifest);
    files.set(capture.pwa.manifest,Buffer.from(JSON.stringify({...webmanifest,start_url:options.publicPath,scope:options.publicPath})+'\n'));
    files.set(pwaTools.offlineFile,pwaTools.offline);manifest.pwa={manifestFile:capture.pwa.manifest};
    const pwa=pwaTools.pwaFor(manifest,files);files.set(pwa.workerFile,pwaTools.workerSource(pwa));
    manifest.pwa={workerFile:pwa.workerFile,offlineFile:pwa.offlineFile,manifestFile:pwa.manifestFile,cacheName:pwa.cacheName};
  }
  const { tags } = envelope(options.publicPath,files,application.bootstrap.fileName,manifest);
  files.set(capture.host,Buffer.from(host.toString().replace(source,tags)));
  if(files.size>2048||[...files.values()].reduce((sum,value)=>sum+value.length,0)>256*1024*1024)throw new TypeError('Deployment inventory exceeds its bound.');
  manifest.files=[...files].map(([file,bytes])=>record(file,bytes)).sort((a,b)=>a.fileName<b.fileName?-1:1);
  json(manifest);
  const manifestBytes = Buffer.from(JSON.stringify(manifest)+'\n');
  const applicationBytes = [application.bootstrap,...application.modules].reduce((sum,row)=>sum+files.get(row.fileName).length,0);
  const bytes = [...files.values()].reduce((sum,value)=>sum+value.length,0)+manifestBytes.length;
  const overheadBytes = bytes-capture.rows.reduce((sum,row)=>sum+row.bytes,0)-applicationBytes;
  const frameworkBytes = capture.budget.framework.bytes+overheadBytes;
  const serverBytes=[...privateFiles.values()].reduce((sum,value)=>sum+value.length,0);
  const accounting = { totalBytes:bytes+(v2?serverBytes:0),applicationBytes,envelopeBytes:overheadBytes,frameworkBytes,frameworkBaselineBytes:capture.budget.framework.baselineBytes,
    ...(v2 ? {publicBytes:bytes,serverBytes,pwaWorkerBytes:manifest.pwa ? files.get(manifest.pwa.workerFile).length : 0} : {}),
    xtensionRuntimeBytes:capture.budget.xtensions.runtimeBytes,withinBudget:frameworkBytes<capture.budget.framework.baselineBytes && capture.budget.xtensions.withinBudget };
  if (!accounting.withinBudget) throw new TypeError('Sealed deployment exceeds the unchanged captured framework budget.');
  const output = path.resolve(options.outputDir), relative = path.relative(capture.root,output);
  if (!relative || !relative.startsWith('..'+path.sep) && relative !== '..' && !path.isAbsolute(relative) || output === appRoot) throw new TypeError('Deployment output must be separate from build and application inputs.');
  // Resolve existing ancestor symlinks before creating either output tree.
  function physical(directory){let current=path.resolve(directory),suffix=[];while(!fs.existsSync(current)){suffix.unshift(path.basename(current));current=path.dirname(current);}return path.join(fs.realpathSync(current),...suffix);}
  const outputRoot=physical(output),serverRoot=v2&&capture.services ? physical(options.serverOutputDir) : undefined;
  if(!separate(capture.root,outputRoot)||outputRoot===appRoot)throw new TypeError('Physical deployment output must remain separate.');
  if(v2 && (!separate(outputRoot,capture.root)||!separate(appRoot,outputRoot)||!separate(outputRoot,appRoot)||serverRoot && [capture.root,appRoot,outputRoot].some(input=>!separate(input,serverRoot)||!separate(serverRoot,input))))throw new TypeError('Public, server, build and application outputs must remain separate.');
  // All bytes, paths, graph members and budgets are checked before writing.
  if(serverRoot)writeFiles(serverRoot,privateFiles);
  const root=writeFiles(outputRoot,[...files,[manifestFile,manifestBytes]]);
  return resultFor(root,manifest,files,manifestBytes,accounting,serverRoot);
}

function loadMaracaXTensionDeployment(options) {
  fields(options,['rootDir','manifestSha256','serverRootDir'],'deployment load');
  if (!/^[a-f0-9]{64}$/.test(options.manifestSha256 || '')) throw new TypeError('An out-of-band deployment manifest SHA-256 is required.');
  const root = fs.realpathSync(options.rootDir), bytes = readFile(root,manifestFile);
  if (bytes.length > 2*1024*1024 || hash(bytes) !== options.manifestSha256) throw new TypeError('Deployment manifest differs from the trusted digest.');
  const manifest = JSON.parse(bytes); json(manifest);
  const v2=manifest.schema==='xtend.maraca.xtension-deployment-manifest.v2';
  fields(manifest,['schema','apiVersion','mode','publicPath','documentFile','bootstrap','files',...(v2?['origin','runtime','servicePath','serverFiles','pwa']:[])],'deployment manifest');
  if(!v2 && 'serverRootDir' in options)throw new TypeError('Legacy deployment has no private server root.');
  if (!v2 && manifest.schema !== 'xtend.maraca.xtension-deployment-manifest.v1' || manifest.apiVersion !== (v2 ? '2.0.0' : '1.0.0') || manifest.mode !== 'native-sri-importmap' || !/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(manifest.publicPath || '') || !Array.isArray(manifest.files) || !manifest.files.length || manifest.files.length>2048) throw new TypeError('A bounded version-matched native deployment manifest is required.');
  const files = new Map();
  for (const row of manifest.files) {
    fields(row,['fileName','bytes','sha256'],'deployment file');
    if (row.fileName === manifestFile || files.has(row.fileName) || !Number.isSafeInteger(row.bytes) || row.bytes<0 || !/^[a-f0-9]{64}$/.test(row.sha256 || ''))throw new TypeError('Invalid deployment file record.');
    const value = readFile(root,row.fileName);
    if(value.length!==row.bytes||hash(value)!==row.sha256)throw new TypeError('Deployment file differs from its trusted bytes.');
    files.set(row.fileName,value);
  }
  if(!files.has(manifest.bootstrap)||!script(manifest.bootstrap)||!files.has(manifest.documentFile)||!manifest.documentFile.endsWith('.html'))throw new TypeError('Deployment roots are absent.');
  graph(files);
  let serverRoot;
  if(v2){
    pwaTools.validatePolicy(manifest.runtime);pwaTools.validateOrigin(manifest.origin);
    if(!Array.isArray(manifest.serverFiles)||manifest.serverFiles.length>2048||[...files.keys()].some(file=>!publicMember(file)))throw new TypeError('Invalid deployment public/server partition.');
    if(manifest.runtime.appServices==='separate-server'){
      if(!manifest.serverFiles.length||!servicePath(manifest.servicePath))throw new TypeError('Missing private AppService partition.');
      serverRoot=fs.realpathSync(options.serverRootDir);if(!separate(root,serverRoot)||!separate(serverRoot,root))throw new TypeError('Private server root must be separate.');
      const seen=new Set();for(const row of manifest.serverFiles){fields(row,['fileName','bytes','sha256'],'server file');if(seen.has(row.fileName)||files.has(row.fileName)||!Number.isSafeInteger(row.bytes)||row.bytes<0||!/^[a-f0-9]{64}$/.test(row.sha256||''))throw new TypeError('Invalid private file record.');seen.add(row.fileName);const value=readFile(serverRoot,row.fileName);if(value.length!==row.bytes||hash(value)!==row.sha256)throw new TypeError('Private server bytes differ from the trusted manifest.');}
      if(manifest.servicePath===manifest.publicPath.slice(0,-1)||[...files.keys()].some(file=>(manifest.publicPath+file).startsWith(manifest.servicePath+'/')))throw new TypeError('Service/static route overlap.');
    }else if(manifest.serverFiles.length||manifest.servicePath!==null||options.serverRootDir!==undefined)throw new TypeError('Disabled services have no private partition.');
    const pwa=pwaTools.pwaFor(manifest,files);
    if(pwa){
      const expected={workerFile:pwa.workerFile,offlineFile:pwa.offlineFile,manifestFile:pwa.manifestFile,cacheName:pwa.cacheName};
      fields(manifest.pwa,Object.keys(expected),'deployment PWA');
      if(Object.entries(expected).some(([key,value])=>manifest.pwa[key]!==value)||!files.get(pwa.workerFile)?.equals(pwaTools.workerSource(pwa))||!files.get(pwa.offlineFile)?.equals(pwaTools.offline))throw new TypeError('PWA bytes differ from the derived closed worker policy.');
    }else if(manifest.pwa!==null||files.has(pwaTools.workerFile)||files.has(pwaTools.offlineFile))throw new TypeError('Disabled PWA has no worker/fallback.');
  }
  const {tags}=envelope(manifest.publicPath,files,manifest.bootstrap,manifest);
  if(files.get(manifest.documentFile).toString().split(tags).length!==2)throw new TypeError('Deployment host lacks the exact native integrity envelope.');
  return resultFor(root,manifest,files,bytes,undefined,serverRoot);
}
function createMaracaXTensionDeploymentHandler(result) {
  const files = deployments.get(result);
  if (!files) throw new TypeError('An actual built or digest-verified deployment is required.');
  const {publicPath,documentFile}=result.manifest, headers=result.headers;
  return (request,response) => {
    const url=request.url;
    if(typeof url!=='string'||!url.startsWith(publicPath)||result.manifest.servicePath && (url===result.manifest.servicePath||url.startsWith(result.manifest.servicePath+'/')))return false;
    for(const [key,value] of Object.entries(headers))response.setHeader(key,value);
    if(!['GET','HEAD'].includes(request.method)){response.writeHead(405,{'Allow':'GET, HEAD'});response.end();return true;}
    const file=url===publicPath?documentFile:url.slice(publicPath.length);
    if(!safePath(file)||!files.has(file)){response.writeHead(404);response.end();return true;}
    if(result.manifest.pwa?.workerFile===file){response.setHeader('Service-Worker-Allowed',publicPath);response.setHeader('Content-Security-Policy',"default-src 'none'; connect-src 'self'; script-src 'none'; worker-src 'none'");}
    if(result.manifest.pwa?.offlineFile===file)response.setHeader('Content-Security-Policy',"default-src 'none'; base-uri 'none'; worker-src 'none'");
    const imageTypes={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',svg:'image/svg+xml',webp:'image/webp',avif:'image/avif',ico:'image/x-icon',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf'};
    const extension=file.split('.').pop();
    const assetType=result.manifest.apiVersion==='2.0.0' && Object.hasOwn(imageTypes,extension) ? imageTypes[extension] : undefined;
    const value=files.get(file),type=script(file)?'text/javascript; charset=utf-8':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.json')||file.endsWith('.webmanifest')?'application/json':assetType||'application/octet-stream';
    response.writeHead(200,{'Content-Type':result.manifest.pwa?.manifestFile===file?'application/manifest+json':type,'Content-Length':value.length});response.end(request.method==='HEAD'?undefined:Buffer.from(value));return true;
  };
}
module.exports={XTENSION_DEPLOYMENT_API_VERSION,buildMaracaXTensionDeployment,loadMaracaXTensionDeployment,createMaracaXTensionDeploymentHandler,registerBuild};
