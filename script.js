// AURA WEATHER V2.0 FINAL - ANDROID 4.4 EDITION
// Entwickelt für Piratkarl - Digitaler Denkmalschutz

var API_KEY = '518e81d874739701f08842c1a55f6588';

// Standard-Werte laden (Sicherheits-Fallback)
var city = localStorage.getItem('selectedCity') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart') || '22:00';
var sEnd = localStorage.getItem('sleepEnd') || '06:00';

var timeOffset = 0; 
var isActivated = false;
// URL zum Video (dieses Video ist sehr klein und schont den Speicher)
var videoUrl = "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4";

// Speicher für Ticker-Daten
var tickerData = { main: "System Start...", wind: "", uv: "", forecast: "", astro: "" };

// Hilfsfunktion: Zahl mit führender Null (09 statt 9)
function z(n) { return (n < 10 ? '0' : '') + n; }

// Hilfsfunktion: Zeitstring in Minuten umwandeln
function timeToMins(t) {
    if(!t || t.indexOf(':') === -1) return 0;
    var p = t.split(':');
    return (parseInt(p[0], 10) * 60) + parseInt(p[1], 10);
}

// === DIE ZENTRALE UHR & STEUERUNG ===
function updateClock() {
    var now = new Date(Date.now() + timeOffset);
    var h = now.getHours();
    var m = now.getMinutes();
    var curStr = z(h) + ":" + z(m);
    var nowMins = (h * 60) + m;
    
    // UI aktualisieren
    if(document.getElementById('clock')) document.getElementById('clock').innerText = curStr;
    if(document.getElementById('date')) document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });

    // === NACHTMODUS LOGIK MIT 10 MINUTEN VORLAUF ===
    var startMins = timeToMins(sStart);
    var endMins = timeToMins(sEnd);
    
    // WICHTIG: Wir ziehen 10 Minuten ab! 
    // Wenn User 22:00 einstellt, schaltet App um 21:50 das Signal ab.
    var effectiveStart = startMins - 10;
    
    // Korrektur, falls wir über 0 Uhr zurückspringen (z.B. 00:05 -> 23:55)
    if (effectiveStart < 0) effectiveStart = 1440 + effectiveStart;

    var isSleepTime = false;

    // Zeitfenster-Prüfung
    if (effectiveStart > endMins) {
        // Fall: Nacht geht über Mitternacht (z.B. 21:50 bis 06:00)
        if (nowMins >= effectiveStart || nowMins < endMins) isSleepTime = true;
    } else {
        // Fall: Nacht ist am gleichen Tag (z.B. 01:00 bis 05:00)
        if (nowMins >= effectiveStart && nowMins < endMins) isSleepTime = true;
    }

    var overlay = document.getElementById('night-overlay');
    var video = document.getElementById('wake-video');

    if (overlay) {
        if (isSleepTime) {
            // >>> ES IST SCHLAFENSZEIT <<<
            
            // 1. Overlay zeigen (falls noch nicht da)
            if(overlay.style.display !== 'block') {
                overlay.style.display = 'block';
                document.getElementById('night-clock').innerText = curStr;
            } else {
                // Uhrzeit im Nachtmodus updaten
                document.getElementById('night-clock').innerText = curStr;
            }
            
            // 2. KILL SWITCH: Video entfernen
            // Wenn src leer ist, gibt Android den "Wachbleiben"-Modus frei.
            if(video.getAttribute('src') !== "") {
                video.pause();
                video.setAttribute('src', ""); 
                video.load(); // Wichtig: Load zwingt den Browser, den Puffer zu leeren
                console.log("Video Killed for Sleep Mode");
            }

        } else {
            // >>> ES IST WACHZEIT <<<
            
            // 1. Overlay verstecken
            if(overlay.style.display !== 'none') overlay.style.display = 'none';

            // 2. VIDEO WIEDERBELEBEN
            if (isActivated) {
                // Wenn Video leer ist (weil wir es nachts gelöscht haben), neu setzen
                if(video.getAttribute('src') === "") {
                    video.setAttribute('src', videoUrl);
                    video.load();
                }
                // Sicherstellen, dass es spielt
                if(video.paused) {
                    video.play().catch(function(e){ console.log("Play error", e); });
                }
            }
        }
    }
}

// === ERSTER START DURCH DEN NUTZER ===
function activateWakeLock() {
    var v = document.getElementById('wake-video');
    // Beim ersten Klick Video laden
    if(v.getAttribute('src') === "" || !v.getAttribute('src')) v.setAttribute('src', videoUrl);
    v.play();
    
    if (!isActivated) {
        // Versuche Vollbildmodus (verschiedene Browser-Prefixe)
        var el = document.documentElement;
        if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
        else if (el.requestFullscreen) el.requestFullscreen();

        // Status-Licht auf Cyan
        document.getElementById('wake-status').style.backgroundColor = '#00ffcc';
        isActivated = true;
        
        // Wetter sofort laden
        fetchWeather();
    }
}

// === WETTER DATEN LADEN (OpenWeatherMap) ===
function fetchWeather() {
    if(!isActivated) return; // Nur laden, wenn App aktiv ist
    
    var xhr = new XMLHttpRequest();
    // Cache-Buster anhängen (&t=...) damit alte Browser nicht cachen
    var url = "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(city) + "&appid=" + API_KEY + "&units=metric&lang=de&t=" + new Date().getTime();
    
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var d = JSON.parse(xhr.responseText);
            
            // UI Befüllen
            document.getElementById('temp-display').innerText = Math.round(d.main.temp);
            document.getElementById('city-title').innerText = d.name.toUpperCase();
            document.getElementById('main-icon-container').innerHTML = '<img src="https://openweathermap.org/img/wn/' + d.weather[0].icon + '@2x.png" width="90">';
            
            // Gefühlte Temperatur & Farbe
            var feel = Math.round(d.main.feels_like);
            var elFeel = document.getElementById('feels-like');
            elFeel.innerText = "GEFÜHLT " + feel + "°";
            if(feel < 10) elFeel.style.color = '#00aaff';      // Kalt -> Blau
            else if(feel > 25) elFeel.style.color = '#ff4d4d'; // Heiß -> Rot
            else elFeel.style.color = '#ccc';                  // Normal -> Grau

            // Astro-Daten (Sonnenauf/untergang)
            // Umrechnung Unix-Timestamp + Zeitzone
            var rise = new Date((d.sys.sunrise + d.timezone - 3600) * 1000); // -3600 Korrektur oft nötig bei OWM simple calc
            var set = new Date((d.sys.sunset + d.timezone - 3600) * 1000);
            
            // Einfache Formatierung
            if(document.getElementById('sunrise-val')) document.getElementById('sunrise-val').innerText = z(rise.getHours()) + ":" + z(rise.getMinutes());
            if(document.getElementById('sunset-val')) document.getElementById('sunset-val').innerText = z(set.getHours()) + ":" + z(set.getMinutes());
            
            // Ticker Daten
            tickerData.main = d.weather[0].description.toUpperCase();
            tickerData.wind = "WIND: " + Math.round(d.wind.speed * 3.6) + " KM/H"; // m/s in km/h
            tickerData.astro = "LUFTDRUCK: " + d.main.pressure + " hPa";
            
            updateTicker();
            
            // Vorhersage holen
            fetchForecast(d.coord.lat, d.coord.lon);
        }
    };
    xhr.send();
}

// === VORHERSAGE LADEN ===
function fetchForecast(lat, lon) {
    var xhr = new XMLHttpRequest();
    var url = "https://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon + "&appid=" + API_KEY + "&units=metric&lang=de&t=" + new Date().getTime();
    
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var d = JSON.parse(xhr.responseText);
            renderHourly(d.list);
            renderDaily(d.list);
        }
    };
    xhr.send();
}

// Rendert die nächsten Stunden
function renderHourly(list) {
    var html = "<tr>";
    // Nimm die nächsten 4 Einträge (alle 3 Stunden)
    for(var i=0; i<4; i++) {
        var item = list[i];
        var time = new Date(item.dt * 1000);
        html += '<td class="f-item">';
        html += '<div class="f-time">' + z(time.getHours()) + ' UHR</div>';
        html += '<img class="f-icon-img" src="https://openweathermap.org/img/wn/' + item.weather[0].icon + '.png">';
        html += '<div class="f-temp-line">' + Math.round(item.main.temp) + '°</div>';
        html += '</td>';
    }
    html += "</tr>";
    document.getElementById('hourly-table').innerHTML = html;
}

// Rendert die nächsten Tage (grob geschätzt alle 24h)
function renderDaily(list) {
    var html = "<tr>";
    var count = 0;
    // Wir springen in 8er Schritten (3h * 8 = 24h)
    // Start bei 7 (ca. morgen Mittag)
    for(var i=7; i<list.length; i+=8) {
        if(count >= 4) break; // Max 4 Tage
        var item = list[i];
        var dayName = new Date(item.dt * 1000).toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase();
        
        html += '<td class="f-item">';
        html += '<div class="f-day-name">' + dayName + '</div>';
        html += '<img class="f-icon-img" src="https://openweathermap.org/img/wn/' + item.weather[0].icon + '.png">';
        html += '<div class="f-temp-line">' + Math.round(item.main.temp) + '°</div>';
        html += '</td>';
        count++;
    }
    html += "</tr>";
    document.getElementById('daily-table').innerHTML = html;
}

function updateTicker() {
    var t = document.getElementById('info-ticker');
    // Baue den Lauftext zusammen
    t.innerText = tickerData.main + "  +++  " + tickerData.wind + "  +++  " + tickerData.astro + "  +++  " + city.toUpperCase();
}

// === EINSTELLUNGEN MENU ===
function toggleSettings() { 
    var s = document.getElementById('settings-overlay');
    // Wechseln zwischen anzeigen und verstecken
    if(s.style.display === 'block') {
        s.style.display = 'none';
    } else {
        s.style.display = 'block';
        // Aktuelle Werte in die Felder schreiben
        document.getElementById('city-input').value = city;
        document.getElementById('s-start').value = sStart;
        document.getElementById('s-end').value = sEnd;
    }
}

function toggleSub(id) { 
    var el = document.getElementById(id); 
    el.style.display = (el.style.display === 'block') ? 'none' : 'block'; 
}

function saveAll() { 
    // Werte auslesen
    city = document.getElementById('city-input').value;
    sStart = document.getElementById('s-start').value;
    sEnd = document.getElementById('s-end').value;
    
    // Speichern
    localStorage.setItem('selectedCity', city); 
    localStorage.setItem('sleepStart', sStart); 
    localStorage.setItem('sleepEnd', sEnd); 
    
    // Seite neu laden um alles anzuwenden
    location.reload(); 
}

// === START DER APP ===
// Uhr läuft jede Sekunde
setInterval(updateClock, 1000); 
// Wetter lädt alle 10 Minuten (600000ms) - API schonen
setInterval(fetchWeather, 600000);

// Einmaliger Start
updateClock();