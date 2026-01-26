// AURA WEATHER V2.9 - TICKER TALK (SAFE SLEEP & GRACE PERIOD)
// Features: Fullscreen Video Curtain, Safe Start, 60s Delay on Restart

var API_KEY = '518e81d874739701f08842c1a55f6588';

// Einstellungen laden
var city = localStorage.getItem('selectedCity') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart'); // Kein Standardwert = Safe Start
var sEnd = localStorage.getItem('sleepEnd');

var timeOffset = 0; 
var isActivated = false;
var videoUrl = "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4";

// === NEU: GNADENFRIST VARIABLE ===
var isGracePeriod = true; // Startet immer mit "Ja"
// Nach 60 Sekunden (60000 ms) wird die Gnadenfrist beendet
setTimeout(function() {
    isGracePeriod = false;
    // Wir erzwingen ein Update, damit der Vorhang sofort fällt
    updateClock();
}, 60000);

// Daten Container
var tickerData = { main: "", wind: "", clothing: "", pressure: "", humidity: "", pop: "", vis: "" };

function z(n) { return (n < 10 ? '0' : '') + n; }
function timeToMins(t) {
    if(!t || t.indexOf(':') === -1) return 0;
    var p = t.split(':');
    return (parseInt(p[0], 10) * 60) + parseInt(p[1], 10);
}

// === UHR & INTELLIGENTE SLEEP-FUNKTION ===
function updateClock() {
    var now = new Date(Date.now() + timeOffset);
    var h = now.getHours();
    var m = now.getMinutes();
    var curStr = z(h) + ":" + z(m);
    var nowMins = (h * 60) + m;
    
    // Uhrzeit im UI aktualisieren
    if(document.getElementById('clock')) document.getElementById('clock').innerText = curStr;
    if(document.getElementById('date')) document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });

    var isSleepTime = false;

    // Nur prüfen, wenn Zeiten gespeichert sind
    if (sStart && sEnd) {
        var startMins = timeToMins(sStart);
        var endMins = timeToMins(sEnd);
        
        if (startMins > endMins) {
            if (nowMins >= startMins || nowMins < endMins) isSleepTime = true;
        } else {
            if (nowMins >= startMins && nowMins < endMins) isSleepTime = true;
        }
    }

    // === HIER GREIFT DIE GNADENFRIST ===
    // Wenn Schlafenszeit ist, ABER wir noch in der ersten Minute sind: WACH BLEIBEN!
    if (isSleepTime && isGracePeriod) {
        isSleepTime = false; // Wir tun so, als wäre es Tag
        showGraceNote(true); // Zeige Warnhinweis
    } else {
        showGraceNote(false); // Warnhinweis weg
    }

    // Video-Element holen
    var video = document.getElementById('wake-video');
    var startOv = document.getElementById('start-overlay');
    
    // Sicherheits-Check: Video muss immer laufen!
    if (isActivated && video) {
         if(video.paused) video.play().catch(function(e){});
         if(!video.getAttribute('src') || video.getAttribute('src') === "") {
             video.setAttribute('src', videoUrl); 
             video.load();
         }
    }

    if (isSleepTime) {
        // === NACHT-MODUS (Vorhang zu) ===
        if (video && !video.classList.contains('video-sleep-mode')) {
            video.classList.add('video-sleep-mode');
            if(startOv) startOv.style.display = 'none';
        }
    } else {
        // === TAG-MODUS (Vorhang auf) ===
        if (video && video.classList.contains('video-sleep-mode')) {
            video.classList.remove('video-sleep-mode');
        }
    }
}

// === HILFSFUNKTION FÜR DEN HINWEIS ===
// Erzeugt automatisch eine kleine rote Box oben im Bild
function showGraceNote(show) {
    var note = document.getElementById('grace-note');
    if (show) {
        if (!note) {
            note = document.createElement('div');
            note.id = 'grace-note';
            note.style.position = 'fixed';
            note.style.top = '0';
            note.style.left = '0';
            note.style.width = '100%';
            note.style.backgroundColor = '#b71c1c'; // Dunkelrot
            note.style.color = '#fff';
            note.style.textAlign = 'center';
            note.style.padding = '5px';
            note.style.zIndex = '10000'; // Ganz weit oben
            note.style.fontWeight = 'bold';
            note.style.fontSize = '1.2em';
            note.innerText = '⏳ NACHTMODUS PAUSE (1 MIN)';
            document.body.appendChild(note);
        }
        note.style.display = 'block';
    } else {
        if (note) note.style.display = 'none';
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
            var rain = (desc.indexOf("regen") !== -1 || desc.indexOf("schnee") !== -1 || desc.indexOf("niesel") !== -1);
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
            tickerData.pressure = "DRUCK: " + d.main.pressure + " hPa";
            tickerData.humidity = "💧 FEUCHTIGKEIT: " + d.main.humidity + "%";
            
            var vis = d.visibility;
            if(vis) {
                if(vis >= 1000) tickerData.vis = "👁 SICHT: " + (vis/1000).toFixed(1) + " KM";
                else tickerData.vis = "👁 SICHT: " + vis + " METER";
            } else { tickerData.vis = ""; }

            updateTicker();
            fetchForecast(d.coord.lat, d.coord.lon);
            document.getElementById('moon-txt').innerText = getMoonPhaseName(new Date());
        }
    };
    xhr.send();
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
            if(d.list && d.list.length > 0) {
                var pop = d.list[0].pop;
                var popPerc = Math.round(pop * 100);
                tickerData.pop = "☔ REGEN-RISIKO: " + popPerc + "%";
                updateTicker();
            }
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
    var text = "";
    text += tickerData.clothing;
    text += "  +++  " + tickerData.main;
    if(tickerData.pop !== "") text += "  +++  " + tickerData.pop;
    if(tickerData.vis !== "") text += "  +++  " + tickerData.vis;
    text += "  +++  " + tickerData.humidity;
    text += "  +++  " + tickerData.wind;
    text += "  +++  " + tickerData.pressure;
    t.innerText = text;
}

function toggleSettings() { 
    var s = document.getElementById('settings-overlay'); 
    s.style.display = (s.style.display==='block')?'none':'block'; 
    if(s.style.display==='block'){ 
        document.getElementById('city-input').value = city; 
        document.getElementById('s-start').value = sStart || '22:00'; 
        document.getElementById('s-end').value = sEnd || '06:00'; 
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

function fullReset() { if(confirm("Wirklich alles zurücksetzen?")) { localStorage.clear(); location.reload(); } }

// Intervalle
setInterval(updateClock, 1000); 
setInterval(fetchWeather, 600000);
updateClock();
