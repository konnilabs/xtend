'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {buildMaracaBundleAsync}=require('@ccslabs/xtend/maraca');
const {buildPages}=require('@ccslabs/xtend/rmt-language/page-build');
const esbuild=require('esbuild');
const {createHash}=require('node:crypto');
const {createXScalerRemoteSurfacePlan}=require('@ccslabs/xtend/xscaler/protocol');
const {createRmtCompilationSession}=require('@ccslabs/xtend/rmt-language/compilation-session');
async function build() {
  const root=path.resolve(__dirname,'..');
  const compilation=createRmtCompilationSession({root});
  const provider=path.join(root,'payment-provider');
  // These two directories contain only rebuildable artifacts. Cleaning prevents
  // stale entrypoints from masking a missing file in the current build.
  for (const directory of [path.join(root,'public/build'),path.join(provider,'public/build')]) fs.rmSync(directory,{recursive:true,force:true});
  const buildConfiguration=JSON.parse(execFileSync(process.env.XTEND_PHP_BINARY || 'php',['artisan','shop:build-config'],{cwd:root,encoding:'utf8'}));
  const providerOrigin=buildConfiguration.providerOrigin;
  const providerConfig=JSON.parse(fs.readFileSync(path.join(provider,'maraca.config.json'))).options;
  const payment=await buildMaracaBundleAsync(providerConfig,{rootDir:provider,compileSource:compilation.compileSource});
  if(!payment.ok)throw Object.assign(new Error('DemoPay Maraca build failed.'),{details:payment.plan?.diagnostics || payment});
  const css=fs.readFileSync(path.join(provider,'src/app.css'),'utf8');
  const adapterConfiguration={origin:providerOrigin,rootId:'demopay-root',inputState:'provider.input',streamState:'provider.ui',streamService:'demopay.fragments',resultState:'provider.result',cancelState:'provider.cancelled.value',errorState:'provider.status',css};
  await esbuild.build({stdin:{contents:`import {createXtendMaraca} from './public/build/maraca/xtend.maraca.mjs';import {createMaracaRemoteSurfaceAdapter,registerXScalerRemoteAdapter} from '@ccslabs/xtend/maraca/remote-surface';registerXScalerRemoteAdapter({surfaceId:'remoteSurface:demopay.payment',adapter:createMaracaRemoteSurfaceAdapter({...${JSON.stringify(adapterConfiguration)},createComposition:()=>createXtendMaraca({publishGlobalFacades:false})})});`,resolveDir:provider,sourcefile:'generated-provider-entry.mjs'},bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:path.join(provider,'public/build/adapter.mjs')});
  const digest='sha256-'+createHash('sha256').update(fs.readFileSync(path.join(provider,'public/build/adapter.mjs'))).digest('base64');
  const plan=createXScalerRemoteSurfacePlan({surface:'demopay.payment',surfaceId:'remoteSurface:demopay.payment',owner:'xtend.store.demopay',origin:providerOrigin,integrity:{algorithm:'sha256',digest},fallbackSurface:'shop.paymentFailed',lanes:[{lane:'visible',target:'shell.slot:payment'}],ssr:{mode:'preflight-only',networkDuringRender:false}});
  fs.writeFileSync(path.join(provider,'public/build/surface-plan.json'),JSON.stringify(plan,null,2)+'\n');
  const config=JSON.parse(fs.readFileSync(path.join(root,'maraca.config.json'))).options;
  const result=await buildMaracaBundleAsync(config,{rootDir:root,compileSource:compilation.compileSource});
  if(!result.ok) throw Object.assign(new Error('Maraca build failed.'),{details:result.plan?.diagnostics || result});
  const publicKey=buildConfiguration.publicKey;
  const events=result.plan.orchestration?.artifact?.events || [];
  const remoteSurfaces=[{plan,adapterUrl:providerOrigin+'/build/adapter.mjs',slot:'#remote-payment-slot',serviceId:'demopay.payment',requestState:'shop.paymentAttempt',openState:'shop.paymentDialog.open',completeAction:'shop.complete',closeAction:'shop.closePayment',cancelAction:'shop.cancel',errorAction:'shop.paymentFailed',failureMessage:'Die Demo-Zahlung konnte nicht abgeschlossen werden. Bitte versuche es erneut.',resultUrl:'shop.paymentResult.url',allowInsecureLoopback:providerOrigin.startsWith('http://')}];
  await esbuild.build({stdin:{contents:`import {startMaracaPageApplication} from '@ccslabs/xtend/maraca/page-bootstrap'; startMaracaPageApplication(${JSON.stringify({applicationKey:'xtend.store',navigationAction:'shop.navigate',publicKey,events,remoteSurfaces})});`,resolveDir:root,sourcefile:'page.mjs'},bundle:true,format:'esm',platform:'browser',target:'es2022',splitting:true,outExtension:{'.js':'.mjs'},entryNames:'page',chunkNames:'chunks/[name]-[hash]',outdir:path.join(root,'public/build')});
  await esbuild.build({entryPoints:[path.join(root,'src/app.css')],bundle:true,outfile:path.join(root,'public/build/store.css')});
  const pages=await buildPages({root,host:'laravel',target:'php',compileSource:compilation.compileSource});
  console.log(JSON.stringify({ok:true,version:pages.manifest.version,pages:Object.keys(pages.manifest.pages),compilation:compilation.snapshot()}));
  compilation.dispose();
}
build().catch(error=>{console.error(error.message,JSON.stringify(error.details || error.diagnostics || {}));process.exitCode=1;});
