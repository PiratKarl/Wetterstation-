<p align="center">
  <img src="logo.png" width="500">
</p>

# ⚓ Code-Werft Wetterstation (Aura)

![Version](https://img.shields.io/badge/Version-73.0-00eaff?style=for-the-badge) ![Status](https://img.shields.io/badge/Status-Stable-success?style=for-the-badge) ![Tech](https://img.shields.io/badge/Tech-HTML5%20%7C%20CSS3%20%7C%20JS-yellow?style=for-the-badge)

Eine hochoptimierte, webbasierte Wetterstation, speziell entwickelt für das **Upcycling älterer Android-Tablets** zur Wandmontage. Das Design ist ein futuristischer "Dark Mode" mit hohem Kontrast (Cyan/Schwarz), optimiert für dauerhafte Lesbarkeit und minimale Hardware-Belastung.

---

## ✨ Features (V73.0)

### 🌤 Wetter & Klima
* **Echtzeit-Wetterdaten:** Abruf via **OpenWeatherMap API** (Temperatur, Feuchtigkeit, Luftdruck, Sichtweite).
* **Amtliche Unwetterwarnungen (DWD):** **NEU in V73!** Direkte Integration der **BrightSky API** für offizielle Warnungen des Deutschen Wetterdienstes (keine Simulation mehr!).
* **Präzise Vorhersage:**
    * 5-Stunden-Trend (stündlich).
    * 5-Tage-Trend (inkl. Min/Max & Regenwahrscheinlichkeit).
* **Deep Data:** Detaillierte Anzeige von Wind (Richtung/Speed), gefühlter Temperatur, Regenmenge (mm) und Mondphasen.

### 🎨 Design & UI
* **Layout V73:** Perfekte Symmetrie zwischen Standort, Sensordaten und dem Warn-Monitor.
* **Smart Icons:** Animierte SVG-Wettericons (Sonne pulsiert, Wolken ziehen, Regen fällt).
* **Welt-Ticker:** Laufschrift mit Live-Wetter aus 25 Metropolen weltweit.
* **Video-Background:** Dezent animiertes Logo im Herzschlag-Rhythmus.

### ⚙️ System & Hardware
* **Battery Guard:** Überwacht den Ladestand des Tablets und warnt optisch bei kritischer Entladung (z.B. bei Stromausfall).
* **Smart Sleep:** Konfigurierbarer Ruhemodus (Display dimmt automatisch zu eingestellten Uhrzeiten schwarz, um das Panel zu schonen).
* **Resilient:** Automatische Fehlerbehandlung bei Netzwerkverlust (Offline-Modus) und Video-Fallback.
* **No Frameworks:** Reines Vanilla JS und CSS für maximale Performance auf alter Hardware (kein React/Vue/Angular Overhead).

---

## 🚀 Installation

Das Projekt benötigt keinen Build-Prozess (kein NPM, kein Webpack). Es ist "Ready-to-Run".

1.  Repository klonen:
    ```bash
    git clone [https://github.com/DEIN-USERNAME/aura-wetterstation.git](https://github.com/DEIN-USERNAME/aura-wetterstation.git)
    ```
2.  Anpassungen in der `script.js` vornehmen (optional):
    * `apiKey`: Deinen eigenen OpenWeatherMap Key eintragen.
    * `city`: Standard-Stadt (Fallback, falls LocalStorage leer ist).
3.  Die Datei `index.html` in einem modernen Browser (Chrome/Firefox/WebView) öffnen.
4.  Für den **Kiosk-Modus** auf Tablets:
    * App wie "Fully Kiosk Browser" nutzen.
    * Oder "Zum Startbildschirm hinzufügen" (iOS/Android).

---

## 🛠 Konfiguration

Die Einstellungen können direkt über das Zahnrad-Menü (**⚙ MENÜ**) in der App vorgenommen werden. Die Daten werden lokal im Browser (`localStorage`) gespeichert:

* **Standort:** Stadtname für Wetterdaten.
* **Schlafmodus:** Start- und Endzeit (z.B. 22:00 bis 06:00 Uhr).

---

## 📜 Changelog

### V73.0 (Aktuell)
* **CORE:** Umstellung des Warn-Monitors auf **BrightSky API**. Es werden nun echte, amtliche Warnungen des DWD basierend auf Geokoordinaten angezeigt.
* **UI:** Warn-Monitor Layout angepasst (Breite erhöht, Position zentriert zwischen Header und Menü).

### V72.0
* **UI:** Layout-Symmetrie fixiert.
* **UI:** "Gefühlte Temperatur" in neuen Daten-Stapel integriert (mit Thermometer-Icon).

### V68.0 - V71.0
* **Engine:** Umbau auf "Layout Revolution Engine".
* **Feature:** Sichtweite (Visibility) hinzugefügt.
* **Feature:** Batterie-Trendanzeige (steigend/fallend).

---

## 👨‍💻 Autor & Copyright

**Code-Werft**
Entwickelt von **Karl Altmannshofer (Piratkarl)**.
© 2026 Alle Rechte vorbehalten.

*Projektstatus: Aktiv in Entwicklung*
