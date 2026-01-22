const API_KEY = '518e81d874739701f08842c1a55f6588';
let currentCity = localStorage.getItem('selectedCity') || 'Braunschweig';

const iconColorMap = {
    "01d": "fa-sun-o icon-sun", "01n": "fa-moon-o icon-cloud",
    "02d": "fa-cloud icon-cloud", "02n": "fa-cloud icon-cloud",
    "03d": "fa-cloud icon-cloud", "04d": "fa-cloud icon-cloud",
    "09d": "fa-tint icon-rain", "10d": "fa-umbrella icon-rain",
    "11d": "fa-bolt icon-bolt", "13d": "fa-snowflake-o icon-snow",
    "50d": "fa-bars icon-cloud"
};

// Windrichtung in Text umwandeln
function getWindDirText(deg) {
    const directions = ['Nord', 'Nordost', 'Ost', 'Südost', 'Süd', 'Südwest', 'West', 'Nordwest'];
    return directions[Math.round(deg / 45) % 8];
}

// Beaufort Skala für Windbezeichnung
function getBeaufortText(kmh) {
    if (kmh < 1) return "Windstille";
    if (kmh < 6) return "leichte Brise";
    if (kmh < 12) return "leichte Brise";
    if (kmh < 20) return "mäßiger Wind";
    if (kmh < 29) return "frischer Wind";
    if (kmh < 39) return "starker Wind";
    if (kmh < 50) return "steifer Wind";
    if (kmh < 62) return "stürmischer Wind";
    if (kmh < 75) return "Sturm";
    if (kmh < 89) return "schwerer Sturm";
    if (kmh < 103) return "orkanartiger Sturm";
    return "Orkan";
}

function updateClock() {
    var now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });
}

function formatT(ts, offset) {
    var d = new Date((ts + offset) * 1000);
    return d.getUTCHours().toString().padStart(2, '0') + ":" + d.getUTCMinutes().toString().padStart(2, '0');
}

async function fetchWeather() {
    try {
        var url = "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(currentCity) + "&appid=" + API_KEY + "&units=metric&lang=de&_t=" + Date.now();
        var res = await fetch(url);
        var data = await res.json();
        
        if (data.cod === 200) {
            document.getElementById('city-title').innerText = data.name.toUpperCase();
            document.getElementById('temp-display').innerText = data.main.temp.toFixed(1);
            document.getElementById('weather-desc').innerText = data.weather[0].description;
            document.getElementById('main-icon').className = "fa " + (iconColorMap[data.weather[0].icon] || "fa-cloud");
            document.getElementById('sunrise-val').innerText = formatT(data.sys.sunrise, data.timezone);
            document.getElementById('sunset-val').innerText = formatT(data.sys.sunset, data.timezone);
            
            var now = new Date();
            document.getElementById('update-info').innerText = "Update: " + now.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'});

            // Ticker mit Wind-Details
            const windKmh = Math.round(data.wind.speed * 3.6);
            const windDir = getWindDirText(data.wind.deg);
            const windBeaufort = getBeaufortText(windKmh);

            var tickerInfo = [
                "WIND: " + windKmh + " KM/H aus " + windDir + " (" + windBeaufort + ")",
                "GEFÜHLT: " + data.main.feels_like.toFixed(1) + "°C",
                "FEUCHTE: " + data.main.humidity + "%",
                "DRUCK: " + data.main.pressure + " HPA"
            ];
            document.getElementById('info-ticker').innerText = " +++ " + tickerInfo.join(" +++ ") + " +++ ";
        }

        var resF = await fetch("https://api.openweathermap.org/data/2.5/forecast?q=" + encodeURIComponent(currentCity) + "&appid=" + API_KEY + "&units=metric&lang=de");
        var dataF = await resF.json();

        // 1. Stunden
        var hList = document.getElementById('hourly-list'); hList.innerHTML = "";
        for(var i=0; i<7; i++) {
            var it = dataF.list[i];
            hList.innerHTML += '<div class="f-item"><span class="f-label">' + new Date(it.dt*1000).getHours() + ':00</span><i class="fa ' + (iconColorMap[it.weather[0].icon] || "fa-cloud") + '" style="font-size:1.8rem; display:block; margin:3px 0;"></i><span class="f-temp-hour">' + Math.round(it.main.temp) + '°</span></div>';
        }

        // 2. Tage mit Max/Min
        var dList = document.getElementById('daily-list'); dList.innerHTML = "";
        var daysData = {};

        dataF.list.forEach(function(it) {
            var dayName = new Date(it.dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
            if(!daysData[dayName]) {
                daysData[dayName] = { temps: [], icon: it.weather[0].icon };
            }
            daysData[dayName].temps.push(it.main.temp);
        });

        Object.keys(daysData).slice(1, 6).forEach(function(d) {
            var maxT = Math.round(Math.max(...daysData[d].temps));
            var minT = Math.round(Math.min(...daysData[d].temps));
            
            dList.innerHTML += '<div class="f-item">' +
                '<span class="f-label" style="color:#00ffcc">' + d + '</span>' +
                '<i class="fa ' + (iconColorMap[daysData[d].icon] || "fa-cloud") + '" style="font-size:1.6rem; display:block; margin:3px 0;"></i>' +
                '<div><span class="f-temp-max">' + maxT + '°</span><span class="f-temp-min">' + minT + '°</span></div>' +
                '</div>';
        });

    } catch (e) { console.log("Fehler"); }
}

function toggleSettings() {
    var s = document.getElementById('settings-overlay');
    s.style.display = (s.style.display === 'block') ? 'none' : 'block';
}

function saveCity() {
    var val = document.getElementById('city-input').value.trim();
    if(val) {
        localStorage.setItem('selectedCity', val);
        window.location.href = window.location.pathname; 
    }
}

setInterval(updateClock, 1000);
setInterval(fetchWeather, 300000);
updateClock(); fetchWeather();