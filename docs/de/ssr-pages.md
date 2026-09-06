# Seitenlaufzeit für Node und Laravel

Node und PHP/Laravel sind eigenständige SSR-Hosts. Node behält seine Compilerzugänge,
JavaScript-Services und Streams. Laravel verwendet im Produktionsbetrieb vorgebaute
RMT-Artefakte und das Composer-Paket; ein Node-Prozess ist dort nach dem Build nicht erforderlich.

Die Seitenlaufzeit ergänzt die bestehenden [Node](./rmt-node-ssr-adapter.md)- und
[PHP-Adapter](./rmt-php-ssr-adapter.md). Ihr Protokoll ist XTend-spezifisch und verwendet
keine Inertia-Abhängigkeit.

## Build und Verträge

`xt pages build --root /pfad/zur/app --target both --json` verwendet den bestehenden
vNext-Compiler und Importresolver. `node`, `php` und `both` sind Renderziele;
`--host laravel` wählt den Laravel-Ausgabepfad. Die bisherigen CLI-Serverziele bleiben erhalten.

Eine `xtend.pages.json` beschreibt die Zuordnung:

```json
{
  "schema": "xtend.page-build.v1",
  "target": "both",
  "pages": {
    "Orders/Detail": {
      "source": "pages/order.rmt",
      "inputs": ["orders.detail"]
    }
  }
}
```

Der Build erzeugt `xtend.page-manifest.v1` und TypeScript-Seiten-/Layoutzuordnungen.
Standardziel ist `.xtend-build/pages.json`, bei Laravel `bootstrap/xtend/pages.json`.
Controllerdaten ersetzen deklarierte Eingänge; fehlende Eingänge behalten ihre Defaults.
Der Projektindex verbindet Konfiguration, Seitennamen, RMT-Quelle, Renderziel und Artefakt.
Composer-`vendor`-Verzeichnisse werden nicht als Projektquellen erfasst.

Die portable Projektion heißt `xtend.rmt.portable-render.v1`. Sie verwendet bestehende
Compilerdeskriptoren, keinen PHP-RMT-Parser. Textknoten bilden Strings, Zahlen und Boolesche
Werte ab; `null`, fehlende Werte und strukturierte Werte ergeben dort leeren Text.
Für strukturierte Daten stehen Bindungen, Attribute, Listen und ausdrückliche Formatierung bereit.
JSON-Objekte bleiben bei der PHP-Dekodierung von Listen unterscheidbar.

PHP unterstützt die im portablen Renderer ausgewiesenen Ausdrücke. Beispielsweise
Regex-Ersetzung und JavaScript-Funktionen gehören nicht zu diesem Ziel. Ein PHP-Build
meldet solche Fähigkeiten als Diagnose. Node-Compiler-/Adapterzugänge bleiben nutzbar.

`assets.entry` und `assets.css` enthalten URLs desselben Ursprungs. Alternativ übernimmt
`"vite": {"manifest": "public/build/manifest.json", "entry": "resources/js/app.js"}`
den Einstieg und seine CSS-Abhängigkeiten aus einem zuvor ausgeführten Vite-Build.
`vite.base` ist standardmäßig `/build/`. `assetRoot` bezeichnet
das lokale öffentliche Verzeichnis, standardmäßig `public`. Asset-, Konfigurations-,
Quell- und Laufzeitfingerprints gehen in die Buildversion ein. Nach einem Paketwechsel
müssen Seitenartefakte mit dem tatsächlich ausgelieferten Paket neu gebaut werden.

## Node-Integration

Das Laufzeitpaket exportiert `@ccslabs/xtend-rmt/node-page-host`; das Gesamtpaket
bietet denselben Zugang unter `@ccslabs/xtend/rmt/node-page-host`.

```js
import { createNodePageHost } from '@ccslabs/xtend-rmt/node-page-host';
import { Prop } from '@ccslabs/xtend-rmt/page-contract';

const pages = createNodePageHost({
  manifest,
  createContext: (request, signal) => host.requestContext(request, signal),
  resolvePage: async context => ({
    page: 'Orders/Detail',
    props: { 'orders.detail': Prop.once(() => host.loadOrder(context)) }
  }),
  validate: (context, fields) => host.validateOnly(context, fields),
  appServiceHost,
  cleanup: context => host.release(context)
});
// Im bestehenden HTTP-Host:
// if (!await pages.handle(request, response)) nextHandler(request, response);
```

`host`, `manifest` und `appServiceHost` sind Integrationspunkte der Anwendung.
`createNodePageHost()` startet keinen Server. Der Requestkontext liefert einen opaken,
an Anwendung, Benutzer und Mandant gebundenen `contextKey`; optional einen `csrfToken`.
Authentifizierung, Routing, Uploadlimits und fachliche Validierung bleiben beim HTTP-Host.
`appServiceHost` kann eine bestehende `createNodeAppServiceHost()`-Instanz sein.

Resolver dürfen `{ redirect }`, `{ download }` mit Node-/Web-Stream oder eine Seite
zurückgeben. Provider erhalten ein Abbruchsignal. Requestdeadline und Cleanupbudget sind
getrennt konfigurierbar. Synchron blockierende Anwendungscallbacks können nicht durch
ein JavaScript-Abbruchsignal unterbrochen werden.

`createNodePageRouteManifest()` übernimmt explizit aus dem Router gelesene benannte
Routen. Laravel exportiert unabhängig seine Route Collection. Beide verwenden
`xtend.page-routes.v1` mit unterscheidbarem Host.

## Laravel-Integration

`scripts/build_laravel_package.js /absoluter/frischer/ausgabepfad` stellt
`ccslabs/xtend-laravel` samt kanonischer PHP-Dateien zusammen. Das Paket kann anschließend
über ein Composer-Repository installiert werden. Für lokale Pakettests wird ein
Composer-Path-Repository mit `symlink: false` verwendet. Eine Veröffentlichung auf
Packagist ist ein separater Schritt.

```php
use Ccslabs\XTend\Facades\XTend;
use Ccslabs\XTend\Data\Prop;

XTend::share('account', fn ($request) => $request->user()?->only('id', 'name'));
return XTend::render('Orders/Detail', [
    'orders.detail' => ['text' => $order->name, 'tone' => 'neutral'],
    'statistics' => Prop::defer(fn () => $order->statistics(), 'statistics'),
]);
```

Registriere `Ccslabs\XTend\HandleXTendRequests` in der Web-Middleware nach der
Session-Middleware. Der ServiceProvider wird über Composer entdeckt. FormRequests,
Redirects, Error Bags, Flash und `UploadedFile` behalten den Laravel-Lifecycle;
API-Routen ohne diese Middleware bleiben JSON-Routen. Bei Livevalidierung kommt
Laravels `HandlePrecognitiveRequests` hinzu.

`xtend:install` veröffentlicht die Konfiguration. `xtend:routes` exportiert die in
`xtend.routes` benannten Routen. `xtend:doctor` prüft Manifest, Renderziel und
PHP-Quellfingerprints aus `xtend.php-package-sources.v1`. Das Blade-Root kann über
`xtend.root_view` ersetzt werden. Eine Compiler-Bridge ist ausdrücklich nur ein
konfigurierbares Entwicklungswerkzeug; die Seitenintegration rendert Produktionsartefakte.

## Gemeinsamer Browser-Lifecycle

```js
import { createPageClient } from '@ccslabs/xtend-rmt/page-client';
import { createPageForm } from '@ccslabs/xtend-rmt/page-form';

const client = createPageClient({
  initialPage: JSON.parse(document.getElementById('xtend-page-data').textContent),
  encryptHistory: true
});
await client.start();
const form = createPageForm({ client, errorBag: 'edit', defaults: { name: '' } });
form.bind(document.querySelector('form'), { action: '/orders/1' });
```

`xtend.page-response.v1` verbindet Seite, Props, Layout, Head, Version und Kontext.
Interne Links, Abbruch überholter Besuche, Back/Forward, Scrollregionen
(`data-xtend-scroll`) und Anker verwenden denselben Client. `data-xtend-native`
belässt einen Link beim Browser. Formulare liefern Dirty-, Processing-, Success-,
Fehler- und Uploadzustände; spätere Eingaben werden nicht von alten Antworten zurückgesetzt.
`bind()` unterstützt native Formulare und `x-form`-Submit-Ereignisse.

Layouts werden über `layouts` und `page.layout` deklariert. Beim RMT-Build benennt
`outlet` genau einen kompilierten Knoten. Dessen Position ist der Seiteninhalt.
Ressourcen lassen sich mit `registerResource()` an Seite oder Layout binden.
Ein Benutzer-/Mandantenwechsel gibt auch persistentes DOM frei.

`Prop.lazy`, `Prop.defer`, `Prop.merge` und `Prop.once` haben JavaScript- und PHP-Zugänge.
`reload({ only: [...] })` und Deferred-Gruppen werten nur gewählte Provider aus.
`prefetch()`, `poll()` und `whenVisible()` verwenden begrenzte Lade-/Cacheverwaltung.
Ein Prefetch-Besuch prüft den Hostkontext erneut und verbraucht vorher keine Flash-Daten.
`loadMore()` verwendet `pagination.next`, `previous` und `props`; Laravel bietet
`Ccslabs\XTend\Pagination::from()` für Offset- und Cursor-Paginatoren.

Livevalidierung erfolgt über `createNodePageValidator()` beziehungsweise
`createPrecognitionValidator()` als Formularprovider. Übergib bei wechselnden
Sessiontokens `csrfToken: () => client.page.csrfToken`. Optimistische Änderungen
verwenden `client.optimistic()`. Ein älterer Fehler setzt keinen neueren Zustand zurück.
Instant Visits und View Transitions sind explizite Besuchsoptionen; reduzierte Bewegung
wird berücksichtigt.

History speichert gezielt `remember()`-Daten und Scrollpositionen. Passwörter,
Tokenfelder und Dateien werden ausgeschlossen. Optionale WebCrypto-Verschlüsselung
ersetzt keine Autorisierung. `invalidate()` verwirft Cache und gespeicherten Zustand.
Hintergrundabfragen melden einen Deploymentwechsel; sie erzwingen keinen Dokumentwechsel
über ungespeicherte Formulare hinweg. Initiales Resume verwendet den bestehenden
Signatur-/Integritätsvertrag und dessen kontrollierten Hydration-Fallback.

## Abnahme und Betrieb

Die Auswahl liegt in `scripts/test-runner/catalog.json`: `ssr-pages:node`,
`ssr-pages:laravel` und `ssr-pages:laravel-browser`. Die ausführbaren Referenzhosts
und derselbe CRUD-Browserablauf liegen unter `tests/ssr-pages/`.
Die Laravel-Matrix umfasst 12/PHP 8.2–8.5 und 13/PHP 8.3–8.5; Browsernachweise laufen
zusätzlich je Hauptversion. Lokale PHP-8.3-Ergebnisse sind kein Ersatz für diese CI-Matrix.

Für PHP-FPM/Proxy-Streaming müssen die Infrastruktur-Timeouts synchron blockierende
Provider begrenzen; Frame- und Cleanupbudgets allein können eine laufende PHP-Funktion
nicht unterbrechen. Die PHP-FPM-Prüfung kann mit `XTEND_PHP_FPM_BINARY=/pfad/zu/php-fpm` vor dem Laravel-Browserprofil aktiviert werden. Der Test startet ausschließlich einen eigenen temporären Pool.

Ressourcenmessung: `node tests/ssr-pages/measure_resources.js .xtend-test-results/ssr-pages-resources.json` vergleicht 50 Renderdurchläufe derselben Liste in beiden Laufzeiten und misst das Browserbundle. PHP-Vergleiche verwenden skalare Identitäten; Listenidentität muss als Schlüssel ausgedrückt werden. String-Slices müssen Unicode-Skalargrenzen erhalten.

Der Node-Testpfad benötigt kein PHP. Die zusätzliche Suite `ssr-pages-php` prüft die gemeinsame Renderparität einmal pro PHP-/Laravel-Umgebung. Einen vorhandenen `x-router` vor dem Einfügen mit `router.pageClient = client` verbinden und `client.start()` ausführen; danach verwaltet die Seitenlaufzeit Links und History.

Optionale Übergänge verwenden eine Hostfunktion: `createPageClient({ initialPage, transition: async update => { if (document.startViewTransition) await document.startViewTransition(update).updateCallbackDone; else await update(); } })`. Ein Besuch aktiviert sie mit `{ transition: true }`. Ohne Hostfunktion und bei reduzierter Bewegung wird die Seite regulär aktualisiert.
