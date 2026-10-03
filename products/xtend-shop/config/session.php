<?php
return ['driver'=>'database','lifetime'=>120,'expire_on_close'=>false,'encrypt'=>false,'files'=>storage_path('framework/sessions'),
 'connection'=>null,'table'=>'sessions','store'=>null,'lottery'=>[2,100],'cookie'=>'xtend_store_session','path'=>'/',
 'domain'=>null,'secure'=>env('SESSION_SECURE_COOKIE',false),'http_only'=>true,'same_site'=>'lax'];
