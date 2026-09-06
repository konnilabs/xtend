<?php
namespace App\Domain;
use App\Cart;
use Illuminate\Http\Request;
use Ccslabs\XTend\Facades\XTend;
use Ccslabs\XTend\ResumeSigner;
use Ccslabs\XTend\Data\Prop;
final class StorePage {
    public function render(Request $r,string $view,array $extra=[]){
        $draft=app(Checkout::class)->draft($r);$catalog=app(Catalog::class);$data=[
            'id'=>'store','view'=>$view,
            'catalog'=>in_array($view,['home','results'],true)?$catalog->search($r->query()):null,'product'=>null,
            'cart'=>app(Cart::class)->read($r,$draft['shipping']),'csrf'=>$r->session()->token(),'order'=>null,
        ];$data=array_replace($data,$extra);
        $title=match($view){'detail'=>$data['product']['name'],'home'=>'Gute Dinge für deinen Alltag','results'=>$data['catalog']['title'],'cart'=>'Dein Warenkorb','checkout'=>'Sicher zur Demo-Bestellung','order'=>'Danke für deine Demo-Bestellung'};
        $canonical=$view==='detail'?url($data['product']['url']).'?sku='.rawurlencode($data['product']['sku']):url($view==='home'?'/':$r->path());
        if($view==='results')$canonical=url('/suche').'?'.http_build_query($data['catalog']['filters']+['page'=>$data['catalog']['page']]);
        $head=[['tag'=>'title','text'=>$title.' · XTend.store'],['tag'=>'meta','attributes'=>['name'=>'description','content'=>$view==='detail'?$data['product']['description']:'Entdecke 36 fiktive Lieblingsstücke für Technik, Arbeitsplatz und Wohnen. XTend.store ist ein interaktiver Demo-Shop.']],['tag'=>'link','attributes'=>['rel'=>'canonical','href'=>$canonical]]];
        if(in_array($view,['checkout','order','cart']))$head[]=['tag'=>'meta','attributes'=>['name'=>'robots','content'=>'noindex, nofollow']];
        if($view==='detail'){$p=$data['product'];$head[]=['tag'=>'json-ld','key'=>'product','data'=>['@context'=>'https://schema.org','@type'=>'Product','name'=>$p['name'],'description'=>$p['description'],'sku'=>$p['sku'],'image'=>url($p['image']),'brand'=>['@type'=>'Brand','name'=>'XTend.store Demo'],'offers'=>['@type'=>'Offer','url'=>url($p['url']),'price'=>number_format($p['price']/100,2,'.',''),'priceCurrency'=>'EUR','availability'=>$p['available']?'https://schema.org/InStock':'https://schema.org/OutOfStock']]];}
        $head[]=['tag'=>'json-ld','key'=>'breadcrumbs','data'=>['@context'=>'https://schema.org','@type'=>'BreadcrumbList','itemListElement'=>[['@type'=>'ListItem','position'=>1,'name'=>'XTend.store','item'=>url('/')],['@type'=>'ListItem','position'=>2,'name'=>$title,'item'=>$canonical]]]];
        $props=['shop.data'=>$data];
        if($view==='checkout') foreach(['name'=>'Vollständiger Name','email'=>'E-Mail-Adresse','street'=>'Straße und Hausnummer','postal'=>'Postleitzahl','city'=>'Ort','shipping'=>'Versandart'] as $field=>$label)$props['shop.'.$field]=['id'=>'checkout-'.$field,'field'=>$field,'label'=>$label,'value'=>$draft[$field]??'','inputType'=>$field==='email'?'email':'text','required'=>true];
        if($view==='detail') $props['shop.recommendations']=Prop::defer(fn()=>['items'=>array_slice($catalog->search([])['products'],4,4)],'recommendations');
        return XTend::render('Store',$props,['head'=>$head,'renderOptions'=>['resume'=>['sign'=>fn(string $value)=>app(ResumeSigner::class)->sign($value)]]]);
    }
}
