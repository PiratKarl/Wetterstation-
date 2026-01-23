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

// --- VOLLBILD LOGIK ---
function toggleFullscreen() {
    var elem = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (elem.requestFullscreen) { elem.requestFullscreen(); }
        else if (elem.webkitRequestFullscreen) { elem.webkitRequestFullscreen(); } // Für alte Safari/Chrome
    } else {
        if (document.exitFullscreen) { document.exitFullscreen(); }
        else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
    }
}

function updateMoon() {
    var now = new Date();
    var jd = (now.getTime() / 86400000) - (now.getTimezoneOffset() / 1440) + 2440587.5;
    var cycles = (jd - 2451549.5) / 29.53058867;
    var phase = cycles - Math.floor(cycles);
    var name = "Mond"; var icon = "fa-moon-o";
    if (phase < 0.03 || phase > 0.97) { name = "Neumond"; icon = "fa-circle-o"; }
    else if (phase < 0.22) { name = "Zun. Sichel"; icon = "fa-moon-o"; }
    else if (phase < 0.28) { name = "Halbmond"; icon = "fa-adjust"; }
    else if (phase < 0.47) { name = "Zun. Mond"; icon = "fa-circle"; }
    else if (phase < 0.53) { name = "Vollmond"; icon = "fa-circle"; }
    else if (phase < 0.72) { name = "Abn. Mond"; icon = "fa-circle"; }
    else if (phase < 0.78) { name = "Halbmond"; icon = "fa-adjust"; }
    else { name = "Abn. Sichel"; icon = "fa-moon-o"; }
    document.getElementById('moon-phase-name').innerText = name;
    document.getElementById('moon-icon').className = "fa " + icon + " icon-moon";
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
            var t = data.main.temp; var f = data.main.feels_like;
            document.getElementById('city-title').innerText = data.name.toUpperCase();
            document.getElementById('temp-display').innerText = t.toFixed(1);
            document.getElementById('main-icon').className = "fa " + (iconColorMap[data.weather[0].icon] || "fa-cloud");
            var feelsElem = document.getElementById('feels-like-display');
            if (Math.abs(f - t) < 0.4) feelsElem.className = "hidden";
            else { feelsElem.innerHTML = "<small>GEFÜHLT </small>" + f.toFixed(1) + "°"; feelsElem.className = (f > t) ? "warmer" : "colder"; }
            var off = data.timezone;
            document.getElementById('sunrise-val').innerText = zero(new Date((data.sys.sunrise+off)*1000).getUTCHours()) + ":" + zero(new Date((data.sys.sunrise+off)*1000).getUTCMinutes());
            document.getElementById('sunset-val').innerText = zero(new Date((data.sys.sunset+off)*1000).getUTCHours()) + ":" + zero(new Date((data.sys.sunset+off)*1000).getUTCMinutes());
            updateMoon();
            var wind = Math.round(data.wind.speed * 3.6);
            document.getElementById('info-ticker').innerHTML = "WIND: " + wind + " KM/H +++ DRUCK: " + data.main.pressure + " HPA +++ FEUCHTE: " + data.main.humidity + "% +++ SYSTEM-STATUS: VOLLBILD BEREIT";
            document.getElementById('update-info').innerText = "Upd: " + zero(new Date().getHours()) + ":" + zero(new Date().getMinutes());
        }
        var resF = await fetch("https://api.openweathermap.org/data/2.5/forecast?q=" + encodeURIComponent(currentCity) + "&appid=" + API_KEY + "&units=metric&lang=de");
        var dataF = await resF.json();
        var hL = document.getElementById('hourly-list'); hL.innerHTML = "";
        for(var i=0; i<5; i++) {
            var it = dataF.list[i];
            hList.innerHTML += '<div class="f-item"><span class="f-label">' + new Date(it.dt*1000).getHours() + ':00</span><i class="fa ' + (iconColorMap[it.weather[0].icon] || "fa-cloud") + '" style="font-size:1.8rem; display:block; margin:2px 0;"></i><span class="f-temp-hour">' + Math.round(it.main.temp) + '°</span></div>';
        }
        var dL = document.getElementById('daily-list'); dL.innerHTML = ""; var days = {};
        dataF.list.forEach(function(it) {
            var d = new Date(it.dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
            if(!days[d]) days[d] = { temps: [], icon: it.weather[0].icon };
            days[d].temps.push(it.main.temp);
        });
        Object.keys(days).slice(1, 6).forEach(function(d) {
            var mx = Math.round(Math.max.apply(Math, days[d].temps)); var mn = Math.round(Math.min.apply(Math, days[d].temps));
            dL.innerHTML += '<div class="f-item"><span class="f-label" style="color:#00ffcc">' + d + '</span><i class="fa ' + (iconColorMap[days[d].icon] || "fa-cloud") + '" style="font-size:2rem; display:block; margin:4px 0;"></i><div><span class="f-temp-max">' + mx + '°</span><span class="f-temp-min">' + mn + '°</span></div></div>';
        });
    } catch (e) { console.log(e); }
}

function toggleSettings() { var s = document.getElementById('settings-overlay'); s.style.display = (s.style.display === 'block') ? 'none' : 'block'; }
function saveCity() { var v = document.getElementById('city-input').value.trim(); if(v) { localStorage.setItem('selectedCity', v); window.location.reload(); } }

setInterval(updateClock, 1000);
setInterval(fetchWeather, 300000);
// Wachmacher: Seite alle 25 Min neu laden
setInterval(function() { 
    var v = document.getElementById('no-sleep-video');
    if(v) v.play();
    window.location.reload(); 
}, 1500000); 

updateClock(); fetchWeather();