import hashlib,json,pathlib,subprocess,sys
root=pathlib.Path('/home/konni/Downloads/xtend-dev/xtend')
target=pathlib.Path('/tmp/xtend-native-catalog-v2/root/preparation-inputs-final.json')
excluded={'tests/schemas/core-release-inventory.json','development/core-release-authority-decision.json','scripts/release/core-projection-policy.json','development/rmtx-a01/inventory.json'}
def inputs():
 paths=subprocess.check_output(['git','ls-files','-z','--cached','--others','--exclude-standard'],cwd=root).decode().split('\0')
 return {p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in sorted(set(paths)-{''}-excluded) if (root/p).is_file() and not p.startswith('development/rmtx-a06/native-component-catalog/verification/') and (p.endswith(('.js','.mjs','.cjs','.ts','.tsx','.json','.rmt','.rmtx','.py')) or p in ['package.json'])}
if sys.argv[1]=='before':
 assert not target.exists()
 result={'schema':'xtend.local.preparation-input-binding.v1','baseHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root).decode().strip(),'excludedGovernedFiles':sorted(excluded),'verificationOutputsExcluded':True,'inputs':inputs()}
 target.write_text(json.dumps(result,indent=2)+'\n');print(len(result['inputs']))
else:
 before=json.loads(target.read_text());current=inputs();changes=[p for p,h in before['inputs'].items() if current.get(p)!=h]
 result={'schema':before['schema'],'baseHead':before['baseHead'],'boundInputs':len(before['inputs']),'changedBoundInputs':changes,'unchanged':not changes,'newFiles':sorted(set(current)-set(before['inputs']))}
 target.with_name('preparation-input-conservation-final.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result));assert not changes and not result['newFiles']
