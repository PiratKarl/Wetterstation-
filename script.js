var API_KEY = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('selectedCity') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart') || '00:00';
var sEnd = localStorage.getItem('sleepEnd') || '05:30';

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
            document.getElementById('city-title').innerText = data.name.toUpperCase();
            document.getElementById('temp-display').innerText = data.main.temp.toFixed(1);
            
            var sunrise = new Date((data.sys.sunrise + data.timezone) * 1000);
            var sunset = new Date((data.sys.sunset + data.timezone) * 1000);
            document.getElementById('sunrise-val').innerText = z(sunrise.getUTCHours()) + ":" + z(sunrise.getUTCMinutes());
            document.getElementById('sunset-val').innerText = z(sunset.getUTCHours()) + ":" + z(sunset.getUTCMinutes());
            
            var wind = Math.round(data.wind.speed * 3.6);
            document.getElementById('info-ticker').innerHTML = "WIND: " + wind + " KM/H --- FEUCHTE: " + data.main.humidity + "% --- DRUCK: " + data.main.pressure + " HPA --- STATUS: BEREIT";
            
            fetchForecast();
        }
    };
    xhr.send();
}

function fetchForecast() {
    var xhr = new XMLHttpRequest();
    var url = "https://api.openweathermap.org/data/2.5/forecast?q=" + encodeURIComponent(city) + "&appid=" + API_KEY + "&units=metric&lang=de";
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var dataF = JSON.parse(xhr.responseText);
            var hL = document.getElementById('hourly-list'); hL.innerHTML = "";
            for(var i=0; i<5; i++) {
                var it = dataF.list[i];
                hL.innerHTML += '<div class="f-item"><span>' + new Date(it.dt*1000).getHours() + ':00</span><br><b>' + Math.round(it.main.temp) + '°</b></div>';
            }
            var dL = document.getElementById('daily-list'); dL.innerHTML = "";
            var days = {};
            for(var j=0; j<dataF.list.length; j++) {
                var dName = new Date(dataF.list[j].dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
                if(!days[dName]) days[dName] = { max: -99, min: 99 };
                if(dataF.list[j].main.temp > days[dName].max) days[dName].max = dataF.list[j].main.temp;
                if(dataF.list[j].main.temp < days[dName].min) days[dName].min = dataF.list[j].main.temp;
            }
            var count = 0;
            for(var d in days) {
                if(count > 0 && count < 6) {
                    dL.innerHTML += '<div class="f-item"><span style="color:#00ffcc">' + d + '</span><br><b style="color:#ff4d4d">' + Math.round(days[d].max) + '°</b> <b style="color:#00d9ff">' + Math.round(days[d].min) + '°</b></div>';
                }
                count++;
            }
        }
    };
    xhr.open("GET", url, true);
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