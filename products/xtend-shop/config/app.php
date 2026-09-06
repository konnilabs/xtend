<?php
return ['name'=>'XTend.store','env'=>env('APP_ENV','production'),'debug'=>(bool)env('APP_DEBUG',false),
 'url'=>env('APP_URL','http://127.0.0.1:8180'),'timezone'=>'Europe/Berlin','locale'=>'de','fallback_locale'=>'de',
 'key'=>env('APP_KEY'),'cipher'=>'AES-256-CBC'];
