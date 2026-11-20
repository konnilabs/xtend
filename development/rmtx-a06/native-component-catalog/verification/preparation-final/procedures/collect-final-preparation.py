"""Collect completed actual preparation receipts without modifying their bytes."""
import argparse, ast, hashlib, json, pathlib, re, subprocess
p = argparse.ArgumentParser()
p.add_argument('--root', default='/home/konni/Downloads/xtend-dev/xtend')
p.add_argument('--base', default='/tmp/xtend-native-catalog-v2/root')
p.add_argument('--output', default='development/rmtx-a06/native-component-catalog/verification/preparation-final')
a = p.parse_args()
root, base = pathlib.Path(a.root), pathlib.Path(a.base)
out = root / a.output
if out.exists(): raise RuntimeError('Refusing to overwrite an existing verification directory: ' + str(out))
sha = lambda data: hashlib.sha256(data).hexdigest()
commands = []
for line in (root / 'scripts/check_release_preparation.cjs').read_text().splitlines():
    m = re.match(r'^\s*(\[[^\n]+\]),?$', line)
    if m: commands.append(ast.literal_eval(m[1]))
if len(commands) != 48 or commands[22] != ['development/rmtx-a01/inspect.cjs', '--check']:
    raise RuntimeError('The reviewed 48-command scope or A01 exclusion changed')
expected = set(range(48)) - {22}
refresh_expected = {i for i,c in enumerate(commands) if c[0].startswith('development/') and c[0].endswith('inspect.cjs') and '--check' in c and not c[0].startswith('development/rmtx-a01/')}
before_path = base / 'preparation-inputs-final.json'
after_path = base / 'preparation-input-conservation-final.json'
procedures_path = base / 'preparation-procedures-final.json'
before, after, procedures = [json.loads(path.read_text()) for path in [before_path, after_path, procedures_path]]
if not after.get('unchanged') or after.get('changedBoundInputs') or after.get('newFiles'):
    raise RuntimeError('Input conservation did not pass without new inputs')
if len(before['inputs']) != after['boundInputs'] or before['baseHead'] != after['baseHead']:
    raise RuntimeError('Before/after binding disagrees')
for name, digest in procedures['procedures'].items():
    if sha((base / name).read_bytes()) != digest: raise RuntimeError('Procedure changed during execution: ' + name)
for name, digest in before['inputs'].items():
    file = root / name
    if not file.is_file() or sha(file.read_bytes()) != digest: raise RuntimeError('Bound input changed before receipt collection: ' + name)
raw_manifest, pending = [], []
def queue_copy(source, target):
    data = source.read_bytes(); pending.append((target, data)); row = {'file':target.as_posix(), 'sha256':sha(data), 'bytes':len(data)}; raw_manifest.append(row); return row

def metrics(data):
    text = data.decode('utf-8')
    patterns = {'maximumResidentSetKiB':r'Maximum resident set size \(kbytes\):\s*(\d+)', 'exitStatus':r'Exit status:\s*(\d+)', 'elapsed':r'Elapsed \(wall clock\) time \(h:mm:ss or m:ss\):\s*([^\n]+)', 'userSeconds':r'User time \(seconds\):\s*([\d.]+)', 'systemSeconds':r'System time \(seconds\):\s*([\d.]+)'}
    result = {}
    for key, pattern in patterns.items():
        found = re.search(pattern, text)
        if found: result[key] = int(found[1]) if key in ['maximumResidentSetKiB','exitStatus'] else float(found[1]) if key.endswith('Seconds') else found[1].strip()
    if result.get('exitStatus') != 0 or 'maximumResidentSetKiB' not in result: raise RuntimeError('Missing successful external resource receipt')
    return result

def test_counts(data):
    result = {}
    for key, value in re.findall(r'(?m)^(?:#|ℹ)\s+(tests|pass|fail|cancelled|skipped|todo)\s+(\d+)\s*$', data.decode('utf-8')): result[key] = int(value)
    return result or None

def normalized(command, refresh=False):
    command = ['--write' if value == '--check' else value for value in command] if refresh else list(command)
    if command[0] == '--test' and not any(value.startswith('--test-concurrency=') for value in command): command = ['--test-concurrency=1', *command]
    return command

runs = []
for mode, lane, expected_indexes in [('refresh','24',refresh_expected),('check','24',expected),('check','26',expected)]:
    directory = base / ('gates-' + mode + '-node' + lane + '-final')
    receipt_path = directory / 'receipt.json'; receipt = json.loads(receipt_path.read_text())
    indexes = [row['index'] for row in receipt]
    if len(indexes) != len(expected_indexes) or set(indexes) != expected_indexes: raise RuntimeError('Incomplete or duplicate gate receipt: ' + str(directory))
    if any(row['returncode'] != 0 for row in receipt): raise RuntimeError('Gate failure in ' + str(directory))
    label = ('refresh-node24' if mode == 'refresh' else 'node' + lane)
    copied_receipt = queue_copy(receipt_path, pathlib.Path(label) / 'receipt.json')
    checks = []
    for row in receipt:
        if row['command'] != normalized(commands[row['index']], mode == 'refresh'): raise RuntimeError('Executed command differs from bound preparation scope')
        log, time_file = pathlib.Path(row['log']), pathlib.Path(row['time'])
        if log.parent != directory or time_file.parent != directory: raise RuntimeError('Unexpected local receipt path')
        log_copy = queue_copy(log, pathlib.Path(label) / log.name)
        time_copy = queue_copy(time_file, pathlib.Path(label) / time_file.name)
        checks.append({'index':row['index'],'command':row['command'],'returncode':row['returncode'],'durationSeconds':row['duration'],'log':log_copy,'resourceReceipt':time_copy,'resources':metrics(time_file.read_bytes()),'testCounts':test_counts(log.read_bytes())})
    executable = '/home/konni/.local/share/xtend-local-llm/runtime/node_modules/node/bin/node' if lane == '24' else '/tmp/xtend-rmtx-a0642/toolchain/node_modules/node-linux-x64/bin/node'
    actual_version = subprocess.check_output([executable,'--version'],text=True).strip()
    runs.append({'mode':mode,'lane':lane,'node':actual_version,'heapLimitMiB':1024,'perCheckExternalTimeoutSeconds':240,'checkCount':len(checks),'rawReceipt':copied_receipt,'checks':checks,'maximumIndividualProcessRssKiB':max(check['resources']['maximumResidentSetKiB'] for check in checks)})

binding_files = {'before':queue_copy(before_path,pathlib.Path('inputs-before.json')),'conservation':queue_copy(after_path,pathlib.Path('input-conservation.json')),'procedures':queue_copy(procedures_path,pathlib.Path('procedures-before.json'))}
for name in procedures['procedures']: queue_copy(base / name,pathlib.Path('procedures') / name)
for name in ['refresh-final24.log','bind-before.log','check-final24.log','check-final26.log','bind-after.log']:
    queue_copy(base / name,pathlib.Path('phases') / name)
summary = {'schema':'xtend.local.release-preparation-verification.v1','baseHead':before['baseHead'],'passed':True,'acceptedForRelease':False,'ssrAcceptancePerformed':False,'scope':'27 reviewed static inspector refreshes on Node24 and 47 non-A01 preparation gates on each of Node24 and Node26; A01 is a separate governed decision.','executedNonA01Gates':sum(run['checkCount'] for run in runs if run['mode']=='check'),'excludedChecks':[{'index':22,'command':commands[22],'reason':'Explicit scope excludes governed A01 for this run.'}],'boundInputs':len(before['inputs']),'changedBoundInputs':after['changedBoundInputs'],'newInputs':after['newFiles'],'inputConservationPassed':True,'excludedGovernedFiles':before['excludedGovernedFiles'],'verificationOutputsExcluded':before['verificationOutputsExcluded'],'bindingReceipts':binding_files,'runs':runs,'rawArtifacts':raw_manifest,'resourceScope':'Individual external time-v process RSS; not an aggregated concurrent process-group or Chromium measurement.'}
# Write only after every actual receipt and source fence has passed validation.
out.mkdir(parents=True)
for name, data in pending:
    target = out / name; target.parent.mkdir(parents=True,exist_ok=True)
    with target.open('xb') as stream: stream.write(data)
with (out / 'index.json').open('x') as stream: json.dump(summary,stream,indent=2); stream.write('\n')
print(json.dumps({'passed':True,'nonA01Gates':summary['executedNonA01Gates'],'boundInputs':summary['boundInputs'],'rawArtifacts':len(raw_manifest),'output':str(out),'indexSha256':sha((out/'index.json').read_bytes())}),flush=True)
