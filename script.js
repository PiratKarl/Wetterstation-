var API_KEY = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('selectedCity') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart') || '22:00';
var sEnd = localStorage.getItem('sleepEnd') || '06:00';

var timeOffset = 0; 
var lastSuccess = Date.now();
var tickerData = { main: "Warte auf Klick...", wind: "", astro: "", forecast: "" };
var isActivated = false;

// Lädt deine lokalen GIFs
function getIconHtml(iconCode, size) {
    return '<img src="' + iconCode + '.gif" style="width:' + size + 'px; height:auto; vertical-align:middle;">';
}

function z(n) { return (n < 10 ? '0' : '') + n; }

// WACHHALTE-MODUS STARTEN
function activateWakeLock() {
    if(!isActivated) {
        var v = document.getElementById('wake-video');
        v.play();
        var el = document.documentElement;
        if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        
        document.getElementById('wake-status').style.backgroundColor = '#00ffcc';
        isActivated = true;
        tickerData.main = "System aktiv - Lade Wetter...";
        fetchWeather();
    }
}

function updateClock() {
    var now = new Date(Date.now() + timeOffset);
    var cur = z(now.getHours()) + ":" + z(now.getMinutes());
    document.getElementById('clock').innerText = cur;
    document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });
    
    var isS = (sStart < sEnd) ? (cur >= sStart && cur < sEnd) : (cur >= sStart || cur < sEnd);
    document.getElementById('night-overlay').style.display = isS ? 'block' : 'none';
    if(isS) document.getElementById('night-clock').innerText = cur;

    document.getElementById('offline-warn').style.display = (Date.now() - lastSuccess > 900000) ? 'inline-block' : 'none';
}

function buildTicker() {
    var fullText = "+++ AURA WEATHER V1.46 +++ " + tickerData.main + " +++ " + tickerData.wind + " +++ " + tickerData.forecast + " +++ " + tickerData.astro + " +++";
    document.getElementById('info-ticker').innerHTML = fullText.toUpperCase();
}

function fetchWeather() {
    if(!isActivated) return;
    
    // Video-Puls zur Sicherheit
    var v = document.getElementById('wake-video');
    if(v && v.paused) v.play();

    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.openweathermap.org/data/2.5/weather?q="+encodeURIComponent(city)+"&appid="+API_KEY+"&units=metric&lang=de", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var d = JSON.parse(xhr.responseText);
            lastSuccess = Date.now();
            
            // Zeit-Sync vom Server
            var sTime = xhr.getResponseHeader('Date');
            if(sTime) timeOffset = new Date(sTime).getTime() - Date.now();
            
            document.getElementById('temp-display').innerText = Math.round(d.main.temp);
            document.getElementById('city-title').innerText = d.name.toUpperCase();
            
            // Haupt-GIF
            document.getElementById('main-icon-container').innerHTML = getIconHtml(d.weather[0].icon, 110);
            
            var feels = document.getElementById('feels-like');
            feels.innerHTML = '<i class="fa fa-thermometer-half"></i> GEFÜHLT ' + Math.round(d.main.feels_like) + "°";
            feels.className = (d.main.feels_like > d.main.temp) ? "warm" : "kalt";
            
            var off = d.timezone;
            document.getElementById('sunrise-val').innerText = z(new Date((d.sys.sunrise+off)*1000).getUTCHours()) + ":" + z(new Date((d.sys.sunrise+off)*1000).getUTCMinutes());
            document.getElementById('sunset-val').innerText = z(new Date((d.sys.sunset+off)*1000).getUTCHours()) + ":" + z(new Date((d.sys.sunset+off)*1000).getUTCMinutes());
            
            var ph = (((Date.now()/86400000)+2440587.5-2451549.5)/29.53)%1;
            var ms = ["🌑 Neumond","🌙 Zun. Sichel","🌓 Halbmond","🌕 Vollmond","🌗 Halbmond","🌘 Abn. Sichel"];
            document.getElementById('moon-display').innerText = ms[Math.floor(ph*6)] || ms[0];
            
            document.getElementById('update-info').innerText = "UPD: "+z(new Date(Date.now()+timeOffset).getHours())+":"+z(new Date(Date.now()+timeOffset).getMinutes());

            tickerData.main = (d.main.temp < 8 ? "Winterjacke" : (d.main.temp < 17 ? "Übergangsjacke" : "T-Shirt Wetter"));
            tickerData.wind = "Wind: " + Math.round(d.wind.speed * 3.6) + " km/h - Feuchte: " + d.main.humidity + "%";
            tickerData.astro = "Druck: " + d.main.pressure + " hPa";

            fetchForecast();
        }
    };
    xhr.send();
}

function fetchForecast() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.openweathermap.org/data/2.5/forecast?q="+encodeURIComponent(city)+"&appid="+API_KEY+"&units=metric&lang=de", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var f = JSON.parse(xhr.responseText);
            var hRow = "<tr>";
            for(var i=0; i<5; i++) {
                var it = f.list[i];
                hRow += '<td class="f-item"><span style="color:#888;font-size:1.1rem;">'+new Date(it.dt*1000).getHours()+':00</span><br>'+getIconHtml(it.weather[0].icon, 60)+'<br><b>'+Math.round(it.main.temp)+'°</b></td>';
            }
            document.getElementById('hourly-table').innerHTML = hRow + "</tr>";
            
            tickerData.forecast = "Vorschau: " + f.list[1].weather[0].description;

            var days = {};
            for(var j=0; j<f.list.length; j++) {
                var dName = new Date(f.list[j].dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
                if(!days[dName]) days[dName] = { max: -99, min: 99, icon: f.list[j].weather[0].icon };
                if(f.list[j].main.temp > days[dName].max) days[dName].max = f.list[j].main.temp;
                if(f.list[j].main.temp < days[dName].min) days[dName].min = f.list[j].main.temp;
            }
            var dRow = "<tr>"; var c = 0;
            for(var day in days) {
                if(c > 0 && c < 6) {
                    dRow += '<td class="f-item"><span class="f-day-name">'+day+'</span>'+getIconHtml(days[day].icon, 70)+'<br><span class="f-temp-max">'+Math.round(days[day].max)+'°</span><span class="f-temp-min">'+Math.round(days[day].min)+'°</span></td>';
                }
                c++;
            }
            document.getElementById('daily-table').innerHTML = dRow + "</tr>";
            buildTicker(); 
        }
    };
    xhr.send();
}

function toggleSettings() { var s = document.getElementById('settings-overlay'); s.style.display = (s.style.display=='block')?'none':'block'; }
function saveAll() { localStorage.setItem('selectedCity', document.getElementById('city-input').value); localStorage.setItem('sleepStart', document.getElementById('s-start').value); localStorage.setItem('sleepEnd', document.getElementById('s-end').value); window.location.reload(); }
function toggleFullscreen() { var el = document.documentElement; if (el.webkitRequestFullscreen) el.webkitRequestFullscreen(); }

setInterval(updateClock, 1000); 
setInterval(fetchWeather, 300000);
updateClock();