<?php
// XTend Docs SPA – index.php
// Lädt alle .md-Dateien, parsed sie mit Parsedown und bietet SPA-Routing mit Slugs
// This project uses parsedown for markdown parsing. See license at https://github.com/erusev/parsedown/blob/master/LICENSE.txt

if (function_exists('header_remove')) {
    header_remove('X-Powered-By');
}

// --- Konfiguration ---
$docsRoot = __DIR__;
$componentsDir = $docsRoot . '/components';
$utilsDir = $docsRoot . '/utils';
$parsedownFile = $utilsDir . '/parsedown.php';
$rmtPilotDocument = 'xtendrmt-parsedown-docs.rmt';
$rmtPilotDocumentPath = $docsRoot . '/' . $rmtPilotDocument;
$rmtPilotDocumentData = null;
$rmtPilotDocumentJson = '{}';

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

function docsAssetUrl($assetName, $version) {
    return 'index.php?xtend-docs-asset=' . rawurlencode((string) $assetName) . '&v=' . rawurlencode((string) $version);
}

if (isset($_GET['xtend-docs-asset'])) {
    docsServeAsset($_GET['xtend-docs-asset'], $docsRoot);
}

// --- CSP Nonce generieren ---
$nonce = base64_encode(random_bytes(16));
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-$nonce'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none';");

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

$mdFiles = findMarkdownFiles($docsRoot);

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
    return [
        'id' => docsRouteIdFromSlug($slug),
        'path' => '/' . $slug,
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
            'source' => 'docs/' . $rel,
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

function docsBuildPageMeta($slug, $rel, $markdown) {
    $title = docsExtractMarkdownTitle($markdown, $rel);
    $description = docsExtractMarkdownDescription($markdown, $title);
    $keywords = [
        'xtend',
        'dokumentation',
        str_replace('-', ' ', $slug)
    ];
    $pageMeta = [
        'schema' => 'xtend.docs.parsedown-rmt-page.v1',
        'source' => 'docs/' . $rel,
        'routeId' => docsRouteIdFromSlug($slug),
        'path' => '/' . $slug,
        'router' => 'xtend.xrouter',
        'title' => $title,
        'documentTitle' => $title . ' | XTend Dokumentation',
        'titleTemplate' => '{{title}} | XTend Dokumentation',
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

function docsRenderXRoute($route, $pathOverride = null) {
    global $xtendAssetVersionAttr;
    $metadata = $route['metadata'] ?? [];
    $attrs = [
        'path' => $pathOverride ?? ($route['path'] ?? ''),
        'component' => 'xtend-doc-page',
        'import' => '/docs/utils/pageloader.js?v=' . $xtendAssetVersionAttr,
        'title' => $route['title'] ?? '',
        'document-title' => $route['documentTitle'] ?? '',
        'title-template' => $route['titleTemplate'] ?? '',
        'meta-description' => $route['metaDescription'] ?? ($metadata['seo']['description'] ?? ''),
        'meta-keywords' => $route['metaKeywords'] ?? ($metadata['seo']['keywords'] ?? []),
        'skeleton' => $route['skeleton'] ?? 'article',
        'skeleton-lines' => $route['skeletonLines'] ?? 10,
        'skeleton-min-height' => $route['skeletonMinHeight'] ?? '26rem',
        'hydrate-schedule' => $route['hydration']['schedule'] ?? 'docs.page.hydrate',
        'data-rmt-route-id' => $route['id'] ?? '',
        'data-rmt-router' => $route['router'] ?? 'xtend.xrouter',
        'data-rmt-component' => $route['component'] ?? 'docs.page',
        'data-rmt-template' => $route['template'] ?? '',
        'data-rmt-schedule' => $route['schedule'] ?? '',
        'data-rmt-hydrate-schedule' => $route['hydration']['schedule'] ?? 'docs.page.hydrate',
        'data-rmt-metadata' => json_encode($metadata, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)
    ];
    $parts = [];
    foreach ($attrs as $name => $value) {
        if ($value === null || $value === '' || $value === []) continue;
        $parts[] = $name . '="' . docsRouteAttrValue($value) . '"';
    }
    return '<x-route ' . implode(' ', $parts) . '></x-route>';
}

// Slug <-> Datei-Mapping
$slugToFile = [];
$fileToSlug = [];
foreach ($mdFiles as $rel => $abs) {
    $slug = slugify($rel);
    $slugToFile[$slug] = $rel;
    $fileToSlug[$rel] = $slug;
}

// Routing: Slug aus URL
$page = $_GET['page'] ?? '';
if ($page && isset($slugToFile[$page])) {
    $mdFile = $mdFiles[$slugToFile[$page]];
} else {
    // Default: README.md
    $mdFile = $docsRoot . '/README.md';
    $page = $fileToSlug['README.md'] ?? slugify('README.md');
}

// Download-Handler
if (isset($_GET['download']) && isset($slugToFile[$_GET['download']])) {
    $dlFile = $mdFiles[$slugToFile[$_GET['download']]];
    header('Content-Type: text/markdown');
    header('Content-Disposition: attachment; filename="' . basename($dlFile) . '"');
    readfile($dlFile);
    exit;
}

// Parsedown einbinden
require_once $parsedownFile;
$Parsedown = new Parsedown();
$Parsedown->setSafeMode(true);

if (isset($_GET['xtend-docs-page'])) {
    $requestedSlug = slugify((string) $_GET['xtend-docs-page']);
    if (!isset($slugToFile[$requestedSlug])) {
        http_response_code(404);
        header('Content-Type: application/json; charset=UTF-8');
        header('X-Content-Type-Options: nosniff');
        echo json_encode([
            'schema' => 'xtend.docs.parsedown-rmt-page-payload.v1',
            'ok' => false,
            'slug' => $requestedSlug,
            'error' => 'docs-page-not-found'
        ], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        exit;
    }

    $rel = $slugToFile[$requestedSlug];
    $markdown = file_get_contents($mdFiles[$rel]);
    $meta = docsBuildPageMeta($requestedSlug, $rel, $markdown);
    header('Content-Type: application/json; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
    echo json_encode([
        'schema' => 'xtend.docs.parsedown-rmt-page-payload.v1',
        'ok' => true,
        'slug' => $requestedSlug,
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
$docsRmtRoutes = [];
$titles = [];
foreach ($fileToSlug as $rel => $slug) {
    $mdFile = $mdFiles[$slugToFile[$slug]];
    $mdContent = file_get_contents($mdFile);
    $allPagesMeta[$slug] = docsBuildPageMeta($slug, $rel, $mdContent);
    if ($slug === $page) {
        $allPages[$slug] = $Parsedown->text($mdContent);
    }
    $docsRmtRoutes[] = $allPagesMeta[$slug]['route'];
    $titles[$slug] = $allPagesMeta[$slug]['title'];
}
$readmeTitle = $allPagesMeta['readme']['title'] ?? 'XTend Dokumentation';
$readmeDocumentTitle = $allPagesMeta['readme']['documentTitle'] ?? 'XTend Dokumentation';
$readmeDescription = $allPagesMeta['readme']['metaDescription'] ?? 'XTend Dokumentation';
$docsRmtRoutes[] = array_replace_recursive($allPagesMeta['readme']['route'] ?? [], [
    'id' => 'docs.home',
    'path' => '/',
    'title' => $readmeTitle,
    'documentTitle' => $readmeDocumentTitle,
    'metadata' => [
        'source' => 'docs/README.md',
        'seo' => [
            'title' => $readmeTitle,
            'documentTitle' => $readmeDocumentTitle,
            'description' => $readmeDescription
        ]
    ]
]);
$rmtPilotDocumentData = docsMergeRmtRoutes($rmtPilotDocumentData, $docsRmtRoutes);
$rmtPilotDocumentJson = json_encode($rmtPilotDocumentData, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
$initialDocsSlug = isset($allPagesMeta[$page]) ? $page : 'readme';
$initialTitle = $allPagesMeta[$initialDocsSlug]['documentTitle'] ?? 'XTend Dokumentation';
$initialDescription = $allPagesMeta[$initialDocsSlug]['metaDescription'] ?? 'XTend Dokumentation';
$initialKeywords = implode(', ', $allPagesMeta[$initialDocsSlug]['metaKeywords'] ?? ['xtend', 'dokumentation']);
?><!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title><?= htmlspecialchars($initialTitle, ENT_QUOTES, 'UTF-8') ?></title>
    <meta name="description" content="<?= htmlspecialchars($initialDescription, ENT_QUOTES, 'UTF-8') ?>">
    <meta name="keywords" content="<?= htmlspecialchars($initialKeywords, ENT_QUOTES, 'UTF-8') ?>">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="xtend-preload" content="x-theme,x-button,x-icon,x-link,x-input,x-form,x-header,x-hero,x-router,x-footer,x-section,x-code,x-modal,x-dialog">
    <link rel="icon" href="<?= $docsFaviconIcoUrl ?>" sizes="any">
    <link rel="icon" type="image/png" sizes="32x32" href="<?= $docsFavicon32Url ?>">
    <link rel="icon" type="image/png" sizes="16x16" href="<?= $docsFavicon16Url ?>">
    <link rel="apple-touch-icon" href="<?= $docsAppleTouchIconUrl ?>">
    <link rel="stylesheet" href="/xtend.css?v=<?= $xtendAssetVersionAttr ?>">
    <script src="/fabric/xtend-fabric.js?v=<?= $xtendAssetVersionAttr ?>"></script>
    <script type="module" src="/xtend-loader.js?v=<?= $xtendAssetVersionAttr ?>" data-manifest="/components/manifest.json?v=<?= $xtendAssetVersionAttr ?>" data-module-cache-bust="<?= $xtendAssetVersionAttr ?>"></script>
    <script src="/components/prism.js" nonce="<?= $nonce ?>"></script>
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
          --xtend-text: #1f2937;
          --xtend-border-color: rgba(15, 23, 42, 0.14);
          --xtend-overlay-bg: rgba(15, 23, 42, 0.52);
          --docs-header-bg: #ffffff;
          --docs-header-menu-bg: #ffffff;
          --docs-header-fg: #1f2937;
          --docs-shell-bg: transparent;
          --docs-sidebar-bg: #ffffff;
          --docs-sidebar-link-bg: #f7fafc;
          --docs-sidebar-link-hover-bg: #e7f0f7;
          --docs-code-bg: #10131a;
          --x-code-bg: #10131a;
          --x-code-text: #f8fafc;
          --x-code-border: rgba(15, 23, 42, 0.18);
          --docs-layout-gap: clamp(1rem, 2.2vw, 2.5rem);
          --docs-sidebar-width: clamp(20rem, 24vw, 27rem);
          --docs-hero-bg-light: linear-gradient(135deg, #f8fbff 0%, #e7f0f7 100%);
          --docs-hero-bg-dark: #050506;
          --docs-hero-text-light: #162033;
          --docs-hero-text-dark: #f8fafc;
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
          --xtend-text: #f4f4f5;
          --xtend-border-color: rgba(255, 255, 255, 0.13);
          --xtend-overlay-bg: rgba(0, 0, 0, 0.72);
          --docs-header-bg: #050506;
          --docs-header-menu-bg: #09090b;
          --docs-header-fg: #f4f4f5;
          --docs-shell-bg: transparent;
          --docs-sidebar-bg: #0d0d10;
          --docs-sidebar-link-bg: #111114;
          --docs-sidebar-link-hover-bg: #17171b;
          --docs-code-bg: #050506;
          --x-code-bg: #050506;
          --x-code-text: #f4f4f5;
          --x-code-border: rgba(255, 255, 255, 0.16);
          --docs-hero-bg-dark: #050506;
          --input-bg: #0f0f12;
          --input-bg-dark: #0f0f12;
          --input-placeholder-color-dark: #a1a1aa;
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
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          margin: 1.2rem 0 2.5rem;
          background: transparent;
          padding: 0 var(--docs-layout-gap);
          border: 0;
          border-radius: 0;
          box-shadow: none;
          transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
        }
        main > x-router {
          display: block;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }
        main > x-router::part(outlet) {
          width: 100%;
          max-width: 100%;
          min-width: 0;
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
          gap: 0.35rem;
          min-width: 0;
          max-width: 100%;
        }
        .docs-menu-node {
          display: grid;
          gap: 0.2rem;
          min-width: 0;
          max-width: 100%;
        }
        .docs-menu-node[data-doc-depth="0"] > x-link {
          font-weight: 650;
        }
        .docs-menu-node[data-doc-depth="1"] > x-link,
        .docs-menu-node[data-doc-depth="2"] > x-link {
          font-size: 0.94rem;
        }
        .docs-menu-section x-link {
          display: block;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          min-height: 36px;
          padding: 0.42rem 0.55rem;
          border-radius: 0.45rem;
          color: var(--text-color);
          overflow-wrap: anywhere;
          transition: background 0.14s ease, color 0.14s ease, transform 0.14s ease;
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
          background: rgba(14, 78, 129, 0.12);
          color: var(--primary-color);
          transform: translateX(2px);
        }
        .docs-menu-section x-link[active] {
          font-weight: 700;
        }
        .docs-menu-children {
          margin: 0.08rem 0 0;
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
          background: rgba(14, 78, 129, 0.1);
          border-color: color-mix(in srgb, var(--primary-color) 34%, var(--border-color));
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
          gap: 0.2rem;
          margin: 0.25rem 0 0.18rem;
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
          margin: 0 0.5rem;
          max-width: calc(100% - 1rem);
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
          width: 100%;
          max-width: 100%;
          min-width: 0;
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
          main {
            margin: 1rem 0 2rem;
            padding: 0 clamp(0.5rem, 3vw, 0.75rem);
          }
          x-hero.docs-hero {
            margin: 0;
            max-width: 100%;
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
        }
    </style>
    <script nonce="<?= $nonce ?>">
    window.xtendInitialDocsSlug = <?= json_encode($initialDocsSlug, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); ?>;
    if (!location.hash) location.hash = '#/' + (window.xtendInitialDocsSlug || 'readme');
    window.xtendDocsPages = <?php echo json_encode($allPages, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); ?>;
    window.xtendDocsPageEndpoint = 'index.php?xtend-docs-page=';
    window.xtendDocsPagesMeta = <?php echo json_encode($allPagesMeta, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); ?>;
    window.xtendDocsTitles = <?php echo json_encode($titles, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); ?>;
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
<x-theme></x-theme>
<x-header src="<?= $docsLogoUrl ?>" logo-size="48" sticky data-xtend-skeleton style="--xtend-skeleton-min-height: 4.75rem;">
  <span slot="title">XTend Dokumentation</span>
  <x-button
    id="theme-toggle"
    class="docs-icon-button docs-theme-toggle"
    slot="actions"
    type="button"
    variant="secondary"
    aria-label="Dunkelmodus aktivieren"
    title="Dunkelmodus aktivieren"
    aria-pressed="false"
  >
    <x-icon id="theme-toggle-icon" name="moon" pack="core" decorative size="1.1rem"></x-icon>
    <span id="theme-toggle-label" class="docs-visually-hidden">Dunkelmodus aktivieren</span>
  </x-button>
  <?php foreach ($fileToSlug as $rel => $slug): ?>
    <x-link class="docs-nav-link" slot="nav" href="/<?= $slug ?>" <?= $page === $slug ? 'active' : '' ?>>
      <x-icon class="docs-nav-link-icon" name="<?= htmlspecialchars(docsMenuIconForSlug($slug), ENT_QUOTES, 'UTF-8') ?>" decorative size="1rem"></x-icon>
      <span class="docs-nav-link-label"><?= htmlspecialchars(ucfirst(preg_replace('/[-_]/', ' ', preg_replace('/\.md$/i', '', basename($rel))))) ?></span>
    </x-link>
  <?php endforeach; ?>
</x-header>
      <x-hero
    class="docs-hero"
    data-xtend-skeleton
    style="--xtend-skeleton-min-height: clamp(12rem, 30vw, 22rem);"
    background-light="var(--docs-hero-bg-light)"
    background-dark="var(--docs-hero-bg-dark)"
    font-color-light="var(--docs-hero-text-light)"
    font-color-dark="var(--docs-hero-text-dark)"
    overlay-light="rgba(255, 255, 255, 0.16)"
    overlay-dark="rgba(0, 0, 0, 0.28)"
    align="block" 
    overlay 
    animate
    vertical-align="top"
  >
	 <h1>XTend Developer Center</h1>
	 <p>Build with XTend today</p>
</x-hero>
<main>
<x-router mode="hash" reuse-component skeleton="article" skeleton-lines="10" skeleton-min-height="26rem" skeleton-label="Dokumentation wird geladen" data-xtend-skeleton style="--xtend-skeleton-min-height: 26rem;" document-title-template="{{title}} | XTend Dokumentation" default-title="XTend Dokumentation">
  <?= docsRenderXRoute($allPagesMeta['readme']['route'], '/') . "\n" ?>
  <?php foreach ($fileToSlug as $rel => $slug): ?>
    <?= docsRenderXRoute($allPagesMeta[$slug]['route']) . "\n" ?>
  <?php endforeach; ?>
  <x-route path="*" component="xtend-doc-page" import="/docs/utils/pageloader.js?v=<?= $xtendAssetVersionAttr ?>" title="Seite nicht gefunden" document-title="Seite nicht gefunden | XTend Dokumentation" meta-description="Die angeforderte Dokumentationsseite wurde nicht gefunden." skeleton="article" skeleton-lines="8" skeleton-min-height="20rem" hydrate-schedule="docs.page.hydrate" data-rmt-route-id="docs.notFound" data-rmt-router="xtend.xrouter" data-rmt-component="docs.page" data-rmt-schedule="docs.route.render" data-rmt-hydrate-schedule="docs.page.hydrate"></x-route>
</x-router>
    </main>
<x-footer src="<?= $docsLogoUrl ?>" logo-size="32" data-xtend-skeleton="inline" style="--xtend-skeleton-min-height: 3.25rem;">
	<span slot="title">© 2025 – CCS Networks | Powered by XRouter PHP Extension</span>
</x-footer>
<script src="utils/pageloader.js?v=<?= $xtendAssetVersionAttr ?>" nonce="<?= $nonce ?>">
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
    if (theme === 'dark') {
      label.textContent = 'Hellmodus aktivieren';
      btn.setAttribute('aria-label', 'Hellmodus aktivieren');
      btn.setAttribute('title', 'Hellmodus aktivieren');
      btn.setAttribute('aria-pressed', 'true');
      if (icon) icon.setAttribute('name', 'sun');
    } else {
      label.textContent = 'Dunkelmodus aktivieren';
      btn.setAttribute('aria-label', 'Dunkelmodus aktivieren');
      btn.setAttribute('title', 'Dunkelmodus aktivieren');
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
    window.XTend.theme.set('--xtend-text', '#1f2937');
    window.XTend.theme.set('--xtend-border-color', 'rgba(15, 23, 42, 0.14)');
    window.XTend.theme.set('--xtend-overlay-bg', 'rgba(15, 23, 42, 0.52)');
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
    window.XTend.theme.set('--input-bg-dark', '#0f0f12');
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
      '--xtend-text': '#f4f4f5',
      '--xtend-border-color': 'rgba(255, 255, 255, 0.13)',
      '--xtend-overlay-bg': 'rgba(0, 0, 0, 0.72)',
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
      '--input-bg': '#0f0f12',
      '--input-bg-dark': '#0f0f12',
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
      if (!window.Prism) return;
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
