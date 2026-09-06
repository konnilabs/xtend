<?php
declare(strict_types=1);
namespace Ccslabs\XTend;
use Ccslabs\XTend\Data\Prop;
use Ccslabs\XTend\Data\PageView;
use Illuminate\Http\Request;

final class PageManager {
    private array $shared = [];
    private ?array $manifest = null;
    public function __construct(private array $config, private Request $request) {}
    public function share(string|array $key, mixed $value = null): void { $this->shared = array_replace($this->shared, is_array($key) ? $key : [$key => $value]); }
    public function manifest(): array {
        if ($this->manifest !== null) return $this->manifest;
        $manifest = \RmtPortableRender::decodeJson(file_get_contents($this->config['manifest']));
        if (($manifest['schema'] ?? '') !== 'xtend.page-manifest.v1' || !is_string($manifest['version'] ?? null)) throw new \RuntimeException('Invalid XTend page manifest.');
        foreach ($manifest['runtimeFingerprints']['php'] ?? [] as $file=>$expected) if (!preg_match('/^[a-z0-9-]+\.php$/',$file) || hash_file('sha256', __DIR__ . '/../runtime/' . $file) !== $expected) throw new \RuntimeException('Page build and PHP runtime are incompatible. Rebuild the pages with the deployed package.');
        return $this->manifest = $manifest;
    }
    public function contextKey(): string {
        if (!$this->request->hasSession()) throw new \RuntimeException('XTend pages require Laravel web/session middleware.');
        $session = $this->request->session();
        if (!$session->has('_xtend_context')) $session->put('_xtend_context', bin2hex(random_bytes(16)));
        return hash_hmac('sha256', $session->get('_xtend_context') . '|' . ($this->request->user()?->getAuthIdentifier() ?? 'guest') . '|' . $this->request->attributes->get('xtend.tenant', ''), (string)config('app.key'));
    }
    private function selection(): array {
        $result = ['prefetch' => $this->request->header('X-XTend-Prefetch') === '1'];
        foreach (['only' => 'Only', 'deferred' => 'Deferred', 'once' => 'Once'] as $key => $header) if ($raw = $this->request->header('X-XTend-' . $header)) {
            try { $value = json_decode($raw, true, 16, JSON_THROW_ON_ERROR); } catch (\Throwable) { abort(400, 'Invalid XTend data selection.'); }
            if (!is_array($value) || !array_is_list($value) || count($value) > 256 || array_filter($value, fn($entry) => !is_string($entry) || $entry === '')) abort(400, 'Invalid XTend data selection.');
            $result[$key] = $value;
        }
        if ($this->request->header('X-XTend-Context') !== $this->contextKey()) $result['once'] = [];
        return $result;
    }
    public function render(string $name, array $props = [], array $options = []): PageResponse { return new PageResponse($this, $name, $props, $options); }
    public function response(string $name, array $props, array $options) {
        $manifest = $this->manifest(); $definition = $manifest['pages'][$name] ?? null;
        if (!$definition) abort(404, 'Unknown XTend page.');
        $base = ['schema' => 'xtend.page-response.v1', 'version' => $manifest['version'], 'contextKey' => $this->contextKey()];
        if ($version = $this->request->header('X-XTend-Version')) if ($version !== $manifest['version']) return response()->json($base + ['kind' => 'reload', 'location' => $this->request->fullUrl()], 409);
        $selection = $this->selection(); $context = ['request' => $this->request];
        $data = Prop::resolveAll($props, $context, $selection);
        $shared = []; foreach ($this->shared as $key => $value) { Prop::assertKey((string)$key); $shared[$key] = $value instanceof \Closure ? $value($this->request) : $value; }
        $errors = []; $bags = $this->request->session()->get('errors');
        if ($bags instanceof \Illuminate\Support\ViewErrorBag) foreach ($bags->getBags() as $key => $bag) $errors[$key] = $bag->toArray();
        $flash = []; if (!$selection['prefetch']) foreach ($this->config['flash_keys'] as $key) if ($this->request->session()->has($key)) $flash[$key] = $this->request->session()->get($key);
        $partial = isset($selection['only']) || isset($selection['deferred']);
        $page = $base + $data + ['kind' => 'page', 'page' => $name, 'url' => $this->request->getRequestUri(), 'layout' => $options['layout'] ?? $definition['layout'] ?? null, 'head' => $options['head'] ?? $definition['head'] ?? [], 'shared' => (object)$shared, 'flash' => (object)$flash, 'errors' => (object)$errors, 'partial' => $partial, 'pagination' => $options['pagination'] ?? null, 'csrfToken' => $this->request->session()->token(), 'renderArtifact' => $definition['artifact']];
        $layout = $page['layout'] ? ($manifest['layouts'][$page['layout']] ?? null) : null;
        if ($page['layout'] && !$layout) throw new \RuntimeException('The declared layout is absent from the page manifest.');
        $page['head'] = PageView::head($layout['head'] ?? [], $page['head']);
        $page['maraca'] = $definition['maraca'] ?? null;
        $page['layoutArtifact'] = $layout['artifact'] ?? null;
        $compact = ($this->config['compact_responses'] ?? false) && (!$this->request->header('X-XTend-Page') || $this->request->header('X-XTend-Page-Wire') === '1');
        $html = ''; $headers = [];
        if (!$partial && !($compact && $this->request->header('X-XTend-Page'))) {
            $projected = \RmtPortableRender::project($definition['artifact'], array_replace($shared, (array)$data['props']));
            if ($layout) {
                $layoutProjection = \RmtPortableRender::project($layout['artifact'], array_replace($shared, (array)$data['props']));
                $projected['descriptor'] = PageView::compose($layoutProjection['descriptor'], $projected['descriptor']);
                $projected['model'] = array_replace_recursive($layoutProjection['model'], $projected['model']);
            }
            $renderOptions = array_replace(['model' => $projected['model'], 'rootId' => 'xtend-page', 'nativeForms' => true], $options['renderOptions'] ?? []);
            $renderOptions['resume'] = array_replace(['state'=>$projected['model']], $renderOptions['resume'] ?? []);
            if (($renderOptions['executionMode'] ?? $this->config['ssr']['executionMode'] ?? '') === 'server_prerender_resume') $projected['descriptor'] = ['type'=>'element','tag'=>'section','attributes'=>['id'=>'xtend-page'],'children'=>[$projected['descriptor']]];
            $adapter = \createRmtPhpSsrAdapter($this->config['ssr'] ?? []);
            $result = $adapter->render(['descriptor' => $projected['descriptor']], $renderOptions);
            if (!$result['ok']) throw new \RuntimeException('XTend SSR rendering failed.');
            $html = $result['html']; $page['ssr'] = $result['response']; $headers = $result['headers'];
        }
        $headers['Cache-Control'] = 'private, no-store'; $headers['Vary'] = 'X-XTend-Page, X-XTend-Page-Wire, X-XTend-Version, X-XTend-Only, X-XTend-Deferred, X-XTend-Once';
        if ($this->request->header('X-XTend-Page')) return response()->json($compact ? \Ccslabs\XTend\Data\PageWire::encode($page) : $page, $options['status'] ?? 200, $headers);
        $nonce = bin2hex(random_bytes(18));
        foreach (array_merge($manifest['assets']['css'] ?? [], isset($manifest['assets']['entry']) ? [$manifest['assets']['entry']] : []) as $asset) {
            if (!is_string($asset) || !preg_match('#^/(?!/)#', $asset)) throw new \RuntimeException('Page assets must use same-origin absolute paths.');
        }
        $policy = $headers['Content-Security-Policy'] ?? "default-src 'self'";
        $headers['Content-Security-Policy'] = str_contains($policy, 'script-src ') ? preg_replace('/script-src([^;]*)/', "script-src$1 'nonce-$nonce'", $policy) : "$policy; script-src 'self' 'nonce-$nonce'";
        if ($this->config['style_nonce'] ?? false) {
            $policy = $headers['Content-Security-Policy'];
            $headers['Content-Security-Policy'] = preg_match('/(?:^|;\s*)style-src\s/', $policy)
                ? preg_replace_callback('/(^|;\s*)style-src\s+([^;]*)/', function($match) use ($nonce) {
                    $sources = array_filter(preg_split('/\s+/', trim($match[2])), fn($source) => !in_array($source, ["'unsafe-inline'", "'none'"], true));
                    return $match[1].'style-src '.implode(' ', $sources)." 'nonce-$nonce'";
                }, $policy)
                : "$policy; style-src 'self' 'nonce-$nonce'";
        }
        return response()->view($this->config['root_view'], ['page' => $page, 'pageData' => $compact ? \Ccslabs\XTend\Data\PageWire::encode($page) : $page, 'html' => $html, 'assets' => $manifest['assets'] ?? [], 'nonce' => $nonce], $options['status'] ?? 200, $headers);
    }
}
