"""Use existing official Chrome archive pins; no browser invocation or retries."""
import hashlib,json,os,pathlib,platform,stat,sys,urllib.request,zipfile

def main():
 if platform.system()!='Linux' or platform.machine()!='x86_64' or os.getuid()==0:
  raise RuntimeError('Unprivileged Linux x86_64 required')
 root=pathlib.Path(sys.argv[1]);pins=json.loads(pathlib.Path(sys.argv[2]).read_text())
 if not root.is_absolute():raise RuntimeError('Absolute private toolchain root required')
 root.mkdir(mode=0o700)
 evidence={'version':pins['version'],'archives':{},'executables':{},'acceptedForRelease':False}
 for name,expected in pins['archives'].items():
  if name not in ['chrome-linux64.zip','chromedriver-linux64.zip']:raise RuntimeError('Unexpected archive')
  target=root/name;url='https://storage.googleapis.com/chrome-for-testing-public/'+pins['version']+'/linux64/'+name
  with urllib.request.urlopen(url,timeout=60) as response,target.open('xb') as dest:
   size=0
   while True:
    b=response.read(1024*1024)
    if not b:break
    size+=len(b)
    if size>512*1024*1024:raise RuntimeError('Archive size exceeded')
    dest.write(b)
  with target.open('rb') as f:actual=hashlib.file_digest(f,'sha256').hexdigest()
  if actual!=expected:raise RuntimeError('Official archive digest mismatch')
  evidence['archives'][name]=actual
  with zipfile.ZipFile(target) as archive:
   seen=set()
   for entry in archive.infolist():
    rel=pathlib.PurePosixPath(entry.filename);mode=entry.external_attr>>16
    if rel.is_absolute() or '..' in rel.parts or entry.filename in seen or stat.S_IFMT(mode) not in (0,stat.S_IFREG,stat.S_IFDIR):raise RuntimeError('Unsafe archive entry')
    seen.add(entry.filename);dest=root/rel
    if entry.is_dir():dest.mkdir(parents=True,exist_ok=True);continue
    dest.parent.mkdir(parents=True,exist_ok=True)
    with archive.open(entry) as source,dest.open('xb') as output:
     while True:
      b=source.read(1024*1024)
      if not b:break
      output.write(b)
    dest.chmod(mode&0o777 or 0o600)
 for rel in ['chrome-linux64/chrome','chromedriver-linux64/chromedriver']:
  with (root/rel).open('rb') as f:evidence['executables'][rel]=hashlib.file_digest(f,'sha256').hexdigest()
 (root/'provisioning.json').write_text(json.dumps(evidence,indent=2)+'\n')
if __name__=='__main__':main()
