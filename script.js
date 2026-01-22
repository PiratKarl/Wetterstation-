// Konfiguration
var API_KEY = '518e81d874739701f08842c1a55f6588';
var currentCity = localStorage.getItem('selectedCity') || 'Braunschweig';

// Zuordnung der Icons mit Farb-Klassen
var iconColorMap = {
    "01d": "fa-sun-o icon-sun", "01n": "fa-moon-o icon-cloud",
    "02d": "fa-cloud icon-cloud", "02n": "fa-cloud icon-cloud",
    "03d": "fa-cloud icon-cloud", "04d": "fa-cloud icon-cloud",
    "09d": "fa-tint icon-rain", "10d": "fa-umbrella icon-rain",
    "11d": "fa-bolt icon-bolt", "13d": "fa-snowflake-o icon-snow",
    "50d": "fa-bars icon-cloud"
};

// Hilfsfunktion für führende Null (Ersatz für padStart für alte Browser)
function zero(n) { 
    return (n < 10 ? '0' : '') + n; 
}

// Windrichtung in Text umwandeln
function getWindDirText(deg) {
    var directions = ['Nord', 'Nordost', 'Ost', 'Südost', 'Süd', 'Südwest', 'West', 'Nordwest'];
    return directions[Math.round(deg / 45) % 8];
}

// Beaufort Skala für Windbezeichnung
function getBeaufortText(kmh) {
    if (kmh < 1) return "Windstille";
    if (kmh < 6) return "leiser Zug";
    if (kmh < 12) return "leichte Brise";
    if (kmh < 20) return "schwache Brise";
    if (kmh < 29) return "mäßige Brise";
    if (kmh < 39) return "frischer Wind";
    if (kmh < 50) return "starker Wind";
    if (kmh < 62) return "steifer Wind";
    if (kmh < 75) return "stürmischer Wind";
    if (kmh < 89) return "Sturm";
    if (kmh < 103) return "schwerer Sturm";
    if (kmh < 118) return "orkanartiger Sturm";
    return "Orkan";
}

// Uhrzeit und Datum aktualisieren
function updateClock() {
    var now = new Date();
    document.getElementById('clock').innerText = zero(now.getHours()) + ":" + zero(now.getMinutes());
    document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });
}

// Zeitformatierung für Astro-Daten
function formatT(ts, offset) {
    var d = new Date((ts + offset) * 1000);
    return zero(d.getUTCHours()) + ":" + zero(d.getUTCMinutes());
}

// Hauptfunktion: Wetterdaten abrufen
async function fetchWeather() {
    try {
        var url = "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(currentCity) + "&appid=" + API_KEY + "&units=metric&lang=de&_t=" + Date.now();
        var res = await fetch(url);
        var data = await res.json();
        
        if (data.cod === 200) {
            var actualTemp = data.main.temp;
            var feelsLike = data.main.feels_like;
            
            document.getElementById('city-title').innerText = data.name.toUpperCase();
            document.getElementById('temp-display').innerText = actualTemp.toFixed(1);
            document.getElementById('main-icon').className = "fa " + (iconColorMap[data.weather[0].icon] || "fa-cloud");
            
            document.getElementById('sunrise-val').innerText = formatT(data.sys.sunrise, data.timezone);
            document.getElementById('sunset-val').innerText = formatT(data.sys.sunset, data.timezone);
            
            // Gefühlte Temperatur Logik
            var feelsElem = document.getElementById('feels-like-display');
            var diff = Math.round(feelsLike * 10) / 10 - Math.round(actualTemp * 10) / 10;
            
            if (Math.abs(diff) < 0.2) {
                feelsElem.className = "hidden";
            } else if (feelsLike > actualTemp) {
                feelsElem.innerHTML = "<small>GEFÜHLT </small>" + feelsLike.toFixed(1) + "°";
                feelsElem.className = "warmer";
            } else {
                feelsElem.innerHTML = "<small>GEFÜHLT </small>" + feelsLike.toFixed(1) + "°";
                feelsElem.className = "colder";
            }

            var now = new Date();
            document.getElementById('update-info').innerText = "Upd: " + zero(now.getHours()) + ":" + zero(now.getMinutes());

            // Ticker mit Wind-Logik
            var windKmh = Math.round(data.wind.speed * 3.6);
            var windDir = getWindDirText(data.wind.deg);
            var windBeaufort = getBeaufortText(windKmh);

            var tickerInfo = [
                "WIND: " + windKmh + " KM/H aus " + windDir + " (" + windBeaufort + ")",
                "LUFTFEUCHTE: " + data.main.humidity + "%",
                "LUFTDRUCK: " + data.main.pressure + " HPA"
            ];
            document.getElementById('info-ticker').innerText = " +++ " + tickerInfo.join(" +++ ") + " +++ ";
        }

        // Vorhersage abrufen
        var resF = await fetch("https://api.openweathermap.org/data/2.5/forecast?q=" + encodeURIComponent(currentCity) + "&appid=" + API_KEY + "&units=metric&lang=de");
        var dataF = await resF.json();

        // 1. Stunden-Vorschau (5 Einträge)
        var hList = document.getElementById('hourly-list'); 
        hList.innerHTML = "";
        for(var i=0; i<5; i++) {
            var it = dataF.list[i];
            hList.innerHTML += '<div class="f-item"><span class="f-label">' + new Date(it.dt*1000).getHours() + ':00</span><i class="fa ' + (iconColorMap[it.weather[0].icon] || "fa-cloud") + '" style="font-size:2rem; display:block; margin:4px 0;"></i><span class="f-temp-hour">' + Math.round(it.main.temp) + '°</span></div>';
        }

        // 2. Tages-Vorschau (Max/Min Berechnung)
        var dList = document.getElementById('daily-list'); 
        dList.innerHTML = "";
        var daysData = {};
        dataF.list.forEach(function(it) {
            var dayName = new Date(it.dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
            if(!daysData[dayName]) {
                daysData[dayName] = { temps: [], icon: it.weather[0].icon };
            }
            daysData[dayName].temps.push(it.main.temp);
        });

        Object.keys(daysData).slice(1, 6).forEach(function(d) {
            var maxT = Math.round(Math.max.apply(Math, daysData[d].temps));
            var minT = Math.round(Math.min.apply(Math, daysData[d].temps));
            
            dList.innerHTML += '<div class="f-item"><span class="f-label" style="color:#00ffcc">' + d + '</span><i class="fa ' + (iconColorMap[daysData[d].icon] || "fa-cloud") + '" style="font-size:2rem; display:block; margin:4px 0;"></i><div><span class="f-temp-max">' + maxT + '°</span><span class="f-temp-min">' + minT + '°</span></div></div>';
        });

    } catch (e) { 
        console.log("Fehler beim Wetter-Abruf"); 
    }
}

// Modal-Steuerung
function toggleSettings() {
    var s = document.getElementById('settings-overlay');
    s.style.display = (s.style.display === 'block') ? 'none' : 'block';
}

// Standort speichern und Seite neu laden
function saveCity() {
    var val = document.getElementById('city-input').value.trim();
    if(val) {
        localStorage.setItem('selectedCity', val);
        window.location.href = window.location.pathname; 
    }
}

// Zeit-Intervalle
setInterval(updateClock, 1000);        // Uhr jede Sekunde
setInterval(fetchWeather, 300000);     // Wetter alle 5 Minuten

// --- DER WACHMACHER-HACK ---
// Alle 25 Minuten die Seite komplett neu laden, um das Abdunkeln zu verhindern
setInterval(function() {
    window.location.reload();
}, 1500000); 

// Start beim Laden
updateClock(); 
fetchWeather();