<?php
return ['default'=>'sqlite','connections'=>['sqlite'=>['driver'=>'sqlite','database'=>env('DB_DATABASE',database_path('shop.sqlite')),
 'prefix'=>'','foreign_key_constraints'=>true,'busy_timeout'=>5000,'journal_mode'=>'WAL','synchronous'=>'NORMAL']],
 'migrations'=>['table'=>'migrations','update_date_on_publish'=>true]];
