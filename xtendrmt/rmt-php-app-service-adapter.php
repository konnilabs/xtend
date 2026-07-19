<?php
declare(strict_types=1);

if (!defined('RMT_PHP_APP_SERVICE_ADAPTER_SCHEMA')) {
    define('RMT_PHP_APP_SERVICE_ADAPTER_SCHEMA', 'xtend.rmt.php-app-service-adapter.v1');
}
if (!defined('RMT_PHP_APP_SERVICE_HTTP_RESPONSE_SCHEMA')) {
    define('RMT_PHP_APP_SERVICE_HTTP_RESPONSE_SCHEMA', 'xtend.rmt.php-app-service-http-response.v1');
}
if (!defined('RMT_PHP_APP_SERVICE_MANIFEST_SCHEMA')) {
    define('RMT_PHP_APP_SERVICE_MANIFEST_SCHEMA', 'xtend.maraca.app-services-manifest.v1');
}
if (!defined('RMT_PHP_APP_SERVICE_REQUEST_SCHEMA')) {
    define('RMT_PHP_APP_SERVICE_REQUEST_SCHEMA', 'xtend.maraca.app-service-request.v1');
}
if (!defined('RMT_PHP_APP_SERVICE_RESPONSE_SCHEMA')) {
    define('RMT_PHP_APP_SERVICE_RESPONSE_SCHEMA', 'xtend.maraca.app-service-response.v1');
}
if (!defined('RMT_PHP_APP_SERVICE_STREAM_FRAME_SCHEMA')) {
    define('RMT_PHP_APP_SERVICE_STREAM_FRAME_SCHEMA', 'xtend.maraca.app-service-stream-frame.v1');
}

if (!class_exists('RmtPhpAppServiceException', false)) {
    final class RmtPhpAppServiceException extends RuntimeException
    {
        public string $serviceCode;
        public bool $expose;
        public array $details;

        public function __construct(
            string $message,
            string $serviceCode = 'xtend.maraca.app-service.error',
            bool $expose = false,
            array $details = [],
            ?Throwable $previous = null
        ) {
            parent::__construct($message, 0, $previous);
            $this->serviceCode = $serviceCode;
            $this->expose = $expose;
            $this->details = $details;
        }
    }
}

if (!class_exists('RmtPhpAppServiceAdapter', false)) {
    final class RmtPhpAppServiceAdapter
    {
        private array $manifest;
        private array $servicesById = [];
        private array $registry = [];
        private array $options;
        private array $activeRequests = [];
        private int $sequence = 0;
        private bool $disposed = false;

        public function __construct(array $manifest, array $registry, array $options = [])
        {
            $this->options = $options;
            $this->manifest = $this->validateManifest($manifest);
            $this->registry = $this->validateRegistry($registry);
        }

        public function getManifest(): array
        {
            return $this->manifest;
        }

        public function listServices(): array
        {
            return array_keys($this->registry);
        }

        public function listActiveRequests(): array
        {
            return array_values(array_map(function (array $scope): array {
                return [
                    'id' => $scope['id'],
                    'serviceId' => $scope['serviceId'],
                    'invocationId' => $scope['invocationId'],
                    'correlationId' => $scope['correlationId'],
                    'cleanupCount' => count($scope['cleanups']),
                ];
            }, $this->activeRequests));
        }

        /**
         * Invoke a registered PHP callable directly. Routing, authentication and
         * request parsing remain host responsibilities.
         *
         * @param mixed $input
         * @return mixed
         */
        public function invoke(string $serviceId, $input = null, array $context = [])
        {
            $service = $this->resolveService($serviceId, 'invoke');
            [$invocationId, $correlationId] = $this->resolveInvocationIds($context);
            [$scopeId, $handlerContext] = $this->openRequestScope(
                $service,
                $invocationId,
                $correlationId,
                $context
            );

            try {
                return call_user_func($this->registry[$service['id']]['handler'], $input, $handlerContext);
            } catch (Throwable $error) {
                $this->reportError($error, $handlerContext);
                throw $error;
            } finally {
                $this->closeRequestScope($scopeId);
            }
        }

        /**
         * Stream versioned AppService frames from a registered PHP iterable.
         * The adapter owns framing, sequencing, terminal-state enforcement and
         * request cleanup; handler values never bypass this boundary.
         *
         * @param mixed $input
         */
        public function stream(string $serviceId, $input = null, array $context = []): Generator
        {
            $service = $this->resolveService($serviceId, 'stream');
            [$invocationId, $correlationId] = $this->resolveInvocationIds($context);
            return $this->runStream($service, $input, $context, $invocationId, $correlationId);
        }

        public function handleInvokeRequest(array $request, array $context = []): array
        {
            $serviceId = $this->safeResponseIdentifier($request['serviceId'] ?? null);
            $invocationId = $this->safeResponseIdentifier($request['invocationId'] ?? null);
            $correlationId = $this->safeResponseIdentifier($request['correlationId'] ?? null);

            try {
                $normalized = $this->validateWireRequest($request, 'invoke');
                $value = $this->invoke($normalized['serviceId'], $normalized['input'], array_replace($context, [
                    'invocationId' => $normalized['invocationId'],
                    'correlationId' => $normalized['correlationId'],
                    'target' => $normalized['target'],
                    'request' => $normalized,
                ]));
                $response = [
                    'schema' => RMT_PHP_APP_SERVICE_RESPONSE_SCHEMA,
                    'ok' => true,
                    'serviceId' => $normalized['serviceId'],
                    'invocationId' => $normalized['invocationId'],
                    'correlationId' => $normalized['correlationId'],
                    'value' => $value,
                ];
                $this->assertJsonSerializable($response);
                return $response;
            } catch (Throwable $error) {
                return $this->errorResponse($error, $serviceId, $invocationId, $correlationId);
            }
        }

        public function handleStreamRequest(array $request, array $context = []): Generator
        {
            $normalized = $this->validateWireRequest($request, 'stream');
            return $this->stream($normalized['serviceId'], $normalized['input'], array_replace($context, [
                'invocationId' => $normalized['invocationId'],
                'correlationId' => $normalized['correlationId'],
                'target' => $normalized['target'],
                'request' => $normalized,
            ]));
        }

        /**
         * Framework-neutral HTTP boundary. The host supplies a decoded array or
         * JSON body after its own route/auth middleware and writes the returned
         * status, headers and body (string or NDJSON Generator) to its response.
         *
         * @param mixed $body
         */
        public function handleHttpRequest($body, array $headers = [], array $context = []): array
        {
            $request = null;
            try {
                $request = $this->decodeRequestBody($body);
                $normalized = $this->validateWireRequest($request);
                if ($normalized['kind'] === 'stream') {
                    $frames = $this->stream($normalized['serviceId'], $normalized['input'], array_replace($context, [
                        'invocationId' => $normalized['invocationId'],
                        'correlationId' => $normalized['correlationId'],
                        'target' => $normalized['target'],
                        'headers' => $this->normalizeHeaders($headers),
                        'request' => $normalized,
                    ]));
                    return $this->httpResponse(200, 'application/x-ndjson; charset=utf-8', $this->encodeNdjson($frames));
                }

                $response = $this->handleInvokeRequest($normalized, array_replace($context, [
                    'headers' => $this->normalizeHeaders($headers),
                ]));
                $status = ($response['ok'] ?? false) ? 200 : $this->statusForErrorCode($response['error']['code'] ?? '');
                return $this->httpResponse(
                    $status,
                    'application/json; charset=utf-8',
                    $this->encodeJson($response)
                );
            } catch (Throwable $error) {
                $serviceId = is_array($request) ? $this->safeResponseIdentifier($request['serviceId'] ?? null) : null;
                $invocationId = is_array($request) ? $this->safeResponseIdentifier($request['invocationId'] ?? null) : null;
                $correlationId = is_array($request) ? $this->safeResponseIdentifier($request['correlationId'] ?? null) : null;
                $response = $this->errorResponse($error, $serviceId, $invocationId, $correlationId);
                return $this->httpResponse(
                    $this->statusForErrorCode($response['error']['code'] ?? ''),
                    'application/json; charset=utf-8',
                    $this->encodeJson($response)
                );
            }
        }

        public function dispose(): bool
        {
            if ($this->disposed) return false;
            $this->disposed = true;
            foreach (array_keys($this->activeRequests) as $scopeId) {
                $this->closeRequestScope($scopeId);
            }
            $cleanup = $this->options['cleanup'] ?? null;
            if (is_callable($cleanup)) {
                try {
                    call_user_func($cleanup, ['reason' => 'adapter-disposed']);
                } catch (Throwable $error) {
                    $this->reportCleanupError($error, ['reason' => 'adapter-disposed']);
                }
            }
            return true;
        }

        private function runStream(
            array $service,
            $input,
            array $context,
            string $invocationId,
            string $correlationId
        ): Generator {
            [$scopeId, $handlerContext] = $this->openRequestScope(
                $service,
                $invocationId,
                $correlationId,
                $context
            );
            $serviceId = $service['id'];
            $outputSequence = 0;
            $terminal = false;
            $seenIds = [];
            $seenSequences = [];
            $highestInputSequence = -1;

            try {
                yield $this->createStreamFrame(
                    $serviceId,
                    $invocationId,
                    $correlationId,
                    $outputSequence,
                    'start'
                );

                if ($this->isCancelled($handlerContext)) {
                    $terminal = true;
                    yield $this->createStreamFrame(
                        $serviceId,
                        $invocationId,
                        $correlationId,
                        $outputSequence,
                        'cancelled',
                        ['value' => 'App service stream cancelled.']
                    );
                    return;
                }

                $iterable = call_user_func($this->registry[$serviceId]['handler'], $input, $handlerContext);
                if (is_array($iterable) && (isset($iterable['type']) || isset($iterable['kind']))) {
                    $iterable = [$iterable];
                }
                if (!is_iterable($iterable)) {
                    throw new RmtPhpAppServiceException(
                        'App service stream handler must return an iterable.',
                        'xtend.maraca.app-service.stream_protocol'
                    );
                }

                foreach ($iterable as $value) {
                    if ($terminal) break;
                    if ($this->isCancelled($handlerContext)) {
                        $terminal = true;
                        yield $this->createStreamFrame(
                            $serviceId,
                            $invocationId,
                            $correlationId,
                            $outputSequence,
                            'cancelled',
                            ['value' => 'App service stream cancelled.']
                        );
                        break;
                    }

                    $source = is_array($value) ? $value : ['value' => $value];
                    $type = trim((string) ($source['type'] ?? $source['kind'] ?? 'delta'));
                    if (!in_array($type, ['start', 'delta', 'tool-call', 'tool-result', 'complete', 'error', 'cancelled'], true)) {
                        throw new RmtPhpAppServiceException(
                            'Unsupported app service stream frame type.',
                            'xtend.maraca.app-service.stream_protocol'
                        );
                    }
                    $inputId = isset($source['id']) ? (string) $source['id'] : '';
                    if ($inputId !== '' && isset($seenIds[$inputId])) continue;
                    $inputSequence = null;
                    if (isset($source['sequence']) && is_numeric($source['sequence'])) {
                        $numericSequence = (float) $source['sequence'];
                        if (is_finite($numericSequence) && floor($numericSequence) === $numericSequence) {
                            $inputSequence = (int) $numericSequence;
                            if (isset($seenSequences[$inputSequence]) || $inputSequence <= $highestInputSequence) continue;
                        }
                    }
                    if ($inputId !== '') $seenIds[$inputId] = true;
                    if ($inputSequence !== null) {
                        $seenSequences[$inputSequence] = true;
                        $highestInputSequence = $inputSequence;
                    }
                    if ($type === 'start') continue;

                    $fields = [];
                    if ($inputId !== '') $fields['id'] = $inputId;
                    if (array_key_exists('value', $source)) $fields['value'] = $source['value'];
                    if (array_key_exists('delta', $source)) $fields['delta'] = $source['delta'];
                    if (array_key_exists('toolCall', $source)) $fields['toolCall'] = $source['toolCall'];
                    elseif (array_key_exists('tool', $source)) $fields['toolCall'] = $source['tool'];
                    if (array_key_exists('toolResult', $source)) $fields['toolResult'] = $source['toolResult'];
                    if ($type === 'error') {
                        $fields['error'] = $this->publicError(
                            $source['error'] ?? null,
                            'xtend.maraca.app-service.stream_failed'
                        );
                    }
                    if ($type === 'cancelled' && !array_key_exists('value', $fields)) {
                        $fields['value'] = 'App service stream cancelled.';
                    }
                    $frame = $this->createStreamFrame(
                        $serviceId,
                        $invocationId,
                        $correlationId,
                        $outputSequence,
                        $type,
                        $fields
                    );
                    if (in_array($type, ['complete', 'error', 'cancelled'], true)) $terminal = true;
                    yield $frame;
                    if ($terminal) break;
                }

                if (!$terminal) {
                    $terminal = true;
                    yield $this->createStreamFrame(
                        $serviceId,
                        $invocationId,
                        $correlationId,
                        $outputSequence,
                        'complete'
                    );
                }
            } catch (Throwable $error) {
                $this->reportError($error, $handlerContext);
                if (!$terminal) {
                    $terminal = true;
                    yield $this->createStreamFrame(
                        $serviceId,
                        $invocationId,
                        $correlationId,
                        $outputSequence,
                        'error',
                        ['error' => $this->publicError($error, 'xtend.maraca.app-service.stream_failed')]
                    );
                }
            } finally {
                $this->closeRequestScope($scopeId);
            }
        }

        private function createStreamFrame(
            string $serviceId,
            string $invocationId,
            string $correlationId,
            int &$sequence,
            string $type,
            array $fields = []
        ): array {
            $sequence += 1;
            $frame = [
                'schema' => RMT_PHP_APP_SERVICE_STREAM_FRAME_SCHEMA,
                'id' => array_key_exists('id', $fields)
                    ? (string) $fields['id']
                    : $invocationId . ':frame:' . $sequence,
                'streamId' => $invocationId,
                'serviceId' => $serviceId,
                'invocationId' => $invocationId,
                'correlationId' => $correlationId,
                'sequence' => $sequence,
                'type' => $type,
                'value' => array_key_exists('value', $fields) ? $fields['value'] : null,
                'delta' => array_key_exists('delta', $fields) ? $fields['delta'] : null,
                'toolCall' => array_key_exists('toolCall', $fields) ? $fields['toolCall'] : null,
                'toolResult' => array_key_exists('toolResult', $fields) ? $fields['toolResult'] : null,
                'error' => array_key_exists('error', $fields) ? $fields['error'] : null,
            ];
            $this->assertJsonSerializable($frame);
            return $frame;
        }

        private function validateManifest(array $manifest): array
        {
            if (($manifest['schema'] ?? null) !== RMT_PHP_APP_SERVICE_MANIFEST_SCHEMA) {
                throw new RmtPhpAppServiceException(
                    'Unsupported AppService manifest schema.',
                    'xtend.maraca.app-service.manifest_schema',
                    true
                );
            }
            if (!isset($manifest['services']) || !is_array($manifest['services']) || !$this->isList($manifest['services'])) {
                throw new RmtPhpAppServiceException(
                    'AppService manifest services must be a list.',
                    'xtend.maraca.app-service.manifest_invalid',
                    true
                );
            }
            if (
                !isset($manifest['targets'])
                || !is_array($manifest['targets'])
                || !in_array('php', $manifest['targets'], true)
            ) {
                throw new RmtPhpAppServiceException(
                    'AppService manifest does not enable the PHP target.',
                    'xtend.maraca.app-service.manifest_target',
                    true
                );
            }
            if (!isset($manifest['targets']) || !is_array($manifest['targets'])
                || !$this->isList($manifest['targets'])) {
                throw new RmtPhpAppServiceException(
                    'AppService manifest targets must be a list.',
                    'xtend.maraca.app-service.manifest_invalid',
                    true
                );
            }
            foreach ($manifest['targets'] as $targetName) {
                if (!in_array($targetName, ['browser', 'node', 'php'], true)) {
                    throw new RmtPhpAppServiceException(
                        'AppService manifest contains an unsupported build target.',
                        'xtend.maraca.app-service.manifest_target',
                        true
                    );
                }
            }

            $fingerprint = strtolower(trim((string) ($manifest['fingerprint'] ?? '')));
            if (!preg_match('/^[a-f0-9]{64}$/D', $fingerprint)) {
                throw new RmtPhpAppServiceException(
                    'AppService manifest fingerprint is missing or invalid.',
                    'xtend.maraca.app-service.manifest_fingerprint',
                    true
                );
            }
            $unsigned = $manifest;
            unset($unsigned['fingerprint']);
            $actual = hash('sha256', $this->stableJson($unsigned));
            if (!hash_equals($fingerprint, $actual)) {
                throw new RmtPhpAppServiceException(
                    'AppService manifest fingerprint does not match its contents.',
                    'xtend.maraca.app-service.manifest_fingerprint',
                    true
                );
            }

            foreach ($manifest['services'] as $record) {
                if (!is_array($record)) {
                    throw new RmtPhpAppServiceException(
                        'AppService manifest service records must be objects.',
                        'xtend.maraca.app-service.manifest_invalid',
                        true
                    );
                }
                $id = $this->requireIdentifier(
                    $record['id'] ?? null,
                    'App service id',
                    'xtend.maraca.app-service.manifest_invalid'
                );
                if (isset($this->servicesById[$id])) {
                    throw new RmtPhpAppServiceException(
                        'AppService manifest contains a duplicate service id.',
                        'xtend.maraca.app-service.manifest_duplicate',
                        true
                    );
                }
                $kind = trim((string) ($record['kind'] ?? ''));
                $mode = trim((string) ($record['mode'] ?? ''));
                $target = trim((string) ($record['target'] ?? ''));
                $concurrency = trim((string) ($record['concurrency'] ?? ''));
                if (!in_array($kind, ['query', 'command', 'stream'], true)) {
                    throw new RmtPhpAppServiceException(
                        'AppService manifest contains an unsupported service kind.',
                        'xtend.maraca.app-service.manifest_invalid',
                        true
                    );
                }
                if (!in_array($mode, ['invoke', 'stream'], true)
                    || ($kind === 'stream') !== ($mode === 'stream')) {
                    throw new RmtPhpAppServiceException(
                        'AppService manifest kind and mode do not match.',
                        'xtend.maraca.app-service.manifest_mode',
                        true
                    );
                }
                if (!in_array($target, ['local', 'server', 'remote-surface'], true)
                    || !in_array($concurrency, ['latest', 'serial', 'parallel'], true)) {
                    throw new RmtPhpAppServiceException(
                        'AppService manifest target or concurrency policy is invalid.',
                        'xtend.maraca.app-service.manifest_invalid',
                        true
                    );
                }
                $implementations = $record['implementations'] ?? null;
                if (!is_array($implementations)
                    || !array_key_exists('browser', $implementations)
                    || !array_key_exists('node', $implementations)
                    || !array_key_exists('php', $implementations)
                    || !is_bool($implementations['browser'])
                    || !is_bool($implementations['node'])
                    || !is_bool($implementations['php'])) {
                    throw new RmtPhpAppServiceException(
                        'AppService manifest must declare its PHP implementation status.',
                        'xtend.maraca.app-service.manifest_invalid',
                        true
                    );
                }
                if ($implementations['php'] && $target !== 'server') {
                    throw new RmtPhpAppServiceException(
                        'PHP AppServices must use the server target.',
                        'xtend.maraca.app-service.manifest_target',
                        true
                    );
                }
                $this->servicesById[$id] = array_replace($record, [
                    'id' => $id,
                    'kind' => $kind,
                    'mode' => $mode,
                    'target' => $target,
                    'concurrency' => $concurrency,
                ]);
            }
            ksort($this->servicesById, SORT_STRING);
            return $manifest;
        }

        private function validateRegistry(array $registry): array
        {
            $normalized = [];
            foreach ($registry as $rawId => $entry) {
                $id = $this->requireIdentifier(
                    $rawId,
                    'Registry service id',
                    'xtend.maraca.app-service.registry_invalid'
                );
                $service = $this->servicesById[$id] ?? null;
                if (!$service) {
                    throw new RmtPhpAppServiceException(
                        'PHP registry contains a service that is absent from the manifest.',
                        'xtend.maraca.app-service.registry_unknown',
                        true
                    );
                }
                if (!(bool) ($service['implementations']['php'] ?? false)) {
                    throw new RmtPhpAppServiceException(
                        'PHP registry contains a service not assigned to the PHP target.',
                        'xtend.maraca.app-service.registry_target',
                        true
                    );
                }
                $handler = null;
                $cleanup = null;
                if (is_callable($entry)) {
                    $handler = $entry;
                } elseif (is_array($entry)) {
                    $handlerKey = $service['mode'] === 'stream' ? 'stream' : 'invoke';
                    $handler = $entry[$handlerKey] ?? $entry['handler'] ?? null;
                    $cleanup = $entry['cleanup'] ?? null;
                }
                if (!is_callable($handler)) {
                    throw new RmtPhpAppServiceException(
                        'PHP AppService registry handler is not callable.',
                        'xtend.maraca.app-service.handler_missing',
                        true
                    );
                }
                if ($cleanup !== null && !is_callable($cleanup)) {
                    throw new RmtPhpAppServiceException(
                        'PHP AppService cleanup hook is not callable.',
                        'xtend.maraca.app-service.cleanup_invalid',
                        true
                    );
                }
                $normalized[$id] = ['handler' => $handler, 'cleanup' => $cleanup];
            }

            foreach ($this->servicesById as $id => $service) {
                if ((bool) ($service['implementations']['php'] ?? false) && !isset($normalized[$id])) {
                    throw new RmtPhpAppServiceException(
                        'PHP AppService implementation required by the manifest is missing.',
                        'xtend.maraca.app-service.handler_missing',
                        true
                    );
                }
            }
            ksort($normalized, SORT_STRING);
            return $normalized;
        }

        private function validateWireRequest(array $request, ?string $expectedMode = null): array
        {
            if (($request['schema'] ?? null) !== RMT_PHP_APP_SERVICE_REQUEST_SCHEMA) {
                throw new RmtPhpAppServiceException(
                    'Unsupported AppService request schema.',
                    'xtend.maraca.app-service.invalid_request',
                    true
                );
            }
            $serviceId = $this->requireIdentifier($request['serviceId'] ?? null, 'App service id');
            $service = $this->servicesById[$serviceId] ?? null;
            if (!$service || !(bool) ($service['implementations']['php'] ?? false)) {
                throw new RmtPhpAppServiceException(
                    'Unknown AppService.',
                    'xtend.maraca.app-service.unknown',
                    true
                );
            }
            $kind = trim((string) ($request['kind'] ?? ''));
            if (!in_array($kind, ['query', 'command', 'stream'], true) || $kind !== $service['kind']) {
                throw new RmtPhpAppServiceException(
                    'AppService request kind does not match the manifest.',
                    'xtend.maraca.app-service.mode_mismatch',
                    true
                );
            }
            $mode = $kind === 'stream' ? 'stream' : 'invoke';
            if ($expectedMode !== null && $mode !== $expectedMode) {
                throw new RmtPhpAppServiceException(
                    'AppService request uses the wrong execution mode.',
                    'xtend.maraca.app-service.mode_mismatch',
                    true
                );
            }
            $target = trim((string) ($request['target'] ?? ''));
            if ($target !== 'server' || $target !== $service['target']) {
                throw new RmtPhpAppServiceException(
                    'AppService request target does not match the manifest.',
                    'xtend.maraca.app-service.target_mismatch',
                    true
                );
            }
            $invocationId = $this->optionalIdentifier($request['invocationId'] ?? null)
                ?? $this->nextIdentifier('xtend.maraca.app-service.invocation');
            $correlationId = $this->optionalIdentifier($request['correlationId'] ?? null)
                ?? $invocationId;
            return [
                'schema' => RMT_PHP_APP_SERVICE_REQUEST_SCHEMA,
                'serviceId' => $serviceId,
                'kind' => $kind,
                'target' => $target,
                'invocationId' => $invocationId,
                'correlationId' => $correlationId,
                'input' => array_key_exists('input', $request) ? $request['input'] : null,
            ];
        }

        private function resolveService(string $serviceId, string $mode): array
        {
            if ($this->disposed) {
                throw new RmtPhpAppServiceException(
                    'PHP AppService adapter is disposed.',
                    'xtend.maraca.app-service.disposed'
                );
            }
            $id = $this->requireIdentifier($serviceId, 'App service id');
            $service = $this->servicesById[$id] ?? null;
            if (!$service || !isset($this->registry[$id])) {
                throw new RmtPhpAppServiceException(
                    'Unknown AppService.',
                    'xtend.maraca.app-service.unknown',
                    true
                );
            }
            if ($service['mode'] !== $mode) {
                throw new RmtPhpAppServiceException(
                    'AppService execution mode does not match the manifest.',
                    'xtend.maraca.app-service.mode_mismatch',
                    true
                );
            }
            return $service;
        }

        private function resolveInvocationIds(array $context): array
        {
            $invocationId = $this->optionalIdentifier($context['invocationId'] ?? null)
                ?? $this->nextIdentifier('xtend.maraca.app-service.invocation');
            $correlationId = $this->optionalIdentifier($context['correlationId'] ?? null)
                ?? $invocationId;
            return [$invocationId, $correlationId];
        }

        private function openRequestScope(
            array $service,
            string $invocationId,
            string $correlationId,
            array $context
        ): array {
            $this->sequence += 1;
            $scopeId = $invocationId . ':php-scope:' . $this->sequence;
            $entryCleanup = $this->registry[$service['id']]['cleanup'] ?? null;
            $scope = [
                'id' => $scopeId,
                'serviceId' => $service['id'],
                'invocationId' => $invocationId,
                'correlationId' => $correlationId,
                'cleanups' => [],
                'context' => [],
            ];
            $this->activeRequests[$scopeId] = $scope;

            $handlerContext = array_replace($context, [
                'schema' => 'xtend.rmt.php-app-service-execution-context.v1',
                'adapterSchema' => RMT_PHP_APP_SERVICE_ADAPTER_SCHEMA,
                'serviceId' => $service['id'],
                'kind' => $service['kind'],
                'target' => $service['target'],
                'concurrency' => $service['concurrency'] ?? null,
                'invocationId' => $invocationId,
                'correlationId' => $correlationId,
                'manifestFingerprint' => $this->manifest['fingerprint'],
            ]);
            $handlerContext['defer'] = function ($cleanup) use ($scopeId): void {
                if (!is_callable($cleanup)) {
                    throw new RmtPhpAppServiceException(
                        'Deferred AppService cleanup must be callable.',
                        'xtend.maraca.app-service.cleanup_invalid',
                        true
                    );
                }
                if (!isset($this->activeRequests[$scopeId])) {
                    throw new RmtPhpAppServiceException(
                        'AppService request scope is already closed.',
                        'xtend.maraca.app-service.disposed'
                    );
                }
                $this->activeRequests[$scopeId]['cleanups'][] = $cleanup;
            };
            if (is_callable($entryCleanup)) {
                $this->activeRequests[$scopeId]['cleanups'][] = function () use ($entryCleanup, &$handlerContext): void {
                    call_user_func($entryCleanup, $handlerContext);
                };
            }
            $this->activeRequests[$scopeId]['context'] = $handlerContext;
            return [$scopeId, $handlerContext];
        }

        private function closeRequestScope(string $scopeId): void
        {
            if (!isset($this->activeRequests[$scopeId])) return;
            $scope = $this->activeRequests[$scopeId];
            unset($this->activeRequests[$scopeId]);
            $cleanups = array_reverse($scope['cleanups']);
            foreach ($cleanups as $cleanup) {
                try {
                    call_user_func($cleanup);
                } catch (Throwable $error) {
                    $this->reportCleanupError($error, $scope['context']);
                }
            }
        }

        private function isCancelled(array $context): bool
        {
            if ($this->disposed) return true;
            foreach (['cancelled', 'isCancelled'] as $key) {
                if (isset($context[$key]) && is_callable($context[$key])) {
                    try {
                        if ((bool) call_user_func($context[$key])) return true;
                    } catch (Throwable $error) {
                        $this->reportError($error, $context);
                        return true;
                    }
                }
            }
            return ($this->options['detectDisconnect'] ?? true) && function_exists('connection_aborted')
                ? connection_aborted() !== 0
                : false;
        }

        private function errorResponse(
            Throwable $error,
            ?string $serviceId,
            ?string $invocationId,
            ?string $correlationId
        ): array {
            $publicError = $this->publicError($error);
            return [
                'schema' => RMT_PHP_APP_SERVICE_RESPONSE_SCHEMA,
                'ok' => false,
                'serviceId' => $serviceId,
                'invocationId' => $invocationId,
                'correlationId' => $correlationId,
                'error' => $publicError,
            ];
        }

        /** @param mixed $error */
        private function publicError(
            $error,
            string $fallbackCode = 'xtend.maraca.app-service.internal_error'
        ): array
        {
            if ($error instanceof RmtPhpAppServiceException) {
                return [
                    'code' => $error->serviceCode,
                    'message' => $error->expose ? $error->getMessage() : 'App service request failed.',
                ];
            }
            if (is_array($error)) {
                $candidate = trim((string) ($error['code'] ?? ''));
                return [
                    'code' => preg_match('/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,191}$/D', $candidate)
                        ? $candidate
                        : $fallbackCode,
                    'message' => 'App service request failed.',
                ];
            }
            return [
                'code' => $fallbackCode,
                'message' => 'App service request failed.',
            ];
        }

        private function reportError(Throwable $error, array $context): void
        {
            $callback = $this->options['onError'] ?? null;
            if (!is_callable($callback)) return;
            try {
                call_user_func($callback, $error, $context);
            } catch (Throwable $ignored) {
                // Observability callbacks must never change the wire response.
            }
        }

        private function reportCleanupError(Throwable $error, array $context): void
        {
            $callback = $this->options['onCleanupError'] ?? null;
            if (is_callable($callback)) {
                try {
                    call_user_func($callback, $error, $context);
                    return;
                } catch (Throwable $ignored) {
                    // Fall through to the generic host error observer.
                }
            }
            $this->reportError($error, array_replace($context, ['phase' => 'cleanup']));
        }

        /** @param mixed $body */
        private function decodeRequestBody($body): array
        {
            if (is_array($body)) return $body;
            if (!is_string($body) || trim($body) === '') {
                throw new RmtPhpAppServiceException(
                    'AppService request body must contain JSON.',
                    'xtend.maraca.app-service.invalid_request',
                    true
                );
            }
            $maxRequestBytes = (int) ($this->options['maxRequestBytes'] ?? 1048576);
            if ($maxRequestBytes > 0 && strlen($body) > $maxRequestBytes) {
                throw new RmtPhpAppServiceException(
                    'AppService request body exceeds the configured size limit.',
                    'xtend.maraca.app-service.payload_too_large',
                    true
                );
            }
            try {
                $decoded = json_decode($body, true, 64, JSON_THROW_ON_ERROR);
            } catch (Throwable $error) {
                throw new RmtPhpAppServiceException(
                    'AppService request body contains invalid JSON.',
                    'xtend.maraca.app-service.invalid_request',
                    true,
                    [],
                    $error
                );
            }
            if (!is_array($decoded) || $this->isList($decoded)) {
                throw new RmtPhpAppServiceException(
                    'AppService request body must be a JSON object.',
                    'xtend.maraca.app-service.invalid_request',
                    true
                );
            }
            return $decoded;
        }

        private function httpResponse(int $status, string $contentType, $body): array
        {
            return [
                'schema' => RMT_PHP_APP_SERVICE_HTTP_RESPONSE_SCHEMA,
                'status' => $status,
                'headers' => [
                    'Content-Type' => $contentType,
                    'Cache-Control' => 'no-store',
                    'X-Content-Type-Options' => 'nosniff',
                    'X-XTend-App-Service-Schema' => RMT_PHP_APP_SERVICE_ADAPTER_SCHEMA,
                ],
                'body' => $body,
            ];
        }

        private function encodeNdjson(iterable $frames): Generator
        {
            foreach ($frames as $frame) {
                yield $this->encodeJson($frame) . "\n";
            }
        }

        private function normalizeHeaders(array $headers): array
        {
            $normalized = [];
            foreach ($headers as $name => $value) {
                $key = strtolower(trim((string) $name));
                if ($key !== '') $normalized[$key] = is_array($value) ? implode(', ', $value) : (string) $value;
            }
            ksort($normalized, SORT_STRING);
            return $normalized;
        }

        private function statusForErrorCode(string $code): int
        {
            if ($code === 'xtend.maraca.app-service.unknown') return 404;
            if ($code === 'xtend.maraca.app-service.mode_mismatch'
                || $code === 'xtend.maraca.app-service.target_mismatch') return 400;
            if ($code === 'xtend.maraca.app-service.payload_too_large') return 413;
            if ($code === 'xtend.maraca.app-service.disposed') return 503;
            if ($code === 'xtend.maraca.app-service.invalid_request') return 400;
            return 500;
        }

        /** @param mixed $value */
        private function assertJsonSerializable($value): void
        {
            try {
                json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            } catch (Throwable $error) {
                throw new RmtPhpAppServiceException(
                    'AppService result is not JSON serializable.',
                    'xtend.maraca.app-service.serialization_failed',
                    false,
                    [],
                    $error
                );
            }
        }

        /** @param mixed $value */
        private function encodeJson($value): string
        {
            try {
                return json_encode(
                    $value,
                    JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
                );
            } catch (Throwable $error) {
                throw new RmtPhpAppServiceException(
                    'AppService response serialization failed.',
                    'xtend.maraca.app-service.serialization_failed',
                    false,
                    [],
                    $error
                );
            }
        }

        /** @param mixed $value */
        private function stableJson($value): string
        {
            if (is_array($value)) {
                if ($this->isList($value)) {
                    return '[' . implode(',', array_map(function ($entry): string {
                        return $this->stableJson($entry);
                    }, $value)) . ']';
                }
                $keys = array_keys($value);
                sort($keys, SORT_STRING);
                $fields = [];
                foreach ($keys as $key) {
                    $fields[] = $this->encodeJson((string) $key) . ':' . $this->stableJson($value[$key]);
                }
                return '{' . implode(',', $fields) . '}';
            }
            if (is_object($value) || is_resource($value)) {
                throw new RmtPhpAppServiceException(
                    'AppService manifest must contain JSON values only.',
                    'xtend.maraca.app-service.manifest_invalid',
                    true
                );
            }
            return $this->encodeJson($value);
        }

        private function nextIdentifier(string $prefix): string
        {
            $this->sequence += 1;
            return $prefix . ':' . $this->sequence;
        }

        /** @param mixed $value */
        private function requireIdentifier(
            $value,
            string $label,
            string $code = 'xtend.maraca.app-service.invalid_request'
        ): string
        {
            $id = is_string($value) || is_int($value) ? trim((string) $value) : '';
            if (!$this->isValidIdentifier($id)) {
                throw new RmtPhpAppServiceException(
                    $label . ' is missing or invalid.',
                    $code,
                    true
                );
            }
            return $id;
        }

        /** @param mixed $value */
        private function optionalIdentifier($value): ?string
        {
            if ($value === null || $value === '') return null;
            return $this->requireIdentifier($value, 'AppService invocation identifier');
        }

        /** @param mixed $value */
        private function safeResponseIdentifier($value): ?string
        {
            $id = is_string($value) || is_int($value) ? trim((string) $value) : '';
            return $this->isValidIdentifier($id) ? $id : null;
        }

        private function isValidIdentifier(string $value): bool
        {
            return (bool) preg_match('/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,191}$/D', $value);
        }

        private function isList(array $value): bool
        {
            return $value === [] || array_keys($value) === range(0, count($value) - 1);
        }
    }
}

if (!function_exists('createRmtPhpAppServiceAdapter')) {
    function createRmtPhpAppServiceAdapter(
        array $manifest,
        array $registry,
        array $options = []
    ): RmtPhpAppServiceAdapter {
        return new RmtPhpAppServiceAdapter($manifest, $registry, $options);
    }
}
