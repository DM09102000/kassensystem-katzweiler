# Prepaid-Kassensystem - Freilichtspiele Katzweiler e.V.

Dieses Projekt ist ein Prepaid-Kassensystem für die Spielerkantine der **Freilichtspiele Katzweiler e.V.** Es wurde entwickelt, um das Anschreiben hoher Rechnungen zu verhindern und den Bezahlvorgang über ein Prepaid-System abzuwickeln.

Das System unterstützt:
- **Admin-Oberfläche**: Zur Verwaltung von Spielern/Mitgliedern, Kinder-Accounts, Kontoständen sowie zum Einsehen und Exportieren der täglichen Abrechnung (Excel-kompatibler CSV-Export).
- **Nutzer-Oberfläche**: Für Spieler und Familien zur Einsicht ihres Guthabens, Kaufhistorie (aufgeteilt nach Familienmitgliedern) und zum Hinzufügen von Kinder-Accounts von zu Hause aus.
- **Kassen-Terminal**: Tablet-optimierte Schnellauswahl für den Kantinenverkauf, integrierte Nutzersuche sowie Unterstützung für simuliertes NFC- & Fingerabdruck-Scannen zur schnellen Identifikation.

---

## 🛠️ Technologien

Das Kassensystem ist modern und robust aufgebaut:
- **Datenbank**: PostgreSQL (SQL-Datenbank zur sicheren Datenhaltung)
- **Backend**: Node.js mit Express.js (REST-API, JWT-Authentifizierung, strukturierter CSV-Export)
- **Frontend**: React.js (Vite, moderne Benutzeroberfläche mit responsivem Design in Weinrot/Gold der Freilichtbühne)
- **Containerisierung**: Docker & Docker Compose (einfacher Start aller Services)

---

## 🚀 Schnellstart mit Docker

Stelle sicher, dass **Docker** und **Docker Compose** auf deinem System installiert und gestartet sind.

1. **Repository klonen** (oder in das Projektverzeichnis wechseln):
   ```bash
   cd "d:\Programmieren\Kassensystem FLB"
   ```

2. **Docker-Container bauen und starten**:
   ```bash
   docker compose up --build
   ```

3. **Anwendung im Browser öffnen**:
   - **Frontend (Kassensystem UI)**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🔑 Demo-Zugangsdaten

Nach dem ersten Start der Datenbank werden automatisch Standard-Testbenutzer mit Beispieldaten angelegt:

| Rolle | Benutzername | Passwort | Beschreibung |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Zugriff auf Admin-Dashboard & Kasse. Kann Abrechnungen exportieren. |
| **Kassierer** | `kasse` | `kasse123` | Zugriff auf das Kassen-Tablet (POS-Terminal). |
| **Spieler** | `max` | `spieler123` | Normaler Account (Familie Mustermann mit Kindern). |

*Hinweis: Passwörter sind in der Datenbank als sichere Bcrypt-Hashes gespeichert.*

---

## 📱 Die drei Hauptbereiche

### 1. Kassen-Terminal (Tablet-optimiert)
Hier bucht das Kantinenpersonal die Bestellungen ab:
- **Produktauswahl**: Große, leicht tippbare Kacheln für Getränke und Speisen.
- **Warenkorb**: Übersicht über gewählte Artikel und die Gesamtsumme.
- **Spieler-Identifikation**:
  - **Suche**: Schnelle Eingabe von Namen im Suchfeld.
  - **NFC- & Fingerabdruck-Scanner**: Da die Hardware noch nicht angeschlossen ist, bietet die UI **Simulations-Buttons** (z.B. *"Scan NFC (Moritz)"*), um einen automatischen Scan und die sofortige Identifikation des Spielers zu demonstrieren.
- **Konto aufladen**: Möglichkeit, direkt an der Kasse Bargeld entgegenzunehmen und das Guthaben des Spielers aufzuladen.

### 2. Mein Konto (User-Dashboard für zu Hause)
Optimiert für Smartphones und Computer:
- **Kontostand**: Prominente Anzeige des aktuellen Guthabens.
- **Kinder-Verwaltung**: Hinzufügen von Kindern zum Account. Kinder haben keinen eigenen Login, sondern laufen über den Hauptaccount. Ihr Guthaben wird separat geführt.
- **Kaufverlauf**: Detaillierte Tabelle aller Einkäufe und Aufladungen, sortiert nach Datum. Es ist klar ersichtlich, welches Familienmitglied (z.B. Elternteil oder Kind) was gekauft hat.

### 3. Admin-Bereich
Zentrale Verwaltungsoberfläche:
- **Tagesabrechnung**: Live-Vorschau der verkauften Mengen und Einnahmen von Getränken und Speisen für jeden Kalendertag.
- **CSV-Export**: Lädt eine CSV-Datei herunter, die exakt dem Format des Excel-Abrechnungsbogens der Freilichtspiele Katzweiler entspricht (inkl. UTF-8 BOM für fehlerfreie Darstellung der Umlaute in Excel).
- **Benutzerverwaltung**: Anlegen, Bearbeiten und Löschen von Accounts sowie Verknüpfen von Kindern und Zuweisen von NFC/Fingerprint-IDs.
- **Guthabenverwaltung**: Manuelle Erhöhung des Guthabens für alle Nutzer.

---

## 📂 Projektstruktur

```text
├── backend/
│   ├── Dockerfile
│   ├── db.js            # PostgreSQL Connection Pool & Retry-Logik
│   ├── package.json     # Node-Abhängigkeiten
│   └── server.js        # API Endpunkte, JWT-Auth, Kassen-Checkout, CSV-Generierung
├── db/
│   └── init.sql         # SQL-Schema und Seed-Daten (Produkte & Benutzer)
├── frontend/
│   ├── Dockerfile
│   ├── index.html       # HTML-Grundgerüst & SEO Metadaten
│   ├── package.json
│   ├── vite.config.js   # Dev Server Konfiguration
│   └── src/
│       ├── main.jsx     # React Mount
│       ├── App.jsx      # Client-Routing & globale Session
│       ├── index.css    # Premium CSS-Design (Weinrot & Gold, Glassmorphismus)
│       ├── components/
│       │   └── Navbar.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── AdminDashboard.jsx
│           ├── UserDashboard.jsx
│           └── PosKiosk.jsx
├── .gitignore
├── docker-compose.yml   # Verknüpfung aller Container (db, backend, frontend)
└── README.md            # Dokumentation
```

---

## 📊 Abrechnungs-Format (CSV-Export)

Der Export erzeugt eine CSV-Datei mit Semikolon-Trennung (`;`) nach folgendem Muster:

```csv
FREILICHTSPIELE KATZWEILER e.V.;;;
Abrechnung - Spielerkantine;;;Datum:;2026-07-31

Getränk;Menge;Preis;Verkauft;Einnahmen gesamt
Franziskaner Weizenbier;0,5L;3,00 €;5;15,00 €
Weinschorle;0,25L;2,50 €;2;5,00 €
...
Tageseinnahmen Getränke;;;;20,00 €


Speise;;Preis;Verkauft;Einnahmen gesamt
Wurst mit Brötchen;;2,50 €;10;25,00 €
Käsebrötchen;;1,50 €;4;6,00 €
...
Tageseinnahmen Essen;;;;31,00 €
Tageseinnahmen gesamt;;;;51,00 €
```
