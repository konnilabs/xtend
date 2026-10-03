<?php
declare(strict_types=1);

/** Data-only fragments; execution stays with the host's AppService adapter. */
final class XScalerPhpFragmentAdapter {
    public function __construct(private array $targets, private array $options = []) {
        foreach ($targets as $target) {
            if (!is_string($target) || !preg_match('/^[A-Za-z_][A-Za-z0-9_.-]*$/', $target)
                || array_intersect(explode('.', $target), ['__proto__', 'constructor', 'prototype'])) {
                throw new InvalidArgumentException('Invalid remote state target.');
            }
        }
        if (!$targets) throw new InvalidArgumentException('A remote surface requires declared state targets.');
    }

    private function report(Throwable $error, array $context): void {
        try { if (isset($this->options['onError'])) ($this->options['onError'])($error, $context); }
        catch (Throwable $observerError) { error_log('XScaler fragment error observer failed: '.get_class($observerError)); }
    }

    public function stream(callable $source, array $context = []): Generator {
        $clock = $this->options['clock'] ?? static fn() => microtime(true);
        $deadline = $clock() + min(30, max(0.001, (float) ($this->options['timeoutSeconds'] ?? 30)));
        $context['deadline'] = $deadline;
        $terminal = ['type' => 'complete'];
        $failed = static fn() => ['type' => 'error', 'error' => ['code' => 'xscaler.fragment.failed', 'message' => 'Remote surface streaming failed.']];
        try {
            foreach ($source($context) as $frame) {
                if (($context['isCancelled'] ?? static fn() => connection_aborted())()) {
                    $terminal = ['type' => 'cancelled']; break;
                }
                if ($clock() >= $deadline) throw new RuntimeException('Remote fragment deadline exceeded.');
                if (!is_array($frame)) throw new InvalidArgumentException('A fragment must be a record.');
                $type = $frame['type'] ?? 'delta';
                if ($type === 'delta') {
                    $value = $frame['value'] ?? null;
                    if (!is_array($value) || !in_array($value['target'] ?? null, $this->targets, true)
                        || !is_array($value['value'] ?? null) || array_diff(array_keys($value), ['target', 'value'])) {
                        throw new InvalidArgumentException('Remote fragment crossed its declared state boundary.');
                    }
                    json_encode($value, JSON_THROW_ON_ERROR);
                    yield ['type' => 'delta', 'value' => $value];
                } elseif (in_array($type, ['complete', 'error', 'cancelled'], true)) {
                    $terminal = $type === 'error' ? $failed() : ['type' => $type]; break;
                } else throw new InvalidArgumentException('Unsupported remote fragment operation.');
            }
        } catch (Throwable $error) {
            $this->report($error, $context);
            $terminal = $failed();
        } finally {
            // PHP callbacks cooperate with the deadline. The process/HTTP host
            // must additionally bound blocking I/O and request execution.
            try {
                $cleanupDeadline = $clock() + 5;
                if (isset($this->options['cleanup'])) ($this->options['cleanup'])(array_replace($context, ['deadline' => $cleanupDeadline]));
                if ($clock() > $cleanupDeadline) throw new RuntimeException('Remote fragment cleanup exceeded its deadline.');
            } catch (Throwable $error) {
                $this->report($error, array_replace($context, ['phase' => 'cleanup']));
                $terminal = $failed();
            }
        }
        // Cleanup failures cannot follow an already published successful terminal.
        yield $terminal;
    }
}
