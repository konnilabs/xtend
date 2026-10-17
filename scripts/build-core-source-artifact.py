#!/usr/bin/env python3
"""Private single-repository Git-object transport; never executes Core source."""
import argparse, base64, gzip, hashlib, io, json, pathlib, re, subprocess, tarfile
PROFILE = 'xtend.npm.core-only.v1'
def git(root, *args):
    return subprocess.check_output(['git', '-C', str(root), *args])
def main():
    p = argparse.ArgumentParser()
    for name in ('core', 'core-sha', 'output', 'run-id', 'run-attempt'):
        p.add_argument('--'+name, required=True)
    a = p.parse_args(); root = pathlib.Path(a.core)
    if not re.fullmatch('[a-f0-9]{40}', a.core_sha) or any(not re.fullmatch('[1-9][0-9]*', n) for n in (a.run_id,a.run_attempt)):
        raise ValueError('Exact Core/run/attempt required')
    if git(root,'rev-parse','HEAD').decode().strip()!=a.core_sha or git(root,'status','--porcelain','--untracked-files=no').strip():
        raise ValueError('Core source producer requires clean exact checkout')
    implementation = pathlib.Path(__file__).resolve().read_bytes()
    policy = (root/'scripts/release/core-projection-policy.json').read_bytes()
    if implementation!=git(root,'show',a.core_sha+':scripts/build-core-source-artifact.py') or policy!=git(root,'show',a.core_sha+':scripts/release/core-projection-policy.json'):
        raise ValueError('Dirty/substituted Core producer tooling or policy')
    rows=[]; contents={}
    batch=subprocess.Popen(['git','-C',str(root),'cat-file','--batch'],stdin=subprocess.PIPE,stdout=subprocess.PIPE)
    try:
        for raw in git(root,'ls-tree','-rz',a.core_sha).split(b'\0'):
            if not raw: continue
            meta,name=raw.split(b'\t',1); mode,kind,blob=meta.decode().split(); name=name.decode()
            if kind!='blob' or mode not in ('100644','100755'): raise ValueError('Unsupported tracked Core member')
            batch.stdin.write(blob.encode()+b'\n'); batch.stdin.flush(); header=batch.stdout.readline().split()
            if len(header)!=3 or header[0].decode()!=blob or header[1]!=b'blob': raise ValueError('Wrong Core Git member')
            size=int(header[2]); data=batch.stdout.read(size)
            if len(data)!=size or batch.stdout.read(1)!=b'\n': raise ValueError('Truncated Core Git member')
            rows.append(dict(path=name,mode=mode,gitBlob=blob,sha256=hashlib.sha256(data).hexdigest(),bytes=size));contents[name]=data
    finally:
        batch.stdin.close();batch.stdout.close();batch.wait()
    core=dict(sha=a.core_sha,tree=git(root,'rev-parse',a.core_sha+'^{tree}').decode().strip(),
              commit=base64.b64encode(git(root,'cat-file','commit',a.core_sha)).decode(),files=rows)
    context=dict(runId=a.run_id,runAttempt=a.run_attempt)
    producer=dict(mode='committed',implementationSha256=hashlib.sha256(implementation).hexdigest(),policySha256=hashlib.sha256(policy).hexdigest())
    manifest=dict(format=2,profile=PROFILE,repository='konnilabs/xtend',context=context,producer=producer,core=core)
    mb=(json.dumps(manifest,sort_keys=True,separators=(',',':'))+'\n').encode()
    output=pathlib.Path(a.output);output.mkdir(parents=True,exist_ok=False);archive=output/'sources.tar.gz'
    with archive.open('xb') as handle,gzip.GzipFile(fileobj=handle,mode='wb',mtime=0) as compressed,tarfile.open(fileobj=compressed,mode='w',format=tarfile.USTAR_FORMAT) as tar:
        def add(name,data,mode=0o644):
            item=tarfile.TarInfo(name);item.size=len(data);item.mode=mode;item.mtime=0;tar.addfile(item,io.BytesIO(data))
        add('manifest.json',mb)
        for row in rows:add('current/core/'+row['path'],contents[row['path']],int(row['mode'][3:],8))
    expected=dict(profile=PROFILE,producerMode='committed',sourceSha=a.core_sha,context=context,
                  archiveSha256=hashlib.sha256(archive.read_bytes()).hexdigest(),manifestSha256=hashlib.sha256(mb).hexdigest())
    (output/'producer-receipt.json').write_text(json.dumps(expected,indent=2)+'\n');print(json.dumps(expected))
if __name__=='__main__':main()
