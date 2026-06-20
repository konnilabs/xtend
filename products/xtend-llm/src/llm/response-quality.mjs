import { stripThinkMarkup } from './thinking-markup.mjs';

function normalizeText(value) {
  return stripThinkMarkup(value)
    .replace(/<\|[^|]+?\|>/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function longestRepeatedRun(text) {
  let longest = 0;
  let previous = '';
  let current = 0;
  for (const char of text) {
    if (char === previous) {
      current += 1;
    } else {
      previous = char;
      current = 1;
    }
    if (current > longest) longest = current;
  }
  return longest;
}

function safePattern(pattern) {
  if (!pattern) return null;
  if (pattern instanceof RegExp) return pattern;
  return new RegExp(String(pattern), 'iu');
}

const VOWEL_PATTERN = /[aeiouy\u00e4\u00f6\u00fcAEIOUY\u00c4\u00d6\u00dc]/u;
const VOWELS_PATTERN = /[aeiouy\u00e4\u00f6\u00fcAEIOUY\u00c4\u00d6\u00dc]/gu;

export function assessLlmResponseQuality(text, options = {}) {
  const normalized = normalizeText(text);
  const letters = normalized.match(/\p{L}/gu) || [];
  const words = normalized.match(/\p{L}[\p{L}'-]*/gu) || [];
  const vowels = normalized.match(VOWELS_PATTERN) || [];
  const symbols = normalized.match(/[^\p{L}\p{N}\s.,;:!?'"()\-+/=]/gu) || [];
  const noVowelWords = words.filter((word) => word.length >= 4 && !VOWEL_PATTERN.test(word));
  const averageWordLength = words.length > 0
    ? words.reduce((total, word) => total + word.length, 0) / words.length
    : 0;
  const expected = safePattern(options.expectedPattern);
  const metrics = {
    chars: normalized.length,
    words: words.length,
    alphaRatio: normalized.length > 0 ? letters.length / normalized.length : 0,
    vowelRatio: letters.length > 0 ? vowels.length / letters.length : 0,
    symbolRatio: normalized.length > 0 ? symbols.length / normalized.length : 0,
    noVowelWordRatio: words.length > 0 ? noVowelWords.length / words.length : 0,
    averageWordLength,
    longestRepeatedRun: longestRepeatedRun(normalized),
    expectedMatched: expected ? expected.test(normalized) : true
  };
  const reasons = [];
  const minChars = options.minChars ?? 12;
  const minWords = options.minWords ?? 3;

  if (metrics.chars < minChars) reasons.push(`response too short: ${metrics.chars} chars`);
  if (metrics.words < minWords) reasons.push(`too few words: ${metrics.words}`);
  if (metrics.alphaRatio < 0.45) reasons.push(`low letter ratio: ${metrics.alphaRatio.toFixed(2)}`);
  if (metrics.vowelRatio < 0.18) reasons.push(`low vowel ratio: ${metrics.vowelRatio.toFixed(2)}`);
  if (metrics.symbolRatio > 0.18) reasons.push(`too many symbols: ${metrics.symbolRatio.toFixed(2)}`);
  if (metrics.noVowelWordRatio > 0.45) reasons.push(`too many no-vowel words: ${metrics.noVowelWordRatio.toFixed(2)}`);
  if (metrics.averageWordLength > 14) reasons.push(`average word length too high: ${metrics.averageWordLength.toFixed(1)}`);
  if (metrics.longestRepeatedRun > 5) reasons.push(`repeated character run too long: ${metrics.longestRepeatedRun}`);
  if (!metrics.expectedMatched) reasons.push('expected semantic marker missing');

  return {
    schema: 'xtend-llm.response-quality.v1',
    ok: reasons.length === 0,
    text: normalized,
    reasons,
    metrics
  };
}

export default assessLlmResponseQuality;
