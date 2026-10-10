#!/usr/bin/env python3
"""Read-only Git-object producer: no source execution or dependency installation."""
import argparse, base64, gzip, hashlib, io, json, pathlib, subprocess, tarfile
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
    if pin['repository']!='https://github.com/konnilabs/xtend-demos.git': raise ValueError('Wrong Demo repository')
    bindings=json.loads(policy_bytes)
    subprocess.check_call(['git','-C',str(core),'merge-base','--is-ancestor',pin['implementationCoreSha'],a.core_sha])
    c,cb=repository(core,a.core_sha); d,db=repository(demo,pin['demoSha']); h,_=repository(core,bindings['historicalCoreSha'],False)
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
