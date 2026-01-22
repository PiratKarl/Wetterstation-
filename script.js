const API_KEY = '518e81d874739701f08842c1a55f6588';
var currentCity = localStorage.getItem('selectedCity') || 'Braunschweig';

const iconColorMap = {
    "01d": "fa-sun-o icon-sun", "01n": "fa-moon-o icon-cloud",
    "02d": "fa-cloud icon-cloud", "02n": "fa-cloud icon-cloud",
    "03d": "fa-cloud icon-cloud", "04d": "fa-cloud icon-cloud",
    "09d": "fa-tint icon-rain", "10d": "fa-umbrella icon-rain",
    "11d": "fa-bolt icon-bolt", "13d": "fa-snowflake-o icon-snow",
    "50d": "fa-bars icon-cloud"
};

// Hilfsfunktion für führende Null (Ersatz für padStart)
function zero(n) { return (n < 10 ? '0' : '') + n; }

function updateClock() {
    var now = new Date();
    document.getElementById('clock').innerText = zero(now.getHours()) + ":" + zero(now.getMinutes());
    document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });
}

function formatT(ts, offset) {
    var d = new Date((ts + offset) * 1000);
    return zero(d.getUTCHours()) + ":" + zero(d.getUTCMinutes());
}

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

            var tickerInfo = [
                "FEUCHTE: " + data.main.humidity + "%",
                "WIND: " + (data.wind.speed * 3.6).toFixed(1) + " KM/H",
                "DRUCK: " + data.main.pressure + " HPA"
            ];
            document.getElementById('info-ticker').innerText = " +++ " + tickerInfo.join(" +++ ") + " +++ ";
        }

        var resF = await fetch("https://api.openweathermap.org/data/2.5/forecast?q=" + encodeURIComponent(currentCity) + "&appid=" + API_KEY + "&units=metric&lang=de");
        var dataF = await resF.json();

        // Stunden (5 Stück)
        var hList = document.getElementById('hourly-list'); hList.innerHTML = "";
        for(var i=0; i<5; i++) {
            var it = dataF.list[i];
            hList.innerHTML += '<div class="f-item"><span class="f-label">' + new Date(it.dt*1000).getHours() + ':00</span><i class="fa ' + (iconColorMap[it.weather[0].icon] || "fa-cloud") + '" style="font-size:2rem; display:block; margin:4px 0;"></i><span class="f-temp-hour">' + Math.round(it.main.temp) + '°</span></div>';
        }

        // Tage
        var dList = document.getElementById('daily-list'); dList.innerHTML = "";
        var daysData = {};
        dataF.list.forEach(function(it) {
            var dayName = new Date(it.dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
            if(!daysData[dayName]) daysData[dayName] = { temps: [], icon: it.weather[0].icon };
            daysData[dayName].temps.push(it.main.temp);
        });
        Object.keys(daysData).slice(1, 6).forEach(function(d) {
            var maxT = Math.round(Math.max.apply(Math, daysData[d].temps));
            var minT = Math.round(Math.min.apply(Math, daysData[d].temps));
            dList.innerHTML += '<div class="f-item"><span class="f-label" style="color:#00ffcc">' + d + '</span><i class="fa ' + (iconColorMap[daysData[d].icon] || "fa-cloud") + '" style="font-size:2rem; display:block; margin:4px 0;"></i><div><span class="f-temp-max">' + maxT + '°</span><span class="f-temp-min">' + minT + '°</span></div></div>';
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