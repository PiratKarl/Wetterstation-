/* --- AURA V23.1 CORE STABLE --- */

var currentVer = 23.1;
var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';

function z(n){return (n<10?'0':'')+n;}

function startApp() {
    document.getElementById('start-overlay').style.display = 'none';
    
    // Herzschlag-Video & Audio starten
    var heartbeat = document.getElementById('logo-heartbeat');
    var wA = document.getElementById('wake-aud');
    wA.src = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
    
    if(wA) wA.play();
    if(heartbeat) heartbeat.play();

    loadWeather();
    update();
    setInterval(update, 1000);           
    setInterval(loadWeather, 600000);    
}

function update() {
    var now = new Date();
    document.getElementById('clock').innerText = z(now.getHours())+':'+z(now.getMinutes());
    var d = ['SO','MO','DI','MI','DO','FR','SA'], m = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    document.getElementById('date').innerText = d[now.getDay()] + ". " + now.getDate() + ". " + m[now.getMonth()];
}

function loadWeather() {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.openweathermap.org/data/2.5/weather?q="+city+"&appid="+API+"&units=metric&lang=de", true);
    x.onload = function() {
        if (x.status === 200) {
            var d = JSON.parse(x.responseText);
            document.getElementById('city-name').innerText = d.name.toUpperCase();
            document.getElementById('temp').innerText = Math.round(d.main.temp) + "°";
            document.getElementById('w-icon').src = d.weather[0].icon + ".gif";
            document.getElementById('w-desc').innerText = d.weather[0].description.toUpperCase();
            
            var r = new Date((d.sys.sunrise + d.timezone - 3600)*1000), s = new Date((d.sys.sunset + d.timezone - 3600)*1000);
            document.getElementById('sunrise').innerText = z(r.getHours()) + ":" + z(r.getMinutes());
            document.getElementById('sunset').innerText = z(s.getHours()) + ":" + z(s.getMinutes());

            loadFore(d.coord.lat, d.coord.lon);
        }
    };
    x.send();
}

function loadWorldTicker() {
    var caps = ["Berlin", "Paris", "London", "Rom", "New York", "Tokio", "Sydney", "Dubai"];
    var wd = "+++ WILLKOMMEN ZURÜCK +++ STATION BRAUNSCHWEIG AKTUELL +++ ";
    var done = 0;
    caps.forEach(function(c) { 
        var r = new XMLHttpRequest();
        r.open("GET","https://api.openweathermap.org/data/2.5/weather?q="+c+"&appid="+API+"&units=metric",true);
        r.onload = function() {
            if(r.status===200) { 
                var j = JSON.parse(r.responseText);
                wd += " ◈ " + j.name.toUpperCase() + ": " + Math.round(j.main.temp) + "° "; 
            }
            done++; if(done === caps.length) document.getElementById('ticker-text').innerText = wd;
        };
        r.send(); 
    });
}

function loadFore(lat, lon) {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.openweathermap.org/data/2.5/forecast?lat="+lat+"&lon="+lon+"&appid="+API+"&units=metric&lang=de", true);
    x.onload = function() {
        if (x.status === 200) {
            var d = JSON.parse(x.responseText);
            var h = "";
            for(var i=0; i<5; i++) {
                var it = d.list[i], t = new Date(it.dt*1000);
                h += "<div class='f-item'><div>" + t.getHours() + "h</div><img class='f-icon' src='" + it.weather[0].icon + ".gif'><div>" + Math.round(it.main.temp) + "°</div></div>";
            }
            document.getElementById('hourly-row').innerHTML = h;

            var days = {};
            d.list.forEach(function(item) {
                var dStr = new Date(item.dt * 1000).toLocaleDateString('de-DE', {weekday: 'short'}).toUpperCase();
                if (!days[dStr]) { days[dStr] = { min: 100, max: -100, icon: item.weather[0].icon }; }
                if (item.main.temp_min < days[dStr].min) days[dStr].min = item.main.temp_min;
                if (item.main.temp_max > days[dStr].max) days[dStr].max = item.main.temp_max;
            });
            var dy = ""; var cnt = 0;
            for (var k in days) { if (cnt >= 5) break;
                dy += "<div class='f-item'><div>" + k + "</div><img class='f-icon' src='" + days[k].icon + ".gif'><div>" + Math.round(days[k].max) + "° / " + Math.round(days[k].min) + "°</div></div>";
                cnt++;
            }
            document.getElementById('daily-row').innerHTML = dy;
            loadWorldTicker();
        }
    };
    x.send();
}

function openMenu() { document.getElementById('settings-overlay').style.display='block'; }
function closeMenu() { document.getElementById('settings-overlay').style.display='none'; }
function save() { 
    localStorage.setItem('city', document.getElementById('city-in').value); 
    location.reload(); 
}