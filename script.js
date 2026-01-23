var API_KEY = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('selectedCity') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart') || '00:00';
var sEnd = localStorage.getItem('sleepEnd') || '05:30';

var iconColorMap = {
    "01d": "fa-sun-o icon-sun", "01n": "fa-moon-o",
    "02d": "fa-cloud icon-cloud", "02n": "fa-cloud",
    "03d": "fa-cloud icon-cloud", "04d": "fa-cloud",
    "09d": "fa-tint icon-rain", "10d": "fa-umbrella icon-rain",
    "11d": "fa-bolt icon-bolt", "13d": "fa-snowflake-o icon-snow",
    "50d": "fa-bars"
};

function z(n) { return (n < 10 ? '0' : '') + n; }

function checkSleep() {
    var now = new Date();
    var cur = z(now.getHours()) + ":" + z(now.getMinutes());
    var isS = (sStart < sEnd) ? (cur >= sStart && cur < sEnd) : (cur >= sStart || cur < sEnd);
    document.getElementById('night-overlay').style.display = isS ? 'flex' : 'none';
    if(isS) document.getElementById('night-clock').innerText = cur;
}

function updateClock() {
    var now = new Date();
    document.getElementById('clock').innerText = z(now.getHours()) + ":" + z(now.getMinutes());
    document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });
    checkSleep();
}

function fetchWeather() {
    var xhr = new XMLHttpRequest();
    var url = "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(city) + "&appid=" + API_KEY + "&units=metric&lang=de";
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var data = JSON.parse(xhr.responseText);
            var t = data.main.temp;
            var f = data.main.feels_like;
            
            document.getElementById('city-title').innerText = data.name.toUpperCase();
            document.getElementById('temp-display').innerText = t.toFixed(1);
            
            // Gefühlte Temperatur Logik
            var feelsElem = document.getElementById('feels-like-display');
            if (Math.abs(f - t) < 0.5) {
                feelsElem.style.display = 'none';
            } else {
                feelsElem.style.display = 'block';
                feelsElem.innerHTML = "GEFÜHLT " + f.toFixed(1) + "°";
                feelsElem.className = (f > t) ? "warmer" : "colder";
            }
            
            document.getElementById('main-icon').className = "fa " + (iconColorMap[data.weather[0].icon] || "fa-cloud");
            
            var off = data.timezone;
            document.getElementById('sunrise-val').innerText = z(new Date((data.sys.sunrise+off)*1000).getUTCHours()) + ":" + z(new Date((data.sys.sunrise+off)*1000).getUTCMinutes());
            document.getElementById('sunset-val').innerText = z(new Date((data.sys.sunset+off)*1000).getUTCHours()) + ":" + z(new Date((data.sys.sunset+off)*1000).getUTCMinutes());
            
            var wind = Math.round(data.wind.speed * 3.6);
            document.getElementById('info-ticker').innerHTML = "WIND: " + wind + " KM/H --- FEUCHTE: " + data.main.humidity + "% --- DRUCK: " + data.main.pressure + " HPA --- STATUS: ONLINE";
            document.getElementById('update-info').innerText = "Upd: " + z(new Date().getHours()) + ":" + z(new Date().getMinutes());
            fetchForecast();
        }
    };
    xhr.send();
}

function fetchForecast() {
    var xhr = new XMLHttpRequest();
    var url = "https://api.openweathermap.org/data/2.5/forecast?q=" + encodeURIComponent(city) + "&appid=" + API_KEY + "&units=metric&lang=de";
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var dataF = JSON.parse(xhr.responseText);
            // Stunden
            var hL = document.getElementById('hourly-list'); hL.innerHTML = "";
            for(var i=0; i<5; i++) {
                var it = dataF.list[i];
                var icon = iconColorMap[it.weather[0].icon] || "fa-cloud";
                hL.innerHTML += '<div class="f-item"><span>' + new Date(it.dt*1000).getHours() + ':00</span><i class="fa ' + icon + '"></i><b>' + Math.round(it.main.temp) + '°</b></div>';
            }
            // Tage
            var dL = document.getElementById('daily-list'); dL.innerHTML = "";
            var days = {};
            for(var j=0; j<dataF.list.length; j++) {
                var d = new Date(dataF.list[j].dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
                if(!days[d]) days[d] = { max: -99, min: 99, icon: dataF.list[j].weather[0].icon };
                if(dataF.list[j].main.temp > days[d].max) days[d].max = dataF.list[j].main.temp;
                if(dataF.list[j].main.temp < days[d].min) days[d].min = dataF.list[j].main.temp;
            }
            var count = 0;
            for(var day in days) {
                if(count > 0 && count < 6) {
                    var iconD = iconColorMap[days[day].icon] || "fa-cloud";
                    dL.innerHTML += '<div class="f-item"><span style="color:#00ffcc">' + day + '</span><i class="fa ' + iconD + '"></i><span style="color:#ff4d4d">' + Math.round(days[day].max) + '°</span> <span style="color:#00d9ff">' + Math.round(days[day].min) + '°</span></div>';
                }
                count++;
            }
        }
    };
    xhr.send();
}

function toggleSettings() {
    var s = document.getElementById('settings-overlay');
    s.style.display = (s.style.display == 'block') ? 'none' : 'block';
    document.getElementById('city-input').value = city;
    document.getElementById('sleep-start').value = sStart;
    document.getElementById('sleep-end').value = sEnd;
}

function saveAllSettings() {
    localStorage.setItem('selectedCity', document.getElementById('city-input').value);
    localStorage.setItem('sleepStart', document.getElementById('sleep-start').value);
    localStorage.setItem('sleepEnd', document.getElementById('sleep-end').value);
    window.location.reload();
}

function toggleFullscreen() {
    var el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
}

setInterval(updateClock, 1000);
setInterval(fetchWeather, 300000);
updateClock(); fetchWeather();
