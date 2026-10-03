<?php
declare(strict_types=1);
namespace Ccslabs\XTend;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** HTTP adaptation only: routes, CSRF, session and domain validation belong to Laravel. */
final class AppServiceHost {
    public function __construct(private array $manifest, private array $registry, private array $options = []) {}
    public function handle(Request $request, string $serviceId): Response {
        $body = $request->json()->all();
        if (($body['serviceId'] ?? '') !== $serviceId) return response()->json(['error'=>'Service route mismatch.'], 400);
        $registry = $this->registry;
        foreach ($registry as &$entry) if (isset($entry['invoke']) && is_callable($entry['invoke'])) {
            $handler = $entry['invoke'];
            $entry['invoke'] = static function($input, $context) use ($handler) {
                try { return $handler($input, $context); }
                catch (\Illuminate\Validation\ValidationException $error) {
                    throw new \RmtPhpAppServiceException('Bitte prüfe deine Eingaben.', 'xtend.maraca.app-service.validation', true, ['errorBag'=>$error->errorBag, 'errors'=>$error->errors()], $error);
                } catch (\Symfony\Component\HttpKernel\Exception\HttpExceptionInterface $error) {
                    $code = [404=>'unknown',409=>'conflict',422=>'validation',403=>'forbidden'][$error->getStatusCode()] ?? 'internal_error';
                    throw new \RmtPhpAppServiceException($error->getMessage(), 'xtend.maraca.app-service.'.$code, $code !== 'internal_error', [], $error);
                }
            };
        }
        unset($entry);
        $adapter = \createRmtPhpAppServiceAdapter($this->manifest, $registry, $this->options + ['onError'=>static function($error) { report($error); }]);
        $deadline = microtime(true) + ($this->options['timeoutSeconds'] ?? 30);
        $result = $adapter->handleHttpRequest($request->getContent(), $request->headers->all(), [
            'laravelRequest'=>$request, 'isCancelled'=>fn()=>connection_aborted() || microtime(true) >= $deadline,
        ]);
        if (is_string($result['body'])) { $adapter->dispose(); return response($result['body'], $result['status'], $result['headers']); }
        return response()->stream(function() use ($result, $adapter, $deadline) {
            try {
                foreach ($result['body'] as $chunk) {
                    // The adapter emits its single cancelled terminal frame on
                    // deadline. A writable response must still deliver it.
                    if (connection_aborted()) break;
                    echo $chunk;
                    if (ob_get_level()) ob_flush();
                    flush();
                }
            } finally { $adapter->dispose(); }
        }, $result['status'], $result['headers'] + ['X-Accel-Buffering'=>'no']);
    }
}
