var API_KEY = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('selectedCity') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart') || '22:00';
var sEnd = localStorage.getItem('sleepEnd') || '06:00';

var timeOffset = 0; 
var lastSuccess = Date.now();
var tickerData = { main: "", wind: "", astro: "", forecast: "", uv: "" };
var isActivated = false;

function z(n) { return (n < 10 ? '0' : '') + n; }

// Astro-Zeit Fix
function formatUnix(unix, timezone) {
    if (!unix) return "--:--";
    // Umrechnung in Millisekunden inkl. Timezone-Shift von OpenWeather
    var d = new Date((unix + timezone) * 1000);
    return z(d.getUTCHours()) + ":" + z(d.getUTCMinutes());
}

function getIconHtml(iconCode, size) {
    return '<img src="' + iconCode + '.gif" style="width:' + size + 'px; height:auto; vertical-align:middle;">';
}

function activateWakeLock() {
    if(!isActivated) {
        var v = document.getElementById('wake-video');
        v.play();
        var el = document.documentElement;
        if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        document.getElementById('wake-status').style.backgroundColor = '#00ffcc';
        isActivated = true;
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
    
    // Menü Info
    var m = document.getElementById('menu-sleep-info');
    if(m) m.innerText = "NACHTMODUS: " + sStart + " BIS " + sEnd + " UHR";
}

function fetchWeather() {
    if(!isActivated) return;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.openweathermap.org/data/2.5/weather?q="+encodeURIComponent(city)+"&appid="+API_KEY+"&units=metric&lang=de", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var d = JSON.parse(xhr.responseText);
            lastSuccess = Date.now();
            var sTime = xhr.getResponseHeader('Date');
            if(sTime) timeOffset = new Date(sTime).getTime() - Date.now();
            
            document.getElementById('temp-display').innerText = Math.round(d.main.temp);
            document.getElementById('city-title').innerText = d.name.toUpperCase();
            document.getElementById('main-icon-container').innerHTML = getIconHtml(d.weather[0].icon, 120);
            document.getElementById('feels-like').innerHTML = "GEFÜHLT " + Math.round(d.main.feels_like) + "°";
            
            // ASTRO DATEN SETZEN
            document.getElementById('sunrise-val').innerText = formatUnix(d.sys.sunrise, d.timezone);
            document.getElementById('sunset-val').innerText = formatUnix(d.sys.sunset, d.timezone);
            
            var ph = (((Date.now()/86400000)+2440587.5-2451549.5)/29.53)%1;
            var ms = ["🌑 Neumond","🌙 Zun. Sichel","🌓 Halbmond","🌕 Vollmond","🌗 Halbmond","🌘 Abn. Sichel"];
            document.getElementById('moon-display').innerText = ms[Math.floor(ph*6)] || ms[0];

            tickerData.main = d.weather[0].description;
            tickerData.wind = "WIND: " + Math.round(d.wind.speed * 3.6) + " KM/H";
            tickerData.astro = "DRUCK: " + d.main.pressure + " HPA";
            
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
            
            // Stunden
            var hRow = "<tr>";
            for(var i=0; i<5; i++) {
                var it = f.list[i];
                var pop = it.pop ? Math.round(it.pop * 100) : 0;
                hRow += '<td class="f-item"><span class="f-hour">'+new Date(it.dt*1000).getHours()+':00</span><br>'+getIconHtml(it.weather[0].icon, 55)+'<br><b>'+Math.round(it.main.temp)+'°</b><br><span class="f-rain-info">☂️'+pop+'%</span></td>';
            }
            document.getElementById('hourly-table').innerHTML = hRow + "</tr>";
            
            // Tage
            var days = {};
            for(var j=0; j<f.list.length; j++) {
                var dN = new Date(f.list[j].dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
                if(!days[dN]) days[dN] = { max: -99, min: 99, icon: f.list[j].weather[0].icon, pop: 0 };
                if(f.list[j].main.temp > days[dN].max) days[dN].max = f.list[j].main.temp;
                if(f.list[j].pop > days[dN].pop) days[dN].pop = f.list[j].pop;
            }
            var dRow = "<tr>"; var c = 0;
            for(var day in days) {
                if(c > 0 && c < 6) {
                    dRow += '<td class="f-item"><span class="f-day-name">'+day+'</span>'+getIconHtml(days[day].icon, 60)+'<br><span class="f-temp-max">'+Math.round(days[day].max)+'°</span><br><span class="f-rain-info">☂️'+Math.round(days[day].pop * 100)+'%</span></td>';
                }
                c++;
            }
            document.getElementById('daily-table').innerHTML = dRow + "</tr>";
            
            var n3 = f.list[1];
            tickerData.forecast = "Vorschau " + new Date(n3.dt*1000).getHours() + " Uhr: " + n3.weather[0].description;
            
            var fullText = "+++ " + tickerData.main + " +++ " + tickerData.wind + " +++ " + tickerData.forecast + " +++ " + tickerData.astro + " +++";
            document.getElementById('info-ticker').innerHTML = fullText.toUpperCase();
        }
    };
    xhr.send();
}

function toggleSettings() { var s = document.getElementById('settings-overlay'); s.style.display = (s.style.display=='block')?'none':'block'; }
function saveAll() { localStorage.setItem('selectedCity', document.getElementById('city-input').value); localStorage.setItem('sleepStart', document.getElementById('s-start').value); localStorage.setItem('sleepEnd', document.getElementById('s-end').value); window.location.reload(); }

setInterval(updateClock, 1000); 
setInterval(fetchWeather, 300000);
updateClock();