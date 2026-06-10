<?php

/**
 * Lightweight Parsedown-compatible adapter for the local XTend docs app.
 *
 * The original Docs host expects the public Parsedown API surface:
 * - new Parsedown()
 * - setSafeMode(true)
 * - text($markdown)
 *
 * This adapter intentionally keeps the surface tiny and safe for local
 * development. It supports the Markdown constructs used by the XTend docs
 * without adding a Composer/runtime dependency to the repository.
 */
class Parsedown
{
    private bool $safeMode = false;

    public function setSafeMode($safeMode): self
    {
        $this->safeMode = (bool) $safeMode;
        return $this;
    }

    public function text($text): string
    {
        $lines = preg_split('/\r\n|\r|\n/', (string) $text);
        $html = [];
        $paragraph = [];
        $listType = null;
        $table = [];
        $inCode = false;
        $codeFence = '';
        $codeLines = [];

        $flushParagraph = function () use (&$html, &$paragraph): void {
            if (!$paragraph) return;
            $content = trim(implode(' ', $paragraph));
            if ($content !== '') {
                $html[] = '<p>' . $this->inline($content) . '</p>';
            }
            $paragraph = [];
        };

        $flushList = function () use (&$html, &$listType): void {
            if ($listType) {
                $html[] = '</' . $listType . '>';
                $listType = null;
            }
        };

        $flushTable = function () use (&$html, &$table): void {
            if (!$table) return;
            $html[] = $this->renderTable($table);
            $table = [];
        };

        foreach ($lines as $line) {
            $raw = rtrim($line, "\r\n");

            if ($inCode) {
                if (preg_match('/^\s*```\s*$/', $raw)) {
                    $html[] = '<pre><code' . ($codeFence ? ' class="language-' . $this->escapeAttribute($codeFence) . '"' : '') . '>'
                        . $this->escapeHtml(implode("\n", $codeLines))
                        . '</code></pre>';
                    $inCode = false;
                    $codeFence = '';
                    $codeLines = [];
                } else {
                    $codeLines[] = $raw;
                }
                continue;
            }

            if (preg_match('/^\s*```\s*([A-Za-z0-9_-]+)?\s*$/', $raw, $matches)) {
                $flushParagraph();
                $flushList();
                $flushTable();
                $inCode = true;
                $codeFence = $matches[1] ?? '';
                $codeLines = [];
                continue;
            }

            if (trim($raw) === '') {
                $flushParagraph();
                $flushList();
                $flushTable();
                continue;
            }

            if ($this->isHorizontalRule($raw)) {
                $flushParagraph();
                $flushList();
                $flushTable();
                $html[] = '<hr>';
                continue;
            }

            if (preg_match('/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/', $raw, $matches)) {
                $flushParagraph();
                $flushList();
                $flushTable();
                $level = strlen($matches[1]);
                $content = trim($matches[2]);
                $id = $this->slug($content);
                $html[] = '<h' . $level . ($id ? ' id="' . $this->escapeAttribute($id) . '"' : '') . '>'
                    . $this->inline($content)
                    . '</h' . $level . '>';
                continue;
            }

            if (preg_match('/^\s{0,3}>\s?(.*)$/', $raw, $matches)) {
                $flushParagraph();
                $flushList();
                $flushTable();
                $html[] = '<blockquote><p>' . $this->inline($matches[1]) . '</p></blockquote>';
                continue;
            }

            if ($this->isTableLine($raw)) {
                $flushParagraph();
                $flushList();
                $table[] = $raw;
                continue;
            }

            if (preg_match('/^\s*[-*+]\s+(.+)$/', $raw, $matches)) {
                $flushParagraph();
                $flushTable();
                if ($listType !== 'ul') {
                    $flushList();
                    $listType = 'ul';
                    $html[] = '<ul>';
                }
                $html[] = '<li>' . $this->inline(trim($matches[1])) . '</li>';
                continue;
            }

            if (preg_match('/^\s*\d+[.)]\s+(.+)$/', $raw, $matches)) {
                $flushParagraph();
                $flushTable();
                if ($listType !== 'ol') {
                    $flushList();
                    $listType = 'ol';
                    $html[] = '<ol>';
                }
                $html[] = '<li>' . $this->inline(trim($matches[1])) . '</li>';
                continue;
            }

            $flushList();
            $flushTable();
            $paragraph[] = trim($raw);
        }

        if ($inCode) {
            $html[] = '<pre><code' . ($codeFence ? ' class="language-' . $this->escapeAttribute($codeFence) . '"' : '') . '>'
                . $this->escapeHtml(implode("\n", $codeLines))
                . '</code></pre>';
        }

        $flushParagraph();
        $flushList();
        $flushTable();

        return implode("\n", $html);
    }

    private function inline(string $text): string
    {
        $escaped = $this->safeMode ? $this->escapeHtml($text) : $text;
        $tokens = [];

        if ($this->safeMode) {
            $escaped = $this->restoreSafeInlineAnchors($escaped);
        }

        $escaped = preg_replace_callback('/`([^`]+)`/', function ($matches) use (&$tokens) {
            $token = "\x1A" . count($tokens) . "\x1A";
            $tokens[$token] = '<code>' . $this->escapeHtml($matches[1]) . '</code>';
            return $token;
        }, $escaped);

        $escaped = preg_replace_callback('/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/', function ($matches) {
            $alt = $this->escapeAttribute($matches[1]);
            $src = $this->sanitizeUrl($matches[2]);
            $title = isset($matches[3]) ? ' title="' . $this->escapeAttribute($matches[3]) . '"' : '';
            return '<img src="' . $this->escapeAttribute($src) . '" alt="' . $alt . '"' . $title . '>';
        }, $escaped);

        $escaped = preg_replace_callback('/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/', function ($matches) {
            $href = $this->sanitizeUrl($matches[2]);
            $title = isset($matches[3]) ? ' title="' . $this->escapeAttribute($matches[3]) . '"' : '';
            return '<a href="' . $this->escapeAttribute($href) . '"' . $title . '>' . $matches[1] . '</a>';
        }, $escaped);

        $escaped = preg_replace('/\*\*([^*]+)\*\*/', '<strong>$1</strong>', $escaped);
        $escaped = preg_replace('/__([^_]+)__/', '<strong>$1</strong>', $escaped);
        $escaped = preg_replace('/\*([^*]+)\*/', '<em>$1</em>', $escaped);
        $escaped = preg_replace('/_([^_]+)_/', '<em>$1</em>', $escaped);

        return strtr($escaped, $tokens);
    }

    private function renderTable(array $lines): string
    {
        if (count($lines) < 2 || !$this->isSeparatorLine($lines[1])) {
            return '<p>' . $this->inline(implode(' ', array_map('trim', $lines))) . '</p>';
        }

        $headers = $this->splitTableRow($lines[0]);
        $align = $this->splitTableRow($lines[1]);
        $rows = array_slice($lines, 2);
        $html = ['<table>', '<thead><tr>'];

        foreach ($headers as $index => $header) {
            $style = $this->tableAlignStyle($align[$index] ?? '');
            $html[] = '<th' . $style . '>' . $this->inline(trim($header)) . '</th>';
        }

        $html[] = '</tr></thead>';
        if ($rows) {
            $html[] = '<tbody>';
            foreach ($rows as $row) {
                $html[] = '<tr>';
                foreach ($this->splitTableRow($row) as $index => $cell) {
                    $style = $this->tableAlignStyle($align[$index] ?? '');
                    $html[] = '<td' . $style . '>' . $this->inline(trim($cell)) . '</td>';
                }
                $html[] = '</tr>';
            }
            $html[] = '</tbody>';
        }

        $html[] = '</table>';
        return implode('', $html);
    }

    private function isTableLine(string $line): bool
    {
        return str_contains($line, '|');
    }

    private function isSeparatorLine(string $line): bool
    {
        return (bool) preg_match('/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/', $line);
    }

    private function isHorizontalRule(string $line): bool
    {
        return (bool) preg_match('/^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/', $line);
    }

    private function splitTableRow(string $line): array
    {
        $line = trim($line);
        $line = trim($line, '|');
        return array_map('trim', explode('|', $line));
    }

    private function tableAlignStyle(string $marker): string
    {
        $marker = trim($marker);
        if (str_starts_with($marker, ':') && str_ends_with($marker, ':')) {
            return ' style="text-align:center"';
        }
        if (str_ends_with($marker, ':')) {
            return ' style="text-align:right"';
        }
        if (str_starts_with($marker, ':')) {
            return ' style="text-align:left"';
        }
        return '';
    }

    private function sanitizeUrl(string $url): string
    {
        $url = trim($url);
        if (preg_match('/^\s*(javascript|vbscript|data):/i', $url)) {
            return '#';
        }
        return $url;
    }

    private function restoreSafeInlineAnchors(string $html): string
    {
        return preg_replace_callback('/&lt;a\s+id=&quot;([A-Za-z0-9_.:-]+)&quot;&gt;&lt;\/a&gt;/i', function ($matches) {
            return '<a id="' . $this->escapeAttribute($matches[1]) . '"></a>';
        }, $html);
    }

    private function slug(string $text): string
    {
        $slug = strtolower(strip_tags($text));
        $slug = preg_replace('/[^a-z0-9]+/i', '-', $slug);
        return trim((string) $slug, '-');
    }

    private function escapeHtml(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private function escapeAttribute(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
