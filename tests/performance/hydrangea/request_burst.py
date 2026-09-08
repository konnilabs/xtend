import concurrent.futures,json,pathlib,time,urllib.request
source=(pathlib.Path(__file__).resolve().parents[3]/'tests/rmt-language/fixtures/vnext-valid-minimal.rmt').read_text()
started=time.perf_counter()
def call(job):
    operation,offset=job
    wait=offset-(time.perf_counter()-started)
    if wait>0: time.sleep(wait)
    request=urllib.request.Request('http://127.0.0.1:8080/docs/index.php?xtend-rmt-playground='+operation,data=json.dumps({'source':source,'playgroundMode':'maraca-preview'}).encode(),headers={'Content-Type':'application/json'})
    before=time.perf_counter()
    with urllib.request.urlopen(request,timeout=20) as response: raw=response.read()
    after=time.perf_counter()
    return {'operation':operation,'sentMs':round((before-started)*1000,1),'responseMs':round((after-before)*1000,1),'finishedMs':round((after-started)*1000,1),'ok':json.loads(raw).get('ok')}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    result=list(pool.map(call,[('compile',0),('diagnostics',.16),('compile',.3),('compile',.65)]))
pathlib.Path('/tmp/xtend-rmt-performance/queue.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
