<?php
namespace Ccslabs\XTend;
final class XTendServiceProvider extends \Illuminate\Support\ServiceProvider {
    public function register(): void {
        $this->mergeConfigFrom(__DIR__ . '/../config/xtend.php', 'xtend');
        $this->app->bind(PageManager::class, function($app) {
            $request = $app['request'];
            if (!$request->attributes->has('xtend.manager')) $request->attributes->set('xtend.manager', new PageManager($app['config']->get('xtend'), $request));
            return $request->attributes->get('xtend.manager');
        });
    }
    public function boot(): void {
        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'xtend');
        $this->publishes([__DIR__ . '/../config/xtend.php' => config_path('xtend.php')], 'xtend-config');
        if ($this->app->runningInConsole()) $this->commands([Commands\Install::class, Commands\Routes::class, Commands\Doctor::class]);
    }
}
