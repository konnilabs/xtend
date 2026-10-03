<?php
use XtendStore\Payment\PaymentProof;
return static function(array $config):array {
    $signer=new PaymentProof($config['DEMOPAY_SECRET']);
    $measure=static function(string $service):void { $file=getenv('XTEND_STORE_PROVIDER_METRICS_FILE');if($file&&file_put_contents($file,$service."\n",FILE_APPEND|LOCK_EX)===false)throw new RuntimeException('Acceptance metrics could not be written.'); };
    return [
        'demopay.fragments'=>['kind'=>'stream','stream'=>static function(array $input,array $context)use($signer,$measure):Generator {
            $measure('demopay.fragments');
            yield from (new XScalerPhpFragmentAdapter(['provider.ui']))->stream(static function(array $streamContext)use($input,$signer):Generator {
            $claims=$signer->verify((string)($input['capability']??''),'authorize');
            $sections=[];
            $stages=[
                ['id'=>'summary','title'=>'Dein Einkauf bei XTend.store','text'=>number_format($claims['amount']/100,2,',','.').' € · EUR','kind'=>'summary'],
                ['id'=>'method','title'=>'Wie möchtest du probeweise bezahlen?','text'=>'Wähle eine fiktive Zahlungsmethode. Es werden keine Zahlungsdaten benötigt.','kind'=>'method'],
                ['id'=>'confirm','title'=>'Nur eine Demo. Vollständig durchspielbar.','text'=>'Mit deiner Bestätigung wird eine Mock-Bestellung erstellt. Es fließt kein Geld.','kind'=>'confirm']
            ];
            foreach($stages as $index=>$section){
                if($index>0)usleep(350000);
                $sections[]=$section;
                yield ['type'=>'delta','value'=>['target'=>'provider.ui','value'=>['sections'=>$sections,'methodReady'=>$index>=1,'confirmReady'=>$index>=2]]];
            }
            if($claims['scenario']==='timeout'){
                $end=$streamContext['deadline'];
                while(microtime(true)<$end&&!connection_aborted()&&!(($streamContext['isCancelled']??static fn()=>false)()))usleep(50000);
                throw new RuntimeException('Demo timeout.');
            }
            yield ['type'=>'complete'];
            },$context);
        }],
        'demopay.authorize'=>['kind'=>'command','invoke'=>static function(array $input)use($signer,$measure):array {
            $measure('demopay.authorize');
            $claims=$signer->verify((string)($input['capability']??''),'authorize');
            if(!in_array($input['method']??'', ['wallet','card'],true))throw new RmtPhpAppServiceException('Wähle eine Demo-Zahlungsmethode.','xtend.maraca.app-service.validation',true);
            if($claims['scenario']!=='success')throw new RmtPhpAppServiceException('Die Demo-Zahlung wurde abgelehnt.','xtend.maraca.app-service.validation',true);
            $claims['purpose']='authorized';return ['proof'=>$signer->sign($claims)];
        }]
    ];
};
