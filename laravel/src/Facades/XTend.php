<?php
namespace Ccslabs\XTend\Facades;
final class XTend extends \Illuminate\Support\Facades\Facade {
    protected static $cached = false;
    protected static function getFacadeAccessor(): string { return \Ccslabs\XTend\PageManager::class; }
}
