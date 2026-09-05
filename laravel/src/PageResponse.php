<?php
namespace Ccslabs\XTend;
final class PageResponse implements \Illuminate\Contracts\Support\Responsable {
    public function __construct(private PageManager $manager, private string $page, private array $props, private array $options) {}
    public function toResponse($request) { return $this->manager->response($this->page, $this->props, $this->options); }
}
