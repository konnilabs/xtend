"""Explicit isolated Linux provisioning; official archives, pinned hashes, no retries."""
import hashlib,json,os,pathlib,platform,sys,tarfile,urllib.request

def main():
 if platform.system()!='Linux' or platform.machine()!='x86_64' or os.getuid()==0:
  raise RuntimeError('Provisioning requires unprivileged Linux x86_64')
 root=pathlib.Path(sys.argv[1])
 if not root.is_absolute():raise RuntimeError('Absolute private toolchain directory required')
 root.mkdir(mode=0o700);downloads=root/'downloads';downloads.mkdir()
 pins=json.loads(pathlib.Path(__file__).with_name('toolchain-pins.json').read_text())
 evidence={'archives':{},'files':{},'acceptedForRelease':False}
 for name,pin in pins['archives'].items():
  target=downloads/name
  with urllib.request.urlopen(pin['url'],timeout=60) as response,target.open('xb') as dest:
   while True:
    chunk=response.read(1024*1024)
    if not chunk:break
    dest.write(chunk)
  with target.open('rb') as stream:digest=hashlib.file_digest(stream,'sha256').hexdigest()
  if digest!=pin['sha256']:raise RuntimeError('Official archive SHA256 mismatch: '+name)
  evidence['archives'][name]=digest
  with tarfile.open(target) as archive:archive.extractall(root,filter='data')
 for file in sorted(root.rglob('*')):
  if file.is_file() and downloads not in file.parents:
   if not file.resolve().is_relative_to(root.resolve()):raise RuntimeError('Toolchain link escapes root')
   with file.open('rb') as stream:evidence['files'][str(file.relative_to(root))]=hashlib.file_digest(stream,'sha256').hexdigest()
 (root/'provisioning.json').write_text(json.dumps(evidence,indent=2)+'\n')
if __name__=='__main__':main()
