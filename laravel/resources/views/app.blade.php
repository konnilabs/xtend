<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="csrf-token" content="{{ csrf_token() }}">
{!! \Ccslabs\XTend\Data\PageView::renderHead($page['head'], $nonce) !!}
@foreach (($assets['css'] ?? []) as $url)<link rel="stylesheet" href="{{ $url }}">@endforeach
</head><body><main id="{{ isset($page['ssr']['resume']) ? 'xtend-page-container' : 'xtend-page' }}" tabindex="-1">{!! $html !!}</main>
<script type="application/json" id="xtend-page-data" nonce="{{ $nonce }}">{!! json_encode($page, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR) !!}</script>
@if(isset($assets['entry']))<script type="module" src="{{ $assets['entry'] }}" nonce="{{ $nonce }}"></script>@endif
</body></html>
