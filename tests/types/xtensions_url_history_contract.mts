import { createURLStateContract, type Policy, type Snapshot, type Lifetime } from '../../development/rmtx-a02/url-history/reference.js';
import type { XTensionStateBindingArtifact } from '../../tools/xtensions/state-binding-artifact.js';
import type { RmtModelReader, RmtModelCommandPort } from '../../xtendrmt/rmt-state-selector-runtime.js';
declare const policy: Policy, bindings: XTensionStateBindingArtifact, reader: RmtModelReader, port: RmtModelCommandPort;
const contract=createURLStateContract(policy,{program:{},bindings});
const snapshot: Snapshot=contract.capture(reader.snapshot());
const restore=contract.planRestore(contract.encode(snapshot),reader.snapshot(),{navigationId:'n1'});
const lifetime: Lifetime={navigationId:()=> 'n1',isCurrent:()=>true,isViewCommitted:()=>true};
contract.applyRestore(restore,{modelReader:reader,modelCommandPort:port},lifetime);
const proposal=contract.proposeHistory(reader.snapshot(),{cause:'checkpoint',currentToken:null,navigationId:'n1'});
contract.checkHistory(proposal,reader.snapshot(),lifetime);
// @ts-expect-error Model paths and command names are not URL wire members.
const invalid: Snapshot={...snapshot,state:'private',command:'execute'};
// @ts-expect-error Opaque object data is not a URL scalar.
const privateValue: Snapshot={...snapshot,entries:[{declarationId:'x',keys:[],values:{profile:{secret:'no'}}}]};
void invalid;void privateValue;contract.dispose();
