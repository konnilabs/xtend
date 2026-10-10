"""Controlled comparison-archive negatives; never delivery policy or accepted data."""
import pathlib,sys,json,tarfile,gzip,io,base64,hashlib
# Reuse the established test fixture Git/tree construction, not another source extractor.
helper=pathlib.Path(__file__).with_name('union_artifact_mutation.py').read_text().split('first=next(',1)[0]
exec(helper)
archive_path='migration/workflow-comparison/workflows.tar.gz';key='current/demo/'+archive_path
if mutation=='live-workflow-missing':
 path='.github/workflows/xtend-nightly-build.yml'
 del members['current/core/'+path]
 manifest['core']['files'][:]=[row for row in manifest['core']['files'] if row['path']!=path]
 # The unchanged add_current(pin) below rebuilds the actual missing-file tree/identity.
elif mutation=='archive-missing':del members[key]
elif mutation=='archive-tamper':members[key]=(members[key][0],members[key][1]+b'bad')
elif mutation=='unknown-archive':
 add_current('migration/workflow-comparison/unknown.tar.gz',b'unknown','demo')
elif mutation in ('member-tamper','member-missing','member-extra','provenance'):
 policy=json.loads(members['current/core/tools/schema-inventory/source-bindings.json'][1]);descriptor=policy['comparisonArchives'][0]
 if mutation=='provenance':descriptor['members'][0]['originalCoreSha']='0'*40
 else:
  data={}
  with tarfile.open(fileobj=io.BytesIO(members[key][1]),mode='r:gz') as t:
   for item in t:data[item.name]=t.extractfile(item).read()
  name=descriptor['members'][0]['member']
  if mutation=='member-tamper':data[name]+=b'bad'
  elif mutation=='member-missing':del data[name]
  else:data['unrecognized.yml']=b'unknown'
  raw=io.BytesIO()
  with tarfile.open(fileobj=raw,mode='w',format=tarfile.USTAR_FORMAT) as t:
   for name,value in data.items():
    e=tarfile.TarInfo(name);e.mode=0o644;e.size=len(value);t.addfile(e,io.BytesIO(value))
  compressed=gzip.compress(raw.getvalue(),mtime=0);add_current(archive_path,compressed,'demo');descriptor.update(sha256=hashlib.sha256(compressed).hexdigest(),gitBlob=oid('blob',compressed),bytes=len(compressed))
 # This deliberately substitutes the test trust inputs to reach member/provenance
 # validation beyond the independently verified outer archive digest boundary.
 encoded=(json.dumps(policy,indent=2)+'\n').encode();add_current('tools/schema-inventory/source-bindings.json',encoded)
 manifest['producer']['policySha256']=hashlib.sha256(encoded).hexdigest()
 pathlib.Path(output).mkdir(parents=True,exist_ok=True);pathlib.Path(output,'test-policy.json').write_bytes(encoded)
else:raise ValueError(mutation)
pin=json.loads(members['current/core/product-demos.lock.json'][1]);pin['demoSha']=expected['demoSha'];add_current('product-demos.lock.json',(json.dumps(pin,indent=2)+'\n').encode())
mb=(json.dumps(manifest,sort_keys=True,separators=(',',':'))+'\n').encode();members['manifest.json']=(tarfile.TarInfo('manifest.json'),mb)
out=pathlib.Path(output);out.mkdir(parents=True,exist_ok=True)
with gzip.GzipFile(filename=str(out/'sources.tar.gz'),mode='wb',mtime=0) as f,tarfile.open(fileobj=f,mode='w',format=tarfile.USTAR_FORMAT) as t:
 for name,(entry,value) in members.items():
  e=tarfile.TarInfo(name);e.mode=entry.mode if entry.mode in (0o644,0o755) else 0o644;e.size=len(value);t.addfile(e,io.BytesIO(value))
expected.update(archiveSha256=hashlib.sha256((out/'sources.tar.gz').read_bytes()).hexdigest(),manifestSha256=hashlib.sha256(mb).hexdigest());(out/'expected.json').write_text(json.dumps(expected,indent=2)+'\n')
