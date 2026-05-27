<?php
// XTend Docs SPA – index.php
// Lädt alle .md-Dateien, parsed sie mit Parsedown und bietet SPA-Routing mit Slugs
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
$rmtPilotDocumentPath = $docsRoot . '/' . $rmtPilotDocument;
$docsRmtVNextDocument = 'xtendrmt-docs-shell-vnext.rmt';
$docsRmtVNextDocumentPath = $docsRoot . '/' . $docsRmtVNextDocument;
$rmtPhpSsrAdapterFile = $repoRoot . '/xtendrmt/rmt-php-ssr-adapter.php';
$docsRmtCompilerBridgePath = $repoRoot . '/scripts/compile_rmt_vnext_bridge.js';
$docsRmtLspBridgePath = $repoRoot . '/scripts/rmt_playground_lsp_bridge.js';
$docsRmtMaracaPreviewBridgePath = $repoRoot . '/scripts/rmt_playground_maraca_preview_bridge.js';
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
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-$nonce'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none';");

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
    __DIR__ . '/../docs/utils/pageloader.js',
    __DIR__ . '/../docs/utils/fabric-runtime.js',
    __DIR__ . '/../docs/xtendrmt-parsedown-docs.rmt',
    __DIR__ . '/../docs/xtendrmt-docs-shell-vnext.rmt',
    __DIR__ . '/../scripts/compile_rmt_vnext_bridge.js',
    __DIR__ . '/../scripts/rmt_playground_maraca_preview_bridge.js',
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
    return ($base === '' ? '' : $base) . '/' . docsNormalizeLocale($locale, $GLOBALS['docsAvailableLocales'], $GLOBALS['docsFallbackLocale']) . '/' . trim((string) ($slug ?: 'readme'), '/');
}

function docsBuildHistoryRootPath($basePath = '') {
    $base = docsNormalizeBasePath($basePath);
    return $base === '' ? '/' : $base;
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

$localizedMdFiles = docsBuildLocalizedMarkdownFiles($docsRoot, $docsAvailableLocales, $docsFallbackLocale);
$mdFiles = $localizedMdFiles[$docsDefaultLocale] ?? [];

// Slug-Generierung: z.B. components/xalert.md => components-xalert
function slugify($path) {
    return strtolower(preg_replace('/[^a-z0-9]+/i', '-', preg_replace('/\\.md$/i', '', $path)));
}

function docsRouteIdFromSlug($slug) {
    return 'docs.' . str_replace('-', '.', $slug);
}

function docsMenuIconForSlug($slug) {
    $slug = (string) $slug;
    $exact = [
        'readme' => 'home',
        'quick-start-guide' => 'book-open',
        'about' => 'info',
        'best-practices' => 'success',
        'learn-rmt' => 'book-open',
        'learn-rmt-playground' => 'terminal',
        'xtend-maraca' => 'rocket',
        'xtend-maraca-orchestration' => 'route',
        'manifest' => 'file',
        'api' => 'terminal',
        'xtend-loader' => 'download',
        'xtend-fabric' => 'zap',
        'components' => 'component',
        'component-platform' => 'layers',
        'component-catalog-coverage' => 'boxes',
        'design-tokens' => 'palette',
        'xtendrmt-overview' => 'route',
        'rmt-linter' => 'terminal',
        'rmt-language-server' => 'server',
        'performance' => 'gauge',
        'hydration-policies' => 'zap',
        'a11y-keyboard-smokes' => 'accessibility',
        'trusted-dom-sanitizing' => 'shield-check',
        'supply-chain-gates' => 'shield-check',
        'rc0-gate-matrix' => 'package',
        'rc1-readiness' => 'rocket',
        'enterprise-adoption' => 'layers'
    ];
    if (isset($exact[$slug])) return $exact[$slug];
    if (str_starts_with($slug, 'components-xcode')) return 'code';
    if (str_starts_with($slug, 'components-xicon') || str_starts_with($slug, 'components-xtheme')) return 'palette';
    if (str_starts_with($slug, 'components-xstate')) return 'database';
    if (str_starts_with($slug, 'learn-rmt-')) return str_contains($slug, 'playground') ? 'terminal' : 'book-open';
    if (str_starts_with($slug, 'xtend-maraca')) return 'rocket';
    if (str_starts_with($slug, 'components-xrouter') || str_starts_with($slug, 'xtendrmt') || str_starts_with($slug, 'rmt-')) return 'route';
    if (str_starts_with($slug, 'components-')) return 'component';
    if (str_contains($slug, 'security') || str_contains($slug, 'trusted-dom') || str_contains($slug, 'supply-chain') || str_contains($slug, 'csp') || str_contains($slug, 'network')) return 'shield-check';
    if (str_contains($slug, 'performance') || str_contains($slug, 'hydration')) return 'gauge';
    if (str_contains($slug, 'a11y') || str_contains($slug, 'screenreader') || str_contains($slug, 'motion-contrast')) return 'accessibility';
    if (str_contains($slug, 'release') || str_starts_with($slug, 'rc') || str_starts_with($slug, 'epic')) return 'rocket';
    if (str_contains($slug, 'component') || str_contains($slug, 'surface') || str_contains($slug, 'visual')) return 'layers';
    return 'docs';
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
        'import' => '/docs/utils/pageloader.js?v=' . $xtendAssetVersionAttr,
        'title' => $route['title'] ?? '',
        'document-title' => $route['documentTitle'] ?? '',
        'title-template' => $route['titleTemplate'] ?? '',
        'meta-description' => $route['metaDescription'] ?? ($metadata['seo']['description'] ?? ''),
        'meta-keywords' => $metaKeywords,
        'skeleton' => $route['skeleton'] ?? 'article',
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

function docsRouteDescriptor($route, $pathOverride = null) {
    return docsDescriptorElement('x-route', docsRouteAttributes($route, $pathOverride), []);
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

function docsBuildDocsRootShellDescriptor($allPagesMeta, $localizedAllPagesMeta, $fileToSlug, $docsAvailableLocales, $pageLocale, $docsDefaultLocale, $docsLogoUrl, $xtendAssetVersionAttr, $docsBasePath = '') {
    global $page;
    $ssrRoot = [
        'data-rmt-ssr-root' => 'docs.app.root-shell',
        'data-rmt-ssr-chunk' => 'rmt:docs.app.root-shell',
        'data-rmt-shell-prehydrated' => 'true',
        'data-rmt-hydration-mode' => 'server_prerender_hydrate',
        'data-rmt-contract' => 'xtend.docs.rmt-shell-primitives.v1'
    ];
    $routeChildren = [];
    if (isset($allPagesMeta['readme']['route'])) {
        $routeChildren[] = docsRouteDescriptor($allPagesMeta['readme']['route'], docsBuildHistoryRootPath($docsBasePath));
    }
    foreach ($localizedAllPagesMeta as $locale => $localePagesMeta) {
        foreach ($localePagesMeta as $slug => $meta) {
            $routeChildren[] = docsRouteDescriptor($meta['route'], docsBuildHistoryRoutePath($slug, $locale, $docsBasePath));
        }
    }
    foreach ($fileToSlug as $rel => $slug) {
        if (isset($allPagesMeta[$slug]['route'])) {
            $routeChildren[] = docsRouteDescriptor($allPagesMeta[$slug]['route'], docsBuildHistoryRoutePath($slug, $docsDefaultLocale, $docsBasePath));
        }
    }
    $routeChildren[] = docsDescriptorElement('x-route', [
        'path' => '*',
        'component' => 'xtend-doc-page',
        'import' => '/docs/utils/pageloader.js?v=' . $xtendAssetVersionAttr,
        'title' => 'Seite nicht gefunden',
        'document-title' => 'Seite nicht gefunden | XTend Dokumentation',
        'meta-description' => 'Die angeforderte Dokumentationsseite wurde nicht gefunden.',
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
    $menuShell = docsDescriptorElement('div', [
        'slot' => 'nav',
        'class' => 'docs-menu-shell docs-menu-shell--ssr',
        'data-docs-menu-shell' => true,
        'data-rmt-menu-placeholder' => 'true',
        'data-rmt-shell-surface' => 'docs.header.nav',
        'role' => 'list',
        'aria-label' => $pageLocale === 'en' ? 'Documentation sections' : 'Dokumentationsbereiche'
    ], [
        docsDescriptorComponent('x-icon', [
            'class' => 'docs-nav-link-icon',
            'name' => docsMenuIconForSlug($page),
            'pack' => 'lucide',
            'decorative' => true,
            'size' => '1rem'
        ], []),
        docsDescriptorElement('span', [
            'class' => 'docs-menu-section-title docs-menu-section-title--ssr',
            'role' => 'listitem'
        ], [
            docsDescriptorText($pageLocale === 'en' ? 'Documentation menu' : 'Dokumentationsmenue')
        ])
    ]);

    return [
        'type' => 'fragment',
        'children' => [
            docsDescriptorComponent('x-theme', array_replace($ssrRoot, [
                'data-rmt-surface-id' => 'docs.root',
                'data-rmt-shell-surface' => 'docs.root'
            ]), []),
            docsDescriptorComponent('x-header', array_replace($ssrRoot, [
                'src' => $docsLogoUrl,
                'logo-size' => '48',
                'sticky' => true,
                'data-xtend-skeleton' => true,
                'data-xtend-layout-reserve' => 'header',
                'data-xtend-cls-anchor' => 'docs.header',
                'style' => '--xtend-skeleton-min-height: 4.75rem; --xtend-layout-reserved-block-size: 4.75rem; --header-reserved-block-size: 4.75rem;',
                'data-rmt-surface-id' => 'docs.header',
                'data-rmt-shell-surface' => 'docs.header'
            ]), array_merge([
                docsDescriptorElement('span', ['slot' => 'title'], [docsDescriptorText('XTend Dokumentation')]),
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
                        'label' => 'Sprache',
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
                    'aria-label' => 'Dunkelmodus aktivieren',
                    'title' => 'Dunkelmodus aktivieren',
                    'aria-pressed' => 'false'
                ], [
                    docsDescriptorComponent('x-icon', ['id' => 'theme-toggle-icon', 'name' => 'moon', 'pack' => 'core', 'decorative' => true, 'size' => '1.1rem'], []),
                    docsDescriptorElement('span', ['id' => 'theme-toggle-label', 'class' => 'docs-visually-hidden'], [docsDescriptorText('Dunkelmodus aktivieren')])
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
                'style' => '--xtend-skeleton-min-height: clamp(12rem, 30vw, 22rem); --xtend-layout-reserved-block-size: clamp(12rem, 30vw, 22rem); --hero-reserved-block-size: clamp(12rem, 30vw, 22rem);',
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
                    'reuse-component' => true,
                    'skeleton' => 'article',
                    'skeleton-lines' => '10',
                    'skeleton-min-height' => 'var(--docs-route-reserved-block-size)',
                    'skeleton-label' => 'Dokumentation wird geladen',
                    'data-xtend-skeleton' => true,
                    'data-xtend-layout-reserve' => 'router route',
                    'data-xtend-cls-anchor' => 'docs.router',
                    'style' => '--xtend-skeleton-min-height: var(--docs-route-reserved-block-size); --xtend-layout-reserved-block-size: var(--docs-route-reserved-block-size); --xtend-router-reserved-block-size: var(--docs-route-reserved-block-size); --xtend-skeleton-width: calc(100% - var(--docs-viewport-gutter) - var(--docs-viewport-gutter)); --xtend-skeleton-max-width: calc(100% - var(--docs-viewport-gutter) - var(--docs-viewport-gutter)); --xtend-skeleton-margin-inline: var(--docs-viewport-gutter);',
                    'document-title-template' => '{{title}} | XTend Dokumentation',
                    'default-title' => 'XTend Dokumentation',
                    'data-rmt-ssr-root' => 'docs.router',
                    'data-rmt-ssr-chunk' => 'rmt:docs.router',
                    'data-rmt-shell-prehydrated' => 'true',
                    'data-rmt-hydration-mode' => 'server_prerender_hydrate',
                    'data-rmt-surface-id' => 'docs.router',
                    'data-rmt-shell-surface' => 'docs.router'
                ], $routeChildren)
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
    ];
}

function docsFallbackSerializeDescriptor($descriptor) {
    if (!is_array($descriptor)) return htmlspecialchars((string) $descriptor, ENT_QUOTES, 'UTF-8');
    $type = $descriptor['type'] ?? (isset($descriptor['tag']) ? 'element' : 'fragment');
    if ($type === 'text') return htmlspecialchars((string) ($descriptor['text'] ?? ''), ENT_QUOTES, 'UTF-8');
    if ($type === 'fragment') {
        return implode('', array_map('docsFallbackSerializeDescriptor', $descriptor['children'] ?? []));
    }
    $tag = preg_replace('/[^a-zA-Z0-9:-]/', '', (string) ($descriptor['tag'] ?? 'div')) ?: 'div';
    $attrs = '';
    foreach (($descriptor['attributes'] ?? []) as $name => $value) {
        if ($value === null || $value === false || $value === []) continue;
        if ($value === true) $value = 'true';
        if (is_array($value)) $value = json_encode($value, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        $attrs .= ' ' . htmlspecialchars((string) $name, ENT_QUOTES, 'UTF-8') . '="' . htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8') . '"';
    }
    $children = implode('', array_map('docsFallbackSerializeDescriptor', $descriptor['children'] ?? []));
    return '<' . $tag . $attrs . '>' . $children . '</' . $tag . '>';
}

function docsCreateRmtCompilerBridge($bridgePath, $repoRoot, $nodeBinary = 'node') {
    return function ($source, array $context = []) use ($bridgePath, $repoRoot, $nodeBinary) {
        if (!is_readable($bridgePath) || !function_exists('proc_open')) {
            return [
                'schema' => 'xtend.docs.rmt-compiler-bridge.v1',
                'ok' => false,
                'status' => 'bridge-unavailable',
                'coreDocument' => null,
                'diagnostics' => [[
                    'code' => 'xtend.docs.rmt_compiler_bridge.unavailable',
                    'severity' => 'error',
                    'message' => 'The docs PHP host could not start the Node vNext compiler bridge.'
                ]]
            ];
        }
        $payload = json_encode([
            'source' => (string) $source,
            'filePath' => $context['filePath'] ?? 'docs/xtendrmt-docs-shell-vnext.rmt',
            'options' => $context['options'] ?? []
        ], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        $descriptorSpec = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w']
        ];
        $command = escapeshellcmd((string) $nodeBinary) . ' ' . escapeshellarg((string) $bridgePath);
        $process = proc_open($command, $descriptorSpec, $pipes, (string) $repoRoot);
        if (!is_resource($process)) {
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
        }
        fwrite($pipes[0], $payload ?: '{}');
        fclose($pipes[0]);
        $stdout = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[2]);
        $exitCode = proc_close($process);
        $decoded = json_decode((string) $stdout, true);
        if (is_array($decoded)) {
            $decoded['exitCode'] = $exitCode;
            if ($stderr !== '') $decoded['stderr'] = trim($stderr);
            return $decoded;
        }
        return [
            'schema' => 'xtend.docs.rmt-compiler-bridge.v1',
            'ok' => false,
            'status' => 'bridge-output-invalid',
            'coreDocument' => null,
            'diagnostics' => [[
                'code' => 'xtend.docs.rmt_compiler_bridge.output_invalid',
                'severity' => 'error',
                'message' => trim($stderr) ?: 'The Node vNext compiler bridge did not return JSON.'
            ]]
        ];
    };
}

function docsCreateRmtMaracaPreviewBridge($bridgePath, $repoRoot, $nodeBinary = 'node') {
    return function ($source, array $context = []) use ($bridgePath, $repoRoot, $nodeBinary) {
        if (!is_readable($bridgePath) || !function_exists('proc_open')) {
            return [
                'schema' => 'xtend.docs.rmt-playground.maraca-preview.v1',
                'ok' => false,
                'status' => 'bridge-unavailable',
                'diagnostics' => [[
                    'code' => 'xtend.docs.rmt_playground.maraca_preview.unavailable',
                    'severity' => 'error',
                    'message' => 'The docs PHP host could not start the Node Maraca preview bridge.'
                ]],
                'summary' => new stdClass(),
                'features' => new stdClass(),
                'runtimeModules' => [],
                'plan' => null
            ];
        }
        $payload = json_encode([
            'source' => (string) $source,
            'filePath' => $context['filePath'] ?? 'docs/rmt-playground-source.rmt',
            'maraca' => $context['maraca'] ?? [],
            'profile' => $context['profile'] ?? 'debug',
            'lazy' => $context['lazy'] ?? 'component',
            'css' => $context['css'] ?? 'external',
            'stack' => $context['stack'] ?? 'runtime',
            'components' => $context['components'] ?? 'document'
        ], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        $descriptorSpec = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w']
        ];
        $command = escapeshellcmd((string) $nodeBinary) . ' ' . escapeshellarg((string) $bridgePath);
        $process = proc_open($command, $descriptorSpec, $pipes, (string) $repoRoot);
        if (!is_resource($process)) {
            return [
                'schema' => 'xtend.docs.rmt-playground.maraca-preview.v1',
                'ok' => false,
                'status' => 'bridge-start-failed',
                'diagnostics' => [[
                    'code' => 'xtend.docs.rmt_playground.maraca_preview.start_failed',
                    'severity' => 'error',
                    'message' => 'The docs PHP host failed to open the Node Maraca preview bridge.'
                ]],
                'summary' => new stdClass(),
                'features' => new stdClass(),
                'runtimeModules' => [],
                'plan' => null
            ];
        }
        fwrite($pipes[0], $payload ?: '{}');
        fclose($pipes[0]);
        $stdout = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[2]);
        $exitCode = proc_close($process);
        $decoded = json_decode((string) $stdout, true);
        if (is_array($decoded)) {
            $decoded['exitCode'] = $exitCode;
            if ($stderr !== '') $decoded['stderr'] = trim($stderr);
            return $decoded;
        }
        return [
            'schema' => 'xtend.docs.rmt-playground.maraca-preview.v1',
            'ok' => false,
            'status' => 'bridge-output-invalid',
            'diagnostics' => [[
                'code' => 'xtend.docs.rmt_playground.maraca_preview.output_invalid',
                'severity' => 'error',
                'message' => trim($stderr) ?: 'The Node Maraca preview bridge did not return JSON.'
            ]],
            'summary' => new stdClass(),
            'features' => new stdClass(),
            'runtimeModules' => [],
            'plan' => null
        ];
    };
}

function docsCreateRmtLspBridge($bridgePath, $repoRoot, $nodeBinary = 'node') {
    return function ($source, array $context = []) use ($bridgePath, $repoRoot, $nodeBinary) {
        if (!is_readable($bridgePath) || !function_exists('proc_open')) {
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
        $descriptorSpec = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w']
        ];
        $command = escapeshellcmd((string) $nodeBinary) . ' ' . escapeshellarg((string) $bridgePath);
        $process = proc_open($command, $descriptorSpec, $pipes, (string) $repoRoot);
        if (!is_resource($process)) {
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
        }
        fwrite($pipes[0], $payload ?: '{}');
        fclose($pipes[0]);
        $stdout = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[2]);
        $exitCode = proc_close($process);
        $decoded = json_decode((string) $stdout, true);
        if (is_array($decoded)) {
            $decoded['exitCode'] = $exitCode;
            if ($stderr !== '') $decoded['stderr'] = trim($stderr);
            return $decoded;
        }
        return [
            'schema' => 'xtend.docs.rmt-playground.lsp-bridge.v1',
            'ok' => false,
            'status' => 'bridge-output-invalid',
            'diagnostics' => [[
                'code' => 'xtend.docs.rmt_lsp_bridge.output_invalid',
                'severity' => 'error',
                'source' => 'xtend-rmt-language-server',
                'message' => trim($stderr) ?: 'The Node RMT Language Server bridge did not return JSON.'
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

function docsRmtPlaygroundPreviewValue($value, $maxLength = 240) {
    if (is_bool($value)) return $value;
    if (is_int($value) || is_float($value)) return (string) $value;
    $text = preg_replace('/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/', '', (string) $value);
    return substr($text, 0, max(1, (int) $maxLength));
}

function docsRmtPlaygroundFindCoreRecord($records, $name, $prefix = '') {
    if (!is_array($records)) return null;
    $needle = (string) $name;
    if ($needle === '') return null;
    $prefixed = $prefix !== '' && !str_starts_with($needle, $prefix . ':') ? $prefix . ':' . $needle : $needle;
    foreach ($records as $record) {
        if (!is_array($record)) continue;
        $recordName = (string) ($record['name'] ?? '');
        $recordId = (string) ($record['id'] ?? '');
        if ($recordName === $needle || $recordId === $needle || $recordId === $prefixed) return $record;
    }
    return null;
}

function docsRmtPlaygroundInitialDataForSurface($surface, $coreDocument) {
    if (!is_array($surface) || !is_array($coreDocument)) return null;
    $source = isset($surface['source']) && is_array($surface['source']) ? $surface['source'] : [];
    $sourceKind = (string) ($source['kind'] ?? '');
    $sourceTarget = (string) ($source['target'] ?? '');
    if ($sourceTarget === '') return null;

    $stateTarget = $sourceTarget;
    if ($sourceKind === 'selector') {
        $selector = docsRmtPlaygroundFindCoreRecord($coreDocument['selectors'] ?? [], $sourceTarget, 'selector');
        if (!$selector || !isset($selector['source']) || !is_array($selector['source'])) return null;
        $stateTarget = (string) ($selector['source']['target'] ?? '');
    }

    $state = docsRmtPlaygroundFindCoreRecord($coreDocument['states'] ?? [], $stateTarget, 'state');
    $initial = $state && isset($state['initial']) && is_array($state['initial']) ? $state['initial'] : null;
    return $initial;
}

function docsRmtPlaygroundSafePreviewTag($component) {
    $tag = strtolower(trim((string) $component));
    if ($tag === '') return '';
    if (preg_match('/^[a-z][a-z0-9]*-[a-z0-9][a-z0-9-]*$/', $tag) !== 1) return '';
    return $tag;
}

function docsRmtPlaygroundPreviewTextFromData($data, $fallback = '') {
    if (!is_array($data)) return docsRmtPlaygroundPreviewValue($fallback);
    foreach (['message', 'text', 'title', 'label', 'name', 'status', 'value', 'id'] as $key) {
        if (!array_key_exists($key, $data)) continue;
        $value = $data[$key];
        if (is_array($value) || is_object($value)) continue;
        $text = docsRmtPlaygroundPreviewValue($value);
        if ($text !== '') return $text;
    }
    return docsRmtPlaygroundPreviewValue($fallback);
}

function docsRmtPlaygroundPreviewDataAttribute($data, $keys, $fallback = null, $maxLength = 240) {
    if (is_array($data)) {
        foreach ((array) $keys as $key) {
            if (!array_key_exists($key, $data)) continue;
            $value = $data[$key];
            if (is_array($value) || is_object($value)) continue;
            return docsRmtPlaygroundPreviewValue($value, $maxLength);
        }
    }
    if ($fallback === null) return null;
    return docsRmtPlaygroundPreviewValue($fallback, $maxLength);
}

function docsRmtPlaygroundPreviewBoolAttribute($data, $key) {
    if (!is_array($data) || !array_key_exists($key, $data)) return null;
    return filter_var($data[$key], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
}

function docsRmtPlaygroundSafePreviewUrl($value) {
    $url = trim((string) $value);
    if ($url === '') return null;
    if (preg_match('/^(#|\\/|\\.\\/|\\.\\.\\/|https?:|mailto:|tel:)/i', $url) !== 1) return null;
    return docsRmtPlaygroundPreviewValue($url, 512);
}

function docsRmtPlaygroundPreviewAttributesForComponent($component, $data, $surface) {
    $surfaceId = (string) ($surface['id'] ?? $surface['name'] ?? 'surface');
    $surfaceName = (string) ($surface['name'] ?? $surfaceId);
    $attributes = [
        'data-rmt-playground-surface' => docsRmtPlaygroundPreviewValue($surfaceId, 160),
        'data-rmt-surface-name' => docsRmtPlaygroundPreviewValue($surfaceName, 160),
        'data-rmt-surface-kind' => docsRmtPlaygroundPreviewValue($surface['kind'] ?? 'surface', 80)
    ];

    $candidateMap = [
        'label' => ['label', 'title', 'name', 'id'],
        'title' => ['title', 'label', 'name'],
        'name' => ['name', 'id'],
        'value' => ['value'],
        'state' => ['state', 'status', 'tone'],
        'type' => ['type', 'tone'],
        'variant' => ['variant', 'tone'],
        'placeholder' => ['placeholder']
    ];
    foreach ($candidateMap as $attribute => $keys) {
        $value = docsRmtPlaygroundPreviewDataAttribute($data, $keys);
        if ($value !== null && $value !== '') $attributes[$attribute] = $value;
    }

    foreach (['busy', 'checked', 'disabled', 'dismissible', 'loading', 'open', 'polite', 'required', 'selected'] as $booleanKey) {
        $value = docsRmtPlaygroundPreviewBoolAttribute($data, $booleanKey);
        if ($value !== null) $attributes[$booleanKey] = $value;
    }

    if ($component === 'x-status') {
        $tone = strtolower((string) docsRmtPlaygroundPreviewDataAttribute($data, ['tone', 'type', 'state'], 'info', 64));
        if (!in_array($tone, ['info', 'success', 'warning', 'error'], true)) $tone = 'info';
        $attributes['type'] = $tone;
        $attributes['state'] = docsRmtPlaygroundPreviewDataAttribute($data, ['state', 'status', 'tone'], $tone, 64);
        $message = docsRmtPlaygroundPreviewTextFromData($data, 'Status ready');
        if ($message !== '') $attributes['message'] = $message;
    }

    if ($component === 'x-progress') {
        $attributes['value'] = docsRmtPlaygroundPreviewDataAttribute($data, ['value', 'progress', 'percent'], '0', 32);
        $attributes['max'] = docsRmtPlaygroundPreviewDataAttribute($data, ['max', 'total'], '100', 32);
    }

    if (in_array($component, ['x-link', 'x-button'], true)) {
        $href = docsRmtPlaygroundSafePreviewUrl($data['href'] ?? $data['url'] ?? '');
        if ($href !== null) $attributes['href'] = $href;
    }

    return array_filter($attributes, function ($value) {
        return $value !== null && $value !== '';
    });
}

function docsRmtPlaygroundComponentDescriptor($surface, $coreDocument) {
    $component = docsRmtPlaygroundSafePreviewTag($surface['component'] ?? '');
    if ($component === '') return null;
    $data = docsRmtPlaygroundInitialDataForSurface($surface, $coreDocument);
    if (!is_array($data)) $data = [];
    $surfaceId = (string) ($surface['id'] ?? $surface['name'] ?? $component);
    $text = docsRmtPlaygroundPreviewTextFromData($data, $surface['name'] ?? $surfaceId);
    $descriptor = [
        'type' => 'component',
        'component' => $component,
        'tag' => $component,
        'id' => docsRmtPlaygroundPreviewValue($surfaceId, 160),
        'key' => docsRmtPlaygroundPreviewValue($surface['key'] ?? $surfaceId, 160),
        'attributes' => docsRmtPlaygroundPreviewAttributesForComponent($component, $data, $surface)
    ];
    if ($text !== '') {
        $descriptor['children'] = [[
            'type' => 'text',
            'text' => $text
        ]];
    }
    return $descriptor;
}

function docsRmtPlaygroundComponentPreview($surface, $coreDocument) {
    $descriptor = docsRmtPlaygroundComponentDescriptor($surface, $coreDocument);
    if (!$descriptor) return null;
    return [
        'schema' => 'xtend.docs.rmt-playground.component-preview.v1',
        'renderMode' => 'dom_descriptor',
        'renderer' => 'xtendrmt/rmt-dom-descriptor-renderer',
        'tag' => $descriptor['tag'],
        'descriptor' => $descriptor,
        'model' => [
            'surface' => [
                'id' => $surface['id'] ?? '',
                'name' => $surface['name'] ?? '',
                'kind' => $surface['kind'] ?? '',
                'component' => $surface['component'] ?? ''
            ],
            'state' => docsRmtPlaygroundInitialDataForSurface($surface, $coreDocument) ?: new stdClass()
        ],
        'source' => $surface['source']['ref'] ?? ''
    ];
}

function docsRmtPlaygroundPreviewFromCore($coreDocument) {
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
    foreach (($coreDocument['surfaces'] ?? []) as $surface) {
        if (!is_array($surface)) continue;
        $laneRefs = array_values(array_filter($surface['laneRefs'] ?? [], 'is_string'));
        $surfaceLanes = [];
        foreach ($laneRefs as $laneRef) {
            if (isset($lanesById[$laneRef])) $surfaceLanes[] = $lanesById[$laneRef];
        }
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
            'componentPreview' => docsRmtPlaygroundComponentPreview($surface, $coreDocument)
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
    $bridge = docsCreateRmtLspBridge($bridgePath, $repoRoot);
    $result = $bridge($source, [
        'filePath' => 'docs/rmt-playground-source.rmt',
        'version' => isset($decoded['version']) ? (int) $decoded['version'] : 1
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
    $compiler = docsCreateRmtCompilerBridge($bridgePath, $repoRoot);
    $compiled = $compiler($source, [
        'filePath' => 'docs/rmt-playground-source.rmt',
        'options' => [
            'documentId' => 'docs.rmt.playground',
            'source' => 'docs-rmt-playground'
        ]
    ]);
    $diagnostics = docsRmtPlaygroundNormalizeDiagnostics($compiled['diagnostics'] ?? $compiled['compilerDiagnostics'] ?? []);
    $ok = isset($compiled['ok']) ? (bool) $compiled['ok'] : false;
    $response = [
        'schema' => $schema,
        'ok' => $ok,
        'status' => (string) ($compiled['status'] ?? ($ok ? 'compiled' : 'failed')),
        'diagnostics' => $diagnostics,
        'coreJson' => $ok ? (string) ($compiled['coreJson'] ?? '') : null,
        'preview' => $ok ? docsRmtPlaygroundPreviewFromCore($compiled['coreDocument'] ?? null) : docsRmtPlaygroundPreviewFromCore(null)
    ];
    if ($maracaOptions !== null) {
        $response['maraca'] = ($ok && $maracaBridgePath)
            ? docsRmtPlaygroundCompileMaracaPreview($repoRoot, $maracaBridgePath, $source, $maracaOptions)
            : docsRmtPlaygroundMaracaPreviewUnavailable('compile_failed', $diagnostics);
    }
    docsRmtPlaygroundJson($response, 200);
}

function docsSsrEndpointUrl($page, $locale) {
    return docsEndpointPath('xtend-docs-rmt-ssr=shell&format=jsonl&page=' . rawurlencode((string) $page) . '&locale=' . rawurlencode((string) $locale));
}

function docsCreateDocsSsrAdapter($repoRoot, $bridgePath) {
    if (!function_exists('createRmtPhpSsrAdapter')) return null;
    $boundary = 'xtend.security.sanitizing-boundary.v1';
    return createRmtPhpSsrAdapter([
        'manifest' => docsLoadComponentManifest($repoRoot),
        'compileRmtVNextSource' => docsCreateRmtCompilerBridge($bridgePath, $repoRoot),
        'defaultTrustBoundary' => $boundary,
        'staticDataSources' => [
            'xtendrmt.docs.php-ssr.shell' => [
                'html' => '<section data-rmt-stream="xtendrmt.docs.php-ssr.shell" data-rmt-trust-boundary="' . $boundary . '" hidden></section>',
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
            'docs.page.payload' => [
                'html' => '<section data-rmt-stream="docs.page.payload" data-rmt-trust-boundary="' . $boundary . '" hidden></section>',
                'trustBoundary' => $boundary
            ],
            'docs.shell.ssr' => [
                'html' => '<section data-rmt-stream="docs.shell.ssr" data-rmt-trust-boundary="' . $boundary . '" hidden></section>',
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

function docsRenderDocsSsrPrehydration($repoRoot, $bridgePath, $sourcePath, $descriptor, $page, $locale) {
    $endpoint = docsSsrEndpointUrl($page, $locale);
    $source = is_readable($sourcePath) ? file_get_contents($sourcePath) : '';
    $fallbackHtml = docsFallbackSerializeDescriptor($descriptor);
    $result = [
        'schema' => 'xtend.docs.php-ssr-prehydration.v1',
        'ok' => false,
        'status' => 'degraded',
        'endpoint' => $endpoint,
        'source' => 'docs/xtendrmt-docs-shell-vnext.rmt',
        'compilerBridge' => [
            'schema' => 'xtend.docs.rmt-compiler-bridge.v1',
            'runner' => 'scripts/compile_rmt_vnext_bridge.js',
            'injected' => false
        ],
        'ssrEndpoint' => [
            'schema' => 'xtend.docs.rmt-ssr-endpoint.v1',
            'format' => 'jsonl',
            'contentType' => 'application/x-ndjson',
            'url' => $endpoint
        ],
        'shellPrimitives' => [
            'schema' => 'xtend.docs.rmt-shell-primitives.v1',
            'rootSurfaces' => ['docs.root', 'docs.header', 'docs.hero', 'docs.router', 'docs.page', 'docs.sidebar', 'docs.footer', 'docs.diagnostics'],
            'hydrationMode' => 'server_prerender_hydrate'
        ],
        'renderResult' => null,
        'hydration' => null,
        'chunks' => [],
        'diagnostics' => [],
        'html' => $fallbackHtml
    ];
    if ($source === '') {
        $result['diagnostics'][] = [
            'code' => 'xtend.docs.rmt_shell_source_missing',
            'severity' => 'error',
            'message' => 'The docs vNext shell source could not be read.'
        ];
        return $result;
    }
    $adapter = docsCreateDocsSsrAdapter($repoRoot, $bridgePath);
    if (!$adapter) {
        $result['diagnostics'][] = [
            'code' => 'xtend.docs.php_ssr_adapter_missing',
            'severity' => 'error',
            'message' => 'The PHP SSR adapter factory is not available.'
        ];
        return $result;
    }
    $renderResult = $adapter->render(docsBuildDocsSsrInput($source, 'docs/xtendrmt-docs-shell-vnext.rmt', $descriptor), [
        'requestId' => 'docs-php-ssr-' . preg_replace('/[^a-z0-9_-]+/i', '-', (string) $locale . '-' . (string) $page),
        'rootId' => 'xtend-docs-rmt-root',
        'namespace' => 'docs',
        'templateId' => 'docs.app.root-shell',
        'model' => [
            'page' => $page,
            'locale' => $locale,
            'ssrEndpoint' => $endpoint
        ]
    ]);
    $result['renderResult'] = $renderResult;
    $result['hydration'] = $renderResult['hydration'] ?? null;
    $result['chunks'] = $renderResult['chunks'] ?? [];
    $result['diagnostics'] = $renderResult['diagnostics'] ?? [];
    $result['html'] = ($renderResult['html'] ?? '') !== '' ? $renderResult['html'] : $fallbackHtml;
    $result['ok'] = ($renderResult['ok'] ?? false) === true;
    $result['status'] = $result['ok'] ? 'prehydrated' : 'degraded';
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
    $parts = docsSplitLocalizedPath($rawSlug, $availableLocales);
    $requestedLocale = docsNormalizeLocale($parts['locale'] ?? $rawLocale, $availableLocales, $fallbackLocale);
    $slug = slugify($parts['slug'] ?? 'readme');
    if ($slug === '') $slug = 'readme';
    $hasRequested = isset($localizedSlugToFile[$requestedLocale][$slug]);
    $resolvedLocale = $hasRequested ? $requestedLocale : $fallbackLocale;
    $translationAvailable = $hasRequested;
    if (!isset($localizedSlugToFile[$resolvedLocale][$slug])) {
        return null;
    }
    return [
        'slug' => $slug,
        'requestedLocale' => $requestedLocale,
        'resolvedLocale' => $resolvedLocale,
        'translationAvailable' => $translationAvailable,
        'rel' => $localizedSlugToFile[$resolvedLocale][$slug]
    ];
}

// Routing: Slug aus URL
$docsRequestRoutePath = docsRoutePathFromRequest($docsBasePath);
$pageRequest = docsResolveLocalizedPage($_GET['page'] ?? $docsRequestRoutePath, $_GET['locale'] ?? $docsDefaultLocale, $localizedSlugToFile, $docsAvailableLocales, $docsFallbackLocale);
if ($pageRequest) {
    $page = $pageRequest['slug'];
    $pageLocale = $pageRequest['resolvedLocale'];
    $mdFile = $localizedMdFiles[$pageLocale][$pageRequest['rel']];
} else {
    // Default: README.md
    $page = 'readme';
    $pageLocale = $docsDefaultLocale;
    $mdFile = $localizedMdFiles[$pageLocale]['README.md'] ?? ($docsRoot . '/' . $pageLocale . '/README.md');
    $page = $fileToSlug['README.md'] ?? slugify('README.md');
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
$Parsedown = new Parsedown();
$Parsedown->setSafeMode(true);

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

// Navigation generieren
function navLinks($fileToSlug) {
    $nav = "<nav><ul>";
    foreach ($fileToSlug as $rel => $slug) {
        $title = htmlspecialchars(ucfirst(preg_replace('/[-_]/', ' ', preg_replace('/\\.md$/i', '', basename($rel)))));
        $nav .= "<li><a href='?page=$slug' data-link>$title</a></li>";
    }
    $nav .= "</ul></nav>";
    return $nav;
}

// --- Nach dem Parsen aller Seiten: JS-Objekt für alle Seiteninhalte ---
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
        $mdFile = $localizedMdFiles[$locale][$rel];
        $mdContent = file_get_contents($mdFile);
        $meta = docsBuildPageMeta($slug, $rel, $mdContent, $locale, $locale, true);
        $localizedAllPagesMeta[$locale][$slug] = $meta;
        if ($slug === $page && $locale === $pageLocale) {
            $localizedAllPages[$locale][$slug] = $Parsedown->text($mdContent);
        }
        $localizedTitles[$locale][$slug] = $meta['title'];
        if ($locale === $docsDefaultLocale) {
            $allPagesMeta[$slug] = $meta;
            if ($slug === $page && $locale === $pageLocale) {
                $allPages[$slug] = $Parsedown->text($mdContent);
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
$rmtPilotDocumentJson = docsJsonEncodeForHtml($rmtPilotDocumentData);
$initialDocsSlug = isset($localizedAllPagesMeta[$pageLocale][$page]) ? $page : 'readme';
$initialTitle = $localizedAllPagesMeta[$pageLocale][$initialDocsSlug]['documentTitle'] ?? 'XTend Dokumentation';
$initialDescription = $localizedAllPagesMeta[$pageLocale][$initialDocsSlug]['metaDescription'] ?? 'XTend Dokumentation';
$initialKeywords = implode(', ', $localizedAllPagesMeta[$pageLocale][$initialDocsSlug]['metaKeywords'] ?? ['xtend', 'dokumentation']);
$docsRootShellDescriptor = docsBuildDocsRootShellDescriptor(
    $allPagesMeta,
    $localizedAllPagesMeta,
    $fileToSlug,
    $docsAvailableLocales,
    $pageLocale,
    $docsDefaultLocale,
    htmlspecialchars_decode($docsLogoUrl, ENT_QUOTES),
    $xtendAssetVersionAttr,
    $docsBasePath
);
$docsSsrEndpoint = docsSsrEndpointUrl($initialDocsSlug, $pageLocale);
$docsSsrPrehydration = docsRenderDocsSsrPrehydration(
    $repoRoot,
    $docsRmtCompilerBridgePath,
    $docsRmtVNextDocumentPath,
    $docsRootShellDescriptor,
    $initialDocsSlug,
    $pageLocale
);
if (isset($_GET['xtend-docs-rmt-ssr']) && $_GET['xtend-docs-rmt-ssr'] === 'shell') {
    $streamPageRequest = docsResolveLocalizedPage($_GET['page'] ?? $initialDocsSlug, $_GET['locale'] ?? $pageLocale, $localizedSlugToFile, $docsAvailableLocales, $docsFallbackLocale);
    $streamPage = $streamPageRequest['slug'] ?? $initialDocsSlug;
    $streamLocale = $streamPageRequest['resolvedLocale'] ?? $pageLocale;
    $streamDescriptor = docsBuildDocsRootShellDescriptor(
        $allPagesMeta,
        $localizedAllPagesMeta,
        $fileToSlug,
        $docsAvailableLocales,
        $streamLocale,
        $docsDefaultLocale,
        htmlspecialchars_decode($docsLogoUrl, ENT_QUOTES),
        $xtendAssetVersionAttr,
        $docsBasePath
    );
    $streamSource = is_readable($docsRmtVNextDocumentPath) ? file_get_contents($docsRmtVNextDocumentPath) : '';
    $streamAdapter = docsCreateDocsSsrAdapter($repoRoot, $docsRmtCompilerBridgePath);
    header('Content-Type: application/x-ndjson; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
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
    foreach ($streamAdapter->streamJsonl(docsBuildDocsSsrInput($streamSource, 'docs/xtendrmt-docs-shell-vnext.rmt', $streamDescriptor), [
        'requestId' => 'docs-php-ssr-stream-' . preg_replace('/[^a-z0-9_-]+/i', '-', $streamLocale . '-' . $streamPage),
        'rootId' => 'xtend-docs-rmt-root',
        'namespace' => 'docs',
        'templateId' => 'docs.app.root-shell',
        'model' => [
            'page' => $streamPage,
            'locale' => $streamLocale,
            'ssrEndpoint' => docsSsrEndpointUrl($streamPage, $streamLocale)
        ]
    ]) as $line) {
        echo $line;
        if (function_exists('ob_flush')) @ob_flush();
        flush();
    }
    exit;
}
?><!DOCTYPE html>
<html lang="<?= htmlspecialchars($initialLocaleConfig['htmlLang'] ?? $pageLocale, ENT_QUOTES, 'UTF-8') ?>">
<head>
    <meta charset="UTF-8">
    <title><?= htmlspecialchars($initialTitle, ENT_QUOTES, 'UTF-8') ?></title>
    <meta name="description" content="<?= htmlspecialchars($initialDescription, ENT_QUOTES, 'UTF-8') ?>">
    <meta name="keywords" content="<?= htmlspecialchars($initialKeywords, ENT_QUOTES, 'UTF-8') ?>">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="xtend-preload" content="x-theme,x-button,x-icon,x-link,x-input,x-form,x-header,x-hero,x-router,x-footer,x-select,x-section,x-code,x-modal,x-dialog">
    <link rel="icon" href="<?= $docsFaviconIcoUrl ?>" sizes="any">
    <link rel="icon" type="image/png" sizes="32x32" href="<?= $docsFavicon32Url ?>">
    <link rel="icon" type="image/png" sizes="16x16" href="<?= $docsFavicon16Url ?>">
    <link rel="apple-touch-icon" href="<?= $docsAppleTouchIconUrl ?>">
    <link rel="stylesheet" href="/xtend.css?v=<?= $xtendAssetVersionAttr ?>">
    <script src="/fabric/xtend-fabric.js?v=<?= $xtendAssetVersionAttr ?>"></script>
    <script type="module" src="/xtend-loader.js?v=<?= $xtendAssetVersionAttr ?>" data-manifest="/components/manifest.json?v=<?= $xtendAssetVersionAttr ?>" data-module-cache-bust="<?= $xtendAssetVersionAttr ?>"></script>
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
          --docs-code-bg: #10131a;
          --x-code-bg: #10131a;
          --x-code-text: #f8fafc;
          --x-code-border: rgba(15, 23, 42, 0.18);
          --docs-shell-vertical-gap: 1.2rem;
          --docs-viewport-gutter: 0.5rem;
          --docs-layout-gap: clamp(1rem, 2.2vw, 2.5rem);
          --docs-sidebar-width: clamp(20rem, 24vw, 27rem);
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
          position: relative;
          z-index: 20;
        }
        x-header::part(root) {
          margin-left: var(--docs-viewport-gutter);
          margin-right: var(--docs-viewport-gutter);
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
          grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
          gap: 0.85rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .docs-menu-section {
          max-width: 100%;
          min-width: 0;
          padding: 0.65rem;
          border: 1px solid var(--border-color);
          border-radius: 0.7rem;
          background: var(--surface-muted);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          box-sizing: border-box;
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
          display: grid;
          gap: 0.42rem;
          min-width: 0;
          max-width: 100%;
        }
        .docs-menu-node {
          display: grid;
          gap: 0.3rem;
          min-width: 0;
          max-width: 100%;
          isolation: isolate;
        }
        .docs-menu-node[data-doc-depth="0"] > x-link {
          font-weight: 650;
        }
        .docs-menu-node[data-doc-depth="1"] > x-link,
        .docs-menu-node[data-doc-depth="2"] > x-link {
          font-size: 0.94rem;
        }
        .docs-menu-section x-link {
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
        .docs-nav-link::part(link) {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 0.45rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          color: inherit;
          text-decoration: none;
          overflow-wrap: anywhere;
        }
        .docs-menu-link-icon,
        .docs-nav-link-icon {
          color: var(--primary-color);
          flex: none;
          opacity: 0.92;
        }
        .docs-menu-link-label,
        .docs-nav-link-label {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .docs-menu-section x-link:hover,
        .docs-menu-section x-link[active] {
          background: var(--docs-menu-highlight-bg);
          border-color: var(--docs-menu-highlight-border);
          color: var(--primary-color);
        }
        .docs-menu-section x-link[active] {
          font-weight: 700;
          box-shadow: inset 3px 0 0 var(--docs-menu-active-rail);
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
          max-width: 30rem;
          min-width: 0;
          box-sizing: border-box;
          --form-padding: 0;
          --form-gap: 0;
          --form-background: transparent;
          --form-border: 0;
          --form-shadow: none;
          margin: 0;
          padding: 0;
          border: 0;
          background: transparent;
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
          border: 1px solid var(--border-color);
          background: var(--section-bg);
          color: var(--text-color);
        }
        #search-results x-link {
          display: block;
          padding: 0.42rem 0.5rem;
          border-radius: 0.45rem;
        }
        #search-results x-link:hover {
          background: rgba(14, 78, 129, 0.12);
        }
        x-hero.docs-hero {
          display: block;
          margin: 0 var(--docs-viewport-gutter);
          max-width: calc(100% - var(--docs-viewport-gutter) - var(--docs-viewport-gutter));
          min-width: 0;
          box-sizing: border-box;
          --hero-padding: clamp(2.5rem, 6vw, 4.5rem) 1.25rem;
          --hero-radius: 0.75rem;
          --hero-font-size: clamp(1rem, 2vw, 1.25rem);
          --hero-content-max-width: none;
          --hero-content-margin: 0;
          --hero-content-padding: clamp(1.8rem, 4vw, 3.4rem) clamp(1.5rem, 3.5vw, 3rem);
        }
        x-hero.docs-hero h1 {
          font-size: clamp(2rem, 5vw, 4.2rem);
          line-height: 1.02;
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
        .docs-article-surface,
        .docs-page-sidebar {
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .docs-article-surface {
          background: var(--section-bg);
          color: var(--text-color);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: clamp(1rem, 2vw, 2rem);
          min-block-size: var(--docs-route-reserved-block-size);
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
        }
        [data-theme="dark"] .docs-article-surface {
          box-shadow: 0 20px 52px rgba(0, 0, 0, 0.45);
        }
        .docs-page-sidebar {
          position: static;
          display: grid;
          gap: 0.85rem;
          align-self: start;
        }
        .docs-sidebar-section {
          background: var(--docs-sidebar-bg);
          color: var(--text-color);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0.9rem;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
        }
        [data-theme="dark"] .docs-sidebar-section {
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.36);
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
        xtend-doc-page {
          display: block;
          width: 100%;
          max-width: none;
          box-sizing: border-box;
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.16s ease, transform 0.16s ease;
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
          .docs-page-sidebar {
            position: static;
          }
          .docs-menu-shell {
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
    window.xtendInitialDocsSlug = <?= docsJsonEncodeForHtml($initialDocsSlug); ?>;
    window.xtendInitialDocsLocale = <?= docsJsonEncodeForHtml($pageLocale); ?>;
    window.xtendDocsLocales = <?php echo docsJsonEncodeForHtml($docsAvailableLocales); ?>;
    window.xtendDocsI18n = {
      schema: 'xtend.docs.i18n.v1',
      defaultLocale: <?= docsJsonEncodeForHtml($docsDefaultLocale); ?>,
      fallbackLocale: <?= docsJsonEncodeForHtml($docsFallbackLocale); ?>,
      storageKey: 'xtend.docs.locale',
      stateKeys: {
        locale: 'xtend.docs.locale',
        target: 'xtend.docs.locale.target',
        source: 'xtend.docs.locale.source',
        status: 'xtend.docs.locale.status',
        busy: 'xtend.docs.locale.busy',
        transition: 'xtend.docs.locale.transition',
        error: 'xtend.docs.locale.error',
        available: 'xtend.docs.locale.available',
        fallback: 'xtend.docs.locale.fallback'
      },
      available: Object.keys(window.xtendDocsLocales || {})
    };
    window.xtendDocsLocalizedPages = <?php echo docsJsonEncodeForHtml($localizedAllPages); ?>;
    window.xtendDocsLocalizedPagesMeta = <?php echo docsJsonEncodeForHtml(docsCompactLocalizedMetaForBootstrap($localizedAllPagesMeta)); ?>;
    window.xtendDocsLocalizedTitles = <?php echo docsJsonEncodeForHtml($localizedTitles); ?>;
    window.xtendDocsBasePath = <?= docsJsonEncodeForHtml($docsBasePath); ?>;
    window.xtendDocsRoutingMode = 'history';
    (function() {
      const config = window.xtendDocsI18n || {};
      const available = config.available || ['de'];
      const fallback = config.fallbackLocale || 'de';
      const basePath = String(window.xtendDocsBasePath || '').replace(/\/+$/, '');
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
      const slug = route.slug || window.xtendInitialDocsSlug || 'readme';
      const canonicalPath = (basePath || '') + '/' + window.xtendDocsCurrentLocale + '/' + slug;
      const currentPath = location.pathname.replace(/\/+$/, '') || '/';
      if (location.hash || currentPath !== canonicalPath.replace(/\/+$/, '')) {
        history.replaceState(history.state || null, '', canonicalPath);
      }
    })();
    window.xtendDocsPages = <?php echo docsJsonEncodeForHtml($allPages); ?>;
    window.xtendDocsPageEndpoint = <?= docsJsonEncodeForHtml(docsEndpointPath('xtend-docs-page={slug}&locale={locale}')); ?>;
    window.xtendDocsRmtSsrEndpoint = <?= docsJsonEncodeForHtml($docsSsrEndpoint); ?>;
    window.xtendDocsSsrPrehydration = <?php echo docsJsonEncodeForHtml(docsCompactDocsSsrPrehydrationForBootstrap($docsSsrPrehydration)); ?>;
    window.xtendDocsPagesMeta = <?php echo docsJsonEncodeForHtml(docsCompactMetaMapForBootstrap($allPagesMeta)); ?>;
    window.xtendDocsTitles = <?php echo docsJsonEncodeForHtml($titles); ?>;
    window.xtendDocsAssetUrls = {
      favicon: '<?= $docsFaviconIcoUrl ?>',
      favicon32: '<?= $docsFavicon32Url ?>',
      favicon16: '<?= $docsFavicon16Url ?>',
      appleTouchIcon: '<?= $docsAppleTouchIconUrl ?>',
      logo: '<?= $docsLogoUrl ?>',
      lightboxLogo: '<?= $docsLightboxLogoUrl ?>'
    };
    window.xtendDocsRmtRuntimeModule = '/xtendrmt/rmt-runtime.esm.js?v=<?= $xtendAssetVersionAttr ?>';
    window.xtendDocsRmtDocument = <?php echo $rmtPilotDocumentJson; ?>;
    window.xtendDocsRmtPilot = {
      schema: 'xtend.docs.parsedown-rmt-pilot.v1',
      workpackage: 'ER-WP-40',
      document: './<?= htmlspecialchars($rmtPilotDocument, ENT_QUOTES, 'UTF-8') ?>',
      renderMode: 'shell-first',
      phpSsrPrehydration: window.xtendDocsSsrPrehydration,
      rmtVNextDocument: './<?= htmlspecialchars($docsRmtVNextDocument, ENT_QUOTES, 'UTF-8') ?>',
      ssrEndpoint: window.xtendDocsRmtSsrEndpoint,
      compilerBridge: {
        schema: 'xtend.docs.rmt-compiler-bridge.v1',
        runner: 'scripts/compile_rmt_vnext_bridge.js',
        function: 'compileRmtVNextSource',
        injected: Boolean(window.xtendDocsSsrPrehydration && window.xtendDocsSsrPrehydration.compilerBridge && window.xtendDocsSsrPrehydration.compilerBridge.injected)
      },
      ssrPrehydrationContract: 'xtend.docs.php-ssr-prehydration.v1',
      ssrEndpointContract: 'xtend.docs.rmt-ssr-endpoint.v1',
      shellPrimitivesContract: 'xtend.docs.rmt-shell-primitives.v1',
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
        schema: 'xtend.docs.fabric-runtime.v1',
        runtime: 'docs/utils/fabric-runtime.js',
        rmtBridgeModule: '/xtendrmt/rmt-runtime.esm.js?v=<?= $xtendAssetVersionAttr ?>',
        api: 'xtend.fabric.api.v1',
        bridge: 'xtend.fabric.runtime-diagnostics-bridge.v1',
        telemetrySnapshot: 'xtend.fabric.telemetry-snapshot.v1',
        rmtTelemetryBridge: 'xtend.rmt.state-scheduler-diagnostics-bridge.v1',
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
        schema: 'xtend.docs.fabric-runtime.v1',
        runtime: 'docs/utils/fabric-runtime.js',
        rmtBridgeModule: '/xtendrmt/rmt-runtime.esm.js?v=<?= $xtendAssetVersionAttr ?>',
        telemetrySnapshot: 'xtend.fabric.telemetry-snapshot.v1',
        rmtTelemetryBridge: 'xtend.rmt.state-scheduler-diagnostics-bridge.v1',
        bridge: 'xtend.fabric.runtime-diagnostics-bridge.v1'
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
    <script src="/docs/utils/fabric-runtime.js?v=<?= $xtendAssetVersionAttr ?>" nonce="<?= $nonce ?>"></script>
</head>
<body xt-ui-effects="none">
<?= $docsSsrPrehydration['html'] ?? docsFallbackSerializeDescriptor($docsRootShellDescriptor) ?>
<script src="/docs/utils/pageloader.js?v=<?= $xtendAssetVersionAttr ?>" nonce="<?= $nonce ?>">
</script>
<script nonce="<?= $nonce ?>">
document.addEventListener('DOMContentLoaded', function() {
  // Theme-Button-Logik
  const btn = document.getElementById('theme-toggle');
  const label = document.getElementById('theme-toggle-label');
  const icon = document.getElementById('theme-toggle-icon');
  function updateThemeButton() {
    if (!btn || !label) return;
    const theme = document.documentElement.getAttribute('data-theme');
    const locale = window.xtendDocsCurrentLocale === 'en' ? 'en' : 'de';
    const darkLabel = locale === 'en' ? 'Enable dark mode' : 'Dunkelmodus aktivieren';
    const lightLabel = locale === 'en' ? 'Enable light mode' : 'Hellmodus aktivieren';
    if (theme === 'dark') {
      label.textContent = lightLabel;
      btn.setAttribute('aria-label', lightLabel);
      btn.setAttribute('title', lightLabel);
      btn.setAttribute('aria-pressed', 'true');
      if (icon) icon.setAttribute('name', 'sun');
    } else {
      label.textContent = darkLabel;
      btn.setAttribute('aria-label', darkLabel);
      btn.setAttribute('title', darkLabel);
      btn.setAttribute('aria-pressed', 'false');
      if (icon) icon.setAttribute('name', 'moon');
    }
  }
  if (btn) {
    btn.addEventListener('button-interaction', function() {
      if (window.XTend && window.XTend.theme) {
        window.XTend.theme.toggleDarkMode();
      }
    });
  }
  // Theme-Status beim Seitenaufruf und bei Theme-Wechseln immer korrekt setzen
  updateThemeButton();
  document.addEventListener('theme-changed', updateThemeButton);
  document.addEventListener('theme-initialized', updateThemeButton);
  window.addEventListener('xtend-docs-locale-changed', updateThemeButton);
  // Standardfarben für beide Themes setzen
  if (window.XTend && window.XTend.theme) {
    window.XTend.theme.setTheme('light');
    window.XTend.theme.set('--body-bg', '#f9f9f9');
    window.XTend.theme.set('--background-color', '#f9f9f9');
    window.XTend.theme.set('--primary-color', '#0e4e81');
    window.XTend.theme.set('--text-color', '#222');
    window.XTend.theme.set('--muted-text-color', '#5f6f82');
    window.XTend.theme.set('--surface-muted', '#edf2f7');
    window.XTend.theme.set('--border-color', 'rgba(15, 23, 42, 0.14)');
    window.XTend.theme.set('--xtend-surface', '#ffffff');
    window.XTend.theme.set('--xtend-surface-muted', '#f7fafc');
    window.XTend.theme.set('--xtend-surface-control', '#f7fafc');
    window.XTend.theme.set('--xtend-text', '#1f2937');
    window.XTend.theme.set('--xtend-text-primary', '#1f2937');
    window.XTend.theme.set('--xtend-text-muted', '#5f6f82');
    window.XTend.theme.set('--xtend-border-color', 'rgba(15, 23, 42, 0.14)');
    window.XTend.theme.set('--xtend-border-subtle', 'rgba(15, 23, 42, 0.14)');
    window.XTend.theme.set('--xtend-overlay-bg', 'rgba(15, 23, 42, 0.52)');
    window.XTend.theme.set('--docs-control-surface', '#f7fafc');
    window.XTend.theme.set('--docs-control-text', '#1f2937');
    window.XTend.theme.set('--docs-control-placeholder', '#5f6f82');
    window.XTend.theme.set('--docs-control-border', 'rgba(15, 23, 42, 0.14)');
    window.XTend.theme.set('--docs-header-bg', '#ffffff');
    window.XTend.theme.set('--docs-header-menu-bg', '#ffffff');
    window.XTend.theme.set('--docs-header-fg', '#1f2937');
    window.XTend.theme.set('--docs-sidebar-bg', '#ffffff');
    window.XTend.theme.set('--docs-sidebar-link-bg', '#f7fafc');
    window.XTend.theme.set('--docs-sidebar-link-hover-bg', '#e7f0f7');
    window.XTend.theme.set('--docs-code-bg', '#10131a');
    window.XTend.theme.set('--x-code-bg', '#10131a');
    window.XTend.theme.set('--x-code-text', '#f8fafc');
    window.XTend.theme.set('--x-code-border', 'rgba(15, 23, 42, 0.18)');
    window.XTend.theme.set('--footer-bg', '#f9f9f9');
    window.XTend.theme.set('--section-bg', '#fff');
    window.XTend.theme.set('--active-tab-color', '#0e4e81');
    window.XTend.theme.set('--tab-bg', '#f5f5f5');
    window.XTend.theme.set('--tab-text', '#222');
    window.XTend.theme.set('--input-bg', '#fff');
    window.XTend.theme.set('--input-bg-dark', '#17171b');
    window.XTend.theme.set('--input-color-dark', '#f4f4f5');
    window.XTend.theme.set('--input-placeholder-color-dark', '#b8c4d4');
    window.XTend.theme.set('--form-background', 'transparent');
    window.XTend.theme.set('--docs-hero-bg-light', 'linear-gradient(135deg, #f8fbff 0%, #e7f0f7 100%)');
    window.XTend.theme.set('--docs-hero-text-light', '#162033');
    // Dark Mode
    window.XTend.theme.registerTheme('dark', {
      '--body-bg': '#050506',
      '--background-color': '#050506',
      '--primary-color': '#8fd3ff',
      '--text-color': '#f4f4f5',
      '--muted-text-color': '#a1a1aa',
      '--surface-muted': '#111113',
      '--border-color': 'rgba(255, 255, 255, 0.13)',
      '--xtend-surface': '#0b0b0d',
      '--xtend-surface-muted': '#111113',
      '--xtend-surface-control': '#17171b',
      '--xtend-text': '#f4f4f5',
      '--xtend-text-primary': '#f4f4f5',
      '--xtend-text-muted': '#a1a1aa',
      '--xtend-border-color': 'rgba(255, 255, 255, 0.13)',
      '--xtend-border-subtle': 'rgba(255, 255, 255, 0.13)',
      '--xtend-overlay-bg': 'rgba(0, 0, 0, 0.72)',
      '--docs-control-surface': '#17171b',
      '--docs-control-text': '#f4f4f5',
      '--docs-control-placeholder': '#a1a1aa',
      '--docs-control-border': 'rgba(255, 255, 255, 0.13)',
      '--docs-header-bg': '#050506',
      '--docs-header-menu-bg': '#09090b',
      '--docs-header-fg': '#f4f4f5',
      '--docs-sidebar-bg': '#0d0d10',
      '--docs-sidebar-link-bg': '#111114',
      '--docs-sidebar-link-hover-bg': '#17171b',
      '--docs-code-bg': '#050506',
      '--x-code-bg': '#050506',
      '--x-code-text': '#f4f4f5',
      '--x-code-border': 'rgba(255, 255, 255, 0.16)',
      '--footer-bg': '#050506',
      '--section-bg': '#0b0b0d',
      '--active-tab-color': '#8fd3ff',
      '--tab-bg': '#111114',
      '--tab-text': '#f4f4f5',
      '--input-bg': '#17171b',
      '--input-bg-dark': '#0f0f12',
      '--input-color-dark': '#f4f4f5',
      '--input-placeholder-color-dark': '#a1a1aa',
      '--form-background': 'transparent',
      '--docs-hero-bg-dark': '#050506',
      '--docs-hero-text-dark': '#f8fafc'
    });
  }
  updateThemeButton();
  function checkDocsViewportOverflow() {
    const root = document.documentElement;
    const body = document.body;
    const clientWidth = root ? root.clientWidth : window.innerWidth;
    const scrollWidth = Math.max(
      root ? root.scrollWidth : 0,
      body ? body.scrollWidth : 0
    );
    const overflowX = Math.max(0, scrollWidth - clientWidth);
    const snapshot = {
      schema: 'xtend.docs.viewport-overflow.v1',
      viewport: window.matchMedia('(max-width: 700px)').matches ? 'mobile' : 'wide',
      clientWidth,
      scrollWidth,
      overflowX,
      viewportSafe: overflowX <= 1
    };
    window.xtendDocsViewportOverflow = snapshot;
    if (root) {
      root.toggleAttribute('data-xtend-viewport-overflow', !snapshot.viewportSafe);
    }
    window.dispatchEvent(new CustomEvent('xtend-docs-viewport-overflow-check', { detail: snapshot }));
    return snapshot;
  }
  window.xtendDocsCheckViewportOverflow = checkDocsViewportOverflow;
  window.addEventListener('resize', function() {
    requestAnimationFrame(checkDocsViewportOverflow);
  }, { passive: true });
  // Prism wird scoped und idle ausgefuehrt, damit Routen-Klicks nicht die ganze Seite blockieren.
  let prismFrame = 0;
  let prismIdle = 0;
  function schedulePrismHighlight(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const run = () => {
      scope.querySelectorAll('x-code').forEach((node) => {
        if (typeof node.hydrate === 'function') node.hydrate();
      });
      if (!window.Prism) return;
      if (window.XTendRmtPrism && typeof window.XTendRmtPrism.register === 'function') {
        window.XTendRmtPrism.register(window.Prism);
      }
      if (typeof Prism.highlightAllUnder === 'function') {
        Prism.highlightAllUnder(scope);
        return;
      }
      if (typeof Prism.highlightElement === 'function') {
        scope.querySelectorAll('pre code, code[class*="language-"]').forEach((node) => Prism.highlightElement(node));
      }
    };
    if (prismFrame) cancelAnimationFrame(prismFrame);
    if (prismIdle && typeof cancelIdleCallback === 'function') cancelIdleCallback(prismIdle);
    prismFrame = requestAnimationFrame(() => {
      prismFrame = 0;
      if (typeof requestIdleCallback === 'function') {
        prismIdle = requestIdleCallback(() => {
          prismIdle = 0;
          run();
        }, { timeout: 700 });
      } else {
        setTimeout(run, 0);
      }
    });
  }
  window.xtendDocsHighlightPrism = schedulePrismHighlight;
  window.addEventListener('xtend-docs-content-ready', function(event) {
    schedulePrismHighlight(event.detail && event.detail.root);
    requestAnimationFrame(checkDocsViewportOverflow);
  });
  requestAnimationFrame(checkDocsViewportOverflow);
  schedulePrismHighlight(document);
});
</script>
</body>
</html>
