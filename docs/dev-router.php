<?php
// Local PHP built-in server router for the Docs History API fallback.

$repoRoot = realpath(__DIR__ . '/..');
$requestPath = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
$requestPath = $requestPath === null || $requestPath === false ? '/' : $requestPath;
$requestPath = '/' . ltrim(str_replace('\\', '/', rawurldecode($requestPath)), '/');
$candidate = realpath($repoRoot . $requestPath);
$queryString = (string) ($_SERVER['QUERY_STRING'] ?? '');

if (($requestPath === '/docs' || $requestPath === '/docs/' || $requestPath === '/docs/index.php') && $queryString === '') {
    if (function_exists('header_remove')) {
        header_remove('X-Powered-By');
    }
    header('Location: /docs/de/readme', true, 302);
    return true;
}

if ($candidate && str_starts_with($candidate, $repoRoot) && is_file($candidate)) {
    return false;
}

if ($requestPath === '/docs' || str_starts_with($requestPath, '/docs/')) {
    $_SERVER['SCRIPT_NAME'] = '/docs/index.php';
    $_SERVER['PHP_SELF'] = '/docs/index.php';
    require __DIR__ . '/index.php';
    return true;
}

return false;
