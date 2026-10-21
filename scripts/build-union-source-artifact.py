#!/usr/bin/env python3
"""Read-only Git-object producer: no source execution or dependency installation."""
import argparse, base64, gzip, hashlib, io, json, pathlib, subprocess, tarfile
def verify_pin_records(pin,demo_pin=None):
    import re
    if not isinstance(pin,dict) or pin.get('schema')!='xtend.product-demo-pin.v1' or pin.get('repository')!='https://github.com/konnilabs/xtend-demos.git' or not all(isinstance(pin.get(k),str) and re.fullmatch('[a-f0-9]{40}',pin[k]) for k in ('demoSha','implementationCoreSha')):
        raise ValueError('Wrong Core Demo pin schema/source')
    mode=pin.get('ownershipContract')
    if 'ownershipContract' in pin and mode!='current-pair-v1': raise ValueError('Unknown paired ownership contract')
    if mode=='current-pair-v1':
        refs=pin.get('sourceRefs',{})
        for owner,stage,sha in [('core','c1',pin['implementationCoreSha']),('demo','d1',pin['demoSha'])]:
            if not isinstance(refs,dict) or not isinstance(refs.get(owner),str) or not re.fullmatch('refs/tags/migration-source/'+owner+'-'+stage+'-[0-9]{8}-'+sha[:8],refs[owner]):
                raise ValueError('Exact named migration source ref required')
    required_api='public-product-support-candidate-v1-v2-and-private-current-pair-source-audit' if mode=='current-pair-v1' else 'public-product-support-and-candidate-integrity-v1'
    if demo_pin is not None and (not isinstance(demo_pin,dict) or demo_pin.get('schema')!='xtend.demo-candidate-source.v1' or demo_pin.get('requiredApi')!=required_api or demo_pin.get('repository')!='https://github.com/konnilabs/xtend.git' or demo_pin.get('coreSha')!=pin['implementationCoreSha']):
        raise ValueError('Wrong paired Candidate source schema/API/identity')
def git(root,*args): return subprocess.check_output(['git','-C',str(root),*args])
def repository(root,sha,all_bytes=True):
    if git(root,'rev-parse',sha+'^{commit}').decode().strip()!=sha: raise ValueError('Wrong commit identity')
    commit=git(root,'cat-file','commit',sha); rows=[]; contents={}
    batch=subprocess.Popen(['git','-C',str(root),'cat-file','--batch'],stdin=subprocess.PIPE,stdout=subprocess.PIPE)
    try:
        for raw in git(root,'ls-tree','-rz',sha).split(b'\0'):
            if not raw: continue
            meta,name=raw.split(b'\t',1); mode,kind,blob=meta.decode().split(); name=name.decode()
            if kind!='blob' or mode not in ('100644','100755'): raise ValueError('Unsupported tracked member')
            batch.stdin.write(blob.encode()+b'\n'); batch.stdin.flush(); header=batch.stdout.readline().split(); size=int(header[2]); data=batch.stdout.read(size); batch.stdout.read(1)
            rows.append(dict(path=name,mode=mode,gitBlob=blob,sha256=hashlib.sha256(data).hexdigest(),bytes=size))
            if all_bytes: contents[name]=data
    finally: batch.stdin.close(); batch.stdout.close(); batch.wait()
    return dict(sha=sha,tree=git(root,'rev-parse',sha+'^{tree}').decode().strip(),commit=base64.b64encode(commit).decode(),files=rows),contents
def verify_committed_tooling(core,expected_sha,implementation_bytes,policy_bytes):
    if git(core,'rev-parse','HEAD').decode().strip()!=expected_sha: raise ValueError('Producer checkout is not the independently expected Core SHA')
    for name,actual in [('scripts/build-union-source-artifact.py',implementation_bytes),('tools/schema-inventory/source-bindings.json',policy_bytes)]:
        committed=git(core,'show',expected_sha+':'+name)
        if actual!=committed: raise ValueError('Dirty or substituted producer tooling: '+name)
    if git(core,'status','--porcelain','--untracked-files=no').strip(): raise ValueError('Dirty committed producer checkout')
    policy_bytes=git(core,'show',expected_sha+':tools/schema-inventory/source-bindings.json')
    return policy_bytes

def main():
    p=argparse.ArgumentParser()
    for name in ('core','demo','core-sha','output','run-id','run-attempt'): p.add_argument('--'+name,required=True)
    p.add_argument('--mode',choices=('committed','proposal'),default='committed')
    a=p.parse_args(); core=pathlib.Path(a.core); demo=pathlib.Path(a.demo)
    # Committed mode authenticates both running implementation and policy against
    # the independently supplied Core object. Proposal mode makes no such claim.
    implementation=pathlib.Path(__file__).resolve()
    binding_file=implementation.parent.parent/'tools/schema-inventory/source-bindings.json'
    implementation_bytes=implementation.read_bytes(); policy_bytes=binding_file.read_bytes()
    if a.mode=='committed':
        policy_bytes=verify_committed_tooling(core,a.core_sha,implementation_bytes,policy_bytes)
    producer_mode='committed' if a.mode=='committed' else 'local-uncommitted-proposal'
    producer=dict(mode=producer_mode,implementationSha256=hashlib.sha256(implementation_bytes).hexdigest(),policySha256=hashlib.sha256(policy_bytes).hexdigest())
    # Product sources and pin always come from the exact Core head.
    pin=json.loads(git(core,'show',a.core_sha+':product-demos.lock.json'))
    verify_pin_records(pin)
    bindings=json.loads(policy_bytes)
    subprocess.check_call(['git','-C',str(core),'merge-base','--is-ancestor',pin['implementationCoreSha'],a.core_sha])
    c,cb=repository(core,a.core_sha); d,db=repository(demo,pin['demoSha']); h,_=repository(core,bindings['historicalCoreSha'],False)
    verify_pin_records(pin,json.loads(db['candidate-source.lock.json']))
    # Validate the exact compressed comparison closure against immutable original Git sources.
    archives=bindings.get('comparisonArchives',[])
    known={row['path'] for row in archives}
    if any(row['path'].startswith('migration/workflow-comparison/') and row['path'] not in known for row in d['files']): raise ValueError('Unknown workflow comparison archive')
    for archive in archives:
        data=db.get(archive['path'])
        if archive['owner']!='demo' or data is None or len(data)!=archive['bytes'] or hashlib.sha256(data).hexdigest()!=archive['sha256']:
            raise ValueError('Missing or changed workflow comparison archive')
        if hashlib.sha1(('blob '+str(len(data))+'\0').encode()+data).hexdigest()!=archive['gitBlob']: raise ValueError('Workflow archive Git blob mismatch')
        with tarfile.open(fileobj=io.BytesIO(data),mode='r:gz') as nested:
            members=nested.getmembers()
            if len(members)!=len(archive['members']) or {m.name for m in members}!={m['member'] for m in archive['members']}: raise ValueError('Unexpected workflow comparison member')
            for item in archive['members']:
                member=nested.getmember(item['member'])
                if not member.isfile() or member.mode!=0o644: raise ValueError('Invalid workflow comparison member')
                original=git(core,'show',item['originalCoreSha']+':'+item['originalSourcePath'])
                content=nested.extractfile(member).read()
                if item['originalCoreSha']!=bindings['historicalCoreSha'] or content!=original or len(content)!=item['bytes'] or hashlib.sha256(content).hexdigest()!=item['sha256'] or hashlib.sha1(('blob '+str(len(content))+'\0').encode()+content).hexdigest()!=item['gitBlob']: raise ValueError('Workflow comparison source provenance mismatch')
    context=dict(runId=a.run_id,runAttempt=a.run_attempt)
    manifest=dict(format=1,repository='konnilabs/xtend',demoRepository='konnilabs/xtend-demos',context=context,producer=producer,core=c,demo=d,historical=h)
    mb=(json.dumps(manifest,sort_keys=True,separators=(',',':'))+'\n').encode()
    output=pathlib.Path(a.output); output.mkdir(parents=True,exist_ok=False); archive=output/'sources.tar.gz'
    with archive.open('wb') as handle, gzip.GzipFile(fileobj=handle,mode='wb',mtime=0) as compressed, tarfile.open(fileobj=compressed,mode='w',format=tarfile.USTAR_FORMAT) as tar:
        def add(name,data,mode=0o644):
            entry=tarfile.TarInfo(name); entry.size=len(data); entry.mode=mode; entry.mtime=0; tar.addfile(entry,io.BytesIO(data))
        add('manifest.json',mb)
        for owner,repo,contents in [('core',c,cb),('demo',d,db)]:
            for row in repo['files']: add('current/'+owner+'/'+row['path'],contents[row['path']],int(row['mode'][3:],8))
        for binding in bindings['bindings']:
            name=binding['formerPath']; add('evidence/historical/'+name,git(core,'show',bindings['historicalCoreSha']+':'+name))
    expected=dict(producerMode=producer_mode,coreSha=a.core_sha,demoSha=pin['demoSha'],context=context,archiveSha256=hashlib.sha256(archive.read_bytes()).hexdigest(),manifestSha256=hashlib.sha256(mb).hexdigest())
    (output/'producer-receipt.json').write_text(json.dumps(expected,indent=2)+'\n'); print(json.dumps(expected))

if __name__=='__main__': main()
