'use strict';
// Private test launcher. No fallback binary, custom argv, privileged setup or
// sandbox-disabling mode. Missing host capability is a failed required test.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {spawnBrowser}=require('./owned-browser-process.cjs');
const pin=Object.freeze({version:'151.0.7922.173',archives:Object.freeze({
  'chrome-linux64.zip':'01d5eca46f9f055fb7d14b9be3dd458344edd57666960d85310d9b474fc77b84',
  'chromedriver-linux64.zip':'e1aa107cfad6d4fc5963551863b9cdc069c2b881d8409823b44f3ef08563ee35'
})});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function check(ok,message){if(!ok)throw Error(message);}
function status(pid){
  check(Number.isSafeInteger(pid)&&pid>0,'Exact Linux process identity required');
  const text=fs.readFileSync('/proc/'+pid+'/status','utf8');
  const field=name=>{const match=new RegExp('^'+name+':\\s+(.+)$','m').exec(text);check(match,'Missing Linux process '+name);return match[1].trim();};
  return {pid,uids:field('Uid').split(/\s+/).map(Number),gids:field('Gid').split(/\s+/).map(Number),
    parent:Number(field('PPid')),capEff:field('CapEff'),noNewPrivs:field('NoNewPrivs'),seccomp:field('Seccomp')};
}
function unprivileged(record,uid,gid){
  check(record.uids.length===4&&record.uids.every(value=>value===uid&&value>0)&&
    record.gids.length===4&&record.gids.every(value=>value===gid&&value>0)&&
    /^[0]+$/.test(record.capEff),'Browser/renderer must be unprivileged with no effective capabilities');
}
function regular(file){
  check(typeof file==='string'&&path.isAbsolute(file)&&fs.realpathSync(file)===file,'Configured browser/archive must be an exact absolute real path');
  const stat=fs.lstatSync(file);check(stat.isFile()&&!(stat.mode&0o6022),'Browser/archive links, privilege bits or group/world writes forbidden');
  return stat;
}
function configuredBrowser(env=process.env){
  check(process.platform==='linux'&&process.arch==='x64'&&typeof process.getuid==='function'&&
    process.getuid()>0&&process.geteuid()===process.getuid()&&process.getgid()>0&&process.getegid()===process.getgid(),
    'Configured Core browser requires unprivileged Linux x64; root launch is forbidden');
  const uid=process.getuid(),gid=process.getgid();unprivileged(status(process.pid),uid,gid);
  for(const name of ['CHROME_DEVEL_SANDBOX','CHROME_FLAGS','CHROMIUM_FLAGS','CHROME_EXTRA_FLAGS','CHROMIUM_ARGS',
    'LD_PRELOAD','LD_LIBRARY_PATH','LD_AUDIT'])check(!env[name],'Unsupported browser launch override: '+name);
  const binary=env.CHROMIUM_PATH,archive=env.XTEND_SECURITY_BROWSER_ARCHIVE;
  const binaryStat=regular(binary);regular(archive);
  check(binaryStat.mode&0o111,'Configured browser is not executable');
  check(path.basename(archive)==='chrome-linux64.zip'&&binary===path.join(path.dirname(archive),'chrome-linux64/chrome'),
    'Configured browser must come from the pinned official archive');
  check(fs.statSync(archive).size<=512*1024*1024&&hash(fs.readFileSync(archive))===pin.archives['chrome-linux64.zip'],
    'Configured official browser archive digest mismatch');
  // Hash the actual archive member, not a self-declared installed-binary hash.
  const expected=JSON.parse(execFileSync('python3',['-c',`import zipfile,hashlib,json,sys,stat
z=zipfile.ZipFile(sys.argv[1]); entries=[i for i in z.infolist() if i.filename=='chrome-linux64/chrome']
if len(entries)!=1 or entries[0].is_dir() or stat.S_IFMT(entries[0].external_attr>>16) not in (0,stat.S_IFREG): raise ValueError('Invalid official browser member')
h=hashlib.sha256()
with z.open(entries[0]) as f:
 while True:
  b=f.read(1024*1024)
  if not b: break
  h.update(b)
print(json.dumps({'sha256':h.hexdigest(),'size':entries[0].file_size}))`,archive],
    {encoding:'utf8',timeout:30000,maxBuffer:32768}));
  check(binaryStat.size===expected.size&&hash(fs.readFileSync(binary))===expected.sha256,'Installed browser differs from verified archive bytes');
  return {binary,sha256:expected.sha256,size:expected.size,version:pin.version,
    archiveSha256:pin.archives['chrome-linux64.zip'],uid,gid};
}
function browserArguments(profile){
  check(typeof profile==='string'&&path.isAbsolute(profile),'Exact absolute browser profile required');
  return [`--user-data-dir=${profile}`,'--headless=new','--disable-dev-shm-usage','--disable-gpu',
    '--disable-background-networking','--disable-component-update','--disable-default-apps','--disable-sync','--no-first-run',
    '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','about:blank'];
}
function launchSandboxedBrowser(profile){
  const identity=configuredBrowser();
  check(path.isAbsolute(profile)&&fs.realpathSync(profile)===profile&&fs.lstatSync(profile).isDirectory()&&
    (fs.statSync(profile).mode&0o777)===0o700,'Private real browser profile directory required');
  const argv=browserArguments(profile);
  const owned=spawnBrowser(identity.binary,argv);
  return {...owned,identity,argv};
}
function descendant(pid,browserPid){
  const seen=new Set();
  for(let count=0;count<64;count++){
    if(pid===browserPid)return true;
    if(pid<=1||seen.has(pid))return false;
    seen.add(pid);pid=status(pid).parent;
  }
  return false;
}
async function verifySandbox(command,child,identity){
  const version=await command('Browser.getVersion');
  check(version.product==='Chrome/'+pin.version,'Actual browser version differs from committed pin');
  unprivileged(status(child.pid),identity.uid,identity.gid);
  check(fs.realpathSync('/proc/'+child.pid+'/exe')===identity.binary&&
    hash(fs.readFileSync('/proc/'+child.pid+'/exe'))===identity.sha256,'Running browser executable differs from verified archive');
  const {targetId}=await command('Target.createTarget',{url:'chrome://sandbox'});
  let rows;
  try{
    const {sessionId}=await command('Target.attachToTarget',{targetId,flatten:true});
    const deadline=Date.now()+10000;
    while(Date.now()<deadline){
      const value=await command('Runtime.evaluate',{expression:"JSON.stringify(Array.from(document.querySelectorAll('tr')).map(row=>Array.from(row.querySelectorAll('td')).map(cell=>cell.textContent.trim())).filter(row=>row.length===2))",returnByValue:true},sessionId);
      if(typeof value.result?.value==='string'){rows=JSON.parse(value.result.value);if(rows.length)break;}
      await new Promise(resolve=>setTimeout(resolve,50));
    }
    check(Array.isArray(rows)&&rows.every(row=>Array.isArray(row)&&row.length===2&&row.every(cell=>typeof cell==='string')),
      'Actual Chromium sandbox status unavailable');
    const yes=name=>rows.filter(row=>row[0]===name).length===1&&rows.find(row=>row[0]===name)[1]==='Yes';
    check(yes('PID namespaces')&&yes('Network namespaces')&&yes('Seccomp-BPF sandbox'),
      'Configured browser has no verified namespace/seccomp sandbox');
  }finally{await command('Target.closeTarget',{targetId});}
  const {processInfo}=await command('SystemInfo.getProcessInfo');
  check(Array.isArray(processInfo),'Actual browser process list unavailable');
  const rendererRows=processInfo.filter(row=>row.type==='renderer');
  check(rendererRows.length>0&&rendererRows.length<=64,'Actual sandboxed renderer proof required');
  const namespaces=pid=>({pid:fs.readlinkSync('/proc/'+pid+'/ns/pid'),net:fs.readlinkSync('/proc/'+pid+'/ns/net')});
  const browserNamespaces=namespaces(child.pid),renderers=[];
  for(const row of rendererRows){
    check(Number.isSafeInteger(row.id)&&descendant(row.id,child.pid),'Renderer not owned by launched browser');
    const record=status(row.id);unprivileged(record,identity.uid,identity.gid);
    const actual=namespaces(row.id);
    check(record.noNewPrivs==='1'&&record.seccomp==='2'&&actual.pid!==browserNamespaces.pid&&actual.net!==browserNamespaces.net,
      'Actual renderer namespace/no-new-privileges/seccomp proof failed');
    renderers.push({...record,namespaces:actual});
  }
  return {browser:identity,browserPid:child.pid,browserNamespaces,sandboxRows:rows,renderers};
}
module.exports={pin,configuredBrowser,browserArguments,launchSandboxedBrowser,verifySandbox};
