# 🌦️ Aura Wetterstation (Web-App)

**Version:** 81.0 (Direct-Menu Edition)  
**Status:** Stable (Production Ready)  
**Autor:** Code-Werft / Piratkarl  

Eine hochmoderne, webbasierte Wetterstation, optimiert für den **24/7-Betrieb auf Tablets**.  
Entwickelt, um sowohl auf **neuesten High-End-Geräten** als auch auf **älteren Android-Tablets** (Legacy-Support) stabil zu laufen.

---

## ✨ Features

### 🌍 1. Live-Wetter Dashboard
- **Anzeige:** Großes Temperatur-Display, Gefühlte Temp, Wind, Feuchtigkeit, Sichtweite, Luftdruck.
- **Design:** Dark Mode (OLED-freundlich) mit Neon-Cyan Akzenten (#00eaff).
- **Icons:** Vektorgrafiken (SVG) mit sanften Animationen (Regen, Schnee, Sonne).

### 🚀 2. Multi-Ticker System (NEU in V80+)
Ein intelligentes Laufband am unteren Bildschirmrand mit drei wählbaren Modi:
1.  **🌍 Welt-Metropolen (Standard):** Zeigt Wetter & Zeit von New York, Tokio, Sydney etc.
    * *Kompatibel mit ALLEN Geräten (auch Android < 7).*
2.  **❄️ Schnee-Bericht (Winter-Modus):** Zeigt aktuelle Schneehöhen der Top 15 Skigebiete (z.B. Winterberg, Zugspitze, Ischgl).
    * *Benötigt Android 7.1+ (SSL Let's Encrypt Support).*
3.  **🌊 Bade-Wetter (Sommer-Modus):** Zeigt Wassertemperaturen der Top 15 Urlaubsziele (z.B. Sylt, Mallorca, Adria).
    * *Benötigt Android 7.1+ (SSL Let's Encrypt Support).*

### ⚠️ 3. DWD-Unwetterwarnungen
- **Quelle:** Deutscher Wetterdienst (via BrightSky API).
- **Funktion:** Auto-Hide Monitor (blendet sich nur ein, wenn wirklich eine Warnung vorliegt).
- **Farb-Code:** Cyan (Info) -> Gelb -> Orange -> Rot (Extremwetter).
* *Benötigt Android 7.1+.*

### ⚙️ 4. Intelligente Steuerung
- **Direct-Menu Architektur (V81.0):** Menü ist direkt im Code integriert – keine Ladeverzögerung, keine Cache-Fehler mehr.
- **Ruhemodus:** Zeitgesteuerte Abdunklung des Displays (Sleep-Mode) für die Nacht.
- **Akku-Wächter:** Überwacht den Ladestand und warnt bei kritischer Entladung (Lauftext rot).

---

## 🛠️ Technik & APIs

Das Projekt basiert auf reinem **Vanilla JavaScript, HTML5 und CSS3**. Es werden keine Frameworks (React, Vue, etc.) benötigt, um maximale Performance auf alter Hardware zu garantieren.

- **Wetter-Daten:** [OpenWeatherMap API](https://openweathermap.org/) (Kostenlos)
- **Schnee & Marine:** [Open-Meteo API](https://open-meteo.com/) (Kostenlos, keine Key-Pflicht)
- **Warnungen:** [BrightSky API](https://brightsky.dev/) (DWD-Daten)

---

## 📱 Kompatibilität & Legacy Support

Dieses Projekt wurde speziell gehärtet, um auch auf "Elektroschrott" noch nützlich zu sein.

| Feature | Android 4.4 - 7.0 | Android 7.1 - 14+ |
| :--- | :---: | :---: |
| **Basis-Wetter** | ✅ JA | ✅ JA |
| **Welt-Ticker** | ✅ JA | ✅ JA |
| **Uhr & Video** | ✅ JA | ✅ JA |
| **Schneehöhen** | ❌ NEIN (SSL Fehler) | ✅ JA |
| **Wassertemp.** | ❌ NEIN (SSL Fehler) | ✅ JA |
| **DWD Warnung** | ❌ NEIN (SSL Fehler) | ✅ JA |

*Hinweis: Im Menü werden Nutzer auf alten Geräten durch weiße Warnhinweise informiert, warum bestimmte Spezial-Daten nicht laden.*

---

## 📥 Installation

1.  Repository klonen oder als ZIP herunterladen.
2.  Dateien (`index.html`, `style.css`, `script.js`, `logo.mp4`, `logo.png`, `version.json`) in einen Webordner legen.
3.  **Wichtig:** Das Tablet muss die Seite über einen Webserver aufrufen (nicht als lokale Datei), damit die Sicherheitsrichtlinien der Browser greifen.
4.  Im Menü den eigenen Standort (Stadt) eingeben.
5.  Fertig!

---

## 📜 Lizenz & Credits

**Code & Design:** Code-Werft / Piratkarl (2026)  
**Lizenz:** MIT License (Open Source)  
**Support:** Wenn dir das Projekt gefällt, spendier mir einen Kaffee! ☕ 
