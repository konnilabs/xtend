'use strict';
// W3C BiDi, using Node's supported WebSocket. No CDP or privileged chrome realm.
function endpoint(value, sessionId) {
  const url=new URL(value);
  if(url.protocol!=='ws:' || url.hostname!=='127.0.0.1' || !url.port || url.username || url.password || url.search || url.hash ||
    url.pathname!==`/session/${sessionId}`)throw Error('BiDi endpoint must identify the owned session on IPv4 loopback');
  return url.href;
}
async function connect(value,sessionId,owner,timeoutMs=5000,Socket=WebSocket) {
  owner.assertCurrent();
  const socket=new Socket(endpoint(value,sessionId)),pending=new Map();
  let sequence=0,closed=false,fault;
  const fail=error=>{fault=error;for(const row of pending.values()){clearTimeout(row.timer);row.reject(error);}pending.clear();};
  socket.addEventListener('close',()=>{closed=true;fail(Error('BiDi connection closed'));});
  socket.addEventListener('error',()=>fail(Error('BiDi connection error')));
  socket.addEventListener('message',event=>{
    try {
      if(typeof event.data!=='string' || event.data.length>2*1024*1024)throw Error('Invalid or oversized BiDi message');
      const message=JSON.parse(event.data);
      if(message.type==='event')return;
      const row=pending.get(message.id);
      if(!row)throw Error('Unexpected BiDi response identity');
      owner.assertCurrent();pending.delete(message.id);clearTimeout(row.timer);
      if(message.type==='success')row.resolve(message.result);
      else if(message.type==='error')row.reject(Error(`BiDi ${row.method}: ${message.error}: ${message.message}`));
      else row.reject(Error('Malformed BiDi response'));
    } catch(error){fail(error);}
  });
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{socket.close();reject(Error('BiDi connection deadline exceeded'));},timeoutMs);
    socket.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});
    socket.addEventListener('error',()=>{clearTimeout(timer);reject(Error('BiDi connect failed'));},{once:true});
    socket.addEventListener('close',()=>{clearTimeout(timer);reject(Error('BiDi closed during connect'));},{once:true});
  });
  try{owner.assertCurrent();}catch(error){socket.close();throw error;}
  return {
    async command(method,params={}) {
      owner.assertCurrent();if(fault || closed)throw fault || Error('BiDi closed');
      const id=++sequence;
      return new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>{pending.delete(id);const e=Error(`BiDi ${method} deadline exceeded`);reject(e);fail(e);},timeoutMs);
        pending.set(id,{resolve,reject,timer,method});
        try{socket.send(JSON.stringify({id,method,params}));}catch(error){fail(error);}
      });
    },
    async close(){
      if(pending.size)throw Error('BiDi cleanup has pending commands');
      if(closed)throw Error('BiDi closed before requested cleanup');
      await new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>reject(Error('BiDi close deadline exceeded')),timeoutMs);
        socket.addEventListener('close',()=>{clearTimeout(timer);resolve();},{once:true});socket.close();
      });
      return {status:'passed',closed:true};
    }
  };
}
module.exports={endpoint,connect};
