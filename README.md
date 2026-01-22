<p align="center">
  <img src="logo.png" width="500">
</p>

Aura Weather OS – Legacy Edition

​Gib deinem alten Tablet oder Handy ein zweites Leben als professionelle Wetterstation.
​Dieses Projekt wurde speziell entwickelt, um auf älterer Hardware (z. B. Samsung Galaxy Tabs der frühen Generationen) stabil, flüssig und vor allem lesbar zu laufen. Während moderne Wetter-Apps oft zu viel Rechenleistung fressen, setzt Aura Weather OS auf hocheffizientes HTML5, CSS-Tabellen-Logik und ein Design, das man auch aus 5 Metern Entfernung noch erkennt.
​✨ Hauptfunktionen
​Massive Anzeige: Uhrzeit und Temperatur sind für maximale Sichtbarkeit optimiert (7rem+).
​Dynamische Gefühlte Temperatur: Erscheint nur bei Abweichungen (Rot bei Hitze, Blau bei Kälte).
​** Beaufort-Wind-Ticker:** Echtzeit-Winddaten inkl. Himmelsrichtung und textueller Bezeichnung (z. B. „Steifer Wind“).
​Astro-Widget: Übergroße Sonnenauf- und -untergangszeiten sowie Mondphasen-Berechnung.
​Legacy Forecast: 5-Stunden-Vorschau und 5-Tages-Vorschau inklusive echter Höchst- und Tiefstwerte.
​Auto-Update: Aktualisiert alle 5 Minuten völlig selbstständig.
​🛠️ Tricks für alte Handys & Tablets (Legacy Hacks)
​Alte Geräte haben oft "zickige" Browser oder schwache Akkus. Hier sind die besten Kniffe, die in diesem Code integriert sind oder am Gerät eingestellt werden sollten:
​1. Der "Standort-Force-Reload"
​Alte Browser hängen oft im Cache fest. Unsere App nutzt einen "Harten Reload":
​Wenn du den Standort änderst, erzwingt das Skript einen kompletten Neuaufruf der URL. Das löscht den alten Cache und zwingt das Tablet, die neuen Daten sofort anzuzeigen.
​2. "Stay Awake" – Das Display niemals ausschalten
​Damit deine Wetterstation permanent leuchtet:
​Android Entwickleroptionen: Gehe zu Einstellungen > Telefoninfo und tippe 7x auf Buildnummer. In den neuen Entwickleroptionen aktiviere "Wach bleiben" (Display geht beim Laden nie aus).
​WakeLock API: Der Code enthält eine integrierte wakeLock-Funktion, die versucht, den Browser daran zu hindern, das Display abzuschalten.
​3. Web-App statt Browser
​Nutze Chrome auf dem Tablet:
​Öffne die URL deiner GitHub Page.
​Tippe auf die drei Punkte (Menü) oben rechts.
​Wähle "Zum Startbildschirm hinzufügen".
Vorteil: Die App startet nun im Vollbild ohne störende Adressleiste oder Tabs.
​4. CSS Legacy Mode
​Anstelle von modernem "CSS Grid" nutzt diese App klassische Table-Layouts und Floats. Warum? Weil alte Android-Webviews (vor 2016) modernes Grid-Design oft völlig zerschießen.
​📊 Technische Daten (Wind-Logik)
​Die App nutzt die Beaufort-Skala, um Windstärken verständlich zu machen:

Windgeschwindigkeit Bezeichnung
< 1 km/h Windstille
1 - 11 km/h Leichte Brise
12 - 28 km/h Mäßiger Wind
29 - 49 km/h Frischer bis steifer Wind
50 - 74 km/h Stürmischer Wind / Sturm
> 75 km/h Orkanartiger Sturm / Orkan

🚀 Installation
​Erstelle ein GitHub-Repository.
​Lade index.html, style.css und script.js hoch.
​Trage deinen eigenen API-Key von OpenWeatherMap in der script.js ein.
​Aktiviere GitHub Pages in den Einstellungen deines Repositories.
​Link auf dem Tablet aufrufen – fertig!
​Entwickelt für: Nachhaltigkeit und die Liebe zu alter Hardware. 🌍♻️
