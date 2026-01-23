var API_KEY = '518e81d874739701f08842c1a55f6588';
var currentCity = localStorage.getItem('selectedCity') || 'Braunschweig';
var sleepStart = localStorage.getItem('sleepStart') || '00:00';
var sleepEnd = localStorage.getItem('sleepEnd') || '05:30';

var iconColorMap = {
    "01d": "fa-sun-o icon-sun", "01n": "fa-moon-o icon-cloud",
    "02d": "fa-cloud icon-cloud", "02n": "fa-cloud icon-cloud",
    "03d": "fa-cloud icon-cloud", "04d": "fa-cloud icon-cloud",
    "09d": "fa-tint icon-rain", "10d": "fa-umbrella icon-rain",
    "11d": "fa-bolt icon-bolt", "13d": "fa-snowflake-o icon-snow",
    "50d": "fa-bars icon-cloud"
};

function zero(n) { return (n < 10 ? '0' : '') + n; }

// --- NACHTMODUS LOGIK ---
function checkSleepMode() {
    var now = new Date();
    var currentTime = zero(now.getHours()) + ":" + zero(now.getMinutes());
    var overlay = document.getElementById('night-overlay');
    
    // Prüfen ob aktuelle Zeit im Schlaf-Bereich liegt
    var isSleep = false;
    if (sleepStart < sleepEnd) {
        isSleep = (currentTime >= sleepStart && currentTime < sleepEnd);
    } else {
        // Über Mitternacht hinaus
        isSleep = (currentTime >= sleepStart || currentTime < sleepEnd);
    }

    if (isSleep) {
        overlay.style.display = 'flex';
        document.getElementById('night-clock').innerText = currentTime;
    } else {
        overlay.style.display = 'none';
    }
}

function wakeUp() {
    document.getElementById('night-overlay').style.display = 'none';
}

function updateClock() {
    var now = new Date();
    document.getElementById('clock').innerText = zero(now.getHours()) + ":" + zero(now.getMinutes());
    document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });
    checkSleepMode(); // Jede Minute prüfen
}

async function fetchWeather() {
    try {
        var url = "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(currentCity) + "&appid=" + API_KEY + "&units=metric&lang=de&_t=" + Date.now();
        var res = await fetch(url);
        var data = await res.json();
        if (data.cod === 200) {
            document.getElementById('city-title').innerText = data.name.toUpperCase();
            document.getElementById('temp-display').innerText = data.main.temp.toFixed(1);
            document.getElementById('main-icon').className = "fa " + (iconColorMap[data.weather[0].icon] || "fa-cloud");
            document.getElementById('update-info').innerText = "Upd: " + zero(new Date().getHours()) + ":" + zero(new Date().getMinutes());
            
            var wind = Math.round(data.wind.speed * 3.6);
            document.getElementById('info-ticker').innerHTML = "SYSTEMBEREIT +++ WIND: " + wind + " KM/H +++ FEUCHTE: " + data.main.humidity + "% +++ TIP: UHR TIPPEN FÜR VOLLBILD";
        }
    } catch (e) { console.log(e); }
}

function toggleSettings() {
    var s = document.getElementById('settings-overlay');
    if (s.style.display === 'block') {
        s.style.display = 'none';
    } else {
        // Werte in Felder laden
        document.getElementById('city-input').value = currentCity;
        document.getElementById('sleep-start').value = sleepStart;
        document.getElementById('sleep-end').value = sleepEnd;
        s.style.display = 'block';
    }
}

function saveAllSettings() {
    var city = document.getElementById('city-input').value.trim();
    var s = document.getElementById('sleep-start').value;
    var e = document.getElementById('sleep-end').value;
    
    if(city) localStorage.setItem('selectedCity', city);
    localStorage.setItem('sleepStart', s);
    localStorage.setItem('sleepEnd', e);
    
    window.location.reload();
}

function toggleFullscreen() {
    var elem = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    }
}

setInterval(updateClock, 1000);
setInterval(fetchWeather, 300000);
setInterval(function() { window.location.reload(); }, 1500000); 

updateClock(); fetchWeather();