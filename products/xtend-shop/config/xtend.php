<?php
return ['compact_responses'=>true,'style_nonce'=>true,'manifest'=>base_path('bootstrap/xtend/pages.json'),'root_view'=>'xtend::app',
 'ssr'=>['executionMode'=>'server_prerender_resume','cspDirectives'=>['style-src'=>["'self'"],'style-src-attr'=>["'none'"],'script-src'=>["'self'",env('DEMOPAY_ORIGIN','http://127.0.0.1:8181')],'connect-src'=>["'self'",env('DEMOPAY_ORIGIN','http://127.0.0.1:8181')]]], 'flash_keys'=>['success','error','message'], 'routes'=>[]];
