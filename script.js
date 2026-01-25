// AURA WEATHER V1.67 - SYNC MASTER
var API_KEY = '518e81d874739701f08842c1a55f6588';

var city = localStorage.getItem('selectedCity') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart') || '22:00';
var sEnd = localStorage.getItem('sleepEnd') || '06:00';

var timeOffset = 0; 
var isActivated = false;
var videoUrl = "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4";

var tickerData = { main: "System Start...", wind: "", uv: "", forecast: "", astro: "" };

function z(n) { return (n < 10 ? '0' : '') + n; }

function timeToMins(t) {
    if(!t || t.indexOf(':') === -1) return 0;
    var p = t.split(':');
    return (parseInt(p[0], 10) * 60) + parseInt(p[1], 10);
}

function updateClock() {
    var now = new Date(Date.now() + timeOffset);
    var h = now.getHours();
    var m = now.getMinutes();
    var curStr = z(h) + ":" + z(m);
    var nowMins = (h * 60) + m;
    
    if(document.getElementById('clock')) document.getElementById('clock').innerText = curStr;
    if(document.getElementById('date')) document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });

    // --- NEUE LOGIK: 10 MINUTEN VORLAUF ---
    var startMins = timeToMins(sStart);
    var endMins = timeToMins(sEnd);
    
    // Wir ziehen 10 Minuten von der Startzeit ab
    var effectiveStart = startMins - 10;
    
    // Falls das über Mitternacht zurückgeht (z.B. 00:05 -> 23:55)
    if (effectiveStart < 0) effectiveStart = 1440 + effectiveStart;

    var isSleepTime = false;

    // Prüfen mit der neuen "effektiven" Zeit
    if (effectiveStart > endMins) {
        // Über Mitternacht (Normalfall bei Nachtmodus)
        if (nowMins >= effectiveStart || nowMins < endMins) isSleepTime = true;
    } else {
        // Gleicher Tag
        if (nowMins >= effectiveStart && nowMins < endMins) isSleepTime = true;
    }

    var overlay = document.getElementById('night-overlay');
    var video = document.getElementById('wake-video');

    if (overlay) {
        if (isSleepTime) {
            // NACHT (Video aus -> Tablet zählt 10 Min runter -> Aus)
            if(overlay.style.display !== 'flex') {
                overlay.style.display = 'flex';
                document.getElementById('night-clock').innerText = curStr;
            }
            if(video.getAttribute('src') !== "") {
                video.pause();
                video.setAttribute('src', ""); 
                video.load();
            }
        } else {
            // TAG
            if(overlay.style.display !== 'none') overlay.style.display = 'none';
            if (isActivated) {
                if(video.getAttribute('src') === "") {
                    video.setAttribute('src', videoUrl);
                    video.load();
                }
                if(video.paused) video.play().catch(function(e){});
            }
        }
    }
}

// --- STANDARD FUNKTIONEN ---
function activateWakeLock() {
    var v = document.getElementById('wake-video');
    if(v.getAttribute('src') === "" || !v.getAttribute('src')) v.setAttribute('src', videoUrl);
    v.play();
    if (!isActivated) {
        var el = document.documentElement;
        if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        document.getElementById('wake-status').style.backgroundColor = '#00ffcc';
        isActivated = true;
        fetchWeather();
    }
}

function fetchWeather() {
    if(!isActivated) return;
    var xhr = new XMLHttpRequest();
    var url = "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(city) + "&appid=" + API_KEY + "&units=metric&lang=de";
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var d = JSON.parse(xhr.responseText);
            var sTime = xhr.getResponseHeader('Date');
            if(sTime) timeOffset = new Date(sTime).getTime() - Date.now();
            
            document.getElementById('temp-display').innerText = Math.round(d.main.temp);
            document.getElementById('city-title').innerText = d.name.toUpperCase();
            document.getElementById('main-icon-container').innerHTML = '<img src="https://openweathermap.org/img/wn/' + d.weather[0].icon + '@2x.png" width="100">';
            
            var feel = Math.round(d.main.feels_like);
            document.getElementById('feels-like').innerText = "GEFÜHLT " + feel + "°";
            document.getElementById('feels-like').style.color = (feel < 10) ? '#00aaff' : (feel > 25 ? '#ff4d4d' : '#ccc');

            var rise = new Date((d.sys.sunrise + d.timezone - 3600) * 1000);
            var set = new Date((d.sys.sunset + d.timezone - 3600) * 1000);
            document.getElementById('sunrise-val').innerText = z(rise.getHours()) + ":" + z(rise.getMinutes());
            document.getElementById('sunset-val').innerText = z(set.getHours()) + ":" + z(set.getMinutes());
            
            tickerData.main = d.weather[0].description.toUpperCase();
            tickerData.wind = "WIND: " + Math.round(d.wind.speed * 3.6) + " KM/H";
            tickerData.astro = "LUFTDRUCK: " + d.main.pressure + " hPa";
            updateTicker();
            fetchForecast(d.coord.lat, d.coord.lon);
        }
    };
    xhr.send();
}

function fetchForecast(lat, lon) {
    var xhr = new XMLHttpRequest();
    var url = "https://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon + "&appid=" + API_KEY + "&units=metric&lang=de";
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var d = JSON.parse(xhr.responseText);
            renderHourly(d.list);
            renderDaily(d.list);
        }
    };
    xhr.send();
}

function renderHourly(list) {
    var html = "<tr>";
    for(var i=0; i<4; i++) {
        var item = list[i];
        var time = new Date(item.dt * 1000);
        html += '<td class="f-item"><div class="f-time">' + z(time.getHours()) + ' UHR</div><img class="f-icon-img" src="https://openweathermap.org/img/wn/' + item.weather[0].icon + '.png"><div class="f-temp-line">' + Math.round(item.main.temp) + '°</div></td>';
    }
    html += "</tr>";
    document.getElementById('hourly-table').innerHTML = html;
}

function renderDaily(list) {
    var html = "<tr>";
    var count = 0;
    for(var i=7; i<list.length; i+=8) {
        if(count >= 4) break;
        var item = list[i];
        var dayName = new Date(item.dt * 1000).toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase();
        html += '<td class="f-item"><div class="f-day-name">' + dayName + '</div><img class="f-icon-img" src="https://openweathermap.org/img/wn/' + item.weather[0].icon + '.png"><div class="f-temp-line">' + Math.round(item.main.temp) + '°</div></td>';
        count++;
    }
    html += "</tr>";
    document.getElementById('daily-table').innerHTML = html;
}

function updateTicker() {
    var t = document.getElementById('info-ticker');
    t.innerText = tickerData.main + "  +++  " + tickerData.wind + "  +++  " + tickerData.astro + "  +++  " + city.toUpperCase();
}

function toggleSettings() { 
    var s = document.getElementById('settings-overlay');
    s.style.display = (s.style.display==='block') ? 'none' : 'block';
    if(s.style.display==='block'){
        document.getElementById('city-input').value = city;
        document.getElementById('s-start').value = sStart;
        document.getElementById('s-end').value = sEnd;
    }
}
function toggleSub(id) { var el = document.getElementById(id); el.style.display = (el.style.display === 'block') ? 'none' : 'block'; }
function saveAll() { 
    city = document.getElementById('city-input').value;
    sStart = document.getElementById('s-start').value;
    sEnd = document.getElementById('s-end').value;
    localStorage.setItem('selectedCity', city); 
    localStorage.setItem('sleepStart', sStart); 
    localStorage.setItem('sleepEnd', sEnd); 
    location.reload(); 
}
function testNightMode() {
    var overlay = document.getElementById('night-overlay');
    overlay.style.display = 'flex';
    document.getElementById('night-clock').innerText = "TEST";
    var video = document.getElementById('wake-video');
    video.pause();
    video.setAttribute('src', ""); 
    setTimeout(function() {
        overlay.style.display = 'none';
        video.setAttribute('src', videoUrl);
        video.load();
        video.play();
        updateClock(); 
        alert("Test Ende. Wenn es echt Nacht wäre, würde das Tablet jetzt bald ausgehen.");
    }, 5000);
}

setInterval(updateClock, 1000); 
setInterval(fetchWeather, 300000);
updateClock();
