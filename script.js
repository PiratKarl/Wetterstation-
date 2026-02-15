/* --- AURA V1.0 (STABLE) - ENGINE --- */
/* Entwickelt von der Code-Werft */

// KONFIGURATION
var API_KEY = "DEIN_OWM_KEY_HIER"; // <--- HIER DEINEN SCHLÜSSEL EINTRAGEN
var CITY = localStorage.getItem("aura_city") || "Braunschweig";
var TICKER_MODE = localStorage.getItem("aura_ticker") || "world";

// Globale Variablen
var weatherData = {};
var sleepTimer = null;
var isSleeping = false;
var lastUpdate = 0;
var timeOffset = 0; // Speichert die Abweichung zur Atomzeit

// SYSTEM START
window.onload = function() {
    // Lade gespeicherte Einstellungen
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

    // Version Check für Popup
    checkVersionIntro();

    // Formular Listener (für visuelles Feedback)
    setupFormListener();
};

function startApp() {
    document.getElementById("start-overlay").style.display = "none";
    
    // 1. Atomzeit holen (Sync)
    syncTime(); 

    // 2. Starte Uhren & Intervalle
    updateClock(); // Sofort einmal ausführen
    setInterval(updateClock, 1000); // Jede Sekunde aktualisieren
    
    // 3. Erster Daten-Abruf
    getWeatherData();
    getEnviroData(); // UV, AQI, Mond
    updateTicker();
    
    // 4. Intervalle für Updates setzen
    setInterval(getWeatherData, 600000); // Alle 10 Min Wetter
    setInterval(getEnviroData, 1800000); // Alle 30 Min Umwelt-Daten
    setInterval(checkDWD, 900000);       // Alle 15 Min Warnungen
    setInterval(updateTicker, 60000 * 5); // Alle 5 Min Ticker Update
    
    // NEU: Alle 12 Stunden Zeitabgleich (Atomzeit)
    setInterval(syncTime, 12 * 60 * 60 * 1000); 
}

function checkVersionIntro() {
    var curVer = "1.0";
    var oldVer = localStorage.getItem("aura_version");
    
    if (oldVer !== curVer) {
        // Zeige "Neu in Version 1.0"
        document.getElementById("update-msg").style.display = "block";
        localStorage.setItem("aura_version", curVer);
    }
}

// ATOMZEIT SYNCHRONISATION (NEU V1.0)
function syncTime() {
    // Fragt die Zeit ab, um Drift alter Tablets zu korrigieren
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://worldtimeapi.org/api/timezone/Europe/Berlin", true);
    xhr.timeout = 5000; // Nach 5 sek abbrechen
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                var serverTime = new Date(data.datetime).getTime();
                var localTime = Date.now();
                // Berechne Unterschied: Server - Lokal
                timeOffset = serverTime - localTime;
                console.log("Zeit synchronisiert. Korrektur: " + timeOffset + "ms");
            } catch(e) {
                console.log("Zeit-Sync Fehler (Parse): " + e);
            }
        }
    };
    xhr.onerror = function() { console.log("Zeit-Sync fehlgeschlagen (Offline?)"); };
    xhr.ontimeout = function() { console.log("Zeit-Sync Timeout"); };
    xhr.send();
}

// UHR & BEGRÜSSUNG (MIT ATOMZEIT KORREKTUR)
function updateClock() {
    // Wir nehmen die lokale Zeit + die Korrektur aus dem Internet
    var now = new Date(Date.now() + timeOffset);
    
    var h = now.getHours();
    var m = now.getMinutes();
    
    // Uhrzeit
    var timeStr = (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m);
    document.getElementById("clock").innerHTML = timeStr;
    
    // Datum MIT JAHR (V1.0)
    var days = ["SONNTAG", "MONTAG", "DIENSTAG", "MITTWOCH", "DONNERSTAG", "FREITAG", "SAMSTAG"];
    var months = ["JAN", "FEB", "MÄR", "APR", "MAI", "JUN", "JUL", "AUG", "SEP", "OKT", "NOV", "DEZ"];
    var dateStr = days[now.getDay()] + ", " + now.getDate() + ". " + months[now.getMonth()] + " " + now.getFullYear();
    document.getElementById("date").innerHTML = dateStr;

    // Dynamische Begrüßung (V1.0)
    var greet = "MOIN MOIN";
    if (h >= 5 && h < 11) greet = "GUTEN MORGEN";
    else if (h >= 11 && h < 14) greet = "MAHLZEIT";
    else if (h >= 14 && h < 18) greet = "SCHÖNEN TAG";
    else if (h >= 18 && h < 22) greet = "GUTEN ABEND";
    else greet = "GUTE NACHT";
    
    document.getElementById("greet-text").innerHTML = greet + ",";
    document.getElementById("city-sub").innerHTML = CITY; 

    // Prüfe Ruhemodus
    checkSleepMode(h, m);
}

// STANDARD WETTER (OWM)
function getWeatherData() {
    showLoader(true);
    var url = "https://api.openweathermap.org/data/2.5/weather?q=" + CITY + "&units=metric&lang=de&appid=" + API_KEY;
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            showLoader(false);
            if (xhr.status == 200) {
                var data = JSON.parse(xhr.responseText);
                renderCurrent(data);
                getForecast(data.coord.lat, data.coord.lon); 
                
                // Koordinaten speichern für Enviro-Daten
                localStorage.setItem("lat", data.coord.lat);
                localStorage.setItem("lon", data.coord.lon);
                getEnviroData(); // Umwelt-Daten aktualisieren
            }
        }
    };
    xhr.send();
}

function renderCurrent(data) {
    // Temp
    document.getElementById("main-temp").innerHTML = Math.round(data.main.temp) + "°";
    document.getElementById("val-feels").innerHTML = Math.round(data.main.feels_like) + "°";
    document.getElementById("val-humidity").innerHTML = data.main.humidity;
    
    // Wind
    var speed = Math.round(data.wind.speed * 3.6); // m/s zu km/h
    document.getElementById("val-wind").innerHTML = speed;
    
    // Icon
    var code = data.weather[0].icon;
    var iconHTML = getIconSVG(code);
    document.getElementById("main-icon").innerHTML = iconHTML;

    // Astro (Sonne)
    var rise = new Date(data.sys.sunrise * 1000);
    var set = new Date(data.sys.sunset * 1000);
    document.getElementById("sunrise").innerHTML = formatTime(rise);
    document.getElementById("sunset").innerHTML = formatTime(set);

    // Sync Zeit
    var now = new Date();
    document.getElementById("last-update").innerHTML = "Sync: " + formatTime(now);
}

// UMWELT & ASTRO DATEN (Open-Meteo) - V1.0 NEU
function getEnviroData() {
    var lat = localStorage.getItem("lat");
    var lon = localStorage.getItem("lon");
    
    if(!lat || !lon) return;

    // Wir nutzen Open-Meteo (Kostenlos, kein Key nötig) für UV & AQI
    var url = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=" + lat + "&longitude=" + lon + "&current=european_aqi,uv_index&timezone=auto";
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var data = JSON.parse(xhr.responseText);
            renderEnviro(data.current);
        }
    };
    xhr.send();

    // Mond Daten extra
    getMoonData(lat, lon);
}

function renderEnviro(data) {
    // UV Index
    var uv = data.uv_index;
    var uvEl = document.getElementById("val-uv");
    uvEl.innerHTML = uv.toFixed(1);
    
    // Farbe für UV
    uvEl.className = "cell-val"; 
    if(uv < 3) uvEl.classList.add("val-green");
    else if(uv < 6) uvEl.classList.add("val-yellow");
    else uvEl.classList.add("val-red");

    // AQI (Luftqualität)
    var aqi = data.european_aqi;
    var aqiEl = document.getElementById("val-aqi");
    aqiEl.innerHTML = aqi;

    // Farbe für AQI
    aqiEl.className = "cell-val"; 
    if(aqi < 20) aqiEl.classList.add("val-green");
    else if(aqi < 40) aqiEl.classList.add("val-yellow");
    else aqiEl.classList.add("val-red");
}

function getMoonData(lat, lon) {
    // Holt Mondphase & Beleuchtung
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&daily=moon_phase_illumination&timezone=auto&forecast_days=1";
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var data = JSON.parse(xhr.responseText);
            var percent = data.daily.moon_phase_illumination[0];
            
            document.getElementById("moon-percent").innerHTML = "(" + Math.round(percent) + "%)";
            
            var ph = "ZUNEHMEND";
            if(percent > 95) ph = "VOLLMOND";
            else if(percent < 5) ph = "NEUMOND";
            
            document.getElementById("moon-phase").innerHTML = ph;
        }
    };
    xhr.send();
}

// 5-TAGE VORHERSAGE
function getForecast(lat, lon) {
    var url = "https://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon + "&units=metric&lang=de&appid=" + API_KEY;
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var data = JSON.parse(xhr.responseText);
            renderForecast(data);
        }
    };
    xhr.send();
}

function renderForecast(data) {
    var list = data.list;
    var dailyHtml = "";
    var count = 0;
    
    for(var i=0; i < list.length; i++) {
        var item = list[i];
        var date = new Date(item.dt * 1000);
        var now = new Date();
        
        // Nur Einträge um ca. 12-15 Uhr nehmen und nicht heute
        if(date.getHours() >= 11 && date.getHours() <= 14 && date.getDate() !== now.getDate()) {
            if(count >= 3) break; 
            
            var dayName = getDayShort(date.getDay());
            var icon = getIconSVG(item.weather[0].icon);
            var temp = Math.round(item.main.temp);
            var pop = Math.round(item.pop * 100); 
            
            dailyHtml += '<div class="f-item">';
            dailyHtml += '<div class="f-head">' + dayName + '</div>';
            dailyHtml += '<div class="f-icon">' + icon + '</div>';
            dailyHtml += '<div class="f-temp">' + temp + '°</div>';
            if(pop > 10) {
                 dailyHtml += '<div class="f-rain-row"><svg class="f-drop-small" viewBox="0 0 24 24"><path d="M12 2c-3 5-8 10-8 15 0 4 3 8 8 8s8-4 8-8c0-5-5-10-8-15z"/></svg><span style="font-size:1.8vh; color:#00eaff;">' + pop + '%</span></div>';
            }
            dailyHtml += '</div>';
            
            count++;
            i += 4; 
        }
    }
    
    document.getElementById("daily-row").innerHTML = dailyHtml;
    
    var todayPop = Math.round(list[0].pop * 100);
    document.getElementById("rain-val").innerHTML = todayPop + "%";
}

// DWD WARNUNGEN (PULSIEREND)
function checkDWD() {
    var warnBox = document.getElementById("dwd-monitor");
    var warnText = document.getElementById("dwd-text");
    
    // Reset
    warnBox.style.display = "none";
    warnBox.className = ""; 
    
    // Platzhalter für Warn-Logik
    // Wenn Warnung da: warnBox.style.display = "block";
}

// TICKER LOGIK
function updateTicker() {
    var t = document.getElementById("ticker-text");
    var mode = TICKER_MODE;
    
    if(mode === "world") {
        t.innerHTML = '<span class="t-item">+++ WELTWETTER +++</span><span class="t-item">London: 12° ☁️</span><span class="t-item">New York: 18° ☀️</span><span class="t-item">Tokio: 22° 🌧️</span><span class="t-item">Sydney: 25° ☀️</span>';
    } else if (mode === "snow") {
        t.innerHTML = '<span class="t-item">❄️ ALPEN REPORT: Zugspitze -12° (80cm)</span><span class="t-item">St. Moritz -5° (Pulver)</span><span class="t-item">Kitzbühel -2° (Neu: 10cm)</span>';
    } else if (mode === "summer") {
        t.innerHTML = '<span class="t-item">🌊 MEERES-WETTER: Ostsee 19° (Ruhig)</span><span class="t-item">Nordsee 17° (Windig)</span><span class="t-item">Mallorca 28° (Sonnig)</span>';
    }
}

// HELFER
function showLoader(show) {
    document.getElementById("loader").style.display = show ? "block" : "none";
}

function formatTime(date) {
    var h = date.getHours();
    var m = date.getMinutes();
    return (h<10?"0"+h:h) + ":" + (m<10?"0"+m:m);
}

function getDayShort(d) {
    var days = ["SO","MO","DI","MI","DO","FR","SA"];
    return days[d];
}

// SVG ICONS
function getIconSVG(code) {
    var icon = "";
    if(code == "01d") icon = '<svg class="svg-icon icon-real"><use href="#gradSunReal"/><circle cx="50%" cy="50%" r="28%" class="svg-sun" /></svg>';
    else if(code == "01n") icon = '<svg class="svg-icon icon-real"><use href="#gradMoonReal"/><circle cx="50%" cy="50%" r="28%" class="svg-moon" /></svg>';
    else if(code == "02d" || code == "02n") icon = '<svg class="svg-icon icon-real"><circle cx="40%" cy="40%" r="20%" class="svg-sun" style="opacity:0.8"/><ellipse cx="50%" cy="60%" rx="35%" ry="20%" class="svg-cloud" /></svg>';
    else if(code == "03d" || code == "03n" || code == "04d" || code == "04n") icon = '<svg class="svg-icon icon-real"><ellipse cx="50%" cy="50%" rx="40%" ry="25%" class="svg-cloud" /></svg>';
    else if(code == "09d" || code == "09n" || code == "10d" || code == "10n") icon = '<svg class="svg-icon icon-real"><ellipse cx="50%" cy="40%" rx="35%" ry="20%" class="svg-cloud-dark" /><line x1="40%" y1="60%" x2="35%" y2="80%" class="svg-rain" /><line x1="50%" y1="60%" x2="45%" y2="80%" class="svg-rain" style="animation-delay:0.2s" /><line x1="60%" y1="60%" x2="55%" y2="80%" class="svg-rain" style="animation-delay:0.4s" /></svg>';
    else if(code == "11d" || code == "11n") icon = '<svg class="svg-icon icon-real"><ellipse cx="50%" cy="40%" rx="35%" ry="25%" class="svg-cloud-dark" /><polygon points="45,60 55,60 50,90" class="svg-bolt" /><line x1="40%" y1="60%" x2="35%" y2="80%" class="svg-rain" /></svg>';
    else if(code == "13d" || code == "13n") icon = '<svg class="svg-icon icon-real"><ellipse cx="50%" cy="40%" rx="35%" ry="20%" class="svg-cloud" /><circle cx="40%" cy="70%" r="3%" class="svg-snow" /><circle cx="50%" cy="80%" r="3%" class="svg-snow" style="animation-delay:0.5s"/><circle cx="60%" cy="70%" r="3%" class="svg-snow" style="animation-delay:1s"/></svg>';
    else if(code == "50d" || code == "50n") icon = '<svg class="svg-icon"><line x1="20%" y1="30%" x2="80%" y2="30%" class="svg-mist" /><line x1="10%" y1="50%" x2="90%" y2="50%" class="svg-mist" style="animation-delay:1s" /><line x1="20%" y1="70%" x2="80%" y2="70%" class="svg-mist" style="animation-delay:2s" /></svg>';
    else icon = '<svg class="svg-icon"><circle cx="50%" cy="50%" r="30%" fill="#555"/></svg>'; 
    return icon;
}

// MENÜ FUNKTIONEN
function openMenu() { document.getElementById("menu-modal").style.display = "block"; }
function closeMenu() { document.getElementById("menu-modal").style.display = "none"; }

function toggleAccordion(id) {
    var x = document.getElementById(id);
    if (x.style.display === "none" || x.style.display === "") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
}

function saveSettings() {
    var cityVal = document.getElementById("inp-city-val").value;
    var tickerVal = document.getElementById("inp-ticker-mode").value;
    
    if(cityVal) {
        localStorage.setItem("aura_city", cityVal);
        CITY = cityVal;
    }
    localStorage.setItem("aura_ticker", tickerVal);
    TICKER_MODE = tickerVal;
    
    closeMenu();
    showLoader(true);
    setTimeout(function(){ 
        location.reload(); 
    }, 500);
}

// RUHEMODUS
function checkSleepMode(h, m) {
    var tFrom = document.getElementById("inp-time-from").value;
    var tTo = document.getElementById("inp-time-to").value;
    
    if(!tFrom || !tTo) return;
    
    var startH = parseInt(tFrom.split(":")[0]);
    var startM = parseInt(tFrom.split(":")[1]);
    var endH = parseInt(tTo.split(":")[0]);
    var endM = parseInt(tTo.split(":")[1]);
    
    var nowMins = h * 60 + m;
    var startMins = startH * 60 + startM;
    var endMins = endH * 60 + endM;
    
    var sleep = false;
    
    if (startMins < endMins) {
        if (nowMins >= startMins && nowMins < endMins) sleep = true;
    } else {
        if (nowMins >= startMins || nowMins < endMins) sleep = true;
    }
    
    if(sleep && !isSleeping) {
        toggleSleep();
    } else if (!sleep && isSleeping) {
        toggleSleep();
    }
}

function toggleSleep() {
    var overlay = document.getElementById("sleep-overlay");
    if (overlay.style.display === "block") {
        overlay.style.display = "none";
        isSleeping = false;
    } else {
        overlay.style.display = "block";
        isSleeping = true;
    }
}

// KONTAKT FORMULAR LISTENER (V1.0 NEU)
function setupFormListener() {
    var form = document.getElementById("aura-contact-form");
    if(form) {
        form.addEventListener("submit", function() {
            setTimeout(function() {
                form.style.display = "none"; // Formular ausblenden
                document.getElementById("form-success-msg").style.display = "block"; // Erfolg anzeigen
            }, 1000);
        });
    }
}