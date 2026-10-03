<?php
declare(strict_types=1);
$root=dirname(__DIR__);require $root.'/vendor/autoload.php';
$config=array_replace(['SHOP_ORIGIN'=>'http://127.0.0.1:8180','PROVIDER_ORIGIN'=>'http://127.0.0.1:8181'],parse_ini_file($root.'/.env',false,INI_SCANNER_RAW)?:[]);
foreach(['SHOP_ORIGIN','PROVIDER_ORIGIN','DEMOPAY_SECRET'] as $key)if(getenv($key)!==false)$config[$key]=getenv($key);
$origin=$_SERVER['HTTP_ORIGIN']??'';
header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
header('Vary: Origin');
if($origin===$config['SHOP_ORIGIN']){
    header('Access-Control-Allow-Origin: '.$origin);
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}elseif($origin!==''){http_response_code(403);exit;}
if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(204);exit;}
$path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);
try{
    if($_SERVER['REQUEST_METHOD']==='GET'){
        if($path==='/health'){header('Content-Type: application/json');echo '{"ok":true,"host":"php","product":"XTend DemoPay"}';exit;}
        if(preg_match('#^/build/[a-zA-Z0-9_./-]+\.(mjs|js|css|json)$#',$path)){
            $file=realpath(__DIR__.$path);$base=realpath(__DIR__.'/build');
            if(!$file||!$base||!str_starts_with($file,$base.DIRECTORY_SEPARATOR)||!is_file($file)){http_response_code(404);exit;}
            header('Content-Type: '.(str_ends_with($file,'.css')?'text/css':(str_ends_with($file,'.json')?'application/json':'text/javascript')).'; charset=utf-8');readfile($file);exit;
        }
        http_response_code(404);exit;
    }
    if($_SERVER['REQUEST_METHOD']!=='POST'){http_response_code(405);exit;}
    if($origin!==$config['SHOP_ORIGIN']){http_response_code(403);exit;}
    $raw=file_get_contents('php://input',false,null,0,65537);if(strlen($raw)>65536){http_response_code(413);exit;}
    $body=json_decode($raw,true,64,JSON_THROW_ON_ERROR);
    $plan=json_decode(file_get_contents($root.'/public/build/surface-plan.json'),true,64,JSON_THROW_ON_ERROR);
    if($path==='/preflight'){
        $requested=createXScalerRemoteSurfacePlan($body['remoteSurfacePlan']??[]);
        if($requested!==$plan){http_response_code(409);throw new RuntimeException('Provider build differs from the pinned plan.');}
        $result=evaluateXScalerPreflight(['request'=>$body['request']??[],'remoteSurfacePlan'=>$plan,'hostCapabilities'=>['allowedOrigins'=>[$config['PROVIDER_ORIGIN']]]]);
        header('Content-Type: application/json');echo json_encode($result,JSON_THROW_ON_ERROR);exit;
    }
    if(!preg_match('#^/api/xtend/services/(demopay\.(fragments|authorize))$#',$path,$match)||($body['serviceId']??'')!==$match[1]){http_response_code(404);exit;}
    $manifest=json_decode(file_get_contents($root.'/public/build/maraca/xtend.maraca.services.json'),true,128,JSON_THROW_ON_ERROR);
    $registry=(require $root.'/server/services.php')($config);
    $adapter=createRmtPhpAppServiceAdapter($manifest,$registry);
    $deadline=microtime(true)+30;
    $result=$adapter->handleHttpRequest($raw,getallheaders(),['isCancelled'=>static fn()=>connection_aborted()||microtime(true)>=$deadline]);
    http_response_code($result['status']);foreach($result['headers'] as $key=>$value)header($key.': '.$value);
    if(is_string($result['body']))echo $result['body'];
    else{
        header('X-Accel-Buffering: no');header('Content-Encoding: identity');
        while(ob_get_level())ob_end_flush();
        foreach($result['body'] as $chunk){if(connection_aborted())break;echo $chunk;flush();}
    }
    $adapter->dispose();
}catch(Throwable $error){
    if(!headers_sent()){if(http_response_code()<400)http_response_code(422);header('Content-Type: application/json');echo json_encode(['ok'=>false,'error'=>['code'=>'demopay.request_failed','message'=>'Die Demo-Zahlung konnte nicht verarbeitet werden.']]);}
    error_log('DemoPay request failed: '.get_class($error));
}
