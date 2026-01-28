var currentVer = 22.6;
var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';
var sStart = localStorage.getItem('t-start'), sEnd = localStorage.getItem('t-end');

function z(n){return (n<10?'0':'')+n;}

function startApp() {
    document.getElementById('start-overlay').style.display = 'none';
    var de = document.documentElement;
    if (de.requestFullscreen) { de.requestFullscreen(); } else if (de.webkitRequestFullscreen) { de.webkitRequestFullscreen(); }
    var heartbeat = document.getElementById('logo-heartbeat');
    var wA = document.getElementById('wake-aud');
    wA.src = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
    wA.play(); if(heartbeat) { heartbeat.play(); }
    loadWeather(); update(); setInterval(update, 1000); setInterval(loadWeather, 600000);
}

function update() {
    var now = new Date();
    document.getElementById('clock').innerText = z(now.getHours())+':'+z(now.getMinutes());
    var d = ['SO','MO','DI','MI','DO','FR','SA'], m = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    document.getElementById('date').innerText = d[now.getDay()] + ". " + now.getDate() + ". " + m[now.getMonth()];
    // Sleep Logik...
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
            document.getElementById('w-feels').innerText = "GEFÜHLT " + Math.round(d.main.feels_like) + "°";
            
            var now = new Date();
            document.getElementById('last-update').innerText = z(now.getDate()) + "." + z(now.getMonth()+1) + "." + now.getFullYear().toString().substr(-2) + " um " + z(now.getHours()) + ":" + z(now.getMinutes()) + " Uhr";
            // Restliche Berechnungen (Mond, Astro)...
            loadFore(d.coord.lat, d.coord.lon, d.main.temp);
            checkWarnings(d.coord.lat, d.coord.lon);
        }
    };
    x.send();
}

function loadFore(lat, lon, ct) {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.openweathermap.org/data/2.5/forecast?lat="+lat+"&lon="+lon+"&appid="+API+"&units=metric&lang=de", true);
    x.onload = function() {
        if (x.status === 200) {
            var d = JSON.parse(x.responseText);
            document.getElementById('pop').innerText = Math.round(d.list[0].pop * 100)+"%";
            document.getElementById('clothing').innerText = (d.list[0].pop > 0.3) ? "REGENSCHIRM" : (ct < 7 ? "WINTERJACKE" : "T-SHIRT");
            
            var h = "";
            for(var i=0; i<5; i++) {
                var it = d.list[i], t = new Date(it.dt*1000);
                h += `<div class='f-item'><div class='f-head'>${t.getHours()} Uhr</div><img class='f-icon' src='${it.weather[0].icon}.gif'><div class='f-val'>${Math.round(it.main.temp)}°</div></div>`;
            }
            document.getElementById('hourly-row').innerHTML = h;
            // Tagesvorhersage Logik...
        }
    };
    x.send();
}
// Hilfsfunktionen (showSub, save, checkWarnings, loadWorldTicker)...