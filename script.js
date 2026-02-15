/* --- AURA V83.2 STABLE - MASTER ENGINE --- */
/* Entwicklung & Logik: Code-Werft / Piratkarl */

// 1. GLOBALE KONFIGURATION & STATE
var API_KEY = "518e81d874739701f08842c1a55f6588"; 
var VERSION = "83.2 MASTER";
var CITY = localStorage.getItem("aura_city") || "Braunschweig";
var TICKER_MODE = localStorage.getItem("aura_ticker") || "world";

var startTime = Date.now(); // Für den Uptime-Zähler
var isSleeping = false;
var lastWeatherUpdate = 0;

// 2. SYSTEM-START (INITIALISIERUNG)
window.onload = function() {
    console.log("Aura Kernel " + VERSION + " wird gebootet...");
    
    // UI-Elemente mit gespeicherten Werten füllen
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

    // Start-Prozedur einleiten
    initializeSystem();
};

function initializeSystem() {
    // Sofortige Ausführung beim Start
    updateClock();
    getWeather();
    updateTicker();
    updateSystemStats();
    
    // Zyklische Intervalle (Master-Timing)
    setInterval(updateClock, 1000);          // Jede Sekunde für Uhr & Uptime
    setInterval(getWeather, 900000);         // Alle 15 Minuten Meteo-Daten
    setInterval(updateTicker, 300000);       // Alle 5 Minuten Ticker-Rotation
    setInterval(updateSystemStats, 60000);   // Jede Minute System-Check
}

// 3. CHRONOS: UHR, DATUM & UPTIME
function updateClock() {
    var now = new Date();
    var h = now.getHours();
    var m = now.getMinutes();
    var s = now.getSeconds();
    
    // Hauptuhr
    document.getElementById("clock").innerHTML = (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m);
    
    // Datum-String (Extended)
    var days = ["SONNTAG", "MONTAG", "DIENSTAG", "MITTWOCH", "DONNERSTAG", "FREITAG", "SAMSTAG"];
    var months = ["JANUAR", "FEBRUAR", "MÄRZ", "APRIL", "MAI", "JUNI", "JULI", "AUGUST", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DEZEMBER"];
    
    document.getElementById("date").innerHTML = days[now.getDay()] + ", " + now.getDate() + ". " + months[now.getMonth()] + " " + now.getFullYear();

    // Dynamische Begrüßung (Zeitgesteuert)
    var greetText = "MOIN MOIN,";
    if (h >= 5 && h < 11) greetText = "GUTEN MORGEN,";
    else if (h >= 11 && h < 14) greetText = "MAHLZEIT,";
    else if (h >= 14 && h < 18) greetText = "SCHÖNEN TAG,";
    else if (h >= 18 && h < 22) greetText = "GUTEN ABEND,";
    else greetText = "GUTE NACHT,";
    
    document.getElementById("greet-text").innerHTML = greetText;
    document.getElementById("city-sub").innerHTML = CITY;

    // Uptime-Berechnung
    var diff = Math.floor((Date.now() - startTime) / 1000);
    var upM = Math.floor(diff / 60);
    var upH = Math.floor(upM / 60);
    document.getElementById("sys-uptime").innerHTML = "UPTIME: " + (upH < 10 ? "0" + upH : upH) + ":" + (upM % 60 < 10 ? "0" + (upM % 60) : (upM % 60));

    // Automatischer Ruhemodus-Check
    checkSleepMode(h, m);
}

// 4. METEO-ZENTRALE (API-LOGIK)
function getWeather() {
    document.getElementById("loader").style.height = "100%"; // Ladebalken an
    
    var url = "https://api.openweathermap.org/data/2.5/weather?q=" + CITY + "&units=metric&lang=de&appid=" + API_KEY;
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.timeout = 15000;
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            
            // Hauptanzeige Dashboard
            document.getElementById("main-temp").innerHTML = Math.round(data.main.temp) + "°";
            document.getElementById("val-feels").innerHTML = Math.round(data.main.feels_like) + "°";
            document.getElementById("val-humidity").innerHTML = data.main.humidity;
            document.getElementById("val-wind").innerHTML = Math.round(data.wind.speed * 3.6);
            document.getElementById("val-press").innerHTML = data.main.pressure;
            
            // Icon Injektion
            document.getElementById("main-icon").innerHTML = getAuraSVG(data.weather[0].icon);
            
            // Astro-Daten
            document.getElementById("sunrise").innerHTML = formatUnixTime(data.sys.sunrise);
            document.getElementById("sunset").innerHTML = formatUnixTime(data.sys.sunset);
            
            // Sync Zeitstempel
            var syncTime = new Date();
            document.getElementById("last-update").innerHTML = "SYNC: " + syncTime.getHours() + ":" + (syncTime.getMinutes() < 10 ? "0" : "") + syncTime.getMinutes() + ":" + (syncTime.getSeconds() < 10 ? "0" : "") + syncTime.getSeconds();
            
            // 5-Tage Vorhersage triggern
            getForecast();
        }
        document.getElementById("loader").style.height = "0";
    };
    
    xhr.onerror = function() { 
        console.error("Wetter-Daten konnten nicht geladen werden.");
        document.getElementById("loader").style.height = "0";
    };
    
    xhr.send();
}

// 5. 5-TAGE MATRIX LOGIK
function getForecast() {
    var url = "https://api.openweathermap.org/data/2.5/forecast?q=" + CITY + "&units=metric&lang=de&appid=" + API_KEY;
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            var list = JSON.parse(xhr.responseText).list;
            var html = "";
            var counter = 0;
            
            // Wir filtern exakt 5 Tage heraus (immer der Mittagswert)
            for (var i = 0; i < list.length; i++) {
                var forecastDate = new Date(list[i].dt * 1000);
                // Logik: Nimm den Wert um 12:00 oder 13:00 Uhr
                if (forecastDate.getHours() >= 12 && forecastDate.getHours() <= 14 && counter < 5) {
                    var dayNames = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];
                    var dayLabel = dayNames[forecastDate.getDay()];
                    
                    html += '<div class="f-item">';
                    html += '<div class="f-head">' + dayLabel + '</div>';
                    html += '<div class="f-icon">' + getAuraSVG(list[i].weather[0].icon) + '</div>';
                    html += '<div class="f-temp">' + Math.round(list[i].main.temp) + '°</div>';
                    html += '</div>';
                    
                    counter++;
                    i += 7; // Überspringe die nächsten 7 Segmente (ca. 21 Std), um zum nächsten Tag zu gelangen
                }
            }
            document.getElementById("daily-row").innerHTML = html;
            
            // Regenwahrscheinlichkeit für das aktuelle Segment
            document.getElementById("rain-val").innerHTML = Math.round(list[0].pop * 100) + "%";
        }
    };
    xhr.send();
}

// 6. NEWS-TICKER (EXTENDED LISTS)
function updateTicker() {
    var t = document.getElementById("ticker-text");
    var content = "";
    
    var worldCities = "+++ WELT-METROPOLEN: London 14° ☁️ +++ New York 18° ☀️ +++ Tokio 21° 🌧️ +++ Sydney 26° ☀️ +++ Paris 15° ⛅ +++ Berlin 11° ☁️ +++ Rom 19° ☀️ +++ Moskau 2° 🌨️ +++ Dubai 32° ☀️ +++ ";
    var snowReport = "+++ ALPIN-INFO: Zugspitze -12° (Pulverschnee) +++ St. Moritz -5° +++ Kitzbühel -1° (Leicht bewölkt) +++ Arlberg: Neuschnee erwartet +++ Ischgl: Pisten präpariert +++ ";
    var summerReport = "+++ MARITIM: Mallorca 25° (Wasser 21°) +++ Sylt 16° (Windstärke 5) +++ Kanaren 24° +++ Ostsee 18° (Ruhige See) +++ Kreta 28° ☀️ +++ ";

    if (TICKER_MODE === "world") content = worldCities + worldCities;
    else if (TICKER_MODE === "snow") content = snowReport + snowReport;
    else content = summerReport + summerReport;
    
    t.innerHTML = content;
}

// 7. SYSTEM-STATISTIKEN
function updateSystemStats() {
    // Simulation von Batterie & Netz (Da Webbrowser keinen direkten Zugriff auf Hardware-Werte haben)
    var fakeBat = 92 + Math.floor(Math.random() * 8);
    document.getElementById("bat-level").innerHTML = fakeBat + "%";
    
    if (navigator.onLine) {
        document.getElementById("net-status").innerHTML = "WLAN ONLINE";
        document.getElementById("net-status").style.color = "#00ff88";
    } else {
        document.getElementById("net-status").innerHTML = "OFFLINE";
        document.getElementById("net-status").style.color = "#ff0055";
    }
}

// 8. HELFER & ICON-INJEKTION
function formatUnixTime(unix) {
    var d = new Date(unix * 1000);
    var h = d.getHours();
    var m = d.getMinutes();
    return (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m);
}

function getAuraSVG(code) {
    // Mappt OpenWeather Codes auf die SVGs in index.html
    if (code === "01d") return '<svg class="svg-icon" viewBox="0 0 100 100"><circle cx="50" cy="50" r="28" class="sun-fill"/></svg>';
    if (code === "01n") return '<svg class="svg-icon" viewBox="0 0 100 100"><circle cx="50" cy="50" r="28" fill="url(#gradMoonReal)"/></svg>';
    if (code === "02d" || code === "02n" || code === "03d" || code === "04d") {
        return '<svg class="svg-icon" viewBox="0 0 100 100"><ellipse cx="50" cy="60" rx="38" ry="22" class="cloud-fill"/></svg>';
    }
    if (code === "09d" || code === "10d") {
        return '<svg class="svg-icon" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="35" ry="20" fill="#555"/><line x1="40" y1="70" x2="35" y2="90" stroke="#00eaff" stroke-width="4" stroke-linecap="round"/></svg>';
    }
    if (code === "11d") {
        return '<svg class="svg-icon" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="35" ry="20" fill="#333"/><polyline points="45,65 55,75 45,95" stroke="#ffd700" stroke-width="4" fill="none"/></svg>';
    }
    if (code === "13d") {
        return '<svg class="svg-icon" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="35" ry="20" class="cloud-fill"/><circle cx="50" cy="80" r="4" fill="#fff"/></svg>';
    }
    return '<svg class="svg-icon" viewBox="0 0 100 100"><line x1="20" y1="50" x2="80" y2="50" stroke="#444" stroke-width="2"/></svg>';
}

// 9. UI & MENÜ STEUERUNG
function openMenu() { document.getElementById("menu-modal").style.display = "block"; }
function closeMenu() { document.getElementById("menu-modal").style.display = "none"; }

function toggleAccordion(id) {
    var elements = document.getElementsByClassName("acc-content");
    for (var i = 0; i < elements.length; i++) {
        if (elements[i].id !== id) elements[i].style.display = "none";
    }
    var x = document.getElementById(id);
    x.style.display = (x.style.display === "block" ? "none" : "block");
}

function saveSettings() {
    var cityVal = document.getElementById("inp-city-val").value;
    var tickerVal = document.getElementById("inp-ticker-mode").value;
    var sleepFrom = document.getElementById("inp-time-from").value;
    var sleepTo = document.getElementById("inp-time-to").value;
    
    if (cityVal) localStorage.setItem("aura_city", cityVal);
    localStorage.setItem("aura_ticker", tickerVal);
    if (sleepFrom) localStorage.setItem("aura_sleep_from", sleepFrom);
    if (sleepTo) localStorage.setItem("aura_sleep_to", sleepTo);
    
    // System-Neustart zur Übernahme
    location.reload();
}

// 10. DISPLAY-SCHUTZ (RUHEMODUS)
function checkSleepMode(h, m) {
    var from = localStorage.getItem("aura_sleep_from");
    var to = localStorage.getItem("aura_sleep_to");
    if (!from || !to) return;
    
    var nowM = h * 60 + m;
    var startM = parseInt(from.split(":")[0]) * 60 + parseInt(from.split(":")[1]);
    var endM = parseInt(to.split(":")[0]) * 60 + parseInt(to.split(":")[1]);
    
    var shouldSleep = false;
    if (startM < endM) {
        shouldSleep = (nowM >= startM && nowM < endM);
    } else {
        shouldSleep = (nowM >= startM || nowM < endM);
    }
    
    if (shouldSleep && !isSleeping) toggleSleep();
    else if (!shouldSleep && isSleeping) toggleSleep();
}

function toggleSleep() {
    var o = document.getElementById("sleep-overlay");
    if (o.style.display === "block") {
        o.style.display = "none";
        isSleeping = false;
    } else {
        o.style.display = "block";
        isSleeping = true;
    }
}