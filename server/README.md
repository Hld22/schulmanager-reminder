# Backend

Das Backend kapselt den Zugriff auf die inoffizielle `schulmanager-client`-Bibliothek.

Es stellt aktuell nur:

- `GET /health`
- `POST /api/sync`

bereit.

Die Login-Daten werden nicht persistiert. Der Client meldet sich pro Synchronisation an und die resultierenden Daten werden an die App zurückgegeben.

Für einen Produktivbetrieb sollten wir die Authentifizierung, HTTPS, Rate-Limits und sichere Token-Verwaltung noch härten.
