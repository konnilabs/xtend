<?php
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Ccslabs\XTend\AppServiceHost;
use App\Domain\{StorePage,Catalog,Checkout};
use App\Cart;
Route::get('/',fn(Request $r,StorePage $pages)=>$pages->render($r,'home'));
Route::get('/suche',fn(Request $r,StorePage $pages)=>$pages->render($r,'results'));
Route::get('/kategorie/{category}',function(Request $r,string $category,StorePage $pages){abort_unless(in_array($category,['technik','arbeitsplatz','wohnen']),404);$r->query->set('category',$category);return $pages->render($r,'results');});
Route::get('/produkt/{slug}',fn(Request $r,string $slug,StorePage $pages,Catalog $catalog)=>$pages->render($r,'detail',['product'=>$catalog->product($slug,$r->query('sku'))]));
Route::get('/warenkorb',fn(Request $r,StorePage $pages)=>$pages->render($r,'cart'));
Route::get('/checkout',function(Request $r,StorePage $pages,Cart $cart){if($cart->read($r)['empty'])return redirect('/warenkorb');return $pages->render($r,'checkout');});
Route::get('/bestellung/{id}',fn(Request $r,string $id,StorePage $pages,Checkout $checkout)=>$pages->render($r,'order',['order'=>$checkout->order($r,$id)]));
foreach(['add','set','clear'] as $operation)Route::post('/cart/'.$operation,function(Request $r,Cart $cart)use($operation){
    $input=$r->all();
    // The native remove button has its own name so the RMT form binding can
    // resolve quantity to a single input instead of a RadioNodeList.
    if($operation==='set' && $r->boolean('remove'))$input['quantity']=0;
    $cart->change($r,$input,$operation);
    return redirect('/warenkorb');
});
Route::post('/api/xtend/services/{serviceId}', function(Request $r,string $serviceId) {
    $manifest=json_decode(file_get_contents(public_path('build/maraca/xtend.maraca.services.json')),true,512,JSON_THROW_ON_ERROR);
    return (new AppServiceHost($manifest,require base_path('server/server-services.php')))->handle($r,$serviceId);
});
