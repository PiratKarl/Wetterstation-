/* --- AURA V1.0 (STABLE) - MASTER ENGINE --- */
/* Entwicklung: Code-Werft / Piratkarl */

// 1. KONFIGURATION & BETRIEBSSYSTEM
var API_KEY = "518e81d874739701f08842c1a55f6588"; 
var VERSION = "1.0"; // Diese Version
var CITY = localStorage.getItem("aura_city") || "Braunschweig";
var TICKER_MODE = localStorage.getItem("aura_ticker") || "world";

// Globale Variablen für System-Status
var timeOffset = 0; 
var isSleeping = false;
var lastUpdateCheck = 0;

// 2. INITIALISIERUNG BEIM LADEN
window.onload = function() {
    console.log("Aura V1.0 wird geladen...");
    
    // Einstellungen aus dem LocalStorage laden
    var savedCity = localStorage.getItem("aura_city");
    if(savedCity) { 
        document.getElementById("inp-city-val").value = savedCity; 
        CITY = savedCity; 
    }
    
    var savedTicker = localStorage.getItem("aura_ticker");
    if(savedTicker) { 
        document.getElementById("inp-ticker-mode").value = savedTicker; 
        TICKER_MODE = savedTicker; 
    }

    // Erst-Start Check für das "Neu in V1.0" Popup
    if (localStorage.getItem("aura_version_installed") !== VERSION) {
        document.getElementById("update-msg").style.display = "block";
        localStorage.setItem("aura_version_installed", VERSION);
    }

    // Kontakt-Formular scharf schalten
    setupFormListener();
};

// 3. HAUPT-STARTFUNKTION (Wird durch Button ausgelöst)
function startApp() {
    document.getElementById("start-overlay").style.display = "none";
    
    // Sofortige Aktionen
    syncTime();      // Atomzeit holen
    checkUpdate();   // Server nach neuer Version fragen
    updateClock();   // Uhr sofort anzeigen
    getWeatherData(); // Wetter laden
    updateTicker();   // Ticker starten
    
    // Intervalle setzen (Millisekunden)
    setInterval(updateClock, 1000);         // Jede Sekunde Uhrzeit
    setInterval(getWeatherData, 600000);    // Alle 10 Min Wetter
    setInterval(checkUpdate, 3600000 * 6);  // Alle 6 Stunden Update-Check
    setInterval(syncTime, 43200000);        // Alle 12 Stunden Atomzeit-Sync
    setInterval(updateTicker, 300000);      // Alle 5 Min Ticker-Rotation
}

// 4. AUTO-UPDATE ENGINE (Prüft version.json auf deinem Server)
function checkUpdate() {
    var xhr = new XMLHttpRequest();
    // Cache-Busting mit Zeitstempel, damit das Tablet nicht die alte Datei nimmt
    xhr.open("GET", "version.json?nocache=" + new Date().getTime(), true);
    xhr.timeout = 10000;
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                // Wenn die Version auf dem Server ungleich dieser Version ist -> Neuladen!
                if (data.version !== VERSION) {
                    console.log("Update gefunden: " + data.version + ". Starte Refresh...");
                    setTimeout(function() {
                        location.reload(true); // Erzwingt Neuladen vom Server
                    }, 2000);
                } else {
                    console.log("System ist auf dem neuesten Stand.");
                }
            } catch(e) { console.log("Update-Check Fehler: " + e); }
        }
    };
    xhr.send();
}

// 5. ATOMZEIT-SYNCHRONISATION (Fix für Zeit-Drift auf alten Tablets)
function syncTime() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://worldtimeapi.org/api/timezone/Europe/Berlin", true);
    xhr.timeout = 8000;
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                var serverTime = new Date(data.datetime).getTime();
                var localTime = Date.now();
                timeOffset = serverTime - localTime;
                console.log("Zeit-Korrektur aktiv: " + timeOffset + "ms");
            } catch(e) {}
        }
    };
    xhr.send();
}

// 6. UHRZEIT, DATUM & DYNAMISCHE BEGRÜSSUNG
function updateClock() {
    // Aktuelle Zeit inklusive Atomzeit-Korrektur
    var now = new Date(Date.now() + timeOffset);
    var h = now.getHours();
    var m = now.getMinutes();
    
    // Uhr-Anzeige
    document.getElementById("clock").innerHTML = (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m);
    
    // Datum (Mit Jahr 2026)
    var days = ["SONNTAG", "MONTAG", "DIENSTAG", "MITTWOCH", "DONNERSTAG", "FREITAG", "SAMSTAG"];
    var months = ["JAN", "FEB", "MÄR", "APR", "MAI", "JUN", "JUL", "AUG", "SEP", "OKT", "NOV", "DEZ"];
    document.getElementById("date").innerHTML = days[now.getDay()] + ", " + now.getDate() + ". " + months[now.getMonth()] + " " + now.getFullYear();

    // Dynamische Begrüßung (Piratig/Werft-Style)
    var greet = "MOIN MOIN";
    if (h >= 5 && h < 11) greet = "GUTEN MORGEN";
    else if (h >= 11 && h < 14) greet = "MAHLZEIT";
    else if (h >= 14 && h < 18) greet = "SCHÖNEN TAG";
    else if (h >= 18 && h < 22) greet = "GUTEN ABEND";
    else greet = "GUTE NACHT";
    
    document.getElementById("greet-text").innerHTML = greet + ",";
    document.getElementById("city-sub").innerHTML = CITY;

    // Ruhemodus prüfen
    checkSleepMode(h, m);
}

// 7. WETTER-DATEN (OpenWeatherMap)
function getWeatherData() {
    var url = "https://api.openweathermap.org/data/2.5/weather?q=" + CITY + "&units=metric&lang=de&appid=" + API_KEY;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            
            // Hauptwerte
            document.getElementById("main-temp").innerHTML = Math.round(data.main.temp) + "°";
            document.getElementById("val-feels").innerHTML = Math.round(data.main.feels_like) + "°";
            document.getElementById("val-humidity").innerHTML = data.main.humidity;
            document.getElementById("val-wind").innerHTML = Math.round(data.wind.speed * 3.6); // m/s zu km/h
            
            // Haupt-Icon
            document.getElementById("main-icon").innerHTML = getIconSVG(data.weather[0].icon);
            
            // Astro-Daten
            document.getElementById("sunrise").innerHTML = formatTime(new Date(data.sys.sunrise * 1000));
            document.getElementById("sunset").innerHTML = formatTime(new Date(data.sys.sunset * 1000));
            
            // Sync-Zeitpunkt
            document.getElementById("last-update").innerHTML = "Sync: " + formatTime(new Date());

            // Koordinaten für die Deep-Data (UV/AQI) speichern
            localStorage.setItem("lat", data.coord.lat);
            localStorage.setItem("lon", data.coord.lon);
            
            // Weitere Daten holen
            getEnviroData();
            getForecast(data.coord.lat, data.coord.lon);
        }
    };
    xhr.send();
}

// 8. DEEP DATA (UV, LUFTQUALITÄT & MOND via Open-Meteo)
function getEnviroData() {
    var lat = localStorage.getItem("lat");
    var lon = localStorage.getItem("lon");
    if(!lat || !lon) return;

    // UV-Index & European AQI
    var url = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude="+lat+"&longitude="+lon+"&current=european_aqi,uv_index&timezone=auto";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            var d = JSON.parse(xhr.responseText).current;
            var uvEl = document.getElementById("val-uv");
            var aqiEl = document.getElementById("val-aqi");
            
            uvEl.innerHTML = d.uv_index.toFixed(1);
            aqiEl.innerHTML = d.european_aqi;

            // Ampel-Farben Logik
            uvEl.className = "cell-val " + (d.uv_index < 3 ? "val-green" : (d.uv_index < 6 ? "val-yellow" : "val-red"));
            aqiEl.className = "cell-val " + (d.european_aqi < 20 ? "val-green" : (d.european_aqi < 40 ? "val-yellow" : "val-red"));
        }
    };
    xhr.send();

    // Mond-Daten
    var mUrl = "https://api.open-meteo.com/v1/forecast?latitude="+lat+"&longitude="+lon+"&daily=moon_phase_illumination&timezone=auto&forecast_days=1";
    var mxhr = new XMLHttpRequest();
    mxhr.open("GET", mUrl, true);
    mxhr.onload = function() {
        if (mxhr.status === 200) {
            var p = Math.round(JSON.parse(mxhr.responseText).daily.moon_phase_illumination[0]);
            document.getElementById("moon-percent").innerHTML = "(" + p + "%)";
            document.getElementById("moon-phase").innerHTML = (p > 95 ? "VOLLMOND" : (p < 5 ? "NEUMOND" : "ZUNEHMEND"));
        }
    };
    mxhr.send();
}

// 9. FORECAST ENGINE (4x4 STRUKTUR)
function getForecast(lat, lon) {
    var url = "https://api.openweathermap.org/data/2.5/forecast?lat="+lat+"&lon="+lon+"&units=metric&lang=de&appid="+API_KEY;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            var list = JSON.parse(xhr.responseText).list;
            
            // REIHE 1: 4 STUNDEN VORHERSAGE
            var hHtml = "";
            for(var j=0; j<4; j++) {
                var hData = list[j];
                var hDate = new Date(hData.dt * 1000);
                hHtml += '<div class="f-item">';
                hHtml += '<div class="f-head" style="color:#00eaff; font-size:1.8vh;">'+hDate.getHours()+':00</div>';
                hHtml += '<div class="f-icon" style="height:7vh;">'+getIconSVG(hData.weather[0].icon)+'</div>';
                hHtml += '<div class="f-temp" style="font-size:3vh;">'+Math.round(hData.main.temp)+'°</div>';
                hHtml += '</div>';
            }
            document.getElementById("hourly-row").innerHTML = hHtml;

            // REIHE 2: 4 TAGE VORHERSAGE
            var dHtml = ""; 
            var dCount = 0;
            for(var i=0; i<list.length; i++) {
                var dData = list[i];
                var dDate = new Date(dData.dt * 1000);
                // Suche Mittagszeit für die nächsten 4 Tage
                if(dDate.getHours() >= 11 && dDate.getHours() <= 14 && dDate.getDate() !== new Date().getDate() && dCount < 4) {
                    var dName = ["SO","MO","DI","MI","DO","FR","SA"][dDate.getDay()];
                    dHtml += '<div class="f-item">';
                    dHtml += '<div class="f-head">'+dName+'</div>';
                    dHtml += '<div class="f-icon">'+getIconSVG(dData.weather[0].icon)+'</div>';
                    dHtml += '<div class="f-temp">'+Math.round(dData.main.temp)+'°</div>';
                    dHtml += '</div>';
                    dCount++;
                    i += 6; // Nächster Tag
                }
            }
            document.getElementById("daily-row").innerHTML = dHtml;
            
            // Regenwahrscheinlichkeit für Heute (Dashboard)
            document.getElementById("rain-val").innerHTML = Math.round(list[0].pop * 100) + "%";
        }
    };
    xhr.send();
}

// 10. TICKER LOGIK
function updateTicker() {
    var t = document.getElementById("ticker-text");
    if(TICKER_MODE === "world") {
        t.innerHTML = '<span class="t-item">+++ WELTWETTER +++ London: 12° ☁️ +++ New York: 18° ☀️ +++ Tokio: 22° 🌧️ +++ Sydney: 25° ☀️ +++ Paris: 14° ⛅ +++ Berlin: 11° ☁️ +++</span>';
    } else if(TICKER_MODE === "snow") {
        t.innerHTML = '<span class="t-item">❄️ ALPIN-REPORT: Zugspitze -12° (85cm Pulver) +++ St. Moritz -5° +++ Kitzbühel -2° +++ Arlberg: Schneefall +++</span>';
    } else {
        t.innerHTML = '<span class="t-item">🌊 MARITIM: Ostsee 18° (Ruhig) +++ Nordsee 16° (Windstärke 4) +++ Mallorca 26° (Sonnig) +++ Kanaren 24° +++</span>';
    }
}

// 11. HELFER-FUNKTIONEN (Icons, Zeit, Menü)
function formatTime(d) { return (d.getHours()<10?"0":"")+d.getHours()+":"+(d.getMinutes()<10?"0":"")+d.getMinutes(); }

function getIconSVG(code) {
    // Liefert das passende animierte SVG-Fragment
    if(code == "01d") return '<svg class="svg-icon"><circle cx="50%" cy="50%" r="28%" class="svg-sun"/></svg>';
    if(code == "01n") return '<svg class="svg-icon"><circle cx="50%" cy="50%" r="28%" class="svg-moon"/></svg>';
    if(code == "02d" || code == "02n") return '<svg class="svg-icon"><circle cx="40%" cy="40%" r="20%" class="svg-sun" style="opacity:0.6"/><ellipse cx="50%" cy="60%" rx="35%" ry="20%" class="svg-cloud"/></svg>';
    if(code == "03d" || code == "04d" || code == "03n" || code == "04n") return '<svg class="svg-icon"><ellipse cx="50%" cy="50%" rx="40%" ry="25%" class="svg-cloud"/></svg>';
    if(code == "09d" || code == "10d" || code == "09n" || code == "10n") return '<svg class="svg-icon"><ellipse cx="50%" cy="40%" rx="35%" ry="20%" class="svg-cloud-dark"/><line x1="40%" y1="60%" x2="35%" y2="80%" class="svg-rain"/><line x1="50%" y1="60%" x2="45%" y2="80%" class="svg-rain" style="animation-delay:0.2s"/></svg>';
    if(code == "11d" || code == "11n") return '<svg class="svg-icon"><ellipse cx="50%" cy="40%" rx="35%" ry="25%" class="svg-cloud-dark"/><polygon points="45,60 55,60 50,90" class="svg-bolt"/></svg>';
    if(code == "13d" || code == "13n") return '<svg class="svg-icon"><ellipse cx="50%" cy="40%" rx="35%" ry="20%" class="svg-cloud"/><circle cx="50%" cy="75%" r="3" class="svg-snow"/></svg>';
    return '<svg class="svg-icon"><line x1="20%" y1="50%" x2="80%" y2="50%" class="svg-mist"/></svg>';
}

// UI STEUERUNG
function openMenu() { document.getElementById("menu-modal").style.display = "block"; }
function closeMenu() { document.getElementById("menu-modal").style.display = "none"; }
function toggleAccordion(id) { 
    var x = document.getElementById(id); 
    x.style.display = (x.style.display === "block" ? "none" : "block"); 
}

function saveSettings() {
    localStorage.setItem("aura_city", document.getElementById("inp-city-val").value);
    localStorage.setItem("aura_ticker", document.getElementById("inp-ticker-mode").value);
    location.reload(); // Neustart zur Übernahme
}

function setupFormListener() {
    var f = document.getElementById("aura-contact-form");
    if(f) f.addEventListener("submit", function() {
        setTimeout(function() { 
            f.style.display = "none"; 
            document.getElementById("form-success-msg").style.display = "block"; 
        }, 500);
    });
}

function checkSleepMode(h, m) {
    var from = document.getElementById("inp-time-from").value;
    var to = document.getElementById("inp-time-to").value;
    if(!from || !to) return;
    
    var nowM = h * 60 + m;
    var startM = parseInt(from.split(":")[0]) * 60 + parseInt(from.split(":")[1]);
    var endM = parseInt(to.split(":")[0]) * 60 + parseInt(to.split(":")[1]);
    
    var sleep = (startM < endM ? (nowM >= startM && nowM < endM) : (nowM >= startM || nowM < endM));
    
    if(sleep && !isSleeping) toggleSleep(); 
    else if(!sleep && isSleeping) toggleSleep();
}

function toggleSleep() {
    var o = document.getElementById("sleep-overlay");
    o.style.display = (o.style.display === "block" ? "none" : "block");
    isSleeping = !isSleeping;
}