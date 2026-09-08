"""HTTP acceptance benchmark. Every request starts a fresh Node bridge process."""
import argparse, json, math, pathlib, statistics, subprocess, time, urllib.request, tempfile
ROOT = pathlib.Path(__file__).resolve().parents[3]
parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:8081')
parser.add_argument('--legacy-url', default='http://127.0.0.1:8080')
parser.add_argument('--samples', type=int, default=30)
parser.add_argument('--output', default='/tmp/hydrangea-benchmark.json')
args = parser.parse_args()
fixtures = {'minimal': 'tests/rmt-language/fixtures/vnext-valid-minimal.rmt', 'customer-service': 'products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt'}
results = []
for name, file in fixtures.items():
    source = (ROOT/file).read_text()
    body = json.dumps({'source': source, 'locale': 'de', 'playgroundMode': 'maraca-preview'}).encode()
    def request(base):
        started = time.perf_counter()
        req = urllib.request.Request(base + '/docs/index.php?xtend-rmt-playground=compile', body, {'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=15) as response: raw = response.read()
        return json.loads(raw), (time.perf_counter()-started)*1000, len(raw)
    expected, _, _ = request(args.legacy_url)
    warmup, _, _ = request(args.url)
    assert warmup == expected, name + ': HTTP response differs'
    samples = []
    for trial in range(args.samples):
        output, ms, size = request(args.url)
        assert output == expected, name + ': HTTP contract differs'
        samples.append(ms)
        results.append({'fixture':name,'trial':trial,'ms':round(ms,3),'bytes':size,'ok':output['ok'],'maracaOk':output.get('maraca',{}).get('ok')})
    median = statistics.median(samples)
    p95 = sorted(samples)[math.ceil(len(samples)*.95)-1]
    print(json.dumps({'fixture':name,'medianMs':round(median,2),'p95Ms':round(p95,2),'samples':len(samples)}),flush=True)
pathlib.Path(args.output).write_text(json.dumps(results,indent=2)+'\n')
for name in fixtures:
    values = sorted(row['ms'] for row in results if row['fixture']==name)
    assert statistics.median(values) <= (250 if name=='minimal' else 500), name + ': median budget exceeded'
    assert values[math.ceil(len(values)*.95)-1] <= 1000, name + ': p95 budget exceeded'
