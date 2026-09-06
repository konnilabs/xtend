'use strict';
// Test transport: an actual FPM pool behind a bounded FastCGI/HTTP proxy.
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const net=require('node:net');
const {createServer}=require('node:http');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
function frame(type, data=Buffer.alloc(0)) {
  const header=Buffer.alloc(8);header[0]=1;header[1]=type;header.writeUInt16BE(1,2);header.writeUInt16BE(data.length,4);
  return Buffer.concat([header,data]);
}
function parameters(values) {
  const parts=[];
  const size=length=>{if(length<128)return Buffer.from([length]);const result=Buffer.alloc(4);result.writeUInt32BE(length+0x80000000);return result;};
  for(const [key,value] of Object.entries(values)) {const name=Buffer.from(key), data=Buffer.from(String(value));parts.push(size(name.length),size(data.length),name,data);}
  return Buffer.concat(parts);
}
async function startFpmProxy({binary,fixture,scriptFilename=path.join(fixture,'browser.php'),port=0,env={},staticAssets=false,timeoutMs=12000}) {
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'xt-fpm-'));
  const socketPath=path.join(temporary,'php.sock');
  const config=path.join(temporary,'fpm.conf');
  fs.writeFileSync(config,`[global]\nerror_log=${temporary}/error.log\ndaemonize=no\n[xtend]\nlisten=${socketPath}\nuser=${os.userInfo().username}\ngroup=${process.getgid()}\npm=static\npm.max_children=2\nclear_env=no\ncatch_workers_output=yes\nrequest_terminate_timeout=${Math.max(10,Math.ceil(timeoutMs/1000))}s\nphp_admin_value[disable_functions]=exec,shell_exec,system,passthru,proc_open,popen\nphp_admin_value[error_log]=${temporary}/php.log\nphp_admin_flag[log_errors]=on\n`);
  const child=spawn(binary,['-F','-y',config],{cwd:fixture,detached:true,stdio:['ignore','pipe','pipe'],env:{...process.env,APP_ENV:'production',...env}});
  let output='',spawnError;
  child.on('error',error=>{spawnError=error;});
  for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{output=(output+chunk).slice(-16000);});
  const connections=new Set();let requestCount=0,disposed=false;
  const server=createServer((request,response)=>{
    requestCount++;
    const pathname=new URL(request.url,'http://localhost').pathname;
    const asset=staticAssets && /\.(?:m?js|css|svg|png|webp|jpg|ico)$/u.test(pathname) || pathname==='/browser_entry.mjs' || /^\/runtime\/[a-z0-9-]+\.m?js$/u.test(pathname);
    if(asset){const publicDir=fs.realpathSync(path.join(fixture,'public'));const candidate=path.join(publicDir,pathname);if(fs.existsSync(candidate)){const file=fs.realpathSync(candidate);if(file.startsWith(publicDir+path.sep)&&fs.statSync(file).isFile()){const mime={'.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'}[path.extname(file)]||'text/javascript';response.setHeader('Content-Type',mime);response.end(fs.readFileSync(file));return;}}}
    const socket=net.connect(socketPath);connections.add(socket);
    let buffer=Buffer.alloc(0),headers=Buffer.alloc(0),headSent=false,ended=false;
    const fail=error=>{output=(output+'\n'+error.message).slice(-16000);if(!response.headersSent){response.statusCode=502;response.end('FastCGI request failed.');}else response.destroy(error);socket.destroy();};
    const timer=setTimeout(()=>fail(new Error('FastCGI proxy deadline exceeded.')),timeoutMs);
    response.once('close',()=>socket.destroy());request.once('aborted',()=>socket.destroy());
    socket.on('error',fail);
    socket.on('close',()=>{clearTimeout(timer);connections.delete(socket);if(!ended && !response.destroyed)fail(new Error('FPM closed without a terminal record.'));});
    socket.once('connect',()=>{
      socket.write(frame(1,Buffer.from([0,1,0,0,0,0,0,0])));
      const values={GATEWAY_INTERFACE:'CGI/1.1',SERVER_PROTOCOL:'HTTP/1.1',REQUEST_METHOD:request.method,REQUEST_URI:request.url,QUERY_STRING:new URL(request.url,'http://localhost').search.slice(1),SCRIPT_FILENAME:scriptFilename,SCRIPT_NAME:'/index.php',DOCUMENT_ROOT:path.join(fixture,'public'),SERVER_NAME:'127.0.0.1',SERVER_PORT:server.address().port,REMOTE_ADDR:'127.0.0.1',CONTENT_TYPE:request.headers['content-type'] || '',CONTENT_LENGTH:request.headers['content-length'] || ''};
      for(const [name,value] of Object.entries(request.headers))if(!['content-type','content-length'].includes(name))values['HTTP_'+name.toUpperCase().replace(/-/g,'_')]=Array.isArray(value)?value.join(','):value;
      socket.write(frame(4,parameters(values)));socket.write(frame(4));
      request.on('data',chunk=>{for(let offset=0;offset<chunk.length;offset+=65535)if(!socket.write(frame(5,chunk.subarray(offset,offset+65535))))request.pause();});
      socket.on('drain',()=>request.resume());request.once('end',()=>socket.write(frame(5)));
    });
    socket.on('data',chunk=>{
      buffer=Buffer.concat([buffer,chunk]);
      while(buffer.length>=8){
        const length=buffer.readUInt16BE(4),padding=buffer[6],type=buffer[1];if(buffer.length<8+length+padding)return;
        let data=buffer.subarray(8,8+length);buffer=buffer.subarray(8+length+padding);
        if(type===7){output=(output+data.toString()).slice(-16000);continue;}
        if(type===3){ended=true;if(data.length<8 || data.readUInt32BE(0)!==0 || data[4]!==0)fail(new Error('FPM returned a failed terminal record.'));else response.end();socket.end();continue;}
        if(type!==6 || !data.length)continue;
        if(!headSent){
          headers=Buffer.concat([headers,data]);const end=headers.indexOf('\r\n\r\n');
          if(end<0){if(headers.length>65536)fail(new Error('FPM response headers exceed the limit.'));continue;}
          for(const line of headers.subarray(0,end).toString().split('\r\n')){
            const split=line.indexOf(':');if(split<1)continue;const name=line.slice(0,split),value=line.slice(split+1).trim();
            if(name.toLowerCase()==='status')response.statusCode=parseInt(value,10);
            else if(name.toLowerCase()==='set-cookie')response.setHeader(name,[...(response.getHeader(name)||[]),value]);
            else response.setHeader(name,value);
          }
          data=headers.subarray(end+4);headers=Buffer.alloc(0);headSent=true;
        }
        if(data.length && !response.write(data)){socket.pause();response.once('drain',()=>socket.resume());}
      }
    });
  });
  async function dispose() {
    if(disposed)return;disposed=true;
    for(const connection of connections)connection.destroy();
    server.closeAllConnections();if(server.listening)await new Promise(resolve=>server.close(resolve));
    if(child.exitCode===null && child.signalCode===null && child.pid){
      const exited=once(child,'exit');process.kill(-child.pid,'SIGTERM');
      let timer;await Promise.race([exited,new Promise(resolve=>{timer=setTimeout(resolve,3000);})]);clearTimeout(timer);
      if(child.exitCode===null && child.signalCode===null){process.kill(-child.pid,'SIGKILL');await exited;}
    }
    fs.rmSync(temporary,{recursive:true,force:true});
  }
  try {
    const deadline=Date.now()+10000;
    while(!fs.existsSync(socketPath)){if(spawnError)throw spawnError;if(child.exitCode!==null || Date.now()>deadline)throw new Error('FPM did not start: '+output);await new Promise(resolve=>setTimeout(resolve,25));}
    server.listen(port,'127.0.0.1');await once(server,'listening');
    return {url:`http://127.0.0.1:${server.address().port}`,dispose,get output(){return output;},get requestCount(){return requestCount;}};
  }catch(error){await dispose();throw error;}
}
module.exports={startFpmProxy};
