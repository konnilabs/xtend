<?php
declare(strict_types=1);
use Ccslabs\XTend\Facades\XTend;
use Ccslabs\XTend\Data\Prop;
use Ccslabs\XTend\HandleXTendRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

final class PageFormRequest extends \Illuminate\Foundation\Http\FormRequest {
    protected $errorBag = 'edit';
    public function authorize(): bool { return true; }
    public function rules(): array { return ['name' => 'required|string|min:3', 'attachment' => 'nullable|file|max:1024']; }
}
final class FixtureMiddleware extends HandleXTendRequests {
    public function share(Request $request): array { return ['requestValue' => $request->header('X-Request-Value', 'default')]; }
}
final class LaravelIntegrationTest extends \Orchestra\Testbench\TestCase {
    private string $manifestPath;
    protected function getPackageProviders($app): array { return [\Ccslabs\XTend\XTendServiceProvider::class]; }
    protected function defineEnvironment($app): void {
        $this->manifestPath = tempnam(sys_get_temp_dir(), 'xtend-pages-');
        file_put_contents($this->manifestPath, json_encode(['schema' => 'xtend.page-manifest.v1', 'version' => 'build-1', 'pages' => ['Orders/Index' => ['artifact' => ['schema' => 'xtend.rmt.portable-render.v1', 'targets' => ['node','php'], 'inputs' => ['title'], 'defaults' => ['title' => 'Initial'], 'descriptor' => ['type' => 'element', 'tag' => 'h1', 'children' => [['type' => 'text', 'text' => '$model.title']]]]]]], JSON_THROW_ON_ERROR));
        $app['config']->set('app.key', 'base64:' . base64_encode(str_repeat('k', 32)));
        $app['config']->set('xtend.manifest', $this->manifestPath);
        $app['config']->set('session.driver', 'array');
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);
    }
    protected function defineRoutes($router): void {
        $router->middleware(['web', \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class, FixtureMiddleware::class])->group(function() use($router) {
            $router->get('/orders', fn() => XTend::render('Orders/Index', ['title' => request('title', 'Controller title'), 'lazy' => Prop::lazy(fn() => throw new RuntimeException('unrequested provider')), 'later' => Prop::defer(fn() => 'Loaded later', 'statistics')]));
            $router->match(['POST','PUT'], '/orders', function(PageFormRequest $request) { $request->session()->put('mutated',true); return redirect('/orders')->with('success', $request->file('attachment')?->getClientOriginalName() ?? 'Saved'); });
            $router->get('/restricted', fn() => abort(403));
        });
    }
    protected function tearDown(): void { if (isset($this->manifestPath)) @unlink($this->manifestPath); parent::tearDown(); }
    public function test_full_html_uses_controller_data_before_javascript(): void {
        $this->get('/orders')->assertOk()->assertSee('Controller title')->assertDontSee('>Initial<', false)->assertSee('xtend-page-data');
    }
    public function test_negotiation_partial_data_and_deferred_groups(): void {
        $this->get('/orders', ['X-XTend-Page' => '1'])->assertOk()->assertJsonPath('page', 'Orders/Index')->assertJsonPath('props.title', 'Controller title')->assertJsonPath('deferred.statistics.0', 'later');
        $this->get('/orders', ['X-XTend-Page' => '1', 'X-XTend-Only' => '["title"]'])->assertOk()->assertJsonPath('partial', true)->assertJsonMissingPath('ssr');
        $this->get('/orders', ['X-XTend-Page' => '1', 'X-XTend-Deferred' => '["statistics"]'])->assertOk()->assertJsonPath('props.later', 'Loaded later')->assertJsonMissingPath('props.title');
    }
    public function test_formrequest_preserves_redirect_error_bags_and_flash(): void {
        $response = $this->from('/orders')->post('/orders', ['name' => 'x'], ['X-XTend-Page' => '1']);
        $response->assertStatus(409)->assertJsonPath('kind', 'redirect');
        $this->get('/orders', ['X-XTend-Page' => '1'])->assertOk()->assertJsonStructure(['errors' => ['edit' => ['name']]]);
        $this->post('/orders', ['name' => 'Valid'], ['X-XTend-Page' => '1'])->assertStatus(409);
        $this->get('/orders', ['X-XTend-Page' => '1'])->assertJsonPath('flash.success', 'Saved');
    }
    public function test_sequential_requests_do_not_share_request_data(): void {
        $this->get('/orders', ['X-XTend-Page' => '1', 'X-Request-Value' => 'alice'])->assertJsonPath('shared.requestValue', 'alice');
        $this->get('/orders', ['X-XTend-Page' => '1', 'X-Request-Value' => 'bob'])->assertJsonPath('shared.requestValue', 'bob');
    }
    public function test_versions_bad_selection_and_authorization_fail_closed(): void {
        $this->get('/orders', ['X-XTend-Page' => '1', 'X-XTend-Version' => 'old'])->assertStatus(409)->assertJsonPath('kind', 'reload');
        $this->get('/orders', ['X-XTend-Page' => '1', 'X-XTend-Only' => '{"bad":true}'])->assertStatus(400);
        $this->get('/restricted', ['X-XTend-Page' => '1'])->assertStatus(403);
    }
    public function test_precognition_validates_without_running_mutations(): void {
        $this->postJson('/orders',['name'=>'x'],['Precognition'=>'true','Precognition-Validate-Only'=>'name'])->assertStatus(422)->assertJsonValidationErrors('name');
        $this->postJson('/orders',['name'=>'Valid'],['Precognition'=>'true','Precognition-Validate-Only'=>'name'])->assertNoContent()->assertSessionMissing('mutated');
    }
    public function test_uploaded_file_method_spoofing_and_prefetch_preserve_flash(): void {
        $this->post('/orders',['_method'=>'PUT','name'=>'Valid','attachment'=>\Illuminate\Http\UploadedFile::fake()->create('receipt.txt',1,'text/plain')],['X-XTend-Page'=>'1'])->assertStatus(409);
        $this->get('/orders',['X-XTend-Page'=>'1','X-XTend-Prefetch'=>'1'])->assertJsonMissingPath('flash.success');
        $this->get('/orders',['X-XTend-Page'=>'1'])->assertJsonPath('flash.success','receipt.txt');
    }
    public function test_doctor_rejects_runtime_drift_and_missing_php_dependencies(): void {
        $runtime = __DIR__ . '/vendor/ccslabs/xtend-laravel/runtime';
        $file = $runtime . '/rmt-portable-render.php'; $original = file_get_contents($file);
        try {
            file_put_contents($file,$original . "\n// controlled drift\n");
            $this->artisan('xtend:doctor')->assertFailed();
        } finally { file_put_contents($file,$original); }
        $renamed = $file . '.missing'; rename($file,$renamed);
        try {
            $probe = new \Symfony\Component\Process\Process([PHP_BINARY,'-r','require "vendor/autoload.php";'],__DIR__);
            $probe->setTimeout(10); $probe->run(); $this->assertFalse($probe->isSuccessful());
        } finally { rename($renamed,$file); }
    }
    public function test_paginator_adapters_preserve_filters_and_cursor_urls(): void {
        $offset = new \Illuminate\Pagination\LengthAwarePaginator([['id'=>1]], 3, 1, 1, ['path'=>'/orders', 'query'=>['filter'=>'open']]);
        $result = \Ccslabs\XTend\Pagination::from($offset, ['orders']);
        $this->assertSame('/orders?filter=open&page=2', $result['next']);
        $this->assertNull($result['previous']);
        $cursor = new \Illuminate\Pagination\CursorPaginator([['id'=>1],['id'=>2]], 1, null, ['path'=>'/orders','parameters'=>['id'],'query'=>['filter'=>'open']]);
        $result = \Ccslabs\XTend\Pagination::from($cursor, ['orders']);
        $this->assertStringContainsString('filter=open', $result['next']);
        $this->assertStringContainsString('cursor=', $result['next']);
        $this->assertSame(['orders'], $result['props']);
    }
    public function test_incompatible_runtime_and_missing_artifacts_fail_closed(): void {
        $manifest = json_decode(file_get_contents($this->manifestPath), true, 512, JSON_THROW_ON_ERROR);
        $manifest['runtimeFingerprints'] = ['php'=>['rmt-portable-render.php'=>'invalid']];
        file_put_contents($this->manifestPath,json_encode($manifest, JSON_THROW_ON_ERROR));
        $this->get('/orders')->assertStatus(500);
        unlink($this->manifestPath);
        $this->get('/orders')->assertStatus(500);
    }
}
