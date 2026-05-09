const fs = require('fs');
const path = require('path');
const {
  getTemplateForArtifact
} = require('./registry');

const rootDir = path.resolve(__dirname, '..', '..');

function getTemplateAbsolutePath(template) {
  return path.join(rootDir, template.path);
}

function renderTemplateString(template, values) {
  return String(template).replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return String(values[key]);
    }

    return match;
  });
}

function renderTemplateForArtifact(artifact, values) {
  const template = getTemplateForArtifact(artifact);
  if (!template) {
    return {
      ok: false,
      error: `No template registered for artifact "${artifact}".`
    };
  }

  const absolutePath = getTemplateAbsolutePath(template);
  if (!fs.existsSync(absolutePath)) {
    return {
      ok: false,
      error: `Template file missing: ${template.path}`,
      template
    };
  }

  return {
    ok: true,
    template,
    content: renderTemplateString(fs.readFileSync(absolutePath, 'utf8'), values)
  };
}

module.exports = {
  renderTemplateForArtifact,
  renderTemplateString
};
