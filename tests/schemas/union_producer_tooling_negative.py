"""Portable exact-Git-object tooling tests; temporary synthetic objects only.
No application commits, branches, credentials or permission changes.
"""
import importlib.util, pathlib, subprocess, tempfile, sys
sys.dont_write_bytecode=True
script=pathlib.Path(__file__).resolve().parents[2]/'scripts/build-union-source-artifact.py'
spec=importlib.util.spec_from_file_location('producer',script); producer=importlib.util.module_from_spec(spec);spec.loader.exec_module(producer)
implementation=script.read_bytes(); policy=(script.parent.parent/'tools/schema-inventory/source-bindings.json').read_bytes()
with tempfile.TemporaryDirectory(prefix='union-tooling-negative-') as name:
    root=pathlib.Path(name)
    def git(*args,data=None): return subprocess.check_output(['git','-C',name,*args],input=data,stderr=subprocess.PIPE).decode().strip()
    git('init','--quiet');
    for relative,data in [('scripts/build-union-source-artifact.py',implementation),('tools/schema-inventory/source-bindings.json',policy)]:
        target=root/relative;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
    git('add','scripts','tools');tree=git('write-tree')
    raw=f'tree {tree}\nauthor Fixture <fixture@example.invalid> 0 +0000\ncommitter Fixture <fixture@example.invalid> 0 +0000\n\nSynthetic tooling boundary fixture\n'.encode()
    sha=git('hash-object','-w','-t','commit','--stdin',data=raw)
    (root/'.git/HEAD').write_text(sha+'\n')
    assert producer.verify_committed_tooling(root,sha,implementation,policy)==policy
    print('PASS exact expected Git-object tooling and policy bytes')
    for label,args,message in [
        ('substituted implementation',(implementation+b'\n',policy),'Dirty or substituted'),
        ('substituted policy',(implementation,policy+b'\n'),'Dirty or substituted')]:
        try: producer.verify_committed_tooling(root,sha,*args)
        except ValueError as error: assert message in str(error);print('PASS '+label+' rejected: '+str(error))
        else: raise AssertionError(label+' accepted')
    (root/'tools/schema-inventory/source-bindings.json').write_bytes(policy+b'\n')
    try: producer.verify_committed_tooling(root,sha,implementation,policy)
    except ValueError as error: assert 'Dirty committed' in str(error);print('PASS dirty checkout rejected: '+str(error))
    else: raise AssertionError('dirty checkout accepted')
    try: producer.verify_committed_tooling(root,'0'*40,implementation,policy)
    except ValueError as error: assert 'independently expected' in str(error);print('PASS wrong independent Core SHA rejected')
    else: raise AssertionError('wrong Core SHA accepted')
    # Actual command entry point must fail before creating the output directory.
    command=[sys.executable,str(script),'--mode','committed','--core',name,'--demo',name,'--core-sha',sha,'--output',str(root/'output'),'--run-id','negative','--run-attempt','1']
    failed=subprocess.run(command,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    assert failed.returncode!=0 and 'Dirty committed producer checkout' in failed.stderr
    assert not (root/'output').exists()
    print('COMMAND PASS actual dirty producer command rejected before output writes')
