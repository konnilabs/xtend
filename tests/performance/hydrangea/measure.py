import json, pathlib, statistics, subprocess, time, urllib.request
root = pathlib.Path(__file__).resolve().parents[3]
node = 'node'
pathlib.Path('/tmp/xtend-rmt-performance').mkdir(exist_ok=True)
fixtures = {'minimal': root/'tests/rmt-language/fixtures/vnext-valid-minimal.rmt', 'customer-service': root/'products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt'}
results = []
for name, file in fixtures.items():
    source = file.read_text()
    for operation in ['language-diagnostics', 'compile']:
        for trial in range(3):
            payload = {'source':source, 'locale':'de', 'playgroundMode':'maraca-preview', 'maraca':dict.fromkeys(['orchestration','kernel','hydration','validation','transitions'],'auto')}
            url = 'http://127.0.0.1:8080/docs/index.php?xtend-rmt-playground=' + ('diagnostics' if operation=='language-diagnostics' else 'compile')
            request = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={'Content-Type':'application/json'})
            start=time.perf_counter()
            with urllib.request.urlopen(request, timeout=30) as response:
                raw=response.read()
            elapsed=(time.perf_counter()-start)*1000
            output=json.loads(raw)
            entry={'fixture':name,'layer':'HTTP','operation':operation,'trial':trial,'sourceBytes':len(source.encode()),'ms':round(elapsed,2),'bytes':len(raw),'ok':output.get('ok'),'status':output.get('status'),'maracaOk':(output.get('maraca') or {}).get('ok')}
            results.append(entry)
            print(json.dumps(entry),flush=True)
            if trial==0: pathlib.Path(f'/tmp/xtend-rmt-performance/{name}-{operation}-http.json').write_bytes(raw)
    core = None
    for operation in ['compile','language-diagnostics','safe-preview','maraca-plan']:
        for trial in range(3):
            payload={'source':source,'filePath':'docs/rmt-playground-source.rmt'}
            if operation=='safe-preview': payload={'coreDocument':core, 'options':{'componentRegistry':json.loads((root/'components/manifest.json').read_text())},'project':{'baseUrl':'https://xtend.invalid/'}}
            if operation=='maraca-plan': payload['options']={'profile':'debug','lazy':'component','css':'external','stack':'runtime','components':'document',**dict.fromkeys(['orchestration','kernel','hydration','validation','transitions'],'auto')}
            envelope={'operation':operation,'payload':payload}
            start=time.perf_counter()
            run=subprocess.run([node,'tools/tooling-bridge-cli.js'],cwd=root,input=json.dumps(envelope),capture_output=True,text=True,timeout=30)
            elapsed=(time.perf_counter()-start)*1000
            output=json.loads(run.stdout)
            if operation=='compile': core=output['result'].get('coreDocument')
            entry={'fixture':name,'layer':'CLI','operation':operation,'trial':trial,'ms':round(elapsed,2),'inputBytes':len(json.dumps(envelope).encode()),'bytes':len(run.stdout.encode()),'ok':output.get('ok'),'status':output.get('status')}
            results.append(entry)
            print(json.dumps(entry),flush=True)
            if trial==0: pathlib.Path(f'/tmp/xtend-rmt-performance/{name}-{operation}-cli.json').write_text(run.stdout)
pathlib.Path('/tmp/xtend-rmt-performance/baseline.json').write_text(json.dumps(results,indent=2))
print('MEDIANS',flush=True)
for name in fixtures:
    for layer in ['HTTP','CLI']:
        for operation in sorted({r['operation'] for r in results if r['fixture']==name and r['layer']==layer}):
            entries=[r for r in results if r['fixture']==name and r['layer']==layer and r['operation']==operation]
            print(name,layer,operation,statistics.median(r['ms'] for r in entries), 'ms',flush=True)
