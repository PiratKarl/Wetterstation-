/* --- AURA V1.0 (STABLE) - COMPLETE ENGINE --- */
/* Entwickelt von der Code-Werft / Piratkarl */

// 1. KONFIGURATION (JETZT MIT DEINEM KEY!)
var API_KEY = "518e81d874739701f08842c1a55f6588"; 
var CITY = localStorage.getItem("aura_city") || "Braunschweig";
var TICKER_MODE = localStorage.getItem("aura_ticker") || "world";

// Globale Variablen
var timeOffset = 0; 
var isSleeping = false;

// 2. SYSTEM START
window.onload = function() {
    // Lade Einstellungen aus dem Speicher
    var savedCity = localStorage.getItem("aura_city");
    if(savedCity) { document.getElementById("inp-city-val").value = savedCity; CITY = savedCity; }
    
    var savedTicker = localStorage.getItem("aura_ticker");
    if(savedTicker) { document.getElementById("inp-ticker-mode").value = savedTicker; TICKER_MODE = savedTicker; }

    // Check ob Update-Hinweis nötig (Einmalig für V1.0)
    if (localStorage.getItem("aura_version") !== "1.0") {
        document.getElementById("update-msg").style.display = "block";
        localStorage.setItem("aura_version", "1.0");
    }

    setupFormListener(); // Kontaktformular scharf schalten
};

function startApp() {
    document.getElementById("start-overlay").style.display = "none";
    
    syncTime(); // Sofort Atomzeit holen
    updateClock(); // Uhr starten
    setInterval(updateClock, 1000);
    
    // Daten-Intervalle
    getWeatherData();
    setInterval(getWeatherData, 600000); // 10 Min
    setInterval(syncTime, 43200000);     // 12 Std Zeit-Sync
    setInterval(updateTicker, 300000);   // 5 Min Ticker
    
    updateTicker();
}

// 3. ATOMZEIT-SYNC (Fix für driftende Tablet-Uhren)
function syncTime() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://worldtimeapi.org/api/timezone/Europe/Berlin", true);
    xhr.timeout = 8000;
    xhr.onload = function() {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            var serverTime = new Date(data.datetime).getTime();
            timeOffset = serverTime - Date.now();
            console.log("Aura Sync: Zeit-Abweichung korrigiert um " + timeOffset + "ms");
        }
    };
    xhr.send();
}

// 4. UHR & BEGRÜSSUNG
function updateClock() {
    var now = new Date(Date.now() + timeOffset);
    var h = now.getHours();
    var m = now.getMinutes();
    
    // Anzeige Uhrzeit
    document.getElementById("clock").innerHTML = (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m);
    
    // Datum mit Jahr 2026
    var days = ["SONNTAG", "MONTAG", "DIENSTAG", "MITTWOCH", "DONNERSTAG", "FREITAG", "SAMSTAG"];
    var months = ["JAN", "FEB", "MÄR", "APR", "MAI", "JUN", "JUL", "AUG", "SEP", "OKT", "NOV", "DEZ"];
    document.getElementById("date").innerHTML = days[now.getDay()] + ", " + now.getDate() + ". " + months[now.getMonth()] + " " + now.getFullYear();

    // Dynamische Begrüßung
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

// 5. WETTER-DATEN (OpenWeatherMap)
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
            
            // Astro & Sync Info
            document.getElementById("sunrise").innerHTML = formatT(new Date(data.sys.sunrise * 1000));
            document.getElementById("sunset").innerHTML = formatT(new Date(data.sys.sunset * 1000));
            document.getElementById("last-update").innerHTML = "Sync: " + formatT(new Date());

            // Koordinaten für UV/AQI merken
            localStorage.setItem("lat", data.coord.lat);
            localStorage.setItem("lon", data.coord.lon);
            getEnviroData();
            getForecast(data.coord.lat, data.coord.lon);
        }
    };
    xhr.send();
}

// 6. UMWELT-DATEN (UV, AQI, MOND via Open-Meteo)
function getEnviroData() {
    var lat = localStorage.getItem("lat");
    var lon = localStorage.getItem("lon");
    if(!lat || !lon) return;

    // UV & Luftqualität
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

            // Farben setzen
            uvEl.className = "cell-val " + (d.uv_index < 3 ? "val-green" : (d.uv_index < 6 ? "val-yellow" : "val-red"));
            aqiEl.className = "cell-val " + (d.european_aqi < 20 ? "val-green" : (d.european_aqi < 40 ? "val-yellow" : "val-red"));
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

// 7. VORHERSAGE
function getForecast(lat, lon) {
    var url = "https://api.openweathermap.org/data/2.5/forecast?lat="+lat+"&lon="+lon+"&units=metric&lang=de&appid="+API_KEY;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            var list = JSON.parse(xhr.responseText).list;
            var html = ""; var c = 0;
            for(var i=0; i<list.length; i++) {
                var d = new Date(list[i].dt * 1000);
                if(d.getHours() >= 11 && d.getHours() <= 14 && d.getDate() !== new Date().getDate() && c < 3) {
                    html += '<div class="f-item"><div class="f-head">'+["SO","MO","DI","MI","DO","FR","SA"][d.getDay()]+'</div>';
                    html += '<div class="f-icon">'+getIconSVG(list[i].weather[0].icon)+'</div>';
                    html += '<div class="f-temp">'+Math.round(list[i].main.temp)+'°</div></div>';
                    c++; i+=4;
                }
            }
            document.getElementById("daily-row").innerHTML = html;
            document.getElementById("rain-val").innerHTML = Math.round(list[0].pop * 100) + "%";
        }
    };
    xhr.send();
}

// 8. TICKER
function updateTicker() {
    var t = document.getElementById("ticker-text");
    if(TICKER_MODE === "world") t.innerHTML = '<span class="t-item">+++ AURA V1.0 STABLE +++ London: 12° ☁️ +++ New York: 18° ☀️ +++ Tokio: 22° 🌧️ +++</span>';
    else if(TICKER_MODE === "snow") t.innerHTML = '<span class="t-item">❄️ SCHNEE-TICKER: Zugspitze -12° (85cm) +++ Kitzbühel -2° +++ Arlberg: Pulver +++</span>';
    else t.innerHTML = '<span class="t-item">🌊 MEER-WETTER: Ostsee 18° +++ Nordsee 16° (Windig) +++ Mallorca 26° (Sonnig) +++</span>';
}

// 9. HELFER & UI
function formatT(d) { return (d.getHours()<10?"0":"")+d.getHours()+":"+(d.getMinutes()<10?"0":"")+d.getMinutes(); }

function getIconSVG(c) {
    if(c=="01d") return '<svg class="svg-icon icon-real"><circle cx="50%" cy="50%" r="28%" class="svg-sun"/></svg>';
    if(c=="01n") return '<svg class="svg-icon icon-real"><circle cx="50%" cy="50%" r="28%" class="svg-moon"/></svg>';
    if(c=="02d"||c=="02n") return '<svg class="svg-icon icon-real"><ellipse cx="50%" cy="60%" rx="35%" ry="20%" class="svg-cloud"/></svg>';
    if(c=="09d"||c=="10d") return '<svg class="svg-icon icon-real"><ellipse cx="50%" cy="40%" rx="35%" ry="20%" class="svg-cloud-dark"/><line x1="40%" y1="60%" x2="35%" y2="80%" class="svg-rain"/></svg>';
    if(c=="13d") return '<svg class="svg-icon icon-real"><ellipse cx="50%" cy="40%" rx="35%" ry="20%" class="svg-cloud"/><circle cx="50%" cy="75%" r="3" class="svg-snow"/></svg>';
    return '<svg class="svg-icon icon-real"><ellipse cx="50%" cy="50%" rx="40%" ry="25%" class="svg-cloud"/></svg>';
}

function openMenu() { document.getElementById("menu-modal").style.display = "block"; }
function closeMenu() { document.getElementById("menu-modal").style.display = "none"; }
function toggleAccordion(id) { var x=document.getElementById(id); x.style.display=(x.style.display==="block"?"none":"block"); }

function saveSettings() {
    localStorage.setItem("aura_city", document.getElementById("inp-city-val").value);
    localStorage.setItem("aura_ticker", document.getElementById("inp-ticker-mode").value);
    location.reload();
}

function setupFormListener() {
    var f = document.getElementById("aura-contact-form");
    if(f) f.addEventListener("submit", function() {
        setTimeout(function() { f.style.display="none"; document.getElementById("form-success-msg").style.display="block"; }, 500);
    });
}

function checkSleepMode(h, m) {
    var f=document.getElementById("inp-time-from").value; var t=document.getElementById("inp-time-to").value;
    if(!f||!t) return;
    var nm=h*60+m; var sm=parseInt(f.split(":")[0])*60+parseInt(f.split(":")[1]); var em=parseInt(t.split(":")[0])*60+parseInt(t.split(":")[1]);
    var s=(sm<em ? (nm>=sm&&nm<em) : (nm>=sm||nm<em));
    if(s && !isSleeping) toggleSleep(); else if(!s && isSleeping) toggleSleep();
}

function toggleSleep() { var o=document.getElementById("sleep-overlay"); o.style.display=(o.style.display==="block"?"none":"block"); isSleeping=!isSleeping; }