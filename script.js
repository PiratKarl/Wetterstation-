/* --- AURA V1.0 (STABLE) - MASTER ENGINE --- */
/* Entwicklung: Code-Werft / Piratkarl */

// 1. SYSTEM-KONFIGURATION
var API_KEY = "518e81d874739701f08842c1a55f6588"; 
var VERSION_INTERN = "90";  // Interner Wert für den Server-Abgleich
var VERSION_EXTERN = "1.0"; // Anzeige-Wert für den Nutzer
var CITY = localStorage.getItem("aura_city") || "Braunschweig";
var TICKER_MODE = localStorage.getItem("aura_ticker") || "world";

// Globale Variablen
var timeOffset = 0; 
var isSleeping = false;

// 2. INITIALISIERUNG
window.onload = function() {
    // Einstellungen aus Speicher laden
    var savedCity = localStorage.getItem("aura_city");
    if(savedCity) { document.getElementById("inp-city-val").value = savedCity; CITY = savedCity; }
    
    var savedTicker = localStorage.getItem("aura_ticker");
    if(savedTicker) { document.getElementById("inp-ticker-mode").value = savedTicker; TICKER_MODE = savedTicker; }

    // Update-Meldung beim ersten Start von V1.0 anzeigen
    if (localStorage.getItem("aura_v_installed") !== VERSION_INTERN) {
        document.getElementById("update-msg").style.display = "block";
        localStorage.setItem("aura_v_installed", VERSION_INTERN);
    }

    setupFormListener();
};

// 3. START-PROZEDUR
function startApp() {
    document.getElementById("start-overlay").style.display = "none";
    
    syncTime();      // Atomzeit-Sync
    checkUpdate();   // Update-Check gegen version.json
    updateClock();   // Uhr & Begrüßung
    getWeatherData(); // Wetter-Daten
    updateTicker();   // News-Ticker
    
    // Intervalle
    setInterval(updateClock, 1000);         // 1 Sekunde
    setInterval(getWeatherData, 600000);    // 10 Minuten
    setInterval(checkUpdate, 21600000);     // 6 Stunden
    setInterval(syncTime, 43200000);        // 12 Stunden
    setInterval(updateTicker, 300000);      // 5 Minuten
}

// 4. AUTO-UPDATE ENGINE (Vergleicht Server-Version mit INTERNER Version 90)
function checkUpdate() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "version.json?nocache=" + new Date().getTime(), true);
    xhr.timeout = 10000;
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                // Wenn Server-Version ungleich 90 -> Refresh
                if (data.version !== VERSION_INTERN) {
                    console.log("Update-Signal erkannt. System wird neu geladen.");
                    setTimeout(function() { location.reload(true); }, 2000);
                }
            } catch(e) { console.log("Update-Check fehlgeschlagen."); }
        }
    };
    xhr.send();
}

// 5. ATOMZEIT-SYNC
function syncTime() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://worldtimeapi.org/api/timezone/Europe/Berlin", true);
    xhr.timeout = 8000;
    xhr.onload = function() {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            timeOffset = new Date(data.datetime).getTime() - Date.now();
            console.log("Zeit-Korrektur: " + timeOffset + "ms");
        }
    };
    xhr.send();
}

// 6. UHR & DYNAMISCHE BEGRÜSSUNG
function updateClock() {
    var now = new Date(Date.now() + timeOffset);
    var h = now.getHours();
    var m = now.getMinutes();
    
    document.getElementById("clock").innerHTML = (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m);
    
    var days = ["SONNTAG", "MONTAG", "DIENSTAG", "MITTWOCH", "DONNERSTAG", "FREITAG", "SAMSTAG"];
    var months = ["JAN", "FEB", "MÄR", "APR", "MAI", "JUN", "JUL", "AUG", "SEP", "OKT", "NOV", "DEZ"];
    document.getElementById("date").innerHTML = days[now.getDay()] + ", " + now.getDate() + ". " + months[now.getMonth()] + " 2026";

    // Begrüßung (Logik)
    var greet = "MOIN MOIN";
    if (h >= 5 && h < 11) greet = "GUTEN MORGEN";
    else if (h >= 11 && h < 14) greet = "MAHLZEIT";
    else if (h >= 14 && h < 18) greet = "SCHÖNEN TAG";
    else if (h >= 18 && h < 22) greet = "GUTEN ABEND";
    else greet = "GUTE NACHT";
    
    document.getElementById("greet-text").innerHTML = greet + ",";
    document.getElementById("city-sub").innerHTML = CITY;

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
            
            document.getElementById("main-temp").innerHTML = Math.round(data.main.temp) + "°";
            document.getElementById("val-feels").innerHTML = Math.round(data.main.feels_like) + "°";
            document.getElementById("val-humidity").innerHTML = data.main.humidity;
            document.getElementById("val-wind").innerHTML = Math.round(data.wind.speed * 3.6);
            document.getElementById("main-icon").innerHTML = getIconSVG(data.weather[0].icon);
            
            document.getElementById("sunrise").innerHTML = formatT(new Date(data.sys.sunrise * 1000));
            document.getElementById("sunset").innerHTML = formatT(new Date(data.sys.sunset * 1000));
            document.getElementById("last-update").innerHTML = "LETZTER SYNC: " + formatT(new Date());

            localStorage.setItem("lat", data.coord.lat);
            localStorage.setItem("lon", data.coord.lon);
            
            getEnviroData();
            getForecast(data.coord.lat, data.coord.lon);
        }
    };
    xhr.send();
}

// 8. DEEP DATA (UV & AQI via Open-Meteo)
function getEnviroData() {
    var lat = localStorage.getItem("lat"); var lon = localStorage.getItem("lon");
    if(!lat || !lon) return;

    var url = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude="+lat+"&longitude="+lon+"&current=european_aqi,uv_index&timezone=auto";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            var d = JSON.parse(xhr.responseText).current;
            var uv = document.getElementById("val-uv");
            var aqi = document.getElementById("val-aqi");
            
            uv.innerHTML = d.uv_index.toFixed(1);
            aqi.innerHTML = d.european_aqi;

            // Ampel-Farben
            uv.className = "cell-val " + (d.uv_index < 3 ? "val-green" : (d.uv_index < 6 ? "val-yellow" : "val-red"));
            aqi.className = "cell-val " + (d.european_aqi < 20 ? "val-green" : (d.european_aqi < 40 ? "val-yellow" : "val-red"));
        }
    };
    xhr.send();

    // Mond-Beleuchtung
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

// 9. FORECAST MATRIX (4x4)
function getForecast(lat, lon) {
    var url = "https://api.openweathermap.org/data/2.5/forecast?lat="+lat+"&lon="+lon+"&units=metric&lang=de&appid="+API_KEY;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            var list = JSON.parse(xhr.responseText).list;
            
            // OBEN: 4 STUNDEN
            var hHtml = "";
            for(var j=0; j<4; j++) {
                var h = list[j]; var dt = new Date(h.dt * 1000);
                hHtml += '<div class="f-item"><div class="f-head">'+dt.getHours()+':00</div><div class="f-icon">'+getIconSVG(h.weather[0].icon)+'</div><div class="f-temp">'+Math.round(h.main.temp)+'°</div></div>';
            }
            document.getElementById("hourly-row").innerHTML = hHtml;

            // UNTEN: 4 TAGE
            var dHtml = ""; var c = 0;
            for(var i=0; i<list.length; i++) {
                var d = list[i]; var dDate = new Date(d.dt * 1000);
                if(dDate.getHours() >= 11 && dDate.getHours() <= 14 && dDate.getDate() !== new Date().getDate() && c < 4) {
                    var dName = ["SO","MO","DI","MI","DO","FR","SA"][dDate.getDay()];
                    dHtml += '<div class="f-item"><div class="f-head">'+dName+'</div><div class="f-icon">'+getIconSVG(d.weather[0].icon)+'</div><div class="f-temp">'+Math.round(d.main.temp)+'°</div></div>';
                    c++; i += 6;
                }
            }
            document.getElementById("daily-row").innerHTML = dHtml;
            document.getElementById("rain-val").innerHTML = Math.round(list[0].pop * 100) + "%";
        }
    };
    xhr.send();
}

// 10. TICKER
function updateTicker() {
    var t = document.getElementById("ticker-text");
    if(TICKER_MODE === "world") t.innerHTML = '<span class="t-item">+++ AURA V1.0 +++ LONDON: 12° ☁️ +++ NEW YORK: 18° ☀️ +++ TOKIO: 22° 🌧️ +++ SYDNEY: 25° ☀️ +++</span>';
    else if(TICKER_MODE === "snow") t.innerHTML = '<span class="t-item">❄️ SCHNEE-TICKER: ZUGSPITZE -12° (85cm) +++ KITZBÜHEL -2° +++ ARLBERG: PULVER +++</span>';
    else t.innerHTML = '<span class="t-item">🌊 MEER-WETTER: OSTSEE 18° +++ NORDSEE 16° (WINDIG) +++ MALLORCA 26° (SONNIG) +++</span>';
}

// 11. HELFER & UI
function formatT(d) { return (d.getHours()<10?"0":"")+d.getHours()+":"+(d.getMinutes()<10?"0":"")+d.getMinutes(); }

function getIconSVG(code) {
    // Stabile Pfade für Android 4.4
    if(code == "01d") return '<svg class="svg-icon" viewBox="0 0 100 100"><circle cx="50" cy="50" r="25" class="svg-sun"/></svg>';
    if(code == "01n") return '<svg class="svg-icon" viewBox="0 0 100 100"><circle cx="50" cy="50" r="25" class="svg-moon"/></svg>';
    if(code == "02d" || code == "02n" || code == "03d" || code == "04d") return '<svg class="svg-icon" viewBox="0 0 100 100"><ellipse cx="50" cy="55" rx="35" ry="20" class="svg-cloud"/></svg>';
    if(code == "09d" || code == "10d") return '<svg class="svg-icon" viewBox="0 0 100 100"><ellipse cx="50" cy="45" rx="30" ry="18" class="svg-cloud"/><line x1="40" y1="65" x2="35" y2="80" stroke="#00eaff" stroke-width="4"/></svg>';
    if(code == "11d") return '<svg class="svg-icon" viewBox="0 0 100 100"><ellipse cx="50" cy="45" rx="30" ry="18" class="svg-cloud"/><polyline points="45,60 55,70 45,85" stroke="#ffd700" stroke-width="3" fill="none"/></svg>';
    if(code == "13d") return '<svg class="svg-icon" viewBox="0 0 100 100"><ellipse cx="50" cy="45" rx="30" ry="18" class="svg-cloud"/><circle cx="50" cy="75" r="3" fill="#fff"/></svg>';
    return '<svg class="svg-icon" viewBox="0 0 100 100"><line x1="20" y1="50" x2="80" y2="50" stroke="#aaa" stroke-width="2"/></svg>';
}

function openMenu() { document.getElementById("menu-modal").style.display = "block"; }
function closeMenu() { document.getElementById("menu-modal").style.display = "none"; }
function toggleAccordion(id) { var x = document.getElementById(id); x.style.display = (x.style.display === "block" ? "none" : "block"); }

function saveSettings() {
    localStorage.setItem("aura_city", document.getElementById("inp-city-val").value);
    localStorage.setItem("aura_ticker", document.getElementById("inp-ticker-mode").value);
    location.reload();
}

function setupFormListener() {
    var f = document.getElementById("aura-contact-form");
    if(f) f.addEventListener("submit", function() {
        setTimeout(function() { f.style.display = "none"; document.getElementById("form-success-msg").style.display = "block"; }, 500);
    });
}

function checkSleepMode(h, m) {
    var f = document.getElementById("inp-time-from").value; var t = document.getElementById("inp-time-to").value;
    if(!f || !t) return;
    var nowM = h * 60 + m; var startM = parseInt(f.split(":")[0])*60+parseInt(f.split(":")[1]); var endM = parseInt(t.split(":")[0])*60+parseInt(t.split(":")[1]);
    var sleep = (startM < endM ? (nowM >= startM && nowM < endM) : (nowM >= startM || nowM < endM));
    if(sleep && !isSleeping) toggleSleep(); else if(!sleep && isSleeping) toggleSleep();
}

function toggleSleep() {
    var o = document.getElementById("sleep-overlay");
    o.style.display = (o.style.display === "block" ? "none" : "block");
    isSleeping = !isSleeping;
}