// AURA WEATHER MASTER SCRIPT V1.63
var API_KEY = '518e81d874739701f08842c1a55f6588';

// Lade Einstellungen oder nutze Standards
var city = localStorage.getItem('selectedCity') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart') || '22:00';
var sEnd = localStorage.getItem('sleepEnd') || '06:00';

var timeOffset = 0; 
var isActivated = false;
var tickerData = { main: "Warte auf Start...", wind: "", uv: "", forecast: "", astro: "" };
var tickerIndex = 0;

function z(n) { return (n < 10 ? '0' : '') + n; }

// Hilfsfunktion: Wandelt "HH:mm" in Minuten seit 00:00 Uhr um
function timeToMins(t) {
    if(!t || t.indexOf(':') === -1) return 0;
    var p = t.split(':');
    return (parseInt(p[0], 10) * 60) + parseInt(p[1], 10);
}

// HAUPT-UHR UND NACHTMODUS STEUERUNG
function updateClock() {
    var now = new Date(Date.now() + timeOffset);
    var h = now.getHours();
    var m = now.getMinutes();
    var curStr = z(h) + ":" + z(m);
    var nowMins = (h * 60) + m;
    
    // Uhrzeitanzeige
    var elClock = document.getElementById('clock');
    if(elClock) elClock.innerText = curStr;
    
    var elDate = document.getElementById('date');
    if(elDate) elDate.innerText = now.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });

    // --- NACHTMODUS LOGIK ---
    var startMins = timeToMins(sStart);
    var endMins = timeToMins(sEnd);
    var isSleepTime = false;

    // Prüfe ob Nachtzeit über Mitternacht geht (z.B. 22:00 bis 06:00)
    if (startMins > endMins) {
        if (nowMins >= startMins || nowMins < endMins) isSleepTime = true;
    } else {
        // Gleicher Tag (z.B. 13:00 bis 15:00)
        if (nowMins >= startMins && nowMins < endMins) isSleepTime = true;
    }

    var overlay = document.getElementById('night-overlay');
    var video = document.getElementById('wake-video');

    if (overlay) {
        if (isSleepTime) {
            // NACHT: Overlay zeigen, Video pausieren (System darf schlafen)
            overlay.style.display = 'flex'; // 'flex' für Zentrierung
            document.getElementById('night-clock').innerText = curStr;
            if(video) video.pause();
        } else {
            // TAG: Overlay weg
            overlay.style.display = 'none';
            // Video abspielen, wenn Nutzer aktiviert hat
            if (isActivated && video && video.paused) {
                video.play();
            }
        }
    }
}

// TEST FUNKTION: Simuliert Nachtmodus für 5 Sekunden
function testNightMode() {
    var overlay = document.getElementById('night-overlay');
    overlay.style.display = 'flex';
    document.getElementById('night-clock').innerText = "TEST";
    
    setTimeout(function() {
        // Nach 5 Sek wieder die normale Uhr-Logik greifen lassen
        overlay.style.display = 'none';
        updateClock(); 
        alert("Test beendet. Wenn der Bildschirm schwarz war, ist alles okay!");
    }, 5000);
}

// ERSTER START DURCH NUTZER
function activateWakeLock() {
    var v = document.getElementById('wake-video');
    v.play().catch(function(e){ console.log("Autoplay prevented"); });
    
    if (!isActivated) {
        // Versuche Vollbild
        var el = document.documentElement;
        if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
        else if (el.requestFullscreen) el.requestFullscreen();

        document.getElementById('wake-status').style.backgroundColor = '#00ffcc'; // Grün/Cyan
        isActivated = true;
        fetchWeather();
    }
}

// DATEN HOLEN (OpenWeatherMap)
function fetchWeather() {
    if(!isActivated) return; // Nur laden wenn aktiv
    
    var xhr = new XMLHttpRequest();
    var url = "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(city) + "&appid=" + API_KEY + "&units=metric&lang=de";
    
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var d = JSON.parse(xhr.responseText);
            
            // Serverzeit nutzen für Sync
            var sTime = xhr.getResponseHeader('Date');
            if(sTime) timeOffset = new Date(sTime).getTime() - Date.now();
            
            // UI Update
            document.getElementById('temp-display').innerText = Math.round(d.main.temp);
            document.getElementById('city-title').innerText = d.name.toUpperCase();
            
            var iconCode = d.weather[0].icon;
            document.getElementById('main-icon-container').innerHTML = '<img src="https://openweathermap.org/img/wn/' + iconCode + '@2x.png" width="100">';
            
            // Gefühlte Farbe
            var feel = Math.round(d.main.feels_like);
            var feelColor = (feel < 10) ? '#00aaff' : (feel > 25 ? '#ff4d4d' : '#ccc');
            var elFeel = document.getElementById('feels-like');
            elFeel.innerText = "GEFÜHLT " + feel + "°";
            elFeel.style.color = feelColor;

            // Astro Werte
            var rise = new Date((d.sys.sunrise + d.timezone - 3600) * 1000); // Einfache Korrektur
            var set = new Date((d.sys.sunset + d.timezone - 3600) * 1000);
            document.getElementById('sunrise-val').innerText = z(rise.getHours()) + ":" + z(rise.getMinutes());
            document.getElementById('sunset-val').innerText = z(set.getHours()) + ":" + z(set.getMinutes());
            
            // Ticker füllen
            tickerData.main = d.weather[0].description.toUpperCase();
            tickerData.wind = "WIND: " + Math.round(d.wind.speed * 3.6) + " KM/H";
            tickerData.astro = "LUFTDRUCK: " + d.main.pressure + " hPa";
            
            updateTicker();
            fetchForecast(d.coord.lat, d.coord.lon);
        }
    };
    xhr.send();
}

// 5-TAGE VORHERSAGE UND HOURLY
function fetchForecast(lat, lon) {
    var xhr = new XMLHttpRequest();
    // OneCall API 2.5 oder 3.0 (Hier nutzen wir Standard 5 Day Forecast als Fallback, da OneCall oft Kreditkarte braucht)
    // Wir nutzen hier den "Forecast" Endpoint, der ist kostenlos und einfacher
    var url = "https://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon + "&appid=" + API_KEY + "&units=metric&lang=de";
    
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

function renderHourly(list) {
    var html = "<tr>";
    // Zeige die nächsten 4 Einträge (alle 3 Stunden)
    for(var i=0; i<4; i++) {
        var item = list[i];
        var time = new Date(item.dt * 1000);
        var h = z(time.getHours());
        html += '<td class="f-item">';
        html += '<div class="f-time">' + h + ' UHR</div>';
        html += '<img class="f-icon-img" src="https://openweathermap.org/img/wn/' + item.weather[0].icon + '.png">';
        html += '<div class="f-temp-line">' + Math.round(item.main.temp) + '°</div>';
        html += '</td>';
    }
    html += "</tr>";
    document.getElementById('hourly-table').innerHTML = html;
}

function renderDaily(list) {
    // Einfache Logik: Nimm jeden 8. Eintrag (24h / 3h = 8)
    var html = "<tr>";
    var count = 0;
    for(var i=7; i<list.length; i+=8) {
        if(count >= 4) break; // Nur 4 Tage
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
    var txt = tickerData.main + "  +++  " + tickerData.wind + "  +++  " + tickerData.astro + "  +++  " + city.toUpperCase();
    t.innerText = txt;
}

// EINSTELLUNGEN
function toggleSettings() { 
    var s = document.getElementById('settings-overlay');
    if(s.style.display === 'block') {
        s.style.display = 'none';
    } else {
        s.style.display = 'block';
        // Werte laden
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
    city = document.getElementById('city-input').value;
    sStart = document.getElementById('s-start').value;
    sEnd = document.getElementById('s-end').value;
    
    localStorage.setItem('selectedCity', city); 
    localStorage.setItem('sleepStart', sStart); 
    localStorage.setItem('sleepEnd', sEnd); 
    
    location.reload(); 
}

// INTERVALLE STARTEN
setInterval(updateClock, 1000); // Jede Sekunde Zeit prüfen
setInterval(fetchWeather, 300000); // Alle 5 Min Wetter
updateClock(); // Sofortiger Start