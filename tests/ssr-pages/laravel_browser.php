<?php
declare(strict_types=1);
require __DIR__ . '/vendor/autoload.php';
use Ccslabs\XTend\Data\Prop;
use Ccslabs\XTend\Facades\XTend;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

final class BrowserMiddleware extends \Ccslabs\XTend\HandleXTendRequests {
    public function share(Request $request): array {
        if ($request->session()->has('user')) $request->setUserResolver(fn() => new \Illuminate\Auth\GenericUser(['id' => $request->session()->get('user')]));
        return ['testHost'=>'laravel','resumePublicKey'=>json_decode(file_get_contents(__DIR__.'/resume-public.json'),true,512,JSON_THROW_ON_ERROR)];
    }
}
final class BrowserFormRequest extends \Illuminate\Foundation\Http\FormRequest {
    protected $errorBag = 'edit';
    public function authorize(): bool { return $this->session()->has('user'); }
    public function rules(): array { return ['name' => 'required|string|min:3', 'attachment' => 'nullable|file|max:1024']; }
}
$app = \Illuminate\Foundation\Application::configure(basePath: __DIR__)
    ->withExceptions()
    ->withMiddleware()
    ->withProviders([\Ccslabs\XTend\XTendServiceProvider::class], false)
    ->withRouting(using: function() {
        Route::middleware(['web', \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class, BrowserMiddleware::class])->group(function() {
            Route::get('/login', fn() => XTend::render('Login', ['title' => 'Login']));
            Route::get('/resume', fn() => XTend::render('Login', ['title'=>'Resume'], ['renderOptions'=>['executionMode'=>'server_prerender_resume','resume'=>['sign'=>function(string $canonical): array {
                if (!openssl_sign($canonical,$der,file_get_contents(__DIR__.'/resume-private.pem'),OPENSSL_ALGO_SHA256)) throw new RuntimeException('Signing failed.');
                // P-256 DER contains two positive ASN.1 INTEGERs. WebCrypto consumes IEEE-P1363.
                $offset=2; $raw='';
                for($i=0;$i<2;$i++) { if(ord($der[$offset++])!==2) throw new RuntimeException('Invalid ECDSA signature.'); $length=ord($der[$offset++]); $part=ltrim(substr($der,$offset,$length),"\x00"); $offset+=$length; $raw.=str_pad($part,32,"\x00",STR_PAD_LEFT); }
                return ['algorithm'=>'ECDSA-P256-SHA256','keyId'=>'browser-fixture','signature'=>rtrim(strtr(base64_encode($raw),'+/','-_'),'=')];
            }]] ]));
            Route::post('/login', function(Request $request) { $request->session()->regenerate(); $request->session()->put('user', 'alice'); return redirect('/orders'); });
            Route::post('/logout', function(Request $request) { $request->session()->invalidate(); $request->session()->regenerateToken(); return redirect('/login'); });
            Route::get('/orders', function(Request $request) {
                if (!$request->session()->has('user')) return redirect('/login');
                $orders = [['id'=>1,'name'=>$request->session()->get('order_name','Active order'),'active'=>true],['id'=>2,'name'=>'Inactive order','active'=>false]];
                if ($request->query('filter') === 'active') $orders = array_values(array_filter($orders, fn($row) => $row['active']));
                return XTend::render('Orders', ['title'=>'Orders','orders'=>$orders,'statistics'=>Prop::defer(fn()=>'Deferred ready','stats')]);
            });
            Route::get('/orders/1', function(Request $request) {
                if (!$request->session()->has('user')) return redirect('/login');
                return XTend::render('Detail', ['title'=>'Detail','name'=>$request->session()->get('order_name','Active order')]);
            });
            Route::get('/orders/export', function(Request $request) {
                abort_unless($request->session()->has('user'),403);
                return response()->streamDownload(fn()=>print("order,name\n1,Active order"),'orders.csv',['Content-Type'=>'text/csv']);
            });
            Route::post('/orders/1', function(BrowserFormRequest $request) {
                $request->session()->put('order_name', $request->validated('name'));
                return redirect('/orders/1')->with('success', 'Saved ' . ($request->file('attachment')?->getClientOriginalName() ?? 'order'));
            });
        });
        // Fixture control is outside the application's web routes.
        Route::match(['POST','DELETE'], '/test/version', function(Request $request) {
            $path = __DIR__ . '/pages.json'; $manifest = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
            $manifest['version'] = $request->method() === 'DELETE' ? 'browser-v1' : 'browser-v2';
            file_put_contents($path,json_encode($manifest, JSON_THROW_ON_ERROR)); return response('',204);
        });
    })->create();
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();
config([
    'app.key'=>'base64:' . base64_encode(str_repeat('k',32)),
    'app.debug'=>false,
    'session.driver'=>'file',
    'session.cookie'=>'xtend_browser',
    'session.secure'=>false,
    'session.files'=>__DIR__ . '/storage/framework/sessions',
    'view.compiled'=>__DIR__ . '/storage/framework/views',
    'cache.default'=>'array',
    'xtend.manifest'=>__DIR__ . '/pages.json',
    'xtend.ssr'=>['compileSource'=>fn()=>throw new \RuntimeException('A production PHP page must not compile source.')],
]);
$request = Request::capture();
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request,$response);
