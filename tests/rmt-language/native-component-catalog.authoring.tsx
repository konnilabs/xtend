import {RMT,model} from '../../tools/rmt-language/rmtx';
const form=<RMT.Component ref="email" tag="x-input" properties={{value:model.form.email}} attributes={{required:true}}><RMT.On event="input-changed" action="form.changed" payload={{value:'detail.value'}}/></RMT.Component>;
const layout=<RMT.Component tag="x-masonry" ref="cards" properties={{items:[{key:1,ref:'item'}],order:[1],collapsed:[]}}/>;
// @ts-expect-error Literal JSX props are checked against this tag's captured schema.
const wrongValue=<RMT.Component tag="x-input" properties={{value:23}}/>;
// @ts-expect-error The property belongs to another native tag.
const wrongProp=<RMT.Component tag="x-button" properties={{checked:true}}/>;
// @ts-expect-error No implicit arbitrary HTML attribute fallthrough.
const fallthrough=<RMT.Component tag="x-button" attributes={{'data-anything':'unreviewed'}}/>;
// @ts-expect-error Service modules have authority ports rather than CustomElement views.
const service=<RMT.Component tag="x-theme"/>;
// @ts-expect-error Surface Controller state is changed through declared commands.
const controllerState=<RMT.Component tag="x-surface-window" properties={{open:true}}/>;
// @ts-expect-error Manager layout is owned by the actual injected Controller.
const managerLayout=<RMT.Component tag="x-surface-manager" attributes={{layout:'stack'}}/>;
const windowFlags=<RMT.Component tag="x-surface-window" attributes={{draggable:true,resizable:false}}/>;
// @ts-expect-error Source8 delegates positional Classic selection to typed selectedKey.
const positionalTab=<RMT.Component tag="x-tabs" attributes={{selected:'0'}}/>;
const selectedTab=<RMT.Component tag="x-tabs" properties={{selectedKey:'product-1'}}/>;
void [form,layout,wrongValue,wrongProp,fallthrough,service,controllerState,managerLayout,windowFlags,positionalTab,selectedTab];
