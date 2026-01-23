var API_KEY = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('selectedCity') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart') || '00:00';
var sEnd = localStorage.getItem('sleepEnd') || '05:30';

var timeOffset = 0; 
var lastSuccess = Date.now();

// --- BUNTE ICON MAPPER ---
function getIconTemplate(iconCode) {
    var mapping = {
        "01d": { icon: "fa-sun-o", color: "#FFD700" },
        "01n": { icon: "fa-moon-o", color: "#fff" },
        "02d": { icon: "fa-cloud", color: "#eee" },
        "02n": { icon: "fa-cloud", color: "#aaa" },
        "03d": { icon: "fa-cloud", color: "#888" },
        "04d": { icon: "fa-cloud", color: "#666" },
        "09d": { icon: "fa-tint", color: "#00BFFF" },
        "10d": { icon: "fa-umbrella", color: "#1e90ff" },
        "11d": { icon: "fa-bolt", color: "#FFFF00" },
        "13d": { icon: "fa-snowflake-o", color: "#F0F8FF" },
        "50d": { icon: "fa-bars", color: "#ccc" }
    };
    var res = mapping[iconCode] || { icon: "fa-cloud", color: "#fff" };
    return '<i class="fa ' + res.icon + '" style="color:' + res.color + '"></i>';
}

function z(n) { return (n < 10 ? '0' : '') + n; }

// Uhrzeit mit Offset korrigieren
function updateClock() {
    var now = new Date(Date.now() + timeOffset);
    var cur = z(now.getHours()) + ":" + z(now.getMinutes());
    document.getElementById('clock').innerText = cur;
    document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });
    
    var isS = (sStart < sEnd) ? (cur >= sStart && cur < sEnd) : (cur >= sStart || cur < sEnd);
    document.getElementById('night-overlay').style.display = isS ? 'block' : 'none';
    if(isS) document.getElementById('night-clock').innerText = cur;

    // Offline Warnung nach 15 Min
    document.getElementById('offline-warn').style.display = (Date.now() - lastSuccess > 900000) ? 'inline-block' : 'none';
}

function fetchWeather() {
    var v = document.getElementById('wake-1'); if(v) v.play(); // Wachmacher

    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(city) + "&appid=" + API_KEY + "&units=metric&lang=de", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var data = JSON.parse(xhr.responseText);
            lastSuccess = Date.now();

            // Zeit Sync
            var serverTimeStr = xhr.getResponseHeader('Date');
            if (serverTimeStr) {
                timeOffset = new Date(serverTimeStr).getTime() - Date.now();
            }

            document.getElementById('temp-display').innerText = Math.round(data.main.temp);
            document.getElementById('city-title').innerText = data.name.toUpperCase();
            document.getElementById('main-icon-container').innerHTML = getIconTemplate(data.weather[0].icon);

            var feels = document.getElementById('feels-like');
            feels.innerHTML = '<i class="fa fa-thermometer-half"></i> GEFÜHLT ' + Math.round(data.main.feels_like) + "°";
            feels.className = (data.main.feels_like > data.main.temp) ? "warm" : "kalt";

            var off = data.timezone;
            document.getElementById('sunrise-val').innerText = z(new Date((data.sys.sunrise+off)*1000).getUTCHours()) + ":" + z(new Date((data.sys.sunrise+off)*1000).getUTCMinutes());
            document.getElementById('sunset-val').innerText = z(new Date((data.sys.sunset+off)*1000).getUTCHours()) + ":" + z(new Date((data.sys.sunset+off)*1000).getUTCMinutes());
            
            var jd = (new Date().getTime() / 86400000) + 2440587.5;
            var ph = ((jd - 2451549.5) / 29.53) % 1;
            var moons = ["🌑 Neumond", "🌙 Zun. Sichel", "🌓 Halbmond", "🌕 Vollmond", "🌗 Halbmond", "🌘 Abn. Sichel"];
            document.getElementById('moon-display').innerText = moons[Math.floor(ph * 6)] || moons[0];
            
            document.getElementById('update-info').innerText = "UPD: " + z(new Date(Date.now() + timeOffset).getHours()) + ":" + z(new Date(Date.now() + timeOffset).getMinutes());
            
            var tip = data.main.temp < 7 ? "WINTERJACKE AN! ❄️" : (data.main.temp < 16 ? "ÜBERGANGSJACKE! 🧥" : "T-SHIRT WETTER! 👕");
            document.getElementById('info-ticker').innerHTML = "+++ " + tip + " +++ WIND: " + Math.round(data.wind.speed * 3.6) + " KM/H +++ FEUCHTE: " + data.main.humidity + "% +++";
            
            fetchForecast();
        }
    };
    xhr.send();
}

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
                hRow += '<td class="f-item"><span style="color:#888">' + new Date(it.dt*1000).getHours() + ':00</span><br><span style="font-size:2.5rem">' + getIconTemplate(it.weather[0].icon) + '</span><br><b>' + Math.round(it.main.temp) + '°</b></td>';
            }
            hT.innerHTML = hRow + "</tr>";
            
            var dT = document.getElementById('daily-table');
            var days = {};
            for(var j=0; j<dataF.list.length; j++) {
                var d = new Date(dataF.list[j].dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
                if(!days[d]) days[d] = { max: -99, min: 99, icon: dataF.list[j].weather[0].icon };
                if(dataF.list[j].main.temp > days[d].max) days[d].max = dataF.list[j].main.temp;
                if(dataF.list[j].main.temp < days[d].min) days[d].min = dataF.list[j].main.temp;
            }
            var dRow = "<tr>"; var count = 0;
            for(var day in days) {
                if(count > 0 && count < 6) {
                    dRow += '<td class="f-item"><span style="color:#00ffcc">' + day + '</span><br><span style="font-size:2.5rem">' + getIconTemplate(days[day].icon) + '</span><br><span style="color:#ff4d4d">' + Math.round(days[day].max) + '°</span> <span style="color:#00d9ff">' + Math.round(days[day].min) + '°</span></td>';
                }
                count++;
            }
            dT.innerHTML = dRow + "</tr>";
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
