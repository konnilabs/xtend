<?php
declare(strict_types=1);
namespace Ccslabs\XTend;

final class Pagination {
    /** Supports both length-aware/offset and cursor pagination without serializing the paginator as props. */
    public static function from(\Illuminate\Contracts\Pagination\Paginator|\Illuminate\Contracts\Pagination\CursorPaginator $paginator, array $props): array {
        if (!$props || array_filter($props,fn($name)=>!is_string($name) || $name==='')) throw new \InvalidArgumentException('Pagination requires prop names.');
        return ['next'=>$paginator->nextPageUrl(),'previous'=>$paginator->previousPageUrl(),'props'=>array_values($props)];
    }
}
