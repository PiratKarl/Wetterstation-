# 🌦️ Aura Wetterstation (Web-App)

**Version:** 83.1 (Global Flag & Legacy Edition)  
**Status:** Stable (Production Ready)  
**Autor:** Code-Werft / Piratkarl  

Eine hochmoderne, webbasierte Wetterstation, optimiert für den **24/7-Betrieb auf Tablets**.  
Das Besondere: Der Code wurde speziell "gehärtet" (ES5 Standard), um sowohl auf **neuesten High-End-Geräten** als auch auf **alter Hardware (Android 4.4 / KitKat)** stabil und ohne Abstürze zu laufen.

---

## ✨ Neue Features in V83.1

### 🌍 1. Globaler Multi-Ticker (35 Orte)
Das Laufband am unteren Rand wurde massiv erweitert und verlangsamt (für bessere Lesbarkeit):
- **35 Ziele pro Kategorie:** Von der Karibik bis Japan, von den Alpen bis zur Nordsee.
- **Nationalflaggen 🇩🇪🇺🇸🇯🇵:** Jeder Ort zeigt nun stolz seine Flagge zur schnellen Orientierung.
- **3 Modi:**
    1.  **Welt-Metropolen:** (Berlin, New York, Tokio...) - *Läuft auf ALLEN Geräten.*
    2.  **Schnee-Bericht:** (Ischgl, Aspen, Niseko...) - *Skifahrer-Icon ⛷️ bei viel Schnee.*
    3.  **Bade-Wetter:** (Malediven, Sylt, Mallorca...) - *Palmen-Icon 🌴 bei warmem Wasser.*

### 🎨 2. "Big Data" & High-End Visuals
- **Layout:** Temperatur und Messwerte wurden massiv vergrößert, um auch aus der Entfernung lesbar zu sein.
- **Neon-Optik:** Icons (Sonne, Wolken) nutzen jetzt komplexe Farbverläufe und Glow-Effekte (3D-Look).
- **Animationen:** Sanft wabernder Nebel, drehende Sonnen, fallender Schnee.
- **Menu:** "Direct-Menu"-Architektur (kein Nachladen externer Dateien mehr).

### 🛡️ 3. Legacy "Safe Mode" (Der Retter für alte Tablets)
Um Abstürze auf alten Android 4.4 Geräten (z.B. altes Samsung Tab) zu verhindern:
- **Kein `async/await`:** Kompletter Umbau auf Promises.
- **Keine Arrow-Functions:** Rückbau auf klassische `function()`.
- **CSS-Kompatibilität:** Nutzung von `-webkit-` Präfixen für Flexbox-Layouts.

---

## 📱 Kompatibilität & Hardware

| Feature | Android 4.4 - 7.0 (Legacy) | Android 7.1 - 14+ (Modern) |
| :--- | :---: | :---: |
| **Basis-Wetter** | ✅ JA | ✅ JA |
| **Welt-Ticker (35 Orte)** | ✅ JA | ✅ JA |
| **Ticker Flaggen** | ✅ JA | ✅ JA |
| **Uhr & Video** | ✅ JA | ✅ JA |
| **Schneehöhen** | ⚠️ Lädt (oft SSL Fehler*) | ✅ JA |
| **Wassertemp.** | ⚠️ Lädt (oft SSL Fehler*) | ✅ JA |
| **DWD Warnung** | ⚠️ Lädt (oft SSL Fehler*) | ✅ JA |

*\*Hinweis: Alte Android-Versionen kennen die modernen SSL-Zertifikate von Open-Meteo und BrightSky nicht mehr. Der Code stürzt nicht ab (dank V83.1 Fix), aber die Daten werden eventuell nicht empfangen. Der Welt-Ticker (OpenWeatherMap) funktioniert jedoch meistens.*

---

## 🛠️ Technik & APIs

Das Projekt basiert auf **Vanilla JavaScript (ES5), HTML5 und CSS3**. Es werden keine Frameworks benötigt.

- **Wetter-Daten:** [OpenWeatherMap API](https://openweathermap.org/)
- **Schnee & Marine:** [Open-Meteo API](https://open-meteo.com/)
- **Warnungen:** [BrightSky API](https://brightsky.dev/) (DWD-Daten)

---

## 📥 Installation

1.  Repository klonen oder als ZIP herunterladen.
2.  Dateien (`index.html`, `style.css`, `script.js`, `logo.mp4`, `logo.png`, `version.json`) in einen Webordner legen.
3.  **Wichtig:** Das Tablet muss die Seite über einen Webserver aufrufen (nicht als lokale Datei `file://`), damit Sicherheitsrichtlinien greifen.
4.  Im Menü den eigenen Standort (Stadt) eingeben.
5.  Fertig!

---

## 📜 Lizenz & Credits

**Code & Design:** Code-Werft / Piratkarl (2026)  
**Lizenz:** MIT License (Open Source)  
**Support:** Wenn dir das Projekt gefällt, spendier mir einen Kaffee! ☕
