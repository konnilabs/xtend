function createSuiteContext(options = {}) {
  const id = options.id || 'suite';
  const label = options.label || id;
  const failures = [];
  const passes = [];
  const skips = [];

  function pass(message) {
    passes.push(message);
  }

  function fail(message) {
    failures.push(message);
  }

  function skip(message) {
    skips.push(message);
  }

  function assert(condition, message) {
    if (condition) {
      pass(message);
      return true;
    }

    fail(message);
    return false;
  }

  function assertIncludes(content, pattern, message) {
    const ok = typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content);
    return assert(ok, message);
  }

  function result(extra = {}) {
    return {
      id,
      label,
      ok: failures.length === 0,
      passes,
      failures,
      skips,
      ...extra
    };
  }

  return {
    id,
    label,
    failures,
    passes,
    skips,
    pass,
    fail,
    skip,
    assert,
    assertIncludes,
    result
  };
}

function printSuiteReport(result, options = {}) {
  const successTitle = options.successTitle || `${result.label} erfolgreich.`;
  const failureTitle = options.failureTitle || `${result.label} fehlgeschlagen:`;

  if (!result.ok) {
    console.error(`${failureTitle}\n`);
    result.failures.forEach((failure) => console.error(`- ${failure}`));
    return;
  }

  console.log(`${successTitle}\n`);
  result.passes.forEach((entry) => console.log(`- ${entry}`));
  if (Array.isArray(result.skips) && result.skips.length > 0) {
    result.skips.forEach((entry) => console.log(`- skipped: ${entry}`));
  }
}

module.exports = {
  createSuiteContext,
  printSuiteReport
};
