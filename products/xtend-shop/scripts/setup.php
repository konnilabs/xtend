<?php
// Setup is additive; starting the hosts never deletes data or rotates keys.
$root=dirname(__DIR__);chdir($root);
foreach(['bootstrap/cache','storage/framework/cache','storage/framework/sessions','storage/framework/views','storage/logs','database','payment-provider/storage'] as $dir)if(!is_dir($dir))mkdir($dir,0770,true);
if(!file_exists('.env'))copy('.env.example','.env');$env=file_get_contents('.env');
foreach(['APP_KEY'=>'base64:'.base64_encode(random_bytes(32)),'DEMOPAY_SECRET'=>bin2hex(random_bytes(32))] as $key=>$value){
    if(!preg_match('/^'.preg_quote($key,'/').'=(.+)$/m',$env)){$env=preg_replace('/^'.preg_quote($key,'/').'=.*\R?/m','',$env);$env.="\n$key=$value\n";}
}
file_put_contents('.env',$env);chmod('.env',0600);
preg_match('/^DEMOPAY_SECRET=(.+)$/m',$env,$secret);
$provider='payment-provider/.env';if(!file_exists($provider)){file_put_contents($provider,"SHOP_ORIGIN=http://127.0.0.1:8180\nDEMOPAY_SECRET=".$secret[1]."\n");chmod($provider,0600);}
require 'vendor/autoload.php';$app=require 'bootstrap/app.php';exit($app->handleCommand(new Symfony\Component\Console\Input\ArrayInput(['command'=>'shop:install'])));
