var API_KEY = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('selectedCity') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart') || '00:00';
var sEnd = localStorage.getItem('sleepEnd') || '05:30';

var timeOffset = 0; // Differenz zur Serverzeit in Millisekunden
var lastSuccess = Date.now();

function z(n) { return (n < 10 ? '0' : '') + n; }

function updateClock() {
    // Die aktuelle Zeit wird um den berechneten Offset korrigiert
    var now = new Date(Date.now() + timeOffset);
    var cur = z(now.getHours()) + ":" + z(now.getMinutes());
    
    document.getElementById('clock').innerText = cur;
    document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });
    
    var isS = (sStart < sEnd) ? (cur >= sStart && cur < sEnd) : (cur >= sStart || cur < sEnd);
    document.getElementById('night-overlay').style.display = isS ? 'block' : 'none';
    if(isS) document.getElementById('night-clock').innerText = cur;

    // Verbindungs-Check: Wenn länger als 15 Min kein Update kam -> Warnung an
    if (Date.now() - lastSuccess > 900000) {
        document.getElementById('offline-warn').style.display = 'inline-block';
    } else {
        document.getElementById('offline-warn').style.display = 'none';
    }
}

function fetchWeather() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(city) + "&appid=" + API_KEY + "&units=metric&lang=de", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                var data = JSON.parse(xhr.responseText);
                lastSuccess = Date.now();
                
                // --- ZEIT-SYNCHRONISATION ---
                // OpenWeather schickt 'dt' (Unix Zeit der Daten)
                // Wir nutzen aber den 'Date' Header der HTTP Antwort für die echte Serverzeit
                var serverTimeStr = xhr.getResponseHeader('Date');
                if (serverTimeStr) {
                    var serverTime = new Date(serverTimeStr).getTime();
                    timeOffset = serverTime - Date.now();
                }

                document.getElementById('temp-display').innerText = Math.round(data.main.temp);
                document.getElementById('city-title').innerText = data.name.toUpperCase();
                
                var feels = document.getElementById('feels-like');
                feels.innerHTML = "GEFÜHLT " + Math.round(data.main.feels_like) + "°";
                feels.className = (data.main.feels_like > data.main.temp) ? "warm" : "kalt";

                document.getElementById('main-icon').style.color = "#fff";
                
                var off = data.timezone;
                document.getElementById('sunrise-val').innerText = z(new Date((data.sys.sunrise+off)*1000).getUTCHours()) + ":" + z(new Date((data.sys.sunrise+off)*1000).getUTCMinutes());
                document.getElementById('sunset-val').innerText = z(new Date((data.sys.sunset+off)*1000).getUTCHours()) + ":" + z(new Date((data.sys.sunset+off)*1000).getUTCMinutes());
                
                document.getElementById('update-info').innerText = "UPD: " + z(new Date(Date.now() + timeOffset).getHours()) + ":" + z(new Date(Date.now() + timeOffset).getMinutes());
                
                fetchForecast();
            }
        }
    };
    xhr.send();
}

// ... Rest der Funktionen (fetchForecast, toggleSettings, saveAll, toggleFullscreen) bleibt gleich wie in V1.37 ...
// Hier zur Kürzung weggelassen, aber im echten Dokument bitte beibehalten.

function fetchForecast() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.openweathermap.org/data/2.5/forecast?q=" + encodeURIComponent(city) + "&appid=" + API_KEY + "&units=metric&lang=de", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var dataF = JSON.parse(xhr.responseText);
            var hT = document.getElementById('hourly-table');
            var hRow = "<tr>";
            for(var i=0; i<5; i++) {
                var it = dataF.list[i];
                hRow += '<td class="f-item"><span style="color:#eee">' + new Date(it.dt*1000).getHours() + ':00</span><br><i class="fa fa-cloud f-icon"></i><br><b>' + Math.round(it.main.temp) + '°</b></td>';
            }
            hT.innerHTML = hRow + "</tr>";
            // ... (Tagesvorhersage Logik wie in V1.37) ...
        }
    };
    xhr.send();
}

function toggleSettings() {
    var s = document.getElementById('settings-overlay');
    s.style.display = (s.style.display == 'block') ? 'none' : 'block';
}

function saveAll() {
    localStorage.setItem('selectedCity', document.getElementById('city-input').value);
    localStorage.setItem('sleepStart', document.getElementById('s-start').value);
    localStorage.setItem('sleepEnd', document.getElementById('s-end').value);
    window.location.reload();
}

function toggleFullscreen() {
    var el = document.documentElement;
    if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
}

setInterval(updateClock, 1000);
setInterval(fetchWeather, 300000);
updateClock(); fetchWeather();
