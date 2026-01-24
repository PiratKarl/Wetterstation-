var API_KEY = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('selectedCity') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart') || '22:00';
var sEnd = localStorage.getItem('sleepEnd') || '06:00';

var timeOffset = 0; 
var isActivated = false;
var tickerData = { main: "", wind: "", uv: "UV: --", forecast: "", astro: "" };
var uvValue = 0;

function z(n) { return (n < 10 ? '0' : '') + n; }

// Hilfsfunktion: Wandelt "HH:mm" in Minuten seit Mitternacht um
function timeToMins(t) {
    var p = t.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
}

function updateClock() {
    var now = new Date(Date.now() + timeOffset);
    var h = now.getHours();
    var m = now.getMinutes();
    var curStr = z(h) + ":" + z(m);
    var nowMins = h * 60 + m;
    
    document.getElementById('clock').innerText = curStr;
    document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });

    // ABSCHALTAUTOMATIK LOGIK (Minuten-Vergleich)
    var startMins = timeToMins(sStart);
    var endMins = timeToMins(sEnd);
    var isSleepTime = false;

    if (startMins > endMins) {
        // Über Mitternacht (z.B. 22:00 bis 06:00)
        isSleepTime = (nowMins >= startMins || nowMins < endMins);
    } else {
        // Am gleichen Tag (z.B. 13:00 bis 15:00)
        isSleepTime = (nowMins >= startMins && nowMins < endMins);
    }

    var overlay = document.getElementById('night-overlay');
    if (isSleepTime) {
        overlay.style.display = 'block';
        document.getElementById('night-clock').innerText = curStr;
        // Video pausieren nachts um Energie zu sparen
        document.getElementById('wake-video').pause();
    } else {
        overlay.style.display = 'none';
        // Video nur am Tag starten, wenn aktiviert
        if (isActivated) document.getElementById('wake-video').play();
    }
}

// Restliche Funktionen (Auszug der wichtigsten Änderungen)
function activateWakeLock() {
    var v = document.getElementById('wake-video');
    v.play();
    if (!isActivated) {
        var el = document.documentElement;
        if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        document.getElementById('wake-status').style.backgroundColor = '#00ffcc';
        isActivated = true;
        fetchWeather();
    }
}

// Alle 10 Sekunden die Abschaltautomatik prüfen
setInterval(updateClock, 10000); 
setInterval(fetchWeather, 300000);
updateClock();

function toggleSettings() { 
    var s = document.getElementById('settings-overlay');
    s.style.display = (s.style.display==='block') ? 'none' : 'block';
}

function saveAll() { 
    localStorage.setItem('selectedCity', document.getElementById('city-input').value); 
    localStorage.setItem('sleepStart', document.getElementById('s-start').value); 
    localStorage.setItem('sleepEnd', document.getElementById('s-end').value); 
    window.location.reload(); 
}