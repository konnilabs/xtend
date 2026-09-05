'use strict';
const assert = require('node:assert/strict');
const http = require('node:http');
const { requestJson, parseEndpoint, runFixture, availablePort } = require('../../tools/browser-hypervisor');
async function runTransportChecks(context) {
  let handler;
  const server = http.createServer((request,response)=>handler(request,response));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  const check=async(name,fn)=>{try{await fn();context.pass(name);}catch(error){context.fail(`${name}: ${error.stack}`);}};
  try {
    await check('HTTP errors, invalid JSON, aborted sessions and WebDriver error objects fail',async()=>{
      for(const response of [{code:404,body:'{}'},{code:500,body:'{}'},{code:200,body:'invalid'},{code:200,body:'{"value":{"error":"invalid session id"}}'}]){
        handler=(req,res)=>{res.writeHead(response.code);res.end(response.body);};
        await assert.rejects(requestJson({...parseEndpoint(url),deadline:Date.now()+1000},'GET','/status'));
      }
      handler=(req,res)=>{res.writeHead(200);res.write('{');res.destroy();};
      await assert.rejects(requestJson({...parseEndpoint(url),deadline:Date.now()+1000},'GET','/status'));
    });
    await check('Hanging response is bounded by the absolute fixture deadline',async()=>{
      handler=()=>{};const started=Date.now();
      await assert.rejects(requestJson({...parseEndpoint(url),deadline:started+80},'GET','/status'),/deadline/);
      assert(Date.now()-started<1500);
    });
    await check('Occupied local ports are rejected before spawning a driver',async()=>{
      await assert.rejects(availablePort(server.address().port),{code:'EADDRINUSE'});
      assert((await availablePort())>0);
    });
    await check('Primary and cleanup failures survive together; external endpoints remain alive',async()=>{
      handler=(req,res)=>{
        res.setHeader('Content-Type','application/json');
        if(req.url==='/status')res.end('{"value":{"ready":true}}');
        else if(req.url==='/session')res.end('{"value":{"sessionId":"fixture"}}');
        else if(req.method==='DELETE'){res.writeHead(500);res.end('{"value":{"error":"cleanup failed"}}');}
        else {res.writeHead(404);res.end('{"value":{"error":"navigation failed"}}');}
      };
      await assert.rejects(runFixture({engine:'chromium',webDriverUrl:url,url:'http://fixture.invalid/',resultKey:'test',timeoutMs:500,cleanupTimeoutMs:100}),error=>error instanceof AggregateError&&error.errors.length===2&&/navigation failed/.test(error.message)&&/cleanup failed/.test(error.message));
      assert.equal((await requestJson(parseEndpoint(url),'GET','/status')).statusCode,200);
    });
    await check('Navigation and cleanup each obey their bounded budget',async()=>{
      handler=(req,res)=>{
        if(req.url==='/status')res.end('{"value":{"ready":true}}');
        else if(req.url==='/session')res.end('{"value":{"sessionId":"fixture"}}');
      };
      const started=Date.now();
      await assert.rejects(runFixture({engine:'chromium',webDriverUrl:url,url:'http://fixture.invalid/',resultKey:'test',timeoutMs:100,cleanupTimeoutMs:100}),AggregateError);
      assert(Date.now()-started<1500);
    });
  } finally { server.closeAllConnections();await new Promise(resolve=>server.close(resolve)); }
}
module.exports={runTransportChecks};
