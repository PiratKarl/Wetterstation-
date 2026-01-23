var API_KEY = '518e81d874739701f08842c1a55f6588';
var currentCity = localStorage.getItem('selectedCity') || 'Braunschweig';
var sleepStart = localStorage.getItem('sleepStart') || '00:00';
var sleepEnd = localStorage.getItem('sleepEnd') || '05:30';

var iconColorMap = {
    "01d": "fa-sun-o", "01n": "fa-moon-o",
    "02d": "fa-cloud", "02n": "fa-cloud",
    "03d": "fa-cloud", "04d": "fa-cloud",
    "09d": "fa-tint", "10d": "fa-umbrella",
    "11d": "fa-bolt", "13d": "fa-snowflake-o",
    "50d": "fa-bars"
};

function zero(n) { return (n < 10 ? '0' : '') + n; }

// MONDBERECHNUNG
function updateMoon() {
    var jd = (new Date().getTime() / 86400000) - (new Date().getTimezoneOffset() / 1440) + 2440587.5;
    var phase = ((jd - 2451549.5) / 29.53058867) % 1;
    var name = "Mond"; var icon = "fa-moon-o";
    if (phase < 0.03 || phase > 0.97) { name = "Neumond"; icon = "fa-circle-o"; }
    else if (phase < 0.28) { name = "Halbmond"; icon = "fa-adjust"; }
    else if (phase < 0.53) { name = "Vollmond"; icon = "fa-circle"; }
    else if (phase < 0.78) { name = "Halbmond"; icon = "fa-adjust"; }
    else { name = "Abn. Sichel"; icon = "fa-moon-o"; }
    document.getElementById('moon-phase-name').innerText = name;
    document.getElementById('moon-icon').className = "fa " + icon + " icon-moon";
}

// NACHTMODUS CHECK
function checkSleepMode() {
    var now = new Date();
    var cur = zero(now.getHours()) + ":" + zero(now.getMinutes());
    var overlay = document.getElementById('night-overlay');
    var isSleep = (sleepStart < sleepEnd) ? (cur >= sleepStart && cur < sleepEnd) : (cur >= sleepStart || cur < sleepEnd);
    overlay.style.display = isSleep ? 'flex' : 'none';
    if(isSleep) document.getElementById('night-clock').innerText = cur;
}

function wakeUp() { document.getElementById('night-overlay').style.display = 'none'; }

function updateClock() {
    var now = new Date();
    document.getElementById('clock').innerText = zero(now.getHours()) + ":" + zero(now.getMinutes());
    document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });
    checkSleepMode();
}

async function fetchWeather() {
    try {
        var res = await fetch("https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(currentCity) + "&appid=" + API_KEY + "&units=metric&lang=de");
        var data = await res.json();
        if (data.cod === 200) {
            document.getElementById('city-title').innerText = data.name.toUpperCase();
            document.getElementById('temp-display').innerText = data.main.temp.toFixed(1);
            document.getElementById('main-icon').className = "fa " + (iconColorMap[data.weather[0].icon] || "fa-cloud");
            var off = data.timezone;
            document.getElementById('sunrise-val').innerText = zero(new Date((data.sys.sunrise+off)*1000).getUTCHours()) + ":" + zero(new Date((data.sys.sunrise+off)*1000).getUTCMinutes());
            document.getElementById('sunset-val').innerText = zero(new Date((data.sys.sunset+off)*1000).getUTCHours()) + ":" + zero(new Date((data.sys.sunset+off)*1000).getUTCMinutes());
            updateMoon();
            document.getElementById('update-info').innerText = "Upd: " + zero(new Date().getHours()) + ":" + zero(new Date().getMinutes());
        }
        
        // VORSCHAU LADEN
        var resF = await fetch("https://api.openweathermap.org/data/2.5/forecast?q=" + encodeURIComponent(currentCity) + "&appid=" + API_KEY + "&units=metric&lang=de");
        var dataF = await resF.json();
        
        // 1. STUNDEN
        var hL = document.getElementById('hourly-list'); 
        hL.innerHTML = "";
        for(var i=0; i<5; i++) {
            var it = dataF.list[i];
            hL.innerHTML += '<div class="f-item"><span style="color:#555; display:block; font-size:0.9rem;">' + new Date(it.dt*1000).getHours() + ':00</span><i class="fa ' + (iconColorMap[it.weather[0].icon] || "fa-cloud") + '" style="font-size:1.8rem; margin:5px 0; display:block;"></i><b>' + Math.round(it.main.temp) + '°</b></div>';
        }
        
        // 2. TAGE
        var dL = document.getElementById('daily-list'); 
        dL.innerHTML = ""; 
        var days = {};
        dataF.list.forEach(function(it) {
            var d = new Date(it.dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
            if(!days[d]) days[d] = { temps: [], icon: it.weather[0].icon };
            days[d].temps.push(it.main.temp);
        });
        Object.keys(days).slice(1, 6).forEach(function(d) {
            var mx = Math.round(Math.max.apply(Math, days[d].temps)); 
            var mn = Math.round(Math.min.apply(Math, days[d].temps));
            dL.innerHTML += '<div class="f-item"><span style="color:#00ffcc; display:block; font-size:0.9rem;">' + d + '</span><i class="fa ' + (iconColorMap[days[d].icon] || "fa-cloud") + '" style="font-size:1.8rem; margin:5px 0; display:block;"></i><span class="f-temp-max">' + mx + '°</span><span class="f-temp-min">' + mn + '°</span></div>';
        });
        
    } catch (e) { console.log("Wetter-Fehler:", e); }
}

function toggleSettings() {
    var s = document.getElementById('settings-overlay');
    if (s.style.display === 'block') { s.style.display = 'none'; }
    else {
        document.getElementById('city-input').value = currentCity;
        document.getElementById('sleep-start').value = sleepStart;
        document.getElementById('sleep-end').value = sleepEnd;
        s.style.display = 'block';
    }
}

function saveAllSettings() {
    localStorage.setItem('selectedCity', document.getElementById('city-input').value.trim());
    localStorage.setItem('sleepStart', document.getElementById('sleep-start').value);
    localStorage.setItem('sleepEnd', document.getElementById('sleep-end').value);
    window.location.reload();
}

function toggleFullscreen() {
    var elem = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    }
}

// Intervalle
setInterval(updateClock, 1000);
setInterval(fetchWeather, 300000);
setInterval(function() { window.location.reload(); }, 1500000); 

updateClock(); fetchWeather();
