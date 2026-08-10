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

if (preg_match('#^/docs/(de|en)/components$#', $requestPath, $matches) === 1) {
    if (function_exists('header_remove')) {
        header_remove('X-Powered-By');
    }
    header('Location: /docs/' . $matches[1] . '/components/', true, 308);
    return true;
}

if ($candidate && str_starts_with($candidate, $repoRoot) && is_file($candidate)) {
    $acceptEncoding = strtolower((string) ($_SERVER['HTTP_ACCEPT_ENCODING'] ?? ''));
    $extension = strtolower((string) pathinfo($candidate, PATHINFO_EXTENSION));
    $compressibleTypes = [
        'css' => 'text/css; charset=UTF-8',
        'html' => 'text/html; charset=UTF-8',
        'js' => 'text/javascript; charset=UTF-8',
        'json' => 'application/json; charset=UTF-8',
        'mjs' => 'text/javascript; charset=UTF-8',
        'rmt' => 'text/plain; charset=UTF-8',
        'svg' => 'image/svg+xml',
        'txt' => 'text/plain; charset=UTF-8'
    ];
    if (isset($compressibleTypes[$extension]) && str_contains($acceptEncoding, 'gzip') && function_exists('gzencode')) {
        $contents = file_get_contents($candidate);
        $compressed = is_string($contents) ? gzencode($contents, 6) : false;
        if (is_string($compressed)) {
            header('Content-Type: ' . $compressibleTypes[$extension]);
            header('Content-Encoding: gzip');
            header('Vary: Accept-Encoding');
            header('Content-Length: ' . strlen($compressed));
            echo $compressed;
            return true;
        }
    }
    return false;
}

if ($requestPath === '/docs' || str_starts_with($requestPath, '/docs/')) {
    $_SERVER['SCRIPT_NAME'] = '/docs/index.php';
    $_SERVER['PHP_SELF'] = '/docs/index.php';
    require __DIR__ . '/index.php';
    return true;
}

return false;
