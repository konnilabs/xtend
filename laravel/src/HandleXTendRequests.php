<?php
namespace Ccslabs\XTend;
use Closure;
use Illuminate\Http\Request;
class HandleXTendRequests {
    public function share(Request $request): array { return []; }
    public function handle(Request $request, Closure $next) {
        $manager = app(PageManager::class); $manager->share($this->share($request));
        // Ordinary Laravel web validation must keep redirects and session error bags.
        if ($request->header('X-XTend-Page')) { $request->headers->set('Accept', 'text/html'); $request->headers->remove('X-Requested-With'); }
        $response = $next($request);
        if ($request->header('X-XTend-Prefetch') === '1' && $request->hasSession()) $request->session()->reflash();
        if ($request->header('X-XTend-Page') && $response->isRedirection()) {
            return response()->json(['schema' => 'xtend.page-response.v1', 'kind' => 'redirect', 'location' => $response->headers->get('Location'), 'version' => $manager->manifest()['version'], 'contextKey' => $manager->contextKey()], 409, ['Cache-Control' => 'private, no-store']);
        }
        return $response;
    }
}
