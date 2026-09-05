<?php
declare(strict_types=1);

/** Executes compiler descriptor data. It never parses RMT or executes application code. */
final class RmtPortableRender
{
    public const SCHEMA = 'xtend.rmt.portable-render.v1';
    /** Keep JSON objects distinct from lists inside literals and state defaults. */
    public static function decodeJson(string $json): array {
        $convert = function($value) use (&$convert) {
            if (is_array($value)) return array_map($convert,$value);
            if (!is_object($value)) return $value;
            $record = (array)$value; $literal = in_array($record['op'] ?? $record['operator'] ?? $record['format'] ?? '', ['literal','const','static'],true);
            foreach ($record as $key=>$entry) {
                if ($key === 'defaults') $record[$key] = (array)$entry;
                elseif ($key === 'initial' || $literal && in_array($key,['value','source'],true)) $record[$key] = $entry;
                else $record[$key] = $convert($entry);
            }
            return $record;
        };
        return $convert(json_decode($json,false,512,JSON_THROW_ON_ERROR));
    }
    private static function missing(): object { static $missing; return $missing ??= new stdClass(); }
    private static function same($a, $b): bool {
        if (is_array($a) || is_array($b)) throw new InvalidArgumentException('PHP portable equality requires scalar values; compare a declared identity field for records and lists.');
        return (is_int($a) || is_float($a)) && (is_int($b) || is_float($b)) ? $a == $b : $a === $b;
    }
    private static function number($value): float {
        if ($value === self::missing()) return NAN;
        if ($value === null || $value === false) return 0;
        if ($value === true) return 1;
        if (is_array($value)) $value = self::text($value);
        if (is_object($value)) return NAN;
        if (is_string($value) && trim($value) === '') return 0;
        return is_numeric($value) ? (float)$value : NAN;
    }
    private static function compare($left, $right, string $op, array $options = []): bool {
        if (($right === '' || $right === null || $right === self::missing()) && ($options['empty'] ?? '') === 'pass') return true;
        if (in_array($op, ['equals','eq','not-equals','neq'],true)) return in_array($op,['not-equals','neq'],true) ? !self::same($left,$right) : self::same($left,$right);
        if ($op === 'truthy') return self::truth($left);
        if ($op === 'falsy') return !self::truth($left);
        if (in_array($op,['gt','gte','lt','lte'],true)) {
            $a=self::number($left); $b=self::number($right);
            return match($op) {'gt'=>$a>$b,'gte'=>$a>=$b,'lt'=>$a<$b,'lte'=>$a<=$b};
        }
        if ($op === 'in') return is_array($right) && count(array_filter($right,fn($entry)=>self::same($left,$entry))) > 0;
        if (in_array($op,['contains','includes'],true)) {
            if (is_array($left)) return count(array_filter($left,fn($entry)=>self::same($entry,$right))) > 0;
            $a=self::text($left); $b=self::text($right);
            if ($options['ignoreCase'] ?? false) {
                if (!function_exists('mb_strtolower') && preg_match('/[^\x00-\x7f]/', $a.$b)) throw new InvalidArgumentException('Unicode case folding requires PHP mbstring.');
                $lower = function_exists('mb_strtolower') ? 'mb_strtolower' : 'strtolower'; $a=$lower($a); $b=$lower($b);
            }
            return str_contains($a,$b);
        }
        return self::same($left,$right);
    }
    private static function text($value): string {
        if ($value === self::missing()) return '';
        if ($value === null) return '';
        if ($value === true) return 'true';
        if ($value === false) return 'false';
        if (is_float($value) && is_nan($value)) return 'NaN';
        if (is_array($value)) return array_is_list($value) ? implode(',', array_map([self::class, 'text'], $value)) : '[object Object]';
        if (is_object($value)) return '[object Object]';
        return (string) $value;
    }
    private static function truth($value): bool { return $value !== self::missing() && (is_array($value) || is_object($value) || !($value === null || $value === false || $value === '' || $value === 0 || $value === 0.0)); }
    private static function path($value, string $path, &$found) {
        $parts = explode('.', $path);
        foreach ($parts as $part) if (in_array($part, ['__proto__', 'prototype', 'constructor'], true)) throw new InvalidArgumentException('Unsafe model path.');
        if (is_array($value) && array_key_exists($path, $value)) { $found = true; return $value[$path]; }
        if (is_array($value)) {
            $owners = array_filter(array_keys($value), fn($key) => str_starts_with($path, $key . '.'));
            usort($owners, fn($a, $b) => strlen((string)$b) <=> strlen((string)$a));
            if ($owners) { $owner = $owners[0]; return self::path($value[$owner], substr($path, strlen($owner) + 1), $found); }
        }
        foreach ($parts as $part) {
            if ($part === 'length' && (is_array($value) || is_string($value))) { $value = is_array($value) ? count($value) : strlen(iconv('UTF-8', 'UTF-16LE', $value)) / 2; continue; }
            if (is_object($value)) $value = (array) $value;
            if (!is_array($value) || !array_key_exists($part, $value)) { $found = false; return null; }
            $value = $value[$part];
        }
        $found = true; return $value;
    }
    public static function value($value, array $model, $item = null) {
        if (is_object($value)) $value = (array) $value;
        if (is_array($value)) {
            if (array_is_list($value)) return array_map(fn($v) => self::value($v, $model, $item), $value);
            $op = $value['op'] ?? $value['operator'] ?? $value['kind'] ?? $value['format'] ?? '';
            $v = fn($v) => self::value($v, $model, $item);
            $hasSource = array_key_exists('value',$value) || array_key_exists('from',$value) || array_key_exists('source',$value);
            $source = $hasSource ? $v(array_key_exists('value', $value) ? $value['value'] : (array_key_exists('from', $value) ? $value['from'] : $value['source'])) : (isset($value['path']) ? self::reference($value['path'],$model,$item,$found) : self::missing());
            $right = array_key_exists('right',$value) ? $v($value['right']) : (array_key_exists('value',$value) ? $v($value['value']) : self::missing());
            $left = array_key_exists('left', $value) ? $v($value['left']) : $source;
            $result = match ($op) {
                'literal', 'const', 'static' => array_key_exists('value', $value) ? $value['value'] : ($value['source'] ?? null),
                '', 'path' => isset($value['path']) ? self::reference($value['path'], $model, $item, $found) : $source,
                'fallback' => $source,
                'truthy' => self::truth($source),
                'falsy', 'not' => !self::truth($source),
                'equals', 'eq', 'not-equals', 'neq' => self::compare($left, $right, $op, $value),
                'if', 'ternary' => $v(self::truth($v($value['test'] ?? $value['when'] ?? $value['condition'] ?? null)) ? ($value['then'] ?? null) : ($value['else'] ?? $value['fallback'] ?? null)),
                'slice' => self::sliceValue($source, (int)$v($value['start'] ?? 0), isset($value['end']) ? (int)$v($value['end']) : null),
                'countBy', 'count-by' => self::countBy($source, $value, $model),
                'formatDuration', 'duration' => self::duration($source),
                'formatBytes', 'bytes' => self::bytes($source),
                'concat', 'interpolate' => implode($value['separator'] ?? '', array_map(fn($x) => self::text($v($x)), $value['values'] ?? $value['parts'] ?? (is_array($source) ? $source : [$source]))),
                'contains', 'includes' => self::compare($source, $v(($value['search'] ?? null) ?: (($value['item'] ?? null) ?: ($value['right'] ?? null))), 'contains', $value),
                'map' => is_array($source) ? array_map(fn($entry) => isset($value['path']) ? self::path($entry, $value['path'], $found) : self::value($value['expression'] ?? '$item', $model, $entry), $source) : [],
                'filter' => is_array($source) ? array_values(array_filter($source, function($entry) use ($value, $model) {
                    $rules = $value['where'] ?? $value['filter'] ?? $value['rules'] ?? [];
                    if (!is_array($rules) || !array_is_list($rules)) $rules = [$rules];
                    foreach ($rules as $rule) {
                        if (is_string($rule)) { if (!self::truth(self::value($rule, $model, $entry))) return false; continue; }
                        $left = isset($rule['left']) ? self::value($rule['left'], $model, $entry) : self::path($entry, $rule['path'] ?? $rule['field'] ?? '', $found);
                        $right = self::value(array_key_exists('right',$rule) ? $rule['right'] : ($rule['value'] ?? null), $model, $entry);
                        $pass = self::compare($left,$right,$rule['op'] ?? $rule['operator'] ?? 'equals',$rule);
                        if (!$pass) return false;
                    }
                    return true;
                })) : [],
                'reduce' => ($value['mode'] ?? '') === 'sum' ? array_sum(array_map(fn($entry) => self::number(isset($value['path']) ? self::path($entry, $value['path'], $found) : $entry), is_array($source) ? $source : [])) : (is_string($source) ? strlen(iconv('UTF-8', 'UTF-16LE', $source)) / 2 : (is_array($source) || is_object($source) ? count((array)$source) : 0)),
                default => throw new InvalidArgumentException('Unsupported portable expression: ' . $op)
            };
            return ($result === null || $result === self::missing() || $result === '') && array_key_exists('fallback', $value) ? $v($value['fallback']) : $result;
        }
        if (!is_string($value)) return $value;
        if (str_contains($value, '${')) return preg_replace_callback('/\$\{([^}]+)\}/u', fn($m) => self::text(self::value(str_starts_with(trim($m[1]), '$') ? trim($m[1]) : '$' . trim($m[1]), $model, $item)), $value);
        $result = self::reference($value, $model, $item, $found);
        return $found ? $result : $value;
    }
    private static function reference(string $value, array $model, $item, &$found) {
        if ($value === '$item') { $found = true; return $item; }
        $source = $model; $path = $value;
        if (str_starts_with($path, '$item.')) { $source = $item; $path = substr($path, 6); }
        elseif (str_starts_with($path, '$model.') || str_starts_with($path, '$state.')) $path = substr($path, 7);
        elseif (str_starts_with($path, '$selector.') || str_starts_with($path, '$derive.')) $path = substr($path, 1);
        $result = self::path($source, $path, $found);
        return $found ? $result : self::missing();
    }
    private static function sliceValue($source, int $start, ?int $end) {
        if (!is_array($source) && !is_string($source)) return [];
        $array = is_array($source); $value = $array ? $source : str_split(iconv('UTF-8', 'UTF-16LE', $source), 2); $length = count($value);
        $start = $start < 0 ? max(0, $length + $start) : min($length, $start);
        $end = $end === null ? $length : ($end < 0 ? max(0, $length + $end) : min($length, $end));
        $result = array_slice($value, $start, max(0, $end - $start));
        if ($array) return $result;
        $decoded = iconv('UTF-16LE', 'UTF-8', implode('', $result));
        if ($decoded === false) throw new InvalidArgumentException('Portable string slicing must preserve Unicode scalar values.');
        return $decoded;
    }
    private static function countBy($source, array $record, array $model): object {
        $result = [];
        foreach (is_array($source) ? $source : [] as $entry) {
            $value = isset($record['path']) ? self::path($entry, $record['path'], $found) : self::value($record['key'] ?? '$item', $model, $entry);
            $key = trim(self::text($value)); if ($key === '') $key = 'unknown';
            if (in_array($key, ['__proto__', 'prototype', 'constructor'], true)) throw new InvalidArgumentException('Unsafe count key.');
            $result[$key] = ($result[$key] ?? 0) + 1;
        }
        return (object)$result;
    }
    private static function duration($source): string {
        $number=self::number($source); $total = max(0, (int)floor(is_finite($number) ? $number : 0)); $hours = intdiv($total, 3600); $minutes = intdiv($total % 3600, 60); $seconds = $total % 60;
        return $hours ? sprintf('%d:%02d:%02d', $hours, $minutes, $seconds) : sprintf('%d:%02d', $minutes, $seconds);
    }
    private static function bytes($source): string {
        $bytes = self::number($source); if (!is_finite($bytes)) return ''; if ($bytes == 0) return '0 B';
        $index = min((int)floor(log(abs($bytes), 1024)), 4); $amount = $bytes / pow(1024, $index);
        return number_format($amount, $index === 0 || abs($amount) >= 10 ? 0 : 1, '.', '') . ' ' . (['B','KB','MB','GB','TB'][$index] ?? 'undefined');
    }
    private static function projectState(array $model, array $config): array {
        $states = $model; $selectors = []; $derived = [];
        foreach (['selectors' => &$selectors, 'derive' => &$derived] as $kind => &$records) foreach ($config[$kind] ?? ($kind === 'derive' ? ($config['derived'] ?? []) : []) as $record) {
            $from = $record['from'] ?? ''; $source = $states;
            foreach (['state.' => $states, 'selector.' => $selectors, 'derive.' => $derived] as $prefix => $candidate) if (str_starts_with($from, $prefix)) { $from = substr($from, strlen($prefix)); $source = $candidate; break; }
            $value = self::path($source, $from, $found);
            if (isset($record['path'])) $value = self::path($value, $record['path'], $found);
            $context = $model; foreach ($states as $key => $entry) $context['state.' . $key] = $entry;
            foreach ($selectors as $key => $entry) $context['selector.' . $key] = $entry;
            foreach ($derived as $key => $entry) $context['derive.' . $key] = $entry;
            if ($record['where'] ?? $record['filter'] ?? null) $value = self::value(['op' => 'filter', 'value' => ['op' => 'literal', 'value' => $value], 'where' => $record['where'] ?? $record['filter']], $context);
            if (isset($record['slice'])) $value = self::sliceValue($value, (int)self::value($record['slice']['start'] ?? 0, $context), isset($record['slice']['end']) ? (int)self::value($record['slice']['end'], $context) : null);
            if (isset($record['map'])) { $map = is_string($record['map']) ? ['path' => $record['map']] : $record['map']; $value = self::value(array_replace($map, ['op' => 'map', 'value' => ['op' => 'literal', 'value' => $value]]), $context); }
            $count = is_array($value) || is_object($value) ? count((array)$value) : (is_string($value) ? strlen(iconv('UTF-8', 'UTF-16LE', $value)) / 2 : 0);
            $value = match ($record['compute'] ?? '') {
                'count' => $count, 'countBy', 'count-by' => self::countBy($value, ['path' => $record['countBy'] ?? $record['path'] ?? $record['key'] ?? ''], $context),
                'not-empty' => is_array($value) || is_string($value) ? $count > 0 : self::truth($value), 'empty' => is_array($value) || is_string($value) ? $count === 0 : !self::truth($value),
                'boolean' => self::truth($value), 'first' => is_array($value) ? ($value[0] ?? null) : $value, default => $value
            };
            $records[$record['id']] = $value;
        }
        unset($records);
        foreach ([$states, $selectors, $derived] as $records) foreach ($records as $key => $value) {
            $model[$key] = $value; $cursor = &$model;
            foreach (explode('.', $key) as $part) { if (!isset($cursor[$part]) || !is_array($cursor[$part])) $cursor[$part] = []; $cursor = &$cursor[$part]; }
            $cursor = $value; unset($cursor);
        }
        return $model;
    }
    public static function project(array $artifact, array $props): array {
        if (($artifact['schema'] ?? '') !== self::SCHEMA || !in_array('php', $artifact['targets'] ?? [], true)) throw new InvalidArgumentException('Unsupported PHP render artifact.');
        $model = (array)($artifact['defaults'] ?? []);
        foreach ($artifact['inputs'] as $name) if (array_key_exists($name, $props)) $model[$name] = $props[$name];
        if (isset($artifact['state'])) $model = self::projectState($model, $artifact['state']);
        return ['descriptor' => self::node($artifact['descriptor'], $model), 'model' => $model];
    }
    private static function node($input, array $model, $item = null): array {
        if ($input === null) return ['type' => 'empty'];
        if (!is_array($input)) return ['type' => 'text', 'text' => self::text($input)];
        if (array_is_list($input)) return ['type' => 'fragment', 'children' => array_map(fn($v) => self::node($v, $model, $item), $input)];
        $type = $input['type'] ?? $input['kind'] ?? '';
        if ($type === 'conditional') {
            $key = $input['test'] ?? $input['when'] ?? null; $value = self::value($key, $model, $item);
            $pass = !(is_string($key) && str_starts_with($key, '$') && $key === $value) && self::truth($value);
            return self::node($pass ? ($input['then'] ?? null) : ($input['else'] ?? $input['fallback'] ?? null), $model, $item);
        }
        if ($type === 'repeat') {
            $source = self::value($input['source'], $model, $item); $children = []; $keys = [];
            foreach (is_array($source) ? $source : [] as $index => $entry) {
                $child = self::node($input['template'] ?? $input['node'] ?? $input['children'] ?? ['type' => 'text', 'text' => '$item'], $model, $entry);
                if (isset($input['key'])) {
                    $expression = $input['key'];
                    $key = self::value(str_starts_with($expression, '$') ? $expression : '$item.' . preg_replace('/^item\./', '', $expression), $model, $entry);
                    if ($key === null || $key === '') $key = $index;
                    if (isset($keys[(string)$key])) throw new InvalidArgumentException('Duplicate repeat key.');
                    $keys[(string)$key] = true; $child['attributes']['data-rmt-key'] = $key;
                }
                $children[] = $child;
            }
            return ['type' => 'fragment', 'children' => $children];
        }
        $result = $input;
        if (array_key_exists('text', $input)) { $value = self::value($input['text'], $model, $item); $result['text'] = is_array($value) || is_object($value) ? '' : self::text($value); }
        foreach (['attributes', 'attrs', 'properties', 'props'] as $field) if (isset($input[$field])) foreach ($input[$field] as $key => $value) { $resolved = self::value($value, $model, $item); if ($resolved === self::missing()) unset($result[$field][$key]); else $result[$field][$key] = $resolved; }
        foreach (['children', 'nodes'] as $field) if (isset($input[$field])) $result[$field] = array_map(fn($v) => self::node($v, $model, $item), $input[$field]);
        foreach ($input['slots'] ?? [] as $key => $value) $result['slots'][$key] = is_array($value) && array_is_list($value) ? array_map(fn($child)=>self::node($child,$model,$item),$value) : self::node($value, $model, $item);
        return $result;
    }
}
