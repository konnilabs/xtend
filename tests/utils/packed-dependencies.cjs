'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {createRequire} = require('node:module');
const semver = require('semver');

// npm pack deliberately does not install dependencies. Reproduce only the
// declarations in the extracted manifests, using the verified local installs;
// never copy an enclosing node_modules or the test framework-peer installation.
function materializePackedDependencies({consumerRoot, packages, sourceRoots}) {
  const root = fs.realpathSync(consumerRoot);
  const allowed = sourceRoots.map(directory => fs.realpathSync(directory));
  const installed = new Map(), edges = [], skippedOptional = [];
  const framework = name => /^(?:react(?:$|-)|vue$|@vue\/)/u.test(name);
  const inside = (file, directory) => file === directory || file.startsWith(directory + path.sep);
  const readManifest = directory => JSON.parse(fs.readFileSync(path.join(directory,'package.json'),'utf8'));
  const libc = process.platform === 'linux' ? process.report.getReport().header.glibcVersionRuntime ? 'glibc' : 'musl' : null;
  function supports(list, value) {
    if (!Array.isArray(list) || !list.length) return true;
    return !list.includes('!' + value) && (!list.some(item=>!item.startsWith('!')) || list.includes(value));
  }
  function compatible(manifest) {
    return supports(manifest.os,process.platform) && supports(manifest.cpu,process.arch) && (libc === null || supports(manifest.libc,libc));
  }
  function locations(from, name) {
    // A declared npm package can share a builtin name (for example punycode).
    return createRequire(path.join(from,'package.json')).resolve.paths(name+'/package.json') || [];
  }
  function locate(name, from) {
    for (const origin of [from,...allowed]) for (const directory of locations(origin,name)) {
      const candidate=path.join(directory,name);
      if (!fs.existsSync(path.join(candidate,'package.json'))) continue;
      const physical=fs.realpathSync(candidate);
      if (!allowed.some(directory=>inside(physical,directory))) continue;
      const manifest=readManifest(physical);
      assert.equal(manifest.name,name,'Dependency source must match its declared package name');
      return {source:physical,manifest};
    }
    return null;
  }
  function current(name, from) {
    for (const directory of locations(from,name)) {
      const candidate=path.join(directory,name);
      if (!inside(candidate,root) || !fs.existsSync(path.join(candidate,'package.json'))) continue;
      return {target:candidate,manifest:readManifest(candidate)};
    }
    return null;
  }
  function dependency(name, range, sourceParent, targetParent, optional) {
    assert(!framework(name),'Framework peers must never become implicit consumer dependencies: '+name);
    assert(semver.validRange(range),'Packed dependency must declare a semver range: '+name+'@'+range);
    const resolved=locate(name,sourceParent);
    if (!resolved || !compatible(resolved.manifest)) {
      if (optional) {skippedOptional.push({from:readManifest(targetParent).name,name,range,reason:resolved?'platform-incompatible':'not-installed'});return;}
      throw Error('Declared packed dependency is unavailable on this platform: '+name+'@'+range);
    }
    assert(semver.satisfies(resolved.manifest.version,range),
      'Installed dependency violates the actual packed declaration: '+name+'@'+resolved.manifest.version+' does not satisfy '+range);
    const existing=current(name,targetParent);
    let target;
    if (existing?.manifest.version === resolved.manifest.version) target=existing.target;
    else {
      const hoisted=path.join(root,'node_modules',name);
      target=fs.existsSync(hoisted)?path.join(targetParent,'node_modules',name):hoisted;
      assert(!fs.existsSync(target),'Dependency placement must not overwrite a different package: '+target);
      fs.mkdirSync(path.dirname(target),{recursive:true});
      fs.cpSync(resolved.source,target,{recursive:true,dereference:true,filter:source=>path.basename(source)!=='node_modules'});
    }
    const copied=readManifest(target);
    assert.equal(copied.name,name);assert.equal(copied.version,resolved.manifest.version);
    assert(semver.satisfies(copied.version,range));
    edges.push({from:readManifest(targetParent).name,fromTarget:path.relative(root,targetParent).split(path.sep).join('/'),
      name,range,version:copied.version,optional,target:path.relative(root,target).split(path.sep).join('/')});
    visit(resolved.source,target,copied);
  }
  function visit(source,target,manifest) {
    if (installed.has(target)) return;
    installed.set(target,{name:manifest.name,version:manifest.version,target:path.relative(root,target).split(path.sep).join('/')});
    const optional=manifest.optionalDependencies || {};
    for (const [name,range] of Object.entries({...manifest.dependencies,...optional}))
      dependency(name,range,source,target,Object.hasOwn(optional,name));
  }
  for (const entry of packages) {
    const manifest=readManifest(entry.target);
    assert.equal(manifest.name,entry.name,'Only the actual extracted tarball manifest may seed dependency installation');
    visit(fs.realpathSync(entry.source),entry.target,manifest);
  }
  // Verify Node's actual closest package resolution for every declared edge.
  // A farther matching package must not hide an incompatible nested package.
  for (const edge of edges) {
    const selected=current(edge.name,path.join(root,edge.fromTarget));
    assert(selected,'Every declared edge must resolve inside the isolated consumer');
    assert.equal(path.resolve(selected.target),path.resolve(root,edge.target));
    const manifest=readManifest(path.join(root,edge.target));
    assert.equal(manifest.version,edge.version);assert(semver.satisfies(manifest.version,edge.range));
  }
  assert([...installed.values()].every(row=>!framework(row.name)));
  return {packages:[...installed.values()],edges,skippedOptional};
}
module.exports={materializePackedDependencies};
