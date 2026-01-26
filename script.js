// AURA WEATHER V2.9 - FINAL (SAFE START)
var API_KEY = '518e81d874739701f08842c1a55f6588';

var city = localStorage.getItem('selectedCity') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart'); 
var sEnd = localStorage.getItem('sleepEnd');

var timeOffset = 0; 
var isActivated = false;
var videoUrl = "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4";

// Gnadenfrist Variable
var isGracePeriod = false; 

var tickerData = { main: "", wind: "", clothing: "", pressure: "", humidity: "", pop: "", vis: "" };

function z(n) { return (n < 10 ? '0' : '') + n; }
function timeToMins(t) {
    if(!t || t.indexOf(':') === -1) return 0;
    var p = t.split(':');
    return (parseInt(p[0], 10) * 60) + parseInt(p[1], 10);
}

// === WICHTIG: START FUNKTION ===
function activateWakeLock() {
    // 1. Start Screen ausblenden
    var startScreen = document.getElementById('start-overlay');
    if(startScreen) startScreen.style.display = 'none';

    // 2. Video starten (Wake Lock)
    var v = document.getElementById('wake-video');
    if(v.getAttribute('src') === "" || !v.getAttribute('src')) v.setAttribute('src', videoUrl);
    v.play().catch(function(e){ console.log("Video Error", e); });
    
    // 3. Vollbild anfordern
    var el = document.documentElement;
    if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    if (el.requestFullscreen) el.requestFullscreen();

    // 4. Gnadenfrist starten (60 Sekunden)
    isGracePeriod = true;
    setTimeout(function() {
        isGracePeriod = false;
        updateClock(); // Sofort prüfen
    }, 60000);

    // 5. App aktivieren
    if (!isActivated) {
        isActivated = true;
        fetchWeather();
        updateClock();
    }
}

function updateClock() {
    var now = new Date(Date.now() + timeOffset);
    var h = now.getHours(); var m = now.getMinutes();
    var nowMins = (h * 60) + m;
    
    if(document.getElementById('clock')) document.getElementById('clock').innerText = z(h) + ":" + z(m);
    
    var days = ['SO.','MO.','DI.','MI.','DO.','FR.','SA.'];
    var months = ['JAN.','FEB.','MÄRZ','APR.','MAI','JUNI','JULI','AUG.','SEP.','OKT.','NOV.','DEZ.'];
    var dateStr = days[now.getDay()] + ", " + now.getDate() + ". " + months[now.getMonth()];
    if(document.getElementById('date')) document.getElementById('date').innerText = dateStr;

    var isSleepTime = false;
    if (sStart && sEnd) {
        var startMins = timeToMins(sStart);
        var endMins = timeToMins(sEnd);
        if (startMins > endMins) {
            if (nowMins >= startMins || nowMins < endMins) isSleepTime = true;
        } else {
            if (nowMins >= startMins && nowMins < endMins) isSleepTime = true;
        }
    }

    // Gnadenfrist Check
    if (isSleepTime && isGracePeriod) {
        isSleepTime = false;
        showGraceNote(true);
    } else {
        showGraceNote(false);
    }

    // Video & Vorhang Steuerung
    var video = document.getElementById('wake-video');
    
    if (isActivated && video) {
         if(video.paused) video.play().catch(function(e){});
         
         if (isSleepTime) {
             // NACHT
             if (!video.classList.contains('video-sleep-mode')) {
                 video.classList.add('video-sleep-mode');
             }
         } else {
             // TAG
             if (video.classList.contains('video-sleep-mode')) {
                 video.classList.remove('video-sleep-mode');
             }
         }
    }
}

function showGraceNote(show) {
    var note = document.getElementById('grace-note');
    if (show) {
        if (!note) {
            note = document.createElement('div');
            note.id = 'grace-note';
            note.style.position = 'fixed'; note.style.top = '0'; note.style.left = '0';
            note.style.width = '100%'; note.style.background = '#b71c1c'; 
            note.style.color = '#fff'; note.style.textAlign = 'center'; note.style.padding = '10px';
            note.style.zIndex = '9500'; note.style.fontWeight = 'bold'; note.style.fontSize = '1.2em';
            note.innerText = '⏳ NACHTMODUS PAUSE (1 MIN)';
            document.body.appendChild(note);
        }
        note.style.display = 'block';
    } else {
        if (note) note.style.display = 'none';
    }
}

function fetchWeather() {
    if(!isActivated) return;
    var xhr = new XMLHttpRequest();
    var url = "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(city) + "&appid=" + API_KEY + "&units=metric&lang=de&t=" + new Date().getTime();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var d = JSON.parse(xhr.responseText);
            document.getElementById('temp-display').innerText = Math.round(d.main.temp) + "°";
            document.getElementById('city-title').innerText = d.name.toUpperCase();
            
            var iconCode = d.weather[0].icon;
            document.getElementById('main-icon-container').innerHTML = '<img src="' + iconCode + '.gif" width="110" onerror="this.src=\'https://openweathermap.org/img/wn/'+iconCode+'@2x.png\'">';
            
            document.getElementById('feels-like').innerText = "GEFÜHLT " + Math.round(d.main.feels_like) + "°";
            
            var rise = new Date((d.sys.sunrise + d.timezone - 3600) * 1000);
            var set = new Date((d.sys.sunset + d.timezone - 3600) * 1000);
            document.getElementById('sunrise-val').innerText = z(rise.getHours()) + ":" + z(rise.getMinutes());
            document.getElementById('sunset-val').innerText = z(set.getHours()) + ":" + z(set.getMinutes());
            
            // Ticker Info
            var desc = d.weather[0].description.toUpperCase();
            var wind = Math.round(d.wind.speed * 3.6);
            var hum = d.main.humidity;
            
            var tText = desc + " +++ WIND: " + wind + " KM/H +++ FEUCHTE: " + hum + "% +++ DRUCK: " + d.main.pressure + " HPA +++ VORSCHAU";
            document.getElementById('info-ticker').innerText = tText;

            fetchForecast(d.coord.lat, d.coord.lon);
            document.getElementById('moon-txt').innerText = "Mondphase"; 
        }
    };
    xhr.send();
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
    for(var i=0; i<5; i++) {
        var item = list[i];
        var time = new Date(item.dt * 1000);
        var ic = item.weather[0].icon;
        html += '<td><div class="f-time">' + z(time.getHours()) + ':00</div><img class="f-icon-img" src="' + ic + '.gif" onerror="this.src=\'https://openweathermap.org/img/wn/'+ic+'.png\'"><div class="f-temp-line">' + Math.round(item.main.temp) + '°</div><div style="font-size:0.7em; color:#00eaff;">' + Math.round(item.pop*100) + '%</div></td>';
    }
    html += "</tr>";
    document.getElementById('hourly-table').innerHTML = html;
}

function renderDaily(list) {
    var html = "<tr>";
    var daysProcessed = 0;
    for(var i=0; i<list.length - 8; i+=8) {
        if(daysProcessed >= 5) break;
        var minT = 100; var maxT = -100; var iconStr = ""; var popMax = 0;
        var dayName = new Date(list[i].dt * 1000).toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase();
        
        for(var k=0; k<8; k++) {
            var idx = i + k; if(idx >= list.length) break; var it = list[idx];
            if(it.main.temp_min < minT) minT = it.main.temp_min;
            if(it.main.temp_max > maxT) maxT = it.main.temp_max;
            if(k==4) iconStr = it.weather[0].icon;
            if(it.pop > popMax) popMax = it.pop;
        }
        if(iconStr === "") iconStr = list[i].weather[0].icon;
        
        html += '<td><div class="f-day-name">' + dayName.substr(0,2) + '</div><img class="f-icon-img" src="' + iconStr + '.gif" onerror="this.src=\'https://openweathermap.org/img/wn/'+iconStr+'.png\'"><div><span class="temp-high">' + Math.round(maxT) + '°</span> <span class="temp-low">' + Math.round(minT) + '°</span></div><div style="font-size:0.7em; color:#00eaff;">' + Math.round(popMax*100) + '%</div></td>';
        daysProcessed++;
    }
    html += "</tr>";
    document.getElementById('daily-table').innerHTML = html;
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

function saveAll() { 
    city = document.getElementById('city-input').value; 
    sStart = document.getElementById('s-start').value; 
    sEnd = document.getElementById('s-end').value; 
    localStorage.setItem('selectedCity', city); 
    localStorage.setItem('sleepStart', sStart); 
    localStorage.setItem('sleepEnd', sEnd); 
    location.reload(); 
}

function fullReset() { if(confirm("Reset?")) { localStorage.clear(); location.reload(); } }

// Intervalle
setInterval(updateClock, 1000); 
setInterval(fetchWeather, 600000);
