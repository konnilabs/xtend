<?php
namespace App\Domain;
use Illuminate\Support\Facades\DB;
final class Catalog {
    public static function money(int $cents): string { return number_format($cents / 100,2,',','.').' €'; }
    public function product(string $slug, ?string $sku = null): array {
        $row = DB::table('products')->where('slug',$slug)->first(); abort_unless($row,404);
        return $this->present($row,$sku);
    }
    public function variant(string $sku): array {
        $row = DB::table('variants')->where('sku',$sku)->first(); abort_unless($row,404,'Diese Variante existiert nicht.');
        $p = DB::table('products')->where('id',$row->product_id)->first();
        return (array)$row + ['name'=>json_decode($p->data,true)['name'],'url'=>'/produkt/'.$p->slug.'?sku='.rawurlencode($sku)];
    }
    private function present(object $row, ?string $sku = null): array {
        $p = json_decode($row->data,true,512,JSON_THROW_ON_ERROR);
        $variants = DB::table('variants')->where('product_id',$p['id'])->orderBy('sku')->get()->map(fn($v)=>(array)$v)->all();
        $selected = $sku ? array_values(array_filter($variants,fn($v)=>$v['sku']===$sku)) : [$variants[0]]; abort_unless($selected,404);
        $v=$selected[0];
        foreach ($variants as &$item) { $item['url']='/produkt/'.$p['slug'].'?sku='.rawurlencode($item['sku']);$item['priceText']=self::money($item['price']);$item['selected']=$item['sku']===$v['sku']; }
        return array_replace($p,$v,['id'=>$p['id'],'variants'=>$variants,'url'=>'/produkt/'.$p['slug'],'priceText'=>self::money($v['price']),
            'available'=>$v['stock']>0,'stockText'=>$v['stock']>0 ? 'Auf Lager · in 2–3 Werktagen bei dir' : 'Zurzeit nicht lieferbar']);
    }
    /** Cards expose the same selected-SKU fields as a detail page, without
     * retransmitting all variants, descriptions and feature lists per card. */
    private function summary(array $product): array {
        return array_intersect_key($product,array_flip(['id','name','sku','category','image','price','priceText','rating','reviews','badge','available','stockText','url']));
    }
    public function search(array $input): array {
        $q=mb_substr(trim((string)($input['q']??'')),0,100);$category=(string)($input['category']??'');$sort=(string)($input['sort']??'popular');
        $min=max(0,(int)($input['min']??0));$max=min(5000,max($min,(int)($input['max']??5000)));$available=($input['available']??'')==='1';
        $query=DB::table('products')->orderBy('id');if(in_array($category,['technik','arbeitsplatz','wohnen'],true))$query->where('category',$category);else $category='';
        $products=[];foreach($query->get() as $row){$p=$this->present($row);if($q!==''&&!str_contains(mb_strtolower($p['name'].' '.$p['description']),mb_strtolower($q)))continue;
            if($p['price']<$min*100||$p['price']>$max*100||($available&&!$p['available']))continue;$products[]=$p;}
        if(in_array($sort,['price-asc','price-desc','name'],true))usort($products,fn($a,$b)=>$sort==='name'?strcmp($a['name'],$b['name']):($sort==='price-desc'?-1:1)*($a['price']<=>$b['price']));else $sort='popular';
        $count=count($products);$pages=max(1,(int)ceil($count/12));$page=min($pages,max(1,(int)($input['page']??1)));
        $filters=compact('q','category','sort','min','max');$filters['available']=$available?'1':'';
        $links=[];for($i=1;$i<=$pages;$i++)$links[]=['id'=>(string)$i,'label'=>(string)$i,'current'=>$page===$i,'url'=>'/suche?'.http_build_query($filters+['page'=>$i])];
        return ['products'=>array_map([$this,'summary'],array_slice($products,($page-1)*12,12)),'total'=>$count,'page'=>$page,'filters'=>$filters,'pagination'=>$links,'empty'=>$count===0,'title'=>$q!==''?'Ergebnisse für „'.$q.'“':(['technik'=>'Technik','arbeitsplatz'=>'Arbeitsplatz','wohnen'=>'Wohnen'][$category]??'Entdecke deinen Alltag neu')];
    }
}
