<!doctype html>
<html><head><meta charset="utf-8"><meta name="csrf-token" content="{{ csrf_token() }}">
@foreach ($page['head'] as $tag)
@if (($tag['tag'] ?? '') === 'title')<title>{{ $tag['text'] ?? '' }}</title>@endif
@if (($tag['tag'] ?? '') === 'meta')<meta data-xtend-page-head @foreach (($tag['attributes'] ?? []) as $name => $value) @if(in_array($name, ['name', 'property', 'content', 'charset'], true)) {{ $name }}="{{ $value }}" @endif @endforeach>@endif
@endforeach
@foreach (($assets['css'] ?? []) as $url)<link rel="stylesheet" href="{{ $url }}">@endforeach
</head><body><main id="{{ isset($page['ssr']['resume']) ? 'xtend-page-container' : 'xtend-page' }}" tabindex="-1">{!! $html !!}</main>
<script type="application/json" id="xtend-page-data" nonce="{{ $nonce }}">{!! json_encode($page, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR) !!}</script>
@if(isset($assets['entry']))<script type="module" src="{{ $assets['entry'] }}" nonce="{{ $nonce }}"></script>@endif
</body></html>
