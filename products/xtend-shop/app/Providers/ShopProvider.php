<?php
namespace App\Providers;
use Illuminate\Support\ServiceProvider;
use Ccslabs\XTend\ResumeSigner;
final class ShopProvider extends ServiceProvider {
    public function register(): void {
        $this->app->singleton(ResumeSigner::class, fn()=>new ResumeSigner(file_get_contents(storage_path('resume.pem')), 'xtend-store'));
    }
}
