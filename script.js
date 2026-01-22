var API_KEY = '518e81d874739701f08842c1a55f6588';
var currentCity = localStorage.getItem('selectedCity') || 'Braunschweig';

var iconColorMap = {
    "01d": "fa-sun-o icon-sun", "01n": "fa-moon-o icon-cloud",
    "02d": "fa-cloud icon-cloud", "02n": "fa-cloud icon-cloud",
    "03d": "fa-cloud icon-cloud", "04d": "fa-cloud icon-cloud",
    "09d": "fa-tint icon-rain", "10d": "fa-umbrella icon-rain",
    "11d": "fa-bolt icon-bolt", "13d": "fa-snowflake-o icon-snow",
    "50d": "fa-bars icon-cloud"
};

function zero(n) { return (n < 10 ? '0' : '') + n; }

function getWindDirText(deg) {
    var dir = ['Nord', 'Nordost', 'Ost', 'Südost', 'Süd', 'Südwest', 'West', 'Nordwest'];
    return dir[Math.round(deg / 45) % 8];
}

function getBeaufortText(kmh) {
    if (kmh < 1) return "Windstille";
    if (kmh < 12) return "leichte Brise";
    if (kmh < 29) return "frischer Wind";
    if (kmh < 50) return "steifer Wind";
    if (kmh < 75) return "stürmischer Wind";
    if (kmh < 103) return "Sturm";
    return "Orkan";
}

function getClothingTip(temp, isRain) {
    var tip = "";
    if (temp < 5) tip = "❄️ WINTER: Dick anziehen!";
    else if (temp < 15) tip = "🧥 Übergangsjacke empfohlen.";
    else if (temp < 23) tip = "👕 T-Shirt Wetter.";
    else tip = "🕶️ HEISS: Luftig kleiden!";
    if (isRain) tip += " ☔ Schirm mitnehmen!";
    return tip;
}

function getWarnings(data) {
    var warns = [];
    var wind = Math.round(data.wind.speed * 3.6);
    if (wind > 60) warns.push({t: "⚠️ STURM-WARNUNG!", c: "warn-orange"});
    if (data.main.temp < -3) warns.push({t: "❄️ FROST-GEFAHR!", c: "warn-frost"});
    if (data.main.temp > 30) warns.push({t: "🔥 HITZE-WARNUNG!", c: "warn-red"});
    return warns;
}

function updateClock() {
    var now = new Date();
    document.getElementById('clock').innerText = zero(now.getHours()) + ":" + zero(now.getMinutes());
    document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });
}

async function fetchWeather() {
    try {
        var url = "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(currentCity) + "&appid=" + API_KEY + "&units=metric&lang=de&_t=" + Date.now();
        var res = await fetch(url);
        var data = await res.json();
        
        if (data.cod === 200) {
            var temp = data.main.temp;
            var feels = data.main.feels_like;
            document.getElementById('city-title').innerText = data.name.toUpperCase();
            document.getElementById('temp-display').innerText = temp.toFixed(1);
            document.getElementById('main-icon').className = "fa " + (iconColorMap[data.weather[0].icon] || "fa-cloud");
            
            var feelsElem = document.getElementById('feels-like-display');
            var diff = feels - temp;
            if (Math.abs(diff) < 0.3) {
                feelsElem.className = "hidden";
            } else {
                feelsElem.innerHTML = "<small>GEFÜHLT </small>" + feels.toFixed(1) + "°";
                feelsElem.className = (feels > temp) ? "warmer" : "colder";
            }

            var offset = data.timezone;
            var sunrise = new Date((data.sys.sunrise + offset) * 1000);
            var sunset = new Date((data.sys.sunset + offset) * 1000);
            document.getElementById('sunrise-val').innerText = zero(sunrise.getUTCHours()) + ":" + zero(sunrise.getUTCMinutes());
            document.getElementById('sunset-val').innerText = zero(sunset.getUTCHours()) + ":" + zero(sunset.getUTCMinutes());

            var ticker = document.getElementById('info-ticker');
            ticker.innerHTML = "";
            var warnings = getWarnings(data);
            warnings.forEach(function(w) { ticker.innerHTML += '<span class="' + w.c + '">' + w.t + ' +++ </span>'; });
            ticker.innerHTML += '<span>' + getClothingTip(temp, (data.weather[0].main === "Rain")) + ' +++ </span>';
            var windKmh = Math.round(data.wind.speed * 3.6);
            ticker.innerHTML += '<span>WIND: ' + windKmh + ' KM/H (' + getWindDirText(data.wind.deg) + ', ' + getBeaufortText(windKmh) + ') +++ </span>';
            ticker.innerHTML += '<span>DRUCK: ' + data.main.pressure + ' HPA +++ </span>';

            document.getElementById('update-info').innerText = "Upd: " + zero(new Date().getHours()) + ":" + zero(new Date().getMinutes());
        }

        var resF = await fetch("https://api.openweathermap.org/data/2.5/forecast?q=" + encodeURIComponent(currentCity) + "&appid=" + API_KEY + "&units=metric&lang=de");
        var dataF = await resF.json();

        var hList = document.getElementById('hourly-list'); hList.innerHTML = "";
        for(var i=0; i<5; i++) {
            var it = dataF.list[i];
            hList.innerHTML += '<div class="f-item"><span class="f-label">' + new Date(it.dt*1000).getHours() + ':00</span><i class="fa ' + (iconColorMap[it.weather[0].icon] || "fa-cloud") + '" style="font-size:1.8rem; display:block; margin:2px 0;"></i><span class="f-temp-hour">' + Math.round(it.main.temp) + '°</span></div>';
        }

        var dList = document.getElementById('daily-list'); dList.innerHTML = "";
        var days = {};
        dataF.list.forEach(function(it) {
            var d = new Date(it.dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
            if(!days[d]) days[d] = { temps: [], icon: it.weather[0].icon };
            days[d].temps.push(it.main.temp);
        });
        Object.keys(days).slice(1, 6).forEach(function(d) {
            var maxT = Math.round(Math.max.apply(Math, days[d].temps));
            var minT = Math.round(Math.min.apply(Math, days[d].temps));
            dList.innerHTML += '<div class="f-item"><span class="f-label" style="color:#00ffcc">' + d + '</span><i class="fa ' + (iconColorMap[days[d].icon] || "fa-cloud") + '" style="font-size:2rem; display:block; margin:4px 0;"></i><div><span class="f-temp-max">' + maxT + '°</span><span class="f-temp-min">' + minT + '°</span></div></div>';
        });

    } catch (e) { console.log(e); }
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

setInterval(updateClock, 1000);
setInterval(fetchWeather, 300000);
setInterval(function() { window.location.reload(); }, 1500000); 

updateClock(); fetchWeather();