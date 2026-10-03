<?php
declare(strict_types=1);
require dirname(__DIR__).'/vendor/autoload.php';
$input=json_decode(stream_get_contents(STDIN),true,128,JSON_THROW_ON_ERROR);
if($input['operation']==='resume'){
    // Preserve the caller's exact object/list distinctions, including empty records.
    $state=json_decode($input['stateJson'],false,128,JSON_THROW_ON_ERROR);
    $key=openssl_pkey_new(['private_key_type'=>OPENSSL_KEYTYPE_EC,'curve_name'=>'prime256v1']);openssl_pkey_export($key,$pem);
    $signer=new Ccslabs\XTend\ResumeSigner($pem,'test-key');
    $result=createRmtPhpSsrAdapter()->render(['descriptor'=>['type'=>'element','tag'=>'section','attributes'=>['id'=>'test-root'],'children'=>[['type'=>'text','text'=>'Signed content']]]],['executionMode'=>'server_prerender_resume','rootId'=>'test-root','resume'=>['state'=>(array)$state,'sign'=>fn($canonical)=>$signer->sign($canonical)]]);
    echo json_encode(['result'=>$result,'publicKey'=>$signer->publicKey()],JSON_THROW_ON_ERROR);
}elseif($input['operation']==='policy'){
    $verdict=null;$called=false;
    $manifest=$input['manifest'];
    $adapter=createRmtPhpAppServiceAdapter($manifest,['test.policy'=>['kind'=>'command','invoke'=>function($value)use(&$called){$called=true;return $value;}]],['onInputPolicyVerdict'=>function($value)use(&$verdict){$verdict=$value;}]);
    try{$value=$adapter->invoke('test.policy',$input['input']);$ok=true;}catch(Throwable $error){$ok=false;$value=null;}
    echo json_encode(compact('ok','value','called','verdict'),JSON_THROW_ON_ERROR);
}elseif($input['operation']==='fragments'){
    $closed=0;$now=0;
    $adapter=new XScalerPhpFragmentAdapter(['provider.ui'],['clock'=>function()use(&$now){return $now;},'cleanup'=>function()use(&$closed,$input,&$now){$closed++;if($input['scenario']==='cleanup')throw new RuntimeException('private');if($input['scenario']==='slow-cleanup')$now+=6;},'onError'=>function()use($input){if($input['scenario']==='observer')throw new RuntimeException('private');}]);
    $frames=iterator_to_array($adapter->stream(function()use($input,&$now){yield ['type'=>'delta','value'=>['target'=>'provider.ui','value'=>['stage'=>'first']]];
        if($input['scenario']==='outside')yield ['type'=>'delta','value'=>['target'=>'shop.cart','value'=>[]]];
        elseif(in_array($input['scenario'],['throw','observer']))throw new RuntimeException('private');
        elseif($input['scenario']==='timeout'){$now=31;yield ['type'=>'delta','value'=>['target'=>'provider.ui','value'=>[]]];}
        else {yield ['type'=>'complete'];yield ['type'=>'complete'];}
    }),false);echo json_encode(compact('frames','closed'),JSON_THROW_ON_ERROR);
}
