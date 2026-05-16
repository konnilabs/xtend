const { createRequire } = require('module');

function isMissingRequestedModule(error, request) {
  return error
    && error.code === 'MODULE_NOT_FOUND'
    && typeof error.message === 'string'
    && error.message.includes(request);
}

function requireLocalOrScoped(callerFilename, localRequest, scopedRequest) {
  const callerRequire = createRequire(callerFilename);

  try {
    return callerRequire(localRequest);
  } catch (error) {
    if (!isMissingRequestedModule(error, localRequest)) {
      throw error;
    }
    return callerRequire(scopedRequest);
  }
}

module.exports = {
  requireLocalOrScoped
};
