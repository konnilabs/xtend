'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),http=require('node:http');
const {spawn,execFileSync}=require('node:child_process');
const {availablePort,requestJson,parseEndpoint}=require('../../../tools/browser-hypervisor');
const {run}=require('./adapter.cjs');
const {start}=require('./fixture-server.cjs');
const {exercise}=require('./qualification.cjs');
const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function diagnosticDriverLog(text){
  // Driver output can include complete launch argv, preferences and page data.
  // Keep only explicitly bounded lifecycle/sandbox messages, never raw output.
  const lines=text.split(/\r?\n/),kept=[];let omitted=0;
  for(const line of lines){
    if(/^\[\d+\] Sandbox: CanCreateUserNamespace\(\) (?:unshare\(CLONE_NEWPID\)|clone\(\) failure): [A-Z0-9]+$/.test(line) ||
      /^\d+\s+(?:Marionette|geckodriver)\s+INFO\s+(?:Listening on (?:port |127\.0\.0\.1:)?\d+|Stopped listening on port \d+)$/.test(line))kept.push(line);
    else if(line)omitted++;
  }
  return kept.join('\n')+'\n[unclassified driver lines omitted: '+omitted+']\n';
}
async function main(args=process.argv.slice(2)){
  if(!['darwin','linux'].includes(process.platform) || process.getuid()===0 || !path.isAbsolute(args[0]||''))throw Error('Explicit private output directory and unprivileged supported OS required');
  const out=path.resolve(args[0]),toolchain=fs.realpathSync(args[1]||'/tmp/xtend-firefox-toolchain-20261021');
  fs.mkdirSync(out,{recursive:false,mode:0o700});
  const dirs=Object.fromEntries(['tmp','profiles','app-data','local-app-data'].map(name=>{const p=path.join(out,name);fs.mkdirSync(p,{mode:0o700});return [name,p];}));
  const mac=process.platform==='darwin',bundle=path.join(toolchain,'Firefox.app');
  const binary=mac ? bundle+'/Contents/MacOS/firefox' : toolchain+'/firefox/firefox';
  const driver=mac ? toolchain+'/bin/geckodriver' : toolchain+'/geckodriver';
  let observer,launch,owned,server,foreign,closed=false,driverOutput='',report={status:'failed',acceptedForRelease:false};
  const started=performance.now();
  try {
    if(mac){
      execFileSync('/usr/bin/codesign',['--verify','--deep','--strict',bundle],{stdio:'pipe'});
      execFileSync('/usr/sbin/spctl',['--assess','--type','execute',bundle],{stdio:'pipe'});
      execFileSync('/usr/bin/codesign',['--verify','--strict','-R=notarized','--check-notarization',driver],{stdio:'pipe'});
    }else{
      const manifest=JSON.parse(fs.readFileSync(toolchain+'/provisioning.json','utf8'));
      const pins=require('./toolchain-pins.json');
      for(const [name,pin] of Object.entries(pins.archives))if(manifest.archives[name]!==pin.sha256 || digest(toolchain+'/downloads/'+name)!==pin.sha256)throw Error('Archive pin mismatch');
      for(const [relative,hash] of Object.entries(manifest.files)){
        const file=path.resolve(toolchain,relative);if(!file.startsWith(toolchain+'/') || digest(file)!==hash)throw Error('Installed toolchain changed');
      }
      if(!manifest.files['firefox/firefox'] || !manifest.files.geckodriver)throw Error('Incomplete toolchain manifest');
    }
    server=await start();foreign=http.createServer((_q,r)=>{r.writeHead(200,{'content-type':'image/svg+xml'});r.end('<svg xmlns="http://www.w3.org/2000/svg"/>');});
    await new Promise((r,j)=>{foreign.once('error',j);foreign.listen(0,'127.0.0.1',r);});
    const port=await availablePort(),driverArgs=['--host','127.0.0.1','--port',String(port),'--profile-root',dirs.profiles,'--log','info'];
    const options={stdio:['ignore','pipe','pipe'],env:{PATH:'/usr/bin:/bin:/usr/sbin:/sbin',TMPDIR:dirs.tmp,LANG:'en_US.UTF-8',MOZ_APP_DATA:dirs['app-data'],MOZ_LOCAL_APP_DATA:dirs['local-app-data']}};
    if(mac){launch=spawn(driver,driverArgs,{...options,detached:true});observer=require('./mac-owner.cjs').createMacObserver({launch,bundle,binary,driver,profileRoot:dirs.profiles});}
    else{owned=require('../../security/owned-browser-process.cjs').spawnOwned(driver,driverArgs,options,{diagnostics:true});launch=owned.child;observer=require('./linux-observer.cjs').createLinuxObserver({owned,binary,driver,profileRoot:dirs.profiles});}
    launch.once('close',()=>{closed=true;});
    for(const stream of [launch.stdout,launch.stderr])stream.on('data',chunk=>{driverOutput+=chunk;});
    await observer.initialize();
    const endpointUrl=`http://127.0.0.1:${port}`,endpoint=parseEndpoint(endpointUrl),until=Date.now()+10000;
    let ready=false;
    while(Date.now()<until && !closed){try{await requestJson({...endpoint,deadline:Date.now()+500},'GET','/status');ready=true;break;}catch(_){await delay(50);}}
    if(!ready)throw Error('Driver startup deadline exceeded');
    report=await run({engine:'firefox',binary,version:'158.0.1',endpointUrl,probeUrl:server.origin+'/__neutral/preflight',
      fixtureUrl:server.origin+'/__neutral/security',resultKey:'__xtendNeutralSecurity',timeoutMs:180000,cleanupMs:10000,
      owner:observer.owner,sandbox:observer.sandbox,exercise:exercise(server.origin,`http://127.0.0.1:${foreign.address().port}`),
      required:['dom','customElements','shadowDom','trustedTypes','trustedTypesEnforced','policyAllowlistEnforced'],
      assertions:{idField:'label',verdictField:'passed',expectedChecks:['maintained sanitizer, TrustedHTML sink and SSR reparse assertions']}});
    report.browserSha256=digest(binary);report.driverSha256=digest(driver);
    report.driverVersion=execFileSync(driver,['--version'],{encoding:'utf8',timeout:5000}).split('\n')[0];
  }catch(error){report.error=error.stack;report.status='failed';}
  finally {
    try{if(observer && !report.phases?.groupCleanup)report.cleanup=await observer.owner.stop();}
    catch(error){report.cleanup=error.cleanup||null;report.cleanupError=error.message;report.status='failed';}
    if(launch && !observer && !closed){launch.kill('SIGTERM');await delay(250);if(!closed)report.cleanupError='Direct driver child not reaped';}
    if(server)await server.stop();
    if(foreign){foreign.closeAllConnections();await new Promise(r=>foreign.close(r));}
    Object.assign(report,{node:process.version,platform:process.platform,arch:process.arch,durationMs:performance.now()-started,
      evidenceKind:'real-firefox-'+process.platform+'-qualification',acceptedForRelease:false,linuxExecution:mac?'not-provided':'observed'});
    const sources={};for(const file of fs.readdirSync(__dirname).filter(n=>/\.(cjs|py|json)$/.test(n)))sources[file]=digest(path.join(__dirname,file));
    report.sourceDigests=sources;
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
    fs.writeFileSync(path.join(out,'process-observations.json'),JSON.stringify(observer?.snapshots||[],null,2)+'\n');
    fs.writeFileSync(path.join(out,'proc-events.json'),JSON.stringify(observer?.procEvents||[],null,2)+'\n');
    fs.writeFileSync(path.join(out,'ownership-observations.json'),JSON.stringify(owned?.observations||[],null,2)+'\n');
    fs.writeFileSync(path.join(out,'driver.log'),diagnosticDriverLog(driverOutput));
    console.log(JSON.stringify({status:report.status,node:report.node,phases:report.phases,cases:report.qualification?.cases,
      qualificationError:report.qualification?.error,cleanup:report.cleanup,error:report.error,report:path.join(out,'report.json')}));
    if(report.status!=='passed')process.exitCode=1;
  }
  return report;
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={main,diagnosticDriverLog};
