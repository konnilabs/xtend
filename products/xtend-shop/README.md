# XTend.store

Deutscher Demo-Shop für Laravel-SSR, signiertes RMT-Resume, Maraca AppServices und eine schrittweise über XScaler gelieferte Zahlungsoberfläche. Alle 36 Produkte und Zahlungsmethoden sind fiktiv. [English instructions](README.en.md).

Der Shop und **XTend DemoPay** laufen auf getrennten Origins. Laravel hält Gastsession, Warenkorb, Checkoutentwurf und Bestellungen in SQLite. Der Browser übernimmt Seitennavigation und lässt RMT die Actions, Validierung, Surfaces und DOM-Commits steuern. Beide Hosts benötigen nach dem Build ausschließlich PHP.

## Einrichtung aus dem Framework-Checkout

Voraussetzungen: PHP 8.3 mit `pdo_sqlite`, `sqlite3`, `mbstring`, `dom`, `xml`, `xmlwriter`, OpenSSL und den Laravel-Standarderweiterungen; Composer 2; Node 24+ und npm als Buildwerkzeuge. Laravel 13 ist der Standard. Gesonderte Laravel-12-/PHP-8.2-Lockfiles liegen unter `tests/compatibility/laravel12`.

Im Product-Verzeichnis:

```sh
node scripts/prepare-packages.cjs
node scripts/refresh-local-lock.cjs
npm ci --ignore-scripts --no-audit --no-fund
composer install --no-interaction --prefer-dist --no-scripts
composer install --working-dir=payment-provider --no-interaction --prefer-dist --no-scripts
php scripts/setup.php
npm run build
```

Die Paketvorbereitung erzeugt reguläre npm-Archive und ein Composer-Paket aus den kanonischen Frameworkquellen. `refresh-local-lock.cjs` aktualisiert ausschließlich die zwei lokal gebauten Archive; Änderungen an Registry-Abhängigkeiten führen zum Fehler. Composer verwendet eine normale Kopierinstallation des lokalen Pakets. Eine außerhalb des Checkouts kopierte Anwendung kann `prepare-packages.cjs /pfad/zum/xtend-framework` verwenden.

`setup.php` erzeugt fehlende Verzeichnisse, SQLite-Tabellen, Sessionkonfiguration, Anwendungsschlüssel und das private Resume-Schlüsselpaar. Bestehende Schlüssel, Warenkörbe, Bestellungen und Bestände bleiben erhalten. `.env`, private Schlüssel, Datenbanken, Abhängigkeiten und Buildausgaben sind ignoriert. Die beiden Composer-Lockfiles und das npm-Lockfile sind versioniert.

## Start

In zwei Terminals:

```sh
npm run serve
npm run serve:provider
```

Shop: `http://127.0.0.1:8180`; Provider: `http://127.0.0.1:8181`. Die npm-Zugänge starten lediglich PHP. Ohne Node funktionieren dieselben Befehle direkt:

```sh
php artisan serve --host=127.0.0.1 --port=8180
php -S 127.0.0.1:8181 -t payment-provider/public payment-provider/public/index.php
```

Für andere Origins zuerst `APP_URL` und `DEMOPAY_ORIGIN` in der Shop-`.env` sowie `SHOP_ORIGIN` und `PROVIDER_ORIGIN` in der Provider-`.env` setzen und neu bauen. Beide Hosts verwenden denselben `DEMOPAY_SECRET`. Der Build bindet den öffentlichen Resume-Schlüssel, die Provider-Origin und die SRI-Prüfsumme fest ein. HTTP ist ausschließlich für ausdrücklich aktivierte lokale Loopback-Adressen vorgesehen; ausgelieferte Remote-Adapter verwenden HTTPS.

## Durchspielen

Über Suche, Kategorie, Preis, Verfügbarkeit und Sortierung eine Variante auswählen und in den Warenkorb legen. Katalog, Links, Filter und native Warenkorbformulare funktionieren ohne JavaScript. Mit JavaScript kommen erhaltene Shell, Mini-Cart, mobiler Filter-Drawer und der Checkout hinzu.

Der Checkout führt durch Kontakt/Lieferadresse, Versand und Prüfung. Beispieldaten: **Mara Muster**, `mara@example.test`, **Demostraße 12**, **10115 Berlin**. RMT blockiert ungültige Schritte; Laravel prüft vor der Speicherung erneut. Adressdaten bleiben aus URL und Browser-History ausgeschlossen.

Standardversand kostet 4,90 € und ist ab 50 € Warenwert kostenlos. Express kostet 9,90 €. Preise sind ganzzahlige Centbeträge. Varianten besitzen eigene SKU und Bestände. Die Backendkonfiguration ist für Versandregeln maßgeblich.

Auf der Prüfseite stehen erfolgreiche Zahlung, Ablehnung und Zeitüberschreitung zur Auswahl. DemoPay wird erst durch diese Aktion kontaktiert. Nach akzeptiertem Preflight und ATC-Attach erscheinen echte Streamabschnitte; Demo Wallet und Demo Card verlangen keine Zahlungsdaten. Abbruch, Fehler oder abgelaufene Versuche erzeugen keine erfolgreiche Bestellung. Die erfolgreiche Bestätigung ist nur in der ursprünglichen Gastsession erreichbar. Wiederholte Bestätigung desselben Versuchs erzeugt keine zweite Bestellung.

Das ausdrückliche Zurücksetzen ist separat:

```sh
npm run reset:demo
```

Dieser Befehl löscht die Demo-Daten und setzt die Seed-Bestände zurück. Ein normaler Start führt ihn niemals aus.

## Tests und Berichte

```sh
npm run test:contracts
npm run test:php
npm run test:browser
```

Im Framework-Root verwendet `npm run test:xtend-shop:report` denselben kanonischen Runner-Katalog. `xtend-shop-contracts`, `xtend-shop-php` und `xtend-shop-browser` sind einzeln ausführbar. `XTEND_SHOP_FIXTURE` verweist auf eine vorbereitete externe Installation; `XTEND_PHP_BINARY` kann einen bestimmten PHP-Interpreter wählen. Die Browser-Infrastruktur benötigt Chromium/Chrome und einen passenden WebDriver. Vorhandene Browser-Hypervisor-Einstellungen gelten unverändert.

Der Browserlauf kopiert das gebaute Produkt in eine eigene temporäre Installation, erzeugt eine neue Datenbank und startet beide Hosts mit deaktivierten Prozessfunktionen sowie ohne `node_modules`. Er verändert die lokale Demo-Datenbank nicht. Mit `XTEND_SHOP_FPM_BINARY=/pfad/php-fpm` laufen beide Hosts hinter echten FPM-Pools und einem begrenzten FastCGI-Testproxy. Die regulären Webserverzugänge bleiben davon unabhängig.

Produktberichte verwenden `xtend.store.report.v1` unter `storage/reports`; der Framework-Runner schreibt sie nach `.xtend-test-results/xtend-store-*.json`. Screenshots und Szenarien gehören zum Browserbericht. Lokale Resultate und tatsächlich ausgeführte GitHub-Matrixläufe sind getrennte Nachweise. Der Umsetzungs- und Abnahmestand steht in [WP-XTend-Store](../../development/WP-XTend-Store.md).

## Aufbau und Betrieb

`shop.data.view` benennt die aktive Seite. RMT-`conditional`-Verzweigungen rendern nur diese Seite beziehungsweise den aktuellen Checkoutschritt; die Shell bleibt erhalten. Katalogdaten werden nur für Startseite und Suchergebnisse geliefert, Checkoutfelder nur im Checkout. `Catalog::summary()` liefert kompakte Karten, `Catalog::product()` die Detailprojektion mit Beschreibung und Varianten. Beide verwenden dieselben Felder für die ausgewählte Variante: `id` identifiziert das Produkt, `sku` die Variante; `price` enthält Cent. Der Checkoutentwurf bleibt serverseitig in der Session und im benötigten RMT-Formularzustand.

Der Shop aktiviert den gemeinsamen [kompakten Seitentransport](../../docs/de/ssr-pages.md#kompakter-transport-und-bedingte-ansichten). Identische Objektbäume im Resume-/Seitenmodell werden innerhalb der Antwort über eine Referenztabelle übertragen. Die Signaturprüfung sieht den unveränderten rekonstruierten Envelope. Pagination, Suche und Filter verwenden bei aktivem JavaScript denselben Fetch-Seitenclient einschließlich History; ohne JavaScript bleiben die Links und GET-Formulare nutzbar. Inaktive Controls werden bei Bedarf aufgebaut; das gemeinsame Maraca-Bundle wird weiterhin als ein Bundle geladen.

Styles nutzen `style-src 'self'` mit Dokument-Nonce und `style-src-attr 'none'`. Komponentenstyles erhalten ihren Nonce ausschließlich aus dem vertrauenswürdigen Bootstrap. Der Browsertest prüft unerlaubte Style-Tags und Style-Attribute sowie zulässige Komponentenstyles im gestreamten Paymentablauf.

- `src/app.rmt`, `src/services.ts`, `src/app.css`: XTM-Shell, native Controls, RMT-Validierung und Maraca-Registry.
- `app/`, `routes/`, `config/shop.php`: gemeinsame Laravel-Domänendienste für native Formulare und AppServices.
- `database/catalog.json`, `public/images/`: lokale fiktive Produktdaten und eigene SVG-Illustrationen.
- `payment-provider/`: unabhängige PHP-Anwendung, Maraca-Bundle, Capability-Prüfung und Datenfragmente.
- `xtend.pages.json`, `maraca.config.json`: kanonische Build- und Indexzuordnungen.

Der Build erzeugt zuerst beide Maraca-Bundles und anschließend die PHP-Seitenartefakte aus gemeinsam genutzten Compilerergebnissen. Build- und Laufzeitfingerprints verhindern eine stille Mischung inkompatibler Artefakte. Zur Laufzeit wird nicht kompiliert. Für einen PHP-Host werden die vorgebauten `public/build`- und `bootstrap/xtend`-Artefakte, installierte Composer-Abhängigkeiten, Anwendung und Laufzeitkonfiguration ausgeliefert. Node und npm-Abhängigkeiten gehören zur Buildumgebung. PHP-FPM beziehungsweise der vorgeschaltete Proxy muss Teilantworten ohne Pufferung weiterreichen; der Provider setzt dazu `X-Accel-Buffering: no`.
