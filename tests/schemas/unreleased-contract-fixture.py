#!/usr/bin/env python3
"""Controlled Git-object transports for negative registration tests; no approvals.

Start from a real source capture, change only explicitly supplied fixture bytes,
and create actual Git blobs/tree/commit using a separate index. Production files,
branches, source guards and remote refs are never changed. The untrusted fixture
transport is then checked by the unmodified production SourceProvider.
"""
import base64
import gzip
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile

request = json.load(sys.stdin)
repo, output = Path(request['repo']), Path(request['output'])
output.mkdir()
with tarfile.open(request['archive'], 'r:gz') as archive:
    members = {row.name: (archive.extractfile(row).read(), row.mode) for row in archive.getmembers()}
manifest = json.loads(members['manifest.json'][0])
parent = manifest['core']['sha']
env = dict(os.environ, GIT_INDEX_FILE=str(output / 'fixture.index'))
def git(*args, data=None):
    return subprocess.check_output(['git', '-C', str(repo), *args], input=data, env=env).decode().strip()
git('read-tree', parent)
rows = {row['path']: row for row in manifest['core']['files']}
for name, text in request['overrides'].items():
    assert name and not name.startswith('/') and all(p not in ('', '.', '..') for p in name.split('/'))
    data = text.encode()
    blob = git('hash-object', '-w', '--stdin', data=data)
    git('update-index', '--add', '--cacheinfo', '100644,' + blob + ',' + name)
    rows[name] = dict(path=name, mode='100644', gitBlob=blob, sha256=hashlib.sha256(data).hexdigest(), bytes=len(data))
    members['current/core/' + name] = (data, 0o644)
tree = git('write-tree')
commit = git('-c', 'user.name=Controlled registration fixture', '-c', 'user.email=fixture@invalid',
             'commit-tree', tree, '-p', parent, data=b'CONTROLLED TEST ONLY; no authority or publication approval\n')
commit_bytes = subprocess.check_output(['git', '-C', str(repo), 'cat-file', 'commit', commit])
manifest['core'].update(sha=commit, tree=tree, commit=base64.b64encode(commit_bytes).decode(), files=[rows[k] for k in sorted(rows)])
manifest['producer']['policySha256'] = rows['scripts/release/core-projection-policy.json']['sha256']
manifest_bytes = (json.dumps(manifest, sort_keys=True, separators=(',', ':')) + '\n').encode()
members['manifest.json'] = (manifest_bytes, 0o644)
target = output / 'sources.tar.gz'
with target.open('xb') as raw, gzip.GzipFile(fileobj=raw, mode='wb', mtime=0, compresslevel=1) as compressed:
    with tarfile.open(fileobj=compressed, mode='w', format=tarfile.USTAR_FORMAT) as archive:
        for name, (data, mode) in members.items():
            row = tarfile.TarInfo(name)
            row.size, row.mode, row.mtime = len(data), mode, 0
            archive.addfile(row, io.BytesIO(data))
expected = dict(profile=manifest['profile'], producerMode='committed', sourceSha=commit,
                context=manifest['context'], archiveSha256=hashlib.sha256(target.read_bytes()).hexdigest(),
                manifestSha256=hashlib.sha256(manifest_bytes).hexdigest())
(output / 'producer-receipt.json').write_text(json.dumps(expected, indent=2) + '\n')
print(json.dumps(expected))
