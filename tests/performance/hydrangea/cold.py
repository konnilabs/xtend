"""Isolated cold HTTP benchmark, including actual Node invocation counts."""
import argparse, json, os, pathlib, shlex, shutil, statistics, subprocess, tempfile, time, urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[3]
p = argparse.ArgumentParser()
p.add_argument('--node', default=shutil.which('node'))
p.add_argument('--samples', type=int, default=10)
p.add_argument('--output', default='/tmp/hydrangea-cold.json')
a = p.parse_args()
results = []
with tempfile.TemporaryDirectory(prefix='hydrangea-cold-') as temp:
    work = pathlib.Path(temp)
    shim = work/'bin'; shim.mkdir()
    (shim/'node').write_text('#!/bin/sh\nprintf "node\\n" >> "$HYD_PROCESS_LOG"\nexec '+shlex.quote(a.node)+' "$@"\n')
    (shim/'node').chmod(0o700)
    servers = []
    try:
        for mode, port in [('legacy',8083),('hydrangea',8082)]:
            env = dict(os.environ, PATH=str(shim)+os.pathsep+os.environ['PATH'], XTEND_RMT_JIT_MODE=mode, XTEND_RMT_JIT_CACHE_DIR=str(work/'cache'), HYD_PROCESS_LOG=str(work/(mode+'.count')))
            server = subprocess.Popen(['php','-S',f'127.0.0.1:{port}','-t',str(ROOT),str(ROOT/'docs/dev-router.php')],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            servers.append(server)
        time.sleep(.3)
        assert all(server.poll() is None for server in servers), 'Benchmark ports 8082/8083 must be free'
        for fixture, file in [('minimal','tests/rmt-language/fixtures/vnext-valid-minimal.rmt'),('customer-service','products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt')]:
            body=json.dumps({'source':(ROOT/file).read_text(),'playgroundMode':'maraca-preview'}).encode()
            expected=None
            for mode,port in [('legacy',8083),('hydrangea',8082)]:
                for trial in range(a.samples):
                    shutil.rmtree(work/'cache',ignore_errors=True)
                    counter=work/(mode+'.count');counter.write_text('')
                    before=time.perf_counter()
                    req=urllib.request.Request(f'http://127.0.0.1:{port}/docs/index.php?xtend-rmt-playground=compile',body,{'Content-Type':'application/json'})
                    with urllib.request.urlopen(req,timeout=10) as response: raw=response.read()
                    ms=(time.perf_counter()-before)*1000
                    output=json.loads(raw)
                    assert output['ok'] and output['maraca']['ok'], output.get('maraca',{}).get('diagnostics',output.get('status'))
                    if expected is None: expected=output
                    assert output==expected, fixture+': response mismatch'
                    processes=len(counter.read_text().splitlines())
                    assert processes==(1 if mode=='hydrangea' else 3),(mode,processes)
                    results.append({'fixture':fixture,'mode':mode,'trial':trial,'ms':round(ms,3),'nodeProcesses':processes,'bytes':len(raw)})
                print(json.dumps({'fixture':fixture,'mode':mode,'medianMs':statistics.median(row['ms'] for row in results if row['fixture']==fixture and row['mode']==mode)}),flush=True)
    finally:
        for server in servers:
            server.terminate()
            try:server.wait(timeout=3)
            except subprocess.TimeoutExpired:server.kill();server.wait()
pathlib.Path(a.output).write_text(json.dumps(results,indent=2)+'\n')
for fixture in ['minimal','customer-service']:
    medians={mode:statistics.median(row['ms'] for row in results if row['fixture']==fixture and row['mode']==mode) for mode in ['legacy','hydrangea']}
    assert medians['hydrangea']<=medians['legacy']*1.1,(fixture,medians)
