<?php
// XTend Docs SPA – index.php
// Loads all .md files, parses them with Parsedown, and provides SPA routing with slugs.
// This project uses parsedown for markdown parsing. See license at https://github.com/erusev/parsedown/blob/master/LICENSE.txt

if (function_exists('header_remove')) {
    header_remove('X-Powered-By');
}

// --- Konfiguration ---
$docsRoot = __DIR__;
$repoRoot = realpath($docsRoot . '/..') ?: dirname($docsRoot);
$componentsDir = $docsRoot . '/components';
$utilsDir = $docsRoot . '/utils';
$parsedownFile = $utilsDir . '/parsedown.php';
$rmtPilotDocument = 'xtendrmt-parsedown-docs.rmt';
$rmtPilotRuntimeDocument = 'xtendrmt-parsedown-docs.core.json';
$rmtPilotDocumentPath = $docsRoot . '/' . $rmtPilotRuntimeDocument;
$docsRmtVNextShellDocument = 'xtendrmt-docs-shell-vnext.rmt';
$docsRmtVNextShellPath = $docsRoot . '/' . $docsRmtVNextShellDocument;
$docsRmtDocumentV2 = 'xtendrmt-docs-document-v2.rmt';
$docsRmtDocumentV2Path = $docsRoot . '/' . $docsRmtDocumentV2;
$docsRmtDocumentV2CorePath = $docsRoot . '/xtendrmt-docs-document-v2.core.json';
$docsRmtDocumentV2SourceSha256 = '56c718ce05d79579bb08ea381d9c797f8184af2188d99eb9ec840a264e087718';
$rmtPhpSsrAdapterFile = $repoRoot . '/xtendrmt/rmt-php-ssr-adapter.php';
$docsRmtCompilerBridgePath = $repoRoot . '/tools/tooling-bridge-cli.js';
$docsRmtLspBridgePath = $repoRoot . '/tools/tooling-bridge-cli.js';
$docsRmtMaracaPreviewBridgePath = $repoRoot . '/tools/tooling-bridge-cli.js';
$docsToolingBridgeClientFile = $repoRoot . '/tools/tooling-bridge-client.php';
if (is_readable($docsToolingBridgeClientFile)) require_once $docsToolingBridgeClientFile;
$rmtPilotDocumentData = null;
$rmtPilotDocumentJson = '{}';
$docsSsrPrehydration = null;
$docsSsrEndpoint = '';
$docsDefaultLocale = 'de';
$docsFallbackLocale = 'de';
$docsAvailableLocales = [
    'de' => [
        'label' => 'Deutsch',
        'nativeLabel' => 'Deutsch',
        'htmlLang' => 'de',
        'titleSuffix' => 'XTend Dokumentation'
    ],
    'en' => [
        'label' => 'English',
        'nativeLabel' => 'English',
        'htmlLang' => 'en',
        'titleSuffix' => 'XTend Documentation'
    ]
];

function docsAssetMap($docsRoot) {
    return [
        'favicon.ico' => [
            'path' => $docsRoot . '/../icons/favicon.ico',
            'type' => 'image/x-icon'
        ],
        'favicon-16x16.png' => [
            'path' => $docsRoot . '/../icons/favicon-16x16.png',
            'type' => 'image/png'
        ],
        'favicon-32x32.png' => [
            'path' => $docsRoot . '/../icons/favicon-32x32.png',
            'type' => 'image/png'
        ],
        'apple-touch-icon.png' => [
            'path' => $docsRoot . '/../icons/apple-touch-icon.png',
            'type' => 'image/png'
        ],
        'xtend-scaffold.webp' => [
            'path' => $docsRoot . '/../icons/xtend-scaffold.webp',
            'type' => 'image/webp'
        ],
        'xtend-logo.png' => [
            'path' => $docsRoot . '/../XTend-Logo.png',
            'type' => 'image/png'
        ]
    ];
}

function docsServeAsset($assetName, $docsRoot) {
    $assetKey = strtolower(basename((string) $assetName));
    $assets = docsAssetMap($docsRoot);
    if (!isset($assets[$assetKey])) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=UTF-8');
        header('X-Content-Type-Options: nosniff');
        echo 'Docs asset not found.';
        exit;
    }

    $asset = $assets[$assetKey];
    $path = $asset['path'];
    if (!is_file($path) || !is_readable($path)) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=UTF-8');
        header('X-Content-Type-Options: nosniff');
        echo 'Docs asset unavailable.';
        exit;
    }

    $mtime = filemtime($path);
    $size = filesize($path);
    $etag = '"' . sha1($assetKey . '|' . $mtime . '|' . $size) . '"';
    $ifNoneMatch = isset($_SERVER['HTTP_IF_NONE_MATCH']) ? trim((string) $_SERVER['HTTP_IF_NONE_MATCH']) : '';
    $ifModifiedSince = isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) ? strtotime((string) $_SERVER['HTTP_IF_MODIFIED_SINCE']) : false;

    header('Content-Type: ' . $asset['type']);
    header('X-Content-Type-Options: nosniff');
    header('Cross-Origin-Resource-Policy: same-origin');
    header('Cache-Control: public, max-age=31536000, immutable');
    header('ETag: ' . $etag);
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $mtime) . ' GMT');

    if ($ifNoneMatch === $etag || ($ifModifiedSince !== false && $ifModifiedSince >= $mtime)) {
        http_response_code(304);
        exit;
    }

    header('Content-Length: ' . $size);
    readfile($path);
    exit;
}

function docsNormalizeBasePath($value) {
    $path = '/' . trim(str_replace('\\', '/', (string) $value), '/');
    return $path === '/' ? '' : $path;
}

function docsBasePathFromServer() {
    if (PHP_SAPI === 'cli' && empty($_SERVER['REQUEST_URI'])) {
        return '/docs';
    }
    $scriptName = str_replace('\\', '/', (string) ($_SERVER['SCRIPT_NAME'] ?? '/docs/index.php'));
    if (!str_ends_with(strtolower($scriptName), '.php')) {
        $documentRoot = realpath((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''));
        $scriptFile = realpath((string) ($_SERVER['SCRIPT_FILENAME'] ?? ''));
        if ($documentRoot && $scriptFile && str_starts_with($scriptFile, $documentRoot . DIRECTORY_SEPARATOR)) {
            $scriptName = '/' . str_replace('\\', '/', substr($scriptFile, strlen($documentRoot) + 1));
        }
    }
    $scriptDir = dirname($scriptName);
    return docsNormalizeBasePath($scriptDir === '.' ? '' : $scriptDir);
}

function docsEndpointPath($queryString = '') {
    global $docsBasePath;
    $base = docsNormalizeBasePath($docsBasePath ?? '');
    $query = ltrim((string) $queryString, '?');
    return ($base === '' ? '' : $base) . '/index.php' . ($query !== '' ? '?' . $query : '');
}

function docsAssetUrl($assetName, $version) {
    return docsEndpointPath('xtend-docs-asset=' . rawurlencode((string) $assetName) . '&v=' . rawurlencode((string) $version));
}

$docsBasePath = docsBasePathFromServer();

if (isset($_GET['xtend-docs-asset'])) {
    docsServeAsset($_GET['xtend-docs-asset'], $docsRoot);
}

// --- CSP Nonce generieren ---
$nonce = base64_encode(random_bytes(16));
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-$nonce'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none';");

if (isset($_GET['xtend-rmt-playground']) && $_GET['xtend-rmt-playground'] === 'diagnostics') {
    docsRmtPlaygroundHandleDiagnostics($repoRoot, $docsRmtLspBridgePath);
}

if (isset($_GET['xtend-rmt-playground']) && $_GET['xtend-rmt-playground'] === 'preset') {
    docsRmtPlaygroundHandlePreset($repoRoot);
}

if (isset($_GET['xtend-rmt-playground']) && $_GET['xtend-rmt-playground'] === 'compile') {
    docsRmtPlaygroundHandleCompile($repoRoot, $docsRmtCompilerBridgePath, $docsRmtMaracaPreviewBridgePath);
}

if (is_readable($rmtPilotDocumentPath)) {
    $rmtPilotDecoded = json_decode(file_get_contents($rmtPilotDocumentPath), true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($rmtPilotDecoded)) {
        $rmtPilotDocumentData = $rmtPilotDecoded;
    }
}

function xtendAssetVersion($paths) {
    $version = 1;
    foreach ($paths as $path) {
        if (is_readable($path)) {
            $version = max($version, filemtime($path));
        }
    }
    return (string) $version;
}

$xtendAssetVersion = xtendAssetVersion([
    __DIR__ . '/../xtend.css',
    __DIR__ . '/../xtend-loader.js',
    __DIR__ . '/../fabric/xtend-fabric.js',
    __DIR__ . '/../components/manifest.json',
    __DIR__ . '/../components/xtheme.js',
    __DIR__ . '/../components/xbutton.js',
    __DIR__ . '/../components/xicon.js',
    __DIR__ . '/../components/xlink.js',
    __DIR__ . '/../components/xinput.js',
    __DIR__ . '/../components/xform.js',
    __DIR__ . '/../components/xheader.js',
    __DIR__ . '/../components/xhero.js',
    __DIR__ . '/../components/xrouter.js',
    __DIR__ . '/../components/xfooter.js',
    __DIR__ . '/../components/xcode.js',
    __DIR__ . '/../components/xmodal.js',
    __DIR__ . '/../components/xdialog.js',
    __DIR__ . '/../components/xdrawer.js',
    __DIR__ . '/../components/xpopover.js',
    __DIR__ . '/../components/xtooltip.js',
    __DIR__ . '/../components/xtabs.js',
    __DIR__ . '/../components/xalert.js',
    __DIR__ . '/../components/xtoast.js',
    __DIR__ . '/../components/xselect.js',
    __DIR__ . '/../components/xcheckbox.js',
    __DIR__ . '/../components/xradio.js',
    __DIR__ . '/../components/xtextarea.js',
    __DIR__ . '/../components/xcalendar.js',
    __DIR__ . '/../components/xstatus.js',
    __DIR__ . '/../components/xprogress.js',
    __DIR__ . '/../components/xsidepanel.js',
    __DIR__ . '/../components/xsurfacewindow.js',
    __DIR__ . '/../components/xsurfacemanager.js',
    __DIR__ . '/../icons/favicon.ico',
    __DIR__ . '/../icons/favicon-16x16.png',
    __DIR__ . '/../icons/favicon-32x32.png',
    __DIR__ . '/../icons/apple-touch-icon.png',
    __DIR__ . '/../icons/xtend-scaffold.webp',
    __DIR__ . '/../XTend-Logo.png',
    __DIR__ . '/../docs/utils/page/index.mjs',
    __DIR__ . '/../docs/utils/page/route-controller.mjs',
    __DIR__ . '/../docs/utils/page/shell-descriptor.mjs',
    __DIR__ . '/../docs/utils/page/content-service.mjs',
    __DIR__ . '/../docs/utils/page/locale-service.mjs',
    __DIR__ . '/../docs/utils/page/trusted-content.mjs',
    __DIR__ . '/../docs/utils/page/diagnostics.mjs',
    __DIR__ . '/../docs/utils/page/island-scheduler.mjs',
    __DIR__ . '/../docs/utils/page/playground-island.mjs',
    __DIR__ . '/../docs/utils/dev-api.js',
    __DIR__ . '/../docs/utils/trusted-dom-host.mjs',
    __DIR__ . '/../docs/utils/docs-shell-runtime.mjs',
    __DIR__ . '/../docs/xtendrmt-parsedown-docs.rmt',
    __DIR__ . '/../docs/xtendrmt-parsedown-docs.core.json',
    __DIR__ . '/../docs/xtendrmt-docs-shell-vnext.rmt',
    __DIR__ . '/../docs/xtendrmt-docs-document-v2.rmt',
    __DIR__ . '/../docs/xtendrmt-docs-document-v2.core.json',
    __DIR__ . '/../tools/tooling-bridge.js',
    __DIR__ . '/../tools/tooling-bridge-cli.js',
    __DIR__ . '/../tools/tooling-bridge-client.php',
    __DIR__ . '/../xtend-maraca/plan-runtime.mjs',
    __DIR__ . '/../xtendrmt/rmt-dom-descriptor-renderer.js',
    __DIR__ . '/../xtendrmt/rmt-browser-scheduler.js',
    __DIR__ . '/../xtendrmt/rmt-safe-preview.js',
    __DIR__ . '/../xtendrmt/rmt-php-ssr-adapter.php',
    __DIR__ . '/../api.js',
]);
$xtendAssetVersionAttr = htmlspecialchars($xtendAssetVersion, ENT_QUOTES, 'UTF-8');
$docsFaviconIcoUrl = htmlspecialchars(docsAssetUrl('favicon.ico', $xtendAssetVersion), ENT_QUOTES, 'UTF-8');
$docsFavicon32Url = htmlspecialchars(docsAssetUrl('favicon-32x32.png', $xtendAssetVersion), ENT_QUOTES, 'UTF-8');
$docsFavicon16Url = htmlspecialchars(docsAssetUrl('favicon-16x16.png', $xtendAssetVersion), ENT_QUOTES, 'UTF-8');
$docsAppleTouchIconUrl = htmlspecialchars(docsAssetUrl('apple-touch-icon.png', $xtendAssetVersion), ENT_QUOTES, 'UTF-8');
$docsLogoUrl = htmlspecialchars(docsAssetUrl('xtend-scaffold.webp', $xtendAssetVersion), ENT_QUOTES, 'UTF-8');
$docsLightboxLogoUrl = htmlspecialchars(docsAssetUrl('xtend-logo.png', $xtendAssetVersion), ENT_QUOTES, 'UTF-8');

// Alle Markdown-Dateien finden (rekursiv)
function findMarkdownFiles($dir, $base = '') {
    $files = [];
    if (!is_dir($dir)) return $files;
    foreach (scandir($dir) as $file) {
        if ($file === '.' || $file === '..') continue;
        $path = "$dir/$file";
        $rel = ltrim("$base/$file", '/');
        if (is_dir($path)) {
            $files = array_merge($files, findMarkdownFiles($path, $rel));
        } elseif (preg_match('/\\.md$/i', $file)) {
            $files[$rel] = $path;
        }
    }
    return $files;
}

function docsNormalizeLocale($locale, $availableLocales, $fallbackLocale = 'de') {
    $candidate = strtolower(trim((string) $locale));
    $candidate = preg_replace('/[^a-z-]/', '', $candidate);
    if (isset($availableLocales[$candidate])) return $candidate;
    $short = substr($candidate, 0, 2);
    if (isset($availableLocales[$short])) return $short;
    return isset($availableLocales[$fallbackLocale]) ? $fallbackLocale : array_key_first($availableLocales);
}

function docsSplitLocalizedPath($value, $availableLocales) {
    $path = trim((string) $value);
    $path = preg_replace('/^#\\/?/', '', $path);
    $path = preg_replace('#(^|/)index\\.php/?#', '$1', $path);
    $path = preg_replace('/^\\/+/', '', $path);
    $path = preg_replace('/\\?.*$/', '', $path);
    if ($path === '' || $path === '/') {
        return ['locale' => null, 'slug' => 'readme'];
    }
    $parts = explode('/', $path, 2);
    $first = strtolower($parts[0] ?? '');
    if (isset($availableLocales[$first])) {
        return ['locale' => $first, 'slug' => $parts[1] ?? 'readme'];
    }
    return ['locale' => null, 'slug' => $path];
}

function docsRoutePathFromRequest($basePath) {
    $requestPath = parse_url((string) ($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH);
    if ($requestPath === null || $requestPath === false || $requestPath === '') {
        return 'readme';
    }
    $requestPath = rawurldecode(str_replace('\\', '/', $requestPath));
    $base = docsNormalizeBasePath($basePath);
    if ($base !== '' && ($requestPath === $base || str_starts_with($requestPath, $base . '/'))) {
        $requestPath = substr($requestPath, strlen($base));
    }
    $requestPath = preg_replace('#^/index\\.php/?#', '/', $requestPath);
    $requestPath = trim($requestPath, '/');
    return $requestPath === '' ? 'readme' : $requestPath;
}

function docsBuildHistoryRoutePath($slug, $locale, $basePath = '') {
    $base = docsNormalizeBasePath($basePath);
    $normalizedSlug = trim((string) ($slug ?: 'readme'), '/');
    $path = ($base === '' ? '' : $base) . '/' . docsNormalizeLocale($locale, $GLOBALS['docsAvailableLocales'], $GLOBALS['docsFallbackLocale']) . '/' . $normalizedSlug;
    return $normalizedSlug === 'components' ? $path . '/' : $path;
}

function docsBuildHistoryRootPath($basePath = '') {
    $base = docsNormalizeBasePath($basePath);
    return $base === '' ? '/' : $base;
}

function docsPublicOrigin() {
    $configured = rtrim(trim((string) getenv('XTEND_DOCS_PUBLIC_ORIGIN')), '/');
    if ($configured !== '') {
        $parts = parse_url($configured);
        if (is_array($parts) && in_array(strtolower((string) ($parts['scheme'] ?? '')), ['http', 'https'], true) && !empty($parts['host'])) {
            $port = isset($parts['port']) ? ':' . (int) $parts['port'] : '';
            return strtolower((string) $parts['scheme']) . '://' . $parts['host'] . $port;
        }
    }
    $https = strtolower((string) ($_SERVER['HTTPS'] ?? ''));
    $scheme = $https !== '' && $https !== 'off' ? 'https' : 'http';
    $host = strtolower(trim((string) ($_SERVER['HTTP_HOST'] ?? 'localhost')));
    if (!preg_match('/^(?:\[[0-9a-f:]+\]|[a-z0-9.-]+)(?::[0-9]{1,5})?$/i', $host)) $host = 'localhost';
    return $scheme . '://' . $host;
}

function docsAbsolutePublicUrl($path) {
    return docsPublicOrigin() . '/' . ltrim((string) $path, '/');
}

function docsLocaleTitleSuffix($locale, $availableLocales) {
    return $availableLocales[$locale]['titleSuffix'] ?? 'XTend Dokumentation';
}

function docsBuildLocalizedMarkdownFiles($docsRoot, $availableLocales, $fallbackLocale) {
    $localized = [];
    foreach ($availableLocales as $locale => $config) {
        $localeRoot = $docsRoot . '/' . $locale;
        $localized[$locale] = findMarkdownFiles($localeRoot);
    }
    if (empty($localized[$fallbackLocale])) {
        $rootFiles = findMarkdownFiles($docsRoot);
        $localized[$fallbackLocale] = array_filter($rootFiles, function($path) use ($availableLocales) {
            $first = explode('/', (string) $path, 2)[0] ?? '';
            return !isset($availableLocales[$first]);
        }, ARRAY_FILTER_USE_KEY);
    }
    return $localized;
}

function docsBuildSlugAliases($docsRoot) {
    $menuPath = $docsRoot . '/menu.json';
    if (!is_readable($menuPath)) return [];
    $decoded = json_decode(file_get_contents($menuPath), true);
    if (!is_array($decoded)) return [];
    $aliases = [];
    foreach ($decoded as $entry) {
        if (!is_array($entry) || empty($entry['slug']) || empty($entry['aliases']) || !is_array($entry['aliases'])) continue;
        $canonical = slugify((string) $entry['slug']);
        foreach ($entry['aliases'] as $alias) {
            $normalizedAlias = slugify((string) $alias);
            if ($normalizedAlias !== '' && $normalizedAlias !== $canonical) {
                $aliases[$normalizedAlias] = $canonical;
            }
        }
    }
    return $aliases;
}

function docsLoadJsonContract($filePath, $schema = null) {
    if (!is_readable($filePath)) return null;
    $decoded = json_decode(file_get_contents($filePath), true);
    if (!is_array($decoded)) return null;
    if ($schema !== null && (($decoded['schema'] ?? null) !== $schema)) return null;
    return $decoded;
}

function docsLoadMenuConfig($docsRoot) {
    $decoded = docsLoadJsonContract($docsRoot . '/menu.json');
    return is_array($decoded) && array_is_list($decoded) ? $decoded : [];
}

function docsResolveSlugAlias($slug, $aliases) {
    $requested = (string) $slug;
    $current = $requested;
    $visited = [];
    while (isset($aliases[$current])) {
        if (isset($visited[$current])) return $requested;
        $visited[$current] = true;
        $next = slugify((string) $aliases[$current]);
        if ($next === '') return $requested;
        $current = $next;
    }
    return $current;
}

$localizedMdFiles = docsBuildLocalizedMarkdownFiles($docsRoot, $docsAvailableLocales, $docsFallbackLocale);
$mdFiles = $localizedMdFiles[$docsDefaultLocale] ?? [];

// Slug-Generierung: z.B. components/xalert.md => components-xalert
function slugify($path) {
    return strtolower(preg_replace('/[^a-z0-9]+/i', '-', preg_replace('/\\.md$/i', '', $path)));
}

$docsSlugAliases = docsBuildSlugAliases($docsRoot);
$docsMenuConfig = docsLoadMenuConfig($docsRoot);
$docsNavigationConfig = docsLoadJsonContract($docsRoot . '/navigation.json', 'xtend.docs.navigation.v1') ?? [
    'schema' => 'xtend.docs.navigation.v1',
    'trunks' => []
];

function docsRouteIdFromSlug($slug) {
    return 'docs.' . str_replace('-', '.', $slug);
}

function docsFallbackTitleFromPath($rel) {
    return ucfirst(preg_replace('/[-_]/', ' ', preg_replace('/\\.md$/i', '', basename($rel))));
}

function docsPlainText($value) {
    $text = html_entity_decode((string) $value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace('/[`*_#>\\[\\]()!]+/', ' ', $text);
    $text = preg_replace('/\\s+/', ' ', $text);
    return trim($text);
}

function docsExtractMarkdownTitle($markdown, $rel) {
    if (preg_match('/^#\\s+(.+)$/m', (string) $markdown, $match)) {
        $title = docsPlainText($match[1]);
        if ($title !== '') return $title;
    }
    return docsFallbackTitleFromPath($rel);
}

function docsExtractMarkdownDescription($markdown, $fallbackTitle) {
    $lines = preg_split('/\\R/', (string) $markdown);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0 || strpos($line, '|') === 0 || strpos($line, '- ') === 0) {
            continue;
        }
        $description = docsPlainText($line);
        if ($description !== '') {
            if (function_exists('mb_substr')) {
                return mb_substr($description, 0, 155, 'UTF-8');
            }
            return substr($description, 0, 155);
        }
    }
    return 'XTend Dokumentation: ' . $fallbackTitle;
}

function docsBuildRouteRecord($slug, $rel, $pageMeta) {
    $locale = $pageMeta['locale'] ?? 'de';
    return [
        'id' => docsRouteIdFromSlug($slug),
        'path' => '/' . $locale . '/' . $slug,
        'router' => 'xtend.xrouter',
        'component' => 'docs.page',
        'title' => $pageMeta['title'],
        'documentTitle' => $pageMeta['documentTitle'],
        'titleTemplate' => $pageMeta['titleTemplate'],
        'metaDescription' => $pageMeta['metaDescription'],
        'metaKeywords' => $pageMeta['metaKeywords'],
        'template' => $pageMeta['template'],
        'shell' => $pageMeta['shellTemplate'],
        'schedule' => $pageMeta['schedules']['route'],
        'skeleton' => 'article',
        'skeletonProfile' => 'docs-article',
        'skeletonLines' => 10,
        'skeletonMinHeight' => '26rem',
        'hydration' => [
            'schedule' => $pageMeta['schedules']['hydrate'],
            'policy' => 'visible'
        ],
        'metadata' => [
            'source' => $pageMeta['source'],
            'slug' => $slug,
            'locale' => $locale,
            'requestedLocale' => $pageMeta['requestedLocale'] ?? $locale,
            'resolvedLocale' => $pageMeta['resolvedLocale'] ?? $locale,
            'fallbackLocale' => $pageMeta['fallbackLocale'] ?? 'de',
            'translationAvailable' => $pageMeta['translationAvailable'] ?? true,
            'shellTemplate' => $pageMeta['shellTemplate'],
            'searchTemplate' => $pageMeta['searchTemplate'],
            'contentKind' => $pageMeta['contentKind'],
            'lazyPayload' => true,
            'skeletonLoader' => 'xtend.loader.skeleton-loader.v1',
            'seo' => [
                'title' => $pageMeta['title'],
                'documentTitle' => $pageMeta['documentTitle'],
                'titleTemplate' => $pageMeta['titleTemplate'],
                'description' => $pageMeta['metaDescription'],
                'keywords' => $pageMeta['metaKeywords']
            ]
        ]
    ];
}

function docsBuildPageMeta($slug, $rel, $markdown, $locale = 'de', $requestedLocale = null, $translationAvailable = true) {
    global $docsAvailableLocales, $docsFallbackLocale;
    $title = docsExtractMarkdownTitle($markdown, $rel);
    $description = docsExtractMarkdownDescription($markdown, $title);
    $locale = docsNormalizeLocale($locale, $docsAvailableLocales, $docsFallbackLocale);
    $requestedLocale = docsNormalizeLocale($requestedLocale ?? $locale, $docsAvailableLocales, $docsFallbackLocale);
    $titleSuffix = docsLocaleTitleSuffix($locale, $docsAvailableLocales);
    $keywords = [
        'xtend',
        $locale === 'en' ? 'documentation' : 'dokumentation',
        str_replace('-', ' ', $slug)
    ];
    $pageMeta = [
        'schema' => 'xtend.docs.parsedown-rmt-page.v1',
        'source' => 'docs/' . $locale . '/' . $rel,
        'slug' => $slug,
        'locale' => $locale,
        'requestedLocale' => $requestedLocale,
        'resolvedLocale' => $locale,
        'fallbackLocale' => $docsFallbackLocale,
        'translationAvailable' => (bool) $translationAvailable,
        'routeId' => docsRouteIdFromSlug($slug),
        'path' => '/' . $locale . '/' . $slug,
        'router' => 'xtend.xrouter',
        'title' => $title,
        'documentTitle' => $title . ' | ' . $titleSuffix,
        'titleTemplate' => '{{title}} | ' . $titleSuffix,
        'metaDescription' => $description,
        'metaKeywords' => $keywords,
        'template' => 'docs.' . $slug . '.markdown',
        'shellFirst' => true,
        'shellTemplate' => 'docs.app.shell',
        'searchTemplate' => 'docs.header.search',
        'contentSlot' => 'content',
        'contentKind' => 'parsedownHtml',
        'adapter' => 'docs.parsedown',
        'component' => 'docs.page',
        'markupClass' => 'parsedownHtml',
        'trustBoundary' => 'xtend.security.sanitizing-boundary.v1',
        'lazyPayload' => true,
        'skeletonLoader' => 'xtend.loader.skeleton-loader.v1',
        'schedules' => [
            'shell' => 'docs.shell.render',
            'parse' => 'docs.markdown.parse',
            'route' => 'docs.route.render',
            'hydrate' => 'docs.page.hydrate',
            'search' => 'docs.search.index',
            'rich' => 'docs.rich-content.prepare',
            'media' => 'docs.media.lazy',
            'diagnostics' => 'docs.diagnostics.snapshot'
        ],
        'endpoints' => [
            'shell' => 'xtendrmt.shell.render',
            'parse' => 'xtendrmt.docs.parsedown.parse',
            'route' => 'xtendrmt.route.render',
            'hydrate' => 'xtendrmt.component.hydrate',
            'search' => 'xtendrmt.docs.search.index',
            'rich' => 'xtendrmt.docs.rich-content.prepare',
            'media' => 'xtendrmt.docs.media.lazy',
            'diagnostics' => 'xtendrmt.diagnostics.snapshot'
        ],
        'extensionSlots' => [
            'docs.slot.content',
            'docs.slot.sidebar',
            'docs.slot.related',
            'docs.slot.component-demo',
            'docs.slot.rich-content',
            'docs.slot.media',
            'docs.slot.diagnostics'
        ]
    ];
    $pageMeta['route'] = docsBuildRouteRecord($slug, $rel, $pageMeta);
    return $pageMeta;
}

function docsMergeRmtRoutes($document, $routes) {
    if (!is_array($document)) {
        $document = [
            'kind' => 'rmt_document',
            'version' => '1.0',
            'manifest' => [
                'documentId' => 'docs.xtend.parsedown-pilot',
                'namespace' => 'docs'
            ],
            'routes' => []
        ];
    }
    $indexed = [];
    foreach (($document['routes'] ?? []) as $route) {
        if (is_array($route) && isset($route['id'])) {
            $indexed[$route['id']] = $route;
        }
    }
    foreach ($routes as $route) {
        $id = $route['id'];
        $indexed[$id] = array_replace_recursive($indexed[$id] ?? [], $route);
    }
    $document['routes'] = array_values($indexed);
    $document['metadata']['routeSeoSource'] = 'docs.generated.rmt.routes.v1';
    return $document;
}

function docsRouteAttrValue($value) {
    if (is_array($value)) {
        $value = implode(', ', $value);
    }
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function docsRouteAttributes($route, $pathOverride = null) {
    global $xtendAssetVersionAttr;
    $metadata = $route['metadata'] ?? [];
    $routeId = $route['id'] ?? '';
    $routeRef = $metadata['slug'] ?? $routeId;
    $metaKeywords = $route['metaKeywords'] ?? ($metadata['seo']['keywords'] ?? []);
    if (is_array($metaKeywords)) {
        $metaKeywords = implode(', ', $metaKeywords);
    }
    return [
        'path' => $pathOverride ?? ($route['path'] ?? ''),
        'component' => 'xtend-doc-page',
        'import' => '/docs/utils/page/index.mjs?v=' . $xtendAssetVersionAttr,
        'title' => $route['title'] ?? '',
        'document-title' => $route['documentTitle'] ?? '',
        'title-template' => $route['titleTemplate'] ?? '',
        'meta-description' => $route['metaDescription'] ?? ($metadata['seo']['description'] ?? ''),
        'meta-keywords' => $metaKeywords,
        'skeleton' => $route['skeleton'] ?? 'article',
        'skeleton-profile' => $route['skeletonProfile'] ?? 'docs-article',
        'skeleton-lines' => $route['skeletonLines'] ?? 10,
        'skeleton-min-height' => $route['skeletonMinHeight'] ?? '26rem',
        'hydrate-schedule' => $route['hydration']['schedule'] ?? 'docs.page.hydrate',
        'data-rmt-route-id' => $route['id'] ?? '',
        'data-rmt-route-ref' => $routeRef,
        'data-rmt-router' => $route['router'] ?? 'xtend.xrouter',
        'data-rmt-component' => $route['component'] ?? 'docs.page',
        'data-rmt-template' => $route['template'] ?? '',
        'data-rmt-schedule' => $route['schedule'] ?? '',
        'data-rmt-hydrate-schedule' => $route['hydration']['schedule'] ?? 'docs.page.hydrate'
    ];
}

function docsRenderXRoute($route, $pathOverride = null) {
    $attrs = docsRouteAttributes($route, $pathOverride);
    $parts = [];
    foreach ($attrs as $name => $value) {
        if ($value === null || $value === '' || $value === []) continue;
        $parts[] = $name . '="' . docsRouteAttrValue($value) . '"';
    }
    return '<x-route ' . implode(' ', $parts) . '></x-route>';
}

function docsJsonEncodeForHtml($value) {
    $json = json_encode($value, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT|JSON_INVALID_UTF8_SUBSTITUTE);
    return $json === false ? 'null' : $json;
}

function docsDescriptorText($text) {
    return ['type' => 'text', 'text' => (string) $text];
}

function docsDescriptorElement($tag, $attributes = [], $children = []) {
    return [
        'type' => 'element',
        'tag' => (string) $tag,
        'attributes' => array_filter($attributes, function ($value) {
            return $value !== null && $value !== false && $value !== [];
        }),
        'children' => array_values($children)
    ];
}

function docsDescriptorComponent($tag, $attributes = [], $children = [], $extra = []) {
    return array_replace_recursive([
        'type' => 'component',
        'tag' => (string) $tag,
        'attributes' => array_filter($attributes, function ($value) {
            return $value !== null && $value !== false && $value !== [];
        }),
        'children' => array_values($children)
    ], $extra);
}

function docsTrustedHtmlDescriptor($html, $trustBoundary = 'xtend.security.sanitizing-boundary.v1') {
    return [
        'type' => 'trusted_html',
        'html' => (string) $html,
        'trustBoundary' => (string) $trustBoundary
    ];
}

function docsDocumentSsrMode() {
    $legacy = strtolower(trim((string) getenv('XTEND_DOCS_DOCUMENT_SSR')));
    return $legacy === 'off' ? 'off' : 'v2';
}

function docsRequestedSsrExecutionMode() {
    $mode = strtolower(trim((string) getenv('XTEND_DOCS_SSR_MODE')));
    return $mode === 'hydrate' ? 'server_prerender_hydrate' : 'server_prerender_resume';
}

function docsBase64UrlEncode($value) {
    return rtrim(strtr(base64_encode((string) $value), '+/', '-_'), '=');
}

function docsReadDerLength($der, &$offset) {
    if ($offset >= strlen($der)) return null;
    $length = ord($der[$offset++]);
    if (($length & 0x80) === 0) return $length;
    $octets = $length & 0x7f;
    if ($octets < 1 || $octets > 4 || $offset + $octets > strlen($der)) return null;
    $length = 0;
    for ($index = 0; $index < $octets; $index++) {
        $length = ($length << 8) | ord($der[$offset++]);
    }
    return $length;
}

function docsEcdsaDerToP1363($der, $partLength = 32) {
    $der = (string) $der;
    $offset = 0;
    if ($der === '' || ord($der[$offset++]) !== 0x30) return null;
    $sequenceLength = docsReadDerLength($der, $offset);
    if (!is_int($sequenceLength) || $offset + $sequenceLength !== strlen($der)) return null;
    $parts = [];
    for ($part = 0; $part < 2; $part++) {
        if ($offset >= strlen($der) || ord($der[$offset++]) !== 0x02) return null;
        $length = docsReadDerLength($der, $offset);
        if (!is_int($length) || $length < 1 || $offset + $length > strlen($der)) return null;
        $integer = substr($der, $offset, $length);
        $offset += $length;
        $integer = ltrim($integer, "\0");
        if (strlen($integer) > $partLength) return null;
        $parts[] = str_pad($integer, $partLength, "\0", STR_PAD_LEFT);
    }
    return $offset === strlen($der) ? implode('', $parts) : null;
}

function docsResumeSigningConfiguration() {
    static $configuration = null;
    if (is_array($configuration)) return $configuration;
    $keyFile = trim((string) getenv('XTEND_DOCS_RESUME_PRIVATE_KEY_FILE'));
    $keyId = trim((string) getenv('XTEND_DOCS_RESUME_KEY_ID'));
    $unavailable = function ($code, $message) use (&$configuration) {
        $configuration = [
            'available' => false,
            'diagnostic' => [
                'code' => $code,
                'severity' => 'warning',
                'message' => $message
            ]
        ];
        return $configuration;
    };
    if ($keyFile === '' || $keyId === '') {
        return $unavailable('xtend.docs.resume_key_unavailable', 'Resume signing is not configured; the complete SSR document will use hydrate activation.');
    }
    if (!function_exists('openssl_pkey_get_private') || !function_exists('openssl_sign')) {
        return $unavailable('xtend.docs.resume_openssl_unavailable', 'OpenSSL signing is unavailable; the complete SSR document will use hydrate activation.');
    }
    if (!is_file($keyFile) || !is_readable($keyFile)) {
        return $unavailable('xtend.docs.resume_key_unreadable', 'The configured resume key is unreadable; the complete SSR document will use hydrate activation.');
    }
    $privatePem = file_get_contents($keyFile);
    $privateKey = is_string($privatePem) ? openssl_pkey_get_private($privatePem) : false;
    $details = $privateKey ? openssl_pkey_get_details($privateKey) : false;
    $curve = is_array($details) ? strtolower((string) ($details['ec']['curve_name'] ?? '')) : '';
    if (!$privateKey || !is_array($details) || ($details['type'] ?? null) !== OPENSSL_KEYTYPE_EC || !in_array($curve, ['prime256v1', 'secp256r1'], true)) {
        return $unavailable('xtend.docs.resume_key_invalid', 'The configured resume key must be an EC P-256 private key; the complete SSR document will use hydrate activation.');
    }
    $publicPem = (string) ($details['key'] ?? '');
    $publicDer = base64_decode((string) preg_replace('/-----[^-]+-----|\s+/u', '', $publicPem), true);
    if (!is_string($publicDer) || $publicDer === '') {
        return $unavailable('xtend.docs.resume_public_key_invalid', 'The resume public key could not be exported; the complete SSR document will use hydrate activation.');
    }
    $configuration = [
        'available' => true,
        'keyId' => $keyId,
        'publicKey' => [
            'schema' => 'xtend.docs.resume-public-key.v1',
            'keyId' => $keyId,
            'algorithm' => 'ECDSA-P256-SHA256',
            'format' => 'spki',
            'encoding' => 'base64',
            'value' => base64_encode($publicDer)
        ],
        'sign' => function ($canonical) use ($privateKey, $keyId) {
            $derSignature = '';
            if (!openssl_sign((string) $canonical, $derSignature, $privateKey, OPENSSL_ALGO_SHA256)) {
                throw new RuntimeException('The host P-256 signer rejected the resume envelope.');
            }
            $signature = docsEcdsaDerToP1363($derSignature, 32);
            if (!is_string($signature)) {
                throw new RuntimeException('The host P-256 signature could not be converted to IEEE P1363.');
            }
            return [
                'algorithm' => 'ECDSA-P256-SHA256',
                'keyId' => $keyId,
                'signature' => docsBase64UrlEncode($signature)
            ];
        }
    ];
    return $configuration;
}

function docsDescriptorWithExecutionMode($descriptor, $executionMode) {
    if (!is_array($descriptor)) return $descriptor;
    if (array_is_list($descriptor)) {
        return array_map(fn($entry) => docsDescriptorWithExecutionMode($entry, $executionMode), $descriptor);
    }
    if (isset($descriptor['attributes']) && is_array($descriptor['attributes'])) {
        if (array_key_exists('data-rmt-hydration-mode', $descriptor['attributes'])) {
            $descriptor['attributes']['data-rmt-hydration-mode'] = $executionMode;
        }
        if (($descriptor['attributes']['data-rmt-resume-root'] ?? null) !== null) {
            $descriptor['attributes']['data-rmt-activation-mode'] = $executionMode;
        }
    }
    if (isset($descriptor['children']) && is_array($descriptor['children'])) {
        $descriptor['children'] = docsDescriptorWithExecutionMode($descriptor['children'], $executionMode);
    }
    if (isset($descriptor['nodes']) && is_array($descriptor['nodes'])) {
        $descriptor['nodes'] = docsDescriptorWithExecutionMode($descriptor['nodes'], $executionMode);
    }
    return $descriptor;
}

function docsIsSafeTrustedDomUrl($value) {
    $normalized = strtolower(preg_replace('/[\x00-\x20\x7f]+/u', '', trim((string) $value)) ?? '');
    if ($normalized === '' || $normalized[0] === '#' || $normalized[0] === '/') return true;
    if (str_starts_with($normalized, './') || str_starts_with($normalized, '../')) return true;
    if (str_starts_with($normalized, 'data:')) return str_starts_with($normalized, 'data:image/');
    return !str_starts_with($normalized, 'javascript:')
        && !str_starts_with($normalized, 'vbscript:')
        && !str_starts_with($normalized, 'data:text/html')
        && !str_starts_with($normalized, 'data:text/javascript');
}

function docsSanitizeParsedownHtml($html) {
    $output = (string) $html;
    $blockedTags = ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'form', 'style', 'svg', 'math', 'template'];
    foreach ($blockedTags as $tag) {
        $quoted = preg_quote($tag, '/');
        $output = preg_replace('/<\s*' . $quoted . '\b[^>]*>[\s\S]*?<\s*\/\s*' . $quoted . '\s*>/iu', '', $output);
        $output = preg_replace('/<\s*\/?\s*' . $quoted . '\b[^>]*>/iu', '', (string) $output);
        if ($output === null) return null;
    }
    $output = preg_replace('/\s+on[a-z0-9_-]+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/iu', '', $output);
    $output = preg_replace('/\s+srcdoc\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/iu', '', (string) $output);
    if ($output === null) return null;
    $output = preg_replace_callback('/\s+(href|src|action|poster)\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/iu', function ($matches) {
        $value = trim((string) $matches[2], "'\"");
        return docsIsSafeTrustedDomUrl($value) ? $matches[0] : '';
    }, $output);
    return $output === null ? null : $output;
}

function docsResolveServerMarkdownLinkPath($path, $sourceRel) {
    $normalizedPath = str_replace('\\', '/', (string) $path);
    $normalizedSource = str_replace('\\', '/', (string) $sourceRel);
    if (
        $normalizedPath === ''
        || $normalizedSource === ''
        || str_starts_with($normalizedPath, '/')
        || str_starts_with($normalizedPath, '//')
        || preg_match('/^[a-z][a-z0-9+.-]*:/iu', $normalizedPath)
        || !preg_match('/\.md$/iu', $normalizedPath)
    ) {
        return null;
    }

    $sourceDirectory = dirname($normalizedSource);
    $candidate = ($sourceDirectory === '.' ? '' : trim($sourceDirectory, '/') . '/') . $normalizedPath;
    $segments = [];
    foreach (explode('/', $candidate) as $segment) {
        if ($segment === '' || $segment === '.') continue;
        if ($segment === '..') {
            if (!$segments) return null;
            array_pop($segments);
            continue;
        }
        if (str_contains($segment, "\0")) return null;
        $segments[] = $segment;
    }
    return $segments ? implode('/', $segments) : null;
}

function docsNormalizeServerMarkdownLinks($html, $sourceRel, $fileToSlug, $locale, $docsBasePath = '') {
    return preg_replace_callback('/<a\b([^>]*)\bhref=("|\')([^"\']+)\2([^>]*)>([\s\S]*?)<\/a>/iu', function ($matches) use ($sourceRel, $fileToSlug, $locale, $docsBasePath) {
        $href = html_entity_decode((string) $matches[3], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $parts = preg_split('/([?#].*)/u', $href, 2, PREG_SPLIT_DELIM_CAPTURE);
        $path = $parts[0] ?? '';
        $suffix = $parts[1] ?? '';
        $normalized = docsResolveServerMarkdownLinkPath($path, $sourceRel);
        if (!is_string($normalized)) return $matches[0];
        $lookupPath = $normalized;
        if (!isset($fileToSlug[$lookupPath])) {
            $legacyAlias = preg_replace('/([a-z0-9])([A-Z])/u', '$1-$2', $lookupPath);
            $legacyAlias = is_string($legacyAlias) ? strtolower($legacyAlias) : '';
            if ($legacyAlias === '' || !isset($fileToSlug[$legacyAlias])) return $matches[0];
            $lookupPath = $legacyAlias;
        }
        $slug = (string) $fileToSlug[$lookupPath];
        if ($slug === '') return $matches[0];
        $target = docsBuildHistoryRoutePath($slug, $locale, $docsBasePath) . $suffix;
        $attributes = trim((string) $matches[1] . ' ' . (string) $matches[4]);
        $attributes = $attributes === '' ? '' : ' ' . $attributes;
        return '<a is-x-link="true" data-xtend-component="x-link" navigation="auto" href="' . htmlspecialchars($target, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '"' . $attributes . '>' . $matches[5] . '</a>';
    }, (string) $html);
}

function docsCanonicalizeDocumentTextForProof($html) {
    $text = html_entity_decode(strip_tags((string) $html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $normalized = preg_replace('/\s+/u', ' ', trim($text));
    return is_string($normalized) ? $normalized : null;
}

function docsCanonicalizeDocumentStructureForProof($html) {
    $entries = [];
    $sensitiveTags = array_fill_keys(['a', 'x-link', 'img', 'source', 'video', 'audio', 'object', 'embed', 'iframe', 'script', 'link', 'meta', 'base', 'form', 'button', 'input', 'svg', 'math', 'style', 'template'], true);
    $proofAttributes = array_fill_keys(['href', 'src', 'srcset', 'action', 'formaction', 'poster', 'xlink:href', 'srcdoc', 'style'], true);
    $matched = preg_match_all('/<\s*(\/?)\s*([a-z][a-z0-9:-]*)\b((?:[^>"\']|"[^"]*"|\'[^\']*\')*)>/iu', (string) $html, $tags, PREG_SET_ORDER);
    if ($matched === false) return null;
    foreach ($tags as $match) {
        $closing = ($match[1] ?? '') === '/';
        $tag = strtolower((string) ($match[2] ?? ''));
        if ($tag === '' || $closing) continue;
        $attributes = [];
        $attributeSource = (string) ($match[3] ?? '');
        $attributeMatch = preg_match_all('/([^\s=\/>]+)(?:\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+))?/u', $attributeSource, $attributeTokens, PREG_SET_ORDER);
        if ($attributeMatch === false) return null;
        foreach ($attributeTokens as $attributeToken) {
            $name = strtolower((string) ($attributeToken[1] ?? ''));
            if (!isset($proofAttributes[$name]) && !str_starts_with($name, 'on')) continue;
            $rawValue = (string) ($attributeToken[2] ?? '');
            if (strlen($rawValue) >= 2 && (($rawValue[0] === '"' && substr($rawValue, -1) === '"') || ($rawValue[0] === "'" && substr($rawValue, -1) === "'"))) {
                $rawValue = substr($rawValue, 1, -1);
            }
            $value = html_entity_decode($rawValue, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $value = str_replace(["\r\n", "\r"], "\n", $value);
            $attributes[$name] = $value;
        }
        ksort($attributes, SORT_STRING);
        if (!isset($sensitiveTags[$tag]) && !$attributes) continue;
        $attributePairs = [];
        foreach ($attributes as $name => $value) $attributePairs[] = [$name, $value];
        $entries[] = [$tag, $attributePairs];
    }
    return json_encode($entries, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
}

function docsBuildStaticRelatedLinkDescriptors($html, $currentPath, $locale, $limit = 6) {
    $matches = [];
    $matched = preg_match_all('/<a\b[^>]*\bhref=(?:"([^"]+)"|\'([^\']+)\')[^>]*>([\s\S]*?)<\/a>/iu', (string) $html, $matches, PREG_SET_ORDER);
    if ($matched === false || $matched === 0) return [];
    $seen = [];
    $descriptors = [];
    foreach ($matches as $match) {
        $href = html_entity_decode((string) (($match[1] ?? '') !== '' ? $match[1] : ($match[2] ?? '')), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        if ($href === '' || !str_starts_with($href, '/docs/') || $href === (string) $currentPath || isset($seen[$href])) continue;
        $label = trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags((string) ($match[3] ?? '')), ENT_QUOTES | ENT_HTML5, 'UTF-8')));
        if ($label === '') continue;
        $seen[$href] = true;
        $descriptors[] = docsDescriptorElement('a', [
            'is-x-link' => true,
            'data-xtend-component' => 'x-link',
            'navigation' => 'auto',
            'class' => 'docs-related-link',
            'href' => $href,
            'data-docs-related-source' => 'server-markdown',
            'data-docs-related-locale' => $locale
        ], [docsDescriptorText($label)]);
        if (count($descriptors) >= max(1, (int) $limit)) break;
    }
    return $descriptors;
}

function docsBuildDocumentSsrRecord($html, $meta, $slug, $locale, $path, $sourceRel, $fileToSlug, $docsBasePath = '', &$failureDiagnostic = null) {
    $failureDiagnostic = null;
    $sanitized = docsSanitizeParsedownHtml($html);
    if (!is_string($sanitized)) {
        $failureDiagnostic = [
            'code' => 'xtend.docs.document_ssr_sanitizer_failed',
            'severity' => 'error',
            'message' => 'The active Parsedown document could not be sanitized for server rendering.'
        ];
        return null;
    }
    $normalized = docsNormalizeServerMarkdownLinks($sanitized, $sourceRel, $fileToSlug, $locale, $docsBasePath);
    if (!is_string($normalized)) {
        $failureDiagnostic = [
            'code' => 'xtend.docs.document_ssr_link_normalization_failed',
            'severity' => 'error',
            'message' => 'The sanitized document links could not be normalized for server rendering.'
        ];
        return null;
    }
    $hash = hash('sha256', $normalized);
    $canonicalDomText = docsCanonicalizeDocumentTextForProof($normalized);
    if (!is_string($canonicalDomText)) {
        $failureDiagnostic = [
            'code' => 'xtend.docs.document_ssr_text_proof_failed',
            'severity' => 'error',
            'message' => 'The sanitized document text proof could not be created.'
        ];
        return null;
    }
    $domHash = hash('sha256', $canonicalDomText);
    $canonicalDomStructure = docsCanonicalizeDocumentStructureForProof($normalized);
    if (!is_string($canonicalDomStructure)) {
        $failureDiagnostic = [
            'code' => 'xtend.docs.document_ssr_structure_proof_failed',
            'severity' => 'error',
            'message' => 'The sanitized document structure proof could not be created.'
        ];
        return null;
    }
    $domStructureHash = hash('sha256', $canonicalDomStructure);
    $byteLength = strlen($normalized);
    $staticRelatedLinks = docsBuildStaticRelatedLinkDescriptors($normalized, $path, $locale);
    $routeId = (string) ($meta['routeId'] ?? ($meta['route']['id'] ?? ('docs.' . str_replace('-', '.', (string) $slug))));
    $trustBoundary = (string) ($meta['trustBoundary'] ?? 'xtend.security.sanitizing-boundary.v1');
    $proof = [
        'schema' => 'xtend.docs.document-ssr-proof.v1',
        'htmlAlreadyInDom' => true,
        'path' => (string) $path,
        'slug' => (string) $slug,
        'locale' => (string) $locale,
        'routeId' => $routeId,
        'component' => 'xtend-doc-page',
        'byteLength' => $byteLength,
        'sha256' => $hash,
        'domSha256' => $domHash,
        'domHashBasis' => 'normalized-text-content.v1',
        'domStructureSha256' => $domStructureHash,
        'domStructureHashBasis' => 'sensitive-element-sequence-attributes.v1',
        'markupClass' => 'parsedownHtml',
        'sanitizer' => 'xtend.security.trusted-dom-sanitizer.v1',
        'trustBoundary' => $trustBoundary,
        'adoption' => [
            'owner' => 'x-router',
            'marker' => 'data-xrouter-prerendered-route',
            'mode' => 'move-preserve-node',
            'fallback' => 'client-fetch'
        ]
    ];
    $page = docsDescriptorElement('xtend-doc-page', [
        'data-xrouter-prerendered-route' => true,
        'slot' => 'prerendered-route',
        'data-xrouter-route-path' => $path,
        'data-xrouter-route-id' => $routeId,
        'data-xrouter-route-component' => 'xtend-doc-page',
        'data-xrouter-route-locale' => $locale,
        'data-xrouter-content-sha256' => $hash,
        'data-xrouter-content-bytes' => (string) $byteLength,
        'data-xrouter-dom-sha256' => $domHash,
        'data-xrouter-dom-hash-basis' => 'normalized-text-content.v1',
        'data-xrouter-dom-structure-sha256' => $domStructureHash,
        'data-xrouter-dom-structure-hash-basis' => 'sensitive-element-sequence-attributes.v1',
        'data-xrouter-trust-boundary' => $trustBoundary,
        'data-xrouter-sanitizer' => 'xtend.security.trusted-dom-sanitizer.v1',
        'data-xrouter-sanitized' => 'true',
        'data-docs-route-slug' => $slug,
        'data-docs-route-locale' => $locale,
        'data-docs-route-state' => 'server-rendered',
        'data-xrouter-adoption-pending' => 'true',
        'data-rmt-adoption-state' => 'pending',
        'style' => 'display:block;'
    ], [
        docsDescriptorElement('section', [
            'class' => 'docs-app-shell',
            'aria-label' => 'XTend Developer Center Content Shell',
            'data-rmt-shell' => 'docs.app.shell',
            'data-rmt-shell-mode' => 'document-first',
            'data-rmt-shell-prehydrated' => 'true',
            'data-rmt-hydration-mode' => docsRequestedSsrExecutionMode(),
            'data-rmt-contract' => 'xtend.docs.rmt-shell-primitives.v2',
            'data-rmt-content-sha256' => $hash,
            'data-rmt-component' => 'docs.page',
            'data-rmt-shell-schedule' => $meta['schedules']['shell'] ?? 'docs.shell.render',
            'data-rmt-route-schedule' => $meta['schedules']['route'] ?? 'docs.route.render',
            'data-rmt-hydrate-schedule' => $meta['schedules']['hydrate'] ?? 'docs.page.hydrate',
            'data-xtend-layout-reserve' => 'shell route',
            'data-xtend-cls-anchor' => 'docs.page.shell'
        ], [
            docsDescriptorElement('div', [
                'class' => 'docs-shell-layout',
                'data-rmt-layout' => 'main-sidebar',
                'data-rmt-component' => 'docs.shellLayout',
                'data-xtend-layout-reserve' => 'shell route'
            ], [
                docsDescriptorElement('article', [
                    'class' => 'docs-article-surface',
                    'data-rmt-slot' => 'article',
                    'data-rmt-component' => 'docs.article',
                    'data-xtend-layout-reserve' => 'route content',
                    'data-xtend-cls-anchor' => 'docs.article'
                ], [
                    docsDescriptorElement('div', ['class' => 'docs-shell-toolbar', 'data-rmt-slot' => 'actions'], [
                        docsDescriptorComponent('x-button', [
                            'id' => 'download-link',
                            'class' => 'download-link docs-icon-button',
                            'type' => 'button',
                            'variant' => 'secondary',
                            'aria-label' => $locale === 'en' ? 'Download as Markdown' : 'Download als Markdown',
                            'title' => $locale === 'en' ? 'Download as Markdown' : 'Download als Markdown',
                            'data-rmt-action' => 'docs.download.markdown'
                        ], [])
                    ]),
                    docsDescriptorElement('div', [
                        'id' => 'md-content',
                        'data-rmt-slot' => 'content',
                        'data-rmt-extension-slot' => 'docs.slot.content',
                        'data-rmt-content-kind' => 'parsedownHtml',
                        'data-rmt-markup-class' => 'parsedownHtml',
                        'data-rmt-trust-boundary' => $trustBoundary,
                        'data-rmt-sanitized' => 'true',
                        'data-rmt-sanitizer' => 'xtend.security.trusted-dom-sanitizer.v1',
                        'data-rmt-trusted-dom-proof' => 'xtend.epic13.trusted-dom-boundary.v1',
                        'data-rmt-content-sha256' => $hash,
                        'data-rmt-content-bytes' => (string) $byteLength,
                        'data-rmt-dom-sha256' => $domHash,
                        'data-rmt-dom-hash-basis' => 'normalized-text-content.v1',
                        'data-rmt-dom-structure-sha256' => $domStructureHash,
                        'data-rmt-dom-structure-hash-basis' => 'sensitive-element-sequence-attributes.v1',
                        'data-docs-content-state' => 'server-rendered',
                        'data-xtend-layout-reserve' => 'content'
                    ], [docsTrustedHtmlDescriptor($normalized, $trustBoundary)])
                ]),
                docsDescriptorElement('aside', [
                    'id' => 'docs-page-sidebar',
                    'class' => 'docs-page-sidebar',
                    'data-rmt-slot' => 'sidebar',
                    'data-rmt-extension-slot' => 'docs.slot.sidebar',
                    'data-rmt-component' => 'docs.sidebar',
                    'aria-label' => $locale === 'en' ? 'Documentation tools' : 'Seitliche Dokumentationswerkzeuge'
                ], [
                    docsDescriptorElement('section', [
                        'id' => 'docs-related-links',
                        'class' => 'docs-sidebar-section docs-related-section',
                        'data-rmt-slot' => 'related',
                        'data-rmt-extension-slot' => 'docs.slot.related',
                        'data-rmt-component' => 'docs.relatedLinks',
                        'data-rmt-schedule' => 'docs.related.prepare'
                    ], [
                        docsDescriptorElement('h2', ['class' => 'docs-sidebar-heading'], [
                            docsDescriptorComponent('x-icon', [
                                'name' => 'link',
                                'pack' => 'lucide',
                                'decorative' => true,
                                'size' => '1rem'
                            ], []),
                            docsDescriptorElement('span', [], [docsDescriptorText($locale === 'en' ? 'Read Further' : 'Weiterlesen')])
                        ]),
                        docsDescriptorElement('div', [
                            'class' => 'docs-related-list',
                            'data-rmt-slot' => 'related-links'
                        ], $staticRelatedLinks)
                    ]),
                    docsDescriptorElement('section', [
                        'id' => 'docs-component-demo',
                        'class' => 'docs-sidebar-section docs-component-demo',
                        'hidden' => true,
                        'data-rmt-slot' => 'component-demo',
                        'data-rmt-extension-slot' => 'docs.slot.component-demo',
                        'data-rmt-component' => 'docs.componentDemo',
                        'data-rmt-schedule' => 'docs.demo.prepare'
                    ], []),
                    docsDescriptorElement('aside', [
                        'id' => 'docs-rich-content',
                        'hidden' => true,
                        'data-rmt-slot' => 'rich-content',
                        'data-rmt-extension-slot' => 'docs.slot.rich-content'
                    ], []),
                    docsDescriptorElement('div', [
                        'id' => 'docs-rmt-diagnostics',
                        'hidden' => true,
                        'data-rmt-slot' => 'diagnostics',
                        'data-rmt-extension-slot' => 'docs.slot.diagnostics'
                    ], [])
                ])
            ])
        ])
    ]);
    return ['proof' => $proof, 'descriptor' => $page, 'html' => $normalized];
}

function docsRouteDescriptor($route, $pathOverride = null) {
    return docsDescriptorElement('x-route', docsRouteAttributes($route, $pathOverride), []);
}

function docsRouteBootSkeletonDescriptor($locale, $hidden = false) {
    $articleLines = array_map(function ($width, $index) {
        return docsDescriptorElement('span', [
            'class' => $index === 0 ? 'docs-route-boot-skeleton__line docs-route-boot-skeleton__line--title' : 'docs-route-boot-skeleton__line',
            'style' => 'width: ' . $width . ';'
        ], []);
    }, ['62%', '100%', '91%', '76%'], [0, 1, 2, 3]);
    return docsDescriptorElement('div', [
        'class' => 'docs-route-boot-skeleton',
        'data-docs-route-boot-skeleton' => true,
        'data-xtend-skeleton-fallback' => true,
        'role' => 'status',
        'aria-live' => 'polite',
        'aria-label' => $locale === 'en' ? 'Documentation is loading' : 'Dokumentation wird geladen',
        'hidden' => $hidden ? true : null,
        'style' => $hidden ? 'display:none !important;' : null
    ], [
        docsDescriptorElement('div', ['class' => 'docs-route-boot-skeleton__article', 'aria-hidden' => 'true'], $articleLines),
        docsDescriptorElement('div', ['class' => 'docs-route-boot-skeleton__sidebar', 'aria-hidden' => 'true'], [
            docsDescriptorElement('span', ['class' => 'docs-route-boot-skeleton__link'], []),
            docsDescriptorElement('span', ['class' => 'docs-route-boot-skeleton__link'], [])
        ])
    ]);
}

function docsCompactPageMetaForBootstrap($meta) {
    if (!is_array($meta)) return $meta;
    $compact = [];
    foreach ([
        'schema',
        'source',
        'slug',
        'locale',
        'requestedLocale',
        'resolvedLocale',
        'fallbackLocale',
        'translationAvailable',
        'routeId',
        'path',
        'router',
        'title',
        'documentTitle',
        'titleTemplate',
        'metaDescription',
        'metaKeywords',
        'template',
        'shellFirst',
        'shellTemplate',
        'searchTemplate',
        'contentSlot',
        'contentKind',
        'adapter',
        'component',
        'markupClass',
        'trustBoundary',
        'lazyPayload',
        'skeletonLoader'
    ] as $key) {
        if (array_key_exists($key, $meta)) {
            $compact[$key] = $meta[$key];
        }
    }
    return $compact;
}

function docsCompactMetaMapForBootstrap($metaMap) {
    if (!is_array($metaMap)) return $metaMap;
    $compact = [];
    foreach ($metaMap as $key => $value) {
        $compact[$key] = is_array($value) ? docsCompactPageMetaForBootstrap($value) : $value;
    }
    return $compact;
}

function docsCompactLocalizedMetaForBootstrap($localizedMeta) {
    if (!is_array($localizedMeta)) return $localizedMeta;
    $compact = [];
    foreach ($localizedMeta as $locale => $metaMap) {
        $compact[$locale] = docsCompactMetaMapForBootstrap($metaMap);
    }
    return $compact;
}

function docsCompactMenuForBootstrap($menuConfig) {
    if (!is_array($menuConfig)) return [];
    return array_values(array_map(function ($entry) {
        $compact = [];
        foreach (['id', 'slug', 'label', 'labels', 'parent', 'rank', 'tier', 'icon', 'trunk', 'section'] as $key) {
            if (array_key_exists($key, $entry)) $compact[$key] = $entry[$key];
        }
        return $compact;
    }, $menuConfig));
}

function docsCompactRmtDocumentForBootstrap($document) {
    if (!is_array($document)) return [];
    $compact = [];
    foreach (['kind', 'version', 'manifest', 'adapters', 'components', 'schedules', 'templates', 'extensionSlots'] as $key) {
        if (array_key_exists($key, $document)) $compact[$key] = $document[$key];
    }
    $compact['routes'] = [];
    return $compact;
}

function docsLoadComponentManifest($repoRoot) {
    $manifestPath = rtrim((string) $repoRoot, '/') . '/components/manifest.json';
    if (!is_readable($manifestPath)) return [];
    $decoded = json_decode(file_get_contents($manifestPath), true);
    return is_array($decoded) ? $decoded : [];
}

function docsFindRmtTemplate($document, $templateId) {
    foreach (($document['templates'] ?? []) as $template) {
        if (is_array($template) && (($template['id'] ?? null) === $templateId || ($template['qualifiedId'] ?? null) === $templateId)) {
            return $template;
        }
    }
    return null;
}

function docsMenuEntryLabel($entry, $locale, $fallbackLocale = 'de') {
    $labels = is_array($entry['labels'] ?? null) ? $entry['labels'] : [];
    return (string) ($labels[$locale] ?? $labels[$fallbackLocale] ?? $entry['label'] ?? $entry['slug'] ?? '');
}

function docsSortMenuEntries($entries, $locale) {
    usort($entries, function ($left, $right) use ($locale) {
        $leftRoot = empty($left['parent']) ? 1 : 0;
        $rightRoot = empty($right['parent']) ? 1 : 0;
        if ($leftRoot !== $rightRoot) return $rightRoot <=> $leftRoot;
        $rank = ((int) ($right['rank'] ?? 0)) <=> ((int) ($left['rank'] ?? 0));
        if ($rank !== 0) return $rank;
        return strcasecmp(docsMenuEntryLabel($left, $locale), docsMenuEntryLabel($right, $locale));
    });
    return $entries;
}

function docsBuildSearchShellDescriptor($locale) {
    $isEnglish = $locale === 'en';
    return docsDescriptorComponent('x-form', [
        'id' => 'xtend-search-form',
        'slot' => 'search',
        'class' => 'docs-search-form',
        'data-rmt-template' => 'docs.header.search',
        'data-rmt-component' => 'docs.search',
        'data-rmt-schedule' => 'docs.search.index',
        'role' => 'search'
    ], [
        docsDescriptorElement('label', ['for' => 'search-input', 'class' => 'docs-visually-hidden'], [
            docsDescriptorText($isEnglish ? 'Search documentation' : 'Dokumentation durchsuchen')
        ]),
        docsDescriptorComponent('x-popover', [
            'id' => 'docs-search-popover',
            'class' => 'docs-search-popover',
            'placement' => 'bottom-start',
            'label' => $isEnglish ? 'Search results' : 'Suchergebnisse',
            'data-rmt-component' => 'docs.search.results'
        ], [
            docsDescriptorComponent('x-input', [
                'id' => 'search-input',
                'slot' => 'trigger',
                'name' => 'search',
                'type' => 'search',
                'autocomplete' => 'off',
                'placeholder' => $isEnglish ? 'Search documentation' : 'Dokumentation durchsuchen',
                'aria-controls' => 'search-results',
                'data-rmt-action' => 'docs.search.submit'
            ], []),
            docsDescriptorElement('div', [
                'id' => 'search-results',
                'class' => 'docs-search-results',
                'data-rmt-slot' => 'results',
                'role' => 'listbox',
                'aria-label' => $isEnglish ? 'Documentation search results' : 'Suchergebnisse der Dokumentation'
            ], []),
            docsDescriptorComponent('x-status', [
                'id' => 'docs-search-status',
                'class' => 'docs-search-status',
                'tone' => 'neutral',
                'role' => 'status',
                'aria-live' => 'polite',
                'hidden' => true
            ], [])
        ])
    ]);
}

function docsBuildMenuShellDescriptor($menuConfig, $navigationConfig, $activeSlug, $locale, $fallbackLocale, $docsBasePath) {
    $trunks = is_array($navigationConfig['trunks'] ?? null) ? $navigationConfig['trunks'] : [];
    usort($trunks, fn($left, $right) => ((int) ($right['rank'] ?? 0)) <=> ((int) ($left['rank'] ?? 0)));
    $activeEntry = null;
    foreach ($menuConfig as $entry) {
        if (($entry['slug'] ?? null) === $activeSlug) {
            $activeEntry = $entry;
            break;
        }
    }
    $activeTrunk = (string) ($activeEntry['trunk'] ?? 'start');
    $activeSection = (string) ($activeEntry['section'] ?? 'orientation');
    $trunkLinks = [];

    foreach ($trunks as $trunk) {
        $trunkId = (string) ($trunk['id'] ?? '');
        $entries = array_values(array_filter($menuConfig, fn($entry) => ($entry['trunk'] ?? null) === $trunkId));
        if ($trunkId === '' || empty($entries)) continue;
        $entries = docsSortMenuEntries($entries, $locale);
        $target = $entries[0]['slug'] ?? 'readme';
        $label = (string) (($trunk['labels'][$locale] ?? null) ?: ($trunk['labels'][$fallbackLocale] ?? $trunkId));
        $trunkLinks[] = docsDescriptorComponent('x-link', [
            'class' => 'docs-trunk-link',
            'role' => 'menuitem',
            'href' => docsBuildHistoryRoutePath($target, $locale, $docsBasePath),
            'data-docs-trunk-link' => $trunkId,
            'data-rmt-action' => 'docs.route.navigate',
            'aria-current' => $trunkId === $activeTrunk ? 'page' : null,
            'active' => $trunkId === $activeTrunk ? true : null
        ], [docsDescriptorText($label)]);
    }

    $sectionNodes = [];
    foreach ($trunks as $trunk) {
        if (($trunk['id'] ?? null) !== $activeTrunk) continue;
        foreach (($trunk['sections'] ?? []) as $section) {
            $sectionId = (string) ($section['id'] ?? '');
            $entries = array_values(array_filter($menuConfig, fn($entry) => (
                ($entry['trunk'] ?? null) === $activeTrunk && ($entry['section'] ?? null) === $sectionId
            )));
            if ($sectionId === '' || empty($entries)) continue;
            $entries = docsSortMenuEntries($entries, $locale);
            $links = [];
            foreach ($entries as $entry) {
                $slug = (string) ($entry['slug'] ?? '');
                $isActive = $slug === $activeSlug;
                $links[] = docsDescriptorComponent('x-link', [
                    'class' => 'docs-menu-link',
                    'role' => 'menuitem',
                    'href' => docsBuildHistoryRoutePath($slug, $locale, $docsBasePath),
                    'data-docs-menu-link' => true,
                    'data-doc-id' => (string) ($entry['id'] ?? ('docs.' . str_replace('-', '.', $slug))),
                    'data-doc-rank' => (string) ($entry['rank'] ?? 0),
                    'data-doc-tier' => (string) ($entry['tier'] ?? 'basic'),
                    'data-rmt-action' => 'docs.route.navigate',
                    'aria-current' => $isActive ? 'page' : null,
                    'active' => $isActive ? true : null
                ], [
                    docsDescriptorElement('span', ['class' => 'docs-menu-link-label'], [
                        docsDescriptorText(docsMenuEntryLabel($entry, $locale, $fallbackLocale))
                    ])
                ]);
            }
            $sectionLabel = (string) (($section['labels'][$locale] ?? null) ?: ($section['labels'][$fallbackLocale] ?? $sectionId));
            $sectionPosition = count($sectionNodes);
            $sectionNodes[] = docsDescriptorComponent('x-summary', [
                'class' => 'docs-menu-section',
                'data-docs-menu-section' => $sectionId,
                'data-docs-menu-order' => (string) $sectionPosition,
                'open' => $sectionId === $activeSection ? true : null
            ], [
                docsDescriptorElement('span', ['slot' => 'title', 'class' => 'docs-menu-section-title'], [
                    docsDescriptorText($sectionLabel)
                ]),
                docsDescriptorComponent('x-menu', [
                    'class' => 'docs-menu-section-links',
                    'orientation' => 'vertical',
                    'aria-label' => $sectionLabel
                ], $links)
            ]);
        }
    }

    $sectionSplitIndex = (int) ceil(count($sectionNodes) / 2);
    $sectionColumns = [
        array_slice($sectionNodes, 0, $sectionSplitIndex),
        array_slice($sectionNodes, $sectionSplitIndex)
    ];
    $sectionColumnNodes = [];
    foreach ($sectionColumns as $columnIndex => $columnNodes) {
        if (empty($columnNodes)) continue;
        $sectionColumnNodes[] = docsDescriptorElement('div', [
            'class' => 'docs-active-trunk-column',
            'data-docs-menu-column' => (string) $columnIndex
        ], $columnNodes);
    }

    return docsDescriptorElement('div', [
        'slot' => 'nav',
        'class' => 'docs-menu-shell docs-menu-shell--ssr',
        'data-docs-menu-shell' => true,
        'data-docs-active-trunk' => $activeTrunk,
        'data-rmt-shell-surface' => 'docs.header.nav',
        'role' => 'navigation',
        'aria-label' => $locale === 'en' ? 'Documentation sections' : 'Dokumentationsbereiche'
    ], [
        docsDescriptorComponent('x-menu', [
            'class' => 'docs-trunk-menu',
            'aria-label' => $locale === 'en' ? 'Documentation tasks' : 'Dokumentationsaufgaben'
        ], $trunkLinks),
        docsDescriptorElement('div', [
            'class' => 'docs-active-trunk',
            'data-docs-active-trunk-content' => $activeTrunk
        ], $sectionColumnNodes)
    ]);
}

function docsBuildDocsRootShellDescriptor($allPagesMeta, $localizedAllPagesMeta, $fileToSlug, $docsAvailableLocales, $pageLocale, $docsDefaultLocale, $docsLogoUrl, $xtendAssetVersionAttr, $docsBasePath = '', $menuConfig = [], $navigationConfig = [], $activeSlug = null, $documentSsr = null) {
    $activeSlug = (string) ($activeSlug ?: ($GLOBALS['page'] ?? 'readme'));
    $isEnglish = $pageLocale === 'en';
    $docsTitle = $isEnglish ? 'XTend Documentation' : 'XTend Dokumentation';
    $notFoundTitle = $isEnglish ? 'Page not found' : 'Seite nicht gefunden';
    $notFoundDescription = $isEnglish
        ? 'The requested documentation page was not found.'
        : 'Die angeforderte Dokumentationsseite wurde nicht gefunden.';
    $documentSsrEnabled = is_array($documentSsr) && isset($documentSsr['descriptor'], $documentSsr['proof']);
    $shellContract = $documentSsrEnabled ? 'xtend.docs.rmt-shell-primitives.v2' : 'xtend.docs.rmt-shell-primitives.v1';
    $ssrRoot = [
        'data-rmt-ssr-root' => 'docs.app.root-shell',
        'data-rmt-ssr-chunk' => 'rmt:docs.app.root-shell',
        'data-rmt-shell-prehydrated' => 'true',
        'data-rmt-hydration-mode' => docsRequestedSsrExecutionMode(),
        'data-rmt-contract' => $shellContract
    ];
    $routeChildren = [];
    $activeMeta = $localizedAllPagesMeta[$pageLocale][$activeSlug] ?? $allPagesMeta[$activeSlug] ?? null;
    if (is_array($activeMeta) && isset($activeMeta['route'])) {
        $routeChildren[] = docsRouteDescriptor($activeMeta['route'], docsBuildHistoryRoutePath($activeSlug, $pageLocale, $docsBasePath));
    }
    $routeChildren[] = docsDescriptorElement('x-route', [
        'path' => '*',
        'component' => 'xtend-doc-page',
        'import' => '/docs/utils/page/index.mjs?v=' . $xtendAssetVersionAttr,
        'title' => $notFoundTitle,
        'document-title' => $notFoundTitle . ' | ' . $docsTitle,
        'meta-description' => $notFoundDescription,
        'skeleton' => 'article',
        'skeleton-lines' => '8',
        'skeleton-min-height' => '20rem',
        'hydrate-schedule' => 'docs.page.hydrate',
        'data-rmt-route-id' => 'docs.notFound',
        'data-rmt-router' => 'xtend.xrouter',
        'data-rmt-component' => 'docs.page',
        'data-rmt-schedule' => 'docs.route.render',
        'data-rmt-hydrate-schedule' => 'docs.page.hydrate'
    ], []);

    $languageOptions = [];
    foreach ($docsAvailableLocales as $locale => $localeConfig) {
        $languageOptions[] = docsDescriptorElement('option', [
            'value' => $locale,
            'selected' => $locale === $pageLocale ? true : null
        ], [docsDescriptorText($localeConfig['nativeLabel'] ?? strtoupper($locale))]);
    }
    $menuShell = docsBuildMenuShellDescriptor($menuConfig, $navigationConfig, $activeSlug, $pageLocale, $docsDefaultLocale, $docsBasePath);
    $searchShell = docsBuildSearchShellDescriptor($pageLocale);
    $homePath = docsBuildHistoryRoutePath('readme', $pageLocale, $docsBasePath);

    return docsDescriptorElement('div', [
        'id' => 'xtend-docs-rmt-root',
        'data-rmt-resume-root' => 'true',
        'data-rmt-contract' => 'xtend.docs.php-ssr-resume.v3',
        'data-docs-app-shell' => 'true',
        'style' => 'display:contents;'
    ], [
            docsDescriptorComponent('x-theme', array_replace($ssrRoot, [
                'data-rmt-surface-id' => 'docs.root',
                'data-rmt-shell-surface' => 'docs.root'
            ]), []),
            docsDescriptorComponent('x-header', array_replace($ssrRoot, [
                'logo-size' => '48',
                'sticky' => true,
                'data-xtend-skeleton' => true,
                'data-xtend-layout-reserve' => 'header',
                'data-xtend-cls-anchor' => 'docs.header',
                'style' => '--xtend-skeleton-min-height: var(--docs-header-reserved-block-size); --xtend-layout-reserved-block-size: var(--docs-header-reserved-block-size); --header-reserved-block-size: var(--docs-header-reserved-block-size);',
                'data-rmt-surface-id' => 'docs.header',
                'data-rmt-shell-surface' => 'docs.header'
            ]), array_merge([
                docsDescriptorComponent('x-link', [
                    'id' => 'docs-home-link',
                    'class' => 'docs-home-logo-link',
                    'slot' => 'logo',
                    'href' => $homePath,
                    'data-docs-home-logo' => true,
                    'aria-label' => $pageLocale === 'en' ? 'Open the Docs home page' : 'Docs-Startseite öffnen',
                    'title' => $pageLocale === 'en' ? 'Docs home' : 'Docs-Startseite'
                ], [
                    docsDescriptorElement('img', [
                        'src' => $docsLogoUrl,
                        'alt' => '',
                        'width' => '48',
                        'height' => '48',
                        'draggable' => 'false'
                    ], [])
                ]),
                docsDescriptorElement('span', ['slot' => 'title'], [docsDescriptorText($docsTitle)]),
                $searchShell,
                docsDescriptorElement('span', [
                    'class' => 'docs-language-control',
                    'slot' => 'actions',
                    'data-docs-language-control' => true,
                    'aria-label' => $pageLocale === 'en' ? 'Change language' : 'Sprache wechseln'
                ], [
                    docsDescriptorComponent('x-icon', ['class' => 'docs-language-icon', 'name' => 'globe', 'pack' => 'lucide', 'decorative' => true, 'size' => '1.05rem'], []),
                    docsDescriptorComponent('x-select', [
                        'id' => 'docs-language-select',
                        'class' => 'docs-language-select',
                        'label' => $isEnglish ? 'Language' : 'Sprache',
                        'value' => $pageLocale,
                        'data-docs-language-select' => true
                    ], $languageOptions),
                    docsDescriptorElement('span', ['class' => 'docs-language-status', 'data-docs-language-status' => true, 'role' => 'status', 'aria-live' => 'polite', 'hidden' => true], [
                        docsDescriptorElement('span', ['class' => 'docs-language-status-spinner', 'aria-hidden' => 'true'], []),
                        docsDescriptorElement('span', ['class' => 'docs-language-status-label', 'data-docs-language-status-label' => true], [
                            docsDescriptorText($pageLocale === 'en' ? 'Loading' : 'Laedt')
                        ])
                    ])
                ]),
                docsDescriptorComponent('x-button', [
                    'id' => 'theme-toggle',
                    'class' => 'docs-icon-button docs-theme-toggle',
                    'slot' => 'actions',
                    'type' => 'button',
                    'variant' => 'secondary',
                    'aria-label' => $isEnglish ? 'Enable dark mode' : 'Dunkelmodus aktivieren',
                    'title' => $isEnglish ? 'Enable dark mode' : 'Dunkelmodus aktivieren',
                    'aria-pressed' => 'false'
                ], [
                    docsDescriptorComponent('x-icon', ['id' => 'theme-toggle-icon', 'name' => 'moon', 'pack' => 'core', 'decorative' => true, 'size' => '1.1rem'], []),
                    docsDescriptorElement('span', ['id' => 'theme-toggle-label', 'class' => 'docs-visually-hidden'], [
                        docsDescriptorText($isEnglish ? 'Enable dark mode' : 'Dunkelmodus aktivieren')
                    ])
                ])
            ], [$menuShell])),
            docsDescriptorComponent('x-hero', array_replace($ssrRoot, [
                'class' => 'docs-hero',
                'data-xtend-skeleton' => true,
                'background-light' => 'var(--docs-hero-bg-light)',
                'background-dark' => 'var(--docs-hero-bg-dark)',
                'font-color-light' => 'var(--docs-hero-text-light)',
                'font-color-dark' => 'var(--docs-hero-text-dark)',
                'overlay-light' => 'rgba(255, 255, 255, 0.16)',
                'overlay-dark' => 'rgba(0, 0, 0, 0.28)',
                'align' => 'block',
                'overlay' => true,
                'animate' => true,
                'vertical-align' => 'top',
                'data-xtend-layout-reserve' => 'hero',
                'data-xtend-cls-anchor' => 'docs.hero',
                'style' => '--xtend-skeleton-min-height: var(--docs-hero-reserved-block-size); --xtend-layout-reserved-block-size: var(--docs-hero-reserved-block-size); --hero-reserved-block-size: var(--docs-hero-reserved-block-size);',
                'data-rmt-surface-id' => 'docs.hero',
                'data-rmt-shell-surface' => 'docs.hero'
            ]), [
                docsDescriptorElement('h1', [], [docsDescriptorText('XTend Developer Center')]),
                docsDescriptorElement('p', [], [docsDescriptorText('Build with XTend today')])
            ]),
            docsDescriptorElement('main', array_replace($ssrRoot, [
                'data-rmt-surface-id' => 'docs.main',
                'data-rmt-shell-surface' => 'docs.router-host',
                'data-xtend-layout-reserve' => 'shell route',
                'data-xtend-cls-anchor' => 'docs.main',
                'style' => '--xtend-layout-reserved-block-size: var(--docs-route-reserved-block-size); --xtend-router-reserved-block-size: var(--docs-route-reserved-block-size);'
            ]), [
                docsDescriptorComponent('x-router', [
                    'mode' => 'history',
                    'navigation-policy' => 'progressive',
                    'reuse-component' => true,
                    'adopt-prerendered-route' => $documentSsrEnabled ? true : null,
                    'skeleton' => 'article',
                    'skeleton-profile' => 'docs-article',
                    'skeleton-lines' => '10',
                    'skeleton-min-height' => 'var(--docs-route-reserved-block-size)',
                    'skeleton-label' => $isEnglish ? 'Documentation is loading' : 'Dokumentation wird geladen',
                    'data-xtend-skeleton' => true,
                    'data-xtend-layout-reserve' => 'router route',
                    'data-xtend-cls-anchor' => 'docs.router',
                    'style' => '--xtend-skeleton-min-height: var(--docs-route-reserved-block-size); --xtend-layout-reserved-block-size: var(--docs-route-reserved-block-size); --xtend-router-reserved-block-size: var(--docs-route-reserved-block-size); --xtend-skeleton-width: calc(100% - var(--docs-viewport-gutter) - var(--docs-viewport-gutter)); --xtend-skeleton-max-width: calc(100% - var(--docs-viewport-gutter) - var(--docs-viewport-gutter)); --xtend-skeleton-margin-inline: var(--docs-viewport-gutter);',
                    'document-title-template' => '{{title}} | ' . $docsTitle,
                    'default-title' => $docsTitle,
                    'data-rmt-ssr-root' => 'docs.router',
                    'data-rmt-ssr-chunk' => 'rmt:docs.router',
                    'data-rmt-shell-prehydrated' => 'true',
                    'data-rmt-hydration-mode' => docsRequestedSsrExecutionMode(),
                    'data-rmt-surface-id' => 'docs.router',
                    'data-rmt-shell-surface' => 'docs.router'
                ], array_merge(
                    $routeChildren,
                    $documentSsrEnabled ? [$documentSsr['descriptor']] : [],
                    [docsRouteBootSkeletonDescriptor($pageLocale, $documentSsrEnabled)]
                ))
            ]),
            docsDescriptorComponent('x-footer', array_replace($ssrRoot, [
                'src' => $docsLogoUrl,
                'logo-size' => '32',
                'data-xtend-skeleton' => true,
                'data-xtend-layout-reserve' => 'footer',
                'data-xtend-cls-anchor' => 'docs.footer',
                'style' => '--xtend-skeleton-min-height: var(--docs-footer-reserved-block-size); --xtend-layout-reserved-block-size: var(--docs-footer-reserved-block-size); --footer-reserved-block-size: var(--docs-footer-reserved-block-size); --footer-logo-size: 32px;',
                'data-rmt-surface-id' => 'docs.footer',
                'data-rmt-shell-surface' => 'docs.footer'
            ]), [
                docsDescriptorElement('span', ['slot' => 'title'], [docsDescriptorText('(c) 2026 - CCS Networks | Powered by XRouter PHP Extension')])
            ])
        ]
    );
}

function docsRenderDescriptor($descriptor) {
    if (!is_array($descriptor) || !function_exists('createRmtPhpSsrAdapter')) {
        throw new RuntimeException('The official RMT PHP descriptor renderer is required by the Docs product.');
    }
    $result = createRmtPhpSsrAdapter()->renderDescriptor($descriptor, [
        'requestId' => uniqid('docs-descriptor-', true),
        'progressiveLinks' => true
    ]);
    return (string) ($result['html'] ?? '');
}

function docsRunRmtNodeBridge($bridgePath, $repoRoot, $payload, $schema, $invalidCode, $invalidMessage, $nodeBinary = 'node', $timeoutSeconds = 3) {
    $decodedPayload = json_decode((string) $payload, true);
    $operation = strpos((string) $schema, 'lsp') !== false ? 'language-diagnostics' : 'compile';
    $response = xtendToolingBridgeRequest((string) $bridgePath, (string) $repoRoot, [
        'schema' => 'xtend.compiler.tooling-bridge.v1',
        'requestId' => uniqid('docs-tooling-', true),
        'operation' => $operation,
        'payload' => is_array($decodedPayload) ? $decodedPayload : []
    ], ['nodeBinary' => $nodeBinary, 'timeoutSeconds' => $timeoutSeconds]);
    if (!is_array($response)) return null;
    $result = isset($response['result']) && is_array($response['result']) ? $response['result'] : $response;
    $result['toolingBridgeSchema'] = $response['bridgeSchema'] ?? 'xtend.compiler.tooling-bridge.v1';
    $result['diagnostics'] = $response['diagnostics'] ?? ($result['diagnostics'] ?? []);
    return $result;
}

function docsRmtPlaygroundAcquireConcurrencySlot($name, $schema, $maxConcurrent = 2) {
    $lockDir = sys_get_temp_dir() . '/xtend-rmt-playground-locks';
    if (!is_dir($lockDir)) @mkdir($lockDir, 0700, true);
    if (!is_dir($lockDir) || !is_writable($lockDir)) return null;
    $name = preg_replace('/[^a-z0-9_.-]/i', '-', (string) $name) ?: 'worker';
    for ($index = 0; $index < max(1, (int) $maxConcurrent); $index++) {
        $handle = fopen($lockDir . '/' . $name . '-' . $index . '.lock', 'c');
        if ($handle && flock($handle, LOCK_EX | LOCK_NB)) return $handle;
        if ($handle) fclose($handle);
    }
    docsRmtPlaygroundJson([
        'schema' => (string) $schema,
        'ok' => false,
        'status' => 'busy',
        'diagnostics' => [[
            'schema' => 'xtend.docs.rmt-playground.diagnostic.v1',
            'source' => 'docs-rmt-playground',
            'code' => 'docs.rmt.playground.busy',
            'severity' => 'error',
            'message' => 'The RMT playground is busy. Please retry shortly.'
        ]]
    ], 429);
}

function docsCreateRmtCompilerBridge($bridgePath, $repoRoot, $nodeBinary = 'node') {
    return function ($source, array $context = []) use ($bridgePath, $repoRoot, $nodeBinary) {
        if (!is_readable($bridgePath) || !function_exists('xtendToolingBridgeRequest')) {
            return docsRmtCompilerBridgeError(
                'bridge-unavailable',
                'xtend.docs.rmt_compiler_bridge.unavailable',
                'The docs PHP host could not start the Node vNext compiler bridge.'
            );
        }
        $payload = json_encode([
            'source' => (string) $source,
            'filePath' => $context['filePath'] ?? 'docs/xtendrmt-docs-shell-vnext.rmt',
            'options' => $context['options'] ?? []
        ], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        $result = docsRunRmtNodeBridge($bridgePath, $repoRoot, $payload, 'xtend.docs.rmt-compiler-bridge.v1', 'xtend.docs.rmt_compiler_bridge.output_invalid', 'The Node vNext compiler bridge did not return JSON.', $nodeBinary, $context['timeoutSeconds'] ?? 3);
        if ($result !== null) return $result;
        return [
            'schema' => 'xtend.docs.rmt-compiler-bridge.v1',
            'ok' => false,
            'status' => 'bridge-start-failed',
            'coreDocument' => null,
            'diagnostics' => [[
                'code' => 'xtend.docs.rmt_compiler_bridge.start_failed',
                'severity' => 'error',
                'message' => 'The docs PHP host failed to open the Node vNext compiler bridge.'
            ]]
        ];
    };
}

function docsCreatePrecompiledRmtCompilerBridge($corePath, $expectedSourceSha256, $fallbackCompiler) {
    $coreDocument = null;
    if (is_readable($corePath)) {
        $decoded = json_decode(file_get_contents($corePath), true);
        if (
            json_last_error() === JSON_ERROR_NONE
            && is_array($decoded)
            && ($decoded['schema'] ?? null) === 'xtend.rmt.core-format.vnext.v1'
        ) {
            $coreDocument = $decoded;
        }
    }
    return function ($source, array $context = []) use ($coreDocument, $expectedSourceSha256, $fallbackCompiler) {
        $sourceSha256 = hash('sha256', (string) $source);
        if (
            is_array($coreDocument)
            && is_string($expectedSourceSha256)
            && strlen($expectedSourceSha256) === 64
            && hash_equals($expectedSourceSha256, $sourceSha256)
        ) {
            return [
                'ok' => true,
                'status' => 'compiled-prebuilt',
                'coreDocument' => $coreDocument,
                'diagnostics' => []
            ];
        }
        return is_callable($fallbackCompiler) ? $fallbackCompiler($source, $context) : null;
    };
}

function docsCreateRmtMaracaPreviewBridge($bridgePath, $repoRoot, $nodeBinary = 'node') {
    return function ($source, array $context = []) use ($bridgePath, $repoRoot, $nodeBinary) {
        $featureOptions = is_array($context['maraca'] ?? null) ? $context['maraca'] : [];
        $response = xtendToolingBridgeRequest((string) $bridgePath, (string) $repoRoot, [
            'schema' => 'xtend.compiler.tooling-bridge.v1',
            'requestId' => uniqid('docs-maraca-', true),
            'operation' => 'maraca-plan',
            'payload' => [
                'source' => (string) $source,
                'filePath' => $context['filePath'] ?? 'docs/rmt-playground-source.rmt',
                'options' => array_replace([
                    'profile' => $context['profile'] ?? 'debug',
                    'lazy' => $context['lazy'] ?? 'component',
                    'css' => $context['css'] ?? 'external',
                    'stack' => $context['stack'] ?? 'runtime',
                    'components' => $context['components'] ?? 'document'
                ], $featureOptions)
            ]
        ], ['nodeBinary' => $nodeBinary, 'timeoutSeconds' => $context['timeoutSeconds'] ?? 3]);
        $plan = isset($response['result']) && is_array($response['result']) ? $response['result'] : null;
        $orchestrationSummary = is_array($plan['orchestration']['summary'] ?? null) ? $plan['orchestration']['summary'] : [];
        $validationSummary = is_array($plan['validation']['summary'] ?? null) ? $plan['validation']['summary'] : [];
        $transitionSummary = is_array($plan['transitions']['summary'] ?? null) ? $plan['transitions']['summary'] : [];
        $features = [];
        foreach (['orchestration', 'kernel', 'hydration', 'validation', 'transitions'] as $key) {
            $entry = is_array($plan[$key] ?? null) ? $plan[$key] : [];
            $features[$key] = ['enabled' => ($entry['enabled'] ?? false) === true, 'mode' => $entry['mode'] ?? ($featureOptions[$key] ?? 'auto'), 'status' => $entry['status'] ?? 'unknown', 'supported' => ($entry['supported'] ?? false) === true, 'summary' => $entry['summary'] ?? new stdClass()];
        }
        return [
            'schema' => 'xtend.docs.rmt-playground.maraca-preview.v1',
            'bridgeSchema' => $response['bridgeSchema'] ?? 'xtend.compiler.tooling-bridge.v1',
            'ok' => is_array($plan) && ($plan['ok'] ?? false) === true,
            'status' => $plan['status'] ?? ($response['status'] ?? 'bridge-error'),
            'diagnostics' => $response['diagnostics'] ?? ($plan['diagnostics'] ?? []),
            'summary' => [
                'surfaceCount' => (int) ($orchestrationSummary['surfaceCount'] ?? count($plan['surfaces'] ?? [])),
                'actionCount' => (int) ($orchestrationSummary['actionCount'] ?? 0),
                'eventCount' => (int) ($orchestrationSummary['eventCount'] ?? count($plan['events'] ?? [])),
                'validationGroupCount' => (int) ($validationSummary['groupCount'] ?? 0),
                'transitionCount' => (int) ($transitionSummary['transitionCount'] ?? 0)
            ],
            'features' => $features,
            'runtimeModules' => $plan['runtimeModules'] ?? [],
            'plan' => $plan
        ];
    };
}

function docsCreateRmtLspBridge($bridgePath, $repoRoot, $nodeBinary = 'node') {
    return function ($source, array $context = []) use ($bridgePath, $repoRoot, $nodeBinary) {
        if (!is_readable($bridgePath) || !function_exists('xtendToolingBridgeRequest')) {
            return [
                'schema' => 'xtend.docs.rmt-playground.lsp-bridge.v1',
                'ok' => false,
                'status' => 'bridge-unavailable',
                'diagnostics' => [[
                    'code' => 'xtend.docs.rmt_lsp_bridge.unavailable',
                    'severity' => 'error',
                    'source' => 'xtend-rmt-language-server',
                    'message' => 'The docs PHP host could not start the Node RMT Language Server bridge.'
                ]]
            ];
        }
        $payload = json_encode([
            'source' => (string) $source,
            'filePath' => $context['filePath'] ?? 'docs/rmt-playground-source.rmt',
            'version' => $context['version'] ?? 1,
            'uri' => $context['uri'] ?? null
        ], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        $result = docsRunRmtNodeBridge($bridgePath, $repoRoot, $payload, 'xtend.docs.rmt-playground.lsp-bridge.v1', 'xtend.docs.rmt_lsp_bridge.output_invalid', 'The Node RMT Language Server bridge did not return JSON.', $nodeBinary, $context['timeoutSeconds'] ?? 3);
        if ($result !== null) return $result;
        return [
            'schema' => 'xtend.docs.rmt-playground.lsp-bridge.v1',
            'ok' => false,
            'status' => 'bridge-start-failed',
            'diagnostics' => [[
                'code' => 'xtend.docs.rmt_lsp_bridge.start_failed',
                'severity' => 'error',
                'source' => 'xtend-rmt-language-server',
                'message' => 'The docs PHP host failed to open the Node RMT Language Server bridge.'
            ]]
        ];
    };
}

function docsRmtPlaygroundJson($payload, $statusCode = 200) {
    http_response_code((int) $statusCode);
    header('Content-Type: application/json; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    exit;
}

function docsRmtPlaygroundRangeForOffset($source, $offset) {
    $offset = max(0, min(strlen((string) $source), (int) $offset));
    $prefix = substr((string) $source, 0, $offset);
    $lines = preg_split('/\\R/', $prefix);
    $line = max(0, count($lines) - 1);
    $character = strlen((string) end($lines));
    return [
        'start' => ['line' => $line, 'character' => $character],
        'end' => ['line' => $line, 'character' => $character + 1]
    ];
}

function docsRmtPlaygroundDiagnostic($code, $message, $source, $offset = 0, $severity = 'error') {
    return [
        'schema' => 'xtend.docs.rmt-playground.diagnostic.v1',
        'source' => 'docs-rmt-playground',
        'code' => (string) $code,
        'severity' => (string) $severity,
        'message' => (string) $message,
        'range' => docsRmtPlaygroundRangeForOffset($source, $offset)
    ];
}

function docsRmtPlaygroundNormalizeDiagnostics($diagnostics) {
    if (!is_array($diagnostics)) return [];
    $normalized = [];
    foreach ($diagnostics as $diagnostic) {
        if (!is_array($diagnostic)) continue;
        $message = (string) ($diagnostic['message'] ?? 'Diagnostic');
        $message = preg_replace('/\\bWP-[A-Z0-9-]+\\b/i', 'compiler source', $message);
        $entry = [
            'schema' => 'xtend.docs.rmt-playground.diagnostic.v1',
            'source' => (string) ($diagnostic['source'] ?? 'rmt-language'),
            'code' => (string) ($diagnostic['code'] ?? 'rmt.diagnostic'),
            'severity' => (string) ($diagnostic['severity'] ?? 'info'),
            'message' => $message
        ];
        if (isset($diagnostic['range']) && is_array($diagnostic['range'])) {
            $entry['range'] = $diagnostic['range'];
        }
        $normalized[] = $entry;
    }
    return $normalized;
}

function docsRmtPlaygroundPolicyDiagnostics($source) {
    $source = (string) $source;
    $rules = [
        ['docs.rmt.playground.script_tag', '/<\\s*script\\b/i', 'Script tags are not allowed in playground source.'],
        ['docs.rmt.playground.style_tag', '/<\\s*style\\b/i', 'Style tags are not allowed in playground source.'],
        ['docs.rmt.playground.inline_handler', '/\\bon[a-z]+\\s*=/i', 'Inline event handler attributes are not allowed in playground source.'],
        ['docs.rmt.playground.unsafe_protocol', '/\\bjavascript\\s*:|\\bdata\\s*:\\s*text\\/(?:html|javascript)/i', 'Unsafe URL protocols are not allowed in playground source.'],
        ['docs.rmt.playground.dom_sink', '/\\b(?:innerHTML|outerHTML|insertAdjacentHTML|srcdoc)\\b/i', 'HTML injection sinks are not allowed in playground source.']
    ];
    $diagnostics = [];
    foreach ($rules as $rule) {
        if (preg_match($rule[1], $source, $match, PREG_OFFSET_CAPTURE)) {
            $diagnostics[] = docsRmtPlaygroundDiagnostic($rule[0], $rule[2], $source, $match[0][1]);
        }
    }
    return $diagnostics;
}

function docsRmtPlaygroundProjectSafePreview($repoRoot, $bridgePath, $coreDocument) {
    if (!is_array($coreDocument) || !function_exists('xtendToolingBridgeRequest')) return null;
    $response = xtendToolingBridgeRequest((string) $bridgePath, (string) $repoRoot, [
        'schema' => 'xtend.compiler.tooling-bridge.v1',
        'requestId' => uniqid('docs-safe-preview-', true),
        'operation' => 'safe-preview',
        'payload' => [
            'coreDocument' => $coreDocument,
            'options' => [
                'componentRegistry' => docsLoadComponentManifest($repoRoot),
                'limits' => ['maxDepth' => 32, 'maxNodes' => 1000, 'maxTextBytes' => 65536, 'maxAttributes' => 32]
            ],
            'project' => ['baseUrl' => 'https://xtend.invalid/']
        ]
    ], ['timeoutSeconds' => 3, 'concurrencyLimit' => 2, 'outputLimit' => 16777216]);
    $projection = isset($response['result']) && is_array($response['result']) ? $response['result'] : null;
    return $projection && isset($projection['descriptor']) && is_array($projection['descriptor']) ? $projection : null;
}

function docsRmtPlaygroundProjectedSurfaces($projection) {
    $descriptor = is_array($projection) && is_array($projection['descriptor'] ?? null) ? $projection['descriptor'] : [];
    $children = isset($descriptor['children']) && is_array($descriptor['children']) ? $descriptor['children'] : [];
    $projected = [];
    foreach ($children as $child) {
        if (!is_array($child)) continue;
        $attributes = isset($child['attributes']) && is_array($child['attributes']) ? $child['attributes'] : [];
        $surfaceId = (string) ($attributes['data-rmt-playground-surface'] ?? '');
        if ($surfaceId !== '') $projected[$surfaceId] = $child;
    }
    return $projected;
}

function docsRmtPlaygroundPreviewFromCore($coreDocument, $safePreview = null) {
    if (!is_array($coreDocument)) {
        return [
            'schema' => 'xtend.docs.rmt-playground.preview.v1',
            'documentId' => '',
            'surfaces' => [],
            'surfaceCount' => 0,
            'stateCount' => 0,
            'selectorCount' => 0,
            'actionCount' => 0,
            'resourceCount' => 0
        ];
    }
    $lanesById = [];
    foreach (($coreDocument['lanes'] ?? []) as $lane) {
        if (!is_array($lane)) continue;
        $id = (string) ($lane['id'] ?? '');
        if ($id === '') continue;
        $lanesById[$id] = array_filter([
            'id' => $id,
            'name' => $lane['name'] ?? null,
            'weight' => $lane['weight'] ?? null,
            'operationCount' => isset($lane['operations']) && is_array($lane['operations']) ? count($lane['operations']) : null
        ], function ($value) {
            return $value !== null && $value !== '';
        });
    }
    $surfaces = [];
    $projectedSurfaces = docsRmtPlaygroundProjectedSurfaces($safePreview);
    foreach (($coreDocument['surfaces'] ?? []) as $surface) {
        if (!is_array($surface)) continue;
        $laneRefs = array_values(array_filter($surface['laneRefs'] ?? [], 'is_string'));
        $surfaceLanes = [];
        foreach ($laneRefs as $laneRef) {
            if (isset($lanesById[$laneRef])) $surfaceLanes[] = $lanesById[$laneRef];
        }
        $surfaceId = (string) ($surface['id'] ?? $surface['name'] ?? '');
        $descriptor = $projectedSurfaces[$surfaceId] ?? null;
        $componentPreview = is_array($descriptor) ? [
            'schema' => 'xtend.docs.rmt-playground.component-preview.v1',
            'renderMode' => 'dom_descriptor',
            'renderer' => 'xtendrmt/rmt-dom-descriptor-renderer',
            'tag' => (string) ($descriptor['tag'] ?? ''),
            'descriptor' => $descriptor,
            'model' => [
                'surface' => [
                    'id' => $surface['id'] ?? '',
                    'name' => $surface['name'] ?? '',
                    'kind' => $surface['kind'] ?? '',
                    'component' => $surface['component'] ?? ''
                ],
                'state' => new stdClass()
            ],
            'source' => $surface['source']['ref'] ?? ''
        ] : null;
        $surfaces[] = array_filter([
            'id' => $surface['name'] ?? $surface['id'] ?? '',
            'surfaceId' => $surface['id'] ?? '',
            'kind' => $surface['kind'] ?? '',
            'component' => $surface['component'] ?? '',
            'sourceKind' => $surface['source']['kind'] ?? '',
            'sourceTarget' => $surface['source']['target'] ?? '',
            'bounds' => isset($surface['bounds']) && is_array($surface['bounds']) ? array_filter([
                'x' => $surface['bounds']['x'] ?? null,
                'y' => $surface['bounds']['y'] ?? null,
                'width' => $surface['bounds']['width'] ?? null,
                'height' => $surface['bounds']['height'] ?? null
            ], function ($value) {
                return $value !== null && $value !== '';
            }) : null,
            'lanes' => $surfaceLanes,
            'componentPreview' => $componentPreview
        ], function ($value) {
            return $value !== null && $value !== '' && $value !== [];
        });
    }
    foreach (($coreDocument['remoteSurfaces'] ?? []) as $remoteSurface) {
        if (!is_array($remoteSurface)) continue;
        $exposes = [];
        foreach (($remoteSurface['exposes'] ?? []) as $expose) {
            if (!is_array($expose)) continue;
            $exposes[] = array_filter([
                'name' => $expose['lane'] ?? '',
                'target' => isset($expose['target']) && is_array($expose['target']) ? ($expose['target']['slot'] ?? $expose['target']['ref'] ?? '') : '',
                'weight' => null
            ], function ($value) {
                return $value !== null && $value !== '';
            });
        }
        $surfaces[] = array_filter([
            'id' => $remoteSurface['name'] ?? $remoteSurface['id'] ?? '',
            'surfaceId' => $remoteSurface['id'] ?? '',
            'kind' => $remoteSurface['kind'] ?? 'remote_surface',
            'component' => '',
            'sourceKind' => 'remote',
            'sourceTarget' => $remoteSurface['remote']['id'] ?? '',
            'lanes' => $exposes
        ], function ($value) {
            return $value !== null && $value !== '' && $value !== [];
        });
    }
    return [
        'schema' => 'xtend.docs.rmt-playground.preview.v1',
        'documentId' => (string) ($coreDocument['manifest']['documentId'] ?? ''),
        'surfaces' => array_slice($surfaces, 0, 12),
        'surfaceCount' => count($coreDocument['surfaces'] ?? []),
        'remoteSurfaceCount' => count($coreDocument['remoteSurfaces'] ?? []),
        'stateCount' => count($coreDocument['states'] ?? []),
        'selectorCount' => count($coreDocument['selectors'] ?? []),
        'actionCount' => count($coreDocument['actions'] ?? []),
        'resourceCount' => count($coreDocument['resources'] ?? []),
        'importCount' => count($coreDocument['imports'] ?? [])
    ];
}

function docsRmtPlaygroundReadJsonBody($schema, $maxBodyBytes) {
    $contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
    if ($contentLength > $maxBodyBytes) {
        docsRmtPlaygroundJson([
            'schema' => $schema,
            'ok' => false,
            'status' => 'body_too_large',
            'diagnostics' => [[
                'schema' => 'xtend.docs.rmt-playground.diagnostic.v1',
                'source' => 'docs-rmt-playground',
                'code' => 'docs.rmt.playground.body_too_large',
                'severity' => 'error',
                'message' => 'The playground request body is too large.'
            ]]
        ], 413);
    }
    $rawBody = file_get_contents('php://input');
    if ($rawBody === '' && PHP_SAPI === 'cli') {
        $cliBody = getenv('XTEND_DOCS_RMT_PLAYGROUND_BODY');
        if ($cliBody !== false) {
            $rawBody = (string) $cliBody;
        }
    }
    if ($rawBody === '' && PHP_SAPI === 'cli') {
        $rawBody = file_get_contents('php://stdin');
    }
    if (strlen((string) $rawBody) > $maxBodyBytes) {
        docsRmtPlaygroundJson([
            'schema' => $schema,
            'ok' => false,
            'status' => 'body_too_large',
            'diagnostics' => [[
                'schema' => 'xtend.docs.rmt-playground.diagnostic.v1',
                'source' => 'docs-rmt-playground',
                'code' => 'docs.rmt.playground.body_too_large',
                'severity' => 'error',
                'message' => 'The playground request body is too large.'
            ]]
        ], 413);
    }
    $decoded = json_decode((string) $rawBody, true);
    if (!is_array($decoded)) {
        docsRmtPlaygroundJson([
            'schema' => $schema,
            'ok' => false,
            'status' => 'invalid_json',
            'diagnostics' => [[
                'schema' => 'xtend.docs.rmt-playground.diagnostic.v1',
                'source' => 'docs-rmt-playground',
                'code' => 'docs.rmt.playground.invalid_json',
                'severity' => 'error',
                'message' => 'The playground request body must be JSON.'
            ]]
        ], 400);
    }
    return $decoded;
}

function docsRmtPlaygroundHandleDiagnostics($repoRoot, $bridgePath) {
    $schema = 'xtend.docs.rmt-playground.lsp-diagnostics-response.v1';
    $maxSourceBytes = 64 * 1024;
    $maxBodyBytes = 70 * 1024;
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        header('Allow: POST');
        docsRmtPlaygroundJson([
            'schema' => $schema,
            'ok' => false,
            'status' => 'method_not_allowed',
            'diagnostics' => [[
                'schema' => 'xtend.docs.rmt-playground.diagnostic.v1',
                'source' => 'xtend-rmt-language-server',
                'code' => 'docs.rmt.playground.method_not_allowed',
                'severity' => 'error',
                'message' => 'The playground diagnostics endpoint accepts POST requests only.'
            ]]
        ], 405);
    }
    $decoded = docsRmtPlaygroundReadJsonBody($schema, $maxBodyBytes);
    $source = isset($decoded['source']) ? (string) $decoded['source'] : '';
    if (strlen($source) > $maxSourceBytes) {
        docsRmtPlaygroundJson([
            'schema' => $schema,
            'ok' => false,
            'status' => 'source_too_large',
            'diagnostics' => [docsRmtPlaygroundDiagnostic('docs.rmt.playground.source_too_large', 'The playground source is larger than 64 KB.', $source)]
        ], 413);
    }
    $slot = docsRmtPlaygroundAcquireConcurrencySlot('diagnostics', $schema);
    $bridge = docsCreateRmtLspBridge($bridgePath, $repoRoot);
    $result = $bridge($source, [
        'filePath' => 'docs/rmt-playground-source.rmt',
        'version' => isset($decoded['version']) ? (int) $decoded['version'] : 1,
        'timeoutSeconds' => 3
    ]);
    $diagnostics = docsRmtPlaygroundNormalizeDiagnostics($result['diagnostics'] ?? []);
    docsRmtPlaygroundJson([
        'schema' => $schema,
        'ok' => ($result['ok'] ?? false) === true,
        'status' => (string) ($result['status'] ?? 'diagnostics'),
        'languageMode' => (string) ($result['languageMode'] ?? 'unknown'),
        'diagnosticsSource' => 'xtend-rmt-language-server',
        'diagnostics' => $diagnostics,
        'lspDiagnostics' => $result['lspDiagnostics'] ?? []
    ], 200);
}

function docsRmtPlaygroundHandlePreset($repoRoot) {
    $schema = 'xtend.docs.rmt-playground.preset-response.v1';
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'GET') {
        header('Allow: GET');
        docsRmtPlaygroundJson([
            'schema' => $schema,
            'ok' => false,
            'status' => 'method_not_allowed',
            'diagnostics' => [[
                'schema' => 'xtend.docs.rmt-playground.diagnostic.v1',
                'source' => 'docs-rmt-playground',
                'code' => 'docs.rmt.playground.preset_method_not_allowed',
                'severity' => 'error',
                'message' => 'The playground preset endpoint accepts GET requests only.'
            ]]
        ], 405);
    }
    $presets = [
        'customer-service-kernel' => 'products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt'
    ];
    $name = strtolower(trim((string) ($_GET['name'] ?? '')));
    if (!isset($presets[$name])) {
        docsRmtPlaygroundJson([
            'schema' => $schema,
            'ok' => false,
            'status' => 'preset_not_found',
            'diagnostics' => [[
                'schema' => 'xtend.docs.rmt-playground.diagnostic.v1',
                'source' => 'docs-rmt-playground',
                'code' => 'docs.rmt.playground.preset_not_found',
                'severity' => 'error',
                'message' => 'The requested playground preset is not available.'
            ]]
        ], 404);
    }
    $relativePath = $presets[$name];
    $absolutePath = rtrim((string) $repoRoot, '/') . '/' . $relativePath;
    if (!is_readable($absolutePath)) {
        docsRmtPlaygroundJson([
            'schema' => $schema,
            'ok' => false,
            'status' => 'preset_unavailable',
            'diagnostics' => [[
                'schema' => 'xtend.docs.rmt-playground.diagnostic.v1',
                'source' => 'docs-rmt-playground',
                'code' => 'docs.rmt.playground.preset_unavailable',
                'severity' => 'error',
                'message' => 'The requested playground preset file is unavailable.'
            ]]
        ], 404);
    }
    $source = file_get_contents($absolutePath);
    docsRmtPlaygroundJson([
        'schema' => $schema,
        'ok' => true,
        'status' => 'loaded',
        'name' => $name,
        'sourcePath' => $relativePath,
        'source' => (string) $source,
        'sourceBytes' => strlen((string) $source)
    ], 200);
}

function docsRmtPlaygroundNormalizeMaracaFeatureMode($value) {
    $mode = strtolower(trim((string) $value));
    return in_array($mode, ['auto', 'strict', 'off'], true) ? $mode : 'auto';
}

function docsRmtPlaygroundRequestedMaracaOptions($decoded) {
    if (!is_array($decoded)) return null;
    $mode = strtolower(trim((string) ($decoded['playgroundMode'] ?? $decoded['mode'] ?? '')));
    $maraca = isset($decoded['maraca']) && is_array($decoded['maraca']) ? $decoded['maraca'] : [];
    $requested = $mode === 'maraca-preview'
        || (isset($decoded['maracaPreview']) && filter_var($decoded['maracaPreview'], FILTER_VALIDATE_BOOLEAN))
        || !empty($maraca);
    if (!$requested) return null;
    $result = [];
    foreach (['orchestration', 'kernel', 'hydration', 'validation', 'transitions'] as $feature) {
        $result[$feature] = docsRmtPlaygroundNormalizeMaracaFeatureMode($maraca[$feature] ?? 'auto');
    }
    return $result;
}

function docsRmtPlaygroundMaracaPreviewUnavailable($status, $diagnostics = []) {
    $features = [];
    foreach (['orchestration', 'kernel', 'hydration', 'validation', 'transitions'] as $feature) {
        $features[$feature] = [
            'enabled' => false,
            'mode' => 'auto',
            'status' => (string) $status,
            'supported' => false,
            'summary' => new stdClass()
        ];
    }
    return [
        'schema' => 'xtend.docs.rmt-playground.maraca-preview.v1',
        'ok' => false,
        'status' => (string) $status,
        'diagnostics' => docsRmtPlaygroundNormalizeDiagnostics($diagnostics),
        'summary' => [
            'surfaceCount' => 0,
            'actionCount' => 0,
            'eventCount' => 0,
            'validationGroupCount' => 0,
            'transitionCount' => 0
        ],
        'features' => $features,
        'runtimeModules' => [],
        'plan' => null
    ];
}

function docsRmtPlaygroundCompileMaracaPreview($repoRoot, $bridgePath, $source, $maracaOptions) {
    $bridge = docsCreateRmtMaracaPreviewBridge($bridgePath, $repoRoot);
    $result = $bridge($source, [
        'filePath' => 'docs/rmt-playground-source.rmt',
        'maraca' => is_array($maracaOptions) ? $maracaOptions : [],
        'profile' => 'debug',
        'lazy' => 'component',
        'css' => 'external',
        'stack' => 'runtime',
        'components' => 'document'
    ]);
    $result['diagnostics'] = docsRmtPlaygroundNormalizeDiagnostics($result['diagnostics'] ?? []);
    return $result;
}

function docsRmtPlaygroundHandleCompile($repoRoot, $bridgePath, $maracaBridgePath = null) {
    $schema = 'xtend.docs.rmt-playground.compile-response.v1';
    $maxSourceBytes = 64 * 1024;
    $maxBodyBytes = 70 * 1024;
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        header('Allow: POST');
        docsRmtPlaygroundJson([
            'schema' => $schema,
            'ok' => false,
            'status' => 'method_not_allowed',
            'diagnostics' => [[
                'schema' => 'xtend.docs.rmt-playground.diagnostic.v1',
                'source' => 'docs-rmt-playground',
                'code' => 'docs.rmt.playground.method_not_allowed',
                'severity' => 'error',
                'message' => 'The playground compile endpoint accepts POST requests only.'
            ]]
        ], 405);
    }
    $contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
    if ($contentLength > $maxBodyBytes) {
        docsRmtPlaygroundJson([
            'schema' => $schema,
            'ok' => false,
            'status' => 'body_too_large',
            'diagnostics' => [[
                'schema' => 'xtend.docs.rmt-playground.diagnostic.v1',
                'source' => 'docs-rmt-playground',
                'code' => 'docs.rmt.playground.body_too_large',
                'severity' => 'error',
                'message' => 'The playground request body is too large.'
            ]]
        ], 413);
    }
    $rawBody = file_get_contents('php://input');
    if ($rawBody === '' && PHP_SAPI === 'cli') {
        $cliBody = getenv('XTEND_DOCS_RMT_PLAYGROUND_BODY');
        if ($cliBody !== false) {
            $rawBody = (string) $cliBody;
        }
    }
    if ($rawBody === '' && PHP_SAPI === 'cli') {
        $rawBody = file_get_contents('php://stdin');
    }
    if (strlen((string) $rawBody) > $maxBodyBytes) {
        docsRmtPlaygroundJson([
            'schema' => $schema,
            'ok' => false,
            'status' => 'body_too_large',
            'diagnostics' => [[
                'schema' => 'xtend.docs.rmt-playground.diagnostic.v1',
                'source' => 'docs-rmt-playground',
                'code' => 'docs.rmt.playground.body_too_large',
                'severity' => 'error',
                'message' => 'The playground request body is too large.'
            ]]
        ], 413);
    }
    $decoded = json_decode((string) $rawBody, true);
    if (!is_array($decoded)) {
        docsRmtPlaygroundJson([
            'schema' => $schema,
            'ok' => false,
            'status' => 'invalid_json',
            'diagnostics' => [[
                'schema' => 'xtend.docs.rmt-playground.diagnostic.v1',
                'source' => 'docs-rmt-playground',
                'code' => 'docs.rmt.playground.invalid_json',
                'severity' => 'error',
                'message' => 'The playground request body must be JSON.'
            ]]
        ], 400);
    }
    $source = isset($decoded['source']) ? (string) $decoded['source'] : '';
    $maracaOptions = docsRmtPlaygroundRequestedMaracaOptions($decoded);
    if (strlen($source) > $maxSourceBytes) {
        docsRmtPlaygroundJson([
            'schema' => $schema,
            'ok' => false,
            'status' => 'source_too_large',
            'diagnostics' => [docsRmtPlaygroundDiagnostic('docs.rmt.playground.source_too_large', 'The playground source is larger than 64 KB.', $source)]
        ], 413);
    }
    $policyDiagnostics = docsRmtPlaygroundPolicyDiagnostics($source);
    if (!empty($policyDiagnostics)) {
        $response = [
            'schema' => $schema,
            'ok' => false,
            'status' => 'blocked',
            'diagnostics' => $policyDiagnostics,
            'coreJson' => null,
            'preview' => docsRmtPlaygroundPreviewFromCore(null)
        ];
        if ($maracaOptions !== null) {
            $response['maraca'] = docsRmtPlaygroundMaracaPreviewUnavailable('blocked', $policyDiagnostics);
        }
        docsRmtPlaygroundJson($response, 200);
    }
    $slot = docsRmtPlaygroundAcquireConcurrencySlot('compile', $schema);
    $compiler = docsCreateRmtCompilerBridge($bridgePath, $repoRoot);
    $compiled = $compiler($source, [
        'filePath' => 'docs/rmt-playground-source.rmt',
        'options' => [
            'documentId' => 'docs.rmt.playground',
            'source' => 'docs-rmt-playground'
        ],
        'timeoutSeconds' => 3
    ]);
    $diagnostics = docsRmtPlaygroundNormalizeDiagnostics($compiled['diagnostics'] ?? $compiled['compilerDiagnostics'] ?? []);
    $ok = isset($compiled['ok']) ? (bool) $compiled['ok'] : false;
    $coreDocument = $ok && is_array($compiled['coreDocument'] ?? null) ? $compiled['coreDocument'] : null;
    $safePreview = $coreDocument ? docsRmtPlaygroundProjectSafePreview($repoRoot, $bridgePath, $coreDocument) : null;
    $response = [
        'schema' => $schema,
        'ok' => $ok,
        'status' => (string) ($compiled['status'] ?? ($ok ? 'compiled' : 'failed')),
        'diagnostics' => $diagnostics,
        'coreJson' => $ok ? (string) ($compiled['coreJson'] ?? '') : null,
        'preview' => $ok ? docsRmtPlaygroundPreviewFromCore($coreDocument, $safePreview) : docsRmtPlaygroundPreviewFromCore(null)
    ];
    if ($maracaOptions !== null) {
        $response['maraca'] = ($ok && $maracaBridgePath)
            ? docsRmtPlaygroundCompileMaracaPreview($repoRoot, $maracaBridgePath, $source, $maracaOptions)
            : docsRmtPlaygroundMaracaPreviewUnavailable('compile_failed', $diagnostics);
    }
    docsRmtPlaygroundJson($response, 200);
}

function docsSsrEndpointUrl($page, $locale, $kind = 'shell') {
    $kind = $kind === 'document' ? 'document' : 'shell';
    return docsEndpointPath('xtend-docs-rmt-ssr=' . $kind . '&format=jsonl&page=' . rawurlencode((string) $page) . '&locale=' . rawurlencode((string) $locale));
}

function docsRequestAcceptsRouteFragment() {
    $accept = strtolower((string) ($_SERVER['HTTP_ACCEPT'] ?? ''));
    return str_contains($accept, 'application/vnd.xtend.rmt-route+json');
}

function docsBuildRouteIslandManifest($slug) {
    $islands = [[
        'id' => 'docs.code-enhancements',
        'activation' => 'visible-or-intent',
        'schedule' => 'docs.syntax.highlight',
        'module' => '/components/xcode.js'
    ]];
    if (str_starts_with((string) $slug, 'components-')) {
        $islands[] = [
            'id' => 'docs.component-demo',
            'activation' => 'visible-or-intent',
            'schedule' => 'docs.demo.prepare',
            'module' => '/docs/utils/page/index.mjs'
        ];
    }
    if ($slug === 'learn-rmt-playground') {
        $islands[] = [
            'id' => 'docs.rmt-playground',
            'activation' => 'route-local-intent',
            'schedule' => 'docs.rich-content.prepare',
            'module' => '/docs/utils/page/index.mjs'
        ];
    }
    if ($slug === 'rmt-animation-engine') {
        $islands[] = [
            'id' => 'docs.animation-engine-demo',
            'activation' => 'route-local-visible-or-intent',
            'schedule' => 'docs.animation-engine-demo.hydrate',
            'module' => '/docs/utils/animation-engine-demo.mjs'
        ];
    }
    return [
        'schema' => 'xtend.docs.route-island-manifest.v1',
        'disposal' => 'before-route-commit',
        'islands' => $islands
    ];
}

function docsCreateDocsSsrAdapter($repoRoot, $bridgePath, $sourcePath = null) {
    global $docsRmtDocumentV2Path, $docsRmtDocumentV2CorePath, $docsRmtDocumentV2SourceSha256;
    if (!function_exists('createRmtPhpSsrAdapter')) return null;
    $boundary = 'xtend.security.sanitizing-boundary.v1';
    $compiler = docsCreateRmtCompilerBridge($bridgePath, $repoRoot);
    if (
        is_string($sourcePath)
        && realpath($sourcePath) !== false
        && realpath($sourcePath) === realpath((string) $docsRmtDocumentV2Path)
    ) {
        $compiler = docsCreatePrecompiledRmtCompilerBridge(
            $docsRmtDocumentV2CorePath,
            $docsRmtDocumentV2SourceSha256,
            $compiler
        );
    }
    return createRmtPhpSsrAdapter([
        'progressiveLinks' => true,
        'manifest' => docsLoadComponentManifest($repoRoot),
        'compileRmtVNextSource' => $compiler,
        'defaultTrustBoundary' => $boundary,
        'sanitizeHtmlOutput' => function ($html) {
            $sanitized = docsSanitizeParsedownHtml((string) $html);
            if (!is_string($sanitized)) {
                throw new RuntimeException('The Docs Trusted DOM sanitizer could not produce safe HTML.');
            }
            return $sanitized;
        },
        'staticDataSources' => [
            'xtendrmt.docs.php-ssr.shell' => [
                'html' => '<section data-rmt-stream="xtendrmt.docs.php-ssr.shell" data-rmt-trust-boundary="' . $boundary . '" hidden></section>',
                'trustBoundary' => $boundary
            ],
            'xtendrmt.docs.php-ssr.document' => [
                'html' => '<section data-rmt-stream="xtendrmt.docs.php-ssr.document" data-rmt-trust-boundary="' . $boundary . '" hidden></section>',
                'trustBoundary' => $boundary
            ],
            'xtendrmt.docs.parsedown.parse' => [
                'html' => '<section data-rmt-stream="xtendrmt.docs.parsedown.parse" data-rmt-trust-boundary="' . $boundary . '" hidden></section>',
                'trustBoundary' => $boundary
            ],
            'xtendrmt.docs.related.prepare' => [
                'value' => [],
                'trustBoundary' => $boundary
            ],
            'index.php?xtend-docs-page={slug}&locale={locale}' => [
                'html' => '<section data-rmt-stream="docs.page.payload" data-rmt-trust-boundary="' . $boundary . '" hidden></section>',
                'trustBoundary' => $boundary
            ],
            'index.php?xtend-docs-rmt-ssr=shell&format=jsonl' => [
                'html' => '<section data-rmt-stream="docs.shell.ssr" data-rmt-trust-boundary="xtend.security.streaming-boundary.v1" hidden></section>',
                'trustBoundary' => 'xtend.security.streaming-boundary.v1'
            ],
            'index.php?xtend-docs-rmt-ssr=document&format=jsonl' => [
                'html' => '<section data-rmt-stream="docs.document.ssr" data-rmt-trust-boundary="xtend.security.streaming-boundary.v1" hidden></section>',
                'trustBoundary' => 'xtend.security.streaming-boundary.v1'
            ],
            'docs.page.payload' => [
                'html' => '<section data-rmt-stream="docs.page.payload" data-rmt-trust-boundary="' . $boundary . '" hidden></section>',
                'trustBoundary' => $boundary
            ],
            'docs.shell.ssr' => [
                'html' => '<section data-rmt-stream="docs.shell.ssr" data-rmt-trust-boundary="' . $boundary . '" hidden></section>',
                'trustBoundary' => 'xtend.security.streaming-boundary.v1'
            ],
            'docs.document.ssr' => [
                'html' => '<section data-rmt-stream="docs.document.ssr" data-rmt-trust-boundary="xtend.security.streaming-boundary.v1" hidden></section>',
                'trustBoundary' => 'xtend.security.streaming-boundary.v1'
            ]
        ]
    ]);
}

function docsBuildDocsSsrInput($source, $sourceRef, $descriptor) {
    return [
        'source' => (string) $source,
        'filePath' => (string) $sourceRef,
        'descriptor' => $descriptor
    ];
}

function docsCompactSsrMarkupReference($markup) {
    if (!is_array($markup)) return null;
    $html = isset($markup['html']) ? (string) $markup['html'] : '';
    return array_filter([
        'schema' => $markup['schema'] ?? 'xtend.rmt.node-ssr-markup.v1',
        'htmlAlreadyInDom' => true,
        'byteLength' => strlen($html),
        'sha1' => $html !== '' ? sha1($html) : null
    ], function ($value) {
        return $value !== null && $value !== '';
    });
}

function docsCompactSsrChunkForBootstrap($chunk) {
    if (!is_array($chunk)) return $chunk;
    $compact = [];
    foreach ([
        'schema',
        'kind',
        'key',
        'chunkKey',
        'id',
        'operationId',
        'requestId',
        'sequence',
        'variant',
        'capability',
        'lane',
        'target',
        'templateId',
        'qualifiedId',
        'resourceId',
        'ownershipMode',
        'executionMode',
        'renderedAt'
    ] as $key) {
        if (array_key_exists($key, $chunk)) {
            $compact[$key] = $chunk[$key];
        }
    }
    $markup = docsCompactSsrMarkupReference($chunk['markup'] ?? null);
    if ($markup) {
        $compact['markup'] = $markup;
    }
    if (isset($chunk['diagnostics']) && is_array($chunk['diagnostics'])) {
        $compact['diagnostics'] = $chunk['diagnostics'];
    }
    return $compact;
}

function docsCompactRenderResultForBootstrap($renderResult) {
    if (!is_array($renderResult)) return null;
    return array_filter([
        'schema' => $renderResult['schema'] ?? null,
        'adapterSchema' => $renderResult['adapterSchema'] ?? null,
        'ok' => $renderResult['ok'] ?? false,
        'status' => $renderResult['status'] ?? null,
        'requestId' => $renderResult['requestId'] ?? null,
        'executionMode' => $renderResult['hydration']['executionMode'] ?? null,
        'htmlAlreadyInDom' => true,
        'htmlByteLength' => isset($renderResult['html']) ? strlen((string) $renderResult['html']) : null,
        'head' => $renderResult['head'] ?? null,
        'streamingContract' => $renderResult['streamingContract'] ?? null,
        'componentCapabilities' => $renderResult['componentCapabilities'] ?? null,
        'fabricTelemetryHints' => $renderResult['fabricTelemetryHints'] ?? null,
        'diagnostics' => $renderResult['diagnostics'] ?? []
    ], function ($value) {
        return $value !== null && $value !== [];
    });
}

function docsCompactDocsSsrPrehydrationForBootstrap($payload) {
    if (!is_array($payload)) return $payload;
    $html = isset($payload['html']) ? (string) $payload['html'] : '';
    $compact = [];
    foreach ([
        'schema',
        'ok',
        'status',
        'endpoint',
        'source',
        'compilerBridge',
        'ssrEndpoint',
        'shellPrimitives',
        'document',
        'requestedExecutionMode',
        'executionMode',
        'resumeContract',
        'resumePublicKey',
        'resume',
        'hydration',
        'diagnostics'
    ] as $key) {
        if (array_key_exists($key, $payload)) {
            $compact[$key] = $payload[$key];
        }
    }
    $compact['htmlAlreadyInDom'] = true;
    $compact['htmlByteLength'] = strlen($html);
    $compact['htmlSha1'] = $html !== '' ? sha1($html) : null;
    $compact['chunks'] = array_map('docsCompactSsrChunkForBootstrap', $payload['chunks'] ?? []);
    $compact['renderResult'] = docsCompactRenderResultForBootstrap($payload['renderResult'] ?? null);
    return $compact;
}

function docsRenderedDocumentMatchesProof($html, $proof) {
    if (!is_array($proof) || empty($proof['sha256'])) return false;
    $matched = preg_match('/<div\b(?=[^>]*\bid=(?:"md-content"|\'md-content\'))[^>]*>([\s\S]*?)<\/div>\s*<\/article>/iu', (string) $html, $content);
    if ($matched !== 1) return false;
    return hash_equals((string) $proof['sha256'], hash('sha256', (string) ($content[1] ?? '')));
}

function docsRenderDocsSsrPrehydration($repoRoot, $bridgePath, $sourcePath, $descriptor, $page, $locale, $documentSsr = null, $rootId = 'xtend-docs-rmt-root') {
    $documentSsrEnabled = is_array($documentSsr) && isset($documentSsr['proof']);
    $requestedExecutionMode = $documentSsrEnabled ? docsRequestedSsrExecutionMode() : 'server_prerender_hydrate';
    $executionMode = $requestedExecutionMode;
    $signingConfiguration = docsResumeSigningConfiguration();
    $activationDiagnostics = [];
    if ($executionMode === 'server_prerender_resume' && empty($signingConfiguration['available'])) {
        $executionMode = 'server_prerender_hydrate';
        if (is_array($signingConfiguration['diagnostic'] ?? null)) {
            $activationDiagnostics[] = $signingConfiguration['diagnostic'];
        }
    }
    $descriptor = docsDescriptorWithExecutionMode($descriptor, $executionMode);
    $endpoint = docsSsrEndpointUrl($page, $locale, $documentSsrEnabled ? 'document' : 'shell');
    $sourceRef = 'docs/' . basename((string) $sourcePath);
    $source = is_readable($sourcePath) ? file_get_contents($sourcePath) : '';
    $fallbackHtml = '';
    $fallbackError = null;
    try {
        $fallbackHtml = docsRenderDescriptor($descriptor);
    } catch (Throwable $error) {
        $fallbackError = $error;
    }
    $result = [
        'schema' => $documentSsrEnabled ? 'xtend.docs.php-ssr-prehydration.v2' : 'xtend.docs.php-ssr-prehydration.v1',
        'ok' => false,
        'status' => 'degraded',
        'endpoint' => $endpoint,
        'source' => $sourceRef,
        'compilerBridge' => [
            'schema' => 'xtend.docs.rmt-compiler-bridge.v1',
            'runner' => 'tools/tooling-bridge-cli.js',
            'injected' => false
        ],
        'ssrEndpoint' => [
            'schema' => $documentSsrEnabled ? 'xtend.docs.rmt-ssr-endpoint.v2' : 'xtend.docs.rmt-ssr-endpoint.v1',
            'format' => 'jsonl',
            'contentType' => 'application/x-ndjson',
            'url' => $endpoint
        ],
        'shellPrimitives' => [
            'schema' => $documentSsrEnabled ? 'xtend.docs.rmt-shell-primitives.v2' : 'xtend.docs.rmt-shell-primitives.v1',
            'rootSurfaces' => ['docs.root', 'docs.header', 'docs.hero', 'docs.router', 'docs.page', 'docs.sidebar', 'docs.footer', 'docs.diagnostics'],
            'contentSurfaces' => $documentSsrEnabled ? ['docs.page', 'docs.article', 'docs.sidebar'] : [],
            'ownershipMode' => $documentSsrEnabled ? 'move-preserve-node' : 'hydrate_existing',
            'hydrationMode' => $executionMode,
            'resumeContract' => 'xtend.docs.php-ssr-resume.v3'
        ],
        'document' => $documentSsrEnabled ? $documentSsr['proof'] : null,
        'requestedExecutionMode' => $requestedExecutionMode,
        'executionMode' => $executionMode,
        'resumeContract' => 'xtend.docs.php-ssr-resume.v3',
        'resumePublicKey' => !empty($signingConfiguration['available']) ? $signingConfiguration['publicKey'] : null,
        'resume' => null,
        'renderResult' => null,
        'hydration' => null,
        'chunks' => [],
        'diagnostics' => $activationDiagnostics,
        'html' => $fallbackHtml
    ];
    if ($fallbackError) {
        $result['diagnostics'][] = [
            'code' => 'xtend.docs.php_ssr_descriptor_render_failed',
            'severity' => 'error',
            'message' => $fallbackError->getMessage()
        ];
        return $result;
    }
    if ($source === '') {
        $result['diagnostics'][] = [
            'code' => 'xtend.docs.rmt_shell_source_missing',
            'severity' => 'error',
            'message' => 'The docs vNext shell source could not be read.'
        ];
        return $result;
    }
    $adapter = docsCreateDocsSsrAdapter($repoRoot, $bridgePath, $sourcePath);
    if (!$adapter) {
        $result['diagnostics'][] = [
            'code' => 'xtend.docs.php_ssr_adapter_missing',
            'severity' => 'error',
            'message' => 'The PHP SSR adapter factory is not available.'
        ];
        return $result;
    }
    try {
        $renderOptions = [
            'requestId' => 'docs-php-ssr-' . preg_replace('/[^a-z0-9_-]+/i', '-', (string) $locale . '-' . (string) $page),
            'rootId' => (string) $rootId,
            'namespace' => 'docs',
            'templateId' => 'docs.app.root-shell',
            'executionMode' => $executionMode,
            'progressiveLinks' => true,
            'model' => [
                'page' => $page,
                'locale' => $locale,
                'ssrEndpoint' => $endpoint
            ]
        ];
        if ($executionMode === 'server_prerender_resume') {
            $renderOptions['resume'] = [
                'keyId' => $signingConfiguration['keyId'],
                'sign' => $signingConfiguration['sign'],
                'state' => [
                    'xtend.docs.route' => ['slug' => $page, 'locale' => $locale],
                    'xtend.docs.shell.ready' => true
                ],
                'surfaces' => [
                    'docs.root' => ['status' => 'server-rendered'],
                    'docs.router' => ['path' => docsBuildHistoryRoutePath($page, $locale, $GLOBALS['docsBasePath'] ?? '')],
                    'docs.page' => ['slug' => $page, 'locale' => $locale]
                ],
                'manifests' => [],
                'islandFragments' => []
            ];
        }
        $renderResult = $adapter->render(docsBuildDocsSsrInput($source, $sourceRef, $descriptor), $renderOptions);
        if ($executionMode === 'server_prerender_resume' && ($renderResult['ok'] ?? false) !== true) {
            $resumeDiagnostics = $renderResult['diagnostics'] ?? [];
            $executionMode = 'server_prerender_hydrate';
            $descriptor = docsDescriptorWithExecutionMode($descriptor, $executionMode);
            $renderOptions['executionMode'] = $executionMode;
            unset($renderOptions['resume']);
            $renderResult = $adapter->render(docsBuildDocsSsrInput($source, $sourceRef, $descriptor), $renderOptions);
            $activationDiagnostics[] = [
                'code' => 'xtend.docs.resume_signing_fallback_hydrate',
                'severity' => 'warning',
                'message' => 'Resume signing failed; the complete SSR document was retained and activated through hydration.',
                'resumeDiagnostics' => $resumeDiagnostics
            ];
        }
    } catch (Throwable $error) {
        $result['diagnostics'][] = [
            'code' => 'xtend.docs.php_ssr_adapter_render_failed',
            'severity' => 'error',
            'message' => $error->getMessage()
        ];
        return $result;
    }
    if (
        $documentSsrEnabled
        && ($renderResult['ok'] ?? false) === true
        && !docsRenderedDocumentMatchesProof($renderResult['html'] ?? '', $documentSsr['proof'])
    ) {
        $renderResult['ok'] = false;
        $renderResult['diagnostics'][] = [
            'code' => 'xtend.docs.document_ssr_final_output_mismatch',
            'severity' => 'error',
            'message' => 'The final SSR renderer output no longer matches the sanitized document proof.'
        ];
    }
    $result['renderResult'] = $renderResult;
    $result['hydration'] = $renderResult['hydration'] ?? null;
    $result['executionMode'] = $executionMode;
    $result['shellPrimitives']['hydrationMode'] = $executionMode;
    $result['resume'] = $renderResult['resume'] ?? null;
    $result['chunks'] = $renderResult['chunks'] ?? [];
    $result['diagnostics'] = array_merge($activationDiagnostics, $renderResult['diagnostics'] ?? []);
    $result['html'] = ($renderResult['html'] ?? '') !== '' ? $renderResult['html'] : $fallbackHtml;
    $result['ok'] = ($renderResult['ok'] ?? false) === true;
    $result['status'] = $result['ok']
        ? ($documentSsrEnabled ? ($executionMode === 'server_prerender_resume' ? 'document-resumed' : 'document-prehydrated') : 'prehydrated')
        : ($documentSsrEnabled ? 'document-degraded' : 'degraded');
    $result['compilerBridge']['injected'] = true;
    $result['compilerBridge']['coreSchema'] = $renderResult['hydration']['coreDocumentSchema'] ?? null;
    return $result;
}

// Slug <-> Datei-Mapping
$slugToFile = [];
$fileToSlug = [];
$localizedSlugToFile = [];
$localizedFileToSlug = [];
foreach ($localizedMdFiles as $locale => $localeFiles) {
    $localizedSlugToFile[$locale] = [];
    $localizedFileToSlug[$locale] = [];
    foreach ($localeFiles as $rel => $abs) {
        $slug = slugify($rel);
        $localizedSlugToFile[$locale][$slug] = $rel;
        $localizedFileToSlug[$locale][$rel] = $slug;
        if ($locale === $docsDefaultLocale) {
            $slugToFile[$slug] = $rel;
            $fileToSlug[$rel] = $slug;
        }
    }
}

function docsResolveLocalizedPage($rawSlug, $rawLocale, $localizedSlugToFile, $availableLocales, $fallbackLocale) {
    global $docsSlugAliases;
    $parts = docsSplitLocalizedPath($rawSlug, $availableLocales);
    $requestedLocale = docsNormalizeLocale($parts['locale'] ?? $rawLocale, $availableLocales, $fallbackLocale);
    $requestedSlug = slugify($parts['slug'] ?? 'readme');
    if ($requestedSlug === '') $requestedSlug = 'readme';
    $slug = docsResolveSlugAlias($requestedSlug, $docsSlugAliases);
    $hasRequested = isset($localizedSlugToFile[$requestedLocale][$slug]);
    $resolvedLocale = $hasRequested ? $requestedLocale : $fallbackLocale;
    $translationAvailable = $hasRequested;
    if (!isset($localizedSlugToFile[$resolvedLocale][$slug])) {
        return null;
    }
    return [
        'slug' => $slug,
        'requestedSlug' => $requestedSlug,
        'canonicalSlug' => $slug,
        'aliased' => $requestedSlug !== $slug,
        'requestedLocale' => $requestedLocale,
        'resolvedLocale' => $resolvedLocale,
        'translationAvailable' => $translationAvailable,
        'rel' => $localizedSlugToFile[$resolvedLocale][$slug]
    ];
}

// Routing: Slug aus URL
$docsRequestRoutePath = docsRoutePathFromRequest($docsBasePath);
$pageRequest = docsResolveLocalizedPage($_GET['page'] ?? $docsRequestRoutePath, $_GET['locale'] ?? $docsDefaultLocale, $localizedSlugToFile, $docsAvailableLocales, $docsFallbackLocale);
if ($pageRequest && $pageRequest['aliased'] && !isset($_GET['page']) && !isset($_GET['download']) && !isset($_GET['xtend-docs-page']) && !isset($_GET['xtend-docs-rmt-ssr'])) {
    header('Location: ' . docsBuildHistoryRoutePath($pageRequest['canonicalSlug'], $pageRequest['requestedLocale'], $docsBasePath), true, 308);
    exit;
}
$docsRouteNotFound = $pageRequest === null;
if ($pageRequest) {
    $page = $pageRequest['slug'];
    $pageLocale = $pageRequest['resolvedLocale'];
    $pageRel = $pageRequest['rel'];
    $mdFile = $localizedMdFiles[$pageLocale][$pageRel];
} else {
    $routeParts = docsSplitLocalizedPath($docsRequestRoutePath, $docsAvailableLocales);
    $page = slugify((string) ($routeParts['slug'] ?? 'not-found')) ?: 'not-found';
    $pageLocale = docsNormalizeLocale($routeParts['locale'] ?? $docsDefaultLocale, $docsAvailableLocales, $docsFallbackLocale);
    $pageRel = 'README.md';
    $mdFile = $localizedMdFiles[$docsFallbackLocale][$pageRel] ?? ($docsRoot . '/' . $docsFallbackLocale . '/README.md');
    http_response_code(404);
}

// Download-Handler
if (isset($_GET['download'])) {
    $downloadRequest = docsResolveLocalizedPage($_GET['download'], $_GET['locale'] ?? $docsDefaultLocale, $localizedSlugToFile, $docsAvailableLocales, $docsFallbackLocale);
    if (!$downloadRequest) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=UTF-8');
        echo 'Docs page not found.';
        exit;
    }
    $dlFile = $localizedMdFiles[$downloadRequest['resolvedLocale']][$downloadRequest['rel']];
    header('Content-Type: text/markdown');
    header('Content-Disposition: attachment; filename="' . basename($dlFile) . '"');
    readfile($dlFile);
    exit;
}

// Parsedown einbinden
require_once $parsedownFile;
if (is_readable($rmtPhpSsrAdapterFile)) {
    require_once $rmtPhpSsrAdapterFile;
}
if (is_readable($docsToolingBridgeClientFile)) {
    require_once $docsToolingBridgeClientFile;
}
$Parsedown = new Parsedown();
$Parsedown->setSafeMode(true);

if (docsRequestAcceptsRouteFragment()) {
    header('Content-Type: application/vnd.xtend.rmt-route+json; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
    header('Vary: Accept');
    if (!$pageRequest) {
        http_response_code(404);
        echo json_encode([
            'schema' => 'xtend.docs.route-fragment.v1',
            'ok' => false,
            'status' => 404,
            'error' => 'route-not-found',
            'fallbackHref' => docsBuildHistoryRoutePath($page, $pageLocale, $docsBasePath)
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    $fragmentSlug = $pageRequest['slug'];
    $fragmentLocale = $pageRequest['resolvedLocale'];
    $fragmentRel = $pageRequest['rel'];
    $fragmentMarkdown = file_get_contents($localizedMdFiles[$fragmentLocale][$fragmentRel]);
    $fragmentMeta = docsBuildPageMeta(
        $fragmentSlug,
        $fragmentRel,
        $fragmentMarkdown,
        $fragmentLocale,
        $pageRequest['requestedLocale'],
        $pageRequest['translationAvailable']
    );
    $fragmentPath = docsBuildHistoryRoutePath($fragmentSlug, $fragmentLocale, $docsBasePath);
    $fragmentDiagnostic = null;
    $fragmentDocument = docsBuildDocumentSsrRecord(
        $Parsedown->text($fragmentMarkdown),
        $fragmentMeta,
        $fragmentSlug,
        $fragmentLocale,
        $fragmentPath,
        $fragmentRel,
        $localizedFileToSlug[$fragmentLocale] ?? $fileToSlug,
        $docsBasePath,
        $fragmentDiagnostic
    );
    if (!is_array($fragmentDocument)) {
        http_response_code(500);
        echo json_encode([
            'schema' => 'xtend.docs.route-fragment.v1',
            'ok' => false,
            'status' => 500,
            'error' => 'route-fragment-preparation-failed',
            'diagnostics' => array_values(array_filter([$fragmentDiagnostic])),
            'fallbackHref' => $fragmentPath
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    $fragmentRender = docsRenderDocsSsrPrehydration(
        $repoRoot,
        $docsRmtCompilerBridgePath,
        $docsRmtDocumentV2Path,
        $fragmentDocument['descriptor'],
        $fragmentSlug,
        $fragmentLocale,
        $fragmentDocument,
        'xtend-docs-route-root'
    );
    $fragmentHreflang = [];
    foreach ($docsAvailableLocales as $locale => $localeConfig) {
        if (!isset($localizedSlugToFile[$locale][$fragmentSlug])) continue;
        $fragmentHreflang[$localeConfig['htmlLang'] ?? $locale] = docsAbsolutePublicUrl(
            docsBuildHistoryRoutePath($fragmentSlug, $locale, $docsBasePath)
        );
    }
    echo json_encode([
        'schema' => 'xtend.docs.route-fragment.v1',
        'ok' => ($fragmentRender['ok'] ?? false) === true,
        'status' => 200,
        'href' => $fragmentPath,
        'fallbackHref' => $fragmentPath,
        'slug' => $fragmentSlug,
        'locale' => $fragmentLocale,
        'requestedLocale' => $pageRequest['requestedLocale'],
        'resolvedLocale' => $fragmentLocale,
        'translationAvailable' => $pageRequest['translationAvailable'],
        'html' => $fragmentDocument['html'],
        'routeHtml' => $fragmentRender['html'] ?? '',
        'headPatch' => [
            'schema' => 'xtend.docs.route-head-patch.v1',
            'lang' => $docsAvailableLocales[$fragmentLocale]['htmlLang'] ?? $fragmentLocale,
            'title' => $fragmentMeta['documentTitle'] ?? $fragmentMeta['title'] ?? '',
            'description' => $fragmentMeta['metaDescription'] ?? '',
            'canonical' => docsAbsolutePublicUrl($fragmentPath),
            'hreflang' => $fragmentHreflang,
            'robots' => $pageRequest['translationAvailable'] ? 'index,follow' : 'noindex,follow'
        ],
        'meta' => $fragmentMeta,
        'contentProof' => $fragmentDocument['proof'],
        'islandManifest' => docsBuildRouteIslandManifest($fragmentSlug),
        'executionMode' => $fragmentRender['executionMode'] ?? 'server_prerender_hydrate',
        'resumeContract' => 'xtend.docs.php-ssr-resume.v3',
        'resumeEnvelope' => $fragmentRender['resume'] ?? null,
        'resumePublicKey' => $fragmentRender['resumePublicKey'] ?? null,
        'diagnostics' => $fragmentRender['diagnostics'] ?? []
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

if (isset($_GET['xtend-docs-page'])) {
    $pagePayloadRequest = docsResolveLocalizedPage($_GET['xtend-docs-page'], $_GET['locale'] ?? $docsDefaultLocale, $localizedSlugToFile, $docsAvailableLocales, $docsFallbackLocale);
    if (!$pagePayloadRequest) {
        $requestedSlug = slugify((string) $_GET['xtend-docs-page']);
        http_response_code(404);
        header('Content-Type: application/json; charset=UTF-8');
        header('X-Content-Type-Options: nosniff');
        echo json_encode([
            'schema' => 'xtend.docs.parsedown-rmt-page-payload.v1',
            'ok' => false,
            'slug' => $requestedSlug,
            'requestedLocale' => docsNormalizeLocale($_GET['locale'] ?? $docsDefaultLocale, $docsAvailableLocales, $docsFallbackLocale),
            'fallbackLocale' => $docsFallbackLocale,
            'translationAvailable' => false,
            'error' => 'docs-page-not-found'
        ], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        exit;
    }

    $requestedSlug = $pagePayloadRequest['slug'];
    $requestedLocale = $pagePayloadRequest['requestedLocale'];
    $resolvedLocale = $pagePayloadRequest['resolvedLocale'];
    $rel = $pagePayloadRequest['rel'];
    $markdown = file_get_contents($localizedMdFiles[$resolvedLocale][$rel]);
    $meta = docsBuildPageMeta($requestedSlug, $rel, $markdown, $resolvedLocale, $requestedLocale, $pagePayloadRequest['translationAvailable']);
    header('Content-Type: application/json; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
    echo json_encode([
        'schema' => 'xtend.docs.parsedown-rmt-page-payload.v1',
        'ok' => true,
        'slug' => $requestedSlug,
        'requestedSlug' => $pagePayloadRequest['requestedSlug'],
        'canonicalSlug' => $pagePayloadRequest['canonicalSlug'],
        'aliased' => $pagePayloadRequest['aliased'],
        'locale' => $resolvedLocale,
        'requestedLocale' => $requestedLocale,
        'resolvedLocale' => $resolvedLocale,
        'fallbackLocale' => $docsFallbackLocale,
        'translationAvailable' => $pagePayloadRequest['translationAvailable'],
        'html' => $Parsedown->text($markdown),
        'meta' => $meta,
        'source' => $meta['source'],
        'schedule' => $meta['schedules']['parse'],
        'endpoint' => $meta['endpoints']['parse'],
        'skeletonLoader' => 'xtend.loader.skeleton-loader.v1'
    ], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    exit;
}

// --- After parsing all pages: JS object for all page content ---
$allPages = [];
$allPagesMeta = [];
$localizedAllPages = [];
$localizedAllPagesMeta = [];
$localizedTitles = [];
$docsRmtRoutes = [];
$titles = [];
foreach ($localizedFileToSlug as $locale => $localeFileToSlug) {
    $localizedAllPages[$locale] = [];
    $localizedAllPagesMeta[$locale] = [];
    $localizedTitles[$locale] = [];
    foreach ($localeFileToSlug as $rel => $slug) {
        // The initial document carries only the requested route (plus the
        // default README metadata used by the canonical home alias). Every
        // other SPA route remains behind the existing lazy page endpoint.
        $isDefaultReadme = $locale === $docsDefaultLocale && $slug === 'readme';
        if ($slug !== $page && !$isDefaultReadme) continue;
        $mdFile = $localizedMdFiles[$locale][$rel];
        $mdContent = file_get_contents($mdFile);
        $meta = docsBuildPageMeta($slug, $rel, $mdContent, $locale, $locale, true);
        $localizedAllPagesMeta[$locale][$slug] = $meta;
        $activeHtml = null;
        if ($slug === $page && $locale === $pageLocale) {
            $activeHtml = $Parsedown->text($mdContent);
            $localizedAllPages[$locale][$slug] = $activeHtml;
        }
        $localizedTitles[$locale][$slug] = $meta['title'];
        if ($locale === $docsDefaultLocale) {
            $allPagesMeta[$slug] = $meta;
            if ($slug === $page && $locale === $pageLocale) {
                $allPages[$slug] = $activeHtml;
            }
            $docsRmtRoutes[] = $meta['route'];
            $titles[$slug] = $meta['title'];
        }
    }
}
$initialLocaleConfig = $docsAvailableLocales[$pageLocale] ?? $docsAvailableLocales[$docsDefaultLocale];
$readmeTitle = $localizedAllPagesMeta[$docsDefaultLocale]['readme']['title'] ?? 'XTend Dokumentation';
$readmeDocumentTitle = $localizedAllPagesMeta[$docsDefaultLocale]['readme']['documentTitle'] ?? 'XTend Dokumentation';
$readmeDescription = $localizedAllPagesMeta[$docsDefaultLocale]['readme']['metaDescription'] ?? 'XTend Dokumentation';
$docsRmtRoutes[] = array_replace_recursive($allPagesMeta['readme']['route'] ?? [], [
    'id' => 'docs.home',
    'path' => '/',
    'title' => $readmeTitle,
    'documentTitle' => $readmeDocumentTitle,
    'metadata' => [
        'source' => 'docs/' . $docsDefaultLocale . '/README.md',
        'seo' => [
            'title' => $readmeTitle,
            'documentTitle' => $readmeDocumentTitle,
            'description' => $readmeDescription
        ]
    ]
]);
$rmtPilotDocumentData = docsMergeRmtRoutes($rmtPilotDocumentData, $docsRmtRoutes);
$initialDocsSlug = $docsRouteNotFound
    ? $page
    : (isset($localizedAllPagesMeta[$pageLocale][$page]) ? $page : 'readme');
$initialDocumentRel = $initialDocsSlug === $page ? $pageRel : array_search($initialDocsSlug, $localizedFileToSlug[$pageLocale] ?? [], true);
if (!is_string($initialDocumentRel) || $initialDocumentRel === '') $initialDocumentRel = 'README.md';
$rmtPilotDocumentJson = docsJsonEncodeForHtml(docsCompactRmtDocumentForBootstrap($rmtPilotDocumentData));
$docsBootstrapMenuConfig = docsCompactMenuForBootstrap($docsMenuConfig);
$docsBootstrapLocalizedMeta = [];
$docsBootstrapLocalizedTitles = [];
foreach (array_keys($docsAvailableLocales) as $locale) {
    $docsBootstrapLocalizedMeta[$locale] = isset($localizedAllPagesMeta[$locale][$initialDocsSlug])
        ? [$initialDocsSlug => docsCompactPageMetaForBootstrap($localizedAllPagesMeta[$locale][$initialDocsSlug])]
        : [];
    $docsBootstrapLocalizedTitles[$locale] = isset($localizedTitles[$locale][$initialDocsSlug])
        ? [$initialDocsSlug => $localizedTitles[$locale][$initialDocsSlug]]
        : [];
}
$docsBootstrapPageMeta = isset($localizedAllPagesMeta[$pageLocale][$initialDocsSlug])
    ? [$initialDocsSlug => docsCompactPageMetaForBootstrap($localizedAllPagesMeta[$pageLocale][$initialDocsSlug])]
    : [];
$docsBootstrapTitles = isset($localizedTitles[$pageLocale][$initialDocsSlug])
    ? [$initialDocsSlug => $localizedTitles[$pageLocale][$initialDocsSlug]]
    : [];
$notFoundPageTitle = $pageLocale === 'en' ? 'Page not found' : 'Seite nicht gefunden';
$notFoundPageDescription = $pageLocale === 'en'
    ? 'The requested XTend documentation page does not exist or has been moved.'
    : 'Die angeforderte XTend-Dokumentationsseite existiert nicht oder wurde verschoben.';
$initialTitle = $docsRouteNotFound
    ? $notFoundPageTitle . ' | ' . docsLocaleTitleSuffix($pageLocale, $docsAvailableLocales)
    : ($localizedAllPagesMeta[$pageLocale][$initialDocsSlug]['documentTitle'] ?? 'XTend Dokumentation');
$initialDescription = $docsRouteNotFound
    ? $notFoundPageDescription
    : ($localizedAllPagesMeta[$pageLocale][$initialDocsSlug]['metaDescription'] ?? 'XTend Dokumentation');
$initialKeywords = $docsRouteNotFound
    ? 'xtend, documentation, 404'
    : implode(', ', $localizedAllPagesMeta[$pageLocale][$initialDocsSlug]['metaKeywords'] ?? ['xtend', 'dokumentation']);
$docsDocumentSsrMode = docsDocumentSsrMode();
$initialDocumentSsr = null;
$initialDocumentSsrPreparationDiagnostic = null;
if ($docsDocumentSsrMode === 'v2') {
    $initialDocumentHtml = $docsRouteNotFound
        ? '<h1>' . htmlspecialchars($notFoundPageTitle, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</h1><p>' . htmlspecialchars($notFoundPageDescription, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>'
        : ($localizedAllPages[$pageLocale][$initialDocsSlug] ?? null);
    $initialDocumentMeta = $docsRouteNotFound
        ? array_replace($localizedAllPagesMeta[$pageLocale]['readme'] ?? $allPagesMeta['readme'] ?? [], [
            'routeId' => 'docs.notFound',
            'title' => $notFoundPageTitle,
            'documentTitle' => $initialTitle,
            'metaDescription' => $notFoundPageDescription,
            'metaKeywords' => ['xtend', 'documentation', '404'],
            'translationAvailable' => false,
            'route' => [
                'id' => 'docs.notFound',
                'path' => '*',
                'component' => 'xtend-doc-page'
            ]
        ])
        : ($localizedAllPagesMeta[$pageLocale][$initialDocsSlug] ?? null);
    if (is_string($initialDocumentHtml) && is_array($initialDocumentMeta)) {
        $initialDocumentSsr = docsBuildDocumentSsrRecord(
            $initialDocumentHtml,
            $initialDocumentMeta,
            $initialDocsSlug,
            $pageLocale,
            docsBuildHistoryRoutePath($initialDocsSlug, $pageLocale, $docsBasePath),
            $initialDocumentRel,
            $localizedFileToSlug[$pageLocale] ?? $fileToSlug,
            $docsBasePath,
            $initialDocumentSsrPreparationDiagnostic
        );
    } else {
        $initialDocumentSsrPreparationDiagnostic = [
            'code' => 'xtend.docs.document_ssr_active_route_unavailable',
            'severity' => 'error',
            'message' => 'The active route did not provide both rendered content and route metadata for document SSR.'
        ];
    }
}
$docsRootShellDescriptor = docsBuildDocsRootShellDescriptor(
    $allPagesMeta,
    $localizedAllPagesMeta,
    $fileToSlug,
    $docsAvailableLocales,
    $pageLocale,
    $docsDefaultLocale,
    htmlspecialchars_decode($docsLogoUrl, ENT_QUOTES),
    $xtendAssetVersionAttr,
    $docsBasePath,
    $docsMenuConfig,
    $docsNavigationConfig,
    $initialDocsSlug,
    $initialDocumentSsr
);
$docsSsrEndpoint = docsSsrEndpointUrl($initialDocsSlug, $pageLocale, $initialDocumentSsr ? 'document' : 'shell');
$initialRmtSourcePath = $initialDocumentSsr ? $docsRmtDocumentV2Path : $docsRmtVNextShellPath;
$docsSsrPrehydration = docsRenderDocsSsrPrehydration(
    $repoRoot,
    $docsRmtCompilerBridgePath,
    $initialRmtSourcePath,
    $docsRootShellDescriptor,
    $initialDocsSlug,
    $pageLocale,
    $initialDocumentSsr
);
if ($docsDocumentSsrMode === 'v2' && !$initialDocumentSsr && is_array($initialDocumentSsrPreparationDiagnostic)) {
    $docsSsrPrehydration['diagnostics'][] = [
        'code' => 'xtend.docs.document_ssr_emergency_document',
        'severity' => 'warning',
        'message' => 'Document SSR preparation was rejected; the request retained the server-rendered shell and an emergency route document.',
        'documentDiagnostics' => [$initialDocumentSsrPreparationDiagnostic]
    ];
}
if ($initialDocumentSsr && ($docsSsrPrehydration['ok'] ?? false) !== true) {
    $documentSsrDiagnostics = $docsSsrPrehydration['diagnostics'] ?? [];
    $docsSsrPrehydration['html'] = docsRenderDescriptor(docsDescriptorWithExecutionMode($docsRootShellDescriptor, 'server_prerender_hydrate'));
    $docsSsrPrehydration['executionMode'] = 'server_prerender_hydrate';
    $docsSsrPrehydration['shellPrimitives']['hydrationMode'] = 'server_prerender_hydrate';
    $docsSsrPrehydration['diagnostics'][] = [
        'code' => 'xtend.docs.document_ssr_adapter_fallback_hydrate',
        'severity' => 'warning',
        'message' => 'The RMT adapter rejected activation; the complete SSR document was retained for hydrate fallback.',
        'documentDiagnostics' => $documentSsrDiagnostics
    ];
}
if (isset($_GET['xtend-docs-rmt-ssr']) && in_array($_GET['xtend-docs-rmt-ssr'], ['shell', 'document'], true)) {
    $streamKind = $_GET['xtend-docs-rmt-ssr'] === 'document' ? 'document' : 'shell';
    $streamPageRequest = docsResolveLocalizedPage($_GET['page'] ?? $initialDocsSlug, $_GET['locale'] ?? $pageLocale, $localizedSlugToFile, $docsAvailableLocales, $docsFallbackLocale);
    $streamPage = $streamPageRequest['slug'] ?? $initialDocsSlug;
    $streamLocale = $streamPageRequest['resolvedLocale'] ?? $pageLocale;
    $streamDocumentSsr = null;
    $streamDocumentSsrPreparationDiagnostic = null;
    if ($streamKind === 'document') {
        $streamRel = $streamPageRequest['rel'] ?? null;
        $streamMeta = $localizedAllPagesMeta[$streamLocale][$streamPage] ?? null;
        if ($streamRel && is_array($streamMeta) && isset($localizedMdFiles[$streamLocale][$streamRel])) {
            $streamMarkdown = file_get_contents($localizedMdFiles[$streamLocale][$streamRel]);
            $streamDocumentSsr = docsBuildDocumentSsrRecord(
                $Parsedown->text($streamMarkdown),
                $streamMeta,
                $streamPage,
                $streamLocale,
                docsBuildHistoryRoutePath($streamPage, $streamLocale, $docsBasePath),
                $streamRel,
                $localizedFileToSlug[$streamLocale] ?? $fileToSlug,
                $docsBasePath,
                $streamDocumentSsrPreparationDiagnostic
            );
        } else {
            $streamDocumentSsrPreparationDiagnostic = [
                'code' => 'xtend.docs.document_ssr_active_route_unavailable',
                'severity' => 'error',
                'message' => 'The requested route did not provide source content and metadata for the document stream.'
            ];
        }
    }
    $streamDescriptor = docsBuildDocsRootShellDescriptor(
        $allPagesMeta,
        $localizedAllPagesMeta,
        $fileToSlug,
        $docsAvailableLocales,
        $streamLocale,
        $docsDefaultLocale,
        htmlspecialchars_decode($docsLogoUrl, ENT_QUOTES),
        $xtendAssetVersionAttr,
        $docsBasePath,
        $docsMenuConfig,
        $docsNavigationConfig,
        $streamPage,
        $streamDocumentSsr
    );
    $streamSourcePath = $streamKind === 'document' && $streamDocumentSsr ? $docsRmtDocumentV2Path : $docsRmtVNextShellPath;
    $streamSourceRef = 'docs/' . basename($streamSourcePath);
    $streamSource = is_readable($streamSourcePath) ? file_get_contents($streamSourcePath) : '';
    $streamAdapter = docsCreateDocsSsrAdapter($repoRoot, $docsRmtCompilerBridgePath, $streamSourcePath);
    header('Content-Type: application/x-ndjson; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
    if ($streamKind === 'document' && !$streamDocumentSsr) {
        $streamFallbackCode = (string) ($streamDocumentSsrPreparationDiagnostic['code'] ?? 'xtend.docs.document_ssr_preparation_failed');
        header('X-XTend-Docs-SSR-Fallback: ' . preg_replace('/[^a-z0-9._-]+/i', '-', $streamFallbackCode));
    }
    if (!$streamAdapter || $streamSource === '') {
        echo json_encode([
            'schema' => 'xtend.rmt.node-ssr-jsonl-frame.v1',
            'type' => 'error',
            'requestId' => 'docs-php-ssr-stream-unavailable',
            'sequence' => 0,
            'payload' => ['code' => 'xtend.docs.rmt_ssr_endpoint.unavailable'],
            'diagnostics' => [[
                'code' => 'xtend.docs.rmt_ssr_endpoint.unavailable',
                'severity' => 'error',
                'message' => 'The docs RMT SSR stream endpoint could not create the adapter or source.'
            ]]
        ], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES) . "\n";
        exit;
    }
    foreach ($streamAdapter->streamJsonl(docsBuildDocsSsrInput($streamSource, $streamSourceRef, $streamDescriptor), [
        'requestId' => 'docs-php-ssr-stream-' . preg_replace('/[^a-z0-9_-]+/i', '-', $streamLocale . '-' . $streamPage),
        'rootId' => 'xtend-docs-rmt-root',
        'namespace' => 'docs',
        'templateId' => 'docs.app.root-shell',
        'model' => [
            'page' => $streamPage,
            'locale' => $streamLocale,
            'ssrEndpoint' => docsSsrEndpointUrl($streamPage, $streamLocale, $streamKind),
            'documentSsr' => $streamDocumentSsr ? $streamDocumentSsr['proof'] : null
        ]
    ]) as $line) {
        echo $line;
        if (function_exists('ob_flush')) @ob_flush();
        flush();
    }
    exit;
}
$initialCanonicalUrl = $docsRouteNotFound
    ? null
    : docsAbsolutePublicUrl(docsBuildHistoryRoutePath($initialDocsSlug, $pageLocale, $docsBasePath));
$initialTranslationFallback = is_array($pageRequest) && empty($pageRequest['translationAvailable']);
$initialHreflangUrls = [];
if (!$docsRouteNotFound) {
    foreach ($docsAvailableLocales as $locale => $localeConfig) {
        if (!isset($localizedSlugToFile[$locale][$initialDocsSlug])) continue;
        $initialHreflangUrls[$localeConfig['htmlLang'] ?? $locale] = docsAbsolutePublicUrl(
            docsBuildHistoryRoutePath($initialDocsSlug, $locale, $docsBasePath)
        );
    }
    if (isset($localizedSlugToFile[$docsFallbackLocale][$initialDocsSlug])) {
        $initialHreflangUrls['x-default'] = docsAbsolutePublicUrl(
            docsBuildHistoryRoutePath($initialDocsSlug, $docsFallbackLocale, $docsBasePath)
        );
    }
}
header('Content-Language: ' . ($initialLocaleConfig['htmlLang'] ?? $pageLocale));
header('Vary: Accept');
?><!DOCTYPE html>
<html lang="<?= htmlspecialchars($initialLocaleConfig['htmlLang'] ?? $pageLocale, ENT_QUOTES, 'UTF-8') ?>">
<head>
    <meta charset="UTF-8">
    <title><?= htmlspecialchars($initialTitle, ENT_QUOTES, 'UTF-8') ?></title>
    <meta name="description" content="<?= htmlspecialchars($initialDescription, ENT_QUOTES, 'UTF-8') ?>">
    <meta name="keywords" content="<?= htmlspecialchars($initialKeywords, ENT_QUOTES, 'UTF-8') ?>">
<?php if ($docsRouteNotFound || $initialTranslationFallback): ?>
    <meta name="robots" content="noindex,follow">
<?php endif; ?>
<?php if (is_string($initialCanonicalUrl)): ?>
    <link rel="canonical" href="<?= htmlspecialchars($initialCanonicalUrl, ENT_QUOTES, 'UTF-8') ?>">
<?php endif; ?>
<?php foreach ($initialHreflangUrls as $hreflang => $href): ?>
    <link rel="alternate" hreflang="<?= htmlspecialchars($hreflang, ENT_QUOTES, 'UTF-8') ?>" href="<?= htmlspecialchars($href, ENT_QUOTES, 'UTF-8') ?>">
<?php endforeach; ?>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="xtend-preload" content="x-utils,x-theme,x-button,x-icon,x-select,x-menu,x-popover,x-summary,x-link,x-input,x-form,x-header,x-hero,x-router,x-footer">
    <link rel="icon" href="<?= $docsFaviconIcoUrl ?>" sizes="any">
    <link rel="icon" type="image/png" sizes="32x32" href="<?= $docsFavicon32Url ?>">
    <link rel="icon" type="image/png" sizes="16x16" href="<?= $docsFavicon16Url ?>">
    <link rel="apple-touch-icon" href="<?= $docsAppleTouchIconUrl ?>">
    <link rel="stylesheet" href="/xtend.css?v=<?= $xtendAssetVersionAttr ?>">
    <script type="module" src="/xtend.js?v=<?= $xtendAssetVersionAttr ?>" nonce="<?= $nonce ?>"></script>
    <script src="/fabric/xtend-fabric.js?v=<?= $xtendAssetVersionAttr ?>"></script>
    <script id="xtend-docs-boot" type="application/json" nonce="<?= $nonce ?>"><?= docsJsonEncodeForHtml([
      'schema' => 'xtend.docs.boot.v1',
      'configuration' => [
        'i18n' => [
          'schema' => 'xtend.docs.i18n.v1',
          'defaultLocale' => $docsDefaultLocale,
          'fallbackLocale' => $docsFallbackLocale,
          'storageKey' => 'xtend.docs.locale',
          'available' => array_keys($docsAvailableLocales),
          'locales' => $docsAvailableLocales
        ],
        'basePath' => $docsBasePath,
        'routingMode' => 'history',
        'pageEndpoint' => docsEndpointPath('xtend-docs-page={slug}&locale={locale}'),
        'ssrEndpoint' => $docsSsrEndpoint
      ],
      'document' => [
        'slug' => $initialDocsSlug,
        'locale' => $pageLocale,
        'menu' => $docsBootstrapMenuConfig,
        'navigation' => $docsNavigationConfig,
        'aliases' => $docsSlugAliases,
        'pagesMeta' => $docsBootstrapPageMeta,
        'localizedPagesMeta' => $docsBootstrapLocalizedMeta,
        'titles' => $docsBootstrapTitles,
        'localizedTitles' => $docsBootstrapLocalizedTitles,
        'ssrPrehydration' => docsCompactDocsSsrPrehydrationForBootstrap($docsSsrPrehydration),
        'rmtDocument' => json_decode($rmtPilotDocumentJson, true)
      ]
    ]); ?></script>
<?php if (($docsSsrPrehydration['executionMode'] ?? null) === 'server_prerender_resume'): ?>
    <script nonce="<?= $nonce ?>">
    // XTEND_DOCS_DECLARED_PREBOOT_START
    (() => {
      const intents = [];
      let sequence = 0;
      const records = [
        { type: 'submit', selector: '#xtend-search-form', action: 'docs.search.submit' },
        { type: 'change', selector: '[data-docs-language-select]', action: 'docs.route.navigate' }
      ];
      const listeners = records.map((record) => {
        const listener = (event) => {
          const target = event.target && event.target.closest ? event.target.closest(record.selector) : null;
          if (!target || !document.getElementById('xtend-docs-rmt-root')?.contains(target)) return;
          event.preventDefault();
          intents.push({
            eventId: `docs-preboot-${++sequence}`,
            action: record.action,
            payload: {
              id: target.id || null,
              query: record.action === 'docs.search.submit'
                ? (target.querySelector('[name="query"],input')?.value || '')
                : null,
              path: record.action === 'docs.route.navigate'
                ? '/docs/' + encodeURIComponent(target.value || 'de') + '/' + <?= docsJsonEncodeForHtml($initialDocsSlug) ?>
                : null
            }
          });
          if (intents.length > 128) intents.shift();
        };
        document.addEventListener(record.type, listener, true);
        return [record.type, listener];
      });
      window.__xtendDocsConsumePrebootIntents = () => {
        listeners.splice(0).forEach(([type, listener]) => document.removeEventListener(type, listener, true));
        return intents.splice(0);
      };
    })();
    // XTEND_DOCS_DECLARED_PREBOOT_END
    </script>
<?php endif; ?>
    <script nonce="<?= $nonce ?>">window.Prism = window.Prism || {}; window.Prism.manual = true;</script>
    <script src="/components/prism.js" nonce="<?= $nonce ?>"></script>
    <script src="/components/prism-rmt.js" nonce="<?= $nonce ?>"></script>
    <style>
        html {
          --body-bg: #f7f8fb;
          --background-color: #f7f8fb;
          --section-bg: #ffffff;
          --surface-muted: #edf2f7;
          --text-color: #1f2937;
          --muted-text-color: #5f6f82;
          --primary-color: #0e4e81;
          --focus-color: #0e7cc1;
          --border-color: rgba(15, 23, 42, 0.14);
          --xtend-surface: #ffffff;
          --xtend-surface-muted: #f7fafc;
          --xtend-surface-control: var(--xtend-surface-muted);
          --xtend-text: #1f2937;
          --xtend-text-primary: var(--xtend-text);
          --xtend-text-muted: var(--muted-text-color);
          --xtend-border-color: rgba(15, 23, 42, 0.14);
          --xtend-border-subtle: var(--xtend-border-color);
          --xtend-overlay-bg: rgba(15, 23, 42, 0.52);
          --docs-control-surface: var(--xtend-surface-control, var(--xtend-surface-muted));
          --docs-control-text: var(--xtend-text-primary, var(--xtend-text));
          --docs-control-placeholder: var(--xtend-text-muted, var(--muted-text-color));
          --docs-control-border: var(--xtend-border-subtle, var(--xtend-border-color));
          --docs-header-bg: #ffffff;
          --docs-header-menu-bg: #ffffff;
          --docs-header-fg: #1f2937;
          --docs-shell-bg: transparent;
          --docs-sidebar-bg: #ffffff;
          --docs-sidebar-link-bg: #f7fafc;
          --docs-sidebar-link-hover-bg: #e7f0f7;
          --docs-menu-highlight-bg: rgba(14, 78, 129, 0.11);
          --docs-menu-highlight-border: rgba(14, 78, 129, 0.28);
          --docs-menu-active-rail: rgba(14, 78, 129, 0.72);
          --docs-navigation-surface: #ffffff;
          --docs-navigation-item-surface: #f7fafc;
          --docs-navigation-item-hover: #edf3f8;
          --docs-navigation-item-active: #e1edf6;
          --docs-navigation-item-text: #172033;
          --docs-navigation-item-active-text: #0e4e81;
          --docs-navigation-item-border: rgba(15, 23, 42, 0.15);
          --docs-navigation-item-rail: #0e4e81;
          --docs-search-surface: #ffffff;
          --docs-search-border: rgba(15, 23, 42, 0.18);
          --docs-search-result-surface: transparent;
          --docs-search-result-hover: #edf3f8;
          --docs-search-result-active: #e1edf6;
          --docs-search-result-text: #172033;
          --docs-search-score-text: #52657a;
          --docs-search-result-rail: #0e4e81;
          --docs-code-bg: #10131a;
          --x-code-bg: #10131a;
          --x-code-text: #f8fafc;
          --x-code-border: rgba(15, 23, 42, 0.18);
          --docs-shell-vertical-gap: 1.2rem;
          --docs-region-gap: clamp(1.5rem, 2.2vw, 2.5rem);
          --docs-viewport-gutter: 0.5rem;
          --docs-layout-gap: clamp(1rem, 2.2vw, 2.5rem);
          --docs-sidebar-width: clamp(20rem, 24vw, 27rem);
          --docs-header-reserved-block-size: 7.55rem;
          --docs-hero-reserved-block-size: 11rem;
          --docs-route-reserved-block-size: max(42rem, calc(100svh - 12rem));
          --docs-footer-reserved-block-size: clamp(4.75rem, 7vw, 6.5rem);
          --docs-hero-bg-light: linear-gradient(135deg, #f8fbff 0%, #e7f0f7 100%);
          --docs-hero-bg-dark: #050506;
          --docs-hero-text-light: #162033;
          --docs-hero-text-dark: #f8fafc;
          color-scheme: light;
          max-width: 100%;
          overflow-x: hidden;
          overflow-x: clip;
        }
        [data-theme="dark"] {
          --body-bg: #050506;
          --background-color: #050506;
          --section-bg: #0b0b0d;
          --surface-muted: #111113;
          --text-color: #f4f4f5;
          --muted-text-color: #a1a1aa;
          --primary-color: #8fd3ff;
          --focus-color: #c7ecff;
          --border-color: rgba(255, 255, 255, 0.13);
          --xtend-surface: #0b0b0d;
          --xtend-surface-muted: #111113;
          --xtend-surface-control: #17171b;
          --xtend-text: #f4f4f5;
          --xtend-text-primary: var(--xtend-text);
          --xtend-text-muted: var(--muted-text-color);
          --xtend-border-color: rgba(255, 255, 255, 0.13);
          --xtend-border-subtle: var(--xtend-border-color);
          --xtend-overlay-bg: rgba(0, 0, 0, 0.72);
          --docs-control-surface: var(--xtend-surface-control, #17171b);
          --docs-control-text: var(--xtend-text-primary, #f4f4f5);
          --docs-control-placeholder: var(--xtend-text-muted, #a1a1aa);
          --docs-control-border: var(--xtend-border-subtle, rgba(255, 255, 255, 0.13));
          --docs-header-bg: #050506;
          --docs-header-menu-bg: #09090b;
          --docs-header-fg: #f4f4f5;
          --docs-shell-bg: transparent;
          --docs-sidebar-bg: #0d0d10;
          --docs-sidebar-link-bg: #111114;
          --docs-sidebar-link-hover-bg: #17171b;
          --docs-menu-highlight-bg: rgba(143, 211, 255, 0.12);
          --docs-menu-highlight-border: rgba(143, 211, 255, 0.32);
          --docs-menu-active-rail: rgba(143, 211, 255, 0.74);
          --docs-navigation-surface: #0b0b0d;
          --docs-navigation-item-surface: #111114;
          --docs-navigation-item-hover: #1a1a20;
          --docs-navigation-item-active: #202b33;
          --docs-navigation-item-text: #f4f4f5;
          --docs-navigation-item-active-text: #bfe8ff;
          --docs-navigation-item-border: rgba(255, 255, 255, 0.16);
          --docs-navigation-item-rail: #8fd3ff;
          --docs-search-surface: #111114;
          --docs-search-border: rgba(255, 255, 255, 0.18);
          --docs-search-result-surface: transparent;
          --docs-search-result-hover: #1a1a20;
          --docs-search-result-active: #202b33;
          --docs-search-result-text: #f4f4f5;
          --docs-search-score-text: #c4c8d0;
          --docs-search-result-rail: #8fd3ff;
          --docs-code-bg: #050506;
          --x-code-bg: #050506;
          --x-code-text: #f4f4f5;
          --x-code-border: rgba(255, 255, 255, 0.16);
          --docs-hero-bg-dark: #050506;
          --input-bg: var(--docs-control-surface);
          --input-bg-dark: var(--docs-control-surface);
          --input-color-dark: var(--docs-control-text);
          --input-placeholder-color-dark: #a1a1aa;
          color-scheme: dark;
        }
        body {
          font-family: system-ui, sans-serif;
          margin: 0;
          min-width: 0;
          max-width: 100%;
          overflow-x: hidden;
          overflow-x: clip;
          background-color: var(--body-bg, var(--background-color));
          color: var(--text-color);
        }
        main {
          width: 100%;
          min-width: 0;
          min-block-size: var(--docs-route-reserved-block-size);
          margin-block-start: var(--docs-region-gap);
          box-sizing: border-box;
          background: transparent;
          border: 0;
          border-radius: 0;
          box-shadow: none;
          transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
        }
        x-footer {
          display: block;
          min-block-size: var(--docs-footer-reserved-block-size);
          contain-intrinsic-size: auto var(--docs-footer-reserved-block-size);
          margin: var(--docs-shell-vertical-gap) var(--docs-viewport-gutter) 0;
        }
        main > x-router {
          display: block;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          min-block-size: var(--docs-route-reserved-block-size);
        }
        main > x-router::part(outlet) {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          min-block-size: var(--docs-route-reserved-block-size);
          box-sizing: border-box;
        }
        main > x-router[adopt-prerendered-route][data-xtend-skeleton]:not(:defined) > [data-xrouter-prerendered-route] {
          display: block !important;
        }
        x-header {
          --header-bg: var(--docs-header-bg);
          --header-menu-bg: var(--docs-header-menu-bg);
          --header-fg: var(--docs-header-fg);
          --header-title-color: var(--docs-header-fg);
          --burger-color: var(--docs-header-fg);
          --header-border: var(--border-color);
          --header-radius: 0.75rem;
          --header-drawer-inline-offset: clamp(0.5rem, 1.6vw, 1rem);
          --header-drawer-content-max: none;
          --xtend-header-outer-spacing: 0.5rem var(--docs-viewport-gutter) 1.5rem;
          --header-slot-template-columns: minmax(18.75rem, 1fr) minmax(20rem, 48rem) minmax(15rem, 1fr) 44px;
          --header-slot-template-areas: "brand search actions trigger";
          position: relative;
          z-index: 20;
        }
        x-header::part(root) {
          margin: 0;
        }
        x-header::part(logo) {
          overflow: visible;
        }
        .docs-home-logo-link {
          --xtend-link-display: flex;
          --xtend-link-padding-block: 0;
          --xtend-link-padding-inline: 0;
          --xtend-link-radius: 50%;
          width: 48px;
          height: 48px;
          flex: none;
        }
        .docs-home-logo-link img {
          display: block;
          width: 48px;
          height: 48px;
          object-fit: contain;
          border-radius: 50%;
        }
        .docs-icon-button {
          --xtend-button-min-touch-target: 44px;
          color: var(--text-color);
          flex: none;
        }
        .docs-icon-button::part(button) {
          width: 44px;
          height: 44px;
          min-width: 44px;
          min-height: 44px;
          padding: 0;
          border: 1px solid var(--border-color);
          border-radius: 999px;
          background: var(--surface-muted);
          color: var(--text-color);
          box-shadow: none;
          backdrop-filter: none;
          transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, transform 0.16s ease;
        }
        .docs-icon-button:hover::part(button) {
          transform: translateY(-1px);
          border-color: color-mix(in srgb, var(--primary-color) 60%, var(--border-color));
          background: var(--primary-color);
          color: var(--section-bg);
        }
        .docs-icon-button:focus-visible::part(button) {
          outline: 2px solid var(--focus-color);
          outline-offset: 2px;
        }
        .docs-icon-button x-icon {
          pointer-events: none;
        }
        .docs-visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        .docs-menu-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 0.85rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .docs-trunk-menu {
          width: 100%;
          min-width: 0;
          --xtend-menu-padding-y: 0.35rem;
          --xtend-menu-padding-x: 0.35rem;
          --xtend-menu-gap: 0.25rem;
          --xtend-menu-radius: 6px;
          --xtend-menu-elevation: none;
          --xtend-menu-surface: var(--docs-navigation-surface);
          --xtend-menu-border-color: var(--docs-navigation-item-border);
          --xtend-menu-item-surface: var(--docs-navigation-item-surface);
          --xtend-menu-item-hover-surface: var(--docs-navigation-item-hover);
          --xtend-menu-item-active-surface: var(--docs-navigation-item-active);
          --xtend-menu-item-text: var(--docs-navigation-item-text);
          --xtend-menu-item-active-text: var(--docs-navigation-item-active-text);
          --xtend-menu-current-indicator: transparent;
          --xtend-menu-focus-elevation: none;
          --xtend-menu-item-padding-y: 0.45rem;
          --xtend-menu-item-padding-x: 0.65rem;
          --xtend-menu-item-radius: 5px;
        }
        .docs-trunk-link {
          white-space: nowrap;
        }
        .docs-menu-shell x-link[role="menuitem"],
        .docs-menu-shell a[is-x-link][role="menuitem"] {
          display: block;
          max-width: 100%;
          min-width: 0;
          min-height: 2.5rem;
          box-sizing: border-box;
          border: 1px solid transparent;
          border-radius: 5px;
          background: var(--docs-navigation-item-surface);
          color: var(--docs-navigation-item-text);
          text-align: left;
          --xtend-link-surface: transparent;
          --xtend-link-text: var(--docs-navigation-item-text);
          --xtend-link-hover-surface: transparent;
          --xtend-link-active-surface: transparent;
          --xtend-link-active-text: var(--docs-navigation-item-active-text);
          --xtend-link-current-indicator: transparent;
          --link-hover-decoration: none;
          --link-active-decoration: none;
        }
        .docs-menu-shell x-link[role="menuitem"]::part(link) {
          color: inherit;
          text-decoration: none;
          box-shadow: none;
        }
        .docs-menu-shell a[is-x-link][role="menuitem"] {
          text-decoration: none;
          box-shadow: none;
        }
        .docs-menu-shell .docs-trunk-link[role="menuitem"] {
          padding: 0.52rem 0.72rem;
          text-align: center;
        }
        .docs-menu-shell .docs-menu-link[role="menuitem"] {
          padding: 0.42rem 0.55rem;
        }
        .docs-menu-shell x-link[role="menuitem"]:hover,
        .docs-menu-shell a[is-x-link][role="menuitem"]:hover {
          border-color: var(--docs-navigation-item-border);
          background: var(--docs-navigation-item-hover);
          color: var(--docs-navigation-item-text);
        }
        .docs-menu-shell x-link[role="menuitem"][active],
        .docs-menu-shell x-link[role="menuitem"][aria-current="page"],
        .docs-menu-shell a[is-x-link][role="menuitem"][active],
        .docs-menu-shell a[is-x-link][role="menuitem"][aria-current="page"] {
          border-color: color-mix(in srgb, var(--docs-navigation-item-rail) 42%, transparent);
          background: var(--docs-navigation-item-active);
          color: var(--docs-navigation-item-active-text);
          font-weight: 700;
        }
        .docs-menu-shell .docs-trunk-link[role="menuitem"][active],
        .docs-menu-shell .docs-trunk-link[role="menuitem"][aria-current="page"] {
          box-shadow: inset 0 -2px 0 var(--docs-navigation-item-rail);
        }
        .docs-menu-shell .docs-menu-link[role="menuitem"][active],
        .docs-menu-shell .docs-menu-link[role="menuitem"][aria-current="page"] {
          box-shadow: inset 3px 0 0 var(--docs-navigation-item-rail);
        }
        .docs-menu-shell x-link[role="menuitem"]:focus-visible,
        .docs-menu-shell a[is-x-link][role="menuitem"]:focus-visible {
          outline: 2px solid var(--focus-color);
          outline-offset: 2px;
        }
        .docs-active-trunk {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.5rem;
          align-items: start;
          min-width: 0;
        }
        .docs-active-trunk-column {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          align-content: start;
          gap: 0.5rem;
          min-width: 0;
        }
        .docs-menu-section {
          max-width: 100%;
          min-width: 0;
          padding: 0;
          box-sizing: border-box;
        }
        .docs-menu-section::part(container) {
          margin: 0;
          padding: 0.45rem 0.55rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: var(--surface-muted);
          color: var(--text-color);
          box-shadow: none;
          backdrop-filter: none;
        }
        .docs-menu-section::part(summary) {
          min-height: 2rem;
          color: var(--text-color);
          font-size: 0.86rem;
        }
        .docs-menu-section-title {
          margin: 0 0 0.45rem;
          color: var(--muted-text-color);
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 0.42rem;
        }
        .docs-menu-section-title x-icon {
          color: var(--primary-color);
          flex: none;
        }
        .docs-menu-section-links {
          display: block;
          min-width: 0;
          max-width: 100%;
          --xtend-menu-padding-y: 0.2rem;
          --xtend-menu-padding-x: 0;
          --xtend-menu-gap: 0.2rem;
          --xtend-menu-radius: 0;
          --xtend-menu-border-width: 0;
          --xtend-menu-elevation: none;
          --xtend-menu-surface: transparent;
          --xtend-menu-item-surface: var(--docs-navigation-item-surface);
          --xtend-menu-item-hover-surface: var(--docs-navigation-item-hover);
          --xtend-menu-item-active-surface: var(--docs-navigation-item-active);
          --xtend-menu-item-text: var(--docs-navigation-item-text);
          --xtend-menu-item-active-text: var(--docs-navigation-item-active-text);
          --xtend-menu-current-indicator: transparent;
          --xtend-menu-focus-elevation: none;
          --xtend-menu-item-padding-y: 0.35rem;
          --xtend-menu-item-padding-x: 0.45rem;
          --xtend-menu-item-radius: 5px;
        }
        .docs-menu-node {
          display: grid;
          gap: 0.3rem;
          min-width: 0;
          max-width: 100%;
          isolation: isolate;
        }
        .docs-menu-node[data-doc-depth="0"] > x-link,
        .docs-menu-node[data-doc-depth="0"] > a[is-x-link] {
          font-weight: 650;
        }
        .docs-menu-node[data-doc-depth="1"] > x-link,
        .docs-menu-node[data-doc-depth="2"] > x-link,
        .docs-menu-node[data-doc-depth="1"] > a[is-x-link],
        .docs-menu-node[data-doc-depth="2"] > a[is-x-link] {
          font-size: 0.94rem;
        }
        .docs-menu-section x-link,
        .docs-menu-section a[is-x-link] {
          --link-active-decoration: none;
          --link-hover-decoration: none;
          --xtend-link-current-indicator: transparent;
          display: block;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          min-height: 36px;
          padding: 0.42rem 0.55rem;
          border: 1px solid transparent;
          border-radius: 0.45rem;
          color: var(--text-color);
          overflow-wrap: anywhere;
          transition: background 0.14s ease, border-color 0.14s ease, color 0.14s ease, box-shadow 0.14s ease;
        }
        .docs-menu-section x-link::part(link),
        .docs-menu-section a[is-x-link] {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          align-items: center;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          color: inherit;
          text-decoration: none;
          overflow-wrap: anywhere;
        }
        .docs-menu-link-label {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .docs-menu-section x-link:hover,
        .docs-menu-section x-link[active],
        .docs-menu-section a[is-x-link]:hover,
        .docs-menu-section a[is-x-link][active] {
          background: var(--docs-navigation-item-hover);
          border-color: var(--docs-navigation-item-border);
          color: var(--docs-navigation-item-text);
        }
        .docs-menu-section x-link[active],
        .docs-menu-section a[is-x-link][active],
        .docs-menu-section a[is-x-link][aria-current="page"] {
          background: var(--docs-navigation-item-active);
          border-color: color-mix(in srgb, var(--docs-navigation-item-rail) 42%, transparent);
          color: var(--docs-navigation-item-active-text);
          font-weight: 700;
          box-shadow: inset 3px 0 0 var(--docs-navigation-item-rail);
        }
        .docs-menu-section x-link[active]::part(link) {
          box-shadow: none;
          text-decoration: none;
        }
        .docs-menu-children {
          margin: 0.12rem 0 0;
          padding: 0;
          border: 0;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .docs-menu-children summary {
          min-height: 32px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 0.42rem;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          color: var(--muted-text-color);
          cursor: pointer;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0;
          border-radius: 0.45rem;
          padding: 0.28rem 0.42rem;
          background: color-mix(in srgb, var(--surface-muted) 78%, var(--section-bg));
          border: 1px solid transparent;
          list-style: none;
          transition: color 0.14s ease, background 0.14s ease, border-color 0.14s ease;
        }
        .docs-menu-children summary::-webkit-details-marker {
          display: none;
        }
        .docs-menu-children summary:hover,
        .docs-menu-children summary:focus-visible,
        .docs-menu-children[open] summary {
          color: var(--primary-color);
          background: var(--docs-menu-highlight-bg);
          border-color: var(--docs-menu-highlight-border);
          outline: none;
        }
        .docs-menu-disclosure-icon {
          color: var(--primary-color);
          flex: none;
          transition: transform 0.14s ease;
        }
        .docs-menu-children[open] > summary .docs-menu-disclosure-icon {
          transform: rotate(90deg);
        }
        .docs-menu-disclosure-label {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .docs-menu-disclosure-count {
          min-width: 1.35rem;
          padding: 0.05rem 0.35rem;
          border-radius: 999px;
          background: var(--section-bg);
          color: var(--muted-text-color);
          font-size: 0.72rem;
          line-height: 1.35;
          text-align: center;
        }
        .docs-menu-children[open] > summary .docs-menu-disclosure-count {
          color: var(--primary-color);
        }
        .docs-menu-child-list {
          display: grid;
          gap: 0.28rem;
          margin: 0.3rem 0 0.18rem;
          padding: 0.2rem 0 0 0.65rem;
          border-left: 1px solid var(--border-color);
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .docs-menu-children:not([open]) > .docs-menu-child-list {
          display: none;
        }
        #xtend-search-form {
          display: block;
          position: relative;
          width: 100%;
          max-width: 48rem;
          min-width: 0;
          box-sizing: border-box;
          --form-padding: 0;
          --form-gap: 0;
          --form-background: transparent;
          --form-border: 0;
          --form-shadow: none;
          margin: 0 auto;
          padding: 0;
          border: 0;
          background: transparent;
        }
        .docs-search-popover {
          display: block;
          width: 100%;
          --popover-radius: 6px;
          --popover-close-display: none;
          --xpopover-bg: var(--docs-search-surface);
          --xpopover-color: var(--docs-search-result-text);
          --xpopover-border: var(--docs-search-border);
          --xpopover-shadow: 0 18px 42px rgba(0, 0, 0, 0.28);
        }
        .docs-search-popover::part(trigger) {
          display: flex;
          width: 100%;
          min-width: 0;
        }
        .docs-search-popover::part(root) {
          width: 100%;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
          padding: 0.5rem;
          border-color: var(--docs-search-border);
          background: var(--docs-search-surface);
          color: var(--docs-search-result-text);
          overflow: hidden;
        }
        #xtend-search-form::part(form) {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        #xtend-search-form label {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
        }
        #xtend-search-form x-input {
          display: block;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          min-width: 12rem;
          color-scheme: light;
          --xtend-form-control-surface: var(--docs-control-surface);
          --xtend-form-control-surface-dark: var(--docs-control-surface);
          --xtend-form-control-text: var(--docs-control-text);
          --xtend-form-control-text-dark: var(--docs-control-text);
          --xtend-form-placeholder-text: var(--docs-control-placeholder);
          --xtend-control-placeholder-color-dark: var(--docs-control-placeholder);
          --xtend-form-border-color: var(--docs-control-border);
          --xtend-form-focus-border-color: var(--primary-color);
          --xtend-form-control-shadow: none;
        }
        [data-theme="dark"] #xtend-search-form x-input {
          color-scheme: dark;
        }
        #xtend-search-form x-input::part(control) {
          background: var(--docs-control-surface);
          border-color: var(--docs-control-border);
          color: var(--docs-control-text);
          box-shadow: none;
        }
        @media (max-width: 420px) {
          #xtend-search-form x-input {
            min-width: 0;
          }
        }
        #search-results {
          border: 0;
          max-height: min(25rem, calc(100vh - 12rem));
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          scrollbar-gutter: auto;
          scrollbar-color: var(--docs-search-border) transparent;
          scrollbar-width: thin;
          background: transparent;
          color: var(--docs-search-result-text);
        }
        .docs-search-result-menu {
          width: auto;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          --xtend-menu-padding-y: 0;
          --xtend-menu-padding-x: 0;
          --xtend-menu-gap: 0.2rem;
          --xtend-menu-border-width: 0;
          --xtend-menu-radius: 0;
          --xtend-menu-elevation: none;
          --xtend-menu-surface: transparent;
          --xtend-menu-item-surface: var(--docs-search-result-surface);
          --xtend-menu-item-hover-surface: var(--docs-search-result-hover);
          --xtend-menu-item-active-surface: var(--docs-search-result-active);
          --xtend-menu-item-active-text: var(--docs-search-result-text);
          --xtend-menu-current-indicator: var(--docs-search-result-rail);
          --xtend-menu-item-text: var(--docs-search-result-text);
          --xtend-menu-item-padding-y: 0;
          --xtend-menu-item-padding-x: 0;
          --xtend-menu-motion-duration: 100ms;
        }
        .docs-search-result::part(link),
        .docs-search-result[is-x-link] {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 0.75rem;
          align-items: center;
          width: 100%;
          min-height: 2.75rem;
          color: inherit;
          text-align: left;
          text-decoration: none;
          box-shadow: none;
        }
        .docs-search-result-score {
          color: var(--docs-search-score-text);
          font-size: 0.75rem;
          font-variant-numeric: tabular-nums;
          font-weight: 600;
          margin-inline-start: auto;
          padding-inline-end: 0.2rem;
          white-space: nowrap;
        }
        .docs-search-result-title {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        #search-results :is(x-link, a[is-x-link])[role="menuitem"] {
          display: block;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          min-height: 2.75rem;
          box-sizing: border-box;
          padding: 0.55rem 0.7rem;
          border: 1px solid transparent;
          border-radius: 5px;
          background: var(--docs-search-result-surface);
          color: var(--docs-search-result-text);
          text-align: left;
          --xtend-nav-surface: transparent;
          --xtend-nav-text: var(--docs-search-result-text);
          --xtend-link-surface: transparent;
          --xtend-link-text: var(--docs-search-result-text);
          --xtend-link-hover-surface: transparent;
          --xtend-link-active-surface: transparent;
          --xtend-link-active-text: var(--docs-search-result-text);
          --xtend-link-current-indicator: transparent;
          --link-hover-decoration: none;
          --link-active-decoration: none;
        }
        #search-results a[is-x-link][role="menuitem"] {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          width: auto;
          min-width: 0;
          align-self: stretch;
        }
        #search-results :is(x-link, a[is-x-link])[role="menuitem"]:hover {
          background: var(--docs-search-result-hover);
          color: var(--docs-search-result-text);
        }
        #search-results :is(x-link, a[is-x-link])[role="menuitem"][aria-current="page"],
        #search-results :is(x-link, a[is-x-link])[role="menuitem"].active {
          border-color: color-mix(in srgb, var(--docs-search-result-rail) 42%, transparent);
          background: var(--docs-search-result-active);
          color: var(--docs-search-result-text);
          box-shadow: inset 3px 0 0 var(--docs-search-result-rail);
        }
        #search-results :is(x-link, a[is-x-link])[role="menuitem"]:focus-visible {
          outline: 2px solid var(--focus-color);
          outline-offset: -2px;
        }
        .docs-search-status[hidden],
        .docs-search-status:not([message]),
        .docs-search-status[message=""] {
          display: none !important;
        }
        .docs-search-status {
          margin-top: 0.35rem;
          --xtend-feedback-bg: transparent;
          --xtend-feedback-color: var(--docs-search-score-text);
          --xtend-feedback-border: var(--docs-search-border);
        }
        .docs-search-status::part(root) {
          padding: 0.5rem 0.65rem;
          border-width: 1px 0 0;
          border-radius: 0;
        }
        x-hero.docs-hero {
          display: block;
          margin: 0 var(--docs-viewport-gutter);
          max-width: calc(100% - var(--docs-viewport-gutter) - var(--docs-viewport-gutter));
          min-width: 0;
          box-sizing: border-box;
          --hero-padding: 0;
          --hero-radius: 0.75rem;
          --hero-font-size: clamp(1rem, 2vw, 1.25rem);
          --hero-content-max-width: none;
          --hero-content-margin: 0;
          --hero-content-padding: clamp(1.15rem, 2.2vw, 1.8rem) clamp(1.25rem, 3vw, 2.25rem);
        }
        x-hero.docs-hero h1 {
          font-size: clamp(1.8rem, 3.2vw, 3rem);
          line-height: 1.08;
          margin: 0;
        }
        x-hero.docs-hero p {
          margin: 0.7rem 0 0;
          color: inherit;
        }
        .docs-shell-toolbar {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 0.5rem;
          min-block-size: 44px;
          margin-bottom: 0.8rem;
        }
        .docs-app-shell {
          display: block;
          width: 100%;
          max-width: none;
          min-width: 0;
          min-block-size: var(--docs-route-reserved-block-size);
          box-sizing: border-box;
          --section-bg: var(--docs-shell-bg);
          --section-padding: 0;
          --main-content-padding: 0;
          --section-gap: 0;
          --border-radius: 0;
        }
        x-section.docs-app-shell::part(container),
        x-section.docs-app-shell::part(content) {
          display: block;
          width: 100%;
          max-width: none;
          min-width: 0;
          flex: 1 1 auto;
          box-sizing: border-box;
          padding: 0;
          overflow: visible;
        }
        .docs-shell-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) var(--docs-sidebar-width);
          gap: var(--docs-layout-gap);
          align-items: start;
          width: calc(100% - var(--docs-viewport-gutter) - var(--docs-viewport-gutter));
          max-width: calc(100% - var(--docs-viewport-gutter) - var(--docs-viewport-gutter));
          margin-inline: var(--docs-viewport-gutter);
          min-width: 0;
          min-block-size: var(--docs-route-reserved-block-size);
          box-sizing: border-box;
        }
        .docs-route-boot-skeleton {
          display: grid;
          grid-template-columns: minmax(0, 1fr) var(--docs-sidebar-width);
          gap: var(--docs-layout-gap);
          width: calc(100% - var(--docs-viewport-gutter) - var(--docs-viewport-gutter));
          max-width: calc(100% - var(--docs-viewport-gutter) - var(--docs-viewport-gutter));
          min-block-size: var(--docs-route-reserved-block-size);
          margin-inline: var(--docs-viewport-gutter);
          box-sizing: border-box;
        }
        .docs-route-boot-skeleton[hidden] {
          display: none !important;
        }
        x-router:defined > .docs-route-boot-skeleton {
          display: none;
        }
        .docs-route-boot-skeleton__article,
        .docs-route-boot-skeleton__sidebar {
          display: grid;
          align-content: start;
          gap: 0.75rem;
          min-width: 0;
          box-sizing: border-box;
        }
        .docs-route-boot-skeleton__article {
          padding: clamp(1rem, 2vw, 2rem);
        }
        .docs-route-boot-skeleton__sidebar {
          margin-top: clamp(1rem, 2vw, 2rem);
          padding: 1rem;
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          background: var(--docs-sidebar-bg);
        }
        .docs-route-boot-skeleton__line,
        .docs-route-boot-skeleton__link {
          display: block;
          max-width: 100%;
          height: 0.82rem;
          border-radius: 999px;
          background: var(--xtend-skeleton-line-bg, rgba(148, 163, 184, 0.24));
        }
        .docs-route-boot-skeleton__line--title {
          height: 1.35rem;
          margin-bottom: 0.45rem;
        }
        .docs-route-boot-skeleton__link {
          width: 100%;
          height: 2.6rem;
          border-radius: 0.45rem;
        }
        [data-docs-content-state="loading"][data-xtend-skeleton-active="true"] > :not([data-xtend-skeleton-loader]) {
          visibility: hidden;
        }
        .docs-article-surface,
        .docs-page-sidebar {
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .docs-article-surface {
          background: transparent;
          color: var(--text-color);
          border: 0;
          border-radius: 0;
          padding: clamp(1rem, 2vw, 2rem);
          min-block-size: var(--docs-route-reserved-block-size);
          box-shadow: none;
        }
        [data-theme="dark"] .docs-article-surface {
          box-shadow: none;
        }
        .docs-page-sidebar {
          position: static;
          display: grid;
          gap: 0.85rem;
          align-self: start;
        }
        .docs-sidebar-section {
          background: transparent;
          color: var(--text-color);
          border: 0;
          border-left: 1px solid var(--border-color);
          border-radius: 0;
          padding: 0.35rem 0 0.35rem 1rem;
          box-shadow: none;
        }
        [data-theme="dark"] .docs-sidebar-section {
          box-shadow: none;
        }
        .docs-sidebar-heading {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin: 0 0 0.65rem;
          font-size: 0.86rem;
          line-height: 1.2;
          color: var(--text-color);
        }
        .docs-sidebar-heading x-icon {
          color: var(--primary-color);
          flex: none;
        }
        .docs-sidebar-copy {
          margin: -0.2rem 0 0.75rem;
          color: var(--muted-text-color);
          font-size: 0.88rem;
          line-height: 1.45;
        }
        .docs-related-list {
          display: grid;
          gap: 0.5rem;
        }
        .docs-related-link {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 0.55rem;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          min-height: 42px;
          padding: 0.55rem 0.62rem;
          border: 1px solid var(--border-color);
          border-radius: 7px;
          background: var(--docs-sidebar-link-bg);
          color: var(--text-color);
          text-decoration: none;
          transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, transform 0.16s ease;
        }
        x-link.docs-related-link::part(link) {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 0.55rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          color: inherit;
          text-decoration: none;
        }
        .docs-related-link:hover,
        .docs-related-link:focus-visible {
          background: var(--docs-sidebar-link-hover-bg);
          border-color: color-mix(in srgb, var(--primary-color) 56%, var(--border-color));
          color: var(--primary-color);
          transform: translateX(2px);
          outline: none;
        }
        .docs-related-link x-icon {
          color: var(--primary-color);
          flex: none;
        }
        .docs-related-link span {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .docs-component-demo[hidden],
        .docs-sidebar-section[hidden] {
          display: none;
        }
        .docs-demo-preview {
          display: grid;
          gap: 0.7rem;
          min-height: 4rem;
          padding: 0.85rem;
          border: 1px solid var(--border-color);
          border-radius: 7px;
          background: var(--surface-muted);
          overflow: visible;
        }
        .docs-demo-preview x-button,
        .docs-demo-preview x-input,
        .docs-demo-preview x-select,
        .docs-demo-preview x-textarea,
        .docs-demo-preview x-status,
        .docs-demo-preview x-progress,
        .docs-demo-preview x-alert,
        .docs-demo-preview x-toast,
        .docs-demo-preview x-tabs,
        .docs-demo-preview x-code,
        .docs-demo-preview x-summary {
          max-width: 100%;
        }
        .docs-demo-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
          align-items: center;
        }
        .docs-demo-code-grid {
          display: grid;
          gap: 0.7rem;
          margin-top: 0.75rem;
        }
        .docs-demo-code-block h3 {
          margin: 0 0 0.35rem;
          color: var(--muted-text-color);
          font-size: 0.78rem;
          text-transform: uppercase;
        }
        .docs-demo-code-block x-code {
          margin: 0;
          max-height: 18rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          background: var(--docs-code-bg);
          color: var(--x-code-text);
          border-radius: 8px;
        }
        .docs-demo-surface-zone {
          position: relative;
          min-height: 15rem;
          overflow: hidden;
          border-radius: 7px;
          background: color-mix(in srgb, var(--surface-muted) 80%, transparent);
        }
        .docs-demo-surface-zone x-surface-window,
        .docs-demo-surface-zone x-side-panel {
          position: absolute;
        }
        .download-link {
          float: none;
          font-size: 0.9em;
        }
        .docs-language-control {
          display: inline-grid;
          grid-template-columns: auto minmax(7.35rem, 8.8rem) auto;
          align-items: center;
          gap: 0.42rem;
          min-height: 44px;
          padding: 0 0.32rem 0 0.58rem;
          border: 1px solid color-mix(in srgb, var(--border-color) 84%, transparent);
          border-radius: 999px;
          background: var(--docs-control-surface);
          color: var(--docs-control-text);
          box-sizing: border-box;
          color-scheme: light;
        }
        [data-theme="dark"] .docs-language-control {
          color-scheme: dark;
        }
        .docs-language-control:focus-within {
          outline: 2px solid color-mix(in srgb, var(--primary-color) 56%, transparent);
          outline-offset: 2px;
        }
        .docs-language-icon {
          color: var(--primary-color);
          flex: none;
          opacity: 0.9;
        }
        .docs-language-status {
          display: none;
          align-items: center;
          gap: 0.32rem;
          color: var(--muted-text-color);
          font-size: 0.78rem;
          line-height: 1;
          white-space: nowrap;
        }
        .docs-language-control[data-docs-locale-busy="true"] .docs-language-status {
          display: inline-flex;
        }
        .docs-language-status-spinner {
          width: 0.85rem;
          height: 0.85rem;
          border: 2px solid color-mix(in srgb, var(--primary-color) 22%, transparent);
          border-top-color: var(--primary-color);
          border-radius: 999px;
          box-sizing: border-box;
          animation: docs-language-spin 0.78s linear infinite;
        }
        .docs-language-status-label {
          max-width: 4.8rem;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @keyframes docs-language-spin {
          to { transform: rotate(360deg); }
        }
        .docs-language-select {
          display: block;
          min-width: 7.5rem;
          max-width: 8.8rem;
          color-scheme: light;
          --xtend-form-border-width: 0;
          --xtend-form-control-shadow: none;
          --xtend-form-control-surface: transparent;
          --xtend-form-control-surface-dark: transparent;
          --xtend-form-control-text: var(--docs-control-text);
          --xtend-form-control-text-dark: var(--docs-control-text);
          --xtend-form-option-surface: var(--docs-control-surface);
          --xtend-form-option-surface-dark: var(--docs-control-surface);
          --xtend-form-option-text: var(--docs-control-text);
          --xtend-form-option-text-dark: var(--docs-control-text);
          --xtend-form-icon-color: var(--docs-control-text);
          --xtend-form-focus-border-color: transparent;
          --xtend-form-focus-offset: 0;
          --xtend-form-focus-ring: none;
          --xtend-form-control-min-height: 44px;
        }
        [data-theme="dark"] .docs-language-select {
          color-scheme: dark;
        }
        .docs-language-select::part(control) {
          border: 0;
          background: transparent;
          color: var(--docs-control-text);
          box-shadow: none;
        }
        .docs-language-select::part(label),
        .docs-language-select::part(helper),
        .docs-language-select::part(error) {
          display: none;
        }
        @media (max-width: 1100px) {
          :root {
            --docs-header-reserved-block-size: 11.75rem;
          }
          x-header {
            --header-slot-template-columns: minmax(0, 1fr) auto 44px;
            --header-slot-template-areas: "brand actions trigger" "search search search";
          }
        }
        xtend-doc-page {
          display: block;
          width: 100%;
          max-width: none;
          box-sizing: border-box;
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.16s ease, transform 0.16s ease;
        }
        xtend-doc-page[data-xrouter-prerendered-route][data-xrouter-adoption-pending]:not(:defined),
        xtend-doc-page[data-xrouter-prerendered-route][data-xrouter-adoption-pending] :not(:defined) {
          visibility: visible !important;
        }
        xtend-doc-page[data-docs-route-state="loading"] {
          opacity: 0.72;
          transform: translateY(4px);
        }
        xtend-doc-page [data-rmt-shell] {
          transition: border-color 0.16s ease, box-shadow 0.16s ease;
        }
        xtend-doc-page[data-docs-route-state="ready"] [data-rmt-shell] {
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
        }
        @media (max-width: 700px) {
          :root {
            --docs-shell-vertical-gap: 1rem;
            --docs-region-gap: 1rem;
            --docs-hero-reserved-block-size: 12rem;
            --docs-route-reserved-block-size: max(48rem, calc(100svh - 10rem));
            --docs-footer-reserved-block-size: 7.5rem;
          }
          x-hero.docs-hero {
            margin: 0 var(--docs-viewport-gutter);
            max-width: calc(100% - var(--docs-viewport-gutter) - var(--docs-viewport-gutter));
          }
          .docs-shell-layout {
            grid-template-columns: 1fr;
          }
          .docs-route-boot-skeleton {
            grid-template-columns: 1fr;
          }
          .docs-page-sidebar {
            position: static;
          }
          .docs-sidebar-section {
            border-left: 0;
            border-top: 1px solid var(--border-color);
            padding: 1rem 0 0;
          }
          .docs-language-icon {
            display: none;
          }
          .docs-language-control {
            grid-template-columns: minmax(7.35rem, 8.8rem) auto;
            padding-left: 0.28rem;
          }
          .docs-menu-shell {
            grid-template-columns: 1fr;
          }
          .docs-active-trunk {
            grid-template-columns: 1fr;
          }
          #xtend-search-form {
            width: 100%;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
          .docs-menu-section x-link:hover,
          .docs-menu-section x-link[active],
          .docs-icon-button:hover::part(button),
          .docs-related-link:hover,
          .docs-related-link:focus-visible,
          xtend-doc-page[data-docs-route-state="loading"] {
            transform: none;
          }
          .docs-language-status-spinner {
            animation: none;
          }
        }
    </style>
    <script nonce="<?= $nonce ?>">
    const xtendDocsBootDescriptor = JSON.parse(document.getElementById('xtend-docs-boot').textContent || '{}');
    const xtendDocsBootConfiguration = xtendDocsBootDescriptor.configuration || {};
    const xtendDocsBootDocument = xtendDocsBootDescriptor.document || {};
    window.xtendInitialDocsSlug = xtendDocsBootDocument.slug || 'readme';
    window.xtendInitialDocsLocale = xtendDocsBootDocument.locale || 'de';
    window.xtendDocsLocales = (xtendDocsBootConfiguration.i18n && xtendDocsBootConfiguration.i18n.locales) || {};
    window.xtendMenuConfig = xtendDocsBootDocument.menu || [];
    window.xtendDocsNavigation = xtendDocsBootDocument.navigation || {};
    window.xtendDocsLocalizedPages = Object.create(null);
    window.xtendDocsLocalizedPagesMeta = xtendDocsBootDocument.localizedPagesMeta || {};
    window.xtendDocsLocalizedTitles = xtendDocsBootDocument.localizedTitles || {};
    window.xtendDocsSlugAliases = xtendDocsBootDocument.aliases || {};
    window.xtendDocsBasePath = xtendDocsBootConfiguration.basePath || '/docs';
    window.xtendDocsRoutingMode = xtendDocsBootConfiguration.routingMode || 'history';
    (function() {
      const config = xtendDocsBootConfiguration.i18n;
      const available = config.available || ['de'];
      const fallback = config.fallbackLocale || 'de';
      const basePath = String(xtendDocsBootConfiguration.basePath || '').replace(/\/+$/, '');
      const normalizeLocale = (value) => {
        const raw = String(value || '').toLowerCase();
        if (available.includes(raw)) return raw;
        const short = raw.slice(0, 2);
        return available.includes(short) ? short : fallback;
      };
      const normalizeRoutePath = (value) => {
        let raw = String(value || '').split('?')[0].replace(/^#\/?/, '/');
        if (!raw.startsWith('/')) raw = '/' + raw;
        raw = raw.replace(/^\/+index\.php\/?/, '/');
        if (basePath && (raw === basePath || raw.startsWith(basePath + '/'))) {
          raw = raw.slice(basePath.length) || '/';
        }
        raw = raw.replace(/^\/+index\.php\/?/, '/').replace(/^\/+/, '');
        return raw;
      };
      const parseRoute = (value) => {
        const raw = normalizeRoutePath(value);
        const parts = raw.split('/').filter(Boolean);
        const routeLocale = available.includes(parts[0]) ? parts[0] : '';
        return {
          locale: routeLocale,
          slug: routeLocale ? (parts.slice(1).join('/') || window.xtendInitialDocsSlug || 'readme') : (parts.join('/') || window.xtendInitialDocsSlug || 'readme'),
          localized: Boolean(routeLocale)
        };
      };
      const stored = (() => {
        try { return localStorage.getItem(config.storageKey || 'xtend.docs.locale'); } catch (error) { return ''; }
      })();
      const browser = (navigator.languages && navigator.languages[0]) || navigator.language || '';
      const locale = normalizeLocale(stored || browser || config.defaultLocale || fallback);
      const hashRoute = location.hash ? parseRoute(location.hash) : null;
      const pathRoute = parseRoute(location.pathname);
      const route = hashRoute || pathRoute;
      window.xtendDocsCurrentLocale = route.locale || locale;
      const requestedSlug = route.slug || window.xtendInitialDocsSlug || 'readme';
      const slug = (window.xtendDocsSlugAliases || {})[requestedSlug] || requestedSlug;
      const canonicalPath = (basePath || '') + '/' + window.xtendDocsCurrentLocale + '/' + slug;
      const currentPath = location.pathname.replace(/\/+$/, '') || '/';
      if (location.hash || currentPath !== canonicalPath.replace(/\/+$/, '')) {
        history.replaceState(history.state || null, '', canonicalPath);
      }
    })();
    window.xtendDocsPages = Object.create(null);
    window.xtendDocsPageEndpoint = xtendDocsBootConfiguration.pageEndpoint || '';
    window.xtendDocsRmtSsrEndpoint = xtendDocsBootConfiguration.ssrEndpoint || '';
    window.xtendDocsSsrPrehydration = xtendDocsBootDocument.ssrPrehydration || null;
    window.xtendDocsPagesMeta = xtendDocsBootDocument.pagesMeta || {};
    window.xtendDocsTitles = xtendDocsBootDocument.titles || {};
    window.xtendDocsAssetUrls = {
      favicon: '<?= $docsFaviconIcoUrl ?>',
      favicon32: '<?= $docsFavicon32Url ?>',
      favicon16: '<?= $docsFavicon16Url ?>',
      appleTouchIcon: '<?= $docsAppleTouchIconUrl ?>',
      logo: '<?= $docsLogoUrl ?>',
      lightboxLogo: '<?= $docsLightboxLogoUrl ?>'
    };
    window.xtendDocsRmtRuntimeModule = '/xtendrmt/rmt-runtime.esm.js?v=<?= $xtendAssetVersionAttr ?>';
    window.xtendDocsRmtDocument = xtendDocsBootDocument.rmtDocument || null;
    window.xtendDocsRmtPilot = {
      schema: 'xtend.docs.parsedown-rmt-pilot.v1',
      workpackage: 'ER-WP-40',
      document: './<?= htmlspecialchars($rmtPilotDocument, ENT_QUOTES, 'UTF-8') ?>',
      runtimeDocument: './<?= htmlspecialchars($rmtPilotRuntimeDocument, ENT_QUOTES, 'UTF-8') ?>',
      sourceSyntax: 'rmt-vnext',
      renderMode: <?= docsJsonEncodeForHtml($initialDocumentSsr ? 'document-first' : 'shell-first'); ?>,
      documentSsrMode: <?= docsJsonEncodeForHtml($initialDocumentSsr ? 'v2' : 'off'); ?>,
      phpSsrPrehydration: window.xtendDocsSsrPrehydration,
      rmtVNextDocument: './<?= htmlspecialchars($initialDocumentSsr ? $docsRmtDocumentV2 : $docsRmtVNextShellDocument, ENT_QUOTES, 'UTF-8') ?>',
      ssrEndpoint: window.xtendDocsRmtSsrEndpoint,
      compilerBridge: {
        schema: 'xtend.docs.rmt-compiler-bridge.v1',
        runner: 'tools/tooling-bridge-cli.js',
        function: 'compileRmtVNextSource',
        injected: Boolean(window.xtendDocsSsrPrehydration && window.xtendDocsSsrPrehydration.compilerBridge && window.xtendDocsSsrPrehydration.compilerBridge.injected)
      },
      ssrPrehydrationContract: <?= docsJsonEncodeForHtml($initialDocumentSsr ? 'xtend.docs.php-ssr-prehydration.v2' : 'xtend.docs.php-ssr-prehydration.v1'); ?>,
      ssrEndpointContract: <?= docsJsonEncodeForHtml($initialDocumentSsr ? 'xtend.docs.rmt-ssr-endpoint.v2' : 'xtend.docs.rmt-ssr-endpoint.v1'); ?>,
      shellPrimitivesContract: <?= docsJsonEncodeForHtml($initialDocumentSsr ? 'xtend.docs.rmt-shell-primitives.v2' : 'xtend.docs.rmt-shell-primitives.v1'); ?>,
      insularHydration: true,
      lazyParsedownRoutes: true,
      skeletonLoader: 'xtend.loader.skeleton-loader.v1',
      shellTemplate: 'docs.app.shell',
      searchTemplate: 'docs.header.search',
      adapter: 'docs.parsedown',
      component: 'docs.page',
      shellSchedule: 'docs.shell.render',
      parseSchedule: 'docs.markdown.parse',
      routeSchedule: 'docs.route.render',
      hydrateSchedule: 'docs.page.hydrate',
      syntaxSchedule: 'docs.syntax.highlight',
      searchSchedule: 'docs.search.index',
      richContentSchedule: 'docs.rich-content.prepare',
      mediaSchedule: 'docs.media.lazy',
      shellEndpoint: 'xtendrmt.shell.render',
      parseEndpoint: 'xtendrmt.docs.parsedown.parse',
      searchEndpoint: 'xtendrmt.docs.search.index',
      richContentEndpoint: 'xtendrmt.docs.rich-content.prepare',
      mediaEndpoint: 'xtendrmt.docs.media.lazy',
      fabricRuntime: {
        schema: 'xtend.docs.app-runtime-fabric.v1',
        runtime: 'docs/utils/docs-shell-runtime.mjs',
        ownership: 'rmt-app-runtime',
        api: 'xtend.fabric.api.v1',
        telemetrySnapshot: 'xtend.fabric.telemetry-snapshot.v1',
        diagnosticsSchedule: 'docs.diagnostics.snapshot',
        snapshotStateKey: 'xtend.docs.fabric.snapshot'
      },
      markupClass: 'parsedownHtml',
      trustBoundary: 'xtend.security.sanitizing-boundary.v1',
      trustedDomProofSchema: 'xtend.epic13.trusted-dom-boundary.v1',
      trustedDomSanitizer: 'xtend.security.trusted-dom-sanitizer.v1',
      kernelBoundary: 'Parsedown, PHP execution and Sanitizing stay in the Docs host adapter.',
      futureContentKinds: ['richHtml', 'xplayerTutorial']
    };
    window.xtendDocsRmtProductionHardening = {
      schema: 'xtend.epic13.docs-rmt-production-hardening.v1',
      workpackage: 'WP-E13-10',
      status: 'accepted-docs-rmt-production-hardening',
      document: './<?= htmlspecialchars($rmtPilotDocument, ENT_QUOTES, 'UTF-8') ?>',
      runtimeDocument: './<?= htmlspecialchars($rmtPilotRuntimeDocument, ENT_QUOTES, 'UTF-8') ?>',
      renderSchema: 'xtend.epic13.docs-rmt-production-hardening.v1',
      shellTemplate: 'docs.app.shell',
      searchTemplate: 'docs.header.search',
      shellFirst: true,
      insularHydration: true,
      parsedownOrchestrated: true,
      parsedownEmbeddedInRmtKernel: false,
      richHtmlSchedulable: true,
      xplayerTutorialSchedulable: true,
      diagnosticsSchedule: 'docs.diagnostics.snapshot',
      diagnosticsEndpoint: 'xtendrmt.diagnostics.snapshot',
      fabricRuntime: {
        schema: 'xtend.docs.app-runtime-fabric.v1',
        runtime: 'docs/utils/docs-shell-runtime.mjs',
        ownership: 'rmt-app-runtime',
        telemetrySnapshot: 'xtend.fabric.telemetry-snapshot.v1',
        bridge: 'xtend.rmt.app-runtime.v2'
      },
      trustBoundary: 'xtend.security.sanitizing-boundary.v1',
      trustedDomProofSchema: 'xtend.epic13.trusted-dom-boundary.v1',
      trustedDomSanitizer: 'xtend.security.trusted-dom-sanitizer.v1',
      kernelBoundary: 'Parsedown, PHP execution and Sanitizing stay in the Docs host adapter.',
      extensionSlots: ['docs.slot.content', 'docs.slot.sidebar', 'docs.slot.related', 'docs.slot.component-demo', 'docs.slot.rich-content', 'docs.slot.media', 'docs.slot.diagnostics'],
      localGate: 'node scripts/run_xtend_tests.js epic13-docs-rmt-production-hardening --json',
      nextWorkpackage: 'WP-E13-13',
      nextDecision: 'rc1-gate-matrix-ci-handoff'
    };
    window.xtendDocsTrustedDomBoundaryProof = {
      schema: 'xtend.epic13.trusted-dom-boundary.v1',
      workpackage: 'WP-E13-11',
      status: 'accepted-trusted-dom-boundary-browser-proof',
      sanitizer: 'xtend.security.trusted-dom-sanitizer.v1',
      trustBoundary: 'xtend.security.sanitizing-boundary.v1',
      sourceMarkupClasses: ['parsedownHtml', 'htmlFragment'],
      blockedVectors: ['script', 'inline-event-handler', 'javascript-url', 'srcdoc'],
      fixture: 'tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html',
      localGate: 'node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json',
      nextWorkpackage: 'WP-E13-13',
      nextDecision: 'rc1-gate-matrix-ci-handoff'
    };
    </script>
    <script src="/docs/utils/dev-api.js?v=<?= $xtendAssetVersionAttr ?>" nonce="<?= $nonce ?>"></script>
    <script type="module" src="/docs/utils/trusted-dom-host.mjs?v=<?= $xtendAssetVersionAttr ?>" nonce="<?= $nonce ?>"></script>
</head>
<body xt-ui-effects="none">
<?= $docsSsrPrehydration['html'] ?? docsRenderDescriptor($docsRootShellDescriptor) ?>
<script id="xtend-llm-ssr-hydration" type="application/json" nonce="<?= $nonce ?>"><?= docsJsonEncodeForHtml([
    'schema' => 'xtend.docs.php-ssr-resume.v3',
    'executionMode' => $docsSsrPrehydration['executionMode'] ?? 'server_prerender_hydrate',
    'resume' => $docsSsrPrehydration['resume'] ?? null
]) ?></script>
<script nonce="<?= $nonce ?>">
window.xtendDocsRmtBootPromise = new Promise((resolve) => {
  window.__xtendDocsResolveRmtBoot = resolve;
});
</script>
<script
    id="xtend-docs-resume-bootstrap"
    type="module"
    src="/docs/utils/docs-resume-bootstrap.mjs?v=<?= $xtendAssetVersionAttr ?>"
    data-loader-src="/xtend-loader.js?v=<?= $xtendAssetVersionAttr ?>"
    data-loader-manifest="/components/manifest.json?v=<?= $xtendAssetVersionAttr ?>"
    data-module-cache-bust="<?= $xtendAssetVersionAttr ?>"
    nonce="<?= $nonce ?>"
></script>
<script type="module" src="/docs/utils/page/index.mjs?v=<?= $xtendAssetVersionAttr ?>" nonce="<?= $nonce ?>">
</script>
<script type="module" src="/docs/utils/docs-shell-runtime.mjs?v=<?= $xtendAssetVersionAttr ?>"></script>
</body>
</html>
