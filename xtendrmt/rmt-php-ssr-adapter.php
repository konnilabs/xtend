<?php
declare(strict_types=1);

if (!defined('RMT_PHP_SSR_ADAPTER_SCHEMA')) {
    define('RMT_PHP_SSR_ADAPTER_SCHEMA', 'xtend.rmt.php-ssr-adapter.v1');
    define('RMT_PHP_SSR_RENDER_RESULT_SCHEMA', 'xtend.rmt.node-ssr-render-result.v1');
    define('RMT_PHP_SSR_JSONL_FRAME_SCHEMA', 'xtend.rmt.node-ssr-jsonl-frame.v1');
    define('RMT_PHP_SSR_HYDRATION_SCHEMA', 'xtend.rmt.node-ssr-hydration-payload.v1');
    define('RMT_PHP_SSR_DIAGNOSTIC_SCHEMA', 'xtend.rmt.php-ssr-diagnostic.v1');
    define('RMT_PHP_SSR_CHUNK_KIND', 'rmt_template_chunk');
    define('RMT_PHP_SSR_RESPONSE_KIND', 'rmt_template_prerender_response');
    define('RMT_PHP_SSR_EXECUTION_MODE', 'server_prerender_hydrate');
    define('RMT_PHP_SSR_RESUME_EXECUTION_MODE', 'server_prerender_resume');
    define('RMT_SSR_RESUME_ENVELOPE_SCHEMA', 'xtend.rmt.ssr-resume-envelope.v1');
    define('RMT_SSR_RESUME_INTEGRITY_SCHEMA', 'xtend.rmt.ssr-resume-integrity.v1');
    define('RMT_PHP_SSR_STREAMING_CONTRACT_SCHEMA', 'xtend.rmt.vnext-streaming-contract.v1');
    define('RMT_PHP_SSR_KERNEL_BOUNDARY', 'no-rmt-kernel-import-of-xtend-types');
    define('RMT_SSR_CSP_POLICY_SCHEMA', 'xtend.rmt.ssr-csp-policy.v1');
    define('RMT_SSR_CSP_HEADER', 'Content-Security-Policy');
    define('RMT_XSCALER_SSR_HYDRATION_SCHEMA', 'xtend.xscaler.ssr-hydration.v1');
    define('RMT_XSCALER_PROTOCOL', 'xscaler');
    define('RMT_XSCALER_PREFLIGHT_RESPONSE_SCHEMA', 'xtend.xscaler.preflight-response.v1');
    define('RMT_XSCALER_REMOTE_SURFACE_PLAN_SCHEMA', 'xtend.xscaler.remote-surface-plan.v1');
    define('RMT_XSCALER_ATC_HANDOFF_SCHEMA', 'xtend.xscaler.atc-handoff.v1');
}

if (!class_exists('RmtPhpSsrAdapter', false)) {
    final class RmtPhpSsrAdapter
    {
        private array $options;

        private array $voidTags = [
            'area' => true,
            'base' => true,
            'br' => true,
            'col' => true,
            'embed' => true,
            'hr' => true,
            'img' => true,
            'input' => true,
            'link' => true,
            'meta' => true,
            'param' => true,
            'source' => true,
            'track' => true,
            'wbr' => true,
        ];

        private array $blockedTags = [
            'script' => true,
            'iframe' => true,
            'frame' => true,
            'frameset' => true,
            'object' => true,
            'embed' => true,
            'base' => true,
            'link' => true,
            'meta' => true,
            'form' => true,
            'style' => true,
            'svg' => true,
            'math' => true,
            'template' => true,
        ];

        private array $defaultCspDirectives = [
            'default-src' => ["'self'"],
            'script-src' => ["'self'"],
            'style-src' => ["'self'", "'unsafe-inline'"],
            'img-src' => ["'self'", 'data:', 'blob:'],
            'font-src' => ["'self'", 'data:'],
            'connect-src' => ["'self'"],
            'worker-src' => ["'self'"],
            'object-src' => ["'none'"],
            'base-uri' => ["'self'"],
            'frame-ancestors' => ["'self'"],
            'form-action' => ["'self'"],
        ];

        private array $urlAttributes = [
            'href' => true,
            'src' => true,
            'action' => true,
            'formaction' => true,
            'poster' => true,
            'xlink:href' => true,
        ];

        private array $trustBoundaryTokens = [
            'xtend.security.trusted-dom-boundary.v1' => true,
            'xtend.security.sanitizing-boundary.v1' => true,
            'xtend.security.streaming-boundary.v1' => true,
            'trusted' => true,
            'sanitized' => true,
            'host-sanitized' => true,
        ];

        public function __construct(array $options = [])
        {
            $this->options = $options;
        }

        public function render($input, array $options = []): array
        {
            $mergedOptions = array_replace($this->options, $options);
            $diagnostics = [];
            $executionMode = (string) ($mergedOptions['executionMode'] ?? RMT_PHP_SSR_EXECUTION_MODE);
            if ($executionMode === 'worker_prerender_resume') {
                $diagnostics[] = $this->diagnostic('rmt.php_ssr.worker_resume_unsupported', 'worker_prerender_resume is parseable but has no PHP runtime implementation.', 'error');
            } elseif (!in_array($executionMode, [RMT_PHP_SSR_EXECUTION_MODE, RMT_PHP_SSR_RESUME_EXECUTION_MODE], true)) {
                $diagnostics[] = $this->diagnostic('rmt.php_ssr.execution_mode_unsupported', 'Unsupported PHP SSR execution mode "' . $executionMode . '".', 'error');
            }
            $cspPolicy = $this->createSsrCspPolicy($mergedOptions);
            $headers = $this->createSecurityHeaders($cspPolicy, $mergedOptions['headers'] ?? []);
            $normalized = $this->normalizeRenderInput($input, $mergedOptions, $diagnostics);
            $requestId = $this->safeIdentifier($mergedOptions['requestId'] ?? $mergedOptions['operationId'] ?? ('rmt-php-ssr-' . time()));
            $rootId = $this->safeIdentifier($mergedOptions['rootId'] ?? 'rmt-php-ssr-root');
            $generation = $this->safeIdentifier($mergedOptions['generation'] ?? ($requestId . '-generation'));
            if ($executionMode === RMT_PHP_SSR_RESUME_EXECUTION_MODE) {
                $normalized['descriptor'] = $this->decorateResumeDescriptor($normalized['descriptor'], $rootId, $generation);
            }
            $componentCapabilities = [];
            $html = $this->serializeDescriptor($normalized['descriptor'], [
                'options' => $mergedOptions,
                'componentCapabilities' => &$componentCapabilities,
                'source' => [
                    'inputKind' => $normalized['kind'],
                    'sourceRef' => $normalized['sourceRef'] ?? null,
                ],
            ], $diagnostics);
            $streamingContract = $this->createStreamingContract($normalized['coreDocument'] ?? null);
            $xscaler = $this->createXScalerSsrHydration($mergedOptions, $diagnostics);
            $hydration = [
                'schema' => RMT_PHP_SSR_HYDRATION_SCHEMA,
                'requestId' => $requestId,
                'executionMode' => $executionMode,
                'sourceKind' => $normalized['kind'],
                'sourceRef' => $normalized['sourceRef'] ?? null,
                'componentCapabilities' => array_values($componentCapabilities),
                'coreDocumentSchema' => $normalized['coreDocument']['schema'] ?? null,
                'streamingContractSchema' => $streamingContract['schema'] ?? null,
                'cspPolicy' => $cspPolicy,
                'xscaler' => $xscaler,
            ];
            $chunk = $this->createChunk([
                'requestId' => $requestId,
                'rootId' => $rootId,
                'options' => $mergedOptions,
                'coreDocument' => $normalized['coreDocument'] ?? null,
                'renderedAt' => $mergedOptions['renderedAt'] ?? gmdate('c'),
                'model' => $mergedOptions['model'] ?? [],
                'executionMode' => $executionMode,
                'generation' => $generation,
            ], $html, $normalized['descriptor'], $hydration);
            $resume = $this->createResumeEnvelope([
                'requestId' => $requestId,
                'rootId' => $rootId,
                'templateId' => $chunk['template']['qualifiedId'] ?? null,
                'generation' => $generation,
                'renderedAt' => $chunk['renderedAt'] ?? gmdate('c'),
                'executionMode' => $executionMode,
                'options' => $mergedOptions,
                'coreDocument' => $normalized['coreDocument'] ?? null,
            ], $html, $normalized['descriptor'], $hydration, $diagnostics);
            $ok = !$this->hasBlockingDiagnostics($diagnostics);

            return [
                'schema' => RMT_PHP_SSR_RENDER_RESULT_SCHEMA,
                'adapterSchema' => RMT_PHP_SSR_ADAPTER_SCHEMA,
                'ok' => $ok,
                'status' => $ok ? 'rendered' : 'blocked',
                'requestId' => $requestId,
                'html' => $html,
                'head' => [
                    'preloads' => $this->collectPreloads($html),
                    'csp' => $cspPolicy,
                    'securityHeaders' => $headers,
                    'hints' => [[
                        'rel' => 'xtend-rmt-hydration',
                        'schema' => RMT_PHP_SSR_HYDRATION_SCHEMA,
                    ], [
                        'rel' => 'xtend-xscaler-preflight',
                        'schema' => RMT_XSCALER_SSR_HYDRATION_SCHEMA,
                        'count' => $xscaler['count'],
                    ]],
                ],
                'headers' => $headers,
                'cspPolicy' => $cspPolicy,
                'chunks' => [$chunk],
                'response' => $this->createPrerenderResponseEnvelope([
                    'requestId' => $requestId,
                    'rootId' => $rootId,
                    'renderedAt' => $chunk['renderedAt'] ?? gmdate('c'),
                    'executionMode' => $executionMode,
                ], $chunk, $hydration, $resume, $diagnostics, $ok, $cspPolicy, $headers),
                'hydration' => $hydration,
                'resume' => $resume,
                'streamingContract' => $streamingContract,
                'componentCapabilities' => array_values($componentCapabilities),
                'fabricTelemetryHints' => [
                    'schema' => 'xtend.rmt.php-ssr-fabric-telemetry-hints.v1',
                    'lanes' => $this->listLanes($normalized['coreDocument'] ?? null),
                    'kernelBoundary' => RMT_PHP_SSR_KERNEL_BOUNDARY,
                    'transport' => 'php-ssr',
                ],
                'diagnostics' => $diagnostics,
            ];
        }

        /**
         * Serialize a validated DOM descriptor through the same policy boundary as
         * full SSR renders. Hosts must not maintain a parallel descriptor serializer.
         */
        public function renderDescriptor(array $descriptor, array $options = []): array
        {
            return $this->render([
                'kind' => 'dom-descriptor',
                'descriptor' => $descriptor,
            ], array_replace($options, [
                'inputKind' => 'dom-descriptor',
            ]));
        }

        public function streamJsonl($input, array $options = []): Generator
        {
            $renderResult = $this->render($input, array_replace($options, ['streamMode' => true]));
            $sequence = 0;
            yield $this->jsonlFrame($sequence, $renderResult['requestId'], 'start', [
                'payload' => [
                    'adapterSchema' => RMT_PHP_SSR_ADAPTER_SCHEMA,
                    'streamingContractSchema' => $renderResult['streamingContract']['schema'] ?? RMT_PHP_SSR_STREAMING_CONTRACT_SCHEMA,
                    'cspPolicy' => $renderResult['cspPolicy'] ?? null,
                    'headers' => $renderResult['headers'] ?? [],
                ],
            ]);
            foreach ($renderResult['diagnostics'] as $diagnostic) {
                yield $this->jsonlFrame($sequence, $renderResult['requestId'], 'diagnostic', [
                    'payload' => ['code' => $diagnostic['code'] ?? 'rmt.php_ssr.diagnostic'],
                    'diagnostics' => [$diagnostic],
                ]);
            }
            if (!$renderResult['ok']) {
                yield $this->jsonlFrame($sequence, $renderResult['requestId'], 'error', [
                    'payload' => [
                        'status' => $renderResult['status'],
                        'code' => $this->firstDiagnosticCode($renderResult['diagnostics']),
                    ],
                    'diagnostics' => $renderResult['diagnostics'],
                ]);
            }
            foreach ($renderResult['componentCapabilities'] as $capability) {
                yield $this->jsonlFrame($sequence, $renderResult['requestId'], 'component', [
                    'capability' => $capability['tag'] ?? null,
                    'payload' => $capability,
                ]);
            }
            yield $this->jsonlFrame($sequence, $renderResult['requestId'], 'html', [
                'variant' => 'ssr',
                'capability' => 'stream.ssr.incremental',
                'lane' => 'server-prerender',
                'chunkKey' => $renderResult['chunks'][0]['template']['qualifiedId'] ?? null,
                'payload' => ['html' => $renderResult['html']],
            ]);

            foreach (($renderResult['streamingContract']['streams'] ?? []) as $operation) {
                $record = $operation['dataSource'] ?? null;
                if (!$record) continue;
                $diagnostics = [];
                $payload = $this->normalizeStreamPayload($this->resolveDataSource($record, $operation, $options, $diagnostics));
                foreach ($diagnostics as $diagnostic) {
                    yield $this->jsonlFrame($sequence, $renderResult['requestId'], 'diagnostic', [
                        'operationId' => $operation['operationId'] ?? $operation['id'] ?? null,
                        'variant' => $operation['variant'] ?? null,
                        'capability' => $operation['capability'] ?? null,
                        'payload' => ['code' => $diagnostic['code'] ?? 'rmt.php_ssr.diagnostic'],
                        'diagnostics' => [$diagnostic],
                    ]);
                    if (in_array($diagnostic['severity'] ?? '', ['error', 'fatal'], true)) {
                        yield $this->jsonlFrame($sequence, $renderResult['requestId'], 'error', [
                            'operationId' => $operation['operationId'] ?? $operation['id'] ?? null,
                            'variant' => $operation['variant'] ?? null,
                            'capability' => $operation['capability'] ?? null,
                            'payload' => [
                                'code' => $diagnostic['code'] ?? 'rmt.php_ssr.diagnostic',
                                'status' => 'blocked',
                            ],
                            'diagnostics' => [$diagnostic],
                        ]);
                    }
                }
                if (array_key_exists('html', $payload)) {
                    $htmlDiagnostics = [];
                    $html = $this->sanitizeHtmlFragment((string) $payload['html'], [
                        'descriptor' => [
                            'trustBoundary' => $payload['trustBoundary'] ?? ($record['trustBoundary'] ?? ($operation['security']['boundaryIds'] ?? ($options['defaultTrustBoundary'] ?? null))),
                        ],
                        'operationId' => $operation['operationId'] ?? null,
                    ], array_replace($this->options, $options), $htmlDiagnostics);
                    foreach ($htmlDiagnostics as $diagnostic) {
                        yield $this->jsonlFrame($sequence, $renderResult['requestId'], 'diagnostic', [
                            'operationId' => $operation['operationId'] ?? $operation['id'] ?? null,
                            'variant' => $operation['variant'] ?? null,
                            'capability' => $operation['capability'] ?? null,
                            'payload' => ['code' => $diagnostic['code'] ?? 'rmt.php_ssr.diagnostic'],
                            'diagnostics' => [$diagnostic],
                        ]);
                    }
                    yield $this->jsonlFrame($sequence, $renderResult['requestId'], 'html', [
                        'operationId' => $operation['operationId'] ?? $operation['id'] ?? null,
                        'variant' => $operation['variant'] ?? null,
                        'capability' => $operation['capability'] ?? null,
                        'lane' => $operation['lane'] ?? null,
                        'chunkKey' => $operation['chunkKey'] ?? ($operation['operationId'] ?? null),
                        'payload' => [
                            'html' => $html,
                            'dataSourceId' => $record['id'] ?? null,
                        ],
                    ]);
                }
            }

            yield $this->jsonlFrame($sequence, $renderResult['requestId'], 'hydration', [
                'variant' => 'hydration',
                'capability' => 'stream.hydration.chunked',
                'lane' => 'client-hydrate',
                'chunkKey' => $renderResult['chunks'][0]['template']['qualifiedId'] ?? null,
                'payload' => $renderResult['hydration'],
            ]);
            yield $this->jsonlFrame($sequence, $renderResult['requestId'], 'complete', [
                'payload' => [
                    'ok' => $renderResult['ok'],
                    'status' => $renderResult['status'],
                    'diagnostics' => count($renderResult['diagnostics']),
                ],
            ]);
        }

        public function toLaravelResponse($input, array $options = [])
        {
            $result = $this->isRenderResult($input) ? $input : $this->render($input, $options);
            $cspPolicy = is_array($result['cspPolicy'] ?? null) ? $result['cspPolicy'] : $this->createSsrCspPolicy($options);
            $headers = $this->createSecurityHeaders($cspPolicy, array_replace([
                'Content-Type' => 'text/html; charset=UTF-8',
                'X-XTend-RMT-SSR-Adapter' => RMT_PHP_SSR_ADAPTER_SCHEMA,
            ], is_array($result['headers'] ?? null) ? $result['headers'] : [], $options['headers'] ?? []));
            if (class_exists('\\Illuminate\\Http\\Response')) {
                return new \Illuminate\Http\Response($result['html'], $options['status'] ?? 200, $headers);
            }
            if (class_exists('\\Symfony\\Component\\HttpFoundation\\Response')) {
                return new \Symfony\Component\HttpFoundation\Response($result['html'], $options['status'] ?? 200, $headers);
            }
            return [
                'status' => $options['status'] ?? 200,
                'headers' => $headers,
                'body' => $result['html'],
            ];
        }

        public function toLaravelStreamedResponse($input, array $options = [])
        {
            $cspPolicy = $this->createSsrCspPolicy($options);
            $headers = $this->createSecurityHeaders($cspPolicy, array_replace([
                'Content-Type' => 'application/x-ndjson; charset=UTF-8',
                'X-XTend-RMT-SSR-Adapter' => RMT_PHP_SSR_ADAPTER_SCHEMA,
            ], $options['headers'] ?? []));
            $streamFactory = function () use ($input, $options): void {
                foreach ($this->streamJsonl($input, $options) as $line) {
                    echo $line;
                }
            };
            if (class_exists('\\Symfony\\Component\\HttpFoundation\\StreamedResponse')) {
                return new \Symfony\Component\HttpFoundation\StreamedResponse($streamFactory, $options['status'] ?? 200, $headers);
            }
            return [
                'status' => $options['status'] ?? 200,
                'headers' => $headers,
                'stream' => $this->streamJsonl($input, $options),
            ];
        }

        private function normalizeRenderInput($input, array $options, array &$diagnostics): array
        {
            $value = is_array($input) ? $input : ['descriptor' => $input];
            $hasSource = isset($value['source']) || isset($value['text']);
            $hasPreparedTemplate = isset($value['template']) || isset($value['preparedTemplate']) || (($value['kind'] ?? null) === 'rmt_prepared_template');
            $hasExplicitDescriptor = isset($value['descriptor']) || isset($value['domDescriptor']) || $hasPreparedTemplate;
            if ($hasSource && $hasExplicitDescriptor) {
                $source = (string) ($value['source'] ?? $value['text']);
                $compileResult = $this->compileSourceViaHost($source, $value, $options, $diagnostics);
                $template = null;
                if ($hasPreparedTemplate) {
                    $template = $value['template'] ?? ($value['preparedTemplate'] ?? $value);
                    $descriptor = $template['descriptor'] ?? ($template['domDescriptor'] ?? ($template['markup']['descriptor'] ?? (isset($template['html']) ? ['type' => 'html', 'html' => $template['html'], 'trustBoundary' => $template['trustBoundary'] ?? null] : null)));
                } else {
                    $descriptor = $value['descriptor'] ?? $value['domDescriptor'];
                }
                return [
                    'kind' => 'source+descriptor',
                    'source' => $source,
                    'compileResult' => $compileResult,
                    'coreDocument' => is_array($compileResult) ? ($compileResult['coreDocument'] ?? null) : null,
                    'template' => $template,
                    'descriptor' => $this->normalizeDescriptor($descriptor),
                    'sourceRef' => $value['filePath'] ?? ($value['sourceRef'] ?? (is_array($compileResult) ? ($compileResult['coreDocument']['sourceRef'] ?? null) : null)),
                ];
            }
            if (isset($value['descriptor']) || isset($value['domDescriptor'])) {
                return [
                    'kind' => 'dom-descriptor',
                    'descriptor' => $this->normalizeDescriptor($value['descriptor'] ?? $value['domDescriptor']),
                    'sourceRef' => $value['filePath'] ?? ($value['sourceRef'] ?? null),
                ];
            }
            $core = $value['coreDocument'] ?? ($value['core'] ?? ($this->isCoreDocument($value) ? $value : null));
            if ($this->isCoreDocument($core)) {
                return [
                    'kind' => 'core-document',
                    'coreDocument' => $core,
                    'descriptor' => isset($value['descriptor']) ? $this->normalizeDescriptor($value['descriptor']) : $this->deriveDescriptorFromCore($core),
                    'sourceRef' => $value['filePath'] ?? ($core['sourceRef'] ?? null),
                ];
            }
            if (isset($value['template']) || isset($value['preparedTemplate']) || (($value['kind'] ?? null) === 'rmt_prepared_template')) {
                $template = $value['template'] ?? ($value['preparedTemplate'] ?? $value);
                return [
                    'kind' => 'prepared-template',
                    'template' => $template,
                    'descriptor' => $this->normalizeDescriptor($template['descriptor'] ?? ($template['domDescriptor'] ?? ($template['markup']['descriptor'] ?? (isset($template['html']) ? ['type' => 'html', 'html' => $template['html'], 'trustBoundary' => $template['trustBoundary'] ?? null] : null)))),
                    'sourceRef' => $value['filePath'] ?? ($template['sourceRef'] ?? null),
                ];
            }
            if (is_string($input) || isset($value['source']) || isset($value['text'])) {
                $source = is_string($input) ? $input : (string) ($value['source'] ?? $value['text']);
                $compileResult = $this->compileSourceViaHost($source, $value, $options, $diagnostics);
                if (!is_array($compileResult) || !isset($compileResult['coreDocument'])) {
                    return [
                        'kind' => 'source',
                        'source' => $source,
                        'sourceRef' => $value['filePath'] ?? null,
                        'descriptor' => ['type' => 'empty'],
                    ];
                }
                return [
                    'kind' => 'source',
                    'source' => $source,
                    'compileResult' => $compileResult,
                    'coreDocument' => $compileResult['coreDocument'],
                    'descriptor' => $this->deriveDescriptorFromCore($compileResult['coreDocument']),
                    'sourceRef' => $value['filePath'] ?? ($compileResult['coreDocument']['sourceRef'] ?? null),
                ];
            }
            return [
                'kind' => 'dom-descriptor',
                'descriptor' => $this->normalizeDescriptor($input),
                'sourceRef' => null,
            ];
        }

        private function compileSourceViaHost(string $source, array $value, array $options, array &$diagnostics): ?array
        {
            $compiler = $options['compileRmtVNextSource'] ?? null;
            if (!is_callable($compiler)) {
                $diagnostics[] = $this->diagnostic('rmt.php_ssr.compiler_required', 'Rendering RMT source in PHP requires an injected compileRmtVNextSource host bridge.', 'error', [
                    'filePath' => $value['filePath'] ?? null,
                ]);
                return null;
            }
            $compileResult = $compiler($source, ['filePath' => $value['filePath'] ?? ($value['sourceRef'] ?? 'inline.rmt')]);
            if (!is_array($compileResult) || ($compileResult['ok'] ?? false) === false || !isset($compileResult['coreDocument'])) {
                $diagnostics[] = $this->diagnostic('rmt.php_ssr.compile_failed', 'Injected RMT compiler bridge did not return a Core Document.', 'error');
                return is_array($compileResult) ? $compileResult : null;
            }
            return $compileResult;
        }

        private function normalizeDescriptor($input): array
        {
            if (is_array($input)) {
                if ($this->isList($input)) return ['type' => 'fragment', 'children' => $input];
                if (isset($input['descriptor'])) return $this->normalizeDescriptor($input['descriptor']);
                if (isset($input['domDescriptor'])) return $this->normalizeDescriptor($input['domDescriptor']);
                return $input;
            }
            if ($input === null || $input === false) return ['type' => 'empty'];
            return ['type' => 'text', 'text' => $input];
        }

        private function decorateResumeDescriptor(array $descriptor, string $rootId, string $generation, string $path = '0', int &$index = 0): array
        {
            $type = (string) ($descriptor['type'] ?? (isset($descriptor['tag']) || isset($descriptor['component']) ? 'element' : 'fragment'));
            if (in_array($type, ['element', 'component'], true) || isset($descriptor['tag']) || isset($descriptor['component'])) {
                $attributes = isset($descriptor['attributes']) && is_array($descriptor['attributes']) ? $descriptor['attributes'] : [];
                $attributes['data-rmt-resume-id'] = $attributes['data-rmt-resume-id'] ?? ($rootId . ':' . $path . ':' . $index++);
                $attributes['data-rmt-resume-generation'] = $generation;
                if ($path === '0') {
                    $attributes['id'] = $attributes['id'] ?? $rootId;
                    $attributes['data-rmt-resume-root'] = 'true';
                }
                $descriptor['attributes'] = $attributes;
            }
            $children = $descriptor['children'] ?? ($descriptor['nodes'] ?? null);
            if (is_array($children)) {
                $decorated = [];
                foreach ($children as $childIndex => $child) {
                    $decorated[] = is_array($child)
                        ? $this->decorateResumeDescriptor($child, $rootId, $generation, $path . '.' . $childIndex, $index)
                        : $child;
                }
                if (array_key_exists('children', $descriptor)) $descriptor['children'] = $decorated;
                else $descriptor['nodes'] = $decorated;
            }
            return $descriptor;
        }

        private function serializeDescriptor($input, array $context, array &$diagnostics): string
        {
            $descriptor = $this->normalizeDescriptor($input);
            $type = (string) ($descriptor['type'] ?? ($descriptor['kind'] ?? (isset($descriptor['component']) || isset($descriptor['componentTag']) ? 'component' : (isset($descriptor['tag']) ? 'element' : (isset($descriptor['html']) ? 'html' : (array_key_exists('text', $descriptor) ? 'text' : 'fragment'))))));
            if ($type === 'empty') return '';
            if ($type === 'text') return $this->escapeHtml((string) ($descriptor['text'] ?? ''));
            if ($type === 'html' || $type === 'trusted_html' || isset($descriptor['html'])) {
                return $this->sanitizeHtmlFragment((string) ($descriptor['html'] ?? ($descriptor['content'] ?? '')), array_replace($context, ['descriptor' => $descriptor]), $context['options'] ?? [], $diagnostics);
            }
            if ($type === 'component') return $this->serializeComponent($descriptor, $context, $diagnostics);
            if ($type === 'element') return $this->serializeElement($descriptor, $context, $diagnostics);
            if ($type === 'slot') return $this->serializeDescriptor($this->descriptorWithSlot($descriptor['children'] ?? ($descriptor['text'] ?? ''), (string) ($descriptor['slot'] ?? ($descriptor['name'] ?? 'default'))), $context, $diagnostics);
            if ($type === 'fragment') {
                $html = '';
                foreach ($this->asArray($descriptor['children'] ?? ($descriptor['nodes'] ?? [])) as $child) {
                    $html .= $this->serializeDescriptor($child, $context, $diagnostics);
                }
                return $html;
            }
            $diagnostics[] = $this->diagnostic('rmt.php_ssr.descriptor_type_unsupported', 'Unsupported PHP SSR descriptor type "' . $type . '".', 'error');
            return '';
        }

        private function serializeComponent(array $descriptor, array &$context, array &$diagnostics): string
        {
            $tag = (string) ($descriptor['tag'] ?? ($descriptor['componentTag'] ?? ($descriptor['host'] ?? ($descriptor['component'] ?? ($descriptor['ref'] ?? 'div')))));
            $capability = $this->resolveCapability($tag);
            if (!$capability && str_starts_with($tag, 'x-')) {
                $diagnostics[] = $this->diagnostic('rmt.php_ssr.component_capability_missing', 'No XTend component capability metadata was available for "' . $tag . '".', 'warning', [
                    'tag' => $tag,
                ]);
            }
            if ($capability && isset($context['componentCapabilities']) && is_array($context['componentCapabilities'])) {
                $context['componentCapabilities'][$capability['tag']] = $capability;
            }
            $normalizedTag = $this->normalizeTag($capability['tag'] ?? $tag, $diagnostics);
            $attributes = $this->mergeAttributes(
                $descriptor['attributes'] ?? [],
                $descriptor['attrs'] ?? [],
                $this->propertiesAsAttributes($descriptor['properties'] ?? ($descriptor['props'] ?? [])),
                [
                    'data-rmt-node-ssr' => 'true',
                    'data-rmt-component-capability' => $capability['tag'] ?? $normalizedTag,
                    'data-rmt-component-family' => $capability['family'] ?? null,
                    'data-rmt-lazy-import' => $capability['modulePath'] ?? null,
                ],
                $this->eventAttributes($descriptor['events'] ?? ($descriptor['eventBindings'] ?? []))
            );
            $parts = $this->asArray($descriptor['parts'] ?? ($descriptor['part'] ?? []));
            if ($parts) $attributes['part'] = implode(' ', array_values(array_unique(array_map('strval', $parts))));
            $children = [];
            foreach (($descriptor['slots'] ?? []) as $slotName => $slotValue) {
                foreach ($this->asArray($slotValue) as $slotChild) {
                    $children[] = $this->descriptorWithSlot($slotChild, (string) $slotName);
                }
            }
            foreach ($this->asArray($descriptor['children'] ?? ($descriptor['nodes'] ?? [])) as $child) {
                $children[] = $child;
            }
            $open = '<' . $normalizedTag . $this->serializeAttributes($attributes, $diagnostics) . '>';
            $html = '';
            foreach ($children as $child) {
                $html .= $this->serializeDescriptor($child, $context, $diagnostics);
            }
            return $open . $html . '</' . $normalizedTag . '>';
        }

        private function serializeElement(array $descriptor, array $context, array &$diagnostics): string
        {
            $tag = $this->normalizeTag((string) ($descriptor['tag'] ?? ($descriptor['element'] ?? 'div')), $diagnostics);
            $attributes = $this->mergeAttributes($descriptor['attributes'] ?? [], $descriptor['attrs'] ?? []);
            $open = '<' . $tag . $this->serializeAttributes($attributes, $diagnostics) . '>';
            if (isset($this->voidTags[$tag])) return $open;
            $html = '';
            foreach ($this->asArray($descriptor['children'] ?? ($descriptor['nodes'] ?? [])) as $child) {
                $html .= $this->serializeDescriptor($child, $context, $diagnostics);
            }
            return $open . $html . '</' . $tag . '>';
        }

        private function descriptorWithSlot($descriptor, string $slotName): array
        {
            if (is_array($descriptor) && !$this->isList($descriptor)) {
                if (isset($descriptor['text']) && !isset($descriptor['type']) && !isset($descriptor['tag']) && !isset($descriptor['component'])) {
                    return [
                        'type' => 'element',
                        'tag' => 'span',
                        'attributes' => array_replace($descriptor['attributes'] ?? [], ['slot' => $slotName]),
                        'children' => [['type' => 'text', 'text' => $descriptor['text']]],
                    ];
                }
                $descriptor['attributes'] = array_replace($descriptor['attributes'] ?? [], ['slot' => $descriptor['slot'] ?? (($descriptor['attributes']['slot'] ?? null) ?: $slotName)]);
                return $descriptor;
            }
            return [
                'type' => 'element',
                'tag' => 'span',
                'attributes' => ['slot' => $slotName],
                'children' => [$descriptor],
            ];
        }

        private function sanitizeHtmlFragment(string $html, array $context, array $options, array &$diagnostics): string
        {
            if (!$this->hasTrustBoundary($context['descriptor'] ?? [], $options)) {
                $diagnostics[] = $this->diagnostic('rmt.php_ssr.trust_boundary_missing', 'HTML fragments require an explicit XTend trust boundary or host sanitizer.', 'error', [
                    'operationId' => $context['operationId'] ?? null,
                ]);
            }
            if (isset($options['sanitizeHtmlOutput']) && is_callable($options['sanitizeHtmlOutput'])) {
                return (string) $options['sanitizeHtmlOutput']($html, ['context' => $context, 'diagnostics' => $diagnostics]);
            }
            $before = $html;
            $blockedTags = implode('|', array_map('preg_quote', array_keys($this->blockedTags)));
            $html = preg_replace('/<(' . $blockedTags . ')\\b[^>]*>.*?<\\/\\1>/is', '', $html) ?? '';
            $html = preg_replace('/<\\/?(' . $blockedTags . ')\\b[^>]*>/i', '', $html) ?? '';
            $html = preg_replace('/\\s+on[a-z0-9_-]+\\s*=\\s*("[^"]*"|\\\'[^\\\']*\\\'|[^\\s>]+)/i', '', $html) ?? '';
            $html = preg_replace('/\\s+srcdoc\\s*=\\s*("[^"]*"|\\\'[^\\\']*\\\'|[^\\s>]+)/i', '', $html) ?? '';
            $html = preg_replace_callback('/\\s+(href|src|action|formaction|poster|xlink:href)\\s*=\\s*("[^"]*"|\\\'[^\\\']*\\\'|[^\\s>]+)/i', function (array $matches): string {
                $value = trim($matches[2], "'\"");
                return $this->isSafeUrl($value) ? $matches[0] : '';
            }, $html) ?? '';
            if ($before !== $html) {
                $diagnostics[] = $this->diagnostic('rmt.php_ssr.html_sanitized', 'Unsafe server markup was sanitized by the PHP SSR adapter fallback sanitizer.', 'warning');
            }
            return $html;
        }

        private function resolveCapability(string $tag): ?array
        {
            $tag = strtolower(trim($tag));
            $manifest = $this->options['manifest'] ?? [];
            $modulePath = $manifest[$tag] ?? null;
            if (!$modulePath && isset($this->options['componentCapabilities'][$tag]['modulePath'])) {
                $modulePath = $this->options['componentCapabilities'][$tag]['modulePath'];
            }
            if (!$modulePath && !str_starts_with($tag, 'x-')) return null;
            return [
                'tag' => $tag,
                'family' => $this->inferFamily($tag),
                'visualKind' => 'public-ui',
                'modulePath' => $modulePath,
                'slots' => $this->options['componentCapabilities'][$tag]['slots'] ?? [],
                'parts' => $this->options['componentCapabilities'][$tag]['parts'] ?? [],
                'events' => $this->options['componentCapabilities'][$tag]['events'] ?? [],
                'importPolicy' => 'explicit-importer-only',
                'kernelBoundary' => RMT_PHP_SSR_KERNEL_BOUNDARY,
            ];
        }

        private function inferFamily(string $tag): string
        {
            if (in_array($tag, ['x-input', 'x-select', 'x-checkbox', 'x-radio', 'x-calendar', 'x-textarea', 'x-form'], true)) return 'form';
            if (in_array($tag, ['x-router', 'x-link', 'x-menu', 'x-drawer'], true)) return 'navigation';
            if (in_array($tag, ['x-modal', 'x-dialog', 'x-popover', 'x-tooltip', 'x-lightbox', 'x-toast', 'x-side-panel', 'x-surface-window', 'x-surface-manager'], true)) return 'overlay-surface';
            if (in_array($tag, ['x-player', 'x-status', 'x-progress', 'x-code', 'x-icon', 'x-cards', 'x-masonry', 'x-summary', 'x-type', 'x-writer'], true)) return 'media-feedback-layout';
            if (in_array($tag, ['x-theme', 'x-section', 'x-hero', 'x-header', 'x-footer'], true)) return 'theme-layout';
            return 'general-ui';
        }

        private function createStreamingContract(?array $coreDocument): ?array
        {
            if (!$coreDocument || empty($coreDocument['dataSources'])) return null;
            $dataSources = [];
            foreach ($coreDocument['dataSources'] as $dataSource) {
                $dataSources[$dataSource['id'] ?? ($dataSource['target'] ?? '')] = $dataSource;
            }
            $streams = [];
            foreach (($coreDocument['operations'] ?? []) as $operation) {
                $sourceRef = $operation['source']['ref'] ?? null;
                if (!$sourceRef || !isset($dataSources[$sourceRef])) continue;
                $record = $dataSources[$sourceRef];
                $variant = $this->operationVariant($operation, $record);
                $streams[] = [
                    'schema' => 'xtend.rmt.vnext-stream-operation.v1',
                    'operationId' => $operation['id'] ?? null,
                    'operationKind' => $operation['kind'] ?? null,
                    'variant' => $variant,
                    'capability' => $variant === 'hydration' ? 'stream.hydration.chunked' : 'stream.' . $variant . '.incremental',
                    'lane' => $operation['scope']['lane'] ?? null,
                    'chunkKey' => 'rmt.vnext.' . $variant . '.' . ($operation['id'] ?? uniqid('operation:', false)),
                    'dataSource' => [
                        'id' => $record['id'] ?? $sourceRef,
                        'kind' => $record['kind'] ?? null,
                        'target' => $record['target'] ?? ($operation['source']['id'] ?? null),
                    ],
                    'security' => [
                        'boundaryIds' => ['xtend.security.streaming-boundary.v1'],
                    ],
                ];
            }
            return [
                'schema' => RMT_PHP_SSR_STREAMING_CONTRACT_SCHEMA,
                'coreSchema' => $coreDocument['schema'] ?? null,
                'ok' => true,
                'streams' => $streams,
                'streamRecordCount' => count($streams),
            ];
        }

        private function operationVariant(array $operation, array $record): string
        {
            if (($operation['op'] ?? null) === 'hydrate') return 'hydration';
            $kind = $record['kind'] ?? ($operation['source']['kind'] ?? 'endpoint');
            if ($kind === 'sse') return 'sse';
            if ($kind === 'worker') return 'worker';
            return 'ssr';
        }

        private function resolveDataSource(array $record, array $operation, array $options, array &$diagnostics)
        {
            $mergedOptions = array_replace($this->options, $options);
            $target = $record['target'] ?? ($record['id'] ?? null);
            if (isset($mergedOptions['resolveDataSource']) && is_callable($mergedOptions['resolveDataSource'])) {
                return $mergedOptions['resolveDataSource']($record, ['operation' => $operation]);
            }
            if ($target && isset($mergedOptions['endpointHandlers'][$target]) && is_callable($mergedOptions['endpointHandlers'][$target])) {
                return $mergedOptions['endpointHandlers'][$target]($record, ['operation' => $operation]);
            }
            $static = array_replace($mergedOptions['staticDataSources'] ?? [], $mergedOptions['fixtures'] ?? []);
            if ($target && array_key_exists($target, $static)) return $static[$target];
            if (isset($record['id']) && array_key_exists($record['id'], $static)) return $static[$record['id']];
            if (isset($mergedOptions['fetchAdapter']) && is_callable($mergedOptions['fetchAdapter'])) {
                return $mergedOptions['fetchAdapter']($record, ['operation' => $operation]);
            }
            if (isset($mergedOptions['laravelContainerResolver']) && is_callable($mergedOptions['laravelContainerResolver'])) {
                return $mergedOptions['laravelContainerResolver']($record, ['operation' => $operation]);
            }
            $diagnostics[] = $this->diagnostic('rmt.php_ssr.datasource_missing', 'No host resolver was provided for data source "' . ($target ?: '<unknown>') . '".', 'error', [
                'operationId' => $operation['operationId'] ?? ($operation['id'] ?? null),
                'dataSourceId' => $record['id'] ?? null,
                'target' => $target,
            ]);
            return null;
        }

        private function normalizeStreamPayload($value): array
        {
            if ($value === null) return [];
            if (is_string($value)) return ['html' => $value];
            if (is_array($value)) return $value;
            return ['value' => $value];
        }

        private function canonicalizeResumeValue($value)
        {
            if (!is_array($value)) return $value;
            if ($this->isList($value)) {
                return array_map(fn ($entry) => $this->canonicalizeResumeValue($entry), $value);
            }
            ksort($value, SORT_STRING);
            foreach ($value as $key => $entry) $value[$key] = $this->canonicalizeResumeValue($entry);
            return $value;
        }

        private function canonicalResumeJson(array $value): string
        {
            return (string) json_encode($this->canonicalizeResumeValue($value), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        }

        private function sha256Base64Url(string $value): string
        {
            return rtrim(strtr(base64_encode(hash('sha256', $value, true)), '+/', '-_'), '=');
        }

        private function preservedStateFromCore(?array $coreDocument): array
        {
            $state = [];
            foreach (($coreDocument['states'] ?? []) as $entry) {
                if (($entry['preserve'] ?? false) !== true) continue;
                $id = $entry['name'] ?? ($entry['id'] ?? null);
                if ($id !== null) $state[(string) $id] = $entry['initial'] ?? null;
            }
            return $state;
        }

        private function createResumeNodeManifest(array $descriptor): array
        {
            $records = [];
            $visit = function ($entry) use (&$visit, &$records): void {
                if (!is_array($entry)) return;
                if ($this->isList($entry)) {
                    foreach ($entry as $child) $visit($child);
                    return;
                }
                $attributes = isset($entry['attributes']) && is_array($entry['attributes']) ? $entry['attributes'] : [];
                $id = trim((string) ($attributes['data-rmt-resume-id'] ?? ''));
                if ($id !== '') {
                    $records[] = [
                        'generation' => (string) ($attributes['data-rmt-resume-generation'] ?? ''),
                        'id' => $id,
                        'tag' => strtolower((string) ($entry['tag'] ?? ($entry['component'] ?? ''))),
                    ];
                }
                $children = $entry['children'] ?? ($entry['nodes'] ?? []);
                if (is_array($children)) foreach ($children as $child) $visit($child);
            };
            $visit($descriptor);
            return $records;
        }

        private function createResumeEnvelope(array $state, string $html, array $descriptor, array $hydration, array &$diagnostics): ?array
        {
            if (($state['executionMode'] ?? null) !== RMT_PHP_SSR_RESUME_EXECUTION_MODE) return null;
            $options = isset($state['options']) && is_array($state['options']) ? $state['options'] : [];
            $resume = isset($options['resume']) && is_array($options['resume']) ? $options['resume'] : [];
            $issuedAt = (string) ($resume['issuedAt'] ?? $state['renderedAt']);
            $issuedTimestamp = strtotime($issuedAt);
            $expiresAt = (string) ($resume['expiresAt'] ?? gmdate('c', ($issuedTimestamp === false ? time() : $issuedTimestamp) + 300));
            $xtensions = isset($resume['xtensions']) && is_array($resume['xtensions']) ? $resume['xtensions'] : [];
            $manifests = isset($resume['manifests']) && is_array($resume['manifests']) ? $resume['manifests'] : [];
            $fragments = isset($resume['islandFragments']) && is_array($resume['islandFragments']) ? $resume['islandFragments'] : [];
            $fragmentIds = [];
            foreach ($fragments as $fragment) {
                if (is_array($fragment) && $this->isNonEmptyString($fragment['id'] ?? null)) $fragmentIds[(string) $fragment['id']] = true;
            }
            foreach ($manifests as $manifest) {
                if (!is_array($manifest) || ($manifest['adoptionStrategy'] ?? null) !== 'dom_hydrate') continue;
                $id = (string) ($manifest['id'] ?? ($manifest['xtension'] ?? ''));
                if (!$this->isNonEmptyString($manifest['serverEntry'] ?? null) && !isset($fragmentIds[$id])) {
                    $diagnostics[] = $this->diagnostic('rmt.php_ssr.resume_island_fragment_missing', 'PHP resume requires a host-provided island fragment or serverEntry for DOM hydration.', 'error', ['xtension' => $id]);
                }
            }
            $resumeNodeManifest = $this->createResumeNodeManifest($descriptor);
            $unsigned = [
                'schema' => RMT_SSR_RESUME_ENVELOPE_SCHEMA,
                'version' => 1,
                'executionMode' => RMT_PHP_SSR_RESUME_EXECUTION_MODE,
                'requestId' => $state['requestId'],
                'rootId' => $state['rootId'],
                'templateId' => $state['templateId'],
                'generation' => $state['generation'],
                'issuedAt' => $issuedAt,
                'expiresAt' => $expiresAt,
                'snapshot' => [
                    'schema' => 'xtend.rmt.resume-snapshot.v1',
                    'state' => $resume['state'] ?? $this->preservedStateFromCore($state['coreDocument'] ?? null),
                    'surfaces' => $resume['surfaces'] ?? [],
                ],
                'eventReplay' => [
                    'schema' => 'xtend.rmt.resume-intent-queue-policy.v1',
                    'mode' => 'intent_queue',
                    'generation' => $state['generation'],
                    'maxEntries' => 128,
                    'replayExactlyOnce' => true,
                ],
                'xtensions' => $xtensions,
                'manifests' => $manifests,
                'islandFragments' => $fragments,
                'dom' => [
                    'schema' => 'xtend.rmt.resume-dom-digest.v1',
                    'algorithm' => 'SHA-256',
                    'encoding' => 'base64url',
                    'canonicalization' => 'resume-node-manifest.v1',
                    'nodeCount' => count($resumeNodeManifest),
                    'digest' => $this->sha256Base64Url($this->canonicalResumeJson($resumeNodeManifest)),
                ],
                'fallbackMode' => RMT_PHP_SSR_EXECUTION_MODE,
                'hydrationSchema' => $hydration['schema'] ?? RMT_PHP_SSR_HYDRATION_SCHEMA,
            ];
            $canonical = $this->canonicalResumeJson($unsigned);
            $signer = $resume['sign'] ?? ($options['signResumeEnvelope'] ?? null);
            if (!is_callable($signer)) {
                $diagnostics[] = $this->diagnostic('rmt.php_ssr.resume_signer_missing', 'server_prerender_resume requires a host-provided resume signer.', 'error', ['rootId' => $state['rootId']]);
                return array_replace($unsigned, ['integrity' => [
                    'schema' => RMT_SSR_RESUME_INTEGRITY_SCHEMA,
                    'algorithm' => null,
                    'encoding' => 'base64url',
                    'keyId' => null,
                    'digest' => $this->sha256Base64Url($canonical),
                    'signature' => null,
                    'verified' => false,
                ]]);
            }
            try {
                $signed = $signer($canonical, [
                    'schema' => RMT_SSR_RESUME_ENVELOPE_SCHEMA,
                    'requestId' => $state['requestId'],
                    'rootId' => $state['rootId'],
                    'generation' => $state['generation'],
                ]);
            } catch (Throwable $error) {
                $diagnostics[] = $this->diagnostic('rmt.php_ssr.resume_signing_failed', $error->getMessage(), 'error', ['rootId' => $state['rootId']]);
                $signed = [];
            }
            $signature = is_string($signed) ? $signed : (is_array($signed) ? ($signed['signature'] ?? null) : null);
            $algorithm = is_array($signed) ? ($signed['algorithm'] ?? 'ECDSA-P256-SHA256') : 'ECDSA-P256-SHA256';
            $keyId = is_array($signed) ? ($signed['keyId'] ?? ($resume['keyId'] ?? null)) : ($resume['keyId'] ?? null);
            if (!$this->isNonEmptyString($signature) || !$this->isNonEmptyString($keyId)) {
                $diagnostics[] = $this->diagnostic('rmt.php_ssr.resume_signature_incomplete', 'Resume signer must return signature and keyId.', 'error', ['rootId' => $state['rootId']]);
            }
            return array_replace($unsigned, ['integrity' => [
                'schema' => RMT_SSR_RESUME_INTEGRITY_SCHEMA,
                'algorithm' => $algorithm,
                'encoding' => 'base64url',
                'keyId' => $keyId,
                'digest' => $this->sha256Base64Url($canonical),
                'signature' => $signature,
            ]]);
        }

        private function createChunk(array $state, string $html, array $descriptor, array $hydration): array
        {
            $executionMode = (string) ($state['executionMode'] ?? RMT_PHP_SSR_EXECUTION_MODE);
            $documentId = $state['coreDocument']['manifest']['id'] ?? $state['requestId'];
            $templateId = $this->safeIdentifier($state['options']['templateId'] ?? $documentId, 'rmt-php-ssr-template');
            $namespace = (string) ($state['options']['namespace'] ?? 'rmt');
            $qualifiedId = $this->safeIdentifier($namespace) . ':' . $templateId;
            return [
                'kind' => RMT_PHP_SSR_CHUNK_KIND,
                'version' => '1.0',
                'executionMode' => $executionMode,
                'transport' => 'server',
                'rootId' => $state['rootId'],
                'template' => [
                    'id' => $templateId,
                    'qualifiedId' => $qualifiedId,
                    'namespace' => $namespace,
                    'documentId' => $documentId,
                    'mode' => 'dom_descriptor',
                    'props' => [],
                ],
                'target' => [
                    'elementId' => $state['rootId'],
                    'selector' => '#' . $state['rootId'],
                    'ownershipMode' => $executionMode === RMT_PHP_SSR_RESUME_EXECUTION_MODE ? 'resume_existing' : 'hydrate_existing',
                    'namespace' => $namespace,
                ],
                'markup' => [
                    'html' => $html,
                    'textContent' => trim(preg_replace('/<[^>]*>/', ' ', $html) ?? ''),
                    'descriptor' => $descriptor,
                ],
                'hydration' => [
                    'bindings' => [],
                    'slots' => [],
                    'props' => [],
                    'templateHydration' => [
                        'mode' => $executionMode,
                        'schema' => RMT_PHP_SSR_HYDRATION_SCHEMA,
                    ],
                    'errorBoundary' => ['mode' => 'preserve-server-markup'],
                    'reactivityHints' => ['source' => 'rmt-php-ssr-adapter'],
                    'ownershipMode' => $executionMode === RMT_PHP_SSR_RESUME_EXECUTION_MODE ? 'resume_existing' : 'hydrate_existing',
                    'resourceId' => 'template.chunk:' . $qualifiedId,
                    'metadata' => $hydration,
                ],
                'modelSnapshot' => $state['model'],
                'plan' => [
                    'executionMode' => $executionMode,
                    'rootId' => $state['rootId'],
                    'templateQualifiedId' => $qualifiedId,
                    'namespace' => $namespace,
                    'phases' => ['server_prerender', 'html_delivery', $executionMode === RMT_PHP_SSR_RESUME_EXECUTION_MODE ? 'client_resume' : 'client_hydrate'],
                ],
                'renderedAt' => $state['renderedAt'],
            ];
        }

        private function createPrerenderResponseEnvelope(array $state, array $chunk, array $hydration, ?array $resume, array $diagnostics, bool $ok, array $cspPolicy, array $headers): array
        {
            $executionMode = (string) ($state['executionMode'] ?? RMT_PHP_SSR_EXECUTION_MODE);
            $parsedAt = isset($state['renderedAt']) ? strtotime((string) $state['renderedAt']) : false;
            $timestamp = $parsedAt === false ? (int) floor(microtime(true) * 1000) : $parsedAt * 1000;
            $metadata = [
                'adapterKind' => 'php-ssr',
                'adapterSchema' => RMT_PHP_SSR_ADAPTER_SCHEMA,
                'hydrationSchema' => RMT_PHP_SSR_HYDRATION_SCHEMA,
                'requestId' => $state['requestId'],
                'sourceKind' => $hydration['sourceKind'] ?? null,
                'sourceRef' => $hydration['sourceRef'] ?? null,
                'cspPolicy' => $cspPolicy,
            ];
            $request = [
                'kind' => 'rmt_template_prerender_request',
                'version' => '1.0',
                'executionMode' => $executionMode,
                'transport' => 'server',
                'rootId' => $state['rootId'],
                'template' => $chunk['template'] ?? null,
                'target' => $chunk['target'] ?? null,
                'metadata' => $metadata,
                'requestedAt' => $timestamp,
            ];
            return [
                'kind' => RMT_PHP_SSR_RESPONSE_KIND,
                'version' => '1.0',
                'ok' => $ok,
                'status' => $ok ? 'rendered' : 'blocked',
                'transport' => 'server',
                'executionMode' => $executionMode,
                'adapterKind' => 'php-ssr',
                'supportStatus' => $ok ? 'supported' : 'blocked',
                'rootId' => $state['rootId'],
                'template' => $chunk['template'] ?? null,
                'target' => $chunk['target'] ?? null,
                'plan' => $chunk['plan'] ?? null,
                'request' => $request,
                'metadata' => $metadata,
                'headers' => $headers,
                'chunk' => $chunk,
                'chunks' => [$chunk],
                'hydration' => $hydration,
                'resume' => $resume,
                'diagnostics' => $diagnostics,
                'superseded' => false,
                'error' => $ok ? null : [
                    'code' => 'rmt.php_ssr.prerender_blocked',
                    'message' => 'PHP SSR prerender response was blocked by diagnostics.',
                    'diagnostics' => $diagnostics,
                ],
                'requestedAt' => $timestamp,
                'respondedAt' => $timestamp,
            ];
        }

        private function deriveDescriptorFromCore(array $coreDocument): array
        {
            $selectors = [];
            foreach (($coreDocument['selectors'] ?? []) as $selector) {
                if (isset($selector['id'])) $selectors[$selector['id']] = $selector;
                if (isset($selector['name'])) $selectors[$selector['name']] = $selector;
            }
            $children = [];
            foreach (($coreDocument['surfaces'] ?? []) as $surface) {
                $selectorId = $surface['source']['selectorId'] ?? ($surface['source']['id'] ?? ($surface['source']['name'] ?? null));
                $state = $this->findStateValue($coreDocument, $selectorId ? ($selectors[$selectorId] ?? null) : null);
                $text = is_array($state) ? ($state['text'] ?? ($state['label'] ?? ($state['value'] ?? null))) : null;
                $children[] = [
                    'type' => 'component',
                    'tag' => $surface['component'] ?? ($surface['tag'] ?? 'section'),
                    'id' => $this->safeIdentifier($surface['id'] ?? ($surface['name'] ?? 'surface')),
                    'key' => $this->safeIdentifier($surface['key'] ?? ($surface['id'] ?? ($surface['name'] ?? 'surface'))),
                    'attributes' => [
                        'id' => $this->safeIdentifier($surface['id'] ?? ($surface['name'] ?? 'surface')),
                        'data-rmt-surface-id' => $surface['id'] ?? ($surface['name'] ?? null),
                        'data-rmt-surface-name' => $surface['name'] ?? ($surface['id'] ?? null),
                        'data-rmt-surface-kind' => $surface['kind'] ?? ($surface['type'] ?? 'surface'),
                        'data-rmt-primitive-id' => $surface['name'] ?? ($surface['id'] ?? null),
                        'data-rmt-lane' => 'server-prerender',
                        'data-rmt-source-ref' => $surface['sourceRef'] ?? ($surface['source']['sourceRef'] ?? null),
                    ],
                    'children' => $text ? [['type' => 'text', 'text' => $text]] : [],
                ];
            }
            return [
                'type' => 'element',
                'tag' => 'section',
                'attributes' => [
                    'data-rmt-node-ssr-root' => 'true',
                    'data-rmt-document-id' => $coreDocument['manifest']['id'] ?? 'rmt-document',
                ],
                'children' => $children,
            ];
        }

        private function findStateValue(array $coreDocument, ?array $selector)
        {
            if (!$selector) return null;
            $candidates = array_filter([
                $selector['target'] ?? null,
                $selector['source'] ?? null,
                $selector['sourceRef'] ?? null,
                isset($selector['id']) ? 'state:' . $selector['id'] : null,
                isset($selector['name']) ? 'state:' . $selector['name'] : null,
            ]);
            foreach (($coreDocument['states'] ?? []) as $state) {
                foreach ($candidates as $candidate) {
                    if (($state['id'] ?? null) === $candidate || ($state['name'] ?? null) === $candidate || ($state['target'] ?? null) === $candidate) {
                        return $state['initial'] ?? ($state['value'] ?? ($state['defaultValue'] ?? null));
                    }
                }
            }
            return null;
        }

        private function serializeAttributes(array $attributes, array &$diagnostics): string
        {
            $result = '';
            foreach ($attributes as $name => $value) {
                $result .= $this->serializeAttribute((string) $name, $value, $diagnostics);
            }
            return $result;
        }

        private function serializeAttribute(string $name, $value, array &$diagnostics): string
        {
            $name = strtolower(trim($name));
            if ($name === '' || !preg_match('/^[a-z_:][a-z0-9_.:-]*$/', $name)) {
                $diagnostics[] = $this->diagnostic('rmt.php_ssr.attribute_blocked', 'Blocked invalid attribute.', 'error', ['attribute' => $name]);
                return '';
            }
            if (str_starts_with($name, 'on') || $name === 'srcdoc') {
                $diagnostics[] = $this->diagnostic('rmt.php_ssr.attribute_blocked', 'Blocked unsafe attribute "' . $name . '".', 'error', ['attribute' => $name]);
                return '';
            }
            if ($value === null || $value === false) return '';
            if (isset($this->urlAttributes[$name]) && !$this->isSafeUrl((string) $value)) {
                $diagnostics[] = $this->diagnostic('rmt.php_ssr.url_blocked', 'Blocked unsafe URL in "' . $name . '".', 'error', ['attribute' => $name]);
                return '';
            }
            if ($value === true) $value = 'true';
            if (is_array($value) || is_object($value)) $value = json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            return ' ' . $name . '="' . $this->escapeAttribute((string) $value) . '"';
        }

        private function normalizeTag(string $tag, array &$diagnostics): string
        {
            $tag = strtolower(trim($tag));
            if ($tag !== '' && preg_match('/^[a-z][a-z0-9._:-]*$/', $tag) && !isset($this->blockedTags[$tag])) return $tag;
            $diagnostics[] = $this->diagnostic('rmt.php_ssr.tag_blocked', 'Blocked unsafe tag "' . ($tag ?: '<empty>') . '".', 'error');
            return 'div';
        }

        private function propertiesAsAttributes($properties): array
        {
            $attributes = [];
            if (!is_array($properties)) return $attributes;
            foreach ($properties as $name => $value) {
                if (is_array($value) || is_object($value)) {
                    $attributes['data-rmt-prop-' . $this->safeIdentifier((string) $name, 'prop')] = json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
                } else {
                    $attributes[(string) $name] = $value;
                }
            }
            return $attributes;
        }

        private function eventAttributes($events): array
        {
            $attributes = [];
            if (!is_array($events)) return $attributes;
            foreach ($events as $name => $action) {
                $attributes['data-rmt-event-' . $this->safeIdentifier((string) $name, 'event')] = is_scalar($action) ? (string) $action : json_encode($action, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            }
            return $attributes;
        }

        private function mergeAttributes(...$records): array
        {
            $merged = [];
            foreach ($records as $record) {
                if (!is_array($record)) continue;
                foreach ($record as $key => $value) {
                    $merged[$key] = $value;
                }
            }
            return $merged;
        }

        private function hasTrustBoundary(array $record, array $options): bool
        {
            $values = $this->asArray($record['trustBoundary'] ?? ($record['trust'] ?? ($record['securityBoundary'] ?? null)));
            $values = array_merge($values, $this->asArray($options['trustBoundary'] ?? ($options['defaultTrustBoundary'] ?? null)));
            foreach ($values as $value) {
                if (is_array($value)) {
                    foreach ($value as $nested) {
                        if (isset($this->trustBoundaryTokens[(string) $nested])) return true;
                    }
                } elseif (isset($this->trustBoundaryTokens[(string) $value])) {
                    return true;
                }
            }
            return false;
        }

        private function isSafeUrl(string $value): bool
        {
            $compact = strtolower(preg_replace('/[\\x00-\\x1F\\x7F\\s]+/', '', trim($value)) ?? '');
            if ($compact === '' || str_starts_with($compact, '#') || str_starts_with($compact, '/') || str_starts_with($compact, './') || str_starts_with($compact, '../')) return true;
            if (str_starts_with($compact, 'http://') || str_starts_with($compact, 'https://') || str_starts_with($compact, 'mailto:') || str_starts_with($compact, 'tel:') || str_starts_with($compact, 'blob:')) return true;
            if (str_starts_with($compact, 'data:image/')) return true;
            return !preg_match('/^[a-z][a-z0-9+.-]*:/', $compact);
        }

        private function normalizeCspDirectiveValues($value): array
        {
            if ($value === null || $value === false) return [];
            if (is_array($value)) {
                $values = [];
                foreach ($value as $entry) {
                    $values = array_merge($values, $this->normalizeCspDirectiveValues($entry));
                }
                return array_values(array_filter($values, fn ($entry) => $entry !== ''));
            }
            return array_values(array_filter(preg_split('/\\s+/', trim((string) $value)) ?: [], fn ($entry) => $entry !== ''));
        }

        private function mergeCspDirectives(array ...$records): array
        {
            $directives = [];
            foreach ($records as $record) {
                foreach ($record as $name => $value) {
                    $directiveName = strtolower(trim((string) $name));
                    if ($directiveName === '') continue;
                    $values = $this->normalizeCspDirectiveValues($value);
                    if (!$values) {
                        $directives[$directiveName] = [];
                        continue;
                    }
                    $directives[$directiveName] = array_values(array_unique(array_merge($directives[$directiveName] ?? [], $values)));
                }
            }
            return $directives;
        }

        private function serializeCspDirectives(array $directives): string
        {
            $parts = [];
            foreach ($directives as $name => $values) {
                $directiveName = strtolower(trim((string) $name));
                if ($directiveName === '') continue;
                $normalizedValues = $this->normalizeCspDirectiveValues($values);
                $parts[] = $normalizedValues ? $directiveName . ' ' . implode(' ', $normalizedValues) : $directiveName;
            }
            return implode('; ', $parts);
        }

        private function createSsrCspPolicy(array $options): array
        {
            $headerPolicy = null;
            if (is_array($options['headers'] ?? null)) {
                foreach ($options['headers'] as $name => $value) {
                    if (strtolower((string) $name) === strtolower(RMT_SSR_CSP_HEADER)) {
                        $headerPolicy = $value;
                        break;
                    }
                }
            }
            $explicitPolicy = $options['contentSecurityPolicy'] ?? ($options['cspPolicy'] ?? ($options['csp'] ?? $headerPolicy));
            if (is_string($explicitPolicy) && trim($explicitPolicy) !== '') {
                return [
                    'schema' => RMT_SSR_CSP_POLICY_SCHEMA,
                    'mode' => 'host-supplied',
                    'header' => trim($explicitPolicy),
                    'directives' => [],
                    'managedBy' => RMT_PHP_SSR_ADAPTER_SCHEMA,
                    'automatic' => true,
                ];
            }
            $explicitDirectives = [];
            if (is_array($explicitPolicy)) {
                $explicitDirectives = is_array($explicitPolicy['directives'] ?? null) ? $explicitPolicy['directives'] : $explicitPolicy;
            }
            $directives = $this->mergeCspDirectives(
                $this->defaultCspDirectives,
                $explicitDirectives,
                is_array($options['cspDirectives'] ?? null) ? $options['cspDirectives'] : []
            );
            return [
                'schema' => RMT_SSR_CSP_POLICY_SCHEMA,
                'mode' => 'framework-default',
                'header' => $this->serializeCspDirectives($directives),
                'directives' => $directives,
                'managedBy' => RMT_PHP_SSR_ADAPTER_SCHEMA,
                'automatic' => true,
            ];
        }

        private function hasHeader(array $headers, string $headerName): bool
        {
            foreach (array_keys($headers) as $name) {
                if (strtolower((string) $name) === strtolower($headerName)) return true;
            }
            return false;
        }

        private function createSecurityHeaders(array $cspPolicy, array $headers = []): array
        {
            if (!$this->hasHeader($headers, RMT_SSR_CSP_HEADER)) {
                $headers[RMT_SSR_CSP_HEADER] = (string) ($cspPolicy['header'] ?? '');
            }
            return $headers;
        }

        private function collectPreloads(string $html): array
        {
            $preloads = [];
            if (preg_match_all('/data-rmt-lazy-import="([^"]+)"/', $html, $matches)) {
                foreach ($matches[1] as $href) {
                    $preloads[$href] = ['href' => $href, 'as' => 'script', 'rel' => 'modulepreload'];
                }
            }
            return array_values($preloads);
        }

        private function listLanes(?array $coreDocument): array
        {
            if (!$coreDocument) return [];
            return array_values(array_filter(array_map(function ($lane) {
                return $lane['id'] ?? ($lane['name'] ?? null);
            }, $coreDocument['lanes'] ?? [])));
        }

        private function jsonlFrame(int &$sequence, string $requestId, string $type, array $fields = []): string
        {
            $frame = [
                'schema' => RMT_PHP_SSR_JSONL_FRAME_SCHEMA,
                'type' => $type,
                'requestId' => $requestId,
                'sequence' => $sequence++,
                'operationId' => $fields['operationId'] ?? null,
                'variant' => $fields['variant'] ?? null,
                'capability' => $fields['capability'] ?? null,
                'lane' => $fields['lane'] ?? null,
                'chunkKey' => $fields['chunkKey'] ?? null,
                'payload' => $fields['payload'] ?? [],
                'diagnostics' => $fields['diagnostics'] ?? [],
            ];
            return json_encode($frame, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n";
        }

        private function diagnostic(string $code, string $message, string $severity = 'error', array $details = []): array
        {
            return array_replace([
                'schema' => RMT_PHP_SSR_DIAGNOSTIC_SCHEMA,
                'code' => $code,
                'severity' => $severity,
                'message' => $message,
            ], array_filter($details, function ($value) {
                return $value !== null;
            }));
        }

        private function isNonEmptyString($value): bool
        {
            return is_string($value) && trim($value) !== '';
        }

        private function validXScalerDiagnostics($value): bool
        {
            if (!is_array($value)) return false;
            foreach ($value as $diagnostic) {
                if (!is_array($diagnostic)
                    || !$this->isNonEmptyString($diagnostic['code'] ?? null)
                    || !$this->isNonEmptyString($diagnostic['severity'] ?? null)
                    || !$this->isNonEmptyString($diagnostic['message'] ?? null)) return false;
            }
            return true;
        }

        private function validXScalerRemoteSurfacePlan(array $plan, array $response): bool
        {
            $ssr = isset($plan['ssr']) && is_array($plan['ssr']) ? $plan['ssr'] : [];
            $boundary = isset($plan['runtimeBoundary']) && is_array($plan['runtimeBoundary']) ? $plan['runtimeBoundary'] : [];
            $integrity = isset($plan['integrity']) && is_array($plan['integrity']) ? $plan['integrity'] : [];
            $algorithm = $integrity['algorithm'] ?? null;
            $lanes = $plan['lanes'] ?? null;
            $validLanes = is_array($lanes) && count($lanes) > 0;
            if ($validLanes) {
                foreach ($lanes as $lane) {
                    if (!is_array($lane)
                        || !$this->isNonEmptyString($lane['lane'] ?? null)
                        || !$this->isNonEmptyString($lane['target'] ?? null)) {
                        $validLanes = false;
                        break;
                    }
                }
            }
            return ($plan['schema'] ?? null) === RMT_XSCALER_REMOTE_SURFACE_PLAN_SCHEMA
                && ($plan['protocol'] ?? null) === RMT_XSCALER_PROTOCOL
                && $this->isNonEmptyString($plan['surface'] ?? null)
                && ($plan['surface'] ?? null) === ($response['surface'] ?? null)
                && $this->isNonEmptyString($plan['surfaceId'] ?? null)
                && strpos($plan['surfaceId'], 'remoteSurface:') === 0
                && $this->isNonEmptyString($plan['owner'] ?? null)
                && $this->isNonEmptyString($plan['origin'] ?? null)
                && strpos($plan['origin'], 'https://') === 0
                && in_array($algorithm, ['sha256', 'sha384', 'sha512'], true)
                && $this->isNonEmptyString($integrity['digest'] ?? null)
                && strpos($integrity['digest'], $algorithm . '-') === 0
                && $this->isNonEmptyString($plan['fallbackSurface'] ?? null)
                && $validLanes
                && $this->isNonEmptyString($ssr['mode'] ?? null)
                && ($ssr['networkDuringRender'] ?? null) === false
                && ($boundary['remoteRuntimeExecution'] ?? null) === false
                && ($boundary['kernelRemoteExecution'] ?? null) === false
                && ($boundary['networkRequiredByKernel'] ?? null) === false;
        }

        private function validXScalerAtc(array $atc, array $response, array $plan): bool
        {
            $boundary = isset($atc['runtimeBoundary']) && is_array($atc['runtimeBoundary']) ? $atc['runtimeBoundary'] : [];
            $expectedSurfaceId = $plan['surfaceId'] ?? ('remoteSurface:' . ($response['surface'] ?? ''));
            $accepted = $response['accepted'] ?? null;
            return ($atc['schema'] ?? null) === RMT_XSCALER_ATC_HANDOFF_SCHEMA
                && ($atc['protocol'] ?? null) === RMT_XSCALER_PROTOCOL
                && ($atc['surfaceId'] ?? null) === $expectedSurfaceId
                && $this->isNonEmptyString($atc['sessionId'] ?? null)
                && $this->isNonEmptyString($atc['handoffSignal'] ?? null)
                && $this->isNonEmptyString($atc['lifecycleState'] ?? null)
                && is_bool($atc['accepted'] ?? null)
                && ($atc['ok'] ?? null) === $atc['accepted']
                && ($atc['accepted'] ?? null) === $accepted
                && $this->isNonEmptyString($atc['status'] ?? null)
                && ($accepted === true ? $atc['status'] !== 'refused' : $atc['status'] === 'refused')
                && array_key_exists('fallback', $atc)
                && ($boundary['remoteRuntimeExecution'] ?? null) === false
                && ($boundary['kernelRemoteExecution'] ?? null) === false
                && ($boundary['networkRequiredByHandoff'] ?? null) === false
                && $this->validXScalerDiagnostics($atc['diagnostics'] ?? null);
        }

        private function validXScalerPreflightResponse(array $response): bool
        {
            $planPresent = array_key_exists('remoteSurfacePlan', $response) && $response['remoteSurfacePlan'] !== null;
            $atcPresent = array_key_exists('atc', $response) && $response['atc'] !== null;
            $plan = $planPresent && is_array($response['remoteSurfacePlan']) ? $response['remoteSurfacePlan'] : [];
            $atc = $atcPresent && is_array($response['atc']) ? $response['atc'] : [];
            $compatibility = isset($response['compatibility']) && is_array($response['compatibility']) ? $response['compatibility'] : [];
            $anchors = $response['requiredAnchors'] ?? null;
            $validAnchors = is_array($anchors);
            if ($validAnchors) {
                foreach ($anchors as $anchor) {
                    if (!$this->isNonEmptyString($anchor)) {
                        $validAnchors = false;
                        break;
                    }
                }
            }
            if ($validAnchors) $validAnchors = count(array_unique($anchors, SORT_STRING)) === count($anchors);
            $requiredKeys = ['schema', 'protocol', 'requestId', 'accepted', 'ok', 'surface', 'compatibility', 'requiredAnchors', 'remoteSurfacePlan', 'atc', 'rejection', 'diagnostics'];
            $hasRequiredKeys = true;
            foreach ($requiredKeys as $requiredKey) {
                if (!array_key_exists($requiredKey, $response)) {
                    $hasRequiredKeys = false;
                    break;
                }
            }
            $commonValid = $hasRequiredKeys
                && ($response['schema'] ?? null) === RMT_XSCALER_PREFLIGHT_RESPONSE_SCHEMA
                && ($response['protocol'] ?? null) === RMT_XSCALER_PROTOCOL
                && $this->isNonEmptyString($response['requestId'] ?? null)
                && is_bool($response['accepted'] ?? null)
                && ($response['ok'] ?? null) === $response['accepted']
                && $this->isNonEmptyString($response['surface'] ?? null)
                && $this->isNonEmptyString($compatibility['ssr'] ?? null)
                && $this->isNonEmptyString($compatibility['remoteSurfacePlan'] ?? null)
                && $this->isNonEmptyString($compatibility['xtensionDeployment'] ?? null)
                && $validAnchors
                && $this->validXScalerDiagnostics($response['diagnostics'] ?? null);
            if (!$commonValid
                || ($planPresent && (!is_array($response['remoteSurfacePlan']) || !$this->validXScalerRemoteSurfacePlan($plan, $response)))
                || ($atcPresent && (!is_array($response['atc']) || !$this->validXScalerAtc($atc, $response, $plan)))) return false;
            if ($response['accepted'] === true) {
                return $planPresent
                    && $atcPresent
                    && array_key_exists('rejection', $response)
                    && $response['rejection'] === null
                    && $compatibility['ssr'] === 'compatible'
                    && $compatibility['remoteSurfacePlan'] === 'required'
                    && $compatibility['xtensionDeployment'] === 'allowed';
            }
            $rejection = isset($response['rejection']) && is_array($response['rejection']) ? $response['rejection'] : [];
            return $this->isNonEmptyString($rejection['code'] ?? null)
                && $this->isNonEmptyString($rejection['message'] ?? null)
                && $compatibility['ssr'] === 'blocked'
                && $compatibility['remoteSurfacePlan'] === 'blocked'
                && $compatibility['xtensionDeployment'] === 'blocked';
        }

        private function createXScalerSsrHydration(array $options, array &$diagnostics): array
        {
            $configured = array_key_exists('xscalerPreflights', $options)
                ? $options['xscalerPreflights']
                : ($options['xscalerPreflight'] ?? []);
            $responses = $this->asArray($configured);
            $preflights = [];
            foreach ($responses as $index => $entry) {
                $response = is_array($entry) && isset($entry['response']) && is_array($entry['response'])
                    ? $entry['response']
                    : (is_array($entry) ? $entry : []);
                $plan = isset($response['remoteSurfacePlan']) && is_array($response['remoteSurfacePlan'])
                    ? $response['remoteSurfacePlan']
                    : [];
                $atc = isset($response['atc']) && is_array($response['atc']) ? $response['atc'] : [];
                if (!$this->validXScalerPreflightResponse($response)) {
                    $diagnostics[] = $this->diagnostic(
                        'rmt.php_ssr.xscaler_preflight_invalid',
                        'PHP SSR accepts only a validated XScaler preflight response with no-network/no-remote-execution boundaries.',
                        'error',
                        ['index' => $index]
                    );
                    continue;
                }
                $preflights[] = [
                    'schema' => $response['schema'],
                    'requestId' => $response['requestId'] ?? null,
                    'accepted' => $response['accepted'],
                    'ok' => $response['ok'],
                    'status' => $response['accepted'] ? 'accepted' : 'rejected',
                    'compatibility' => $response['compatibility'] ?? null,
                    'remoteSurfacePlan' => $response['remoteSurfacePlan'] ?? null,
                    'atc' => $response['atc'] ?? null,
                    'rejection' => $response['rejection'] ?? null,
                ];
            }
            return [
                'schema' => RMT_XSCALER_SSR_HYDRATION_SCHEMA,
                'mode' => 'preflight-only',
                'networkDuringRender' => false,
                'remoteModuleExecuted' => false,
                'count' => count($preflights),
                'preflights' => $preflights,
            ];
        }

        private function hasBlockingDiagnostics(array $diagnostics): bool
        {
            foreach ($diagnostics as $diagnostic) {
                if (in_array($diagnostic['severity'] ?? '', ['error', 'fatal'], true)) return true;
            }
            return false;
        }

        private function firstDiagnosticCode(array $diagnostics): ?string
        {
            foreach ($diagnostics as $diagnostic) {
                if (isset($diagnostic['code'])) return (string) $diagnostic['code'];
            }
            return null;
        }

        private function isCoreDocument($value): bool
        {
            return is_array($value) && (($value['schema'] ?? null) === 'xtend.rmt.core-format.vnext.v1' || (isset($value['surfaces']) && isset($value['operations'])));
        }

        private function isRenderResult($value): bool
        {
            return is_array($value) && (($value['schema'] ?? null) === RMT_PHP_SSR_RENDER_RESULT_SCHEMA) && array_key_exists('html', $value);
        }

        private function asArray($value): array
        {
            if (is_array($value)) return $this->isList($value) ? $value : [$value];
            if ($value === null || $value === false) return [];
            return [$value];
        }

        private function isList(array $value): bool
        {
            return $value === [] || array_keys($value) === range(0, count($value) - 1);
        }

        private function safeIdentifier($value, string $fallback = 'rmt-php-ssr'): string
        {
            $normalized = preg_replace('/[^a-zA-Z0-9_.:-]+/', '-', trim((string) $value)) ?? '';
            $normalized = trim($normalized, '-');
            return $normalized !== '' ? $normalized : $fallback;
        }

        private function escapeHtml(string $value): string
        {
            return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        }

        private function escapeAttribute(string $value): string
        {
            return str_replace('`', '&#96;', $this->escapeHtml($value));
        }
    }
}

if (!function_exists('createRmtPhpSsrAdapter')) {
    function createRmtPhpSsrAdapter(array $options = []): RmtPhpSsrAdapter
    {
        return new RmtPhpSsrAdapter($options);
    }
}
