var API_KEY = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('selectedCity') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart') || '22:00';
var sEnd = localStorage.getItem('sleepEnd') || '06:00';

var timeOffset = 0; 
var lastSuccess = Date.now();
var isActivated = false;
var tickerData = { main: "", wind: "", uv: "UV: --", forecast: "", astro: "" };
var uvValue = 0;

function z(n) { return (n < 10 ? '0' : '') + n; }

function formatUnix(unix, timezone) {
    if (!unix) return "--:--";
    var d = new Date((unix + timezone) * 1000);
    return z(d.getUTCHours()) + ":" + z(d.getUTCMinutes());
}

function getWindDir(deg) {
    var dirs = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
}

function toggleSub(id) {
    var el = document.getElementById(id);
    var all = document.getElementsByClassName('sub-sect');
    var targetState = (el.style.display === 'block') ? 'none' : 'block';
    for(var i=0; i<all.length; i++) all[i].style.display = 'none';
    el.style.display = targetState;
}

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

function updateClock() {
    var now = new Date(Date.now() + timeOffset);
    var cur = z(now.getHours()) + ":" + z(now.getMinutes());
    document.getElementById('clock').innerText = cur;
    document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });
    var isS = (sStart < sEnd) ? (cur >= sStart && cur < sEnd) : (cur >= sStart || cur < sEnd);
    document.getElementById('night-overlay').style.display = isS ? 'block' : 'none';
    if(isS) document.getElementById('night-clock').innerText = cur;
}

function buildTicker() {
    var tEl = document.getElementById('info-ticker');
    var full = "+++ " + tickerData.main + " +++ " + tickerData.wind + " +++ " + tickerData.uv + " +++ " + tickerData.forecast + " +++ " + tickerData.astro + " +++";
    tEl.style.color = (uvValue > 5) ? "#ffcc00" : "#00ffcc";
    tEl.innerHTML = full.toUpperCase();
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
            
            var realTemp = Math.round(d.main.temp);
            var feelsTemp = Math.round(d.main.feels_like);
            document.getElementById('temp-display').innerText = realTemp;
            document.getElementById('city-title').innerText = d.name.toUpperCase();
            document.getElementById('main-icon-container').innerHTML = '<img src="' + d.weather[0].icon + '.gif" width="105">';
            
            var fl = document.getElementById('feels-like');
            fl.innerText = "GEFÜHLT " + feelsTemp + "°";
            if (feelsTemp > realTemp) fl.style.color = "#ff4d4d"; 
            else if (feelsTemp < realTemp) fl.style.color = "#00d9ff"; 
            else fl.style.color = "#ffffff";

            document.getElementById('sunrise-val').innerText = formatUnix(d.sys.sunrise, d.timezone);
            document.getElementById('sunset-val').innerText = formatUnix(d.sys.sunset, d.timezone);
            
            var jd = (Date.now() / 86400000) + 2440587.5;
            var ph = ((jd - 2451549.5) / 29.53) % 1;
            var ms = ["🌑 Neumond","🌙 Zun. Sichel","🌓 Halbmond","🌕 Vollmond","🌗 Halbmond","🌘 Abn. Sichel"];
            document.getElementById('moon-display').innerText = ms[Math.floor(ph * 6)] || ms[0];

            tickerData.main = d.weather[0].description + " (" + d.main.humidity + "% FEUCHTE)";
            tickerData.wind = "WIND: " + Math.round(d.wind.speed * 3.6) + " KM/H " + getWindDir(d.wind.deg);
            tickerData.astro = "DRUCK: " + d.main.pressure + " HPA";

            fetchUV(d.coord.lat, d.coord.lon);
            fetchForecast();
        }
    };
    xhr.send();
}

function fetchUV(lat, lon) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.openweathermap.org/data/2.5/uvi?lat="+lat+"&lon="+lon+"&appid="+API_KEY, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            uvValue = Math.round(JSON.parse(xhr.responseText).value);
            tickerData.uv = "UV-INDEX: " + uvValue;
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
                var pop = it.pop ? Math.round(it.pop * 100) : 0;
                hRow += '<td class="f-item"><span style="color:#00ffcc;font-size:17px;font-weight:bold;">'+new Date(it.dt*1000).getHours()+':00</span><br><img src="'+it.weather[0].icon+'.gif" width="45"><br><span class="f-temp-line">'+Math.round(it.main.temp)+'°</span><br><span style="color:#00d9ff;font-size:14px;">☂️'+pop+'%</span></td>';
            }
            document.getElementById('hourly-table').innerHTML = hRow + "</tr>";
            
            var days = {};
            for(var j=0; j<f.list.length; j++) {
                var dN = new Date(f.list[j].dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
                if(!days[dN]) days[dN] = { max: -99, min: 99, icon: f.list[j].weather[0].icon, pop: 0 };
                if(f.list[j].main.temp > days[dN].max) days[dN].max = f.list[j].main.temp;
                if(f.list[j].main.temp < days[dN].min) days[dN].min = f.list[j].main.temp;
                if(f.list[j].pop > days[dN].pop) days[dN].pop = f.list[j].pop;
            }
            var dRow = "<tr>"; var c = 0;
            for(var d in days) {
                if(c > 0 && c < 6) {
                    dRow += '<td class="f-item"><span class="f-day-name">'+d+'</span><img src="'+days[d].icon+'.gif" width="50"><br><span class="f-temp-line"><span style="color:#ff4d4d">'+Math.round(days[d].max)+'°</span> <span style="color:#00d9ff">'+Math.round(days[d].min)+'°</span></span><br><span style="color:#00d9ff;font-size:14px;">☂️'+Math.round(days[d].pop * 100)+'%</span></td>';
                }
                c++;
            }
            document.getElementById('daily-table').innerHTML = dRow + "</tr>";
            tickerData.forecast = "Vorschau " + new Date(f.list[1].dt*1000).getHours() + " Uhr: " + Math.round(f.list[1].main.temp) + "° (☂️" + Math.round(f.list[1].pop * 100) + "%)";
            buildTicker(); 
        }
    };
    xhr.send();
}

function toggleSettings() { 
    var s = document.getElementById('settings-overlay');
    s.style.display = (s.style.display==='block') ? 'none' : 'block';
    if(s.style.display === 'block') {
        document.getElementById('city-input').value = city;
        document.getElementById('s-start').value = sStart;
        document.getElementById('s-end').value = sEnd;
    }
}

function saveAll() { 
    localStorage.setItem('selectedCity', document.getElementById('city-input').value); 
    localStorage.setItem('sleepStart', document.getElementById('s-start').value); 
    localStorage.setItem('sleepEnd', document.getElementById('s-end').value); 
    window.location.reload(); 
}

setInterval(updateClock, 1000); 
setInterval(fetchWeather, 300000);
updateClock();