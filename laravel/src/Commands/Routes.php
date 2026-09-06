<?php
namespace Ccslabs\XTend\Commands;
final class Routes extends \Illuminate\Console\Command {
    protected $signature = 'xtend:routes {--output=bootstrap/xtend/routes.json}';
    protected $description = 'Export explicitly configured named Laravel routes for XTend';
    public function handle(): int {
        $routes = [];
        foreach (app('router')->getRoutes() as $route) {
            if (!in_array($route->getName(), config('xtend.routes', []), true)) continue;
            $routes[$route->getName()] = ['uri' => $route->uri(), 'methods' => $route->methods(), 'parameters' => $route->parameterNames(), 'domain' => $route->getDomain()];
        }
        ksort($routes); $target = base_path($this->option('output'));
        if (!is_dir(dirname($target))) mkdir(dirname($target), 0775, true);
        file_put_contents($target, json_encode(['schema' => 'xtend.page-routes.v1', 'host' => 'laravel', 'routes' => (object)$routes], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . "\n");
        return self::SUCCESS;
    }
}
