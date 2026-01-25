// AURA WEATHER V2.1 HYBRID - OPEN WEATHER + OPEN METEO
var API_KEY = '518e81d874739701f08842c1a55f6588';

var city = localStorage.getItem('selectedCity') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart') || '22:00';
var sEnd = localStorage.getItem('sleepEnd') || '06:00';

var timeOffset = 0; 
var isActivated = false;
var videoUrl = "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4";

var tickerData = { main: "System...", wind: "", astro: "", uv: "" };

function z(n) { return (n < 10 ? '0' : '') + n; }
function timeToMins(t) {
    if(!t || t.indexOf(':') === -1) return 0;
    var p = t.split(':');
    return (parseInt(p[0], 10) * 60) + parseInt(p[1], 10);
}

// UHRZEIT & NACHTMODUS (Unverändert stabil)
function updateClock() {
    var now = new Date(Date.now() + timeOffset);
    var h = now.getHours();
    var m = now.getMinutes();
    var curStr = z(h) + ":" + z(m);
    var nowMins = (h * 60) + m;
    
    if(document.getElementById('clock')) document.getElementById('clock').innerText = curStr;
    if(document.getElementById('date')) document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });

    var startMins = timeToMins(sStart);
    var endMins = timeToMins(sEnd);
    var effectiveStart = startMins - 10; 
    if (effectiveStart < 0) effectiveStart = 1440 + effectiveStart;

    var isSleepTime = false;
    if (effectiveStart > endMins) {
        if (nowMins >= effectiveStart || nowMins < endMins) isSleepTime = true;
    } else {
        if (nowMins >= effectiveStart && nowMins < endMins) isSleepTime = true;
    }

    var overlay = document.getElementById('night-overlay');
    var video = document.getElementById('wake-video');

    if (overlay) {
        if (isSleepTime) {
            if(overlay.style.display !== 'block') {
                overlay.style.display = 'block';
                document.getElementById('night-clock').innerText = curStr;
            } else {
                document.getElementById('night-clock').innerText = curStr;
            }
            if(video.getAttribute('src') !== "") {
                video.pause();
                video.setAttribute('src', ""); 
                video.load();
            }
        } else {
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

// 1. SCHRITT: STANDARD DATEN VON OPENWEATHERMAP
function fetchWeather() {
    if(!isActivated) return;
    var xhr = new XMLHttpRequest();
    var url = "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(city) + "&appid=" + API_KEY + "&units=metric&lang=de&t=" + new Date().getTime();
    
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var d = JSON.parse(xhr.responseText);
            
            // UI Standard
            document.getElementById('temp-display').innerText = Math.round(d.main.temp);
            document.getElementById('city-title').innerText = d.name.toUpperCase();
            document.getElementById('main-icon-container').innerHTML = '<img src="https://openweathermap.org/img/wn/' + d.weather[0].icon + '@2x.png" width="90">';
            
            var feel = Math.round(d.main.feels_like);
            var elFeel = document.getElementById('feels-like');
            elFeel.innerText = "GEFÜHLT " + feel + "°";
            elFeel.style.color = (feel < 10) ? '#00aaff' : (feel > 25 ? '#ff4d4d' : '#ccc');

            var rise = new Date((d.sys.sunrise + d.timezone - 3600) * 1000);
            var set = new Date((d.sys.sunset + d.timezone - 3600) * 1000);
            document.getElementById('sunrise-val').innerText = z(rise.getHours()) + ":" + z(rise.getMinutes());
            document.getElementById('sunset-val').innerText = z(set.getHours()) + ":" + z(set.getMinutes());
            
            tickerData.main = d.weather[0].description.toUpperCase();
            tickerData.wind = "WIND: " + Math.round(d.wind.speed * 3.6) + " KM/H";
            tickerData.astro = "LUFTDRUCK: " + d.main.pressure + " hPa";
            
            updateTicker();
            fetchForecast(d.coord.lat, d.coord.lon);
            
            // HIER STARTEN WIR DEN ZWEITEN DIENST (Open-Meteo)
            fetchExtraData(d.coord.lat, d.coord.lon);
        }
    };
    xhr.send();
}

// 2. SCHRITT: EXTRA DATEN (UV & MOND) VON OPEN-METEO (KOSTENLOS)
function fetchExtraData(lat, lon) {
    var xhr = new XMLHttpRequest();
    // Wir fragen nur nach UV Index und Tages-Wettercodes
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&daily=uv_index_max,weathercode&timezone=auto";
    
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var d = JSON.parse(xhr.responseText);
            
            // UV Index heute
            var uv = d.daily.uv_index_max[0];
            var uvEl = document.getElementById('uv-val');
            uvEl.innerText = uv;
            
            // UV Farbe Ampel
            if(uv <= 2) uvEl.style.color = "#00ff00"; // Grün
            else if(uv <= 5) uvEl.style.color = "#ffff00"; // Gelb
            else if(uv <= 7) uvEl.style.color = "#ff9900"; // Orange
            else uvEl.style.color = "#ff0000"; // Rot/Gefahr
            
            tickerData.uv = "UV-INDEX: " + uv;

            // Mondphase (Berechnung als Näherung oder Text)
            // Open-Meteo liefert leider keinen direkten Mondphasen-Namen in der Gratis-Version,
            // aber wir nutzen eine einfache Datums-Rechnung für den Mondtext, da API limitiert ist.
            var moonText = getMoonPhaseName(new Date());
            document.getElementById('moon-txt').innerText = moonText;
            
            updateTicker();
        }
    };
    xhr.send();
}

// Einfache Mondphasen-Berechnung (Da keine API das gratis gut liefert)
function getMoonPhaseName(date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var c = 0; var e = 0; var jd = 0; var b = 0;
    if (month < 3) { year--; month += 12; }
    ++month;
    c = 365.25 * year;
    e = 30.6 * month;
    jd = c + e + day - 694039.09;
    jd /= 29.5305882;
    b = parseInt(jd);
    jd -= b;
    b = Math.round(jd * 8);
    if (b >= 8) b = 0;
    
    var phases = ["NEUMOND", "ZUNEHMEND", "HALBMOND (1.VIERTEL)", "ZUNEHMEND", "VOLLMOND", "ABNEHMEND", "HALBMOND (3.VIERTEL)", "ABNEHMEND"];
    return phases[b];
}

// STANDARD FORECAST LOGIK
function fetchForecast(lat, lon) {
    var xhr = new XMLHttpRequest();
    var url = "https://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon + "&appid=" + API_KEY + "&units=metric&lang=de&t=" + new Date().getTime();
    
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
    var extra = tickerData.uv ? "  +++  " + tickerData.uv : "";
    t.innerText = tickerData.main + "  +++  " + tickerData.wind + "  +++  " + tickerData.astro + extra + "  +++  " + city.toUpperCase();
}

function toggleSettings() { 
    var s = document.getElementById('settings-overlay');
    if(s.style.display === 'block') s.style.display = 'none';
    else {
        s.style.display = 'block';
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

setInterval(updateClock, 1000); 
setInterval(fetchWeather, 600000);
updateClock();