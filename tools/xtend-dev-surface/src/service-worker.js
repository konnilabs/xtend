'use strict';

const DEFAULT_COMPANION_ORIGIN = 'http://127.0.0.1:27864';
const TOKEN_HEADER = 'x-xtend-dev-surface-token';

function isAllowedCompanionOrigin(origin) {
  return origin === 'http://127.0.0.1:27864' || origin === 'http://localhost:27864';
}

function sendRuntimeResponse(sendResponse, payload) {
  sendResponse(payload);
}

chrome.runtime.onInstalled.addListener(function onInstalled() {
  chrome.storage.local.set({
    xtendDevSurface: {
      schema: 'xtend.devsurface.extension.v1',
      companionOrigin: DEFAULT_COMPANION_ORIGIN
    }
  });
});

chrome.runtime.onMessage.addListener(function onMessage(message, _sender, sendResponse) {
  if (!message || message.source !== 'xtend-dev-surface') return false;

  if (message.type === 'xds:companion-fetch') {
    const origin = message.origin || DEFAULT_COMPANION_ORIGIN;
    if (!isAllowedCompanionOrigin(origin)) {
      sendRuntimeResponse(sendResponse, {
        ok: false,
        status: 403,
        body: {
          schema: 'xtend.devsurface.diagnostic.v1',
          code: 'xtend.devsurface.security.remote_code_blocked',
          message: 'XTend Dev Surface companion origin must stay local.'
        }
      });
      return false;
    }
    const headers = {
      ...(message.headers || {})
    };
    if (message.token && !headers[TOKEN_HEADER]) headers[TOKEN_HEADER] = message.token;
    fetch(`${origin}${message.path || '/health'}`, {
      method: message.method || 'GET',
      headers,
      body: message.body ? JSON.stringify(message.body) : undefined
    }).then((response) => response.json().then((body) => ({
      ok: response.ok,
      status: response.status,
      body
    }))).then((payload) => {
      sendRuntimeResponse(sendResponse, payload);
    }).catch((error) => {
      sendRuntimeResponse(sendResponse, {
        ok: false,
        status: 0,
        body: {
          schema: 'xtend.devsurface.diagnostic.v1',
          code: 'xtend.devsurface.companion.unavailable',
          message: error.message
        }
      });
    });
    return true;
  }

  if (message.type === 'xds:companion-handshake') {
    const origin = message.origin || DEFAULT_COMPANION_ORIGIN;
    if (!isAllowedCompanionOrigin(origin)) {
      sendRuntimeResponse(sendResponse, {
        ok: false,
        status: 403,
        body: {
          schema: 'xtend.devsurface.diagnostic.v1',
          code: 'xtend.devsurface.security.remote_code_blocked',
          message: 'XTend Dev Surface companion origin must stay local.'
        }
      });
      return false;
    }
    fetch(`${origin}/handshake`, {
      method: 'POST',
      headers: {
        [TOKEN_HEADER]: message.token || ''
      }
    }).then((response) => response.json().then((body) => ({
      ok: response.ok,
      status: response.status,
      body
    }))).then((payload) => {
      sendRuntimeResponse(sendResponse, payload);
    }).catch((error) => {
      sendRuntimeResponse(sendResponse, {
        ok: false,
        status: 0,
        body: {
          schema: 'xtend.devsurface.diagnostic.v1',
          code: 'xtend.devsurface.companion.unavailable',
          message: error.message
        }
      });
    });
    return true;
  }

  return false;
});
