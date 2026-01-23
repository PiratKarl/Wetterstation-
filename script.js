var API_KEY = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('selectedCity') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart') || '00:00';
var sEnd = localStorage.getItem('sleepEnd') || '05:30';

function z(n) { return (n < 10 ? '0' : '') + n; }

function updateMoon() {
    var jd = (new Date().getTime() / 86400000) + 2440587.5;
    var phase = ((jd - 2451549.5) / 29.53) % 1;
    var name = "Mond";
    if (phase < 0.05 || phase > 0.95) name = "Neumond";
    else if (phase < 0.55 && phase > 0.45) name = "Vollmond";
    else name = "Halbmond";
    document.getElementById('moon-phase-name').innerText = name;
}

function checkSleep() {
    var now = new Date();
    var cur = z(now.getHours()) + ":" + z(now.getMinutes());
    var isS = (sStart < sEnd) ? (cur >= sStart && cur < sEnd) : (cur >= sStart || cur < sEnd);
    document.getElementById('night-overlay').style.display = isS ? 'flex' : 'none';
    if(isS) document.getElementById('night-clock').innerText = cur;
}

function wakeUp() { document.getElementById('night-overlay').style.display = 'none'; }

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
            
            var off = data.timezone;
            var sunrise = new Date((data.sys.sunrise + off) * 1000);
            var sunset = new Date((data.sys.sunset + off) * 1000);
            document.getElementById('sunrise-val').innerText = z(sunrise.getUTCHours()) + ":" + z(sunrise.getUTCMinutes());
            document.getElementById('sunset-val').innerText = z(sunset.getUTCHours()) + ":" + z(sunset.getUTCMinutes());
            
            updateMoon();
            
            // TICKER-REPARATUR: Einfacher Text ohne komplexe Variablen
            var w = Math.round(data.wind.speed * 3.6);
            var tText = "WIND: " + w + " KM/H --- FEUCHTE: " + data.main.humidity + "% --- DRUCK: " + data.main.pressure + " HPA --- STATUS: AKTIV";
            document.getElementById('info-ticker').innerHTML = tText;
            
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
                hL.innerHTML += '<div class="f-item"><span>' + new Date(it.dt*1000).getHours() + ':00</span><br><b>' + Math.round(it.main.temp) + '°</b></div>';
            }
            // Tage
            var dL = document.getElementById('daily-list'); dL.innerHTML = "";
            var days = {};
            for(var j=0; j<dataF.list.length; j++) {
                var d = new Date(dataF.list[j].dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
                if(!days[d]) days[d] = { max: -99, min: 99 };
                if(dataF.list[j].main.temp > days[d].max) days[d].max = dataF.list[j].main.temp;
                if(dataF.list[j].main.temp < days[d].min) days[d].min = dataF.list[j].main.temp;
            }
            var count = 0;
            for(var day in days) {
                if(count > 0 && count < 6) {
                    dL.innerHTML += '<div class="f-item"><span style="color:#00ffcc">' + day + '</span><br><b style="color:#ff4d4d">' + Math.round(days[day].max) + '°</b> <b style="color:#00d9ff">' + Math.round(days[day].min) + '°</b></div>';
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
setInterval(function() { window.location.reload(); }, 1800000);
updateClock(); fetchWeather();