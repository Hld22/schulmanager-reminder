# Schulmanager Reminder App

MVP einer mobilen App für Android/iOS:
- Hausaufgaben und Klassenarbeiten aus Schulmanager Online synchronisieren
- Aufgaben lokal als erledigt markieren
- lokale Erinnerungen auf dem Smartphone
- Daten bleiben nach der Synchronisation lokal auf dem Gerät

## Architektur

- `app/` – Expo/React Native App
- `server/` – kleines Node/TypeScript-Backend, das den inoffiziellen Schulmanager-Client verwendet

Der Schulmanager-Zugriff ist absichtlich im Backend gekapselt. Die verwendete Schnittstelle ist nicht offiziell dokumentiert.

## 1. Backend starten

Voraussetzung: Node.js 20+.

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Standardmäßig läuft der Server auf `http://localhost:8787`.

## 2. App starten

Voraussetzung: Node.js 20+ und Expo.

```bash
cd app
npm install
npx expo start
```

Dann Expo Go auf dem Smartphone öffnen und den QR-Code scannen.

### Wichtig bei einem echten Smartphone

`localhost` auf dem Smartphone ist das Smartphone selbst. In `app/src/config.ts` daher die lokale IP-Adresse deines PCs eintragen, z.B.:

```ts
export const API_URL = "http://192.168.178.50:8787";
```

PC und Smartphone müssen im selben WLAN sein.

## Schulmanager-Zugang

Die Zugangsdaten werden vom Backend nur für die Anmeldung an Schulmanager verwendet und nicht in dieser App-Datenbank gespeichert.

Für eine echte Veröffentlichung sollten wir anschließend:
- HTTPS verwenden
- Zugangsdaten/Token serverseitig verschlüsselt speichern oder einen sichereren Login-Flow bauen
- Rate Limits und Fehlerbehandlung ergänzen
- Datenschutz/Einwilligungen prüfen
- die API-Änderungen von Schulmanager abfangen

## Erinnerungen

Die App plant lokale Benachrichtigungen. Beispiel:
- Hausaufgabe: am Fälligkeitstag morgens
- Klassenarbeit: 3 Tage vorher und am Vorabend

Die Zeiten können später in den Einstellungen geändert werden.


## Android-APK-Build ohne Android Studio

Das Projekt enthält `app/eas.json` mit einem `preview`-Profil, das ausdrücklich eine installierbare APK erzeugt.

Expo EAS kann Android-APKs in der Cloud bauen. Dafür ist kein Android Studio nötig. Der Build wird nach Anmeldung beim Expo/EAS-Dienst gestartet und kann anschließend direkt auf dem Android-Gerät installiert werden.

Wichtig: Für die finale App muss `API_URL` auf einen öffentlich erreichbaren HTTPS-Server zeigen. Die lokale `192.168.x.x`-Adresse ist nur für einen Test im heimischen WLAN geeignet.
