<?php
// NGINX/Plesk resolves this physical directory before Apache's Docs fallback.
// Keep the public trailing-slash route inside the canonical PHP SSR host.
$_SERVER['SCRIPT_NAME'] = '/docs/index.php';
$_SERVER['PHP_SELF'] = '/docs/index.php';
$_SERVER['SCRIPT_FILENAME'] = dirname(__DIR__, 2) . '/index.php';
require $_SERVER['SCRIPT_FILENAME'];
