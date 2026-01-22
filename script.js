const API_KEY = '518e81d874739701f08842c1a55f6588';
// Falls kein Standort gespeichert, nutze Berlin als neutralen Startpunkt
let currentCity = localStorage.getItem('selectedCity') || 'Berlin';

const iconMap = {
    "01d": "fa-sun-o", "01n": "fa-moon-o", "02d": "fa-cloud", "02n": "fa-cloud",
    "03d": "fa-cloud", "03n": "fa-cloud", "04d": "fa-cloud", "09d": "fa-tint",
    "10d": "fa-umbrella", "11d": "fa-bolt", "13d": "fa-snowflake-o", "50d": "fa-bars"
};

function updateClock() {
    var now = new Date();
    var h = now.getHours().toString().padStart(2, '0');
    var m = now.getMinutes().toString().padStart(2, '0');
    document.getElementById('clock').innerText = h + ":" + m;
    document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });
}

function formatT(ts, offset) {
    var d = new Date((ts + offset) * 1000);
    return d.getUTCHours().toString().padStart(2, '0') + ":" + d.getUTCMinutes().toString().padStart(2, '0');
}

async function fetchWeather() {
    try {
        var url = "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(currentCity) + "&appid=" + API_KEY + "&units=metric&lang=de";
        var res = await fetch(url);
        var data = await res.json();
        
        if (data.cod === 200) {
            document.getElementById('city-title').innerText = data.name.toUpperCase();
            document.getElementById('temp-display').innerText = Math.round(data.main.temp);
            document.getElementById('weather-desc').innerText = data.weather[0].description;
            document.getElementById('main-icon').className = "fa " + (iconMap[data.weather[0].icon] || "fa-cloud");
            document.getElementById('sunrise-val').innerText = formatT(data.sys.sunrise, data.timezone);
            document.getElementById('sunset-val').innerText = formatT(data.sys.sunset, data.timezone);

            var tickerInfo = [
                "GEFÜHLT: " + Math.round(data.main.feels_like) + "°C",
                "LUFTFEUCHTE: " + data.main.humidity + "%",
                "WIND: " + Math.round(data.wind.speed * 3.6) + " KM/H",
                "LUFTDRUCK: " + data.main.pressure + " HPA",
                "WOLKEN: " + data.clouds.all + "%"
            ];
            document.getElementById('info-ticker').innerText = " +++ " + tickerInfo.join(" +++ ") + " +++ ";
        }

        var resF = await fetch("https://api.openweathermap.org/data/2.5/forecast?q=" + encodeURIComponent(currentCity) + "&appid=" + API_KEY + "&units=metric&lang=de");
        var dataF = await resF.json();

        var hList = document.getElementById('hourly-list'); hList.innerHTML = "";
        for(var i=0; i<7; i++) {
            var it = dataF.list[i];
            hList.innerHTML += '<div class="f-item"><span class="f-time">' + new Date(it.dt*1000).getHours() + ':00</span><i class="fa ' + iconMap[it.weather[0].icon] + ' f-icon"></i><span class="f-temp">' + Math.round(it.main.temp) + '°</span></div>';
        }

        var dList = document.getElementById('daily-list'); dList.innerHTML = "";
        var days = {};
        dataF.list.forEach(function(it) {
            var d = new Date(it.dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
            if(!days[d]) days[d] = { t: it.main.temp, ic: it.weather[0].icon };
        });
        Object.keys(days).slice(1, 7).forEach(function(d) {
            dList.innerHTML += '<div class="f-item"><span class="f-time" style="color:#00ffcc">' + d + '</span><i class="fa ' + iconMap[days[d].ic] + ' f-icon"></i><span class="f-temp">' + Math.round(days[d].t) + '°</span></div>';
        });
    } catch (e) { console.log("Fehler beim Laden"); }
}

function toggleSettings() {
    var s = document.getElementById('settings-overlay');
    s.style.display = (s.style.display === 'block') ? 'none' : 'block';
}

function saveCity() {
    var val = document.getElementById('city-input').value.trim();
    if(val) {
        localStorage.setItem('selectedCity', val);
        // Voller Reload für alte Samsung-Browser notwendig
        window.location.href = window.location.pathname;
    }
}

// Intervall 15 Minuten
setInterval(updateClock, 1000);
setInterval(fetchWeather, 900000);
updateClock(); fetchWeather();
