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
        var url = "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(currentCity) + "&appid=" + API_KEY + "&units=metric&lang=de";
        var res = await fetch(url);
        var data = await res.json();
        
        if (data.cod === 200) {
            document.getElementById('city-title').innerText = data.name.toUpperCase();
            // Temperatur mit einer Nachkommastelle
            document.getElementById('temp-display').innerText = data.main.temp.toFixed(1);
            document.getElementById('weather-desc').innerText = data.weather[0].description;
            document.getElementById('main-icon').className = "fa " + (iconColorMap[data.weather[0].icon] || "fa-cloud");
            
            document.getElementById('sunrise-val').innerText = formatT(data.sys.sunrise, data.timezone);
            document.getElementById('sunset-val').innerText = formatT(data.sys.sunset, data.timezone);
            
            // Zeitstempel der Aktualisierung
            var now = new Date();
            document.getElementById('update-info').innerText = "Zuletzt aktualisiert: " + now.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'});

            var ticker = [
                "GEFÜHLT: " + data.main.feels_like.toFixed(1) + "°C",
                "LUFTFEUCHTE: " + data.main.humidity + "%",
                "WIND: " + (data.wind.speed * 3.6).toFixed(1) + " KM/H",
                "DRUCK: " + data.main.pressure + " HPA",
                "WOLKEN: " + data.clouds.all + "%"
            ];
            document.getElementById('info-ticker').innerText = " +++ " + ticker.join(" +++ ") + " +++ ";
        }

        // Vorhersage
        var resF = await fetch("https://api.openweathermap.org/data/2.5/forecast?q=" + encodeURIComponent(currentCity) + "&appid=" + API_KEY + "&units=metric&lang=de");
        var dataF = await resF.json();

        // Stunden-Liste
        var hList = document.getElementById('hourly-list'); hList.innerHTML = "";
        for(var i=0; i<7; i++) {
            var it = dataF.list[i];
            hList.innerHTML += '<div class="f-item"><span class="f-label">' + new Date(it.dt*1000).getHours() + ':00</span><i class="fa ' + (iconColorMap[it.weather[0].icon] || "fa-cloud") + '" style="font-size:1.5rem; display:block; margin:3px 0;"></i><span class="f-temp">' + it.main.temp.toFixed(1) + '°</span></div>';
        }

        // Tages-Liste
        var dList = document.getElementById('daily-list'); dList.innerHTML = "";
        var days = {};
        dataF.list.forEach(function(it) {
            var d = new Date(it.dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
            if(!days[d]) days[d] = { t: it.main.temp, ic: it.weather[0].icon };
        });
        Object.keys(days).slice(1, 7).forEach(function(d) {
            dList.innerHTML += '<div class="f-item"><span class="f-label" style="color:#00ffcc">' + d + '</span><i class="fa ' + (iconColorMap[days[d].ic] || "fa-cloud") + '" style="font-size:1.5rem; display:block; margin:3px 0;"></i><span class="f-temp">' + days[d].t.toFixed(1) + '°</span></div>';
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
        window.location.reload(); 
    }
}

// 5 Minuten Intervall (300.000 ms)
setInterval(updateClock, 1000);
setInterval(fetchWeather, 300000);

updateClock(); fetchWeather();