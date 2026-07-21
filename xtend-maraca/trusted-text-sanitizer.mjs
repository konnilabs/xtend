'use strict';

const SANITIZING_BOUNDARY_CONTRACT = 'xtend.security.sanitizing-boundary.v1';
const TRUSTED_TEXT_SANITIZER_CONTRACT = 'xtend.security.trusted-text-sanitizer.v1';

function sanitizeTrustedText(value, options = {}) {
  const diagnostics = [];
  if (typeof value !== 'string') {
    diagnostics.push('xtend.security.text_sanitizer.type_refused');
    return {
      schema: TRUSTED_TEXT_SANITIZER_CONTRACT,
      ok: false,
      sanitized: false,
      changed: false,
      boundary: SANITIZING_BOUNDARY_CONTRACT,
      format: 'text',
      text: null,
      diagnostics
    };
  }

  const normalized = value.replace(/\r\n?/gu, '\n');
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u.test(normalized)) {
    diagnostics.push('xtend.security.text_sanitizer.control_character_refused');
  }
  const maxLength = Number(options.maxLength);
  if (Number.isInteger(maxLength) && maxLength >= 0 && normalized.length > maxLength) {
    diagnostics.push('xtend.security.text_sanitizer.max_length_exceeded');
  }
  const ok = diagnostics.length === 0;
  return {
    schema: TRUSTED_TEXT_SANITIZER_CONTRACT,
    ok,
    sanitized: ok,
    changed: ok && normalized !== value,
    boundary: SANITIZING_BOUNDARY_CONTRACT,
    format: 'text',
    text: ok ? normalized : null,
    diagnostics
  };
}

export {
  SANITIZING_BOUNDARY_CONTRACT,
  TRUSTED_TEXT_SANITIZER_CONTRACT,
  sanitizeTrustedText
};
