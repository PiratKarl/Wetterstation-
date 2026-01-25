// AURA WEATHER V2.8 - GLOBAL EDITION
// Fixes: UV Calc for Cairo vs Germany, Timezone corrected

var API_KEY = '518e81d874739701f08842c1a55f6588';

var city = localStorage.getItem('selectedCity') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart') || '22:00';
var sEnd = localStorage.getItem('sleepEnd') || '06:00';

var timeOffset = 0; 
var isActivated = false;
var videoUrl = "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4";
var tickerData = { main: "", wind: "", clothing: "", uv: "", pressure: "", humidity: "" };

function z(n) { return (n < 10 ? '0' : '') + n; }
function timeToMins(t) {
    if(!t || t.indexOf(':') === -1) return 0;
    var p = t.split(':');
    return (parseInt(p[0], 10) * 60) + parseInt(p[1], 10);
}

// === UHR ===
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
    var startOv = document.getElementById('start-overlay');
    var video = document.getElementById('wake-video');

    if (overlay) {
        if (isSleepTime) {
            if(overlay.style.display !== 'block') {
                overlay.style.display = 'block';
                if(startOv) startOv.style.display = 'none';
                document.getElementById('night-clock').innerText = curStr;
            } else {
                document.getElementById('night-clock').innerText = curStr;
            }
            if(video.getAttribute('src') !== "") {
                video.pause(); video.setAttribute('src', ""); video.load();
            }
        } else {
            if(overlay.style.display !== 'none') overlay.style.display = 'none';
            if (isActivated) {
                if(startOv) startOv.style.display = 'none';
                if(video.getAttribute('src') === "") {
                    video.setAttribute('src', videoUrl); video.load();
                }
                if(video.paused) video.play().catch(function(e){});
            }
        }
    }
}

function activateWakeLock() {
    var startScreen = document.getElementById('start-overlay');
    if(startScreen) startScreen.style.display = 'none';

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

// === WETTER ===
function fetchWeather() {
    if(!isActivated) return;
    var xhr = new XMLHttpRequest();
    var url = "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(city) + "&appid=" + API_KEY + "&units=metric&lang=de&t=" + new Date().getTime();
    
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var d = JSON.parse(xhr.responseText);
            
            var temp = Math.round(d.main.temp);
            document.getElementById('temp-display').innerText = temp;
            document.getElementById('city-title').innerText = d.name.toUpperCase();
            
            var iconCode = d.weather[0].icon;
            document.getElementById('main-icon-container').innerHTML = '<img src="' + iconCode + '.gif" width="110" onerror="this.src=\'https://openweathermap.org/img/wn/'+iconCode+'@2x.png\'">';
            
            var feel = Math.round(d.main.feels_like);
            document.getElementById('feels-like').innerText = "GEFÜHLT " + feel + "°";
            
            var rise = new Date((d.sys.sunrise + d.timezone - 3600) * 1000);
            var set = new Date((d.sys.sunset + d.timezone - 3600) * 1000);
            document.getElementById('sunrise-val').innerText = z(rise.getHours()) + ":" + z(rise.getMinutes());
            document.getElementById('sunset-val').innerText = z(set.getHours()) + ":" + z(set.getMinutes());
            
            var desc = d.weather[0].description;
            var rain = (desc.indexOf("regen") !== -1 || desc.indexOf("schnee") !== -1);
            var tips = "";
            if(temp < 5) tips = "❄ WINTERJACKE & MÜTZE";
            else if(temp < 12) tips = "🧥 WARME JACKE";
            else if(temp < 18) tips = "🧣 ÜBERGANGSJACKE";
            else if(temp < 25) tips = "👕 T-SHIRT WETTER";
            else tips = "🕶 KURZE KLEIDUNG";
            if(rain) tips += " + ☂ SCHIRM";
            tickerData.clothing = tips;
            
            var sym = "";
            if(desc.indexOf("klar")!==-1) sym = "☀";
            else if(desc.indexOf("wolken")!==-1) sym = "☁";
            else if(desc.indexOf("regen")!==-1) sym = "🌧";
            else if(desc.indexOf("schnee")!==-1) sym = "❄";
            else if(desc.indexOf("gewitter")!==-1) sym = "⚡";
            
            tickerData.main = sym + " " + desc.toUpperCase();
            tickerData.wind = "💨 WIND: " + Math.round(d.wind.speed * 3.6) + " KM/H";
            tickerData.pressure = "hPa: " + d.main.pressure;
            tickerData.humidity = "💧 LUFT: " + d.main.humidity + "%";
            
            // UV mit Breitengrad und Zeitzone
            calculateSmartUV(d.coord.lat, d.clouds.all, d.timezone);

            updateTicker();
            fetchForecast(d.coord.lat, d.coord.lon);
            document.getElementById('moon-txt').innerText = getMoonPhaseName(new Date());
        }
    };
    xhr.send();
}

// === DER NEUE INTELLIGENTE UV RECHNER (V2.8) ===
function calculateSmartUV(lat, clouds, timezoneOffset) {
    // 1. Lokale Zeit der Stadt berechnen
    var nowUTC = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
    var cityTime = new Date(nowUTC + (timezoneOffset * 1000));
    var hour = cityTime.getHours();
    var month = cityTime.getMonth();

    // 2. Breitengrad-Faktor (Je näher am Äquator (0), desto stärker die Sonne)
    // Deutschland ~52°, Kairo ~30°
    var absLat = Math.abs(lat);
    var latFactor = (90 - absLat) / 90; // Bei 0° = 1.0, Bei 90° = 0.0

    // 3. Saison-Faktor
    var seasonFactor = 0;
    // Winter Nordhalbkugel (Okt-Feb)
    if (month >= 9 || month <= 2) {
        // Im Winter ist der Unterschied extrem:
        // In Deutschland (Lat > 45) ist die Sonne fast weg (Faktor 0.2)
        // In Kairo (Lat < 35) ist sie noch moderat (Faktor 0.6)
        seasonFactor = (absLat > 40) ? 0.2 : 0.6;
    } else if (month >= 3 && month <= 8) {
        seasonFactor = 1.0; // Sommer
    } else {
        seasonFactor = 0.7; // Übergang
    }

    // 4. Basis-Maximalwert (Theoretisch)
    var maxPotential = 12 * latFactor * seasonFactor;

    // 5. Tageszeit (Parabel)
    var timeFactor = 0;
    if(hour >= 11 && hour <= 14) timeFactor = 1.0;     
    else if(hour >= 9 && hour <= 16) timeFactor = 0.7; 
    else if(hour >= 7 && hour <= 18) timeFactor = 0.3; 
    
    // 6. Wolkenabzug
    var cloudFactor = 1.0 - (clouds / 100 * 0.6); 

    var uv = Math.round(maxPotential * timeFactor * cloudFactor);
    
    // Sicherheit: Nachts immer 0
    if(hour < 6 || hour > 20) uv = 0;
    
    // Anzeige
    var uvEl = document.getElementById('uv-val');
    uvEl.innerText = uv;
    if(uv <= 2) uvEl.style.color = "#00ff00"; 
    else if(uv <= 5) uvEl.style.color = "#ffff00"; 
    else if(uv <= 7) uvEl.style.color = "#ff9900"; 
    else uvEl.style.color = "#ff0000"; 
    tickerData.uv = "UV: " + uv;
}

function getMoonPhaseName(date) {
    var year = date.getFullYear(); var month = date.getMonth() + 1; var day = date.getDate();
    if (month < 3) { year--; month += 12; }
    ++month;
    var c = 365.25 * year; var e = 30.6 * month;
    var jd = c + e + day - 694039.09; jd /= 29.5305882;
    var b = parseInt(jd); jd -= b; b = Math.round(jd * 8);
    if (b >= 8) b = 0;
    var phases = ["🌑 NEUMOND", "🌒 ZUNEHMEND", "🌓 HALBMOND", "🌔 ZUNEHMEND", "🌕 VOLLMOND", "🌖 ABNEHMEND", "🌗 HALBMOND", "🌘 ABNEHMEND"];
    return phases[b];
}

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
        var ic = item.weather[0].icon;
        html += '<td class="f-item"><div class="f-time">' + z(time.getHours()) + ' UHR</div><img class="f-icon-img" src="' + ic + '.gif" onerror="this.src=\'https://openweathermap.org/img/wn/'+ic+'.png\'"><div class="f-temp-line">' + Math.round(item.main.temp) + '°</div></td>';
    }
    html += "</tr>";
    document.getElementById('hourly-table').innerHTML = html;
}

function renderDaily(list) {
    var html = "<tr>";
    var daysProcessed = 0;
    for(var i=0; i<list.length - 8; i+=8) {
        if(daysProcessed >= 4) break;
        var minT = 100; var maxT = -100; var dayName = ""; var iconStr = "";
        for(var k=0; k<8; k++) {
            var idx = i + k; if(idx >= list.length) break; var it = list[idx];
            if(it.main.temp_min < minT) minT = it.main.temp_min;
            if(it.main.temp_max > maxT) maxT = it.main.temp_max;
            if(k==4) { dayName = new Date(it.dt * 1000).toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase(); iconStr = it.weather[0].icon; }
        }
        if(dayName === "") dayName = new Date(list[i].dt * 1000).toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase();
        if(iconStr === "") iconStr = list[i].weather[0].icon;
        html += '<td class="f-item"><div class="f-day-name">' + dayName + '</div><img class="f-icon-img" src="' + iconStr + '.gif" onerror="this.src=\'https://openweathermap.org/img/wn/'+iconStr+'.png\'"><div><span class="temp-high">' + Math.round(maxT) + '°</span><span class="temp-sep">/</span><span class="temp-low">' + Math.round(minT) + '°</span></div></td>';
        daysProcessed++;
    }
    html += "</tr>";
    document.getElementById('daily-table').innerHTML = html;
}

function updateTicker() {
    var t = document.getElementById('info-ticker');
    var uvTxt = tickerData.uv ? "  +++  " + tickerData.uv : "";
    t.innerText = tickerData.clothing + "  +++  " + tickerData.main + uvTxt + "  +++  " + tickerData.humidity + "  +++  " + tickerData.wind + "  +++  " + tickerData.pressure + "  +++  " + city.toUpperCase();
}

function toggleSettings() { var s = document.getElementById('settings-overlay'); s.style.display = (s.style.display==='block')?'none':'block'; if(s.style.display==='block'){ document.getElementById('city-input').value = city; document.getElementById('s-start').value = sStart; document.getElementById('s-end').value = sEnd; } }
function toggleSub(id) { var el = document.getElementById(id); el.style.display = (el.style.display === 'block') ? 'none' : 'block'; }
function saveAll() { city = document.getElementById('city-input').value; sStart = document.getElementById('s-start').value; sEnd = document.getElementById('s-end').value; localStorage.setItem('selectedCity', city); localStorage.setItem('sleepStart', sStart); localStorage.setItem('sleepEnd', sEnd); location.reload(); }
function fullReset() { if(confirm("Wirklich alles zurücksetzen?")) { localStorage.clear(); location.reload(); } }

setInterval(updateClock, 1000); 
setInterval(fetchWeather, 600000);
updateClock();
