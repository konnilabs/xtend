export const APP_CAPABILITY_HEADER = 'x-xtend-llm-capability';

export function configureAppServerSession(session, serverUrl, capability) {
  const origin = new URL(serverUrl).origin;
  session.webRequest.onBeforeSendHeaders({urls: [`${origin}/*`]}, (details, callback) => {
    const headers = {...details.requestHeaders};
    if (new URL(details.url).origin === origin) headers[APP_CAPABILITY_HEADER] = capability;
    callback({requestHeaders: headers});
  });
}
