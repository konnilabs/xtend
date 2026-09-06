import {createNodePageHost, createNodePageRouteManifest} from '@ccslabs/xtend-rmt/node-page-host';
import {createPageClient} from '@ccslabs/xtend-rmt/page-client';
import {createPageForm, createNodePageValidator} from '@ccslabs/xtend-rmt/page-form';
import {Prop, type PageManifest, type PageResponse, pagePagination} from '@ccslabs/xtend-rmt/page-contract';
import {createPortableRenderArtifact} from '@ccslabs/xtend-rmt/portable-render';

const artifact=createPortableRenderArtifact({descriptor:{type:'text',text:'$model.title'}},{inputs:['title']});
const manifest:PageManifest={schema:'xtend.page-manifest.v1',version:'typed',pages:{Home:{artifact}}};
const host=createNodePageHost({manifest,createContext:()=>({contextKey:'guest',account:1}),resolvePage:context=>({page:'Home',props:{title:Prop.once(async()=>String(context.account))}}),validate:()=>({errors:{}})});
host.dispose();
createNodePageRouteManifest([{name:'orders',uri:'/orders',methods:['GET']}]);
const initialPage:PageResponse={schema:'xtend.page-response.v1',kind:'page',version:'typed',contextKey:'guest',page:'Home',url:'/',props:{title:'Typed'},head:[],layout:null,errors:{},flash:{},shared:{},partial:false,deferred:{},merge:{},once:{}};
const router:{pageClient?:{visit(url:string):Promise<unknown>} | null}={};
const client=createPageClient({initialPage,router,onDownload:async result=>{await result.blob.text();}});
const form=createPageForm({client,defaults:{name:'',user:{email:''}},validate:createNodePageValidator()});
form.set('user.email','a@example.test');form.reset('user.email');
pagePagination({next:'/orders?page=2',props:['orders']});
// @ts-expect-error A portable descriptor cannot silently embed executable JavaScript.
createPortableRenderArtifact({descriptor:{type:'text',text:()=> 'function'}});
// @ts-expect-error Requests are bounded with numeric limits.
createPageClient({initialPage,maxConcurrentRequests:'unbounded'});
form.dispose();client.dispose();
