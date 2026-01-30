/* --- AURA V30.0 CORE ENGINE --- */

// KONFIGURATION
var VERSION = 30.0;
var API_KEY = '518e81d874739701f08842c1a55f6588'; // Dein Key
var city = localStorage.getItem('aura_city') || 'Braunschweig';

// ELEMENTE CACHEN
var ui = {
    clock: document.getElementById('clock'),
    date: document.getElementById('date'),
    city: document.getElementById('city-name'),
    temp: document.getElementById('temp'),
    desc: document.getElementById('desc'),
    icon: document.getElementById('weather-icon'),
    sunrise: document.getElementById('sunrise'),
    sunset: document.getElementById('sunset'),
    ticker: document.getElementById('ticker-content'),
    hourly: document.getElementById('hourly-row'),
    daily: document.getElementById('daily-row')
};

// 1. START-LOGIK (User Interaction für Audio/Video)
function startApp() {
    // Overlay ausblenden
    document.getElementById('start-overlay').style.display = 'none';
    
    // WACHHALTER: Hintergrund-Video starten (zwingt Tablet wach zu bleiben)
    var bgVid = document.getElementById('bg-wake-video');
    if(bgVid) { bgVid.play().catch(e => console.log("Wake-Video Fehler:", e)); }

    // LOGO: Herzschlag starten
    var logoVid = document.getElementById('logo-video');
    if(logoVid) { logoVid.play().catch(e => console.log("Logo-Video Fehler:", e)); }

    // Daten laden
    updateClock();
    loadWeather();
    loadTicker();

    // Intervalle setzen
    setInterval(updateClock, 1000);           // Uhrzeit jede Sekunde
    setInterval(loadWeather, 600000);         // Wetter alle 10 Min
    setInterval(checkUpdate, 300000);         // Update-Prüfung alle 5 Min
}

// 2. UHRZEIT & DATUM
function updateClock() {
    var now = new Date();
    var h = now.getHours(); var m = now.getMinutes();
    ui.clock.innerText = (h<10?'0':'')+h + ':' + (m<10?'0':'')+m;
    
    var days = ['SONNTAG','MONTAG','DIENSTAG','MITTWOCH','DONNERSTAG','FREITAG','SAMSTAG'];
    var months = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    ui.date.innerText = days[now.getDay()] + ", " + now.getDate() + ". " + months[now.getMonth()];
}

// 3. WETTER LADEN (API)
function loadWeather() {
    fetch("https://api.openweathermap.org/data/2.5/weather?q="+city+"&appid="+API_KEY+"&units=metric&lang=de")
    .then(r => r.json())
    .then(data => {
        // Aktuelles Wetter
        ui.city.innerText = data.name.toUpperCase();
        ui.temp.innerText = Math.round(data.main.temp) + "°";
        ui.desc.innerText = data.weather[0].description.toUpperCase();
        ui.icon.src = data.weather[0].icon + ".gif";
        
        // Astro
        var sr = new Date((data.sys.sunrise + data.timezone - 3600) * 1000);
        var ss = new Date((data.sys.sunset + data.timezone - 3600) * 1000);
        ui.sunrise.innerText = (sr.getHours()<10?'0':'')+sr.getHours() + ":" + (sr.getMinutes()<10?'0':'')+sr.getMinutes();
        ui.sunset.innerText = (ss.getHours()<10?'0':'')+ss.getHours() + ":" + (ss.getMinutes()<10?'0':'')+ss.getMinutes();

        // Vorhersage laden (braucht Koordinaten)
        loadForecast(data.coord.lat, data.coord.lon);
    })
    .catch(e => console.log("Wetter Fehler:", e));
}

function loadForecast(lat, lon) {
    fetch("https://api.openweathermap.org/data/2.5/forecast?lat="+lat+"&lon="+lon+"&appid="+API_KEY+"&units=metric&lang=de")
    .then(r => r.json())
    .then(data => {
        // A) STÜNDLICH (nächste 4 Einträge)
        var hHTML = "";
        for(var i=0; i<4; i++) {
            var item = data.list[i];
            var time = new Date(item.dt*1000).getHours() + "h";
            hHTML += `<div class="f-item">
                        <div class="f-time">${time}</div>
                        <img src="${item.weather[0].icon}.gif" class="f-icon">
                        <div class="f-temp">${Math.round(item.main.temp)}°</div>
                      </div>`;
        }
        ui.hourly.innerHTML = hHTML;

        // B) TÄGLICH (einfache Logik: Mittagswerte nehmen)
        var dHTML = "";
        var daysCount = 0;
        var usedDays = {};
        
        data.list.forEach(entry => {
            var dObj = new Date(entry.dt*1000);
            var dayName = dObj.toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase();
            // Wir nehmen einen Wert um ca 14 Uhr oder den ersten des Tages
            if(!usedDays[dayName] && dObj.getHours() >= 12 && daysCount < 4) {
                usedDays[dayName] = true;
                daysCount++;
                dHTML += `<div class="f-item">
                            <div class="f-time">${dayName}</div>
                            <img src="${entry.weather[0].icon}.gif" class="f-icon">
                            <div class="f-temp">${Math.round(entry.main.temp)}°</div>
                          </div>`;
            }
        });
        ui.daily.innerHTML = dHTML;
    });
}

// 4. WELT-TICKER
function loadTicker() {
    var cities = ["Berlin", "London", "New York", "Tokio", "Sydney", "Moskau", "Dubai", "Paris"];
    var text = "+++ AURA WETTERSTATION V" + VERSION + " +++ ONLINE +++ ";
    
    // Wir bauen den String rekursiv oder einfach nacheinander
    var promises = cities.map(c => 
        fetch("https://api.openweathermap.org/data/2.5/weather?q="+c+"&appid="+API_KEY+"&units=metric")
        .then(r => r.json())
        .catch(() => null)
    );

    Promise.all(promises).then(results => {
        results.forEach(res => {
            if(res) {
                text += " ◈ " + res.name.toUpperCase() + ": " + Math.round(res.main.temp) + "° ";
            }
        });
        ui.ticker.innerText = text;
    });
}

// 5. UPDATE-CHECK (Wichtig für Wartung ohne Aufstehen)
function checkUpdate() {
    // Zufallszahl ?t=... verhindert Cache, damit er das Update wirklich sieht
    fetch("version.json?t=" + Date.now())
    .then(r => r.json())
    .then(d => {
        if(d.version > VERSION) {
            // Neue Version gefunden! Seite neu laden
            location.reload(true);
        }
    })
    .catch(e => console.log("Update Check Fehler", e));
}

// 6. EINSTELLUNGEN
function openSettings() { document.getElementById('settings-modal').style.display = 'block'; }
function closeSettings() { document.getElementById('settings-modal').style.display = 'none'; }
function saveSettings() {
    var newVal = document.getElementById('city-input').value;
    if(newVal) {
        localStorage.setItem('aura_city', newVal);
        city = newVal;
        loadWeather();
        closeSettings();
    }
}