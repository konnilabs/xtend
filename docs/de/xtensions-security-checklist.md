# XTensions Security Checklist

## Release-Freigabe

Jede XTension braucht vor Runtime-Loading einen Owner, eine Version, einen Contract und eine SHA256 Integrity fuer das auszuliefernde Artefakt. Ohne diese Informationen bleibt die XTension policy-blocked oder degraded.

## CSP und Loading

CSP muss explizit sein: `script-src`, `style-src`, `img-src`, `connect-src`, `worker-src` und `object-src` muessen zur XTension passen. Es gibt no CDN als Default fuer lokale Gates oder Referenzfixtures. Externe Runtimes bleiben external peer oder optional peer und werden nicht automatisch aus dem Netz geladen.

## Supply Chain

Das Package darf no vendored framework enthalten. React, Vue, Three, Leaflet, Chart.js und aehnliche Runtimes duerfen nicht in XTend-Repo, Root-Dependencies, Workspace-Dependencies oder NPM-Files eingeschlossen werden. Ein externer Peer-Harness dokumentiert Installation und Smoke-Evidence ausserhalb des XTend-Kerns.

## Runtime Gate

Vor dem Mount prueft der Host:

1. Owner und Version sind gesetzt.
2. Contract und Maraca Manifest stimmen ueberein.
3. SHA256 Integrity passt zum Artefakt.
4. CSP erlaubt nur benoetigte Quellen.
5. Capability Registry meldet Peer-Status und Fallback.
6. Fabric-Events haben Owner, Payload-Schema, Lane und Trust Boundary.
7. Cleanup fuer Listener, Timer, Observer, Worker und Render-Loops ist definiert.

## Fallback

Wenn Integrity, CSP, Peer-Verfuegbarkeit oder Policy scheitern, wird nicht gemountet. Die XTension meldet einen Diagnostic Record, zeigt den Fallback und blockiert die Shell nicht.
