"""Controlled archive mutations, never delivery sources or accepted inventory."""
import base64, gzip, hashlib, io, json, pathlib, sys, tarfile
source,receipt,output,mutation=sys.argv[1:]; expected=json.loads(pathlib.Path(receipt).read_text()); members={}
with tarfile.open(source,'r:gz') as tar:
    for entry in tar: members[entry.name]=(entry,tar.extractfile(entry).read())
manifest=json.loads(members['manifest.json'][1])
def oid(kind,data): return hashlib.sha1((kind+' '+str(len(data))+'\0').encode()+data).hexdigest()
def tree(rows):
    root={}
    for row in rows:
        node=root; parts=row['path'].split('/')
        for part in parts[:-1]: node=node.setdefault(part,{})
        node[parts[-1]]=row
    def encode(node):
        data=b''
        for name,value in sorted(node.items(),key=lambda item:(item[0]+('/' if 'gitBlob' not in item[1] else '')).encode()):
            mode,id=('40000',encode(value)) if 'gitBlob' not in value else (value['mode'],value['gitBlob'])
            data+=(mode+' '+name+'\0').encode()+bytes.fromhex(id)
        return oid('tree',data)
    return encode(root)
def add_current(name,data,owner='core'):
    key='current/'+owner+'/'+name; entry=tarfile.TarInfo(key);entry.mode=0o644; members[key]=(entry,data)
    rows=manifest[owner]['files']; rows[:]=[r for r in rows if r['path']!=name]
    rows.append(dict(path=name,mode='100644',gitBlob=oid('blob',data),sha256=hashlib.sha256(data).hexdigest(),bytes=len(data)))
    manifest[owner]['tree']=tree(rows); commit=('tree '+manifest[owner]['tree']+'\nparent '+manifest[owner]['sha']+'\nauthor Test <test@example.invalid> 0 +0000\ncommitter Test <test@example.invalid> 0 +0000\n\nControlled negative fixture\n').encode()
    manifest[owner]['commit']=base64.b64encode(commit).decode();manifest[owner]['sha']=oid('commit',commit);expected[owner+'Sha']=manifest[owner]['sha']
first=next(k for k in members if k.startswith('evidence/historical/'))
if mutation=='historical-tamper': members[first]=(members[first][0],members[first][1]+b' ')
elif mutation=='historical-missing': del members[first]
elif mutation=='current-missing': del members[first.replace('evidence/historical/','current/demo/')]
elif mutation=='current-tamper':
    k=first.replace('evidence/historical/','current/demo/');members[k]=(members[k][0],members[k][1]+b' ')
elif mutation=='extra-member':
    e=tarfile.TarInfo('unexpected.txt');e.mode=0o644;members[e.name]=(e,b'forbidden')
elif mutation in ('link','traversal','duplicate','wrong-mode'):
    e=tarfile.TarInfo('../escape' if mutation=='traversal' else 'unexpected.txt');e.mode=0o600 if mutation=='wrong-mode' else 0o644
    if mutation=='link': e.type=tarfile.SYMTYPE;e.linkname='manifest.json'
    members[e.name]=(e,b'')
elif mutation=='incomplete-tree': manifest['core']['files'].pop()
elif mutation=='pin': add_current('product-demos.lock.json',json.dumps(dict(repository='https://evil.example/repo',demoSha=expected['demoSha'])).encode())
elif mutation=='ambiguous-owner':
    name=first.removeprefix('evidence/historical/');add_current(name,members[first][1])
elif mutation=='generated-formal':
    identifier='.'.join(['xtend','unreviewed-generated-formal','v1'])
    add_current('docs/generated/negative.schema.json',json.dumps({'$id':identifier,'type':'object'}).encode(),owner='demo')
    pin=json.loads(members['current/core/product-demos.lock.json'][1]);pin['demoSha']=expected['demoSha'];add_current('product-demos.lock.json',json.dumps(pin).encode())
elif mutation=='same-hash-declaration':
    identifier='.'.join(['xtend','utility','ui-transition-result','v1'])
    add_current('unreviewed-same-hash-authority.d.ts',('export interface UnreviewedCurrentAuthority { schema: '+repr(identifier)+'; status: string; }\n').encode())
elif mutation=='copied-authority':
    add_current('unreviewed-authority-copy.d.ts',members['current/core/candidate-integrity.d.ts'][1])
elif mutation=='new-id':
    identifier='.'.join(['xtend','unreviewed-union-contract','v1'])
    add_current('unscoped-new-contract.mjs',("export const SCHEMA = '"+identifier+"';\n").encode())
elif mutation=='invalid-v2':
    identifier='.'.join(['xtend','product-candidates','v2'])
    add_current('unscoped-invalid-v2.mjs',("export const SCHEMA = '"+identifier+"';\n").encode())
elif mutation=='extra-authority':
    identifier='.'.join(['xtend','surface','controller','v2'])
    add_current('unscoped-extra-authority.d.ts',("export interface ExtraAuthority { schema: '"+identifier+"'; unreviewedAuthority: number; }\n").encode())
elif mutation=='unscoped-usage':
    identifier='.'.join(['xtend','surface','controller','v2'])
    add_current('unscoped-new-usage.mjs',("export const SCHEMA = '"+identifier+"';\n").encode())
else: raise ValueError(mutation)
mb=(json.dumps(manifest,sort_keys=True,separators=(',',':'))+'\n').encode();members['manifest.json']=(members['manifest.json'][0],mb)
output=pathlib.Path(output);output.mkdir()
with (output/'sources.tar.gz').open('wb') as raw,gzip.GzipFile(fileobj=raw,mode='wb',mtime=0,compresslevel=1) as gz,tarfile.open(fileobj=gz,mode='w',format=tarfile.USTAR_FORMAT) as tar:
    for name,(entry,data) in members.items():
        entry.size=len(data);tar.addfile(entry,io.BytesIO(data))
        if mutation=='duplicate' and name=='manifest.json': tar.addfile(entry,io.BytesIO(data))
expected['archiveSha256']=hashlib.sha256((output/'sources.tar.gz').read_bytes()).hexdigest();expected['manifestSha256']=hashlib.sha256(mb).hexdigest()
(output/'expected.json').write_text(json.dumps(expected))
