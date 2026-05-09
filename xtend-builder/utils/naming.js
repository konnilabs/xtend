function normalizeTag(tag) {
  return String(tag || '').trim().toLowerCase();
}

function getComponentNameFromTag(tag) {
  const normalized = normalizeTag(tag);
  return normalized.startsWith('x-') ? normalized.slice(2) : normalized;
}

function toPascalCase(value) {
  return String(value || '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');
}

function getClassNameFromTag(tag) {
  const name = getComponentNameFromTag(tag);
  return `X${toPascalCase(name)}`;
}

function replaceArtifactTokens(template, values) {
  return String(template || '')
    .replace(/<tag>/g, values.tag)
    .replace(/<name>/g, values.name)
    .replace(/<className>/g, values.className);
}

module.exports = {
  getClassNameFromTag,
  getComponentNameFromTag,
  normalizeTag,
  replaceArtifactTokens,
  toPascalCase
};
