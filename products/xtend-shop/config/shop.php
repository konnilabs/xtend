<?php
return ['shipping'=>['standard'=>490,'free_from'=>5000,'express'=>990], 'provider_origin'=>env('DEMOPAY_ORIGIN','http://127.0.0.1:8181'),
 'payment_secret'=>env('DEMOPAY_SECRET'), 'payment_ttl'=>300,'request_timeout'=>30,'cleanup_timeout'=>5];
