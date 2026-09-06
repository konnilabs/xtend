import {createMaracaPageClient, type MaracaPageClient} from '@ccslabs/xtend/maraca/page-client';
import {startMaracaPageApplication} from '@ccslabs/xtend/maraca/page-bootstrap';
import {bindMaracaRemoteSurface, type MaracaRemoteSurfaceBinding} from '@ccslabs/xtend/maraca/remote-surface';
import {createRmtCompilationSession} from '@ccslabs/xtend/rmt-language/compilation-session';
import {createRmtResumeCaptureAdapter} from '@ccslabs/xtend/rmt/resume-capture-adapter';
import {type PageResponse, type HeadRecord} from '@ccslabs/xtend/rmt/page-contract';

const compilation = createRmtCompilationSession({root: '/app'});
const compiled = compilation.compileSource({text:'template Shop {}',filePath:'/app/shop.rmt'});
const ok: boolean = compiled.ok;
const count: number = compilation.snapshot().compilations;
const initialPage = {} as PageResponse;
const client: MaracaPageClient = createMaracaPageClient({initialPage,viewTransitions:true,root:document.createElement('section')});
const runtime = client.getRuntime();
const head: HeadRecord[] = [
  {tag:'link',attributes:{rel:'canonical',href:'https://example.test/product'}},
  {tag:'json-ld',key:'product',data:{'@type':'Product',name:'Demo'}}
];
const binding = {} as MaracaRemoteSurfaceBinding;
if (runtime) bindMaracaRemoteSurface({runtime,root:document.createElement('div'),client,binding});
const capture = createRmtResumeCaptureAdapter({generation:'test'});
capture.install(document.createElement('div'),[],{intercept:true}).dispose();
const bootstrap: Promise<MaracaPageClient> = startMaracaPageApplication({applicationKey:'test',viewTransitions:true,publicKey:{kty:'EC',crv:'P-256',kid:'test'}});
void [ok,count,head,bootstrap];
