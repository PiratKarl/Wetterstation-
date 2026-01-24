var API_KEY = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('selectedCity') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart') || '22:00';
var sEnd = localStorage.getItem('sleepEnd') || '06:00';

var timeOffset = 0; 
var lastSuccess = Date.now();
var isActivated = false;
var tickerData = { main: "", wind: "", uv: "UV: --", forecast: "", astro: "" };

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
            document.getElementById('main-icon-container').innerHTML = '<img src="' + d.weather[0].icon + '.gif" width="100">';
            document.getElementById('feels-like').innerHTML = "GEFÜHLT " + Math.round(d.main.feels_like) + "°";
            
            document.getElementById('sunrise-val').innerText = formatUnix(d.sys.sunrise, d.timezone);
            document.getElementById('sunset-val').innerText = formatUnix(d.sys.sunset, d.timezone);
            
            tickerData.main = d.weather[0].description.toUpperCase() + " (" + d.main.humidity + "% FEUCHTE)";
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
            tickerData.uv = "UV-INDEX: " + Math.round(JSON.parse(xhr.responseText).value);
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
                hRow += '<td class="f-item"><span class="f-hour">'+new Date(it.dt*1000).getHours()+':00</span><br><img src="'+it.weather[0].icon+'.gif" width="45"><br><span class="f-temp-line">'+Math.round(it.main.temp)+'°</span><br><span class="f-rain-info">☂️'+pop+'%</span></td>';
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
            for(var day in days) {
                if(c > 0 && c < 6) {
                    dRow += '<td class="f-item"><span class="f-day-name">'+day+'</span><img src="'+days[day].icon+'.gif" width="48"><br><span class="f-temp-line"><span style="color:#ff4d4d">'+Math.round(days[day].max)+'°</span> <span style="color:#00d9ff">'+Math.round(days[day].min)+'°</span></span><br><span class="f-rain-info">☂️'+Math.round(days[day].pop * 100)+'%</span></td>';
                }
                c++;
            }
            document.getElementById('daily-table').innerHTML = dRow + "</tr>";
            
            tickerData.forecast = "VORSCHAU " + new Date(f.list[1].dt*1000).getHours() + " UHR: " + f.list[1].weather[0].description.toUpperCase() + " (☂️" + Math.round(f.list[1].pop * 100) + "%)";
            
            document.getElementById('info-ticker').innerHTML = "+++ " + tickerData.main + " +++ " + tickerData.wind + " +++ " + tickerData.uv + " +++ " + tickerData.forecast + " +++ " + tickerData.astro + " +++";
        }
    };
    xhr.send();
}

function toggleSettings() { var s = document.getElementById('settings-overlay'); s.style.display = (s.style.display=='block')?'none':'block'; }
function saveAll() { localStorage.setItem('selectedCity', document.getElementById('city-input').value); localStorage.setItem('sleepStart', document.getElementById('s-start').value); localStorage.setItem('sleepEnd', document.getElementById('s-end').value); window.location.reload(); }

setInterval(updateClock, 1000); 
setInterval(fetchWeather, 300000);
updateClock();