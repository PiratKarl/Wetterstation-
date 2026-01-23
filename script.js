var API_KEY = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('selectedCity') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart') || '00:00';
var sEnd = localStorage.getItem('sleepEnd') || '05:30';

var colors = {
    "01d": "#FFD700", "01n": "#fff",
    "02d": "#fff", "02n": "#aaa",
    "03d": "#eee", "04d": "#888",
    "09d": "#00BFFF", "10d": "#1e90ff",
    "11d": "#FFFF00", "13d": "#F0F8FF", "50d": "#ccc"
};

function z(n) { return (n < 10 ? '0' : '') + n; }

function updateClock() {
    var now = new Date();
    var cur = z(now.getHours()) + ":" + z(now.getMinutes());
    document.getElementById('clock').innerText = cur;
    document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });
    
    var isS = (sStart < sEnd) ? (cur >= sStart && cur < sEnd) : (cur >= sStart || cur < sEnd);
    document.getElementById('night-overlay').style.display = isS ? 'block' : 'none';
    if(isS) document.getElementById('night-clock').innerText = cur;
}

function fetchWeather() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(city) + "&appid=" + API_KEY + "&units=metric&lang=de", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var data = JSON.parse(xhr.responseText);
            var t = data.main.temp;
            var f = data.main.feels_like;
            
            document.getElementById('city-title').innerText = data.name.toUpperCase();
            document.getElementById('temp-display').innerText = Math.round(t);
            
            var feels = document.getElementById('feels-like');
            feels.innerHTML = "GEFÜHLT " + Math.round(f) + "°";
            feels.className = (f > t) ? "warm" : "kalt";

            var iconCode = data.weather[0].icon;
            document.getElementById('main-icon').style.color = colors[iconCode] || "#fff";
            
            var off = data.timezone;
            document.getElementById('sunrise-val').innerText = z(new Date((data.sys.sunrise+off)*1000).getUTCHours()) + ":" + z(new Date((data.sys.sunrise+off)*1000).getUTCMinutes());
            document.getElementById('sunset-val').innerText = z(new Date((data.sys.sunset+off)*1000).getUTCHours()) + ":" + zero(new Date((data.sys.sunset+off)*1000).getUTCMinutes());

            // TICKER OHNE STATUS-ANZEIGE
            var wind = Math.round(data.wind.speed * 3.6);
            document.getElementById('info-ticker').innerHTML = "+++ WIND: " + wind + " KM/H +++ FEUCHTE: " + data.main.humidity + "% +++ LUFTDRUCK: " + data.main.pressure + " HPA +++ REGENCHANCE: " + (data.clouds.all) + "% +++";
            
            fetchForecast();
        }
    };
    xhr.send();
}

function zero(n) { return (n < 10 ? '0' : '') + n; }

function fetchForecast() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.openweathermap.org/data/2.5/forecast?q=" + encodeURIComponent(city) + "&appid=" + API_KEY + "&units=metric&lang=de", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var dataF = JSON.parse(xhr.responseText);
            
            // STUNDEN
            var hT = document.getElementById('hourly-table');
            var hRow = "<tr>";
            for(var i=0; i<5; i++) {
                var it = dataF.list[i];
                var c = colors[it.weather[0].icon] || "#fff";
                hRow += '<td class="f-item"><span class="f-label-hour">' + new Date(it.dt*1000).getHours() + ':00</span><i class="fa fa-cloud f-icon" style="color:' + c + '"></i><b>' + Math.round(it.main.temp) + '°</b></td>';
            }
            hT.innerHTML = hRow + "</tr>";
            
            // TAGE
            var dT = document.getElementById('daily-table');
            var days = {};
            for(var j=0; j<dataF.list.length; j++) {
                var d = new Date(dataF.list[j].dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
                if(!days[d]) days[d] = { max: -99, min: 99, icon: dataF.list[j].weather[0].icon };
                if(dataF.list[j].main.temp > days[d].max) days[d].max = dataF.list[j].main.temp;
                if(dataF.list[j].main.temp < days[d].min) days[d].min = dataF.list[j].main.temp;
            }
            var dRow = "<tr>";
            var count = 0;
            for(var day in days) {
                if(count > 0 && count < 6) {
                    var cd = colors[days[day].icon] || "#fff";
                    dRow += '<td class="f-item"><span class="f-label-day">' + day + '</span><i class="fa fa-cloud f-icon" style="color:' + cd + '"></i><span style="color:#ff4d4d; font-weight:bold; font-size:1.4rem;">' + Math.round(days[day].max) + '°</span> <span style="color:#00d9ff; font-weight:bold; font-size:1.2rem;">' + Math.round(days[day].min) + '°</span></td>';
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
