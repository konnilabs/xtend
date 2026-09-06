<?php
declare(strict_types=1);
namespace Ccslabs\XTend\Data;

final class PageView {
    public static function head(array $layout, array $page): array {
        $records = [];
        foreach (array_merge($layout, $page) as $record) {
            $key = ($record['tag'] ?? '') === 'title' ? 'title' : (($record['tag'] ?? '') === 'meta' ? 'meta:' . ($record['attributes']['name'] ?? $record['attributes']['property'] ?? $record['attributes']['charset'] ?? '') : '');
            if (($record['tag'] ?? '') === 'meta' && array_diff(array_keys($record['attributes'] ?? []), ['name','property','content','charset'])) throw new \InvalidArgumentException('Unsafe meta attributes.');
            if (($record['tag'] ?? '') === 'link' && ($record['attributes']['rel'] ?? '') === 'canonical' && preg_match('#^https?://#i', $record['attributes']['href'] ?? '') && !array_diff(array_keys($record['attributes']), ['rel','href'])) $key = 'link:canonical';
            if (($record['tag'] ?? '') === 'json-ld' && is_string($record['key'] ?? null) && $record['key'] !== '' && (is_array($record['data'] ?? null) || is_object($record['data'] ?? null))) { Prop::assertKey($record['key']); json_encode($record['data'], JSON_THROW_ON_ERROR); $key = 'json-ld:' . $record['key']; }
            if ($key === '' || $key === 'meta:') throw new \InvalidArgumentException('Invalid page head record.');
            $records[$key] = $record;
        }
        return array_values($records);
    }
    public static function renderHead(array $head, string $nonce = ''): string {
        $escape = fn($value) => htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $html = '';
        foreach (self::head([], $head) as $record) {
            $tag = $record['tag'];
            if ($tag === 'title') { $html .= '<title>'.$escape($record['text'] ?? '').'</title>'; continue; }
            if ($tag === 'json-ld') { $html .= '<script data-xtend-page-head type="application/ld+json" nonce="'.$escape($nonce).'">'.json_encode($record['data'], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR).'</script>'; continue; }
            $html .= '<'.$tag.' data-xtend-page-head';
            foreach ($record['attributes'] ?? [] as $key => $value) $html .= ' '.$key.'="'.$escape($value).'"';
            $html .= '>';
        }
        return $html;
    }
    public static function compose(?array $layout, array $page): array {
        if (!$layout) return $page;
        $count = 0;
        $visit = function($node) use (&$visit, &$count, $page) {
            if (!is_array($node)) return $node;
            if (array_is_list($node)) return array_map($visit, $node);
            if (($node['pageOutlet'] ?? false) === true) { $count++; return ['type'=>'element','tag'=>'div','attributes'=>['data-xtend-page-slot'=>'true'],'children'=>[$page]]; }
            foreach (['children','nodes'] as $key) if (isset($node[$key])) $node[$key] = $visit($node[$key]);
            foreach ($node['slots'] ?? [] as $key => $value) $node['slots'][$key] = $visit($value);
            return $node;
        };
        $descriptor = $visit($layout);
        if ($count !== 1) throw new \InvalidArgumentException('A page layout must declare exactly one pageOutlet.');
        return $descriptor;
    }
}

final class Prop {
    public static function assertKey(string $key): string {
        if ($key === '' || array_intersect(explode('.', $key), ['__proto__', 'prototype', 'constructor'])) throw new \InvalidArgumentException('Unsafe page data key.');
        return $key;
    }
    private function __construct(public string $kind, public mixed $resolve, public array $options = []) {}
    public static function lazy(callable $resolve): self { return new self('lazy', $resolve); }
    public static function defer(callable $resolve, string $group = 'default'): self { return new self('defer', $resolve, ['group' => $group]); }
    public static function merge(mixed $resolve, array $options = []): self { return new self('merge', $resolve, array_replace(['mode' => 'append'], $options)); }
    public static function once(mixed $resolve, array $options = []): self { return new self('once', $resolve, array_replace(['ttl' => 60000], $options)); }
    public static function resolveAll(array $input, array $context, array $selection): array {
        $props = []; $deferred = []; $merge = []; $once = [];
        foreach ($input as $key => $value) {
            self::assertKey((string)$key);
            $record = $value instanceof self ? $value : new self('value', $value);
            $group = self::assertKey($record->options['group'] ?? 'default');
            if ($record->kind === 'defer' && !in_array($group, $selection['deferred'] ?? [], true)) { $deferred[$group][] = $key; continue; }
            if (isset($selection['deferred']) && !($record->kind === 'defer' && in_array($group, $selection['deferred'], true))) continue;
            if (isset($selection['only']) && !in_array($key, $selection['only'], true)) continue;
            if ($record->kind === 'lazy' && !in_array($key, $selection['only'] ?? [], true)) continue;
            if ($record->kind === 'once') {
                $token = self::assertKey($record->options['key'] ?? $key);
                if (!is_int($record->options['ttl']) || $record->options['ttl'] < 1) throw new \InvalidArgumentException('Once data requires a positive integer TTL.');
                $once[$key] = ['key' => $token, 'ttl' => $record->options['ttl']];
                if (in_array($token, $selection['once'] ?? [], true)) continue;
            }
            $evaluate = $record->kind === 'value' ? $record->resolve instanceof \Closure : is_callable($record->resolve);
            $props[$key] = $evaluate ? ($record->resolve)($context) : $record->resolve;
            if ($props[$key] instanceof \Illuminate\Contracts\Support\Arrayable) $props[$key] = $props[$key]->toArray();
            if ($record->kind === 'merge') {
                if (!in_array($record->options['mode'], ['replace', 'append', 'prepend'], true)) throw new \InvalidArgumentException('Invalid merge mode.');
                $merge[$key] = ['mode' => $record->options['mode'], 'key' => $record->options['key'] ?? null];
            }
        }
        return ['props' => (object)$props, 'deferred' => (object)$deferred, 'merge' => (object)$merge, 'once' => (object)$once];
    }
}
