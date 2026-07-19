<?php
declare(strict_types=1);

$GLOBALS['xtendRmtPhpAppServiceFixtureCleanup'] = [];

$recordCleanup = static function (string $serviceId, string $phase): void {
    $key = $serviceId . ':' . $phase;
    $GLOBALS['xtendRmtPhpAppServiceFixtureCleanup'][$key]
        = ($GLOBALS['xtendRmtPhpAppServiceFixtureCleanup'][$key] ?? 0) + 1;
};

return [
    'fixture.invoke' => static function ($input, array $context) use ($recordCleanup): array {
        $context['defer'](static function () use ($recordCleanup): void {
            $recordCleanup('fixture.invoke', 'deferred');
        });
        return [
            'accepted' => true,
            'input' => $input,
            'serviceId' => $context['serviceId'],
            'invocationId' => $context['invocationId'],
            'correlationId' => $context['correlationId'],
        ];
    },
    'fixture.fail' => [
        'invoke' => static function ($input, array $context) use ($recordCleanup): void {
            $context['defer'](static function () use ($recordCleanup): void {
                $recordCleanup('fixture.fail', 'deferred');
            });
            throw new RuntimeException('database password=top-secret invoke failure');
        },
        'cleanup' => static function () use ($recordCleanup): void {
            $recordCleanup('fixture.fail', 'registry');
            throw new RuntimeException('cleanup password=top-secret failure');
        },
    ],
    'fixture.stream' => [
        'stream' => static function ($input, array $context) use ($recordCleanup): Generator {
            $context['defer'](static function () use ($recordCleanup): void {
                $recordCleanup('fixture.stream', 'deferred');
            });
            yield ['id' => 'fixture-delta-1', 'sequence' => 7, 'type' => 'delta', 'value' => ['index' => 1]];
            yield ['id' => 'fixture-delta-1', 'sequence' => 8, 'type' => 'delta', 'value' => ['index' => 999]];
            yield ['id' => 'fixture-delta-2', 'sequence' => 7, 'type' => 'delta', 'value' => ['index' => 998]];
            yield ['id' => 'fixture-delta-2', 'sequence' => 9, 'type' => 'delta', 'value' => ['index' => 2]];
            yield ['id' => 'fixture-tool-call', 'sequence' => 10, 'type' => 'tool-call', 'toolCall' => ['name' => 'lookup', 'arguments' => ['id' => 7]]];
            yield ['id' => 'fixture-tool-result', 'sequence' => 11, 'type' => 'tool-result', 'toolResult' => ['ok' => true, 'value' => 'Ada']];
            yield ['id' => 'fixture-late-sequence', 'sequence' => 10, 'type' => 'delta', 'value' => ['index' => 997]];
            yield ['type' => 'complete', 'value' => ['count' => 2, 'input' => $input]];
            yield ['type' => 'error', 'error' => ['message' => 'must never be emitted']];
        },
        'cleanup' => static function () use ($recordCleanup): void {
            $recordCleanup('fixture.stream', 'registry');
        },
    ],
    'fixture.stream.fail' => static function ($input, array $context) use ($recordCleanup): Generator {
        $context['defer'](static function () use ($recordCleanup): void {
            $recordCleanup('fixture.stream.fail', 'deferred');
        });
        yield ['type' => 'delta', 'value' => ['visible' => true]];
        throw new RuntimeException('token=top-secret stream failure');
    },
    'fixture.stream.cancel' => static function ($input, array $context) use ($recordCleanup): Generator {
        $context['defer'](static function () use ($recordCleanup): void {
            $recordCleanup('fixture.stream.cancel', 'deferred');
        });
        yield ['type' => 'delta', 'value' => ['index' => 1]];
        yield ['type' => 'cancelled', 'value' => 'fixture-cancelled'];
        yield ['type' => 'complete', 'value' => 'must-never-be-emitted'];
    },
];
